import {BaseAudioEngine, type AudioEngine} from "./AudioEngine";

export class WebAudioEngine extends BaseAudioEngine implements AudioEngine {
  private audio = new Audio();

  constructor() {
    super();
    this.audio.addEventListener("ended", () => this.endedCallback?.());
    this.audio.addEventListener("play", () => this.stateCallback?.(true));
    this.audio.addEventListener("pause", () => this.stateCallback?.(false));
    this.audio.addEventListener("timeupdate", () =>
      this.timeCallback?.(this.audio.currentTime)
    );
    this.audio.addEventListener("loadedmetadata", () =>
      this.durationCallback?.(this.audio.duration)
    );
  }

  async load(url: string) {
    this.audio.src = url;
    this.audio.currentTime = 0;
  }

  async play() {
    await this.audio.play();
  }

  async pause() {
    this.audio.pause();
  }

  async stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  async seek(time: number) {
    this.audio.currentTime = time;
  }

  async setVolume(volume: number) {
    this.audio.volume = Math.min(1, Math.max(0, volume));
  }

  getCurrentTime() {
    return this.audio.currentTime;
  }

  getDuration() {
    return this.audio.duration || 0;
  }

  isPlaying() {
    return !this.audio.paused;
  }

  destroy() {
    this.audio.pause();
    this.audio.src = "";
  }
}
