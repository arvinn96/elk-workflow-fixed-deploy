import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { canManageUser, isDepartment, type Role } from '@/lib/types'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const { role, department, password } = await req.json() as {
      role?: Role
      department?: string
      password?: string
    }

    if (!role && !department && !password) {
      return NextResponse.json({ error: 'No changes were provided.' }, { status: 400 })
    }

    if (department && !isDepartment(department)) {
      return NextResponse.json({ error: 'Invalid department selected.' }, { status: 400 })
    }

    const supabaseUser = await createClient()
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: actor } = await supabaseUser
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (!actor || !['super_admin', 'admin'].includes(actor.role)) {
      return NextResponse.json({ error: 'Forbidden. Admin or Super Admin access required.' }, { status: 403 })
    }

    const supabaseAdmin = await createServiceClient()
    const { data: target } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name')
      .eq('id', userId)
      .single()

    if (!target) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    if (!canManageUser(actor.role as Role, target.role as Role) && user.id !== userId) {
      return NextResponse.json({ error: 'You cannot edit that user.' }, { status: 403 })
    }

    if (role && !canManageUser(actor.role as Role, role)) {
      return NextResponse.json({ error: 'You cannot assign that role.' }, { status: 403 })
    }

    if (user.id === userId && role && role !== target.role) {
      return NextResponse.json({ error: 'You cannot change your own role.' }, { status: 403 })
    }

    // 1. Handle Password Update (Auth Level) - NOT AUDITED per user request
    if (password) {
      const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: password
      })
      if (resetError) return NextResponse.json({ error: 'Failed to reset password: ' + resetError.message }, { status: 500 })
    }

    // 2. Handle Profile Updates (Database Level)
    const updates: { role?: Role; department?: string } = {}
    if (role) updates.role = role
    if (department) updates.department = department

    let updatedUser = null
    if (Object.keys(updates).length > 0) {
      const { data, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select('id, full_name, email, role, department, avatar_url')
        .single()
      
      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
      updatedUser = data
    }

    // 3. Log Audit (Only for role/dept changes)
    if (role || department) {
      await supabaseAdmin.from('audit_logs').insert({
        actor_id: user.id,
        action: role ? 'user_role_updated' : 'user_department_updated',
        entity_type: 'profile',
        entity_id: userId,
        metadata: {
          target_name: target.full_name,
          previous_role: target.role,
          next_role: role ?? target.role,
          department: department ?? null,
        },
      })
    }

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error('[users][PATCH] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const supabaseUser = await createClient()
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if actor is Admin/Super Admin
    const { data: actor } = await supabaseUser
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!actor || !['super_admin', 'admin'].includes(actor.role)) {
      return NextResponse.json({ error: 'Forbidden. Admin or Super Admin access required.' }, { status: 403 })
    }

    const supabaseAdmin = await createServiceClient()

    // Get target info for audit logging and permission checking
    const { data: target } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name')
      .eq('id', userId)
      .single()

    if (!target) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    // Can actor manage this user?
    if (!canManageUser(actor.role as Role, target.role as Role) || user.id === userId) {
      return NextResponse.json({ error: 'You cannot remove this user.' }, { status: 403 })
    }

    // Delete from auth.users (cascades to profiles if FK is set, but we handle profiles too)
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteAuthError) {
      return NextResponse.json({ error: deleteAuthError.message }, { status: 500 })
    }

    // Explicitly delete profile for cleanup and audit logging consistency
    await supabaseAdmin.from('profiles').delete().eq('id', userId)

    // Log the removal
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: user.id,
      action: 'user_removed',
      entity_type: 'profile',
      entity_id: userId,
      metadata: {
        target_name: target.full_name,
        target_role: target.role,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[users][DELETE] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
