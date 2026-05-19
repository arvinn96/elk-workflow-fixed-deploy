import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="flex-1 overflow-y-auto w-full max-w-[1440px] mx-auto animate-pulse">
      <div className="space-y-10">
        {/* Header section */}
        <div className="flex items-center justify-between pb-2">
          <div className="space-y-3">
            <Skeleton className="h-5 w-32 rounded bg-slate-100" />
            <Skeleton className="h-10 w-80 rounded bg-slate-200/50" />
          </div>
          <Skeleton className="h-12 w-44 rounded-xl bg-slate-200" />
        </div>

        {/* Stats row - Matches High Density 7-column grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <Skeleton className="h-2 w-16 rounded bg-slate-50" />
                <Skeleton className="h-7 w-7 rounded-lg bg-slate-50" />
              </div>
              <Skeleton className="h-8 w-10 rounded bg-slate-100" />
            </div>
          ))}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-8">
            <div className="flex justify-between items-start">
              <div className="space-y-3">
                <Skeleton className="h-7 w-56 rounded bg-slate-200" />
                <Skeleton className="h-4 w-80 rounded bg-slate-100" />
              </div>
              <Skeleton className="h-8 w-32 rounded bg-slate-100" />
            </div>
            <Skeleton className="h-[280px] w-full rounded-2xl bg-slate-50 border border-slate-100" />
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-8">
            <div className="space-y-3">
              <Skeleton className="h-7 w-40 rounded bg-slate-200" />
              <Skeleton className="h-4 w-full rounded bg-slate-100" />
            </div>
            <div className="space-y-6 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-5">
                  <Skeleton className="h-11 w-11 rounded-full bg-slate-100 shrink-0" />
                  <div className="space-y-2.5 flex-1">
                    <Skeleton className="h-4 w-full rounded bg-slate-100" />
                    <Skeleton className="h-3 w-2/3 rounded bg-slate-50" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Large Table section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-12">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
            <Skeleton className="h-7 w-64 rounded bg-slate-200" />
            <Skeleton className="h-9 w-32 rounded bg-slate-100" />
          </div>
          <div className="p-8 space-y-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between gap-12 pt-6 first:pt-0 border-t border-slate-50 first:border-0">
                <div className="flex items-center gap-5 flex-1">
                  <Skeleton className="h-12 w-12 rounded-xl bg-slate-100 shrink-0" />
                  <div className="space-y-2.5 flex-1">
                    <Skeleton className="h-4 w-3/4 rounded bg-slate-100" />
                    <Skeleton className="h-3 w-1/3 rounded bg-slate-50" />
                  </div>
                </div>
                <div className="hidden md:block">
                  <Skeleton className="h-5 w-32 rounded bg-slate-50" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full bg-slate-100/50" />
                <Skeleton className="h-10 w-28 rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

