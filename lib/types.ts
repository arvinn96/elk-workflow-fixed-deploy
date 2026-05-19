// ============================================================
// Role definitions (5-level hierarchy)
// ============================================================
export type Role = 'user' | 'hod' | 'approval' | 'admin' | 'super_admin' | 'ucd'
export type Stage = 'hod' | 'approval' | 'admin' | 'super_admin' | 'complete'
export type RequestStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'sprint' | 'uat' | 'completed'
export type RequestType = 'leave' | 'document' | 'project'
export type Decision = 'pending' | 'approved' | 'rejected' | 'returned'

export const STAGE_ORDER: Exclude<Stage, 'complete'>[] = ['hod', 'approval', 'admin', 'super_admin']
export const APPROVER_ROLES = ['hod', 'approval', 'admin', 'super_admin'] as const
export type Priority = 'critical' | 'high' | 'medium' | 'low'

export const ROLE_LABELS: Record<Role, string> = {
  user: 'User',
  hod: 'HOD (A1)',
  approval: 'DT (A2)',
  admin: 'Admin (A3)',
  super_admin: 'Super Admin',
  ucd: 'UCD',
}

// Pipeline tab config used by UCD and Super Admin dashboards
export type PipelineTab = 'inbox' | 'grooming' | 'pending_approval' | 'approved' | 'sprint' | 'uat' | 'completed'

export const PIPELINE_TABS: { id: PipelineTab; label: string; description: string }[] = [
  { id: 'inbox',            label: 'Inbox',            description: 'New & HOD-approved requests' },
  { id: 'grooming',         label: 'Grooming',         description: 'Approved by DT' },
  { id: 'pending_approval', label: 'Pending Approval', description: 'Approved by Admin' },
  { id: 'approved',         label: 'Approved',         description: 'Waiting to start delivery' },
  { id: 'sprint',           label: 'Sprint',           description: 'Active development' },
  { id: 'uat',              label: 'UAT',              description: 'User testing & verification' },
  { id: 'completed',        label: 'Done',             description: 'Successfully deployed' },
]

// UCD delivery statuses that can be applied after Super Admin approval
export const UCD_STATUSES: { value: RequestStatus; label: string; color: string }[] = [
  { value: 'sprint',    label: 'Sprint',    color: '#8b5cf6' },
  { value: 'uat',       label: 'UAT',       color: '#3b82f6' },
  { value: 'completed', label: 'Done',      color: '#10b981' },
]

export const DEPARTMENTS = [
  'General Operations',
] as const

export type Department = typeof DEPARTMENTS[number]
type ApproverRole = typeof APPROVER_ROLES[number]

export function stageForRole(role: Role): Exclude<Stage, 'complete'> | null {
  if (APPROVER_ROLES.includes(role as ApproverRole)) {
    return role as ApproverRole
  }

  return null
}

export function assignableRolesFor(actorRole: Role): Role[] {
  if (actorRole === 'super_admin') {
    return ['user', 'hod', 'approval', 'admin', 'super_admin', 'ucd']
  }
  
  if (actorRole === 'admin') {
    return ['user', 'hod', 'approval', 'admin', 'ucd']
  }

  return []
}

export function canManageUser(actorRole: Role, targetRole: Role): boolean {
  if (actorRole === 'super_admin') {
    return true
  }
  
  if (actorRole === 'admin') {
    return targetRole !== 'super_admin'
  }

  return false
}

export function isDepartment(value: string): value is Department {
  return DEPARTMENTS.includes(value as Department)
}

// ============================================================
// Database types
// ============================================================
export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: Role
  department: string | null
  avatar_url: string | null
  created_at: string
}

export interface Request {
  id: string
  title: string
  description: string | null
  type: RequestType
  status: RequestStatus
  current_stage: Stage
  department: string | null
  submitted_by: string | null
  sponsored_by: string | null
  problem_statement: string | null
  proposed_change: string | null
  priority_level: Priority
  expected_impact: string | null
  measurement: string | null
  effort_estimate: string | null
  key_teams: string | null
  cross_dept_impact: string | null
  dependencies: string | null
  desired_timeline: string | null
  attachment_url: string | null
  created_at: string
  updated_at: string
}

export interface ApprovalStep {
  id: string
  request_id: string
  stage: Exclude<Stage, 'complete'>
  decision: Decision
  decided_by: string | null
  comment: string | null
  decided_at: string | null
  created_at: string
}

export interface AuditLog {
  id: string
  actor_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

// ============================================================
// Extended types with joins
// ============================================================
export interface RequestWithProfile extends Request {
  profiles: Profile | null
  approval_steps: ApprovalStepWithProfile[]
  audit_logs?: AuditLogWithProfile[]
}

export interface ApprovalStepWithProfile extends ApprovalStep {
  profiles: Profile | null
}

export interface AuditLogWithProfile extends AuditLog {
  profiles: Profile | null
}

// ============================================================
// Supabase Database generic type
// ============================================================
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'> & { created_at?: string }
        Update: Partial<Omit<Profile, 'id'>>
      }
      requests: {
        Row: Request
        Insert: Omit<Request, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Request, 'id'>>
      }
      approval_steps: {
        Row: ApprovalStep
        Insert: Omit<ApprovalStep, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<ApprovalStep, 'id'>>
      }
      audit_logs: {
        Row: AuditLog
        Insert: Omit<AuditLog, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<AuditLog, 'id'>>
      }
    }
  }
}
