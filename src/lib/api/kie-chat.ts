/**
 * KIE.ai LLM chat completions — проксирует OpenAI/Claude/Gemini/Grok/DeepSeek
 * через единый эндпоинт https://api.kie.ai/api/v1/chat/completions
 */

const KIE_API_KEY = process.env.KLING_API_KEY ?? process.env.KIE_API_KEY;
const KIE_BASE_URL = 'https://api.kie.ai';

interface KieChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface KieChatParams {
  model: string;
  messages: KieChatMessage[];
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
}

// SSE helpers (same format as llm.ts)
function sseEncode(data: string): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify({ content: data })}\n\n`);
}

function sseDone(): Uint8Array {
  return new TextEncoder().encode('data: [DONE]\n\n');
}

/**
 * Chat via kie.ai using their OpenAI-compatible /chat/completions endpoint.
 * Returns SSE ReadableStream on success, or falls back to mock when no API key.
 */
export function chatViaKie(params: KieChatParams): ReadableStream<Uint8Array> {
  if (!KIE_API_KEY) {
    // Fallback mock stream
    return mockKieStream(params.messages);
  }

  return new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(`${KIE_BASE_URL}/api/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${KIE_API_KEY}`,
          },
          body: JSON.stringify({
            model: params.model,
            messages: params.messages,
            stream: params.stream ?? true,
            temperature: params.temperature,
            max_tokens: params.maxTokens ?? 4096,
          }),
        });

        if (!response.ok || !response.body) {
          const errorText = await response.text();
          console.error('[KIE Chat] Error:', response.status, errorText);
          controller.enqueue(sseEncode('Ошибка при обращении к KIE API.'));
          controller.enqueue(sseDone());
          controller.close();
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                controller.enqueue(sseEncode(delta));
              }
            } catch {
              // skip malformed chunks
            }
          }
        }

        controller.enqueue(sseDone());
        controller.close();
      } catch (error) {
        console.error('[KIE Chat] Stream error:', error);
        controller.enqueue(sseEncode('Произошла ошибка при генерации ответа.'));
        controller.enqueue(sseDone());
        controller.close();
      }
    },
  });
}

function mockKieStream(messages: KieChatMessage[]): ReadableStream<Uint8Array> {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const mockText = `[KIE Mock] Ответ на: "${(lastUser?.content ?? '').slice(0, 60)}..."\n\nПодключи KIE_API_KEY для реальных ответов.`;

  return new ReadableStream({
    async start(controller) {
      for (const char of mockText) {
        controller.enqueue(sseEncode(char));
        await new Promise((r) => setTimeout(r, 12));
      }
      controller.enqueue(sseDone());
      controller.close();
    },
  });
}
