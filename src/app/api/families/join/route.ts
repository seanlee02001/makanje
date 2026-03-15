import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
  const { inviteCode } = await request.json()
  if (!inviteCode?.trim()) {
    return NextResponse.json({ error: 'Invite code is required' }, { status: 400 })
  }

  // Verify the caller is authenticated
  const cookieStore = await cookies()
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
          catch { /* Server Component, safe to ignore */ }
        },
      },
    }
  )

  const { data: { user }, error: authError } = await authClient.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use service role to bypass RLS
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Find the family by invite code
  const { data: family, error: findError } = await admin
    .from('families')
    .select('*')
    .eq('invite_code', inviteCode.trim().toLowerCase())
    .single()

  if (findError || !family) {
    return NextResponse.json({ error: 'Invite code not found. Double-check and try again.' }, { status: 404 })
  }

  // Link the user to the family
  const { error: userError } = await admin
    .from('users')
    .update({ family_id: family.id })
    .eq('id', user.id)

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  return NextResponse.json({ family })
  } catch (err) {
    console.error('[api/families/join]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
