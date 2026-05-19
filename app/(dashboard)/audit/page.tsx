import { AuditLogsView } from '@/components/audit/audit-logs-view'
import { getServerAuthData } from '@/lib/supabase/session'
import { redirect } from 'next/navigation'

/**
 * Audit Log Page — Server Component.
 * PROFESSIONALLY handles the auth handshake on the server to prevent 
 * client-side loading waterfalls.
 */
export default async function AuditPage() {
  const { user, profile } = await getServerAuthData()

  if (!user || !profile) {
    redirect('/login')
  }

  // Only Admin and above should access the Audit Log
  if (!['admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AuditLogsView userRole={profile.role} />
    </div>
  )
}
