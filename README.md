# Gym — training journal PWA

A mobile-first workout journal built for quick, repeatable training. It combines the supplied Forge training flows with FitQuest-style progression, while keeping a user's journal on their device by default.

## Features

- Searchable exercise library and movement guides, with all guide GIFs and stills stored in this repository.
- Set-by-set strength, timed, and cardio logging; active-session resume; rest timer; reusable routines; workout history; bodyweight notes; weekly goal and progress views.
- Journal-derived XP, level progress, streaks, and milestone badges; quick-log for workouts that do not need per-set detail.
- Offline-capable installable PWA, JSON backup/export/import, reduced-motion support, and responsive phone navigation.
- Optional authenticated single-owner account sync. It is not a multi-user cloud fitness service.

## Run locally

Requires Node.js 24 or newer. The project uses Node built-ins and has no runtime package install step.

```sh
npm start
```

Open <http://localhost:3000>. For development, use `npm run dev` (port 4173). The browser's local device mode keeps workout data in that browser profile; browser storage is not encrypted. Export backups and do not commit them.

## Checks and media verification

```sh
npm test
npm run check
npm run media:check
```

The media verifier checks GIF/PNG signatures, dimensions, animated frame structure, SHA-256 manifest values, app references, and service-worker precache coverage. The Forge archive supplies six movement GIFs and six matching still frames, all bundled locally. The FitQuest archive contains only a reference `.webp` preview image; neither archive contains MP4, WebM, MOV, or M4V video files. See [the local media inventory](docs/MEDIA_INVENTORY.md) and [`public/media-manifest.json`](public/media-manifest.json).

## Railway deployment

The repository includes `Dockerfile`, `entrypoint.sh`, `railway.json`, and an unauthenticated `GET /health` endpoint. For private single-owner account sync, use a Railway volume mounted at `/data`, set `DATA_DIR=/data`, set `NODE_ENV=production`, configure `APP_ORIGIN` to the exact HTTPS public origin with no trailing slash, and create a unique `SETUP_TOKEN` of at least 32 characters. Never store those secrets in GitHub. The first account setup uses the token once; registration closes after an owner is created. If a persistent volume and secrets have not been provisioned, use only local device mode. Railway supplies the `PORT` variable.

The server uses SQLite and is intended to run as one app instance with one attached persistent volume. Do not scale it to multiple instances with separate volumes. Back up Railway volume data separately from device JSON exports. See [security notes](SECURITY.md) before enabling account sync.

## Reference and rights notes

The supplied Forge source uses English exercise metadata/instructions described in `THIRD_PARTY_NOTICES.md` as MIT-licensed. That notice excludes upstream exercise thumbnails and third-party animations. This app includes only the six original schematic demos that came in the supplied Forge archive; no exercise images/videos from the ten reference repositories were copied. The complete [reference review](docs/REFERENCE_REVIEW.md) records features and license caveats for each link.

The target repository, [`sahilxnahar/Gym`](https://github.com/sahilxnahar/Gym), already carries the GNU General Public License, version 3; that `LICENSE` is preserved here. This modified Gym PWA release is dated 2026-10-07. Retain the GPLv3 and all third-party notices in redistributed versions. The exercise metadata's MIT notice and media exclusions remain separate; see `THIRD_PARTY_NOTICES.md`.

## Health and scope

Exercise instructions are general reference text and have not undergone individualized clinical review. Movement GIFs are simplified diagrams, not professional demonstrations of every exercise variant. The app does not diagnose conditions or provide individualized medical advice.
