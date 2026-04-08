# MakanJe Revamp — Design Spec

**Date:** 2026-04-08
**Status:** Draft — pending approval

---

## 1. Overview

Full UI/UX revamp of MakanJe, a family meal planning PWA. The redesign shifts from the current orange-themed functional UI to a clean, modern, content-first design inspired by Notion's clarity and Apple's UX polish.

**Key changes:**
- Today-first home screen (was: week grid)
- Notion + Apple design language (was: orange gradient + glass-morphism)
- Full step-by-step cooking mode (new)
- Simplified data model — slots hold dishes directly, no meal wrapper (was: meals as named collections)
- Aisle-grouped shopping with real-time collab and share link (was: flat checklist)
- Dish tags for filtering during planning (new)

---

## 2. Design System

### 2.1 Visual Foundation

| Token | Value | Notes |
|-------|-------|-------|
| Canvas | `#ffffff` | Primary background |
| Surface | `#f5f5f7` | Cards, stat blocks, inputs — Apple's signature off-white |
| Text Primary | `#1d1d1f` | Near-black, warm |
| Text Secondary | `rgba(0,0,0,0.48)` | Muted labels, metadata |
| Text Tertiary | `rgba(0,0,0,0.24)` | Placeholders, disabled |
| Accent | `#0071e3` | Apple Blue — links, CTAs, active nav |
| Border | `1px solid rgba(0,0,0,0.08)` | Whisper-thin, Notion-style |
| Divider | `1px solid rgba(0,0,0,0.04)` | Even lighter, for list rows |
| Breakfast | `#F59E0B` | Amber — timeline dot, indicator |
| Lunch | `#10B981` | Green — timeline dot, indicator |
| Dinner | `#8B5CF6` | Purple — timeline dot, indicator |
| Success | `#10B981` | Checked items |
| Error | `#EF4444` | Validation, destructive actions |

### 2.1b Dark Mode

System-preference-aware dark mode. Follows `prefers-color-scheme: dark` by default, with manual toggle in Settings.

| Token | Light | Dark | Notes |
|-------|-------|------|-------|
| Canvas | `#ffffff` | `#000000` | Pure black for OLED efficiency (Apple-style) |
| Surface | `#f5f5f7` | `#1c1c1e` | Cards, stat blocks, inputs |
| Surface Elevated | `#ffffff` | `#2c2c2e` | Modals, sheets, elevated cards |
| Text Primary | `#1d1d1f` | `#f5f5f7` | |
| Text Secondary | `rgba(0,0,0,0.48)` | `rgba(255,255,255,0.48)` | |
| Text Tertiary | `rgba(0,0,0,0.24)` | `rgba(255,255,255,0.24)` | |
| Accent | `#0071e3` | `#2997ff` | Brighter blue on dark bg (Apple pattern) |
| Border | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.08)` | |
| Divider | `rgba(0,0,0,0.04)` | `rgba(255,255,255,0.04)` | |
| Breakfast | `#F59E0B` | `#F59E0B` | Same across modes |
| Lunch | `#10B981` | `#10B981` | Same across modes |
| Dinner | `#8B5CF6` | `#8B5CF6` | Same across modes |
| Nav Glass | `rgba(255,255,255,0.72)` | `rgba(0,0,0,0.72)` | Blur backdrop |
| Nav Border | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.06)` | |

**Implementation:** CSS custom properties with `@media (prefers-color-scheme: dark)` override. Manual toggle stores preference in `localStorage` and applies a `data-theme="dark"` attribute on `<html>`.

**Cooking mode** stays dark regardless of system theme — it's always dark by design.

### 2.2 Typography

**Font:** Inter (Google Fonts) — 400/500/600/700 weights.

| Role | Size | Weight | Tracking | Use |
|------|------|--------|----------|-----|
| Page Title | 28px | 700 | -0.5px | "Dishes", "Shopping", "Pantry" |
| Section Title | 15-17px | 700 | -0.2px | "Tuesday, 8 April", "This Week" |
| Body | 14-15px | 500-600 | normal | Dish names, item names |
| Caption | 11-12px | 500-600 | 0.2-0.8px | Slot labels, group headers, metadata |
| Micro | 10px | 600 | 0.5px | Badges, pill labels |

### 2.3 Components

**Border Radius Scale:**
- 6px: small buttons, inputs
- 8px: cards, dish pills in timeline
- 10px: search inputs, larger cards
- 12px: stat blocks, modals
- 16px: cooking mode step card
- 980px: pill CTAs, tag filters (Apple signature)
- 50%: avatars, dots, circular buttons

**Shadows:**
- Cards: `rgba(0,0,0,0.22) 3px 5px 30px 0px` (Apple — used sparingly)
- Most surfaces: no shadow, rely on background color contrast

**Bottom Navigation:**
- Glass effect: `rgba(255,255,255,0.72)` + `backdrop-filter: blur(20px)`
- Border top: `1px solid rgba(0,0,0,0.06)`
- 5 tabs: Today, Dishes, Shop, Pantry, More
- Active: Apple Blue `#0071e3`, inactive: `rgba(0,0,0,0.36)`
- Safe area padding for notched devices

