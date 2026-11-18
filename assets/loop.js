import {load,save,storageNotice} from './state.js';
import {makeRobot} from './robot-dom.js';
const cached=load().loop,$=id=>document.getElementById(id),canvas=$('canvas'),btn=$('submitBtn');
const S={placed:{},linked:!!cached.linked,phase:cached.linked?'ready':'linear',selected:null,fromAction:false,running:false,raf:0,robot:null};
function persist(){storageNotice(save({loop:{placed:Object.fromEntries(Object.entries(S.placed).map(([k,v])=>[k,v.dataset.type])),linked:S.linked}}));}
const names={sense:'感知',decision:'决策',action:'行动'},icons={sense:'👁️',decision:'🧠',action:'⚡'};
function say(text){$('feedback').textContent=text;}
function keyClick(el){el.tabIndex=0;el.role='button';el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}});}
function snap(n,target){const tr=target.getBoundingClientRect(),cr=canvas.getBoundingClientRect();n.style.left=tr.left-cr.left+'px';n.style.top=tr.top-cr.top+'px';}
function place(type,target){
 if(S.running||S.phase!=='linear'||!names[type])return;
 if(Object.values(S.placed).some(n=>n.dataset.type===type)){say('这个模块已经放入；点击图中模块可取回。');return;}
 if(S.placed[target]){say('这个位置已有模块；先点击取回。');return;}
 const n=document.createElement('div');n.className='node '+type;n.dataset.type=type;n.setAttribute('aria-label',names[type]+'模块');n.innerHTML=`<div class="ni">${icons[type]}</div><div class="nl">${names[type]}</div>`;keyClick(n);
 n.onclick=()=>{if(S.running)return;if(S.phase==='connect')connect(type);else if(S.phase==='linear'){n.remove();delete S.placed[target];sync();persist();}};
 S.placed[target]=n;canvas.append(n);sync();persist();say(`已放入${names[type]}。${Object.keys(S.placed).length===3?'点击运行验证顺序。':'继续放入下一个模块。'}`);
}
function sync(){
 for(const [i,id] of ['sense','decision','action'].entries()){
  const dt=$('dt'+(i+1));dt.className='dt '+(S.phase==='linear'?'p':'t')+(i+1);dt.classList.toggle('filled',!!S.placed[id]);dt.textContent=S.placed[id]?'':String(i+1);
  if(S.placed[id])snap(S.placed[id],dt);
 }
 for(const m of document.querySelectorAll('.mod')){m.classList.toggle('used',Object.values(S.placed).some(n=>n.dataset.type===m.dataset.module));m.classList.toggle('selected',m.dataset.module===S.selected);}
 for(const id of ['la1','la2'])$(id).classList.toggle('off',S.phase!=='linear');
 for(const id of ['ta1','ta2','ta3']){$(id).classList.toggle('off',S.phase==='linear');$(id).classList.toggle('on',S.phase!=='linear');}
 $('ta3').classList.toggle('wait',S.phase==='connect');
 $('progFill').style.width=Object.keys(S.placed).length/3*100+'%';
 $('modeTag').textContent=S.linked?'回路已闭合':S.phase==='connect'?'连接反馈':'按顺序组装';
 btn.disabled=S.phase==='connect'||Object.keys(S.placed).length<3;btn.textContent=S.running?'暂停':S.linked?'运行闭环':'运行';
}
function connect(type){if(!S.fromAction){if(type!=='action')return say('先点击「行动」，再点击「感知」。');S.fromAction=true;S.placed.action.classList.add('pick');say('已选择行动，接下来点击感知。');}else{if(type!=='sense')return say('请连接回「感知」。');S.linked=true;S.phase='ready';S.fromAction=false;S.placed.action.classList.remove('pick');persist();sync();say('行动已连接回感知。运行后，机器人会持续观察、判断和行动。');}}
function stop(){S.running=false;cancelAnimationFrame(S.raf);S.robot?.remove();S.robot=null;sync();}
function run(){
 if(S.running){stop();say('已暂停。闭环连接与模块位置已保存。');return;}
 if(['sense','decision','action'].some(k=>S.placed[k]?.dataset.type!==k))return say('顺序还需要调整：感知 → 决策 → 行动。点击图中模块可取回重放。');
 S.running=true;S.robot=makeRobot();canvas.append(S.robot);let seg=0,elapsed=0,last=performance.now(),laps=0;
 function tick(now){if(!S.running)return;elapsed+=Math.min(now-last,60);last=now;const keys=['sense','decision','action'];const point=k=>{const r=S.placed[k].getBoundingClientRect(),c=canvas.getBoundingClientRect();return{x:r.left+r.width/2-c.left,y:r.top+r.height/2-c.top};};const a=point(keys[seg]),b=point(keys[(seg+1)%3]),p=Math.min(elapsed/700,1);S.robot.style.left=a.x+(b.x-a.x)*p+'px';S.robot.style.top=a.y+(b.y-a.y)*p+'px';
  if(p===1){elapsed=0;seg++;if(!S.linked&&seg===2){stop();S.phase='connect';sync();say('一次行动结束，但没有再观察。点击「行动」再点「感知」，把反馈连回来。');return;}if(seg===3){seg=0;laps++;say(`闭环已循环 ${laps} 次：行动改变环境，再感知提供新信息。`);}}
  S.raf=requestAnimationFrame(tick);
 }
 sync();S.raf=requestAnimationFrame(tick);
}
for(const m of document.querySelectorAll('.mod')){keyClick(m);m.onclick=()=>{S.selected=m.dataset.module;sync();say('已选择'+names[S.selected]+'，再点击图中的位置。');};m.ondragstart=e=>e.dataTransfer.setData('text/plain',m.dataset.module);}
for(const dt of document.querySelectorAll('.dt')){keyClick(dt);dt.setAttribute('aria-label','位置 '+dt.id.slice(-1));dt.onclick=()=>{if(S.selected)place(S.selected,dt.dataset.target);else say('先选择一个模块。');};dt.ondragover=e=>{e.preventDefault();dt.classList.add('hover')};dt.ondragleave=()=>dt.classList.remove('hover');dt.ondrop=e=>{e.preventDefault();dt.classList.remove('hover');place(e.dataTransfer.getData('text/plain'),dt.dataset.target);};}
btn.onclick=run;$('resetLoop').onclick=()=>{stop();for(const n of Object.values(S.placed))n.remove();S.placed={};S.linked=false;S.phase='linear';S.selected=null;sync();persist();say('已清空，重新放入三个模块。');};
for(const [target,type] of Object.entries(cached.placed||{}))if(names[target]&&names[type]){const phase=S.phase;S.phase='linear';place(type,target);S.phase=phase;}
if(Object.keys(S.placed).length<3){S.phase='linear';S.linked=false;}
sync();say(S.linked?'上次的闭环已恢复，可直接运行。':'拖动模块，或先点击模块再点击位置。');
window.addEventListener('resize',sync);window.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});document.addEventListener('coursevisibility',e=>{if(e.detail)stop()});
