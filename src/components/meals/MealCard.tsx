import Link from 'next/link'
import type { Meal } from '@/lib/supabase/types'

export function MealCard({ meal }: { meal: Meal }) {
  const domain = meal.source_url
    ? (() => { try { return new URL(meal.source_url).hostname.replace('www.', '') } catch { return null } })()
    : null

  return (
    <Link
      href={`/meals/${meal.id}`}
      className="glass rounded-2xl p-4 flex flex-col gap-2.5 hover:brightness-95 transition-all active:scale-[0.97] shadow-sm"
    >
      {/* Vivid orange icon circle */}
      <div className="w-11 h-11 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm">
        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a7 7 0 017 7c0 3.5-2 6-4 7v2H9v-2c-2-1-4-3.5-4-7a7 7 0 017-7z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 21h6" />
        </svg>
      </div>
      <div>
        <p className="font-bold text-[#0F172A] dark:text-[#FED7AA] line-clamp-2 text-sm font-heading leading-snug">{meal.name}</p>
        {domain && (
          <p className="text-xs text-slate-500 dark:text-orange-200/60 mt-1 truncate font-medium">{domain}</p>
        )}
      </div>
    </Link>
  )
}
