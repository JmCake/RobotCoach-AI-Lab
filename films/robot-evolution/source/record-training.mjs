// Record decisions as the classroom trainer makes them. Replay checks every decision,
// reward and outcome through ShortCourse before an episode can be used on screen.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {MotionTrainer, createModel, freezePolicy} from '../../../assets/motion/short-learning.js';
import {CONDITIONS, TEST_SEEDS, ShortCourse, observationState, ruleAction} from '../../../assets/motion/short-course.js';

const rate=CONDITIONS.physicsHz;
const tick=time=>Math.round(time*rate);
const round=value=>Number(value.toFixed(5));
const rounds=new Set([3,6,7,36,246]);
const clips={};

function start(id,episode,attempt=null) {
  return {id,attempt,seed:episode.world.seed,steps:[],events:[],contacts:[],
    obstacles:episode.world.obstacles.map(({type,x,height,width})=>({type,x:round(x),height:round(height),width:round(width)}))};
}

function stepRecord(episode,last,selection={}) {
  const o=last.observation;
  return {t:tick(o.time),end:tick(episode.world.time),state:observationState(o),type:o.obstacle?.type??null,
    distance:o.obstacle?round(o.obstacle.distance):null,source:o.obstacle?.source??null,
    speed:round(o.speed),support:o.support,action:last.action,rejected:last.rejected,reward:round(last.reward),
    ...selection};
}

const trainer=new MotionTrainer(createModel(42));
const jumpHistory=[];
const choose=trainer.learner.choose.bind(trainer.learner);
let selection;
trainer.learner.choose=function(state,training,random) {
  const q=[...(this.q[state]??[0,0,0])].map(round);
  let draws=0;
  const action=choose(state,training,()=>{draws++;return random();});
  selection={q,explore:draws===2};
  return action;
};
while(trainer.learner.attempts<300){
  const n=trainer.learner.attempts+1;
  trainer.advance();
  const audit=trainer.learner.audit.at(-1);
  if(n<=36 && audit.state==='hurdle,2,2,1' && audit.action===1 &&
      trainer.episode.world.passed===0)
    jumpHistory.push({attempt:n,update:audit.update,before:round(audit.before),after:round(audit.after)});
  if(!rounds.has(n))continue;
  const id='r'+n;
  const ep=trainer.episode;
  const clip=clips[id]??=start(id,ep,n);
  clip.steps.push(stepRecord(ep,ep.last,{...selection,before:round(audit.before),after:round(audit.after)}));
  if(ep.finished)clip.result=ep.result();
}
const model=trainer.snapshot();
const serialized=JSON.stringify(model);

function runPolicy(seed,policy,id){
  const ep=new ShortCourse(seed);
  const clip=id?start(id,ep):null;
  while(!ep.finished){
    const s=ep.advance(policy);
    if(clip)clip.steps.push(stepRecord(ep,s));
  }
  if(clip){clip.result=ep.result();clips[id]=clip;}
  return ep.result().success;
}
runPolicy(106,ruleAction,'rule');
const empty=freezePolicy(createModel());
const frozen=freezePolicy(model);
const results={rules:0,empty:0,trained:0,total:TEST_SEEDS.length};
for(const seed of TEST_SEEDS){
  results.rules+=Number(runPolicy(seed,ruleAction));
  results.empty+=Number(runPolicy(seed,empty));
  results.trained+=Number(runPolicy(seed,frozen,seed===9016?'test':null));
}
assert.equal(JSON.stringify(model),serialized);

// The same training seed is revisited every thirty episodes. These two decisions
// have the same hardware, course layout, distance, support, speed and encoded state.
const matched=[clips.r6,clips.r36].map(clip=>clip.steps.find(s=>s.t===348));
for(const field of ['state','source','support','speed','distance'])
  assert.equal(matched[0][field],matched[1][field]);
assert.deepEqual(matched.map(s=>s.action),[0,1]);
assert.deepEqual(matched.map(s=>s.explore),[false,false]);
assert.ok(clips.r7.steps.find(s=>s.t===348).explore);
assert.deepEqual(clips.r6.obstacles,clips.r36.obstacles);
assert.deepEqual(clips.r36.obstacles,clips.r246.obstacles);

function verify(clip){
  const ep=new ShortCourse(clip.seed);
  const w=ep.world;
  // Compact physical-tick readings used by the on-picture sensor readout.
  // type (0/1/2), range in cm, speed in cm/s, whole degrees, supporting feet, crouch in percent.
  function sensors(){
    const o=w.observation,ob=o.lidar?.obstacle??o.camera?.obstacle;
    return [ob?(ob.type==='hurdle'?1:2):0,ob?Math.round(ob.distance*100):0,
      Math.round(o.imu.speed*100),Math.round(o.imu.tilt*180/Math.PI),
      o.contact.feet.filter(Boolean).length,Math.round(w.crouch*100)];
  }
  clip.signals=[sensors()];
  let n=0;
  while(!ep.finished){
    const previous={jump:w.jumpCount,land:w.landings,passed:w.passed,feet:[...w.contacts]};
    const s=ep.tick(observation=>{
      const expected=clip.steps[n];
      assert.equal(tick(observation.time),expected.t);
      assert.equal(observationState(observation),expected.state);
      if(observation.obstacle)assert.equal(round(observation.obstacle.distance),expected.distance);
      return expected.action;
    });
    const now=tick(w.time);
    clip.signals.push(sensors());
    const event=(kind,detail={})=>clip.events.push({kind,t:now,x:round(w.x),step:n,...detail});
    if(w.jumpCount>previous.jump)event('jump');
    if(w.landings>previous.land)event('land');
    if(w.passed>previous.passed)event('pass',{obstacle:w.obstacles[previous.passed].type});
    if(w.collision && tick(w.collision.time)===now)event('hit',{part:w.collision.part});
    for(let i=0;i<2;i++)if(w.contacts[i]&&!previous.feet[i])clip.contacts.push([now,i]);
    if(s){
      const expected=clip.steps[n++];
      assert.equal(round(s.reward),expected.reward);
      assert.equal(s.rejected,expected.rejected);
      assert.equal(now,expected.end);
    }
  }
  assert.equal(n,clip.steps.length);
  assert.equal(clip.signals.length,clip.steps.at(-1).end+1);
  assert.deepEqual(ep.result(),clip.result);
}
for(const clip of Object.values(clips))verify(clip);
const order=['rule','r3','r6','r7','r36','r246','test'];
const ranges={rule:[237,430],r3:[233,null],r6:[0,null],r7:[0,423],
  r36:[282,null],r246:[438,571],test:[238,571]};
let frame=0;
for(const id of order){
  const clip=clips[id];
  const [from,limit]=ranges[id];
  const through=Math.min(limit??Infinity,clip.steps.at(-1).end);
  clip.film={from,through,offset:frame};
  frame+=through-from+1;
}
const out={rate,order,frames:frame,conditions:CONDITIONS,training:{episodes:model.attempts,
  updates:model.updates,modelSha256:createHash('sha256').update(serialized).digest('hex')},
  results,jumpHistory,clips};
writeFileSync(new URL('training-takes.json',import.meta.url),JSON.stringify(out)+'\n');
console.log(JSON.stringify({frames:frame,results,model:out.training,realDecisions:order.map(id=>[id,clips[id].steps.length])}));
