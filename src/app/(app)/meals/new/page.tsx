'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getDishes, createMeal, addDishToMeal } from '@/lib/supabase/queries/meals'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Dish } from '@/lib/supabase/types'

export default function NewMealPage() {
  const [step, setStep] = useState<'name' | 'dishes'>('name')
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')

  const [dishes, setDishes] = useState<Dish[]>([])
  const [selectedDishIds, setSelectedDishIds] = useState<string[]>([])
  const [dishQuery, setDishQuery] = useState('')
  const [loadingDishes, setLoadingDishes] = useState(false)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const supabase = createClient()

  // Load family context on mount
  useEffect(() => {
    async function loadContext() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('users').select('family_id').eq('id', user.id).single()
      setFamilyId(profile?.family_id ?? null)
    }
    loadContext()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load dishes when entering step 2
  useEffect(() => {
    if (step !== 'dishes' || !familyId) return
    setLoadingDishes(true)
    getDishes(familyId)
      .then((data) => setDishes(data ?? []))
      .finally(() => setLoadingDishes(false))
  }, [step, familyId])

  function handleNameContinue(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setNameError('Meal name is required'); return }
    setNameError('')
    setStep('dishes')
  }

  function toggleDish(dishId: string) {
    setSelectedDishIds((prev) =>
      prev.includes(dishId) ? prev.filter((id) => id !== dishId) : [...prev, dishId]
    )
  }

  async function handleSave() {
    if (!familyId || !userId) return
    setSaving(true)
    setError('')
    try {
      const meal = await createMeal(familyId, name.trim(), userId)
      for (let i = 0; i < selectedDishIds.length; i++) {
        await addDishToMeal(meal.id, selectedDishIds[i], i)
      }
      router.push(`/meals/${meal.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create meal')
      setSaving(false)
    }
  }

  const filteredDishes = dishes.filter((d) =>
    d.name.toLowerCase().includes(dishQuery.toLowerCase())
  )

  const selectedDishes = dishes.filter((d) => selectedDishIds.includes(d.id))

  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky header */}
      <div className="glass-strong sticky top-0 z-20 px-4 pt-4 pb-3 flex items-center gap-3">
        {step === 'dishes' ? (
          <button onClick={() => setStep('name')} className="text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : (
          <Link href="/meals" className="text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        )}
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-[#FED7AA] font-heading">
            {step === 'name' ? 'New Meal' : name}
          </h1>
          {step === 'dishes' && (
            <p className="text-xs text-gray-500 dark:text-orange-200/50">Add dishes to this meal</p>
          )}
        </div>
        {step === 'dishes' && (
          <span className="text-xs text-orange-600 font-semibold">
            {selectedDishIds.length} selected
          </span>
        )}
      </div>

      {/* Step 1: Name */}
      {step === 'name' && (
        <form onSubmit={handleNameContinue} className="flex flex-col gap-5 p-4 max-w-lg mx-auto w-full">
          <Input
            id="meal-name"
            label="Meal name"
            placeholder="e.g. Sunday Roast"
            value={name}
            onChange={(e) => { setName(e.target.value); setNameError('') }}
            required
          />
          {nameError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{nameError}</p>}
          <div className="flex gap-3 pt-2">
            <Link href="/meals" className="flex-1">
              <Button type="button" variant="secondary" className="w-full">Cancel</Button>
            </Link>
            <Button type="submit" className="flex-1">Continue →</Button>
          </div>
        </form>
      )}

      {/* Step 2: Add dishes */}
      {step === 'dishes' && (
        <div className="flex flex-col flex-1 p-4 max-w-lg mx-auto w-full gap-4">
          {/* Selected dishes */}
          {selectedDishes.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-orange-600 uppercase tracking-widest mb-2 font-heading">
                Added · {selectedDishes.length}
              </p>
              <ul className="glass rounded-2xl overflow-hidden divide-y divide-gray-100">
                {selectedDishes.map((dish) => (
                  <li key={dish.id} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-orange-100">{dish.name}</span>
                    <button
                      onClick={() => toggleDish(dish.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors ml-3 shrink-0"
                      aria-label="Remove"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
            <p className="text-[11px] font-bold text-orange-600 uppercase tracking-widest mb-2 font-heading">
              Dish Library
            </p>
            <div className="relative mb-3">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </div>
              <input
                type="search"
                placeholder="Search dishes…"
                value={dishQuery}
                onChange={(e) => setDishQuery(e.target.value)}
                className="w-full glass rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-orange-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30"
              />
            </div>

            {loadingDishes ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
              </div>
            ) : dishes.length === 0 ? (
              <div className="glass rounded-2xl p-6 text-center">
                <p className="text-sm font-semibold text-gray-700 dark:text-orange-200 font-heading">No dishes yet</p>
                <p className="text-xs text-gray-500 dark:text-orange-200/60 mt-1">Add dishes first before building a meal.</p>
                <Link
                  href="/dishes"
                  className="mt-3 inline-block text-sm text-orange-600 font-semibold hover:underline"
                >
                  Go to Dishes →
                </Link>
              </div>
            ) : filteredDishes.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">No dishes match your search.</p>
            ) : (
              <ul className="glass rounded-2xl overflow-hidden divide-y divide-gray-100">
                {filteredDishes.map((dish) => {
                  const selected = selectedDishIds.includes(dish.id)
                  return (
                    <li key={dish.id}>
                      <button
                        onClick={() => toggleDish(dish.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                          selected ? 'bg-orange-50 dark:bg-orange-900/20' : 'hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <span className={`text-sm font-medium ${selected ? 'text-orange-700 dark:text-orange-300' : 'text-gray-900 dark:text-orange-100'}`}>
                          {dish.name}
                        </span>
                        {selected && (
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

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

          <div className="pt-2">
            <Button onClick={handleSave} loading={saving} className="w-full">
              Save meal
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
