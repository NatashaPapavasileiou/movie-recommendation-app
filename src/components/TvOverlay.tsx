import { useState, useEffect } from "react";
import { baseUrl, apiKey } from "../modules/ApiLinks";
import { getFormattedDate } from "../modules/types_files";
import noImage from "../assets/noImage.jpg";
import axios from "axios";
import styles from "./MovieOverlay.module.css"; 
import { CommentForm } from "./CommentForm";
import { supabase } from "../modules/supabaseClient";
import { Comments } from "./Comments";

interface TvDetails {
  id: number;
  name: string;
  backdrop_path: string;
  poster_path: string;
  overview: string;
  first_air_date: string;
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
  name: string;
  poster_path: string;
}

interface Trailer {
  id: string;
  key: string;
  name: string;
  type: string;
}

interface TvOverlayProps {
  tvId: number | null;
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  onTvSelect: (id: number) => void;
}

const TvOverlay: React.FC<TvOverlayProps> = ({
  tvId,
  isOpen,
  onClose,
  isLoggedIn,
  onTvSelect,
}) => {
  const [tvDetails, setTvDetails] = useState<TvDetails | null>(null);
  const [tvCredits, setTvCredits] = useState<CastMember[]>([]);
  const [similarShows, setSimilarShows] = useState<SimilarMovie[]>([]);
  const [isCommentFormOpen, setIsCommentFormOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [trailers, setTrailers] = useState<Trailer[]>([]); 
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  const fetchComments = async () => {
    if (!tvId) return;
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("movie_id", tvId) 
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
      .eq("media_type", "tv");

    if (!error && data && data.length > 0) {
      setIsInWatchlist(true);
    } else {
      setIsInWatchlist(false);
    }
  };

  useEffect(() => {
    if (!tvId || !isOpen) return;

    setTvDetails(null);
    setTvCredits([]);
    setSimilarShows([]);
    setComments([]);
    setTrailers([]); 
    setIsInWatchlist(false);

    const fetchMovieDetails = async () => {
      try {
        const [detailsRes, creditsRes, similarRes, trailersRes] =
          await Promise.all([
            axios.get(`${baseUrl}/tv/${tvId}?api_key=${apiKey}`),
            axios.get(`${baseUrl}/tv/${tvId}/credits?api_key=${apiKey}`),
            axios.get(`${baseUrl}/tv/${tvId}/similar?api_key=${apiKey}`),
            axios.get(`${baseUrl}/tv/${tvId}/videos?api_key=${apiKey}`),
          ]);

        const detailsData: TvDetails = detailsRes.data;
        const creditsData: MovieCreditResponse = creditsRes.data;
        const similarData: { results: SimilarMovie[] } = similarRes.data;
        const trailersData: { results: Trailer[] } = trailersRes.data;

        setTvDetails(detailsData);
        setTvCredits(creditsData.cast);
        setSimilarShows(similarData.results);
        setTrailers(
          trailersData.results.filter((video) => video.type === "Trailer")
        );

      } catch (error) {
        console.error("Error fetching TV data:", error);
      }
    };

    fetchMovieDetails();
    fetchComments();
    checkWatchlistStatus(tvId);
  }, [tvId, isOpen]);

  const handleAddToWatchlist = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("You must be logged in to manage your watchlist!");
        return;
      }
      if (!tvDetails) return;

      if (isInWatchlist) {
        const { error } = await supabase
          .from("watchlist")
          .delete()
          .eq("user_id", session.user.id)
          .eq("movie_id", tvDetails.id)
          .eq("media_type", "tv");

        if (error) throw error;
        setIsInWatchlist(false);
        alert("Removed from Watchlist!");
      } else {
        const { error } = await supabase.from("watchlist").insert([
          {
            user_id: session.user.id,
            movie_id: tvDetails.id,
            title: tvDetails.name,
            poster_path: tvDetails.poster_path,
            status: "to_watch",
            media_type: "tv"
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
          media_type: "tv",
        }
      ]);

      if (commentError) throw commentError;

      const { error: watchlistError } = await supabase.from("watchlist").upsert([
        {
          user_id: session.user.id,
          movie_id: tvDetails?.id,
          title: tvDetails?.name,
          poster_path: tvDetails?.poster_path,
          status: "watched",
          media_type: "tv"
        }
      ], { onConflict: 'user_id,movie_id,media_type' });

      if (watchlistError) {
        console.error("Error sync watched status:", watchlistError.message);
      }

      alert("Review submitted successfully and added to Watched!");
      fetchComments(); 
    } catch (error: any) {
      console.error(error.message);
    }
  };

  if (!isOpen) return null;

  if (!tvDetails) {
    return (
      <div className={styles.fixedOverlay}>
        <div className={styles.modalContainer} style={{ width: "90%", maxWidth: "80rem" }}>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
          <div style={{ color: "white", textAlign: "center", marginTop: "15rem", fontSize: "1.5rem" }}>
            Loading show details...
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
            src={`https://image.tmdb.org/t/p/original${tvDetails.backdrop_path}`}
            alt={tvDetails.name}
            className={styles.backdropImg}
          />
          <div className={styles.textDetailsFlex}>
            <div className={styles.metaHeaderGroup}>
              <div className="">
                <h2 className={`${styles.titleText} movieTitle`}>{tvDetails.name}</h2>
                <p className={styles.taglineText}>{tvDetails.tagline}</p>
                <p className={`${styles.genresText} overviewText`}>
                  Genres: {tvDetails.genres.map((genre) => genre.name).join(", ")}
                </p>
              </div>
              <div className="info">
                <p className={styles.infoDate}>{getFormattedDate(tvDetails.first_air_date)}</p>
              </div>
            </div>

            <p className={`${styles.overviewParagraph} overviewText`}>{tvDetails.overview}</p>
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
            {trailers.length > 0 ? (
              <iframe
                key={trailers[0].id}
                src={`https://www.youtube.com/embed/${trailers[0].key}`}
                title={trailers[0].name}
                allowFullScreen
                className={styles.videoIframe}
              ></iframe>
            ) : (
              <p style={{ color: "#71717a", fontStyle: "italic", marginTop: "1rem" }}>No trailer available.</p>
            )}
          </div>

          <div className={styles.castWrapper}>
            <h3 className={styles.centerHeading}>Cast</h3>
            <div className={styles.castFlexContainer}>
              {tvCredits.slice(0, 10).map((cast) => (
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
          <h3 className={styles.centerHeading}>Similar Shows</h3>
          <div className={styles.similarFlexContainer}>
            {similarShows.slice(0, 7).map((tv) => (
              <div key={tv.id} className={styles.similarCard} onClick={() => onTvSelect(tv.id)}>
                <img
                  src={`https://image.tmdb.org/t/p/w200${tv.poster_path}`}
                  alt={tv.name}
                  className={styles.posterImg}
                  onError={(e) => { e.currentTarget.src = noImage; }}
                />
                <p className={styles.similarTitle}>{tv.name}</p>
              </div>
            ))}
          </div>
        </div>

        {isLoggedIn && <Comments comments={comments} onCommentDeleted={fetchComments} />}
      </div>

      <CommentForm 
        movieId={tvDetails.id.toString()}
        isOpen={isCommentFormOpen}
        onClose={() => setIsCommentFormOpen(false)}
        onSubmit={handleReviewSubmit}
      />
    </div>
  );
};

export default TvOverlay;