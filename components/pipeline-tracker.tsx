'use client'

import { motion } from 'framer-motion'
import { Check, X, Clock, User } from 'lucide-react'
import { cn, formatDateTime } from '@/lib/utils'
import type { Stage, ApprovalStep, ApprovalStepWithProfile } from '@/lib/types'

const stages: { key: Exclude<Stage, 'complete'>; label: string; shortLabel: string }[] = [
  { key: 'hod', label: 'HOD', shortLabel: 'A1' },
  { key: 'approval', label: 'DT', shortLabel: 'A2' },
  { key: 'admin', label: 'Admin', shortLabel: 'A3' },
  { key: 'super_admin', label: 'Super Admin', shortLabel: 'A4' },
]

type StageState = 'completed' | 'current' | 'upcoming' | 'rejected'

function getStageState(
  stageKey: Exclude<Stage, 'complete'>,
  currentStage: Stage,
  status: string,
  steps: ApprovalStep[]
): StageState {
  const stageOrder = ['hod', 'approval', 'admin', 'super_admin'] as const
  const stageIndex = stageOrder.indexOf(stageKey)
  const currentIndex = currentStage === 'complete'
    ? 4
    : stageOrder.indexOf(currentStage as Exclude<Stage, 'complete'>)

  const step = steps.find((entry) => entry.stage === stageKey)

  if (status === 'rejected' && step?.decision === 'rejected') return 'rejected'
  if (step?.decision === 'approved') return 'completed'
  if (stageIndex === currentIndex && status === 'pending') return 'current'
  if (currentStage === 'complete' || stageIndex < currentIndex) return 'completed'
  return 'upcoming'
}

interface PipelineTrackerProps {
  currentStage: Stage
  status: string
  steps: ApprovalStepWithProfile[]
  stepProfiles?: Record<string, { full_name: string | null }>
  compact?: boolean
  onStageClick?: (stage: Exclude<Stage, 'complete'>) => void
  className?: string
}

