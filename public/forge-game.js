/* Optional, non-punitive Forge journey; rewards are in-app lore and cosmetics only. */
(() => {
  'use strict';
  const quickWorkouts = Object.freeze([
    { id: 'spark-3', title: '3-minute reset', minutes: 3, equipment: 'No equipment', ids: ['ft-chair', 'ft-incline'] },
    { id: 'bodyweight-5', title: '5-minute bodyweight basics', minutes: 5, equipment: 'Bodyweight', ids: ['ft-chair', 'ft-incline', 'ft-bridge'] },
    { id: 'band-7', title: '7-minute band circuit', minutes: 7, equipment: 'Resistance bands', ids: ['ft-band-squat', 'ft-band-row', 'ft-band-pull'] },
    { id: 'walk-8', title: '8-minute easy walk', minutes: 8, equipment: 'Walking', ids: [] }
  ]);
  const rewards = Object.freeze([
    { level: 1, title: 'First spark', unlock: 'Meet Ember, your forge companion.' },
    { level: 3, title: 'Trail finder', unlock: 'Open the Ironwood Trail chapter.' },
    { level: 5, title: 'Wayfinder', unlock: 'Unlock the Campfire scene and a new title.' },
    { level: 8, title: 'Forge keeper', unlock: 'Open the Skyforge chapter.' },
    { level: 12, title: 'Master craft', unlock: 'Unlock the final map panel.' }
  ]);
  const done = state => (state?.workouts || []).filter(workout => Number.isFinite(workout.finished));
  const completedSets = state => done(state).reduce((count, workout) => count + (workout.exercises || []).flatMap(exercise => exercise.sets || []).filter(set => set.done).length, 0);
  function snapshot(state) {
    const workouts = done(state), xp = globalThis.ForgeProgress.totalXp(workouts, completedSets(state)), level = Math.floor(xp / globalThis.ForgeProgress.XP_PER_LEVEL) + 1;
    const equipment = new Set(workouts.flatMap(workout => workout.exercises || []).map(exercise => String(exercise.equipment || '').toLowerCase()).filter(Boolean));
    const movementIds = new Set(workouts.flatMap(workout => workout.exercises || []).map(exercise => exercise.id));
    const bandSessions = workouts.filter(workout => (workout.exercises || []).some(exercise => /band/i.test(exercise.equipment || ''))).length;
    const quests = [
      { id: 'first-session', title: 'Light the first spark', note: 'Finish one workout of any length.', progress: Math.min(1, workouts.length), target: 1, reward: 'Ember companion' },
      { id: 'try-three-movements', title: 'Explore the training floor', note: 'Try three different movements.', progress: Math.min(3, movementIds.size), target: 3, reward: 'Movement scout title' },
      { id: 'band-trail', title: 'Walk the band trail', note: 'Log one resistance-band workout.', progress: Math.min(1, bandSessions), target: 1, reward: 'Ironwood map chapter' },
      { id: 'steady-rhythm', title: 'Find your rhythm', note: 'Move on three different days this week. Rest days are always okay.', progress: Math.min(3, new Set(workouts.filter(workout => workout.finished >= Date.now() - 7 * 86400000).map(workout => new Date(workout.finished).toDateString())).size), target: 3, reward: 'Campfire story' }
    ];
    const next = rewards.find(reward => reward.level > level) || null;
    return { xp, level, workouts: workouts.length, realm: rewards.filter(reward => reward.level <= level).at(-1), next, rewards: rewards.filter(reward => reward.level <= level), quests, equipmentKinds: equipment.size };
  }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]); }
  function render(state) {
    if (state?.settings?.adventureMode === false) return '';
    const data = snapshot(state);
    const xpPerLevel = globalThis.ForgeProgress.XP_PER_LEVEL;
    const mapStartXp = data.realm ? (data.realm.level - 1) * xpPerLevel : 0;
    const mapTargetXp = data.next ? (data.next.level - 1) * xpPerLevel : mapStartXp;
    const nextXp = Math.max(0, mapTargetXp - data.xp);
    const mapProgress = Math.max(0, Math.min(mapTargetXp - mapStartXp, data.xp - mapStartXp));
    const mapProgressMax = Math.max(1, mapTargetXp - mapStartXp);
    return `<section class="adventure-card card" aria-label="Forge fantasy journey"><div class="adventure-head"><div><span class="tag">OPTIONAL FORGE JOURNEY</span><h2>The Ember Map</h2><p>Small missions, a companion and new story chapters. Your workout record always comes first.</p></div><span class="adventure-level">LEVEL ${data.level}</span></div><div class="realm-panel"><span class="realm-mark" aria-hidden="true">✦</span><div><b>${escapeHtml(data.realm?.title || 'First spark')}</b><p>${escapeHtml(data.realm?.unlock || 'Meet Ember, your forge companion.')}</p></div></div>${data.next ? `<div class="adventure-next"><span>${nextXp.toLocaleString()} points until Level ${data.next.level}</span><progress value="${mapProgress}" max="${mapProgressMax}" aria-label="Progress to the next Ember Map chapter"></progress><p>Next: ${escapeHtml(data.next.unlock)}</p></div>` : '<p class="help">You have opened every map chapter. Your progress remains yours to keep.</p>'}<div class="quest-preview"><b>Choose a small quest</b>${data.quests.slice(0, 2).map(quest => `<div class="quest-row"><span><strong>${escapeHtml(quest.title)}</strong><small>${escapeHtml(quest.note)}</small></span><span>${quest.progress}/${quest.target}</span></div>`).join('')}</div><div class="button-row"><button class="secondary" data-action="quick-workout">Start a quick workout</button><button class="ghost" data-action="adventure-map">View map and rewards</button></div><p class="help">No lost levels for taking a break. Hide this journey in Settings at any time.</p></section>`;
  }
  function renderMap(state) {
    const data = snapshot(state);
    return `<p>Your journey grows from workouts you choose to log. No purchases, daily streak resets or penalties.</p><div class="map-rewards">${rewards.map(reward => `<article class="reward-node ${reward.level <= data.level ? 'unlocked' : 'locked'}"><span>${reward.level <= data.level ? '✓' : 'LEVEL ' + reward.level}</span><div><b>${escapeHtml(reward.title)}</b><p>${escapeHtml(reward.unlock)}</p></div></article>`).join('')}</div><h3>Open quests</h3>${data.quests.map(quest => `<article class="quest-row"><span><strong>${escapeHtml(quest.title)}</strong><small>${escapeHtml(quest.note)} · Reward: ${escapeHtml(quest.reward)}</small></span><span>${quest.progress}/${quest.target}</span></article>`).join('')}`;
  }
  function createQuickWorkout(id, catalog, makeExercise) {
    const template = quickWorkouts.find(item => item.id === id);
    if (!template) return null;
    if (template.id === 'walk-8') return { name: template.title, exercises: [{ id: 'forge-quick-walk', name: 'Easy walk', muscle: 'Cardio', equipment: 'Walking', kind: 'cardio', notes: 'Choose a pace and route that feel comfortable. Stop or turn back whenever you want.', sets: [{ reps: 0, weight: 0, rpe: null, done: false, seconds: template.minutes * 60, distanceKm: 0 }] }] };
    const exercises = template.ids.map(id => catalog.find(item => item.id === id)).filter(Boolean).map(item => { const exercise = makeExercise(item); exercise.sets = [exercise.sets[0]]; exercise.sets[0].reps = 8; exercise.sets[0].weight = 0; exercise.sets[0].done = false; return exercise; });
    return exercises.length ? { name: template.title, exercises } : null;
  }
  globalThis.ForgeGame = Object.freeze({ quickWorkouts, rewards, snapshot, render, renderMap, createQuickWorkout });
})();
