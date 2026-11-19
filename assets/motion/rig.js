// Articulated extension of assets/robot.svg: slate shell, cyan eyes, antenna and chest lights.
// Original RobotCoachAI styling is MIT-declared; see THIRD_PARTY_NOTICES.md.
import {mix,clamp,smooth} from './world.js';
export const ROBOT_COLORS={shell:'#bdcbd1',light:'#edf3ef',edge:'#4c6572',joint:'#445a65',eye:'#48c9e8',panel:'#284451'};
const point=(x,h,z=0)=>({x,h,z});
function ik(a,b,l1,l2,side=1){
  const dx=b.x-a.x,dy=b.h-a.h,d=clamp(Math.hypot(dx,dy),.02,l1+l2-.001),angle=Math.atan2(dy,dx),bend=Math.acos(clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1));
  return point(a.x+Math.cos(angle+side*bend)*l1,a.h+Math.sin(angle+side*bend)*l1,mix(a.z,b.z,.5));
}
export function makePose(w){
  const fallen=['falling','fallen','recovering'].includes(w.state),recover=w.state==='recovering'?smooth(w.age/2):0;
  const fall=fallen?(w.state==='falling'?smooth(w.age/.85):1-recover):0;
  const bob=.035*Math.cos(w.phase*Math.PI*4)*Math.min(1,w.speed/2)*(1-fall);
  const floor=w.height(w.x),hipH=mix(.94+bob-w.crouch*.43+w.y+floor,.22+floor,fall);
  const bank=clamp(w.speed*w.speed*w.curvature(w.x)/9.81,-.55,.55)*.45*(1-fall);
  const angle=clamp(.1*Math.min(1,w.speed/3)+w.theta+bank+w.crouch*(1-fall),-.4,1.63),lean=Math.sin(angle),up=Math.cos(angle);
  const z=w.center(w.x)+w.lateral;
  const hip=point(w.x,hipH,z),chest=point(w.x+lean*.48,hipH+up*.48,z-w.turn*.025);
  const neck=point(w.x+lean*.65,hipH+up*.65,z-w.turn*.035);
  const head=point(w.x+lean*.84,hipH+up*.84,z-w.turn*.035);
  const legs=[],arms=[];
  for(let i=0;i<2;i++){
    const side=i===0?-.15:.15,p=(w.phase+i*.5)%1,stance=w.contacts[i]&&!fallen;
    const root=point(hip.x,hip.h,hip.z+side);
    let x=w.footX[i],h=w.footY[i]+.075;
    if(fallen){
      const start=w.fallFeet[i];
      x=mix(start.x,w.x-.62+i*.13,fall);h=mix(start.h+.075,floor+.09,fall);
      if(w.state==='recovering'){x=mix(w.x-.62+i*.13,w.x+(i? .15:-.12),recover);h=mix(floor+.09,w.height(x)+.075,recover);}
    }
    const foot=point(x,h,z+side),regular=ik(root,foot,.56,.56),folded=ik(root,foot,.56,.56,-1),fold=smooth(fall*1.5);
    // Blend into a folded knee continuously instead of flipping the IK branch at ground contact.
    const knee=point(mix(regular.x,folded.x,fold),mix(regular.h,folded.h,fold),regular.z);
    knee.h=Math.max(w.height(knee.x)+.06,knee.h);
    legs.push({hip:root,knee,ankle:foot,contact:stance||w.state==='fallen',slip:w.footSlip[i],toe:point(x+.23,h-.025,z+side),phase:p});
    // Contralateral shoulders and elbows. More reach during instability, brace before impact.
    const shoulder=point(chest.x,chest.h,chest.z+side*1.15),swing=-Math.sin(p*Math.PI*2)*(.4*Math.min(1,w.speed/2));
    const balance=clamp(Math.abs(w.theta)*1.1,0,.7),armAngle=swing+balance;
    let elbow=point(shoulder.x+Math.sin(armAngle)*.34,shoulder.h-Math.cos(armAngle)*.34,shoulder.z+side*balance);
    let hand=point(elbow.x+.26*Math.cos(armAngle-.2),elbow.h+.26*Math.sin(armAngle-.2),elbow.z);
    const brace=smooth(fall*2);
    elbow=point(mix(elbow.x,w.x+.66,brace),mix(elbow.h,floor+.35,brace),shoulder.z);
    hand=point(mix(hand.x,w.x+.92,brace),mix(hand.h,floor+.08,brace),shoulder.z);
    arms.push({shoulder,elbow,hand});
  }
  return {hip,chest,neck,head,legs,arms,angle,fall};
}
