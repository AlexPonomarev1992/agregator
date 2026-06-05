'use client';

import { useCallback, useRef, useState } from 'react';
import { calculatePrice } from '@/lib/models';
import type { ModelDefinition } from '@/lib/models/types';
import type { ModeDefinition } from '@/lib/models/types';
import { DynamicForm } from '../DynamicForm';
import { ModelHeader } from '../ModelHeader';
import { QueueRail } from '../QueueRail';
import { ImageChatPanel } from '../ImageChatPanel';
import type { ImageEntry } from '../ImageChatPanel';
import { useStudioStore } from '@/lib/stores/studio-store';
import { useUserStore } from '@/lib/stores/user-store';
import { cn } from '@/lib/utils';

// Stable empty values reference — prevents React #185 re-render loop
const EMPTY: Record<string, unknown> = Object.freeze({});

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

interface ImageWorkspaceProps {
  model: ModelDefinition;
  modeId: string;
  onChangeMode: (id: string) => void;
  onChangeModel: () => void;
}

export function ImageWorkspace({
  model,
  modeId,
  onChangeMode,
  onChangeModel,
}: ImageWorkspaceProps) {
  const currentMode = model.modes.find((m) => m.id === modeId) as ModeDefinition;

  const storeKey = `${model.slug}:${modeId}`;
  const formValuesRaw = useStudioStore((s) => s.formValues[storeKey]);
  const formValues = formValuesRaw ?? EMPTY;
  const setFormValues = useStudioStore((s) => s.setFormValues);
  const queue = useStudioStore((s) => s.queue);
  const addToQueue = useStudioStore((s) => s.addToQueue);
  const removeFromQueue = useStudioStore((s) => s.removeFromQueue);

  const user = useUserStore((s) => s.user);
  const credits = useUserStore((s) => s.credits);

  const [entries, setEntries] = useState<ImageEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Ref so poll callbacks always read fresh state
  const isGeneratingRef = useRef(false);

  // ── Status polling ──────────────────────────────────────────────────────────
  const pollEntry = useCallback(
    async (localId: string, generationId: string) => {
      for (let i = 0; i < 60; i++) {
        await sleep(i < 4 ? 2000 : 4000);
        try {
          const res = await fetch(`/api/studio/status/${generationId}`, {
            credentials: 'include',
          });
          if (!res.ok) continue;
          const json = (await res.json()) as {
            data?: {
              status?: string;
              resultUrls?: string[];
              errorMessage?: string | null;
              errorCode?: string | null;
            };
          };
          const st = json.data?.status;
          const urls = json.data?.resultUrls ?? [];

          if (st === 'succeeded' && urls.length > 0) {
            setEntries((prev) =>
              prev.map((e) =>
                e.id === localId
                  ? { ...e, status: 'succeeded', imageUrl: urls[0] }
                  : e
              )
            );
            setIsGenerating(false);
            isGeneratingRef.current = false;
            return;
          }

          if (st === 'failed') {
            setEntries((prev) =>
              prev.map((e) =>
                e.id === localId
                  ? {
                      ...e,
                      status: 'failed',
                      errorMessage: json.data?.errorMessage ?? 'Ошибка генерации',
                    }
                  : e
              )
            );
            setIsGenerating(false);
            isGeneratingRef.current = false;
            return;
          }
        } catch {
          // transient error — retry
        }
      }
      // timeout
      setEntries((prev) =>
        prev.map((e) =>
          e.id === localId
            ? { ...e, status: 'failed', errorMessage: 'Превышено время ожидания' }
            : e
        )
      );
      setIsGenerating(false);
      isGeneratingRef.current = false;
    },
    []
  );

  // ── Core dispatch ───────────────────────────────────────────────────────────
  const dispatch = useCallback(
    async (
      values: Record<string, unknown>,
      prompt: string,
      parentGenerationId?: string
    ) => {
      if (isGeneratingRef.current) return;
      isGeneratingRef.current = true;
      setIsGenerating(true);

      const aspectRatio = typeof values.aspectRatio === 'string' ? values.aspectRatio : undefined;
      const localId = `img-${Date.now()}`;
      setEntries((prev) => [
        ...prev,
        { id: localId, prompt, status: 'queued', createdAt: Date.now(), aspectRatio },
      ]);

      try {
        const res = await fetch('/api/studio/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            modelSlug: model.slug,
            mode: modeId,
            parameters: values,
            ...(parentGenerationId ? { parentGenerationId } : {}),
          }),
        });

        if (!res.ok) {
          let msg = 'Ошибка запуска генерации';
          try {
            const err = (await res.json()) as { error?: { message?: string } };
            if (err.error?.message) msg = err.error.message;
          } catch { /* skip */ }
          setEntries((prev) =>
            prev.map((e) => (e.id === localId ? { ...e, status: 'failed', errorMessage: msg } : e))
          );
          setIsGenerating(false);
          isGeneratingRef.current = false;
          return;
        }

        const json = (await res.json()) as { data?: { generationId?: string; id?: string } };
        const generationId = json.data?.generationId ?? json.data?.id;

        if (!generationId) {
          setEntries((prev) =>
            prev.map((e) =>
              e.id === localId ? { ...e, status: 'failed', errorMessage: 'Нет ID задачи' } : e
            )
          );
          setIsGenerating(false);
          isGeneratingRef.current = false;
          return;
        }

        // Update local entry + add to global queue
        setEntries((prev) =>
          prev.map((e) =>
            e.id === localId ? { ...e, status: 'running', generationId } : e
          )
        );
        addToQueue({
          id: generationId,
          modelSlug: model.slug,
          mode: modeId,
          status: 'queued',
          startedAt: new Date().toISOString(),
          modelName: model.name,
        });

        void pollEntry(localId, generationId);
      } catch {
        setEntries((prev) =>
          prev.map((e) =>
            e.id === localId ? { ...e, status: 'failed', errorMessage: 'Ошибка соединения' } : e
          )
        );
        setIsGenerating(false);
        isGeneratingRef.current = false;
      }
    },
    [model.slug, model.name, modeId, addToQueue, pollEntry]
  );

  // ── Form submit (initial generation from full form) ─────────────────────────
  const handleFormSubmit = useCallback(
    async (values: Record<string, unknown>) => {
      const prompt = String(values.prompt ?? values.text ?? '');
      await dispatch(values, prompt);
    },
    [dispatch]
  );

  // ── Chat send (iteration from chat bar) ─────────────────────────────────────
  const handleChatSend = useCallback(
    async (text: string) => {
      const lastSucceeded = [...entries].reverse().find((e) => e.status === 'succeeded');
      const parentId = lastSucceeded?.generationId;

      // Pass previous image as input so the model modifies it (true i2i iteration)
      const values: Record<string, unknown> = {
        ...formValues,
        prompt: text,
        ...(lastSucceeded?.imageUrl ? { imageInput: [lastSucceeded.imageUrl] } : {}),
      };
      setFormValues(storeKey, values);

      await dispatch(values, text, parentId);
    },
    [entries, formValues, storeKey, setFormValues, dispatch]
  );

  // ── Enhance prompt via AI ───────────────────────────────────────────────────
  const handleEnhance = useCallback(async (prompt: string): Promise<string> => {
    try {
      const res = await fetch('/api/studio/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt, mode: 'image' }),
      });
      if (!res.ok) return prompt;
      const json = (await res.json()) as { data?: { prompt?: string } };
      return json.data?.prompt ?? prompt;
    } catch {
      return prompt;
    }
  }, []);

  // ── Regenerate (retry same prompt) ─────────────────────────────────────────
  const handleRegenerate = useCallback(
    async (entry: ImageEntry) => {
      const parentId = entry.generationId;
      const values = { ...formValues, prompt: entry.prompt };
      await dispatch(values, entry.prompt, parentId);
    },
    [formValues, dispatch]
  );

  const handleDownload = useCallback((_url: string) => {
    // download handled by <a download> in ImageDisplay
  }, []);

  const handleUseAsInput = useCallback(
    (url: string) => {
      // Inject image URL into the form as imageInput/imageUrl param
      const updated = { ...formValues, imageInput: [url] };
      setFormValues(storeKey, updated);
    },
    [formValues, storeKey, setFormValues]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden">
      {/* Header */}
      <ModelHeader
        model={model}
        activeMode={modeId}
        onChangeMode={onChangeMode}
        onChangeModel={onChangeModel}
        currentCredits={credits?.balance}
      />

      {/* Main workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] flex-1 overflow-hidden">
        {/* ── Left: Parameters form ──────────────────── */}
        <aside className={cn(
          'overflow-y-auto border-r border-white/5',
          'bg-zinc-950/60 p-4',
        )}>
          <DynamicForm
            mode={currentMode}
            defaultValues={formValues}
            onValuesChange={(v) => setFormValues(storeKey, v)}
            onSubmit={handleFormSubmit}
            userCredits={credits?.balance ?? 0}
            modelPrice={(p) => calculatePrice(model, p).credits}
          />
        </aside>

        {/* ── Right: Image + Chat ────────────────────── */}
        <main className="flex flex-col overflow-hidden bg-zinc-950/40">
          <ImageChatPanel
            entries={entries}
            isGenerating={isGenerating}
            aspectRatio={typeof formValues.aspectRatio === 'string' ? formValues.aspectRatio : undefined}
            onSend={handleChatSend}
            onEnhance={handleEnhance}
            onDownload={handleDownload}
            onUseAsInput={handleUseAsInput}
            onRegenerate={handleRegenerate}
          />
        </main>
      </div>

      {/* Floating job queue */}
      <QueueRail jobs={queue} onCancel={removeFromQueue} />
    </div>
  );
}
