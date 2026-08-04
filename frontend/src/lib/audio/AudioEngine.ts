export interface TrackMetadata {
  title: string;
  artist?: string;
  album?: string;
  artworkUrl?: string;
}

export interface AudioEngine {
  load(url: string, metadata?: TrackMetadata): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  seek(time: number): Promise<void>;
  setVolume(volume: number): Promise<void>;
  getCurrentTime(): number;
  getDuration(): number;
  isPlaying(): boolean;

  onEnded(callback: () => void): void;
  onPlaybackStateChanged(callback: (isPlaying: boolean) => void): void;
  onTimeUpdate(callback: (currentTime: number) => void): void;
  onDurationChange(callback: (duration: number) => void): void;

  destroy(): void;
}

/** Shared callback-registration plumbing for AudioEngine implementations. */
export abstract class BaseAudioEngine {
  protected endedCallback: (() => void) | null = null;
  protected stateCallback: ((isPlaying: boolean) => void) | null = null;
  protected timeCallback: ((time: number) => void) | null = null;
  protected durationCallback: ((duration: number) => void) | null = null;

  onEnded(callback: () => void) {
    this.endedCallback = callback;
  }

  onPlaybackStateChanged(callback: (isPlaying: boolean) => void) {
    this.stateCallback = callback;
  }

  onTimeUpdate(callback: (time: number) => void) {
    this.timeCallback = callback;
  }

  onDurationChange(callback: (duration: number) => void) {
    this.durationCallback = callback;
  }
}
