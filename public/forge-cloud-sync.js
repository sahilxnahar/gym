/* Account-only cross-device sync. Passwords never enter workout state or backups. */
(() => {
  'use strict';
  let app = null, queue = Promise.resolve(), timer = null, syncing = false;
  const clone = value => JSON.parse(JSON.stringify(value));
  const accountKey = id => `forge-account-${id}`;
  const baseKey = id => `forge-sync-base-v1-${id}`;
  const safeRead = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
  const store = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
  function setStatus(text) {
    const status = document.querySelector('#sync-status');
    if (status) status.textContent = text;
    document.dispatchEvent(new CustomEvent('forge:sync-status', { detail: text }));
  }
  function currentUser() { return app?.getUser?.() || null; }
  function writeLocal(state = app.getState(), user = currentUser()) {
    if (!user) return false;
    const ok = store(accountKey(user.id), state);
    try { localStorage.setItem('forge-mode', 'account'); } catch {}
    return ok;
  }
  function readBase(user = currentUser()) { return user ? safeRead(baseKey(user.id)) : null; }
  function writeBase(state, user = currentUser()) { if (user) store(baseKey(user.id), state); }
  function applySyncedPreferences(state) {
    const preference = state?.foodPreferences;
    if (preference?.syncEnabled && preference.value && globalThis.ForgeTools) globalThis.ForgeTools.saveDietPreferences(preference.value);
    else if (preference?.syncEnabled === false && globalThis.ForgeTools) globalThis.ForgeTools.clearDietPreferences();
  }
  function reportConflicts(user, conflicts) {
    if (!conflicts?.length) return;
    const safe = conflicts.slice(0, 40).map(({ path, kind }) => ({ path: String(path || 'workout').slice(0, 100), kind: String(kind || 'changed').slice(0, 60) }));
    try { localStorage.setItem(`forge-sync-notes-${user.id}`, JSON.stringify({ at: Date.now(), items: safe })); } catch {}
    app.toast?.('Forge combined both devices. If a workout changed on both, a clearly named copy was kept.');
  }
  function updateLastSync() {
    const user = currentUser();
    if (!user) return;
    try { localStorage.setItem(`forge-last-sync-${user.id}`, String(Date.now())); } catch {}
    const date = new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    setStatus(`Synced at ${date}`);
  }
  async function pushSnapshot() {
    if (!app || !currentUser()) { setStatus('Saved on this device'); return false; }
    if (syncing) { return queue; }
    syncing = true;
    let needsAnotherPass = false;
    setStatus(navigator.onLine === false ? 'Offline · changes saved here' : 'Syncing changes…');
    try {
      const user = currentUser();
      for (let attempt = 0; attempt < 6; attempt++) {
        if (!currentUser() || currentUser().id !== user.id) return false;
        const snapshot = clone(app.getState());
        const mutation = app.getMutationCount?.() || 0;
        const base = readBase(user) || app.empty();
        const response = await fetch('/api/state', {
          method: 'PUT', cache: 'no-store', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: snapshot, revision: app.getRevision() })
        });
        const data = await response.json().catch(() => ({}));
        if (response.status === 409) {
          let remote = data.state;
          if (!remote) {
            const latest = await fetch('/api/state', { cache: 'no-store' });
            if (!latest.ok) throw new Error('Could not load the latest account copy.');
            remote = (await latest.json()).state;
          }
          remote = remote || app.empty();
          if (!app.isValid(remote)) throw new Error('The account copy could not be validated.');
          const latestLocal = app.getState();
          const merged = globalThis.ForgeSync.mergeStates(latestLocal, remote, base);
          app.setState(app.normalizeState(merged.state));
          app.setRevision(Number(data.revision) || 0);
          writeBase(remote, user);
          if (!writeLocal(app.getState(), user)) throw new Error('Device storage is full; export a backup before syncing.');
          reportConflicts(user, merged.conflicts);
          applySyncedPreferences(app.getState());
          app.render();
          needsAnotherPass = true;
          continue;
        }
        if (!response.ok) throw new Error(data.error || 'Sync did not complete.');
        if (!Number.isSafeInteger(data.revision)) throw new Error('The server returned an invalid revision.');
        app.setRevision(data.revision);
        writeBase(snapshot, user);
        if (!writeLocal(app.getState(), user)) throw new Error('Device storage is full; export a backup before syncing.');
        applySyncedPreferences(app.getState());
        updateLastSync();
        if ((app.getMutationCount?.() || 0) !== mutation) needsAnotherPass = true;
        if (!needsAnotherPass) return true;
      }
      throw new Error('The account changed repeatedly. Your latest edits remain on this device; try Sync now.');
    } catch (error) {
      setStatus(navigator.onLine === false ? 'Offline · changes saved here' : 'Sync paused · saved on this device');
      if (error?.message && !/Failed to fetch|Load failed|NetworkError/i.test(error.message)) app.toast?.(error.message);
      return false;
    } finally {
      syncing = false;
      if (needsAnotherPass && currentUser()) schedule(200);
    }
  }
  function schedule(delay = 850) {
    if (!currentUser()) { setStatus('Saved on this device'); return; }
    writeLocal();
    setStatus(navigator.onLine === false ? 'Offline · changes saved here' : 'Changes waiting to sync…');
    clearTimeout(timer);
    timer = setTimeout(() => {
      queue = queue.then(pushSnapshot, pushSnapshot);
    }, delay);
  }
  async function syncNow() {
    clearTimeout(timer); timer = null;
    queue = queue.then(pushSnapshot, pushSnapshot);
    return queue;
  }
  async function loadRemote() {
    const response = await fetch('/api/state', { cache: 'no-store' });
    if (!response.ok) throw new Error('Unable to load the account journal.');
    const remote = await response.json();
    if (!app.isValid(remote.state || app.empty())) throw new Error('Account data could not be validated.');
    return remote;
  }
  async function acceptLogin(user, remote) {
    if (!app || !user || !Number.isSafeInteger(user.id)) throw new Error('The account response was incomplete.');
    const before = app.getState();
    if (localStorage.getItem('forge-mode') !== 'account') store('forge-local-backup', before);
    const cached = safeRead(accountKey(user.id));
    const local = cached && app.isValid(cached) ? app.normalizeState(cached) : app.normalizeState(before);
    const remoteState = app.normalizeState(remote.state || app.empty());
    const base = readBase(user) || app.empty();
    const merged = globalThis.ForgeSync.mergeStates(local, remoteState, base);
    app.setUser(user);
    app.setRevision(Number(remote.revision) || 0);
    app.setState(app.normalizeState(merged.state));
    app.setSyncConflict?.(false);
    app.bumpCloudEpoch?.();
    writeBase(remoteState, user);
    if (!writeLocal(app.getState(), user)) throw new Error('Device storage is full; export a backup before signing in.');
    applySyncedPreferences(app.getState());
    reportConflicts(user, merged.conflicts);
    app.render();
    if (!globalThis.ForgeSync.equalStates?.(app.getState(), remoteState)) await syncNow();
    else updateLastSync();
  }
  async function resume() {
    if (globalThis.FORGE_NATIVE_APP === true && globalThis.FORGE_NATIVE_ACCOUNT_SYNC !== true) { setStatus('Saved on this device · native account sync is not enabled'); return; }
    if (!app || !navigator.onLine) { if (app && !currentUser()) setStatus('Saved on this device'); return; }
    const mutation = app.getMutationCount?.() || 0;
    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!response.ok) { if (!currentUser()) setStatus('Saved on this device'); return; }
      const data = await response.json();
      const remote = await loadRemote();
      if ((app.getMutationCount?.() || 0) !== mutation) {
        setStatus('Local changes saved · sign in to sync');
        return;
      }
      await acceptLogin(data.user, remote);
    } catch { if (currentUser()) setStatus('Offline · changes saved here'); }
  }
  async function logout() {
    if (!currentUser()) return true;
    if (navigator.onLine === false) { app.toast?.('Reconnect before signing out so the latest changes can sync.'); return false; }
    const saved = await syncNow();
    if (!saved) { app.toast?.('Forge could not confirm the latest sync. Stay signed in or try again when connected.'); return false; }
    try { await globalThis.ForgeEnhancements?.unsubscribeDevice?.(); } catch {}
    const response = await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (!response.ok) { app.toast?.('Sign out failed. Try again when connected.'); return false; }
    const user = currentUser();
    globalThis.ForgeTools?.clearDietPreferences?.();
    app.setUser(null); app.setRevision(0); app.setSyncConflict?.(false); app.bumpCloudEpoch?.();
    const local = safeRead('forge-local-backup');
    app.setState(app.normalizeState(local && app.isValid(local) ? local : app.empty()));
    try { localStorage.removeItem('forge-local-backup'); localStorage.setItem('forge-mode', 'local'); } catch {}
    setStatus('Saved on this device');
    app.save(); app.render(); app.toast?.('Signed out on this device. Your local journal is restored.');
    return true;
  }
  function attach(bridge) {
    app = bridge;
    window.ForgeCloudSync = Object.freeze({ schedule, syncNow, acceptLogin, resume, logout, applySyncedPreferences, setStatus, loadRemote });
    window.addEventListener('online', () => currentUser() ? syncNow() : setStatus('Saved on this device'));
    document.addEventListener('visibilitychange', () => { if (!document.hidden && currentUser()) syncNow(); });
    setStatus(currentUser() ? 'Signed in · syncing' : 'Saved on this device');
  }
  window.ForgeCloudSync = Object.freeze({ attach });
})();
