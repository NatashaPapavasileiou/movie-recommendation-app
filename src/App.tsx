
import { Route, Routes } from "react-router-dom";
import { useAppLogic } from "./hooks/useAppLogic"; 

// Components & Pages Imports
import Home from "./pages/Home";
import TvShows from "./pages/TvShows";
import Movies from "./pages/Movies";
import { Watchlist } from "./pages/Watchlist"; 
import PreferenceSetupPage from "./pages/PreferenceSetupPage"; 
import Navbar from "./components/Navbar";
import SearchResults from "./components/SearchResults";
import LoadingOverlay from "./components/LoadingOverlay";
import MovieOverlay from "./components/MovieOverlay";
import TvOverlay from "./components/TvOverlay";
import Auth from "./pages/Auth"; 

const App = () => {
  
  const {
    searchResults,
    isSearching,
    buffering,
    setSearchQuery,
    isMovieModalOpen,
    setIsMovieModalOpen,
    selectedMovieId,
    isTvModalOpen,
    setIsTvModalOpen,
    selectedTvId,
    session,
    handleMovieClick,
    handleTvClick,
    handleLogout,
    isAuthPage,
    isSetupPage
  } = useAppLogic();

  return (
    <>
      {buffering ? (
        <div className="flex justify-center items-center h-[59rem] loadingOverlay">
          <LoadingOverlay />
        </div>
      ) : (
        <>
          {!isSetupPage && (
            <Navbar 
              onSearch={setSearchQuery} 
              isSearching={isSearching} 
              isLoggedIn={!!session} 
              onLogout={handleLogout} 
            />
          )}
          
          {isSearching && !isAuthPage && !isSetupPage ? (
            <SearchResults searchResults={searchResults} />
          ) : (
            <>
              <Routes>
                <Route path="/" element={<Home handleMovieClick={handleMovieClick}/>} />
                <Route path="movies" element={<Movies handleMovieClick={handleMovieClick}/>} />
                <Route path="tvshows" element={<TvShows handleTvClick={handleTvClick}/>} />
                <Route path="watchlist" element={<Watchlist isLoggedIn={!!session} />} />
                <Route path="setup-preferences" element={<PreferenceSetupPage />} />
                <Route path="auth" element={<Auth />} /> 
              </Routes>

              {!isAuthPage && !isSetupPage && (
                <>
                  <MovieOverlay
                    movieId={selectedMovieId}
                    isOpen={isMovieModalOpen}
                    onClose={() => setIsMovieModalOpen(false)}
                    isLoggedIn={!!session} 
                    onMovieSelect={handleMovieClick}
                  />
                  <TvOverlay
                    tvId={selectedTvId}
                    isOpen={isTvModalOpen}
                    onClose={() => setIsTvModalOpen(false)}
                    isLoggedIn={!!session}
                    onTvSelect={handleTvClick}
                  />
                </>
              )}
            </>
          )}
        </>
      )}
    </>
  );
};

export default App;