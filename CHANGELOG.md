# Changelog

## 2026-10-07 — Forge gym and customization expansion (0.3.0)

Added a centered Forge wordmark, a gym-first Tools destination, an original offline resistance-band illustration, bodyweight and band plan choices, an equipment-filtered movement library and editable superset pairing/reordering. Expanded profile ranges and schedules, with conservative older-adult defaults and an under-18 automatic-plan boundary. Added an optional adult-only BMI screening tool, simple cardio ideas, device-local diet reminders and warm/charcoal/high-contrast appearance options. Measurements do not determine a workout load or target, BMI is not saved, and food notes do not sync or enter backups.

Adapted only the verified OpenGym adjacent-pair grouping and paired-unit reordering helpers from commit `31c6795b40fb54130192b5016d7dc29e9f457d30`; see `OPEN_GYM_ATTRIBUTION.md`. The user explicitly selected AGPL-3.0 before this reuse, so the former root GPLv3 file was replaced by the complete AGPL v3 license. The exercise metadata retains its separate MIT notice. No OpenGym or ExerciseDB imagery was imported.

## 2026-10-07 — Forge interface release

Rebranded the PWA, install manifest, app icons, navigation and product documentation as Forge. Replaced the long automatic first-run wizard with a welcome and plain-language starter-plan flow; removed measurement requirements from plan setup; explained sets/reps beside the workout logger; and tucked optional effort scores away. Added keyboard, reduced-motion and touch-target refinements while preserving local media, offline support and journal-derived progress.

## 2026-10-07 — Forge clarity pass

Put long plan rationale behind “Why this plan?”, changed “owner sync” to “account sync” and added regression coverage for the novice flow. Smoke-tested the quick-log, saved-progress and data-cleanup paths in the local preview. Automated tests passed; a five-person beginner study remains a recommendation, not completed research.

The GitHub repository remains named `Gym`; the app brand is **Forge**. For the live installation, read `README.md` and `OPEN_GYM_ATTRIBUTION.md`.
