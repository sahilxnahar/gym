/* Original FORGE planning heuristics. Editable suggestions, never a clinical prescription. */
(function (root) {
  'use strict';
  const choices = {ageGroup:['adult','under18','older'], goal:['strength','muscle','fatLoss','fitness'], experience:['beginner','returning','experienced'], equipment:['bodyweight','dumbbells','gym'], impact:['standard','low'], bodyFocus:['balanced','upper','lower','core']};
  function validateProfile(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input) || input.version !== 1) throw new TypeError('A version 1 training profile is required.');
    const p = {version:1};
    for (const [key, values] of Object.entries(choices)) {
      if (!values.includes(input[key])) throw new TypeError('Choose a valid '+key+'.');
      p[key] = input[key];
    }
    for (const [key,min,max] of [['weightKg',20,400],['heightCm',80,250]]) {
      const value = input[key];
      if (value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)) throw new RangeError('Enter '+key+' within the supported range or leave it blank.');
      p[key] = value;
    }
    if (!Number.isInteger(input.days) || input.days < 2 || input.days > 6) throw new RangeError('Choose 2 to 6 available days.');
    if (![20,30,45,60].includes(input.minutes)) throw new RangeError('Choose a supported session duration.');
    if (typeof input.limitations !== 'string' || input.limitations.length > 500) throw new TypeError('Limitations must be text of at most 500 characters.');
    p.days=input.days; p.minutes=input.minutes; p.limitations=input.limitations.trim();
    if (input.preferredDays !== undefined) {
      if (!Array.isArray(input.preferredDays) || input.preferredDays.length > 7 || input.preferredDays.some(d=>!Number.isInteger(d)||d<0||d>6) || new Set(input.preferredDays).size !== input.preferredDays.length) throw new RangeError('Preferred days must be unique weekdays from 0 to 6.');
      p.preferredDays=[...input.preferredDays].sort((a,b)=>a-b);
    }
    return p;
  }
  const move=(id,name,muscle,equipment,notes,demoKey)=>({id,name,muscle,equipment,notes,...(demoKey?{demoKey}:{})});
  const pool={
    squat:move('ft-squat','Comfortable squat','Legs','Bodyweight','Use a comfortable depth. Keep your feet planted and move slowly.','squat'),
    chair:move('ft-chair','Chair sit-to-stand','Legs','Bodyweight','Use a sturdy, stable chair. Stand smoothly; sit down with control.','squat'),
    push:move('ft-push','Push-up','Chest','Bodyweight','Choose a wall or stable raised surface if the floor version is too difficult. Keep your body aligned.','pushup'),
    incline:move('ft-incline','Incline push-up','Chest','Bodyweight','Use a stable raised surface. Keep elbows comfortable and lower with control.','pushup'),
    w:move('ft-w','Prone W raise','Back','Bodyweight','Lie face down and gently raise bent arms into a W. Use a small comfortable range; avoid arching your lower back.'),
    bridge:move('ft-bridge','Glute bridge','Legs','Bodyweight','Press through your feet, raise your hips comfortably and lower slowly.','bridge'),
    core:move('ft-core','Dead bug','Core','Bodyweight','Alternate opposite arm and leg slowly. Shorten the movement if your back lifts. Reps are per side.','deadbug'),
    calf:move('ft-calf','Supported calf raise','Legs','Bodyweight','Hold a stable support. Rise and lower slowly without bouncing.'),
    goblet:move('ft-goblet','Dumbbell goblet squat','Legs','Dumbbell','Start light. Hold the weight close and use a comfortable squat depth.'),
    press:move('ft-press','Dumbbell floor press','Chest','Dumbbell','Start light. Keep wrists steady and lower elbows gently to the floor.'),
    row:move('ft-row','Supported dumbbell row','Back','Dumbbell','Support yourself on a stable surface. Pull smoothly without twisting. Reps are per side.','row'),
    hinge:move('ft-hinge','Dumbbell hip hinge','Legs','Dumbbell','Start light, soften your knees and move your hips back. Keep the weight close.','hinge'),
    shoulder:move('ft-shoulder','Seated dumbbell press','Shoulders','Dumbbell','Sit upright with support. Start light and use a comfortable range.'),
    legpress:move('ft-legpress','Leg press','Legs','Machine','Ask staff to help with setup. Use a comfortable range and avoid locking knees.'),
    chest:move('ft-chest','Machine chest press','Chest','Machine','Set the handles at chest height. Start light and keep shoulders comfortable.'),
    cable:move('ft-cable','Seated cable row','Back','Cable','Sit tall and pull smoothly. Avoid leaning back to move the load.'),
    pulldown:move('ft-pulldown','Lat pulldown','Back','Cable','Pull toward the upper chest with control. Avoid pulling behind your head.')
  };
  function recommend(input) {
    const p=validateProfile(input);
    const out={profile:p,eligible:false,summary:'',rationale:[],weeklyGoal:0,sessions:[],activityHint:'',loadHint:'Bodyweight and height are recorded for your own context. They do not determine exercise loads or a body-type diagnosis.',progressionHint:'Review every suggestion before adding it to your routines.',notice:'General training suggestions, not medical advice. Stop if an exercise causes pain, dizziness or unusual symptoms.'};
    if (p.ageGroup !== 'adult' || p.limitations) {
      out.summary='Keep logging; get a tailored plan before applying recommendations.';
      out.rationale=['Your age group or reported limitations calls for individual review by a qualified trainer; a healthcare professional can advise where needed.','Workout logging and manual routine editing remain available.'];
      out.notice='Automatic plans are paused for this profile. Review age, injuries, pregnancy, symptoms or other limitations with an appropriately qualified professional.';
      return out;
    }
    const novice=p.experience!=='experienced';
    const count=novice?Math.min(p.days,3):Math.min(p.days,4);
    const target={20:3,30:4,45:5,60:6}[p.minutes];
    const low=p.impact==='low';
    const legs=p.equipment==='gym'?'legpress':p.equipment==='dumbbells'&&!low?'goblet':low?'chair':'squat';
    const push=p.equipment==='gym'?'chest':p.equipment==='dumbbells'?'press':low||novice?'incline':'push';
    const pull=p.equipment==='gym'?'cable':p.equipment==='dumbbells'?'row':'w';
    const hinge=p.equipment==='bodyweight'?'bridge':'hinge';
    const upper=[push,pull,p.equipment==='gym'?'pulldown':p.equipment==='dumbbells'?'shoulder':'incline','core','w','bridge'];
    const lower=[legs,hinge,'core','calf','bridge',push];
    let full=[legs,push,pull,hinge,'core','calf'];
    // A focus changes accessory order without dropping the full-body foundations.
    if(p.bodyFocus==='upper')full=[legs,push,pull,p.equipment==='dumbbells'?'shoulder':p.equipment==='gym'?'pulldown':'core',hinge,'core'];
    if(p.bodyFocus==='lower')full=[legs,push,pull,hinge,'calf','core'];
    if(p.bodyFocus==='core')full=[legs,push,pull,'core',hinge,'bridge'];
    const split=!novice&&count===4;
    const reps=p.goal==='strength'&&!novice&&p.equipment!=='bodyweight'?5:p.goal==='muscle'?10:8;
    const setCount=!novice&&p.goal==='strength'&&p.minutes>=45?3:2;
    for(let i=0;i<count;i++) {
      const keys=split?(i%2?lower:upper):full;
      const unique=[...new Set(keys)].slice(0,target);
      const name=split?(i%2?'Lower body':'Upper body')+' '+(Math.floor(i/2)+1):'Full body '+String.fromCharCode(65+i);
      out.sessions.push({id:'ft-plan-'+i,name,exercises:unique.map(key=>({...pool[key],sets:Array.from({length:setCount},()=>({reps,weight:0,rpe:null,done:false}))})),minutes:p.minutes,notes:'Editable starting template. Include a gentle warm-up; allow rest between sets. Duration is an estimate.'});
    }
    out.eligible=true; out.weeklyGoal=count;
    out.summary=count+' workouts per week · '+(split?'upper- and lower-body basics':'whole-body basics')+'.';
    out.rationale=[
      'A steady routine matters more than a complicated one.',
      novice?'If you are new or returning, Forge starts with 2–3 workout days, even when more days are available.':'If you train often, Forge may suggest up to 4 workout days.',
      p.goal==='strength'?'Strength focus: practice controlled repetitions; experienced equipment users receive a lower repetition starting target.':p.goal==='muscle'?'Muscle focus: a moderate repetition starting target, with manageable initial set counts.':p.goal==='fatLoss'?'Fat-loss goal: resistance training supports strength and function. This plan does not promise weight loss or assign calorie targets.':'Fitness focus: balanced movement practice and repeatable sessions.',
      'Session length limits the number of exercises. The plan uses a balanced mix of movements.',
      'Weight and height do not determine how much you should lift.'
    ];
    out.activityHint=low?'Optional comfortable walking or stationary cycling between resistance sessions; avoid jumping.':'Optional comfortable walking or other enjoyable easy activity between resistance sessions.';
    out.loadHint+=' Start with an easy version or light weight that lets you move with control. A logged value of 0 kg means no extra weight was recorded; it is not a recommendation.';
    out.progressionHint='When every set feels controlled across repeated sessions, add a rep or a small load increment. Change one variable at a time; reduce difficulty if form deteriorates. Spread resistance sessions across the week and allow recovery.';
    out.notice+=' Templates require your review and can be edited before applying. Timing includes recovery and varies by person.';
    return out;
  }
  const demoCues=Object.freeze({squat:'Move slowly through a comfortable depth with planted feet.',pushup:'Use a stable surface and maintain a comfortable body alignment.',row:'Support yourself and pull smoothly without twisting.',hinge:'Soften your knees and move your hips back with the load close.',bridge:'Raise your hips comfortably and lower with control.',deadbug:'Alternate opposite arm and leg slowly; shorten the range if needed.'});
  const exercises=Object.freeze(Object.values(pool).map(e=>Object.freeze({...e,cues:e.notes})));
  root.ForgeTraining=Object.freeze({validateProfile,recommend,exercises,demoCues});
})(globalThis);