**Buttons:**
- Primary: Apple Blue `#0071e3`, white text, 980px radius (pill)
- Secondary: `#f5f5f7` background, `#1d1d1f` text
- Ghost: transparent, Apple Blue text
- Destructive: `#EF4444` background, white text

---

## 3. Screens

### 3.1 Today (Home) — `/plan`

The landing screen. Shows what's happening today with at-a-glance stats.

**Layout (top to bottom):**
1. **Header:** "MakanJe" wordmark left, search icon + avatar right
2. **Stat row:** 3 cards on `#f5f5f7` — "meals today", "days planned", "to buy"
3. **Today section:** Date heading + vertical timeline
   - Each slot has a colored dot (amber/green/purple)
   - Single dish: name + subtitle (ingredients summary)
   - Multi-dish: each dish in its own `#f5f5f7` pill card with bullet + prep time
   - Dish count summary below multi-dish slots
4. **Cook CTA:** Blue pill button — "Start cooking [next meal slot]"
   - Contextual: shows the next upcoming uncooked slot
   - Multi-dish: tapping opens a dish picker, then cooking mode
5. **This Week preview:** Section heading + stacked day rows
   - Each row: day abbreviation, dish names joined by `·`, fill dots
   - "Not planned" in tertiary color for empty days
   - Tapping a row opens that day in the week view

### 3.2 Week View — `/plan/week`

Full week planning view. Stacked list layout (not grid).

**Layout:**
1. **Header:** "‹ Today" back link, "This Week" title, prev/next week arrows
2. **Week range:** "7 – 13 April 2026" subtitle
3. **Day blocks** (one per day, scrollable):
   - Day header: full name + date + "Today" badge if applicable
   - 3 meal rows per day (Breakfast, Lunch, Dinner)
   - Each row: colored dot + slot label + dish content
   - Single dish: inline text
   - Multi-dish: bulleted sub-items with dish count
   - Empty slots: "Not planned" + blue "+ Add" link
4. **Tapping a dish** opens dish detail
5. **Tapping "+ Add"** opens dish picker modal for that slot

### 3.3 Dish Picker Modal

Full-screen modal for assigning dishes to a slot. Opened from week view or today view.

**Layout:**
1. **Header:** "Pick dishes" title, "Done" button, close X
2. **Search bar:** `#f5f5f7` background, magnifying glass icon
3. **Tag filter row:** Horizontal scrollable pills (All, Quick, Malaysian, Italian, Vegetarian, Kid-friendly)
4. **Dish list:** Each row shows emoji icon + name + ingredient count + prep time + tags
5. **Multi-select:** Tap to toggle selection (checkmark appears). Can pick 1+ dishes per slot.
6. **Bottom bar:** Shows selected count, "Add to [slot]" primary button

### 3.4 Dishes Library — `/dishes`

Browse and manage all family recipes.

**Layout:**
1. **Header:** "Dishes" page title (28px bold), blue "+" circular button
2. **Search bar:** `#f5f5f7` rounded input
3. **Tag filter row:** Horizontal scrollable pills, "All" active by default
4. **Dish list:** Each item shows:
   - Emoji icon (40px, rounded square on `#f5f5f7`)
   - Dish name (15px, 600 weight)
   - Metadata: "6 ingredients · 30 min"
   - Tags as small pills (10px, `rgba(0,0,0,0.04)` bg)
   - Chevron arrow right
5. **Tapping a dish** opens dish detail

**Add dish options** (from "+" button):
- Add manually
- Import from URL

### 3.5 Dish Detail — `/dishes/[id]`

Full recipe view with ingredients and step-by-step instructions.

**Layout:**
1. **Header:** Back arrow, dish name, edit/delete actions
2. **Dish info:** Emoji, name (24px bold), tags as pills, prep time, servings
3. **Ingredients section:** Grouped list with quantities and units
4. **Instructions section:** Numbered step list
   - Each step is a text block
   - "Start cooking" blue pill CTA at bottom opens cooking mode
5. **Edit mode:** Inline editing of name, ingredients (add/remove/edit), instructions (add/remove/reorder), tags

