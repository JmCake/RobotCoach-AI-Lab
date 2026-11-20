import {load} from '../state.js';
import {MotionWorld,SENSOR_NAMES,STATE_NAMES} from './world.js';
import {MotionRenderer} from './render.js';
import {createMotionPlayback} from './playback.js';
import {MODEL_KEY} from './short-learning.js';
import {FinalRace,RACE_LEARNED,RACE_RULE,RACE_POLICY_NAMES,RACE_RECORD_VERSION,raceStrategy} from './final-race.js';
import {FinalTrack,RACE_SEED,RACE_TARGET,createFinalTrack} from './final-track.js';

const RECORD_KEY='robotcoach:final-race:session:v1';
const SUMMARY_KEY='robotcoach:final-race:last:v1';
const $=id=>document.getElementById(id);
const canvas=$('motionCanvas'),renderer=new MotionRenderer(canvas);
const selection=$('policy'),keys=Object.keys(SENSOR_NAMES);
const courseSensors=load().sensors;
const checks=keys.map(key=>{
  const label=document.createElement('label'),input=document.createElement('input');
  label.className='race-sensor';
  input.type='checkbox';input.name=key;input.checked=courseSensors[key]===true;
  label.append(input,SENSOR_NAMES[key]);$('sensorSetup').append(label);
  return input;
});
const selectedSensors=()=>Object.fromEntries(checks.map(input=>[input.name,input.checked]));
const track=createFinalTrack();
const preview=new MotionWorld({seed:RACE_SEED,track:new FinalTrack(track),sensors:selectedSensors(),
  distance:track.distance,target:RACE_TARGET,repeat:false});
const steps=track.segments.map(segment=>{
  const item=document.createElement('li');
  item.textContent=segment.name;$('segments').append(item);
  return item;
});
const outcomeNames={finished:'成功完赛',failed:'本场未通过',aborted:'已退出 · 未完成'};
let race=null,countdown=0,countFrame=null,lastCountdownTime=null,parentHidden=false;
let model=availableModel();
let lastRecord=readSaved('sessionStorage',RECORD_KEY);
if(lastRecord?.version!==RACE_RECORD_VERSION||!lastRecord.presentation||!lastRecord.score)lastRecord=null;
let lastSummary=lastRecord?summarize(lastRecord):readSaved('localStorage',SUMMARY_KEY);
if(lastSummary?.version!==RACE_RECORD_VERSION||!Object.hasOwn(outcomeNames,lastSummary.score?.outcome))lastSummary=null;
let recordSaved=lastRecord!==null,presented=null;

function availableModel(){
  try{return raceStrategy(RACE_LEARNED,localStorage.getItem(MODEL_KEY));}catch{return null;}
}
function readSaved(storage,key){
  try{return JSON.parse(window[storage].getItem(key));}catch{return null;}
}
function writeSaved(storage,key,value){
  try{window[storage].setItem(key,JSON.stringify(value));return true;}catch{return false;}
}
function summarize(record){
  return {
    version:record.version,score:record.score,trackSeed:record.track.seed,distance:record.track.distance,
    sensors:record.sensors,kind:record.strategy.kind,updates:record.strategy.model?.updates??null,
    strategyId:record.strategy.id,frames:record.frames.length,presentation:record.presentation,
  };
}
function text(id,value){
  const element=$(id);
  if(element.textContent!==value)element.textContent=value;
}
function sensorNames(config){return keys.filter(key=>config[key]).map(key=>SENSOR_NAMES[key]).join('、')||'无感官';}
const busy=()=>race!==null&&!race.ended;
const visible=()=>!document.hidden&&!parentHidden;
const showWorld=()=>race?.world??preview;
const playback=createMotionPlayback({world:showWorld,step:()=>race.step(),draw:drawStage,settled:finish});

