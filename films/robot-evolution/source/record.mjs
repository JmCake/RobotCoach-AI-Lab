// Extract the observations used in the film directly from the classroom simulations.
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {MotionWorld} from '../../../assets/motion/world.js';
import {MotionTrainer, compareFrozen, createModel, freezePolicy} from '../../../assets/motion/short-learning.js';
import {REWARD, ShortCourse, TEST_SEEDS, observationState} from '../../../assets/motion/short-course.js';

const round = value => Number(value.toFixed(3));
const kit = count => Object.fromEntries(['camera','imu','lidar','force'].map((name,i)=>[name,i<count]));

function hardwareTrial(scene, count, seed) {
  const world = new MotionWorld({scene, seed, sensors:kit(count), repeat:false});
  const events = {};
  while (!world.result && world.time < 25) {
    const sample = world.observation;
    const jumps = world.jumpCount;
    world.step();
    for (const name of ['camera','lidar']) {
      if (!events[name] && sample[name]?.obstacle)
        events[name] = {distance:round(sample[name].obstacle.distance), time:round(world.time)};
    }
    if (!events.jump && jumps < world.jumpCount)
      events.jump = {distance:round(sample.obstacle.distance), time:round(world.time)};
  }
  assert.ok(world.result);
  return {success:world.result.success, distance:round(world.result.distance), events};
}

function runFrozen(model, seed) {
  const episode = new ShortCourse(seed);
  const policy = freezePolicy(model);
  const events = [];
  while (!episode.finished) {
    const passed = episode.world.passed;
    const jumps = episode.world.jumpCount;
    const step = episode.advance(policy);
    const detected = step.observation.obstacle;
    if (detected && (episode.world.jumpCount > jumps ||
        (step.action === 2 && !events.some(e=>e.kind==='duck')) || episode.world.passed > passed))
      events.push({kind:episode.world.passed>passed?'pass':step.action===1?'jump':'duck',
        obstacle:detected.type, distance:round(detected.distance), state:observationState(step.observation),
        time:round(step.observation.time)});
  }
  return {seed, obstacles:episode.world.obstacles.map(o=>({type:o.type,x:round(o.x)})),
    passed:episode.world.passed, success:episode.result().success, events};
}

const trials={};
for (const [scene,counts] of Object.entries({curve:[1,2],night:[2,3],rough:[3,4],wet:[3,4]})) {
  trials[scene]=counts.map(count=>({count, ...hardwareTrial(scene,count,2026),
    total:20, finished:Array.from({length:20},(_,i)=>hardwareTrial(scene,count,2026+i).success).filter(Boolean).length}));
}
const trainer=new MotionTrainer(createModel(42));
let collision;
let approach=[];
const progress=[];
while (trainer.learner.attempts<300) {
  const was=trainer.learner.attempts;
  trainer.advance();
  const transition=trainer.learner.audit.at(-1);
  const observation=trainer.episode.last.observation;
  if (observation.obstacle?.type==='hurdle' && observation.support && !trainer.episode.world.passed)
    approach.push({state:transition.state,action:transition.action,distance:round(observation.obstacle.distance)});
  if (!collision && transition.terminal && transition.reward===-12 && transition.action===0 &&
      transition.state.startsWith('hurdle,') && trainer.episode.last.observation.support &&
      trainer.episode.last.observation.obstacle.distance>0 && !trainer.episode.world.passed) {
    collision={attempt:was+1, seed:trainer.episode.world.seed, reward:transition.reward,
      before:round(transition.before), after:round(transition.after), state:transition.state,approach:[...approach]};
  }
  if(was<trainer.learner.attempts)approach=[];
  if (was<trainer.learner.attempts && [1,10,50,150,300].includes(was+1))
    progress.push({attempt:was+1,updates:trainer.learner.updates,states:Object.keys(trainer.learner.q).length});
}
assert.ok(collision);
const model=trainer.snapshot();
const serialized=JSON.stringify(model);
const evaluation=compareFrozen(model);
let step;
do { step=evaluation.next(); } while (!step.done);
const retrial=runFrozen(model,collision.seed);
const learnedJump=retrial.events.find(e=>e.kind==='jump');
collision.previousChoice=collision.approach.find(e=>e.action===0 && e.state===learnedJump.state &&
  Math.abs(e.distance-learnedJump.distance)<.01);
assert.ok(collision.previousChoice);
delete collision.approach;
const transfer=TEST_SEEDS.map(seed=>runFrozen(model,seed)).sort((a,b)=>
  Math.abs(b.obstacles[0].x-retrial.obstacles[0].x)-Math.abs(a.obstacles[0].x-retrial.obstacles[0].x))[0];
assert.equal(JSON.stringify(model),serialized);
assert.ok(retrial.success && transfer.success);
const results={trials,learning:{collision,progress,retrial,transfer,passReward:REWARD.pass,tests:{
  total:TEST_SEEDS.length,before:step.value.before.successes,after:step.value.after.successes}}};
writeFileSync(new URL('./observations.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
