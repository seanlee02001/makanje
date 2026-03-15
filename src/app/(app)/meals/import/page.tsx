'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { IngredientRow, type IngredientDraft } from '@/components/meals/IngredientRow'

export default function ImportMealPage() {
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
      setIngredients(
        (data.ingredients ?? []).map((i: { name: string; quantity: number | null; unit: string | null }) => ({
          name: i.name,
          quantity: i.quantity?.toString() ?? '',
          unit: i.unit ?? '',
        }))
      )
      if (data.error === 'parse_failed' || !data.ingredients?.length) {
        setParseFailed(true)
        // Still show an empty review form
        if (!ingredients.length) {
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
    if (!name.trim()) { setError('Meal name is required'); return }
    setError('')
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('users').select('family_id').eq('id', user.id).single()
      if (!profile?.family_id) { setError('No family found'); return }

      const { data: meal, error: mealErr } = await supabase
        .from('meals')
        .insert({
          family_id: profile.family_id,
          name: name.trim(),
          source_url: url.trim() || null,
          created_by: user.id,
        })
        .select().single()

      if (mealErr || !meal) { setError(mealErr?.message ?? 'Could not save meal'); return }

      const valid = ingredients.filter((i) => i.name.trim())
      if (valid.length > 0) {
        await supabase.from('ingredients').insert(
          valid.map((i) => ({
            meal_id: meal.id,
            name: i.name.trim(),
            quantity: i.quantity ? parseFloat(i.quantity) : null,
            unit: i.unit.trim() || null,
          }))
        )
      }

      router.push(`/meals/${meal.id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/meals" className="text-gray-400 hover:text-gray-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Import from URL</h1>
      </div>

      {step === 'url' ? (
        <form onSubmit={handleFetch} className="flex flex-col gap-4">
          <Input
            id="recipe-url"
            label="Recipe URL"
            type="url"
            placeholder="https://www.allrecipes.com/recipe/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          {fetchError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{fetchError}</p>}
          <Button type="submit" loading={fetching} className="w-full">
            Fetch recipe
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          {parseFailed && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
              We couldn&apos;t fully parse this recipe. Please fill in the details below.
            </div>
          )}

          <Input
            id="meal-name"
            label="Meal name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Recipe name"
          />

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Ingredients</p>
            <div className="flex flex-col gap-2">
              {ingredients.map((ing, i) => (
                <IngredientRow
                  key={i} index={i} value={ing}
                  onChange={(v) => setIngredients((prev) => prev.map((x, idx) => idx === i ? v : x))}
                  onRemove={() => setIngredients((prev) => prev.filter((_, idx) => idx !== i))}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIngredients((prev) => [...prev, { name: '', quantity: '', unit: '' }])}
              className="mt-3 text-sm text-emerald-600 font-medium hover:underline flex items-center gap-1"
            >
              + Add ingredient
            </button>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setStep('url')} className="flex-1">
              Back
            </Button>
            <Button type="submit" loading={saving} className="flex-1">Save meal</Button>
          </div>
        </form>
      )}
    </div>
  )
}
