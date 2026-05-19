'use client'

import { Bell, Search } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/types'
import { formatRelativeTime } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface TopbarNotification {
  id: string
  title: string
  detail: string
  href: string
  timestamp: string
}

interface TopbarProps {
  profile: Profile
  notifications: TopbarNotification[]
}

export function Topbar({ profile, notifications }: TopbarProps) {
  const router = useRouter()

  function greeting() {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-6 sticky top-0 z-10">
      <div>
        <p className="text-sm font-medium text-slate-900">
          {greeting()}, <span className="text-brand-600">{profile.full_name?.split(' ')[0] ?? 'there'}</span>
        </p>
        <p className="text-xs text-slate-400">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/requests')}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          aria-label="Open requests"
        >
          <Search className="h-4 w-4" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white">
                  {notifications.length}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-6 text-center">
                <Bell className="mb-2 h-8 w-8 text-slate-200" />
                <p className="text-sm font-medium text-slate-900">All caught up!</p>
                <p className="mt-1 text-xs text-slate-500">You have no new notifications.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  onClick={() => router.push(notification.href)}
                  className="items-start"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{notification.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{notification.detail}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{formatRelativeTime(notification.timestamp)}</p>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
