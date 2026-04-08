'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CopyLinkButton } from '@/components/settings/CopyLinkButton'
import { Spinner } from '@/components/ui/Spinner'
import type { User, Family } from '@/lib/supabase/types'

type ThemePref = 'system' | 'light' | 'dark'

function getThemePref(): ThemePref {
  if (typeof window === 'undefined') return 'system'
  const stored = localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark') return stored
  return 'system'
}

function setThemePref(pref: ThemePref) {
  if (pref === 'system') {
    localStorage.removeItem('theme')
    document.documentElement.removeAttribute('data-theme')
  } else {
    localStorage.setItem('theme', pref)
    document.documentElement.setAttribute('data-theme', pref)
  }
}

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
  const [theme, setTheme] = useState<ThemePref>('system')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setTheme(getThemePref())
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profileData } = await supabase.from('users').select('*').eq('id', user.id).single()
      setProfile(profileData)
      setDisplayName(profileData?.name ?? '')
      if (profileData?.family_id) {
        const { data: familyData } = await supabase.from('families').select('*').eq('id', profileData.family_id).single()
        setFamily(familyData)
        setFamilyName(familyData?.name ?? '')
        const { data: membersData } = await supabase.from('users').select('*').eq('family_id', profileData.family_id)
        setMembers(membersData ?? [])
      }
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleThemeChange(pref: ThemePref) {
    setTheme(pref)
    setThemePref(pref)
  }

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

  const sectionStyle = { background: 'var(--surface)', borderRadius: '12px', padding: '16px' }

  return (
    <div className="p-5 max-w-lg mx-auto flex flex-col gap-5">
      <h1 className="text-[28px] font-bold tracking-[-0.5px]" style={{ color: 'var(--text-primary)' }}>Settings</h1>

      {/* Family */}
      {family && (
        <section style={sectionStyle}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Family</h2>
          <form onSubmit={handleSaveFamily} className="flex flex-col gap-3">
            <Input label="Family name" value={familyName} onChange={(e) => setFamilyName(e.target.value)} required />
            <Button type="submit" variant="secondary" loading={savingFamily} className="w-full">
              {savedFamily ? '✓ Saved' : 'Save family name'}
            </Button>
          </form>
        </section>
      )}

      {/* Invite */}
      {family && (
        <section style={sectionStyle}>
          <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Invite link</h2>
          <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>Share this link so others can join your family.</p>
          <CopyLinkButton inviteCode={family.invite_code} />
        </section>
      )}

      {/* Members */}
      {members.length > 0 && (
        <section style={sectionStyle}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Family members ({members.length})
          </h2>
          <ul className="divide-y" style={{ borderColor: 'var(--divider)' }}>
            {members.map((m) => (
              <li key={m.id} className="py-2.5 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold" style={{ background: 'var(--accent)', color: '#ffffff' }}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{m.email}</p>
                </div>
                {m.id === profile?.id && (
                  <span className="ml-auto text-xs rounded-pill px-2 py-0.5 font-medium" style={{ background: 'var(--accent)', color: '#ffffff' }}>
                    You
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Appearance */}
      <section style={sectionStyle}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Appearance</h2>
        <div className="flex gap-2">
          {(['system', 'light', 'dark'] as ThemePref[]).map((pref) => (
            <button
              key={pref}
              onClick={() => handleThemeChange(pref)}
              className="flex-1 py-2 rounded-[8px] text-xs font-semibold capitalize transition-colors"
              style={{
                background: theme === pref ? 'var(--accent)' : 'var(--canvas)',
                color: theme === pref ? '#ffffff' : 'var(--text-secondary)',
                border: `1px solid ${theme === pref ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {pref}
            </button>
          ))}
        </div>
      </section>

      {/* Profile */}
      <section style={sectionStyle}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Your profile</h2>
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-3">
          <Input label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          <Input label="Email" value={profile?.email ?? ''} disabled className="opacity-60" />
          <Button type="submit" variant="secondary" loading={savingProfile} className="w-full">
            {savedProfile ? '✓ Saved' : 'Save profile'}
          </Button>
        </form>
      </section>

      {/* Sign out */}
      <section style={sectionStyle}>
        <button onClick={handleSignOut} className="w-full text-center text-sm font-semibold" style={{ color: 'var(--error)' }}>
          Sign out
        </button>
      </section>
    </div>
  )
}
