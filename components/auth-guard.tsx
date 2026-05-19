import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Role } from '@/lib/types'

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles: Role[]
}

export async function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !allowedRoles.includes(profile.role as Role)) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
