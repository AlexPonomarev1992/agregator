'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wand2 } from '@/components/ui/icons';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CreditCostBadge } from './CreditCostBadge';
import type { GenerationType } from '@/types';

type AspectRatio = '16:9' | '9:16' | '1:1';
type Duration = '5' | '10';

interface PromptInputProps {
  type: GenerationType;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: (options: { aspectRatio: AspectRatio; duration: Duration }) => void;
  isGenerating: boolean;
}

const MAX_CHARS = 500;

export function PromptInput({
  type,
  prompt,
  onPromptChange,
  onGenerate,
  isGenerating,
}: PromptInputProps) {
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [duration, setDuration] = useState<Duration>('5');

  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating) return;
    onGenerate({ aspectRatio, duration });
  };

  const aspectRatios: AspectRatio[] = ['16:9', '9:16', '1:1'];
  const durations: Duration[] = ['5', '10'];

  return (
    <div className="space-y-3">
      {/* Textarea with character counter */}
      <div className="relative">
        <Textarea
          value={prompt}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) {
              onPromptChange(e.target.value);
            }
          }}
          placeholder="Опишите что хотите создать..."
          className="min-h-[120px] pr-16 text-base backdrop-blur-md"
        />
        <span className="absolute right-3 top-2.5 text-xs text-white/30">
          {prompt.length}/{MAX_CHARS}
        </span>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Aspect ratio pills */}
        <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
          {aspectRatios.map((ratio) => (
            <button
              key={ratio}
              onClick={() => setAspectRatio(ratio)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                aspectRatio === ratio
                  ? 'bg-white text-black shadow-sm'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {ratio}
            </button>
          ))}
        </div>

        {/* Duration selector (video only) */}
        {type === 'video' && (
          <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
            {durations.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                  duration === d
                    ? 'bg-white text-black shadow-sm'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {d}с
              </button>
            ))}
          </div>
        )}

        {/* Credit cost */}
        <CreditCostBadge type={type} />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="gap-2"
          size="lg"
        >
          <motion.div
            animate={isGenerating ? { rotate: 360 } : {}}
            transition={isGenerating ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
          >
            <Wand2 className="h-4 w-4" />
          </motion.div>
          {isGenerating ? 'Генерация...' : 'Сгенерировать'}
        </Button>
      </div>
    </div>
  );
}
