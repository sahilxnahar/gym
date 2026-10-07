import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../public/forge-superset.js',import.meta.url),'utf8');
const context=vm.createContext({});vm.runInContext(source,context);
const order=context.ForgeSupersetOrder;

test('paired movements form one unit and receive readable labels',()=>{
 const exercises=[{id:'a'},{id:'b',sg:'A'},{id:'c',sg:'A'},{id:'d'},{id:'e',sg:'B'},{id:'f',sg:'B'}];
 assert.deepEqual(JSON.parse(JSON.stringify(order.supersetUnits(exercises))),[[0],[1,2],[3],[4,5]]);
 assert.equal(order.partnerIndex(exercises,1),2);assert.equal(order.partnerIndex(exercises,2),1);
 assert.equal(order.labelFor(exercises,1),'A');assert.equal(order.labelFor(exercises,5),'B');
});
test('moving a superset moves both exercises together and preserves the selected cursor',()=>{
 const active={cur:1,exercises:[{id:'a'},{id:'b',sg:'pair'},{id:'c',sg:'pair'},{id:'d'}]};
 assert.equal(order.canMoveUnit(active,2,1),true);assert.deepEqual(JSON.parse(JSON.stringify(order.moveUnit(active,2,1))),{indices:[0,3,1,2]});
 assert.deepEqual(active.exercises.map(item=>item.id),['a','d','b','c']);assert.equal(active.cur,3);
 assert.equal(order.canMoveUnit(active,3,1),false);assert.equal(order.moveUnit(active,3,1),null);
});
test('users can pair adjacent exercises and unpair by toggling the same control',()=>{
 const exercises=[{id:'one'},{id:'two'},{id:'three'}];
 assert.equal(order.pairNext(exercises,0,'SG_A1'),true);assert.equal(exercises[0].sg,'SG_A1');assert.equal(exercises[1].sg,'SG_A1');
 assert.equal(order.pairNext(exercises,0,'SG_A1'),true);assert.equal(exercises[0].sg,undefined);assert.equal(exercises[1].sg,undefined);
 assert.equal(order.pairNext(exercises,2,'SG_BAD'),false);assert.equal(order.pairNext(exercises,1,'has spaces'),false);
});
test('invalid and separated superset tags are discarded safely',()=>{
 const exercises=[{id:'one',sg:'bad'},{id:'two'},{id:'three',sg:'bad'}];
 assert.deepEqual(JSON.parse(JSON.stringify(order.normalizePairs(exercises))),['bad']);
 assert.ok(exercises.every(item=>!item.sg));
});
test('the shared helper identifies the verified OpenGym source and AGPL terms',()=>{
 assert.match(source,/frontend\/src\/lib\/active-workout-order\.js/);
 assert.match(source,/frontend\/src\/lib\/history\.js/);
 assert.match(source,/GNU AGPL v3\.0/);
 assert.match(source,/31c6795b40fb54130192b5016d7dc29e9f457d30/);
});
