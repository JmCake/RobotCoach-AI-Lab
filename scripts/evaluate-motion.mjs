import {writeFile,mkdir} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {MotionWorld,SCENES,SENSOR_NAMES,DEFAULT_SPEED,COURSE_DISTANCE} from '../assets/motion/world.js';
const runs=[],keys=Object.keys(SENSOR_NAMES),seeds=Array.from({length:20},(_,i)=>i+1);
for(const scene of Object.keys(SCENES))for(let mask=0;mask<16;mask++)for(const seed of seeds){
  const sensors=Object.fromEntries(keys.map((key,i)=>[key,!!(mask&(1<<i))]));
  const w=new MotionWorld({scene,seed,sensors,repeat:false});let peakCompression=0;
  for(let tick=0;tick<3600&&!w.done&&!w.falls;tick++){w.step();peakCompression=Math.max(peakCompression,w.compression);}
  runs.push({scene,seed,mask,sensors,success:w.result?.success??false,distance:w.progress,time:w.time,falls:w.falls,collisions:w.collisions,offTrack:w.offTrack,peakCompression,cause:w.cause,result:w.result});
}
const summary=Object.keys(SCENES).map(scene=>{
  const recommendedMask=keys.reduce((m,k,i)=>m|(SCENES[scene].recommended.includes(k)?1<<i:0),0);
  return {scene,recommendedMask,configurations:Array.from({length:16},(_,mask)=>({mask,modules:keys.filter((k,i)=>mask&(1<<i)),successes:runs.filter(r=>r.scene===scene&&r.mask===mask&&r.success).length,episodes:seeds.length}))};
});
const output=resolve(process.argv[2]||join(tmpdir(),'robotcoach-motion','progression-results.json'));
await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify({target:DEFAULT_SPEED,distance:COURSE_DISTANCE,seeds,total:runs.length,summary,runs},null,2));
for(const s of summary){const r=s.configurations[s.recommendedMask];console.log(`${SCENES[s.scene].name}: ${r.modules.join('+')||'none'} ${r.successes}/${r.episodes}`);}
console.log(`Saved ${runs.length} actual runs: ${output}`);
