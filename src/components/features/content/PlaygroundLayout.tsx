'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ChevronDown,
  ArrowDownToLine,
  ImageIcon,
  Video,
  AlertCircle,
  Loader2,
  Sparkles,
} from '@/components/ui/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PromptBar } from './PromptBar';
import type { AIModel } from '@/types';

type MessageStatus = 'sending' | 'processing' | 'done' | 'failed';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status?: MessageStatus;
  resultUrl?: string | null;
  isVideo?: boolean;
  errorMessage?: string;
  createdAt: string;
}

interface PlaygroundLayoutProps {
  model: AIModel;
  onBack: () => void;
  availableModels?: AIModel[];
}

export function PlaygroundLayout({ model: initialModel, onBack, availableModels }: PlaygroundLayoutProps) {
  const [currentModel, setCurrentModel] = useState<AIModel>(initialModel);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isVideoOutput = currentModel.tasks.some((t) =>
    ['text-to-video', 'image-to-video', 'video-to-video', 'video-editing', 'lip-sync', 'cinema'].includes(t)
  );

  // Auto-scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load generation history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const historyType = isVideoOutput ? 'video' : 'photo';
        const res = await fetch(`/api/generate/history?limit=50&type=${historyType}`, {
          credentials: 'include',
        });
        if (!res.ok) return;

        const json = await res.json();
        const generations = json.data ?? [];

        const historyMessages: ChatMessage[] = [];
        for (const gen of [...generations].reverse()) {
          // User message (prompt)
          historyMessages.push({
            id: `user-${gen.id}`,
            role: 'user',
            content: gen.prompt,
            createdAt: gen.createdAt,
          });
          // Assistant message (result)
          const genIsVideo = gen.type === 'video';
          historyMessages.push({
            id: `assistant-${gen.id}`,
            role: 'assistant',
            content: gen.status === 'done'
              ? `${genIsVideo ? 'Видео' : 'Изображение'} готово`
              : gen.status === 'failed'
                ? 'Генерация не удалась'
                : 'Генерация в процессе...',
            status: gen.status as MessageStatus,
            resultUrl: gen.resultUrl,
            isVideo: genIsVideo,
            errorMessage: gen.status === 'failed'
              ? (gen.metadata?.error as string) ?? (gen.metadata?.providerError as string) ?? 'Ошибка генерации'
              : undefined,
            createdAt: gen.updatedAt || gen.createdAt,
          });
        }

        setMessages(historyMessages);
      } catch {
        // Silent fail — history is not critical
      } finally {
        setHistoryLoaded(true);
      }
    }

    loadHistory();
  }, [isVideoOutput]);

  const updateAssistantMessage = useCallback((msgId: string, updates: Partial<ChatMessage>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, ...updates } : m))
    );
  }, []);

  const pollStatus = useCallback(async (generationId: string, assistantMsgId: string) => {
    const MAX_DURATION_MS = 10 * 60 * 1000; // 10 minutes max
    const POLL_INTERVAL = 5000;
    const startTime = Date.now();
    let consecutiveErrors = 0;

    while (Date.now() - startTime < MAX_DURATION_MS) {
      await new Promise((r) => {
        pollRef.current = setTimeout(r, POLL_INTERVAL);
      });

      try {
        const res = await fetch(`/api/generate/status/${generationId}`, {
          credentials: 'include',
        });

        if (!res.ok) {
          consecutiveErrors++;
          // Retry on transient errors (429, 5xx), fail after 5 consecutive
          if (consecutiveErrors >= 5) {
            updateAssistantMessage(assistantMsgId, {
              status: 'failed',
              errorMessage: 'Ошибка получения статуса',
            });
            setIsRunning(false);
            return;
          }
          continue;
        }

        consecutiveErrors = 0;
        const json = await res.json();
        const gen = json.data;

        if (gen.status === 'done') {
          updateAssistantMessage(assistantMsgId, {
            status: 'done',
            resultUrl: gen.resultUrl,
            content: 'Готово',
          });
          setIsRunning(false);
          return;
        }

        if (gen.status === 'failed') {
          updateAssistantMessage(assistantMsgId, {
            status: 'failed',
            errorMessage: gen.metadata?.error ?? gen.metadata?.providerError ?? 'Генерация не удалась',
          });
          setIsRunning(false);
          return;
        }

        // Still processing — update UI
        if (gen.status === 'processing' || gen.status === 'pending') {
          updateAssistantMessage(assistantMsgId, { status: 'processing' });
        }
      } catch {
        consecutiveErrors++;
        if (consecutiveErrors >= 5) {
          updateAssistantMessage(assistantMsgId, {
            status: 'failed',
            errorMessage: 'Ошибка соединения',
          });
          setIsRunning(false);
          return;
        }
        // Retry on network errors
      }
    }

    updateAssistantMessage(assistantMsgId, {
      status: 'failed',
      errorMessage: 'Превышено время ожидания (10 мин)',
    });
    setIsRunning(false);
  }, [updateAssistantMessage]);

  const handleRun = useCallback(async () => {
    const prompt = formData.prompt?.trim();
    if (!prompt || isRunning) return;

    const now = new Date().toISOString();
    const tempId = crypto.randomUUID();
    const assistantMsgId = `assistant-${tempId}`;

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${tempId}`,
      role: 'user',
      content: prompt,
      createdAt: now,
    };

    // Add assistant placeholder
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: 'Генерирую...',
      status: 'sending',
      isVideo: isVideoOutput,
      createdAt: now,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setFormData((prev) => ({ ...prev, prompt: '', image_file: '', image_file_name: '', endFrame_file: '', endFrame_file_name: '' }));
    setIsRunning(true);

    const isVideo = isVideoOutput;
    const endpoint = isVideo ? '/api/generate/video' : '/api/generate/photo';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prompt,
          modelId: currentModel.id,
          ...(formData.aspectRatio ? { aspectRatio: formData.aspectRatio } : {}),
          ...(isVideo && formData.duration ? { duration: parseInt(formData.duration) } : {}),
          ...(isVideo && formData.sound === 'true' ? { sound: true } : {}),
          ...(isVideo && formData.mode ? { mode: formData.mode } : {}),
          ...(formData.style ? { style: formData.style } : {}),
          ...(formData.image_file ? { imageUrl: formData.image_file } : {}),
          ...(formData.endFrame_file ? { endFrameUrl: formData.endFrame_file } : {}),
          ...(formData.negativePrompt ? { negativePrompt: formData.negativePrompt } : {}),
          ...(formData.resolution ? { resolution: formData.resolution } : {}),
          ...(formData.rendering_speed ? { renderingSpeed: formData.rendering_speed } : {}),
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        updateAssistantMessage(assistantMsgId, {
          status: 'failed',
          errorMessage: error?.error?.message || `Ошибка: ${res.status}`,
        });
        setIsRunning(false);
        return;
      }

      const json = await res.json();
      const generation = json.data;

      updateAssistantMessage(assistantMsgId, { status: 'processing' });
      pollStatus(generation.id, assistantMsgId);
    } catch {
      updateAssistantMessage(assistantMsgId, {
        status: 'failed',
        errorMessage: 'Ошибка отправки запроса',
      });
      setIsRunning(false);
    }
  }, [formData, isVideoOutput, currentModel.id, pollStatus, isRunning, updateAssistantMessage]);

  const handleReset = useCallback(() => {
    if (pollRef.current) clearTimeout(pollRef.current);
  }, []);

  const handleModelChange = useCallback((model: AIModel) => {
    if (pollRef.current) clearTimeout(pollRef.current);
    setCurrentModel(model);
    setShowModelSelector(false);
  }, []);

  const showBackButton = !availableModels;
  const hasMessages = messages.length > 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Top bar — model selector */}
      <div className="flex items-center gap-3 px-4 py-2.5 md:px-6 border-b border-white/5 shrink-0">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        <div className="flex items-center gap-2 relative">
          {availableModels && availableModels.length > 1 ? (
            <button
              onClick={() => setShowModelSelector((v) => !v)}
              className="flex items-center gap-2 hover:bg-white/5 rounded-lg px-2 py-1 transition-colors"
            >
              <h2 className="text-base font-semibold text-white">{currentModel.name}</h2>
              <Badge variant="default" className="text-[10px]">
                {currentModel.provider}
              </Badge>
              <ChevronDown className="h-3.5 w-3.5 text-white/40" />
            </button>
          ) : (
            <>
              <h2 className="text-base font-semibold text-white">{currentModel.name}</h2>
              <Badge variant="default" className="text-[10px]">
                {currentModel.provider}
              </Badge>
            </>
          )}

          {/* Model selector dropdown */}
          {showModelSelector && availableModels && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 mt-1 z-50 min-w-[240px] rounded-xl border border-white/10 bg-[#12121A] backdrop-blur-md shadow-xl overflow-hidden"
            >
              {availableModels.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleModelChange(m)}
                  className={`flex items-center gap-3 w-full px-4 py-3 text-left transition-colors ${
                    m.id === currentModel.id
                      ? 'bg-white/10 text-white'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg shrink-0"
                    style={{ background: m.thumbnail }}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{m.name}</div>
                    <div className="text-[10px] text-white/40">{m.provider} · {m.costPerRun} кредитов</div>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </div>

        <Badge variant="purple" className="ml-auto text-xs">
          {currentModel.costPerRun} кредитов
        </Badge>
      </div>

      {/* Close dropdown on outside click */}
      {showModelSelector && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowModelSelector(false)}
        />
      )}

      {/* Chat area — absolute positioning guarantees scroll containment */}
      <div className="relative flex-1">
        <div className="absolute inset-0 overflow-y-auto p-4 md:p-6">
          {!hasMessages && historyLoaded && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-white/15">
              {isVideoOutput ? (
                <Video className="h-16 w-16" />
              ) : (
                <ImageIcon className="h-16 w-16" />
              )}
              <p className="text-base">Результат появится здесь</p>
              <p className="text-sm text-white/10">Введите промпт и нажмите Enter или ↑</p>
            </div>
          )}

          {hasMessages && (
            <div className="max-w-3xl mx-auto space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {msg.role === 'user' ? (
                      <UserBubble content={msg.content} />
                    ) : (
                      <AssistantBubble message={msg} />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom prompt bar */}
      <PromptBar
        model={currentModel}
        formData={formData}
        onFormDataChange={setFormData}
        onRun={handleRun}
        onReset={handleReset}
        isRunning={isRunning}
        isVideo={isVideoOutput}
      />
    </div>
  );
}

