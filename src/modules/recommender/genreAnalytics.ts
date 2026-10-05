// src/modules/recommender/genreAnalytics.ts
import { type DataTypes } from '../types_files';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// TMDB uses different genre IDs for TV. Movie genres with a TV equivalent are mapped;
// shared IDs (Animation, Comedy, Crime, Documentary, Drama, Family, Mystery, Western)
// are kept as-is; movie-only genres without a TV equivalent are dropped.
const MOVIE_TO_TV_GENRE: Record<number, number | null> = {
  28: 10759, // Action -> Action & Adventure
  12: 10759, // Adventure -> Action & Adventure
  878: 10765, // Science Fiction -> Sci-Fi & Fantasy
  14: 10765, // Fantasy -> Sci-Fi & Fantasy
  10752: 10768, // War -> War & Politics
  27: null, // Horror (no TV genre)
  53: null, // Thriller (no TV genre)
  10749: null, // Romance (no TV genre)
  36: null, // History (no TV genre)
  10402: null, // Music (no TV genre)
  10770: null, // TV Movie (no TV genre)
};

/**
 * Converts movie genre IDs (as stored in profile.favorite_genres) into valid TV genre IDs.
 */
export const toTvGenreIds = (movieGenreIds: number[] = []): number[] => {
  const mapped = movieGenreIds
    .map((id) => (id in MOVIE_TO_TV_GENRE ? MOVIE_TO_TV_GENRE[id] : id))
    .filter((id): id is number => id !== null);
  return Array.from(new Set(mapped));
};

export interface MediaItemWithGenres {
  id: number;
  genre_ids?: number[];
  genres?: { id: number; name?: string }[];
}

/**
 * Calculates the top N most frequent genre IDs from a user's favorite media list.
 * Inspects both 'genre_ids' (array of numbers) and 'genres' (array of objects).
 *
 * @param items List of movies or TV shows the user has favorited or rated positively.
 * @param limit The maximum number of top genre IDs to return (defaults to 2).
 * @returns Array of dominant genre IDs sorted in descending order of frequency.
 */
export const extractTopGenres = (
  items: MediaItemWithGenres[],
  limit: number = 2
): number[] => {
  if (!items || items.length === 0) return [];

  const genreCounts: Record<number, number> = {};

  items.forEach((item) => {
    const ids = item.genre_ids || item.genres?.map((g) => g.id) || [];
    ids.forEach((id) => {
      genreCounts[id] = (genreCounts[id] || 0) + 1;
    });
  });

  return Object.entries(genreCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, limit)
    .map(([genreId]) => Number(genreId));
};

/**
 * Fetches top-rated items based on the user's favorite genres:
 * - 2 Movies matching the top movie genre
 * - 1 TV Show matching the top TV genre
 *
 * @param favoriteMovies Hydrated movie items or items with genres.
 * @param favoriteShows Hydrated TV items or items with genres.
 * @param fallbackMovieGenres Movie genre IDs from profile.favorite_genres.
 * @param fallbackTvGenres TV genre IDs (use toTvGenreIds(profile.favorite_genres)).
 * @param apiKey TMDB API key.
 * @returns Array containing 2 movies and 1 TV show.
 */
export const fetchGenreDiscoveryRecs = async (
  favoriteMovies: MediaItemWithGenres[] = [],
  favoriteShows: MediaItemWithGenres[] = [],
  fallbackMovieGenres: number[] = [],
  fallbackTvGenres: number[] = [],
  apiKey: string
): Promise<DataTypes[]> => {
  const discovered: DataTypes[] = [];

  try {
    // 1. Resolve movie genre (dynamic first, profile fallback second)
    const movieTop = extractTopGenres(favoriteMovies, 1);
    const targetMovieGenre = movieTop.length > 0 ? movieTop[0] : fallbackMovieGenres[0];

    // 2. Resolve TV genre (dynamic first, profile fallback second)
    const tvTop = extractTopGenres(favoriteShows, 1);
    const targetTvGenre = tvTop.length > 0 ? tvTop[0] : fallbackTvGenres[0];

    // 3. Fetch 2 top-rated movies
    if (targetMovieGenre) {
      const res = await fetch(
        `${TMDB_BASE_URL}/discover/movie?api_key=${apiKey}&with_genres=${targetMovieGenre}&sort_by=vote_average.desc&vote_count.gte=300&language=en-US&page=1`
      );
      if (res.ok) {
        const data = await res.json();
        const movies = (data.results || []).slice(0, 2).map((m: DataTypes) => ({
          ...m,
          media_type: 'movie',
        }));
        discovered.push(...movies);
      }
    }

    // 4. Fetch 1 top-rated TV show
    if (targetTvGenre) {
      const res = await fetch(
        `${TMDB_BASE_URL}/discover/tv?api_key=${apiKey}&with_genres=${targetTvGenre}&sort_by=vote_average.desc&vote_count.gte=300&language=en-US&page=1`
      );
      if (res.ok) {
        const data = await res.json();
        const shows = (data.results || []).slice(0, 1).map((s: DataTypes) => ({
          ...s,
          media_type: 'tv',
        }));
        discovered.push(...shows);
      }
    }
  } catch (err) {
    console.error('Error in fetchGenreDiscoveryRecs:', err);
  }

  return discovered;
};