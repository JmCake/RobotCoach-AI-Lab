import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const baseURL=`http://127.0.0.1:${process.env.PORT||4180}`;
const frame=page=>page.frameLocator('#experiment');
const ids=['diagnosis','discovery','workshop','trial','imitation','manual','training','showcase','loop','fault','design'];
const evidence=process.env.EVIDENCE_DIR||'test-results/evidence';
const errorsByPage=new WeakMap();
test.beforeEach(async({page})=>{const errors=[];errorsByPage.set(page,errors);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});});
test.afterEach(async({page})=>{expect(errorsByPage.get(page)).toEqual([]);});
test.beforeAll(async()=>{await mkdir(evidence,{recursive:true});});
for(const mobile of [false,true])test(`${mobile?'mobile touch':'desktop'}: all eleven pages, back, chapters and refresh`,async({page})=>{
 if(mobile)await page.setViewportSize({width:390,height:844});
 const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(baseURL)&&!r.url().startsWith('data:'))external.push(r.url());});
 await page.goto('/');await expect(page).toHaveTitle(/机器人总教练/);await expect(page.getByRole('heading',{level:1})).toContainText('初代机');await expect(page.getByText('01 / 11')).toBeVisible();
 await page.screenshot({path:`${evidence}/${mobile?'mobile':'desktop'}-diagnosis.png`,fullPage:true});
 for(let i=0;i<11;i++){
  await expect(page).toHaveURL(new RegExp('#'+ids[i]+'$'));
  await expect(frame(page).locator('body')).not.toBeEmpty();
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const child=page.frames().find(f=>f.url().includes('/experiments/')&&!f.url().includes('parkour'));
  await expect.poll(()=>child.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  if(i<10)await page.getByRole('button',{name:'下一页'}).click();
 }
 await expect(page.getByRole('button',{name:'下一页'})).toBeDisabled();
 await page.getByRole('button',{name:'上一页'}).click();await expect(page).toHaveURL(/#fault$/);
 await page.getByRole('button',{name:'二 · 学习与训练'}).click();await expect(page).toHaveURL(/#imitation$/);
 await page.reload();await expect(page).toHaveURL(/#imitation$/);await expect(page.getByText('05 / 11')).toBeVisible();
 await page.goto('/');await expect(page).toHaveURL(/#imitation$/);
 await page.getByRole('button',{name:'三 · AI闭环'}).click();await expect(page).toHaveURL(/#loop$/);
 expect(errors).toEqual([]);expect(external).toEqual([]);
});
test('diagnosis locks the physical result, finishes falling and restores the score',async({page})=>{
 await page.clock.install();
 await page.goto('/#diagnosis');const f=frame(page);
 await expect(f.locator('#baselineResult')).toContainText('尚未测试');
 await f.locator('#play').click();await page.clock.runFor(5650);
 await expect(f.locator('#baselineResult')).toContainText('未通过 · 偏离跑道边界 · 24.2 / 40 m');
 const lockedDistance=await f.locator('#distance').textContent();
 await expect(f.locator('#play')).toHaveText('暂停');
 await page.clock.runFor(3300);
 await expect(f.locator('#motionState')).toHaveAttribute('data-state','fallen');
 await expect(f.locator('#distance')).toHaveText(lockedDistance);
 await expect(f.locator('#baselineResult')).toContainText('摔倒 1 次');
 await page.screenshot({path:`${evidence}/chapter1-desktop-initial.png`,fullPage:true});
 const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('robotcoach:v1')).chapter1BaselineRun);
 const first=await stored();
 await page.reload();
 await expect(f.locator('#baselineResult')).toHaveAttribute('data-outcome','failed');
 await f.locator('#play').click();await page.clock.runFor(9000);
 await expect(f.locator('#play')).toHaveText('重新试跑');
 expect(await stored()).toEqual(first);
});
test('discover all four sensors repeatedly, install by drag and tap, compare runs',async({page})=>{
 await page.clock.install();
 await page.goto('/#discovery');const f=frame(page);for(const name of ['发现视觉摄像头','发现激光雷达','发现姿态传感器','发现足底力觉传感器'])await f.getByRole('button',{name}).click();await expect(f.getByText('已认识 4 / 4 种感官')).toBeVisible();await f.getByRole('button',{name:'发现视觉摄像头'}).click();await expect(f.getByRole('status')).toContainText('视觉摄像头');
 await page.getByRole('button',{name:'下一页'}).click();const install=frame(page);
 await install.locator('[data-sensor="lidar"]').dragTo(install.locator('#dropzone'));
 await expect(install.locator('[data-sensor="lidar"]')).toHaveAttribute('aria-pressed','true');
 await install.locator('[data-sensor="imu"]').click();await install.locator('[data-sensor="force"]').click();
 await page.reload();await expect(frame(page).locator('[data-sensor="force"]')).toHaveAttribute('aria-pressed','true');
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
 expect(baseline.conditions).toEqual({scene:'curve',seed:2026,distance:40,target:6.4,controller:'motion-rule-v1'});
 expect(baseline.result).toMatchObject({success:false,offTrack:true,falls:1,sensors:{camera:true,lidar:false,imu:false,force:false}});
 expect(student.result).toMatchObject({success:true,distance:40,sensors});
 await trial.getByRole('button',{name:'我的配置'}).click();
 await expect(trial.locator('#studentResult')).toHaveAttribute('data-outcome','passed');
 await page.screenshot({path:`${evidence}/chapter1-desktop-comparison.png`,fullPage:true});
 await page.reload();
 await expect(trial.locator('#studentResult')).toHaveAttribute('data-outcome','passed');
 // Page 1 uses the initial camera-only snapshot after the student has installed all four modules.
 await page.getByRole('button',{name:'一 · 感知与选拔'}).click();
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
 await page.goto('/#manual');const f=frame(page);const greenTop=()=>f.locator('#game').evaluate(c=>{const {data}=c.getContext('2d').getImageData(40,0,100,235);for(let y=0;y<235;y++)for(let x=0;x<100;x++){const i=(y*100+x)*4;if(data[i]<50&&data[i+1]>180&&data[i+2]<80)return y;}return 235;});const standing=await greenTop();await f.getByRole('button',{name:'开始',exact:true}).click();await f.locator('#game').press('ArrowUp');await expect.poll(greenTop).toBeLessThan(standing-10);await expect.poll(()=>page.frames().find(x=>x.url().includes('runner')).evaluate(()=>document.getElementById('score').textContent)).not.toBe('0');await f.getByRole('button',{name:'暂停',exact:true}).click();
 await f.getByRole('button',{name:'继续',exact:true}).click();await f.getByRole('button',{name:'↓ 下蹲'}).click();await expect(f.getByRole('button',{name:'↓ 下蹲'})).toHaveAttribute('aria-pressed','true');await f.getByRole('button',{name:'↑ 跳跃'}).click();await f.getByRole('button',{name:'重试本轮'}).click();await expect(f.getByRole('status').last()).toContainText('正在跑');await expect(f.getByRole('status').last()).toContainText('本轮',{timeout:20000});
 await page.reload();await expect(frame(page).getByRole('status').last()).toContainText('本机最高');
});
test('real browser training updates Q, survives refresh, freezes showcase, resets',async({page})=>{
 await page.goto('/#training');const f=frame(page);await f.getByRole('button',{name:'开始',exact:true}).click();await f.getByLabel('训练速度').selectOption('32');
 await expect.poll(()=>f.locator('#attempts').textContent(),{timeout:20000}).not.toBe('0');await expect.poll(()=>f.locator('#updates').textContent()).not.toBe('0');
 await expect.poll(async()=>Number(await f.locator('#attempts').textContent()),{timeout:25000}).toBeGreaterThan(12);
 await f.getByRole('button',{name:'暂停',exact:true}).click();const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('robotcoach:q:v1')));expect(saved.updates).toBeGreaterThan(0);expect(Object.values(saved.q).some(r=>r.some(x=>x!==0))).toBe(true);
 await writeFile(`${evidence}/browser-training.json`,JSON.stringify(saved,null,2));await page.screenshot({path:`${evidence}/q-training.png`,fullPage:true});
 await page.reload();await expect(frame(page).locator('#updates')).toHaveText(String(saved.updates));
 await page.getByRole('button',{name:'下一页'}).click();await frame(page).getByRole('button',{name:'开始',exact:true}).click();await page.waitForTimeout(2500);await frame(page).getByRole('button',{name:'暂停',exact:true}).click();const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('robotcoach:q:v1')));expect(after).toEqual(saved);
 await page.getByRole('button',{name:'上一页'}).click();await frame(page).getByRole('button',{name:'重置训练'}).click();await expect(frame(page).locator('#updates')).toHaveText('0');await expect(frame(page).locator('#attempts')).toHaveText('0');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('robotcoach:q:v1')).q)).toEqual({});
});
test('imitation shows changed environment limitation and labels teaching replay',async({page})=>{
 await page.goto('/#imitation');const f=frame(page);await expect(f.getByText('没有训练独立的行为克隆模型',{exact:false})).toBeVisible();await f.getByRole('button',{name:'改变障碍位置'}).click();await f.getByRole('button',{name:'观看模仿演示'}).click();await expect(f.getByRole('status')).toContainText('模仿者撞上地面障碍',{timeout:15000});
});
for(const mobile of [false,true])test(`${mobile?'mobile':'desktop'} loop drag/tap assembly, feedback connection, restore`,async({page})=>{
 if(mobile)await page.setViewportSize({width:390,height:844});await page.goto('/#loop');const f=frame(page);
 if(mobile){for(const type of ['sense','decision','action']){await f.locator(`[data-module="${type}"]`).click();await f.locator(`[data-target="${type}"]`).click();}}
 else for(const type of ['sense','decision','action'])await f.locator(`[data-module="${type}"]`).dragTo(f.locator(`[data-target="${type}"]`));
 await f.getByRole('button',{name:'运行',exact:true}).click();await expect(f.getByRole('status')).toContainText('一次行动结束',{timeout:12000});await f.locator('.node.action').click();await f.locator('.node.sense').click();await expect(f.getByRole('status')).toContainText('行动已连接回感知');await f.getByRole('button',{name:'运行闭环'}).click();await expect(f.getByRole('status')).toContainText('闭环已循环');await f.getByRole('button',{name:'暂停',exact:true}).click();await page.reload();await expect(frame(page).getByRole('button',{name:'运行闭环'})).toBeEnabled();await page.screenshot({path:`${evidence}/${mobile?'mobile':'desktop'}-loop.png`,fullPage:true});
});
test('every disabled node and feedback break produces its corresponding playable video',async({page})=>{
 await page.goto('/#fault');const f=frame(page);for(const [key,name,text] of [['sense','感知','感知关闭'],['decision','决策','决策关闭'],['action','行动','行动关闭'],['loop','反馈回路','反馈回路断开']]){
  await f.getByRole('button',{name:'关闭'+name,exact:true}).click();await f.getByRole('button',{name:'运 行'}).click();await expect(f.getByRole('status')).toContainText(text,{timeout:15000});
  const video=f.locator('#video');await expect(video).toBeVisible();await video.evaluate(v=>v.play());await expect.poll(()=>video.evaluate(v=>v.currentTime)).toBeGreaterThan(.1);await f.getByRole('button',{name:'恢复'+name,exact:true}).click();
 }
 await f.getByRole('button',{name:'运 行'}).click();await expect(f.getByRole('status')).toContainText('闭环连续运行两圈',{timeout:18000});
});
test('graphical design restores five selections and ends with concise summary',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/#design');const f=frame(page);await f.locator('#designActivity > summary').click();for(const name of ['公园','巡检避障','激光雷达','自主试错','异常停车'])await f.getByRole('button',{name,exact:true}).click();await expect(f.locator('#result')).toContainText('在公园中巡检避障');await expect(f.locator('#result')).toContainText('异常停车');await page.reload();await frame(page).locator('#designActivity > summary').click();await expect(frame(page).getByRole('button',{name:'公园',exact:true})).toHaveAttribute('aria-pressed','true');await page.screenshot({path:`${evidence}/mobile-design.png`,fullPage:true});
});
test('leaving training destroys the frame and stops updates; hidden document pauses',async({page})=>{
 await page.goto('/#training');const f=frame(page);await f.getByRole('button',{name:'开始',exact:true}).click();await expect.poll(async()=>Number(await f.locator('#updates').textContent())).toBeGreaterThan(1);await page.evaluate(()=>document.getElementById('experiment').contentWindow.postMessage({type:'robotcoach:visibility',hidden:true},location.origin));await expect(f.getByRole('button',{name:'继续',exact:true})).toBeVisible();const paused=await f.locator('#updates').textContent();await page.waitForTimeout(300);await expect(f.locator('#updates')).toHaveText(paused);await f.getByRole('button',{name:'继续',exact:true}).click();await page.getByRole('button',{name:'三 · AI闭环'}).click();const before=await page.evaluate(()=>localStorage.getItem('robotcoach:q:v1'));await page.waitForTimeout(800);expect(await page.evaluate(()=>localStorage.getItem('robotcoach:q:v1'))).toBe(before);expect(page.frames().filter(f=>f.url().includes('runner.html'))).toHaveLength(0);
});
test('iframe changes survive parent navigation without an intervening refresh',async({page})=>{
 await page.goto('/#discovery');await frame(page).getByRole('button',{name:'发现激光雷达'}).click();await page.getByRole('button',{name:'下一页'}).click();for(const type of ['lidar','imu','force'])await frame(page).locator(`[data-sensor="${type}"]`).click();await page.getByRole('button',{name:'下一页'}).click();await expect(frame(page).locator('#installed')).toContainText('激光测距、姿态传感器 IMU、足底力觉');await page.reload();await expect(frame(page).locator('#installed')).toContainText('激光测距');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('robotcoach:v1')).discovered)).toContain('lidar');
});
test('phone touch controls operate sensors, jump, assembly and node switches',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});const page=await context.newPage();await page.goto(baseURL+'/#workshop');await frame(page).locator('[data-sensor="imu"]').tap();await expect(frame(page).locator('[data-sensor="imu"]')).toHaveAttribute('aria-pressed','true');await page.goto(baseURL+'/#manual');await frame(page).getByRole('button',{name:'开始',exact:true}).tap();await frame(page).getByRole('button',{name:'↑ 跳跃'}).tap();await frame(page).getByRole('button',{name:'↓ 下蹲'}).tap();await expect(frame(page).getByRole('button',{name:'↓ 下蹲'})).toHaveAttribute('aria-pressed','true');await page.getByRole('button',{name:'三 · AI闭环'}).tap();for(const type of ['sense','decision','action']){await frame(page).locator(`[data-module="${type}"]`).tap();await frame(page).locator(`[data-target="${type}"]`).tap();}await expect(frame(page).getByRole('button',{name:'运行',exact:true})).toBeEnabled();await page.getByRole('button',{name:'下一页'}).tap();await frame(page).getByRole('button',{name:'关闭感知',exact:true}).tap();await expect(frame(page).getByRole('button',{name:'恢复感知',exact:true})).toBeVisible();await context.close();
});