/** User message bubble */
function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-white/15 px-4 py-3">
        <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}

/** Assistant message bubble (generation result) */
function AssistantBubble({ message }: { message: ChatMessage }) {
  const { status, resultUrl, isVideo, errorMessage } = message;

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        {/* Avatar */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-indigo-500/30">
            <Sparkles className="h-3 w-3 text-white/80" />
          </div>
          <span className="text-xs text-white/40">VibeLab</span>
        </div>

        {/* Status: sending/processing */}
        {(status === 'sending' || status === 'processing') && (
          <div className="rounded-2xl rounded-bl-sm bg-white/5 px-4 py-4">
            <div className="flex flex-col gap-3">
              {status === 'sending' && (
                <div className="flex items-center gap-2 text-white/40">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-sm">Отправка запроса...</p>
                </div>
              )}
              {status === 'processing' && (
                <>
                  <div className="w-full max-w-[240px] bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: '5%' }}
                      animate={{ width: '90%' }}
                      transition={{ duration: 60, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-white/40 to-white/20 rounded-full"
                    />
                  </div>
                  <p className="text-sm text-white/40 animate-pulse">
                    Генерация {isVideo ? 'видео' : 'изображения'}... 1-3 мин
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Status: failed */}
        {status === 'failed' && (
          <div className="rounded-2xl rounded-bl-sm bg-red-500/5 border border-red-500/10 px-4 py-3">
            <div className="flex items-center gap-2 text-red-400/70">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="text-sm">{errorMessage || 'Произошла ошибка'}</p>
            </div>
          </div>
        )}

        {/* Status: done with result */}
        {status === 'done' && resultUrl && (
          <div className="rounded-2xl rounded-bl-sm overflow-hidden bg-white/5">
            {isVideo ? (
              <video
                src={resultUrl}
                controls
                loop
                className="max-w-full max-h-[400px] object-contain"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resultUrl}
                alt="Результат генерации"
                className="max-w-full max-h-[400px] object-contain"
              />
            )}
            <div className="flex items-center gap-2 px-3 py-2 border-t border-white/5">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5 text-white/50"
                onClick={async () => {
                  try {
                    const res = await fetch(resultUrl);
                    const blob = await res.blob();
                    const ext = isVideo ? 'mp4' : 'png';
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `vibelab-${Date.now()}.${ext}`;
                    a.click();
                    URL.revokeObjectURL(url);
                  } catch {
                    window.open(resultUrl, '_blank');
                  }
                }}
              >
                <ArrowDownToLine className="h-3 w-3" />
                Скачать
              </Button>
            </div>
          </div>
        )}

        {/* Status: done but no result */}
        {status === 'done' && !resultUrl && (
          <div className="rounded-2xl rounded-bl-sm bg-white/5 px-4 py-3">
            <p className="text-sm text-white/30">Генерация завершена, но результат недоступен</p>
          </div>
        )}
      </div>
    </div>
  );
}
