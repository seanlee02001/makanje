'use client'

import { useState, useEffect } from 'react'

export function OfflineBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    setOffline(!navigator.onLine)
    const onOnline = () => setOffline(false)
    const onOffline = () => setOffline(true)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-white text-xs font-medium text-center py-2 px-4">
      You&apos;re offline — viewing cached data. Changes won&apos;t sync until you reconnect.
    </div>
  )
}
