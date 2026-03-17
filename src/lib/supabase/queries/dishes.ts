import { createClient } from '@/lib/supabase/client'
import type { Dish, DishWithIngredients } from '@/lib/supabase/types'

export async function getDishes(familyId: string): Promise<(Dish & { ingredients: { id: string }[] })[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('dishes')
    .select('*, ingredients(id)')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })
  return (data ?? []) as (Dish & { ingredients: { id: string }[] })[]
}

export async function getDishWithIngredients(id: string): Promise<DishWithIngredients | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('dishes')
    .select('*, ingredients(*)')
    .eq('id', id)
    .single()
  return data as DishWithIngredients | null
}

export async function createDish(params: {
  familyId: string
  name: string
  sourceUrl: string | null
  createdBy: string
}): Promise<Dish | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('dishes')
    .insert({
      family_id: params.familyId,
      name: params.name,
      source_url: params.sourceUrl,
      created_by: params.createdBy,
    })
    .select()
    .single()
  return data as Dish | null
}
