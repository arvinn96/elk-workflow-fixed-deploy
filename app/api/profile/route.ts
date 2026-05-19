import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isDepartment } from '@/lib/types'

export async function PATCH(req: Request) {
  try {
    const { fullName, department } = await req.json() as {
      fullName?: string
      department?: string
    }

    // PROFESSIONALLY enforce single-department architecture
    const TARGET_DEPARTMENT = 'General Operations'

    if (!fullName?.trim()) {
      return NextResponse.json({ error: 'A valid name is required.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        department: TARGET_DEPARTMENT,
      })
      .eq('id', user.id)
      .select('id, full_name, email, role, department, avatar_url')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Failed to update profile.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, profile: data })
  } catch (error) {
    console.error('[profile][PATCH] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
