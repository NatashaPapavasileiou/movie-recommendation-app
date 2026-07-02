import noImage from "../assets/noImage.jpg";
import styles from "./Watchlist.module.css";

interface WatchlistCardProps {
  movie_id: number;
  title: string;
  poster_path: string;
  status: "to_watch" | "watched";
  onMovieClick: (id: number) => void;
  onActionClick: (e: React.MouseEvent, movieId: number, currentStatus: "to_watch" | "watched") => void;
}

const WatchlistCard: React.FC<WatchlistCardProps> = ({
  movie_id,
  title,
  poster_path,
  status,
  onMovieClick,
  onActionClick,
}) => {
  return (
    <div className={styles.movieCard} onClick={() => onMovieClick(movie_id)}>
      <div className={styles.posterWrapper}>
        <img
          src={poster_path ? `https://image.tmdb.org/t/p/w300${poster_path}` : noImage}
          alt={title}
          className={styles.posterImg}
        />
        <div className={styles.titleOverlay}>
          <h3 className={styles.movieTitle}>{title}</h3>
        </div>
      </div>
      
      <button 
        className={styles.cardActionButton}
        onClick={(e) => onActionClick(e, movie_id, status)}
      >
        {status === "to_watch" ? (
          <>MARK WATCHED <span className={styles.arrow}>→</span></>
        ) : (
          <><span className={styles.arrow}>←</span> MOVE BACK</>
        )}
      </button>
    </div>
  );
};

export default WatchlistCard;