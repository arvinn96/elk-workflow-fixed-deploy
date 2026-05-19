import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { assignableRolesFor, isDepartment, type Role, type Profile } from '@/lib/types'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const offset = parseInt(searchParams.get('offset') || '0')
    const limit = parseInt(searchParams.get('limit') || '20')
    const q = searchParams.get('q') || ''

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify current user is admin or super_admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let query = supabase
      .from('profiles')
      .select('id, full_name, email, role, department, created_at, avatar_url')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (q) {
      query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,department.ilike.%${q}%`)
    }

    const { data: users, error } = await query
    if (error) throw error

    return NextResponse.json({ users: users as unknown as Profile[] })
  } catch (error: any) {
    console.error('[users][GET] error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabaseUser = await createClient()
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify current user is admin or super_admin
    const { data: profile } = await supabaseUser
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden. Admins only.' }, { status: 403 })
    }

    const body = await req.json()
    const { email, password, fullName, department, role } = body as {
      email: string
      password?: string
      fullName: string
      department: string
      role: Role
    }

    // PROFESSIONALLY enforce single-department architecture
    const TARGET_DEPARTMENT = 'General Operations'

    if (!email || !fullName || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!assignableRolesFor(profile.role as Role).includes(role)) {
      return NextResponse.json({ error: 'Forbidden. You cannot assign that role.' }, { status: 403 })
    }

    // Use Service Role to bypass RLS and session login side-effects
    const supabaseAdmin = await createServiceClient()

    // 1. Create the Auth User with a password
    const { data: newUserAuth, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || undefined,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    })

    if (createError || !newUserAuth.user) {
      console.error('createUser error', createError)
      return NextResponse.json({ error: createError?.message || 'Failed to create user auth' }, { status: 500 })
    }

    const newUserId = newUserAuth.user.id

    // F-10 FIX: Replace fragile setTimeout with a retry-poll loop.
    // Wait for handle_new_user trigger to create the profile row (max 3 attempts).
    let profileExists = false
    for (let attempt = 0; attempt < 3; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)))
      const { data: check } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', newUserId)
        .single()
      if (check) { profileExists = true; break }
    }
    if (!profileExists) {
      // Trigger didn't fire — create the profile manually
      await supabaseAdmin.from('profiles').insert({
        id: newUserId,
        email,
        full_name: fullName,
      })
    }

    // 2. Update their profile (role and department)
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ role, department: 'General Operations' })
      .eq('id', newUserId)

    if (updateError) {
      console.error('update profile error', updateError)
      // Even if the profile update fails, the auth user was created, but they'll just fall back to default role.
      return NextResponse.json({ error: 'Auth created, but failed to update profile role/dept: ' + updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: newUserAuth.user })
  } catch (error: any) {
    console.error('[users][POST] error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}