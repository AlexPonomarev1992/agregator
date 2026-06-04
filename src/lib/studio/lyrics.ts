/**
 * Генерация и правка ТЕКСТА песни через LLM (Kimi).
 *
 * Используется интерактивным музыкальным флоу: сначала показываем пользователю
 * текст, даём отредактировать (вручную или попросив переписать конкретную часть
 * с памятью контекста), и только после подтверждения генерируем музыку.
 *
 * KIE generate-lyrics не умеет «поправить второй куплет с учётом остального»,
 * поэтому здесь — LLM. Возвращаем структуру { title, text }.
 */

import { collectChatText } from '@/lib/api/chat';

const LYRICS_MODEL = 'kimi-k2-6';

export interface Lyrics {
  text: string;
  title?: string;
  /** Suno-безопасный стиль (жанр/настроение/инструменты, без имён артистов). */
  style?: string;
}

/** Достаёт первый JSON-объект из текста (срезает markdown-обёртки, болтовню). */
function extractJson(text: string): Record<string, unknown> | null {
  let t = text.trim();
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(t.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parseLyrics(raw: string, fallbackText: string): Lyrics {
  const parsed = extractJson(raw);
  const text =
    parsed && typeof parsed.text === 'string' && parsed.text.trim()
      ? parsed.text.trim()
      : fallbackText.trim();
  const title =
    parsed && typeof parsed.title === 'string' && parsed.title.trim()
      ? parsed.title.trim()
      : undefined;
  const style =
    parsed && typeof parsed.style === 'string' && parsed.style.trim()
      ? parsed.style.trim()
      : undefined;
  return { text, title, style };
}

const FORMAT_RULES = `Структурируй текст тегами секций: [Verse], [Chorus], [Bridge], [Outro] (можно с номерами). Пиши на языке запроса пользователя (по умолчанию русский). Без пояснений и преамбул.

Верни СТРОГО один JSON-объект, без markdown:
{"title":"<короткое название трека>","style":"<стиль>","text":"<полный текст песни с тегами секций и переносами строк>"}

ВАЖНО про "style": это описание музыкального стиля для генератора (жанр, настроение, темп, инструменты, тип вокала) — на английском, через запятую, 3-8 тегов. ЗАПРЕЩЕНО упоминать имена реальных артистов, групп, названия песен или брендов (генератор отклоняет такие запросы из-за копирайта). Если пользователь ссылается на артиста/трек («в стиле X», «как песня Y») — ПЕРЕВЕДИ это в описательные музыкальные характеристики (например, «Ludovico Einaudi - Experience» → "cinematic neoclassical piano, emotional, slow tempo, strings, instrumental").`;

/** Генерирует текст песни + Suno-безопасный стиль по описанию. */
export async function generateLyrics(description: string): Promise<Lyrics> {
  const raw = await collectChatText({
    model: LYRICS_MODEL,
    messages: [
      {
        role: 'system',
        content: `Ты — профессиональный автор песен. По описанию напиши цельный, певучий текст песни (куплеты + припев) и подбери музыкальный стиль. ${FORMAT_RULES}`,
      },
      { role: 'user', content: description },
    ],
    temperature: 0.8,
    maxTokens: 1500,
  });
  return parseLyrics(raw, raw);
}

/**
 * Правит существующий текст по инструкции пользователя, СОХРАНЯЯ остальное.
 * Контекст = текущий текст целиком (память места правки).
 */
export async function editLyrics(
  current: string,
  instruction: string
): Promise<Lyrics> {
  const raw = await collectChatText({
    model: LYRICS_MODEL,
    messages: [
      {
        role: 'system',
        content: `Ты — редактор текстов песен. Тебе дают ТЕКУЩИЙ текст песни и инструкцию по правке. Измени ТОЛЬКО то, что просит пользователь (например, конкретный куплет или припев), а остальной текст сохрани без изменений. ${FORMAT_RULES}`,
      },
      {
        role: 'user',
        content: `ТЕКУЩИЙ ТЕКСТ:\n${current}\n\nИНСТРУКЦИЯ ПО ПРАВКЕ:\n${instruction}`,
      },
    ],
    temperature: 0.7,
    maxTokens: 1500,
  });
  return parseLyrics(raw, current);
}
