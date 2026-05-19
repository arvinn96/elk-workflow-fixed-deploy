'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Bot, ExternalLink as NewTab, Printer } from 'lucide-react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import type { RequestWithProfile } from '@/lib/types'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { generateBrdHtml, type BRDDocument } from '@/lib/supabase/brd-utils'
import { AlertTriangle } from 'lucide-react'

// Dynamic imports for the heavy components
const ViewRequestViewer = dynamic(() => import('./view-request-viewer').then(m => m.ViewRequestViewer), {
  loading: () => <div className="flex h-full items-center justify-center bg-white"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>
})

const ViewRequestEditor = dynamic(() => import('./view-request-editor').then(m => m.ViewRequestEditor), {
  loading: () => <div className="flex h-full items-center justify-center bg-white"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>
})

/**
 * PRODUCTION ERROR BOUNDARY
 * Prevents local UI crashes from terms like "undefined.slice" 
 * from turning the entire dashboard black.
 */
class RequestErrorBoundary extends React.Component<
  { children: React.ReactNode; onClose: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; onClose: () => void }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[DRAWER_CRASH]', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-white p-12 text-center text-slate-800">
          <div className="h-16 w-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 border border-red-100">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-black mb-2">Something went wrong</h2>
          <p className="text-sm text-slate-500 mb-8 max-w-xs leading-relaxed">
            The request viewer encountered a critical error while trying to render the details.
          </p>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-left mb-8 w-full max-w-md">
             <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Error Trace</p>
             <p className="text-[11px] font-mono text-red-600 line-clamp-3">{this.state.error?.message || 'Unknown runtime error'}</p>
          </div>
          <button 
            onClick={this.props.onClose}
            className="w-full max-w-[200px] h-11 bg-brand-600 text-white font-black uppercase tracking-widest text-[10px] rounded-lg"
          >
            Go Back
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

interface Props {
  request: RequestWithProfile | null
  open: boolean
  onClose: () => void
  userRole?: string
  onRefresh?: () => void
}

export function ViewRequestDrawer({ request: initialRequest, open, onClose, userRole, onRefresh }: Props) {
  const router = useRouter()
  const [request, setRequest] = React.useState<RequestWithProfile | null>(initialRequest)
  const [isEditing, setIsEditing] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isFetchingFull, setIsFetchingFull] = React.useState(false)
  const [isGeneratingBrd, setIsGeneratingBrd] = React.useState(false)
  const [generatedBrd, setGeneratedBrd] = React.useState<BRDDocument | null>(null)
  const [showBrdViewer, setShowBrdViewer] = React.useState(false)

  // Sync initialRequest to local state
  React.useEffect(() => {
    if (initialRequest) {
      setRequest(initialRequest)
    }
  }, [initialRequest])

  // PROFESSIONALLY fetch forensic details if they are missing (Data Diet Strategy)
  React.useEffect(() => {
    // We fetch full details if we don't have audit_logs yet (which only come from the detail API)
    if (open && request && !request.audit_logs && !isFetchingFull) {
      const fetchFull = async () => {
        setIsFetchingFull(true)
        try {
          const res = await fetch(`/api/requests?id=${request.id}`)
          if (!res.ok) throw new Error('Failed to fetch details')
          const data = await res.json()
          setRequest(data.request)
        } catch (err) {
          console.error(err)
        } finally {
          setIsFetchingFull(false)
        }
      }
      void fetchFull()
    }
  }, [open, request?.id, isFetchingFull])

  if (!request) return null

  const handleSave = async (form: any) => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success('Request updated successfully')
      setIsEditing(false)
      onRefresh?.()
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleGenerateBrd = async () => {
    setIsGeneratingBrd(true)
    const toastId = toast.loading('Drafting BRD with AI...')
    try {
      const res = await fetch('/api/brd/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGeneratedBrd(data.brd)
      setShowBrdViewer(true)
      toast.success('BRD drafted successfully!', { id: toastId })
    } catch (err: any) {
      toast.error(err.message, { id: toastId })
    } finally {
      setIsGeneratingBrd(false)
    }
  }

  const openBrdInNewTab = (autoPrint = false) => {
    if (!generatedBrd) return
    const html = generateBrdHtml(generatedBrd, request.id, autoPrint)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed right-0 top-0 bottom-0 z-[70] bg-white shadow-2xl w-full max-w-4xl border-l border-slate-200" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
            <RequestErrorBoundary onClose={onClose}>
              {isEditing ? (
                <ViewRequestEditor 
                  request={request} 
                  onSave={handleSave} 
                  isSaving={isSaving} 
                  onCancel={() => setIsEditing(false)} 
                  userRole={userRole}
                  onDeleteSuccess={() => {
                    onClose()
                    onRefresh?.()
                    router.refresh()
                  }}
                />
              ) : (
                <ViewRequestViewer request={request} userRole={userRole} onEdit={() => setIsEditing(true)} onGenerateBrd={handleGenerateBrd} isGeneratingBrd={isGeneratingBrd} onClose={onClose} onRefresh={onRefresh} />
              )}
            </RequestErrorBoundary>
            
            {isFetchingFull && <div className="absolute inset-0 z-[80] bg-white/50 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-600" /></div>}
          </motion.div>

          <Dialog open={showBrdViewer} onOpenChange={setShowBrdViewer}>
            <DialogContent className="max-w-5xl w-full h-[90vh] p-0 flex flex-col border-none shadow-2xl rounded-2xl">
              <DialogTitle className="sr-only">AI BRD — {generatedBrd?.title}</DialogTitle>
              <div className="shrink-0 px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-white">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center"><Bot className="h-4 w-4 text-white" /></div>
                  <p className="text-sm font-black text-slate-900 leading-tight">{generatedBrd?.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openBrdInNewTab(false)} className="flex items-center gap-1.5 h-8 px-4 rounded-lg border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:text-brand-600 transition-all"><NewTab className="h-3.5 w-3.5" /> View in New Tab</button>
                  <button onClick={() => openBrdInNewTab(true)} className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-brand-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-brand-700 transition-all"><Printer className="h-3.5 w-3.5" /> Download PDF</button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto bg-slate-100 p-6">
                {generatedBrd && (
                  <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-10 font-sans">
                     {/* Simplified preview for the drawer, recommend "New Tab" for full experience */}
                     <h1 className="text-2xl font-black mb-4">{generatedBrd.title}</h1>
                     <p className="text-sm text-slate-600 mb-8">{generatedBrd.sections.executive_summary}</p>
                     <div className="space-y-6">
                       <section>
                         <h3 className="text-xs font-black uppercase tracking-widest text-brand-600 mb-2">Problem Statement</h3>
                         <p className="text-sm text-slate-700">{generatedBrd.sections.problem_statement}</p>
                       </section>
                       <section>
                         <h3 className="text-xs font-black uppercase tracking-widest text-brand-600 mb-2">Scope Summary</h3>
                         <p className="text-sm text-slate-700">{generatedBrd.sections.proposed_solution.overview}</p>
                       </section>
                     </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </AnimatePresence>
  )
}
