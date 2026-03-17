# Phase 3 — Meals as Collections

> **Start after Phase 1 is complete.**
> This window owns: `src/app/(app)/meals/**`, `src/components/meals/MealCard.tsx`, `src/components/plan/MealPickerModal.tsx`

## Goal
Update the meals flow so that a Meal is a named collection of dishes. The meal creation form lets you search and add dishes to a meal. The meal detail page shows its dishes.

---

## Context

### Types (from Phase 1)
```typescript
// Meal = a named collection of dishes
interface Meal {
  id: string
  family_id: string
  name: string
  created_by: string | null
  created_at: string
  dishes?: DishWithIngredients[]
}
```

### Queries available (from Phase 1 `queries/meals.ts`)
- `getMeals(familyId)` — returns meals with meal_dishes + dishes
- `getMealWithDishes(mealId)` — returns meal with full dish + ingredient detail
- `createMeal(familyId, name, createdBy)` — creates a new meal
- `addDishToMeal(mealId, dishId, sortOrder)` — links a dish to a meal
- `removeDishFromMeal(mealId, dishId)` — unlinks
- `deleteMeal(mealId)`

Also available:
- `getDishes(familyId)` — to search/pick dishes when building a meal

---

## Files to Update

### `src/components/meals/MealCard.tsx`
Update to show a meal as a collection. Instead of source URL, show dish names:

```tsx
import Link from 'next/link'
import type { Meal } from '@/lib/supabase/types'

export function MealCard({ meal }: { meal: Meal }) {
  // meal_dishes is loaded via join in getMeals query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mealDishes = (meal as any).meal_dishes ?? []
  const dishNames: string[] = mealDishes
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((md: any) => md.dish?.name)
    .filter(Boolean)
    .slice(0, 3)

  return (
    <Link
      href={`/meals/${meal.id}`}
      className="glass rounded-2xl p-4 flex flex-col gap-2.5 hover:brightness-95 transition-all active:scale-[0.97] shadow-sm"
    >
      <div className="w-11 h-11 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm">
        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 2v5M9.5 2v5M7 7c0 1 .5 1.5 1.25 1.5S9.5 8 9.5 7" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 8.5V22" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 2c0 0 3 3 3 6h-3V2z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8v14" />
        </svg>
      </div>
      <div>
        <p className="font-bold text-[#0F172A] dark:text-[#FED7AA] line-clamp-2 text-sm font-heading leading-snug">
          {meal.name}
        </p>
        {dishNames.length > 0 ? (
          <p className="text-xs text-slate-500 dark:text-orange-200/60 mt-1 truncate font-medium">
            {dishNames.join(' · ')}{mealDishes.length > 3 ? ` +${mealDishes.length - 3}` : ''}
          </p>
        ) : (
          <p className="text-xs text-orange-400 mt-1 font-medium">No dishes yet</p>
        )}
      </div>
    </Link>
  )
}
```

---

### `src/app/(app)/meals/page.tsx`
Update the data fetch to use `getMeals(familyId)` from the updated queries. The UI structure can stay similar. Add a secondary "Manage Dishes →" link that goes to `/dishes`.

---

### `src/app/(app)/meals/new/page.tsx`
Rewrite the create form:
1. **Step 1:** Enter meal name
2. **Step 2:** Search and add dishes to the meal
   - Show searchable list of family dishes (`getDishes`)
   - Tap a dish to add it → calls `addDishToMeal`
   - Show added dishes with remove button
3. Save → redirect to `/meals/[id]`

If no dishes exist yet, show a prompt: "Add dishes first → [Go to Dishes]"

---

### `src/app/(app)/meals/[id]/page.tsx`
Update to show the meal as a collection:
- Meal name (editable)
- List of dishes in this meal (from `meal_dishes` join)
  - Each dish shows name + ingredient count
  - Drag-to-reorder or up/down arrows (sort_order)
  - Remove dish button
- "Add dish to meal" button → search dishes modal
- Delete meal button
- Back link to `/meals`

---

### `src/components/plan/MealPickerModal.tsx`
Update so the modal picks a **Meal** (collection) not a flat meal:
- Fetch meals with `getMeals(familyId)`
- Show each meal with dish names preview (e.g. "Roast Chicken · Potatoes · Beans")
- Keep the search/filter UI
- On select: returns the full `Meal` object

The modal should NOT show individual dishes — it picks whole meals for a slot.

---

### `src/app/(app)/meals/import/page.tsx`
Update: importing a URL now creates a **Dish**, not a Meal.
- Change the save action to call `createDish` + insert ingredients
- After saving, redirect to `/dishes/[id]`
- Add messaging: "Recipe saved as a dish. Add it to a meal from the Dishes page."

(The old meals/import flow was saving a single recipe as a meal — now that's a dish.)

---

## Done When
- [ ] Meal list shows dish names inside each meal card
- [ ] Can create a meal, search and add dishes to it
- [ ] Meal detail page shows dishes, allows add/remove/reorder
- [ ] Meal picker modal on plan page shows meals with dish previews
- [ ] URL import correctly creates a dish (not a meal)
- [ ] TypeScript compiles cleanly
