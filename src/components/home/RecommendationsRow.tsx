// src/components/home/RecommendationsRow.tsx
import React, { useEffect, useState } from 'react';
import { type DataTypes } from '../../modules/types_files';
import noImage from '../../assets/noImage.jpg';
import styles from './RecommendationsRow.module.css';
import { supabase } from '../../modules/supabaseClient';
import { buildRecommendations } from '../../modules/recommender/recommendationEngine';

interface RecommendationsRowProps {
  mediaType: 'movie' | 'tv';
  itemHeading: string;
  handleMovieClick: (id: number) => void;
}

const RecommendationsRow: React.FC<RecommendationsRowProps> = ({
  mediaType,
  itemHeading,
  handleMovieClick,
}) => {
  const [recommendations, setRecommendations] = useState<DataTypes[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const user = session?.user;

        if (!user) {
          if (isMounted) setIsLoading(false);
          return;
        }

        // The whole hybrid pipeline lives in recommendationEngine.ts (shared with the admin XAI view)
        const { items } = await buildRecommendations(user.id, mediaType);

        if (isMounted) setRecommendations(items.map((recommended) => recommended.item));
      } catch (err) {
        console.error('Error loading recommendations:', err);
        if (isMounted) setError('Unable to load recommendations right now.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [mediaType]);

  // If something actually failed, show a small message instead of an empty gap
  if (!isLoading && error) {
    return (
      <div className={styles.categoryContainer}>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    );
  }

  if (isLoading || recommendations.length === 0) {
    return null;
  }

  return (
    <div className={styles.categoryContainer}>
      <div className={styles.headingWrapper}>
        <h1 className={styles.categoryTitle}>{itemHeading}</h1>
      </div>
      <div className={styles.moviesGrid}>
        {recommendations.map((item) => {
          const rating = item.vote_average ? item.vote_average.toFixed(1) : null;

          return (
            <div
              key={`${mediaType}-${item.id}`}
              className={styles.movieCard}
              onClick={() => handleMovieClick(item.id)}
            >
              <img
                src={
                  item.poster_path
                    ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
                    : noImage
                }
                alt={item.title || item.name || 'Poster'}
                className={styles.posterImg}
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.src = noImage;
                }}
              />
              {rating && <div className={styles.ratingBadge}>{rating}</div>}
              <div className={styles.titlePadding}>
                <div className={`${styles.namePadding} ${styles.textBoldxl}`}>
                  {item.title || item.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationsRow;
