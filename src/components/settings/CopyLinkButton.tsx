'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export function CopyLinkButton({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false)

  const link = typeof window !== 'undefined'
    ? `${window.location.origin}/join?code=${inviteCode}`
    : `/join?code=${inviteCode}`

  async function handleCopy() {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-500 font-mono break-all">
        {link}
      </div>
      <Button variant="secondary" onClick={handleCopy} className="w-full">
        {copied ? '✓ Copied!' : 'Copy invite link'}
      </Button>
    </div>
  )
}
