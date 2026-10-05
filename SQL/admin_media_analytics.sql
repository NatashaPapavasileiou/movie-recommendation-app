-- View: public.admin_media_analytics (read by the admin dashboard)
-- Note: a view runs with its owner's rights and ignores RLS, so direct access is revoked in
-- admin_security_hardening.sql and the data is served by get_admin_media_analytics() (admin only).

CREATE OR REPLACE VIEW public.admin_media_analytics AS
WITH comment_stats AS (
         SELECT c_1.movie_id,
            c_1.media_type,
            count(c_1.id) AS total_comments,
            round(avg(c_1.rating), 2) AS avg_user_rating,
            max(c_1.created_at) AS last_interaction_at
           FROM comments c_1
          GROUP BY c_1.movie_id, c_1.media_type
        ), watchlist_stats AS (
         SELECT w_1.movie_id,
            w_1.media_type,
            count(w_1.id) AS watchlist_adds,
            count(
                CASE
                    WHEN w_1.status = 'watched'::text THEN 1
                    ELSE NULL::integer
                END) AS watched_count
           FROM watchlist w_1
          GROUP BY w_1.movie_id, w_1.media_type
        )
 SELECT COALESCE(c.movie_id, w.movie_id::bigint) AS media_id,
    COALESCE(c.media_type, w.media_type, 'movie'::text) AS media_type,
    COALESCE(c.total_comments, 0::bigint) AS comments_count,
    COALESCE(c.avg_user_rating, 0::numeric) AS average_rating,
    COALESCE(w.watchlist_adds, 0::bigint) AS watchlist_count,
    COALESCE(w.watched_count, 0::bigint) AS total_watched,
    COALESCE(c.total_comments, 0::bigint) * 2 + COALESCE(w.watchlist_adds, 0::bigint) + COALESCE(w.watched_count, 0::bigint) * 3 AS engagement_score,
    c.last_interaction_at
   FROM comment_stats c
     FULL JOIN watchlist_stats w ON c.movie_id = w.movie_id AND c.media_type = w.media_type
  ORDER BY (COALESCE(c.total_comments, 0::bigint) * 2 + COALESCE(w.watchlist_adds, 0::bigint) + COALESCE(w.watched_count, 0::bigint) * 3) DESC;
