import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(resolve(root, path), 'utf8');

test('the browser PWA loads harmless native fallbacks before account sync', () => {
  const html = read('public/index.html');
  const config = read('public/forge-native-config.js');
  const health = read('public/forge-native-health.js');
  assert.match(config, /FORGE_NATIVE_APP\s*=\s*false/);
  assert.match(config, /FORGE_NATIVE_ACCOUNT_SYNC\s*=\s*true/);
  assert.match(health, /ForgeNativeHealth\s*=\s*null/);
  assert.ok(html.indexOf('/forge-native-config.js') < html.indexOf('/forge-native-health.js'));
  assert.ok(html.indexOf('/forge-native-health.js') < html.indexOf('/forge-health.js'));
  assert.ok(html.indexOf('/forge-health.js') < html.indexOf('/forge-cloud-sync.js'));
  assert.match(html, /href="\/forge-health\.css"/);
});

test('the browser health card is explicit, on-device only and never calls a health endpoint', () => {
  const ui = read('public/forge-health.js');
  assert.match(ui, /regular browser PWA cannot read Android Health Connect or Apple Health data/);
  assert.match(ui, /readToday\(\)/);
  assert.match(ui, /Forge works without connecting/);
  assert.doesNotMatch(ui, /localStorage|sessionStorage|fetch\s*\(|\/api\//);
  assert.match(read('public/forge-enhancements.js'), /action === 'connect-health'/);
});

test('native package bundles local PWA assets and keeps native account sync disabled', () => {
  const capacitor = JSON.parse(read('mobile/capacitor.config.json'));
  const mobilePackage = JSON.parse(read('mobile/package.json'));
  const build = read('mobile/scripts/prepare-web.mjs');
  assert.equal(capacitor.appId, 'com.forge.training');
  assert.equal(capacitor.webDir, 'www');
  assert.equal(capacitor.server.hostname, 'localhost');
  assert.equal(capacitor.server.androidScheme, 'https');
  assert.equal(capacitor.server.iosScheme, 'https');
  assert.equal(Object.hasOwn(capacitor.server, 'url'), false);
  assert.equal(mobilePackage.dependencies['@capacitor/health-fitness'], '^1.0.1');
  assert.match(build, /cp\(publicDir, webDir/);
  assert.match(build, /FORGE_NATIVE_ACCOUNT_SYNC = false/);
  assert.match(read('mobile/README.md'), /local-first while a secure native account\/session bridge is completed/);
});

test('Android requests only read-only STEPS, with background and historical reads disabled', () => {
  const manifest = read('mobile/android/app/src/main/AndroidManifest.xml');
  const declarations = [...manifest.matchAll(/<uses-permission\b[^>]*android:name="([^"]+)"[^>]*\/>/g)].map(match => ({ name: match[1], source: match[0] }));
  const permissions = declarations.filter(item => !item.source.includes('tools:node="remove"')).map(item => item.name);
  assert.deepEqual(permissions.sort(), ['android.permission.INTERNET', 'android.permission.health.READ_STEPS'].sort());
  assert.ok(declarations.some(item => item.name === 'android.permission.ACCESS_FINE_LOCATION' && item.source.includes('tools:node="remove"')));
  const health = JSON.parse(read('mobile/android/healthfitness.config.json'));
  assert.match(read('mobile/android/variables.gradle'), /minSdkVersion\s*=\s*26/);
  assert.deepEqual(health.permissions, { STEPS: 'Read' });
  assert.equal(health.disableBackgroundJobs, true);
  assert.equal(health.disableReadHealthDataHistory, true);
  assert.equal(health.privacyPolicyUrl, 'https://gym-pwa-production-d169.up.railway.app/health-privacy.html');
});

test('iOS requests HealthKit only without background delivery or write operations', () => {
  const info = read('mobile/ios/App/App/Info.plist');
  const entitlements = read('mobile/ios/App/App/App.entitlements');
  const pbx = read('mobile/ios/App/App.xcodeproj/project.pbxproj');
  assert.match(info, /NSHealthShareUsageDescription/);
  assert.match(info, /NSHealthUpdateUsageDescription/);
  assert.doesNotMatch(info, /UIBackgroundModes|BGTaskSchedulerPermittedIdentifiers/);
  assert.match(entitlements, /com\.apple\.developer\.healthkit/);
  assert.doesNotMatch(entitlements, /com\.apple\.developer\.healthkit\.access/);
  assert.doesNotMatch(entitlements, /background-delivery|recalibrate-estimates/);
  assert.equal((pbx.match(/CODE_SIGN_ENTITLEMENTS = App\/App\.entitlements;/g) || []).length, 2);
});

test('offline shell includes health assets and public privacy page', () => {
  const serviceWorker = read('public/sw.js');
  for (const path of ['/forge-health.css', '/forge-native-config.js', '/forge-native-health.js', '/forge-health.js', '/health-privacy.html', '/third-party-notices.html', '/licenses/Apache-2.0.txt']) {
    assert.ok(serviceWorker.includes(`'${path}'`), `${path} should be in the offline app shell`);
  }
  assert.match(read('public/health-privacy.html'), /third-party-notices\.html/);
});

test('native dependency and exercise-data notices include the license terms required by the bundle', () => {
  const notices = read('public/third-party-notices.html');
  const apache = read('public/licenses/Apache-2.0.txt');
  assert.match(notices, /@capacitor\/health-fitness.*1\.0\.1/);
  assert.match(notices, /2017-present Drifty Co\./);
  assert.match(notices, /Copyright \(c\) 2026 Ionic/);
  assert.match(notices, /Android Software Development Kit License/);
  assert.match(notices, /Copyright \(c\) 2026 Hasan Emir Yıldırım/);
  assert.match(apache, /Apache License[\s\S]*Version 2\.0, January 2004/);
});

test('native companion skips automatic browser-account probes and hides the browser-only login actions', () => {
  const sync = read('public/forge-cloud-sync.js');
  const guard = sync.indexOf('FORGE_NATIVE_APP === true && globalThis.FORGE_NATIVE_ACCOUNT_SYNC !== true');
  const resume = sync.indexOf('async function resume()');
  const authProbe = sync.indexOf("fetch('/api/auth/me'");
  assert.ok(resume >= 0 && guard > resume && guard < authProbe);
  const ui = read('public/forge-enhancements.js');
  assert.match(ui, /querySelectorAll\('\[data-action="login"\], \[data-action="register"\]'\)/);
  assert.match(ui, /Account sign-in and cross-device sync are intentionally paused/);
});

test('game tier progress and level-up toasts are calculated from actual saved workouts', () => {
  const game = read('public/forge-game.js');
  const app = read('public/app.js');
  assert.match(game, /rankProgressMax/);
  assert.match(game, /xpToNextRank/);
  assert.match(game, /LEVEL UP/);
  assert.match(app, /gameSavedNotice\(beforeGame/);
  assert.match(read('public/forge-game.css'), /\.campaign-rank progress/);
});
