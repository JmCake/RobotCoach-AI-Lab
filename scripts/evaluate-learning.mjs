import {Runner,Learner,rng} from '../assets/learning.js';
import {writeFile,mkdir} from 'node:fs/promises';
function evaluate(l,seed){const random=rng(seed),world=new Runner(random),scores=[],passed=[];for(let episode=0;episode<20;episode++){world.reset();while(!world.done)l.act(world,false,random);scores.push(world.score);passed.push(world.passed);}return{episodes:20,meanScore:Number((scores.reduce((a,b)=>a+b)/20).toFixed(2)),meanPassed:Number((passed.reduce((a,b)=>a+b)/20).toFixed(2)),scores,passed};}
const results=[];
for(const seed of [17,42,2026]){const l=new Learner(),random=rng(seed),world=new Runner(random),before=evaluate(l,9001);for(let i=0;i<100000;i++){l.act(world,true,random);if(world.done){l.record(world);world.reset();}}const after=evaluate(l,9001);results.push({seed,updates:l.updates,attempts:l.attempts,states:Object.keys(l.q).length,before,after,lastTen:l.history.slice(-10)});}
await mkdir('docs',{recursive:true});await writeFile('docs/v1-training-results.json',JSON.stringify({method:'100000 real Q updates per seed, same 20-episode frozen evaluation schedule before/after; no expert data',results},null,2));
console.log(JSON.stringify(results.map(({seed,updates,attempts,states,before,after})=>({seed,updates,attempts,states,before:before.meanPassed,after:after.meanPassed})),null,2));
