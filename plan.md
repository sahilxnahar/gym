# Forge PWA — product and implementation plan

## Product direction

Forge is a local-first, gym-focused training PWA for discovering a movement, making an editable plan, recording sessions and seeing progress. It works for a commercial gym, a home floor, bodyweight training or resistance bands. The app never invents workouts or personal records, and local mode remains useful without an account.

## Brand, design and navigation

The interface uses a calm tactile-workshop style: warm paper, charcoal structure, ember orange for primary actions and a centered **FORGE** wordmark. Users can choose warm, charcoal or high-contrast appearances. The responsive Home prioritizes today's plan, last activity, progress, quick workout, account sync state and optional game quest. Navigation uses Home, Plans, Workouts, Progress, Tools and Settings. Controls remain keyboard and screen-reader friendly with visible focus, reduced motion, plain language and large touch targets.

## Workout customization

Plans are editable and match equipment, time and ability. Users can select bodyweight, resistance bands, dumbbells and/or gym equipment; 1–7 weekly sessions; 15–90 minutes per session; movement focus and optional supersets. Quick missions offer short sessions throughout the day. The offline movement library is searchable and filterable and provides six bundled GIF/still guides plus the original Forge band-kit vector. Height/weight never select a workout load.

Profiles can choose under 18, 18–39, 40–64, 65–74 or 75+. Under-18 users can journal and browse, while automatic plan generation pauses. The 65+ default is conservative and editable; movement-limit notes pause plan generation. An optional adult-only BMI screen gives a broad screening result, is never saved and does not set exercise or bodyweight goals. The cardio library suggests familiar activities with general talk-test wording.

## Sync, identity and notifications

Local browser storage remains the default. The optional single-owner account lets the same person sign in on a laptop and phone. Passwords are never copied into workout state; the server stores salted scrypt hashes, and each browser has its own optional 30-day session. The client saves locally first, shows acknowledged sync status and compares server revisions. On conflicts it merges independent records and preserves simultaneous edits as marked copies. Offline journals are not discarded; first sign-in merges with the account state. The user can export, sync, sign out or clear one device's downloaded account copy.

Water, walking and user-labelled supplement reminder schedules can sync. Push permission/subscription and local notification occurrence state stay per device. The Railway sender uses stable VAPID variables and generic lock-screen text. Push delivery is optional/best-effort, not a guaranteed alarm. Quiet hours, timezone and cadence are adjustable.

Diet notes remain device-local unless the user explicitly turns on account sync; BMI values are always transient. Movement-limit notes are part of the cloud-synced profile and the UI advises against entering private medical details.

## Motivation and supplement learning

An optional fantasy-inspired Ember Map ties points, levels, milestones and short bodyweight/band/walking quests to real completed activity. Rewards unlock in-app story/cosmetic elements only; there are no purchases, punishments, fake stats or required targets.

The eight-entry supplement guide links to government and sports-science sources and describes evidence limits/cautions without dosage, product selection, stacking or medication-interaction advice. Supplement reminders are only user-written labels and times.

## Engineering, data and license

Keep the Node.js 24 server, vanilla HTML/CSS/JavaScript and same-origin API. `web-push` is a lockfile-pinned server dependency. SQLite lives on one persistent Railway volume with one app instance. Account DB usage is hard-capped at **15,000,000,000 bytes**; per-snapshot requests are capped at 4 MiB. The current attached volume is **50,000 MB** at `/data`, a separate physical allocation that Railway does not resize downward in place. A smaller physical volume requires an approved backup/copy/cutover and health check; never delete the current one as a shortcut.

The PWA precaches its shell, functional scripts, themes, local demos and band illustration; it never caches authenticated API data. Run `npm ci`, `npm test`, `npm run check` and `npm run media:check`. GitHub Actions runs the same checks on `main` and pull requests.

The user's repository is [`sahilxnahar/Gym`](https://github.com/sahilxnahar/Gym); the app brand is Forge. The selected license is GNU AGPL v3. Only the verified OpenGym adjacent-pair and paired-unit-reordering helpers were adapted from a pinned commit. Exercise metadata keeps its separate MIT notice; unclear third-party media was excluded. Web Push is an installed MPL-2.0 dependency. See `OPEN_GYM_ATTRIBUTION.md`, `THIRD_PARTY_NOTICES.md` and `docs/REFERENCE_REVIEW.md`.

## Deployment

Live: <https://gym-pwa-production-d169.up.railway.app/>. Railway project `Gym` runs the single `gym-pwa` service with a persistent mount at `/data`; the generated owner setup secret and VAPID keys stay in Railway variables. Keep `APP_ORIGIN` exact, set `FORGE_MAX_DATA_BYTES=15000000000`, and label the retained physical volume honestly. The extra crashed `gym` service was deleted per the user's selection. Do not reveal or commit account credentials or secrets.

## Main files

- `public/app.js`, `public/index.html`: screens, account entry, training flow and dashboard.
- `public/forge-cloud-sync.js`, `public/forge-sync.js`: account transport, revisions, merge and recovery.
- `public/forge-reminders.js`, `public/forge-enhancements.js`, `public/sw.js`: reminder model, per-device notification controls and push handling.
- `public/forge-game.js`, `public/forge-progress.js`: Ember Map, short missions, points and unlocks.
- `public/supplement-library.js`, `docs/SUPPLEMENT_LIBRARY.md`: sourced education cards and safety scope.
- `server.mjs`, `tests/`, `scripts/verify-media.mjs`: account API, tests and local-media/offline audit.
