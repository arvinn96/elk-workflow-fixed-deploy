'use client'

import React, { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, Eye } from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { TypeBadge } from '@/components/type-badge'
import { PipelineTracker } from '@/components/pipeline-tracker'
import { formatDateTime, cn } from '@/lib/utils'
import type { RequestWithProfile } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

import { triggerViewRequest } from '@/lib/events'

import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { UCD_STATUSES, type RequestStatus } from '@/lib/types'
import { RecallConfirmDialog } from './recall-confirm-dialog'
import { UCDStatusConfirmDialog } from './ucd-status-confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Props {
  requests: RequestWithProfile[]
  userRole?: string
  allowDeletion?: boolean
  onView?: (request: RequestWithProfile) => void
  onRefresh?: () => void
  navigateOnRowClick?: boolean
}

type SortKey = 'request' | 'submitted_by' | 'type' | 'pipeline' | 'status' | 'date'
type SortOrder = 'asc' | 'desc'

export const RequestsTable = React.memo(function RequestsTable({ 
  requests, 
  userRole, 
  allowDeletion = false, 
  onView, 
  onRefresh,
  navigateOnRowClick = false 
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  // Removal of selectedRequest state — handled by GlobalDrawerManager
  
  // Deletion state
  const [requestToDelete, setRequestToDelete] = useState<RequestWithProfile | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Recall state
  const [recallTarget, setRecallTarget] = useState<{ id: string, stage: string } | null>(null)
  const [isRecalling, setIsRecalling] = useState(false)

  // UCD Status change state
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ id: string, newStatus: RequestStatus, currentStatus: RequestStatus } | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const router = useRouter()

  async function handleStatusChange(requestId: string, newStatus: string, currentStatus: RequestStatus) {
    setPendingStatusUpdate({ id: requestId, newStatus: newStatus as RequestStatus, currentStatus })
  }

  async function handleConfirmStatusChange(comment: string) {
    if (!pendingStatusUpdate) return
    setIsUpdatingStatus(true)
    
    const toastId = toast.loading(`Updating status to ${pendingStatusUpdate.newStatus.toUpperCase()}...`)
    try {
      const res = await fetch(`/api/requests/${pendingStatusUpdate.id}/ucd-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: pendingStatusUpdate.newStatus,
          comment: comment 
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to update status')

      toast.success('Status updated successfully', { id: toastId })
      setPendingStatusUpdate(null)
      if (onRefresh) onRefresh()
      else router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update status', { id: toastId })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const sortedRequests = useMemo(() => {
    const data = [...requests]

    return data.sort((a, b) => {
      let valA: string | number = ''
      let valB: string | number = ''

      switch (sortKey) {
        case 'request':
          valA = a.title.toLowerCase()
          valB = b.title.toLowerCase()
          break
        case 'submitted_by':
          valA = (a.profiles?.full_name ?? '').toLowerCase()
          valB = (b.profiles?.full_name ?? '').toLowerCase()
          break
        case 'type':
          valA = a.type || ''
          valB = b.type || ''
          break
        case 'pipeline':
          valA = a.current_stage || ''
          valB = b.current_stage || ''
          break
        case 'status':
          valA = a.status || ''
          valB = b.status || ''
          break
        case 'date':
          valA = new Date(a.created_at).getTime()
          valB = new Date(b.created_at).getTime()
          break
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [requests, sortKey, sortOrder])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  const handleRowClick = (req: RequestWithProfile) => {
    if (navigateOnRowClick) {
      router.push(`/requests/${req.id}`)
    } else {
      triggerViewRequest(req.id)
      onView?.(req)
    }
  }

  const handleRecall = async (requestId: string, targetStage: string) => {
    setRecallTarget({ id: requestId, stage: targetStage })
  }

  const handleConfirmRecall = async (comment: string) => {
    if (!recallTarget) return
    setIsRecalling(true)

    const toastId = toast.loading('Recalling project...')
    try {
      const res = await fetch(`/api/requests/${recallTarget.id}/recall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          stage: recallTarget.stage,
          comment: comment 
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Recall failed')
      }

      toast.success('Project recalled successfully', { id: toastId })
      setRecallTarget(null)
      if (onRefresh) onRefresh()
      else router.refresh()
    } catch (err: any) {
      toast.error(err.message, { id: toastId })
    } finally {
      setIsRecalling(false)
    }
  }

  const handleDeleteRequest = async () => {
    if (!requestToDelete) return
    setIsDeleting(true)

    try {
      const resp = await fetch(`/api/requests?id=${requestToDelete.id}`, {
        method: 'DELETE',
      })

      const data = await resp.json()

      if (!resp.ok) {
        throw new Error(data.error || 'Failed to delete request.')
      }

      toast.success('Request deleted successfully.')
      setRequestToDelete(null)
      setIsDeleting(false)
      onRefresh?.()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete request.')
      setIsDeleting(false)
    }
  }

  const canDelete = userRole === 'super_admin' && allowDeletion

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              <SortHeader
                label="Request"
                sortKey="request"
                activeKey={sortKey}
                order={sortOrder}
                onSort={toggleSort}
                className="px-5 py-3 w-full"
              />
              <SortHeader
                label="Submitted By"
                sortKey="submitted_by"
                activeKey={sortKey}
                order={sortOrder}
                onSort={toggleSort}
                className="px-5 py-3 hidden sm:table-cell"
              />
              <SortHeader
                label="Type"
                sortKey="type"
                activeKey={sortKey}
                order={sortOrder}
                onSort={toggleSort}
                className="px-5 py-3 hidden md:table-cell"
              />
              <SortHeader
                label="Pipeline"
                sortKey="pipeline"
                activeKey={sortKey}
                order={sortOrder}
                onSort={toggleSort}
                className="px-5 py-3 hidden lg:table-cell w-[240px] text-center"
              />
              <SortHeader
                label="Status"
                sortKey="status"
                activeKey={sortKey}
                order={sortOrder}
                onSort={toggleSort}
                className="px-5 py-3 text-center w-[160px]"
              />
              <SortHeader
                label="Date"
                sortKey="date"
                activeKey={sortKey}
                order={sortOrder}
                onSort={toggleSort}
                className="px-5 py-3 hidden xl:table-cell text-right whitespace-nowrap"
              />
              <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedRequests.map((req) => (
              <tr 
                key={req.id} 
                className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                onClick={() => handleRowClick(req)}
              >
                <td className="px-5 py-4 align-middle h-[72px] whitespace-nowrap">
                  <div className="flex flex-col justify-center">
                    <p className="text-sm font-bold text-slate-900 truncate max-w-[180px] group-hover:text-brand-600 transition-colors leading-tight">
                      {req.title}
                    </p>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 sm:hidden mt-0.5">
                      {req.profiles?.full_name ?? '—'}
                    </p>
                  </div>
                </td>
                <td className="px-5 py-4 align-middle hidden sm:table-cell whitespace-nowrap">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7 rounded-full border border-slate-200">
                      <AvatarImage src={req.profiles?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[10px] bg-slate-100 font-bold text-slate-500">
                        {getInitials(req.profiles?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-slate-600 truncate max-w-[120px]">
                      {req.profiles?.full_name ?? '—'}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 align-middle hidden md:table-cell whitespace-nowrap">
                  <TypeBadge type={req.type} />
                </td>
                <td className="px-5 py-4 align-middle hidden lg:table-cell whitespace-nowrap w-[240px]">
                  <div className="flex justify-center">
                    <PipelineTracker
                      currentStage={req.current_stage}
                      status={req.status}
                      steps={req.approval_steps ?? []}
                      compact
                      onStageClick={userRole === 'super_admin' ? (stage) => handleRecall(req.id, stage) : undefined}
                    />
                  </div>
                </td>
                <td className="px-5 py-4 align-middle text-center w-[160px]">
                  <div className="flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
                    {userRole === 'ucd' && ['approved', 'sprint', 'uat', 'completed'].includes(req.status) ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="focus:outline-none hover:opacity-80 transition-opacity">
                          <StatusBadge status={req.status} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          {UCD_STATUSES.map((status) => (
                            <DropdownMenuItem
                              key={status.value}
                              onClick={() => void handleStatusChange(req.id, status.value, req.status)}
                              className="text-xs font-semibold"
                            >
                              <div className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: status.color }} />
                              {status.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <StatusBadge status={req.status} />
                    )}
                  </div>
                </td>
                <td className="px-5 py-4 align-middle text-[11px] font-semibold text-slate-500 hidden xl:table-cell text-right tabular-nums whitespace-nowrap">
                  {formatDateTime(req.created_at).split(',')[0]}
                </td>
                <td className="px-5 py-4 align-middle text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <div className="p-1.5 text-slate-300 group-hover:text-brand-600 group-hover:bg-brand-50 rounded-md transition-all duration-200">
                      <Eye className="h-4.5 w-4.5" />
                    </div>
                    {canDelete && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          setRequestToDelete(req)
                        }}
                        className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200"
                        title="Delete Request"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {/* Single Deletion Modal */}
      <Dialog open={!!requestToDelete} onOpenChange={(o) => !o && setRequestToDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Request?
            </DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to permanently delete this request from the system? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-xs font-bold text-slate-900 line-clamp-1">{requestToDelete?.title}</p>
              <p className="text-[10px] text-slate-400 mt-1">Submitted by {requestToDelete?.profiles?.full_name}</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setRequestToDelete(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              size="sm" 
              className="font-bold uppercase tracking-wider text-[10px]"
              onClick={handleDeleteRequest}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Trash2 className="h-3 w-3 mr-2" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RecallConfirmDialog 
        isOpen={!!recallTarget}
        onOpenChange={(open) => !open && setRecallTarget(null)}
        onConfirm={handleConfirmRecall}
        targetStage={recallTarget?.stage || ''}
        isActionLoading={isRecalling}
      />

      <UCDStatusConfirmDialog 
        isOpen={!!pendingStatusUpdate}
        onOpenChange={(open) => !open && setPendingStatusUpdate(null)}
        onConfirm={handleConfirmStatusChange}
        currentStatus={pendingStatusUpdate?.currentStatus || 'approved'}
        newStatus={pendingStatusUpdate?.newStatus || null}
        isActionLoading={isUpdatingStatus}
      />
    </>
  )
})

function SortHeader({
  label,
  sortKey,
  activeKey,
  order,
  onSort,
  className = '',
}: {
  label: string
  sortKey: SortKey
  activeKey: SortKey
  order: SortOrder
  onSort: (key: SortKey) => void
  className?: string
}) {
  const isActive = activeKey === sortKey

  return (
    <th className={cn('text-[10px] font-bold text-slate-400 uppercase tracking-widest', className)}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onSort(sortKey)
        }}
        className={cn(
          "flex items-center gap-1.5 hover:text-brand-600 transition-colors group cursor-pointer bg-transparent border-0 p-0 outline-none w-full",
          className.includes('text-right') ? 'justify-end' : 
          className.includes('text-center') ? 'justify-center' : 'justify-start'
        )}
      >
        <span>{label}</span>
        <div className={cn(
          'flex flex-col space-y-[1px] transition-opacity shrink-0',
          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
        )}>
          <ChevronUp className={cn("h-2 w-2", isActive && order === 'asc' ? 'text-brand-600' : 'text-slate-300')} />
          <ChevronDown className={cn("h-2 w-2", isActive && order === 'desc' ? 'text-brand-600' : 'text-slate-300')} />
        </div>
      </button>
    </th>
  )
}
