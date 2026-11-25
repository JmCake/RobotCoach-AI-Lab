import {INITIAL_SENSORS,load,save,storageNotice} from '../state.js';
import {sensors} from '../sensors.js';
import {CURVE_TRIAL,MEASURE_ONLY_TRIAL,createCurveTrial} from '../motion/curve-trial.js';
import {createMotionPlayback} from '../motion/playback.js';
import {STATE_NAMES} from '../motion/world.js';
import {loadArtwork,media,StoryTrack} from './track.js';

const $=id=>document.getElementById(id);
const still=$('still'),movie=$('movie'),canvas=$('trackCanvas'),mounts=$('mounts'),map=$('map');
const questions={range:'也许它没看准前方的距离。',lean:'也许它没察觉身体已经歪了。',foot:'也许问题出在脚底打滑。'};
const modules=['lidar','imu','force'];
const steps={intro:0,think:1,baseline:2,baselineReview:2,bay:2,trial:2,review:3,through:3,next:3};
const names=config=>Object.keys(sensors).filter(k=>config[k]).map(k=>k==='imu'?'IMU':sensors[k].name).join('、');
const fmt=value=>Number(value).toFixed(1);
const degrees=rad=>rad*180/Math.PI;
function freshConfig(saved){
  return Object.fromEntries(Object.keys(INITIAL_SENSORS).map(k=>[k,k==='camera'||saved?.[k]===true]));
}
const course=load(),saved=course.bendStory;
const s=saved?.version===1?{...saved}:{
  version:1,phase:'intro',guess:null,config:freshConfig(course.sensors),baseline:null,runs:[],photo:'',
};
s.config=freshConfig(s.config);
const complete=entry=>typeof entry?.result?.success==='boolean'&&Number.isFinite(entry.result.distance)&&entry.result.sensors;
s.runs=Array.isArray(s.runs)?s.runs.filter(complete).slice(-6):[];
if(!complete(s.baseline))s.baseline=null;
if(!Object.hasOwn(steps,s.phase))s.phase='intro';
if(!s.baseline&&steps[s.phase]>=2&&s.phase!=='baseline')s.phase='think';
if(s.phase==='review'&&!s.runs.length)s.phase='bay';
if(['through','next'].includes(s.phase)&&!s.runs.at(-1)?.result.success)s.phase=s.baseline?'bay':'think';

const renderer=new StoryTrack(canvas);
let art=null,run=null,clip=null,quiet=true;
const playback=createMotionPlayback({
  world:()=>run.world,
  step(world){
    world.step();
    if(run.locked)return;
    const o=world.observation;
    run.sawBend ||= Boolean(o.camera?.curve);
    run.sawObject ||= Boolean(o.lidar?.obstacle);
    if(o.imu)run.tilt=Math.max(run.tilt??0,Math.abs(degrees(o.imu.tilt)));
    if(o.contact)run.slip=Math.max(run.slip??0,o.contact.slip);
    run.correction ||= Math.abs(world.control.torque)>.01;
    if(world.result)run.locked=structuredClone(world.result);
  },
  draw(){
    if(!run)return;
    renderer.draw(run.world);
    liveReadout();
    if(run.locked&&(run.locked.success||run.world.state==='fallen'||run.world.done))finishRun();
  },
  settled(){if(run?.world.result)finishRun();},
});
loadArtwork().then(value=>{
  art=renderer.art=value;
  if(s.phase==='bay')drawMounts();
  if(run)renderer.draw(run.world);
}).catch(()=>{ /* The classroom renderer still runs the same experiment if an art file is unavailable. */ });

