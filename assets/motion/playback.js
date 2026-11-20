import {DT} from './world.js';

export function motionSettled(world){
  return world.done&&(world.state==='fallen'||(world.speed<.04&&world.age>3));
}

// Advance the same fixed-step clock in the standalone Demo and in the book.
export function createMotionPlayback({world,draw,settled,rate=()=>1,step=simulation=>simulation.step()}) {
  let frame=null,last=null,accumulator=0;

  function pause() {
    if(frame!==null)cancelAnimationFrame(frame);
    frame=last=null;
    accumulator=0;
  }

  function tick(now) {
    const simulation=world();
    if(last!==null){
      accumulator+=Math.min((now-last)/1000,.1)*rate();
      while(accumulator>=DT){
        step(simulation);
        accumulator-=DT;
      }
    }
    last=now;
    const done=motionSettled(simulation);
    frame=done?null:requestAnimationFrame(tick);
    draw(now);
    if(done){
      pause();
      settled();
    }
  }

  return {
    get running(){return frame!==null;},
    start(){if(frame===null)frame=requestAnimationFrame(tick);},
    pause,
  };
}
