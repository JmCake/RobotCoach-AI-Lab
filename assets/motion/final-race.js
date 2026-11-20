import {DT,MOTION_ACTION,MotionWorld,SENSOR_NAMES} from './world.js';
import {motionSettled} from './playback.js';
import {CONDITIONS,DECISION_STEPS,MotionActionClock,RULE_ACTION_PARAMETERS,ruleAction} from './short-course.js';
import {MotionTrainer,freezePolicy,readModel} from './short-learning.js';
import {RACE_SEED,RACE_TARGET,FinalTrack,createFinalTrack} from './final-track.js';
import {FRAME_FIELDS,RACE_RECORD_VERSION,captureRaceFrame} from './race-record.js';

export {RACE_RECORD_VERSION};
export const RACE_RULE='rule';
export const RACE_LEARNED='learned';
export const RACE_POLICY_NAMES=Object.freeze({rule:'规则参考',learned:'我的学习策略'});
const MAX_RACE_SECONDS=120;

function modelIdentifier(model) {
  // Stable identity for a classroom record, independent of browser storage timestamps.
  let hash=2166136261;
  const source=JSON.stringify(model);
  for(let i=0;i<source.length;i++)hash=Math.imul(hash^source.charCodeAt(i),16777619);
  return `humanoid-q-v1-${(hash>>>0).toString(16).padStart(8,'0')}`;
}

export function raceStrategy(kind,rawModel) {
  if(kind===RACE_RULE)return {kind,id:'short-rule-v1',parameters:RULE_ACTION_PARAMETERS};
  if(kind!==RACE_LEARNED)return null;
  const {q,updates,attempts,conditions,training}=new MotionTrainer(readModel(rawModel)).snapshot();
  if(updates===0||!Object.values(q).some(row=>row.some(value=>value!==0)))return null;
  const model={version:1,q,updates,attempts,conditions,training};
  return {kind,id:modelIdentifier(model),model};
}

export class FinalRace {
  constructor({seed=RACE_SEED,sensors,strategy}){
    this.track=createFinalTrack(seed);
    this.strategy=structuredClone(strategy);
    const config=Object.fromEntries(Object.keys(SENSOR_NAMES).map(key=>[key,sensors[key]===true]));
    this.world=new MotionWorld({seed:this.track.seed,track:new FinalTrack(this.track),
      distance:this.track.distance,target:RACE_TARGET,sensors:config,repeat:false});
    if(this.strategy.kind===RACE_LEARNED)this.choose=freezePolicy(this.strategy.model);
    else if(this.strategy.kind===RACE_RULE){
      const parameters={...this.strategy.parameters};
      this.choose=observation=>ruleAction(observation,parameters);
    }else throw new RangeError('A compatible race strategy must be selected');
    this.clock=new MotionActionClock();
    this.tick=0;
    this.score=null;
    this.previousSegment=this.world.scene;
    this.previousState=this.world.state;
    this.previousCollision=null;
    this.previousLanding=null;
    this.passed=0;
    this.record={
      version:RACE_RECORD_VERSION,motionModel:'motion-world-continuous-v1',track:this.track,
      contracts:{observation:CONDITIONS.observation,actions:CONDITIONS.actions,controller:CONDITIONS.controller,
        physicsHz:CONDITIONS.physicsHz,decisionHz:CONDITIONS.decisionHz,decisionSteps:DECISION_STEPS,
        unknownState:'greedy argmax of zero values, first action wins',targetSpeed:RACE_TARGET,timeLimit:MAX_RACE_SECONDS},
      sensors:config,strategy:this.strategy,appearance:{terrainPhase:this.world.terrainPhase},
      samplePrecision:6,frameFields:FRAME_FIELDS,frames:[captureRaceFrame(this.world,0)],
      decisions:[],events:[],score:null,presentation:null,
    };
  }

  get ended(){return this.record.presentation!==null;}

  event(type,detail={}){
    this.record.events.push({type,tick:this.tick,time:this.tick*DT,x:this.world.x,...detail});
  }

  step(){
    if(this.ended)return;
    const world=this.world,segment=world.scene;
    if(this.tick===0){
      this.event('start');
      this.event('segment',{segment});
    }
    const beforeX=world.x;
    if(!this.score){
      if(this.clock.tick(world,this.choose)){
        this.record.decisions.push({tick:this.tick,x:beforeX,segment,observation:this.clock.observation,
          action:this.clock.action,rejected:this.clock.rejected,control:{...world.control}});
      }
    }else world.step(MOTION_ACTION.forward);
    this.tick++;
    if(!world.result&&this.tick*DT>=MAX_RACE_SECONDS)world.recordFailure('超过比赛时限');
    if(world.scene!==this.previousSegment){
      this.previousSegment=world.scene;
      this.event('segment',{segment:world.scene});
    }
    if(world.collision&&world.collision!==this.previousCollision){
      this.previousCollision=world.collision;
      this.event('collision',{part:world.collision.part,reason:world.cause});
    }
    if(world.passed!==this.passed){
      this.passed=world.passed;
      this.event('obstacle-pass',{passed:world.passed});
    }
    if(world.lastLanding&&world.lastLanding!==this.previousLanding){
      this.previousLanding=world.lastLanding;
      this.event('landing',{impact:world.lastLanding.impact,cleared:world.lastLanding.cleared});
    }
    if(world.state!==this.previousState){
      this.previousState=world.state;
      this.event('motion-state',{state:world.state});
    }
    if(world.result&&!this.score){
      const {success,reason,distance,collisions,falls,offTrack}=world.result;
      this.lockScore({outcome:success?'finished':'failed',reason:reason??null,distance,
        collisions,falls,offTrack,passed:world.passed});
    }
    this.record.frames.push(captureRaceFrame(world,this.tick));
    if(motionSettled(world))this.finishPresentation('complete');
  }

  lockScore(detail) {
    this.score=this.record.score=Object.freeze({...detail,time:this.tick*DT,tick:this.tick,segment:this.world.scene});
    this.event('score',{score:this.score});
  }

  finishPresentation(status) {
    this.record.presentation={status,tick:this.tick,time:this.tick*DT,displayState:this.world.state};
    this.event('presentation-end',{status});
  }

  exit() {
    if(this.ended)return;
    if(!this.score)this.lockScore({outcome:'aborted',reason:null,distance:this.world.progress,
      passed:this.world.passed,collisions:this.world.collisions,falls:this.world.falls,offTrack:this.world.offTrack});
    this.finishPresentation('interrupted');
  }
}
