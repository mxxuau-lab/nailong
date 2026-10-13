// ---------- Block Blast, Nailong edition: CLEAR THE ROAD ----------
// The board is the real Block Blast: 8x8 grid, three pieces in a tray, drag a piece onto the grid (no rotation),
// any full row or column clears, a new tray once all three are placed, the lines about to clear light up.
// Max's twist (12 Oct): Nailong drives Crony's grey Camry over an arched bridge on Lake Burley Griffin. The jelly
// blocks that fell in the bridge clip sit on the road. Every row or column she clears blasts the next roadblock
// into the lake. If the car reaches a block that is still there it crashes (one life, instant retry).
// Clear far ahead and the car speeds up to catch up. Finish = the car reaches the far end of the bridge.
const LINES_BB = {
  cardTitle: 'CLEAR THE ROAD!',
  card1: 'Drag the blocks into the grid.',
  card2: 'Full row or column = one block off the road.',
  card3: "Don't let Nailong crash!",
  cardKeys: 'trackpad: drag     keys: 1 2 3, arrows, space',
  cardGo: 'click or press any key to start',
  go: 'GO!',
  cam: 'DASHCAM',
  left: 'BLOCKS ON THE ROAD',
  sign: 'PARLIAMENT',
  start: 'Uh oh. Blocks. On the bridge.',
  danger: ['HURRY UP!!!', 'CRONY!!! THE BLOCKS!!!', "I DON'T HAVE MY LICENCE!!!", 'WHERE ARE THE BRAKES?!', "IT'S YOUR CAMRY!!!", 'AAAAAAAAAA!!!', 'ANY LINE!!! ANY LINE!!!'],
  phew: ['PHEW!!!', 'TOO CLOSE!!!', 'MY HEART!!!', 'OK OK OK OK'],
  fast: ['WHEEEEE!', 'FULL SPEED!!!', 'CATCHING UP!!!'],
  crash: ['BONK.', 'MY FACE!!!', 'I SAID HURRY UP!!!', 'OWWWWW!!!', 'THE CAMRY!!!'],
  bonk: 'BONK!',
  retry: ['Again. Faster this time.', 'The Camry is fine. Go!', 'Round two. The blocks are back.'],
  stuck: 'NO ROOM!!! NO BRAKES!!!',
  multi: ['', '', 'DOUBLE BLAST!', 'TRIPLE BLAST!', 'MEGA BLAST!'],
  perfect: 'PERFECT BOARD!',
  win: 'WE MADE IT!!!',
  winTitle: 'ROAD CLEAR!',
  hintKeys: 'trackpad: drag the blocks / keys: 1 2 3 pick, arrows move, space drops',
};
const BB_COLS = ['#FFD21F', '#ff7a3d', '#ef476f', '#4fa8ff', '#52c56a', '#a77bf0', '#ff9ec4', '#5a3b14'];
// ---- the road: one level, tuned so a quick player finishes in about 45 to 70 s ----
const BB_N = 8;                  // roadblocks on the bridge
const BB_V0 = 0.0165;            // the car's steady speed, in bridge lengths per second
const BB_FIRST = 9;              // seconds of driving before the car reaches the first block (the domino in the first tray clears it)
const BB_GAP = 6.5;              // seconds of driving between blocks at the steady speed (a line every 6.5 s keeps up)
const BB_U0 = -0.05, BB_FIN = 1.04;   // the car starts on the left shore and finishes on the right shore
const BB_PHI = Math.PI * 0.2;    // the bridge is 20% of a circle: 72 degrees of arc, so its ends slope at 36
const BB_CAR = 0.28;             // car scale (camry() from story-canberra.js)
const BB_RC = 17;                // roadblock cell size
const BB_D0 = BB_GAP * BB_V0 * 1.7, BB_D1 = BB_GAP * BB_V0;   // clear more than 1.7 blocks ahead and the car speeds up
const BB_CARD = 6;               // the instruction card stays until a key or click, at most 6 s
const BB_CRASH = 1.5;            // seconds of crash before the instant retry
const BB_MERCY = 0.15;           // after each crash the car drives 15% slower (counted up to 4 crashes), so a slow player always gets across; 0 turns it off
const bbV0 = () => BB_V0 / (1 + BB_MERCY * Math.min(BB.fails || 0, 4));   // the steady speed for this try
const BB_ZAP = 0.25;             // seconds for the spark to fly from the cleared line to the roadblock
// fallen blocks already on the board at the start (digits are colours): one domino in the tray clears the bottom row
const BB_FALLEN = [
  '........', '........', '........', '........', '........', '........',
  '42....15',
  '334..661',
];
// roadblock shapes, cells as [row from the road up, col]
const BB_RSHAPES = [[[0, 0], [0, 1], [1, 0], [1, 1]], [[0, 0], [1, 0]], [[0, 0], [0, 1], [1, 1]], [[0, 0], [0, 1]], [[0, 0], [1, 0], [1, 1]]];
// piece families: [rows, weight, colour index]; every rotation / mirror is generated and de-duplicated
const BB_FAMILIES = [
  [['#'], 0.35, 0],
  [['##'], 1, 3], [['###'], 1.4, 4], [['####'], 1.1, 5], [['#####'], 0.7, 6],
  [['##', '##'], 1.6, 0], [['###', '###', '###'], 0.9, 1], [['##', '##', '##'], 1, 2],
  [['#.', '##'], 1.7, 3], [['#..', '#..', '###'], 1, 6],
  [['#.', '#.', '##'], 1.5, 4], [['###', '.#.'], 1.4, 5],
  [['.##', '##.'], 1.3, 2], [['##', '##', '#.'], 0.8, 1],
];
function bbVariants(rows) {
  const cells = [];
  rows.forEach((s, r) => [...s].forEach((ch, c) => { if (ch === '#') cells.push([r, c]); }));
  const out = new Map();
  for (let m = 0; m < 8; m++) {
    let cs = cells.map(([r, c]) => [r, c]);
    for (let k = 0; k < (m & 3); k++) cs = cs.map(([r, c]) => [c, -r]);
    if (m & 4) cs = cs.map(([r, c]) => [r, -c]);
    const mr = Math.min(...cs.map(a => a[0])), mc = Math.min(...cs.map(a => a[1]));
    cs = cs.map(([r, c]) => [r - mr, c - mc]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    out.set(cs.join('|'), cs);
  }
  return [...out.values()].map(cs => ({ cells: cs, h: Math.max(...cs.map(a => a[0])) + 1, w: Math.max(...cs.map(a => a[1])) + 1 }));
}
const BB_SETS = BB_FAMILIES.map(([rows, wt, col]) => ({ wt, col, vars: bbVariants(rows) }));
const BB_WT = BB_SETS.reduce((a, s) => a + s.wt, 0);
const BB_Q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams('');
// test hooks: ?seed=N makes the piece sequence repeatable; &botgap=S slows the bot to a human pace (seconds between drops)
let bbSeed = BB_Q.get('seed') | 0;
const BB_BOTGAP = +(BB_Q.get('botgap') || 0) || 0.18;
const bbRand = () => { if (!bbSeed) return Math.random(); bbSeed = (bbSeed + 0x6D2B79F5) | 0; let t = Math.imul(bbSeed ^ (bbSeed >>> 15), 1 | bbSeed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
function bbRandPiece() {
  let x = bbRand() * BB_WT, f = BB_SETS[0];
  for (const s of BB_SETS) { x -= s.wt; if (x <= 0) { f = s; break; } }
  const v = f.vars[Math.floor(bbRand() * f.vars.length)];
  return { cells: v.cells, w: v.w, h: v.h, col: f.col + 1, id: bbRand() };
}

// ---- pure board logic (board = array of 64, 0 empty, else colour index + 1) ----
function bbFits(b, p, r, c) {
  if (r < 0 || c < 0 || r + p.h > 8 || c + p.w > 8) return false;
  for (const [pr, pc] of p.cells) if (b[(r + pr) * 8 + c + pc]) return false;
  return true;
}
function bbApply(b, p, r, c) {
  const nb = b.slice();
  for (const [pr, pc] of p.cells) nb[(r + pr) * 8 + c + pc] = p.col;
  const rows = [], cols = [];
  for (let i = 0; i < 8; i++) {
    let rf = true, cf = true;
    for (let j = 0; j < 8; j++) { if (!nb[i * 8 + j]) rf = false; if (!nb[j * 8 + i]) cf = false; }
    if (rf) rows.push(i); if (cf) cols.push(i);
  }
  const gone = [];
  for (let i = 0; i < 64; i++) { const rr_ = i >> 3, cc = i & 7; if (nb[i] && (rows.includes(rr_) || cols.includes(cc))) gone.push({ r: rr_, c: cc, col: nb[i] }); }
  for (const g of gone) nb[g.r * 8 + g.c] = 0;
  return { b: nb, lines: rows.length + cols.length, rows, cols, gone };
}
function bbAnyFit(b, p) { for (let r = 0; r <= 8 - p.h; r++) for (let c = 0; c <= 8 - p.w; c++) if (bbFits(b, p, r, c)) return true; return false; }
function bbSolvable(b, ps, budget) {
  if (!ps.length) return true;
  if (budget.n-- < 0) return false;
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i], rest = ps.filter((_, j) => j !== i);
    for (let r = 0; r <= 8 - p.h; r++) for (let c = 0; c <= 8 - p.w; c++) {
      if (!bbFits(b, p, r, c)) continue;
      if (bbSolvable(bbApply(b, p, r, c).b, rest, budget)) return true;
      if (budget.n < 0) return false;
    }
  }
  return false;
}

// ---- state ----
const BB = {};
function bbReset(fails, card) {
  const board = new Array(64).fill(0);
  BB_FALLEN.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== '.') board[r * 8 + c] = +ch; }));
  // roadblocks: evenly spaced in driving time; the margin is car half length + block half, on a typical 900-unit bridge
  const m0 = (230 * BB_CAR + BB_RC + 2) / 900, f1 = BB_U0 + m0 + BB_FIRST * BB_V0, df = BB_GAP * BB_V0;
  Object.assign(BB, {
    board, kb: null, kbBad: 0, hand: [null, null, null], combo: 0, miss: 0, placed: 0,
    drag: null, ret: null, fx: [], parts: [], pops: [], pop: {}, shake: 0, freeze: 0, jet: 0, t: 0,
    dealT: 0, dealGap: 0, stuck: false,
    card: card ? BB_CARD : 0, cardAge: 0, go: card ? 0 : 0.9, run: !card, runT: 0,
    u: BB_U0, v: 0, wheel: 0, crash: 0, crashTxt: '', fin: 0, doneCalled: false, fails: fails || 0,
    rb: Array.from({ length: BB_N }, (_, k) => ({ u: f1 + k * df, col: [3, 1, 5, 2, 0, 4, 6, 3, 1, 5][k % 10], shape: BB_RSHAPES[k % BB_RSHAPES.length], gone: false, wob: 0 })),
    fly: [], splash: [], zaps: [], puffs: [], puffT: 0,
    danger: false, dangerN: BB.dangerN || 0, dangerTxt: '', say: '', sayT: 0, beep: 0, fastOn: false,
    bot: null, botT: 0.6, confetti: [],
  });
  if (!card) { BB.say = LINES_BB.retry[(BB.fails - 1 + LINES_BB.retry.length) % LINES_BB.retry.length]; BB.sayT = 2.2; }
  // the first tray always holds the domino that finishes the bottom row, so the first blast comes quickly
  let hand = null;
  for (let k = 0; k < 40; k++) {
    hand = [{ cells: [[0, 0], [0, 1]], w: 2, h: 1, col: 4, id: bbRand() }, bbRandPiece(), bbRandPiece()];
    if (bbSolvable(BB.board, hand, { n: 5000 })) break;
  }
  BB.hand = hand; BB.dealT = 0.0001;
}
function bbDeal() {
  let hand = null;
  for (let k = 0; k < 40; k++) {
    hand = [bbRandPiece(), bbRandPiece(), bbRandPiece()];
    if (hand[0].id !== hand[1].id && bbSolvable(BB.board, hand, { n: 5000 })) break;
  }
  BB.hand = hand; BB.dealT = 0.0001;
  window.SFX && SFX.play('swish', { g: 0.6 });   // a new tray slides in
}

