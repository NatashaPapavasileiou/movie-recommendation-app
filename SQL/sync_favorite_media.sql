-- Function: public.sync_favorite_media()  (trigger function)
-- Security: DEFINER
--
-- Keeps profiles.favorite_movies / favorite_shows in sync with the user's reviews
-- (reviews are stored in public.comments, column rating 1-10, column media_type 'movie' | 'tv'):
--   - INSERT/UPDATE with rating >= 7  -> the title is added to the matching favorites array;
--   - DELETE, or rating below 7        -> the title is removed from it.
-- The favorites arrays feed both collaborative filtering and the content-based seed.

CREATE OR REPLACE FUNCTION public.sync_favorite_media()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Rating >= 7: add the title to the matching favorites array (no duplicates)
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.rating >= 7 THEN
        IF NEW.media_type = 'movie' THEN
            UPDATE public.profiles
            -- array_cat appends the id, array_agg(DISTINCT ...) removes duplicates
            SET favorite_movies = (
                SELECT array_agg(DISTINCT x)
                FROM unnest(array_cat(favorite_movies, ARRAY[NEW.movie_id]::integer[])) x
            )
            WHERE id = NEW.user_id;
        ELSIF NEW.media_type = 'tv' THEN
            UPDATE public.profiles
            SET favorite_shows = (
                SELECT array_agg(DISTINCT x)
                FROM unnest(array_cat(favorite_shows, ARRAY[NEW.movie_id]::integer[])) x
            )
            WHERE id = NEW.user_id;
        END IF;

    -- Rating below 7, or review deleted: remove the title from the favorites array
    ELSIF TG_OP = 'DELETE' OR ((TG_OP = 'UPDATE' OR TG_OP = 'INSERT') AND NEW.rating < 7) THEN
        -- On DELETE the row is in OLD, otherwise in NEW
        IF TG_OP = 'DELETE' THEN
            IF OLD.media_type = 'movie' THEN
                UPDATE public.profiles
                SET favorite_movies = array_remove(favorite_movies, OLD.movie_id)
                WHERE id = OLD.user_id;
            ELSIF OLD.media_type = 'tv' THEN
                UPDATE public.profiles
                SET favorite_shows = array_remove(favorite_shows, OLD.movie_id)
                WHERE id = OLD.user_id;
            END IF;
        ELSE
            IF NEW.media_type = 'movie' THEN
                UPDATE public.profiles
                SET favorite_movies = array_remove(favorite_movies, NEW.movie_id)
                WHERE id = NEW.user_id;
            ELSIF NEW.media_type = 'tv' THEN
                UPDATE public.profiles
                SET favorite_shows = array_remove(favorite_shows, NEW.movie_id)
                WHERE id = NEW.user_id;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

-- Trigger
DROP TRIGGER IF EXISTS trigger_sync_favorites ON public.comments;
CREATE TRIGGER trigger_sync_favorites
  AFTER INSERT OR DELETE OR UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.sync_favorite_media();
