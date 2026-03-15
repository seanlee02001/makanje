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
        <div className="grid grid-cols-8 gap-1.5 mb-1.5">
          <div /> {/* spacer for slot label column */}
          {DAY_KEYS.map((day, i) => (
            <div key={day} className="text-center">
              <p className="text-xs font-semibold text-gray-500 uppercase">{day}</p>
              <p className="text-xs text-gray-400">{weekDays[i].getDate()}</p>
            </div>
          ))}
        </div>

        {/* Slot rows */}
        {SLOT_KEYS.map((mealSlot) => (
          <div key={mealSlot} className="grid grid-cols-8 gap-1.5 mb-1.5">
            {/* Row label */}
            <div className="flex items-center justify-end pr-1.5">
              <p className="text-xs font-medium text-gray-400 rotate-0 whitespace-nowrap">
                {SLOT_LABELS[mealSlot]}
              </p>
            </div>
            {/* Cells */}
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
