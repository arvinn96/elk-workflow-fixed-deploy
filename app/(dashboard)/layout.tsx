import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerAuthData } from '@/lib/supabase/session'
import { getLayoutNotifications } from '@/lib/supabase/dashboard-data'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/sidebar'
import { Topbar, type TopbarNotification } from '@/components/topbar'
import { stageForRole, type Profile, type Role } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { AIChatbot } from '@/components/ai-chatbot'
import { GlobalDrawerManager } from '@/components/global-drawer-manager'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t0 = performance.now()
  // PROFESSIONALLY collapsed the sequential auth waterfall into a parallel handshake.
  const { user, profile } = await getServerAuthData()
  console.log(`[PERF] Layout getServerAuthData: ${Math.round(performance.now() - t0)}ms`)
  
  if (!user || !profile) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar profile={profile} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Suspense fallback={
          <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-48 rounded" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </header>
        }>
          <TopbarWrapper profile={profile} />
        </Suspense>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
        <AIChatbot />
        <GlobalDrawerManager userRole={profile.role} />
      </div>
    </div>
  )
}

async function TopbarWrapper({ profile }: { profile: Profile }) {
  const notifications = await getLayoutNotifications(profile)
  return <Topbar profile={profile} notifications={notifications} />
}