// ---- geometry: the scene band on top, the board, dashcam and tray below ----
function bbGeo() {
  const SB = Math.round(H * 0.43), E = SB - 44;
  let R = (E - 120) / (1 - Math.cos(BB_PHI));
  R = Math.min(R, (W - 260) / (2 * Math.sin(BB_PHI)));
  const apex = E - R * (1 - Math.cos(BB_PHI)), cx = W / 2, cy = apex + R;
  BB.g = { SB, E, R, apex, cx, cy, x0: cx - R * Math.sin(BB_PHI), x1: cx + R * Math.sin(BB_PHI), L: R * 2 * BB_PHI, HZ: apex + 58 };
}
function bbLayout() {
  const top = BB.g.SB + 26;
  const cs = Math.floor(clamp(Math.min((H - top - 46) / 8, (W - 120) / 21), 28, 50));
  const bw = cs * 8, tw = Math.round(cs * 3.4), dw = Math.round(clamp(bw * 0.62, 170, 240));
  const gx = Math.max(16, (W - (dw + 34 + bw + 30 + tw)) / 2);
  Object.assign(BB, { cs, bw, tw, dw, dx: gx, bx: gx + dw + 34, by: top, tx: gx + dw + 34 + bw + 30 });
  BB.slotH = bw / 3;
}
// a point on the road at u (0 = start of the arc, 1 = end), with the car's tilt from its two wheels
function bbRoad(u) {
  const G = BB.g, s = u * G.L;
  if (s < 0) return [G.x0 + s, G.E];
  if (s > G.L) return [G.x1 + (s - G.L), G.E];
  const p = -BB_PHI + 2 * BB_PHI * s / G.L;
  return [G.cx + G.R * Math.sin(p), G.cy - G.R * Math.cos(p)];
}
function bbPath(u, half) {
  const [x, y] = bbRoad(u), d = half / BB.g.L, a = bbRoad(u - d), b = bbRoad(u + d);
  return { x, y, a: Math.atan2(b[1] - a[1], b[0] - a[0]) };
}
function bbSlotScale(p) { return Math.min(BB.cs * 0.58, (BB.tw - 24) / p.w, (BB.slotH - 18) / p.h); }
function bbSlotPos(i, p) {
  const s = bbSlotScale(p);
  return { x: BB.tx + (BB.tw - p.w * s) / 2, y: BB.by + i * BB.slotH + (BB.slotH - p.h * s) / 2, s };
}
const bbMargin = () => (230 * BB_CAR + BB_RC + 2) / BB.g.L;
const bbNext = () => BB.rb.find(b => !b.gone) || null;
const bbLeft = () => BB.rb.filter(b => !b.gone).length;

// ---- drawing helpers ----
function bbBlock(x, y, s, col, a = 1, pop = 1, white = 0) {
  ctx.save();
  if (a < 1) ctx.globalAlpha *= a;
  if (pop !== 1) { const cx = x + s / 2, cy = y + s / 2; ctx.translate(cx, cy); ctx.scale(pop, pop); ctx.translate(-cx, -cy); }
  const g = s * 0.05, lw = Math.max(2, s * 0.07);
  rr(x + g, y + g, s - 2 * g, s - 2 * g, s * 0.24); ctx.fillStyle = col; ctx.fill();
  ctx.lineWidth = lw; ctx.strokeStyle = '#4A2F0C'; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,.13)'; rr(x + s * 0.16, y + s * 0.66, s * 0.68, s * 0.14, s * 0.07); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.45)'; rr(x + s * 0.17, y + s * 0.15, s * 0.66, s * 0.17, s * 0.085); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.8)'; ell(x + s * 0.27, y + s * 0.5, s * 0.05, s * 0.09); ctx.fill();
  if (white > 0) { rr(x + g, y + g, s - 2 * g, s - 2 * g, s * 0.24); ctx.fillStyle = `rgba(255,255,255,${white})`; ctx.fill(); }
  ctx.restore();
}
function bbPiece(p, x, y, s, a = 1) { for (const [r, c] of p.cells) bbBlock(x + c * s, y + r * s, s, BB_COLS[p.col - 1], a); }
// a roadblock, drawn standing on the origin (local coords, already rotated to the road)
function bbRoadblock(b, s = BB_RC) {
  const w = Math.max(...b.shape.map(c => c[1])) + 1;
  for (const [r, c] of b.shape) bbBlock(-w * s / 2 + c * s, -(r + 1) * s, s, BB_COLS[b.col]);
}

