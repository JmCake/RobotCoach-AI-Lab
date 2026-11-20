import {INITIAL_SENSORS,load,save,storageNotice} from './state.js';
import {sensors,sensorButtons} from './sensors.js';

let config={...load().sensors};
const list=document.getElementById('sensors');
const installed=document.getElementById('installed');
const feedback=document.getElementById('feedback');
const zone=document.getElementById('dropzone');

function update(){
  list.replaceChildren();
  sensorButtons(list,config,(id,value)=>{
    change({...config,[id]:value},`${value?'已安装':'已卸下'}${sensors[id].name}。${sensors[id].desc}`);
  });
  const names=Object.keys(sensors).filter(key=>config[key]).map(key=>sensors[key].name);
  installed.textContent='已安装：'+(names.join('、')||'无');
}

function change(next,message){
  config=next;
  storageNotice(save({sensors:config}));
  update();
  feedback.textContent=message;
}

zone.ondragover=event=>{event.preventDefault();zone.classList.add('over');};
zone.ondragleave=()=>zone.classList.remove('over');
zone.ondrop=event=>{
  event.preventDefault();
  zone.classList.remove('over');
  const id=event.dataTransfer.getData('text/plain');
  if(Object.hasOwn(sensors,id))change({...config,[id]:true},`已安装${sensors[id].name}。${sensors[id].desc}`);
};
document.getElementById('reset').onclick=()=>{
  change({...INITIAL_SENSORS},'已恢复初代机配置：只安装视觉摄像头。');
};
const parentEntry=new URL(document.referrer||location.href);
if(parentEntry.origin===location.origin&&parentEntry.pathname.endsWith('/course.html')){
  document.getElementById('designLink').href='../course.html#design';
}
update();
