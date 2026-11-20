import {MotionRenderer} from './render.js';
import {isReplayableRace,raceFrameView,raceScoreText} from './race-record.js';
import {DT,STATE_NAMES} from './world.js';

const FPS=30;
const TICKS_PER_FRAME=1/(DT*FPS);
const RESULT_HOLD_MS=1600;
const VIDEO_TYPES=['video/webm;codecs=vp8','video/webm;codecs=vp9','video/webm',
  'video/mp4;codecs=avc1.42001E','video/mp4'];

export function raceVideoTick(record,elapsedMs) {
  const end=record.presentation.tick;
  if(elapsedMs>=end*DT*1000)return end;
  return Math.max(0,Math.floor(elapsedMs*FPS/1000)*TICKS_PER_FRAME);
}

export function raceVideoCaption(record,frame) {
  const {score,track}=record;
  if(frame.tick===record.presentation.tick){
    return {title:'本场成绩',detail:raceScoreText(score,track.distance),result:true};
  }
  const segment=track.segments.find(segment=>segment.id===frame.scene).name;
  const distance=Math.min(track.distance,Math.max(0,frame.x));
  const title=`${segment}　·　${distance.toFixed(1)} / ${track.distance} m　·　画面 ${frame.time.toFixed(2)} 秒`;
  const recent=record.events.findLast(event=>event.tick<=frame.tick&&frame.tick-event.tick<=1/DT&&
    (event.type==='collision'||event.type==='obstacle-pass'));
  const eventText=recent?.type==='collision'?`碰撞 · ${recent.reason}`:recent?`越障 ${recent.passed}`:'';
  const locked=frame.tick>=score.tick&&score.outcome!=='aborted';
  const lockText=locked?`成绩锁定 ${score.time.toFixed(2)} 秒`:'';
  const detail=[STATE_NAMES[frame.state],eventText,lockText].filter(Boolean).join(' · ');
  return {title,detail,result:false};
}

function videoFormat() {
  if(typeof HTMLCanvasElement.prototype.captureStream!=='function'||
    typeof globalThis.MediaRecorder?.isTypeSupported!=='function')return null;
  return VIDEO_TYPES.find(type=>MediaRecorder.isTypeSupported(type))??null;
}

function extension(type) {
  if(type.startsWith('video/webm'))return 'webm';
  if(type.startsWith('video/mp4'))return 'mp4';
  return null;
}

async function hasContainerHeader(blob) {
  const bytes=new Uint8Array(await blob.slice(0,12).arrayBuffer());
  const format=extension(blob.type);
  if(format==='webm')return [0x1a,0x45,0xdf,0xa3].every((byte,i)=>bytes[i]===byte);
  return format==='mp4'&&[0x66,0x74,0x79,0x70].every((byte,i)=>bytes[i+4]===byte);
}

function drawVideoFrame(renderer,record,tick) {
  const frame=raceFrameView(record,tick);
  renderer.draw(frame);
  const caption=raceVideoCaption(record,frame);
  const {ctx,width,height,canvas}=renderer;
  ctx.fillStyle=caption.result?'#163a32':'#171f30';
  ctx.fillRect(0,height,width,canvas.height-height);
  ctx.fillStyle=caption.result?'#adf1d3':'#eef2ff';
  ctx.font='bold 30px system-ui, "Microsoft YaHei", sans-serif';
  ctx.fillText(caption.title,32,height+43,width-64);
  ctx.fillStyle='#eef2ff';
  ctx.font='24px system-ui, "Microsoft YaHei", sans-serif';
  ctx.fillText(caption.detail,32,height+82,width-64);
}