function remember(patch={}){
  storageNotice(save({...patch,bendStory:s}));
}
function button(text,onClick,cls='secondary'){
  const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=text;
  b.addEventListener('click',onClick);return b;
}
function action(text,fn){
  const b=button(text,fn,'primary');
  const arrow=document.createElement('span');arrow.ariaHidden='true';arrow.textContent='→';b.append(arrow);
  $('actions').append(b);return b;
}
function secondary(text,fn){$('actions').append(button(text,fn));}
function panel(label,title,brief){
  $('deskLabel').textContent=label;$('sceneTitle').textContent=title;$('brief').textContent=brief;
  $('controls').replaceChildren();$('actions').replaceChildren();
}
function imageScene(name,alt,tag,note){
  canvas.hidden=movie.hidden=mounts.hidden=true;still.hidden=false;
  still.src=name.startsWith('data:image/')?name:media(name+'.webp');
  still.alt=alt;$('sceneTag').textContent=tag;$('fieldNote').textContent=note;
}
function textLine(text){
  const p=document.createElement('p');p.className='clue';p.textContent=text;$('controls').append(p);
}
function measurements(rows){
  const dl=document.createElement('dl');dl.className='metrics';
  for(const [label,value,id] of rows){
    const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');
    dt.textContent=label;dd.textContent=value;if(id)dd.id=id;row.append(dt,dd);dl.append(row);
  }
  $('controls').append(dl);
}
function stopClip(){
  clip=null;movie.pause();movie.hidden=true;$('sound').hidden=true;
}
function go(phase){
  playback.pause();stopClip();run=null;s.phase=phase;remember();render();
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    $('deskLabel').parentElement.animate([{opacity:.3},{opacity:1}],{duration:180});
    $('screen').animate([{opacity:.72},{opacity:1}],{duration:165});
  }
  $('sceneTitle').focus({preventScroll:true});
}
function clipPanel(){
  if(!clip)return;
  const success=clip==='through';
  panel(success?'赛后 · 剧情回放':'总教练席 · 场边观察',success?'这次，它跑出了弯道。':'留意白线和那只脚。',
    success?'把实验里测到的纠偏，和镜头里的落脚对在一起。':'看它从哪里开始转向，又在哪里需要用手撑住。');
  action(movie.paused?'继续播放':'暂停镜头',()=>movie.paused?resumeMovie():movie.pause()).id='movieToggle';
  secondary(success?'看弯道后面':'停在撑地的一刻',()=>go(success?'next':'think'));
}
function resumeMovie(){
  if(document.hidden||map.open)return;
  movie.play().catch(syncMovieButton);
}
function syncMovieButton(){
  const label=$('movieToggle')?.firstChild;
  if(clip&&label)label.nodeValue=movie.paused?'继续播放':'暂停镜头';
}
function playClip(name){
  if(name==='through'&&!s.runs.at(-1)?.result.success)return;
  stopClip();clip=name;still.hidden=canvas.hidden=mounts.hidden=true;
  movie.hidden=false;movie.muted=quiet;
  $('sound').hidden=false;$('sound').textContent=quiet?'开启声音':'关闭声音';
  $('sound').setAttribute('aria-pressed',String(!quiet));
  movie.poster=media((name==='bend'?'grid':'hurdle')+'.webp');
  movie.src=media(name+'.mp4');
  $('sceneTag').textContent=name==='bend'?'场边镜头':'剧情反馈';
  $('fieldNote').textContent=name==='bend'?'摄像头视野与场边侧拍。镜头结束后留给你判断。':'用刚完成的试跑结果回到赛场。';
  clipPanel();$('movieToggle').focus({preventScroll:true});resumeMovie();
}
movie.addEventListener('play',syncMovieButton);movie.addEventListener('pause',syncMovieButton);
movie.addEventListener('ended',()=>{if(clip)go(clip==='bend'?'think':'next');});
movie.addEventListener('error',()=>{
  if(!clip)return;
  const next=clip==='bend'?'think':'next';go(next);
  $('fieldNote').textContent='影片未能载入，已切到同一幕的定格画面。';
});
$('sound').onclick=()=>{quiet=!quiet;movie.muted=quiet;$('sound').textContent=quiet?'开启声音':'关闭声音';$('sound').setAttribute('aria-pressed',String(!quiet));};

