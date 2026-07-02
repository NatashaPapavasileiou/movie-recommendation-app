import { useState, useEffect } from "react";
import { baseUrl, apiKey } from "../modules/ApiLinks";
import { getFormattedDate } from "../modules/types_files";
import noImage from "../assets/noImage.jpg";
import axios from "axios";
import styles from "./MovieOverlay.module.css"; 
import { CommentForm } from "./CommentForm";
import { supabase } from "../modules/supabaseClient";
import { Comments } from "./Comments"; 

interface MovieDetails {
  id: number;
  title: string;
  backdrop_path: string;
  poster_path: string;
  overview: string;
  release_date: string;
  genres: { id: number; name: string }[];
  runtime: number;
  vote_average: number;
  tagline: string;
}

interface CastMember {
  id: number;
  name: string;
  profile_path: string | null;
  character: string;
}

interface MovieCreditResponse {
  cast: CastMember[];
  crew: { id: number; name: string; job: string }[];
}

interface SimilarMovie {
  id: number;
  title: string;
  poster_path: string;
}

interface Trailer {
  id: string;
  key: string;
  name: string;
  type: string;
}

interface MovieOverlayProps {
  movieId: number | null;
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  onMovieSelect: (id: number) => void;
}

const MovieOverlay: React.FC<MovieOverlayProps> = ({
  movieId,
  isOpen,
  onClose,
  isLoggedIn,
  onMovieSelect,
}) => {
  const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);
  const [movieCredits, setMovieCredits] = useState<CastMember[]>([]);
  const [similarMovies, setSimilarMovies] = useState<SimilarMovie[]>([]);
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [isCommentFormOpen, setIsCommentFormOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  const fetchComments = async () => {
    if (!movieId) return;
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("movie_id", movieId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setComments(data);
    }
  };

  const checkWatchlistStatus = async (id: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("watchlist")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("movie_id", id)
      .eq("media_type", "movie");

    if (!error && data && data.length > 0) {
      setIsInWatchlist(true);
    } else {
      setIsInWatchlist(false);
    }
  };

  useEffect(() => {
    if (!movieId || !isOpen) return;

    setMovieDetails(null);
    setMovieCredits([]);
    setSimilarMovies([]);
    setTrailers([]);
    setComments([]);
    setIsInWatchlist(false);

    const fetchMovieDetails = async () => {
      try {
        const [detailsRes, creditsRes, similarRes, trailersRes] =
          await Promise.all([
            axios.get(`${baseUrl}/movie/${movieId}?api_key=${apiKey}`),
            axios.get(`${baseUrl}/movie/${movieId}/credits?api_key=${apiKey}`),
            axios.get(`${baseUrl}/movie/${movieId}/similar?api_key=${apiKey}`),
            axios.get(`${baseUrl}/movie/${movieId}/videos?api_key=${apiKey}`),
          ]);

        const detailsData: MovieDetails = detailsRes.data;
        const creditsData: MovieCreditResponse = creditsRes.data;
        const similarData: { results: SimilarMovie[] } = similarRes.data;
        const trailersData: { results: Trailer[] } = trailersRes.data;

        setMovieDetails(detailsData);
        setMovieCredits(creditsData.cast);
        setSimilarMovies(similarData.results);
        setTrailers(
          trailersData.results.filter((video: any) => video.type === "Trailer")
        );
      } catch (error) {
        console.error("Error fetching movie data:", error);
      }
    };

    fetchMovieDetails();
    fetchComments();
    checkWatchlistStatus(movieId);
  }, [movieId, isOpen]);

  const handleAddToWatchlist = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("You must be logged in to manage your watchlist!");
        return;
      }
      if (!movieDetails) return;

      if (isInWatchlist) {
        const { error } = await supabase
          .from("watchlist")
          .delete()
          .eq("user_id", session.user.id)
          .eq("movie_id", movieDetails.id)
          .eq("media_type", "movie");

        if (error) throw error;
        setIsInWatchlist(false);
        alert("Removed from Watchlist!");
      } else {
        const { error } = await supabase.from("watchlist").insert([
          {
            user_id: session.user.id,
            movie_id: movieDetails.id,
            title: movieDetails.title,
            poster_path: movieDetails.poster_path,
            status: "to_watch",
            media_type: "movie"
          }
        ]);

        if (error) throw error;
        setIsInWatchlist(true);
        alert("Added to Watchlist! 🍿");
      }
    } catch (error: any) {
      console.error(error.message);
    }
  };

  const handleReviewSubmit = async (text: string, rating: number, id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error: commentError } = await supabase.from("comments").insert([
        {
          movie_id: parseInt(id),
          user_id: session.user.id,
          user_email: session.user.email,
          content: text,
          rating: rating,
          media_type: "movie",
        }
      ]);

      if (commentError) throw commentError;

      const { error: watchlistError } = await supabase.from("watchlist").upsert([
        {
          user_id: session.user.id,
          movie_id: movieDetails?.id,
          title: movieDetails?.title,
          poster_path: movieDetails?.poster_path,
          status: "watched",
          media_type: "movie"
        }
      ], { onConflict: 'user_id,movie_id,media_type' });

      if (watchlistError) {
        console.error("Error sync watched status:", watchlistError.message);
      }

      alert("Review submitted successfully and added to Watched!");
      fetchComments(); 
    } catch (error: any) {
      console.error(error.message);
      alert("Σφάλμα Supabase: " + error.message);
    }
  };

  if (!isOpen) return null;

  if (!movieDetails) {
    return (
      <div className={styles.fixedOverlay}>
        <div className={styles.modalContainer} style={{ width: "90%", maxWidth: "80rem" }}>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
          <div style={{ color: "white", textAlign: "center", marginTop: "15rem", fontSize: "1.5rem" }}>
            Loading movie details...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.fixedOverlay}>
      <div className={`${styles.modalContainer} scrollable-div`} style={{ width: "90%", maxWidth: "80rem" }}>
        <button className={styles.closeButton} onClick={onClose}>✕</button>

        <div className={styles.mainContentFlex}>
          <img
            src={`https://image.tmdb.org/t/p/original${movieDetails.backdrop_path}`}
            alt={movieDetails.title}
            className={styles.backdropImg}
          />
          <div className={styles.textDetailsFlex}>
            <div className={styles.metaHeaderGroup}>
              <div>
                <h2 className={`${styles.titleText} movieTitle`}>{movieDetails.title}</h2>
                <p className={styles.taglineText}>{movieDetails.tagline}</p>
                <p className={`${styles.genresText} overviewText`}>
                  Genres: {movieDetails.genres.map((genre) => genre.name).join(", ")}
                </p>
              </div>
              <div className="info">
                <p className={styles.infoRuntime}>Runtime: {movieDetails.runtime} Minutes</p>
                <p className={styles.infoDate}>{getFormattedDate(movieDetails.release_date)}</p>
              </div>
            </div>

            <p className={`${styles.overviewParagraph} overviewText`}>{movieDetails.overview}</p>
            <div className={styles.actionButtonsWrapper}>
              {isLoggedIn ? (
                <>
                  <button onClick={handleAddToWatchlist} className={styles.watchlistBtn}>
                    {isInWatchlist ? "✓ In Watchlist" : "+ Add to Watchlist"}
                  </button>
                  <button onClick={() => setIsCommentFormOpen(true)} className={styles.writeReviewBtn}>
                    Write Review
                  </button>
                </>
              ) : (
                <p className={styles.loginPrompt}>Please Log In to unlock reviews and watchlists.</p>
              )}
            </div>
          </div>
        </div>

        <div className={styles.twoColumnLayout}>
          <div className={styles.trailerWrapper}>
            <h3 className={styles.sectionHeading}>Trailer</h3>
            {trailers.length > 0 && (
              <iframe
                key={trailers[0].id}
                src={`https://www.youtube.com/embed/${trailers[0].key}`}
                title={trailers[0].name}
                allowFullScreen
                className={styles.videoIframe}
              ></iframe>
            )}
          </div>

          <div className={styles.castWrapper}>
            <h3 className={styles.centerHeading}>Cast</h3>
            <div className={styles.castFlexContainer}>
              {movieCredits.slice(0, 10).map((cast) => (
                <div key={cast.id} className={styles.castCard}>
                  <img
                    src={`https://image.tmdb.org/t/p/w200${cast.profile_path}`}
                    alt={cast.name}
                    className={styles.castImg}
                  />
                  <p className={styles.truncateText}>{cast.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.similarWrapper}>
          <h3 className={styles.centerHeading}>Similar Movies</h3>
          <div className={styles.similarFlexContainer}>
            {similarMovies.slice(0, 7).map((movie) => (
              <div key={movie.id} className={styles.similarCard} onClick={() => onMovieSelect(movie.id)}>
                <img
                  src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                  alt={movie.title}
                  className={styles.posterImg}
                  onError={(e) => { e.currentTarget.src = noImage; }}
                />
                <p className={styles.similarTitle}>{movie.title}</p>
              </div>
            ))}
          </div>
        </div>

        {isLoggedIn && <Comments comments={comments} onCommentDeleted={fetchComments} />}
      </div>

      <CommentForm 
        movieId={movieDetails.id.toString()}
        isOpen={isCommentFormOpen}
        onClose={() => setIsCommentFormOpen(false)}
        onSubmit={handleReviewSubmit}
      />
    </div>
  );
};

export default MovieOverlay;