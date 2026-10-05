-- Function: public.get_pure_collaborative_recommendations(current_user_uuid uuid, target_media_type text)
-- Returns: TABLE(media_id integer), at most 10 rows
-- Security: INVOKER (runs with the caller's rights, so RLS on profiles applies; the
--   "Authenticated users can view all profiles" policy is what lets it read other users' favorites)
--
-- "Pure" user-based collaborative filtering on the favorites arrays of public.profiles:
--   1. similar users = users sharing at least one favorite with the current user,
--      similarity_weight = number of shared favorites;
--   2. candidates = all favorites of those users, minus the current user's own favorites;
--   3. ranked by SUM(similarity_weight) DESC, then item_id DESC.
--
-- Called from: src/modules/collaborativeRecommender.ts
--   supabase.rpc('get_pure_collaborative_recommendations', { current_user_uuid, target_media_type })

CREATE OR REPLACE FUNCTION public.get_pure_collaborative_recommendations(current_user_uuid uuid, target_media_type text)
 RETURNS TABLE(media_id integer)
 LANGUAGE plpgsql
AS $function$
DECLARE
    current_user_favorites integer[];
BEGIN
    -- 1. Collect the current user's favorites (movies or shows, depending on target_media_type)
    IF target_media_type = 'movie' THEN
        SELECT favorite_movies INTO current_user_favorites FROM public.profiles WHERE id = current_user_uuid;
    ELSE
        SELECT favorite_shows INTO current_user_favorites FROM public.profiles WHERE id = current_user_uuid;
    END IF;

    -- Treat a NULL favorites list as an empty array
    IF current_user_favorites IS NULL THEN
        current_user_favorites := '{}'::integer[];
    END IF;

    -- 2. Collaborative filtering: recommendations based on shared favorites
    RETURN QUERY
    WITH similar_users AS (
        -- Users who share at least one favorite with the current user; the number of shared favorites is their similarity_weight
        SELECT p.id AS other_user_id, COUNT(*) AS similarity_weight
        FROM public.profiles p
        CROSS JOIN unnest(CASE WHEN target_media_type = 'movie' THEN p.favorite_movies ELSE p.favorite_shows END) AS shared_id
        WHERE p.id <> current_user_uuid -- Exclude the current user
          AND shared_id = ANY(current_user_favorites)
        GROUP BY p.id
    ),
    recommended_pool AS (
        -- Every favorite of those similar users, carrying the user's similarity_weight
        SELECT unnest(CASE WHEN target_media_type = 'movie' THEN p.favorite_movies ELSE p.favorite_shows END) AS item_id,
               s.similarity_weight
        FROM public.profiles p
        JOIN similar_users s ON p.id = s.other_user_id
    )
    -- Rank by the summed similarity_weight: titles favorited by more, and more similar, users come first
    SELECT r.item_id
    FROM recommended_pool r
    WHERE NOT (r.item_id = ANY(current_user_favorites)) -- Remove titles the user already has as favorites
    GROUP BY r.item_id
    ORDER BY SUM(r.similarity_weight) DESC, r.item_id DESC
    LIMIT 10;
END;
$function$;
