'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckSquare, Inbox, RefreshCw } from 'lucide-react'
import { ApprovalCard } from '@/components/approval-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import type { RequestWithProfile, Role } from '@/lib/types'
import { toast } from 'sonner'
import { useRealtimeQueue } from '@/hooks/useRealtime'
import { triggerViewRequest } from '@/lib/events'

interface Props {
  initialQueue: RequestWithProfile[]
  userRole: Role
  userDepartment: string | null
}

export function QueueView({ initialQueue, userRole, userDepartment }: Props) {
  const [queue, setQueue] = useState<RequestWithProfile[]>(initialQueue)
  const [loading, setLoading] = useState(false)

  const fetchQueue = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true)
    try {
      const res = await fetch('/api/queue')
      if (!res.ok) throw new Error('Refresh failed')
      const data = await res.json()
      setQueue(data.queue || [])
    } catch {
      toast.error('Failed to sync queue')
    } finally {
      setLoading(false)
    }
  }, [])

  useRealtimeQueue({
    role: userRole,
    department: userDepartment,
    onNewRequest: () => {
      void fetchQueue(false)
    },
  })

  const handleDecision = useCallback(async (requestId: string, decision: 'approved' | 'rejected', comment: string) => {
    let originalQueue: RequestWithProfile[] = []
    setQueue((current) => {
      originalQueue = [...current]
      return current.filter((request) => request.id !== requestId)
    })

    try {
      const res = await fetch('/api/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, decision, comment }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Decision failed')
        setQueue(originalQueue)
        return
      }
      toast.success(decision === 'approved' ? 'Request approved' : 'Request rejected')
    } catch {
      toast.error('Network error — rollback initiated')
      setQueue(originalQueue)
    }
  }, [])

  const handleViewRequest = useCallback((request: RequestWithProfile) => {
    triggerViewRequest(request.id)
  }, [])

  const roleLabels: Record<string, string> = {
    hod: 'HOD (A1)',
    approval: 'DT (A2)',
    admin: 'Admin (A3)',
    super_admin: 'Super Admin (A4)',
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Approval Queue</h1>
          <p className="mt-0.5 text-sm text-slate-500 font-medium">
            Pending review for <span className="text-brand-600 uppercase text-[10px] font-bold tracking-widest">{roleLabels[userRole] ?? userRole}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => void fetchQueue(true)}
            disabled={loading}
            className="h-8 rounded-full border-slate-200 text-[10px] font-black uppercase tracking-widest"
          >
            <RefreshCw className={`h-3 w-3 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 shadow-sm">
            <CheckSquare className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-700">{queue.length} Tasks</span>
          </div>
        </div>
      </div>

      {loading && queue.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="card space-y-3 p-5">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      ) : queue.length === 0 ? (
        <motion.div
          className="flex flex-col items-center justify-center py-24 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100">
            <Inbox className="h-7 w-7 text-slate-300" />
          </div>
          <h3 className="font-heading mb-1 text-lg font-bold text-slate-800">Queue is clear</h3>
          <p className="max-w-xs text-sm text-slate-400 font-medium leading-relaxed">
            Excellent work. You've cleared all pending requests for your department.
          </p>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout" initial={false}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {queue.map((request) => (
              <ApprovalCard
                key={request.id}
                request={request}
                onDecision={handleDecision}
                onView={handleViewRequest}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
