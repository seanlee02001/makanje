'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { IngredientRow, type IngredientDraft } from '@/components/meals/IngredientRow'
import { Spinner } from '@/components/ui/Spinner'
import type { Dish, Ingredient } from '@/lib/supabase/types'

export default function DishDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [dish, setDish] = useState<Dish | null>(null)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [draftIngredients, setDraftIngredients] = useState<IngredientDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: d } = await supabase.from('dishes').select('*').eq('id', id).single()
      const { data: ings } = await supabase.from('ingredients').select('*').eq('dish_id', id).order('id')
      setDish(d)
      setIngredients(ings ?? [])
      setName(d?.name ?? '')
      setSourceUrl(d?.source_url ?? '')
      setDraftIngredients(
        (ings ?? []).map((i) => ({
          name: i.name,
          quantity: i.quantity?.toString() ?? '',
          unit: i.unit ?? '',
        }))
      )
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    await supabase.from('dishes').update({ name: name.trim(), source_url: sourceUrl.trim() || null }).eq('id', id)
    await supabase.from('ingredients').delete().eq('dish_id', id)
    const valid = draftIngredients.filter((i) => i.name.trim())
    if (valid.length > 0) {
      await supabase.from('ingredients').insert(
        valid.map((i) => ({
          dish_id: id,
          name: i.name.trim(),
          quantity: i.quantity ? parseFloat(i.quantity) : null,
          unit: i.unit.trim() || null,
        }))
      )
      setIngredients(valid.map((i, idx) => ({
        id: String(idx), dish_id: id,
        name: i.name.trim(),
        quantity: i.quantity ? parseFloat(i.quantity) : null,
        unit: i.unit.trim() || null,
      })))
    } else {
      setIngredients([])
    }
    setDish((d) => d ? { ...d, name: name.trim(), source_url: sourceUrl.trim() || null } : d)
    setEditing(false)
    setSaving(false)
  }

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('dishes').delete().eq('id', id)
    router.push('/dishes')
  }

  if (loading) {
    return <div className="flex justify-center items-center h-40"><Spinner /></div>
  }

  if (!dish) {
    return (
      <div className="p-4 text-center text-gray-500">
        Dish not found. <Link href="/dishes" className="text-orange-600">Back to library</Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky header */}
      <div className="glass-strong sticky top-0 z-20 px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dishes" className="text-gray-400 hover:text-gray-600 shrink-0">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-[#FED7AA] font-heading truncate">
            {editing ? 'Edit Dish' : dish.name}
          </h1>
        </div>
        {!editing && (
          <button
            onClick={() => {
              setEditing(true)
              setDraftIngredients(
                ingredients.map((i) => ({ name: i.name, quantity: i.quantity?.toString() ?? '', unit: i.unit ?? '' }))
              )
            }}
            className="shrink-0 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      <div className="p-4 max-w-lg mx-auto w-full">
        {editing ? (
          <div className="flex flex-col gap-5">
            <Input label="Dish name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Recipe URL (optional)" type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />

            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-orange-200 mb-2 font-heading">Ingredients</p>
              <div className="flex flex-col gap-2">
                {draftIngredients.map((ing, i) => (
                  <IngredientRow
                    key={i} index={i} value={ing}
                    onChange={(v) => setDraftIngredients((prev) => prev.map((x, idx) => idx === i ? v : x))}
                    onRemove={() => setDraftIngredients((prev) => prev.filter((_, idx) => idx !== i))}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setDraftIngredients((prev) => [...prev, { name: '', quantity: '', unit: '' }])}
                className="mt-3 text-sm text-orange-600 font-medium hover:underline flex items-center gap-1"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add ingredient
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => setEditing(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSave} loading={saving} className="flex-1">Save changes</Button>
            </div>
          </div>
        ) : (
          <div>
            {dish.source_url && (
              <a href={dish.source_url} target="_blank" rel="noopener noreferrer"
                className="text-sm text-orange-600 hover:underline flex items-center gap-1.5 mb-5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View original recipe
              </a>
            )}

            <p className="text-[11px] font-bold text-orange-600 uppercase tracking-widest mb-3 font-heading">
              Ingredients {ingredients.length > 0 && `· ${ingredients.length}`}
            </p>

            {ingredients.length === 0 ? (
              <div className="glass rounded-2xl p-6 text-center text-gray-400 text-sm">
                No ingredients added yet.
              </div>
            ) : (
              <ul className="glass rounded-2xl overflow-hidden divide-y divide-gray-100">
                {ingredients.map((ing) => (
                  <li key={ing.id} className="py-3 px-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-orange-100">{ing.name}</span>
                    {(ing.quantity || ing.unit) && (
                      <span className="text-sm text-gray-500 dark:text-orange-200/60">
                        {ing.quantity ? ing.quantity : ''}{ing.unit ? ` ${ing.unit}` : ''}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100">
              {showDeleteConfirm ? (
                <div className="bg-red-50 rounded-xl p-4 flex flex-col gap-3">
                  <p className="text-sm text-red-700 font-medium">Delete &ldquo;{dish.name}&rdquo;? This cannot be undone.</p>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} className="flex-1">Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete} loading={deleting} className="flex-1">Delete</Button>
                  </div>
                </div>
              ) : (
                <Button variant="ghost" onClick={() => setShowDeleteConfirm(true)} className="text-red-500 w-full">
                  Delete dish
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
