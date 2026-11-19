import test from 'node:test';
import assert from 'node:assert/strict';
import {MotionWorld,DT,SCENES} from '../assets/motion/world.js';
import {makePose} from '../assets/motion/rig.js';
import {explainFall} from '../assets/motion/fall-feedback.js';
const createPhysicsWorld=(options={})=>new MotionWorld({target:5.6,distance:Infinity,...options});
const run=(options,seconds=20)=>{const w=createPhysicsWorld({...options,repeat:false});for(let i=0;i<seconds/DT;i++)w.step();return w;};

test('normal running alternates contacts, preserves planted feet and is deterministic',()=>{
  const w=createPhysicsWorld({seed:0});const contacts=new Set();
  for(let i=0;i<1200;i++){
    const feet=[...w.footX],was=[...w.contacts];w.step();contacts.add(w.contacts.join(','));
    for(let j=0;j<2;j++)if(was[j]&&w.contacts[j])assert.ok(Math.abs(w.footX[j]-feet[j])<1e-9);
  }
  assert.ok(contacts.has('true,false')&&contacts.has('false,true'));
  assert.equal(w.falls,0);assert.ok(w.x>45);
  const a=run({scene:'rough',seed:42,assist:false}),b=run({scene:'rough',seed:42,assist:false});
  assert.deepEqual(a.history,b.history);assert.equal(a.x,b.x);
  assert.notEqual(createPhysicsWorld({scene:'rough',seed:43}).height(12),a.height(12));
});

test('terrain forces produce continuous stumble, fall, hold and repeated attempts',()=>{
  const w=createPhysicsWorld({scene:'wet',assist:false});let previous=makePose(w),maxStep=0;
  for(let i=0;i<3600;i++){
    w.step();const pose=makePose(w);
    for(let j=0;j<2;j++)for(const part of ['ankle','knee'])maxStep=Math.max(maxStep,Math.hypot(pose.legs[j][part].x-previous.legs[j][part].x,pose.legs[j][part].h-previous.legs[j][part].h));
    previous=pose;
  }
  const states=w.history.map(x=>x.state);
  for(const state of ['unbalanced','stumbling','falling','fallen','recovering'])assert.ok(states.includes(state),state);
  assert.ok(w.falls>=2);assert.ok(maxStep<.23,`unexpected ankle discontinuity: ${maxStep}`);
  const stop=run({scene:'wet',assist:false});assert.equal(stop.state,'fallen');assert.equal(stop.falls,1);
});

test('assist changes measured feedback and controls, not an outcome flag',()=>{
  for(const scene of ['curve','wet','rough','night']){
    const off=run({scene,assist:false}),on=run({scene,assist:true});
    assert.ok(off.falls>on.falls,scene);assert.ok(on.x>off.x,scene);
  }
  assert.equal(run({scene:'straight',assist:false}).falls,0);
  // Disabling mid-run removes the actual feedback immediately; enabling at a terminal state cannot unfall it.
  const w=createPhysicsWorld({scene:'wet'});for(let i=0;i<480;i++)w.step();assert.ok(w.control.target<3);
  w.assist=false;w.step();assert.equal(w.observation.imu,null);assert.equal(w.observation.contact,null);assert.equal(w.control.torque,0);assert.equal(w.control.target,5.6);
  const fallen=run({scene:'wet',assist:false});fallen.assist=true;fallen.step();assert.equal(fallen.state,'fallen');
});

test('jumping and crouching clear actual geometry; weak light has delayed detection and collision position',()=>{
  const w=createPhysicsWorld({scene:'obstacles'});let jumped=false,ducked=false,maxStep=0,previous=makePose(w);
  for(let i=0;i<1800;i++){
    w.step();jumped||=w.y>.2;ducked||=w.crouch>.8;const p=makePose(w);
    if(w.crouch>.98&&w.y===0)assert.ok(p.head.h+.23<1.23,'rendered crouch must fit beneath the collision beam');
    for(let j=0;j<2;j++)maxStep=Math.max(maxStep,Math.hypot(p.legs[j].ankle.x-previous.legs[j].ankle.x,p.legs[j].ankle.h-previous.legs[j].ankle.h));previous=p;
  }
  assert.ok(jumped&&ducked);assert.ok(w.passed>4);assert.equal(w.falls,0);assert.ok(maxStep<.23);
  const night=run({scene:'night',assist:false});assert.equal(night.collision.part,'小腿');assert.ok(night.cause.includes('矮栏'));
  assert.equal(night.observation.imu,null);assert.equal(night.observation.range,0);
});

