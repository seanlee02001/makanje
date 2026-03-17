'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { createDish } from '@/lib/supabase/queries/dishes'
import { IngredientRow, type IngredientDraft } from '@/components/meals/IngredientRow'

export default function ImportDishPage() {
  const [url, setUrl] = useState('')
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [parseFailed, setParseFailed] = useState(false)

  const [name, setName] = useState('')
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([])
  const [step, setStep] = useState<'url' | 'review'>('url')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const supabase = createClient()

  async function handleFetch(e: React.FormEvent) {
    e.preventDefault()
    setFetchError('')
    setFetching(true)
    setParseFailed(false)

    try {
      const res = await fetch('/api/import-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()

      setName(data.title ?? '')
      const ingList = (data.ingredients ?? []).map(
        (i: { name: string; quantity: number | null; unit: string | null }) => ({
          name: i.name,
          quantity: i.quantity?.toString() ?? '',
          unit: i.unit ?? '',
        })
      )
      setIngredients(ingList)

      if (data.error === 'parse_failed' || !data.ingredients?.length) {
        setParseFailed(true)
        if (!ingList.length) {
          setIngredients([{ name: '', quantity: '', unit: '' }])
        }
      }
      setStep('review')
    } catch {
      setFetchError('Could not reach that URL. Check your connection and try again.')
    } finally {
      setFetching(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Dish name is required'); return }
    setError('')
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('users').select('family_id').eq('id', user.id).single()
      if (!profile?.family_id) { setError('No family found'); return }

      const dish = await createDish({
        familyId: profile.family_id,
        name: name.trim(),
        sourceUrl: url.trim() || null,
        createdBy: user.id,
      })

      if (!dish) { setError('Could not save dish'); return }

      const valid = ingredients.filter((i) => i.name.trim())
      if (valid.length > 0) {
        await supabase.from('ingredients').insert(
          valid.map((i) => ({
            dish_id: dish.id,
            name: i.name.trim(),
            quantity: i.quantity ? parseFloat(i.quantity) : null,
            unit: i.unit.trim() || null,
          }))
        )
      }

      router.push(`/dishes/${dish.id}`)
    } finally {
      setSaving(false)
    }
  }

  const sourceDomain = (() => {
    try { return url ? new URL(url).hostname.replace('www.', '') : null } catch { return null }
  })()

  return (
    <div className="flex flex-col min-h-full px-4 pt-5 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link href="/dishes" className="text-gray-400 hover:text-gray-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-[#FED7AA] font-heading">
            Import Recipe
          </h1>
          <p className="text-sm text-gray-500 dark:text-orange-200/50 mt-0.5">
            Paste a URL — AI extracts ingredients
          </p>
        </div>
      </div>

      {step === 'url' ? (
        <form onSubmit={handleFetch} className="flex flex-col gap-4">
          <div className="glass rounded-2xl flex items-center px-3 py-3 gap-2">
            <svg className="h-4 w-4 text-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1" />
            </svg>
            <input
              type="url"
              placeholder="https://www.allrecipes.com/recipe/…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="flex-1 bg-transparent text-gray-900 dark:text-orange-100 placeholder-gray-400 text-sm focus:outline-none"
            />
            <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded-lg shrink-0 font-medium font-heading">
              AI
            </span>
          </div>

          {fetchError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{fetchError}</p>
          )}

          <button
            type="submit"
            disabled={fetching || !url.trim()}
            className="w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-semibold font-heading text-sm transition-colors disabled:opacity-50 shadow-sm shadow-orange-500/30"
          >
            {fetching ? 'Fetching…' : 'Extract Recipe'}
          </button>
        </form>
      ) : (
        <form id="review-form" onSubmit={handleSave} className="flex flex-col gap-4">
          {parseFailed && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
              We couldn&apos;t fully parse this recipe. Please fill in the details below.
            </div>
          )}

          {/* Recipe card preview */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
              <p className="text-xs text-gray-500 font-medium truncate">{sourceDomain ?? url}</p>
              <span className="ml-auto bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-100">
                {ingredients.filter(i => i.name).length} ingredients
              </span>
            </div>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Recipe name"
              required
              className="w-full text-lg font-bold text-gray-900 dark:text-[#FED7AA] font-heading bg-transparent placeholder-gray-400 focus:outline-none border-b border-gray-200 pb-1 mb-1"
            />
          </div>

          {/* Ingredients section */}
          <div>
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-orange-600 text-xs font-bold uppercase tracking-wide font-heading">
                Ingredients
              </span>
              <span className="text-gray-400 text-xs">Tap to edit</span>
            </div>

            <div className="flex flex-col gap-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="glass rounded-xl flex items-center gap-2 px-3 py-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                  <IngredientRow
                    index={i}
                    value={ing}
                    onChange={(v) => setIngredients((prev) => prev.map((x, idx) => idx === i ? v : x))}
                    onRemove={() => setIngredients((prev) => prev.filter((_, idx) => idx !== i))}
                  />
                  <svg className="h-3.5 w-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 1 1 3.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIngredients((prev) => [...prev, { name: '', quantity: '', unit: '' }])}
              className="mt-3 text-sm text-orange-600 font-medium hover:underline flex items-center gap-1 px-1"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add ingredient
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={() => setStep('url')}
              className="flex-1 py-3 rounded-2xl glass text-gray-700 dark:text-[#FED7AA] font-semibold text-sm font-heading hover:brightness-95 transition-all"
            >
              Back
            </button>
          </div>
        </form>
      )}

      {/* Sticky save button (review step) */}
      {step === 'review' && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-gradient-to-t from-[#FFF7ED] to-transparent">
          <button
            type="submit"
            form="review-form"
            disabled={saving}
            className="w-full py-4 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-semibold font-heading text-sm transition-colors disabled:opacity-50 shadow-md shadow-orange-500/30"
          >
            {saving ? 'Saving…' : 'Save to Dish Library'}
          </button>
        </div>
      )}
    </div>
  )
}
