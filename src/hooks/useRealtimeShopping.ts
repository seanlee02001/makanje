'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ShoppingList, ShoppingItem } from '@/lib/supabase/types'

export function useRealtimeShopping(familyId: string | null, weekStart: string) {
  const [list, setList] = useState<ShoppingList | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const localUpdateRef = useRef(false)

  useEffect(() => {
    if (!familyId) return

    supabase
      .from('shopping_lists')
      .select('*')
      .eq('family_id', familyId)
      .eq('week_start_date', weekStart)
      .single()
      .then(({ data }) => {
        setList(data)
        setLoading(false)
      })

    const channel = supabase
      .channel(`shopping-${familyId}-${weekStart}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_lists',
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          if (localUpdateRef.current) return // skip echo of our own writes
          if (payload.eventType !== 'DELETE') {
            setList(payload.new as ShoppingList)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId, weekStart])

  async function updateItems(items: ShoppingItem[]) {
    if (!familyId) return
    localUpdateRef.current = true
    setList((prev) => prev ? { ...prev, items } : null)
    await supabase
      .from('shopping_lists')
      .upsert(
        { family_id: familyId, week_start_date: weekStart, items },
        { onConflict: 'family_id,week_start_date' }
      )
    setTimeout(() => { localUpdateRef.current = false }, 500)
  }

  return { list, loading, updateItems }
}
