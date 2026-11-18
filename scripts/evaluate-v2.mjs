import {writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {ChallengeLearner,ClonePolicy,demonstrations,trainQ,evaluateChallenge,rulePolicy,observationState,ALL_SENSORS,TRAIN_SEEDS,TEST_SEEDS_V2} from '../assets/challenge-engine.js';
const drain=g=>{let r;do{r=g.next();}while(!r.done);return r.value;};
const configs={all:ALL_SENSORS,camera:{camera:true,lidar:false,imu:false,force:false},noLidar:{...ALL_SENSORS,lidar:false},noImu:{...ALL_SENSORS,imu:false},noForce:{...ALL_SENSORS,force:false},none:{camera:false,lidar:false,imu:false,force:false}};
const observations=[...demonstrations()].filter((_,i)=>i%3===0),clone=new ClonePolicy();clone.fit(observations);
const repetitions=[];
for(const seed of [17,42,2026]){
 const q=new ChallengeLearner(),baseline=new ChallengeLearner();drain(trainQ(q,100000,ALL_SENSORS,seed));
 const snapshot=JSON.stringify(q.snapshot()),results=[];
 for(const [sensorConfig,config] of Object.entries(configs)){
  results.push(...drain(evaluateChallenge({rule:rulePolicy,clone:o=>clone.choose(o),baseline:o=>baseline.choose(observationState(o)),q:o=>q.choose(observationState(o))},config)).map(r=>({...r,sensorConfig})));
 }
 if(snapshot!==JSON.stringify(q.snapshot()))throw new Error('Frozen evaluation changed training');
 repetitions.push({seed,updates:q.updates,attempts:q.attempts,states:Object.keys(q.q).length,model:q.snapshot(),results});
 console.log(JSON.stringify({seed,updates:q.updates,results:results.filter(r=>r.sensorConfig==='all').map(({environment,policy,successRate,meanPassed})=>({environment,policy,successRate,meanPassed}))}));
}
const directory=resolve(process.env.EVIDENCE_DIR||`${tmpdir()}/robotcoach-v2`);await mkdir(directory,{recursive:true});
await writeFile(resolve(directory,'v2-results.json'),JSON.stringify({version:'2.0.0',trainSeeds:TRAIN_SEEDS,testSeeds:TEST_SEEDS_V2,clone:clone.snapshot(),observations,repetitions},null,2));
console.log(`Evidence: ${directory}/v2-results.json`);
