import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const mobileRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(mobileRoot, '..');
const localHome = join(repoRoot, '.work', 'tools', 'capacitor-home');
const localNpmCache = join(repoRoot, '.work', 'tools', 'forge-mobile-npm-cache');
await mkdir(join(localHome, 'config'), { recursive: true });
await mkdir(localNpmCache, { recursive: true });
const env = {
  ...process.env,
  HOME: localHome,
  XDG_CONFIG_HOME: join(localHome, 'config'),
  npm_config_cache: localNpmCache,
  CAPACITOR_TELEMETRY_DISABLED: 'true'
};
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function run(args) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(npx, ['cap', ...args], { cwd: mobileRoot, env, stdio: 'inherit' });
    child.once('error', rejectRun);
    child.once('exit', code => code === 0 ? resolveRun() : rejectRun(new Error(`Capacitor command exited with status ${code}`)));
  });
}

await run(['telemetry', 'off']);
const args = process.argv.slice(2);
if (!args.length) throw new Error('Pass a Capacitor command, for example: sync android.');
await run(args);
