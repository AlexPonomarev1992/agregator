'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ActiveJob {
  id: string;
  modelSlug: string;
  mode: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  thumbnail?: string;
  startedAt: string;
  modelName?: string;
}

export interface ActiveGeneration {
  id: string;
  modelSlug: string;
  mode: string;
  status: string;
  resultUrls?: string[];
  outputType?: 'video' | 'image' | 'audio';
  prompt?: string;
  createdAt?: string;
}

interface StudioState {
  // Form values persisted per model:mode key
  formValues: Record<string, Record<string, unknown>>;
  // Currently active (latest) generation result
  activeGeneration: ActiveGeneration | null;
  // Queue of running/queued jobs
  queue: ActiveJob[];

  setFormValues(key: string, values: Record<string, unknown>): void;
  getFormValues(key: string): Record<string, unknown>;
  setActiveGeneration(gen: ActiveGeneration | null): void;
  addToQueue(job: ActiveJob): void;
  updateJob(id: string, partial: Partial<ActiveJob>): void;
  removeFromQueue(id: string): void;
  clearQueue(): void;
}

export const useStudioStore = create<StudioState>()(
  persist(
    (set, get) => ({
      formValues: {},
      activeGeneration: null,
      queue: [],

      setFormValues(key, values) {
        set((state) => ({
          formValues: { ...state.formValues, [key]: values },
        }));
      },

      getFormValues(key) {
        return get().formValues[key] ?? {};
      },

      setActiveGeneration(gen) {
        set({ activeGeneration: gen });
      },

      addToQueue(job) {
        set((state) => ({
          queue: [job, ...state.queue],
        }));
      },

      updateJob(id, partial) {
        set((state) => ({
          queue: state.queue.map((j) => (j.id === id ? { ...j, ...partial } : j)),
        }));
      },

      removeFromQueue(id) {
        set((state) => ({
          queue: state.queue.filter((j) => j.id !== id),
        }));
      },

      clearQueue() {
        set({ queue: [] });
      },
    }),
    {
      name: 'vibelab-studio',
      // Only persist form values, not active generation or queue
      partialize: (state) => ({ formValues: state.formValues }),
    }
  )
);
