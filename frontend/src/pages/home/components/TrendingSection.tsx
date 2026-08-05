import type {Song} from "@/types";
import SectionGridSkeleton from "./SectionGridSkeleton";
import SectionGrid from "./SectionGrid";
import SongRow from "@/components/SongRow";
import {Button} from "@/components/ui/button";
import {memo, type FC} from "react";

type TrendingSectionProps = {
  songs: Song[];
  isLoading: boolean;
};

const TrendingSection: FC<TrendingSectionProps> = ({songs, isLoading}) => {
  if (isLoading) return <SectionGridSkeleton />;

  return (
    <>
      {/* Mobile: compact song-list rows */}
      <div className="sm:hidden">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Trending</h2>
          <Button
            variant="link"
            className="text-sm text-zinc-400 hover:text-white"
          >
            Show All
          </Button>
        </div>
        <div className="min-w-0">
          {songs.map((song, index) => (
            <SongRow key={song._id} song={song} songs={songs} index={index} />
          ))}
        </div>
      </div>

      {/* Desktop: unchanged card grid */}
      <div className="hidden sm:block">
        <SectionGrid title="Trending" songs={songs} isLoading={isLoading} />
      </div>
    </>
  );
};

export default memo(TrendingSection);
