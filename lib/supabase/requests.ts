import { createClient, createServiceClient } from '@/lib/supabase/server'
// F-11 FIX: Removed unused 'isDepartment' import
import { type Priority, type RequestStatus, type Role, type RequestWithProfile } from '@/lib/types'
import { REQUEST_DETAIL_SELECT, REQUEST_LIST_SELECT } from '@/lib/supabase/selects'

// F-07 FIX: Expose 'type' as a validated parameter (defaults to 'project' for backward compat)
const VALID_REQUEST_TYPES = ['leave', 'document', 'project'] as const
type RequestType = typeof VALID_REQUEST_TYPES[number]

export interface CreateRequestParams {
  title: string
  // F-07 FIX: type is now a proper parameter, not hardcoded
  type?: RequestType
  sponsored_by?: string
  problem_statement?: string
  proposed_change?: string
  priority_level?: Priority
  expected_impact?: string
  measurement?: string
  effort_estimate?: string
  key_teams?: string
  cross_dept_impact?: string
  dependencies?: string
  desired_timeline?: string
  attachment_url?: string | null
}

export async function createRequestInternal(userId: string, params: CreateRequestParams) {
  const supabaseUser = await createClient()

  const { data: profile, error: profileError } = await supabaseUser
    .from('profiles')
    .select('department, role')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found.')
  }

  // F-06 FIX: Use the user's actual department from their profile.
  // The single-department constraint ('General Operations') is removed —
  // department is derived from the submitter's profile as the schema trigger intends.
  const department = profile.department ?? null

  // F-07 FIX: Validate request type; default to 'project' if not provided
  const requestType: RequestType =
    params.type && VALID_REQUEST_TYPES.includes(params.type) ? params.type : 'project'

  const supabaseAdmin = await createServiceClient()
  const isSuperAdmin = profile.role === 'super_admin'

  let initialStatus: 'pending' | 'approved' = 'pending'
  let initialStage: 'hod' | 'approval' | 'admin' | 'super_admin' | 'complete' = 'hod'

  if (isSuperAdmin) {
    initialStatus = 'approved'
    initialStage = 'complete'
  } else if (profile.role === 'hod') {
    initialStage = 'approval'
  } else if (profile.role === 'approval') {
    initialStage = 'admin'
  } else if (profile.role === 'admin') {
    initialStage = 'super_admin'
  }
  // 'user' role: initialStage stays 'hod' (default)

  const { data: requestRecord, error: requestError } = await supabaseAdmin
    .from('requests')
    .insert({
      title: params.title.trim(),
      type: requestType,
      status: initialStatus,
      current_stage: initialStage,
      submitted_by: userId,
      department,
      sponsored_by: params.sponsored_by?.trim() || null,
      problem_statement: params.problem_statement?.trim() || null,
      proposed_change: params.proposed_change?.trim() || null,
      priority_level: params.priority_level || 'medium',
      expected_impact: params.expected_impact?.trim() || null,
      measurement: params.measurement?.trim() || null,
      effort_estimate: params.effort_estimate?.trim() || null,
      key_teams: params.key_teams?.trim() || null,
      cross_dept_impact: params.cross_dept_impact?.trim() || null,
      dependencies: params.dependencies?.trim() || null,
      desired_timeline: params.desired_timeline?.trim() || null,
      attachment_url: params.attachment_url || null,
    })
    .select(`
      *,
      profiles:submitted_by(id, full_name, email, role, department, avatar_url, created_at),
      approval_steps(*, profiles:decided_by(id, full_name, email, role, department, avatar_url, created_at))
    `)
    .single()

  if (requestError || !requestRecord) {
    throw new Error(requestError?.message ?? 'Failed to create request.')
  }

  // Build the initial approval_steps to insert
  const stepsToInsert: Array<{
    request_id: string
    stage: string
    decision: string
    decided_by?: string | null
    decided_at?: string | null
    comment?: string | null
  }> = []

  if (isSuperAdmin) {
    stepsToInsert.push({
      request_id: requestRecord.id,
      stage: 'hod',
      decision: 'approved',
      decided_by: userId,
      decided_at: new Date().toISOString(),
      comment: 'Administrative Submission (Auto-Approved)',
    })
  } else {
    // F-09 FIX: Removed dead ternary. Determine first stage and decision explicitly.
    const submitterRole = profile.role
    const firstDecision =
      submitterRole === 'hod' || submitterRole === 'approval' || submitterRole === 'admin'
        ? 'approved'
        : 'pending'

    stepsToInsert.push({
      request_id: requestRecord.id,
      stage: 'hod',
      decision: firstDecision,
      decided_by: firstDecision === 'approved' ? userId : null,
      decided_at: firstDecision === 'approved' ? new Date().toISOString() : null,
      comment:
        firstDecision === 'approved'
          ? 'Submitted by Department Head (Auto-Approved HOD Level)'
          : null,
    })

    // If the HOD stage was auto-approved, initialise the next pending step
    if (firstDecision === 'approved' && initialStage !== 'complete') {
      stepsToInsert.push({
        request_id: requestRecord.id,
        stage: initialStage,
        decision: 'pending',
      })
    }
  }

  const { error: stepError } = await supabaseAdmin.from('approval_steps').insert(stepsToInsert)
  if (stepError) {
    await supabaseAdmin.from('requests').delete().eq('id', requestRecord.id)
    throw new Error('Failed to initialize the approval pipeline.')
  }

  await supabaseAdmin.from('audit_logs').insert({
    actor_id: userId,
    action: isSuperAdmin ? 'request_auto_approved' : 'request_submitted',
    entity_type: 'request',
    entity_id: requestRecord.id,
    metadata: {
      request_title: params.title,
      priority: params.priority_level,
      auto_approved: isSuperAdmin,
    },
  })

  return requestRecord as unknown as RequestWithProfile
}

