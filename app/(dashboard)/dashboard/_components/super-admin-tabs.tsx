'use client'

import { useState } from 'react'
import { RequestsTable } from '@/components/requests-table'
import type { RequestWithProfile } from '@/lib/types'

interface Props {
  dtOverview?: React.ReactNode
  systemRequests?: RequestWithProfile[]
  userRole: string
  projectsNode?: React.ReactNode
}

type Tab = 'overview' | 'projects'

export function SuperAdminTabs({ dtOverview, systemRequests, userRole, projectsNode }: Props) {
  const [tab, setTab] = useState<Tab>('overview')

  return (
    <div className="space-y-4">
      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-slate-200">
        {(['overview', 'projects'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {t === 'overview' ? 'DT Overview' : 'Project Overview'}
          </button>
        ))}
      </div>

      {tab === 'overview' && dtOverview}

      {tab === 'projects' && (
        <div className="space-y-8">
          {projectsNode ? projectsNode : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-lg font-bold text-slate-900">System Approval Requests</h2>
                <p className="text-xs text-slate-500 mt-0.5">Recent requests processed through the main internal workflow</p>
              </div>
              <RequestsTable requests={systemRequests || []} userRole={userRole} allowDeletion />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
