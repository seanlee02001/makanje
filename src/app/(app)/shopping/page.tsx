'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeShopping } from '@/hooks/useRealtimeShopping'
import { ShoppingItemRow } from '@/components/shopping/ShoppingItem'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { getWeekStart, formatDate, formatDayLabel } from '@/lib/utils/weekDates'
import type { ShoppingItem } from '@/lib/supabase/types'

export default function ShoppingPage() {
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [newItemName, setNewItemName] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const weekStart = formatDate(getWeekStart(new Date()))

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('users').select('family_id').eq('id', user.id).single()
      if (!profile?.family_id) { router.push('/onboarding'); return }
      setFamilyId(profile.family_id)
      setProfileLoading(false)
    }
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { list, loading, updateItems } = useRealtimeShopping(familyId, weekStart)

  async function toggleItem(index: number) {
    if (!list) return
    const updated = list.items.map((item, i) =>
      i === index ? { ...item, checked: !item.checked } : item
    )
    await updateItems(updated)
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newItemName.trim() || !list) return
    const newItem: ShoppingItem = {
      name: newItemName.trim(),
      quantity: null,
      unit: null,
      checked: false,
      manual: true,
    }
    await updateItems([...list.items, newItem])
    setNewItemName('')
  }

  const unchecked = list?.items.filter((i) => !i.checked) ?? []
  const checked = list?.items.filter((i) => i.checked) ?? []

  if (profileLoading) return <div className="flex justify-center items-center h-40"><Spinner /></div>

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Shopping List</h1>
          <p className="text-sm text-gray-500 mt-0.5">Week of {formatDayLabel(getWeekStart(new Date()))}</p>
        </div>
        <Button variant="secondary" onClick={() => router.push('/plan')} className="text-xs">
          ← Plan
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !list || list.items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🛒</div>
          <p className="font-medium text-gray-600">No shopping list yet</p>
          <p className="text-sm mt-1">Go to your meal plan and tap &ldquo;Shopping list&rdquo; to generate one.</p>
          <Button onClick={() => router.push('/plan')} variant="secondary" className="mt-4">
            Go to plan
          </Button>
        </div>
      ) : (
        <>
          {/* Unchecked items */}
          {unchecked.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                To buy · {unchecked.length}
              </p>
              <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
                {list.items.map((item, i) =>
                  !item.checked ? (
                    <ShoppingItemRow key={i} item={item} onToggle={() => toggleItem(i)} />
                  ) : null
                )}
              </ul>
            </div>
          )}

          {/* Checked items */}
          {checked.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide mb-2 px-1">
                Done · {checked.length}
              </p>
              <ul className="divide-y divide-gray-50 rounded-xl border border-gray-100 overflow-hidden opacity-70">
                {list.items.map((item, i) =>
                  item.checked ? (
                    <ShoppingItemRow key={i} item={item} onToggle={() => toggleItem(i)} />
                  ) : null
                )}
              </ul>
            </div>
          )}

          {/* Add manual item */}
          <form onSubmit={addItem} className="flex gap-2 mt-4">
            <input
              type="text"
              placeholder="Add an item…"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <Button type="submit" variant="secondary" disabled={!newItemName.trim()}>
              Add
            </Button>
          </form>
        </>
      )}
    </div>
  )
}
