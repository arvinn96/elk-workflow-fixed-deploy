import { QueueView } from '@/components/queue/queue-view'
import { getServerAuthData } from '@/lib/supabase/session'
import { createClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'
import { REQUEST_LIST_SELECT } from '@/lib/supabase/selects'
import { redirect } from 'next/navigation'
import type { RequestWithProfile, Role } from '@/lib/types'

const STAGE_FOR_ROLE: Record<string, string> = {
  hod: 'hod', approval: 'approval', admin: 'admin', super_admin: 'super_admin',
}

export default async function QueuePage() {
  const { user, profile } = await getServerAuthData()
  if (!user || !profile) redirect('/login')

  const stage = STAGE_FOR_ROLE[profile.role]

  // Cache per user+stage for 15 seconds — queue changes fast so keep TTL short
  const getQueue = unstable_cache(
    async () => {
      const supabase = await createClient()
      let query = supabase
        .from('requests')
        .select(REQUEST_LIST_SELECT)
        .eq('status', 'pending')

      if (stage) {
        query = query.eq('current_stage', stage)
        if (profile.role === 'hod') {
          query = query.eq('department', profile.department ?? '')
        }
      } else {
        // Regular users have no queue
        query = query.eq('current_stage', 'none')
      }

      const { data } = await query.order('created_at', { ascending: true })
      return (data as unknown as RequestWithProfile[]) ?? []
    },
    [`queue-${user.id}-${profile.role}`],
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
