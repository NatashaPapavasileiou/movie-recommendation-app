// src/App.tsx
import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { useAppLogic } from "./hooks/useAppLogic"; 

// Components & Pages Imports
import Home from "./pages/Home";
import TvShows from "./pages/TvShows";
import Movies from "./pages/Movies";
import { Watchlist } from "./pages/Watchlist"; 
import PreferenceSetupPage from "./pages/PreferenceSetupPage"; 
import Navbar from "./components/layout/Navbar";
import SearchResults from "./components/layout/SearchResults";
import LoadingOverlay from "./components/layout/LoadingOverlay";
import MovieOverlay from "./components/details/MovieOverlay";
import TvOverlay from "./components/details/TvOverlay";
import Auth from "./pages/Auth"; 
import ResetPassword from "./components/auth/ResetPassword";
import { AdminRoute } from "./components/admin/AdminRoute";
import styles from "./components/auth/Auth.module.css";

// Admin-only page is loaded on demand, so regular users never download its code
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
    isSetupPage,
  } = useAppLogic();

  // Intercept recovery token from Supabase email link before user is routed to Home
  useEffect(() => {
    const hasRecoveryToken =
      window.location.hash.includes("type=recovery") ||
      window.location.search.includes("type=recovery");

    if (hasRecoveryToken && location.pathname !== "/reset-password") {
      navigate(`/reset-password${window.location.hash}`, { replace: true });
    }
  }, [location, navigate]);

  const isResetPage = location.pathname === "/reset-password";

  return (
    <>
      {buffering ? (
        <div className="flex justify-center items-center h-[59rem] loadingOverlay">
          <LoadingOverlay />
        </div>
      ) : (
        <>
          {!isSetupPage && !isResetPage && (
            <Navbar 
              onSearch={setSearchQuery} 
              isSearching={isSearching} 
              isLoggedIn={!!session} 
              onLogout={handleLogout} 
            />
          )}
          
          {/* Main Content Area */}
          {isSearching && !isAuthPage && !isSetupPage && !isResetPage ? (
            <SearchResults 
              searchResults={searchResults} 
              onMediaClick={(id, type) => {
                if (type === "movie") {
                  handleMovieClick(id);
                } else {
                  handleTvClick(id);
                }
              }}
            />
          ) : (
            <Routes>
              <Route path="/" element={<Home handleMovieClick={handleMovieClick} handleTvClick={handleTvClick} />} />
              <Route path="movies" element={<Movies handleMovieClick={handleMovieClick} />} />
              <Route path="tvshows" element={<TvShows handleTvClick={handleTvClick} />} />
              <Route path="watchlist" element={<Watchlist isLoggedIn={!!session} />} />
              <Route path="setup-preferences" element={<PreferenceSetupPage />} />
              <Route path="auth" element={<Auth />} />

              {/* Direct route rendering your existing ResetPassword component */}
              <Route
                path="reset-password"
                element={
                  <div className={styles.authPageContainer}>
                    <ResetPassword onBackToLogin={() => navigate("/auth")} />
                  </div>
                }
              />

              {/* Protected Admin Route */}
              <Route element={<AdminRoute />}>
                <Route
                  path="admin"
                  element={
                    <Suspense fallback={<LoadingOverlay />}>
                      <AdminDashboard />
                    </Suspense>
                  }
                />
              </Route>
            </Routes>
          )}

          {/* Overlays mounted globally so they can open both from Home/Pages and Search */}
          {!isAuthPage && !isSetupPage && !isResetPage && (
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
  );
};

export default App;