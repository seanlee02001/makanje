import { createClient } from '@/lib/supabase/client'
import type { PantryItem } from '@/lib/supabase/types'

export async function getPantryItems(familyId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('family_id', familyId)
    .order('name')
  if (error) throw error
  return data as PantryItem[]
}

export async function addPantryItem(familyId: string, name: string, quantity: number | null, unit: string | null) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pantry_items')
    .insert({ family_id: familyId, name, quantity, unit })
    .select()
    .single()
  if (error) throw error
  return data as PantryItem
}

export async function updatePantryItem(id: string, updates: Partial<Pick<PantryItem, 'name' | 'quantity' | 'unit'>>) {
  const supabase = createClient()
  const { error } = await supabase
    .from('pantry_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deletePantryItem(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('pantry_items').delete().eq('id', id)
  if (error) throw error
}
