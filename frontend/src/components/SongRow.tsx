import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {getOptimizedImageUrl} from "@/lib/getOptimizedImageUrl";
import {slugify} from "@/lib/slugify";
import {cn} from "@/lib/utils";
import {useAuth} from "@/providers/AuthProvider";
import {usePlayerStore} from "@/stores/usePlayerStore";
import type {Song} from "@/types";
import {ListMusic, ListPlus, MoreVertical, Share2, User} from "lucide-react";
import toast from "react-hot-toast";
import {useNavigate} from "react-router-dom";

interface SongRowProps {
  song: Song;
  // The list this row belongs to — playing it starts the queue from `index`.
  songs: Song[];
  index: number;
}

const SongRow = ({song, songs, index}: SongRowProps) => {
  const {currentSong, isPlaying, playAlbum, togglePlay, addToQueue} =
    usePlayerStore();
  const {user, signInWithGoogle} = useAuth();
  const navigate = useNavigate();
  const isCurrent = currentSong?._id === song._id;

  const handlePlay = () => {
    if (!user) {
      toast.error("Sign in to play music");
      signInWithGoogle();
      return;
    }
    if (isCurrent) togglePlay();
    else playAlbum(songs, index);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/artists/${slugify(song.artist)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: song.title,
          text: `${song.title} — ${song.artist}`,
          url,
        });
      } catch {
        // user dismissed the native share sheet — not an error
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-2 py-2 rounded-md min-h-[68px]",
        isCurrent ? "bg-emerald-500/10" : "hover:bg-white/5"
      )}
    >
      <button
        onClick={handlePlay}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
      >
        <img
          src={getOptimizedImageUrl(song.imageUrl)}
          alt={song.title}
          loading="lazy"
          className="size-14 rounded-md object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "truncate font-medium",
              isCurrent ? "text-emerald-500" : "text-white"
            )}
          >
            {song.title}
          </p>
          <p className="truncate text-sm text-zinc-400">{song.artist}</p>
        </div>
      </button>

      {isCurrent && isPlaying && (
        <span className="sr-only">Currently playing</span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Song actions"
            className="p-2 text-zinc-400 hover:text-white flex-shrink-0"
          >
            <MoreVertical className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              addToQueue(song);
              toast.success("Added to queue");
            }}
          >
            <ListPlus /> Add to queue
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => toast("Playlists coming soon")}
          >
            <ListMusic /> Add to playlist
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => navigate(`/artists/${slugify(song.artist)}`)}
          >
            <User /> View artist
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShare}>
            <Share2 /> Share
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SongRow;
