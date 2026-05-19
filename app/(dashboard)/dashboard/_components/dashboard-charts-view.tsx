'use client'

import dynamic from 'next/dynamic'

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

interface Props {
  realisedData: any[]
  stageData: any[]
  projectsPerMonthData: any[]
  total: number
  revenueProjects: number
  costProjects: number
  timeHours: number
}

export function DashboardChartsView({
  realisedData,
  stageData,
  projectsPerMonthData,
  total,
  revenueProjects,
  costProjects,
  timeHours
}: Props) {
  return (
    <div className="space-y-6">
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
              <div className="text-xl font-black text-slate-900 tabular-nums">{total}</div>
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
                {Math.round((total || 1) / 6)}
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
          <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-widest">HRS SAVED</p>
          <DonutChart label="HRS" value={timeHours} unit="" />
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                <span className="text-[11px] text-slate-500">Total Hours Saved</span>
              </div>
              <span className="text-[11px] font-bold text-slate-700 tabular-nums">{timeHours}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

