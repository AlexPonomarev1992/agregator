'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MessageSquare,
  Image,
  Video,
  Brain,
  Code,
  PenTool,
  Sparkles,
  Wand2,
  Target,
  Zap,
  Loader2,
} from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import type { PresetMode } from '@/lib/featured-presets';

const ICON_OPTIONS = [
  { name: 'MessageSquare', Component: MessageSquare },
  { name: 'Image', Component: Image },
  { name: 'Video', Component: Video },
  { name: 'Brain', Component: Brain },
  { name: 'Code', Component: Code },
  { name: 'PenTool', Component: PenTool },
  { name: 'Sparkles', Component: Sparkles },
  { name: 'Wand2', Component: Wand2 },
  { name: 'Target', Component: Target },
  { name: 'Zap', Component: Zap },
] as const;

interface CreatePresetSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: PresetMode;
}

export function CreatePresetSheet({ open, onOpenChange, mode }: CreatePresetSheetProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Sparkles');
  const [promptTemplate, setPromptTemplate] = useState('');
  const [modelSlug, setModelSlug] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!title.trim()) { setError('Введите название пресета'); return; }
    setError(null);
    setIsSaving(true);
    try {
      await fetch('/api/studio/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          iconName: selectedIcon,
          mode,
          promptTemplate: mode === 'chat' ? promptTemplate.trim() : undefined,
          modelSlug: mode !== 'chat' ? modelSlug.trim() : undefined,
          isCustom: true,
        }),
      });
      // Reset form
      setTitle('');
      setDescription('');
      setPromptTemplate('');
      setModelSlug('');
      setSelectedIcon('Sparkles');
      onOpenChange(false);
    } catch {
      setError('Не удалось сохранить пресет');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Создать свой пресет</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/50">Название</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Мой пресет"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-colors"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/50">Описание (опционально)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание..."
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-colors"
            />
          </div>

          {/* Icon picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/50">Иконка</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map(({ name, Component }) => (
                <button
                  key={name}
                  onClick={() => setSelectedIcon(name)}
                  className={cn(
                    'w-9 h-9 flex items-center justify-center rounded-lg transition-colors',
                    selectedIcon === name
                      ? 'bg-[#7F77DD]/20 border border-[#7F77DD]/40 text-[#7F77DD]'
                      : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10'
                  )}
                >
                  <Component className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Mode-specific fields */}
          {mode === 'chat' ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/50">Шаблон промпта</label>
              <textarea
                value={promptTemplate}
                onChange={(e) => setPromptTemplate(e.target.value)}
                placeholder="Например: Напиши мне краткое резюме следующего текста:\n\n"
                rows={4}
                className="w-full resize-none px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-colors"
                style={{ scrollbarWidth: 'none' }}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/50">Слаг модели</label>
              <input
                value={modelSlug}
                onChange={(e) => setModelSlug(e.target.value)}
                placeholder="kling-3, flux-2-pro, suno-v5..."
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-colors"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          {/* Save button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              'w-full py-2.5 rounded-xl text-sm font-medium transition-colors',
              'bg-[#7F77DD] hover:bg-[#9490E5] text-white',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2'
            )}
          >
            {isSaving && <Loader2 className="h-4 w-4" />}
            {isSaving ? 'Сохраняем...' : 'Создать пресет'}
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
