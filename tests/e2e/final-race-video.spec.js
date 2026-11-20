import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {FinalRace,RACE_RULE,raceStrategy} from '../../assets/motion/final-race.js';
import {CONDITIONS} from '../../assets/motion/short-course.js';
import {MODEL_KEY,createModel} from '../../assets/motion/short-learning.js';

const recordKey='robotcoach:final-race:session:v1';
const summaryKey='robotcoach:final-race:last:v1';
const raw=(()=>{
  const race=new FinalRace({sensors:CONDITIONS.sensors,strategy:raceStrategy(RACE_RULE)});
  for(let step=0;step<120;step++)race.step();
  race.exit();
  return JSON.stringify(race.record);
})();
const q=JSON.stringify({...createModel(),q:{'none,0,0,1':[1,0,0]},updates:1});
const frame=page=>page.frameLocator('#experiment');

async function openRecord(page,mode='valid'){
  await page.addInitScript(({recordKey,summaryKey,raw,mode,MODEL_KEY,q})=>{
    if(window!==top)return;
    const saved=JSON.parse(raw);
    if(mode==='invalid')saved.frames.pop();
    if(mode!=='missing')sessionStorage.setItem(recordKey,mode==='invalid'?JSON.stringify(saved):raw);
    localStorage.setItem(summaryKey,JSON.stringify({version:saved.version,score:saved.score,trackSeed:saved.track.seed,
      distance:saved.track.distance,sensors:saved.sensors,kind:saved.strategy.kind,updates:null}));
    localStorage.setItem(MODEL_KEY,q);
  },{recordKey,summaryKey,raw,mode,MODEL_KEY,q});
  await page.goto('/#design');
  return frame(page);
}

test('Chromium encodes and decodes a short real recorded race with its original storage and replay intact',async({page},testInfo)=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const f=await openRecord(page);
  await f.locator('body').evaluate(async()=>{
    const [{MotionWorld},{Learner}]=await Promise.all([import('../assets/motion/world.js'),import('../assets/learning.js')]);
    const forbidden=()=>{throw new Error('Video export tried to calculate the race again');};
    MotionWorld.prototype.step=MotionWorld.prototype.observe=Learner.prototype.choose=forbidden;
  });
  await f.locator('#openReplay').click();
  await f.locator('#replaySpeed').selectOption('0.5');
  await f.locator('#replayProgress').press('End');
  await f.locator('#exportVideo').click();
  const video=f.locator('#downloadVideo');
  await expect(video).toBeVisible();
  const result=await video.evaluate(async link=>{
    const blob=await (await fetch(link.href)).blob();
    const video=document.createElement('video');
    video.muted=true;
    video.src=link.href;
    const end=new Promise((resolve,reject)=>{
      video.addEventListener('ended',resolve,{once:true});
      video.addEventListener('error',()=>reject(video.error),{once:true});
    });
    await video.play();
    await end;
    return {type:blob.type,size:blob.size,width:video.videoWidth,height:video.videoHeight,duration:video.currentTime};
  });
  expect(result.type).toMatch(/^video\/webm/);
  expect(result.size).toBeGreaterThan(1000);
  expect([result.width,result.height]).toEqual([1200,720]);
  expect(result.duration).toBeGreaterThan(2.2);
  expect(result.duration).toBeLessThan(3.2);
  const downloadEvent=page.waitForEvent('download');
  await video.click();
  const download=await downloadEvent;
  expect(download.suggestedFilename()).toBe('robotcoach-race-2026-aborted.webm');
  expect((await readFile(await download.path())).byteLength).toBe(result.size);
  await download.saveAs(testInfo.outputPath('recorded-race-smoke.webm'));
  await expect(f.locator('#replaySpeed')).toHaveValue('0.5');
  await expect(f.locator('#replayProgress')).toHaveValue('120');
  await expect(f.locator('#download')).toBeEnabled();
  await expect(f.locator('#retry')).toBeEnabled();
  expect(await page.evaluate(({recordKey,MODEL_KEY})=>[sessionStorage.getItem(recordKey),localStorage.getItem(MODEL_KEY)],
    {recordKey,MODEL_KEY})).toEqual([raw,q]);
  const url=await video.getAttribute('href');
  await f.locator('body').evaluate(()=>document.dispatchEvent(new CustomEvent('coursevisibility',{detail:true})));
  await expect(video).toBeHidden();
  expect(await page.evaluate(url=>fetch(url).then(()=>false,()=>true),url)).toBe(true);
  expect(errors).toEqual([]);
});

