'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, ShieldAlert, Lock, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AuthCodeErrorPage() {
  const router = useRouter()
  const [errorDetails, setErrorDetails] = useState<{
    type: string
    message: string
  }>({
    type: 'Unknown Error',
    message: 'An unexpected issue occurred during your authentication handshake.'
  })

  useEffect(() => {
    // PROFESSIONALLY parse the fragmented error from the OAuth redirect URL
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.replace('#', '?'))
      const error = params.get('error')
      const description = params.get('error_description')

      if (error === 'access_denied') {
        setErrorDetails({
          type: 'Access Denied',
          message: 'The authentication process was cancelled or access was rejected. Please try signing in again.'
        })
      } else if (description) {
        setErrorDetails({
          type: error || 'Auth Error',
          message: description.replace(/\+/g, ' ')
        })
      }
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
      {/* ── Background Branding ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div 
          className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(200,16,46,0.08) 0%, transparent 70%)' }}
        />
        <div 
          className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(15,23,42,0.05) 0%, transparent 70%)' }}
        />
      </div>

      <motion.div
        className="w-full max-w-[500px] relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="card p-12 text-center border-none shadow-[0_20px_60px_rgba(0,0,0,0.06)] bg-white/80 backdrop-blur-md">
          {/* Error Icon Sphere */}
          <div className="inline-flex relative mb-10">
            <div className="h-20 w-20 rounded-3xl bg-brand-50 flex items-center justify-center border border-brand-100 shadow-sm">
              <ShieldAlert className="h-10 w-10 text-brand-600" />
            </div>
            <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center">
              <Lock className="h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="space-y-4 mb-10">
            <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-600">
              Authentication Handshake Error
            </h1>
            <h2 className="text-3xl font-heading font-black text-slate-900 tracking-tight leading-tight">
              {errorDetails.type}
            </h2>
            <div className="h-px w-12 bg-slate-100 mx-auto" />
            <p className="text-sm text-slate-500 leading-relaxed px-4">
              {errorDetails.message}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.push('/login')}
              className="w-full h-12 bg-brand-600 hover:bg-brand-700 text-white font-black uppercase tracking-[0.15em] text-[10px] shadow-[0_8px_20px_rgba(200,16,46,0.15)] rounded-lg transition-all group"
            >
              <ArrowLeft className="mr-2 h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
              Return to Login
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="w-full h-12 border-slate-200 text-slate-500 font-black uppercase tracking-[0.15em] text-[10px] rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center"
            >
              <Home className="mr-2 h-3.5 w-3.5" />
              Back to Home
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ── Footer Branding ── */}
      <div className="mt-12 relative z-10 flex items-center gap-4 text-slate-300">
         <span className="text-xs font-black uppercase tracking-[0.3em]">ELK-DESA</span>
         <div className="h-px w-8 bg-slate-200" />
         <span className="text-sm tracking-tight" style={{ fontFamily: "Arial, sans-serif", fontWeight: 700 }}>ELK-DESA</span>
      </div>
    </div>
  )
}
