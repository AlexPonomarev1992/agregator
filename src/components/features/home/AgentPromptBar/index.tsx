'use client';

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type KeyboardEvent,
  type DragEvent,
  type ChangeEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Wand2, Send, Paperclip, X, ChevronDown, Check } from '@/components/ui/icons';
import type { AgentMode, AgentAttachment } from '@/lib/stores/agent-store';
import { useAgentStore } from '@/lib/stores/agent-store';
import { AGENT_MODELS } from '@/lib/agent-models';
import { getModelsByCategory } from '@/lib/models';
import type { VibeAsset } from '@/components/features/studio/WorksFeed';

const SLASH_COMMANDS: Record<string, AgentMode> = {
  '/video': 'video',
  '/image': 'image',
  '/music': 'music',
  '/voice': 'tts',
  '/tts': 'tts',
  '/chat': 'chat',
};

const PLACEHOLDER_SUGGESTIONS = [
  'Создай рекламный ролик 9:16 для нового продукта…',
  'Напиши песню в стиле lo-fi с атмосферой дождливого вечера…',
  'Сделай 4 варианта логотипа в минималистичном стиле…',
];

const BADGE_COLORS: Record<string, string> = {
  FAST: 'bg-green-500/15 text-green-400',
  SMART: 'bg-[#7F77DD]/15 text-[#7F77DD]',
  NEW: 'bg-emerald-500/15 text-emerald-400',
  POPULAR: 'bg-orange-500/15 text-orange-400',
};

interface AgentPromptBarProps {
  value: string;
  onChange: (v: string) => void;
  onSend: (prompt: string) => void;
  onEnhance?: (prompt: string) => void;
  mode: AgentMode;
  onModeChange: (mode: AgentMode) => void;
  placeholder?: string;
  attachments: AgentAttachment[];
  onAddAttachment: (att: AgentAttachment) => void;
  onRemoveAttachment: (id: string) => void;
  isEnhancing?: boolean;
  costPreview?: number | null;
}

function AttachmentChip({
  att,
  onRemove,
}: {
  att: AgentAttachment;
  onRemove: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 border border-white/15 text-xs text-white/80"
    >
      {att.previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={att.previewUrl} alt={att.name} className="h-5 w-5 rounded object-cover" />
      ) : (
        <div className="h-5 w-5 rounded bg-white/10 flex items-center justify-center">
          <Paperclip className="h-2.5 w-2.5 text-white/50" />
        </div>
      )}
      <span className="max-w-[100px] truncate">{att.name}</span>
      <button
        onClick={onRemove}
        className="ml-0.5 text-white/40 hover:text-white/80 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );
}

/** Builds a display label for a generation model */
function genModelLabel(slug: string): string {
  const map: Record<string, string> = {
    'kling-3': 'Kling 3.0',
    'veo-31': 'Veo 3.1',
    'seedance-2': 'Seedance 2',
    'kling-26': 'Kling 2.6',
    'hailuo-23': 'Hailuo 2.3',
    'wan-27': 'Wan 2.7',
    'happyhorse-10': 'HappyHorse',
    'nano-banana-2': 'Nano Banana 2',
    'flux-2-pro': 'Flux 2 Pro',
    'ideogram-v3': 'Ideogram V3',
    'gpt-image-2': 'GPT Image 2',
    'gpt-image-15': 'GPT Image 1.5',
    'grok-imagine': 'Grok Imagine',
    'suno-v5': 'Suno V5',
    'elevenlabs-tts': 'ElevenLabs TTS',
  };
  return map[slug] ?? slug;
}

