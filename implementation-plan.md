# MakanJe — Detailed Implementation Plan

**Date:** 2026-03-15
**Stack:** Next.js 14 (App Router) · TypeScript · Supabase · Tailwind CSS · next-pwa

---

## Overview

This plan breaks the MakanJe build into 10 sequential phases. Each phase lists exact files to create, commands to run, and acceptance criteria before moving on. Phases 1–3 are foundation; phases 4–8 are feature delivery; phases 9–10 are polish and deployment.

---

## Phase 1 — Project Scaffold

**Goal:** A running Next.js 14 app with Tailwind, Supabase client wired up, and a PWA manifest in place.

### Steps

1. Bootstrap the app:
   ```bash
   npx create-next-app@14 makanje \
     --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
   cd makanje
   ```

2. Install dependencies:
   ```bash
   npm install @supabase/supabase-js @supabase/ssr
   npm install next-pwa
   npm install @extractus/article-parser
   npm install -D @types/node
   ```

3. Create environment file `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   ```

4. **Files to create:**

   - `src/lib/supabase/client.ts` — browser Supabase client (using `createBrowserClient` from `@supabase/ssr`)
   - `src/lib/supabase/server.ts` — server Supabase client (using `createServerClient` from `@supabase/ssr` with cookie handling)
   - `src/middleware.ts` — refreshes auth session on every request, redirects unauthenticated users away from protected routes
   - `public/manifest.json` — PWA manifest with name "MakanJe", short_name "MakanJe", start_url "/", display "standalone", theme_color, background_color, and placeholder icons array
   - `public/icons/` — placeholder 192×192 and 512×512 PNG icons (swap for real art in Phase 9)
   - `next.config.ts` — wrap export with `withPWA({ dest: "public", disable: process.env.NODE_ENV === "development" })`

5. Update `src/app/layout.tsx`:
   - Add `<link rel="manifest" href="/manifest.json">` in `<head>`
   - Set `<html lang="en">` and a neutral background in `<body>`

### Acceptance Criteria
- `npm run dev` starts with no errors
- Browser console shows no missing manifest warnings
- Supabase client can be imported without TypeScript errors

---

## Phase 2 — Supabase Schema, RLS & Helpers

**Goal:** All database tables exist, RLS is locked down to family_id, and invite code generation works.

### SQL to run in Supabase SQL Editor

```sql
-- Extensions
create extension if not exists "pgcrypto";

-- Families
create table families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null default substring(md5(random()::text), 1, 8)
);

-- Users (extends Supabase auth.users)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  family_id uuid references families(id)
);

-- Meals
create table meals (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  name text not null,
  source_url text,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

-- Ingredients
create table ingredients (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references meals(id) on delete cascade,
  name text not null,
  quantity numeric,
  unit text
);

-- Meal plan slots
create type day_of_week as enum ('mon','tue','wed','thu','fri','sat','sun');
create type meal_slot_type as enum ('breakfast','lunch','dinner');

create table meal_plan_slots (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  week_start_date date not null,
  day day_of_week not null,
  meal_slot meal_slot_type not null,
  meal_id uuid references meals(id) on delete set null,
  unique(family_id, week_start_date, day, meal_slot)
);

-- Shopping lists
create table shopping_lists (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  week_start_date date not null,
  items jsonb not null default '[]'::jsonb,
  unique(family_id, week_start_date)
);
```

### RLS Policies

Enable RLS on every table, then add policies:

```sql
-- Helper: get the calling user's family_id
create or replace function get_family_id()
returns uuid language sql stable security definer as $$
  select family_id from users where id = auth.uid()
$$;

-- families: read own family, insert new family during onboarding
alter table families enable row level security;
create policy "read own family" on families for select using (id = get_family_id());
create policy "insert family" on families for insert with check (true); -- restricted further in app layer

-- users: read family members, update own row
alter table users enable row level security;
create policy "read own family users" on users for select using (family_id = get_family_id());
create policy "insert own user" on users for insert with check (id = auth.uid());
create policy "update own user" on users for update using (id = auth.uid());

-- meals, ingredients, meal_plan_slots, shopping_lists: same pattern
-- (apply select/insert/update/delete scoped to get_family_id() on all four tables)
```

### Files to create

