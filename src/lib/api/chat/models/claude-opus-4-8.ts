import type { ModelConfig } from '../types';
import {
  buildAnthropicBody,
  parseAnthropicDelta,
} from '../families/anthropic-messages';

/**
 * Claude Opus 4.8 на KIE.
 *
 * Endpoint: POST /claude/v1/messages (Anthropic native).
 * Auth: Authorization: Bearer <KIE_API_KEY> (KIE проксирует, X-Api-Key не нужен).
 * Body: { model, messages: [{role, content}], stream, max_tokens, system? }
 * SSE: стандартные Anthropic события — message_start, content_block_delta,
 *      message_delta, message_stop. Дельта в data.delta.text.
 */
export const claudeOpus48: ModelConfig = {
  id: 'claude-opus-4-8',
  displayName: 'Claude Opus 4.8',
  aliases: [
    'claude',
    'claude-opus',
    'claude-opus-4',
    'claude-opus-4.8',
    'anthropic/claude-opus-4.8',
  ],
  endpoint: '/claude/v1/messages',
  buildBody: (msgs, opts) => buildAnthropicBody('claude-opus-4-8', msgs, opts),
  parseDelta: parseAnthropicDelta,
};
