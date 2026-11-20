import {MotionRenderer} from './render.js';
import {raceFrameView} from './race-record.js';
import {DT,STATE_NAMES} from './world.js';

const seconds=tick=>`${(tick*DT).toFixed(3)} 秒`;

function eventLabel(event,record) {
  switch(event.type){
    case 'segment': return record.track.segments.find(segment=>segment.id===event.segment).name;
    case 'obstacle-pass': return `越障 ${event.passed}`;
    case 'collision': return `碰撞 · ${event.reason}`;
    case 'score': {
      const {outcome,reason}=record.score;
      if(outcome==='finished')return '冲过终点 · 成绩锁定';
      if(outcome==='aborted')return '退出比赛 · 成绩已记录';
      return `成绩锁定${reason?` · ${reason}`:''}`;
    }
    case 'motion-state':
      return ['falling','fallen'].includes(event.state)?STATE_NAMES[event.state]:null;
    default: return null;
  }
}

export function createRaceReplay(panel,visible) {
  const find=id=>panel.querySelector(`#${id}`);
  const canvas=find('replayCanvas'),renderer=new MotionRenderer(canvas);
  const play=find('replayPlay'),speed=find('replaySpeed'),progress=find('replayProgress');
  const time=find('replayTime'),status=find('replayStatus'),events=find('replayEvents');
  const scoreMark=find('replayScoreMark');
  let record=null,buttons=[],tick=0,position=0,previousTime=null,request=null;

  function draw() {
    const frame=raceFrameView(record,tick);
    renderer.draw(frame);
    progress.value=tick;
    progress.setAttribute('aria-valuetext',seconds(tick));
    time.textContent=`${seconds(tick)} / ${seconds(record.presentation.tick)}`;
    const {score}=record;
    const segment=frame.track.segmentAt(frame.x).name;
    let result='';
    if(tick>=score.tick){
      if(score.outcome==='aborted')result='已退出 · 记录结束 · ';
      else result=`${score.outcome==='finished'?'已过终点 · ':''}成绩锁定 ${seconds(score.tick)} · `;
    }
    status.textContent=`${result}${segment} · ${STATE_NAMES[frame.state]}`;
    status.dataset.locked=String(tick>=score.tick&&score.outcome!=='aborted');
    for(const button of buttons){
      if(Number(button.dataset.tick)===tick)button.setAttribute('aria-current','time');
      else button.removeAttribute('aria-current');
    }
  }

  function updatePlay() {
    play.textContent=request!==null?'暂停回放':tick>0&&tick===record?.presentation.tick?'从头播放':'播放回放';
  }

  function pause() {
    if(request!==null)cancelAnimationFrame(request);
    request=previousTime=null;
    updatePlay();
  }

  function seek(target) {
    pause();
    tick=position=target;
    draw();
    updatePlay();
  }

  function advance(now) {
    if(!visible()){pause();return;}
    const end=record.presentation.tick;
    if(previousTime!==null)position=Math.min(end,position+(now-previousTime)*Number(speed.value)/(1000*DT));
    previousTime=now;
    const next=Math.floor(position);
    if(next!==tick){
      tick=next;
      draw();
    }
    if(tick===end)pause();
    else request=requestAnimationFrame(advance);
  }

  play.addEventListener('click',()=>{
    if(request!==null){pause();return;}
    if(!record||!visible()||record.presentation.tick===0)return;
    if(tick===record.presentation.tick)seek(0);
    request=requestAnimationFrame(advance);
    updatePlay();
  });
  progress.addEventListener('input',()=>{if(record)seek(progress.valueAsNumber);});
  new ResizeObserver(()=>{
    if(!record)return;
    renderer.resize();
    draw();
  }).observe(canvas);

  return {
    open(savedRecord) {
      record=savedRecord;
      const end=record.presentation.tick;
      progress.max=end;
      play.disabled=speed.disabled=progress.disabled=end===0;
      speed.value='1';
      const marked=record.score.outcome!=='aborted';
      scoreMark.hidden=!marked;
      if(marked)scoreMark.style.setProperty('--score-position',`${end===0?0:record.score.tick/end*100}%`);
      buttons=[];
      events.replaceChildren();
      for(const event of record.events){
        const label=eventLabel(event,record);
        if(!label)continue;
        const item=document.createElement('li'),button=document.createElement('button');
        button.type='button';
        button.dataset.tick=event.tick;
        button.textContent=`${seconds(event.tick)} · ${label}`;
        button.addEventListener('click',()=>seek(event.tick));
        item.append(button);
        events.append(item);
        buttons.push(button);
      }
      panel.hidden=false;
      renderer.resize();
      seek(0);
      find('replayTitle').focus();
    },
    close() {
      pause();
      record=null;
      panel.hidden=true;
    },
    pause,
  };
}
