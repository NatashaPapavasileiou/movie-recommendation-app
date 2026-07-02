import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "../modules/supabaseClient";
import { apiKey, baseUrl } from "../modules/ApiLinks";
import { PreferenceHeader } from "../components/PreferenceHeader";
import { MoviePreferenceCard } from "../components/MoviePreferenceCard";
import { PreferenceFooterButton } from "../components/PreferenceFooterButton";
import styles from "../components/Preference.module.css";

interface MediaItem {
  id: number;
  title?: string;      
  name?: string;      
  poster_path: string;
  genre_ids: number[];
  media_type: "movie" | "tv";
}

export default function PreferenceSetupPage() {
  const navigate = useNavigate();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSetupMedia = async () => {
      try {
        const res = await fetch(`${baseUrl}/trending/all/day?api_key=${apiKey}&language=en-US`);
        const data = await res.json();
        const filteredMedia = (data.results || []).filter(
          (item: any) => item.media_type === "movie" || item.media_type === "tv"
        );
        setMediaItems(filteredMedia);
      } catch (err) {
        console.error("Error fetching setup media:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSetupMedia();
  }, []);

  const toggleMedia = (item: MediaItem) => {
    if (selectedIds.includes(item.id)) {
      setSelectedIds(selectedIds.filter((id) => id !== item.id));
    } else {
      if (selectedIds.length < 5) {
        setSelectedIds([...selectedIds, item.id]);
      }
    }
  };

  const handleFinish = async () => {
    if (selectedIds.length < 3) {
      alert("Παρακαλώ επιλέξτε τουλάχιστον 3 αγαπημένα!");
      return;
    }
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;

      const selectedItems = mediaItems.filter((m) => selectedIds.includes(m.id));
      const allGenreIds = selectedItems.flatMap((m) => m.genre_ids);
      const uniqueGenres = Array.from(new Set(allGenreIds)).map(id => Number(id));

      const favoriteMovies = selectedItems
        .filter((item) => item.media_type === "movie")
        .map((item) => Number(item.id));

      const favoriteShows = selectedItems
        .filter((item) => item.media_type === "tv")
        .map((item) => Number(item.id));

      console.log("Saving hybrid setup data to profiles:", {
        uniqueGenres,
        favoriteMovies,
        favoriteShows
      });

      const { error } = await supabase
        .from("profiles")
        .update({
          favorite_genres: uniqueGenres,
          favorite_movies: favoriteMovies,
          favorite_shows: favoriteShows,  
          has_completed_setup: true
        })
        .eq("id", userId);

      if (error) throw error;
      navigate("/");
    } catch (err) {
      console.error("Error saving hybrid preferences:", err);
      alert("Κάτι πήγε στραβά κατά την αποθήκευση.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className={styles.loaderContainer}>
      <Loader2 className={styles.spinner} />
      <p style={{ color: "#a1a1aa", marginTop: "1rem" }}>Loading selections...</p>
    </div>
  );

  return (
    <div className={styles.pageWrapper}>
      <PreferenceHeader />
      <div className={styles.movieGrid}>
        {mediaItems.map((item) => {
          const displayMovie = {
            id: item.id,
            title: item.media_type === "movie" ? item.title || "" : item.name || "",
            poster_path: item.poster_path,
            genre_ids: item.genre_ids
          };

          return (
            <MoviePreferenceCard
              key={item.id}
              movie={displayMovie}
              isSelected={selectedIds.includes(item.id)}
              onToggle={() => toggleMedia(item)}
            />
          );
        })}
      </div>
      <PreferenceFooterButton
        selectedCount={selectedIds.length}
        saving={saving}
        onFinish={handleFinish}
      />
    </div>
  );
}