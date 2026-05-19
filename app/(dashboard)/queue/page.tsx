import { QueueView } from '@/components/queue/queue-view'
import { getServerAuthData } from '@/lib/supabase/session'
import { createServiceClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'
import { REQUEST_LIST_SELECT } from '@/lib/supabase/selects'
import { redirect } from 'next/navigation'
import type { RequestWithProfile, Role } from '@/lib/types'

const STAGE_FOR_ROLE: Record<string, string> = {
  hod: 'hod', approval: 'approval', admin: 'admin', super_admin: 'super_admin',
}

// Uses service client (no cookies) so it's safe inside unstable_cache
async function fetchQueueForStage(stage: string, department: string | null) {
  const supabase = await createServiceClient()
  let query = supabase
    .from('requests')
    .select(REQUEST_LIST_SELECT)
    .eq('status', 'pending')

  if (stage && stage !== 'none') {
    query = query.eq('current_stage', stage)
    if (department) {
      query = query.eq('department', department)
    }
  } else {
    query = query.eq('current_stage', 'none')
  }

  const { data } = await query.order('created_at', { ascending: true })
  return (data as unknown as RequestWithProfile[]) ?? []
}

export default async function QueuePage() {
  const { user, profile } = await getServerAuthData()
  if (!user || !profile) redirect('/login')

  const stage = STAGE_FOR_ROLE[profile.role] ?? 'none'
  const dept = profile.role === 'hod' ? (profile.department ?? null) : null

  // Safe: service client has no cookies(), can run inside unstable_cache
  const getQueue = unstable_cache(
    () => fetchQueueForStage(stage, dept),
    [`queue-${profile.role}-${dept ?? 'all'}`],
    { revalidate: 15 }
  )

  const initialQueue = await getQueue()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <QueueView
        initialQueue={initialQueue}
        userRole={profile.role as Role}
        userDepartment={profile.department}
      />
    </div>
  )
}