export function PipelineTracker({
  currentStage,
  status,
  steps,
  stepProfiles = {},
  compact = false,
  onStageClick,
  className,
}: PipelineTrackerProps) {
  const stageOrder = ['hod', 'approval', 'admin', 'super_admin'] as const
  const currentIndex = currentStage === 'complete'
    ? 4
    : stageOrder.indexOf(currentStage as Exclude<Stage, 'complete'>)

  if (compact) {
    return (
      <div className={cn('flex items-start gap-2 pb-4 pt-1', className)}>
        {stages.map((stage, index) => {
          const state = getStageState(stage.key, currentStage, status, steps)
          return (
            <div key={stage.key} className="flex items-start gap-2">
              <div className="relative flex flex-col items-center">
                <button
                  type="button"
                  title={onStageClick ? `Recall to ${stage.label}` : stage.label}
                  disabled={!onStageClick || stage.key === currentStage}
                  onClick={(e) => {
                    e.stopPropagation()
                    onStageClick?.(stage.key)
                  }}
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full border z-10 transition-all',
                    onStageClick && stage.key !== currentStage && 'cursor-pointer hover:ring-2 hover:ring-brand-200',
                    state === 'completed' && 'border-brand-500 bg-brand-500 text-white',
                    state === 'current' && 'stage-pulse border-amber-400 bg-amber-50 text-amber-600',
                    state === 'upcoming' && 'border-slate-300 bg-white text-slate-400',
                    state === 'rejected' && 'border-red-400 bg-red-50 text-red-500',
                  )}
                >
                  {state === 'completed' ? <Check className="h-2.5 w-2.5" /> : null}
                  {state === 'rejected' ? <X className="h-2.5 w-2.5" /> : null}
                  {state === 'current' || state === 'upcoming' ? (
                    <span className="text-[9px] font-semibold">{stage.shortLabel}</span>
                  ) : null}
                </button>
                <span className={cn(
                  "absolute top-[22px] text-[9px] font-medium whitespace-nowrap text-center",
                  state === 'completed' && 'text-brand-600',
                  state === 'current' && 'text-amber-600',
                  state === 'upcoming' && 'text-slate-400',
                  state === 'rejected' && 'text-red-500'
                )}>
                  {stage.label}
                </span>
              </div>
              {index < stages.length - 1 && (
                <div className="relative h-px w-6 overflow-hidden bg-slate-200 mt-[10px]">
                  <div
                    className="absolute inset-0 bg-brand-500 origin-left transition-transform duration-300"
                    style={{
                      transform: (state === 'completed' || (currentIndex > index && status !== 'rejected'))
                        ? 'scaleX(1)'
                        : 'scaleX(0)',
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn('flex items-start gap-0', className)}>
      {stages.map((stage, index) => {
        const state = getStageState(stage.key, currentStage, status, steps)
        const step = steps.find((entry) => entry.stage === stage.key)
        const approverName = step?.profiles?.full_name || (step?.decided_by ? stepProfiles[step.decided_by]?.full_name : null)

        return (
          <div key={stage.key} className="relative flex flex-1 items-start">
            <div className="relative z-10 flex w-full flex-1 flex-col items-center">
              <div className="absolute left-1/2 top-[17px] z-0 h-0.5 w-full overflow-hidden bg-slate-200">
                <motion.div
                  className="h-full w-full origin-left bg-emerald-500"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: state === 'completed' ? 1 : 0 }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                />
              </div>

              <div className="relative z-10 rounded-full bg-white">
                <motion.button
                  type="button"
                  disabled={!onStageClick || stage.key === currentStage}
                  onClick={(e) => {
                    e.stopPropagation()
                    onStageClick?.(stage.key)
                  }}
                  title={onStageClick ? `Recall to ${stage.label}` : stage.label}
                  className={cn(
                    'relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300',
                    onStageClick && stage.key !== currentStage && 'cursor-pointer hover:ring-4 hover:ring-brand-50 hover:border-brand-300',
                    state === 'completed' && 'border-emerald-600 bg-emerald-600',
                    state === 'current' && 'stage-pulse border-amber-400 bg-white',
                    state === 'upcoming' && 'border-slate-300 bg-white',
                    state === 'rejected' && 'border-red-400 bg-red-50',
                  )}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {state === 'completed' && <Check className="h-4 w-4 text-white" strokeWidth={2.5} />}
                  {state === 'rejected' && <X className="h-4 w-4 text-red-500" strokeWidth={2.5} />}
                  {state === 'current' && <Clock className="h-4 w-4 text-amber-500" />}
                  {state === 'upcoming' && <User className="h-4 w-4 text-slate-400" />}
                </motion.button>
              </div>

              <div className="mt-2 min-w-0 text-center">
                <p className={cn(
                  'text-xs font-semibold',
                  state === 'completed' && 'text-emerald-700',
                  state === 'current' && 'text-amber-600',
                  state === 'upcoming' && 'text-slate-400',
                  state === 'rejected' && 'text-red-500',
                )}>
                  {stage.label}
                </p>
              </div>
            </div>
          </div>
        )
      })}

      <div className="flex flex-1 items-start">
        <div className="relative z-10 flex w-full flex-col items-center">
          <motion.div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300',
              currentStage === 'complete' && status === 'approved'
                ? 'border-emerald-600 bg-emerald-600'
                : 'border-slate-300 bg-white',
            )}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {currentStage === 'complete' && status === 'approved' ? (
              <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
            ) : (
              <Check className="h-4 w-4 text-slate-300" strokeWidth={2.5} />
            )}
          </motion.div>
          <div className="mt-2 text-center">
            <p className={cn(
              'text-xs font-semibold',
              currentStage === 'complete' ? (status === 'approved' ? 'text-emerald-700' : 'text-red-500') : 'text-slate-400',
            )}>
              Done
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
