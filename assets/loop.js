import {load,save,storageNotice} from './state.js';
import {makeRobot} from './robot-dom.js';
import {FAULT_NAMES,FAULT_MESSAGES} from './loop-faults.js';

const saved=load(),cached=saved.loop,$=id=>document.getElementById(id),canvas=$('canvas'),btn=$('submitBtn');
const steps=['sense','decision','action'];
const icons={sense:'👁️',decision:'🧠',action:'⚡'};
const faultButtons=[...document.querySelectorAll('[data-fault]')];
const modules=[...document.querySelectorAll('[data-module]')];
const clip=$('faultClip'),video=$('faultVideo');
const S={placed:{},fault:{...saved.fault},linked:false,phase:'linear',selected:null,fromAction:false,running:false,raf:0,robot:null};

function persist(){
  const placed=Object.fromEntries(Object.entries(S.placed).map(([key,node])=>[key,node.dataset.type]));
  storageNotice(save({loop:{placed,linked:S.linked}}));
}
function say(text){$('feedback').textContent=text;}
function enabled(key){return S.fault[key+'On']!==false;}
function assembled(){return steps.every(key=>S.placed[key]?.dataset.type===key);}
function keyClick(el){
  el.tabIndex=0;el.role='button';
  el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}});
}
function snap(node,target){
  const tr=target.getBoundingClientRect(),cr=canvas.getBoundingClientRect();
  node.style.left=tr.left-cr.left+'px';node.style.top=tr.top-cr.top+'px';
}
function place(type,target,restoring=false){
  if(S.running||S.phase!=='linear'||!steps.includes(type))return;
  if(Object.values(S.placed).some(node=>node.dataset.type===type)){
    say('这个模块已经放入；点击图中模块可取回。');return;
  }
  if(S.placed[target]){say('这个位置已有模块；先点击取回。');return;}
  const node=document.createElement('div');
  node.className='node '+type;node.dataset.type=type;
  node.innerHTML=`<div class="ni">${icons[type]}</div><div class="nl">${FAULT_NAMES[type]}</div>`;
  keyClick(node);
  node.onclick=()=>{
    if(S.phase==='ready'){toggleFault(type);return;}
    if(S.running)return;
    if(S.phase==='connect')connect(type);
    else{node.remove();delete S.placed[target];sync();persist();}
  };
  S.placed[target]=node;
  canvas.append(node);
  if(restoring)return;
  sync();persist();
  say(`已放入${FAULT_NAMES[type]}。${Object.keys(S.placed).length===3?'点击运行验证顺序。':'继续放入下一个模块。'}`);
}

function sync(){
  for(const [i,key] of steps.entries()){
    const target=$('dt'+(i+1)),node=S.placed[key];
    target.className='dt '+(S.phase==='linear'?'p':'t')+(i+1);
    target.classList.toggle('filled',!!node);
    target.textContent=node?'':String(i+1);
    target.tabIndex=node?-1:0;
    if(node){
      snap(node,target);
      const off=S.linked&&!enabled(node.dataset.type);
      node.classList.toggle('fault-off',off);
      node.setAttribute('aria-label',`${FAULT_NAMES[node.dataset.type]}模块${off?'，已关闭':''}`);
    }
  }
  for(const module of modules){
    module.classList.toggle('used',Object.values(S.placed).some(node=>node.dataset.type===module.dataset.module));
    module.classList.toggle('selected',module.dataset.module===S.selected);
  }
  for(const id of ['la1','la2'])$(id).classList.toggle('off',S.phase!=='linear');
  const interrupted=[!enabled('sense')||!enabled('decision'),!enabled('decision')||!enabled('action'),
    !enabled('action')||!enabled('loop')||!enabled('sense')];
  for(const [i,id] of ['ta1','ta2','ta3'].entries()){
    const edge=$(id);
    edge.classList.toggle('off',S.phase==='linear');
    edge.classList.toggle('on',S.phase!=='linear');
    edge.classList.toggle('broken',S.linked&&interrupted[i]);
  }
  $('ta3').classList.toggle('wait',S.phase==='connect');
  $('progFill').style.width=Object.keys(S.placed).length/3*100+'%';
  $('modeTag').textContent=S.linked?(interrupted.some(Boolean)?'回路已断开':'回路已闭合'):S.phase==='connect'?'连接反馈':'按顺序组装';
  $('modules').hidden=$('assemblyProgress').hidden=$('builderTitle').hidden=S.linked;
  $('faultTests').hidden=!S.linked;
  for(const button of faultButtons){
    const key=button.dataset.fault,on=enabled(key);
    button.textContent=(on?'关闭':'恢复')+FAULT_NAMES[key];
    button.setAttribute('aria-pressed',String(!on));
  }
  btn.disabled=S.phase==='connect'||Object.keys(S.placed).length<3;
  btn.textContent=S.running?'暂停':S.linked?'运行闭环':'运行';
}

