# Account sync and notifications

## Sign-in and data scope

Forge is local-first. A visitor can browse and keep a journal in one browser without an account. Cross-device sync uses one owner account on the existing Railway service; it is not a multi-user social or family account system. Sign in separately on every device using the same email/password. A remembered browser session lasts up to 30 days, but each device keeps its own HttpOnly session cookie. Passwords never enter the journal snapshot; the server stores a scrypt hash. Changing a password revokes other device sessions.

After sign-in, the account sync includes workout history, active-session drafts, saved plans, bodyweight entries, profile choices, game progress, reminder schedules and ordinary settings. Data must be acknowledged by `/api/state` before the UI reports it as synced. The **15,000,000,000-byte** account-data ceiling is enforced by the server, and each snapshot request is limited to 4 MiB. `/api/storage` reports used SQLite bytes and the logical cap; it does not report the entire Railway volume's exact billable size.

Diet pattern/note stays in a separate browser-local key by default. An explicit control can include it in the account snapshot; turning this off clears the synced note from the account and the current browser. BMI inputs are transient and never synced. Device notification permission, push subscription, quiet-hour OS settings and local reminder occurrence markers are per browser/device. Avoid storing private medical details in movement-limit notes: those notes are part of the synced training profile.

## Offline and conflict behavior

Each device saves a local copy immediately. After account sync, snapshots include a server revision; a stale write receives a conflict response instead of overwriting newer data. Forge compares the last acknowledged base with local and remote copies, merges independent record changes and honors an unchanged-side deletion. If both devices edited the same record, it preserves a labeled copy and explains the conflict. If two devices have different unfinished workouts, Forge preserves the other one as a resumable draft. It retries on reconnect, app focus, sign-in and **Sync now**. A browser's local export remains an additional recovery path; keep the file private.

First sign-in merges the local journal with the account journal rather than replacing either. If a network interruption occurs, status stays pending/offline and local changes remain available. Do not clear browser storage until sync is confirmed or an export exists. Signing out first asks the server to confirm sync, then removes only that device's account session and restores its prior local-only journal. **Clear account copy on this device** removes the downloaded account cache here; it does not delete the server account or other devices.

## At-home workouts, water, walking and supplement reminders

Users choose each reminder, cadence/time range, active days, timezone and quiet hours. The optional at-home workout nudge is off by default; when enabled, it sends one generic prompt at the selected time on selected days (for example, chair sit-to-stands, incline push-ups or glute bridges). One movement is enough, and there is no streak penalty. Water and walking prompts are gentle routine cues—not hydration prescriptions, step targets or safety alerts. Supplement reminders use a user-written label/time; Forge does not recommend products or doses. The supplement knowledge library is separate and informational.

Web Push is optional and must be enabled separately on every device. Forge uses VAPID keys stored in Railway; the public key is served to the browser and the private key never leaves the server. The service worker displays short reminder text and opens Forge when tapped; home-workout prompts use fixed, non-personalized movement copy and never include a user note, supplement label or private diet note. If a device/browser denies or lacks Push, in-page reminders work only while Forge is open.

Closed-app delivery is **best effort, not an alarm guarantee**. Delivery depends on HTTPS, OS/browser support, notification permission, network reachability, service-worker state and the push provider. On iOS/iPadOS, Web Push requires a supported Home Screen web app and per-device permission. Do not rely on reminders for medication, emergencies, required water intake or any safety-critical activity. Use short, quiet general prompts, provide clear snooze/disable controls, and allow removal of an old device subscription.

## Railway capacity and backups

The app caps account database data at 15 GB. The physical Railway `/data` volume remains 50,000 MB. Railway does not shrink an existing volume in place; reducing its physical capacity requires an approved copy/cutover and verified backup. The live volume must not be deleted as a shortcut. See [storage limit](STORAGE_LIMIT.md).
