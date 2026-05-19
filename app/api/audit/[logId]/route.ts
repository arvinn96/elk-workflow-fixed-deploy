import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ logId: string }> }
) {
  try {
    const { logId } = await params
    const supabaseUser = await createClient()
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if actor is Admin or Super Admin
    const { data: actor } = await supabaseUser
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
      return NextResponse.json({ error: 'Forbidden. Admin access required to delete logs.' }, { status: 403 })
    }

    const supabaseAdmin = await createServiceClient()
    
    // Perform the deletion
    const { error: deleteError } = await supabaseAdmin
      .from('audit_logs')
      .delete()
      .eq('id', logId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[audit][DELETE] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
