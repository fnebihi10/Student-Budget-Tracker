# Native release rehearsal

Status on 2026-10-04: **UNVERIFIED** on Android and iOS. No emulator, simulator,
physical-device or manual screen-reader pass is recorded. Demo exports are
bundling evidence only. [Current run evidence](RELEASE_FOLLOWUP.md).

## Machine and account preparation

- Android: Android Studio with the SDK/platform tools and emulator, a compatible
  JDK for the locked React Native/Gradle stack, and either a booted emulator or
  an attached device with USB debugging. `adb devices -l` must show an authorized
  target. Record whether it is an emulator or physical device.
- iOS: a Mac with compatible Xcode, command-line tools and CocoaPods; a booted
  simulator or attached device. Physical-device installation additionally needs
  local Apple development signing. Do not enable billing or publish to stores.
  Record `xcodebuild -version` and `xcrun simctl list devices booted`.
- Use the confirmed disposable Supabase project prepared in
  [AUTHENTICATED_TESTS.md](AUTHENTICATED_TESTS.md), two separate test accounts and
  an actual test mailbox. Allowlist `pocketwise://auth` and
  `pocketwise://auth?recovery=1` in that project's Auth redirects in addition to
  the browser redirects. Use a second installed device for synchronization checks.
- Preserve user/device data; do not clear storage, uninstall an existing user app,
  reset a database or use production credentials to make rehearsal easier.
  Prefer a fresh emulator/device test profile. Clone/check out the tested revision
  on the native machine and record any additional changes.

## Exact development-build commands

Run `npm ci`, then verify the configured test project with the existing integration
commands. The following Node command works in PowerShell and macOS shells. It
reads only the dedicated test env file, validates its acknowledgement, disables
Expo dotenv loading and removes all test/service and old public Supabase variables
from the build subprocess. It passes only the isolated URL/public key to Expo.
The CLI may generate ignored native directories and install platform build tools;
do not commit generated signing material.

```sh
node --env-file=.env.supabase-test.local -e "const p=require('./scripts/isolated-project.cjs').isolatedProject(); const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>!k.startsWith('SUPABASE_TEST_')&&!k.startsWith('EXPO_PUBLIC_SUPABASE_'))); env.EXPO_NO_DOTENV='1'; env.EXPO_PUBLIC_SUPABASE_URL=p.url; env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=p.publicKey; const r=require('node:child_process').spawnSync(process.execPath,['node_modules/expo/bin/cli','run:'+process.argv[1],'--device'],{env,stdio:'inherit'}); if(r.error)throw r.error; process.exit(r.status===null?1:r.status);" android
```

On the Mac, replace the final `android` argument with `ios`. These commands build
and install the debug application and start Metro. They have **not been run here**
because platform tooling/targets and isolated credentials are unavailable.
Do not fall back to an existing production-configured Metro server. If restarting
Metro, use the same command/environment isolation. See
[Expo CLI local build guidance](https://docs.expo.dev/more/expo-cli/).

Open the actual HTTPS confirmation/recovery link through the test mail client to
test the full flow. For a separate native callback rehearsal, use the final
`pocketwise://auth...` callback URL from that isolated flow: Android can use
`adb shell am start -W -a android.intent.action.VIEW -d 'ACTUAL_TEST_CALLBACK'
app.pocketwise.studentbudget`; an iOS simulator can use `xcrun simctl openurl
booted 'ACTUAL_TEST_CALLBACK'`. A direct callback does not prove mail delivery
or HTTPS redirect behavior. Do not put token-bearing URLs in committed evidence.
Rehearse cold start and running-app behavior, reused and expired links.

## Required results, separately for every target

Record commit plus working-tree changes, build identifier, OS/model, target type,
test account labels, steps, expected/actual result and screenshot/video/log path.
Keep emulator/simulator findings, physical-device findings and manual assistive
technology findings separate. Do not mark a row passed without executing it.

| Scenario | Android emulator | Android physical | iOS simulator | iOS physical |
| --- | --- | --- | --- | --- |
| Every amount/note form with keyboard and enlarged system text; Save/Cancel reachable | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| Safe areas/system bars, rotation, back/gestures, failed-save drafts | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| Mail confirmation/recovery: cold/warm, password replacement, expired/reused link | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| JSON/CSV share files, inspect contents in receiving app, cancel and retry | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| Account A logout -> B login -> export; no A records/cache exposed | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| Background A, modify/delete on B, resume A; repeat during delayed writes and revoked refresh | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| TalkBack/VoiceOver manual labels, states, order, modal focus and dismissal | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |

Use system accessibility settings to enable TalkBack/VoiceOver and enlarged text;
verify with a human operator. Browser axe cannot satisfy those rows. Real network
requests and two installed targets are needed for synchronization, refresh failure
and account switching; a DOM focus event or simulated AppState is insufficient.
Retain release hold while required checks remain unverified.
