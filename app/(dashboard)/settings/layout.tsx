import { AuthGuard } from '@/components/auth-guard'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['super_admin']}>
      {children}
    </AuthGuard>
  )
}
