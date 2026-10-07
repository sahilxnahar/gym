# Forge PWA — product and implementation plan

## Product direction

Forge is a local-first training journal and movement guide: help someone discover a movement, make a plan that matches equipment and time, record a session and return tomorrow. It works for a commercial gym, home floor, or a resistance-band kit. The default does not request body measurements or require an account. Keep exercise history accurate; never invent workouts or personal records.

## Design and interaction

The visual direction is a calm, tactile workshop notebook: warm paper, charcoal structure, an ember-orange primary action and an unmistakable centered **FORGE** wordmark. The app offers warm, charcoal and high-contrast appearances, plus responsive controls, skip link, keyboard focus, larger touch targets and reduced-motion behavior. Use the original Forge movement diagrams and band-kit illustration; no remote font, stock photo or hotlinked exercise image is needed.

Navigation uses Home, Plans, Workouts, Progress, Tools and Settings. Put the immediate action first; use ordinary words and define sets/reps at the point of use. The initial plan avoids body metrics, is editable and supports 1–7 available days, 15–90 minute sessions, bodyweight, bands, dumbbells, gym equipment, body focus and optional supersets. Simple is the default; further plan rationale belongs in a disclosure.

## Training and health boundaries

Profiles can choose under 18, 18–39, 40–64, 65–74 or 75+. Under-18 users can log and browse but Forge does not auto-generate a plan. The 65+ draft starts at up to two lower-impact days and one set per movement. Any stated movement limitation pauses automatic plan suggestions. These are conservative product defaults, not clinical advice.

Adult BMI is optional, requires a 20+ confirmation and does not set a load, goal, calorie target or plan. The result is not saved. Child/teen percentiles are not implemented. Cardio ideas use familiar activities and an optional talk-test cue. Diet preference/reminder notes stay in a separate device-local key and are never synced or backed up. See `docs/HEALTH_FEATURES.md` for sources, limitations and Apple Health constraints.

## Engineering and reuse

Keep the supplied Node.js 24 server and vanilla HTML/CSS/JavaScript. Local browser storage is the default; optional authenticated single-owner sync uses one SQLite database on one Railway volume. Cache all functional scripts, styles, band art and six movement GIF/still pairs under the service worker. Run `npm test`, `npm run check` and the strict media audit after changes.

The user chose AGPL-3.0 for the project before reuse of two verified OpenGym adjacent-pair/unit-order helpers. Preserve the source notice, exact pinned commit and corresponding source. Exercise names/instructions retain their independent MIT notice. Never infer media rights from code or data licenses; no uncertain OpenGym imagery is shipped. See `OPEN_GYM_ATTRIBUTION.md` and `THIRD_PARTY_NOTICES.md`.

## Main files

- `public/index.html` and `public/app.js`: Forge shell, screens, plan setup and interactions.
- `public/training.js`: equipment/age-aware plan drafts and movement cues.
- `public/forge-tools.js`: local adult BMI, cardio ideas and device-only diet preferences.
- `public/forge-superset.js`: attributed pair grouping, reordering and optional pairing controls.
- `public/forge-extras.css` and `public/forge-theme.css`: centered wordmark, responsive tools and selectable themes.
- `public/equipment/`: original local resistance-band illustration.
- `public/demos/`, `public/sw.js`, `public/manifest.webmanifest`: verified offline movement images and PWA install support.
- `scripts/verify-media.mjs`, `tests/`, `docs/`: asset verification, regression coverage, references, safety and usability checks.

## Deployment

The GitHub project is [`sahilxnahar/Gym`](https://github.com/sahilxnahar/Gym); the product brand is Forge. The live app is <https://gym-pwa-production-d169.up.railway.app/>. Railway project `Gym` runs one `gym-pwa` service from the repository Dockerfile with `/health`, HTTPS origin, a persistent volume at `/data` and its one-time owner token stored only in Railway. The user chose to keep Railway's default 50 GB volume; an extra unconfigured service named `gym` was deleted on request. Never commit any Railway secret or account credential.
