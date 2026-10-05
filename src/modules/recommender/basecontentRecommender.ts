// src/modules/recommender/basecontentRecommender.ts
import { type DataTypes } from '../types_files';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Fetches content-based recommendations from the TMDB /recommendations endpoint.
 * Uses the user's latest favorite of the requested media type as the seed
 * (favorites are synced automatically by the sync_favorite_media trigger).
 *
 * @param favoriteMovieIds Array of movie IDs from profile.favorite_movies.
 * @param favoriteTvIds Array of TV IDs from profile.favorite_shows.
 * @param mediaType Which row is being built ('movie' or 'tv').
 * @param apiKey The TMDB API key.
 * @returns Array of candidate recommendations.
 */
export const fetchContentBasedRecs = async (
  favoriteMovieIds: number[] = [],
  favoriteTvIds: number[] = [],
  mediaType: 'movie' | 'tv',
  apiKey: string
): Promise<DataTypes[]> => {
  try {
    // Seed from the same media type as the row, so the TV row gets TV recommendations
    const favorites = mediaType === 'movie' ? favoriteMovieIds : favoriteTvIds;
    const seedId: number | null =
      favorites && favorites.length > 0 ? favorites[favorites.length - 1] : null;

    // Return an empty array if the user has no favorites yet
    if (!seedId) return [];

    // Query TMDB recommendations endpoint for the seed title
    const res = await fetch(
      `${TMDB_BASE_URL}/${mediaType}/${seedId}/recommendations?api_key=${apiKey}&language=en-US&page=1`
    );

    if (!res.ok) return [];

    const data = await res.json();
    return ((data.results || []) as DataTypes[]).map((item: DataTypes) => ({
      ...item,
      media_type: item.media_type || mediaType,
    }));
  } catch (err) {
    console.error('Error in fetchContentBasedRecs:', err);
    return [];
  }
};