- `src/lib/supabase/types.ts` — TypeScript types generated from Supabase (`supabase gen types typescript --local > src/lib/supabase/types.ts`), or hand-authored to match the schema
- `src/lib/supabase/queries/` — folder for typed query helpers:
  - `families.ts` — `getFamily()`, `createFamily(name)`, `joinFamily(inviteCode)`
  - `meals.ts` — `listMeals(familyId)`, `getMeal(id)`, `createMeal(...)`, `updateMeal(...)`, `deleteMeal(id)`
  - `ingredients.ts` — `listIngredients(mealId)`, `upsertIngredients(mealId, ingredients[])`
  - `mealPlan.ts` — `getWeekSlots(familyId, weekStart)`, `upsertSlot(...)`, `clearSlot(...)`
  - `shoppingList.ts` — `getShoppingList(familyId, weekStart)`, `upsertShoppingList(...)`, `updateShoppingListItems(...)`

### Acceptance Criteria
- All tables visible in Supabase table editor
- RLS enabled column shows ✓ on all tables
- `joinFamily('TESTCODE')` from a second user account returns the correct family

---

## Phase 3 — Auth Flow

**Goal:** Users can sign up, log in, create a family, and join a family via invite code. Session persists across refreshes.

### Files to create / modify

**`src/app/(auth)/login/page.tsx`**
- Single page with email + password fields and a submit button
- On submit: `supabase.auth.signInWithPassword(...)` or `signUp(...)`
- Toggle between "Sign In" and "Sign Up" mode
- On success: redirect to `/onboarding` if user has no `family_id`, else to `/plan`
- Show inline error messages (wrong password, email taken, etc.)

**`src/app/(auth)/onboarding/page.tsx`**
- Two tabs or radio toggle: "Create a new family" / "Join a family"
- **Create:** text field for family name → call `createFamily(name)` → update `users.family_id` → redirect to `/plan`
- **Join:** text field for invite code → call `joinFamily(code)` → update `users.family_id` → redirect to `/plan`
- Show error if invite code not found

**`src/middleware.ts`** (expand from Phase 1)
- Protect all routes except `/login` and `/onboarding`
- If no session → redirect to `/login`
- If session but no `family_id` → redirect to `/onboarding`

**`src/app/(auth)/layout.tsx`**
- Centered card layout, MakanJe logo/wordmark at top

**`src/lib/auth/actions.ts`** (Server Actions)
- `signIn(email, password)`
- `signUp(email, password, name)`
- `signOut()`

### Acceptance Criteria
- New user can sign up, land on onboarding, create a family, and land on `/plan`
- Second user can sign up and join the first family using the invite code
- Both users see the same `family_id` in `users` table
- Refreshing any protected page keeps the session (no redirect loop)

---

## Phase 4 — Meal Library

**Goal:** Family members can browse, add, edit, and delete meals with ingredients.

### Files to create

**`src/app/(app)/meals/page.tsx`**
- Server component: fetch all `meals` for the family
- Renders a responsive card grid (2 columns on mobile, 3 on desktop)
- Each card shows meal name, optional source URL favicon, and a tap area → navigates to `/meals/[id]`
- Floating "+" button → `/meals/new`

**`src/app/(app)/meals/new/page.tsx`**
- Client component form:
  - "Meal name" text field
  - Dynamic ingredient rows: name, quantity (number), unit (text) — "Add ingredient" button adds rows
  - "Save" button → calls `createMeal(...)` then `upsertIngredients(...)` → redirects to `/meals/[id]`
- Separate "Import from URL" link → `/meals/import`

**`src/app/(app)/meals/[id]/page.tsx`**
- Server component: fetch meal + ingredients
- Renders meal name (editable inline), source URL link, ingredient list
- "Edit" mode toggles the form to allow changes → "Save" calls `updateMeal(...)` + `upsertIngredients(...)`
- "Delete meal" button with confirmation dialog → `deleteMeal(id)` → redirect to `/meals`

**`src/components/meals/IngredientRow.tsx`**
- Reusable row component: name input, qty input, unit input, remove button

**`src/components/meals/MealCard.tsx`**
- Card UI used in the library grid

### Acceptance Criteria
- Create a meal with 3 ingredients → appears on `/meals`
- Edit the meal name and ingredients → changes persist on refresh
- Delete the meal → disappears from library and from any meal plan slots (on delete set null via DB)

---

## Phase 5 — Recipe Import

**Goal:** User pastes a recipe URL and gets title + ingredients pre-filled for review before saving.

### Files to create

