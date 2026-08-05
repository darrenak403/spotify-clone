import {Sheet, SheetContent, SheetTitle} from "@/components/ui/sheet";
import {getOptimizedImageUrl} from "@/lib/getOptimizedImageUrl";
import {usePlaybackProgress} from "@/hooks/usePlaybackProgress";
import {usePlayerStore} from "@/stores/usePlayerStore";
import {Pause, Play} from "lucide-react";
import {useState} from "react";
import NowPlayingSheet from "./NowPlayingSheet";

const MiniPlayer = () => {
  const {currentSong, isPlaying, togglePlay} = usePlayerStore();
  const {currentTime, duration} = usePlaybackProgress();
  const [open, setOpen] = useState(false);

  if (!currentSong) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Enter" && setOpen(true)}
        className="relative flex items-center gap-3 h-16 px-3 bg-zinc-800 border-t border-zinc-700 cursor-pointer"
      >
        <div
          className="absolute top-0 left-0 h-0.5 bg-emerald-500"
          style={{width: `${progress}%`}}
        />
        <img
          src={getOptimizedImageUrl(currentSong.imageUrl)}
          alt={currentSong.title}
          loading="lazy"
          className="size-10 rounded object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-white">
            {currentSong.title}
          </p>
          <p className="truncate text-xs text-zinc-400">
            {currentSong.artist}
          </p>
        </div>
        <button
          aria-label={isPlaying ? "Pause" : "Play"}
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="flex items-center justify-center size-10 rounded-full bg-white text-black flex-shrink-0"
        >
          {isPlaying ? (
            <Pause className="size-5" />
          ) : (
            <Play className="size-5" />
          )}
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent showCloseButton={false}>
          <SheetTitle className="sr-only">Now Playing</SheetTitle>
          <NowPlayingSheet onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MiniPlayer;
