import {StoryTrack,loadArtwork,media} from '../story/track.js';
import {createCurveTrial} from '../motion/curve-trial.js';
import {DT} from '../motion/world.js';
import {lessonTrack,imitate} from '../motion/imitation-lesson.js';
import {ACTION_NAMES,ruleAction} from '../motion/short-course.js';
import {MotionTrainer,compareFrozen} from '../motion/short-learning.js';
import {FinalRace,raceStrategy} from '../motion/final-race.js';
import {raceFrameView} from '../motion/race-record.js';
import {openField} from './field.js';
import {LocationSound} from './location-sound.js';

const $=id=>document.getElementById(id);
const movie=$('movie'), track=$('track'), still=$('still'), sub=$('sub');
const asset=name=>new URL(name,import.meta.url).href;
const json=name=>fetch(asset(name)).then(r=>r.json());
const [lines,art,openingMounts,bridgeMounts,endingMounts]=await Promise.all([
  json('lines.json'),loadArtwork(),json('opening-mounts.json'),json('bridge-mounts.json'),json('ending-mounts.json'),
]);
const locationSound=new LocationSound();
const renderer=new StoryTrack(track);renderer.art=art;
const gear={camera:true,lidar:false,imu:false,force:false};
const names={camera:'摄像头',lidar:'激光雷达',imu:'姿态 IMU',force:'足底力觉'};
const journal={trials:[],training:{},events:[],field:null};
let phase='',paused=false,muted=false,clock=0,update=null,last=0,world=null,monitor=true;
let videoEnd=null,voice=new Audio(),audioKey='',gearFrames=null,mountIndex=-1,spliceId=0;
let trainer,comparison,race,chosen='learned',completed=[],clue='',courseResult,trainingStill='';
const dec=n=>Number(n).toFixed(1);
function trace(event,detail={}){journal.events.push({event,...detail});}
function mark(name){
  phase=name;document.body.dataset.phase=name;trace(name);
  locationSound.mix(phase,muted,paused);
  // A snapshot at teaching boundaries also makes the actual class results available after the screening.
  try{sessionStorage.setItem('robotcoach:screening:last',JSON.stringify(journal));}catch{}
}
function surface(id){
  for(const name of ['still','movie','track','ground'])$(name).hidden=name!==id;
  $('mounts').replaceChildren();$('mounts').style.opacity='1';mountIndex=-1;
}
function wipe(){
  const src=snapshot();if(!src)return;
  const img=$('splice'),id=++spliceId;
  img.getAnimations().forEach(a=>a.cancel());img.src=src;img.hidden=false;
  img.animate([{opacity:1},{opacity:0}],{duration:680,fill:'forwards'}).finished.then(()=>{
    if(spliceId===id)img.hidden=true;
  }).catch(()=>{});
}
function snapshot(){
  if(!track.hidden&&track.width)return track.toDataURL('image/webp',.8);
  if(!$('ground').hidden)return $('ground').toDataURL('image/webp',.86);
  if(!still.hidden)return still.currentSrc||still.src;
  if(!movie.hidden&&movie.readyState>=2){
    const c=document.createElement('canvas');c.width=960;c.height=540;c.getContext('2d').drawImage(movie,0,0,960,540);return c.toDataURL('image/webp',.8);
  }
}
function begin(id,cinema=false){
  videoEnd=null;movie.pause();voice.pause();audioKey='';update=null;world=null;gearFrames=null;clock=0;
  for(const id of ['cutin','split','count','slate','sub','memory'])$(id).hidden=true;
  $('choices').replaceChildren();$('desk').hidden=cinema;document.body.classList.toggle('cinema',cinema);
  $('notice').textContent='';mark(id);
}
function info(scene,title,detail=''){
  $('scene').textContent=scene;$('heading').textContent=title;$('detail').textContent=detail;
}
function slate(text){$('slate').hidden=!text;$('slate').textContent=text;}
function image(url,description=''){
  surface('still');still.src=url;still.alt=description;
}
function btn(text,fn,style='',parent=$('choices')){
  const b=document.createElement('button');b.type='button';b.textContent=text;b.className=style;
  b.onclick=()=>{if(!paused)fn();};parent.append(b);return b;
}
function main(label,fn){return btn(label,fn,'primary');}
function live(w){
  world=w;surface('track');renderer.resize();renderer.draw(w);
}
new ResizeObserver(()=>{if(world&&!track.hidden&&track.clientWidth){renderer.resize();renderer.draw(world);}}).observe(track);
function simulation(step,draw,done,finished,rate=1){
  let debt=0;
  update=dt=>{
    debt+=dt*rate;
    while(debt>=DT&&!done()){step();debt-=DT;}
    draw();
    if(done()){update=null;finished();}
  };
}
function mounts(rows){
  const store=$('mounts');let i=0;
  for(const [name,x,y,width,angle] of rows){
    if(!gear[name])continue;
    const img=store.children[i++]||document.createElement('img');
    if(img.dataset.part!==name){img.src=media(name+'.webp');img.dataset.part=name;img.alt='';}
    Object.assign(img.style,{left:x+'%',top:y+'%',width:width+'%',transform:'translate(-50%,-50%) rotate('+angle+'rad)'});
    if(!img.parentNode)store.append(img);
  }
  while(store.children.length>i)store.lastChild.remove();
}
function subtitle(who,text){
  sub.hidden=!text;sub.firstElementChild.textContent=who;sub.lastElementChild.textContent=text;
}
function speak(key){
  audioKey=key;voice.src=asset(key+'.m4a');voice.muted=muted;
  voice.play().catch(()=>{});subtitle(lines[key].role,lines[key].line);
}
function dialogue(keys,finish,atLine=()=>{}){
  let i=0,start=clock;
  function next(){speak(keys[i]);atLine(keys[i]);}
  next();
  update=()=>{
    if(clock-start<lines[keys[i]].duration+.5)return;
    if(++i<keys.length){start=clock;next();return;}
    voice.pause();audioKey='';sub.hidden=true;update=null;finish();
  };
}
function soundLabel(){movie.muted=voice.muted=muted;$('sound').textContent=muted?'开启声音':'静音';$('sound').setAttribute('aria-pressed',String(!muted));locationSound.mix(phase,muted,paused);}
async function playMovie(){
  if(paused||!videoEnd)return;
  try{await movie.play();}catch(error){
    if(error.name==='AbortError')return;
    if(error.name==='NotAllowedError'&&!muted){muted=true;soundLabel();await movie.play().catch(()=>togglePause(true));}
    else togglePause(true);
  }
}
function film(src,done,frames,offset=0){
  surface('movie');gearFrames=frames;videoEnd=done;const token=done;soundLabel();
  movie.src=src;movie.onloadedmetadata=()=>{if(videoEnd!==token)return;if(offset)movie.currentTime=offset;playMovie();};
  movie.load();
}
movie.onended=()=>{if(videoEnd){const fn=videoEnd;videoEnd=null;fn();}};
movie.onerror=()=>{if(videoEnd){togglePause(true);$('notice').textContent='影片读取失败，点击继续重载当前镜头。';}};
function togglePause(value=!paused){
  paused=value;$('pause').textContent=paused?'继续':'暂停';$('pause').setAttribute('aria-pressed',String(paused));last=0;
  locationSound.mix(phase,muted,paused);
  for(const animation of $('splice').getAnimations()){if(paused)animation.pause();else animation.play();}
  for(const item of document.querySelectorAll('#choices button,#choices select,#split button'))item.inert=paused;
  if(paused){movie.pause();voice.pause();}
  else{if(videoEnd&&movie.error){const t=movie.currentTime;movie.load();movie.currentTime=t;}playMovie();if(audioKey&&!voice.ended)voice.play().catch(()=>{});}
}
$('pause').onclick=()=>togglePause();$('sound').onclick=()=>{muted=!muted;soundLabel();};
function unlock(){locationSound.unlock();locationSound.mix(phase,muted,paused);}
document.addEventListener('pointerdown',unlock,{once:true});document.addEventListener('keydown',unlock,{once:true});
$('full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('notice').textContent='可按 F11 进入全屏。';}};
document.addEventListener('fullscreenchange',()=>{$('full').textContent=document.fullscreenElement?'退出全屏':'全屏';});
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat&&!['BUTTON','SELECT','CANVAS','INPUT'].includes(e.target.tagName)){e.preventDefault();togglePause();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!paused&&phase!=='black')togglePause(true);});
function frame(now){
  const dt=last?Math.min(.12,(now-last)/1000):0;last=now;
  if(!paused){
    clock+=dt;
    if(gearFrames){
      const t=movie.currentTime,i=Math.min(gearFrames.length-1,Math.floor(t*8));
      if(i!==mountIndex){
        mountIndex=i;mounts(gearFrames[i]);
        if(phase==='ending'){
          $('mounts').style.opacity=t>=117.7?String(Math.max(0,1-(t-117.7)/2.2)):t>=14.7&&t<16.4?String((t-14.7)/1.7):'1';
          const mem=$('memory');mem.hidden=!trainingStill||t<65.8||t>=67;
          if(!mem.hidden)mem.style.opacity=String(Math.min(1,(t-65.8)/.16,(67-t)/.18));
        }
      }
    }
    if(update)update(dt);
  }
  requestAnimationFrame(frame);
}

