import Link from 'next/link'
import type { Dish } from '@/lib/supabase/types'

interface Props {
  dish: Dish & { ingredients?: { id: string }[] }
}

export function DishCard({ dish }: Props) {
  const domain = dish.source_url
    ? (() => { try { return new URL(dish.source_url).hostname.replace('www.', '') } catch { return null } })()
    : null
  const ingredientCount = dish.ingredients?.length ?? 0

  return (
    <Link
      href={`/dishes/${dish.id}`}
      className="glass rounded-2xl p-4 flex flex-col gap-2.5 hover:brightness-95 transition-all active:scale-[0.97] shadow-sm"
    >
      <div className="w-11 h-11 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm">
        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 2v5M9.5 2v5M7 7c0 1 .5 1.5 1.25 1.5S9.5 8 9.5 7" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 8.5V22" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 2c0 0 3 3 3 6h-3V2z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8v14" />
        </svg>
      </div>
      <div>
        <p className="font-bold text-[#0F172A] dark:text-[#FED7AA] line-clamp-2 text-sm font-heading leading-snug">
          {dish.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {ingredientCount > 0 && (
            <span className="text-xs text-orange-600 font-semibold">
              {ingredientCount} ingredient{ingredientCount !== 1 ? 's' : ''}
            </span>
          )}
          {domain && (
            <span className="text-xs text-slate-500 dark:text-orange-200/60 truncate font-medium">{domain}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