// ---- the scene band: sky, Black Mountain, the jet, the lake, the arched bridge, the roadblocks, the Camry ----
function bbScene(t) {
  const G = BB.g;
  sky();
  cloud(W * 0.14 + Math.sin(t * 0.08) * 30, 60, 0.8); cloud(W * 0.58 + Math.cos(t * 0.06) * 40, 44, 0.65); cloud(W * 0.9, 96, 0.55);
  // far shore: Black Mountain with Telstra Tower on the left, the Parliament flagpole on the right
  const HZ = G.HZ;
  ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.lineJoin = 'round';
  ctx.fillStyle = '#7fbf6e'; ctx.beginPath(); ctx.moveTo(-10, HZ + 4); ctx.quadraticCurveTo(W * 0.12, HZ - 92, W * 0.28, HZ - 14); ctx.quadraticCurveTo(W * 0.5, HZ - 46, W * 0.7, HZ - 10); ctx.quadraticCurveTo(W * 0.86, HZ - 60, W + 10, HZ - 6); ctx.lineTo(W + 10, HZ + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  const tx = W * 0.12, tb = HZ - 60;
  ctx.fillStyle = '#ece8df'; rr(tx - 4, tb - 74, 8, 76, 3); ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
  rr(tx - 15, tb - 58, 30, 13, 5); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(tx, tb - 74); ctx.lineTo(tx, tb - 104); ctx.stroke();
  const fx = W * 0.86, fb = HZ - 46;
  ctx.strokeStyle = '#8a8f99'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(fx - 22, fb + 6); ctx.lineTo(fx, fb - 40); ctx.lineTo(fx + 22, fb + 6); ctx.moveTo(fx - 9, fb + 6); ctx.lineTo(fx, fb - 40); ctx.lineTo(fx + 9, fb + 6); ctx.stroke();
  ctx.fillStyle = '#22408f'; ctx.fillRect(fx, fb - 40, 12, 7); ctx.fillStyle = '#e44'; ctx.fillRect(fx, fb - 40, 5, 4);   // the Australian flag: blue, with a red corner for the Union Jack
  // the lake, all the way down behind the board
  ctx.fillStyle = '#4fa9e0'; ctx.fillRect(-10, HZ, W + 20, H);
  ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-10, HZ); ctx.lineTo(W + 10, HZ); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let i = 0; i < 18; i++) { const yy = HZ + 14 + (i * 37) % (H - HZ - 20), xx = ((i * 233 + t * (8 + i % 3 * 4)) % (W + 160)) - 80; ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + 30 + (i % 3) * 16, yy); ctx.stroke(); }
  ctx.lineCap = 'butt';
  // Captain Cook Memorial Jet behind the bridge: surges on every clear (BB.jet)
  const jt = BB.jet || 0, jx = W * 0.7, jbY = HZ + 14, jh = (HZ - 18) * (0.9 + jt * 0.12) + Math.sin(t * 1.3) * 6;
  ell(jx, jbY, 40, 7); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fill();
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#bfe3f7'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(jx - 8, jbY); ctx.quadraticCurveTo(jx - 3, jbY - jh * 0.6, jx - 2, jbY - jh); ctx.lineTo(jx + 2, jbY - jh); ctx.quadraticCurveTo(jx + 3, jbY - jh * 0.6, jx + 8, jbY); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 12; i++) { const a = (i / 12 + t * 0.45) % 1, side = i % 2 ? 1 : -1; ell(jx + side * a * (40 + 24 * jt), jbY - jh + a * a * jh * 0.85 - Math.sin(a * Math.PI) * 24, 4 - a * 1.5, 4 - a * 1.5); ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.fill(); }
  // shores the bridge stands on
  const WL = G.E + 16;
  ctx.lineWidth = 4; ctx.strokeStyle = C.line;
  ctx.fillStyle = C.grass; rr(-30, G.E, G.x0 + 30 + 6, 60, 10); ctx.fill(); ctx.stroke(); rr(G.x1 - 6, G.E, W - G.x1 + 36, 60, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#4d5059'; ctx.fillRect(-30, G.E, G.x0 + 36, 8); ctx.fillRect(G.x1 - 6, G.E, W - G.x1 + 40, 8);
  // piers down to the water
  for (let i = 1; i <= 5; i++) {
    const x = G.x0 + (G.x1 - G.x0) * i / 6, p = Math.asin(clamp((x - G.cx) / (G.R - 22), -1, 1)), yb = G.cy - (G.R - 22) * Math.cos(p);
    rr(x - 9, yb - 4, 18, WL - yb + 8, 3); ctx.fillStyle = '#d6d0c2'; ctx.fill(); ctx.stroke();
    ell(x, WL + 4, 18, 4); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fill();
  }
  // the deck: concrete arc with asphalt on top and a railing
  const arc = (r, a0, a1, ccw) => ctx.arc(G.cx, G.cy, r, a0, a1, ccw);
  const A0 = -Math.PI / 2 - BB_PHI, A1 = -Math.PI / 2 + BB_PHI;
  ctx.strokeStyle = 'rgba(74,47,12,.55)'; ctx.lineWidth = 2.5;
  for (let k = 0; k <= 36; k++) { const a = lerp(A0, A1, k / 36); ctx.beginPath(); ctx.moveTo(G.cx + Math.cos(a) * G.R, G.cy + Math.sin(a) * G.R); ctx.lineTo(G.cx + Math.cos(a) * (G.R + 13), G.cy + Math.sin(a) * (G.R + 13)); ctx.stroke(); }
  ctx.lineWidth = 3; ctx.beginPath(); arc(G.R + 13, A0, A1); ctx.stroke();
  ctx.beginPath(); arc(G.R, A0, A1); arc(G.R - 24, A1, A0, true); ctx.closePath(); ctx.fillStyle = '#e4dfd2'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
  ctx.beginPath(); arc(G.R, A0, A1); arc(G.R - 7, A1, A0, true); ctx.closePath(); ctx.fillStyle = '#4d5059'; ctx.fill();
  ctx.beginPath(); arc(G.R, A0, A1); ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.stroke();
  // the finish: chequered flag at the far end of the bridge, the Parliament sign on the right shore
  const [fx2, fy2] = bbRoad(1.005);
  ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(fx2, fy2); ctx.lineTo(fx2, fy2 - 70); ctx.stroke();
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { ctx.fillStyle = (r + c) % 2 ? '#222' : '#fff'; ctx.fillRect(fx2 + 2 + c * 9, fy2 - 70 + r * 9 + Math.sin(t * 4 + c) * 1.5, 9, 9); }
  ctx.lineWidth = 2; ctx.strokeRect(fx2 + 2, fy2 - 70, 36, 27);
  font(13, 700); const sw = ctx.measureText(LINES_BB.sign + ' >').width + 16, sx = W - sw - 10;
  ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sx + sw / 2, fy2); ctx.lineTo(sx + sw / 2, fy2 - 70); ctx.stroke();
  ctx.fillStyle = '#2e7d4f'; rr(sx, fy2 - 92, sw, 22, 5); ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(LINES_BB.sign + ' >', sx + sw / 2, fy2 - 81);
  // standing roadblocks (the next one shakes when the car is close)
  const nb = bbNext();
  for (const b of BB.rb) {
    if (b.flown) continue;
    const p = bbPath(b.u, BB_RC), sh = b === nb && BB.danger ? Math.sin(BB.t * 40) * 1.5 : 0, wob = b.wob > 0 ? Math.sin(b.wob * 30) * 0.12 * b.wob : 0;
    ctx.save(); ctx.translate(p.x + sh, p.y); ctx.rotate(p.a + wob); bbRoadblock(b); ctx.restore();
    if (b === nb && BB.danger && !BB.crash) fxMark('bang', p.x, p.y - 44, 0.5 + 0.3 * Math.sin(BB.t * 6), 0.7);
  }
  // exhaust puffs and speed lines
  for (const q of BB.puffs) { ell(q.x, q.y, q.r, q.r * 0.8); ctx.fillStyle = `rgba(240,240,245,${0.7 * (1 - q.t / 0.9)})`; ctx.fill(); }
  // the Camry, Nailong at the wheel
  const cp = bbPath(BB.u, 140 * BB_CAR);
  let sqx = 1, sqy = 1, back = 0;
  if (BB.crash) { const k = BB.crash; sqx = 1 - 0.18 * Math.exp(-k * 5) * Math.cos(k * 22); sqy = 1 + 0.14 * Math.exp(-k * 5) * Math.cos(k * 22); back = -Math.min(1, k * 6) * 10 * Math.exp(-k * 2); }
  ctx.save(); ctx.translate(cp.x, cp.y); ctx.rotate(cp.a); ctx.translate(back, 0);
  if (BB.v > BB_V0 * 1.6 && !BB.crash) { ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; for (let i = 0; i < 3; i++) { const o = (BB.t * 300 + i * 40) % 60; ctx.beginPath(); ctx.moveTo(-230 * BB_CAR - 14 - o, -14 - i * 12); ctx.lineTo(-230 * BB_CAR - 44 - o, -14 - i * 12); ctx.stroke(); } ctx.lineCap = 'butt'; }
  ctx.scale(sqx, sqy);
  const scared = BB.danger || BB.crash || BB.stuck;
  camry(0, 0, BB_CAR, { driver: true, wheel: BB.wheel, mouth: scared || BB.fin ? 'open' : 'smile', look: scared ? [0.9, -0.6] : [0.8, 0], bob: BB.run && !BB.crash && !BB.fin ? Math.sin(BB.t * 18) * 0.8 : 0, flash: BB.danger });
  ctx.restore();
  if (BB.crash && BB.crash < 0.9) {   // BONK at the bumper
    const k = BB.crash, hx = cp.x + Math.cos(cp.a) * 230 * BB_CAR, hy = cp.y + Math.sin(cp.a) * 230 * BB_CAR - 26;
    fxRing(hx, hy, k / 0.5, 10, 70, '#fff', 8);
    ctx.save(); ctx.translate(hx, hy - 40 - k * 20); const q = fxBack(k / 0.25); ctx.scale(q, q); ctx.rotate(-0.12); title(LINES_BB.bonk, 0, 0, 44, '#ff6b6b'); ctx.restore();
  }
  // roadblocks flying into the lake, then splashes
  for (const f of BB.fly) { ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot); bbRoadblock(f.b); ctx.restore(); }
  for (const s of BB.splash) {
    const k = s.t / 0.8;
    ctx.save(); ctx.globalAlpha = 1 - k; ell(s.x, s.y, 12 + 50 * k, 4 + 9 * k); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
    for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.15 + 0.7 * i / 6), v = 70 + (i % 3) * 30, x = s.x + Math.cos(a) * v * s.t * 1.3, y = s.y + Math.sin(a) * v * s.t * 2 + 300 * s.t * s.t; if (y > s.y + 4) continue; ell(x, y, 5, 6); ctx.fillStyle = 'rgba(220,245,255,.95)'; ctx.fill(); ctx.strokeStyle = 'rgba(74,47,12,.4)'; ctx.lineWidth = 2; ctx.stroke(); }
  }
}

