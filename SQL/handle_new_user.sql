-- Function: handle_new_user
-- Schema: public
-- Return type: trigger
-- Security: Definer
--
-- Automatically creates a corresponding row in public.profiles whenever a
-- new user signs up via Supabase Auth (auth.users). Copies the email as
-- the initial username, and initializes favorite_genres, favorite_movies,
-- and favorite_shows as empty arrays, with has_completed_setup = false
-- (which drives the "First-time Setup" / cold-start onboarding flow —
-- see checkSetupStatus in src/hooks/useAppLogic.ts).
--
-- NOTE: This function must be attached to a trigger on auth.users
-- (e.g. AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION
-- handle_new_user()) for it to run automatically. See Database > Triggers
-- in the Supabase dashboard to confirm/export the exact trigger definition.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Προσθέτουμε τη στήλη username και της δίνουμε την τιμή NEW.email
  INSERT INTO public.profiles (id, username, favorite_genres, favorite_movies, favorite_shows, has_completed_setup)
  VALUES (
    NEW.id,
    NEW.email,    -- Παίρνει αυτόματα το email από το account του χρήστη!
    '{}'::INT[],
    '{}'::INT[],
    '{}'::INT[],
    false
  );
  RETURN NEW;
END;
$$;
