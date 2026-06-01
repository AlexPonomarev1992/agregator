import type { Metadata } from 'next'
import { ProfilePage } from '@/components/features/profile/ProfilePage';

export const metadata: Metadata = {
  title: 'Профиль',
  description: 'Профиль пользователя, кредиты и подписка.',
}

export default function ProfileRoute() {
  return (
    <div className="flex-1 overflow-y-auto p-4 pb-20 lg:p-6 lg:pb-6">
      <ProfilePage />
    </div>
  );
}
