import { createClient } from '@/lib/supabase/client'
import type { Meal, Ingredient } from '@/lib/supabase/types'

export async function listMeals(familyId: string): Promise<Meal[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('meals')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getMeal(id: string): Promise<Meal | null> {
  const supabase = createClient()
  const { data } = await supabase.from('meals').select('*').eq('id', id).single()
  return data
}

export async function createMeal(
  familyId: string,
  name: string,
  sourceUrl?: string,
  createdBy?: string
): Promise<Meal | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('meals')
    .insert({ family_id: familyId, name, source_url: sourceUrl ?? null, created_by: createdBy ?? null })
    .select()
    .single()
  return data
}

export async function updateMeal(
  id: string,
  updates: { name?: string; source_url?: string | null }
): Promise<void> {
  const supabase = createClient()
  await supabase.from('meals').update(updates).eq('id', id)
}

export async function deleteMeal(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('meals').delete().eq('id', id)
}

export async function listIngredients(mealId: string): Promise<Ingredient[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('ingredients')
    .select('*')
    .eq('meal_id', mealId)
    .order('id')
  return data ?? []
}

export async function upsertIngredients(
  mealId: string,
  ingredients: Array<{ name: string; quantity?: number | null; unit?: string | null }>
): Promise<void> {
  const supabase = createClient()
  // Delete existing then insert fresh
  await supabase.from('ingredients').delete().eq('meal_id', mealId)
  if (ingredients.length > 0) {
    await supabase.from('ingredients').insert(
      ingredients.map((i) => ({
        meal_id: mealId,
        name: i.name,
        quantity: i.quantity ?? null,
        unit: i.unit ?? null,
      }))
    )
  }
}
