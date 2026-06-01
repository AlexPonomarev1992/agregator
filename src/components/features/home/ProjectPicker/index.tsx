'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FolderPlus, Plus, ChevronDown, X } from '@/components/ui/icons';
import type { Project } from '@/types';

interface ProjectPickerProps {
  currentProjectId: string | null;
  projects: Project[];
  onSelect: (id: string | null) => void;
  onCreateNew: () => void;
}

export function ProjectPicker({
  currentProjectId,
  projects,
  onSelect,
  onCreateNew,
}: ProjectPickerProps) {
  const [open, setOpen] = useState(false);

  const currentProject = projects.find((p) => p.id === currentProjectId) ?? null;

  function handleSelect(id: string | null) {
    onSelect(id);
    setOpen(false);
  }

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium',
          'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20',
          'text-white/70 transition-colors duration-150'
        )}
      >
        <FolderPlus className="h-3.5 w-3.5 text-white/50" />
        <span className="max-w-[120px] truncate">
          {currentProject ? currentProject.name : 'Без проекта'}
        </span>
        <ChevronDown
          className={cn(
            'h-3 w-3 text-white/40 transition-transform duration-150',
            open && 'rotate-180'
          )}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'absolute top-full mt-1.5 left-0 z-20 w-[220px] rounded-xl',
                'bg-zinc-900/95 border border-white/10 backdrop-blur-md shadow-2xl',
                'overflow-hidden'
              )}
            >
              {/* No project option */}
              <button
                onClick={() => handleSelect(null)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2.5 text-xs transition-colors',
                  'hover:bg-white/5',
                  !currentProjectId ? 'text-[#7F77DD]' : 'text-white/60'
                )}
              >
                <X className="h-3.5 w-3.5 text-white/30" />
                Без проекта
              </button>

              {projects.length > 0 && (
                <>
                  <div className="h-px bg-white/5 mx-2" />
                  <div className="max-h-[200px] overflow-y-auto">
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => handleSelect(project.id)}
                        className={cn(
                          'flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors',
                          'hover:bg-white/5',
                          currentProjectId === project.id ? 'text-[#7F77DD]' : 'text-white/70'
                        )}
                      >
                        <FolderPlus className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
                        <span className="truncate">{project.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="h-px bg-white/5 mx-2" />

              {/* Create new */}
              <button
                onClick={() => {
                  setOpen(false);
                  onCreateNew();
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-[#7F77DD] hover:bg-[#7F77DD]/10 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Создать проект
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
