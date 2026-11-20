import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {CONDITIONS,TEST_SEEDS,TRAIN_SEEDS,VALIDATION_SEEDS} from '../assets/motion/short-course.js';
import {MotionTrainer,compareFrozen,createModel} from '../assets/motion/short-learning.js';

const trainingAttempts=300; // Chosen using validation seeds before evaluating test seeds.
const results=[];
for(const randomSeed of [17,42,2026]){
  const trainer=new MotionTrainer(createModel(randomSeed));
  while(trainer.learner.attempts<trainingAttempts)trainer.advance();
  const model=trainer.snapshot();
  const serialized=JSON.stringify(model);
  const comparison=compareFrozen(model);
  let step;
  do{step=comparison.next();}while(!step.done);
  assert.equal(JSON.stringify(model),serialized);
  const {before,after}=step.value;
  results.push({
    randomSeed,updates:model.updates,attempts:model.attempts,
    frozenModelSha256:createHash('sha256').update(serialized).digest('hex'),
    before,after,
  });
  console.log(`seed ${randomSeed}: ${model.updates} updates, finish ${before.successes}/20 → ${after.successes}/20, obstacles ${before.meanPassed} → ${after.meanPassed}`);
}
const path=process.argv[2]??join(tmpdir(),'robotcoach-motion-learning.json');
await writeFile(path,JSON.stringify({conditions:CONDITIONS,trainingAttempts,trainSeeds:TRAIN_SEEDS,
  validationSeeds:VALIDATION_SEEDS,testSeeds:TEST_SEEDS,results},null,2)+'\n');
console.log(path);
