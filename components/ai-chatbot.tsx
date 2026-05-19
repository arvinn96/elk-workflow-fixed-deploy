'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  X, 
  Send, 
  Paperclip, 
  Loader2, 
  User,
  Bot,
  ChevronRight,
  ClipboardList,
  BarChart3,
  FileCheck,
  Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { triggerRequestDrawer } from '@/lib/events'

interface Message {
  role: 'user' | 'assistant'
  content: string
  payload?: {
    type: 'list' | 'stats'
    data: any
  }
}

export function AIChatbot() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your ELK Assistant. I can help you manage your dashboard, create requests, and analyze documents.' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error)

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.content,
        payload: data.toolResult?.success ? { 
          type: data.toolResult.type, 
          data: data.toolResult.data 
        } : undefined
      }])
      
      if (data.toolResult?.success && !data.toolResult.type) {
        toast.success(`Action completed successfully!`)
      }
    } catch (error) {
      toast.error('Failed to get response')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsExtracting(true)
    const toastId = toast.loading('Reading document...')

    try {
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
      const base64 = await base64Promise

      const res = await fetch('/api/extract-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, fileName: file.name }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to extract document')

      const ext = data.extraction
      const summary = `I've analyzed "${file.name}".\n\n**Proposed**: ${ext.title}\n**Problem**: ${ext.problem_statement}\n\nShall I proceed with this request?`
      
      setMessages(prev => [...prev, 
        { role: 'user', content: `Uploaded file: ${file.name}` },
        { role: 'assistant', content: summary }
      ])
      
      toast.success('Document analyzed.', { id: toastId })
      
      // PROFESSIONALLY trigger the global request drawer with the extracted data
      triggerRequestDrawer({
        title: ext.title,
        problem_statement: ext.problem_statement,
        proposed_change: ext.proposed_change,
        sponsored_by: ext.sponsored_by,
        priority_level: ext.priority_level,
        expected_impact: ext.expected_impact,
        measurement_kpi: ext.measurement_kpi,
        measurement_unit: ext.measurement_unit,
        key_teams: ext.key_teams,
        cross_dept_impact: ext.cross_dept_impact,
        dependencies: ext.dependencies,
        desired_timeline: ext.desired_timeline
      })
    } catch (error) {
      toast.error('Failed to analyze document', { id: toastId })
    } finally {
      setIsExtracting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 flex h-[550px] w-[380px] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-brand-600 px-4 py-3 text-white">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-white/20 p-1.5 backdrop-blur-sm">
                  <Sparkles className="h-4 w-4 fill-white/20" />
                </div>
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest leading-none">ELK Navigator</h3>
                  <p className="text-[9px] text-white/70 mt-0.5 font-medium italic">Intelligent Support</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar" ref={scrollRef}>
              {messages.map((m, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex gap-3",
                    m.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-all duration-300",
                    m.role === 'user' ? "bg-slate-900 border-slate-800 shadow-lg" : "bg-brand-50 border-brand-100 shadow-sm"
                  )}>
                    {m.role === 'user' ? <User className="h-3.5 w-3.5 text-white" /> : <Bot className="h-3.5 w-3.5 text-brand-600" />}
                  </div>
                  <div className="flex flex-col gap-2 max-w-[85%]">
                    <div className={cn(
                      "rounded-2xl px-4 py-2.5 text-[12px] leading-relaxed shadow-sm",
                      m.role === 'user' 
                        ? "bg-slate-900 text-white rounded-tr-none" 
                        : "bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none"
                    )}>
                      {m.content.split('\n').map((line, idx) => (
                        <p key={idx} className={idx > 0 ? "mt-1.5" : ""}>{line}</p>
                      ))}
                    </div>

                    {/* Payload Rendering */}
                    {m.payload && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2 mt-1"
                      >
                        {m.payload.type === 'list' && (
                          <div className="grid gap-2">
                            {m.payload.data.slice(0, 5).map((req: any) => (
                              <div 
                                key={req.id} 
                                onClick={() => {
                                  router.push(`/requests/${req.id}`)
                                  setIsOpen(false)
                                }}
                                className="group relative rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-brand-200 hover:shadow-md cursor-pointer active:scale-[0.98]"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-900 text-xs truncate uppercase tracking-tight">
                                      {req.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1.5">
                                      <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                                        req.status === 'approved' ? "bg-emerald-50 text-emerald-600" : 
                                        req.status === 'rejected' ? "bg-rose-50 text-rose-600" : "bg-brand-50 text-brand-600"
                                      )}>
                                        {req.status}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-medium">
                                        {format(new Date(req.created_at), 'd MMM')}
                                      </span>
                                    </div>
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-brand-600 transition-colors" />
                                </div>
                              </div>
                            ))}
                            <Button 
                              variant="ghost" 
                              onClick={() => {
                                router.push('/requests')
                                setIsOpen(false)
                              }}
                              className="w-full text-[11px] font-bold text-brand-600 h-8 rounded-xl hover:bg-brand-50"
                            >
                              VIEW ALL REQUESTS
                            </Button>
                          </div>
                        )}

                        {m.payload.type === 'stats' && (
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { label: 'TOTAL', val: m.payload.data.total, icon: ClipboardList, color: 'brand' },
                              { label: 'PENDING', val: m.payload.data.pending, icon: BarChart3, color: 'amber' },
                              { label: 'APPROVED', val: m.payload.data.approved, icon: FileCheck, color: 'emerald' },
                            ].map((stat) => (
                              <div key={stat.label} className="bg-slate-50 rounded-2xl border border-slate-100 p-3 flex flex-col items-center">
                                <stat.icon className={cn("h-4 w-4 mb-2", `text-${stat.color}-600`)} />
                                <span className={cn("text-lg font-black leading-none", `text-${stat.color}-600`)}>{stat.val}</span>
                                <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{stat.label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-50 border border-brand-100">
                    <Bot className="h-4 w-4 text-brand-600" />
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-3xl rounded-tl-none px-5 py-3 shadow-sm">
                    <div className="flex gap-1.5">
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer / Input Area */}
            <div className="p-4 border-t border-slate-100">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.doc"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  className="shrink-0 rounded-xl h-10 w-10 text-slate-400 hover:text-brand-600 hover:bg-brand-50 border-slate-200 transition-all"
                  disabled={isLoading || isExtracting}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="relative flex-1">
                  <Input 
                    placeholder="Type a message..." 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="rounded-xl bg-slate-50 border-transparent focus:bg-white h-10 text-[13px] pl-3 pr-3 transition-all"
                    disabled={isLoading}
                  />
                </div>
                <Button 
                  type="submit" 
                  size="icon"
                  className="shrink-0 rounded-xl h-10 w-10 bg-brand-600 hover:bg-brand-700 shadow-xl shadow-brand-100 border-0"
                  disabled={isLoading || !input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="mt-2.5 text-[9px] text-center text-slate-400 font-medium tracking-tight">
                AI can draft requests, search dashboard, and analyze documents.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-3xl shadow-2xl transition-all duration-500",
          isOpen ? "bg-slate-900 text-white rotate-90" : "bg-brand-600 text-white"
        )}
      >
        {isOpen ? <X className="h-7 w-7" /> : <Sparkles className="h-7 w-7 fill-white/20" />}
      </motion.button>
    </div>
  )
}
