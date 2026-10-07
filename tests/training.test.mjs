import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const context=vm.createContext({});
vm.runInContext(readFileSync(new URL('../public/training.js',import.meta.url),'utf8'),context);
const training=context.ForgeTraining;
const profile={version:1,ageGroup:'adult',weightKg:75,heightCm:175,goal:'fitness',experience:'beginner',days:3,minutes:30,equipment:'bodyweight',impact:'standard',limitations:'',bodyFocus:'balanced'};
const rec=patch=>training.recommend({...profile,...patch});
test('novice extra availability does not create excessive lifting volume',()=>{
 const r=rec({days:6}); assert.equal(r.weeklyGoal,3); assert.equal(r.sessions.length,3);
 assert.ok(r.sessions.every(s=>s.exercises.length===4&&s.exercises.every(e=>e.sets.length===2)));
});
test('goals and experience yield explainable editable targets',()=>{
 assert.equal(rec({goal:'muscle'}).sessions[0].exercises[0].sets[0].reps,10);
 const r=rec({goal:'strength',experience:'experienced',equipment:'gym',days:4,minutes:45});
 assert.equal(r.sessions[0].name,'Upper body 1'); assert.equal(r.sessions[1].name,'Lower body 1');
 assert.equal(r.sessions[0].exercises[0].sets[0].reps,5);
 assert.equal(r.sessions[0].exercises[0].sets.length,3);
 assert.match(rec({goal:'fatLoss'}).rationale.join(' '),/does not promise weight loss/);
});
test('equipment choices have appropriate movements and zero load placeholders',()=>{
 for(const equipment of ['bodyweight','dumbbells','gym']){
  const r=rec({equipment}); assert.ok(r.sessions.every(s=>s.exercises.every(e=>e.sets.every(v=>v.weight===0&&v.rpe===null&&v.done===false))));
  if(equipment==='bodyweight')assert.ok(r.sessions.every(s=>s.exercises.every(e=>e.equipment==='Bodyweight')));
 }
 assert.ok(rec({equipment:'dumbbells'}).sessions[0].exercises.some(e=>e.name==='Supported dumbbell row'));
});
test('low impact templates avoid jumps and provide accessible bodyweight variations',()=>{
 const r=rec({impact:'low',minutes:60});
 assert.equal(r.sessions[0].exercises[0].name,'Chair sit-to-stand');
 assert.equal(r.sessions[0].exercises[1].name,'Incline push-up');
 assert.ok(r.sessions[0].exercises.every(e=>!/jump|running/i.test(e.name)));
});
test('short sessions reduce exercises and body focus preserves foundations',()=>{
 assert.equal(rec({minutes:20}).sessions[0].exercises.length,3);
 assert.equal(rec({minutes:60}).sessions[0].exercises.length,6);
 for(const bodyFocus of ['upper','lower','core'])assert.equal(rec({bodyFocus,minutes:20}).sessions[0].exercises.length,3);
});
test('weight and height do not produce body types or load ratios',()=>{
 const a=JSON.stringify(rec({weightKg:50,heightCm:150}).sessions);
 assert.equal(a,JSON.stringify(rec({weightKg:150,heightCm:200}).sessions));
});
test('limitations and age groups gate automated plans but preserve logging guidance',()=>{
 for(const p of [{ageGroup:'under18'},{ageGroup:'older'},{limitations:'Knee injury'}]){
  const r=rec(p); assert.equal(r.eligible,false); assert.equal(r.sessions.length,0); assert.match(r.rationale.join(' '),/logging.*available/i);
 }
 assert.equal(rec({limitations:'   '}).eligible,true);
});
test('validation bounds, strips unrecognized fields and rejects malformed values',()=>{
 for(const p of [{weightKg:NaN},{weightKg:0},{heightCm:300},{days:7},{days:2.2},{minutes:25},{goal:'ectomorph'},{limitations:'x'.repeat(501)},{preferredDays:[1,1]},{preferredDays:[7]}])assert.throws(()=>rec(p));
 assert.equal(rec({weightKg:null,heightCm:null}).eligible,true);
 const clean=training.validateProfile({...profile,secret:'x',preferredDays:[5,1,3]});
 assert.equal(clean.secret,undefined); assert.equal(JSON.stringify(clean.preferredDays),'[1,3,5]');
});
test('catalog and demo cue keys are available and generated routines are deterministic',()=>{
 assert.ok(training.exercises.length>10);
 assert.equal(Object.keys(training.demoCues).length,6);
 assert.equal(JSON.stringify(rec({})),JSON.stringify(rec({})));
 assert.equal(new Set(training.exercises.map(e=>e.id)).size,training.exercises.length);
});
