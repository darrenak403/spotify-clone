import {Button} from "@/components/ui/button";
import {ScrollArea} from "@/components/ui/scroll-area";
import {getOptimizedImageUrl} from "@/lib/getOptimizedImageUrl";
import {useAuth} from "@/providers/AuthProvider";
import {useMusicStore} from "@/stores/useMusicStore";
import {usePlayerStore} from "@/stores/usePlayerStore";
import {Clock, Pause, Play} from "lucide-react";
import {useEffect} from "react";
import {useParams} from "react-router-dom";
import toast from "react-hot-toast";

const formatDuration = (duration: number) => {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
};

const AlbumPage = () => {
  const {slug} = useParams();
  const {fetchAlbumById, currentAlbum, isLoading} = useMusicStore();
  const {currentSong, isPlaying, playAlbum, togglePlay} = usePlayerStore();
  const {user, signInWithGoogle} = useAuth();

  useEffect(() => {
    if (slug) fetchAlbumById(slug);
  }, [fetchAlbumById, slug]);

  if (isLoading) return null;

  const requireAuth = () => {
    if (user) return true;
    toast.error("Sign in to play music");
    signInWithGoogle();
    return false;
  };

  const handlePlayAlbum = () => {
    if (!currentAlbum || !requireAuth()) return;

    const isCurrentAlbumPlaying = currentAlbum?.songs.some(
      (song) => song._id === currentSong?._id
    );
    if (isCurrentAlbumPlaying) togglePlay();
    else {
      // start playing the album from the beginning
      playAlbum(currentAlbum?.songs, 0);
    }
  };

  const handlePlaySong = (index: number) => {
    if (!currentAlbum || !requireAuth()) return;

    playAlbum(currentAlbum?.songs, index);
  };
  return (
    <div className="h-full">
      <ScrollArea className="h-full rounded-md">
        {/* Main content */}
        <div className="relative min-h-full">
          {/* bg gradient */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-[#5038a0]/80 via-zinc-900/80
					 to-zinc-900 pointer-events-none"
            aria-hidden="true"
          />

          {/* Content */}
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row p-4 sm:p-6 gap-4 sm:gap-6 pb-8">
              <img
                src={
                  currentAlbum?.imageUrl
                    ? getOptimizedImageUrl(currentAlbum.imageUrl)
                    : currentAlbum?.imageUrl
                }
                alt={currentAlbum?.title}
                loading="lazy"
                className="w-32 h-32 sm:w-[240px] sm:h-[240px] shadow-xl rounded self-center sm:self-auto"
              />
              <div className="flex flex-col justify-end text-center sm:text-left">
                <p className="text-sm font-medium">Album</p>
                <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold my-4 break-words">
                  {currentAlbum?.title}
                </h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-sm text-zinc-100">
                  <span className="font-medium text-white">
                    {currentAlbum?.artist}
                  </span>
                  <span>• {currentAlbum?.songs.length} songs</span>
                  <span>• {currentAlbum?.releaseYear}</span>
                </div>
              </div>
            </div>

            {/* play button */}
            <div className="px-6 pb-4 flex items-center gap-6">
              <Button
                onClick={handlePlayAlbum}
                size="icon"
                className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-400 
                hover:scale-105 transition-all"
              >
                {isPlaying &&
                currentAlbum?.songs.some(
                  (song) => song._id === currentSong?._id
                ) ? (
                  <Pause className="h-7 w-7 text-black" />
                ) : (
                  <Play className="h-7 w-7 text-black" />
                )}
              </Button>
            </div>
            {/* Table Section */}
            <div className="bg-black/20 backdrop-blur-sm">
              {/* table header */}
              <div
                className="grid grid-cols-[16px_4fr_1fr] sm:grid-cols-[16px_4fr_2fr_1fr] gap-4 px-4 sm:px-10 py-2 text-sm
            text-zinc-400 border-b border-white/5"
              >
                <div>#</div>
                <div>Title</div>
                <div className="hidden sm:block">Released Date</div>
                <div>
                  <Clock className="h-4 w-4" />
                </div>
              </div>

              {/* Song lists */}
              <div className="px-2 sm:px-6">
                <div className="space-y-2 py-4">
                  {currentAlbum?.songs.map((song, index) => {
                    const isCurrentSong = currentSong?._id === song._id;

                    return (
                      <div
                        key={song._id}
                        onClick={() => handlePlaySong(index)}
                        className="grid grid-cols-[16px_4fr_1fr] sm:grid-cols-[16px_4fr_2fr_1fr] gap-4 px-2 sm:px-4 py-2 text-sm
                      text-zinc-400 hover:bg-white/5 rounded-md group cursor-pointer"
                      >
                        <div className="flex items-center justify-center">
                          {isCurrentSong && isPlaying ? (
                            <div className="size-4 text-green-500">♫</div>
                          ) : (
                            <span className="group-hover:hidden">
                              {index + 1}
                            </span>
                          )}
                          {!isCurrentSong && (
                            <Play className="h-4 w-4 hidden group-hover:block" />
                          )}
                        </div>

                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={getOptimizedImageUrl(song.imageUrl)}
                            alt={song.title}
                            loading="lazy"
                            className="size-10 shrink-0"
                          />

                          <div className="min-w-0">
                            <div className="font-medium text-white truncate">
                              {song.title}
                            </div>
                            <div className="truncate">{song.artist}</div>
                          </div>
                        </div>
                        <div className="hidden sm:flex items-center">
                          {song.createdAt.split("T")[0]}
                        </div>
                        <div className="flex items-center">
                          {formatDuration(song.duration)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default AlbumPage;
