import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/forge-sync.js';

const empty = () => ({ version:1, workouts:[], routines:[], bodyweight:[], sessionDrafts:[], active:null, settings:{unit:'kg',rest:90,theme:'warm'}, reminders:{water:{enabled:false},walking:{enabled:false}}, profilePlanIds:[] });
const workout = (id, name='Workout', started=100) => ({id,name,started,finished:started+1000,exercises:[],notes:''});

test('merges independent workouts and preference fields from two devices',()=>{
 const base=empty(), local=structuredClone(base), remote=structuredClone(base);
 local.workouts=[workout('phone')];local.settings.theme='charcoal';
 remote.workouts=[workout('laptop','Walk',200)];remote.settings.unit='lb';
 const result=globalThis.ForgeSync.mergeStates(local,remote,base);
 assert.deepEqual(new Set(result.state.workouts.map(item=>item.id)),new Set(['phone','laptop']));
 assert.equal(result.state.settings.theme,'charcoal');assert.equal(result.state.settings.unit,'lb');assert.equal(result.conflicts.length,0);
});

test('a deletion on one device is preserved when the other side is unchanged',()=>{
 const base=empty();base.workouts=[workout('old')];
 const local=structuredClone(base);local.workouts=[];
 const result=globalThis.ForgeSync.mergeStates(local,base,base);
 assert.deepEqual(result.state.workouts,[]);assert.deepEqual(result.conflicts,[]);
});

test('a concurrent edit and delete preserves the edited workout and reports a conflict',()=>{
 const base=empty();base.workouts=[workout('same')];
 const local=structuredClone(base);local.workouts[0].notes='edited on phone';
 const remote=structuredClone(base);remote.workouts=[];
 const result=globalThis.ForgeSync.mergeStates(local,remote,base);
 assert.equal(result.state.workouts.length,1);assert.equal(result.state.workouts[0].notes,'edited on phone');
 assert.ok(result.conflicts.some(conflict=>conflict.kind==='delete-vs-edit'));
});

test('simultaneous edits to one record retain both copies instead of overwriting',()=>{
 const base=empty();base.workouts=[workout('same','Base')];
 const local=structuredClone(base);local.workouts[0].notes='phone edit';
 const remote=structuredClone(base);remote.workouts[0].notes='laptop edit';
 const result=globalThis.ForgeSync.mergeStates(local,remote,base);
 assert.equal(result.state.workouts.length,2);
 assert.deepEqual(new Set(result.state.workouts.map(item=>item.notes)),new Set(['phone edit','laptop edit']));
 assert.ok(result.state.workouts.some(item=>item.syncConflictCopy));
 assert.ok(result.conflicts.some(conflict=>conflict.kind==='same-record-edited'));
});

test('separate active sessions survive as the active workout plus a resumable draft',()=>{
 const base=empty(), local=structuredClone(base), remote=structuredClone(base);
 local.active={id:'phone-session',name:'Quick workout',started:100,exercises:[],notes:''};
 remote.active={id:'laptop-session',name:'Band session',started:200,exercises:[],notes:''};
 const result=globalThis.ForgeSync.mergeStates(local,remote,base);
 assert.equal(result.state.active.id,'phone-session');
 assert.ok(result.state.sessionDrafts.some(item=>item.id==='laptop-session'));
 assert.ok(result.conflicts.some(conflict=>conflict.kind==='separate-open-workouts'));
});
