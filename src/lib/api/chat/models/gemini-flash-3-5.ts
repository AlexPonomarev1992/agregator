import type { ModelConfig } from '../types';
import {
  buildGeminiBody,
  parseGeminiDelta,
} from '../families/google-gemini';

/**
 * Gemini 3.5 Flash на KIE.
 *
 * Endpoint: POST /gemini/v1/models/gemini-3-5-flash:streamGenerateContent
 *           (Google native: contents/parts, ответ — candidates[0].content.parts[].text)
 * Auth: Authorization: Bearer <KIE_API_KEY>.
 *
 * Подтверждено живым стримом с боевым ключом.
 */
export const geminiFlash35: ModelConfig = {
  id: 'gemini-3-5-flash',
  displayName: 'Gemini 3.5 Flash',
  aliases: [
    'gemini',
    'gemini-flash',
    'gemini-3.5-flash',
    'gemini-flash-3.5',
    'gemini-flux-3.5',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'google/gemini-flash-3.5',
  ],
  endpoint: '/gemini/v1/models/gemini-3-5-flash:streamGenerateContent',
  buildBody: (msgs, opts) => buildGeminiBody('gemini-3-5-flash', msgs, opts),
  parseDelta: parseGeminiDelta,
};
