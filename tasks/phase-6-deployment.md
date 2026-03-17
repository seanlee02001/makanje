# Phase 6 — Production Deployment

> **Start after all other phases are complete.**
> This window handles Vercel + Supabase prod setup only.

## Goal
Deploy MakanJe to production on Vercel + Supabase prod. Verify the full app works on real devices.

---

## Step 1 — Supabase Production Project

1. Create a new Supabase project at https://supabase.com (separate from dev)
2. In the SQL editor, run ALL migrations in order:
   - `supabase/migrations/001_dish_meal_split.sql`
   - Any pantry or share_token additions from phases 4 and 5
3. Verify all tables and RLS policies are in place:
   ```sql
   SELECT tablename FROM pg_tables WHERE schemaname = 'public';
   ```
4. Copy the prod project's:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Step 2 — Vercel Project

1. Push all code to GitHub main branch
2. Import the repo in Vercel dashboard (vercel.com/new)
3. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` — prod Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — prod Supabase anon key
4. Deploy → copy the production URL (e.g. `makanje.vercel.app`)

---

## Step 3 — Update Supabase Auth Settings

In Supabase dashboard → Authentication → URL Configuration:
- **Site URL:** `https://makanje.vercel.app` (your prod domain)
- **Redirect URLs:** add `https://makanje.vercel.app/**`

Without this, email auth redirects will fail on prod.

---

## Step 4 — PWA Verification

On iPhone:
1. Open prod URL in Safari
2. Share → Add to Home Screen
3. Launch from home screen
4. Verify: app opens in standalone mode, no Safari chrome
5. Test offline: turn off wifi → current week plan should still show

On Android:
1. Open in Chrome
2. Install prompt should appear (or use ⋮ → Add to Home Screen)
3. Launch and verify standalone mode

---

## Step 5 — Run Verification Checklist (from CLAUDE.md)

- [ ] **Auth:** Two accounts join the same family via invite code → both see shared data
- [ ] **Realtime:** Two tabs open → assign meal in one → other updates without refresh
- [ ] **Recipe import:** Paste a recipe URL → title + ingredients extracted correctly
- [ ] **Shopping list:** Plan 3 meals with overlapping ingredients → generate → confirm deduplication → check off items in both tabs → verify sync
- [ ] **Pantry subtraction:** Add an ingredient to pantry → regenerate shopping list → ingredient absent or reduced
- [ ] **Share link:** Generate share link → open in incognito → list visible without login
- [ ] **Store sections:** Shopping list grouped by aisle
- [ ] **PWA:** Install on iPhone and Android → layout and usability confirmed

---

## Step 6 — Custom Domain (optional)

If using a custom domain:
1. Vercel dashboard → Domains → Add domain
2. Update DNS at your registrar
3. Update Supabase Site URL + Redirect URLs to the custom domain

---

## Done When
- [ ] App live on prod Vercel URL
- [ ] All verification checklist items pass
- [ ] PWA installs correctly on mobile
- [ ] No console errors in prod build