test('touch layout can cancel and hiding or leaving stops the Canvas video track',async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,viewport:{width:320,height:740},hasTouch:true,isMobile:true});
  try{
    const page=await context.newPage(),f=await openRecord(page);
    await f.locator('body').evaluate(()=>{
      const capture=HTMLCanvasElement.prototype.captureStream;
      parent.exportTracks=[];
      HTMLCanvasElement.prototype.captureStream=function(fps){
        const stream=capture.call(this,fps);
        parent.exportTracks.push(...stream.getTracks());
        return stream;
      };
    });
    const start=f.locator('#exportVideo'),cancel=f.locator('#cancelVideo');
    const states=()=>page.evaluate(()=>window.exportTracks.map(track=>track.readyState));
    await start.tap();
    await expect(f.locator('#videoProgress')).toBeVisible();
    expect(await f.locator('body').evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await cancel.tap();
    await expect(f.locator('#videoStatus')).toContainText('已取消');
    expect(await states()).toEqual(['ended']);
    await start.tap();
    await f.locator('body').evaluate(()=>document.dispatchEvent(new CustomEvent('coursevisibility',{detail:true})));
    await expect(f.locator('#videoStatus')).toContainText('页面已隐藏');
    expect(await states()).toEqual(['ended','ended']);
    await f.locator('body').evaluate(()=>document.dispatchEvent(new CustomEvent('coursevisibility',{detail:false})));
    await start.tap();
    await page.getByRole('button',{name:'上一页'}).tap();
    await expect(page).toHaveURL(/#fault$/);
    expect(await states()).toEqual(['ended','ended','ended']);
  }finally{await context.close();}
});

test('missing capture capability, recorder errors and empty output leave replay and JSON usable',async({page})=>{
  await page.addInitScript(()=>{
    if(location.search.includes('unsupported'))HTMLCanvasElement.prototype.captureStream=undefined;
  });
  const f=await openRecord(page);
  await f.locator('body').evaluate(()=>{
    window.nativeCapture=HTMLCanvasElement.prototype.captureStream;
    HTMLCanvasElement.prototype.captureStream=()=>{throw new DOMException('Blocked','SecurityError');};
  });
  await f.locator('#exportVideo').click();
  await expect(f.locator('#videoStatus')).toContainText('录制失败');
  await expect(f.locator('#downloadVideo')).toBeHidden();
  await f.locator('body').evaluate(()=>{
    HTMLCanvasElement.prototype.captureStream=window.nativeCapture;
    window.MediaRecorder=class {
      state='inactive';
      mimeType='video/webm';
      start(){this.state='recording';}
      stop(){this.state='inactive';this.onstop?.();}
    };
  });
  await f.locator('#exportVideo').click();
  await expect(f.locator('#videoProgress')).toBeVisible();
  await expect(f.locator('#videoProgress')).toBeHidden();
  await expect(f.locator('#videoStatus')).toContainText('录制失败');
  await expect(f.locator('#downloadVideo')).toBeHidden();
  await page.goto('/experiments/final-race.html?unsupported');
  await expect(page.locator('#exportVideo')).toBeDisabled();
  await expect(page.locator('#videoStatus')).toContainText('没有可用的视频录制格式');
  await expect(page.locator('#download')).toBeEnabled();
  await page.locator('#openReplay').click();
  await expect(page.locator('#replayCanvas')).toBeVisible();
});

for(const mode of ['invalid','missing']){
  test(`${mode} saved frames leave a score summary and no video export`,async({page})=>{
    const f=await openRecord(page,mode);
    await expect(f.locator('#resultStatus')).toContainText('未完成');
    await expect(f.locator('#exportVideo')).toBeDisabled();
    await expect(f.locator('#videoStatus')).toContainText('当前标签页没有完整记录');
    await expect(f.locator('#downloadVideo')).toBeHidden();
  });
}
