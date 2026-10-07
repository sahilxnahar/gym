# Changelog

## 2026-10-07 — Connected Forge release (0.4.0)

Added single-owner account sign-in on multiple devices, remembered per-device sessions, password change, an explicit sync status and revision-aware conflict recovery that preserves competing edits. A first sign-in merges local and account journals. Added a 15,000,000,000-byte account-data ceiling and storage meter; the physical Railway volume remains a separate 50GB resource pending any approved migration.

Added editable water, walking and supplement reminder schedules with quiet hours/time zones and opt-in per-device Web Push; notification copy remains generic and delivery best-effort. Added eight source-linked supplement learning cards without dosing instructions, explicit diet-note sync consent, and an optional Ember Map journey with short missions and earned in-app rewards. Quick workouts and account progress are now visible on Home.

Passwords are not part of synced journal data. BMI measurements remain transient; account-sync movement limitations are disclosed. Added regression tests for merge/conflict/offline paths, sessions, storage, subscriptions, supplements, reminders and quests, plus a Node 24 GitHub Actions workflow and a dependency-aware Docker build.

## 2026-10-07 — Forge gym and customization expansion (0.3.0)

Added a centered Forge wordmark, a gym-first Tools destination, an original offline resistance-band illustration, bodyweight and band plan choices, an equipment-filtered movement library and editable superset pairing/reordering. Expanded profile ranges and schedules, with conservative older-adult defaults and an under-18 automatic-plan boundary. Added an optional adult-only BMI screening tool, simple cardio ideas, device-local diet reminders and warm/charcoal/high-contrast appearance options. Measurements do not determine a workout load or target, BMI is not saved, and food notes do not sync or enter backups.

Adapted only the verified OpenGym adjacent-pair grouping and paired-unit reordering helpers from commit `31c6795b40fb54130192b5016d7dc29e9f457d30`; see `OPEN_GYM_ATTRIBUTION.md`. The user explicitly selected AGPL-3.0 before this reuse, so the former root GPLv3 file was replaced by the complete AGPL v3 license. The exercise metadata retains its separate MIT notice. No OpenGym or ExerciseDB imagery was imported.

## 2026-10-07 — Forge interface release

Rebranded the PWA, install manifest, app icons, navigation and product documentation as Forge. Replaced the long automatic first-run wizard with a welcome and plain-language starter-plan flow; removed measurement requirements from plan setup; explained sets/reps beside the workout logger; and tucked optional effort scores away. Added keyboard, reduced-motion and touch-target refinements while preserving local media, offline support and journal-derived progress.

## 2026-10-07 — Forge clarity pass

Put long plan rationale behind “Why this plan?”, changed “owner sync” to “account sync” and added regression coverage for the novice flow. Smoke-tested the quick-log, saved-progress and data-cleanup paths in the local preview. Automated tests passed; a five-person beginner study remains a recommendation, not completed research.

The GitHub repository remains named `Gym`; the app brand is **Forge**. See `README.md`, `SECURITY.md`, `docs/SYNC_AND_NOTIFICATIONS.md` and `OPEN_GYM_ATTRIBUTION.md` for current operating details.
