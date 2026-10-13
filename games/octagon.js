// ---------- the 360 octagon, inside the red tube slide, with Mr Shou chasing and throwing Methods textbooks ----------
// Modelled on "Octagon - A Minimal Arcade Game with Maximum Challenge" (Lukas Korba), checked frame by frame against
// gameplay footage on 12 Oct (research/octagon.md): you roll along ONE clear path of panels inside an 8-sided tunnel
// on a white void. Left / right turns the tunnel one face so you stay at the bottom. A flip jumps you to the panel
// directly above: you rise to the middle while the world turns 180 degrees, and land at the bottom again (~0.4 s).
// The path moves: it steps to a neighbouring face, or the floor ends and it carries on along the ceiling, and the next
// move is always in view well before it comes. Progress is a percentage top left, the level is the same track on every
// try, and it ends in a whole tunnel with a white ring.
// Our story (Max, 12 Oct 21:29): Mr Shou chases Nailong down the red slide. He looms in the white beside the tube with an
// armful of Methods textbooks and hurls them: each one shows a dark target on a panel first, then spins in and SLAMS
// through it, leaving a book-shaped hole with torn edges. Books lying flat on the path are the bonks. In the last stretch
// he is right behind Nailong. The level is one hand-written track of named patterns (research/octagon.md).
const LINES_OCTAGON = {
  title: 'THE 360',                         // the game's name (main.js and the end menu show it)
  hint: 'laptop: ← → turn    ↑ or space flip    (or click the left / right side, the top to flip) / touch: tap left / right, tap the top to flip',
  say: 'Oh. The tunnel spins.',             // Nailong's bubble while the instruction card is up
  turn: 'turn',                             // under the ← → keys on the instruction card
  flip: 'flip',                             // under the ↑ key, on the card and beside the first flip
  red: 'stay on the red',
  books: 'dodge the books: a bonk slows you down',   // every book can be stepped round (Max, 13 Oct); a bonk costs time, never a fall or a life
  start: 'press any key to start',
  again: 'Again.',                          // short beat after a fall
  fails: ['Nailong fell. Again.', 'Whoops. Again.', 'Wheee. No. Again.', 'Almost. Again.', 'Gravity, rude. Again.'],
  bonk: 'BONK!',                            // when he runs into a textbook lying on the path
  win: '100%!',
  winBubble: 'I did it!',
  shout: 'NAILONG!',                        // Mr Shou as he throws (from Max's "Nailong! You're cooked!")
  cooked: "Nailong! You're cooked!",        // Max's line (sceneCafe2): Mr Shou shouts it again as the last sprint starts
};
const OG = {deaths: 0};
const OG_LEN = 0.9;                // row length in depth units
const OG_PZ = 2.5*OG_LEN;          // the player starts in the middle of row 2
const OG_FLIP = 0.38;              // seconds in the air for a flip (the real one is 5 to 6 frames at 15 fps)
const OG_CARD = 6.0;               // the instruction card stays until a key or a click, or this many seconds
const OG_M = 1;                    // metres per depth unit
const OG_SHOW = 9.5, OG_HIT = 4.4; // a thrown book's target shows when its row is this deep ahead, and it lands at this depth
const OG_FALL = 1.5;               // seconds on a fall before the retry (any key after 0.3 s goes sooner): long enough to read the fail line
const ogM8 = k => ((k % 8) + 8) % 8;
const ogRnd = i => { const x = Math.sin(i*91.7 + 47.3)*43758.5453; return x - Math.floor(x); };

