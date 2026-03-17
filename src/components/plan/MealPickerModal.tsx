'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMeals, createMeal, addDishToMeal } from '@/lib/supabase/queries/meals'
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

export function MealPickerModal({
  open, onClose, familyId, day, mealSlot, onSelect
}: MealPickerModalProps) {
  // Pick view
  const [meals, setMeals] = useState<Meal[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  // Create view
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [allDishes, setAllDishes] = useState<Dish[]>([])
  const [selectedDishIds, setSelectedDishIds] = useState<string[]>([])
  const [dishQuery, setDishQuery] = useState('')
  const [loadingDishes, setLoadingDishes] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const supabase = createClient()

  // Load meals when picker opens
  useEffect(() => {
    if (!open || !familyId) return
    setCreating(false)
    setQuery('')
    setLoading(true)
    getMeals(familyId).then((data) => {
      const sorted = [...(data ?? [])].sort((a, b) => a.name.localeCompare(b.name))
      setMeals(sorted)
      setLoading(false)
    })
  }, [open, familyId])

  // Load dishes when switching to create view
  useEffect(() => {
    if (!creating || !familyId || allDishes.length > 0) return
    setLoadingDishes(true)
    getDishes(familyId)
      .then((data) => setAllDishes(data ?? []))
      .finally(() => setLoadingDishes(false))
  }, [creating, familyId, allDishes.length])

  function openCreate() {
    setNewName('')
    setSelectedDishIds([])
    setDishQuery('')
    setSaveError('')
    setCreating(true)
  }

  function toggleDish(id: string) {
    setSelectedDishIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function handleCreateMeal() {
    if (!newName.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setSaving(true)
    setSaveError('')
    try {
      const meal = await createMeal(familyId, newName.trim(), user.id)
      for (let i = 0; i < selectedDishIds.length; i++) {
        await addDishToMeal(meal.id, selectedDishIds[i], i)
      }
      // Add to local list and select it
      setMeals((prev) => [...prev, meal].sort((a, b) => a.name.localeCompare(b.name)))
      onSelect(meal)
      onClose()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not create meal')
      setSaving(false)
    }
  }

  const title = `${day.toUpperCase()} — ${mealSlot.charAt(0).toUpperCase() + mealSlot.slice(1)}`
  const filtered = meals.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
  const filteredDishes = allDishes.filter((d) => d.name.toLowerCase().includes(dishQuery.toLowerCase()))
  const selectedDishes = allDishes.filter((d) => selectedDishIds.includes(d.id))

  return (
    <Modal open={open} onClose={onClose} title={creating ? 'New Meal' : title}>
      {creating ? (
        /* ── Create meal view ── */
        <div className="flex flex-col gap-4">
          {/* Back button + name input */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCreating(false)}
              className="text-gray-400 hover:text-gray-600 shrink-0"
              aria-label="Back"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <input
              type="text"
              placeholder="Meal name (e.g. Sunday Roast)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
            />
          </div>

          {/* Selected dishes summary */}
          {selectedDishes.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1.5">
                Added · {selectedDishes.length}
              </p>
              <ul className="flex flex-col gap-0.5">
                {selectedDishes.map((d) => (
                  <li key={d.id} className="flex items-center justify-between bg-orange-50 rounded-lg px-3 py-2">
                    <span className="text-sm font-medium text-orange-800">{d.name}</span>
                    <button
                      onClick={() => toggleDish(d.id)}
                      className="text-orange-400 hover:text-red-500 transition-colors ml-2 shrink-0"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dish search */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Dish Library</p>
            <input
              type="search"
              placeholder="Search dishes…"
              value={dishQuery}
              onChange={(e) => setDishQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm mb-2 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
            />
            {loadingDishes ? (
              <div className="flex justify-center py-6"><Spinner /></div>
            ) : allDishes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No dishes yet — add dishes first.</p>
            ) : (
              <ul className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                {filteredDishes.map((dish) => {
                  const sel = selectedDishIds.includes(dish.id)
                  return (
                    <li key={dish.id}>
                      <button
                        onClick={() => toggleDish(dish.id)}
                        className={`w-full flex items-center justify-between px-2 py-2.5 rounded-lg transition-colors ${
                          sel ? 'bg-orange-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className={`text-sm font-medium ${sel ? 'text-orange-700' : 'text-gray-900'}`}>
                          {dish.name}
                        </span>
                        {sel && (
                          <svg className="h-4 w-4 text-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {saveError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{saveError}</p>
          )}

          <button
            onClick={handleCreateMeal}
            disabled={!newName.trim() || saving}
            className="w-full rounded-xl bg-orange-500 text-white text-sm font-semibold py-2.5 hover:bg-orange-600 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Saving…' : `Save${selectedDishIds.length > 0 ? ` (${selectedDishIds.length} dish${selectedDishIds.length > 1 ? 'es' : ''})` : ''}`}
          </button>
        </div>
      ) : (
        /* ── Pick meal view ── */
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
                const dishNames = mealDishes
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
            onClick={openCreate}
            className="flex items-center gap-2 text-sm text-orange-600 font-medium hover:underline mt-1 px-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add new meal
          </button>
        </div>
      )}
    </Modal>
  )
}
