# Forge interface review and redesign

## What the preview showed

The 600-pixel preview opened into a three-screen planner with six preference controls on its first page. Its forward button sat below the visible area. After closing the planner, Home showed two workout buttons, a separate plan card, another hero with a third workout button, a large progression panel, four statistic tiles and two more cards. A new user had to sort out the layout before doing anything.

The live session put weight, repetitions, RPE, rest controls, notes and set actions in view at once. The app also mixed clear terms such as “workout” with “volume,” “RPE,” “routine” and “XP.” The installed app and page title said Gym while the supplied source and many workout labels said Forge.

## Changes in this release

| Before | Forge now | Why it helps |
|---|---|---|
| Full setup opens on first visit | A short welcome offers “Build my starter plan” or “Explore Forge first” | A new user can look around without committing to a planner. |
| Six choices and body measurements in the first wizard page | Three short steps ask about goal, schedule, equipment and safety needs; measurements are not required | Users share less personal information and can make one set of decisions at a time. |
| A blank session can appear after pressing Start | Forge resumes an active workout, starts a saved plan, or offers a guided plan and a blank option | First-time users get a clear route instead of an empty workout. |
| Several competing calls to action on Home | One start card, one quick-log action, then the user's plan and progress | The most useful action stays easy to find on a phone. |
| Set, rep and RPE fields sit together | Forge defines a set and a rep beside the logger; effort scoring stays optional under “More” | New users can record the basics without learning gym shorthand first. |
| XP, total volume and a training streak | Forge points, weight logged and days in a row, with plain-language notes | Every number has a meaning. Workout volume no longer dominates the first view. |
| “Overview,” “Routines,” “History” and “GYM” labels | “Home,” “Plans,” “Workouts” and a consistent Forge wordmark | Navigation matches everyday language and the product name. |
| Compact controls and unclear page focus | Skip link, clear form labels, visible keyboard focus, larger touch targets and reduced-motion support | Keyboard and touch users can move through the same tasks. |
| Review screen repeats multiple explanations above a long plan | Keep the weekly summary visible; move deeper training rationale under “Why this plan?” and explain sets/reps beside the editable movements | The user can understand the immediate choice without losing access to the detail. |
| “Owner sync” appears in user-facing labels | Use “Account sync” and explain that local mode stays in the browser | Replace backend jargon with a clear description of what sync does. |

## Visual direction

Forge uses warm paper, charcoal panels and an ember accent. The layout keeps the training controls functional rather than adding remote stock imagery. The F mark, favicon, install icons, page title, manifest and application copy now share the Forge name. The app still uses local movement guides and works offline.

## Next improvements worth testing, in priority order

1. **Run real beginner testing:** ask five people who do not strength-train regularly to make a plan, start a workout and quick-log a finished one. Record whether they finish without help, where they pause and which words they ask about.
2. **Tune Home around the user's state:** active workout → “Resume”; saved plan → “Start my plan”; no plan → “Choose a workout.” Keep Quick log secondary and avoid multiple equally loud buttons.
3. **Keep progress welcoming:** test an optional “Simple / More detail” view so points, body-weight and personal-best data never crowd the workout action or imply a recommendation.
4. **Make finding a movement faster:** add filters for equipment and movement name, plus favorites, while keeping the current GIF, still frame and cues available offline.
5. **Check small screens and assistive tech:** repeat tasks at 360–390 px, keyboard-only, VoiceOver or TalkBack. Confirm sticky actions do not cover the current field and reduce motion when requested.
6. **Add localization only after copy review:** translate the core logging flow and exercise cues as one coherent set, rather than mixing translated labels with untranslated gym jargon.
7. **Review training content with a qualified coach:** especially any future substitution or progression rule. The current plans are general starting points, not individualized coaching.

## Validation

Validation passed: 27 Node tests; JavaScript syntax checks; the strict offline-media audit (six GIFs, six still frames, no videos); and a 600 px In-App Browser smoke test of the welcome, plan setup, quick log, saved progress and data cleanup. The browser console stayed clear. The final wording for plan review also has a regression test. A five-person beginner usability study and assistive-technology review remain recommendations, not completed research.
