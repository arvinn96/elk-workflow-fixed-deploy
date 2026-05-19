'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, TrendingUp, Loader2, Sparkles } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DateRangePicker } from '@/components/date-range-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { Priority, Profile } from '@/lib/types'
import type { ExtractionResult } from '@/lib/ai/openrouter'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ELK_OPEN_REQUEST_DRAWER, type ExtractionData } from '@/lib/events'

interface RequestDrawerProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function RequestDrawer({ open, onClose, onSuccess }: RequestDrawerProps) {
  const [form, setForm] = useState({
    title: '',
    sponsored_by: '',
    problem_statement: '',
    proposed_change: '',
    priority_level: 'medium' as Priority,
    expected_impact: '',
    measurement_kpi: '',
    measurement_unit: '',
    key_teams: '',
    cross_dept_impact: '',
    dependencies: '',
    desired_timeline: '',
    attachment_url: '',
  })

  const [mounted, setMounted] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [linkInput, setLinkInput] = useState('')

  async function handleFileUpload(file: File) {
    setUploading(true)
    const toastId = toast.loading('Uploading file...')
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const filePath = `requests/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('attachments').upload(filePath, file, { cacheControl: '3600', upsert: false, contentType: file.type })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(filePath)
      setForm(prev => {
        const arr = prev.attachment_url ? prev.attachment_url.split(',') : []
        return { ...prev, attachment_url: [...arr, publicUrl].join(',') }
      })
      toast.success('File uploaded.', { id: toastId })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed', { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (open) {
      async function fetchProfile() {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('id, full_name, email, role, department, avatar_url')
            .eq('id', user.id)
            .single()
          setUserProfile(data)
        }
      }
      fetchProfile()
    }
  }, [open])

  useEffect(() => {
    const handleAutoFill = (e: Event) => {
      const detail = (e as CustomEvent<ExtractionData>).detail
      if (!detail) return

      setForm((prev) => ({
        ...prev,
        title: detail.title || prev.title,
        sponsored_by: detail.sponsored_by || prev.sponsored_by,
        problem_statement: detail.problem_statement || prev.problem_statement,
        proposed_change: detail.proposed_change || prev.proposed_change,
        priority_level: detail.priority_level || prev.priority_level,
        expected_impact: detail.expected_impact || prev.expected_impact,
        measurement_kpi: detail.measurement_kpi || prev.measurement_kpi,
        measurement_unit: detail.measurement_unit || prev.measurement_unit,
        key_teams: detail.key_teams || prev.key_teams,
        cross_dept_impact: detail.cross_dept_impact || prev.cross_dept_impact,
        dependencies: detail.dependencies || prev.dependencies,
        desired_timeline: detail.desired_timeline || prev.desired_timeline,
        attachment_url: detail.attachment_url || prev.attachment_url,
      }))

      toast.success('Form pre-populated with AI data.')
    }

    window.addEventListener(ELK_OPEN_REQUEST_DRAWER, handleAutoFill)
    return () => window.removeEventListener(ELK_OPEN_REQUEST_DRAWER, handleAutoFill)
  }, [])

  function validate() {
    const nextErrors: Record<string, string> = {}
    if (!form.title.trim()) nextErrors.title = 'Title is required'
    if (!form.problem_statement.trim()) nextErrors.problem_statement = 'Problem statement is required'
    return nextErrors
  }

  async function handleSubmit(e?: React.MouseEvent | React.SyntheticEvent) {
    e?.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      toast.error(Object.values(validationErrors)[0])
      return
    }

    setErrors({})
    setLoading(true)

    const measurement = [form.measurement_kpi, form.measurement_unit].filter(Boolean).join(' – ')

    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        sponsored_by: form.sponsored_by,
        problem_statement: form.problem_statement,
        proposed_change: form.proposed_change,
        priority_level: form.priority_level,
        expected_impact: form.expected_impact,
        measurement,
        effort_estimate: '',
        key_teams: form.key_teams,
        cross_dept_impact: form.cross_dept_impact,
        dependencies: form.dependencies,
        desired_timeline: form.desired_timeline,
        attachment_url: form.attachment_url || null,
      }),
    })

    const payload = await res.json()

    if (!res.ok) {
      toast.error(payload.error ?? 'Failed to submit request.')
      setLoading(false)
      return
    }

    toast.success('Request submitted successfully!')
    resetForm()
    setLoading(false)
    onSuccess()
    onClose()
  }

  function resetForm() {
    setForm({
      title: '',
      sponsored_by: '',
      problem_statement: '',
      proposed_change: '',
      priority_level: 'medium',
      expected_impact: '',
      measurement_kpi: '',
      measurement_unit: '',
      key_teams: '',
      cross_dept_impact: '',
      dependencies: '',
      desired_timeline: '',
      attachment_url: '',
    })
    setDateRange(undefined)
    setLinkInput('')
  }

  const setField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleMagicFill = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setExtracting(true)
    const toastId = toast.loading('Analyzing document content...')

    try {
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
      const base64 = await base64Promise

      const res = await fetch('/api/extract-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, fileName: file.name }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to extract document')

      // Auto-add the document to the attached files array so it is preserved
      try {
        const ext = file.name.split('.').pop()
        const filePath = `requests/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const supabase = createClient()
        const { error: upErr } = await supabase.storage.from('attachments').upload(filePath, file, { cacheControl: '3600', upsert: false, contentType: file.type })
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(filePath)
          setForm(prev => {
            const arr = prev.attachment_url ? prev.attachment_url.split(',') : []
            return { ...prev, attachment_url: [...arr, publicUrl].join(',') }
          })
        }
      } catch (err) {
        console.warn('Failed to auto-upload magic doc', err)
      }

      const extraction = data.extraction as ExtractionResult

      setForm((prev) => ({
        ...prev,
        title: extraction.title || prev.title,
        sponsored_by: extraction.sponsored_by || prev.sponsored_by,
        problem_statement: extraction.problem_statement || prev.problem_statement,
        proposed_change: extraction.proposed_change || prev.proposed_change,
        priority_level: extraction.priority_level || prev.priority_level,
        expected_impact: extraction.expected_impact || prev.expected_impact,
        measurement_kpi: extraction.measurement_kpi || prev.measurement_kpi,
        measurement_unit: extraction.measurement_unit || prev.measurement_unit,
        key_teams: extraction.key_teams || prev.key_teams,
        cross_dept_impact: extraction.cross_dept_impact || prev.cross_dept_impact,
        dependencies: extraction.dependencies || prev.dependencies,
        desired_timeline: extraction.desired_timeline || prev.desired_timeline,
      }))

      toast.success('Form populated from document.', { id: toastId })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI extraction failed', { id: toastId })
    } finally {
      setExtracting(false)
      e.target.value = ''
    }
  }

  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range)
    if (range?.from) {
      const start = format(range.from, 'd MMM yyyy')
      const end = range.to ? ` – ${format(range.to, 'd MMM yyyy')}` : ''
      setField('desired_timeline', `${start}${end}`)
    } else {
      setField('desired_timeline', '')
    }
  }

  const priorities: { value: Priority; label: string }[] = [
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ]

  const inputCls = 'bg-slate-100 border-slate-200 focus:bg-white text-sm h-10'
  const textareaCls = 'bg-slate-100 border-slate-200 focus:bg-white text-sm resize-none'
  const labelCls = 'text-[11px] font-semibold text-slate-700'

  if (!mounted) return null

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-white shadow-2xl w-full max-w-5xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* ── Header ── */}
            <div className="px-10 pt-6 pb-0 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <h1 className="text-lg font-black uppercase tracking-[0.2em] text-brand-600">
                    Request Form
                  </h1>
                  {/* Magic Fill */}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.doc"
                      onChange={handleMagicFill}
                      disabled={extracting}
                    />
                    <div className={cn(
                      'flex items-center gap-1.5 px-3 py-1 rounded-full border border-brand-200 bg-brand-50 text-brand-700 text-[10px] font-bold uppercase tracking-wider transition-all hover:bg-brand-100',
                      extracting && 'opacity-50 cursor-not-allowed'
                    )}>
                      {extracting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      {extracting ? 'Processing…' : 'Document Auto-Fill'}
                    </div>
                  </label>
                </div>
                <span className="text-2xl text-brand-600 tracking-tight" style={{ fontFamily: "Arial, sans-serif", fontWeight: 700 }}>
                  ELK-DESA
                </span>
              </div>
              <div className="h-[2px] bg-brand-600 mt-4" />
            </div>

            {/* ── Body ── */}
            <div className="flex-1 overflow-y-auto pl-10 pr-28 py-6">
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-14 h-full">

                {/* ═══════════════ LEFT COLUMN ═══════════════ */}
                <div className="space-y-5">
                  {/* Section header */}
                  <div className="flex items-center gap-2 border-b border-brand-600 pb-2">
                    <FileText className="h-3.5 w-3.5 text-brand-600" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-800">
                      Request Definition
                    </span>
                  </div>

                  {/* 1. Title */}
                  <div className="space-y-1">
                    <Label className={labelCls}>
                      1. Title of Request <span className="text-brand-600">*</span>
                    </Label>
                    <Input
                      placeholder="Enter a clear, descriptive title for the initiative"
                      value={form.title}
                      onChange={(e) => setField('title', e.target.value)}
                      className={cn(inputCls, errors.title && 'border-red-400 bg-red-50')}
                    />
                  </div>

                  {/* 2. Requestor & 3. Sponsored by */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className={labelCls}>
                        2. Requestor <span className="text-brand-600">*</span>
                      </Label>
                      <div className="h-10 px-3 flex items-center bg-slate-100 border border-slate-200 rounded-md text-sm text-slate-600">
                        {userProfile ? `${userProfile.full_name}` : 'Loading…'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className={labelCls}>3. Sponsored by</Label>
                      <Input
                        placeholder="HOD Name"
                        value={form.sponsored_by}
                        onChange={(e) => setField('sponsored_by', e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* 4. Problem Statement */}
                  <div className="space-y-1">
                    <Label className={labelCls}>
                      4. Problem Statement <span className="text-brand-600">*</span>
                    </Label>
                    <Textarea
                      placeholder="What is broken? Who is impacted? Why is this urgent now?"
                      value={form.problem_statement}
                      onChange={(e) => setField('problem_statement', e.target.value)}
                      className={cn(textareaCls, 'min-h-[90px]', errors.problem_statement && 'border-red-400 bg-red-50')}
                    />
                  </div>

                  {/* 5. Proposed Change */}
                  <div className="space-y-1">
                    <Label className={labelCls}>
                      5. Proposed Change <span className="text-brand-600">*</span>
                    </Label>
                    <Textarea
                      placeholder="Briefly describe the solution and what will be different (2–3 lines)"
                      value={form.proposed_change}
                      onChange={(e) => setField('proposed_change', e.target.value)}
                      className={cn(textareaCls, 'min-h-[90px]')}
                    />
                  </div>

                  {/* Priority Level */}
                  <div className="space-y-2">
                    <Label className={labelCls}>Priority Level</Label>
                    <div className="flex gap-2">
                      {priorities.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setField('priority_level', p.value)}
                          className={cn(
                            'flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider border rounded transition-all',
                            form.priority_level === p.value
                              ? 'bg-brand-600 border-brand-600 text-white'
                              : 'bg-white border-slate-300 text-slate-500 hover:border-brand-300 hover:text-slate-700'
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ═══════════════ RIGHT COLUMN ═══════════════ */}
                <div className="space-y-5">
                  {/* Section header */}
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                    <TrendingUp className="h-3.5 w-3.5 text-slate-800" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-800">
                      Impact & Execution
                    </span>
                  </div>

                  {/* 6. Expected Impact & 7. Measurement */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className={labelCls}>6. Expected Impact</Label>
                      <Select value={form.expected_impact} onValueChange={(v) => setField('expected_impact', v)}>
                        <SelectTrigger className="bg-slate-100 border-slate-200 h-10 text-sm">
                          <SelectValue placeholder="1–3 KPIs" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cost Saving">Cost Saving</SelectItem>
                          <SelectItem value="Revenue Improvement">Revenue Improvement</SelectItem>
                          <SelectItem value="Time">Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className={labelCls}>7. Measurement</Label>
                      <div className="flex gap-2">
                        <Select value={form.measurement_kpi} onValueChange={(v) => setField('measurement_kpi', v)}>
                          <SelectTrigger className="bg-slate-100 border-slate-200 h-10 text-sm flex-1">
                            <SelectValue placeholder="Financial KPI" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Financial KPI">Financial KPI</SelectItem>
                            <SelectItem value="Performance KPI">Performance KPI</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="RM Amount (money)"
                          value={form.measurement_unit}
                          onChange={(e) => setField('measurement_unit', e.target.value)}
                          className={cn(inputCls, 'flex-1')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 8. Key Teams Needed */}
                  <div className="space-y-1">
                    <Label className={labelCls}>8. Key Teams Needed</Label>
                    <Input
                      placeholder="List required departments"
                      value={form.key_teams}
                      onChange={(e) => setField('key_teams', e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  {/* 10. Cross Department Impact */}
                  <div className="space-y-1">
                    <Label className={labelCls}>10. Cross Department Impact</Label>
                    <Input
                      placeholder="Who else is affected and what changes for them?"
                      value={form.cross_dept_impact}
                      onChange={(e) => setField('cross_dept_impact', e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  {/* 11. Dependencies */}
                  <div className="space-y-1">
                    <Label className={labelCls}>11. Dependencies / Inputs Required</Label>
                    <Input
                      placeholder="Systems, data, approvals, vendors, materials"
                      value={form.dependencies}
                      onChange={(e) => setField('dependencies', e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  {/* 12. Desired Timeline */}
                  <div className="space-y-1">
                    <Label className={labelCls}>12. Desired Timeline</Label>
                    <DateRangePicker date={dateRange} setDate={handleDateChange} />
                  </div>

                  {/* Supporting Artifact */}
                  <div className="space-y-2">
                    <Label className={cn(labelCls, 'text-brand-600')}>
                      Supporting Artifact (Optional)
                    </Label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp,.txt,.csv"
                      disabled={uploading}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleFileUpload(f); e.target.value = '' } }}
                      className="text-sm text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border file:border-slate-300 file:text-xs file:font-medium file:bg-white file:text-slate-700 hover:file:bg-slate-50 cursor-pointer disabled:opacity-50"
                    />
                    {uploading && <p className="text-[11px] text-brand-600">Uploading...</p>}
                    {(() => {
                      const urls = form.attachment_url ? form.attachment_url.split(',') : []
                      if (urls.length === 0) return null
                      return (
                        <div className="space-y-1 mt-2">
                          {urls.map((u, i) => (
                            <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded px-2 py-1">
                              <p className="text-[11px] text-emerald-600 font-medium truncate flex-1 leading-none">
                                ✓ {u.split('/').pop()?.slice(-40) || 'Attached File'}
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  const newArr = urls.filter((_, idx) => idx !== i)
                                  setForm(p => ({ ...p, attachment_url: newArr.join(',') }))
                                }}
                                className="text-[10px] text-slate-400 hover:text-red-500 font-bold ml-2 leading-none"
                              >
                                &#10005;
                              </button>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                    <div className="flex items-center gap-2 mt-4">
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="text-[10px] text-slate-400 uppercase">or paste link</span>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://..."
                        value={linkInput}
                        onChange={(e) => setLinkInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            if (linkInput.trim()) {
                              const arr = form.attachment_url ? form.attachment_url.split(',') : []
                              setForm(p => ({ ...p, attachment_url: [...arr, linkInput.trim()].join(',') }))
                              setLinkInput('')
                            }
                          }
                        }}
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (linkInput.trim()) {
                            const arr = form.attachment_url ? form.attachment_url.split(',') : []
                            setForm(p => ({ ...p, attachment_url: [...arr, linkInput.trim()].join(',') }))
                            setLinkInput('')
                          }
                        }}
                        className="px-4 bg-brand-50 text-brand-700 text-xs font-bold rounded-lg border border-brand-200 hover:bg-brand-100 transition-colors"
                      >Add</button>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* ── Footer ── */}
            <div className="shrink-0 border-t border-slate-100 bg-white pl-8 pr-28 py-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 rounded border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm transition-colors"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Submit Request
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
