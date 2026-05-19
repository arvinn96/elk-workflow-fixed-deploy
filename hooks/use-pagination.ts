import { useState, useCallback, useRef } from 'react'

export function usePagination<T>(fetcher: (offset: number, limit: number) => Promise<T[]>, initialLimit = 20) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  const loadingRef = useRef(false)
  const offsetRef = useRef(0)
  const hasMoreRef = useRef(true)

  const loadMore = useCallback(async (reset = false) => {
    if (loadingRef.current || (!hasMoreRef.current && !reset)) return
    
    loadingRef.current = true
    setLoading(true)
    const currentOffset = reset ? 0 : offsetRef.current
    
    try {
      const newItems = await fetcher(currentOffset, initialLimit)
      
      setItems(prev => reset ? newItems : [...prev, ...newItems])
      
      const more = newItems.length === initialLimit
      hasMoreRef.current = more
      setHasMore(more)
      
      const newOffset = currentOffset + initialLimit
      offsetRef.current = newOffset
      setOffset(newOffset)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [fetcher, initialLimit])

  const refresh = useCallback(() => loadMore(true), [loadMore])

  return { items, loading, hasMore, loadMore, refresh, mutate: setItems }
}
