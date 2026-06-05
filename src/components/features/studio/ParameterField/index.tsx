'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { ParameterDef } from '@/lib/models/types';

import { PromptInput } from '../inputs/PromptInput';
import { FileUploadZone } from '../inputs/FileUploadZone';
import type { UploadedFile } from '../inputs/FileUploadZone';
import { AspectRatioPicker } from '../inputs/AspectRatioPicker';
import { DurationPicker } from '../inputs/DurationPicker';
import { ResolutionPicker } from '../inputs/ResolutionPicker';
import { ModeToggle } from '../inputs/ModeToggle';
import { ParamSlider } from '../inputs/ParamSlider';
import { ParamSwitch } from '../inputs/ParamSwitch';
import { TagInput } from '../inputs/TagInput';
import { VoiceSelect } from '../inputs/VoiceSelect';
import { ColorPaletteSelect } from '../inputs/ColorPaletteSelect';
import { NumberInput } from '../inputs/NumberInput';
import { SelectInput } from '../inputs/SelectInput';

export interface ParameterFieldProps {
  schema: ParameterDef;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function asNumber(v: unknown, fallback = 0): number {
  return typeof v === 'number' ? v : fallback;
}

function asBoolean(v: unknown): boolean {
  return typeof v === 'boolean' ? v : false;
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
}

function asUploadedFileArray(v: unknown): UploadedFile[] {
  if (!Array.isArray(v)) return [];
  return v.filter(
    (x): x is UploadedFile =>
      typeof x === 'object' &&
      x !== null &&
      'url' in x &&
      'name' in x &&
      'sizeBytes' in x &&
      'type' in x
  );
}

export function ParameterField({ schema, value, onChange, error }: ParameterFieldProps) {
  const showLabel = Boolean(schema.label);

  const renderControl = () => {
    switch (schema.type) {
      case 'longtext':
        return (
          <PromptInput
            value={asString(value)}
            onChange={(v: string) => onChange(v)}
            maxLength={schema.maxLength}
            placeholder={schema.description}
          />
        );

      case 'text':
        return (
          <input
            type="text"
            value={asString(value)}
            onChange={(e) => onChange(e.target.value)}
            placeholder={schema.description}
            maxLength={schema.maxLength}
            className={cn(
              'flex h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2',
              'text-sm text-white placeholder:text-white/40 transition-colors',
              'focus:border-[#7F77DD]/40 focus:ring-1 focus:ring-[#7F77DD]/30 focus:outline-none'
            )}
          />
        );

      case 'select':
      case 'styleSelect':
        return (
          <SelectInput
            value={asString(value)}
            onChange={(v: string) => onChange(v)}
            options={schema.options ?? []}
            placeholder={schema.description}
          />
        );

      case 'mode':
        return (
          <ModeToggle
            value={asString(value)}
            onChange={(v: string) => onChange(v)}
            options={(schema.options ?? []).map((o) => ({
              value: o.value,
              label: o.label,
              tooltip: o.description,
            }))}
          />
        );

      case 'slider':
        return (
          <ParamSlider
            value={asNumber(value, schema.min ?? 0)}
            onChange={(v) => onChange(v)}
            min={schema.min ?? 0}
            max={schema.max ?? 100}
            step={schema.step ?? 1}
            description={schema.description}
          />
        );

      case 'number':
        return (
          <NumberInput
            value={asNumber(value, schema.min ?? 0)}
            onChange={(v) => onChange(v)}
            min={schema.min}
            max={schema.max}
            step={schema.step ?? 1}
          />
        );

      case 'switch':
        return (
          <ParamSwitch
            value={asBoolean(value)}
            onChange={(v) => onChange(v)}
            label={schema.label}
            description={schema.description}
          />
        );

      case 'imageUpload':
        return (
          <FileUploadZone
            value={asUploadedFileArray(value)}
            onChange={(files) => onChange(schema.multiple ? files : files[0]?.url ?? '')}
            accept={schema.accept ?? ['image/*']}
            maxSizeMB={schema.maxSizeMB ?? 10}
            multiple={schema.multiple ?? false}
            uploadEndpoint="/api/upload"
          />
        );

      case 'videoUpload':
        return (
          <FileUploadZone
            value={asUploadedFileArray(value)}
            onChange={(files) => onChange(schema.multiple ? files : files[0]?.url ?? '')}
            accept={schema.accept ?? ['video/*']}
            maxSizeMB={schema.maxSizeMB ?? 100}
            multiple={schema.multiple ?? false}
          />
        );

      case 'audioUpload':
      case 'maskUpload':
        return (
          <FileUploadZone
            value={asUploadedFileArray(value)}
            onChange={(files) => onChange(schema.multiple ? files : files[0]?.url ?? '')}
            accept={schema.accept ?? ['audio/*']}
            maxSizeMB={schema.maxSizeMB ?? 50}
            multiple={schema.multiple ?? false}
          />
        );

      case 'aspectRatio':
        return (
          <AspectRatioPicker
            value={asString(value)}
            onChange={(v: string) => onChange(v)}
            options={(schema.options ?? []).map((o) => o.value)}
          />
        );

      case 'duration':
        return (
          <DurationPicker
            value={asNumber(value)}
            onChange={(v) => onChange(v)}
            options={(schema.options ?? []).map((o) => ({
              value: parseInt(o.value, 10),
              credits: o.costModifier ? Math.round(o.costModifier * 10) : 10,
            }))}
          />
        );

      case 'resolution':
        return (
          <ResolutionPicker
            value={asString(value)}
            onChange={(v: string) => onChange(v)}
            options={(schema.options ?? []).map((o) => ({
              value: o.value,
              label: o.label,
              badge: o.badge as 'HD' | '2K' | '4K' | undefined,
            }))}
          />
        );

      case 'numberOfImages':
        return (
          <NumberInput
            value={asNumber(value, 1)}
            onChange={(v) => onChange(v)}
            min={1}
            max={4}
            step={1}
          />
        );

      case 'colorPalette':
        return (
          <ColorPaletteSelect
            value={asString(value) || null}
            onChange={(v: string | null) => onChange(v)}
            presets={(schema.options ?? []).map((o) => ({
              value: o.value,
              label: o.label,
              colors: o.description ? o.description.split(',').map((c) => c.trim()) : ['#888'],
            }))}
            allowCustom={true}
          />
        );

      case 'voicePicker':
        return (
          <VoiceSelect
            value={asString(value)}
            onChange={(v: string) => onChange(v)}
            voices={(schema.options ?? []).map((o) => ({
              id: o.value,
              name: o.label,
              description: o.description,
            }))}
          />
        );

      case 'tagInput':
        return (
          <TagInput
            value={asStringArray(value)}
            onChange={(tags) => onChange(tags)}
            maxTags={8}
          />
        );

      case 'dialogueList':
        // Minimal fallback — full dialogue editor is a future feature
        return (
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/40">
            Редактор диалогов (скоро)
          </div>
        );

      default: {
        const _exhaustive: never = schema.type;
        void _exhaustive;
        return null;
      }
    }
  };

  // For switch type, label is rendered inside the control itself
  const skipLabel = schema.type === 'switch';

  return (
    <div className="space-y-1.5">
      {showLabel && !skipLabel && (
        <label className="block text-sm text-white/60">{schema.label}</label>
      )}
      {renderControl()}
      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}