test('four sensors independently remove their observation and the matching control input',()=>{
  const cases=[
    {sensor:'camera',scene:'wet',prepare:w=>{w.x=10;w.speed=5;},field:'target'},
    {sensor:'lidar',scene:'night',prepare:w=>{w.x=10;w.speed=5;},field:'jump'},
    {sensor:'imu',scene:'wet',prepare:w=>{w.theta=.2;w.omega=.1;},field:'torque'},
    {sensor:'force',scene:'rough',prepare:w=>{w.contactHeight=[.12,0];w.slip=.5;},field:'placement'}
  ];
  for(const {sensor,scene,prepare,field} of cases){
    const w=createPhysicsWorld({scene});prepare(w);
    const before=w.observe(),control=w.decide(before);w.sensors[sensor]=false;
    const after=w.observe(),changed=w.decide(after);
    assert.equal(after[sensor==='force'?'contact':sensor],null,sensor);
    assert.notEqual(control[field],changed[field],`${sensor} must affect ${field}`);
    for(const other of Object.keys(w.sensors).filter(k=>k!==sensor))assert.equal(w.sensors[other],true);
  }
  // A camera alone retains short, delayed sight; ranging works when the camera is off.
  const camera=createPhysicsWorld({scene:'night',sensors:{camera:true,lidar:false,imu:false,force:false}});
  assert.equal(camera.observation.range,1.05);assert.equal(camera.observation.lidar,null);
  const lidar=createPhysicsWorld({scene:'night',sensors:{camera:false,lidar:true,imu:false,force:false}});
  lidar.x=10;assert.equal(lidar.observe().source,'激光测距');assert.equal(lidar.observe().camera,null);
});

test('fall clues describe actual cause and sensing gaps without naming the answer',()=>{
  const wet=run({scene:'wet',assist:false});assert.ok(wet.fallFeedback.cause.includes('滑移'));assert.ok(wet.fallFeedback.text.includes('脚底'));
  const clue=structuredClone(wet.fallFeedback);wet.assist=true;wet.step();assert.deepEqual(wet.fallFeedback,clue,'a later toggle must not rewrite why the fall happened');
  const night=run({scene:'night',sensors:{camera:true,lidar:false,imu:false,force:false}});
  assert.ok(night.fallFeedback.text.includes('太暗'));assert.equal(night.fallFeedback.sensors.camera,true);
  assert.ok(run({scene:'rough',assist:false}).fallFeedback.text.includes('落点'));
  assert.ok(run({scene:'curve',assist:false}).fallFeedback.text.includes('拐弯'));
  assert.equal(createPhysicsWorld().fallFeedback,null);
  const all={camera:true,lidar:true,imu:true,force:true};
  const sensed=explainFall({cause:'足部滑移',sensors:all});assert.ok(sensed.includes('察觉'));assert.ok(!sensed.includes('没察觉'));
  const posture=explainFall({cause:'足部滑移',sensors:{...all,imu:false}});assert.ok(posture.includes('歪了多少'));
  const phrases=[clue.text,night.fallFeedback.text,sensed,posture,explainFall({cause:'头部碰到横梁',sensors:{camera:false,lidar:false}})];
  for(const text of phrases)assert.doesNotMatch(text,/传感器|摄像头|激光|IMU|足底力觉|开启|安装|模块/);
  // Repeated falls get separate episodes; prose generation must not consume physics randomness.
  const repeat=createPhysicsWorld({scene:'wet',assist:false});for(let i=0;i<3600;i++)repeat.step();assert.ok(repeat.fallFeedback.id>=2);
});

test('all six environments and several seeds remain finite through repeated falls and recovery',()=>{
  for(const scene of Object.keys(SCENES))for(const seed of [0,17,2026])for(const assist of [false,true]){
    const w=createPhysicsWorld({scene,seed,assist,target:8});
    for(let i=0;i<3600;i++){
      w.step();if(i%12!==0)continue;
      const p=makePose(w);
      for(const v of [w.x,w.theta,w.speed,p.head.x,p.head.h,...p.legs.flatMap(l=>[l.knee.x,l.knee.h,l.ankle.x,l.ankle.h])])assert.ok(Number.isFinite(v),`${scene} ${seed}`);
      assert.ok(w.speed>=0&&w.speed<=8.01);
    }
  }
});

