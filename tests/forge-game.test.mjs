import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/training.js';
import '../public/forge-progress.js';
import '../public/forge-game.js';

const game=globalThis.ForgeGame;
const makeExercise=item=>({...item,notes:item.notes||'',sets:[{reps:8,weight:0,rpe:null,done:false}]});

test('quick-workout choices cover no-equipment, band and walking sessions',()=>{
 const ids=new Set(game.quickWorkouts.map(item=>item.id));
 assert.ok(ids.has('spark-3'));assert.ok(ids.has('band-7'));assert.ok(ids.has('walk-8'));
 const catalog=globalThis.ForgeTraining.exercises;
 const band=game.createQuickWorkout('band-7',catalog,makeExercise);
 assert.equal(band.exercises.length,3);assert.ok(band.exercises.every(item=>item.equipment==='Resistance band'&&item.sets.length===1));
 const walk=game.createQuickWorkout('walk-8',catalog,makeExercise);
 assert.equal(walk.exercises[0].kind,'cardio');assert.equal(walk.exercises[0].sets[0].seconds,480);
});

test('fantasy progression is optional and earned rewards are derived from logged work',()=>{
  const state={version:1,workouts:[],settings:{adventureMode:true}};
  assert.match(game.render(state),/Ground-Up Builder/);assert.equal(game.snapshot(state).level,1);
  const finished=Array.from({length:13},(_,i)=>({id:'w'+i,name:'Workout',started:i*100000,finished:i*100000+50000,exercises:[]}));
  const progressed=game.snapshot({...state,workouts:finished});
  assert.ok(progressed.level>=2);assert.ok(progressed.rewards.length>=1);assert.match(game.renderMap({...state,workouts:finished}),/rewards/i);
 assert.match(game.render({...state,workouts:finished}),/<progress value="1040" max="2000"/);
 assert.equal(game.render({...state,settings:{adventureMode:false}}),'');
});
