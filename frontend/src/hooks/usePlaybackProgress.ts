import {getAudioEngine} from "@/lib/audio";
import {usePlayerStore} from "@/stores/usePlayerStore";
import {useEffect, useRef, useState} from "react";

// Shared engine time/duration subscription — used by desktop PlaybackControls
// and the mobile MiniPlayer/NowPlayingSheet pair so all three stay in sync
// without each re-subscribing to the audio engine independently.
export const usePlaybackProgress = () => {
  const currentSong = usePlayerStore((state) => state.currentSong);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const engineRef = useRef<ReturnType<typeof getAudioEngine> | null>(null);
  if (!engineRef.current) engineRef.current = getAudioEngine();
  const engine = engineRef.current;

  useEffect(() => {
    // round to whole seconds — matches formatTime's display granularity and
    // avoids re-rendering on every 100ms native tick / browser timeupdate
    engine.onTimeUpdate((time) => {
      setCurrentTime((prev) => {
        const rounded = Math.floor(time);
        return prev === rounded ? prev : rounded;
      });
    });
    engine.onDurationChange(setDuration);
  }, [engine]);

  useEffect(() => {
    setCurrentTime(0);
  }, [currentSong]);

  return {engine, currentTime, duration, setCurrentTime};
};
