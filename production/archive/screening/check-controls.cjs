const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 try{
  const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  let errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:24871/film.html');
  const phase=s=>p.waitForSelector('body[data-phase="'+s+'"]',{timeout:35000});
  const click=s=>p.getByRole('button',{name:s,exact:true}).click();
  await phase('opening');await p.waitForFunction(()=>document.querySelector('video').currentTime>1);
  await click('暂停');const t=await p.locator('video').evaluate(v=>v.currentTime);await p.waitForTimeout(600);
  assert(Math.abs(t-await p.locator('video').evaluate(v=>v.currentTime))<.085);await click('继续');
  await p.locator('video').evaluate(v=>v.playbackRate=7);
  await phase('incident');await click('它没有及时感知脚底');await click('进入维修舱');await click('姿态 IMU');
  await click('用这套装备试跑');await phase('curve-result');assert((await p.locator('#detail').innerText()).includes('控制器还没有收到'));
  await click('调整装备再试');await p.getByLabel('IMU 信号接法').selectOption('control');await click('用这套装备试跑');
  await phase('curve-result');await click('沿着跑道向前看');await phase('hurdle');await p.waitForFunction(()=>document.querySelector('video').currentTime>.5);
  await p.locator('video').evaluate(v=>v.playbackRate=7);await phase('split');await p.waitForTimeout(900);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert(await p.locator('#split button').evaluateAll(bs=>bs.every(b=>b.style.backgroundImage.startsWith('url("data:image/webp'))));
  await p.screenshot({path:path.resolve(__dirname,'../../../docs/全片验收/手机-训练讨论.jpg'),quality:87});
  const log=await p.evaluate(()=>JSON.parse(sessionStorage.getItem('robotcoach:screening:last')));
  assert.deepEqual(log.trials.map(t=>t.success),[false,true]);assert(!errors.length,errors.join(','));
  console.log('mobile',log.trials.map(({monitor,success,distance,peak})=>({monitor,success,distance,peak})));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
