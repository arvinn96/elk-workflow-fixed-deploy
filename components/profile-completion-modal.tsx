'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DEPARTMENTS, type Profile } from '@/lib/types'
import { toast } from 'sonner'
import { Briefcase, User as UserIcon, ArrowRight } from 'lucide-react'

interface ProfileCompletionModalProps {
  profile: Profile
}

export function ProfileCompletionModal({ profile }: ProfileCompletionModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState(profile.full_name || '')
  const [department, setDepartment] = useState('')
  const [isOpen, setIsOpen] = useState(true)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!department) {
      toast.error('Please select your department')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        department: department,
      })
      .eq('id', profile.id)

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Profile completed! Welcome to ELK-DESA.')
    setIsOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[440px] p-0 overflow-hidden border-none shadow-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="bg-brand-600 h-2 w-full" />
        <div className="px-8 pt-8 pb-10">
          <DialogHeader className="mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 mb-4 shadow-sm border border-brand-100/50">
              <Briefcase className="h-6 w-6" />
            </div>
            <DialogTitle className="text-2xl font-heading font-bold text-slate-900 tracking-tight">
              One last thing
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1.5 leading-relaxed">
              To provide a professional experience and route approvals correctly, we need your organization details.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                <Label htmlFor="name" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Confirm Full Name
                </Label>
              </div>
              <Input
                id="name"
                placeholder="Jane Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-brand-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Assigned Department
                </Label>
              </div>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-brand-500 transition-all">
                  <SelectValue placeholder="Select your department" />
                </SelectTrigger>
                <SelectContent className="border-slate-200 shadow-xl">
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem 
                      key={dept} 
                      value={dept}
                      className="py-2.5 focus:bg-brand-50 focus:text-brand-700 cursor-pointer"
                    >
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-lg shadow-brand-200 transition-all group" 
              loading={loading}
            >
              Finish Setup
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
