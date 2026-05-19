import { UsersView } from '@/components/users/users-view'
import { getServerAuthData } from '@/lib/supabase/session'
import { redirect } from 'next/navigation'

/**
 * Users Page — Server Component.
 * PROFESSIONALLY handle the auth handshake on the server to eliminate 
 * client-side loading spinners and "sequential waterfalls".
 */
export default async function UsersPage() {
  const { user, profile } = await getServerAuthData()

  if (!user || !profile) {
    redirect('/login')
  }

  // Only Admin and above should access the full user management module
  if (!['admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <UsersView 
        currentUserId={user.id} 
        currentUserRole={profile.role} 
      />
    </div>
  )
}
