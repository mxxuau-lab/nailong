// ---------- story clips, school part 1: the fall, the red tube slide, THE DECK cafe ----------
// Every clip is a PURE function of t (seconds): no hidden state, so ?sim=S&hold=1 screenshots are exact.
// Everything is prefixed st / ST / story so it cannot clash with core.js, the games or the other story files.
const LINES_STORY = {
  // sceneFall
  fallShock: '...the JUNIOR school??',
  // sceneSlide
  slideBig: "Oh, it's bigger than it looks.",       // Max's line
  slideEcho: ['looks...', 'looks...'],              // TODO joke: the tube echoes the line
  slideUhOh: 'uh oh...',                            // Max's line
  shout: 'NAILONG!',                                // Mr Shou chasing him (from Max's "Nailong! You're cooked!"), also in sceneCafe3
  crunch: 'CRUNCH!',                                // placeholder, Max to edit: a book punching through the slide (sound word)
  // sceneCafe1
  cafeSign: 'THE DECK',                             // Max, 12 Oct: "instead of brindy cafe it's called THE DECK"
  reachGrunt: 'nngh...',                            // TODO joke
  scarlettLine: 'Top shelf again?',                 // TODO joke: "this happens a lot in real life"
  thanks: '...thanks.',                             // TODO joke
  // sceneCafe2 (Max's beats and lines, 12 Oct, in this order)
  sucked: 'Whew, that game sucked.',                // Max's line
  thud: 'THUD',                                     // Mr Shou's accidental kick (sound word)
  watchIt: "Hey! Watch where you're going!",        // Max's line
  short: "It's your fault for being short.",       // Max's line (Mr Shou)
  hey: 'Hey....',                                   // Max's line
  notMaths: "At least I'm not a maths teacher.",    // Max's line
  pow: 'POW!',                                      // the big-leg kick (sound word)
  crash: 'CRASH!',                                  // Mr Shou hits the wall (sound word)
  cooked: "Nailong! You're cooked!",                // Max's line (Mr Shou)
  // sceneCafe3
  hope: "I hope I don't run into any more teachers like that one",   // Max's line, verbatim
  // sceneEnd (neutral card, the real finale and end menu are other agents' work)
  endTitle: 'Nailong',
  endSub: 'to be continued',
  // sceneCast (test card)
  cast: 'THE CAST (so far)',
};

// ---------- small helpers ----------
const stSeg = (t, a, b) => clamp((t - a)/(b - a), 0, 1);
const stRnd = i => { const x = Math.sin(i*127.1 + 311.7)*43758.5453; return x - Math.floor(x); };
const stHop = (t, a, b, h) => { const u = (t - a)/(b - a); return u > 0 && u < 1 ? h*4*u*(1 - u) : 0; };
function stDust(x, y, k, r = 24){ if (k <= 0 || k >= 1) return; ctx.fillStyle = `rgba(235,225,205,${1 - k})`;
  for (const d of [-1, 1]) { ell(x + d*(r*2 + k*r*3), y - 10 - k*12, r*(1 - k*.4), r*0.62*(1 - k*.4)); ctx.fill(); } }
function stStar(x, y, r, rot, fill = '#ffe14d'){
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
  for (let i = 0; i < 10; i++) { const rad = i % 2 ? r*0.45 : r; ctx.lineTo(Math.sin(i*Math.PI/5)*rad, -Math.cos(i*Math.PI/5)*rad); }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
}
function stBurst(x, y, r, rot = 0){       // spiky impact flash
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
  for (let i = 0; i < 16; i++) { const rad = i % 2 ? r*0.55 : r; ctx.lineTo(Math.sin(i*Math.PI/8)*rad, -Math.cos(i*Math.PI/8)*rad); }
  ctx.closePath(); ctx.fillStyle = '#fff6b0'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.line; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
}
// camera shake on a thud: hits = [[time, amp], ...] in time order, each rings for 0.35 s. Call first thing inside the scene's own save/restore.
// A tiny zoom punch rides along so the shaken frame never shows its edge.
function stShake(t, hits){
  for (let i = hits.length - 1; i >= 0; i--) {
    const [h, amp] = hits[i], a = t - h; if (a < 0 || a >= 0.35) continue;
    const k = Math.exp(-a*14), z = 1 + 2.2*amp*k/H;
    ctx.translate(W/2, H/2); ctx.scale(z, z); ctx.translate(-W/2, -H/2); ctx.translate(...fxShake(k, amp)); return;
  }
}
// a piecewise-linear clock: knots [[clip t, authored t], ...] slow or hold a clip's beats without retiming every move; slope 1 after the last knot
function stWarp(t, knots){
  if (t <= knots[0][0]) return knots[0][1];
  for (let i = 1; i < knots.length; i++) { const [a, A] = knots[i - 1], [b, B] = knots[i]; if (t <= b) return lerp(A, B, (t - a)/(b - a)); }
  const [a, A] = knots[knots.length - 1]; return A + (t - a);
}
// sounds in a pure clip: each cue [time, name | [wished, fallback] | function, opts, wishedOpts] fires once as the clip's clock passes it,
// and a clock that goes back (watch again, a fresh run) re-arms them. A wished voice plays (with wishedOpts) once sfx.js has it; until
// then the fallback (with opts) does. A plain name plays with opts (an unknown name is a silent no-op in sfx.js).
const stCueT = {};
function stCues(key, t, list){
  const prev = stCueT[key]; stCueT[key] = t;
  if (prev === undefined || t <= prev) return;
  for (const [at, what, o, wo] of list) {
    if (!(prev < at && t >= at)) continue;
    if (typeof what === 'function') { try { what(); } catch (e) {} continue; }
    if (!window.SFX) continue;
    const [want, alt] = Array.isArray(what) ? what : [what];
    if (!alt) SFX.play(want, o); else if (SFX.names && SFX.names.includes(want)) SFX.play(want, wo); else SFX.play(alt, o);
  }
}
// brows over Nailong (core nailong() has none): 'mad' slope down to the middle, 'sad' slope up to it, 'smug' flat and low. Same frame as nailong().
function stBrows(x, y, s, kind, sx = 1, sy = 1, rot = 0){
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s*sx, s*sy); ctx.strokeStyle = C.line; ctx.lineWidth = 7; ctx.lineCap = 'round';
  const d = kind === 'mad' ? 7 : kind === 'sad' ? -7 : 0, yb = kind === 'smug' ? -153 : -162;
  for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sg*38, yb - d); ctx.lineTo(sg*12, yb + d); ctx.stroke(); }
  ctx.restore();
}
// Nailong's grown leg: one fat yellow piece from the hip at (hx,hy), len long, w thick, pointing at canvas angle ang; a big foot with three claws, sole forward
function stBigLeg(hx, hy, len, w, ang){
  if (len < 2 || w < 2) return;
  const c = Math.cos(ang), s = Math.sin(ang), ex = hx + c*len, ey = hy + s*len, leg = () => { ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(ex, ey); };
  ctx.save(); ctx.lineCap = 'round';
  leg(); ctx.lineWidth = w + 14; ctx.strokeStyle = C.line; ctx.stroke();
  ell(ex, ey, w*0.55 + 7, w*0.85 + 7, ang); ctx.fillStyle = C.line; ctx.fill();
  leg(); ctx.lineWidth = w; ctx.strokeStyle = C.y; ctx.stroke();
  ell(ex, ey, w*0.55, w*0.85, ang); ctx.fillStyle = C.y; ctx.fill();
  ctx.fillStyle = C.claw; for (const d of [-0.5, 0, 0.5]) { ell(ex + c*w*0.42 - s*d*w*0.7, ey + s*w*0.42 + c*d*w*0.7, w*0.08, w*0.08); ctx.fill(); }
  ctx.restore();
}
// Nailong holding something in both paws (the boba, the red bean bottle). core.js nailong() always draws his two side arms, so while
// he holds it they are left out and the two paws drawn on the cup are his only hands (Max, 13 Oct: "in this scene nai long grows extra hands").
// It skips exactly the arm shapes nailong() draws (12 x 23 ellipses) and their claws (2.6 dots); if core.js ever changes them, the arms come back.
function stNailongHolding(x, y, s, o){
  const real = window.ell;
  window.ell = (x0, y0, rx, ry, rot = 0) => { if ((rx === 12 && ry === 23) || (rx === 2.6 && ry === 2.6)) { ctx.beginPath(); return; } real(x0, y0, rx, ry, rot); };
  try { nailong(x, y, s, o); } finally { window.ell = real; }
}
// the boba cup from the bottle game (bottlesort.js, drink 5): feet-centre (x,y), h tall, level 0..1 of tea left, tip = where the straw ends (world), or null
function stBoba(x, y, h, rot = 0, level = 1, tip = null){
  const k = h/100; let tx = 14, ty = -104;
  if (tip) { const dx = tip[0] - x, dy = tip[1] - y, c = Math.cos(-rot), s = Math.sin(-rot); tx = (dx*c - dy*s)/k; ty = (dx*s + dy*c)/k; }
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(4, -76); ctx.lineTo(tx, ty); ctx.lineWidth = 7; ctx.strokeStyle = C.line; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = '#f08aa0'; ctx.stroke();
  const body = () => { ctx.beginPath(); ctx.moveTo(-26,-74); ctx.lineTo(26,-74); ctx.lineTo(19,-6); ctx.quadraticCurveTo(18,0,10,0); ctx.lineTo(-10,0); ctx.quadraticCurveTo(-18,0,-19,-6); ctx.closePath(); };
  body(); ctx.fillStyle = '#fdf0f4'; ctx.fill();
  ctx.save(); body(); ctx.clip(); ctx.fillStyle = '#f7b6c8'; ctx.fillRect(-30, -74*clamp(level, 0, 1), 60, 80); ctx.restore();
  ctx.fillStyle = '#3a2418'; for (const [px, py] of [[-9,-8],[3,-9],[11,-6],[-2,-18],[8,-19]]) { ell(px, py, 4.6, 4.6); ctx.fill(); }
  body(); ctx.lineWidth = 6; ctx.strokeStyle = C.line; ctx.stroke();
  rr(-29, -84, 58, 12, 6); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
  ctx.restore();
}
// one Methods textbook, centred at (x,y), turned by rot, s = Mr Shou's scale
function stBookAt(x, y, rot, s, red){ ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); stBook(0, 8, 78, 16, red); ctx.restore(); }
// a dizzy swirl (two turns), centre (x,y), radius r
function stSwirl(x, y, r, rot){
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
  for (let i = 0; i <= 40; i++) { const a = i/40*Math.PI*4, q = r*i/40; i ? ctx.lineTo(Math.cos(a)*q, Math.sin(a)*q) : ctx.moveTo(0, 0); }
  ctx.strokeStyle = C.line; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore();
}
function stText(text, x, y, size, rot = 0, fill = '#fff', alpha = 1){
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot); title(text, 0, 0, size, fill); ctx.restore();
}
function stNote(x, y, s, rot = 0){          // a little music note, drawn
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(8, -34); ctx.lineTo(24, -28); ctx.stroke();
  ell(0, 2, 9, 6.5, -0.4); ctx.fillStyle = C.line; ctx.fill(); ctx.restore();
}
function stBook(x, y, w, h, red){          // flat side view of a Cambridge Methods book: red = Year 11, yellow = Year 12
  ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round';
  rr(-w/2, -h, w, h, 3); ctx.fillStyle = red ? '#d9453d' : '#f2d33a'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = C.line; ctx.stroke();
  rr(-w/2 + 8, -h + 3, w - 10, h - 6, 2); ctx.fillStyle = '#f6efdc'; ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
}
function stRedBean(x, y, h, rot = 0){       // the red bean drink bottle, same look as bottlesort.js. feet-centre at (x,y), h tall
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(h/100, h/100); ctx.lineJoin = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = C.line;
  const fs = (fill, path) => { path(); ctx.fillStyle = fill; ctx.fill(); ctx.stroke(); };
  fs('#f3e3b3', () => rr(-9, -100, 18, 10, 3));
  fs('#8d2233', () => { ctx.beginPath(); ctx.moveTo(-9,-90); ctx.lineTo(9,-90); ctx.lineTo(9,-74); ctx.quadraticCurveTo(24,-70,24,-52); ctx.lineTo(24,-8); ctx.quadraticCurveTo(24,0,14,0); ctx.lineTo(-14,0); ctx.quadraticCurveTo(-24,0,-24,-8); ctx.lineTo(-24,-52); ctx.quadraticCurveTo(-24,-70,-9,-74); ctx.closePath(); });
  fs('#fbf0d0', () => rr(-24, -50, 48, 34, 5));
  ctx.fillStyle = '#8d2233';
  for (const [bx, by] of [[-10,-38],[2,-32],[10,-42]]) { ell(bx, by, 6.5, 4.5, 0.5); ctx.fill(); }
  ctx.restore();
}
function stBottle(kind, x, y, h){           // other fridge drinks: 0 milk, 1 mango, 2 blue soda
  const col = [['#ffffff', '#4a90e2'], ['#f7a928', '#2f9a5a'], ['#6fb6e8', '#e0372f']][kind % 3];
  ctx.save(); ctx.translate(x, y); ctx.scale(h/100, h/100); ctx.lineJoin = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = C.line;
  rr(-10, -100, 20, 12, 4); ctx.fillStyle = col[1]; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-10,-88); ctx.lineTo(10,-88); ctx.lineTo(10,-72); ctx.quadraticCurveTo(26,-66,26,-48); ctx.lineTo(26,-8); ctx.quadraticCurveTo(26,0,16,0); ctx.lineTo(-16,0); ctx.quadraticCurveTo(-26,0,-26,-8); ctx.lineTo(-26,-48); ctx.quadraticCurveTo(-26,-66,-10,-72); ctx.closePath();
  ctx.fillStyle = col[0]; ctx.fill(); ctx.stroke(); ctx.restore();
}

