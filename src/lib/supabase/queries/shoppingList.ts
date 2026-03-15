import { createClient } from '@/lib/supabase/client'
import type { ShoppingList, ShoppingItem } from '@/lib/supabase/types'
import { generateShoppingList } from '@/lib/utils/generateShoppingList'

export async function getShoppingList(
  familyId: string,
  weekStart: string
): Promise<ShoppingList | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('family_id', familyId)
    .eq('week_start_date', weekStart)
    .single()
  return data
}

export async function updateShoppingListItems(
  familyId: string,
  weekStart: string,
  items: ShoppingItem[]
): Promise<void> {
  const supabase = createClient()
  await supabase
    .from('shopping_lists')
    .upsert(
      { family_id: familyId, week_start_date: weekStart, items },
      { onConflict: 'family_id,week_start_date' }
    )
}

export async function generateAndSaveShoppingList(
  familyId: string,
  weekStart: string
): Promise<ShoppingList | null> {
  const supabase = createClient()

  // Fetch slots with nested meals and ingredients
  const { data: slots } = await supabase
    .from('meal_plan_slots')
    .select('*, meal:meals(*, ingredients(*))')
    .eq('family_id', familyId)
    .eq('week_start_date', weekStart)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = generateShoppingList((slots as any[]) ?? [])

  const { data } = await supabase
    .from('shopping_lists')
    .upsert(
      { family_id: familyId, week_start_date: weekStart, items },
      { onConflict: 'family_id,week_start_date' }
    )
    .select()
    .single()

  return data
}
