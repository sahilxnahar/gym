import test from 'node:test';
import assert from 'node:assert/strict';
import {validState} from '../server.mjs';

const base=()=>({version:1,workouts:[],routines:[],bodyweight:[],active:null,settings:{unit:'kg',rest:90}});
const exercise=(id,sg)=>({id,name:'Band row',muscle:'Back',equipment:'Resistance band',notes:'',...(sg?{sg}:{}),sets:[{reps:10,weight:0,rpe:null,done:false}]});

test('server accepts valid extended profiles, themes and adjacent superset labels',()=>{
 const state=base();state.settings.theme='charcoal';state.profile={version:1,ageGroup:'75+',weightKg:null,heightCm:null,goal:'fitness',experience:'beginner',days:7,minutes:90,equipment:['bodyweight','bands'],impact:'low',limitations:'',bodyFocus:'balanced',supersets:true};
 state.routines=[{id:'routine1',name:'Band pair',exercises:[exercise('row','group_A'),exercise('press','group_A')]}];
 state.active={id:'active1',name:'Band day',started:Date.now(),notes:'',exercises:[exercise('row','group_A'),exercise('press','group_A')],restUntil:0};
 assert.equal(validState(state),true);
});

test('server rejects malformed superset ids and unsupported themes',()=>{
 const state=base();state.active={id:'active1',name:'Test',started:Date.now(),notes:'',exercises:[exercise('row','<script>')],restUntil:0};
 assert.equal(validState(state),false);
 const badTheme=base();badTheme.settings.theme='neon';assert.equal(validState(badTheme),false);
 const badProfile=base();badProfile.profile={version:1,ageGroup:'12-17',weightKg:null,heightCm:null,goal:'fitness',experience:'beginner',days:3,minutes:30,equipment:['bands'],impact:'low',limitations:'',bodyFocus:'balanced'};assert.equal(validState(badProfile),false);
});
