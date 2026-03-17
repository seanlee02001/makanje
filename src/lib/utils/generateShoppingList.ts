import type { PantryItem, ShoppingItem } from '@/lib/supabase/types'

const SECTION_MAP: Record<string, string> = {
  // Produce
  tomato: 'Produce', lettuce: 'Produce', spinach: 'Produce', onion: 'Produce',
  garlic: 'Produce', carrot: 'Produce', potato: 'Produce', broccoli: 'Produce',
  apple: 'Produce', banana: 'Produce', lemon: 'Produce', lime: 'Produce',
  cucumber: 'Produce', pepper: 'Produce', mushroom: 'Produce', avocado: 'Produce',
  ginger: 'Produce', celery: 'Produce', cabbage: 'Produce', corn: 'Produce',
  // Meat & Seafood
  chicken: 'Meat', beef: 'Meat', pork: 'Meat', lamb: 'Meat', mince: 'Meat',
  fish: 'Seafood', salmon: 'Seafood', tuna: 'Seafood', prawn: 'Seafood', shrimp: 'Seafood',
  // Dairy
  milk: 'Dairy', cheese: 'Dairy', butter: 'Dairy', cream: 'Dairy', yogurt: 'Dairy',
  egg: 'Dairy', eggs: 'Dairy',
  // Pantry (dry goods)
  rice: 'Pantry', pasta: 'Pantry', flour: 'Pantry', sugar: 'Pantry', salt: 'Pantry',
  oil: 'Pantry', vinegar: 'Pantry', sauce: 'Pantry', soy: 'Pantry', stock: 'Pantry',
  canned: 'Pantry', beans: 'Pantry', lentils: 'Pantry', noodle: 'Pantry',
  spice: 'Pantry', herb: 'Pantry', cumin: 'Pantry', paprika: 'Pantry',
  // Bakery
  bread: 'Bakery', bun: 'Bakery', wrap: 'Bakery', tortilla: 'Bakery',
  // Frozen
  frozen: 'Frozen', ice: 'Frozen',
}

export const SECTION_ORDER = ['Produce', 'Meat', 'Seafood', 'Dairy', 'Bakery', 'Pantry', 'Frozen', 'Other']

function getSection(name: string): string {
  const lower = name.toLowerCase()
  for (const [keyword, section] of Object.entries(SECTION_MAP)) {
    if (lower.includes(keyword)) return section
  }
  return 'Other'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateShoppingList(slots: any[], pantryItems: PantryItem[] = []): ShoppingItem[] {
  const map = new Map<string, ShoppingItem>()

  for (const slot of slots) {
    const meal = slot.meal
    if (!meal) continue
    const mealDishes = meal.meal_dishes ?? []
    for (const md of mealDishes) {
      const dish = md.dish
      if (!dish) continue
      for (const ing of dish.ingredients ?? []) {
        const key = ing.name.toLowerCase().trim()
        if (map.has(key)) {
          const existing = map.get(key)!
          if (existing.quantity != null && ing.quantity != null) {
            existing.quantity += ing.quantity
          } else if (ing.quantity != null) {
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
            source: meal.name,
            store_section: getSection(ing.name),
          })
        }
      }
    }
  }

  // Subtract pantry items
  for (const pantryItem of pantryItems) {
    const key = pantryItem.name.toLowerCase().trim()
    if (map.has(key)) {
      const item = map.get(key)!
      if (item.quantity != null && pantryItem.quantity != null) {
        item.quantity -= pantryItem.quantity
        if (item.quantity <= 0) map.delete(key)
      } else {
        map.delete(key) // have it, no qty tracking — remove entirely
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
}
