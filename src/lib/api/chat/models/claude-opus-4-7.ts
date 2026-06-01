import type { ModelConfig } from '../types';
import {
  buildAnthropicBody,
  parseAnthropicDelta,
} from '../families/anthropic-messages';

export const claudeOpus47: ModelConfig = {
  id: 'claude-opus-4-7',
  displayName: 'Claude Opus 4.7',
  aliases: ['claude-opus-4.7'],
  endpoint: '/codex/v1/responses',
  buildBody: (msgs, opts) => buildAnthropicBody('claude-opus-4-7', msgs, opts),
  parseDelta: parseAnthropicDelta,
};
