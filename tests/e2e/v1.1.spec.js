import {test,expect} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const frame=page=>page.frameLocator('#experiment');
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('robotcoach:q:v1')));
const errors=new WeakMap();
test.beforeEach(async({page})=>{const list=[];errors.set(page,list);page.on('pageerror',e=>list.push(e.message));page.on('console',m=>{if(m.type()==='error')list.push(m.text());});});
test.afterEach(async({page})=>expect(errors.get(page)).toEqual([]));

test('paired browser test preserves Q, reports actual failures and survives reload',async({page})=>{
 await page.goto('/#training');const f=frame(page);
 await f.getByRole('button',{name:'开始',exact:true}).click();await f.getByLabel('训练速度').selectOption('32');
 await expect.poll(async()=>Number(await f.locator('#attempts').textContent())).toBeGreaterThan(15);
 await f.getByRole('button',{name:'暂停',exact:true}).click();const before=await saved(page);
 expect(before.audit).toHaveLength(12);expect(before.history.at(-1).rewards.collision).toBeLessThanOrEqual(0);
 await f.getByText('奖励规则与真实更新记录',{exact:true}).click();await expect(f.locator('#auditRows tr')).toHaveCount(12);await expect(f.locator('#rewardBreakdown')).toContainText('奖励构成');
 await f.getByRole('button',{name:'比较训练前后 · 各 20 轮'}).click();await expect(f.locator('#start')).toBeDisabled();
 await expect(f.locator('#comparisonTable')).toBeVisible();await expect(f.locator('#comparisonRows tr')).toHaveCount(2);
 const after=await saved(page);expect(after.q).toEqual(before.q);expect(after.updates).toEqual(before.updates);expect(after.history).toEqual(before.history);expect(after.audit).toEqual(before.audit);
 expect(after.comparison.before.seeds).toEqual(after.comparison.after.seeds);expect(after.comparison.after.runs).toHaveLength(20);expect(after.comparison.baselineUpdates).toBe(0);
 await page.reload();await expect(frame(page).locator('#comparisonTable')).toBeVisible();await expect(frame(page).locator('#updates')).toHaveText(String(before.updates));
});

test('untrained comparison honestly reports no improvement and showcase cannot write training',async({page})=>{
 await page.goto('/#showcase');const f=frame(page);const before=await saved(page);
 await f.locator('#compare').click();await expect(f.locator('#comparisonTable')).toBeVisible();await expect(f.locator('#comparisonStatus')).toContainText('未测到平均跨障碍提升');
 await expect(f.locator('#comparisonRows tr').last()).toContainText('0%');expect(await saved(page)).toEqual(before);
});

test('comparison cancels on request, reset and course hiding without stale results',async({page})=>{
 await page.goto('/#training');const f=frame(page);
 await f.locator('#compare').click();await f.locator('#cancelCompare').click();await expect(f.locator('#start')).toBeEnabled();await expect(f.locator('#comparisonStatus')).toContainText('已取消');
 await f.locator('#compare').click();await f.locator('#reset').click();await expect(f.locator('#comparisonTable')).toBeHidden();
 await page.waitForTimeout(250);const reset=await saved(page);expect(reset.q).toEqual({});expect(reset.baseline.q).toEqual({});expect(reset.audit).toEqual([]);expect(reset.comparison).toBeNull();
 await f.locator('#compare').click();await page.evaluate(()=>document.getElementById('experiment').contentWindow.postMessage({type:'robotcoach:visibility',hidden:true},location.origin));
 await expect(f.locator('#start')).toBeEnabled();await expect(f.locator('#cancelCompare')).toBeHidden();expect((await saved(page)).comparison).toBeNull();
});

test('V1.0 progress becomes an immutable actual baseline and retains old history',async({page})=>{
 await page.goto('/#training');
 const legacy={q:{'17,none,0,0,0,5':[.5,.2,.1]},attempts:9,updates:37,best:42,history:[{attempt:9,score:42,passed:1,reward:3.2,reason:'撞上地面障碍'}]};
 await page.evaluate(data=>localStorage.setItem('robotcoach:q:v1',JSON.stringify(data)),legacy);await page.reload();const f=frame(page);
 await expect(f.locator('#updates')).toHaveText('37');await f.locator('#start').click();await expect.poll(async()=>Number(await f.locator('#updates').textContent())).toBeGreaterThan(40);await f.locator('#start').click();
 const current=await saved(page);expect(current.baseline.q).toEqual(legacy.q);expect(current.baseline.updates).toBe(37);expect(current.history[0]).toEqual(legacy.history[0]);
 await page.reload();await expect(frame(page).locator('#comparisonStatus')).toContainText('37 次更新');
});

