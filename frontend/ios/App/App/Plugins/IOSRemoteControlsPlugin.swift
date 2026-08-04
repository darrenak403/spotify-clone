import Foundation
import Capacitor
import MediaPlayer
import AVFoundation

/// Bridges iOS lock-screen/Control Center transport commands (next/previous — not
/// covered by the native audio plugin on iOS) and AVAudioSession interruption/route
/// changes into JS events. All playback decisions stay in the web layer.
@objc(IOSRemoteControlsPlugin)
public class IOSRemoteControlsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "IOSRemoteControlsPlugin"
    public let jsName = "IOSRemoteControls"
    public let pluginMethods: [CAPPluginMethod] = []

    override public func load() {
        let commandCenter = MPRemoteCommandCenter.shared()

        commandCenter.nextTrackCommand.isEnabled = true
        commandCenter.nextTrackCommand.addTarget { [weak self] _ in
            self?.notifyListeners("nextTrack", data: [:])
            return .success
        }

        commandCenter.previousTrackCommand.isEnabled = true
        commandCenter.previousTrackCommand.addTarget { [weak self] _ in
            self?.notifyListeners("previousTrack", data: [:])
            return .success
        }

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleInterruption(_:)),
            name: AVAudioSession.interruptionNotification,
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleRouteChange(_:)),
            name: AVAudioSession.routeChangeNotification,
            object: nil
        )
    }

    @objc private func handleInterruption(_ notification: Notification) {
        guard
            let userInfo = notification.userInfo,
            let typeValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
            let type = AVAudioSession.InterruptionType(rawValue: typeValue)
        else { return }

        // Only forward the start of an interruption (e.g. incoming call). We deliberately
        // never auto-resume on `.ended`, even if the system suggests it — the user must
        // explicitly resume from the UI or lock screen.
        if type == .began {
            notifyListeners("audioInterrupted", data: [:])
        }
    }

    @objc private func handleRouteChange(_ notification: Notification) {
        guard
            let userInfo = notification.userInfo,
            let reasonValue = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
            let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue)
        else { return }

        // e.g. headphones unplugged — pause rather than continue on the speaker unexpectedly.
        if reason == .oldDeviceUnavailable {
            notifyListeners("audioRouteChanged", data: [:])
        }
    }
}
