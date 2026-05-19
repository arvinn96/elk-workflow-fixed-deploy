import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { STAGE_ORDER, type Stage, type Decision } from '@/lib/types'
import { checkRateLimit, MUTATION_RATE_LIMIT } from '@/lib/rate-limit'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // F-08: Rate limit decision mutations to 30/min per IP
    const ip = (req.headers as Headers).get('x-forwarded-for') ?? 'unknown'
    const rl = checkRateLimit(`decision:${ip}`, MUTATION_RATE_LIMIT)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests. Slow down.' }, { status: 429 })
    }

    const { decision, comment } = await req.json() as {
      decision: Decision,
      comment?: string
    }

    if (!id || !decision) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabaseUser = await createClient()
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Get user profile to check role
    const { data: profile } = await supabaseUser
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const supabaseAdmin = await createServiceClient()

    // 2. Get the request to verify current stage
    const { data: request, error: fetchError } = await supabaseAdmin
      .from('requests')
      .select('id, current_stage, status')
      .eq('id', id)
      .single()

    if (fetchError || !request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (request.status !== 'pending') {
      return NextResponse.json({ error: 'Request is no longer pending' }, { status: 400 })
    }

    // 3. PROFESSIONALLY verify if the user has the authority for this stage
    // Note: super_admin can decide at any stage
    const canDecide = profile.role === 'super_admin' || profile.role === request.current_stage
    
    if (!canDecide) {
      return NextResponse.json({ 
        error: `Forbidden: Your role (${profile.role}) does not match the current stage (${request.current_stage})` 
      }, { status: 403 })
    }

    // 4. Determine next stage and final status
    let nextStage: Stage = request.current_stage
    let finalStatus = request.status

    if (decision === 'rejected') {
      finalStatus = 'rejected'
    } else if (decision === 'returned') {
      const currentIndex = STAGE_ORDER.indexOf(request.current_stage as any)
      if (currentIndex > 0) {
        nextStage = STAGE_ORDER[currentIndex - 1] as Stage
        finalStatus = 'pending'
      } else {
        return NextResponse.json({ error: 'Cannot send back from the first stage' }, { status: 400 })
      }
    } else {
      // Approved: find index in STAGE_ORDER
      const currentIndex = STAGE_ORDER.indexOf(request.current_stage as any)
      if (currentIndex === -1 || currentIndex === STAGE_ORDER.length - 1) {
        nextStage = 'complete' as Stage
        finalStatus = 'approved'
      } else {
        nextStage = STAGE_ORDER[currentIndex + 1] as Stage
      }
    }

    // 5. Update the request
    const { error: updateError } = await supabaseAdmin
      .from('requests')
      .update({
        current_stage: nextStage,
        status: finalStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) throw updateError

    // 6. Update/Insert approval step records
    // Find the existing pending step for this stage or create a new one
    const { data: existingStep } = await supabaseAdmin
      .from('approval_steps')
      .select('id')
      .eq('request_id', id)
      .eq('stage', request.current_stage)
      .eq('decision', 'pending')
      .single()

    const now = new Date().toISOString()
    if (existingStep) {
      const { error: updateStepErr } = await supabaseAdmin
        .from('approval_steps')
        .update({
          decision,
          decided_by: user.id,
          decided_at: now,
          comment: comment || null
        })
        .eq('id', existingStep.id)
      if (updateStepErr) throw updateStepErr
    } else {
      // Fallback: create a new step if one wasn't pre-initialized (e.g. for migrations)
      const { error: insertStepErr } = await supabaseAdmin
        .from('approval_steps')
        .insert({
          request_id: id,
          stage: request.current_stage,
          decision,
          decided_by: user.id,
          decided_at: now,
          comment: comment || null
        })
      if (insertStepErr) throw insertStepErr
    }

    // 7. If status is still pending, initialize the NEXT step as pending
    if (finalStatus === 'pending' && nextStage !== 'complete' && nextStage !== request.current_stage) {
      // Check if a pending step ALREADY exists for the next stage to avoid duplicates
      const { data: nextPending } = await supabaseAdmin
        .from('approval_steps')
        .select('id')
        .eq('request_id', id)
        .eq('stage', nextStage)
        .eq('decision', 'pending')
        .single()

      if (!nextPending) {
        await supabaseAdmin
          .from('approval_steps')
          .insert({
            request_id: id,
            stage: nextStage,
            decision: 'pending'
          })
      }
    }

    // 8. Log the action
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: user.id,
      action: `request_${decision}`,
      entity_type: 'request',
      entity_id: id,
      metadata: {
        stage: request.current_stage,
        next_stage: nextStage,
        decision,
        comment: comment || null
      }
    })

    return NextResponse.json({ success: true, finalStatus, nextStage })
  } catch (error: any) {
    console.error('[decision][POST] error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}