**`src/app/api/import-recipe/route.ts`** (Route Handler)
```typescript
// POST { url: string }
// Returns { title: string, ingredients: { name, quantity, unit }[] }
```
- Parse with `@extractus/article-parser` (or `recipe-scraper` if it supports structured ingredients)
- Regex / heuristic to split ingredient strings into `{ name, quantity, unit }`
- On any exception: return `{ title: '', ingredients: [], error: 'parse_failed' }` with status 200 (not 500) so client can show partial results
- Set `Content-Security-Policy` headers — this route does server-side fetching, not exposed to CORS

**`src/app/(app)/meals/import/page.tsx`**
- Step 1: URL input field + "Fetch Recipe" button
  - On submit: POST to `/api/import-recipe`
  - Show loading spinner during fetch
- Step 2 (after response): Review form pre-filled with title + ingredient rows
  - User can edit any field, add/remove rows
  - "Save Meal" button → `createMeal(...)` + `upsertIngredients(...)` → redirect to `/meals/[id]`
- If `error: 'parse_failed'`, show a warning banner: "We couldn't fully parse this recipe — please fill in the details manually."

**`src/lib/utils/parseIngredients.ts`**
- Utility: takes a raw ingredient string like "2 cups flour" → `{ quantity: 2, unit: 'cups', name: 'flour' }`
- Use a small regex: `^(\d+[\d./]*)\s+(\w+)\s+(.+)$` with fallback to name-only

### Acceptance Criteria
- Paste an AllRecipes or similar URL → title and ingredient list appear pre-filled
- User can edit and save; meal appears in library with correct ingredients
- On an unparseable URL → form is blank but still usable (no crash, clear warning shown)

---

## Phase 6 — Meal Plan Grid + Realtime

**Goal:** The main screen shows a 7-day grid with meal slots. Tapping a slot opens a picker. All family members see live updates.

### Files to create

**`src/app/(app)/plan/page.tsx`**
- Client component (needs Realtime)
- Compute `weekStart` (most recent Monday) from `new Date()`
- Fetch `meal_plan_slots` for the week on mount
- Subscribe to Supabase Realtime channel `meal_plan_slots` filtered by `family_id`
- On INSERT/UPDATE/DELETE from Realtime: update local state
- Renders `<WeekGrid>` passing slots + meals
- "Generate Shopping List" button → calls `generateShoppingList(familyId, weekStart)` → redirects to `/shopping`

**`src/components/plan/WeekGrid.tsx`**
- 7-column CSS grid (scrollable horizontally on mobile)
- Header row: Mon–Sun with date labels
- 3 slot rows: Breakfast, Lunch, Dinner
- Each cell: `<SlotCell>`

**`src/components/plan/SlotCell.tsx`**
- Empty state: dashed border, "+" icon, tap → opens `<MealPickerModal>`
- Filled state: meal name, small remove "×" button
- Calls `upsertSlot(...)` on selection, `clearSlot(...)` on remove

**`src/components/plan/MealPickerModal.tsx`**
- Bottom sheet / modal (mobile-first)
- Search input to filter the family's meal library
- Scrollable list of meals → tap to select
- "Add new meal" option at bottom → navigates to `/meals/new`

**`src/app/(app)/plan/[date]/[slot]/page.tsx`**
- Alternative deep-link route for slot picking (used for PWA share targets / future deep links)
- Renders the same MealPickerModal in a full page context

**`src/lib/utils/weekDates.ts`**
- `getWeekStart(date: Date): Date` — returns the Monday of the given week
- `getWeekDays(weekStart: Date): Date[]` — returns array of 7 dates Mon–Sun

### Realtime Setup
```typescript
// Inside plan/page.tsx
const channel = supabase
  .channel('meal-plan-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'meal_plan_slots',
    filter: `family_id=eq.${familyId}`
  }, (payload) => {
    // merge payload.new into local slots state
  })
  .subscribe()
```

### Acceptance Criteria
- Grid renders 7 days × 3 slots (21 cells)
- Tap empty cell → pick a meal → cell shows meal name
- Open same app in two browser tabs → add meal in tab 1 → appears in tab 2 within 1–2 seconds
- Refresh page → slots persist (loaded from DB)

---

## Phase 7 — Shopping List

**Goal:** One-tap shopping list generation from the week's plan, with real-time checkbox sync.

### Files to create

**`src/lib/utils/generateShoppingList.ts`**
```typescript
// Input: meal_plan_slots[] with nested meals + ingredients
// Output: ShoppingItem[] = { name, quantity, unit, checked: false, source: mealName }

// Algorithm:
// 1. Collect all ingredients from all slotted meals
// 2. Group by normalized ingredient name (lowercase, trimmed)
// 3. Sum quantities within each group (handle null quantities gracefully)
// 4. Return sorted array
```