// ---- gameplay ----
function bbSnap(p, px, py) {
  const cs = BB.cs, fx = (px - p.w * cs / 2 - BB.bx) / cs, fy = (py - 0.9 * cs - p.h * cs - BB.by) / cs;
  let best = null, bd = 0.9;
  for (let r = Math.floor(fy) - 1; r <= Math.floor(fy) + 2; r++) for (let c = Math.floor(fx) - 1; c <= Math.floor(fx) + 2; c++) {
    if (!bbFits(BB.board, p, r, c)) continue;
    const d = Math.hypot(c - fx, r - fy);
    if (d < bd) { bd = d; best = { r, c }; }
  }
  return best;
}
const bbLocked = () => BB.card > 0 || BB.crash > 0 || BB.fin > 0 || BB.stuck;
function bbPick(x, y) {
  if (bbLocked() || BB.drag || BB.dealT > 0 && BB.dealT < 0.4) return;
  if (x < BB.tx - 24 || x > BB.tx + BB.tw + 24) return;
  const i = Math.floor((y - BB.by) / BB.slotH);
  if (i < 0 || i > 2 || !BB.hand[i]) return;
  const sp = bbSlotPos(i, BB.hand[i]);
  BB.drag = { i, x, y, g: 0, sx: sp.x + BB.hand[i].w * sp.s / 2, sy: sp.y + BB.hand[i].h * sp.s, ss: sp.s };
  window.SFX && SFX.play('pop', { p: 1.15 });   // pick it up
}
function bbRelease() {
  const d = BB.drag; if (!d) return;
  BB.drag = null;
  const p = BB.hand[d.i], sn = !bbLocked() && bbSnap(p, d.x, d.y);
  if (sn) bbPlace(d.i, sn.r, sn.c);
  else {
    BB.ret = { i: d.i, x: d.x, y: d.y, t: 0, g: d.g, sx: d.sx, sy: d.sy, ss: d.ss };
    if (d.x < BB.tx - 12) window.SFX && SFX.play('tick', { p: 0.5 });   // a dull no; dropping it back on the tray stays silent
  }
}
// a cleared line blasts the next roadblock: a zap runs from the line up to the block, then it flies into the lake
function bbBlast(fromX, fromY) {
  const b = bbNext(); if (!b) return;
  b.gone = true;
  const ahead = (b.u - bbMargin() - BB.u) * BB.g.L;
  BB.zaps.push({ b, x: fromX, y: fromY, t: ahead < 40 ? BB_ZAP : 0 });
  if (BB.danger) { BB.say = LINES_BB.phew[BB.dangerN % LINES_BB.phew.length]; BB.sayT = 1.4; }
}
function bbPlace(i, r, c) {
  const p = BB.hand[i];
  const res = bbApply(BB.board, p, r, c);
  BB.board = res.b; BB.hand[i] = null; BB.placed++;
  window.SFX && SFX.play('clink', { p: 0.8 });   // set down on the grid
  for (const [pr, pc] of p.cells) BB.pop[(r + pr) + ',' + (c + pc)] = 0;
  if (res.lines) {
    BB.combo++; BB.miss = 0;
    if (window.SFX) {   // each clear in a combo rings a step higher, like climbing a scale (up to an octave)
      const sp = Math.min(2, Math.pow(2, (BB.combo - 1) / 6));
      SFX.play('clear', { p: sp });
      if (res.lines >= 2) setTimeout(() => window.SFX && SFX.play('clear', { p: sp * 1.26 }), 70);
    }
    const cr = r + p.h / 2, cc = c + p.w / 2;
    for (const g of res.gone) BB.fx.push({ r: g.r, c: g.c, col: g.col, flashCol: p.col, t: -Math.hypot(g.r + .5 - cr, g.c + .5 - cc) * 0.045, popped: false });
    BB.shake = Math.min(0.5, 0.15 * res.lines);
    if (res.lines >= 2) BB.freeze = res.lines >= 3 ? 0.09 : 0.06;   // hit-stop: a beat of stillness before a big burst
    BB.jet = Math.max(BB.jet, res.lines >= 3 ? 1 : res.lines === 2 ? 0.6 : 0.3);   // the lake fountain claps along
    const { bx, by, cs, bw } = BB;
    for (const rw of res.rows) bbBlast(bx + bw / 2, by + (rw + 0.5) * cs);
    for (const cl of res.cols) bbBlast(bx + (cl + 0.5) * cs, by + bw / 2);
    const mx = bx + bw / 2, my = by + bw / 2;
    if (res.lines >= 2) BB.pops.push({ x: mx, y: my, txt: LINES_BB.multi[Math.min(4, res.lines)], t: 0, size: 46, col: '#fff' });
    if (BB.board.every(v => !v)) { window.SFX && SFX.play('jingle'); BB.pops.push({ x: mx, y: my + 60, txt: LINES_BB.perfect, t: 0, size: 40, col: BB_COLS[0] }); }
  } else if (++BB.miss >= 3) BB.combo = 0;
  if (BB.hand.every(h => !h)) { BB.dealGap = 0.28; return; }
  bbCheckStuck();
}
function bbKbSelect(i) {
  const p = BB.hand[i]; if (!p) return false;
  const k = BB.kbPos || { r: 3, c: 3 };
  BB.kb = { i, r: clamp(k.r, 0, 8 - p.h), c: clamp(k.c, 0, 8 - p.w) };
  return true;
}
// no piece fits: in Block Blast that is the end. Here Nailong loses the brakes and floors it into the next block.
function bbCheckStuck() {
  const live = BB.hand.filter(Boolean);
  if (live.length && !live.some(p => bbAnyFit(BB.board, p))) { BB.stuck = true; BB.shake = 0.3; BB.drag = null; BB.kb = null; window.SFX && SFX.play('oof'); window.SFX && SFX.play('scream', { g: 0.45 }); }
}

