import {INITIAL_SENSORS,load,save,storageNotice} from './state.js';
import {sensors,sensorButtons} from './sensors.js';

const state=load();
let config={...state.sensors},selected=null;
const found=new Set(state.discovered);
const list=document.getElementById('sensors');
const installed=document.getElementById('installed');
const feedback=document.getElementById('feedback');
const zone=document.getElementById('dropzone');
const mounts=[...zone.querySelectorAll('[data-mounted-sensor]')];
const spots=[...zone.querySelectorAll('[data-discover]')];
const toggle=document.getElementById('toggleSensor');
if (window.parent !== window) {
  const course = new URL(document.referrer || location.href);
  const entry = document.getElementById('visionLab');
  entry.search = course.pathname.endsWith('/course.html') ? '?from=course' : '?from=index';
}

function showModule(id){
  selected=id;
  found.add(id);
  const {name,desc}=sensors[id];
  document.getElementById('sensorTitle').textContent=name;
  document.getElementById('sensorDescription').textContent=desc;
}

function update(){
  const focused=list.contains(document.activeElement)?document.activeElement.dataset.sensor:null;
  list.replaceChildren();
  sensorButtons(list,config,changeModule);
  if(focused)list.querySelector(`[data-sensor="${focused}"]`)?.focus({preventScroll:true});
  for(const part of mounts)part.toggleAttribute('hidden',!config[part.dataset.mountedSensor]);
  for(const spot of spots){
    const id=spot.dataset.discover;
    spot.dataset.mounted=String(!!config[id]);
    spot.setAttribute('aria-pressed',String(selected===id));
  }
  const names=Object.keys(sensors).filter(key=>config[key]).map(key=>sensors[key].name);
  installed.textContent='已安装：'+(names.join('、')||'无');
  document.getElementById('foundSensors').textContent=`已认识 ${found.size} / 4 种感官`;
  toggle.hidden=selected===null;
  if(selected)toggle.textContent=`${config[selected]?'卸下':'安装'}${sensors[selected].name}`;
}

function change(next,message){
  config=next;
  storageNotice(save({sensors:config,discovered:[...found]}));
  update();
  feedback.textContent=message;
}

function changeModule(id,value){
  showModule(id);
  change({...config,[id]:value},`${value?'已安装':'已卸下'}${sensors[id].name}。`);
}
for(const spot of spots)spot.onclick=()=>{
  const id=spot.dataset.discover;
  showModule(id);
  storageNotice(save({discovered:[...found]}));
  update();
  feedback.textContent=`${config[id]?'已安装':'未安装'}${sensors[id].name}。`;
};
toggle.onclick=()=>{if(selected)changeModule(selected,!config[selected]);};

zone.ondragover=event=>{event.preventDefault();zone.classList.add('over');};
zone.ondragleave=()=>zone.classList.remove('over');
zone.ondrop=event=>{
  event.preventDefault();
  zone.classList.remove('over');
  const id=event.dataTransfer.getData('text/plain');
  if(Object.hasOwn(sensors,id))changeModule(id,true);
};
document.getElementById('reset').onclick=()=>{
  change({...INITIAL_SENSORS},'已恢复初代机配置：只安装视觉摄像头。');
};
update();
