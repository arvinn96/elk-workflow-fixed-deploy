'use client'

import dynamic from 'next/dynamic'
import {
  Mail, Search, ClipboardList, CheckCircle2,
  Zap, Clock, CircleCheck,
} from 'lucide-react'

const RealisedChart = dynamic(
  () => import('./dt-overview-charts').then(mod => mod.RealisedChart),
  { ssr: false, loading: () => <div className="h-[250px] w-full animate-pulse bg-slate-50 rounded-xl" /> },
)
const StageDistributionChart = dynamic(
  () => import('./dt-overview-charts').then(mod => mod.StageDistributionChart),
  { ssr: false, loading: () => <div className="h-[250px] w-full animate-pulse bg-slate-50 rounded-xl" /> },
)
const ProjectsPerMonthChart = dynamic(
  () => import('./dt-overview-charts').then(mod => mod.ProjectsPerMonthChart),
  { ssr: false, loading: () => <div className="h-[250px] w-full animate-pulse bg-slate-50 rounded-xl" /> },
)
const DonutChart = dynamic(
  () => import('./dt-overview-charts').then(mod => mod.DonutChart),
  { ssr: false, loading: () => <div className="h-[250px] w-full animate-pulse bg-slate-50 rounded-full" /> },
)

interface StatCard {
  label: string
  value: number
  color: string
  iconKey: 'mail' | 'search' | 'clipboard' | 'check' | 'zap' | 'clock' | 'circle'
}

export interface DtOverviewData {
  todayStr: string
  statCards: StatCard[]
  realisedData: { month: string; realised: number; unrealised: number }[]
  stageData: { stage: string; value: number; fill: string }[]
  projectsPerMonthData: { month: string; projects: number }[]
  elkTotal: number
  revenueProjects: number
  costProjects: number
  timeProjects: number
}

const ICON_MAP: Record<StatCard['iconKey'], React.ElementType> = {
  mail: Mail, search: Search, clipboard: ClipboardList,
  check: CheckCircle2, zap: Zap, clock: Clock, circle: CircleCheck,
}

export function DtOverviewClient({
  todayStr, statCards, realisedData, stageData,
  projectsPerMonthData, elkTotal, revenueProjects, costProjects, timeProjects,
}: DtOverviewData) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-heading">
            Digital Transformation Projects Overview
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Summary — Project Benefits Dashboard</p>
        </div>
        <span className="text-xs text-slate-400 font-medium tabular-nums">{todayStr}</span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        {statCards.map(({ label, value, color, iconKey }) => {
          const Icon = ICON_MAP[iconKey]
          return (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-tight">{label}</span>
                <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                  <Icon className="h-3.5 w-3.5" style={{ color }} strokeWidth={2.5} />
                </div>
              </div>
              <span className="text-3xl font-black text-slate-900 tabular-nums leading-none">{value}</span>
            </div>
          )
        })}
      </div>

      {/* Row 1: Area Chart + Stage Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-xs font-bold text-slate-700 mb-1">Realised vs Unrealised Value</h2>
          <RealisedChart data={realisedData} />
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-xs font-bold text-slate-700 mb-4">Stage Distribution</h2>
          <StageDistributionChart data={stageData} />
        </div>
      </div>

      {/* Row 2: Projects per Month + Revenue + Time */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-xs font-bold text-slate-700 mb-1">Projects per Month</h2>
          <ProjectsPerMonthChart data={projectsPerMonthData} />
          <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 pt-4">
            <div className="text-center pr-3">
              <div className="text-xl font-black text-slate-900 tabular-nums">{elkTotal}</div>
              <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-0.5">TOTAL</div>
            </div>
            <div className="text-center px-3">
              <div className="text-xl font-black text-[#8b5cf6] tabular-nums">
                {Math.max(...projectsPerMonthData.map(d => d.projects), 0)}
              </div>
              <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-0.5">PEAK</div>
            </div>
            <div className="text-center pl-3">
              <div className="text-xl font-black text-slate-900 tabular-nums">
                {Math.round((elkTotal || 1) / 6)}
              </div>
              <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-0.5">AVG / MONTH</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-xs font-bold text-slate-700 mb-1">Revenue / Cost Impact</h2>
          <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-widest">PROJECTS</p>
          <DonutChart label="Revenue" value={revenueProjects} unit="" />
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#3b82f6]" />
                <span className="text-[11px] text-slate-500">Revenue Improvement</span>
              </div>
              <span className="text-[11px] font-bold text-slate-700 tabular-nums">{revenueProjects}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#10b981]" />
                <span className="text-[11px] text-slate-500">Cost Saving</span>
              </div>
              <span className="text-[11px] font-bold text-slate-700 tabular-nums">{costProjects}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-xs font-bold text-slate-700 mb-1">Time Saving</h2>
          <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-widest">PROJECTS</p>
          <DonutChart label="Time" value={timeProjects} unit="" />
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                <span className="text-[11px] text-slate-500">Time Saving</span>
              </div>
              <span className="text-[11px] font-bold text-slate-700 tabular-nums">{timeProjects}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
