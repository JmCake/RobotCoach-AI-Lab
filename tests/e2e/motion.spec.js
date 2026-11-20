import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const snapshot=p=>p.evaluate(()=>window.motionDemo.snapshot());
const evidence=process.env.EVIDENCE_DIR||join(tmpdir(),'robotcoach-motion');
test.beforeAll(async()=>{await mkdir(evidence,{recursive:true});});
test.beforeEach(async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page._motionErrors=errors;
  await page.clock.install({time:new Date('2026-11-19T00:00:00Z')});await page.goto('/demo-motion.html');
  await page.clock.pauseAt(new Date('2026-11-19T00:00:02Z'));
  // Existing animation regression keeps its original speed; new course tests use the new defaults.
  await page.locator('#assist').check();await page.locator('#target').evaluate(el=>{el.value='5.6';el.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.locator('#repeat').evaluate(el=>{el.checked=true;el.dispatchEvent(new Event('change',{bubbles:true}));});
});
test.afterEach(async({page})=>expect(page._motionErrors).toEqual([]));

test('book page four opens curve practice with sensor choices and returns to the book',async({page})=>{
 await page.goto('/index.html#workshop');
 const book=page.frameLocator('#experiment');
 await book.locator('[data-sensor=camera]').click();
 await book.locator('[data-sensor=imu]').click();
 await page.getByRole('button',{name:'下一页'}).click();
 await book.locator('#motionLink').click();
 await expect(page).toHaveURL(/demo-motion\.html\?from=book/);
 const trial=await snapshot(page);
 expect(trial.scene).toBe('curve');
 expect(trial.sensors.camera).toBe(false);
 expect(trial.sensors.imu).toBe(true);
 await page.locator('#sensor-camera').check();
 await page.locator('#backToBook').click();
 await expect(page).toHaveURL(/index\.html#trial$/);
 await expect(page.frameLocator('#experiment').locator('#installed')).toHaveText('本次使用：摄像头、姿态传感器 IMU');
});



test('an invalid seed cannot change the selected track or its title before the world resets',async({page})=>{
  await page.reload();
  await page.locator('details').last().locator('summary').click();
  await page.locator('#seed').fill('-1');await page.locator('#seed').press('Tab');
  await page.locator('[data-scene=night]').focus();await page.locator('[data-scene=night]').press('Enter');
  expect((await snapshot(page)).scene).toBe('straight');
  await expect(page.locator('#sceneName')).toHaveText('正常直道');
  await expect(page.locator('[data-scene=straight]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.stage')).not.toHaveClass(/night/);
  await page.locator('#seed').fill('2026');await page.locator('#seed').press('Tab');
  await page.locator('[data-scene=night]').focus();await page.locator('[data-scene=night]').press('Enter');
  expect((await snapshot(page)).scene).toBe('night');
  await expect(page.locator('#sceneName')).toHaveText('弱光跑道');
});

test('rain with vision and foot feedback still needs IMU after slowing down',async({page})=>{
  await page.setViewportSize({width:1280,height:1000});await page.reload();await page.locator('[data-scene=wet]').click();
  for(const key of ['camera','force'])await page.locator(`#sensor-${key}`).check();
  await page.locator('#play').click();await page.clock.runFor(4000);const off=await snapshot(page);
  expect(off.control.target).toBeLessThan(3);expect(off.speed).toBeLessThan(3);expect(off.observation.contact.slip).toBeGreaterThan(.15);expect(off.control.torque).toBe(0);
  await page.clock.runFor(5000);let s=await snapshot(page);expect(s.falls).toBe(1);expect(s.result.success).toBe(false);
  await expect(page.locator('#fallMessage')).toContainText('我感觉脚底在滑');await expect(page.locator('#resultTitle')).toContainText('本轮失败');
  await page.locator('.stage').screenshot({path:join(evidence,'motion-rain-imu-off.png')});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:join(evidence,'motion-rain-imu-off-mobile.png'),fullPage:true});
  await page.locator('#sensor-imu').check();await page.locator('#play').click();await page.clock.runFor(4000);s=await snapshot(page);
  expect(s.speed).toBeCloseTo(off.speed,2);expect(s.observation.contact.slip).toBeCloseTo(off.observation.contact.slip,2);expect(Math.abs(s.theta)).toBeLessThan(Math.abs(off.theta));
  await page.clock.runFor(14000);s=await snapshot(page);expect(s.result.success).toBe(true);expect(s.result.falls).toBe(0);
  await expect(page.locator('#resultTitle')).toContainText('成功过线');await page.screenshot({path:join(evidence,'motion-rain-imu-on-mobile.png'),fullPage:true});
});

