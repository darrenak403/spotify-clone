import {NativeAudio} from "@capgo/capacitor-native-audio";
import type {PluginListenerHandle} from "@capacitor/core";
import {BaseAudioEngine, type AudioEngine, type TrackMetadata} from "./AudioEngine";

const ASSET_ID = "current-track";

export class NativeAudioEngine extends BaseAudioEngine implements AudioEngine {
  private ready: Promise<void>;
  private hasLoaded = false;
  private hasStartedOnce = false;
  private playingState = false;
  private currentTimeCache = 0;
  private durationCache = 0;

  private listenerHandles: PluginListenerHandle[] = [];

  // serializes load/play/pause/stop/seek/setVolume against the single fixed
  // assetId so rapid song-skipping can't interleave native calls out of order
  private queue: Promise<unknown> = Promise.resolve();

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = this.queue.then(task, task);
    this.queue = result.catch(() => undefined);
    return result;
  }

  constructor() {
    super();
    this.ready = NativeAudio.configure({
      focus: true,
      background: true,
      showNotification: true,
    });

    NativeAudio.addListener("complete", (event) => {
      if (event.assetId !== ASSET_ID) return;
      this.playingState = false;
      this.hasStartedOnce = false;
      this.stateCallback?.(false);
      this.endedCallback?.();
    }).then((handle) => this.listenerHandles.push(handle));

    NativeAudio.addListener("currentTime", (event) => {
      if (event.assetId !== ASSET_ID) return;
      this.currentTimeCache = event.currentTime;
      this.timeCallback?.(event.currentTime);
    }).then((handle) => this.listenerHandles.push(handle));

    NativeAudio.addListener("playbackState", (event) => {
      if (event.assetId !== ASSET_ID) return;
      this.playingState = event.isPlaying;
      if (typeof event.currentTime === "number") this.currentTimeCache = event.currentTime;
      if (typeof event.duration === "number") this.durationCache = event.duration;
      this.stateCallback?.(event.isPlaying);
    }).then((handle) => this.listenerHandles.push(handle));
  }

  /** Awaits configure() and reports whether an asset is currently preloaded. */
  private async ensureLoaded(): Promise<boolean> {
    await this.ready;
    return this.hasLoaded;
  }

  load(url: string, metadata?: TrackMetadata) {
    return this.enqueue(async () => {
      await this.ready;

      if (this.hasLoaded) {
        await NativeAudio.unload({assetId: ASSET_ID}).catch(() => undefined);
      }

      await NativeAudio.preload({
        assetId: ASSET_ID,
        assetPath: url,
        isUrl: true,
        notificationMetadata: metadata
          ? {
              title: metadata.title,
              artist: metadata.artist,
              album: metadata.album,
              artworkUrl: metadata.artworkUrl,
            }
          : undefined,
      });

      this.hasLoaded = true;
      this.hasStartedOnce = false;
      this.playingState = false;
      this.currentTimeCache = 0;

      const {duration} = await NativeAudio.getDuration({assetId: ASSET_ID});
      this.durationCache = duration;
      this.durationCallback?.(duration);
    });
  }

  play() {
    return this.enqueue(async () => {
      if (!(await this.ensureLoaded()) || this.playingState) return;

      if (!this.hasStartedOnce) {
        await NativeAudio.play({assetId: ASSET_ID});
        this.hasStartedOnce = true;
      } else {
        await NativeAudio.resume({assetId: ASSET_ID});
      }
      this.playingState = true;
    });
  }

  pause() {
    return this.enqueue(async () => {
      if (!(await this.ensureLoaded()) || !this.playingState) return;

      await NativeAudio.pause({assetId: ASSET_ID});
      this.playingState = false;
    });
  }

  stop() {
    return this.enqueue(async () => {
      if (!(await this.ensureLoaded())) return;

      await NativeAudio.stop({assetId: ASSET_ID}).catch(() => undefined);
      this.playingState = false;
      this.hasStartedOnce = false;
    });
  }

  seek(time: number) {
    return this.enqueue(async () => {
      if (!(await this.ensureLoaded())) return;

      await NativeAudio.setCurrentTime({assetId: ASSET_ID, time});
      this.currentTimeCache = time;
    });
  }

  setVolume(volume: number) {
    return this.enqueue(async () => {
      if (!(await this.ensureLoaded())) return;

      // plugin accepts 0.1-1.0; clamp to avoid rejecting a fully-muted slider position
      const clamped = Math.min(1, Math.max(0.1, volume));
      await NativeAudio.setVolume({assetId: ASSET_ID, volume: clamped});
    });
  }

  getCurrentTime() {
    return this.currentTimeCache;
  }

  getDuration() {
    return this.durationCache;
  }

  isPlaying() {
    return this.playingState;
  }

  destroy() {
    this.listenerHandles.forEach((handle) => handle.remove());
    this.listenerHandles = [];
    this.enqueue(async () => {
      if (this.hasLoaded) {
        await NativeAudio.unload({assetId: ASSET_ID}).catch(() => undefined);
        this.hasLoaded = false;
      }
    });
  }
}
