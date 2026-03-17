# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MakanJe is a family meal planning PWA. Families share a weekly meal plan grid, a meal library, and an auto-generated shopping list. Multiple family members see live updates via Supabase Realtime.

**Status:** Pre-development — design approved, implementation not yet started. See `2026-03-15-design.md` for the full spec.

---

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Supabase** — Postgres DB, Auth (email/password), Realtime subscriptions
- **Tailwind CSS** — mobile-first styling
- **next-pwa** — PWA / home screen installability
- **Recipe scraping:** `@extractus/article-parser` or `recipe-scraper`
- **Deployment:** Vercel + Supabase prod

---

## Commands

Once scaffolded (step 1 of implementation):

```bash
npm run dev       # start dev server (localhost:3000)
npm run build     # production build
npm run lint      # ESLint
npm run test      # tests (framework TBD)
```

---

## Architecture

### Data Model (Supabase / Postgres)

```sql
families        (id, name, invite_code)
users           (id, email, name, family_id)
dishes          (id, family_id, name, source_url, created_by, created_at)  -- a single recipe
ingredients     (id, dish_id, name, quantity, unit)
meals           (id, family_id, name, created_by, created_at)              -- a named collection of dishes
meal_dishes     (id, meal_id, dish_id, sort_order)                         -- join table; dishes are reusable across meals
meal_plan_slots (id, family_id, week_start_date, day ENUM, meal_slot ENUM, meal_id)
pantry_items    (id, family_id, name, quantity, unit, updated_at)          -- ingredients the family already has
shopping_lists  (id, family_id, week_start_date, items JSONB)
```

**Terminology:**
- **Dish** — a single recipe (e.g. Pasta Bolognese, Caesar Salad). Has its own ingredients.
- **Meal** — a named collection of dishes served together (e.g. "Sunday Roast" = Roast Chicken + Roasted Potatoes + Green Beans). A dish can appear in multiple meals.

**Shopping list aggregation path:** `meal_plan_slots → meals → meal_dishes → dishes → ingredients`

**Security:** RLS is enabled on all tables, scoped to `family_id`. Every query must respect this boundary — users only see their own family's data.

### Route Structure (App Router)

| Route | Purpose |
|---|---|
| `/` | Redirect → `/plan` or `/login` |
| `/login` | Supabase email/password auth |
| `/onboarding` | Create new family (generates `invite_code`) or join via code |
| `/plan` | Weekly meal plan grid — main screen |
| `/plan/[date]/[slot]` | Pick or add a meal for a specific day+slot |
| `/meals` | Family meal library (collections of dishes) |
| `/meals/new` | Create a new meal, add dishes to it |
| `/meals/[id]` | View/edit meal + its dishes |
| `/dishes` | Family dish library |
| `/dishes/new` | Add dish manually |
| `/dishes/import` | URL → scrape → review → save |
| `/dishes/[id]` | View/edit dish + ingredients |
| `/pantry` | Ingredients the family currently has — subtracted from shopping list |
| `/shopping` | Auto-generated editable shopping list |
| `/settings` | Family name, invite link, members, profile |
| `/api/import-recipe` | Server-side recipe scraper (`POST { url }` → `{ title, ingredients[] }`) |

> **Note:** The current implementation uses the old single-level `meals` model. The dish/meal split is a planned schema migration — see Implementation Sequence for when to apply it.

### Key Architectural Patterns

- **Realtime:** Supabase Realtime subscriptions are used on `/plan` and `/shopping` so all family members see live updates. Conflict resolution is last-write-wins (sufficient for family scale).
- **Shopping list generation:** Aggregates ingredients by walking `meal_plan_slots → meals → meal_dishes → dishes → ingredients` for the week, deduplicates by name (merges quantities), subtracts matching `pantry_items`, stores result in `shopping_lists.items` JSONB. Each item also carries a `store_section` (e.g. produce, dairy, pantry) for aisle-ordered display.
- **Pantry:** Shared per family, Realtime-synced. Items can be added manually or decremented when shopping list items are checked off.
- **Share list:** Shopping list can be exported as plain text (clipboard), or opened in WhatsApp/SMS via a share URL. Server-renders a public read-only `/shopping/share/[token]` page — no login required for the shopper.
- **Recipe import:** Server-side only (`/api/import-recipe`) to avoid CORS. On parse failure, return partial data and let user edit manually.
- **PWA offline:** Caches current week's plan read-only. Write operations require connectivity.

---

## What We Have Now

**Status as of 2026-03-17:** Pre-development. No code written yet.

| Area | Status | Notes |
|---|---|---|
| Design spec | Done | `2026-03-15-design.md` |
| Data model | Designed, not implemented | Dish/meal split agreed, migration deferred |
| Project scaffold | Not started | — |
| Auth | Not started | — |
| Meal/dish library | Not started | — |
| Recipe import | Not started | — |
| Meal plan grid | Not started | — |
| Shopping list | Not started | Includes store sections, pantry subtraction, share link |
| Pantry | Not started | — |
| Settings | Not started | — |
| PWA polish | Not started | — |
| Prod deployment | Not started | — |

---

## Implementation Sequence

