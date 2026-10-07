/*
 * Adapted from OpenGym's frontend/src/lib/active-workout-order.js and the
 * supersetUnits helper in frontend/src/lib/history.js.
 * openGym — Copyright (C) 2026 Duarte Santos; GNU AGPL v3.0.
 * Source commit: 31c6795b40fb54130192b5016d7dc29e9f457d30.
 * The sg field and adjacent-unit behavior are retained; this wrapper adapts
 * OpenGym's entries array to Forge's exercises array.
 */
(function (root) {
  'use strict';
  function supersetUnits(items) {
    const units = [];
    (Array.isArray(items) ? items : []).forEach((exercise, index) => {
      const previous = items[index - 1];
      if (index > 0 && exercise?.sg && previous?.sg && exercise.sg === previous.sg) units[units.length - 1].push(index);
      else units.push([index]);
    });
    return units;
  }
  function listFor(active) { return active && Array.isArray(active.exercises) ? active.exercises : active && Array.isArray(active.entries) ? active.entries : null; }
  function moveTarget(active, index, direction) {
    const items = listFor(active);
    if (!items || !Number.isInteger(index) || index < 0 || index >= items.length || (direction !== -1 && direction !== 1)) return null;
    const units = supersetUnits(items), source = units.findIndex(unit => unit.includes(index)), target = source + direction;
    if (source < 0 || target < 0 || target >= units.length) return null;
    return { items, units, source, target };
  }
  function canMoveUnit(active, index, direction) { return moveTarget(active, index, direction) !== null; }
  function moveUnit(active, index, direction) {
    const move = moveTarget(active, index, direction);
    if (!move) return null;
    const selected = move.items[index], reordered = [...move.units], sourceUnit = reordered[move.source];
    reordered[move.source] = reordered[move.target]; reordered[move.target] = sourceUnit;
    const order = reordered.flat(), orderedItems = order.map(itemIndex => move.items[itemIndex]);
    move.items.splice(0, move.items.length, ...orderedItems);
    if ('cur' in active) active.cur = move.items.indexOf(selected);
    return { indices: order };
  }
  function partnerIndex(items, index) {
    const unit = supersetUnits(items).find(group => group.includes(index));
    if (!unit || unit.length !== 2) return -1;
    return unit[0] === index ? unit[1] : unit[0];
  }
  function labelFor(items, index) {
    const unit = supersetUnits(items).find(group => group.includes(index));
    if (!unit || unit.length !== 2) return '';
    const pairStarts = supersetUnits(items).filter(group => group.length === 2).map(group => group[0]);
    return String.fromCharCode(65 + Math.max(0, pairStarts.indexOf(unit[0])));
  }
  function unpair(items, index) {
    if (!Array.isArray(items) || !items[index]?.sg) return false;
    const group = items[index].sg;
    items.forEach(exercise => { if (exercise?.sg === group) delete exercise.sg; });
    return true;
  }
  function pairNext(items, index, groupId) {
    if (!Array.isArray(items) || !Number.isInteger(index) || index < 0 || index + 1 >= items.length || typeof groupId !== 'string' || !/^[A-Za-z0-9_-]{1,24}$/.test(groupId)) return false;
    const first = items[index], second = items[index + 1];
    if (first?.sg && first.sg === second?.sg) return unpair(items, index);
    unpair(items, index); unpair(items, index + 1); first.sg = groupId; second.sg = groupId;
    return true;
  }
  function normalizePairs(items) {
    if (!Array.isArray(items)) return [];
    const groups = new Map();
    items.forEach((exercise, index) => { if (!exercise?.sg) return; if (!groups.has(exercise.sg)) groups.set(exercise.sg, []); groups.get(exercise.sg).push(index); });
    const removed = [];
    for (const [group, indices] of groups) if (indices.length !== 2 || indices[1] !== indices[0] + 1) { items.forEach(exercise => { if (exercise?.sg === group) delete exercise.sg; }); removed.push(group); }
    return removed;
  }
  function assignPairs(items, enabled) {
    if (!Array.isArray(items)) return items;
    items.forEach(exercise => { if (exercise?.sg) delete exercise.sg; });
    if (!enabled || items.length < 3) return items;
    const first = items.length >= 5 ? 2 : 1; let label = 0;
    for (let index = first; index + 1 < items.length; index += 2) { const group = String.fromCharCode(65 + label++); items[index].sg = group; items[index + 1].sg = group; }
    return items;
  }
  root.ForgeSupersetOrder = Object.freeze({ supersetUnits, canMoveUnit, moveUnit, partnerIndex, labelFor, pairNext, unpair, normalizePairs, assignPairs });
})(globalThis);
