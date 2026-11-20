import {rng} from '../learning.js';
import {clamp,mix,smooth} from './world.js';

export const RACE_SEED=2026;
export const RACE_TARGET=6.4;
export const TRACK_VERSION='continuous-six-v1';

export function createFinalTrack(seed=RACE_SEED) {
  seed=seed>>>0;
  // Layout randomness is isolated from gait disturbances.
  const random=rng(seed^0x75f06ccd);
  let end=0;
  const segments=[
    ['straight','直道加速',24],['obstacles','障碍跨越',30],['night','弱光挑战',28],
    ['curve','急弯控制',44],['rough','凹凸路面',30],['wet','湿滑冲刺',34],
  ].map(([id,name,length])=>{
    const start=end;
    end+=length;
    return Object.freeze({id,name,start,end});
  });
  const obstacles=[];
  for(const [index,offsets] of [[1,[2.6,12,22]],[2,[4.8,14,23.3]]]){
    offsets.forEach((offset,i)=>{
      const type=i===1?'beam':'hurdle';
      obstacles.push(Object.freeze({x:segments[index].start+offset+random()*.8,
        width:.42,height:type==='beam'?1.23:.48+random()*.1,type}));
    });
  }
  return Object.freeze({
    version:TRACK_VERSION,seed,distance:end,segments:Object.freeze(segments),obstacles:Object.freeze(obstacles),
    light:Object.freeze({edge:3,minimum:0}),
    curve:Object.freeze({lead:4,period:18,cycles:2,amplitude:2.8}),
    rough:Object.freeze({edge:4,amplitudes:Object.freeze([.105,.045]),frequencies:Object.freeze([3.7,8.1]),phase:random()*2*Math.PI}),
    friction:Object.freeze({dry:.88,wet:.22,wetRipple:.045,wetFrequency:1.9,edge:3,phase:random()*2*Math.PI}),
  });
}

export class FinalTrack {
  constructor(definition){
    this.definition=definition;
  }

  segmentAt(x){
    const {segments}=this.definition;
    return segments.find(segment=>x<segment.end)??segments.at(-1);
  }

  lightAt(x){
    const night=this.definition.segments[2],{edge,minimum}=this.definition.light;
    return mix(1,minimum,smooth((x-night.start)/edge)*smooth((night.end-x)/edge));
  }

  curveAngle(x){
    const {lead,period,cycles}=this.definition.curve;
    const t=x-this.definition.segments[3].start-lead;
    return Math.PI*clamp(t/period,0,cycles);
  }

  center(x){
    return this.definition.curve.amplitude*Math.sin(this.curveAngle(x))**4;
  }

  curvature(x){
    const {period,amplitude}=this.definition.curve;
    const a=this.curveAngle(x),k=Math.PI/period,s=Math.sin(a),c=Math.cos(a);
    const slope=4*amplitude*k*s**3*c;
    const bend=4*amplitude*k*k*(3*s*s*c*c-s**4);
    return bend/(1+slope*slope)**1.5;
  }

  height(x){
    const rough=this.definition.segments[4],t=x-rough.start;
    const {edge,amplitudes,frequencies,phase}=this.definition.rough;
    const envelope=smooth(t/edge)*smooth((rough.end-x)/edge);
    return envelope*(amplitudes[0]*Math.sin(t*frequencies[0]+phase)+amplitudes[1]*Math.sin(t*frequencies[1]));
  }

  friction(x){
    const {dry,wet,wetRipple,wetFrequency,edge,phase}=this.definition.friction;
    const t=x-this.definition.segments[5].start;
    return mix(dry,wet+wetRipple*Math.sin(t*wetFrequency+phase),smooth(t/edge));
  }
}
