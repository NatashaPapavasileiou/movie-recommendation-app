// src/components/layout/SearchResults.tsx
import React, { useState, useMemo } from "react";
import noImage from "../../assets/noImage.jpg";
import noResult from "../../assets/no-result.png";
import { getFormattedDate, type DataTypes } from "../../modules/types_files";
import styles from "./SearchResults.module.css";

const TMDB_GENRES: { id: number; name: string }[] = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
  { id: 10765, name: "Sci-Fi & Fantasy (TV)" },
  { id: 10759, name: "Action & Adventure (TV)" },
];

interface SearchPropsType {
  searchResults: DataTypes[];
  onMediaClick?: (id: number, mediaType: "movie" | "tv") => void;
}

const SearchResults: React.FC<SearchPropsType> = ({ searchResults, onMediaClick }) => {
  const [selectedMediaType, setSelectedMediaType] = useState<"all" | "movie" | "tv">("all");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [selectedYearPeriod, setSelectedYearPeriod] = useState<string>("all");
  const [selectedMinRating, setSelectedMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"popularity" | "rating" | "newest">("popularity");

  const handleResetFilters = () => {
    setSelectedMediaType("all");
    setSelectedGenre("all");
    setSelectedYearPeriod("all");
    setSelectedMinRating(0);
    setSortBy("popularity");
  };

  const getItemYear = (item: DataTypes): number | null => {
    const dateStr = item?.release_date || item?.first_air_date;
    if (!dateStr) return null;
    const year = parseInt(dateStr.slice(0, 4), 10);
    return isNaN(year) ? null : year;
  };

  const filteredResults = useMemo(() => {
    if (!searchResults || !Array.isArray(searchResults)) return [];

    return searchResults
      .filter((item) => {
        if (!item) return false;
        const itemType = (item.media_type || (item.name && !item.title ? "tv" : "movie")) as "movie" | "tv";

        // Media Type Filter
        if (selectedMediaType !== "all" && itemType !== selectedMediaType) {
          return false;
        }

        // Min Rating Filter
        const rating = item.vote_average || 0;
        if (selectedMinRating > 0 && rating < selectedMinRating) {
          return false;
        }

        // Genre Filter
        if (selectedGenre !== "all") {
          const targetGenreId = parseInt(selectedGenre, 10);
          const itemGenreIds: number[] = item.genre_ids || [];
          if (!itemGenreIds.includes(targetGenreId)) {
            return false;
          }
        }

        // Year Filter
        const itemYear = getItemYear(item);
        if (selectedYearPeriod !== "all") {
          if (!itemYear) return false;
          if (selectedYearPeriod === "2026") return itemYear === 2026;
          if (selectedYearPeriod === "2025") return itemYear === 2025;
          if (selectedYearPeriod === "2024") return itemYear === 2024;
          if (selectedYearPeriod === "2020s") return itemYear >= 2020 && itemYear <= 2029;
          if (selectedYearPeriod === "2010s") return itemYear >= 2010 && itemYear <= 2019;
          if (selectedYearPeriod === "2000s") return itemYear >= 2000 && itemYear <= 2009;
          if (selectedYearPeriod === "older") return itemYear < 2000;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "rating") {
          return (b.vote_average || 0) - (a.vote_average || 0);
        }
        if (sortBy === "newest") {
          const yearA = getItemYear(a) || 0;
          const yearB = getItemYear(b) || 0;
          return yearB - yearA;
        }
        return (b.popularity || 0) - (a.popularity || 0);
      });
  }, [
    searchResults,
    selectedMediaType,
    selectedGenre,
    selectedYearPeriod,
    selectedMinRating,
    sortBy,
  ]);

  const hasActiveFilters =
    selectedMediaType !== "all" ||
    selectedGenre !== "all" ||
    selectedYearPeriod !== "all" ||
    selectedMinRating > 0 ||
    sortBy !== "popularity";

  return (
    <div className={styles.searchPageWrapper}>
      {/* ================= NETFLIX PILL FILTER BAR ================= */}
      {searchResults && searchResults.length > 0 && (
        <div className={styles.filterBar}>
          <div className={styles.filterControls}>
            {/* All / Movies / TV Switcher */}
            <div className={styles.mediaPillGroup}>
              <button
                type="button"
                className={`${styles.mediaPill} ${selectedMediaType === "all" ? styles.mediaPillActive : ""}`}
                onClick={() => setSelectedMediaType("all")}
              >
                All
              </button>
              <button
                type="button"
                className={`${styles.mediaPill} ${selectedMediaType === "movie" ? styles.mediaPillActive : ""}`}
                onClick={() => setSelectedMediaType("movie")}
              >
                Movies
              </button>
              <button
                type="button"
                className={`${styles.mediaPill} ${selectedMediaType === "tv" ? styles.mediaPillActive : ""}`}
                onClick={() => setSelectedMediaType("tv")}
              >
                TV
              </button>
            </div>

            {/* Genre Select */}
            <select
              aria-label="Filter by genre"
              className={styles.filterSelect}
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
            >
              <option value="all">All Genres</option>
              {TMDB_GENRES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            {/* Year Select */}
            <select
              aria-label="Filter by year"
              className={styles.filterSelect}
              value={selectedYearPeriod}
              onChange={(e) => setSelectedYearPeriod(e.target.value)}
            >
              <option value="all">Any Year</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2020s">2020s</option>
              <option value="2010s">2010s</option>
              <option value="2000s">2000s</option>
              <option value="older">'90s & Older</option>
            </select>

            {/* Rating Select */}
            <select
              aria-label="Filter by rating"
              className={styles.filterSelect}
              value={selectedMinRating}
              onChange={(e) => setSelectedMinRating(Number(e.target.value))}
            >
              <option value="0">Any Rating</option>
              <option value="6">★ 6.0+</option>
              <option value="7">★ 7.0+</option>
              <option value="8">★ 8.0+</option>
            </select>

            {/* Sort Order */}
            <select
              aria-label="Sort order"
              className={styles.filterSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "popularity" | "rating" | "newest")}
            >
              <option value="popularity">Popularity</option>
              <option value="rating">Top Rated</option>
              <option value="newest">Release Date</option>
            </select>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                type="button"
                className={styles.resetBtn}
                onClick={handleResetFilters}
              >
                Reset ✕
              </button>
            )}
          </div>

          <div className={styles.resultsCount}>
            Showing <strong>{filteredResults.length}</strong> of {searchResults.length}
          </div>
        </div>
      )}

      {/* ================= RESULTS GRID ================= */}
      {filteredResults.length > 0 ? (
        <div className={styles.resultsGrid}>
          {filteredResults.map((item) => {
            const itemType = (item.media_type || (item.name && !item.title ? "tv" : "movie")) as "movie" | "tv";
            const rating = item.vote_average ? item.vote_average.toFixed(1) : null;

            return (
              <div
                key={`${itemType}-${item.id}`}
                className={styles.resultCard}
                onClick={() => {
                  if (onMediaClick) {
                    onMediaClick(item.id, itemType);
                  }
                }}
              >
                {rating && <div className={styles.cardRatingBadge}>★ {rating}</div>}

                <img
                  src={
                    item.poster_path
                      ? `https://image.tmdb.org/t/p/w300/${item.poster_path}`
                      : noImage
                  }
                  alt={item.title || item.name || "Media Poster"}
                  className={styles.posterImg}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.src = noImage;
                  }}
                />

                <div className={styles.textContainer}>
                  <p className={`${styles.mediaTitle} truncate-text`}>
                    {item.title || item.name}
                  </p>

                  <p className={styles.subText}>
                    {itemType.toUpperCase()}
                  </p>

                  <p className={styles.subText}>
                    {item.release_date
                      ? getFormattedDate(item.release_date)
                      : item.first_air_date
                      ? getFormattedDate(item.first_air_date)
                      : "Unknown"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.noResultsContainer}>
          <div className={styles.noResultsContent}>
            <img width={400} src={noResult} alt="No matching results" />
            <h1 className={styles.noResultsHeading}>
              {searchResults.length > 0
                ? "No items match your active filters!"
                : "No Results Found !"}
            </h1>
            {hasActiveFilters && (
              <button
                type="button"
                className={`${styles.resetBtn} ${styles.clearFiltersBtn}`}
                onClick={handleResetFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;