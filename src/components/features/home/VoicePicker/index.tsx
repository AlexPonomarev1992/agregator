'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Play, Pause, ChevronDown, Check } from '@/components/ui/icons';
import { useAgentStore } from '@/lib/stores/agent-store';
import { TTS_VOICES, TTS_VOICE_PREVIEW_URL } from '@/lib/models/registry/elevenlabs-tts';

const GENDER_LABELS: Record<string, string> = {
  male: 'Мужские',
  female: 'Женские',
  character: 'Персонажи',
};

const GENDER_ORDER = ['male', 'female', 'character'] as const;

function WaveformBars({ active }: { active: boolean }) {
  return (
    <span className="inline-flex items-end gap-px h-3.5 shrink-0">
      {[0.6, 1, 0.7, 0.9, 0.5].map((h, i) => (
        <motion.span
          key={i}
          className="w-0.5 rounded-full bg-[#7F77DD]"
          animate={active ? {
            scaleY: [h, 1, h * 0.4, 0.9, h],
          } : { scaleY: h }}
          transition={active ? {
            duration: 0.6 + i * 0.07,
            repeat: Infinity,
            ease: 'easeInOut',
          } : { duration: 0.2 }}
          style={{ height: '14px', transformOrigin: 'bottom' }}
        />
      ))}
    </span>
  );
}

export function VoicePicker() {
  const { ttsVoiceId, setTtsVoiceId } = useAgentStore();
  const [open, setOpen] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentVoice = TTS_VOICES.find((v) => v.id === ttsVoiceId) ?? TTS_VOICES[0]!;

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setPlayingId(null);
  }, []);

  const togglePreview = useCallback(
    (e: React.MouseEvent, voiceId: string) => {
      e.stopPropagation();
      if (playingId === voiceId) {
        stopAudio();
        return;
      }
      stopAudio();
      const audio = new Audio(TTS_VOICE_PREVIEW_URL(voiceId));
      audioRef.current = audio;
      audio.play().catch(() => {});
      setPlayingId(voiceId);
      audio.onended = () => setPlayingId(null);
    },
    [playingId, stopAudio]
  );

  // Stop audio when popover closes
  useEffect(() => {
    if (!open) stopAudio();
  }, [open, stopAudio]);

  // Cleanup on unmount
  useEffect(() => () => stopAudio(), [stopAudio]);

  return (
    <div className="relative">
      {/* Trigger button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
          'bg-white/5 border border-white/10 hover:bg-white/10',
          'text-white/60 hover:text-white/80'
        )}
      >
        {playingId === ttsVoiceId ? (
          <WaveformBars active />
        ) : (
          <span className="h-3.5 w-3.5 shrink-0 flex items-center justify-center text-[#7F77DD]">
            <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5">
              <rect x="1" y="4" width="2" height="6" rx="1" fill="currentColor" opacity="0.6" />
              <rect x="4.5" y="2" width="2" height="10" rx="1" fill="currentColor" />
              <rect x="8" y="3.5" width="2" height="7" rx="1" fill="currentColor" opacity="0.8" />
              <rect x="11.5" y="5" width="2" height="4" rx="1" fill="currentColor" opacity="0.5" />
            </svg>
          </span>
        )}
        <span className="max-w-[80px] truncate">{currentVoice.name}</span>
        <ChevronDown
          className={cn(
            'h-3 w-3 shrink-0 text-white/30 transition-transform duration-150',
            open && 'rotate-180'
          )}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 6 }}
              transition={{ duration: 0.13 }}
              className={cn(
                'absolute bottom-full left-0 mb-2 z-50 w-72',
                'rounded-xl bg-zinc-900/98 backdrop-blur-xl border border-white/10',
                'shadow-2xl shadow-black/60 overflow-hidden'
              )}
            >
              <div className="px-3 pt-2.5 pb-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-white/30">
                  Выберите голос
                </p>
              </div>

              <div className="max-h-72 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                {GENDER_ORDER.map((gender) => {
                  const voices = TTS_VOICES.filter((v) => v.gender === gender);
                  if (voices.length === 0) return null;
                  return (
                    <div key={gender}>
                      <div className="px-3 py-1.5">
                        <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">
                          {GENDER_LABELS[gender]}
                        </span>
                      </div>
                      {voices.map((voice) => {
                        const isSelected = ttsVoiceId === voice.id;
                        const isPlaying = playingId === voice.id;
                        return (
                          <button
                            key={voice.id}
                            onClick={() => {
                              setTtsVoiceId(voice.id);
                              setOpen(false);
                            }}
                            className={cn(
                              'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
                              'hover:bg-white/5',
                              isSelected ? 'text-white' : 'text-white/60 hover:text-white/80'
                            )}
                          >
                            {/* Play/stop preview */}
                            <button
                              onClick={(e) => togglePreview(e, voice.id)}
                              className={cn(
                                'shrink-0 h-6 w-6 rounded-full flex items-center justify-center transition-colors',
                                isPlaying
                                  ? 'bg-[#7F77DD]/20 text-[#7F77DD]'
                                  : 'bg-white/8 text-white/40 hover:bg-white/15 hover:text-white/80'
                              )}
                            >
                              {isPlaying ? (
                                <Pause className="h-2.5 w-2.5" />
                              ) : (
                                <Play className="h-2.5 w-2.5" />
                              )}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-medium truncate">{voice.name}</p>
                                {isPlaying && <WaveformBars active />}
                              </div>
                              <p className="text-[10px] text-white/30 truncate">{voice.description}</p>
                            </div>

                            {isSelected && (
                              <Check className="h-3.5 w-3.5 shrink-0 text-[#7F77DD]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-white/5 px-3 py-2">
                <p className="text-[9px] text-white/20">
                  ▶ — предпрослушать голос перед генерацией
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
