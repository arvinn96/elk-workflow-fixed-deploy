-- OPTIMIZATION: High-performance indexes for the dashboard and detail views
-- These ensure that filtering by user, department, and status is instant.

-- Enable trigram search extension for the title search index
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Requests: User and Department filtering (optimized for dashboard tables)
CREATE INDEX IF NOT EXISTS idx_requests_submitted_by_status_updated ON requests(submitted_by, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_department_status_updated ON requests(department, status, updated_at DESC);

-- 2. Audit Logs: Activity feed performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 3. Profiles: Role and Department lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role_dept ON profiles(role, department);

-- 4. Search performance
CREATE INDEX IF NOT EXISTS idx_requests_title_search ON requests USING gin(title gin_trgm_ops);

-- 5. Enhanced Analytics RPC: Get ALL counts and trends in one scan
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats_result JSON;
  trend_result JSON;
BEGIN
  -- A. Get basic counts
  SELECT json_build_object(
    'inbox',            COUNT(*) FILTER (WHERE status = 'pending' AND current_stage IN ('hod', 'approval')),
    'grooming',         COUNT(*) FILTER (WHERE status = 'pending' AND current_stage = 'admin'),
    'pending_approval', COUNT(*) FILTER (WHERE status = 'pending' AND current_stage = 'super_admin'),
    'approved',         COUNT(*) FILTER (WHERE status IN ('approved', 'sprint', 'uat', 'completed')),
    'in_sprint',        COUNT(*) FILTER (WHERE status = 'sprint'),
    'in_uat',           COUNT(*) FILTER (WHERE status = 'uat'),
    'done',             COUNT(*) FILTER (WHERE status = 'completed'),
    'total',            COUNT(*)
  ) INTO stats_result
  FROM requests;

  -- B. Get monthly trend data for the last 6 months (pre-aggregated)
  WITH months AS (
    SELECT generate_series(
      date_trunc('month', now()) - interval '6 months',
      date_trunc('month', now()),
      interval '1 month'
    )::date as m
  ),
  monthly_counts AS (
    SELECT 
      date_trunc('month', r.created_at)::date as month_date,
      count(*) as total_in_month,
      count(*) FILTER (WHERE status IN ('approved', 'sprint', 'uat', 'completed')) as realised
    FROM requests r
    WHERE r.created_at >= date_trunc('month', now()) - interval '6 months'
    GROUP BY 1
  )
  SELECT json_agg(json_build_object(
    'month', to_char(months.m, 'Mon YY'),
    'realised', COALESCE(mc.realised, 0),
    'unrealised', COALESCE(mc.total_in_month, 0) - COALESCE(mc.realised, 0),
    'projects', COALESCE(mc.total_in_month, 0)
  )) INTO trend_result
  FROM months
  LEFT JOIN monthly_counts mc ON months.m = mc.month_date;

  RETURN json_build_object(
    'stats', stats_result,
    'trends', trend_result
  );
END;
$$;
