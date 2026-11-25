const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../final-race-video/films/robot-evolution');
const starts=[0,22.2,38.4,51.5,59.9,70,94.9,111.4,122.6];
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    const page=await browser.newPage({offline:true,viewport:{width:1365,height:860}});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const ready=()=>page.waitForFunction(()=>document.querySelector('video')?.readyState>=2);
    const media=()=>page.locator('video').evaluate(v=>[v.duration,v.videoWidth,v.videoHeight]);
    const end=async()=>{
      await page.locator('video').evaluate(v=>{v.currentTime=v.duration-.4;return v.play()});
      await page.waitForFunction(()=>document.querySelector('video').ended);
    };
    await page.goto(pathToFileURL(path.join(root,'index.html')).href);
    await ready();
    assert.deepEqual(await media(),[132.2,1920,1080]);
    assert.ok((await page.locator('video').evaluate(v=>v.currentSrc)).endsWith('/robot-evolution-v6.mp4'));
    const buttons=await page.locator('button[data-start]').all();
    assert.equal(buttons.length,starts.length);
    for(const [i,button] of buttons.entries()){
      const t=Number(await button.getAttribute('data-start'));
      assert.equal(t,starts[i]);
      await button.click();
      await page.waitForFunction(t=>{
        const v=document.querySelector('video');
        return !v.paused&&!v.seeking&&v.currentTime>t+.05&&v.currentTime<t+1.5&&
          Number(document.querySelector('button[aria-current=true]').dataset.start)===t;
      },t);
    }
    await end();
    for(const a of await page.locator('footer a').all())
      assert.ok(fs.existsSync(path.join(root,(await a.getAttribute('href')).split('#')[0])));
    assert.equal(await page.getByRole('link',{name:'保存完整 MP4'}).getAttribute('href'),'robot-evolution-v6.mp4');
    await page.getByRole('link',{name:/跨栏与钻梁/}).click();
    await ready();
    assert.deepEqual(await media(),[22.5,1280,720]);
    await end();
    await page.goBack();
    await ready();
    await page.getByRole('link',{name:/单看漫画训练/}).click();
    await ready();
    assert.deepEqual(await media(),[62.7,1920,1080]);
    await end();
    await page.goto(pathToFileURL(path.join(root,'study','试错训练回放.mp4')).href);
    await ready();
    assert.deepEqual(await media(),[37,1280,720]);
    await end();
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({offline:true,playedToEnd:['v6','22.5 s','62.7 s','37 s'],chapters:starts,errors}));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
