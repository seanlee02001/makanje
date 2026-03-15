import Link from 'next/link'
import type { Meal } from '@/lib/supabase/types'

export function MealCard({ meal }: { meal: Meal }) {
  const domain = meal.source_url
    ? (() => { try { return new URL(meal.source_url).hostname.replace('www.', '') } catch { return null } })()
    : null

  return (
    <Link
      href={`/meals/${meal.id}`}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2 hover:shadow-md transition-shadow active:scale-[0.98]"
    >
      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-xl">
        🍽️
      </div>
      <div>
        <p className="font-medium text-gray-900 line-clamp-2">{meal.name}</p>
        {domain && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{domain}</p>
        )}
      </div>
    </Link>
  )
}
