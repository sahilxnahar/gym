/* Gym-first productivity UI. All event handlers are delegated and keyboard/touch safe. */
(() => {
  'use strict';
  let app = null, localReminderTimer = null, storageRequest = 0;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const $ = (selector, root = document) => root.querySelector(selector);
  const checked = value => value ? 'checked' : '';
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const allDays = () => [0, 1, 2, 3, 4, 5, 6];
  const emptyDiet = () => ({ pattern: 'none', note: '' });
  function user() { return app?.getUser?.() || null; }
  function nativeLocalOnly() { return globalThis.FORGE_NATIVE_APP === true && globalThis.FORGE_NATIVE_ACCOUNT_SYNC !== true; }
  function state() { return app.getState(); }
  function persist() { app.save(); }
  function ensureDeviceId() {
    let id = '';
    try { id = localStorage.getItem('forge-device-id') || ''; } catch {}
    if (!/^[A-Za-z0-9_-]{16,80}$/.test(id)) {
      id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
      try { localStorage.setItem('forge-device-id', id); } catch {}
    }
    return id;
  }
  function deviceLabel() {
    const platform = navigator.userAgentData?.platform || navigator.platform || 'Browser';
    return String(platform).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 60) || 'Forge device';
  }
  function schedule() {
    const value = state().reminders;
    if (!globalThis.ForgeReminders.validSchedule(value)) return globalThis.ForgeReminders.defaults();
    const base = globalThis.ForgeReminders.defaults(value.timeZone);
    return { ...base, ...value, homeWorkout: { ...base.homeWorkout, ...(value.homeWorkout || {}) } };
  }
  function daysInput(name, selected) {
    return `<div class="forge-days" role="group" aria-label="Days for ${esc(name)}">${dayNames.map((day, index) => `<label><input type="checkbox" name="${esc(name)}-day" value="${index}" ${checked(selected.includes(index))}><span>${day}</span></label>`).join('')}</div>`;
  }
  function intervalOptions(value) {
    return [30, 45, 60, 90, 120, 180, 240, 360].map(minutes => `<option value="${minutes}" ${Number(value) === minutes ? 'selected' : ''}>Every ${minutes < 60 ? `${minutes} minutes` : `${minutes / 60} ${minutes === 60 ? 'hour' : 'hours'}`}</option>`).join('');
  }
  function timeZoneOptions(current) {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    return `<option value="${esc(current)}">${esc(current)}</option><option value="UTC" ${current === 'UTC' ? 'selected' : ''}>UTC</option>${zone !== current && zone !== 'UTC' ? `<option value="${esc(zone)}">This device · ${esc(zone)}</option>` : ''}`;
  }
  function renderReminderPanel() {
    const cfg = schedule(), signedIn = Boolean(user());
    const supplements = cfg.supplements.map(item => `<article class="forge-supp-reminder"><div><strong>${esc(item.label)}</strong><small>${esc(item.time)} · ${item.days.length ? item.days.map(day => dayNames[day]).join(', ') : 'No days selected'} · ${item.enabled ? 'On' : 'Off'}</small></div><span class="supp-reminder-actions"><button type="button" class="ghost" data-forge-edit-reminder="${esc(item.id)}" aria-label="Edit reminder for ${esc(item.label)}">Edit</button><button type="button" class="ghost" data-forge-remove-reminder="${esc(item.id)}" aria-label="Remove reminder for ${esc(item.label)}">Remove</button></span></article>`).join('');
    return `<section class="card forge-reminder-card" id="forge-reminders"><div class="forge-section-heading"><div><span class="tag">AT-HOME · WATER · WALKING · SUPPLEMENTS</span><h2>Gentle reminders</h2></div><span class="reminder-clock">${esc(cfg.timeZone)}</span></div><p>Pick the days and times that suit you. Reminders start off, stay quiet overnight, and never judge you for missing one.</p><form id="forge-reminder-form"><label for="forge-timezone">Use this time zone</label><select id="forge-timezone">${timeZoneOptions(cfg.timeZone)}</select><div class="reminder-grid"><fieldset><legend><label class="forge-switch"><input id="forge-water-enabled" type="checkbox" ${checked(cfg.water.enabled)}><span>Water pause</span></label></legend><p>A gentle prompt to pause for a drink if that suits you.</p><label for="forge-water-interval">How often?</label><select id="forge-water-interval">${intervalOptions(cfg.water.intervalMinutes)}</select><div class="form-grid"><label for="forge-water-start">Start time<input id="forge-water-start" type="time" value="${esc(cfg.water.start)}"></label><label for="forge-water-end">End time<input id="forge-water-end" type="time" value="${esc(cfg.water.end)}"></label></div>${daysInput('water', cfg.water.days)}</fieldset><fieldset><legend><label class="forge-switch"><input id="forge-walk-enabled" type="checkbox" ${checked(cfg.walking.enabled)}><span>Walking / stretch break</span></label></legend><p>Stand, stretch, or take a short walk—your choice.</p><label for="forge-walk-interval">How often?</label><select id="forge-walk-interval">${intervalOptions(cfg.walking.intervalMinutes)}</select><div class="form-grid"><label for="forge-walk-start">Start time<input id="forge-walk-start" type="time" value="${esc(cfg.walking.start)}"></label><label for="forge-walk-end">End time<input id="forge-walk-end" type="time" value="${esc(cfg.walking.end)}"></label></div>${daysInput('walk', cfg.walking.days)}</fieldset><fieldset class="home-workout-reminder"><legend><label class="forge-switch"><input id="forge-home-workout-enabled" type="checkbox" ${checked(cfg.homeWorkout.enabled)}><span>At-home bodyweight nudge</span></label></legend><p>One optional prompt with a short, equipment-free idea.</p><label for="forge-home-workout-time">Preferred time<input id="forge-home-workout-time" type="time" value="${esc(cfg.homeWorkout.time)}"></label>${daysInput('home-workout', cfg.homeWorkout.days)}</fieldset></div><fieldset class="quiet-hours"><legend><label class="forge-switch"><input id="forge-quiet-enabled" type="checkbox" ${checked(cfg.quietHours.enabled)}><span>Quiet hours</span></label></legend><div class="form-grid"><label for="forge-quiet-start">From<input id="forge-quiet-start" type="time" value="${esc(cfg.quietHours.start)}"></label><label for="forge-quiet-end">Until<input id="forge-quiet-end" type="time" value="${esc(cfg.quietHours.end)}"></label></div></fieldset><p class="error" id="forge-reminder-error" role="alert"></p><button class="lime" type="submit">Save reminder schedule</button></form><div class="forge-supp-reminders"><div class="forge-section-heading"><h3>Supplement reminders</h3><button class="secondary" type="button" data-forge-action="add-supplement-reminder">Add a reminder</button></div><p class="help">Reminders are prompts only; Forge does not tell you what or how much to take.</p>${supplements || '<p class="empty-note">No supplement reminders yet.</p>'}</div><div class="forge-device-push"><div class="forge-section-heading"><div><h3>Notifications on this device</h3><p class="help">Allow notifications separately on each phone or computer you want to remind.</p></div><button type="button" class="secondary" data-forge-action="enable-push">Enable on this device</button></div><p id="forge-push-status" class="help" role="status">${user() ? 'Checking device notification settings…' : 'Sign in to set up this device; while signed out, reminders only work when Forge is open.'}</p><div id="forge-push-devices"></div></div><p class="help">${signedIn ? 'Your reminder schedule syncs with your Forge account. Push permission and subscriptions are separate for every device.' : 'This schedule is saved on this device. Sign in to sync it with your other devices.'}</p></section>`;
  }
  function renderSupplementLibrary() {
    const entries = globalThis.ForgeSupplementLibrary || [];
    return `<section class="card forge-supplement-library" id="forge-supplements"><div class="forge-section-heading"><div><span class="tag">PLAIN-LANGUAGE GUIDE</span><h2>Supplement library</h2></div><span class="library-count">${entries.length} topics</span></div><p>What it is, what research can and cannot say, and when to ask a clinician or pharmacist. No dosages, prescriptions, or personalized recommendations.</p><label for="forge-supplement-search">Find a supplement<input id="forge-supplement-search" type="search" placeholder="Try creatine, caffeine, iron…"></label><div class="forge-supplement-grid">${entries.map(entry => `<details class="forge-supplement-card" data-supplement-name="${esc(`${entry.name} ${entry.category} ${entry.evidence}`.toLowerCase())}"><summary><span class="supplement-category">${esc(entry.category)}</span><strong>${esc(entry.name)}</strong><small>${esc(entry.evidence)}</small></summary><div class="supplement-details"><h3>What it is</h3><p>${esc(entry.what)}</p><h3>What research suggests</h3><p>${esc(entry.exercise)}</p><h3>Things to consider</h3><p>${esc(entry.cautions)}</p><button type="button" class="ghost" data-forge-supplement="${esc(entry.id)}">Add a reminder</button><h3>Sources</h3><ul>${entry.sources.map(source => `<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a></li>`).join('')}</ul></div></details>`).join('')}</div><p class="help">Education is not medical advice. Supplements can interact with conditions, medicines, pregnancy, surgery and each other. Ask a qualified professional about your situation.</p></section>`;
  }
  function renderFoodSync() {
    const signedIn = Boolean(user()), preference = state().foodPreferences;
    return `<section class="card forge-food-sync"><span class="tag">OPTIONAL · PRIVATE</span><h2>Diet-note sync</h2><p>Your food notes are device-only by default. If you opt in, the current dietary pattern and free-text note sync as part of your account. Do not put private medical details in the note.</p>${signedIn ? `<label class="check-label"><input id="forge-food-sync-enabled" type="checkbox" ${checked(preference?.syncEnabled === true)}> Sync my diet preference and note across my signed-in devices</label><button type="button" class="secondary" data-forge-action="save-food-sync">Save sync choice</button><p class="help">Turning this off removes the saved account copy and clears this device's food note; other devices clear theirs at their next sync.</p>` : '<p class="help">Sign in to choose account sync. Your existing note remains on this device.</p>'}</section>`;
  }
  function quickWorkoutButtons(active) {
    const templates = globalThis.ForgeGame.quickWorkouts;
    const previews = [
      { key: 'squat', label: 'Squat pattern', note: 'No equipment · chair option' },
      { key: 'pushup', label: 'Push-up', note: 'No equipment · wall or incline' },
      { key: 'row', label: 'Dumbbell row', note: 'Dumbbell guide · band variation' },
      { key: 'hinge', label: 'Hip hinge', note: 'Bodyweight practice' },
      { key: 'bridge', label: 'Glute bridge', note: 'No equipment · floor option' },
      { key: 'deadbug', label: 'Dead bug', note: 'No equipment · floor option' }
    ];
    const previewMarkup = previews.map(({ key, label, note }) => `<button type="button" class="forge-movement-preview" data-action="guide" data-id="${key}" aria-label="See the ${label} movement guide"><picture><source media="(prefers-reduced-motion: reduce)" srcset="/demos/${key}.png"><img src="/demos/previews/${key}-preview.gif" alt="" loading="lazy" decoding="async"></picture><span><strong>${label}</strong><small>${note}</small><em>View guide</em></span></button>`).join('');
    return `<section class="card forge-quick-card"><div class="forge-section-heading"><div><span class="tag">AT HOME · BODYWEIGHT · BANDS</span><h2>A small home workout still counts</h2></div><span class="quick-time">3–8 min</span></div><p>Skipping the gym today? Choose a 3-minute reset or a 5-minute no-equipment session. All six local guides are here; equipment needs are noted. Band sessions and an easy walk are below.</p><div class="forge-movement-preview-grid" role="group" aria-label="Six local movement previews">${previewMarkup}</div><div class="quick-workout-grid">${templates.map(item => `<button type="button" class="quick-workout-option" data-forge-quick="${esc(item.id)}" ${active ? 'disabled' : ''}><strong>${esc(item.title)}</strong><small>${esc(item.minutes)} minutes · ${esc(item.equipment)}</small><span aria-hidden="true">Start →</span></button>`).join('')}</div><div class="button-row home-workout-reminder-action"><button type="button" class="ghost" data-forge-action="open-reminders">Set a home-workout reminder</button></div><p class="help">Use a stable chair or incline, choose a comfortable range, and skip any movement that feels wrong. One move is enough; rest days are fine.</p>${active ? '<p class="help">Finish or save your current workout before starting another.</p>' : ''}</section>`;
  }
function renderHomeExtras() {
  const content = $('#content'), panel = document.createElement('div');
  const data = state();
  const nativeOnly = nativeLocalOnly();
  panel.className = 'forge-home-extras'; panel.dataset.forgeEnhancement = 'home';
  const accountText = user()
    ? 'Your home page is using the account journal. Recent workouts, levels and reminders update here as soon as they sync.'
    : nativeOnly
      ? 'This native companion saves your training journal on this device for now. The browser PWA retains the existing email login and cross-device sync.'
      : 'Use the same email login ID and password on each device to see the same workouts and progress. Each device keeps its own secure sign-in.';
  const accountActions = user()
    ? '<button class="secondary" type="button" data-forge-action="sync-now">Sync now</button>'
    : nativeOnly
      ? ''
      : '<button class="secondary" type="button" data-action="login">Sign in with email</button><button class="ghost" type="button" data-action="register">Create owner account</button>';
  panel.innerHTML = `${globalThis.ForgeGame.render(data)}${globalThis.ForgeHealth?.renderCard?.() || ''}${quickWorkoutButtons(Boolean(data.active))}<section class="card forge-home-sync"><span class="tag">YOUR ACCOUNT</span><h2>${user() ? `Welcome back, ${esc(user().email)}` : 'Keep your progress with you'}</h2><p>${accountText}</p>${accountActions}</section>`;
  const anchor = content.querySelector('.forge-start-card') || content.querySelector('.page-heading');
  if (anchor) anchor.insertAdjacentElement('afterend', panel); else content.append(panel);
}
function renderSettingsExtras() {
  const panel = document.createElement('div'), signedIn = user(), data = state();
  panel.className = 'forge-settings-extras'; panel.dataset.forgeEnhancement = 'settings';
  const nativeNotice = nativeLocalOnly() ? '<section class="card forge-native-account-note"><span class="tag">NATIVE COMPANION</span><h2>Account sign-in comes next</h2><p>This build keeps training local on this device. For the existing owner login and cross-device sync, use the Forge browser PWA. Your optional step total stays on this device.</p></section>' : '';
  panel.innerHTML = `${nativeNotice}<section class="card forge-account-card"><div class="forge-section-heading"><div><span class="tag">SYNC · SECURITY · BACKUPS</span><h2>Use Forge on all your devices</h2></div><span class="account-badge">${signedIn ? 'SIGNED IN' : 'LOCAL ONLY'}</span></div>${signedIn ? `<p>Signed in as <strong>${esc(signedIn.email)}</strong>. Use this email login ID and password on your phone to load the same journal. Passwords are never copied into workouts or backups.</p><div class="account-actions"><button class="secondary" type="button" data-forge-action="sync-now">Sync now</button><button class="ghost" type="button" data-action="logout">Sign out on this device</button><button class="ghost" type="button" data-forge-action="clear-device-copy">Remove this device's saved account copy</button></div><form id="forge-password-form"><h3>Change password</h3><label for="forge-current-password">Current password<input id="forge-current-password" type="password" autocomplete="current-password" required></label><label for="forge-new-password">New password · at least 12 characters<input id="forge-new-password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required></label><label for="forge-confirm-password">Confirm new password<input id="forge-confirm-password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required></label><p class="error" id="forge-password-error" role="alert"></p><button class="secondary" type="submit">Change password</button><p class="help">Other devices will need to sign in again after the change.</p></form>` : `<p>Forge saves to this device until you choose account sync. Once an owner account exists, sign in on each phone or computer with your email login ID and password. Your first sign-in merges local and account workouts instead of replacing either journal.</p><div class="account-actions"><button class="secondary" type="button" data-action="login">Sign in with email</button><button class="ghost" type="button" data-action="register">Create owner account</button></div>`}<details class="sync-data-explainer"><summary>What syncs, and what stays private?</summary><ul><li>Workouts, plans, bodyweight entries, settings, progress, quests and reminder schedules sync to the single-owner account.</li><li>Diet notes sync only if you explicitly switch them on in Tools.</li><li>BMI height and weight entries are used for the calculation and are not saved.</li><li>Passwords are hashed by the server and are never stored in the journal.</li><li>Notification permission is per device; enable it separately on each device.</li></ul></details><div class="forge-storage-meter" id="forge-storage-meter"><p>Account storage: checking…</p></div></section><section class="card forge-game-settings"><span class="tag">OPTIONAL GAME LAYER</span><h2>Choose your story route</h2><p>Pick the fantasy that motivates you. Both routes share the same workouts, Forge XP, ranks and rewards; only the story text changes. There is no purchase gate or lost progress.</p><fieldset class="forge-story-picker"><legend>Campaign story</legend><div class="forge-story-choices">${globalThis.ForgeGame.modeOptions.map(option => `<label class="forge-story-choice"><input type="radio" name="forge-game-mode" value="${esc(option.id)}" ${checked(option.id === (data.settings.gameMode || 'ground-up'))}><span><strong>${esc(option.title)}</strong><small>${esc(option.summary)}</small></span></label>`).join('')}</div></fieldset><p class="forge-story-note">Switch at any time. Your levels, completed missions and unlocked chapters stay exactly where they are.</p><label class="check-label"><input id="forge-adventure-enabled" type="checkbox" ${checked(data.settings.adventureMode !== false)}> Show quests, tiers and story rewards on Home</label><button type="button" class="ghost" data-forge-action="open-reminders">Manage reminders</button></section>`;
  $('#content').append(panel);
  if (signedIn) loadStorageMeter();
  }
  async function loadStorageMeter() {
    const target = $('#forge-storage-meter'); if (!target || !user()) return;
    const request = ++storageRequest;
    try {
      const response = await fetch('/api/storage', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      if (request !== storageRequest || !$('#forge-storage-meter')) return;
      const used = Number(data.usedBytes) || 0, limit = Number(data.limitBytes) || 15000000000;
      const percent = Math.min(100, used / limit * 100);
      target.innerHTML = `<p><strong>Account data</strong> · ${formatBytes(used)} of ${formatBytes(limit)} app limit</p><progress value="${percent.toFixed(3)}" max="100" aria-label="Forge account storage used"></progress><small>Railway's attached data volume is ${esc(data.physicalVolumeLabel || 'provider-managed')}. The 15 GB Forge account-data ceiling is enforced separately.</small>`;
    } catch { if (target.isConnected) target.innerHTML = '<p>Storage meter unavailable while offline.</p>'; }
  }
  const formatBytes = value => value < 1024 ? `${value} B` : value < 1048576 ? `${(value / 1024).toFixed(1)} KB` : value < 1073741824 ? `${(value / 1048576).toFixed(1)} MB` : `${(value / 1073741824).toFixed(2)} GB`;
  function renderToolsExtras() {
    const panel = document.createElement('div'); panel.className = 'forge-tools-extras'; panel.dataset.forgeEnhancement = 'tools';
    panel.innerHTML = `${renderFoodSync()}${renderReminderPanel()}${renderSupplementLibrary()}`;
    $('#content').append(panel);
    refreshPushDevices();
  }
  async function refreshPushDevices() {
    const target = $('#forge-push-devices'), current = user();
    if (!target || !current) return;
    try {
      const deviceId = ensureDeviceId();
      const response = await fetch(`/api/push/devices?currentDeviceId=${encodeURIComponent(deviceId)}`, { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      const status = $('#forge-push-status');
      if (status && !data.available) status.textContent = 'Server push is not configured yet. In-app reminders work while Forge stays open; device push can be enabled after the server is configured.';
      target.innerHTML = data.devices?.length ? `<h4>Connected devices</h4>${data.devices.map(device => `<div class="forge-device-row"><span>${esc(device.label)}${device.current ? ' · This device' : ''}</span>${device.current ? '' : `<button type="button" class="ghost" data-forge-remove-device="${esc(device.deviceId)}">Remove</button>`}</div>`).join('')}` : '';
    } catch { const status = $('#forge-push-status'); if (status) status.textContent = 'Could not load device notification settings. Your reminder schedule is still saved.'; }
  }
  function render() {
    if (!app) return;
    const content = $('#content'); if (!content) return;
    const currentPage = app.getPage();
    if (currentPage === 'home') renderHomeExtras();
    if (currentPage === 'tools') renderToolsExtras();
    if (currentPage === 'settings') renderSettingsExtras();
    if (nativeLocalOnly()) document.querySelectorAll('[data-action="login"], [data-action="register"]').forEach(button => { button.hidden = true; });
    const syncButton = $('#sync-now-header');
    if (syncButton) syncButton.hidden = !user() || nativeLocalOnly();
    if (currentPage === 'tools') localReminderTick();
  }
  function readDays(prefix) { return [...document.querySelectorAll(`input[name="${prefix}-day"]:checked`)].map(input => Number(input.value)); }
  function saveReminderForm(form) {
    const cfg = structuredClone(schedule());
    cfg.timeZone = $('#forge-timezone').value;
    cfg.quietHours = { enabled: $('#forge-quiet-enabled').checked, start: $('#forge-quiet-start').value, end: $('#forge-quiet-end').value };
    cfg.water = { enabled: $('#forge-water-enabled').checked, intervalMinutes: Number($('#forge-water-interval').value), start: $('#forge-water-start').value, end: $('#forge-water-end').value, days: readDays('water') };
    cfg.walking = { enabled: $('#forge-walk-enabled').checked, intervalMinutes: Number($('#forge-walk-interval').value), start: $('#forge-walk-start').value, end: $('#forge-walk-end').value, days: readDays('walk') };
    cfg.homeWorkout = { enabled: $('#forge-home-workout-enabled').checked, time: $('#forge-home-workout-time').value, days: readDays('home-workout') };
    const error = $('#forge-reminder-error');
    if (!globalThis.ForgeReminders.validSchedule(cfg)) { error.textContent = 'Check the time zone, days and times. Reminder ranges need an earlier start than end.'; return; }
    state().reminders = cfg; persist(); app.render(); app.toast('Reminder schedule saved.');
  }
  function openSupplementReminder(id = '', name = '') {
    const existing = schedule().supplements.find(item => item.id === id);
    const record = existing || { id: id || `custom-${Date.now().toString(36)}`, label: name || '', time: '09:00', days: allDays(), enabled: true };
    app.modal(existing ? 'Edit supplement reminder' : 'Add supplement reminder', `<form id="forge-supplement-reminder-form"><label for="forge-supplement-label">Reminder label<input id="forge-supplement-label" maxlength="80" required value="${esc(record.label)}" placeholder="For example, my supplement reminder"></label><label for="forge-supplement-time">Time<input id="forge-supplement-time" type="time" required value="${esc(record.time)}"></label><label class="check-label"><input id="forge-supplement-enabled" type="checkbox" ${checked(record.enabled)}> Turn on this reminder</label>${daysInput('supplement', record.days)}<p class="help">Lock-screen message stays generic. Forge does not give dosage advice.</p><p class="error" id="forge-supplement-error" role="alert"></p><button class="lime" type="submit">Save reminder</button></form>`);
    const form = $('#forge-supplement-reminder-form');
    if (form) form.dataset.reminderId = record.id;
  }
  function saveSupplementReminder() {
    const id = $('#forge-supplement-reminder-form').dataset.reminderId;
    const label = $('#forge-supplement-label').value.trim(), time = $('#forge-supplement-time').value;
    const days = readDays('supplement'), cfg = structuredClone(schedule());
    const item = { id, label, time, days, enabled: $('#forge-supplement-enabled').checked };
    if (!label || label.length > 80 || !globalThis.ForgeReminders.timePattern.test(time) || !days.length) { $('#forge-supplement-error').textContent = 'Add a short label, a valid time and at least one day.'; return; }
    const index = cfg.supplements.findIndex(value => value.id === id);
    if (index < 0 && cfg.supplements.length >= 20) { $('#forge-supplement-error').textContent = 'You can keep up to 20 supplement reminders.'; return; }
    if (index < 0) cfg.supplements.push(item); else cfg.supplements[index] = item;
    if (!globalThis.ForgeReminders.validSchedule(cfg)) { $('#forge-supplement-error').textContent = 'Check this reminder and try again.'; return; }
    state().reminders = cfg; persist(); $('#modal').close(); app.render(); app.toast('Supplement reminder saved.');
  }
  function openQuickMenu() {
    const items = globalThis.ForgeGame.quickWorkouts;
    app.modal('Choose a short workout', `<p>Pick the time and equipment you have. Stop whenever you need; the session will stay saved until you finish or discard it.</p><div class="forge-quick-menu">${items.map(item => `<button type="button" class="quick-workout-option" data-forge-quick="${esc(item.id)}"><strong>${esc(item.title)}</strong><small>${item.minutes} minutes · ${esc(item.equipment)}</small></button>`).join('')}</div>`);
  }
  function startQuickWorkout(id) {
    const data = state();
    if (data.active) { app.toast('Finish or save your current workout first.'); return; }
    const item = globalThis.ForgeGame.createQuickWorkout(id, app.getCatalog(), app.newExercise);
    if (!item) { app.toast('That quick workout is unavailable in this offline library.'); return; }
    $('#modal')?.close?.(); app.start(item.exercises, item.name);
  }
  async function enableNotifications() {
    const status = $('#forge-push-status');
    if (!('Notification' in window) || !('serviceWorker' in navigator)) { if (status) status.textContent = 'This browser does not support Forge notifications.'; return; }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') { if (status) status.textContent = 'Notifications are off. You can change this in your browser settings.'; return; }
    const deviceId = ensureDeviceId();
    if (!user()) {
      try { localStorage.setItem('forge-local-reminders-enabled', '1'); } catch {}
      if (status) status.textContent = 'Enabled on this device while Forge is open. Sign in and enable again for closed-app reminders.';
      app.toast('Local reminders are enabled on this device.'); return;
    }
    try {
      const configResponse = await fetch('/api/push/config', { cache: 'no-store' });
      const config = await configResponse.json();
      if (!config.available || !config.publicKey) {
        localStorage.setItem('forge-local-reminders-enabled', '1');
        if (status) status.textContent = 'Permission granted. Server push is not configured yet, so reminders work while Forge is open.';
        app.toast('On-device permission saved.'); return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeVapidKey(config.publicKey) });
      const response = await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deviceId, label: deviceLabel(), subscription: subscription.toJSON() }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Could not connect this device.');
      localStorage.setItem('forge-push-device-connected', deviceId);
      localStorage.removeItem('forge-local-reminders-enabled');
      if (status) status.textContent = 'Connected. Home workout, water, walking and supplement prompts can reach this device while Forge is closed.';
      app.toast('This device is connected for Forge reminders.'); refreshPushDevices();
    } catch (error) { if (status) status.textContent = error.message || 'Could not enable push notifications.'; }
  }
  function decodeVapidKey(value) {
    const padded = `${value}${'='.repeat((4 - value.length % 4) % 4)}`;
    const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, character => character.charCodeAt(0));
  }
  async function unsubscribeDevice() {
    const subscription = await navigator.serviceWorker?.ready.then(registration => registration.pushManager.getSubscription()).catch(() => null);
    const deviceId = ensureDeviceId();
    if (user()) await fetch('/api/push/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deviceId }) }).catch(() => {});
    if (subscription) await subscription.unsubscribe().catch(() => false);
    try { localStorage.removeItem('forge-push-device-connected'); } catch {}
  }
  async function removePushDevice(id) {
    if (!user() || !window.confirm('Remove this device from Forge notifications? The workout account and saved schedule stay unchanged.')) return;
    const deviceId = ensureDeviceId();
    if (id === deviceId) await unsubscribeDevice();
    else await fetch('/api/push/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deviceId: id }) });
    refreshPushDevices();
  }
  function localReminderTick() {
    if (!('Notification' in window) || Notification.permission !== 'granted' || localStorage.getItem('forge-local-reminders-enabled') !== '1') return;
    const cfg = schedule(), now = new Date(), due = globalThis.ForgeReminders.dueOccurrences(cfg, now);
    for (const reminder of due) {
      const key = `forge-local-reminder-${ensureDeviceId()}-${reminder.id}`;
      if (localStorage.getItem(key) === reminder.occurrence) continue;
      localStorage.setItem(key, reminder.occurrence);
      navigator.serviceWorker.ready.then(registration => registration.showNotification(reminder.title, { body: reminder.body, icon: '/icon-192.png', badge: '/icon-192.png', tag: `forge-${reminder.kind}`, data: { url: '/' } })).catch(() => new Notification(reminder.title, { body: reminder.body }));
    }
  }
  function ensureLocalReminderLoop() { clearInterval(localReminderTimer); localReminderTimer = setInterval(localReminderTick, 30000); }
  async function submitPassword(form) {
    const error = $('#forge-password-error'), currentPassword = $('#forge-current-password').value, newPassword = $('#forge-new-password').value, confirmation = $('#forge-confirm-password').value;
    error.textContent = '';
    if (newPassword !== confirmation) { error.textContent = 'The new password entries do not match.'; return; }
    if (newPassword.length < 12) { error.textContent = 'Choose a password with at least 12 characters.'; return; }
    const button = form.querySelector('button[type="submit"]'); button.disabled = true;
    try {
      const response = await fetch('/api/auth/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Password could not be changed.');
      form.reset(); app.toast('Password changed. Sign in again on your other devices.');
    } catch (failure) { error.textContent = failure.message; }
    finally { button.disabled = false; }
  }
  async function readHealthToday() {
    const task = globalThis.ForgeHealth?.readToday?.();
    if (!task) return;
    app.render();
    const ok = await task;
    app.render();
    if (!ok) app.toast('No step data was read. Forge works without connecting.');
  }
  function handleClick(event) {
    const button = event.target.closest('button'); if (!button) return;
    if (nativeLocalOnly() && ['login', 'register'].includes(button.dataset.action)) {
      event.preventDefault(); event.stopImmediatePropagation();
      const url = esc(globalThis.FORGE_WEB_APP_URL || 'https://gym-pwa-production-d169.up.railway.app/');
      app.modal('Sign in through the Forge browser PWA', `<p>Account sign-in and cross-device sync are intentionally paused in this native companion. Open <a href="${url}" target="_blank" rel="noopener noreferrer">Forge in your browser</a> to use the owner login. Local workouts and optional step display remain available here.</p>`);
      return;
    }
    const quick = button.dataset.forgeQuick;
    if (quick) { event.preventDefault(); event.stopImmediatePropagation(); startQuickWorkout(quick); return; }
    const action = button.dataset.forgeAction;
    if (action) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (action === 'sync-now') window.ForgeCloudSync.syncNow().then(ok => { if (ok) app.toast('Your account is up to date.'); });
      if (action === 'adventure-map') app.modal('The Ember Map', globalThis.ForgeGame.renderMap(state()));
      if (action === 'quick-menu') openQuickMenu();
      if (action === 'open-reminders') { app.setPage('tools'); app.render(); document.querySelector('#forge-reminders')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      if (action === 'enable-push') enableNotifications();
      if (action === 'connect-health') readHealthToday();
      if (action === 'add-supplement-reminder') openSupplementReminder();
      if (action === 'save-food-sync') saveFoodSync();
      if (action === 'clear-device-copy') clearDeviceCopy();
      return;
    }
    if (button.dataset.forgeSupplement) { event.preventDefault(); event.stopImmediatePropagation(); const entry = globalThis.ForgeSupplementLibrary.find(item => item.id === button.dataset.forgeSupplement); if (entry) openSupplementReminder(entry.id, entry.name); return; }
    if (button.dataset.forgeEditReminder) { event.preventDefault(); event.stopImmediatePropagation(); const item = schedule().supplements.find(value => value.id === button.dataset.forgeEditReminder); if (item) openSupplementReminder(item.id, item.label); return; }
    if (button.dataset.forgeRemoveReminder) {
      event.preventDefault(); event.stopImmediatePropagation(); if (!window.confirm('Remove this supplement reminder?')) return;
      state().reminders = { ...schedule(), supplements: schedule().supplements.filter(item => item.id !== button.dataset.forgeRemoveReminder) }; persist(); app.render(); return;
    }
    if (button.dataset.forgeRemoveDevice) { event.preventDefault(); event.stopImmediatePropagation(); removePushDevice(button.dataset.forgeRemoveDevice); return; }
    if (button.dataset.action === 'quick-workout') { event.preventDefault(); event.stopImmediatePropagation(); openQuickMenu(); return; }
    if (button.dataset.action === 'adventure-map') { event.preventDefault(); event.stopImmediatePropagation(); app.modal(`${globalThis.ForgeGame.snapshot(state()).mode.title} · Story map`, globalThis.ForgeGame.renderMap(state())); return; }
    if (button.dataset.action === 'logout') { event.preventDefault(); event.stopImmediatePropagation(); window.ForgeCloudSync.logout(); return; }
    if (button.dataset.action === 'reload-account') { event.preventDefault(); event.stopImmediatePropagation(); window.ForgeCloudSync.syncNow(); return; }
  }
  function readDietForm() { return { pattern: $('#diet-pattern')?.value || 'none', note: $('#diet-note')?.value || '' }; }
  function saveFoodSync() {
    if (!user()) { app.toast('Sign in before saving a synced diet note.'); return; }
    const enabled = $('#forge-food-sync-enabled')?.checked;
    if (enabled) {
      const diet = globalThis.ForgeTools.getDietPreferences();
      state().foodPreferences = { syncEnabled: true, value: diet };
      app.save(); app.toast('Diet preference and note are set to sync with your account.'); return;
    }
    if (!window.confirm('Turn off diet-note sync and clear the saved copy from this device and your account?')) return;
    state().foodPreferences = { syncEnabled: false, value: null };
    globalThis.ForgeTools.clearDietPreferences(); app.save(); app.render(); app.toast('Diet-note sync is off.');
  }
  function clearDeviceCopy() {
    if (!user() || !window.confirm('Remove the downloaded account copy and sync history from this device only? Your Forge account and other devices are unchanged.')) return;
    const id = user().id;
    for (const key of [`forge-account-${id}`, `forge-sync-base-v1-${id}`, `forge-sync-notes-${id}`, `forge-last-sync-${id}`]) localStorage.removeItem(key);
    app.toast('This device’s saved account copy was removed. Sign in again to download it.');
  }
  function saveReminderSettings(form) { saveReminderForm(form); }
  async function submitHandler(event) {
    const form = event.target;
    if (form?.id === 'forge-reminder-form') { event.preventDefault(); event.stopImmediatePropagation(); saveReminderSettings(form); return; }
    if (form?.id === 'forge-supplement-reminder-form') { event.preventDefault(); event.stopImmediatePropagation(); saveSupplementReminder(); return; }
    if (form?.id === 'forge-password-form') { event.preventDefault(); event.stopImmediatePropagation(); await submitPassword(form); return; }
    if (form?.id === 'diet-form' && $('#forge-food-sync-enabled')?.checked && user()) {
      const preferences = readDietForm();
      queueMicrotask(() => { if (globalThis.ForgeTools.saveDietPreferences(preferences)) { state().foodPreferences = { syncEnabled: true, value: preferences }; app.save(); } });
    }
  }
  function changeHandler(event) {
    const target = event.target;
    if (target?.id === 'forge-adventure-enabled') { state().settings.adventureMode = target.checked; persist(); app.render(); return; }
    if (target?.name === 'forge-game-mode' && ['ground-up', 'legacy'].includes(target.value)) {
      state().settings.gameMode = target.value;
      persist(); app.render(); app.toast('Story changed. Your levels and rewards are unchanged.');
    }
  }
  function inputHandler(event) {
    if (event.target?.id !== 'forge-supplement-search') return;
    const query = event.target.value.trim().toLowerCase();
    for (const card of document.querySelectorAll('[data-supplement-name]')) card.hidden = query && !card.dataset.supplementName.includes(query);
  }
  function decodeAndListen() {
    document.addEventListener('click', handleClick, true);
    document.addEventListener('submit', submitHandler, true);
    document.addEventListener('change', changeHandler, true);
    document.addEventListener('input', inputHandler, true);
  }
  function attach(bridge) {
    app = bridge;
    decodeAndListen();
    ensureLocalReminderLoop();
  }
  window.ForgeEnhancements = Object.freeze({ attach, render, unsubscribeDevice, ensureDeviceId, localReminderTick });
})();
