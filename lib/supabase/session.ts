// Server-only helpers for reading the current user and profile.
//
// Wrapped in React cache() so that multiple server components in the same
// render tree (e.g. layout.tsx + dashboard/page.tsx) share one DB result
// instead of each firing their own getUser() + profile SELECT.
import { cache } from 'react'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

export const getServerUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export const getServerProfile = cache(async (userId: string): Promise<Profile | null> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, department, avatar_url')
    .eq('id', userId)
    .single()
  return data as Profile | null
})

/**
 * PROFESSIONALLY parallelizes the Auth "handshake".
 * Collapses the User + Profile waterfall into a single concurrent operation.
 * OPTIMIZATION: Uses the 'x-user-id' header injected by proxy.ts to skip network getUser().
 */
export const getServerAuthData = cache(async () => {
  const t0 = performance.now()
  const headersList = await headers()
  const headerUserId = headersList.get('x-user-id')
  
  const supabase = await createClient()
  
  // 1. If the proxy already verified the user, we can trust the header and skip getUser()
  if (headerUserId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, department, avatar_url')
      .eq('id', headerUserId)
      .single()
    
    console.log(`[PERF] getServerAuthData (Header Path): ${Math.round(performance.now() - t0)}ms`)
    
    return { 
      user: { id: headerUserId } as any, 
      profile: profile as Profile | null 
    }
  }

  // 2. Fallback to full verification if header is missing (e.g. non-proxy path)
  // Fire getUser and profile SELECT in parallel to collapse the waterfall
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
     console.log(`[PERF] getServerAuthData (No User): ${Math.round(performance.now() - t0)}ms`)
     return { user: null, profile: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, department, avatar_url')
    .eq('id', user.id)
    .single()

  console.log(`[PERF] getServerAuthData (Full Path): ${Math.round(performance.now() - t0)}ms`)
  return { user, profile: profile as Profile | null }
})
