import {Runner,Learner} from './learning.js';
import {comparePolicies} from './evaluation.js';
import {load,save,storageNotice} from './state.js';
import {drawRunner} from './runner-render.js';
const mode=new URLSearchParams(location.search).get('mode')||'manual',training=mode==='train',manual=mode==='manual';
const KEY='robotcoach:q:v1';let data={};try{data=JSON.parse(localStorage.getItem(KEY))||{};}catch{}
const learner=new Learner(data),world=new Runner();
const $=id=>document.getElementById(id),canvas=$('game');
let playing=false,raf=0,last=0,acc=0,duck=false,keyDuck=false,jumpUntil=0,lastSave=0,lastStats=0,chartAttempt=-1,auditUpdate=-1,comparisonTask=0,comparisonRaf=0;
const text=(id,value)=>{const el=$(id),next=String(value);if(el.textContent!==next)el.textContent=next;};
$('modeLabel').textContent=manual?'人工操控':training?'Q-learning · 自主试错':'冻结策略 · 成果展示';
for(const id of ['jump','duck'])$(id).hidden=!manual;
$('speedLabel').hidden=!training;$('reset').hidden=!training;$('trainingStats').hidden=manual;$('chart').hidden=manual;$('history').hidden=manual;$('learningPanel').hidden=manual;
function persist(){if(!training)return;try{localStorage.setItem(KEY,JSON.stringify(learner.snapshot()));}catch{storageNotice(false);}}
function stats(){
 text('score',world.score);text('passed',world.passed);text('attempts',learner.attempts);text('updates',learner.updates);text('epsilon',training?(learner.epsilon*100).toFixed(1)+'%':'0%（展示）');text('best',learner.best);
 $('duck').setAttribute('aria-pressed',duck||keyDuck);
 if(manual)return;
 if(learner.comparison&&learner.comparison.updates!==learner.updates&&!$('compare').disabled&&!$('comparisonStatus').textContent.includes('已有新更新'))renderComparison();
 if(chartAttempt!==learner.attempts){
  chartAttempt=learner.attempts;
  const h=learner.history.slice(-5);text('history',h.length?'最近轮次：'+h.map(x=>`第${x.attempt}轮 ${x.score}分 / 跨过${x.passed}个 / 奖励${x.reward} / ${x.reason||'旧记录'}`).join('；'):'尚无已完成训练轮次；不会预设成功结果。');
  const recent=learner.history.filter(x=>x.rewardVersion===2),tail=recent.slice(-10),head=recent.slice(0,10);
  const mean=list=>(list.reduce((sum,x)=>sum+x.passed,0)/list.length).toFixed(2);
  text('trend',tail.length?`最近 ${tail.length} 轮：完整跑完 ${tail.filter(x=>x.success).length}，地面碰撞 ${tail.filter(x=>x.reason==='撞上地面障碍').length}，横梁碰撞 ${tail.filter(x=>x.reason==='碰到横梁').length}。平均跨障碍：保留最早 ${head.length} 轮 ${mean(head)} → 最近 ${tail.length} 轮 ${mean(tail)}（含探索）。`:'保留最近 150 轮。先训练，再比较；V1.0 的历史与 Q 表会保留，旧奖励记录不混入新趋势。');
  const latest=recent.at(-1);text('rewardBreakdown',latest?.rewards?`第 ${latest.attempt} 轮奖励构成：跨障碍 ${latest.rewards.pass.toFixed(2)}，碰撞 ${latest.rewards.collision.toFixed(2)}，完成 ${latest.rewards.complete.toFixed(2)}，动作成本 ${latest.rewards.action.toFixed(3)}；合计 ${latest.reward}。`:'完成一轮后显示真实奖励构成。');
  drawChart();
 }
 if($('learningPanel').querySelector('details').open&&auditUpdate!==learner.updates){
  auditUpdate=learner.updates;$('auditRows').replaceChildren();
  for(const x of learner.audit){const row=document.createElement('tr');for(const value of [x.update,`${x.state} → ${x.next}${x.terminal?'（终止）':''}`,['等待','跳跃','下蹲'][x.action],x.reward.toFixed(3),`${x.before.toFixed(3)} → ${x.after.toFixed(3)}`]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}$('auditRows').append(row);}
 }
}
$('learningPanel').querySelector('details').addEventListener('toggle',stats);
function drawChart(){
 const c=$('chart'),width=Math.max(250,c.getBoundingClientRect().width),scale=Math.min(devicePixelRatio||1,2),ctx=c.getContext('2d'),h=learner.history.filter(x=>x.rewardVersion===2).slice(-40);
 c.width=Math.round(width*scale);c.height=100*scale;ctx.setTransform(scale,0,0,scale,0,0);ctx.fillStyle='#b7c5da';ctx.font='12px system-ui';ctx.fillText('累计奖励 · 最近 40 轮',10,18);if(!h.length)return;
 const min=Math.min(0,...h.map(x=>x.reward)),max=Math.max(1,...h.map(x=>x.reward));ctx.strokeStyle='#71d7b0';ctx.lineWidth=2;ctx.beginPath();h.forEach((p,i)=>{const x=15+i*(width-30)/Math.max(1,h.length-1),y=85-(p.reward-min)/(max-min)*55;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();
}
window.addEventListener('resize',()=>{if(!manual)drawChart();});
function paint(){drawRunner(canvas,world);stats();}
function clearInput(){duck=keyDuck=false;jumpUntil=0;}
function stop(message){playing=false;cancelAnimationFrame(raf);$('start').textContent=world.done?'再跑一轮':'继续';if(message)text('feedback',message);clearInput();persist();paint();}
function ended(){
 if(training){learner.record(world);persist();text('feedback',`第 ${learner.attempts} 轮：${world.reason}，跨过 ${world.passed} 个，奖励 ${world.totalReward.toFixed(2)}。自动开始下一轮。`);world.reset();}
 else {if(manual)storageNotice(save({manualBest:Math.max(load().manualBest,world.score)}));stop(`${world.reason}：本轮 ${world.score} 分，跨过 ${world.passed} 个障碍。${manual?'可重试，也可到下一页让 AI 学习。':'本轮按当前 Q 表行动，未更新策略。'}`);}
}
function step(){
 if(world.done)return ended();let result;
 if(manual){const jump=performance.now()<=jumpUntil&&!world.robot.isJumping;result=world.step(jump?1:duck||keyDuck?2:0,1);if(jump)jumpUntil=0;}
 else result=learner.act(world,training);
 if(world.done||performance.now()-lastStats>100)text('reward',`本次奖励 ${result.reward>=0?'+':''}${result.reward.toFixed(3)} · 本轮累计 ${world.totalReward.toFixed(2)}`);
 if(world.done)ended();
}
function loop(now){
 if(!playing)return;acc+=Math.min(now-last,100);last=now;
 const speed=training?Number($('speed').value):1,interval=1000/(manual?60:15);let count=0;
 while(acc>=interval&&count++<8&&playing){for(let i=0;i<speed&&playing;i++)step();acc-=interval;}
 drawRunner(canvas,world);
 if(now-lastStats>=100){stats();lastStats=now;}
 if(training&&now-lastSave>2000){persist();lastSave=now;}
 if(playing)raf=requestAnimationFrame(loop);
}
$('start').onclick=()=>{
 if(playing)return stop('已暂停，当前策略与训练记录已保存。');if(world.done)world.reset();playing=true;last=performance.now();acc=0;$('start').textContent='暂停';
 text('feedback',manual?'正在跑：空格或 ↑ 跳跃，↓ 下蹲；触屏下蹲可再次点按站起。':training?'正在真实更新 Q 表；失败后自动重来。':'正在使用冻结策略；探索率为零，Q 表不变。');canvas.focus({preventScroll:true});raf=requestAnimationFrame(loop);
};
$('retry').onclick=()=>{const was=playing;stop();world.reset();text('feedback','本轮已重置，已完成的训练与 Q 表保留。');paint();if(was)$('start').click();};
function queueJump(){if(playing){jumpUntil=performance.now()+130;duck=false;stats();}else text('feedback','先点击开始，再跳跃。');}
$('jump').addEventListener('pointerdown',e=>{if(e.button===0)queueJump();});
$('jump').onclick=e=>{if(e.detail===0)queueJump();};
$('duck').onclick=()=>{if(playing){duck=!duck;stats();}else text('feedback','先点击开始，再下蹲。');};
$('reset').onclick=()=>{cancelComparison();stop();Object.assign(learner,new Learner());world.reset();chartAttempt=auditUpdate=-1;persist();text('feedback','训练已清空：Q 表、轮次、奖励记录、比较基线均从零开始。');text('reward','');renderComparison();paint();};
window.addEventListener('keydown',e=>{if(!manual||!['Space','ArrowUp','ArrowDown'].includes(e.code)||e.target.matches('select,input,textarea')||(e.code==='Space'&&e.target.matches('button')))return;e.preventDefault();if(!playing)return;if(e.code==='ArrowDown'){keyDuck=true;stats();}else if(!e.repeat)queueJump();});
window.addEventListener('keyup',e=>{if(e.code==='ArrowDown'){keyDuck=false;stats();}});
window.addEventListener('blur',()=>{clearInput();stats();});
function renderComparison(){
 const c=learner.comparison,valid=c?.before&&c?.after;
 $('comparisonTable').hidden=!valid;$('comparisonRows').replaceChildren();
 if(!valid){text('comparisonStatus',`固定种子 9001–9020；双方关闭探索，测试不更新 Q 表。起点为 ${learner.baseline.updates} 次更新时保存的策略。`);return;}
 for(const [label,value] of [['训练起点',c.before],['训练后',c.after]]){const row=document.createElement('tr');for(const v of [label,value.meanScore,value.meanPassed,`${value.successRate}%`]){const cell=document.createElement('td');cell.textContent=v;row.append(cell);}$('comparisonRows').append(row);}
 const delta=c.after.meanPassed-c.before.meanPassed;
 text('comparisonStatus',`${c.baselineUpdates} → ${c.updates} 次更新；各 ${c.after.episodes} 轮，种子 9001–9020。${delta>0?`平均多跨过 ${delta.toFixed(2)} 个障碍`:'本次未测到平均跨障碍提升'}。测试后地面碰撞 ${c.after.failures.ground} 轮、横梁碰撞 ${c.after.failures.beam} 轮。${learner.updates!==c.updates?'策略已有新更新，可重新比较。':''}`);
}
function cancelComparison(){comparisonTask++;cancelAnimationFrame(comparisonRaf);$('compare').disabled=false;$('cancelCompare').hidden=true;$('start').disabled=false;$('retry').disabled=false;renderComparison();}
$('cancelCompare').onclick=()=>{cancelComparison();text('comparisonStatus','比较已取消；策略和训练记录保留。');};
$('compare').onclick=()=>{
 stop();cancelComparison();const task=comparisonTask,iterator=comparePolicies(learner);let decisions=0;
 $('compare').disabled=true;$('cancelCompare').hidden=false;$('start').disabled=true;$('retry').disabled=true;
 function batch(){
  if(task!==comparisonTask)return;
  let result;for(let i=0;i<250;i++){result=iterator.next();decisions++;if(result.done)break;}
  if(result.done){learner.comparison=result.value;persist();cancelComparison();return;}
  text('comparisonStatus',`正在比较两份冻结策略：已执行 ${decisions} 次决策；训练暂停。`);comparisonRaf=requestAnimationFrame(batch);
 }
 comparisonRaf=requestAnimationFrame(batch);
};
function pause(){cancelComparison();if(playing)stop('已暂停；返回后点击继续，Q 表和训练记录仍在。');}
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});document.addEventListener('coursevisibility',e=>{if(e.detail)pause()});window.addEventListener('pagehide',()=>{pause();persist();});
window.addEventListener('storage',e=>{
 if(e.key!==KEY||manual)return;
 const wasPlaying=playing;
 cancelComparison();playing=false;cancelAnimationFrame(raf);clearInput();
 try{Object.assign(learner,new Learner(JSON.parse(e.newValue)||{}));}catch{return;}
 world.reset();chartAttempt=auditUpdate=-1;if(wasPlaying)$('start').textContent='继续';text('feedback','另一标签页更新了训练数据，已同步并暂停；点击开始或继续使用最新策略。');renderComparison();paint();
});
text('feedback',manual?`先开始，再跳跃或下蹲。你的本机最高：${load().manualBest} 分。`:training?'点击开始，机器人将从当前 Q 表继续探索。重置训练可以从零开始。':`当前保留 ${learner.attempts} 轮训练、${learner.updates} 次更新。点击开始，查看真实表现。`);
renderComparison();paint();
