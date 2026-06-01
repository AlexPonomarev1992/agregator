'use client';

import { useRef, useEffect, useState } from 'react';
import { MessageSquare } from '@/components/ui/icons';
import { AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ConversationHeader } from './ConversationHeader';
import { ConversationSettings } from './ConversationSettings';
import { PersonaLibrary } from './PersonaLibrary';
import { mockPersonas } from '@/lib/mock/personas';
import type { ChatMessage, Project } from '@/types';
import type { Persona, ConversationSettings as ConversationSettingsType, FileAttachment } from '@/types/ai';

interface ChatAreaProps {
  selectedProjectId: string | null;
  messages: ChatMessage[];
  onSendMessage: (content: string, attachments?: FileAttachment[]) => void;
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  persona: Persona | null;
  onSelectPersona: (personaId: string) => void;
  settings: ConversationSettingsType;
  onSettingsChange: (settings: ConversationSettingsType) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onRegenerateMessage: (messageId: string) => void;
  onClearHistory: () => void;
  customPersonas: Persona[];
  onCreatePersona: (persona: Persona) => void;
  onDeletePersona: (personaId: string) => void;
  projects: Project[];
}

export function ChatArea({
  selectedProjectId,
  messages,
  onSendMessage,
  selectedModelId,
  onSelectModel,
  persona,
  onSelectPersona,
  settings,
  onSettingsChange,
  onEditMessage,
  onDeleteMessage,
  onRegenerateMessage,
  onClearHistory,
  customPersonas,
  onCreatePersona,
  onDeletePersona,
  projects,
}: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPersonaLibrary, setShowPersonaLibrary] = useState(false);

  const project = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId) ?? null
    : null;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = (content: string, attachments?: FileAttachment[]) => {
    onSendMessage(content, attachments);
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1500);
  };

  const handleExportMarkdown = () => {
    const md = messages
      .map((m) => `**${m.role === 'user' ? 'Вы' : 'Ассистент'}:**\n${m.content}`)
      .join('\n\n---\n\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project?.name ?? 'chat'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText('https://vibelab.app/shared/mock-id');
    // Toast would go here in production
  };

  if (!project) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-white/40">
        <MessageSquare className="h-12 w-12" />
        <p className="text-lg">Выберите проект</p>
        <p className="text-sm">Выберите проект из списка, чтобы начать диалог с ИИ-ассистентом</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <ConversationHeader
        project={project}
        selectedModelId={selectedModelId}
        onSelectModel={onSelectModel}
        persona={persona}
        onOpenSettings={() => setShowSettings(true)}
        onOpenPersonaLibrary={() => setShowPersonaLibrary(true)}
        onClearHistory={onClearHistory}
        onExportMarkdown={handleExportMarkdown}
        onShare={handleShare}
        settings={settings}
        messageCount={messages.length}
      />

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onCopy={() => {}}
                onEdit={onEditMessage}
                onRegenerate={onRegenerateMessage}
                onDelete={onDeleteMessage}
              />
            ))}
          </AnimatePresence>
          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20">
                <MessageSquare className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="rounded-2xl rounded-bl-sm bg-white/5 px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-white/40 animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-white/40 animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-white/40 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="shrink-0 border-t border-white/10 p-4">
        <ChatInput onSend={handleSend} />
      </div>

      {/* Settings panel */}
      <ConversationSettings
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={onSettingsChange}
        persona={persona}
      />

      {/* Persona library */}
      <PersonaLibrary
        open={showPersonaLibrary}
        onOpenChange={setShowPersonaLibrary}
        builtInPersonas={mockPersonas}
        customPersonas={customPersonas}
        selectedPersonaId={persona?.id ?? null}
        onSelectPersona={onSelectPersona}
        onCreatePersona={onCreatePersona}
        onDeletePersona={onDeletePersona}
      />
    </div>
  );
}
