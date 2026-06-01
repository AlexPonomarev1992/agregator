'use client';

import { motion } from 'framer-motion';
import {
  Plus,
  Sparkles,
  Brain,
  Zap,
  Wind,
  Globe,
  Code,
  Palette,
  BarChart3,
  PenTool,
  GraduationCap,
  Bot,
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ChatMessage, Project } from '@/types';

const modelIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'gpt-4o': Sparkles,
  'claude-3.5-sonnet': Brain,
  'grok-2': Zap,
  'mistral-large': Wind,
  'gemini-1.5-pro': Globe,
};

const personaIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Code,
  Palette,
  BarChart3,
  PenTool,
  GraduationCap,
  Bot,
};

interface ProjectListProps {
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  projects: Project[];
  messages: ChatMessage[];
  personaMap: Record<string, { name: string; icon: string }>;
}

export function ProjectList({
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  projects,
  messages,
  personaMap,
}: ProjectListProps) {
  const getLastMessage = (projectId: string) => {
    const projectMessages = messages.filter((m) => m.project_id === projectId);
    return projectMessages[projectMessages.length - 1] ?? null;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 7) return `${diffDays}д назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="flex h-full flex-col bg-white/[0.02] backdrop-blur-md">
      <div className="p-4">
        <Button className="w-full gap-2" onClick={onCreateProject}>
          <Plus className="h-4 w-4" />
          Новый проект
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 pb-4">
        {projects.map((project, index) => {
          const lastMessage = getLastMessage(project.id);
          const isActive = selectedProjectId === project.id;
          const ModelIcon = project.modelId ? modelIconMap[project.modelId] : null;
          const personaInfo = project.personaId ? personaMap[project.personaId] : null;
          const PersonaIcon = personaInfo ? personaIconMap[personaInfo.icon] : null;

          return (
            <motion.button
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectProject(project.id)}
              className={`w-full text-left rounded-xl p-3 mb-1 transition-colors ${
                isActive
                  ? 'bg-white/10 border-l-2 border-white'
                  : 'hover:bg-white/5 border-l-2 border-transparent'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium text-white truncate">
                  {project.name}
                </h3>
                {lastMessage && (
                  <span className="text-[10px] text-white/40 shrink-0">
                    {formatTime(lastMessage.created_at)}
                  </span>
                )}
              </div>
              {lastMessage && (
                <p className="mt-1 text-xs text-white/40 line-clamp-1">
                  {lastMessage.content}
                </p>
              )}
              <div className="mt-1.5 flex items-center gap-1.5">
                {ModelIcon && (
                  <ModelIcon className="h-3 w-3 text-white/30" />
                )}
                {PersonaIcon && personaInfo && (
                  <Badge variant="default" className="text-[10px] px-1 py-0 gap-0.5">
                    <PersonaIcon className="h-2.5 w-2.5" />
                    {personaInfo.name}
                  </Badge>
                )}
                {project.is_archived && (
                  <span className="inline-block text-[10px] text-white/30 bg-white/5 rounded px-1.5 py-0.5">
                    Архив
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </ScrollArea>
    </div>
  );
}