function recordVideo(record,mimeType,signal,onProgress) {
  return new Promise((resolve,reject)=>{
    let stream,track,recorder,raf,finalizeTimeout,resultSince;
    let closed=false,fullyDrawn=false;
    const chunks=[];
    const end=record.presentation.tick;
    const duration=end*DT*1000;

    function settle(error,blob){
      if(closed)return;
      closed=true;
      cancelAnimationFrame(raf);
      clearTimeout(finalizeTimeout);
      signal.removeEventListener('abort',abort);
      if(recorder){
        recorder.ondataavailable=recorder.onerror=recorder.onstop=null;
        if(recorder.state!=='inactive')try{recorder.stop();}catch{}
      }
      track?.removeEventListener('ended',trackEnded);
      stream?.getTracks().forEach(track=>track.stop());
      if(error)reject(error);
      else resolve(blob);
    }
    const abort=()=>settle(signal.reason);
    const trackEnded=()=>settle(new Error('录制轨道提前结束。'));

    try{
      signal.throwIfAborted();
      const canvas=document.createElement('canvas');
      // The renderer draws its usual 1200 × 610 desktop view. The bottom strip is reserved for captions.
      canvas.width=1200;
      canvas.height=720;
      const renderer=new MotionRenderer(canvas);
      stream=canvas.captureStream(FPS);
      track=stream.getVideoTracks()[0];
      if(!track)throw new Error('浏览器未提供 Canvas 视频轨道。');
      track.addEventListener('ended',trackEnded);
      recorder=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:4_000_000});
      recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
      recorder.onerror=()=>settle(new Error('浏览器中断了视频编码。'));
      recorder.onstop=async()=>{
        try{
          if(!fullyDrawn)throw new Error('录制在比赛画面结束前停止。');
          const type=chunks.find(chunk=>chunk.type)?.type||recorder.mimeType;
          const blob=new Blob(chunks,{type});
          if(!await hasContainerHeader(blob))throw new Error('浏览器没有生成有效的视频数据。');
          settle(null,blob);
        }catch(error){settle(error);}
      };
      signal.addEventListener('abort',abort,{once:true});
      recorder.start();
      drawVideoFrame(renderer,record,0);
      const started=performance.now();
      let previousTick=0,previousFrame=0;
      function advance(now){
        try{
          const elapsed=Math.max(0,now-started);
          const frameNumber=Math.floor(elapsed*FPS/1000);
          const tick=raceVideoTick(record,elapsed);
          if(tick!==previousTick||(tick===end&&frameNumber!==previousFrame)){
            // Paint the end card throughout the hold so captureStream has timestamped frames.
            drawVideoFrame(renderer,record,tick);
            previousTick=tick;
          }
          previousFrame=frameNumber;
          if(tick===end)resultSince??=now;
          const hold=resultSince===undefined?0:now-resultSince;
          onProgress(Math.min(1,(Math.min(elapsed,duration)+hold)/(duration+RESULT_HOLD_MS)));
          if(hold>=RESULT_HOLD_MS){
            fullyDrawn=true;
            finalizeTimeout=setTimeout(()=>settle(new Error('浏览器保存视频超时。')),5000);
            recorder.stop();
          }else raf=requestAnimationFrame(advance);
        }catch(error){settle(error);}
      }
      raf=requestAnimationFrame(advance);
    }catch(error){settle(error);}
  });
}

export function createRaceVideo(panel,visible) {
  const find=id=>panel.querySelector(`#${id}`);
  const start=find('exportVideo'),cancelButton=find('cancelVideo'),progress=find('videoProgress');
  const download=find('downloadVideo'),status=find('videoStatus');
  let record=null,active=null,url=null,format=null;

  function clearDownload(){
    if(url)URL.revokeObjectURL(url);
    url=null;
    download.hidden=true;
    download.removeAttribute('href');
  }
  function updateControls(){
    start.disabled=!record||!format||active!==null;
    cancelButton.hidden=progress.hidden=active===null;
  }
  function cancel(message){
    if(active||url)status.textContent=message;
    active?.abort();
    active=null;
    clearDownload();
    updateControls();
  }

  start.addEventListener('click',async()=>{
    if(!record||!format||active||!visible())return;
    clearDownload();
    const controller=new AbortController();
    const source=record;
    active=controller;
    status.textContent='正在准备视频…';
    progress.value=0;
    updateControls();
    try{
      const blob=await recordVideo(source,format,controller.signal,fraction=>{
        const label=fraction===1?'正在保存视频…':'正在录制，请保持页面可见。';
        if(status.textContent!==label)status.textContent=label;
        progress.value=fraction;
      });
      if(active!==controller)return;
      const suffix=extension(blob.type);
      url=URL.createObjectURL(blob);
      download.href=url;
      download.download=`robotcoach-race-${source.track.seed}-${source.score.outcome}.${suffix}`;
      download.hidden=false;
      status.textContent=`${suffix.toUpperCase()} 视频已就绪。`;
    }catch{
      if(active===controller)status.textContent='录制失败或无法生成有效视频。仍可回看比赛或下载 JSON。';
    }finally{
      if(active===controller){
        active=null;
        updateControls();
      }
    }
  });
  cancelButton.addEventListener('click',()=>cancel('已取消视频导出。'));

  return {
    setRecord(next){
      cancel('');
      record=isReplayableRace(next)?next:null;
      try{format=videoFormat();}catch{format=null;}
      status.textContent=!record?'当前标签页没有完整记录。完成一场比赛后即可尝试导出视频。':
        !format?'此浏览器没有可用的视频录制格式。仍可回看比赛或下载 JSON。':
          '视频按比赛原速录制，目标 30 fps。导出时请保持当前页面可见。';
      updateControls();
    },
    cancel,
  };
}
