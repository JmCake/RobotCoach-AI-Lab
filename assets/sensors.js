export const sensors={
 camera:{icon:'📷',name:'视觉摄像头',desc:'识别路线和物体外观。画面模糊时，判断可能出现偏差。'},
 lidar:{icon:'📡',name:'激光雷达',desc:'测量与物体的距离，补充视觉难以判断的远近。'},
 imu:{icon:'🧭',name:'姿态传感器',desc:'测量加速度和转动，帮助判断身体是否倾斜。'},
 force:{icon:'🦶',name:'足底力觉传感器',desc:'测量脚底受力，帮助判断触地与支撑情况。'}
};
export function sensorButtons(container,config,onChange){
 for(const [id,data] of Object.entries(sensors)){
   const b=document.createElement('button');b.className='sensor-card';b.dataset.sensor=id;b.draggable=true;b.setAttribute('aria-pressed',!!config[id]);b.innerHTML=`<b>${data.icon} ${data.name}</b><span>${config[id]?'已安装 · 点击卸下':'点击或拖入安装'}</span>`;
   let drag=null,suppressClick=false;
   b.onclick=()=>{if(!suppressClick)onChange(id,!config[id]);suppressClick=false;};
   b.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',id);e.dataTransfer.effectAllowed='copy';b.classList.add('dragging');});
   b.addEventListener('dragend',()=>{b.classList.remove('dragging');document.getElementById('dropzone')?.classList.remove('over');});
   // Native HTML drag is unavailable on many phones; use pointer capture there.
   b.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||b.disabled)return;drag={x:e.clientX,y:e.clientY,moved:false};suppressClick=false;b.setPointerCapture(e.pointerId);});
   b.addEventListener('pointermove',e=>{if(!drag)return;drag.moved ||= Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8;if(!drag.moved)return;const zone=document.getElementById('dropzone'),r=zone?.getBoundingClientRect();b.classList.add('dragging');zone?.classList.toggle('over',!!r&&e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom);});
   b.addEventListener('pointerup',()=>{if(!drag)return;const zone=document.getElementById('dropzone'),install=drag.moved&&zone?.classList.contains('over');suppressClick=drag.moved;drag=null;b.classList.remove('dragging');zone?.classList.remove('over');if(install)onChange(id,true);});
   b.addEventListener('pointercancel',()=>{drag=null;suppressClick=true;b.classList.remove('dragging');document.getElementById('dropzone')?.classList.remove('over');});
   container.append(b);
 }
}
