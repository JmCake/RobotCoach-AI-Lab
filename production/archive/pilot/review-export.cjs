const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const net=require('node:net');
const {once}=require('node:events');
const {spawn}=require('node:child_process');
const checkout=path.resolve(__dirname,'../story-github-review');
const evidence=path.join(checkout,'docs/story-review');

(async()=>{
  const reserve=net.createServer();
  reserve.listen(0,'127.0.0.1');await once(reserve,'listening');
  const port=reserve.address().port;await new Promise(done=>reserve.close(done));
  const server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:checkout,env:{...process.env,PORT:String(port),SERVE_DIST:'0'},stdio:['ignore','pipe','inherit'],windowsHide:true});
  let browser;
  try{
    await once(server.stdout,'data');
    browser=await chromium.launch({channel:'msedge',headless:true});
    const page=await browser.newPage({viewport:{width:1365,height:880},reducedMotion:'reduce'});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const phases=[];const button=name=>page.getByRole('button',{name});
    async function at(phase){
      await page.waitForFunction(x=>document.body.dataset.phase===x,phase,{timeout:25000});
      phases.push([phase,await page.locator('.steps [aria-current]').innerText()]);
    }
    async function shot(file){
      await page.evaluate(()=>Promise.all([...document.images].filter(i=>!i.hidden&&i.src).map(i=>i.decode().catch(()=>{}))));
      await page.screenshot({path:path.join(evidence,file),quality:84,type:'jpeg',fullPage:true});
    }
    const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('robotcoach:v1')).bendStory);
    await fs.mkdir(evidence,{recursive:true});
    await page.goto('http://127.0.0.1:'+port+'/story.html');
    await button('播放现场镜头').click();await at('think');
    await button(/身体已经歪了/).click();await button('让初代机实跑一次').click();await at('baseline');
    await page.waitForFunction(()=>parseFloat(document.getElementById('liveDistance').textContent)>2);
    const interrupted=await page.locator('#liveDistance').innerText();
    await page.reload();await at('baseline');
    assert.match(await page.locator('#liveDistance').innerText(),/^0\.0/);
    assert(!(await state()).baseline);
    await button('开始试跑').click();await at('baselineReview');await shot('baseline-question.jpg');
    const baseline=(await state()).baseline;
    await button('进入维修舱').click();await at('bay');await shot('bay-question.jpg');
    await button('回看我的猜想').click();await at('think');
    await button('带着猜想去维修舱').click();await at('bay');
    assert.equal((await state()).baseline.result.distance,baseline.result.distance);
    await page.locator('[data-module=lidar]').click();await button('用这套配置重跑').click();
    await at('review');const failed=(await state()).runs.at(-1);
    assert(!failed.result.success);await shot('failed.jpg');
    await button('调整配置再试').click();await at('bay');await shot('retry.jpg');
    await page.locator('[data-module=lidar]').click();await page.locator('[data-module=imu]').click();
    await button('用这套配置重跑').click();await at('trial');await at('review');
    const passed=(await state()).runs.at(-1);assert(passed.result.success);await shot('success-review.jpg');
    await button('回到赛场看过弯').click();await at('through');
    await page.waitForFunction(()=>document.getElementById('movie').currentTime>.8);
    await shot('success-film.jpg');await at('next');await shot('hurdle.jpg');
    await button('查看后续课程地图').click();assert(await page.locator('#map').isVisible());
    await page.getByRole('link',{name:'手动操控'}).click();
    await page.frameLocator('#experiment').locator('#motionCanvas').waitFor();
    assert(page.url().endsWith('index.html#manual'));
    const course=[];
    const record=async()=>course.push({title:await page.locator('#pageTitle').innerText(),page:await page.locator('#pageNumber').innerText(),hash:new URL(page.url()).hash});
    await record();await page.locator('#next').click();await page.waitForURL(/#training$/);await record();
    await page.locator('#openContents').click();await page.locator('#lessonList a[href="#imitation"]').click();await record();
    assert.deepEqual(course.map(x=>x.page),['05 / 9','06 / 9','04 / 9']);assert.deepEqual(errors,[]);
    const results={phases,course,interrupted,afterReload:'0.0 / 40 米',baseline:baseline.result.distance,failed:failed.result.distance,passed:passed.result.distance,errors};
    await fs.writeFile(path.join(__dirname,'review-export-results.json'),JSON.stringify(results,null,2));
    console.log(JSON.stringify(results));
  }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
