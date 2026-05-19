import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const ALLOWED_STATUSES = ['sprint', 'uat', 'completed'] as const
type UCDStatus = typeof ALLOWED_STATUSES[number]

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['ucd', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden — UCD or Super Admin only' }, { status: 403 })
  }

  const body = await req.json() as { status: UCDStatus, comment?: string }
  if (!ALLOWED_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` }, { status: 400 })
  }

  // Verify the request is currently in a deliverable state (approved/sprint/uat)
  const { data: existing } = await supabase
    .from('requests')
    .select('id, title, status')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

  const deliverableStatuses = ['approved', 'sprint', 'uat', 'completed']
  if (!deliverableStatuses.includes(existing.status)) {
    return NextResponse.json(
      { error: 'Only fully-approved requests can have their delivery status changed' },
      { status: 400 },
    )
  }

  const service = await createServiceClient()

  const { error: updateError } = await service
    .from('requests')
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  await service.from('audit_logs').insert({
    actor_id: user.id,
    action: `ucd_status_changed_to_${body.status}`,
    entity_type: 'request',
    entity_id: id,
    metadata: { 
      request_title: existing.title, 
      new_status: body.status,
      previous_status: existing.status,
      comment: body.comment || null 
    },
  })

  return NextResponse.json({ success: true })
}
