'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgentStore } from '@/lib/stores/agent-store';
import { AgentPromptBar } from '../AgentPromptBar';
import { AgentHero } from '../AgentHero';
import { PresetsRow } from '../PresetsRow';
import { cn } from '@/lib/utils';
import { Sparkles, RefreshCw, Film, Volume2, Image, Brain, ChevronDown } from '@/components/ui/icons';
import { getModelsByCategory, calculatePrice } from '@/lib/models';
import { RichMessageRenderer } from '@/components/features/ai/RichMessageRenderer';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mediaType?: 'video' | 'image' | 'audio';
  mediaUrls?: string[];
  attachments?: Array<{ type: string; url: string; name: string }>;
  streaming?: boolean;
  /** Reasoning-фаза модели (показываем «думает…» до первого токена ответа). */
  thinking?: boolean;
  /** Накопленный текст размышлений (reasoning) — для сворачиваемого блока. */
  reasoningText?: string;
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

// Человеческие подписи режимов генерации (для оркестратора)
const GEN_LABEL: Record<string, string> = {
  video: 'видео',
  image: 'изображение',
  music: 'музыка',
  tts: 'озвучка',
};

// Быстрый эвристический фильтр: похоже ли сообщение на запрос ГЕНЕРАЦИИ медиа.
// Если нет — не гоняем Kimi-классификацию (она с reasoning медленная), а сразу
// стримим чат в реалтайме. Полноценная логика оркестрации — позже.
const GENERATION_HINT =
  /(нарису|нарисо|рисуй|картинк|изображени|фото|логотип|иллюстрац|видео|ролик|клип|анимац|трек\b|песн|музык|мелоди|саундтрек|озвуч|вслух|синтез речи|субтитр|draw|image|picture|photo|logo|render|video|clip|animation|song|music|track|melody|voice|narrat|speech)/i;

function looksLikeGeneration(text: string): boolean {
  return GENERATION_HINT.test(text);
}

// Ответ /api/agent/orchestrate
type OrchestrateResult =
  | {
      action: 'generate';
      mode: 'video' | 'image' | 'music' | 'tts';
      modelSlug: string;
      modelMode: string;
      mediaType: 'video' | 'image' | 'audio';
      prompt: string;
      parameters: Record<string, unknown>;
    }
  | { action: 'notice'; message: string }
  | { action: 'chat' };

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

/**
 * Сворачиваемый блок «Размышления» (reasoning-режим Kimi), как в DeepSeek.
 * Авто-разворот во время размышления, авто-сворачивание после начала ответа.
 */
