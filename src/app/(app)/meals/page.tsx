'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MealCard } from '@/components/meals/MealCard'
import type { Meal } from '@/lib/supabase/types'

export default function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function loadMeals() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('users').select('family_id').eq('id', user.id).single()

      const { data } = await supabase
        .from('meals')
        .select('*')
        .eq('family_id', profile?.family_id ?? '')
        .order('created_at', { ascending: false })

      setMeals(data ?? [])
      setLoading(false)
    }
    loadMeals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = meals.filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="flex flex-col min-h-full">
      {/* Sticky glass header */}
      <div className="glass-strong sticky top-0 z-20 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-[#0F172A] dark:text-[#FED7AA] font-heading">
            Meal Library
          </h1>
          <Link
            href="/meals/new"
            className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-xl hover:bg-orange-600 transition-colors shadow-sm shadow-orange-500/30"
            aria-label="Add meal"
          >
            +
          </Link>
        </div>

        {/* Search bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </div>
          <input
            type="search"
            placeholder="Search meals…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full glass rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-orange-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30"
          />
        </div>
      </div>

      {/* Import banner — solid vivid orange */}
      <div className="mx-4 my-3">
        <Link
          href="/meals/import"
          className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-400 shadow-md shadow-orange-500/30 hover:shadow-orange-500/50 transition-all active:scale-[0.98]"
        >
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm font-heading">Import Recipe URL</p>
            <p className="text-white/80 text-xs mt-0.5">AI extracts ingredients automatically</p>
          </div>
          <span className="text-white font-bold text-lg shrink-0">›</span>
        </Link>
      </div>

      {/* Meal grid */}
      <div className="px-4 pb-6 flex-1">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#EA580C]/30 border-t-[#EA580C] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-[#92400E]">
            {query ? (
              <>
                <p className="font-bold text-[#0F172A] dark:text-[#FED7AA] font-heading">No results</p>
                <p className="text-sm mt-1">Try a different search term.</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="h-7 w-7 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a7 7 0 017 7c0 3.5-2 6-4 7v2H9v-2c-2-1-4-3.5-4-7a7 7 0 017-7z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 21h6" />
                  </svg>
                </div>
                <p className="font-bold text-[#0F172A] dark:text-[#FED7AA] font-heading">No meals yet</p>
                <p className="text-sm mt-1 text-[#92400E]">Add your first meal to get started.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
