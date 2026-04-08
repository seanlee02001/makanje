'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Dish } from '@/lib/supabase/types'

interface CookingModeProps {
  dish: Dish
  onClose: () => void
}

export function CookingMode({ dish, onClose }: CookingModeProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const steps = dish.instructions ?? []
  const total = steps.length

  // Wake Lock API
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null
    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen')
        }
      } catch {
        // Wake Lock not supported or denied — continue without it
      }
    }
    requestWakeLock()
    return () => { wakeLock?.release() }
  }, [])

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        setCurrentStep((s) => Math.min(s + 1, total - 1))
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setCurrentStep((s) => Math.max(s - 1, 0))
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [total, onClose])

  // Swipe gesture
  const [touchStartX, setTouchStartX] = useState(0)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
  }, [])
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = touchStartX - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) setCurrentStep((s) => Math.min(s + 1, total - 1))
      else setCurrentStep((s) => Math.max(s - 1, 0))
    }
  }, [touchStartX, total])

  if (total === 0) return null
  const step = steps[currentStep]

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: '#000000' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <button
          onClick={onClose}
          className="text-sm font-medium"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          ✕ Close
        </button>
        <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Step {currentStep + 1} of {total}
        </span>
      </div>

      {/* Dish hero */}
      <div className="px-5 pb-6">
        <p className="text-[24px] font-bold text-white">{dish.name}</p>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.48)' }}>
          {dish.prep_time_min ? `${dish.prep_time_min} min` : ''}
          {dish.prep_time_min && dish.servings ? ' · ' : ''}
          {dish.servings ? `${dish.servings} servings` : ''}
        </p>
      </div>

      {/* Step card */}
      <div className="flex-1 px-5 flex items-center">
        <div
          className="w-full rounded-[16px] p-6"
          style={{ background: '#2a2a2d' }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.8px] mb-4" style={{ color: '#2997ff' }}>
            Step {step.step}
          </p>
          <p className="text-[18px] font-medium text-white leading-[1.5]">
            {step.text}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-5 pb-8 pt-4">
        {/* Dots */}
        <div className="flex justify-center gap-1.5 mb-5">
          {steps.map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-colors"
              style={{ background: i === currentStep ? '#2997ff' : 'rgba(255,255,255,0.2)' }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setCurrentStep((s) => Math.max(s - 1, 0))}
            disabled={currentStep === 0}
            className="flex-1 py-3 rounded-pill text-sm font-semibold transition-colors disabled:opacity-30"
            style={{ color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            ← Prev
          </button>
          <button
            onClick={() => {
              if (currentStep === total - 1) onClose()
              else setCurrentStep((s) => s + 1)
            }}
            className="flex-1 py-3 rounded-pill text-sm font-semibold text-white"
            style={{ background: '#2997ff' }}
          >
            {currentStep === total - 1 ? 'Done' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}
