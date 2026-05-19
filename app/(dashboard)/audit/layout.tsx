import { AuthGuard } from '@/components/auth-guard'

export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['admin', 'super_admin']}>
      {children}
    </AuthGuard>
  )
}
