# Gym PWA — implementation plan

## Product direction

Build a local-first, mobile-first training journal from the supplied Forge application, adding FitQuest-style progression signals without introducing seeded workout history or fabricated personal records. Preserve the exercise catalogue, set-by-set logging, reusable routines, rest timer, session history, bodyweight tracking, weekly goal, onboarding, JSON backup/restore, optional single-owner account sync, installable PWA shell, and offline movement guides. The app is a private journal on each device by default; the optional hosted account is single-owner and is not a public multi-user service.

Review all ten user-provided repositories for product patterns and licensing, then incorporate only ideas that fit this scope. Do not copy code, images, GIFs, or videos from third-party projects without a verified license and attribution. Keep the supplied Forge notices and original demo media. OpenAI Gym is a reinforcement-learning toolkit, not a gym-workout tracker.

## Design

- **Design movement:** tactile industrial realism, adapted from the Industrial style reference. The interface should feel like a carefully engineered training instrument: solid, legible, and lively rather than a generic dark SaaS dashboard.
- **Core principles:** physical feedback; training-first clarity; truthful progress derived from the user's journal; private-by-default data.
- **Color philosophy:** a cool workshop-grey chassis and warm off-white panels keep long workout sessions readable. Graphite anchors navigation and high-contrast content. Safety orange is the ownable action color; a restrained signal-green marks completed work and progress. Avoid decorative gradients and keep text contrast strong.
- **Layout paradigm:** a compact fixed equipment-rail on wide screens with a broad, asymmetric overview; on phones, use a thumb-friendly bottom rail and stack session controls in their natural order. Workout logging remains the primary action.
- **Signature elements:** bolted-panel cards with subtle top-left highlights; recessed data-entry wells; a small LED/orange status mark paired with workout streak and level progress.
- **Interaction philosophy:** controls behave like physical switches: immediate pressed states, forgiving forms, clear confirmation for destructive actions, and visible saved/offline state. The quick-log action should complement—not replace—set-by-set sessions.
- **Animation:** short mechanical easing for presses, drawer/modal transitions, progress fills, and toasts; respect `prefers-reduced-motion`; never animate workout controls in a way that interferes with logging.
- **Typography system:** native system sans for headings and body copy; system monospace for XP, weights, timer, set counts, and uppercase equipment labels. Do not rely on remote fonts so the PWA remains usable offline.
- **Brand essence:** a private training journal that makes consistent work easier to see and repeat; **precise, resilient, encouraging**.
- **Brand voice:** short, grounded prompts that celebrate showing up without claiming coaching authority. Examples: “Make the work count.” and “One session closer.”
- **Wordmark & logo:** a custom `G` built as an equipment-dial mark, with the wordmark `GYM` in a tight uppercase lockup and matching local SVG/PNG app icons.
- **Signature brand color:** safety orange `#F05A36`.

## Implementation and architecture

Use the supplied Forge Node.js 24+ server and vanilla JavaScript/CSS rather than introducing an unnecessary framework. Keep workout records local in browser storage by default. Retain the optional authenticated single-owner SQLite sync backend only with a Railway persistent volume and production origin configured; do not present it as multi-user hosting. Serve same-origin static files and local demo media, and cache the complete app shell and guides in the service worker.

### Project structure

- `server.mjs`: same-origin static server, health endpoint, request validation, and optional single-owner account API.
- `public/index.html`: PWA document shell, application navigation, and local script/style entry points.
- `public/app.js`: journal screens and workout interactions.
- `public/training.js`: exercise catalogue, onboarding/profile logic, and workout-plan helpers.
- `public/exercise-library.js`: bundled licensed English exercise metadata.
- `public/styles.css` and `public/gym-progress.js`: visual system and derived progression display.
- `public/demos/`: original, locally shipped GIF demonstrations and still frames.
- `public/sw.js`, `public/manifest.webmanifest`, `public/icon.*`: installation and offline cache.
- `scripts/verify-media.mjs`: checks local GIF/still files, references, and offline precache coverage.
- `tests/`: the supplied API, state-validation, training, PWA, and catalogue checks plus media checks.
- `docs/`: reference review, media inventory, and self-hosting/deployment guidance.

## Deployment notes

Railway deployment must use the repository's Dockerfile, `/health` health check, and a persistent volume mounted at `/data` for SQLite account sync. Production account sync requires an exact HTTPS `APP_ORIGIN` and a strong, uncommitted `SETUP_TOKEN`; `DATA_DIR=/data`. Local-only mode needs no account setup. The Railway service and public domain will be created only after the intended `Gym` repository is available to the connected GitHub integration.