// ---- the bot (window.AUTO): greedy placement, played through the same drag path as a human ----
function bbHoles(b) {
  let n = 0;
  for (let i = 0; i < 64; i++) if (!b[i]) {
    const r = i >> 3, c = i & 7;
    const nb = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([a, d]) => a >= 0 && a < 8 && d >= 0 && d < 8);
    if (nb.every(([a, d]) => b[a * 8 + d])) n++;
  }
  return n;
}
function bbBotMove() {
  let best = null, bs = -1e9;
  const live = BB.hand.map((p, i) => p && { p, i }).filter(Boolean);
  for (const { p, i } of live) for (let r = 0; r <= 8 - p.h; r++) for (let c = 0; c <= 8 - p.w; c++) {
    if (!bbFits(BB.board, p, r, c)) continue;
    const res = bbApply(BB.board, p, r, c);
    let s = res.lines * 40 - bbHoles(res.b) * 9;
    let contact = 0;
    for (const [pr, pc] of p.cells) for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = r + pr + dr, d = c + pc + dc;
      if (a < 0 || a > 7 || d < 0 || d > 7 || BB.board[a * 8 + d]) contact++;
    }
    s += contact * 1.2;
    const rest = live.filter(o => o.i !== i).map(o => o.p);
    if (rest.some(o => !bbAnyFit(res.b, o))) s -= 60;
    if (!bbSolvable(res.b, rest, { n: 400 })) s -= 120;
    let filled = 0; for (let k = 0; k < 64; k++) if (res.b[k]) filled++;
    s -= filled * 0.4;
    if (s > bs) { bs = s; best = { i, r, c }; }
  }
  return best;
}
function bbBotUpdate(dt) {
  if (BB.card > 0) { if (BB.cardAge > 1.5) bbStart(); return; }
  if (bbLocked() || !BB.run) return;
  if (!BB.bot) {
    if (BB.dealT > 0 && BB.dealT < 0.45 || BB.dealGap > 0) return;
    BB.botT -= dt; if (BB.botT > 0) return;
    const m = bbBotMove(); if (!m) { BB.botT = 0.3; return; }
    const p = BB.hand[m.i], sp = bbSlotPos(m.i, p), cs = BB.cs;
    const fx = BB.bx + (m.c + p.w / 2) * cs, fy = BB.by + (m.r + p.h) * cs + 0.9 * cs;
    BB.bot = { m, t: 0, x0: sp.x + p.w * sp.s / 2, y0: sp.y + p.h * sp.s / 2, x1: fx, y1: fy };
    BB.drag = { i: m.i, x: BB.bot.x0, y: BB.bot.y0, g: 0, sx: sp.x + p.w * sp.s / 2, sy: sp.y + p.h * sp.s, ss: sp.s };
    window.SFX && SFX.play('pop', { p: 1.15 });
    return;
  }
  const b = BB.bot; b.t += dt;
  const u = ease(clamp(b.t / 0.38, 0, 1));
  if (BB.drag) { BB.drag.x = lerp(b.x0, b.x1, u); BB.drag.y = lerp(b.y0, b.y1, u); }
  if (b.t > 0.46) { bbRelease(); BB.bot = null; BB.botT = BB_BOTGAP; }
}

// ---- update ----
function bbStart() {   // the instruction card goes away and the car sets off
  if (!(BB.card > 0)) return;
  BB.card = 0; BB.run = true; BB.go = 0.9; BB.say = LINES_BB.start; BB.sayT = 2.4;
  window.SFX && SFX.play('whoosh', { p: 0.8 }); window.SFX && SFX.play('engine');   // the Camry pulls away
}
function bbCar(dt) {
  if (BB.go > 0) BB.go -= dt;
  if (!BB.run) return;
  const G = BB.g, m = bbMargin(), nb = bbNext();
  if (BB.crash) {
    BB.crash += dt;
    if (BB.crash > BB_CRASH) bbReset(BB.fails + 1, false);
    return;
  }
  if (BB.fin) {
    BB.fin += dt; BB.v *= Math.pow(0.05, dt); BB.u += BB.v * dt; BB.wheel += BB.v * G.L * dt / (33 * BB_CAR);
    if (BB.fin > 2.4 && !BB.doneCalled) { BB.doneCalled = true; GAMES.blockblast.api.done(); }   // the win jingle comes from main.js
    return;
  }
  BB.runT += dt;
  const ahead = nb ? nb.u - m - BB.u : 9;
  const v0 = bbV0();
  let vt = v0 * clamp(1 + (ahead - BB_D0) / BB_D1, 1, 3.2);
  if (BB.stuck && nb) vt = BB_V0 * 5;
  BB.v += (vt - BB.v) * Math.min(1, dt * (BB.stuck ? 4 : 1.6));
  BB.u += BB.v * dt;
  BB.wheel += BB.v * G.L * dt / (33 * BB_CAR);
  // exhaust
  BB.puffT -= dt;
  if (BB.puffT <= 0) { BB.puffT = 0.22; const p = bbPath(BB.u, 140 * BB_CAR); BB.puffs.push({ x: p.x - Math.cos(p.a) * 236 * BB_CAR, y: p.y - Math.sin(p.a) * 236 * BB_CAR - 10, r: 5, t: 0 }); }
  // danger: about 2.8 s from the next block at the current speed
  const tti = nb ? ahead / Math.max(BB.v, v0) : 99, was = BB.danger;
  BB.danger = !!nb && tti < 2.8;
  if (BB.danger && !was && !BB.stuck) { BB.dangerTxt = LINES_BB.danger[BB.dangerN % LINES_BB.danger.length]; BB.dangerN++; window.SFX && SFX.play('scream', { g: 0.4 }); }
  if (BB.danger) { BB.beep -= dt; if (BB.beep <= 0) { BB.beep = 0.45; window.SFX && SFX.play('tick', { p: 1.7 }); } } else BB.beep = 0;
  const fast = BB.v > v0 * 1.7;
  if (fast && !BB.fastOn && !BB.danger && BB.sayT <= 0) { BB.say = LINES_BB.fast[BB.dangerN % LINES_BB.fast.length]; BB.sayT = 1.4; }
  if (fast && !BB.fastOn) window.SFX && SFX.play('engine', { p: 1.3, g: 0.7 });   // catching up: the engine revs
  BB.fastOn = fast;
  if (nb && BB.u >= nb.u - m) {   // crash: one life, then the run starts again
    BB.u = nb.u - m; BB.crash = 0.0001; BB.danger = false; BB.stuck = false; nb.wob = 1; BB.drag = null; BB.bot = null; BB.kb = null;
    BB.crashTxt = LINES_BB.crash[BB.fails % LINES_BB.crash.length]; BB.shake = 0.5;
    window.SFX && SFX.play('crash'); window.SFX && SFX.play('scream');
    console.log('BLOCKBLAST CRASH at block ' + (BB_N - bbLeft() + 1) + ' t=' + BB.runT.toFixed(1));
    const api = GAMES.blockblast.api; api && api.died && api.died();
    return;
  }
  if (BB.u >= BB_FIN) {
    BB.fin = 0.0001; BB.danger = false;
    for (let k = 0; k < 90; k++) BB.confetti.push({ x: Math.random() * W, y: -Math.random() * 400, vy: 140 + Math.random() * 200, vx: (Math.random() - .5) * 80, rot: Math.random() * 6, vr: (Math.random() - .5) * 8, col: BB_COLS[k % 7], s: 14 + Math.random() * 14 });
    window.SFX && SFX.play('honk'); setTimeout(() => window.SFX && SFX.play('firework'), 350);   // over the line: a honk, then the confetti pops (the win jingle comes from main.js on done())
    console.log('BLOCKBLAST WIN t=' + BB.runT.toFixed(1) + ' pieces=' + BB.placed + ' crashes=' + BB.fails);
  }
}
function bbUpdate(dt) {
  if (BB.freeze > 0) { BB.freeze -= dt; dt = 0; }   // hit-stop: everything (bot timers too) waits, drawing carries on
  BB.t += dt;
  if (BB.card > 0) { BB.cardAge += dt; BB.card -= dt; if (BB.card <= 0) { BB.card = 0.001; bbStart(); } }
  if (BB.kbBad > 0) BB.kbBad -= dt;
  if (BB.shake > 0) BB.shake = Math.max(0, BB.shake - dt);
  if (BB.sayT > 0) BB.sayT -= dt;
  BB.jet *= Math.pow(0.02, dt);
  if (BB.dealT > 0 && BB.dealT < 1) BB.dealT = Math.min(1, BB.dealT + dt / 0.5);
  if (BB.dealGap > 0) { BB.dealGap -= dt; if (BB.dealGap <= 0 && !BB.crash && !BB.fin) { bbDeal(); BB.dealGap = 0; bbCheckStuck(); } }
  if (BB.drag) { BB.drag.g = Math.min(1, BB.drag.g + dt / 0.12); BB.drag.a = (BB.drag.a || 0) + dt; }
  if (BB.ret) { BB.ret.t += dt / 0.2; if (BB.ret.t >= 1) BB.ret = null; }
  for (const k in BB.pop) { BB.pop[k] += dt; if (BB.pop[k] > 0.25) delete BB.pop[k]; }
  for (const f of BB.fx) {
    f.t += dt;
    if (f.t > 0.1 && !f.popped) {
      f.popped = true;
      const x = BB.bx + (f.c + .5) * BB.cs, y = BB.by + (f.r + .5) * BB.cs;
      for (let k = 0; k < 3; k++) { const a = Math.random() * 6.28, v = 120 + Math.random() * 260; BB.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, rot: Math.random() * 6, vr: (Math.random() - .5) * 12, s: BB.cs * (0.16 + Math.random() * 0.14), col: BB_COLS[f.col - 1], life: 0.75 }); }
    }
  }
  BB.fx = BB.fx.filter(f => f.t < 0.46);
  for (const p of BB.parts) { p.life -= dt; p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; }
  BB.parts = BB.parts.filter(p => p.life > 0);
  for (const p of BB.pops) p.t += dt;
  BB.pops = BB.pops.filter(p => p.t < 1.1);
  for (const q of BB.puffs) { q.t += dt; q.r += dt * 14; q.y -= dt * 12; }
  BB.puffs = BB.puffs.filter(q => q.t < 0.9);
  for (const b of BB.rb) if (b.wob > 0) b.wob = Math.max(0, b.wob - dt * 1.5);
  // zaps: BB_ZAP s from the cleared line to the roadblock, then the block launches off the bridge
  for (const z of BB.zaps) {
    z.t += dt;
    if (z.t >= BB_ZAP && !z.done) {
      z.done = true; z.b.flown = true;
      const p = bbPath(z.b.u, BB_RC), dir = BB.fly.length % 2 ? -1 : 1;
      BB.fly.push({ b: z.b, x: p.x, y: p.y, rot: p.a, vx: dir * (70 + Math.random() * 120), vy: -330 - Math.random() * 90, vr: dir * (5 + Math.random() * 4), wy: BB.g.E + 22 + Math.random() * (BB.g.SB - BB.g.E - 30) });
      window.SFX && SFX.play('whoosh', { p: 1.2 });
    }
  }
  BB.zaps = BB.zaps.filter(z => z.t < BB_ZAP + 0.15);
  for (const f of BB.fly) {
    f.vy += 1000 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt;
    if (f.vy > 0 && f.y > f.wy) { f.sunk = true; BB.splash.push({ x: f.x, y: f.wy, t: 0 }); window.SFX && SFX.play('splash'); }
  }
  BB.fly = BB.fly.filter(f => !f.sunk);
  for (const s of BB.splash) s.t += dt;
  BB.splash = BB.splash.filter(s => s.t < 0.8);
  for (const c of BB.confetti) { c.x += c.vx * dt; c.y += c.vy * dt; c.rot += c.vr * dt; if (c.y > H + 30) c.y = -20; }
  if (window.AUTO) bbBotUpdate(dt);
  bbCar(dt);
  // keyboard players: keep a piece selected so arrows always move something
  if (BB.kbUsed && !BB.kb && !BB.drag && !bbLocked() && !(BB.dealT > 0 && BB.dealT < 0.4)) { const i = BB.hand.findIndex(Boolean); if (i >= 0) bbKbSelect(i); }
}

