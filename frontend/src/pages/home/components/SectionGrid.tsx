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

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible">
        {songs.map((song: Song) => {
          const album = albums.find((item) => item._id === song.albumId);

          return (
            <div
              key={song._id}
              className="w-36 flex-shrink-0 sm:w-auto bg-zinc-800/40 p-4 rounded-md hover:bg-zinc-700/40 transition-all group cursor-pointer"
            >
              <div className="relative mb-4">
                <div className="aspect-square rounded-md shadow-lg overflow-hidden">
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
                  className="font-medium mb-2 truncate hover:underline block"
                  onClick={(event) => event.stopPropagation()}
                >
                  {song.title}
                </Link>
              ) : (
                <h3 className="font-medium mb-2 truncate">{song.title}</h3>
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
  );
};

export default memo(SectionGrid);
