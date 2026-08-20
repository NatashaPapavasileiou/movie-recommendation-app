import DisplayItems from "../components/DisplayItems";
import RecommendationsRow from "../components/RecommendationsRow";
import { createDisplayItems, type ItemsCategory } from "../modules/types_files";
import {
  airing_today,
  now_playing,
  popular,
  popularShows,
  trendingShows,
  upcoming,
} from "../modules/ApiLinks";



const Home = ({handleMovieClick, handleTvClick} : {handleMovieClick: (movieId:number) => void; handleTvClick: (tvId:number) => void}) => {
  const movieCategories: ItemsCategory[] = [
    createDisplayItems(now_playing, "Now Playing"),
    createDisplayItems(popular, "Popular Movies"),
    createDisplayItems(upcoming, "Upcoming"),
  ];

  const tvCategories: ItemsCategory[] = [
    createDisplayItems(trendingShows, "Trending Shows"),
    createDisplayItems(popularShows, "Popular Shows"),
    createDisplayItems(airing_today, "On Air Today"),
  ];

  return (
    <>
      <div>
      <RecommendationsRow 
        mediaType="movie" 
        itemHeading="Recommended Movies For You" 
        handleMovieClick={handleMovieClick} 
      />

      
      <RecommendationsRow 
        mediaType="tv" 
        itemHeading="Recommended TV Shows For You" 
        handleMovieClick={handleTvClick} 
      />
        <DisplayItems displayTags={movieCategories} handleMovieClick={handleMovieClick}/>
        <DisplayItems displayTags={tvCategories} handleMovieClick={handleTvClick}/>
      </div>
    </>
  );
};

export default Home;