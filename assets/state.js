const KEY = 'robotcoach:v1';
const fresh = () => ({version:1,page:0,sensors:{camera:true,lidar:false,imu:false,force:false},discovered:[],runs:[],manualBest:0,loop:{placed:{},linked:false},fault:{senseOn:true,decisionOn:true,actionOn:true,loopOn:true},design:{scene:'校园',task:'递送物品',sensors:['camera'],training:'规则控制',feedback:'重新观察'}});
let memory;
export function load() {
  if(memory) return memory;
  const base=fresh();
  try {
    const saved=JSON.parse(localStorage.getItem(KEY));
    if(saved?.version===1) {
      Object.assign(base,saved);
      base.page=Number.isInteger(saved.page)?Math.max(0,Math.min(10,saved.page)):0;
      base.sensors={...fresh().sensors,...saved.sensors};
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
  try {const latest=JSON.parse(localStorage.getItem(KEY));if(latest?.version===1)Object.assign(memory,latest);}catch{}
  Object.assign(memory,patch);
  try {localStorage.setItem(KEY,JSON.stringify(memory));return true;} catch {return false;}
}
export function storageNotice(ok) {
  if(ok) return;
  let el=document.getElementById('storageNotice');
  if(!el){el=document.createElement('p');el.id='storageNotice';el.role='status';document.body.append(el);}
  el.textContent='浏览器无法保存数据；本次仍可操作，刷新后进度可能丢失。';
}
