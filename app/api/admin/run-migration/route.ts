import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabaseUser = await createClient()
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify current user is super_admin
    const { data: profile } = await supabaseUser
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden. Super Admins only.' }, { status: 403 })
    }

    const supabaseAdmin = await createServiceClient()
    const TARGET_DEPARTMENT = 'General Operations'

    console.log('--- STARTING HIGH-FIDELITY DEPARTMENT MIGRATION VIA API ---')

    // 1. Migrate Profiles
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ department: TARGET_DEPARTMENT })
      .neq('department', TARGET_DEPARTMENT)

    if (profileError) throw profileError

    // 2. Migrate Requests
    const { data: requests, error: requestError } = await supabaseAdmin
      .from('requests')
      .update({ department: TARGET_DEPARTMENT })
      .neq('department', TARGET_DEPARTMENT)

    if (requestError) throw requestError

    return NextResponse.json({ 
      success: true, 
      message: 'Migration complete.',
      details: {
        profilesMigrated: profiles ? (profiles as any[]).length : 0,
        requestsMigrated: requests ? (requests as any[]).length : 0
      }
    })

  } catch (error: any) {
    console.error('[MIGRATION API ERROR]:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
