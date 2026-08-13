-- Function: sync_favorite_media
-- Schema: public
-- Return type: trigger
-- Security: Definer
--
-- Keeps public.profiles.favorite_movies / favorite_shows automatically in
-- sync with the reviews the user has written:
--   - On INSERT/UPDATE of a review with rating >= 7, the reviewed item's
--     movie_id is added to the corresponding favorites array (deduplicated).
--   - On DELETE, or on UPDATE/INSERT where the rating drops below 7, the
--     movie_id is removed from the favorites array.
--
-- This keeps the "favorites" arrays used by the recommendation engine
-- (see get_pure_collaborative_recommendations.sql and the content-based
-- branch in RecommendationsRow.tsx) reflective of the user's actual
-- positively-rated reviews, without any client-side bookkeeping.
--
-- NOTE: Must be attached to a trigger on the reviews table (e.g. AFTER
-- INSERT OR UPDATE OR DELETE ON public.reviews FOR EACH ROW EXECUTE
-- FUNCTION sync_favorite_media()). See Database > Triggers in the
-- Supabase dashboard to confirm/export the exact trigger definition.

CREATE OR REPLACE FUNCTION public.sync_favorite_media()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Αν το review έχει βαθμολογία >= 7, προσθέτουμε το movie_id στις υπάρχουσες επιλογές χωρίς διπλότυπα
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.rating >= 7 THEN
        IF NEW.media_type = 'movie' THEN
            UPDATE public.profiles
            -- Το array_cat ενώνει τους πίνακες και το select array_agg(distinct...) βγάζει τα διπλότυπα
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

    -- Αν το review έπεσε κάτω από 7 ή διαγράφηκε, αφαιρούμε το movie_id από τη λίστα
    ELSIF TG_OP = 'DELETE' OR ((TG_OP = 'UPDATE' OR TG_OP = 'INSERT') AND NEW.rating < 7) THEN
        -- Σε περίπτωση UPDATE/INSERT που έπεσε το rating, παίρνουμε το user_id από το NEW, στο DELETE από το OLD
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
$function$
