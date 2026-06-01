'use client';

import { motion } from 'framer-motion';
import { Play, RotateCcw } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { ImageUploadZone } from './ImageUploadZone';
import { cn } from '@/lib/utils';
import type { AIModel } from '@/types';

interface InputPanelProps {
  model: AIModel;
  formData: Record<string, string>;
  onFormDataChange: (data: Record<string, string>) => void;
  onRun: () => void;
  onReset: () => void;
  isRunning: boolean;
}

export function InputPanel({
  model,
  formData,
  onFormDataChange,
  onRun,
  onReset,
  isRunning,
}: InputPanelProps) {
  const updateField = (name: string, value: string) => {
    onFormDataChange({ ...formData, [name]: value });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/80">Input</h3>
        <div className="flex items-center gap-1 rounded-lg bg-white/5 p-0.5">
          <span className="text-xs font-medium px-3 py-1 rounded-md bg-white text-white">
            Form
          </span>
          <span className="text-xs font-medium px-3 py-1 rounded-md text-white/40">
            JSON
          </span>
        </div>
      </div>

      {/* Dynamic fields */}
      <div className="space-y-5">
        {model.fields.map((field) => {
          const value = formData[field.name] ?? '';

          switch (field.type) {
            case 'textarea':
              return (
                <div key={field.name} className="space-y-2">
                  <label className="text-sm font-medium text-white/60">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-0.5">*</span>}
                  </label>
                  <div className="relative">
                    <textarea
                      value={value}
                      onChange={(e) => {
                        const max = field.maxLength ?? 2500;
                        if (e.target.value.length <= max) {
                          updateField(field.name, e.target.value);
                        }
                      }}
                      placeholder={field.placeholder}
                      rows={field.name === 'negativePrompt' ? 3 : 4}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/30 focus:outline-none resize-none"
                    />
                    {field.maxLength && (
                      <span className="absolute right-3 bottom-2 text-[10px] text-white/20">
                        {value.length}/{field.maxLength}
                      </span>
                    )}
                  </div>
                </div>
              );

            case 'image-upload':
              return (
                <div key={field.name} className="space-y-2">
                  <label className="text-sm font-medium text-white/60">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-0.5">*</span>}
                  </label>
                  <ImageUploadZone
                    label={field.label}
                    hasFile={!!formData[`${field.name}_file`]}
                    onUpload={() => updateField(`${field.name}_file`, 'uploaded')}
                    onRemove={() => updateField(`${field.name}_file`, '')}
                    accept="image"
                  />
                </div>
              );

            case 'video-upload':
              return (
                <div key={field.name} className="space-y-2">
                  <label className="text-sm font-medium text-white/60">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-0.5">*</span>}
                  </label>
                  <ImageUploadZone
                    label={field.label}
                    hasFile={!!formData[`${field.name}_file`]}
                    onUpload={() => updateField(`${field.name}_file`, 'uploaded')}
                    onRemove={() => updateField(`${field.name}_file`, '')}
                    accept="video"
                  />
                </div>
              );

            case 'toggle':
              return (
                <div key={field.name} className="flex items-center justify-between">
                  <label className="text-sm font-medium text-white/60">
                    {field.label}
                  </label>
                  <button
                    onClick={() =>
                      updateField(field.name, value === 'true' ? 'false' : 'true')
                    }
                    className={cn(
                      'relative h-6 w-11 rounded-full transition-colors',
                      value === 'true' ? 'bg-white' : 'bg-white/10'
                    )}
                  >
                    <motion.div
                      animate={{ x: value === 'true' ? 20 : 2 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm"
                    />
                  </button>
                </div>
              );

            case 'select':
            case 'duration':
              return (
                <div key={field.name} className="space-y-2">
                  <label className="text-sm font-medium text-white/60">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-0.5">*</span>}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {field.options?.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateField(field.name, opt.value)}
                        className={cn(
                          'px-4 py-1.5 text-sm rounded-lg border transition-colors',
                          value === opt.value
                            ? 'bg-white/20 text-white border-white/30'
                            : 'bg-white/5 text-white/50 border-white/10 hover:border-white/20 hover:text-white/80'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              );

            default:
              return null;
          }
        })}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-2">
        <Button variant="ghost" onClick={onReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
        <div className="flex-1" />
        <Button
          onClick={onRun}
          disabled={isRunning}
          className="gap-2"
          size="lg"
        >
          <motion.div
            animate={isRunning ? { rotate: 360 } : {}}
            transition={isRunning ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
          >
            <Play className="h-4 w-4" />
          </motion.div>
          {isRunning ? 'Обработка...' : 'Run'}
        </Button>
      </div>
    </div>
  );
}
