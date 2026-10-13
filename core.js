"use strict";
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const hintEl = document.getElementById('hint');
const C = {y:'#FFD21F', belly:'#FFF3C4', line:'#4A2F0C', green:'#2E8B3A', tongue:'#F48FA3', mouth:'#7E1A2A', claw:'#6B4423',
  sky1:'#79c6ff', sky2:'#dcf3ff', grass:'#86c95b', bark:'#c9925c', navy:'#1d1640'};
let W = 1280, H = 720, S = 1;
function resize(){
  const dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr);
  const asp = innerWidth / innerHeight;
  if (asp >= 0.9) { H = 720; W = H * asp; } else { W = 648; H = W / asp; }
  S = cv.width / W;
}
addEventListener('resize', resize); resize();

const lerp = (a,b,t) => a + (b-a)*t, clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const ease = t => t < .5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2;
function ell(x,y,rx,ry,rot=0){ ctx.beginPath(); ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rot,0,Math.PI*2); }
function rr(x,y,w,h,r){ ctx.beginPath(); ctx.roundRect(x,y,w,h,r); }
function font(px, w=700){ ctx.font = `${w} ${px}px Fredoka, "Trebuchet MS", sans-serif`; }

// ---------- Nailong ----------
function nailong(x, y, s, o = {}){
  const {rot=0, sx=1, sy=1, arms='down', flail=0, look=[0,0], mouth='open', walk=0, blink=true, breathe=true} = o;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s*sx, s*sy);
  // idle life: a slow 2% belly breath (origin is at the feet, so they stay planted; x keeps two Nailongs out of step)
  if (breathe) { const br = Math.sin(CLOCK*3.1 + x*0.013); ctx.scale(1 - br*0.012, 1 + br*0.018); }
  const lid = blink && ((CLOCK + 1.7) % 3.4) < 0.12;   // a 0.12 s blink every 3.4 s; the +1.7 keeps t = 0 and whole seconds up to 1.5 eyes-open
  const up = arms === 'up';
  const aL = up ? [-54,-120,-0.45 + Math.sin(flail)*0.35, -1] : [-47,-72, 0.5, 1];
  const aR = up ? [ 54,-120, 0.45 - Math.sin(flail)*0.35, -1] : [ 47,-72,-0.5, 1];
  const legL = [-20, -10 - Math.max(0, Math.sin(walk))*6], legR = [20, -10 - Math.max(0, -Math.sin(walk))*6];
  const main = [
    () => ell(42,-32,24,12,-0.5),
    () => ell(legL[0],legL[1],17,13), () => ell(legR[0],legR[1],17,13),
    () => ell(0,-58,47,50),
    () => ell(aL[0],aL[1],12,23,aL[2]), () => ell(aR[0],aR[1],12,23,aR[2]),
    () => ell(0,-130,52,48),
  ];
  ctx.lineJoin = 'round'; ctx.lineWidth = 14; ctx.strokeStyle = C.line;
  for (const f of main) { f(); ctx.stroke(); }
  ctx.fillStyle = C.y; for (const f of main) { f(); ctx.fill(); }
  ell(0,-50,30,36); ctx.fillStyle = C.belly; ctx.fill();
  ctx.fillStyle = C.claw;
  for (const [lx,ly] of [legL,legR]) for (const dx of [-9,0,9]) { ell(lx+dx, ly+11, 3.2, 3.2); ctx.fill(); }
  for (const a of [aL,aR]) for (const dx of [-5,0,5]) {
    const c = Math.cos(a[2]), sn = Math.sin(a[2]), v = a[3]*21;
    ell(a[0] + dx*c - v*sn, a[1] + dx*sn + v*c, 2.6, 2.6); ctx.fill();
  }
  for (const ex of [-25, 25]) {
    ell(ex,-140,14,14); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke();
    const px = ex + look[0]*4, py = -140 + look[1]*4;
    ell(px,py,9,9); ctx.fillStyle = C.green; ctx.fill();
    ell(px,py,6,6); ctx.fillStyle = '#111'; ctx.fill();
    ell(px+3,py-3,2.4,2.4); ctx.fillStyle = '#fff'; ctx.fill();
    if (lid) { ell(ex,-140,16.5,16.5); ctx.fillStyle = C.y; ctx.fill(); ctx.beginPath(); ctx.arc(ex,-141,13,0.2*Math.PI,0.8*Math.PI); ctx.lineWidth = 3.5; ctx.strokeStyle = C.line; ctx.stroke(); }
  }
  ctx.strokeStyle = C.line;
  if (mouth === 'open') {
    ell(0,-110,26,15); ctx.fillStyle = C.mouth; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
    ell(5,-100,14,11); ctx.fillStyle = C.tongue; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
  } else if (mouth === 'o') {
    ell(0,-108,9,11); ctx.fillStyle = C.mouth; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(0,-122,18,0.25,Math.PI-0.25); ctx.lineWidth = 4; ctx.stroke();
  }
  ctx.restore();
}

