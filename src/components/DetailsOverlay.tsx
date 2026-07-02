import { useState, useEffect } from "react";
import { baseUrl, apiKey } from "../modules/ApiLinks";
import { getFormattedDate } from "../modules/types_files";
import noImage from "../assets/noImage.jpg";
import axios from "axios";
import styles from "./Overlay.module.css"; 


interface Details {
  id: number;
  title?: string; // Movies use `title`
  name?: string; // TV shows use `name`
  backdrop_path: string;
  poster_path: string;
  overview: string;
  release_date?: string; // Movies use `release_date`
  first_air_date?: string; // TV shows use `first_air_date`
  genres: { id: number; name: string }[];
  runtime?: number; // Movies use `runtime`
  episode_run_time?: number[]; // TV shows use `episode_run_time`
  vote_average: number;
  tagline: string;
}

interface CastMember {
  id: number;
  name: string;
  profile_path: string | null;
  character: string;
}

interface SimilarItem {
  id: number;
  title?: string; // Movies use `title`
  name?: string; // TV shows use `name`
  poster_path: string;
}

interface Trailer {
  id: string;
  key: string;
  name: string;
  type: string;
}

const Overlay = ({
  id,
  isOpen,
  type, // "movie" or "tv"
  onClose,
}: {
  id: number | null;
  isOpen: boolean;
  type: "movie" | "tv";
  onClose: () => void;
}) => {
  const [details, setDetails] = useState<Details | null>(null);
  const [credits, setCredits] = useState<CastMember[]>([]);
  const [similarItems, setSimilarItems] = useState<SimilarItem[]>([]);
  const [trailers, setTrailers] = useState<Trailer[]>([]);

  useEffect(() => {
    if (!id || !isOpen) return;

    const fetchData = async () => {
      try {
        const [detailsRes, creditsRes, similarRes, trailersRes] =
          await Promise.all([
            axios.get(`${baseUrl}/${type}/${id}?api_key=${apiKey}`),
            axios.get(`${baseUrl}/${type}/${id}/credits?api_key=${apiKey}`),
            axios.get(`${baseUrl}/${type}/${id}/similar?api_key=${apiKey}`),
            axios.get(`${baseUrl}/${type}/${id}/videos?api_key=${apiKey}`),
          ]);

        const detailsData: Details = detailsRes.data;
        const creditsData = creditsRes.data;
        const similarData = similarRes.data;
        const trailersData = trailersRes.data;

        setDetails(detailsData);
        setCredits(creditsData.cast || []);
        setSimilarItems(similarData.results || []);
        setTrailers(
          trailersData.results?.filter((video: Trailer) => video.type === "Trailer") || []
        );
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [id, isOpen, type]);

  if (!isOpen || !details) return null;

  return (
    <div className={styles.fixedOverlay}>
      <div className={`${styles.modalContainer} scrollable-div`}>
        {/* Close Button */}
        <button
          className={styles.closeButton}
          onClick={onClose}
        >
          ✕
        </button>

        {/* Main Content */}
        <div className={styles.contentFlex}>
          <img
            src={`https://image.tmdb.org/t/p/original${details.backdrop_path}`}
            alt={details.title || details.name}
            className={styles.backdropImg}
          />
          <div className={styles.detailsFlex}>
            <div className={styles.metaFlexGroup}>
              <div>
                <h2 className={`${styles.titleText} movieTitle`}>
                  {details.title || details.name}
                </h2>
                <p className={styles.taglineText}>
                  {details.tagline}
                </p>
                <p className={`${styles.genresText} overviewText`}>
                  Genres: {details.genres.map((genre) => genre.name).join(", ")}
                </p>
              </div>
              <div className="info">
                {type === "movie" && details.runtime && (
                  <p className={styles.infoSection}>
                    Runtime: {details.runtime} Minutes
                  </p>
                )}
                {type === "tv" && details.episode_run_time?.length && (
                  <p className={styles.infoSection}>
                    Runtime: {details.episode_run_time[0]} Minutes
                  </p>
                )}
                <p className={styles.infoDate}>
                  {getFormattedDate(
                    details.release_date || details.first_air_date || ""
                  )}
                </p>
              </div>
            </div>
            <p className={`${styles.overviewTextLayout} overviewText`}>
              {details.overview}
            </p>
          </div>
        </div>

        {/* Trailers */}
        {trailers.length > 0 && (
          <div className={styles.trailerSection}>
            <h3 className={styles.sectionHeading}>Trailer</h3>
            <iframe
              key={trailers[0].id}
              src={`https://www.youtube.com/embed/${trailers[0].key}`}
              title={trailers[0].name}
              allowFullScreen
              className={styles.videoIframe}
            ></iframe>
          </div>
        )}

        {/* Cast */}
        <div className={styles.castSection}>
          <h3 className={styles.centerHeading}>Cast</h3>
          <div className={styles.castFlexContainer}>
            {credits.slice(0, 7).map((cast) => (
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

        {/* Similar Items */}
        <div className={styles.similarSection}>
          <h3 className={styles.centerHeading}>
            Similar {type === "movie" ? "Movies" : "Shows"}
          </h3>
          <div className={styles.similarFlexContainer}>
            {similarItems.slice(0, 7).map((item) => (
              <div key={item.id} className={styles.similarCard}>
                <img
                  src={`https://image.tmdb.org/t/p/w200${item.poster_path}`}
                  alt={item.title || item.name}
                  className={styles.posterImg}
                  onError={(event) => {
                    event.currentTarget.src = noImage;
                  }}
                />
                <p className={styles.similarTitle}>{item.title || item.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overlay;