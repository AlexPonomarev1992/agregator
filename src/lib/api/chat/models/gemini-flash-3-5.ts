import type { ModelConfig } from '../types';
import {
  buildOpenAICompatBody,
  parseOpenAICompatDelta,
} from '../families/openai-chat-completions';

/**
 * Gemini Flash 3.5 на KIE.
 *
 * Endpoint: POST /gemini/v1/chat/completions (OpenAI-совместимый формат).
 *
 * ВАЖНО: точный id модели на моём тестовом ключе не подтверждён —
 * endpoint существует, но все варианты ниже отдавали
 * {"code":422,"msg":"The model is not supported"} (возможно, доступ для ключа
 * не выдан, либо реальный slug отличается). Если будет другой id —
 * поменять только строку в поле `id`.
 *
 * Кандидаты, которые имеет смысл попробовать первыми (через CLI):
 *   gemini-3-flash, gemini-3.5-flash, gemini-flash-3.5, gemini-3.0-flash
 */
export const geminiFlash35: ModelConfig = {
  id: 'gemini-3-flash',
  displayName: 'Gemini Flash 3.5',
  aliases: [
    'gemini',
    'gemini-flash',
    'gemini-3.5-flash',
    'gemini-flash-3.5',
    'gemini-flux-3.5',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'google/gemini-flash-3.5',
  ],
  endpoint: '/gemini/v1/chat/completions',
  buildBody: (msgs, opts) => buildOpenAICompatBody('gemini-3-flash', msgs, opts),
  parseDelta: parseOpenAICompatDelta,
};