test('the 40 m finish requires a clean geometric crossing and the result is immutable while slowing down',()=>{
  const w=new MotionWorld({assist:false});assert.equal(w.target,6.4);assert.equal(w.finishX,40);
  while(w.x<39)w.step();assert.equal(w.result,null);assert.equal(w.finishFeedback,null);
  while(!w.done)w.step();assert.equal(w.result.success,true);assert.ok(w.x>=40);assert.equal(w.result.distance,40);assert.ok(w.finishFeedback.text.includes('终点'));
  const result=structuredClone(w.result);for(let i=0;i<600;i++)w.step();assert.deepEqual(w.result,result);assert.ok(w.speed<.05);
  // An IMU may prevent a fall after impact; that still must not qualify as a clean run.
  const hit=new MotionWorld({scene:'obstacles',sensors:{camera:false,lidar:false,imu:true,force:false},repeat:false});
  for(let i=0;i<3600&&!hit.done&&!hit.falls;i++)hit.step();assert.ok(hit.result);assert.equal(hit.result.success,false);assert.ok(hit.result.collisions>0);
  const drift=new MotionWorld({scene:'curve',sensors:{camera:false,lidar:false,imu:true,force:false},repeat:false});
  for(let i=0;i<3600&&!drift.done&&!drift.falls;i++)drift.step();assert.equal(drift.result?.success,false);assert.equal(drift.result.offTrack,true);
});

test('recommended progressive configurations pass; removing foot feedback makes rough landings buckle',()=>{
  for(const [scene,config] of Object.entries(SCENES))for(const seed of [1,7,17,42,2026]){
    const sensors=Object.fromEntries(['camera','lidar','imu','force'].map(k=>[k,config.recommended.includes(k)]));
    const w=new MotionWorld({scene,seed,sensors,repeat:false});
    for(let i=0;i<3600&&!w.done&&!w.falls;i++)w.step();assert.equal(w.result?.success,true,`${scene} ${seed}`);
    if(scene==='rough'){
      const noFeet=new MotionWorld({scene,seed,sensors:{...sensors,force:false},repeat:false});
      for(let i=0;i<3600&&!noFeet.done&&!noFeet.falls;i++)noFeet.step();
      assert.ok(noFeet.falls>0);assert.ok(noFeet.compression>.31);assert.ok(noFeet.fallFeedback.cause.includes('高度差'));
    }
  }
  // Slow visual anticipation is a valid alternative on a wet straight; no sensor count gate.
  const cautious=new MotionWorld({scene:'wet',sensors:{camera:true,lidar:false,imu:false,force:false},repeat:false});
  for(let i=0;i<3600&&!cautious.done&&!cautious.falls;i++)cautious.step();assert.equal(cautious.result?.success,true);
});

test('a hurdle is cleared before uncontrolled landing pitch causes a fall; IMU counters the same impulse',()=>{
  for(const scene of ['obstacles','night'])for(const seed of [1,7,17,42,2026]){
    const sensors={camera:true,lidar:scene==='night',imu:false,force:false};
    const off=new MotionWorld({scene,seed,sensors,repeat:false}),on=new MotionWorld({scene,seed,sensors:{...sensors,imu:true},repeat:false});
    while(!off.landings&&!off.falls)off.step();while(!on.landings&&!on.falls)on.step();
    assert.equal(off.landings,1);assert.equal(on.landings,1);assert.equal(off.collisions,0);assert.ok(off.lastLanding.cleared);
    assert.equal(off.lastLanding.impulse,on.lastLanding.impulse);assert.equal(off.lastLanding.x,on.lastLanding.x);
    assert.ok(Math.abs(off.theta)>Math.abs(on.theta));assert.equal(off.falls,0,'fall must happen after landing, not at takeoff');
    for(let i=0;i<3600&&!off.falls&&!off.done;i++)off.step();
    assert.equal(off.falls,1);assert.ok(off.time>off.lastLanding.time);assert.ok(off.passed>=1);assert.equal(off.collisions,0);
    assert.ok(off.fallFeedback.text.includes('我跳过去了'));assert.ok(off.fallFeedback.cause.includes('落地'));
    for(let i=0;i<3600&&!on.done&&!on.falls;i++)on.step();assert.equal(on.result?.success,true);assert.equal(on.falls,0);
  }
  // Changing feedback during the motion changes the actual recovery, not an outcome flag.
  const rescue=new MotionWorld({scene:'obstacles',sensors:{camera:true,lidar:false,imu:false,force:false},repeat:false});
  while(!rescue.landings)rescue.step();rescue.sensors.imu=true;
  for(let i=0;i<3600&&!rescue.done&&!rescue.falls;i++)rescue.step();assert.equal(rescue.result?.success,true);
});
