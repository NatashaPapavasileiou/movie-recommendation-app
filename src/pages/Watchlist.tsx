import { useState, useEffect } from "react";
import { supabase } from "../modules/supabaseClient";
import MovieOverlay from "../components/MovieOverlay";
import TvOverlay from "../components/TvOverlay"; 
import WatchlistColumn from "../components/WatchlistColumn";
import { CommentForm } from "../components/CommentForm";
import styles from "../components/Watchlist.module.css";

interface WatchlistItem {
  id: number;
  movie_id: number;
  title: string;
  poster_path: string;
  status: "to_watch" | "watched";
  media_type: "movie" | "tv";
  
}

export const Watchlist = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<"movie" | "tv" | null>(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  
  const [isCommentFormOpen, setIsCommentFormOpen] = useState(false);
  
  const [activeItemForReview, setActiveItemForReview] = useState<{ id: number; type: "movie" | "tv" } | null>(null);

  const fetchWatchlist = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("watchlist")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setWatchlist(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchWatchlist();
    }
  }, [isLoggedIn, isOverlayOpen]);

  const handleActionClick = async (e: React.MouseEvent, movieId: number, currentStatus: "to_watch" | "watched") => {
    e.stopPropagation(); 
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

  
    const item = watchlist.find(m => m.movie_id === movieId);
    if (!item) return;

    if (currentStatus === "to_watch") {
      setActiveItemForReview({ id: movieId, type: item.media_type });
      setIsCommentFormOpen(true);
    } else {
      const { error } = await supabase
        .from("watchlist")
        .update({ status: "to_watch" })
        .eq("user_id", session.user.id)
        .eq("movie_id", movieId)
        .eq("media_type", item.media_type); 

      if (!error) fetchWatchlist();
    }
  };

  const handleReviewSubmit = async (text: string, rating: number, id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      if (!activeItemForReview) return;

      
      await supabase.from("comments").insert([
        {
          movie_id: parseInt(id),
          user_id: session.user.id,
          user_email: session.user.email,
          content: text,
          rating: rating,
          media_type: activeItemForReview.type, 
        }
      ]);

      
      await supabase
        .from("watchlist")
        .update({ status: "watched", personal_review: text })
        .eq("user_id", session.user.id)
        .eq("movie_id", parseInt(id))
        .eq("media_type", activeItemForReview.type);

      setIsCommentFormOpen(false);
      setActiveItemForReview(null);
      fetchWatchlist();
    } catch (error) {
      console.error(error);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className={styles.centerContainer}>
        <h2>Please log in to view your personal Watchlist.</h2>
      </div>
    );
  }

  const toWatchCount = watchlist.filter(m => m.status === "to_watch").length;
  const watchedCount = watchlist.filter(m => m.status === "watched").length;

  
  const handleItemClick = (id: number) => {
    const target = watchlist.find(m => m.movie_id === id);
    if (target) {
      setSelectedMovieId(id);
      setSelectedMediaType(target.media_type);
      setIsOverlayOpen(true);
    }
  };

  return (
    <div className={styles.watchlistPage}>
      <div className={styles.pageHeaderBanner}>
        <h1 className={styles.mainPageTitle}>My Collection</h1>
        <div className={styles.titleUnderline}></div>
      </div>

      {loading ? (
        <div className={styles.centerContainer}>Loading your collection...</div>
      ) : (
        <div className={styles.columnsLayoutContainer}>
          <WatchlistColumn
            title="TO WATCH"
            moviesCount={toWatchCount}
            movies={watchlist}
            statusType="to_watch"
            onMovieClick={handleItemClick} 
            onActionClick={handleActionClick}
          />

          <div className={styles.divider}></div>

          <WatchlistColumn
            title="WATCHED"
            moviesCount={watchedCount}
            movies={watchlist}
            statusType="watched"
            onMovieClick={handleItemClick}
            onActionClick={handleActionClick}
          />
        </div>
      )}

      
      {isOverlayOpen && selectedMediaType === "movie" && (
        <MovieOverlay
          movieId={selectedMovieId}
          isOpen={isOverlayOpen}
          onClose={() => { setIsOverlayOpen(false); setSelectedMediaType(null); }}
          isLoggedIn={isLoggedIn}
          onMovieSelect={(id) => setSelectedMovieId(id)}
        />
      )}

       
      {isOverlayOpen && selectedMediaType === "tv" && (
        <TvOverlay
          tvId={selectedMovieId}
          isOpen={isOverlayOpen}
          onClose={() => { setIsOverlayOpen(false); setSelectedMediaType(null); }}
          isLoggedIn={isLoggedIn}
          onTvSelect={(id) => setSelectedMovieId(id)}
        />
      )}

      {isCommentFormOpen && activeItemForReview && (
        <CommentForm
          movieId={activeItemForReview.id.toString()}
          isOpen={isCommentFormOpen}
          onClose={() => {
            setIsCommentFormOpen(false);
            setActiveItemForReview(null);
          }}
          onSubmit={handleReviewSubmit}
          
        />
      )}
    </div>
  );
};