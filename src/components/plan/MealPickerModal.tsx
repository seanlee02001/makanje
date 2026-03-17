'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createMeal, addDishToMeal } from '@/lib/supabase/queries/meals'
import { getDishes } from '@/lib/supabase/queries/dishes'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import type { Meal, Dish, DayOfWeek, MealSlotType } from '@/lib/supabase/types'

interface MealPickerModalProps {
  open: boolean
  onClose: () => void
  familyId: string
  weekStart?: string
  day: DayOfWeek
  mealSlot: MealSlotType
  onSelect: (meal: Meal) => void
}

const SLOT_LABEL: Record<MealSlotType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
}

const DAY_LABEL: Record<DayOfWeek, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu',
  fri: 'Fri', sat: 'Sat', sun: 'Sun',
}

export function MealPickerModal({
  open, onClose, familyId, day, mealSlot, onSelect
}: MealPickerModalProps) {
  const [dishes, setDishes] = useState<(Dish & { ingredients: { id: string }[] })[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  useEffect(() => {
    if (!open || !familyId) return
    setSelectedIds([])
    setQuery('')
    setError('')
    setLoading(true)
    getDishes(familyId).then((data) => {
      setDishes([...data].sort((a, b) => a.name.localeCompare(b.name)))
      setLoading(false)
    })
  }, [open, familyId])

  function toggleDish(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function handleConfirm() {
    if (selectedIds.length === 0) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setSaving(true)
    setError('')
    try {
      // Auto-name the meal from selected dish names
      const selected = dishes.filter((d) => selectedIds.includes(d.id))
      const mealName = selected.map((d) => d.name).join(' · ')

      const meal = await createMeal(familyId, mealName, user.id)
      for (let i = 0; i < selectedIds.length; i++) {
        await addDishToMeal(meal.id, selectedIds[i], i)
      }
      onSelect(meal)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
      setSaving(false)
    }
  }

  const filtered = dishes.filter((d) =>
    d.name.toLowerCase().includes(query.toLowerCase())
  )

  const title = `${DAY_LABEL[day]} · ${SLOT_LABEL[mealSlot]}`

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-3">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </div>
          <input
            type="search"
            placeholder="Search dishes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full rounded-xl border border-gray-200 pl-9 pr-4 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
          />
        </div>

        {/* Selected summary chip */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {dishes
              .filter((d) => selectedIds.includes(d.id))
              .map((d) => (
                <button
                  key={d.id}
                  onClick={() => toggleDish(d.id)}
                  className="flex items-center gap-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full px-2.5 py-1 hover:bg-orange-200 transition-colors"
                >
                  {d.name}
                  <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ))}
          </div>
        )}

        {/* Dish list */}
        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : dishes.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm font-semibold text-gray-700">No dishes yet</p>
            <p className="text-xs text-gray-400 mt-1">Add dishes in the Dishes tab first.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50 max-h-64 overflow-y-auto -mx-1">
            {filtered.length === 0 ? (
              <li className="py-4 text-center text-sm text-gray-400">No dishes match your search.</li>
            ) : (
              filtered.map((dish) => {
                const selected = selectedIds.includes(dish.id)
                return (
                  <li key={dish.id}>
                    <button
                      onClick={() => toggleDish(dish.id)}
                      className={`w-full flex items-center justify-between px-3 py-3 transition-colors rounded-lg ${
                        selected ? 'bg-orange-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-left">
                        <p className={`text-sm font-medium ${selected ? 'text-orange-700' : 'text-gray-900'}`}>
                          {dish.name}
                        </p>
                        {dish.ingredients.length > 0 && (
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {dish.ingredients.length} ingredient{dish.ingredients.length !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-3 transition-colors ${
                        selected ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                      }`}>
                        {selected && (
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={selectedIds.length === 0 || saving}
          className="w-full rounded-xl bg-orange-500 text-white text-sm font-semibold py-2.5 hover:bg-orange-600 disabled:opacity-40 transition-colors mt-1"
        >
          {saving
            ? 'Adding…'
            : selectedIds.length === 0
            ? 'Select dishes to add'
            : `Add ${selectedIds.length} dish${selectedIds.length > 1 ? 'es' : ''} to plan`}
        </button>
      </div>
    </Modal>
  )
}
