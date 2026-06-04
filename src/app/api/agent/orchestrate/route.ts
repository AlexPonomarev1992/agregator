import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { apiSuccess, apiError } from '@/lib/api/response';
import { getModelsByCategory } from '@/lib/models';
import type { ModelCategory, ModelDefinition, ModeDefinition } from '@/lib/models';
import { classifyIntent, extractParameters, type GenMode } from '@/lib/api/orchestrator';
import { z } from 'zod';

const schema = z.object({
  prompt: z.string().min(1).max(5000),
  context: z
    .object({
      lastGeneration: z
        .object({
          mode: z.enum(['video', 'image', 'music', 'tts']),
          prompt: z.string().max(5000).default(''),
          hasImage: z.boolean().default(false),
        })
        .optional(),
    })
    .optional(),
});

// GenMode → категория модели в реестре
const MODE_TO_CATEGORY: Record<GenMode, ModelCategory> = {
  music: 'music',
  video: 'video',
  image: 'image',
  tts: 'audio',
};

// GenMode → желаемый mode модели (фоллбэк — первый текстовый mode)
const MODE_TO_MODEL_MODE: Record<GenMode, string> = {
  music: 'generate',
  video: 't2v',
  image: 't2i',
  tts: 'tts',
};

// GenMode → тип медиа для UI
const MODE_TO_MEDIA: Record<GenMode, 'video' | 'image' | 'audio'> = {
  music: 'audio',
  video: 'video',
  image: 'image',
  tts: 'audio',
};

const UPLOAD_TYPES = new Set([
  'imageUpload',
  'audioUpload',
  'videoUpload',
  'maskUpload',
  'dialogueList',
]);

/** Режим без обязательных загрузок (его можно запустить из чата без файлов). */
function isTextMode(m: ModeDefinition): boolean {
  return !m.parameters.some((p) => p.required && UPLOAD_TYPES.has(p.type));
}

/** Выбирает text-only режим модели: желаемый → любой текстовый → первый. */
function pickTextMode(model: ModelDefinition, desired: string): ModeDefinition | null {
  return (
    model.modes.find((m) => m.id === desired && isTextMode(m)) ??
    model.modes.find(isTextMode) ??
    model.modes.find((m) => m.id === desired) ??
    model.modes[0] ??
    null
  );
}

export type OrchestrateResponse =
  | {
      // 'generate' — новая генерация; 'edit' — доработка предыдущей (клиент
      // подставит прошлый результат как референс + parentGenerationId).
      action: 'generate' | 'edit';
      mode: GenMode;
      modelSlug: string;
      modelMode: string;
      mediaType: 'video' | 'image' | 'audio';
      prompt: string;
      parameters: Record<string, unknown>;
    }
  | { action: 'clarify'; question: string }
  | { action: 'notice'; message: string }
  | { action: 'chat' };

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Некорректный JSON', 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Некорректные данные', 400);
  }

  // 1. Kimi определяет намерение и переформулирует промпт (с учётом контекста)
  const intent = await classifyIntent(parsed.data.prompt, parsed.data.context);
  console.log(
    '[orchestrate] action=%s hasContext=%s%s',
    intent.action,
    Boolean(parsed.data.context?.lastGeneration),
    'mode' in intent ? ` mode=${intent.mode}` : ''
  );

  if (intent.action === 'chat') {
    return apiSuccess<OrchestrateResponse>({ action: 'chat' });
  }

  // Уточняющий вопрос — непонятно, править прошлое или генерировать новое
  if (intent.action === 'clarify') {
    return apiSuccess<OrchestrateResponse>({ action: 'clarify', question: intent.question });
  }

  // STT пока без пайплайна (нужен загруженный аудиофайл) — честно сообщаем
  if (intent.action === 'stt') {
    return apiSuccess<OrchestrateResponse>({
      action: 'notice',
      message:
        'Распознавание речи (STT) работает с загруженным аудио или видео — текстового промпта тут недостаточно. Загрузите файл в студии транскрипции, когда она будет доступна.',
    });
  }

  // 2. Подбираем модель нужной категории.
  //    Изображения — ПРИНУДИТЕЛЬНО nano-banana-2 (пока клиент не выбрал иное).
  //    Остальные категории — пока хаотично.
  //    TODO: заменить на полноценную логику оркестрации (приоритет, цена, качество).
  const category = MODE_TO_CATEGORY[intent.mode];
  const candidates = getModelsByCategory(category);
  if (candidates.length === 0) {
    return apiSuccess<OrchestrateResponse>({ action: 'chat' });
  }
  const model =
    intent.mode === 'image'
      ? candidates.find((m) => m.slug === 'nano-banana-2') ??
        candidates[Math.floor(Math.random() * candidates.length)]
      : candidates[Math.floor(Math.random() * candidates.length)];

  // 3. Текстовый режим модели (без обязательных загрузок)
  const modeDef = pickTextMode(model, MODE_TO_MODEL_MODE[intent.mode]);
  if (!modeDef) {
    return apiSuccess<OrchestrateResponse>({ action: 'chat' });
  }

  // 4. Извлекаем структурированные параметры под выбранную модель
  const parameters = await extractParameters(
    modeDef.parameters,
    parsed.data.prompt,
    intent.prompt
  );

  return apiSuccess<OrchestrateResponse>({
    action: intent.action, // 'generate' | 'edit'
    mode: intent.mode,
    modelSlug: model.slug,
    modelMode: modeDef.id,
    mediaType: MODE_TO_MEDIA[intent.mode],
    prompt: intent.prompt,
    parameters,
  });
}
