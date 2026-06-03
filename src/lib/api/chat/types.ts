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
  /**
   * Базовый URL провайдера. По умолчанию KIE (`https://api.kie.ai`).
   * Указывать только для не-KIE провайдеров (напр. Gonka).
   */
  baseUrl?: string;
  /** Путь на провайдере (после base url). */
  endpoint: string;
  /**
   * Имя env-переменной с API-ключом провайдера.
   * По умолчанию используется KIE-ключ (`KLING_API_KEY`/`KIE_API_KEY`).
   */
  apiKeyEnv?: string;
  /** Сборка тела HTTP-запроса. */
  buildBody: (messages: ChatMessage[], opts: ChatOptions) => Record<string, unknown>;
  /**
   * Извлечение текстовой дельты из одного SSE-блока (event + data строки).
   * Вернуть null, если в блоке нет полезного текста (reasoning, metadata и т.п.).
   */
  parseDelta: (block: string) => string | null;
  /**
   * Опционально: извлечение дельты «размышлений» (reasoning) из SSE-блока.
   * Для reasoning-моделей (Kimi и т.п.) — чтобы показать индикатор «думает…».
   * Вернуть null, если в блоке нет reasoning-дельты.
   */
  parseReasoning?: (block: string) => string | null;
}
