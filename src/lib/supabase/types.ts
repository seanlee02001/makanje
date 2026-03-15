export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export type MealSlotType = 'breakfast' | 'lunch' | 'dinner'

export interface Family {
  id: string
  name: string
  invite_code: string
}

export interface User {
  id: string
  email: string
  name: string
  family_id: string | null
}

export interface Meal {
  id: string
  family_id: string
  name: string
  source_url: string | null
  created_by: string | null
  created_at: string
}

export interface Ingredient {
  id: string
  meal_id: string
  name: string
  quantity: number | null
  unit: string | null
}

export interface MealPlanSlot {
  id: string
  family_id: string
  week_start_date: string
  day: DayOfWeek
  meal_slot: MealSlotType
  meal_id: string | null
  meal?: Meal | null
}

export interface ShoppingItem {
  name: string
  quantity: number | null
  unit: string | null
  checked: boolean
  source?: string
  manual?: boolean
}

export interface ShoppingList {
  id: string
  family_id: string
  week_start_date: string
  items: ShoppingItem[]
}

export type MealWithIngredients = Meal & { ingredients: Ingredient[] }
