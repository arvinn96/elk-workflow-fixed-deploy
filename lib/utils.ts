import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

const TZ = 'Asia/Kuala_Lumpur'

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-MY', {
    timeZone: TZ, month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function formatDateTime(date: string) {
  const d = new Date(date)
  const datePart = d.toLocaleDateString('en-MY', { timeZone: TZ, month: 'short', day: 'numeric', year: 'numeric' })
  const timePart = d.toLocaleTimeString('en-MY', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true })
  return `${datePart} - ${timePart}`
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
