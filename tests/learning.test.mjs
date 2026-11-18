import test from 'node:test';
import assert from 'node:assert/strict';
import {Runner,Learner,rng,C} from '../assets/learning.js';
import {drawRunner} from '../assets/runner-render.js';
import {evaluate} from '../scripts/evaluate-learning.mjs';
import {comparePolicies,TEST_SEEDS} from '../assets/evaluation.js';
import {REWARDS} from '../assets/learning.js';
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

test('waiting earns nothing, obstacle clearance earns once, terminal collision never repeats reward',()=>{
 const w=new Runner(rng(1));assert.equal(w.step(0).reward,0);
 w.obstacles=[{x:30,y:C.GROUND_Y-28,width:30,height:28,type:'ground',passed:false}];
 assert.equal(w.step(0).events.pass,REWARDS.pass);assert.equal(w.step(0).events.pass,0);assert.equal(w.passed,1);
 w.obstacles=[{x:110,y:C.GROUND_Y-28,width:30,height:28,type:'ground'}];
 assert.equal(w.step(0).reward,REWARDS.collision);const before=w.totalReward;assert.equal(w.step(1).reward,0);assert.equal(w.totalReward,before);
});
test('completion bonus requires surviving the final frame and reward components reconcile',()=>{
 const w=new Runner(rng(1));w.ticks=1799;const r=w.step(1);assert.equal(w.success,true);assert.equal(r.events.complete,REWARDS.complete);assert.equal(r.events.action,REWARDS.jump);
 assert.ok(Math.abs(Object.values(w.rewardTotals).reduce((a,b)=>a+b)-w.totalReward)<1e-9);
 const failed=new Runner(rng(1));failed.ticks=1799;failed.obstacles=[{x:105,y:C.GROUND_Y-28,width:30,height:28,type:'ground'}];
 const collision=failed.step(0);assert.equal(failed.success,false);assert.equal(collision.events.complete,0);assert.equal(collision.events.collision,REWARDS.collision);
});
test('only completed episodes can be recorded, and the same episode cannot be counted twice',()=>{
 const l=new Learner(),w=new Runner(rng(3));l.record(w);assert.equal(l.attempts,0);
 while(!w.done)l.act(w,true,rng(2));l.record(w);l.record(w);assert.equal(l.attempts,1);assert.equal(l.history.length,1);assert.equal(l.history[0].rewardVersion,2);
});
test('audit records the actual Bellman update and baseline owns a copy of imported progress',()=>{
 const l=new Learner({q:{start:[0,1,0]},updates:7});l.q.next=[2,4,1];
 l.update('start',1,8,'next',false);const a=l.audit.at(-1);assert.equal(a.before,1);assert.equal(a.after,1+.2*(8+.95*4-1));assert.equal(a.update,8);
 assert.deepEqual(l.baseline.q,{start:[0,1,0]});assert.equal(l.baseline.updates,7);
 const restored=new Learner(JSON.parse(JSON.stringify(l.snapshot())));assert.deepEqual(restored.snapshot(),l.snapshot());
});
function drain(iterator){let result;do{result=iterator.next();}while(!result.done);return result.value;}
test('paired evaluation is deterministic, uses the saved starting policy, and cannot change learning data',()=>{
 const l=new Learner(),before=JSON.stringify(l.snapshot()),one=drain(comparePolicies(l)),two=drain(comparePolicies(l));
 assert.deepEqual(one,two);assert.deepEqual(one.before,one.after);assert.deepEqual(one.before.seeds,TEST_SEEDS);assert.equal(JSON.stringify(l.snapshot()),before);assert.equal(one.after.successRate,0);
});
test('three independently trained Q policies improve against their actual empty baselines on 20 frozen runs',()=>{
 for(const seed of [17,42,2026]){const l=new Learner(),random=rng(seed),w=new Runner(random);
  for(let i=0;i<100000;i++){l.act(w,true,random);if(w.done){l.record(w);w.reset();}}
  const before=JSON.stringify(l.snapshot()),result=drain(comparePolicies(l));assert.equal(result.before.meanPassed,0);assert.ok(result.after.meanPassed>=10,JSON.stringify({seed,result}));assert.ok(result.after.successRate>=50);assert.equal(JSON.stringify(l.snapshot()),before);
 }
});
test('manual subframes keep exactly the same geometry and physics as the four-frame learner step',()=>{
 const a=new Runner(rng(9)),b=new Runner(rng(9));
 for(let i=0;i<70;i++){a.step(0);for(let n=0;n<4;n++)b.step(0,1);assert.deepEqual(a.robot,b.robot);assert.deepEqual(a.obstacles,b.obstacles);assert.equal(a.ticks,b.ticks);}
});
test('evaluation episodes use the same environment regardless of earlier policy lifetime',()=>{
 function sample(extra){const first=[];evaluate({act(world){first.push(world.random());for(let n=0;n<extra;n++)world.random();world.done=true;}},9001);return first;}
 assert.deepEqual(sample(0),sample(7));
});
