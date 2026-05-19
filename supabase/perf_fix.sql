-- 1. Fix the "Return to Previous" bug by allowing 'returned' in the decision constraint
ALTER TABLE approval_steps DROP CONSTRAINT IF EXISTS approval_steps_decision_check;
ALTER TABLE approval_steps ADD CONSTRAINT approval_steps_decision_check 
  CHECK (decision IN ('pending', 'approved', 'rejected', 'returned'));

-- 2. Add performance indexes for the dashboard
CREATE INDEX IF NOT EXISTS idx_requests_status_stage ON requests(status, current_stage);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_steps_request_id ON approval_steps(request_id);

-- 3. Optimization: Analytics function to get all counts in one scan
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'inbox',            COUNT(*) FILTER (WHERE status = 'pending' AND current_stage IN ('hod', 'approval')),
    'grooming',         COUNT(*) FILTER (WHERE status = 'pending' AND current_stage = 'admin'),
    'pending_approval', COUNT(*) FILTER (WHERE status = 'pending' AND current_stage = 'super_admin'),
    'approved',         COUNT(*) FILTER (WHERE status IN ('approved', 'sprint', 'uat', 'completed')),
    'in_sprint',        COUNT(*) FILTER (WHERE status = 'sprint'),
    'in_uat',           COUNT(*) FILTER (WHERE status = 'uat'),
    'done',             COUNT(*) FILTER (WHERE status = 'completed'),
    'total',            COUNT(*)
  ) INTO result
  FROM requests;
  
  RETURN result;
END;
$$;