test('night collision without IMU falls and locks failure; retry starts at zero and changing a passed setup clears its badge',async({page})=>{
  await page.setViewportSize({width:1280,height:1000});await page.reload();await page.locator('[data-scene=night]').click();
  await page.locator('#sensor-camera').check();await page.locator('#sensor-force').check();
  await expect(page.locator('#repeat')).not.toBeChecked();await page.locator('#play').click();await page.clock.runFor(7000);
  const failed=await snapshot(page);expect(failed.collisions).toBeGreaterThan(0);expect(failed.falls).toBeGreaterThan(0);
  expect(failed.result.success).toBe(false);expect(failed.running).toBe(false);expect(failed.attempt).toBe(1);expect(failed.finishX).toBe(40);
  await expect(page.locator('#resultTitle')).toContainText('本轮失败');await expect(page.locator('#resultDetail')).toContainText('碰撞 1 次');
  await expect(page.locator('#nextScene')).toBeHidden();await expect(page.locator('#fallMessage')).toContainText('太暗');
  await page.screenshot({path:join(evidence,'motion-night-collision-failed.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:join(evidence,'motion-night-collision-failed-mobile.png'),fullPage:true});
  await page.clock.runFor(30000);expect((await snapshot(page)).time).toBe(failed.time);expect((await snapshot(page)).result.success).toBe(false);
  await page.locator('#sensor-lidar').check();await page.locator('#sensor-imu').check();expect((await snapshot(page)).result.success).toBe(false);
  await page.locator('#play').click();let s=await snapshot(page);expect(s.x).toBe(0);expect(s.result).toBeNull();expect(s.collisions).toBe(0);expect(s.finishX).toBe(40);
  expect(s.attempt).toBe(2);expect(s.previousResult.success).toBe(false);expect(s.previousResult.collisions).toBe(1);expect(s.totalCollisions).toBe(1);
  await page.clock.runFor(8000);s=await snapshot(page);expect(s.result.success).toBe(true);expect(s.result.collisions).toBe(0);expect(s.result.falls).toBe(0);expect(s.falls).toBe(1);
  await page.locator('#sensor-imu').uncheck();expect((await snapshot(page)).result).toBeNull();await expect(page.locator('#finishNotice')).toBeHidden();
});

test('hurdle without IMU clears first, then falls on landing; identical impact with IMU finishes',async({page})=>{
  await page.setViewportSize({width:1280,height:1000});await page.reload();await page.locator('[data-scene=obstacles]').click();await page.locator('#sensor-camera').check();
  await page.locator('#play').click();await page.clock.runFor(3400);
  const off=await snapshot(page);expect(off.passed).toBeGreaterThan(0);expect(off.landings).toBe(1);expect(off.falls).toBe(0);expect(off.lastLanding.cleared).toBe(true);
  await page.clock.runFor(1200);let s=await snapshot(page);expect(s.falls).toBe(1);expect(s.result.success).toBe(false);
  await expect(page.locator('#fallMessage')).toContainText('我跳过去了');await expect(page.locator('#resultTitle')).toContainText('本轮失败');
  await page.locator('.stage').screenshot({path:join(evidence,'motion-obstacle-imu-off.png')});
  await page.setViewportSize({width:390,height:844});await page.locator('.stage').screenshot({path:join(evidence,'motion-obstacle-imu-off-mobile.png')});
  await page.setViewportSize({width:1280,height:1000});await page.locator('#reset').click();await page.locator('#sensor-imu').check();await page.locator('#play').click();await page.clock.runFor(3400);
  s=await snapshot(page);expect(s.lastLanding.impulse).toBe(off.lastLanding.impulse);expect(Math.abs(s.theta)).toBeLessThan(Math.abs(off.theta));
  await page.clock.runFor(4400);s=await snapshot(page);expect(s.result.success).toBe(true);expect(s.falls).toBe(0);expect(s.result.collisions).toBe(0);
  await page.locator('.stage').screenshot({path:join(evidence,'motion-obstacle-imu-on.png')});
});

test('beginner starts without sensors at 6.4 m/s, crosses a real finish and moves to the next lesson',async({page})=>{
  await page.setViewportSize({width:1280,height:1050});await page.reload();
  expect(Object.values((await snapshot(page)).sensors).some(Boolean)).toBe(false);
  await expect(page.locator('#target')).toHaveValue('6.4');
  expect(await page.locator('[data-scene]').evaluateAll(bs=>bs.map(b=>b.dataset.scene))).toEqual(['straight','obstacles','night','curve','rough','wet']);
  await page.locator('#play').click();await page.clock.runFor(6500);expect((await snapshot(page)).result).toBeNull();await expect(page.locator('#finishNotice')).toBeHidden();
  await page.clock.runFor(1300);const s=await snapshot(page);expect(s.result.success).toBe(true);expect(s.x).toBeGreaterThanOrEqual(40);
  await expect(page.locator('#resultTitle')).toContainText('成功过线');await expect(page.locator('#fallMessage')).toContainText('终点');
  await expect(page.locator('#distance')).toHaveText('40.0 / 40 m');
  await page.locator('.stage').screenshot({path:join(evidence,'motion-finish.png')});
  await page.clock.runFor(4000);expect((await snapshot(page)).running).toBe(false);await expect(page.locator('#play')).toHaveText('再跑一次');
  await page.locator('#nextScene').click();expect((await snapshot(page)).scene).toBe('obstacles');expect((await snapshot(page)).result).toBeNull();
  await expect(page.locator('#finishNotice')).toBeHidden();
  await page.locator('[data-scene=curve]').click();for(const key of ['camera','imu'])await page.locator(`#sensor-${key}`).check();
  await page.locator('#play').click();await page.clock.runFor(8700);expect((await snapshot(page)).result.success).toBe(true);
  await page.locator('.stage').screenshot({path:join(evidence,'motion-curve-finish.png')});
});

test('rough ground visibly needs landing feedback at the default pace and the recommended modules finish',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.reload();await page.locator('[data-scene=rough]').click();
  for(const key of ['camera','imu'])await page.locator(`#sensor-${key}`).check();
  await page.locator('#play').click();await page.clock.runFor(4500);
  let s=await snapshot(page);expect(s.falls).toBeGreaterThan(0);expect(s.result.success).toBe(false);await expect(page.locator('#fallMessage')).toContainText('落点');
  await page.locator('#reset').click();await page.locator('#sensor-force').check();await page.locator('#play').click();await page.clock.runFor(16000);
  s=await snapshot(page);expect(s.result.success).toBe(true);expect(s.falls).toBe(0);
  await expect(page.locator('#resultTitle')).toContainText('成功过线');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:join(evidence,'motion-finish-mobile.png'),fullPage:true});
});

