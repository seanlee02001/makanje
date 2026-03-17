# Phase 5 — Shopping List Polish

> **Start after Phases 1, 2, 3, and 4 are complete.**
> This window owns: `src/app/(app)/shopping/page.tsx`, `src/app/shopping/share/[token]/page.tsx`, `src/lib/utils/generateShoppingList.ts`

## Goal
Polish the shopping list with store sections (aisle grouping) and add an external share link so the shopper can view the list without logging in.

---

## Part A — Store Sections

### What
Each shopping item gets a `store_section` field (e.g. "Produce", "Dairy", "Meat", "Pantry", "Frozen", "Bakery", "Other"). Items are grouped by section in the UI for faster shopping.

### Step 1 — Assign sections in `generateShoppingList.ts`

Add a helper that maps ingredient name keywords to sections:

```typescript
const SECTION_MAP: Record<string, string> = {
  // Produce
  tomato: 'Produce', lettuce: 'Produce', spinach: 'Produce', onion: 'Produce',
  garlic: 'Produce', carrot: 'Produce', potato: 'Produce', broccoli: 'Produce',
  apple: 'Produce', banana: 'Produce', lemon: 'Produce', lime: 'Produce',
  cucumber: 'Produce', pepper: 'Produce', mushroom: 'Produce', avocado: 'Produce',
  // Meat & Seafood
  chicken: 'Meat', beef: 'Meat', pork: 'Meat', lamb: 'Meat', fish: 'Seafood',
  salmon: 'Seafood', tuna: 'Seafood', prawn: 'Seafood', shrimp: 'Seafood',
  // Dairy
  milk: 'Dairy', cheese: 'Dairy', butter: 'Dairy', cream: 'Dairy', yogurt: 'Dairy',
  egg: 'Dairy', eggs: 'Dairy',
  // Pantry (dry goods)
  rice: 'Pantry', pasta: 'Pantry', flour: 'Pantry', sugar: 'Pantry', salt: 'Pantry',
  oil: 'Pantry', vinegar: 'Pantry', sauce: 'Pantry', soy: 'Pantry', stock: 'Pantry',
  canned: 'Pantry', beans: 'Pantry', lentils: 'Pantry', noodle: 'Pantry',
  // Bakery
  bread: 'Bakery', bun: 'Bakery', wrap: 'Bakery', tortilla: 'Bakery',
  // Frozen
  frozen: 'Frozen', ice: 'Frozen',
}

const SECTION_ORDER = ['Produce', 'Meat', 'Seafood', 'Dairy', 'Bakery', 'Pantry', 'Frozen', 'Other']

function getSection(name: string): string {
  const lower = name.toLowerCase()
  for (const [keyword, section] of Object.entries(SECTION_MAP)) {
    if (lower.includes(keyword)) return section
  }
  return 'Other'
}
```

In `generateShoppingList`, assign section when creating each item:
```typescript
map.set(key, {
  name: ing.name,
  quantity: ing.quantity,
  unit: ing.unit,
  checked: false,
  store_section: getSection(ing.name),  // ← add this
})
```

### Step 2 — Group by section in `shopping/page.tsx`

Replace the flat list with grouped sections:

```typescript
// Group items by store_section
const grouped = SECTION_ORDER.reduce((acc, section) => {
  const sectionItems = items.filter((i) => (i.store_section ?? 'Other') === section)
  if (sectionItems.length > 0) acc[section] = sectionItems
  return acc
}, {} as Record<string, ShoppingItem[]>)
```

Render each section with a section header:
```tsx
{Object.entries(grouped).map(([section, sectionItems]) => (
  <div key={section}>
    <p className="text-[11px] font-bold uppercase tracking-widest text-orange-600 mb-2 mt-4">{section}</p>
    <div className="flex flex-col gap-2">
      {sectionItems.map((item) => (
        <ShoppingItem key={item.name} item={item} onToggle={...} />
      ))}
    </div>
  </div>
))}
```

---

## Part B — Share Link

### What
Generate a `share_token` UUID on the shopping list row. Anyone with the link can view the list (read-only, no auth required). The shopper can check off items too (optimistic, Supabase upsert).

### Step 1 — Add `share_token` to DB

Add to the Supabase migration (or run in SQL editor):
```sql
ALTER TABLE shopping_lists ADD COLUMN IF NOT EXISTS share_token uuid DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS shopping_lists_share_token_idx ON shopping_lists(share_token);
```

Also add a public read policy for share token access:
```sql
CREATE POLICY "public share read" ON shopping_lists
  FOR SELECT USING (share_token IS NOT NULL);
```

### Step 2 — Update `ShoppingList` type in `types.ts`
```typescript
export interface ShoppingList {
  id: string
  family_id: string
  week_start_date: string
  items: ShoppingItem[]
  share_token: string | null  // ← add
}
```

### Step 3 — Share CTA in `shopping/page.tsx`

Add a share button in the page header:
```tsx
async function handleShare() {
  const shareUrl = `${window.location.origin}/shopping/share/${shoppingList.share_token}`
  if (navigator.share) {
    await navigator.share({ title: 'Shopping List', url: shareUrl })
  } else {
    await navigator.clipboard.writeText(shareUrl)
    // show toast: "Link copied!"
  }
}
```

Also add a WhatsApp deep link:
```tsx
const waUrl = `https://wa.me/?text=${encodeURIComponent(`Shopping list: ${shareUrl}`)}`
```

### Step 4 — Create `src/app/shopping/share/[token]/page.tsx`

This is a **public Server Component** — no auth required.

```tsx
import { createClient } from '@supabase/supabase-js'

// Server-side Supabase with anon key (public access)
async function getShoppingListByToken(token: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('share_token', token)
    .single()
  return data
}

export default async function SharePage({ params }: { params: { token: string } }) {
  const list = await getShoppingListByToken(params.token)

  if (!list) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh p-8">
        <p className="text-slate-500">This shopping list is not available.</p>
      </div>
    )
  }

  // Render read-only list grouped by store_section
  // No AppShell nav — standalone page
  return (
    <div className="max-w-md mx-auto p-4 pb-16">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-[#0F172A]">Shopping List</h1>
        <p className="text-sm text-slate-500 mt-1">Week of {list.week_start_date}</p>
      </div>
      {/* Render grouped items — read-only checkboxes */}
    </div>
  )
}
```

Note: this page is outside the `(app)` route group — place it at `src/app/shopping/share/[token]/page.tsx` so it doesn't use the authenticated layout.

---

## Part C — Pantry Subtraction Integration

Coordinate with Phase 4. If Phase 4 already added pantry subtraction to `generateShoppingList`, skip this. If not, add it here.

The plan page `handleGenerateShoppingList` function also needs to:
1. Fetch `pantry_items` for the family
2. Pass them to `generateShoppingList(slots, pantryItems)`

---

## Done When
- [ ] Shopping list items grouped by store section (Produce, Meat, Dairy, etc.)
- [ ] Share button on shopping page copies/shares a URL
- [ ] `/shopping/share/[token]` loads without login, shows the list
- [ ] WhatsApp share link works
- [ ] Pantry items subtracted from generated shopping list
- [ ] TypeScript compiles cleanly
