'use client'

import React from 'react'
import { 
  RotateCcw, AlertCircle, Loader2 
} from 'lucide-react'
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Props {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (comment: string) => Promise<void>
  targetStage: string
  isActionLoading?: boolean
}

export function RecallConfirmDialog({ 
  isOpen, 
  onOpenChange, 
  onConfirm, 
  targetStage, 
  isActionLoading = false 
}: Props) {
  const [comment, setComment] = React.useState('')

  // Reset comment when dialog closes/opens
  React.useEffect(() => {
    if (!isOpen) setComment('')
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-brand-600">
            <RotateCcw className="h-5 w-5" />
            Stage Recall Strategy
          </DialogTitle>
          <DialogDescription className="pt-2 text-slate-600 leading-relaxed text-sm">
            You are initiating a manual intervention to reset this project to the <strong>{targetStage.toUpperCase()}</strong> stage.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 my-2 flex gap-3 items-start">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-amber-800">Workflow Impact Warning</p>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              This action will permanently clear any approval history that occurred after this stage. 
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
            Recall Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Explain why this project is being recalled/reset..."
            className="w-full min-h-[100px] p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none"
          />
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onOpenChange(false)} 
            disabled={isActionLoading}
            className="text-[10px] font-bold uppercase tracking-widest border-slate-200"
          >
            Cancel
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => onConfirm(comment)}
            disabled={isActionLoading || comment.trim().length < 5}
            className="bg-brand-600 hover:bg-brand-700 text-[10px] font-bold uppercase tracking-widest min-w-[120px]"
          >
            {isActionLoading ? (
              <Loader2 className="h-3 w-3 animate-spin mr-2" />
            ) : (
              <RotateCcw className="h-3 w-3 mr-2" />
            )}
            Execute Recall
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
