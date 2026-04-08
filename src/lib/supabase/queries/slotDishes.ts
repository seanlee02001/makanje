import { createClient } from '@/lib/supabase/client'

export async function setSlotDishes(
  slotId: string,
  dishIds: string[]
): Promise<void> {
  const supabase = createClient()
  // Clear existing dishes for this slot
  await supabase.from('slot_dishes').delete().eq('slot_id', slotId)
  // Insert new dishes
  if (dishIds.length > 0) {
    await supabase.from('slot_dishes').insert(
      dishIds.map((dishId, i) => ({
        slot_id: slotId,
        dish_id: dishId,
        sort_order: i,
      }))
    )
  }
}

export async function addDishToSlot(
  slotId: string,
  dishId: string,
  sortOrder: number
): Promise<void> {
  const supabase = createClient()
  await supabase.from('slot_dishes').insert({
    slot_id: slotId,
    dish_id: dishId,
    sort_order: sortOrder,
  })
}

export async function removeDishFromSlot(
  slotId: string,
  dishId: string
): Promise<void> {
  const supabase = createClient()
  await supabase
    .from('slot_dishes')
    .delete()
    .eq('slot_id', slotId)
    .eq('dish_id', dishId)
}
