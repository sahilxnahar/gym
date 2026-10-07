import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp, validState } from '../server.mjs';

const fixture=()=>({version:1,workouts:[{id:'workout1',name:'Strength',started:Date.now(),notes:'',exercises:[{id:'squat',name:'Squat',muscle:'Legs',equipment:'Barbell',notes:'',sets:[{reps:5,weight:80,rpe:8,done:true}]}]}],routines:[],bodyweight:[],active:null,settings:{unit:'kg',rest:90}});

test('owner lifecycle, CSRF protection, private state, and persistence',async()=>{
 const dataDir=mkdtempSync(join(tmpdir(),'forge-'));
 let app=createApp({dataDir,setupToken:'test-secret-token-with-at-least-32-characters',production:false});
 await new Promise(r=>app.listen(0,'127.0.0.1',r));
 let origin=`http://127.0.0.1:${app.address().port}`;
 const call=(path,method='GET',data,cookie,extra={})=>fetch(origin+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...extra},...(data?{body:JSON.stringify(data)}:{})});
 try {
  assert.equal((await call('/api/state')).status,401);
  assert.equal((await call('/api/auth/register','POST',{email:'a@example.com',password:'long-password123'})).status,403);
  assert.equal((await call('/api/auth/register','POST',{email:'a@example.com',password:'long-password123'},null,{'x-setup-token':'test-secret-token-with-at-least-32-characters',Origin:'https://evil.example'})).status,403);
  const registration=await call('/api/auth/register','POST',{email:'a@example.com',password:'long-password123'},null,{'x-setup-token':'test-secret-token-with-at-least-32-characters'});
  assert.equal(registration.status,201);let cookie=registration.headers.get('set-cookie').split(';')[0];assert.match(registration.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);
  assert.equal((await call('/api/auth/register','POST',{email:'b@example.com',password:'long-password123'},null,{'x-setup-token':'test-secret-token-with-at-least-32-characters'})).status,409);
  assert.equal((await call('/api/state','PUT',{state:[]},cookie)).status,400);
  assert.equal((await call('/api/state','PUT',{state:fixture(),revision:0},cookie)).status,200);
  assert.equal((await call('/api/state','PUT',{state:fixture(),revision:0},cookie)).status,409);
  assert.equal((await (await call('/api/state','GET',null,cookie)).json()).state.workouts[0].exercises[0].sets[0].weight,80);
  assert.equal((await call('/api/auth/logout','POST',{},cookie)).status,200);
  assert.equal((await call('/api/auth/me','GET',null,cookie)).status,401);
  assert.equal((await call('/api/auth/login','POST',{email:'a@example.com',password:'wrong-password123'})).status,401);
  await new Promise(r=>app.close(r));app=createApp({dataDir,production:false});await new Promise(r=>app.listen(0,'127.0.0.1',r));origin=`http://127.0.0.1:${app.address().port}`;
  const login=await call('/api/auth/login','POST',{email:'a@example.com',password:'long-password123'});assert.equal(login.status,200);cookie=login.headers.get('set-cookie').split(';')[0];assert.equal((await (await call('/api/state','GET',null,cookie)).json()).state.workouts[0].exercises[0].sets[0].weight,80);
  const staticResponse=await call('/');assert.equal(staticResponse.headers.get('x-content-type-options'),'nosniff');assert.match(staticResponse.headers.get('content-security-policy'),/frame-ancestors 'self'/);
 }finally {await new Promise(r=>app.close(r));rmSync(dataDir,{recursive:true,force:true});}
});

test('production session cookie is Secure and auth limits attempts',async()=>{
 const dataDir=mkdtempSync(join(tmpdir(),'forge-'));const app=createApp({dataDir,setupToken:'another-secret-token-with-at-least-32-characters',production:true,appOrigin:'https://forge.example'});await new Promise(r=>app.listen(0,'127.0.0.1',r));
 const url=`http://127.0.0.1:${app.address().port}`;
 const request=(path,data)=>fetch(url+path,{method:'POST',headers:{Origin:'https://forge.example','Content-Type':'application/json','x-setup-token':'another-secret-token-with-at-least-32-characters'},body:JSON.stringify(data)});
 try {const res=await request('/api/auth/register',{email:'owner@example.com',password:'long-password123'});assert.equal(res.status,201);assert.match(res.headers.get('set-cookie'),/; Secure/);for(let i=0;i<19;i++)await request('/api/auth/login',{email:'bad',password:'bad'});assert.equal((await request('/api/auth/login',{email:'bad',password:'bad'})).status,429);}finally{await new Promise(r=>app.close(r));rmSync(dataDir,{recursive:true,force:true});}
});

test('production configuration fails closed',()=>{
 const dataDir=mkdtempSync(join(tmpdir(),'forge-'));
 try {
  assert.throws(()=>createApp({dataDir,production:true}),/APP_ORIGIN/);
  assert.throws(()=>createApp({dataDir,production:true,appOrigin:'http://example.com'}),/APP_ORIGIN/);
  assert.throws(()=>createApp({dataDir,production:true,appOrigin:'https://example.com/',setupToken:'x'.repeat(32)}),/APP_ORIGIN/);
  assert.throws(()=>createApp({dataDir,production:false,setupToken:'short'}),/SETUP_TOKEN/);
  assert.throws(()=>createApp({dataDir,production:false,setupToken:'replace-with-at-least-32-random-characters'}),/SETUP_TOKEN/);
 } finally {rmSync(dataDir,{recursive:true,force:true});}
});

