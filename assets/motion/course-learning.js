import {load} from '../state.js';
import {lessonTrack,readLesson} from './imitation-lesson.js';
import {MOTION_ACTION,STATE_NAMES} from './world.js';
import {MotionRenderer} from './render.js';
import {createMotionPlayback} from './playback.js';
import {ACTION_NAMES,CONDITIONS,TEST_SEEDS,ruleAction} from './short-course.js';
import {COMPARISON_KEY,MODEL_KEY,MotionTrainer,compareFrozen,createModel,freezePolicy,readModel} from './short-learning.js';

const {forward,jump,duck}=MOTION_ACTION;
const mode=new URLSearchParams(location.search).get('mode');
const training=mode==='train',showcase=mode==='showcase',manual=!training&&!showcase;
const $=id=>document.getElementById(id);
const canvas=$('motionCanvas'),renderer=new MotionRenderer(canvas);
const play=$('play'),crouch=$('duck');
let parentHidden=false,queuedJump=false,ducking=false,settled=false;
let trainingFrame=null,comparisonFrame=null,dirty=false,stopAt=0;
let status='',comparisonStatus='',auditUpdate=-1;
const lesson=manual?readLesson(load().imitationLesson):null;
const coachJump=lesson?.samples.find(sample=>sample.action===jump);
let preview=lessonTrack(lesson?.moved),previewPolicy=null,report=null;
let modelRaw=manual?null:readStorage(MODEL_KEY);
let trainer=manual?null:new MotionTrainer(readModel(modelRaw));

function readStorage(key){
  try{return localStorage.getItem(key);}catch{return null;}
}
function writeStorage(key,value){
  try{localStorage.setItem(key,value);return true;}catch{
    status='浏览器无法保存本机记录。当前页面仍可继续，刷新后可能丢失。';
    return false;
  }
}
function setText(id,text){
  const el=$(id);
  if(el.textContent!==text)el.textContent=text;
}
function selectedPolicy(){
  if($('policy').value==='rule')return ruleAction;
  return freezePolicy($('policy').value==='before'?createModel():trainer.snapshot());
}
function manualAction(){
  if(queuedJump){queuedJump=false;return jump;}
  return ducking?duck:forward;
}
function displayEpisode(){return training?(trainer.episode??preview):preview;}
const playback=createMotionPlayback({
  world:()=>preview.world,
  step(world){
    if(preview.finished)world.step(forward);
    else preview.tick(manual?manualAction:previewPolicy);
  },
  draw:drawStage,
  settled(){settled=true;render();},
});

function visible(){return !document.hidden&&!parentHidden;}
function modelStamp(model){return JSON.stringify([model.training.randomSeed,model.updates,model.attempts,model.q]);}
function savedReport(){
  try{
    const stored=JSON.parse(readStorage(COMPARISON_KEY));
    if(stored?.stamp===modelStamp(trainer.snapshot())&&stored.report?.before?.runs?.length===TEST_SEEDS.length
      &&stored.report?.after?.runs?.length===TEST_SEEDS.length)return stored.report;
  }catch{}
  return null;
}

function pausePreview(){
  playback.pause();
  queuedJump=false;
}
function resetPreview(){
  pausePreview();
  preview=lessonTrack(lesson?.moved);
  ducking=false;
  settled=false;
}
function stopTraining(){
  if(trainingFrame!==null)cancelAnimationFrame(trainingFrame);
  trainingFrame=null;
}
function cancelComparison(message){
  if(comparisonFrame===null)return;
  cancelAnimationFrame(comparisonFrame);
  comparisonFrame=null;
  comparisonStatus=message;
}
function adoptModel(raw){
  stopTraining();
  cancelComparison('训练表已更新，请重新发起比较。');
  resetPreview();
  dirty=false;
  stopAt=0;
  modelRaw=raw;
  trainer=new MotionTrainer(readModel(raw));
  auditUpdate=-1;
  status='已同步另一标签页的人形训练记录。';
  if(showcase){
    report=savedReport();
    comparisonStatus='';
    showComparison();
  }
}
function syncModel(){
  const latest=readStorage(MODEL_KEY);
  if(latest===modelRaw)return;
  adoptModel(latest);
}
function persistTraining(){
  if(!dirty)return;
  const raw=readStorage(MODEL_KEY);
  if(raw!==modelRaw){adoptModel(raw);return;}
  const next=JSON.stringify(trainer.snapshot());
  if(writeStorage(MODEL_KEY,next)){modelRaw=next;dirty=false;}
}

function trainFrame(now){
  const deadline=performance.now()+7;
  for(let count=0;count<40&&trainer.learner.attempts<stopAt;count++){
    trainer.advance();
    dirty=true;
    if(performance.now()>=deadline)break;
  }
  if(trainer.learner.attempts>=stopAt){
    stopTraining();
    status='本批训练结束，可比较成绩。';
    persistTraining();
  }else{
    trainingFrame=requestAnimationFrame(trainFrame);
    if(now-lastSave>=250){
      lastSave=now;
      persistTraining();
    }
  }
  drawStage();
}
let lastSave=0;
const TRAIN_BATCH=300;
function toggleTraining(){
  if(trainingFrame!==null){
    stopTraining();
    status='训练已暂停，可继续本轮。';
    persistTraining();
  }else if(visible()){
    syncModel();
    if(trainer.learner.attempts>=stopAt)stopAt=trainer.learner.attempts+TRAIN_BATCH;
    status='训练中';
    trainingFrame=requestAnimationFrame(trainFrame);
  }
  drawStage();
}

function togglePreview(){
  if(playback.running){pausePreview();render();return;}
  if(!visible()||comparisonFrame!==null)return;
  if(showcase){syncModel();setComparisonView(false);}
  if(settled)resetPreview();
  if(preview.world.time===0&&showcase)previewPolicy=selectedPolicy();
  status='';
  playback.start();
  if(manual)canvas.focus({preventScroll:true});
  render();
}
function requestJump(){if(playback.running&&!preview.finished)queuedJump=true;}
function toggleDuck(){
  if(!playback.running||preview.finished)return;
  ducking=!ducking;
  render();
}

function row(parent,cells,heading=false){
  const tr=document.createElement('tr');
  cells.forEach((value,i)=>{
    const cell=document.createElement(heading&&i===0?'th':'td');
    if(heading&&i===0)cell.scope='row';
    cell.textContent=value;
    tr.append(cell);
  });
  parent.append(tr);
}
function renderTraining(){
  const {learner,history}=trainer;
  setText('attempts',String(learner.attempts));
  setText('updates',String(learner.updates));
  const latest=history.at(-1);
  setText('lastEpisode',latest?`上轮${latest.success?'完赛':'未通过'} · 跨过 ${latest.passed} 个`:'');
  $('reset').disabled=trainingFrame!==null;
  if(!$('trainingDetails').open||auditUpdate===learner.updates)return;
  auditUpdate=learner.updates;
  setText('exploration',`当前随机探索概率 ${(learner.epsilon*100).toFixed(1)}%`);
  if(latest?.rewards){
    const {pass,finish,failure,action}=latest.rewards;
    setText('rewardBreakdown',`上轮奖励构成 · 越障 ${pass} · 过线 ${finish} · 失败 ${failure} · 动作 ${action.toFixed(2)} · 合计 ${latest.reward.toFixed(2)}`);
  }else setText('rewardBreakdown','完成一轮后显示奖励构成。');
  const table=$('auditRows');
  table.replaceChildren();
  for(const item of learner.audit){
    row(table,[item.update,item.state,ACTION_NAMES[item.action],item.reward.toFixed(2),`${item.before.toFixed(2)} → ${item.after.toFixed(2)}`]);
  }
}

