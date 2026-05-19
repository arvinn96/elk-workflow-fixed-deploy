'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts'

function MountGuard({ children, height = 200 }: { children: React.ReactNode; height?: number }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return <div className="animate-pulse bg-slate-100 rounded" style={{ height }} />
  return <>{children}</>
}

/* ── Realised vs Unrealised Value ── */
export function RealisedChart({ data }: { data: any[] }) {
  const defaultData = [
    { month: 'Oct 25', realised: 0, unrealised: 0 },
    { month: 'Nov 25', realised: 0, unrealised: 0 },
    { month: 'Dec 25', realised: 0, unrealised: 1 },
    { month: 'Jan 26', realised: 0, unrealised: 4 },
    { month: 'Feb 26', realised: 0, unrealised: 9 },
    { month: 'Mar 26', realised: 0, unrealised: 10 },
    { month: 'Apr 26', realised: 0, unrealised: 3 },
  ]
  const chartData = data && data.length ? data : defaultData

  return (
    <MountGuard height={220}>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colRealised" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colUnrealised" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={8} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 'auto']} label={{ value: 'Projects', angle: -90, position: 'insideLeft', offset: 16, style: { fontSize: 10, fill: '#94a3b8' } }} />
          <Tooltip contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '11px', padding: '8px 12px' }} />
          <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
          <Area type="monotone" dataKey="realised" name="Realised" stroke="#10b981" strokeWidth={2} fill="url(#colRealised)" dot={false} />
          <Area type="monotone" dataKey="unrealised" name="Unrealised" stroke="#f59e0b" strokeWidth={2} fill="url(#colUnrealised)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </MountGuard>
  )
}

/* ── Custom Y-Axis Tick for precise centering & left alignment ── */
function CustomYAxisTick({ x, y, payload }: any) {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-102}
        y={0}
        textAnchor="start"
        dominantBaseline="central"
        className="text-[11px] font-semibold fill-slate-500"
      >
        {payload.value}
      </text>
    </g>
  )
}

/* ── Stage Distribution ── */
export function StageDistributionChart({ data }: { data: any[] }) {
  return (
    <MountGuard height={240}>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart 
          data={data} 
          layout="vertical" 
          margin={{ top: 10, right: 10, left: 16, bottom: 10 }}
          barGap={0}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 2" horizontal={false} stroke="#f1f5f9" />
          <XAxis 
            type="number" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#cbd5e1' }} 
            allowDecimals={false} 
          />
          <YAxis 
            type="category" 
            dataKey="stage" 
            axisLine={false} 
            tickLine={false} 
            tick={<CustomYAxisTick />}
            width={105}
          />
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px', padding: '8px 12px' }} 
            formatter={(v: any) => [v, 'Projects']} 
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
            {data?.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </MountGuard>
  )
}





/* ── Projects per Month ── */
export function ProjectsPerMonthChart({ data }: { data: any[] }) {
  return (
    <MountGuard height={180}>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={6} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '11px', padding: '6px 10px' }} formatter={(v: any) => [v, 'Projects']} />
          <Bar dataKey="projects" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </MountGuard>
  )
}

/* ── Donut Chart (Revenue/Time) ── */
export function DonutChart({ label, value, unit = '' }: { label: string; value: number; unit?: string }) {
  const data = [
    { name: label, value: value || 1 },
  ]
  return (
    <MountGuard height={160}>
      <div className="relative flex items-center justify-center" style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={72}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill="#e2e8f0" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-black text-slate-800 tabular-nums leading-none">
            {unit}{value}
          </span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">TOTAL</span>
        </div>
      </div>
    </MountGuard>
  )
}
