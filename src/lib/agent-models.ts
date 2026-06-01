/**
 * Каталог LLM-моделей для ИИ-агента.
 * provider='kie' — проксируется через api.kie.ai
 * provider='direct' — вызывается напрямую через llm.ts
 */

export interface AgentModel {
  id: string;
  name: string;
  provider: 'kie' | 'direct';
  /** Модель для отправки в kie.ai API */
  kieModel?: string;
  /** Модель для отправки в прямой провайдер */
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
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'kie',
    kieModel: 'claude-sonnet-4-20250514',
    supportsVision: true,
    contextLength: 200_000,
    badge: 'SMART',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'kie',
    kieModel: 'gpt-4o',
    supportsVision: true,
    contextLength: 128_000,
    badge: 'POPULAR',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o mini',
    provider: 'kie',
    kieModel: 'gpt-4o-mini',
    supportsVision: true,
    contextLength: 128_000,
    badge: 'FAST',
  },
  {
    id: 'gemini-2-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'kie',
    kieModel: 'gemini-2.0-flash',
    supportsVision: true,
    contextLength: 1_000_000,
    badge: 'FAST',
  },
  {
    id: 'grok-3',
    name: 'Grok 3',
    provider: 'kie',
    kieModel: 'grok-3',
    contextLength: 131_072,
    badge: 'NEW',
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3',
    provider: 'kie',
    kieModel: 'deepseek-v3',
    contextLength: 64_000,
  },
  {
    id: 'claude-haiku',
    name: 'Claude Haiku 3.5',
    provider: 'kie',
    kieModel: 'claude-haiku-3-5',
    supportsVision: true,
    contextLength: 200_000,
    badge: 'FAST',
  },
  {
    id: 'openrouter-fallback',
    name: 'Auto (OpenRouter)',
    provider: 'direct',
    directModel: 'anthropic/claude-sonnet-4.6',
    supportsVision: true,
    contextLength: 200_000,
  },
];

export function getAgentModelById(id: string): AgentModel | undefined {
  return AGENT_MODELS.find((m) => m.id === id);
}
