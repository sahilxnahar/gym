import test from 'node:test';
import assert from 'node:assert/strict';
import { validState } from '../server.mjs';

function state(gameMode) {
  return {
    version: 1,
    workouts: [],
    routines: [],
    bodyweight: [],
    active: null,
    settings: { unit: 'kg', rest: 90, theme: 'warm', adventureMode: true, gameMode }
  };
}

test('the server accepts only the two supported story-route values', () => {
  assert.equal(validState(state('ground-up')), true);
  assert.equal(validState(state('legacy')), true);
  assert.equal(validState(state('unknown')), false);
  assert.equal(validState(state('slave')), false);
});
