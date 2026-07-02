import { useState, useEffect } from "react";
import { apiKey, baseUrl, popular, popularShows } from "../modules/ApiLinks";
import { NavLink, useLocation } from "react-router-dom";
import axios from "axios";
import styles from "./Navbar.module.css"; 


interface NavbarProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
  isLoggedIn: boolean;  
  onLogout: () => void; 
}

const Navbar: React.FC<NavbarProps> = ({ onSearch, isSearching, isLoggedIn, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); 
  const [searchQuery, setSearchQuery] = useState(""); 
  const [movieData, setMovieData] = useState({
    backdropPath: "",
    title: "",
    overview: "",
  }); 

  const location = useLocation();

  const handleScroll = () => {
    if (window.scrollY > 150) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

  const fetchMediaData = async (page: string) => {
    let url = `${baseUrl}/${page}?api_key=${apiKey}`;
    if (page === "tv") {
      url = `${popularShows}`;
    } else {
      url = `${popular}`;
    }

    try {
      const response = await axios.get(url);
      const data = await response.data;
      const randomIndex = Math.floor(Math.random() * data.results.length);
      const randomMedia = data.results[randomIndex];

      if (randomMedia && randomMedia.backdrop_path) {
        setMovieData({
          backdropPath: `https://image.tmdb.org/t/p/original${randomMedia.backdrop_path}`,
          title: randomMedia.title || randomMedia.name || "",
          overview: randomMedia.overview || "",
        });
      }
    } catch (error) {
      console.error("Error fetching media data:", error);
    }
  };

  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath.includes("movies")) {
      fetchMediaData("movie");
    } else if (currentPath.includes("tvshows")) {
      fetchMediaData("tv");
    } else {
      fetchMediaData("movie"); 
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  return (
    <div
      className={`${styles.heroContainer} ${
        isSearching ? styles.heroHeightSearching : styles.heroHeightNormal
      }`}
      style={{ backgroundImage: `url(${movieData.backdropPath})` }}
    >
      <div
        className={`${styles.navbarHeader} ${
          isScrolled ? styles.bgBlackScroll : styles.bgTransparentGradient
        }`}
      >
        <div className={`${styles.desktopLinks} navbarText`}>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `cursor-pointer hover:text-white ${
                isActive ? "text-sky-400 scale-125 " : ""
              }`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/movies"
            className={({ isActive }) =>
              `cursor-pointer hover:text-white ${
                isActive ? "text-sky-400 scale-150" : ""
              }`
            }
          >
            Movies
          </NavLink>
          <NavLink
            to="/tvshows"
            className={({ isActive }) =>
              `cursor-pointer hover:text-white ${
                isActive ? "text-sky-400 scale-125" : ""
              }`
            }
          >
            TV Shows
          </NavLink>
         {isLoggedIn && (
          <NavLink
           to="/watchlist" className={({ isActive }) =>
              `cursor-pointer hover:text-white ${
                isActive ? "text-sky-400 scale-125" : ""
              }`}>
           Watchlist
          </NavLink> )}

        </div>

        <div className={styles.desktopSearchUser}>
          <div className={styles.inputWrapper}>
            <input
              value={searchQuery}
              onChange={handleSearchChange}
              type="text"
              placeholder="Search"
              className={styles.searchInput}
            />
            <span className={`material-symbols-outlined ${styles.searchIcon}`}>
              search
            </span>
          </div>
          
          <div className="navbarText">
            {isLoggedIn ? (
              <button 
                onClick={onLogout} 
                className={styles.authLink}
              >
                Log Out
              </button>
            ) : (
              <NavLink 
                to="/auth" 
                className={({ isActive }) => 
                  `${styles.authLink} ${isActive ? styles.activeAuthLink : ""}`
                }
              >
                Log In
              </NavLink>
            )}
          </div>
        </div>

        <button
          className={styles.hamburgerButton}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          ☰
        </button>
      </div>

      <div
        className={`${styles.mobileDrawer} ${
          isMenuOpen ? styles.drawerOpen : styles.drawerClosed
        }`}
      >
        <button
          className={styles.closeDrawerButton}
          onClick={() => setIsMenuOpen(false)}
        >
          ✕
        </button>
        <div className={styles.mobileLinksContainer}>
          <NavLink
            to="/"
            className="cursor-pointer text-xl hover:text-gray-400"
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </NavLink>
          <NavLink
            to="tvshows"
            className="cursor-pointer text-xl hover:text-gray-400"
            onClick={() => setIsMenuOpen(false)}
          >
            TV Shows
          </NavLink>
          <NavLink
            to="movies"
            className="cursor-pointer text-xl hover:text-gray-400"
            onClick={() => setIsMenuOpen(false)}
          >
            Movies
          </NavLink>

          {isLoggedIn && (
            <NavLink
              to="/watchlist" 
              className="cursor-pointer text-xl hover:text-gray-400"
              onClick={() => setIsMenuOpen(false)}
            >
              Watchlist
            </NavLink>
          )}
          
          {isLoggedIn ? (
            <button 
              onClick={() => { onLogout(); setIsMenuOpen(false); }} 
              className={styles.authLink}
            >
              Log Out
            </button>
          ) : (
            <NavLink
              to="/auth"
              className={styles.authLink}
              onClick={() => setIsMenuOpen(false)}
            >
              Log In
            </NavLink>
          )}
        </div>
        <div className={styles.mobileSearchContainer}>
          <input
            value={searchQuery}
            onChange={handleSearchChange}
            type="text"
            placeholder="Search"
            className={styles.mobileSearchInput}
          />
        </div>
      </div>

      <div className={styles.heroInfoWrapper}>
        {!isSearching && (
          <>
            <h1 className={`${styles.infoTitle} movieTitle space tracking-wider`}>
              {movieData.title}
            </h1>
            <p className={`${styles.infoOverview} overviewText`}>
              {movieData.overview}
            </p>
            
          </>
        )}
      </div>
    </div>
  );
};

export default Navbar;