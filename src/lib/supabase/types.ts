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

// A single recipe with its own ingredients
export interface Dish {
  id: string
  family_id: string
  name: string
  source_url: string | null
  created_by: string | null
  created_at: string
}

export interface Ingredient {
  id: string
  dish_id: string
  name: string
  quantity: number | null
  unit: string | null
}

export type DishWithIngredients = Dish & { ingredients: Ingredient[] }

// A named collection of dishes served together
export interface Meal {
  id: string
  family_id: string
  name: string
  created_by: string | null
  created_at: string
  dishes?: DishWithIngredients[]  // populated via join
}

export interface MealDish {
  id: string
  meal_id: string
  dish_id: string
  sort_order: number
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

export interface PantryItem {
  id: string
  family_id: string
  name: string
  quantity: number | null
  unit: string | null
  updated_at: string
}

export interface ShoppingItem {
  name: string
  quantity: number | null
  unit: string | null
  checked: boolean
  store_section?: string
  source?: string
  manual?: boolean
}

export interface ShoppingList {
  id: string
  family_id: string
  week_start_date: string
  items: ShoppingItem[]
  share_token: string | null
}
