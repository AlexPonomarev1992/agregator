'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileCode, FileImage, FileText } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import type { FileAttachment } from '@/types/ai';

const ACCEPTED_TYPES: Record<string, string[]> = {
  image: ['.png', '.jpg', '.jpeg', '.webp'],
  code: ['.ts', '.tsx', '.js', '.jsx', '.py', '.md'],
  document: ['.pdf'],
};

const ALL_ACCEPT = Object.values(ACCEPTED_TYPES).flat().join(',');
const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

interface FileUploadZoneProps {
  files: FileAttachment[];
  onFilesChange: (files: FileAttachment[]) => void;
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return FileImage;
  if (
    type.includes('javascript') ||
    type.includes('typescript') ||
    type.includes('python') ||
    type.includes('text/markdown') ||
    type.includes('text/x-')
  )
    return FileCode;
  return FileText;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploadZone({ files, onFilesChange }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const remaining = MAX_FILES - files.length;
      const validFiles = newFiles
        .filter((f) => f.size <= MAX_SIZE)
        .slice(0, remaining)
        .map(
          (f): FileAttachment => ({
            id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: f.name,
            size: f.size,
            type: f.type,
            file: f,
          })
        );
      if (validFiles.length > 0) {
        onFilesChange([...files, ...validFiles]);
      }
    },
    [files, onFilesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = Array.from(e.dataTransfer.files);
      addFiles(dropped);
    },
    [addFiles]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    onFilesChange(files.filter((f) => f.id !== fileId));
  };

  return (
    <div className="space-y-2">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-4 transition-all',
          isDragging
            ? 'border-white bg-white/10'
            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
        )}
      >
        <Upload className={cn('h-6 w-6', isDragging ? 'text-white' : 'text-white/40')} />
        <p className="text-xs text-white/50">
          Перетащите файлы или нажмите для выбора
        </p>
        <p className="text-[10px] text-white/30">
          Макс. {MAX_FILES} файлов, до 10 МБ каждый
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ALL_ACCEPT}
          multiple
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* File list */}
      <AnimatePresence>
        {files.map((file) => {
          const Icon = getFileIcon(file.type);
          return (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
            >
              <Icon className="h-4 w-4 shrink-0 text-white/50" />
              <span className="flex-1 truncate text-xs text-white/70">{file.name}</span>
              <span className="shrink-0 text-[10px] text-white/30">{formatSize(file.size)}</span>
              <button
                onClick={() => removeFile(file.id)}
                className="shrink-0 rounded p-0.5 text-white/30 transition-colors hover:text-red-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
