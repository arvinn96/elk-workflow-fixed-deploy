import { Skeleton } from '@/components/ui/skeleton'

export default function AuthLoading() {
  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Branding Section Skeleton */}
      <div 
        className="relative hidden lg:flex lg:w-[48%] flex-col justify-between p-12"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #c8102e 100%)' }}
      >
        {/* Branding headers removed for skeleton consistency */}

        <div className="relative z-10 space-y-6 flex-1 flex flex-col justify-center max-w-sm">
          <Skeleton className="h-10 w-full rounded bg-white/20" />
          <Skeleton className="h-10 w-2/3 rounded bg-white/10" />
          <div className="space-y-4 pt-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-7 w-7 rounded-full bg-white/10 shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full rounded bg-white/10" />
                  <Skeleton className="h-3 w-2/3 rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <Skeleton className="h-4 w-32 rounded bg-white/10" />
        </div>
      </div>

      {/* Form Section Skeleton */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-[420px] space-y-8 animate-pulse">
          <div className="lg:hidden flex items-center gap-2 mb-8">
             <Skeleton className="h-8 w-8 rounded-lg" />
             <Skeleton className="h-6 w-24 rounded" />
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-8">
            <div className="space-y-3">
              <Skeleton className="h-8 w-48 rounded" />
              <Skeleton className="h-4 w-64 rounded" />
            </div>

            <div className="space-y-6">
               {[1, 2, 3].map((i) => (
                 <div key={i} className="space-y-2">
                   <Skeleton className="h-3 w-20 rounded" />
                   <Skeleton className="h-11 w-full rounded-md" />
                 </div>
               ))}
            </div>

            <Skeleton className="h-11 w-full rounded-md mt-4" />
            
            <div className="relative py-4 flex justify-center">
               <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100" />
               </div>
               <Skeleton className="h-4 w-24 rounded bg-white relative z-10 mx-auto" />
            </div>

            <Skeleton className="h-11 w-full rounded-md border border-slate-200" />

            <div className="pt-4 flex justify-center">
               <Skeleton className="h-4 w-48 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
