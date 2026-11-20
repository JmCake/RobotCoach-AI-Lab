import {load,save,storageNotice} from './state.js';
const pages=[
 ['diagnosis','初代机能跑过急弯吗？','只有一台摄像头，前面是 40 米急弯。举手猜一猜，再让机器人上场。','humanoid-trial.html?mode=baseline'],
 ['workshop','认识并安装机器人的感官','点击机器人身上的部位了解它的作用，再选择或拖入模块，看看机器人的外观怎样改变。','selection.html'],
 ['trial','同一条弯道，这次会怎样？','用刚才安装的感官再跑一次。对照初代机，看看改变感官后，距离和用时有什么变化。','humanoid-trial.html'],
 ['imitation','照着做，能一直做对吗？','行为克隆从人的示范中学习动作。先观察模仿，再改变障碍位置，看看仅仅复读动作的局限。','imitation.html'],
 ['manual','这一次，你来操控','跨过矮栏，从横梁下方通过。试着掌握跳跃和下蹲的时机。','motion-learning.html?mode=manual'],
 ['training','让机器人自己试错','让机器人尝试不同的动作，观察越障和失败怎样改变它下一轮的选择。','motion-learning.html?mode=train'],
 ['showcase','学过以后，真的更好了吗？','冻结训练前后的策略，让它们各跑相同的 20 条留出短道，比较实际成绩。','motion-learning.html?mode=showcase'],
 ['loop','搭建并测试闭环','把「行动」接回「感知」。搭好后，在同一张图上关掉一个环节，再运行观察。','loop.html'],
 ['design','终极挑战：让机器人跑向终点','选好感官和动作策略，挑战连续六段赛道。','final-race.html']
];
const state=load(),host=document.getElementById('page');
const previousPages=['diagnosis','discovery','workshop','trial','imitation','manual','training','showcase','loop','fault','design'];
const aliases={discovery:'workshop',fault:'loop'};
const findPage=id=>pages.findIndex(([page])=>page===(aliases[id]??id));
const chapters=[...document.querySelectorAll('[data-chapter]')].map(link=>({link,start:findPage(link.dataset.chapter)}));
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
  host.append(h,p);
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
  chapters.forEach(({link,start},i)=>{
    const end=chapters[i+1]?.start??pages.length;
    link.setAttribute('aria-current',index>=start&&index<end?'page':'false');
  });
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
for(const {link,start} of chapters)link.onclick=()=>go(start);
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
for(const [i,{link,start}] of chapters.entries()){
  const group=document.createElement('section'),heading=document.createElement('h3');
  heading.textContent=link.textContent;group.append(heading);
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