**`src/lib/supabase/queries/shoppingList.ts`** (expand from Phase 2)
- `generateAndSaveShoppingList(familyId, weekStart)`:
  1. Fetch all `meal_plan_slots` for the week with joined `meals` + `ingredients`
  2. Run `generateShoppingList(...)` util
  3. Upsert into `shopping_lists` table
  4. Return the saved list

**`src/app/(app)/shopping/page.tsx`**
- Client component (needs Realtime)
- Fetch `shopping_lists` for `(familyId, weekStart)` on mount
- Subscribe to Realtime on `shopping_lists` filtered by `family_id`
- On change: merge new `items` JSONB into local state (preserve local checkbox state for any items not in payload)
- Renders grouped list: unchecked items first, checked items with strikethrough at bottom

**`src/components/shopping/ShoppingItem.tsx`**
- Checkbox + ingredient name + quantity + unit
- On checkbox toggle: optimistic local update + debounced write to `shopping_lists.items`

**`src/components/shopping/AddItemRow.tsx`**
- Text input at bottom: type item name + "Add" → appends `{ name, checked: false, manual: true }` to JSONB

### Realtime Setup (same pattern as Phase 6)
```typescript
supabase.channel('shopping-list-changes')
  .on('postgres_changes', {
    event: '*', schema: 'public', table: 'shopping_lists',
    filter: `family_id=eq.${familyId}`
  }, (payload) => { /* update local items */ })
  .subscribe()
```

### Acceptance Criteria
- Plan 3 meals with overlapping ingredients (e.g., onion in two meals) → generate list → onion appears once with summed quantity
- Check off an item in tab 1 → checked state appears in tab 2 within 1–2 seconds
- Manually add an item → it persists on refresh
- Re-generating the list after adding a 4th meal merges new ingredients without losing checked state

---

## Phase 8 — Settings Page

**Goal:** Users can see family members, copy the invite link, rename the family, and update their own name.

### Files to create

**`src/app/(app)/settings/page.tsx`**
- Server component: fetch `family` + all `users` in family + current user
- Sections:
  1. **Family name** — editable text field + Save button (calls `updateFamily(id, name)`)
  2. **Invite link** — shows `https://makanje.vercel.app/join?code=XXXXXXXX` + "Copy" button (uses `navigator.clipboard.writeText`)
  3. **Family members** — list of member names/emails
  4. **Your profile** — editable display name + Save
  5. **Sign out** button (calls `signOut()` server action)

**`src/app/(app)/join/page.tsx`** *(bonus route)*
- Handles invite links: reads `code` from query param → pre-fills the onboarding join form → auto-submits if user is already signed in

**`src/components/settings/CopyLinkButton.tsx`**
- Client component: "Copy Invite Link" with clipboard API + brief "Copied!" feedback

### Acceptance Criteria
- Changing the family name persists on refresh
- Copying the invite link produces a valid URL
- Second user opens invite link → lands on onboarding join tab with code pre-filled

---

## Phase 9 — PWA Polish

**Goal:** App installs cleanly on iOS and Android, looks native, and has read-only offline support for the current week's plan.

### Steps

1. **Real icons:** Create 192×192 and 512×512 PNG icons (and maskable variants). Place in `public/icons/`. Update `manifest.json`.

2. **Offline caching with next-pwa:**

   Update `next.config.ts`:
   ```typescript
   const withPWA = require('next-pwa')({
     dest: 'public',
     runtimeCaching: [
       {
         urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/meal_plan_slots.*/,
         handler: 'StaleWhileRevalidate',
         options: { cacheName: 'meal-plan-cache', expiration: { maxAgeSeconds: 60 * 60 * 24 * 7 } }
       },
       {
         urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/meals.*/,
         handler: 'StaleWhileRevalidate',
         options: { cacheName: 'meals-cache' }
       }
     ]
   })
   ```

3. **iOS meta tags** in `src/app/layout.tsx`:
   ```html
   <meta name="apple-mobile-web-app-capable" content="yes" />
   <meta name="apple-mobile-web-app-status-bar-style" content="default" />
   <meta name="apple-mobile-web-app-title" content="MakanJe" />
   <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
   ```

4. **Offline banner:** `src/components/OfflineBanner.tsx` — listens to `window.online/offline` events; shows a subtle top bar "You're offline — viewing cached data" when offline.

