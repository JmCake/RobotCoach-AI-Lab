import assert from 'node:assert/strict';
import {test} from 'node:test';
import {MOTION_ACTION} from '../assets/motion/world.js';
import {
  CONDITIONS,DECISION_STEPS,LESSON_SEED,ShortCourse,TEST_SEEDS,TRAIN_SEEDS,VALIDATION_SEEDS,ruleAction,
} from '../assets/motion/short-course.js';
import {MotionTrainer,compareFrozen,createModel,readModel} from '../assets/motion/short-learning.js';

const {forward,jump,duck}=MOTION_ACTION;

test('policies see only installed sensor observations; forward never gets automatic obstacle actions',()=>{
  const noSensors={camera:false,lidar:false,imu:false,force:false};
  const blind=new ShortCourse(LESSON_SEED,{sensors:noSensors});
  while(!blind.finished)blind.advance(observation=>{
    assert.deepEqual(observation,{time:observation.time,obstacle:null,speed:null,support:null});
    return forward;
  });
  assert.equal(blind.world.jumpCount,0);
  assert.equal(blind.world.crouch,0);
  assert.equal(blind.result().success,false);
  assert.equal(blind.result().rewards.failure,-12);
  const sighted=new ShortCourse(LESSON_SEED);
  let source;
  while(!sighted.finished)sighted.advance(observation=>{
    source??=observation.obstacle?.source;
    return forward;
  });
  assert.equal(source,'lidar');
  assert.equal(sighted.world.jumpCount,0);
  assert.equal(sighted.result().reason,'小腿撞上矮栏');
  assert.equal(sighted.result().passed,0);
});

test('one jump pulse and sustained duck use the physical actuator; the rule reference uses the same decisions',()=>{
  const course=new ShortCourse(LESSON_SEED);
  const first=course.advance(()=>jump);
  assert.equal(first.rejected,false);
  assert.equal(course.world.jumpCount,1);
  assert.equal(course.world.y>0,true);
  assert.ok(Math.abs(course.world.time-DECISION_STEPS/CONDITIONS.physicsHz)<1e-9);
  assert.equal(course.advance(()=>jump).rejected,true);
  assert.equal(course.world.jumpCount,1);
  const duckOnly=new ShortCourse(LESSON_SEED);
  duckOnly.advance(()=>duck);
  const held=duckOnly.world.crouch;
  duckOnly.advance(()=>forward);
  assert.ok(held>.5&&duckOnly.world.crouch<held);
  const rule=new ShortCourse(LESSON_SEED);
  while(!rule.finished)rule.advance(ruleAction);
  assert.equal(rule.result().success,true);
  assert.equal(rule.result().passed,3);
  assert.equal(rule.result().rewards.finish,4);
  assert.ok(rule.result().rewards.action<0);
});

test('Bellman updates change the table and frozen evaluation leaves it byte-for-byte unchanged',()=>{
  const trainer=new MotionTrainer(createModel(42));
  while(trainer.learner.attempts<20)trainer.advance();
  const model=trainer.snapshot();
  assert.equal(model.attempts,20);
  assert.ok(model.updates>20);
  assert.ok(Object.values(model.q).some(row=>row.some(value=>value!==0)));
  const last=model.audit.at(-1);
  assert.equal(last.terminal,true);
  assert.ok(Math.abs(last.after-(last.before+.2*(last.reward-last.before)))<1e-9);
  const snapshot=JSON.stringify(model);
  const seeds=VALIDATION_SEEDS.slice(0,3),iterator=compareFrozen(model,seeds);
  let item;
  do{item=iterator.next();}while(!item.done);
  assert.deepEqual(item.value.before.runs.map(run=>run.seed),seeds);
  assert.deepEqual(item.value.after.runs.map(run=>run.seed),seeds);
  assert.equal(JSON.stringify(model),snapshot);
  const restored=new MotionTrainer(readModel(snapshot));
  assert.deepEqual(restored.snapshot(),model);
  assert.equal(readModel(JSON.stringify({...model,version:0})).updates,0);
  assert.equal(readModel(JSON.stringify({q:model.q,updates:9000})).updates,0);
  assert.equal(new Set([...TRAIN_SEEDS,...VALIDATION_SEEDS,...TEST_SEEDS]).size,70);
});
