import type { Metadata } from 'next'
import { LabPage } from '@/components/features/lab/LabPage';

export const metadata: Metadata = {
  title: 'Лаборатория',
  description: 'Эксперименты и челленджи — зарабатывай XP и поднимайся в рейтинге.',
}

export default function LabRoute() {
  return <LabPage />;
}