function ReasoningBlock({ text, active }: { text: string; active: boolean }) {
  const [open, setOpen] = useState(active);
  // Синхронизируем разворот с фазой размышления (но юзер может переключить сам)
  useEffect(() => {
    setOpen(active);
  }, [active]);

  return (
    <div className="mb-2 rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-white/50 hover:text-white/80 transition-colors"
      >
        <Brain className="h-3.5 w-3.5 text-[#7F77DD]" />
        <span>{active ? 'Размышляет…' : 'Размышления'}</span>
        {active && (
          <span className="inline-flex gap-1 ml-0.5">
            <span className="h-1 w-1 rounded-full bg-[#7F77DD]/70 animate-bounce [animation-delay:-0.2s]" />
            <span className="h-1 w-1 rounded-full bg-[#7F77DD]/70 animate-bounce [animation-delay:-0.1s]" />
            <span className="h-1 w-1 rounded-full bg-[#7F77DD]/70 animate-bounce" />
          </span>
        )}
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 ml-auto transition-transform',
            open ? 'rotate-180' : 'rotate-0'
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="px-3 pb-3 pt-0.5 text-xs leading-relaxed text-white/40 whitespace-pre-wrap border-t border-white/5">
              {text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Анимация генерации ФОТО: несколько органичных «кривых» градиентных пятен,
 * которые хаотично дрейфуют, вращаются и меняют форму. Длительности разные и
 * не кратные друг другу — фазы расходятся, движение выглядит хаотичным.
 * Детерминированно (без Math.random) — безопасно для SSR/гидрации.
 */
function ImageGenAnimation() {
  const blobs = [
    {
      size: 240,
      dur: 9,
      bg: 'radial-gradient(circle at 35% 35%, rgba(127,119,221,0.95), transparent 68%)',
      x: ['-18%', '34%', '6%', '-22%', '-18%'],
      y: ['-12%', '22%', '46%', '8%', '-12%'],
      rotate: [0, 70, -45, 35, 0],
      radii: [
        '42% 58% 63% 37% / 41% 44% 56% 59%',
        '67% 33% 47% 53% / 37% 62% 38% 63%',
        '38% 62% 35% 65% / 60% 38% 62% 40%',
        '55% 45% 58% 42% / 49% 56% 44% 51%',
        '42% 58% 63% 37% / 41% 44% 56% 59%',
      ],
    },
    {
      size: 210,
      dur: 11.5,
      bg: 'radial-gradient(circle at 60% 40%, rgba(96,165,250,0.9), transparent 68%)',
      x: ['28%', '-24%', '18%', '-6%', '28%'],
      y: ['20%', '-14%', '34%', '48%', '20%'],
      rotate: [0, -55, 40, -30, 0],
      radii: [
        '63% 37% 42% 58% / 56% 41% 59% 44%',
        '34% 66% 57% 43% / 47% 63% 37% 53%',
        '58% 42% 33% 67% / 38% 55% 45% 62%',
        '45% 55% 62% 38% / 60% 44% 56% 40%',
        '63% 37% 42% 58% / 56% 41% 59% 44%',
      ],
    },
    {
      size: 190,
      dur: 13.7,
      bg: 'radial-gradient(circle at 45% 60%, rgba(232,121,249,0.8), transparent 70%)',
      x: ['6%', '30%', '-26%', '14%', '6%'],
      y: ['40%', '4%', '24%', '-16%', '40%'],
      rotate: [0, 50, -60, 25, 0],
      radii: [
        '50% 50% 36% 64% / 64% 36% 64% 36%',
        '40% 60% 60% 40% / 40% 45% 55% 60%',
        '66% 34% 53% 47% / 57% 62% 38% 43%',
        '37% 63% 47% 53% / 45% 38% 62% 55%',
        '50% 50% 36% 64% / 64% 36% 64% 36%',
      ],
    },
  ];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute blur-2xl will-change-transform"
          style={{
            width: b.size,
            height: b.size,
            left: '50%',
            top: '50%',
            marginLeft: -b.size / 2,
            marginTop: -b.size / 2,
            background: b.bg,
            mixBlendMode: 'screen',
          }}
          animate={{
            x: b.x,
            y: b.y,
            rotate: b.rotate,
            borderRadius: b.radii,
            scale: [1, 1.25, 0.9, 1.15, 1],
          }}
          transition={{ duration: b.dur, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      {/* Затемнение по краям — добавляет глубины и читаемости тексту */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 95% at 50% 35%, transparent 38%, rgba(10,10,12,0.45) 100%)',
        }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4.3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function MediaBubble({ msg }: { msg: ChatMessage }) {
  if (!msg.mediaUrls || msg.mediaUrls.length === 0) {
    // Still generating
    const isActive = msg.status === 'queued' || msg.status === 'running';
    const isFailed = msg.status === 'failed';
    const isImage = msg.mediaType === 'image';

    const icon =
      msg.mediaType === 'video' ? <Film className="h-4 w-4 text-[#7F77DD]" /> :
      msg.mediaType === 'audio' ? <Volume2 className="h-4 w-4 text-[#7F77DD]" /> :
      <Image className="h-4 w-4 text-[#7F77DD]" />;

    return (
      <motion.div
        className={cn(
          'relative flex flex-col gap-2 p-3 rounded-2xl max-w-[85%] w-full overflow-hidden',
          // Для фото даём градиенту полотно и прижимаем подписи к низу
          isImage && isActive && 'min-h-[180px] justify-end sm:max-w-[420px]',
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
        {/* Фон процесса генерации: для фото — хаотичный «кривой» градиент,
            для видео/аудио — мягкое радиальное мерцание */}
        {isActive &&
          (isImage ? (
            <ImageGenAnimation />
          ) : (
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
          ))}

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
    <div className="flex flex-col gap-2 w-full max-w-[85%]">
      {msg.mediaType === 'video' &&
        msg.mediaUrls.map((url, i) => (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          // w-full h-auto — по ширине ответа, оригинальное соотношение сторон
          <video
            key={i}
            src={url}
            controls
            className="block w-full h-auto rounded-xl border border-white/10"
          />
        ))}
      {msg.mediaType === 'image' &&
        msg.mediaUrls.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          // w-full h-auto — изображение во всю ширину ответа, оригинальное
          // соотношение сторон сохраняется (не сжимаем, ratio у всех разный)
          <img
            key={i}
            src={url}
            alt="Generated image"
            className="block w-full h-auto rounded-xl border border-white/10"
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
    setSelectedModel,
    clearAttachments,
    getCurrentModel,
  } = useAgentStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Синхронный замок: один отправленный запрос за раз. Защищает от двойного
  // сабмита и от того, что оркестратор «задваивает» вызов генератора.
  const inFlightRef = useRef(false);

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

        type RawMsg = {
          id: string;
          role: string;
          content: string;
          mediaType?: 'video' | 'image' | 'audio' | null;
          generationId?: string | null;
          generationStatus?: string | null;
          mediaUrls?: string[];
          errorMessage?: string | null;
        };
        const json = await res.json() as {
          data?: { messages?: RawMsg[] } | RawMsg[];
        };

        if (cancelled) return;

        // /api/projects/[id] returns { data: { ...project, messages: [...] } }
        // /api/agent/chat returns { data: [...messages] }
        let rawMessages: RawMsg[] = [];
        if (chatId) {
          const d = json.data as { messages?: RawMsg[] };
          rawMessages = d?.messages ?? [];
        } else {
          rawMessages = (json.data as RawMsg[]) ?? [];
        }

        const items: ChatMessage[] = rawMessages.map((m) => {
          const base: ChatMessage = {
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
          };
          // Сообщение-генерация: восстанавливаем медиа/статус из истории
          if (m.generationId && m.mediaType) {
            const st = m.generationStatus;
            const status: ChatMessage['status'] =
              st === 'succeeded' ? 'succeeded' : st === 'failed' ? 'failed' : 'running';
            base.mediaType = m.mediaType;
            base.generationId = m.generationId;
            base.status = status;
            base.mediaUrls = m.mediaUrls ?? [];
            if (status === 'failed' && m.errorMessage) base.content = m.errorMessage;
            if (status !== 'succeeded' && !base.startedAt) base.startedAt = Date.now();
          }
          return base;
        });
        setMessages(items);

        // Догоняем незавершённые генерации (клиент мог быть офлайн)
        for (const it of items) {
          if (it.generationId && it.mediaType && it.status === 'running') {
            void pollGeneration(it.generationId, it.id, it.mediaType);
          }
        }
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

  // ── Dispatch a generation (shared by manual modes and orchestrator) ─────────
  // Добавляет assistant-плейсхолдер, шлёт запрос в студию и запускает поллинг.
  // Сообщение пользователя НЕ добавляет — это ответственность вызывающего.
  const dispatchGeneration = useCallback(
    async (args: {
      modelSlug: string;
      modelMode: string;
      mediaType: 'video' | 'image' | 'audio';
      parameters: Record<string, unknown>;
      placeholderText: string;
      /** Исходный запрос пользователя — для сохранения в историю чата. */
      userText?: string;
    }) => {
      const { modelSlug, modelMode, mediaType, parameters, placeholderText, userText } = args;

      const placeholderId = `gen-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: placeholderId,
          role: 'assistant',
          content: placeholderText,
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
            parameters,
          }),
        });

        if (!res.ok) {
          // Достаём осмысленное сообщение от сервера (напр. лимит очереди — 429).
          let reason = 'Ошибка запуска генерации';
          try {
            const err = (await res.json()) as { error?: { message?: string } };
            if (err.error?.message) reason = err.error.message;
          } catch {
            // тело не JSON — оставляем дефолт
          }
          if (res.status === 429 && reason === 'Ошибка запуска генерации') {
            reason = 'Слишком много одновременных генераций. Дождитесь завершения текущих.';
          }
          setMessages((prev) =>
            prev.map((m) =>
              m.id === placeholderId ? { ...m, status: 'failed' as const, content: reason } : m
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

        // Сохраняем генерацию в историю чата, чтобы медиа появилось при
        // следующем заходе — даже если клиент закрыл вкладку/выключил телефон.
        void fetch('/api/agent/chat/generation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            generationId,
            mediaType,
            userText,
            chatId: chatId ?? undefined,
          }),
        }).catch(() => {});

        void pollGeneration(generationId, placeholderId, mediaType);
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === placeholderId ? { ...m, status: 'failed' as const, content: 'Ошибка соединения' } : m
          )
        );
      }
    },
    [pollGeneration, chatId]
  );

  // ── Send a generation request (manual non-chat modes) ───────────────────────
  const sendGeneration = useCallback(
    async (text: string) => {
      const modelSlug = getCurrentModel(currentMode);
      const category = MODE_TO_CATEGORY[currentMode as Exclude<typeof currentMode, 'chat'>];
      const modelMode = MODE_TO_MODEL_MODE[currentMode] ?? 't2v';
      const mediaType: 'video' | 'image' | 'audio' =
        category === 'video' ? 'video' : category === 'image' ? 'image' : 'audio';

      const userMsgId = `user-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: 'user', content: text },
      ]);
      setPendingPrompt('');

      const label =
        currentMode === 'tts' ? 'озвучку'
        : currentMode === 'music' ? 'музыку'
        : currentMode === 'image' ? 'изображение'
        : 'видео';

      await dispatchGeneration({
        modelSlug,
        modelMode,
        mediaType,
        parameters: { prompt: text },
        placeholderText: `Генерирую ${label}…`,
        userText: text,
      });
    },
    [currentMode, getCurrentModel, setPendingPrompt, dispatchGeneration]
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
        let accReasoning = '';
        let buffered = '';
        // Reasoning-фаза: показываем «думает…», пока не пошёл текст ответа.
        let isThinking = false;
        let gotContent = false;
        const setThinking = (v: boolean) =>
          setMessages((prev) =>
            prev.map((m) =>
              m.id === ASSISTANT_PLACEHOLDER_ID ? { ...m, thinking: v } : m
            )
          );
        // Throttle через requestAnimationFrame — рендерим ~60fps, без
        // лишних React-комитов, и при этом каждый кадр виден визуально.
        let pendingPaint = false;
        const scheduleRender = () => {
          if (pendingPaint) return;
          pendingPaint = true;
          requestAnimationFrame(() => {
            pendingPaint = false;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === ASSISTANT_PLACEHOLDER_ID
                  ? { ...m, content: acc, reasoningText: accReasoning }
                  : m
              )
            );
          });
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffered += decoder.decode(value, { stream: true });
          // SSE-события могут приходить как "data: ...\n\n" (по спеке) или
          // просто "data: ...\n" — обрабатываем построчно для устойчивости.
          const lines = buffered.split('\n');
          buffered = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (!data || data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data) as {
                content?: string;
                text?: string;
                reasoning?: string;
              };
              const chunk = parsed.content ?? parsed.text ?? '';
              if (chunk) {
                if (!gotContent) {
                  gotContent = true;
                  if (isThinking) {
                    isThinking = false;
                    setThinking(false);
                  }
                }
                acc += chunk;
                scheduleRender();
              } else if (parsed.reasoning && !gotContent) {
                // Копим текст размышлений и показываем индикатор «думает…».
                accReasoning += parsed.reasoning;
                if (!isThinking) {
                  isThinking = true;
                  setThinking(true);
                }
                scheduleRender();
              }
            } catch {
              acc += data;
              scheduleRender();
            }
          }
        }
        // Финальный flush — на случай если последний кадр ещё не нарисовался.
        setMessages((prev) =>
          prev.map((m) =>
            m.id === ASSISTANT_PLACEHOLDER_ID
              ? { ...m, content: acc, reasoningText: accReasoning }
              : m
          )
        );

        setMessages((prev) =>
          prev.map((m) =>
            m.id === ASSISTANT_PLACEHOLDER_ID
              ? { ...m, streaming: false, thinking: false, id: `asst-${Date.now()}` }
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

  // ── Kimi-оркестратор: из чата автоматически уводим в нужную генерацию ───────
  const orchestrateAndSend = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || isStreaming) return;

      // Быстрый путь: обычный разговор без признаков генерации → сразу стримим
      // ответ в реалтайме (живой тайпинг + размышления), без блокирующей
      // Kimi-классификации.
      if (!looksLikeGeneration(message)) {
        void sendChatMessage(message);
        return;
      }

      // Оптимистично показываем сообщение + индикатор анализа
      const userMsgId = `user-${Date.now()}`;
      const thinkId = `think-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: 'user', content: message },
        { id: thinkId, role: 'assistant', content: 'Анализирую запрос…', streaming: true },
      ]);
      setPendingPrompt('');

      let intent: OrchestrateResult | null = null;
      try {
        const res = await fetch('/api/agent/orchestrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ prompt: message }),
        });
        if (res.ok) {
          const j = (await res.json()) as { data?: OrchestrateResult };
          intent = j.data ?? null;
        }
      } catch {
        // сеть упала — продолжим как обычный чат
      }

      if (intent && intent.action === 'generate') {
        const { mode, modelSlug, modelMode, mediaType, parameters } = intent;
        setMode(mode);
        setSelectedModel(mode, modelSlug);
        // убираем индикатор анализа, сообщение пользователя оставляем
        setMessages((prev) => prev.filter((m) => m.id !== thinkId));
        const label = GEN_LABEL[mode] ?? 'контент';
        await dispatchGeneration({
          modelSlug,
          modelMode,
          mediaType,
          parameters,
          placeholderText: `Понял — нужна генерация: ${label}. Переключаюсь и запускаю «${modelSlug}»…`,
          userText: message,
        });
      } else if (intent && intent.action === 'notice') {
        // намерение распознано, но пайплайна нет (напр. STT) — показываем пояснение
        setMessages((prev) =>
          prev.map((m) =>
            m.id === thinkId
              ? { ...m, content: intent.message, streaming: false, id: `notice-${Date.now()}` }
              : m
          )
        );
      } else {
        // обычный чат: убираем оптимистичные сообщения, отдаём в стандартный поток
        setMessages((prev) => prev.filter((m) => m.id !== userMsgId && m.id !== thinkId));
        void sendChatMessage(message);
      }
    },
    [isStreaming, setPendingPrompt, setMode, setSelectedModel, sendChatMessage, dispatchGeneration]
  );

  // ── Unified send dispatcher ────────────────────────────────────────────────
  const handleSend = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      // Один запрос за раз: не даём двойному сабмиту/оркестратору задваивать
      // вызовы (иначе студия отвечает 429 QUEUE_FULL).
      if (inFlightRef.current || isStreaming) return;
      inFlightRef.current = true;
      const release = () => {
        inFlightRef.current = false;
      };

      if (currentMode === 'chat') {
        // Оркестрацией занимается только авто-режим. Любая выбранная вручную
        // языковая модель — обычный чат без авто-роутинга в генерацию.
        if (getCurrentModel('chat') === 'auto') {
          void orchestrateAndSend(text).finally(release);
        } else {
          void sendChatMessage(text).finally(release);
        }
      } else {
        void sendGeneration(text).finally(release);
      }
    },
    [currentMode, isStreaming, getCurrentModel, orchestrateAndSend, sendChatMessage, sendGeneration]
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
                  {m.role === 'assistant' && m.reasoningText && (
                    <ReasoningBlock text={m.reasoningText} active={!!m.thinking} />
                  )}
                  {m.content &&
                    (m.role === 'assistant' ? (
                      // Ответ ассистента — с поддержкой Markdown (GFM, код, таблицы)
                      <RichMessageRenderer content={m.content} />
                    ) : (
                      // Сообщение пользователя — обычный текст с сохранением переносов
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    ))}
                  {/* Нижний индикатор — только если нет живого блока размышлений */}
                  {m.streaming && !m.content && !(m.reasoningText && m.thinking) && (
                    <span className="inline-flex gap-1.5 items-center text-white/40">
                      <span className="inline-flex gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#7F77DD]/70 animate-bounce [animation-delay:-0.2s]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#7F77DD]/70 animate-bounce [animation-delay:-0.1s]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#7F77DD]/70 animate-bounce" />
                      </span>
                      {m.thinking ? 'думает…' : 'печатает…'}
                    </span>
                  )}
                  {/* Пульсирующая полоска «печатает» под растущим Markdown */}
                  {m.streaming && m.content && (
                    <span className="block w-2 h-3 mt-1 bg-white/40 animate-pulse" />
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
