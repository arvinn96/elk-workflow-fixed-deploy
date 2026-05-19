'use client'

import { Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition, useEffect, useState } from 'react'

export function DashboardFilterControls() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') ?? '')

  // Update URL on search change with improved stability
  useEffect(() => {
    const currentQ = searchParams.get('q') ?? ''
    if (searchTerm === currentQ) return

    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (searchTerm) params.set('q', searchTerm)
      else params.delete('q')
      
      startTransition(() => {
        router.replace(`?${params.toString()}`, { scroll: false })
      })
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, router, searchParams])

  // Sync searchTerm state with URL changes (e.g. back button)
  useEffect(() => {
    const q = searchParams.get('q') ?? ''
    if (q !== searchTerm) setSearchTerm(q)
  }, [searchParams])

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all' || value === 'All Status') params.delete(key)
    else params.set(key, value)
    
    startTransition(() => {
      router.replace(`?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search everything..." 
          className="h-8 w-48 bg-white border border-slate-200 rounded px-8 text-[10px] focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all font-medium placeholder:text-slate-400" 
        />
        {isPending && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
      <div className="h-4 w-px bg-slate-200 hidden md:block" />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Period</span>
          <select 
            onChange={(e) => handleFilterChange('period', e.target.value)}
            defaultValue={searchParams.get('period') ?? '7'}
            className="h-7 bg-white border border-slate-200 rounded px-1.5 text-[10px] font-bold text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="7">7D</option>
            <option value="30">30D</option>
            <option value="90">90D</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Status</span>
          <select 
             onChange={(e) => handleFilterChange('status', e.target.value)}
             defaultValue={searchParams.get('status') ?? 'all'}
             className="h-7 bg-white border border-slate-200 rounded px-1.5 text-[10px] font-bold text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
    </div>
  )
}
