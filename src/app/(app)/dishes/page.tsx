'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getDishes } from '@/lib/supabase/queries/dishes'
import { TagFilter } from '@/components/dishes/TagFilter'
import type { Dish } from '@/lib/supabase/types'

type DishWithCount = Dish & { ingredients: { id: string }[] }

export default function DishesPage() {
  const [dishes, setDishes] = useState<DishWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('users').select('family_id').eq('id', user.id).single()
      if (!profile?.family_id) return
      const data = await getDishes(profile.family_id)
      setDishes(data)
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const allTags = Array.from(new Set(dishes.flatMap((d) => d.tags ?? [])))

  const filtered = dishes.filter((d) => {
    const matchesQuery = d.name.toLowerCase().includes(query.toLowerCase())
    const matchesTag = tagFilter === null || (d.tags ?? []).includes(tagFilter)
    return matchesQuery && matchesTag
  })

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-20 px-5 pt-6 pb-3" style={{ background: 'var(--canvas)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-[28px] font-bold tracking-[-0.5px]" style={{ color: 'var(--text-primary)' }}>
            Dishes
          </h1>
          <Link
            href="/dishes/new"
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xl text-white"
            style={{ background: 'var(--accent)' }}
            aria-label="Add dish"
          >
            +
          </Link>
        </div>

        {/* Search */}
        <input
          type="search"
          placeholder="Search dishes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-[10px] px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2"
          style={{
            background: 'var(--surface)',
            color: 'var(--text-primary)',
          }}
        />

        {/* Tag filter */}
        <TagFilter tags={allTags} selected={tagFilter} onSelect={setTagFilter} />
      </div>

      {/* Dish list */}
      <div className="px-5 pb-6 flex-1">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            {query || tagFilter ? (
              <>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No results</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Try a different search or filter.</p>
              </>
            ) : (
              <>
                <p className="text-4xl mb-3">🍳</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No dishes yet</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Add your first dish or import a recipe.</p>
              </>
            )}
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--divider)' }}>
            {filtered.map((dish) => (
              <li key={dish.id}>
                <Link
                  href={`/dishes/${dish.id}`}
                  className="flex items-center gap-3 py-3.5"
                >
                  {/* Emoji icon */}
                  <div
                    className="w-10 h-10 rounded-[8px] flex items-center justify-center text-lg shrink-0"
                    style={{ background: 'var(--surface)' }}
                  >
                    🍽️
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {dish.name}
                    </p>
                    <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {dish.ingredients.length} ingredient{dish.ingredients.length !== 1 ? 's' : ''}
                      {dish.prep_time_min ? ` · ${dish.prep_time_min} min` : ''}
                    </p>
                    {(dish.tags ?? []).length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {dish.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                            style={{ background: 'var(--divider)', color: 'var(--text-secondary)' }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Chevron */}
                  <span className="text-sm shrink-0" style={{ color: 'var(--text-tertiary)' }}>›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function Spinner() {
  return <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
}
