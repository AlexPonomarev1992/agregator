'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from '@/components/ui/icons';
import { RichMessageRenderer } from './RichMessageRenderer';
import { AttachmentPreview } from './AttachmentPreview';
import { MessageActions } from './MessageActions';
import type { ChatMessage } from '@/types';

interface MessageBubbleProps {
  message: ChatMessage;
  onCopy?: () => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onRegenerate?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
}

export function MessageBubble({ message, onCopy, onEdit, onRegenerate, onDelete }: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const isUser = message.role === 'user';

  const handleSaveEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      transition={{ duration: 0.3 }}
      className={`group relative flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20">
          <MessageSquare className="h-3.5 w-3.5 text-white" />
        </div>
      )}

      <div className="relative max-w-[80%]">
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-white/20 text-white rounded-br-sm'
              : 'bg-white/5 text-white/90 rounded-bl-sm'
          }`}
        >
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[60px] resize-none bg-transparent text-sm text-white outline-none"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="rounded-lg bg-white px-3 py-1 text-xs font-medium text-white hover:bg-white/80 transition-colors"
                >
                  Сохранить
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="rounded-lg px-3 py-1 text-xs text-white/50 hover:text-white transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <RichMessageRenderer content={message.content} />
          )}

          {message.attachments && message.attachments.length > 0 && (
            <AttachmentPreview attachments={message.attachments} />
          )}

          {message.isEdited && !isEditing && (
            <span className="mt-1 block text-[10px] text-white/30">Изменено</span>
          )}
        </div>

        {/* Message actions on hover */}
        {!isEditing && (
          <div
            className={`absolute -top-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 ${
              isUser ? 'left-0' : 'right-0'
            }`}
          >
            <MessageActions
              role={message.role}
              content={message.content}
              onCopy={() => onCopy?.()}
              onEdit={isUser ? () => setIsEditing(true) : undefined}
              onRegenerate={!isUser && onRegenerate ? () => onRegenerate(message.id) : undefined}
              onDelete={() => onDelete?.(message.id)}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
