# Phase 4 — Pantry

> **Start after Phase 1 is complete.**
> This window owns: `src/app/(app)/pantry/**`, `src/lib/supabase/queries/pantry.ts`, `src/hooks/useRealtimePantry.ts`

## Goal
Build the pantry page where a family tracks ingredients they already have at home. These are subtracted from the shopping list at generation time.

---

## Context

### DB Table (already exists from Phase 1 migration or base schema)
```sql
pantry_items (id, family_id, name, quantity, unit, updated_at)
```

If it doesn't exist yet, add to the migration:
```sql
CREATE TABLE pantry_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name       text NOT NULL,
  quantity   numeric,
  unit       text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family pantry" ON pantry_items
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));
```

### Types to add to `src/lib/supabase/types.ts`
```typescript
export interface PantryItem {
  id: string
  family_id: string
  name: string
  quantity: number | null
  unit: string | null
  updated_at: string
}
```

---

## Files to Create

### `src/lib/supabase/queries/pantry.ts`
```typescript
import { createClient } from '@/lib/supabase/client'
import type { PantryItem } from '@/lib/supabase/types'

export async function getPantryItems(familyId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('family_id', familyId)
    .order('name')
  if (error) throw error
  return data as PantryItem[]
}

export async function addPantryItem(familyId: string, name: string, quantity: number | null, unit: string | null) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pantry_items')
    .insert({ family_id: familyId, name, quantity, unit })
    .select()
    .single()
  if (error) throw error
  return data as PantryItem
}

export async function updatePantryItem(id: string, updates: Partial<Pick<PantryItem, 'name' | 'quantity' | 'unit'>>) {
  const supabase = createClient()
  const { error } = await supabase
    .from('pantry_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deletePantryItem(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('pantry_items').delete().eq('id', id)
  if (error) throw error
}
```

---

### `src/hooks/useRealtimePantry.ts`
Pattern mirrors `useRealtimeSlots.ts` — subscribe to pantry_items changes:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PantryItem } from '@/lib/supabase/types'

export function useRealtimePantry(familyId: string | null) {
  const [items, setItems] = useState<PantryItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!familyId) return

    // Initial fetch
    supabase
      .from('pantry_items')
      .select('*')
      .eq('family_id', familyId)
      .order('name')
      .then(({ data }) => {
        setItems(data ?? [])
        setLoading(false)
      })

    // Realtime subscription
    const channel = supabase
      .channel(`pantry:${familyId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pantry_items',
        filter: `family_id=eq.${familyId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setItems((prev) => [...prev, payload.new as PantryItem].sort((a, b) => a.name.localeCompare(b.name)))
        } else if (payload.eventType === 'UPDATE') {
          setItems((prev) => prev.map((i) => i.id === payload.new.id ? payload.new as PantryItem : i))
        } else if (payload.eventType === 'DELETE') {
          setItems((prev) => prev.filter((i) => i.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [familyId])

  return { items, loading }
}
```

---

### `src/app/(app)/pantry/page.tsx`
Main pantry page:

**UI structure:**
- Sticky header: "Pantry" title + item count
- List of pantry items — each row shows name, quantity + unit, delete button
- Inline edit: tap a row to edit quantity/unit
- "Add item" form at bottom: name + quantity + unit fields
- Empty state: "No pantry items. Add things you already have to skip them on your shopping list."

**Realtime:** use `useRealtimePantry(familyId)` — all family members see live updates.

**Style:** match the existing glass card / orange design system:
```tsx
// Each item row
<div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
  <div className="flex-1">
    <p className="font-semibold text-[#0F172A] dark:text-[#FED7AA] text-sm font-heading">{item.name}</p>
    {item.quantity && (
      <p className="text-xs text-slate-500 mt-0.5">{item.quantity} {item.unit}</p>
    )}
  </div>
  <button onClick={() => deletePantryItem(item.id)} className="text-red-400 hover:text-red-600 p-1">
    {/* trash icon */}
  </button>
</div>
```

---

## Nav — Add Pantry Tab to AppShell

Add a "Pantry" entry to the `NAV` array in `src/components/layout/AppShell.tsx`:

```tsx
{
  href: '/pantry',
  label: 'Pantry',
  activeColor: 'text-orange-600',
  icon: (active: boolean) => (
    <svg className={cn('h-[22px] w-[22px]', active ? 'text-orange-600' : 'text-[#B8836A]')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      {/* Storage/pantry icon: shelves */}
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18" />
    </svg>
  ),
},
```

Also add `/pantry` to the `BG_MAP` in AppShell:
```tsx
'/pantry': 'bg-plan',  // reuse or create a distinct bg if desired
```

---

## Shopping List Integration
After this phase, update `src/lib/utils/generateShoppingList.ts` to accept pantry items and subtract them.

This change should be coordinated with Phase 5 (shopping polish) which also touches that file. Either:
- Do it in Phase 5, OR
- Add the pantry subtraction logic here and note it in progress.md

Subtraction logic:
```typescript
// After building the ingredient map, subtract pantry items
for (const pantryItem of pantryItems) {
  const key = pantryItem.name.toLowerCase().trim()
  if (map.has(key)) {
    const item = map.get(key)!
    if (item.quantity != null && pantryItem.quantity != null) {
      item.quantity -= pantryItem.quantity
      if (item.quantity <= 0) map.delete(key)
    } else {
      map.delete(key) // have it, no qty tracking — remove entirely
    }
  }
}
```

The shopping list generation call in `/plan/page.tsx` also needs to fetch pantry_items and pass them in.

---

## Done When
- [ ] `/pantry` page loads with realtime pantry items
- [ ] Can add, edit, delete pantry items
- [ ] Two browser tabs: add item in one → appears in other without refresh
- [ ] Pantry tab visible in bottom nav
- [ ] TypeScript compiles cleanly
