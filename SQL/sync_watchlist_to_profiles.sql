-- Function: public.sync_watchlist_to_profiles()  (trigger function)
-- Security: DEFINER
--
-- Recomputes profiles.watchlist_to_watch (all 'to_watch' titles of the user) after every change
-- to public.watchlist. Note: the frontend does not read this column at the moment; the
-- recommender reads public.watchlist directly (src/modules/watchlistService.ts).

CREATE OR REPLACE FUNCTION public.sync_watchlist_to_profiles()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    current_user_id UUID;
    all_watchlist_ids INT[];
BEGIN
    -- On DELETE the row is in OLD, otherwise in NEW
    IF TG_OP = 'DELETE' THEN
        current_user_id := OLD.user_id;
    ELSE
        current_user_id := NEW.user_id;
    END IF;

    -- All distinct titles the user still has as 'to_watch'
    SELECT COALESCE(array_agg(DISTINCT movie_id), '{}') INTO all_watchlist_ids
    FROM public.watchlist
    WHERE user_id = current_user_id AND status = 'to_watch';

    -- Store them on the profile
    UPDATE public.profiles
    SET watchlist_to_watch = all_watchlist_ids
    WHERE id = current_user_id;

    -- Return the row PostgreSQL expects for this operation
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$function$;

-- Trigger
DROP TRIGGER IF EXISTS on_watchlist_change ON public.watchlist;
CREATE TRIGGER on_watchlist_change
  AFTER INSERT OR DELETE OR UPDATE ON public.watchlist
  FOR EACH ROW EXECUTE FUNCTION public.sync_watchlist_to_profiles();
