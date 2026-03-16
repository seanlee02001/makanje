'use client'

import { SlotCell } from './SlotCell'
import { DAY_KEYS, SLOT_KEYS, SLOT_LABELS, getWeekDays } from '@/lib/utils/weekDates'
import type { MealPlanSlot, DayOfWeek, MealSlotType } from '@/lib/supabase/types'

interface WeekGridProps {
  slots: MealPlanSlot[]
  familyId: string
  weekStart: string
  weekStartDate: Date
  onUpdate: (slot: MealPlanSlot) => void
  onClear: (day: DayOfWeek, mealSlot: MealSlotType) => void
}

export function WeekGrid({ slots, familyId, weekStart, weekStartDate, onUpdate, onClear }: WeekGridProps) {
  const weekDays = getWeekDays(weekStartDate)

  function getSlot(day: DayOfWeek, mealSlot: MealSlotType) {
    return slots.find((s) => s.day === day && s.meal_slot === mealSlot)
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="min-w-[560px]">
        {/* Day headers */}
        <div className="grid grid-cols-8 gap-1.5 mb-2">
          <div /> {/* spacer */}
          {DAY_KEYS.map((day, i) => (
            <div key={day} className="text-center">
              <p className="text-[10px] font-bold text-[#7C4A30] uppercase font-heading">{day}</p>
              <p className="text-[10px] text-[#B8836A]">{weekDays[i].getDate()}</p>
            </div>
          ))}
        </div>

        {/* Slot rows */}
        {SLOT_KEYS.map((mealSlot) => (
          <div key={mealSlot} className="grid grid-cols-8 gap-1.5 mb-1.5">
            {/* Row label */}
            <div className="flex items-center justify-end pr-1.5">
              <p className="text-[10px] font-semibold text-[#B8836A] whitespace-nowrap font-heading">
                {SLOT_LABELS[mealSlot]}
              </p>
            </div>
            {DAY_KEYS.map((day) => (
              <SlotCell
                key={`${day}-${mealSlot}`}
                slot={getSlot(day as DayOfWeek, mealSlot as MealSlotType)}
                familyId={familyId}
                weekStart={weekStart}
                day={day as DayOfWeek}
                mealSlot={mealSlot as MealSlotType}
                onUpdate={onUpdate}
                onClear={onClear}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
