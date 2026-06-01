'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SendHorizontal, Bot, ImagePlus, Loader2 } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { MessageBubble } from '../ai/MessageBubble';
import { ModelSelector } from '../ai/ModelSelector';
import { chatModels } from '@/lib/mock/chat-models';
import type { ChatMessage } from '@/types';

// Local message type for agent chat (no project_id needed)
function createMessage(role: 'user' | 'assistant', content: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    project_id: 'agent',
    role,
    content,
    created_at: new Date().toISOString(),
  };
}

const GREETING_MESSAGE = createMessage(
  'assistant',
  'Привет! Я ИИ-агент VibeLab. Я могу помочь вам с генерацией изображений, ответить на вопросы о контенте и многое другое. Напишите промпт или нажмите кнопку генерации изображения.'
);

const DEFAULT_MODEL = chatModels[0].id;

export function AIAgentSection() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING_MESSAGE]);
  const [input, setInput] = useState('');
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_MODEL);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  // Load chat history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch('/api/agent/chat', { credentials: 'include' });
        if (!res.ok) return;
        const json = await res.json();
        const history: ChatMessage[] = (json.data ?? []).map(
          (m: { id: string; role: string; content: string; created_at: string }) => ({
            id: m.id,
            project_id: 'agent',
            role: m.role as 'user' | 'assistant',
            content: m.content,
            created_at: m.created_at,
          })
        );
        if (history.length > 0) {
          setMessages([GREETING_MESSAGE, ...history]);
        }
      } catch {
        // Keep default greeting
      } finally {
        setHistoryLoaded(true);
      }
    }
    loadHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const maxHeight = 24 * 4;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMessage = createMessage('user', trimmed);
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setIsStreaming(true);

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: trimmed,
          modelId: selectedModelId,
        }),
      });

      if (!response.ok || !response.body) {
        const assistantMessage = createMessage(
          'assistant',
          'Произошла ошибка. Попробуйте другую модель или повторите позже.'
        );
        setMessages((prev) => [...prev, assistantMessage]);
        setIsStreaming(false);
        return;
      }

      // SSE streaming
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantId = crypto.randomUUID();

      setMessages((prev) => [
        ...prev,
        { id: assistantId, project_id: 'agent', role: 'assistant', content: '', created_at: new Date().toISOString() },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantContent += parsed.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: assistantContent } : m
                  )
                );
              }
            } catch {
              // skip unparseable chunks
            }
          }
        }
      }
    } catch {
      const assistantMessage = createMessage(
        'assistant',
        'Произошла ошибка соединения. Попробуйте позже.'
      );
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, selectedModelId]);

  const handleGenerateImage = useCallback(() => {
    if (isGenerating) return;

    const prompt = input.trim() || 'Красивый пейзаж на закате в стиле киберпанк';
    const userMessage = createMessage('user', `🎨 Сгенерировать изображение: ${prompt}`);
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    // Simulate image generation
    setTimeout(() => {
      const assistantMessage = createMessage(
        'assistant',
        `Изображение сгенерировано по промпту: "${prompt}"\n\n*Для реальной генерации подключите API через таб "Изображения".*`
      );
      setMessages((prev) => [...prev, assistantMessage]);
      setIsGenerating(false);
    }, 3000);
  }, [input, isGenerating]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Model selector header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5">
        <ModelSelector
          selectedModelId={selectedModelId}
          onSelectModel={setSelectedModelId}
          compact
        />
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageBubble message={message} />
              </motion.div>
            ))}
          </AnimatePresence>

          {(isStreaming || isGenerating) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-white/40 text-sm px-4"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              {isGenerating ? 'Генерирую изображение...' : 'Думаю...'}
            </motion.div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-white/10 bg-[#0A0A0F]">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                adjustHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Напишите сообщение или промпт для генерации..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 resize-none outline-none min-h-[24px] max-h-[96px]"
              rows={1}
            />
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleGenerateImage}
                disabled={isGenerating || isStreaming}
                className="h-8 w-8 text-white/40 hover:text-white"
                title="Сгенерировать изображение"
              >
                <ImagePlus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="h-8 w-8 text-white/40 hover:text-white"
              >
                <SendHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-white/20 mt-2 text-center">
            ИИ Агент может ошибаться. Проверяйте важную информацию.
          </p>
        </div>
      </div>
    </div>
  );
}