// ---- the dashcam: Nailong at the wheel, big enough to read his face ----
function bbDashcam(t) {
  const x = BB.dx, y = BB.by - 12, w = BB.dw, h = BB.bw + 24, ch = Math.round(h * 0.66);
  ctx.fillStyle = 'rgba(0,0,0,.28)'; rr(x + 4, y + 8, w, h, 22); ctx.fill();
  rr(x, y, w, h, 22); ctx.fillStyle = '#2a2058'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.line; ctx.stroke();
  // the camera view
  const vx = x + 10, vy = y + 10, vw = w - 20, vh = ch - 14;
  ctx.save(); rr(vx, vy, vw, vh, 14); ctx.clip();
  ctx.fillStyle = '#9fd3f5'; ctx.fillRect(vx, vy, vw, vh);   // rear window: sky going past
  for (let i = 0; i < 3; i++) { const lx = vx + ((i * 97 - BB.u * 2600) % (vw + 60) + vw + 60) % (vw + 60) - 30; ctx.fillStyle = '#c9c3b4'; ctx.fillRect(lx, vy, 6, vh * 0.42); }
  ctx.fillStyle = '#3d4a5c'; ctx.fillRect(vx, vy + vh * 0.38, vw, vh);
  ctx.fillStyle = '#59627a'; rr(vx + vw / 2 - 52, vy + vh * 0.22, 104, vh, 26); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.stroke();
  const scared = BB.danger || BB.stuck, s = vh / 205, nx = vx + vw / 2, ny = vy + vh + 30 * s;
  const shake = scared ? Math.sin(BB.t * 50) * 3 : 0, hop = BB.fin ? Math.abs(Math.sin(BB.t * 9)) * 10 : 0;
  const rot = BB.crash ? Math.sin(BB.crash * 18) * 0.25 * Math.exp(-BB.crash * 2) : scared ? Math.sin(BB.t * 30) * 0.05 : Math.sin(BB.t * 2) * 0.03;
  nailong(nx + shake, ny - hop, s, { arms: scared || BB.fin || BB.crash ? 'up' : 'down', flail: BB.t * (scared ? 26 : 12), mouth: BB.crash ? 'o' : scared || BB.fin || BB.v > BB_V0 * 1.7 ? 'open' : 'smile', look: BB.crash ? [0, 1] : scared ? [0.2, -0.8] : [0, -0.2], rot });
  // the steering wheel in front of his belly
  const wy = ny - 66 * s;
  ctx.strokeStyle = '#17181d'; ctx.lineWidth = 10 * s; ell(nx + shake, wy, 46 * s, 40 * s); ctx.stroke();
  ctx.lineWidth = 7 * s; ctx.beginPath(); ctx.moveTo(nx + shake - 44 * s, wy); ctx.lineTo(nx + shake + 44 * s, wy); ctx.moveTo(nx + shake, wy); ctx.lineTo(nx + shake, wy + 38 * s); ctx.stroke();
  ell(nx + shake, wy, 11 * s, 11 * s); ctx.fillStyle = '#2a2b31'; ctx.fill();
  if (scared) fxMark('sweat', nx + 58 * s, ny - 180 * s, (BB.t * 1.4) % 1, 0.8);
  if (BB.crash) for (let i = 0; i < 3; i++) { const a = BB.crash * 6 + i * 2.09; ell(nx + Math.cos(a) * 60 * s, ny - 190 * s + Math.sin(a) * 14 * s, 7, 7); ctx.fillStyle = '#ffe14d'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.line; ctx.stroke(); }
  ctx.restore();
  rr(vx, vy, vw, vh, 14); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
  // REC
  ell(vx + 16, vy + 16, 6, 6); ctx.fillStyle = (BB.t % 1) < 0.6 ? '#ff3b3b' : 'rgba(255,59,59,.3)'; ctx.fill();
  font(14, 700); ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(LINES_BB.cam, vx + 28, vy + 17);
  // how many blocks are still on the road
  const left = bbLeft(), cy = y + ch + (h - ch) / 2;
  font(15, 700); ctx.fillStyle = '#ffe9a0'; ctx.textAlign = 'center'; ctx.fillText(LINES_BB.left, x + w / 2, cy - 30);
  const pulse = BB.zaps.length ? 1.2 : 1;
  title(String(left), x + w / 2, cy + 14, 52 * pulse, left ? '#fff' : C.y);
  // Nailong's line, from the dashcam (only one at a time)
  let txt = '', size = 26;
  if (BB.crash) txt = BB.crashTxt;
  else if (BB.fin) txt = LINES_BB.win;
  else if (BB.stuck) txt = LINES_BB.stuck;
  else if (BB.sayT > 0 && BB.say && (!BB.danger || LINES_BB.phew.includes(BB.say))) txt = BB.say;
  else if (BB.danger) { txt = BB.dangerTxt; size = 30; }
  else if (BB.sayT > 0) txt = BB.say;
  if (txt && !(GAMES.blockblast.api && GAMES.blockblast.api.replay)) bubble(txt, nx + 18, vy + 26, size, 300);   // replays from the menu have no dialogue
}

