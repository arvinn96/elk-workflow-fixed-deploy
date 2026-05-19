import { AuthGuard } from '@/components/auth-guard'

export default function QueueLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['hod', 'approval', 'admin', 'super_admin']}>
      {children}
    </AuthGuard>
  )
}
