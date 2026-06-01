import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { apiSuccess, apiError } from '@/lib/api/response';
import { getModelsByPriority, getModelsByCategory } from '@/lib/models';
import type { AgentMode } from '@/lib/stores/agent-store';
import { z } from 'zod';

const routeIntentSchema = z.object({
  prompt: z.string().min(1).max(5000),
  mode: z.enum(['chat', 'video', 'image', 'music', 'tts', 'utility']),
});

// Маппинг режима агента → категория модели
const MODE_TO_CATEGORY: Record<Exclude<AgentMode, 'chat'>, 'video' | 'image' | 'audio' | 'music'> = {
  video: 'video',
  image: 'image',
  music: 'music',
  tts: 'audio',
  // utility — это набор готовых инструментов-пресетов;
  // intent-роутинг по нему отдаёт «open_studio» с дефолтом video.
  utility: 'video',
};

// Маппинг режима → дефолтный mode модели
const MODE_TO_MODEL_MODE: Record<Exclude<AgentMode, 'chat'>, string> = {
  video: 't2v',
  image: 't2i',
  music: 'generate',
  tts: 'tts',
  utility: 't2v',
};

export type RouteIntentResponse =
  | {
      action: 'open_studio';
      modelSlug: string;
      mode: string;
      prefilledParams: Record<string, unknown>;
    }
  | { action: 'continue_chat' };

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Некорректный JSON', 400);
  }

  const parsed = routeIntentSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Некорректные данные', 400);
  }

  const { prompt, mode } = parsed.data;

  // Чат — просто продолжаем
  if (mode === 'chat') {
    const result: RouteIntentResponse = { action: 'continue_chat' };
    return apiSuccess(result);
  }

  // Для остальных режимов — подбираем топовую модель нужной категории
  const category = MODE_TO_CATEGORY[mode];
  const models = getModelsByCategory(category).filter((m) => m.priority === 1);

  // Если нет приоритета 1 — берём любую
  const topModels = models.length > 0 ? models : getModelsByCategory(category);
  const targetModel = topModels[0] ?? getModelsByPriority(1)[0];

  if (!targetModel) {
    return apiError('NOT_FOUND', 'Нет доступных моделей для данного режима', 404);
  }

  // Определяем mode модели: если указанный mode есть в модели — используем, иначе берём первый
  const desiredModelMode = MODE_TO_MODEL_MODE[mode];
  const modelMode = targetModel.modes.find((m) => m.id === desiredModelMode)?.id ?? targetModel.modes[0]?.id ?? desiredModelMode;

  const result: RouteIntentResponse = {
    action: 'open_studio',
    modelSlug: targetModel.slug,
    mode: modelMode,
    prefilledParams: {
      prompt,
    },
  };

  return apiSuccess(result);
}
