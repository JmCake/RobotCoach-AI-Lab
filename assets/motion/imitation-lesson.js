import {LESSON_SEED,ShortCourse} from './short-course.js';
import {MOTION_ACTION} from './world.js';

export function lessonTrack(moved=false){
  const course=new ShortCourse(LESSON_SEED);
  if(moved)course.world.obstacles[0].x-=2;
  return course;
}

// Match the present sensor reading to a demonstrated decision, without using time or track position.
export function imitate(samples,observation){
  let closest=Infinity,action=MOTION_ACTION.forward;
  for(const sample of samples){
    if(sample.type!==(observation.obstacle?.type??null)||sample.support!==observation.support)continue;
    const distance=Math.abs(sample.distance-(observation.obstacle?.distance??0))
      +.1*Math.abs(sample.speed-observation.speed);
    if(distance<closest){closest=distance;action=sample.action;}
  }
  return action;
}

export function readLesson(saved){
  return saved?.version===2&&Array.isArray(saved.samples)&&saved.samples.length>0&&saved.samples.every(s=>
    s&&Object.values(MOTION_ACTION).includes(s.action)&&Number.isFinite(s.distance)&&Number.isFinite(s.speed)
    &&[null,'beam','hurdle'].includes(s.type)&&typeof s.support==='boolean')?saved:null;
}
