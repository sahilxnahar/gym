import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const html = source('../public/index.html');
const app = source('../public/app.js');
const worker = source('../public/sw.js');
const sync = source('../public/forge-cloud-sync.js');
const enhancements = source('../public/forge-enhancements.js');
const reminders = source('../public/forge-reminders.js');
const supplement = source('../public/supplement-library.js');
const css = source('../public/forge-productivity.css');

test('Forge account UI clearly separates sign-in, per-device sessions and explicit sync', () => {
  assert.match(html, /id="sync-now-header"/);
  for (const script of ['forge-reminders.js', 'forge-sync.js', 'forge-game.js', 'supplement-library.js', 'forge-cloud-sync.js', 'forge-enhancements.js']) assert.ok(html.includes(`/${script}`), `Missing shell module ${script}`);
  assert.ok(html.indexOf('/forge-cloud-sync.js') < html.indexOf('/app.js'), 'Cloud module must load before the app bridge');
  assert.match(app, /Keep me signed in on this device for 30 days/);
  assert.match(sync, /first sign-in|local-first|Passwords/i);
  assert.match(sync, /forge-sync-base-v1-/);
  assert.match(sync, /ForgeSync\.mergeStates/);
  assert.doesNotMatch(sync, /localStorage\.setItem\([^,]*password/i, 'Passwords must never be stored in browser journal state');
});

test('offline shell precaches sync, reminders, game, supplements and Forge product styles', () => {
  for (const asset of ['/forge-reminders.js', '/forge-sync.js', '/forge-game.js', '/supplement-library.js', '/forge-cloud-sync.js', '/forge-enhancements.js', '/forge-productivity.css']) assert.ok(worker.includes(`'${asset}'`), `Service worker is missing ${asset}`);
  assert.match(worker, /addEventListener\('push'/);
  assert.match(worker, /addEventListener\('notificationclick'/);
  assert.match(enhancements, /syncEnabled/);
  assert.match(enhancements, /Enable on this device/);
  assert.match(enhancements, /15 GB Forge account-data ceiling/);
});

test('supplement learning uses linked sources and generic lock-screen copy without dosage advice', () => {
  assert.match(supplement, /NIH ODS/);
  assert.match(supplement, /FDA/);
  assert.match(supplement, /NCCIH/);
  assert.match(enhancements, /Forge does not tell you what or how much to take/);
  assert.match(reminders, /You have a supplement reminder\. Review it in Forge/);
  assert.doesNotMatch(enhancements, /data\.body:.*supplement\.label/);
  assert.match(css, /forge-supplement-grid/);
  assert.match(css, /forge-reminder-card/);
});
