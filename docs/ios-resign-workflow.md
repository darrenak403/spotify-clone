# iOS Re-Sign Workflow (Free Personal Team)

The app is signed with a free Apple Personal Team (no paid Developer Program). This provisioning profile expires **every 7 days**, after which the app icon greys out / won't launch on the iPhone until re-signed.

## Pure re-sign (no code changes since last install)

1. Connect the iPhone ("Corn") to the Mac via cable.
2. Open `frontend/ios/App/App.xcworkspace` in Xcode.
3. Select the connected iPhone as the run destination (top toolbar device picker).
4. Press Run (▶) in Xcode. This re-signs and reinstalls the existing build — no rebuild of web assets needed.
5. Trust the developer certificate on the device if prompted: **Settings → General → VPN & Device Management → [your Apple ID] → Trust**.

## Re-sign after web source changes

If any file under `frontend/src/` changed since the last install, sync the new build first:

```bash
cd frontend
npm run build
npx cap copy ios
```

Use `npx cap sync ios` instead of `copy` only if `Podfile`, native plugins, or `capacitor.config.ts` changed (sync also re-runs CocoaPods).

Then continue from step 2 above (open Xcode, select device, Run).

## Command-line alternative (no Xcode UI)

```bash
xcodebuild -workspace frontend/ios/App/App.xcworkspace -scheme App -configuration Debug -destination 'id=<DEVICE_UDID>' build
xcrun devicectl device install app --device <DEVICE_UDID> <path-to-built>.app
```

Find `<DEVICE_UDID>` via `xcrun devicectl list devices`. This installs without launching — open the app manually on the device afterward.

## Notes

- Bundle ID is fixed at `com.darrenak403.evon` — don't change it between re-signs, since free-team provisioning is tied to bundle ID + device count.
- Signing team `T328J556V6` is already configured in the Xcode project (Automatic signing) — no manual certificate management needed, Xcode handles renewal on each Run as long as the Apple ID is still signed in on the Mac.
- Validated on one device (iPhone 14 Pro Max, "Corn") / one iOS version so far — broader device/iOS-version coverage is untested.
