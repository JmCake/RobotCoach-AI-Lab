// Film the project's own Canvas renderer at every 120 Hz physics tick.
// The recorded actions are sent back through ShortCourse.tick without changing its controller.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,readFile,rename,rm,rmdir} from 'node:fs/promises';
import {basename,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const source=dirname(fileURLToPath(import.meta.url));
const root=fileURLToPath(new URL('../../../',import.meta.url));
const output=join(source,'art','training-replays.mp4');
const log=JSON.parse(await readFile(join(source,'training-takes.json'),'utf8'));
const allowed=new Set(['assets/learning.js',...['render.js','short-course.js','world.js','track-arc.js',
  'rig.js','fall-feedback.js','grandstand.webp'].map(name=>'assets/motion/'+name)]);
const temp=await mkdtemp(join(dirname(output),'capture-'));
const intermediate=join(temp,'takes.mp4');
const browser=await chromium.launch({channel:process.env.ROBOTCOACH_BROWSER||'msedge',headless:true});
let encoder;
try{
  const page=await browser.newPage({viewport:{width:1200,height:640},deviceScaleFactor:1.5});
  await page.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.origin!=='http://classroom.invalid')return route.abort();
    const file=url.pathname.slice(1);
    if(!file)return route.fulfill({contentType:'text/html',body:'<meta charset=utf-8><style>*{margin:0}canvas{width:1200px;height:640px;display:block}</style><canvas></canvas>'});
    if(!allowed.has(file))return route.abort();
    return route.fulfill({contentType:file.endsWith('.webp')?'image/webp':'application/javascript',body:await readFile(join(root,file))});
  });
  await page.goto('http://classroom.invalid/');
  await page.evaluate(async()=>{
    const [{MotionRenderer},{ShortCourse,observationState}]=await Promise.all([
      import('/assets/motion/render.js'),import('/assets/motion/short-course.js')]);
    const native=document.querySelector('canvas');
    const renderer=new MotionRenderer(native);
    renderer.resize();
    await renderer.grandstand.decode();
    const shot=document.createElement('canvas');
    shot.width=1536;shot.height=864;
    const ctx=shot.getContext('2d',{alpha:false});
    let ep,index,clip,clock;
    function advance(){
      const transition=ep.tick(o=>{
        const s=clip.steps[index];
        if(observationState(o)!==s.state||Math.round(o.time*120)!==s.t)throw Error('Decision diverged');
        return s.action;
      });
      if(transition){
        const s=clip.steps[index++];
        if(Math.abs(transition.reward-s.reward)>.00001||Math.round(ep.world.time*120)!==s.end)throw Error('Reward diverged');
      }
      clock++;
    }
    window.selectTake=data=>{
      clip=data;ep=new ShortCourse(data.seed);index=0;clock=0;
      while(clock<data.film.from)advance();
    };
    window.captureTicks=(first,last)=>{
      const images=[];
      for(let tick=first;tick<=last;tick++){
        while(clock<tick)advance();
        if(clock!==tick)throw Error('Capture clock moved backwards');
        renderer.draw(ep.world);
        const k=native.width/1200;
        ctx.drawImage(native,56*k,16*k,928*k,522*k,0,0,shot.width,shot.height);
        images.push(shot.toDataURL('image/jpeg',.96).split(',')[1]);
      }
      return images;
    };
  });
  encoder=spawn(process.env.FFMPEG||'ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe',
    '-framerate',String(log.rate),'-vcodec','mjpeg','-i','pipe:0','-an','-c:v','libx264','-preset','veryfast',
    '-threads','5','-g','30','-bf','0','-crf','15','-vf','scale=out_color_matrix=bt709','-pix_fmt','yuv420p',
    '-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-movflags','+faststart',intermediate],
    {stdio:['pipe','ignore','inherit'],windowsHide:true});
  const closed=once(encoder,'close');
  let written=0;
  for(const id of log.order){
    const clip=log.clips[id];
    await page.evaluate(data=>window.selectTake(data),clip);
    for(let first=clip.film.from;first<=clip.film.through;first+=8){
      const last=Math.min(clip.film.through,first+7);
      const batch=await page.evaluate(([a,b])=>window.captureTicks(a,b),[first,last]);
      for(const frame of batch){
        if(!encoder.stdin.write(Buffer.from(frame,'base64')))await once(encoder.stdin,'drain');
        written++;
      }
    }
    console.log(id,clip.film.from,clip.film.through,written);
  }
  encoder.stdin.end();
  const [code]=await closed;
  assert.equal(code,0);
  assert.equal(written,log.frames);
  await rename(intermediate,output);
  console.log(basename(output),written,'physics frames');
}finally{
  if(encoder && encoder.exitCode===null)encoder.kill();
  await browser.close();
  await rm(intermediate,{force:true});
  await rmdir(temp);
}
