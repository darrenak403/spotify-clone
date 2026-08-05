import type {Song} from "@/types";
import SectionGridSkeleton from "./SectionGridSkeleton";
import PlayButton from "./PlayButton";
import {getOptimizedImageUrl} from "@/lib/getOptimizedImageUrl";
import {Link} from "react-router-dom";
import {slugify} from "@/lib/slugify";
import {useMusicStore} from "@/stores/useMusicStore";
import HorizontalMusicSection from "./HorizontalMusicSection";
import {memo, type FC} from "react";

type TrendingSectionProps = {
  songs: Song[];
  isLoading: boolean;
};

const TrendingSection: FC<TrendingSectionProps> = ({songs, isLoading}) => {
  const albums = useMusicStore((state) => state.albums);

  if (isLoading) return <SectionGridSkeleton />;

  return (
    <HorizontalMusicSection
      title="Trending"
      ariaLabel="Trending songs"
      className="sm:grid-cols-2 lg:grid-cols-4"
    >
      {songs.map((song, index) => {
        const album = albums.find((item) => item._id === song.albumId);
        const rank = index + 1;

        return (
          <div
            key={song._id}
            className="w-[146px] min-[360px]:w-[158px] min-[400px]:w-[172px] shrink-0 snap-start rounded-[18px] bg-zinc-900 p-2.5 hover:bg-zinc-800 transition-all group cursor-pointer sm:w-auto sm:rounded-md sm:bg-zinc-800/40 sm:p-4 sm:hover:bg-zinc-700/40"
          >
            <div className="relative mb-4">
              <div className="aspect-square rounded-2xl sm:rounded-md shadow-lg overflow-hidden">
                <img
                  src={getOptimizedImageUrl(song.imageUrl)}
                  alt={song.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <PlayButton song={song} />
              </div>
              {rank <= 3 && (
                <span className="absolute left-1.5 top-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-bold text-emerald-400 backdrop-blur-sm">
                  {String(rank).padStart(2, "0")}
                </span>
              )}
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
              className="text-xs text-zinc-400 truncate hover:underline hover:text-white block"
              onClick={(event) => event.stopPropagation()}
            >
              {song.artist}
            </Link>
          </div>
        );
      })}
    </HorizontalMusicSection>
  );
};

export default memo(TrendingSection);
