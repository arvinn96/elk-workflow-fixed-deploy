'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Drop this anywhere inside a server-component page.
 * It subscribes to ALL changes on `requests` and `approval_steps`
 * and calls router.refresh() so the server component re-fetches
 * live data — keeping every open tab in sync.
 */
export function RealtimeRefresh() {
  const router = useRouter()
  const routerRef = useRef(router)
  // Keep ref current without putting router in the subscription effect's deps
  useEffect(() => { routerRef.current = router })

  useEffect(() => {
    const supabase = createClient()
    let timer: ReturnType<typeof setTimeout>

    function debouncedRefresh() {
      clearTimeout(timer)
      timer = setTimeout(() => routerRef.current.refresh(), 1200)
    }

    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        debouncedRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'approval_steps' },
        debouncedRefresh
      )
      .subscribe()

    return () => {
      clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, []) // stable forever — router accessed via ref

  return null
}
