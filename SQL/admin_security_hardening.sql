-- Admin & security hardening (run once in the Supabase SQL editor)
--
-- Goal: the admin area must be protected by the database, not only by the React AdminRoute.
-- Problems found in the live database (export of 2026-10-05):
--   a) policy "Users can update their own profile" lets any user UPDATE their own row,
--      including profiles.role -> anyone can make themselves admin from the browser console;
--   b) RLS is DISABLED on security_audit_logs, so its two policies are not enforced and
--      anyone with the public anon key can read, change or delete every log (emails included);
--   c) admin_media_analytics / admin_user_analytics are views: they ignore RLS and are
--      readable by every logged-in user.
-- Fixes:
--   1. Only admins can change profiles.role.
--   2. RLS on for the audit logs: anyone can write an event (needed for failed logins, which
--      happen before login), only admins can read them, nobody can edit or delete them.
--   3. The views are served only through admin-checked functions.

-- Helper: true when the logged-in user is an admin.
-- SECURITY DEFINER so it can read profiles even when RLS would hide the row.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 1. Block role escalation from the client.
-- auth.role() is 'authenticated' only for requests coming from the app; the SQL editor,
-- the dashboard and the handle_new_user trigger are not affected.
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.role() = 'authenticated' AND NOT public.is_admin() THEN
    IF TG_OP = 'INSERT' AND COALESCE(NEW.role, 'user') <> 'user' THEN
      RAISE EXCEPTION 'Only admins can assign roles';
    ELSIF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Only admins can change roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_role_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_role_escalation
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- 2. Audit log access rules.
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Replace the two existing policies (the old INSERT one allowed any user_id)
DROP POLICY IF EXISTS "Authenticated users can insert audit events" ON public.security_audit_logs;
DROP POLICY IF EXISTS "Admins can view security logs" ON public.security_audit_logs;

DROP POLICY IF EXISTS "Audit events can be written by the app" ON public.security_audit_logs;
CREATE POLICY "Audit events can be written by the app"
  ON public.security_audit_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Only admins can read audit events" ON public.security_audit_logs;
CREATE POLICY "Only admins can read audit events"
  ON public.security_audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 3. Admin views: by default a Postgres view runs with its owner's rights and ignores RLS,
-- so any logged-in user could read it with supabase.from('admin_user_analytics').
-- Remove direct access and expose the data through admin-checked functions instead.
REVOKE SELECT ON public.admin_media_analytics FROM anon, authenticated;
REVOKE SELECT ON public.admin_user_analytics FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_media_analytics()
RETURNS SETOF public.admin_media_analytics
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY SELECT * FROM public.admin_media_analytics;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_user_analytics()
RETURNS SETOF public.admin_user_analytics
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY SELECT * FROM public.admin_user_analytics;
END;
$$;
