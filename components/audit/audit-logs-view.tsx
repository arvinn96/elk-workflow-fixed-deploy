'use client'

import React, { useCallback, useEffect, useState, useMemo, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ScrollText,
  History,
  Trash2,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { 
  ACTION_CONFIG_MAP, 
  DEFAULT_ACTION_CONFIG, 
  type ActionConfig 
} from './audit-config'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn, formatDateTime, formatRelativeTime, getInitials } from '@/lib/utils'
import type { AuditLogWithProfile, Role } from '@/lib/types'
import { triggerViewRequest } from '@/lib/events'
import { toast } from 'sonner'
import { usePagination } from '@/hooks/use-pagination'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Props {
  userRole: Role | ''
}

type FilterType = 'all' | 'submitted' | 'approved' | 'rejected'

export function AuditLogsView({ userRole }: Props) {
  const [activeTab, setActiveTab] = useState<FilterType>('all')
  const [isPending, startTransition] = useTransition()
  const [clearAllOpen, setClearAllOpen] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [titleMap, setTitleMap] = useState<Record<string, string>>({})

  const fetcher = useCallback(async (offset: number, limit: number) => {
    const res = await fetch(`/api/audit?offset=${offset}&limit=${limit}&action=${activeTab}`)
    if (!res.ok) return []
    const data = await res.json()
    
    // Merge title map for requests
    if (data.titleMap) {
      setTitleMap(prev => ({ ...prev, ...data.titleMap }))
    }
    
    return data.logs || []
  }, [activeTab])

  const { items: logs, loading, hasMore, loadMore, refresh, mutate } = usePagination<AuditLogWithProfile>(fetcher, 20)

  useEffect(() => {
    void refresh()
  }, [activeTab, refresh])

  const handleDeleteLog = async (e: React.MouseEvent, logId: string) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/audit/${logId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete log')
      mutate(prev => prev.filter(l => l.id !== logId))
      toast.success('Audit log entry removed')
    } catch {
      toast.error('Failed to remove forensic entry')
    }
  }

  const handleClearAll = async () => {
    setIsClearing(true)
    try {
      const res = await fetch('/api/audit', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to clear logs')
      mutate([])
      setClearAllOpen(false)
      toast.success('All audit logs cleared')
    } catch {
      toast.error('Failed to clear audit logs')
    } finally {
      setIsClearing(false)
    }
  }

  const groupedLogs = useMemo(() => {
    const groups: Record<string, AuditLogWithProfile[]> = {}
    logs.forEach(log => {
      const d = new Date(log.created_at)
      const dateKey = d.toDateString() === new Date().toDateString() ? 'Today' : 
                      d.toDateString() === new Date(Date.now() - 86400000).toDateString() ? 'Yesterday' :
                      d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(log)
    })
    return groups
  }, [logs])

  const renderDescription = (log: AuditLogWithProfile) => {
    const meta = (log.metadata ?? {}) as Record<string, string | undefined>
    const requestTitle = meta.request_title || meta.title || titleMap[log.entity_id || ''] || `request ${log.entity_id?.slice(0, 8)}`

    if (log.action === 'user_removed') return <span>Permanently removed user <b className="text-slate-900">{meta.target_name || 'Account'}</b></span>
    if (log.action === 'user_created') return <span>Provisioned account for <b className="text-slate-900">{meta.fullName || meta.target_name}</b> in <b className="text-slate-900">{meta.department}</b></span>
    if (log.action === 'user_role_updated') return <span>Access updated for <b className="text-slate-900">{meta.target_name}</b> to <b className="text-brand-600 uppercase text-[10px]">{meta.next_role}</b></span>
    if (log.action.includes('approved') || log.action.includes('rejected')) return <span>Decision on <b className="text-slate-900">{requestTitle}</b></span>
    if (log.action === 'request_submitted') return <span>New request <b className="text-slate-900">{requestTitle}</b> initiated</span>
    
    return <span>Performed <b className="text-slate-900">{ACTION_CONFIG_MAP[log.action]?.label || 'action'}</b> on {requestTitle}</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">System Audit Log</h1>
          <p className="mt-1 text-sm text-slate-500 flex items-center gap-1.5 font-medium">
            <History className="h-4 w-4" />
            Complete forensic history
          </p>
        </div>
        <div className="flex items-center gap-3">
          {userRole === 'super_admin' && logs.length > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setClearAllOpen(true)}>
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear All
            </Button>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v as FilterType)
          startTransition(() => { /* triggers refresh */ })
        }}>
          <TabsList className="bg-slate-100/80 p-1 rounded-full h-10 border border-slate-200">
            <TabsTrigger value="all" className="rounded-full px-5 text-xs font-semibold">All Events</TabsTrigger>
            <TabsTrigger value="submitted" className="rounded-full px-5 text-xs font-semibold">Submissions</TabsTrigger>
            <TabsTrigger value="approved" className="rounded-full px-5 text-xs font-semibold">Approvals</TabsTrigger>
            <TabsTrigger value="rejected" className="rounded-full px-5 text-xs font-semibold">Rejections</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className={cn("space-y-10 transition-opacity", isPending && "opacity-60")}>
        {Object.entries(groupedLogs).map(([date, dateLogs]) => (
          <div key={date} className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{date}</h2>
            <div className="space-y-3">
              {dateLogs.map((log) => {
                const config = ACTION_CONFIG_MAP[log.action] || DEFAULT_ACTION_CONFIG
                const Icon = config.icon
                return (
                  <motion.div 
                    key={log.id} 
                    className="group relative rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => log.entity_type === 'request' && triggerViewRequest(log.entity_id!)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border', config.color)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{config.label}</span>
                          <time className="text-[11px] font-medium text-slate-400 tabular-nums">• {formatDateTime(log.created_at).split(',')[1]}</time>
                        </div>
                        <div className="text-sm font-medium leading-relaxed">{renderDescription(log)}</div>
                        <div className="flex items-center gap-2 pt-1">
                          <Avatar className="h-5 w-5 rounded-md border">
                            <AvatarImage src={log.profiles?.avatar_url ?? undefined} />
                            <AvatarFallback className="text-[8px] font-bold">{getInitials(log.profiles?.full_name)}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-slate-500 font-semibold">{log.profiles?.full_name ?? 'System'}</span>
                        </div>
                      </div>
                      {['admin', 'super_admin'].includes(userRole) && (
                        <button onClick={(e) => handleDeleteLog(e, log.id)} className="p-1.5 opacity-0 group-hover:opacity-100 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))}

        {hasMore && (
          <div className="flex justify-center pt-4">
            <Button variant="ghost" size="sm" onClick={() => loadMore()} disabled={loading} className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {loading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
              Load More Forensic Data
            </Button>
          </div>
        )}
      </div>

      <Dialog open={clearAllOpen} onOpenChange={setClearAllOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-500" /> Clear Audit Logs?</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearAllOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleClearAll} disabled={isClearing}>
              {isClearing && <Loader2 className="h-3 w-3 animate-spin mr-2" />} Delete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
