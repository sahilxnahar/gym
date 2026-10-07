import http from 'node:http';
import './public/training.js';
import { promisify } from 'node:util';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, extname, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const deriveKey = promisify(scrypt);
const hash = v => createHash('sha256').update(v).digest('hex');
const equal = (a,b) => { const aa=Buffer.from(a),bb=Buffer.from(b); return aa.length===bb.length && timingSafeEqual(aa,bb); };
export function validState(s) {
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const string = (value, max, required = false) => typeof value === 'string' && value.length <= max && (!required || value.length > 0);
  const number = (value,min,max) => Number.isFinite(value) && value >= min && value <= max;
  const timestamp = value => number(value,0,8640000000000000);
  const optional = (value,check) => value === undefined || check(value);
  const set = value => object(value) && number(value.reps,0,10000) && number(value.weight,0,10000) && (value.rpe === null || number(value.rpe,0,10)) && typeof value.done === 'boolean' && optional(value.seconds,v=>number(v,0,86400)) && optional(value.distanceKm,v=>number(v,0,1000));
  const exercise = value => object(value) && optional(value.kind,v=>['reps','timed','cardio'].includes(v)) && optional(value.demoKey,v=>['squat','pushup','row','hinge','bridge','deadbug'].includes(v)) && string(value.id,100,true) && string(value.name,200) && string(value.muscle,100) && string(value.equipment,100) && optional(value.notes,v=>string(v,2000)) && Array.isArray(value.sets) && value.sets.length <= 100 && value.sets.every(set);
  const exercises = value => Array.isArray(value) && value.length <= 100 && value.every(exercise);
  const routine = value => object(value) && string(value.id,100,true) && string(value.name,200) && exercises(value.exercises);
  const workout = value => routine(value) && timestamp(value.started) && optional(value.finished,timestamp) && optional(value.restUntil,timestamp) && optional(value.notes,v=>string(v,2000));
  const unique = values => new Set(values.map(value=>value?.id)).size === values.length;
  const profileOK = value => { try {globalThis.ForgeTraining.validateProfile(value); return true} catch {return false} };
  return object(s) && optional(s.profile,profileOK) && optional(s.profilePlanIds,v=>Array.isArray(v)&&v.length<=6&&v.every(id=>string(id,100,true))&&new Set(v).size===v.length) && s.version === 1 && Array.isArray(s.workouts) && s.workouts.length <= 10000 && s.workouts.every(workout) && unique(s.workouts) && Array.isArray(s.routines) && s.routines.length <= 1000 && s.routines.every(routine) && unique(s.routines) && Array.isArray(s.bodyweight) && s.bodyweight.length <= 10000 && s.bodyweight.every(value=>object(value) && string(value.id,100,true) && timestamp(value.date) && number(value.weight,Number.MIN_VALUE,1000)) && unique(s.bodyweight) && (s.active === null || workout(s.active)) && object(s.settings) && ['kg','lb'].includes(s.settings.unit) && number(s.settings.rest,0,600);
}
export function createApp(options = {}) {
  const dataDir = options.dataDir || process.env.DATA_DIR || resolve(root,'data');
  mkdirSync(dataDir,{recursive:true,mode:0o700});
  const db = new DatabaseSync(resolve(dataDir,'forge.sqlite'));
  db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,email TEXT NOT NULL UNIQUE,salt TEXT NOT NULL,password TEXT NOT NULL); CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),expires INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS states(user_id INTEGER PRIMARY KEY REFERENCES users(id),body TEXT NOT NULL);');
  if (!db.prepare('PRAGMA table_info(states)').all().some(column=>column.name==='revision')) db.exec('ALTER TABLE states ADD COLUMN revision INTEGER NOT NULL DEFAULT 0');
  const limits = new Map();
  const setupToken = options.setupToken ?? process.env.SETUP_TOKEN ?? '';
  const production = options.production ?? process.env.NODE_ENV === 'production';
  const appOrigin = options.appOrigin || process.env.APP_ORIGIN;
  if (production) {
    let parsed; try { parsed = new URL(appOrigin); } catch {}
    if (!parsed || parsed.protocol !== 'https:' || parsed.origin !== appOrigin || parsed.username || parsed.password) { db.close(); throw new Error('Production requires APP_ORIGIN as an exact HTTPS origin'); }
  }
  if (setupToken && (setupToken.length < 32 || /replace-with|example|change-me/i.test(setupToken))) { db.close(); throw new Error('SETUP_TOKEN must be at least 32 characters and must not be a placeholder'); }
  function send(res,status,body) { res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'}); res.end(JSON.stringify(body)); }
  async function body(req) { let size=0,parts=[]; for await(const p of req) {size+=p.length;if(size>524288){parts=[];continue;}parts.push(p);} if(size>524288)throw Object.assign(new Error('Request too large'),{status:413}); try{return JSON.parse(Buffer.concat(parts).toString());}catch{throw Object.assign(new Error('Invalid JSON'),{status:400});} }
  function user(req) { const token = /(?:^|;\s*)forge_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie||'')?.[1]; if(!token)return null; return db.prepare('SELECT users.id,users.email FROM sessions JOIN users ON users.id=sessions.user_id WHERE token=? AND expires>?').get(hash(token),Date.now()); }
  function session(res,id) { const token=randomBytes(32).toString('hex');db.prepare('DELETE FROM sessions WHERE expires<=?').run(Date.now());db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(token),id,Date.now()+7*86400000);res.setHeader('Set-Cookie',`forge_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${production?'; Secure':''}`); }
  const server = http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','SAMEORIGIN');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'; frame-src 'self'; form-action 'self'");
    if(production)res.setHeader('Strict-Transport-Security','max-age=31536000');
    try {
      const pathname = new URL(req.url,'http://localhost').pathname;
      if(pathname==='/health' && req.method==='GET')return send(res,200,{ok:true});
      if(pathname.startsWith('/api/')) {
        if(!['GET','POST','PUT'].includes(req.method))return send(res,405,{error:'Method not allowed'});
        if(req.method!=='GET') {
          const origin = req.headers.origin;
          const expected = appOrigin || `${production?'https':'http'}://${req.headers.host}`;
          if(!origin || origin!==expected)return send(res,403,{error:'Origin not allowed'});
          if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return send(res,415,{error:'Use application/json'});
        }
        if(pathname==='/api/auth/register' || pathname==='/api/auth/login') {
          if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
          const key=req.socket.remoteAddress;const now=Date.now();const slot=limits.get(key)||{count:0,until:now+900000};if(slot.until<now){slot.count=0;slot.until=now+900000;}slot.count++;limits.set(key,slot);if(limits.size>10000)for(const [k,v]of limits)if(v.until<now)limits.delete(k);if(slot.count>20)return send(res,429,{error:'Too many attempts. Try again in 15 minutes.'});
          const input=await body(req);const email=typeof input?.email==='string'?input.email.trim().toLowerCase():'';const password=input?.password;
          if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||typeof password!=='string'||password.length<12||password.length>128)return send(res,400,{error:'Use a valid email and a password of 12–128 characters.'});
          if(pathname.endsWith('/register')) {
            if(!setupToken || !equal(req.headers['x-setup-token']||'',setupToken))return send(res,403,{error:'Valid setup token required'});
            if(db.prepare('SELECT id FROM users LIMIT 1').get())return send(res,409,{error:'Owner account already exists'});
            const salt=randomBytes(16).toString('hex');const passwordHash=(await deriveKey(password,salt,64)).toString('hex');if(db.prepare('SELECT id FROM users LIMIT 1').get())return send(res,409,{error:'Owner account already exists'});const result=db.prepare('INSERT INTO users(email,salt,password) VALUES(?,?,?)').run(email,salt,passwordHash);session(res,Number(result.lastInsertRowid));return send(res,201,{user:{id:Number(result.lastInsertRowid),email}});
          }
          const owner=db.prepare('SELECT * FROM users WHERE email=?').get(email);const computed=(await deriveKey(password,owner?.salt||'00000000000000000000000000000000',64)).toString('hex');if(!owner||!equal(computed,owner.password))return send(res,401,{error:'Invalid email or password'});session(res,owner.id);return send(res,200,{user:{id:owner.id,email:owner.email}});
        }
        const owner=user(req);if(!owner)return send(res,401,{error:'Sign in required'});
        if(pathname==='/api/auth/me'&&req.method==='GET')return send(res,200,{user:owner});
        if(pathname==='/api/auth/logout'&&req.method==='POST') { const token=/(?:^|;\s*)forge_session=([a-f0-9]{64})/.exec(req.headers.cookie||'')?.[1];if(token)db.prepare('DELETE FROM sessions WHERE token=?').run(hash(token));res.setHeader('Set-Cookie',`forge_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${production?'; Secure':''}`);return send(res,200,{ok:true}); }
        if(pathname==='/api/state'&&req.method==='GET') {const row=db.prepare('SELECT body,revision FROM states WHERE user_id=?').get(owner.id);return send(res,200,{state:row?JSON.parse(row.body):null,revision:row?.revision||0});}
        if(pathname==='/api/state'&&req.method==='PUT') {const input=await body(req);if(!validState(input?.state))return send(res,400,{error:'Invalid workout state schema'});if(!Number.isSafeInteger(input.revision)||input.revision<0)return send(res,400,{error:'Valid state revision required'});const result=db.prepare('INSERT INTO states(user_id,body,revision) SELECT ?,?,1 WHERE ?=0 OR EXISTS(SELECT 1 FROM states WHERE user_id=?) ON CONFLICT(user_id) DO UPDATE SET body=excluded.body,revision=states.revision+1 WHERE states.revision=?').run(owner.id,JSON.stringify(input.state),input.revision,owner.id,input.revision);if(!result.changes){const row=db.prepare('SELECT revision FROM states WHERE user_id=?').get(owner.id);return send(res,409,{error:'Cloud data changed. Reload before saving.',revision:row?.revision||0});}return send(res,200,{ok:true,revision:input.revision+1});}
        return send(res,404,{error:'Not found'});
      }
      if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,{error:'Method not allowed'});
      const publicDir=resolve(root,'public');const file=resolve(publicDir,'.'+decodeURIComponent(pathname==='/'?'/index.html':pathname));if(!file.startsWith(publicDir+'/'))return send(res,403,{error:'Forbidden'});
      let payload;try {if(!statSync(file).isFile())throw Error();payload=readFileSync(file);}catch{return send(res,404,{error:'Not found'});}
      const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.gif':'image/gif','.ico':'image/x-icon'};
      res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-cache');res.writeHead(200);res.end(req.method==='HEAD'?undefined:payload);
    } catch(error) {send(res,error.status||500,{error:error.status?error.message:'Internal server error'});}
  });
  server.on('close',()=>db.close());return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {const server=createApp();server.listen(Number(process.env.PORT)||3000,process.env.HOST||'0.0.0.0',()=>console.log(`Forge running on port ${server.address().port}`));}
