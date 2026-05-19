'use client'

import React from 'react'
import { 
  FileText, Save, Loader2, Upload, ImageIcon, 
  Paperclip, Calendar as CalendarIcon, Trash2 
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/rich-text-editor'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarUI } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { RequestWithProfile, Priority } from '@/lib/types'

interface Props {
  request: RequestWithProfile
  onSave: (form: any) => Promise<void>
  isSaving: boolean
  onCancel: () => void
  onDeleteSuccess?: () => void
  userRole?: string
}

export function ViewRequestEditor({ request, onSave, isSaving, onCancel, onDeleteSuccess, userRole }: Props) {
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [form, setForm] = React.useState({
    title: request.title || '',
    sponsored_by: request.sponsored_by || '',
    problem_statement: request.problem_statement || '',
    proposed_change: request.proposed_change || '',
    priority_level: (request.priority_level || 'medium') as Priority,
    expected_impact: request.expected_impact || '',
    measurement: request.measurement || '',
    key_teams: request.key_teams || '',
    cross_dept_impact: request.cross_dept_impact || '',
    dependencies: request.dependencies || '',
    desired_timeline: request.desired_timeline || '',
    attachment_url: request.attachment_url || '',
  })
  const [isUploading, setIsUploading] = React.useState(false)
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    const toastId = toast.loading('Uploading...')
    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).slice(2, 11)}-${Date.now()}.${fileExt}`
      const filePath = `${request.id}/${fileName}`
      const { error } = await supabase.storage.from('attachments').upload(filePath, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(filePath)
      setForm(prev => ({ ...prev, attachment_url: prev.attachment_url ? `${prev.attachment_url},${publicUrl}` : publicUrl }))
      toast.success('Uploaded.', { id: toastId })
    } catch (err: any) {
      toast.error(err.message, { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('CRITICAL ACTION: Are you sure you want to PERMANENTLY delete this request? This action CANNOT be undone.')) {
      return
    }

    setIsDeleting(true)
    const toastId = toast.loading('Deleting request...')
    try {
      const res = await fetch(`/api/requests?id=${request.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Request deleted successfully', { id: toastId })
      if (onDeleteSuccess) onDeleteSuccess()
      else onCancel()
    } catch (err: any) {
      toast.error(err.message, { id: toastId })
    } finally {
      setIsDeleting(false)
    }
  }

  const labelCls = 'text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5'
  const editInputCls = 'h-9 px-3 text-sm bg-slate-50 border-slate-200 focus:bg-white'

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-8 pt-6 pb-0 shrink-0 border-b border-brand-600">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-10 w-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center">
            <FileText className="h-5 w-5 text-brand-600" />
          </div>
          <Input 
            value={form.title} 
            onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
            className="h-9 text-lg font-bold border-none bg-transparent focus-visible:ring-0 px-0 shadow-none"
            placeholder="Project Title"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10">
        <section className="grid grid-cols-2 gap-6">
          <div><p className={labelCls}>Sponsored By</p><Input value={form.sponsored_by} onChange={(e) => setForm(p => ({ ...p, sponsored_by: e.target.value }))} className={editInputCls} /></div>
          <div><p className={labelCls}>Priority Level</p><select value={form.priority_level} onChange={(e) => setForm(p => ({ ...p, priority_level: e.target.value as any }))} className="w-full h-9 px-3 rounded-md border border-slate-200 bg-slate-50 text-sm"><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
        </section>

        <section className="space-y-6">
          <div><p className={labelCls}>Problem Statement</p><RichTextEditor content={form.problem_statement} onChange={(h) => setForm(p => ({ ...p, problem_statement: h }))} className="min-h-[160px]" /></div>
          <div><p className={labelCls}>Proposed Change</p><RichTextEditor content={form.proposed_change} onChange={(h) => setForm(p => ({ ...p, proposed_change: h }))} /></div>
          <div className="grid grid-cols-2 gap-6">
            <div><p className={labelCls}>Expected Impact</p><RichTextEditor content={form.expected_impact} onChange={(h) => setForm(p => ({ ...p, expected_impact: h }))} /></div>
            <div><p className={labelCls}>Measurement / KPI</p><RichTextEditor content={form.measurement} onChange={(h) => setForm(p => ({ ...p, measurement: h }))} /></div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-y-6 gap-x-8">
          <div><p className={labelCls}>Key Teams Needed</p><RichTextEditor content={form.key_teams} onChange={(h) => setForm(p => ({ ...p, key_teams: h }))} /></div>
          <div><p className={labelCls}>Cross-Dept Impact</p><RichTextEditor content={form.cross_dept_impact} onChange={(h) => setForm(p => ({ ...p, cross_dept_impact: h }))} /></div>
          <div><p className={labelCls}>Dependencies</p><RichTextEditor content={form.dependencies} onChange={(h) => setForm(p => ({ ...p, dependencies: h }))} /></div>
          <div>
            <p className={labelCls}>Timeline Requirement</p>
            <Input value={form.desired_timeline} onChange={(e) => setForm(p => ({ ...p, desired_timeline: e.target.value }))} className={editInputCls} placeholder="e.g., 01 Jan 2024 - 31 Mar 2024" />
          </div>
        </section>

        <section>
          <p className={labelCls}>Supporting Artifacts</p>
          <div className="space-y-4">
            {form.attachment_url && form.attachment_url.split(',').map((u, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-white border rounded flex items-center justify-center text-slate-400">{u.match(/\.(jpg|jpeg|png)$/i) ? <ImageIcon className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}</div>
                  <p className="text-xs text-slate-400 truncate max-w-[200px]">{u.split('/').pop()}</p>
                </div>
                <button onClick={() => setForm(p => ({ ...p, attachment_url: p.attachment_url.split(',').filter((_, idx) => idx !== i).join(',') }))} className="text-slate-400 hover:text-red-500">&#10005;</button>
              </div>
            ))}
            <label className="cursor-pointer">
              <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-brand-600 transition-all">
                {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Add Artifact
              </div>
            </label>
          </div>
        </section>
      </div>

      <div className="shrink-0 border-t border-slate-100 bg-white px-8 py-4 flex items-center justify-between">
        <div className="flex items-center">
          {userRole === 'super_admin' && (
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase text-red-500 hover:bg-red-50 border border-red-100 rounded-md transition-all"
            >
              {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Delete Ticket
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="px-6 py-2.5 text-xs font-bold uppercase text-slate-500 hover:bg-slate-50 border border-slate-200 rounded-md">Cancel</button>
          <button onClick={() => onSave(form)} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white text-xs font-bold uppercase rounded-md hover:bg-brand-700 transition-all shadow-sm">
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
