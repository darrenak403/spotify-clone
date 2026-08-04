import {Capacitor} from "@capacitor/core";
import type {AudioEngine} from "./AudioEngine";
import {WebAudioEngine} from "./WebAudioEngine";
import {NativeAudioEngine} from "./NativeAudioEngine";

let engine: AudioEngine | null = null;

export const getAudioEngine = (): AudioEngine => {
  if (!engine) {
    engine = Capacitor.isNativePlatform() ? new NativeAudioEngine() : new WebAudioEngine();
  }
  return engine;
};

export type {AudioEngine, TrackMetadata} from "./AudioEngine";
