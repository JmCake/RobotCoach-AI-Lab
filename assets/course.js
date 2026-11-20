import {load,save,storageNotice} from './state.js';
const pages=[
 ['diagnosis','初代机能跑过急弯吗？','初代机只装了摄像头。试跑一次，观察它在弯道里如何转向、保持平衡。','humanoid-trial.html?mode=baseline'],
 ['discovery','找到机器人的四种感官','刚才缺少了哪些信息？点击机器人身上的感官，看看它们分别能知道什么。','discovery.html'],
 ['workshop','给机器人装上新感官','把模块拖到机器人身上，或直接点选安装。不同感官提供不同信息，按你的想法组合。','selection.html'],
 ['trial','同一条弯道，这次会怎样？','用刚才安装的感官再跑一次。对照初代机，看看改变感官后，距离和用时有什么变化。','humanoid-trial.html'],
 ['imitation','照着做，能一直做对吗？','行为克隆从人的示范中学习动作。先观察模仿，再改变障碍位置，看看仅仅复读动作的局限。','imitation.html'],
 ['manual','这一次，你来操控','空格或 ↑ 跳跃，↓ 下蹲。也可以直接点按钮。跨过地面障碍，遇到横梁保持低姿态。','runner.html?mode=manual'],
 ['training','让机器人自己试错','每次动作后更新 Q 表：跨过障碍获得奖励，碰撞受到惩罚。失败后重新尝试，经验留在本机。','runner.html?mode=train'],
 ['showcase','把学到的策略跑给你看','展示只读取已有 Q 表，不再探索或训练。观察当前策略的真实表现；没有训练也可以先试一局。','runner.html?mode=showcase'],
 ['loop','把一次行动，连成一个闭环','拖动三个模块，运行后把「行动」接回「感知」。手机和键盘也可先选模块、再选位置。','loop.html'],
 ['fault','拿掉一个环节，会发生什么？','关闭一个节点或反馈回路，再运行。观察信息在哪一步中断，然后恢复它。','fault.html'],
 ['design','综合挑战：让方案真正跑起来','选感官、训练策略，在复杂环境里实际运行并比较成绩；图形化方案设计与总结仍可展开使用。','design.html']
];
const state=load(),host=document.getElementById('page');
let current=-1;
function fromHash(){const id=location.hash.slice(1);return pages.findIndex(x=>x[0]===id);}
function render(index,focus=false){
  index=Math.max(0,Math.min(pages.length-1,index));
  if(current===index)return;
  current=index;storageNotice(save({page:index}));
  const [id,title,lead,src]=pages[index];
  // Flush and pause synchronously before removal: native iframe pagehide and
  // visibility events are not delivered consistently by all browsers.
  document.getElementById('experiment')?.contentDocument?.dispatchEvent(new CustomEvent('coursevisibility',{detail:true}));
  // Removing the frame then destroys its remaining loops/listeners.
  host.replaceChildren();host.style.animation='none';void host.offsetWidth;host.style.animation='';
  const eyebrow=document.createElement('p');eyebrow.className='eyebrow';eyebrow.textContent=['第一章 · 感知与选拔','第二章 · 学习与训练','第三章 · AI闭环'][index<4?0:index<8?1:2];
  const h=document.createElement('h1');h.id='pageTitle';h.textContent=title;h.tabIndex=-1;
  const p=document.createElement('p');p.className='lead';p.textContent=lead;
  host.append(eyebrow,h,p);
  if(index===0&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const intro=document.createElement('iframe');intro.src='experiments/parkour.html';intro.className='parkour';intro.title='机器人自动跑酷开场';intro.tabIndex=-1;intro.setAttribute('aria-hidden','true');host.append(intro);}
  const frame=document.createElement('iframe');frame.src='experiments/'+src;frame.className='experiment';frame.title=title;frame.id='experiment';host.append(frame);
  document.getElementById('prev').disabled=index===0;
  document.getElementById('next').disabled=index===pages.length-1;
  document.getElementById('pageNumber').textContent=`${String(index+1).padStart(2,'0')} / ${pages.length}`;
  for(const el of document.querySelectorAll('[data-chapter]')){const start=Number(el.dataset.chapter),end=start===0?4:start===4?8:11;el.setAttribute('aria-current',index>=start&&index<end?'page':'false');}
  if(location.hash!=='#'+id)history.replaceState(null,'','#'+id);
  if(focus){h.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
}
function go(n){
 const index=Math.max(0,Math.min(10,n));
 location.hash=pages[index][0];
 // Chapter/next/back clicks must flush the active experiment before returning.
 // hashchange is asynchronous and remains responsible for browser history changes.
 render(index,true);
}
document.getElementById('prev').onclick=()=>go(current-1);
document.getElementById('next').onclick=()=>go(current+1);
for(const el of document.querySelectorAll('[data-chapter]'))el.onclick=()=>go(Number(el.dataset.chapter));
window.addEventListener('hashchange',()=>{const n=fromHash();render(n<0?state.page:n,true);});
window.addEventListener('message',e=>{const frame=document.getElementById('experiment');if(e.origin!==location.origin||e.source!==frame?.contentWindow||e.data?.type!=='robotcoach:height')return;const h=Number(e.data.height);if(Number.isFinite(h))frame.style.height=Math.max(280,Math.min(2400,h+2))+'px';});
document.addEventListener('visibilitychange',()=>document.getElementById('experiment')?.contentWindow?.postMessage({type:'robotcoach:visibility',hidden:document.hidden},location.origin));
render(fromHash()<0?state.page:fromHash());
