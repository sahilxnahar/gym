import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');
const app = await read('../public/app.js');
const shell = await read('../public/index.html');
const theme = await read('../public/forge-theme.css');

test('Forge is the product brand throughout the installable shell', async () => {
  const manifest = JSON.parse(await read('../public/manifest.webmanifest'));
  assert.match(shell, /<title>Forge — Your workout journal<\/title>/);
  assert.match(shell, /FORGE \/ TRAINING JOURNAL/);
  assert.equal(manifest.short_name, 'Forge');
  assert.doesNotMatch(shell, /GYM \/ TRAINING JOURNAL/);
});

test('first run gives a choice and the plan flow does not require measurements', () => {
  assert.match(app, /function welcome\(/);
  assert.match(app, /Build my starter plan/);
  assert.match(app, /Explore Forge first/);
  const setup = app.slice(app.indexOf('function setup(step=0'), app.indexOf('\nfunction setLimit'));
  assert.match(setup, /ageGroup/);
  assert.match(setup, /Anything the plan should avoid/);
  assert.doesNotMatch(setup, /p-weightKg|p-heightCm/);
});

test('first-time users can choose a guided plan or a blank workout', () => {
  assert.match(app, /function beginWorkout\(/);
  assert.match(app, /Start a blank workout/);
  assert.match(app, /Build a starter plan/);
});

test('plan review keeps the summary visible and explains optional detail in plain language', () => {
  assert.match(app, /class="plan-explanation"/);
  assert.match(app, /Why this plan\?/);
  assert.match(app, /Start comfortably/);
  assert.match(app, /A set is one round of an exercise/);
  assert.match(app, /Your plan stays editable/);
  assert.doesNotMatch(app, /owner sync/i);
});

test('the workout screen explains simple terms and hides effort scoring by default', () => {
  const session = app.slice(app.indexOf('function session()'), app.indexOf('\nfunction modal'));
  assert.match(session, /A set is one round/);
  assert.match(session, /A rep is one time you repeat/);
  assert.match(session, /<details class="advanced-effort">/);
  assert.match(session, /Optional: how hard did it feel\?/);
});

test('keyboard focus, reduced motion and phone-safe navigation have explicit styles', () => {
  assert.match(shell, /Skip to main content/);
  assert.match(theme, /:focus-visible/);
  assert.match(theme, /prefers-reduced-motion/);
  assert.match(theme, /safe-area-inset-bottom/);
});