// ---------- speech bubble + titles ----------
// bubbles pop out of the speaker's mouth: 0.2 s back-ease scale from the tail tip, once per appearance.
// Keyed by text; a line that keeps growing ('AAAA' > 'AAAAA') keeps its first pop instead of popping again.
const _bub = {};
function _bubLive(e){ return e && CLOCK >= e.last - 0.001 && CLOCK - e.last <= 0.15; }   // drawn a moment ago in this step
function bubble(text, x, y, size = 30, maxW = 420){
  let e = _bub[text];
  if (!_bubLive(e)) {
    let st = CLOCK, n = 0;
    for (const k in _bub) { const v = _bub[k]; n++; if (_bubLive(v) && (text.startsWith(k) || k.startsWith(text))) st = Math.min(st, v.start); }
    if (n > 60) for (const k in _bub) if (!_bubLive(_bub[k])) delete _bub[k];
    e = _bub[text] = {start: st, last: CLOCK};
  }
  e.last = CLOCK;
  const sc = Math.max(0.01, fxBack((CLOCK - e.start)/0.2));
  font(size, 600);
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  lines.push(cur);
  const lh = size*1.2, bw = Math.max(...lines.map(l => ctx.measureText(l).width)) + 36, bh = lines.length*lh + 22;
  const bx = clamp(x - bw/2, 10, W - bw - 10), by = Math.max(10, y - bh - 26);
  const tx = clamp(x, bx + 22, bx + bw - 22);
  const ox = tx + 2, oy = by + bh + 20;   // the tail tip: the bubble grows out of it
  ctx.translate(ox, oy); ctx.scale(sc, sc); ctx.translate(-ox, -oy);
  ctx.fillStyle = '#fff'; ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(tx-11, by+bh-3); ctx.lineTo(tx+2, by+bh+20); ctx.lineTo(tx+11, by+bh-3); ctx.closePath(); ctx.fill(); ctx.stroke();
  rr(bx, by, bw, bh, 18); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(tx-8, by+bh-4); ctx.lineTo(tx+2, by+bh+15); ctx.lineTo(tx+8, by+bh-4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.line; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  lines.forEach((l,i) => ctx.fillText(l, bx + bw/2, by + 11 + lh*(i+.5)));
  ctx.translate(ox, oy); ctx.scale(1/sc, 1/sc); ctx.translate(-ox, -oy);   // undo the pop scale only, so callers keep the same ctx state as before
}
function title(text, x, y, size, fill = C.y){
  font(size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = size/5; ctx.strokeStyle = C.line; ctx.strokeText(text, x, y);
  ctx.fillStyle = fill; ctx.fillText(text, x, y);
}

// ---------- juice helpers (inert until called; all driven by CLOCK, so HOLD freezes them) ----------
// CLOCK = the current step's t, set by main.js draw() every frame (sim-stepped at 1/60, frozen by HOLD)
let CLOCK = 0;
// back-ease: 0 at k=0, overshoots to about 1.1, settles on 1 at k=1 (menu.js has its own easeOutBack)
const fxBack = k => { k = clamp(k, 0, 1); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3*Math.pow(k - 1, 3) + c1*Math.pow(k - 1, 2); };
// screen shake offset: k = what is left of the shake (1 at impact, 0 at rest). Use inside your own save/restore:
//   ctx.translate(...fxShake(k, 12))
function fxShake(k, amp){ k = clamp(k, 0, 1); return [Math.sin(CLOCK*90)*amp*k, Math.cos(CLOCK*77)*amp*k]; }
// impact ring: k 0..1 over its life, radius eases r0 > r1 while it thins and fades
function fxRing(x, y, k, r0, r1, col = '#fff', lw = 8){
  if (k <= 0 || k >= 1) return;
  const r = lerp(r0, r1, 1 - (1 - k)*(1 - k));
  ctx.save(); ctx.globalAlpha *= 1 - k; ctx.lineWidth = lw*(1 - k) + 2; ctx.strokeStyle = col;
  ell(x, y, r, r); ctx.stroke(); ctx.restore();
}
// cartoon iris: k 0 = fully open (draws nothing), 1 = closed on (cx, cy). Pass 1 - k for an iris-in.
function fxIris(k, cx, cy){
  k = clamp(k, 0, 1); if (k <= 0) return;
  const r = lerp(Math.hypot(W, H)*0.6, 0, ease(k));
  ctx.save(); ctx.fillStyle = C.navy;
  ctx.beginPath(); ctx.rect(-5, -5, W + 10, H + 10); ctx.moveTo(cx + Math.max(r, 0.1), cy); ctx.arc(cx, cy, Math.max(r, 0.1), 0, Math.PI*2); ctx.fill('evenodd');
  if (r > 0.5) { ctx.lineWidth = 6; ctx.strokeStyle = C.line; ell(cx, cy, r, r); ctx.stroke(); }
  ctx.restore();
}
// anime emote mark over a head: kind 'bang' (pops in, wobbles) or 'sweat' (slides down). k 0..1 over its life.
function fxMark(kind, x, y, k, s = 1){
  if (k <= 0 || k >= 1) return;
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= k > 0.8 ? (1 - k)/0.2 : 1;
  ctx.strokeStyle = C.line; ctx.lineJoin = 'round';
  if (kind === 'bang') {
    const p = s*fxBack(Math.min(1, k/0.25)); ctx.scale(p, p); ctx.rotate(Math.sin(k*40)*0.08*(1 - k));
    ctx.fillStyle = '#ffe14d'; ctx.lineWidth = 4;
    rr(-7, -46, 14, 30, 7); ctx.fill(); ctx.stroke();
    ell(0, -8, 8, 8); ctx.fill(); ctx.stroke();
  } else if (kind === 'sweat') {
    ctx.translate(0, 30*k); ctx.scale(s, s);
    ctx.fillStyle = '#6bb8f0'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, -26); ctx.quadraticCurveTo(13, -6, 13, 2); ctx.quadraticCurveTo(0, 20, -13, 2); ctx.quadraticCurveTo(-13, -6, 0, -26); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ell(-4, 0, 2.5, 4); ctx.fillStyle = '#fff'; ctx.fill();
  }
  ctx.restore();
}

// ---------- scenery ----------
function sky(){ const g = ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,C.sky1); g.addColorStop(1,C.sky2); ctx.fillStyle = g; ctx.fillRect(0,0,W,H); }
function sun(){ ell(W-140,110,46,46); ctx.fillStyle = '#ffe56b'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#e9b100'; ctx.stroke(); }
function cloud(x,y,s){
  ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(74,47,12,.25)'; ctx.lineWidth = 3;
  const b = [[-40,0,34,24],[0,-14,40,30],[42,0,32,22],[0,8,60,20]];
  for (const [dx,dy,rx,ry] of b) { ell(x+dx*s,y+dy*s,rx*s,ry*s); ctx.stroke(); }
  for (const [dx,dy,rx,ry] of b) { ell(x+dx*s,y+dy*s,rx*s,ry*s); ctx.fill(); }
}
const CLOUDS = Array.from({length:22}, (_,i) => ({x: ((i*0.373) % 1)*1.1 - 0.05, y: -260 - i*150 - (i%3)*45, s: 0.6 + (i%4)*0.28}));
function gum(x, gy, s){
  ctx.strokeStyle = C.line; ctx.lineWidth = 4;
  ctx.fillStyle = '#e8dcc6';
  ctx.beginPath(); ctx.moveTo(x-12*s, gy); ctx.quadraticCurveTo(x-2*s, gy-90*s, x-14*s, gy-170*s); ctx.lineTo(x+4*s, gy-170*s); ctx.quadraticCurveTo(x+10*s, gy-90*s, x+12*s, gy); ctx.closePath(); ctx.fill(); ctx.stroke();
  const blobs = [[-50,-175,55,38],[30,-195,60,42],[-10,-230,58,40],[60,-160,40,30],[-75,-150,36,26]];
  for (const [dx,dy,rx,ry] of blobs) { ell(x+dx*s, gy+dy*s, rx*s, ry*s); ctx.stroke(); }
  blobs.forEach(([dx,dy,rx,ry],i) => { ell(x+dx*s, gy+dy*s, rx*s, ry*s); ctx.fillStyle = i%2 ? '#6c9a68' : '#7fae79'; ctx.fill(); });
}
function ground(gy){ ctx.fillStyle = C.grass; ctx.fillRect(-10, gy, W+20, H*4); ctx.fillStyle = '#74b84c'; ctx.fillRect(-10, gy, W+20, 10); }
function juniorSchool(gy){
  const x0 = W*0.03, x1 = W*0.52, top = gy - 215;
  gum(W*0.56, gy, 1.1);
  ctx.strokeStyle = C.line; ctx.lineWidth = 4;
  ctx.fillStyle = '#ece7de'; ctx.fillRect(x0, top+8, x1-x0, gy-top-8); ctx.strokeRect(x0, top+8, x1-x0, gy-top-8);
  ctx.strokeStyle = 'rgba(74,47,12,.16)'; ctx.lineWidth = 2;
  for (let x = x0+64; x < x1; x += 64) { ctx.beginPath(); ctx.moveTo(x, top+8); ctx.lineTo(x, gy-62); ctx.stroke(); }
  ctx.fillStyle = '#b8644a'; ctx.fillRect(x0, gy-62, x1-x0, 62);
  ctx.strokeStyle = 'rgba(74,47,12,.3)'; ctx.lineWidth = 2;
  for (let r = 0; r < 4; r++) { const yy = gy-62+r*15.5; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.stroke();
    for (let x = x0 + (r%2)*16; x < x1; x += 32) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x, yy+15.5); ctx.stroke(); } }
  ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.strokeRect(x0, gy-62, x1-x0, 62);
  ctx.fillStyle = '#4b5560'; rr(x0-14, top-12, x1-x0+28, 24, 5); ctx.fill(); ctx.stroke();
  for (let x = x0+26; x < x1-80; x += 104) {
    ctx.fillStyle = '#a8dcf5'; rr(x, top+118, 70, 52, 6); ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+35, top+118); ctx.lineTo(x+35, top+170); ctx.stroke();
  }
  ctx.fillStyle = '#5a7fa8'; rr(x1-70, gy-112, 46, 112, 4); ctx.fill(); ctx.stroke();
  const sx = x0 + (x1-x0)*0.08, sw = (x1-x0)*0.8, sy = top + 14, sh = 62;
  ctx.fillStyle = '#e0463e'; rr(sx, sy, sw, sh, 6); ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
  ctx.lineCap = 'round';
  ctx.lineWidth = 10; ctx.strokeStyle = '#f2a0a0';
  ctx.beginPath(); ctx.moveTo(sx+12, sy+sh-10); ctx.bezierCurveTo(sx+36, sy+18, sx+64, sy+54, sx+96, sy+12); ctx.stroke();
  ctx.strokeStyle = '#2f5fb3';
  ctx.beginPath(); ctx.moveTo(sx+16, sy+sh-22); ctx.bezierCurveTo(sx+40, sy+8, sx+66, sy+42, sx+98, sy+24); ctx.stroke();
  ctx.lineCap = 'butt';
  const fs = clamp((sw-120)/7, 12, 32);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  font(fs); ctx.fillText('BRINDABELLA', sx+110, sy+sh*0.5);
  font(fs*0.62, 600); ctx.fillText('JUNIOR SCHOOL', sx+110, sy+sh*0.5 + fs*0.85);
}
const SP = (L, gy, u) => { const P0 = [L+34, gy-190], Cc = [L+120, gy-185], P2 = [L+250, gy-22];
  const a = (1-u)*(1-u), b = 2*(1-u)*u, c = u*u; return [a*P0[0]+b*Cc[0]+c*P2[0], a*P0[1]+b*Cc[1]+c*P2[1]]; };
