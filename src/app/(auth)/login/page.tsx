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

        const { data: profile } = await supabase
          .from('users').select('family_id').eq('id', user.id).single()

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
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-xl px-4 py-3 text-sm bg-white border border-gray-200 text-gray-900 dark:text-orange-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-400 transition-colors'

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-[#FED7AA] font-heading mb-6">
        {mode === 'signin' ? 'Welcome back' : 'Create your account'}
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === 'signup' && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Your name</label>
            <input
              type="text"
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className={inputClass}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm font-heading transition-colors disabled:opacity-60 shadow-sm shadow-orange-600/30"
        >
          {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <div className="mt-5 text-center">
        <p className="text-sm text-gray-500">
          {mode === 'signin' ? 'New to MakanJe?' : 'Already have an account?'}
        </p>
        <button
          type="button"
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
          className="mt-2 w-full py-3 rounded-2xl border border-orange-200 bg-orange-50 text-orange-600 font-semibold text-sm font-heading hover:bg-orange-100 transition-colors"
        >
          {mode === 'signin' ? 'Create a Family Account' : 'Sign in instead'}
        </button>
      </div>
    </div>
  )
}
