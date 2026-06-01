'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { getModel, calculatePrice } from '@/lib/models';
import { useStudioStore } from '@/lib/stores/studio-store';
import { useUserStore } from '@/lib/stores/user-store';
import { ModelHeader } from '@/components/features/studio/ModelHeader';
import { DynamicForm } from '@/components/features/studio/DynamicForm';
import { ResultArea } from '@/components/features/studio/ResultArea';
import { WorksFeed } from '@/components/features/studio/WorksFeed';
import { QueueRail } from '@/components/features/studio/QueueRail';
import type { VibeAsset } from '@/components/features/studio/WorksFeed';

// Stable empty object reference — used as fallback for missing form state.
// Required to avoid infinite re-render loop (React #185) from selector returning new {} each call.
const EMPTY_VALUES: Record<string, unknown> = Object.freeze({});

interface PageProps {
  params: { modelSlug: string; mode: string };
}

export default function StudioWorkspacePage({ params }: PageProps) {
  const { modelSlug, mode: modeId } = params;
  const router = useRouter();

  const model = getModel(modelSlug);

  // Validate model and mode exist
  if (!model) {
    notFound();
  }

  const currentMode = model.modes.find((m) => m.id === modeId);
  if (!currentMode) {
    notFound();
  }

  // Zustand state
  const storeKey = `${modelSlug}:${modeId}`;
  // NB: select raw map entry (stable reference) to avoid new {} on every render → React #185.
  const formValuesRaw = useStudioStore((s) => s.formValues[storeKey]);
  const formValues = formValuesRaw ?? EMPTY_VALUES;
  const setFormValues = useStudioStore((s) => s.setFormValues);
  const activeGeneration = useStudioStore((s) => s.activeGeneration);
  const setActiveGeneration = useStudioStore((s) => s.setActiveGeneration);
  const addToQueue = useStudioStore((s) => s.addToQueue);
  const queue = useStudioStore((s) => s.queue);
  const removeFromQueue = useStudioStore((s) => s.removeFromQueue);

  const user = useUserStore((s) => s.user);
  const credits = useUserStore((s) => s.credits);

  // Mode change via router navigation
  function handleModeChange(newModeId: string) {
    router.push(`/studio/${modelSlug}/${newModeId}`);
  }

  // File/asset dropped from WorksFeed into PromptInput or FileUpload
  const handleDragToInput = useCallback(
    (asset: VibeAsset) => {
      const current = formValues;
      if (asset.type === 'image') {
        // Try to populate imageUrl field
        setFormValues(storeKey, { ...current, imageUrl: asset.url });
      } else if (asset.type === 'video') {
        setFormValues(storeKey, { ...current, videoUrl: asset.url });
      } else if (asset.type === 'audio') {
        setFormValues(storeKey, { ...current, audioUrl: asset.url });
      }
    },
    [formValues, setFormValues, storeKey]
  );

  // Also handle useAsInput from ResultArea / ResultCard
  function handleUseAsInput(url: string, type: 'video' | 'image' | 'audio') {
    handleDragToInput({ type, url, generationId: '', mimeType: '', prompt: '' });
  }

  // Submit form — call API
  const handleSubmit = useCallback(
    async (values: Record<string, unknown>) => {
      try {
        const res = await fetch('/api/generate/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            modelSlug,
            mode: modeId,
            parameters: values,
          }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({})) as { message?: string };
          console.error('[StudioWorkspace] Generate failed:', errJson.message);
          return;
        }

        const json = await res.json() as { data?: { id?: string; status?: string } };
        const genId = json.data?.id as string | undefined;
        if (!genId) return;

        const job = {
          id: genId,
          modelSlug,
          mode: modeId,
          status: 'queued' as const,
          startedAt: new Date().toISOString(),
          modelName: model.name,
        };

        addToQueue(job);
        setActiveGeneration({
          id: genId,
          modelSlug,
          mode: modeId,
          status: 'queued',
          outputType: model.outputs.type,
        });
      } catch (err) {
        console.error('[StudioWorkspace] Submit error:', err);
      }
    },
    [modelSlug, modeId, model, addToQueue, setActiveGeneration]
  );

  function handleCancel() {
    setActiveGeneration(null);
  }

  // Clear stale active generation when switching models
  useEffect(() => {
    if (activeGeneration && activeGeneration.modelSlug !== modelSlug) {
      setActiveGeneration(null);
    }
  }, [modelSlug, activeGeneration, setActiveGeneration]);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden">
      {/* Model header */}
      <ModelHeader
        model={model}
        activeMode={modeId}
        onChangeMode={handleModeChange}
        onChangeModel={() => router.push('/studio')}
        currentCredits={credits?.balance}
      />

      {/* Main workspace grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-0 flex-1 overflow-hidden">
        {/* Left panel: form */}
        <aside className="overflow-y-auto border-r border-white/5 bg-zinc-950/60 p-4">
          <DynamicForm
            mode={currentMode}
            defaultValues={formValues}
            onValuesChange={(values) => setFormValues(storeKey, values)}
            onSubmit={handleSubmit}
            userCredits={credits?.balance ?? 0}
            modelPrice={(params) => calculatePrice(model, params).credits}
          />
        </aside>

        {/* Right panel: result + feed */}
        <main className="flex flex-col gap-4 p-4 overflow-hidden">
          {/* Result area */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <ResultArea
              activeGeneration={activeGeneration}
              onUseAsInput={handleUseAsInput}
              onCancel={handleCancel}
            />
          </div>

          {/* Works feed — drag sources */}
          <div className="flex-shrink-0 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm p-3">
            <WorksFeed
              userId={user?.id ?? ''}
              modelSlug={modelSlug}
              onDragToInput={handleDragToInput}
              compact={true}
            />
          </div>
        </main>
      </div>

      {/* Queue rail — floating bottom-right */}
      <QueueRail
        jobs={queue}
        onCancel={removeFromQueue}
      />
    </div>
  );
}
