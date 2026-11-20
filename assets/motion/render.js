import {makePose,ROBOT_COLORS as C} from './rig.js';
import {clamp,mix,smooth} from './world.js';
const TAU=Math.PI*2;
export class MotionRenderer{
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.width=1200;this.height=610;this.dpr=1;}
  resize(){
    const r=this.canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
    const mobile=r.width<650,w=mobile?720:1200,h=mobile?760:610;
    this.width=w;this.height=h;this.dpr=dpr;
    this.canvas.width=Math.round(r.width*dpr);this.canvas.height=Math.round(r.height*dpr);
    this.ctx.setTransform(this.canvas.width/w,0,0,this.canvas.height/h,0,0);
  }
  project(x,h,z=0){return {x:(x-this.camera)*this.scale+this.anchor+z*13,y:this.ground+z*26-h*this.scale};}
  path(points,fill,stroke,width=1){const c=this.ctx;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));if(fill){c.closePath();c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
  line(a,b,color,width=1){this.path([a,b],null,color,width);}
  ellipse(x,y,rx,ry,fill){const c=this.ctx;c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);c.fillStyle=fill;c.fill();}
  round(x,y,w,h,r,fill,stroke=null){const c=this.ctx;c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();}}
  draw(w){
    const c=this.ctx,W=this.width,H=this.height,night=!w.track&&w.scene==='night',mobile=W<800;
    this.scale=mobile?145:113;this.anchor=mobile?240:390;this.camera=w.x;this.ground=mobile?H*.65:H*.68;
    if(w.scene==='curve'){
      // Leave room for the full fallen pose when the runner drifts toward the near edge.
      const runnerGround=this.project(w.x,0,w.center(w.x)+w.lateral);
      this.ground-=Math.max(0,runnerGround.y-(H-54));
    }
    c.clearRect(0,0,W,H);
    const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,night?'#162431':'#deeeea');sky.addColorStop(1,night?'#34474b':'#b8cdb6');c.fillStyle=sky;c.fillRect(0,0,W,H);
    this.background(w,night);
    this.track(w,night);
    this.finishLine(w,night);
    // Back obstacles, robot, then near uprights preserve depth cues.
    if(w.hasObstacles)for(const o of w.obstacles)if(o.x>w.x-4&&o.x<w.x+13)this.obstacle(w,o,false,night);
    if(w.track){
      const darkness=1-w.lightAt(w.x);
      if(darkness>0){
        c.fillStyle=`rgba(14,28,53,${darkness*.64})`;
        c.fillRect(0,0,W,H);
      }
    }
    this.robot(w);
    if(w.hasObstacles)for(const o of w.obstacles)if(o.x>w.x-4&&o.x<w.x+13)this.obstacle(w,o,true,night);
    const rain=w.track?smooth((w.x-w.track.definition.segments[5].start)/4):Number(w.scene==='wet');
    if(rain>0){
      c.save();c.globalAlpha=rain;this.rain(w);c.restore();
    }
    if(night){
      const p=this.project(w.x,.8,w.center(w.x));
      const light=c.createRadialGradient(p.x+60,p.y,40,p.x+60,p.y,mobile?320:460);
      light.addColorStop(0,'#07111d00');light.addColorStop(.65,'#07111d4d');light.addColorStop(1,'#07111db5');c.fillStyle=light;c.fillRect(0,0,W,H);
      c.fillStyle='#bed3da';c.font='11px system-ui';c.fillText(w.sensors.camera?'摄像头视距 1.05 m':'摄像头已关闭',28,H-74);
    }
    c.font='11px system-ui';c.fillStyle=night?'#9fb3bb':'#608379';c.fillText('双足关节运动 / 简化动力学',26,85);
    this.scaleBar(night);
  }
  background(w,night){
    const c=this.ctx,W=this.width,H=this.height;
    // Muted sports ground, local geometry only; no external textures or fonts.
    c.fillStyle=night?'#354a47':'#b8cdb5';c.fillRect(0,H*.36,W,H*.64);
    this.path([{x:0,y:H*.36},{x:W*.22,y:H*.28},{x:W*.47,y:H*.37},{x:W*.7,y:H*.31},{x:W,y:H*.36},{x:W,y:H*.43},{x:0,y:H*.43}],night?'#283c3c':'#c3d6c4');
    const offset=(w.x*7)%140;
    for(let x=-140-offset;x<W+140;x+=140){
      const y=H*.36;
      this.line({x,y:y-25},{x,y:y+40},night?'#607575':'#91ada3',2);
      this.line({x,y:y-24},{x:x+140,y:y-24},night?'#4c6260':'#a2bbb0',1);
      this.line({x,y:y+8},{x:x+140,y:y+8},night?'#4c6260':'#a2bbb0',1);
      for(let j=0;j<5;j++)this.line({x:x+j*28,y:y-24},{x:x+j*28,y:y+8},night?'#435c58':'#a5bdb2',.6);
    }
    for(let i=0;i<6;i++){
      const x=((i*260-w.x*4)%1700+1700)%1700-140;
      this.line({x,y:H*.35},{x,y:H*.17},night?'#647e78':'#9db5a9',3);
      this.round(x-24,H*.17-4,48,7,2,night?'#c5ccaa':'#e8ead9');
    }
  }
  finishLine(w,night){
    if(!Number.isFinite(w.finishX)||w.finishX<w.x-7||w.finishX>w.x+16)return;
    const x=w.finishX,h=w.height(x),center=w.center(x),c=this.ctx;
    for(let row=0;row<2;row++)for(let j=0;j<16;j++){
      const a=x+(row-.5)*.24,z=center-3.6+j*.45;
      this.path([this.project(a,h+.012,z),this.project(a+.24,h+.012,z),this.project(a+.24,h+.012,z+.45),this.project(a,h+.012,z+.45)],(row+j)%2?'#f9e8cf':'#354641');
    }
    for(const z of [-3.7,3.7]){
      const bottom=this.project(x,h,center+z),top=this.project(x,h+1.9,center+z);
      this.line(bottom,top,night?'#c5c4a5':'#617b6e',4);
      this.path([top,{x:top.x+36,y:top.y+4},{x:top.x+26,y:top.y+19},{x:top.x,y:top.y+17}],'#e8c889');
    }
    const label=this.project(x,h+2.18,center-3.7);c.fillStyle=night?'#e8d9b9':'#486455';c.font='bold 13px system-ui';c.fillText(`终点 · ${w.courseDistance} m`,label.x-30,label.y);
  }
  track(w,night){
    const c=this.ctx,left=w.x-8,right=w.x+16,points=[];
    for(let x=left;x<=right;x+=.18)points.push(this.project(x,w.height(x),w.center(x)-3.6));
    for(let x=right;x>=left;x-=.18)points.push(this.project(x,w.height(x),w.center(x)+3.6));
    this.path(points,night?'#804b45':'#bd6555');
    for(let lane=-3;lane<=3;lane+=1.5){const ps=[];for(let x=left;x<right;x+=.15)ps.push(this.project(x,w.height(x)+.005,w.center(x)+lane));this.path(ps,null,night?'#bc9080':'#f4cbb0',lane===-3||lane===3?2:1.5);}
    for(let n=Math.floor(left/5);n<right/5;n++){
      const x=n*5,p=this.project(x,w.height(x),w.center(x)+3.1),q=this.project(x,w.height(x),w.center(x)+3.5);
      this.line(p,q,night?'#a27f72':'#e5b49a',2);c.save();c.translate(q.x+5,q.y-6);c.fillStyle=night?'#bc9684':'#eac5ab';c.font='10px ui-monospace,monospace';c.fillText(`${n*5}m`,0,0);c.restore();
    }
    for(let n=Math.floor(left/2);n<=right/2;n++){
      const x=n*2+.3*Math.sin(n+w.terrainPhase);
      if(w.track?w.friction(x)<.5:w.scene==='wet'&&n*2>7){
        const z=.8*Math.sin(n*2),p=this.project(x,w.height(x),z);
        this.ellipse(p.x,p.y+4,55+15*Math.sin(n*3),9+3*Math.cos(n),night?'#78918b70':'#9abbb1a8');
        this.ellipse(p.x+8,p.y,37,1.2,'#d3e2d3a0');
      }
    }
    for(let n=Math.floor(left/.5);n<right/.5;n++){
      const x=n*.5;
      if(w.track?w.track.segmentAt(x).id!=='rough':w.scene!=='rough')continue;
      const p=this.project(x,w.height(x),w.center(x)+.65),q=this.project(x+.3,w.height(x+.3),w.center(x+.3)+.7);
      this.line(p,q,'#833e3470',3);this.line({x:p.x,y:p.y-3},{x:q.x,y:q.y-3},'#e69a7c80',1);
    }
    if(w.track)for(const segment of w.track.definition.segments){
      const x=segment.start;
      if(x<left||x>right)continue;
      const z=w.center(x),h=w.height(x);
      this.line(this.project(x,h,z-3.6),this.project(x,h,z+3.6),'#f5d683b5',2);
      const label=this.project(x,h+.18,z-3.6);
      c.fillStyle='#493c35';c.font='bold 14px system-ui';c.fillText(segment.name,label.x+4,label.y-8);
    }
    // A subtle marked middle lane makes drift, curvature and foot locations readable.
    c.setLineDash([9,13]);const mid=[];for(let x=left;x<right;x+=.12)mid.push(this.project(x,w.height(x),w.center(x)));this.path(mid,null,night?'#d6ad7d55':'#f6d6aa75',1);c.setLineDash([]);
  }
  obstacle(w,o,front,night){
    const c=this.ctx,cols=o.hit?['#ed8c66','#663c38']:['#f1c687','#656c60'];
    if(front){
      const z=1.05,b=this.project(o.x,0,z),top=this.project(o.x,o.type==='beam'?o.height+.22:o.height,z);
      this.line(b,top,cols[1],7);this.line({x:b.x-13,y:b.y+4},{x:b.x+16,y:b.y-2},cols[1],5);return;
    }
    const back=this.project(o.x,0,-1.05),bt=this.project(o.x,o.type==='beam'?o.height+.22:o.height,-1.05),ft=this.project(o.x,o.type==='beam'?o.height+.22:o.height,1.05);
    this.line(back,bt,cols[1],6);this.line(bt,ft,cols[0],o.type==='beam'?20:11);
    this.line({x:bt.x,y:bt.y-5},{x:ft.x,y:ft.y-5},'#fff0c3',2);
    c.fillStyle=night?'#c8b690':'#5f695b';c.font='10px system-ui';c.fillText(o.type==='beam'?'收身':'跨越',bt.x-12,bt.y-20);
    if(o.hit){c.fillStyle='#f7d5b7';c.font='12px system-ui';c.fillText('碰撞',ft.x+10,ft.y-10);}
  }
  robot(w){
    const c=this.ctx,pose=makePose(w),P=p=>this.project(p.x,p.h,p.z),ground=this.project(w.x,0,pose.hip.z);
    this.speechAnchor=P(pose.head);
    this.ellipse(ground.x+12,ground.y+4,45+pose.fall*55,8,`rgba(47,48,35,${.22-clamp(w.y*.1,0,.12)})`);
    // Ranging arc and contact dots are actual enabled observations, never a success animation.
    if(w.observation.range>0){
      const a=this.project(w.x+.6,.08,pose.hip.z),b=this.project(w.x+Math.min(w.observation.range,5),.08,pose.hip.z);
      c.save();c.setLineDash([4,7]);this.line(a,b,w.scene==='night'?'#82c6d5aa':'#3b8f8b80',1.2);c.restore();
      const end=w.observation.obstacle?this.project(w.x+w.observation.obstacle.distance,.12,pose.hip.z):b;
      this.ellipse(end.x,end.y,3,3,'#79cfc7');
    }
    const limb=(a,b,width,back=false)=>{
      const q=P(a),r=P(b);c.lineCap='round';this.line(q,r,C.edge,width+3);this.line(q,r,back?'#91a6ae':C.shell,width);
      this.line({x:q.x-2,y:q.y},{x:r.x-2,y:r.y},back?'#adbec3':C.light,Math.max(2,width*.25));
    };
    const joint=(p,r,back=false)=>{const q=P(p);this.ellipse(q.x,q.y,r,r,back?'#405863':C.joint);this.ellipse(q.x-1,q.y-1,r*.48,r*.48,'#8ba6af');};
    const arm=(a,back)=>{limb(a.shoulder,a.elbow,13,back);joint(a.elbow,6,back);limb(a.elbow,a.hand,11,back);joint(a.hand,7,back);};
    const leg=(l,back)=>{
      limb(l.hip,l.knee,21,back);joint(l.knee,9,back);limb(l.knee,l.ankle,17,back);joint(l.ankle,7,back);
      const a=P(l.ankle),toe=P(l.toe);c.save();c.translate(a.x,a.y);c.rotate(l.contact?Math.atan2(toe.y-a.y,toe.x-a.x):-.22*Math.sin(l.phase*TAU));
      this.round(-10,-5,36,14,5,back?'#647e88':C.edge);this.round(-7,-5,31,8,3,back?'#97adb3':C.shell);c.restore();
      if(l.contact&&w.sensors.force){this.ellipse(a.x+8,a.y+11,15,2.5,'#6bc9b5aa');}
      if(l.contact&&l.slip>.45){this.line({x:a.x-29,y:a.y+12},{x:a.x-8,y:a.y+12},'#e9dcbe',2);this.line({x:a.x-20,y:a.y+17},{x:a.x-5,y:a.y+17},'#e9dcbe90',1);}
    };
    arm(pose.arms[0],true);leg(pose.legs[0],true);
    // Torso, head, face and antenna share one smoothly rotated frame about the pelvis.
    const hip=P(pose.hip),neck=P(pose.neck);c.save();c.translate(hip.x,hip.y);c.rotate(Math.atan2(neck.x-hip.x,hip.y-neck.y));
    this.round(-19,-53,39,52,11,C.shell,C.edge);this.round(-15,-49,10,35,5,C.light);
    this.round(-12,-44,28,22,5,C.panel);for(let i=0;i<3;i++)this.ellipse(-5+i*7,-36,2.1,2.1,['#68c4a0','#56bfdc','#c1b0e4'][i]);
    this.round(-9,-11,26,10,4,C.edge);this.round(-6,-62,17,10,3,C.joint);
    this.round(-21,-101,48,40,12,C.shell,C.edge);this.round(-18,-98,39,8,6,C.light);
    this.round(-13,-88,35,16,6,C.panel);
    // Two forward-facing cyan eyes retain the approachable original character.
    for(let i=0;i<2;i++){
      if(w.state==='fallen'){this.line({x:-6+i*17,y:-81},{x:1+i*17,y:-77},C.eye,2);this.line({x:-6+i*17,y:-77},{x:1+i*17,y:-81},C.eye,2);}
      else{this.ellipse(-3+i*17,-80,4,5,C.eye);this.ellipse(-2+i*17,-81,1.3,1.7,'#e3fbff');}
    }
    this.line({x:1,y:-101},{x:1,y:-115},C.edge,3);this.ellipse(1,-117,4,4,'#dfb970');
    c.restore();leg(pose.legs[1],false);arm(pose.arms[1],false);joint(pose.arms[1].shoulder,8);
    if(w.collision&&w.time-w.collision.time<1.0){
      const part=w.collision.part==='头部'?P(pose.head):P(pose.legs[1].knee),fade=1-(w.time-w.collision.time);
      c.save();c.globalAlpha=fade;this.ellipse(part.x,part.y,15,15,'#e5805c55');c.strokeStyle='#f8ce8f';c.lineWidth=2;c.beginPath();c.arc(part.x,part.y,20,0,TAU);c.stroke();c.fillStyle='#593b2b';c.font='bold 12px system-ui';c.fillText(`${w.collision.part}碰撞`,part.x+28,part.y-12);c.restore();
    }
  }
  rain(w){
    const W=this.width,H=this.height;
    for(let i=0;i<46;i++){const x=(i*113+w.time*55)%W,y=(i*71+w.time*340)%H;this.line({x,y},{x:x-4,y:y+15},'#d9eeed70',1);}
  }
  scaleBar(night){const c=this.ctx,x=this.width-this.scale-30,y=this.height-78;c.strokeStyle=night?'#e3c7aa':'#f4d6bb';c.lineWidth=1;c.beginPath();c.moveTo(x,y-4);c.lineTo(x,y+4);c.moveTo(x,y);c.lineTo(x+this.scale,y);c.moveTo(x+this.scale,y-4);c.lineTo(x+this.scale,y+4);c.stroke();c.fillStyle=c.strokeStyle;c.font='10px ui-monospace,monospace';c.fillText('1 m',x+this.scale/2-10,y-8);}
}
