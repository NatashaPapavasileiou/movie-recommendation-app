// src/modules/recommender/watchlistService.ts
import { supabase } from '../supabaseClient';
import { type DataTypes } from '../types_files';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Fetches the user's 3 most recent 'to_watch' items from the watchlist.
 * If the watchlist is empty, falls back to favorite movies and shows from onboarding setup.
 *
 * @param userId The current user's UUID.
 * @param favoriteMovieIds Array of movie IDs from profile.favorite_movies.
 * @param favoriteTvIds Array of TV IDs from profile.favorite_shows.
 * @param apiKey The TMDB API key.
 * @returns Array of hydrated media items (up to 3).
 */
export const fetchWatchlistOrSetup = async (
  userId: string,
  favoriteMovieIds: number[] = [],
  favoriteTvIds: number[] = [],
  apiKey: string
): Promise<DataTypes[]> => {
  try {
    // 1. Fetch latest 'to_watch' entries from watchlist
    const { data: watchlist, error } = await supabase
      .from('watchlist')
      .select('movie_id, media_type')
      .eq('user_id', userId)
      .eq('status', 'to_watch')
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) throw error;

    let targetItems: { id: number; media_type: string }[] = [];

    if (watchlist && watchlist.length > 0) {
      targetItems = watchlist.map((item) => ({
        id: item.movie_id,
        media_type: item.media_type || 'movie',
      }));
    } else {
      // Fallback: Combine 2 movies and 1 show from user favorites
      const fallbackMovies = (favoriteMovieIds || []).slice(0, 2).map((id) => ({
        id,
        media_type: 'movie',
      }));
      const fallbackTv = (favoriteTvIds || []).slice(0, 1).map((id) => ({
        id,
        media_type: 'tv',
      }));

      targetItems = [...fallbackMovies, ...fallbackTv];
    }

    if (targetItems.length === 0) return [];

    // 2. Hydrate metadata from TMDB
    const detailedPromises = targetItems.map(async ({ id, media_type }) => {
      const res = await fetch(`${TMDB_BASE_URL}/${media_type}/${id}?api_key=${apiKey}&language=en-US`);
      if (!res.ok) return null;
      const data = await res.json();
      return { ...data, media_type } as DataTypes;
    });

    const results = await Promise.all(detailedPromises);
    return results.filter((item): item is DataTypes => Boolean(item));
  } catch (err) {
    console.error('Error in fetchWatchlistOrSetup:', err);
    return [];
  }
};