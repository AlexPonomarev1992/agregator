'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[VibeLab Global Error]', error);
  }, [error]);

  return (
    <html lang="ru">
      <body style={{ background: '#000', color: '#fff', fontFamily: 'system-ui', padding: '2rem' }}>
        <h2>Ошибка приложения</h2>
        <pre style={{ color: '#f87171', background: '#1a1a1a', padding: '1rem', borderRadius: '8px', overflow: 'auto', maxWidth: '100%' }}>
          {error.message}
          {'\n\n'}
          {error.stack}
        </pre>
        <button
          onClick={reset}
          style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          Попробовать снова
        </button>
      </body>
    </html>
  );
}
