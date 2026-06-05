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
import { ImageWorkspace } from '@/components/features/studio/ImageWorkspace';
import type { VibeAsset } from '@/components/features/studio/WorksFeed';

const EMPTY_VALUES: Record<string, unknown> = Object.freeze({});

interface PageProps {
  params: { modelSlug: string; mode: string };
}

export default function StudioWorkspacePage({ params }: PageProps) {
  const { modelSlug, mode: modeId } = params;
  const router = useRouter();

  const model = getModel(modelSlug);
  if (!model) notFound();

  const currentMode = model.modes.find((m) => m.id === modeId);
  if (!currentMode) notFound();

  // ── Image models get the dedicated ImageWorkspace ──────────────────────────
  if (model.category === 'image') {
    return (
      <ImageWorkspace
        model={model}
        modeId={modeId}
        onChangeMode={(id) => router.push(`/studio/${modelSlug}/${id}`)}
        onChangeModel={() => router.push('/studio')}
      />
    );
  }

  // ── Generic workspace for video / audio / music ───────────────────────────
  return (
    <GenericWorkspace
      modelSlug={modelSlug}
      modeId={modeId}
      onChangeMode={(id) => router.push(`/studio/${modelSlug}/${id}`)}
      onChangeModel={() => router.push('/studio')}
    />
  );
}

// ─── Generic workspace (video / music / audio) ────────────────────────────────

function GenericWorkspace({
  modelSlug,
  modeId,
  onChangeMode,
  onChangeModel,
}: {
  modelSlug: string;
  modeId: string;
  onChangeMode: (id: string) => void;
  onChangeModel: () => void;
}) {
  const model = getModel(modelSlug)!;
  const currentMode = model.modes.find((m) => m.id === modeId)!;

  const storeKey = `${modelSlug}:${modeId}`;
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

  const handleDragToInput = useCallback(
    (asset: VibeAsset) => {
      const current = formValues;
      if (asset.type === 'image') {
        setFormValues(storeKey, { ...current, imageUrl: asset.url });
      } else if (asset.type === 'video') {
        setFormValues(storeKey, { ...current, videoUrl: asset.url });
      } else if (asset.type === 'audio') {
        setFormValues(storeKey, { ...current, audioUrl: asset.url });
      }
    },
    [formValues, setFormValues, storeKey]
  );

  function handleUseAsInput(url: string, type: 'video' | 'image' | 'audio') {
    handleDragToInput({ type, url, generationId: '', mimeType: '', prompt: '' });
  }

  const handleSubmit = useCallback(
    async (values: Record<string, unknown>) => {
      try {
        const res = await fetch('/api/studio/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ modelSlug, mode: modeId, parameters: values }),
        });

        if (!res.ok) {
          let msg = 'Ошибка запуска генерации';
          try {
            const err = (await res.json()) as { error?: { message?: string } };
            if (err.error?.message) msg = err.error.message;
          } catch { /* skip */ }
          console.error('[GenericWorkspace] Generate failed:', msg);
          return;
        }

        const json = (await res.json()) as {
          data?: { generationId?: string; id?: string; status?: string };
        };
        const genId = json.data?.generationId ?? json.data?.id;
        if (!genId) return;

        addToQueue({
          id: genId,
          modelSlug,
          mode: modeId,
          status: 'queued',
          startedAt: new Date().toISOString(),
          modelName: model.name,
        });
        setActiveGeneration({
          id: genId,
          modelSlug,
          mode: modeId,
          status: 'queued',
          outputType: model.outputs.type,
        });
      } catch (err) {
        console.error('[GenericWorkspace] Submit error:', err);
      }
    },
    [modelSlug, modeId, model, addToQueue, setActiveGeneration]
  );

  // Clear stale active generation when switching models
  useEffect(() => {
    if (activeGeneration && activeGeneration.modelSlug !== modelSlug) {
      setActiveGeneration(null);
    }
  }, [modelSlug, activeGeneration, setActiveGeneration]);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden">
      <ModelHeader
        model={model}
        activeMode={modeId}
        onChangeMode={onChangeMode}
        onChangeModel={onChangeModel}
        currentCredits={credits?.balance}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-0 flex-1 overflow-hidden">
        <aside className="overflow-y-auto border-r border-white/5 bg-zinc-950/60 p-4">
          <DynamicForm
            mode={currentMode}
            defaultValues={formValues}
            onValuesChange={(values) => setFormValues(storeKey, values)}
            onSubmit={handleSubmit}
            userCredits={credits?.balance ?? 0}
            modelPrice={(p) => calculatePrice(model, p).credits}
          />
        </aside>

        <main className="flex flex-col gap-4 p-4 overflow-hidden">
          <div className="flex-1 overflow-y-auto min-h-0">
            <ResultArea
              activeGeneration={activeGeneration}
              onUseAsInput={handleUseAsInput}
              onCancel={() => setActiveGeneration(null)}
            />
          </div>
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

      <QueueRail jobs={queue} onCancel={removeFromQueue} />
    </div>
  );
}
