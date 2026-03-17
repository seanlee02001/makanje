'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  getMealWithDishes,
  getDishes,
  addDishToMeal,
  removeDishFromMeal,
  deleteMeal,
} from '@/lib/supabase/queries/meals'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import type { Dish } from '@/lib/supabase/types'

interface MealDishEntry {
  id: string
  meal_id: string
  dish_id: string
  sort_order: number
  dish: Dish & { ingredients: { id: string }[] }
}

interface MealData {
  id: string
  family_id: string
  name: string
  created_by: string | null
  created_at: string
  meal_dishes: MealDishEntry[]
}

export default function MealDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [meal, setMeal] = useState<MealData | null>(null)
  const [loading, setLoading] = useState(true)

  // Edit meal name
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [savingName, setSavingName] = useState(false)

  // Add dish
  const [showAddDish, setShowAddDish] = useState(false)
  const [allDishes, setAllDishes] = useState<Dish[]>([])
  const [loadingDishes, setLoadingDishes] = useState(false)
  const [dishQuery, setDishQuery] = useState('')
  const [addingDishId, setAddingDishId] = useState<string | null>(null)

  // Remove dish
  const [removingDishId, setRemovingDishId] = useState<string | null>(null)

  // Reorder
  const [reorderingId, setReorderingId] = useState<string | null>(null)

  // Delete meal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadMeal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadMeal() {
    setLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await getMealWithDishes(id) as any
      setMeal(data)
      setNameValue(data?.name ?? '')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveName() {
    if (!nameValue.trim() || !meal) return
    setSavingName(true)
    await supabase.from('meals').update({ name: nameValue.trim() }).eq('id', id)
    setMeal((m) => m ? { ...m, name: nameValue.trim() } : m)
    setEditingName(false)
    setSavingName(false)
  }

  async function handleOpenAddDish() {
    if (!meal) return
    setShowAddDish(true)
    setDishQuery('')
    setLoadingDishes(true)
    const data = await getDishes(meal.family_id)
    setAllDishes(data ?? [])
    setLoadingDishes(false)
  }

  async function handleAddDish(dish: Dish) {
    if (!meal) return
    const alreadyAdded = meal.meal_dishes.some((md) => md.dish_id === dish.id)
    if (alreadyAdded) return
    setAddingDishId(dish.id)
    const nextOrder = meal.meal_dishes.length
    await addDishToMeal(meal.id, dish.id, nextOrder)
    await loadMeal()
    setAddingDishId(null)
  }

  async function handleRemoveDish(dishId: string) {
    if (!meal) return
    setRemovingDishId(dishId)
    await removeDishFromMeal(meal.id, dishId)
    setMeal((m) => m ? { ...m, meal_dishes: m.meal_dishes.filter((md) => md.dish_id !== dishId) } : m)
    setRemovingDishId(null)
  }

  async function handleMove(dishId: string, direction: 'up' | 'down') {
    if (!meal) return
    const sorted = [...meal.meal_dishes].sort((a, b) => a.sort_order - b.sort_order)
    const idx = sorted.findIndex((md) => md.dish_id === dishId)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return

    setReorderingId(dishId)
    const a = sorted[idx]
    const b = sorted[swapIdx]

    await supabase.from('meal_dishes').update({ sort_order: b.sort_order }).eq('id', a.id)
    await supabase.from('meal_dishes').update({ sort_order: a.sort_order }).eq('id', b.id)

    setMeal((m) => {
      if (!m) return m
      const updated = m.meal_dishes.map((md) => {
        if (md.id === a.id) return { ...md, sort_order: b.sort_order }
        if (md.id === b.id) return { ...md, sort_order: a.sort_order }
        return md
      })
      return { ...m, meal_dishes: updated }
    })
    setReorderingId(null)
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteMeal(id)
    router.push('/meals')
  }

  if (loading) {
    return <div className="flex justify-center items-center h-40"><Spinner /></div>
  }

  if (!meal) {
    return (
      <div className="p-4 text-center text-gray-500">
        Meal not found. <Link href="/meals" className="text-orange-600">Back to library</Link>
      </div>
    )
  }

  const sortedDishes = [...meal.meal_dishes].sort((a, b) => a.sort_order - b.sort_order)

  const addedDishIds = new Set(meal.meal_dishes.map((md) => md.dish_id))
  const filteredDishes = allDishes.filter(
    (d) => !addedDishIds.has(d.id) && d.name.toLowerCase().includes(dishQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky header */}
      <div className="glass-strong sticky top-0 z-20 px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/meals" className="text-gray-400 hover:text-gray-600 shrink-0">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          {editingName ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="text-base font-bold"
                autoFocus
              />
              <Button onClick={handleSaveName} loading={savingName} className="shrink-0 py-1.5 px-3 text-sm">Save</Button>
              <button onClick={() => { setEditingName(false); setNameValue(meal.name) }} className="text-gray-400 hover:text-gray-600 shrink-0 text-sm">Cancel</button>
            </div>
          ) : (
            <h1 className="text-xl font-bold text-gray-900 dark:text-[#FED7AA] font-heading truncate">
              {meal.name}
            </h1>
          )}
        </div>
        {!editingName && (
          <button
            onClick={() => setEditingName(true)}
            className="shrink-0 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors ml-3"
          >
            Rename
          </button>
        )}
      </div>

      <div className="p-4 max-w-lg mx-auto w-full flex flex-col gap-5">
        {/* Dishes section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold text-orange-600 uppercase tracking-widest font-heading">
              Dishes {sortedDishes.length > 0 && `· ${sortedDishes.length}`}
            </p>
            <button
              onClick={handleOpenAddDish}
              className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add dish
            </button>
          </div>

          {sortedDishes.length === 0 ? (
            <div className="glass rounded-2xl p-6 text-center text-gray-400 text-sm">
              No dishes yet.{' '}
              <button onClick={handleOpenAddDish} className="text-orange-600 font-medium hover:underline">
                Add one →
              </button>
            </div>
          ) : (
            <ul className="glass rounded-2xl overflow-hidden divide-y divide-gray-100">
              {sortedDishes.map((md, idx) => (
                <li key={md.id} className="flex items-center gap-3 px-4 py-3">
                  {/* Reorder arrows */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={() => handleMove(md.dish_id, 'up')}
                      disabled={idx === 0 || reorderingId === md.dish_id}
                      className="text-gray-300 hover:text-gray-500 disabled:opacity-20 transition-colors"
                      aria-label="Move up"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleMove(md.dish_id, 'down')}
                      disabled={idx === sortedDishes.length - 1 || reorderingId === md.dish_id}
                      className="text-gray-300 hover:text-gray-500 disabled:opacity-20 transition-colors"
                      aria-label="Move down"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Dish info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/dishes/${md.dish_id}`}
                      className="text-sm font-medium text-gray-900 dark:text-orange-100 hover:text-orange-600 dark:hover:text-orange-400 transition-colors truncate block"
                    >
                      {md.dish.name}
                    </Link>
                    {md.dish.ingredients.length > 0 && (
                      <p className="text-xs text-gray-400 dark:text-orange-200/50 mt-0.5">
                        {md.dish.ingredients.length} ingredient{md.dish.ingredients.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => handleRemoveDish(md.dish_id)}
                    disabled={removingDishId === md.dish_id}
                    className="text-gray-300 hover:text-red-500 disabled:opacity-30 transition-colors shrink-0"
                    aria-label="Remove dish"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add dish panel */}
        {showAddDish && (
          <div className="glass rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-700 dark:text-orange-200 font-heading">Add a dish</p>
              <button
                onClick={() => { setShowAddDish(false); setDishQuery('') }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <input
              type="search"
              placeholder="Search dishes…"
              value={dishQuery}
              onChange={(e) => setDishQuery(e.target.value)}
              autoFocus
              className="w-full glass rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-orange-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30"
            />
            {loadingDishes ? (
              <div className="flex justify-center py-4"><Spinner /></div>
            ) : filteredDishes.length === 0 ? (
              <p className="text-sm text-center text-gray-400 py-3">
                {dishQuery ? 'No matches.' : addedDishIds.size === allDishes.length ? 'All dishes already added.' : 'No dishes available.'}
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                {filteredDishes.map((dish) => (
                  <li key={dish.id}>
                    <button
                      onClick={() => handleAddDish(dish)}
                      disabled={addingDishId === dish.id}
                      className="w-full text-left px-2 py-2.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors text-sm font-medium text-gray-900 dark:text-orange-100 disabled:opacity-50 flex items-center justify-between"
                    >
                      {dish.name}
                      {addingDishId === dish.id && (
                        <div className="w-3.5 h-3.5 border border-orange-400 border-t-transparent rounded-full animate-spin shrink-0" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/dishes/new" className="text-xs text-orange-600 font-medium hover:underline text-center">
              + Create new dish
            </Link>
          </div>
        )}

        {/* Delete meal */}
        <div className="pt-2 border-t border-gray-100">
          {showDeleteConfirm ? (
            <div className="bg-red-50 rounded-xl p-4 flex flex-col gap-3">
              <p className="text-sm text-red-700 font-medium">Delete &ldquo;{meal.name}&rdquo;? This cannot be undone.</p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} className="flex-1">Cancel</Button>
                <Button variant="destructive" onClick={handleDelete} loading={deleting} className="flex-1">Delete</Button>
              </div>
            </div>
          ) : (
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(true)} className="text-red-500 w-full">
              Delete meal
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
