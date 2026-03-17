import { createClient } from '@/lib/supabase/client'
import type { MealPlanSlot, DayOfWeek, MealSlotType } from '@/lib/supabase/types'

export async function getWeekSlots(
  familyId: string,
  weekStart: string
): Promise<MealPlanSlot[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('meal_plan_slots')
    .select('*, meal:meals(*, meal_dishes(*, dish:dishes(*)))')
    .eq('family_id', familyId)
    .eq('week_start_date', weekStart)
  return (data as MealPlanSlot[]) ?? []
}

export async function upsertSlot(
  familyId: string,
  weekStart: string,
  day: DayOfWeek,
  mealSlot: MealSlotType,
  mealId: string
): Promise<void> {
  const supabase = createClient()
  await supabase.from('meal_plan_slots').upsert(
    {
      family_id: familyId,
      week_start_date: weekStart,
      day: day,
      meal_slot: mealSlot,
      meal_id: mealId,
    },
    { onConflict: 'family_id,week_start_date,day,meal_slot' }
  )
}

export async function clearSlot(
  familyId: string,
  weekStart: string,
  day: DayOfWeek,
  mealSlot: MealSlotType
): Promise<void> {
  const supabase = createClient()
  await supabase
    .from('meal_plan_slots')
    .delete()
    .eq('family_id', familyId)
    .eq('week_start_date', weekStart)
    .eq('day', day)
    .eq('meal_slot', mealSlot)
}
