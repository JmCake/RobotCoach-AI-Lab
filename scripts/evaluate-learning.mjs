import {Runner,Learner,rng} from '../assets/learning.js';
import {writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export function evaluate(l,seed){
 const scores=[],passed=[],seeds=[];
 for(let episode=0;episode<20;episode++){
  const episodeSeed=(seed+episode)>>>0,random=rng(episodeSeed),world=new Runner(random);
  seeds.push(episodeSeed);
  while(!world.done)l.act(world,false,random);
  scores.push(world.score);passed.push(world.passed);
 }
 return{episodes:20,seeds,meanScore:Number((scores.reduce((a,b)=>a+b)/20).toFixed(2)),meanPassed:Number((passed.reduce((a,b)=>a+b)/20).toFixed(2)),scores,passed};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
const results=[];
for(const seed of [17,42,2026]){const l=new Learner(),random=rng(seed),world=new Runner(random),before=evaluate(l,9001);for(let i=0;i<100000;i++){l.act(world,true,random);if(world.done){l.record(world);world.reset();}}const after=evaluate(l,9001);results.push({seed,updates:l.updates,attempts:l.attempts,states:Object.keys(l.q).length,before,after,lastTen:l.history.slice(-10)});}
await mkdir('docs',{recursive:true});await writeFile('docs/v1-training-results.json',JSON.stringify({method:'100000 real Q updates per training seed; evaluation resets its RNG independently for each episode with seeds 9001..9020 for both policies; no expert data',results},null,2));
console.log(JSON.stringify(results.map(({seed,updates,attempts,states,before,after})=>({seed,updates,attempts,states,before:before.meanPassed,after:after.meanPassed})),null,2));
}
