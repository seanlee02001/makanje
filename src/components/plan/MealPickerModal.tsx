'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getMeals } from '@/lib/supabase/queries/meals'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import type { Meal, DayOfWeek, MealSlotType } from '@/lib/supabase/types'

interface MealPickerModalProps {
  open: boolean
  onClose: () => void
  familyId: string
  weekStart?: string
  day: DayOfWeek
  mealSlot: MealSlotType
  onSelect: (meal: Meal) => void
}

export function MealPickerModal({
  open, onClose, familyId, day, mealSlot, onSelect
}: MealPickerModalProps) {
  const [meals, setMeals] = useState<Meal[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!open || !familyId) return
    setLoading(true)
    getMeals(familyId).then((data) => {
      // Sort by name client-side (getMeals sorts by created_at)
      const sorted = [...(data ?? [])].sort((a, b) => a.name.localeCompare(b.name))
      setMeals(sorted)
      setLoading(false)
    })
  }, [open, familyId])

  const filtered = meals.filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase())
  )

  const title = `${day.toUpperCase()} — ${mealSlot.charAt(0).toUpperCase() + mealSlot.slice(1)}`

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-3">
        <input
          type="search"
          placeholder="Search meals…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
          autoFocus
        />

        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <li className="py-4 text-center text-sm text-gray-400">
                {query ? 'No meals match your search.' : 'No meals yet.'}
              </li>
            )}
            {filtered.map((meal) => {
              type MealDishJoin = { sort_order: number; dish?: { name?: string } }
              const mealDishes: MealDishJoin[] = ((meal as Meal & { meal_dishes?: MealDishJoin[] }).meal_dishes) ?? []
              const dishNames: string[] = mealDishes
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((md) => md.dish?.name)
                .filter((n): n is string => Boolean(n))
                .slice(0, 3)

              return (
                <li key={meal.id}>
                  <button
                    onClick={() => { onSelect(meal); onClose() }}
                    className="w-full text-left px-2 py-3 rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900">{meal.name}</p>
                    {dishNames.length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {dishNames.join(' · ')}{mealDishes.length > 3 ? ` +${mealDishes.length - 3}` : ''}
                      </p>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <button
          onClick={() => { onClose(); router.push('/meals/new') }}
          className="flex items-center gap-2 text-sm text-orange-600 font-medium hover:underline mt-1 px-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add new meal
        </button>
      </div>
    </Modal>
  )
}