function summaryText(score,distance){
  const reason=score.reason?` · ${score.reason}`:'';
  return `${outcomeNames[score.outcome]}${reason} · ${score.distance.toFixed(1)} / ${distance} m · ${score.time.toFixed(1)} 秒 · 越障 ${score.passed}`;
}
function renderResult(){
  $('lastRace').hidden=!lastSummary;
  if(!lastSummary)return;
  const {score,distance,sensors,kind,updates,trackSeed,frames,presentation}=lastSummary;
  text('resultStatus',summaryText(score,distance));
  text('resultConfig',`${RACE_POLICY_NAMES[kind]}${updates===null?'':` · 冻结 ${updates} 次更新`} · ${sensorNames(sensors)} · 种子 ${trackSeed}`);
  $('download').hidden=!lastRecord;
  text('recordNote',lastRecord?
    `${frames} 个物理帧 · ${presentation.status==='complete'?'记录至动作结束':'记录至退出时刻'}${recordSaved?' · 本标签页可下载':' · 请在离开此页前下载'}`:
    '当前仅有成绩摘要。完整记录保留在原比赛标签页或已下载的文件中。');
}
function renderPolicy(){
  const kind=busy()?race.strategy.kind:selection.value;
  const frozen=busy()?race.strategy:model;
  let note;
  if(kind===RACE_RULE)note='规则参考负责越障选择，底层规则负责速度、转向、姿态和落脚。';
  else if(kind===RACE_LEARNED&&frozen){
    const config=busy()?race.record.sensors:selectedSensors();
    const changed=keys.some(key=>!config[key]);
    note=`Q 策略负责越障选择，底层规则负责速度、转向、姿态和落脚。冻结 ${frozen.model.updates} 次更新。`;
    if(changed)note+='该模型使用四种感官训练，本场感官不同。';
  }else if(kind===RACE_LEARNED)note='本机尚无可用的人形 Q 策略。可先去第 7 页训练，或主动选择规则参考。';
  else note='选择本机学习策略或规则参考。感官默认来自第一章，可在赛前调整。';
  text('policyNote',note);
  $('goTraining').hidden=busy()||kind!==RACE_LEARNED||model!==null;
}
function render(){
  const world=showWorld(),segment=world.track.segmentAt(world.x);
  const active=busy(),counting=countFrame!==null,playing=playback.running;
  const score=race?.score;
  const state=active?(counting?'countdown':playing?(score?'showing':'running'):'paused'):(score?.outcome??'ready');
  $('status').dataset.state=state;
  $('status').dataset.outcome=score?.outcome??'pending';
  text('segment',segment.name);
  text('distance',`位置 ${Math.min(world.progress,track.distance).toFixed(1)} / ${track.distance} m`);
  text('raceTime',`${(score?.time??world.time).toFixed(1)} 秒`);
  text('speed',`${world.speed.toFixed(1)} m/s`);
  $('bend').hidden=segment.id!=='curve';
  if(segment.id==='curve')text('bend',`横移 ${world.lateral.toFixed(2)} m · 侧倾 ${(world.theta*180/Math.PI).toFixed(1)}°`);
  steps.forEach((item,i)=>item.setAttribute('aria-current',track.segments[i].id===segment.id?'step':'false'));
  $('countdown').hidden=!active||countdown<=0;
  if(countdown>0)text('countdown',counting?String(Math.ceil(countdown)):'已暂停');
  $('start').hidden=active;
  $('start').disabled=selection.value===''||(selection.value===RACE_LEARNED&&!model);
  $('retry').hidden=active||!lastRecord;
  $('pause').hidden=$('exit').hidden=!active;
  text('pause',counting||playing?'暂停':countdown>0?'继续倒计时':'继续比赛');
  $('sensorSetup').disabled=selection.disabled=active;
  $('fullView').hidden=active||standalone;
  if(score){
    const motion=active?` · ${STATE_NAMES[world.state]}`:'';
    text('status',summaryText(score,track.distance)+motion);
  }else if(active){
    text('status',counting?'起跑倒计时':playing?`${RACE_POLICY_NAMES[race.strategy.kind]} · ${STATE_NAMES[world.state]}`:'比赛已暂停');
  }else text('status',selection.value?'准备起跑': '请先选择动作策略');
  renderPolicy();
}
function drawStage(){
  renderer.draw(showWorld());
  render();
}
function stopCountdown(){
  if(countFrame!==null)cancelAnimationFrame(countFrame);
  countFrame=lastCountdownTime=null;
}
function count(now){
  if(lastCountdownTime!==null)countdown-=Math.min(.1,(now-lastCountdownTime)/1000);
  lastCountdownTime=now;
  if(countdown<=0){
    countdown=0;
    stopCountdown();
    playback.start();
  }else countFrame=requestAnimationFrame(count);
  render();
}
function startRace(strategy,sensors,seed){
  if(busy()||!visible()||!strategy)return;
  for(const input of checks)input.checked=sensors[input.name];
  selection.value=strategy.kind;
  race=new FinalRace({strategy,sensors,seed});
  countdown=3;
  countFrame=requestAnimationFrame(count);
  drawStage();
}
function finish(){
  if(!race?.ended||presented===race)return;
  presented=race;
  lastRecord=race.record;
  lastSummary=summarize(lastRecord);
  recordSaved=writeSaved('sessionStorage',RECORD_KEY,lastRecord);
  if(!recordSaved)try{sessionStorage.removeItem(RECORD_KEY);}catch{}
  writeSaved('localStorage',SUMMARY_KEY,lastSummary);
  renderResult();
  drawStage();
}
function pause(){
  stopCountdown();
  playback.pause();
  render();
}
function exit(){
  if(!busy())return;
  stopCountdown();
  playback.pause();
  countdown=0;
  race.exit();
  finish();
}
function changeSetup(){
  if(busy())return;
  race=null;
  preview.sensors=selectedSensors();
  preview.observation=preview.observe();
  drawStage();
}