5. **Splash screens:** Generate with a tool like `pwa-asset-generator` for iOS splash screens.

### Acceptance Criteria
- Chrome on Android shows "Add to home screen" prompt
- Safari on iOS: "Add to Home Screen" → app opens without browser chrome
- Airplane mode → `/plan` loads with last cached data
- Airplane mode → attempt to add a meal → graceful error shown (not a blank crash)

---

## Phase 10 — Production Deployment

**Goal:** App running at a stable URL with a production Supabase project and Vercel deployment.

### Steps

1. **Create Supabase production project** at app.supabase.com. Run all Phase 2 SQL migrations in the production SQL editor.

2. **Create Vercel project:**
   ```bash
   npx vercel --prod
   ```
   Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. **Configure Supabase Auth:**
   - In Supabase Auth settings → Site URL: `https://makanje.vercel.app`
   - Add redirect URL: `https://makanje.vercel.app/login`

4. **Configure Supabase Realtime:**
   - Enable Realtime on tables: `meal_plan_slots`, `shopping_lists`
   - (In Supabase dashboard → Database → Replication → tick the tables)

5. **Custom domain (optional):** Add via Vercel dashboard → Domains.

6. **Run verification checklist** (see section below).

---

## Full Verification Checklist

| Test | Steps | Expected Result |
|---|---|---|
| Auth end-to-end | Create Account A, create family "Smith Family". Create Account B, join via invite code. | Both accounts show `family_id` = same UUID in `users` table. |
| Realtime — plan | Open `/plan` in two tabs as the same user. Add a meal to Monday Dinner in tab 1. | Tab 2 updates within ~2 seconds, no page refresh. |
| Realtime — shopping | Open `/shopping` in two tabs. Check off an item in tab 1. | Checkbox state syncs to tab 2 within ~2 seconds. |
| Recipe import | Paste a real AllRecipes URL into `/meals/import`. | Title and at least 3 ingredients appear pre-filled. |
| Recipe import failure | Paste a non-recipe URL (e.g. google.com). | Warning banner shown, form fields blank but usable. |
| Shopping list deduplication | Add "chicken" (200g) to Monday Dinner and "chicken" (300g) to Tuesday Lunch. Generate list. | Single "chicken" row shows 500g. |
| Offline — read | Load `/plan` with network. Switch to airplane mode. Reload. | Page loads with cached meal plan data. |
| Offline — write | Airplane mode. Try adding a meal to a slot. | Error shown; no silent failure or crash. |
| PWA install — Android | Open app in Chrome on Android. | "Add to home screen" banner or install icon visible in address bar. |
| PWA install — iOS | Open in Safari on iOS. Tap Share → Add to Home Screen. | App installs; opens full-screen without Safari chrome. |

---

## Key Shared Components & Utilities Summary

| File | Purpose |
|---|---|
| `src/components/ui/Modal.tsx` | Reusable bottom sheet / center modal |
| `src/components/ui/Button.tsx` | Primary / secondary / destructive variants |
| `src/components/ui/Input.tsx` | Styled text input with label + error |
| `src/components/ui/Spinner.tsx` | Loading spinner |
| `src/components/layout/AppShell.tsx` | Persistent bottom nav (Plan, Meals, Shopping, Settings) |
| `src/lib/utils/weekDates.ts` | Week start/end date helpers |
| `src/lib/utils/parseIngredients.ts` | "2 cups flour" → `{ quantity, unit, name }` |
| `src/lib/utils/generateShoppingList.ts` | Aggregate + deduplicate ingredients |
| `src/hooks/useFamily.ts` | React hook: returns current user's family from context |
| `src/hooks/useRealtimeSlots.ts` | Hook: subscribes to meal_plan_slots changes |
| `src/hooks/useRealtimeShopping.ts` | Hook: subscribes to shopping_list changes |
| `src/context/AuthContext.tsx` | Auth session + user profile in React context |

---

## Estimated Effort (Solo Developer)

| Phase | Effort |
|---|---|
| 1 — Scaffold | 2–3 hours |
| 2 — Schema + RLS | 2–3 hours |
| 3 — Auth flow | 3–4 hours |
| 4 — Meal library | 4–5 hours |
| 5 — Recipe import | 3–4 hours |
| 6 — Plan grid + Realtime | 6–8 hours |
| 7 — Shopping list | 4–5 hours |
| 8 — Settings | 2–3 hours |
| 9 — PWA polish | 3–4 hours |
| 10 — Deployment | 2–3 hours |
| **Total** | **~31–42 hours** |