function openScene(){
  imageScene('grid','头侧摄像头的视野与正在奔跑的初代机。','场边镜头','入弯前，初代机只装了一枚摄像头。');
  panel('总教练席','盯住入弯的那一步。','你是它的总教练。先看白线往哪里拐，再看机器人的脚落在哪里。');
  action('播放现场镜头',()=>playClip('bend'));
  secondary('直接观察定格',()=>go('think'));
}
function think(){
  imageScene('catch','机器人已滑到白线外，一只手撑在碎石地上。','剧情暂停','它已经看见白线拐弯，最后却靠手撑住身体。');
  panel('总教练席 · 提出猜想','它为什么没站稳？','先选你最想查的一件事。把碎石拿掉，在干燥弯道上验证。');
  const field=document.createElement('fieldset');field.className='choices';field.ariaLabel='我想验证的猜想';
  for(const [key,words] of Object.entries(questions)){
    const b=button(words,()=>{s.guess=key;remember();think();fieldFocus(key);},'choice');
    b.dataset.guess=key;b.setAttribute('aria-pressed',String(s.guess===key));field.append(b);
  }
  $('controls').append(field);
  const own=document.createElement('details'),summary=document.createElement('summary'),input=document.createElement('input');
  own.className='own-guess';own.open=s.guess==='own';summary.textContent='我有别的猜想';
  input.type='text';input.maxLength=80;input.value=s.ownGuess??'';
  input.setAttribute('aria-label','写下自己的猜想');input.placeholder='我觉得它在……时失衡，因为……';
  own.append(summary,input);$('controls').append(own);
  const proceed=action(s.baseline?'带着猜想去维修舱':'让初代机实跑一次',()=>s.baseline?go('bay'):launch('baseline'));
  proceed.disabled=!Object.hasOwn(questions,s.guess)&&!(s.guess==='own'&&input.value.trim());
  input.oninput=()=>{
    s.ownGuess=input.value;s.guess='own';
    for(const option of field.children)option.setAttribute('aria-pressed','false');
    proceed.disabled=!input.value.trim();remember();
  };
  input.onfocus=()=>{if(s.guess!=='own'&&input.value.trim())input.oninput();};
  secondary('重看入弯镜头',()=>playClip('bend'));
}
function fieldFocus(key){$('controls').querySelector('[data-guess="'+key+'"]')?.focus({preventScroll:true});}
function drawMounts(){
  mounts.replaceChildren();
  for(const part of art?.mounts??[]){
    if(!s.config[part.name])continue;
    const item=document.createElement('img');item.src=media(part.name+'.webp');item.alt='';
    Object.assign(item.style,{left:part.x+'%',top:part.y+'%',width:part.width+'%',
      transform:'translate(-50%, -50%) rotate('+part.angle+'rad)'});
    mounts.append(item);
  }
}
function bay(){
  imageScene('bay','同一台初代机站在维修舱中，选择的硬件会装到对应部位。','维修舱','保留头侧摄像头。选中的部件会装到这台机器人身上。');
  mounts.hidden=false;drawMounts();
  panel('总教练席 · 调整配置','你想再测哪种信号？','两次都跑同一条干燥急弯。每次只改一件，更容易解释差别。');
  const field=document.createElement('fieldset');field.className='gears';field.ariaLabel='加装或卸下传感器';
  for(const [key,place] of [['lidar','头顶'],['imu','胸口'],['force','双脚']]){
    const b=button('',()=>{
      s.config[key]=!s.config[key];remember();bay();$('controls').querySelector('[data-module="'+key+'"]').focus({preventScroll:true});
    },'gear');
    b.dataset.module=key;b.setAttribute('aria-pressed',String(s.config[key]));
    const icon=new Image();icon.src=media(key+'.webp');icon.alt='';
    const block=document.createElement('span'),name=document.createElement('strong'),detail=document.createElement('small'),symbol=document.createElement('b');
    name.textContent=sensors[key].name+(key==='imu'?' IMU':'');detail.textContent=place+' · '+sensors[key].desc;
    block.append(name,detail);symbol.textContent=s.config[key]?'✓':'＋';symbol.ariaHidden='true';
    b.append(icon,block,symbol);field.append(b);
  }
  $('controls').append(field);
  if(s.config.imu){
    const wire=document.createElement('fieldset');wire.className='wiring';wire.ariaLabel='姿态传感器的信号去向';
    const label=document.createElement('legend');label.textContent='姿态信号送到哪里？';wire.append(label);
    for(const [word,monitor] of [['仅测量',true],['接入控制器',false]]){
      const b=button(word,()=>{
        s.measureOnly=monitor;remember();bay();$('controls').querySelector('[data-wire="'+monitor+'"]').focus({preventScroll:true});
      },'wire');
      b.dataset.wire=monitor;b.setAttribute('aria-pressed',String(Boolean(s.measureOnly)===monitor));wire.append(b);
    }
    $('controls').append(wire);
  }
  action('用这套配置重跑',()=>launch('trial'));
  secondary('回看我的猜想',()=>go('think'));
}

