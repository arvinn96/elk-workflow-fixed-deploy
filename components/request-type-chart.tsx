'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { useState, useEffect } from 'react'

interface RequestTypeChartProps {
  data: {
    name: string
    value: number
    fill: string
  }[]
}

export function RequestTypeChart({ data }: RequestTypeChartProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Filter out zero values for cleaner chart
  const activeData = data.filter((item) => item.value > 0)

  if (!isMounted) {
    return <div className="h-[220px] w-full bg-slate-50/50 animate-pulse rounded" />
  }

  if (activeData.length === 0) {
    return (
      <div className="h-[220px] w-full flex items-center justify-center text-sm text-slate-400">
        No data available
      </div>
    )
  }

  return (
    <div className="h-[220px] w-full" style={{ minWidth: 0, minHeight: 0 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <PieChart>
          <Pie
            data={activeData}
            innerRadius={45}
            outerRadius={70}
            paddingAngle={4}
            dataKey="value"
            stroke="none"
          >
            {activeData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              fontSize: '13px',
              fontFamily: 'inherit',
              padding: '12px',
            }}
            itemStyle={{ color: '#0f172a' }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={32}
            iconType="circle"
            wrapperStyle={{ fontSize: '11px' }}
            formatter={(value, entry: any) => (
              <span className="text-slate-600 font-medium ml-1">
                {value.charAt(0).toUpperCase() + value.slice(1)} <span className="text-slate-400 ml-0.5">({entry.payload.value})</span>
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
