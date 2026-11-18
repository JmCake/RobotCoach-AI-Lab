import {Runner,Learner,rng,REWARDS,REWARD_VERSION} from '../assets/learning.js';
import {comparePolicies} from '../assets/evaluation.js';
import {writeFile} from 'node:fs/promises';

const drain=iterator=>{let step;do{step=iterator.next();}while(!step.done);return step.value;};
const results=[];
for(const seed of [17,42,2026]){
 const learner=new Learner(),random=rng(seed),world=new Runner(random),checkpoints=[];
 for(let i=0;i<=100000;i++){
  if([0,1000,10000,50000,100000].includes(i))checkpoints.push(drain(comparePolicies(learner)));
  if(i===100000)break;
  learner.act(world,true,random);if(world.done){learner.record(world);world.reset();}
 }
 results.push({seed,updates:learner.updates,attempts:learner.attempts,states:Object.keys(learner.q).length,checkpoints,lastTen:learner.history.slice(-10),audit:learner.audit});
}
const report={method:'Three independent empty-table Q-learning runs, no expert data. Each checkpoint evaluates both the saved starting policy and current frozen policy on independent episode seeds 9001..9020. No evaluation writes. A successful episode survives the unchanged 1800-frame runner.',rewardVersion:REWARD_VERSION,rewards:REWARDS,results};
if(process.argv[2])await writeFile(process.argv[2],JSON.stringify(report,null,2));
else console.log(JSON.stringify(report,null,2));
console.log(JSON.stringify(results.map(x=>({seed:x.seed,updates:x.updates,attempts:x.attempts,checkpoints:x.checkpoints.map(c=>({updates:c.updates,meanPassed:c.after.meanPassed,successRate:c.after.successRate}))})),null,2));
