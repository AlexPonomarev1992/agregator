'use client';

import {
  Code,
  Palette,
  BarChart3,
  PenTool,
  GraduationCap,
  Bot,
} from '@/components/ui/icons';
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

interface PersonaSelectorProps {
  personas: Persona[];
  selectedPersonaId: string | null;
  onSelectPersona: (personaId: string) => void;
}

export function PersonaSelector({ personas, selectedPersonaId, onSelectPersona }: PersonaSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {personas.map((persona) => {
        const Icon = iconMap[persona.icon] ?? Bot;
        const isActive = persona.id === selectedPersonaId;

        return (
          <button
            key={persona.id}
            onClick={() => onSelectPersona(persona.id)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all',
              isActive
                ? 'border-white bg-white/10'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            )}
          >
            <Icon
              className={cn(
                'h-6 w-6',
                isActive ? 'text-white' : 'text-white/60'
              )}
            />
            <span className={cn('text-xs font-medium', isActive ? 'text-white' : 'text-white/80')}>
              {persona.name}
            </span>
            <span className="text-[10px] text-white/40 line-clamp-1">
              {persona.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
