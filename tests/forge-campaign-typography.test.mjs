import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));

test('one self-hosted Barlow family is used across the app and cached for offline use', () => {
  const html = read('../public/index.html');
  const theme = read('../public/forge-theme.css');
  const base = read('../public/styles.css');
  const worker = read('../public/sw.js');
  const server = read('../server.mjs');
  const weights = [400, 500, 600, 700, 800, 900];
  assert.match(html, /preload[^>]+barlow-latin-400-normal\.woff2/);
  assert.match(html, /href="\/forge-game\.css"/);
  assert.match(theme, /font-family:"Barlow"/);
  assert.match(base, /font-family:"Barlow"/);
  assert.doesNotMatch(`${theme}\n${base}`, /ui-monospace|font-family:Inter/);
  assert.match(server, /'\.woff2': 'font\/woff2'/);
  assert.match(server, /'\.txt': 'text\/plain; charset=utf-8'/);
  for (const weight of weights) {
    const name = `barlow-latin-${weight}-normal.woff2`;
    assert.ok(existsSync(resolve(root, 'public/fonts', name)), `missing ${name}`);
    assert.ok(worker.includes(`/fonts/${name}`), `offline cache missing ${name}`);
  }
  assert.ok(statSync(resolve(root, 'public/fonts/OFL.txt')).size > 1000);
  assert.match(read('../public/fonts/OFL.txt'), /SIL OPEN FONT LICENSE Version 1\.1/);
  assert.ok(worker.includes('/fonts/OFL.txt'), 'offline cache missing the font license');
});

test('email is the explicit login ID and story route can be selected in settings', () => {
  const app = read('../public/app.js');
  const enhancements = read('../public/forge-enhancements.js');
  const game = read('../public/forge-game.js');
  const server = read('../server.mjs');
  assert.match(app, /Login ID \(email address\)/);
  assert.match(app, /autocomplete="username"/);
  assert.match(app, /gameMode:'ground-up'/);
  assert.match(enhancements, /name="forge-game-mode"/);
  assert.match(enhancements, /Story changed\. Your levels and rewards are unchanged\./);
  assert.match(game, /Ground-Up Builder/);
  assert.match(game, /Legacy Architect/);
  assert.match(server, /optional\(value\.gameMode, v => \['ground-up', 'legacy'\]\.includes\(v\)\)/);
});
