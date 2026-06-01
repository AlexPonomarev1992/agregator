import type { Metadata } from 'next'
import { SettingsPage } from '@/components/features/profile/SettingsPage';

export const metadata: Metadata = {
  title: 'Настройки',
  description: 'Настройки учётной записи VibeLab.',
}

export default function SettingsRoute() {
  return (
    <div className="flex-1 overflow-y-auto p-4 pb-20 lg:p-6 lg:pb-6">
      <SettingsPage />
    </div>
  );
}
