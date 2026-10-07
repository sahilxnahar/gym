const inactiveGroup = JSON.stringify({ IsActive: false, AccessType: 'READ' });
const numericKeys = ['Value', 'value', 'Sum', 'sum', 'Total', 'total', 'Result', 'result', 'Steps', 'steps', 'stepCount', 'step_count'];

function nativeDate(date) {
  return date.toISOString().split('.')[0] + 'Z';
}

function numeric(value) {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 10000000) return value;
  if (typeof value === 'string' && /^\d+(?:\.\d+)?$/.test(value)) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed <= 10000000 ? parsed : null;
  }
  return null;
}

export function parseStepTotal(serializedResults) {
  const payload = typeof serializedResults === 'string'
    ? JSON.parse(serializedResults || '[]')
    : serializedResults;
  const values = [];
  const visit = node => {
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    if (typeof node === 'number') {
      const value = numeric(node);
      if (value !== null) values.push(value);
      return;
    }
    if (!node || typeof node !== 'object') return;
    for (const key of numericKeys) {
      if (Object.prototype.hasOwnProperty.call(node, key)) {
        const value = numeric(node[key]);
        if (value !== null) {
          values.push(value);
          return;
        }
      }
    }
    for (const [key, child] of Object.entries(node)) {
      if (!/date|time|source|unit|variable/i.test(key)) visit(child);
    }
  };
  visit(payload);
  return Math.round(values.reduce((total, value) => total + value, 0));
}

export function createNativeHealthBridge({ healthFitness, isSupported, now = () => new Date() }) {
  if (!healthFitness || typeof isSupported !== 'function') throw new TypeError('A Health/Fitness adapter and platform predicate are required.');
  function requireNativePlatform() {
    if (!isSupported()) throw new Error('Health Connect and Apple Health are available only in the Forge native companion.');
  }
  async function requestSteps() {
    requireNativePlatform();
    await healthFitness.requestHealthPermissions({
      customPermissions: JSON.stringify([{ Variable: 'STEPS', AccessType: 'READ' }]),
      allVariables: inactiveGroup,
      fitnessVariables: inactiveGroup,
      healthVariables: inactiveGroup,
      profileVariables: inactiveGroup,
      workoutVariables: inactiveGroup
    });
  }
  async function readTodaySteps() {
    requireNativePlatform();
    const current = now();
    const startOfToday = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 0, 0, 0, 0);
    const response = await healthFitness.getData({
      parameters: JSON.stringify({
        Variable: 'STEPS',
        StartDate: nativeDate(startOfToday),
        EndDate: nativeDate(current),
        TimeUnit: 'DAY',
        OperationType: 'SUM',
        TimeUnitLength: 1,
        AdvancedQueryReturnType: 'ALL_DATA',
        AdvancedQueryResultType: 'RAW_DATA'
      })
    });
    return parseStepTotal(response?.results ?? '[]');
  }
  return Object.freeze({ requestSteps, readTodaySteps });
}
