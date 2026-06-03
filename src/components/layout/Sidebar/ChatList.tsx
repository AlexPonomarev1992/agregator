'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, MoreHorizontal, Plus, Loader2, Check, Pencil, Trash2 } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import type { Project } from '@/types';

interface ChatListProps {
  isCollapsed: boolean;
  currentChatId?: string | null;
}

async function fetchProjects(): Promise<Project[]> {
  const res = await fetch('/api/projects', { credentials: 'include' });
  if (!res.ok) return [];
  const json = await res.json() as { data: Project[] };
  // Exclude hidden __agent__ project
  return (json.data ?? []).filter((p) => p.name !== '__agent__');
}

async function createProject(title: string): Promise<Project> {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name: title, description: '' }),
  });
  if (!res.ok) throw new Error('Failed to create project');
  const json = await res.json() as { data: Project };
  return json.data;
}

async function renameProject(id: string, name: string): Promise<void> {
  await fetch(`/api/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name }),
  });
}

async function deleteProject(id: string): Promise<void> {
  await fetch(`/api/projects/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
}

export function ChatList({ isCollapsed, currentChatId }: ChatListProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: () => createProject('Новый чат'),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.push(`/ai?chat=${project.id}`);
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameProject(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setRenamingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      // If deleted chat is currently open — go back to /ai
      if (currentChatId === id) {
        router.push('/ai');
      }
    },
  });

  function startRename(project: Project) {
    setOpenMenuId(null);
    setRenamingId(project.id);
    setRenameValue(project.name);
    setTimeout(() => renameInputRef.current?.focus(), 60);
  }

  function commitRename(id: string) {
    const trimmed = renameValue.trim();
    if (!trimmed) { setRenamingId(null); return; }
    renameMutation.mutate({ id, name: trimmed });
  }

  if (isCollapsed) return null;

  return (
    <div className="flex flex-col gap-1 px-2">
      {/* Section header */}
      <div className="flex items-center justify-between px-1 mb-1">
        <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">Чаты</span>
      </div>

      {/* New chat button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => createMutation.mutate()}
        disabled={createMutation.isPending}
        className={cn(
          'w-full h-9 rounded-lg flex items-center justify-center gap-1.5',
          'bg-white/5 hover:bg-white/10 transition-colors',
          'text-sm text-white/50 hover:text-white/80',
          'border border-dashed border-white/15 hover:border-white/25'
        )}
      >
        {createMutation.isPending ? (
          <Loader2 className="h-3.5 w-3.5 text-white/40 animate-spin" />
        ) : (
          <Plus className="h-3.5 w-3.5" />
        )}
        <span>Новый чат</span>
      </motion.button>

      {/* Chat list */}
      <div
        className="flex flex-col gap-0.5 mt-1 overflow-y-auto max-h-[260px]"
        style={{ scrollbarWidth: 'none' }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 text-white/30 animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <p className="text-[11px] text-white/25 text-center py-3 px-2">Пока пусто</p>
        ) : (
          <AnimatePresence mode="popLayout">
            {projects.map((project) => {
              const isActive = currentChatId === project.id;
              const isRenaming = renamingId === project.id;

              return (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="group relative"
                >
                  {isRenaming ? (
                    /* Inline rename input */
                    <div className="flex items-center gap-1 px-2 py-1.5">
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 text-white/40" />
                      <input
                        ref={renameInputRef}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename(project.id);
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        onBlur={() => commitRename(project.id)}
                        className="flex-1 bg-transparent text-sm text-white border-b border-[#7F77DD]/60 outline-none py-0.5 min-w-0"
                      />
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); commitRename(project.id); }}
                        className="p-0.5 text-[#7F77DD] hover:text-white"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => router.push(`/ai?chat=${project.id}`)}
                      className={cn(
                        'w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-colors pr-8',
                        isActive
                          ? 'bg-white/10 text-white'
                          : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                      )}
                    >
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 text-white/40" />
                      <span className="text-sm truncate flex-1">{project.name}</span>
                    </button>
                  )}

                  {/* More-menu button */}
                  {!isRenaming && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === project.id ? null : project.id);
                      }}
                      className={cn(
                        'absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded',
                        'opacity-0 group-hover:opacity-100 transition-opacity',
                        'text-white/40 hover:text-white/80 hover:bg-white/10'
                      )}
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Dropdown menu */}
                  <AnimatePresence>
                    {openMenuId === project.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          transition={{ duration: 0.1 }}
                          className={cn(
                            'absolute right-0 top-full z-50 mt-1 w-40',
                            'rounded-lg bg-zinc-900 border border-white/10',
                            'shadow-xl shadow-black/40 py-1'
                          )}
                        >
                          <button
                            onClick={() => startRename(project)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <Pencil className="h-3 w-3" />
                            Переименовать
                          </button>
                          <div className="h-px bg-white/8 my-0.5" />
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              if (confirm(`Удалить чат "${project.name}"?`)) {
                                deleteMutation.mutate(project.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs text-red-400/70 hover:text-red-400 hover:bg-white/5 transition-colors disabled:opacity-40"
                          >
                            <Trash2 className="h-3 w-3" />
                            Удалить
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
