import {test,expect} from '@playwright/test';
import {mkdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createModel,MODEL_KEY,MotionTrainer} from '../../assets/motion/short-learning.js';

const evidence=process.env.EVIDENCE_DIR||'test-results/evidence';
const frame=page=>page.frameLocator('#experiment');
const record=page=>page.evaluate(()=>JSON.parse(sessionStorage.getItem('robotcoach:final-race:session:v1')));
const allSensors=async frame=>{
  for(const name of ['camera','lidar','imu','force'])await frame.locator(`input[name=${name}]`).check();
};
test.beforeAll(()=>mkdir(evidence,{recursive:true}));

test('page eleven runs all six segments with one clock and downloads the real finish',async({page})=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.clock.install();
  await page.goto('/#workshop');
  await frame(page).locator('[data-sensor=imu]').click();
  await page.goto('/#design');
  let f=frame(page);
  await expect(page.getByRole('heading',{level:1})).toContainText('终极挑战');
  await expect(page.getByText('11 / 11')).toBeVisible();
  await expect(f.locator('input[name=imu]')).toBeChecked();
  await expect(f.locator('input[name=lidar]')).not.toBeChecked();
  await expect(f.locator('#start')).toBeDisabled();
  await allSensors(f);
  await f.locator('#policy').selectOption('rule');
  await f.locator('#start').click();
  await expect(f.locator('#countdown')).toBeVisible();
  await expect(f.locator('#raceTime')).toHaveText('0.0 秒');
  await expect(f.locator('input[name=imu]')).toBeDisabled();
  await expect(f.locator('#policy')).toBeDisabled();
  await page.clock.runFor(19300);
  await expect(f.locator('#segment')).toHaveText('急弯控制');
  await expect(f.locator('#bend')).toBeVisible();
  await page.screenshot({path:join(evidence,'final-race-desktop-curve.png'),fullPage:true});
  await page.clock.runFor(29500);
  await expect(f.locator('#status')).toHaveAttribute('data-state','finished');
  await expect(f.locator('#resultStatus')).toContainText('190.0 / 190 m · 40.9 秒 · 越障 6');
  await page.screenshot({path:join(evidence,'final-race-desktop-finish.png'),fullPage:true});
  const download=page.waitForEvent('download');
  await f.locator('#download').click();
  const actual=JSON.parse(await readFile(await (await download).path(),'utf8'));
  expect(actual).toEqual(await record(page));
  expect(actual.frames).toHaveLength(5270);
  expect(actual.events.filter(event=>event.type==='segment').map(event=>event.segment))
    .toEqual(['straight','obstacles','night','curve','rough','wet']);
  expect(actual.presentation.tick).toBeGreaterThan(actual.score.tick);
  // Race-only adjustments do not write back to the student's installation.
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('robotcoach:v1')).sensors))
    .toEqual({camera:true,lidar:false,imu:true,force:false});
  await page.reload();
  f=frame(page);
  await expect(f.locator('#download')).toBeVisible();
  await expect(f.locator('#resultStatus')).toContainText('成功完赛');
  expect(errors).toEqual([]);
});

