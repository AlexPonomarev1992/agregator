'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X, Paperclip, ExternalLink } from '@/components/ui/icons';
import { WorksFeed } from '@/components/features/studio/WorksFeed';
import { useAgentStore } from '@/lib/stores/agent-store';
import type { AgentAttachment } from '@/lib/stores/agent-store';
import type { VibeAsset } from '@/components/features/studio/WorksFeed';
import Link from 'next/link';

interface ContextPanelProps {
  userId: string;
}

type PanelTab = 'files' | 'instructions' | 'gallery';

const ATTACHMENT_TYPE_COLORS: Record<AgentAttachment['type'], string> = {
  image: 'text-blue-400',
  video: 'text-purple-400',
  audio: 'text-green-400',
  document: 'text-orange-400',
};

function ContextFileChip({
  att,
  onRemove,
}: {
  att: AgentAttachment;
  onRemove: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 group"
    >
      {att.previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={att.previewUrl}
          alt={att.name}
          className="h-8 w-8 rounded object-cover flex-shrink-0"
        />
      ) : (
        <div className="h-8 w-8 rounded bg-white/10 flex items-center justify-center flex-shrink-0">
          <Paperclip className={cn('h-3.5 w-3.5', ATTACHMENT_TYPE_COLORS[att.type])} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-white/80 truncate">{att.name}</p>
        <p className="text-[10px] text-white/40 capitalize">{att.type}</p>
      </div>
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-white/70 transition-all"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

function FilesTab({ userId }: { userId: string }) {
  const { attachments, addAttachment, removeAttachment } = useAgentStore();
  const dropRef = useRef<HTMLDivElement>(null);

  function handleDragAsset(asset: VibeAsset) {
    addAttachment({
      id: asset.generationId,
      type: asset.type,
      url: asset.url,
      name: `Работа #${asset.generationId.slice(-6)}`,
      previewUrl: asset.type === 'image' ? asset.url : undefined,
      sourceGenerationId: asset.generationId,
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Drop zone */}
      <div
        ref={dropRef}
        className={cn(
          'min-h-[60px] rounded-xl border border-dashed border-white/10 p-2 transition-colors',
          'hover:border-white/20'
        )}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const raw = e.dataTransfer.getData('application/x-vibelab-asset');
          if (raw) {
            try {
              const asset = JSON.parse(raw) as VibeAsset;
              handleDragAsset(asset);
            } catch { /* ignore */ }
          }
        }}
      >
        <AnimatePresence mode="popLayout">
          {attachments.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[11px] text-white/25 text-center py-3"
            >
              Перетащите файлы сюда или загрузите через поле ввода
            </motion.p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {attachments.map((att) => (
                <ContextFileChip
                  key={att.id}
                  att={att}
                  onRemove={() => removeAttachment(att.id)}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Recent works from WorksFeed */}
      <div>
        <p className="text-[10px] text-white/30 uppercase tracking-wide mb-2">Недавние работы</p>
        <WorksFeed
          userId={userId}
          onDragToInput={handleDragAsset}
          compact={true}
        />
      </div>
    </div>
  );
}

function InstructionsTab() {
  const {
    instructions,
    instructionsEnabled,
    setInstructions,
    setInstructionsEnabled,
  } = useAgentStore();

  return (
    <div className="flex flex-col gap-3">
      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/60">Включить инструкции</span>
        <button
          onClick={() => setInstructionsEnabled(!instructionsEnabled)}
          className={cn(
            'relative w-9 h-5 rounded-full transition-colors',
            instructionsEnabled ? 'bg-[#7F77DD]' : 'bg-white/15'
          )}
        >
          <motion.div
            animate={{ x: instructionsEnabled ? 18 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
          />
        </button>
      </div>

      {/* Textarea */}
      <textarea
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        placeholder="Например: Отвечай всегда на русском языке. Избегай технического жаргона. Структурируй ответы маркерами..."
        className={cn(
          'w-full h-48 resize-none rounded-xl p-3 text-xs',
          'bg-white/5 border border-white/10 text-white/80 placeholder:text-white/25',
          'focus:outline-none focus:border-white/25 transition-colors',
          !instructionsEnabled && 'opacity-40 cursor-not-allowed'
        )}
        disabled={!instructionsEnabled}
        style={{ scrollbarWidth: 'none' }}
      />

      <p className="text-[10px] text-white/30 leading-relaxed">
        Эти инструкции будут применяться ко всем сообщениям в текущем чате
      </p>
    </div>
  );
}

function GalleryTab({ userId }: { userId: string }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Works grid — WorksFeed handles its own filter UI */}
      <WorksFeed
        userId={userId}
        compact={true}
      />

      {/* Open all link */}
      <Link
        href="/studio/history"
        className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/50 hover:text-white/80 transition-colors border border-white/8"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Открыть все работы
      </Link>
    </div>
  );
}

const TABS: { id: PanelTab; label: string }[] = [
  { id: 'files', label: 'Файлы' },
  { id: 'instructions', label: 'Инструкции' },
  { id: 'gallery', label: 'Галерея' },
];

export function ContextPanel({ userId }: ContextPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('files');

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center gap-1 relative flex-shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative flex-1 h-8 rounded-lg text-xs font-medium transition-colors z-10',
              activeTab === tab.id
                ? 'text-white'
                : 'text-white/40 hover:text-white/60'
            )}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="contextPanelTabBg"
                className="absolute inset-0 rounded-lg bg-white/10"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-0.5" style={{ scrollbarWidth: 'none' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'files' && <FilesTab userId={userId} />}
            {activeTab === 'instructions' && <InstructionsTab />}
            {activeTab === 'gallery' && <GalleryTab userId={userId} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
