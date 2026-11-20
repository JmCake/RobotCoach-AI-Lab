import assert from 'node:assert/strict';
import {test} from 'node:test';
import {FinalRace,RACE_RULE,raceStrategy} from '../assets/motion/final-race.js';
import {raceFrameView,raceScoreText} from '../assets/motion/race-record.js';
import {raceVideoCaption,raceVideoTick} from '../assets/motion/race-video.js';
import {CONDITIONS} from '../assets/motion/short-course.js';

function run(sensors){
  const race=new FinalRace({sensors,strategy:raceStrategy(RACE_RULE)});
  while(!race.ended)race.step();
  return race.record;
}

test('video samples one saved race at 30 fps through all six segments and explicitly includes the last frame',()=>{
  const record=run(CONDITIONS.sensors);
  const before=JSON.stringify(record);
  const end=record.presentation.tick;
  assert.equal(record.score.outcome,'finished');
  assert.equal(raceVideoTick(record,0),0);
  assert.equal(raceVideoTick(record,34),4);
  assert.equal(raceVideoTick(record,1000),120);
  const segments=new Set();
  for(let ms=0;ms<record.presentation.time*1000;ms+=1000/30){
    const tick=raceVideoTick(record,ms);
    assert.ok(tick>=0&&tick<end&&tick%4===0);
    segments.add(raceFrameView(record,tick).scene);
  }
  assert.deepEqual([...segments],record.track.segments.map(segment=>segment.id));
  assert.equal(raceVideoTick(record,record.presentation.time*1000),end);
  assert.equal(raceVideoTick(record,200000),end);
  const result=raceVideoCaption(record,raceFrameView(record,end));
  assert.deepEqual(result,{title:'本场成绩',detail:raceScoreText(record.score,record.track.distance),result:true});
  assert.equal(JSON.stringify(record),before);
});

test('collision, score lock and later fallen frames use separate facts from the same saved race',()=>{
  const record=run({camera:true,lidar:false,imu:false,force:false});
  const before=JSON.stringify(record);
  const {score,presentation}=record;
  assert.equal(score.outcome,'failed');
  const caption=tick=>raceVideoCaption(record,raceFrameView(record,tick));
  assert.doesNotMatch(caption(score.tick-1).detail,/锁定|碰撞/);
  assert.match(caption(score.tick).detail,/碰撞.*成绩锁定/);
  const fallen=record.events.find(event=>event.type==='motion-state'&&event.state==='fallen');
  assert.ok(fallen.tick>score.tick&&fallen.tick<presentation.tick);
  assert.match(caption(fallen.tick).detail,/倒地停留.*成绩锁定/);
  const card=caption(presentation.tick);
  assert.equal(card.detail,raceScoreText(score,record.track.distance));
  assert.doesNotMatch(card.detail,/成功|冲线/);
  assert.equal(JSON.stringify(record),before);
});
