'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'

function JoinContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code') ?? ''
  const router = useRouter()

  useEffect(() => {
    router.replace(`/onboarding?code=${code}`)
  }, [code, router])

  return null
}

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinContent />
    </Suspense>
  )
}
