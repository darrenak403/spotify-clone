import FeaturedGridSkeleton from "@/components/skeletons/FeatureGridSkeleton";
import {useMusicStore} from "@/stores/useMusicStore";
import PlayButton from "./PlayButton";
import {Link} from "react-router-dom";
import {slugify} from "@/lib/slugify";
// import FeaturedGridSkeleton from "@/components/skeletons/FeaturedGridSkeleton";
// import PlayButton from "./PlayButton";

const FeaturedSection = () => {
  const {isLoading, featuredSongs, error, albums} = useMusicStore();

  if (isLoading) return <FeaturedGridSkeleton />;

  if (error) return <p className="text-red-500 mb-4 text-lg">{error}</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {featuredSongs.map((song) => {
        const album = albums.find((item) => item._id === song.albumId);

        return (
          <div
            key={song._id}
            className="flex items-center bg-zinc-800/50 rounded-md overflow-hidden
           hover:bg-zinc-700/50 transition-colors group cursor-pointer relative"
          >
            {album ? (
              <Link to={`/albums/${album.slug}`} className="flex-shrink-0">
                <img
                  src={song.imageUrl}
                  alt={song.title}
                  className="w-16 sm:w-20 h-16 sm:h-20 object-cover"
                />
              </Link>
            ) : (
              <img
                src={song.imageUrl}
                alt={song.title}
                className="w-16 sm:w-20 h-16 sm:h-20 object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 p-4">
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
            {/* //Todo: add play button */}
            <PlayButton song={song} />
          </div>
        );
      })}
    </div>
  );
};
export default FeaturedSection;
