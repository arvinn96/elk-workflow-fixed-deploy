'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DEPARTMENTS } from '@/lib/types'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const nextErrors: Record<string, string> = {}
    if (!form.fullName.trim()) nextErrors.fullName = 'Full name is required'
    if (!form.email.trim()) nextErrors.email = 'Email is required'
    if (form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters'
    if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match'
    if (!form.department) nextErrors.department = 'Please select your department'
    return nextErrors
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setLoading(true)

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          department: form.department,
        },
      },
    })

    if (signUpError) {
      setErrors({ submit: signUpError.message })
      setLoading(false)
      return
    }

    if (data.user) {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          department: form.department,
        }),
      })
    }

    setLoading(false)

    if (data.session) {
      toast.success('Account created! Welcome to ELK-DESA.')
      router.push('/dashboard')
      router.refresh()
      return
    }

    toast.success('Account created. Check your email to confirm your access.')
    router.push('/login')
  }

  const setField = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  return (
    <div className="min-h-screen flex">
      <div
        className="relative hidden overflow-hidden p-12 lg:flex lg:w-[48%] lg:flex-col lg:justify-between"
        style={{ background: 'linear-gradient(135deg, #6b0000 0%, #c8102e 60%, #a50d25 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/15">
                <span className="text-white text-[10px] font-black">ELK</span>
            </div>
            <span className="font-heading text-xl font-medium tracking-tight text-white">ELK-DESA</span>
          </div>
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center">
          <blockquote>
            <p className="font-heading text-3xl font-light italic leading-snug text-white/90">
              &ldquo;Join your team&apos;s approval workflow in minutes.&rdquo;
            </p>
            <footer className="mt-4 text-sm text-white/50">Set up your account and get started today</footer>
          </blockquote>

        </div>

        <div className="relative z-10 text-xs text-white/30">
          &copy; {new Date().getFullYear()} ELK-DESA. All rights reserved.
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-y-auto bg-slate-50 p-8">
        <motion.div
          className="w-full max-w-[420px] py-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-heading text-lg font-medium text-slate-900">ELK-DESA</span>
          </div>

          <div className="card p-8">
            <div className="mb-7">
              <h1 className="font-heading mb-1 text-2xl font-medium text-slate-900">Create account</h1>
              <p className="text-sm text-slate-500">Join your organisation&apos;s approval workflow.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  placeholder="Jane Smith"
                  value={form.fullName}
                  onChange={(e) => setField('fullName', e.target.value)}
                  error={errors.fullName}
                  autoComplete="name"
                />
                {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  error={errors.email}
                  autoComplete="email"
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select value={form.department} onValueChange={(value) => setField('department', value)}>
                  <SelectTrigger error={!!errors.department}>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((department) => (
                      <SelectItem key={department} value={department}>{department}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.department && <p className="text-xs text-red-500">{errors.department}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={(e) => setField('password', e.target.value)}
                    error={errors.password}
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={(e) => setField('confirmPassword', e.target.value)}
                  error={errors.confirmPassword}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
              </div>

              {errors.submit && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {errors.submit}
                </div>
              )}

              <Button type="submit" className="mt-2 w-full" loading={loading}>
                Create account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 border-t border-slate-200 pt-5 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-brand-600 hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
