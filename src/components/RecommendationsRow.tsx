import React, { useEffect, useState } from "react";
import { type DataTypes } from "../modules/types_files";
import noImage from "../assets/noImage.jpg";
import styles from "./DisplayItems.module.css"; 
import { supabase } from "../modules/supabaseClient"; 
import { baseUrl, apiKey } from "../modules/ApiLinks"; 

interface RecommendationsRowProps {
  mediaType: "movie" | "tv";
  itemHeading: string;
  handleMovieClick: (id: number) => void;
}

const RecommendationsRow: React.FC<RecommendationsRowProps> = ({
  mediaType,
  itemHeading,
  handleMovieClick,
}) => {
  const [movies, setMovies] = useState<DataTypes[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getHybridRecommendations = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const userId = session.user.id;

        // 1. COLLABORATIVE FILTERING (From Supabase RPC) 
        let collaborativeItems: any[] = [];
        try {
          const { data: colabIds, error: colabError } = await supabase.rpc(
            'get_pure_collaborative_recommendations', 
            { current_user_uuid: userId, target_media_type: mediaType }
          );

          if (!colabError && colabIds && colabIds.length > 0) {
            // Fetch complete item details from TMDB for the recommended IDs
            const colabPromises = colabIds.slice(0, 4).map(async (id: any) => {
              const r = await fetch(`${baseUrl}/${mediaType}/${id}?api_key=${apiKey}&language=en-US`);
              return r.ok ? await r.json() : null;
            });
            collaborativeItems = (await Promise.all(colabPromises)).filter(Boolean);
          }
        } catch (e) {
          console.error("Error fetching collaborative data:", e);
        }

        // 2. CONTENT-BASED FILTERING (From TMDB /recommendations endpoint) 
        const { data: profile } = await supabase
          .from('profiles')
          .select('favorite_movies, favorite_shows, favorite_genres')
          .eq('id', userId)
          .single();

        const userFavorites = mediaType === 'movie' ? profile?.favorite_movies : profile?.favorite_shows;
        let contentItems: any[] = [];

        if (userFavorites && userFavorites.length > 0) {
          // Fetch official TMDB recommendations based on the user's top 3 favorites
          const tmdbRecommendationsPromises = userFavorites.slice(0, 3).map(async (id: number) => {
            try {
              const res = await fetch(`${baseUrl}/${mediaType}/${id}/recommendations?api_key=${apiKey}&language=en-US&page=1`);
              const d = await res.json();
              return d.results || [];
            } catch (e) {
              return [];
            }
          });
          const tmdbResults = await Promise.all(tmdbRecommendationsPromises);
          contentItems = tmdbResults.flat();
        }

        // Fallback: If both lists are empty, fetch top rated items based on genre or general popularity
        if (contentItems.length === 0 && collaborativeItems.length === 0) {
          const genresList = profile?.favorite_genres?.join(',') || '';
          const fallbackUrl = genresList
            ? `${baseUrl}/discover/${mediaType}?api_key=${apiKey}&with_genres=${genresList}&sort_by=popularity.desc`
            : `${baseUrl}/${mediaType}/top_rated?api_key=${apiKey}&language=en-US`;
            
          const fallbackRes = await fetch(fallbackUrl);
          const fallbackData = await fallbackRes.json();
          contentItems = fallbackData.results || [];
        }

        //  3. HYBRID BLENDING & DUPLICATE REMOVAL 
        const finalHybridList = [...collaborativeItems, ...contentItems];
        const uniqueRecommendations = finalHybridList.filter((item, index, self) =>
          index === self.findIndex((m) => m.id === item.id)
        );

        // Keep the top 7 items to perfectly fit the UI row
        setMovies(uniqueRecommendations.slice(0, 7));
      } catch (err) {
        console.error(`Error creating hybrid recommendations for ${mediaType}:`, err);
      } finally {
        setLoading(false);
      }
    };

    getHybridRecommendations();
  }, [mediaType]);

  // If loading is finished and there are no movies, do not render the row component
  if (!loading && movies.length === 0) return null;

  return (
    <div className={styles.categoryContainer}>
      <div className={styles.headingWrapper}>
        <h1 className={`${styles.categoryTitle} navbarText animatetext`}>
          {itemHeading}
        </h1>
      </div>
      <div className={styles.moviesGrid}>
        {movies.map((movie) => (
          <div
            className={styles.movieCard}
            onClick={() => handleMovieClick(movie.id)}
            key={movie.id}
          >
            <img
              src={`https://image.tmdb.org/t/p/w200/${movie.poster_path}`}
              alt={movie.title || movie.name}
              className={`${styles.posterImg} animatetext`}
              onError={(event) => {
                event.currentTarget.src = noImage;
              }}
            />
            <div className={styles.titlePadding}>
              <p className={`${styles.textBoldxl} truncate-text`}>
                {movie.title || movie.name}
              </p>
            </div>
            <p className={styles.ratingBadge}>
              {movie.vote_average ? movie.vote_average.toFixed(1) : "0.0"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationsRow;