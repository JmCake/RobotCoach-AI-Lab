// Adapted from upstream game.js: Canvas runner, jump physics and tabular Q-learning.
// The policy starts with an empty table. No common-sense initialization or scripted AI.
export const C={WIDTH:800,HEIGHT:300,GROUND_Y:235,GRAVITY:.6,JUMP_FORCE:-12,BASE_SPEED:5};
export const REWARDS={pass:8,collision:-12,complete:4,jump:-.03,duck:-.002};
export const REWARD_VERSION=2;
export function rng(seed=2026){let x=seed>>>0;return()=>{x=(1664525*x+1013904223)>>>0;return x/4294967296;};}
export class Runner {
 constructor(random=Math.random){this.random=random;this.reset();}
 reset(){this.robot={x:65,y:C.GROUND_Y,width:38,height:50,velocity:0,isJumping:false,frame:0,duck:false};this.obstacles=[];this.ticks=0;this.score=0;this.passed=0;this.speed=C.BASE_SPEED;this.spawn=65;this.done=false;this.reason='';this.totalReward=0;this.success=false;this.recorded=false;this.rewardTotals={pass:0,collision:0,complete:0,action:0};}
 state(){const r=this.robot;const obs=this.obstacles.find(o=>o.x+o.width>=r.x);const distance=obs?Math.max(-1,Math.min(16,Math.floor((obs.x-r.x-r.width)/25))):17;const height=Math.min(8,Math.floor((C.GROUND_Y-r.y)/16));return `${distance},${obs?.type||'none'},${obs?.height||0},${height},${Math.sign(r.velocity)},${Math.floor(this.speed)}`;}
 step(action=0,frames=4){
  if(this.done)return {reward:0,done:true,events:{pass:0,collision:0,complete:0,action:0}};
  const r=this.robot;
  const events={pass:0,collision:0,complete:0,action:0};
  r.duck=action===2&&!r.isJumping;r.height=r.duck?28:50;
  if(action===1&&!r.isJumping){r.velocity=C.JUMP_FORCE;r.isJumping=true;r.duck=false;r.height=50;events.action+=REWARDS.jump;}
  if(r.duck)events.action+=REWARDS.duck;
  // One decision spans four fixed simulation frames, independent of display refresh rate.
  for(let n=0;n<frames;n++){
   this.ticks++;r.frame++;r.velocity+=C.GRAVITY;r.y+=r.velocity;
   if(r.y>=C.GROUND_Y){r.y=C.GROUND_Y;r.velocity=0;r.isJumping=false;}
   this.speed=Math.min(6,C.BASE_SPEED+this.ticks/2000);
   if(--this.spawn<=0){
    const type=this.random()<.27?'beam':'ground';const height=type==='beam'?22:[28,38,48][Math.floor(this.random()*3)];
    this.obstacles.push({x:C.WIDTH,y:type==='beam'?C.GROUND_Y-65:C.GROUND_Y-height,width:type==='beam'?65:30,height,type,passed:false});
    this.spawn=75+Math.floor(this.random()*35);
   }
   for(const o of this.obstacles){
    o.x-=this.speed;
    if(r.x<o.x+o.width&&r.x+r.width>o.x&&r.y-r.height<o.y+o.height&&r.y>o.y){this.done=true;this.reason=o.type==='beam'?'碰到横梁':'撞上地面障碍';events.collision+=REWARDS.collision;break;}
    if(!o.passed&&o.x+o.width<r.x){o.passed=true;this.passed++;events.pass+=REWARDS.pass;}
   }
   this.obstacles=this.obstacles.filter(o=>o.x+o.width>0);
   this.score=Math.floor(this.ticks/6);
   if(this.ticks>=1800&&!this.done){this.done=true;this.success=true;this.reason='本轮观察结束';events.complete+=REWARDS.complete;}
   if(this.done)break;
  }
  const reward=Object.values(events).reduce((sum,value)=>sum+value,0);
  for(const key of Object.keys(events))this.rewardTotals[key]+=events[key];
  this.totalReward+=reward;return {reward,done:this.done,events};
 }
}
export class Learner {
 constructor(data={}){
  this.q=new LearnerTable(data.q).q;
  this.updates=Number.isSafeInteger(data.updates)&&data.updates>=0?data.updates:0;
  this.attempts=Number.isSafeInteger(data.attempts)&&data.attempts>=0?data.attempts:0;
  this.history=Array.isArray(data.history)?data.history.filter(x=>x&&Number.isFinite(x.reward)&&Number.isFinite(x.score)&&Number.isFinite(x.passed)).slice(-150).map(x=>({...x,rewards:x.rewards&&['pass','collision','complete','action'].every(key=>Number.isFinite(x.rewards[key]))?x.rewards:undefined})):[];
  this.best=Number.isFinite(data.best)?data.best:0;
  this.audit=Array.isArray(data.audit)?data.audit.filter(x=>x&&typeof x.state==='string'&&typeof x.next==='string'&&[0,1,2].includes(x.action)&&Number.isSafeInteger(x.update)&&Number.isFinite(x.reward)&&Number.isFinite(x.before)&&Number.isFinite(x.after)).slice(-12):[];
  // Copy the actual starting policy, including V1.0 progress. Never substitute an expert.
  const baseline=data.baseline&&typeof data.baseline==='object'?data.baseline:{q:this.q,updates:this.updates,attempts:this.attempts};
  this.baseline={q:structuredClone(new LearnerTable(baseline.q).q),updates:Number.isSafeInteger(baseline.updates)?baseline.updates:0,attempts:Number.isSafeInteger(baseline.attempts)?baseline.attempts:0};
  const comparison=data.comparison,validResult=x=>x&&['episodes','meanScore','meanPassed','successRate'].every(key=>Number.isFinite(x[key]))&&Number.isFinite(x.failures?.ground)&&Number.isFinite(x.failures?.beam);
  this.comparison=comparison?.rewardVersion===REWARD_VERSION&&validResult(comparison.before)&&validResult(comparison.after)?comparison:null;
 }
 get epsilon(){return Math.max(.04,.35*Math.pow(.992,this.attempts));}
 choose(state,training=false,random=Math.random){if(training&&random()<this.epsilon)return Math.floor(random()*3);const q=this.q[state]||[0,0,0];return q.indexOf(Math.max(...q));}
 update(state,action,reward,next,terminal){const row=this.q[state]??=[0,0,0],before=row[action];const future=terminal?0:Math.max(...(this.q[next]||[0,0,0]));row[action]+=.2*(reward+.95*future-row[action]);this.updates++;this.audit.push({update:this.updates,state,action,reward,next,terminal,before,after:row[action]});this.audit=this.audit.slice(-12);}
 act(world,training,random=Math.random){const state=world.state(),action=this.choose(state,training,random),result=world.step(action);if(training)this.update(state,action,result.reward,world.state(),result.done);return{...result,action};}
 record(world){if(!world.done||world.recorded)return;world.recorded=true;this.attempts++;this.best=Math.max(this.best,world.score);this.history.push({attempt:this.attempts,score:world.score,passed:world.passed,reward:Number(world.totalReward.toFixed(3)),reason:world.reason,success:world.success,rewardVersion:REWARD_VERSION,rewards:{...world.rewardTotals}});this.history=this.history.slice(-150);}
 snapshot(){return {rewardVersion:REWARD_VERSION,q:this.q,updates:this.updates,attempts:this.attempts,best:this.best,history:this.history,audit:this.audit,baseline:this.baseline,comparison:this.comparison};}
}

// Same validation for an imported baseline without recursively creating a Learner.
class LearnerTable {
 constructor(q){this.q={};if(q&&typeof q==='object')for(const [key,row] of Object.entries(q).slice(0,12000))if(/^[\w,.\-]+$/.test(key)&&Array.isArray(row)&&row.length===3&&row.every(x=>Number.isFinite(x)&&Math.abs(x)<1e6))this.q[key]=row.slice();}
}
