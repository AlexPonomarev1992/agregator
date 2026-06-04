/**
 * Kimi-оркестратор намерений.
 *
 * Анализирует сообщение пользователя из текстового чата и решает:
 *   - обычный разговор/вопрос/написание текста → action: 'chat'
 *   - запрос на ГЕНЕРАЦИЮ медиа (музыка/видео/картинка/озвучка) →
 *     action: 'generate' + целевой режим + качественный промпт под модель
 *   - распознавание речи (STT) → action: 'stt' (пока без пайплайна — нужен файл)
 *
 * Выбор конкретной модели здесь НЕ делается — это задача роутера в
 * src/app/api/agent/orchestrate. Извлечение параметров под выбранную модель —
 * extractParameters() (второй, schema-aware вызов Kimi).
 */

import { collectChatText } from '@/lib/api/chat';
import { buildZodSchema } from '@/lib/models';
import type { ParameterDef, SelectOption } from '@/lib/models';

/** Режимы генерации, которые понимает оркестратор. */
export type GenMode = 'video' | 'image' | 'music' | 'tts';

/** Контекст последней генерации в этом чате — для follow-up правок. */
export interface LastGenerationContext {
  mode: GenMode;
  /** Переформулированный промпт предыдущей генерации (может быть пустым). */
  prompt: string;
  /** Есть ли готовый результат-изображение, которое можно отредактировать. */
  hasImage: boolean;
}

export interface OrchestratorContext {
  lastGeneration?: LastGenerationContext;
}

export type OrchestratorIntent =
  | { action: 'chat' }
  | { action: 'generate'; mode: GenMode; prompt: string }
  // Правка/доработка предыдущей генерации (тот же mode, prompt — описание изменения).
  | { action: 'edit'; mode: GenMode; prompt: string }
  // Уточняющий вопрос, когда непонятно: править прошлое или создавать новое.
  | { action: 'clarify'; question: string }
  | { action: 'stt' };

const ORCHESTRATOR_MODEL = 'kimi-k2-6';

// ─── Шаг 1: классификация намерения ───────────────────────────────────────────

const CLASSIFY_PROMPT = `Ты — роутер намерений в AI-платформе VibeLab. Пойми, чего хочет пользователь, и верни СТРОГО один JSON-объект, без markdown, без текста до/после.

Формат: {"action":"generate"|"chat"|"stt","mode":"music"|"video"|"image"|"tts"|null,"prompt":"<строка>"}

Классификация:
- action="generate" — пользователь просит СОЗДАТЬ медиа:
  - "music"  — трек, песня, музыка, бит, мелодия, саундтрек ("напиши трек", "сделай песню");
  - "video"  — видео, ролик, клип, анимация ("сгенерируй видео", "сделай клип");
  - "image"  — изображение, картинка, фото, арт, логотип, иллюстрация ("нарисуй", "сделай картинку");
  - "tts"    — синтез речи: озвучить ТЕКСТ голосом ("озвучь", "прочитай вслух", "сделай голосовое").
- action="stt" — распознавание/транскрипция речи ИЗ аудио в текст ("распознай речь", "переведи аудио в текст", "сделай субтитры"). mode=null.
- action="chat" — всё остальное: вопросы, разговор, объяснения, код, написание ТЕКСТА (статья, пост, письмо), перевод. mode=null, prompt="".

Если action="generate":
- "prompt" — переработанный детальный промпт под генеративную модель нужного типа:
  - music: жанр, настроение, темп, инструменты, вокал/инструментал, структура;
  - image: сцена, объекты, стиль, композиция, освещение, детализация;
  - video: сцена, движение, камера, атмосфера;
  - tts: prompt — это сам текст, который надо произнести (без описаний).
- Язык промпта = язык пользователя (по умолчанию русский). Без преамбул вроде "вот промпт".

Верни ТОЛЬКО JSON.`;

const MODE_LABEL_RU: Record<GenMode, string> = {
  image: 'изображение',
  video: 'видео',
  music: 'музыка',
  tts: 'озвучка',
};

/**
 * Системный промпт классификатора. При наличии контекста прошлой генерации
 * добавляет действия edit/clarify (follow-up правки и уточняющие вопросы).
 */
