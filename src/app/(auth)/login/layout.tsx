import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Вход',
  description: 'Войдите в свой аккаунт VibeLab.',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
