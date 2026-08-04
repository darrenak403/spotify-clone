import {Capacitor, registerPlugin} from "@capacitor/core";
import type {PluginListenerHandle} from "@capacitor/core";

interface IOSRemoteControlsPlugin {
  addListener(
    eventName: "nextTrack" | "previousTrack" | "audioInterrupted" | "audioRouteChanged",
    listenerFunc: () => void
  ): Promise<PluginListenerHandle>;
}

const IOSRemoteControls = registerPlugin<IOSRemoteControlsPlugin>("IOSRemoteControls");

interface RemoteControlHandlers {
  onNext: () => void;
  onPrevious: () => void;
  onInterrupted: () => void;
  onRouteChanged: () => void;
}

// no-op on web/Android — this plugin only exists in the iOS native project
export const setupIOSRemoteControls = (handlers: RemoteControlHandlers): (() => void) => {
  if (Capacitor.getPlatform() !== "ios") return () => undefined;

  const handles = [
    IOSRemoteControls.addListener("nextTrack", handlers.onNext),
    IOSRemoteControls.addListener("previousTrack", handlers.onPrevious),
    IOSRemoteControls.addListener("audioInterrupted", handlers.onInterrupted),
    IOSRemoteControls.addListener("audioRouteChanged", handlers.onRouteChanged),
  ];

  return () => {
    handles.forEach((handlePromise) => handlePromise.then((handle) => handle.remove()));
  };
};
