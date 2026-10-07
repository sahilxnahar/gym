import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const data=new Map();
const localStorage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,String(value)),removeItem:key=>data.delete(key)};
const context=vm.createContext({localStorage});
vm.runInContext(readFileSync(new URL('../public/forge-tools.js',import.meta.url),'utf8'),context);
const tools=context.ForgeTools;

test('BMI calculation converts kg/cm correctly and rejects invalid inputs',()=>{
 assert.equal(tools.calculateBmi(68,170),23.5);assert.equal(tools.calculateBmi(0,170),null);assert.equal(tools.calculateBmi(68,0),null);assert.equal(tools.calculateBmi(NaN,170),null);
});
test('adult BMI categories handle the documented cutoffs',()=>{
 const category=value=>tools.adultBmiCategory(value)?.key;
 assert.equal(category(18.4),'lower');assert.equal(category(18.5),'healthy');assert.equal(category(24.9),'healthy');
 assert.equal(category(25),'higher');assert.equal(category(30),'class1');assert.equal(category(35),'class2');assert.equal(category(40),'class3');assert.equal(category(-1),undefined);
});
test('BMI suggestions remain neutral and never promise weight or workout outcomes',()=>{
 const note=tools.bmiNote(tools.adultBmiCategory(33));
 assert.match(note,/screening measure, not a diagnosis/i);assert.match(note,/will not set a target weight/i);assert.match(note,/will not.*change your workout/i);
 assert.match(tools.bmiNote(tools.adultBmiCategory(17)),/health professional/i);
});
test('cardio suggestions support validated activities, minutes and easy pacing',()=>{
 const idea=tools.cardioIdeas('walking',15,'easy');assert.equal(idea.title,'Walking');assert.equal(idea.minutes,15);assert.match(idea.pace,/talk comfortably/i);
 assert.equal(tools.cardioIdeas('walking',0,'easy'),null);assert.equal(tools.cardioIdeas('unknown',15,'easy'),null);assert.equal(tools.cardioIdeas('cycling',15,'hard'),null);
});
test('food preferences remain in a separate localStorage key and can be erased',()=>{
 assert.deepEqual(JSON.parse(JSON.stringify(tools.getDietPreferences())),{pattern:'none',note:''});
 assert.equal(tools.saveDietPreferences({pattern:'vegan',note:'No dairy'}),true);
 assert.deepEqual(JSON.parse(JSON.stringify(tools.getDietPreferences())),{pattern:'vegan',note:'No dairy'});
 assert.ok([...data.keys()].every(key=>key==='forge-diet-preferences-v1'));
 assert.equal(tools.saveDietPreferences({pattern:'unknown',note:'x'}),false);
 assert.equal(tools.clearDietPreferences(),true);assert.deepEqual(JSON.parse(JSON.stringify(tools.getDietPreferences())),{pattern:'none',note:''});
});
