import test from 'node:test';
import assert from 'node:assert/strict';
import { createNativeHealthBridge, parseStepTotal } from '../mobile/src/health-data.mjs';

const today = new Date('2026-10-07T09:45:16.222Z');

 test('parses aggregate and point-list step results without retaining other record fields', () => {
  assert.equal(parseStepTotal('[{"Value":8123,"StartDate":"2026-10-07T00:00:00Z"}]'), 8123);
  assert.equal(parseStepTotal([{ value: 120.4 }, { steps: '4.2' }]), 125);
  assert.equal(parseStepTotal({ result: [{ total: 550 }, { Sum: 250 }] }), 800);
  assert.equal(parseStepTotal(null), 0);
  assert.throws(() => parseStepTotal('{not-json'), SyntaxError);
});

test('requests only read-only steps and queries a local-day total through now', async () => {
  const permissionCalls = [];
  const dataCalls = [];
  const api = {
    requestHealthPermissions: async options => permissionCalls.push(options),
    getData: async options => { dataCalls.push(options); return { results: '[{"Value":7421}]' }; }
  };
  const bridge = createNativeHealthBridge({ healthFitness: api, isSupported: () => true, now: () => today });

  await bridge.requestSteps();
  assert.equal(permissionCalls.length, 1);
  const request = permissionCalls[0];
  assert.deepEqual(JSON.parse(request.customPermissions), [{ Variable: 'STEPS', AccessType: 'READ' }]);
  for (const key of ['allVariables', 'fitnessVariables', 'healthVariables', 'profileVariables', 'workoutVariables']) {
    assert.deepEqual(JSON.parse(request[key]), { IsActive: false, AccessType: 'READ' });
  }

  assert.equal(await bridge.readTodaySteps(), 7421);
  assert.equal(dataCalls.length, 1);
  const query = JSON.parse(dataCalls[0].parameters);
  const localMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const asNativeDate = date => date.toISOString().split('.')[0] + 'Z';
  assert.equal(query.Variable, 'STEPS');
  assert.equal(query.OperationType, 'SUM');
  assert.equal(query.TimeUnit, 'DAY');
  assert.equal(query.StartDate, asNativeDate(localMidnight));
  assert.equal(query.EndDate, asNativeDate(today));
});

test('does not call a health provider when the runtime is not a supported native platform', async () => {
  let calls = 0;
  const bridge = createNativeHealthBridge({
    healthFitness: { requestHealthPermissions: async () => calls++, getData: async () => { calls++; return { results: '[]' }; } },
    isSupported: () => false,
    now: () => today
  });
  await assert.rejects(bridge.requestSteps(), /native companion/);
  await assert.rejects(bridge.readTodaySteps(), /native companion/);
  assert.equal(calls, 0);
});
