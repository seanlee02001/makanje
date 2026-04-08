# MakanJe — Findings & Discoveries
_Updated: 2026-03-17_

## Codebase State (audited 2026-03-17)

### What's Already Built
- Full auth flow: `/login`, `/onboarding`, `/join`, `AuthContext`, middleware
- Supabase client + server helpers, RLS assumed on Supabase side
- Meal plan grid: week navigation, day picker, slot cards, Realtime via `useRealtimeSlots`
- Meal picker modal: searches family meals, assigns to slot
- Meals library: `/meals`, `/meals/new`, `/meals/[id]`, import page
- Recipe import: `/api/import-recipe` (server-side scraper), import review page
- Shopping list: `/shopping`, `useRealtimeShopping`, Realtime checkboxes, `generateShoppingList` util
- Settings: `/settings`, `CopyLinkButton` for invite link
- PWA: manifest, service worker, icons (just updated to orange fork+knife logo)
- UI components: `Button`, `Input`, `Modal`, `Spinner`, `AppShell` (glass bottom nav)

### Current Schema (OLD — pre-dish/meal split)
```
meals (id, family_id, name, source_url, created_by, created_at)
ingredients (id, meal_id, name, quantity, unit)
meal_plan_slots (id, family_id, week_start_date, day, meal_slot, meal_id)
shopping_lists (id, family_id, week_start_date, items JSONB)
```

### Target Schema (post-dish/meal split)
```
dishes      (id, family_id, name, source_url, created_by, created_at)
ingredients (id, dish_id, name, quantity, unit)   -- FK changes meal_id → dish_id
meals       (id, family_id, name, created_by, created_at)
meal_dishes (id, meal_id, dish_id, sort_order)
meal_plan_slots (id, family_id, week_start_date, day, meal_slot, meal_id)  -- unchanged
shopping_lists  (id, family_id, week_start_date, items JSONB)              -- unchanged
```

### Files That Need Updates for Schema Migration
- `src/lib/supabase/types.ts` — add Dish type, update Meal, add MealDish
- `src/lib/supabase/queries/meals.ts` — all queries
- `src/lib/supabase/queries/mealPlan.ts` — slot fetch needs new join path
- `src/lib/utils/generateShoppingList.ts` — new aggregation path
- `src/components/plan/MealPickerModal.tsx` — picks Meal (collection)
- `src/components/meals/MealCard.tsx` — display a collection of dishes
- `src/app/(app)/meals/` — all pages
- `src/app/(app)/plan/page.tsx` — slot display + generation query

### Shopping List Generation (current)
Located at `src/lib/utils/generateShoppingList.ts`. Currently walks:
`slots → meal.ingredients` (flat, OLD schema)

After migration, must walk:
`slots → meals → meal_dishes → dishes → ingredients`

### Key UI Patterns in Use
- Glass morphism cards: `glass` and `glass-strong` Tailwind classes
- Orange color system: `orange-500` primary, `orange-600` active
- Font heading: `font-heading` class
- Safe area: `safe-area-pb`, `pb-safe` for iOS notch
- Slot colors: breakfast=amber, lunch=emerald, dinner=violet

### Missing Pages (need to create)
- `/dishes` — dish library
- `/dishes/new` — add dish
- `/dishes/[id]` — edit dish
- `/dishes/import` — same as meals/import but saves as dish
- `/pantry` — pantry items
- `/shopping/share/[token]` — public share page
