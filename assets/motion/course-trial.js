import {COURSE_STATE_KEY,INITIAL_SENSORS,load,sameSensors,save,storageNotice} from '../state.js';
import {MotionWorld,COURSE_DISTANCE,DEFAULT_SPEED,SCENES,SENSOR_NAMES,STATE_NAMES} from './world.js';
import {MotionRenderer} from './render.js';
import {createMotionPlayback} from './playback.js';

const conditions=Object.freeze({
  scene:'curve',seed:2026,distance:COURSE_DISTANCE,target:DEFAULT_SPEED,controller:'motion-rule-v1',
});
const keys=Object.keys(SENSOR_NAMES); // The course's 激光雷达 maps directly to motion's lidar/激光测距.
const baselineOnly=new URLSearchParams(location.search).get('mode')==='baseline';
const state=load();
const studentSensors=Object.fromEntries(keys.map(key=>[key,Boolean(state.sensors[key]??INITIAL_SENSORS[key])]));
const configs={baseline:INITIAL_SENSORS,student:studentSensors};
const records={baseline:state.chapter1BaselineRun,student:state.chapter1StudentRun};
const revision=state.sensorRevision??0;
const $=id=>document.getElementById(id);
const canvas=$('motionCanvas'),renderer=new MotionRenderer(canvas);
const play=$('play'),feedback=$('runFeedback');
const modes=document.querySelectorAll('[data-setup]');
let mode=baselineOnly?'baseline':'student',world=null,settled=false,recorded=false;
const playback=createMotionPlayback({
  world:()=>world,
  draw,
  settled(){
    settled=true;
    readout();
  },
});

function saveCompletedRun() {
  if(recorded||!world.done)return;
  recorded=true;
  const record={conditions,result:structuredClone(world.result),sensorRevision:mode==='student'?revision:undefined};
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
    ? `${result.success?'已过终点':`未通过 · ${result.reason}`} · ${result.distance.toFixed(1)} / ${conditions.distance} m · ${result.time.toFixed(1)} 秒 · 摔倒 ${result.falls} 次`
    : setup===mode&&world.time>0?'试跑尚未结束':'尚未测试';
  const text=`${name} · ${status}`;
  if(output.textContent!==text)output.textContent=text;
  output.dataset.outcome=result?(result.success?'passed':'failed'):'pending';
}

function readout() {
  const distance=world.result?.distance??Math.min(conditions.distance,world.progress);
  $('distance').textContent=`${distance.toFixed(1)} / ${conditions.distance} m`;
  const status=world.time===0?'等待起跑':STATE_NAMES[world.state];
  $('motionState').textContent=status;
  $('motionState').dataset.state=world.time===0?'ready':world.state;
  play.textContent=playback.running?'暂停':settled?'重新试跑':world.time>0?'继续试跑':'开始试跑';
  const text=(world.finishFeedback??world.fallFeedback)?.text;
  if(text){feedback.textContent=text;feedback.hidden=false;}
  if(!baselineOnly)showResult('student');
  showResult('baseline');
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
  world=new MotionWorld({...conditions,sensors:configs[mode],repeat:false});
  settled=false;
  recorded=false;
  feedback.hidden=true;
  draw();
}

$('trialModes').hidden=$('studentResult').hidden=$('demoEntry').hidden=baselineOnly;
$('conditions').textContent=`${SCENES[conditions.scene].name} · ${conditions.distance} m · 目标速度 ${conditions.target} m/s · 种子 ${conditions.seed} · 规则控制`;
function showSetup() {
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

const demo=new URL($('motionLink').href);
demo.search=new URLSearchParams({from:'book',scene:conditions.scene,sensors:keys.filter(key=>studentSensors[key]).join(',')});
$('motionLink').href=demo;

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
