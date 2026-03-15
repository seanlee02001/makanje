import type { MealPlanSlot, ShoppingItem, Ingredient, Meal } from '@/lib/supabase/types'

type SlotWithMeal = MealPlanSlot & {
  meal: (Meal & { ingredients: Ingredient[] }) | null
}

export function generateShoppingList(slots: SlotWithMeal[]): ShoppingItem[] {
  const map = new Map<string, ShoppingItem>()

  for (const slot of slots) {
    if (!slot.meal) continue
    for (const ing of slot.meal.ingredients ?? []) {
      const key = ing.name.toLowerCase().trim()

      if (map.has(key)) {
        const existing = map.get(key)!
        if (existing.quantity !== null && ing.quantity !== null) {
          existing.quantity += ing.quantity
        } else if (ing.quantity !== null) {
          existing.quantity = ing.quantity
        }
        // Keep first unit seen
        if (!existing.unit && ing.unit) existing.unit = ing.unit
      } else {
        map.set(key, {
          name: ing.name.trim(),
          quantity: ing.quantity,
          unit: ing.unit ?? null,
          checked: false,
          source: slot.meal.name,
        })
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
}
