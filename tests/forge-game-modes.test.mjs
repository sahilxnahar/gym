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
