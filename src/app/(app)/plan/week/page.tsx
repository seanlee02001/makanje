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

export default function WeekPage() {
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerDay, setPickerDay] = useState<DayOfWeek>('mon')
  const [pickerSlot, setPickerSlot] = useState<MealSlotType>('breakfast')

  const router = useRouter()
  const supabase = createClient()

  const baseMonday = getWeekStart(new Date())
  const weekStartDate = new Date(baseMonday)
  weekStartDate.setDate(baseMonday.getDate() + weekOffset * 7)
  const weekStart = formatDate(weekStartDate)
  const weekDays = getWeekDays(weekStartDate)
  const todayStr = formatDate(new Date())

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

  const endDate = new Date(weekStartDate)
  endDate.setDate(endDate.getDate() + 6)
  const weekRange = `${weekStartDate.toLocaleDateString('en-US', { day: 'numeric' })} – ${endDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}`

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-20 px-5 pt-4 pb-3" style={{ background: 'var(--canvas)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-1">
          <Link href="/plan" className="text-[13px] font-medium" style={{ color: 'var(--accent)' }}>
            ‹ Today
          </Link>
          <div className="flex items-center gap-4">
            <button onClick={() => setWeekOffset((w) => w - 1)} className="text-lg font-bold" style={{ color: 'var(--text-secondary)' }}>‹</button>
            <span className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>This Week</span>
            <button onClick={() => setWeekOffset((w) => w + 1)} className="text-lg font-bold" style={{ color: 'var(--text-secondary)' }}>›</button>
          </div>
          <div className="w-12" /> {/* spacer */}
        </div>
        <p className="text-[12px] text-center" style={{ color: 'var(--text-tertiary)' }}>{weekRange}</p>
      </div>

      {/* Day blocks */}
      <div className="px-5 pt-4 pb-6 flex-1">
        {slotsLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <div className="flex flex-col gap-6">
            {DAY_KEYS.map((dayKey, i) => {
              const dayDate = weekDays[i]
              const dayDateStr = formatDate(dayDate)
              const isToday = dayDateStr === todayStr
              const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'long' })
              const dayNum = dayDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
              const daySlots = slots.filter((s) => s.day === dayKey)

              return (
                <div key={dayKey}>
                  {/* Day header */}
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>
                      {dayName}
                    </h3>
                    <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>{dayNum}</span>
                    {isToday && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-pill" style={{ background: 'var(--accent)', color: '#ffffff' }}>
                        Today
                      </span>
                    )}
                  </div>

                  {/* Meal rows */}
                  <div className="flex flex-col gap-2">
                    {SLOT_KEYS.map((slotKey) => {
                      const slot = daySlots.find((s) => s.meal_slot === slotKey)
                      const dishes = slot?.slot_dishes ?? []
                      const hasDishes = dishes.length > 0

                      return (
                        <div key={slotKey} className="flex items-start gap-3 py-1.5">
                          {/* Dot */}
                          <div
                            className="w-[9px] h-[9px] rounded-full shrink-0 mt-1.5"
                            style={{ background: SLOT_DOT_COLORS[slotKey] }}
                          />

                          {/* Slot label */}
                          <span className="text-[11px] font-semibold uppercase tracking-[0.5px] w-16 shrink-0 mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                            {SLOT_LABELS[slotKey]}
                          </span>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {hasDishes ? (
                              dishes.length === 1 ? (
                                <button
                                  onClick={() => openPicker(dayKey, slotKey)}
                                  className="text-[14px] font-medium text-left"
                                  style={{ color: 'var(--text-primary)' }}
                                >
                                  {dishes[0].dish?.name ?? 'Unknown'}
                                </button>
                              ) : (
                                <div>
                                  {dishes.map((sd) => (
                                    <button
                                      key={sd.id}
                                      onClick={() => openPicker(dayKey, slotKey)}
                                      className="block text-[13px] font-medium text-left"
                                      style={{ color: 'var(--text-primary)' }}
                                    >
                                      • {sd.dish?.name ?? 'Unknown'}
                                    </button>
                                  ))}
                                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                                    {dishes.length} dishes
                                  </p>
                                </div>
                              )
                            ) : (
                              <button
                                onClick={() => openPicker(dayKey, slotKey)}
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
                </div>
              )
            })}
          </div>
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
