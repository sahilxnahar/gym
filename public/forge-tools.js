/* Local-first health and training helpers. No diagnosis, targets or body-size load scaling. */
(function (root) {
  'use strict';
  const dietKey = 'forge-diet-preferences-v1';
  const dietPatterns = ['none', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'kosher', 'gluten-free', 'dairy-free', 'other'];
  function calculateBmi(weightKg, heightCm) {
    if (!Number.isFinite(weightKg) || weightKg <= 0 || !Number.isFinite(heightCm) || heightCm <= 0) return null;
    const metres = heightCm / 100, value = weightKg / (metres * metres);
    return Number.isFinite(value) ? Math.round(value * 10) / 10 : null;
  }
  function adultBmiCategory(value) {
    if (!Number.isFinite(value) || value <= 0) return null;
    if (value < 18.5) return { key: 'lower', label: 'Below 18.5', range: 'Below the usual adult screening range' };
    if (value < 25) return { key: 'healthy', label: '18.5 to under 25', range: 'Within the usual adult screening range' };
    if (value < 30) return { key: 'higher', label: '25 to under 30', range: 'Above the usual adult screening range' };
    if (value < 35) return { key: 'class1', label: '30 to under 35', range: 'Adult BMI category 1' };
    if (value < 40) return { key: 'class2', label: '35 to under 40', range: 'Adult BMI category 2' };
    return { key: 'class3', label: '40 or higher', range: 'Adult BMI category 3 or higher' };
  }
  function bmiNote(category) {
    if (!category) return 'Check the values and try again.';
    if (category.key === 'lower') return 'BMI alone cannot explain a result. If this is unexpected or reflects an unplanned change, consider discussing it with a health professional.';
    if (category.key === 'healthy') return 'BMI does not measure strength, muscle or individual health. Choose training goals that matter to you.';
    return 'BMI is a screening measure, not a diagnosis. A health professional can interpret it with your circumstances. Forge will not set a target weight or change your workout from this number.';
  }
  const cardioOptions = Object.freeze({
    walking: { title: 'Walking', idea: 'Choose a pace and route that feel comfortable. A few short walks can be easier to fit in than one long session.' },
    cycling: { title: 'Cycling', idea: 'Use a stable bike setup and begin with an easy effort. Reduce resistance if you cannot speak comfortably.' },
    swimming: { title: 'Swimming or water exercise', idea: 'Choose a supervised pool and a comfortable pace. Water activity may feel different from land exercise.' },
    dance: { title: 'Dancing', idea: 'Pick music and movements you enjoy. Keep a chair or clear space nearby if you want extra support.' },
    rowing: { title: 'Rowing machine', idea: 'Ask gym staff for setup help. Start with low resistance and a smooth, comfortable stroke.' },
    chair: { title: 'Seated movement', idea: 'Try gentle arm movements or seated marching if that suits you. Keep the range pain-free.' },
    stairs: { title: 'Steps or hills', idea: 'Use a handrail and a stable surface if you choose this option. Walking on level ground is a useful alternative.' }
  });
  function cardioIdeas(activity, minutes, effort) {
    const option = cardioOptions[activity];
    if (!option || !Number.isInteger(minutes) || minutes < 5 || minutes > 90 || !['easy', 'moderate'].includes(effort)) return null;
    return { title: option.title, minutes, idea: option.idea,
      pace: effort === 'easy' ? 'Keep it easy enough to talk comfortably; take breaks whenever you want.' : 'For a moderate effort, try the talk test: you can talk, but singing would be difficult. Slow down if this does not feel right.',
      safety: 'General ideas only. Choose activity that suits your ability, and ask a qualified professional if you need individual guidance.' };
  }
  function getDietPreferences() {
    try {
      const saved = JSON.parse(root.localStorage.getItem(dietKey) || 'null');
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return { pattern: 'none', note: '' };
      return { pattern: dietPatterns.includes(saved.pattern) ? saved.pattern : 'none', note: typeof saved.note === 'string' ? saved.note.slice(0, 400) : '' };
    } catch { return { pattern: 'none', note: '' }; }
  }
  function saveDietPreferences(input) {
    if (!input || !dietPatterns.includes(input.pattern) || typeof input.note !== 'string' || input.note.length > 400) return false;
    try { root.localStorage.setItem(dietKey, JSON.stringify({ pattern: input.pattern, note: input.note.trim() })); return true; }
    catch { return false; }
  }
  function clearDietPreferences() { try { root.localStorage.removeItem(dietKey); return true; } catch { return false; } }
  root.ForgeTools = Object.freeze({ calculateBmi, adultBmiCategory, bmiNote, cardioIdeas, cardioOptions, dietPatterns:Object.freeze([...dietPatterns]), getDietPreferences, saveDietPreferences, clearDietPreferences });
})(globalThis);
