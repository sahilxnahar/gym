# Contributing

## Run and verify

Use Node.js 24 or newer. Run `npm start` and open `http://localhost:3000` to use Forge. Run `npm test` for the application, PWA, data-validation, media and beginner-UX checks; run `npm run check` for JavaScript syntax checks. The app stores journal data in the current browser by default. Use test data when inspecting interactions, and keep private backups out of commits.

## Product boundaries

Keep workout logging usable offline. Give each screen one clear main action. Use everyday terms, explain “sets” and “reps” where they appear, and place optional effort scores behind a disclosure. Do not imply that a plan, personal record, calorie target or technique assessment exists when the user's data does not support it. Exercise guides are schematic and are not medical or individualized coaching advice. Preserve keyboard access, visible focus, readable contrast, reduced-motion behavior and phone-size touch targets.

## Media and attribution

Keep all exercise media local to the repository, check its license, and list it in `public/media-manifest.json`. Do not hotlink media from exercise repositories or copy it because it appears on GitHub. The supplied exercise dataset's MIT notice does not grant rights to separately credited images and videos. Run `npm run media:check` after changing demo assets or service-worker caching.

## Railway

The Dockerfile and `railway.json` deploy Forge and expose `/health`. Use a Railway persistent volume mounted at `/data` for optional single-owner SQLite sync. Set an exact HTTPS `APP_ORIGIN`, a unique `SETUP_TOKEN` and `DATA_DIR=/data` before using account sync. Never commit `.env`, owner setup tokens, passwords, real workout exports or Railway credentials. Local device mode remains available without cloud account setup.

The target repository supplies the GNU General Public License, version 3. Preserve the root `LICENSE` and its notices when redistributing changes. Keep the exercise dataset's separate MIT terms, media provenance and all third-party notices intact.
