import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import webpush from 'web-push';
import { createApp, validState } from '../server.mjs';
import '../public/forge-reminders.js';

const secret = 'local-test-setup-token-with-at-least-32-characters';
function baseState() {
  return { version: 1, workouts: [], routines: [], bodyweight: [], sessionDrafts: [], active: null,
    settings: { unit: 'kg', rest: 90, theme: 'warm', adventureMode: true },
    reminders: globalThis.ForgeReminders.defaults('UTC'), foodPreferences: null };
}
function start(options = {}) {
  const dataDir = mkdtempSync(join(tmpdir(), 'forge-productivity-'));
  const app = createApp({ dataDir, setupToken: secret, production: false, ...options });
  return new Promise(resolve => app.listen(0, '127.0.0.1', () => resolve({ app, dataDir, origin: `http://127.0.0.1:${app.address().port}` })));
}
const cookie = response => response.headers.get('set-cookie').split(';')[0];
const headers = (origin, session) => ({ Origin: origin, 'Content-Type': 'application/json', ...(session ? { Cookie: session } : {}) });
const post = (origin, path, body, session, extra = {}) => fetch(origin + path, { method: 'POST', headers: { ...headers(origin, session), ...extra }, body: JSON.stringify(body) });


test('reminder schedules, opt-in diet sync, quick-workout drafts and account-data limits persist together', async t => {
  const setup = await start({ maxDataBytes: 15000000000, physicalVolumeLabel: '50 GB Railway volume' });
  t.after(async () => { await new Promise(resolve => setup.app.close(resolve)); rmSync(setup.dataDir, { recursive: true, force: true }); });
  const registration = await post(setup.origin, '/api/auth/register', { email: 'owner@example.test', password: 'long-random-test-password', remember: true }, null, { 'x-setup-token': secret });
  assert.equal(registration.status, 201);
  const session = cookie(registration);
  const state = baseState();
  state.sessionDrafts = [{ id: 'draft-1', name: 'Five-minute reset', started: Date.now(), notes: '', exercises: [] }];
  state.reminders.water = { enabled: true, intervalMinutes: 120, start: '09:00', end: '19:00', days: [1, 2, 3, 4, 5] };
  state.reminders.walking.enabled = true;
  state.reminders.homeWorkout = { enabled: true, time: '17:30', days: [1, 3, 5] };
  state.reminders.supplements = [{ id: 'vitamin-note', label: 'My supplement reminder', time: '09:30', days: [1, 3, 5], enabled: true }];
  state.foodPreferences = { syncEnabled: true, value: { pattern: 'vegetarian', note: 'Test-only preference' } };
  assert.equal(validState(state), true);
  const saved = await fetch(setup.origin + '/api/state', { method: 'PUT', headers: headers(setup.origin, session), body: JSON.stringify({ state, revision: 0 }) });
  assert.equal(saved.status, 200);
  const loaded = await (await fetch(setup.origin + '/api/state', { headers: headers(setup.origin, session), cache: 'no-store' })).json();
  assert.deepEqual(loaded.state.reminders.supplements[0].label, 'My supplement reminder');
  assert.deepEqual(loaded.state.reminders.homeWorkout, state.reminders.homeWorkout);
  assert.deepEqual(loaded.state.foodPreferences, state.foodPreferences);
  assert.equal(loaded.state.sessionDrafts[0].id, 'draft-1');
  const storage = await (await fetch(setup.origin + '/api/storage', { headers: headers(setup.origin, session) })).json();
  assert.equal(storage.limitBytes, 15000000000);
  assert.equal(storage.physicalVolumeLabel, '50 GB Railway volume');
  const invalid = structuredClone(state); invalid.foodPreferences.value.pattern = 'prescribed-treatment';
  assert.equal(validState(invalid), false);
});


