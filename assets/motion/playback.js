import {DT} from './world.js';

// Advance the same fixed-step clock in the standalone Demo and in the book.
export function createMotionPlayback({world,draw,settled,rate=()=>1}) {
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
        simulation.step();
        accumulator-=DT;
      }
    }
    last=now;
    const done=simulation.done&&(simulation.state==='fallen'||(simulation.speed<.04&&simulation.age>3));
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
