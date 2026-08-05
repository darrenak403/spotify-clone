import {Button} from "@/components/ui/button";
import {useAuth} from "@/providers/AuthProvider";
import {usePlayerStore} from "@/stores/usePlayerStore";
import type {Song} from "@/types";
import {Pause, Play} from "lucide-react";
import toast from "react-hot-toast";

const PlayButton = ({song}: {song: Song}) => {
  const {currentSong, isPlaying, setCurrentSong, togglePlay} = usePlayerStore();
  const {user, signInWithGoogle} = useAuth();
  const isCurrentSong = currentSong?._id === song._id;

  const handlePlay = () => {
    if (!user) {
      toast.error("Sign in to play music");
      signInWithGoogle();
      return;
    }

    if (isCurrentSong) {
      togglePlay();
    } else {
      setCurrentSong(song);
    }
  };

  const isCurrentlyPlaying = isCurrentSong && isPlaying;

  return (
    <Button
      size={"icon"}
      onClick={handlePlay}
      aria-label={`${isCurrentlyPlaying ? "Pause" : "Play"} ${song.title}`}
      className={`absolute bottom-3 right-2 bg-green-500 hover:bg-green-400 hover:scale-105 transition-all
				opacity-0 translate-y-2 group-hover:translate-y-0 ${
          isCurrentSong ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
    >
      {isCurrentSong && isPlaying ? (
        <Pause className="size-5 text-black" />
      ) : (
        <Play className="size-5 text-black" />
      )}
    </Button>
  );
};

export default PlayButton;
