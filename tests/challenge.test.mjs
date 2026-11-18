import test from 'node:test';
import assert from 'node:assert/strict';
import {ChallengeWorld,ChallengeLearner,ClonePolicy,ALL_SENSORS,observe,fuse,features,rulePolicy,observationState,demonstrations,trainQ,evaluateChallenge,TRAIN_SEEDS,TEST_SEEDS_V2} from '../assets/challenge-engine.js';
const drain=g=>{let r;do{r=g.next();}while(!r.done);return r.value;};
test('disabled sensors expose null and every policy operates without hidden world access',()=>{
 const a=new ChallengeWorld(42),b=new ChallengeWorld(99,'night'),none={camera:false,lidar:false,imu:false,force:false};b.robot.y=90;b.obstacles=[{x:160,y:200,height:30,width:30,type:'ground'}];
 assert.deepEqual(observe(a,none),observe(b,none));assert.deepEqual(observe(a,none),{camera:null,lidar:null,imu:null,force:null});
 assert.equal(rulePolicy(observe(a,none)),rulePolicy(observe(b,none)));assert.equal(observationState(observe(a,none)),observationState(observe(b,none)));
 const detached=observe(b);b.robot.y=0;assert.notEqual(detached.imu.height,235);assert.doesNotThrow(()=>rulePolicy(structuredClone(detached)));
});
test('light limits camera detection while two lidar rays retain obstacle distance',()=>{
 const w=new ChallengeWorld(1,'night');w.obstacles=[{x:300,y:197,height:38,width:30,type:'ground'}];const o=observe(w);assert.equal(o.camera.type,null);assert.ok(o.lidar.low>0);assert.equal(fuse(o).type,'ground');
 assert.equal(fuse({...o,lidar:null}).distance,null);w.obstacles=[{x:210,y:170,height:22,width:65,type:'beam'}];assert.equal(fuse(observe(w)).type,'beam');
});
test('wet momentum, measured contact, and moving beams alter actual dynamics',()=>{
 const a=new ChallengeWorld(1),b=new ChallengeWorld(1,'wet');a.spawn=b.spawn=99999;for(let i=0;i<10;i++){a.step(0);b.step(0);}assert.ok(b.speed>a.speed);assert.ok(observe(b).imu.slip>0);
 b.step(1);assert.equal(observe(b).force.contact,false);assert.equal(observe(b).force.load,0);assert.ok(observe(b).imu.height>0);
 const moving=new ChallengeWorld(3,'moving');moving.obstacles=[{x:600,y:170,baseY:170,height:22,width:65,type:'beam',moving:true,phase:0}];moving.step();assert.notEqual(moving.obstacles[0].y,170);
});
test('seeded episodes reproduce physics and rendering observation is pure',()=>{
 const a=new ChallengeWorld(9001,'wet'),b=new ChallengeWorld(9001,'wet');for(let i=0;i<100;i++){const before=JSON.stringify(a);observe(a);assert.equal(JSON.stringify(a),before);a.step(rulePolicy(observe(a)));b.step(rulePolicy(observe(b)));}assert.equal(JSON.stringify(a),JSON.stringify(b));
 assert.ok(TRAIN_SEEDS.every(s=>!TEST_SEEDS_V2.includes(s)));
});
test('clone learns a new observation-action mapping, persists independently and generalizes to new seeds',()=>{
 const records=[...demonstrations()].filter((_,i)=>i%3===0),clone=new ClonePolicy();assert.equal(clone.tree,null);clone.fit(records);assert.ok(clone.samples>1000);assert.ok(clone.accuracy>.95);
 const restored=new ClonePolicy(JSON.parse(JSON.stringify(clone.snapshot()))),snapshot=JSON.stringify(restored.snapshot());
 const results=drain(evaluateChallenge({clone:o=>restored.choose(o)},ALL_SENSORS,['clear'],[9001,9002]));assert.ok(results[0].meanPassed>5);assert.equal(JSON.stringify(restored.snapshot()),snapshot);
 const ground=records.find(r=>r.action===1&&restored.choose(r.observation)===1);assert.ok(ground);assert.equal(new ClonePolicy().choose(ground.observation),0);assert.equal(restored.choose(ground.observation),1);
 const altered=records.slice(0,100).map(r=>({...r,action:2})),different=new ClonePolicy();different.fit(altered);assert.equal(different.choose(ground.observation),2);
 assert.equal(new ClonePolicy({tree:{feature:0,threshold:2,left:{}}}).tree,null);assert.equal(features(ground.observation).length,7);
});
test('Q learns without demonstrations, improves from an empty baseline, freezes, and terminal updates reconcile',()=>{
 const q=new ChallengeLearner(),baseline=new ChallengeLearner();drain(trainQ(q,100000,ALL_SENSORS,42));assert.equal(q.updates,100000);assert.ok(q.attempts>100);assert.ok(q.audit.some(x=>x.after!==x.before));
 const before=JSON.stringify(q.snapshot()),results=drain(evaluateChallenge({before:o=>baseline.choose(observationState(o)),after:o=>q.choose(observationState(o))},ALL_SENSORS,['clear'],[9001,9002,9003]));assert.equal(results[0].meanPassed,0);assert.ok(results[1].meanPassed>5);assert.equal(JSON.stringify(q.snapshot()),before);
 const terminal=new ChallengeLearner();terminal.q.next=[999,999,999];terminal.update('start',0,-12,'next',true);assert.ok(Math.abs(terminal.q.start[0]+2.4)<1e-12);assert.equal(terminal.audit[0].terminal,true);
});
test('evaluation records actual collisions and progress under identical seeds without sensor-switch success gates',()=>{
 const config={camera:false,lidar:false,imu:false,force:false};const a=drain(evaluateChallenge({rule:rulePolicy},config,['night'],[9001,9002]));const b=drain(evaluateChallenge({rule:rulePolicy},config,['night'],[9001,9002]));assert.deepEqual(a,b);assert.equal(a[0].successRate,0);assert.equal(a[0].collisions,2);assert.ok(a[0].completion<1);
 const w=new ChallengeWorld(1),r=w.step();assert.equal(r.reward,Object.values(r.events).reduce((a,b)=>a+b,0));assert.equal(w.totalReward,Object.values(w.rewardTotals).reduce((a,b)=>a+b,0));
});
