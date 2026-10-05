-- Row Level Security policies, as exported from Supabase.
-- (security_audit_logs policies are replaced by admin_security_hardening.sql)

CREATE POLICY "Anyone can read reviews"
  ON public.comments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can delete their own review"
  ON public.comments FOR DELETE
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can post their own review"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((auth.uid() = id))
  WITH CHECK ((auth.uid() = id));

CREATE POLICY "Admins can view security logs"
  ON public.security_audit_logs FOR SELECT
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));

CREATE POLICY "Authenticated users can insert audit events"
  ON public.security_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can add to their own watchlist"
  ON public.watchlist FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can delete from their own watchlist"
  ON public.watchlist FOR DELETE
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can update their own watchlist"
  ON public.watchlist FOR UPDATE
  TO authenticated
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can view their own watchlist"
  ON public.watchlist FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id));
