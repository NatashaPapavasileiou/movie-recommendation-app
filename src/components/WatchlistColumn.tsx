import WatchlistCard from "./WatchlistCard";
import styles from "./Watchlist.module.css";

interface WatchlistItem {
  id: number;
  movie_id: number;
  title: string;
  poster_path: string;
  status: "to_watch" | "watched";
}

interface WatchlistColumnProps {
  title: string;
  moviesCount: number;
  movies: WatchlistItem[];
  statusType: "to_watch" | "watched";
  onMovieClick: (id: number) => void;
  onActionClick: (e: React.MouseEvent, movieId: number, currentStatus: "to_watch" | "watched") => void;
}

const WatchlistColumn: React.FC<WatchlistColumnProps> = ({
  title,
  moviesCount,
  movies,
  statusType,
  onMovieClick,
  onActionClick,
}) => {
  const filteredMovies = movies.filter((m) => m.status === statusType);

  return (
    <div className={styles.watchlistColumn}>
      <div className={styles.columnHeader}>
        <h2 className={styles.columnTitle}>{title}</h2>
        <span className={styles.moviesCounter}>{moviesCount} MOVIES</span>
      </div>
      
      <div className={styles.columnGrid}>
        {filteredMovies.length === 0 ? (
          <p className={styles.emptyColumnMessage}>No movies here</p>
        ) : (
          filteredMovies.map((movie) => (
            <WatchlistCard
              key={movie.id}
              movie_id={movie.movie_id}
              title={movie.title}
              poster_path={movie.poster_path}
              status={movie.status}
              onMovieClick={onMovieClick}
              onActionClick={onActionClick}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default WatchlistColumn;