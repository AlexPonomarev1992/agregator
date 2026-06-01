'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from '@/components/ui/icons';
import { ContentTabBar } from './ContentTabBar';
import { ModelGrid } from './ModelGrid';
import { HeroCarousel } from './HeroCarousel';
import { PlaygroundLayout } from './PlaygroundLayout';
import { aiModels, defaultVideoModel, defaultImageModel, contentTabModels } from '@/lib/mock/models';
import type { AIModel, ContentTab } from '@/types';

const tabLabels: Record<ContentTab, string> = {
  home: 'Главная',
  images: 'Изображения',
  video: 'Видео',
  carousels: 'Карусели',
  'creative-studio': 'Творческая студия',
};

export function ContentPage() {
  const [activeTab, setActiveTab] = useState<ContentTab>('home');
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);

  const filteredModels = activeTab === 'home' ? aiModels : contentTabModels(activeTab);

  const handleSelectModel = useCallback((model: AIModel) => {
    setSelectedModel(model);
  }, []);

  const handleBackToModels = useCallback(() => {
    setSelectedModel(null);
  }, []);

  const handleTabChange = useCallback((tab: ContentTab) => {
    setActiveTab(tab);
    setSelectedModel(null);
  }, []);

  // Playground mode — when a model is selected from grid (home, carousels, creative-studio)
  if (selectedModel) {
    return (
      <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
        <ContentTabBar activeTab={activeTab} onTabChange={handleTabChange} />
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 px-4 py-3 md:px-6 border-b border-white/5 shrink-0">
            <button
              onClick={handleBackToModels}
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              {tabLabels[activeTab]}
            </button>
            <ChevronRight className="h-3 w-3 text-white/30" />
            <span className="text-sm text-white font-medium">
              {selectedModel.name}
            </span>
          </div>

          <PlaygroundLayout
            model={selectedModel}
            onBack={handleBackToModels}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      <ContentTabBar activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Tab content */}
      {activeTab === 'home' ? (
        /* Home tab — hero carousel + all models */
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 space-y-6">
            <HeroCarousel onSelectModel={handleSelectModel} />
            <ModelGrid
              models={aiModels}
              onSelectModel={handleSelectModel}
            />
          </div>
        </div>
      ) : activeTab === 'video' ? (
        /* Video tab — playground with model selector */
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <PlaygroundLayout
            key="video-playground"
            model={defaultVideoModel}
            onBack={() => {}}
            availableModels={filteredModels}
          />
        </div>
      ) : activeTab === 'images' ? (
        /* Images tab — playground with model selector (like video) */
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <PlaygroundLayout
            key="images-playground"
            model={defaultImageModel}
            onBack={() => {}}
            availableModels={filteredModels}
          />
        </div>
      ) : (
        /* Other tabs — model grid */
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 space-y-6">
            <ModelGrid
              models={filteredModels}
              onSelectModel={handleSelectModel}
            />
          </div>
        </div>
      )}
    </div>
  );
}
