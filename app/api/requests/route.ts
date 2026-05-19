import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createRequestInternal, getRequestsInternal, getRequestById } from '@/lib/supabase/requests'
import { type Priority, type RequestStatus, type Role } from '@/lib/types'

export async function GET(req: Request) {
  try {
    // F-01 FIX: Auth check must come BEFORE any data access, including getRequestById
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role, department').eq('id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 403 })
    const role = profile.role as Role

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const offset = parseInt(searchParams.get('offset') || '0')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') as RequestStatus | undefined
    const q = searchParams.get('q') || undefined

    if (id) {
      const data = await getRequestById(id)
      if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      // Enforce visibility: users can only fetch their own requests
      if (role === 'user' && data.submitted_by !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (role === 'hod' && data.department !== profile.department) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.json({ request: data })
    }

    const requests = await getRequestsInternal({
      offset,
      limit,
      status,
      role,
      department: profile.department,
      userId: user.id,
      search: q
    })

    return NextResponse.json({ requests, role })
  } catch (error: any) {
    console.error('[requests][GET] error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const requestRecord = await createRequestInternal(user.id, body)
      return NextResponse.json({ success: true, request: requestRecord })
    } catch (err: any) {
      return NextResponse.json({ error: err.message || 'Failed to create request.' }, { status: 500 })
    }
  } catch (error) {
    console.error('[requests][POST] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    const body = await req.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase.from('requests').update(body).eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[requests][PATCH] error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Request ID is required.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const { data: request } = await supabase.from('requests').select('submitted_by, title').eq('id', id).single()

    if (!request) {
      return NextResponse.json({ error: 'Request not found.' }, { status: 404 })
    }

    const isOwner = request.submitted_by === user.id
    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to delete this request.' }, { status: 403 })
    }

    const supabaseAdmin = await createServiceClient()

    // 1. Explicitly clean up related data to bypass potential FK constraints
    await supabaseAdmin.from('approval_steps').delete().eq('request_id', id)

    // 2. Delete the main record
    const { error: deleteError } = await supabaseAdmin.from('requests').delete().eq('id', id)
    if (deleteError) throw deleteError

    // 3. Log deletion
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: user.id,
      action: 'request_deleted',
      entity_type: 'request',
      entity_id: id,
      metadata: { request_title: request.title }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[requests][DELETE] error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}