function open(){
  begin('opening',true);movie.poster=asset('start.webp');film(asset('opening.mp4'),incident,openingMounts);
}
const evidence=[
  ['路线','它没有看清前方道路','eye','白线进入了摄像头视野。沿白线看看，它在哪一刻开始转向？'],
  ['身体','它不知道身体正在倾斜','body','两肩已经倾斜，一只手伸向地面。它能读到自己的倾角吗？'],
  ['脚底','它没有及时感知脚底','foot','鞋尖落到了白线外侧。单凭这一帧，能分清脚滑与身体先歪的顺序吗？'],
];
function incident(){
  begin('incident');image(asset('impact.webp'),'同一镜头最后一帧，机器人伸手撑地');slate('弯道现场');
  info('第一关　/　拯救初代机器人','它明明看见了弯道，为什么还是摔倒了？','先听听全班的猜想，再选一处放大观察。');
  const buttons=[];
  for(const [title,label,path,note] of evidence){
    const b=btn(label,()=>{
      clue=title;const cut=$('cutin');cut.hidden=false;cut.querySelector('img').src=asset('../rescue/'+path+'.webp');
      cut.querySelector('b').textContent=title+'线索';cut.querySelector('p').textContent=note;
      buttons.forEach(item=>item.setAttribute('aria-pressed',String(item===b)));trace('evidence',{clue});
    });buttons.push(b);
  }
  main('进入维修舱',bench);
}
function selection(parent,refresh,lockCamera=true){
  const group=document.createElement('div');group.className='group';parent.append(group);
  for(const [key,label] of Object.entries(names)){
    const b=btn(label+(lockCamera&&key==='camera'?' · 已装':''),()=>{
      gear[key]=!gear[key];b.setAttribute('aria-pressed',String(gear[key]));locationSound.tone(480,gear[key]?730:310,.19,.043);refresh();
    },'',group);b.dataset.gear=key;b.setAttribute('aria-pressed',String(gear[key]));b.disabled=lockCamera&&key==='camera';
  }
}
function bench(){
  wipe();begin('bench');image(media('bay.webp'),'初代机身上的实际选装位置');
  info('第一关　/　维修舱','教练，我已经能够看见道路了。','是不是还需要其他能力？摄像头看路，雷达测距，IMU 测姿态，脚底力觉测接触。');
  let wire;
  function refresh(){mounts(art.mounts.map(p=>[p.name,p.x,p.y,p.width,p.angle]));if(wire)wire.hidden=!gear.imu;}
  selection($('choices'),refresh);
  wire=document.createElement('select');wire.setAttribute('aria-label','IMU 信号接法');
  for(const [value,text] of [['measure','IMU · 仅测量'],['control','IMU · 接入控制器']])wire.add(new Option(text,value));
  wire.value=monitor?'measure':'control';wire.onchange=()=>monitor=wire.value==='measure';$('choices').append(wire);
  main('用这套装备试跑',curve);refresh();
}
function curve(){
  wipe();begin('curve');const w=createCurveTrial({...gear},gear.imu&&monitor);
  let corrected=false,peak=null,slip=null,landing=null;
  live(w);slate('40 米急弯　 /　实时试跑');info('第一关　/　同场验证','看它怎样落脚、怎样扶正。');
  simulation(()=>{
    w.step();corrected ||= Math.abs(w.control.torque)>.01;
    if(w.lastLanding&&landing!==w.lastLanding){landing=w.lastLanding;locationSound.tone(115,54,.12,.065);}
    if(w.observation.imu)peak=Math.max(peak??0,Math.abs(w.observation.imu.tilt)*180/Math.PI);
    if(w.observation.contact)slip=Math.max(slip??0,w.observation.contact.slip);
  },()=>{
    renderer.draw(w);$('detail').textContent='距离 '+dec(w.result?.distance??w.progress)+' m　·　侧倾峰值 '+(peak===null?'未测量':dec(peak)+'°')+'　·　扶正指令 '+(corrected?'已发出':'尚无');
  },()=>w.result&&(w.result.success||w.state==='fallen'||w.done),()=>{
    courseResult={...w.result,gear:{...gear},monitor,peak,slip,corrected};journal.trials.push(courseResult);
    begin('curve-result');world=w;slate('本班实测');
    const r=courseResult;
    info('第一关　/　同一次试跑',r.success?'过线了。':'它停在 '+dec(r.distance)+' 米。',
      '实跑 '+dec(r.distance)+' / 40 米　·　'+(r.success?'扶正指令已接入。':(r.reason||'失衡')+'。')+(r.peak!==null?' 最大侧倾 '+dec(r.peak)+'°。':' 未测量侧倾。')+
      (r.gear.imu&&r.monitor?' IMU 已经读到倾角，控制器还没有收到。':''));
    if(r.success)main('沿着跑道向前看',hurdle);else main('调整装备再试',bench);
  });
}
function hurdle(){
  wipe();begin('hurdle',true);
  film(asset('bridge.mp4'),split,bridgeMounts);
}
async function panelArt(button,file,marks){
  const im=new Image();im.src=asset(file+'.webp');
  button.style.backgroundImage='url("'+im.src+'")';await im.decode();
  const c=document.createElement('canvas');c.width=im.width;c.height=im.height;
  const ctx=c.getContext('2d');ctx.drawImage(im,0,0);
  for(const [key,x,y,width,angle] of marks){
    if(!gear[key])continue;
    const part=art.gear[key],w=width*c.width,h=w*part.height/part.width;
    ctx.save();ctx.translate(x*c.width,y*c.height);ctx.rotate(angle);ctx.drawImage(part,-w/2,-h/2,w,h);ctx.restore();
  }
  if(button.isConnected)button.style.backgroundImage='url("'+c.toDataURL('image/webp',.91)+'")';
}
function split(){
  begin('split');surface('still');still.src=asset('hurdle-pov.webp');
  info('第二关　/　我是机器人总教练','怎样让它自己决定什么时候跳？','两种方法有什么不同？请总教练选一种先训练。');
  const s=$('split');s.hidden=false;s.replaceChildren();
  for(const [key,label,file] of [['imitate','跟着教练学','sample-coach'],['explore','自己试错学','sample-trial']]){
    const b=btn('',()=>startTraining(key),'',s);
    const marks=key==='imitate'?
      [['camera',.499,.309,.034,0],['imu',.466,.406,.040,.22],['lidar',.538,.225,.051,.16],
       ['force',.698,.541,.044,-1.08],['force',.245,.572,.042,-.56]]:[['force',.628,.890,.232,-.05]];
    panelArt(b,file,marks).catch(()=>{});
    const strong=document.createElement('strong');strong.textContent=label;b.append(strong);
  }
}
function startTraining(key){key==='imitate'?imitation():exploration();}
function afterTraining(key){
  completed.push(key);const other=key==='imitate'?'explore':'imitate';
  if(!completed.includes(other))main(other==='imitate'?'看教练怎样示范':'看它怎样自己试错',()=>startTraining(other));
  else main('听体育场广播',broadcast);
}
function imitation(){
  wipe();begin('demo');const samples=[];
  function leg(demo){
    const run=lessonTrack(false,{...gear});live(run.world);slate(demo?'示范　/　规则教练':'独立尝试　/　初代机');
    info('第二关　/　模仿学习',demo?'先看教练在什么情况下行动。':'轮到机器人对照刚才的示范。');
    const choose=o=>{
      if(!demo)return imitate(samples,o);
      const action=ruleAction(o);samples.push({type:o.obstacle?.type??null,distance:o.obstacle?.distance??0,speed:o.speed,support:o.support,action});return action;
    };
    simulation(()=>run.tick(choose),()=>{
      renderer.draw(run.world);
      if(!demo&&!trainingStill&&(run.world.jumpCount>0||run.finished))trainingStill=snapshot();
      $('detail').textContent='记录 '+samples.length+' 组观察与动作　·　'+ACTION_NAMES[run.action]+'　·　'+dec(run.world.progress)+' m';
    },()=>run.finished,()=>{
      if(demo){journal.training.demonstration=run.result();wipe();begin('imitation');leg(false);return;}
      journal.training.imitation={...run.result(),samples:samples.length};begin('imitation-result');world=run.world;
      info('第二关　/　模仿学习',run.result().success?'它按照观察完成了短道。':'这一次模仿停在了障碍前。',
        '教练留下 '+samples.length+' 组示范。机器人独立通过 '+run.result().passed+' 个障碍，跑了 '+dec(run.result().distance)+' 米。');
      afterTraining('imitate');
    });
  }
  leg(true);
}
function exploration(){
  wipe();begin('learning');trainer=new MotionTrainer(undefined,{...gear});
  let lastReward='尚在接近第一道障碍',checks=null,model=null;slate('试错训练　/　加速观察');
  info('第二关　/　强化学习','这一次，没有人告诉它什么时候跳。','每一次碰撞和每一次越障，都由同一套运动仿真结算。');
  update=()=>{
    if(!checks){
      for(let i=0;i<32&&trainer.learner.attempts<300;i++){
        trainer.advance();const r=trainer.episode.last;
        if(r.reward>=7)lastReward='成功越障　+8';else if(r.terminal&&!trainer.episode.result().success)lastReward='碰撞或失稳　−12';
      }
      const w=trainer.episode.world;if(track.hidden)live(w);else{world=w;renderer.draw(w);}
      $('detail').textContent='已试跑 '+trainer.learner.attempts+' / 300 轮　·　最近一次事件　'+lastReward;
      if(trainer.learner.attempts>=300){model=trainer.snapshot();checks=compareFrozen(model,undefined,{...gear});slate('冻结策略　/　相同的 20 条新赛道');}
      return;
    }
    let result;
    for(let i=0;i<45;i++){result=checks.next();if(result.done)break;}
    if(!result.done)return;
    comparison=result.value;journal.training.reinforcement={attempts:model.attempts,updates:model.updates,before:comparison.before.successes,after:comparison.after.successes,count:comparison.after.count,gear:{...gear}};
    const w=world;begin('learning-result');world=w;slate('未见赛道　/　冻结测试');
    info('第二关　/　训练结果','同样的 20 条新赛道，它有变化吗？','训练前完赛 '+comparison.before.successes+' / 20　·　训练后 '+comparison.after.successes+' / 20　·　实际更新 '+model.updates+' 次。');
    afterTraining('explore');
  };
}
function broadcast(){
  const w=world;begin('broadcast',true);world=w;
  dialogue(['camp','broadcast'],grid,key=>{if(key==='broadcast')slate('体育场广播　/　综合挑战赛即将开始');});
}
function grid(){
  wipe();begin('grid');image(media('bay.webp'),'同一套装备进入赛前检录');
  info('第三关　/　面对未知世界','六段赛道连在一起。它准备好了吗？','直道 → 障碍 → 弱光 → 急弯 → 凹凸 → 湿滑。沿用上一场的装备，也可以在检录时调整。');
  function refresh(){mounts(art.mounts.map(p=>[p.name,p.x,p.y,p.width,p.angle]));}
  selection($('choices'),refresh,false);refresh();
  const s=document.createElement('select');s.setAttribute('aria-label','决赛策略');
  s.add(new Option('本班训练的策略','learned'));s.add(new Option('规则参考策略','rule'));s.value=chosen;s.onchange=()=>chosen=s.value;$('choices').append(s);
  main('选手就位',countdown);
}
function countdown(){
  wipe();begin('countdown',true);
  race=new FinalRace({sensors:{...gear},strategy:raceStrategy(chosen,JSON.stringify(trainer.snapshot()))});live(race.world);
  $('count').hidden=false;$('count').textContent='3';
  let beat=-1;
  update=()=>{if(clock>=3){locationSound.tone(659,880,.35,.086);runRace();return;}const n=Math.floor(clock);if(beat!==n){beat=n;locationSound.tone(440,440,.14,.07);}$('count').textContent=String(3-n);};
}
function runRace(){
  begin('race');live(race.world);info('第三关　/　连续总决赛','机器人正在自己做决定。');
  simulation(()=>race.step(),()=>{
    const w=race.world;renderer.draw(w);slate(w.track.segmentAt(w.x).name);
    $('detail').textContent=dec(w.progress)+' / '+race.track.distance+' 米　·　'+ACTION_NAMES[race.clock.action]+'　·　已通过 '+w.passed+' 个障碍';
  },()=>race.ended,()=>{
    journal.race={...race.score,sensors:{...gear},strategy:chosen,frames:race.record.frames.length};
    raceResult();
  });
}
function raceResult(){
  begin('race-result');live(race.world);
  const r=race.score,title=r.outcome==='finished'?'它跑完了整场比赛。':'它停在了'+race.world.track.segmentAt(r.distance).name+'。';
  info('第三关　/　本场记录',title,dec(r.distance)+' / '+race.track.distance+' 米　·　'+dec(r.time)+' 秒　·　'+(r.reason||'完成六段赛程'));
  const lastEvent=race.record.events.filter(e=>['collision','obstacle-pass','segment'].includes(e.type)).at(-1);
  if(lastEvent)btn('看本场关键一帧',()=>{
    live(raceFrameView(race.record,lastEvent.tick));slate('本场记录　/　'+dec(lastEvent.time)+' 秒');
  });
  main('望向体育场外',trail);
}
function trail(){
  // A replay cursor never becomes the starting point for the next shot.
  live(race.world);wipe();begin('trail',true);image(media('trail.webp'),'红色赛道接入山间的木栈道');
  for(const [from,to,delay] of [[1390,2120,.12],[1650,2380,.37],[1970,1520,2.5]])locationSound.tone(from,to,.18,.032,delay);
  dialogue(['trail'],()=>openField({
    $,begin,info,main,btn,wipe,surface,mark,isPaused:()=>paused,
    onEnd:record=>{journal.field=record;endFilm();}
  }));
}
function endFilm(){
  wipe();begin('ending',true);movie.poster=asset('../vision/samples/jiuzhaigou.webp');
  if(trainingStill)$('memory').src=trainingStill;
  film(asset('ending.mp4'),()=>{
    begin('black',true);surface('movie');$('pause').disabled=true;$('sound').disabled=true;
    document.title='放映结束 · 奔跑的意义';
  },endingMounts);
}
soundLabel();open();requestAnimationFrame(frame);
