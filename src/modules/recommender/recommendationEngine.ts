// src/modules/recommender/recommendationEngine.ts
// Single entry point of the hybrid recommender. Used by the home page row (RecommendationsRow)
// and by the admin explainability tab, so both always show exactly the same list.
import { supabase } from '../supabaseClient';
import { apiKey, baseUrl } from '../ApiLinks';
import { type DataTypes } from '../types_files';
import { fetchWatchlistOrSetup } from './watchlistService';
import { fetchContentBasedRecs } from './basecontentRecommender';
import { fetchCollaborativeRecs } from './collaborativeRecommender';
import { fetchGenreDiscoveryRecs, toTvGenreIds } from './genreAnalytics';
import { blendWithProvenance, type MediaType } from './mergeRecommendations';

export const ROW_LIMIT = 12;

// Order matters: it is the pool order used by the blend (primary pools, then fallbacks)
export const RECOMMENDATION_SOURCES = [
  'watchlist',
  'content',
  'collaborative',
  'genre',
  'genreFallback',
  'trending',
] as const;

export type RecommendationSource = (typeof RECOMMENDATION_SOURCES)[number];

export interface RecommendedItem {
  item: DataTypes;
  // The source that placed the item in the final list
  source: RecommendationSource;
  // Every source whose candidate list contained the item (always includes `source`)
  foundIn: RecommendationSource[];
  // 1-based position of the item inside the list of the source that placed it
  rankInSource: number;
}

export interface RecommendationSignals {
  favoriteMovies: number[];
  favoriteShows: number[];
  movieGenres: number[];
  tvGenres: number[];
  // Genres used for this media type (movie genres, or their TV equivalents)
  rowGenres: number[];
  // IDs never recommended because the user already watched or rated them
  excludedCount: number;
  // Seed of the content-based source: the latest favorite of this media type
  contentSeedId: number | null;
  // Number of candidates each source returned before blending
  poolSizes: Record<RecommendationSource, number>;
}

export interface RecommendationResult {
  items: RecommendedItem[];
  signals: RecommendationSignals;
}

// Fetches a TMDB list endpoint and returns its results (empty list on any failure)
const fetchTmdbList = async (url: string): Promise<DataTypes[]> => {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []) as DataTypes[];
  } catch {
    return [];
  }
};

/**
 * Builds the personalised recommendation list for one user and one media type.
 *
 * 1. Reads the profile (favorites from onboarding and ratings >= 7, favorite genres).
 * 2. Excludes titles the user already watched or rated.
 * 3. Queries four sources in parallel: watchlist/onboarding, content-based (TMDB),
 *    collaborative filtering (Supabase RPC) and genre discovery (TMDB).
 * 4. Blends them fairly (3 per source) and backfills up to 12 titles.
 * 5. Only if the row is still short: top-rated titles in the user's genres, then weekly trending.
 */
export async function buildRecommendations(
  userId: string,
  mediaType: MediaType,
  limit: number = ROW_LIMIT
): Promise<RecommendationResult> {
  // 1. Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('favorite_movies, favorite_shows, favorite_genres')
    .eq('id', userId)
    .maybeSingle();

  const favoriteMovies: number[] = profile?.favorite_movies || [];
  const favoriteShows: number[] = profile?.favorite_shows || [];
  // favorite_genres holds MOVIE genre IDs, so they are converted for TV
  const movieGenres: number[] = profile?.favorite_genres || [];
  const tvGenres = toTvGenreIds(movieGenres);
  const rowGenres = mediaType === 'movie' ? movieGenres : tvGenres;
  const rowFavorites = mediaType === 'movie' ? favoriteMovies : favoriteShows;

  // 2. Already watched or rated titles
  const [watchlistWatched, userComments] = await Promise.all([
    supabase.from('watchlist').select('movie_id').eq('user_id', userId).eq('status', 'watched'),
    supabase.from('comments').select('movie_id').eq('user_id', userId),
  ]);
  const excludeIds = new Set<number>();
  ((watchlistWatched.data as { movie_id: number }[]) || []).forEach((w) => excludeIds.add(w.movie_id));
  ((userComments.data as { movie_id: number }[]) || []).forEach((c) => excludeIds.add(c.movie_id));

  // 3. The four primary sources, in parallel
  const primaryPools = await Promise.all([
    fetchWatchlistOrSetup(userId, favoriteMovies, favoriteShows, apiKey).catch(() => []),
    fetchContentBasedRecs(favoriteMovies, favoriteShows, mediaType, apiKey).catch(() => []),
    fetchCollaborativeRecs(userId, mediaType, apiKey).catch(() => []),
    fetchGenreDiscoveryRecs(
      favoriteMovies.map((id) => ({ id })),
      favoriteShows.map((id) => ({ id })),
      movieGenres,
      tvGenres,
      apiKey
    ).catch(() => []),
  ]);

  const blendOptions = { mediaType, excludeIds, limit };

  // 4. Fair-share blend + backfill
  let fallbackPools: DataTypes[][] = [[], []];
  let blended = blendWithProvenance(primaryPools, [], blendOptions);

  // 5. Fallbacks ("|" means OR in TMDB's with_genres)
  if (blended.length < limit) {
    const genreQuery = rowGenres.length > 0 ? `&with_genres=${rowGenres.slice(0, 3).join('|')}` : '';
    const [genreFallback, trendingFallback] = await Promise.all([
      fetchTmdbList(
        `${baseUrl}/discover/${mediaType}?api_key=${apiKey}&language=en-US&sort_by=vote_average.desc&vote_count.gte=200${genreQuery}&page=1`
      ),
      fetchTmdbList(`${baseUrl}/trending/${mediaType}/week?api_key=${apiKey}`),
    ]);
    // Discover/trending endpoints are already media-type specific
    const tag = (list: DataTypes[]) => list.map((item) => ({ ...item, media_type: mediaType }));
    fallbackPools = [tag(genreFallback), tag(trendingFallback)];
    blended = blendWithProvenance(primaryPools, fallbackPools, blendOptions);
  }

  const allPools = [...primaryPools, ...fallbackPools];

  const items: RecommendedItem[] = blended.map(({ item, poolIndex }) => ({
    item,
    source: RECOMMENDATION_SOURCES[poolIndex],
    foundIn: RECOMMENDATION_SOURCES.filter((_, i) => allPools[i].some((c) => c.id === item.id)),
    rankInSource: allPools[poolIndex].findIndex((c) => c.id === item.id) + 1,
  }));

  const poolSizes = Object.fromEntries(
    RECOMMENDATION_SOURCES.map((source, i) => [source, allPools[i].length])
  ) as Record<RecommendationSource, number>;

  return {
    items,
    signals: {
      favoriteMovies,
      favoriteShows,
      movieGenres,
      tvGenres,
      rowGenres,
      excludedCount: excludeIds.size,
      contentSeedId: rowFavorites.length > 0 ? rowFavorites[rowFavorites.length - 1] : null,
      poolSizes,
    },
  };
}
