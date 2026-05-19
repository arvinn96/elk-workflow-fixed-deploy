'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, Briefcase, User as UserIcon, ArrowRight, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { DEPARTMENTS, type Profile } from '@/lib/types'
import { toast } from 'sonner'

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  
  const [fullName, setFullName] = useState('')
  const [department, setDepartment] = useState('')

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, department, avatar_url')
        .eq('id', user.id)
        .single()
      
      if (data) {
        setProfile(data)
        setFullName(data.full_name || '')
        // If they already have a department, they shouldn't be here
        if (data.department) {
          router.push('/dashboard')
          return
        }
      }
      setLoading(false)
    }

    fetchProfile()
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!department) {
      toast.error('Please select your department')
      return
    }

    setUpdating(true)
    const supabase = createClient()

    // PROFESSIONALLY re-verify the user ID to prevent UUID "undefined" errors
    const { data: { user } } = await supabase.auth.getUser()
    const targetId = profile?.id || user?.id

    if (!targetId) {
      toast.error('Authentication session lost. Please sign in again.')
      setUpdating(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        department: department,
      })
      .eq('id', targetId)

    if (error) {
      // If update fails because profile doesn't exist yet, try inserting/upserting
      if (error.code === 'P0001' || error.message.includes('uuid')) {
         toast.error('Profile synchronization error. Retrying...')
      }
      toast.error(error.message)
      setUpdating(false)
      return
    }

    toast.success('Your professional profile is ready!')
    
    // PROFESSIONALLY coordinate navigation for zero transition gap
    router.refresh()
    setTimeout(() => {
      router.push('/dashboard')
    }, 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Preparing your experience...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left Branding Panel ── */}
      <div
        className="relative hidden overflow-hidden p-16 lg:flex lg:w-[42%] lg:flex-col lg:justify-between"
        style={{ background: 'linear-gradient(165deg, #0f172a 0%, #1e293b 40%, #c8102e 100%)' }}
      >
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 35c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm60-17c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM88 52c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zM46 89c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zM54 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zM16 14c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm0 70c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm60-28c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-16-18c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm24-24c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm0 84c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-64-44c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm56 12c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-12 32c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-28-48c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm48 32c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-24-40c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-12-32c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-44 92c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm72-88c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM44 30c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-4-12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm44 71c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm-44-3c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm-28-8c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm58-51c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM33 18c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm65 14c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM30 61c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm-8 28c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm44-56c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm-16 20c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm8-16c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm-24 50c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm28 24c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM59 10c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm-18 46c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm27 22c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM33 7c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm-4 44c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm4 18c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM14 31c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM2 72c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm53-17c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm42-45c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
        />

        {/* Branding header removed for cleaner UI */}

        <div className="relative z-10 flex flex-1 flex-col justify-center max-w-[360px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="h-[2px] w-12 bg-brand-500 mb-8" />
            <h1 className="text-5xl font-heading font-black text-white mb-8 leading-[1.1] tracking-tight">
              Scale Your <span className="text-brand-500">Corporate</span> Workflow.
            </h1>
            <p className="text-slate-300 text-lg font-light leading-relaxed mb-10 opacity-80">
              Welcome to the elite tier of enterprise management. Finalize your profile to unlock high-fidelity project tracking and automated approval pipelines.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 flex items-center gap-6">
          <div className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">
            Secure Onboarding
          </div>
          <div className="h-px w-12 bg-white/10" />
          <div className="text-[10px] text-brand-500 font-bold uppercase tracking-[0.3em]">
            Elite Tier
          </div>
        </div>
      </div>

      {/* ── Action Panel ── */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 p-8">
        <motion.div
          className="w-full max-w-[460px]"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="card p-12 border-none shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
            <div className="mb-10 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mb-8 border border-brand-100 shadow-sm">
                <Settings className="h-7 w-7" />
              </div>
              <h2 className="text-3xl font-heading font-black text-slate-900 tracking-tight mb-3">Complete Profile</h2>
              <p className="text-slate-400 text-sm font-medium">ESTABLISH YOUR ORGANIZATIONAL UNIT TO CONTINUE</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 mb-1.5 px-0.5">
                  <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Full Professional Name</Label>
                </div>
                <Input
                  placeholder="Enter your registered name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-0 focus:border-brand-500 rounded-lg text-sm transition-all"
                />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2 mb-1.5 px-0.5">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Organization Unit</Label>
                </div>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-0 focus:border-brand-500 rounded-lg text-sm transition-all">
                    <SelectValue placeholder="Select your internal department" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 shadow-2xl p-1">
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem 
                        key={dept} 
                        value={dept}
                        className="py-3 px-4 cursor-pointer rounded-md focus:bg-brand-50 focus:text-brand-700 transition-colors"
                      >
                        <span className="font-medium">{dept}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-6">
                <Button 
                  type="submit" 
                  className="w-full h-14 bg-brand-600 hover:bg-brand-700 text-white font-black uppercase tracking-[0.15em] text-xs shadow-[0_10px_30px_rgba(200,16,46,0.2)] transition-all group rounded-xl" 
                  loading={updating}
                >
                  Finalize Setup
                  <ArrowRight className="ml-3 h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
                </Button>
              </div>
            </form>

            <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-center gap-8 grayscale opacity-50">
               <div className="flex items-center gap-2">
                 <div className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Secure</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Enterprise</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Encryption</span>
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
