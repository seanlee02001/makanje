'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeSlots } from '@/hooks/useRealtimeSlots'
import { MealPickerModal } from '@/components/plan/MealPickerModal'
import { Spinner } from '@/components/ui/Spinner'
import {
  getWeekStart,
  formatDate,
  getWeekDays,
  DAY_KEYS,
  SLOT_KEYS,
  SLOT_LABELS,
} from '@/lib/utils/weekDates'
import type { MealPlanSlot, DayOfWeek, MealSlotType, Meal } from '@/lib/supabase/types'

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// Vivid SVG icon backgrounds per slot type (UI/UX Pro Max: distinct, high-contrast)
const SLOT_COLORS: Record<string, { bg: string; icon: string }> = {
  breakfast: { bg: 'bg-amber-400',   icon: 'text-white' },
  lunch:     { bg: 'bg-emerald-500', icon: 'text-white' },
  dinner:    { bg: 'bg-violet-500',  icon: 'text-white' },
}

function formatWeekRange(weekStart: Date): string {
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  const startStr = weekStart.toLocaleDateString('en-US', opts)
  const endStr = end.toLocaleDateString('en-US', { ...opts, year: 'numeric' })
  return `${startStr} – ${endStr}`
}

export default function PlanPage() {
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [familyName, setFamilyName] = useState('')
  const [profileLoading, setProfileLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState<number>(0) // 0=Mon..6=Sun
  const [generating, setGenerating] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerDay, setPickerDay] = useState<DayOfWeek>('mon')
  const [pickerSlot, setPickerSlot] = useState<MealSlotType>('breakfast')

  const router = useRouter()
  const supabase = createClient()

  // Compute week start from offset
  const baseToday = new Date()
  const thisMonday = getWeekStart(baseToday)
  const weekStartDate = new Date(thisMonday)
  weekStartDate.setDate(thisMonday.getDate() + weekOffset * 7)
  const weekStart = formatDate(weekStartDate)
  const weekDays = getWeekDays(weekStartDate)

  // Determine today's index for default selection
  useEffect(() => {
    const todayDay = new Date().getDay() // 0=Sun
    // Convert to Mon-indexed: Mon=0..Sun=6
    const monIndexed = todayDay === 0 ? 6 : todayDay - 1
    setSelectedDay(monIndexed)
  }, [])

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleClear = useCallback((day: DayOfWeek, mealSlot: MealSlotType) => {
    setLocalSlots((prev) => prev.filter((s) => !(s.day === day && s.meal_slot === mealSlot)))
  }, [])

  async function handleGenerateShoppingList() {
    if (!familyId) return
    setGenerating(true)
    try {
      const { data: slotsWithIngredients } = await supabase
        .from('meal_plan_slots')
        .select('*, meal:meals(*, meal_dishes(*, dish:dishes(*, ingredients(*))))')
        .eq('family_id', familyId)
        .eq('week_start_date', weekStart)

      const { data: pantryItems } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('family_id', familyId)

      const { generateShoppingList } = await import('@/lib/utils/generateShoppingList')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = generateShoppingList((slotsWithIngredients as any) ?? [], pantryItems ?? [])

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

  async function handleSelectMeal(meal: Meal) {
    if (!familyId) return
    const existing = localSlots.find(
      (s) => s.day === pickerDay && s.meal_slot === pickerSlot
    )

    if (existing) {
      const { data: updated } = await supabase
        .from('meal_plan_slots')
        .update({ meal_id: meal.id })
        .eq('id', existing.id)
        .select('*, meal:meals(*)')
        .single()
      if (updated) handleUpdate(updated as MealPlanSlot)
    } else {
      const { data: inserted } = await supabase
        .from('meal_plan_slots')
        .insert({
          family_id: familyId,
          week_start_date: weekStart,
          day: pickerDay,
          meal_slot: pickerSlot,
          meal_id: meal.id,
        })
        .select('*, meal:meals(*)')
        .single()
      if (inserted) handleUpdate(inserted as MealPlanSlot)
    }
  }

  function openPicker(day: DayOfWeek, slot: MealSlotType) {
    setPickerDay(day)
    setPickerSlot(slot)
    setPickerOpen(true)
  }

  if (profileLoading) {
    return <div className="flex justify-center items-center h-40"><Spinner /></div>
  }

  const currentDayKey = DAY_KEYS[selectedDay]
  const currentDayDate = weekDays[selectedDay]
  const currentDayName = currentDayDate.toLocaleDateString('en-US', { weekday: 'long' })

  // Slots for selected day
  const daySlots = localSlots.filter((s) => s.day === currentDayKey)
  const plannedCount = localSlots.filter((s) => s.meal_id).length

  const isThisWeek = weekOffset === 0
  const weekLabel = isThisWeek ? 'This Week' : weekOffset === 1 ? 'Next Week' : weekOffset === -1 ? 'Last Week' : `Week ${weekOffset > 0 ? '+' : ''}${weekOffset}`

  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky glass week header */}
      <div className="glass-strong sticky top-0 z-20 px-4 pt-3 pb-2">
        {/* Row 1: Week label + avatars */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-bold text-[#0F172A] dark:text-[#FED7AA] text-sm">
              {weekLabel}
            </span>
            <span className="text-orange-600 font-semibold text-xs">
              {formatWeekRange(weekStartDate)}
            </span>
          </div>
          {/* Family member avatars */}
          <div className="flex -space-x-1.5">
            <div className="w-7 h-7 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold font-heading shadow-sm">
              {familyName.charAt(0) || 'F'}
            </div>
          </div>
        </div>

        {/* Row 2: Week navigation */}
        <div className="flex items-center justify-between mb-2.5">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-base font-bold hover:bg-orange-600 transition-colors shadow-sm"
            aria-label="Previous week"
          >
            ‹
          </button>
          <span className="text-xs text-slate-500 dark:text-orange-200/60 font-semibold font-heading">
            {currentDayName}
          </span>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-base font-bold hover:bg-orange-600 transition-colors shadow-sm"
            aria-label="Next week"
          >
            ›
          </button>
        </div>

        {/* Row 3: Day picker strip — solid orange pill for active */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, i) => {
            const isSelected = i === selectedDay
            const dateNum = day.getDate()
            return (
              <button
                key={i}
                onClick={() => setSelectedDay(i)}
                className={`flex flex-col items-center py-1.5 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-orange-500 shadow-sm shadow-orange-500/40'
                    : 'hover:bg-white/30'
                }`}
              >
                <span className={`text-[10px] font-bold leading-none mb-1 ${
                  isSelected ? 'text-orange-100' : 'text-amber-700 dark:text-orange-300'
                }`}>
                  {DAY_LETTERS[i]}
                </span>
                <span className={`text-sm font-heading font-bold leading-none ${
                  isSelected ? 'text-white' : 'text-[#0F172A] dark:text-[#FED7AA]'
                }`}>
                  {dateNum}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Scrollable day content */}
      <div className="flex-1 px-4 pt-4 pb-6">
        {slotsLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <div className="flex flex-col gap-4">
            {SLOT_KEYS.map((slotKey) => {
              const slot = daySlots.find((s) => s.meal_slot === slotKey)
              const hasMeal = slot?.meal_id && slot?.meal
              const label = SLOT_LABELS[slotKey]

              return (
                <div key={slotKey}>
                  {/* Section label — vivid per slot */}
                  <p className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${
                    slotKey === 'breakfast' ? 'text-amber-600' :
                    slotKey === 'lunch'     ? 'text-emerald-600' :
                                             'text-violet-600'
                  }`}>
                    {label}
                  </p>

                  {hasMeal && slot?.meal ? (
                    /* Filled slot card — high contrast */
                    <button
                      onClick={() => openPicker(currentDayKey, slotKey)}
                      className="glass rounded-2xl p-3.5 w-full flex items-center gap-3 hover:brightness-95 transition-all active:scale-[0.98] text-left shadow-sm"
                    >
                      {/* Vivid solid icon circle */}
                      <div className={`w-[38px] h-[38px] rounded-full ${SLOT_COLORS[slotKey].bg} flex items-center justify-center shrink-0 shadow-sm`}>
                        <svg className={`w-5 h-5 ${SLOT_COLORS[slotKey].icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          {slotKey === 'breakfast' && <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m14.95-6.364l-.707.707M6.757 17.657l-.707.707m0-12.728l.707.707M17.243 17.657l.707.707" />}
                          {slotKey === 'lunch'     && <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" />}
                          {slotKey === 'dinner'    && <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />}
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#0F172A] dark:text-[#FED7AA] font-bold text-sm font-heading truncate">
                          {slot.meal.name}
                        </p>
                        <p className="text-slate-500 dark:text-orange-200/60 text-xs mt-0.5 font-medium">
                          tap to change
                        </p>
                      </div>
                      <span className="text-orange-400 text-xl leading-none shrink-0 font-bold">›</span>
                    </button>
                  ) : (
                    /* Empty slot */
                    <button
                      onClick={() => openPicker(currentDayKey, slotKey)}
                      className="w-full rounded-2xl p-3.5 flex items-center gap-3 border-2 border-dashed border-orange-300/60 hover:border-orange-400 hover:bg-orange-50/40 transition-all active:scale-[0.98]"
                    >
                      <div className="w-[38px] h-[38px] rounded-full bg-orange-100 flex items-center justify-center shrink-0 text-orange-500 font-bold text-xl">
                        +
                      </div>
                      <p className="text-orange-400 font-medium text-sm">
                        Add {currentDayName}&apos;s {label.toLowerCase()}…
                      </p>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Sticky bottom CTA */}
      <div className="sticky bottom-0 px-4 mb-3 pb-safe">
        <button
          onClick={handleGenerateShoppingList}
          disabled={generating}
          className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/30 backdrop-blur-[10px] bg-[rgba(5,150,105,0.82)] hover:bg-[rgba(5,150,105,0.90)] transition-colors disabled:opacity-60"
        >
          <div>
            <p className="text-white font-semibold text-sm font-heading">
              {generating ? 'Generating…' : 'Generate Shopping List'}
            </p>
            <p className="text-white/70 text-xs mt-0.5">
              {plannedCount} meal{plannedCount !== 1 ? 's' : ''} planned this week
            </p>
          </div>
          <span className="text-white/80 text-xl">→</span>
        </button>
      </div>

      {/* Meal picker modal */}
      {familyId && (
        <MealPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          familyId={familyId}
          weekStart={weekStart}
          day={pickerDay}
          mealSlot={pickerSlot}
          onSelect={handleSelectMeal}
        />
      )}
    </div>
  )
}
