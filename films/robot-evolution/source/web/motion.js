function ease(start, end, value) {
  const u = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return u * u * (3 - 2 * u);
}

function gait(values, phase) {
  const p = ((phase % 1 + 1) % 1) * values.length;
  const tick = Math.floor(p), t = p - tick;
  const sample = offset => values[(tick + offset + values.length) % values.length];
  const a = sample(-1), b = sample(0), c = sample(1), d = sample(2);
  return 0.5 * (2*b + (c-a)*t + (2*a-5*b+4*c-d)*t*t + (3*b-a-3*c+d)*t*t*t);
}

function path(points, close = false) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  if (close) ctx.closePath();
}
function line(points, color, width) {
  path(points);
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}
function ellipse(x, y, rx, ry, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
}

// The outlines and axle positions are taken from the film's 1086 × 1448 model sheet.
// Cut each painted piece once. Only its transform changes as the legs and arms cycle.
function cutPiece(image, outline, anchor, tip) {
  const xs = outline.map(point => point[0]), ys = outline.map(point => point[1]);
  const left = Math.max(0, Math.floor(Math.min(...xs)) - 1);
  const top = Math.max(0, Math.floor(Math.min(...ys)) - 1);
  const sheet = document.createElement('canvas');
  sheet.width = Math.min(image.naturalWidth, Math.ceil(Math.max(...xs)) + 2) - left;
  sheet.height = Math.min(image.naturalHeight, Math.ceil(Math.max(...ys)) + 2) - top;
  const brush = sheet.getContext('2d');
  brush.translate(-left, -top);
  brush.beginPath(); brush.moveTo(...outline[0]);
  for (const p of outline.slice(1)) brush.lineTo(...p);
  brush.closePath(); brush.clip();
  brush.drawImage(image, left, top, sheet.width, sheet.height, left, top, sheet.width, sheet.height);
  const dx = tip[0] - anchor[0], dy = tip[1] - anchor[1];
  return {sheet, x: left - anchor[0], y: top - anchor[1], length: Math.hypot(dx, dy), angle: Math.atan2(dy, dx)};
}

function buildAthlete() {
  const rig = JSON.parse(byId('model-outlines').textContent);
  const pieces = {
    head: cutPiece(art.runner, rig.head, [543,327], [543,76]),
    body: cutPiece(art.runner, rig.body, [543,425], [543,788]),
    limbs: {}
  };
  for (const side of [-1, 1]) {
    const mirror = ([x, y]) => [side === 1 ? art.runner.naturalWidth - 1 - x : x, y];
    pieces.limbs[side] = {};
    for (const [name, [outline, anchor, tip]] of Object.entries(rig.left)) {
      pieces.limbs[side][name] = cutPiece(art.runner, outline.map(mirror), mirror(anchor), mirror(tip));
    }
  }
  return pieces;
}
function stamp(piece, a, b, width) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  ctx.save();
  ctx.translate(...a); ctx.rotate(Math.atan2(dy, dx));
  ctx.scale(Math.hypot(dx, dy) / piece.length, width); ctx.rotate(-piece.angle);
  ctx.drawImage(piece.sheet, piece.x, piece.y);
  ctx.restore();
}

const kneeDrop = [187,211,230,202,158,95,60,110], soleHeight = [0,-5,-29,-84,-169,-222,-174,-76];
const footDepth = [1.10,1.04,.93,.81,.74,.82,.98,1.10], kneeSwing = [2,0,-14,-24,-32,-12,13,17];
const ankleSwing = [-56,-45,-33,-49,-83,-93,-66,-49];
function runner(x, floor, height, phase, lean, crouch, reach) {
  const k = height/1400, angle = phase*TAU, rock = 17*Math.sin(angle);
  const hipY = -530 + 117*crouch + 15*Math.cos(2*angle);
  const limbs = [];
  for (const side of [-1,1]) {
    const f = phase + (side === 1 ? .5 : 0), depth = gait(footDepth,f);
    const hip = [side*100, hipY];
    const knee = [side*(143+gait(kneeSwing,f)) + rock*.25, hipY+gait(kneeDrop,f)-34*crouch];
    const ankle = [side*(190+gait(ankleSwing,f)), gait(soleHeight,f)-151*depth];
    const toe = [ankle[0]+side*23, ankle[1]+141*depth];
    const pump = -Math.cos(TAU*f);
    const shoulder = [side*239+rock, hipY-323+12*side*Math.sin(angle)];
    const elbow = [side*(383-20*pump+102*reach)+rock, hipY-146-38*pump-76*reach];
    const wrist = [side*(252-63*pump+268*reach)+rock, hipY-98-115*pump-145*reach];
    let handX = side*(-52-30*pump+75*reach), handY = -32-54*pump-15*reach;
    if (Math.hypot(handX,handY) < 38) { handX = -43*side; handY = -17; }
    const handDepth = 1+.16*pump, direction = Math.atan2(handY,handX);
    const fingers = [wrist[0]+Math.cos(direction)*93*handDepth, wrist[1]+Math.sin(direction)*93*handDepth];
    limbs.push({parts: athlete.limbs[side], hip, knee, ankle, toe, depth, shoulder, elbow, wrist, fingers, handDepth});
  }
  for (const {toe} of limbs) {
    const toeX = toe[0]*Math.cos(lean) - toe[1]*Math.sin(lean);
    const toeY = toe[0]*Math.sin(lean) + toe[1]*Math.cos(lean);
    const gap = Math.max(0, -toeY);
    if (gap < 94) ellipse(x+k*toeX, floor, k*(65-gap*.32), k*(11-gap*.04), '#40243d');
  }
  ctx.save(); ctx.translate(x, floor); ctx.rotate(lean); ctx.scale(k,k);
  limbs.sort((a,b) => a.depth-b.depth);
  for (const leg of limbs) {
    stamp(leg.parts.thigh, leg.hip, leg.knee, .93+.07*leg.depth);
    stamp(leg.parts.shin, leg.knee, leg.ankle, leg.depth);
    stamp(leg.parts.foot, leg.ankle, leg.toe, leg.depth);
  }
  for (const arm of limbs) stamp(arm.parts.upper, arm.shoulder, arm.elbow, 1);
  stamp(athlete.body, [rock,hipY-326], [0,hipY+37], 1.065);
  const headY = hipY-402+20*crouch;
  stamp(athlete.head, [rock*.8,headY], [rock*.8,headY-216], 1.015);
  limbs.sort((a,b) => a.handDepth-b.handDepth);
  for (const arm of limbs) {
    stamp(arm.parts.fore, arm.elbow, arm.wrist, .94+.06*arm.handDepth);
    stamp(arm.parts.hand, arm.wrist, arm.fingers, arm.handDepth);
  }
  ctx.restore();
}

