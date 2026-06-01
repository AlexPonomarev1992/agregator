'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  ArrowUp,
  Video,
  ImageIcon,
  RectangleHorizontal,
  Clock,
  Sparkles,
  Diamond,
  HelpCircle,
  Loader2,
  X,
  Upload,
  Film,
  Volume2,
  VolumeX,
} from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import type { AIModel } from '@/types';

interface PromptBarProps {
  model: AIModel;
  formData: Record<string, string>;
  onFormDataChange: (data: Record<string, string>) => void;
  onRun: () => void;
  onReset: () => void;
  isRunning: boolean;
  isVideo: boolean;
}

interface PopoverOption {
  value: string;
  label: string;
}

function SettingButton({
  icon: Icon,
  label,
  value,
  options,
  onChange,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  options: PopoverOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap',
          open
            ? 'text-white bg-white/10'
            : 'text-white/50 hover:text-white/80 hover:bg-white/5'
        )}
      >
        {Icon && <Icon className="h-4 w-4" />}
        <span>{label || value}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 z-[60] min-w-[160px] rounded-xl border border-white/10 bg-[#1a1a24] backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            <div className="p-1">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex items-center justify-between w-full px-3 py-2.5 text-sm rounded-lg transition-colors',
                    value === opt.value
                      ? 'text-white bg-white/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  <span>{opt.label}</span>
                  {value === opt.value && (
                    <span className="text-white text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PromptBar({
  model,
  formData,
  onFormDataChange,
  onRun,
  onReset,
  isRunning,
  isVideo,
}: PromptBarProps) {
  const [showUpload, setShowUpload] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const endFrameInputRef = useRef<HTMLInputElement>(null);

  const prompt = formData.prompt ?? '';
  const hasImage = !!formData.image_file;
  const hasEndFrame = !!formData.endFrame_file;

  // Reset textarea height when prompt is cleared externally
  useEffect(() => {
    if (!prompt && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [prompt]);

  const updateField = (name: string, value: string) => {
    onFormDataChange({ ...formData, [name]: value });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim() && !isRunning) onRun();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const max = 2500;
    if (e.target.value.length <= max) {
      updateField('prompt', e.target.value);
    }
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  };

  const handleFileSelect = (field: 'image_file' | 'endFrame_file') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const nameField = field === 'image_file' ? 'image_file_name' : 'endFrame_file_name';
      onFormDataChange({ ...formData, [field]: dataUrl, [nameField]: file.name });
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  // Build setting options from model fields
  const aspectRatioField = model.fields.find((f) => f.name === 'aspectRatio');
  const durationField = model.fields.find((f) => f.name === 'duration');
  const resolutionField = model.fields.find((f) => f.name === 'resolution');
  const styleField = model.fields.find((f) => f.name === 'style');

  return (
    <div className="shrink-0 px-4 pb-4 pt-2 md:px-6">
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect('image_file')}
      />
      <input
        ref={endFrameInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect('endFrame_file')}
      />

      {/* Upload preview thumbnails */}
      <AnimatePresence>
        {(hasImage || hasEndFrame || showUpload) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="flex items-center gap-3">
              {hasImage ? (
                <div className="relative w-20 h-20 rounded-lg border border-dashed border-white/20 overflow-hidden bg-white/5 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formData.image_file}
                    alt={formData.image_file_name || 'Uploaded'}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onFormDataChange({ ...formData, image_file: '', image_file_name: '' });
                    }}
                    className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 border border-white/20 text-white/70 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <span className="absolute bottom-0.5 left-0.5 right-0.5 text-[8px] text-center text-white/40 truncate">
                    {isVideo ? 'Start Frame' : 'Референс'}
                  </span>
                </div>
              ) : showUpload ? (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-white/10 hover:border-white/25 flex flex-col items-center justify-center gap-1 text-white/30 hover:text-white/50 transition-colors shrink-0"
                >
                  <Upload className="h-5 w-5" />
                  <span className="text-[9px]">{isVideo ? 'Start' : 'Фото'}</span>
                </button>
              ) : null}

              {isVideo && (hasEndFrame ? (
                <div className="relative w-20 h-20 rounded-lg border border-dashed border-white/20 overflow-hidden bg-white/5 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formData.endFrame_file}
                    alt={formData.endFrame_file_name || 'End frame'}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onFormDataChange({ ...formData, endFrame_file: '', endFrame_file_name: '' });
                    }}
                    className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 border border-white/20 text-white/70 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <span className="absolute bottom-0.5 left-0.5 right-0.5 text-[8px] text-center text-white/40">End Frame</span>
                </div>
              ) : showUpload ? (
                <button
                  type="button"
                  onClick={() => endFrameInputRef.current?.click()}
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-white/10 hover:border-white/25 flex flex-col items-center justify-center gap-1 text-white/30 hover:text-white/50 transition-colors shrink-0"
                >
                  <Upload className="h-5 w-5" />
                  <span className="text-[9px]">End</span>
                </button>
              ) : null)}

              {showUpload && !hasImage && (
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="text-xs text-white/30 hover:text-white/50 transition-colors"
                >
                  Отмена
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input area */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
        {/* Text input row */}
        <div className="flex items-end gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setShowUpload(!showUpload)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors mb-0.5"
          >
            <Plus className="h-5 w-5" />
          </button>

          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder={isVideo ? 'Опишите ваше видео...' : 'Опишите изображение...'}
            rows={2}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none resize-none py-2 min-h-[52px] max-h-[150px] leading-relaxed"
          />

          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={prompt.trim() && !isRunning ? onRun : undefined}
            disabled={!prompt.trim() || isRunning}
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors mb-0.5',
              prompt.trim() && !isRunning
                ? 'bg-white text-black hover:bg-white/90 cursor-pointer'
                : 'bg-white/5 text-white/20 cursor-default'
            )}
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </motion.button>
        </div>

        {/* Settings bar */}
        <div className="flex items-center gap-1 flex-wrap px-3 py-2 border-t border-white/5">
          {/* Content type indicator */}
          <div className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white/60 rounded-lg bg-white/5 shrink-0">
            {isVideo ? <Video className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
            <span>{isVideo ? 'Video' : 'Photo'}</span>
          </div>

          <div className="w-px h-5 bg-white/10 mx-1 shrink-0" />

          {/* Aspect ratio */}
          {aspectRatioField?.options && (
            <SettingButton
              icon={RectangleHorizontal}
              label={formData.aspectRatio || aspectRatioField.options[0]?.value || '16:9'}
              value={formData.aspectRatio || aspectRatioField.options[0]?.value || ''}
              options={aspectRatioField.options}
              onChange={(v) => updateField('aspectRatio', v)}
            />
          )}

          {/* Resolution (images only) */}
          {resolutionField?.options && (
            <SettingButton
              icon={Diamond}
              label={
                resolutionField.options.find((o) => o.value === (formData.resolution || resolutionField.options?.[0]?.value))?.label ??
                resolutionField.options[0]?.label ?? '1K'
              }
              value={formData.resolution || resolutionField.options[0]?.value || ''}
              options={resolutionField.options}
              onChange={(v) => updateField('resolution', v)}
            />
          )}

          {/* Duration (video only) */}
          {durationField?.options && (
            <SettingButton
              icon={Clock}
              label={formData.duration ? `${formData.duration}s` : `${durationField.options[0]?.value || '5'}s`}
              value={formData.duration || durationField.options[0]?.value || ''}
              options={durationField.options}
              onChange={(v) => updateField('duration', v)}
            />
          )}

          {/* Style (images only) */}
          {styleField?.options && (
            <SettingButton
              icon={Sparkles}
              label={
                styleField.options.find((o) => o.value === (formData.style || 'auto'))?.label ?? 'Стиль'
              }
              value={formData.style || 'auto'}
              options={styleField.options}
              onChange={(v) => updateField('style', v)}
            />
          )}

          {/* Sound toggle (video only) */}
          {isVideo && (
            <button
              type="button"
              onClick={() => updateField('sound', formData.sound === 'true' ? 'false' : 'true')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors shrink-0',
                formData.sound === 'true'
                  ? 'text-white bg-white/10'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              )}
            >
              {formData.sound === 'true' ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <span>Sound</span>
            </button>
          )}

          <div className="flex-1" />

          {/* Help */}
          <button
            type="button"
            className="flex items-center justify-center h-8 w-8 rounded-lg text-white/30 hover:text-white/50 hover:bg-white/5 transition-colors shrink-0"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect('image_file')}
      />
      <input
        ref={endFrameInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect('endFrame_file')}
      />
    </div>
  );
}
