'use client';

import { motion } from 'framer-motion';
import { ArrowDownToLine, Clock, ImageIcon, Video, AlertCircle } from '@/components/ui/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

type OutputStatus = 'idle' | 'loading' | 'processing' | 'done' | 'failed';

interface OutputPanelProps {
  status: OutputStatus;
  isVideo: boolean;
  resultUrl?: string | null;
  errorMessage?: string | null;
}

export function OutputPanel({ status, isVideo, resultUrl, errorMessage }: OutputPanelProps) {
  return (
    <div className="p-4 md:p-6 space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white/80">Output</h3>
          {status === 'done' && (
            <Badge variant="purple" className="text-[10px]">
              {isVideo ? 'video' : 'image'}
            </Badge>
          )}
          {status === 'failed' && (
            <Badge variant="destructive" className="text-[10px]">
              ошибка
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-white/5 p-0.5">
          <span className="text-xs font-medium px-3 py-1 rounded-md bg-white text-white">
            Preview
          </span>
          <span className="text-xs font-medium px-3 py-1 rounded-md text-white/40">
            JSON
          </span>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden flex items-center justify-center min-h-[300px]">
        {status === 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 text-white/20"
          >
            {isVideo ? (
              <Video className="h-12 w-12" />
            ) : (
              <ImageIcon className="h-12 w-12" />
            )}
            <p className="text-sm">Результат появится здесь</p>
          </motion.div>
        )}

        {status === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 w-full px-8"
          >
            <Skeleton className="w-full aspect-video rounded-xl" />
            <p className="text-sm text-white/40 animate-pulse">Отправка запроса...</p>
          </motion.div>
        )}

        {status === 'processing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 w-full max-w-sm"
          >
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: '5%' }}
                animate={{ width: '90%' }}
                transition={{ duration: 60, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-white/40 to-white/20 rounded-full"
              />
            </div>
            <p className="text-sm text-white/40 animate-pulse">Генерация контента... Это может занять 1-3 минуты</p>
          </motion.div>
        )}

        {status === 'failed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 text-red-400/70 px-6 text-center"
          >
            <AlertCircle className="h-10 w-10" />
            <p className="text-sm">{errorMessage || 'Произошла ошибка при генерации'}</p>
          </motion.div>
        )}

        {status === 'done' && resultUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            {isVideo ? (
              <video
                src={resultUrl}
                controls
                autoPlay
                loop
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <div className="relative w-full h-full min-h-[300px] group cursor-zoom-in">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resultUrl}
                  alt="Результат генерации"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </motion.div>
        )}

        {status === 'done' && !resultUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 text-white/30"
          >
            <AlertCircle className="h-10 w-10" />
            <p className="text-sm">Генерация завершена, но результат недоступен</p>
          </motion.div>
        )}
      </div>

      {/* Bottom buttons */}
      <div className="flex items-center gap-3">
        {status === 'done' && resultUrl && (
          <Button
            variant="secondary"
            className="gap-2"
            onClick={async () => {
              try {
                const res = await fetch(resultUrl!);
                const blob = await res.blob();
                const ext = isVideo ? 'mp4' : 'png';
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `vibelab-${Date.now()}.${ext}`;
                a.click();
                URL.revokeObjectURL(url);
              } catch {
                window.open(resultUrl!, '_blank');
              }
            }}
          >
            <ArrowDownToLine className="h-4 w-4" />
            Скачать
          </Button>
        )}
        <Button
          variant="ghost"
          disabled={status === 'idle'}
          className="gap-2"
        >
          <Clock className="h-4 w-4" />
          Вся история
        </Button>
      </div>
    </div>
  );
}
