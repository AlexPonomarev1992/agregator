'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgentStore } from '@/lib/stores/agent-store';
import { AgentPromptBar } from '../AgentPromptBar';
import { AgentHero } from '../AgentHero';
import { PresetsRow } from '../PresetsRow';
import { cn } from '@/lib/utils';
import { Sparkles, RefreshCw, Film, Volume2, Image } from '@/components/ui/icons';
import { getModelsByCategory, calculatePrice } from '@/lib/models';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mediaType?: 'video' | 'image' | 'audio';
  mediaUrls?: string[];
  attachments?: Array<{ type: string; url: string; name: string }>;
  streaming?: boolean;
  status?: 'queued' | 'running' | 'succeeded' | 'failed';
  generationId?: string;
  startedAt?: number;
}

interface ChatViewProps {
  userId: string;
  chatId?: string | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ASSISTANT_PLACEHOLDER_ID = 'streaming-assistant';

const MODE_TO_CATEGORY = {
  video: 'video' as const,
  image: 'image' as const,
  music: 'music' as const,
  tts: 'audio' as const,
  utility: 'video' as const,
} satisfies Record<string, 'video' | 'image' | 'music' | 'audio'>;

const MODE_TO_MODEL_MODE: Record<string, string> = {
  video: 't2v',
  image: 't2i',
  music: 'generate',
  tts: 'tts',
  utility: 't2v',
};

// ─── Elapsed timer (mm:ss) ────────────────────────────────────────────────────

function ElapsedTimer({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(() => Math.floor((Date.now() - startedAt) / 1000));

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  return <span className="tabular-nums">{mm}:{ss}</span>;
}

// ─── Media bubble ─────────────────────────────────────────────────────────────

function MediaBubble({ msg }: { msg: ChatMessage }) {
  if (!msg.mediaUrls || msg.mediaUrls.length === 0) {
    // Still generating
    const isActive = msg.status === 'queued' || msg.status === 'running';
    const isFailed = msg.status === 'failed';

    const icon =
      msg.mediaType === 'video' ? <Film className="h-4 w-4 text-[#7F77DD]" /> :
      msg.mediaType === 'audio' ? <Volume2 className="h-4 w-4 text-[#7F77DD]" /> :
      <Image className="h-4 w-4 text-[#7F77DD]" />;

    return (
      <motion.div
        className={cn(
          'relative flex flex-col gap-2 p-3 rounded-2xl max-w-[85%] overflow-hidden',
          isFailed
            ? 'bg-red-500/5 border border-red-500/20'
            : 'bg-[#7F77DD]/5 border border-[#7F77DD]/30',
        )}
        animate={
          isActive
            ? {
                boxShadow: [
                  '0 0 0px 0px rgba(127, 119, 221, 0.15), 0 0 0px 0px rgba(96, 165, 250, 0.10) inset',
                  '0 0 24px 4px rgba(127, 119, 221, 0.55), 0 0 18px 2px rgba(96, 165, 250, 0.30) inset',
                  '0 0 0px 0px rgba(127, 119, 221, 0.15), 0 0 0px 0px rgba(96, 165, 250, 0.10) inset',
                ],
                borderColor: [
                  'rgba(127, 119, 221, 0.25)',
                  'rgba(127, 119, 221, 0.75)',
                  'rgba(127, 119, 221, 0.25)',
                ],
              }
            : undefined
        }
        transition={{
          duration: 2.2,
          repeat: isActive ? Infinity : 0,
          ease: 'easeInOut',
        }}
      >
        {/* Inner shimmer overlay */}
        {isActive && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              background:
                'radial-gradient(120% 80% at 50% 50%, rgba(127,119,221,0.18), rgba(96,165,250,0.10) 45%, transparent 75%)',
            }}
            animate={{ opacity: [0.35, 0.9, 0.35] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        <div className="relative flex items-center gap-2 text-xs text-white/80">
          {icon}
          <span>
            {isFailed
              ? 'Ошибка генерации'
              : msg.status === 'queued'
              ? 'В очереди…'
              : 'Генерируется…'}
          </span>
          {isActive && (
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-[#7F77DD]"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.15, 0.85] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>
        {msg.content && <p className="relative text-xs text-white/50">{msg.content}</p>}
        {isActive && msg.startedAt && (
          <div className="relative flex items-center gap-1.5 text-[11px] text-[#7F77DD]/90 font-medium">
            <span className="opacity-60">⏱</span>
            <ElapsedTimer startedAt={msg.startedAt} />
            <span className="text-white/30 ml-1">— это может занять до пары минут</span>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-2 max-w-[85%]">
      {msg.mediaType === 'video' &&
        msg.mediaUrls.map((url, i) => (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            key={i}
            src={url}
            controls
            className="rounded-xl max-w-full border border-white/10"
            style={{ maxHeight: 320 }}
          />
        ))}
      {msg.mediaType === 'image' &&
        msg.mediaUrls.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={url}
            alt="Generated image"
            className="rounded-xl max-w-full border border-white/10"
            style={{ maxHeight: 400 }}
          />
        ))}
      {msg.mediaType === 'audio' &&
        msg.mediaUrls.map((url, i) => (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <audio key={i} src={url} controls className="w-full rounded-xl" />
        ))}
      {msg.content && (
        <p className="text-xs text-white/40 px-1">{msg.content}</p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ChatView({ userId: _userId, chatId }: ChatViewProps) {
  const {
    attachments,
    pendingPrompt,
    instructions,
    instructionsEnabled,
    currentMode,
    selectedModels,
    addAttachment,
    removeAttachment,
    setPendingPrompt,
    setMode,
    clearAttachments,
    getCurrentModel,
  } = useAgentStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Load history when chatId changes ──────────────────────────────────────
  useEffect(() => {

    setHistoryLoaded(false);
    setMessages([]);

    let cancelled = false;

    (async () => {
      try {
        const url = chatId
          ? `/api/projects/${chatId}`
          : '/api/agent/chat';

        const res = await fetch(url, { credentials: 'include' });
        if (cancelled) return;
        if (!res.ok) { setHistoryLoaded(true); return; }

        const json = await res.json() as {
          data?: {
            messages?: Array<{ id: string; role: string; content: string }>;
          } | Array<{ id: string; role: string; content: string }>;
        };

        if (cancelled) return;

        // /api/projects/[id] returns { data: { ...project, messages: [...] } }
        // /api/agent/chat returns { data: [...messages] }
        let rawMessages: Array<{ id: string; role: string; content: string }> = [];
        if (chatId) {
          const d = json.data as { messages?: Array<{ id: string; role: string; content: string }> };
          rawMessages = d?.messages ?? [];
        } else {
          rawMessages = (json.data as Array<{ id: string; role: string; content: string }>) ?? [];
        }

        const items: ChatMessage[] = rawMessages.map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));
        setMessages(items);
      } catch {
        // silent
      } finally {
        if (!cancelled) setHistoryLoaded(true);
      }
    })();

    return () => { cancelled = true; };
  }, [chatId]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // ── Cost preview ───────────────────────────────────────────────────────────
  const costPreview = useCallback((): number | null => {
    if (currentMode === 'chat') return null;
    const category = MODE_TO_CATEGORY[currentMode as Exclude<typeof currentMode, 'chat'>];
    if (!category) return null;
    const models = getModelsByCategory(category).filter((m) => m.priority === 1);
    const model = models[0] ?? getModelsByCategory(category)[0];
    if (!model) return null;
    return calculatePrice(model, { prompt: pendingPrompt }).credits;
  }, [currentMode, pendingPrompt]);

  // ── Auto-rename chat after first user message ──────────────────────────────
  const autoRenameChatAsync = useCallback(async (projectId: string, text: string) => {
    try {
      const res = await fetch('/api/agent/chat-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      const json = await res.json() as { data?: { title?: string } };
      const title = json.data?.title;
      if (!title) return;
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: title }),
      });
    } catch {
      // silent
    }
  }, []);

  // ── Poll generation status ─────────────────────────────────────────────────
  const pollGeneration = useCallback(
    async (generationId: string, placeholderId: string, mediaType: 'video' | 'image' | 'audio') => {
      const MAX_POLLS = 60;
      let polls = 0;

      const tick = async () => {
        if (polls++ > MAX_POLLS) return;
        try {
          const res = await fetch(`/api/studio/status/${generationId}`, { credentials: 'include' });
          if (!res.ok) return;
          const json = await res.json() as {
            data?: {
              status?: string;
              resultUrls?: string[];
              outputs?: Array<{ url: string }>;
              errorMessage?: string | null;
              errorCode?: string | null;
            };
          };
          const status = json.data?.status;
          // Поддерживаем оба формата: resultUrls (новый) и outputs (legacy)
          const rawUrls: unknown[] =
            json.data?.resultUrls ??
            (json.data?.outputs?.map((o) => o.url) ?? []);
          // Защита: пускаем только валидные http(s) строки.
          // Иначе KIE может прислать [object] / пустую строку → плеер 0:00.
          const mediaUrls: string[] = rawUrls
            .map((u) => (typeof u === 'string' ? u.trim() : ''))
            .filter((u) => /^https?:\/\//i.test(u));

          if (status === 'succeeded' && mediaUrls.length > 0) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === placeholderId
                  ? { ...m, status: 'succeeded' as const, mediaUrls }
                  : m
              )
            );
            return;
          }

          if (status === 'failed') {
            const errorMsg = json.data?.errorMessage ?? 'Не удалось создать контент. Попробуйте снова.';
            setMessages((prev) =>
              prev.map((m) =>
                m.id === placeholderId
                  ? { ...m, status: 'failed' as const, content: errorMsg }
                  : m
              )
            );
            return;
          }

          // Превышен лимит попыток — показываем timeout-ошибку
          if (polls > MAX_POLLS) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === placeholderId
                  ? { ...m, status: 'failed' as const, content: 'Генерация превысила допустимое время ожидания.' }
                  : m
              )
            );
            return;
          }

          // Still running — schedule next tick
          const delay = polls < 5 ? 2000 : 4000;
          setTimeout(() => { void tick(); }, delay);
        } catch {
          // retry
          setTimeout(() => { void tick(); }, 5000);
        }
      };

      setTimeout(() => { void tick(); }, 2000);
    },
    []
  );

  // ── Send a generation request (non-chat modes) ─────────────────────────────
  const sendGeneration = useCallback(
    async (text: string) => {
      const modelSlug = getCurrentModel(currentMode);
      const category = MODE_TO_CATEGORY[currentMode as Exclude<typeof currentMode, 'chat'>];
      const modelMode = MODE_TO_MODEL_MODE[currentMode] ?? 't2v';
      const mediaType: 'video' | 'image' | 'audio' =
        category === 'video' ? 'video' : category === 'image' ? 'image' : 'audio';

      // User message
      const userMsgId = `user-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: 'user', content: text },
      ]);
      setPendingPrompt('');

      // Assistant placeholder
      const placeholderId = `gen-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: placeholderId,
          role: 'assistant',
          content: `Генерирую ${currentMode === 'tts' ? 'озвучку' : currentMode === 'music' ? 'музыку' : currentMode === 'image' ? 'изображение' : 'видео'}…`,
          mediaType,
          status: 'queued',
          startedAt: Date.now(),
        },
      ]);

      try {
        const res = await fetch('/api/studio/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            modelSlug,
            mode: modelMode,
            parameters: { prompt: text },
          }),
        });

        if (!res.ok) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === placeholderId ? { ...m, status: 'failed' as const, content: 'Ошибка запуска генерации' } : m
            )
          );
          return;
        }

        const json = await res.json() as { data?: { id?: string; generationId?: string } };
        const generationId = json.data?.generationId ?? json.data?.id;

        if (!generationId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === placeholderId ? { ...m, status: 'failed' as const, content: 'Нет ID задачи' } : m
            )
          );
          return;
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === placeholderId ? { ...m, status: 'running' as const, generationId } : m
          )
        );

        void pollGeneration(generationId, placeholderId, mediaType);
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === placeholderId ? { ...m, status: 'failed' as const, content: 'Ошибка соединения' } : m
          )
        );
      }
    },
    [currentMode, getCurrentModel, setPendingPrompt, pollGeneration]
  );

  // ── Send a chat message ────────────────────────────────────────────────────
  const sendChatMessage = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || isStreaming) return;

      const isFirstMessage = messages.length === 0;
      const selectedModel = getCurrentModel('chat');

      // Optimistic user message
      const userMsgId = `user-${Date.now()}`;
      const userMsg: ChatMessage = { id: userMsgId, role: 'user', content: message };
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: ASSISTANT_PLACEHOLDER_ID, role: 'assistant', content: '', streaming: true },
      ]);
      setPendingPrompt('');
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      // Resolve endpoint: if we have a chatId → use project chat, else use agent
      const endpoint = chatId
        ? `/api/projects/${chatId}/chat`
        : '/api/agent/chat';

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          signal: controller.signal,
          body: JSON.stringify({
            content: message,
            model: selectedModel,
            modelId: selectedModel,
            instructions,
            instructionsEnabled,
            attachments: attachments.map((a) => ({
              id: a.id, type: a.type, url: a.url, name: a.name,
            })),
          }),
        });

        if (!res.ok || !res.body) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === ASSISTANT_PLACEHOLDER_ID
                ? { ...m, content: '_Ошибка: не удалось получить ответ_', streaming: false, id: `err-${Date.now()}` }
                : m
            )
          );
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = '';
        let buffered = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffered += decoder.decode(value, { stream: true });
          const lines = buffered.split('\n');
          buffered = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data) as { content?: string; text?: string };
              const chunk = parsed.content ?? parsed.text ?? '';
              if (chunk) {
                acc += chunk;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === ASSISTANT_PLACEHOLDER_ID ? { ...m, content: acc } : m
                  )
                );
              }
            } catch {
              acc += data;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === ASSISTANT_PLACEHOLDER_ID ? { ...m, content: acc } : m
                )
              );
            }
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === ASSISTANT_PLACEHOLDER_ID
              ? { ...m, streaming: false, id: `asst-${Date.now()}` }
              : m
          )
        );

        // Auto-rename on first message if chatId is present
        if (isFirstMessage && chatId) {
          void autoRenameChatAsync(chatId, message);
        }
      } catch (err) {
        const wasAborted = err instanceof Error && err.name === 'AbortError';
        setMessages((prev) =>
          prev.map((m) =>
            m.id === ASSISTANT_PLACEHOLDER_ID
              ? {
                  ...m,
                  content: wasAborted ? '_Прервано_' : '_Ошибка соединения_',
                  streaming: false,
                  id: `err-${Date.now()}`,
                }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [
      isStreaming,
      messages.length,
      getCurrentModel,
      chatId,
      instructions,
      instructionsEnabled,
      attachments,
      setPendingPrompt,
      autoRenameChatAsync,
    ]
  );

  // ── Unified send dispatcher ────────────────────────────────────────────────
  const handleSend = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      if (currentMode === 'chat') {
        void sendChatMessage(text);
      } else {
        void sendGeneration(text);
      }
    },
    [currentMode, sendChatMessage, sendGeneration]
  );

  // ── Enhance prompt ─────────────────────────────────────────────────────────
  const handleEnhance = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || isEnhancing) return;
      setIsEnhancing(true);
      try {
        const res = await fetch('/api/agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            content: `Улучши этот промпт для генерации в режиме ${currentMode}. Верни ТОЛЬКО улучшенный промпт, без объяснений:\n\n${prompt}`,
            modelId: 'anthropic/claude-sonnet-4.6',
            systemPrompt:
              'Ты — эксперт по улучшению промптов для ИИ-генерации. Улучшай промпты, делая их более детальными и эффективными.',
          }),
        });
        if (res.ok && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let enhanced = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split('\n')) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') break;
                try {
                  const parsed = JSON.parse(data) as { content?: string };
                  if (parsed.content) enhanced += parsed.content;
                } catch {
                  enhanced += data;
                }
              }
            }
          }
          if (enhanced.trim()) setPendingPrompt(enhanced.trim());
        }
      } catch {
        // silent
      } finally {
        setIsEnhancing(false);
      }
    },
    [currentMode, isEnhancing, setPendingPrompt]
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleReset = useCallback(() => {
    setMessages([]);
    clearAttachments();
  }, [clearAttachments]);

  // ── Auto-detect slash commands in prompt ───────────────────────────────────
  const handlePromptChange = useCallback(
    (v: string) => {
      setPendingPrompt(v);
      const firstWord = v.split(' ')[0]?.toLowerCase() ?? '';
      const slashMap: Record<string, typeof currentMode> = {
        '/video': 'video',
        '/image': 'image',
        '/music': 'music',
        '/voice': 'tts',
        '/tts': 'tts',
        '/chat': 'chat',
      };
      const detected = slashMap[firstWord];
      if (detected) setMode(detected);
    },
    [setPendingPrompt, setMode, currentMode]
  );

  // Derived state
  const showWelcome = messages.length === 0 && historyLoaded && currentMode !== 'chat';
  const cost = costPreview();

  // Stable ref to selectedModels[currentMode] for the mode indicator
  const currentModelId = selectedModels[currentMode];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages */}
      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto px-1 py-4 space-y-4 min-h-0"
      >
        {!historyLoaded ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
          </div>
        ) : messages.length === 0 ? (
          <AnimatePresence>
            {currentMode === 'chat' ? (
              <motion.div
                key="empty-chat"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <Sparkles className="h-8 w-8 text-[#7F77DD]/60 mb-3" />
                <p className="text-sm text-white/40">Начните диалог с агентом</p>
                <p className="text-xs text-white/25 mt-1">
                  Используйте /image /video /music чтобы переключить режим
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="welcome-generation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AgentHero />
                <div className="mt-4">
                  <PresetsRow currentPrompt={pendingPrompt} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'flex',
                m.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {m.role === 'assistant' && m.mediaType ? (
                <MediaBubble msg={m} />
              ) : (
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                    m.role === 'user'
                      ? 'bg-[#7F77DD]/20 border border-[#7F77DD]/30 text-white'
                      : 'bg-white/5 border border-white/10 text-white/90'
                  )}
                >
                  {m.content ||
                    (m.streaming ? (
                      <span className="inline-flex gap-1 items-center text-white/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-pulse" />
                        печатает...
                      </span>
                    ) : (
                      ''
                    ))}
                  {m.streaming && m.content && (
                    <span className="inline-block w-1.5 h-3 bg-white/40 ml-1 align-middle animate-pulse" />
                  )}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Toolbar */}
      {messages.length > 0 && (
        <div className="flex items-center justify-between py-1 px-1">
          <div className="text-[10px] text-white/20">
            {currentMode !== 'chat' && currentModelId && (
              <span>Модель: <span className="text-white/40">{currentModelId}</span></span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isStreaming ? (
              <button
                type="button"
                onClick={handleStop}
                className="text-xs text-white/40 hover:text-white/70 px-2 py-1 rounded hover:bg-white/5"
              >
                Остановить
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 px-2 py-1 rounded hover:bg-white/5"
              >
                <RefreshCw className="h-3 w-3" />
                Очистить
              </button>
            )}
          </div>
        </div>
      )}

      {/* Prompt bar — always visible */}
      <div className="flex-shrink-0">
        <AgentPromptBar
          value={pendingPrompt}
          onChange={handlePromptChange}
          onSend={handleSend}
          onEnhance={handleEnhance}
          mode={currentMode}
          onModeChange={setMode}
          placeholder={
            currentMode === 'chat'
              ? 'Спросите что угодно или опишите задачу…'
              : currentMode === 'video'
              ? 'Опишите видео, которое хотите создать…'
              : currentMode === 'image'
              ? 'Опишите изображение…'
              : currentMode === 'music'
              ? 'Опишите трек, жанр, настроение…'
              : 'Введите текст для озвучки…'
          }
          attachments={attachments}
          onAddAttachment={addAttachment}
          onRemoveAttachment={removeAttachment}
          isEnhancing={isEnhancing}
          costPreview={cost}
        />
      </div>
    </div>
  );
}
