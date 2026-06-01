'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, Send, Youtube, Instagram } from '@/components/ui/icons';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/lib/stores/user-store';

// Toggle switch component
interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-white/40">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
          checked ? 'bg-white' : 'bg-white/10'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}

// Account Settings
function AccountSettings() {
  const user = useUserStore((s) => s.user);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <div className="space-y-6">
      {/* Email */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 space-y-4">
        <h4 className="text-sm font-semibold text-white">Email</h4>
        <Input value={user?.email ?? ''} readOnly className="opacity-60" />
        <p className="text-xs text-white/40">Для смены email обратитесь в поддержку</p>
      </div>

      {/* Change password */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 space-y-4">
        <h4 className="text-sm font-semibold text-white">Смена пароля</h4>
        <div className="space-y-3">
          <Input
            type="password"
            placeholder="Текущий пароль"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Новый пароль"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Подтвердите пароль"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <Button size="sm">Сменить пароль</Button>
      </div>

      {/* 2FA */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
        <ToggleRow
          label="Двухфакторная аутентификация"
          description="Дополнительный уровень безопасности при входе"
          checked={twoFactor}
          onChange={setTwoFactor}
        />
      </div>
    </div>
  );
}

// Notification Settings
function NotificationSettings() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [badgeNotifs, setBadgeNotifs] = useState(true);
  const [friendActivity, setFriendActivity] = useState(false);
  const [platformUpdates, setPlatformUpdates] = useState(true);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
      <div className="divide-y divide-white/5">
        <ToggleRow
          label="Email уведомления"
          description="Получать уведомления на email"
          checked={emailNotifs}
          onChange={setEmailNotifs}
        />
        <ToggleRow
          label="Push уведомления"
          description="Всплывающие уведомления в браузере"
          checked={pushNotifs}
          onChange={setPushNotifs}
        />
        <ToggleRow
          label="Новые бейджи"
          description="Уведомлять о получении новых бейджей"
          checked={badgeNotifs}
          onChange={setBadgeNotifs}
        />
        <ToggleRow
          label="Активность друзей"
          description="Уведомлять об активности ваших друзей"
          checked={friendActivity}
          onChange={setFriendActivity}
        />
        <ToggleRow
          label="Обновления платформы"
          description="Новые функции и обновления VibeLab"
          checked={platformUpdates}
          onChange={setPlatformUpdates}
        />
      </div>
    </div>
  );
}

// Privacy Settings
function PrivacySettings() {
  const [publicProfile, setPublicProfile] = useState(true);
  const [showXp, setShowXp] = useState(true);
  const [showInLeaderboard, setShowInLeaderboard] = useState(true);
  const [allowFriendRequests, setAllowFriendRequests] = useState(true);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
      <div className="divide-y divide-white/5">
        <ToggleRow
          label="Публичный профиль"
          description="Другие пользователи могут видеть ваш профиль"
          checked={publicProfile}
          onChange={setPublicProfile}
        />
        <ToggleRow
          label="Показывать XP"
          description="Отображать количество XP в профиле"
          checked={showXp}
          onChange={setShowXp}
        />
        <ToggleRow
          label="Показывать в рейтинге"
          description="Отображаться в общем рейтинге пользователей"
          checked={showInLeaderboard}
          onChange={setShowInLeaderboard}
        />
        <ToggleRow
          label="Запросы в друзья"
          description="Разрешить другим пользователям добавлять вас"
          checked={allowFriendRequests}
          onChange={setAllowFriendRequests}
        />
      </div>
    </div>
  );
}

// Integration Settings
interface IntegrationCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
}

function IntegrationCard({ name, description, icon, connected }: IntegrationCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{name}</p>
        <p className="text-xs text-white/40">{description}</p>
      </div>
      {connected ? (
        <Badge variant="success">Подключено</Badge>
      ) : (
        <Button size="sm">Подключить</Button>
      )}
    </div>
  );
}

function IntegrationSettings() {
  return (
    <div className="space-y-3">
      <IntegrationCard
        name="Telegram"
        description="Получайте уведомления и делитесь контентом"
        icon={<Send className="h-5 w-5 text-sky-400" />}
        connected={true}
      />
      <IntegrationCard
        name="Discord"
        description="Подключите аккаунт для участия в сообществе"
        icon={<MessageSquare className="h-5 w-5 text-indigo-400" />}
        connected={false}
      />
      <IntegrationCard
        name="YouTube"
        description="Публикуйте видео напрямую из VibeLab"
        icon={<Youtube className="h-5 w-5 text-red-500" />}
        connected={false}
      />
      <IntegrationCard
        name="Instagram"
        description="Делитесь генерациями в Instagram"
        icon={<Instagram className="h-5 w-5 text-pink-400" />}
        connected={false}
      />
    </div>
  );
}

export function SettingsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-white">Настройки</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList>
            <TabsTrigger value="account">Аккаунт</TabsTrigger>
            <TabsTrigger value="notifications">Уведомления</TabsTrigger>
            <TabsTrigger value="privacy">Приватность</TabsTrigger>
            <TabsTrigger value="integrations">Интеграции</TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <AccountSettings />
          </TabsContent>
          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>
          <TabsContent value="privacy">
            <PrivacySettings />
          </TabsContent>
          <TabsContent value="integrations">
            <IntegrationSettings />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
