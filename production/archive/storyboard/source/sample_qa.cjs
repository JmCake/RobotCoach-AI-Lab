const { chromium }=require('playwright');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});
try{const page=await browser.newPage({viewport:{width:1366,height:880}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')console.log(m.text());});
await page.goto(pathToFileURL(path.resolve(__dirname,'../../RobotCoach-视觉故事板/第一关互动样片.html')).href);
await page.getByRole('button',{name:'可能会失衡'}).click({timeout:9000});
await page.waitForFunction(()=>document.getElementById('clip').currentTime>.25,null,{timeout:7000});
await page.getByRole('button',{name:'暂停镜头'}).click();
await page.getByRole('button',{name:'继续镜头'}).click();
await page.getByRole('button',{name:'只用摄像头跑一次'}).waitFor({timeout:16000});
await page.clock.install();
for(const [button,tag,n] of [['只用摄像头跑一次','base',1],['接入控制器再跑','wire',2],['仅测量再跑','measure',3]]){
  await page.getByRole('button',{name:button}).click();
  await page.clock.runFor(200);
  if(n===1){await page.getByRole('button',{name:'暂停试跑'}).click();const before=await page.locator('#voice').innerText();await page.clock.runFor(500);if(before!==await page.locator('#voice').innerText())throw Error('pause');await page.getByRole('button',{name:'继续试跑'}).click();}
  await page.clock.runFor(14000);
  if(await page.locator('#log li').count()!==n)throw Error('missing result: '+n+' '+errors.join('/'));
  console.log(await page.locator('#log li').last().innerText());
  await page.locator('#track').screenshot({path:path.join(__dirname,tag+'.png')});
}
await page.screenshot({path:path.join(__dirname,'sample-desktop.png')});
if(!await page.getByRole('button',{name:'我来操控起跳'}).isVisible())throw Error('lost previous finish');
await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(__dirname,'sample-mobile.png'),fullPage:true});
if(await page.evaluate(()=>document.body.scrollWidth>innerWidth))throw Error('mobile overflow');
fs.writeFileSync(path.join(__dirname,'sample-results.json'),JSON.stringify(await page.locator('#log li').allTextContents()));
if(errors.length)throw Error(errors.join('/'));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
