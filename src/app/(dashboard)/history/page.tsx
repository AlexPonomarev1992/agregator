import type { Metadata } from 'next'
import { HistoryPage } from '@/components/features/history/HistoryPage';

export const metadata: Metadata = {
  title: 'История',
  description: 'История генераций видео и фото.',
}

export default function HistoryRoute() {
  return <HistoryPage />;
}
