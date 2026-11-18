// Self-authored vector animations, replacing upstream videos with unknown provenance.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('assets/videos',{recursive:true});
const browser=await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{});
try{
 const page=await browser.newPage();
 await page.setContent('<canvas width="640" height="300"></canvas>');
 for(const type of ['sense','decision','action','loop']){
  const base64=await page.evaluate(async type=>{
   const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
   ctx.fillStyle='#171b2b';ctx.fillRect(0,0,640,300);
   const stream=canvas.captureStream(0),chunks=[];
   const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:500000});
   const done=new Promise(resolve=>{recorder.ondataavailable=e=>chunks.push(e.data);recorder.onstop=()=>resolve(new Blob(chunks,{type:'video/webm'}));});
   recorder.start();
   await new Promise(resolve=>{recorder.onstart=resolve;});
   const names={sense:'感知关闭：看不到障碍',decision:'决策关闭：没有动作判断',action:'行动关闭：执行器停止',loop:'反馈断开：不再观察变化'};
   const start=performance.now();
   await new Promise(resolve=>{
    function draw(now){
     const t=(now-start)/1000;ctx.fillStyle='#171b2b';ctx.fillRect(0,0,640,300);ctx.fillStyle='#d5e5f7';ctx.font='bold 24px system-ui';ctx.fillText(names[type],25,40);
     ctx.fillStyle='#b74332';ctx.fillRect(0,225,640,75);ctx.strokeStyle='#f8e1d4';ctx.setLineDash([18,12]);ctx.beginPath();ctx.moveTo(0,265);ctx.lineTo(640,265);ctx.stroke();ctx.setLineDash([]);
     const x=type==='action'?110:110+Math.min(t,2.3)*120,obstacleX=410;
     const hit=type==='sense'&&x>360||type==='decision'&&x>360||type==='loop'&&t>2.2;
     ctx.fillStyle='#e7b163';ctx.fillRect(obstacleX,182,32,43);
     ctx.fillStyle=hit?'#f48671':'#4ade80';ctx.fillRect(x,175,34,42);ctx.fillRect(x+5,151,24,22);ctx.fillStyle='#0c3f36';ctx.fillRect(x+10,157,5,5);ctx.fillRect(x+20,157,5,5);ctx.fillStyle='#4ade80';ctx.fillRect(x+3,217,10,8);ctx.fillRect(x+22,217,10,8);
     if(type==='loop'&&t<1.5){ctx.fillStyle='#79b9f2';ctx.font='17px system-ui';ctx.fillText('首次观察 → 行动 → 失去反馈',25,85);}
     if(hit){ctx.strokeStyle='#ffb6a0';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x,170);ctx.lineTo(x+35,215);ctx.moveTo(x+35,170);ctx.lineTo(x,215);ctx.stroke();}
     ctx.font='17px system-ui';ctx.fillStyle='#dfebfb';ctx.fillText('机制演示 · Canvas 程序图形重制',25,288);
     stream.getVideoTracks()[0].requestFrame();
     if(t<3)requestAnimationFrame(draw);else resolve();
    }requestAnimationFrame(draw);
   });
   recorder.stop();const blob=await done;stream.getTracks().forEach(t=>t.stop());
   const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';for(const n of bytes)binary+=String.fromCharCode(n);return btoa(binary);
  },type);
  await writeFile(`assets/videos/${type}.webm`,Buffer.from(base64,'base64'));
  console.log(`Generated ${type}.webm (${Math.round(base64.length*.75)} bytes)`);
 }
}finally{await browser.close();}