test('fall speech follows the cause, stays readable, freezes at the event and resets',async({page})=>{
  await page.setViewportSize({width:1280,height:1000});await expect(page.locator('#robotSpeech')).toBeHidden();
  await page.locator('[data-scene=wet]').click();await page.locator('#assist').uncheck();await page.locator('#play').click();await page.clock.runFor(6100);
  await expect(page.locator('#robotSpeech')).toBeVisible();await expect(page.locator('#fallMessage')).toContainText('脚底');
  const text=await page.locator('#fallMessage').innerText();expect(text).not.toMatch(/摄像头|IMU|模块|开启/);
  await page.locator('#assist').check();await expect(page.locator('#fallMessage')).toHaveText(text);
  await page.screenshot({path:join(evidence,'motion-fall-clue.png'),fullPage:true});
  await page.locator('#reset').click();await expect(page.locator('#robotSpeech')).toBeHidden();expect((await snapshot(page)).fallFeedback).toBeNull();
  await page.setViewportSize({width:390,height:844});await page.locator('[data-scene=night]').click();
  for(const key of ['lidar','imu','force'])await page.locator(`#sensor-${key}`).uncheck();
  await page.locator('#play').click();await page.clock.runFor(4800);await expect(page.locator('#fallMessage')).toContainText('太暗');
  const bubble=await page.locator('#robotSpeech').boundingBox(),stage=await page.locator('.stage').boundingBox();
  expect(bubble.x).toBeGreaterThanOrEqual(stage.x);expect(bubble.x+bubble.width).toBeLessThanOrEqual(stage.x+stage.width);
  expect(bubble.y).toBeGreaterThan(stage.y+50);expect(bubble.y+bubble.height).toBeLessThan(stage.y+stage.height);
  await page.screenshot({path:join(evidence,'motion-fall-clue-mobile.png'),fullPage:true});
});

