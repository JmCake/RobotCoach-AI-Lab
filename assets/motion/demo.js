import {MotionWorld,DT,SCENES,STATE_NAMES,SENSOR_NAMES} from './world.js';
import {MotionRenderer} from './render.js';
const $=id=>document.getElementById(id),canvas=$('motionCanvas'),renderer=new MotionRenderer(canvas);
let world,running=false,slow=false,accumulator=0,last=0,paintReadout=0;
let lastSpeech=0,localVoice=null,voiceOn=true;
function stopSpeech(){window.speechSynthesis?.cancel();}
function narrate(text){
  if(!localVoice||!voiceOn)return;
  const utterance=new SpeechSynthesisUtterance(text);utterance.voice=localVoice;utterance.lang=localVoice.lang;utterance.rate=.95;
  stopSpeech();window.speechSynthesis.speak(utterance);
}
function findLocalVoice(){
  localVoice=window.speechSynthesis?.getVoices().find(v=>v.localService&&/^zh(?:[-_]|$)/i.test(v.lang))??null;
  $('voice').hidden=!localVoice;
}
function positionSpeech(){
  const bubble=$('robotSpeech'),anchor=renderer.speechAnchor;if(bubble.hidden||!anchor)return;
  const width=canvas.clientWidth,height=canvas.clientHeight,hx=anchor.x/renderer.width*width,hy=anchor.y/renderer.height*height;
  bubble.style.width=`${Math.min(width<650?254:280,width-24)}px`;bubble.classList.remove('side-right','side-left');
  let left=Math.max(12,Math.min(width-bubble.offsetWidth-12,hx-40)),top=hy-bubble.offsetHeight-32;
  // Standing runners have little room above their head. Put speech beside them rather than over their face.
  if(top<60){
    const right=width-hx-34,isRight=right>=hx-34,space=isRight?right:hx-34;
    bubble.style.width=`${Math.min(width<650?254:280,Math.max(130,space-12))}px`;
    left=isRight?hx+28:hx-bubble.offsetWidth-28;top=Math.max(60,Math.min(height-bubble.offsetHeight-45,hy-35));
    bubble.classList.add(isRight?'side-right':'side-left');
  }
  left=Math.max(12,Math.min(width-bubble.offsetWidth-12,left));
  bubble.style.left=`${left}px`;bubble.style.top=`${top}px`;bubble.style.setProperty('--tip',`${Math.max(20,Math.min(bubble.offsetWidth-25,anchor.x/renderer.width*width-left))}px`);
}
function paint(){renderer.draw(world);positionSpeech();}
function updateSpeech(){
  const feedback=world.finishFeedback??world.fallFeedback,bubble=$('robotSpeech');
  bubble.hidden=!feedback||!(world.done||world.time-feedback.time<9||['falling','fallen','recovering'].includes(world.state));
  if(!feedback)return;
  if($('fallMessage').textContent!==feedback.text)$('fallMessage').textContent=feedback.text;
  if(feedback.id!==lastSpeech){lastSpeech=feedback.id;if(running)narrate(feedback.text);}
  positionSpeech();
}
function create(){
  const seed=Number($('seed').value);
  if(!Number.isInteger(seed)||seed<0||seed>4294967295){$('seed').setCustomValidity('请输入 0 到 4294967295 之间的整数');$('seed').reportValidity();return false;}
  $('seed').setCustomValidity('');
  world=new MotionWorld({scene:document.querySelector('[data-scene][aria-pressed=true]').dataset.scene,seed,target:Number($('target').value),sensors:Object.fromEntries(Object.keys(SENSOR_NAMES).map(k=>[k,$(`sensor-${k}`).checked])),repeat:$('repeat').checked});
  accumulator=0;last=0;lastSpeech=0;stopSpeech();readout();paint();return true;
}
function setRunning(value){running=value;if(!value)stopSpeech();last=0;accumulator=0;$('play').textContent=value?'暂停':'继续奔跑';$('playState').textContent=value?(slow?'慢速观察':'正在运行'):'已暂停';readout();}
function reset(){setRunning(false);if(create()){$('play').textContent='开始奔跑';$('playState').textContent='准备就绪';$('event').textContent='试着完整跑过 40 m：不碰撞，不跑出跑道。';}}
function readout(){
  $('state').textContent=world.time===0?'待机':STATE_NAMES[world.state];$('speed').innerHTML=`${world.speed.toFixed(1)} <small>m/s</small>`;
  $('tilt').innerHTML=`${(Math.abs(world.theta)*180/Math.PI).toFixed(1)}<small>°</small>`;
  $('falls').innerHTML=`${world.falls} <small>次</small>`;$('distance').textContent=`${Math.min(world.courseDistance,world.progress).toFixed(1)} / ${world.courseDistance} m`;
  $('contact').textContent=['fallen','recovering'].includes(world.state)?'手掌 / 躯干':world.state==='falling'?'支撑丢失':world.y>.05?'腾空':world.contacts.every(Boolean)?'双足支撑':world.contacts[0]?'左足支撑':world.contacts[1]?'右足支撑':'换步腾空';
  $('event').textContent=world.event;
  const o=world.observation,c=world.control;
  $('reading-camera').textContent=o.camera?`可见 ${o.camera.range.toFixed(2)} m · ${o.camera.wet?'湿滑路面':'路面观测'}${Math.abs(o.camera.curve)>.08?' · 弯道':''}`:'已关闭 · 无视觉观测';
  $('reading-lidar').textContent=o.lidar?(o.lidar.obstacle?`${o.lidar.obstacle.type==='beam'?'横梁':'矮栏'} ${o.lidar.obstacle.distance.toFixed(1)} m`:'量程 7.5 m · 未测到障碍'):'已关闭 · 无测距观测';
  $('reading-imu').textContent=o.imu?`倾斜 ${(o.imu.tilt*180/Math.PI).toFixed(1)}° · 纠偏 ${c.torque.toFixed(2)}`:'已关闭 · 不作姿态纠偏';
  $('reading-force').textContent=o.contact?`触地 ${o.contact.feet.every(Boolean)?'双足':o.contact.feet[0]?'左足':o.contact.feet[1]?'右足':'无'} · 滑移 ${o.contact.slip.toFixed(2)} · 补偿 ${c.placement.toFixed(2)}`:'已关闭 · 无足底补偿';
  $('observations').textContent=`有效观测距离 ${o.range.toFixed(2)} m ｜ 控制限速 ${c.target.toFixed(1)} m/s · 纠偏力矩 ${c.torque.toFixed(2)} · 落脚补偿 ${c.placement.toFixed(2)}${o.obstacle?` · ${o.source}发现${o.obstacle.type==='beam'?'横梁':'矮栏'} ${o.obstacle.distance.toFixed(1)} m`:''}`;
  const report=world.result??world.previousResult;
  $('finishNotice').hidden=!report;
  if(report){
    $('finishNotice').classList.toggle('needs-retry',!report.success);
    $('resultTitle').textContent=report.success?'挑战完成 · 成功过线':world.result?'本轮失败 · 请回起点重试':`上次未通过 · 正在第 ${world.attempt} 次尝试`;
    $('resultDetail').textContent=`第 ${report.attempt} 次 · ${report.distance.toFixed(1)} / ${world.courseDistance} m · 碰撞 ${report.collisions} 次 · 摔倒 ${report.falls??0} 次${report.offTrack?' · 曾跑出跑道':''}`;
    $('nextScene').hidden=!world.result?.success||world.scene==='wet';
    if(world.result)$('playState').textContent=report.success?'已过终点':'本轮未通过';
  }
  updateSpeech();
}
document.querySelectorAll('[data-scene]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  const scene=button.dataset.scene;$('sceneName').textContent=SCENES[scene].name;$('sceneHint').textContent=SCENES[scene].hint;
  document.querySelector('.stage').classList.toggle('night',scene==='night');reset();
}));
$('play').addEventListener('click',()=>{
  if(world.done){
    if(!world.result.success){stopSpeech();world.restartAttempt();last=0;accumulator=0;readout();paint();}
    else reset();
    setRunning(true);
  }else setRunning(!running);
});$('reset').addEventListener('click',reset);
$('nextScene').addEventListener('click',()=>{const order=Object.keys(SCENES),next=order[order.indexOf(world.scene)+1];if(next)document.querySelector(`[data-scene="${next}"]`).click();});
$('teachingGuide').innerHTML=Object.entries(SCENES).map(([key,s])=>`<li><strong>${s.name}</strong><span>${s.recommended.map(k=>SENSOR_NAMES[k]).join(' + ')||'无需传感器'}</span><p>${s.focus}</p></li>`).join('');
$('slow').addEventListener('click',()=>{slow=!slow;$('slow').setAttribute('aria-pressed',String(slow));if(running)$('playState').textContent=slow?'慢速观察':'正在运行';});
function updateSensors(){
  for(const key of Object.keys(SENSOR_NAMES)){world.sensors[key]=$(`sensor-${key}`).checked;$(`sensor-${key}`).closest('.sensor').classList.toggle('disabled',!world.sensors[key]);}
  const count=Object.values(world.sensors).filter(Boolean).length;
  $('assist').checked=count===4;$('assist').indeterminate=count>0&&count<4;$('assistText').textContent=count===4?'全部开启':count===0?'全部关闭':`已开启 ${count}/4`;
  world.observation=world.observe();world.control=['running','unbalanced','stumbling'].includes(world.state)?world.decide(world.observation):world.control;
  if(world.result)world.control.target=0;
  if(world.result?.success){reset();return;}
  readout();paint();
}
$('assist').addEventListener('change',()=>{for(const k of Object.keys(SENSOR_NAMES))$(`sensor-${k}`).checked=$('assist').checked;updateSensors();});
for(const key of Object.keys(SENSOR_NAMES))$(`sensor-${key}`).addEventListener('change',updateSensors);
$('voice').addEventListener('click',()=>{voiceOn=!voiceOn;$('voice').setAttribute('aria-pressed',String(voiceOn));$('voice').textContent=`语音提示：${voiceOn?'开':'关'}`;if(!voiceOn)stopSpeech();else if(!$('robotSpeech').hidden)narrate((world.finishFeedback??world.fallFeedback).text);});
findLocalVoice();window.speechSynthesis?.addEventListener('voiceschanged',findLocalVoice);
$('repeat').addEventListener('change',()=>{world.repeat=$('repeat').checked;});
$('seed').addEventListener('input',()=>$('seed').setCustomValidity(''));$('seed').addEventListener('change',reset);
$('target').addEventListener('input',()=>{$('targetValue').textContent=`${Number($('target').value).toFixed(1)} m/s`;});$('target').addEventListener('change',reset);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&running)setRunning(false);});
window.addEventListener('pagehide',()=>setRunning(false));
new ResizeObserver(()=>{renderer.resize();if(world)paint();}).observe(canvas);
function frame(now){
  if(running&&last){
    accumulator+=Math.min((now-last)/1000,.1)*(slow?.35:1);
    while(accumulator>=DT){world.step();accumulator-=DT;}
    if(world.done&&((!world.result.success&&world.state==='fallen')||(world.speed<.04&&world.age>3))){running=false;last=0;accumulator=0;$('play').textContent=world.result.success?'再跑一次':'回起点重试';readout();}
  }
  last=now;paint();
  if(now-paintReadout>100){readout();paintReadout=now;}
  requestAnimationFrame(frame);
}
// Read-only diagnostic snapshot for tests and inspectable simulation evidence.
window.motionDemo={snapshot:()=>({scene:world.scene,seed:world.seed,time:world.time,x:world.x,speed:world.speed,phase:world.phase,state:world.state,theta:world.theta,falls:world.falls,collisions:world.collisions,totalCollisions:world.totalCollisions,previousResult:structuredClone(world.previousResult),attemptResults:structuredClone(world.attemptResults),repeat:world.repeat,passed:world.passed,jumpCount:world.jumpCount,landings:world.landings,lastLanding:structuredClone(world.lastLanding),running,assist:world.assist,compression:world.compression,attempt:world.attempt,progress:world.progress,finishX:world.finishX,result:structuredClone(world.result),sensors:{...world.sensors},control:{...world.control},observation:structuredClone(world.observation),fallFeedback:structuredClone(world.fallFeedback),finishFeedback:structuredClone(world.finishFeedback),history:structuredClone(world.history)})};
renderer.resize();create();if(matchMedia('(prefers-reduced-motion: reduce)').matches){slow=true;$('slow').setAttribute('aria-pressed','true');}requestAnimationFrame(frame);
