'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from '@/components/ui/icons'

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { label: 'Инструменты', href: '#features' },
    { label: 'Модели', href: '#models' },
    { label: 'Тарифы', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white">
            <span className="text-xs font-black text-black">VL</span>
          </div>
          <span className="text-sm font-semibold text-white">VibeLab</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-white/50 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="text-sm text-white/60 transition-colors hover:text-white"
          >
            Войти
          </Link>
          <motion.div whileTap={{ scale: 0.97 }}>
            <Link
              href="/signup"
              className="rounded-lg bg-white px-4 py-1.5 text-sm font-medium text-black transition-opacity hover:opacity-90"
            >
              Попробовать бесплатно
            </Link>
          </motion.div>
        </div>

        {/* Mobile burger */}
        <button
          className="flex md:hidden text-white/60 hover:text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="border-t border-white/5 bg-black px-6 pb-6 pt-4 md:hidden"
          >
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm text-white/60 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-2 flex flex-col gap-3 border-t border-white/10 pt-4">
                <Link href="/login" className="text-sm text-white/60">Войти</Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-white px-4 py-2 text-center text-sm font-medium text-black"
                >
                  Попробовать бесплатно
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
