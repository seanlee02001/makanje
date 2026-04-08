'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRealtimePantry } from '@/hooks/useRealtimePantry'
import { addPantryItem, updatePantryItem, deletePantryItem } from '@/lib/supabase/queries/pantry'
import { Spinner } from '@/components/ui/Spinner'
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

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!familyId || !addName.trim()) return
    setSaving(true)
    try {
      await addPantryItem(familyId, addName.trim(), addQty !== '' ? parseFloat(addQty) : null, addUnit.trim() || null)
      setAddName(''); setAddQty(''); setAddUnit('')
      nameRef.current?.focus()
    } finally { setSaving(false) }
  }

  async function incrementQty(item: PantryItem) {
    await updatePantryItem(item.id, { quantity: (item.quantity ?? 0) + 1 })
  }

  async function decrementQty(item: PantryItem) {
    const newQty = (item.quantity ?? 1) - 1
    if (newQty <= 0) {
      await deletePantryItem(item.id)
    } else {
      await updatePantryItem(item.id, { quantity: newQty })
    }
  }

  if (profileLoading) return <div className="flex justify-center items-center h-40"><Spinner /></div>

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-5 pt-6 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-[28px] font-bold tracking-[-0.5px]" style={{ color: 'var(--text-primary)' }}>
            Pantry
          </h1>
          {!loading && (
            <span className="text-[12px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
              {items.length} item{items.length !== 1 ? 's' : ''} in stock
            </span>
          )}
        </div>
        <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
          Items here are subtracted from your shopping list.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-4 pb-6">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🏠</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No pantry items yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Add things you already have at home to skip them on your shopping list.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-[12px] px-4 py-3 flex items-center gap-3"
                style={{ background: 'var(--surface)' }}
              >
                {/* Emoji icon */}
                <div className="w-9 h-9 rounded-[8px] flex items-center justify-center text-lg shrink-0" style={{ background: 'var(--canvas)' }}>
                  🫙
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0" onClick={() => startEdit(item)}>
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {item.name}
                  </p>
                  {editingId === item.id ? (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <input
                        type="number" value={editQty} onChange={(e) => setEditQty(e.target.value)}
                        placeholder="qty" autoFocus
                        className="w-16 text-xs rounded-[6px] px-2 py-1 focus:outline-none"
                        style={{ background: 'var(--canvas)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                      />
                      <input
                        type="text" value={editUnit} onChange={(e) => setEditUnit(e.target.value)}
                        placeholder="unit"
                        className="w-16 text-xs rounded-[6px] px-2 py-1 focus:outline-none"
                        style={{ background: 'var(--canvas)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                      />
                      <button onClick={() => saveEdit(item.id)} className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>Save</button>
                      <button onClick={() => setEditingId(null)} className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Cancel</button>
                    </div>
                  ) : (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {item.quantity != null ? `${item.quantity}${item.unit ? ` ${item.unit}` : ''}` : 'tap to edit qty'}
                    </p>
                  )}
                </div>

                {/* +/- buttons */}
                {editingId !== item.id && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => decrementQty(item)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: 'var(--canvas)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                    >
                      −
                    </button>
                    <button
                      onClick={() => incrementQty(item)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: 'var(--canvas)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add item form */}
      <div className="sticky bottom-0 px-5 pb-safe mb-3">
        <form onSubmit={handleAdd} className="rounded-[12px] px-4 py-3 flex items-center gap-2" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
          <input
            ref={nameRef} type="text" value={addName} onChange={(e) => setAddName(e.target.value)}
            placeholder="Item name…"
            className="flex-1 min-w-0 text-sm bg-transparent focus:outline-none" style={{ color: 'var(--text-primary)' }}
          />
          <input
            type="number" value={addQty} onChange={(e) => setAddQty(e.target.value)}
            placeholder="qty"
            className="w-14 text-sm rounded-[6px] px-2 py-1 focus:outline-none"
            style={{ background: 'var(--canvas)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          />
          <button
            type="submit" disabled={saving || !addName.trim()}
            className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-lg disabled:opacity-40 shrink-0"
            style={{ background: 'var(--accent)' }}
          >
            +
          </button>
        </form>
      </div>
    </div>
  )
}
