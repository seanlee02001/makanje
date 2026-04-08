import type { MealPlanSlot, PantryItem, ShoppingItem } from '@/lib/supabase/types'

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

export function generateShoppingList(
  slots: MealPlanSlot[],
  pantryItems: PantryItem[] = []
): ShoppingItem[] {
  const map = new Map<string, ShoppingItem>()

  for (const slot of slots) {
    const slotDishes = slot.slot_dishes ?? []
    for (const sd of slotDishes) {
      const dish = sd.dish
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
          if (!existing.unit && ing.unit) existing.unit = ing.unit
        } else {
          map.set(key, {
            name: ing.name.trim(),
            quantity: ing.quantity,
            unit: ing.unit ?? null,
            checked: false,
            source: dish.name,
            store_section: ing.store_section ?? getSection(ing.name),
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
        map.delete(key)
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
}
