const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname,'../../../../films/robot-evolution');
const { chromium } = require('playwright');
const allowed = new Map([
  ['/', ['index.html','text/html; charset=utf-8']],
  ['/robot-evolution-v2.mp4',['robot-evolution-v2.mp4','video/mp4']],
  ['/poster.jpg',['poster.jpg','image/jpeg']],
  ['/study/弯道修订片段.mp4',['study/弯道修订片段.mp4','video/mp4']]
]);
const server = http.createServer((req,res)=>{
  const target=allowed.get(decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!target){res.writeHead(404);res.end();return;}
  const file=path.join(root,target[0]), size=fs.statSync(file).size;
  const parts=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
  const first=parts?Number(parts[1]):0, last=parts&&parts[2]?Math.min(size-1,Number(parts[2])):size-1;
  if(first>last){res.writeHead(416);res.end();return;}
  const headers={'Content-Type':target[1],'Accept-Ranges':'bytes','Content-Length':last-first+1};
  if(parts)headers['Content-Range']='bytes '+first+'-'+last+'/'+size;
  res.writeHead(parts?206:200,headers);
  const data=fs.createReadStream(file,{start:first,end:last}); data.on('error',()=>res.destroy());res.on('close',()=>data.destroy());data.pipe(res);
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let browser;
  try{
    const url='http://127.0.0.1:'+server.address().port+'/';
    browser=await chromium.launch({channel:'msedge',headless:true});
    const page=await browser.newPage({viewport:{width:1440,height:980}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url);
    const video=page.locator('video');
    await page.waitForFunction(()=>document.querySelector('video').readyState>=1);
    const info=await video.evaluate(v=>[v.currentSrc.split('/').pop(),v.duration,v.videoWidth,v.videoHeight]);
    assert.deepEqual(info,['robot-evolution-v2.mp4',82,1920,1080]);
    const chapters=[];
    for(const b of await page.locator('button[data-start]').all()){
      const t=Number(await b.getAttribute('data-start'));
      await b.click();
      await page.waitForFunction(t=>{const v=document.querySelector('video');return !v.paused&&!v.seeking&&v.readyState>=2&&v.currentTime>=t&&v.currentTime<t+.85;},t);
      chapters.push([await b.innerText(),t]);
    }
    const hashes=[];
    for(const t of [10.5,14.95,17.6,20.7,22.45]){
      const hash=await video.evaluate(async(v,t)=>{
        v.pause(); const seeked = new Promise(r=>v.addEventListener('seeked',r,{once:true}));v.currentTime=t;await seeked;
        const c=document.createElement('canvas'); c.width=96;c.height=54;
        const g=c.getContext('2d');g.drawImage(v,0,0,96,54);
        let h=2166136261;for(const value of g.getImageData(0,0,96,54).data)h=Math.imul(h^value,16777619);
        return h>>>0;
      },t);hashes.push(hash);
    }
    assert.equal(new Set(hashes).size,5);
    await page.getByRole('link',{name:'单看弯道片段'}).click();
    await page.waitForFunction(()=>document.querySelector('video')?.readyState>=1);
    const len=await page.locator('video').evaluate(v=>v.duration);
    assert.ok(Math.abs(len-12.8)<.001);
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({master:info,chapters,decodedSamples:hashes.length,excerpt:len,errors}));
  }finally{if(browser)await browser.close();server.closeAllConnections();server.close();}
})().catch(e=>{ console.error(e); process.exitCode=1; });
