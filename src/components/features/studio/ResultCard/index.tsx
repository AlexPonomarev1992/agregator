'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  RefreshCw,
  Share2,
  ArrowUpRight,
  Play,
  Pause,
} from '@/components/ui/icons';
import type { Generation } from '@/types';
import type { VibeAsset } from '../WorksFeed';

interface ResultCardProps {
  generation: Generation;
  onDownload?: () => void;
  onRegenerate?: () => void;
  onUseAsInput?: (asset: VibeAsset) => void;
  onShare?: () => void;
}

function AudioWaveformSVG() {
  const bars = [3, 8, 5, 12, 7, 15, 6, 11, 9, 14, 4, 10, 7, 13, 5, 8, 12, 6, 9, 4];
  return (
    <svg
      viewBox="0 0 80 20"
      className="w-full h-8 text-[#7F77DD]/60"
      fill="currentColor"
    >
      {bars.map((h, i) => (
        <rect
          key={i}
          x={i * 4}
          y={(20 - h) / 2}
          width={2.5}
          height={h}
          rx={1.25}
        />
      ))}
    </svg>
  );
}

export function ResultCard({ generation, onDownload, onRegenerate, onUseAsInput, onShare }: ResultCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const url = generation.result_url;
  const outputType = generation.type === 'video' ? 'video' : generation.type === 'photo' ? 'image' : 'audio';

  function getMimeType(): string {
    if (!url) return 'application/octet-stream';
    if (url.endsWith('.mp4') || url.endsWith('.webm')) return 'video/mp4';
    if (url.endsWith('.mp3') || url.endsWith('.wav')) return 'audio/mpeg';
    if (url.endsWith('.png')) return 'image/png';
    if (url.endsWith('.webp')) return 'image/webp';
    return 'image/jpeg';
  }

  function handleUseAsInput() {
    if (!url || !onUseAsInput) return;
    onUseAsInput({
      type: outputType,
      url,
      generationId: generation.id,
      mimeType: getMimeType(),
      prompt: generation.prompt,
    });
  }

  function handleDownload() {
    if (!url) return;
    if (onDownload) {
      onDownload();
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.download = `vibelab-${generation.id}`;
      a.target = '_blank';
      a.click();
    }
  }

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-white/10 bg-zinc-900/80 group"
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
    >
      {/* Media content */}
      {outputType === 'video' && url ? (
        <video
          src={url}
          className="w-full aspect-video object-cover"
          controls={false}
          loop
          muted={false}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          id={`result-video-${generation.id}`}
        />
      ) : outputType === 'image' && url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={generation.prompt.slice(0, 80)}
          className="w-full aspect-video object-cover"
        />
      ) : outputType === 'audio' ? (
        <div className="w-full p-6 flex flex-col gap-3">
          <AudioWaveformSVG />
          {url && (
            <audio
              src={url}
              controls
              className="w-full h-8 opacity-60"
            />
          )}
        </div>
      ) : (
        <div className="aspect-video w-full flex items-center justify-center bg-zinc-900">
          <span className="text-white/30 text-sm">Результат недоступен</span>
        </div>
      )}

      {/* Play/pause overlay for video */}
      {outputType === 'video' && url && (
        <button
          onClick={() => {
            const vid = document.getElementById(`result-video-${generation.id}`) as HTMLVideoElement | null;
            if (!vid) return;
            if (isPlaying) {
              vid.pause();
            } else {
              vid.play();
            }
          }}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm border border-white/20">
            {isPlaying ? (
              <Pause className="h-5 w-5 text-white" />
            ) : (
              <Play className="h-5 w-5 text-white" />
            )}
          </div>
        </button>
      )}

      {/* Action overlay */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex gap-2 justify-end"
          >
            <button
              onClick={handleDownload}
              title="Скачать"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Скачать
            </button>

            {onUseAsInput && (
              <button
                onClick={handleUseAsInput}
                title="Использовать как входные данные"
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-[#7F77DD]/20 hover:bg-[#7F77DD]/30 text-[#7F77DD] border border-[#7F77DD]/30 transition-colors"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                Использовать
              </button>
            )}

            {onRegenerate && (
              <button
                onClick={onRegenerate}
                title="Повторить"
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )}

            {onShare && (
              <button
                onClick={onShare}
                title="Поделиться"
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt */}
      <div className="px-3 py-2 border-t border-white/5">
        <p className="text-xs text-white/40 line-clamp-1">{generation.prompt}</p>
      </div>
    </div>
  );
}