Follow this order to avoid blocked dependencies:

1. Project scaffold (Next.js, Tailwind, Supabase client, PWA manifest)
2. Supabase schema + RLS policies + invite_code generation
3. Auth flow (`/login`, `/onboarding`)
4. Meal library (`/meals`, `/meals/new`, `/meals/[id]`)
5. Recipe import (`/api/import-recipe` + `/meals/import`)
6. Meal plan grid + Realtime (`/plan`, `/plan/[date]/[slot]`)
7. Shopping list (`/shopping`, generation logic, store sections, Realtime checkboxes, share link)
8. Pantry (`/pantry`, pantry_items CRUD, Realtime sync)
9. Settings page
10. PWA polish (icons, manifest, offline caching)
11. Vercel + Supabase prod deployment

---

## Feature Roadmap

Features planned but not yet designed or scheduled. Revisit after core implementation is stable.

### Meal Planning
- **Meal rotation history** — track which meals were planned in past weeks to avoid repetition
- **"Surprise me" / random meal picker** — auto-fill empty slots from the meal library
- **Meal tags/filters** — tag meals (vegetarian, quick, kid-friendly) and filter when picking slots
- **Template weeks** — save a week layout as a template to reuse (e.g. "Summer rotation")
- **Copy last week** — one-tap to duplicate previous week's plan as a starting point
- **Busy night detection** — connect to calendar; auto-suggest quick meals on nights with events
- **Nutritional week view** — summarize protein/carb/veg balance across the whole planned week
- **Guest mode** — one tap to scale all meals for a dinner party (e.g. "8 people tonight")
- **Leftovers planning** — mark a dish as "makes leftovers"; auto-suggest it for next day's lunch slot

### Shopping List
- **Quantity scaling** — adjust recipe servings and auto-scale ingredient quantities
- **Store sections** — categorize ingredients by aisle (produce, dairy, pantry) for faster shopping
- **Share list externally** — export to clipboard, SMS, or WhatsApp; public read-only share link (no login)
- **Multi-store routing** — assign ingredients to different stores (e.g. fish from wet market, rest from supermarket)
- **Barcode scanner** — scan items into pantry when putting away groceries
- **Grocery delivery integration** — push shopping list directly to Grab Mart / GoMart / Instacart
- **Quick-add** — add one-off items not tied to a meal (e.g. "toilet paper")

### Pantry / Inventory
- **Pantry tracking** — mark ingredients as "already have"; subtracted from shopping list generation
- **Pantry-based suggestions** — "what can I make with what we have?" surfaces dishes matching current pantry
- **Realtime sync** — pantry shared across all family members with live updates

### Dishes / Recipes
- **Cooking time & difficulty** — tag each dish (quick/medium/long, easy/hard); filter when planning
- **Cuisine / category tags** — Italian, Asian, comfort food, etc. for browsing and filtering
- **Allergen flags** — per-dish flags (gluten-free, nut-free, dairy-free); warn when a meal contains a family member's allergen
- **Estimated cost per dish** — rough cost tracking for weekly budget planning
- **Duplicate dish** — clone an existing dish as a starting point for a variation
- **Dish notes** — freeform notes (e.g. "add extra garlic", "use less salt")

### Meal Library
- **Nutritional estimates** — pull or store calorie/macro data per meal
- **Ratings** — family members thumbs up/down meals after eating
- **Meal photos** — attach a photo (from camera or URL) to each meal
- **Duplicate meal** — clone an existing meal as a starting point for a variation
- **Meal notes** — freeform notes per meal

### Family / Collaboration
- **Meal requests** — family members propose meals; the planner accepts/places them
- **Meal voting** — poll the family on what they want this week
- **Who's cooking** — assign a family member to each meal slot
- **Push notifications** — reminder the morning of ("Tonight: Pasta Bolognese") based on dish cook time + target meal time
- **Per-member preferences** — track each family member's likes/dislikes; highlight conflicts when planning
- **Kids' profiles** — child-safe meal filter, age-appropriate portion notes

### AI Features
- **AI recipe generation** — describe a dish in plain text, AI generates name + ingredients
- **Auto-tag on import** — when scraping a recipe URL, AI auto-assigns cuisine, difficulty, allergens
- **Smart shopping list grouping** — AI reorders items by store aisle layout based on your usual store

### Onboarding / Growth
- **Starter meal packs** — seed a new family's library with 10 curated meals
- **Import from Paprika / Mealime** — bulk import existing meal libraries
- **Multiple family groups** — for users who manage two households

### PWA / UX
- **Dark mode**
- **Swipe gestures** on the meal grid (mobile-native feel)
- **Offline write queue** — buffer changes when offline and sync on reconnect (vs current read-only offline)

---

## Verification Checklist

- **Auth:** Two accounts join the same family via invite code → confirm shared data
- **Realtime:** Two browser tabs open → add meal in one → other updates without refresh
- **Recipe import:** Paste AllRecipes URL → title + ingredients extracted correctly
- **Shopping list:** Plan 3 meals with overlapping ingredients → generate list → confirm deduplication → check off items in both tabs and verify sync
- **PWA:** Install on iPhone/Android → verify layout and usability
