'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { ProjectList } from './ProjectList';
import { ChatArea } from './ChatArea';
import { CreateProjectModal } from './CreateProjectModal';
import type { ChatMessage, Project } from '@/types';
import type { Persona, ConversationSettings, FileAttachment } from '@/types/ai';
import { mockPersonas } from '@/lib/mock/personas';

// API returns camelCase from Drizzle
interface ApiProject {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  context: string | null;
  isArchived: boolean;
  modelId: string | null;
  personaId: string | null;
  createdAt: string;
  updatedAt: string;
}

// Map API project to frontend type
function mapProject(api: ApiProject): Project {
  return {
    id: api.id,
    user_id: api.userId,
    name: api.name,
    description: api.description,
    context: api.context,
    is_archived: api.isArchived,
    created_at: api.createdAt,
    updated_at: api.updatedAt,
    modelId: api.modelId ?? undefined,
    personaId: api.personaId ?? undefined,
  };
}

export function AssistantPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  // Проекты из общего кэша TanStack Query (тот же ключ, что в ChatList — один запрос на всё приложение)
  const { data: fetchedProjects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects', { credentials: 'include' });
      if (!res.ok) return [];
      const json = await res.json();
      const apiProjects: ApiProject[] = json.data ?? [];
      return apiProjects.map(mapProject);
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  // Новые проекты, созданные прямо в этой сессии, добавляем поверх кэша
  const [projectsOverride, setProjectsOverride] = useState<Project[]>([]);
  const projects = useMemo(
    () => [...projectsOverride, ...fetchedProjects.filter((p) => !projectsOverride.some((o) => o.id === p.id))],
    [fetchedProjects, projectsOverride]
  );

  // Model, persona, settings state
  const [selectedModelId, setSelectedModelId] = useState('anthropic/claude-sonnet-4.6');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>('persona-universal');
  const [customPersonas, setCustomPersonas] = useState<Persona[]>([]);
  const [settings, setSettings] = useState<ConversationSettings>({
    modelId: 'anthropic/claude-sonnet-4.6',
    temperature: 0.7,
    maxTokens: 4096,
    systemPrompt: mockPersonas.find((p) => p.id === 'persona-universal')?.systemPrompt ?? '',
    memory: false,
    webAccess: false,
    functionCalling: false,
    structuredOutputs: false,
    thinking: true,
    reasoningEffort: 'medium',
    streamResponse: true,
  });

  const allPersonas = useMemo(() => [...mockPersonas, ...customPersonas], [customPersonas]);

  const persona = useMemo(
    () => allPersonas.find((p) => p.id === selectedPersonaId) ?? null,
    [allPersonas, selectedPersonaId]
  );

  const personaMap = useMemo(() => {
    const map: Record<string, { name: string; icon: string }> = {};
    for (const p of allPersonas) {
      map[p.id] = { name: p.name, icon: p.icon };
    }
    return map;
  }, [allPersonas]);

  // Load messages when project is selected
  const handleSelectProject = useCallback(async (projectId: string) => {
    setSelectedProjectId(projectId);
    setShowChat(true);

    // Load messages from API
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const json = await res.json();
        const projectData = json.data;
        if (projectData?.messages) {
          const mapped: ChatMessage[] = projectData.messages.map((m: { id: string; projectId: string; role: string; content: string; createdAt: string }) => ({
            id: m.id,
            project_id: m.projectId,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            created_at: m.createdAt,
          }));
          setMessages((prev) => {
            // Remove old messages for this project, add new ones
            const otherMessages = prev.filter((msg) => msg.project_id !== projectId);
            return [...otherMessages, ...mapped];
          });
        }
      }
    } catch (error) {
      console.error('[AssistantPage] Failed to load messages:', error);
    }

    // Load project-specific model/persona if set
    const proj = projects.find((p) => p.id === projectId);
    if (proj?.modelId) setSelectedModelId(proj.modelId);
    if (proj?.personaId) {
      setSelectedPersonaId(proj.personaId);
      const p = allPersonas.find((per) => per.id === proj.personaId);
      if (p) {
        setSettings((prev) => ({ ...prev, systemPrompt: p.systemPrompt }));
      }
    }
  }, [projects, allPersonas]);

  const handleBack = () => {
    setShowChat(false);
  };

  const handleSendMessage = useCallback(
    async (content: string, attachments?: FileAttachment[]) => {
      if (!selectedProjectId) return;

      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        project_id: selectedProjectId,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
        attachments,
      };

      setMessages((prev) => [...prev, userMessage]);

      // Send to real API via SSE
      try {
        const res = await fetch(`/api/projects/${selectedProjectId}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            modelId: selectedModelId,
            systemPrompt: settings.systemPrompt,
          }),
        });

        if (res.ok && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let aiContent = '';
          const aiMessageId = `msg-${Date.now()}-ai`;

          // Add initial empty AI message
          const aiMessage: ChatMessage = {
            id: aiMessageId,
            project_id: selectedProjectId,
            role: 'assistant',
            content: '',
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, aiMessage]);

          // Read SSE stream
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') break;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    aiContent += parsed.content;
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === aiMessageId ? { ...m, content: aiContent } : m
                      )
                    );
                  }
                } catch {
                  // Might be partial JSON, accumulate text directly
                  aiContent += data;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === aiMessageId ? { ...m, content: aiContent } : m
                    )
                  );
                }
              }
            }
          }
        } else {
          // Fallback: show error message
          const aiMessage: ChatMessage = {
            id: `msg-${Date.now()}-ai`,
            project_id: selectedProjectId,
            role: 'assistant',
            content: 'Не удалось получить ответ от ИИ. Попробуйте позже.',
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, aiMessage]);
        }
      } catch (error) {
        console.error('[AssistantPage] Chat error:', error);
        const aiMessage: ChatMessage = {
          id: `msg-${Date.now()}-ai`,
          project_id: selectedProjectId,
          role: 'assistant',
          content: 'Произошла ошибка при отправке сообщения.',
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    },
    [selectedProjectId, selectedModelId, settings.systemPrompt]
  );

  const handleEditMessage = useCallback((messageId: string, newContent: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, content: newContent, isEdited: true } : m
      )
    );
  }, []);

  const handleDeleteMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  const handleRegenerateMessage = useCallback(
    (messageId: string) => {
      if (!selectedProjectId) return;
      // Remove the AI message and re-send the last user message
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    },
    [selectedProjectId]
  );

  const handleClearHistory = useCallback(() => {
    if (!selectedProjectId) return;
    setMessages((prev) => prev.filter((m) => m.project_id !== selectedProjectId));
  }, [selectedProjectId]);

  const handleSelectPersona = useCallback(
    (personaId: string) => {
      setSelectedPersonaId(personaId);
      const p = allPersonas.find((per) => per.id === personaId);
      if (p) {
        setSettings((prev) => ({ ...prev, systemPrompt: p.systemPrompt }));
      }
    },
    [allPersonas]
  );

  const handleCreatePersona = useCallback((newPersona: Persona) => {
    setCustomPersonas((prev) => [...prev, newPersona]);
  }, []);

  const handleDeletePersona = useCallback((personaId: string) => {
    setCustomPersonas((prev) => prev.filter((p) => p.id !== personaId));
    if (selectedPersonaId === personaId) {
      setSelectedPersonaId('persona-universal');
    }
  }, [selectedPersonaId]);

  const handleCreateProject = useCallback(
    (project: Project) => {
      setProjectsOverride((prev) => [project, ...prev]);
      setSelectedProjectId(project.id);
      setShowChat(true);
      if (project.modelId) setSelectedModelId(project.modelId);
      if (project.personaId) handleSelectPersona(project.personaId);
    },
    [handleSelectPersona]
  );

  const projectMessages = selectedProjectId
    ? messages.filter((m) => m.project_id === selectedProjectId)
    : [];

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
          <p className="text-sm text-white/50">Загрузка проектов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-0 overflow-hidden">
      {/* Desktop: always show both panels */}
      <div className="hidden md:block w-[280px] shrink-0 border-r border-white/10">
        <ProjectList
          selectedProjectId={selectedProjectId}
          onSelectProject={handleSelectProject}
          onCreateProject={() => setShowCreateModal(true)}
          projects={projects}
          messages={messages}
          personaMap={personaMap}
        />
      </div>
      <div className="hidden md:flex flex-1 flex-col">
        <ChatArea
          selectedProjectId={selectedProjectId}
          messages={projectMessages}
          onSendMessage={handleSendMessage}
          selectedModelId={selectedModelId}
          onSelectModel={setSelectedModelId}
          persona={persona}
          onSelectPersona={handleSelectPersona}
          settings={settings}
          onSettingsChange={setSettings}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          onRegenerateMessage={handleRegenerateMessage}
          onClearHistory={handleClearHistory}
          customPersonas={customPersonas}
          onCreatePersona={handleCreatePersona}
          onDeletePersona={handleDeletePersona}
          projects={projects}
        />
      </div>

      {/* Mobile: show one panel at a time */}
      <div className="flex md:hidden flex-1 flex-col">
        <AnimatePresence mode="wait">
          {!showChat ? (
            <motion.div
              key="project-list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1"
            >
              <ProjectList
                selectedProjectId={selectedProjectId}
                onSelectProject={handleSelectProject}
                onCreateProject={() => setShowCreateModal(true)}
                projects={projects}
                messages={messages}
                personaMap={personaMap}
              />
            </motion.div>
          ) : (
            <motion.div
              key="chat-area"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-1 flex-col"
            >
              <div className="flex items-center gap-2 p-3 border-b border-white/10">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <span className="text-sm text-white/60">Назад к проектам</span>
              </div>
              <ChatArea
                selectedProjectId={selectedProjectId}
                messages={projectMessages}
                onSendMessage={handleSendMessage}
                selectedModelId={selectedModelId}
                onSelectModel={setSelectedModelId}
                persona={persona}
                onSelectPersona={handleSelectPersona}
                settings={settings}
                onSettingsChange={setSettings}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
                onRegenerateMessage={handleRegenerateMessage}
                onClearHistory={handleClearHistory}
                customPersonas={customPersonas}
                onCreatePersona={handleCreatePersona}
                onDeletePersona={handleDeletePersona}
                projects={projects}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create project modal */}
      <CreateProjectModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
}
