import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {FinalRace,RACE_LEARNED,RACE_RULE,raceStrategy} from '../assets/motion/final-race.js';
import {CONDITIONS} from '../assets/motion/short-course.js';
import {MotionTrainer,createModel} from '../assets/motion/short-learning.js';

// Reproduce one previously validated lesson model for a new transfer trial.
const trainer=new MotionTrainer(createModel(42));
while(trainer.learner.attempts<300)trainer.advance();
const model=JSON.stringify(trainer.snapshot());
const all=CONDITIONS.sensors;
const output=process.argv[2]??join(tmpdir(),'robotcoach-final-race');
await mkdir(output,{recursive:true});
const summaries=[];
for(const [name,sensors,strategy] of [
  ['rule-finish',all,raceStrategy(RACE_RULE)],
  ['rule-failure',{camera:true,lidar:false,imu:false,force:false},raceStrategy(RACE_RULE)],
  ['learned-transfer',all,raceStrategy(RACE_LEARNED,model)],
]){
  const race=new FinalRace({sensors,strategy});
  while(!race.ended)race.step();
  const {record}=race;
  await writeFile(join(output,`${name}.json`),JSON.stringify(record)+'\n');
  summaries.push({
    name,sensors,seed:record.track.seed,strategy:record.strategy.kind,strategyId:record.strategy.id,
    trainingUpdates:record.strategy.model?.updates,
    segments:record.events.filter(event=>event.type==='segment').map(event=>({id:event.segment,time:event.time,x:event.x})),
    score:record.score,presentation:record.presentation,frames:record.frames.length,decisions:record.decisions.length,
  });
}
assert.equal(JSON.stringify(trainer.snapshot()),model);
assert.equal(summaries[0].score.outcome,'finished');
assert.equal(summaries[1].score.outcome,'failed');
await writeFile(join(output,'final-race-evidence.json'),JSON.stringify(summaries,null,2)+'\n');
console.table(summaries.map(({name,score,frames,presentation})=>({
  name,outcome:score.outcome,distance:score.distance.toFixed(2),seconds:score.time.toFixed(2),
  obstacles:score.passed,presentation:presentation.displayState,frames,
})));
