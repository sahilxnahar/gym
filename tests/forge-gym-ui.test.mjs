import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('the Forge wordmark is centered and the Tools tab is reachable in the app shell',()=>{
 const html=read('../public/index.html'),app=read('../public/app.js'),css=read('../public/forge-extras.css');
 assert.match(html,/<a class="top-brand"[^>]*>.*FORGE/s);assert.match(html,/name="theme-color"/);
 assert.match(app,/\['tools','⚒','Tools'\]/);assert.match(css,/\.top-brand\{grid-column:2/);
});
test('age, goal, duration, equipment, body focus and superset settings are offered',()=>{
 const app=read('../public/app.js'),training=read('../public/training.js');
 for(const value of ['under18','18-39','40-64','65-74','75+','bands','endurance','bodyFocus','supersets','90'])assert.ok(app.includes(value)||training.includes(value),`missing ${value}`);
 assert.match(training,/ageGroup: \['under18', '18-39', '40-64', '65-74', '75\+'/);
 assert.match(training,/input\.days < 1 \|\| input\.days > 7/);assert.match(training,/15, 20, 30, 45, 60, 75, 90/);
 assert.match(app,/data-action="open-movement-library"/);assert.match(app,/forgeOpenBandLibrary=true/);
 assert.match(app,/If you use account sync, it is sent to the app owner; do not enter private medical details/);
});
test('BMI is optional, explicitly adult-gated and separated from load planning',()=>{
 const app=read('../public/app.js'),tools=read('../public/forge-tools.js');
 assert.match(app,/I am 20 or older/);assert.match(app,/weightKg=Number\(\$\('#bmi-weight'\)\.value\)/);
 assert.match(tools,/adultBmiCategory/);assert.match(tools,/will not set a target weight or change your workout/);
 assert.match(trainingSource(),/Bodyweight and height are not used to choose your exercise weight/);
});
function trainingSource(){return read('../public/training.js')}
test('diet notes are device-only by default and require explicit account-sync consent',()=>{
 const app=read('../public/app.js'),tools=read('../public/forge-tools.js'),enhancements=read('../public/forge-enhancements.js');
 assert.match(app,/stay on this device by default and are not included in backups/);assert.match(enhancements,/device-only by default/);assert.match(enhancements,/If you opt in, the current dietary pattern and free-text note sync/);assert.match(tools,/forge-diet-preferences-v1/);
});
test('all new interactive assets load locally and are included in offline precache',()=>{
 const html=read('../public/index.html'),app=read('../public/app.js'),sw=read('../public/sw.js'),audit=read('../scripts/verify-media.mjs');
 for(const path of ['/forge-tools.js','/forge-superset.js','/forge-extras.css']){assert.ok(html.includes(path),`shell missing ${path}`);assert.ok(sw.includes(`'${path}'`),`offline cache missing ${path}`);}
 const band='/equipment/resistance-band-set.svg';assert.ok(app.includes(band),'Tools page does not render the local band illustration');assert.ok(sw.includes(`'${band}'`),'offline cache missing the band illustration');
 assert.match(audit,/forge-superset\.js/);assert.match(audit,/resistance-band-set\.svg/);
});
test('the Training Ledger logo is used consistently across app, install icons and offline cache',()=>{
 const html=read('../public/index.html'),icon=read('../public/icon.svg'),sw=read('../public/sw.js'),manifest=JSON.parse(read('../public/manifest.webmanifest'));
 assert.match(icon,/aria-label="Forge Training Ledger"/);assert.ok(icon.includes('M31 98V24h49'),'app icon is missing the selected ledger mark');assert.ok(icon.includes('M78 79l8 8 17-21'),'app icon is missing the ember completion mark');
 assert.match(html,/href="\/icon\.svg"/);assert.deepEqual(manifest.icons.map(item=>item.src),['/icon-192.png','/icon-512.png']);assert.match(sw,/forge-v15-all-movement-previews/);
  for(const path of ['/icon.svg','/icon-192.png','/icon-512.png'])assert.ok(sw.includes(`'${path}'`),`offline cache missing ${path}`);
  for(const [file,size] of [['icon-192.png',192],['icon-512.png',512]]){const png=readFileSync(new URL(`../public/${file}`,import.meta.url));assert.equal(png.readUInt32BE(16),size,`${file} width`);assert.equal(png.readUInt32BE(20),size,`${file} height`);}
});
test('AGPL source and exact OpenGym adaptation are visible to contributors',()=>{
 const html=read('../public/index.html'),readme=read('../README.md'),notice=read('../OPEN_GYM_ATTRIBUTION.md'),license=read('../LICENSE');
 assert.match(html,/Source code/);assert.match(readme,/AGPL-3\.0-only/);assert.match(notice,/active-workout-order\.js/);assert.match(notice,/media|image/i);assert.match(license,/GNU AFFERO GENERAL PUBLIC LICENSE/i);
});

test('Home offers no-gym sessions with local previews and reduced-motion stills',()=>{
 const enhancements=read('../public/forge-enhancements.js'),sw=read('../public/sw.js'),manifest=JSON.parse(read('../public/media-manifest.json'));
 assert.match(enhancements,/AT HOME · BODYWEIGHT · BANDS/);
 assert.match(enhancements,/A small home workout still counts/);
 assert.match(enhancements,/Set a home-workout reminder/);
 assert.match(enhancements,/forge-home-workout-enabled/);
 assert.ok(enhancements.includes("cfg.homeWorkout = { enabled: $('#forge-home-workout-enabled').checked"),'Home reminder form does not save its chosen schedule');
 assert.ok(enhancements.includes("if (action === 'open-reminders') { app.setPage('tools');"),'Home reminder shortcut does not open Tools');
 assert.match(enhancements,/prefers-reduced-motion: reduce/);
 assert.match(enhancements,/\/demos\/previews\/\$\{key\}-preview\.gif/);
 assert.match(enhancements,/\/demos\/\$\{key\}\.png/);
 assert.match(sw,/forge-v15-all-movement-previews/);
 assert.ok(sw.includes("const DEMOS=['squat','pushup','row','hinge','bridge','deadbug'].flatMap(key=>['gif','png'].map(ext=>'/demos/'+key+'.'+ext))"),'Full GIF/still guide list is not cached offline');
 assert.ok(sw.includes("const PREVIEW_GIFS=['squat','pushup','row','hinge','bridge','deadbug'].map(key=>'/demos/previews/'+key+'-preview.gif')"),'Small Home previews are not cached offline');
 assert.ok(sw.includes('...DEMOS,...PREVIEW_GIFS,...FONT_ASSETS'),'Preview list is not in the offline app shell');
 for(const key of ['squat','pushup','row','hinge','bridge','deadbug']){
  assert.ok(enhancements.includes(`key: '${key}'`),`${key} movement is missing from the Home gallery`);
  assert.ok(manifest.gifs.some(item=>item.file===`/demos/${key}.gif`),`${key} GIF missing from media manifest`);
  assert.ok(manifest.previewGifs.some(item=>item.file===`/demos/previews/${key}-preview.gif`),`${key} small preview GIF missing from media manifest`);
  assert.ok(manifest.previewGifs.find(item=>item.file===`/demos/previews/${key}-preview.gif`).bytes<120000,`${key} preview is not lightweight`);
  assert.ok(manifest.stillFrames.some(item=>item.file===`/demos/${key}.png`),`${key} still missing from media manifest`);
 }
});
