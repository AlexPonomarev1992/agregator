'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AgentMode = 'chat' | 'video' | 'image' | 'music' | 'tts' | 'utility';

export interface AgentAttachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  name: string;
  previewUrl?: string;
  sourceGenerationId?: string;
}

/** Per-mode model defaults */
const DEFAULT_SELECTED_MODELS: Record<AgentMode, string> = {
  chat: 'auto',
  video: 'kling-3',
  image: 'nano-banana-2',
  music: 'suno-v5',
  tts: 'elevenlabs-tts',
  utility: 'kling-3',
};

/** Актуальные chat-модели, известные UI. Должны совпадать с AGENT_MODELS. */
const VALID_CHAT_MODELS = new Set([
  'auto',
  'claude-opus-4-8',
  'gpt-5-5',
  'gemini-3-5-flash',
]);

interface AgentContextStore {
  attachments: AgentAttachment[];
  currentMode: AgentMode;
  currentProjectId: string | null;
  /** Currently open chat ID — synced with ?chat= URL param */
  currentChatId: string | null;
  pendingPrompt: string;
  instructions: string;
  instructionsEnabled: boolean;
  /** Legacy single-model field kept for backward compat */
  selectedAgentModel: string;
  /** Per-mode selected model map */
  selectedModels: Record<AgentMode, string>;
  // Actions
  addAttachment: (att: AgentAttachment) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
  setMode: (mode: AgentMode) => void;
  setProject: (id: string | null) => void;
  setCurrentChatId: (id: string | null) => void;
  setPendingPrompt: (p: string) => void;
  setInstructions: (text: string) => void;
  setInstructionsEnabled: (b: boolean) => void;
  /** Legacy setter — updates selectedAgentModel and selectedModels.chat */
  setSelectedAgentModel: (id: string) => void;
  /** Per-mode setter */
  setSelectedModel: (mode: AgentMode, modelId: string) => void;
  /** Helper: get model id for current or given mode */
  getCurrentModel: (mode?: AgentMode) => string;
}

export const useAgentStore = create<AgentContextStore>()(
  persist(
    (set, get) => ({
      attachments: [],
      currentMode: 'chat',
      currentProjectId: null,
      currentChatId: null,
      pendingPrompt: '',
      instructions: '',
      instructionsEnabled: false,
      selectedAgentModel: 'auto',
      selectedModels: { ...DEFAULT_SELECTED_MODELS },

      addAttachment: (att) =>
        set((state) => ({
          attachments: state.attachments.some((a) => a.id === att.id)
            ? state.attachments
            : [...state.attachments, att],
        })),

      removeAttachment: (id) =>
        set((state) => ({
          attachments: state.attachments.filter((a) => a.id !== id),
        })),

      clearAttachments: () => set({ attachments: [] }),

      setMode: (mode) =>
        set((state) => ({
          currentMode: mode,
          // Keep legacy field in sync with chat model when switching to chat
          selectedAgentModel:
            mode === 'chat' ? state.selectedModels.chat : state.selectedAgentModel,
        })),

      setProject: (id) => set({ currentProjectId: id }),

      setCurrentChatId: (id) => set({ currentChatId: id }),

      setPendingPrompt: (p) => set({ pendingPrompt: p }),

      setInstructions: (text) => set({ instructions: text }),

      setInstructionsEnabled: (b) => set({ instructionsEnabled: b }),

      setSelectedAgentModel: (id) =>
        set((state) => ({
          selectedAgentModel: id,
          selectedModels: { ...state.selectedModels, chat: id },
        })),

      setSelectedModel: (mode, modelId) =>
        set((state) => ({
          selectedModels: { ...state.selectedModels, [mode]: modelId },
          // Also keep legacy field in sync
          selectedAgentModel:
            mode === 'chat' ? modelId : state.selectedAgentModel,
        })),

      getCurrentModel: (mode) => {
        const s = get();
        const m = mode ?? s.currentMode;
        return s.selectedModels[m] ?? DEFAULT_SELECTED_MODELS[m];
      },
    }),
    {
      name: 'vibelab-agent-context',
      // v2: chat-каталог сокращён до 3 моделей (claude-opus-4-8, gpt-5-5,
      // gemini-3-5-flash). Старые сохранённые id (claude-sonnet-4, gpt-4o
      // и т.п.) больше не существуют — мигрируем на новый default.
      // v3: дефолт — Kimi K2.6. v4: дефолт — авто-режим `auto` (оркестратор на
      // Kimi). Прежние дефолты (claude-opus-4-8, kimi-k2-6) и невалидные id
      // переводим на `auto`.
      version: 4,
      migrate: (persisted: unknown, version: number) => {
        if (!persisted || typeof persisted !== 'object') return persisted;
        const s = persisted as Partial<AgentContextStore>;
        if (version < 2) {
          const chat = s.selectedModels?.chat;
          if (!chat || !VALID_CHAT_MODELS.has(chat)) {
            s.selectedAgentModel = 'claude-opus-4-8';
            s.selectedModels = {
              ...(s.selectedModels ?? DEFAULT_SELECTED_MODELS),
              chat: 'claude-opus-4-8',
            };
          }
        }
        if (version < 4) {
          const chat = s.selectedModels?.chat;
          // Невалидный id или прежний дефолт (claude-opus-4-8 / kimi-k2-6) → auto.
          const stale =
            !chat ||
            !VALID_CHAT_MODELS.has(chat) ||
            chat === 'claude-opus-4-8' ||
            chat === 'kimi-k2-6';
          if (stale) {
            s.selectedModels = {
              ...(s.selectedModels ?? DEFAULT_SELECTED_MODELS),
              chat: 'auto',
            };
            if (
              !s.selectedAgentModel ||
              s.selectedAgentModel === 'claude-opus-4-8' ||
              s.selectedAgentModel === 'kimi-k2-6'
            ) {
              s.selectedAgentModel = 'auto';
            }
          }
        }
        return s;
      },
      partialize: (state) => ({
        attachments: state.attachments,
        currentMode: state.currentMode,
        currentProjectId: state.currentProjectId,
        currentChatId: state.currentChatId,
        instructions: state.instructions,
        instructionsEnabled: state.instructionsEnabled,
        selectedAgentModel: state.selectedAgentModel,
        selectedModels: state.selectedModels,
      }),
    }
  )
);
