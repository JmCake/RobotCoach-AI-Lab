import {DT,MOTION_ACTION,MotionWorld} from './world.js';

const {forward,jump,duck}=MOTION_ACTION;
export const ACTION_NAMES=Object.freeze(['继续前进','跳跃','下蹲']);
export const TRAIN_SEEDS=Object.freeze(Array.from({length:30},(_,i)=>101+i));
export const VALIDATION_SEEDS=Object.freeze(Array.from({length:20},(_,i)=>1001+i));
export const TEST_SEEDS=Object.freeze(Array.from({length:20},(_,i)=>9001+i));
export const DECISION_STEPS=12;
export const CONDITIONS=Object.freeze({
  environment:'humanoid-obstacles-v1',
  observation:'range-speed-support-v1',
  actions:'forward-jump-duck-v1',
  controller:'motion-stability-v1',
  rewards:'pass-finish-failure-effort-v1',
  scene:'obstacles',
  distance:32,
  target:6.4,
  physicsHz:1/DT,
  decisionHz:1/(DT*DECISION_STEPS),
  sensors:Object.freeze({camera:true,lidar:true,imu:true,force:true}),
});
export const LESSON_SEED=2026;
export const REWARD=Object.freeze({pass:8,finish:4,failure:-12,jump:-.03,duck:-.02});

// A strategy gets a detached sample of installed sensors. Exact grounding and
// jump height stay inside the physical actuator even when a sensor is enabled.
export function policyObservation(readings,time) {
  const obstacle=readings.lidar?.obstacle??readings.camera?.obstacle;
  return {
    time,
    obstacle:obstacle?{
      type:obstacle.type,
      distance:obstacle.distance,
      source:readings.lidar?.obstacle?'lidar':'camera',
    }:null,
    speed:readings.imu?.speed??null,
    support:readings.contact?.feet.some(Boolean)??null,
  };
}

export function observationState({obstacle,speed,support}) {
  const type=obstacle?.type??'none';
  const distance=obstacle?Math.min(12,Math.max(-2,Math.floor(obstacle.distance/.64))):0;
  return [type,distance,speed===null?'unknown':Math.min(2,Math.floor(speed/2)),
    support===null?'unknown':Number(support)].join(',');
}

export function ruleAction({obstacle,speed,support}) {
  if(!obstacle||speed===null)return forward;
  const {type,distance}=obstacle;
  if(type==='hurdle'&&support&&distance>.2&&distance<speed*.43+.32)return jump;
  if(type==='beam'&&distance>-.72&&distance<speed*.6+.7)return duck;
  return forward;
}

export class ShortCourse {
  constructor(seed,{sensors=CONDITIONS.sensors}={}) {
    this.world=new MotionWorld({...CONDITIONS,seed,sensors,repeat:false});
    // Keep the generated layout and its random stream, and exclude objects that
    // cannot participate in this finite course.
    this.world.obstacles=this.world.obstacles.filter(obstacle=>obstacle.x<CONDITIONS.distance);
    this.remaining=0;
    this.rewards={pass:0,finish:0,failure:0,action:0};
    this.score=null;
    this.last=null;
    this.action=forward;
    this.rejected=false;
  }

  get finished(){return this.world.result!==null;}

  observe(){
    return policyObservation(this.world.observation,this.world.time);
  }

  tick(choose){
    if(this.finished)return null;
    const world=this.world;
    const first=this.remaining===0;
    const jumps=world.jumpCount;
    if(first){
      this.observation=this.observe();
      this.action=choose(this.observation);
      if(!Number.isInteger(this.action)||!ACTION_NAMES[this.action])throw new RangeError('Invalid motion action');
      this.remaining=DECISION_STEPS;
      this.startPassed=world.passed;
    }
    // A jump intent pulses once. A duck intent is held across the decision.
    world.step(this.action===jump&&!first?forward:this.action);
    if(first)this.rejected=this.action===jump&&world.jumpCount===jumps;
    if(world.time>=20&&!world.result)world.recordFailure('超过试跑时限');
    this.remaining--;
    if(this.remaining&&!this.finished)return null;

    const rewards={
      pass:(world.passed-this.startPassed)*REWARD.pass,
      finish:world.result?.success?REWARD.finish:0,
      failure:world.result&&!world.result.success?REWARD.failure:0,
      action:this.action===duck?REWARD.duck:(this.action===jump&&!this.rejected?REWARD.jump:0),
    };
    for(const key of Object.keys(rewards))this.rewards[key]+=rewards[key];
    if(this.finished){
      const score=world.result;
      this.score={
        seed:world.seed,success:score.success,distance:score.distance,time:score.time,
        passed:world.passed,reason:score.reason??'完成',
        reward:Object.values(this.rewards).reduce((sum,value)=>sum+value,0),rewards:{...this.rewards},
      };
    }
    return this.last={
      observation:this.observation,next:this.observe(),action:this.action,rejected:this.rejected,
      reward:Object.values(rewards).reduce((sum,value)=>sum+value,0),terminal:this.finished,
    };
  }

  advance(choose){
    if(this.finished)return null;
    let transition;
    do{transition=this.tick(choose);}while(!transition);
    return transition;
  }

  result(){return this.score;}
}
