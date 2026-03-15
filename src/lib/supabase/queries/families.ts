import { createClient } from '@/lib/supabase/client'
import type { Family } from '@/lib/supabase/types'

export async function getFamily(familyId: string): Promise<Family | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('families')
    .select('*')
    .eq('id', familyId)
    .single()
  return data
}

export async function createFamily(name: string): Promise<Family | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('families')
    .insert({ name })
    .select()
    .single()
  return data
}

export async function joinFamily(inviteCode: string): Promise<Family | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('families')
    .select('*')
    .eq('invite_code', inviteCode.trim().toLowerCase())
    .single()
  return data
}

export async function updateFamilyName(familyId: string, name: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('families').update({ name }).eq('id', familyId)
}
