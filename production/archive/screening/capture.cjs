const path=require('node:path'),fs=require('node:fs'),{spawn}=require('node:child_process');
const ff='ffmpeg';
exports.start=async function(page,dir){
  fs.mkdirSync(dir,{recursive:true});
  const video=path.join(dir,'projector.mp4'),fps=24;
  const encoder=spawn(ff,['-loglevel','error','-y','-f','image2pipe','-framerate',String(fps),'-vcodec','mjpeg','-i','pipe:0','-c:v','libx264','-threads','3','-preset','veryfast','-crf','22','-pix_fmt','yuv420p','-movflags','+faststart',video],{windowsHide:true,stdio:['pipe','ignore','inherit']});
  const done=new Promise((ok,fail)=>{encoder.on('error',fail);encoder.on('close',code=>code===0?ok():fail(new Error('capture encoder '+code)));});
  const session=await page.context().newCDPSession(page);
  let first,emitted=0,previous;
  function flush(now){
    if(!previous)return;
    const target=Math.round((now-first)*fps/1000);
    while(emitted<target){encoder.stdin.write(previous);emitted++;}
  }
  session.on('Page.screencastFrame',event=>{
    session.send('Page.screencastFrameAck',{sessionId:event.sessionId}).catch(()=>{});
    const now=Date.now();first??=now;flush(now);previous=Buffer.from(event.data,'base64');
  });
  await session.send('Page.startScreencast',{format:'jpeg',quality:83,maxWidth:1280,maxHeight:800,everyNthFrame:1});
  return async()=>{await session.send('Page.stopScreencast');flush(Date.now());encoder.stdin.end();await done;return {video,first};};
};
