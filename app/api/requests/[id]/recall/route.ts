import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { STAGE_ORDER } from '@/lib/types'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { stage: targetStage, comment } = await req.json()

    if (!targetStage) {
      return NextResponse.json({ error: 'Target stage is required.' }, { status: 400 })
    }

    if (!comment?.trim()) {
      return NextResponse.json({ error: 'Recall reason is required.' }, { status: 400 })
    }

    const supabaseUser = await createClient()
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Security check: Super Admin only
    const { data: profile } = await supabaseUser
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super Admin only.' }, { status: 403 })
    }

    const supabaseAdmin = await createServiceClient()

    // 2. Fetch current request info for audit
    const { data: request } = await supabaseAdmin
      .from('requests')
      .select('title, status, current_stage')
      .eq('id', id)
      .single()

    if (!request) {
      return NextResponse.json({ error: 'Request not found.' }, { status: 404 })
    }

    // 3. Reset logic: Update request status and stage
    const { error: updateError } = await supabaseAdmin
      .from('requests')
      .update({
        status: 'pending',
        current_stage: targetStage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) throw updateError

    // 4. Cleanup steps: Remove target stage and any subsequent stages
    // We determine "subsequent" based on the STAGE_ORDER
    const targetIndex = STAGE_ORDER.indexOf(targetStage)
    const stagesToRemove = STAGE_ORDER.slice(targetIndex)

    await supabaseAdmin
      .from('approval_steps')
      .delete()
      .eq('request_id', id)
      .in('stage', stagesToRemove)

    // 5. Insert fresh pending step for the target stage
    await supabaseAdmin
      .from('approval_steps')
      .insert({
        request_id: id,
        stage: targetStage,
        decision: 'pending',
      })

    // 6. Audit Log
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: user.id,
      action: 'request_recalled',
      entity_type: 'request',
      entity_id: id,
      metadata: {
        request_title: request.title,
        from_status: request.status,
        from_stage: request.current_stage,
        to_stage: targetStage,
        comment: comment.trim()
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    const { id } = await params
    console.error(`[api/requests/${id}/recall] error:`, error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
