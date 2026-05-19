import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { RequestTrackerWrapper } from '@/components/request-tracker-wrapper'
import { StatusBadge } from '@/components/status-badge'
import { TypeBadge } from '@/components/type-badge'
import { formatDateTime, getInitials, cn } from '@/lib/utils'
import { 
  ChevronRight, Calendar, User, FileText, 
  ArrowLeft, Clock, CheckCircle, XCircle, Info, Plus
} from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { RequestWithProfile, ApprovalStep, Role } from '@/lib/types'
import { RequestDecisionActions } from '@/components/request-decision-actions'
import { getServerAuthData } from '@/lib/supabase/session'

interface PageProps {
  params: Promise<{ id: string }>
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

export default async function RequestDetailPage({ params }: PageProps) {
  const { id } = await params
  
  // PROFESSIONALLY use cached auth data to skip the ~150ms getUser() waterfall.
  // This shares the result with the root layout.
  const [{ user, profile: userProfile }, supabase] = await Promise.all([
    getServerAuthData(),
    createClient()
  ])

  // Fetch request with profiles and approval steps
  const { data: rawRequest } = await supabase
    .from('requests')
    .select(
      '*, profiles(id, full_name, email, role, department, avatar_url), approval_steps(*, profiles:decided_by(id, full_name, email, role, department, avatar_url))'
    )
    .eq('id', id)
    .single() as { data: any | null }

  if (!rawRequest) notFound()

  // NORMALIZE DATA
  const request: RequestWithProfile = {
    ...rawRequest,
    profiles: normalizeProfile(rawRequest.profiles),
    approval_steps: (rawRequest.approval_steps || []).map((step: any) => ({
      ...step,
      profiles: normalizeProfile(step.profiles)
    }))
  }

  const userRole: Role | '' = (userProfile?.role as Role) ?? ''

  // Extract step profiles from the normalized steps
  const stepProfiles: Record<string, { full_name: string | null }> = {}
  ;(request.approval_steps ?? []).forEach((step: any) => {
    if (step.decided_by && step.profiles) {
      stepProfiles[step.decided_by] = { full_name: step.profiles.full_name }
    }
  })

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto px-4 sm:px-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-slate-200/60 mb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest mb-1">
            <Link href="/dashboard" className="hover:text-slate-600 transition-colors">Home</Link>
            <ChevronRight className="h-2.5 w-2.5" />
            <Link href="/requests" className="hover:text-slate-600 transition-colors">Requests</Link>
            <ChevronRight className="h-2.5 w-2.5" />
            <span className="text-slate-600 font-bold overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px]">
              {request.id}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="h-8 w-8 rounded border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors">
               <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl font-heading font-bold text-slate-900 tracking-tight">
              {request.title}
            </h1>
            <StatusBadge status={request.status} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <TypeBadge type={request.type} />
        </div>
      </div>

      {/* Workflow Strategy Strip */}
      <div className="card p-6 bg-gradient-to-r from-white to-slate-50/30">
        <div className="flex items-center gap-2 mb-6">
           <div className="h-2 w-2 rounded-full bg-brand-500" />
           <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Live Workflow Pipeline</h2>
        </div>
        <RequestTrackerWrapper 
          requestId={request.id}
          currentStage={request.current_stage} 
          status={request.status} 
          steps={request.approval_steps || []}
          stepProfiles={stepProfiles}
          canRecall={userProfile?.role === 'super_admin'}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Request Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="shrink-0"><Info className="h-4 w-4 text-slate-400" /></span>
              <h3 className="text-sm font-bold text-slate-800">Request Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Request Submitter</span>
                <div className="flex items-center gap-2.5 pt-1">
                  <Avatar className="h-8 w-8 border border-white shadow-sm">
                    <AvatarImage src={request.profiles?.avatar_url || ''} />
                    <AvatarFallback className="text-[10px] bg-slate-100 font-bold">
                      {getInitials(request.profiles?.full_name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{request.profiles?.full_name || 'Unknown User'}</p>
                    <p className="text-[10px] text-slate-500 truncate">{request.profiles?.email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Submission Date</span>
                <div className="flex items-center gap-2 pt-1.5">
                   <Calendar className="h-4 w-4 text-slate-400" />
                   <p className="text-sm font-semibold text-slate-900">{formatDateTime(request.created_at)}</p>
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Project Summary</span>
                <div className="p-4 rounded bg-slate-50/50 border border-slate-100 text-sm text-slate-700 leading-relaxed min-h-[100px]">
                  {request.problem_statement ? (
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: request.problem_statement }} />
                  ) : (
                    'No detailed summary provided.'
                  )}
                </div>
              </div>

            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-800">Attachments & Evidence</h3>
            </div>
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-100 rounded-lg bg-slate-50/30">
               <FileText className="h-8 w-8 text-slate-200 mb-2" />
               <p className="text-xs text-slate-400 font-medium">No attachments provided for this request.</p>
            </div>
          </div>
        </div>

        {/* Right: History Timeline */}
        <div className="space-y-6">
           <div className="card p-6 min-h-[400px]">
             <div className="flex items-center gap-2 mb-6">
                <Clock className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-800">Activity Timeline</h3>
             </div>

             <div className="space-y-8 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
               {/* Submitted Event */}
               <div className="relative pl-10">
                 <div className="absolute left-0 top-0 h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-slate-100">
                   <Plus className="h-4 w-4 text-blue-600" />
                 </div>
                 <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900">Request Submitted</p>
                    <p className="text-[10px] text-slate-500">{formatDateTime(request.created_at)}</p>
                    <p className="text-[11px] text-slate-600 italic">Created by {request.profiles?.full_name || 'System'}</p>
                 </div>
               </div>

               {/* Approval Steps Mapping */}
               {[...(request.approval_steps ?? [])].sort((a: ApprovalStep, b: ApprovalStep) => new Date(a.decided_at ?? 0).getTime() - new Date(b.decided_at ?? 0).getTime()).map((step: ApprovalStep, idx: number) => {
                 if (!step.decided_at) return null;
                 
                 const isApproved = step.decision === 'approved';
                 const Icon = isApproved ? CheckCircle : XCircle;
                 const colorClass = isApproved ? 'text-emerald-600 bg-emerald-50 ring-emerald-100' : 'text-red-600 bg-red-50 ring-red-100';

                 return (
                   <div key={idx} className="relative pl-10">
                    <div className={cn("absolute left-0 top-0 h-9 w-9 rounded-full flex items-center justify-center border-2 border-white shadow-sm ring-1", colorClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-900">
                          {isApproved ? 'Approved at' : 'Rejected at'} Stage: <span className="uppercase">{step.stage}</span>
                        </p>
                        <p className="text-[10px] text-slate-500">{formatDateTime(step.decided_at)}</p>
                        <p className="text-[11px] text-slate-600">
                          Decision by {step.decided_by ? stepProfiles[step.decided_by]?.full_name : 'Unknown'}
                        </p>
                        {step.comment && (
                           <div className="mt-2 p-2 rounded bg-slate-50 text-[11px] text-slate-600 border-l-2 border-slate-200">
                              &quot;{step.comment}&quot;
                           </div>
                        )}
                    </div>
                  </div>
                 );
               })}

               {/* Final Done State */}
               {request.status !== 'pending' && (
                 <div className="relative pl-10">
                    <div className={cn(
                      "absolute left-0 top-0 h-9 w-9 rounded-full flex items-center justify-center border-2 border-white shadow-sm ring-1",
                      request.status === 'approved' ? 'bg-emerald-600 ring-emerald-600' : 'bg-red-600 ring-red-600'
                    )}>
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-900">Workflow Finalized</p>
                        <p className="text-[10px] text-slate-500">Status marked as {request.status}</p>
                    </div>
                 </div>
               )}
             </div>
           </div>
        </div>
      </div>

      {/* Decision Actions Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-100 bg-white/80 backdrop-blur-md px-8 py-4 flex items-center justify-center z-[50] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
        <RequestDecisionActions request={request} userRole={userRole} />
      </div>
    </div>
  )
}
