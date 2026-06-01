/**
 * Общие типы для chat-провайдеров.
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
  reasoningEffort?: 'low' | 'medium' | 'high' | 'xhigh';
}

/**
 * Конфиг одной chat-модели. Один файл в models/ = один такой объект.
 *
 * Чтобы добавить модель:
 *   1. Создать models/<slug>.ts с export const config: ModelConfig = {...}
 *   2. Добавить импорт в models/index.ts
 */
export interface ModelConfig {
  /** Идентификатор для тела запроса (body.model). */
  id: string;
  /** Имя для UI / логов. */
  displayName: string;
  /** Альтернативные id, которые UI может прислать вместо канонического. */
  aliases?: string[];
  /** Путь на KIE (после base url). */
  endpoint: string;
  /** Сборка тела HTTP-запроса. */
  buildBody: (messages: ChatMessage[], opts: ChatOptions) => Record<string, unknown>;
  /**
   * Извлечение текстовой дельты из одного SSE-блока (event + data строки).
   * Вернуть null, если в блоке нет полезного текста (reasoning, metadata и т.п.).
   */
  parseDelta: (block: string) => string | null;
}
