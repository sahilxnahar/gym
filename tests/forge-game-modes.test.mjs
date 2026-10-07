import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/training.js';
import '../public/forge-progress.js';
import '../public/forge-game.js';

const game = globalThis.ForgeGame;
const base = { version: 1, workouts: [], settings: { adventureMode: true, gameMode: 'ground-up' } };

test('Ground-Up Builder and Legacy Architect are story skins over the same progression', () => {
  const builder = game.snapshot(base);
  const legacyState = { ...base, settings: { ...base.settings, gameMode: 'legacy' } };
  const legacy = game.snapshot(legacyState);

  assert.deepEqual(game.modeOptions.map(option => option.title), ['Ground-Up Builder', 'Legacy Architect']);
  assert.equal(builder.mode.title, 'Ground-Up Builder');
  assert.equal(legacy.mode.title, 'Legacy Architect');
  assert.equal(builder.xp, legacy.xp);
  assert.equal(builder.level, legacy.level);
  assert.equal(builder.rank.title, legacy.rank.title);
  assert.deepEqual(builder.rewards, legacy.rewards);
  assert.match(game.render(base), /Choose one small step/);
  assert.match(game.render(legacyState), /Legacy Architect/);
  assert.match(game.renderMap(legacyState), /Estate Gate/);
  assert.match(game.renderMap(legacyState), /same XP, tiers and rewards/);
  assert.match(game.renderMap(base), /Open the next training chapter/);
  const oneSession = { ...base, workouts: [{ id: 'w1', finished: Date.now(), exercises: [] }] };
  assert.match(game.render(oneSession), /Try three different movements/);
  assert.doesNotMatch(game.render(oneSession), /Finish one workout of any length/);
});

test('rank tiers and short movement options remain activity-neutral', () => {
  assert.deepEqual(game.ranks.map(rank => rank.title), ['Apprentice', 'Builder', 'Keeper', 'Warden', 'Forge Master']);
  assert.deepEqual(game.quickWorkouts.map(item => item.minutes), [3, 5, 7, 8]);
  assert.equal(game.snapshot(base).rank.title, 'Apprentice');
});


test('tier progress fills toward the next named rank and celebrates a level-up once', () => {
  const workouts = Array.from({ length: 23 }, (_, index) => ({
    id: `tier-${index}`,
    finished: Date.now() - index * 60000,
    exercises: []
  }));
  workouts[0].exercises = [{ id: 'practice-row', sets: Array.from({ length: 15 }, () => ({ done: true })) }];
  const nearTier = { ...base, workouts };
  const before = game.snapshot(nearTier);

  assert.equal(before.xp, 1990);
  assert.equal(before.level, 2);
  assert.equal(before.rank.title, 'Apprentice');
  assert.equal(before.nextRank.title, 'Builder');
  assert.equal(before.rankProgress, 1990);
  assert.equal(before.rankProgressMax, 2000);
  assert.equal(before.xpToNextRank, 10);
  assert.match(game.render(nearTier), /10 Forge XP to Builder/);

  workouts[0].exercises[0].sets.push({ done: true });
  const after = game.snapshot(nearTier);
  assert.equal(after.xp, 2000);
  assert.equal(after.level, 3);
  assert.equal(after.rank.title, 'Builder');
  assert.match(game.levelUpNotice(before, after), /LEVEL UP · Forge level 3 · Builder tier/);
  assert.match(game.levelUpNotice(before, after), /Trail finder/);
  assert.equal(game.levelUpNotice(after, before), null);
});
