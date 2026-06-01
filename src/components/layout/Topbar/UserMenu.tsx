'use client';

import { useCallback } from 'react';
import { User, LogOut, Crown } from '@/components/ui/icons';
import Link from 'next/link';
import { useUserStore } from '@/lib/stores/user-store';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export const UserMenu = () => {
  const user = useUserStore((s) => s.user);
  const subscription = useUserStore((s) => s.subscription);
  const clearAll = useUserStore((s) => s.clearAll);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/sign-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
        credentials: 'include',
      });
    } catch {
      // Best-effort sign-out
    }
    clearAll();
    window.location.href = '/login';
  }, [clearAll]);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
    : '?';

  const isActive = subscription?.status === 'active';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/30">
          <Avatar className="h-8 w-8 cursor-pointer">
            {user?.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name ?? ''} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-white">{user?.name ?? 'Пользователь'}</p>
            <p className="text-xs text-white/40">{user?.email ?? ''}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Профиль</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-white" />
          <span>RoyalPass</span>
          {isActive && (
            <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white">
              Active
            </span>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center gap-2 text-red-400 focus:text-red-400 cursor-pointer"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>Выйти</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
