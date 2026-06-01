import type { ModelConfig } from '../types';
import {
  buildAnthropicBody,
  parseAnthropicDelta,
} from '../families/anthropic-messages';

export const claudeOpus45: ModelConfig = {
  id: 'claude-opus-4-5',
  displayName: 'Claude Opus 4.5',
  aliases: ['claude-opus', 'claude-opus-4', 'claude-opus-4.5'],
  endpoint: '/codex/v1/responses',
  buildBody: (msgs, opts) => buildAnthropicBody('claude-opus-4-5', msgs, opts),
  parseDelta: parseAnthropicDelta,
};
