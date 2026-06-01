import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 text-white">
      <div className="text-center">
        <h1 className="text-7xl font-bold text-white/20">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Страница не найдена</h2>
        <p className="mt-2 text-sm text-white/50">
          Запрашиваемая страница не существует или была перемещена.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-xl bg-white/10 px-6 py-2.5 text-sm font-medium transition-colors hover:bg-white/20"
      >
        На главную
      </Link>
    </div>
  )
}
