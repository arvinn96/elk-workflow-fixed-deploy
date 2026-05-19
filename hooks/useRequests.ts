'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RequestWithProfile } from '@/lib/types'
import { REQUEST_LIST_SELECT } from '@/lib/supabase/selects'

// Select all request columns but only the specific profile/step columns consumed
// by the UI — trimming the embedded joins cuts payload size significantly.
async function readRequests() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('requests')
    .select(REQUEST_LIST_SELECT)
    .order('created_at', { ascending: false })
    .limit(100)

  return {
    data: (data as RequestWithProfile[]) ?? [],
    error,
  }
}

export function useRequests() {
  const [requests, setRequests] = useState<RequestWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchRequests(showSpinner = true) {
    if (showSpinner) {
      setLoading(true)
    }

    const result = await readRequests()
    if (result.error) {
      setError(result.error.message)
    } else {
      setRequests(result.data)
      setError(null)
    }

    setLoading(false)
  }

  useEffect(() => {
    let active = true

    async function initialLoad() {
      const result = await readRequests()
      if (!active) return

      if (result.error) {
        setError(result.error.message)
      } else {
        setRequests(result.data)
        setError(null)
      }

      setLoading(false)
    }

    void initialLoad()

    return () => {
      active = false
    }
  }, [])

  return { requests, loading, error, refetch: fetchRequests }
}
