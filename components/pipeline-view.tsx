'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, RefreshCw, FileText, Zap, Clock, CircleCheck, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, formatDateTime, getInitials } from '@/lib/utils'
import { StatusBadge } from '@/components/status-badge'
import { TypeBadge } from '@/components/type-badge'
import { PipelineTracker } from '@/components/pipeline-tracker'
import dynamic from 'next/dynamic'
const ViewRequestDrawer = dynamic(
  () => import('@/components/view-request-drawer').then(m => m.ViewRequestDrawer),
  { ssr: false }
)
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import type { PipelineTab, RequestWithProfile, RequestStatus } from '@/lib/types'
import { PIPELINE_TABS, UCD_STATUSES } from '@/lib/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Mail, Search, ClipboardList, CheckCircle2,
} from 'lucide-react'
import { RecallConfirmDialog } from './recall-confirm-dialog'
import { UCDStatusConfirmDialog } from './ucd-status-confirm-dialog'

interface Props {
  canChangeStatus: boolean
  userRole: string
}

const TAB_ICONS: Record<PipelineTab, React.ElementType> = {
  inbox:            Mail,
  grooming:         Search,
  pending_approval: ClipboardList,
  approved:         CheckCircle2,
  sprint:           Zap,
  uat:              Clock,
  completed:        CircleCheck,
}

const TAB_COLORS: Record<PipelineTab, string> = {
  inbox:            '#6366f1',
  grooming:         '#8b5cf6',
  pending_approval: '#f97316',
  approved:         '#10b981',
  sprint:           '#8b5cf6',
  uat:              '#3b82f6',
  completed:        '#0ea5e9',
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  sprint:    Zap,
  uat:       Clock,
  completed: CircleCheck,
}

async function fetchTab(tab: PipelineTab): Promise<RequestWithProfile[]> {
  const supabase = createClient()
  let q = supabase
    .from('requests')
    .select(
      '*, profiles(id, full_name, email, role, department, avatar_url), approval_steps(id, request_id, stage, decision, decided_by, comment, decided_at, created_at)'
    )
    .order('created_at', { ascending: false })

  switch (tab) {
    case 'inbox':
      q = q.eq('status', 'pending').in('current_stage', ['hod', 'approval'])
      break
    case 'grooming':
      q = q.eq('status', 'pending').eq('current_stage', 'admin')
      break
    case 'pending_approval':
      q = q.eq('status', 'pending').eq('current_stage', 'super_admin')
      break
    case 'approved':
      q = q.eq('status', 'approved')
      break
    case 'sprint':
      q = q.eq('status', 'sprint')
      break
    case 'uat':
      q = q.eq('status', 'uat')
      break
    case 'completed':
      q = q.eq('status', 'completed')
      break
  }

  const { data } = await q
  return (data as RequestWithProfile[]) ?? []
}