function prepareRun(){
  const base=s.phase==='baseline',config=base?INITIAL_SENSORS:s.config;
  const monitor=!base&&config.imu&&s.measureOnly===true;
  const world=createCurveTrial(config,monitor);
  run={base,world,monitor,locked:null,tilt:null,slip:null,sawBend:false,sawObject:false,correction:false,revision:null};
  renderer.referenceDistance=base?null:s.baseline?.result.distance;
  still.hidden=movie.hidden=mounts.hidden=true;canvas.hidden=false;
  $('sceneTag').textContent='实时仿真 · '+(base?'初代机':'我的配置');
  $('fieldNote').textContent='干燥急弯 · 40 米 · 相同起点与目标速度 '+CURVE_TRIAL.target+' 米/秒';
  renderer.resize();renderer.draw(world);
  panel('总教练席 · 同场试跑',base?'先跑出对照成绩。':'把改装交给赛道。',names(config)+'。留意进入弯道时，控制器能收到哪些读数。');
  const rows=[['试跑距离','0.0 / 40 米','liveDistance'],['摄像头','前方直道','liveCamera']];
  if(config.lidar)rows.push(['激光雷达','—','liveRange']);
  if(config.force)rows.push(['足底力觉','—','liveFoot']);
  rows.push(['机身侧倾','未接入','liveTilt'],[config.imu?'扶正指令':'场边状态','—','liveControl']);
  measurements(rows);
  const meter=document.createElement('div');meter.className='meter';meter.ariaHidden='true';
  const fill=document.createElement('b');fill.id='fill';meter.append(fill);$('controls').append(meter);
  action('开始试跑',toggleRun).id='runButton';
  liveReadout();
}
function launch(phase){go(phase);toggleRun();}
function toggleRun(){
  if(!run)return;
  if(playback.running){playback.pause();liveReadout();return;}
  if(map.open||document.hidden)return;
  if(!run.base&&run.revision===null){
    storageNotice(save({sensors:{...run.world.sensors}}));
    run.revision=load().sensorRevision??0;
  }
  playback.start();liveReadout();
}
function set(id,text){const el=$(id);if(el&&el.textContent!==text)el.textContent=text;}
function liveReadout(){
  if(!run)return;
  const w=run.world,o=w.observation,d=w.result?.distance??Math.min(w.progress,CURVE_TRIAL.distance);
  set('liveDistance',fmt(d)+' / 40 米');set('liveCamera',o.camera?.curve?'前方弯道':'前方直道');
  set('liveTilt',o.imu?fmt(degrees(o.imu.tilt))+'°':'未接入');
  if(o.lidar)set('liveRange',o.lidar.obstacle?fmt(o.lidar.obstacle.distance)+' 米':fmt(o.lidar.range)+' 米内无障碍');
  if(o.contact)set('liveFoot',['离地','单脚支撑','双脚支撑'][o.contact.feet.filter(Boolean).length]+(o.contact.slip>.01?' · 滑移':' · 未滑移'));
  set('liveControl',o.imu?(run.monitor?'仅记录 · 无扶正指令':Math.abs(w.control.torque)>.01?'正在施加扶正力矩':'等待纠偏'):STATE_NAMES[w.state]);
  $('fill').style.width=d/CURVE_TRIAL.distance*100+'%';
  const label=playback.running?'暂停试跑':w.time?'继续试跑':'开始试跑';
  const node=$('runButton')?.firstChild;if(node&&node.nodeValue!==label)node.nodeValue=label;
}
function snapshot(){
  const copy=document.createElement('canvas');copy.width=760;copy.height=Math.round(760*canvas.height/canvas.width);
  copy.getContext('2d').drawImage(canvas,0,0,copy.width,copy.height);
  return copy.toDataURL('image/webp',.79);
}
function finishRun(){
  if(!run?.locked)return;
  playback.pause();
  const {base,world,tilt,slip,sawBend,sawObject,correction,revision,monitor}=run;
  const result=structuredClone(world.result);
  const guessText=s.guess==='own'?s.ownGuess?.trim():questions[s.guess];
  const entry={result,tilt,slip,sawBend,sawObject,correction,monitor,guess:s.guess,guessText};
  const record={conditions:monitor?MEASURE_ONLY_TRIAL:CURVE_TRIAL,result};
  s.photo=snapshot();
  if(base){
    s.baseline=entry;storageNotice(save({chapter1BaselineRun:record}));
  }else{
    s.runs=[...s.runs,entry].slice(-6);
    storageNotice(save({chapter1StudentRun:{...record,sensorRevision:revision}}));
  }
  go(base?'baselineReview':'review');
}
function review(base){
  const entry=base?s.baseline:s.runs.at(-1),r=entry.result;
  imageScene(s.photo||'catch','本轮急弯试跑结束时的画面。','本轮实测 · 定格',
    names(r.sensors)+' · '+(r.success?'已过终点':r.reason??'本轮未通过'));
  const guess=entry.guessText||questions[entry.guess];
  panel(base?'总教练席 · 初代机对照':'总教练席 · 赛后复盘',
    base?'初代机跑出了对照成绩。':r.success?'过弯了。什么起了作用？':'这一轮，弯道还没过。',
    base?'把碎石拿掉，再看摄像头的记录和停止的位置。哪种读数值得带回维修舱查？':
    r.success?'教练，这次我跑过了终点。对照上一轮，你改的哪一处可能起了作用？':
    '教练，我还没能通过。看看这次测到了什么，再决定改哪一项。');
  const rows=[['初代机',fmt(s.baseline.result.distance)+' / 40 米']];
  if(!base)rows.push(['我的配置',fmt(r.distance)+' / 40 米']);
  rows.push(['摄像头',entry.sawBend?'曾检测到弯道':'未检测到弯道'],['实测最大侧倾',entry.tilt===null?'未安装姿态传感器':fmt(entry.tilt)+'°']);
  if(r.sensors.lidar)rows.push(['雷达障碍回波',entry.sawObject?'曾检测到障碍物':'本轮未检测到']);
  if(Number.isFinite(entry.slip))rows.push(['足部滑移峰值',entry.slip.toFixed(2)+' 米/秒']);
  measurements(rows);
  if(guess)textLine('你的猜想　'+guess);
  if(!base){
    if(entry.monitor)textLine('倾角记下来了，控制器没有收到这条信号。保留同一套硬件，换个接法再试。');
    else if(r.success&&modules.filter(k=>r.sensors[k]).length>1)textLine('同时改了多个部件。卸下一件再跑，可以查它是否必要。');
    else if(entry.correction)textLine('控制器在这一轮收到侧倾读数，并发出了扶正力矩。');
    else if(entry.guess==='foot'&&entry.slip===0)textLine('脚底记录到换脚，滑移读数一直是零。这个干燥弯道上的失衡还可以怎样解释？');
    else if(r.sensors.lidar&&!entry.sawObject)textLine('看得更远，停止位置变了吗？再看看哪些信号能描述机器人自身。');
  }
  if(base||!r.success)action(base?'进入维修舱':'调整配置再试',()=>go('bay'));
  else{action('回到赛场看过弯',()=>{go('through');playClip('through');});secondary('只改一件再比较',()=>go('bay'));}
}
function nextScene(){
  imageScene('hurdle','机器人跑出弯道，前方出现一架矮栏。','下一幕 · 栏前','弯道已经通过，赛道上出现了第一个障碍。');
  panel('第一关完成 · 下一个问题','站稳了，什么时候跳？','摄像头看到了栏，脚也踩稳了。教练，你会让它现在起跳，还是再跑一步？');
  action('查看后续课程地图',openMap);secondary('回维修舱再试',()=>go('bay'));
}
function render(){
  document.body.dataset.phase=s.phase;
  [...document.querySelectorAll('.steps li')].forEach((li,i)=>{
    if(i===steps[s.phase])li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');
  });
  switch(s.phase){
    case 'intro':openScene();break;
    case 'think':think();break;
    case 'bay':bay();break;
    case 'baseline':case 'trial':prepareRun();break;
    case 'baselineReview':review(true);break;
    case 'review':review(false);break;
    case 'through':
      imageScene(s.photo||'grid','完成急弯时的试跑画面。','已通过','你可以继续观看通过后的剧情。');
      panel('总教练席 · 剧情反馈','回到刚才那条弯道。','把刚才的试跑结果带回现场。');
      action('播放过弯镜头',()=>playClip('through'));secondary('看下一道障碍',()=>go('next'));break;
    case 'next':nextScene();break;
  }
  $('notes').hidden=!s.baseline;
  if(s.baseline){
    const ol=document.createElement('ol');
    for(const e of [s.baseline,...s.runs]){
      const li=document.createElement('li'),r=e.result;
      const wiring=r.sensors.imu?(e.monitor?'（仅测量）':'（接入控制）'):'';
      li.textContent=(e===s.baseline?'初代机':'改装试跑')+' · '+names(r.sensors)+wiring+' · '+fmt(r.distance)+' 米 · '+(r.success?'通过':r.reason??'未通过');
      const words=e.guessText||questions[e.guess];
      if(words){const note=document.createElement('small');note.textContent='当时的猜想　'+words;li.append(note);}
      ol.append(li);
    }
    $('notebook').replaceChildren(ol);
  }
}
function pauseMedia(){
  movie.pause();
  if(run?.locked){finishRun();return;}
  playback.pause();liveReadout();
}
function openMap(){pauseMedia();map.showModal();}
$('mapButton').onclick=openMap;$('closeMap').onclick=$('returnStory').onclick=()=>map.close();
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseMedia();});
window.addEventListener('pagehide',pauseMedia);
new ResizeObserver(()=>{if(run&&canvas.clientWidth){renderer.resize();renderer.draw(run.world);}}).observe(canvas);
render();
