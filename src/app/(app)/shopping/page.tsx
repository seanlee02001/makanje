'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeShopping } from '@/hooks/useRealtimeShopping'
import { ShoppingItemRow } from '@/components/shopping/ShoppingItem'
import { Spinner } from '@/components/ui/Spinner'
import { getWeekStart, formatDate, formatDayLabel } from '@/lib/utils/weekDates'
import { SECTION_ORDER } from '@/lib/utils/generateShoppingList'
import type { ShoppingItem } from '@/lib/supabase/types'

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
      name: newItemName.trim(),
      quantity: null,
      unit: null,
      checked: false,
      manual: true,
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
  const progress = total > 0 ? (doneCount / total) * 100 : 0

  // Group unchecked items by store section
  const unchecked = items.filter((i) => !i.checked)
  const checked = items.filter((i) => i.checked)

  const grouped = SECTION_ORDER.reduce((acc, section) => {
    const sectionItems = unchecked.filter((i) => (i.store_section ?? 'Other') === section)
    if (sectionItems.length > 0) acc[section] = sectionItems
    return acc
  }, {} as Record<string, ShoppingItem[]>)

  // Any unchecked items not matched by SECTION_ORDER end up in a fallback (shouldn't happen with 'Other')
  const hasUnchecked = unchecked.length > 0

  if (profileLoading) return <div className="flex justify-center items-center h-40"><Spinner /></div>

  return (
    <div className="px-4 pt-4 pb-6 max-w-lg mx-auto">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg">
          {toastMsg}
        </div>
      )}

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
        <div className="flex items-center gap-2">
          {list?.share_token && (
            <button
              onClick={handleShare}
              className="glass rounded-xl px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-300 font-semibold font-heading flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          )}
          <button
            onClick={() => router.push('/plan')}
            className="glass rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-[#FED7AA] font-semibold font-heading"
          >
            ← Plan
          </button>
        </div>
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
      ) : !list || items.length === 0 ? (
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
          {/* Unchecked — grouped by section */}
          {hasUnchecked && (
            <div className="mb-4">
              {Object.entries(grouped).map(([section, sectionItems]) => (
                <div key={section}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400/70 mb-2 mt-4 px-1 font-heading">
                    {section} · {sectionItems.length}
                  </p>
                  <ul className="glass rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-white/10">
                    {sectionItems.map((item) => {
                      const globalIndex = items.indexOf(item)
                      return (
                        <ShoppingItemRow key={globalIndex} item={item} onToggle={() => toggleItem(globalIndex)} />
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Checked */}
          {checked.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-bold text-gray-400 dark:text-emerald-400/30 uppercase tracking-wide mb-2 mt-4 px-1 font-heading">
                Done · {checked.length}
              </p>
              <ul className="glass rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-white/10 opacity-70">
                {checked.map((item) => {
                  const globalIndex = items.indexOf(item)
                  return (
                    <ShoppingItemRow key={globalIndex} item={item} onToggle={() => toggleItem(globalIndex)} />
                  )
                })}
              </ul>
            </div>
          )}

          {/* WhatsApp share */}
          {list?.share_token && (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Shopping list: ${window.location.origin}/shopping/share/${list.share_token}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold font-heading text-white mb-4"
              style={{ background: 'rgba(37,211,102,0.85)' }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Send via WhatsApp
            </a>
          )}

          {/* Add item */}
          <form onSubmit={addItem} className="flex gap-2 mt-2">
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
