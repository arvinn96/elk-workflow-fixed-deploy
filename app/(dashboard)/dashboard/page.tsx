import { redirect } from 'next/navigation'
import { getServerAuthData } from '@/lib/supabase/session'
import { UserDashboard } from './_components/user-dashboard'
import { HodDashboard } from './_components/hod-dashboard'
import { ApprovalDashboard } from './_components/approval-dashboard'
import { AdminDashboard } from './_components/admin-dashboard'
import { SuperAdminDashboard } from './_components/super-admin-dashboard'
import { UcdDashboard } from './_components/ucd-dashboard'
import type { Profile } from '@/lib/types'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { user, profile } = await getServerAuthData()
  if (!user || !profile) redirect('/login')

  if (profile.role === 'user')
    return <UserDashboard userId={user.id} profile={profile} />

  if (profile.role === 'hod')
    return <HodDashboard userId={user.id} profile={profile} />

  if (profile.role === 'approval')
    return <ApprovalDashboard userId={user.id} profile={profile} />

  if (profile.role === 'admin')
    return <AdminDashboard userId={user.id} profile={profile} />

  if (profile.role === 'ucd')
    return <UcdDashboard profile={profile} />

  // We no longer pass sort/order as props; SuperAdminDashboard and its child RecentRequestsTable handle sorting client-side
  return (
    <SuperAdminDashboard
      userId={user.id}
      profile={profile}
    />
  )
}