test('320px pause, failure presentation, frozen retry and exit keep honest records',async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,viewport:{width:320,height:740},hasTouch:true,isMobile:true});
  const page=await context.newPage();
  await page.clock.install();
  await page.goto('/#design');
  const f=frame(page);
  await f.locator('#policy').selectOption('rule');
  await f.locator('#start').tap();
  await page.clock.runFor(4700);
  await expect(f.locator('#status')).toHaveAttribute('data-state','running');
  await page.evaluate(()=>document.getElementById('experiment').contentWindow.postMessage(
    {type:'robotcoach:visibility',hidden:true},location.origin));
  await expect(f.locator('#pause')).toHaveText('继续比赛');
  const paused=await f.locator('#raceTime').textContent(),distance=await f.locator('#distance').textContent();
  await page.clock.runFor(10000);
  await expect(f.locator('#raceTime')).toHaveText(paused);
  await expect(f.locator('#distance')).toHaveText(distance);
  await page.evaluate(()=>document.getElementById('experiment').contentWindow.postMessage(
    {type:'robotcoach:visibility',hidden:false},location.origin));
  await f.locator('#pause').tap();
  await page.clock.runFor(4050);
  await expect(f.locator('#status')).toHaveAttribute('data-outcome','failed');
  await expect(f.locator('#status')).toHaveAttribute('data-state','showing');
  await page.clock.runFor(3500);
  await expect(f.locator('#status')).toHaveAttribute('data-state','failed');
  await expect(f.locator('#resultStatus')).toContainText('26.8 / 190 m · 5.2 秒');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await f.locator('body').evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:join(evidence,'final-race-narrow-failure.png'),fullPage:true});
  const first=await record(page);
  expect(first.presentation.displayState).toBe('fallen');
  await f.locator('input[name=imu]').check();
  await expect(f.locator('#status')).toHaveAttribute('data-outcome','pending');
  expect(await record(page)).toEqual(first);
  await f.locator('#retry').tap();
  await expect(f.locator('input[name=imu]')).not.toBeChecked();
  await page.clock.runFor(11300);
  await expect(f.locator('#status')).toHaveAttribute('data-state','failed');
  expect(await record(page)).toEqual(first);
  await f.locator('#retry').tap();
  await page.clock.runFor(3800);
  await page.getByRole('button',{name:'上一页'}).tap();
  await expect(page).toHaveURL(/#fault$/);
  const aborted=await record(page);
  expect(aborted.score.outcome).toBe('aborted');
  expect(aborted.score.reason).toBeNull();
  expect(aborted.presentation.status).toBe('interrupted');
  await context.close();
});

test('student selection is required and the frozen learning model survives a storage reset',async({page})=>{
  const trainer=new MotionTrainer(createModel(42));
  while(trainer.learner.attempts<10)trainer.advance();
  const model=trainer.snapshot();
  await page.clock.install();
  await page.goto('/#design');const f=frame(page);
  await f.locator('#policy').selectOption('learned');
  await expect(f.locator('#start')).toBeDisabled();
  await expect(f.locator('#policyNote')).toContainText('尚无可用的人形 Q 策略');
  await expect(f.locator('#goTraining')).toBeVisible();
  await page.evaluate(({key,model})=>localStorage.setItem(key,JSON.stringify(model)),{key:MODEL_KEY,model});
  await expect(f.locator('#start')).toBeEnabled();
  await expect(f.locator('#policyNote')).toContainText('本场感官不同');
  await f.locator('#start').click();
  await page.clock.runFor(5800);
  await page.evaluate(key=>localStorage.removeItem(key),MODEL_KEY);
  await expect(f.locator('#policyNote')).toContainText(String(model.updates));
  await f.locator('#exit').click();
  const frozen=await record(page);
  expect(frozen.strategy.kind).toBe('learned');
  expect(frozen.strategy.model.q).toEqual(model.q);
  expect(frozen.strategy.model.updates).toBe(model.updates);
  expect(frozen.sensors).toEqual({camera:true,lidar:false,imu:false,force:false});
  expect(frozen.decisions.length).toBeGreaterThan(0);
  expect(frozen.decisions.every(decision=>decision.observation.speed===null&&decision.observation.support===null)).toBe(true);
  expect(await page.evaluate(key=>localStorage.getItem(key),MODEL_KEY)).toBeNull();
});

test('the full view and the legacy V2 experiment return to page eleven',async({page})=>{
  await page.goto('/#design');const f=frame(page);
  await f.locator('#fullView').click();
  await expect(page).toHaveURL(/\/experiments\/final-race\.html\?view=full&book=index\.html$/);
  await page.locator('#backToBook').click();
  await expect(page).toHaveURL(/index\.html#design$/);
  await f.getByText('原 V2 综合实验与课程总结',{exact:true}).click();
  await f.locator('#legacy').click();
  await expect(page).toHaveURL(/\?lab=v2#design$/);
  await expect(f.locator('#challengeRun')).toBeVisible();
  await page.getByRole('link',{name:'返回连续总决赛'}).click();
  await expect(f.locator('#motionCanvas')).toBeVisible();
  await expect(page.getByText('11 / 11')).toBeVisible();
});
