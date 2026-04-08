'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { updateDish } from '@/lib/supabase/queries/dishes'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SUGGESTED_TAGS } from '@/components/dishes/TagFilter'
import { IngredientRow, type IngredientDraft } from '@/components/meals/IngredientRow'
import { CookingMode } from '@/components/cooking/CookingMode'
import { Spinner } from '@/components/ui/Spinner'
import type { Dish, Ingredient } from '@/lib/supabase/types'

export default function DishDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  // Data state
  const [dish, setDish] = useState<Dish | null>(null)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)

  // UI state
  const [editing, setEditing] = useState(false)
  const [cookingOpen, setCookingOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Edit form state
  const [name, setName] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [prepTime, setPrepTime] = useState('')
  const [servings, setServings] = useState('')
  const [instructions, setInstructions] = useState<string[]>([])
  const [draftIngredients, setDraftIngredients] = useState<IngredientDraft[]>([])

  useEffect(() => {
    async function load() {
      const { data: d } = await supabase.from('dishes').select('*').eq('id', id).single()
      const { data: ings } = await supabase.from('ingredients').select('*').eq('dish_id', id).order('id')
      setDish(d)
      setIngredients(ings ?? [])
      initEditState(d, ings ?? [])
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function initEditState(d: Dish | null, ings: Ingredient[]) {
    setName(d?.name ?? '')
    setSourceUrl(d?.source_url ?? '')
    setTags(d?.tags ?? [])
    setPrepTime(d?.prep_time_min != null ? String(d.prep_time_min) : '')
    setServings(d?.servings != null ? String(d.servings) : '')
    setInstructions((d?.instructions ?? []).map((s) => s.text))
    setDraftIngredients(
      ings.map((i) => ({
        name: i.name,
        quantity: i.quantity?.toString() ?? '',
        unit: i.unit ?? '',
      }))
    )
  }

  function enterEdit() {
    initEditState(dish, ingredients)
    setEditing(true)
  }

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)

    const validInstructions = instructions
      .map((t, i) => ({ step: i + 1, text: t.trim() }))
      .filter((s) => s.text)

    await updateDish(id, {
      name: name.trim(),
      source_url: sourceUrl.trim() || null,
      tags,
      prep_time_min: prepTime ? parseInt(prepTime) : null,
      servings: servings ? parseInt(servings) : null,
      instructions: validInstructions,
    })

    // Replace ingredients
    await supabase.from('ingredients').delete().eq('dish_id', id)
    const validIngs = draftIngredients.filter((i) => i.name.trim())
    let savedIngs: Ingredient[] = []
    if (validIngs.length > 0) {
      const { data } = await supabase
        .from('ingredients')
        .insert(
          validIngs.map((i) => ({
            dish_id: id,
            name: i.name.trim(),
            quantity: i.quantity ? parseFloat(i.quantity) : null,
            unit: i.unit.trim() || null,
          }))
        )
        .select()
      savedIngs = data ?? []
    }

    setIngredients(savedIngs)
    setDish((d) =>
      d
        ? {
            ...d,
            name: name.trim(),
            source_url: sourceUrl.trim() || null,
            tags,
            prep_time_min: prepTime ? parseInt(prepTime) : null,
            servings: servings ? parseInt(servings) : null,
            instructions: validInstructions,
          }
        : d
    )
    setEditing(false)
    setSaving(false)
  }

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('dishes').delete().eq('id', id)
    router.push('/dishes')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spinner />
      </div>
    )
  }

  if (!dish) {
    return (
      <div className="p-4 text-center" style={{ color: 'var(--text-secondary)' }}>
        Dish not found.{' '}
        <Link href="/dishes" style={{ color: 'var(--accent)' }}>
          Back to library
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky header */}
      <div
        className="sticky top-0 z-20 px-4 pt-4 pb-3 flex items-center justify-between glass-strong"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dishes"
            className="shrink-0 transition-opacity hover:opacity-60"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1
            className="text-xl font-bold truncate font-heading"
            style={{ color: 'var(--text-primary)' }}
          >
            {editing ? 'Edit Dish' : dish.name}
          </h1>
        </div>
        {!editing && (
          <button
            onClick={enterEdit}
            className="shrink-0 text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ color: 'var(--accent)' }}
          >
            Edit
          </button>
        )}
      </div>

      <div className="p-4 max-w-lg mx-auto w-full pb-10">
        {editing ? (
          /* ── EDIT MODE ── */
          <div className="flex flex-col gap-5">
            <Input
              label="Dish name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Recipe URL (optional)"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
            />

            {/* Prep time + servings row */}
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  label="Prep time (min)"
                  type="number"
                  min="0"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Input
                  label="Servings"
                  type="number"
                  min="1"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-widest mb-2 font-heading"
                style={{ color: 'var(--accent)' }}
              >
                Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_TAGS.map((tag) => {
                  const active = tags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="px-3 py-1 rounded-pill text-xs font-semibold transition-colors"
                      style={{
                        background: active ? 'var(--accent)' : 'var(--surface)',
                        color: active ? '#ffffff' : 'var(--text-secondary)',
                      }}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-widest mb-2 font-heading"
                style={{ color: 'var(--accent)' }}
              >
                Ingredients
              </p>
              <div className="flex flex-col gap-2">
                {draftIngredients.map((ing, i) => (
                  <IngredientRow
                    key={i}
                    index={i}
                    value={ing}
                    onChange={(v) =>
                      setDraftIngredients((prev) => prev.map((x, idx) => (idx === i ? v : x)))
                    }
                    onRemove={() =>
                      setDraftIngredients((prev) => prev.filter((_, idx) => idx !== i))
                    }
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  setDraftIngredients((prev) => [...prev, { name: '', quantity: '', unit: '' }])
                }
                className="mt-3 text-sm font-medium hover:underline flex items-center gap-1"
                style={{ color: 'var(--accent)' }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add ingredient
              </button>
            </div>

            {/* Instructions */}
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-widest mb-2 font-heading"
                style={{ color: 'var(--accent)' }}
              >
                Instructions
              </p>
              <div className="flex flex-col gap-3">
                {instructions.map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span
                      className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-1"
                      style={{ background: 'var(--accent)', color: '#fff' }}
                    >
                      {i + 1}
                    </span>
                    <textarea
                      value={step}
                      onChange={(e) =>
                        setInstructions((prev) =>
                          prev.map((s, idx) => (idx === i ? e.target.value : s))
                        )
                      }
                      rows={2}
                      placeholder={`Step ${i + 1}`}
                      className="flex-1 rounded-[12px] px-3 py-2 text-sm resize-none outline-none transition-colors"
                      style={{
                        background: 'var(--surface)',
                        color: 'var(--text-primary)',
                        border: '1.5px solid var(--border)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setInstructions((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      className="mt-1 rounded-full p-1.5 transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      aria-label="Remove step"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setInstructions((prev) => [...prev, ''])}
                className="mt-3 text-sm font-medium hover:underline flex items-center gap-1"
                style={{ color: 'var(--accent)' }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add step
              </button>
            </div>

            {/* Save / Cancel */}
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => setEditing(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} loading={saving} className="flex-1">
                Save changes
              </Button>
            </div>

            {/* Delete in edit mode */}
            <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              {showDeleteConfirm ? (
                <div
                  className="rounded-[12px] p-4 flex flex-col gap-3"
                  style={{ background: 'var(--surface)' }}
                >
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Delete &ldquo;{dish.name}&rdquo;? This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      loading={deleting}
                      className="flex-1"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full text-red-500"
                >
                  Delete dish
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* ── VIEW MODE ── */
          <div className="flex flex-col gap-6">
            {/* Meta pills */}
            {(dish.prep_time_min != null || dish.servings != null || dish.tags?.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {dish.prep_time_min != null && (
                  <span
                    className="px-3 py-1 rounded-pill text-xs font-semibold flex items-center gap-1"
                    style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" d="M12 6v6l4 2" />
                    </svg>
                    {dish.prep_time_min} min
                  </span>
                )}
                {dish.servings != null && (
                  <span
                    className="px-3 py-1 rounded-pill text-xs font-semibold flex items-center gap-1"
                    style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                    </svg>
                    {dish.servings} servings
                  </span>
                )}
                {dish.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-pill text-xs font-semibold"
                    style={{ background: 'var(--accent)', color: '#ffffff' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Source URL */}
            {dish.source_url && (
              <a
                href={dish.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm flex items-center gap-1.5 hover:underline"
                style={{ color: 'var(--accent)' }}
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View original recipe
              </a>
            )}

            {/* Ingredients */}
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-widest mb-3 font-heading"
                style={{ color: 'var(--accent)' }}
              >
                Ingredients{ingredients.length > 0 ? ` · ${ingredients.length}` : ''}
              </p>
              {ingredients.length === 0 ? (
                <div
                  className="rounded-[12px] p-6 text-center text-sm"
                  style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}
                >
                  No ingredients added yet.
                </div>
              ) : (
                <ul
                  className="rounded-[12px] overflow-hidden divide-y"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                    divideColor: 'var(--border)',
                  }}
                >
                  {ingredients.map((ing) => (
                    <li
                      key={ing.id}
                      className="py-3 px-4 flex items-center justify-between"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <span
                        className="text-sm font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {ing.name}
                      </span>
                      {(ing.quantity || ing.unit) && (
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {ing.quantity ?? ''}{ing.unit ? ` ${ing.unit}` : ''}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Instructions */}
            {dish.instructions?.length > 0 && (
              <div>
                <p
                  className="text-[11px] font-bold uppercase tracking-widest mb-3 font-heading"
                  style={{ color: 'var(--accent)' }}
                >
                  Instructions · {dish.instructions.length} steps
                </p>
                <ol className="flex flex-col gap-4">
                  {dish.instructions.map((step) => (
                    <li key={step.step} className="flex items-start gap-3">
                      <span
                        className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                        style={{ background: 'var(--accent)', color: '#fff' }}
                      >
                        {step.step}
                      </span>
                      <p
                        className="text-sm leading-relaxed pt-1"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {step.text}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Start cooking CTA */}
            {dish.instructions?.length > 0 && (
              <button
                onClick={() => setCookingOpen(true)}
                className="w-full py-3.5 rounded-pill text-sm font-bold tracking-wide transition-opacity hover:opacity-90"
                style={{ background: '#2563EB', color: '#ffffff' }}
              >
                Start cooking
              </button>
            )}

            {/* Delete section */}
            <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              {showDeleteConfirm ? (
                <div
                  className="rounded-[12px] p-4 flex flex-col gap-3"
                  style={{ background: 'var(--surface)' }}
                >
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Delete &ldquo;{dish.name}&rdquo;? This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      loading={deleting}
                      className="flex-1"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full text-red-500"
                >
                  Delete dish
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cooking mode overlay */}
      {cookingOpen && (
        <CookingMode dish={dish} onClose={() => setCookingOpen(false)} />
      )}
    </div>
  )
}
