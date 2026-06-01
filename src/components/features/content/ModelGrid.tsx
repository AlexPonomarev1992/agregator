'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { ModelCard } from './ModelCard';
import type { AIModel } from '@/types';

interface ModelGridProps {
  models: AIModel[];
  onSelectModel: (model: AIModel) => void;
}

export function ModelGrid({ models, onSelectModel }: ModelGridProps) {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? models.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.provider.toLowerCase().includes(search.toLowerCase()) ||
          m.description.toLowerCase().includes(search.toLowerCase())
      )
    : models;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Все модели ({filtered.length})
          </h2>
          <p className="text-xs text-white/40 mt-0.5">
            {filtered.length} {filtered.length === 1 ? 'модель найдена' : 'моделей найдено'}
          </p>
        </div>

        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск моделей..."
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((model, index) => (
          <motion.div
            key={model.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.3 }}
          >
            <ModelCard model={model} onClick={() => onSelectModel(model)} />
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-white/20">
          <p className="text-sm">Ничего не найдено</p>
        </div>
      )}
    </div>
  );
}
