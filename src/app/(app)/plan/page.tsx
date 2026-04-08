'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeSlots } from '@/hooks/useRealtimeSlots'
import { upsertSlot } from '@/lib/supabase/queries/mealPlan'
import { setSlotDishes } from '@/lib/supabase/queries/slotDishes'
import { DishPickerModal } from '@/components/plan/DishPickerModal'
import { Spinner } from '@/components/ui/Spinner'
import {
  getWeekStart,
  formatDate,
  getWeekDays,
  DAY_KEYS,
  SLOT_KEYS,
  SLOT_LABELS,
} from '@/lib/utils/weekDates'
import type { DayOfWeek, MealSlotType } from '@/lib/supabase/types'

const SLOT_DOT_COLORS: Record<MealSlotType, string> = {
  breakfast: 'var(--breakfast)',
  lunch: 'var(--lunch)',
  dinner: 'var(--dinner)',
}

export default function TodayPage() {
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerDay, setPickerDay] = useState<DayOfWeek>('mon')
  const [pickerSlot, setPickerSlot] = useState<MealSlotType>('breakfast')

  const router = useRouter()
  const supabase = createClient()

  const weekStartDate = getWeekStart(new Date())
  const weekStart = formatDate(weekStartDate)
  const weekDays = getWeekDays(weekStartDate)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('users').select('family_id').eq('id', user.id).single()
      if (!profile?.family_id) { router.push('/onboarding'); return }
      setFamilyId(profile.family_id)
      setProfileLoading(false)
    }
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { slots, loading: slotsLoading } = useRealtimeSlots(familyId, weekStart)

  // Today info
  const today = new Date()
  const todayDayIdx = today.getDay() === 0 ? 6 : today.getDay() - 1
  const todayKey = DAY_KEYS[todayDayIdx]
  const todaySlots = slots.filter((s) => s.day === todayKey)

  // Stats
  const todayMealCount = todaySlots.filter((s) => (s.slot_dishes ?? []).length > 0).length
  const plannedDays = new Set(slots.filter((s) => (s.slot_dishes ?? []).length > 0).map((s) => s.day)).size
  const totalToBuy = slots.reduce((acc, s) => {
    const dishes = s.slot_dishes ?? []
    return acc + dishes.reduce((a, sd) => a + (sd.dish?.ingredients?.length ?? 0), 0)
  }, 0)

  function openPicker(day: DayOfWeek, slot: MealSlotType) {
    setPickerDay(day)
    setPickerSlot(slot)
    setPickerOpen(true)
  }

  const handlePickerConfirm = useCallback(async (dishIds: string[]) => {
    if (!familyId) return
    const slot = await upsertSlot(familyId, weekStart, pickerDay, pickerSlot)
    await setSlotDishes(slot.id, dishIds)
  }, [familyId, weekStart, pickerDay, pickerSlot])

  if (profileLoading) {
    return <div className="flex justify-center items-center h-40"><Spinner /></div>
  }

  const todayLabel = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-5 pt-6 pb-2 flex items-center justify-between">
        <h1 className="text-[28px] font-bold tracking-[-0.5px]" style={{ color: 'var(--text-primary)' }}>
          MakanJe
        </h1>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}>
          👤
        </div>
      </div>

      {/* Stat row */}
      <div className="px-5 py-3 flex gap-3">
        {[
          { label: 'meals today', value: todayMealCount },
          { label: 'days planned', value: plannedDays },
          { label: 'to buy', value: totalToBuy },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex-1 rounded-[12px] px-3 py-3"
            style={{ background: 'var(--surface)' }}
          >
            <p className="text-[22px] font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
            <p className="text-[11px] font-medium tracking-[0.2px]" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="px-5 pt-4 pb-6 flex-1">
        {slotsLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <>
            {/* Today section */}
            <h2 className="text-[15px] font-bold tracking-[-0.2px] mb-4" style={{ color: 'var(--text-primary)' }}>
              {todayLabel}
            </h2>

            {/* Timeline */}
            <div className="flex flex-col gap-0 relative ml-3">
              {/* Vertical line */}
              <div className="absolute left-[5px] top-2 bottom-2 w-px" style={{ background: 'var(--border)' }} />

              {SLOT_KEYS.map((slotKey) => {
                const slot = todaySlots.find((s) => s.meal_slot === slotKey)
                const dishes = slot?.slot_dishes ?? []
                const hasDishes = dishes.length > 0
                const label = SLOT_LABELS[slotKey]

                return (
                  <div key={slotKey} className="flex gap-4 pb-6 relative">
                    {/* Dot */}
                    <div
                      className="w-[11px] h-[11px] rounded-full shrink-0 mt-1 z-10"
                      style={{ background: SLOT_DOT_COLORS[slotKey] }}
                    />

                    <div className="flex-1 -mt-0.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.8px] mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {label}
                      </p>

                      {hasDishes ? (
                        <div className="flex flex-col gap-2">
                          {dishes.map((sd) => (
                            <button
                              key={sd.id}
                              onClick={() => sd.dish && router.push(`/dishes/${sd.dish.id}`)}
                              className="rounded-[8px] px-3 py-2.5 text-left transition-colors"
                              style={{ background: 'var(--surface)' }}
                            >
                              <p className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {sd.dish?.name ?? 'Unknown dish'}
                              </p>
                              {sd.dish?.prep_time_min && (
                                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                                  {sd.dish.prep_time_min} min
                                </p>
                              )}
                            </button>
                          ))}
                          {dishes.length > 1 && (
                            <p className="text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
                              {dishes.length} dishes
                            </p>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => openPicker(todayKey, slotKey)}
                          className="text-[13px] font-medium"
                          style={{ color: 'var(--accent)' }}
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Cook CTA */}
            {todaySlots.some((s) => (s.slot_dishes ?? []).length > 0) && (
              <button
                onClick={() => {
                  // Find first slot with dishes and navigate to first dish
                  const firstSlot = todaySlots.find((s) => (s.slot_dishes ?? []).length > 0)
                  const firstDish = firstSlot?.slot_dishes?.[0]?.dish
                  if (firstDish) router.push(`/dishes/${firstDish.id}`)
                }}
                className="w-full py-3.5 rounded-pill text-white font-semibold text-sm mt-2"
                style={{ background: 'var(--accent)' }}
              >
                Start cooking {SLOT_LABELS[todaySlots.find((s) => (s.slot_dishes ?? []).length > 0)?.meal_slot ?? 'dinner'].toLowerCase()}
              </button>
            )}

            {/* This Week preview */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[15px] font-bold tracking-[-0.2px]" style={{ color: 'var(--text-primary)' }}>
                  This Week
                </h2>
                <Link
                  href="/plan/week"
                  className="text-[13px] font-medium"
                  style={{ color: 'var(--accent)' }}
                >
                  View all →
                </Link>
              </div>

              <div className="flex flex-col gap-1">
                {DAY_KEYS.map((dayKey, i) => {
                  const dayDate = weekDays[i]
                  const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' })
                  const daySlots = slots.filter((s) => s.day === dayKey)
                  const dishNames = daySlots
                    .flatMap((s) => s.slot_dishes ?? [])
                    .map((sd) => sd.dish?.name)
                    .filter(Boolean)
                  const isToday = dayKey === todayKey

                  return (
                    <Link
                      key={dayKey}
                      href="/plan/week"
                      className="flex items-center gap-3 py-2.5 px-1 rounded-lg transition-colors"
                    >
                      <span
                        className="text-[13px] font-semibold w-8"
                        style={{ color: isToday ? 'var(--accent)' : 'var(--text-secondary)' }}
                      >
                        {dayName}
                      </span>
                      <span
                        className="text-[13px] flex-1 truncate"
                        style={{ color: dishNames.length > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                      >
                        {dishNames.length > 0 ? dishNames.join(' · ') : 'Not planned'}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Dish picker modal */}
      {familyId && (
        <DishPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          familyId={familyId}
          day={pickerDay}
          mealSlot={pickerSlot}
          onConfirm={handlePickerConfirm}
        />
      )}
    </div>
  )
}
