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
});
test.afterEach(async({page})=>expect(page._motionErrors).toEqual([]));

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
  const on=await snapshot(page);expect(on.falls).toBe(0);expect(on.passed).toBeGreaterThan(5);expect(on.x).toBeGreaterThan(off.x);
  await page.screenshot({path:join(evidence,'motion-night.png'),fullPage:true});
  await page.locator('[data-scene=obstacles]').click();await page.locator('#play').click();await page.clock.runFor(3000);expect((await snapshot(page)).observation.jumpHeight).toBeGreaterThan(0);
  await page.clock.runFor(1600);expect((await snapshot(page)).control.duck).toBe(true);
  await page.clock.runFor(300);await page.screenshot({path:join(evidence,'motion-crouch.png'),fullPage:true});
});

test('mobile touch, narrow screens, slow playback, seeded reset and hiding pause',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.clock.install();await p.goto('/demo-motion.html');await p.clock.pauseAt(new Date(Date.now()+1000));
  await p.locator('[data-scene=rough]').tap();await p.locator('#slow').tap();await p.locator('#play').tap();await p.clock.runFor(6000);
  let a=await snapshot(p);expect(a.time).toBeGreaterThan(1.9);expect(a.time).toBeLessThan(2.3);expect(a.falls).toBe(0);
  await p.locator('#play').tap();await p.screenshot({path:join(evidence,'motion-mobile.png'),fullPage:true});
  expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await p.setViewportSize({width:320,height:740});expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await p.locator('summary').tap();await p.locator('#seed').fill('17');await p.locator('#seed').dispatchEvent('change');expect((await snapshot(p)).seed).toBe(17);expect((await snapshot(p)).x).toBe(0);
  await p.locator('#play').tap();await p.clock.runFor(1000);
  await p.evaluate(()=>window.dispatchEvent(new Event('pagehide')));expect((await snapshot(p)).running).toBe(false);
  expect(errors).toEqual([]);await context.close();
});