// ---- the instruction card: what to do and which keys, in a few big words ----
function bbCardDraw() {
  const k = clamp(BB.cardAge / 0.25, 0, 1);
  ctx.fillStyle = `rgba(29,22,64,${0.9 * k})`; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = k;
  const s0 = fxBack(BB.cardAge / 0.35);
  ctx.save(); ctx.translate(W / 2, H * 0.15); ctx.scale(s0, s0); title(LINES_BB.cardTitle, 0, 0, 72); ctx.restore();
  // the picture: a full row of the grid -> a roadblock flies off the bridge
  const cy = H * 0.34, s = 34, rx = W / 2 - 330;
  for (let c = 0; c < 6; c++) bbBlock(rx + c * s, cy - s / 2, s, BB_COLS[[3, 0, 4, 1, 5, 2][c]], 1, 1, 0.15 + 0.12 * Math.sin(BB.t * 8));
  ctx.fillStyle = C.y; ctx.strokeStyle = C.line; ctx.lineWidth = 5; ctx.lineJoin = 'round';
  const ax = W / 2 - 92; ctx.beginPath(); ctx.moveTo(ax, cy - 10); ctx.lineTo(ax + 60, cy - 10); ctx.lineTo(ax + 60, cy - 26); ctx.lineTo(ax + 96, cy); ctx.lineTo(ax + 60, cy + 26); ctx.lineTo(ax + 60, cy + 10); ctx.lineTo(ax, cy + 10); ctx.closePath(); ctx.fill(); ctx.stroke();
  const fy = cy - 14 + Math.sin(BB.t * 3) * 8;
  ctx.fillStyle = '#e4dfd2'; rr(W / 2 + 40, cy + 30, 280, 16, 6); ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = '#4d5059'; ctx.fillRect(W / 2 + 42, cy + 30, 276, 5);
  ctx.save(); ctx.translate(W / 2 + 110, cy + 30); camry(0, 0, 0.2, { driver: true, wheel: BB.t * 4, mouth: 'open' }); ctx.restore();
  ctx.save(); ctx.translate(W / 2 + 230, fy); ctx.rotate(BB.t * 1.5); bbRoadblock({ shape: BB_RSHAPES[0], col: 2 }, 22); ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(W / 2 + 230, fy - 22, 34 + i * 10, Math.PI * 0.95, Math.PI * 1.35); ctx.stroke(); }
  ctx.lineCap = 'butt';
  title(LINES_BB.card1, W / 2, H * 0.5, 38, '#fff');
  title(LINES_BB.card2, W / 2, H * 0.6, 38, '#fff');
  title(LINES_BB.card3, W / 2, H * 0.7, 40, C.y);
  font(24, 600); ctx.fillStyle = '#ffe9a0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(LINES_BB.cardKeys, W / 2, H * 0.8);
  ctx.globalAlpha = k * (0.6 + 0.4 * Math.sin(BB.t * 4));
  font(22, 600); ctx.fillStyle = '#fff'; ctx.fillText(LINES_BB.cardGo, W / 2, H * 0.87);
  ctx.restore();
}

