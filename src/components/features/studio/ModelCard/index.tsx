'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Coins } from '@/components/ui/icons';
import { ModelBadge } from '../ModelBadge';
import type { ModelDefinition, ModelCategory } from '@/lib/models';
import { cn } from '@/lib/utils';

interface ModelCardProps {
  model: ModelDefinition;
  className?: string;
}

const CATEGORY_GRADIENTS: Record<ModelCategory, string> = {
  video: 'from-violet-900/60 via-purple-900/40 to-zinc-900/60',
  image: 'from-blue-900/60 via-indigo-900/40 to-zinc-900/60',
  audio: 'from-emerald-900/60 via-teal-900/40 to-zinc-900/60',
  music: 'from-pink-900/60 via-rose-900/40 to-zinc-900/60',
  utility: 'from-zinc-800/60 via-zinc-900/40 to-zinc-950/60',
};

const CATEGORY_ACCENT: Record<ModelCategory, string> = {
  video: 'text-violet-400',
  image: 'text-blue-400',
  audio: 'text-emerald-400',
  music: 'text-pink-400',
  utility: 'text-zinc-400',
};

const PROVIDER_LABELS: Record<string, string> = {
  kling: 'Kling',
  google: 'Google',
  flux: 'Black Forest Labs',
  suno: 'Suno',
  elevenlabs: 'ElevenLabs',
  bytedance: 'ByteDance',
  kie: 'KIE.ai',
  openai: 'OpenAI',
  ideogram: 'Ideogram',
};

export function ModelCard({ model, className }: ModelCardProps) {
  const router = useRouter();

  function handleClick() {
    router.push(`/studio/${model.slug}/${model.modes[0].id}`);
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={handleClick}
      className={cn(
        'group relative cursor-pointer rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden',
        className
      )}
    >
      {/* Preview area */}
      <div
        className={cn(
          'relative aspect-video w-full bg-gradient-to-br',
          CATEGORY_GRADIENTS[model.category]
        )}
      >
        {model.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={model.thumbnail}
            alt={model.name}
            className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : null}

        {/* Category indicator */}
        <div className="absolute left-2 top-2">
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-semibold bg-black/50 backdrop-blur-sm',
              CATEGORY_ACCENT[model.category]
            )}
          >
            {model.category}
          </span>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-sm font-medium text-white/90 border border-white/20 rounded-lg px-3 py-1.5 bg-white/10 backdrop-blur-sm">
            Открыть
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-3 space-y-2">
        <div>
          <h3 className="font-semibold text-white text-sm leading-tight">{model.name}</h3>
          <p className="text-[11px] text-white/40 mt-0.5">
            {PROVIDER_LABELS[model.provider] ?? model.provider}
          </p>
        </div>

        {/* Badges */}
        {model.badges.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {model.badges.map((badge) => (
              <ModelBadge key={badge} badge={badge} />
            ))}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-1 text-white/60">
          <Coins className="h-3 w-3" />
          <span className="text-[11px]">от {model.pricing.base} кредитов</span>
        </div>
      </div>
    </motion.div>
  );
}