// ---------- the one level ----------
// Built row by row (a row is OG_LEN deep and has 8 faces, each solid or not). p is the face the intended path is on; every
// move of it is kept, with the rows it can be made in, for the bot. Panel kinds: 0 red, 2 Year 11 book, 3 Year 12 book, 4 chevron.
//   R n        whole tube for n rows                 G n w k   n rows of path, w = extra faces either side (e.g. [-1,0,1])
//   T d n      the path steps a face (d = 1 is the ← key, -1 the → key, 4 a flip to the ceiling), both there for n rows
//   mv d a b   the path moves inside a wide stretch, between rows a and b      S v   speed (units a second) from here on
//   B          a textbook lies flat on the path in the next row (bonk)       X r f  Mr Shou punches the cell (row r, face f)
//   MISS       a book thrown that sails past into the distance              SIDE s Mr Shou on the right (1), left (-1), behind (0)
// The patterns, in order (each announced by nothing but its look): warm-up; Mr Shou arrives and punches a chute; the barrel roll;
// the flip ladder; the mirror; book rain; the speed ramp; the last sprint with him right behind.
function ogTrack(){
  const rows = [], moves = [], bonks = [], throws = [], spd = [], sides = [], shouts = [];
  let p = 0;
  const n = () => rows.length;
  const put = (faces, kind = 0) => { const s = Array(8).fill(false), k = Array(8).fill(0);
    for (const f of faces) { const m = ogM8(f); s[m] = true; k[m] = typeof kind === 'function' ? kind(f) : kind; }
    rows.push({s, k, torn: Array(8).fill(false)}); };
  const rowsOf = (c, faces, kind) => { for (let i = 0; i < c; i++) put(faces, kind); };
  const R = c => rowsOf(c, [0, 1, 2, 3, 4, 5, 6, 7]);
  const G = (c, w = [0], kind = 0) => rowsOf(c, w.map(o => p + o), kind);
  const T = (d, c, w = [0], kind = 0) => { const a = n(); rowsOf(c, [...w.map(o => p + o), ...w.map(o => p + d + o)], kind); moves.push({a, b: n(), d, flip: d === 4, to: ogM8(p + d)}); p += d; };
  const F = c => T(4, c);
  const mv = (d, a, b, teach) => { moves.push({a, b, d, flip: false, to: ogM8(p + d), teach: !!teach}); p += d; };
  const S = (v, snap) => spd.push({row: n(), v, snap: !!snap});
  const BK = (row, face, w = 'y') => bonks.push({row, face: ogM8(face), hit: -1, w});   // a textbook lying on face `face` of a row
  const X = (row, face, o = {}) => throws.push({row, face: ogM8(face), len: o.len || 1, show: o.show || OG_SHOW, hit: o.hit || OG_HIT, w: o.w || (throws.length % 2 ? 'r' : 'y')});
  const MISS = () => throws.push({row: n() + 6, face: null, len: 1, show: OG_SHOW, hit: OG_HIT, w: throws.length % 2 ? 'r' : 'y', ang: -Math.PI/2 + (ogRnd(n()) - 0.5)*1.6});
  const SIDE = side => sides.push({row: n(), side});
  const SAY = (text, big) => shouts.push({row: n(), text, big: !!big});

  // 1. warm-up, no Mr Shou yet: whole tube, a chute, three slow turns, the first flip, a book left lying on the path
  S(3.2); R(6); G(2, [-1, 0, 1]); G(3);
  T(1, 3); G(4); T(-1, 3); G(4); T(-1, 3); G(3);
  F(5); G(3);
  //    the first book (Max, 13 Oct: "all the textbooks have to be dodgeable"): it lies on the path just before the path steps left,
  //    so she steps round it and keeps going; a key beside Nailong shows how
  { const c = p, a = n(); rowsOf(5, [c, c + 1]); BK(a + 3, c); mv(1, a, a + 3, true); }
  G(4);
  // 2. Mr Shou bursts in on the right: two books punch the sides of a three-wide chute, then he aims at the middle (step right),
  //    then at the right (step back)
  S(3.5); SIDE(1); SAY(LINES_OCTAGON.shout); G(5);
  { const c = p, a = n(); rowsOf(18, [c - 1, c, c + 1]);
    X(a + 4, c + 1); X(a + 7, c - 1);
    X(a + 11, c, {len: 2}); X(a + 11, c + 1, {len: 2}); mv(-1, a + 8, a + 11);
    X(a + 15, c - 1, {len: 2}); mv(1, a + 13, a + 15); }
  //    then a slalom: a book in the middle, then two side by side, so she weaves out, over, and back to the middle
  G(3);
  { const c = p, a = n(); rowsOf(10, [c - 1, c, c + 1]); BK(a + 3, c, 'r'); BK(a + 7, c - 1); BK(a + 7, c, 'r');
    mv(1, a, a + 3); mv(-1, a + 8, a + 10); }
  G(2); SIDE(-1); G(3);
  // 3. the barrel roll: the path corkscrews all the way round to the left, a face every three rows
  S(3.8); MISS();
  for (let i = 0; i < 8; i++) { T(1, 2); G(1); if (i === 4) MISS(); }
  G(3);
  // 4. (the textbook stepping stones, a zigzag paved with Methods books, are cut: Max, 13 Oct, "cut that section where mr shou makes
  //    a bridge out of the books". The book panels, kinds 2 and 3, are still drawn by ogPanel if a pattern ever uses them.)
  //    a book at each end of a step left: too early hits the first, too late hits the second, so she steps just between them
  S(3.9); G(3);
  { const c = p, a = n(); rowsOf(5, [c, c + 1]); BK(a, c + 1, 'r'); BK(a + 3, c); mv(1, a + 1, a + 3); }
  G(3); SIDE(1); G(2);
  // 5. the flip ladder: floor, ceiling, floor, ceiling, quicker each time
  S(4.1); MISS();
  F(3); G(2); F(3); G(2); MISS(); F(3); G(1); F(3); G(3);
  // 6. the mirror: the path splits both ways round the tube and meets again on the ceiling. He has already aimed at the left branch.
  S(4.2); G(2);
  { const c = p, a = n();
    rowsOf(2, [c - 1, c, c + 1]); rowsOf(1, [c - 1, c + 1]); rowsOf(2, [c - 2, c - 1, c + 1, c + 2]); rowsOf(1, [c - 2, c + 2]);
    rowsOf(2, [c - 3, c - 2, c + 2, c + 3]); rowsOf(1, [c - 3, c + 3]); rowsOf(2, [c - 3, c + 3, c + 4]);
    X(a + 5, c + 2, {show: 15, w: 'r'});
    mv(-1, a, a + 2); mv(-1, a + 3, a + 5); mv(-1, a + 6, a + 8); mv(-1, a + 9, a + 11); }
  G(5);
  // 7. book rain: whole tube (he punches the ceiling), a five-wide chute he punches into a weave, then three-wide, then one
  S(4.4);
  { const c = p, a = n(); R(3); X(a + 1, c + 4); X(a + 2, c + 3); X(a + 2, c + 5, {len: 1});
    const b = n(); rowsOf(10, [c - 2, c - 1, c, c + 1, c + 2]);
    X(b + 2, c, {len: 2}); X(b + 2, c + 1, {len: 2}); mv(-1, a + 1, b + 2);
    X(b + 4, c + 2, {len: 2});
    X(b + 6, c - 1, {len: 2}); X(b + 6, c - 2, {len: 2}); mv(1, b + 4, b + 6);
    const d = n(); rowsOf(6, [c - 1, c, c + 1]);
    X(d + 2, c, {len: 2}); X(d + 2, c - 1, {len: 2}); mv(1, d, d + 2); }
  //    then a wall of two books, then two more either side of the middle: out to the right, then thread back between them
  G(3);
  { const c = p, a = n(); rowsOf(10, [c - 1, c, c + 1]); BK(a + 3, c); BK(a + 3, c + 1, 'r'); BK(a + 7, c - 1, 'r'); BK(a + 7, c + 1);
    mv(-1, a, a + 3); mv(1, a + 4, a + 7); }
  G(3);
  // 8. the speed ramp: yellow chevrons (and Mr Shou catches up), then quick stairs at the new speed
  S(5.1, true); SIDE(0); SAY(LINES_OCTAGON.cooked, true); G(4, [0], 4);
  T(1, 2); G(1); T(1, 2); G(1); T(-1, 2); G(1); T(-1, 2); G(2);
  // 9. the last sprint: Mr Shou right behind, books flying over Nailong's head into the walls
  S(5.4);
  { const a = n(), c = p; R(4); X(a + 2, c + 2, {len: 2}); X(a + 3, c - 3); X(a + 3, c + 4, {len: 1}); }
  G(2); F(3); G(2); SAY(LINES_OCTAGON.shout, true);
  for (let i = 0; i < 4; i++) { T(-1, 3); G(i === 3 ? 2 : 1); }
  { const c = p, a = n(); rowsOf(7, [c - 1, c, c + 1]); X(a + 4, c, {len: 2}); X(a + 4, c + 1, {len: 2}); mv(-1, a + 1, a + 4); }
  G(2); F(3); G(2); SAY(LINES_OCTAGON.shout, true); T(1, 3); G(1); T(1, 3); G(4); R(10);
  return {rows, moves, bonks, throws, spd, sides, shouts, finPos: (rows.length - 6)*OG_LEN};
}
function ogReset(again = false){
  const deaths = OG.deaths + (again ? 1 : 0), tr = ogTrack();
  Object.assign(OG, {rows: tr.rows, moves: tr.moves, bonks: tr.bonks, throws: tr.throws.map((th, i) => ({...th, i, done: false, rel: false})),
    spd: tr.spd, sides: tr.sides, shouts: tr.shouts, finPos: tr.finPos, v: tr.spd[0].v,
    fc: 0, ang: 0, run: 0, dist: 0, intro: OG.replay ? 0 : again ? 0.6 : OG_CARD, introT: 0, dead: -1, died: false, again,   // a replay from the menu skips the card and the 'Again.'
    flip: -1, flipA0: 0, flipA1: 0, flipDir: 1, buf: 0, land: 0, lastTurn: 1, bonkT: -1, bonkSide: 1, bonkW: 'y',
    fin: -1, sent: false, botI: 0, lean: 0, leanT: 0, shake: 0, stop: 0, fx: [], fall: [], ramp: -1, rampSeen: false, cue: false,
    deaths, lastM: OG.lastM || 0, bestM: OG.bestM || 0, clk: OG.clk || 0, failLine: LINES_OCTAGON.fails[deaths % LINES_OCTAGON.fails.length]});
}
const ogMul = () => OG.bonkT >= 0 ? 0.35 + 0.65*clamp((OG.bonkT - 0.15)/0.85, 0, 1) : 1;   // a bonk drops him to a third of the speed for a moment
const ogVe = () => OG.v*ogMul();
const ogTime = s => typeof menuFmt === 'function' ? menuFmt(s) : s.toFixed(1) + 's';   // the same "41.2s" / "1:04.3" the end menu shows
const ogMetres = () => Math.round(clamp(OG.dist, 0, OG.finPos - OG_PZ)*OG_M);
const ogPP = () => OG.dist + OG_PZ;
// is there tube under the player at track position pp on face f? A tenth of a unit of grace either side of a row edge.
function ogSolid(pp, f){
  const x = pp/OG_LEN, i = Math.floor(x), fr = x - i, R = OG.rows;
  if (!R[i] || R[i].s[f]) return true;
  return !!((fr < 0.11 && R[i - 1] && R[i - 1].s[f]) || (fr > 0.89 && R[i + 1] && R[i + 1].s[f]));
}
// a thrown book's progress: 0 when its target first shows, 0.45 when it leaves his hand, 1 when it lands (by distance, so a bonk
// or a different speed never makes it unfair)
const ogK = (th, pp) => (th.show - (th.row*OG_LEN - pp + 1))/(th.show - th.hit);

// ---------- the Methods covers: the real cover art (the same two files battle.js uses), its pale colours deepened so a book reads on white at speed ----------
const OG_TEX = {}, OG_COL = {r: '#e8463c', y: '#f7c51e'}, OG_BACK = {r: '#b3322c', y: '#caa923'}, OG_IMG = {};
try { for (const [k, f] of [['r', 'methods-yr11.png'], ['y', 'methods-yr12.png']]) { const im = new Image(); im.src = 'assets/textbooks/' + f; OG_IMG[k] = im; } } catch (e) {}
function ogTex(w){
  if (OG_TEX[w]) return OG_TEX[w];
  const im = OG_IMG[w];
  if (!im || !im.complete || !im.naturalWidth) return null;
  try {
    const c = document.createElement('canvas'); c.width = 207; c.height = 292; const g = c.getContext('2d');
    g.drawImage(im, 0, 0, 207, 292);
    g.globalCompositeOperation = 'multiply'; g.fillStyle = w === 'r' ? '#f2584e' : '#ffd52a'; g.fillRect(0, 0, 207, 292);
    g.globalCompositeOperation = 'source-over';
    g.lineJoin = 'round'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillStyle = w === 'r' ? 'rgba(196,40,40,.9)' : 'rgba(214,160,0,.9)'; g.fillRect(0, 90, 207, 112);   // a band over the faded original title
    g.font = '700 27px Fredoka, "Trebuchet MS", sans-serif'; g.lineWidth = 6; g.strokeStyle = '#4A2F0C'; g.fillStyle = '#fff';
    for (const [txt, y] of [['Mathematical', 112], ['Methods', 144]]) { g.strokeText(txt, 12, y); g.fillText(txt, 12, y); }
    g.font = '700 21px Fredoka, "Trebuchet MS", sans-serif'; g.lineWidth = 5;
    const yr = w === 'r' ? 'Year 11' : 'Year 12'; g.strokeText(yr, 12, 180); g.fillText(yr, 12, 180);
    g.lineWidth = 12; g.strokeStyle = '#4A2F0C'; g.strokeRect(6, 6, 195, 280);
    OG_TEX[w] = c;
  } catch (e) { return null; }
  return OG_TEX[w];
}

