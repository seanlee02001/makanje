export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export type MealSlotType = 'breakfast' | 'lunch' | 'dinner'
export type StoreSection = 'produce' | 'meat' | 'seafood' | 'dairy' | 'bakery' | 'pantry' | 'frozen' | 'other'

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

export interface Dish {
  id: string
  family_id: string
  name: string
  source_url: string | null
  created_by: string | null
  created_at: string
  tags: string[]
  prep_time_min: number | null
  servings: number | null
  instructions: { step: number; text: string }[]
}

export interface Ingredient {
  id: string
  dish_id: string
  name: string
  quantity: number | null
  unit: string | null
  store_section: StoreSection | null
}

export type DishWithIngredients = Dish & { ingredients: Ingredient[] }

export interface SlotDish {
  id: string
  slot_id: string
  dish_id: string
  sort_order: number
  dish?: DishWithIngredients
}

export interface MealPlanSlot {
  id: string
  family_id: string
  week_start_date: string
  day: DayOfWeek
  meal_slot: MealSlotType
  slot_dishes?: SlotDish[]
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
