'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, Maximize } from '@/components/ui/icons';

export function VideoPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="relative w-full aspect-video bg-zinc-950 flex items-center justify-center group">
      {/* Mock video background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 100%)',
        }}
      />

      {/* Play overlay */}
      {!isPlaying && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsPlaying(true)}
          className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30"
        >
          <Play className="h-7 w-7 text-white ml-1" />
        </motion.button>
      )}

      {/* Controls bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Timeline */}
        <div className="mb-2 h-1 w-full rounded-full bg-white/10 overflow-hidden">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: isPlaying ? '100%' : '0%' }}
            transition={isPlaying ? { duration: 10, ease: 'linear' } : {}}
            className="h-full bg-white rounded-full"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-white/80 hover:text-white transition-colors"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>

          <span className="text-[11px] text-white/50 tabular-nums">
            0:00 / 0:10
          </span>

          <div className="flex-1" />

          <button className="text-white/50 hover:text-white transition-colors">
            <Volume2 className="h-4 w-4" />
          </button>
          <button className="text-white/50 hover:text-white transition-colors">
            <Maximize className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
