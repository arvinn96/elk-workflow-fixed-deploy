export const REQUEST_SKINNY_SELECT = 
  'id, title, type, status, current_stage, created_at, updated_at, submitted_by, department, profiles:submitted_by(id, full_name, email, role, department, avatar_url), approval_steps(id, stage, decision, decided_by, decided_at)'

export const REQUEST_LIST_SELECT =
  'id, title, status, type, current_stage, created_at, updated_at, submitted_by, department, profiles:submitted_by(id, full_name, email, role, department, avatar_url, created_at), approval_steps(id, request_id, stage, decision, decided_by, comment, decided_at, created_at)'

export const REQUEST_DETAIL_SELECT =
  '*, profiles:submitted_by(id, full_name, email, role, department, avatar_url, created_at), approval_steps(*, profiles:decided_by(id, full_name, email, role, department, avatar_url, created_at))'

export const QUEUE_CARD_SELECT =
  'id, title, status, type, current_stage, created_at, updated_at, submitted_by, department, profiles:submitted_by(id, full_name, email, role, department, avatar_url, created_at), approval_steps(id, request_id, stage, decision, decided_by, comment, decided_at, created_at)'
