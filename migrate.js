#!/usr/bin/env node
/**
 * MakanJe — Supabase Migration Runner (Management API)
 *
 * Uses the Supabase Management API — no direct Postgres connection needed.
 *
 * Usage:
 *   SUPABASE_TOKEN=your_token node migrate.js
 *
 * Get your token at:
 *   https://supabase.com/dashboard/account/tokens
 *   → "Generate new token" → copy the value → paste here
 */

const fs = require('fs')
const path = require('path')
const https = require('https')

const PROJECT_REF = 'hprhsmzhfjyhqshciqii'
const TOKEN = process.env.SUPABASE_TOKEN

if (!TOKEN) {
  console.error('\n❌  SUPABASE_TOKEN is required.\n')
  console.error('1. Go to: https://supabase.com/dashboard/account/tokens')
  console.error('2. Click "Generate new token", name it anything (e.g. "migrate")')
  console.error('3. Copy the token and run:\n')
  console.error('   SUPABASE_TOKEN=your_token node migrate.js\n')
  process.exit(1)
}

function apiRequest(query) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query })
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed)
          } else {
            reject(new Error(parsed.message || parsed.error || `HTTP ${res.statusCode}: ${data}`))
          }
        } catch {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({})
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`))
          }
        }
      })
    })

    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function run() {
  console.log('\n🚀  Connecting to Supabase Management API...')

  // Test auth first
  try {
    await apiRequest('SELECT 1')
    console.log('✓  Authenticated\n')
  } catch (err) {
    if (err.message.includes('401') || err.message.toLowerCase().includes('unauthorized')) {
      console.error('\n❌  Token rejected. Make sure you copied the full token from:')
      console.error('    https://supabase.com/dashboard/account/tokens\n')
    } else {
      console.error('\n❌  Connection error:', err.message, '\n')
    }
    process.exit(1)
  }

  const migrationsDir = path.join(__dirname, 'supabase', 'migrations')
  const migrationFiles = fs.readdirSync(migrationsDir).sort()
  const sql = migrationFiles
    .map(f => fs.readFileSync(path.join(migrationsDir, f), 'utf8'))
    .join('\n')

  // Split into individual statements.
  // Strip comment lines from each chunk FIRST so that chunks whose only
  // non-blank content is a comment separator don't accidentally drop a
  // real statement that follows on the next line in the same chunk.
  const statements = sql
    .split(/;\s*\n/)
    .map(s =>
      s.split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .trim()
    )
    .filter(s => s.length > 0)

  let ok = 0
  let skipped = 0
  let errors = 0

  for (const stmt of statements) {
    const preview = stmt.replace(/\s+/g, ' ').slice(0, 70)
    try {
      await apiRequest(stmt)
      console.log(`  ✓  ${preview}`)
      ok++
    } catch (err) {
      const msg = err.message || ''
      const isAlreadyExists =
        msg.includes('already exists') ||
        msg.includes('duplicate') ||
        msg.includes('42710') ||
        msg.includes('42P07') ||
        msg.includes('42723')

      if (isAlreadyExists) {
        console.log(`  ↩  ${preview}  (already exists)`)
        skipped++
      } else {
        console.error(`\n  ❌  ${preview}`)
        console.error(`      ${msg}\n`)
        errors++
      }
    }
  }

  console.log(`\n${ errors === 0 ? '✅' : '⚠️ '} Migration done: ${ok} run, ${skipped} skipped, ${errors} errors.\n`)

  if (errors === 0) {
    console.log('Next steps:')
    console.log('  1. Supabase Dashboard → Database → Replication')
    console.log('     Enable Realtime for:  meal_plan_slots   shopping_lists')
    console.log('  2. npm run dev')
    console.log('  3. Open http://localhost:3000\n')
  }
}

run()