### 3.6 Cooking Mode — launched from dish detail or "Start cooking" CTA

Dark, immersive, full-screen overlay. Screen stays awake (Wake Lock API).

**Layout:**
1. **Header:** "✕ Close" left, "Step X of Y" right
2. **Dish hero:** Emoji + dish name (24px bold white) + "45 min · 4 servings"
3. **Step card:** Dark surface `#2a2a2d`, 16px radius
   - Step number label in Apple Blue, uppercase
   - Step text: 18px, 500 weight, white, generous line height (1.5)
4. **Step navigation:** "← Prev" ghost pill, dot indicators, "Next →" blue pill
5. **Swipe gesture:** Left/right to navigate steps (in addition to buttons)

### 3.7 Shopping List — `/shopping`

Auto-generated from the week's meal plan. Real-time collaborative.

**Layout:**
1. **Header:** "Shopping" page title, "Share ↗" pill button (Apple Blue outline)
2. **Subtitle:** "12 items · Week of 7 April"
3. **Aisle groups** (each section):
   - Group header: emoji icon + uppercase label (PRODUCE, MEAT & PROTEIN, PANTRY, DAIRY & COLD)
   - Item rows: circular checkbox + item name + quantity right-aligned
   - Checked items: green checkbox with checkmark, strikethrough name, dimmed
4. **Add item:** Text input at bottom of each group or floating "+" button
5. **Share flow:** Tapping "Share" generates a public URL, shows share sheet (copy link, WhatsApp, SMS)

**Generation logic:**
- Walks `meal_plan_slots → slot_dishes → dishes → ingredients` for the current week
- Deduplicates by ingredient name (merges quantities)
- Subtracts matching pantry items
- Auto-assigns store section (produce/dairy/pantry/meat) per ingredient
- Stores result in `shopping_lists.items` JSONB

**Real-time:**
- Supabase Realtime subscription on `shopping_lists`
- Both family members see live checkbox updates
- Last-write-wins conflict resolution

**Share link:**
- `shopping_lists` row gets a `share_token` UUID
- Public page at `/shopping/share/[token]` — no auth required
- Server-rendered, read-only view with same aisle grouping

### 3.8 Pantry — `/pantry`

What the family already has. Auto-subtracted from shopping list generation.

**Layout:**
1. **Header:** "Pantry" page title, blue "+" circular button
2. **Subtitle:** "14 items in stock"
3. **Category groups:**
   - Group header: uppercase label (ESSENTIALS, SAUCES & CONDIMENTS, DRY GOODS)
   - Item rows: emoji icon (36px, `#f5f5f7` rounded square) + name + quantity + `−`/`+` buttons
4. **Add item:** Manual entry with name, quantity, unit, category
5. **"Move to pantry"** action on checked shopping list items

**Real-time:** Supabase Realtime subscription, shared across family.

### 3.9 Settings — `/settings` (via "More" tab)

**Layout:**
1. **Header:** "Settings" page title
2. **Family section:** Family name, invite code (tap to copy), member list
3. **Profile section:** Name, email (read-only)
4. **App section:** About, version
5. **Sign out** button (destructive style)

---

## 4. Data Model Changes

### 4.1 Simplified Schema (no meal wrapper)

Remove the `meals` and `meal_dishes` tables. Slots link directly to dishes.

**New tables/changes:**

```sql
-- Rename: meal_plan_slots now links to dishes directly via a join table
slot_dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID REFERENCES meal_plan_slots(id) ON DELETE CASCADE,
  dish_id UUID REFERENCES dishes(id) ON DELETE CASCADE,
  sort_order INT DEFAULT 0
)

-- Add to dishes table:
ALTER TABLE dishes ADD COLUMN tags TEXT[] DEFAULT '{}';
ALTER TABLE dishes ADD COLUMN prep_time_min INT;
ALTER TABLE dishes ADD COLUMN servings INT;
ALTER TABLE dishes ADD COLUMN instructions JSONB DEFAULT '[]';
-- instructions format: [{"step": 1, "text": "Boil water..."}, ...]

-- Add to ingredients table:
ALTER TABLE ingredients ADD COLUMN store_section TEXT;
-- Values: 'produce', 'meat', 'dairy', 'pantry', 'frozen', 'bakery', 'other'

-- Add to shopping_lists table:
ALTER TABLE shopping_lists ADD COLUMN share_token UUID DEFAULT gen_random_uuid();

-- Remove meal_id from meal_plan_slots (no longer needed):
ALTER TABLE meal_plan_slots DROP COLUMN meal_id;

-- Drop (after migration):
DROP TABLE meal_dishes;
DROP TABLE meals;
```

