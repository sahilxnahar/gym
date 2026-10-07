import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const syncSource = readFileSync(new URL('../public/forge-sync.js', import.meta.url), 'utf8');
const clientSource = readFileSync(new URL('../public/forge-cloud-sync.js', import.meta.url), 'utf8');
const copy = value => JSON.parse(JSON.stringify(value));
function state(workouts = []) {
  return { version: 1, workouts, routines: [], bodyweight: [], sessionDrafts: [], active: null,
    settings: { unit: 'kg', rest: 90, theme: 'warm', adventureMode: true }, reminders: null, foodPreferences: null };
}
function workout(id, note) {
  return { id, name: 'Session', started: 1700000000000, notes: note, exercises: [] };
}
function makeClient(fetcher) {
  const values = new Map(), listeners = new Map(), status = { textContent: '' }, toasts = [];
  const localStorage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
  const document = {
    hidden: false,
    querySelector(selector) { return selector === '#sync-status' ? status : null; },
    dispatchEvent(event) { (listeners.get(event.type) || []).forEach(fn => fn(event)); },
    addEventListener(type, fn) { listeners.set(type, [...(listeners.get(type) || []), fn]); }
  };
  let currentState = state(), currentUser = null, revision = 0, mutation = 0, renders = 0, epoch = 0;
  const sandbox = {
    console, document, localStorage, navigator: { onLine: true }, fetch: fetcher, addEventListener() {},
    CustomEvent: class { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } },
    crypto: { randomUUID: () => 'merge-copy-0001' },
    setTimeout: () => 1, clearTimeout: () => {}, structuredClone: copy
  };
  sandbox.window = sandbox;
  const context = vm.createContext(sandbox);
  vm.runInContext(syncSource, context);
  vm.runInContext(clientSource, context);
  const bridge = {
    getState: () => currentState, setState: value => { currentState = value; }, getUser: () => currentUser,
    setUser: value => { currentUser = value; }, getRevision: () => revision, setRevision: value => { revision = value; },
    getMutationCount: () => mutation, setSyncConflict: () => {}, bumpCloudEpoch: () => { epoch += 1; },
    empty: () => state(), normalizeState: value => ({ ...state(), ...copy(value), settings: { ...state().settings, ...(value.settings || {}) }, reminders: value.reminders || null }),
    isValid: value => Boolean(value && value.version === 1 && Array.isArray(value.workouts)),
    render: () => { renders += 1; }, save: () => { mutation += 1; }, toast: value => toasts.push(value)
  };
  sandbox.ForgeCloudSync.attach(bridge);
  return { sandbox, values, localStorage, status, toasts, setState: value => { currentState = value; }, getState: () => currentState, getUser: () => currentUser, getRevision: () => revision, renders: () => renders };
}
const response = (status, body) => ({ status, ok: status >= 200 && status < 300, json: async () => copy(body) });

test('first sign-in merges local and account workouts instead of replacing either journal', async () => {
  const puts = [];
  const client = makeClient(async (_url, options = {}) => {
    if (options.method === 'PUT') { puts.push(JSON.parse(options.body)); return response(200, { ok: true, revision: 6 }); }
    throw new Error(`Unexpected request ${_url}`);
  });
  client.localStorage.setItem('forge-mode', 'local');
  const bridgeUser = { id: 4, email: 'owner@example.test' };
  const app = client.sandbox;
  // Configure the bridge state through the captured application interface.
  const local = state([workout('local-one', 'Laptop'), workout('local-two', 'Phone')]);
  client.setState(local);
  const remote = { state: state([workout('cloud-one', 'Account')]), revision: 5 };
  // The public module captures its bridge internally; a login event uses this public method.
  await app.ForgeCloudSync.acceptLogin(bridgeUser, remote);
  assert.equal(client.getUser().id, 4);
  assert.equal(client.getRevision(), 6);
  assert.deepEqual(new Set(puts.at(-1).state.workouts.map(item => item.id)), new Set(['local-one', 'local-two', 'cloud-one']));
  assert.ok(client.localStorage.getItem('forge-local-backup'));
  assert.equal(client.status.textContent.startsWith('Synced at '), true);
});

test('revision conflict preserves concurrent edits as a clearly named copy and retries safely', async () => {
  const base = state([workout('same', 'original')]);
  const local = state([workout('same', 'edited on phone')]);
  const remote = state([workout('same', 'edited on laptop')]);
  const client = makeClient(async (_url, options = {}) => {
    if (options.method !== 'PUT') throw new Error(`Unexpected request ${_url}`);
    if (!clientFirstPut.done) { clientFirstPut.done = true; return response(409, { state: remote, revision: 8, error: 'changed' }); }
    clientFirstPut.payload = JSON.parse(options.body);
    return response(200, { ok: true, revision: 9 });
  });
  const clientFirstPut = { done: false, payload: null };
  client.localStorage.setItem('forge-mode', 'account');
  client.localStorage.setItem('forge-account-9', JSON.stringify(local));
  client.localStorage.setItem('forge-sync-base-v1-9', JSON.stringify(base));
  await client.sandbox.ForgeCloudSync.acceptLogin({ id: 9, email: 'owner@example.test' }, { state: remote, revision: 7 });
  assert.equal(client.getRevision(), 9);
  assert.equal(clientFirstPut.payload.state.workouts.length, 2);
  assert.ok(clientFirstPut.payload.state.workouts.some(item => item.syncConflictCopy && item.notes === 'edited on phone'));
  assert.ok(clientFirstPut.payload.state.workouts.some(item => item.notes === 'edited on laptop'));
  assert.ok(client.localStorage.getItem('forge-sync-notes-9'));
  assert.ok(client.localStorage.getItem('forge-last-sync-9'), 'The recovered snapshot was acknowledged by the account server.');
});

test('offline sync keeps the local account snapshot and exposes a clear recoverable status', async () => {
  const client = makeClient(async () => { throw new Error('Failed to fetch'); });
  const local = state([workout('offline-one', 'saved here')]);
  client.localStorage.setItem('forge-mode', 'account');
  client.localStorage.setItem('forge-account-12', JSON.stringify(local));
  await client.sandbox.ForgeCloudSync.acceptLogin({ id: 12, email: 'owner@example.test' }, { state: local, revision: 4 });
  client.sandbox.navigator.onLine = false;
  const result = await client.sandbox.ForgeCloudSync.syncNow();
  assert.equal(result, false);
  assert.equal(JSON.parse(client.localStorage.getItem('forge-account-12')).workouts[0].id, 'offline-one');
  assert.match(client.status.textContent, /Offline/);
});
