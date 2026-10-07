# Forge native companion

This Capacitor wrapper reuses the local Forge PWA bundle and adds an optional, **read-only daily step-count** connection for Android Health Connect and Apple HealthKit. It is a native companion, not a replacement for the browser PWA.

## Health-data boundary

- Forge requests access only to `STEPS`, with `READ` access. The request begins only after the person taps **Connect / refresh steps**.
- The wrapper queries today's daily total only. It does not read historical data, write health data, create background jobs, request background access, or award Forge XP for steps.
- Step totals remain in transient on-screen state on this device. They are not added to the workout journal, browser storage, account sync, analytics, or server requests.
- The public [Health-data privacy note](https://gym-pwa-production-d169.up.railway.app/health-privacy.html) is configured for Health Connect's permission screen. Device/OS permissions can be changed in Health Connect or Apple Health settings.
- Health Connect/HealthKit is not exposed to a regular browser PWA. The website remains useful without this native companion.

## Build the web bundle and Android project

Requires Node.js 24+, JDK 21 and Android SDK API 36. The native app supports Android API 26 (Android 8.0) and newer. From this directory:

```sh
npm ci
npm run sync:android
cd android
./gradlew assembleDebug
```

The debug APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`. Open the native project with Android Studio to run it on a device or emulator. A device with Health Connect available is needed to exercise the consent/query flow.

For iOS, use macOS with Xcode installed:

```sh
npm ci
npm run sync:ios
node scripts/run-capacitor.mjs open ios
```

The Xcode target needs HealthKit capability/signing to run on a physical iPhone. This repository does not contain distribution signing credentials or an App Store / Play Store release configuration.

## Account sync

The browser PWA retains the existing owner login and cross-device sync. The first native companion build is deliberately local-first while a secure native account/session bridge is completed; it does not send login attempts to its local WebView origin. Use the HTTPS Forge website in a browser for owner sign-in and cross-device sync in the meantime. Local workout logging and the optional on-device step view remain independent.

## Local-only build outputs

`www/` is generated from the repository's `public/` directory, and the native platform projects are generated/maintained by Capacitor. Do not commit `node_modules`, generated `www`, signing keys, account data, health readings or test credentials.
