import React from "react";
import { Check } from "lucide-react";
import styles from "./Preference.module.css";

interface Movie {
  id: number;
  title: string;
  poster_path: string;
}

interface CardProps {
  movie: Movie;
  isSelected: boolean;
  onToggle: () => void;
}

export const MoviePreferenceCard: React.FC<CardProps> = ({ movie, isSelected, onToggle }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`${styles.cardButton} ${isSelected ? styles.cardSelected : styles.cardUnselected}`}
    >
      <img
        src={`https://image.tmdb.org/t/p/w400${movie.poster_path}`}
        alt={movie.title}
        className={styles.posterImg}
        loading="lazy"
      />
      
      {isSelected && (
        <div className={styles.checkOverlay}>
          <div className={styles.checkCircle}>
            <Check className={styles.checkIcon} />
          </div>
        </div>
      )}
      
      <div className={styles.titleGradient}>
        <p className={styles.movieTitle}>{movie.title}</p>
      </div>
    </button>
  );
};