test('optional narration uses local Chinese voices once per fall and stops on pause',async({page})=>{
  await page.addInitScript(()=>{
    window.narrated=[];window.narrationSources=[];window.cancelCount=0;
    window.SpeechSynthesisUtterance=function(text){this.text=text;};
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[{lang:'zh-CN',localService:false},{lang:'en-US',localService:true},{lang:'zh-CN',localService:true}],addEventListener(){},speak(u){window.narrated.push(u.text);window.narrationSources.push(u.voice.localService&&/^zh/.test(u.voice.lang));},cancel(){window.cancelCount++;}}});
  });
  await page.reload();await page.locator('[data-scene=wet]').click();await page.locator('#assist').uncheck();await page.locator('#play').click();await page.clock.runFor(5300);
  await expect(page.locator('#voice')).toBeVisible();expect(await page.evaluate(()=>window.narrated)).toHaveLength(1);
  expect(await page.evaluate(()=>window.narrationSources)).toEqual([true]);
  await page.clock.runFor(500);expect(await page.evaluate(()=>window.narrated)).toHaveLength(1);
  const before=await page.evaluate(()=>window.cancelCount);await page.locator('#play').click();expect(await page.evaluate(()=>window.cancelCount)).toBeGreaterThan(before);
  expect((await snapshot(page)).running).toBe(false);
  await page.locator('#voice').click();await expect(page.locator('#voice')).toHaveText('语音提示：关');
});

test('four named sensor switches show purpose, live readings and independent control effects',async({page})=>{
  await page.setViewportSize({width:1440,height:1200});
  for(const [key,name] of Object.entries({camera:'摄像头',lidar:'激光测距',imu:'姿态传感器 IMU',force:'足底力觉'})){
    await expect(page.locator(`#sensor-${key}`)).toBeChecked();
    await expect(page.locator('.sensor').filter({has:page.locator(`#sensor-${key}`)})).toContainText(name);
    await page.locator(`#sensor-${key}`).uncheck();
    const s=await snapshot(page);expect(s.sensors[key]).toBe(false);expect(s.observation[key==='force'?'contact':key]).toBeNull();
    expect(Object.values(s.sensors).filter(Boolean)).toHaveLength(3);await expect(page.locator(`#reading-${key}`)).toContainText('已关闭');
    await expect(page.locator('#assistText')).toHaveText('已开启 3/4');
    await page.locator(`#sensor-${key}`).check();
  }
  await page.locator('[data-scene=wet]').click();await page.locator('#play').click();await page.clock.runFor(4000);
  expect((await snapshot(page)).control.target).toBeLessThan(3);await expect(page.locator('#reading-camera')).toContainText('湿滑');
  await page.locator('#sensor-imu').uncheck();expect((await snapshot(page)).control.torque).toBe(0);
  await page.locator('#reset').click();expect((await snapshot(page)).sensors.imu).toBe(false);
  await page.screenshot({path:join(evidence,'motion-sensors.png'),fullPage:true});
  await page.locator('#assist').check();expect(Object.values((await snapshot(page)).sensors).every(Boolean)).toBe(true);
  await page.locator('#assist').uncheck();expect(Object.values((await snapshot(page)).sensors).some(Boolean)).toBe(false);
});

test('desktop standalone page runs articulated gait, pauses, resets and switches all six scenes',async({page})=>{
  await page.setViewportSize({width:1440,height:1100});await expect(page).toHaveTitle('人形机器人 · 跑道运动 Demo');
  await expect(page.getByRole('heading',{level:1})).toContainText('跑得更稳');await expect(page.locator('vite-error-overlay')).toHaveCount(0);
  await expect(page.locator('[data-scene]')).toHaveCount(6);
  await page.locator('#play').click();await page.clock.runFor(4000);
  const a=await snapshot(page);expect(a.x).toBeGreaterThan(15);expect(a.falls).toBe(0);expect(a.phase).toBeGreaterThan(4);
  await page.locator('#play').click();const paused=await snapshot(page);await page.clock.runFor(2000);expect((await snapshot(page)).time).toBe(paused.time);
  await mkdir(evidence,{recursive:true});await page.screenshot({path:join(evidence,'motion-desktop.png'),fullPage:true});
  for(const scene of ['curve','wet','rough','obstacles','night','straight']){
    await page.locator(`[data-scene=${scene}]`).click();const s=await snapshot(page);expect(s.scene).toBe(scene);expect(s.x).toBe(0);expect(s.running).toBe(false);
    await page.locator('#play').click();await page.clock.runFor(1800);expect((await snapshot(page)).x).toBeGreaterThan(3);
    if(scene==='curve'){await page.clock.runFor(3000);await page.screenshot({path:join(evidence,'motion-curve.png'),fullPage:true});}
  }
  await page.locator('#reset').click();expect((await snapshot(page)).time).toBe(0);
});

