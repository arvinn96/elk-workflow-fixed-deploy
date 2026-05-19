'use client'

import { useEffect, useState, useRef, useMemo, useTransition, memo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Search, CheckCircle, XCircle, ChevronDown, Download } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ElkProjectDrawer } from './elk-project-drawer'
import { toast } from 'sonner'

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
  S: 'Small', M: 'Medium', L: 'Large', XL: 'XL',
}

function getTimelinePercent(start: string | null, end: string | null): number {
  if (!start || !end) return 0
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  const now = Date.now()
  if (now <= s) return 0
  if (now >= e) return 100
  return Math.round(((now - s) / (e - s)) * 100)
}

const STATUS_OPTIONS = ['Approved', 'Deprioritised'] as const

const elkClient = createClient(
  process.env.NEXT_PUBLIC_ELK_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_ELK_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function StatusSelector({ projectId, status, onChange }: {
  projectId: string
  status: string | null
  onChange: (newStatus: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSelect(newStatus: string) {
    setSaving(true)
    setOpen(false)
    const { error } = await elkClient.from('requests').update({ status: newStatus }).eq('id', projectId)
    if (error) {
      toast.error('Failed to update status')
    } else {
      onChange(newStatus)
      toast.success(`Status set to ${newStatus}`)
    }
    setSaving(false)
  }

  const color =
    status?.toLowerCase() === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
    status?.toLowerCase() === 'deprioritised' ? 'bg-red-100 text-red-700 border-red-200' :
    'bg-slate-50 text-slate-400 border-slate-200'

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        disabled={saving}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors hover:opacity-80 ${color}`}
      >
        {saving ? '...' : (status || 'Set status')}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[160px]">
          <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Set status</p>
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt}
              onClick={(e) => { e.stopPropagation(); void handleSelect(opt) }}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {opt === 'Approved'
                  ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                  : <XCircle className="h-4 w-4 text-slate-400" />
                }
                {opt}
              </div>
              {status === opt && <span className="text-brand-600 text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function ElkProjectsTable() {
  const [projects, setProjects] = useState<ELKRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deferredSearch, setDeferredSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<ELKRequest | null>(null)

  useEffect(() => {
    async function fetchElk() {
      try {
        const { data, error } = await elkClient
          .from('requests')
          .select(
            'id, title, requestor_name, requestor_department, sponsor_name, sponsor_department, problem_statement, proposed_change, priority, expected_impact, measurement, effort_estimate, key_teams, cross_dept_impact, dependencies, timeline_start, timeline_end, technical_implementation, current_stage, status, benefit_status, supporting_documents, created_at, updated_at'
          )
          .order('updated_at', { ascending: false })

        if (error) {
          console.error('ELK projects fetch error:', error.message)
        }
        setProjects((data as ELKRequest[]) ?? [])
      } catch (err: any) {
        console.error('ELK projects network error:', err.message)
      } finally {
        setLoading(false)
      }
    }
    void fetchElk()
  }, [])

  const filtered = useMemo(() => {
    return projects.filter(p =>
      !deferredSearch ||
      p.title?.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      p.expected_impact?.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      p.current_stage?.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      p.requestor_name?.toLowerCase().includes(deferredSearch.toLowerCase())
    )
  }, [projects, deferredSearch])

  function exportCSV() {
    const headers = ['Name', 'Requestor', 'Department', 'Impact', 'Size', 'Stage', 'Status', 'Priority', 'Timeline Start', 'Timeline End', 'Last Updated']
    const rows = filtered.map(p => [
      p.title,
      p.requestor_name,
      p.requestor_department,
      p.expected_impact,
      SIZE_LABELS[p.effort_estimate] ?? p.effort_estimate,
      STAGE_LABELS[p.current_stage] ?? p.current_stage,
      p.status ?? '',
      p.priority,
      p.timeline_start ?? '',
      p.timeline_end ?? '',
      p.updated_at ?? '',
    ])
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `elk-projects-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Project Overview</h2>
          <p className="text-xs text-slate-400 mt-0.5">{projects.length} active initiatives</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search initiatives..."
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                startTransition(() => {
                  setDeferredSearch(e.target.value)
                })
              }}
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm transition-opacity duration-200 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[16%]" />
            <col className="w-[8%]" />
            <col className="w-[14%]" />
            <col className="w-[13%]" />
            <col className="w-[14%]" />
            <col className="w-[13%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {[
                { label: 'NAME', align: 'text-left' },
                { label: 'IMPACT', align: 'text-left' },
                { label: 'SIZE', align: 'text-center' },
                { label: 'STAGE', align: 'text-left' },
                { label: 'STATUS', align: 'text-left' },
                { label: 'TIMELINE', align: 'text-left' },
                { label: 'LAST UPDATED', align: 'text-left' },
              ].map(({ label, align }) => (
                <th key={label} className={`px-4 py-3 ${align} text-[10px] font-bold uppercase tracking-wider text-slate-500`}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-3.5 bg-slate-100 rounded animate-pulse w-24" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-sm text-slate-400">
                  No projects found
                </td>
              </tr>
            ) : (
              filtered.map(project => {
                const pct = getTimelinePercent(project.timeline_start, project.timeline_end)
                const updatedAt = project.updated_at
                  ? new Date(project.updated_at).toLocaleDateString('en-MY', {
                      timeZone: 'Asia/Kuala_Lumpur',
                      day: '2-digit', month: 'short', year: 'numeric',
                    }) + '\n' + new Date(project.updated_at).toLocaleTimeString('en-MY', {
                      timeZone: 'Asia/Kuala_Lumpur',
                      hour: '2-digit', minute: '2-digit', hour12: false,
                    })
                  : '—'

                return (
                  <tr
                    key={project.id}
                    onClick={() => setSelected(project)}
                    className="hover:bg-brand-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <span className="line-clamp-2 leading-snug">{project.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                        {project.expected_impact || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                        {SIZE_LABELS[project.effort_estimate] ?? project.effort_estimate ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                        {STAGE_LABELS[project.current_stage] ?? project.current_stage ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusSelector
                        projectId={project.id}
                        status={project.status}
                        onChange={(newStatus) =>
                          setProjects(cur => cur.map(p => p.id === project.id ? { ...p, status: newStatus } : p))
                        }
                      />
                    </td>
                    <td className="px-4 py-3 min-w-[140px]">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                          {pct}% Complete
                        </span>
                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-pre-line tabular-nums">
                      {updatedAt}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <ElkProjectDrawer
        project={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
