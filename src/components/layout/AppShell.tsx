'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

const NAV = [
  { href: '/plan', label: 'Today', emoji: '📅' },
  { href: '/dishes', label: 'Dishes', emoji: '🍳' },
  { href: '/shopping', label: 'Shop', emoji: '🛒' },
  { href: '/pantry', label: 'Pantry', emoji: '🏠' },
  { href: '/settings', label: 'More', emoji: '⚙️' },
]

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col min-h-dvh bg-canvas">
      <main className="flex-1 pb-24 overflow-auto">{children}</main>

      <nav
        className="fixed bottom-0 inset-x-0 z-50 safe-area-pb"
        style={{
          background: 'var(--nav-glass)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--nav-border)',
        }}
      >
        <div className="flex justify-around items-center h-16">
          {NAV.map(({ href, label, emoji }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-0.5 px-4 py-2"
              >
                <span className="text-[20px] leading-none">{emoji}</span>
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: active ? 'var(--accent)' : 'var(--text-tertiary)' }}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
