import { Priority } from './types'
import type { RequestWithProfile } from './types'

export const ELK_OPEN_REQUEST_DRAWER = 'elk-open-request-drawer'
export const ELK_VIEW_REQUEST_DRAWER = 'elk-view-request-drawer'

export interface ExtractionData {
  title?: string
  sponsored_by?: string
  problem_statement?: string
  proposed_change?: string
  priority_level?: Priority
  expected_impact?: string
  measurement_kpi?: string
  measurement_unit?: string
  key_teams?: string
  cross_dept_impact?: string
  dependencies?: string
  desired_timeline?: string
  attachment_url?: string
}

export function triggerRequestDrawer(data?: ExtractionData) {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent(ELK_OPEN_REQUEST_DRAWER, { detail: data })
    window.dispatchEvent(event)
  }
}

/**
 * Trigger the view-request drawer.
 * Pass the full `request` object if available — this makes the drawer open
 * INSTANTLY with real data instead of showing a loading skeleton.
 */
export function triggerViewRequest(requestId: string, request?: RequestWithProfile) {
  if (typeof window !== 'undefined') {
    const detail = request ? { id: requestId, request } : requestId
    const event = new CustomEvent(ELK_VIEW_REQUEST_DRAWER, { detail })
    window.dispatchEvent(event)
  }
}
