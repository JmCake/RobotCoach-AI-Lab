const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');

const root = path.resolve(__dirname, '../../final-race-video/films/robot-evolution');
const expected = [0, 22.2, 38.4, 51.5, 59.9, 70, 94.9, 111.4, 122.6];

(async () => {
  const browser = await chromium.launch({channel:'msedge', headless:true});
  try {
    const context = await browser.newContext({viewport:{width:1360,height:900},offline:true});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror',e=>errors.push(e.message));
    const navigation = pathToFileURL(path.join(root,'index.html')).href;
    await page.goto(navigation);
    const film = page.locator('video');
    await page.waitForFunction(()=>document.querySelector('video').readyState>=2);
    const media = await film.evaluate(v=>({file:v.currentSrc.split('/').pop(), seconds:v.duration,
      width:v.videoWidth, height:v.videoHeight}));
    assert.deepEqual(media,{file:'robot-evolution-v4.mp4',seconds:132.2,width:1920,height:1080});
    const chapters = [];
    const buttons = await page.locator('button[data-start]').all();
    assert.equal(buttons.length,expected.length);
    for (const [index,button] of buttons.entries()) {
      const start = Number(await button.getAttribute('data-start'));
      assert.equal(start,expected[index]);
      await button.click();
      await page.waitForFunction(t=>{
        const v=document.querySelector('video');
        return !v.paused && !v.seeking && v.readyState>=2 && v.currentTime>t+.04 &&
          v.currentTime<t+1.2 && Number(document.querySelector('button[aria-current=true]').dataset.start)===t;
      },start);
      const decoded = await film.evaluate(v=>new Promise(r=>v.requestVideoFrameCallback((_,m)=>r(m.mediaTime))));
      assert.ok(decoded>=start-.05 && decoded<start+2);
      chapters.push([await button.innerText(),start]);
    }
    await film.evaluate(v=>{v.currentTime=v.duration-.55; return v.play();});
    await page.waitForFunction(()=>document.querySelector('video').ended);
    const download=page.getByRole('link',{name:'保存完整 MP4'});
    assert.equal(await download.getAttribute('href'),media.file);
    for (const link of await page.locator('footer a').all()) {
      const target=(await link.getAttribute('href')).split('#')[0];
      assert.ok(fs.existsSync(path.join(root,target)),target);
    }
    await page.getByRole('link',{name:'对照升级前后的弯道'}).click();
    await page.waitForFunction(()=>{const v=document.querySelector('video');return v && v.readyState>=2 && v.currentTime>=10.15 && v.currentTime<13;});
    const fragment=await page.locator('video').evaluate(v=>[v.currentTime,location.hash]);
    assert.equal(fragment[1],'#t=10.2,31.3');
    await page.goto(navigation);
    await page.getByRole('link',{name:'单看 37 秒试错训练'}).click();
    await page.waitForFunction(()=>document.querySelector('video')?.readyState>=2);
    const excerpt=await page.locator('video').evaluate(v=>[v.duration,v.videoWidth,v.videoHeight]);
    assert.deepEqual(excerpt,[37,1280,720]);
    await page.locator('video').evaluate(v=>{v.currentTime=35.95;return v.play();});
    await page.waitForFunction(()=>document.querySelector('video').ended);
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({localFile:true,offline:true,media,chapters,playedToEnd:true,fragment,excerpt,errors}));
  } finally {
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
