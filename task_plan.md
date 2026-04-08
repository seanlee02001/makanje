# MakanJe — Implementation Plan
_Last updated: 2026-03-17_

## Goal
Ship a fully functional family meal planning PWA on Vercel + Supabase. Core loops: plan meals for the week → auto-generate shopping list → share with family in realtime.

---

## Current State (as of 2026-03-17)

| Area | Status | Notes |
|---|---|---|
| Project scaffold | ✅ Done | Next.js 14, Tailwind, Supabase client, PWA manifest |
| Auth (login/onboarding) | ✅ Done | Email/password, family create/join via invite_code |
| Meal library | ✅ Done | `/meals`, `/meals/new`, `/meals/[id]` — OLD schema (no dish split yet) |
| Recipe import | ✅ Done | `/api/import-recipe`, `/meals/import` |
| Meal plan grid | ✅ Done | `/plan`, Realtime slots, week navigation, meal picker modal |
| Shopping list | ✅ Done | `/shopping`, Realtime checkboxes, generation from plan |
| Settings | ✅ Done | `/settings` (basic — family name, invite link, members) |
| PWA icons | ✅ Done | Orange fork+knife logo, manifest theme color fixed |
| Schema: dish/meal split | ❌ Not started | Current types still use old flat `meals` table |
| Dishes library | ❌ Not started | `/dishes`, `/dishes/new`, `/dishes/[id]`, `/dishes/import` |
| Pantry | ❌ Not started | `/pantry`, pantry_items CRUD, Realtime sync |
| Shopping list share link | ❌ Not started | Public `/shopping/share/[token]` page |
| Store sections | ❌ Not started | Ingredient aisle grouping in shopping list |
| Prod deployment | ❌ Not started | Vercel + Supabase prod |

---

## Phases

### Phase 1 — Schema Migration: Dish/Meal Split
**Status:** `not_started`
**Depends on:** nothing
**Risk:** HIGH — touches all existing queries

The current schema has a flat `meals` table with `ingredients` directly. The agreed model separates:
- `dishes` — a single recipe with ingredients
- `meals` — a named collection of dishes
- `meal_dishes` — join table (dish reusable across meals)

Tasks:
- [ ] Write Supabase migration SQL: rename `meals` → `dishes`, add `meals` + `meal_dishes` tables
- [ ] Update RLS policies for new tables
- [ ] Update `src/lib/supabase/types.ts` — add `Dish`, `DishWithIngredients`, update `Meal` to collection type
- [ ] Update all queries in `src/lib/supabase/queries/` to use new schema
- [ ] Update `generateShoppingList.ts` — new aggregation path: `slots → meals → meal_dishes → dishes → ingredients`
- [ ] Update meal plan page — `MealPickerModal` picks a `Meal` (collection), not a dish
- [ ] Update `MealCard` component to reflect new Meal type
- [ ] Test: plan a meal with 2 dishes → generate shopping list → verify ingredient deduplication

---

### Phase 2 — Dishes Library
**Status:** `not_started`
**Depends on:** Phase 1

New pages for managing individual recipes (dishes):
- [ ] `/dishes` — family dish library grid
- [ ] `/dishes/new` — manual dish creation (name + ingredients)
- [ ] `/dishes/[id]` — view/edit dish + ingredients
- [ ] `/dishes/import` — URL scrape → review → save (reuse existing `/api/import-recipe`)
- [ ] Add "Dishes" entry to `AppShell` nav OR surface dishes within meal detail page
- [ ] `DishCard` component (similar to `MealCard`)
- [ ] `IngredientRow` — already exists, reuse

---

### Phase 3 — Meals as Collections
**Status:** `not_started`
**Depends on:** Phase 1 + Phase 2

Update meals flow so a meal is a named collection of dishes:
- [ ] `/meals/new` — create meal, search & add dishes to it
- [ ] `/meals/[id]` — show dish list within meal; add/remove dishes; reorder
- [ ] Meal picker modal — picks a `Meal` (shows dishes inside it as preview)
- [ ] "Create meal from dish" shortcut — one-dish meal quick-create

---

### Phase 4 — Pantry
**Status:** `not_started`
**Depends on:** Phase 1

- [ ] `/pantry` page — list pantry_items with add/edit/delete
- [ ] `pantry_items` CRUD queries
- [ ] Realtime subscription on pantry_items
- [ ] Hook into shopping list generation — subtract matching pantry items from output
- [ ] "Move to pantry" action on checked shopping list items

---

### Phase 5 — Shopping List Polish
**Status:** `not_started`
**Depends on:** Phase 1, Phase 4

- [ ] Store sections — add `store_section` field to `ShoppingItem`; group by aisle in UI
- [ ] Auto-assign store section during shopping list generation (produce/dairy/pantry/meat/etc.)
- [ ] Share link — generate a `share_token` on the shopping_lists row; public `/shopping/share/[token]` page (no auth)
- [ ] Share CTA in shopping page — copy link, open in WhatsApp/SMS

---

### Phase 6 — Prod Deployment
**Status:** `not_started`
**Depends on:** Phases 1–5

- [ ] Supabase prod project setup — run all migrations on prod DB
- [ ] Vercel project linked, env vars set (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
- [ ] Run verification checklist (see CLAUDE.md)
- [ ] PWA install test on iPhone + Android

---

## Errors Encountered
| Error | Phase | Resolution |
|---|---|---|
| — | — | — |

---

## Key Decisions
- **Dish/meal split:** `meals` = named collection of `dishes`. Dish is a single recipe. Join via `meal_dishes`.
- **Shopping list path:** `meal_plan_slots → meals → meal_dishes → dishes → ingredients`
- **Pantry subtraction:** happens at generation time, not display time
- **Share link:** server-rendered public page, no auth required, uses `share_token` UUID on shopping_lists row
- **Nav structure:** Keep 4-tab nav (Plan, Meals, Shopping, Settings). Dishes managed within Meals context, not a separate tab.
