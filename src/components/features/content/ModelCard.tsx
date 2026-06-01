'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import type { AIModel } from '@/types';

interface ModelCardProps {
  model: AIModel;
  onClick: () => void;
}

export function ModelCard({ model, onClick }: ModelCardProps) {
  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden transition-shadow hover:shadow-lg hover:shadow-white/10 hover:border-white/20 group"
    >
      {/* Gradient thumbnail */}
      <div
        className="h-[180px] w-full transition-opacity group-hover:opacity-90"
        style={{ background: model.thumbnail }}
      />

      {/* Info section */}
      <div className="p-4 space-y-2">
        <p className="text-[11px] font-medium text-white/50 uppercase tracking-wide">
          {model.provider}
        </p>
        <h3 className="text-base font-semibold text-white">
          {model.name}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {model.tags.map((tag) => (
            <Badge key={tag} variant="default" className="text-[10px] px-2 py-0">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </motion.button>
  );
}
