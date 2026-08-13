-- Function: get_pure_collaborative_recommendations
-- Schema: public
-- Security: Invoker
--
-- Returns up to 10 recommended item IDs for a given user, based on
-- "pure" collaborative filtering: it looks at other users who share at
-- least one favorite movie/show with the current user, then recommends
-- the remaining items those similar users have favorited, ranked by how
-- many similar users favorited each item (similarity_weight), excluding
-- anything the current user already has.
--
-- Called from: src/components/RecommendationsRow.tsx via
--   supabase.rpc('get_pure_collaborative_recommendations', {
--     current_user_uuid: userId,
--     target_media_type: mediaType
--   })

CREATE OR REPLACE FUNCTION public.get_pure_collaborative_recommendations(
  current_user_uuid uuid,
  target_media_type text
)
RETURNS TABLE(media_id integer)
LANGUAGE plpgsql
AS $$
DECLARE
    current_user_favorites integer[];
BEGIN
    -- 1. Μαζεύουμε όλα τα αγαπημένα του τρέχοντος χρήστη (ταινίες ή σειρές)
    IF target_media_type = 'movie' THEN
        SELECT favorite_movies INTO current_user_favorites FROM public.profiles WHERE id = current_user_uuid;
    ELSE
        SELECT favorite_shows INTO current_user_favorites FROM public.profiles WHERE id = current_user_uuid;
    END IF;

    -- Αν η λίστα είναι NULL, τη μετατρέπουμε σε άδειο πίνακα για ασφάλεια
    IF current_user_favorites IS NULL THEN
        current_user_favorites := '{}'::integer[];
    END IF;

    -- 2. Collaborative Filtering: Εύρεση προτάσεων βάσει κοινών προτιμήσεων
    RETURN QUERY
    WITH similar_users AS (
        -- Βρίσκουμε χρήστες που έχουν τουλάχιστον 1 κοινή ταινία/σειρά με εμάς
        SELECT p.id AS other_user_id, COUNT(*) AS similarity_weight
        FROM public.profiles p
        CROSS JOIN unnest(CASE WHEN target_media_type = 'movie' THEN p.favorite_movies ELSE p.favorite_shows END) AS shared_id
        WHERE p.id <> current_user_uuid -- Εξαιρούμε τον εαυτό μας
          AND shared_id = ANY(current_user_favorites)
        GROUP BY p.id
    ),
    recommended_pool AS (
        -- Μαζεύουμε τις υπόλοιπες ταινίες/σειρές που έχουν αυτοί οι παρόμοιοι χρήστες
        SELECT unnest(CASE WHEN target_media_type = 'movie' THEN p.favorite_movies ELSE p.favorite_shows END) AS item_id,
               s.similarity_weight
        FROM public.profiles p
        JOIN similar_users s ON p.id = s.other_user_id
    )
    -- Ταξινομούμε τις προτάσεις: όσες εμφανίζονται συχνότερα σε χρήστες με μεγαλύτερο similarity_weight βγαίνουν πρώτες
    SELECT r.item_id
    FROM recommended_pool r
    WHERE NOT (r.item_id = ANY(current_user_favorites)) -- Φιλτράρισμα: Αφαιρούμε όσα έχει ήδη ο χρήστης
    GROUP BY r.item_id
    ORDER BY SUM(r.similarity_weight) DESC, r.item_id DESC
    LIMIT 10;
END;
$$;
