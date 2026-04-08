'use client'

import { useState, useEffect } from 'react'
import { getDishes } from '@/lib/supabase/queries/dishes'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { TagFilter } from '@/components/dishes/TagFilter'
import type { Dish, DayOfWeek, MealSlotType } from '@/lib/supabase/types'

interface DishPickerModalProps {
  open: boolean
  onClose: () => void
  familyId: string
  day: DayOfWeek
  mealSlot: MealSlotType
  onConfirm: (dishIds: string[]) => void
}

const SLOT_LABEL: Record<MealSlotType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
}

const DAY_LABEL: Record<DayOfWeek, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu',
  fri: 'Fri', sat: 'Sat', sun: 'Sun',
}

export function DishPickerModal({
  open, onClose, familyId, day, mealSlot, onConfirm,
}: DishPickerModalProps) {
  const [dishes, setDishes] = useState<(Dish & { ingredients: { id: string }[] })[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !familyId) return
    setSelectedIds([])
    setQuery('')
    setTagFilter(null)
    setSaving(false)
    setLoading(true)
    getDishes(familyId).then((data) => {
      setDishes([...data].sort((a, b) => a.name.localeCompare(b.name)))
      setLoading(false)
    })
  }, [open, familyId])

  function toggleDish(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function handleConfirm() {
    if (selectedIds.length === 0) return
    setSaving(true)
    onConfirm(selectedIds)
    onClose()
  }

  const allTags = Array.from(new Set(dishes.flatMap((d) => d.tags ?? [])))

  const filtered = dishes.filter((d) => {
    const matchesQuery = d.name.toLowerCase().includes(query.toLowerCase())
    const matchesTag = tagFilter === null || (d.tags ?? []).includes(tagFilter)
    return matchesQuery && matchesTag
  })

  const title = `Pick dishes — ${DAY_LABEL[day]} ${SLOT_LABEL[mealSlot]}`

  const footer = (
    <button
      onClick={handleConfirm}
      disabled={selectedIds.length === 0 || saving}
      className="w-full py-3 rounded-pill font-semibold text-sm text-white transition-colors disabled:opacity-40"
      style={{ background: 'var(--accent)' }}
    >
      {saving
        ? 'Adding…'
        : selectedIds.length === 0
        ? 'Select dishes to add'
        : `Add ${selectedIds.length} dish${selectedIds.length > 1 ? 'es' : ''} to ${SLOT_LABEL[mealSlot].toLowerCase()}`}
    </button>
  )

  return (
    <Modal open={open} onClose={onClose} title={title} footer={footer}>
      <div className="flex flex-col gap-3">
        {/* Search */}
        <input
          type="search"
          placeholder="Search dishes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          className="w-full rounded-[10px] px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
          style={{
            background: 'var(--surface)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border)',
          }}
        />

        {/* Tag filter */}
        <TagFilter tags={allTags} selected={tagFilter} onSelect={setTagFilter} />

        {/* Selected chips */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {dishes
              .filter((d) => selectedIds.includes(d.id))
              .map((d) => (
                <button
                  key={d.id}
                  onClick={() => toggleDish(d.id)}
                  className="flex items-center gap-1 text-xs font-semibold rounded-pill px-2.5 py-1 transition-colors"
                  style={{ background: 'var(--surface)', color: 'var(--accent)' }}
                >
                  {d.name}
                  <span className="text-[10px]">✕</span>
                </button>
              ))}
          </div>
        )}

        {/* Dish list */}
        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : dishes.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No dishes yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Add dishes in the Dishes tab first.</p>
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--divider)' }}>
            {filtered.length === 0 ? (
              <li className="py-4 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                No dishes match your search.
              </li>
            ) : (
              filtered.map((dish) => {
                const selected = selectedIds.includes(dish.id)
                return (
                  <li key={dish.id}>
                    <button
                      onClick={() => toggleDish(dish.id)}
                      className="w-full flex items-center justify-between px-3 py-3 transition-colors rounded-lg"
                      style={{ background: selected ? 'var(--surface)' : 'transparent' }}
                    >
                      <div className="text-left">
                        <p className="text-sm font-medium" style={{ color: selected ? 'var(--accent)' : 'var(--text-primary)' }}>
                          {dish.name}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
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
                      <div
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-3 transition-colors"
                        style={{
                          borderColor: selected ? 'var(--accent)' : 'var(--text-tertiary)',
                          background: selected ? 'var(--accent)' : 'transparent',
                        }}
                      >
                        {selected && (
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        )}
      </div>
    </Modal>
  )
}