### 4.2 Updated Aggregation Path

```
Shopping list generation:
  meal_plan_slots → slot_dishes → dishes → ingredients
  → deduplicate by name → merge quantities
  → subtract pantry_items
  → assign store_section
  → store in shopping_lists.items JSONB
```

### 4.3 RLS Policies

All new tables follow the same pattern: scoped to `family_id`. Users only see their own family's data. The `slot_dishes` table inherits family scope through its `slot_id` → `meal_plan_slots.family_id` join.

The `share_token` on `shopping_lists` enables a public read-only policy: `SELECT` allowed when `share_token` matches, no auth required.

---

## 5. New Features

### 5.1 Dish Tags

- Tags stored as `TEXT[]` on the `dishes` table
- Predefined suggestions: Quick, Malaysian, Italian, Chinese, Vegetarian, Kid-friendly, Comfort food, Healthy, Spicy
- Custom tags allowed (free text entry)
- Tag filter on dishes library page (horizontal pill bar)
- Tag filter in dish picker modal (when assigning dishes to slots)

### 5.2 Cooking Mode

- Full-screen dark overlay, launched from dish detail or "Start cooking" CTA
- Wake Lock API to keep screen on
- Step-by-step card navigation (swipe or buttons)
- Progress dots showing current step
- Close button returns to previous screen

### 5.3 Recipe Instructions

- Stored as JSONB array on `dishes` table
- Each step: `{ step: number, text: string }`
- Editable in dish detail (add/remove/reorder steps)
- Recipe import scraper updated to extract instructions (not just ingredients)

### 5.4 Shopping List Enhancements

- **Aisle grouping:** Items grouped by `store_section` with emoji headers
- **Auto-section assignment:** Based on ingredient name heuristics during generation
- **Real-time collab:** Both family members see live checkbox state
- **Share link:** Public read-only page via `share_token`, share sheet (clipboard, WhatsApp, SMS)
- **Manual add:** One-off items not tied to a dish (e.g. "toilet paper")

### 5.5 Pantry Subtraction

- Pantry items auto-subtracted during shopping list generation
- "Move to pantry" action on checked shopping list items
- Real-time sync across family members

---

## 6. Navigation Structure

```
Bottom Nav (5 tabs):
├── Today (/plan)              — Home screen, today's timeline + stats
├── Dishes (/dishes)           — Dish library, search, tag filter
├── Shop (/shopping)           — Auto-generated shopping list
├── Pantry (/pantry)           — Family inventory
└── More (/settings)           — Settings, family, profile

Sub-routes:
├── /plan/week                 — Full week stacked list view
├── /dishes/new                — Add dish manually
├── /dishes/import             — Import from URL
├── /dishes/[id]               — Dish detail + recipe
├── /shopping/share/[token]    — Public shared shopping list
└── /login, /onboarding        — Auth flow (unchanged)
```

---

## 7. Auth & Onboarding

No changes to the auth flow. Email/password via Supabase. Family create/join via invite code. The login and onboarding screens will be restyled to match the new design system (white canvas, Inter font, Apple Blue CTA) but the flow is identical.

---

## 8. PWA

- Same PWA setup (next-pwa, manifest, service worker)
- Updated theme color to `#ffffff` (was orange)
- Updated icons to match new brand (clean, minimal mark — TBD)
- Offline: read-only cache of current week's plan (unchanged)

---

## 9. Out of Scope

These features are explicitly NOT included in this revamp:

- AI meal suggestions / "surprise me"
- Meal ratings (thumbs up/down)
- Dish photos
- Pantry-based suggestions ("what can I make?")
- Copy last week
- ~~Dark mode~~ (moved to in-scope — see Section 2.1)
- Push notifications
- Multi-store routing
- Nutritional data
- Calendar integration

---

## 10. Mockup Reference

All mockups are saved in `.superpowers/brainstorm/` and screenshots in `screenshots/`:

- `screenshots/screen-1-today.png` — Today (home) screen
- `screenshots/screen-2-week.png` — Week grid (original, replaced by stacked list)
- `screenshots/screen-3-dishes.png` — Dishes library
- `screenshots/screen-4-shopping.png` — Shopping list
- `screenshots/screen-5-cooking.png` — Cooking mode
- `screenshots/screen-6-pantry.png` — Pantry
- `screenshots/week-a-list.png` — Week stacked list (chosen)
- `screenshots/multi-dish-today.png` — Multi-dish on today view
- `screenshots/multi-dish-week.png` — Multi-dish on week view
