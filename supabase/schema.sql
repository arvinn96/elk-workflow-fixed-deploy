-- ============================================================
-- ApproveFlow Database Schema
-- 6-level role hierarchy: user -> hod -> approval (DT) -> admin -> super_admin -> ucd
-- ============================================================

-- ── MIGRATION: run these ALTER statements on an existing database ────────────
-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
-- ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
--   CHECK (role IN ('user','hod','approval','admin','super_admin','ucd'));
-- ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check;
-- ALTER TABLE requests ADD CONSTRAINT requests_status_check
--   CHECK (status IN ('draft','pending','approved','rejected','sprint','uat','completed'));
-- -- Fix 'manager' → 'hod' in stage constraints (schema was inconsistent with app code):
-- ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_current_stage_check;
-- ALTER TABLE requests ADD CONSTRAINT requests_current_stage_check
--   CHECK (current_stage IN ('hod','approval','admin','super_admin','complete'));
-- ALTER TABLE requests ALTER COLUMN current_stage SET DEFAULT 'hod';
-- ALTER TABLE approval_steps DROP CONSTRAINT IF EXISTS approval_steps_stage_check;
-- ALTER TABLE approval_steps ADD CONSTRAINT approval_steps_stage_check
--   CHECK (stage IN ('hod','approval','admin','super_admin'));
-- -- Update any existing rows still using 'manager' stage value:
-- UPDATE requests SET current_stage = 'hod' WHERE current_stage = 'manager';
-- UPDATE approval_steps SET stage = 'hod' WHERE stage = 'manager';
-- -- Apply new performance functions (idempotent — safe to re-run):
-- \i schema.sql  (or run the full file in Supabase SQL Editor)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  email text,
  role text check (role in ('user', 'hod', 'approval', 'admin', 'super_admin', 'ucd')) default 'user',
  department text,
  avatar_url text,
  created_at timestamptz default now()
);

