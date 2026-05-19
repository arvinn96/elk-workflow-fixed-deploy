-- ========================================================
-- ELK-DESA PERFORMANCE BUNDLE (CONSOLIDATED)
-- ========================================================
-- Run this in your Supabase SQL Editor to instantly
-- increase query speeds across the Unified Requests table.

-- 1. DATABASE CONSTRAINTS
-- Allows 'returned' decision in approval steps
ALTER TABLE approval_steps DROP CONSTRAINT IF EXISTS approval_steps_decision_check;
ALTER TABLE approval_steps ADD CONSTRAINT approval_steps_decision_check 
  CHECK (decision IN ('pending', 'approved', 'rejected', 'returned'));

-- 2. CRITICAL PERFORMANCE INDEXES

-- Index on Status (Speeds up almost every query)
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);

-- Index on Current Stage (Speeds up dashboard counts and stage distribution)
CREATE INDEX IF NOT EXISTS idx_requests_current_stage ON public.requests(current_stage);

-- Composite Index on Status + Current Stage (QUEUE QUERIES)
CREATE INDEX IF NOT EXISTS idx_requests_status_stage ON public.requests(status, current_stage);

-- Index on Department (Speeds up HOD/Team filtering)
CREATE INDEX IF NOT EXISTS idx_requests_department ON public.requests(department);

-- Index on Requestor (Submitted By)
CREATE INDEX IF NOT EXISTS idx_requests_submitted_by ON public.requests(submitted_by);

-- Composite Index on Status + Created At (Time-series charts)
CREATE INDEX IF NOT EXISTS idx_requests_status_created_at ON public.requests(status, created_at DESC);

-- Index on Updated At (Ordering)
CREATE INDEX IF NOT EXISTS idx_requests_updated_at ON public.requests(updated_at DESC);

-- Foreign-key index on request_id (CRITICAL for joins)
CREATE INDEX IF NOT EXISTS idx_approval_steps_request_id ON public.approval_steps(request_id);

-- 3. PROFILE & ROLE PERFORMANCE
-- Profile Role Index (Speeds up RLS and auth handshake)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Approval Steps Index (CRITICAL for HOD stats)
CREATE INDEX IF NOT EXISTS idx_approval_steps_decided_by ON public.approval_steps(decided_by);


-- 4. NEW: AUDITING & FORENSIC PERFORMANCE (CRITICAL FOR HISTORY TAB)
-- These indexes ensure the 'Forensic Audit' trail loads instantly even with thousands of logs.

-- Index on Entity ID (Speeds up project trail lookup)
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON public.audit_logs(entity_id);

-- Index on Actor ID (Speeds up joining names/avatars to the trail)
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);

-- Composite Index on Entity + Time (Speeds up chronological trail rendering)
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_time ON public.audit_logs(entity_id, created_at DESC);

-- Index on Action (Speeds up UCD History filtering)
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);


-- 5. OPTIMIZED DASHBOARD RPCs

-- A) SUPER-ADMIN STATS RPC
-- Performs a SINGLE SCAN of the requests table instead of multiple parallel counts.
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
    'approved',         COUNT(*) FILTER (WHERE status = 'approved'),
    'in_sprint',        COUNT(*) FILTER (WHERE status = 'sprint'),
    'in_uat',           COUNT(*) FILTER (WHERE status = 'uat'),
    'done',             COUNT(*) FILTER (WHERE status = 'completed'),
    'total',            COUNT(*)
  ) INTO result
  FROM requests;
  RETURN result;
END;
$$;

-- B) HOD STATS RPC
-- Single-scan statistics for HODs (Awaited Review, Approved, Rejected, Total)
CREATE OR REPLACE FUNCTION get_hod_dashboard_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  v_queue_count INT;
BEGIN
  -- 1. Get queue count from requests (pending at HOD stage)
  SELECT COUNT(*) INTO v_queue_count 
  FROM requests 
  WHERE status = 'pending' AND current_stage = 'hod';

  -- 2. Get approval/rejection counts from approval_steps in one pass
  SELECT json_build_object(
    'queue_count',   v_queue_count,
    'approved_me',   COUNT(*) FILTER (WHERE decision = 'approved' AND (comment IS NULL OR comment NOT LIKE '%Auto-Approved%')),
    'rejected_me',   COUNT(*) FILTER (WHERE decision = 'rejected'),
    'total_handled', COUNT(*) FILTER (WHERE comment IS NULL OR comment NOT LIKE '%Auto-Approved%')
  ) INTO result
  FROM approval_steps
  WHERE decided_by = p_user_id AND decision != 'pending';
  
  RETURN result;
END;
$$;
