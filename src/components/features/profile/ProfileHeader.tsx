'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil } from '@/components/ui/icons';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/lib/stores/user-store';
import { EditProfileModal } from './EditProfileModal';

export function ProfileHeader() {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const user = useUserStore((s) => s.user);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
    : '?';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6"
      >
        <Avatar className="h-20 w-20">
          <AvatarImage src={user?.avatar_url ?? undefined} alt={user?.name ?? ''} />
          <AvatarFallback className="text-xl">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">{user?.name ?? 'Пользователь'}</h2>
          </div>
          <p className="text-sm text-white/50">{user?.email ?? ''}</p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="gap-2 shrink-0"
          onClick={() => setEditModalOpen(true)}
        >
          <Pencil className="h-3.5 w-3.5" />
          Редактировать
        </Button>
      </motion.div>

      <EditProfileModal open={editModalOpen} onOpenChange={setEditModalOpen} />
    </>
  );
}