// ---- draw ----
function bbDraw(t, dt) {
  bbGeo(); bbLayout();
  bbUpdate(dt);
  ctx.save();
  if (BB.shake > 0 && !(BB.freeze > 0)) { sky(); ctx.fillStyle = '#4fa9e0'; ctx.fillRect(0, BB.g.HZ, W, H); ctx.translate(...fxShake(BB.shake * 2, 7)); }   // sky and lake under the shake, so its edges never flash the page colour
  bbScene(BB.t);
  const { cs, bx, by, bw } = BB;
  // board panel
  ctx.fillStyle = 'rgba(0,0,0,.28)'; rr(bx - 4, by + 8, bw + 8, bw + 8, 22); ctx.fill();
  rr(bx - 12, by - 12, bw + 24, bw + 24, 22); ctx.fillStyle = '#2a2058'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.line; ctx.stroke();
  // preview data
  let ghost = null, hot = null;
  if (BB.drag && BB.drag.g > 0.5) {
    const p = BB.hand[BB.drag.i], sn = bbSnap(p, BB.drag.x, BB.drag.y);
    if (sn) { ghost = { p, ...sn }; const res = bbApply(BB.board, p, sn.r, sn.c); if (res.lines) hot = { rows: res.rows, cols: res.cols, col: p.col }; }
  } else if (BB.kb && !BB.drag && BB.hand[BB.kb.i]) {
    const p = BB.hand[BB.kb.i], ok = bbFits(BB.board, p, BB.kb.r, BB.kb.c);
    ghost = { p, r: BB.kb.r, c: BB.kb.c, bad: !ok, kb: true };
    if (ok) { const res = bbApply(BB.board, p, BB.kb.r, BB.kb.c); if (res.lines) hot = { rows: res.rows, cols: res.cols, col: p.col }; }
  }
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const x = bx + c * cs, y = by + r * cs;
    rr(x + 2, y + 2, cs - 4, cs - 4, cs * 0.18); ctx.fillStyle = (r + c) % 2 ? '#3a2f78' : '#352b70'; ctx.fill();
    const v = BB.board[r * 8 + c];
    if (v) {
      const k = r + ',' + c, pp = BB.pop[k];
      const pop = pp !== undefined ? 1 + 0.22 * Math.sin(clamp(pp / 0.2, 0, 1) * Math.PI) : 1;
      // a line about to clear takes the held piece's colour (the Block Blast tell), with a soft pulse
      const lit = hot && (hot.rows.includes(r) || hot.cols.includes(c));
      bbBlock(x, y, cs, BB_COLS[(lit ? hot.col : v) - 1], 1, pop, lit ? 0.14 + 0.12 * Math.sin(BB.t * 18) : 0);
    }
  }
  if (hot) {   // empty cells of the lines that would clear glow too
    ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = BB_COLS[hot.col - 1];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (!BB.board[r * 8 + c] && (hot.rows.includes(r) || hot.cols.includes(c))) { rr(bx + c * cs + 2, by + r * cs + 2, cs - 4, cs - 4, cs * 0.18); ctx.fill(); }
    ctx.restore();
  }
  if (ghost) for (const [pr, pc] of ghost.p.cells) {
    const gx = bx + (ghost.c + pc) * cs, gy = by + (ghost.r + pr) * cs;
    bbBlock(gx, gy, cs, BB_COLS[ghost.p.col - 1], ghost.kb ? 0.6 + 0.15 * Math.sin(BB.t * 9) : 0.5);
    if (ghost.bad) { rr(gx + 3, gy + 3, cs - 6, cs - 6, cs * 0.2); ctx.fillStyle = 'rgba(220,40,60,' + (BB.kbBad > 0 ? 0.7 : 0.38) + ')'; ctx.fill(); }
  }
  // clearing cells: the line keeps the placed piece's colour while it bursts (shards keep their own colours)
  for (const f of BB.fx) {
    const x = bx + f.c * cs, y = by + f.r * cs, fc = BB_COLS[(f.flashCol || f.col) - 1];
    if (f.t < 0) bbBlock(x, y, cs, fc);
    else if (f.t < 0.1) bbBlock(x, y, cs, fc, 1, 1 + f.t * 1.5, 0.35);
    else { const u = (f.t - 0.1) / 0.36; ctx.save(); ctx.translate(x + cs / 2, y + cs / 2); ctx.rotate(u * 1.2); ctx.translate(-x - cs / 2, -y - cs / 2); bbBlock(x, y, cs, fc, 1 - u * u, Math.max(0.01, 1.15 - u * 1.15), 0.5 * (1 - u)); ctx.restore(); }
  }
  if (BB.stuck || BB.crash) { ctx.fillStyle = 'rgba(180,30,50,.22)'; rr(bx - 12, by - 12, bw + 24, bw + 24, 22); ctx.fill(); }
  // particles
  for (const p of BB.parts) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = clamp(p.life / 0.4, 0, 1); rr(-p.s, -p.s, p.s * 2, p.s * 2, p.s * 0.4); ctx.fillStyle = p.col; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke(); ctx.restore(); }
  // tray
  rr(BB.tx - 8, by - 12, BB.tw + 16, bw + 24, 22); ctx.fillStyle = 'rgba(42,32,88,.82)'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.line; ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const p = BB.hand[i]; if (!p) continue;
    if (BB.drag && BB.drag.i === i) continue;
    if (BB.ret && BB.ret.i === i) continue;
    const sp = bbSlotPos(i, p);
    if (BB.kb && BB.kb.i === i) { rr(BB.tx + 2, BB.by + i * BB.slotH + 4, BB.tw - 4, BB.slotH - 8, 14); ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.y; ctx.stroke(); }
    const dl = clamp((BB.dealT - i * 0.12) / 0.5, 0, 1), off = (1 - ease(dl)) * 260;
    if (BB.dealT > 0 && dl <= 0) continue;
    bbPiece(p, sp.x + off, sp.y, sp.s);
  }
  bbDashcam(BB.t);
  // zaps: a string of sparks from the cleared line up to the roadblock it blasts
  for (const z of BB.zaps) {
    const p = bbPath(z.b.u, BB_RC), tx = p.x, ty = p.y - 20, mx = (z.x + tx) / 2 + 80, my = Math.min(z.y, ty) - 60, k = clamp(z.t / BB_ZAP, 0, 1), fade = 1 - clamp((z.t - BB_ZAP) / 0.15, 0, 1);
    for (let i = 0; i <= 8; i++) {
      const u = (i / 8) * k, x = (1 - u) * (1 - u) * z.x + 2 * u * (1 - u) * mx + u * u * tx, y = (1 - u) * (1 - u) * z.y + 2 * u * (1 - u) * my + u * u * ty;
      ctx.save(); ctx.globalAlpha = fade * (0.45 + 0.55 * i / 8); ell(x, y, 6 + i * 1.3, 6 + i * 1.3); ctx.fillStyle = '#fff6a0'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.line; ctx.stroke(); ctx.restore();
    }
  }
  if (BB.ret) {
    const R = BB.ret, p = BB.hand[R.i]; if (p) {
      const sp = bbSlotPos(R.i, p), u = ease(clamp(R.t, 0, 1));
      const s0 = lerp(R.ss, cs, ease(R.g)), ax = lerp(R.x, sp.x + p.w * sp.s / 2, u), ay = lerp(R.y - 0.9 * cs, sp.y + p.h * sp.s, u), s = lerp(s0, sp.s, u);
      bbPiece(p, ax - p.w * s / 2, ay - p.h * s, s);
    }
  }
  if (BB.drag) {
    // grab pop: swells about 15% past board size, settles on it exactly 0.2 s after the pick-up (jelly)
    const D = BB.drag, p = BB.hand[D.i], u = ease(D.g), s = lerp(D.ss, cs, u) * (1 + 0.16 * Math.sin(clamp((D.a || 0) / 0.2, 0, 1) * Math.PI));
    const tax = D.x, tay = D.y - 0.9 * cs, ax = lerp(D.sx, tax, u), ay = lerp(D.sy, tay, u);
    ctx.save(); ctx.globalAlpha = 0.28; for (const [pr, pc] of p.cells) { rr(ax - p.w * s / 2 + pc * s + 8, ay - p.h * s + pr * s + 14, s, s, s * .22); ctx.fillStyle = '#000'; ctx.fill(); } ctx.restore();
    bbPiece(p, ax - p.w * s / 2, ay - p.h * s, s);
  }
  ctx.restore();
  // floating words on the board
  for (const p of BB.pops) { const u = p.t / 1.1; ctx.save(); ctx.globalAlpha = 1 - clamp((u - 0.6) / 0.4, 0, 1); title(p.txt, p.x, p.y - u * 50, p.size * (1 + 0.25 * Math.sin(clamp(u * 5, 0, 1) * Math.PI)), p.col); ctx.restore(); }
  if (BB.go > 0) { const k = 1 - BB.go / 0.9; ctx.save(); ctx.globalAlpha = 1 - clamp((k - 0.6) / 0.4, 0, 1); ctx.translate(W / 2, BB.g.apex - 50 + 0 * k); const q = fxBack(k / 0.3); ctx.scale(q, q); title(LINES_BB.go, 0, 0, 80); ctx.restore(); }
  if (BB.fin) {
    for (const c of BB.confetti) { ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot); rr(-c.s / 2, -c.s / 2, c.s, c.s, c.s * .3); ctx.fillStyle = c.col; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke(); ctx.restore(); }
    ctx.save(); ctx.translate(BB.bx + BB.bw / 2, BB.by + BB.bw * 0.42); const q = fxBack(BB.fin / 0.3); ctx.scale(q, q); title(LINES_BB.winTitle, 0, 0, Math.min(84, BB.bw / 4.6)); ctx.restore();
  }
  if (BB.card > 0) bbCardDraw();
}

GAMES.blockblast = {
  title: 'NAILONG BLOCK BLAST',
  hint: LINES_BB.hintKeys,
  enter(api) { this.api = api; BB.kbUsed = false; BB.kbPos = null; BB.dangerN = 0; bbGeo(); bbLayout(); bbReset(0, !(api && api.replay)); },   // a replay from the menu: no card
  draw(t, dt) { bbDraw(t, dt); },
  key(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (BB.card > 0) { if (BB.cardAge > 0.35) { e.preventDefault(); bbStart(); } return; }
    if (bbLocked() || BB.bot || BB.drag) return;
    const k = e.key, kl = k.length === 1 ? k.toLowerCase() : k;
    const arrow = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0], a: [0, -1], d: [0, 1], w: [-1, 0], s: [1, 0] }[kl];
    const used = arrow || kl === ' ' || kl === 'Enter' || kl === 'Tab' || kl === 'q' || kl === 'e' || kl === 'Escape' || (kl >= '1' && kl <= '3');
    if (!used) return;
    e.preventDefault();
    BB.kbUsed = true;
    if (kl === 'Escape') { BB.kb = null; BB.kbUsed = false; return; }
    if (kl >= '1' && kl <= '3') { if (bbKbSelect(+kl - 1)) window.SFX && SFX.play('pop', { p: 1.15 }); return; }
    if (kl === 'Tab' || kl === 'q' || kl === 'e') {
      const dir = (kl === 'q' || (kl === 'Tab' && e.shiftKey)) ? -1 : 1, from = BB.kb ? BB.kb.i : (dir > 0 ? -1 : 3);
      for (let n = 1; n <= 3; n++) { const i = (from + dir * n + 9) % 3; if (BB.hand[i]) { bbKbSelect(i); window.SFX && SFX.play('pop', { p: 1.15 }); break; } }
      return;
    }
    if (!BB.kb) { const i = BB.hand.findIndex(Boolean); if (i < 0 || !bbKbSelect(i)) return; if (arrow) return; }
    const kb = BB.kb, p = BB.hand[kb.i];
    if (arrow) { kb.r = clamp(kb.r + arrow[0], 0, 8 - p.h); kb.c = clamp(kb.c + arrow[1], 0, 8 - p.w); BB.kbPos = { r: kb.r, c: kb.c }; window.SFX && SFX.play('tick', { g: 0.5 }); return; }
    if (BB.dealT > 0 && BB.dealT < 0.4) return;
    if (bbFits(BB.board, p, kb.r, kb.c)) { const { i, r, c } = kb; BB.kb = null; BB.kbPos = { r, c }; bbPlace(i, r, c); }
    else { BB.kbBad = 0.25; BB.shake = Math.max(BB.shake, 0.12); window.SFX && SFX.play('tick', { p: 0.5 }); }
  },
  pointer(kind, x, y) {
    if (BB.card > 0) { if (kind === 'down' && BB.cardAge > 0.35) bbStart(); return; }
    if (kind === 'down') { BB.kb = null; BB.kbUsed = false; bbPick(x, y); }
    else if (kind === 'move') { if (BB.drag && !BB.bot) { BB.drag.x = x; BB.drag.y = y; } }
    else if (kind === 'up') { if (BB.drag && !BB.bot) { BB.drag.x = x; BB.drag.y = y; bbRelease(); } }
  },
};
