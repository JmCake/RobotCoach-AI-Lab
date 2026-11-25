import {DT} from './world.js';

// Both views read the event log at the displayed tick, including after a backwards seek.
export function showRaceCall(element,record,tick) {
  let caption='',tone='';
  if(record?.score&&tick>=record.score.tick){
    const {outcome,distance}=record.score;
    tone=outcome;
    const label=outcome==='finished'?'冲线':outcome==='aborted'?'退出比赛':'本场未通过';
    caption=`${label} · ${distance.toFixed(1)} m`;
  }else if(record){
    const event=record.events.findLast(event=>event.tick<=tick&&(tick-event.tick)*DT<=1.5&&
      (event.type==='obstacle-pass'||event.type==='collision'));
    if(event){
      tone=event.type;
      caption=event.type==='collision'?event.reason:`越过第 ${event.passed} 个障碍`;
    }
  }
  if(element.textContent!==caption)element.textContent=caption;
  if(element.dataset.tone!==tone)element.dataset.tone=tone;
  element.hidden=!caption;
}
