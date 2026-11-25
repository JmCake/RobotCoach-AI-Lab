const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const root = path.resolve(__dirname,'../story-github-review');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.wasm':'application/wasm','.css':'text/css','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
  const name=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!name.startsWith(root+path.sep)||!fs.existsSync(name)||!fs.statSync(name).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',types[path.extname(name)]||'application/octet-stream');
  fs.createReadStream(name).pipe(res);
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1380,height:900}});
    await page.goto(origin+'/experiments/road-vision.html?sample=jiuzhaigou');
    await page.click('#analyze');
    await page.waitForFunction(()=>document.querySelector('#analyze').textContent==='已完成识别',null,{timeout:90000});
    const photo=page.locator('#photo');
    const b=await photo.boundingBox();
    const answers=[];
    for(const [x,y] of [[.82,.81],[.2,.58],[.36,.84]]){
      await photo.click({position:{x:b.width*x,y:b.height*y}});
      await page.waitForTimeout(150);
      answers.push([x,y,await page.locator('#pointReading').innerText(),await page.locator('#rough').innerText()]);
      if(answers.length===1)await photo.screenshot({path:path.join(__dirname,'onnx.png')});
    }
    console.log(answers);
    fs.writeFileSync(path.join(__dirname,'onnx.json'),JSON.stringify(answers));
    await page.goto(origin+'/experiments/final-race.html');
    await page.clock.install();
    for(const key of ['camera','lidar','imu','force'])await page.locator('input[name='+key+']').check();
    await page.selectOption('#policy','rule');await page.click('#start');
    await page.clock.runFor(19300);
    await page.locator('#motionCanvas').screenshot({path:path.join(__dirname,'race.png')});
    await page.clock.runFor(29500);
    console.log(await page.locator('#resultStatus').innerText());
    await page.click('#openReplay');
    const buttons=page.locator('#replayEvents button');
    const events=await buttons.allTextContents(); console.log(events.slice(0,12));
    const chosen=buttons.filter({hasText:'急弯控制'}).first();await chosen.click();
    await page.locator('#replayCanvas').screenshot({path:path.join(__dirname,'replay.png')});
    fs.writeFileSync(path.join(__dirname,'race.json'),JSON.stringify({score:await page.locator('#resultStatus').innerText(),events}));
    await page.goto(origin+'/experiments/imitation.html');
    await page.click('#demo');await page.clock.runFor(24000);
    console.log(await page.locator('#firstCount').innerText(),await page.locator('#secondCount').innerText());
    await page.locator('#change').click();await page.clock.runFor(15000);
    console.log(await page.locator('#firstCount').innerText(),await page.locator('#secondCount').innerText());
    await page.locator('#lanes').screenshot({path:path.join(__dirname,'imitation.png')});
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1)});
