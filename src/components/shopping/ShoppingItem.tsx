'use client'

import { cn } from '@/lib/utils/cn'
import type { ShoppingItem as ShoppingItemType } from '@/lib/supabase/types'

interface ShoppingItemProps {
  item: ShoppingItemType
  onToggle: () => void
}

export function ShoppingItemRow({ item, onToggle }: ShoppingItemProps) {
  return (
    <li
      onClick={onToggle}
      className={cn(
        'flex items-center gap-3 py-3 px-4 rounded-xl cursor-pointer select-none transition-colors',
        item.checked ? 'bg-gray-50' : 'bg-white hover:bg-emerald-50/40'
      )}
    >
      <div className={cn(
        'h-5 w-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors',
        item.checked ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
      )}>
        {item.checked && (
          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', item.checked ? 'text-gray-400 line-through' : 'text-gray-900')}>
          {item.name}
        </p>
        {item.source && !item.manual && (
          <p className="text-xs text-gray-400 truncate">{item.source}</p>
        )}
      </div>

      {(item.quantity || item.unit) && (
        <span className={cn('text-sm shrink-0', item.checked ? 'text-gray-300' : 'text-gray-500')}>
          {item.quantity ? `${item.quantity}` : ''}{item.unit ? ` ${item.unit}` : ''}
        </span>
      )}
    </li>
  )
}
