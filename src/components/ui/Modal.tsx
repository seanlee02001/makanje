'use client'

import { useEffect, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) {
      document.addEventListener('keydown', handler)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Scrim */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[6px]"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          'relative w-full sm:max-w-lg bg-white border border-gray-200',
          'rounded-t-[28px] sm:rounded-[24px] shadow-2xl h-full sm:h-auto sm:max-h-[90vh] flex flex-col',
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex-shrink-0 flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-base font-bold text-gray-900 font-heading">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 hover:bg-gray-100 text-gray-500"
              aria-label="Close"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 overscroll-contain">{children}</div>

        {/* Pinned footer — outside the scroll area */}
        {footer && (
          <div className="flex-shrink-0 px-4 pb-6 pt-3 border-t border-gray-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
