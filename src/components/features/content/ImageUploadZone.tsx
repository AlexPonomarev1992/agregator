'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, ImageIcon, Film } from '@/components/ui/icons';

interface ImageUploadZoneProps {
  label: string;
  hasFile: boolean;
  onUpload: () => void;
  onRemove: () => void;
  accept: 'image' | 'video';
}

export function ImageUploadZone({
  label,
  hasFile,
  onUpload,
  onRemove,
  accept,
}: ImageUploadZoneProps) {
  const isImage = accept === 'image';

  return (
    <AnimatePresence mode="wait">
      {hasFile ? (
        <motion.div
          key="preview"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative rounded-xl border border-white/10 bg-white/5 overflow-hidden"
        >
          {/* Mock uploaded preview */}
          <div
            className="h-32 w-full flex items-center justify-center"
            style={{
              background: isImage
                ? 'linear-gradient(135deg, #334155 0%, #1e293b 100%)'
                : 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
            }}
          >
            {isImage ? (
              <ImageIcon className="h-8 w-8 text-white/30" />
            ) : (
              <Film className="h-8 w-8 text-white/30" />
            )}
          </div>

          {/* Remove button */}
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 border border-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="h-3 w-3" />
          </button>

          <div className="px-3 py-2">
            <p className="text-xs text-white/50 truncate">
              {isImage ? 'image_upload.png' : 'video_upload.mp4'}
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.button
          key="upload"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onUpload}
          className="w-full rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-colors p-6 flex flex-col items-center gap-2 group"
        >
          <Upload className="h-6 w-6 text-white/20 group-hover:text-white/40 transition-colors" />
          <p className="text-sm text-white/40 group-hover:text-white/60 transition-colors">
            Нажмите для загрузки или перетащите файл
          </p>
          <p className="text-[10px] text-white/20">
            {isImage
              ? 'Форматы: JPG/PNG, макс. 10MB'
              : 'Форматы: MP4/MOV, макс. 50MB'}
          </p>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
