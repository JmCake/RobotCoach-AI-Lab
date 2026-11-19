import {MotionWorld,DT,SCENES,STATE_NAMES} from './world.js';
import {MotionRenderer} from './render.js';
const $=id=>document.getElementById(id),canvas=$('motionCanvas'),renderer=new MotionRenderer(canvas);
let world,running=false,slow=false,accumulator=0,last=0,paintReadout=0;
function create(){
  const seed=Number($('seed').value);
  if(!Number.isInteger(seed)||seed<0||seed>4294967295){$('seed').setCustomValidity('请输入 0 到 4294967295 之间的整数');$('seed').reportValidity();return false;}
  $('seed').setCustomValidity('');
  world=new MotionWorld({scene:document.querySelector('[data-scene][aria-pressed=true]').dataset.scene,seed,target:Number($('target').value),assist:$('assist').checked,repeat:$('repeat').checked});
  accumulator=0;last=0;readout();renderer.draw(world);return true;
}
function setRunning(value){running=value;last=0;accumulator=0;$('play').textContent=value?'暂停':'继续奔跑';$('playState').textContent=value?(slow?'慢速观察':'正在运行'):'已暂停';readout();}
function reset(){setRunning(false);if(create()){$('play').textContent='开始奔跑';$('playState').textContent='准备就绪';$('event').textContent='点击开始，观察机器人的完整步态。';}}
function readout(){
  $('state').textContent=world.time===0?'待机':STATE_NAMES[world.state];$('speed').innerHTML=`${world.speed.toFixed(1)} <small>m/s</small>`;
  $('tilt').innerHTML=`${(Math.abs(world.theta)*180/Math.PI).toFixed(1)}<small>°</small>`;
  $('falls').innerHTML=`${world.falls} <small>次</small>`;$('distance').textContent=`${world.x.toFixed(1)} m`;
  $('contact').textContent=['fallen','recovering'].includes(world.state)?'手掌 / 躯干':world.state==='falling'?'支撑丢失':world.y>.05?'腾空':world.contacts.every(Boolean)?'双足支撑':world.contacts[0]?'左足支撑':world.contacts[1]?'右足支撑':'换步腾空';
  $('event').textContent=world.event;
  const o=world.observation,c=world.control;
  $('observations').textContent=`观测距离 ${o.range.toFixed(1)} m · ${o.imu?'姿态反馈已接入':'姿态反馈关闭'} · ${o.contact?'足底反馈已接入':'足底反馈关闭'} ｜ 控制限速 ${c.target.toFixed(1)} m/s · 纠偏力矩 ${c.torque.toFixed(2)} · 落脚补偿 ${c.placement.toFixed(2)}${o.obstacle?` · 前方${o.obstacle.type==='beam'?'横梁':'矮栏'} ${o.obstacle.distance.toFixed(1)} m`:''}`;
}
document.querySelectorAll('[data-scene]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  const scene=button.dataset.scene;$('sceneName').textContent=SCENES[scene].name;$('sceneHint').textContent=SCENES[scene].hint;
  document.querySelector('.stage').classList.toggle('night',scene==='night');reset();
}));
$('play').addEventListener('click',()=>setRunning(!running));$('reset').addEventListener('click',reset);
$('slow').addEventListener('click',()=>{slow=!slow;$('slow').setAttribute('aria-pressed',String(slow));if(running)$('playState').textContent=slow?'慢速观察':'正在运行';});
$('assist').addEventListener('change',()=>{world.assist=$('assist').checked;$('assistText').textContent=world.assist?'已开启':'已关闭';world.observation=world.observe();readout();renderer.draw(world);});
$('repeat').addEventListener('change',()=>{world.repeat=$('repeat').checked;});
$('seed').addEventListener('input',()=>$('seed').setCustomValidity(''));$('seed').addEventListener('change',reset);
$('target').addEventListener('input',()=>{$('targetValue').textContent=`${Number($('target').value).toFixed(1)} m/s`;});$('target').addEventListener('change',reset);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&running)setRunning(false);});
window.addEventListener('pagehide',()=>setRunning(false));
new ResizeObserver(()=>{renderer.resize();if(world)renderer.draw(world);}).observe(canvas);
function frame(now){
  if(running&&last){
    accumulator+=Math.min((now-last)/1000,.1)*(slow?.35:1);
    while(accumulator>=DT){world.step();accumulator-=DT;}
  }
  last=now;renderer.draw(world);
  if(now-paintReadout>100){readout();paintReadout=now;}
  requestAnimationFrame(frame);
}
// Read-only diagnostic snapshot for tests and inspectable simulation evidence.
window.motionDemo={snapshot:()=>({scene:world.scene,seed:world.seed,time:world.time,x:world.x,speed:world.speed,phase:world.phase,state:world.state,theta:world.theta,falls:world.falls,passed:world.passed,running,assist:world.assist,control:{...world.control},observation:structuredClone(world.observation),history:structuredClone(world.history)})};
renderer.resize();create();if(matchMedia('(prefers-reduced-motion: reduce)').matches){slow=true;$('slow').setAttribute('aria-pressed','true');}requestAnimationFrame(frame);
