import type { ModelConfig } from '../types';
import {
  buildAnthropicBody,
  parseAnthropicDelta,
} from '../families/anthropic-messages';

export const claudeSonnet45: ModelConfig = {
  id: 'claude-sonnet-4-5',
  displayName: 'Claude Sonnet 4.5',
  aliases: [
    'claude-sonnet',
    'claude-sonnet-4',
    'claude-sonnet-4.5',
    'claude-3-5-sonnet',
    'claude-sonnet-4-20250514',
  ],
  endpoint: '/codex/v1/responses',
  buildBody: (msgs, opts) => buildAnthropicBody('claude-sonnet-4-5', msgs, opts),
  parseDelta: parseAnthropicDelta,
};