// ---------- the world ----------
const OG_VOID = [255, 246, 243], OG_RED = [224, 48, 58], OG_RED2 = [238, 74, 82];
const ogMix = (a, b, t) => `rgb(${Math.round(a[0] + (b[0] - a[0])*t)},${Math.round(a[1] + (b[1] - a[1])*t)},${Math.round(a[2] + (b[2] - a[2])*t)})`;
const ogHex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
function ogStreaks(t, ang, cx, cy){
  // soft swirling streaks and blurry dots on the white void, like the real game, in the slide's pinks and peaches
  ctx.save(); ctx.translate(cx, cy); ctx.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    const a0 = i*Math.PI/8 + ang*0.5 + t*0.05;
    ctx.strokeStyle = `hsla(${(338 + (i*23) % 70) % 360},75%,85%,.5)`; ctx.lineWidth = 6 + (i%3)*5;
    ctx.beginPath();
    for (let j = 0; j <= 10; j++) { const rr_ = 40 + j*j*10, a = a0 + j*0.09; j ? ctx.lineTo(Math.cos(a)*rr_, Math.sin(a)*rr_) : ctx.moveTo(Math.cos(a)*rr_, Math.sin(a)*rr_); }
    ctx.stroke();
  }
  for (let i = 0; i < 7; i++) { const a = i*2.4 + t*0.03, r = 160 + (i*97) % 380, s = 22 + (i%3)*10; ell(Math.cos(a)*r, Math.sin(a)*r*0.7, s, s); ctx.fillStyle = `hsla(${350 + (i*13) % 40},80%,88%,.45)`; ctx.fill(); }
  ctx.restore(); ctx.lineCap = 'butt';
}
// geometry for one frame: V(j, z) a tunnel vertex, P(k, u, z, h) a point on face k (u 0..1 across it, from vertex k to k+1),
// raised h (a fraction of the radius) towards the tunnel's middle
function ogGeo(ang, pp, R){
  const cx = W/2, cy = H*0.42;
  const V = (j, z) => { const a = Math.PI/2 + (j - 0.5)*Math.PI/4 + ang, r = R/z; return [cx + Math.cos(a)*r, cy + Math.sin(a)*r]; };
  const P = (k, u, z, h = 0) => { const a = V(k, z), b = V(k + 1, z), x = a[0] + (b[0] - a[0])*u, y = a[1] + (b[1] - a[1])*u; return [cx + (x - cx)*(1 - h), cy + (y - cy)*(1 - h)]; };
  return {cx, cy, R, ang, pp, V, P, zOf: i => i*OG_LEN - pp + 1};
}
const ogQuad = pts => { ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); };
// an image laid flat on face k: its top at the far depth zf, bottom at the near depth zn, its left edge at u1 and right at u0.
// Drawn in depth strips, each an affine piece, which is close enough to the real perspective at this size.
function ogMap(g, img, k, u0, u1, zf, zn, h = 0, n = 6){
  const iw = img.width, ih = img.height;
  for (let j = 0; j < n; j++) {
    const a = j/n, b = (j + 1)/n, za = zf + (zn - zf)*a, zb = zf + (zn - zf)*b;
    const TL = g.P(k, u1, za, h), TR = g.P(k, u0, za, h), BL = g.P(k, u1, zb, h);
    ctx.save(); ctx.transform(TR[0] - TL[0], TR[1] - TL[1], BL[0] - TL[0], BL[1] - TL[1], TL[0], TL[1]);
    ctx.drawImage(img, 0, ih*a, iw, ih*(b - a), 0, 0, 1, j < n - 1 ? 1.04 : 1);
    ctx.restore();
  }
}
// one panel of face k from depth z0 to z1, by kind: red fibreglass with a gloss stripe, a textbook, or red with yellow chevrons
function ogPanel(g, k, z0, z1, fog, kind, seed){
  const cell = () => ogQuad([g.V(k, z0), g.V(k + 1, z0), g.V(k + 1, z1), g.V(k, z1)]);
  const lw = clamp(5.5/z0, 0.7, 4.5);
  if (kind === 2 || kind === 3) {   // a textbook lying flat, cover up: the floor of the stepping stones
    const w = kind === 2 ? 'r' : 'y', tex = ogTex(w);
    cell(); ctx.fillStyle = ogMix([74, 47, 12], OG_VOID, fog*0.93); ctx.fill();
    const m = (z1 - z0)*0.05;
    if (tex && fog < 0.97) ogMap(g, tex, k, 0.06, 0.94, z1 - m, z0 + m, 0, z0 < 3 ? 6 : 3);
    else { ogQuad([g.P(k, 0.06, z0 + m), g.P(k, 0.94, z0 + m), g.P(k, 0.94, z1 - m), g.P(k, 0.06, z1 - m)]); ctx.fillStyle = OG_COL[w]; ctx.fill(); }
    if (fog > 0.02) { cell(); ctx.fillStyle = `rgba(255,246,243,${fog*0.93})`; ctx.fill(); }
    cell(); ctx.strokeStyle = `rgba(74,47,12,${0.92*(1 - fog)})`; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke();
    return;
  }
  cell(); ctx.fillStyle = ogMix(k % 2 ? OG_RED2 : OG_RED, OG_VOID, fog*0.93); ctx.fill();
  if (fog < 0.85 && z1 - z0 > OG_LEN*0.6) {   // a glossy stripe down the panel, like the shine on the real slide
    ogQuad([g.P(k, 0.62, z0), g.P(k, 0.76, z0), g.P(k, 0.76, z1), g.P(k, 0.62, z1)]);
    ctx.fillStyle = `rgba(255,255,255,${0.22*(1 - fog)})`; ctx.fill();
  }
  if (kind === 4 && fog < 0.9) {   // speed chevrons pointing on down the tube
    const fl = ogMix(ogHex('#ffd21f'), OG_VOID, fog);
    for (const v0 of [0.12, 0.55]) {
      const zz = v => z0 + (z1 - z0)*v, pts = [[0.18, v0], [0.5, v0 + 0.3], [0.82, v0], [0.82, v0 + 0.14], [0.5, v0 + 0.44], [0.18, v0 + 0.14]];
      ogQuad(pts.map(([u, v]) => g.P(k, u, zz(v)))); ctx.fillStyle = fl; ctx.fill(); ctx.lineWidth = lw*0.8; ctx.strokeStyle = `rgba(74,47,12,${0.9*(1 - fog)})`; ctx.stroke();
    }
  }
  cell(); ctx.strokeStyle = `rgba(74,47,12,${0.92*(1 - fog)})`; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke();
}
// a hole a book punched: the cell is gone, and its edges are torn, with the pale cut fibreglass showing where a panel goes on
function ogTorn(g, r, k, len, z0, z1, seed){
  const z0n = Math.max(z0, 0.62), corners = [g.V(k, z0n), g.V(k + 1, z0n), g.V(k + 1, z1), g.V(k, z1)];
  const mx = corners.reduce((s, q) => s + q[0], 0)/4, my = corners.reduce((s, q) => s + q[1], 0)/4, Rw = OG.rows || [];
  const solidAt = (i, f) => !!(Rw[i] && Rw[i].s[ogM8(f)]);
  const anyF = f => { for (let i = r; i < r + len; i++) if (solidAt(i, f)) return true; return false; };
  const nb = [z0 >= 0.62 && solidAt(r - 1, k), anyF(k + 1), solidAt(r + len, k), anyF(k - 1)];   // near, left side, far, right side
  const edges = [];
  for (let e = 0; e < 4; e++) {
    const A = corners[e], Bq = corners[(e + 1) % 4], L = Math.hypot(Bq[0] - A[0], Bq[1] - A[1]), m = 6, pts = [];
    for (let i = 0; i < m; i++) {
      const u = i/m, x = A[0] + (Bq[0] - A[0])*u, y = A[1] + (Bq[1] - A[1])*u, dx = x - mx, dy = y - my, dl = Math.hypot(dx, dy) || 1;
      const amp = i === 0 ? 0 : L*0.07*(0.4 + ogRnd(seed*17 + e*7 + i))*(i % 2 ? 1 : -0.35);
      pts.push([x + dx/dl*amp, y + dy/dl*amp]);
    }
    edges.push(pts);
  }
  const all = edges.flat();
  ogQuad(all); ctx.fillStyle = 'rgb(255,246,243)'; ctx.fill();
  const lw = clamp(5.5/z0n, 0.7, 4.5);
  ctx.lineJoin = 'round';
  for (let e = 0; e < 4; e++) if (nb[e]) {
    const pts = [...edges[e], edges[(e + 1) % 4][0]];
    for (const [st, w] of [['#ffd2c9', lw*3], [C.line, lw]]) { ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.strokeStyle = st; ctx.lineWidth = w; ctx.stroke(); }
  }
}
// a target where a book is about to land: the cells darken (its shadow) under a marching yellow dashed edge
function ogTarget(g, th, k, t){
  const z0 = Math.max(g.zOf(th.row), 0.62), z1 = g.zOf(th.row + th.len);
  if (z1 <= 0.66) return;
  const fog = clamp((z1 - 2.5)/16, 0, 1), lw = clamp(5.5/z0, 0.7, 4.5), q = clamp(k, 0, 1);
  ogQuad([g.V(th.face, z0), g.V(th.face + 1, z0), g.V(th.face + 1, z1), g.V(th.face, z1)]);
  ctx.fillStyle = `rgba(60,8,16,${(0.16 + 0.42*q)*(1 - fog*0.7)})`; ctx.fill();
  ctx.setLineDash([lw*4, lw*3]); ctx.lineDashOffset = -t*60; ctx.lineWidth = lw*(1.4 + 0.8*q); ctx.strokeStyle = `rgba(255,225,77,${(0.7 + 0.3*Math.sin(t*14))*(1 - fog*0.6)})`; ctx.stroke();
  ctx.setLineDash([]); ctx.lineDashOffset = 0;
}
// a textbook lying flat on the path, raised so its page edge shows: run into it and BONK
function ogFlatBook(g, b){
  const zr = g.zOf(b.row), zn = zr + OG_LEN*0.16, zf = zr + OG_LEN*0.84;
  if (zn < 0.75 || zn > 18) return;
  const fog = clamp((zf - 2.5)/16, 0, 1), h = 0.085, u0 = 0.22, u1 = 0.78, k = b.face, tex = ogTex(b.w);
  ctx.save(); ctx.globalAlpha = 1 - fog*0.85; ctx.lineJoin = 'round';
  const lw = clamp(5.5/zn, 0.7, 4.5);
  ogQuad([g.P(k, u0 - 0.04, zn - 0.03), g.P(k, u1 + 0.04, zn - 0.03), g.P(k, u1 + 0.04, zf), g.P(k, u0 - 0.04, zf)]); ctx.fillStyle = 'rgba(74,47,12,.3)'; ctx.fill();   // its shadow
  ogQuad([g.P(k, u0, zn), g.P(k, u1, zn), g.P(k, u1, zn, h), g.P(k, u0, zn, h)]); ctx.fillStyle = '#f6efdc'; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = lw; ctx.stroke();   // the page edge
  ctx.strokeStyle = 'rgba(74,47,12,.45)'; ctx.lineWidth = lw*0.4;
  for (const hh of [0.3, 0.55, 0.8]) { const a = g.P(k, u0, zn, h*hh), c = g.P(k, u1, zn, h*hh); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke(); }
  if (tex) ogMap(g, tex, k, u0, u1, zf, zn, h, zn < 3 ? 5 : 3);
  else { ogQuad([g.P(k, u0, zn, h), g.P(k, u1, zn, h), g.P(k, u1, zf, h), g.P(k, u0, zf, h)]); ctx.fillStyle = OG_COL[b.w]; ctx.fill(); }
  ogQuad([g.P(k, u0, zn, h), g.P(k, u1, zn, h), g.P(k, u1, zf, h), g.P(k, u0, zf, h)]); ctx.strokeStyle = C.line; ctx.lineWidth = lw; ctx.stroke();
  ctx.restore();
}
// a book in the air (sprite): cover or back as it tumbles, with a page edge for thickness
function ogBook(x, y, w, rot, flip, which, alpha = 1){
  const h = w*1.41, tex = ogTex(which);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= alpha; ctx.lineJoin = 'round';
  const lw = clamp(w*0.05, 2, 6), fx = Math.max(0.08, Math.abs(flip));
  rr(-w*fx/2 + w*0.07, -h/2 + w*0.07, w*fx, h, 4); ctx.fillStyle = '#f6efdc'; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = C.line; ctx.stroke();   // page block behind
  ctx.scale(fx, 1);
  if (flip >= 0 && tex) ctx.drawImage(tex, -w/2, -h/2, w, h);
  else {   // the back cover: darker, with the spine down one side
    ctx.fillStyle = flip >= 0 ? OG_COL[which] : OG_BACK[which]; ctx.fillRect(-w/2, -h/2, w, h);
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(-w*0.32, -h*0.4, w*0.72, h*0.8);
    ctx.fillStyle = 'rgba(74,47,12,.35)'; ctx.fillRect(-w/2, -h/2, w*0.12, h);
  }
  ctx.lineWidth = lw/fx; ctx.strokeStyle = C.line; ctx.strokeRect(-w/2, -h/2, w, h);
  ctx.restore();
}
// a loose page, fluttering
function ogPage(x, y, w, rot, flip, alpha = 1){
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(Math.max(0.1, Math.abs(flip)), 1); ctx.globalAlpha *= alpha;
  const h = w*1.3; rr(-w/2, -h/2, w, h, 3); ctx.fillStyle = '#fffaf0'; ctx.fill(); ctx.lineWidth = clamp(w*0.06, 1.5, 4); ctx.strokeStyle = C.line; ctx.stroke();
  ctx.strokeStyle = 'rgba(90,130,200,.6)'; ctx.lineWidth = clamp(w*0.03, 0.8, 2);
  for (let i = 1; i < 5; i++) { const yy = -h/2 + h*i/5; ctx.beginPath(); ctx.moveTo(-w*0.36, yy); ctx.lineTo(w*0.36, yy); ctx.stroke(); }
  ctx.restore();
}

