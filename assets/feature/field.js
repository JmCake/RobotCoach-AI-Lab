import {describePoint,ROAD_COLOR,WATER,SEGMENT_SIZE} from '../vision/observations.js';
import {samples} from '../vision/samples.js';

export async function openField({$,begin,info,main,btn,wipe,surface,mark,isPaused,onEnd}){
  const photo=new Image();photo.src=new URL('../vision/samples/jiuzhaigou.webp',import.meta.url).href;
  await photo.decode();wipe();begin('field');surface('ground');
  const canvas=$('ground'),ctx=canvas.getContext('2d');
  canvas.width=1280;canvas.height=720;canvas.tabIndex=0;
  const scale=Math.max(canvas.width/photo.width,canvas.height/photo.height);
  const w=photo.width*scale,h=photo.height*scale,left=(canvas.width-w)/2,top=(canvas.height-h)/2;
  const corrections=[],point={x:.5,y:.6};let selected=false,busy=false,result=null,mask=null,overlay=true,worker=null;
  const mapping=()=>({x:Math.max(0,Math.min(.99999,(point.x*1280-left)/w)),y:Math.max(0,Math.min(.99999,(point.y*720-top)/h))});
  const at=()=>{const {x,y}=mapping(),i=Math.floor(y*SEGMENT_SIZE)*SEGMENT_SIZE+Math.floor(x*SEGMENT_SIZE);return describePoint(result.labels[i],result.roadMask[i]);};
  function draw(){
    ctx.drawImage(photo,left,top,w,h);
    if(result&&overlay)ctx.drawImage(mask,left,top,w,h);
    for(const p of corrections){ctx.fillStyle='#ffe499';ctx.fillRect(p.x*1280-4,p.y*720-4,8,8);}
    if(selected){
      const x=1280*point.x,y=720*point.y;
      ctx.beginPath();ctx.arc(x,y,14,0,Math.PI*2);ctx.strokeStyle='#1c2335';ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle='#ffde79';ctx.lineWidth=3.5;ctx.stroke();
      ctx.fillStyle='white';ctx.fillRect(x-2,y-2,4,4);
    }
  }
  function display(){
    draw();$('choices').replaceChildren();
    if(!result){
      info('第三关　/　九寨沟 · 现场观察','你会让它把下一步落在哪里？',busy?'正在这张照片上运行本地模型……':'在原图上点选；也可以聚焦图片，用方向键移动、回车确认。');
      const b=main(busy?'正在识别…':'看看 AI 的判断',infer);b.disabled=!selected||busy;
    }else{
      const match=corrections.findLast(p=>Math.hypot(p.x-point.x,p.y-point.y)<.012);
      info('第三关　/　人与 AI 核对','这个落脚点，模型看对了吗？','AI 读数　'+at()+(match?'　·　人工标记　'+match.label:'　·　绿色为连通路面候选，蓝色为水面，橙色为障碍。'));
      btn(overlay?'对照原图':'查看识别层',()=>{overlay=!overlay;display();});
      const s=document.createElement('select');s.setAttribute('aria-label','人工纠错');
      for(const text of ['人工纠错…','路面','水面','障碍','无法确认'])s.add(new Option(text));
      s.onchange=()=>{if(!s.selectedIndex||isPaused())return;corrections.push({...point,...{original:mapping(),model:at(),label:s.value}});display();};$('choices').append(s);
      main('结束现场观察',()=>{
        worker?.terminate();canvas.onclick=canvas.onkeydown=null;
        onEnd({point:mapping(),model:at(),corrections,connectedPixels:result.roadCount});
      });
    }
    const credit=document.createElement('a');credit.className='quiet';credit.textContent='摄影 rheins · CC BY 3.0';
    credit.href='https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(samples.find(p=>p.file==='jiuzhaigou.webp').credit.title.replaceAll(' ','_'));
    credit.target='_blank';credit.rel='noopener';$('choices').append(credit);
  }
  function infer(){
    if(!selected||busy)return;busy=true;display();
    const c=document.createElement('canvas');c.width=c.height=SEGMENT_SIZE;const x=c.getContext('2d');x.drawImage(photo,0,0,c.width,c.height);
    const rgba=x.getImageData(0,0,c.width,c.height).data;
    worker=new Worker(new URL('../vision/model.worker.js',import.meta.url),{type:'module'});
    function fail(){worker.terminate();busy=false;display();$('notice').textContent='模型读取失败，可以保留落脚点，点击重试。';}
    worker.onerror=fail;worker.onmessage=({data})=>{
      if(data.error){fail();return;}
      $('notice').textContent='';result=data;busy=false;worker.terminate();
      mask=document.createElement('canvas');mask.width=mask.height=SEGMENT_SIZE;const pixels=data.pixels;
      for(let i=0;i<data.labels.length;i++){
        if(data.roadMask[i])pixels.set(ROAD_COLOR,i*4);
        else if(data.labels[i]===WATER)pixels.set([32,144,250,105],i*4);
      }
      mask.getContext('2d').putImageData(new ImageData(pixels,SEGMENT_SIZE,SEGMENT_SIZE),0,0);
      mark('field-result');display();
    };
    worker.postMessage({kind:'segment',rgba},[rgba.buffer]);
  }
  canvas.onclick=e=>{if(isPaused()||busy)return;const r=canvas.getBoundingClientRect();point.x=(e.clientX-r.left)/r.width;point.y=(e.clientY-r.top)/r.height;selected=true;display();};
  canvas.onkeydown=e=>{
    if(isPaused()||busy)return;
    const dx={ArrowLeft:-.025,ArrowRight:.025}[e.key]??0,dy={ArrowUp:-.025,ArrowDown:.025}[e.key]??0;
    if(!dx&&!dy&&e.key!=='Enter')return;e.preventDefault();point.x=Math.max(.005,Math.min(.995,point.x+dx));point.y=Math.max(.005,Math.min(.995,point.y+dy));selected=true;display();
  };
  display();
}
