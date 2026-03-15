'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { IngredientRow, type IngredientDraft } from '@/components/meals/IngredientRow'

export default function NewMealPage() {
  const [name, setName] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([
    { name: '', quantity: '', unit: '' },
  ])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function addIngredient() {
    setIngredients((prev) => [...prev, { name: '', quantity: '', unit: '' }])
  }

  function updateIngredient(i: number, val: IngredientDraft) {
    setIngredients((prev) => prev.map((x, idx) => idx === i ? val : x))
  }

  function removeIngredient(i: number) {
    setIngredients((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Meal name is required'); return }
    setError('')
    setLoading(true)

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
          source_url: sourceUrl.trim() || null,
          created_by: user.id,
        })
        .select()
        .single()

      if (mealErr || !meal) { setError(mealErr?.message ?? 'Could not create meal'); return }

      const validIngredients = ingredients.filter((i) => i.name.trim())
      if (validIngredients.length > 0) {
        await supabase.from('ingredients').insert(
          validIngredients.map((i) => ({
            meal_id: meal.id,
            name: i.name.trim(),
            quantity: i.quantity ? parseFloat(i.quantity) : null,
            unit: i.unit.trim() || null,
          }))
        )
      }

      router.push(`/meals/${meal.id}`)
    } finally {
      setLoading(false)
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
        <h1 className="text-xl font-bold text-gray-900">New Meal</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          id="meal-name"
          label="Meal name"
          placeholder="e.g. Spaghetti Bolognese"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          id="source-url"
          label="Recipe URL (optional)"
          type="url"
          placeholder="https://..."
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
        />

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Ingredients</p>
          <div className="flex flex-col gap-2">
            {ingredients.map((ing, i) => (
              <IngredientRow
                key={i}
                index={i}
                value={ing}
                onChange={(v) => updateIngredient(i, v)}
                onRemove={() => removeIngredient(i)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={addIngredient}
            className="mt-3 text-sm text-emerald-600 font-medium hover:underline flex items-center gap-1"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add ingredient
          </button>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Link href="/meals" className="flex-1">
            <Button type="button" variant="secondary" className="w-full">Cancel</Button>
          </Link>
          <Button type="submit" loading={loading} className="flex-1">Save meal</Button>
        </div>
      </form>
    </div>
  )
}
