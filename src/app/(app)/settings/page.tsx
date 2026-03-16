'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CopyLinkButton } from '@/components/settings/CopyLinkButton'
import { Spinner } from '@/components/ui/Spinner'
import type { User, Family } from '@/lib/supabase/types'

export default function SettingsPage() {
  const [profile, setProfile] = useState<User | null>(null)
  const [family, setFamily] = useState<Family | null>(null)
  const [members, setMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const [familyName, setFamilyName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [savingFamily, setSavingFamily] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savedFamily, setSavedFamily] = useState(false)
  const [savedProfile, setSavedProfile] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profileData } = await supabase
        .from('users').select('*').eq('id', user.id).single()
      setProfile(profileData)
      setDisplayName(profileData?.name ?? '')

      if (profileData?.family_id) {
        const { data: familyData } = await supabase
          .from('families').select('*').eq('id', profileData.family_id).single()
        setFamily(familyData)
        setFamilyName(familyData?.name ?? '')

        const { data: membersData } = await supabase
          .from('users').select('*').eq('family_id', profileData.family_id)
        setMembers(membersData ?? [])
      }
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSaveFamily(e: React.FormEvent) {
    e.preventDefault()
    if (!family || !familyName.trim()) return
    setSavingFamily(true)
    await supabase.from('families').update({ name: familyName.trim() }).eq('id', family.id)
    setFamily((f) => f ? { ...f, name: familyName.trim() } : f)
    setSavingFamily(false)
    setSavedFamily(true)
    setTimeout(() => setSavedFamily(false), 2000)
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || !displayName.trim()) return
    setSavingProfile(true)
    await supabase.from('users').update({ name: displayName.trim() }).eq('id', profile.id)
    setProfile((p) => p ? { ...p, name: displayName.trim() } : p)
    setSavingProfile(false)
    setSavedProfile(true)
    setTimeout(() => setSavedProfile(false), 2000)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <div className="flex justify-center items-center h-40"><Spinner /></div>

  return (
    <div className="p-4 max-w-lg mx-auto flex flex-col gap-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-[#FED7AA] font-heading">Settings</h1>

      {/* Family name */}
      {family && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Family</h2>
          <form onSubmit={handleSaveFamily} className="flex flex-col gap-3">
            <Input
              label="Family name"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              required
            />
            <Button type="submit" variant="secondary" loading={savingFamily} className="w-full">
              {savedFamily ? '✓ Saved' : 'Save family name'}
            </Button>
          </form>
        </section>
      )}

      {/* Invite link */}
      {family && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Invite link</h2>
          <p className="text-xs text-gray-400 mb-3">Share this link so others can join your family.</p>
          <CopyLinkButton inviteCode={family.invite_code} />
        </section>
      )}

      {/* Family members */}
      {members.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Family members ({members.length})
          </h2>
          <ul className="divide-y divide-gray-50">
            {members.map((m) => (
              <li key={m.id} className="py-2.5 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-semibold">
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.email}</p>
                </div>
                {m.id === profile?.id && (
                  <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">
                    You
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Profile */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Your profile</h2>
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-3">
          <Input
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
          <Input label="Email" value={profile?.email ?? ''} disabled className="opacity-60" />
          <Button type="submit" variant="secondary" loading={savingProfile} className="w-full">
            {savedProfile ? '✓ Saved' : 'Save profile'}
          </Button>
        </form>
      </section>

      {/* Sign out */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <Button variant="ghost" onClick={handleSignOut} className="w-full text-red-500">
          Sign out
        </Button>
      </section>
    </div>
  )
}
