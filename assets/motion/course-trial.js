import {COURSE_STATE_KEY,INITIAL_SENSORS,load,sameSensors,save,storageNotice} from '../state.js';
import {SENSOR_NAMES,STATE_NAMES} from './world.js';
import {CURVE_TRIAL as conditions,createCurveTrial} from './curve-trial.js';
import {MotionRenderer} from './render.js';
import {createMotionPlayback} from './playback.js';

const keys=Object.keys(SENSOR_NAMES); // The course's 激光雷达 maps directly to motion's lidar/激光测距.
const baselineOnly=new URLSearchParams(location.search).get('mode')==='baseline';
const state=load();
const studentSensors=Object.fromEntries(keys.map(key=>[key,Boolean(state.sensors[key]??INITIAL_SENSORS[key])]));
const configs={baseline:INITIAL_SENSORS,student:studentSensors};
const records={baseline:state.chapter1BaselineRun,student:state.chapter1StudentRun};
const revision=state.sensorRevision??0;
const $=id=>document.getElementById(id);
const canvas=$('motionCanvas'),renderer=new MotionRenderer(canvas);
const play=$('play');
const modes=document.querySelectorAll('[data-setup]');
let mode=baselineOnly?'baseline':'student',world=null,settled=false,recorded=null;
let prediction=null;
const guesses=document.querySelectorAll('[data-guess]');
const lanes=Object.fromEntries(['baseline','student'].map(setup=>{
  const lane=$(setup+'Lane');
  return [setup,{fill:lane.querySelector('b'),value:lane.querySelector('output')}];
}));
function setText(element,text){if(element.textContent!==text)element.textContent=text;}
const playback=createMotionPlayback({
  world:()=>world,
  draw,
  settled(){
    settled=true;
    readout();
  },
});

function saveCompletedRun() {
  const result=world.result;
  if(!result)return;
  // Distance and time lock first. The fall can complete during the remaining animation.
  if(recorded&&recorded.falls===result.falls&&recorded.collisions===result.collisions&&recorded.offTrack===result.offTrack)return;
  recorded=structuredClone(result);
  const record={conditions,result:recorded,sensorRevision:mode==='student'?revision:undefined};
  const patch=mode==='baseline'?{chapter1BaselineRun:record}:{chapter1StudentRun:record};
  records[mode]=record;
  storageNotice(save(patch));
}

function storedResult(setup) {
  const record=records[setup];
  if(setup==='student'&&record?.sensorRevision!==revision)return null;
  return record?.result
    && Object.entries(conditions).every(([key,value])=>record.conditions?.[key]===value)
    && sameSensors(record.result.sensors,configs[setup])?record.result:null;
}

function showResult(setup) {
  const output=$(setup+'Result');
  const result=setup===mode&&world.time>0?world.result:storedResult(setup);
  const name=setup==='student'?'我的配置':'初代机';
  const status=result
    ? `${result.success?'已过终点':'未通过'} · ${result.distance.toFixed(1)} / ${conditions.distance} m · ${result.time.toFixed(1)} 秒 · 摔倒 ${result.falls} 次`
    : setup===mode&&world.time>0?'试跑尚未结束':'尚未测试';
  const text=`${name} · ${status}`;
  if(output.textContent!==text)output.textContent=text;
  output.dataset.outcome=result?(result.success?'passed':'failed'):'pending';
  const measuring=setup===mode&&world.time>0;
  const distance=result?.distance??(measuring?Math.min(conditions.distance,world.progress):null);
  const lane=lanes[setup];
  lane.fill.style.width=`${(distance??0)/conditions.distance*100}%`;
  setText(lane.value,distance===null?'待测':`${distance.toFixed(1)} m`);
}

function readout() {
  const distance=world.result?.distance??Math.min(conditions.distance,world.progress);
  $('distance').textContent=`${distance.toFixed(1)} / ${conditions.distance} m`;
  const status=world.time===0?'等待起跑':STATE_NAMES[world.state];
  $('motionState').textContent=status;
  $('motionState').dataset.state=world.time===0?'ready':world.state;
  play.textContent=playback.running?'暂停':settled?'重新试跑':world.time>0?'继续试跑':'开始试跑';
  if(!baselineOnly)showResult('student');
  showResult('baseline');
  if(baselineOnly){
    for(const button of guesses)button.disabled=(playback.running||world.time>0)&&!settled;
    if(prediction&&world.result){
      const result=world.result,correct=(prediction==='pass')===result.success;
      $('verdict').hidden=false;
      setText($('verdict'),`${correct?'猜中了！':'结果揭晓：'}${result.success?'机器人冲过终点。':`跑到 ${result.distance.toFixed(1)} 米。`}`);
    }
  }else{
    const other=mode==='student'?'baseline':'student';
    const current=world.time>0?world.result:storedResult(mode),reference=storedResult(other);
    const delta=$('distanceDelta');delta.hidden=!(current&&reference);
    if(!delta.hidden){
      const difference=Number(((current.distance-reference.distance)*(mode==='student'?1:-1)).toFixed(1));
      setText(delta,difference===0?'两种配置跑出了相同距离。':`我的配置比初代机${difference>0?'多':'少'}跑了 ${Math.abs(difference).toFixed(1)} 米。`);
    }
  }
}

function draw() {
  // A student can leave as soon as the score is final, even while the robot is slowing down.
  saveCompletedRun();
  renderer.draw(world);
  readout();
}

function pause() {
  playback.pause();
  readout();
}

function reset() {
  playback.pause();
  world=createCurveTrial(configs[mode]);
  settled=false;
  recorded=null;
  prediction=null;
  $('verdict').hidden=true;
  for(const button of guesses)button.setAttribute('aria-pressed','false');
  draw();
}

$('trialModes').hidden=$('studentResult').hidden=baselineOnly;
$('prediction').hidden=!baselineOnly;
$('studentLane').hidden=baselineOnly;
for(const button of guesses)button.addEventListener('click',()=>{
  if(settled)reset();
  prediction=button.dataset.guess;
  for(const choice of guesses)choice.setAttribute('aria-pressed',String(choice===button));
});
function showSetup() {
  renderer.referenceDistance=mode==='student'?storedResult('baseline')?.distance:null;
  for(const button of modes)button.setAttribute('aria-pressed',String(button.dataset.setup===mode));
  const enabled=keys.filter(key=>configs[mode][key]).map(key=>SENSOR_NAMES[key]);
  $('installed').textContent=`本次使用：${enabled.join('、')||'无传感器'}`;
  reset();
}
for(const button of modes)button.addEventListener('click',()=>{
  if(mode===button.dataset.setup)return;
  mode=button.dataset.setup;
  showSetup();
});
play.addEventListener('click',()=>{
  if(playback.running){pause();return;}
  if(settled)reset();
  if(document.hidden||parentHidden)return;
  playback.start();
  readout();
});


let parentHidden=false;
document.addEventListener('coursevisibility',event=>{
  if(typeof event.detail!=='boolean')return;
  parentHidden=event.detail;
  if(parentHidden)pause();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
window.addEventListener('pagehide',pause);
if(!baselineOnly)window.addEventListener('storage',event=>{
  if(event.key!==COURSE_STATE_KEY)return;
  let latest;
  try{latest=JSON.parse(event.newValue);}catch{return;}
  if((latest?.sensorRevision??0)!==revision||!sameSensors(latest?.sensors,studentSensors)){
    pause();
    location.reload();
  }
});

renderer.resize();
showSetup();
new ResizeObserver(()=>{renderer.resize();renderer.draw(world);}).observe(canvas);
