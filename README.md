# Forge — your workout journal

Forge is a local-first, gym-focused training PWA for planning a session, logging what you did and seeing progress. The product is Forge; the public source repository remains [`sahilxnahar/Gym`](https://github.com/sahilxnahar/Gym).

**Live app:** <https://gym-pwa-production-d169.up.railway.app/>

## What you can do

- Browse an offline exercise library with local movement GIFs and stills; filter by bodyweight, resistance bands, dumbbells or gym equipment.
- Build an editable 1–7 day plan with 15–90 minute sessions, movement focus, gentle options and optional supersets. Quick workouts let you log a short bodyweight, band or walking session without rebuilding your plan.
- Record workouts, sets, cardio, rest, bodyweight entries and unfinished sessions. A first-login merge keeps local and account journals together; later offline edits are merged or preserved as a clearly marked copy rather than silently overwritten.
- See today's progress, lifetime points, levels, streaks and optional campaign missions on Home. Choose the Ground-Up Builder or Legacy Architect story; both share the same ranks, rewards and workouts, with no purchases or penalties.
- Set water, walking and supplement reminder schedules. Push notifications are opt-in **for each device**, use quiet hours/time zones and are best-effort, not guaranteed alarms. Page-based reminders only run while the app is open.
- Read eight source-linked supplement summaries in the library. They explain evidence and cautions; Forge does not choose products, prescribe doses or screen medicines/interactions.
- Use the optional adult BMI screening calculator and general activity suggestions. BMI is not a diagnosis, isn't saved, and never selects your workout load or goal.
- Choose warm, charcoal or high-contrast appearance, equipment, availability, workout time, body focus and optional synced food notes. Forge uses one self-hosted Barlow type family throughout the interface. The Training Ledger mark—a session record with an ember completion point—appears in the app shell and install icons.

## Use the same account on a phone and laptop

1. Open the same HTTPS Forge address on the first device. If this deployment has no owner yet, create the one owner account using the private one-time setup token provided outside the repository. Otherwise, sign in.
2. On every other device, open that same Forge address and sign in with the same email address (your login ID) and password. Turn on **Keep me signed in on this device** if you want its session remembered for up to 30 days. Each browser/device keeps its own secure session; credentials are not copied between devices.
3. Wait for Home/header status to say **Synced at …** or press **Sync now**. Workout history, saved plans, bodyweight entries, drafts, milestones, reminder schedules and settings sync after server confirmation. If a device is offline, changes remain local and retry on reconnect.
4. Enable push reminders separately on any device that should receive them. The browser/OS asks separately on each device; denying permission does not affect account sync.

Forge stores a password hash on the server, never the password in its workout journal. Use a unique password. Password change signs out other devices. Food notes stay device-local unless you explicitly enable account sync; BMI entries and notification permission are never synced. Do not put medical details in movement-limit notes.

## Run locally

Requires Node.js 24 or newer. Install the locked dependency set, then start the local server:

```sh
npm ci
npm start
```

Open <http://localhost:3000>. `npm run dev` starts a development server on port 4173. Local-only mode needs no account. To test account sync locally, set a unique `SETUP_TOKEN` of at least 32 characters in your shell before starting the server. Browser-local data is not encrypted; use the export control before clearing browser storage and keep private backups out of Git.

## Reminders and push configuration

The Railway sender requires stable `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT` values stored only in Railway variables—not `.env.example`, GitHub or the PWA. Generate one key pair for this deployment and do not rotate it without re-subscribing devices. A browser push permission is distinct from the shared account schedule. Closed-app delivery depends on the browser, OS, network and push provider and must never be treated as a safety-critical alarm.

## Storage and Railway

The account database is capped at **15,000,000,000 bytes** by `FORGE_MAX_DATA_BYTES`; `/api/storage` shows account-data use and the cap. Static app code/media live in the deployment, not in that account-data quota. The existing Railway SQLite volume is **50,000 MB** at `/data`, so this application cap does not resize the physical volume or guarantee lower Railway volume billing. Railway does not shrink an existing volume in place. A physical 15GB volume would require a separate, owner-approved backup/copy/cutover and validation before removing the original volume. The live 50GB volume is currently retained.

The project includes `Dockerfile`, `entrypoint.sh`, `railway.json` and `GET /health`. Production needs a persistent volume mounted at `/data`, `DATA_DIR=/data`, `NODE_ENV=production`, an exact HTTPS `APP_ORIGIN` with no trailing slash, a strong one-time `SETUP_TOKEN`, the data-cap label and the VAPID settings above. Railway supplies `PORT`. The service uses one Node process and one SQLite volume; do not scale multiple instances against separate databases. Back up Railway data separately from local JSON exports.

Only one owner account is supported. Registration closes after its creation; other visitors can use Forge in local device mode or run their own deployment. See [security notes](SECURITY.md) before operating a public instance.

## Checks and local media

```sh
npm test
npm run check
npm run media:check
```

The media verifier checks image signatures, GIF animation, dimensions, hashes and service-worker precache coverage. Six movement GIFs and six stills are bundled locally; neither supplied source archive contained video. Forge also includes its own resistance-band SVG. The FitQuest preview image is a reference only, not runtime media. See the [media inventory](docs/MEDIA_INVENTORY.md).

Further references: [sync and notification behavior](docs/SYNC_AND_NOTIFICATIONS.md), [game-format proposal and evidence](docs/FORGE_GAME_FORMAT_PROPOSAL.md), [15GB storage limit](docs/STORAGE_LIMIT.md), [physical 15GB Railway volume migration plan](docs/RAILWAY_15GB_MIGRATION_PLAN.md), [supplement library and sources](docs/SUPPLEMENT_LIBRARY.md), [health boundaries](docs/HEALTH_FEATURES.md), [interface review and prioritized improvement ideas](docs/FORGE_UX_REDESIGN.md), [usability test plan](docs/UX_TEST_PLAN.md), [all ten repository references](docs/REFERENCE_REVIEW.md), and [OpenGym file-level attribution](OPEN_GYM_ATTRIBUTION.md).

## License and safety

Forge and its adapted OpenGym superset-ordering code are licensed under GNU AGPL v3 only (`AGPL-3.0-only`); see the complete [`LICENSE`](LICENSE) and [`OPEN_GYM_ATTRIBUTION.md`](OPEN_GYM_ATTRIBUTION.md). Exercise names/instructions retain their separate MIT notice in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md). No disputed OpenGym media was copied.

The self-hosted Barlow font files in `public/fonts/` are licensed under the SIL Open Font License 1.1; the complete notice is bundled at `public/fonts/OFL.txt`.

BMI results are adult screening information, not a diagnosis or workout prescription. Activity, food and supplement cards are general information, not individualized medical, diet or medication advice. Stop any movement that causes pain, dizziness or other unusual symptoms, and ask a qualified professional for personal guidance.
