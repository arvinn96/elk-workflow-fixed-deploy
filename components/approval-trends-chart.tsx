'use client'

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useState, useEffect } from 'react'

interface TrendsChartProps {
  data: {
    date: string
    submitted: number
    approved: number
  }[]
}

export function ApprovalTrendsChart({ data }: TrendsChartProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div className="h-[220px] w-full bg-slate-50/50 animate-pulse rounded" />
  }

  return (
    <div className="h-[220px] w-full" style={{ minWidth: 0, minHeight: 0 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#94a3b8' }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#94a3b8' }} 
            allowDecimals={false}
            domain={[0, (dataMax: number) => Math.max(dataMax, 4)]}
          />
          <Tooltip
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ 
              borderRadius: '4px', 
              border: '1px solid #e2e8f0',
              boxShadow: 'var(--shadow-card)',
              fontSize: '11px',
              fontFamily: 'inherit',
              padding: '8px 12px',
            }}
          />
          <Legend 
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ fontSize: '10px', paddingBottom: '20px' }}
          />
          
          {/* Total Submissions */}
          <Bar 
            dataKey="submitted" 
            name="Total Requests" 
            fill="#8b5cf6" 
            barSize={24} 
            radius={[4, 4, 0, 0]}
          />

          {/* Overall Approval Trend */}
          <Line 
            type="monotone" 
            dataKey="approved" 
            name="Overall Approved" 
            stroke="#10b981" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
