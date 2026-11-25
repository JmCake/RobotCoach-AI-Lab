import {MotionRenderer} from '../motion/render.js';
import {makePose} from '../motion/rig.js';

export const media=name=>new URL('media/'+name,import.meta.url).href;
const gearNames=['camera','lidar','imu','force'];

async function picture(name){
  const image=new Image();
  image.src=media(name+'.webp');
  await image.decode();
  return image;
}

export async function loadArtwork(){
  const [registration,atlas,...equipment]=await Promise.all([
    fetch(media('registration.json')).then(response=>{
      if(!response.ok)throw new Error('角色画层未载入');
      return response.json();
    }),picture('runner'),...gearNames.map(picture),
  ]);
  return {...registration,atlas,gear:Object.fromEntries(gearNames.map((name,i)=>[name,equipment[i]]))};
}

// Change the painted skin only. The course renderer projects every measured
// joint and the same track geometry as the regular 40 m experiment.
export class StoryTrack extends MotionRenderer{
  constructor(canvas){
    super(canvas);
    this.grandstand.src=media('stadium.webp');
  }

  robot(world){
    if(!this.art)return super.robot(world);
    const {atlas,pieces,gear,sourceScale}=this.art;
    const pose=makePose(world), c=this.ctx, project=p=>this.project(p.x,p.h,p.z);
    const hip=project(pose.hip),neck=project(pose.neck);
    const width=this.scale*1.94/(358*sourceScale);
    function segment(name,start,end){
      const {rect,a,b}=pieces[name];
      const sx=b[0]-a[0],sy=b[1]-a[1],length=Math.hypot(sx,sy);
      const dx=end.x-start.x,dy=end.y-start.y,projected=Math.max(.1,Math.hypot(dx,dy));
      const ux=sx/length,uy=sy/length;
      const nx=-dy/projected*width,ny=dx/projected*width;
      const xx=dx/length*ux-nx*uy,xy=dx/length*uy+nx*ux;
      const yx=dy/length*ux-ny*uy,yy=dy/length*uy+ny*ux;
      c.save();
      c.transform(xx,yx,xy,yy,start.x-xx*a[0]-xy*a[1],start.y-yx*a[0]-yy*a[1]);
      c.drawImage(atlas,...rect,0,0,rect[2],rect[3]);
      c.restore();
    }
    const part=(name,p,meters,angle=0)=>{
      if(!world.sensors[name])return;
      const w=meters*this.scale,h=w*gear[name].height/gear[name].width;
      c.save();c.translate(p.x,p.y);c.rotate(angle);c.drawImage(gear[name],-w/2,-h/2,w,h);c.restore();
    };
    const leg=i=>{
      const side=i?'near':'far',l=pose.legs[i];
      const knee=project(l.knee),ankle=project(l.ankle),toe=project(l.toe);
      segment(side+'_thigh',project(l.hip),knee);
      segment(side+'_shin',knee,ankle);
      segment('near_boot',ankle,toe);
      part('force',{x:(ankle.x+toe.x)/2,y:toe.y+this.scale*.035},.29,
           Math.atan2(toe.y-ankle.y,toe.x-ankle.x));
    };
    const arm=i=>{
      const side=i?'near':'far',a=pose.arms[i];
      const elbow=project(a.elbow),hand=project(a.hand);
      segment(side+'_upper',project(a.shoulder),elbow);
      segment(side+'_fore',elbow,hand);
      segment(side+'_fist',hand,{x:hand.x+(hand.x-elbow.x)*.40,y:hand.y+(hand.y-elbow.y)*.40});
    };
    const tilt=Math.atan2(neck.x-hip.x,hip.y-neck.y);
    const onAxis=(at,forward,up)=>({x:at.x+this.scale*(forward*Math.cos(tilt)+up*Math.sin(tilt)),
                                    y:at.y+this.scale*(forward*Math.sin(tilt)-up*Math.cos(tilt))});
    const ground=this.project(world.x,world.height(world.x),pose.hip.z);
    this.ellipse(ground.x+5,ground.y+3,this.scale*(.36+.27*pose.fall),6,'#15243255');
    leg(0);arm(0);leg(1);
    segment('shell',hip,neck);
    part('imu',onAxis(neck,.08,-.18),.23,tilt);
    arm(1);
    segment('head',neck,onAxis(neck,.055,.39));
    part('camera',onAxis(neck,-.075,.20),.16,tilt);
    part('lidar',onAxis(neck,.048,.46),.27,tilt);
    this.speechAnchor=project(pose.head);
  }
}
