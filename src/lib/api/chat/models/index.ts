/**
 * Реестр всех известных chat-моделей.
 *
 * Чтобы добавить новую модель — создать рядом файл <slug>.ts с экспортом
 * ModelConfig и добавить две строчки: import + push в MODELS.
 * Чтобы убрать — удалить файл и убрать из массива.
 */

import type { ModelConfig } from '../types';

import { gpt55 } from './gpt-5-5';
import { claudeSonnet45 } from './claude-sonnet-4-5';
import { claudeOpus45 } from './claude-opus-4-5';
import { claudeOpus47 } from './claude-opus-4-7';
import { claudeHaiku45 } from './claude-haiku-4-5';

export const MODELS: ModelConfig[] = [
  gpt55,
  claudeSonnet45,
  claudeOpus45,
  claudeOpus47,
  claudeHaiku45,
];

export const DEFAULT_MODEL: ModelConfig = gpt55;

/**
 * Резолвит запрошенный пользователем id в конфиг модели.
 * Поиск:
 *   1. По точному совпадению с config.id.
 *   2. По вхождению в config.aliases.
 *   3. По эвристикам на семейство (claude-* → подходящий claude-вариант).
 *   4. DEFAULT_MODEL.
 */
export function resolveModel(requested: string): ModelConfig {
  const q = requested.trim().toLowerCase();

  for (const m of MODELS) {
    if (m.id.toLowerCase() === q) return m;
  }
  for (const m of MODELS) {
    if (m.aliases?.some((a) => a.toLowerCase() === q)) return m;
  }

  // Эвристики по подстрокам
  if (q.includes('haiku')) {
    return MODELS.find((m) => m.id === 'claude-haiku-4-5') ?? DEFAULT_MODEL;
  }
  if (q.includes('opus')) {
    return MODELS.find((m) => m.id === 'claude-opus-4-7') ?? DEFAULT_MODEL;
  }
  if (q.startsWith('claude')) {
    return MODELS.find((m) => m.id === 'claude-sonnet-4-5') ?? DEFAULT_MODEL;
  }

  return DEFAULT_MODEL;
}
