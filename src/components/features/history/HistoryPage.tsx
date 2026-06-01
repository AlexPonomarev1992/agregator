'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ImageIcon,
  Video,
  Clock,
  AlertCircle,
  Loader2,
  ArrowDownToLine,
  ChevronDown,
} from '@/components/ui/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'photo' | 'video';
type FilterStatus = 'all' | 'done' | 'failed' | 'processing';

interface GenerationItem {
  id: string;
  type: 'photo' | 'video' | 'avatar' | 'mascot';
  status: 'pending' | 'processing' | 'done' | 'failed';
  prompt: string;
  resultUrl: string | null;
  creditsSpent: number;
  provider: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export function HistoryPage() {
  const [generations, setGenerations] = useState<GenerationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedItem, setSelectedItem] = useState<GenerationItem | null>(null);
  const limit = 24;

  const loadGenerations = useCallback(async (pageNum: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/generate/history?page=${pageNum}&limit=${limit}`, {
        credentials: 'include',
      });
      if (!res.ok) return;

      const json = await res.json();
      setGenerations(json.data ?? []);
      setTotal(json.meta?.total ?? 0);
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGenerations(page);
  }, [page, loadGenerations]);

  const filtered = generations.filter((g) => {
    if (filterType !== 'all' && g.type !== filterType) return false;
    if (filterStatus !== 'all' && g.status !== filterStatus) return false;
    return true;
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="shrink-0 border-b border-white/5 px-4 py-4 md:px-6">
        <h1 className="text-lg font-semibold text-white mb-3">История генераций</h1>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <FilterChip
            label="Все"
            active={filterType === 'all'}
            onClick={() => setFilterType('all')}
          />
          <FilterChip
            label="Фото"
            active={filterType === 'photo'}
            onClick={() => setFilterType('photo')}
            icon={<ImageIcon className="h-3.5 w-3.5" />}
          />
          <FilterChip
            label="Видео"
            active={filterType === 'video'}
            onClick={() => setFilterType('video')}
            icon={<Video className="h-3.5 w-3.5" />}
          />

          <div className="w-px h-5 bg-white/10 mx-1" />

          <FilterChip
            label="Готово"
            active={filterStatus === 'done'}
            onClick={() => setFilterStatus(filterStatus === 'done' ? 'all' : 'done')}
          />
          <FilterChip
            label="Ошибки"
            active={filterStatus === 'failed'}
            onClick={() => setFilterStatus(filterStatus === 'failed' ? 'all' : 'failed')}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-white/30" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-white/20">
            <Clock className="h-10 w-10" />
            <p className="text-sm">Нет генераций</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              <AnimatePresence>
                {filtered.map((gen, i) => (
                  <motion.div
                    key={gen.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    <HistoryCard
                      item={gen}
                      onClick={() => setSelectedItem(gen)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="text-white/50"
                >
                  Назад
                </Button>
                <span className="text-sm text-white/40">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="text-white/50"
                >
                  Далее
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selectedItem && (
          <DetailModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/** Filter chip button */
function FilterChip({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
        active
          ? 'bg-white/15 text-white'
          : 'bg-white/5 text-white/40 hover:text-white/60 hover:bg-white/8'
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/** History card in grid */
function HistoryCard({
  item,
  onClick,
}: {
  item: GenerationItem;
  onClick: () => void;
}) {
  const isVideo = item.type === 'video';

  return (
    <button
      onClick={onClick}
      className="group relative w-full aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/5 hover:border-white/15 transition-all text-left"
    >
      {item.status === 'done' && item.resultUrl ? (
        isVideo ? (
          <video
            src={item.resultUrl}
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.resultUrl}
            alt={item.prompt}
            className="w-full h-full object-cover"
          />
        )
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {item.status === 'failed' ? (
            <AlertCircle className="h-6 w-6 text-red-400/50" />
          ) : (
            <Loader2 className="h-6 w-6 animate-spin text-white/20" />
          )}
        </div>
      )}

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <p className="text-[11px] text-white/80 line-clamp-2 leading-tight">{item.prompt}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            {isVideo ? (
              <Video className="h-3 w-3 text-white/40" />
            ) : (
              <ImageIcon className="h-3 w-3 text-white/40" />
            )}
            <span className="text-[10px] text-white/30">
              {new Date(item.createdAt).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Status badge */}
      {item.status !== 'done' && (
        <div className="absolute top-2 right-2">
          <Badge
            variant={item.status === 'failed' ? 'destructive' : 'default'}
            className="text-[9px] px-1.5 py-0.5"
          >
            {item.status === 'failed' ? 'Ошибка' : 'В процессе'}
          </Badge>
        </div>
      )}

      {/* Type icon */}
      {isVideo && item.status === 'done' && (
        <div className="absolute top-2 left-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
            <Video className="h-3 w-3 text-white/70" />
          </div>
        </div>
      )}
    </button>
  );
}

/** Detail modal for viewing a generation */
function DetailModal({
  item,
  onClose,
}: {
  item: GenerationItem;
  onClose: () => void;
}) {
  const isVideo = item.type === 'video';

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-4 md:inset-10 z-50 flex flex-col rounded-2xl border border-white/10 bg-[#0a0a12] overflow-hidden"
      >
        {/* Media */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden bg-black/30">
          {item.status === 'done' && item.resultUrl ? (
            isVideo ? (
              <video
                src={item.resultUrl}
                controls
                autoPlay
                loop
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.resultUrl}
                alt={item.prompt}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            )
          ) : (
            <div className="flex flex-col items-center gap-3 text-white/30">
              <AlertCircle className="h-10 w-10" />
              <p className="text-sm">
                {item.status === 'failed' ? 'Генерация не удалась' : 'В процессе...'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/5 px-5 py-4">
          <p className="text-sm text-white/70 mb-3 line-clamp-2">{item.prompt}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-white/30">
              <span className="flex items-center gap-1">
                {isVideo ? <Video className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
                {isVideo ? 'Видео' : 'Фото'}
              </span>
              <span>{item.creditsSpent} кредитов</span>
              <span>
                {new Date(item.createdAt).toLocaleString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {item.resultUrl && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={async () => {
                    try {
                      const res = await fetch(item.resultUrl!);
                      const blob = await res.blob();
                      const ext = item.type === 'video' ? 'mp4' : 'png';
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `vibelab-${Date.now()}.${ext}`;
                      a.click();
                      URL.revokeObjectURL(url);
                    } catch {
                      window.open(item.resultUrl!, '_blank');
                    }
                  }}
                >
                  <ArrowDownToLine className="h-3.5 w-3.5" />
                  Скачать
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose} className="text-xs text-white/50">
                Закрыть
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
