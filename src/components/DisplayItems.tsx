import React, { useEffect, useState } from "react";

import axios from "axios";
import { type ItemsCategory, type DataTypes } from "../modules/types_files";
import noImage from "../assets/noImage.jpg";
import styles from "./DisplayItems.module.css";

//*Types for passing props that are coming from HOME/Movies/TvShows
interface DisplayItemsProps {
  displayTags: ItemsCategory[];
  handleMovieClick: (movieId: number) => void;
}

const DisplayItems: React.FC<DisplayItemsProps> = ({
  displayTags,
  handleMovieClick,
}) => {
  return (
    <>
      {displayTags.map(({ apiEndpoint, itemHeading }) => (
        <CategorySection
          key={apiEndpoint}
          apiEndpoint={apiEndpoint}
          itemHeading={itemHeading}
          handleMovieClick={handleMovieClick}
        />
      ))}
    </>
  );
};

//* Types for props coming from above CategorySection

//*Category Section Component for rendering movies via categorioes

interface CategorySecProps extends ItemsCategory {
  handleMovieClick: (movieId: number) => void;
}
const CategorySection: React.FC<CategorySecProps> = ({
  apiEndpoint,
  itemHeading,
  handleMovieClick,
}) => {
  const [movies, setMovies] = useState<DataTypes[]>([]);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await axios.get(apiEndpoint);
        setMovies(response.data.results.slice(0, 7));
      } catch (error) {
        console.error("Error fetching movies", error);
      }
    };

    fetchMovies();
  }, [apiEndpoint]);

  return (
    <div className={styles.categoryContainer}>
      <div className={styles.headingWrapper}>
        <h1 className={`${styles.categoryTitle} navbarText animatetext`}>
          {itemHeading}
        </h1>
      </div>
      <div className={styles.moviesGrid}>
        {movies.map((movie) => (
          <div
            className={styles.movieCard}
            onClick={() => handleMovieClick(movie.id)}
            key={movie.id}
          >
            <img
              src={`https://image.tmdb.org/t/p/w200/${movie.poster_path}`}
              alt={movie.title || movie.name}
              className={`${styles.posterImg} animatetext`}
              onError={(event) => {
                event.currentTarget.src = noImage;
              }}
            />
            <div className={styles.titlePadding}>
              <p className={`${styles.textBoldxl} truncate-text`}>
                {movie.title}
              </p>
            </div>

            <div className={styles.namePadding}>
              <p className={`${styles.textBoldxl} truncate-text`}>
                {movie.name}
              </p>
            </div>

            <p className={styles.ratingBadge}>
              {movie.vote_average.toFixed(1)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DisplayItems;