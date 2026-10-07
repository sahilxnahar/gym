/* Shared reminder model. Schedules are optional; delivery is best-effort Web Push. */
(() => {
  'use strict';
  const days = Object.freeze([0, 1, 2, 3, 4, 5, 6]);
  const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  const allDays = () => [...days];
  function defaults(timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC') {
    return { version: 1, timeZone, quietHours: { enabled: true, start: '22:00', end: '07:00' },
      water: { enabled: false, intervalMinutes: 120, start: '09:00', end: '19:00', days: allDays() },
      walking: { enabled: false, intervalMinutes: 180, start: '10:00', end: '19:00', days: allDays() },
      homeWorkout: { enabled: false, time: '17:00', days: allDays() }, supplements: [] };
  }
  const validDays = value => Array.isArray(value) && value.length <= 7 && value.every(day => Number.isInteger(day) && day >= 0 && day <= 6) && new Set(value).size === value.length;
  const validTime = value => typeof value === 'string' && timePattern.test(value);
  function validSchedule(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== 1) return false;
    try { if (typeof value.timeZone !== 'string' || value.timeZone.length > 80) return false; new Intl.DateTimeFormat('en', { timeZone: value.timeZone }); } catch { return false; }
    const quiet = value.quietHours, water = value.water, walking = value.walking, homeWorkout = value.homeWorkout;
    if (!quiet || typeof quiet.enabled !== 'boolean' || !validTime(quiet.start) || !validTime(quiet.end)) return false;
    for (const item of [water, walking]) {
      if (!item || typeof item.enabled !== 'boolean' || !Number.isInteger(item.intervalMinutes) || item.intervalMinutes < 30 || item.intervalMinutes > 360 || !validTime(item.start) || !validTime(item.end) || item.start >= item.end || !validDays(item.days)) return false;
    }
    if (homeWorkout !== undefined && (!homeWorkout || typeof homeWorkout !== 'object' || Array.isArray(homeWorkout) || typeof homeWorkout.enabled !== 'boolean' || !validTime(homeWorkout.time) || !validDays(homeWorkout.days))) return false;
    if (!Array.isArray(value.supplements) || value.supplements.length > 20) return false;
    return value.supplements.every(item => item && typeof item === 'object' && !Array.isArray(item) && typeof item.id === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(item.id) && typeof item.label === 'string' && item.label.trim().length > 0 && item.label.length <= 80 && validTime(item.time) && validDays(item.days) && typeof item.enabled === 'boolean');
  }
  function localParts(date, timeZone) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date).map(part => [part.type, part.value]));
    const day = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[parts.weekday];
    return { dateKey: `${parts.year}-${parts.month}-${parts.day}`, day, minute: Number(parts.hour) * 60 + Number(parts.minute), clock: `${parts.hour}:${parts.minute}` };
  }
  const toMinute = time => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
  function isQuiet(config, minute) {
    if (!config.enabled) return false;
    const start = toMinute(config.start), end = toMinute(config.end);
    if (start === end) return false;
    return start < end ? minute >= start && minute < end : minute >= start || minute < end;
  }
  function dueOccurrences(schedule, date = new Date()) {
    if (!validSchedule(schedule)) return [];
    const local = localParts(date, schedule.timeZone);
    if (isQuiet(schedule.quietHours, local.minute)) return [];
    const out = [];
    for (const [kind, config] of [['water', schedule.water], ['walking', schedule.walking]]) {
      const start = toMinute(config.start), end = toMinute(config.end);
      if (config.enabled && config.days.includes(local.day) && local.minute >= start && local.minute <= end && (local.minute - start) % config.intervalMinutes === 0) {
        out.push({ id: kind, kind, occurrence: `${local.dateKey}-${local.clock}`, title: 'Forge reminder', body: kind === 'water' ? 'Pause for a drink if that suits you.' : 'Stand, stretch or take a short walk—your choice.' });
      }
    }
    const homeWorkout = schedule.homeWorkout;
    if (homeWorkout?.enabled && homeWorkout.days.includes(local.day) && homeWorkout.time === local.clock) {
      out.push({ id: 'home-workout', kind: 'home-workout', occurrence: `${local.dateKey}-${local.clock}`, title: 'Forge reminder', body: 'No gym today? Try 5 minutes: chair sit-to-stands, incline push-ups or glute bridges. Easy pace; one movement is enough.' });
    }
    for (const item of schedule.supplements) if (item.enabled && item.days.includes(local.day) && item.time === local.clock) {
      out.push({ id: `supplement-${item.id}`, kind: 'supplement', occurrence: `${local.dateKey}-${local.clock}`, title: 'Forge reminder', body: 'You have a supplement reminder. Review it in Forge.' });
    }
    return out;
  }
  globalThis.ForgeReminders = Object.freeze({ defaults, validSchedule, dueOccurrences, localParts, days, timePattern });
})();
