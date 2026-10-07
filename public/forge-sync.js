/* Conflict-aware, local-first snapshot merging. No auth credentials are stored here. */
(() => {
  'use strict';
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  const canonical = value => {
    if (Array.isArray(value)) return value.map(canonical);
    if (!object(value)) return value;
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  };
  const equal = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
  const newId = () => globalThis.crypto?.randomUUID?.() || 'merge-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  function duplicate(item) {
    const copy = clone(item);
    copy.id = newId();
    copy.syncConflictCopy = true;
    if (typeof copy.name === 'string') copy.name = (copy.name + ' (merged copy)').slice(0, 200);
    return copy;
  }
  function mergeCollection(local = [], remote = [], base = [], path = '', conflicts = []) {
    const l = new Map((Array.isArray(local) ? local : []).filter(x => x && typeof x.id === 'string').map(x => [x.id, x]));
    const r = new Map((Array.isArray(remote) ? remote : []).filter(x => x && typeof x.id === 'string').map(x => [x.id, x]));
    const b = new Map((Array.isArray(base) ? base : []).filter(x => x && typeof x.id === 'string').map(x => [x.id, x]));
    const result = [];
    for (const id of new Set([...b.keys(), ...l.keys(), ...r.keys()])) {
      const lv = l.get(id), rv = r.get(id), bv = b.get(id);
      if (equal(lv, rv)) { if (lv !== undefined) result.push(clone(lv)); continue; }
      if (equal(lv, bv)) { if (rv !== undefined) result.push(clone(rv)); continue; }
      if (equal(rv, bv)) { if (lv !== undefined) result.push(clone(lv)); continue; }
      if (lv === undefined && rv === undefined) continue;
      if (lv === undefined || rv === undefined) {
        // A concurrent edit beats a deletion so an edited workout is not silently lost.
        result.push(clone(lv === undefined ? rv : lv));
        conflicts.push({ path, id, kind: 'delete-vs-edit' });
        continue;
      }
      // Same record changed on both devices: retain the server's canonical id and a
      // separate local copy so users can choose what to keep after automatic recovery.
      result.push(clone(rv), duplicate(lv));
      conflicts.push({ path, id, kind: 'same-record-edited' });
    }
    if (result.every(item => Number.isFinite(item.date ?? item.started ?? item.updatedAt))) {
      result.sort((a, b) => (a.date ?? a.started ?? a.updatedAt) - (b.date ?? b.started ?? b.updatedAt));
    }
    return result;
  }
  function mergeSet(local = [], remote = [], base = []) {
    const l = new Set(Array.isArray(local) ? local : []), r = new Set(Array.isArray(remote) ? remote : []), b = new Set(Array.isArray(base) ? base : []);
    return [...new Set([...l, ...r, ...b])].filter(value => b.has(value) ? l.has(value) && r.has(value) : l.has(value) || r.has(value));
  }
  function mergeValue(local, remote, base, path, conflicts) {
    if (equal(local, remote)) return clone(local);
    if (equal(local, base)) return clone(remote);
    if (equal(remote, base)) return clone(local);
    if (Array.isArray(local) && Array.isArray(remote) && Array.isArray(base)) {
      if (path === 'profilePlanIds') return mergeSet(local, remote, base);
      if ([...local, ...remote, ...base].every(item => item && typeof item.id === 'string')) return mergeCollection(local, remote, base, path, conflicts);
      conflicts.push({ path, kind: 'both-devices-changed' });
      return clone(local);
    }
    if (object(local) && object(remote) && object(base)) {
      const merged = {};
      for (const key of new Set([...Object.keys(local), ...Object.keys(remote), ...Object.keys(base)])) {
        const value = mergeValue(local[key], remote[key], base[key], path ? path + '.' + key : key, conflicts);
        if (value !== undefined) merged[key] = value;
      }
      return merged;
    }
    conflicts.push({ path, kind: 'both-devices-changed' });
    return clone(local);
  }
  function mergeStates(local, remote, base) {
    const conflicts = [], left = object(local) ? local : {}, right = object(remote) ? remote : {}, ancestor = object(base) ? base : {};
    const merged = mergeValue(left, right, ancestor, '', conflicts) || {};
    merged.version = 1;
    for (const key of ['workouts', 'routines', 'bodyweight', 'sessionDrafts']) {
      merged[key] = mergeCollection(left[key] || [], right[key] || [], ancestor[key] || [], key, conflicts);
    }
    // Two devices can each have an open session. Keep this device's active workout
    // and retain the other one as a resumable draft rather than overwriting either.
    if (left.active && right.active && left.active.id !== right.active.id) {
      merged.active = clone(left.active);
      merged.sessionDrafts = mergeCollection(
        [...(left.sessionDrafts || []), right.active],
        [...(right.sessionDrafts || []), left.active],
        ancestor.sessionDrafts || [],
        'sessionDrafts', conflicts
      );
      conflicts.push({ path: 'active', kind: 'separate-open-workouts' });
    }
    return { state: merged, conflicts };
  }
  globalThis.ForgeSync = Object.freeze({ mergeStates, mergeCollection, equalStates: equal });
})();
