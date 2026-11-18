import {Runner,Learner,rng,REWARD_VERSION} from './learning.js';

export const TEST_SEEDS=Object.freeze(Array.from({length:20},(_,i)=>9001+i));
export function* evaluatePolicy(policy,seeds=TEST_SEEDS){
 const episodes=[];
 for(const seed of seeds){
  const world=new Runner(rng(seed));
  while(!world.done){policy.act(world,false);yield;}
  episodes.push({seed,score:world.score,passed:world.passed,reward:Number(world.totalReward.toFixed(3)),success:world.success,reason:world.reason});
 }
 const mean=key=>Number((episodes.reduce((sum,x)=>sum+x[key],0)/episodes.length).toFixed(2));
 return {episodes:episodes.length,seeds:[...seeds],meanScore:mean('score'),meanPassed:mean('passed'),meanReward:mean('reward'),successRate:Number((episodes.filter(x=>x.success).length/episodes.length*100).toFixed(1)),failures:{ground:episodes.filter(x=>x.reason==='撞上地面障碍').length,beam:episodes.filter(x=>x.reason==='碰到横梁').length},runs:episodes};
}
export function* comparePolicies(learner){
 // Both policies own their tables. Evaluation cannot mutate the live training session.
 const before=yield* evaluatePolicy(new Learner(learner.baseline));
 const after=yield* evaluatePolicy(new Learner({q:learner.q}));
 return {rewardVersion:REWARD_VERSION,baselineUpdates:learner.baseline.updates,updates:learner.updates,attempts:learner.attempts,before,after};
}
