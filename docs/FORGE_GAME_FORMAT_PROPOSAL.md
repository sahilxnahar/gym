# Forge game format: recommendation and options

## Recommendation

Use a **story campaign with flexible micro-missions**. A person chooses any movement that fits the day, logs it, earns Forge XP, sees a chapter or rank move forward, and can pick another mission when ready. Keep the game layer optional and let the player switch stories without losing progress.

Use two equal-play routes:

- **Ground-Up Builder**: begin with a quiet workshop and restore training spaces one chapter at a time. This is the recommended default because visible building progress fits Forge's beginner-first promise and gives a clear sense of competence.
- **Legacy Architect**: begin with a training estate and open its wings, partners and archive. This is the “rich-man/tycoon” fantasy, framed as stewardship rather than status.

Both routes use the same workouts, XP, chapter unlocks, rewards, and effort. Neither route requires money, extra training, bodyweight targets, consecutive-day streaks, or a daily login. Switching routes changes story language only; it does not reset progress. I would not label the first route “slave.” It can sound degrading and controlling; “Ground-Up Builder” keeps the start-from-nothing idea while treating the player with respect.

## Current implementation in Forge 0.6.0

- Home shows the optional campaign, a progress-to-next-rank bar, one actionable mission and short-workout choices. Completing a real logged workout updates XP; crossing a tier threshold produces one brief level-up toast that names the new rank and reward.
- Settings offers Ground-Up Builder and Legacy Architect as equal story routes. Switching changes story text only; workout options, point rules, unlocks and progress remain the same.
- The map shows the current level gate, chapter path and what each next unlock represents. Ranks are Apprentice (1–2), Builder (3–4), Keeper (5–7), Warden (8–11), and Forge Master (12+).
- There are no purchasable advantages, shame labels, lost-streak penalties, or workout/body-size gates. The game can encourage a next step, but does not guarantee increased energy or any health outcome.

## Game-format options

| Format | Fit for Forge | Recommendation |
|---|---|---|
| Story campaign + micro-missions | Makes a small session feel like a meaningful next step; supports bodyweight, bands, walking and full workouts. | **Best default**. Use the Ground-Up story first, with Legacy as an equal alternate. |
| Tycoon / estate-builder story | Appeals to players who like management and world-building; can use the same physical tasks as the campaign. | Offer as a story choice, not a higher-paid or higher-effort tier. |
| XP and badges only | Fast to understand and easy to maintain. | Keep as the quiet/minimal option for people who do not want fantasy. |
| Leaderboards, lost streaks or punishment | Encourages comparison or guilt and makes rest feel like failure. | Do not make this the default; there is no evidence it is more effective for Forge's audience. |

## Rank ladder

Ranks add identity to the existing level system; they do not add training difficulty. Use Apprentice (Level 1–2), Builder (3–4), Keeper (5–7), Warden (8–11), and Forge Master (12+). Unlock story rooms and cosmetic titles from logged activity. Never award more for lifting heavier, changing body size, or exercising through pain.

## Why this is the best-supported direction

A 2022 systematic review and meta-analysis of 16 randomized trials (2,407 participants) reported a small-to-medium average effect of gamified interventions on general physical activity (Hedges g 0.42 after sensitivity analyses). Daily-step outcomes were also positive, while moderate-to-vigorous activity was not statistically significant in the sensitivity analysis; effects were smaller at longer follow-up. The evidence had heterogeneity and other limitations, and it could not isolate which game element caused the effect. It does **not** show that a “poor” or “rich” story is superior. [Mazeas et al., JMIR, 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC8767479/).

A systematic review of exercise research using self-determination theory found consistent links between more autonomous motivation, competence satisfaction and exercise participation, while noting limited longer-term experimental evidence. That supports offering a genuine choice, achievable actions and clear feedback instead of pressure or shame. [Teixeira et al., 2012](https://pmc.ncbi.nlm.nih.gov/articles/PMC3441783/).

**Energy is an aspiration, not a promise.** Forge can make movement easier to start through short options and positive progress feedback. It cannot guarantee that a game mode will make someone feel more energetic. If Forge is evaluated later, look at voluntarily logged session starts/completions and whether people keep using the app, not weight change or a medical outcome. Do not add analytics or collect new health data without an explicit product decision.

## Product rules for implementation

1. Any movement length counts; three-minute, bodyweight, band and walking sessions remain available.
2. Rest days do not remove levels, currency, rewards or chapters.
3. The story never changes recommended workout load or weekly targets.
4. Rewards stay cosmetic and narrative; no purchase gate or hidden premium route.
5. Show the next unlock and one useful mission, not a wall of numbers.
6. Keep local-first use available; an account only syncs the player's journal and settings after sign-in.
