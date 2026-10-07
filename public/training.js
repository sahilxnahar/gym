/* Forge training suggestions: editable starting points, never clinical prescriptions. */
(function (root) {
  'use strict';
  const choices = {
    ageGroup: ['under18', '18-39', '40-64', '65-74', '75+', 'adult', 'older'],
    goal: ['fitness', 'strength', 'muscle', 'fatLoss', 'endurance'],
    experience: ['beginner', 'returning', 'experienced'],
    impact: ['standard', 'low'],
    bodyFocus: ['balanced', 'upper', 'lower', 'core', 'push', 'pull']
  };
  const equipmentOptions = ['bodyweight', 'bands', 'dumbbells', 'gym'];
  function validateProfile(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input) || input.version !== 1) throw new TypeError('A version 1 training profile is required.');
    const p = { version: 1 };
    for (const [key, values] of Object.entries(choices)) { if (!values.includes(input[key])) throw new TypeError('Choose a valid ' + key + '.'); p[key] = input[key]; }
    for (const [key, min, max] of [['weightKg', 20, 400], ['heightCm', 80, 250]]) { const value = input[key]; if (value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)) throw new RangeError('Enter ' + key + ' within the supported range or leave it blank.'); p[key] = value; }
    const rawEquipment = Array.isArray(input.equipment) ? input.equipment : [input.equipment];
    if (!rawEquipment.length || rawEquipment.length > equipmentOptions.length || rawEquipment.some(item => !equipmentOptions.includes(item)) || new Set(rawEquipment).size !== rawEquipment.length) throw new TypeError('Choose at least one available equipment option.');
    p.equipment = equipmentOptions.filter(item => rawEquipment.includes(item));
    if (!Number.isInteger(input.days) || input.days < 1 || input.days > 7) throw new RangeError('Choose 1 to 7 available days.');
    if (![15, 20, 30, 45, 60, 75, 90].includes(input.minutes)) throw new RangeError('Choose a session length from 15 to 90 minutes.');
    if (typeof input.limitations !== 'string' || input.limitations.length > 500) throw new TypeError('Movement notes must be text of at most 500 characters.');
    p.days = input.days; p.minutes = input.minutes; p.limitations = input.limitations.trim();
    if (input.supersets !== undefined && typeof input.supersets !== 'boolean') throw new TypeError('Superset preference must be on or off.');
    p.supersets = input.supersets === true;
    if (input.preferredDays !== undefined) { if (!Array.isArray(input.preferredDays) || input.preferredDays.length > 7 || input.preferredDays.some(day => !Number.isInteger(day) || day < 0 || day > 6) || new Set(input.preferredDays).size !== input.preferredDays.length) throw new RangeError('Preferred days must be unique weekdays from 0 to 6.'); p.preferredDays = [...input.preferredDays].sort((a, b) => a - b); }
    return p;
  }
  const move = (id, name, muscle, equipment, notes, demoKey) => ({ id, name, muscle, equipment, notes, ...(demoKey ? { demoKey } : {}) });
  const pool = {
    squat: move('ft-squat', 'Comfortable squat', 'Legs', 'Bodyweight', 'Use a comfortable depth. Keep your feet planted and move slowly.', 'squat'),
    chair: move('ft-chair', 'Chair sit-to-stand', 'Legs', 'Bodyweight', 'Use a sturdy, stable chair. Stand smoothly; sit down with control.', 'squat'),
    push: move('ft-push', 'Push-up', 'Chest', 'Bodyweight', 'Choose a wall or stable raised surface if the floor version is too difficult. Keep your body aligned.', 'pushup'),
    incline: move('ft-incline', 'Incline push-up', 'Chest', 'Bodyweight', 'Use a stable raised surface. Keep elbows comfortable and lower with control.', 'pushup'),
    w: move('ft-w', 'Prone W raise', 'Back', 'Bodyweight', 'Lie face down and gently raise bent arms into a W. Use a small comfortable range; avoid arching your lower back.'),
    bridge: move('ft-bridge', 'Glute bridge', 'Legs', 'Bodyweight', 'Press through your feet, raise your hips comfortably and lower slowly.', 'bridge'),
    core: move('ft-core', 'Dead bug', 'Core', 'Bodyweight', 'Alternate opposite arm and leg slowly. Shorten the movement if your back lifts. Reps are per side.', 'deadbug'),
    calf: move('ft-calf', 'Supported calf raise', 'Legs', 'Bodyweight', 'Hold a stable support. Rise and lower slowly without bouncing.'),
    goblet: move('ft-goblet', 'Dumbbell goblet squat', 'Legs', 'Dumbbell', 'Start light. Hold the weight close and use a comfortable squat depth.'),
    press: move('ft-press', 'Dumbbell floor press', 'Chest', 'Dumbbell', 'Start light. Keep wrists steady and lower elbows gently to the floor.'),
    row: move('ft-row', 'Supported dumbbell row', 'Back', 'Dumbbell', 'Support yourself on a stable surface. Pull smoothly without twisting. Reps are per side.', 'row'),
    hinge: move('ft-hinge', 'Dumbbell hip hinge', 'Legs', 'Dumbbell', 'Start light, soften your knees and move your hips back. Keep the weight close.', 'hinge'),
    shoulder: move('ft-shoulder', 'Seated dumbbell press', 'Shoulders', 'Dumbbell', 'Sit upright with support. Start light and use a comfortable range.'),
    bandSquat: move('ft-band-squat', 'Resistance-band squat', 'Legs', 'Resistance band', 'Use a light band that is not damaged. Stand on its centre and hold the handles securely; move through a comfortable depth.'),
    bandPress: move('ft-band-press', 'Resistance-band chest press', 'Chest', 'Resistance band', 'Only use a purpose-made door anchor on a closed, secure door that cannot swing toward you. Start with a light band and a short range.'),
    bandRow: move('ft-band-row', 'Resistance-band row', 'Back', 'Resistance band', 'Use a light band with a secure anchor, or loop it around your feet while seated. Check the band for damage and pull smoothly.'),
    bandHinge: move('ft-band-hinge', 'Resistance-band hip hinge', 'Legs', 'Resistance band', 'Stand on a light band and hold its ends securely. Send your hips back gently; stop if the band slips.'),
    bandPull: move('ft-band-pull', 'Resistance-band pull-apart', 'Shoulders', 'Resistance band', 'Hold a light band at chest height with soft elbows. Pull only as far as feels comfortable; keep it away from your face.'),
    legpress: move('ft-legpress', 'Leg press', 'Legs', 'Machine', 'Ask staff to help with setup. Use a comfortable range and avoid locking knees.'),
    chest: move('ft-chest', 'Machine chest press', 'Chest', 'Machine', 'Set the handles at chest height. Start light and keep shoulders comfortable.'),
    cable: move('ft-cable', 'Seated cable row', 'Back', 'Cable', 'Sit tall and pull smoothly. Avoid leaning back to move the load.'),
    pulldown: move('ft-pulldown', 'Lat pulldown', 'Back', 'Cable', 'Pull toward the upper chest with control. Avoid pulling behind your head.')
  };
  function recommend(input) {
    const p = validateProfile(input), older = ['older', '65-74', '75+'].includes(p.ageGroup);
    const out = { profile:p, eligible:false, summary:'', rationale:[], weeklyGoal:0, sessions:[], activityHint:'', loadHint:'Bodyweight and height are not used to choose your exercise weight or diagnose body type.', progressionHint:'Review every suggestion before adding it to your plans.', notice:'General training suggestions, not medical advice. Stop if a movement causes pain, dizziness or unusual symptoms.' };
    if (p.ageGroup === 'under18' || p.limitations) { out.summary='You can still log workouts and explore the movement library.'; out.rationale=[p.ageGroup==='under18'?'Forge does not automatically build plans for people under 18. Ask a parent or guardian and a qualified coach to help choose age-appropriate training.':'Your movement note calls for individual review before an automatic plan is suggested.','Workout logging, the movement library and manual plan editing remain available.']; out.notice='Automatic plan suggestions are paused for this profile. A qualified professional can help tailor exercise to your needs.'; return out; }
    const has = item => p.equipment.includes(item), novice = p.experience !== 'experienced';
    const count = older ? Math.min(p.days, 2) : novice ? Math.min(p.days, 3) : Math.min(p.days, 4);
    const target = { 15:2, 20:3, 30:4, 45:5, 60:6, 75:6, 90:6 }[p.minutes], low = p.impact === 'low' || older;
    const legs = has('gym')?'legpress':has('dumbbells')?'goblet':has('bands')?'bandSquat':low?'chair':'squat';
    const push = has('gym')?'chest':has('dumbbells')?'press':has('bands')?'bandPress':low||novice?'incline':'push';
    const pull = has('gym')?'cable':has('dumbbells')?'row':has('bands')?'bandRow':'w';
    const hinge = has('dumbbells')?'hinge':has('bands')?'bandHinge':'bridge';
    const upper = [push,pull,has('gym')?'pulldown':has('dumbbells')?'shoulder':has('bands')?'bandPull':'core','core','w','bridge'];
    const lower = [legs,hinge,'core','calf','bridge',push];
    let full = [legs,push,pull,hinge,has('bands')?'bandPull':'core','calf'];
    if(p.bodyFocus==='upper')full=[push,pull,has('bands')?'bandPull':'core','core',legs,hinge];
    if(p.bodyFocus==='lower')full=[legs,hinge,'bridge','calf',push,'core'];
    if(p.bodyFocus==='core')full=[legs,push,pull,'core',hinge,'bridge'];
    if(p.bodyFocus==='push')full=[push,legs,hinge,'core',has('bands')?'bandPull':'calf',pull];
    if(p.bodyFocus==='pull')full=[pull,hinge,legs,'core',has('bands')?'bandPull':'calf',push];
    const split=!novice&&!older&&count===4, reps=older?8:p.goal==='strength'&&!novice&&!has('bodyweight')?5:p.goal==='muscle'?10:p.goal==='endurance'?12:8;
    const setCount=older?1:!novice&&p.goal==='strength'&&p.minutes>=45?3:2;
    for(let i=0;i<count;i++){
      const keys=split?(i%2?lower:upper):full, unique=[...new Set(keys)].slice(0,target);
      const exercises=unique.map(key=>({...pool[key],sets:Array.from({length:setCount},()=>({reps,weight:0,rpe:null,done:false}))}));
      if(p.supersets&&!older&&exercises.length>=3){const first=exercises.length>=5?2:1;let group=0;for(let j=first;j+1<exercises.length;j+=2){const label=String.fromCharCode(65+group++);exercises[j].sg=label;exercises[j+1].sg=label;}}
      const name=split?(i%2?'Lower body':'Upper body')+' '+(Math.floor(i/2)+1):'Full body '+String.fromCharCode(65+i);
      out.sessions.push({id:'ft-plan-'+i,name,exercises,minutes:p.minutes,notes:'Editable starting template. Include a gentle warm-up; allow rest between sets. Duration is an estimate.'});
    }
    out.eligible=true;out.weeklyGoal=count;out.summary=count+(count===1?' workout':' workouts')+' per week · '+(older?'shorter, lower-impact whole-body basics':split?'upper- and lower-body basics':'whole-body basics')+'.';
    out.rationale=['A steady routine matters more than a complicated one.',older?'This profile starts with up to two lower-impact days and one set per movement. Use a stable support when useful.':novice?'If you are new or returning, Forge starts with up to three workout days, even when more days are available.':'If you train often, Forge may suggest up to four workout days.',p.goal==='strength'?'Strength focus: practice controlled repetitions. Load suggestions are not calculated from body size.':p.goal==='muscle'?'Muscle focus: use manageable repetitions and set counts, then adjust after you review the plan.':p.goal==='fatLoss'?'General fitness focus: strength work supports movement and function. Forge does not promise weight loss or assign calorie targets.':p.goal==='endurance'?'Endurance focus: use a comfortable pace. Add optional aerobic activity that you enjoy; Forge does not set a medical heart-rate target.':'Fitness focus: balanced movement practice and repeatable sessions.','Session length limits the number of exercises. The plan uses the equipment you selected and a balanced mix of movements.',p.supersets&&!older?'Optional supersets pair two movements: complete one set of each before resting. You can change or remove the pairs.':'Supersets are optional and can be turned on or edited in the plan builder.','Weight and height do not determine how much you should lift.'];
    out.activityHint=older?'Add balance practice or easy walking only if it feels right for you. A trainer or health professional can help adapt activity to your circumstances.':'The CDC describes 150 minutes of moderate aerobic activity a week plus muscle strengthening on 2 or more days for adults; any comfortable movement is a useful start, not a pass/fail target.';
    out.loadHint+=' Start with an easy version or light resistance that lets you move with control. A logged value of 0 kg means no extra weight was recorded; it is not a recommendation.';
    out.progressionHint='When every set feels controlled across repeated sessions, add a repetition or a small load increment. Change one thing at a time and reduce difficulty if form deteriorates. Spread strength sessions across the week and allow recovery.';
    if(older)out.notice+=' This is a conservative starting template, not age-specific medical advice.';out.notice+=' Review and edit templates before applying them. Timing is an estimate.';return out;
  }
  const demoCues=Object.freeze({squat:'Move slowly through a comfortable depth with planted feet.',pushup:'Use a stable surface and maintain a comfortable body alignment.',row:'Support yourself and pull smoothly without twisting.',hinge:'Soften your knees and move your hips back with the load close.',bridge:'Raise your hips comfortably and lower with control.',deadbug:'Alternate opposite arm and leg slowly; shorten the range if needed.'});
  const exercises=Object.freeze(Object.values(pool).map(exercise=>Object.freeze({...exercise,cues:exercise.notes})));
  root.ForgeTraining=Object.freeze({validateProfile,recommend,exercises,demoCues,equipmentOptions:Object.freeze([...equipmentOptions])});
})(globalThis);
