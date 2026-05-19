'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, FileText, CheckSquare, Users, ScrollText,
  Settings, LogOut, ChevronLeft, ChevronRight, Layers2, History,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RoleBadge } from '@/components/role-badge'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Role } from '@/lib/types'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles: Role[]
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Requests Overview', icon: LayoutDashboard, roles: ['user', 'hod', 'approval', 'admin', 'super_admin'] },
  { href: '/dashboard', label: 'UCD Pipeline',      icon: Layers2,         roles: ['ucd'] },
  { href: '/queue',     label: 'Approval Queue',    icon: CheckSquare,     roles: ['hod', 'approval', 'admin', 'super_admin'] },
  { href: '/history',   label: 'History',           icon: History,         roles: ['user', 'hod', 'approval', 'admin', 'super_admin', 'ucd'] },
  { href: '/users',     label: 'Users',             icon: Users,           roles: ['admin', 'super_admin'] },
  { href: '/audit',     label: 'Audit Log',         icon: ScrollText,      roles: ['admin', 'super_admin'] },
  { href: '/settings',  label: 'System Settings',   icon: Settings,        roles: ['super_admin'] },
]

interface SidebarProps {
  profile: Profile
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [queueCount, setQueueCount] = useState(0)

  useEffect(() => {
    const stageMap: Record<string, string> = {
      hod: 'hod', approval: 'approval', admin: 'admin', super_admin: 'super_admin',
    }
    const stage = stageMap[profile.role]
    if (!stage) return

    const supabase = createClient()

    async function fetchCount() {
      const { count } = await supabase
        .from('requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .eq('current_stage', stage)
      setQueueCount(count ?? 0)
    }

    void fetchCount()

    const channel = supabase
      .channel('sidebar-queue-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => {
        void fetchCount()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile.role])

  const visibleItems = NAV_ITEMS.filter((item) => {
    return item.roles.includes(profile.role)
  })

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/login')
    router.refresh()
  }

  return (
    <motion.aside
      className="h-full flex flex-col bg-white/80 backdrop-blur-md border-r border-slate-200/80 transition-all duration-300 relative shrink-0 z-20"
      animate={{ width: collapsed ? 68 : 260 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          {collapsed ? (
            <div className="h-7 w-7 rounded-md bg-brand-600 flex items-center justify-center shrink-0">
              <span className="text-white text-[9px] font-black">ELK</span>
            </div>
          ) : (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xl text-brand-600 tracking-tight whitespace-nowrap"
              style={{ fontFamily: "Arial, sans-serif", fontWeight: 700 }}
            >
              ELK-DESA
            </motion.span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const displayLabel = item.label
          
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={displayLabel}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold tracking-tight transition-all duration-200 group relative',
                isActive
                  ? 'bg-brand-50/50 text-brand-700 shadow-sm shadow-brand-100/20'
                  : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900',
              )}
            >
              <Icon className={cn(
                'h-[18px] w-[18px] shrink-0 transition-all duration-200',
                isActive ? 'text-brand-600 scale-110' : 'text-slate-400 group-hover:text-slate-700'
              )} />
              {!collapsed && (
                <span className="whitespace-nowrap overflow-hidden">{displayLabel}</span>
              )}
              {!collapsed && item.href === '/queue' && queueCount > 0 && (
                <span className="ml-auto min-w-[20px] h-[20px] px-1.5 rounded-lg bg-brand-600 text-white text-[10px] font-black flex items-center justify-center tabular-nums shadow-sm shadow-brand-500/20">
                  {queueCount > 99 ? '99+' : queueCount}
                </span>
              )}
              {!collapsed && isActive && (
                <motion.div 
                  layoutId="active-indicator"
                  className="absolute left-0 w-1 h-5 bg-brand-600 rounded-r-full"
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User profile section - Premium Refined */}
      <div className="border-t border-slate-100 p-4 bg-slate-50/40 backdrop-blur-sm mt-auto">
        <div className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.full_name ?? ''} />
            <AvatarFallback className="text-xs">{getInitials(profile.full_name)}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">{profile.full_name ?? 'Unknown'}</p>
              <RoleBadge role={profile.role} className="mt-0.5 scale-90 origin-left" />
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleSignOut}
              className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50/50 hover:shadow-sm transition-all duration-200 shrink-0"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 h-6 w-6 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-400 transition-all shadow-sm z-10"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </motion.aside>
  )
}
