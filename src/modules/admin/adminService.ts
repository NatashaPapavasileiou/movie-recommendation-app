// src/modules/admin/adminService.ts
import { supabase } from '../supabaseClient';
import { apiKey, baseUrl } from '../ApiLinks';
import {
  buildRecommendations,
  RECOMMENDATION_SOURCES,
  type RecommendationSource,
  type RecommendedItem,
} from '../recommender/recommendationEngine';
import { genreName } from '../recommender/genres';

/* =========================================================
   1. TYPES & INTERFACES
   ========================================================= */

export interface SecurityAuditLog {
  id: string;
  user_id: string | null;
  event_type: string;
  severity: 'info' | 'warning' | 'critical';
  user_agent: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface DayMetric {
  dayLabel: string;
  count: number;
}

export interface SecuritySummary {
  totalEvents: number;
  criticalAlerts: number;
  warningAlerts: number;
  last7DaysCount: number;
  dailyDistribution: DayMetric[];
  recentLogs: SecurityAuditLog[];
}

export interface MediaAnalyticsItem {
  media_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  comments_count: number;
  average_rating: number;
  watchlist_count: number;
  total_watched: number;
  engagement_score: number;
  last_interaction_at: string | null;
}

export interface UserAnalyticsItem {
  user_id: string;
  role: string;
  total_comments: number;
  avg_rating_given: number;
  total_watchlist: number;
  total_watched: number;
  user_activity_score: number;
}

// One reason why a title was recommended (one per source that returned it)
export interface RecommendationReason {
  source: RecommendationSource;
  label: string;
  detail: string;
}

export interface ExplainedMediaItem {
  id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  vote_average: number;
  // The source that placed the title in the user's row
  source: RecommendationSource;
  reasons: RecommendationReason[];
}

// Share of the final list produced by one source (real counts, not estimated weights)
export interface SourceShare {
  source: RecommendationSource;
  label: string;
  count: number;
  percentage: number;
}

export interface UserSignalsSummary {
  favoriteMoviesCount: number;
  favoriteShowsCount: number;
  genreNames: string[];
  excludedCount: number;
  contentSeedTitle: string | null;
  // True when no personal source returned anything, so only fallbacks were used
  isColdStart: boolean;
  poolSizes: Record<RecommendationSource, number>;
}

export interface ExplainedRecommendations {
  items: ExplainedMediaItem[];
  composition: SourceShare[];
  signals: UserSignalsSummary;
}

export interface UserAdminSummary {
  userId: string;
  role: string;
  favoriteMoviesCount: number;
  favoriteShowsCount: number;
  favoriteGenresCount: number;
}

/* =========================================================
   2. SECURITY TELEMETRY FUNCTIONS
   ========================================================= */

/**
 * Dispatches an audit event directly to Supabase security_audit_logs.
 */
export async function logSecurityEvent(
  eventType: string,
  severity: 'info' | 'warning' | 'critical' = 'info',
  details: Record<string, unknown> = {}
): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from('security_audit_logs').insert({
      user_id: user?.id || null,
      event_type: eventType,
      severity,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      details,
    });
  } catch (err) {
    console.error('Failed to log security event:', err);
  }
}

/**
 * Fetches recent audit logs and calculates 7-day rolling window statistics.
 */
export async function fetchSecurityLogs(timeRangeDays: number = 7): Promise<SecuritySummary> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeRangeDays);

  // count: 'exact' returns the real all-time total, even though only the latest 100 rows are loaded
  const { data: logs, error, count } = await supabase
    .from('security_audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(100);

  if (error || !logs) {
    console.error('Error fetching logs:', error);
    return {
      totalEvents: 0,
      criticalAlerts: 0,
      warningAlerts: 0,
      last7DaysCount: 0,
      dailyDistribution: [],
      recentLogs: [],
    };
  }

  const recentInWindow = logs.filter((l) => new Date(l.created_at) >= cutoffDate);
  const critical = recentInWindow.filter((l) => l.severity === 'critical').length;
  const warnings = recentInWindow.filter((l) => l.severity === 'warning').length;

  // Build daily distribution buckets for the last 7 days
  const daysMap = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    daysMap.set(key, 0);
  }

  logs.forEach((log) => {
    const logDate = new Date(log.created_at);
    const key = logDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (daysMap.has(key)) {
      daysMap.set(key, (daysMap.get(key) || 0) + 1);
    }
  });

  const dailyDistribution: DayMetric[] = Array.from(daysMap.entries()).map(([dayLabel, count]) => ({
    dayLabel,
    count,
  }));

  return {
    totalEvents: count ?? logs.length,
    criticalAlerts: critical,
    warningAlerts: warnings,
    last7DaysCount: recentInWindow.length,
    dailyDistribution,
    recentLogs: logs as SecurityAuditLog[],
  };
}

/* =========================================================
   3. MEDIA & USER ANALYTICS
   ========================================================= */

export async function fetchMediaEngagementData(): Promise<MediaAnalyticsItem[]> {
  // Admin-checked RPC (see SQL/admin_security_hardening.sql); the view itself is not readable by users
  const { data, error } = await supabase.rpc('get_admin_media_analytics').limit(15);
  if (error || !data) return [];

  // Rows of the admin_media_analytics view, before the TMDB title/poster are added
  const rows = data as Omit<MediaAnalyticsItem, 'title' | 'poster_path'>[];

  return Promise.all(
    rows.map(async (row) => {
      try {
        const res = await fetch(`${baseUrl}/${row.media_type}/${row.media_id}?api_key=${apiKey}&language=en-US`);
        const tmdbData = await res.json();
        return {
          ...row,
          title: tmdbData.title || tmdbData.name || `ID #${row.media_id}`,
          poster_path: tmdbData.poster_path || null,
        };
      } catch {
        return {
          ...row,
          title: `ID #${row.media_id}`,
          poster_path: null,
        };
      }
    })
  );
}

