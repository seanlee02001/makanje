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

export async function getDishesByTag(familyId: string, tag: string): Promise<(Dish & { ingredients: { id: string }[] })[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('dishes')
    .select('*, ingredients(id)')
    .eq('family_id', familyId)
    .contains('tags', [tag])
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
  tags?: string[]
  prepTimeMin?: number | null
  servings?: number | null
  instructions?: { step: number; text: string }[]
}): Promise<Dish | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('dishes')
    .insert({
      family_id: params.familyId,
      name: params.name,
      source_url: params.sourceUrl,
      created_by: params.createdBy,
      tags: params.tags ?? [],
      prep_time_min: params.prepTimeMin ?? null,
      servings: params.servings ?? null,
      instructions: params.instructions ?? [],
    })
    .select()
    .single()
  return data as Dish | null
}

export async function updateDish(id: string, updates: {
  name?: string
  source_url?: string | null
  tags?: string[]
  prep_time_min?: number | null
  servings?: number | null
  instructions?: { step: number; text: string }[]
}): Promise<void> {
  const supabase = createClient()
  await supabase.from('dishes').update(updates).eq('id', id)
}

export async function deleteDish(dishId: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('dishes').delete().eq('id', dishId)
}
