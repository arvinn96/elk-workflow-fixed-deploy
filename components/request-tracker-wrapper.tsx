'use client'

import React from 'react'
import { PipelineTracker } from './pipeline-tracker'
import { toast } from 'sonner'
import type { Stage, ApprovalStepWithProfile } from '@/lib/types'
import { RecallConfirmDialog } from './recall-confirm-dialog'

interface Props {
  requestId: string
  currentStage: Stage
  status: string
  steps: ApprovalStepWithProfile[]
  stepProfiles?: Record<string, { full_name: string | null }>
  canRecall: boolean
}

export function RequestTrackerWrapper({ 
  requestId, currentStage, status, steps, stepProfiles, canRecall 
}: Props) {
  const [targetStage, setTargetStage] = React.useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isRecalling, setIsRecalling] = React.useState(false)
  
  const handleStageClick = (stage: Exclude<Stage, 'complete'>) => {
    if (!canRecall) return
    if (stage === currentStage) return
    setTargetStage(stage)
    setIsDialogOpen(true)
  }

  const handleConfirmRecall = async (comment: string) => {
    if (!targetStage) return
    setIsRecalling(true)
    const toastId = toast.loading('Executing recall...')
    try {
      const res = await fetch(`/api/requests/${requestId}/recall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          stage: targetStage,
          comment: comment
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Recall failed')
      }

      toast.success('Project recalled successfully', { id: toastId })
      window.location.reload()
    } catch (err: any) {
      toast.error(err.message, { id: toastId })
    } finally {
      setIsRecalling(false)
      setIsDialogOpen(false)
    }
  }

  return (
    <>
      <PipelineTracker 
        currentStage={currentStage}
        status={status}
        steps={steps}
        stepProfiles={stepProfiles}
        onStageClick={canRecall ? handleStageClick : undefined}
      />

      <RecallConfirmDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onConfirm={handleConfirmRecall}
        targetStage={targetStage}
        isActionLoading={isRecalling}
      />
    </>
  )
}
