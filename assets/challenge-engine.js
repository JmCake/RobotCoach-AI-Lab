// V2 progressively extends the upstream runner. Rendering/geometry, physics constants,
// reward accounting and Bellman updates are shared with the retained V1 experiments.
import {Runner,Learner,C,REWARDS,rng,intersects} from './learning.js';
export const ALL_SENSORS={camera:true,lidar:true,imu:true,force:true};
export const CHALLENGE_FRAMES=1800;
export const ENVIRONMENTS={
 clear:{name:'晴天跨栏',light:1,friction:1,moving:false,speed:5},
 moving:{name:'动态横梁',light:.85,friction:1,moving:true,speed:5.4},
 wet:{name:'湿滑变速',light:.8,friction:.5,moving:false,speed:5.6},
 night:{name:'弱光混合挑战',light:.18,friction:.6,moving:true,speed:5.8}
};
export const TRAIN_SEEDS=Object.freeze(Array.from({length:30},(_,i)=>101+i));
export const TEST_SEEDS_V2=Object.freeze(Array.from({length:20},(_,i)=>9001+i));
export class ChallengeWorld extends Runner {
 constructor(seed=101,environment='clear',randomize=false){
  super(rng(seed));this.seed=seed;this.random=rng(seed);this.environment=environment;this.randomized=randomize;
  const base=ENVIRONMENTS[environment]||ENVIRONMENTS.clear;
  this.conditions={...base};
  if(randomize){this.conditions.light=.5+this.random()*.5;this.conditions.friction=.5+this.random()*.5;this.conditions.speed=4.8+this.random()*1.1;this.conditions.moving=this.random()<.5;}
  this.reset();
 }
 reset(){super.reset();this.distance=0;this.slip=0;this.load=1;this.speed=this.conditions?.speed||5;this.spawn=48;}
 state(){throw new Error('V2 policies must use observe() and observationState(), never Runner world truth');}
 step(action=0,frames=4){
  if(this.done)return {reward:0,done:true,events:{pass:0,collision:0,complete:0,action:0}};
  const r=this.robot,c=this.conditions,events={pass:0,collision:0,complete:0,action:0};
  r.duck=action===2&&!r.isJumping;r.height=r.duck?28:50;
  if(action===1&&!r.isJumping){r.velocity=C.JUMP_FORCE*(1-.14*this.slip);r.isJumping=true;r.duck=false;r.height=50;events.action+=REWARDS.jump;}
  if(r.duck)events.action+=REWARDS.duck;
  for(let n=0;n<frames;n++){
   this.ticks++;r.frame++;r.velocity+=C.GRAVITY;r.y+=r.velocity;
   if(r.y>=C.GROUND_Y){const impact=Math.max(0,r.velocity);r.y=C.GROUND_Y;r.velocity=0;r.isJumping=false;this.load=1+impact/12;}else this.load=0;
   // Wet patches create momentum drift; ducking on contact provides braking.
   const patch=.5+.5*Math.sin(this.distance/150),target=c.speed+(1-c.friction)*patch*1.6;
   this.slip=!r.isJumping?(1-c.friction)*patch:0;
   this.speed+=(target-(r.duck?this.slip*1.8:0)-this.speed)*.08;
   this.distance+=this.speed;
   if(--this.spawn<=0){
    const type=this.random()<.35?'beam':'ground',height=type==='beam'?22:[28,38,48][Math.floor(this.random()*3)];
    const y=type==='beam'?C.GROUND_Y-65:C.GROUND_Y-height;
    this.obstacles.push({x:C.WIDTH,y,baseY:y,width:type==='beam'?65:30,height,type,passed:false,phase:this.random()*Math.PI*2,moving:type==='beam'&&c.moving});
    this.spawn=78+Math.floor(this.random()*30);
   }
   for(const o of this.obstacles){
    o.x-=this.speed;if(o.moving)o.y=o.baseY+Math.sin(this.ticks/24+o.phase)*8;
    if(intersects(r,o)){this.done=true;this.reason=o.type==='beam'?'碰到动态或固定横梁':'撞上地面障碍';events.collision+=REWARDS.collision;break;}
    if(!o.passed&&o.x+o.width<r.x){o.passed=true;this.passed++;events.pass+=REWARDS.pass;}
   }
   this.obstacles=this.obstacles.filter(o=>o.x+o.width>0);this.score=Math.floor(this.ticks/6);
   if(this.ticks>=CHALLENGE_FRAMES&&!this.done){this.done=true;this.success=true;this.reason='完成综合赛道';events.complete+=REWARDS.complete;}
   if(this.done)break;
  }
  const reward=Object.values(events).reduce((a,b)=>a+b,0);for(const k of Object.keys(events))this.rewardTotals[k]+=events[k];
  this.totalReward+=reward;return {reward,done:this.done,events};
 }
}

