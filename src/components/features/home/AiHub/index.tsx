'use client';

import { Suspense } from 'react';
import { HomeCommandCenter } from '../HomeCommandCenter';

interface AiHubProps {
  userId: string;
}

export function AiHub({ userId }: AiHubProps) {
  return (
    <Suspense fallback={null}>
      <HomeCommandCenter userId={userId} />
    </Suspense>
  );
}
