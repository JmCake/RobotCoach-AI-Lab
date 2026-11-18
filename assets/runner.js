import {Runner,Learner,C} from './learning.js';
import {load,save,storageNotice} from './state.js';
import {drawRunner} from './runner-render.js';
const mode=new URLSearchParams(location.search).get('mode')||'manual',training=mode==='train',manual=mode==='manual';
const KEY='robotcoach:q:v1';let data={};try{data=JSON.parse(localStorage.getItem(KEY))||{};}catch{}
const learner=new Learner(data),world=new Runner();
const $=id=>document.getElementById(id),canvas=$('game');let playing=false,raf=0,last=0,acc=0,duck=false,jump=false,lastSave=0,lastReward=0;
$('modeLabel').textContent=manual?'人工操控':training?'Q-learning · 自主试错':'冻结策略 · 成果展示';
for(const id of ['jump','duck'])$(id).hidden=!manual;
$('speedLabel').hidden=!training;$('reset').hidden=!training;$('trainingStats').hidden=manual;$('chart').hidden=manual;$('history').hidden=manual;
function persist(){if(!training)return;try{localStorage.setItem(KEY,JSON.stringify(learner.snapshot()));}catch{storageNotice(false);}}
function stats(){
 $('score').textContent=world.score;$('passed').textContent=world.passed;$('attempts').textContent=learner.attempts;$('updates').textContent=learner.updates;$('epsilon').textContent=training?(learner.epsilon*100).toFixed(1)+'%':'0%（展示）';$('best').textContent=learner.best;
 $('duck').setAttribute('aria-pressed',duck);
 if(!manual){
  const h=learner.history.slice(-5);$('history').textContent=h.length?'最近轮次：'+h.map(x=>`第${x.attempt}轮 ${x.score}分 / 跨过${x.passed}个 / 奖励${x.reward}`).join('；'):'尚无已完成训练轮次；不会预设成功结果。';
  drawChart();
 }
}
function drawChart(){const c=$('chart'),ctx=c.getContext('2d'),h=learner.history.slice(-40);ctx.clearRect(0,0,800,100);ctx.fillStyle='#b7c5da';ctx.font='13px system-ui';ctx.fillText('每轮累计奖励（最近 40 轮）',10,18);if(!h.length)return;const min=Math.min(0,...h.map(x=>x.reward)),max=Math.max(1,...h.map(x=>x.reward));ctx.strokeStyle='#71d7b0';ctx.lineWidth=2;ctx.beginPath();h.forEach((p,i)=>{const x=15+i*770/Math.max(1,h.length-1),y=85-(p.reward-min)/(max-min)*55;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();}
function paint(){drawRunner(canvas,world);stats();}
function stop(message){playing=false;cancelAnimationFrame(raf);$('start').textContent=world.done?'再跑一轮':'继续';if(message)$('feedback').textContent=message;duck=jump=false;persist();paint();}
function ended(){
 if(training){learner.record(world);persist();$('feedback').textContent=`第 ${learner.attempts} 轮：${world.reason}，跨过 ${world.passed} 个，奖励 ${world.totalReward.toFixed(2)}。自动开始下一轮。`;world.reset();}
 else {if(manual)storageNotice(save({manualBest:Math.max(load().manualBest,world.score)}));stop(`${world.reason}：本轮 ${world.score} 分，跨过 ${world.passed} 个障碍。${manual?'可重试，也可到下一页让 AI 学习。':'本轮按当前 Q 表行动，未更新策略。'}`);}
}
function step(){if(world.done)return ended();let result;
 if(manual){result=world.step(jump?1:duck?2:0);jump=false;}
 else result=learner.act(world,training);
 lastReward=result.reward;
 $('reward').textContent=`本次奖励 ${result.reward>=0?'+':''}${result.reward.toFixed(2)} · 本轮累计 ${world.totalReward.toFixed(2)}`;
 if(world.done)ended();
}
function loop(now){if(!playing)return;acc+=Math.min(now-last,100);last=now;const speed=training?Number($('speed').value):1;let count=0;while(acc>=1000/15&&count++<3&&playing){for(let i=0;i<speed&&playing;i++)step();acc-=1000/15;}paint();if(training&&now-lastSave>2000){persist();lastSave=now;}if(playing)raf=requestAnimationFrame(loop);}
$('start').onclick=()=>{if(playing)return stop('已暂停，当前策略与训练记录已保存。');if(world.done)world.reset();playing=true;last=performance.now();acc=0;$('start').textContent='暂停';$('feedback').textContent=manual?'正在跑：空格或 ↑ 跳跃，↓ 下蹲。':training?'正在真实更新 Q 表；失败后自动重来。':'正在使用冻结策略；探索率为零，Q 表不变。';canvas.focus({preventScroll:true});raf=requestAnimationFrame(loop);};
$('retry').onclick=()=>{const was=playing;stop();world.reset();$('feedback').textContent='本轮已重置，已完成的训练与 Q 表保留。';paint();if(was)$('start').click();};
$('jump').onclick=()=>{if(playing)jump=true;else $('feedback').textContent='先点击开始，再跳跃。';};
$('duck').onclick=()=>{if(playing){duck=!duck;$('duck').setAttribute('aria-pressed',duck);}else $('feedback').textContent='先点击开始，再下蹲。';};
$('reset').onclick=()=>{stop();Object.assign(learner,new Learner());world.reset();persist();$('feedback').textContent='训练已清空：Q 表、轮次、奖励记录均从零开始。';$('reward').textContent='';paint();};
window.addEventListener('keydown',e=>{if(!manual||!['Space','ArrowUp','ArrowDown'].includes(e.code)||e.target.matches('select,input,textarea')||(e.code==='Space'&&e.target.matches('button')))return;e.preventDefault();if(!playing)return;if(e.code==='ArrowDown')duck=true;else if(!e.repeat)jump=true;});
window.addEventListener('keyup',e=>{if(e.code==='ArrowDown')duck=false;});
window.addEventListener('blur',()=>{duck=jump=false;});
function pause(){if(playing)stop('已暂停；返回后点击继续，Q 表和训练记录仍在。');}
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});document.addEventListener('coursevisibility',e=>{if(e.detail)pause()});window.addEventListener('pagehide',()=>{pause();persist();});
$('feedback').textContent=manual?`先开始，再跳跃或下蹲。你的本机最高：${load().manualBest} 分。`:training?'点击开始，机器人将从当前 Q 表继续探索。重置训练可以从零开始。':`当前保留 ${learner.attempts} 轮训练、${learner.updates} 次更新。点击开始，查看真实表现。`;
paint();
