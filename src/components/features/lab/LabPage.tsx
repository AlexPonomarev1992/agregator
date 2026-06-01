'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExperimentCard } from './ExperimentCard';
import { ExperimentDetail } from './ExperimentDetail';
import { XpProgressBar } from './XpProgressBar';
import { VibeCodeGame } from './VibeCodeGame';
import type { Experiment } from '@/types';

// API response uses camelCase from Drizzle
interface ApiExperiment {
  id: string;
  title: string;
  description: string | null;
  xpReward: number;
  isPublished: boolean;
  order: number;
  createdAt: string;
  userProgress: { status: string; xpEarned: number } | null;
}

// Map API camelCase to frontend snake_case type
function mapExperiment(api: ApiExperiment): Experiment {
  return {
    id: api.id,
    title: api.title,
    description: api.description ?? '',
    xp_reward: api.xpReward,
    is_published: api.isPublished,
    order: api.order,
    created_at: api.createdAt,
  };
}

type LabTab = 'game' | 'experiments';

export function LabPage() {
  const [activeTab, setActiveTab] = useState<LabTab>('game');
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, { status: string; xpEarned: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [totalXp, setTotalXp] = useState(0);

  useEffect(() => {
    async function loadExperiments() {
      try {
        const res = await fetch('/api/experiments');
        if (!res.ok) {
          setIsLoading(false);
          return;
        }
        const json = await res.json();
        const apiData: ApiExperiment[] = json.data ?? [];

        const mapped = apiData.map(mapExperiment);
        setExperiments(mapped);

        // Build progress map and compute completed + totalXp
        const progressMap: Record<string, { status: string; xpEarned: number }> = {};
        const completed: string[] = [];
        let xpSum = 0;

        for (const item of apiData) {
          if (item.userProgress) {
            progressMap[item.id] = item.userProgress;
            if (item.userProgress.status === 'completed') {
              completed.push(item.id);
              xpSum += item.userProgress.xpEarned;
            }
          }
        }

        setUserProgress(progressMap);
        setCompletedIds(completed);
        setTotalXp(xpSum);
      } catch (error) {
        console.error('[LabPage] Failed to load experiments:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadExperiments();
  }, []);

  const getExperimentStatus = (experimentId: string): 'not_started' | 'started' | 'completed' => {
    if (completedIds.includes(experimentId)) return 'completed';
    const progress = userProgress[experimentId];
    if (progress?.status === 'started') return 'started';
    return 'not_started';
  };

  const handleComplete = (experiment: Experiment) => {
    setCompletedIds((prev) => [...prev, experiment.id]);
    setTotalXp((prev) => prev + experiment.xp_reward);
  };

  // Experiments 5 and 6 are RoyalPass only (for demo)
  const royalPassIds = ['exp-005', 'exp-006'];

  const isGameTab = activeTab === 'game';

  return (
    <div className={isGameTab ? 'flex flex-col h-[calc(100dvh-56px)] lg:h-dvh overflow-hidden p-2 md:p-3 gap-2' : 'flex-1 overflow-y-auto p-4 pb-20 lg:p-6 lg:pb-6 space-y-6'}>
      <div className={`flex items-center shrink-0 ${isGameTab ? 'gap-3' : 'gap-4 flex-col items-start'}`}>
        {!isGameTab && <h1 className="text-2xl font-bold text-white">Лаборатория</h1>}

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('game')}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'game'
                ? 'bg-white text-black shadow-lg shadow-white/10'
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
            }`}
          >
            VibeCode
          </button>
          <button
            onClick={() => setActiveTab('experiments')}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'experiments'
                ? 'bg-white text-black shadow-lg shadow-white/10'
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
            }`}
          >
            Эксперименты
          </button>
        </div>
      </div>

      {isGameTab ? (
        <VibeCodeGame />
      ) : (
        <>
          <XpProgressBar totalXp={totalXp} />

          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
                <p className="text-sm text-white/50">Загрузка экспериментов...</p>
              </div>
            </div>
          ) : experiments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-12"
            >
              <p className="text-sm text-white/40">Пока нет доступных экспериментов</p>
              <p className="mt-2 text-xs text-white/30">Скоро здесь появятся новые эксперименты!</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {experiments.map((experiment, index) => (
                <ExperimentCard
                  key={experiment.id}
                  experiment={experiment}
                  status={getExperimentStatus(experiment.id)}
                  isLocked={royalPassIds.includes(experiment.id)}
                  index={index}
                  onClick={() => setSelectedExperiment(experiment)}
                />
              ))}
            </div>
          )}

          <ExperimentDetail
            experiment={selectedExperiment}
            status={selectedExperiment ? getExperimentStatus(selectedExperiment.id) : 'not_started'}
            onClose={() => setSelectedExperiment(null)}
            onComplete={handleComplete}
          />
        </>
      )}
    </div>
  );
}