function laneFlow(t, onTrack) {
  for (let i=0; i<5; i++) {
    const u = ((t*.54+i/5)%1)**2.4;
    if (u < .018) continue;
    const y = 362+405*u, center = 272-26*u, spread = 183*u;
    if (onTrack) line([[center-spread,y],[center+spread,y]],'#b9f7f7',1+3*u);
    const ry = 25+780*u, mid = 940-10*u, half = 17+322*u;
    line([[mid-half+9,ry],[mid-half+12+20*u,ry]],'#ffc4b4',1+4*u);
    line([[mid+half-9,ry],[mid+half-12-20*u,ry]],'#ffc4b4',1+4*u);
  }
}
function firstRun(t) {
  const watch = Math.min(t,12.05), wobble = ease(5.8,8.8,watch), fall = ease(9.1,12.05,watch);
  const bend = ease(7.9,8.3,watch), strike = Math.exp(-(((t-12.05)/.22)**2));
  const zoom = 1.018+.026*ease(0,6.9,watch);
  const bx = 580*(1-zoom)+2.4*Math.sin(1.7*watch), by = 342*(1-zoom)+1.6*Math.sin(watch*5)-4*strike;
  const bg = bend >= 1 ? art.verge : art.split;
  ctx.drawImage(bg,bx,by,WIDTH*zoom,HEIGHT*zoom);
  if (bend > 0 && bend < 1) {
    ctx.globalAlpha = bend; ctx.drawImage(art.verge,bx,by,WIDTH*zoom,HEIGHT*zoom); ctx.globalAlpha = 1;
  }
  laneFlow(watch,bend < .05);
  const phase = watch/.65, x = 935-127*ease(6.3,10.2,watch)-84*fall+6*Math.sin(TAU*phase);
  const floor = 666-24*wobble-28*fall, height = 633+13*Math.sin(watch*.51);
  if (t < 9.32) {
    ellipse(x+4,floor+1,103,10,'#71253f'); ctx.globalAlpha = 1;
  }
  if (fall > .01 && fall < .99) {
    for (let j=0; j<3; j++) line([[x+144,320+54*j],[x+79,328+54*j]],'#effbff',2+j*.55);
  }
  if (t < 9.32) {
    const lean = -.017+.017*Math.sin(TAU*phase)-.36*wobble-.37*fall;
    runner(x,floor,height,phase,lean,.14*wobble,.68*ease(8.2,9.32,watch));
  } else {
    const recovery = ease(9.32,12.05,watch);
    const w = 640+150*recovery, h = w*art.bank.naturalHeight/art.bank.naturalWidth;
    const px = 737-204*recovery, py = 423+24*recovery-41*Math.sin(recovery*Math.PI);
    ellipse(px+39,622-15*recovery,126+53*recovery,9,'#806674');
    ctx.save(); ctx.translate(px,py); ctx.rotate(.62*(1-recovery)-.055);
    ctx.drawImage(art.bank,-w*.52,-h*.55,w,h); ctx.restore();
  }
  const smear = Math.max(0,1-Math.abs(t-9.32)/.11);
  if (smear > 0) {
    ctx.fillStyle = '#cafaff';
    for (let j=0; j<5; j++) {
      const y = 82+j*121;
      path([[0,y],[610+520*smear,y-49],[0,y+17*smear]],true); ctx.fill();
    }
  }
  if (t > 12.02 && t < 12.65) {
    const u = (t-12.02)/.63;
    for (let i=0; i<8; i++) {
      const angle = Math.PI*(.98+i*.105), radius = 23+u*(51+i%3*13);
      ellipse(464+Math.cos(angle)*radius,615+Math.sin(angle)*radius,8-7*u,5-4*u,'#ffeac0');
    }
  }
}