export function PipelineView({ canChangeStatus, userRole }: Props) {
  const [activeTab, setActiveTab] = useState<PipelineTab>('inbox')
  const [counts, setCounts] = useState<Record<PipelineTab, number>>({
    inbox: 0, grooming: 0, pending_approval: 0, approved: 0, sprint: 0, uat: 0, completed: 0,
  })
  const [requests, setRequests] = useState<RequestWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [changingStatus, setChangingStatus] = useState<string | null>(null)
  
  // UCD Status change state
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ id: string, newStatus: RequestStatus, currentStatus: RequestStatus } | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  
  // Recall state
  const [recallTarget, setRecallTarget] = useState<{ id: string, stage: string } | null>(null)
  const [isRecalling, setIsRecalling] = useState(false)

  const [selectedRequest, setSelectedRequest] = useState<RequestWithProfile | null>(null)

  const loadTab = useCallback(async (tab: PipelineTab) => {
    setLoading(true)
    setRequests(await fetchTab(tab))
    setLoading(false)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    async function loadCounts() {
      const [a, b, c, d, e, f, g] = await Promise.all([
        supabase.from('requests').select('id', { count: 'exact', head: true }).eq('status', 'pending').in('current_stage', ['hod', 'approval']),
        supabase.from('requests').select('id', { count: 'exact', head: true }).eq('status', 'pending').eq('current_stage', 'admin'),
        supabase.from('requests').select('id', { count: 'exact', head: true }).eq('status', 'pending').eq('current_stage', 'super_admin'),
        supabase.from('requests').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('requests').select('id', { count: 'exact', head: true }).eq('status', 'sprint'),
        supabase.from('requests').select('id', { count: 'exact', head: true }).eq('status', 'uat'),
        supabase.from('requests').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      ])
      setCounts({ 
        inbox: a.count ?? 0, 
        grooming: b.count ?? 0, 
        pending_approval: c.count ?? 0, 
        approved: d.count ?? 0,
        sprint: e.count ?? 0,
        uat: f.count ?? 0,
        completed: g.count ?? 0
      })
    }
    void loadCounts()
  }, [])

  useEffect(() => { void loadTab(activeTab) }, [activeTab, loadTab])

  async function handleStatusChange(requestId: string, newStatus: RequestStatus, currentStatus: RequestStatus) {
    setPendingStatusUpdate({ id: requestId, newStatus, currentStatus })
  }

  async function handleConfirmStatusChange(comment: string) {
    if (!pendingStatusUpdate) return
    setIsUpdatingStatus(true)
    
    const toastId = toast.loading(`Updating to ${pendingStatusUpdate.newStatus.toUpperCase()}...`)
    try {
      const res = await fetch(`/api/requests/${pendingStatusUpdate.id}/ucd-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: pendingStatusUpdate.newStatus,
          comment: comment 
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      toast.success(`Marked as ${pendingStatusUpdate.newStatus.toUpperCase()}`, { id: toastId })
      setPendingStatusUpdate(null)
      loadTab(activeTab)
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Update failed', { id: toastId })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  async function handleRecall(requestId: string, targetStage: string) {
    setRecallTarget({ id: requestId, stage: targetStage })
  }

  async function handleConfirmRecall(comment: string) {
    if (!recallTarget) return
    setIsRecalling(true)
    const toastId = toast.loading('Recalling...')
    try {
      const res = await fetch(`/api/requests/${recallTarget.id}/recall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          stage: recallTarget.stage,
          comment: comment 
        })
      })
      if (!res.ok) throw new Error('Recall failed')
      
      toast.success('Project recalled', { id: toastId })
      setRecallTarget(null)
      loadTab(activeTab) // Refresh the current column
    } catch (err: any) {
      toast.error(err.message, { id: toastId })
    } finally {
      setIsRecalling(false)
    }
  }

  // Removed redundant showDeliveryCol because we use the in-place dropdown on the status badge
  return (
    <div className="space-y-4">
      {/* Tab Bar — stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {PIPELINE_TABS.map(({ id, label, description }) => {
          const Icon = TAB_ICONS[id]
          const color = TAB_COLORS[id]
          const isActive = activeTab === id
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'relative text-left p-4 rounded-xl border transition-all duration-150',
                isActive
                  ? 'border-slate-300 bg-white shadow-md'
                  : 'border-slate-100 bg-white/60 hover:bg-white hover:border-slate-200 hover:shadow-sm',
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-4 right-4 h-[2px] rounded-b-full" style={{ background: color }} />
              )}
              <div className="flex items-center justify-between mb-2">
                <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                  <Icon className="h-3.5 w-3.5" style={{ color }} />
                </div>
                <span className="text-xl font-black tabular-nums leading-none" style={{ color: isActive ? color : '#94a3b8' }}>
                  {counts[id]}
                </span>
              </div>
              <p className={cn('text-[10px] font-black uppercase tracking-widest leading-none', isActive ? 'text-slate-900' : 'text-slate-400')}>
                {label}
              </p>
              <p className="text-[9px] text-slate-400 mt-1 leading-tight">{description}</p>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table header bar */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(() => { const Icon = TAB_ICONS[activeTab]; return <Icon className="h-4 w-4" style={{ color: TAB_COLORS[activeTab] }} /> })()}
            <span className="text-xs font-black uppercase tracking-widest text-slate-700">
              {PIPELINE_TABS.find(t => t.id === activeTab)?.label}
            </span>
            <span className="text-[10px] text-slate-400">— {loading ? '…' : `${requests.length} requests`}</span>
          </div>
          <button
            onClick={() => void loadTab(activeTab)}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            <p className="text-xs text-slate-400">Loading…</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <FileText className="h-8 w-8 text-slate-200" />
            <p className="text-sm font-bold text-slate-400">No requests in this stage</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Request</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:table-cell">Submitted By</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">Type</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell text-center w-[240px]">Pipeline</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-[140px]">Status</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {requests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedRequest(req)}
                  >
                    {/* Request title */}
                    <td className="px-5 py-4 align-middle">
                      <p className="text-sm font-bold text-slate-900 truncate max-w-[180px] group-hover:text-brand-600 transition-colors leading-tight">
                        {req.title}
                      </p>
                      <p className="text-[10px] text-slate-400 tabular-nums mt-0.5 hidden sm:block">
                        #{req.id.slice(0, 8).toUpperCase()}
                      </p>
                    </td>

                    {/* Submitted by */}
                    <td className="px-5 py-4 align-middle hidden sm:table-cell whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7 rounded-full border border-slate-200">
                          <AvatarImage src={req.profiles?.avatar_url ?? undefined} />
                          <AvatarFallback className="text-[10px] bg-slate-100 font-bold text-slate-500">
                            {getInitials(req.profiles?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-slate-600 truncate max-w-[120px]">
                          {req.profiles?.full_name ?? '—'}
                        </span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-5 py-4 align-middle hidden md:table-cell whitespace-nowrap">
                      <TypeBadge type={req.type} />
                    </td>

                    {/* Pipeline tracker */}
                    <td className="px-5 py-4 align-middle hidden lg:table-cell w-[240px]">
                      <div className="flex justify-center">
                        <PipelineTracker
                          currentStage={req.current_stage}
                          status={req.status}
                          steps={req.approval_steps ?? []}
                          compact
                          onStageClick={userRole === 'super_admin' ? (stage) => handleRecall(req.id, stage) : undefined}
                        />
                      </div>
                    </td>

                    {/* Status badge - Interactive for UCD */}
                    <td className="px-5 py-4 align-middle text-center w-[140px]">
                      <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                        {userRole === 'ucd' && ['approved', 'sprint', 'uat', 'completed'].includes(req.status) ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger className="focus:outline-none hover:opacity-80 transition-opacity">
                                <StatusBadge status={req.status} />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                {UCD_STATUSES.map((status) => (
                                  <DropdownMenuItem
                                    key={status.value}
                                    onClick={() => void handleStatusChange(req.id, status.value, req.status)}
                                    className="text-xs font-semibold"
                                  >
                                    <div className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: status.color }} />
                                    {status.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                          <StatusBadge status={req.status} />
                        )}
                      </div>
                    </td>

                    {/* View action */}
                    <td className="px-5 py-4 align-middle text-right">
                      <div className="p-1.5 inline-flex text-slate-300 group-hover:text-brand-600 group-hover:bg-brand-50 rounded-md transition-all">
                        <Eye className="h-4 w-4" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ViewRequestDrawer
        request={selectedRequest}
        open={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        userRole={userRole}
        onRefresh={() => void loadTab(activeTab)}
      />

      <RecallConfirmDialog 
        isOpen={!!recallTarget}
        onOpenChange={(open) => !open && setRecallTarget(null)}
        onConfirm={handleConfirmRecall}
        targetStage={recallTarget?.stage || ''}
        isActionLoading={isRecalling}
      />

      <UCDStatusConfirmDialog 
        isOpen={!!pendingStatusUpdate}
        onOpenChange={(open) => !open && setPendingStatusUpdate(null)}
        onConfirm={handleConfirmStatusChange}
        currentStatus={pendingStatusUpdate?.currentStatus || 'approved'}
        newStatus={pendingStatusUpdate?.newStatus || null}
        isActionLoading={isUpdatingStatus}
      />
    </div>
  )
}
