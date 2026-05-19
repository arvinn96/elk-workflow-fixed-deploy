'use client'

import React, { useState, useEffect } from 'react'
import { 
  CheckCircle2, Clock, Zap, MessageSquare, AlertCircle, Loader2 
} from 'lucide-react'
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { RequestStatus } from '@/lib/types'

interface Props {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (comment: string) => Promise<void>
  currentStatus: RequestStatus
  newStatus: RequestStatus | null
  isActionLoading?: boolean
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  sprint: Zap,
  uat: Clock,
  completed: CheckCircle2,
}

const STATUS_COLORS: Record<string, string> = {
  sprint: 'text-brand-600 bg-brand-50',
  uat: 'text-blue-600 bg-blue-50',
  completed: 'text-emerald-600 bg-emerald-50',
}

export function UCDStatusConfirmDialog({ 
  isOpen, 
  onOpenChange, 
  onConfirm, 
  currentStatus,
  newStatus, 
  isActionLoading = false 
}: Props) {
  const [comment, setComment] = useState('')

  // Check if comment is mandatory
  const isMandatory = newStatus === 'completed' || currentStatus === 'completed'
  const canConfirm = !isMandatory || comment.trim().length >= 5

  useEffect(() => {
    if (isOpen) setComment('')
  }, [isOpen])

  if (!newStatus) return null

  const Icon = STATUS_ICONS[newStatus] || MessageSquare

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn("p-2 rounded-lg", STATUS_COLORS[newStatus])}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-slate-900">Update Delivery Status</DialogTitle>
              <DialogDescription className="text-xs">
                Moving project from <span className="font-bold uppercase">{currentStatus}</span> to <span className="font-bold uppercase text-slate-900">{newStatus}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <MessageSquare className="h-3 w-3" />
              Deployment Note {isMandatory && <span className="text-red-500">*Mandatory</span>}
            </label>
            <Textarea
              placeholder={isMandatory ? "Explain the reason for completion or recall (min. 5 chars)..." : "Any updates or notes for this status change? (Optional)"}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px] text-sm resize-none border-slate-200 focus:border-brand-300 focus:ring-brand-100/50"
              disabled={isActionLoading}
            />
          </div>

          {isMandatory && comment.trim().length < 5 && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-800 leading-tight">
                <strong>History Requirement:</strong> Transitions to or from &apos;Completed&apos; must be documented with a short reason for the audit trail.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onOpenChange(false)} 
            disabled={isActionLoading}
            className="text-[10px] font-black uppercase tracking-widest border-slate-200"
          >
            Cancel
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => onConfirm(comment)}
            disabled={isActionLoading || !canConfirm}
            className="bg-brand-600 hover:bg-brand-700 text-[10px] font-black uppercase tracking-widest min-w-[120px]"
          >
            {isActionLoading ? (
              <Loader2 className="h-3 w-3 animate-spin mr-2" />
            ) : (
              <Icon className="h-3 w-3 mr-2" />
            )}
            Confirm Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
