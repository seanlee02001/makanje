# Phase 1 — Schema Migration: Dish/Meal Split

> **Run this window FIRST. All other phases depend on this being complete.**

## Goal
Migrate the database and codebase from the old flat `meals` schema to the agreed dish/meal split:
- `dishes` — a single recipe with ingredients
- `meals` — a named collection of dishes
- `meal_dishes` — join table

## Context

### Old Schema (current)
```sql
meals       (id, family_id, name, source_url, created_by, created_at)
ingredients (id, meal_id, name, quantity, unit)
```

### New Schema (target)
```sql
dishes      (id, family_id, name, source_url, created_by, created_at)
ingredients (id, dish_id, name, quantity, unit)   -- FK renamed meal_id → dish_id
meals       (id, family_id, name, created_by, created_at)  -- no source_url, it's a collection
meal_dishes (id, meal_id, dish_id, sort_order)
```

`meal_plan_slots` and `shopping_lists` tables stay unchanged.

---

## Step 1 — Supabase Migration SQL

Create this file: `supabase/migrations/001_dish_meal_split.sql`

```sql
-- Rename meals → dishes
ALTER TABLE meals RENAME TO dishes;

-- Rename FK column on ingredients
ALTER TABLE ingredients RENAME COLUMN meal_id TO dish_id;

-- Create meals as collections
CREATE TABLE meals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name        text NOT NULL,
  created_by  uuid REFERENCES users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Join table: meal → dishes
CREATE TABLE meal_dishes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id    uuid NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  dish_id    uuid NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0
);

-- RLS on new tables (mirror dishes table policies)
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_dishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family meals" ON meals
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "family meal_dishes" ON meal_dishes
  USING (
    meal_id IN (
      SELECT id FROM meals WHERE family_id = (SELECT family_id FROM users WHERE id = auth.uid())
    )
  );

-- Update meal_plan_slots FK to reference new meals table
-- (meal_plan_slots.meal_id already points to old meals table, now renamed to dishes)
-- We need it to point to the new meals table instead
ALTER TABLE meal_plan_slots DROP CONSTRAINT IF EXISTS meal_plan_slots_meal_id_fkey;
ALTER TABLE meal_plan_slots ADD CONSTRAINT meal_plan_slots_meal_id_fkey
  FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE SET NULL;

-- NOTE: existing meal_plan_slots rows will have stale meal_ids pointing to dishes.
-- Run this to clear stale slot references after migration:
UPDATE meal_plan_slots SET meal_id = NULL;
```

Run this in the Supabase SQL editor (Dashboard → SQL Editor).

---

## Step 2 — Update `src/lib/supabase/types.ts`

Replace the entire file:

```typescript
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
}
```

---

## Step 3 — Update `src/lib/supabase/queries/meals.ts`

Read the current file first, then rewrite to use new tables:

```typescript
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
```

---

## Step 4 — Update `src/lib/utils/generateShoppingList.ts`

Read the current file, then update the aggregation path. The new path is:
`slots → meal → meal_dishes → dish → ingredients`

The slot fetch query in the plan page also needs updating:
```typescript
// In plan/page.tsx handleGenerateShoppingList, update the select query:
const { data: slotsWithIngredients } = await supabase
  .from('meal_plan_slots')
  .select('*, meal:meals(*, meal_dishes(*, dish:dishes(*, ingredients(*))))')
  .eq('family_id', familyId)
  .eq('week_start_date', weekStart)
```

Update `generateShoppingList.ts` to walk the new shape:
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateShoppingList(slots: any[]): ShoppingItem[] {
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
          }
        } else {
          map.set(key, {
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            checked: false,
          })
        }
      }
    }
  }

  return Array.from(map.values())
}
```

---

## Step 5 — Update `src/lib/supabase/queries/mealPlan.ts`

Read the file. The slot fetch queries that join meal data need updating to:
```typescript
.select('*, meal:meals(*, meal_dishes(*, dish:dishes(*)))')
```

---

## Step 6 — Update Ingredient queries

In any query that inserts/fetches ingredients, change `meal_id` → `dish_id`.

---

## Done When
- [ ] SQL migration run successfully in Supabase dashboard
- [ ] App compiles with no TypeScript errors (`npm run build`)
- [ ] Can create a dish, add it to a meal, assign meal to plan slot
- [ ] Shopping list generates correctly from the new aggregation path
- [ ] All other phases can now start

## Do NOT Touch
- `src/app/(app)/dishes/**` — Phase 2 owns this
- `src/app/(app)/meals/**` — Phase 3 owns this
- `src/app/(app)/pantry/**` — Phase 4 owns this
- `src/app/(app)/shopping/**` — Phase 5 owns this
