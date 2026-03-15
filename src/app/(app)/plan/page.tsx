'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeSlots } from '@/hooks/useRealtimeSlots'
import { WeekGrid } from '@/components/plan/WeekGrid'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { getWeekStart, formatDate, formatDayLabel } from '@/lib/utils/weekDates'
import type { MealPlanSlot, DayOfWeek, MealSlotType } from '@/lib/supabase/types'

export default function PlanPage() {
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [familyName, setFamilyName] = useState('')
  const [profileLoading, setProfileLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const today = new Date()
  const weekStartDate = getWeekStart(today)
  const weekStart = formatDate(weekStartDate)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('users').select('family_id').eq('id', user.id).single()

      if (!profile?.family_id) { router.push('/onboarding'); return }

      setFamilyId(profile.family_id)

      const { data: family } = await supabase
        .from('families').select('name').eq('id', profile.family_id).single()
      setFamilyName(family?.name ?? '')
      setProfileLoading(false)
    }
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { slots, loading: slotsLoading } = useRealtimeSlots(familyId, weekStart)
  const [localSlots, setLocalSlots] = useState<MealPlanSlot[]>([])

  useEffect(() => {
    setLocalSlots(slots)
  }, [slots])

  const handleUpdate = useCallback((updated: MealPlanSlot) => {
    setLocalSlots((prev) => {
      const exists = prev.some((s) => s.id === updated.id)
      return exists ? prev.map((s) => s.id === updated.id ? updated : s) : [...prev, updated]
    })
  }, [])

  const handleClear = useCallback((day: DayOfWeek, mealSlot: MealSlotType) => {
    setLocalSlots((prev) => prev.filter((s) => !(s.day === day && s.meal_slot === mealSlot)))
  }, [])

  async function handleGenerateShoppingList() {
    if (!familyId) return
    setGenerating(true)
    try {
      // Fetch slots with nested meals + ingredients for generation
      const { data: slotsWithIngredients } = await supabase
        .from('meal_plan_slots')
        .select('*, meal:meals(*, ingredients(*))')
        .eq('family_id', familyId)
        .eq('week_start_date', weekStart)

      const { generateShoppingList } = await import('@/lib/utils/generateShoppingList')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = generateShoppingList((slotsWithIngredients as any) ?? [])

      await supabase
        .from('shopping_lists')
        .upsert(
          { family_id: familyId, week_start_date: weekStart, items },
          { onConflict: 'family_id,week_start_date' }
        )

      router.push('/shopping')
    } finally {
      setGenerating(false)
    }
  }

  if (profileLoading) {
    return <div className="flex justify-center items-center h-40"><Spinner /></div>
  }

  const weekLabel = `Week of ${formatDayLabel(weekStartDate)}`

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Meal Plan</h1>
          <p className="text-sm text-gray-500 mt-0.5">{weekLabel} · {familyName}</p>
        </div>
        <Button
          onClick={handleGenerateShoppingList}
          loading={generating}
          variant="secondary"
          className="shrink-0 text-xs"
        >
          🛒 Shopping list
        </Button>
      </div>

      {slotsLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <WeekGrid
          slots={localSlots}
          familyId={familyId!}
          weekStart={weekStart}
          weekStartDate={weekStartDate}
          onUpdate={handleUpdate}
          onClear={handleClear}
        />
      )}

      <p className="text-xs text-gray-400 text-center mt-6">
        Tap any cell to add a meal · Changes sync live to all family members
      </p>
    </div>
  )
}
