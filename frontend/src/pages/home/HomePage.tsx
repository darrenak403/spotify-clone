import TopBar from "@/components/TopBar";
import type {useMusicStore} from "@/stores/useMusicStore";
import {useEffect} from "react";

const HomePage = () => {
  const {
    fetchFeaturedSongs,
    fetchMadeForYouSongs,
    fetchTrendingSongs,
    isLoading,
    madeForYouSongs,
    featuredSongs,
    trendingSongs,
  } = useMusicStore();

  useEffect(() => {
    fetchFeaturedSongs();
    fetchMadeForYouSongs();
    fetchTrendingSongs();
  }, [fetchFeaturedSongs, fetchMadeForYouSongs, fetchTrendingSongs]);

  return (
    <div className="rounded-md overflow-hidden">
      <TopBar />
    </div>
  );
};

export default HomePage;
