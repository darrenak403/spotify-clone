import {usePlayerStore} from "@/stores/usePlayerStore";
import {useEffect, useRef} from "react";
import {getAudioEngine} from "@/lib/audio";
import {setupIOSRemoteControls} from "@/lib/audio/remoteControls";

const AudioPlayer = () => {
  const prevSongRef = useRef<string | null>(null);
  const engineRef = useRef<ReturnType<typeof getAudioEngine> | null>(null);
  if (!engineRef.current) engineRef.current = getAudioEngine();
  const engine = engineRef.current;

  const {currentSong, isPlaying} = usePlayerStore();

  // wire native/engine callbacks once
  useEffect(() => {
    engine.onEnded(() => usePlayerStore.getState().playNext());
    engine.onPlaybackStateChanged((playing) => usePlayerStore.getState().syncPlaybackState(playing));

    // engine.pause() itself fires onPlaybackStateChanged, which syncs the store —
    // no need to also set state here
    const pauseFromSystemEvent = () => engine.pause();

    const cleanup = setupIOSRemoteControls({
      onNext: () => usePlayerStore.getState().playNext(),
      onPrevious: () => usePlayerStore.getState().playPrevious(),
      onInterrupted: pauseFromSystemEvent,
      onRouteChanged: pauseFromSystemEvent,
    });

    return cleanup;
  }, [engine]);

  // handle play/pause
  useEffect(() => {
    if (isPlaying) engine.play();
    else engine.pause();
  }, [isPlaying, engine]);

  // handle song changes
  useEffect(() => {
    if (!currentSong) return;

    const isSongChanged = prevSongRef.current !== currentSong.audioUrl;
    if (isSongChanged) {
      prevSongRef.current = currentSong.audioUrl;
      engine
        .load(currentSong.audioUrl, {
          title: currentSong.title,
          artist: currentSong.artist,
          artworkUrl: currentSong.imageUrl,
        })
        .then(() => {
          if (usePlayerStore.getState().isPlaying) return engine.play();
        })
        .catch((error) => {
          console.error("Failed to load track:", error);
          usePlayerStore.getState().syncPlaybackState(false);
        });
    }
  }, [currentSong, engine]);

  return null;
};

export default AudioPlayer;
