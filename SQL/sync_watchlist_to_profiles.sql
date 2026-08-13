-- Function: sync_watchlist_to_profiles
-- Schema: public
-- Return type: trigger
-- Security: Definer
--
-- Keeps public.profiles.watchlist_to_watch automatically in sync with the
-- user's watchlist table: whenever a row is inserted, updated, or deleted
-- in public.watchlist, this function recomputes the full set of movie_id
-- values currently marked status = 'to_watch' for that user, and writes
-- them back onto profiles.watchlist_to_watch as an array.
--
-- NOTE: Must be attached to a trigger on the watchlist table (e.g. AFTER
-- INSERT OR UPDATE OR DELETE ON public.watchlist FOR EACH ROW EXECUTE
-- FUNCTION sync_watchlist_to_profiles()). See Database > Triggers in the
-- Supabase dashboard to confirm/export the exact trigger definition.

CREATE OR REPLACE FUNCTION public.sync_watchlist_to_profiles()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    current_user_id UUID;
    all_watchlist_ids INT[];
BEGIN
    -- Προσδιορίζουμε το user_id ανάλογα με το αν κάνουμε INSERT/UPDATE ή DELETE
    IF TG_OP = 'DELETE' THEN
        current_user_id := OLD.user_id;
    ELSE
        current_user_id := NEW.user_id;
    END IF;

    -- Μαζεύουμε όλα τα μοναδικά IDs από τη watchlist με status 'to_watch'
    SELECT COALESCE(array_agg(DISTINCT movie_id), '{}') INTO all_watchlist_ids
    FROM public.watchlist
    WHERE user_id = current_user_id AND status = 'to_watch';

    -- Ενημερώνουμε τη στήλη watchlist_to_watch στον πίνακα profiles
    UPDATE public.profiles
    SET watchlist_to_watch = all_watchlist_ids
    WHERE id = current_user_id;

    -- Επιστρέφουμε το κατάλληλο record για να συνεχίσει η PostgreSQL
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$function$