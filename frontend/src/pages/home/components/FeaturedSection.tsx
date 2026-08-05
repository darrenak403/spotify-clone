import FeaturedGridSkeleton from "@/components/skeletons/FeatureGridSkeleton";
import {useMusicStore} from "@/stores/useMusicStore";
import PlayButton from "./PlayButton";
import {Link} from "react-router-dom";
import {slugify} from "@/lib/slugify";
import GuestRecommendationCard from "./GuestRecommendationCard";
import RecommendationErrorState from "./RecommendationErrorState";
import {asErrorStateTag} from "@/lib/getRecommendationState";
import HorizontalMusicSection from "./HorizontalMusicSection";

const FeaturedSection = () => {
  const {isLoading, featuredSongs, error, albums, fetchFeaturedSongs} = useMusicStore();

  if (isLoading) return <FeaturedGridSkeleton />;

  if (error === "guest") return <GuestRecommendationCard />;

  if (error) {
    return <RecommendationErrorState tag={asErrorStateTag(error)} onRetry={fetchFeaturedSongs} />;
  }

  return (
    <HorizontalMusicSection
      title="Featured"
      ariaLabel="Featured songs"
      className="sm:grid-cols-2 lg:grid-cols-3"
    >
      {featuredSongs.map((song) => {
        const album = albums.find((item) => item._id === song.albumId);

        return (
          <div
            key={song._id}
            className="flex w-[calc(100vw-48px)] min-w-[270px] max-w-[340px] shrink-0 snap-start items-center gap-3 rounded-2xl bg-zinc-800/50 p-3
         hover:bg-zinc-700/50 transition-colors group cursor-pointer relative sm:w-auto sm:max-w-none sm:gap-0 sm:rounded-md sm:p-0"
          >
            {album ? (
              <Link to={`/albums/${album.slug}`} className="flex-shrink-0">
                <img
                  src={song.imageUrl}
                  alt={song.title}
                  className="size-[88px] rounded-xl object-cover sm:size-20 sm:rounded-none"
                />
              </Link>
            ) : (
              <img
                src={song.imageUrl}
                alt={song.title}
                className="size-[88px] rounded-xl object-cover flex-shrink-0 sm:size-20 sm:rounded-none"
              />
            )}
            <div className="min-w-0 flex-1 sm:p-4">
              {album ? (
                <Link
                  to={`/albums/${album.slug}`}
                  className="font-medium truncate hover:underline block"
                  onClick={(event) => event.stopPropagation()}
                >
                  {song.title}
                </Link>
              ) : (
                <p className="font-medium truncate">{song.title}</p>
              )}
              <Link
                to={`/artists/${slugify(song.artist)}`}
                className="text-sm text-zinc-400 truncate hover:underline hover:text-white block"
                onClick={(event) => event.stopPropagation()}
              >
                {song.artist}
              </Link>
            </div>
            <PlayButton song={song} />
          </div>
        );
      })}
    </HorizontalMusicSection>
  );
};
export default FeaturedSection;
