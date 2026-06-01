'use client';

import React, { useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CloudUploadIcon,
  CancelCircleIcon,
  PlayIcon,
  AudioWave01Icon,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

export interface UploadedFile {
  url: string;
  name: string;
  sizeBytes: number;
  type: 'image' | 'video' | 'audio';
}

export interface FileUploadZoneProps {
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  accept: string[];
  maxSizeMB: number;
  multiple?: boolean;
  label?: string;
  placeholder?: string;
}

type ZoneState = 'idle' | 'dragover' | 'uploading' | 'error';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function detectFileType(file: File): UploadedFile['type'] {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'image';
}

export function FileUploadZone({
  value,
  onChange,
  accept,
  maxSizeMB,
  multiple = false,
  label,
  placeholder = 'Перетащите файл или нажмите для загрузки',
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [zoneState, setZoneState] = useState<ZoneState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback(
    async (files: FileList) => {
      setError(null);
      const fileArray = Array.from(files);
      const maxBytes = maxSizeMB * 1024 * 1024;

      for (const file of fileArray) {
        if (file.size > maxBytes) {
          setError(`Файл "${file.name}" превышает ${maxSizeMB} MB`);
          setZoneState('error');
          return;
        }
      }

      setZoneState('uploading');
      setUploadProgress(0);

      // Simulate progress for local preview (actual upload happens outside)
      const interval = setInterval(() => {
        setUploadProgress((p) => {
          if (p >= 90) {
            clearInterval(interval);
            return 90;
          }
          return p + 15;
        });
      }, 80);

      const newFiles: UploadedFile[] = fileArray.map((file) => ({
        url: URL.createObjectURL(file),
        name: file.name,
        sizeBytes: file.size,
        type: detectFileType(file),
      }));

      clearInterval(interval);
      setUploadProgress(100);

      setTimeout(() => {
        if (multiple) {
          onChange([...value, ...newFiles]);
        } else {
          onChange(newFiles.slice(0, 1));
        }
        setZoneState('idle');
        setUploadProgress(0);
      }, 300);
    },
    [maxSizeMB, multiple, onChange, value]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setZoneState('dragover');
  }, []);

  const handleDragLeave = useCallback(() => {
    setZoneState('idle');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setZoneState('idle');
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
      }
    },
    [processFiles]
  );

  const removeFile = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    },
    [onChange, value]
  );

  const hasFiles = value.length > 0;

  return (
    <div className="space-y-2">
      {label && (
        <span className="block text-sm text-white/60">{label}</span>
      )}

      {/* Drop zone */}
      {(!hasFiles || multiple) && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden',
            'flex flex-col items-center justify-center gap-2 px-4 py-8',
            zoneState === 'idle' && 'border-white/10 hover:border-white/20 bg-white/5',
            zoneState === 'dragover' && 'border-[#7F77DD]/60 bg-[#7F77DD]/5',
            zoneState === 'uploading' && 'border-[#7F77DD]/40 bg-white/5',
            zoneState === 'error' && 'border-red-500/40 bg-red-500/5'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept.join(',')}
            multiple={multiple}
            className="hidden"
            onChange={handleInputChange}
          />

          <HugeiconsIcon
            icon={CloudUploadIcon}
            size={24}
            color={zoneState === 'dragover' ? '#7F77DD' : 'rgba(255,255,255,0.3)'}
            strokeWidth={1.5}
          />

          <div className="text-center">
            <p className={cn(
              'text-sm transition-colors',
              zoneState === 'dragover' ? 'text-[#7F77DD]' : 'text-white/40'
            )}>
              {placeholder}
            </p>
            <p className="text-[11px] text-white/25 mt-0.5">
              {accept.join(', ')} — макс. {maxSizeMB} MB
            </p>
          </div>

          {/* Upload progress bar */}
          <AnimatePresence>
            {zoneState === 'uploading' && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: uploadProgress / 100 }}
                exit={{ opacity: 0 }}
                style={{ originX: 0 }}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7F77DD]"
              />
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Previews */}
      {hasFiles && (
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {value.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                className="relative group"
              >
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 bg-white/5">
                  {file.type === 'image' && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {file.type === 'video' && (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                      <HugeiconsIcon icon={PlayIcon} size={22} color="rgba(255,255,255,0.6)" strokeWidth={1.5} />
                    </div>
                  )}

                  {file.type === 'audio' && (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-zinc-800">
                      <HugeiconsIcon icon={AudioWave01Icon} size={22} color="rgba(255,255,255,0.6)" strokeWidth={1.5} />
                      <span className="text-[9px] text-white/40 text-center px-1 truncate w-full text-center">
                        {file.name}
                      </span>
                    </div>
                  )}

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className={cn(
                      'absolute top-1 right-1 rounded-full bg-black/60 p-0.5',
                      'opacity-0 group-hover:opacity-100 transition-opacity',
                      'hover:bg-red-500/80'
                    )}
                  >
                    <HugeiconsIcon icon={CancelCircleIcon} size={14} color="white" strokeWidth={1.5} />
                  </button>
                </div>

                {/* File info */}
                <p className="mt-1 text-[10px] text-white/40 truncate w-20">{file.name}</p>
                <p className="text-[10px] text-white/25">{formatSize(file.sizeBytes)}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