function setComparisonView(show){
  canvas.hidden=show;
  $('pairedTracks').hidden=!show;
  $('switchView').hidden=!report;
  $('switchView').setAttribute('aria-expanded',String(show));
  setText('switchView',show?'看跑道':'看同场对照');
}
$('switchView').onclick=()=>{
  pausePreview();
  setComparisonView($('pairedTracks').hidden);
  render();
};
function showComparison(){
  $('comparison').hidden=!report;
  setComparisonView(!!report);
  if(!report)return;
  const {before,after,updates}=report;
  setText('beforeTotal',`${before.successes} / ${before.count}`);
  setText('afterTotal',`${after.successes} / ${after.count}`);
  const tbody=$('comparisonRows');
  tbody.replaceChildren();
  for(const [label,metric] of [
    ['完赛轮数',x=>`${x.successes} / ${x.count}`],
    ['平均越障数',x=>x.meanPassed.toFixed(2)],
    ['平均距离',x=>x.meanDistance.toFixed(1)+' m'],
  ])row(tbody,[label,metric(before),metric(after)],true);
  const improved=after.successes>before.successes||after.meanPassed>before.meanPassed||after.meanDistance>before.meanDistance;
  comparisonStatus=`冻结 ${updates} 次更新时的策略 · 相同 20 个种子 · ${improved?'至少一项成绩提高':'本次未测到成绩提高'}`;
  const rounds=$('rounds');
  rounds.replaceChildren();
  const pairs=$('trackPairs');
  pairs.replaceChildren();
  for(const [i,run] of before.runs.entries()){
    const afterRun=after.runs[i],item=document.createElement('li');
    const describe=x=>`${x.reason} · ${x.distance.toFixed(1)} m · 跨过 ${x.passed} 个`;
    item.textContent=`种子 ${run.seed}｜前：${describe(run)}｜后：${describe(afterRun)}`;
    rounds.append(item);
    const button=document.createElement('button');
    button.type='button';
    button.setAttribute('aria-label',`第 ${i+1} 条赛道，种子 ${run.seed}`);
    for(const attempt of [run,afterRun]){
      const mark=document.createElement('span');
      mark.className=attempt.success?'cleared':'missed';
      mark.textContent=attempt.success?'✓':'×';
      mark.setAttribute('aria-hidden','true');
      button.append(mark);
    }
    button.onclick=()=>{
      for(const cell of pairs.children)cell.setAttribute('aria-pressed',String(cell===button));
      setText('pairReading',`种子 ${run.seed} · 训练前 ${run.distance.toFixed(1)} m（${run.reason}） · 训练后 ${afterRun.distance.toFixed(1)} m（${afterRun.reason}）`);
    };
    pairs.append(button);
  }
  pairs.firstElementChild?.click();
}

function startComparison(){
  if(comparisonFrame!==null||!visible())return;
  syncModel();
  pausePreview();
  const model=trainer.snapshot(),stamp=modelStamp(model),work=compareFrozen(model);
  report=null;
  $('comparison').hidden=true;
  setComparisonView(false);
  comparisonStatus='正在运行两份冻结策略。';
  function batch(){
    let step;
    const deadline=performance.now()+8;
    for(let i=0;i<100;i++){
      step=work.next();
      if(step.done||performance.now()>=deadline)break;
    }
    if(step.done){
      comparisonFrame=null;
      if(readStorage(MODEL_KEY)!==modelRaw){syncModel();return;}
      report=step.value;
      writeStorage(COMPARISON_KEY,JSON.stringify({stamp,report}));
      showComparison();
    }else comparisonFrame=requestAnimationFrame(batch);
    render();
  }
  comparisonFrame=requestAnimationFrame(batch);
  render();
}

