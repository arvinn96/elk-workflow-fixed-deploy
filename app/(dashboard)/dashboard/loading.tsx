import { Loader2 } from "lucide-react"

export default function DashboardLoading() {
  return (
    <div className="flex h-[80vh] w-full items-center justify-center flex-col gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      <p className="text-sm font-medium text-slate-500 animate-pulse">Aggregating enterprise metrics...</p>
    </div>
  )
}
