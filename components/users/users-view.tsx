'use client'

import { useCallback, useEffect, useState, useMemo, useTransition } from 'react'
import { motion } from 'framer-motion'
import { Users, Search, Trash2, KeyRound, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RoleBadge } from '@/components/role-badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { getInitials, formatDate } from '@/lib/utils'
import { DEPARTMENTS, ROLE_LABELS, assignableRolesFor, canManageUser } from '@/lib/types'
import type { Profile, Role } from '@/lib/types'
import { toast } from 'sonner'
import { CreateUserModal } from '@/components/create-user-modal'
import { DeleteUserDialog } from '@/components/delete-user-dialog'
import { ResetPasswordDialog } from '@/components/reset-password-dialog'
import { usePagination } from '@/hooks/use-pagination'

interface Props {
  currentUserId: string
  currentUserRole: Role
}

export function UsersView({ currentUserId, currentUserRole }: Props) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  // Deletion state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Password reset state
  const [resetUser, setResetUser] = useState<{ id: string; name: string } | null>(null)

  const fetcher = useCallback(async (offset: number, limit: number) => {
    const res = await fetch(`/api/users?offset=${offset}&limit=${limit}&q=${debouncedSearch}`)
    if (!res.ok) return []
    const data = await res.json()
    return data.users || []
  }, [debouncedSearch])

  const { items: users, loading, hasMore, loadMore, refresh, mutate } = usePagination<Profile>(fetcher, 20)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    void refresh()
  }, [debouncedSearch, refresh])

  async function patchUser(userId: string, updates: { role?: Role; department?: string }) {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    const payload = await res.json()
    if (!res.ok) throw new Error(payload.error ?? 'Failed to update user')

    mutate((current) => current.map((user) => (
      user.id === userId ? { ...user, ...updates } : user
    )))
  }

  async function updateRole(userId: string, role: Role) {
    try {
      await patchUser(userId, { role })
      toast.success('Role updated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update role')
    }
  }

  async function updateDepartment(userId: string, department: string) {
    try {
      await patchUser(userId, { department })
      toast.success('Department updated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update department')
    }
  }

  async function removeUser() {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/users/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove user')
      mutate((current) => current.filter((u) => u.id !== deleteId))
      toast.success('User removed successfully')
      setDeleteId(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove user')
    } finally {
      setDeleteLoading(false)
    }
  }

  const availableRoles = assignableRolesFor(currentUserRole)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">User Management</h1>
          <p className="mt-0.5 text-sm text-slate-500 font-medium">Provision accounts and manage administrative access levels</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white shadow-sm px-4 py-1.5">
            <Users className="h-4 w-4 text-brand-600" />
            <span className="text-sm font-semibold text-slate-700">{users.length} Records Loaded</span>
          </div>
          <CreateUserModal
            currentUserRole={currentUserRole}
            onSuccess={() => void refresh()}
          />
        </div>
      </div>

      <div className="relative max-w-sm group">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
        <Input
          placeholder="Search members by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 rounded-xl border-slate-200 focus-visible:ring-brand-500/20"
        />
        {loading && search && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-3 w-3 animate-spin text-brand-500" />
          </div>
        )}
      </div>

      <div className="card overflow-hidden shadow-sm border-slate-200/60">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-widest text-slate-400">Employee</th>
                <th className="hidden px-4 py-3.5 text-left text-xs font-bold uppercase tracking-widest text-slate-400 md:table-cell">Unit</th>
                <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-widest text-slate-400">Access Level</th>
                <th className="hidden px-4 py-3.5 text-left text-xs font-bold uppercase tracking-widest text-slate-400 lg:table-cell">Onboarding</th>
                <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-widest text-slate-400">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.length === 0 && !loading ? (
                 <tr>
                  <td colSpan={5} className="px-5 py-24 text-center bg-slate-50/30">
                    <div className="flex flex-col items-center gap-2">
                       <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-2">
                        <Users className="h-6 w-6 text-slate-300" />
                       </div>
                       <p className="font-bold text-slate-900">No members found</p>
                       <p className="text-xs text-slate-400">Refine your search parameters or invite a new user.</p>
                    </div>
                  </td>
                 </tr>
              ) : (
                users.map((user, index) => {
                  const isSelf = user.id === currentUserId
                  const canManage = canManageUser(currentUserRole, user.role)
                  const manageable = canManage || isSelf

                  return (
                    <motion.tr
                      key={user.id}
                      className="transition-colors hover:bg-slate-50/50 group"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-slate-100 shadow-sm">
                            <AvatarImage src={user.avatar_url ?? undefined} />
                            <AvatarFallback className="text-xs font-bold bg-white">{getInitials(user.full_name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{user.full_name ?? 'No name'}</p>
                            <p className="text-xs text-slate-400 truncate">{user.email}</p>
                          </div>
                          {isSelf && (
                            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600 uppercase border border-brand-100/50">
                              Self
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="hidden px-4 py-4 md:table-cell">
                        {manageable ? (
                          <Select
                            value={user.department ?? ''}
                            onValueChange={(value) => void updateDepartment(user.id, value)}
                          >
                            <SelectTrigger className="h-8 w-44 text-[11px] font-medium rounded-lg border-slate-200">
                              <SelectValue placeholder="General Operations" />
                            </SelectTrigger>
                            <SelectContent>
                              {DEPARTMENTS.map((dept) => (
                                <SelectItem key={dept} value={dept} className="text-xs font-medium">
                                  {dept}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-sm font-medium text-slate-600">{user.department ?? '-'}</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {manageable && !isSelf ? (
                          <Select
                            value={user.role}
                            onValueChange={(value) => void updateRole(user.id, value as Role)}
                          >
                            <SelectTrigger className="h-8 w-40 text-[11px] font-medium rounded-lg border-slate-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availableRoles.filter(r => r !== 'super_admin' || currentUserRole === 'super_admin').map((role) => (
                                <SelectItem key={role} value={role} className="text-xs font-medium">
                                  {ROLE_LABELS[role]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <RoleBadge role={user.role} />
                        )}
                      </td>
                      <td className="hidden px-4 py-4 lg:table-cell">
                        <span className="text-xs font-medium text-slate-400">{formatDate(user.created_at)}</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {manageable && !isSelf && (
                            <button
                              onClick={() => setResetUser({ id: user.id, name: user.full_name ?? user.email ?? 'user' })}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                              title="Reset Password"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {manageable && !isSelf && (
                            <button
                              onClick={() => {
                                setDeleteId(user.id)
                                setDeleteName(user.full_name ?? user.email ?? 'user')
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Remove User"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )
                })
              )}
              {loading && Array.from({ length: 3 }).map((_, i) => (
                 <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><Skeleton className="h-9 w-48 rounded-lg" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-8 w-32 rounded-lg" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-8 w-32 rounded-lg" /></td>
                    <td className="px-4 py-4 text-right"><Skeleton className="h-8 w-16 ml-auto rounded-lg" /></td>
                 </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {hasMore && (
          <div className="p-4 border-t border-slate-50 bg-slate-50/30 flex justify-center">
             <Button variant="ghost" size="sm" onClick={() => loadMore()} disabled={loading} className="text-[10px] font-black uppercase tracking-widest text-slate-500">
               {loading && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
               Fetch More Staff Records
             </Button>
          </div>
        )}
      </div>

      <DeleteUserDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={removeUser}
        userName={deleteName}
        loading={deleteLoading}
      />
      
      <ResetPasswordDialog
        open={!!resetUser}
        onOpenChange={(o) => !o && setResetUser(null)}
        userId={resetUser?.id ?? ''}
        userName={resetUser?.name ?? ''}
      />
    </div>
  )
}
