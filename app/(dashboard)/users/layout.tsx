import { AuthGuard } from '@/components/auth-guard'

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']}>
      {children}
    </AuthGuard>
  )
}
