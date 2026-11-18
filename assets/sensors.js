export const sensors={
 camera:{icon:'📷',name:'视觉摄像头',desc:'识别路线和物体外观。画面模糊时，判断可能出现偏差。'},
 lidar:{icon:'📡',name:'激光雷达',desc:'测量与物体的距离，补充视觉难以判断的远近。'},
 imu:{icon:'🧭',name:'姿态传感器',desc:'测量加速度和转动，帮助判断身体是否倾斜。'},
 force:{icon:'🦶',name:'足底力觉传感器',desc:'测量脚底受力，帮助判断触地与支撑情况。'}
};
export function sensorButtons(container,config,onChange){
 for(const [id,data] of Object.entries(sensors)){
   const b=document.createElement('button');b.className='sensor-card';b.dataset.sensor=id;b.draggable=true;b.setAttribute('aria-pressed',!!config[id]);b.innerHTML=`<b>${data.icon} ${data.name}</b><span>${config[id]?'已安装 · 点击卸下':'点击或拖入安装'}</span>`;
   b.onclick=()=>onChange(id,!config[id]);b.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',id));container.append(b);
 }
}
