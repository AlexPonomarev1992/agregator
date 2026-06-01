'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { PRESETS_BY_MODE, type FeaturedPreset, type PresetMode } from '@/lib/featured-presets';
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
  FileText,
  Search,
  Globe,
  Plus,
} from '@/components/ui/icons';
import type { LucideIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { useAgentStore } from '@/lib/stores/agent-store';
import { CreatePresetSheet } from '../CreatePresetSheet';

const BADGE_COLORS: Record<string, string> = {
  POPULAR: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  NEW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  TREND: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const ICON_MAP: Record<string, LucideIcon> = {
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
  FileText,
  Search,
  Globe,
  Mic: Sparkles, // fallback to Sparkles for Mic
  Music: Zap,    // fallback to Zap for Music
};

// currentPrompt prop kept for interface compat — preset card reads from store directly
interface PresetsRowProps {
  currentPrompt?: string;
}

function PresetCard({ preset }: { preset: FeaturedPreset }) {
  const router = useRouter();
  const { setPendingPrompt } = useAgentStore();
  const IconComponent = preset.iconName ? (ICON_MAP[preset.iconName] ?? Sparkles) : Sparkles;

  function handleClick() {
    if (preset.mode === 'chat') {
      // Insert promptTemplate into the prompt bar
      if (preset.promptTemplate) {
        setPendingPrompt(preset.promptTemplate);
      }
      return;
    }

    // Non-chat modes: navigate to studio
    const params = new URLSearchParams();
    const defaultPrompt = String(
      (preset.parameters?.prompt as string | undefined) ?? ''
    );
    if (defaultPrompt) params.set('prompt', defaultPrompt);
    const qs = params.toString();
    router.push(`/studio/${preset.modelSlug}${qs ? `?${qs}` : ''}`);
  }

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleClick}
      className={cn(
        'group relative flex-shrink-0 w-[180px] h-[130px] rounded-xl overflow-hidden',
        'bg-white/5 border border-white/10 hover:border-white/20',
        'flex flex-col items-center justify-center gap-2 p-3',
        'transition-colors duration-200 backdrop-blur-sm'
      )}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#7F77DD]/8 to-transparent" />

      {/* Badge */}
      {preset.badge && (
        <div className="absolute top-2 right-2 z-10">
          <span
            className={cn(
              'text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide',
              BADGE_COLORS[preset.badge] ?? 'bg-white/10 text-white/60 border-white/20'
            )}
          >
            {preset.badge}
          </span>
        </div>
      )}

      {/* Icon */}
      <IconComponent className="relative z-10 h-7 w-7 text-white/70 group-hover:text-white transition-colors" />

      {/* Title */}
      <p className="relative z-10 text-sm font-medium text-white text-center leading-tight line-clamp-2">
        {preset.title}
      </p>

      {/* Description */}
      <p className="relative z-10 text-xs text-white/40 text-center line-clamp-2 leading-tight">
        {preset.description}
      </p>
    </motion.button>
  );
}

function CreatePresetCard({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        'flex-shrink-0 w-[180px] h-[130px] rounded-xl',
        'flex flex-col items-center justify-center gap-2',
        'border-2 border-dashed border-white/15 hover:border-white/30',
        'text-white/30 hover:text-white/60 transition-colors duration-200'
      )}
    >
      <Plus className="h-7 w-7" />
      <p className="text-sm font-medium text-center">Создать свой пресет</p>
    </motion.button>
  );
}

export function PresetsRow({ currentPrompt: _currentPrompt }: PresetsRowProps) {
  const currentMode = useAgentStore((s) => s.currentMode);
  const [sheetOpen, setSheetOpen] = useState(false);
  const presets = PRESETS_BY_MODE[currentMode as PresetMode] ?? PRESETS_BY_MODE.chat;

  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="text-xs text-white/40 font-medium uppercase tracking-wide">Готовые пресеты</p>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMode}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
            className={cn(
              'flex gap-2.5 overflow-x-auto pb-2',
              'scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none]',
              '[&::-webkit-scrollbar]:hidden'
            )}
          >
            {presets.map((preset, i) => (
              <motion.div
                key={preset.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <PresetCard preset={preset} />
              </motion.div>
            ))}

            {/* Create preset card at the end */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: presets.length * 0.04 }}
            >
              <CreatePresetCard onClick={() => setSheetOpen(true)} />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <CreatePresetSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={currentMode as PresetMode}
      />
    </>
  );
}
