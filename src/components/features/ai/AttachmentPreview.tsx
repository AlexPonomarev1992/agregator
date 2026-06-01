'use client';

import { useState } from 'react';
import { FileCode, FileImage, FileText } from '@/components/ui/icons';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { FileAttachment } from '@/types/ai';

interface AttachmentPreviewProps {
  attachments: FileAttachment[];
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

function getLanguageBadge(name: string): string | null {
  const ext = name.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: 'TypeScript',
    tsx: 'TSX',
    js: 'JavaScript',
    jsx: 'JSX',
    py: 'Python',
    md: 'Markdown',
  };
  return ext ? (map[ext] ?? null) : null;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentPreview({ attachments }: AttachmentPreviewProps) {
  const [expandedFile, setExpandedFile] = useState<FileAttachment | null>(null);

  if (!attachments.length) return null;

  return (
    <>
      <div className="mt-2 flex flex-wrap gap-2">
        {attachments.map((file) => {
          const Icon = getFileIcon(file.type);
          const lang = getLanguageBadge(file.name);
          const isImage = file.type.startsWith('image/');

          return (
            <button
              key={file.id}
              onClick={() => setExpandedFile(file)}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 transition-colors hover:bg-white/10"
            >
              {isImage && file.url ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="h-8 w-8 rounded object-cover"
                />
              ) : (
                <Icon className="h-4 w-4 text-white/50" />
              )}
              <span className="max-w-[120px] truncate text-xs text-white/70">{file.name}</span>
              {lang && (
                <Badge variant="default" className="text-[10px] px-1 py-0">
                  {lang}
                </Badge>
              )}
              {!isImage && (
                <span className="text-[10px] text-white/30">{formatSize(file.size)}</span>
              )}
            </button>
          );
        })}
      </div>

      <Dialog open={!!expandedFile} onOpenChange={() => setExpandedFile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{expandedFile?.name}</DialogTitle>
            <DialogDescription>
              {expandedFile && formatSize(expandedFile.size)}
            </DialogDescription>
          </DialogHeader>
          {expandedFile?.type.startsWith('image/') && expandedFile.url && (
            <img
              src={expandedFile.url}
              alt={expandedFile.name}
              className="w-full rounded-lg"
            />
          )}
          {expandedFile && !expandedFile.type.startsWith('image/') && (
            <div className="rounded-lg bg-zinc-950 p-4">
              <p className="text-sm text-white/60">Предпросмотр файла недоступен</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
