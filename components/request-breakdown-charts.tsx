'use client'

import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Cell, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar,
} from 'recharts'

function MountGuard({ children, height = 160 }: { children: React.ReactNode; height?: number }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return <div className="animate-pulse bg-slate-50 rounded" style={{ height }} />
  return <>{children}</>
}

/* ── By Priority — horizontal bar ── */
export function PriorityChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  return (
    <div className="card p-4">
      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">By Priority</h3>
      <MountGuard height={140}>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 16, left: 4, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#64748b' }}
              width={52}
            />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ fontSize: '11px', borderRadius: '4px', border: '1px solid #e2e8f0', padding: '6px 10px' }}
              formatter={(v) => [v, 'Requests']}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </MountGuard>
    </div>
  )
}

/* ── Approval Rate by Stage — radial ── */
export function ApprovalRateChart({ data }: { data: { stage: string; rate: number; fill: string }[] }) {
  return (
    <div className="card p-4">
      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Approval Rate / Stage</h3>
      <MountGuard height={140}>
        <ResponsiveContainer width="100%" height={140}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius={18}
            outerRadius={62}
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar dataKey="rate" cornerRadius={4} background={{ fill: '#f1f5f9' }} />
            <Tooltip
              formatter={(v) => [`${v}%`, 'Approval Rate']}
              contentStyle={{ fontSize: '11px', borderRadius: '4px', border: '1px solid #e2e8f0', padding: '6px 10px' }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </MountGuard>
      <div className="space-y-1.5 mt-1">
        {data.map(d => (
          <div key={d.stage} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ background: d.fill }} />
              <span className="text-[11px] text-slate-600">{d.stage}</span>
            </div>
            <span className="text-[11px] font-bold text-slate-800 tabular-nums">{d.rate}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
