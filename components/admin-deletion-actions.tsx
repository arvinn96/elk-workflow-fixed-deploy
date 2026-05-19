'use client'

import React, { useState } from 'react'
import { 
  Trash2, AlertTriangle, ChevronDown, ChevronUp, 
  Loader2, RefreshCcw, ShieldAlert, Check
} from 'lucide-react'
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from '@/components/ui/dialog'
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DEPARTMENTS } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Props {
  onSuccess: () => void
}

export function AdminDeletionActions({ onSuccess }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  
  // Modals state
  const [confirmAllOpen, setConfirmAllOpen] = useState(false)
  const [confirmDeptOpen, setConfirmDeptOpen] = useState(false)
  
  const [deptToDelete, setDeptToDelete] = useState<string>('')
  const [confirmText, setConfirmText] = useState('')

  const supabase = createClient()

  async function handleDeleteAll() {
    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm.')
      return
    }

    setLoading('all')
    try {
      const resp = await fetch('/api/requests?all=true', {
        method: 'DELETE',
      })

      const data = await resp.json()

      if (!resp.ok) {
        throw new Error(data.error || 'Failed to delete system records.')
      }

      toast.success('System records deleted successfully.')
      setConfirmAllOpen(false)
      setConfirmText('')
      setLoading(null)
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete system records.')
      setLoading(null)
    }
  }

  async function handleDeleteDept() {
    if (!deptToDelete) return

    setLoading('dept')
    try {
      const resp = await fetch(`/api/requests?department=${deptToDelete}`, {
        method: 'DELETE',
      })

      const data = await resp.json()

      if (!resp.ok) {
        throw new Error(data.error || 'Failed to delete department records.')
      }

      toast.success(`All requests for ${deptToDelete} deleted.`)
      setConfirmDeptOpen(false)
      setDeptToDelete('')
      setLoading(null)
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete department records.')
      setLoading(null)
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-red-200 bg-red-50/30 overflow-hidden transition-all duration-300 shadow-sm">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-3 transition-colors hover:bg-red-50"
      >
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-red-100 flex items-center justify-center">
            <ShieldAlert className="h-4 w-4 text-red-600" />
          </div>
          <div className="text-left">
            <h3 className="text-xs font-bold text-red-900 uppercase tracking-[0.1em]">Super Admin Danger Zone</h3>
            <p className="text-[10px] text-red-500 font-medium -mt-0.5">Bulk data maintenance and archival tools</p>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4 text-red-400" /> : <ChevronDown className="h-4 w-4 text-red-400" />}
      </button>

      {isExpanded && (
        <div className="px-5 py-8 border-t border-red-100 flex flex-col items-center bg-white/40">
          
          {/* Unified System Delete Action */}
          <div className="space-y-4 max-w-sm w-full text-center">
            <div>
              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em] flex items-center justify-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                System Maintenance: Full Data Reset
              </h4>
              <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                Permanently delete every single request record currently in the system. 
                This action is irreversible and should only be used for complete system maintenance.
              </p>
            </div>
            <Button 
              variant="destructive" 
              className="w-full h-10 bg-red-600 hover:bg-red-700 text-[10px] font-black uppercase tracking-[0.15em] shadow-sm"
              disabled={!!loading}
              onClick={() => setConfirmAllOpen(true)}
            >
              {loading === 'all' ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <ShieldAlert className="h-4 w-4 mr-2" />}
              Absolute System Deletion
            </Button>
          </div>

        </div>
      )}

      {/* Confirmation Modals */}
      <Dialog open={confirmDeptOpen} onOpenChange={setConfirmDeptOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Trash2 className="h-5 w-5 text-red-500" />
              Confirm Department Deletion
            </DialogTitle>
            <DialogDescription className="text-sm py-2">
              You are about to delete <strong>ALL</strong> requests from the <strong>{deptToDelete}</strong> department. 
              This will remove every file, pipeline step, and record associated with this department.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 p-3 rounded-lg flex gap-3 items-start border border-red-100">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-[11px] text-red-700 font-medium">
              This action is permanent and cannot be reversed by anyone, including Admins.
            </p>
          </div>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmDeptOpen(false)} className="text-xs">Cancel</Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleDeleteDept} 
              className="text-xs font-bold uppercase tracking-wider"
              disabled={!!loading}
            >
              {loading === 'dept' && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmAllOpen} onOpenChange={setConfirmAllOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="h-6 w-6" />
              Critical System Action
            </DialogTitle>
            <DialogDescription className="text-sm pt-2">
              This will result in an **Absolute Deletion** of the database for all request records. 
              This is a standard system reset tool for Super Admins.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Type "DELETE" to confirm absolute deletion
              </label>
              <Input 
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="h-10 border-red-200 focus:ring-red-500 focus:border-red-500 uppercase font-mono text-center tracking-widest text-red-600"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmAllOpen(false)} className="text-xs">Go Back</Button>
            <Button 
              variant="destructive" 
              size="sm" 
              className={cn(
                "text-xs font-black uppercase tracking-widest",
                confirmText === 'DELETE' ? 'bg-red-600 hover:bg-red-700 opacity-100' : 'opacity-50'
              )}
              onClick={handleDeleteAll}
              disabled={confirmText !== 'DELETE' || !!loading}
            >
              {loading === 'all' && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
              Execute Deletion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
