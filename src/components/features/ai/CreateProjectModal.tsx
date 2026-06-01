'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PersonaSelector } from './PersonaSelector';
import { ModelSelector } from './ModelSelector';
import { FileUploadZone } from './FileUploadZone';
import { mockPersonas } from '@/lib/mock/personas';
import type { Project } from '@/types';
import type { FileAttachment } from '@/types/ai';

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (project: Project) => void;
}

export function CreateProjectModal({ open, onOpenChange, onCreateProject }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [personaId, setPersonaId] = useState<string | null>(null);
  const [modelId, setModelId] = useState('claude-3.5-sonnet');
  const [files, setFiles] = useState<FileAttachment[]>([]);

  const handleCreate = () => {
    if (!name.trim()) return;

    const project: Project = {
      id: `proj-${Date.now()}`,
      user_id: 'u-003',
      name: name.trim(),
      description: description.trim() || null,
      context: null,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      modelId,
      personaId: personaId ?? undefined,
    };

    onCreateProject(project);
    // Reset form
    setName('');
    setDescription('');
    setPersonaId(null);
    setModelId('claude-3.5-sonnet');
    setFiles([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Новый проект</DialogTitle>
          <DialogDescription>
            Создайте новый проект для работы с ИИ-ассистентом
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">
              Название проекта <span className="text-red-400">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Рекламный ролик"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Описание</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание проекта..."
              rows={2}
            />
          </div>

          {/* Persona */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Персона</label>
            <PersonaSelector
              personas={mockPersonas}
              selectedPersonaId={personaId}
              onSelectPersona={setPersonaId}
            />
          </div>

          {/* Model */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Модель по умолчанию</label>
            <ModelSelector
              selectedModelId={modelId}
              onSelectModel={setModelId}
            />
          </div>

          {/* Files */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Загрузить файлы</label>
            <FileUploadZone files={files} onFilesChange={setFiles} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>
            Создать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
