import assert from 'node:assert/strict';
import {test} from 'node:test';
import {DT,MOTION_ACTION,MotionWorld} from '../assets/motion/world.js';
import {FinalTrack,createFinalTrack} from '../assets/motion/final-track.js';
import {FinalRace,RACE_LEARNED,RACE_RULE,raceStrategy} from '../assets/motion/final-race.js';
import {CONDITIONS,DECISION_STEPS} from '../assets/motion/short-course.js';
import {createModel} from '../assets/motion/short-learning.js';
import {isReplayableRace,raceFrameView} from '../assets/motion/race-record.js';
import {trackPoint,trialBend,arcCurvature} from '../assets/motion/track-arc.js';
import {makePose} from '../assets/motion/rig.js';

const sensors=CONDITIONS.sensors;
const rule=raceStrategy(RACE_RULE);
const run=options=>{
  const race=new FinalRace(options);
  while(!race.ended)race.step();
  return race;
};

test('stadium lanes share one centre and join both straights tangentially',()=>{
  for(const bend of [trialBend,createFinalTrack().curve]){
    const radius=bend.length/Math.PI,end=bend.start+bend.length;
    for(const offset of [-3.6,0,3.6]){
      for(let i=0;i<=20;i++){
        const p=trackPoint(bend,bend.start+bend.length*i/20,offset);
        assert.ok(Math.abs(Math.hypot(p.x-bend.start,p.z-radius)-(radius-offset))<1e-8);
      }
      const entry=trackPoint(bend,bend.start-.01,offset),exit=trackPoint(bend,end+.01,offset);
      assert.ok(Math.abs(entry.z-offset)<1e-8&&Math.abs(exit.z-(2*radius-offset))<1e-8);
      assert.equal(entry.cos,1);
      assert.equal(exit.cos,-1);
    }
    assert.equal(arcCurvature(bend,bend.start-1),0);
    assert.equal(arcCurvature(bend,end),0);
    assert.ok(Math.abs(arcCurvature(bend,end-1)-1/radius)<1e-10);
  }
});

test('the continuous surface is sampled at the obstacle and at each support position',()=>{
  const definition=createFinalTrack(),track=new FinalTrack(definition);
  assert.deepEqual(definition.segments.map(x=>x.id),['straight','obstacles','night','curve','rough','wet']);
  for(const {start} of definition.segments.slice(1)){
    for(const sample of ['height','center','curvature','friction','lightAt']){
      assert.ok(Math.abs(track[sample](start-.0001)-track[sample](start+.0001))<.001,sample);
    }
  }
  const world=new MotionWorld({track,sensors,repeat:false,distance:definition.distance});
  world.x=definition.segments[1].start-.1;
  assert.equal(world.scene,'straight');
  assert.equal(world.observe().lidar.obstacle.type,'hurdle');
  const previousSample=world.visualHistory.at(-1);
  const night=definition.segments[2],wet=definition.segments[5];
  world.x=night.start+5;
  world.time+=DT;
  assert.equal(world.observe().camera.range,1.05);
  assert.ok(world.visualHistory.includes(previousSample));
  world.x=wet.start+4;
  world.footX=[wet.start-.1,world.x];
  world.contacts=[true,false];
  assert.equal(world.supportFriction(),definition.friction.dry);
  world.contacts=[true,true];
  assert.equal(world.supportFriction(),(track.friction(world.footX[0])+track.friction(world.footX[1]))/2);
});

