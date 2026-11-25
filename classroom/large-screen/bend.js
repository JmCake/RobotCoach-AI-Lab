// All three incident beats use one camera on the same V6 stadium painting.
const bendCanvas = $('bendScene');
let bendTime = 0, bendPlaying = false;
const fallDuration = 4.8;
const bendLane = [
  [0, .53, .87, .33], [.23, .45, .73, .29], [.50, .37, .59, .24],
  [.72, .315, .495, .19], [.88, .246, .445, .145], [1, .145, .413, .085]
];

function lanePoint(p) {
  const n = clamp(p, 0, 1);
  const i = bendLane.findIndex(row => row[0] >= n);
  if (i === 0) return bendLane[0].slice(1);
  const a = bendLane[i - 1], b = bendLane[i];
  const t = (n - a[0]) / (b[0] - a[0]);
  return a.slice(1).map((v, k) => mix(v, b[k + 1], t));
}

function stadiumView(canvas, zoom) {
  const c = canvas.getContext('2d'), bg = assets.curve;
  if (!bg?.naturalWidth) return;
  const w = canvas.width, h = canvas.height;
  const scale = Math.max(w / bg.naturalWidth, h / bg.naturalHeight);
  const iw = bg.naturalWidth * scale, ih = bg.naturalHeight * scale;
  const ox = (w - iw) / 2, oy = (h - ih) * .64;
  const focusX = ox + iw * .43, focusY = oy + ih * .63;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, w, h);
  c.save();
  c.translate(focusX, focusY); c.scale(zoom, zoom); c.translate(-focusX, -focusY);
  c.drawImage(bg, ox, oy, iw, ih);
  return {c, iw, ih, ox, oy};
}

function drawRunner(c, key, x, ground, height, angle, gear, opacity = 1) {
  const im = assets[key];
  if (!im?.naturalWidth || opacity <= 0) return;
  const width = height * im.naturalWidth / im.naturalHeight;
  c.save(); c.globalAlpha = opacity;
  c.translate(x, ground); c.rotate(angle);
  c.drawImage(im, -width / 2, -height, width, height);
  if (gear) {
    const low = key.startsWith('fall') || key === 'bank';
    const headX = low ? -.19 : 0;
    for (const [part, dx, dy, fraction] of [
      ['lidar', headX, -.94, .17], ['imu', headX, -.58, .16],
      ['force', -.10, -.07, .14], ['camera', headX+.035, -.82, .09]
    ]) {
      const module = assets[part];
      if (!gear[part] || !module?.naturalWidth) continue;
      const size = height * fraction;
      c.drawImage(module, dx * width - size/2, dy * height, size, size * module.naturalHeight / module.naturalWidth);
    }
  }
  c.restore();
}

function bendPose(canvas, {progress, phase, fall, drift, gear, tilt, clue, zoom}) {
  const view = stadiumView(canvas, zoom);
  if (!view) return;
  const {c, iw, ih, ox, oy} = view;
  const [u, v, size] = lanePoint(progress);
  const x = ox + (u + drift) * iw, g = oy + v * ih, h = ih * size;
  c.fillStyle = '#22172155'; c.beginPath(); c.ellipse(x, g + 2, h * (.23 + fall * .17), h * .033, 0, 0, Math.PI*2); c.fill();
  const bank = smooth(clamp(fall * 3, 0, 1));
  const down = smooth(clamp((fall - .3) / .52, 0, 1));
  drawRunner(c, 'rear' + Math.floor(phase) % 4, x, g, h, tilt, gear, 1 - bank);
  drawRunner(c, 'bank', x, g, h * .69, tilt - .13, gear, bank * (1 - down));
  drawRunner(c, 'fall' + Math.min(2, Math.floor(down * 3)), x, g, h * .68, -.32 * down, gear, down);
  if (clue) {
    const offset = {camera:[-.34,-.48], imu:[-.19,-.39], force:[-.29,-.08]}[clue];
    const cx = x + offset[0]*h, cy = g + offset[1]*h;
    c.strokeStyle='#12233a'; c.lineWidth=8; c.beginPath(); c.arc(cx,cy,h*.12,0,Math.PI*2); c.stroke();
    c.lineWidth=4; c.strokeStyle='#eafb71'; c.stroke();
  }
  c.restore();
}

