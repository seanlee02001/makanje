'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PantryItem } from '@/lib/supabase/types'

export function useRealtimePantry(familyId: string | null) {
  const [items, setItems] = useState<PantryItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!familyId) return

    // Initial fetch
    supabase
      .from('pantry_items')
      .select('*')
      .eq('family_id', familyId)
      .order('name')
      .then(({ data }) => {
        setItems(data ?? [])
        setLoading(false)
      })

    // Realtime subscription
    const channel = supabase
      .channel(`pantry:${familyId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pantry_items',
        filter: `family_id=eq.${familyId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setItems((prev) => [...prev, payload.new as PantryItem].sort((a, b) => a.name.localeCompare(b.name)))
        } else if (payload.eventType === 'UPDATE') {
          setItems((prev) => prev.map((i) => i.id === payload.new.id ? payload.new as PantryItem : i))
        } else if (payload.eventType === 'DELETE') {
          setItems((prev) => prev.filter((i) => i.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId])

  return { items, loading }
}
