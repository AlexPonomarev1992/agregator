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
  chat: 'claude-sonnet-4',
  video: 'kling-3',
  image: 'nano-banana-2',
  music: 'suno-v5',
  tts: 'elevenlabs-tts',
  utility: 'kling-3',
};

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
      selectedAgentModel: 'claude-sonnet-4',
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