function slide(L, gy, crack = 0, brk = -1){
  ctx.fillStyle = C.bark; ell(L+120, gy+8, 200, 18); ctx.fill();
  ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.fillStyle = '#3a7bd5';
  rr(L-16, gy-200, 10, 200, 3); ctx.fill(); ctx.stroke();
  rr(L+26, gy-200, 10, 200, 3); ctx.fill(); ctx.stroke();
  for (let yy = gy-32; yy > gy-190; yy -= 32) { rr(L-8, yy, 36, 7, 3); ctx.fill(); ctx.stroke(); }
  rr(L-20, gy-198, 64, 12, 4); ctx.fill(); ctx.stroke();
  const half = (u0, u1) => { ctx.beginPath(); for (let i = 0; i <= 24; i++) { const p = SP(L, gy, u0 + (u1-u0)*i/24); i ? ctx.lineTo(p[0],p[1]) : ctx.moveTo(p[0],p[1]); } };
  const paint = () => { ctx.lineCap = 'round'; ctx.lineWidth = 28; ctx.strokeStyle = C.line; ctx.stroke(); ctx.lineWidth = 20; ctx.strokeStyle = '#e8423b'; ctx.stroke(); ctx.lineCap = 'butt'; };
  half(0, .5); paint();
  ctx.save();
  if (brk >= 0) { const p = SP(L, gy, .5); ctx.translate(p[0], p[1] + brk*brk*500); ctx.rotate(brk*1.6); ctx.translate(-p[0], -p[1]); }
  half(.5, 1); paint();
  ctx.restore();
  if (crack > 0 && brk < 0) {
    const p = SP(L, gy, .5); ctx.strokeStyle = '#2a1a06'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(p[0]-2, p[1]-12); ctx.lineTo(p[0]+6*crack, p[1]-4); ctx.lineTo(p[0]-5*crack, p[1]+3); ctx.lineTo(p[0]+4*crack, p[1]+12*crack); ctx.stroke();
  }
}

