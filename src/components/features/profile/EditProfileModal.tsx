'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, RefreshCw, Upload } from '@/components/ui/icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useUserStore } from '@/lib/stores/user-store';
import type { SocialLink } from '@/types';

const PLATFORMS: SocialLink['platform'][] = ['youtube', 'instagram', 'tiktok', 'telegram', 'twitter'];

const PLATFORM_LABELS: Record<SocialLink['platform'], string> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  telegram: 'Telegram',
  twitter: 'Twitter',
};

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function generateDiceBearUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

export function EditProfileModal({ open, onOpenChange }: EditProfileModalProps) {
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const currentAvatar = avatarPreview ?? user?.avatar_url ?? undefined;

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2)
    : '?';

  const handleRandomAvatar = () => {
    const seed = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setAvatarPreview(generateDiceBearUrl(seed));
  };

  const handleUploadAvatar = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой (макс. 5 МБ)');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        console.error('[EditProfileModal] Upload failed');
        return;
      }

      const data = await res.json();
      setAvatarPreview(data.data?.url ?? data.url);
    } catch (error) {
      console.error('[EditProfileModal] Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const addLink = () => {
    const usedPlatforms = new Set(socialLinks.map((l) => l.platform));
    const available = PLATFORMS.find((p) => !usedPlatforms.has(p));
    if (available) {
      setSocialLinks([...socialLinks, { platform: available, url: '' }]);
    }
  };

  const removeLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, field: 'platform' | 'url', value: string) => {
    const updated = [...socialLinks];
    if (field === 'platform') {
      updated[index] = { ...updated[index], platform: value as SocialLink['platform'] };
    } else {
      updated[index] = { ...updated[index], url: value };
    }
    setSocialLinks(updated);
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || undefined,
          bio: bio || undefined,
          avatarUrl: avatarPreview || undefined,
          socialLinks: socialLinks.length > 0 ? socialLinks : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error('[EditProfileModal] Failed to save profile:', data);
        return;
      }

      // Update Zustand store with new avatar
      if (avatarPreview && user) {
        setUser({ ...user, avatar_url: avatarPreview });
      }

      onOpenChange(false);
    } catch (error) {
      console.error('[EditProfileModal] Error saving profile:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать профиль</DialogTitle>
          <DialogDescription>Обновите информацию о себе</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Avatar with upload and random generation */}
          <div className="flex flex-col items-center gap-3">
            <motion.div whileHover={{ scale: 1.05 }} className="relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Avatar className="h-20 w-20">
                <AvatarImage src={currentAvatar} alt={user?.name ?? ''} />
                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                <Upload className="h-4 w-4 text-white" />
              </div>
            </motion.div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadAvatar(file);
              }}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="gap-1.5 text-xs"
              >
                <Upload className="h-3 w-3" />
                {isUploading ? 'Загрузка...' : 'Загрузить'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRandomAvatar}
                className="gap-1.5 text-xs"
              >
                <RefreshCw className="h-3 w-3" />
                Рандом
              </Button>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Имя</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ваше имя"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white/70">О себе</label>
              <span className="text-xs text-white/40">{bio.length}/160</span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 160))}
              placeholder="Расскажите о себе..."
              maxLength={160}
              rows={3}
              className="flex w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 transition-colors focus:border-white/50 focus:ring-1 focus:ring-white/30 focus:outline-none resize-none"
            />
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/70">Социальные сети</label>
            {socialLinks.map((link, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2"
              >
                <select
                  value={link.platform}
                  onChange={(e) => updateLink(index, 'platform', e.target.value)}
                  className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:border-white/50 focus:ring-1 focus:ring-white/30 focus:outline-none"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p} className="bg-zinc-900 text-white">
                      {PLATFORM_LABELS[p]}
                    </option>
                  ))}
                </select>
                <Input
                  value={link.url}
                  onChange={(e) => updateLink(index, 'url', e.target.value)}
                  placeholder="URL профиля"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLink(index)}
                  className="shrink-0 text-white/40 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}

            {socialLinks.length < PLATFORMS.length && (
              <Button
                variant="secondary"
                size="sm"
                onClick={addLink}
                className="gap-2"
              >
                <Plus className="h-3.5 w-3.5" />
                Добавить ссылку
              </Button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave}>
            Сохранить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
