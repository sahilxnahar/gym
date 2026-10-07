import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

globalThis.window = {};
await import('../public/gym-progress.js');
const progress = globalThis.window.GymProgress;
const sessionOn = day => ({ finished: new Date(2026, 9, day, 12).getTime() });

test('XP is derived only from completed sessions and completed sets', () => {
  assert.equal(progress.totalXp([], 0), 0);
  assert.equal(progress.totalXp([sessionOn(7)], 3), 110);
  assert.equal(progress.totalXp([{ started: Date.now() }], 4), 40);
});

test('streak uses consecutive local calendar days and allows yesterday to stay active', () => {
  const today = new Date(2026, 9, 7, 18);
  assert.equal(progress.streakDays([sessionOn(7), sessionOn(6), sessionOn(5)], today), 3);
  assert.equal(progress.streakDays([sessionOn(6), sessionOn(5)], today), 2);
  assert.equal(progress.streakDays([sessionOn(7), sessionOn(5)], today), 1);
  assert.equal(progress.streakDays([sessionOn(5), sessionOn(3)], today), 0);
});

test('progress rendering explains XP rewards and only unlocks earned milestones', () => {
  const html = progress.render([sessionOn(7)], 1);
  assert.match(html, /90 <small>XP<\/small>/);
  assert.match(html, /80 XP per session/);
  assert.match(html, /10 XP per completed set/);
  assert.match(html, /class="momentum-badge earned"/);
  assert.match(html, /Progress to next level/);
});

test('toast and progress feedback do not depend on CSP-blocked inline styles', async () => {
  const app = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
  const progressSource = await readFile(new URL('../public/gym-progress.js', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /\$\('#toast'\)\.style\.display/);
  assert.doesNotMatch(progressSource, /\sstyle=/);
});
