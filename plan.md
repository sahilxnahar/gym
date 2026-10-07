# Forge PWA — implementation and design plan

## Product direction

Build a local-first, mobile-first training journal from the supplied workout app. Keep the exercise catalogue, editable plans, set-by-set logging, rest timer, workout history, optional bodyweight entries, weekly target, backups, single-owner cloud sync, installable PWA shell and offline movement guides. Do not invent workout history or personal records. The repository is called `Gym`; the product is **Forge**.

The ten linked repositories informed feature ideas and boundaries. Keep their code and media out of Forge unless a license explicitly permits reuse. Preserve the supplied Forge source notice and original schematic demos. OpenAI Gym is a reinforcement-learning toolkit, not a workout tracker.

## Visual and interaction system

- **Direction:** a calm, tactile workshop notebook. Use warm paper for reading, charcoal for structure, and ember orange for the primary action. Avoid generic gradients, remote fonts and decorative stock images.
- **Hierarchy:** one useful action per screen; a secondary action only when it serves a distinct task. Keep Home to a start card, the user's plan, journal-derived progress and recent workouts.
- **Language:** use Home, Plans, Workouts and Progress. Explain a set and a repetition beside the workout controls and plan review. Move deeper plan reasoning and optional effort scores into clearly named disclosures. Call cloud storage “account sync” in user-facing copy.
- **First run:** show a two-choice welcome. Ask about goal, experience, availability, equipment and safety needs in short steps. Skip body measurements. Let users review a plan before saving it.
- **Brand:** warm-paper background `#F3F0E8`, charcoal `#24231F`, ember `#DF6A47` and a restrained green for completed work. Use the Forge F mark for the favicon and install icons.
- **Accessibility:** skip link, meaningful labels, visible focus, strong contrast, touch-friendly controls, native dialogs and reduced-motion support. Do not make information available only through color.
- **Progress:** derive points, levels, streaks, milestones and personal bests from the journal. Explain each visible number and keep pressure-free rest-day language.

## Implementation

Use the supplied Node.js 24+ server and vanilla JavaScript/CSS. Keep browser storage as the default; expose optional authenticated owner sync only with a Railway persistent volume and production origin configured. Serve scripts, styles and movement media from the same origin and cache the complete app shell in the service worker.

- `public/index.html`: accessible PWA shell and Forge brand.
- `public/app.js`: screens, first-run flow and workout interactions.
- `public/training.js`: exercise data, safety gating and editable plan recommendations.
- `public/forge-progress.js`: journal-derived points and milestones.
- `public/forge-theme.css`: responsive visual system and control states.
- `public/demos/`: six supplied local movement GIFs and six still frames.
- `public/sw.js`, `public/manifest.webmanifest`, `public/icon.*`: install and offline support.
- `scripts/verify-media.mjs`: validate source media, hashes, references and offline precache.
- `scripts/generate-icons.py`: reproduce the Forge icon PNGs; Pillow is only needed to regenerate assets.
- `tests/` and `docs/`: behavioral checks, reference notes, media inventory and interface review.

## Deployment

The Railway project `Gym` hosts service `gym-pwa` at <https://gym-pwa-production-d169.up.railway.app/>. It uses the repository Dockerfile, `/health`, a generated HTTPS domain and a persistent volume mounted at `/data`. Production origin, data directory, mode and the one-time setup token remain in Railway variables, never in the repository.

The service uses one running app instance and supports a single owner account. A duplicate unconfigured service named `gym` was removed at the owner's direction. The owner chose to retain Railway's default 50 GB data volume; its size has not been changed.
