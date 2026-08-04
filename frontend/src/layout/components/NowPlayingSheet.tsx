import {Slider} from "@/components/ui/slider";
import {getOptimizedImageUrl} from "@/lib/getOptimizedImageUrl";
import {usePlaybackProgress} from "@/hooks/usePlaybackProgress";
import {usePlayerStore} from "@/stores/usePlayerStore";
import {
  ChevronDown,
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

interface NowPlayingSheetProps {
  onClose: () => void;
}

const NowPlayingSheet = ({onClose}: NowPlayingSheetProps) => {
  const {currentSong, isPlaying, togglePlay, playNext, playPrevious} =
    usePlayerStore();
  const {engine, currentTime, duration, setCurrentTime} =
    usePlaybackProgress();

  if (!currentSong) return null;

  return (
    <div className="h-full flex flex-col px-6 pt-[calc(env(safe-area-inset-top)+16px)] pb-[calc(env(safe-area-inset-bottom)+24px)]">
      <button
        onClick={onClose}
        className="self-start p-2 -ml-2 text-zinc-300"
        aria-label="Back"
      >
        <ChevronDown className="size-6" />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <img
          src={getOptimizedImageUrl(currentSong.imageUrl)}
          alt={currentSong.title}
          className="w-full max-w-xs aspect-square rounded-lg object-cover shadow-xl"
        />

        <div className="text-center w-full">
          <h2 className="text-xl font-bold truncate">{currentSong.title}</h2>
          <p className="text-zinc-400 truncate">{currentSong.artist}</p>
        </div>

        <div className="w-full">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            className="w-full hover:cursor-grab active:cursor-grabbing"
            onValueChange={(value) => setCurrentTime(value[0])}
            onValueCommit={(value) => engine.seek(value[0])}
          />
          <div className="flex justify-between text-xs text-zinc-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <button
            disabled
            aria-disabled
            title="Coming soon"
            className="text-zinc-600 cursor-not-allowed"
          >
            <Shuffle className="size-5" />
          </button>
          <button
            onClick={playPrevious}
            disabled={!currentSong}
            className="text-white hover:text-emerald-400 disabled:text-zinc-600"
            aria-label="Previous"
          >
            <SkipBack className="size-7" />
          </button>
          <button
            onClick={togglePlay}
            disabled={!currentSong}
            className="flex items-center justify-center size-16 rounded-full bg-white text-black disabled:opacity-50"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="size-7" />
            ) : (
              <Play className="size-7" />
            )}
          </button>
          <button
            onClick={playNext}
            disabled={!currentSong}
            className="text-white hover:text-emerald-400 disabled:text-zinc-600"
            aria-label="Next"
          >
            <SkipForward className="size-7" />
          </button>
          <button
            disabled
            aria-disabled
            title="Coming soon"
            className="text-zinc-600 cursor-not-allowed"
          >
            <Repeat className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NowPlayingSheet;
