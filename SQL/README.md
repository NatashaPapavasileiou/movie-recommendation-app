# SQL — Supabase database objects

Everything the app relies on in Supabase (PostgreSQL), exported from the live project so the
backend can be reviewed and rebuilt. Run order for a fresh project:

| # | File | What it is |
|---|------|------------|
| 1 | `tables.sql` | `profiles`, `comments` (reviews), `watchlist`, `security_audit_logs` |
| 2 | `handle_new_user.sql` | Trigger function + trigger on `auth.users`: creates the profile row at sign-up |
| 3 | `sync_favorite_media.sql` | Trigger function + trigger on `comments`: rating >= 7 adds the title to the favorites |
| 4 | `sync_watchlist_to_profiles.sql` | Trigger function + trigger on `watchlist`: copies 'to_watch' titles to the profile |
| 5 | `get_pure_collaborative_recommendations.sql` | RPC used by collaborative filtering |
| 6 | `admin_media_analytics.sql`, `admin_user_analytics.sql` | Views behind the admin dashboard |
| 7 | `policies.sql` | Row Level Security policies |
| 8 | `admin_security_hardening.sql` | Role-escalation guard, audit-log RLS, admin-only access to the views |

Notes
- `profiles.favorite_movie_genres` and `profiles.favorite_tv_genres` exist but are not used by the
  app; onboarding stores movie genre IDs in `favorite_genres`, and the TV genres are derived in
  `src/modules/genreAnalytics.ts` (`toTvGenreIds`).
- `comments` is readable by everyone (policy "Anyone can read reviews"), including the
  `user_email` column.
- The previously documented `get_hybrid_recommendations` function no longer exists in the database.