function connect(type){
  if(!S.fromAction){
    if(type!=='action')return say('先点击「行动」，再点击「感知」。');
    S.fromAction=true;S.placed.action.classList.add('pick');
    say('已选择行动，接下来点击感知。');return;
  }
  if(type!=='sense')return say('请连接回「感知」。');
  S.linked=true;S.phase='ready';S.fromAction=false;
  S.placed.action.classList.remove('pick');
  persist();sync();
  say('行动已连接回感知。运行后可关闭环节做对比。');
}
function stop(keepRobot=false){
  S.running=false;cancelAnimationFrame(S.raf);
  if(!keepRobot){S.robot?.remove();S.robot=null;}
  sync();
}
function clearClip(){video.pause();clip.hidden=true;clip.open=false;}
function toggleFault(key){
  if(!S.linked)return;
  stop();clearClip();
  S.fault[key+'On']=!enabled(key);
  storageNotice(save({fault:S.fault}));sync();
  say(`${enabled(key)?'已恢复':'已关闭'}${FAULT_NAMES[key]}。请再次运行。`);
}
function fail(key){
  stop(true);
  say(FAULT_MESSAGES[key]);
  video.src=`../assets/videos/${key}.webm`;
  clip.hidden=false;
}
function point(key){
  const rect=S.placed[key].getBoundingClientRect(),area=canvas.getBoundingClientRect();
  return {x:rect.left+rect.width/2-area.left,y:rect.top+rect.height/2-area.top};
}
function drawRobot(from,to,progress){
  S.robot.style.left=from.x+(to.x-from.x)*progress+'px';
  S.robot.style.top=from.y+(to.y-from.y)*progress+'px';
}
function run(){
  if(S.running){stop();say('已暂停。闭环连接与模块位置已保存。');return;}
  if(!assembled())return say('顺序还需要调整：感知 → 决策 → 行动。点击图中模块可取回重放。');
  clearClip();S.robot?.remove();
  S.running=true;S.robot=makeRobot();canvas.append(S.robot);
  drawRobot(point('sense'),point('sense'),0);
  let segment=0,elapsed=0,last=performance.now(),laps=0;
  say('信息正在通过：感知');
  function tick(now){
    if(!S.running)return;
    elapsed+=Math.min(now-last,60);last=now;
    const key=steps[segment];
    if(S.linked&&!enabled(key))return fail(key);
    const feedbackCut=S.linked&&key==='action'&&!enabled('loop');
    const next=feedbackCut?key:steps[(segment+1)%steps.length];
    const progress=Math.min(elapsed/700,1);
    drawRobot(point(key),point(next),progress);
    if(progress===1){
      if(feedbackCut)return fail('loop');
      elapsed=0;segment++;
      if(!S.linked&&segment===2){
        stop();S.phase='connect';sync();
        say('一次行动结束。要发现下一栏，依次点击「行动」「感知」。');return;
      }
      if(segment===steps.length){
        segment=0;laps++;
        say(`闭环已循环 ${laps} 次。`);
      }else say('信息正在通过：'+FAULT_NAMES[steps[segment]]);
    }
    S.raf=requestAnimationFrame(tick);
  }
  sync();S.raf=requestAnimationFrame(tick);
}

for(const module of modules){
  keyClick(module);
  module.onclick=()=>{S.selected=module.dataset.module;sync();say('已选择'+FAULT_NAMES[S.selected]+'，再点击图中的位置。');};
  module.ondragstart=e=>e.dataTransfer.setData('text/plain',module.dataset.module);
}
for(const target of document.querySelectorAll('.dt')){
  keyClick(target);
  target.setAttribute('aria-label','位置 '+target.id.slice(-1));
  target.onclick=()=>{if(S.selected)place(S.selected,target.dataset.target);else say('先选择一个模块。');};
  target.ondragover=e=>{e.preventDefault();target.classList.add('hover');};
  target.ondragleave=()=>target.classList.remove('hover');
  target.ondrop=e=>{e.preventDefault();target.classList.remove('hover');place(e.dataTransfer.getData('text/plain'),target.dataset.target);};
}
for(const button of faultButtons)button.onclick=()=>toggleFault(button.dataset.fault);
btn.onclick=run;
$('resetLoop').onclick=()=>{
  stop();clearClip();
  for(const node of Object.values(S.placed))node.remove();
  S.placed={};S.linked=false;S.phase='linear';S.selected=null;S.fromAction=false;
  for(const key of Object.keys(FAULT_NAMES))S.fault[key+'On']=true;
  storageNotice(save({fault:S.fault}));sync();persist();say('已清空，重新放入三个模块。');
};
for(const [target,type] of Object.entries(cached.placed||{}))if(steps.includes(target)&&steps.includes(type))place(type,target,true);
if(cached.linked&&assembled()){S.linked=true;S.phase='ready';}
sync();
say(S.linked?'上次的闭环已恢复，可直接运行。':'拖动模块，或先点击模块再点击位置。');
function pausePage(){stop();video.pause();}
window.addEventListener('resize',sync);
window.addEventListener('pagehide',pausePage);
document.addEventListener('visibilitychange',()=>{if(document.hidden)pausePage();});
document.addEventListener('coursevisibility',e=>{if(e.detail)pausePage();});
