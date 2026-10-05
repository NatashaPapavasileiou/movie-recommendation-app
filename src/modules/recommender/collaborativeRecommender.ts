// src/modules/recommender/collaborativeRecommender.ts
import { supabase } from '../supabaseClient';
import { type DataTypes } from '../types_files';

export async function fetchCollaborativeRecs(
  userId: string,
  mediaType: 'movie' | 'tv',
  apiKey: string
): Promise<DataTypes[]> {
  try {
    // Call the RPC using the exact argument names defined in the SQL function
    const { data, error } = await supabase.rpc('get_pure_collaborative_recommendations', {
      current_user_uuid: userId,
      target_media_type: mediaType,
    });

    if (error) {
      console.error('Collaborative RPC error:', error);
      return [];
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }

    // The RPC returns TABLE(media_id integer), i.e. an array of { media_id: number }
    const ids: number[] = data.map((row: { media_id: number }) => row.media_id);

    // Fetch TMDB details (poster, title, rating) for each recommended ID
    const promises = ids.slice(0, 10).map(async (id) => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${apiKey}&language=en-US`
        );
        if (!res.ok) return null;
        const details = await res.json();
        return {
          ...details,
          media_type: mediaType,
        } as DataTypes;
      } catch {
        return null;
      }
    });

    const results = await Promise.all(promises);
    return results.filter((item): item is DataTypes => item !== null);
  } catch (err) {
    console.error('Failed to fetch collaborative recs:', err);
    return [];
  }
}