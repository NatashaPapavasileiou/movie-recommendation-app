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



const Home = ({handleMovieClick} : {handleMovieClick: (movieId:number) => void}) => {
  const chooseWhatToDisplay: ItemsCategory[] = [
    createDisplayItems(now_playing, "Now Playing"),
    createDisplayItems(popular, "Popular Movies"),
    createDisplayItems(upcoming, "Upcoming"),
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
        handleMovieClick={handleMovieClick} 
      />
        <DisplayItems displayTags={chooseWhatToDisplay} handleMovieClick={handleMovieClick}/>
      </div>
    </>
  );
};

export default Home;