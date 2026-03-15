'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

const NAV = [
  {
    href: '/plan',
    label: 'Plan',
    icon: (active: boolean) => (
      <svg className={cn('h-6 w-6', active ? 'text-emerald-600' : 'text-gray-400')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    href: '/meals',
    label: 'Meals',
    icon: (active: boolean) => (
      <svg className={cn('h-6 w-6', active ? 'text-emerald-600' : 'text-gray-400')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path d="M12 2a7 7 0 017 7c0 3.5-2 6-4 7v2H9v-2c-2-1-4-3.5-4-7a7 7 0 017-7z" />
        <path d="M9 21h6" />
      </svg>
    ),
  },
  {
    href: '/shopping',
    label: 'Shopping',
    icon: (active: boolean) => (
      <svg className={cn('h-6 w-6', active ? 'text-emerald-600' : 'text-gray-400')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <path d="M3 6h18M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (active: boolean) => (
      <svg className={cn('h-6 w-6', active ? 'text-emerald-600' : 'text-gray-400')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
]

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 pb-20 overflow-auto">{children}</main>
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 safe-area-pb">
        <div className="flex justify-around items-center h-16">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-0.5 px-4 py-2"
              >
                {icon(active)}
                <span className={cn('text-xs font-medium', active ? 'text-emerald-600' : 'text-gray-400')}>
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
