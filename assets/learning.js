// Adapted from upstream game.js: Canvas runner, jump physics and tabular Q-learning.
// The policy starts with an empty table. No common-sense initialization or scripted AI.
export const C={WIDTH:800,HEIGHT:300,GROUND_Y:235,GRAVITY:.6,JUMP_FORCE:-12,BASE_SPEED:5};
export function rng(seed=2026){let x=seed>>>0;return()=>{x=(1664525*x+1013904223)>>>0;return x/4294967296;};}
export class Runner {
 constructor(random=Math.random){this.random=random;this.reset();}
 reset(){this.robot={x:65,y:C.GROUND_Y,width:38,height:50,velocity:0,isJumping:false,frame:0,duck:false};this.obstacles=[];this.ticks=0;this.score=0;this.passed=0;this.speed=C.BASE_SPEED;this.spawn=65;this.done=false;this.reason='';this.totalReward=0;}
 state(){const r=this.robot;const obs=this.obstacles.find(o=>o.x+o.width>=r.x);const distance=obs?Math.max(-1,Math.min(16,Math.floor((obs.x-r.x-r.width)/25))):17;const height=Math.min(8,Math.floor((C.GROUND_Y-r.y)/16));return `${distance},${obs?.type||'none'},${obs?.height||0},${height},${Math.sign(r.velocity)},${Math.floor(this.speed)}`;}
 step(action=0){
  if(this.done)return {reward:0,done:true};
  const r=this.robot;
  r.duck=action===2&&!r.isJumping;r.height=r.duck?28:50;
  if(action===1&&!r.isJumping){r.velocity=C.JUMP_FORCE;r.isJumping=true;r.duck=false;r.height=50;}
  let reward=0;
  // One decision spans four fixed simulation frames, independent of display refresh rate.
  for(let n=0;n<4;n++){
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
    if(!o.passed&&o.x+o.width<r.x){o.passed=true;this.passed++;reward+=8;}
    if(r.x<o.x+o.width&&r.x+r.width>o.x&&r.y-r.height<o.y+o.height&&r.y>o.y){this.done=true;this.reason=o.type==='beam'?'碰到横梁':'撞上地面障碍';reward-=12;break;}
   }
   this.obstacles=this.obstacles.filter(o=>o.x+o.width>0);reward+=.015;
   this.score=Math.floor(this.ticks/6);
   if(this.ticks>=1800&&!this.done){this.done=true;this.reason='本轮观察结束';}
   if(this.done)break;
  }
  this.totalReward+=reward;return {reward,done:this.done};
 }
}
export class Learner {
 constructor(data={}){
  this.q={};
  if(data.q&&typeof data.q==='object')for(const [k,v] of Object.entries(data.q).slice(0,12000))if(/^[\w,.\-]+$/.test(k)&&Array.isArray(v)&&v.length===3&&v.every(x=>Number.isFinite(x)&&Math.abs(x)<1e6))this.q[k]=v.slice();
  this.updates=Number.isSafeInteger(data.updates)&&data.updates>=0?data.updates:0;
  this.attempts=Number.isSafeInteger(data.attempts)&&data.attempts>=0?data.attempts:0;
  this.history=Array.isArray(data.history)?data.history.filter(x=>x&&Number.isFinite(x.reward)&&Number.isFinite(x.score)&&Number.isFinite(x.passed)).slice(-150):[];
  this.best=Number.isFinite(data.best)?data.best:0;
 }
 get epsilon(){return Math.max(.04,.35*Math.pow(.992,this.attempts));}
 choose(state,training=false,random=Math.random){if(training&&random()<this.epsilon)return Math.floor(random()*3);const q=this.q[state]||[0,0,0];return q.indexOf(Math.max(...q));}
 update(state,action,reward,next,terminal){const row=this.q[state]??=[0,0,0];const future=terminal?0:Math.max(...(this.q[next]||[0,0,0]));row[action]+=.2*(reward+.95*future-row[action]);this.updates++;}
 act(world,training,random=Math.random){const state=world.state(),action=this.choose(state,training,random),result=world.step(action);if(training)this.update(state,action,result.reward,world.state(),result.done);return{...result,action};}
 record(world){this.attempts++;this.best=Math.max(this.best,world.score);this.history.push({attempt:this.attempts,score:world.score,passed:world.passed,reward:Number(world.totalReward.toFixed(3)),reason:world.reason});this.history=this.history.slice(-150);}
 snapshot(){return {q:this.q,updates:this.updates,attempts:this.attempts,best:this.best,history:this.history};}
}
