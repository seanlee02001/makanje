'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signin') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) { setError(err.message); return }
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setError('Sign in failed'); return }
        const { data: profile } = await supabase.from('users').select('family_id').eq('id', user.id).single()
        router.push(profile?.family_id ? '/plan' : '/onboarding')
      } else {
        const { data, error: err } = await supabase.auth.signUp({ email, password })
        if (err) { setError(err.message); return }
        if (!data.user) { setError('Sign up failed'); return }
        const { error: profileErr } = await supabase.from('users').insert({
          id: data.user.id, email, name: name.trim() || email.split('@')[0], family_id: null,
        })
        if (profileErr) { setError(profileErr.message); return }
        router.push('/onboarding')
      }
    } finally { setLoading(false) }
  }

  const inputStyle = {
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
        {mode === 'signin' ? 'Welcome back' : 'Create your account'}
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === 'signup' && (
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Your name</label>
            <input type="text" placeholder="Jane Smith" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full rounded-[6px] px-4 py-3 text-sm focus:outline-none focus:ring-2" style={inputStyle} />
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full rounded-[6px] px-4 py-3 text-sm focus:outline-none focus:ring-2" style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
          <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
            className="w-full rounded-[6px] px-4 py-3 text-sm focus:outline-none focus:ring-2" style={inputStyle} />
        </div>

        {error && (
          <p className="text-sm rounded-[8px] px-3 py-2" style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--error)' }}>{error}</p>
        )}

        <button type="submit" disabled={loading}
          className="w-full mt-2 py-3.5 rounded-pill text-white font-semibold text-sm transition-colors disabled:opacity-60"
          style={{ background: 'var(--accent)' }}
        >
          {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <div className="mt-5 text-center">
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          {mode === 'signin' ? 'New to MakanJe?' : 'Already have an account?'}
        </p>
        <button
          type="button"
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
          className="mt-2 w-full py-3 rounded-pill font-semibold text-sm transition-colors"
          style={{ color: 'var(--accent)', border: '1px solid var(--border)', background: 'var(--surface)' }}
        >
          {mode === 'signin' ? 'Create a Family Account' : 'Sign in instead'}
        </button>
      </div>
    </div>
  )
}