/** Mode-aware model selector */
function ModelSelector({ mode }: { mode: AgentMode }) {
  const { selectedModels, setSelectedModel } = useAgentStore();
  const [open, setOpen] = useState(false);

  // Stable reference to current selected model id
  const selectedId = selectedModels[mode] ?? '';

  if (mode === 'chat') {
    // LLM list
    const selected = AGENT_MODELS.find((m) => m.id === selectedId) ?? AGENT_MODELS[0];
    return (
      <div className="relative">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
            'bg-white/5 border border-white/10 hover:bg-white/10',
            'text-white/60 hover:text-white/80'
          )}
        >
          <span className="truncate max-w-[110px]">{selected?.name ?? 'Модель'}</span>
          <ChevronDown className="h-3 w-3 shrink-0 text-white/30" />
        </motion.button>

        <AnimatePresence>
          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.12 }}
                className={cn(
                  'absolute bottom-full left-0 mb-2 z-50 w-56',
                  'rounded-xl bg-zinc-900/95 backdrop-blur-xl border border-white/10',
                  'shadow-2xl shadow-black/50 py-1.5'
                )}
              >
                {AGENT_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel('chat', model.id);
                      setOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
                      'hover:bg-white/5',
                      selectedId === model.id ? 'text-white' : 'text-white/60 hover:text-white/80'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{model.name}</p>
                      <p className="text-[10px] text-white/30">{model.contextLength.toLocaleString()} ctx</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {model.badge && (
                        <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', BADGE_COLORS[model.badge] ?? '')}>
                          {model.badge}
                        </span>
                      )}
                      {selectedId === model.id && <Check className="h-3.5 w-3.5 text-[#7F77DD]" />}
                    </div>
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (mode === 'utility') {
    // Utility mode — no model selector needed
    return null;
  }

  // Generation modes: video / image / music / tts
  const categoryMap: Record<Exclude<AgentMode, 'chat' | 'utility'>, 'video' | 'image' | 'music' | 'audio'> = {
    video: 'video',
    image: 'image',
    music: 'music',
    tts: 'audio',
  };
  const category = categoryMap[mode as Exclude<AgentMode, 'chat' | 'utility'>];
  const genModels = getModelsByCategory(category).sort((a, b) => a.priority - b.priority);

  if (genModels.length === 0) return null;

  const currentLabel = genModelLabel(selectedId) || genModelLabel(genModels[0]?.slug ?? '');

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
          'bg-white/5 border border-white/10 hover:bg-white/10',
          'text-white/60 hover:text-white/80'
        )}
      >
        <span className="truncate max-w-[110px]">{currentLabel}</span>
        <ChevronDown className="h-3 w-3 shrink-0 text-white/30" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className={cn(
                'absolute bottom-full left-0 mb-2 z-50 w-52',
                'rounded-xl bg-zinc-900/95 backdrop-blur-xl border border-white/10',
                'shadow-2xl shadow-black/50 py-1.5'
              )}
            >
              {genModels.map((model) => (
                <button
                  key={model.slug}
                  onClick={() => {
                    setSelectedModel(mode, model.slug);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
                    'hover:bg-white/5',
                    selectedId === model.slug ? 'text-white' : 'text-white/60 hover:text-white/80'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{model.name}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {model.badges.length > 0 && (
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', BADGE_COLORS[model.badges[0]] ?? 'bg-white/10 text-white/40')}>
                        {model.badges[0]}
                      </span>
                    )}
                    {selectedId === model.slug && <Check className="h-3.5 w-3.5 text-[#7F77DD]" />}
                  </div>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AgentPromptBar({
  value,
  onChange,
  onSend,
  onEnhance,
  mode,
  placeholder,
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  isEnhancing = false,
  costPreview,
}: AgentPromptBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);

  // Rotate placeholder suggestions when prompt is empty
  useEffect(() => {
    if (value.length > 0) return;
    const id = setInterval(() => {
      setSuggestionIndex((i) => (i + 1) % PLACEHOLDER_SUGGESTIONS.length);
    }, 3500);
    return () => clearInterval(id);
  }, [value]);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (value.trim()) onSend(value.trim());
      }
    },
    [value, onSend]
  );

  function handleSendClick() {
    if (value.trim()) onSend(value.trim());
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);

    const vibelabRaw = e.dataTransfer.getData('application/x-vibelab-asset');
    if (vibelabRaw) {
      try {
        const asset = JSON.parse(vibelabRaw) as VibeAsset;
        onAddAttachment({
          id: asset.generationId,
          type: asset.type,
          url: asset.url,
          name: `Работа #${asset.generationId.slice(-6)}`,
          previewUrl: asset.type === 'image' ? asset.url : undefined,
          sourceGenerationId: asset.generationId,
        });
        return;
      } catch { /* fallthrough */ }
    }

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      const id = `file-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const url = URL.createObjectURL(file);
      const type: AgentAttachment['type'] = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
        ? 'video'
        : file.type.startsWith('audio/')
        ? 'audio'
        : 'document';

      onAddAttachment({ id, type, url, name: file.name, previewUrl: type === 'image' ? url : undefined });
    }
  }

  const hasContent = value.trim().length > 0 || attachments.length > 0;
  const charCount = value.length;
  const currentPlaceholder = placeholder ?? PLACEHOLDER_SUGGESTIONS[suggestionIndex];

  const firstWord = value.split(' ')[0];
  const slashMode = firstWord ? SLASH_COMMANDS[firstWord.toLowerCase()] : undefined;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative w-full rounded-2xl border bg-white/5 backdrop-blur-md transition-all duration-200',
        isDragOver
          ? 'border-[#7F77DD]/60 shadow-[0_0_0_2px_rgba(127,119,221,0.3)]'
          : 'border-white/10 hover:border-white/20 focus-within:border-white/25'
      )}
    >
      {/* Drag-over overlay */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 rounded-2xl bg-[#7F77DD]/10 flex items-center justify-center pointer-events-none"
          >
            <p className="text-sm text-[#7F77DD] font-medium">Перетащите сюда для добавления в контекст</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slash command hint */}
      <AnimatePresence>
        {slashMode && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute -top-8 left-3 px-2 py-1 rounded-lg bg-[#7F77DD]/20 border border-[#7F77DD]/40 text-xs text-[#7F77DD]"
          >
            Режим: {slashMode}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachment chips */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-1.5 px-3 pt-3"
          >
            {attachments.map((att) => (
              <AttachmentChip
                key={att.id}
                att={att}
                onRemove={() => onRemoveAttachment(att.id)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={currentPlaceholder}
        rows={1}
        className="w-full resize-none bg-transparent px-4 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none min-h-[52px] max-h-[200px]"
        style={{ scrollbarWidth: 'none' }}
      />

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-3 pb-3 gap-2">
        {/* Left: mode-aware model selector + enhance + char count */}
        <div className="flex items-center gap-2">
          <ModelSelector mode={mode} />

          {/* Enhance button */}
          {onEnhance && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onEnhance(value)}
              disabled={!value.trim() || isEnhancing}
              title="Улучшить промпт"
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                'bg-white/5 border border-white/10 hover:bg-white/10',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                isEnhancing && 'animate-pulse'
              )}
            >
              <Wand2 className="h-3.5 w-3.5 text-[#7F77DD]" />
              <span className="text-white/60">{isEnhancing ? 'Улучшаем…' : 'Улучшить'}</span>
            </motion.button>
          )}

          {charCount > 200 && (
            <span className={cn('text-[11px]', charCount > 4500 ? 'text-red-400' : 'text-white/30')}>
              {charCount}/5000
            </span>
          )}
        </div>

        {/* Right: cost preview + send */}
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {costPreview !== null && costPreview !== undefined && costPreview > 0 && (
              <motion.span
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="text-[11px] text-white/40"
              >
                ~{costPreview} кредитов
              </motion.span>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSendClick}
            disabled={!hasContent}
            title="Отправить (⌘+Enter)"
            className={cn(
              'flex items-center justify-center h-8 w-8 rounded-xl transition-all duration-150',
              hasContent
                ? 'bg-[#7F77DD] hover:bg-[#9490E5] text-white shadow-[0_2px_12px_rgba(127,119,221,0.4)]'
                : 'bg-white/5 text-white/20 cursor-not-allowed'
            )}
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
