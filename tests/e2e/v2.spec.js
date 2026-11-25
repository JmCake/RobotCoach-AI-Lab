import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const frame=p=>p.frameLocator('#experiment'),key='robotcoach:challenge:v2';
const saved=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
const errors=new WeakMap();
test.beforeEach(async({page})=>{const list=[];errors.set(page,list);page.on('pageerror',e=>list.push(e.message));page.on('console',m=>{if(m.type()==='error')list.push(m.text());});});
test.afterEach(async({page})=>expect(errors.get(page)).toEqual([]));
async function allSensors(f){for(const id of ['camera','lidar','imu','force']){const b=f.locator(`[data-challenge-sensor="${id}"]`);if(await b.getAttribute('aria-pressed')!=='true')await b.click();}}

test('real clone and Q training persist, frozen paired scores and export contain actual records',async({page})=>{
 await page.goto('/?lab=v2#design');await expect(page).toHaveTitle(/V2.0/);await expect(page.getByRole('heading',{level:1})).toContainText('综合挑战');const f=frame(page);await allSensors(f);
 await f.locator('#policy').selectOption('clone');await f.locator('#challengeRun').click();await expect(f.locator('#challengeFeedback')).toContainText('尚未训练');
 await f.locator('#cloneTrain').click();await expect(f.locator('#challengeFeedback')).toContainText('行为克隆已训练');
 let data=await saved(page);expect(data.records.length).toBeGreaterThan(1000);expect(data.clone.samples).toBeGreaterThan(1000);expect(data.clone.tree).toBeTruthy();expect(data.q.updates).toBe(0);
 await f.locator('#qTrain').click();await expect(f.locator('#challengeFeedback')).toContainText('自主试错完成');
 data=await saved(page);expect(data.q.updates).toBe(100000);expect(data.q.audit.length).toBe(12);expect(data.q.attempts).toBeGreaterThan(100);const snapshot=JSON.stringify(data.q),clone=JSON.stringify(data.clone);
 await f.locator('#challengeCompare').click();await expect(f.locator('#challengeFeedback')).toContainText('固定条件比较完成');await expect(f.locator('#challengeRows tr')).toHaveCount(3);
 data=await saved(page);expect(JSON.stringify(data.q)).toBe(snapshot);expect(JSON.stringify(data.clone)).toBe(clone);expect(data.results.map(r=>r.seeds)).toEqual(Array(3).fill(Array.from({length:20},(_,i)=>9001+i)));expect(data.results[0].runs).toHaveLength(20);
 await page.reload();await expect(frame(page).locator('#qStats')).toContainText('100000');await expect(frame(page).locator('#challengeRows tr')).toHaveCount(3);
 const download=page.waitForEvent('download');await frame(page).locator('#challengeExport').click();expect((await download).suggestedFilename()).toBe('robotcoach-v2-experiment.json');
 const directory=process.env.EVIDENCE_DIR||join(tmpdir(),'robotcoach-v2');await mkdir(directory,{recursive:true});await page.screenshot({path:join(directory,'v2-desktop.png'),fullPage:true});
 await frame(page).getByText('训练记录与实验边界',{exact:true}).click();await frame(page).locator('#challengeReset').click();data=await saved(page);expect(data.q.q).toEqual({});expect(data.clone.tree).toBeNull();expect(data.records).toEqual([]);expect(data.results).toEqual([]);
});

test('all sensors off produces an actual collision and repeating a seed reproduces its score',async({page})=>{
 await page.goto('/?lab=v2#design');const f=frame(page);await f.locator('[data-challenge-sensor="camera"]').click();await f.locator('#environment').selectOption('night');
 await f.locator('#challengeRun').click();await expect(f.locator('#challengeFeedback')).toContainText('当前策略未更新',{timeout:15000});const before=(await saved(page)).lastRun;expect(before.success).toBe(false);expect(before.ticks).toBeLessThan(1800);await expect(f.locator('#sensorReadout')).toContainText('IMU 关闭');
 await f.locator('#challengeRun').click();await expect(f.locator('#challengeFeedback')).toContainText('当前策略未更新',{timeout:15000});expect((await saved(page)).lastRun).toEqual(before);
 await f.locator('#challengeSeed').fill('0');await f.locator('#challengeRun').click();await expect(f.locator('#challengeFeedback')).toContainText('整数');
});

test('a paused hurdle challenge resumes from the same frame and matches an uninterrupted run',async({page})=>{
 await page.clock.install();
 await page.goto('/?lab=v2#design');
 const f=frame(page),score=f.locator('#challengeScore');
 await f.locator('[data-challenge-sensor="camera"]').click();
 await f.getByRole('button',{name:'运行挑战'}).click();
 await page.clock.runFor(1400);
 await f.getByRole('button',{name:'暂停',exact:true}).click();
 const pausedScore=await score.innerText();
 expect(pausedScore).not.toBe('跨过 0 个 · 0%');
 const picture=()=>f.locator('#challengeCanvas').evaluate(c=>c.toDataURL());
 const pausedFrame=await picture();
 await page.clock.runFor(4000);
 expect(await picture()).toBe(pausedFrame);
 await expect(score).toHaveText(pausedScore);
 await f.getByRole('button',{name:'继续挑战'}).click();
 await page.clock.runFor(2000);
 await expect(f.locator('#challengeFeedback')).toContainText('撞上地面障碍');
 const resumed=(await saved(page)).lastRun;
 expect(resumed.success).toBe(false);
 await f.getByRole('button',{name:'运行挑战'}).click();
 await page.clock.runFor(3300);
 await expect(f.locator('#challengeFeedback')).toContainText('撞上地面障碍');
 expect((await saved(page)).lastRun).toEqual(resumed);
});

