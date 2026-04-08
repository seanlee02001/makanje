'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { MealPlanSlot } from '@/lib/supabase/types'

const SLOT_SELECT = '*, slot_dishes(*, dish:dishes(*, ingredients(*)))'

export function useRealtimeSlots(familyId: string | null, weekStart: string) {
  const [slots, setSlots] = useState<MealPlanSlot[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!familyId) return

    supabase
      .from('meal_plan_slots')
      .select(SLOT_SELECT)
      .eq('family_id', familyId)
      .eq('week_start_date', weekStart)
      .order('sort_order', { referencedTable: 'slot_dishes', ascending: true })
      .then(({ data }) => {
        setSlots((data as MealPlanSlot[]) ?? [])
        setLoading(false)
      })

    const channel = supabase
      .channel(`slots-${familyId}-${weekStart}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meal_plan_slots',
          filter: `family_id=eq.${familyId}`,
        },
        async (payload) => {
          if (payload.eventType === 'DELETE') {
            setSlots((prev) => prev.filter((s) => s.id !== (payload.old as MealPlanSlot).id))
          } else {
            const { data: updated } = await supabase
              .from('meal_plan_slots')
              .select(SLOT_SELECT)
              .eq('id', (payload.new as MealPlanSlot).id)
              .single()
            if (updated) {
              setSlots((prev) => {
                const exists = prev.some((s) => s.id === updated.id)
                return exists
                  ? prev.map((s) => s.id === updated.id ? updated as MealPlanSlot : s)
                  : [...prev, updated as MealPlanSlot]
              })
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'slot_dishes',
        },
        async () => {
          // Refetch all slots when slot_dishes change
          const { data } = await supabase
            .from('meal_plan_slots')
            .select(SLOT_SELECT)
            .eq('family_id', familyId)
            .eq('week_start_date', weekStart)
            .order('sort_order', { referencedTable: 'slot_dishes', ascending: true })
          setSlots((data as MealPlanSlot[]) ?? [])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId, weekStart])

  return { slots, loading }
}
