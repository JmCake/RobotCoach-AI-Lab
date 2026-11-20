import {DT,SENSOR_NAMES,STATE_NAMES} from './world.js';
import {FinalTrack,TRACK_VERSION} from './final-track.js';
import {RULE_ACTION_PARAMETERS} from './short-course.js';

export const RACE_RECORD_VERSION=1;
const POSITION_FIELDS=['x','speed','phase','y','vy','theta','omega','lateral','heading','turn','slip','crouch','compression','age'];
export const FRAME_FIELDS=Object.freeze([
  'tick',...POSITION_FIELDS,'state','scene','contacts','footX','footY','footSlip','fallFeet',
  'hitMask','range','visualRange','obstacleDistance','collision',
]);
const round=value=>Math.round(value*1e6)/1e6;
const segmentIds=['straight','obstacles','night','curve','rough','wet'];
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const count=value=>Number.isSafeInteger(value)&&value>=0;
const numeric=value=>Number.isFinite(value)&&Math.abs(value)<=1e6;
const positive=value=>numeric(value)&&value>=.001;
const pair=(value,test)=>Array.isArray(value)&&value.length===2&&value.every(test);
const boolean=value=>typeof value==='boolean';
const motionState=value=>typeof value==='string'&&Object.hasOwn(STATE_NAMES,value);
const clock=value=>object(value)&&count(value.tick)&&value.time===value.tick*DT;
const outcomeNames={finished:'成功完赛',failed:'本场未通过',aborted:'已退出 · 未完成'};

export function raceScoreText(score,distance) {
  const reason=score.reason?` · ${score.reason}`:'';
  return `${outcomeNames[score.outcome]}${reason} · ${score.distance.toFixed(1)} / ${distance} m · ${score.time.toFixed(1)} 秒 · 越障 ${score.passed}`;
}

export function isRaceSensors(sensors) {
  return object(sensors)&&Object.keys(SENSOR_NAMES).every(key=>boolean(sensors[key]));
}

export function isRaceScore(score) {
  return clock(score)&&['finished','failed','aborted'].includes(score.outcome)&&
    (score.reason===null||typeof score.reason==='string')&&numeric(score.distance)&&
    count(score.passed)&&count(score.collisions)&&count(score.falls)&&boolean(score.offTrack)&&
    segmentIds.includes(score.segment);
}

function validTrack(track) {
  if(!object(track)||track.version!==TRACK_VERSION||!count(track.seed)||!positive(track.distance))return false;
  const {segments,obstacles,light,curve,rough,friction}=track;
  if(!Array.isArray(segments)||segments.length!==segmentIds.length||
    !segments.every((segment,i)=>object(segment)&&segment.id===segmentIds[i]&&
      typeof segment.name==='string'&&segment.start===(i===0?0:segments[i-1].end)&&
      positive(segment.end)&&segment.end>segment.start)||segments.at(-1).end!==track.distance)return false;
  return Array.isArray(obstacles)&&obstacles.length<=31&&obstacles.every(obstacle=>object(obstacle)&&
    numeric(obstacle.x)&&obstacle.x>=0&&obstacle.x<=track.distance&&positive(obstacle.width)&&
    positive(obstacle.height)&&['beam','hurdle'].includes(obstacle.type))&&
    object(light)&&positive(light.edge)&&numeric(light.minimum)&&light.minimum>=0&&light.minimum<=1&&
    object(curve)&&positive(curve.period)&&numeric(curve.lead)&&positive(curve.cycles)&&numeric(curve.amplitude)&&
    object(rough)&&positive(rough.edge)&&pair(rough.amplitudes,numeric)&&pair(rough.frequencies,numeric)&&numeric(rough.phase)&&
    object(friction)&&positive(friction.edge)&&['dry','wet','wetRipple','wetFrequency','phase'].every(key=>numeric(friction[key]));
}

function validStrategy(strategy) {
  if(!object(strategy)||typeof strategy.id!=='string')return false;
  if(strategy.kind==='rule')return object(strategy.parameters)&&
    Object.keys(RULE_ACTION_PARAMETERS).every(key=>numeric(strategy.parameters[key]));
  const model=strategy.model;
  return strategy.kind==='learned'&&object(model)&&model.version===1&&count(model.updates)&&object(model.q);
}

function validFrame(frame,tick,obstacleCount) {
  if(!Array.isArray(frame)||frame.length!==FRAME_FIELDS.length||frame[0]!==tick)return false;
  const poseEnd=1+POSITION_FIELDS.length;
  for(let i=1;i<poseEnd;i++)if(!numeric(frame[i]))return false;
  const [state,scene,contacts,footX,footY,footSlip,fallFeet,hitMask,range,visualRange,obstacleDistance,collision]=frame.slice(poseEnd);
  return motionState(state)&&segmentIds.includes(scene)&&pair(contacts,boolean)&&
    [footX,footY,footSlip].every(foot=>pair(foot,numeric))&&
    (fallFeet===null||pair(fallFeet,foot=>object(foot)&&numeric(foot.x)&&numeric(foot.h)))&&
    count(hitMask)&&hitMask<2**obstacleCount&&numeric(range)&&numeric(visualRange)&&
    (obstacleDistance===null||numeric(obstacleDistance))&&
    (collision===null||(object(collision)&&numeric(collision.time)&&typeof collision.part==='string'));
}

export function isReplayableRace(record) {
  if(!object(record)||record.version!==RACE_RECORD_VERSION||record.motionModel!=='motion-world-continuous-v1')return false;
  const {track,sensors,strategy,appearance,contracts,frameFields,frames,score,presentation,events,decisions}=record;
  if(!validTrack(track)||!isRaceSensors(sensors)||!validStrategy(strategy)||!numeric(appearance?.terrainPhase)||
    contracts?.physicsHz!==1/DT||!isRaceScore(score)||!clock(presentation)||score.tick>presentation.tick||
    !['complete','interrupted'].includes(presentation.status)||!motionState(presentation.displayState)||
    !Array.isArray(frameFields)||frameFields.length!==FRAME_FIELDS.length||
    !FRAME_FIELDS.every((name,i)=>name===frameFields[i]))return false;
  return Array.isArray(frames)&&frames.length===presentation.tick+1&&
    frames.every((frame,i)=>validFrame(frame,i,track.obstacles.length))&&
    Array.isArray(decisions)&&Array.isArray(events)&&events.every((event,i)=>clock(event)&&
      event.tick<=presentation.tick&&(i===0||event.tick>=events[i-1].tick)&&typeof event.type==='string'&&
      (event.type!=='segment'||segmentIds.includes(event.segment))&&
      (event.type!=='obstacle-pass'||count(event.passed))&&
      (event.type!=='collision'||typeof event.reason==='string')&&
      (event.type!=='motion-state'||motionState(event.state))&&
      (event.type!=='score'||event.tick===score.tick))&&events.some(event=>event.type==='score');
}

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
