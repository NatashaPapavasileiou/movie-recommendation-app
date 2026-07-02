import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { supabase } from "../modules/supabaseClient";
import { baseUrl, apiKey } from "../modules/ApiLinks";
import { type DataTypes } from "../modules/types_files";

export const useAppLogic = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [searchResults, setSearchResults] = useState<DataTypes[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [buffering, setBuffering] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isMovieModalOpen, setIsMovieModalOpen] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null); 
  const [isTvModalOpen, setIsTvModalOpen] = useState(false);
  const [selectedTvId, setSelectedTvId] = useState<number | null>(null);      
  
  const [session, setSession] = useState<any>(null); 

  const handleMovieClick = (movieId: number) => {
    setSelectedMovieId(movieId);
    setIsMovieModalOpen(true);
  };
  
  const handleTvClick = (tvId: number) => {
    setSelectedTvId(tvId);
    setIsTvModalOpen(true);
  };

  const checkSetupStatus = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("has_completed_setup")
        .eq("id", userId)
        .single();

      if (data && !data.has_completed_setup && !location.pathname.includes("setup-preferences")) {
        navigate("/setup-preferences");
      }
    } catch (err) {
      console.error("Error checking setup status:", err);
    }
  };

  // Auth session listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) checkSetupStatus(session.user.id); 
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) checkSetupStatus(session.user.id); 
    });

    return () => subscription.unsubscribe();
  }, [location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    navigate("/auth");
  };

  // Page transition buffering effect
  useEffect(() => {
    setBuffering(true);
    const timeout = setTimeout(() => {
      setBuffering(false);
    }, 1000);
    window.scrollTo(0, 0);
    return () => {
      clearTimeout(timeout);
      setSearchQuery("");
    };
  }, [location.pathname]);

  // TMDB Multi-search API fetch
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchQuery) {
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const searchUrl = `${baseUrl}/search/multi?query=${searchQuery}&api_key=${apiKey}`;
        const response = await axios.get(searchUrl);
        const data = response.data;
        setSearchResults(data.results || []);
      } catch (error) {
        console.error("Error fetching search results:", error);
      }
    };

    fetchSearchResults();
  }, [searchQuery]);

  const isAuthPage = location.pathname.includes("auth");
  const isSetupPage = location.pathname.includes("setup-preferences"); 

  return {
    searchResults,
    isSearching,
    buffering,
    searchQuery,
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
  };
};