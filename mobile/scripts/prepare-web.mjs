import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const mobileRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(mobileRoot, '..');
const webDir = join(mobileRoot, 'www');
const publicDir = join(repoRoot, 'public');
const webAppUrl = new URL(process.env.FORGE_WEB_APP_URL || 'https://gym-pwa-production-d169.up.railway.app/');

if (webAppUrl.protocol !== 'https:') throw new Error('FORGE_WEB_APP_URL must use HTTPS.');
await rm(webDir, { recursive: true, force: true });
await mkdir(webDir, { recursive: true });
await cp(publicDir, webDir, { recursive: true });
await writeFile(join(webDir, 'forge-native-config.js'), [
  'globalThis.FORGE_NATIVE_APP = true;',
  'globalThis.FORGE_NATIVE_ACCOUNT_SYNC = false;',
  `globalThis.FORGE_WEB_APP_URL = ${JSON.stringify(webAppUrl.href)};`,
  ''
].join('\n'), 'utf8');
await build({
  entryPoints: [join(mobileRoot, 'src', 'forge-native-health.mjs')],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['safari15', 'chrome110'],
  legalComments: 'inline',
  outfile: join(webDir, 'forge-native-health.js')
});
console.log('Prepared local Forge PWA bundle and native Health bridge.');
