import FeaturedGridSkeleton from "@/components/skeletons/FeatureGridSkeleton";
import {Button} from "@/components/ui/button";
import {useMusicStore} from "@/stores/useMusicStore";
import PlayButton from "./PlayButton";
import {Link} from "react-router-dom";
import {slugify} from "@/lib/slugify";
import {useAuth} from "@/providers/AuthProvider";
import SignInOAuthButtons from "@/components/SignInOAuthButton";

const FeaturedSection = () => {
  const {isLoading, featuredSongs, error, albums} = useMusicStore();
  const {user} = useAuth();

  if (isLoading) return <FeaturedGridSkeleton />;

  if (error === "unauthorized" && !user) {
    return (
      <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
        <p className="mb-4 text-sm text-zinc-400">
          Sign in to see featured picks made for you.
        </p>
        <div className="mx-auto max-w-[240px]">
          <SignInOAuthButtons />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
        <p className="text-sm text-zinc-400">
          Couldn't load featured songs. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold">Featured</h2>
        <Button
          variant="link"
          className="text-sm text-zinc-400 hover:text-white"
        >
          Show All
        </Button>
      </div>

      <div className="-mx-4 overflow-hidden sm:mx-0">
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-3">
          {featuredSongs.map((song) => {
            const album = albums.find((item) => item._id === song.albumId);

            return (
              <div
                key={song._id}
                className="flex w-[calc(100vw-48px)] max-w-[340px] shrink-0 snap-start items-center gap-3 rounded-2xl bg-zinc-800/50 p-3
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
        </div>
      </div>
    </div>
  );
};
export default FeaturedSection;
