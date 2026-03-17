# MakanJe — Parallel Execution Map

## Execution Order

```
[Phase 1 — Schema Migration]   ← ONE window, must finish first
         |
    ─────┼──────────────────
    |         |         |
[Phase 2]  [Phase 3]  [Phase 4]  ← THREE windows in parallel
Dishes     Meals as   Pantry
Library    Collections
    |              |
    └──────┬───────┘
       [Phase 5]                  ← After Phase 2 + 3 + 4
       Shopping Polish
           |
       [Phase 6]                  ← Final window
       Prod Deployment
```

## Window Assignment

| Window | File | Depends On | Touches |
|--------|------|------------|---------|
| 1 | `tasks/phase-1-schema-migration.md` | nothing | DB schema, types.ts, all queries |
| 2 | `tasks/phase-2-dishes-library.md` | Phase 1 done | New dishes/ pages + DishCard |
| 3 | `tasks/phase-3-meals-collections.md` | Phase 1 done | Existing meals/ pages + MealCard |
| 4 | `tasks/phase-4-pantry.md` | Phase 1 done | New pantry/ page + queries |
| 5 | `tasks/phase-5-shopping-polish.md` | Phases 1+4 done | shopping/ page + share route |
| 6 | `tasks/phase-6-deployment.md` | All done | Vercel/Supabase config only |

## File Ownership (no conflicts)

Each window owns these files exclusively:

**Phase 2 owns:**
- `src/app/(app)/dishes/**`
- `src/components/meals/DishCard.tsx`
- `src/lib/supabase/queries/dishes.ts`

**Phase 3 owns:**
- `src/app/(app)/meals/**`
- `src/components/meals/MealCard.tsx`
- `src/components/plan/MealPickerModal.tsx`

**Phase 4 owns:**
- `src/app/(app)/pantry/**`
- `src/lib/supabase/queries/pantry.ts`
- `src/hooks/useRealtimePantry.ts`

**Phase 5 owns:**
- `src/app/(app)/shopping/page.tsx`
- `src/app/shopping/share/[token]/page.tsx`
- `src/lib/utils/generateShoppingList.ts` (store sections only)
