# AI Job Radar mobile

Native React Native app using Expo SDK 57, alongside the existing Next.js website. Discover, Saved, Activity and job details share the same Supabase workspace through the website’s server API. No login is added.

## Run locally

The website server code is in `website/`. Its credentials belong in `website/.env.local`; mobile contains no Supabase secrets. From the repository root:

```sh
pnpm install
pnpm dev
```

In another terminal:

```sh
pnpm --dir mobile start
```

The default API is `http://127.0.0.1:3000`. You can copy `mobile/.env.example` to `mobile/.env.local` to change the local port. Never add Supabase credentials to mobile environment variables or source: Expo public variables are bundled into the app.

### Android phone over USB or Android emulator

Enable USB debugging, connect the device, install an Expo Go version compatible with SDK 57, and run:

```sh
adb reverse tcp:3000 tcp:3000
adb reverse tcp:8081 tcp:8081
pnpm --dir mobile android
```

Port 3000 carries API requests and 8081 carries Metro. Keep the website API bound to localhost. Wi-Fi access to the privileged API is deliberately unsupported. An Android development build can also use this USB workflow.

### iOS simulator

On macOS with Xcode and an SDK-compatible simulator:

```sh
pnpm --dir mobile ios
```

The simulator can reach the Mac’s loopback API. A physical iPhone needs a separately designed private transport/access solution; this local-only implementation does not expose the server over LAN or the internet.

## Appearance and data

The appearance button opens System, Light and Dark choices. Only this preference is stored in AsyncStorage. System mode follows phone appearance changes. Jobs, bookmarks and application progress are fetched from Supabase via the server; no offline authoritative job store is created. Pull to refresh updates the feed. API errors and revision conflicts are surfaced rather than pretending a change succeeded. Employer links and marking applied remain separate actions.

## Checks

```sh
pnpm --dir mobile typecheck
pnpm --dir mobile exec expo install --check
pnpm --dir mobile export
pnpm lint
pnpm test
```

Export compiles Android and iOS JavaScript/assets; it does not produce an APK/IPA or prove device behavior. The export command does not sign or publish native binaries. Local native debug builds use a development signing certificate and can be installed directly on a test phone.

## Design references

Figma file `zzzVHhneAYBLrXVqIvnmSw`, phone nodes `1:712`, `1:768`, `1:805`, `1:830`; MagicPath component `461166553119989760`, revision `461168243906846720`. Figma reads were rate-limited during this work. The implementation uses the accessible prototype and previously downloaded Figma SVGs, retaining their native geometry. The Saved empty state currently shares the Applications illustration as the website does. Dark mode is an adaptation of the approved palette, not a new approved Figma frame. Device visual review is still required.

## Native Android installation

With Android SDK and a compatible JDK installed, run `pnpm --dir mobile exec expo run:android --device` to generate the native Android project and install a debug build with its own AI Job Radar icon. The first build downloads native build dependencies. This build needs Metro and the website API while in use.

Paired wireless ADB supports the same port forwarding as USB: run `adb -s DEVICE reverse tcp:3000 tcp:3000` and `adb -s DEVICE reverse tcp:8081 tcp:8081`, replacing DEVICE with its current identifier from `adb devices`. Debugging addresses can change after reconnecting. Both servers remain on localhost; forwarding uses the paired debugging connection.

## Building on a computer with limited RAM

Use `pnpm --dir mobile build:android` for a local arm64 Android debug APK. This caps Gradle at one worker with a 1536 MB heap, runs Kotlin in-process, and uses CMake/Ninja compile and link pools of one job. Stop the website and Metro servers while compiling, then restart them for phone use. The helper uses `JAVA_HOME`, or the ignored `.local-tools/jdk21` toolchain when available. The output is `mobile/android/app/build/outputs/apk/debug/app-debug.apk`. These limits trade build speed for lower peak memory.
