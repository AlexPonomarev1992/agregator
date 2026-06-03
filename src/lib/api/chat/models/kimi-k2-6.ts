import type { ModelConfig } from '../types';
import {
  buildOpenAIChatBody,
  parseOpenAIChatDelta,
  parseOpenAIChatReasoning,
} from '../families/openai-chat';

/**
 * Kimi K2.6 (Moonshot AI) через Gonka-прокси (OpenGNK).
 *
 * Endpoint: POST {GONKA_API_URL}/chat/completions
 *           (OpenAI-совместимый chat/completions, ответ — choices[0].delta.content)
 * Auth: Authorization: Bearer <GONKA_API_KEY>.
 *
 * Подтверждено живым стримом с боевым ключом.
 */
const GONKA_BASE_URL = process.env.GONKA_API_URL ?? 'https://proxy.gonka.gg/v1';

export const kimiK26: ModelConfig = {
  id: 'kimi-k2-6',
  displayName: 'Kimi K2.6',
  aliases: [
    'auto', // UI-режим авто-оркестрации работает на Kimi
    'kimi',
    'kimi-k2',
    'kimi-k2.6',
    'kimi-k2-6',
    'moonshotai/kimi-k2.6',
    'moonshotai/Kimi-K2.6',
    'moonshot/kimi',
  ],
  baseUrl: GONKA_BASE_URL,
  endpoint: '/chat/completions',
  apiKeyEnv: 'GONKA_API_KEY',
  buildBody: (msgs, opts) =>
    buildOpenAIChatBody('moonshotai/Kimi-K2.6', msgs, opts),
  parseDelta: parseOpenAIChatDelta,
  parseReasoning: parseOpenAIChatReasoning,
};
