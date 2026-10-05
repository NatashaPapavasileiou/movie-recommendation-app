-- Tables of the public schema, as exported from Supabase (columns, defaults, NOT NULL, RLS).
-- Note: the export did not include primary keys, foreign keys or indexes; check them in
-- Table Editor before using this file to rebuild the database from scratch.

CREATE TABLE IF NOT EXISTS public.comments (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  movie_id bigint NOT NULL,
  user_id uuid NOT NULL,
  user_email text,
  content text NOT NULL,
  rating integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  media_type text DEFAULT 'movie'::text
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  username text,
  has_completed_setup boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now(),
  favorite_movies integer[] DEFAULT '{}'::integer[],
  favorite_shows integer[] DEFAULT '{}'::integer[],
  watchlist_to_watch integer[] DEFAULT '{}'::integer[],
  favorite_genres integer[] DEFAULT '{}'::integer[],
  favorite_movie_genres integer[] DEFAULT '{}'::integer[],
  favorite_tv_genres integer[] DEFAULT '{}'::integer[],
  role text DEFAULT 'user'::text
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  event_type text NOT NULL,
  severity text DEFAULT 'info'::text NOT NULL,
  ip_address text,
  user_agent text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- RLS is DISABLED on security_audit_logs in the live database: see admin_security_hardening.sql

CREATE TABLE IF NOT EXISTS public.watchlist (
  id bigint DEFAULT nextval('watchlist_id_seq'::regclass) NOT NULL,
  user_id uuid NOT NULL,
  movie_id integer NOT NULL,
  title text,
  poster_path text,
  status text DEFAULT 'to_watch'::text,
  personal_review text,
  created_at timestamp with time zone DEFAULT now(),
  media_type text DEFAULT 'movie'::text
);
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
