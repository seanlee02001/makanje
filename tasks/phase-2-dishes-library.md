# Phase 2 — Dishes Library

> **Start after Phase 1 is complete.**
> This window owns: `src/app/(app)/dishes/**`, `src/components/meals/DishCard.tsx`, `src/lib/supabase/queries/dishes.ts`

## Goal
Build the dishes library — where individual recipes live. A dish has a name, optional source URL, and a list of ingredients.

## Routes to Create

| Route | Purpose |
|---|---|
| `/dishes` | Family dish library grid |
| `/dishes/new` | Manually add a new dish |
| `/dishes/[id]` | View + edit dish and its ingredients |
| `/dishes/import` | Scrape URL → review → save as dish |

---

## Context

### Types (from Phase 1 types.ts)
```typescript
interface Dish {
  id: string
  family_id: string
  name: string
  source_url: string | null
  created_by: string | null
  created_at: string
}

interface Ingredient {
  id: string
  dish_id: string
  name: string
  quantity: number | null
  unit: string | null
}
```

### Existing utilities to reuse
- `src/lib/supabase/queries/dishes.ts` — created in Phase 1, use `getDishes`, `getDishWithIngredients`, `createDish`
- `src/components/meals/IngredientRow.tsx` — already exists, reuse for ingredient list
- `src/components/ui/Button.tsx`, `Input.tsx`, `Modal.tsx`, `Spinner.tsx` — reuse all
- `src/lib/supabase/client.ts` — Supabase client
- `/api/import-recipe` — existing recipe scraper endpoint

### UI Patterns (match existing app)
- Glass cards: `className="glass rounded-2xl p-4 ..."`
- Orange primary: `bg-orange-500`, `text-orange-600`
- Page header: same sticky glass pattern as other pages
- Font: `font-heading` for titles

---

## Files to Create

### `src/components/meals/DishCard.tsx`
A card for a single dish (similar to MealCard but for dishes):
- Shows dish name
- Shows source domain if `source_url` exists
- Shows ingredient count badge
- Links to `/dishes/[id]`

```tsx
import Link from 'next/link'
import type { Dish } from '@/lib/supabase/types'

interface Props {
  dish: Dish & { ingredients?: { id: string }[] }
}

export function DishCard({ dish }: Props) {
  const domain = dish.source_url
    ? (() => { try { return new URL(dish.source_url).hostname.replace('www.', '') } catch { return null } })()
    : null
  const ingredientCount = dish.ingredients?.length ?? 0

  return (
    <Link
      href={`/dishes/${dish.id}`}
      className="glass rounded-2xl p-4 flex flex-col gap-2.5 hover:brightness-95 transition-all active:scale-[0.97] shadow-sm"
    >
      <div className="w-11 h-11 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm">
        {/* Fork & knife icon — same as MealCard */}
        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 2v5M9.5 2v5M7 7c0 1 .5 1.5 1.25 1.5S9.5 8 9.5 7" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 8.5V22" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 2c0 0 3 3 3 6h-3V2z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8v14" />
        </svg>
      </div>
      <div>
        <p className="font-bold text-[#0F172A] dark:text-[#FED7AA] line-clamp-2 text-sm font-heading leading-snug">
          {dish.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {ingredientCount > 0 && (
            <span className="text-xs text-orange-600 font-semibold">
              {ingredientCount} ingredient{ingredientCount !== 1 ? 's' : ''}
            </span>
          )}
          {domain && (
            <span className="text-xs text-slate-500 dark:text-orange-200/60 truncate font-medium">{domain}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
```

---

### `src/app/(app)/dishes/page.tsx`
Dish library page. Similar structure to `/meals/page.tsx`:
- Load family dishes on mount
- Grid of `DishCard`
- FAB / header button → `/dishes/new`
- Import from URL button → `/dishes/import`
- Empty state if no dishes yet

---

### `src/app/(app)/dishes/new/page.tsx`
Manual dish creation form:
- Name field (required)
- Source URL field (optional)
- Ingredient list: add rows (name, quantity, unit) — reuse `IngredientRow` pattern
- On submit: call `createDish`, then insert ingredients to `ingredients` table (`dish_id` FK)
- On success: redirect to `/dishes/[id]`

---

### `src/app/(app)/dishes/import/page.tsx`
URL import flow (reuse existing `/meals/import` logic but save as a dish):
- URL input
- POST to `/api/import-recipe` → get `{ title, ingredients[] }`
- Review screen: edit name, edit ingredient list
- Save button: calls `createDish` + insert ingredients
- Redirect to `/dishes/[id]` on success

You can copy the existing `/meals/import/page.tsx` and adapt — the only difference is saving to `dishes` instead of `meals`.

---

### `src/app/(app)/dishes/[id]/page.tsx`
Dish detail / edit page:
- Load dish + ingredients on mount (`getDishWithIngredients(id)`)
- Show dish name (editable inline or via edit button)
- Show source URL with external link
- Ingredient list using `IngredientRow` — add/edit/delete individual ingredients
- Delete dish button (with confirmation)
- Back link to `/dishes`

---

## Nav Note
Do NOT add a "Dishes" tab to `AppShell.tsx`. Dishes are accessed from within the Meals flow. Add a link to `/dishes` from the Meals page header instead (e.g. "Manage Dishes" secondary button).

Phase 3 will link dishes into meals. This phase just builds the standalone CRUD.

---

## Done When
- [ ] `/dishes` shows all family dishes in a grid
- [ ] Can create a dish manually with ingredients
- [ ] Can import a dish from a URL
- [ ] Can view/edit/delete a dish and its ingredients
- [ ] TypeScript compiles cleanly
