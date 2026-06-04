'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, ChevronDown, Play, Pause } from '@/components/ui/icons';
import './styles.css';

/* ---------------------------------------------------------- useRafLoop */
function useRafLoop(cb: (now: number, dt: number) => void) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = now - last;
      last = now;
      cbRef.current(now, dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
}

/* --------------------------------------------------------------- Disc */
const SPIN_MAX = 0.4375;

function Disc({
  cover,
  title,
  isPlaying,
  isZoomed,
  onZoomToggle,
}: {
  cover?: string;
  title: string;
  isPlaying: boolean;
  isZoomed: boolean;
  onZoomToggle: () => void;
}) {
  const spinRef = useRef<HTMLDivElement>(null);
  const rotRef = useRef(0);
  const velRef = useRef(0);

  useRafLoop(() => {
    const el = spinRef.current;
    if (!el) return;
    if (isPlaying) velRef.current += (SPIN_MAX - velRef.current) * 0.2;
    else {
      velRef.current *= 0.96;
      if (velRef.current < 0.001) velRef.current = 0;
    }
    if (isZoomed) {
      const target = Math.round(rotRef.current / 360) * 360;
      const nx = rotRef.current + (target - rotRef.current) * 0.08;
      rotRef.current = Math.abs(target - nx) < 0.1 ? target : nx;
    } else {
      rotRef.current += velRef.current;
    }
    el.style.transform = `rotate(${rotRef.current}deg)`;
  });

  return (
    <div
      className={`mask ${isZoomed ? 'is-zoomed' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onZoomToggle();
      }}
    >
      <div className="spin" ref={spinRef}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={title} className="cover" draggable={false} />
        ) : null}
      </div>
      <div className="hole">
        <div className="hole-inner" />
      </div>
    </div>
  );
}

/* --------------------------------------------------------- ProgressBar */
function fmt(s: number): string {
  if (!isFinite(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

/* ------------------------------------------------------- VinylPlayer */
export function VinylPlayer({
  url,
  title,
  lyrics,
  thumbnailUrl,
}: {
  url: string;
  title?: string;
  lyrics?: string;
  thumbnailUrl?: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loopOne, setLoopOne] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  const trackTitle = title?.trim() || 'Трек';
  const hasLyrics = Boolean(lyrics && lyrics.trim());

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => {
      setCurrentTime(a.currentTime);
      if (a.duration) setDuration(a.duration);
    };
    const onMeta = () => setDuration(a.duration);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    return () => {
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = loopOne;
  }, [loopOne]);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  }, []);

  const seek = useCallback((pct: number) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    a.currentTime = pct * a.duration;
  }, []);

  const pct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="vinyl" onClick={() => setIsZoomed(false)}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} src={url} preload="metadata" />

      <div className="disc-wrap">
        <Disc
          cover={thumbnailUrl}
          title={trackTitle}
          isPlaying={isPlaying}
          isZoomed={isZoomed}
          onZoomToggle={() => setIsZoomed((z) => !z)}
        />
      </div>

      <div className="info">
        <div className="track-info">
          <div className="ti-layer">
            <p className="artist">VibeLab</p>
            <h2 className="track">{trackTitle}</h2>
          </div>
        </div>

        {/* Прогресс */}
        <div
          className="bar"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            seek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
          }}
        >
          <div className="bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="time">
          <span className="current">{fmt(currentTime)}</span>
          <span className="sep">/</span>
          <span className="total">{fmt(duration)}</span>
        </div>

        {/* Контролы */}
        <div className="controls">
          <button className="ctrl ctrl-play" onClick={toggle} aria-label={isPlaying ? 'Пауза' : 'Играть'}>
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button
            className={`ctrl ctrl-toggle ctrl-loop ${loopOne ? 'is-active mode-one' : ''}`}
            onClick={() => setLoopOne((v) => !v)}
            aria-label="Повтор"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 12V8a2 2 0 0 1 2-2h12" />
              <path d="M16 3l4 3l-4 3" />
              <path d="M20 12v4a2 2 0 0 1-2 2H6" />
              <path d="M8 21l-4-3l4-3" />
            </svg>
            <span className="loop-one">1</span>
          </button>
        </div>

        {/* Действия: скачать + текст */}
        <div className="actions">
          <a href={url} download target="_blank" rel="noopener noreferrer" className="act-btn">
            <Download className="h-3.5 w-3.5" />
            Скачать
          </a>
          {hasLyrics && (
            <button
              type="button"
              className={`act-btn ${showLyrics ? 'is-active' : ''}`}
              onClick={() => setShowLyrics((v) => !v)}
            >
              <FileText className="h-3.5 w-3.5" />
              Текст
              <ChevronDown className={`h-3.5 w-3.5 act-chevron ${showLyrics ? 'open' : ''}`} />
            </button>
          )}
        </div>

        {/* Текст песни */}
        <AnimatePresence initial={false}>
          {showLyrics && hasLyrics && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div className="lyrics-panel">
                <pre>{lyrics}</pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default VinylPlayer;
