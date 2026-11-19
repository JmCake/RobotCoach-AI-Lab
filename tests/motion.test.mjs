import test from 'node:test';
import assert from 'node:assert/strict';
import {MotionWorld,DT,SCENES} from '../assets/motion/world.js';
import {makePose} from '../assets/motion/rig.js';
const run=(options,seconds=20)=>{const w=new MotionWorld({...options,repeat:false});for(let i=0;i<seconds/DT;i++)w.step();return w;};

test('normal running alternates contacts, preserves planted feet and is deterministic',()=>{
  const w=new MotionWorld({seed:0});const contacts=new Set();
  for(let i=0;i<1200;i++){
    const feet=[...w.footX],was=[...w.contacts];w.step();contacts.add(w.contacts.join(','));
    for(let j=0;j<2;j++)if(was[j]&&w.contacts[j])assert.ok(Math.abs(w.footX[j]-feet[j])<1e-9);
  }
  assert.ok(contacts.has('true,false')&&contacts.has('false,true'));
  assert.equal(w.falls,0);assert.ok(w.x>45);
  const a=run({scene:'rough',seed:42,assist:false}),b=run({scene:'rough',seed:42,assist:false});
  assert.deepEqual(a.history,b.history);assert.equal(a.x,b.x);
  assert.notEqual(new MotionWorld({scene:'rough',seed:43}).height(12),a.height(12));
});

test('terrain forces produce continuous stumble, fall, hold and repeated attempts',()=>{
  const w=new MotionWorld({scene:'wet',assist:false});let previous=makePose(w),maxStep=0;
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
  const w=new MotionWorld({scene:'wet'});for(let i=0;i<480;i++)w.step();assert.ok(w.control.target<3);
  w.assist=false;w.step();assert.equal(w.observation.imu,null);assert.equal(w.observation.contact,null);assert.equal(w.control.torque,0);assert.equal(w.control.target,5.6);
  const fallen=run({scene:'wet',assist:false});fallen.assist=true;fallen.step();assert.equal(fallen.state,'fallen');
});

test('jumping and crouching clear actual geometry; weak light has delayed detection and collision position',()=>{
  const w=new MotionWorld({scene:'obstacles'});let jumped=false,ducked=false,maxStep=0,previous=makePose(w);
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
    const w=new MotionWorld({scene});prepare(w);
    const before=w.observe(),control=w.decide(before);w.sensors[sensor]=false;
    const after=w.observe(),changed=w.decide(after);
    assert.equal(after[sensor==='force'?'contact':sensor],null,sensor);
    assert.notEqual(control[field],changed[field],`${sensor} must affect ${field}`);
    for(const other of Object.keys(w.sensors).filter(k=>k!==sensor))assert.equal(w.sensors[other],true);
  }
  // A camera alone retains short, delayed sight; ranging works when the camera is off.
  const camera=new MotionWorld({scene:'night',sensors:{camera:true,lidar:false,imu:false,force:false}});
  assert.equal(camera.observation.range,1.05);assert.equal(camera.observation.lidar,null);
  const lidar=new MotionWorld({scene:'night',sensors:{camera:false,lidar:true,imu:false,force:false}});
  lidar.x=10;assert.equal(lidar.observe().source,'激光测距');assert.equal(lidar.observe().camera,null);
});

test('all six environments and several seeds remain finite through repeated falls and recovery',()=>{
  for(const scene of Object.keys(SCENES))for(const seed of [0,17,2026])for(const assist of [false,true]){
    const w=new MotionWorld({scene,seed,assist,target:8});
    for(let i=0;i<3600;i++){
      w.step();if(i%12!==0)continue;
      const p=makePose(w);
      for(const v of [w.x,w.theta,w.speed,p.head.x,p.head.h,...p.legs.flatMap(l=>[l.knee.x,l.knee.h,l.ankle.x,l.ankle.h])])assert.ok(Number.isFinite(v),`${scene} ${seed}`);
      assert.ok(w.speed>=0&&w.speed<=8.01);
    }
  }
});
