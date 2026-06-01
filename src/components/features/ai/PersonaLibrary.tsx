'use client';

import { useState } from 'react';
import {
  Code,
  Palette,
  BarChart3,
  PenTool,
  GraduationCap,
  Bot,
  Plus,
  Search,
  Trash2,
} from '@/components/ui/icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Persona } from '@/types/ai';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Code,
  Palette,
  BarChart3,
  PenTool,
  GraduationCap,
  Bot,
};

const availableIcons = ['Code', 'Palette', 'BarChart3', 'PenTool', 'GraduationCap', 'Bot'];

interface PersonaLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  builtInPersonas: Persona[];
  customPersonas: Persona[];
  selectedPersonaId: string | null;
  onSelectPersona: (personaId: string) => void;
  onCreatePersona: (persona: Persona) => void;
  onDeletePersona: (personaId: string) => void;
}

export function PersonaLibrary({
  open,
  onOpenChange,
  builtInPersonas,
  customPersonas,
  selectedPersonaId,
  onSelectPersona,
  onCreatePersona,
  onDeletePersona,
}: PersonaLibraryProps) {
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [newIcon, setNewIcon] = useState('Bot');

  const filterPersonas = (list: Persona[]) => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    const persona: Persona = {
      id: `persona-custom-${Date.now()}`,
      name: newName.trim(),
      description: newPrompt.trim().slice(0, 80) || 'Пользовательская персона',
      icon: newIcon,
      systemPrompt: newPrompt.trim(),
      isBuiltIn: false,
      tags: ['пользовательская'],
    };
    onCreatePersona(persona);
    setNewName('');
    setNewPrompt('');
    setNewIcon('Bot');
    setShowCreateForm(false);
  };

  const renderPersonaCard = (persona: Persona, canDelete: boolean) => {
    const Icon = iconMap[persona.icon] ?? Bot;
    const isActive = persona.id === selectedPersonaId;

    return (
      <div
        key={persona.id}
        onClick={() => {
          onSelectPersona(persona.id);
          onOpenChange(false);
        }}
        className={cn(
          'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all',
          isActive
            ? 'border-white bg-white/10'
            : 'border-white/10 bg-white/5 hover:bg-white/10'
        )}
      >
        <Icon
          className={cn(
            'mt-0.5 h-6 w-6 shrink-0',
            isActive ? 'text-white' : 'text-white/50'
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('text-sm font-medium', isActive && 'text-white')}>
              {persona.name}
            </span>
            {isActive && <Badge variant="purple" className="text-[10px]">Активна</Badge>}
          </div>
          <p className="mt-0.5 text-xs text-white/40 line-clamp-2">{persona.description}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {persona.tags.map((tag) => (
              <Badge key={tag} variant="default" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        {canDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeletePersona(persona.id);
            }}
            className="shrink-0 rounded-lg p-1.5 text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Библиотека персон</DialogTitle>
          <DialogDescription>
            Выберите персону для ИИ-ассистента или создайте свою
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск персон..."
            className="pl-10"
          />
        </div>

        <Tabs defaultValue="builtin" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-full">
            <TabsTrigger value="builtin" className="flex-1">Встроенные</TabsTrigger>
            <TabsTrigger value="custom" className="flex-1">Мои</TabsTrigger>
          </TabsList>

          <TabsContent value="builtin" className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filterPersonas(builtInPersonas).map((p) => renderPersonaCard(p, false))}
          </TabsContent>

          <TabsContent value="custom" className="flex-1 overflow-y-auto space-y-2 pr-1">
            {!showCreateForm ? (
              <Button
                variant="secondary"
                onClick={() => setShowCreateForm(true)}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                Создать персону
              </Button>
            ) : (
              <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Название персоны"
                />
                <Textarea
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  placeholder="Системный промпт..."
                  rows={3}
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50">Иконка:</span>
                  {availableIcons.map((iconName) => {
                    const IconComp = iconMap[iconName] ?? Bot;
                    return (
                      <button
                        key={iconName}
                        onClick={() => setNewIcon(iconName)}
                        className={cn(
                          'rounded-lg p-1.5 transition-colors',
                          newIcon === iconName
                            ? 'bg-white/20 text-white'
                            : 'text-white/40 hover:bg-white/10'
                        )}
                      >
                        <IconComp className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreate} disabled={!newName.trim()} className="flex-1">
                    Создать
                  </Button>
                  <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
                    Отмена
                  </Button>
                </div>
              </div>
            )}
            {filterPersonas(customPersonas).map((p) => renderPersonaCard(p, true))}
            {customPersonas.length === 0 && !showCreateForm && (
              <p className="py-8 text-center text-sm text-white/30">
                У вас пока нет пользовательских персон
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
