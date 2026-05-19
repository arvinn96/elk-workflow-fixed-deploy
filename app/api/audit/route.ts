import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { AuditLogWithProfile } from '@/lib/types'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const offset = parseInt(searchParams.get('offset') || '0')
    const limit = parseInt(searchParams.get('limit') || '20')
    const actionFilter = searchParams.get('action') || undefined

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if actor is Admin or Super Admin for auditing access
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const role = profile?.role || ''
    
    // Only Admin and above should see full audit logs
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let query = supabase
      .from('audit_logs')
      .select('*, profiles(id, full_name, email, role, avatar_url)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (actionFilter && actionFilter !== 'all') {
      if (actionFilter === 'submitted') {
        query = query.eq('action', 'request_submitted')
      } else if (actionFilter === 'approved') {
        query = query.ilike('action', '%approved%')
      } else if (actionFilter === 'rejected') {
        query = query.ilike('action', '%rejected%')
      }
    }

    const { data: logs, error } = await query
    if (error) throw error

    // OPTIMIZATION: Resolve request titles on the server in one batch
    const requestIds = Array.from(new Set(
      (logs as unknown as AuditLogWithProfile[])
        .filter(log => log.entity_type === 'request' && log.entity_id)
        .map(log => log.entity_id!)
    ))

    let titleMap: Record<string, string> = {}
    if (requestIds.length > 0) {
      const { data: titles } = await supabase
        .from('requests')
        .select('id, title')
        .in('id', requestIds)
      
      if (titles) {
        titles.forEach(r => { titleMap[r.id] = r.title })
      }
    }

    return NextResponse.json({ logs: logs as unknown as AuditLogWithProfile[], titleMap, role })
  } catch (error: any) {
    console.error('[audit][GET] error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const supabaseUser = await createClient()
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: actor } = await supabaseUser
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!actor || actor.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden. Super Admin access required.' }, { status: 403 })
    }

    const supabaseAdmin = await createServiceClient()

    // Delete all logs except a dummy one (or just all if no FKs block)
    const { error: deleteError } = await supabaseAdmin
      .from('audit_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[audit][DELETE ALL] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