test('same-seed wet control difference, continuous falling, held pose, recovery and repeat are visible',async({page})=>{
  await page.setViewportSize({width:1280,height:1000});await page.locator('[data-scene=wet]').click();await page.locator('#assist').uncheck();
  await page.locator('#play').click();await page.clock.runFor(5400);
  let s=await snapshot(page);expect(s.history.map(h=>h.state)).toEqual(expect.arrayContaining(['unbalanced','stumbling','falling']));
  await page.clock.runFor(900);expect((await snapshot(page)).state).toBe('fallen');
  await page.screenshot({path:join(evidence,'motion-fallen.png'),fullPage:true});
  await page.clock.runFor(1800);expect((await snapshot(page)).history.some(h=>h.state==='recovering')).toBe(true);
  await page.clock.runFor(14000);expect((await snapshot(page)).falls).toBeGreaterThan(1);
  await page.locator('#reset').click();await page.locator('#assist').check();await page.locator('#play').click();await page.clock.runFor(10000);
  s=await snapshot(page);expect(s.falls).toBe(0);expect(s.control.target).toBeLessThan(3);expect(s.observation.contact).not.toBeNull();
  await page.screenshot({path:join(evidence,'motion-assisted.png'),fullPage:true});
  await page.locator('#assist').uncheck();await page.clock.runFor(100);expect((await snapshot(page)).control.torque).toBe(0);
});

test('weak light causes actual collision without ranging; assisted hurdles jump and beams crouch',async({page})=>{
  await page.locator('[data-scene=night]').click();await page.locator('#assist').uncheck();await page.locator('#play').click();await page.clock.runFor(4800);
  const off=await snapshot(page);expect(off.falls).toBe(1);await expect(page.locator('#event')).toContainText('小腿');
  await page.locator('#reset').click();await page.locator('#assist').check();await page.locator('#play').click();await page.clock.runFor(15000);
  const on=await snapshot(page);expect(on.falls).toBe(0);expect(on.passed).toBeGreaterThan(2);expect(on.result.success).toBe(true);expect(on.x).toBeGreaterThan(off.x);
  await page.screenshot({path:join(evidence,'motion-night.png'),fullPage:true});
  await page.locator('[data-scene=obstacles]').click();await page.locator('#play').click();await page.clock.runFor(3000);expect((await snapshot(page)).observation.jumpHeight).toBeGreaterThan(0);
  await page.clock.runFor(1600);expect((await snapshot(page)).control.duck).toBe(true);
  await page.clock.runFor(300);await page.screenshot({path:join(evidence,'motion-crouch.png'),fullPage:true});
});

test('mobile touch, narrow screens, slow playback, seeded reset and hiding pause',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.clock.install();await p.goto('/demo-motion.html');await p.clock.pauseAt(new Date(Date.now()+1000));
  await p.locator('#assist').check();
  await p.locator('[data-scene=rough]').tap();await p.locator('#slow').tap();await p.locator('#play').tap();await p.clock.runFor(6000);
  let a=await snapshot(p);expect(a.time).toBeGreaterThan(1.9);expect(a.time).toBeLessThan(2.3);expect(a.falls).toBe(0);
  await p.locator('#play').tap();await p.screenshot({path:join(evidence,'motion-mobile.png'),fullPage:true});
  expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await p.setViewportSize({width:320,height:740});expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await p.getByText('实验条件与控制观测',{exact:true}).tap();await p.locator('#seed').fill('17');await p.locator('#seed').dispatchEvent('change');expect((await snapshot(p)).seed).toBe(17);expect((await snapshot(p)).x).toBe(0);
  await p.locator('#play').tap();await p.clock.runFor(1000);
  await p.evaluate(()=>window.dispatchEvent(new Event('pagehide')));expect((await snapshot(p)).running).toBe(false);
  expect(errors).toEqual([]);await context.close();
});
