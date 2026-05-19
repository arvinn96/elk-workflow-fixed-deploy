import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RequestsTable } from '@/components/requests-table'
import { Inbox, FileText, CheckCircle, ArrowRight, Activity } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import type { RequestWithProfile, AuditLogWithProfile } from '@/lib/types'

type AuditLogRow = Omit<AuditLogWithProfile, 'profiles'> & {
  profiles: AuditLogWithProfile['profiles'] | AuditLogWithProfile['profiles'][]
}

function normalizeAuditLogs(logs: AuditLogRow[] | null | undefined): AuditLogWithProfile[] {
  return (logs ?? []).map((log) => ({
    ...log,
    profiles: Array.isArray(log.profiles) ? (log.profiles[0] ?? null) : (log.profiles ?? null),
  }))
}

export async function AdminQueueTable({ role }: { role: string }) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('requests')
    .select('*, profiles(id, full_name, email, role, department, avatar_url), approval_steps(*, profiles:decided_by(id, full_name, email, role, department, avatar_url))')
    .eq('status', 'pending')
    .eq('current_stage', 'admin')
    .order('created_at', { ascending: false })
  
  const queue = (data as RequestWithProfile[]) ?? []

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Inbox className="h-3.5 w-3.5 text-amber-500" />
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pending at Admin Stage</h2>
        </div>
        <Link href="/queue" className="text-[10px] text-brand-600 font-bold uppercase hover:underline flex items-center gap-1">
          Full queue <ArrowRight className="h-2.5 w-2.5" />
        </Link>
      </div>
      {queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <CheckCircle className="h-8 w-8 text-emerald-300 mb-2" />
          <p className="text-sm font-medium text-slate-600">Admin queue is empty</p>
        </div>
      ) : (
        <RequestsTable requests={queue} userRole={role} />
      )}
    </div>
  )
}

export async function AdminRecentRequests({ role }: { role: string }) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('requests')
    .select('*, profiles(id, full_name, email, role, department, avatar_url), approval_steps(*, profiles:decided_by(id, full_name, email, role, department, avatar_url))')
    .order('created_at', { ascending: false })
    .limit(8)
  
  const requests = (data as RequestWithProfile[]) ?? []

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-slate-400" />
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recent System Requests</h2>
        </div>
        <Link href="/requests" className="text-[10px] text-brand-600 font-bold uppercase hover:underline flex items-center gap-1">
          View all <ArrowRight className="h-2.5 w-2.5" />
        </Link>
      </div>
      <RequestsTable requests={requests} userRole={role} />
    </div>
  )
}

export async function AdminSystemActivity() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('audit_logs')
    .select('id, actor_id, action, entity_type, entity_id, metadata, created_at, profiles:actor_id(id, full_name, email, role, department, avatar_url, created_at)')
    .order('created_at', { ascending: false })
    .limit(8)
  
  const auditLogs = normalizeAuditLogs(data as AuditLogRow[] | null)

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
        <Activity className="h-3.5 w-3.5 text-slate-400" />
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Activity</h3>
      </div>
      {auditLogs.length === 0 ? (
        <p className="text-[11px] text-slate-400 text-center py-8">No activity yet</p>
      ) : (
        <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
          {auditLogs.map(log => (
            <div key={log.id} className="px-4 py-3 flex items-start gap-3 hover:bg-slate-50/50 transition-colors">
              <div className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${
                log.action.includes('approve') ? 'bg-emerald-400' :
                log.action.includes('reject') ? 'bg-red-400' : 'bg-brand-400'
              }`} />
              <div className="min-w-0">
                <p className="text-[11px] text-slate-700 leading-tight">
                  <span className="font-semibold">{log.profiles?.full_name?.split(' ')[0] ?? 'System'}</span>
                  {' '}<span className="text-slate-500 capitalize">{log.action.replace(/_/g, ' ')}</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(log.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
