# Forge — workout journal PWA

Forge is a private, mobile-first place to plan a workout, record what you did and review your progress. The GitHub repository stays named [`Gym`](https://github.com/sahilxnahar/Gym); **Forge** is the app brand.

**Live app:** <https://gym-pwa-production-d169.up.railway.app/>

## What Forge does

- Shows a short welcome before asking for a plan. The starter-plan flow uses plain questions and does not require height or bodyweight.
- Offers exercise search, local movement guides, editable plans, set-by-set logging, timed and cardio entries, a rest timer, workout history and optional bodyweight notes.
- Keeps effort scoring out of the way unless you open the optional control. The workout screen explains sets and repetitions.
- Adds journal-derived Forge points, levels, day streaks and milestones. It does not seed sample workouts into your journal.
- Works as an installable offline-capable PWA. Export a JSON backup before changing devices or clearing browser data.
- Saves to the current browser by default. Optional authenticated cloud sync supports one owner account, not multiple user accounts.

## Run locally

Requires Node.js 24 or newer. Runtime code uses Node built-ins and has no package-install step.

```sh
npm start
```

Open <http://localhost:3000>. Use `npm run dev` for a development server on port 4173. Each browser profile has a separate local journal. Browser storage is not encrypted, so keep private backups out of Git.

## Checks and media verification

```sh
npm test
npm run check
npm run media:check
```

The media verifier checks image signatures, GIF animation, dimensions, hashes, source references and service-worker precache coverage. The supplied Forge archive provides six movement GIFs and six matching stills, all stored in the repository. The FitQuest archive adds a preview `.webp` image but no runtime exercise demo. Neither supplied archive contains an MP4, WebM, MOV or M4V video. See [the media inventory](docs/MEDIA_INVENTORY.md).

The [interface review](docs/FORGE_UX_REDESIGN.md) lists the changes, prioritized ideas for the next 10× quality pass and a suggested beginner usability test. The [usability test plan](docs/UX_TEST_PLAN.md) is ready for real participants; it has not been run. The [design tokens](docs/DESIGN_TOKENS.md) document Forge’s colors and control sizes. The [reference review](docs/REFERENCE_REVIEW.md) records how all ten linked repositories informed the work.

## Railway deployment

The project includes `Dockerfile`, `entrypoint.sh`, `railway.json` and `GET /health`. To enable private owner sync, mount a persistent Railway volume at `/data` and set `DATA_DIR=/data`, `NODE_ENV=production`, an exact HTTPS `APP_ORIGIN` with no trailing slash, and a unique `SETUP_TOKEN` of at least 32 characters. Keep all secrets in Railway, never in GitHub. The one-time token creates the first owner; registration closes after that. Anyone else can use Forge in local device mode or run their own deployment. Railway supplies `PORT`.

The SQLite server supports one running app instance and one attached volume. Do not run multiple copies against separate databases. Back up Railway data separately from local JSON exports. Read [the security notes](SECURITY.md) before enabling owner sync.

## License and safety

The repository provides the GNU General Public License, version 3. The modified Forge interface release is dated 2026-10-07; keep the root `LICENSE`, third-party notices and exercise-data attribution when you redistribute it. The exercise metadata's MIT notice does not cover separately credited imagery. No workout media from the ten reference repositories was copied.

Exercise notes and schematic GIFs offer general information. They do not replace a qualified trainer or individualized medical guidance. Stop a movement that causes pain.