test('a hidden challenge can resume, restart, or switch to new track settings',async({page})=>{
 await page.goto('/?lab=v2#design');
 const f=frame(page),score=f.locator('#challengeScore');
 await f.locator('#challengeRun').click();
 await expect(score).not.toHaveText('跨过 0 个 · 0%');
 await f.locator('body').evaluate(()=>document.dispatchEvent(new CustomEvent('coursevisibility',{detail:true})));
 await expect(f.getByRole('button',{name:'继续挑战'})).toBeEnabled();
 await f.getByRole('button',{name:'从头重跑'}).click();
 await expect(score).toHaveText('跨过 0 个 · 0%');
 await f.getByRole('button',{name:'暂停',exact:true}).click();
 await f.locator('#environment').selectOption('wet');
 await expect(f.locator('#challengeStop')).toBeDisabled();
 await expect(score).toHaveText('跨过 0 个 · 0%');
 await expect(f.getByRole('button',{name:'运行挑战'})).toBeEnabled();
 await expect(f.locator('#challengeFeedback')).toContainText('设置已更改');
});

test('navigation and hiding synchronously stop V2 training, preserve updates, and keep V1 data',async({page})=>{
 await page.addInitScript(()=>{if(window!==window.top){const request=window.requestAnimationFrame;window.requestAnimationFrame=cb=>request.call(window,now=>setTimeout(()=>cb(now),80));}});
 await page.goto('/?lab=v2#design');await page.evaluate(()=>localStorage.setItem('robotcoach:q:v1',JSON.stringify({q:{legacy:[1,2,3]},updates:7})));
 const f=frame(page);await allSensors(f);await f.locator('#qTrain').click();await expect.poll(async()=>Number((await f.locator('#qStats').textContent()).match(/更新 (\d+)/)[1])).toBeGreaterThan(0);
 await page.locator('#openContents').click();await page.locator('#lessonList a[href="#diagnosis"]').click();const before=await saved(page);expect(before.q.updates).toBeGreaterThan(0);await page.waitForTimeout(300);expect(await saved(page)).toEqual(before);
 await page.goto('/?lab=v2#design');await expect(frame(page).locator('#qStats')).toContainText(String(before.q.updates));expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('robotcoach:q:v1')).updates)).toBe(7);
 await frame(page).locator('#qTrain').click();await page.evaluate(()=>document.getElementById('experiment').contentDocument.dispatchEvent(new CustomEvent('coursevisibility',{detail:true})));await expect(frame(page).locator('#challengeFeedback')).toContainText('暂停');const hidden=await saved(page);await page.waitForTimeout(250);expect(await saved(page)).toEqual(hidden);
 await frame(page).locator('#qTrain').click();await frame(page).locator('#designActivity > summary').click();await expect(frame(page).locator('#challenge')).toBeHidden();const designed=await saved(page);await page.waitForTimeout(250);expect(await saved(page)).toEqual(designed);await frame(page).locator('#designActivity > summary').click();await expect(frame(page).locator('#challengeFeedback')).toContainText('暂停');
});

test('another tab reset cannot be overwritten by a paused V2 experiment',async({page,context})=>{
 await page.goto('/?lab=v2#design');await frame(page).locator('#qTrain').click();await expect(frame(page).locator('#challengeFeedback')).toContainText('自主试错完成');
 const other=await context.newPage();await other.goto('/?lab=v2#design');await frame(other).getByText('训练记录与实验边界',{exact:true}).click();await frame(other).locator('#challengeReset').click();
 await expect(frame(page).locator('#qStats')).toContainText('更新 0');await expect(frame(page).locator('#challengeFeedback')).toContainText('另一标签页');await frame(page).locator('#challengeRun').click();await frame(page).locator('#challengeStop').click();expect((await saved(page)).q.updates).toBe(0);
});

test('corrupt V2 saved models and results recover into an operable experiment',async({page})=>{
 await page.goto('/?lab=v2#design');await page.evaluate(k=>localStorage.setItem(k,JSON.stringify({version:1,q:null,clone:{tree:{feature:0,left:{}}},results:[null,{}]})),key);await page.reload();await expect(frame(page).locator('#qStats')).toContainText('更新 0');await frame(page).locator('#challengeCompare').click();await expect(frame(page).locator('#challengeRows tr')).toHaveCount(3);
});

test('320px touch challenge controls, model training and retained design remain usable',async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL,viewport:{width:320,height:740},isMobile:true,hasTouch:true});const page=await context.newPage();const list=[];page.on('pageerror',e=>list.push(e.message));
 await page.goto('/?lab=v2#design');const f=frame(page);await f.locator('[data-challenge-sensor="lidar"]').tap();await expect(f.locator('[data-challenge-sensor="lidar"]')).toHaveAttribute('aria-pressed','true');await f.locator('#environment').selectOption('night');await f.locator('#cloneTrain').tap();await expect(f.locator('#challengeFeedback')).toContainText('行为克隆已训练');await f.locator('#policy').selectOption('clone');await f.locator('#challengeRun').tap();await expect(f.locator('#sensorReadout')).toContainText('测距');await f.locator('#challengeStop').tap();
 await f.locator('#challengeCompare').tap();await expect(f.locator('#challengeRows tr')).toHaveCount(3);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect(await f.locator('body').evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 const directory=process.env.EVIDENCE_DIR||join(tmpdir(),'robotcoach-v2');await mkdir(directory,{recursive:true});await page.screenshot({path:join(directory,'v2-mobile.png'),fullPage:true});
 await f.locator('#designActivity > summary').tap();await f.getByRole('button',{name:'工厂',exact:true}).tap();await expect(f.locator('#result')).toContainText('在工厂');expect(list).toEqual([]);await context.close();
});
