// Independent lightweight motion demo. No course state, trained policy or hidden success clips.
// Reuses the project's deterministic random generator (MIT upstream adaptation).
import {rng} from '../learning.js';
export const DT=1/120;
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const mix=(a,b,t)=>a+(b-a)*t;
export const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
export const SCENES={
  straight:{name:'正常直道',hint:'交替落脚，自然摆臂'},
  curve:{name:'急弯跑道',hint:'转向、侧倾与补偿步'},
  wet:{name:'湿滑路面',hint:'落脚打滑，提前降速'},
  rough:{name:'凹凸路面',hint:'高低落点，膝踝缓冲'},
  obstacles:{name:'障碍跑道',hint:'抬腿跨越，收身过梁'},
  night:{name:'弱光跑道',hint:'视距缩短，测距辅助'}
};
export const STATE_NAMES={running:'稳定奔跑',unbalanced:'正在纠偏',stumbling:'连续踉跄',falling:'正在摔倒',fallen:'倒地停留',recovering:'撑地起身'};
export const SENSOR_NAMES={camera:'摄像头',lidar:'激光测距',imu:'姿态传感器 IMU',force:'足底力觉'};

export class MotionWorld{
  constructor({scene='straight',seed=2026,target=5.6,assist=true,sensors,repeat=true}={}){
    this.scene=SCENES[scene]?scene:'straight';this.seed=seed>>>0;this.target=clamp(target,2,8);this.repeat=repeat;
    this.sensors=Object.fromEntries(Object.keys(SENSOR_NAMES).map(k=>[k,sensors?.[k]??assist]));
    this.random=rng(this.seed);this.time=0;this.x=0;this.speed=0;this.phase=0;this.y=0;this.vy=0;
    this.theta=0;this.omega=0;this.lateral=0;this.heading=0;this.turn=0;this.slip=0;this.crouch=0;
    this.state='running';this.age=0;this.falls=0;this.passed=0;this.peakTilt=0;this.cause='';this.event='交替落脚，保持节奏';
    this.imbalance=0;this.lastImpact=0;this.collision=null;this.history=[];this.visualHistory=[];this.contacts=[true,true];
    this.footX=[-.18,.18];this.footY=[0,0];this.footSlip=[0,0];this.previousPhase=[0,.5];
    this.contactHeight=[0,0];
    this.swings=[null,null];
    this.terrainPhase=this.random()*Math.PI*2;
    this.obstacles=Array.from({length:240},(_,i)=>({x:12+i*9+this.random()*1.4,type:i%3===1?'beam':'hurdle',width:.42,height:i%3===1?1.23:.48+this.random()*.1,hit:false,passed:false}));
    this.observation=this.observe();this.control={target:0,torque:0,steer:0,jump:false,duck:false,placement:0};
  }
  center(x){return this.scene==='curve'?3.8*Math.sin(Math.max(0,x-7)*.24)**2:0;}
  curvature(x){return this.scene==='curve'&&x>7?.30*Math.sin((x-7)*.48):0;}
  height(x){return this.scene==='rough'?(.105*Math.sin(x*3.7+this.terrainPhase)+.045*Math.sin(x*8.1))*smooth((x-5)/3):0;}
  friction(x){return this.scene==='wet'&&x>7?.22+.045*Math.sin(x*1.9+this.terrainPhase):.88;}
  get hasObstacles(){return this.scene==='obstacles'||this.scene==='night';}
  get assist(){return Object.values(this.sensors).some(Boolean);}
  set assist(value){for(const key of Object.keys(this.sensors))this.sensors[key]=value;}
  // A bounded synthetic sensor model, not pixel vision. Controllers only receive this snapshot.
  observe(){
    const s=this.sensors,visualRange=this.scene==='night'?1.05:4.3,range=s.lidar?7.5:s.camera?visualRange:0;
    const obstacle=this.hasObstacles?this.obstacles.find(o=>o.x+o.width>this.x-.3&&o.x-this.x<range):null;
    const reading=obstacle?{distance:obstacle.x-this.x,type:obstacle.type,height:obstacle.height}:null;
    this.visualHistory.push({time:this.time,reading:s.camera&&reading&&reading.distance<visualRange?reading:null});
    this.visualHistory=this.visualHistory.filter(s=>s.time>=this.time-.35);
    const delay=this.scene==='night'?.2:.06;
    const delayed=this.visualHistory.findLast(s=>s.time<=this.time-delay)?.reading||null;
    const camera=s.camera?{range:visualRange,obstacle:delayed,curve:this.curvature(this.x+(this.scene==='night'?.3:2)),offset:this.lateral,wet:this.friction(this.x+(this.scene==='night'?.3:2))<.4}:null;
    const lidar=s.lidar?{range:7.5,obstacle:reading}:null;
    const detected=lidar?.obstacle??camera?.obstacle??null;
    return {range,visualRange:s.camera?visualRange:0,camera,lidar,obstacle:detected,source:lidar?.obstacle?'激光测距':camera?.obstacle?'摄像头':null,
      imu:s.imu?{tilt:this.theta,rate:this.omega,speed:this.speed,heading:this.heading}:null,
      contact:s.force?{feet:[...this.contacts],slip:this.slip,roughness:Math.abs(this.contactHeight[0]-this.contactHeight[1])}:null,
      surface:camera?(camera.wet?.24:.88):null,curve:camera?.curve??0,offset:camera?.offset??0,
      grounded:this.y<=0,jumpHeight:this.y};
  }
  decide(o){
    let target=this.target,torque=0,placement=0;
    if(o.surface!==null)target=Math.min(target,Math.sqrt(o.surface*9.81/Math.max(.035,Math.abs(o.curve)))*.8,o.surface<.4?2.65:9);
    if(o.contact){target=Math.min(target,Math.max(2.3,this.target-o.contact.roughness*15-o.contact.slip*1.4));placement=clamp(o.contact.roughness*2+Math.abs(o.imu?.tilt??0)*.7,0,.6);}
    if(o.imu)torque=-19*o.imu.tilt-7*o.imu.rate;
    const steer=clamp(o.curve*this.speed-(o.imu?2.8:1.1)*o.offset-(o.imu&&o.camera?4.5*o.imu.heading:0),-2.5,2.5);
    const obs=o.obstacle;
    const jump=!!(obs&&obs.type==='hurdle'&&obs.distance<this.speed*.43+.32&&obs.distance>.2&&o.grounded);
    const duck=!!(obs&&obs.type==='beam'&&obs.distance<this.speed*.6+.7&&obs.distance>-.7);
    return {target,torque,steer,jump,duck,placement};
  }
  transition(state){if(this.state!==state){this.state=state;this.age=0;this.history.push({time:this.time,state,x:this.x});this.history=this.history.slice(-60);}}
  trip(cause,impulse,part=null){
    this.cause=cause;this.event=cause;this.omega+=impulse;this.imbalance+=.12;
    if(part)this.collision={x:this.x,part,time:this.time};
  }
  step(){
    this.time+=DT;this.age+=DT;this.lastImpact*=Math.exp(-DT*10);
    if(['falling','fallen','recovering'].includes(this.state)){this.stepFall();this.observation=this.observe();return;}
    this.observation=this.observe();this.control=this.decide(this.observation);const c=this.control;
    const mu=this.friction(this.x),oldSpeed=this.speed;
    this.speed+=clamp((c.target-this.speed)*2,-mu*9.81,3.2)*DT;
    this.x+=this.speed*DT;
    this.turn+=(c.steer-this.turn)*Math.min(1,DT*mu*10);
    this.heading+=(this.turn-this.curvature(this.x)*this.speed)*DT;
    this.lateral+=Math.sin(this.heading)*this.speed*DT;
    const lateralForce=this.speed*this.speed*Math.abs(this.curvature(this.x));
    const tractionExcess=Math.max(0,lateralForce-mu*9.81*.65);
    const phaseRate=(1.05+this.speed*.31)*(1+Math.min(.18,Math.abs(this.theta)*.2));
    this.phase+=phaseRate*DT;
    this.slip+=(Math.max(0,this.speed-3.0)*Math.max(0,.7-mu)*1.15-this.slip)*DT*5;
    if(c.jump){this.vy=4.8;this.event='测得前方矮栏 · 起跳跨越';}
    this.vy-=12*DT;this.y+=this.vy*DT;
    if(this.y<0){if(this.vy<-1.5){this.lastImpact=-this.vy;this.omega+=Math.max(0,-this.vy-3)*.02;}this.y=0;this.vy=0;}
    this.crouch+=((c.duck?1:0)-this.crouch)*DT*13;
    if(c.duck)this.event='测得前方横梁 · 屈膝收身';
    for(let i=0;i<2;i++){
      const p=(this.phase+i*.5)%1,stance=p<.56&&this.y<.04;
      const reach=.43+Math.min(.28,this.speed*.035);
      if(!stance&&this.contacts[i]){
        this.swings[i]={x:this.footX[i],h:this.footY[i],end:this.x+this.speed*.44/phaseRate+reach,progress:0};
      }
      if(stance&&!this.contacts[i]){
        this.contactHeight[i]=this.height(this.footX[i]);
        const rough=Math.abs(this.height(this.footX[i])-this.height(this.x-.5));
        const shock=rough*this.speed*(1-c.placement*1.1);
        this.lastImpact=Math.max(this.lastImpact,shock*8);
        this.omega+=shock*.78+(this.random()-.5)*.018;
        this.footSlip[i]=this.slip*(.8+.2*this.random());
        if(shock>.28){this.cause='落脚高度差 · 膝踝缓冲不足';this.event=this.cause;}
      }
      if(stance){this.footX[i]+=this.footSlip[i]*DT;this.footSlip[i]*=Math.exp(-DT*3);this.footY[i]+=clamp(this.height(this.footX[i])-this.footY[i],-8*DT,8*DT);}
      else {
        const swing=this.swings[i]??={x:this.footX[i],h:this.footY[i],end:this.x+reach,progress:0};
        swing.progress=clamp(swing.progress+DT*phaseRate/.42,0,1);
        const u=swing.progress;
        let tx=mix(swing.x,swing.end,smooth(u)),ty=mix(swing.h,this.height(swing.end),smooth(u))+Math.sin(u*Math.PI)*(.32+c.placement*.23);
        if(this.y>.04){
          tx=this.x+Math.sin(p*Math.PI*2)*.24;ty=this.height(this.x)+this.y+.2;
          // Rebase the next swing during flight; landing never uses a pre-jump world endpoint.
          Object.assign(swing,{x:this.footX[i],h:this.footY[i],end:this.x+reach,progress:0});
        }
        // Bounded swing velocity also blends landing and takeoff; stance feet stay planted.
        this.footX[i]+=clamp(tx-this.footX[i],-24*DT,24*DT);this.footY[i]+=clamp(ty-this.footY[i],-8*DT,8*DT);
      }
      this.contacts[i]=stance;this.previousPhase[i]=p;
    }
    // Passive mechanical damping exists with or without sensing; sensors add feedback torque.
    const disturbance=tractionExcess*.24+this.slip*.68+Math.abs(this.lateral)*.13;
    const angularAccel=disturbance+3.5*Math.sin(this.theta)-4.7*this.theta-1.5*this.omega+c.torque;
    this.omega+=angularAccel*DT;this.theta+=this.omega*DT;
    this.peakTilt=Math.max(this.peakTilt,Math.abs(this.theta));
    if(this.slip>.8)this.cause='足部滑移 · 支撑点向前滑动';
    if(tractionExcess>1)this.cause='转弯侧向载荷超过可用抓地力';
    if(Math.abs(this.lateral)>1.5){this.omega+=DT*.9;this.cause='转向不足 · 偏离中间跑道';}
    if(this.hasObstacles)for(const o of this.obstacles){
      if(!o.hit&&this.x+.22>o.x&&this.x-.22<o.x+o.width){
        const footBottom=this.y+.13,headTop=this.y+1.88-this.crouch*.77;
        if(o.type==='hurdle'?footBottom<o.height:headTop>o.height){o.hit=true;this.speed*=.66;this.trip(o.type==='hurdle'?'小腿撞上矮栏':'头部碰到横梁',o.type==='hurdle'?2.8:2.1,o.type==='hurdle'?'小腿':'头部');}
      }
      if(!o.passed&&this.x-.25>o.x+o.width){o.passed=true;if(!o.hit){this.passed++;this.event=o.type==='beam'?'已收身通过横梁':'已跨越矮栏，恢复步态';}}
    }
    this.imbalance=clamp(this.imbalance+DT*(Math.abs(this.theta)>.23?1:-1.7),0,2);
    if(Math.abs(this.theta)>.78||this.imbalance>1.6){this.falls++;this.fallStart=this.theta;this.fallCrouch=this.crouch;this.fallHeight=this.y;this.fallFeet=this.footX.map((x,i)=>({x,h:this.footY[i]}));this.event=this.cause||'重心越过支撑范围';this.transition('falling');}
    else if(this.imbalance>.38||Math.abs(this.theta)>.4)this.transition('stumbling');
    else if(Math.abs(this.theta)>.13||Math.abs(this.lateral)>.45)this.transition('unbalanced');
    else {this.transition('running');if(this.y===0&&!c.duck&&this.time>1&&this.time%3<DT)this.event=this.assist?`已接入：${Object.keys(this.sensors).filter(k=>this.sensors[k]).map(k=>SENSOR_NAMES[k]).join('、')}`:'基础节奏运行 · 所有传感器已关闭';}
    this.accel=(this.speed-oldSpeed)/DT;
  }
  stepFall(){
    this.control={target:0,torque:0,steer:0,jump:false,duck:false,placement:0};
    if(this.state==='falling'){
      this.speed=Math.max(0,this.speed-this.friction(this.x)*9.81*DT);this.x+=this.speed*DT;
      this.omega+=6*DT;this.theta=Math.min(Math.PI/2,this.theta+this.omega*DT);
      this.y=Math.max(0,this.y+this.vy*DT);this.vy-=12*DT;this.phase+=DT*.8;this.contacts=[false,false];
      if(this.age>.85){this.theta=Math.PI/2;this.contacts=[true,true];this.transition('fallen');}
    }else if(this.state==='fallen'){
      this.speed*=Math.exp(-DT*7);this.x+=this.speed*DT;
      if(this.repeat&&this.age>1.5){this.event='双手撑地，收腿起身';this.transition('recovering');}
    }else{
      this.speed=0;this.theta=Math.PI/2*(1-smooth(this.age/2));this.crouch=0;this.y=0;
      if(this.age>2){this.theta=0;this.omega=0;this.imbalance=0;this.heading=0;this.slip=0;this.phase=0;this.contacts=[true,true];this.footX=[this.x-.12,this.x+.15];this.footY=this.footX.map(x=>this.height(x));this.swings=[null,null];this.event='重新站稳，继续尝试';this.transition('running');}
    }
    this.peakTilt=Math.max(this.peakTilt,Math.abs(this.theta));
  }
}
