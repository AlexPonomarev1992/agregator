'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ModeSwitcher } from '../ModeSwitcher';
import { ProjectPicker } from '../ProjectPicker';
import { ContextPanel } from '../ContextPanel';
import { ChatView } from '../ChatView';
import { CreateProjectModal } from '@/components/features/ai/CreateProjectModal';
import { useAgentStore } from '@/lib/stores/agent-store';
import { useUserStore } from '@/lib/stores/user-store';
import type { Project } from '@/types';
import { Settings, X } from '@/components/ui/icons';

interface HomeCommandCenterProps {
  userId: string;
  initialProjects?: Project[];
}

export function HomeCommandCenter({ userId, initialProjects = [] }: HomeCommandCenterProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const {
    currentMode,
    currentProjectId,
    currentChatId,
    setMode,
    setProject,
    setCurrentChatId,
    setPendingPrompt,
    clearAttachments,
  } = useAgentStore();

  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [contextPanelOpen, setContextPanelOpen] = useState(false);

  const credits = useUserStore((s) => s.credits);

  // Sync chatId from URL ?chat= param
  useEffect(() => {
    const urlChatId = searchParams.get('chat');
    if (urlChatId !== currentChatId) {
      setCurrentChatId(urlChatId);
    }
  }, [searchParams, currentChatId, setCurrentChatId]);

  // Load projects if not provided
  useEffect(() => {
    if (initialProjects.length > 0) return;
    async function load() {
      try {
        const res = await fetch('/api/projects', { credentials: 'include' });
        if (!res.ok) return;
        const json = await res.json() as { data: Project[] };
        setProjects(json.data ?? []);
      } catch {
        // silent
      }
    }
    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hotkeys
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            setPendingPrompt('');
            clearAttachments();
            break;
          case '1':
            e.preventDefault();
            setMode('chat');
            break;
          case '2':
            e.preventDefault();
            setMode('video');
            break;
          case '3':
            e.preventDefault();
            setMode('image');
            break;
          case '4':
            e.preventDefault();
            setMode('music');
            break;
          case '5':
            e.preventDefault();
            setMode('tts');
            break;
        }
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [setPendingPrompt, clearAttachments, setMode]);

  const handleProjectSelect = useCallback(
    (id: string | null) => {
      setProject(id);
      if (id) {
        router.push(`/ai?chat=${id}`);
      } else {
        router.push('/ai');
      }
    },
    [setProject, router]
  );

  const handleCreateProject = useCallback(
    (project: Project) => {
      setProjects((prev) => [project, ...prev]);
      setProject(project.id);
      router.push(`/ai?chat=${project.id}`);
    },
    [setProject, router]
  );

  // When mode changes to a generation mode, auto-select top model
  // (handled by agent-store.setMode — setMode stores per-mode defaults)

  return (
    <div className="flex h-full overflow-hidden">
      {/* Center Column */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-4 py-6">
        <div className="w-full max-w-[720px] mx-auto flex flex-col flex-1 min-h-0 gap-5">

          {/* Top row: project picker + mode switcher */}
          <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
            <ProjectPicker
              currentProjectId={currentProjectId}
              projects={projects}
              onSelect={handleProjectSelect}
              onCreateNew={() => setShowCreateModal(true)}
            />
            <ModeSwitcher value={currentMode} onChange={setMode} />
            <div className="flex-1" />
            {/* Mobile context button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setContextPanelOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white/60 hover:text-white/80"
            >
              <Settings className="h-3.5 w-3.5" />
              Контекст
            </motion.button>
          </div>

          {/* Balance info for mobile */}
          {credits && (
            <div className="lg:hidden flex items-center justify-between py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50 flex-shrink-0">
              <span>
                Баланс:{' '}
                <span className="text-white/80 font-medium">{credits.balance.toLocaleString('ru-RU')}</span>{' '}
                кредитов
              </span>
            </div>
          )}

          {/* ChatView — ALWAYS rendered. Mode controls behaviour inside. */}
          <ChatView userId={userId} chatId={currentChatId} />
        </div>
      </div>

      {/* Right Column — Context Panel (desktop only) */}
      <div className="hidden lg:flex flex-col w-[300px] flex-shrink-0 border-l border-white/8 px-4 py-6 overflow-hidden">
        <ContextPanel userId={userId} />
      </div>

      {/* Mobile Context Panel backdrop */}
      {contextPanelOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setContextPanelOpen(false)}
        />
      )}

      {/* Mobile Context Panel drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: contextPanelOpen ? 0 : '100%' }}
        transition={{ type: 'spring', bounce: 0.1, duration: 0.35 }}
        className={cn(
          'fixed right-0 top-0 bottom-0 z-50 w-[300px]',
          'bg-zinc-950 border-l border-white/10 px-4 py-6 lg:hidden',
          'overflow-y-auto'
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-white/80">Контекст</span>
          <button
            onClick={() => setContextPanelOpen(false)}
            className="text-white/40 hover:text-white/70 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ContextPanel userId={userId} />
      </motion.div>

      {/* Create project modal */}
      <CreateProjectModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
}
