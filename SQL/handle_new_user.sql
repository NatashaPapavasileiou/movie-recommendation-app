-- Function: public.handle_new_user()  (trigger function)
-- Security: DEFINER (must insert into public.profiles on behalf of a user who has no session yet)
--
-- Creates the profile row of every new account: email as initial username, empty favorites
-- and has_completed_setup = false, which sends the user to the onboarding page (UC2).
-- profiles.role is not set here, so it takes its column default 'user'.

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Create the profile row; the email is used as the initial username
  INSERT INTO public.profiles (id, username, favorite_genres, favorite_movies, favorite_shows, has_completed_setup)
  VALUES (
    NEW.id,
    NEW.email,    -- email of the new auth account
    '{}'::INT[], 
    '{}'::INT[], 
    '{}'::INT[], 
    false
  );
  RETURN NEW;
END;
$function$;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
