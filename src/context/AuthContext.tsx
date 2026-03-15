'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { User, Family } from '@/lib/supabase/types'

interface AuthContextValue {
  supabaseUser: SupabaseUser | null
  profile: User | null
  family: Family | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  supabaseUser: null,
  profile: null,
  family: null,
  loading: true,
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [family, setFamily] = useState<Family | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function loadProfile(userId: string) {
    const { data: profileData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(profileData)

    if (profileData?.family_id) {
      const { data: familyData } = await supabase
        .from('families')
        .select('*')
        .eq('id', profileData.family_id)
        .single()
      setFamily(familyData)
    }
  }

  async function refreshProfile() {
    if (supabaseUser) await loadProfile(supabaseUser.id)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSupabaseUser(user)
      if (user) {
        loadProfile(user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
        setFamily(null)
      }
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AuthContext.Provider value={{ supabaseUser, profile, family, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
