import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const baseURL=`http://127.0.0.1:${process.env.PORT||4180}`;
const frame=page=>page.frameLocator('#experiment');
const ids=['diagnosis','workshop','trial','imitation','manual','training','showcase','loop','design'];
const evidence=process.env.EVIDENCE_DIR||'test-results/evidence';
const errorsByPage=new WeakMap();
test.beforeEach(async({page})=>{const errors=[];errorsByPage.set(page,errors);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});});
test.afterEach(async({page})=>{expect(errorsByPage.get(page)).toEqual([]);});
test.beforeAll(async()=>{await mkdir(evidence,{recursive:true});});
for(const mobile of [false,true])test(`${mobile?'mobile touch':'desktop'}: all nine pages, back, chapters and refresh`,async({page})=>{
 if(mobile)await page.setViewportSize({width:390,height:844});
 const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(baseURL)&&!r.url().startsWith('data:'))external.push(r.url());});
 await page.goto('/');await expect(page).toHaveTitle(/机器人总教练/);await expect(page.getByRole('heading',{level:1})).toContainText('初代机');await expect(page.getByText('01 / 9')).toBeVisible();
 await page.screenshot({path:`${evidence}/${mobile?'mobile':'desktop'}-diagnosis.png`,fullPage:true});
 for(let i=0;i<ids.length;i++){
  await expect(page).toHaveURL(new RegExp('#'+ids[i]+'$'));
  await expect(frame(page).locator('body')).not.toBeEmpty();
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const child=page.frames().find(f=>f.url().includes('/experiments/')&&!f.url().includes('parkour'));
  await expect.poll(()=>child.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  if(i+1<ids.length)await page.getByRole('button',{name:'下一页'}).click();
 }
 await expect(page.getByRole('button',{name:'下一页'})).toBeDisabled();
 await page.getByRole('button',{name:'上一页'}).click();await expect(page).toHaveURL(/#loop$/);
 await page.locator('#openContents').click();await page.locator('#lessonList a[href="#imitation"]').click();await expect(page).toHaveURL(/#imitation$/);
 await page.reload();await expect(page).toHaveURL(/#imitation$/);await expect(page.getByText('04 / 9')).toBeVisible();
 await page.goto('/');await expect(page).toHaveURL(/#imitation$/);
 await page.locator('#openContents').click();await page.locator('#lessonList a[href="#loop"]').click();await expect(page).toHaveURL(/#loop$/);
 expect(errors).toEqual([]);expect(external).toEqual([]);
});
test('diagnosis locks the physical result, finishes falling and restores the score',async({page})=>{
 await page.clock.install();
 await page.goto('/#diagnosis');const f=frame(page);
 await expect(f.locator('#baselineResult')).toContainText('尚未测试');
 await f.getByRole('button',{name:'会失误'}).click();
 await expect(f.locator('#verdict')).toBeHidden();
 await f.locator('#play').click();await page.clock.runFor(3600);
 await expect(f.locator('#baselineResult')).toContainText('未通过 · 14.9 / 40 m');
 await expect(f.locator('#verdict')).toContainText('猜中了！跑到 14.9 米');
 await expect(f.locator('.trial-stage .track-speech')).toContainText('我看见弯道了');
 await expect(f.locator('.trial-console')).not.toContainText('重心超出支撑范围');
 const savedAtVerdict=await page.evaluate(()=>JSON.parse(localStorage.getItem('robotcoach:v1')).chapter1BaselineRun);
 expect(savedAtVerdict.result.distance.toFixed(1)).toBe('14.9');
 await expect(f.getByRole('button',{name:'能完赛'})).toBeDisabled();
 const lockedDistance=await f.locator('#distance').textContent();
 await expect(f.locator('#play')).toHaveText('暂停');
 await page.clock.runFor(3300);
 await expect(f.locator('#motionState')).toHaveAttribute('data-state','fallen');
 await expect(f.locator('#distance')).toHaveText(lockedDistance);
 await expect(f.locator('#baselineResult')).toContainText('摔倒 1 次');
 await page.screenshot({path:`${evidence}/chapter1-desktop-initial.png`,fullPage:true});
 for(const width of [1280,320]){
   await page.setViewportSize({width,height:800});
   const bubble=f.locator('.track-speech'),canvas=f.locator('#motionCanvas');
   await expect(bubble).toBeVisible();
   await expect.poll(async()=>{
     const b=await bubble.boundingBox(),c=await canvas.boundingBox();
     return b.x>=c.x&&b.y>=c.y&&b.x+b.width<=c.x+c.width+1&&b.y+b.height<=c.y+c.height+1;
   }).toBe(true);
 }
 const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('robotcoach:v1')).chapter1BaselineRun);
 const first=await stored();
 await page.reload();
 await expect(f.locator('#baselineResult')).toHaveAttribute('data-outcome','failed');
 await f.locator('#play').click();await page.clock.runFor(12000);
 await expect(f.locator('#play')).toHaveText('重新试跑');
 expect(await stored()).toEqual(first);
});
test('discover, visibly install and remove sensor parts, then compare runs',async({page})=>{
 await page.clock.install();
 await page.goto('/#discovery');await expect(page).toHaveURL(/#workshop$/);
 const install=frame(page),part=id=>install.locator(`[data-mounted-sensor="${id}"]`);
 await expect(part('camera')).toBeVisible();
 for(const id of ['lidar','imu','force'])await expect(part(id)).toBeHidden();
 await install.locator('#dropzone').screenshot({path:`${evidence}/robot-camera-only.png`});
 for(const name of ['发现视觉摄像头','发现激光雷达','发现姿态传感器','发现足底力觉传感器'])await install.getByRole('button',{name}).click();
 await expect(install.getByText('已认识 4 / 4 种感官')).toBeVisible();
 await install.getByRole('button',{name:'发现视觉摄像头'}).click();
 await install.locator('#toggleSensor').click();await expect(part('camera')).toBeHidden();
 await install.locator('#toggleSensor').click();await expect(part('camera')).toBeVisible();
 await install.locator('[data-sensor="lidar"]').dragTo(install.locator('#dropzone'));
 await expect(install.locator('[data-sensor="lidar"]')).toHaveAttribute('aria-pressed','true');
 await expect(part('lidar')).toBeVisible();
 await install.locator('[data-sensor="imu"]').click();await install.locator('[data-sensor="force"]').click();
 for(const id of ['camera','lidar','imu','force'])await expect(part(id)).toBeVisible();
 await install.locator('#dropzone').screenshot({path:`${evidence}/robot-four-sensors.png`});
 await page.reload();await expect(install.locator('[data-sensor="force"]')).toHaveAttribute('aria-pressed','true');
 for(const id of ['camera','lidar','imu','force'])await expect(part(id)).toBeVisible();
 await page.getByRole('button',{name:'下一页'}).click();const trial=frame(page);
 await expect(trial.locator('#studentResult')).toContainText('尚未测试');
 await expect(trial.locator('#installed')).toContainText('姿态传感器 IMU');
 await trial.locator('#play').click();await page.clock.runFor(8900);
 await expect(trial.locator('#studentResult')).toContainText('已过终点 · 40.0 / 40 m');
 await expect(trial.locator('#play')).toHaveText('暂停');
 await page.reload();
 await expect(trial.locator('#studentResult')).toHaveAttribute('data-outcome','passed');
 await trial.getByRole('button',{name:'初代机对照'}).click();
 await expect(trial.locator('#installed')).toHaveText('本次使用：摄像头');
 await trial.locator('#play').click();await page.clock.runFor(9000);
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('robotcoach:v1')));
 const {chapter1BaselineRun:baseline,chapter1StudentRun:student,sensors}=await saved();
 expect(sensors).toEqual({camera:true,lidar:true,imu:true,force:true});
 expect(baseline.conditions).toEqual(student.conditions);
 expect(baseline.conditions).toEqual({scene:'curve',seed:2026,distance:40,target:6.4,controller:'motion-rule-v1',layout:'stadium-semicircle-v1',physics:'turn-load-v2'});
 expect(baseline.result).toMatchObject({success:false,offTrack:false,falls:1,sensors:{camera:true,lidar:false,imu:false,force:false}});
 expect(student.result).toMatchObject({success:true,distance:40,sensors});
 await trial.getByRole('button',{name:'我的配置'}).click();
 await expect(trial.locator('#studentResult')).toHaveAttribute('data-outcome','passed');
 await page.screenshot({path:`${evidence}/chapter1-desktop-comparison.png`,fullPage:true});
 await expect(trial.locator('#distanceDelta')).toContainText('多跑了 25.1 米');
 await expect(trial.locator('#baselineLane output')).toHaveText('14.9 m');
 await expect(trial.locator('#studentLane output')).toHaveText('40.0 m');
 await page.reload();
 await expect(trial.locator('#studentResult')).toHaveAttribute('data-outcome','passed');
 // Page 1 uses the initial camera-only snapshot after the student has installed all four modules.
 await page.locator('#openContents').click();await page.locator('#lessonList a[href="#diagnosis"]').click();
 await expect(trial.locator('#installed')).toHaveText('本次使用：摄像头');
 expect((await saved()).sensors).toEqual(sensors);
 expect((await saved()).chapter1StudentRun).toEqual(student);
 await page.goBack();
 await page.getByRole('button',{name:'上一页'}).click();
 await install.locator('[data-sensor="imu"]').click();
 await install.locator('[data-sensor="imu"]').click();
 await page.getByRole('button',{name:'下一页'}).click();
 await expect(trial.locator('#studentResult')).toContainText('尚未测试');
 await expect(trial.locator('#baselineResult')).toHaveAttribute('data-outcome','failed');
 expect((await saved()).chapter1StudentRun).toBeNull();
 await expect(trial.locator('#distanceDelta')).toBeHidden();
});
test('class contents pauses a live lesson and jumps directly to the final',async({page})=>{
 await page.goto('/#diagnosis');
 const f=frame(page);
 await f.locator('#play').click();
 await expect(f.locator('#distance')).not.toHaveText('0.0 / 40 m');
 await page.getByRole('button',{name:'课堂目录'}).click();
 const contents=page.getByRole('dialog');
 await expect(contents.locator('#lessonList a')).toHaveCount(9);
 await expect(f.locator('#play')).toHaveText('继续试跑');
 await page.keyboard.press('Escape');
 await expect(contents).toBeHidden();
 await expect(page.getByRole('button',{name:'课堂目录'})).toBeFocused();
 await page.getByRole('button',{name:'课堂目录'}).click();
 await contents.getByRole('link',{name:/终极挑战/}).click();
 await expect(page).toHaveURL(/#design$/);
 await expect(f.locator('#start')).toBeVisible();
});
test('chapter one touch layout, hiding pause and repeated page removal',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page=await context.newPage();const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.clock.install();
 await page.goto(baseURL+'/#workshop');
 const f=frame(page);
 await f.locator('[data-sensor=imu]').tap();
 await page.getByRole('button',{name:'下一页'}).tap();
 const noOverflow=()=>f.locator('body').evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
 expect(await noOverflow()).toBe(true);
 await f.locator('#play').tap();await page.clock.runFor(1200);
 await expect(f.locator('#distance')).not.toHaveText('0.0 / 40 m');
 // Exercise the book's actual visibility bridge without relying on OS focus in headless Chromium.
 await page.evaluate(()=>{
   Object.defineProperty(document,'hidden',{value:true,configurable:true});
   document.dispatchEvent(new Event('visibilitychange'));
 });
 await expect(f.locator('#play')).toHaveText('继续试跑');
 const pausedDistance=await f.locator('#distance').textContent();
 await page.clock.runFor(12000);
 await expect(f.locator('#distance')).toHaveText(pausedDistance);
 await page.evaluate(()=>{
   delete document.hidden;
   document.dispatchEvent(new Event('visibilitychange'));
 });
 for(let i=0;i<2;i++){
  await f.locator('#play').tap();await page.clock.runFor(700);
  const child=page.frames().find(frame=>frame.url().includes('humanoid-trial.html'));
  await page.getByRole('button',{name:'上一页'}).tap();
  expect(child.isDetached()).toBe(true);
  await page.getByRole('button',{name:'下一页'}).tap();
  await expect(f.locator('#play')).toHaveText('开始试跑');
  await expect(f.locator('#distance')).toHaveText('0.0 / 40 m');
 }
 await page.setViewportSize({width:320,height:740});
 expect(await noOverflow()).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await f.locator('#play').tap();await page.clock.runFor(12000);
 await expect(f.locator('#studentResult')).toHaveAttribute('data-outcome','passed');
 await page.screenshot({path:`${evidence}/chapter1-narrow.png`,fullPage:true});
 expect(errors).toEqual([]);
 await context.close();
});
test('manual keyboard and phone controls use live physics, retry, preserve score',async({page})=>{
 await page.goto('/?runner=legacy#manual');const f=frame(page);const greenTop=()=>f.locator('#game').evaluate(c=>{const {data}=c.getContext('2d').getImageData(40,0,100,235);for(let y=0;y<235;y++)for(let x=0;x<100;x++){const i=(y*100+x)*4;if(data[i]<50&&data[i+1]>180&&data[i+2]<80)return y;}return 235;});const standing=await greenTop();await f.getByRole('button',{name:'开始',exact:true}).click();await f.locator('#game').press('ArrowUp');await expect.poll(greenTop).toBeLessThan(standing-10);await expect(f.locator('#score')).not.toHaveText('0');await f.getByRole('button',{name:'暂停',exact:true}).click();
 await f.getByRole('button',{name:'继续',exact:true}).click();await f.getByRole('button',{name:'↓ 下蹲'}).click();await expect(f.getByRole('button',{name:'↓ 下蹲'})).toHaveAttribute('aria-pressed','true');await f.getByRole('button',{name:'↑ 跳跃'}).click();await f.getByRole('button',{name:'重试本轮'}).click();await expect(f.getByRole('status').last()).toContainText('正在跑');await expect(f.getByRole('status').last()).toContainText('本轮',{timeout:20000});
 await page.reload();await expect(frame(page).getByRole('status').last()).toContainText('本机最高');
});
test('real browser training updates Q, survives refresh, freezes showcase, resets',async({page})=>{
 await page.goto('/?runner=legacy#training');const f=frame(page);await f.getByRole('button',{name:'开始',exact:true}).click();await f.getByLabel('训练速度').selectOption('32');
 await expect.poll(()=>f.locator('#attempts').textContent(),{timeout:20000}).not.toBe('0');await expect.poll(()=>f.locator('#updates').textContent()).not.toBe('0');
 await expect.poll(async()=>Number(await f.locator('#attempts').textContent()),{timeout:25000}).toBeGreaterThan(12);
 await f.getByRole('button',{name:'暂停',exact:true}).click();const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('robotcoach:q:v1')));expect(saved.updates).toBeGreaterThan(0);expect(Object.values(saved.q).some(r=>r.some(x=>x!==0))).toBe(true);
 await writeFile(`${evidence}/browser-training.json`,JSON.stringify(saved,null,2));await page.screenshot({path:`${evidence}/q-training.png`,fullPage:true});
 await page.reload();await expect(frame(page).locator('#updates')).toHaveText(String(saved.updates));
 await page.getByRole('button',{name:'下一页'}).click();await frame(page).getByRole('button',{name:'开始',exact:true}).click();await page.waitForTimeout(2500);await frame(page).getByRole('button',{name:'暂停',exact:true}).click();const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('robotcoach:q:v1')));expect(after).toEqual(saved);
 await page.getByRole('button',{name:'上一页'}).click();await frame(page).getByRole('button',{name:'重置训练'}).click();await expect(frame(page).locator('#updates')).toHaveText('0');await expect(frame(page).locator('#attempts')).toHaveText('0');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('robotcoach:q:v1')).q)).toEqual({});
});
test('one demonstration teaches an independent jump and duck policy',async({page})=>{
 await page.clock.install();
 await page.goto('/#imitation');const f=frame(page);
 await f.locator('#demo').click();
 await expect(f.locator('#firstTitle')).toHaveText('教练示范');
 await page.clock.runFor(14000);
 await expect(f.locator('#firstCount')).toContainText('0 / 3');
 await expect(f.locator('#secondCount')).toContainText('3 / 3');
 const snapshot=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('robotcoach:v1')).imitationLesson.samples);
 const learned=await snapshot();expect(learned.length).toBeGreaterThan(0);
 await f.locator('#change').click();await page.clock.runFor(7500);
 await expect(f.locator('#secondCount')).toContainText('3 / 3');
 await expect(f.locator('#feedback')).toHaveText('下一页换你来跑，栏架位置相同。');
 expect(await snapshot()).toEqual(learned);
 await page.locator('#next').click();await expect(page).toHaveURL(/#manual$/);
 await expect(f.locator('#feedback')).toContainText('教练在距第一栏 2.8 米时起跳');
 await f.locator('#play').click();await page.clock.runFor(3450);
 await expect(f.locator('#feedback')).toHaveAttribute('data-outcome','failed');
 await expect(f.locator('#distance')).toHaveText('9.9 / 32 m');
});
for(const mobile of [false,true])test(`${mobile?'mobile':'desktop'} loop drag/tap assembly, feedback connection, restore`,async({page})=>{
 if(mobile)await page.setViewportSize({width:390,height:844});await page.goto('/#loop');const f=frame(page);
 if(mobile){for(const type of ['sense','decision','action']){await f.locator(`[data-module="${type}"]`).click();await f.locator(`[data-target="${type}"]`).click();}}
 else for(const type of ['sense','decision','action'])await f.locator(`[data-module="${type}"]`).dragTo(f.locator(`[data-target="${type}"]`));
 await f.getByRole('button',{name:'运行',exact:true}).click();await expect(f.getByRole('status')).toContainText('一次行动结束',{timeout:12000});await f.locator('.node.action').click();await f.locator('.node.sense').click();await expect(f.getByRole('status')).toContainText('行动已连接回感知');await f.getByRole('button',{name:'运行闭环'}).click();await expect(f.getByRole('status')).toContainText('闭环已循环');await f.getByRole('button',{name:'暂停',exact:true}).click();await page.reload();await expect(frame(page).getByRole('button',{name:'运行闭环'})).toBeEnabled();await page.screenshot({path:`${evidence}/${mobile?'mobile':'desktop'}-loop.png`,fullPage:true});
});
test('the same assembled diagram shows each break and can recover',async({page})=>{
 await page.goto('/#fault');await expect(page).toHaveURL(/#loop$/);const f=frame(page);
 await expect(f.locator('#faultTests')).toBeHidden();
 for(const type of ['sense','decision','action']){await f.locator(`[data-module="${type}"]`).click();await f.locator(`[data-target="${type}"]`).click();}
 await f.locator('#submitBtn').click();await expect(f.getByRole('status')).toContainText('一次行动结束');
 await f.locator('.node.action').click();await f.locator('.node.sense').click();
 const diagram=await f.locator('#canvas').elementHandle();
 for(const [key,name,text] of [['sense','感知','感知关闭'],['decision','决策','决策关闭'],['action','行动','行动关闭'],['loop','反馈回路','反馈回路断开']]){
  await f.getByRole('button',{name:'关闭'+name,exact:true}).click();
  await expect(f.locator(key==='loop'?'#ta3':`.node.${key}`)).toHaveClass(key==='loop'?/broken/:/fault-off/);
  await f.locator('#submitBtn').click();await expect(f.getByRole('status')).toContainText(text);
  expect(await diagram.evaluate(el=>el.isConnected&&el.querySelectorAll('.node').length===3)).toBe(true);
  const video=f.locator('#faultVideo');await expect(video).toHaveAttribute('src',`../assets/videos/${key}.webm`);
  await f.locator('#faultClip summary').click();await video.evaluate(v=>v.play());
  await expect.poll(()=>video.evaluate(v=>v.currentTime)).toBeGreaterThan(.1);
  await f.getByRole('button',{name:'恢复'+name,exact:true}).click();
 }
 await f.locator('#submitBtn').click();await expect(f.getByRole('status')).toContainText('闭环已循环');
});
test('graphical design restores five selections and ends with concise summary',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/?lab=v2#design');const f=frame(page);await f.locator('#designActivity > summary').click();for(const name of ['公园','巡检避障','激光雷达','自主试错','异常停车'])await f.getByRole('button',{name,exact:true}).click();await expect(f.locator('#result')).toContainText('在公园中巡检避障');await expect(f.locator('#result')).toContainText('异常停车');await page.reload();await frame(page).locator('#designActivity > summary').click();await expect(frame(page).getByRole('button',{name:'公园',exact:true})).toHaveAttribute('aria-pressed','true');await page.screenshot({path:`${evidence}/mobile-design.png`,fullPage:true});
});
test('leaving training destroys the frame and stops updates; hidden document pauses',async({page})=>{
 await page.goto('/?runner=legacy#training');const f=frame(page);await f.getByRole('button',{name:'开始',exact:true}).click();await expect.poll(async()=>Number(await f.locator('#updates').textContent())).toBeGreaterThan(1);await page.evaluate(()=>document.getElementById('experiment').contentWindow.postMessage({type:'robotcoach:visibility',hidden:true},location.origin));await expect(f.getByRole('button',{name:'继续',exact:true})).toBeVisible();const paused=await f.locator('#updates').textContent();await page.waitForTimeout(300);await expect(f.locator('#updates')).toHaveText(paused);await f.getByRole('button',{name:'继续',exact:true}).click();await page.locator('#openContents').click();await page.locator('#lessonList a[href="#loop"]').click();const before=await page.evaluate(()=>localStorage.getItem('robotcoach:q:v1'));await page.waitForTimeout(800);expect(await page.evaluate(()=>localStorage.getItem('robotcoach:q:v1'))).toBe(before);expect(page.frames().filter(f=>f.url().includes('runner.html'))).toHaveLength(0);
});
test('iframe changes survive parent navigation without an intervening refresh',async({page})=>{
 await page.goto('/#discovery');await frame(page).getByRole('button',{name:'发现激光雷达'}).click();for(const type of ['lidar','imu','force'])await frame(page).locator(`[data-sensor="${type}"]`).click();await page.getByRole('button',{name:'下一页'}).click();await expect(frame(page).locator('#installed')).toContainText('激光测距、姿态传感器 IMU、足底力觉');await page.reload();await expect(frame(page).locator('#installed')).toContainText('激光测距');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('robotcoach:v1')).discovered)).toContain('lidar');
});
test('old numeric reading progress resumes at the merged lesson',async({page})=>{
 await page.goto('/');
 await page.evaluate(()=>localStorage.setItem('robotcoach:v1',JSON.stringify({version:1,page:9})));
 await page.goto('/');await expect(page).toHaveURL(/#loop$/);
 await expect(page.getByText('08 / 9')).toBeVisible();
 await page.goto('/');await expect(page).toHaveURL(/#loop$/);
});
test('phone touch controls operate sensors, jump, assembly and node switches',async({browser})=>{
 const context=await browser.newContext({viewport:{width:320,height:740},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 const page=await context.newPage(),f=frame(page);
 await page.goto(baseURL+'/#workshop');await f.locator('[data-sensor="imu"]').tap();
 await expect(f.locator('[data-mounted-sensor="imu"]')).toBeVisible();
 await page.goto(baseURL+'/?runner=legacy#manual');await f.getByRole('button',{name:'开始',exact:true}).tap();
 await f.getByRole('button',{name:'↑ 跳跃'}).tap();await f.getByRole('button',{name:'↓ 下蹲'}).tap();
 await expect(f.getByRole('button',{name:'↓ 下蹲'})).toHaveAttribute('aria-pressed','true');
 await page.locator('#openContents').tap();await page.locator('#lessonList a[href="#loop"]').tap();
 for(const type of ['sense','decision','action']){await f.locator(`[data-module="${type}"]`).tap();await f.locator(`[data-target="${type}"]`).tap();}
 await f.locator('#submitBtn').tap();await expect(f.getByRole('status')).toContainText('一次行动结束');
 await f.locator('.node.action').tap();await f.locator('.node.sense').tap();
 await f.getByRole('button',{name:'关闭感知',exact:true}).tap();
 await expect(f.getByRole('button',{name:'恢复感知',exact:true})).toBeVisible();
 expect(await f.locator('body').evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await context.close();
});
