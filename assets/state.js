export const COURSE_STATE_KEY = 'robotcoach:v1';
export const INITIAL_SENSORS=Object.freeze({camera:true,lidar:false,imu:false,force:false});
export function sameSensors(a,b) {
  return Object.keys(INITIAL_SENSORS).every(key=>Boolean(a?.[key]??INITIAL_SENSORS[key])===Boolean(b?.[key]??INITIAL_SENSORS[key]));
}
const fresh = () => ({version:1,page:0,sensors:{...INITIAL_SENSORS},sensorRevision:0,discovered:[],runs:[],manualBest:0,loop:{placed:{},linked:false},fault:{senseOn:true,decisionOn:true,actionOn:true,loopOn:true},design:{scene:'校园',task:'递送物品',sensors:['camera'],training:'规则控制',feedback:'重新观察'}});
let memory;
export function load() {
  if(memory) return memory;
  const base=fresh();
  try {
    const saved=JSON.parse(localStorage.getItem(COURSE_STATE_KEY));
    if(saved?.version===1) {
      Object.assign(base,saved);
      base.page=Number.isInteger(saved.page)?Math.max(0,Math.min(10,saved.page)):0;
      base.sensors={...INITIAL_SENSORS,...saved.sensors};
      base.runs=Array.isArray(saved.runs)?saved.runs.slice(-12):[];
      base.discovered=Array.isArray(saved.discovered)?saved.discovered.filter(x=>['camera','lidar','imu','force'].includes(x)):[];
      base.loop={...fresh().loop,...saved.loop}; base.fault={...fresh().fault,...saved.fault}; base.design={...fresh().design,...saved.design};
    }
  } catch { /* Broken or unavailable storage starts a usable session. */ }
  memory=base; return memory;
}
export function save(patch={}) {
  load();
  // Parent course and iframe have separate module instances. Merge the latest
  // stored document before writing so page navigation cannot revert an experiment.
  try {const latest=JSON.parse(localStorage.getItem(COURSE_STATE_KEY));if(latest?.version===1)Object.assign(memory,latest);}catch{}
  if(patch.sensors&&!sameSensors(patch.sensors,memory.sensors)){
    memory.sensorRevision=(memory.sensorRevision??0)+1;
    memory.chapter1StudentRun=null;
  }
  // A run in another tab may finish after the student installs or removes a module.
  if(patch.chapter1StudentRun&&patch.chapter1StudentRun.sensorRevision!==(memory.sensorRevision??0))return true;
  Object.assign(memory,patch);
  try {localStorage.setItem(COURSE_STATE_KEY,JSON.stringify(memory));return true;} catch {return false;}
}
export function storageNotice(ok) {
  if(ok) return;
  let el=document.getElementById('storageNotice');
  if(!el){el=document.createElement('p');el.id='storageNotice';el.role='status';document.body.append(el);}
  el.textContent='浏览器无法保存数据；本次仍可操作，刷新后进度可能丢失。';
}
