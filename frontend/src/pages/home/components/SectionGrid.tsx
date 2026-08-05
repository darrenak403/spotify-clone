import type {Song} from "@/types";
import SectionGridSkeleton from "./SectionGridSkeleton";
import {Button} from "@/components/ui/button";
import {memo, type FC} from "react";
import PlayButton from "./PlayButton";
import {getOptimizedImageUrl} from "@/lib/getOptimizedImageUrl";
import {Link} from "react-router-dom";
import {slugify} from "@/lib/slugify";
import {useMusicStore} from "@/stores/useMusicStore";

type SectionGridProps = {
  title: string;
  songs: Song[];
  isLoading: boolean;
};
const SectionGrid: FC<SectionGridProps> = ({title, songs, isLoading}) => {
  const albums = useMusicStore((state) => state.albums);

  if (isLoading) return <SectionGridSkeleton />;
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
        <Button
          variant="link"
          className="text-sm text-zinc-400 hover:text-white"
        >
          Show All
        </Button>
      </div>

      <div className="-mx-4 overflow-hidden sm:mx-0">
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {songs.map((song: Song) => {
            const album = albums.find((item) => item._id === song.albumId);

            return (
              <div
                key={song._id}
                className="w-[156px] shrink-0 snap-start rounded-2xl bg-zinc-900 p-3 hover:bg-zinc-800 transition-all group cursor-pointer max-[359px]:w-36 sm:w-auto sm:rounded-md sm:bg-zinc-800/40 sm:p-4 sm:hover:bg-zinc-700/40"
              >
                <div className="relative mb-4">
                  <div className="aspect-square rounded-xl sm:rounded-md shadow-lg overflow-hidden">
                    <img
                      src={getOptimizedImageUrl(song.imageUrl)}
                      alt={song.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* TODO: ADD play button */}
                    <PlayButton song={song} />
                  </div>
                </div>
                {album ? (
                  <Link
                    to={`/albums/${album.slug}`}
                    className="font-medium mb-1 truncate hover:underline block"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {song.title}
                  </Link>
                ) : (
                  <h3 className="font-medium mb-1 truncate">{song.title}</h3>
                )}
                <Link
                  to={`/artists/${slugify(song.artist)}`}
                  className="text-sm text-zinc-400 truncate hover:underline hover:text-white block"
                  onClick={(event) => event.stopPropagation()}
                >
                  {song.artist}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default memo(SectionGrid);
