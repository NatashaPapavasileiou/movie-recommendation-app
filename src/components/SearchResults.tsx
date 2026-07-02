import React from "react";
import noImage from "../assets/noImage.jpg";
import noResult from "../assets/no-result.png";
import { getFormattedDate, type DataTypes } from "../modules/types_files";
import styles from "./SearchResults.module.css"; 

interface SearchProptType {
  searchResults: DataTypes[];
}

const SearchResults: React.FC<SearchProptType> = ({ searchResults }) => {

  return (
    <>
      <div className="search-results">
        {searchResults.length > 0 ? (
          <div className={styles.resultsGrid}>
            {searchResults.map((item) => (
              <div
                key={item.id}
                className={styles.resultCard}
              >
                {/*//! if image not found render a msg img not found */}
                <img
                  src={`https://image.tmdb.org/t/p/w200/${item.poster_path}`}
                  alt={item.title || item.name}
                  className={styles.posterImg}
                  onError={(event) => {
                    event.currentTarget.src = noImage;
                  }}
                />

                <div className={styles.textContainer}>
                  <p className={`${styles.mediaTitle} truncate-text`}>
                    {item.title || item.name}
                  </p>

                  <p className={styles.subText}>
                    {item.media_type.toLocaleUpperCase()}
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
            ))}
          </div>
        ) : (
          <div className={styles.noResultsContainer}>
            <div className={styles.noResultsContent}>
              <img width={500} src={noResult} alt="No results found" />
              <h1 className={styles.noResultsHeading}>No Results Found !</h1>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SearchResults;