test('a reset in another training tab stops old updates from resurrecting a Q table',async({page,context})=>{
 await page.goto('/#training');await frame(page).locator('#start').click();await expect.poll(async()=>Number(await frame(page).locator('#updates').textContent())).toBeGreaterThan(3);
 const other=await context.newPage();await other.goto('/#training');await frame(other).locator('#reset').click();
 await expect(frame(page).locator('#updates')).toHaveText('0');await expect(frame(page).locator('#feedback')).toContainText('另一标签页');await expect(frame(page).locator('#start')).toHaveText('继续');
 await page.waitForTimeout(2200);expect((await saved(page)).q).toEqual({});expect((await saved(page)).updates).toBe(0);
});

test('phone native touch drag installs a sensor; cancelled drag and the next tap behave correctly',async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL,viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();
 await page.goto('/#workshop');const f=frame(page),sensor=f.locator('[data-sensor="lidar"]'),zone=f.locator('#dropzone');
 await sensor.scrollIntoViewIfNeeded();const a=await sensor.boundingBox(),b=await zone.boundingBox(),session=await context.newCDPSession(page);
 async function drag(x,y){await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:a.x+a.width/2,y:a.y+a.height/2,id:1}]});for(let i=1;i<=6;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:a.x+a.width/2+(x-a.x-a.width/2)*i/6,y:a.y+a.height/2+(y-a.y-a.height/2)*i/6,id:1}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 await drag(b.x+b.width/2,b.y+b.height/2);await expect(sensor).toHaveAttribute('aria-pressed','true');await page.reload();await expect(frame(page).locator('[data-sensor="lidar"]')).toHaveAttribute('aria-pressed','true');
 const imu=frame(page).locator('[data-sensor="imu"]'),r=await imu.boundingBox();await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2,id:2}]});await session.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await imu.tap();await expect(imu).toHaveAttribute('aria-pressed','true');await context.close();
});

test('320px training comparison and touch jump stay usable without page overflow',async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL,viewport:{width:320,height:740},isMobile:true,hasTouch:true});const page=await context.newPage();
 await page.goto('/#manual');const f=frame(page);await f.locator('#start').tap();
 const top=()=>f.locator('#game').evaluate(c=>{const {data}=c.getContext('2d').getImageData(40,0,100,235);for(let y=0;y<235;y++)for(let x=0;x<100;x++){const i=(y*100+x)*4;if(data[i]<50&&data[i+1]>180&&data[i+2]<80)return y;}return 235;});
 const standing=await top();await f.locator('#jump').tap();await expect.poll(top,{timeout:1000}).toBeLessThan(standing-10);await f.locator('#duck').tap();await expect(f.locator('#duck')).toHaveAttribute('aria-pressed','true');await f.locator('#duck').tap();await expect(f.locator('#duck')).toHaveAttribute('aria-pressed','false');
 await page.goto('/#training');await frame(page).locator('#compare').tap();await expect(frame(page).locator('#comparisonTable')).toBeVisible();await frame(page).getByText('奖励规则与真实更新记录',{exact:true}).tap();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect(await frame(page).locator('body').evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await context.close();
});

test('32x training keeps browser frames responsive and hidden training stops',async({page})=>{
 await page.goto('/#training');const f=frame(page);await f.getByLabel('训练速度').selectOption('32');
 await f.locator('#start').click();
 const perf=await f.locator('body').evaluate(()=>new Promise(resolve=>{const deltas=[];let last=performance.now();function tick(now){deltas.push(now-last);last=now;if(deltas.length<100)requestAnimationFrame(tick);else {const sorted=deltas.slice(5).sort((a,b)=>a-b);resolve({samples:sorted.length,median:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],max:Math.max(...sorted)});}}requestAnimationFrame(tick);}));
 expect(perf.samples).toBe(95);expect(perf.p95).toBeLessThan(500);await f.locator('#start').click();const updates=Number(await f.locator('#updates').textContent());expect(updates).toBeGreaterThan(100);
 const dir=process.env.EVIDENCE_DIR||join(tmpdir(),'robotcoach-v1.1');await mkdir(dir,{recursive:true});await writeFile(join(dir,'browser-performance.json'),JSON.stringify({...perf,updates},null,2));
 await page.getByRole('button',{name:'三 · AI闭环'}).click();const snapshot=await saved(page);await page.waitForTimeout(400);expect(await saved(page)).toEqual(snapshot);
});