test('Web Push config is public-key-only; subscriptions are owner-bound, validated and removable', async t => {
  const vapid = webpush.generateVAPIDKeys();
  const setup = await start({ vapidPublicKey: vapid.publicKey, vapidPrivateKey: vapid.privateKey, physicalVolumeLabel: '50 GB Railway volume' });
  t.after(async () => { await new Promise(resolve => setup.app.close(resolve)); rmSync(setup.dataDir, { recursive: true, force: true }); });
  const config = await (await fetch(setup.origin + '/api/push/config')).json();
  assert.equal(config.available, true);
  assert.equal(config.publicKey, vapid.publicKey);
  assert.equal(Object.hasOwn(config, 'privateKey'), false);
  assert.equal((await fetch(setup.origin + '/api/push/devices')).status, 401);
  const registration = await post(setup.origin, '/api/auth/register', { email: 'push@example.test', password: 'long-random-test-password' }, null, { 'x-setup-token': secret });
  const session = cookie(registration), deviceId = 'device-test-00000001';
  const subscription = { endpoint: 'https://fcm.googleapis.com/fcm/send/test-device', keys: { p256dh: 'A'.repeat(87), auth: 'B'.repeat(22) } };
  const added = await post(setup.origin, '/api/push/subscribe', { deviceId, label: 'Test browser', subscription }, session);
  assert.equal(added.status, 201);
  const devices = await (await fetch(`${setup.origin}/api/push/devices?currentDeviceId=${deviceId}`, { headers: headers(setup.origin, session) })).json();
  assert.equal(devices.devices.length, 1);
  assert.equal(devices.devices[0].current, true);
  const unsafe = await post(setup.origin, '/api/push/subscribe', { deviceId: 'device-test-00000002', label: 'Bad', subscription: { ...subscription, endpoint: 'https://example.com/not-a-push-service' } }, session);
  assert.equal(unsafe.status, 400);
  assert.equal((await post(setup.origin, '/api/push/unsubscribe', { deviceId }, session)).status, 200);
  const after = await (await fetch(setup.origin + '/api/push/devices?currentDeviceId=' + deviceId, { headers: headers(setup.origin, session) })).json();
  assert.equal(after.devices.length, 0);
});


test('remembered sessions last thirty days; changing password revokes other device sessions', async t => {
  const setup = await start();
  t.after(async () => { await new Promise(resolve => setup.app.close(resolve)); rmSync(setup.dataDir, { recursive: true, force: true }); });
  const registration = await post(setup.origin, '/api/auth/register', { email: 'password@example.test', password: 'first-long-random-password', remember: true }, null, { 'x-setup-token': secret });
  assert.equal(registration.status, 201);
  assert.match(registration.headers.get('set-cookie'), /Max-Age=2592000/);
  const firstDevice = cookie(registration);
  const login = await post(setup.origin, '/api/auth/login', { email: 'password@example.test', password: 'first-long-random-password', remember: true });
  const secondDevice = cookie(login);
  assert.equal((await post(setup.origin, '/api/auth/password', { currentPassword: 'first-long-random-password', newPassword: 'second-long-random-password' }, firstDevice)).status, 200);
  assert.equal((await fetch(setup.origin + '/api/auth/me', { headers: headers(setup.origin, secondDevice) })).status, 401);
  assert.equal((await post(setup.origin, '/api/auth/login', { email: 'password@example.test', password: 'first-long-random-password' })).status, 401);
  assert.equal((await post(setup.origin, '/api/auth/login', { email: 'password@example.test', password: 'second-long-random-password' })).status, 200);
});


test('15GB account-data ceiling is clamped even if configuration requests more', async t => {
  const setup = await start({ maxDataBytes: 20000000000 });
  t.after(async () => { await new Promise(resolve => setup.app.close(resolve)); rmSync(setup.dataDir, { recursive: true, force: true }); });
  const registration = await post(setup.origin, '/api/auth/register', { email: 'cap@example.test', password: 'long-random-test-password' }, null, { 'x-setup-token': secret });
  const storage = await (await fetch(setup.origin + '/api/storage', { headers: headers(setup.origin, cookie(registration)) })).json();
  assert.equal(storage.limitBytes, 15000000000);
});
