-- View: public.admin_user_analytics (read by the admin dashboard)
-- Note: a view runs with its owner's rights and ignores RLS, so direct access is revoked in
-- admin_security_hardening.sql and the data is served by get_admin_user_analytics() (admin only).

CREATE OR REPLACE VIEW public.admin_user_analytics AS
WITH user_comments AS (
         SELECT comments.user_id,
            count(comments.id) AS total_comments,
            round(avg(comments.rating), 2) AS avg_rating_given
           FROM comments
          GROUP BY comments.user_id
        ), user_watchlist AS (
         SELECT watchlist.user_id,
            count(watchlist.id) AS total_watchlist,
            count(
                CASE
                    WHEN watchlist.status = 'watched'::text THEN 1
                    ELSE NULL::integer
                END) AS total_watched
           FROM watchlist
          GROUP BY watchlist.user_id
        )
 SELECT p.id AS user_id,
    COALESCE(p.role, 'user'::text) AS role,
    COALESCE(c.total_comments, 0::bigint) AS total_comments,
    COALESCE(c.avg_rating_given, 0::numeric) AS avg_rating_given,
    COALESCE(w.total_watchlist, 0::bigint) AS total_watchlist,
    COALESCE(w.total_watched, 0::bigint) AS total_watched,
    COALESCE(c.total_comments, 0::bigint) * 3 + COALESCE(w.total_watched, 0::bigint) * 2 AS user_activity_score
   FROM profiles p
     LEFT JOIN user_comments c ON p.id = c.user_id
     LEFT JOIN user_watchlist w ON p.id = w.user_id
  ORDER BY (COALESCE(c.total_comments, 0::bigint) * 3 + COALESCE(w.total_watched, 0::bigint) * 2) DESC;