function drawPosterRobot(id, key, gear) {
  const canvas=$(id), c=canvas.getContext('2d');
  c.clearRect(0,0,canvas.width,canvas.height);
  drawRunner(c,key,canvas.width/2,canvas.height,canvas.height,0,gear);
}

function paintIncident() {
  if (!ready) return;
  const f = smooth((bendTime - 2.25) / 1.85);
  const stop = base.result.distance / base.distance;
  bendPose(bendCanvas, {
    progress:mix(trialBend.start/base.distance,stop,smooth(bendTime/3.75)), phase:bendTime*6,
    fall:f, drift:(.04+base.lateral*.026)*f, gear:base.sensors, tilt:-.06*f, clue:S.incident ? S.cause : null,
    zoom:1 + .29*smooth((bendTime-2.25)/2.3)
  });
}

function drawTrialBend(canvas, w) {
  const segment = w.track?.segmentAt(w.x);
  const progress = segment ? (w.x-segment.start)/(segment.end-segment.start) : w.x/w.distance;
  const fail = w.result && !w.result.success ? 1 : clamp((Math.abs(w.theta)-.32)/.55, 0, .76);
  bendPose(canvas, {progress, phase:w.phase*5, fall:fail, drift:clamp(w.lateral||0,-2,2)*.026+.04*fail,
    gear:w.sensors, tilt:clamp(w.theta,-.52,.52)*.55, zoom:1, clue:null});
}

const causeText = {
  camera:'看看面罩朝向，再对照跑道的白线。', imu:'看看两肩的高度和上身的倾斜。',
  force:'看看哪只脚先离地，哪只手先撑地。'
};
function setIncident(n) {
  S.incident = n;
  $('incidentFrame').dataset.step=String(n);
  show('incidentQuestion'); show('predictChoices',!n); show('causeChoices',!!n);
  show('bendPause',false); show('incidentReset',!!n);
  text('incidentLabel', n?'第一关 · 事故定格':'第一关 · 入弯现场');
  text('incidentQuestionTitle', n?'它看见了弯道，为什么还是摔倒了？':'它能稳稳跑过这个弯吗？');
  text('incidentFeedback', n && S.cause ? causeText[S.cause] : '');
  text('incidentNext',n?'去改装　→':'揭晓　→');
  $('incidentNext').disabled=!(n?S.cause:S.predict); paintIncident();
}
document.querySelectorAll('[data-predict]').forEach(b=>b.onclick=()=>{
  S.predict=b.dataset.predict;
  document.querySelectorAll('[data-predict]').forEach(v=>v.classList.toggle('selected',v===b));
  $('incidentNext').disabled=false;
});
document.querySelectorAll('[data-cause]').forEach(b=>b.onclick=()=>{
  S.cause=b.dataset.cause;
  document.querySelectorAll('[data-cause]').forEach(v=>v.classList.toggle('selected',v===b));
  text('incidentFeedback',causeText[S.cause]); $('incidentNext').disabled=false; paintIncident();
});
function pauseBend() {
  if (!bendPlaying) return;
  bendPlaying=false; task('incident',null); text('bendPause','继续');
}
function incidentAnimation() {
  if (bendPlaying || S.incident) return;
  bendPlaying=true; show('incidentQuestion'); show('predictChoices',false); show('causeChoices',false);
  text('incidentQuestionTitle','观察它的身体和落脚。');text('incidentFeedback','');
  show('bendPause'); text('bendPause','暂停');
  text('incidentLabel','第一关 · 观察入弯'); $('incidentFrame').dataset.step='motion';
  task('incident',dt=>{
    bendTime=Math.min(fallDuration,bendTime+dt); paintIncident();
    if (bendTime===fallDuration) { pauseBend(); setIncident(1); }
  });
}
btn('bendPause',()=>bendPlaying?pauseBend():incidentAnimation());
btn('incidentNext',()=>S.incident?go(2):incidentAnimation());
btn('incidentReset',()=>{
  pauseBend(); bendTime=0; S.cause=S.predict=null;
  document.querySelectorAll('[data-cause],[data-predict]').forEach(b=>b.classList.remove('selected'));
  setIncident(0);
});
setIncident(0);
