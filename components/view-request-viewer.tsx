'use client'

import React from 'react'
import { 
  FileText, TrendingUp, Info, Layers, ExternalLink, 
  Calendar as CalendarIcon, Eye, Download, Paperclip, 
  ImageIcon, Workflow, RotateCcw
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/status-badge'
import { TypeBadge } from '@/components/type-badge'
import { formatDateTime, cn, getInitials } from '@/lib/utils'
import type { RequestWithProfile } from '@/lib/types'
import { ROLE_LABELS } from '@/lib/types'
import { RequestDecisionActions } from '@/components/request-decision-actions'

interface Props {
  request: RequestWithProfile
  userRole?: string
  onEdit: () => void
  onGenerateBrd: () => void
  isGeneratingBrd: boolean
  onClose: () => void
  onRefresh?: () => void
}

/**
 * NORMALIZE HELPER
 * Supabase sometimes returns joined records as an array if the relationship is ambiguous.
 */
function normalizeProfile(p: any) {
  if (!p) return null
  if (Array.isArray(p)) return p[0] || null
  return p
}

export function ViewRequestViewer({ 
  request: rawRequest, userRole, onEdit, onGenerateBrd, 
  isGeneratingBrd, onClose, onRefresh 
}: Props) {
  const [showFullProblem, setShowFullProblem] = React.useState(false)
  const isSuperAdmin = userRole === 'super_admin'
  const canGenerateBrd = ['hod', 'approval', 'admin', 'super_admin'].includes(userRole ?? '')

  // Normalize request and nested profiles immediately to prevent rendering crashes
  const request = React.useMemo(() => {
    if (!rawRequest) return null
    return {
      ...rawRequest,
      profiles: normalizeProfile(rawRequest.profiles),
      approval_steps: (rawRequest.approval_steps || []).map(step => ({
        ...step,
        profiles: normalizeProfile(step.profiles)
      })),
      audit_logs: (rawRequest.audit_logs || []).map(log => ({
        ...log,
        profiles: normalizeProfile(log.profiles)
      }))
    }
  }, [rawRequest])

  // If request is still null after memo, don't crash
  if (!request) return null

  const labelCls = 'text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5'
  const valueCls = 'text-sm text-slate-800 leading-relaxed font-medium'
  const sectionHeaderCls = 'flex items-center gap-2 border-b border-slate-100 pb-2 mb-4'
  const sectionTitleCls = 'text-[11px] font-black uppercase tracking-[0.1em] text-slate-900'

  const displayId = request.id?.slice ? request.id.slice(0, 8).toUpperCase() : 'UNKNOWN'

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-8 pt-6 pb-0 shrink-0">
        <div className="flex items-center justify-between mb-4 gap-6">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-brand-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">
                Request ID: <span className="text-slate-900">#{displayId}</span>
              </div>
              <h2 className="text-xl font-heading font-black text-slate-900 mt-1">
                {request.title}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canGenerateBrd && (
              <button
                type="button"
                onClick={onGenerateBrd}
                disabled={isGeneratingBrd}
                className="flex items-center gap-1.5 h-7 px-3 rounded-full bg-brand-600 text-white text-[9px] font-bold uppercase tracking-widest hover:bg-brand-700 transition-all shadow-sm disabled:opacity-50 shrink-0"
              >
                {isGeneratingBrd ? 'Generating...' : 'Draft BRD with AI'}
              </button>
            )}
            {isSuperAdmin && (
              <button
                onClick={onEdit}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-full border border-slate-200 bg-white text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:border-brand-300 hover:text-brand-600 transition-all shadow-sm shrink-0"
              >
                Edit
              </button>
            )}
            <StatusBadge status={request.status} />
            <TypeBadge type={request.type} />
          </div>
        </div>
        <div className="h-[3px] bg-brand-600" />
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            {/* Core Details */}
            <section>
              <div className={sectionHeaderCls}>
                <Info className="h-3.5 w-3.5 text-brand-600" />
                <h3 className={sectionTitleCls}>Core Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className={labelCls}>Sponsored By</p>
                  <p className={valueCls}>{request.sponsored_by || '-'}</p>
                </div>
                <div>
                  <p className={labelCls}>Priority Level</p>
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                       "h-1.5 w-1.5 rounded-full",
                       request.priority_level === 'critical' ? 'bg-red-500' :
                       request.priority_level === 'high' ? 'bg-orange-500' :
                       request.priority_level === 'medium' ? 'bg-amber-500' : 'bg-slate-400'
                    )} />
                    <p className={cn("text-xs font-bold uppercase tracking-wider", 
                       request.priority_level === 'critical' ? 'text-red-600' :
                       request.priority_level === 'high' ? 'text-orange-600' :
                       request.priority_level === 'medium' ? 'text-amber-600' : 'text-slate-500'
                    )}>
                      {request.priority_level}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Problem & Impact */}
            <section>
              <div className={sectionHeaderCls}>
                <TrendingUp className="h-3.5 w-3.5 text-brand-600" />
                <h3 className={sectionTitleCls}>Problem Statement & Impact</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <p className={labelCls}>PROBLEM STATEMENT</p>
                  <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-100 text-sm text-slate-600 leading-relaxed">
                    <div 
                      className={cn("prose prose-sm max-w-none", !showFullProblem && "line-clamp-4")}
                      dangerouslySetInnerHTML={{ __html: request.problem_statement || '' }}
                    />
                    {(request.problem_statement?.length ?? 0) > 300 && (
                      <button
                        onClick={() => setShowFullProblem(p => !p)}
                        className="mt-2 text-[11px] font-bold text-brand-600 hover:underline"
                      >
                        {showFullProblem ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <p className={labelCls}>PROPOSED CHANGE</p>
                  <div className="prose prose-sm max-w-none text-slate-800" dangerouslySetInnerHTML={{ __html: request.proposed_change || '-' }} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className={labelCls}>EXPECTED IMPACT</p>
                    <div className="prose prose-sm max-w-none text-slate-800" dangerouslySetInnerHTML={{ __html: request.expected_impact || '-' }} />
                  </div>
                  <div>
                    <p className={labelCls}>MEASUREMENT / KPI</p>
                    <div className="prose prose-sm max-w-none text-slate-800" dangerouslySetInnerHTML={{ __html: request.measurement || '-' }} />
                  </div>
                </div>
              </div>
            </section>

            {/* Execution */}
            <section>
              <div className={sectionHeaderCls}>
                <Layers className="h-3.5 w-3.5 text-brand-600" />
                <h3 className={sectionTitleCls}>Execution Framework</h3>
              </div>
              <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <p className={labelCls}>Key Teams Needed</p>
                  <div className="prose prose-sm max-w-none text-slate-800" dangerouslySetInnerHTML={{ __html: request.key_teams || '-' }} />
                </div>
                <div>
                  <p className={labelCls}>Cross-Dept Impact</p>
                  <div className="prose prose-sm max-w-none text-slate-800" dangerouslySetInnerHTML={{ __html: request.cross_dept_impact || '-' }} />
                </div>
                <div>
                  <p className={labelCls}>Dependencies</p>
                  <div className="prose prose-sm max-w-none text-slate-800" dangerouslySetInnerHTML={{ __html: request.dependencies || '-' }} />
                </div>
                <div>
                  <p className={labelCls}>Timeline Requirement</p>
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-sm">{request.desired_timeline || '-'}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Attachments */}
            <section>
              <div className={sectionHeaderCls}>
                <ExternalLink className="h-3.5 w-3.5 text-brand-600" />
                <h3 className={sectionTitleCls}>Supporting Artifacts</h3>
              </div>
              {request.attachment_url ? (
                <div className="space-y-3">
                  {request.attachment_url.split(',').map((url, idx) => (
                    <div key={url} className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-brand-300 hover:shadow-md transition-all">
                      <div className="flex items-center p-4">
                        <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                          {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? <img src={url} className="h-full w-full object-cover rounded-xl" /> : <FileText className="h-6 w-6" />}
                        </div>
                        <div className="ml-4 flex-1 truncate">
                          <p className="text-[11px] font-bold text-slate-900 uppercase">Supporting Document {idx + 1}</p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{url.split('/').pop()}</p>
                        </div>
                        <div className="flex gap-2">
                          <a href={url} target="_blank" className="p-2 bg-slate-50 text-slate-400 hover:text-brand-600 rounded-xl"><Eye className="h-4 w-4" /></a>
                          <a href={url} target="_blank" className="p-2 bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-xl"><Download className="h-4 w-4" /></a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <Paperclip className="h-6 w-6 text-slate-200 mb-2" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No Artifacts Attached</p>
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-4 space-y-8">
            {/* Submitter info */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className={labelCls}>SUBMITTED BY</p>
              <div className="flex items-center gap-3 mt-3">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                  <AvatarImage src={request.profiles?.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-brand-600 text-white font-black">{getInitials(request.profiles?.full_name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{request.profiles?.full_name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{request.profiles?.role}</p>
                </div>
              </div>
            </div>

            <div className="space-y-8 pb-10">
              {/* Approval Card */}
              <div className="space-y-4">
                <div className={sectionHeaderCls}>
                  <Workflow className="h-3.5 w-3.5 text-emerald-600" />
                  <h3 className={sectionTitleCls}>Approval Forensic Audit</h3>
                </div>
                
                <div className="relative bg-slate-50/50 rounded-2xl border border-slate-100 p-5 max-h-[300px] overflow-y-auto custom-scrollbar shadow-inner">
                  <div className="space-y-6 relative ml-1 pt-1">
                    <div className="absolute left-2.5 top-0 bottom-0 w-[1px] bg-slate-200/50" />
                    
                    {/* Submission */}
                    <div className="relative pl-8 pb-1">
                      <div className="absolute left-[-3px] top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
                      <p className="text-[10px] font-black uppercase text-slate-400">Submission</p>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">{request.profiles?.full_name}</p>
                      <p className="text-[10px] text-slate-400">{formatDateTime(request.created_at || '')}</p>
                    </div>

                    {[...(request.approval_steps || [])]
                      .filter(s => s.decision !== 'pending')
                      .sort((a,b) => new Date(a.decided_at || 0).getTime() - new Date(b.decided_at || 0).getTime())
                      .map((step, idx) => (
                      <div key={`step-${idx}`} className="relative pl-8 pb-1">
                        <div className={cn("absolute left-[-3px] top-1 h-3 w-3 rounded-full border-2 border-white shadow-sm", step.decision === 'approved' ? 'bg-emerald-500' : 'bg-red-500')} />
                        <p className={cn("text-[10px] font-black uppercase", step.decision === 'approved' ? 'text-emerald-600' : 'text-red-600')}>{step.stage.replace(/_/g, ' ')} Review</p>
                        <p className="text-xs font-bold text-slate-900">{step.profiles?.full_name || 'Unknown'}</p>
                        {step.comment && <p className="text-[11px] text-slate-500 italic p-2 bg-white rounded border border-slate-100 mt-1 font-medium leading-relaxed shadow-sm">"{step.comment}"</p>}
                        <p className="text-[10px] text-slate-400">{formatDateTime(step.decided_at || '')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Delivery Card */}
              {(request.audit_logs?.some(l => l.action.startsWith('ucd_status_') || l.action === 'request_recalled')) && (
                <div className="space-y-4">
                  <div className={sectionHeaderCls}>
                    <Layers className="h-3.5 w-3.5 text-brand-600" />
                    <h3 className={sectionTitleCls}>Delivery Lifecycle</h3>
                  </div>
                  
                  <div className="relative bg-brand-50/20 rounded-2xl border border-brand-100/50 p-5 max-h-[300px] overflow-y-auto custom-scrollbar shadow-inner">
                    <div className="space-y-6 relative ml-1 pt-1">
                      <div className="absolute left-2.5 top-0 bottom-0 w-[1px] bg-brand-200/30" />
                      
                      {[...(request.audit_logs || [])]
                        .filter(l => l.action.startsWith('ucd_status_') || l.action === 'request_recalled')
                        .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
                        .map((log, idx) => {
                          const isRecall = log.action === 'request_recalled'
                          const toStage = log.metadata?.to_stage
                          const status = isRecall ? (typeof toStage === 'string' ? toStage.toUpperCase() : '') : log.action.split('_').pop()?.toUpperCase()
                          
                          return (
                            <div key={`audit-${idx}`} className="relative pl-8 pb-1">
                              <div className={cn("absolute left-[-3px] top-1 h-3 w-3 rounded-full border-2 border-white shadow-sm", isRecall ? "bg-amber-500" : "bg-brand-600")} />
                              <p className={cn("text-[10px] font-black uppercase", isRecall ? "text-amber-600" : "text-brand-600")}>
                                {isRecall ? `Recall to ${status ?? ''}` : (status ?? '')}
                              </p>
                              <p className="text-xs font-bold text-slate-900">{log.profiles?.full_name || 'System'}</p>
                              {!!log.metadata?.comment && (
                                <p className={cn(
                                  "text-[11px] italic p-2 rounded border mt-1 font-semibold leading-relaxed shadow-sm",
                                  isRecall ? "text-amber-700 bg-white border-amber-100" : "text-brand-700 bg-white border-brand-100"
                                )}>
                                  "{String(log.metadata.comment)}"
                                </p>
                              )}
                              <p className="text-[10px] text-slate-400">{formatDateTime(log.created_at || '')}</p>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="shrink-0 border-t border-slate-100 bg-white pl-8 pr-24 py-4 flex items-center justify-between">
        {request && (
          <RequestDecisionActions 
            request={request} 
            userRole={userRole} 
            onSuccess={() => { onClose(); onRefresh?.(); }} 
          />
        )}
        <button type="button" onClick={onClose} className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-brand-600">Close View</button>
      </div>
    </div>
  )
}
