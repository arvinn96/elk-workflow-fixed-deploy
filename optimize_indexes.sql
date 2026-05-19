-- ========================================================
-- APPROVEFLOW SUPABASE PERFORMANCE OPTIMIZATION INDEXES
-- ========================================================
-- Run this script in your Supabase SQL Editor to instantly
-- increase query speeds across the Unified Requests table.
-- Re-runnable: all statements use IF NOT EXISTS.

-- ── requests ────────────────────────────────────────────

-- 1. Index on Status
-- Drastically speeds up searches resolving "Pending Approval" or "Approved" counts
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);

-- 2. Index on Current Stage
-- Supercharges the Digital Transformation Overview Stage Distribution chart
CREATE INDEX IF NOT EXISTS idx_requests_current_stage ON public.requests(current_stage);

-- 3. Composite Index on Status + Created At
-- Speeds up the Projects Per Month calculation and time-series line charts
CREATE INDEX IF NOT EXISTS idx_requests_status_created_at ON public.requests(status, created_at DESC);

-- 4. Composite Index on Status + Current Stage (queue queries filter on both)
CREATE INDEX IF NOT EXISTS idx_requests_status_stage ON public.requests(status, current_stage);

-- 5. Index on Department
-- Reduces latency when HODs open the dashboard and it filters to their specific team.
-- Also speeds up the new consolidated RLS policy's department check.
CREATE INDEX IF NOT EXISTS idx_requests_department ON public.requests(department);

-- 6. Index on Requestor (Submitted By)
-- Speeds up loading the "My Requests" tab
CREATE INDEX IF NOT EXISTS idx_requests_submitted_by ON public.requests(submitted_by);

-- 7. Index on Updated At (for ordering in ELK projects table and realtime notifications)
CREATE INDEX IF NOT EXISTS idx_requests_updated_at ON public.requests(updated_at DESC);

-- ── approval_steps ───────────────────────────────────────

-- 8. Foreign-key index on request_id
-- Without this Postgres does a seq scan on approval_steps for every request join.
-- Critical for the select('*, approval_steps(*)')  pattern.
CREATE INDEX IF NOT EXISTS idx_approval_steps_request_id ON public.approval_steps(request_id);

-- 9. Index on decided_by (used in audit and step lookups)
CREATE INDEX IF NOT EXISTS idx_approval_steps_decided_by ON public.approval_steps(decided_by);

-- ── audit_logs ───────────────────────────────────────────

-- 10. Index on actor_id (joins to profiles, used for user-activity queries)
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);

-- 11. Index on created_at (ORDER BY created_at DESC on every audit page load)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ── profiles ─────────────────────────────────────────────

-- 12. Index on role (used by get_auth_user_role() and in RLS CASE expression)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
