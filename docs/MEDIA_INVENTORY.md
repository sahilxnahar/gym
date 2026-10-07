# Local movement-guide media

The supplied Forge archive contains six original schematic exercise GIFs and matching still frames. The finished PWA ships those files locally and the service worker caches both formats, so the guides do not depend on a remote image or video host. The Home at-home card previews the squat, push-up and glute-bridge guides using optimized 180×141, 32-frame copies derived from these local originals (each is capped below 120 KB); browsers set to reduced motion receive the matching still frames instead of animation. No OpenGym or ExerciseDB media is included. The media audit script checks file signatures, dimensions, GIF frames, source links, byte caps, SHA-256 values, app references, and service-worker cache coverage. `public/media-manifest.json` records the verified checksums.

| Movement guide | Full guide GIF | Still frame | Small Home preview |
| --- | --- | --- | --- | --- |
| Squat pattern | `public/demos/squat.gif` | `public/demos/squat.png` | `public/demos/previews/squat-preview.gif` |
| Push-up | `public/demos/pushup.gif` | `public/demos/pushup.png` | `public/demos/previews/pushup-preview.gif` |
| Dumbbell row | `public/demos/row.gif` | `public/demos/row.png` | — |
| Hip hinge | `public/demos/hinge.gif` | `public/demos/hinge.png` | — |
| Glute bridge | `public/demos/bridge.gif` | `public/demos/bridge.png` | `public/demos/previews/bridge-preview.gif` |
| Dead bug | `public/demos/deadbug.gif` | `public/demos/deadbug.png` | — |

No MP4, WebM, MOV, or M4V video files were present in either supplied archive. FitQuest also contains a `desktop-preview.webp` reference screenshot; it is not runtime workout media and is not included in the PWA. The guides are simplified movement-pattern illustrations, not video coaching or individualized technique assessment. See `THIRD_PARTY_NOTICES.md` for the origin and license boundary of the exercise metadata; the diagrams are identified there as original to the supplied Forge project.
