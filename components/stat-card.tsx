'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number
  trend?: number
  accentColor?: string
  icon?: React.ReactNode
  className?: string
}

export function StatCard({ label, value, trend, accentColor = '#1a6b45', icon, className }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let start = 0
    const end = value
    if (start === end) {
      setDisplayValue(value)
      return
    }
    const duration = 600
    const step = Math.ceil(end / (duration / 16))
    const timer = setInterval(() => {
      start = Math.min(start + step, end)
      setDisplayValue(start)
      if (start >= end) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [value])

  const TrendIcon = trend === undefined ? Minus : trend > 0 ? TrendingUp : TrendingDown
  const trendColor = trend === undefined ? 'text-slate-500' : trend > 0 ? 'text-brand-500' : 'text-red-500'

  return (
    <div
      className={cn(
        'card px-6 py-5 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 group',
        className
      )}
      style={{
        borderLeft: `4px solid ${accentColor}`,
      }}
    >
      {/* Decorative large background blob */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -right-4 w-24 h-24 rounded-3xl opacity-[0.08] transition-transform duration-500 group-hover:scale-110"
        style={{ background: accentColor }}
      />

      <div className="flex items-center justify-between relative z-10 w-full">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</p>
          <p className="text-4xl font-semibold text-slate-900 animate-count-up tabular-nums leading-none">
            {displayValue}
          </p>
        </div>
        {icon && (
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ 
              background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
              color: accentColor 
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {trend !== undefined && (
        <div className={cn('flex items-center gap-1 mt-4 text-xs font-medium', trendColor)}>
          <TrendIcon className="h-3 w-3" />
          <span>{Math.abs(trend)}% from last month</span>
        </div>
      )}
    </div>
  )
}