function render(){
  const episode=displayEpisode(),world=episode.world;
  const result=world.result;
  setText('distance',`${(result?.distance??world.progress).toFixed(1)} / ${CONDITIONS.distance} m`);
  setText('passed',`越障 ${episode.result()?.passed??world.passed} 个`);
  const pose=world.y>.05?'腾空':world.crouch>.45?'下蹲':'';
  setText('motionState',world.time===0?'等待起跑':result?STATE_NAMES[world.state]:pose||STATE_NAMES[world.state]);
  $('motionState').dataset.state=world.time===0?'ready':world.state;
  const sensed=episode.observe().obstacle;
  setText('sensed',sensed&&sensed.distance>=0
    ? `${sensed.source==='lidar'?'激光测距':'摄像头'} · ${sensed.type==='beam'?'横梁':'矮栏'} ${sensed.distance.toFixed(1)} m`
    : '');
  $('sensed').hidden=!sensed||sensed.distance<0;
  const outcome=result?(result.success?'已过终点':'未通过'):'';
  const action=episode.rejected?'腾空中，未重复起跳':`动作 · ${ACTION_NAMES[episode.action]}`;
  const feedback=status||(training?'':outcome||(world.time>0?action:coachJump?`教练在距第一栏 ${coachJump.distance.toFixed(1)} 米时起跳。`:''));
  setText('feedback',feedback);
  $('feedback').hidden=!feedback;
  $('feedback').dataset.outcome=result?(result.success?'passed':'failed'):'pending';
  $('feedback').dataset.action=String(episode.action);
  crouch.setAttribute('aria-pressed',String(ducking));
  $('jump').disabled=crouch.disabled=!playback.running||preview.finished;
  play.disabled=comparisonFrame!==null;
  setText('play',training?(trainingFrame!==null?'暂停训练':(trainer.learner.updates?'继续训练':'开始训练')):
    (playback.running?'暂停':settled?'重新试跑':world.time>0?'继续':'开始'));
  if(training)renderTraining();
  if(showcase){
    $('compare').disabled=comparisonFrame!==null;
    $('cancelCompare').hidden=comparisonFrame===null;
    $('policy').disabled=playback.running||comparisonFrame!==null;
    setText('roles',$('policy').value==='rule'
      ? '预览中，规则参考决定越障动作。底层规则仍负责速度、姿态和落脚。'
      : '学习策略决定前进、跳跃或下蹲。规则控制负责速度、姿态和落脚。');
    setText('comparisonStatus',comparisonStatus||`已更新 ${trainer.learner.updates} 次。对照时暂停学习和探索。`);
  }
}
function drawStage(){
  renderer.draw(displayEpisode().world);
  render();
}
function hide(){
  pausePreview();
  cancelComparison('比较已暂停，可重新比较。');
  if(training&&trainingFrame!==null){
    stopTraining();
    status='训练已暂停，可继续。';
    persistTraining();
  }
  render();
}

$('frozen').hidden=!showcase;
$('training').hidden=!training;
$('retry').hidden=training;
$('jump').hidden=crouch.hidden=!manual;
setText('conditions',`越障短道 · ${CONDITIONS.distance} m · 目标速度 ${CONDITIONS.target} m/s · 摄像头、激光测距、IMU、足底力觉`);
setText('roles',manual?'你决定前进、跳跃或下蹲。规则控制负责速度、姿态和落脚。':
  '学习策略决定前进、跳跃或下蹲。规则控制负责速度、姿态和落脚。');
play.addEventListener('click',training?toggleTraining:togglePreview);
$('retry').addEventListener('click',()=>{resetPreview();status='';drawStage();});
$('jump').addEventListener('click',requestJump);
crouch.addEventListener('click',toggleDuck);
if(manual)document.addEventListener('keydown',event=>{
  if(!playback.running||event.repeat)return;
  if(event.key==='ArrowUp'||(event.code==='Space'&&!event.target.closest?.('button,a,summary'))){
    event.preventDefault();requestJump();
  }else if(event.key==='ArrowDown'){
    event.preventDefault();toggleDuck();
  }
});
$('trainingDetails').addEventListener('toggle',()=>{if(training)renderTraining();});
$('reset').addEventListener('click',()=>{
  if(trainingFrame!==null)return;
  syncModel();
  trainer=new MotionTrainer();
  auditUpdate=-1;
  stopAt=0;
  dirty=true;
  status='已清空人形短道的学习记录。';
  persistTraining();
  drawStage();
});
$('compare').addEventListener('click',startComparison);
$('cancelCompare').addEventListener('click',()=>{cancelComparison('已取消比较。');render();});
$('policy').addEventListener('change',()=>{resetPreview();status='';drawStage();});
document.addEventListener('coursevisibility',event=>{
  if(typeof event.detail!=='boolean')return;
  parentHidden=event.detail;
  if(parentHidden)hide();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)hide();});
window.addEventListener('pagehide',hide);
if(!manual)window.addEventListener('storage',event=>{
  if(event.key!==MODEL_KEY&&event.key!==null)return;
  syncModel();
  drawStage();
});
if(showcase){report=savedReport();showComparison();}
renderer.resize();
drawStage();
new ResizeObserver(()=>{renderer.resize();renderer.draw(displayEpisode().world);}).observe(canvas);
