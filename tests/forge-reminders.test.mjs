import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/forge-reminders.js';

const model=globalThis.ForgeReminders;

test('reminders default off and validate a timezone-aware user schedule',()=>{
 const schedule=model.defaults('UTC');
 assert.equal(model.validSchedule(schedule),true);assert.equal(schedule.water.enabled,false);assert.equal(schedule.walking.enabled,false);assert.equal(schedule.homeWorkout.enabled,false);
 schedule.supplements.push({id:'creatine',label:'My label',time:'08:15',days:[1,2,3,4,5],enabled:true});
 assert.equal(model.validSchedule(schedule),true);
});

test('invalid time zones, intervals, days and unbounded supplement labels are rejected',()=>{
 const invalid=structuredClone(model.defaults('UTC'));invalid.timeZone='Not/A_Zone';assert.equal(model.validSchedule(invalid),false);
 const interval=structuredClone(model.defaults('UTC'));interval.water.intervalMinutes=5;assert.equal(model.validSchedule(interval),false);
 const day=structuredClone(model.defaults('UTC'));day.walking.days=[1,1];assert.equal(model.validSchedule(day),false);
 const label=structuredClone(model.defaults('UTC'));label.supplements=[{id:'one',label:'x'.repeat(81),time:'09:00',days:[1],enabled:true}];assert.equal(model.validSchedule(label),false);
});

test('home workout prompts are opt-in, actionable, timezone-aware and quiet-hour safe',()=>{
 const schedule=model.defaults('UTC');schedule.homeWorkout={enabled:true,time:'17:30',days:[3]};
 assert.equal(model.validSchedule(schedule),true);
 const due=model.dueOccurrences(schedule,new Date('2026-10-07T17:30:20Z'));
 assert.deepEqual(due.map(item=>item.kind),['home-workout']);
 assert.match(due[0].body,/chair sit-to-stands.*incline push-ups.*glute bridges/);
 assert.deepEqual(model.dueOccurrences(schedule,new Date('2026-10-08T17:30:20Z')),[]);
 const quiet=structuredClone(schedule);quiet.homeWorkout.time='22:00';
 assert.deepEqual(model.dueOccurrences(quiet,new Date('2026-10-07T22:00:20Z')),[]);
 const legacy=structuredClone(schedule);delete legacy.homeWorkout;
 assert.equal(model.validSchedule(legacy),true);
 assert.deepEqual(model.dueOccurrences(legacy,new Date('2026-10-07T17:30:20Z')),[]);
 const invalid=structuredClone(schedule);invalid.homeWorkout.time='25:99';assert.equal(model.validSchedule(invalid),false);
});

test('water reminders are due only at chosen intervals and never during quiet hours',()=>{
 const schedule=model.defaults('UTC');schedule.water={enabled:true,intervalMinutes:120,start:'09:00',end:'19:00',days:[0,1,2,3,4,5,6]};
 assert.deepEqual(model.dueOccurrences(schedule,new Date('2026-10-07T09:00:20Z')).map(item=>item.kind),['water']);
 assert.deepEqual(model.dueOccurrences(schedule,new Date('2026-10-07T10:00:20Z')),[]);
 assert.deepEqual(model.dueOccurrences(schedule,new Date('2026-10-07T22:00:20Z')),[]);
});

test('walking and supplement notifications use generic lock-screen text',()=>{
 const schedule=model.defaults('UTC');schedule.walking={enabled:true,intervalMinutes:60,start:'10:00',end:'19:00',days:[3]};
 schedule.supplements=[{id:'iron-label',label:'My private supplement',time:'10:00',days:[3],enabled:true}];
 const due=model.dueOccurrences(schedule,new Date('2026-10-07T10:00:05Z'));
 assert.deepEqual(due.map(item=>item.kind).sort(),['supplement','walking']);
 assert.ok(due.every(item=>!item.body.includes('My private supplement')));
});

test('schedule honors local time in the selected time zone',()=>{
 const schedule=model.defaults('America/Los_Angeles');schedule.water={enabled:true,intervalMinutes:60,start:'09:00',end:'19:00',days:[3]};
 const due=model.dueOccurrences(schedule,new Date('2026-10-07T16:00:00Z'));
 assert.equal(due[0]?.occurrence.endsWith('09:00'),true);
});
