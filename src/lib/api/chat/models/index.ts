/**
 * Реестр chat-моделей.
 *
 * Чтобы добавить модель — создать рядом файл <slug>.ts с export ModelConfig,
 * сюда добавить import + строку в массив MODELS.
 * Чтобы убрать — удалить файл и строку из MODELS.
 */

import type { ModelConfig } from '../types';

import { gpt55 } from './gpt-5-5';
import { claudeOpus48 } from './claude-opus-4-8';
import { geminiFlash35 } from './gemini-flash-3-5';

export const MODELS: ModelConfig[] = [gpt55, claudeOpus48, geminiFlash35];

export const DEFAULT_MODEL: ModelConfig = gpt55;

/**
 * Резолвит запрошенный UI id в конфиг модели.
 *   1. Точное совпадение с config.id.
 *   2. Любой из config.aliases.
 *   3. Эвристика по подстроке (claude → claudeOpus48, gemini → geminiFlash35).
 *   4. DEFAULT_MODEL (gpt55).
 */
export function resolveModel(requested: string): ModelConfig {
  const q = requested.trim().toLowerCase();

  for (const m of MODELS) {
    if (m.id.toLowerCase() === q) return m;
  }
  for (const m of MODELS) {
    if (m.aliases?.some((a) => a.toLowerCase() === q)) return m;
  }
  if (q.includes('claude')) return claudeOpus48;
  if (q.includes('gemini') || q.includes('google')) return geminiFlash35;
  return DEFAULT_MODEL;
}
