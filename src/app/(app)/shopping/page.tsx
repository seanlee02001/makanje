'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeShopping } from '@/hooks/useRealtimeShopping'
import { ShoppingItemRow } from '@/components/shopping/ShoppingItem'
import { Spinner } from '@/components/ui/Spinner'
import { getWeekStart, formatDate } from '@/lib/utils/weekDates'
import { SECTION_ORDER } from '@/lib/utils/generateShoppingList'
import type { ShoppingItem } from '@/lib/supabase/types'

const SECTION_EMOJI: Record<string, string> = {
  Produce: '🥬', Meat: '🥩', Seafood: '🐟', Dairy: '🧀',
  Bakery: '🍞', Pantry: '🫙', Frozen: '🧊', Other: '📦',
}

export default function ShoppingPage() {
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [newItemName, setNewItemName] = useState('')
  const [toastMsg, setToastMsg] = useState('')
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

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 2500)
  }

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
      name: newItemName.trim(), quantity: null, unit: null, checked: false, manual: true,
    }
    await updateItems([...list.items, newItem])
    setNewItemName('')
  }

  async function handleShare() {
    if (!list?.share_token) return
    const shareUrl = `${window.location.origin}/shopping/share/${list.share_token}`
    if (navigator.share) {
      await navigator.share({ title: 'Shopping List', url: shareUrl })
    } else {
      await navigator.clipboard.writeText(shareUrl)
      showToast('Link copied!')
    }
  }

  const items = list?.items ?? []
  const total = items.length
  const doneCount = items.filter((i) => i.checked).length
  const unchecked = items.filter((i) => !i.checked)
  const checked = items.filter((i) => i.checked)

  const grouped = SECTION_ORDER.reduce((acc, section) => {
    const sectionItems = unchecked.filter((i) => (i.store_section ?? 'Other') === section)
    if (sectionItems.length > 0) acc[section] = sectionItems
    return acc
  }, {} as Record<string, ShoppingItem[]>)

  if (profileLoading) return <div className="flex justify-center items-center h-40"><Spinner /></div>

  return (
    <div className="px-5 pt-6 pb-6 max-w-lg mx-auto">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-pill px-4 py-2 text-sm font-semibold text-white" style={{ background: 'var(--success)' }}>
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-[28px] font-bold tracking-[-0.5px]" style={{ color: 'var(--text-primary)' }}>
          Shopping
        </h1>
        {list?.share_token && (
          <button
            onClick={handleShare}
            className="rounded-pill px-3 py-1.5 text-xs font-semibold"
            style={{ color: 'var(--accent)', border: '1px solid var(--accent)' }}
          >
            Share ↗
          </button>
        )}
      </div>
      <p className="text-[13px] mb-5" style={{ color: 'var(--text-tertiary)' }}>
        {total} item{total !== 1 ? 's' : ''} · Week of {getWeekStart(new Date()).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}
      </p>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !list || items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🛒</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No shopping list yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Go to your meal plan and tap &ldquo;Generate Shopping List&rdquo; to create one.
          </p>
          <button
            onClick={() => router.push('/plan')}
            className="mt-4 px-5 py-2.5 rounded-pill text-white font-semibold text-sm"
            style={{ background: 'var(--accent)' }}
          >
            Go to plan
          </button>
        </div>
      ) : (
        <>
          {/* Aisle groups */}
          {Object.entries(grouped).map(([section, sectionItems]) => (
            <div key={section} className="mb-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.8px] mb-2 mt-4 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <span>{SECTION_EMOJI[section] ?? '📦'}</span>
                {section} · {sectionItems.length}
              </p>
              <ul className="rounded-[12px] overflow-hidden divide-y" style={{ background: 'var(--surface)', borderColor: 'var(--divider)' }}>
                {sectionItems.map((item) => {
                  const globalIndex = items.indexOf(item)
                  return (
                    <ShoppingItemRow key={globalIndex} item={item} onToggle={() => toggleItem(globalIndex)} />
                  )
                })}
              </ul>
            </div>
          ))}

          {/* Checked */}
          {checked.length > 0 && (
            <div className="mb-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.8px] mb-2 mt-4" style={{ color: 'var(--text-tertiary)' }}>
                Done · {checked.length}
              </p>
              <ul className="rounded-[12px] overflow-hidden divide-y opacity-60" style={{ background: 'var(--surface)', borderColor: 'var(--divider)' }}>
                {checked.map((item) => {
                  const globalIndex = items.indexOf(item)
                  return (
                    <ShoppingItemRow key={globalIndex} item={item} onToggle={() => toggleItem(globalIndex)} />
                  )
                })}
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
              className="flex-1 rounded-[10px] px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
              style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}
            />
            <button
              type="submit"
              disabled={!newItemName.trim()}
              className="px-4 py-2.5 rounded-pill text-white text-sm font-semibold disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              Add
            </button>
          </form>
        </>
      )}
    </div>
  )
}