test('malformed and oversized request bodies fail safely',async()=>{
 const dataDir=mkdtempSync(join(tmpdir(),'forge-'));const app=createApp({dataDir,setupToken:'a'.repeat(32),production:false});await new Promise(r=>app.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${app.address().port}`;
 const headers={Origin:origin,'Content-Type':'application/json','x-setup-token':'a'.repeat(32)};
 try {
  assert.equal((await fetch(origin+'/health')).status,200);
  assert.equal((await fetch(origin+'/api/auth/register',{method:'POST',headers,body:'{bad'})).status,400);
  const reg=await fetch(origin+'/api/auth/register',{method:'POST',headers,body:JSON.stringify({email:'owner@example.com',password:'long-password123'})});assert.equal(reg.status,201);headers.Cookie=reg.headers.get('set-cookie').split(';')[0];
  assert.equal((await fetch(origin+'/api/state',{method:'PUT',headers,body:'{bad'})).status,400);
  assert.equal((await fetch(origin+'/api/state',{method:'PUT',headers,body:JSON.stringify({state:{text:'x'.repeat(4*1024*1024+1)}})})).status,413);
  assert.equal((await fetch(origin+'/api/state',{method:'PUT',headers,body:JSON.stringify({state:null})})).status,400);
  const invalid=fixture();invalid.workouts[0].exercises[0].sets[0].done='yes';
  assert.equal((await fetch(origin+'/api/state',{method:'PUT',headers,body:JSON.stringify({state:invalid,revision:0})})).status,400);
  assert.equal((await (await fetch(origin+'/api/state',{headers})).json()).state,null);
 } finally {await new Promise(r=>app.close(r));rmSync(dataDir,{recursive:true,force:true});}
});


test('state validator bounds nested values and supports active sessions and routines',()=>{
 const state=fixture();state.active=structuredClone(state.workouts[0]);state.active.restUntil=0;state.routines=[{id:'routine1',name:'Push',exercises:structuredClone(state.active.exercises)}];state.bodyweight=[{id:'weight1',date:Date.now(),weight:72}];assert.equal(validState(state),true);
 const bad = mutation => {const copy=structuredClone(state);mutation(copy);assert.equal(validState(copy),false);};
 bad(s=>s.version=2);bad(s=>s.settings.rest=601);bad(s=>s.settings.unit='stone');bad(s=>s.active.started=-1);bad(s=>s.workouts[0].finished=Infinity);bad(s=>s.routines[0].name='x'.repeat(201));bad(s=>s.bodyweight[0].weight=0);bad(s=>s.active.notes='x'.repeat(2001));bad(s=>s.active.exercises[0].id='');bad(s=>s.active.exercises[0].sets[0].rpe=11);bad(s=>s.active.exercises[0].sets[0].weight=NaN);bad(s=>s.active.exercises[0].sets[0].reps=-1);bad(s=>s.active.exercises[0].sets[0].done=1);bad(s=>s.active.exercises[0].sets=Array(101).fill(s.active.exercises[0].sets[0]));
});

test('personalized profiles and typed activity fields are validated and survive authenticated storage',async()=>{
 const dataDir=mkdtempSync(join(tmpdir(),'forge-v2-'));const app=createApp({dataDir,setupToken:'q'.repeat(32),production:false});await new Promise(r=>app.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${app.address().port}`;
 const headers={Origin:origin,'Content-Type':'application/json','x-setup-token':'q'.repeat(32)};
 const profile={version:1,ageGroup:'adult',weightKg:75,heightCm:175,goal:'muscle',experience:'beginner',days:3,minutes:30,equipment:'bodyweight',impact:'low',limitations:'',bodyFocus:'balanced'};
 const state=fixture();state.profile=profile;const ex=state.workouts[0].exercises[0];ex.kind='cardio';ex.demoKey='squat';ex.sets[0].seconds=600;ex.sets[0].distanceKm=1.5;
 assert.equal(validState(state),true);
 const bad=structuredClone(state);bad.profile.goal='invalid';assert.equal(validState(bad),false);
 const invalidSeconds=structuredClone(state);invalidSeconds.workouts[0].exercises[0].sets[0].seconds=-1;assert.equal(validState(invalidSeconds),false);
 const invalidDemo=structuredClone(state);invalidDemo.workouts[0].exercises[0].demoKey='../../secret';assert.equal(validState(invalidDemo),false);
 try{const registration=await fetch(origin+'/api/auth/register',{method:'POST',headers,body:JSON.stringify({email:'v2@example.com',password:'strong-test-password12'})});assert.equal(registration.status,201);headers.Cookie=registration.headers.get('set-cookie').split(';')[0];
 assert.equal((await fetch(origin+'/api/state',{method:'PUT',headers,body:JSON.stringify({state,revision:0})})).status,200);
 const stored=await(await fetch(origin+'/api/state',{headers})).json();assert.deepEqual(stored.state.profile,profile);assert.equal(stored.state.workouts[0].exercises[0].sets[0].seconds,600);
 const gif=await fetch(origin+'/demos/squat.gif');assert.equal(gif.status,200);assert.equal(gif.headers.get('Content-Type'),'image/gif');assert.match(Buffer.from(await gif.arrayBuffer()).toString('ascii',0,6),/^GIF8[79]a$/);
 }finally{await new Promise(r=>app.close(r));rmSync(dataDir,{recursive:true,force:true});}
});
