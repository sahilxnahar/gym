# Contributing

## Run and verify

Use Node.js 24 or newer. Install the locked server dependency with `npm ci`, then run `npm start` and open `http://localhost:3000`. `npm run dev` uses port 4173. Run `npm test` for the workout, sync-conflict, session-security, reminder, supplement, game, media and UI tests; run `npm run check` for JavaScript syntax checks.

Use test accounts and private dummy data when inspecting interactions. Browser storage and exported backups are not encrypted; never commit real workout, account or health-related information. Local mode should remain useful without sign-in or notification permission.

## Product and safety boundaries

Keep one primary action per screen, ordinary language and clear pending/synced/offline states. Preserve keyboard access, visible focus, readable contrast, reduced-motion behavior and phone-size targets. Do not seed workout logs, infer diagnoses or promise that a result is medically safe. BMI stays optional, adult-screening-only and must not choose weight/load, targets or training plans. Keep age boundaries, movement-note sync disclosure, and the explicit opt-in for sensitive food notes.

Water/walking prompts are optional habits, not hydration or safety targets. Supplement cards must retain citations and limitations, and must not prescribe products, amounts, stacks, treatment or medicine interactions. Supplement reminder labels are user-entered; push payloads must stay generic. Never represent Web Push as a guaranteed alarm.

## Media and attribution

Keep functional media local, verify its rights and list guide assets in `public/media-manifest.json`. Do not hotlink exercise media or assume an upstream code/data license covers images or video. Run `npm run media:check` after changing assets or service-worker caching. Forge's adapted OpenGym helper is file-level attributed in `OPEN_GYM_ATTRIBUTION.md`; the project and that adapted code use AGPL v3. Exercise metadata/instructions retain the separate MIT notice, and `web-push` is an installed MPL-2.0 dependency.

## Railway and account behavior

The Dockerfile builds with `npm ci` and exposes `/health`. The single-owner SQLite sync needs one persistent Railway volume mounted at `/data`. Set `DATA_DIR=/data`, exact HTTPS `APP_ORIGIN`, a random one-time `SETUP_TOKEN`, `FORGE_MAX_DATA_BYTES=15000000000`, a truthful `FORGE_VOLUME_LABEL`, and stable VAPID values in Railway. Real secrets belong in Railway variables only, never in `.env.example`, GitHub or chat messages. Remove `SETUP_TOKEN` after creating the first owner. Passwords are per-device sign-in credentials, not sync payloads; never add password storage to browser state.

The current physical volume is 50GB although Forge enforces a 15GB logical account-data cap. Railway cannot shrink an existing volume in place; require a separately verified backup/cutover before any removal. Keep single-instance SQLite; do not deploy several writers against different volumes.
