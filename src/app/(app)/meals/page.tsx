import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MealCard } from '@/components/meals/MealCard'

export default async function MealsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users').select('family_id').eq('id', user.id).single()

  const { data: meals } = await supabase
    .from('meals')
    .select('*')
    .eq('family_id', profile?.family_id ?? '')
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Meal Library</h1>
        <Link
          href="/meals/new"
          className="flex items-center gap-1.5 bg-emerald-600 text-white text-sm font-medium px-3 py-2 rounded-xl hover:bg-emerald-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add meal
        </Link>
      </div>

      {(!meals || meals.length === 0) ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🍽️</div>
          <p className="font-medium text-gray-600">No meals yet</p>
          <p className="text-sm mt-1">Add your first meal to get started.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Link href="/meals/new" className="text-emerald-600 text-sm font-medium hover:underline">
              Add manually
            </Link>
            <Link href="/meals/import" className="text-emerald-600 text-sm font-medium hover:underline">
              Import from URL
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {meals.map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/meals/import" className="text-sm text-emerald-600 font-medium hover:underline">
              + Import from URL
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
