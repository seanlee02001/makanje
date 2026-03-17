import { createClient } from '@/lib/supabase/client'
import type { Meal, Dish } from '@/lib/supabase/types'

// --- Dishes ---

export async function getDishes(familyId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('dishes')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Dish[]
}

export async function getDishWithIngredients(dishId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('dishes')
    .select('*, ingredients(*)')
    .eq('id', dishId)
    .single()
  if (error) throw error
  return data
}

export async function createDish(familyId: string, name: string, sourceUrl: string | null, createdBy: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('dishes')
    .insert({ family_id: familyId, name, source_url: sourceUrl, created_by: createdBy })
    .select()
    .single()
  if (error) throw error
  return data as Dish
}

export async function deleteDish(dishId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('dishes').delete().eq('id', dishId)
  if (error) throw error
}

// --- Meals (collections) ---

export async function getMeals(familyId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('meals')
    .select('*, meal_dishes(dish_id, sort_order, dish:dishes(*))')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Meal[]
}

export async function getMealWithDishes(mealId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('meals')
    .select('*, meal_dishes(*, dish:dishes(*, ingredients(*)))')
    .eq('id', mealId)
    .single()
  if (error) throw error
  return data
}

export async function createMeal(familyId: string, name: string, createdBy: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('meals')
    .insert({ family_id: familyId, name, created_by: createdBy })
    .select()
    .single()
  if (error) throw error
  return data as Meal
}

export async function addDishToMeal(mealId: string, dishId: string, sortOrder = 0) {
  const supabase = createClient()
  const { error } = await supabase
    .from('meal_dishes')
    .insert({ meal_id: mealId, dish_id: dishId, sort_order: sortOrder })
  if (error) throw error
}

export async function removeDishFromMeal(mealId: string, dishId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('meal_dishes')
    .delete()
    .eq('meal_id', mealId)
    .eq('dish_id', dishId)
  if (error) throw error
}

export async function deleteMeal(mealId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('meals').delete().eq('id', mealId)
  if (error) throw error
}
