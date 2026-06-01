import type { Metadata } from 'next'
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AiHub } from '@/components/features/home/AiHub';

export const metadata: Metadata = {
  title: 'VibeLab — Командный центр',
  description: 'ИИ-агент с доступом ко всем моделям: видео, фото, музыка, TTS.',
}

export default async function AiRoute() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  return <AiHub userId={session.user.id} />;
}
