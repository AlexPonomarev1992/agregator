'use client';

import { useState, useRef, useCallback } from 'react';
import { SendHorizontal, Paperclip } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileUploadZone } from './FileUploadZone';
import type { FileAttachment } from '@/types/ai';

interface ChatInputProps {
  onSend: (content: string, attachments?: FileAttachment[]) => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const lineHeight = 24;
    const maxHeight = lineHeight * 4;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    adjustHeight();
  };

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed && files.length === 0) return;
    onSend(trimmed, files.length > 0 ? files : undefined);
    setValue('');
    setFiles([]);
    setShowUpload(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleUpload = () => {
    setShowUpload((prev) => !prev);
  };

  return (
    <div className="space-y-2">
      {showUpload && (
        <FileUploadZone files={files} onFilesChange={setFiles} />
      )}
      <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-2">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleUpload}
            className="h-8 w-8 shrink-0"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          {files.length > 0 && (
            <Badge
              variant="purple"
              className="absolute -right-1 -top-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
            >
              {files.length}
            </Badge>
          )}
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Спросите что-нибудь..."
          rows={1}
          className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-white placeholder:text-white/40 focus:outline-none"
          style={{ maxHeight: `${24 * 4}px` }}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!value.trim() && files.length === 0}
          className="h-8 w-8 shrink-0"
        >
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
