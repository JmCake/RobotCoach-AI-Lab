import {lessonTrack,imitate,readLesson} from './motion/imitation-lesson.js';
import {MotionRenderer} from './motion/render.js';
import {ruleAction} from './motion/short-course.js';
import {DT,MOTION_ACTION} from './motion/world.js';
import {load,save,storageNotice} from './state.js';

const $=id=>document.getElementById(id);
const renderers=['first','second'].map(id=>new MotionRenderer($(id)));
const saved=readLesson(load().imitationLesson);
let samples=saved?.samples??[],moved=saved?.moved===true;
let first=lessonTrack(),second=null,phase='ready';
let raf=null,last=0,elapsed=0;

function remember(compared){
  storageNotice(save({imitationLesson:{version:2,samples,moved,compared}}));
}
function drawLane(renderer,count,course){
  renderer.draw(course.world);
  const action=course.world.y>.05?'跳跃':course.world.crouch>.45?'下蹲':'';
  const label=(course.finished?'':action)+'　'+course.world.passed+' / '+course.world.obstacles.length+' 关';
  if(count.textContent!==label)count.textContent=label;
}
function draw(){
  $('lanes').classList.toggle('compare',!!second);
  $('secondLane').hidden=!second;
  $('firstTitle').textContent=second?'没看示范':'教练示范';
  drawLane(renderers[0],$('firstCount'),first);
  if(second)drawLane(renderers[1],$('secondCount'),second);
}
function controls(){
  const active=phase==='demo'||phase==='compare';
  $('demo').disabled=active&&raf!==null;
  $('demo').textContent=active&&raf===null?'继续演示':samples.length?'重看教练示范':'看教练示范，再试跑';
  $('change').hidden=!samples.length||active;
  $('change').textContent=moved?'恢复栏位再试':'移近第一栏再试';
}
function startComparison(){
  first=lessonTrack(moved);second=lessonTrack(moved);phase='compare';
  $('feedback').hidden=false;
  $('feedback').textContent=moved?'第一栏移近 2 米，再比一次。':'同一条短道，比一比越障数。';
}
function compareStep(){
  if(!first.finished)first.tick(()=>MOTION_ACTION.forward);
  if(!second.finished)second.tick(o=>imitate(samples,o));
}
function showResult(){
  phase='result';
  $('feedback').textContent='下一页换你来跑，栏架位置相同。';
}
function step(){
  if(phase==='demo'){
    first.tick(o=>{
      const action=ruleAction(o);
      samples.push({type:o.obstacle?.type??null,distance:o.obstacle?.distance??0,speed:o.speed,support:o.support,action});
      return action;
    });
    if(first.finished){remember(false);startComparison();}
  }else{
    compareStep();
    if(first.finished&&second.finished){showResult();remember(true);}
  }
}
function tick(now){
  elapsed+=Math.min((now-last)/1000,.1);last=now;
  while(elapsed>=DT&&phase!=='result'){elapsed-=DT;step();}
  draw();
  raf=phase==='result'?null:requestAnimationFrame(tick);
  controls();
}
function play(){
  last=performance.now();elapsed=0;
  raf=requestAnimationFrame(tick);controls();draw();
}
function pause(){
  if(raf===null)return;
  cancelAnimationFrame(raf);raf=null;controls();
}
$('demo').onclick=()=>{
  $('feedback').hidden=false;
  if(phase!=='demo'&&phase!=='compare'){
    moved=false;first=lessonTrack();second=null;samples=[];phase='demo';
    storageNotice(save({imitationLesson:null}));
    $('feedback').textContent='留意教练在哪里起跳，在哪里下蹲。';
  }
  play();
};
$('change').onclick=()=>{
  moved=!moved;remember(false);startComparison();play();
};
document.addEventListener('coursevisibility',e=>{if(e.detail)pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
window.addEventListener('pagehide',pause);
if(saved?.compared){
  startComparison();
  while(!first.finished||!second.finished)compareStep();
  showResult();
}else if(saved){startComparison();}else $('feedback').hidden=true;
draw();controls();
for(const renderer of renderers){
  new ResizeObserver(()=>{
    if(!renderer.canvas.clientWidth)return;
    renderer.resize();draw();
  }).observe(renderer.canvas);
}
