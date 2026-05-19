import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const supabaseUser = await createClient()
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if the user is a super admin
    const { data: profile } = await supabaseUser
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super Admin only.' }, { status: 403 })
    }

    const supabaseAdmin = await createServiceClient()

    // Update the request
    const { data: updatedRequest, error: updateError } = await supabaseAdmin
      .from('requests')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Log the action
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: user.id,
      action: 'request_edited_by_admin',
      entity_type: 'request',
      entity_id: id,
      metadata: {
        request_title: updatedRequest.title,
        edited_fields: Object.keys(body),
      },
    })

    return NextResponse.json({ success: true, data: updatedRequest })
  } catch (error: any) {
    const { id } = await params
    console.error(`[api/requests/${id}][PATCH] error:`, error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
