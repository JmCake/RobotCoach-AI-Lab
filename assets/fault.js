import {load,save,storageNotice} from './state.js';
const state={...load().fault},$=id=>document.getElementById(id),canvas=$('canvas'),robot=$('robot');let running=false,raf=0;
const nodes={sense:$('nodeSense'),decision:$('nodeDecision'),action:$('nodeAction')},labels={sense:'感知',decision:'决策',action:'行动',loop:'反馈回路'};
function update(){for(const [k,label] of Object.entries(labels)){const on=state[k+'On'];const b=$('close'+k[0].toUpperCase()+k.slice(1));b.textContent=on?'×':'✓';b.classList.toggle('off',!on);b.setAttribute('aria-label',(on?'关闭':'恢复')+label);b.setAttribute('aria-pressed',!on);if(nodes[k])nodes[k].classList.toggle('off',!on);}
 $('arr1').classList.toggle('broken',!state.senseOn||!state.decisionOn);$('arr2').classList.toggle('broken',!state.decisionOn||!state.actionOn);$('arr3').classList.toggle('broken',!state.actionOn||!state.loopOn||!state.senseOn);
 const off=Object.keys(labels).filter(k=>!state[k+'On']).map(k=>labels[k]);document.querySelector('.btm-hint').textContent=off.length?'已关闭：'+off.join('、'):'四个环节完整，点击运行观察闭环。';
 storageNotice(save({fault:state}));
}
function stop(){running=false;cancelAnimationFrame(raf);robot.style.display='none';$('btnRun').disabled=false;}
function toggle(k){stop();state[k+'On']=!state[k+'On'];$('videoArea').hidden=true;$('video').pause();update();$('feedback').textContent=(state[k+'On']?'已恢复':'已关闭')+labels[k]+'，点击运行查看影响。';}
window.toggleNode=toggle;window.toggleLoop=()=>toggle('loop');window.resetAll=()=>{stop();for(const k of Object.keys(labels))state[k+'On']=true;update();$('videoArea').hidden=true;$('video').pause();$('feedback').textContent='完整闭环已恢复。';};
const failures={sense:['感知关闭：没有环境信息，机器人无法发现障碍。','sense'],decision:['决策关闭：收到了图像，但没有动作判断。','decision'],action:['行动关闭：已经作出判断，执行器却没有动作。','action'],loop:['反馈回路断开：只应对了一次，无法再次观察环境变化。','loop']};
function result(failure){stop();if(failure){const [text,file]=failures[failure];$('feedback').textContent=text;$('video').src='../assets/videos/'+file+'.webm';$('videoArea').hidden=false;$('video').load();}else{$('feedback').textContent='闭环连续运行两圈：感知 → 决策 → 行动 → 再感知。';$('videoArea').hidden=true;}}
window.runSimulation=()=>{if(running)return;running=true;$('btnRun').disabled=true;$('videoArea').hidden=true;$('video').pause();robot.style.display='block';let seg=0,elapsed=0,last=performance.now();const order=['sense','decision','action','loop','sense','decision','action','loop'];
 const center=k=>{const r=nodes[k].getBoundingClientRect(),c=canvas.getBoundingClientRect();return{x:r.left+r.width/2-c.left,y:r.top+r.height/2-c.top};};
 function tick(now){if(!running)return;const k=order[seg];if(!state[k+'On'])return result(k);elapsed+=Math.min(now-last,80);last=now;const from=k==='loop'?'action':k,to=k==='sense'?'decision':k==='decision'?'action':k==='action'?'action':'sense',a=center(from),b=center(to),p=Math.min(elapsed/650,1);robot.style.left=a.x+(b.x-a.x)*p+'px';robot.style.top=a.y+(b.y-a.y)*p+'px';$('feedback').textContent='信息正在通过：'+labels[k];if(p===1){elapsed=0;if(++seg===order.length)return result(null);}raf=requestAnimationFrame(tick);}
 raf=requestAnimationFrame(tick);
};
update();$('feedback').textContent='关闭一个环节后运行，比较故障与完整闭环。';
document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();$('video').pause()}});document.addEventListener('coursevisibility',e=>{if(e.detail){stop();$('video').pause()}});window.addEventListener('pagehide',stop);
