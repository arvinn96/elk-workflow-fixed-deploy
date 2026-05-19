import { createClient } from '@/lib/supabase/server'
import { Activity } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import type { AuditLogWithProfile } from '@/lib/types'

type AuditLogRow = Omit<AuditLogWithProfile, 'profiles'> & {
  profiles: AuditLogWithProfile['profiles'] | AuditLogWithProfile['profiles'][]
}

function normalizeAuditLogs(logs: AuditLogRow[] | null | undefined): AuditLogWithProfile[] {
  return (logs ?? []).map((log) => ({
    ...log,
    profiles: Array.isArray(log.profiles) ? (log.profiles[0] ?? null) : (log.profiles ?? null),
  }))
}

export async function UserDashboardActivity({ userId }: { userId: string }) {
  const supabase = await createClient()

  // First get user's requests to find their IDs
  const { data: requests } = await supabase
    .from('requests')
    .select('id')
    .eq('submitted_by', userId)
  
  const myIds = (requests ?? []).map(r => r.id)
  let activity: AuditLogWithProfile[] = []

  if (myIds.length > 0) {
    const { data } = await supabase
      .from('audit_logs')
      .select('id, actor_id, action, entity_type, entity_id, metadata, created_at, profiles:actor_id(id, full_name, email, role, department, avatar_url, created_at)')
      .in('entity_id', myIds)
      .order('created_at', { ascending: false })
      .limit(8)
    activity = normalizeAuditLogs(data as AuditLogRow[] | null)
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
        <Activity className="h-3.5 w-3.5 text-slate-400" />
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Activity on My Requests</h3>
      </div>
      {activity.length === 0 ? (
        <p className="text-[11px] text-slate-400 text-center py-8">No activity yet</p>
      ) : (
        <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
          {activity.map(log => (
            <div key={log.id} className="px-4 py-3 flex items-start gap-3 hover:bg-slate-50/50 transition-colors">
              <div className="h-1.5 w-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-slate-700 leading-tight">
                  <span className="font-semibold">{log.profiles?.full_name?.split(' ')[0] ?? 'System'}</span>
                  {' '}
                  <span className="text-slate-500">{log.action.replace(/_/g, ' ')}</span>
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

export function ActivitySkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 h-10" />
      <div className="p-4 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-slate-100 mt-1" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-full bg-slate-100 rounded" />
              <div className="h-2 w-24 bg-slate-50 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
