import http from 'node:http';
import './public/training.js';
import './public/forge-reminders.js';
import webpush from 'web-push';
import { promisify } from 'node:util';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, extname, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const deriveKey = promisify(scrypt);
const hash = value => createHash('sha256').update(value).digest('hex');
const equal = (left, right) => {
  const a = Buffer.from(left), b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
};
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const validString = (value, max, required = false) => typeof value === 'string' && value.length <= max && (!required || value.length > 0);
const validNumber = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
const timestamp = value => validNumber(value, 0, 8640000000000000);
const optional = (value, check) => value === undefined || check(value);

export function validState(state) {
  const set = value => isObject(value) && validNumber(value.reps, 0, 10000) && validNumber(value.weight, 0, 10000) && (value.rpe === null || validNumber(value.rpe, 0, 10)) && typeof value.done === 'boolean' && optional(value.seconds, v => validNumber(v, 0, 86400)) && optional(value.distanceKm, v => validNumber(v, 0, 1000));
  const exercise = value => isObject(value) && optional(value.kind, v => ['reps', 'timed', 'cardio'].includes(v)) && optional(value.demoKey, v => ['squat', 'pushup', 'row', 'hinge', 'bridge', 'deadbug'].includes(v)) && optional(value.sg, v => typeof v === 'string' && /^[A-Za-z0-9_-]{1,24}$/.test(v)) && validString(value.id, 100, true) && validString(value.name, 200) && validString(value.muscle, 100) && validString(value.equipment, 100) && optional(value.notes, v => validString(v, 2000)) && Array.isArray(value.sets) && value.sets.length <= 100 && value.sets.every(set);
  const exercises = value => Array.isArray(value) && value.length <= 100 && value.every(exercise);
  const routine = value => isObject(value) && validString(value.id, 100, true) && validString(value.name, 200) && exercises(value.exercises);
  const workout = value => routine(value) && timestamp(value.started) && optional(value.finished, timestamp) && optional(value.restUntil, timestamp) && optional(value.notes, v => validString(v, 2000));
  const unique = values => new Set(values.map(value => value?.id)).size === values.length;
  const profileOK = value => { try { globalThis.ForgeTraining.validateProfile(value); return true; } catch { return false; } };
  const foodPatterns = new Set(['none', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher', 'gluten-free', 'dairy-free', 'other']);
  const foodPreferences = value => value === null || (isObject(value) && typeof value.syncEnabled === 'boolean' && (value.syncEnabled ? isObject(value.value) && foodPatterns.has(value.value.pattern) && validString(value.value.note, 400) : value.value === null));
  const settings = value => isObject(value) && ['kg', 'lb'].includes(value.unit) && validNumber(value.rest, 0, 600) && optional(value.theme, v => ['warm', 'charcoal', 'contrast'].includes(v)) && optional(value.adventureMode, v => typeof v === 'boolean');
  return isObject(state) && optional(state.profile, profileOK) && optional(state.profilePlanIds, v => Array.isArray(v) && v.length <= 6 && v.every(id => validString(id, 100, true)) && new Set(v).size === v.length) &&
    state.version === 1 && Array.isArray(state.workouts) && state.workouts.length <= 10000 && state.workouts.every(workout) && unique(state.workouts) &&
    Array.isArray(state.routines) && state.routines.length <= 1000 && state.routines.every(routine) && unique(state.routines) &&
    Array.isArray(state.bodyweight) && state.bodyweight.length <= 10000 && state.bodyweight.every(value => isObject(value) && validString(value.id, 100, true) && timestamp(value.date) && validNumber(value.weight, Number.MIN_VALUE, 1000)) && unique(state.bodyweight) &&
    optional(state.sessionDrafts, value => Array.isArray(value) && value.length <= 20 && value.every(workout) && unique(value)) &&
    (state.active === null || workout(state.active)) && settings(state.settings) && optional(state.reminders, globalThis.ForgeReminders.validSchedule) && optional(state.foodPreferences, foodPreferences);
}

export function createApp(options = {}) {
  const dataDir = options.dataDir || process.env.DATA_DIR || resolve(root, 'data');
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const dbPath = resolve(dataDir, 'forge.sqlite');
  const db = new DatabaseSync(dbPath);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,email TEXT NOT NULL UNIQUE,salt TEXT NOT NULL,password TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS states(user_id INTEGER PRIMARY KEY REFERENCES users(id),body TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS push_subscriptions(user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,device_id TEXT NOT NULL,label TEXT NOT NULL,endpoint TEXT NOT NULL UNIQUE,subscription TEXT NOT NULL,updated INTEGER NOT NULL,PRIMARY KEY(user_id,device_id));
    CREATE TABLE IF NOT EXISTS reminder_deliveries(user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,device_id TEXT NOT NULL,reminder_id TEXT NOT NULL,occurrence TEXT NOT NULL,sent_at INTEGER NOT NULL,PRIMARY KEY(user_id,device_id,reminder_id,occurrence));`);
  if (!db.prepare('PRAGMA table_info(states)').all().some(column => column.name === 'revision')) db.exec('ALTER TABLE states ADD COLUMN revision INTEGER NOT NULL DEFAULT 0');

  const limits = new Map();
  const setupToken = options.setupToken ?? process.env.SETUP_TOKEN ?? '';
  const production = options.production ?? process.env.NODE_ENV === 'production';
  const appOrigin = options.appOrigin || process.env.APP_ORIGIN;
  const rawLimit = Number(options.maxDataBytes ?? process.env.FORGE_MAX_DATA_BYTES ?? 15000000000);
  const maxDataBytes = Number.isSafeInteger(rawLimit) && rawLimit >= 1048576 ? Math.min(rawLimit, 15000000000) : 15000000000;
  const vapidPublicKey = options.vapidPublicKey ?? process.env.VAPID_PUBLIC_KEY ?? '';
  const vapidPrivateKey = options.vapidPrivateKey ?? process.env.VAPID_PRIVATE_KEY ?? '';
  const vapidSubject = options.vapidSubject || process.env.VAPID_SUBJECT || 'https://github.com/sahilxnahar/Gym';
  const physicalVolumeLabel = options.physicalVolumeLabel || process.env.FORGE_VOLUME_LABEL || '50 GB Railway volume';
  const pushReady = Boolean(vapidPublicKey && vapidPrivateKey);
  const pushSender = options.pushSender || ((subscription, payload, settings) => webpush.sendNotification(subscription, payload, settings));
  if (production) {
    let parsed;
    try { parsed = new URL(appOrigin); } catch {}
    if (!parsed || parsed.protocol !== 'https:' || parsed.origin !== appOrigin || parsed.username || parsed.password) { db.close(); throw new Error('Production requires APP_ORIGIN as an exact HTTPS origin'); }
  }
  if (setupToken && (setupToken.length < 32 || /replace-with|example|change-me/i.test(setupToken))) { db.close(); throw new Error('SETUP_TOKEN must be at least 32 characters and must not be a placeholder'); }
  if (pushReady) {
    try { webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey); }
    catch (error) { db.close(); throw new Error(`Invalid Web Push VAPID configuration: ${error.message}`); }
  }
  const dataUsage = () => ['','-wal','-shm'].reduce((total, suffix) => { try { return total + statSync(dbPath + suffix).size; } catch { return total; } }, 0);
  function send(res, status, body) { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); }
  async function readBody(req) {
    let size = 0; const parts = [];
    for await (const part of req) { size += part.length; if (size <= 4 * 1024 * 1024) parts.push(part); }
    if (size > 4 * 1024 * 1024) throw Object.assign(new Error('Request too large'), { status: 413 });
    try { return JSON.parse(Buffer.concat(parts).toString()); }
    catch { throw Object.assign(new Error('Invalid JSON'), { status: 400 }); }
  }
  function ownerFor(req) {
    const token = /(?:^|;\s*)forge_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
    if (!token) return null;
    return db.prepare('SELECT users.id,users.email FROM sessions JOIN users ON users.id=sessions.user_id WHERE token=? AND expires>?').get(hash(token), Date.now());
  }
  function setSession(res, id, remember = false) {
    const token = randomBytes(32).toString('hex'), duration = remember ? 30 : 7, maxAge = duration * 86400;
    db.prepare('DELETE FROM sessions WHERE expires<=?').run(Date.now());
    db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(token), id, Date.now() + maxAge * 1000);
    res.setHeader('Set-Cookie', `forge_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${production ? '; Secure' : ''}`);
  }
  function clearSession(res, req) {
    const token = /(?:^|;\s*)forge_session=([a-f0-9]{64})/.exec(req.headers.cookie || '')?.[1];
    if (token) db.prepare('DELETE FROM sessions WHERE token=?').run(hash(token));
    res.setHeader('Set-Cookie', `forge_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${production ? '; Secure' : ''}`);
  }
  const allowedPushHost = hostname => hostname === 'fcm.googleapis.com' || hostname.endsWith('.push.apple.com') || hostname.endsWith('.push.services.mozilla.com') || hostname.endsWith('.notify.windows.com');
  function validPushSubscription(value) {
    if (!isObject(value) || typeof value.endpoint !== 'string' || value.endpoint.length > 2048 || !isObject(value.keys)) return false;
    try { const url = new URL(value.endpoint); if (url.protocol !== 'https:' || !allowedPushHost(url.hostname.toLowerCase())) return false; } catch { return false; }
    return typeof value.keys.p256dh === 'string' && /^[A-Za-z0-9_-]{60,160}$/.test(value.keys.p256dh) && typeof value.keys.auth === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(value.keys.auth);
  }

  let reminderBusy = false;
  async function sendDueReminders(now = new Date()) {
    if (!pushReady || reminderBusy) return;
    reminderBusy = true;
    try {
      const rows = db.prepare('SELECT user_id,body FROM states').all();
      for (const row of rows) {
        let state;
        try { state = JSON.parse(row.body); } catch { continue; }
        const due = globalThis.ForgeReminders.dueOccurrences(state.reminders, now);
        if (!due.length) continue;
        const devices = db.prepare('SELECT device_id,subscription FROM push_subscriptions WHERE user_id=?').all(row.user_id);
        for (const reminder of due) for (const device of devices) {
          const claim = db.prepare('INSERT OR IGNORE INTO reminder_deliveries(user_id,device_id,reminder_id,occurrence,sent_at) VALUES(?,?,?,?,?)').run(row.user_id, device.device_id, reminder.id, reminder.occurrence, Date.now());
          if (!claim.changes) continue;
          try {
            await pushSender(JSON.parse(device.subscription), JSON.stringify({ title: reminder.title, body: reminder.body, icon: '/icon-192.png', badge: '/icon-192.png', tag: `forge-${reminder.kind}`, data: { url: '/' } }), { TTL: 1800, urgency: 'normal' });
          } catch (error) {
            if (error?.statusCode === 404 || error?.statusCode === 410) db.prepare('DELETE FROM push_subscriptions WHERE user_id=? AND device_id=?').run(row.user_id, device.device_id);
            else db.prepare('DELETE FROM reminder_deliveries WHERE user_id=? AND device_id=? AND reminder_id=? AND occurrence=?').run(row.user_id, device.device_id, reminder.id, reminder.occurrence);
          }
        }
      }
    } finally { reminderBusy = false; }
  }

  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'; frame-src 'self'; form-action 'self'");
    if (production) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    try {
      const pathname = new URL(req.url, 'http://localhost').pathname;
      if (pathname === '/health' && req.method === 'GET') return send(res, 200, { ok: true });
      if (pathname === '/api/push/config' && req.method === 'GET') return send(res, 200, { available: pushReady, publicKey: pushReady ? vapidPublicKey : null });
      if (pathname.startsWith('/api/')) {
        if (!['GET', 'POST', 'PUT'].includes(req.method)) return send(res, 405, { error: 'Method not allowed' });
        if (req.method !== 'GET') {
          const origin = req.headers.origin;
          const expected = appOrigin || `${production ? 'https' : 'http'}://${req.headers.host}`;
          if (!origin || origin !== expected) return send(res, 403, { error: 'Origin not allowed' });
          if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return send(res, 415, { error: 'Use application/json' });
        }
        if (pathname === '/api/auth/register' || pathname === '/api/auth/login') {
          if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
          const key = req.socket.remoteAddress, now = Date.now(), slot = limits.get(key) || { count: 0, until: now + 900000 };
          if (slot.until < now) { slot.count = 0; slot.until = now + 900000; }
          slot.count++; limits.set(key, slot);
          if (limits.size > 10000) for (const [k, v] of limits) if (v.until < now) limits.delete(k);
          if (slot.count > 20) return send(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
          const input = await readBody(req), email = typeof input?.email === 'string' ? input.email.trim().toLowerCase() : '', password = input?.password, remember = input?.remember === true;
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || typeof password !== 'string' || password.length < 12 || password.length > 128) return send(res, 400, { error: 'Use a valid email and a password of 12–128 characters.' });
          if (pathname.endsWith('/register')) {
            if (!setupToken || !equal(req.headers['x-setup-token'] || '', setupToken)) return send(res, 403, { error: 'Valid setup token required' });
            if (db.prepare('SELECT id FROM users LIMIT 1').get()) return send(res, 409, { error: 'Owner account already exists' });
            const salt = randomBytes(16).toString('hex'), passwordHash = (await deriveKey(password, salt, 64)).toString('hex');
            if (db.prepare('SELECT id FROM users LIMIT 1').get()) return send(res, 409, { error: 'Owner account already exists' });
            const result = db.prepare('INSERT INTO users(email,salt,password) VALUES(?,?,?)').run(email, salt, passwordHash);
            setSession(res, Number(result.lastInsertRowid), remember);
            return send(res, 201, { user: { id: Number(result.lastInsertRowid), email } });
          }
          const account = db.prepare('SELECT * FROM users WHERE email=?').get(email);
          const computed = (await deriveKey(password, account?.salt || '00000000000000000000000000000000', 64)).toString('hex');
          if (!account || !equal(computed, account.password)) return send(res, 401, { error: 'Invalid email or password' });
          setSession(res, account.id, remember);
          return send(res, 200, { user: { id: account.id, email: account.email } });
        }
        const owner = ownerFor(req);
        if (!owner) return send(res, 401, { error: 'Sign in required' });
        if (pathname === '/api/auth/me' && req.method === 'GET') return send(res, 200, { user: owner });
        if (pathname === '/api/auth/logout' && req.method === 'POST') { clearSession(res, req); return send(res, 200, { ok: true }); }
        if (pathname === '/api/auth/password' && req.method === 'POST') {
          const input = await readBody(req), currentPassword = input?.currentPassword, newPassword = input?.newPassword;
          if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 12 || newPassword.length > 128) return send(res, 400, { error: 'Use your current password and a new password of 12–128 characters.' });
          const account = db.prepare('SELECT * FROM users WHERE id=?').get(owner.id);
          const computed = (await deriveKey(currentPassword, account.salt, 64)).toString('hex');
          if (!equal(computed, account.password)) return send(res, 401, { error: 'Current password did not match.' });
          if (currentPassword === newPassword) return send(res, 400, { error: 'Choose a different password.' });
          const salt = randomBytes(16).toString('hex'), passwordHash = (await deriveKey(newPassword, salt, 64)).toString('hex');
          const currentToken = /(?:^|;\s*)forge_session=([a-f0-9]{64})/.exec(req.headers.cookie || '')?.[1];
          db.prepare('UPDATE users SET salt=?,password=? WHERE id=?').run(salt, passwordHash, owner.id);
          db.prepare('DELETE FROM sessions WHERE user_id=? AND token<>?').run(owner.id, currentToken ? hash(currentToken) : '');
          return send(res, 200, { ok: true, otherDevicesMustSignInAgain: true });
        }
        if (pathname === '/api/state' && req.method === 'GET') {
          const row = db.prepare('SELECT body,revision FROM states WHERE user_id=?').get(owner.id);
          return send(res, 200, { state: row ? JSON.parse(row.body) : null, revision: row?.revision || 0 });
        }
        if (pathname === '/api/state' && req.method === 'PUT') {
          const input = await readBody(req);
          if (!validState(input?.state)) return send(res, 400, { error: 'Invalid workout state schema' });
          if (!Number.isSafeInteger(input.revision) || input.revision < 0) return send(res, 400, { error: 'Valid state revision required' });
          const body = JSON.stringify(input.state), old = db.prepare('SELECT body FROM states WHERE user_id=?').get(owner.id), projected = dataUsage() + Buffer.byteLength(body) - Buffer.byteLength(old?.body || '');
          if (projected > maxDataBytes) return send(res, 507, { error: 'Forge account data reached its configured storage limit. Export a backup before removing anything.' });
          const result = db.prepare('INSERT INTO states(user_id,body,revision) SELECT ?,?,1 WHERE ?=0 OR EXISTS(SELECT 1 FROM states WHERE user_id=?) ON CONFLICT(user_id) DO UPDATE SET body=excluded.body,revision=states.revision+1 WHERE states.revision=?').run(owner.id, body, input.revision, owner.id, input.revision);
          if (!result.changes) {
            const row = db.prepare('SELECT body,revision FROM states WHERE user_id=?').get(owner.id);
            return send(res, 409, { error: 'Account data changed on another device.', state: row ? JSON.parse(row.body) : null, revision: row?.revision || 0 });
          }
          return send(res, 200, { ok: true, revision: input.revision + 1 });
        }
        if (pathname === '/api/storage' && req.method === 'GET') return send(res, 200, { usedBytes: dataUsage(), limitBytes: maxDataBytes, physicalVolumeLabel });
        if (pathname === '/api/push/devices' && req.method === 'GET') {
          const currentDeviceId = new URL(req.url, 'http://localhost').searchParams.get('currentDeviceId');
          const devices = db.prepare('SELECT device_id,label,updated FROM push_subscriptions WHERE user_id=? ORDER BY updated DESC').all(owner.id).map(device => ({ deviceId: device.device_id, label: device.label, updated: device.updated, current: device.device_id === currentDeviceId }));
          return send(res, 200, { devices, available: pushReady });
        }
        if (pathname === '/api/push/subscribe' && req.method === 'POST') {
          if (!pushReady) return send(res, 503, { error: 'Server push notifications are not configured.' });
          const input = await readBody(req), deviceId = input?.deviceId, label = typeof input?.label === 'string' ? input.label.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 80) : '';
          if (typeof deviceId !== 'string' || !/^[A-Za-z0-9_-]{16,80}$/.test(deviceId) || !validPushSubscription(input?.subscription)) return send(res, 400, { error: 'Valid device and browser push subscription required.' });
          const count = db.prepare('SELECT COUNT(*) AS count FROM push_subscriptions WHERE user_id=?').get(owner.id).count;
          if (count >= 15 && !db.prepare('SELECT device_id FROM push_subscriptions WHERE user_id=? AND device_id=?').get(owner.id, deviceId)) return send(res, 409, { error: 'Device limit reached. Remove an old device first.' });
          const subscription = { endpoint: input.subscription.endpoint, keys: { p256dh: input.subscription.keys.p256dh, auth: input.subscription.keys.auth } };
          db.prepare('INSERT INTO push_subscriptions(user_id,device_id,label,endpoint,subscription,updated) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id,device_id) DO UPDATE SET label=excluded.label,endpoint=excluded.endpoint,subscription=excluded.subscription,updated=excluded.updated').run(owner.id, deviceId, label || 'Forge device', subscription.endpoint, JSON.stringify(subscription), Date.now());
          return send(res, 201, { ok: true, deviceId });
        }
        if (pathname === '/api/push/unsubscribe' && req.method === 'POST') {
          const input = await readBody(req);
          if (typeof input?.deviceId !== 'string' || !/^[A-Za-z0-9_-]{16,80}$/.test(input.deviceId)) return send(res, 400, { error: 'Valid device ID required.' });
          db.prepare('DELETE FROM push_subscriptions WHERE user_id=? AND device_id=?').run(owner.id, input.deviceId);
          db.prepare('DELETE FROM reminder_deliveries WHERE user_id=? AND device_id=?').run(owner.id, input.deviceId);
          return send(res, 200, { ok: true });
        }
        return send(res, 404, { error: 'Not found' });
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed' });
      const publicDir = resolve(root, 'public'), file = resolve(publicDir, '.' + decodeURIComponent(pathname === '/' ? '/index.html' : pathname));
      if (!file.startsWith(publicDir + '/')) return send(res, 403, { error: 'Forbidden' });
      let payload;
      try { if (!statSync(file).isFile()) throw new Error(); payload = readFileSync(file); }
      catch { return send(res, 404, { error: 'Not found' }); }
      const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.gif': 'image/gif', '.ico': 'image/x-icon' };
      res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.writeHead(200); res.end(req.method === 'HEAD' ? undefined : payload);
    } catch (error) { send(res, error.status || 500, { error: error.status ? error.message : 'Internal server error' }); }
  });
  if (pushReady && (options.enableReminderScheduler ?? production)) {
    const interval = Number(options.pushCheckIntervalMs || process.env.PUSH_CHECK_INTERVAL_MS || 30000);
    const timer = setInterval(() => sendDueReminders(options.clock?.() || new Date()).catch(() => {}), Math.min(300000, Math.max(10000, interval)));
    timer.unref?.(); server.once('close', () => clearInterval(timer));
  }
  server.on('close', () => db.close());
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const server = createApp();
  server.listen(Number(process.env.PORT) || 3000, process.env.HOST || '0.0.0.0', () => console.log(`Forge running on port ${server.address().port}`));
}
