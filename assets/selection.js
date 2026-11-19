import {load,save,storageNotice} from './state.js';
import {sensors,sensorButtons} from './sensors.js';
import {drawStadium} from './stadium.js';
const state=load(),config=state.sensors,trial=new URLSearchParams(location.search).get('mode')==='trial';
const canvas=document.getElementById('track'),feedback=document.getElementById('feedback'),run=document.getElementById('run');
const motionEntry=document.getElementById('motionEntry'),motionLink=document.getElementById('motionLink');
motionEntry.hidden=!trial;
function updateMotionLink(){
 if(!trial)return;
 // The book is index.html in development and course.html in the Pages build.
 const back=window.parent.location.pathname.endsWith('/course.html')?'course.html':'index.html';
 const sensors=Object.entries(config).filter(([,enabled])=>enabled).map(([key])=>key).join(',');
 const params=new URLSearchParams({from:'book',back,scene:'curve',sensors});
 motionLink.href='../demo-motion.html?'+params;
}
document.getElementById('installArea').hidden=trial;
document.getElementById('trialArea').hidden=!trial;
run.hidden=!trial;
const T={cx:260,cy:190,leftX:155,rightX:365,curveR:90,halfW:24,get outerTop(){return this.cy-this.curveR-this.halfW},get outerBottom(){return this.cy+this.curveR+this.halfW},get innerTop(){return this.cy-this.curveR+this.halfW},get innerBottom(){return this.cy+this.curveR-this.halfW},get outerR(){return this.curveR+this.halfW},get innerR(){return this.curveR-this.halfW}};
let frame=0,raf=0,running=false,phase=0,robot={x:345,y:280},animState='ready',progress=0,startTime=0,lastTime=0;
const pathLength=420+Math.PI*180;
function draw(){drawStadium(canvas,{T,robot,phase,frame,animState});}
function update(){
 updateMotionLink();
 const list=document.getElementById('sensors');list.replaceChildren();sensorButtons(list,config,change);
 document.getElementById('installed').textContent='已安装：'+(Object.keys(config).filter(k=>config[k]).map(k=>sensors[k].name).join('、')||'无');
 const last=state.runs.at(-1);document.getElementById('stats').textContent=last?`上次：${last.label} · 演示运行 ${last.seconds} 秒`:'初代机参考：仅视觉，弯道判断偏差';
}
function change(id,value){if(running)return;config[id]=value;storageNotice(save({sensors:config}));update();feedback.textContent=`${value?'已安装':'已卸下'}${sensors[id].name}。${sensors[id].desc}`;}
const zone=document.getElementById('dropzone');zone.ondragover=e=>{e.preventDefault();zone.classList.add('over')};zone.ondragleave=()=>zone.classList.remove('over');zone.ondrop=e=>{e.preventDefault();zone.classList.remove('over');const id=e.dataTransfer.getData('text/plain');if(sensors[id])change(id,true);};
document.getElementById('reset').onclick=()=>{if(running)stop();Object.assign(config,{camera:true,lidar:false,imu:false,force:false});storageNotice(save({sensors:config}));progress=0;phase=0;robot={x:345,y:280};animState='ready';update();draw();feedback.textContent='恢复仅安装视觉摄像头的初代机配置，历史试跑对照仍保留。';};
function point(s){
 if(s<190){phase=0;return {x:345-s,y:280};}s-=190;
 if(s<Math.PI*90){phase=1;const a=Math.PI/2+s/90;return{x:155+90*Math.cos(a),y:190+90*Math.sin(a)};}s-=Math.PI*90;
 if(s<210){phase=2;return{x:155+s,y:100};}s-=210;phase=3;const a=-Math.PI/2+s/90;return{x:365+90*Math.cos(a),y:190+90*Math.sin(a)};
}
function stop(){running=false;cancelAnimationFrame(raf);run.disabled=false;run.textContent='重新试跑';document.getElementById('reset').disabled=false;for(const b of document.querySelectorAll('[data-sensor]'))b.disabled=false;}
function finish(label,reason){stop();animState=label==='完成一圈'?'done':'offtrack';if(label==='完成一圈')phase=4;draw();const result={sensors:{...config},label,reason,seconds:((performance.now()-startTime)/1000).toFixed(1)};state.runs.push(result);storageNotice(save({runs:state.runs.slice(-12)}));update();feedback.textContent=`${label}：${reason} 对照初代机：弯道偏离。`+(!config.camera?' 本次未安装视觉摄像头。':'');}
function tick(now){
 const dt=Math.min((now-lastTime)/1000,.04);lastTime=now;progress+=dt*125;frame++;
 robot=point(Math.min(progress,pathLength-1));
 if(!config.camera&&progress>85)return finish('停止前进','缺少路线图像，本教学控制逻辑无法继续识路');
 if(!config.lidar&&progress>175){robot.y-=20;return finish('弯道偏离','演示中的视觉距离估计有偏差，转向过早');}
 if(!config.imu&&progress>300){robot.x+=Math.sin(frame)*14;return finish('姿态不稳','已有测距信息，但演示控制缺少身体姿态反馈');}
 if(!config.force&&progress>760){robot.x+=24;return finish('颠簸失稳','能判断距离与姿态，但演示控制缺少脚底受力反馈');}
 if(progress>=pathLength)return finish('完成一圈','本演示的距离、姿态和触地信息得到互补；实际系统仍需验证控制与环境');
 draw();feedback.textContent=['直道：识别路线','左弯道：测距辅助转向','上直道：姿态反馈','右弯道：脚底受力反馈'][phase];
 raf=requestAnimationFrame(tick);
}
run.onclick=()=>{if(running)return;running=true;progress=0;frame=0;phase=0;animState='running';startTime=lastTime=performance.now();run.disabled=true;document.getElementById('reset').disabled=true;for(const b of document.querySelectorAll('[data-sensor]'))b.disabled=true;raf=requestAnimationFrame(tick);};
function pause(){if(running){stop();feedback.textContent='试跑已暂停；返回后可重新运行，配置与已完成结果已保留。';}}
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});document.addEventListener('coursevisibility',e=>{if(e.detail)pause()});window.addEventListener('pagehide',pause);
update();draw();feedback.textContent=trial?(state.runs.at(-1)?.reason||'点击开始试跑，观察你的配置；可在上方直接调整。'):'点选或拖入模块安装；再次点击可卸下。安装结果会带到下一页。';
