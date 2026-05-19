'use client'

import React, { useState, useEffect } from 'react'
import { RequestDrawer } from './request-drawer'
import { ViewRequestDrawer } from './view-request-drawer'
import { 
  ELK_OPEN_REQUEST_DRAWER, 
  ELK_VIEW_REQUEST_DRAWER,
  type ExtractionData 
} from '@/lib/events'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { RequestWithProfile } from '@/lib/types'

interface Props {
  userRole: string
}

export function GlobalDrawerManager({ userRole }: Props) {
  const [createOpen, setCreateOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<RequestWithProfile | null>(null)
  const router = useRouter()

  useEffect(() => {
    const handleOpenCreate = (e: Event) => {
      setCreateOpen(true)
    }

    const handleOpenView = async (e: Event) => {
      const customEvent = e as CustomEvent<string>
      const requestId = customEvent.detail
      
      // PROFESSIONALLY set a "skinny" skeleton request first to show the drawer immediately.
      // We include current_stage and approval_steps to prevent sub-components from crashing.
      setSelectedRequest({ 
        id: requestId, 
        title: 'Loading details...',
        status: 'pending',
        current_stage: 'hod',
        type: 'project',
        created_at: new Date().toISOString(),
        profiles: { full_name: 'Loading...', role: '' },
        approval_steps: []
      } as any)
      setViewOpen(true)
    }

    window.addEventListener(ELK_OPEN_REQUEST_DRAWER, handleOpenCreate)
    window.addEventListener(ELK_VIEW_REQUEST_DRAWER, handleOpenView)
    
    return () => {
      window.removeEventListener(ELK_OPEN_REQUEST_DRAWER, handleOpenCreate)
      window.removeEventListener(ELK_VIEW_REQUEST_DRAWER, handleOpenView)
    }
  }, [])

  return (
    <>
      <RequestDrawer 
        open={createOpen} 
        onClose={() => setCreateOpen(false)} 
        onSuccess={() => {
          setCreateOpen(false)
          router.refresh()
        }}
      />
      
      <ViewRequestDrawer 
        request={selectedRequest}
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        userRole={userRole}
        onRefresh={() => router.refresh()}
      />
    </>
  )
}
