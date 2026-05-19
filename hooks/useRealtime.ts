'use client'

import { useEffect, useRef } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface UseRealtimeQueueOptions {
  role: string
  department?: string | null
  onNewRequest?: () => void
}

interface RealtimeRequestRow {
  current_stage: string
  status: string
  submitted_by: string
  department?: string | null
}

export function useRealtimeQueue({ role, department, onNewRequest }: UseRealtimeQueueOptions) {
  // Store the callback in a ref so it never needs to be in the effect dep array.
  // Previously `onNewRequest` was an inline arrow in the JSX, so it was a new
  // function reference on every render — causing the effect to run on every
  // render, tearing down and re-opening the WebSocket channel each time.
  const onNewRequestRef = useRef(onNewRequest)
  useEffect(() => { onNewRequestRef.current = onNewRequest })

  useEffect(() => {
    if (!role) return

    const supabase = createClient()
    const stageMap: Record<string, string> = {
      hod: 'hod',
      approval: 'approval',
      admin: 'admin',
      super_admin: 'super_admin',
    }

    const myStage = stageMap[role]
    if (!myStage) return

    const channel = supabase
      .channel('realtime-queue')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'requests',
          filter: `current_stage=eq.${myStage}`,
        },
        async (payload: RealtimePostgresChangesPayload<RealtimeRequestRow>) => {
          const req = payload.new as RealtimeRequestRow | null

          if (!req || req.status !== 'pending') return

          // Get submitter name
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', req.submitted_by)
            .single()

          toast.info(
            `New request from ${profile?.full_name ?? 'someone'} needs your approval`,
            { duration: 5000 }
          )

          onNewRequestRef.current?.()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [role, department]) // onNewRequest intentionally excluded — tracked via ref above
}

interface UseRealtimeRequestOptions {
  requestId: string
  onUpdate?: () => void
}

export function useRealtimeRequest({ requestId, onUpdate }: UseRealtimeRequestOptions) {
  const onUpdateRef = useRef(onUpdate)
  useEffect(() => { onUpdateRef.current = onUpdate })

  useEffect(() => {
    if (!requestId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`realtime-request-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'requests',
          filter: `id=eq.${requestId}`,
        },
        () => { onUpdateRef.current?.() }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'approval_steps',
          filter: `request_id=eq.${requestId}`,
        },
        () => { onUpdateRef.current?.() }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [requestId]) // onUpdate excluded — tracked via ref above
}