// ---------- Mr Shou ----------
// Where he is for a track position: on the right or left of the void (side 1 / -1), or right behind Nailong (0), sliding out
// and back in when he changes side. Returns null before he arrives.
function ogShouAt(S){
  const sd = S.sides || [], pp = S.pp; let i = -1;
  for (let j = 0; j < sd.length; j++) if (pp >= sd[j].row*OG_LEN - 1.2) i = j;
  if (i < 0) return null;
  const d = pp - sd[i].row*OG_LEN;
  let side = sd[i].side, off = 0;
  if (d < 0) { if (i === 0) off = clamp(-d/1.2, 0, 1); else { side = sd[i - 1].side; off = 1 - clamp(-d/1.2, 0, 1); } }   // the old side slides out
  else off = 1 - ease(clamp(d/1.2, 0, 1));                                                                                  // the new side slides in
  if (S.fin > 0) off = Math.max(off, clamp(S.fin/0.5, 0, 1));
  // beside the tube he stands at the very edge of the screen, drawn over everything there (nothing on the path is ever that far out
  // until it is behind Nailong); right behind, his face and his throwing arm come up out of the bottom left corner
  const behind = side === 0, s = behind ? H*0.0034 : H*0.0024;
  let x = behind ? W*0.1 : side > 0 ? W*0.93 : W*0.07, y = behind ? H + 110*s : H + 30*s;
  if (behind) y += off*H*0.8; else x += side*off*W*0.3;
  return {side, behind, s, x, y, mir: side <= 0, off};
}
// the arm of the throw happening now: wind-up 0..0.4 (arm back over his head), throw 0.4..0.5 (book leaves at 0.45), follow-through
const ogArm = k => k < 0 ? 0.35 : k < 0.4 ? lerp(0.35, 3.4, ease(k/0.4)) : k < 0.5 ? lerp(3.4, 1.25, (k - 0.4)/0.1) : k < 0.8 ? lerp(1.25, 0.35, ease((k - 0.5)/0.3)) : 0.35;
// his throwing hand on screen for an arm angle (shou(): left arm from the shoulder at (-38, -166), 76 long)
function ogHand(sh, a){
  const lx = -38 - Math.sin(a)*76, ly = -166 + Math.cos(a)*76;
  return [sh.x + (sh.mir ? -lx : lx)*sh.s, sh.y + ly*sh.s];
}
// the throw that drives his arm: the newest one winding up or throwing, else one following through
function ogThrowNow(S){
  let best = null, bk = -1;
  for (const th of S.throws || []) { const k = ogK(th, S.pp); if (k >= 0 && k < 0.5 && (!best || bk >= 0.5 || th.row > best.row)) { best = th; bk = k; } }
  if (!best) for (const th of S.throws || []) { const k = ogK(th, S.pp); if (k >= 0.5 && k < 0.85) { best = th; bk = k; } }
  return best ? {th: best, k: bk} : null;
}
function ogShou(t, S, sh){
  if (!sh || typeof shou !== 'function') return;
  const cur = ogThrowNow(S), k = cur ? cur.k : -1, a = ogArm(k) + (k < 0 ? Math.sin(t*2.4)*0.12 : 0);
  const shouting = (k > 0.25 && k < 0.6) || (!S.replay && (S.shouts || []).some(sy => { const age = (S.pp - sy.row*OG_LEN)/Math.max(1, S.v); return age >= 0 && age < 1.1; }));
  const o = {mouth: shouting ? 'o' : 'grin', eyes: 'dot', look: [-1, 0.3], armL: a, armR: 0.18 + Math.sin(t*2.4 + 1)*0.05, stack: true,
    hair: Math.sin(t*5)*0.4, rot: (k > 0.38 && k < 0.6 ? -0.1 : 0.03*Math.sin(t*2.4)) + (sh.behind ? 0.18 : 0), brow: shouting ? 'up' : undefined};
  ctx.save();
  if (sh.mir) { ctx.translate(sh.x, 0); ctx.scale(-1, 1); ctx.translate(-sh.x, 0); }
  shou(sh.x, sh.y, sh.s, o);
  if (cur && k >= 0 && k < 0.45) {   // the book in his hand
    const lx = -38 - Math.sin(a)*76, ly = -166 + Math.cos(a)*76;
    ogBook(sh.x + lx*sh.s, sh.y + ly*sh.s - 30*sh.s, 46*sh.s, -a + Math.PI, 1, cur.th.w);
  }
  ctx.restore();
}
// "NAILONG!" bursts by his head
function ogShouts(t, S, sh){
  if (!sh || S.replay) return;
  for (const sy of S.shouts || []) {
    const age = (S.pp - sy.row*OG_LEN)/Math.max(1, S.v);
    if (age < 0 || age > (sy.big ? 1.6 : 1.3)) continue;
    const pop = fxBack(clamp(age/0.2, 0, 1)), a = 1 - clamp((age - (sy.big ? 1.25 : 1.0))/0.3, 0, 1);
    const size = sy.big ? Math.min(78, W/13) : Math.min(58, W/18);
    font(size); const fit = Math.min(1, W*0.84/(ctx.measureText(sy.text).width + size)), hw = (ctx.measureText(sy.text).width*fit)/2 + 24;   // a long one shrinks to fit and stays on screen
    const x = clamp(sh.behind ? W*0.3 : sh.x - sh.side*W*0.2, hw, W - hw), y = sh.behind ? H*0.3 : H*0.24;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x + Math.sin(t*40)*3, y); ctx.rotate(-0.08*(sh.side || 1) + Math.sin(t*30)*0.02); ctx.scale(pop*fit, pop*fit);
    title(sy.text, 0, 0, size, '#fff');
    ctx.restore();
  }
}

