/**
 * Каталог LLM-моделей для ИИ-агента (отображается в UI dropdown).
 *
 * Идентификаторы (`id`) синхронизированы с backend-реестром в
 * src/lib/api/chat/models/. Канонические id из бэкенда:
 *   gpt-5-5, claude-opus-4-8, gemini-3-5-flash
 */

export interface AgentModel {
  id: string;
  name: string;
  provider: 'kie' | 'direct';
  /** Модель для отправки в kie.ai API. */
  kieModel?: string;
  /** Модель для отправки в прямой провайдер. */
  directModel?: string;
  supportsVision?: boolean;
  supportsAudio?: boolean;
  contextLength: number;
  costPer1KIn?: number;
  costPer1KOut?: number;
  badge?: 'FAST' | 'SMART' | 'NEW' | 'POPULAR';
}

export const AGENT_MODELS: AgentModel[] = [
  {
    id: 'claude-opus-4-8',
    name: 'Claude Opus 4.8',
    provider: 'kie',
    kieModel: 'claude-opus-4-8',
    supportsVision: true,
    contextLength: 200_000,
    badge: 'SMART',
  },
  {
    id: 'gpt-5-5',
    name: 'GPT 5.5',
    provider: 'kie',
    kieModel: 'gpt-5-5',
    supportsVision: true,
    contextLength: 400_000,
    badge: 'POPULAR',
  },
  {
    id: 'gemini-3-5-flash',
    name: 'Gemini 3.5 Flash',
    provider: 'kie',
    kieModel: 'gemini-3-5-flash',
    supportsVision: true,
    contextLength: 1_000_000,
    badge: 'FAST',
  },
];

export function getAgentModelById(id: string): AgentModel | undefined {
  return AGENT_MODELS.find((m) => m.id === id);
}
