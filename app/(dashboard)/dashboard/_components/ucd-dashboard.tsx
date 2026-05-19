import { Layers2 } from 'lucide-react'
import { PipelineView } from '@/components/pipeline-view'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import type { Profile } from '@/lib/types'

interface Props {
  profile: Profile
}

export function UcdDashboard({ profile }: Props) {
  return (
    <div className="space-y-6 max-w-6xl mx-auto px-6">
      <RealtimeRefresh />
      {/* Page header (Renders instantly) */}
      <div className="flex items-center justify-between py-4 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center">
            <Layers2 className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-black text-slate-900 uppercase tracking-tight">Delivery Pipeline</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Tracking approved projects through implementation stages — {profile.full_name}
            </p>
          </div>
        </div>
      </div>

      <PipelineView canChangeStatus={true} userRole={profile.role} />
    </div>
  )
}

