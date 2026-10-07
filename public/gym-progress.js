(() => {
  'use strict';

  const XP_PER_SET = 10;
  const XP_PER_SESSION = 80;
  const XP_PER_LEVEL = 1000;

  function completedSessions(workouts) {
    return (Array.isArray(workouts) ? workouts : []).filter(workout => Number.isFinite(workout?.finished));
  }

  function dateKey(date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  function streakDays(workouts, now = new Date()) {
    const dates = new Set(completedSessions(workouts).map(workout => dateKey(new Date(workout.finished))));
    const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Keep yesterday's active streak visible until the current day is logged.
    if (!dates.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);

    let streak = 0;
    while (streak < 366 && dates.has(dateKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function totalXp(workouts, completedSets) {
    return completedSessions(workouts).length * XP_PER_SESSION + Math.max(0, completedSets) * XP_PER_SET;
  }

  function render(workouts, completedSets) {
    const sessions = completedSessions(workouts);
    const xp = totalXp(sessions, completedSets);
    const level = Math.floor(xp / XP_PER_LEVEL) + 1;
    const levelProgress = xp % XP_PER_LEVEL;
    const xpToNext = XP_PER_LEVEL - levelProgress;
    const streak = streakDays(sessions);
    const badges = [
      { mark: '01', name: 'First set', note: 'Complete a set', earned: completedSets > 0 },
      { mark: '03', name: 'In rhythm', note: 'Build a 3-day streak', earned: streak >= 3 },
      { mark: '10', name: 'Ten strong', note: 'Log 10 sessions', earned: sessions.length >= 10 }
    ];

    return `<section class="momentum-panel" aria-label="Training level and achievements">
      <div class="momentum-main">
        <div class="momentum-heading"><span class="micro-label">YOUR MOMENTUM</span><span class="momentum-level">LEVEL ${level}</span></div>
        <div class="momentum-title-row"><h2>${xp.toLocaleString()} <small>XP</small></h2><span class="momentum-streak"><b>${streak}</b><small>DAY STREAK</small></span></div>
        <progress class="momentum-track" aria-label="Progress to next level" value="${levelProgress}" max="${XP_PER_LEVEL}"></progress>
        <div class="momentum-caption"><span>${xpToNext.toLocaleString()} XP to Level ${level + 1}</span><span>${XP_PER_SESSION} XP per session · ${XP_PER_SET} XP per completed set</span></div>
      </div>
      <div class="momentum-badges" aria-label="Milestones">
        ${badges.map(badge => `<div class="momentum-badge ${badge.earned ? 'earned' : ''}"><span class="badge-mark">${badge.earned ? '✓' : badge.mark}</span><span><b>${badge.name}</b><small>${badge.note}</small></span></div>`).join('')}
      </div>
    </section>`;
  }

  window.GymProgress = Object.freeze({ XP_PER_SET, XP_PER_SESSION, XP_PER_LEVEL, streakDays, totalXp, render });
})();