// Simulated sensor models, not a physical camera or real lidar. This is the ONLY
// boundary permitted to inspect the world. Policies receive detached nullable data.
export function observe(world,config=ALL_SENSORS){
 const r=world.robot,c=world.conditions,front=world.obstacles.filter(o=>o.x+o.width>=r.x);
 const nearest=front[0],distance=nearest?Math.max(-40,nearest.x-r.x-r.width):null;
 const visible=nearest&&distance<400*c.light;
 const ray=height=>{const o=front.find(o=>o.y<=C.GROUND_Y-height&&o.y+o.height>=C.GROUND_Y-height);return o&&o.x-r.x-r.width<360?Math.round(Math.max(-40,o.x-r.x-r.width)/5)*5:null;};
 return {
  camera:config.camera?{distance:visible?Math.round(distance/(c.light<.4?25:10))*(c.light<.4?25:10):null,type:visible?nearest.type:null,height:visible?nearest.height:null,quality:c.light}:null,
  lidar:config.lidar?{low:ray(20),high:ray(53)}:null,
  imu:config.imu?{height:Math.round(C.GROUND_Y-r.y),velocity:Math.round(r.velocity*2)/2,speed:Math.round(world.speed*10)/10,slip:Math.round(world.slip*10)/10}:null,
  force:config.force?{contact:!r.isJumping,load:Math.round(world.load*10)/10}:null
 };
}
export function fuse(o){
 let distance=o.camera?.distance??null,type=o.camera?.type??'none',source=distance===null?'无目标':'视觉';
 const low=o.lidar?.low,high=o.lidar?.high;
 const ranges=[low,high].filter(Number.isFinite);
 if(ranges.length){const d=Math.min(...ranges);distance=d;source='测距';type=Number.isFinite(low)&&low===d?'ground':'beam';}
 const contact=o.force?.contact??(o.imu?o.imu.height<=0:null);
 return {distance,type,contact,height:o.imu?.height??null,velocity:o.imu?.velocity??null,speed:o.imu?.speed??null,slip:o.imu?.slip??null,source};
}
export function features(observation){const f=fuse(observation);return [f.distance??500,f.type==='ground'?1:f.type==='beam'?2:0,f.height??-1,f.velocity??-20,f.contact===null?-1:Number(f.contact),f.speed??-1,f.slip??-1];}
export function observationState(observation){const f=fuse(observation);return [f.distance===null?21:Math.max(-2,Math.min(20,Math.floor(f.distance/20))),f.type,f.height===null?-1:Math.min(8,Math.floor(f.height/16)),f.velocity===null?-2:Math.sign(f.velocity),f.contact===null?-1:Number(f.contact),f.speed===null?-1:Math.floor(f.speed)].join(',');}
export function rulePolicy(o){
 const f=fuse(o);if(f.distance===null)return 0;
 // No world, timer or obstacle list is available here. Contact and IMU decide
 // whether to launch, and measured speed adjusts the lead distance.
 if(f.type==='beam'&&f.distance<150)return 2;
 if(f.type==='ground'&&f.distance<(f.speed??5)*19&&f.distance>15&&f.contact!==false)return 1;
 if(f.slip>.25&&f.contact&&f.distance>160)return 2;
 return 0;
}
export class ChallengeLearner extends Learner {
 actObserved(observation,world,training=false,random=Math.random,config=ALL_SENSORS){
  const state=observationState(observation),action=this.choose(state,training,random),result=world.step(action);
  if(training)this.update(state,action,result.reward,observationState(observe(world,config)),result.done);
  return {...result,action};
 }
}

