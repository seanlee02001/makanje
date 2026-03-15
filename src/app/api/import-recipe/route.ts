import { NextRequest, NextResponse } from 'next/server'
import { parseIngredient } from '@/lib/utils/parseIngredients'

interface ParsedRecipe {
  title: string
  ingredients: Array<{ name: string; quantity: number | null; unit: string | null }>
  error?: string
}

// Attempt to extract JSON-LD recipe schema from HTML
function extractJsonLd(html: string): ParsedRecipe | null {
  const matches = html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)
  for (const match of matches) {
    try {
      const json = JSON.parse(match[1])
      const schemas = Array.isArray(json) ? json : json['@graph'] ? json['@graph'] : [json]
      for (const schema of schemas) {
        if (schema['@type'] === 'Recipe' || schema['@type']?.includes?.('Recipe')) {
          const title = schema.name ?? ''
          const rawIngredients: string[] = schema.recipeIngredient ?? []
          const ingredients = rawIngredients.map((raw) => parseIngredient(raw))
          return { title, ingredients }
        }
      }
    } catch {
      continue
    }
  }
  return null
}

// Fallback: extract title tag and look for ingredient-like list items
function extractFallback(html: string): ParsedRecipe {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const title = titleMatch ? titleMatch[1].replace(/\s*[|–-].*$/, '').trim() : ''

  // Look for common ingredient class patterns
  const ingredientPattern = /class="[^"]*ingredient[^"]*"[^>]*>([^<]+)</gi
  const ingredients: Array<{ name: string; quantity: number | null; unit: string | null }> = []
  let m: RegExpExecArray | null
  while ((m = ingredientPattern.exec(html)) !== null && ingredients.length < 50) {
    const text = m[1].replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim()
    if (text.length > 1) {
      ingredients.push(parseIngredient(text))
    }
  }

  return { title, ingredients, error: ingredients.length === 0 ? 'parse_failed' : undefined }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ title: '', ingredients: [], error: 'invalid_url' }, { status: 400 })
    }

    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({ title: '', ingredients: [], error: 'invalid_url' }, { status: 400 })
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ title: '', ingredients: [], error: 'invalid_url' }, { status: 400 })
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MakanJe/1.0; recipe-importer)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      return NextResponse.json({ title: '', ingredients: [], error: 'fetch_failed' })
    }

    const html = await response.text()

    // Try JSON-LD first (most reliable)
    const jsonLdResult = extractJsonLd(html)
    if (jsonLdResult && jsonLdResult.ingredients.length > 0) {
      return NextResponse.json(jsonLdResult)
    }

    // Fallback HTML parsing
    const fallback = extractFallback(html)
    return NextResponse.json(fallback)
  } catch (err) {
    console.error('import-recipe error:', err)
    return NextResponse.json({ title: '', ingredients: [], error: 'parse_failed' })
  }
}
