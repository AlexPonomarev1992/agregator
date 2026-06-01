'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { UserCircleIcon, PlayIcon, PauseIcon, ArrowDownBigIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

export interface VoiceOption {
  id: string;
  name: string;
  description?: string;
  previewUrl?: string;
}

export interface VoiceSelectProps {
  value: string;
  onChange: (value: string) => void;
  voices: VoiceOption[];
  onPreview?: (voiceId: string) => void;
  playingId?: string | null;
}

export function VoiceSelect({ value, onChange, voices, onPreview, playingId }: VoiceSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedVoice = voices.find((v) => v.id === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl border bg-white/5 px-3 py-2.5 transition-all duration-150',
          isOpen ? 'border-[#7F77DD]/40' : 'border-white/10 hover:border-white/20'
        )}
      >
        <HugeiconsIcon icon={UserCircleIcon} size={18} color="rgba(255,255,255,0.5)" strokeWidth={1.5} />
        <div className="flex-1 text-left">
          {selectedVoice ? (
            <>
              <p className="text-sm text-white">{selectedVoice.name}</p>
              {selectedVoice.description && (
                <p className="text-[11px] text-white/40 truncate">{selectedVoice.description}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-white/40">Выбрать голос...</p>
          )}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <HugeiconsIcon icon={ArrowDownBigIcon} size={14} color="rgba(255,255,255,0.3)" strokeWidth={1.5} />
        </motion.div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1.5 left-0 right-0 z-50 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-zinc-900/95 backdrop-blur-md shadow-xl"
          >
            {voices.map((voice) => {
              const isSelected = value === voice.id;
              const isPlaying = playingId === voice.id;

              return (
                <div
                  key={voice.id}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors',
                    isSelected ? 'bg-[#7F77DD]/15' : 'hover:bg-white/5'
                  )}
                  onClick={() => { onChange(voice.id); setIsOpen(false); }}
                >
                  <HugeiconsIcon
                    icon={UserCircleIcon}
                    size={18}
                    color={isSelected ? '#7F77DD' : 'rgba(255,255,255,0.4)'}
                    strokeWidth={1.5}
                  />

                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm truncate', isSelected ? 'text-[#7F77DD]' : 'text-white/80')}>
                      {voice.name}
                    </p>
                    {voice.description && (
                      <p className="text-[11px] text-white/35 truncate">{voice.description}</p>
                    )}
                  </div>

                  {onPreview && voice.previewUrl && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onPreview(voice.id); }}
                      className={cn(
                        'shrink-0 text-white/30 hover:text-[#7F77DD] transition-colors',
                        isPlaying && 'text-[#7F77DD] animate-pulse'
                      )}
                    >
                      <HugeiconsIcon
                        icon={isPlaying ? PauseIcon : PlayIcon}
                        size={14}
                        color="currentColor"
                        strokeWidth={1.5}
                      />
                    </button>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
