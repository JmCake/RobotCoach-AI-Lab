import {Learner,rng} from '../learning.js';
import {CONDITIONS,ShortCourse,TEST_SEEDS,TRAIN_SEEDS,observationState} from './short-course.js';

export const MODEL_KEY='robotcoach:humanoid:q:v1';
export const COMPARISON_KEY='robotcoach:humanoid:evaluation:v1';
export const TRAINING_SEED=42;

export function createModel(randomSeed=TRAINING_SEED) {
  return {version:1,conditions:CONDITIONS,training:{randomSeed,seeds:TRAIN_SEEDS},q:{},updates:0,attempts:0,history:[],audit:[]};
}

export function readModel(raw) {
  if(!raw)return createModel();
  try{
    const data=JSON.parse(raw);
    if(data?.version===1&&JSON.stringify(data.conditions)===JSON.stringify(CONDITIONS)
      &&JSON.stringify(data.training?.seeds)===JSON.stringify(TRAIN_SEEDS)
      &&Number.isSafeInteger(data.training.randomSeed))return data;
  }catch{}
  return createModel();
}

export class MotionTrainer {
  constructor(model=createModel()) {
    this.training=model.training;
    this.learner=new Learner(model);
    this.history=Array.isArray(model.history)?model.history.slice(-12):[];
    this.episode=null;
  }

  advance(){
    if(!this.episode||this.episode.finished){
      const attempt=this.learner.attempts;
      this.episode=new ShortCourse(TRAIN_SEEDS[attempt%TRAIN_SEEDS.length]);
      // The exploration stream is independent of track generation and restarts
      // with the same attempt if the learner returns mid-episode.
      this.random=rng(this.training.randomSeed+Math.imul(attempt+1,0x9e3779b9));
    }
    const learner=this.learner;
    const transition=this.episode.advance(observation=>learner.choose(observationState(observation),true,this.random));
    learner.update(observationState(transition.observation),transition.action,transition.reward,
      observationState(transition.next),transition.terminal);
    if(transition.terminal){
      learner.attempts++;
      this.history.push(this.episode.result());
      if(this.history.length>12)this.history.shift();
    }
  }

  snapshot(){
    const {q,updates,attempts,audit}=this.learner;
    return {...createModel(this.training.randomSeed),q,updates,attempts,audit,history:this.history};
  }
}

export function freezePolicy(model) {
  const learner=new Learner({q:model.q});
  return observation=>learner.choose(observationState(observation),false);
}

export function summarize(runs){
  const count=runs.length;
  const failures={};
  for(const run of runs)if(!run.success)failures[run.reason]=(failures[run.reason]??0)+1;
  return {
    count,successes:runs.filter(run=>run.success).length,
    meanPassed:runs.reduce((sum,run)=>sum+run.passed,0)/count,
    meanDistance:runs.reduce((sum,run)=>sum+run.distance,0)/count,
    failures,runs,
  };
}

export function* compareFrozen(model,seeds=TEST_SEEDS) {
  const before=freezePolicy(createModel());
  const after=freezePolicy(model);
  const runs={before:[],after:[]};
  for(const seed of seeds){
    for(const [phase,policy] of [['before',before],['after',after]]){
      const episode=new ShortCourse(seed);
      while(!episode.finished){episode.advance(policy);yield;}
      runs[phase].push(episode.result());
    }
  }
  return {
    conditions:CONDITIONS,updates:model.updates,attempts:model.attempts,seeds:[...seeds],
    before:summarize(runs.before),after:summarize(runs.after),
  };
}