function buildClassifyPrompt(ctx?: OrchestratorContext): string {
  const last = ctx?.lastGeneration;
  if (!last) return CLASSIFY_PROMPT;

  const prev = last.prompt.trim();
  const prevLine = prev ? `Предыдущий промпт: "${prev.slice(0, 500)}".` : 'Текст предыдущего промпта неизвестен.';
  const imageLine = last.hasImage
    ? 'Есть готовый результат-изображение, его можно отредактировать как референс.'
    : 'Готового результата пока нет.';

  return `${CLASSIFY_PROMPT}

────────
КОНТЕКСТ ДИАЛОГА: только что была генерация (${MODE_LABEL_RU[last.mode]}). ${prevLine} ${imageLine}

Поэтому формат расширяется до:
{"action":"generate"|"edit"|"chat"|"clarify"|"stt","mode":"music"|"video"|"image"|"tts"|null,"prompt":"<строка>","question":"<строка>"}

Дополнительные действия (доступны ТОЛЬКО при наличии контекста выше):
- action="edit" — пользователь хочет ИЗМЕНИТЬ/доработать ПРОШЛЫЙ результат, а не создать новый ("сделай теперь зиму", "теперь ночь", "добавь кота", "сделай ярче", "убери фон", "в стиле акварели"). mode = ${last.mode} (как у прошлой генерации). В "prompt" опиши КОРОТКО только изменение (что добавить/поменять), на языке пользователя. question="".
- action="clarify" — используй, ТОЛЬКО если из формулировки НЕ ЯСНО, хочет ли пользователь доработать прошлый результат ИЛИ создать новый независимый. В "question" задай короткий уточняющий вопрос на языке пользователя, например: "Добавить зиму к прошлой картинке или сделать новую?". mode=null, prompt="".

Решай по смыслу: если есть явная отсылка к прошлому ("теперь", "сделай его", "на этой", "поменяй") — это edit; если описан новый самостоятельный объект — generate; сомнительно — clarify.

Верни ТОЛЬКО JSON.`;
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

const VALID_MODES: GenMode[] = ['video', 'image', 'music', 'tts'];

/**
 * Классифицирует намерение пользователя через Kimi.
 * При наличии контекста прошлой генерации умеет возвращать edit/clarify.
 * При любой ошибке/неоднозначности безопасно падает в обычный чат.
 */
export async function classifyIntent(
  prompt: string,
  ctx?: OrchestratorContext
): Promise<OrchestratorIntent> {
  const last = ctx?.lastGeneration;

  let raw = '';
  try {
    raw = await collectChatText({
      model: ORCHESTRATOR_MODEL,
      messages: [
        { role: 'system', content: buildClassifyPrompt(ctx) },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
      maxTokens: 800,
    });
  } catch {
    return { action: 'chat' };
  }

  const parsed = extractJson(raw);
  if (!parsed) return { action: 'chat' };

  if (parsed.action === 'stt') return { action: 'stt' };

  // Уточняющий вопрос — только при наличии контекста и непустого вопроса.
  if (parsed.action === 'clarify') {
    const question = typeof parsed.question === 'string' ? parsed.question.trim() : '';
    if (last && question) return { action: 'clarify', question };
    return { action: 'chat' };
  }

  // Правка прошлой генерации — только при наличии контекста.
  if (parsed.action === 'edit') {
    const editPrompt = typeof parsed.prompt === 'string' ? parsed.prompt.trim() : '';
    if (last && editPrompt) {
      // mode из ответа, иначе — mode прошлой генерации.
      const m = VALID_MODES.includes(parsed.mode as GenMode)
        ? (parsed.mode as GenMode)
        : last.mode;
      return { action: 'edit', mode: m, prompt: editPrompt };
    }
    // Нет контекста/промпта — деградируем в обычную генерацию ниже, если получится.
  }

  if (parsed.action !== 'generate' && parsed.action !== 'edit') return { action: 'chat' };

  const mode = parsed.mode as GenMode;
  const rewritten = typeof parsed.prompt === 'string' ? parsed.prompt.trim() : '';
  if (!VALID_MODES.includes(mode) || !rewritten) return { action: 'chat' };

  return { action: 'generate', mode, prompt: rewritten };
}

// ─── Шаг 2: извлечение параметров под конкретную модель ───────────────────────

const ENUM_TYPES = new Set([
  'select',
  'mode',
  'aspectRatio',
  'duration',
  'resolution',
  'styleSelect',
  'colorPalette',
  'voicePicker',
]);
const UPLOAD_TYPES = new Set([
  'imageUpload',
  'audioUpload',
  'videoUpload',
  'maskUpload',
  'dialogueList',
]);

/** Параметры, которые можно заполнить из текстового запроса (без загрузок). */
function fillable(params: ParameterDef[]): ParameterDef[] {
  return params.filter((p) => !UPLOAD_TYPES.has(p.type));
}

/** Ключ основного текстового поля (куда кладём переформулированный промпт). */
function mainTextKey(params: ParameterDef[]): string {
  if (params.some((p) => p.key === 'prompt')) return 'prompt';
  if (params.some((p) => p.key === 'text')) return 'text';
  const longtext = params.find((p) => p.type === 'longtext');
  return longtext?.key ?? 'prompt';
}

/** Человекочитаемое описание параметров для Kimi. */
function buildParamSpec(params: ParameterDef[], skipKey: string): string {
  const lines: string[] = [];
  for (const p of fillable(params)) {
    if (p.key === skipKey) continue;
    let constraint = '';
    if (ENUM_TYPES.has(p.type) && p.options?.length) {
      constraint = `допустимые значения: ${p.options.map((o: SelectOption) => o.value).join(', ')}`;
    } else if (p.type === 'slider' || p.type === 'number') {
      constraint = `число${p.min != null ? ` от ${p.min}` : ''}${p.max != null ? ` до ${p.max}` : ''}`;
    } else if (p.type === 'numberOfImages') {
      constraint = 'целое число от 1 до 4';
    } else if (p.type === 'switch') {
      constraint = 'true или false';
    } else if (p.type === 'tagInput') {
      constraint = 'массив строк (макс. 8)';
    } else if (p.type === 'text' || p.type === 'longtext') {
      constraint = 'строка';
    }
    const def =
      p.defaultValue !== undefined ? ` (по умолчанию: ${String(p.defaultValue)})` : '';
    lines.push(`- ${p.key} (${p.label}) — ${constraint}${def}`);
  }
  return lines.join('\n');
}

/** Жёсткая санитизация значения параметра под его определение. Невалидное → undefined. */
function sanitizeValue(p: ParameterDef, value: unknown): unknown {
  if (value == null) return undefined;

  if (ENUM_TYPES.has(p.type)) {
    const allowed = (p.options ?? []).map((o) => o.value);
    // Kimi иногда отдаёт число (duration: 10) — приводим к строке enum.
    const v = typeof value === 'number' ? String(value) : value;
    return typeof v === 'string' && allowed.includes(v) ? v : undefined;
  }
  if (p.type === 'slider' || p.type === 'number' || p.type === 'numberOfImages') {
    let n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return undefined;
    if (p.type === 'numberOfImages') n = Math.min(4, Math.max(1, Math.round(n)));
    if (typeof p.min === 'number') n = Math.max(p.min, n);
    if (typeof p.max === 'number') n = Math.min(p.max, n);
    return n;
  }
  if (p.type === 'switch') {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  }
  if (p.type === 'tagInput') {
    const arr = Array.isArray(value)
      ? value
      : typeof value === 'string'
        ? value.split(',')
        : [];
    const tags = arr.map((t) => String(t).trim()).filter(Boolean).slice(0, 8);
    return tags.length ? tags : undefined;
  }
  if (p.type === 'text' || p.type === 'longtext') {
    if (typeof value !== 'string') return undefined;
    const s = p.maxLength ? value.slice(0, p.maxLength) : value;
    return s.trim() || undefined;
  }
  return undefined;
}

/**
 * Извлекает структурированные параметры под (модель, mode) из запроса пользователя.
 * Всегда кладёт переформулированный промпт в основное текстовое поле.
 * Результат гарантированно проходит валидацию студии (иначе — минимальный набор).
 */
export async function extractParameters(
  params: ParameterDef[],
  userRequest: string,
  rewrittenPrompt: string
): Promise<Record<string, unknown>> {
  const key = mainTextKey(params);
  const fallback: Record<string, unknown> = { [key]: rewrittenPrompt };

  const spec = buildParamSpec(params, key);
  // Если заполнять нечего кроме промпта — не дёргаем Kimi второй раз.
  if (!spec.trim()) return fallback;

  let raw = '';
  try {
    raw = await collectChatText({
      model: ORCHESTRATOR_MODEL,
      messages: [
        {
          role: 'system',
          content: `Ты извлекаешь параметры генерации из запроса пользователя. Верни СТРОГО один JSON-объект только с теми ключами, значения которых явно следуют из запроса. Если параметр не упомянут — не включай его (сработает значение по умолчанию). Для перечислений используй ТОЛЬКО допустимые значения. Без markdown и пояснений.\n\nПараметры:\n${spec}`,
        },
        { role: 'user', content: userRequest },
      ],
      temperature: 0,
      maxTokens: 500,
    });
  } catch {
    return fallback;
  }

  const parsed = extractJson(raw);
  if (!parsed) return fallback;

  const out: Record<string, unknown> = {};
  for (const p of fillable(params)) {
    if (p.key === key) continue;
    if (!(p.key in parsed)) continue;
    const clean = sanitizeValue(p, parsed[p.key]);
    if (clean !== undefined) out[p.key] = clean;
  }
  out[key] = rewrittenPrompt;

  // Финальная страховка: всё должно пройти схему студии.
  const check = buildZodSchema(params).safeParse(out);
  return check.success ? out : fallback;
}
