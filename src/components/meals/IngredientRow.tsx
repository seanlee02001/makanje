'use client'

import { Input } from '@/components/ui/Input'

export interface IngredientDraft {
  name: string
  quantity: string
  unit: string
}

interface IngredientRowProps {
  value: IngredientDraft
  onChange: (v: IngredientDraft) => void
  onRemove: () => void
  index: number
}

export function IngredientRow({ value, onChange, onRemove, index }: IngredientRowProps) {
  return (
    <div className="flex items-start gap-2">
      <div className="flex-1">
        <Input
          placeholder="Ingredient name"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          aria-label={`Ingredient ${index + 1} name`}
        />
      </div>
      <div className="w-20">
        <Input
          placeholder="Qty"
          type="number"
          min="0"
          step="any"
          value={value.quantity}
          onChange={(e) => onChange({ ...value, quantity: e.target.value })}
          aria-label={`Ingredient ${index + 1} quantity`}
        />
      </div>
      <div className="w-20">
        <Input
          placeholder="Unit"
          value={value.unit}
          onChange={(e) => onChange({ ...value, unit: e.target.value })}
          aria-label={`Ingredient ${index + 1} unit`}
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="mt-0.5 rounded-full p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        aria-label="Remove ingredient"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
