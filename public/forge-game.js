/* Optional Forge campaign. Story choices never change training difficulty or earned progress. */
(() => {
  'use strict';

  const quickWorkouts = Object.freeze([
    { id: 'spark-3', title: '3-minute reset', minutes: 3, equipment: 'No equipment', ids: ['ft-chair', 'ft-incline'] },
    { id: 'bodyweight-5', title: '5-minute bodyweight basics', minutes: 5, equipment: 'Bodyweight', ids: ['ft-chair', 'ft-incline', 'ft-bridge'] },
    { id: 'band-7', title: '7-minute band circuit', minutes: 7, equipment: 'Resistance bands', ids: ['ft-band-squat', 'ft-band-row', 'ft-band-pull'] },
    { id: 'walk-8', title: '8-minute easy walk', minutes: 8, equipment: 'Walking', ids: [] }
  ]);

  const modes = Object.freeze({
    'ground-up': Object.freeze({
      id: 'ground-up',
      title: 'Ground-Up Builder',
      summary: 'Start with a quiet workshop. Each finished session helps bring another part of the Forge to life.',
      chapters: Object.freeze([
        { title: 'The Quiet Workshop', note: 'Meet Ember and choose a first small mission.' },
        { title: 'Ironwood Training Floor', note: 'Open a place for bodyweight, band and strength work.' },
        { title: 'Campfire Commons', note: 'Make room for recovery, walking and shared stories.' },
        { title: 'The Skyforge', note: 'Bring the high hall back into use.' },
        { title: 'Guild Archive', note: 'Keep the journey and every earned title.' }
      ])
    }),
    legacy: Object.freeze({
      id: 'legacy',
      title: 'Legacy Architect',
      summary: 'Inherit a quiet training estate. Each finished session helps restore a new wing and its story.',
      chapters: Object.freeze([
        { title: 'The Estate Gate', note: 'Meet Ember and take the first step inside.' },
        { title: 'The Training Wing', note: 'Open space for bodyweight, band and strength work.' },
        { title: 'The Courtyard Hall', note: 'Make room for recovery, walking and shared stories.' },
        { title: 'The Skyforge Studio', note: 'Restore the estate’s high training hall.' },
        { title: 'The Legacy Archive', note: 'Keep the journey and every earned title.' }
      ])
    })
  });

  const modeOptions = Object.freeze(Object.values(modes).map(({ id, title, summary }) => Object.freeze({ id, title, summary })));
  const ranks = Object.freeze([
    { level: 1, title: 'Apprentice' },
    { level: 3, title: 'Builder' },
    { level: 5, title: 'Keeper' },
    { level: 8, title: 'Warden' },
    { level: 12, title: 'Forge Master' }
  ]);
  const rewards = Object.freeze([
    { level: 1, title: 'First spark', unlock: 'Meet Ember, your forge companion.' },
    { level: 3, title: 'Trail finder', unlock: 'Open the next training chapter.' },
    { level: 5, title: 'Wayfinder', unlock: 'Unlock the commons scene and a new title.' },
    { level: 8, title: 'Forge keeper', unlock: 'Open the high-hall chapter.' },
    { level: 12, title: 'Master craft', unlock: 'Unlock the final map panel.' }
  ]);

  const completedSessions = state => (Array.isArray(state?.workouts) ? state.workouts : []).filter(workout => Number.isFinite(workout?.finished));
  const completedSets = state => completedSessions(state).reduce((count, workout) => count + (workout.exercises || []).flatMap(exercise => exercise.sets || []).filter(set => set.done).length, 0);
  const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

  function snapshot(state) {
    const workouts = completedSessions(state);
    const xp = globalThis.ForgeProgress.totalXp(workouts, completedSets(state));
    const level = Math.floor(xp / globalThis.ForgeProgress.XP_PER_LEVEL) + 1;
    const modeId = Object.hasOwn(modes, state?.settings?.gameMode) ? state.settings.gameMode : 'ground-up';
    const mode = modes[modeId];
    const equipment = new Set(workouts.flatMap(workout => workout.exercises || []).map(exercise => String(exercise.equipment || '').toLowerCase()).filter(Boolean));
    const movementIds = new Set(workouts.flatMap(workout => workout.exercises || []).map(exercise => exercise.id));
    const bandSessions = workouts.filter(workout => (workout.exercises || []).some(exercise => /band/i.test(exercise.equipment || ''))).length;
    const activeDays = new Set(workouts.filter(workout => workout.finished >= Date.now() - 7 * 86400000).map(workout => new Date(workout.finished).toDateString())).size;
    const quests = [
      { id: 'first-session', title: 'Light the first spark', note: 'Finish one workout of any length.', progress: Math.min(1, workouts.length), target: 1, reward: 'Ember companion' },
      { id: 'try-three-movements', title: 'Explore the training floor', note: 'Try three different movements.', progress: Math.min(3, movementIds.size), target: 3, reward: 'Movement scout title' },
      { id: 'band-trail', title: 'Walk the band trail', note: 'Log one resistance-band workout.', progress: Math.min(1, bandSessions), target: 1, reward: 'Ironwood map chapter' },
      { id: 'steady-rhythm', title: 'Find your rhythm', note: 'Move on three different days this week. Rest days are always okay.', progress: Math.min(3, activeDays), target: 3, reward: 'Campfire story' }
    ];
    const realmIndex = rewards.reduce((index, reward, current) => reward.level <= level ? current : index, 0);
    const realm = rewards[realmIndex];
    const next = rewards.find(reward => reward.level > level) || null;
    const rank = ranks.filter(item => item.level <= level).at(-1);
    return {
      xp, level, workouts: workouts.length, modeId, mode, rank, realm,
      chapter: mode.chapters[realmIndex], nextChapter: next ? mode.chapters[rewards.indexOf(next)] : null,
      next, rewards: rewards.filter(reward => reward.level <= level), quests, equipmentKinds: equipment.size
    };
  }

  function render(state) {
    if (state?.settings?.adventureMode === false) return '';
    const data = snapshot(state);
    const xpPerLevel = globalThis.ForgeProgress.XP_PER_LEVEL;
    const mapStartXp = (data.realm.level - 1) * xpPerLevel;
    const mapTargetXp = data.next ? (data.next.level - 1) * xpPerLevel : mapStartXp;
    const nextXp = Math.max(0, mapTargetXp - data.xp);
    const mapProgress = Math.max(0, Math.min(mapTargetXp - mapStartXp, data.xp - mapStartXp));
    const mapProgressMax = Math.max(1, mapTargetXp - mapStartXp);
    const featuredQuests = data.quests.filter(quest => quest.progress < quest.target).slice(0, 2);
    const missionMarkup = featuredQuests.length
      ? featuredQuests.map(quest => `<div class="campaign-mission"><span><strong>${escapeHtml(quest.title)}</strong><small>${escapeHtml(quest.note)}</small></span><span class="mission-progress">${quest.progress}/${quest.target}</span></div>`).join('')
      : '<p class="campaign-clear">All current missions are complete. Pick any movement—or take a rest.</p>';

    return `<section class="forge-campaign-card card" aria-label="Forge story campaign">
      <div class="campaign-head">
        <div><span class="tag">OPTIONAL STORY · ${escapeHtml(data.mode.title.toUpperCase())}</span><h2>${escapeHtml(data.mode.title)}</h2><p>${escapeHtml(data.mode.summary)}</p></div>
        <div class="campaign-rank"><span>YOUR TIER</span><strong>${escapeHtml(data.rank.title)}</strong><small>Level ${data.level}</small></div>
      </div>
      <div class="campaign-chapter">
        <div class="campaign-chapter-copy"><span class="campaign-overline">CURRENT CHAPTER</span><h3>${escapeHtml(data.chapter.title)}</h3><p>${escapeHtml(data.chapter.note)}</p></div>
        <div class="campaign-progress">${data.next ? `<progress value="${mapProgress}" max="${mapProgressMax}" aria-label="Progress to ${escapeHtml(data.nextChapter.title)}"></progress><small>${nextXp.toLocaleString()} Forge XP to ${escapeHtml(data.nextChapter.title)} · Level ${data.next.level}</small>` : '<small>Every chapter is open. Your progress remains yours to keep.</small>'}</div>
      </div>
      <div class="campaign-missions"><div class="campaign-missions-heading"><div><span class="campaign-overline">MISSION BOARD</span><h3>Choose one small step</h3></div><span class="campaign-optional">No daily deadline</span></div>
        ${missionMarkup}
      </div>
      <div class="button-row campaign-actions"><button class="lime" type="button" data-action="quick-workout">Choose a quick workout</button><button class="ghost" type="button" data-action="adventure-map">Story map and rewards</button></div>
      <p class="help campaign-footnote">Any movement can count. Rest days never remove levels or rewards; switch this story in Settings at any time.</p>
    </section>`;
  }

  function renderMap(state) {
    const data = snapshot(state);
    const chapters = data.mode.chapters.map((chapter, index) => {
      const reward = rewards[index], unlocked = reward.level <= data.level;
      return `<article class="campaign-node ${unlocked ? 'unlocked' : 'locked'}"><span class="campaign-node-state">${unlocked ? 'OPEN' : `LEVEL ${reward.level}`}</span><div><b>${escapeHtml(chapter.title)}</b><p>${escapeHtml(chapter.note)}</p><small>${unlocked ? `Earned: ${escapeHtml(reward.title)}` : `Next reward: ${escapeHtml(reward.title)}`}</small><small class="campaign-unlock-copy">${escapeHtml(reward.unlock)}</small></div></article>`;
    }).join('');
    const quests = data.quests.map(quest => `<article class="campaign-map-quest"><span><strong>${escapeHtml(quest.title)}</strong><small>${escapeHtml(quest.note)} · Story reward: ${escapeHtml(quest.reward)}</small></span><span class="mission-progress ${quest.progress >= quest.target ? 'is-complete' : ''}">${quest.progress >= quest.target ? 'Complete' : `${quest.progress}/${quest.target}`}</span></article>`).join('');
    return `<div class="campaign-map"><p>Your <strong>${escapeHtml(data.mode.title)}</strong> story follows the workouts you choose to log. Both routes share the same XP, tiers and rewards; there are no purchases, streak resets or penalties.</p><div class="campaign-map-summary"><span><small>Current tier</small><strong>${escapeHtml(data.rank.title)}</strong></span><span><small>Forge level</small><strong>${data.level}</strong></span><span><small>Sessions logged</small><strong>${data.workouts}</strong></span></div><h3>Chapters and rewards</h3><div class="campaign-chapters">${chapters}</div><h3>Optional missions</h3><div class="campaign-map-quests">${quests}</div></div>`;
  }

  function createQuickWorkout(id, catalog, makeExercise) {
    const template = quickWorkouts.find(item => item.id === id);
    if (!template) return null;
    if (template.id === 'walk-8') return { name: template.title, exercises: [{ id: 'forge-quick-walk', name: 'Easy walk', muscle: 'Cardio', equipment: 'Walking', kind: 'cardio', notes: 'Choose a pace and route that feel comfortable. Stop or turn back whenever you want.', sets: [{ reps: 0, weight: 0, rpe: null, done: false, seconds: template.minutes * 60, distanceKm: 0 }] }] };
    const exercises = template.ids.map(id => catalog.find(item => item.id === id)).filter(Boolean).map(item => { const exercise = makeExercise(item); exercise.sets = [exercise.sets[0]]; exercise.sets[0].reps = 8; exercise.sets[0].weight = 0; exercise.sets[0].done = false; return exercise; });
    return exercises.length ? { name: template.title, exercises } : null;
  }

  globalThis.ForgeGame = Object.freeze({ quickWorkouts, modeOptions, modes, ranks, rewards, snapshot, render, renderMap, createQuickWorkout });
})();
