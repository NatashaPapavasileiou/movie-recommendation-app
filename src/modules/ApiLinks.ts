 
export const apiKey = import.meta.env.VITE_TMDB_API_KEY;
export const baseUrl = "https://api.themoviedb.org/3";

//Movies Endpoints to fetch information 
export const popular = `${baseUrl}/movie/popular?api_key=${apiKey}`
export const upcoming = `${baseUrl}/movie/upcoming?api_key=${apiKey}`;
export const now_playing = `${baseUrl}/movie/now_playing?api_key=${apiKey}`;
export const top_rated_movies = `${baseUrl}/movie/top_rated?api_key=${apiKey}`;


//*TV SHOWS Endpoint :-
export const popularShows = `${baseUrl}/tv/popular?api_key=${apiKey}`;
export const trendingShows = `${baseUrl}/trending/tv/week?api_key=${apiKey}`;
export const top_rated_shows = `${baseUrl}/tv/top_rated?api_key=${apiKey}`;
export const airing_today = `${baseUrl}/tv/airing_today?api_key=${apiKey}`;

