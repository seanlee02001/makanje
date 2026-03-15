import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
  const { name } = await request.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Family name is required' }, { status: 400 })
  }

  // Verify the caller is authenticated using the normal (RLS-respecting) client
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

  // Use the service role client to bypass RLS for the privileged creation flow
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Create the family
  const { data: family, error: familyError } = await admin
    .from('families')
    .insert({ name: name.trim() })
    .select()
    .single()

  if (familyError || !family) {
    return NextResponse.json({ error: familyError?.message ?? 'Failed to create family' }, { status: 500 })
  }

  // Link the user to the new family
  const { error: userError } = await admin
    .from('users')
    .update({ family_id: family.id })
    .eq('id', user.id)

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  return NextResponse.json({ family })
  } catch (err) {
    console.error('[api/families/create]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
