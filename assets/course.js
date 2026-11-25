import {load,save,storageNotice} from './state.js';
const pages=[
 ['diagnosis','初代机上场前，先试一个急弯','决赛有六段赛道。只装摄像头，能跑完这 40 米急弯吗？','humanoid-trial.html?mode=baseline'],
 ['workshop','刚才弯里没站稳，加哪个感官？','','selection.html'],
 ['trial','回到刚才的弯道，能多跑几米？','','humanoid-trial.html'],
 ['imitation','弯道之后是跨栏，先跟教练跑一遍','','imitation.html'],
 ['manual','还是这三道栏，换你掌握时机','空格或 ↑ 跳跃，↓ 切换下蹲。','motion-learning.html?mode=manual'],
 ['training','松开按键，让它靠试错练跳和蹲','','motion-learning.html?mode=train'],
 ['showcase','换条没练过的赛道，它还跳得准吗？','','motion-learning.html?mode=showcase'],
 ['loop','赛前检查：跳完一栏，怎么发现下一栏？','','loop.html'],
 ['design','终极挑战：带你的机器人跑完六段赛道','','final-race.html']
];
const state=load(),host=document.getElementById('page');
const previousPages=['diagnosis','discovery','workshop','trial','imitation','manual','training','showcase','loop','fault','design'];
const aliases={discovery:'workshop',fault:'loop'};
const findPage=id=>pages.findIndex(([page])=>page===(aliases[id]??id));
const chapters=[
  {name:'一 · 弯道试跑',start:findPage('diagnosis')},
  {name:'二 · 越障训练',start:findPage('imitation')},
  {name:'三 · 检修与决赛',start:findPage('loop')},
];
const options=new URLSearchParams(location.search);
const legacyRunner=options.get('runner')==='legacy';
const legacyChallenge=options.get('lab')==='v2';
let current=-1;
function render(index,focus=false){
  index=Math.max(0,Math.min(pages.length-1,index));
  const [id,pageTitle,lead,src]=pages[index];
  if(location.hash!=='#'+id)history.replaceState(null,'','#'+id);
  if(current===index)return;
  current=index;storageNotice(save({pageId:id,page:previousPages.indexOf(id)}));
  const oldFinal=legacyChallenge&&id==='design';
  const title=oldFinal?'V2 综合挑战：让方案真正跑起来':pageTitle;
  // Flush and pause synchronously before removal: native iframe pagehide and
  // visibility events are not delivered consistently by all browsers.
  const previous=document.getElementById('experiment')?.contentDocument;
  previous?.dispatchEvent(new Event('courseleave'));
  previous?.dispatchEvent(new CustomEvent('coursevisibility',{detail:true}));
  // Removing the frame then destroys its remaining loops/listeners.
  host.replaceChildren();host.style.animation='none';void host.offsetWidth;host.style.animation='';
  const h=document.createElement('h1');h.id='pageTitle';h.textContent=title;h.tabIndex=-1;
  const legacy=legacyRunner&&['manual','training','showcase'].includes(id);
  const p=document.createElement('p');p.className='lead';p.textContent=legacy?'使用旧版 Runner 和本机保留的训练记录。':oldFinal?'继续使用原有 V2 训练、综合实验和图形化方案。':lead;
  host.append(h);
  if(p.textContent)host.append(p);
  const activity=document.createElement('div');activity.className='book-activity';host.append(activity);
  const frame=document.createElement('iframe');frame.src='experiments/'+(legacy?src.replace('motion-learning.html','runner.html'):oldFinal?'design.html':src);frame.className='experiment';frame.title=title;frame.id='experiment';activity.append(frame);
  if(legacy||oldFinal){
    const link=document.createElement('a'),url=new URL(location.href);
    url.searchParams.delete(legacy?'runner':'lab');url.hash=id;
    link.href=url;link.textContent=legacy?'返回人形短道实验':'返回连续总决赛';host.append(link);
  }
  document.getElementById('prev').disabled=index===0;
  document.getElementById('next').disabled=index===pages.length-1;
  document.getElementById('pageNumber').textContent=`${String(index+1).padStart(2,'0')} / ${pages.length}`;
  for(const link of lessonList.querySelectorAll('a'))link.setAttribute('aria-current',link.hash==='#'+id?'page':'false');
  document.getElementById('chapterName').textContent=chapters.findLast(chapter=>chapter.start<=index).name;
  if(focus){h.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
}
function go(n){
 const index=Math.max(0,Math.min(pages.length-1,n));
 location.hash=pages[index][0];
 // Chapter/next/back clicks must flush the active experiment before returning.
 // hashchange is asynchronous and remains responsible for browser history changes.
 render(index,true);
}
document.getElementById('prev').onclick=()=>go(current-1);
document.getElementById('next').onclick=()=>go(current+1);
function openCurrent(focus=false){
  const linked=findPage(location.hash.slice(1));
  render(linked>=0?linked:findPage(state.pageId??previousPages[state.page]),focus);
}
window.addEventListener('hashchange',()=>openCurrent(true));
window.addEventListener('message',e=>{const frame=document.getElementById('experiment');if(e.origin!==location.origin||e.source!==frame?.contentWindow||e.data?.type!=='robotcoach:height')return;const h=Number(e.data.height);if(Number.isFinite(h))frame.style.height=Math.max(280,Math.min(2400,h+2))+'px';});
const contents=document.getElementById('contents'),lessonList=document.getElementById('lessonList');
function syncVisibility(){
  document.getElementById('experiment')?.contentDocument?.dispatchEvent(
    new CustomEvent('coursevisibility',{detail:document.hidden||contents.open}));
}
document.addEventListener('visibilitychange',syncVisibility);
contents.addEventListener('close',syncVisibility);
for(const [i,{name,start}] of chapters.entries()){
  const group=document.createElement('section'),heading=document.createElement('h3');
  heading.textContent=name;group.append(heading);
  for(let j=start;j<(chapters[i+1]?.start??pages.length);j++){
    const [id,title]=pages[j],a=document.createElement('a'),number=document.createElement('small');
    a.href='#'+id;number.textContent=String(j+1).padStart(2,'0');a.append(number,title);
    a.addEventListener('click',event=>{event.preventDefault();contents.close();go(j);});
    group.append(a);
  }
  lessonList.append(group);
}
document.getElementById('openContents').onclick=()=>{contents.showModal();syncVisibility();};
document.getElementById('closeContents').onclick=()=>contents.close();
openCurrent();
