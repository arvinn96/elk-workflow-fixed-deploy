'use client'

import { X, Calendar, User, Building2, Target, Wrench, Users, GitBranch, Clock, Eye, Download } from 'lucide-react'

interface ELKRequest {
  id: string
  title: string
  requestor_name: string
  requestor_department: string
  sponsor_name: string
  sponsor_department: string
  problem_statement: string
  proposed_change: string
  priority: string
  expected_impact: string
  measurement: string
  effort_estimate: string
  key_teams: string
  cross_dept_impact: string
  dependencies: string
  timeline_start: string | null
  timeline_end: string | null
  technical_implementation: string
  current_stage: string
  status: string | null
  benefit_status: string
  supporting_documents: string | null
  created_at: string
  updated_at: string | null
}

const STAGE_LABELS: Record<string, string> = {
  Inbox: 'Inbox', Grooming: 'Grooming', Approval: 'Pending Approval',
  Sprint: 'In Sprint', UAT: 'In UAT', Done: 'Done',
}

const SIZE_LABELS: Record<string, string> = {
  S: 'Small', M: 'Medium', L: 'Large', XL: 'Extra Large',
}

function cleanHtml(html: string | null) {
  if (!html) return '—'
  return html.replace(/\s*data-start="[^"]*"/g, '').replace(/\s*data-end="[^"]*"/g, '')
}

function fmt(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-slate-800">{value || '—'}</p>
    </div>
  )
}

interface Props {
  project: ELKRequest | null
  open: boolean
  onClose: () => void
}

export function ElkProjectDrawer({ project, open, onClose }: Props) {
  if (!open || !project) return null

  const statusColor =
    project.status?.toLowerCase() === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
    project.status?.toLowerCase() === 'deprioritised' ? 'bg-red-100 text-red-700 border-red-200' :
    'bg-slate-100 text-slate-600 border-slate-200'

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 shrink-0">
          <div className="pr-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Project Details</p>
            <h2 className="text-base font-bold text-slate-900 leading-snug">{project.title}</h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColor}`}>
                {project.status || 'No Status'}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                {STAGE_LABELS[project.current_stage] ?? project.current_stage}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                {SIZE_LABELS[project.effort_estimate] ?? project.effort_estimate}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                {project.priority} Priority
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* People */}
          <Section title="People">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4">
              <div className="flex items-start gap-2.5">
                <User className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Requestor</p>
                  <p className="text-sm font-medium text-slate-800">{project.requestor_name || '—'}</p>
                  <p className="text-xs text-slate-500">{project.requestor_department || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Building2 className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Sponsor</p>
                  <p className="text-sm font-medium text-slate-800">{project.sponsor_name || '—'}</p>
                  <p className="text-xs text-slate-500">{project.sponsor_department || '—'}</p>
                </div>
              </div>
            </div>
          </Section>

          {/* Timeline */}
          <Section title="Timeline">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4">
              <div className="flex items-start gap-2.5">
                <Calendar className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Start</p>
                  <p className="text-sm text-slate-800">{fmt(project.timeline_start)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">End</p>
                  <p className="text-sm text-slate-800">{fmt(project.timeline_end)}</p>
                </div>
              </div>
            </div>
          </Section>

          {/* Problem & Solution */}
          <Section title="Problem Statement">
            <div
              className="text-sm text-slate-700 bg-slate-50 rounded-xl p-4 leading-relaxed prose prose-sm max-w-none not-italic [&_em]:not-italic [&_i]:not-italic"
              dangerouslySetInnerHTML={{ __html: cleanHtml(project.problem_statement) }}
            />
          </Section>

          <Section title="Proposed Change">
            <div
              className="text-sm text-slate-700 bg-slate-50 rounded-xl p-4 leading-relaxed prose prose-sm max-w-none not-italic [&_em]:not-italic [&_i]:not-italic"
              dangerouslySetInnerHTML={{ __html: cleanHtml(project.proposed_change) }}
            />
          </Section>


          {/* Impact */}
          <Section title="Impact & Measurement">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2.5 bg-slate-50 rounded-xl p-4">
                <Target className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <Field label="Expected Impact" value={project.expected_impact} />
              </div>
              <div className="flex items-start gap-2.5 bg-slate-50 rounded-xl p-4">
                <Target className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <Field label="Measurement" value={project.measurement} />
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <Field label="Benefit Status" value={project.benefit_status} />
            </div>
          </Section>

          {/* Technical */}
          <Section title="Technical Details">
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 bg-slate-50 rounded-xl p-4">
                <Wrench className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Technical Implementation</p>
                  {project.technical_implementation?.startsWith('http') ? (
                    <div className="flex items-center gap-2 mt-1">
                      <a
                        href={(() => {
                          const url = project.technical_implementation
                          const ext = url.split('?')[0].split('.').pop()?.toLowerCase()
                          if (['doc','docx','xls','xlsx','ppt','pptx'].includes(ext ?? '')) {
                            return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=false`
                          }
                          return url
                        })()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 border border-brand-200 text-xs font-semibold hover:bg-brand-100 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </a>
                      <a
                        href={project.technical_implementation}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold hover:bg-slate-200 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-800">{project.technical_implementation || '—'}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2.5 bg-slate-50 rounded-xl p-4">
                  <Users className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <Field label="Key Teams" value={project.key_teams} />
                </div>
                <div className="flex items-start gap-2.5 bg-slate-50 rounded-xl p-4">
                  <Building2 className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <Field label="Cross-Dept Impact" value={project.cross_dept_impact} />
                </div>
              </div>
              <div className="flex items-start gap-2.5 bg-slate-50 rounded-xl p-4">
                <GitBranch className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <Field label="Dependencies" value={project.dependencies} />
              </div>
            </div>
          </Section>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <Field label="Created" value={fmt(project.created_at)} />
            <Field label="Last Updated" value={fmt(project.updated_at)} />
          </div>
        </div>
      </div>
    </>
  )
}
