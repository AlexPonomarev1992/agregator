import type { Metadata } from 'next'
import { RatingPage } from '@/components/features/rating/RatingPage';

export const metadata: Metadata = {
  title: 'Рейтинг',
  description: 'Лидерборд и рейтинг пользователей VibeLab.',
}

export default function RatingRoute() {
  return (
    <div className="flex-1 overflow-y-auto p-4 pb-20 lg:p-6 lg:pb-6">
      <RatingPage />
    </div>
  );
}
