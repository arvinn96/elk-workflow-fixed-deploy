import { createClient, createServiceClient } from '@/lib/supabase/server'
import { RequestsTable } from '@/components/requests-table'
import { History as HistoryIcon, Search, Filter } from 'lucide-react'
import type { RequestWithProfile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const supabase = await createClient()
  const service = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // 1. Fetch current profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  const isSuperAdmin = profile.role === 'super_admin'
  const isUCD = profile.role === 'ucd'

  let historyRequests: RequestWithProfile[] = []

  // Logic:
  // - UCD: Show all 'completed' (DONE) requests globally for management.
  // - Super Admin: Show all decided/actioned requests globally.
  // - Others: Show only personal action history.

  if (isUCD) {
    // For UCD, history strictly shows completed tickets that need management/recall
    const { data } = await service
      .from('requests')
      .select(`
        *,
        profiles:submitted_by(id, full_name, email, role, department, avatar_url),
        approval_steps(id, request_id, stage, decision, decided_by, comment, decided_at, created_at,
          profiles:decided_by(id, full_name, role)
        )
      `)
      .eq('status', 'completed')
      .order('updated_at', { ascending: false })
    
    historyRequests = (data as RequestWithProfile[]) || []
  } else {
    // For Approvers and Super Admin
    let approvedIds: string[] = []
    let ucdLogIds: string[] = []

    // Get Approval History
    const approvalQuery = service
      .from('approval_steps')
      .select('request_id')
      .neq('decision', 'pending')
    
    if (!isSuperAdmin) {
      approvalQuery.eq('decided_by', user.id)
    }

    const { data: approvalSteps } = await approvalQuery
    approvedIds = approvalSteps?.map(s => s.request_id) || []

    // Get UCD log history if super admin wants to see deployment audit
    if (isSuperAdmin) {
      const { data: auditLogs } = await service
        .from('audit_logs')
        .select('entity_id')
        .eq('entity_type', 'request')
        .ilike('action', 'ucd_status_%')

      ucdLogIds = auditLogs?.map(l => l.entity_id).filter((id): id is string => id !== null) || []
    }

    const allHistoryIds = Array.from(new Set([...approvedIds, ...ucdLogIds]))

    if (allHistoryIds.length > 0) {
      const { data } = await service
        .from('requests')
        .select(`
          *,
          profiles:submitted_by(id, full_name, email, role, department, avatar_url),
          approval_steps(id, request_id, stage, decision, decided_by, comment, decided_at, created_at,
            profiles:decided_by(id, full_name, role)
          )
        `)
        .in('id', allHistoryIds)
        .order('updated_at', { ascending: false })

      historyRequests = (data as RequestWithProfile[]) || []
    }
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-brand-50">
              <HistoryIcon className="h-5 w-5 text-brand-600" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-slate-900">User Action History</h1>
          </div>
          <p className="text-sm text-slate-500 max-w-xl">
            {isUCD 
              ? "Management view of all completed projects. You can recall projects back to delivery if revisions are needed."
              : isSuperAdmin 
                ? "Global overview of all workflow decisions and delivery status changes across the entire system."
                : "A comprehensive audit trail of every project you have personally approved, rejected, or updated."
            }
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Total Records</p>
            <p className="text-xl font-bold text-slate-900 leading-none">{historyRequests.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden min-h-[400px]">
        {historyRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <HistoryIcon className="h-8 w-8 text-slate-200" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No history found yet</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              {isUCD 
                ? "Once projects are marked as 'Done' in the pipeline, they will appear here for management." 
                : "Once you start approving or rejecting projects, they will appear here as your personal audit trail."
              }
            </p>
          </div>
        ) : (
          <RequestsTable 
            requests={historyRequests} 
            userRole={profile.role} 
            allowDeletion={false}
          />
        )}
      </div>
    </div>
  )
}
