# OpenGym code attribution

Forge adapts a small amount of workout-ordering code from [DuarteSantos8/openGym](https://github.com/DuarteSantos8/openGym) at commit [`31c6795b40fb54130192b5016d7dc29e9f457d30`](https://github.com/DuarteSantos8/openGym/tree/31c6795b40fb54130192b5016d7dc29e9f457d30). The source repository is licensed under the GNU Affero General Public License, version 3.0 (AGPL-3.0); the complete license is supplied as the root [`LICENSE`](LICENSE).

## Adapted files

| Forge file | OpenGym source | Adaptation |
|---|---|---|
| `public/forge-superset.js` | `frontend/src/lib/active-workout-order.js` | Keeps superset-pair units together while moving workout entries; adapts the `entries` list to Forge's `exercises` list. |
| `public/forge-superset.js` | `frontend/src/lib/history.js` | Reuses the adjacent `sg`-tag grouping concept so a pair behaves as one unit. |

Forge adds its own pair/unpair controls, labels, validation and session-rest behavior. The source file includes an in-file copyright, license, source path and commit notice. The project keeps this helper's corresponding source available in the public [sahilxnahar/Gym repository](https://github.com/sahilxnahar/Gym), linked from the app interface.

## What was not reused

No OpenGym GIFs, videos, thumbnails, screenshots, branding, translations, or media from its separately attributed ExerciseDB/Gym Visual assets are bundled. The app uses only the six local movement GIFs and matching stills from the user-supplied Forge archive, plus an original vector resistance-band illustration. The English exercise metadata and written instructions retain their separate MIT attribution in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md); that MIT license does not extend to third-party imagery.

The Forge codebase is distributed under AGPL-3.0-only, following the user's explicit instruction to change the prior project license before reusing AGPL code. This file records technical provenance; it is not legal advice.
