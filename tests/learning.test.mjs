import test from 'node:test';
import assert from 'node:assert/strict';
import {Runner,Learner,rng,C} from '../assets/learning.js';
import {drawRunner} from '../assets/runner-render.js';
import {evaluate} from '../scripts/evaluate-learning.mjs';
test('Q-learning uses terminal reward without bootstrap',()=>{const l=new Learner();l.q.next=[999,999,999];l.update('start',1,-12,'next',true);assert.equal(l.q.start[1],-2.4000000000000004);});
test('real training changes action choices and produces completed collision records',()=>{const random=rng(42),world=new Runner(random),l=new Learner();for(let i=0;i<30000;i++){l.act(world,true,random);if(world.done){l.record(world);world.reset();}}assert.ok(l.updates===30000);assert.ok(l.attempts>30);assert.ok(Object.values(l.q).some(row=>row.some(v=>v!==0)));assert.ok(Object.keys(l.q).some(state=>l.choose(state)!==0));assert.ok(l.history.some(x=>x.passed>0));assert.deepEqual(new Learner(JSON.parse(JSON.stringify(l.snapshot()))).snapshot(),l.snapshot());});
test('frozen showcase never inserts states or updates values',()=>{const l=new Learner(),w=new Runner(rng(9)),before=JSON.stringify(l.snapshot());for(let i=0;i<1000;i++){l.act(w,false);if(w.done)w.reset();}assert.equal(JSON.stringify(l.snapshot()),before);});
test('same collision geometry permits ducking under beam and punishes standing',()=>{function run(action){const w=new Runner();w.obstacles=[{x:110,y:C.GROUND_Y-65,width:65,height:22,type:'beam'}];return w.step(action).done;}assert.equal(run(0),true);assert.equal(run(2),false);});
test('corrupt saved Q data cannot poison decisions',()=>{const l=new Learner({q:{bad:[null,1,2],ok:[1,2,3],huge:[1e100,2,3]},history:[null,{reward:1,score:5,passed:0}],updates:-9});assert.deepEqual(l.q,{ok:[1,2,3]});assert.equal(l.updates,0);assert.equal(l.history.length,1);});
test('drawing the runner cannot advance or mutate simulation state',()=>{
 const world=new Runner(rng(42)),before=JSON.stringify(world);
 const ctx=new Proxy({},{get:()=>()=>{},set:()=>true}),canvas={getContext:()=>ctx};
 for(let n=0;n<5;n++)drawRunner(canvas,world);
 assert.equal(JSON.stringify(world),before);
});
test('evaluation episodes use the same environment regardless of earlier policy lifetime',()=>{
 function sample(extra){const first=[];evaluate({act(world){first.push(world.random());for(let n=0;n<extra;n++)world.random();world.done=true;}},9001);return first;}
 assert.deepEqual(sample(0),sample(7));
});
