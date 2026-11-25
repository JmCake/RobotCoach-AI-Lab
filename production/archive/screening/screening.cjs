if(process.argv.includes('--record'))process.env.PLAYWRIGHT_BROWSERS_PATH=require('node:path').join(__dirname,'runtime');
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir=path.join(__dirname,'../../../docs/全片验收');
fs.mkdirSync(dir,{recursive:true});
const alternate=process.argv.includes('--alternate');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--autoplay-policy=no-user-gesture-required','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
 try{
  const record=!alternate&&process.argv.includes('--record');
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const stop=record?await require('./capture.cjs').start(page,path.join(__dirname,'capture')):null;
  if(record){
    await page.addInitScript(()=>{
      const ctx=new AudioContext(),dest=ctx.createMediaStreamDestination(),chunks=[],sources=new WeakMap(),taps=new WeakMap();
      const connect=AudioNode.prototype.connect;
      AudioNode.prototype.connect=function(target,...rest){
        if(target instanceof AudioDestinationNode&&this.context!==ctx){
          if(!taps.has(this.context)){
            const bus=this.context.createMediaStreamDestination();
            ctx.createMediaStreamSource(bus.stream).connect(dest);taps.set(this.context,bus);
          }
          connect.call(this,taps.get(this.context));
        }return connect.call(this,target,...rest);
      };
      const play=HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play=function(...args){
        if(!sources.has(this)){const node=ctx.createMediaElementSource(this);node.connect(dest);node.connect(ctx.destination);sources.set(this,node);}
        ctx.resume();return play.apply(this,args);
      };
      const recorder=new MediaRecorder(dest.stream,{mimeType:'audio/webm;codecs=opus'});recorder.ondataavailable=e=>chunks.push(e.data);
      recorder.start(1000);window.captureStarted=Date.now();
      window.finishCapture=()=>new Promise(resolve=>{recorder.onstop=()=>{
        const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks));
      };recorder.stop();});
    });
  }
  const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e);});
  page.on('response',r=>{if(r.status()>=400){errors.push(r.status()+' '+r.url());console.error(errors.at(-1));}});
  await page.goto('http://127.0.0.1:24871/',{waitUntil:'domcontentloaded'});
  const button=n=>page.getByRole('button',{name:n,exact:true});
  const click=n=>button(n).click({timeout:15000});
  const wait=async phase=>{await page.waitForSelector('body[data-phase="'+phase+'"]',{timeout:65000});console.log(phase,new Date().toISOString());};
  const time=t=>page.waitForFunction(t=>document.querySelector('video').currentTime>=t,t,{timeout:60000});
  const shot=async n=>{if(!alternate){await page.waitForTimeout(850);await page.screenshot({path:path.join(dir,n+'.jpg'),quality:88});}};
  await wait('opening');await time(6);await shot('01-起跑线的邀请');await wait('incident');
  await click('它不知道身体正在倾斜');await shot('02-事故定格与证据');await click('进入维修舱');await wait('bench');
  if(!alternate){
    await click('用这套装备试跑');await wait('curve');await click('暂停');const stats=await page.locator('#detail').innerText();await page.waitForTimeout(400);assert.equal(await page.locator('#detail').innerText(),stats);await click('继续');await wait('curve-result');await click('调整装备再试');
  }
  await click('姿态 IMU');await page.getByLabel('IMU 信号接法').selectOption('control');await click('足底力觉');await click('激光雷达');await shot('03-原机改装');await click('用这套装备试跑');await wait('curve-result');
  await click('沿着跑道向前看');await wait('hurdle');await wait('split');await shot('04-两种学习方式');
  if(alternate){await click('自己试错学');await wait('learning-result');await click('看教练怎样示范');await wait('imitation-result');}
  else{await click('跟着教练学');await wait('imitation-result');await click('看它怎样自己试错');await wait('learning-result');await shot('05-冻结测试');}
  await click('听体育场广播');await wait('grid');
  if(alternate){await click('足底力觉');await click('激光雷达');await page.getByLabel('决赛策略').selectOption('rule');}
  await click('选手就位');await wait('race');await page.waitForTimeout(7000);await shot('06-连续总决赛');await wait('race-result');
  await click('看本场关键一帧');await click('望向体育场外');await wait('field');
  assert(await button('看看 AI 的判断').isDisabled());const ground=page.locator('#ground'),box=await ground.boundingBox();
  await ground.click({position:{x:box.width*.82,y:box.height*.78}});await click('看看 AI 的判断');await wait('field-result');
  await page.getByLabel('人工纠错').selectOption('路面');await shot('07-九寨沟原图核对');await click('结束现场观察');await wait('ending');
  for(const [t,n] of [[19,'08-救援现场'],[51,'09-废墟探查'],[76,'10-回传等待'],[98,'11-手与手'],[126,'12-终字幕']]){
    await time(t);assert(await page.locator('#desk').isHidden());assert.equal(await page.locator('video').evaluate(v=>v.playbackRate),1);await shot(n);
  }
  await wait('black');await shot('13-黑场');
  const log=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('robotcoach:screening:last')));
  assert(!errors.length,errors.join('\n'));assert(log.field.connectedPixels>0&&log.field.corrections.length===1);
  assert(log.training.reinforcement.updates>0);assert(log.trials.at(-1).success);if(!alternate)assert(!log.trials[0].success);
  assert.deepEqual(log.race.sensors,alternate?{camera:true,lidar:false,imu:true,force:false}:{camera:true,lidar:true,imu:true,force:true});
  fs.writeFileSync(path.join(dir,alternate?'复验-另一配置.json':'顺播实测.json'),JSON.stringify(log,null,2));
  if(record){
    const audioStart=await page.evaluate(()=>window.captureStarted);
    const audio=await page.evaluate(()=>window.finishCapture());
    fs.writeFileSync(path.join(__dirname,'capture','class-audio.webm'),Buffer.from(audio,'base64'));
    const {video,first}=await stop();
    fs.writeFileSync(path.join(__dirname,'capture','sources.json'),JSON.stringify({video,delta:audioStart-first}));
  }
  console.log('COMPLETE',JSON.stringify({race:log.race,training:log.training.reinforcement,location:log.field.model}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