// ---------- a classmate with posable arms (core.js person() cannot raise an arm) ----------
// o: armL / armR (radians: 0 hanging, PI/2 out sideways, PI straight up; armL is the arm on the left of the screen), lenL / lenR (stretch the arm, 1 = normal),
// mouth, look, rot, sx, sy. Same look as person(). Returns the hand positions in canvas coordinates.
function storyPerson(x, y, s, p, o = {}){
  const {mouth = 'smile', look = [0, 0], armL = 0, armR = 0, lenL = 1, lenR = 1, rot = 0, sx = 1, sy = 1} = o;
  const k = s*p.h;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k*sx, k*sy); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const L = C.line, navy = '#232838', AL = 78;
  const hand = (side, a, len) => [side*42 + side*Math.sin(a)*AL*len, -160 + Math.cos(a)*AL*len];
  const hl = hand(-1, armL, lenL), hr = hand(1, armR, lenR);
  const P = {
    hairBack: () => rr(-43, -250, 86, 122, 30),
    legL: () => p.girl ? rr(-19, -60, 14, 56, 6) : rr(-22, -82, 18, 78, 6),
    legR: () => p.girl ? rr(5, -60, 14, 56, 6) : rr(4, -82, 18, 78, 6),
    shoeL: () => ell(-13, -4, 13, 6), shoeR: () => ell(13, -4, 13, 6),
    skirt: () => { ctx.beginPath(); ctx.moveTo(-31, -102); ctx.lineTo(31, -102); ctx.lineTo(38, -54); ctx.lineTo(-38, -54); ctx.closePath(); },
    torso: () => rr(-36, -170, 72, p.girl ? 74 : 92, 18),
    neck: () => rr(-9, -184, 18, 18, 4),
    earL: () => ell(-36, -216, 6, 9), earR: () => ell(36, -216, 6, 9),
    head: () => ell(0, -218, 36, 40),
  };
  const armLine = (side, h) => () => { ctx.beginPath(); ctx.moveTo(side*42, -160); ctx.lineTo(h[0], h[1]); };
  const order = ['legL','legR','shoeL','shoeR', ...(p.girl ? ['skirt'] : []), 'torso','armL','armR','handL','handR','neck','earL','earR','head'];
  if (p.style === 'long') order.unshift('hairBack');
  P.armL = armLine(-1, hl); P.armR = armLine(1, hr);
  P.handL = () => ell(hl[0], hl[1] + 2, 10, 10); P.handR = () => ell(hr[0], hr[1] + 2, 10, 10);
  const isArm = k2 => k2 === 'armL' || k2 === 'armR';
  for (const key of order) { P[key](); ctx.lineWidth = isArm(key) ? 30 : 12; ctx.strokeStyle = L; ctx.stroke(); }
  const fill = {hairBack: p.hairDark, legL: p.girl ? '#24242c' : '#2b2f3a', legR: p.girl ? '#24242c' : '#2b2f3a', shoeL: '#151515', shoeR: '#151515',
    skirt: '#b8323a', torso: navy, armL: navy, armR: navy, handL: p.skin, handR: p.skin, neck: p.skin, earL: p.skin, earR: p.skin, head: p.skin};
  for (const key of order) { P[key](); if (isArm(key)) { ctx.lineWidth = 18; ctx.strokeStyle = fill[key]; ctx.stroke(); } else { ctx.fillStyle = fill[key]; ctx.fill(); } }
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
    for (const sg of [-1, 1]) { rr(sg < 0 ? -46 : 30, -214, 16, 96, 8); ctx.fill(); ctx.stroke(); }
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
  ctx.fillStyle = 'rgba(240,120,120,.3)'; ell(-21, -205, 6, 4); ctx.fill(); ell(21, -205, 6, 4); ctx.fill();
  if (mouth === 'o') { ell(0, -196, 5, 6.5); ctx.fillStyle = '#5a1a22'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(-14, -202); ctx.quadraticCurveTo(0, -184, 14, -202); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); }
  ctx.restore();
  const cr = Math.cos(rot), sr = Math.sin(rot);
  const wp = h => [x + (h[0]*cr*sx - h[1]*sr*sy)*k, y + (h[0]*sr*sx + h[1]*cr*sy)*k];
  return {handL: wp(hl), handR: wp(hr)};
}
// angle + stretch that makes a posable arm reach a world point
function stArmTo(x, y, k, side, tx, ty){
  const px = x + side*42*k, py = y - 160*k, dx = (tx - px)*side, dy = ty - py, D = Math.hypot(dx, dy);
  return {a: Math.atan2(dx, dy), len: D/(78*k)};
}

// ---------- Mr Shou with walking legs (battle.js shou() stands still) ----------
// o: everything shou() takes, plus walk (phase), kick (0..1: right leg swings out sideways), pile (extra books on top of his stack),
// still (true: shou()'s own legs, so he can tilt, fly and bend as one piece), books (n: a pile of n books at his LEFT hip instead of the stack).
// Otherwise his own legs are drawn behind and shou() is clipped at the hips, so he can stride and kick.
const ST_SKIN = '#f0c9a2';                       // battle.js SKIN
const stShouPt = (x, y, s, o, lx, ly) => { const r = o.rot || 0, sx = o.sx || 1, sy = o.sy || 1, c = Math.cos(r), n = Math.sin(r);
  return [x + (lx*c*sx - ly*n*sy)*s, y + (lx*n*sx + ly*c*sy)*s]; };      // a point in shou()'s own frame, in canvas coordinates
function stShou(x, y, s, o = {}){
  const {walk = 0, kick = 0, pile = 0, moving = true, still = false, books = -1} = o;
  if (books >= 0) o = {...o, stack: false};
  const body = () => typeof shou === 'function' ? shou(x, y, s, o) : {handR: [x, y - 100*s], handL: [x, y - 100*s]};
  let hands;
  if (still) hands = body(); else {
    const sw = moving ? 0.5*Math.sin(walk) : 0;
    const angR = lerp(-sw, -1.05, kick), angL = sw*0.8;
    ctx.save(); ctx.lineJoin = 'round';
    for (const [hx, a] of [[-13, angL], [13, angR]]) {
      ctx.save(); ctx.translate(x + hx*s, y - 86*s); ctx.rotate(a); ctx.scale(s, s);
      rr(-9, 0, 18, 82, 6); ctx.lineWidth = 10; ctx.strokeStyle = C.line; ctx.stroke(); ctx.fillStyle = '#2a2d38'; ctx.fill();
      ell(5, 82, 17, 8); ctx.lineWidth = 8; ctx.stroke(); ctx.fillStyle = '#151515'; ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(x - 4000, -50, 8000, y - 76*s + 50); ctx.clip();   // round him, so it works in a scrolled world too
    hands = body();
    ctx.restore();
  }
  if (pile > 0) {          // more books on the pile held in his right hand (same stack as shou()'s 4 books)
    const armR = o.armR === undefined ? 0.12 : o.armR, hr = [38 + Math.sin(armR)*76, -166 + Math.cos(armR)*76];
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(s*(o.sx || 1), s*(o.sy || 1)); ctx.translate(hr[0] - 4, hr[1] - 6);
    for (let i = 4; i < 4 + pile; i++) stBook(i % 2 ? 4 : -3, -i*17, 78 - i*3 + (i % 3)*2, 16, i % 2 === 1);
    ctx.restore();
  }
  if (books > 0) {         // the pile at his left hip, hand redrawn on top (as shou() does for its stack)
    const armL = o.armL === undefined ? 0.12 : o.armL, hl = [-38 - Math.sin(armL)*76, -166 + Math.cos(armL)*76];
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(s*(o.sx || 1), s*(o.sy || 1)); ctx.lineJoin = 'round';
    ctx.save(); ctx.translate(hl[0] + 4, hl[1] - 6); for (let i = 0; i < books; i++) stBook(i % 2 ? -4 : 3, -i*17, 78, 16, i % 2 === 0); ctx.restore();
    ell(hl[0], hl[1] + 6, 12, 12); ctx.lineWidth = 7; ctx.strokeStyle = C.line; ctx.stroke(); ctx.fillStyle = ST_SKIN; ctx.fill();
    ctx.restore();
  }
  return hands;
}

// ---------- the octagon world (matches the first frames of games/octagon.js) ----------
function stOctaWorld(t, hue = 8, faces = true){
  const cx = W/2, cy = H*0.42, R = Math.min(W, H*1.2)*0.4;
  ctx.fillStyle = '#fbfbff'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(cx, cy); ctx.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    const a0 = i*Math.PI/8 + t*0.05;
    ctx.strokeStyle = `hsla(${(hue + i*23) % 360},60%,80%,.45)`; ctx.lineWidth = 6 + (i%3)*5; ctx.beginPath();
    for (let j = 0; j <= 10; j++) { const r_ = 40 + j*j*10, a = a0 + j*0.09; j ? ctx.lineTo(Math.cos(a)*r_, Math.sin(a)*r_) : ctx.moveTo(Math.cos(a)*r_, Math.sin(a)*r_); }
    ctx.stroke();
  }
  ctx.restore(); ctx.lineCap = 'butt';
  if (!faces) return;
  const vtx = (j, z) => { const a = Math.PI/2 + (j - 0.5)*Math.PI/4, r = R/z; return [cx + Math.cos(a)*r, cy + Math.sin(a)*r]; };
  for (let i = 26; i >= 0; i--) {
    const z0 = 0.4 + i*0.9, zn = Math.max(z0, 0.62), zf = z0 + 0.9*0.94, fog = clamp((zf - 1.5)/17, 0, 1);
    for (let k = 0; k < 8; k++) {
      if (i > 6 && k !== 0 && stRnd(i*8 + k) > 0.75) continue;
      const a = vtx(k, zn), b = vtx(k + 1, zn), c = vtx(k + 1, zf), d = vtx(k, zf), odd = (k + i) % 2;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath();
      ctx.fillStyle = `hsl(${hue + odd*10},${Math.round(78 - fog*55)}%,${Math.round(54 + odd*5 + fog*42)}%)`; ctx.fill();
      ctx.strokeStyle = `rgba(255,255,255,${0.5*(1 - fog)})`; ctx.lineWidth = 2; ctx.stroke();
    }
  }
}
const stOctaLand = () => { const R = Math.min(W, H*1.2)*0.4; return [W/2, H*0.42 + R*Math.cos(Math.PI/8)]; };   // where octagon.js stands Nailong (scale 0.36)

// =====================================================================================
// sceneCast: test card
function sceneCast(t){
  const gy = H*0.8; sky(); sun(); cloud(W*0.2, 110, 0.8); ground(gy);
  title(LINES_STORY.cast, W/2, H*0.1, Math.min(56, W/15));
  const xs = [W*0.3, W*0.5, W*0.7], b = k => Math.abs(Math.sin(t*3 + k))*6;
  nailong(xs[0], gy - b(0), 0.9, {mouth: 'open', look: [0.6, 0]});
  person(xs[1], gy - b(1), 0.8, CAST.scarlett, {look: [-0.5, 0]});
  person(xs[2], gy - b(2), 0.8, CAST.jed, {look: [-0.5, 0]});
  ['Nailong', CAST.scarlett.name, CAST.jed.name].forEach((n, i) => title(n, xs[i], gy + 40, 30, '#fff'));
}

// =====================================================================================
// ---------- scene 1: falling from the sky onto the Junior School lawn (8.4 s) ----------
// The old outdoor blue-framed slide is dropped: the real Junior School slide is INDOORS (see sceneSlide).
// FALL_DUR is the clip's length for main.js FLOW (was 7.4 there): one more second so "...the JUNIOR school??" holds about 3.8 s on
// screen (read twice) before the iris closes.
const FALL_T = 4.6, FALL_DUR = 8.4;
const FALL_SFX = [
  [0.15, 'whoosh', {p: 0.55, g: 0.8}], [0.35, 'scream'], [1.2, 'whoosh', {p: 0.65, g: 0.8}], [1.95, 'scream', {p: 1.06}],      // the long fall: AAAA
  [2.5, 'whoosh', {p: 0.8, g: 0.9}], [3.3, 'scream', {p: 1.12, g: 1.15}], [3.7, 'whoosh', {p: 1.0}], [4.3, 'whoosh', {p: 1.3, g: 1.1}],
  [FALL_T, 'thud', {p: 0.7, g: 1.3}], [FALL_T + 0.03, 'oof', {p: 1.2, g: 0.7}], [FALL_T + 0.1, 'whoosh', {p: 0.35, g: 0.5}],   // the landing, his grunt, the dust
  [FALL_T + 0.3, 'pop', {p: 1.7, g: 0.35}],                                                                                     // Scarlett and Jed gasp
  [FALL_DUR - 0.35, 'swish', {p: 0.8, g: 0.6}],                                                                                // the iris closes
];
function sceneFall(t){
  stCues('fall', t, FALL_SFX);
  const gy = H*0.8, nx = W*0.42;
  const p = clamp(t/FALL_T, 0, 1);
  const nY = t < FALL_T ? -3300*(1 - p*p) : 0;
  const cam = Math.min(0, nY + H*0.42);
  ctx.save(); stShake(t, [[FALL_T, 9]]);                           // the landing shakes the camera
  sky(); sun();
  for (const c of CLOUDS) { const yy = gy + c.y - cam; if (yy > -120 && yy < H+120) cloud(c.x*W, yy, c.s); }
  ctx.save(); ctx.translate(0, -cam); ground(gy); juniorSchool(gy); gum(W*0.9, gy, 1.25);
  const shock = t > FALL_T ? "o" : "smile";
  person(W*0.68, gy, 0.5, CAST.scarlett, {mouth: shock, look: [-1, -0.6]}); person(W*0.77, gy, 0.5, CAST.jed, {mouth: shock, look: [-1, -0.6]});
  ctx.restore();
  const sy0 = gy + nY - cam;
  let sx = 1, sy = 1, rot = 0;
  if (t < FALL_T) {
    rot = Math.sin(t*7)*0.5;
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) { const lx = nx - 85 + i*28; const ly = sy0 - 140 - ((t*900 + i*137) % 260);
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx, ly - 60); ctx.stroke(); }
    ctx.lineCap = 'butt';
  } else { const k = t - FALL_T; if (k < 0.45) { const q = Math.sin(Math.PI*k/0.45); sx = 1 + 0.35*q; sy = 1 - 0.35*q; } }
  nailong(nx, sy0, 0.62, {rot, sx, sy, arms: t < FALL_T ? 'up' : 'down', flail: t*18, look: t < FALL_T ? [0,-1] : [-0.8,-0.2], mouth: 'open'});
  if (t > FALL_T && t < FALL_T + 0.9) { const k = (t - FALL_T)/0.9; stDust(nx, gy, k, 20); }
  if (t > 0.3 && t < FALL_T - 0.2) bubble('A'.repeat(4 + Math.floor(t*4)), nx, sy0 - 0.62*190, 34, W);
  if (t > FALL_T + 0.8) bubble(LINES_STORY.fallShock, nx, gy - 0.62*190, 34);
  ctx.restore();
  fxIris(stSeg(t, FALL_DUR - 0.35, FALL_DUR), nx, gy - 90);        // cartoon iris-out on Nailong over the clip's last 0.35 s
}

// =====================================================================================
// ---------- scene 2 (Max, 12 Oct 21:29): the Mr Shou chase. Nailong runs flat out down a Junior School corridor with Mr Shou
// behind him hurling Methods textbooks (one sticks in the wall, he hurdles one, one bonks him on the head), bounds up the stairs
// and dives head first into the red tube slide. Inside: "Oh, it's bigger than it looks." until a muffled NAILONG!, a book punches
// through the tube wall, the next one through the floor in front of him, "uh oh...", and the book-shaped hole opens into the
// 360 octagon game. Authored in scene seconds (main.js plays clips at 70%); SLIDE_DUR is the clip's length for main.js FLOW.
const SLIDE_DUR = 13.4, ST_SLIDE_T = SLIDE_DUR;
const SL = {stairs: 2.9, top: 3.3, plat: 3.45, dive: 3.5, gone: 3.9, shouStop: 3.6, cut: 4.05, plop: 4.2, big: [4.6, 7.2], slide0: 5.0,
  muffle: 7.4, p1: 7.9, p2: 8.7, uh: [8.9, 10.2], drop: 10.2, open: [10.6, 11.8], fall: 11.4, land: 12.7};