export interface GetRequestsParams {
  userId: string
  offset?: number
  limit?: number
  status?: RequestStatus
  role?: Role
  department?: string | null
  search?: string
}

export async function getRequestsInternal({
  userId,
  offset = 0,
  limit = 20,
  status,
  role,
  department,
  search,
}: GetRequestsParams): Promise<RequestWithProfile[]> {
  const supabase = await createServiceClient()

  // Resolve role and department if not provided
  let userRole = role
  let userDept = department

  if (!userRole) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, department')
      .eq('id', userId)
      .single()
    if (!profile) throw new Error('Unauthorized: Profile not found')
    userRole = profile.role as Role
    userDept = profile.department
  }

  let query = supabase
    .from('requests')
    .select(REQUEST_LIST_SELECT)
    .order('created_at', { ascending: false })

  // Apply role-based filter
  if (userRole === 'hod') {
    query = query.eq('department', userDept || '')
  } else if (!(['approval', 'admin', 'super_admin', 'ucd'] as Role[]).includes(userRole)) {
    // 'user' role: only their own requests
    query = query.eq('submitted_by', userId)
  }

  if (status) {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,department.ilike.%${search}%`)
  }

  const { data, error } = await query.range(offset, offset + limit - 1)
  if (error) throw error

  return (data ?? []) as unknown as RequestWithProfile[]
}

export async function getRequestById(requestId: string): Promise<RequestWithProfile | null> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('requests')
    .select(REQUEST_DETAIL_SELECT)
    .eq('id', requestId)
    .single()

  if (error || !data) return null

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*, profiles:actor_id(id, full_name, role, avatar_url)')
    .eq('entity_id', requestId)
    .order('created_at', { ascending: true })

  return {
    ...(data as unknown as Omit<RequestWithProfile, 'audit_logs'>),
    audit_logs: logs
  } as RequestWithProfile
}

export async function getStatsInternal(userId: string) {
  const supabase = await createServiceClient()
  const { data: profile } = await supabase.from('profiles').select('role, department').eq('id', userId).single()
  
  const role = profile?.role || 'user'
  const dept = profile?.department || ''

  let query = supabase.from('requests').select('status')
  
  if (role === 'hod') {
    query = query.eq('department', dept)
  } else if (!(['approval', 'admin', 'super_admin', 'ucd'].includes(role))) {
    query = query.eq('submitted_by', userId)
  }

  const { data, error } = await query
  if (error) return { total: 0, pending: 0, approved: 0, rejected: 0 }
  
  const stats = {
    total: data?.length || 0,
    pending: data?.filter(r => r.status === 'pending').length || 0,
    approved: data?.filter(r => r.status === 'approved').length || 0,
    rejected: data?.filter(r => r.status === 'rejected').length || 0
  }

  return stats
}