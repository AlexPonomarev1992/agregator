'use client';

import { useState } from 'react';
import {
  Settings,
  MoreHorizontal,
  Trash2,
  Download,
  Share2,
  BookOpen,
  Code,
  Palette,
  BarChart3,
  PenTool,
  GraduationCap,
  Bot,
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ModelSelector } from './ModelSelector';
import { ContextIndicator } from './ContextIndicator';
import { cn } from '@/lib/utils';
import type { Project } from '@/types';
import type { Persona, ConversationSettings } from '@/types/ai';

const personaIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Code,
  Palette,
  BarChart3,
  PenTool,
  GraduationCap,
  Bot,
};

interface ConversationHeaderProps {
  project: Project;
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  persona: Persona | null;
  onOpenSettings: () => void;
  onOpenPersonaLibrary: () => void;
  onClearHistory: () => void;
  onExportMarkdown: () => void;
  onShare: () => void;
  settings: ConversationSettings;
  messageCount: number;
}

export function ConversationHeader({
  project,
  selectedModelId,
  onSelectModel,
  persona,
  onOpenSettings,
  onOpenPersonaLibrary,
  onClearHistory,
  onExportMarkdown,
  onShare,
  messageCount,
}: ConversationHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(project.name);

  // Mock token usage calculation
  const tokensUsed = messageCount * 150;
  const maxTokens = 8000;

  const PersonaIcon = persona ? (personaIconMap[persona.icon] ?? Bot) : null;

  return (
    <div className="shrink-0 border-b border-white/10 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Project name */}
          {isEditingName ? (
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditingName(false);
                if (e.key === 'Escape') {
                  setEditName(project.name);
                  setIsEditingName(false);
                }
              }}
              autoFocus
              className="bg-transparent text-base font-semibold text-white outline-none border-b border-white"
            />
          ) : (
            <h2
              onClick={() => setIsEditingName(true)}
              className="cursor-pointer truncate text-base font-semibold text-white hover:text-white transition-colors"
            >
              {editName}
            </h2>
          )}

          {/* Model selector */}
          <div className="hidden sm:block">
            <ModelSelector
              selectedModelId={selectedModelId}
              onSelectModel={onSelectModel}
              compact
            />
          </div>

          {/* Persona badge */}
          {persona && PersonaIcon && (
            <button onClick={onOpenPersonaLibrary} className="hidden sm:block">
              <Badge variant="purple" className="gap-1 cursor-pointer hover:bg-white/30 transition-colors">
                <PersonaIcon className="h-3 w-3" />
                {persona.name}
              </Badge>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Context indicator */}
          <div className="hidden lg:block">
            <ContextIndicator
              tokensUsed={tokensUsed}
              maxTokens={maxTokens}
              fileCount={0}
            />
          </div>

          {/* Settings */}
          <Button variant="ghost" size="icon" onClick={onOpenSettings} className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>

          {/* More actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onOpenPersonaLibrary} className="gap-2">
                <BookOpen className="h-4 w-4" />
                Библиотека персон
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onClearHistory} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Очистить историю
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportMarkdown} className="gap-2">
                <Download className="h-4 w-4" />
                Экспорт (Markdown)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShare} className="gap-2">
                <Share2 className="h-4 w-4" />
                Поделиться
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
