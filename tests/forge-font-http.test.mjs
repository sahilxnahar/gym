import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server.mjs';

test('local font and license assets are served with correct MIME types', async t => {
  const dataDir = mkdtempSync(join(tmpdir(), 'forge-fonts-'));
  const app = createApp({ dataDir, production: false, enableReminderScheduler: false });
  const origin = await new Promise(resolve => app.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${app.address().port}`)));
  t.after(async () => {
    await new Promise(resolve => app.close(resolve));
    rmSync(dataDir, { recursive: true, force: true });
  });

  const font = await fetch(`${origin}/fonts/barlow-latin-400-normal.woff2`);
  assert.equal(font.status, 200);
  assert.equal(font.headers.get('content-type'), 'font/woff2');
  assert.ok((await font.arrayBuffer()).byteLength > 1000);

  const license = await fetch(`${origin}/fonts/OFL.txt`);
  assert.equal(license.status, 200);
  assert.match(license.headers.get('content-type'), /text\/plain/);
  assert.match(await license.text(), /SIL OPEN FONT LICENSE Version 1\.1/);

  const gameCss = await fetch(`${origin}/forge-game.css`);
  assert.equal(gameCss.status, 200);
  assert.equal(gameCss.headers.get('content-type'), 'text/css');
});