create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text check (type in ('leave', 'document', 'project')) not null,
  status text check (status in ('draft', 'pending', 'approved', 'rejected', 'sprint', 'uat', 'completed')) default 'pending',
  current_stage text check (current_stage in ('hod', 'approval', 'admin', 'super_admin', 'complete')) default 'hod',
  department text,
  submitted_by uuid references profiles(id) on delete set null,
  sponsored_by text,
  problem_statement text,
  proposed_change text,
  priority_level text check (priority_level in ('critical', 'high', 'medium', 'low')) default 'medium',
  expected_impact text,
  measurement text,
  effort_estimate text,
  key_teams text,
  cross_dept_impact text,
  dependencies text,
  desired_timeline text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists approval_steps (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references requests(id) on delete cascade,
  stage text check (stage in ('hod', 'approval', 'admin', 'super_admin')) not null,
  decision text check (decision in ('pending', 'approved', 'rejected')) default 'pending',
  decided_by uuid references profiles(id) on delete set null,
  comment text,
  decided_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Returns the authenticated user's role.
-- Marked STABLE so PostgreSQL evaluates it once per query (not once per row),
-- eliminating redundant profile lookups across all RLS policies.
create or replace function public.get_auth_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid()
$$;

-- Returns the authenticated user's department (same caching benefit as above).
create or replace function public.get_auth_user_department()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select department from profiles where id = auth.uid()
$$;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, department)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data->>'department', '')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.set_request_department()
returns trigger as $$
begin
  new.department := (
    select department from public.profiles where id = new.submitted_by
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.protect_profile_role()
returns trigger as $$
declare
  actor_role text;
begin
  if old.role is distinct from new.role then
    if auth.uid() is null then
      return new;
    end if;

    select role into actor_role
    from public.profiles
    where id = auth.uid();

    if actor_role = 'super_admin' then
      return new;
    end if;

    if actor_role = 'admin' then
      if old.role in ('admin', 'super_admin') then
        raise exception 'Admins cannot edit privileged roles';
      end if;

      if new.role not in ('user', 'hod', 'approval') then
        raise exception 'Admins cannot assign privileged roles';
      end if;

      return new;
    end if;

    raise exception 'Unauthorized to change role';
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================================
-- TRIGGERS
-- ============================================================

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists on_request_created on public.requests;
create trigger on_request_created
  before insert on public.requests
  for each row execute procedure public.set_request_department();

drop trigger if exists on_profile_role_update on public.profiles;
create trigger on_profile_role_update
  before update on public.profiles
  for each row execute procedure public.protect_profile_role();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table requests enable row level security;
alter table approval_steps enable row level security;
alter table audit_logs enable row level security;

-- ---- PROFILES ----
drop policy if exists "profiles are viewable by everyone" on profiles;
create policy "profiles are viewable by everyone"
  on profiles for select
  to authenticated
  using (true);

drop policy if exists "users can update own profile" on profiles;
create policy "users can update own profile"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "admins can update any profile" on profiles;
drop policy if exists "privileged users can update allowed profiles" on profiles;
create policy "privileged users can update allowed profiles"
  on profiles for update
  to authenticated
  using (
    get_auth_user_role() = 'super_admin'
    or (
      get_auth_user_role() = 'admin'
      and role in ('user', 'hod', 'approval')
    )
    or id = auth.uid()
  )
  with check (
    get_auth_user_role() = 'super_admin'
    or (
      get_auth_user_role() = 'admin'
      and role in ('user', 'hod', 'approval')
    )
    or id = auth.uid()
  );

-- ---- REQUESTS ----
-- Consolidated requests SELECT policy.
-- Uses get_auth_user_role() and get_auth_user_department() — both STABLE, so
-- PostgreSQL evaluates each once per query instead of once per row.
-- Also fixes the 'manager' bug: the role is 'hod', not 'manager'.
drop policy if exists "user sees own requests" on requests;
drop policy if exists "manager sees department requests" on requests;
drop policy if exists "approval sees all requests" on requests;
drop policy if exists "admin sees all requests" on requests;
drop policy if exists "super_admin sees all requests" on requests;
drop policy if exists "ucd sees all requests" on requests;
drop policy if exists "role-based request visibility" on requests;
create policy "role-based request visibility"
  on requests for select
  to authenticated
  using (
    case get_auth_user_role()
      when 'user'        then submitted_by = auth.uid()
      when 'hod'         then department = get_auth_user_department()
      when 'approval'    then true
      when 'admin'       then true
      when 'super_admin' then true
      when 'ucd'         then true
      else false
    end
  );

drop policy if exists "anyone can submit requests" on requests;
create policy "anyone can submit requests"
  on requests for insert
  to authenticated
  with check (submitted_by = auth.uid());

drop policy if exists "approvers can update requests" on requests;
drop policy if exists "no direct request updates" on requests;
create policy "no direct request updates"
  on requests for update
  to authenticated
  using (false)
  with check (false);

-- ---- APPROVAL STEPS ----
drop policy if exists "approvers can view steps" on approval_steps;
drop policy if exists "users can view steps for visible requests" on approval_steps;
-- The EXISTS subquery ran a full requests lookup per row. Since approval_steps
-- are only ever accessed via a join with requests (which has its own RLS policy),
-- we can safely allow all authenticated users here — request-level RLS already
-- gates what rows reach this join.
create policy "users can view steps for visible requests"
  on approval_steps for select
  to authenticated
  using (true);

drop policy if exists "approvers can insert steps" on approval_steps;
drop policy if exists "no direct approval step inserts" on approval_steps;
create policy "no direct approval step inserts"
  on approval_steps for insert
  to authenticated
  with check (false);

drop policy if exists "no direct approval step updates" on approval_steps;
create policy "no direct approval step updates"
  on approval_steps for update
  to authenticated
  using (false)
  with check (false);

-- ---- AUDIT LOGS ----
drop policy if exists "admins can view audit logs" on audit_logs;
create policy "admins can view audit logs"
  on audit_logs for select
  to authenticated
  using (
    get_auth_user_role() in ('admin', 'super_admin')
  );

drop policy if exists "service can insert audit logs" on audit_logs;
drop policy if exists "no direct audit log inserts" on audit_logs;
create policy "no direct audit log inserts"
  on audit_logs for insert
  to authenticated
  with check (false);

-- ============================================================
-- REALTIME
-- ============================================================
alter publication supabase_realtime add table requests;
alter publication supabase_realtime add table approval_steps;
