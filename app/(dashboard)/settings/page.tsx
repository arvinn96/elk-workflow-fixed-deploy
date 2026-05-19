import { redirect } from 'next/navigation'
import { ShieldCheck, Users, Workflow, Activity } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ROLE_LABELS, STAGE_ORDER } from '@/lib/types'
import { formatDateTime } from '@/lib/utils'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'super_admin') redirect('/dashboard')

  const [{ data: profilesData }, { data: pendingRequestsData }, { data: latestAudit }] = await Promise.all([
    supabase.from('profiles').select('role'),
    supabase.from('requests').select('current_stage').eq('status', 'pending'),
    supabase.from('audit_logs').select('action, created_at').order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const profiles = profilesData ?? []
  const pendingRequests = pendingRequestsData ?? []

  const roleCounts = profiles.reduce<Record<string, number>>((counts, current) => {
    counts[current.role] = (counts[current.role] ?? 0) + 1
    return counts
  }, {})

  const pendingByStage = pendingRequests.reduce<Record<string, number>>((counts, current) => {
    counts[current.current_stage] = (counts[current.current_stage] ?? 0) + 1
    return counts
  }, {})

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="font-heading text-2xl font-medium text-slate-900">System Settings</h1>
        <p className="mt-0.5 text-sm text-slate-500">Operational overview and governance controls for super admins.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-slate-900">Security posture</p>
          <p className="mt-1 text-sm text-slate-500">Approvals, audits, and user provisioning now route through server-side checks.</p>
        </div>

        <div className="card p-5">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Users className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-slate-900">{profiles.length} active profiles</p>
          <p className="mt-1 text-sm text-slate-500">Role distribution is shown below so you can spot access drift quickly.</p>
        </div>

        <div className="card p-5">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Activity className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-slate-900">Latest audit event</p>
          <p className="mt-1 text-sm text-slate-500">
            {latestAudit ? `${latestAudit.action.replace(/_/g, ' ')} on ${formatDateTime(latestAudit.created_at)}` : 'No audit activity recorded yet.'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <section className="card p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Workflow className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-medium text-slate-900">Workflow Governance</h2>
              <p className="text-sm text-slate-500">Current approval path and pending volume at each stage.</p>
            </div>
          </div>

          <div className="space-y-3">
            {STAGE_ORDER.map((stage, index) => (
              <div key={stage} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-700">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{ROLE_LABELS[stage]}</p>
                    <p className="text-xs text-slate-500">Pending items waiting at this stage</p>
                  </div>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {pendingByStage[stage] ?? 0}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="font-heading text-lg font-medium text-slate-900">Access Model</h2>
          <p className="mt-1 text-sm text-slate-500">Role counts currently provisioned in the workspace.</p>

          <div className="mt-5 space-y-3">
            {(Object.keys(ROLE_LABELS) as Array<keyof typeof ROLE_LABELS>).map((role) => (
              <div key={role} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{ROLE_LABELS[role]}</p>
                  <p className="text-xs text-slate-500">Users assigned this role</p>
                </div>
                <span className="text-sm font-semibold text-slate-700">{roleCounts[role] ?? 0}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
