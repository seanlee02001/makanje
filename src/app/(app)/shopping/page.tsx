'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeShopping } from '@/hooks/useRealtimeShopping'
import { ShoppingItemRow } from '@/components/shopping/ShoppingItem'
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
  const total = (list?.items ?? []).length
  const doneCount = checked.length
  const progress = total > 0 ? (doneCount / total) * 100 : 0

  if (profileLoading) return <div className="flex justify-center items-center h-40"><Spinner /></div>

  return (
    <div className="px-4 pt-4 pb-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 pt-2">
        <div>
          <h1 className="text-[22px] font-bold text-emerald-900 dark:text-emerald-100 font-heading">
            Shopping List
          </h1>
          <p className="text-sm text-emerald-700/70 dark:text-emerald-300/50 mt-0.5">
            Week of {formatDayLabel(getWeekStart(new Date()))}
          </p>
        </div>
        <button
          onClick={() => router.push('/plan')}
          className="glass rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-[#FED7AA] font-semibold font-heading"
        >
          ← Plan
        </button>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="mb-5">
          <div className="flex justify-between text-xs mb-1.5 font-heading font-semibold">
            <span className="text-[#059669] dark:text-emerald-400">
              {doneCount} / {total} done
            </span>
            <span className="text-emerald-700/60 dark:text-emerald-400/50">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #059669, #34D399)',
              }}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !list || list.items.length === 0 ? (
        <div className="text-center py-16 text-emerald-700/60 dark:text-emerald-400/50">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
            <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M16 10a4 4 0 01-8 0" />
            </svg>
          </div>
          <p className="font-semibold text-gray-900 dark:text-emerald-100 font-heading">
            No shopping list yet
          </p>
          <p className="text-sm mt-1">
            Go to your meal plan and tap &ldquo;Generate Shopping List&rdquo; to create one.
          </p>
          <button
            onClick={() => router.push('/plan')}
            className="mt-4 px-5 py-2.5 rounded-2xl text-white font-semibold text-sm font-heading"
            style={{ background: 'rgba(5,150,105,0.85)' }}
          >
            Go to plan
          </button>
        </div>
      ) : (
        <>
          {/* Unchecked */}
          {unchecked.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400/50 uppercase tracking-wide mb-2 px-1 font-heading">
                To buy · {unchecked.length}
              </p>
              <ul className="glass rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-white/10">
                {list.items.map((item, i) =>
                  !item.checked ? (
                    <ShoppingItemRow key={i} item={item} onToggle={() => toggleItem(i)} />
                  ) : null
                )}
              </ul>
            </div>
          )}

          {/* Checked */}
          {checked.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-bold text-gray-400 dark:text-emerald-400/30 uppercase tracking-wide mb-2 px-1 font-heading">
                Done · {checked.length}
              </p>
              <ul className="glass rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-white/10 opacity-70">
                {list.items.map((item, i) =>
                  item.checked ? (
                    <ShoppingItemRow key={i} item={item} onToggle={() => toggleItem(i)} />
                  ) : null
                )}
              </ul>
            </div>
          )}

          {/* Add item */}
          <form onSubmit={addItem} className="flex gap-2 mt-4">
            <input
              type="text"
              placeholder="Add an item…"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="flex-1 glass rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-emerald-100 placeholder-gray-400 dark:placeholder-emerald-400/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
            />
            <button
              type="submit"
              disabled={!newItemName.trim()}
              className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold font-heading disabled:opacity-50 transition-opacity"
              style={{ background: 'rgba(5,150,105,0.85)' }}
            >
              Add
            </button>
          </form>
        </>
      )}
    </div>
  )
}
