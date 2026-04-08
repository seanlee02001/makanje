import { createClient } from '@/lib/supabase/client'
import type { MealPlanSlot, DayOfWeek, MealSlotType } from '@/lib/supabase/types'

export async function getWeekSlots(
  familyId: string,
  weekStart: string
): Promise<MealPlanSlot[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('meal_plan_slots')
    .select('*, slot_dishes(*, dish:dishes(*, ingredients(*)))')
    .eq('family_id', familyId)
    .eq('week_start_date', weekStart)
    .order('sort_order', { referencedTable: 'slot_dishes', ascending: true })
  return (data as MealPlanSlot[]) ?? []
}

export async function upsertSlot(
  familyId: string,
  weekStart: string,
  day: DayOfWeek,
  mealSlot: MealSlotType
): Promise<MealPlanSlot> {
  const supabase = createClient()
  const { data } = await supabase
    .from('meal_plan_slots')
    .upsert(
      { family_id: familyId, week_start_date: weekStart, day, meal_slot: mealSlot },
      { onConflict: 'family_id,week_start_date,day,meal_slot' }
    )
    .select('*, slot_dishes(*, dish:dishes(*, ingredients(*)))')
    .single()
  return data as MealPlanSlot
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
