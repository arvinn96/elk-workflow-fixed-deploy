import { LoginView } from '@/components/auth/login-view'
import { getServerAuthData } from '@/lib/supabase/session'
import { redirect } from 'next/navigation'

/**
 * Root Page — The fast entry point.
 * PROFESSIONALLY performs a server-side auth handshake to eliminate 
 * client-side "spinner time" for authenticated users.
 */
export default async function RootPage() {
  const { user } = await getServerAuthData()

  // If already logged in, skip the login view entirely for a 10/10 "snap" feel.
  if (user) {
    redirect('/dashboard')
  }

  return <LoginView initialUser={null} />
}