test('a rule race goes through six segments with one pose, clock and action cadence',()=>{
  const race=run({sensors,strategy:rule});
  const {record,world}=race;
  assert.equal(record.score.outcome,'finished');
  assert.equal(record.score.distance,190);
  assert.equal(record.score.passed,6);
  assert.equal(record.score.collisions,0);
  assert.equal(record.score.time,record.score.tick*DT);
  assert.equal(world.attempt,1);
  const segments=record.events.filter(event=>event.type==='segment');
  assert.deepEqual(segments.map(event=>event.segment),record.track.segments.map(x=>x.id));
  for(const event of segments.slice(1)){
    const left=raceFrameView(record,event.tick-1),right=raceFrameView(record,event.tick);
    assert.ok(right.x>left.x&&right.x-left.x<.1);
    assert.ok(right.phase>left.phase&&right.phase-left.phase<.1);
    assert.ok(left.speed>2&&Math.abs(right.speed-left.speed)<.1);
    assert.ok(Math.abs(right.theta-left.theta)<.1);
  }
  assert.ok(record.decisions.every((decision,i)=>decision.tick===i*DECISION_STEPS));
  const sensedAcross=record.decisions.find(decision=>decision.segment==='straight'&&decision.observation.obstacle?.type==='hurdle');
  assert.ok(sensedAcross);
  assert.ok(record.presentation.tick>record.score.tick);
  assert.equal(record.frames.length,record.presentation.tick+1);
  assert.ok(isReplayableRace(JSON.parse(JSON.stringify(record))));
  const end=raceFrameView(record,record.presentation.tick);
  const difference=Math.abs(makePose(end).hip.h-makePose(world).hip.h);
  assert.ok(difference<.00001);
  assert.ok(end.speed<.04);
  assert.deepEqual(run({sensors,strategy:rule}).record.events,record.events);
});

test('an actual collision latches its score before the fall and a retry is deterministic',()=>{
  const camera={camera:true,lidar:false,imu:false,force:false};
  const {record}=run({sensors:camera,strategy:rule});
  const {score,presentation}=record;
  assert.ok(isReplayableRace(JSON.parse(JSON.stringify(record))));
  assert.equal(score.outcome,'failed');
  assert.equal(score.reason,'小腿撞上矮栏');
  assert.equal(score.collisions,1);
  const hit=record.events.find(event=>event.type==='collision');
  assert.equal(hit.tick,score.tick);
  assert.equal(hit.x,score.distance);
  assert.ok(presentation.tick>score.tick);
  assert.equal(presentation.displayState,'fallen');
  const fallen=raceFrameView(record,presentation.tick);
  assert.ok(fallen.x>score.distance);
  assert.ok(makePose(fallen).fall>.99);
  const retried=run({sensors:camera,strategy:rule}).record;
  assert.deepEqual(retried.score,score);
  assert.deepEqual(retried.events,record.events);
  assert.deepEqual(retried.frames,record.frames);
});

test('a compatible frozen policy has no hidden rule fallback and exit does not invent a failure',()=>{
  const model=createModel();
  model.q={'none,0,0,1':[1,0,0]};
  model.updates=1;
  assert.equal(raceStrategy(RACE_LEARNED,JSON.stringify({q:model.q,updates:10})),null);
  const strategy=raceStrategy(RACE_LEARNED,JSON.stringify(model));
  const race=new FinalRace({sensors,strategy});
  const snapshot=JSON.stringify(race.record.strategy);
  strategy.model.q['none,0,0,1'][0]=-3;
  while(!race.ended)race.step();
  assert.equal(JSON.stringify(race.record.strategy),snapshot);
  assert.equal(race.score.reason,'小腿撞上矮栏');
  assert.ok(race.record.decisions.every(decision=>decision.action===MOTION_ACTION.forward&&!decision.control.jump&&!decision.control.duck));
  const stopped=new FinalRace({sensors,strategy:rule});
  for(let i=0;i<31;i++)stopped.step();
  stopped.exit();
  assert.equal(stopped.score.outcome,'aborted');
  assert.equal(stopped.score.reason,null);
  assert.equal(stopped.record.presentation.status,'interrupted');
  stopped.step();
  assert.equal(stopped.record.frames.length,32);
  assert.ok(isReplayableRace(JSON.parse(JSON.stringify(stopped.record))));
});

test('the replay rejects incompatible and damaged records before opening them',()=>{
  const race=new FinalRace({sensors,strategy:rule});
  race.step();
  race.exit();
  const record=race.record;
  const damage=[
    copy=>copy.version++,
    copy=>copy.track.rough=null,
    copy=>copy.frameFields.reverse(),
    copy=>copy.frames.pop(),
    copy=>copy.frames[1][0]=2,
    copy=>copy.frames[0][copy.frameFields.indexOf('footX')]=[0,null],
    copy=>copy.events[0]={type:'segment',tick:100,time:100*DT,segment:'wet'},
  ];
  for(const corrupt of damage){
    const copy=structuredClone(record);
    corrupt(copy);
    assert.equal(isReplayableRace(copy),false,corrupt.toString());
  }
});
