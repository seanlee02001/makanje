export interface ParsedIngredient {
  name: string
  quantity: number | null
  unit: string | null
}

const UNITS = [
  'cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons', 'tsp', 'teaspoon', 'teaspoons',
  'oz', 'ounce', 'ounces', 'lb', 'lbs', 'pound', 'pounds', 'g', 'gram', 'grams',
  'kg', 'kilogram', 'kilograms', 'ml', 'milliliter', 'milliliters', 'l', 'liter', 'liters',
  'clove', 'cloves', 'can', 'cans', 'slice', 'slices', 'piece', 'pieces', 'bunch', 'handful',
  'pinch', 'dash', 'sprig', 'sprigs', 'stalk', 'stalks', 'head', 'heads',
]

export function parseIngredient(raw: string): ParsedIngredient {
  const trimmed = raw.trim()

  // Pattern: optional number (incl fractions like 1/2), optional unit, rest is name
  const match = trimmed.match(
    /^(\d+(?:[./]\d+)?(?:\s+\d+\/\d+)?)\s+([a-z]+\.?)\s+(.+)$/i
  )

  if (match) {
    const [, qtyStr, possibleUnit, rest] = match
    const unit = UNITS.includes(possibleUnit.toLowerCase().replace(/\.$/, ''))
      ? possibleUnit.toLowerCase().replace(/\.$/, '')
      : null

    const qty = evalFraction(qtyStr)

    if (unit) {
      return { name: rest.trim(), quantity: qty, unit }
    }
    // unit not recognized — treat possibleUnit as part of name
    return { name: `${possibleUnit} ${rest}`.trim(), quantity: qty, unit: null }
  }

  // Just a number then name (no unit)
  const simpleMatch = trimmed.match(/^(\d+(?:[./]\d+)?)\s+(.+)$/)
  if (simpleMatch) {
    return {
      name: simpleMatch[2].trim(),
      quantity: evalFraction(simpleMatch[1]),
      unit: null,
    }
  }

  // No number — just a name
  return { name: trimmed, quantity: null, unit: null }
}

function evalFraction(s: string): number {
  if (s.includes('/')) {
    const [num, den] = s.split('/')
    return parseFloat(num) / parseFloat(den)
  }
  return parseFloat(s)
}
