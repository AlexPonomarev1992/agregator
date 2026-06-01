import type { ModelConfig } from '../types';
import {
  buildAnthropicBody,
  parseAnthropicDelta,
} from '../families/anthropic-messages';

export const claudeHaiku45: ModelConfig = {
  id: 'claude-haiku-4-5',
  displayName: 'Claude Haiku 4.5',
  aliases: [
    'claude-haiku',
    'claude-haiku-4',
    'claude-haiku-4.5',
    'claude-haiku-3-5',
    'claude-3-5-haiku',
  ],
  endpoint: '/codex/v1/responses',
  buildBody: (msgs, opts) => buildAnthropicBody('claude-haiku-4-5', msgs, opts),
  parseDelta: parseAnthropicDelta,
};
