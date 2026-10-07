# Third-party metadata

FORGE includes English exercise metadata and written instruction text from the dataset represented in OpenGym at commit `31c6795b40fb54130192b5016d7dc29e9f457d30`. Dataset: https://github.com/hasaneyldrm/exercises-dataset; original content: ExerciseDB v1 / AscendAPI (https://exercisedb.dev/). OpenGym provenance notice: https://github.com/DuarteSantos8/openGym/blob/main/NOTICE.md. The metadata is distributed under the separate MIT terms below.

Forge also adapts OpenGym superset-ordering helpers. See [OPEN_GYM_ATTRIBUTION.md](OPEN_GYM_ATTRIBUTION.md) for exact files, commit and the AGPLv3 source notice. No Gym Visual/AscendAPI thumbnails, third-party animations or OpenGym media are included. Forge’s schematic GIFs and resistance-band illustration are original. Exercise text is general reference material and has not undergone individualized clinical review.

`web-push` is an installed runtime dependency used for opt-in notifications; its package is licensed under the Mozilla Public License 2.0 (MPL-2.0). Forge does not copy its source. See the [upstream license](https://github.com/web-push-libs/web-push/blob/master/LICENSE) and the version pinned in `package-lock.json`.

MIT License

Copyright (c) 2026 Hasan Emir Yıldırım

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation and data files (the "Software"),
to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


## Native companion dependency notices

The native companion bundles `@capacitor/core`, `@capacitor/android` and `@capacitor/ios` 8.5.2 (MIT, Copyright 2017-present Drifty Co.) and `@capacitor/health-fitness` 1.0.1 plus `io.ionic.libs:ionhealthfitness-android` 1.0.1 (MIT, Copyright 2026 Ionic). Its Android runtime also includes AndroidX/Jetpack and Gson components under Apache License 2.0, plus Play Services Auth 19.2.0 and Location 19.0.1 whose Maven metadata identifies the separate Android Software Development Kit License. The built app includes an offline-accessible [third-party notice page](public/third-party-notices.html) and bundled [Apache License 2.0 text](public/licenses/Apache-2.0.txt). The web-push server dependency remains separately licensed under MPL-2.0 as described above.
