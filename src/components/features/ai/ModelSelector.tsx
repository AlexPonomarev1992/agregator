'use client';

import {
  Sparkles,
  Brain,
  Zap,
  Wind,
  Globe,
  ChevronDown,
  Check,
} from '@/components/ui/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { chatModels } from '@/lib/mock/chat-models';
import type { ChatModel } from '@/types/ai';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Brain,
  Zap,
  Wind,
  Globe,
};

interface ModelSelectorProps {
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  compact?: boolean;
}

function formatContext(tokens: number): string {
  if (tokens >= 1000000) return `${tokens / 1000000}M`;
  return `${tokens / 1000}K`;
}

export function ModelSelector({ selectedModelId, onSelectModel, compact = false }: ModelSelectorProps) {
  const selectedModel = chatModels.find((m) => m.id === selectedModelId) ?? chatModels[0];
  const Icon = iconMap[selectedModel.icon] ?? Sparkles;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-3 py-1.5 text-sm transition-colors hover:bg-white/10',
            compact && 'px-2 py-1'
          )}
        >
          <Icon className="h-4 w-4 text-white" />
          <span className="text-white/90">{selectedModel.name}</span>
          <ChevronDown className="h-3.5 w-3.5 text-white/40" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[320px]">
        {chatModels.map((model) => {
          const ModelIcon = iconMap[model.icon] ?? Sparkles;
          const isSelected = model.id === selectedModelId;

          return (
            <DropdownMenuItem
              key={model.id}
              onClick={() => onSelectModel(model.id)}
              className={cn(
                'flex items-start gap-3 p-3',
                isSelected && 'bg-white/10'
              )}
            >
              <ModelIcon
                className={cn(
                  'mt-0.5 h-5 w-5 shrink-0',
                  isSelected ? 'text-white' : 'text-white/50'
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn('font-medium', isSelected && 'text-white')}>
                    {model.name}
                  </span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-white/40">{model.provider}</span>
                  <Badge variant="default" className="text-[10px] px-1.5 py-0">
                    {formatContext(model.contextWindow)}
                  </Badge>
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function getModelById(modelId: string): ChatModel {
  return chatModels.find((m) => m.id === modelId) ?? chatModels[0];
}
