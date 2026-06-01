'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, Zap } from '@/components/ui/icons';
import { useStudioStore, type ActiveJob } from '@/lib/stores/studio-store';
import { cn } from '@/lib/utils';

interface QueueRailProps {
  jobs: ActiveJob[];
  onCancel?: (id: string) => void;
}

const STATUS_DOT: Record<string, string> = {
  queued: 'bg-yellow-400',
  running: 'bg-[#7F77DD] animate-pulse',
  succeeded: 'bg-emerald-400',
  failed: 'bg-red-400',
};

const STATUS_LABEL: Record<string, string> = {
  queued: 'В очереди',
  running: 'Генерирую...',
  succeeded: 'Готово',
  failed: 'Ошибка',
};

interface JobRowProps {
  job: ActiveJob;
  onCancel?: (id: string) => void;
}

function JobRow({ job, onCancel }: JobRowProps) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
      {/* Thumbnail placeholder */}
      <div className="w-14 h-10 rounded-lg bg-white/10 flex-shrink-0 overflow-hidden relative">
        {job.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={job.thumbnail}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Zap className="h-3 w-3 text-white/30" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate">
          {job.modelName ?? job.modelSlug}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className={cn('w-1.5 h-1.5 rounded-full', STATUS_DOT[job.status] ?? 'bg-white/30')} />
          <span className="text-[10px] text-white/50">
            {STATUS_LABEL[job.status] ?? job.status}
          </span>
        </div>
      </div>

      {/* Cancel */}
      {(job.status === 'queued' || job.status === 'running') && onCancel && (
        <button
          onClick={() => onCancel(job.id)}
          className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          title="Отменить"
        >
          <X className="h-3 w-3 text-white/70" />
        </button>
      )}
    </div>
  );
}

export function QueueRail({ jobs, onCancel }: QueueRailProps) {
  const [isOpen, setIsOpen] = useState(false);
  const updateJob = useStudioStore((s) => s.updateJob);
  const removeFromQueue = useStudioStore((s) => s.removeFromQueue);
  const setActiveGeneration = useStudioStore((s) => s.setActiveGeneration);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Count actively running/queued jobs
  const activeCount = jobs.filter(
    (j) => j.status === 'queued' || j.status === 'running'
  ).length;

  // Auto-open when jobs arrive
  useEffect(() => {
    if (activeCount > 0) setIsOpen(true);
  }, [activeCount]);

  // Poll status for running/queued jobs
  useEffect(() => {
    const runningJobs = jobs.filter(
      (j) => j.status === 'queued' || j.status === 'running'
    );
    if (runningJobs.length === 0) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    pollingRef.current = setInterval(async () => {
      for (const job of runningJobs) {
        try {
          const res = await fetch(`/api/generate/status/${job.id}`, {
            credentials: 'include',
          });
          if (!res.ok) continue;
          const json = await res.json();
          const status = json.data?.status as string;

          if (status === 'done' || status === 'succeeded') {
            updateJob(job.id, { status: 'succeeded' });
            // Promote to active generation
            setActiveGeneration({
              id: job.id,
              modelSlug: job.modelSlug,
              mode: job.mode,
              status: 'succeeded',
              resultUrls: json.data?.resultUrl ? [json.data.resultUrl] : (json.data?.result_url ? [json.data.result_url] : []),
              outputType: 'video',
              createdAt: job.startedAt,
            });
            setTimeout(() => removeFromQueue(job.id), 3000);
          } else if (status === 'failed') {
            updateJob(job.id, { status: 'failed' });
            setTimeout(() => removeFromQueue(job.id), 5000);
          } else if (status === 'processing') {
            updateJob(job.id, { status: 'running' });
          }
        } catch {
          // silently ignore polling errors
        }
      }
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [jobs, updateJob, removeFromQueue, setActiveGeneration]);

  if (jobs.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 hidden lg:flex flex-col items-end gap-2">
      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-[300px] max-h-[60vh] overflow-y-auto bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 space-y-1"
          >
            <div className="flex items-center justify-between px-2 py-1 mb-1">
              <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                Очередь ({jobs.length})
              </span>
            </div>
            {jobs.map((job) => (
              <JobRow key={job.id} job={job} onCancel={onCancel} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen((v) => !v)}
        className="relative w-12 h-12 rounded-2xl bg-[#7F77DD] shadow-lg shadow-[#7F77DD]/30 flex items-center justify-center"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="chevron"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
            >
              <ChevronDown className="h-5 w-5 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="zap"
              initial={{ opacity: 0, rotate: 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -90 }}
            >
              <Zap className="h-5 w-5 text-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badge */}
        {activeCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white px-1"
          >
            {activeCount}
          </motion.span>
        )}
      </motion.button>
    </div>
  );
}