// ---------- classmates (first names only, everything kind) ----------
const CAST = {
  scarlett: {name: 'Scarlett', skin: '#f2cdb3', hair: '#e6c07a', hairDark: '#c99c55', style: 'long', girl: true, badge: '#d9a520', h: 1.3},
  jed: {name: 'Jedidiah', skin: '#5b3a29', hair: '#17110e', hairDark: '#3a2a20', style: 'short', girl: false, badge: '#a9c2b4', h: 1},
  // Max himself (the intro, story-intro.js): the boys' uniform like Jedidiah
  // from his photos (13 Oct): thin rectangular glasses, flat black hair with a side-swept fringe (Max: "my hair isn't that tall")
  max: {name: 'Max', skin: '#f1d0b4', hair: '#141110', hairDark: '#2a2420', style: 'fringe', glasses: true, girl: false, badge: '#d9a520', h: 1.06},
};
// o.armR / o.armL: raise that arm, in radians from hanging down (about -2.7 points up and out; the left arm mirrors it).
// o.finger: a pointing finger on a raised arm.
// o.noArms: leave both arms (and hands) off, for a caller that draws its own (the intro's stretchy arms, story-intro.js).
function person(x, y, s, p, o = {}){
  const {mouth = 'smile', look = [0, 0], armR = 0, armL = 0, finger = false, noArms = false} = o;
  ctx.save(); ctx.translate(x, y); ctx.scale(s*p.h, s*p.h); ctx.lineJoin = 'round';
  const L = C.line, navy = '#232838';
  // a path built rotated about the shoulder (sx, -158); the path keeps the rotation, the state does not
  const posed = (a, sx, f) => { if (!a) return f(); ctx.save(); ctx.translate(sx, -158); ctx.rotate(a); ctx.translate(-sx, 158); f(); ctx.restore(); };
  const P = {
    hairBack: () => rr(-43, -250, 86, 122, 30),
    legL: () => p.girl ? rr(-19, -60, 14, 56, 6) : rr(-22, -82, 18, 78, 6),
    legR: () => p.girl ? rr(5, -60, 14, 56, 6) : rr(4, -82, 18, 78, 6),
    shoeL: () => ell(-13, -4, 13, 6), shoeR: () => ell(13, -4, 13, 6),
    skirt: () => { ctx.beginPath(); ctx.moveTo(-31, -102); ctx.lineTo(31, -102); ctx.lineTo(38, -54); ctx.lineTo(-38, -54); ctx.closePath(); },
    torso: () => rr(-36, -170, 72, p.girl ? 74 : 92, 18),
    armL: () => posed(-armL, -42, () => rr(-51, -165, 18, 80, 9)), armR: () => posed(armR, 42, () => rr(33, -165, 18, 80, 9)),
    handL: () => posed(-armL, -42, () => ell(-42, -83, 10, 10)), handR: () => posed(armR, 42, () => ell(42, -83, 10, 10)),
    neck: () => rr(-9, -184, 18, 18, 4),
    earL: () => ell(-36, -216, 6, 9), earR: () => ell(36, -216, 6, 9),
    head: () => ell(0, -218, 36, 40),
  };
  const order = ['legL','legR','shoeL','shoeR', ...(p.girl ? ['skirt'] : []), 'torso', ...(noArms ? [] : ['armL','armR','handL','handR']), 'neck','earL','earR','head'];
  if (p.style === 'long') order.unshift('hairBack');
  ctx.lineWidth = 12; ctx.strokeStyle = L;
  for (const k of order) { P[k](); ctx.stroke(); }
  const fill = {hairBack: p.hairDark, legL: p.girl ? '#24242c' : '#2b2f3a', legR: p.girl ? '#24242c' : '#2b2f3a', shoeL: '#151515', shoeR: '#151515',
    skirt: '#b8323a', torso: navy, armL: navy, armR: navy, handL: p.skin, handR: p.skin, neck: p.skin, earL: p.skin, earR: p.skin, head: p.skin};
  for (const k of order) { P[k](); ctx.fillStyle = fill[k]; ctx.fill(); }
  if (finger && !noArms) for (const [a, sx] of [[armR, 42], [-armL, -42]]) if (a) {   // the index finger sticks out of a raised hand
    ctx.save(); ctx.translate(sx, -158); ctx.rotate(a); rr(-4, 80, 8, 18, 4); ctx.fillStyle = p.skin; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = L; ctx.stroke(); ctx.restore();
  }
  if (p.girl) { ctx.save(); P.skirt(); ctx.clip(); ctx.strokeStyle = '#2f3f8f'; ctx.lineWidth = 4;
    for (let i = -40; i < 40; i += 14) { ctx.beginPath(); ctx.moveTo(i, -104); ctx.lineTo(i+6, -50); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-40, -80); ctx.lineTo(40, -80); ctx.stroke(); ctx.restore(); }
  ctx.fillStyle = '#fff'; ctx.strokeStyle = L; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-15, -169); ctx.lineTo(15, -169); ctx.lineTo(0, -126); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-5, -166); ctx.lineTo(5, -166); ctx.lineTo(7, -134); ctx.lineTo(0, -124); ctx.lineTo(-7, -134); ctx.closePath();
  ctx.fillStyle = '#c2373a'; ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#2f3f8f'; ctx.lineWidth = 2; for (const yy of [-156, -144]) { ctx.beginPath(); ctx.moveTo(-5, yy); ctx.lineTo(6, yy+4); ctx.stroke(); }
  ctx.fillStyle = p.badge; ctx.strokeStyle = L; ctx.lineWidth = 2; rr(14, -152, 14, 6, 2); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 4; ctx.strokeStyle = L; ctx.fillStyle = p.hair;
  if (p.style === 'long') {
    ctx.beginPath(); ctx.moveTo(-40, -205); ctx.quadraticCurveTo(-44, -264, 0, -262); ctx.quadraticCurveTo(44, -264, 40, -205);
    ctx.quadraticCurveTo(24, -240, 2, -252); ctx.quadraticCurveTo(-22, -240, -40, -205); ctx.closePath(); ctx.fill(); ctx.stroke();
    for (const sx of [-1, 1]) { rr(sx < 0 ? -46 : 30, -214, 16, 96, 8); ctx.fill(); ctx.stroke(); }
  } else if (p.style === 'fringe') {   // close to the head, the fringe sweeping across to one side and down to the brow
    ctx.beginPath(); ctx.moveTo(-38, -207); ctx.quadraticCurveTo(-44, -262, -2, -265); ctx.quadraticCurveTo(42, -264, 39, -212);
    ctx.lineTo(36, -203); ctx.quadraticCurveTo(31, -220, 23, -228); ctx.lineTo(17, -224); ctx.lineTo(8, -232);
    ctx.quadraticCurveTo(-10, -242, -25, -236); ctx.quadraticCurveTo(-35, -231, -38, -207); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#4a3a30'; ctx.lineWidth = 2;
    for (const [x0, x1] of [[-14, 12], [2, 26]]) { ctx.beginPath(); ctx.moveTo(x0, -258); ctx.quadraticCurveTo((x0 + x1)/2 + 4, -250, x1, -236); ctx.stroke(); }
  } else {
    ctx.beginPath(); ctx.moveTo(-36, -224); ctx.quadraticCurveTo(-40, -274, 0, -274); ctx.quadraticCurveTo(40, -274, 36, -224);
    ctx.quadraticCurveTo(30, -244, 0, -244); ctx.quadraticCurveTo(-30, -244, -36, -224); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#4a3a30'; ctx.lineWidth = 2;
    for (let i = -24; i <= 24; i += 8) { ctx.beginPath(); ctx.moveTo(i, -268); ctx.quadraticCurveTo(i + 4, -258, i, -248); ctx.stroke(); }
  }
  for (const ex of [-13, 13]) { ell(ex + look[0]*2, -220 + look[1]*2, 4.2, 5.2); ctx.fillStyle = '#1a1a1a'; ctx.fill();
    ell(ex + look[0]*2 + 1.5, -222 + look[1]*2, 1.4, 1.4); ctx.fillStyle = '#fff'; ctx.fill(); }
  ctx.strokeStyle = L; ctx.lineWidth = 3;
  for (const ex of [-13, 13]) { ctx.beginPath(); ctx.moveTo(ex - 6, -232); ctx.quadraticCurveTo(ex, -236, ex + 6, -232); ctx.stroke(); }
  if (p.glasses) {   // thin dark rectangular frames
    ctx.strokeStyle = '#2b2b30'; ctx.lineWidth = 3;
    for (const ex of [-13, 13]) { rr(ex - 11, -228, 22, 15, 4); ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-2, -222); ctx.quadraticCurveTo(0, -225, 2, -222); ctx.moveTo(-24, -223); ctx.lineTo(-35, -219); ctx.moveTo(24, -223); ctx.lineTo(35, -219); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
    for (const ex of [-13, 13]) { ctx.beginPath(); ctx.moveTo(ex - 7, -217); ctx.lineTo(ex - 3, -225); ctx.stroke(); }
    ctx.strokeStyle = L; ctx.lineWidth = 3;
  }
  ctx.fillStyle = 'rgba(240,120,120,.3)'; ell(-21, -205, 6, 4); ctx.fill(); ell(21, -205, 6, 4); ctx.fill();
  if (mouth === 'o') { ell(0, -196, 5, 6.5); ctx.fillStyle = '#5a1a22'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(-14, -202); ctx.quadraticCurveTo(0, -184, 14, -202); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); }
  if (window.tagSeen && p.name) window.tagSeen(p.name, 0, -270);   // main.js name tags: where the top of this head is
  ctx.restore();
}

// every mini-game registers itself here: see CONTRACT.md
const GAMES = {};
