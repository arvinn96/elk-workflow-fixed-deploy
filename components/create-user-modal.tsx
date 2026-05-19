'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DEPARTMENTS, ROLE_LABELS, assignableRolesFor } from '@/lib/types'
import type { Role, Profile } from '@/lib/types'
import { toast } from 'sonner'

interface CreateUserModalProps {
  onSuccess: (newUser: Profile) => void
  currentUserRole: Role
}

export function CreateUserModal({ onSuccess, currentUserRole }: CreateUserModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    department: '',
    role: 'user' as Role,
  })

  if (!['admin', 'super_admin'].includes(currentUserRole)) {
    return null
  }

  const availableRoles = assignableRolesFor(currentUserRole)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.fullName || !form.email || !form.password || !form.department || !form.role) {
      toast.error('All fields are required')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to create user')
      }

      toast.success('User provisioned successfully!')

      const newProfile: Profile = {
        id: json.user.id,
        email: json.user.email,
        full_name: json.user.full_name,
        role: json.user.role,
        department: json.user.department,
        avatar_url: null,
        created_at: new Date().toISOString(),
      }

      onSuccess(newProfile)
      setOpen(false)
      setForm({
        fullName: '',
        email: '',
        password: '',
        department: '',
        role: 'user',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const setField = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add User</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Provision New User</DialogTitle>
          <DialogDescription>
            Create an account for a new team member and set their initial access rights.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="Jane Doe"
              value={form.fullName}
              onChange={(e) => setField('fullName', e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Work Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="jane@company.com"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={form.department} onValueChange={(value) => setField('department', value)} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((department) => (
                    <SelectItem key={department} value={department}>{department}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(value) => setField('role', value)} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">First-time Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Something secure..."
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              disabled={loading}
            />
            <p className="mt-1 text-[11px] text-slate-400">They can change this after their first login.</p>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} disabled={loading}>
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
