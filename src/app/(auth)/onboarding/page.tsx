'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

function OnboardingContent() {
  const searchParams = useSearchParams()
  const prefillCode = searchParams.get('code') ?? ''

  const [tab, setTab] = useState<'create' | 'join'>(prefillCode ? 'join' : 'create')
  const [familyName, setFamilyName] = useState('')
  const [inviteCode, setInviteCode] = useState(prefillCode)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/families/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: familyName.trim() }),
      })
      const text = await res.text()
      let data: Record<string, unknown>
      try { data = JSON.parse(text) } catch {
        console.error('API returned non-JSON:', text.slice(0, 200))
        setError('Server error — please try again')
        return
      }
      if (!res.ok) { setError((data.error as string) ?? 'Could not create family'); return }
      // Full navigation so middleware re-reads the updated family_id from the DB
      window.location.href = '/plan'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/families/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      })
      const text = await res.text()
      let data: Record<string, unknown>
      try { data = JSON.parse(text) } catch {
        console.error('API returned non-JSON:', text.slice(0, 200))
        setError('Server error — please try again')
        return
      }
      if (!res.ok) { setError((data.error as string) ?? 'Could not join family'); return }
      window.location.href = '/plan'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Set up your family</h2>
      <p className="text-sm text-gray-500 mb-6">Create a new family plan or join an existing one.</p>

      {/* Tabs */}
      <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
        {(['create', 'join'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError('') }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'create' ? 'Create family' : 'Join family'}
          </button>
        ))}
      </div>

      {tab === 'create' ? (
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input
            id="family-name"
            label="Family name"
            placeholder="The Smiths"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">
            Create family
          </Button>
        </form>
      ) : (
        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <Input
            id="invite-code"
            label="Invite code"
            placeholder="e.g. abc12345"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">
            Join family
          </Button>
        </form>
      )}
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-48 bg-gray-100 rounded-xl" />}>
      <OnboardingContent />
    </Suspense>
  )
}
