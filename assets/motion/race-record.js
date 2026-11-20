import {DT} from './world.js';
import {FinalTrack} from './final-track.js';

const POSITION_FIELDS=['x','speed','phase','y','vy','theta','omega','lateral','heading','turn','slip','crouch','compression','age'];
export const FRAME_FIELDS=Object.freeze([
  'tick',...POSITION_FIELDS,'state','scene','contacts','footX','footY','footSlip','fallFeet',
  'hitMask','range','visualRange','obstacleDistance','collision',
]);
const round=value=>Math.round(value*1e6)/1e6;

export function captureRaceFrame(world,tick) {
  return [
    tick,...POSITION_FIELDS.map(field=>round(world[field])),world.state,world.scene,
    world.contacts.slice(),world.footX.map(round),world.footY.map(round),world.footSlip.map(round),
    world.fallFeet?.map(foot=>({x:round(foot.x),h:round(foot.h)}))??null,
    world.obstacles.reduce((mask,obstacle,index)=>mask|(obstacle.hit?1<<index:0),0),
    round(world.observation.range),round(world.observation.visualRange),
    world.observation.obstacle?round(world.observation.obstacle.distance):null,
    world.collision?{time:round(world.collision.time),part:world.collision.part}:null,
  ];
}

// A renderable view of a captured frame. No physics, sensing or policy runs here.
export function raceFrameView(record,index) {
  const frame=record.frames[index];
  if(!frame)return null;
  const state=Object.fromEntries(record.frameFields.map((key,i)=>[key,frame[i]]));
  const track=new FinalTrack(record.track);
  return {
    ...state,track,time:state.tick*DT,finishX:record.track.distance,courseDistance:record.track.distance,
    sensors:record.sensors,hasObstacles:true,terrainPhase:record.appearance.terrainPhase,
    center:x=>track.center(x),height:x=>track.height(x),curvature:x=>track.curvature(x),
    lightAt:x=>track.lightAt(x),friction:x=>track.friction(x),
    observation:{range:state.range,visualRange:state.visualRange,
      obstacle:state.obstacleDistance===null?null:{distance:state.obstacleDistance}},
    obstacles:record.track.obstacles.map((obstacle,i)=>({...obstacle,hit:Boolean(state.hitMask&(1<<i))})),
  };
}