// the tunnel and everything in it. S = {rows, bonks, throws, sides, ang, pp, finPos, R, fall, ...}
function ogWorld(t, S){
  const g = ogGeo(S.ang, S.pp, S.R);
  ctx.fillStyle = 'rgb(255,246,243)'; ctx.fillRect(-30, -30, W + 60, H + 60);
  ogStreaks(t, S.ang, g.cx, g.cy);
  const sh = ogShouAt(S);
  if (sh) {   // loose pages drifting past outside the tube, in the white, once he is throwing them
    for (let i = 0; i < 7; i++) {
      const th = -Math.PI*(0.08 + 0.84*ogRnd(i + 3)) + (i % 2 ? 0 : Math.PI*0.95), z = ((ogRnd(i)*15 - S.pp*1.1) % 15 + 15) % 15 + 0.6;
      const r = S.R*1.25/z, x = g.cx + Math.cos(th + S.ang*0.3)*r, y = g.cy + Math.sin(th + S.ang*0.3)*r*0.8, al = clamp((15 - z)/5, 0, 1)*clamp((z - 0.6)/0.5, 0, 1);
      if (al > 0.02) ogPage(x, y, 70/z, t*2 + i, Math.cos(t*3 + i), al*0.85);
    }
  }
  for (const f of S.fall || []) {   // books falling away through the holes they punched
    const k = f.age/0.9; if (k >= 1) continue;
    ogBook(f.x + f.vx*f.age, f.y + f.vy*f.age + 300*f.age*f.age, f.w0*(1 - 0.75*k), f.r + f.vr*f.age, Math.cos(f.age*9), f.w, 1 - k*k);
  }
  const iA = Math.max(0, Math.floor((S.pp - 1.6)/OG_LEN)), iB = Math.min(S.rows.length - 1, Math.floor((S.pp + 22)/OG_LEN));
  for (let i = iB; i >= iA; i--) {
    const row = S.rows[i], z0 = g.zOf(i), z1 = z0 + OG_LEN;
    if (z1 <= 0.66) continue;
    const zn = Math.max(z0, 0.62), fog = clamp((z1 - 2.5)/16, 0, 1);
    for (let k = 0; k < 8; k++) if (row.s[k]) ogPanel(g, k, zn, z1, fog, row.k[k], i*8 + k);
  }
  for (const th of S.throws || []) if (th.face !== null && th.done) {   // torn holes
    const z0 = g.zOf(th.row), z1 = g.zOf(th.row + th.len);
    if (z1 > 0.66 && z0 < 23) ogTorn(g, th.row, th.face, th.len, z0, z1, th.row*8 + th.face);
  }
  for (const th of S.throws || []) if (th.face !== null && !th.done) { const k = ogK(th, S.pp); if (k >= 0) ogTarget(g, th, k, t); }
  for (let j = (S.bonks || []).length - 1; j >= 0; j--) if (S.bonks[j].hit < 0) ogFlatBook(g, S.bonks[j]);
  // finish: a white octagon ring inside the last stretch of whole tube
  const zr = S.finPos - S.pp + 1;
  if (zr < 22) {
    const z0 = Math.max(zr, 0.62), z1 = z0 + 0.5;
    ctx.beginPath(); for (let j = 0; j < 8; j++) { const p = g.V(j, z0); j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.closePath();
    for (let j = 7; j >= 0; j--) { const p = g.V(j, z1); j === 7 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]); } ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.fill('evenodd'); ctx.strokeStyle = C.line; ctx.lineWidth = clamp(4/z0, 1, 4); ctx.stroke();
  }
  if (sh && !sh.behind) ogShou(t, S, sh);
  // books in the air, on their way from his hand to their target
  if (sh) for (const th of S.throws || []) {
    const k = ogK(th, S.pp); if (k < 0.45 || k >= 1 || th.done) continue;
    const u = (k - 0.45)/0.55, from = th.from || ogHand(sh, ogArm(0.45));
    let to, wEnd, rEnd;
    if (th.face === null) { to = [g.cx + Math.cos(th.ang)*S.R*0.25, g.cy + Math.sin(th.ang)*S.R*0.25]; wEnd = 8; rEnd = 0; }
    else { const zc = g.zOf(th.row) + th.len*OG_LEN/2; to = g.P(th.face, 0.5, Math.max(0.8, zc)); wEnd = 0.765*S.R/Math.max(0.8, zc)*0.62; rEnd = (th.face + 0.5 - 0.5)*Math.PI/4 + S.ang; }
    const e = u*u*0.45 + u*0.55, x = lerp(from[0], to[0], e), y = lerp(from[1], to[1], e) - Math.sin(Math.PI*u)*H*0.1;
    ogBook(x, y, lerp(46*sh.s, wEnd, th.face === null ? e : e*e), rEnd + (1 - u)*Math.PI*3*(sh.mir ? 1 : -1), th.face === null ? Math.cos(u*12) : Math.cos((1 - u)*10), th.w);
  }
  return sh;
}
const ogR0 = () => Math.min(W, H*1.2)*0.4;
// the first frame of the level, for the slide clip to drop into (story.js calls this while the game is not running)
let OG_PREV = null;
function ogPreview(t){
  if (!OG_PREV) OG_PREV = ogTrack();
  ogWorld(t, {rows: OG_PREV.rows, bonks: OG_PREV.bonks, throws: [], sides: OG_PREV.sides, ang: 0, pp: OG_PZ, finPos: OG_PREV.finPos, R: ogR0(), v: 3.2, replay: true});
}
// ---------- a keycap with an arrow, for the instruction card and the teaching prompts ----------
function ogKey(x, y, s, dir){
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  rr(-30, -26, 60, 58, 12); ctx.fillStyle = '#d9d4e4'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.line; ctx.stroke();
  rr(-30, -32, 60, 56, 12); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
  ctx.translate(0, -4); ctx.rotate(dir === 'L' ? Math.PI : dir === 'U' ? -Math.PI/2 : 0);
  ctx.beginPath(); ctx.moveTo(-14, -6); ctx.lineTo(0, -6); ctx.lineTo(0, -15); ctx.lineTo(15, 0); ctx.lineTo(0, 15); ctx.lineTo(0, 6); ctx.lineTo(-14, 6); ctx.closePath();
  ctx.fillStyle = C.line; ctx.fill();
  ctx.restore();
}
// ---------- bot: plays the moves the track was built from, each in the middle of its window ----------
function ogBot(){
  const m = OG.moves[OG.botI];
  if (!m || OG.flip >= 0) return;
  const pp = ogPP(), mid = (m.a + (m.b - m.a)*0.5)*OG_LEN;
  if (m.flip ? pp + ogVe()*OG_FLIP >= mid : pp >= mid) { OG.botI++; m.flip ? ogFlip() : ogTurn(m.d); }
}
// ---------- input ----------
// shared by every key and click: the fall, the instruction card and the 'Again.' beat swallow it. True = it was swallowed.
function ogEarly(){
  if (OG.dead >= 0) { if (OG.dead > 0.3) { ogReset(true); OG.intro = 0; } return true; }   // impatient: skip the rest of the fall
  if (OG.intro > 0) { if (OG.again || OG.introT > 0.35) OG.intro = 0; return true; }      // a key or click starts the run (not a key still held from the clip)
  return OG.fin >= 0;
}
function ogTurn(dir){
  if (ogEarly()) return;
  if (OG.flip >= 0) { if (OG.flip > OG_FLIP - 0.15) OG.buf = dir; return; }   // a turn pressed just before landing happens on landing
  OG.fc += dir; OG.lean = dir; OG.leanT = 0.16; OG.lastTurn = dir;
  window.SFX && SFX.play('swish', {p: dir > 0 ? 1.1 : 0.9, g: 0.6}); window.SFX && SFX.play('tick', {p: dir > 0 ? 1 : 0.85, g: 0.6});   // the tunnel swishes round, with a detent click (two pitches for the two ways)
}
function ogFlip(){
  if (ogEarly() || OG.flip >= 0) return;
  OG.flipDir = OG.lastTurn; OG.flipA0 = OG.ang; OG.fc += 4*OG.flipDir; OG.flipA1 = -OG.fc*Math.PI/4; OG.flip = 0; OG.buf = 0;
  window.SFX && SFX.play('zip', {g: 0.8});   // up and over to the ceiling
}
// ---------- update ----------
// a point on screen for a face, as the world is drawn this frame (for the effects that start where a book lands)
const ogScr = (face, u, z) => ogGeo(OG.ang, ogPP(), ogR0()).P(face, u, z);
function ogStep(dt){
  // the score is a time (Max, 13 Oct: "this way we can do a timer"): it runs from the first start to the finish ring, through falls
  // and retries and every bonk (a bonk slows him, so it costs time), but not while the instruction card is up
  if (OG.fin < 0 && !(OG.intro > 0 && !OG.again)) OG.clk += dt;
  if (OG.stop > 0) { OG.stop -= dt; dt = 0; }   // hit-stop: the whole field holds still for a few frames on a fall or a slam
  if (OG.shake > 0) OG.shake -= dt;
  if (OG.intro > 0) { OG.intro -= dt; OG.introT += dt; if (window.AUTO && !OG.again && OG.introT > 1) OG.intro = 0; }
  if (OG.leanT > 0) OG.leanT -= dt;
  if (OG.land > 0) OG.land -= dt;
  if (OG.ramp >= 0) { OG.ramp += dt; if (OG.ramp > 0.9) OG.ramp = -1; }
  if (OG.bonkT >= 0) { OG.bonkT += dt; if (OG.bonkT > 1.4) OG.bonkT = -1; }
  for (const f of OG.fx) { f.age += dt; f.x += f.vx*dt; f.y += f.vy*dt; f.vy += f.gr*dt; f.r += f.vr*dt; }
  OG.fx = OG.fx.filter(f => f.age < f.life);
  for (const f of OG.fall) f.age += dt;
  OG.fall = OG.fall.filter(f => f.age < 0.9);
  if (OG.flip >= 0) {
    OG.flip += dt; const k = clamp(OG.flip/OG_FLIP, 0, 1);
    OG.ang = lerp(OG.flipA0, OG.flipA1, ease(k));
    if (k >= 1) {   // landed
      OG.flip = -1; OG.ang = OG.flipA1; OG.land = 0.2; window.SFX && SFX.play('tick', {p: 0.6});
      if (OG.buf) { const d = OG.buf; OG.buf = 0; ogTurn(d); }
    }
  } else OG.ang += (-OG.fc*Math.PI/4 - OG.ang)*Math.min(1, dt*16);
  if (OG.dead >= 0) {
    OG.dead += dt;
    // tell main.js once per fall (it owns the ride's lives and may freeze us with dt = 0), after she has seen him drop
    if (!OG.died && OG.dead >= 0.3) { OG.died = true; const api = GAMES.octagon.api; api && api.died && api.died(); }
    if (OG.dead > OG_FALL) ogReset(true);
    return;
  }
  if (OG.fin >= 0) {
    OG.fin += dt;
    if (OG.fin > 1.0 && !OG.sent) {
      OG.sent = true; OG.bestM = Math.max(OG.bestM, ogMetres());
      const secs = Math.round(OG.clk*10)/10;
      (window.OGLOG = window.OGLOG || []).push({time: secs, run: +OG.run.toFixed(1), deaths: OG.deaths, metres: OG.bestM, bonks: OG.bonks.filter(b => b.hit >= 0 && b.hit < 99).length});
      GAMES.octagon.api.done(secs);   // score: her time in seconds, lower is better (menu.js MENU_OWN_TIME). The win jingle comes from main.js
    }
    return;
  }
  if (OG.intro > 0 || dt === 0) return;
  if (window.AUTO) ogBot();
  // speed: each stretch of the track has its own, eased in (a chevron ramp snaps it up)
  const pp0 = ogPP(); let sp = OG.spd[0];
  for (const s of OG.spd) if (pp0 >= s.row*OG_LEN) sp = s;
  OG.v += (sp.v - OG.v)*Math.min(1, dt*(sp.snap ? 6 : 1.6));
  if (sp.snap && !OG.rampSeen) { OG.rampSeen = true; OG.ramp = 0; window.SFX && SFX.play('whoosh', {p: 1.5, g: 0.9}); window.SFX && SFX.play('zip', {p: 1.3, g: 0.6}); }
  const v = ogVe();
  OG.run += dt; OG.dist += v*dt;
  const pp = ogPP(), f = ogM8(OG.fc);
  // Mr Shou's books: whoosh as one leaves his hand, and a slam where it lands (the cells are gone from that frame on)
  for (const th of OG.throws) {
    if (th.done) continue;
    const k = ogK(th, pp);
    if (!th.rel && k >= 0.45) { th.rel = true; const sh = ogShouAt({sides: OG.sides, pp}); th.from = sh ? ogHand(sh, ogArm(0.45)) : [W/2, H*0.12]; window.SFX && SFX.play('whoosh', {p: 1.25, g: 0.7}); }   // it leaves his hand from where he is now
    if (k < 1) continue;
    th.done = true;
    if (th.face === null) continue;   // that one sailed off into the distance
    for (let i = th.row; i < th.row + th.len; i++) if (OG.rows[i]) { OG.rows[i].s[th.face] = false; OG.rows[i].torn[th.face] = true; }
    const zc = th.row*OG_LEN - pp + 1 + th.len*OG_LEN/2, at = ogScr(th.face, 0.5, Math.max(0.8, zc)), cx = W/2, cy = H*0.42;
    const ox = at[0] - cx, oy = at[1] - cy, ol = Math.hypot(ox, oy) || 1;
    OG.fall.push({x: at[0], y: at[1], vx: ox/ol*260, vy: oy/ol*260, w0: 0.765*ogR0()/Math.max(0.8, zc)*0.62, r: (th.face)*Math.PI/4 + OG.ang, vr: 7, w: th.w, age: 0});
    for (let i = 0; i < 12; i++) { const a = ogRnd(th.row*13 + i)*Math.PI*2, sp2 = 140 + ogRnd(th.row + i*5)*260;   // red fibreglass chips
      OG.fx.push({kind: 'chip', x: at[0], y: at[1], vx: Math.cos(a)*sp2 - ox/ol*120, vy: Math.sin(a)*sp2 - oy/ol*120 - 120, gr: 900, r: a, vr: 12, age: 0, life: 0.55, s: 0.6 + ogRnd(i)*0.6}); }
    for (let i = 0; i < 5; i++) { const a = -Math.PI/2 + (ogRnd(th.row*7 + i) - 0.5)*2.4, sp2 = 120 + ogRnd(i*3 + th.row)*160;          // pages fluttering out of it
      OG.fx.push({kind: 'page', x: at[0], y: at[1], vx: Math.cos(a)*sp2, vy: Math.sin(a)*sp2, gr: 160, r: a, vr: 4 + i, age: 0, life: 0.95, s: 1}); }
    OG.shake = Math.max(OG.shake, 0.14); OG.stop = Math.max(OG.stop, 0.035);
    window.SFX && SFX.play('crash', {p: 1.25, g: 0.55}); window.SFX && SFX.play('books', {p: 1.3, g: 0.5}); window.SFX && SFX.play('thud', {p: 0.9, g: 0.6});
  }
  // the sprint: the beat swells as he gets right behind
  const sh = ogShouAt({sides: OG.sides, pp});
  if (sh && sh.behind && !OG.cue) { OG.cue = true; window.MUSIC && MUSIC.cue && MUSIC.cue('climax'); }
  for (const b of OG.bonks) if (b.hit < 0 && pp >= (b.row + 0.5)*OG_LEN - 0.35) {
    if (OG.flip >= 0 || f !== b.face) { b.hit = 99; continue; }   // he flew over it, or went round it
    b.hit = 0; OG.bonkT = 0; OG.bonkW = b.w; OG.bonkSide = ogRnd(b.row + 1) < 0.5 ? -1 : 1; OG.stop = 0.06; OG.shake = 0.12;   // BONK: a beat of hit-stop, then he wobbles on at a third of the speed
    window.SFX && SFX.play('boing', {g: 0.8}); window.SFX && SFX.play('thwack', {g: 0.6}); window.SFX && SFX.play('books', {p: 1.6, g: 0.35});
  }
  if (OG.flip < 0 && !ogSolid(pp, f)) {
    OG.dead = 0; OG.shake = 0.25; OG.stop = 0.065;
    window.SFX && SFX.play('scream', {p: 1.15, g: 0.7});   // off the edge into the white: AAAA
    OG.lastM = ogMetres(); OG.bestM = Math.max(OG.bestM, OG.lastM);
    return;
  }
  if (pp >= OG.finPos) { OG.fin = 0; window.SFX && SFX.play('clear'); window.SFX && SFX.play('whoosh', {p: 1.2, g: 0.8}); }   // through the finish ring
}
// ---------- the instruction card: what the keys do, in big words, until a key or a click (6 s at most) ----------
function ogCard(t){
  const cx = W/2, cy = H*0.33, cw = Math.min(660, W - 40), ch = 350;
  const pop = fxBack(clamp(OG.introT/0.35, 0, 1)), out = clamp(OG.intro/0.2, 0, 1);
  ctx.save(); ctx.globalAlpha = out;
  ctx.translate(cx, cy); ctx.scale(pop, pop);
  ctx.fillStyle = 'rgba(74,47,12,.22)'; rr(-cw/2 + 9, -ch/2 + 12, cw, ch, 38); ctx.fill();
  ctx.fillStyle = '#fff'; rr(-cw/2, -ch/2, cw, ch, 38); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.line; ctx.stroke();
  const gL = -cw*0.22, gR = cw*0.25, ky = -62, wy = 22, nod = d => Math.sin(t*5)*4*d;   // the arrows nod the way they turn
  ogKey(gL - 50 + nod(-1), ky, 1.45, 'L'); ogKey(gL + 50 + nod(1), ky, 1.45, 'R');
  ogKey(gR, ky - Math.abs(Math.sin(t*5))*6, 1.45, 'U');
  title(LINES_OCTAGON.turn, gL, wy, 60); title(LINES_OCTAGON.flip, gR, wy, 60);
  ctx.strokeStyle = 'rgba(74,47,12,.18)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo((gL + gR)/2 + 8, ky - 40); ctx.lineTo((gL + gR)/2 + 8, wy + 20); ctx.stroke();
  title(LINES_OCTAGON.red, 0, 86, 34, '#ef4a52');
  font(22, 600); ctx.fillStyle = C.line; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(LINES_OCTAGON.books, 0, 120);
  font(20, 600); ctx.fillStyle = 'rgba(74,47,12,.6)';
  ctx.fillText(LINES_OCTAGON.start, 0, 150);
  const bw = 180, left = clamp(OG.intro/OG_CARD, 0, 1);   // a little bar that runs down, so the wait never feels stuck
  rr(-bw/2, 164, bw, 6, 3); ctx.fillStyle = 'rgba(74,47,12,.12)'; ctx.fill();
  rr(-bw/2, 164, bw*left, 6, 3); ctx.fillStyle = '#ef4a52'; ctx.fill();
  ctx.restore();
}
// ---------- the bonk: stars round his head, the book flipping away, BONK! ----------
function ogStar(x, y, r, rot){
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = rot + i*Math.PI/5 - Math.PI/2, q = i % 2 ? r*0.45 : r; i ? ctx.lineTo(x + Math.cos(a)*q, y + Math.sin(a)*q) : ctx.moveTo(x + Math.cos(a)*q, y + Math.sin(a)*q); }
  ctx.closePath(); ctx.fillStyle = C.y; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = C.line; ctx.lineJoin = 'round'; ctx.stroke();
}
function ogBonkFx(t, cx, fy){
  const k = OG.bonkT, sd = OG.bonkSide;
  if (k < 0) return;
  if (k < 0.22) {   // impact lines where they met
    const u = k/0.22; ctx.strokeStyle = `rgba(255,255,255,${1 - u})`; ctx.lineWidth = 6; ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) { const a = i*Math.PI/4 + 0.3, r0 = 26 + u*40, r1 = r0 + 22; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a)*r0, fy - 30 + Math.sin(a)*r0*0.7); ctx.lineTo(cx + Math.cos(a)*r1, fy - 30 + Math.sin(a)*r1*0.7); ctx.stroke(); }
    ctx.lineCap = 'butt';
  }
  if (k < 1.1) {   // the book flips up and away over the side, tumbling, and gets smaller as it falls away into the void
    const mx = cx + sd*(30 + 420*k), my = fy - 30 - 600*k + 760*k*k;
    ogBook(mx, my, 70*(1 - 0.5*k), sd*k*13, Math.cos(k*16), OG.bonkW, 1 - clamp((k - 0.75)/0.35, 0, 1));
  }
  const fade = 1 - clamp((k - 1.0)/0.35, 0, 1);   // stars orbit his head while he is dizzy
  ctx.save(); ctx.globalAlpha = fade;
  for (let i = 0; i < 5; i++) { const a = t*7 + i*Math.PI*2/5; ogStar(cx + Math.cos(a)*40, fy - 78 + Math.sin(a)*11, 9 + 2*Math.sin(a), t*4 + i); }
  ctx.restore();
  if (k < 0.8) {   // BONK!
    const pop = fxBack(clamp(k/0.18, 0, 1));
    ctx.save(); ctx.globalAlpha = 1 - clamp((k - 0.6)/0.2, 0, 1); ctx.translate(cx - sd*120, fy - 128 - k*24); ctx.rotate(-sd*0.16); ctx.scale(pop, pop);
    title(LINES_OCTAGON.bonk, 0, 0, 48, '#fff');
    ctx.restore();
  }
}
// ---------- draw (no state changes in here) ----------
function ogPaint(t){
  const cx = W/2, cy = H*0.42, R0 = ogR0(), pp = ogPP(), playing = OG.intro <= 0 && OG.dead < 0 && OG.fin < 0, talk = !OG.replay;   // a replay from the menu: no card, no bubbles, no teaching keys, no shouts
  let R = R0;
  if (OG.fin > 0) { const u = clamp(OG.fin/0.6, 0, 1); R *= 1 + u*u*0.9; }   // finish: the camera surges through the ring under the white-out
  const S = {rows: OG.rows, bonks: OG.bonks, throws: OG.throws, sides: OG.sides, shouts: OG.shouts, ang: OG.ang, pp, finPos: OG.finPos, R, fall: OG.fall, v: OG.v, fin: OG.fin, replay: OG.replay};
  const behindShake = (() => { const s = ogShouAt(S); return s && s.behind && playing ? 0.25 : 0; })();
  ctx.save(); ctx.translate(...fxShake(Math.max(OG.shake/0.25, behindShake), 12));   // a fall, a slam, or him right behind shakes the tunnel layer only, never the HUD
  const sh = ogWorld(t, S);
  if (OG.intro > 0 && !OG.again) { ctx.fillStyle = `rgba(255,246,243,${0.5*clamp(OG.intro/0.2, 0, 1)})`; ctx.fillRect(-20, -20, W + 40, H + 40); }   // the card's wash: the tunnel stays visible, Nailong stays bright
  if (OG.dead >= 0 && OG.dead < 0.08) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(-20, -20, W + 40, H + 40); }   // white flash on the fall
  for (const f of OG.fx) {   // chips of the slide and pages from a slam
    const a = 1 - clamp((f.age - f.life*0.6)/(f.life*0.4), 0, 1);
    if (f.kind === 'page') ogPage(f.x, f.y, 26, f.r, Math.cos(f.age*11), a);
    else { ctx.save(); ctx.globalAlpha = a; ctx.translate(f.x, f.y); ctx.rotate(f.r); rr(-7*f.s, -5*f.s, 14*f.s, 10*f.s, 2); ctx.fillStyle = '#e0303a'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = C.line; ctx.stroke(); ctx.restore(); }
  }
  if (OG.ramp >= 0) {   // speed lines off the chevrons
    const u = OG.ramp/0.9; ctx.strokeStyle = `rgba(255,255,255,${0.85*(1 - u)})`; ctx.lineCap = 'round';
    for (let i = 0; i < 14; i++) { const a = i*Math.PI*2/14 + 0.2, r0 = 120 + ((u*900 + i*97) % 420), r1 = r0 + 90; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a)*r0, cy + Math.sin(a)*r0); ctx.lineTo(cx + Math.cos(a)*r1, cy + Math.sin(a)*r1); ctx.stroke(); }
    ctx.lineCap = 'butt';
  }
  const fy = cy + R0*Math.cos(Math.PI/8);   // Nailong stays at the bottom while the tunnel rushes past
  if (OG.dead >= 0) {
    nailong(cx, fy + OG.dead*OG.dead*900, 0.36*(1 - clamp(OG.dead, 0, 0.8)), {arms: 'up', flail: t*20, look: [0, -1]});
    if (talk) bubble(OG.failLine, cx, fy - 140, 30);
  } else if (OG.fin >= 0) {
    const u = clamp(OG.fin/0.6, 0, 1);
    nailong(cx, fy - Math.abs(Math.sin(OG.fin*10))*30, 0.36 + u*0.1, {arms: 'up', flail: OG.fin*18, mouth: 'open'});
    ctx.fillStyle = `rgba(255,255,255,${0.9*u*u})`; ctx.fillRect(-20, -20, W + 40, H + 40);
    title(LINES_OCTAGON.win, cx, H*0.38, Math.min(110, W/9));
    if (talk) bubble(LINES_OCTAGON.winBubble, cx, fy - 150, 30);
  } else if (OG.flip >= 0) {   // the flip: he rises to the middle and spins while the world turns over, then lands at the bottom
    const k = clamp(OG.flip/OG_FLIP, 0, 1), up = Math.sin(Math.PI*k);
    nailong(cx, fy - (fy - cy)*0.78*up, 0.36, {arms: 'up', flail: t*16, mouth: 'open', look: [0, -0.6], rot: OG.flipDir*Math.PI*2*ease(k), sx: 1 - 0.12*up, sy: 1 - 0.12*up});
  } else {
    const lk = Math.max(0, OG.leanT)/0.16, ld = Math.max(0, OG.land)/0.2;   // leans and looks into each turn for 0.16 s; squashes on landing
    const bk = OG.bonkT >= 0 ? clamp(1 - OG.bonkT/0.3, 0, 1) : 0, dz = OG.bonkT >= 0 ? clamp((1.25 - OG.bonkT)/0.4, 0, 1) : 0;   // a bonk: flattened, then dizzy
    const idle = OG.intro > 0 && !OG.again ? Math.abs(Math.sin(t*3))*4 : 0;   // a little bounce while he waits for her
    const look = dz ? [Math.sin(t*13), Math.cos(t*13)*0.6] : OG.intro > 0 ? [0, -0.6] : [-OG.lean*lk, 0];
    nailong(cx, fy + 4*bk - (playing ? Math.abs(Math.sin(OG.run*14))*5*(1 - dz) : idle), 0.36,
      {walk: OG.run*14, mouth: dz ? 'o' : 'open', look, arms: bk > 0.2 ? 'up' : undefined, flail: t*20,
       rot: -OG.lean*0.22*lk + OG.bonkSide*0.3*bk + Math.sin(t*15)*0.09*dz, sx: 1 + 0.12*lk + 0.2*ld + 0.42*bk, sy: 1 - 0.12*lk - 0.18*ld - 0.36*bk});
    if (sh && sh.behind && playing) fxMark('sweat', cx + 22, fy - 66, (t*1.4) % 1, 0.45);   // he can feel him right behind
  }
  ogBonkFx(t, cx, fy);
  if (sh && sh.behind) ogShou(t, S, sh);   // right behind: in front of everything, in the corner
  ogShouts(t, S, sh);
  ctx.restore();   // end of the shake layer
  // HUD: the percentage top left with two decimals, like the real game, and the running time beside it (the menu's format)
  const pct = clamp(OG.dist/(OG.finPos - OG_PZ), 0, 1), pctTxt = (pct*100).toFixed(2) + '%';
  const hud = (txt, x, y) => { ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(255,246,243,.9)'; ctx.lineWidth = 5; ctx.strokeText(txt, x, y); ctx.fillText(txt, x, y); };
  font(30, 500); ctx.fillStyle = 'rgba(74,47,12,.75)'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  hud(pctTxt, 22, 18); hud(ogTime(OG.clk), 22 + ctx.measureText(pctTxt).width + 26, 18);
  // teaching: a keycap beside Nailong over the first two turns, the first flip and the first book while each one comes up
  if (playing && talk) {
    const m = OG.moves.find((mv, i) => (i < 2 || mv.teach || (mv.flip && !OG.moves.slice(0, i).some(o => o.flip))) && mv.a*OG_LEN - pp < 9 && pp < mv.b*OG_LEN && ogM8(OG.fc) !== mv.to && OG.flip < 0);
    if (m) {
      const x = cx + (m.flip ? 190 : -m.d*190), y = fy - 70 + Math.sin(t*10)*4;   // beside Nailong, on the side the path goes
      ogKey(x, y, 1.15, m.flip ? 'U' : m.d > 0 ? 'L' : 'R');
      title(m.flip ? LINES_OCTAGON.flip : LINES_OCTAGON.turn, x, y + 64, 30, '#fff');
    }
  }
  if (OG.intro > 0) {
    if (OG.again) title(LINES_OCTAGON.again, cx, H*0.3, 64, C.y);
    else { ogCard(t); if (OG.introT > 0.5) bubble(LINES_OCTAGON.say, cx, fy - 78, 28); }
  }
}

GAMES.octagon = {
  title: LINES_OCTAGON.title,
  hint: LINES_OCTAGON.hint,
  enter(api){   // one level: any ?level= plays it. api.replay (from the end menu) skips the card and every line of dialogue
    this.api = api; OG.replay = !!(api && api.replay); OG.deaths = 0; OG.lastM = 0; OG.bestM = 0; OG.clk = 0; ogReset(false);
  },
  draw(t, dt){ ogStep(dt); ogPaint(t); },
  cardUp(){ return OG.intro > 0 && !OG.again; },   // main.js: the subtitle waits for the card to go
  key(e){
    const k = e.key;
    if (e.repeat && (OG.dead >= 0 || OG.intro > 0)) return;   // a key held down through the fall or the card does not skip it
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') ogTurn(1);
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') ogTurn(-1);
    else if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ') { if (e.preventDefault) e.preventDefault(); ogFlip(); }
    else if (OG.intro > 0 || OG.dead >= 0) ogEarly();   // any other key starts the run too (the card says "press any key")
  },
  pointer(kind, x, y){
    if (kind !== 'down') return;
    if (y < H/3) ogFlip(); else ogTurn(x < W/2 ? 1 : -1);
  },
};
