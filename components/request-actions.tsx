'use client'

import { 
  MoreHorizontal, ExternalLink, Copy, Trash2, Edit 
} from 'lucide-react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import type { RequestWithProfile } from '@/lib/types'

interface RequestActionsProps {
  request: RequestWithProfile
}

export function RequestActions({ request }: RequestActionsProps) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(request.id)
    // You could add a toast here later
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-8 w-8 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors outline-none">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Request Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/requests/${request.id}`} className="flex items-center gap-2 cursor-pointer w-full">
            <ExternalLink className="h-3.5 w-3.5" />
            View Full Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="flex items-center gap-2 cursor-pointer"
          onClick={copyToClipboard}
        >
          <Copy className="h-3.5 w-3.5" />
          Copy Request ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
          <Trash2 className="h-3.5 w-3.5" />
          Archive Request
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
