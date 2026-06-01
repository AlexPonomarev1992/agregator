'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Auto-reload on chunk load failures (happens after deploy)
    if (error.message?.includes('Loading chunk') || error.message?.includes('Failed to fetch dynamically imported module')) {
      window.location.reload();
      return;
    }
    console.error('[VibeLab Error Boundary]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 text-white">
      <h2 className="text-xl font-bold">Что-то пошло не так</h2>
      <pre className="max-w-xl rounded-lg bg-white/5 p-4 text-sm text-red-400 overflow-auto">
        {error.message}
      </pre>
      <button
        onClick={() => window.location.reload()}
        className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20 transition-colors"
      >
        Обновить страницу
      </button>
    </div>
  );
}