const params=new URLSearchParams(location.search);
const standalone=window===parent;
const parentBook=!standalone&&document.referrer?new URL(document.referrer):null;
const bookEntry=params.get('book')==='course.html'?'course.html':'index.html';
const book=parentBook?.origin===location.origin?parentBook:new URL('../'+bookEntry,location.href);
book.searchParams.delete('runner');book.searchParams.delete('lab');book.hash='design';
$('standalone').hidden=!standalone;
$('backToBook').href=book;
const full=new URL(location.href);
full.search=new URLSearchParams({view:'full',book:book.pathname.endsWith('/course.html')?'course.html':'index.html'});
$('fullView').href=full;
const trainingLink=new URL(book);trainingLink.hash='training';
$('goTraining').href=trainingLink;
const legacy=new URL(book);legacy.searchParams.set('lab','v2');
$('legacy').href=legacy;
text('raceConditions',`连续 ${track.distance} m · 目标速度 ${RACE_TARGET} m/s · 种子 ${RACE_SEED}`);

$('start').addEventListener('click',()=>{
  model=availableModel();
  startRace(selection.value===RACE_LEARNED?model:raceStrategy(selection.value),selectedSensors(),RACE_SEED);
  render();
});
$('retry').addEventListener('click',()=>{
  if(lastRecord)startRace(lastRecord.strategy,lastRecord.sensors,lastRecord.track.seed);
});
$('pause').addEventListener('click',()=>{
  if(playback.running||countFrame!==null){pause();return;}
  if(!busy()||!visible())return;
  if(countdown>0)countFrame=requestAnimationFrame(count);
  else playback.start();
  render();
});
$('exit').addEventListener('click',exit);
$('download').addEventListener('click',()=>{
  if(!lastRecord)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(lastRecord)],{type:'application/json'}));
  const link=document.createElement('a');
  link.href=url;link.download=`robotcoach-race-${lastRecord.track.seed}-${lastRecord.score.outcome}.json`;
  link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
selection.addEventListener('change',changeSetup);
for(const input of checks)input.addEventListener('change',changeSetup);
window.addEventListener('storage',event=>{
  if(event.key!==MODEL_KEY&&event.key!==null)return;
  model=availableModel();
  if(!busy())render();
});
document.addEventListener('coursevisibility',event=>{
  if(typeof event.detail!=='boolean')return;
  parentHidden=event.detail;
  if(parentHidden&&busy())pause();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&busy())pause();});
document.addEventListener('courseleave',exit);
window.addEventListener('pagehide',exit);
renderer.resize();
renderResult();
drawStage();
new ResizeObserver(()=>{renderer.resize();renderer.draw(showWorld());}).observe(canvas);