const SL_NS = 0.68, SL_SS = 0.95;               // Nailong's and Mr Shou's sizes outside
// Nailong's run, Mr Shou's and the camera's, in world x (the atrium is world 0..W, the corridor runs off to its left)
const stSlNx = t => lerp(-1.9*W, 0.03*W, clamp(t/SL.stairs, 0, 1));
const stSlSx = t => t < SL.stairs ? stSlNx(t) - lerp(0.62*W, 0.42*W, clamp(t/0.8, 0, 1)) : Math.min(0.075*W, -0.39*W + 0.665*W*(t - SL.stairs));
const stSlCam = t => t < 2.4 ? stSlNx(t) - 0.62*W : lerp(stSlNx(2.4) - 0.62*W, -0.04*W, ease(clamp((t - 2.4)/0.7, 0, 1)));
// his three throws in the corridor: released at rel, [land time, kind]
const SL_THROWS = [{rel: 0.75, land: 1.25, kind: 'wall', w: 'y'}, {rel: 1.4, land: 1.75, kind: 'floor', w: 'r'}, {rel: 2.0, land: 2.3, kind: 'head', w: 'y'}];
const SLIDE_SFX = [
  ...Array.from({length: 24}, (_, i) => [0.05 + i*0.12, 'tick', {p: 0.75 + (i % 2)*0.1, g: 0.22}]),                       // pitter-patter, flat out
  ...SL_THROWS.map(th => [th.rel, 'whoosh', {p: 1.3, g: 0.7}]),
  [1.25, 'thwack', {p: 0.8}], [1.75, 'thud', {p: 1.4, g: 0.6}], [1.92, 'boing', {p: 1.6, g: 0.4}],                       // smack in the wall, the one on the floor, the hurdle
  [2.3, 'boing', {g: 0.8}], [2.31, 'thwack', {p: 1.3, g: 0.6}], [2.45, ['dizzy', 'boing'], {p: 1.8, g: 0.3}, {p: 1.4, g: 0.4}],   // CONK
  ...[0, 1, 2, 3, 4].map(i => [SL.stairs + i*0.08, 'tick', {p: 0.8 + i*0.1, g: 0.3}]),                                   // up the stairs
  [SL.dive, 'whoosh', {p: 0.8}], [SL.dive + 0.25, 'squeak', {p: 0.7, g: 0.6}], [SL.gone, 'pop', {p: 0.6, g: 0.6}],         // head first into the tube
  [3.95, 'swish', {p: 0.9}], [SL.plop, 'thud', {p: 1.6, g: 0.45}],                                                       // the cut, he plops down inside
  [SL.slide0, 'squeak', {p: 0.45, g: 0.8}], [6.6, 'squeak', {p: 0.5, g: 0.7}],                                           // the squeaky slide
  [SL.muffle, 'thud', {p: 0.5, g: 0.35}],                                                                                // NAILONG! through the wall
  [SL.p1, 'crash', {p: 1.0}], [SL.p1 + 0.02, ['books', 'thud'], {p: 1.3, g: 0.5}, {g: 0.6}], [SL.p1 + 0.15, 'whoosh', {p: 0.9}],   // a book punches through the wall and flies past
  [SL.p2, 'crash', {p: 0.8, g: 1.1}], [SL.p2 + 0.02, 'thud', {p: 0.7}], [SL.p2 + 0.08, 'whoosh', {p: 1.4}],               // and through the floor in front of him
  [SL.drop, 'scream', {p: 1.1}], [SL.drop + 0.02, 'whoosh', {p: 0.7}],                                                   // the drop
  [SL.open[0], 'whoosh', {p: 0.45, g: 0.8}], [SL.fall, 'whoosh', {p: 0.9}],                                               // the hole opens into the octagon, he falls in
  [SL.land, 'thud', {p: 1.1, g: 0.8}], [SL.land + 0.03, 'boing', {p: 1.3, g: 0.4}],                                      // and lands on it
];
// Nailong running flat out, cartoon style: leaning into it, arms flailing, his legs a spinning blur. Feet-centre (x,y), dir 1 runs right.
function stRun(x, y, s, t, o = {}){
  const dir = o.dir || 1, ph = t*30, hx = x - dir*4*s, hy = y - 26*s, lift = 30*s + Math.abs(Math.sin(ph*0.5))*7*s;
  const wheel = front => {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (!front) { ctx.globalAlpha = 0.5; ell(hx, hy, 50*s, 32*s); ctx.fillStyle = C.y; ctx.fill(); }                 // the blur
    for (let i = 0; i < 4; i++) {                                                                                     // feet whirling round the wheel
      const a = -ph*dir + i*Math.PI/2; if ((Math.sin(a) > 0) !== front) continue;
      ctx.globalAlpha = front ? 0.85 : 0.6;
      ell(hx + Math.cos(a)*34*s, hy + Math.sin(a)*22*s, 19*s, 13*s, a); ctx.fillStyle = C.y; ctx.fill(); ctx.lineWidth = 5*s; ctx.strokeStyle = C.line; ctx.stroke();
    }
    ctx.globalAlpha = front ? 0.8 : 0.5; ctx.strokeStyle = C.line; ctx.lineWidth = 6*s;                                // motion arcs
    for (let i = 0; i < 3; i++) { const a0 = -ph*dir*0.7 + i*2.09 + (front ? 0 : 1); ctx.beginPath(); ctx.ellipse(hx, hy, 56*s, 37*s, 0, a0, a0 + 1.0); ctx.stroke(); }
    ctx.restore();
  };
  wheel(false);
  nailong(x, y - lift, s, {rot: dir*(0.24 + (o.lean || 0)), arms: 'up', flail: ph*0.9, mouth: o.mouth || 'open', look: o.look || [dir, -0.1], walk: ph, sx: o.sx || 1, sy: o.sy || 1});
  wheel(true);
}
// dust kicked up behind a runner and speed lines trailing him
function stRunTrail(x, y, s, t, dir = 1, a = 1){
  for (let i = 0; i < 4; i++) { const k = (t*3.2 + i/4) % 1; ell(x - dir*(34 + k*130)*s, y - 8*s - k*18*s, (15 + k*12)*s, (10 + k*8)*s); ctx.fillStyle = `rgba(235,225,205,${(1 - k)*0.85*a})`; ctx.fill(); }
  ctx.strokeStyle = `rgba(255,255,255,${0.8*a})`; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) { const ly = y - (40 + i*26)*s, lx = x - dir*(80 + ((t*900 + i*53) % 160))*s; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx - dir*90*s, ly); ctx.stroke(); }
  ctx.lineCap = 'butt';
}
// a Methods book in the air: the octagon game's cover sprite if it is there, else the flat side view
function stFlyBook(x, y, w, rot, flip, which){
  if (typeof ogBook === 'function') ogBook(x, y, w, rot, flip, which);
  else stBookAt(x, y, rot, w/78, which === 'r');
}
// the Junior School corridor (world x < 0, left of the atrium): window bays, pin boards of kids' paintings, bags on hooks, ring lights
function stJsCorridor(x0, x1, gy){
  const a = Math.max(x0, -3*W), b = Math.min(x1, 0), ch = H*0.12;
  if (b <= a) return;
  ctx.fillStyle = '#f3ead9'; ctx.fillRect(a, 0, b - a, gy);
  ctx.fillStyle = '#f7f7f7'; ctx.fillRect(a, 0, b - a, ch);
  ctx.strokeStyle = 'rgba(74,47,12,.14)'; ctx.lineWidth = 2;
  for (let x = Math.floor(a/72)*72; x < b; x += 72) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(a, ch); ctx.lineTo(b, ch); ctx.stroke();
  const PAL = ['#e0303a', '#2f6fc9', '#f2c230', '#5cb85c', '#9b59b6', '#f08a24'];
  for (let k = Math.floor(a/560) - 1; k*560 < b; k++) {
    const wx = k*560 + 40, wy = ch + 34, ww = 300, wh = H*0.25;                       // a window bay with the sky in it
    ctx.fillStyle = '#c4e7fb'; ctx.fillRect(wx, wy, ww, wh);
    ctx.fillStyle = '#fff'; ell(wx + 90, wy + 50, 46, 16); ctx.fill(); ell(wx + 120, wy + 42, 30, 13); ctx.fill();
    ctx.strokeStyle = '#b97a48'; ctx.lineWidth = 10; ctx.strokeRect(wx, wy, ww, wh); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(wx + ww/2, wy); ctx.lineTo(wx + ww/2, wy + wh); ctx.stroke();
    ctx.strokeStyle = C.line; ctx.lineWidth = 3; ctx.strokeRect(wx - 5, wy - 5, ww + 10, wh + 10);
    const px = k*560 + 380, py = ch + 52;                                             // a pin board of paintings
    ctx.fillStyle = '#d9a86c'; rr(px, py, 140, 118, 6); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
    for (let j = 0; j < 3; j++) {
      const qx = px + 10 + (j % 2)*66, qy = py + 10 + Math.floor(j/2)*54 + (j === 2 ? 0 : 0), r = stRnd(k*3 + j);
      ctx.save(); ctx.translate(qx + 28, qy + 22); ctx.rotate((r - 0.5)*0.2); rr(-28, -22, 56, 44, 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = PAL[Math.floor(r*6)]; if (j === 0) { ell(-8, -4, 11, 11); ctx.fill(); } else if (j === 1) { ctx.beginPath(); ctx.moveTo(-18, 14); ctx.lineTo(0, -12); ctx.lineTo(18, 14); ctx.closePath(); ctx.fill(); } else { rr(-16, -8, 32, 20, 3); ctx.fill(); }
      ell(12, -12, 6, 6); ctx.fillStyle = '#ffd21f'; ctx.fill(); ctx.restore();
    }
  }
  for (let k = Math.floor(a/150) - 1; k*150 < b; k++) {                               // bags on hooks along the bottom of the wall
    const bx = k*150 + 60, by = gy - 150;
    ctx.fillStyle = '#9aa3ae'; rr(bx - 4, by - 18, 8, 16, 3); ctx.fill();
    ctx.fillStyle = PAL[(k % 6 + 6) % 6]; rr(bx - 26, by, 52, 66, 14); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
    rr(bx - 16, by + 30, 32, 24, 8); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fill(); ctx.stroke();
  }
  for (let k = Math.floor(a/420) - 1; k*420 < b; k++) {                               // white ring lights
    const rx = k*420 + 200;
    ell(rx, ch + 34, 80, 17); ctx.lineWidth = 15; ctx.strokeStyle = '#c9c9c9'; ctx.stroke(); ctx.lineWidth = 9; ctx.strokeStyle = '#fff'; ctx.stroke();
  }
  ctx.fillStyle = '#d8d3ca'; ctx.fillRect(a, gy - 22, b - a, 22);                    // skirting, then the dark carpet of the atrium
  ctx.fillStyle = '#4a4d57'; ctx.fillRect(a, gy, b - a, H - gy);
  for (let i = Math.floor(a/170) - 1; i*170 < b; i++) { ctx.fillStyle = i % 2 ? '#575b67' : '#40434d'; rr(i*170 + stRnd(i)*60, gy + 10 + stRnd(i + 40)*(H - gy - 30), 70 + stRnd(i + 80)*60, 14, 4); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(a, gy, b - a, 5);
  ctx.fillStyle = '#efe9df'; ctx.fillRect(-30, 0, 30, gy); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.strokeRect(-30, -5, 30, gy + 5);   // the pillar where the atrium opens up
}
function sceneSlide(t){
  stCues('slide', t, SLIDE_SFX);
  if (t < SL.cut) stSlideOutside(t); else stSlideInside(t);
  if (t > 3.95 && t < 4.35) {                                      // the CUT: a red flash whips the camera inside the tube
    const a = t < SL.cut ? stSeg(t, 3.95, SL.cut) : 1 - stSeg(t, SL.cut, 4.35);
    ctx.fillStyle = `rgba(224,40,50,${a})`; ctx.fillRect(0, 0, W, H);
  }
}
function stSlideOutside(t){
  const g = stSlideGeom(), gy = g.gy, cam = stSlCam(t);
  ctx.save(); stShake(t, [[1.25, 4], [2.3, 5]]); ctx.translate(-cam, 0);
  stJsCorridor(cam - 40, cam + W + 40, gy);
  if (cam + W > 0) { stAtrium(g); stStairs(g); stTubeOutside(g); }
  // ---- the books he throws ----
  const hand = rel => [stSlSx(rel) + 114*SL_SS, gy - 168*SL_SS - 18];
  const nHead = tt => [stSlNx(tt) + 26, gy - 150];
  const after = [];                                                 // drawn over Nailong
  SL_THROWS.forEach((th, i) => {
    if (t < th.rel) return;
    const [x0, y0] = hand(th.rel);
    if (th.kind === 'wall') {                                       // over his head and SMACK into the wall ahead, where it sticks
      const tx = stSlNx(th.land) + 0.17*W, ty = gy - 330;
      if (t < th.land) { const u = (t - th.rel)/(th.land - th.rel); after.push(() => stFlyBook(lerp(x0, tx, u), lerp(y0, ty, u) - Math.sin(Math.PI*u)*90, 54, u*13, Math.cos(u*9), th.w)); }
      else { const k = t - th.land, wob = Math.exp(-k*6)*Math.sin(k*40)*0.25; stFlyBook(tx, ty, 54, 0.35 + wob, 1, th.w); if (k < 0.3) stBurst(tx, ty, 40 + k*120, k*4); }
    } else if (th.kind === 'floor') {                               // lands on the floor in front of him (he hurdles it)
      const tx = stSlNx(1.95), ty = gy - 10;
      if (t < th.land) { const u = (t - th.rel)/(th.land - th.rel); after.push(() => stFlyBook(lerp(x0, tx, u), lerp(y0, ty, u) - Math.sin(Math.PI*u)*140, 54, u*11, Math.cos(u*8), th.w)); }
      else { const k = Math.min(1, (t - th.land)/0.3), sx = tx + 50*(1 - (1 - k)*(1 - k)); stBookAt(sx, gy + 2, 0, 0.9, th.w === 'r'); if (t - th.land < 0.3) stDust(sx, gy, (t - th.land)/0.3, 14); }
    } else {                                                        // CONK, off the back of his head, and away
      const [tx, ty] = nHead(th.land);
      if (t < th.land) { const u = (t - th.rel)/(th.land - th.rel); after.push(() => stFlyBook(lerp(x0, tx, u), lerp(y0, ty, u) - Math.sin(Math.PI*u)*110, 50, u*12, Math.cos(u*10), th.w)); }
      else if (t < th.land + 1.2) { const k = t - th.land; after.push(() => stFlyBook(tx - 260*k, ty - 620*k + 1500*k*k, 50, -k*14, Math.cos(k*12), th.w)); }
    }
  });
  // ---- Mr Shou: running with an armful of books, throwing with his free arm; at the stairs he stops and aims at the tube ----
  const sx = stSlSx(t), running = sx < 0.075*W - 1;
  if (sx > cam - 200 && sx < cam + W + 200) {
    let armR = 0.5, inHand = null;
    for (const th of SL_THROWS) { const k = (t - (th.rel - 0.3))/0.5; if (k < 0 || k > 1) continue;
      armR = k < 0.6 ? lerp(0.5, 3.5, ease(k/0.6)) : k < 0.8 ? lerp(3.5, 1.6, (k - 0.6)/0.2) : lerp(1.6, 0.5, (k - 0.8)/0.2); if (k < 0.6) inHand = th.w; }
    const aim = stSeg(t, 3.7, 4.0);                                  // at the stairs: winds up a last one at the slide
    if (!running) { armR = lerp(0.5, 3.3, ease(aim)); if (t > 3.7) inHand = 'r'; }
    const shout = t > 0.3 && t < 1.6, o = {books: 4, armR, mouth: shout ? 'o' : 'grin', eyes: !running && t > 3.75 ? 'happy' : 'dot', look: running ? [1, 0] : [1, -1],
      brow: shout ? 'up' : undefined, walk: t*15, moving: running, rot: running ? 0.07 : -0.06*stSeg(t, SL.shouStop - 0.1, SL.shouStop + 0.15), hair: Math.sin(t*12)*0.6};
    const bob = running ? Math.abs(Math.sin(t*15))*8 : 0;
    stShadow(sx, gy + 2, 70);
    const hands = stShou(sx, gy - bob, SL_SS, o);
    if (inHand) stFlyBook(hands.handR[0], hands.handR[1] - 22, 46, armR - Math.PI, 1, inHand);
    if (!running && t > 3.88) stStar(sx + 14, gy - 228*SL_SS, 12*Math.sin(Math.PI*stSeg(t, 3.88, 4.05)), t*3, '#fff');   // the glint on his glasses
    if (shout) { const k = stSeg(t, 0.3, 0.5); ctx.save(); ctx.translate(sx + 90, gy - 340); ctx.rotate(-0.1); ctx.scale(fxBack(k), fxBack(k)); title(LINES_STORY.shout, 0, 0, 64, '#fff'); ctx.restore(); }
  }
  // ---- Nailong ----
  const ns = SL_NS;
  if (t < SL.stairs) {
    const x = stSlNx(t), duck = Math.sin(Math.PI*stSeg(t, 0.92, 1.18)), hop = stHop(t, 1.8, 2.1, 70), conk = t > 2.3 ? Math.exp(-(t - 2.3)*3) : 0;
    stRunTrail(x, gy, ns, t);
    stRun(x, gy - hop, ns, t, {sx: 1 + 0.25*duck, sy: 1 - 0.3*duck, lean: Math.sin(t*20)*0.15*conk, mouth: duck > 0.2 || conk > 0.3 ? 'o' : 'open', look: conk > 0.3 ? [Math.sin(t*13), Math.cos(t*13)*0.6] : [1, -0.1]});
    if (t > 2.3 && t < 3.0) for (let i = 0; i < 4; i++) { const a = t*8 + i*Math.PI/2; stStar(x + 6 + Math.cos(a)*34, gy - 150 + Math.sin(a)*9, 9, a); }   // stars from the conk
    fxMark('sweat', x + 44, gy - 140, (t*1.6) % 1, 0.8);
  } else if (t < SL.gone + 0.05) {
    ctx.save(); ctx.beginPath(); ctx.rect(cam - 50, 0, g.P0[0] - 2 - cam + 50, H); ctx.clip();      // he vanishes at the slide's entrance
    if (t < SL.plat) {                                               // up the stairs and along the platform, flat out
      const up = stSeg(t, SL.stairs, SL.top), x = t < SL.top ? lerp(0.03*W, 0.17*W, up) : lerp(0.17*W, 0.19*W, stSeg(t, SL.top, SL.plat)), y = gy - 260*up;
      stRunTrail(x, y, ns, t, 1, 0.6); stRun(x, y, ns, t);
    } else {                                                         // and head first into the tube
      const u = stSeg(t, SL.dive, SL.gone), x = lerp(0.19*W, g.P0[0] + 40, u*u), y = lerp(gy - 262, g.P0[1] + 4, ease(u)) - Math.sin(Math.PI*u)*36;
      nailong(x, y, ns, {rot: lerp(0.3, Math.PI/2, ease(Math.min(1, u*2))), arms: 'up', flail: t*30, walk: t*40, mouth: 'open', look: [0, -1], sx: 0.9, sy: 1.15});
    }
    ctx.restore();
  }
  for (const f of after) f();
  ctx.restore();
}
// a book-shaped hole punched through the slide: a torn rectangle w across and h along, turned by rot, squashed by sq towards the camera
function stTornPath(x, y, w, h, rot, seed, sq = 1, begin = true){
  const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]], nrm = [[0, -1], [1, 0], [0, 1], [-1, 0]], c = Math.cos(rot), s = Math.sin(rot);
  if (begin) ctx.beginPath();
  let first = true;
  for (let e = 0; e < 4; e++) {
    const [ax, ay] = cs[e], [bx, by] = cs[(e + 1) % 4];
    for (let i = 0; i < 7; i++) {
      const u = i/7, amp = i === 0 ? 0 : (i % 2 ? 1 : -0.4)*Math.min(w, h)*0.09*(0.5 + stRnd(seed*31 + e*7 + i));
      const px = (ax + (bx - ax)*u)*w/2 + nrm[e][0]*amp, py = ((ay + (by - ay)*u)*h/2 + nrm[e][1]*amp)*sq;
      const X = x + px*c - py*s, Y = y + px*s + py*c;
      if (first) { ctx.moveTo(X, Y); first = false; } else ctx.lineTo(X, Y);
    }
  }
  ctx.closePath();
}
function stBookHole(x, y, w, h, rot, seed, sq = 1, lw = 1){
  stTornPath(x, y, w, h, rot, seed, sq); ctx.lineJoin = 'round';
  ctx.lineWidth = 18*lw; ctx.strokeStyle = '#ffc9c4'; ctx.stroke();
  ctx.fillStyle = '#fff6f3'; ctx.fill();
  ctx.lineWidth = 5*lw; ctx.strokeStyle = C.line; ctx.stroke();
}
// red chips of the slide and torn pages, flying out of a hole punched at (x,y) at time t0 (pure: worked out from t)
function stShards(x, y, t, t0, seed, dirX, dirY, n = 14){
  const age = t - t0; if (age < 0 || age > 0.9) return;
  for (let i = 0; i < n; i++) {
    const a = stRnd(seed*17 + i)*Math.PI*2, sp = 160 + stRnd(seed*5 + i)*320, vx = Math.cos(a)*sp + dirX*240, vy = Math.sin(a)*sp + dirY*240;
    const px = x + vx*age, py = y + vy*age + 700*age*age, al = 1 - clamp((age - 0.5)/0.4, 0, 1);
    ctx.save(); ctx.globalAlpha = al; ctx.translate(px, py); ctx.rotate(age*10 + i);
    if (i % 3) { rr(-6, -4, 12 + stRnd(i)*5, 9, 2); ctx.fillStyle = '#e0303a'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = C.line; ctx.stroke(); }
    else { ctx.scale(Math.max(0.15, Math.abs(Math.cos(age*12 + i))), 1); rr(-10, -13, 20, 26, 2); ctx.fillStyle = '#fffaf0'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.line; ctx.stroke(); }
    ctx.restore();
  }
}
function stSlideInside(t){
  const cx = W/2, cy = H*0.36, RR = H*0.78, zh = 1.5, hx = cx, hy = cy + RR/zh, hw = 150, hh = 150*1.41, hsq = 0.33;
  const hit = (a, d) => t > a && t < a + d ? Math.sin(t*70)*8*(1 - (t - a)/d) : 0;
  const shake = (t > SL.slide0 && t < SL.drop ? Math.sin(t*53)*Math.min(1.6, (t - SL.slide0)*0.8) : 0) + hit(SL.muffle, 0.6)*0.5 + hit(SL.p1, 0.4) + hit(SL.p2, 0.5);
  ctx.save(); ctx.translate(shake, Math.cos(t*61)*shake*0.6);
  stTubeInside(cx, cy, RR);
  // the first book punches through the wall up on the left
  const P1 = {phi: -2.5, z: 1.45}, r1 = RR/P1.z, x1 = cx + Math.cos(P1.phi)*r1, y1 = cy + Math.sin(P1.phi)*r1;
  if (t > SL.p1) { const g = fxBack(stSeg(t, SL.p1, SL.p1 + 0.12)); stBookHole(x1, y1, r1*0.3*g, r1*0.3*1.41*g, P1.phi + Math.PI/2, 3, 0.55, 0.9); }
  // the second one punches up through the floor right in front of him
  if (t > SL.p2) { const g = fxBack(stSeg(t, SL.p2, SL.p2 + 0.14)); stBookHole(hx, hy, hw*g, hh*g, 0, 9, hsq); }
  // the muffled shout from outside the tube
  if (t > SL.muffle && t < SL.p1 + 0.3) { const k = stSeg(t, SL.muffle, SL.muffle + 0.2); stText(LINES_STORY.shout, cx + W*0.27 + Math.sin(t*50)*3, cy - RR*0.2, 40*fxBack(k), 0.12, '#ffd9d9', 1 - stSeg(t, SL.p1, SL.p1 + 0.3)); }
  // ---- Nailong, small inside the huge tube ----
  let zN = 2.0; if (t > SL.slide0) zN = 2.0 - 0.36*Math.pow(stSeg(t, SL.slide0, SL.drop), 1.3);
  let s = 1.56/zN, x = cx + Math.sin(stSeg(t, SL.slide0, SL.drop)*Math.PI*2)*14, y = cy + RR/zN, rot = 0, sx = 1, sy = 1;
  const o = {arms: 'down', mouth: 'smile', look: [0, 0]};
  if (t < SL.plop + 0.35) { const q = Math.sin(Math.PI*stSeg(t, SL.plop - 0.05, SL.plop + 0.3)); sx = 1 + 0.22*q; sy = 1 - 0.2*q; o.mouth = 'o'; o.look = [Math.sin(t*5), -0.7]; }
  else if (t < SL.muffle) { o.look = [0.9*Math.sin(t*1.3), -0.8]; o.mouth = t > 4.9 ? 'smile' : 'o'; rot = Math.sin(t*3)*0.03; }
  else if (t < SL.p1) { o.mouth = 'o'; o.look = [0.8, -0.6]; }
  else if (t < SL.p2) { o.arms = 'up'; o.flail = t*12; o.mouth = 'o'; o.look = t < SL.p1 + 0.4 ? [-0.8, -0.8] : [0.6, 0.6]; rot = -0.08 + Math.sin(t*9)*0.04; }
  else if (t < SL.drop) { const q = Math.sin(Math.PI*stSeg(t, SL.p2, SL.p2 + 0.3)); sx = 1 - 0.1*q; sy = 1 + 0.12*q; o.arms = 'up'; o.flail = t*17; o.look = [0, 1]; o.mouth = 'o'; rot = -0.15; }
  if (t < SL.drop) { ell(x, y + 4, 62*s, 9*s); ctx.fillStyle = 'rgba(60,4,10,.35)'; ctx.fill(); }
  if (t < SL.open[0] + 0.6) {
    ctx.save();
    if (t >= SL.drop) {                                              // into the hole
      const k = t - SL.drop; y += k*k*460; s *= Math.max(0.12, 1 - k*1.1); rot = -0.2 + k*3; o.arms = 'up'; o.flail = t*24; o.look = [0, -1]; o.mouth = 'open';
      ctx.beginPath(); ctx.rect(0, 0, W, hy); stTornPath(hx, hy, hw, hh, 0, 9, hsq, false); ctx.clip();   // above the floor, or down the hole
    }
    nailong(x, y, s, {...o, rot, sx, sy});
    ctx.restore();
  }
  const topY = y - 190*s*sy;
  if (t > SL.p1 - 0.1 && t < SL.p1 + 0.8) fxMark('bang', x + 40, topY - 6, stSeg(t, SL.p1, SL.p1 + 0.8));
  fxMark('sweat', x + 50*s, topY + 14, stSeg(t, SL.uh[0], SL.uh[0] + 0.9));
  // the books, nearer the camera than he is: one flies past out of the wall, one bursts up out of the floor
  if (t > SL.p1 && t < SL.p1 + 0.7) { const u = stSeg(t, SL.p1, SL.p1 + 0.7); stFlyBook(lerp(x1, W*1.15, u*u), lerp(y1, H*0.95, u) - Math.sin(Math.PI*u)*60, lerp(40, 280, u*u), u*10, Math.cos(u*8), 'y'); }
  if (t > SL.p2 && t < SL.p2 + 0.6) { const u = stSeg(t, SL.p2, SL.p2 + 0.6); stFlyBook(hx + 30*u, lerp(hy, -260, Math.sqrt(u)), lerp(70, 200, u), u*9, Math.cos(u*10), 'r'); }
  stShards(x1, y1, t, SL.p1, 3, 0.6, 0.4); stShards(hx, hy, t, SL.p2, 9, 0, -1.2, 18);
  if (t > SL.p1 && t < SL.p1 + 0.6) stText(LINES_STORY.crunch, x1 + 150, y1 + 60, 46, -0.12, '#fff6b0', 1 - stSeg(t, SL.p1 + 0.35, SL.p1 + 0.6));
  if (t > SL.p2 && t < SL.p2 + 0.6) stText(LINES_STORY.crunch, hx + 190, hy - 70, 54, 0.1, '#fff6b0', 1 - stSeg(t, SL.p2 + 0.35, SL.p2 + 0.6));
  if (t > SL.big[0] && t < SL.big[1]) bubble(LINES_STORY.slideBig, x, topY, 30, 380);
  if (t > SL.uh[0] && t < SL.uh[1]) bubble(LINES_STORY.slideUhOh, x, topY, 34, 380);
  if (t > 5.2 && t < 6.9) { const a = 0.5*(1 - stSeg(t, 6.2, 6.9)); stText(LINES_STORY.slideEcho[0], x + 250, topY - 52, 26, 0.08, '#ffd9d9', a*stSeg(t, 5.2, 5.5));
    stText(LINES_STORY.slideEcho[1], x + 330, topY - 98, 20, 0.12, '#ffd9d9', a*0.7*stSeg(t, 5.5, 5.8)); }
  ctx.restore();
  // the book-shaped hole opens up into the octagon game: the same red tube, his books flying through it
  if (t > SL.open[0]) {
    const e = ease(stSeg(t, SL.open[0], SL.open[1])), sc = lerp(1, Math.hypot(W, H)*2.4/hh, e*e), sq = lerp(hsq, 1, e);
    ctx.save(); stTornPath(hx, lerp(hy, H/2, e), hw*sc, hh*sc, 0, 9, sq);
    if (e < 1) { ctx.lineWidth = 18; ctx.strokeStyle = '#ffc9c4'; ctx.stroke(); }
    ctx.clip();
    if (typeof ogPreview === 'function') ogPreview(t); else stOctaWorld(t, 8, true);
    const [lx, ly] = stOctaLand(), u = stSeg(t, SL.fall, SL.land), landK = stSeg(t, SL.land, SL.land + 0.45);
    if (t > SL.fall) {
      let sq1 = 1, sq2 = 1; if (t >= SL.land) { const q = Math.sin(Math.PI*Math.min(1, landK*1.3)); sq1 = 1 - 0.28*q; sq2 = 1 + 0.25*q; }
      nailong(lx, t < SL.land ? lerp(-260, ly, u*u) : ly, 0.36, {arms: t < SL.land ? 'up' : 'down', flail: t*20, look: t < SL.land ? [0, -1] : [0, 0], sx: sq2, sy: sq1, mouth: 'open'});
    }
    ctx.restore();
    if (e < 1) { stTornPath(hx, lerp(hy, H/2, e), hw*sc, hh*sc, 0, 9, sq); ctx.lineWidth = 5; ctx.strokeStyle = C.line; ctx.stroke(); }
  }
}
// the atrium, the stairs and the tube from outside, and the inside of the tube (kept from the 11 Oct slide)
function stSlideGeom(){
  const gy = H*0.86;
  return {gy, platTop: gy - 260, P0: [W*0.30, gy - 322], P1: [W*0.46, gy - 336], P2: [W*0.58, gy - 112], P3: [W*0.80, gy - 70]};
}
function stBez(g, u){
  const a = (1-u)**3, b = 3*(1-u)**2*u, c = 3*(1-u)*u*u, d = u**3;
  return [a*g.P0[0] + b*g.P1[0] + c*g.P2[0] + d*g.P3[0], a*g.P0[1] + b*g.P1[1] + c*g.P2[1] + d*g.P3[1]];
}
function stTubePath(g, dy = 0, u0 = 0, u1 = 1){
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) { const p = stBez(g, u0 + (u1 - u0)*i/40); i ? ctx.lineTo(p[0], p[1] + dy) : ctx.moveTo(p[0], p[1] + dy); }
}
// the Junior School atrium, as in the real photos: timber slat wall, white ring lights, glass, dark carpet
function stAtrium(g){
  const gy = g.gy, ch = H*0.12;
  ctx.fillStyle = '#ece6dc'; ctx.fillRect(0, 0, W, gy);
  ctx.fillStyle = '#f7f7f7'; ctx.fillRect(0, 0, W, ch);
  ctx.strokeStyle = 'rgba(74,47,12,.14)'; ctx.lineWidth = 2;
  for (let x = 0; x < W; x += 72) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(0, ch); ctx.lineTo(W, ch); ctx.stroke();
  const tw = W*0.36;                        // diagonal timber feature wall
  ctx.save(); ctx.beginPath(); ctx.rect(0, ch, tw, gy - ch); ctx.clip();
  ctx.fillStyle = '#b97a48'; ctx.fillRect(0, ch, tw, gy - ch);
  for (let i = -14; i < 40; i++) { ctx.strokeStyle = i % 2 ? '#a5693b' : '#cf9560'; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(i*26, ch); ctx.lineTo(i*26 + (gy - ch)*0.7, gy); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.strokeRect(0, ch, tw, gy - ch);
  const gx0 = W*0.62;                       // glass wall
  ctx.fillStyle = '#c4e7fb'; ctx.fillRect(gx0, ch + 20, W - gx0, gy - ch - 28);
  ctx.fillStyle = '#fff'; ell(gx0 + (W - gx0)*0.3, ch + 120, 60, 22); ctx.fill(); ell(gx0 + (W - gx0)*0.42, ch + 105, 44, 18); ctx.fill();
  ctx.strokeStyle = '#8d96a3'; ctx.lineWidth = 6; ctx.strokeRect(gx0, ch + 20, W - gx0, gy - ch - 28);
  for (let i = 1; i < 4; i++) { const xx = gx0 + (W - gx0)*i/4; ctx.beginPath(); ctx.moveTo(xx, ch + 20); ctx.lineTo(xx, gy - 8); ctx.stroke(); }
  ctx.fillStyle = '#2e8b3a'; rr(W*0.8, ch + 100, 60, 22, 4); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke();
  font(13, 700); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('EXIT', W*0.8 + 30, ch + 111);
  for (const rx of [W*0.5, W*0.72, W*0.9]) {  // hanging white ring lights
    ctx.strokeStyle = '#b8b8b8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(rx - 60, ch); ctx.lineTo(rx - 60, ch + 52); ctx.moveTo(rx + 60, ch); ctx.lineTo(rx + 60, ch + 52); ctx.stroke();
    ell(rx, ch + 58, 92, 20); ctx.lineWidth = 17; ctx.strokeStyle = '#c9c9c9'; ctx.stroke(); ctx.lineWidth = 11; ctx.strokeStyle = '#fff'; ctx.stroke();
  }
  ctx.fillStyle = '#4a4d57'; ctx.fillRect(0, gy, W, H - gy);
  for (let i = 0; i < 26; i++) { ctx.fillStyle = i % 2 ? '#575b67' : '#40434d'; rr(stRnd(i)*W, gy + 8 + stRnd(i + 40)*(H - gy - 28), 70 + stRnd(i + 80)*70, 14, 4); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(0, gy, W, 5);
}
function stStairs(g){
  const x0 = W*0.03, x1 = W*0.18, n = 9, dy = 260/n, dx = (x1 - x0)/n, gy = g.gy;
  ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.lineJoin = 'round'; ctx.fillStyle = '#d7d1c7';
  for (let i = 0; i < n; i++) { const xx = x0 + i*dx; ctx.fillRect(xx, gy - (i + 1)*dy, x1 - xx + 2, (i + 1)*dy); ctx.strokeRect(xx, gy - (i + 1)*dy, x1 - xx + 2, (i + 1)*dy); }
  ctx.fillStyle = '#9a9ca3'; ctx.fillRect(W*0.295, g.platTop, 26, gy - g.platTop); ctx.strokeRect(W*0.295, g.platTop, 26, gy - g.platTop);
  ctx.fillStyle = '#cfc8bd'; rr(x1 - 4, g.platTop, W*0.31 - x1 + 4, 22, 4); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#9aa3ae'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x0, gy - 80); ctx.lineTo(x1, g.platTop - 80); ctx.lineTo(W*0.22, g.platTop - 80); ctx.stroke();
}
function stTubeOutside(g){
  const gy = g.gy;
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ell((g.P0[0] + g.P3[0])/2, gy + 12, (g.P3[0] - g.P0[0])*0.55, 14); ctx.fill();
  ctx.strokeStyle = '#2f6fc9'; ctx.lineWidth = 9; ctx.lineCap = 'round';        // thin blue steel legs
  for (const u of [0.38, 0.62, 0.84]) { const p = stBez(g, u); ctx.beginPath(); ctx.moveTo(p[0], p[1] + 30); ctx.lineTo(p[0] - 10, gy + 2); ctx.stroke(); }
  ctx.lineCap = 'butt';
  const dcx = g.P0[0] - W*0.012, dcy = g.P0[1] - 74, dr = 138;    // the big white disc above the entrance
  ctx.fillStyle = '#f4f4f4'; ctx.strokeStyle = C.line; ctx.lineWidth = 5; ell(dcx, dcy, dr, dr); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(74,47,12,.16)'; ctx.lineWidth = 3; ell(dcx, dcy, dr - 14, dr - 14); ctx.stroke();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  stTubePath(g); ctx.lineWidth = 132; ctx.strokeStyle = C.line; ctx.stroke();
  stTubePath(g); ctx.lineWidth = 118; ctx.strokeStyle = '#e0303a'; ctx.stroke();
  stTubePath(g, 32, 0.02, 0.97); ctx.lineWidth = 34; ctx.strokeStyle = '#b3141f'; ctx.stroke();      // shaded underside
  stTubePath(g, -28, 0.04, 0.9); ctx.lineWidth = 13; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.stroke();   // gloss
  ctx.lineCap = 'butt';
  const m = g.P3;                                                // open mouth at the bottom
  ell(m[0] + 3, m[1], 33, 62); ctx.fillStyle = '#ff6a6a'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.line; ctx.stroke();
  ell(m[0] + 6, m[1], 22, 50); ctx.fillStyle = '#5a0c12'; ctx.fill(); ctx.stroke();
  const e = g.P0;                                                // entrance end
  ell(e[0], e[1], 33, 63); ctx.fillStyle = '#ff6a6a'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.line; ctx.stroke();
  ell(e[0] + 1, e[1], 23, 52); ctx.fillStyle = '#5a0c12'; ctx.fill(); ctx.stroke();
}
function stRed(z, alt){
  const k = clamp((z - 0.6)/6.5, 0, 1), a = [226, 50, 59], b = [52, 6, 12], d = alt ? 0.9 : 1, m = i => Math.round(lerp(a[i], b[i], Math.pow(k, 0.8))*d);
  return `rgb(${m(0)},${m(1)},${m(2)})`;
}
function stTubeInside(cx, cy, RR){
  ctx.fillStyle = '#2b0409'; ctx.fillRect(-30, -30, W + 60, H + 60);
  const zs = []; for (let z = 0.6; z < 10; z *= 1.2) zs.push(z);
  zs.forEach((z, i) => { ctx.beginPath(); ctx.arc(cx, cy, RR/z, 0, Math.PI*2); ctx.fillStyle = stRed(z, i % 2); ctx.fill(); });
  zs.forEach(z => {                                 // glossy seams and a highlight along the upper left wall
    const r = RR/z; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.strokeStyle = 'rgba(80,5,12,.5)'; ctx.lineWidth = Math.max(1.5, 5/z); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r*0.93, Math.PI*1.1, Math.PI*1.42); ctx.strokeStyle = 'rgba(255,255,255,.26)'; ctx.lineWidth = Math.max(2, 14/z); ctx.lineCap = 'round'; ctx.stroke(); ctx.lineCap = 'butt';
  });
  ell(cx, cy, RR/11, RR/11); ctx.fillStyle = '#ffd3d3'; ctx.fill();               // the entrance, far behind
  ell(cx, cy, RR/18, RR/18); ctx.fillStyle = '#fff'; ctx.fill();
}

// =====================================================================================
// ---------- THE DECK cafe: a warm simple cafe with a chiller fridge on the right ----------
function stCafeGeom(){
  const fy = H*0.67, x0 = W*0.62, w = W*0.25, top = H*0.14, bot = fy + 8, gy = H*0.86;
  const shelf = [H*0.34, H*0.44, H*0.54, H*0.64], slotX = i => x0 + 12 + (w - 24)*(0.12 + 0.19*i);
  return {fy, x0, w, top, bot, gy, shelf, slotX, bx: slotX(1), by: shelf[0]};
}
function stCafeBg(o = {}){
  const g = stCafeGeom(), fy = g.fy, sway = o.sway || 0, t = o.t || 0;
  ctx.fillStyle = '#f5ddb0'; ctx.fillRect(0, 0, W, fy);
  ctx.fillStyle = '#e7b8a0'; ctx.fillRect(0, fy - 130, W, 130);
  ctx.strokeStyle = 'rgba(74,47,12,.15)'; ctx.lineWidth = 3;
  for (let x = 0; x < W; x += 46) { ctx.beginPath(); ctx.moveTo(x, fy - 130); ctx.lineTo(x, fy); ctx.stroke(); }
  ctx.fillStyle = '#b8644a'; ctx.fillRect(0, fy - 134, W, 10);
  ctx.fillStyle = '#efe7da'; ctx.fillRect(0, 0, W, H*0.045); ctx.strokeStyle = C.line; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, H*0.045); ctx.lineTo(W, H*0.045); ctx.stroke();
  const wx = W*0.40, wy = H*0.14, ww = W*0.17, wh = H*0.30;
  ctx.fillStyle = '#a8dcf5'; ctx.strokeStyle = C.line; ctx.lineWidth = 6; rr(wx, wy, ww, wh, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ell(wx + ww*0.3, wy + wh*0.35, 34, 16); ctx.fill(); ell(wx + ww*0.38, wy + wh*0.3, 26, 14); ctx.fill();
  ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(wx + ww/2, wy); ctx.lineTo(wx + ww/2, wy + wh); ctx.stroke();
  ctx.fillStyle = '#5a3a24'; rr(W*0.07, H*0.22, W*0.2, 74, 12); ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
  title(LINES_STORY.cafeSign, W*0.17, H*0.22 + 37, Math.min(40, W/30), '#ffe9b0');
  // counter with a coffee machine, along the left
  ctx.fillStyle = '#9b6a42'; ctx.lineWidth = 5; rr(-10, fy - 80, g.x0 + 20, 90, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c99263'; ctx.fillRect(-6, fy - 84, g.x0 + 10, 14); ctx.strokeRect(-6, fy - 84, g.x0 + 10, 14);
  ctx.fillStyle = '#8d939c'; rr(W*0.1, fy - 150, 80, 70, 8); ctx.fill(); ctx.stroke();
  ell(W*0.1 + 40, fy - 118, 14, 14); ctx.fillStyle = '#e0372f'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; for (const cx of [W*0.3, W*0.33, W*0.55]) { rr(cx, fy - 120, 28, 36, 5); ctx.fill(); ctx.stroke(); }
  // the drinks fridge
  ctx.lineWidth = 6; ctx.strokeStyle = C.line; ctx.fillStyle = '#aeb8c4'; rr(g.x0, g.top, g.w, g.bot - g.top, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e4f4fb'; rr(g.x0 + 12, g.top + 14, g.w - 24, g.bot - g.top - 26, 6); ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(g.x0 + 18, g.top + 20, 10, g.bot - g.top - 38);
  g.shelf.forEach((sy, r) => {
    ctx.fillStyle = '#8d96a3'; ctx.fillRect(g.x0 + 12, sy, g.w - 24, 7); ctx.lineWidth = 2.5; ctx.strokeRect(g.x0 + 12, sy, g.w - 24, 7);
    for (let i = 0; i < 5; i++) { if (r === 0 && i === 1) continue; stBottle((r*2 + i*3 + (i % 2)) % 3, g.slotX(i), sy, 60); }
  });
  if (!o.noHero) stRedBean(g.bx, g.by, 62);
  ctx.strokeStyle = 'rgba(74,47,12,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, H*0.045 + 8); ctx.quadraticCurveTo(W/2, H*0.045 + 76, W, H*0.045 + 8); ctx.stroke();
  for (let i = 1; i < 14; i++) { const u = i/14, lx = W*u + Math.sin(t*5 + i)*sway*8, ly = H*0.045 + 8 + 2*u*(1 - u)*68 + 4; ell(lx, ly + 6, 6, 8); ctx.fillStyle = (i % 2) ? '#ffe56b' : '#ffb347'; ctx.fill(); }
  ctx.fillStyle = '#d69a62'; ctx.fillRect(0, fy, W, H - fy);
  ctx.strokeStyle = 'rgba(74,47,12,.2)'; ctx.lineWidth = 3;
  for (let i = 0; i < 7; i++) { const yy = fy + (H - fy)*Math.pow(i/7, 1.3); ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }
  for (let x = -W; x < 2*W; x += 120) { ctx.beginPath(); ctx.moveTo(W/2 + (x - W/2)*0.55, fy); ctx.lineTo(W/2 + (x - W/2)*1.5, H); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,240,200,.18)'; ctx.fillRect(0, fy, W, 8);
}
function stShadow(x, y, w){ ell(x, y, Math.max(10, w), Math.max(10, w)*0.16); ctx.fillStyle = 'rgba(74,47,12,.25)'; ctx.fill(); }

// ---------- scene 3: Nailong hops into the cafe from the Chinese room corridor, can't reach the red bean, Scarlett can (13.0 s) ----------
// Authored at 9.4 s; CAFE1_WARP slows the strain, the failed jumps and the hand-over so each line can be read twice (lines are timed on T).
const CAFE1_DUR = 13.0, ST_CAFE1_T = CAFE1_DUR;
const CAFE1_WARP = [[0, 0], [3.4, 3.4], [4.6, 4.0], [5.6, 5.0], [6.6, 5.6], [7.4, 6.4], [9.0, 7.5]];
const C1_SFX = [[0.35, 'boing', {p: 1.3, g: 0.35}], [0.75, 'boing', {p: 1.4, g: 0.35}], [1.2, 'thud', {g: 0.6}], ...[2.0, 2.25, 2.5, 2.75].map(x => [x, 'tick', {p: 0.6, g: 0.35}]),
  [4.0, 'boing', {p: 1.2, g: 0.6}], [4.5, 'thud', {p: 1.5, g: 0.5}], [4.52, 'boing', {p: 1.35, g: 0.6}], [5.0, 'thud', {p: 1.5, g: 0.5}],
  ...[4.75, 5.05, 5.35, 5.65].map(x => [x, 'tick', {p: 0.5, g: 0.3}]), [6.2, 'pop', {p: 1.2, g: 0.6}], [7.0, 'clink']];
function sceneCafe1(T){
  const t = stWarp(T, CAFE1_WARP); stCues('cafe1', t, C1_SFX);
  const g = stCafeGeom(), gy = g.gy, NS = 0.95, SS_ = 0.95;
  const taken = t > 6.0;
  stCafeBg({noHero: true, t});
  if (!taken) stRedBean(g.bx, g.by, 62);
  const nx0 = W*0.40, nxStand = g.bx - 28;
  let nx = nx0, ny = gy;
  const o = {arms: 'down', mouth: 'open', look: [0, 0]};
  let sx = 1, sy = 1, rot = 0;
  // arrival: he hops in from the left, still happy from the Chinese room (sceneChineseOut ends with him hopping off right)
  if (t < 1.2) { const k = ease(stSeg(t, 0.05, 1.2)); nx = lerp(-140, nx0, k); ny = gy - Math.abs(Math.sin(t*Math.PI*2.5))*34*(1 - k*0.6); o.walk = t*14; o.mouth = 'smile'; o.look = [1, -0.2]; }
  else if (t < 1.65) { const q = Math.sin(Math.PI*stSeg(t, 1.2, 1.65)); sx = 1 + 0.12*q; sy = 1 - 0.12*q; o.look = [0.8, -0.2]; o.mouth = 'smile'; }
  else if (t < 3.0) { const u = ease(stSeg(t, 1.95, 3.0)); nx = lerp(nx0, nxStand, u); o.walk = t*13; o.look = u > 0 ? [1, -0.4] : [0.8, 0]; o.mouth = 'smile'; ny = gy - (u > 0 && u < 1 ? Math.abs(Math.sin(t*13))*5 : 0); }
  else { nx = nxStand; }
  // reaching, jumping, failing
  if (t >= 3.0 && t < 5.4) {
    o.mouth = 'o'; o.look = [0.3, -1];
    if (t < 4.0) { const u = stSeg(t, 3.2, 3.9); o.arms = 'up'; o.flail = t*9; sy = 1 + 0.2*ease(u) + Math.sin(t*25)*0.01*u; sx = 1 - 0.07*ease(u); }
    else if (t < 4.5) { const h = stHop(t, 4.0, 4.5, 70), u = (t - 4.0)/0.5; o.arms = 'up'; o.flail = t*12; ny = gy - h; sy = u < 0.2 ? 1.12 : (u > 0.85 ? 0.85 : 1); sx = 2 - sy; }
    else if (t < 5.0) { const h = stHop(t, 4.5, 5.0, 125), u = (t - 4.5)/0.5; o.arms = 'up'; o.flail = t*16; ny = gy - h; sy = u < 0.2 ? 1.18 : (u > 0.85 ? 0.8 : 1.04); sx = 2 - sy; }
    else { o.arms = 'down'; o.look = [0.2, -0.8]; sy = 0.9; sx = 1.08; }
  }
  if (t >= 5.4) { o.arms = 'down'; o.look = [0.6, -0.9]; o.mouth = 'o'; }
  // Scarlett: walks in from the right, plucks the bottle without looking, lowers it to Nailong
  const sxS = t < 4.6 ? W*1.15 : lerp(W*1.15, g.bx + 120, ease(stSeg(t, 4.6, 5.9)));
  const walking = t > 4.6 && t < 5.9;
  let armL = 0.06, lenL = 1, tiptoe = 0, lean = 0, bPos = null;
  const baseY = gy - (walking ? Math.abs(Math.sin(t*12))*5 : 0);
  const k = SS_*CAST.scarlett.h;
  const hold = [nx + 4*NS, gy - 14*NS - 31];                           // where the bottle ends up: low against his belly, in his paws (it floated over his mouth before)
  if (t >= 5.9) {
    const reach = ease(stSeg(t, 5.9, 6.2)), down = ease(stSeg(t, 6.35, 7.0)), back = ease(stSeg(t, 7.0, 7.5));
    tiptoe = 14*reach*(1 - down); lean = -0.05*reach*(1 - down);
    const bp = [lerp(g.bx, hold[0], down), lerp(g.by - 30, hold[1], down)];
    bPos = bp;
    const shoulderY = baseY - tiptoe;
    const aim = stArmTo(sxS, shoulderY, k, -1, taken ? bp[0] + 10 : g.bx + 6, taken ? bp[1] - 14 : g.by - 34);   // after the hand-over the arm drops from Nailong, not from the shelf
    if (t < 7.0) { armL = aim.a; lenL = aim.len; }
    else { armL = lerp(aim.a, 0.06, back); lenL = lerp(aim.len, 1, back); }
  }
  // ---- draw order: Scarlett, Nailong ----
  stShadow(nx, gy + 2, 80*NS); if (sxS < W + 200) stShadow(sxS, gy + 2, 70);
  const drawScarlett = () => { if (sxS < W + 200) storyPerson(sxS, baseY - tiptoe, SS_, CAST.scarlett, {mouth: 'smile', look: [-0.7, 0.5], armL, lenL, rot: lean}); };
  const handing = t >= 6.35 && t < 7.5;                                 // lowering the bottle to him: her arm in front of him, so her hand stays on it
  if (!handing) drawScarlett();
  const bobN = 0;
  (t >= 7.0 ? stNailongHolding : nailong)(nx, ny - bobN, NS, {...o, sx, sy, rot});   // holding the bottle: its two paws are his hands
  if (handing) drawScarlett();
  fxMark('sweat', nx + 50*NS, ny - 186*NS*sy, stSeg(t, 5.05, 5.7));    // sweat drop after the third failed jump
  stDust(nx, gy, stSeg(t, 1.2, 2.0), 22);
  if (bPos) { const hh = 62, fx = bPos[0], fy = bPos[1] + hh*0.5; stRedBean(fx, fy, hh, 0);
    if (t >= 7.0) for (const sg of [-1, 1]) { ell(fx + sg*hh*0.25, fy - hh*0.36, 11*NS, 9*NS); ctx.fillStyle = C.y; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke(); } }   // his paws round it, like the boba in sceneCafe2
  if (false) {   // (the old octagon-portal arrival, kept out of the ride since the Chinese room now comes first)
    const pr = 0, pcx = 0, pcy = 0, portal = 0;
    const poly = () => { ctx.beginPath(); for (let i = 0; i <= 8; i++) { const a = i/8*Math.PI*2 + Math.PI/8 + t*3; const px = pcx + Math.cos(a)*pr, py = pcy + Math.sin(a)*pr; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); };
    ctx.save(); poly(); ctx.clip(); stOctaWorld(t + 5, 305, false); ctx.restore();
    ctx.save(); poly(); ctx.lineWidth = 10; ctx.strokeStyle = `hsl(${290 - portal*200},65%,60%)`; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
  }
  // lines
  const topN = ny - 190*NS*sy;
  if (T > 3.6 && T < 5.0) bubble(LINES_STORY.reachGrunt, nx, topN, 30);
  if (T > 7.5 && T < 10.0) bubble(LINES_STORY.scarlettLine, sxS, baseY - 272*k - 14, 32, 360);
  if (T > 10.4) bubble(LINES_STORY.thanks, nx, topN, 32);
}

// ---------- scene 4 (Max, 12 Oct): Nailong sips a boba from the bottle game ("Whew, that game sucked."), Mr Shou walks in with a pile of
// maths textbooks and accidentally kicks him (THUD), the argument in Max's words, Nailong jumps up and flying-kicks Mr Shou into the
// wall, Mr Shou dizzy among his scattered books picks them up one by one while the music climaxes, "Nailong! You're cooked!", cut to the fight.
// Paced to be read twice: a line holds about 2.5 s of scene time (3.5 s on screen at main.js's 70% clip speed), a beat after each punchline.
const CAFE2_DUR = 31.0, ST_CAFE2_T = CAFE2_DUR;
const C2 = {kick: 6.75, land: 7.3, sucked: [1.9, 4.4], watch: [7.7, 10.1], short: [10.4, 13.0], hey: [13.5, 15.1], maths: [15.4, 18.0], shock: 16.9,
  crouch: 18.7, grow: 19.1, go: 19.9, hit: 20.1, back: 20.5, wall: 20.65, slide: 21.15, floor: 21.75, pick: 23.3, pickD: 0.95, cooked: [28.3, 30.75]};
const C2_BOOKS = [0, 1, 2, 3, 4].map(k => ({red: k % 2 === 0, t0: C2.hit + 0.02 + k*0.05, d: 0.5 + stRnd(k + 7)*0.25, top: 150 + stRnd(k + 11)*120,
  spin: 7 + k*1.7, rest: (stRnd(k + 5) - 0.5)*0.5, jit: (stRnd(k + 2) - 0.5)*30, dy: [10, -8, 18, -4, 8][k]}));
const C2_SFX = [
  [0.4, ['slurp', 'whoosh'], {p: 0.45, g: 0.5}], [1.0, ['gulp', 'pop'], {p: 0.6, g: 0.6}], [1.3, ['gulp', 'pop'], {p: 0.55, g: 0.6}],
  ...[0, 1, 2, 3, 4, 5].map(i => [4.55 + i*0.39, 'tick', {p: 0.55, g: 0.35}]),                         // Mr Shou's footsteps
  [4.9, ['slurp', 'whoosh'], {p: 0.45, g: 0.5}],
  [C2.kick, 'thud'], [C2.kick + 0.02, 'oof', {p: 1.4, g: 0.7}], [C2.kick + 0.75, 'pop', {p: 0.7, g: 0.6}], [C2.land, 'thud', {p: 1.3, g: 0.6}],
  [C2.shock, 'pop', {p: 1.8, g: 0.4}],
  [C2.grow, 'boing'], [C2.go, 'whoosh'], [C2.hit, ['bigkick', 'thwack']], [C2.hit + 0.04, 'thud', {p: 0.8}], [C2.hit + 0.06, 'oof', {p: 0.8}],
  [Math.min(...C2_BOOKS.map(b => b.t0 + b.d)), ['books', 'thud'], {p: 1.5, g: 0.4}, {g: 0.9}],             // the books hit the floor within 0.13 s: ONE books voice (three thumps), not five stacked
  [C2.wall, ['crash', 'thud'], {p: 0.55}], [C2.slide, 'whoosh', {p: 0.4, g: 0.5}], [C2.floor, 'thud', {p: 1.1, g: 0.7}], [21.0, 'pop', {p: 0.9}],
  [C2.floor + 0.3, ['dizzy', 'boing'], {p: 1.6, g: 0.4}], [C2.floor + 0.9, ['dizzy', 'boing'], {p: 1.8, g: 0.35}],
  [C2.pick, () => window.MUSIC && MUSIC.cue && MUSIC.cue('climax')],                                       // he starts picking his books up: the music climaxes
  ...C2_BOOKS.map((b, k) => [C2.pick + (k + 0.52)*C2.pickD, 'pop', {p: 1.1, g: 0.6}]),
  ...C2_BOOKS.map((b, k) => [C2.pick + (k + 1)*C2.pickD - 0.03, 'thud', {p: 1.7, g: 0.45}]),
  [C2.cooked[0] + 0.05, 'whoosh', {p: 1.2, g: 0.5}], [C2.cooked[1], 'thwack', {p: 0.7}],
];
// Nailong's flying kick, a pure function of t: the crouch (crouch to grow), the leap up and across (grow to hit, the leg chambered then
// shooting out from go), the foot on Mr Shou's chest at C2.hit, a short hold, then a rebound back to where he jumped from, landing at
// C2.wall as Mr Shou hits the wall. His own leg, normal size: drawn with stBigLeg over the left foot it replaces.
function c2Kick(t, nxB, gy, xS, NS, SS_){
  const TK = C2.grow, KO = C2.go, HIT = C2.hit, REB = C2.hit + 0.08, LND = C2.wall;
  const HIP = [-14, -16], LF = 62*NS, LW = 28*NS, ROT_H = 0.5, LEG_A = Math.PI - 0.3;
  const tx = xS + 36, ty = gy - 132*SS_;                                       // Mr Shou's chest, behind his pile of books
  const hipAt = (x, y, r) => { const c = Math.cos(r), s = Math.sin(r); return [x + (HIP[0]*c - HIP[1]*s)*NS, y + (HIP[0]*s + HIP[1]*c)*NS]; };
  const hhx = tx - Math.cos(LEG_A)*LF, hhy = ty - Math.sin(LEG_A)*LF;      // at the hit his hip is one leg length from the chest
  const hitX = hhx - (HIP[0]*Math.cos(ROT_H) - HIP[1]*Math.sin(ROT_H))*NS, hitY = hhy - (HIP[0]*Math.sin(ROT_H) + HIP[1]*Math.cos(ROT_H))*NS;
  let x = nxB, y = gy, rot = 0, sx = 1, sy = 1, ext = -1;
  if (t < TK) { const k = stSeg(t, C2.crouch, TK - 0.08); sy = 1 - 0.2*k; sx = 1 + 0.14*k; rot = 0.08*k; }          // the anticipation crouch
  else if (t < HIT) {                                                                                                 // the leap: up, across, down onto him
    const u = stSeg(t, TK, HIT), q = stSeg(t, TK, TK + 0.22);
    x = lerp(nxB, hitX, Math.pow(u, 1.4)); y = lerp(gy, hitY, u) - 190*Math.sin(Math.PI*u);
    sy = 1 + 0.16*(1 - q); sx = 1 - 0.1*(1 - q);
    rot = 0.15*stSeg(t, TK, KO) + (ROT_H - 0.15)*ease(stSeg(t, KO, HIT));
    if (t > KO - 0.15) ext = t < KO ? 0 : ease(stSeg(t, KO, HIT - 0.03));
  } else if (t < REB) {                                                                                               // contact
    const q = Math.sin(Math.PI*stSeg(t, HIT, REB)); x = hitX; y = hitY; rot = ROT_H; ext = 1; sx = 1 - 0.08*q; sy = 1 + 0.06*q;
  } else if (t < LND) {                                                                                               // the rebound, back home
    const v = stSeg(t, REB, LND); x = lerp(hitX, nxB, ease(v)); y = lerp(hitY, gy, v) - 80*Math.sin(Math.PI*v);
    rot = ROT_H*(1 - ease(v)); ext = 1 - ease(stSeg(t, REB, REB + 0.22)); if (ext <= 0.02) ext = -1;
  } else { const q = Math.sin(Math.PI*stSeg(t, LND, LND + 0.3)); sy = 1 - 0.22*q; sx = 1 + 0.18*q; }                  // lands
  let leg = null;
  if (ext >= 0) {
    const [hx, hy] = hipAt(x, y, rot), aim = Math.atan2(ty - hy, tx - hx);
    leg = [hx, hy, lerp(10*NS, LF, ext), LW, lerp(Math.PI/2 + 0.6, aim, ext)];
  }
  return {x, y, rot, sx, sy, leg};
}
function sceneCafe2(t){
  const g = stCafeGeom(), gy = g.gy, NS = 0.95, SS_ = 0.95;
  stCues('cafe2', t, C2_SFX);
  const nxA = W*0.50, nxB = W*0.66, xS = nxA - 126, pw = W*0.065, xw = pw + 48;
  const bookX = k => lerp(pw + 120, nxA - 30, k/4) + C2_BOOKS[k].jit, bookY = k => gy + 4 + C2_BOOKS[k].dy, standX = k => bookX(k) - 58;
  const talk = (a, base) => t - a > 0 && t - a < 1.3 && Math.sin((t - a)*17) > -0.3 ? 'open' : base;
  ctx.save(); stShake(t, [[C2.kick, 9], [C2.land, 4], [C2.hit, 15], [C2.wall, 13], [C2.floor, 5]]);
  stCafeBg({t, sway: t > C2.hit ? Math.max(0, 1 - (t - C2.hit)*0.35) : 0});
  // the wall he is kicked into: a timber pillar on the left, cracked by the hit
  ctx.fillStyle = '#c98f5e'; ctx.fillRect(-10, 0, pw + 10, gy + 14); ctx.strokeStyle = 'rgba(74,47,12,.25)'; ctx.lineWidth = 3;
  for (let x = 14; x < pw; x += 22) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, gy + 14); ctx.stroke(); }
  ctx.fillStyle = '#7b5230'; ctx.fillRect(-10, gy - 16, pw + 10, 30); ctx.lineWidth = 5; ctx.strokeStyle = C.line; ctx.strokeRect(-10, -5, pw + 10, gy + 19);
  if (t > C2.wall) { const cy = gy - 80 - 140*SS_; ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.lineJoin = 'round';
    for (const [a, l] of [[-2.5, 70], [-3.0, 55], [2.6, 64], [3.2, 40], [-1.8, 48], [1.9, 52]]) { ctx.beginPath(); ctx.moveTo(pw, cy);
      for (let j = 1; j <= 3; j++) ctx.lineTo(pw + Math.cos(a)*l*j/3 + (j % 2 ? 6 : -6), cy + Math.sin(a)*l*j/3); ctx.stroke(); } }
  // ---- Nailong ----
  let nx = nxA, ny = gy, nrot = 0, nsx = 1, nsy = 1, brows = null;
  const o = {arms: 'down', mouth: 'smile', look: [0.5, 0]};
  const r1 = stSeg(t, 0.35, 0.6) - stSeg(t, 1.45, 1.7), r2 = stSeg(t, 4.6, 4.85), raised = t < C2.kick ? Math.max(r1, r2) : 0;
  const level = 0.9 - 0.35*stSeg(t, 0.6, 1.45) - 0.3*stSeg(t, 4.85, C2.kick);
  if (t < C2.kick) {
    if (raised > 0.5) { o.mouth = 'o'; o.look = [0.3, -0.9]; nsy = 1 + 0.02*Math.sin(t*14); }
    if (t > 1.7 && t < 1.95) { nsy = 1 - 0.06*Math.sin(Math.PI*stSeg(t, 1.7, 1.95)); o.mouth = 'open'; }
    if (t > C2.sucked[0] && t < 4.6) { o.mouth = talk(C2.sucked[0], 'smile'); o.look = [0.2, -0.1]; }
    if (t > 4.6 && raised < 0.5) o.look = [0.6, 0];
  } else if (t < C2.land) {                                            // the kick: squashed, then a hop forward
    const q = stSeg(t, C2.kick, C2.kick + 0.15);
    if (q < 1) { nsx = 1 + 0.45*Math.sin(Math.PI*q); nsy = 1 - 0.35*Math.sin(Math.PI*q); }
    const u = stSeg(t, C2.kick + 0.15, C2.land); nx = lerp(nxA, nxB, ease(u)); ny = gy - stHop(t, C2.kick + 0.15, C2.land, 80);
    nrot = 0.5*Math.sin(Math.PI*u); o.arms = 'up'; o.flail = t*22; o.mouth = 'o'; o.look = [0, -1];
  } else {
    nx = nxB; o.look = [-1, 0.1];
    const q = stSeg(t, C2.land, C2.land + 0.35); if (q < 1) { nsy = 1 - 0.28*Math.sin(Math.PI*q); nsx = 1 + 0.22*Math.sin(Math.PI*q); }
    if (t > 7.5) brows = 'mad';
    if (t > C2.watch[0] && t < C2.watch[1]) { o.mouth = talk(C2.watch[0], 'open'); o.arms = 'up'; o.flail = t*9; ny = gy - stHop(t, C2.watch[0], C2.watch[0] + 0.3, 22); }
    if (t > C2.watch[1]) o.mouth = 'o';
    if (t > C2.short[1]) { brows = 'sad'; o.look = [-0.4, 0.7]; nsy = 1 - 0.06*stSeg(t, C2.short[1], C2.short[1] + 0.3); }
    if (t > C2.hey[0] && t < C2.hey[1]) o.mouth = talk(C2.hey[0], 'o');
    if (t > C2.hey[1] + 0.05) { brows = 'smug'; o.mouth = 'smile'; o.look = [-1, 0]; const q2 = stSeg(t, C2.hey[1] + 0.05, C2.maths[0]); nsy = 1 + 0.06*Math.sin(Math.PI*q2); }
    if (t > C2.maths[0] && t < C2.maths[1]) o.mouth = talk(C2.maths[0], 'smile');
    if (t > C2.crouch) {                                              // the flying kick (Max, 13 Oct: "nai longs kick should be him jumping up and doing the kick")
      brows = 'mad'; o.look = [-1, 0];
      const K = c2Kick(t, nxB, gy, xS, NS, SS_);
      nx = K.x; ny = K.y; nrot = K.rot; nsx = K.sx; nsy = K.sy;
      o.arms = t > C2.grow && t < 21.0 ? 'up' : 'down'; o.flail = t*(t < C2.go ? 10 : 4);
      o.mouth = t > C2.grow && t < 21.0 ? 'open' : 'smile';
      if (t > 21.0) { brows = 'smug'; o.look = [-1, 0.1]; }
      if (t > C2.cooked[0]) { brows = 'sad'; o.mouth = 'o'; }
    }
  }
  if (t > C2.wall && t < C2.wall + 0.6) stDust(nxB, gy, stSeg(t, C2.wall, C2.wall + 0.6), 22);   // he lands back where he jumped from
  stShadow(nx, gy + 2, 80*NS);
  (t < C2.kick + 0.05 ? stNailongHolding : nailong)(nx, ny, NS, {...o, sx: nsx, sy: nsy, rot: nrot});   // holding the boba: its two paws are his hands
  if (brows) stBrows(nx, ny, NS, brows, nsx, nsy, nrot);
  if (t > C2.land) stDust(nxB, gy, stSeg(t, C2.land, C2.land + 0.7), 22);
  fxMark('sweat', nx + 50*NS, ny - 186*NS, stSeg(t, C2.cooked[0] + 0.7, C2.cooked[0] + 1.5));
  // the boba: in his paws, sipped; knocked out at the kick, lands upright by the fridge
  const ch = 66*NS, ck = ch/100;
  if (t < C2.kick + 0.05) {
    const cx = nx + 4*NS, cy = ny - lerp(12, 37, raised)*NS*nsy;
    stBoba(cx, cy, ch, 0, level, raised > 0.05 ? [lerp(cx + 12*ck, nx, raised), lerp(cy - 104*ck, ny - 106*NS*nsy, raised)] : null);
    for (const sg of [-1, 1]) { ell(cx + sg*25*ck, cy - 36*ck, 11*NS, 9*NS); ctx.fillStyle = C.y; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke(); }
  } else {
    const u = stSeg(t, C2.kick + 0.05, C2.kick + 0.75), x0 = nxA + 4*NS, y0 = gy - 12*NS, x1 = nxB + 120, y1 = gy + 12;
    stBoba(lerp(x0, x1, u), lerp(y0, y1, u) - Math.sin(Math.PI*u)*170, ch, u*Math.PI*4, level, null);
  }
  // ---- Mr Shou ----
  const so = {mouth: 'grin', armL: 0.12, armR: 0.12, look: [1, -0.4], eyes: 'happy', hair: Math.sin(t*6)*0.3, books: 5};
  let sx = xS, sy = gy, still = true, picked = 5, held = null, swirl = false;
  if (t < C2.kick + 0.3) {                                             // walks in whistling, kicks without looking
    sx = lerp(-130, xS, stSeg(t, 4.3, C2.kick)); still = false;
    Object.assign(so, {walk: t*8, moving: t > 4.3 && t < C2.kick, kick: Math.max(0, 1 - Math.abs(t - C2.kick)/0.22), rot: Math.sin(t*8)*0.015*(t < C2.kick ? 1 : 0)});
    if (t > C2.kick) Object.assign(so, {mouth: 'o', eyes: 'dot', look: [1, 0.7]});
  } else if (t < C2.hit) {
    Object.assign(so, {mouth: 'o', eyes: 'dot', look: [1, 0.6]});
    if (t > C2.watch[1]) so.mouth = 'grin';
    if (t > C2.short[0] && t < C2.short[1]) so.mouth = talk(C2.short[0], 'grin') === 'open' ? 'smile' : 'grin';
    if (t > C2.short[1] - 0.5 && t < C2.maths[0] + 1.5) so.eyes = 'happy';
    if (t > C2.shock) Object.assign(so, {mouth: 'o', eyes: 'dot', brow: 'up', look: [1, 0.3]});
    if (t > C2.go) so.sx = 1 + 0.25*stSeg(t, C2.go, C2.hit);                // the foot arrives
  } else if (t < C2.wall) {                                            // kicked across the cafe
    const u = stSeg(t, C2.hit, C2.wall); sx = lerp(xS, xw - 18, 1 - (1 - u)*(1 - u)); sy = gy - Math.sin(Math.PI*u*0.85)*120 - u*30;
    Object.assign(so, {mouth: 'oof', eyes: 'x', rot: -0.55*Math.sin(Math.PI*u*0.9), armL: 2.2, armR: 2.0, hair: -0.9, books: 0}); picked = 0;
  } else if (t < C2.floor) {                                           // flat against the wall, then slides down it
    const u = stSeg(t, C2.slide, C2.floor), st = stSeg(t, C2.wall, C2.wall + 0.12);
    sx = lerp(xw - 18, xw, u); sy = lerp(gy - 80, gy, u*u);
    Object.assign(so, {mouth: 'oof', eyes: 'x', sx: lerp(lerp(1, 0.62, st), 1, u), sy: lerp(lerp(1, 1.1, st), 0.9, u), armL: lerp(1.5, 0.3, u), armR: lerp(1.5, 0.3, u), books: 0, hair: 0.8}); picked = 0;
  } else if (t < C2.pick) {                                            // dizzy among his books
    sx = xw; const q = stSeg(t, C2.floor, C2.floor + 0.3);
    Object.assign(so, {mouth: 'oof', eyes: 'dot', rot: Math.sin(t*3.2)*0.07, sy: 1 - 0.1*Math.sin(Math.PI*q), books: 0, hair: Math.sin(t*3.2)*0.5}); picked = 0; swirl = true;
  } else if (t < C2.pick + 5*C2.pickD) {                               // picks them up, one by one, slowly and dramatically
    const k = Math.floor((t - C2.pick)/C2.pickD), u = (t - C2.pick)/C2.pickD - k;
    const mv = ease(clamp(u/0.28, 0, 1)); sx = lerp(k ? standX(k - 1) : xw, standX(k), mv); sy = gy - (mv > 0 && mv < 1 ? Math.sin(Math.PI*mv)*12 : 0);
    const bend = u < 0.3 ? 0 : u < 0.52 ? ease((u - 0.3)/0.22) : u < 0.8 ? 1 - ease((u - 0.52)/0.28) : 0;
    const raise = u < 0.52 ? 0 : u < 0.8 ? ease((u - 0.52)/0.28) : 1 - ease((u - 0.8)/0.2);
    Object.assign(so, {mouth: raise > 0.3 ? 'smile' : 'o', eyes: raise > 0.5 ? 'happy' : 'dot', look: [0.6, 0.6 - raise*1.3], rot: 0.36*bend, sy: 1 - 0.08*bend + 0.03*raise,
      armR: 0.12 + 0.35*bend + 2.45*raise, hair: Math.sin(Math.PI*raise)*0.9, books: k});
    picked = k; if (u >= 0.52) held = {k, u};
  } else {                                                             // "Nailong! You're cooked!"
    sx = standX(4); const pt = stSeg(t, C2.cooked[0], C2.cooked[0] + 0.25);
    Object.assign(so, {mouth: t > C2.cooked[0] ? (talk(C2.cooked[0], 'grin') === 'open' ? 'o' : 'grin') : 'smile', eyes: 'dot', look: [1, 0.3],
      armR: 0.12 + 1.65*fxBack(pt) + Math.sin(t*18)*0.03*pt, sy: 1 + 0.03*stSeg(t, C2.pick + 5*C2.pickD, C2.cooked[0])});
  }
  // books on the floor, and books in the air
  C2_BOOKS.forEach((b, k) => {
    if (t < b.t0 || k < picked || (held && held.k === k)) return;
    const u = stSeg(t, b.t0, b.t0 + b.d), x0 = xS - 30 + k*6, y0 = gy - 150*SS_ - k*14;
    const bx = lerp(x0, bookX(k), u), by = lerp(y0, bookY(k), u) - Math.sin(Math.PI*u)*b.top, rot = u < 1 ? u*b.spin : b.rest;
    stBookAt(bx, by, rot, SS_, b.red);
  });
  stShadow(sx, gy + 2, 80*Math.max(0.2, 1 - (gy - sy)/200));
  const hands = stShou(sx, sy, SS_, {...so, still});
  if (t > C2.crouch && t < C2.wall) { const K = c2Kick(t, nxB, gy, xS, NS, SS_); if (K.leg) stBigLeg(...K.leg); }   // Nailong's own leg, out for the kick, over the foot it replaces and over Mr Shou at the hit
  if (held) {                                                          // the book he lifts: to his raised hand, then onto the pile
    const b = C2_BOOKS[held.k], hr = hands.handR, lift = stSeg(held.u, 0.52, 0.62), place = stSeg(held.u, 0.8, 1.0);
    const top = stShouPt(sx, sy, SS_, so, -43 + (held.k % 2 ? -4 : 3), -97 - held.k*17 - 8);
    const hx = lerp(bookX(held.k), hr[0], lift), hy = lerp(bookY(held.k), hr[1] - 14, lift);
    stBookAt(lerp(hx, top[0], ease(place)), lerp(hy, top[1], ease(place)), lerp(b.rest, (so.rot || 0) + 0.1*Math.sin(t*3)*(1 - place), lift), SS_, b.red);
    const gl = stSeg(held.u, 0.66, 0.84); if (gl > 0 && gl < 1) stStar(hr[0] + 30, hr[1] - 40, 13*Math.sin(Math.PI*gl), gl*3, '#fff');
  }
  if (swirl) {                                                         // swirly eyes and stars round his head
    for (const ex of [-17.9, 17.9]) { const [px, py] = stShouPt(sx, sy, SS_, so, ex, -226); ell(px, py, 9.5, 9.5); ctx.fillStyle = '#fff'; ctx.fill(); stSwirl(px, py, 8.5, t*9*(ex < 0 ? 1 : -1)); }
    const [hx, hy] = stShouPt(sx, sy, SS_, so, 0, -282);
    for (let i = 0; i < 4; i++) { const a = t*4.5 + i*Math.PI/2; stStar(hx + Math.cos(a)*55, hy + Math.sin(a)*12, 11, a); }
  }
  if (t > C2.shock && t < C2.hit) fxMark('bang', sx + 40, gy - 290*SS_, stSeg(t, C2.shock, C2.shock + 0.9));
  fxMark('sweat', sx + 44*SS_, gy - 262*SS_, stSeg(t, C2.grow + 0.2, C2.go + 0.1));
  // whistle notes on the walk in
  if (t > 4.3 && t < C2.kick) for (let i = 0; i < 2; i++) { const a = ((t*0.9 + i*0.5) % 1); ctx.globalAlpha = 1 - a; stNote(sx + 40 + i*34, gy - 330*SS_ - a*70, 0.8, 0.2*i); ctx.globalAlpha = 1; }
  // impacts and sound words
  if (t > C2.kick + 0.02 && t < C2.kick + 0.6) { const k2 = stSeg(t, C2.kick + 0.02, C2.kick + 0.6); if (k2 < 0.5) stBurst(nxA - 40*NS, gy - 45, 50 + k2*60, k2); stText(LINES_STORY.thud, nxA - 10, gy - 190 - k2*40, 52, -0.12, '#fff', 1 - k2*k2); }
  if (t > C2.hit && t < C2.hit + 0.6) { const k2 = stSeg(t, C2.hit, C2.hit + 0.6); if (k2 < 0.5) stBurst(xS + 30, gy - 135*SS_, 70 + k2*90, k2); stText(LINES_STORY.pow, xS + 40, gy - 330 - k2*40, 78, -0.15, '#ffe14d', 1 - k2*k2); }
  if (t > C2.wall && t < C2.wall + 0.8) { const k2 = stSeg(t, C2.wall, C2.wall + 0.8); stText(LINES_STORY.crash, pw + 250, gy - 300 - k2*30, 56, 0.12, '#fff', 1 - k2*k2); }
  if (t > C2.floor) stDust(xw, gy, stSeg(t, C2.floor, C2.floor + 0.6), 20);
  // lines (Max's, in order)
  const nTop = ny - 190*NS*nsy - 6, sTop = gy - 272*SS_ - 24;
  if (t > C2.sucked[0] && t < C2.sucked[1]) bubble(LINES_STORY.sucked, nxA, nTop, 30, 380);
  if (t > C2.watch[0] && t < C2.watch[1]) bubble(LINES_STORY.watchIt, nx, nTop, 30, 380);
  if (t > C2.short[0] && t < C2.short[1]) bubble(LINES_STORY.short, xS + 8, sTop, 28, 330);
  if (t > C2.hey[0] && t < C2.hey[1]) bubble(LINES_STORY.hey, nx, nTop, 30, 380);
  if (t > C2.maths[0] && t < C2.maths[1]) bubble(LINES_STORY.notMaths, nx, nTop, 30, 380);
  if (t > C2.cooked[0] && t < C2.cooked[1]) bubble(LINES_STORY.cooked, sx + 8, sTop, 32, 330);
  ctx.restore();
  if (t > C2.cooked[1]) { ctx.fillStyle = `rgba(255,255,255,${stSeg(t, C2.cooked[1], CAFE2_DUR)})`; ctx.fillRect(0, 0, W, H); }     // white flash: cut to the fight
}

// ---------- scene 5: after the battle. Nailong, battered, walks away from THE DECK: "I hope I don't run into any more teachers like
// that one" (Max's line). Then the cafe door BANGS open behind him: Mr Shou, an armful of textbooks, "NAILONG!". Nailong jumps out of
// his skin, his legs spin up into a blur and he is gone in a puff of dust, Mr Shou after him. The chase carries on in sceneSlide.
// Authored in scene seconds (main.js plays clips at 70%); CAFE3_DUR is its length for main.js FLOW.
const CAFE3_DUR = 7.8, ST_CAFE3_T = CAFE3_DUR;
const C3 = {walk: 2.6, hope: [0.9, 4.6], bang: 4.9, jump: 5.15, spin: 5.85, zoom: 6.3, chase: 6.6};
const C3_SFX = [...[0.3, 0.65, 1.0, 1.35, 1.7, 2.05, 2.4].map(x => [x, 'tick', {p: 0.65, g: 0.3}]),
  [C3.bang, 'door', {p: 0.8, g: 1}], [C3.bang + 0.02, 'crash', {p: 0.9, g: 0.6}],                     // the cafe door bangs open
  [C3.jump, 'boing', {p: 1.6, g: 0.5}], [C3.jump + 0.05, 'pop', {p: 1.8, g: 0.4}],                     // Nailong jumps out of his skin
  [C3.spin, 'zip', {p: 0.7, g: 0.6}], ...[0, 1, 2, 3].map(i => [C3.spin + 0.1*i, 'tick', {p: 1.4 + i*0.15, g: 0.3}]),   // legs spin up
  [C3.zoom, 'whoosh', {p: 1.5, g: 1}], [C3.zoom + 0.02, 'swish', {p: 1.3}],                             // and he is gone
  ...[0, 1, 2, 3, 4].map(i => [C3.chase + 0.22*i, 'tick', {p: 0.5, g: 0.4}])];                         // Mr Shou's footsteps after him
function sceneCafe3(t){
  stCues('cafe3', t, C3_SFX);
  const gy = H*0.84, NS = 0.95;
  ctx.save(); stShake(t, [[C3.bang, 9]]);
  ctx.fillStyle = '#f2f0ea'; ctx.fillRect(0, 0, W, gy);                          // senior block corridor: white walls, timber-framed cubbies, grey carpet
  ctx.fillStyle = '#fafafa'; ctx.fillRect(0, 0, W, H*0.1);
  ctx.strokeStyle = 'rgba(74,47,12,.15)'; ctx.lineWidth = 2; for (let x = 0; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H*0.1); ctx.stroke(); }
  ctx.fillStyle = '#d8d3ca'; ctx.fillRect(0, gy - 36, W, 36);
  const cols = ['#f2c230', '#5cb85c'], bx0 = W*0.5, bw = W*0.4;
  ctx.fillStyle = '#b97a48'; ctx.strokeStyle = C.line; ctx.lineWidth = 5; rr(bx0, H*0.24, bw, H*0.42, 6); ctx.fill(); ctx.stroke();
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) { const cw = bw/5; ctx.fillStyle = cols[(r + c) % 2]; rr(bx0 + 8 + c*cw, H*0.24 + 8 + r*(H*0.42 - 16)/3, cw - 8, (H*0.42 - 16)/3 - 8, 4); ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); }
  // THE DECK's door on the left, where he has just come from. It bangs open.
  const dx = W*0.09, dw = 160, dh = 330, dTop = gy - dh, open = t > C3.bang ? fxBack(stSeg(t, C3.bang, C3.bang + 0.22)) : 0;
  ctx.fillStyle = '#e6e1d6'; ctx.fillRect(dx - 70, 0.1*H, dw + 140, gy - 0.1*H);
  ctx.fillStyle = '#5a3a24'; rr(dx, dTop, dw, dh, 6); ctx.fill();               // the warm dark cafe behind it
  ctx.fillStyle = 'rgba(255,214,150,.25)'; ell(dx + dw/2, dTop + 120, 60, 40); ctx.fill();
  // Mr Shou in the doorway: steps out, arm up with a book, then sets off after him
  let sxS = dx + dw*0.55, sw = 0, moving = false;
  if (t > C3.bang) {
    sxS = lerp(dx + dw*0.5, dx + dw + 30, ease(stSeg(t, C3.bang + 0.05, C3.bang + 0.45)));
    if (t > C3.chase) { const u = stSeg(t, C3.chase, CAFE3_DUR); sxS += u*u*W*1.1; sw = t*15; moving = true; }   // off the right edge just before the cut (he stopped mid-screen)
    const shout = t < 6.3, raise = fxBack(stSeg(t, C3.bang + 0.1, C3.bang + 0.35));
    const o = {books: 4, armR: moving ? 0.5 + Math.sin(t*15)*0.3 : 0.5 + 2.3*raise, mouth: shout ? 'o' : 'grin', eyes: 'dot', brow: shout ? 'up' : undefined, look: [1, -0.1],
      walk: sw, moving, rot: moving ? 0.08 : 0, hair: Math.sin(t*9)*0.5};
    ctx.save(); if (t < C3.bang + 0.45) { ctx.beginPath(); ctx.rect(dx, 0, W, H); ctx.clip(); }   // he comes out through the doorway
    stShadow(sxS, gy + 2, 70);
    const hands = stShou(sxS, gy - (moving ? Math.abs(Math.sin(t*15))*8 : 0), NS, o);
    if (!moving) stFlyBook(hands.handR[0], hands.handR[1] - 22, 46, 0.2, 1, 'r');
    ctx.restore();
  }
  // the door itself: closed, then flung open against the wall (seen edge-on, a thin slab on its hinge)
  const doorW = dw*(1 - 0.86*open);
  ctx.fillStyle = '#7b5230'; rr(dx, dTop, doorW, dh, 6); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.line; ctx.stroke();
  if (doorW > 60) { ctx.fillStyle = '#cfe9f7'; rr(dx + doorW*0.14, dTop + 26, doorW*0.72, 150, 6); ctx.fill(); ctx.lineWidth = 5; ctx.stroke(); ctx.fillStyle = '#d9d2c3'; ell(dx + doorW - 22, dTop + 210, 8, 8); ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); }
  ctx.lineWidth = 7; ctx.strokeStyle = C.line; ctx.strokeRect(dx, dTop, dw, dh);
  ctx.fillStyle = '#5a3a24'; rr(dx - 30, dTop - 64, dw + 60, 48, 8); ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
  title(LINES_STORY.cafeSign, dx + dw/2, dTop - 40, 28, '#ffe9b0');
  if (t > C3.bang && t < C3.bang + 0.3) stBurst(dx + dw + 6, dTop + 70, 30 + 50*stSeg(t, C3.bang, C3.bang + 0.3), t*3);
  ctx.fillStyle = '#5a5e69'; ctx.fillRect(0, gy, W, H - gy); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(0, gy, W, 5);
  // ---- Nailong, a bit battered, one page stuck to his foot ----
  const nx0 = W*0.55, walking = t < C3.walk;
  let nx = walking ? lerp(W*0.22, nx0, ease(stSeg(t, 0, C3.walk))) : nx0, ny = gy - 6;
  if (t < C3.spin) {
    const jump = stHop(t, C3.jump, C3.jump + 0.4, 70), scared = t > C3.jump;
    const o = {mouth: scared ? 'o' : 'smile', look: scared ? [-1, -0.2] : [0.5, 0], walk: walking ? t*9 : 0, arms: scared && t < C3.jump + 0.5 ? 'up' : 'down', flail: t*20};
    ny = gy - 6 - (walking ? Math.abs(Math.sin(t*9))*6 : 0) - jump;
    const q = scared ? Math.sin(Math.PI*stSeg(t, C3.jump, C3.jump + 0.15)) : 0;
    stShadow(nx, gy + 2, 70);
    nailong(nx, ny, NS, {...o, sx: 1 - 0.15*q, sy: 1 + 0.2*q});
    if (scared) stBrows(nx, ny, NS, 'sad', 1 - 0.15*q, 1 + 0.2*q);
    fxMark('bang', nx + 30, ny - 196*NS, stSeg(t, C3.jump, C3.jump + 0.8));
    fxMark('sweat', nx + 50*NS, ny - 186*NS, stSeg(t, C3.jump + 0.3, C3.spin));
    ctx.save(); ctx.translate(nx + 30*NS, ny - 4); ctx.rotate(-0.15 + Math.sin(t*9)*0.1*(walking ? 1 : 0)); rr(-4, -4, 38, 26, 2); ctx.fillStyle = '#f6efdc'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke();
    ctx.lineWidth = 1.5; for (const yy of [4, 9, 14]) { ctx.beginPath(); ctx.moveTo(2, yy); ctx.lineTo(28, yy); ctx.stroke(); } ctx.restore();
    ctx.save(); ctx.translate(nx - 8*NS, ny - 176*NS);                                  // plaster on his head
    ctx.rotate(-0.4); rr(-16, -7, 32, 14, 6); ctx.fillStyle = '#f2c9a0'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke(); ctx.restore();
    if (t > C3.hope[0] && t < C3.hope[1]) bubble(LINES_STORY.hope, nx, ny - 190*NS - 4, 32, 520);
  } else {
    // legs spin up into a blur on the spot (Road Runner), then he shoots off to the right and leaves his dust cloud behind
    const go = stSeg(t, C3.zoom, C3.zoom + 0.25);
    nx = nx0 + go*go*W*0.8;
    if (t > C3.zoom) { const k = stSeg(t, C3.zoom, C3.zoom + 0.9); ctx.fillStyle = `rgba(235,225,205,${1 - k})`; for (const [ox, oy, r] of [[-30, -20, 46], [20, -40, 38], [50, -14, 34], [-60, -46, 30]]) { ell(nx0 + ox, gy + oy - k*20, r*(1 + k*0.4), r*0.8*(1 + k*0.4)); ctx.fill(); } }
    if (nx < W + 160) { stRunTrail(nx, gy, NS*0.9, t, 1, t > C3.zoom ? 1 : 0.5); stRun(nx, gy, NS*0.9, t, {lean: t < C3.zoom ? -0.3 : 0.1, mouth: 'open', look: t < C3.zoom ? [-1, -0.2] : [1, -0.1]}); }
  }
  if (t > C3.bang + 0.1 && t < 6.3) { const k = stSeg(t, C3.bang + 0.1, C3.bang + 0.3); ctx.save(); ctx.translate(dx + dw + 210, dTop - 30); ctx.rotate(-0.12 + Math.sin(t*40)*0.02); ctx.scale(fxBack(k), fxBack(k)); title(LINES_STORY.shout, 0, 0, Math.min(72, W/15), '#fff'); ctx.restore(); }   // NAILONG!
  ctx.restore();
  fxIris(1 - stSeg(t, 0, 0.3), W*0.3, gy - 130*NS);                                  // the iris opens where he walks out
}

// ---------- end card: neutral. The finale and the end menu are other agents' pieces; main.js decides whether this is used at all ----------
function sceneEnd(t){
  ctx.fillStyle = C.navy; ctx.fillRect(0, 0, W, H);
  const b = Math.abs(Math.sin(t*4))*10;
  nailong(W/2, H*0.66 - b, 0.9, {arms: 'up', flail: t*8, mouth: 'open', look: [0, -0.3]});
  title(LINES_STORY.endTitle, W/2, H*0.16, Math.min(70, W/12));
  font(Math.min(26, W/30), 500); ctx.fillStyle = '#cfc8ff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(LINES_STORY.endSub, W/2, H*0.26);
}
