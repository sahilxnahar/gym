import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const context=vm.createContext({});
vm.runInContext(readFileSync(new URL('../public/training.js',import.meta.url),'utf8'),context);
const training=context.ForgeTraining;
const profile={version:1,ageGroup:'adult',weightKg:75,heightCm:175,goal:'fitness',experience:'beginner',days:3,minutes:30,equipment:'bodyweight',impact:'standard',limitations:'',bodyFocus:'balanced'};
const rec=patch=>training.recommend({...profile,...patch});

test('novice availability is capped at three repeatable lifting days',()=>{
 const r=rec({days:7});assert.equal(r.weeklyGoal,3);assert.equal(r.sessions.length,3);
 assert.ok(r.sessions.every(s=>s.exercises.length===4&&s.exercises.every(e=>e.sets.length===2)));
});
test('goals and experience yield explainable editable targets',()=>{
 assert.equal(rec({goal:'muscle'}).sessions[0].exercises[0].sets[0].reps,10);
 const r=rec({goal:'strength',experience:'experienced',equipment:'gym',days:4,minutes:45});
 assert.equal(r.sessions[0].name,'Upper body 1');assert.equal(r.sessions[1].name,'Lower body 1');
 assert.equal(r.sessions[0].exercises[0].sets[0].reps,5);assert.equal(r.sessions[0].exercises[0].sets.length,3);
 assert.match(rec({goal:'fatLoss'}).rationale.join(' '),/does not promise weight loss/);
});
test('bodyweight, bands, weights and machine profiles use appropriate equipment',()=>{
 for(const equipment of ['bodyweight','dumbbells','gym','bands']){const r=rec({equipment});assert.ok(r.sessions.every(s=>s.exercises.every(e=>e.sets.every(v=>v.weight===0&&v.rpe===null&&v.done===false))));}
 assert.ok(rec({equipment:'bodyweight'}).sessions.every(s=>s.exercises.every(e=>e.equipment==='Bodyweight')));
 assert.ok(rec({equipment:'dumbbells'}).sessions[0].exercises.some(e=>e.name==='Supported dumbbell row'));
 assert.ok(rec({equipment:'bands'}).sessions[0].exercises.some(e=>e.name==='Resistance-band row'));
 assert.ok(rec({equipment:['bodyweight','bands']}).sessions[0].exercises.some(e=>e.equipment==='Resistance band'));
});
test('low-impact templates start with a stable supported movement',()=>{
 const r=rec({impact:'low',minutes:60});assert.equal(r.sessions[0].exercises[0].name,'Chair sit-to-stand');
 assert.equal(r.sessions[0].exercises[1].name,'Incline push-up');assert.ok(r.sessions[0].exercises.every(e=>!/jump|running/i.test(e.name)));
});
test('short and longer sessions scale exercise count and support broad availability',()=>{
 assert.equal(rec({minutes:15,days:1}).sessions[0].exercises.length,2);
 assert.equal(rec({minutes:20}).sessions[0].exercises.length,3);
 assert.equal(rec({minutes:60}).sessions[0].exercises.length,6);
 assert.equal(rec({minutes:90,days:7,experience:'experienced'}).sessions.length,4);
 for(const bodyFocus of ['upper','lower','core','push','pull'])assert.equal(rec({bodyFocus,minutes:20}).sessions[0].exercises.length,3);
});
test('age ranges include conservative later-life options and pause under-18 auto plans',()=>{
 assert.equal(rec({ageGroup:'18-39'}).eligible,true);
 const older=rec({ageGroup:'65-74',days:7,minutes:90});assert.equal(older.eligible,true);assert.equal(older.weeklyGoal,2);
 assert.ok(older.sessions.every(s=>s.exercises.every(e=>e.sets.length===1)));
 assert.equal(rec({ageGroup:'75+',equipment:'bodyweight'}).eligible,true);
 for(const p of [{ageGroup:'under18'},{limitations:'Knee injury'}]){const r=rec(p);assert.equal(r.eligible,false);assert.equal(r.sessions.length,0);assert.match(r.rationale.join(' '),/logging.*available/i);}
 assert.equal(rec({limitations:'   '}).eligible,true);
});
test('optional supersets create adjacent pairs that can be independently edited',()=>{
 const workout=rec({experience:'experienced',days:4,minutes:60,equipment:'bands',supersets:true}).sessions[0];
 const groups=new Map();workout.exercises.forEach((exercise,index)=>{if(exercise.sg){if(!groups.has(exercise.sg))groups.set(exercise.sg,[]);groups.get(exercise.sg).push(index)}});
 assert.ok(groups.size>0);for(const indices of groups.values())assert.equal(indices[1],indices[0]+1);
 assert.equal(rec({ageGroup:'65-74',supersets:true}).sessions[0].exercises.some(e=>e.sg),false);
});
test('body measurements never affect generated exercises or loads',()=>{
 assert.equal(JSON.stringify(rec({weightKg:50,heightCm:150}).sessions),JSON.stringify(rec({weightKg:150,heightCm:200}).sessions));
 assert.match(rec({}).loadHint,/not used to choose your exercise weight/);
});
test('validation bounds, strips unknown fields and rejects malformed values',()=>{
 for(const p of [{weightKg:NaN},{weightKg:0},{heightCm:300},{days:8},{days:2.2},{minutes:25},{minutes:91},{goal:'ectomorph'},{limitations:'x'.repeat(501)},{preferredDays:[1,1]},{preferredDays:[7]},{equipment:[]}])assert.throws(()=>rec(p));
 assert.equal(rec({weightKg:null,heightCm:null}).eligible,true);
 const clean=training.validateProfile({...profile,secret:'x',preferredDays:[5,1,3]});assert.equal(clean.secret,undefined);assert.equal(JSON.stringify(clean.preferredDays),'[1,3,5]');assert.deepEqual(Array.from(clean.equipment),['bodyweight']);
});
test('movement cue keys are present and generated plans are deterministic',()=>{
 assert.ok(training.exercises.length>15);assert.equal(Object.keys(training.demoCues).length,6);
 assert.equal(JSON.stringify(rec({})),JSON.stringify(rec({})));assert.equal(new Set(training.exercises.map(e=>e.id)).size,training.exercises.length);
});
