import {createCurveTrial,CURVE_TRIAL} from '../motion/curve-trial.js';
import {createMotionPlayback} from '../motion/playback.js';
import {loadArtwork,media,StoryTrack} from '../story/track.js';
import {sensors} from '../sensors.js';

const $=id=>document.getElementById(id);
const video=$('film'), canvas=$('simulation'), still=$('still');
const local=name=>new URL(name,import.meta.url).href;
const opening=local('opening-v6.mp4'), stopTime=14.28, impactTime=17.55;
const equipment=['lidar','imu','force'];
const choices=['能稳住','可能会摔','现在还说不准'];
const clues={
  eye:{label:'眼睛',image:'eye',alt:'头侧摄像头视野里，跑道白线向远方转弯',note:'沿白线指一遍。镜头里有路线，有没有机器人自己的肩膀？',hyp:'我想查它是不是看清了前面的路。'},
  body:{label:'身体',image:'body',alt:'右手伸向地面，两肩已经不再水平',note:'把手指放在两肩之间。上身歪过去时，哪只手先伸了出来？',hyp:'我想查身体歪过去时，它有没有及时扶正。'},
  foot:{label:'脚底',image:'foot',alt:'鞋尖越过白边，碰到外侧碎石',note:'鞋尖落在白线哪一侧？仅凭这一帧，能分清脚滑和身体先歪的顺序吗？',hyp:'我想查换到干地以后，脚下还会不会滑。'}
};
const fixed=()=>({camera:true,lidar:false,imu:false,force:false});
const phases={intro:1,opening:1,prediction:1,incident:2,question:2,evidence:3,bench:4,running:4,result:4,victory:5,hurdle:5};
const key='robotcoach:rescue-pilot:v1';
function fresh(){return {phase:'intro',vote:'',clue:'',hypothesis:'',config:fixed(),monitor:true,history:[],completed:false,heard:false};}
function restore(){
  let data;try{data=JSON.parse(sessionStorage.getItem(key));}catch{}
  if(!data||!Object.hasOwn(phases,data.phase)||!Array.isArray(data.history))return fresh();
  const next={...fresh(),...data,config:{...fixed(),...data.config,camera:true}};
  if(next.phase==='opening')next.phase='intro';
  if(next.phase==='incident')next.phase='prediction';
  if(next.phase==='running')next.phase='bench';
  if(next.phase==='victory')next.phase='result';
  if(next.phase==='result'&&!next.history.length)next.phase='bench';
  return next;
}
let state=restore(), active=null, frameCallback=0, fallbackTimer=0, projector=null, baseline=null;
let imageData=null, artWarning='';
const renderer=new StoryTrack(canvas);
loadArtwork().then(a=>{renderer.art=a;imageData=a;if(state.phase==='bench')mountHardware();if(active&&canvas.clientWidth)renderer.draw(active.world);}).catch(()=>{
  artWarning='角色画层未载入，试跑使用基础绘制。';$('notice').textContent=artWarning;
});
function save(){try{sessionStorage.setItem(key,JSON.stringify(state));}catch{$('notice').textContent='浏览器未保存进度；本次课堂仍可继续。';}}
function el(tag,text,cls){const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;}
function btn(parent,text,fn,cls='regular'){
  const b=el('button',text,cls);b.type='button';b.onclick=fn;parent.append(b);return b;
}
function main(text,fn){return btn($('actions'),text,fn,'primary');}
function minor(text,fn){return btn($('actions'),text,fn);}
function panel(kicker,title,description,caption,tag){
  $('kicker').textContent=kicker;$('heading').textContent=title;$('narration').textContent=description;
  $('caption').textContent=caption;$('tag').textContent=tag;$('tag').hidden=!tag;
}
function image(src,alt){still.src=src;still.alt=alt;}
function screen(mode){
  $('filmframe').hidden=mode==='clues';$('triptych').hidden=mode!=='clues';
  still.hidden=mode!=='image';video.hidden=mode!=='film';canvas.hidden=mode!=='run';
}
function cancelCues(){
  if(frameCallback&&video.cancelVideoFrameCallback)video.cancelVideoFrameCallback(frameCallback);
  frameCallback=0;clearInterval(fallbackTimer);fallbackTimer=0;
}
function leave(){cancelCues();projector=null;video.pause();playback.pause();active=null;}
function go(phase){
  leave();state.phase=phase;save();render();
  if(phase!=='intro')$('heading').focus({preventScroll:true});
}
function nameOf(config,monitor){
  return ['摄像头',...equipment.filter(k=>config[k]).map(k=>k==='imu'?'IMU（'+(monitor?'仅测量':'接入控制')+'）':sensors[k].name)].join('＋');
}
function addStats(parent,rows){
  const list=el('dl','','stats');for(const [label,value] of rows){
    const row=el('div','');row.append(el('dt',label),el('dd',value));list.append(row);
  }parent.append(list);
}
function clipOptions(){
  const b=$('toggleClip');if(b)b.textContent=video.paused?'▶　继续镜头':'Ⅱ　暂停镜头';
}
function play(){
  if(document.hidden||$('notes').open)return;
  video.play().catch(()=>{if(projector){$('notice').textContent='影片已暂停，可点击继续镜头。';clipOptions();}});
}
function finishClip(){
  if(!projector)return;
  const phase=state.phase;
  if(phase==='opening')go('prediction');
  else if(phase==='incident')go('question');
  else if(phase==='victory')go('hurdle');
}
function cue(time){
  if(!projector||projector.end===null)return;
  if(time>=projector.end){finishClip();return;}
}
function watchCue(){
  cancelCues();
  if(typeof video.requestVideoFrameCallback==='function'){
    const check=(_,meta)=>{frameCallback=0;cue(meta.mediaTime);if(projector)frameCallback=video.requestVideoFrameCallback(check);};
    frameCallback=video.requestVideoFrameCallback(check);
  }else fallbackTimer=setInterval(()=>cue(video.currentTime),45);
}
function startFilm(source,start,end){
  screen('film');projector={end};const marker=projector;
  function ready(){if(projector!==marker)return;video.currentTime=start;watchCue();play();}
  video.muted=!state.heard;
  if(video.src===source&&video.readyState>=1)ready();
  else{video.addEventListener('loadedmetadata',ready,{once:true});video.src=source;video.load();}
  main('Ⅱ　暂停镜头',()=>video.paused?play():video.pause()).id='toggleClip';
}
video.addEventListener('play',clipOptions);video.addEventListener('pause',clipOptions);
video.addEventListener('ended',finishClip);
video.addEventListener('error',()=>{
  if(!projector)return;
  const phase=state.phase;leave();$('notice').textContent='影片未能载入。可重新加载，或由教师切至该幕定格。';
  $('actions').replaceChildren();main('重新加载镜头',()=>{video.removeAttribute('src');go(phase);});
  minor('查看本幕定格',()=>go(({opening:'prediction',incident:'question',victory:'hurdle'})[phase]));
});
function prediction(){
  image(local('prediction.webp'),'临近失衡时的脚步定格，鞋子靠近跑道白线');
  panel('01　/　全班预测','下一步，能稳住吗？','看看支撑脚离白线还有多远。先投票，请一位同学说说理由。','V6 原片 · 00:14.28 自动定格','现场定格');
  const row=el('div','','choice-row');$('inputs').append(row);
  const next=main('揭晓现场　→',()=>go('incident'));
  for(const choice of choices){
    const b=btn(row,choice,()=>{state.vote=choice;save();for(const item of row.children)item.setAttribute('aria-pressed',String(item===b));next.disabled=false;},'chip');
    b.setAttribute('aria-pressed',String(choice===state.vote));
  }
  next.disabled=!state.vote;minor('重看入场',()=>go('opening'));
}
function evidence(){
  screen('clues');
  panel('03　/　现场勘查','你要追哪条线索？','翻看三个镜头，挑一处最值得验证的细节。','同一次入弯 · 摄像头、机身、落脚三个视角','');
  const strip=$('triptych');strip.replaceChildren();
  const note=el('div','','observation');note.hidden=!clues[state.clue];$('inputs').append(note);
  const label=el('label','我的猜想','note'),input=document.createElement('textarea');input.rows=2;input.maxLength=120;
  input.value=state.hypothesis;input.placeholder='可以自己写，也可以选择一条画面线索。';label.append(input);$('inputs').append(label);
  const next=main('带着猜想去改装　→',()=>go('bench'));
  input.oninput=()=>{state.hypothesis=input.value;next.disabled=!input.value.trim();save();};
  for(const [id,c] of Object.entries(clues)){
    const b=btn(strip,'',()=>{
      const former=clues[state.clue];state.clue=id;
      if(!input.value.trim()||input.value===former?.hyp)input.value=c.hyp;
      state.hypothesis=input.value;note.textContent=c.note;note.hidden=false;next.disabled=!input.value.trim();
      for(const item of strip.children)item.setAttribute('aria-pressed',String(item===b));save();
    },'clue');
    b.setAttribute('aria-pressed',String(state.clue===id));const pic=new Image();pic.src=local(c.image+'.webp');pic.alt=c.alt;
    b.append(pic,el('strong',c.label+'　＋'));b.setAttribute('aria-label','观察'+c.label);
  }
  if(clues[state.clue])note.textContent=clues[state.clue].note;next.disabled=!input.value.trim();
}
function trial(config,monitor){
  return {world:createCurveTrial(config,Boolean(config.imu&&monitor)),config:{...config},monitor:Boolean(config.imu&&monitor),tilt:null,slip:null,bend:false,obstacle:false,corrected:false};
}
function advance(t){
  t.world.step();
  const o=t.world.observation;
  t.bend ||= Boolean(o.camera?.curve);t.obstacle ||= Boolean(o.lidar?.obstacle);
  if(o.imu)t.tilt=Math.max(t.tilt??0,Math.abs(o.imu.tilt)*180/Math.PI);
  if(o.contact)t.slip=Math.max(t.slip??0,o.contact.slip);
  t.corrected ||= Math.abs(t.world.control.torque)>.01;
}
function summarize(t){
  const r=t.world.result;
  return {config:t.config,monitor:t.monitor,success:r.success,reason:r.reason,distance:r.distance,tilt:t.tilt,slip:t.slip,bend:t.bend,obstacle:t.obstacle,corrected:t.corrected};
}
function original(){
  if(!baseline){const t=trial(fixed(),false);while(!t.world.result)advance(t);baseline=summarize(t);}
  return baseline;
}
const decimal=n=>Number(n).toFixed(1);
function mountHardware(){
  const holder=$('mounts');holder.replaceChildren();
  for(const part of imageData?.mounts??[]){
    if(!state.config[part.name])continue;
    const icon=new Image();icon.alt='';icon.src=media(part.name+'.webp');
    Object.assign(icon.style,{left:part.x+'%',top:part.y+'%',width:part.width+'%',transform:'translate(-50%, -50%) rotate('+part.angle+'rad)'});holder.append(icon);
  }
}
function bench(){
  image(media('bay.webp'),'维修舱中的初代机，选中的装备安装到头部、胸口或脚底');
  panel('04　/　改装验证','用什么读数查证？','你的猜想　'+state.hypothesis,'同条件对照 · 干地急弯 40 米 · 目标 6.4 米/秒','维修舱');
  const inputs=$('inputs');inputs.append(el('div','初代机同场基线　'+decimal(original().distance)+' / 40 米　·　仅摄像头','observation'));
  const kit=el('div','','kit');inputs.append(kit);
  const description=el('div','','hint');inputs.append(description);
  const wires=el('div','','wires');inputs.append(wires);wires.append(el('small','IMU 信号'));
  function refresh(){
    mountHardware();wires.hidden=!state.config.imu;
    for(const item of kit.children)item.setAttribute('aria-pressed',String(state.config[item.dataset.id]));
    for(const item of wires.querySelectorAll('button'))item.setAttribute('aria-pressed',String(state.monitor===(item.dataset.monitor==='true')));
    description.textContent=equipment.filter(k=>state.config[k]).map(k=>sensors[k].desc).join(' ')||'摄像头已安装。可加装部件，也可以保留原配置实跑。';
    save();
  }
  for(const id of equipment){const b=btn(kit,'',()=>{state.config[id]=!state.config[id];refresh();});b.dataset.id=id;
    const pic=new Image();pic.src=media(id+'.webp');pic.alt='';b.append(pic,document.createTextNode(id==='imu'?'姿态 IMU':id==='force'?'足底力觉':'激光雷达'));}
  for(const [value,title] of [[true,'仅测量'],[false,'接入控制器']]){
    const b=btn(wires,title,()=>{state.monitor=value;refresh();},'regular wire');b.dataset.monitor=String(value);
  }
  main('用这套装备试跑　→',()=>go('running'));minor('回看线索',()=>go('evidence'));refresh();
}
const playback=createMotionPlayback({
  world:()=>active.world,
  step:()=>{
    if(active.world.result)active.world.step();
    else advance(active);
  },
  draw:()=>{
    if(!active)return;
    const t=active;renderer.draw(t.world);
    if(t.world.result&&(t.world.result.success||t.world.state==='fallen'||t.world.done)){
      const r=summarize(t);state.history.push(r);state.completed ||= r.success;
      const shot=document.createElement('canvas');shot.width=720;shot.height=Math.max(1,Math.round(720*canvas.height/canvas.width));
      shot.getContext('2d').drawImage(canvas,0,0,shot.width,shot.height);state.photo=shot.toDataURL('image/webp',.76);
      go('result');return;
    }
    $('meters').textContent=decimal(t.world.result?.distance??t.world.progress)+' m';
    $('tilt').textContent=t.world.observation.imu?decimal(t.world.observation.imu.tilt*180/Math.PI)+'°':'未测量';
    $('correct').textContent=t.corrected?'已出现':'尚无';$('camera').textContent=t.bend?'已见弯道':'前方直道';
    if(t.config.force&&t.world.observation.contact)$('liveFoot').textContent=t.world.observation.contact.slip.toFixed(2)+' m/s';
    if(t.config.lidar&&t.world.observation.lidar){const echo=t.world.observation.lidar.obstacle;$('liveRadar').textContent=echo?decimal(echo.distance)+' m':'无障碍回波';}
  },settled(){}
});
function run(){
  screen('run');active=trial(state.config,state.monitor);renderer.referenceDistance=original().distance;
  renderer.resize();renderer.draw(active.world);
  panel('04　/　同场试跑','留意入弯那一刻。',nameOf(state.config,state.monitor),'运动仿真 · 本轮位置、侧倾和扶正指令实时读取','实时仿真');
  const readings=[['meters','已跑距离','0.0 m'],['tilt','机身侧倾','—'],['correct','扶正指令','尚无'],['camera','摄像头','前方直道']];
  if(state.config.force)readings.push(['liveFoot','脚底滑移','—']);
  if(state.config.lidar)readings.push(['liveRadar','前方测距','—']);
  addStats($('inputs'),readings.map(([,label,value])=>[label,value]));
  [...$('inputs').querySelectorAll('dd')].forEach((v,i)=>v.id=readings[i][0]);
  main('Ⅱ　暂停试跑',()=>{
    if(playback.running)playback.pause();else playback.start();
    $('runToggle').textContent=playback.running?'Ⅱ　暂停试跑':'▶　继续试跑';
  }).id='runToggle';playback.start();
}
function result(){
  const r=state.history.at(-1);
  image(state.photo||media('bay.webp'),'本轮真实仿真定格');
  panel('04　/　本轮记录',r.success?'它过线了。':'它停在了 '+decimal(r.distance)+' 米。',nameOf(r.config,r.monitor),'同弯对照 · 初代机 '+decimal(original().distance)+' 米 / 本轮 '+decimal(r.distance)+' 米','实测定格');
  const rows=[['本轮距离',decimal(r.distance)+' / 40 m'],['最大侧倾',r.tilt===null?'未测量':decimal(r.tilt)+'°'],['扶正指令',r.corrected?'已出现':'无'],['摄像头',r.bend?'已见弯道':'未见弯道']];
  if(r.config.lidar)rows.push(['雷达回波',r.obstacle?'检测到障碍':'未检测到障碍']);
  if(r.slip!==null)rows.push(['滑移峰值',r.slip.toFixed(2)+' m/s']);addStats($('inputs'),rows);
  const text=!r.success?(r.reason||'未完成急弯')+'。'+(r.monitor?'倾角记下来了。保留这套硬件，只换接法再试。':'对照停点和新增的读数，选一项调整后再跑。'):
    equipment.filter(k=>r.config[k]).length>1?'这套组合完成了急弯。只改一件再跑，可以区分各部件的作用。':'控制器收到姿态读数后发出了扶正指令。可以换回仅测量做反向对照。';
  $('inputs').append(el('div',text,'trialnote'));
  if(r.success){main('播放成功过弯　→',()=>go('victory'));minor('只改一项再试',()=>go('bench'));}
  else{main('调整装备再试　→',()=>go('bench'));if(state.completed)minor('从已完赛记录继续',()=>go('victory'));}
}
function render(){
  const p=state.phase;document.body.dataset.state=p;
  for(const [i,li] of [...document.querySelectorAll('.route li')].entries()){if(i+1===phases[p])li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');}
  $('cover').hidden=p!=='intro';$('brief').hidden=p==='intro';$('inputs').replaceChildren();$('actions').replaceChildren();$('mounts').replaceChildren();$('tag').hidden=true;$('notice').textContent=artWarning;
  screen('image');
  if(p==='intro'){image(media('grid.webp'),'赛道主观视角和冲向弯道的初代机');$('caption').textContent='V6 原片 · 入弯现场';return;}
  if(p==='opening'){panel('01　/　比赛开始','跟着初代机入场。','先看它看见了什么，再看它的脚落在哪里。','V6 原片 · 比赛开始','');startFilm(opening,0,stopTime);return;}
  if(p==='prediction'){prediction();return;}
  if(p==='incident'){panel('02　/　意外发生','看清失衡的那一步。','本班预测　'+state.vote,'V6 原片 · 从刚才的定格继续','');startFilm(opening,stopTime,impactTime);return;}
  if(p==='question'){
    image(media('catch.webp'),'初代机一手撑地，脚已偏出弯道');
    panel('02　/　意外发生','它明明看见了弯道，为什么还是摔倒了？','请一位同学指出失衡最先出现在哪里，再听一个不同的解释。','V6 现场 · 手掌撑地，留给全班讨论','事故定格');
    main('翻开现场线索　→',()=>go('evidence'));minor('重看失衡',()=>go('incident'));return;
  }
  if(p==='evidence'){evidence();return;}if(p==='bench'){bench();return;}if(p==='running'){run();return;}if(p==='result'){result();return;}
  if(p==='victory'&&state.completed){
    panel('05　/　升级成功','这一次，稳住了。','对照刚才的实测读数，看看它怎样沿着白线跑出弯道。','V6 成功过弯镜头 · 已由本班实际完赛解锁','');startFilm(media('through.mp4'),0,null);return;
  }
  if(p==='hurdle'&&state.completed){
    image(media('hurdle.webp'),'出弯后，机器人前方出现第一架矮栏');
    panel('05　/　升级成功','前面有栏。现在跳，还是再跑一步？','初代机回过头，等你的口令。把这个问题留到下一关。','第一关结束 · 下一关《我是机器人总教练》','栏前定格');
    main('查看本班调查记录',openJournal);minor('重看过弯',()=>go('victory'));return;
  }
  go('bench');
}
function pausePresentation(){
  if(!video.paused)video.pause();
  if(playback.running){playback.pause();if($('runToggle'))$('runToggle').textContent='▶　继续试跑';}
}
function openJournal(){
  pausePresentation();const box=$('entries');box.replaceChildren();box.append(el('p','预测　'+(state.vote||'尚未投票')),el('p','猜想　'+(state.hypothesis||'尚未记录')));
  if(state.history.length){
    box.append(el('p','同场初代机　'+decimal(original().distance)+' / 40 米'));const ol=el('ol','');
    for(const r of state.history)ol.append(el('li',nameOf(r.config,r.monitor)+' · '+decimal(r.distance)+' 米 · '+(r.success?'完赛':'未完赛')+' · 最大侧倾 '+(r.tilt===null?'未测量':decimal(r.tilt)+'°')+' · 扶正指令'+(r.corrected?'已出现':'无')));
    box.append(ol);
  }
  $('confirmRestart').hidden=true;$('notes').showModal();
}
$('start').onclick=()=>go('opening');$('journal').onclick=openJournal;$('close').onclick=()=>$('notes').close();
$('restart').onclick=()=>$('confirmRestart').hidden=false;$('noReset').onclick=()=>$('confirmRestart').hidden=true;
$('yesReset').onclick=()=>{$('notes').close();state=fresh();soundLabel();go('intro');};
function soundLabel(){$('sound').textContent=state.heard?'声音开':'声音关';$('sound').setAttribute('aria-pressed',String(state.heard));video.muted=!state.heard;}
$('sound').onclick=()=>{state.heard=!state.heard;soundLabel();save();};
$('full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('notice').textContent='当前窗口不支持全屏，可在浏览器中按 F11。';}};
document.addEventListener('fullscreenchange',()=>{$('full').textContent=document.fullscreenElement?'退出全屏':'全屏';});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pausePresentation();});window.addEventListener('pagehide',pausePresentation);
new ResizeObserver(()=>{if(active&&canvas.clientWidth){renderer.resize();renderer.draw(active.world);}}).observe(canvas);
soundLabel();render();
