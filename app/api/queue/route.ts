import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { REQUEST_LIST_SELECT } from '@/lib/supabase/selects'
import type { RequestWithProfile } from '@/lib/types'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch profile for role and department
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, department')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    let query = supabase
      .from('requests')
      .select(REQUEST_LIST_SELECT)
      .eq('status', 'pending')

    // Filter by stage based on role
    if (profile.role === 'hod') {
      query = query.eq('current_stage', 'hod')
    } else if (profile.role === 'approval') {
      query = query.eq('current_stage', 'approval')
    } else if (profile.role === 'admin') {
      query = query.eq('current_stage', 'admin')
    } else if (profile.role === 'super_admin') {
      query = query.eq('current_stage', 'super_admin')
    }

    const { data, error } = await query.order('created_at', { ascending: true })
    if (error) throw error

    return NextResponse.json({ queue: data as unknown as RequestWithProfile[] })

  } catch (error: any) {
    console.error('[queue][GET] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
