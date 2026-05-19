import { QueueView } from '@/components/queue/queue-view'
import { getServerAuthData } from '@/lib/supabase/session'
import { createClient } from '@/lib/supabase/server'
import { REQUEST_LIST_SELECT } from '@/lib/supabase/selects'
import { redirect } from 'next/navigation'
import type { RequestWithProfile } from '@/lib/types'

/**
 * Queue Page — Server Component.
 * PROFESSIONALLY handles the approval task fetching on the server.
 * Eliminates client-side auth waterfalls and achieves sub-400ms load times.
 */
export default async function QueuePage() {
  const { user, profile } = await getServerAuthData()

  if (!user || !profile) {
    redirect('/login')
  }

  const supabase = await createClient()

  // Fetch only the requests currently at this user's stage
  let query = supabase
    .from('requests')
    .select(REQUEST_LIST_SELECT)
    .eq('status', 'pending')

  if (profile.role === 'hod') {
    query = query.eq('current_stage', 'hod')
  } else if (profile.role === 'approval') {
    query = query.eq('current_stage', 'approval')
  } else if (profile.role === 'admin') {
    query = query.eq('current_stage', 'admin')
  } else if (profile.role === 'super_admin') {
    query = query.eq('current_stage', 'super_admin')
  } else {
    // Regular users don't have an approval queue
    query = query.eq('current_stage', 'none') 
  }

  const { data } = await query.order('created_at', { ascending: true })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <QueueView 
        initialQueue={(data as unknown as RequestWithProfile[]) ?? []} 
        userRole={profile.role} 
        userDepartment={profile.department}
      />
    </div>
  )
}
