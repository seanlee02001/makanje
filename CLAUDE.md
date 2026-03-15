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
meals           (id, family_id, name, source_url, created_by, created_at)
ingredients     (id, meal_id, name, quantity, unit)
meal_plan_slots (id, family_id, week_start_date, day ENUM, meal_slot ENUM, meal_id)
shopping_lists  (id, family_id, week_start_date, items JSONB)
```

**Security:** RLS is enabled on all tables, scoped to `family_id`. Every query must respect this boundary — users only see their own family's data.

### Route Structure (App Router)

| Route | Purpose |
|---|---|
| `/` | Redirect → `/plan` or `/login` |
| `/login` | Supabase email/password auth |
| `/onboarding` | Create new family (generates `invite_code`) or join via code |
| `/plan` | Weekly meal plan grid — main screen |
| `/plan/[date]/[slot]` | Pick or add a meal for a specific day+slot |
| `/meals` | Family meal library |
| `/meals/new` | Add meal manually |
| `/meals/import` | URL → scrape → review → save |
| `/meals/[id]` | View/edit meal + ingredients |
| `/shopping` | Auto-generated editable shopping list |
| `/settings` | Family name, invite link, members, profile |
| `/api/import-recipe` | Server-side recipe scraper (`POST { url }` → `{ title, ingredients[] }`) |

### Key Architectural Patterns

- **Realtime:** Supabase Realtime subscriptions are used on `/plan` and `/shopping` so all family members see live updates. Conflict resolution is last-write-wins (sufficient for family scale).
- **Shopping list generation:** Aggregates ingredients from all `meal_plan_slots` for the week, deduplicates by name (merges quantities), stores result in `shopping_lists.items` JSONB.
- **Recipe import:** Server-side only (`/api/import-recipe`) to avoid CORS. On parse failure, return partial data and let user edit manually.
- **PWA offline:** Caches current week's plan read-only. Write operations require connectivity.

---

## Implementation Sequence

Follow this order to avoid blocked dependencies:

1. Project scaffold (Next.js, Tailwind, Supabase client, PWA manifest)
2. Supabase schema + RLS policies + invite_code generation
3. Auth flow (`/login`, `/onboarding`)
4. Meal library (`/meals`, `/meals/new`, `/meals/[id]`)
5. Recipe import (`/api/import-recipe` + `/meals/import`)
6. Meal plan grid + Realtime (`/plan`, `/plan/[date]/[slot]`)
7. Shopping list (`/shopping`, generation logic, Realtime checkboxes)
8. Settings page
9. PWA polish (icons, manifest, offline caching)
10. Vercel + Supabase prod deployment

---

## Verification Checklist

- **Auth:** Two accounts join the same family via invite code → confirm shared data
- **Realtime:** Two browser tabs open → add meal in one → other updates without refresh
- **Recipe import:** Paste AllRecipes URL → title + ingredients extracted correctly
- **Shopping list:** Plan 3 meals with overlapping ingredients → generate list → confirm deduplication → check off items in both tabs and verify sync
- **PWA:** Install on iPhone/Android → verify layout and usability
