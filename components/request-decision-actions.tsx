'use client'

import React from 'react'
import { 
  CheckCircle, XCircle, RotateCcw, Loader2, Clock 
} from 'lucide-react'
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { STAGE_ORDER, ROLE_LABELS, type RequestWithProfile, type Role } from '@/lib/types'

interface Props {
  request: RequestWithProfile
  userRole: string | undefined
  onSuccess?: () => void
}

export function RequestDecisionActions({ request, userRole, onSuccess }: Props) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [decisionType, setDecisionType] = React.useState<'approved' | 'rejected' | 'returned' | null>(null)
  const [comment, setComment] = React.useState('')

  const isPending = request.status === 'pending'
  const canDecide = userRole === 'super_admin' || userRole === request.current_stage

  if (!isPending) return null

  if (!canDecide) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
        <Clock className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
          Awaiting {request.current_stage?.replace(/_/g, ' ') || 'Process'} Review
        </span>
      </div>
    )
  }

  const handleProcess = async () => {
    if (!decisionType) return
    if (['rejected', 'returned'].includes(decisionType) && !comment.trim()) {
      toast.error(`A comment is required for ${decisionType === 'returned' ? 'returning' : 'rejecting'} the request.`)
      return
    }

    setIsProcessing(true)
    const toastId = toast.loading(`Processing ${decisionType} decision...`)

    try {
      const res = await fetch(`/api/requests/${request.id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: decisionType,
          comment: comment,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to process decision')

      toast.success(`Request ${decisionType} successfully`, { id: toastId })
      setDecisionType(null)
      setComment('')
      if (onSuccess) onSuccess()
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Action failed', { id: toastId })
    } finally {
      setIsProcessing(false)
    }
  }

  const stageKey = request.current_stage === 'complete' ? null : request.current_stage
  const currentIndex = stageKey ? STAGE_ORDER.indexOf(stageKey) : -1
  const prevStage = currentIndex > 0 ? STAGE_ORDER[currentIndex - 1] : null
  const prevLabel = prevStage ? (ROLE_LABELS[prevStage as Role] || prevStage).split(' (')[0] : null

  return (
    <>
      <div className="flex items-center gap-3">
        {prevStage && (
          <button
            type="button"
            onClick={() => setDecisionType('returned')}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-amber-600 border border-amber-200 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-50 hover:border-amber-300 transition-all shadow-sm shadow-amber-50"
          >
            <RotateCcw className="h-4 w-4" />
            Send Back to {prevLabel}
          </button>
        )}
        <button
          type="button"
          onClick={() => setDecisionType('rejected')}
          className="flex items-center gap-2 px-6 py-2.5 bg-white text-red-600 border border-red-200 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-50 hover:border-red-300 transition-all shadow-sm shadow-red-50"
        >
          <XCircle className="h-4 w-4" />
          Reject
        </button>
        <button
          type="button"
          onClick={() => setDecisionType('approved')}
          className="flex items-center gap-2 px-8 py-2.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 border border-emerald-500"
        >
          <CheckCircle className="h-4 w-4" />
          Approve
        </button>
      </div>

      <Dialog open={!!decisionType} onOpenChange={(o) => !o && setDecisionType(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
          <div className={cn(
            "p-6 flex items-center gap-4 text-white",
            decisionType === 'approved' ? "bg-emerald-600" : 
            decisionType === 'returned' ? "bg-amber-500" : "bg-red-600"
          )}>
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              {decisionType === 'approved' ? <CheckCircle className="h-6 w-6" /> : 
               decisionType === 'returned' ? <RotateCcw className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight leading-tight">
                Confirm {decisionType === 'returned' ? 'Return to Previous' : decisionType}
              </h3>
              <p className="opacity-90 text-[11px] font-medium mt-1">Please provide a briefly justification for this decision.</p>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Decision Comment</Label>
              <Textarea 
                placeholder={decisionType === 'approved' ? "Add optional feedback..." : "Provide a mandatory reason for this action..."}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[120px] bg-slate-50 border-slate-200 focus:bg-white transition-all text-sm resize-none"
              />
              {['rejected', 'returned'].includes(decisionType || '') && !comment.trim() && (
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">* A comment is mandatory for this action.</p>
              )}
            </div>
          </div>

          <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setDecisionType(null)
                setComment('')
              }}
              className="px-4 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors"
            >
              Go Back
            </button>
            <button
              type="button"
              onClick={handleProcess}
              disabled={isProcessing || (['rejected', 'returned'].includes(decisionType || '') && !comment.trim())}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md disabled:opacity-50",
                decisionType === 'approved' ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100" : 
                decisionType === 'returned' ? "bg-amber-500 hover:bg-amber-600 shadow-amber-100" : "bg-red-600 hover:bg-red-700 shadow-red-100"
              )}
            >
              {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : 
                decisionType === 'approved' ? <CheckCircle className="h-3 w-3" /> : 
                decisionType === 'returned' ? <RotateCcw className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              Confirm {decisionType === 'returned' ? 'Return' : decisionType}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
