'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Video, Image, UserCircle, Sparkles } from '@/components/ui/icons';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PromptInput } from './PromptInput';
import { TemplateGrid } from './TemplateGrid';
import { GenerationHistory } from './GenerationHistory';
import { GenerationPreview } from './GenerationPreview';
import { getCreditCost } from './CreditCostBadge';
import { useUserStore } from '@/lib/stores/user-store';
import type { Generation, GenerationType } from '@/types';

const TABS: { value: GenerationType; label: string; icon: typeof Video }[] = [
  { value: 'video', label: 'Видео', icon: Video },
  { value: 'photo', label: 'Фото', icon: Image },
  { value: 'avatar', label: 'Аватар', icon: UserCircle },
  { value: 'mascot', label: 'Маскот', icon: Sparkles },
];

// Map API camelCase generation to frontend snake_case type
interface ApiGeneration {
  id: string;
  userId: string;
  type: string;
  status: string;
  prompt: string;
  resultUrl: string | null;
  creditsSpent: number;
  provider: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

function mapGeneration(api: ApiGeneration): Generation {
  return {
    id: api.id,
    user_id: api.userId,
    type: api.type as GenerationType,
    status: api.status as Generation['status'],
    prompt: api.prompt,
    result_url: api.resultUrl,
    credits_spent: api.creditsSpent,
    provider: api.provider as Generation['provider'],
    metadata: api.metadata,
    created_at: api.createdAt,
    updated_at: api.updatedAt,
  };
}

export function GeneratorPage() {
  const [selectedType, setSelectedType] = useState<GenerationType>('video');
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewGeneration, setPreviewGeneration] = useState<Generation | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const counterRef = useRef(0);

  const deductCredits = useUserStore((s) => s.deductCredits);

  // Load generation history from API
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch('/api/generate/history?limit=20');
        if (res.ok) {
          const json = await res.json();
          const apiData: ApiGeneration[] = json.data ?? [];
          setGenerations(apiData.map(mapGeneration));
        }
      } catch (error) {
        console.error('[GeneratorPage] Failed to load history:', error);
      }
    }

    loadHistory();
  }, []);

  // Poll generation status until terminal state
  const pollStatus = useCallback(
    async (generationId: string) => {
      const MAX_POLLS = 60;
      const POLL_INTERVAL = 5000;

      for (let i = 0; i < MAX_POLLS; i++) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL));

        try {
          const res = await fetch(`/api/generate/status/${generationId}`, {
            credentials: 'include',
          });
          if (!res.ok) break;

          const json = await res.json();
          const updated = mapGeneration(json.data);

          setGenerations((prev) =>
            prev.map((g) => (g.id === generationId ? updated : g))
          );

          if (updated.status === 'done' || updated.status === 'failed') {
            if (updated.status === 'done') {
              deductCredits(updated.credits_spent);
            }
            break;
          }
        } catch {
          break;
        }
      }

      setIsGenerating(false);
    },
    [deductCredits]
  );

  const handleGenerate = useCallback(
    async (options: { aspectRatio: string; duration: string }) => {
      if (!prompt.trim() || isGenerating) return;

      setIsGenerating(true);
      const trimmedPrompt = prompt.trim();
      setPrompt('');

      try {
        // Determine API endpoint based on type
        const endpoint =
          selectedType === 'video' ? '/api/generate/video' : '/api/generate/photo';

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            prompt: trimmedPrompt,
            aspectRatio: options.aspectRatio,
            ...(selectedType === 'video'
              ? { duration: parseInt(options.duration) }
              : {}),
          }),
        });

        if (!res.ok) {
          const error = await res.json().catch(() => null);
          const errorMsg = error?.message || 'Ошибка генерации';
          console.error('[GeneratorPage] Generate error:', errorMsg);

          // Show failed generation in history
          counterRef.current += 1;
          const failedGen: Generation = {
            id: `gen-failed-${Date.now()}-${counterRef.current}`,
            user_id: 'current',
            type: selectedType,
            status: 'failed',
            prompt: trimmedPrompt,
            result_url: null,
            credits_spent: 0,
            provider: selectedType === 'video' ? 'kling' : 'nanobanana',
            metadata: { error: errorMsg },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setGenerations((prev) => [failedGen, ...prev]);
          setIsGenerating(false);
          return;
        }

        const json = await res.json();
        const generation = mapGeneration(json.data);
        setGenerations((prev) => [generation, ...prev]);

        // Start polling for status
        pollStatus(generation.id);
      } catch (error) {
        console.error('[GeneratorPage] Generate error:', error);
        setIsGenerating(false);
      }
    },
    [prompt, isGenerating, selectedType, pollStatus]
  );

  const handleSelectTemplate = useCallback((templatePrompt: string) => {
    setPrompt(templatePrompt);
  }, []);

  const handleSelectGeneration = useCallback((generation: Generation) => {
    setPreviewGeneration(generation);
    setPreviewOpen(true);
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      {/* Tabs header */}
      <Tabs
        value={selectedType}
        onValueChange={(v) => setSelectedType(v as GenerationType)}
      >
        <TabsList className="w-full sm:w-auto">
          {TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="gap-1.5">
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* All tab contents share the same layout */}
        {TABS.map(({ value }) => (
          <TabsContent key={value} value={value}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left / main area (2/3) */}
              <div className="lg:col-span-2 space-y-6">
                <PromptInput
                  type={selectedType}
                  prompt={prompt}
                  onPromptChange={setPrompt}
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                />
                <TemplateGrid onSelectTemplate={handleSelectTemplate} />
              </div>

              {/* Right panel (1/3) */}
              <div className="lg:col-span-1">
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
                  <GenerationHistory
                    generations={generations}
                    onSelectGeneration={handleSelectGeneration}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Preview dialog */}
      <GenerationPreview
        generation={previewGeneration}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
