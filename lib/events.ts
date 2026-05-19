import { Priority } from './types'

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

export function triggerViewRequest(requestId: string) {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent(ELK_VIEW_REQUEST_DRAWER, { detail: requestId })
    window.dispatchEvent(event)
  }
}
