import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { Providers } from '@/components/providers'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'VibeLab — AI Creative Platform',
    template: '%s | VibeLab',
  },
  description: 'AI-платформа для создания видео, фото и экспериментов. Генерация контента через Kling, NanoBanana и другие модели.',
  metadataBase: new URL(process.env.BETTER_AUTH_URL || 'https://vibelab.polimatai.site'),
  openGraph: {
    title: 'VibeLab — AI Creative Platform',
    description: 'AI-платформа для создания видео, фото и экспериментов.',
    siteName: 'VibeLab',
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VibeLab — AI Creative Platform',
    description: 'AI-платформа для создания видео, фото и экспериментов.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className={`dark ${GeistSans.className}`} suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
