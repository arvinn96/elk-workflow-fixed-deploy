import { LoginView } from '@/components/auth/login-view'
import { getServerAuthData } from '@/lib/supabase/session'
import { redirect } from 'next/navigation'

/**
 * Login Page — Secondary entry point.
 * Parallel to the root page, this ensures /login also performs a fast 
 * server-side handshake instead of relying on client-side verification.
 */
export default async function LoginPage() {
  const { user } = await getServerAuthData()

  if (user) {
    redirect('/dashboard')
  }

  return <LoginView initialUser={null} />
}
