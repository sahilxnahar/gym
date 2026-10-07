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
test('AGPL source and exact OpenGym adaptation are visible to contributors',()=>{
 const html=read('../public/index.html'),readme=read('../README.md'),notice=read('../OPEN_GYM_ATTRIBUTION.md'),license=read('../LICENSE');
 assert.match(html,/Source code/);assert.match(readme,/AGPL-3\.0-only/);assert.match(notice,/active-workout-order\.js/);assert.match(notice,/media|image/i);assert.match(license,/GNU AFFERO GENERAL PUBLIC LICENSE/i);
});