// Supervised decision tree: every split and action is learned from observation /
// expert-action pairs. No replay clock, expert fallback or manually installed tree.
export class ClonePolicy {
 constructor(data={}){
  const valid=(n,depth=0)=>n&&depth<=12&&(n.feature===undefined?Number.isInteger(n.action)&&n.action>=0&&n.action<=2:Number.isInteger(n.feature)&&n.feature>=0&&n.feature<7&&Number.isFinite(n.threshold)&&valid(n.left,depth+1)&&valid(n.right,depth+1));
  this.tree=valid(data.tree)?structuredClone(data.tree):null;this.samples=Number.isSafeInteger(data.samples)&&data.samples>=0?data.samples:0;this.accuracy=Number.isFinite(data.accuracy)&&data.accuracy>=0&&data.accuracy<=1?data.accuracy:0;
 }
 choose(o){let n=this.tree;const x=features(o);while(n&&n.feature!==undefined)n=x[n.feature]<=n.threshold?n.left:n.right;return n?.action??0;}
 fit(records){
  if(records.length<5)return;const rows=records.map(r=>({x:features(r.observation),action:r.action}));
  const counts=list=>{const c=[0,0,0];for(const r of list)c[r.action]++;return c;};
  const impurity=c=>{const n=c.reduce((a,b)=>a+b,0);return n?n-c.reduce((a,b)=>a+b*b,0)/n:0;};
  function grow(list,depth){
   const total=counts(list),action=total.indexOf(Math.max(...total));if(depth>=10||list.length<12||total[action]===list.length)return {action};
   let best=null,score=impurity(total);
   for(let feature=0;feature<7;feature++){
    const sorted=list.slice().sort((a,b)=>a.x[feature]-b.x[feature]),left=[0,0,0],right=total.slice();
    for(let i=0;i<sorted.length-1;i++){
     left[sorted[i].action]++;right[sorted[i].action]--;if(sorted[i].x[feature]===sorted[i+1].x[feature])continue;
     const loss=impurity(left)+impurity(right);if(loss<score){score=loss;best={feature,threshold:(sorted[i].x[feature]+sorted[i+1].x[feature])/2};}
    }
   }
   if(!best)return {action};const a=[],b=[];for(const row of list)(row.x[best.feature]<=best.threshold?a:b).push(row);
   return {...best,left:grow(a,depth+1),right:grow(b,depth+1)};
  }
  // Deterministic holdout assesses imitation agreement, separately from task success.
  const train=records.filter((_,i)=>i%5!==0),validation=records.filter((_,i)=>i%5===0);
  this.tree=grow(rows.filter((_,i)=>i%5!==0),0);this.samples=train.length;
  this.accuracy=validation.filter(r=>this.choose(r.observation)===r.action).length/validation.length;
 }
 snapshot(){return {tree:this.tree,samples:this.samples,accuracy:this.accuracy};}
}
export function* demonstrations(config=ALL_SENSORS,seeds=TRAIN_SEEDS,preview=()=>{}){
 for(const seed of seeds){const world=new ChallengeWorld(seed,'clear',true);while(!world.done){const observation=observe(world,config),action=rulePolicy(observation);preview(world,action);yield {observation,action,seed};world.step(action);}}
}
export function* trainQ(learner,decisions=100000,config=ALL_SENSORS,seed=42){
 const random=rng(seed);let episode=0,world=new ChallengeWorld(TRAIN_SEEDS[0],'clear',true);
 for(let i=0;i<decisions;i++){
  const result=learner.actObserved(observe(world,config),world,true,random,config);
  if(world.done){learner.record(world);episode++;world=new ChallengeWorld(TRAIN_SEEDS[episode%TRAIN_SEEDS.length],'clear',true);}
  // World is a render-only preview; neither learned state nor samples include it.
  if(i%200===199)yield {decisions:i+1,attempts:learner.attempts,world,action:result.action};
 }
 return {updates:learner.updates,attempts:learner.attempts};
}
export function* evaluateChallenge(policies,config=ALL_SENSORS,environments=Object.keys(ENVIRONMENTS),seeds=TEST_SEEDS_V2){
 const results=[];
 for(const environment of environments)for(const [policy,choose] of Object.entries(policies)){
  const runs=[];for(const seed of seeds){const world=new ChallengeWorld(seed,environment);while(!world.done){world.step(choose(observe(world,config)));if(world.ticks%200===0)yield {environment,policy,completed:runs.length};}
   runs.push({seed,success:world.success,passed:world.passed,score:world.score,reason:world.reason,reward:Number(world.totalReward.toFixed(3)),ticks:world.ticks});yield {environment,policy,completed:runs.length};
  }
  results.push({environment,policy,sensors:{...config},seeds:[...seeds],episodes:runs.length,successRate:100*runs.filter(x=>x.success).length/runs.length,collisions:runs.filter(x=>!x.success).length,meanPassed:runs.reduce((a,b)=>a+b.passed,0)/runs.length,completion:runs.reduce((a,b)=>a+b.ticks/CHALLENGE_FRAMES,0)/runs.length,runs});
 }
 return results;
}
