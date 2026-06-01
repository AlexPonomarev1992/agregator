import type { ModelConfig } from '../types';
import {
  buildOpenAIResponsesBody,
  parseOpenAIResponsesDelta,
} from '../families/openai-responses';

export const gpt55: ModelConfig = {
  id: 'gpt-5-5',
  displayName: 'GPT-5.5',
  aliases: [
    'gpt-5',
    'gpt-5-5',
    'gpt-5.5',
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4.1',
  ],
  endpoint: '/codex/v1/responses',
  buildBody: (msgs, opts) => buildOpenAIResponsesBody('gpt-5-5', msgs, opts),
  parseDelta: parseOpenAIResponsesDelta,
};
