const closingVoice = $('closingVoice');
const rescue = (() => {
  const canvas = $('rescueScene'), ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const sites = [
    {id:'A', name:'入口', surface:168, x:.205, y:.738, station:[.249,.873]},
    {id:'B', name:'设备箱', surface:64, x:.545, y:.738, station:[.56,.885], hidden:true},
    {id:'C', name:'东侧碎石', surface:192, x:.855, y:.706, station:[.818,.855]}
  ];
  const rubble = [{x:.414,y:.832,rx:.067,ry:.055}, {x:.714,y:.787,rx:.060,ry:.055}];
  const robot = {x:.067, y:.895, facing:1};
  const marks = new Map(), exposure = new Map();
  let route = [], target = null, thermal = false, paused = false, sent = false;
  let packet = null, acknowledgement = 0;
  let clock = 0, stride = 0, thermalPlate, status = '', tracking = null, dangerPulse = null;
  const distance = (a,b) => Math.hypot(a.x-b.x,(a.y-b.y)*H/W);
  const ellipse = (x,y,ob) => ((x-ob.x)/ob.rx)**2+((y-ob.y)/ob.ry)**2 < 1;

  function blocked(x,y) {
    return sites.some(s=>ellipse(x,y,{...s,rx:.082,ry:.098})) || rubble.some(ob=>ellipse(x,y,ob));
  }
  function walkable(x,y) { return x>=.035 && x<=.969 && y>=.759 && y<=.963 && !blocked(x,y); }
  function clearLine(a,b) {
    const count=Math.max(2,Math.ceil(distance(a,b)/.008));
    for(let i=1;i<=count;i++) if(!walkable(mix(a.x,b.x,i/count),mix(a.y,b.y,i/count)))return false;
    return true;
  }
  // The navigation grid covers the walkable floor. Fire exclusion zones and rubble use
  // the same geometry for routing, click rejection and the visible ground markings.
  function plan(goal) {
    if(!walkable(goal.x,goal.y))return null;
    if(clearLine(robot,goal))return [goal];
    const columns=65, rows=13;
    const pos=id=>({x:.04+(id%columns)*.0145,y:.761+Math.floor(id/columns)*.0164});
    const nearest=p=>clamp(Math.round((p.x-.04)/.0145),0,columns-1)+columns*clamp(Math.round((p.y-.761)/.0164),0,rows-1);
    const start=nearest(robot), queue=[start], parent=new Map([[start,-1]]);
    for(let i=0;i<queue.length;i++){
      const id=queue[i], from=id===start?robot:pos(id);
      if(clearLine(from,goal)){
        const path=[goal]; let n=id;
        while(n!==start){path.unshift(pos(n));n=parent.get(n);}
        const turns=[]; let origin=robot;
        for(let k=0;k<path.length;){
          let last=k;
          while(last+1<path.length && clearLine(origin,path[last+1]))last++;
          turns.push(path[last]);origin=path[last];k=last+1;
        }
        return turns;
      }
      for(const delta of [-1,1,-columns,columns,-columns-1,-columns+1,columns-1,columns+1]){
        const next=id+delta;
        if(next<0||next>=columns*rows||Math.abs(next%columns-id%columns)>1||parent.has(next))continue;
        if(clearLine(from,pos(next))){parent.set(next,id);queue.push(next);}
      }
    }
    return null;
  }
  function tell(s) { if(s!==status){status=s;text('patrolStatus',s);} }
  function controls(){
    text('patrolCount','已标记 '+marks.size+' / '+sites.length);
    $('normalView').setAttribute('aria-pressed',String(!thermal));
    $('heatView').setAttribute('aria-pressed',String(thermal));show('heatScale',thermal);
    show('patrolPause',!sent);text('patrolPause',paused?'继续巡检':'暂停巡检');show('sendReport',canReport());
    $('normalView').disabled=$('heatView').disabled=!!packet;
    for(const [i,b] of [...document.querySelectorAll('.waypoints button')].entries()){
      const site=sites[i];b.textContent=site.id+' '+(marks.has(site.id)?'✓':'点');
      b.disabled=!!packet;b.classList.toggle('marked',marks.has(site.id));b.setAttribute('aria-current',String(target===site));
      b.setAttribute('aria-label',site.id+' '+site.name+'观察点'+(marks.has(site.id)?'，已标记':''));
    }
    $('next').disabled=idx===7 && !canReport();
  }
  function moveTo(goal,site=null){
    if(packet)return;
    const next=plan(goal);
    if(!next){dangerPulse={...goal,time:clock};tell('此处无法通行。请从安全观察点接近。');draw();return;}
    target=site;route=next;tracking=null;
    if(paused)resume();
    tell(site?'正在前往 '+site.id+' 点。':'正在沿可通行地面移动。');controls();
  }
  function select(i){const s=sites[i];moveTo({x:s.station[0],y:s.station[1]},s);}
  function setView(v){
    if(packet)return;
    thermal=v;tracking=null;controls();draw();
    if(paused){tell('巡检已暂停，可对照两个视角。');return;}
    if(!route.length)tell(thermal?'靠近热迹，保持观察即可标记。':'普通视觉只能直接看见明火。');
  }
  function surfaceTemperature(s){
    const flicker=s.hidden?1.1:9;
    return s.surface+flicker*Math.sin(clock*(s.hidden ? .8 : 4.4)+s.x*11);
  }
  function sensorReading(s){
    const range=distance(robot,s);
    if(range>.116)return null;
    // A larger footprint at range mixes hot surface and cooler surroundings.
    const ambient=24, fill=1-.32*(range/.116)**2;
    return ambient+(surfaceTemperature(s)-ambient)*fill;
  }
  function scan(dt){
    if(!thermal)return;
    const nearby=sites.filter(s=>!marks.has(s.id)&&(sensorReading(s)??0)>=45);
    const s=nearby.sort((a,b)=>distance(robot,a)-distance(robot,b))[0];
    if(!s){tracking=null;return;}
    tracking=s;
    const value=Math.min(1,(exposure.get(s.id)||0)+dt/1.25);
    exposure.set(s.id,value);
    const temperature=Math.round(sensorReading(s));
    if(value<1){tell(s.name+' · 表面约 '+temperature+' °C，正在确认热迹。');return;}
    const type=temperature>=90&&!s.hidden?'明火':'外壳余热';
    marks.set(s.id,{location:s.name,type,temperature});tracking=null;
    tell(marks.size===3?'三处热源已定位，可以把位置发给救援队。':s.name+'已标记：'+type+'。');controls();
  }
  function step(dt){
    clock+=dt;
    if(packet){
      acknowledgement+=dt;draw();
      if(acknowledgement>=1.7)closeScene();
      return;
    }
    let budget=dt*.155;
    while(route.length&&budget>0){
      const p=route[0], d=distance(robot,p);
      if(Math.abs(p.x-robot.x)>.001)robot.facing=Math.sign(p.x-robot.x);
      if(d<=budget){robot.x=p.x;robot.y=p.y;route.shift();budget-=d;}
      else {robot.x=mix(robot.x,p.x,budget/d);robot.y=mix(robot.y,p.y,budget/d);budget=0;}
      stride+=Math.min(d,dt*.155)*47;
      if(!route.length)tell(marks.size===3?'三处热源已定位，可以回传。':thermal?'已就位，正在观察。':'已就位。切换热成像，看看表面温差。');
    }
    if(!route.length)scan(dt);
    draw();
  }
  function plate(c) {
    const im=assets.corridor;
    if(!im?.naturalWidth)return;
    const height=im.naturalWidth*H/W;
    c.drawImage(im,0,im.naturalHeight-height,im.naturalWidth,height,0,0,W,H);
  }
  function infraredPlate(){
    if(thermalPlate || !assets.corridor?.naturalWidth)return thermalPlate;
    const buffer=document.createElement('canvas');buffer.width=W;buffer.height=H;
    const c=buffer.getContext('2d');plate(c);
    const pixels=c.getImageData(0,0,W,H), p=pixels.data;
    for(let i=0;i<p.length;i+=4){
      const v=(.22*p[i]+.58*p[i+1]+.2*p[i+2])/255;
      p[i]=15+v*74;p[i+1]=18+v*57;p[i+2]=49+v*110;
    }
    c.putImageData(pixels,0,0);thermalPlate=buffer;return buffer;
  }
  function rock(ob){
    const x=ob.x*W,y=ob.y*H,rx=ob.rx*W*.78,ry=ob.ry*H*.77;
    ctx.fillStyle='#11182a65';ctx.beginPath();ctx.ellipse(x+rx*.12,y+ry*.15,rx*.94,ry*.3,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=thermal?'#343363':'#464c65';ctx.strokeStyle=thermal?'#686093':'#1c253a';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(x-rx,y);ctx.lineTo(x-rx*.61,y-ry);ctx.lineTo(x+rx*.20,y-ry*1.15);
    ctx.lineTo(x+rx,y-ry*.18);ctx.lineTo(x+rx*.72,y+ry*.17);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=thermal?'#494574':'#627089';ctx.beginPath();ctx.moveTo(x-rx*.61,y-ry);
    ctx.lineTo(x+rx*.2,y-ry*1.15);ctx.lineTo(x+rx*.54,y-ry*.5);ctx.lineTo(x-rx*.7,y-ry*.28);ctx.closePath();ctx.fill();
    ctx.strokeStyle=thermal?'#8074a3':'#99a4bb';ctx.beginPath();ctx.moveTo(x-rx*.58,y-ry+.5);ctx.lineTo(x+rx*.2,y-ry*1.1);ctx.lineTo(x+rx*.56,y-ry*.48);ctx.stroke();
  }
  function fire(s){
    const x=s.x*W,y=s.y*H;
    if(s.hidden){
      ctx.fillStyle=thermal?'#59406d':'#43576a';ctx.strokeStyle=thermal?'#a07091':'#203444';ctx.lineWidth=4;
      ctx.fillRect(x-47,y-47,94,47);ctx.strokeRect(x-47,y-47,94,47);
      for(let i=0;i<4;i++){ctx.fillStyle=thermal?'#b66c79':'#283845';ctx.fillRect(x-30,y-35+i*7,57,3);}
    }
    if(thermal||!s.hidden){
      const h=(s.hidden?38:75)*(surfaceTemperature(s)/s.surface);const gy=y-h*.42;
      const glow=ctx.createRadialGradient(x,gy,2,x,gy,h*1.05);
      glow.addColorStop(0,thermal?'#ffea91f0':'#ffb43ca9');glow.addColorStop(.34,thermal?'#ff7139c0':'#ff762e67');glow.addColorStop(1,'#ef325700');
      ctx.fillStyle=glow;ctx.fillRect(x-h*1.1,gy-h*1.1,h*2.2,h*2.2);
    }
    if(!s.hidden)for(let i=0;i<5;i++){
      const bx=x+(i-2)*11, t=clock*4+i*1.7+x;
      const h=44+20*Math.sin(t*.78)**2+(2-Math.abs(i-2))*12, sway=9*Math.sin(t);
      ctx.fillStyle=i%2?'#ffb63f':'#ff672f';ctx.beginPath();ctx.moveTo(bx-13,y);
      ctx.bezierCurveTo(bx-27,y-h*.38,bx+12,y-h*.62,bx+sway,y-h);
      ctx.bezierCurveTo(bx+30,y-h*.3,bx+13,y-15,bx+12,y);ctx.closePath();ctx.fill();
      ctx.fillStyle='#fff0a5';ctx.beginPath();ctx.ellipse(bx,y-12,5,15,-.2,0,Math.PI*2);ctx.fill();
    }
    if(!s.hidden)for(let i=0;i<6;i++){
      const f=(clock*(.31+.024*i)+i*.173+s.x)%1;
      const bx=x+Math.sin(i*2.47+f*4)*15+f*10, by=y-29-85*f;
      ctx.fillStyle='rgba(255,202,114,'+(1-f)*.85+')';ctx.beginPath();
      ctx.ellipse(bx,by,1.6,2.8,-.2,0,Math.PI*2);ctx.fill();
    }
    if(!s.hidden||thermal||marks.has(s.id)){
      ctx.save();ctx.setLineDash([9,7]);ctx.strokeStyle=thermal?'#ffa372b8':'#ffc385b8';ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(x,y,.082*W,.098*H,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
  }
  function draw(){
    ctx.clearRect(0,0,W,H);
    if(thermal && infraredPlate())ctx.drawImage(thermalPlate,0,0);else plate(ctx);
    for(const s of sites)fire(s);
    for(const ob of rubble)rock(ob);
    const x=robot.x*W,y=robot.y*H,h=134+(robot.y-.80)*165;
    if(route.length){
      ctx.save();ctx.strokeStyle='#b6f2e2be';ctx.setLineDash([5,10]);ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(x,y);route.forEach(p=>ctx.lineTo(p.x*W,p.y*H));ctx.stroke();ctx.restore();
    }
    ctx.fillStyle='#0c142777';ctx.beginPath();ctx.ellipse(x,y+2,h*.29,7,0,0,Math.PI*2);ctx.fill();
    const key=route.length?'run'+Math.floor(stride)%6:'standing';
    ctx.save();ctx.translate(x,y);ctx.scale(robot.facing,1);drawRunner(ctx,key,0,0,h,0,S.gear);ctx.restore();
    if(thermal){
      const angle=tracking?Math.atan2(tracking.y*H-y+h*.69,tracking.x*W-x):(robot.facing<0?Math.PI:0)+Math.sin(clock*1.9)*.45;
      const fromY=y-h*.69, len=W*.12;
      const beam=ctx.createRadialGradient(x,fromY,0,x,fromY,len);
      beam.addColorStop(0,'#9ffffd99');beam.addColorStop(1,'#a5fff508');
      ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(x,fromY);ctx.arc(x,fromY,len,angle-.18,angle+.18);ctx.closePath();ctx.fill();
    }
    for(const s of sites){
      const x=s.x*W,y=s.y*H-83;
      if(tracking===s){ctx.strokeStyle='#eaffad';ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y,18,-Math.PI/2,-Math.PI/2+2*Math.PI*(exposure.get(s.id)||0));ctx.stroke();}
      if(!marks.has(s.id))continue;
      const reading=marks.get(s.id);
      ctx.save();ctx.font='bold 21px "Microsoft YaHei", sans-serif';
      const msg=s.id+' · '+reading.type+(thermal?'  '+reading.temperature+'°':'');
      const w=ctx.measureText(msg).width+26;ctx.fillStyle='#102d3bf2';ctx.fillRect(x-w/2,y-26,w,36);
      ctx.fillStyle='#a2f3d2';ctx.textAlign='center';ctx.fillText(msg,x,y);ctx.restore();
    }
    if(dangerPulse && clock-dangerPulse.time<1.2){
      ctx.strokeStyle='#ff9369';ctx.lineWidth=5;ctx.beginPath();ctx.arc(dangerPulse.x*W,dangerPulse.y*H,20,0,Math.PI*2);ctx.stroke();
    }
  }
  function canReport(){return marks.size===sites.length&&!packet;}
  function speak(){closingVoice.currentTime=0;closingVoice.play().catch(()=>say('让科技抵达危险，让生命远离危险。'));}
  function report(){
    if(!canReport())return;
    packet=sites.map(s=>({...marks.get(s.id),id:s.id,position:[s.x,s.y]}));
    route=[];tracking=null;paused=false;acknowledgement=0;
    tell('救援队已收到：'+packet.map(m=>m.location+m.type).join('、')+'。');
    controls();task('rescue',step);
  }
  function closeScene(){
    sent=true;task('rescue',null);show('patrol',false);show('closing');controls();
    if(window.speechSynthesis)speechSynthesis.cancel();
    if(voice)speak();
  }
  function pause(){if(sent||idx!==7)return;paused=true;task('rescue',null);controls();tell('巡检已暂停。');}
  function resume(){if(sent)return;paused=false;task('rescue',step);controls();tell(packet?'救援队已收到三处热源的位置。':'巡检继续。');}
  function enter(){controls();if(!sent&&!paused)task('rescue',step);if(!sent)draw();}
  sites.forEach((s,i)=>{
    const b=document.createElement('button');
    b.style.left=s.station[0]*100+'%';b.style.top=(s.station[1]+.025)*100+'%';
    b.onclick=()=>select(i);document.querySelector('.waypoints').append(b);
  });
  canvas.addEventListener('click',e=>{
    const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
    moveTo({x,y});
  });
  btn('normalView',()=>setView(false));btn('heatView',()=>setView(true));
  btn('patrolPause',()=>paused?resume():pause());btn('sendReport',report);btn('readClosing',speak);
  document.addEventListener('keydown',e=>{
    if(idx!==7||sent||!$('help').hidden||!$('detailModal').hidden||e.repeat||e.altKey||e.ctrlKey||e.metaKey)return;
    if('123'.includes(e.key)&&e.key.length===1){e.preventDefault();select(Number(e.key)-1);}
    if(e.key.toLowerCase()==='t'){e.preventDefault();setView(!thermal);}
  });
  return {enter,pause,canReport,report,speak,finished:()=>sent,
    snapshot:()=>({position:{x:robot.x,y:robot.y},thermal,paused,sent,moving:!!route.length,marks:[...marks.values()],report:packet})};
})();
