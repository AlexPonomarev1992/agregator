'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Play, Pause, Download } from '@/components/ui/icons';

function fmt(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#7F77DD]">
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

function IconSkipBack() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} fill="currentColor" viewBox="0 0 16 16">
      <path d="M.5 3.5A.5.5 0 0 0 0 4v8a.5.5 0 0 0 1 0V8.753l6.267 3.636c.54.313 1.233-.066 1.233-.697v-2.94l6.267 3.636c.54.314 1.233-.065 1.233-.696V4.308c0-.63-.693-1.01-1.233-.696L8.5 7.248v-2.94c0-.63-.692-1.01-1.233-.696L1 7.248V4a.5.5 0 0 0-.5-.5" />
    </svg>
  );
}

function IconSkipForward() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} fill="currentColor" viewBox="0 0 16 16">
      <path d="M15.5 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V8.753l-6.267 3.636c-.54.313-1.233-.066-1.233-.697v-2.94l-6.267 3.636C.693 12.703 0 12.324 0 11.693V4.308c0-.63.693-1.01 1.233-.696L7.5 7.248v-2.94c0-.63.693-1.01 1.233-.696L15 7.248V4a.5.5 0 0 1 .5-.5" />
    </svg>
  );
}

export function TtsPlayer({ url, voiceName }: { url: string; voiceName?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const displayName = voiceName?.trim() || 'Голос';
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const remaining = Math.max(0, duration - currentTime);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    const onTime = () => {
      setCurrentTime(a.currentTime);
      if (a.duration) setDuration(a.duration);
    };
    const onMeta = () => { if (a.duration) setDuration(a.duration); };
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('ended', onEnded);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    return () => {
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
    };
  }, []);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  }, []);

  const skip = useCallback((delta: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(a.duration || 0, a.currentTime + delta));
  }, []);

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * (a.duration || 0);
  }, []);

  return (
    <div className="w-full max-w-[340px] rounded-2xl overflow-hidden bg-zinc-900 border border-white/8 shadow-2xl shadow-black/50">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} src={url} preload="metadata" />

      {/* Track info */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2.5">
        <div className="shrink-0 w-[52px] h-[52px] rounded-xl bg-[#7F77DD]/10 border border-[#7F77DD]/20 flex items-center justify-center">
          <MicIcon />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{displayName}</p>
          <p className="text-xs text-white/35 mt-0.5">ElevenLabs · VibeLab TTS</p>
        </div>
      </div>

      {/* Time + Progress */}
      <div className="px-4 pb-2">
        <div className="flex justify-between mb-1.5">
          <span className="text-[10px] tabular-nums text-white/35">{fmt(currentTime)}</span>
          <span className="text-[10px] tabular-nums text-white/35">-{fmt(remaining)}</span>
        </div>
        <div
          className="relative h-1.5 rounded-full bg-white/10 cursor-pointer group"
          onClick={seek}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#7F77DD] to-[#a59ef5] transition-[width] duration-100"
            style={{ width: `${pct}%` }}
          />
          <div
            className={cn(
              'absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md',
              'opacity-0 group-hover:opacity-100 transition-opacity',
            )}
            style={{ left: `calc(${pct}% - 6px)` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center px-4 pb-4 pt-1">
        <div className="flex items-center gap-3 flex-1 justify-center">
          <button
            onClick={() => skip(-10)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/40 hover:text-white/75 hover:bg-white/8 transition-colors"
            aria-label="−10 секунд"
          >
            <IconSkipBack />
          </button>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={toggle}
            className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#7F77DD] hover:bg-[#6e66cc] text-white shadow-lg shadow-[#7F77DD]/25 transition-colors"
            aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </motion.button>

          <button
            onClick={() => skip(10)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/40 hover:text-white/75 hover:bg-white/8 transition-colors"
            aria-label="+10 секунд"
          >
            <IconSkipForward />
          </button>
        </div>

        <a
          href={url}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white/6 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white/80 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Скачать
        </a>
      </div>
    </div>
  );
}
