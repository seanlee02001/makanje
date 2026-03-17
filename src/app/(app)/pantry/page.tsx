'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRealtimePantry } from '@/hooks/useRealtimePantry'
import { addPantryItem, updatePantryItem, deletePantryItem } from '@/lib/supabase/queries/pantry'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/utils/cn'
import type { PantryItem } from '@/lib/supabase/types'

export default function PantryPage() {
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState('')
  const [editUnit, setEditUnit] = useState('')
  const [addName, setAddName] = useState('')
  const [addQty, setAddQty] = useState('')
  const [addUnit, setAddUnit] = useState('')
  const [saving, setSaving] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  const router = useRouter()
  const supabase = createClient()

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

  const { items, loading } = useRealtimePantry(familyId)

  function startEdit(item: PantryItem) {
    setEditingId(item.id)
    setEditQty(item.quantity != null ? String(item.quantity) : '')
    setEditUnit(item.unit ?? '')
  }

  async function saveEdit(id: string) {
    await updatePantryItem(id, {
      quantity: editQty !== '' ? parseFloat(editQty) : null,
      unit: editUnit.trim() || null,
    })
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    await deletePantryItem(id)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!familyId || !addName.trim()) return
    setSaving(true)
    try {
      await addPantryItem(
        familyId,
        addName.trim(),
        addQty !== '' ? parseFloat(addQty) : null,
        addUnit.trim() || null,
      )
      setAddName('')
      setAddQty('')
      setAddUnit('')
      nameRef.current?.focus()
    } finally {
      setSaving(false)
    }
  }

  if (profileLoading) {
    return <div className="flex justify-center items-center h-40"><Spinner /></div>
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="glass-strong sticky top-0 z-20 px-4 pt-4 pb-3">
        <div className="flex items-baseline justify-between">
          <h1 className="font-heading font-bold text-[#0F172A] dark:text-[#FED7AA] text-xl">
            Pantry
          </h1>
          {!loading && (
            <span className="text-xs font-semibold text-orange-500">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-orange-200/60 mt-0.5">
          Items here are subtracted from your shopping list.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pt-4 pb-6">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M3 15h18" />
              </svg>
            </div>
            <p className="text-[#0F172A] dark:text-[#FED7AA] font-semibold font-heading text-sm mb-1">
              No pantry items yet
            </p>
            <p className="text-slate-500 dark:text-orange-200/60 text-xs leading-relaxed">
              Add things you already have at home to skip them on your shopping list.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="glass rounded-2xl px-4 py-3 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0" onClick={() => startEdit(item)}>
                  <p className="font-semibold text-[#0F172A] dark:text-[#FED7AA] text-sm font-heading truncate">
                    {item.name}
                  </p>
                  {editingId === item.id ? (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <input
                        type="number"
                        value={editQty}
                        onChange={(e) => setEditQty(e.target.value)}
                        placeholder="qty"
                        className="w-16 text-xs rounded-lg border border-orange-200 px-2 py-1 bg-white/70 focus:outline-none focus:border-orange-400"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={editUnit}
                        onChange={(e) => setEditUnit(e.target.value)}
                        placeholder="unit"
                        className="w-16 text-xs rounded-lg border border-orange-200 px-2 py-1 bg-white/70 focus:outline-none focus:border-orange-400"
                      />
                      <button
                        onClick={() => saveEdit(item.id)}
                        className="text-xs font-semibold text-orange-600 hover:text-orange-700 px-1"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs text-slate-400 hover:text-slate-600 px-1"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    item.quantity != null ? (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 mt-0.5 italic">tap to edit qty</p>
                    )
                  )}
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className={cn('p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors', editingId === item.id && 'invisible')}
                  aria-label={`Remove ${item.name}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add item form — sticky bottom */}
      <div className="sticky bottom-0 px-4 pb-safe mb-3">
        <form
          onSubmit={handleAdd}
          className="glass-strong rounded-2xl px-4 py-3 flex items-center gap-2"
        >
          <input
            ref={nameRef}
            type="text"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="Item name…"
            className="flex-1 min-w-0 text-sm bg-transparent focus:outline-none text-[#0F172A] dark:text-[#FED7AA] placeholder-slate-400"
          />
          <input
            type="number"
            value={addQty}
            onChange={(e) => setAddQty(e.target.value)}
            placeholder="qty"
            className="w-14 text-sm bg-white/60 dark:bg-white/10 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-400 text-[#0F172A] dark:text-[#FED7AA] placeholder-slate-400"
          />
          <input
            type="text"
            value={addUnit}
            onChange={(e) => setAddUnit(e.target.value)}
            placeholder="unit"
            className="w-14 text-sm bg-white/60 dark:bg-white/10 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-400 text-[#0F172A] dark:text-[#FED7AA] placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={saving || !addName.trim()}
            className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-lg hover:bg-orange-600 transition-colors disabled:opacity-40 shrink-0"
            aria-label="Add item"
          >
            {saving ? <Spinner /> : '+'}
          </button>
        </form>
      </div>
    </div>
  )
}