export async function fetchUserEngagementData(): Promise<UserAnalyticsItem[]> {
  // Admin-checked RPC (see SQL/admin_security_hardening.sql); the view itself is not readable by users
  const { data, error } = await supabase.rpc('get_admin_user_analytics').limit(15);
  if (error || !data) return [];
  return data as UserAnalyticsItem[];
}

/* =========================================================
   4. RECOMMENDATION EXPLAINABILITY (XAI)
   ========================================================= */

export async function fetchUsersForInspection(): Promise<UserAdminSummary[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, favorite_movies, favorite_shows, favorite_genres')
    .limit(30);

  if (error || !data) return [];

  return data.map((p) => ({
    userId: p.id,
    role: p.role || 'user',
    favoriteMoviesCount: Array.isArray(p.favorite_movies) ? p.favorite_movies.length : 0,
    favoriteShowsCount: Array.isArray(p.favorite_shows) ? p.favorite_shows.length : 0,
    favoriteGenresCount: Array.isArray(p.favorite_genres) ? p.favorite_genres.length : 0,
  }));
}

export const SOURCE_LABELS: Record<RecommendationSource, string> = {
  watchlist: 'Watchlist & onboarding',
  content: 'Content-based similarity',
  collaborative: 'Collaborative filtering',
  genre: 'Favorite genre discovery',
  genreFallback: 'Genre fallback',
  trending: 'Trending fallback',
};

// Fetches the title of a TMDB item (used to name the content-based seed)
async function fetchTitle(mediaType: 'movie' | 'tv', id: number): Promise<string | null> {
  try {
    const res = await fetch(`${baseUrl}/${mediaType}/${id}?api_key=${apiKey}&language=en-US`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.title || data.name || null;
  } catch {
    return null;
  }
}

/**
 * Explains the recommendation row of one user: runs the SAME engine as the home page
 * (buildRecommendations) and describes, for every title, which source placed it and why.
 *
 * The chart percentages are the real share of the final list produced by each source.
 * Note: RLS hides other users' watchlist rows from the admin, so the admin view can differ
 * slightly from the user's own row in the watchlist source and in the watched-exclusions.
 */
export async function fetchRealExplainedRecommendations(
  userId: string,
  mediaType: 'movie' | 'tv' = 'movie'
): Promise<ExplainedRecommendations> {
  const { items, signals } = await buildRecommendations(userId, mediaType);

  const contentSeedTitle = signals.contentSeedId
    ? await fetchTitle(mediaType, signals.contentSeedId)
    : null;
  const genreNames = signals.rowGenres.map(genreName);
  const typeWord = mediaType === 'movie' ? 'movie' : 'show';

  const describe = (source: RecommendationSource, rec: RecommendedItem): string => {
    switch (source) {
      case 'watchlist':
        return `In the user's To-Watch list, or one of their onboarding / highly rated picks.`;
      case 'content':
        return `TMDB lists it as similar to "${contentSeedTitle || `#${signals.contentSeedId}`}", the user's latest favorite ${typeWord}.`;
      case 'collaborative':
        return `Favorited by other users who share at least one favorite with this user (rank ${rec.rankInSource} in the collaborative list).`;
      case 'genre':
        return `One of the top-rated ${typeWord}s in ${genreNames[0] || 'the user\'s main genre'}.`;
      case 'genreFallback':
        return `Fallback: highly rated in the user's genres (${genreNames.slice(0, 3).join(', ') || 'any genre'}), because the personal sources returned fewer than 12 titles.`;
      case 'trending':
        return `Fallback: trending on TMDB this week. Used when there is not enough personal data (cold start).`;
    }
  };

  const explained: ExplainedMediaItem[] = items.map((rec) => ({
    id: rec.item.id,
    media_type: mediaType,
    title: rec.item.title || rec.item.name || `Title #${rec.item.id}`,
    poster_path: rec.item.poster_path || null,
    vote_average: rec.item.vote_average ? Number(rec.item.vote_average.toFixed(1)) : 0,
    source: rec.source,
    // Placing source first, then any other source that also returned the title
    reasons: [rec.source, ...rec.foundIn.filter((s) => s !== rec.source)].map((source) => ({
      source,
      label: SOURCE_LABELS[source],
      detail: describe(source, rec),
    })),
  }));

  const total = explained.length || 1;
  const composition: SourceShare[] = RECOMMENDATION_SOURCES.map((source) => {
    const count = explained.filter((e) => e.source === source).length;
    return { source, label: SOURCE_LABELS[source], count, percentage: Math.round((count / total) * 100) };
  }).filter((share) => share.count > 0);

  const personalSources: RecommendationSource[] = ['watchlist', 'content', 'collaborative', 'genre'];

  return {
    items: explained,
    composition,
    signals: {
      favoriteMoviesCount: signals.favoriteMovies.length,
      favoriteShowsCount: signals.favoriteShows.length,
      genreNames,
      excludedCount: signals.excludedCount,
      contentSeedTitle,
      isColdStart: personalSources.every((s) => signals.poolSizes[s] === 0),
      poolSizes: signals.poolSizes,
    },
  };
}
