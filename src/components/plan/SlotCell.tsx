'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MealPickerModal } from './MealPickerModal'
import type { Meal, MealPlanSlot, DayOfWeek, MealSlotType } from '@/lib/supabase/types'

interface SlotCellProps {
  slot: MealPlanSlot | undefined
  familyId: string
  weekStart: string
  day: DayOfWeek
  mealSlot: MealSlotType
  onUpdate: (slot: MealPlanSlot) => void
  onClear: (day: DayOfWeek, mealSlot: MealSlotType) => void
}

export function SlotCell({ slot, familyId, weekStart, day, mealSlot, onUpdate, onClear }: SlotCellProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const supabase = createClient()

  async function handleSelect(meal: Meal) {
    const { data, error } = await supabase
      .from('meal_plan_slots')
      .upsert(
        { family_id: familyId, week_start_date: weekStart, day, meal_slot: mealSlot, meal_id: meal.id },
        { onConflict: 'family_id,week_start_date,day,meal_slot' }
      )
      .select('*, meal:meals(*)')
      .single()

    if (!error && data) onUpdate(data as MealPlanSlot)
  }

  async function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    await supabase
      .from('meal_plan_slots')
      .delete()
      .eq('family_id', familyId)
      .eq('week_start_date', weekStart)
      .eq('day', day)
      .eq('meal_slot', mealSlot)
    onClear(day, mealSlot)
  }

  const hasMeal = slot?.meal

  return (
    <>
      <div
        onClick={() => setPickerOpen(true)}
        className={`relative rounded-xl cursor-pointer transition-all min-h-[56px] flex items-center justify-center p-2 ${
          hasMeal
            ? 'bg-white/50 backdrop-blur-sm border border-white/72 hover:bg-white/65'
            : 'border border-dashed border-white/60 bg-white/20 hover:bg-white/35'
        }`}
      >
        {hasMeal ? (
          <>
            <p className="text-[11px] font-semibold text-[#3B0F00] text-center line-clamp-2 pr-4 leading-tight font-heading">
              {slot.meal!.name}
            </p>
            <button
              onClick={handleClear}
              className="absolute top-1 right-1 rounded-full w-5 h-5 bg-white/70 border border-white/60 text-[#B8836A] hover:text-red-500 flex items-center justify-center transition-colors"
              aria-label="Remove meal"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        ) : (
          <svg className="h-4 w-4 text-[#B8836A]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        )}
      </div>

      <MealPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        familyId={familyId}
        weekStart={weekStart}
        day={day}
        mealSlot={mealSlot}
        onSelect={handleSelect}
      />
    </>
  )
}
