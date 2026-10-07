import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
test('catalogue bootstrap merges instructions without mutating frozen training records',()=>{
 const context=vm.createContext({});
 for(const file of ['training.js','exercise-library.js'])vm.runInContext(readFileSync(new URL('../public/'+file,import.meta.url),'utf8'),context);
 const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 vm.runInContext(app.slice(0,app.indexOf('const demoNames=')),context);
 assert.ok(vm.runInContext('catalog.length > 1300',context));
 assert.ok(vm.runInContext("catalog.find(e=>e.name==='Incline push-up').instructions.length > 0",context));
 assert.equal(vm.runInContext("catalog.find(e=>e.name==='Plank').kind",context),'timed');
 assert.ok(vm.runInContext("Object.isFrozen(ForgeTraining.exercises[0])",context));
});
