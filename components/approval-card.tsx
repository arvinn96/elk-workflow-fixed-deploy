'use client'

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, MessageSquare, Calendar, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { TypeBadge } from '@/components/type-badge'
import { PipelineTracker } from '@/components/pipeline-tracker'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials, formatRelativeTime, cn } from '@/lib/utils'
import type { RequestWithProfile } from '@/lib/types'

interface ApprovalCardProps {
  request: RequestWithProfile
  onDecision: (requestId: string, decision: 'approved' | 'rejected', comment: string) => Promise<void>
  onView?: (request: RequestWithProfile) => void
}

export const ApprovalCard = memo(function ApprovalCard({ request, onDecision, onView }: ApprovalCardProps) {
  const [showComment, setShowComment] = useState(false)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState<'approved' | 'rejected' | null>(null)

  async function handleDecision(decision: 'approved' | 'rejected') {
    setLoading(decision)
    await onDecision(request.id, decision, comment)
    setLoading(null)
  }

  return (
    <motion.div
      className="card overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
      layout
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {/* Card header - Clickable to view details */}
      <div 
        className={cn(
          "p-5 pb-4 transition-colors",
          onView ? "cursor-pointer hover:bg-slate-50/50" : ""
        )}
        onClick={() => onView?.(request)}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 min-w-0">
            <Avatar className="h-9 w-9 shrink-0 border border-slate-100 shadow-sm">
              <AvatarImage src={request.profiles?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-brand-50 text-brand-600 font-bold">
                {getInitials(request.profiles?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="font-heading text-base font-medium text-slate-900 leading-tight line-clamp-2">
                {request.title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                by <span className="font-medium text-slate-700">{request.profiles?.full_name ?? 'Unknown'}</span>
              </p>
            </div>
          </div>
          <TypeBadge type={request.type} className="shrink-0" />
        </div>

        {request.description && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-3">{request.description}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatRelativeTime(request.created_at)}
          </span>
          {request.department && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {request.department}
            </span>
          )}
        </div>
      </div>

      {/* Pipeline */}
      <div className="px-5 pb-4 border-t border-slate-100 pt-4">
        <PipelineTracker
          currentStage={request.current_stage}
          status={request.status}
          steps={request.approval_steps ?? []}
          compact
        />
      </div>

      {/* Comment area */}
      <AnimatePresence>
        {showComment && (
          <motion.div
            className="px-5 pb-4"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Textarea
              placeholder="Add a comment (optional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="text-sm min-h-[80px]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          onClick={() => setShowComment(!showComment)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          {showComment ? 'Hide comment' : 'Add comment'}
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDecision('rejected')}
            loading={loading === 'rejected'}
            disabled={!!loading}
            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
          >
            <X className="h-3.5 w-3.5" />
            Reject
          </Button>
          <Button
            size="sm"
            onClick={() => handleDecision('approved')}
            loading={loading === 'approved'}
            disabled={!!loading}
          >
            <Check className="h-3.5 w-3.5" />
            Approve
          </Button>
        </div>
      </div>
    </motion.div>
  )
})
