// ---------- mini-game: CIVIC DASH (a tiny Subway Surfers down the real route through Canberra's city centre) ----------
// Pseudo-3D, three lanes. Arrows or swipes. ONE run, in the real order: the Alinga Street light rail stop between the Sydney
// and Melbourne Buildings on Northbourne Avenue, City Walk and Garema Place, the Canberra Centre and the merry-go-round on
// Petrie Plaza, London Circuit (light rail works), Commonwealth Avenue with Parliament House's flag ahead, then the
// Commonwealth Avenue Bridge over the lake with the Captain Cook Jet. research/runner.md lists the photos behind each piece.
// Score = coins (higher is better). The more coins she holds, the more coin lines turn into bao zi (a speed burst, worth
// 2 coins each), and bao zi eaten back to back stack the speed: a greedy run ends almost all bao zi and very fast, while
// the last stretch spaces the obstacles out so it stays dodgeable. A crash: api.died() once, then the instant restart at the
// last checkpoint (coins kept). Test hooks: ?coins=N starts with N coins (to see the rush); ?level is ignored (one level).
(() => {
"use strict";

const LINES_RUNNER = {
  title: 'CIVIC DASH',
  cardLane: 'change lane',                       // placeholder, Max to edit
  cardJump: 'jump',                              // placeholder, Max to edit
  cardRoll: 'roll',                              // placeholder, Max to edit
  cardSpace: 'space',                            // placeholder, Max to edit (the space bar keycap)
  cardRule: 'coins = more bao zi = faster',      // placeholder, Max to edit
  cardRoute: 'Alinga St to the big bridge',      // placeholder, Max to edit
  cardGo: 'press any key',                       // placeholder, Max to edit
  boost: ['BAO ZI!', 'ZOOM!', 'MORE BAO!', 'NOM NOM!', 'FASTER!'],
  plus: '+2',                                    // placeholder, Max to edit (a bao zi is worth 2 coins)
  checkpoint: ['CHECKPOINT', 'CHECKPOINT. snacks too.'],
  gates: ['CITY WALK', 'CANBERRA CENTRE', 'LONDON CIRCUIT', 'COMMONWEALTH AVE', 'COMMONWEALTH BRIDGE'],   // placeholder, Max to edit (first four)
  finish: 'FINISH',                              // placeholder, Max to edit
  stopSign: 'ALINGA ST',
  zone: {north: 'Northbourne Avenue', walk: 'City Walk', centre: 'Canberra Centre', london: 'London Circuit', avenue: 'Commonwealth Avenue', bridge: 'Commonwealth Avenue Bridge'},   // placeholder, Max to edit
  centre: 'CANBERRA CENTRE',                     // placeholder, Max to edit (the sign over the glass entrance)
  merry: 'MERRY-GO-ROUND',
  jet: 'CAPTAIN COOK JET',
  win: 'The big bridge!',
  win2: 'Nailong is very out of breath.',
  score: 'coins',                                // placeholder, Max to edit (replay finish: "123 coins")
  go: 'Go.',
  fail: {
    tram:    ['That was the light rail. It does not stop for dumplings.', 'The tram has right of way. Always.', 'Ding ding. Too late.'],
    low:     ['Barrier: 1. Nailong: 0.', 'That barrier was knee height. Nailong is not tall.', 'Jump first, regret later.'],
    high:    ['The sign did say mind your head.', 'Roll under! The sign was very clear.', 'Head, meet sign.'],
    bin:     ['Bins do not move. It is their whole thing.', 'Nailong lost a fight with a bin.', 'The bin was there first.'],
    scooter: ['Someone left a scooter on the footpath again.', 'Share scooters belong on the ground. Not this ground.'],
    neuron:  ['Ow. Orange scooter.'],
    beam:    ['Ow. Purple scooter.'],             // placeholder, Max to edit
    planter: ['That tree has been there since the seventies.', 'City Walk planter: undefeated.'],   // placeholder, Max to edit
    car:     ['Beep beep. Nailong is not a car.', 'Stuck in traffic. Literally.'],   // placeholder, Max to edit
  },
  signsR: ['CANBERRA CENTRE', 'BAO HOUSE', 'CITY WALK', 'PHONE REPAIR', 'NOODLES', 'GAREMA PLACE', 'LIGHT RAIL'],
  signsL: ['COFFEE', 'DUMPLINGS', 'BOOKS', 'MERRY-GO-ROUND', 'BUBBLE TEA', 'CIVIC', 'ICE CREAM'],
  stop: 'MIND YOUR HEAD',
  dest: 'GUNGAHLIN',
  works: 'LIGHT RAIL TO WODEN',                  // placeholder, Max to edit (the works fence on London Circuit, as on the real hoardings)
};

// ---- the route: zones in the real order, a checkpoint at the start of each ----
const ZONES = [
  {k: 'north',  s1: 300},    // Alinga St stop, Sydney + Melbourne Buildings, Northbourne office towers, the tram
  {k: 'walk',   s1: 640},    // City Walk + Garema Place: plane trees, pink paving, shops, Garema Court
  {k: 'centre', s1: 920},    // Canberra Centre (glass gable entrance) on the right, Petrie Plaza merry-go-round on the left
  {k: 'london', s1: 1180},   // London Circuit: open road, gums, the light rail works
  {k: 'avenue', s1: 1400},   // Commonwealth Avenue: hedges, Parliament House flag ahead (the rush starts)
  {k: 'bridge', s1: 1e9},    // Commonwealth Avenue Bridge over Lake Burley Griffin, the Captain Cook Jet on the left
];
const zoneAt = s => { for (const z of ZONES) if (s < z.s1) return z.k; return 'bridge'; };
const D = 1660, CPS = [0, 300, 640, 920, 1180, 1400], BRIDGE0 = 1400, RUSH0 = 1180;

// ---- world constants ----
const LANE = 1.55, NEAR = 0.5, PZ = 3.2, FAR = 105;
const PH = 1.1, PH_ROLL = 0.55, JUMP_V = 10.0, GRAV = 27.8, ROLL_T = 0.55, BOOST_T = 2.2;
const WALL_X = 4.3, ROAD_X = 2.6;
const BASE = 11.5, GAIN = 5.0;                // base speed 11.5 -> 16.5 units/s over the run
const BAO_V = 0.45, HEAT_V = 0.075, HEAT_MAX = 6;   // a bao zi: +45% speed for 2.2 s; each one eaten while boosted stacks +7.5%
const CARD_MAX = 6, DEAD_T = 1.0, INV_T = 1.6;
const R = {};
const RC = {hy: 200, f: 370, camH: 3.2, cx: 640, camx: 0};
let WORLD = null, swipe = null, doneCalled = false, hookUsed = false, startCoins = 0;

function rng(seed){ let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hsh(a, b){ let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return (h ^ (h >>> 16)) >>> 0; }

// ---- build the track once (same every run, so a restart is fair) ----
function build(){
  const rnd = rng(1813);
  const obs = [], coins = [], baos = [], birds = [], gaps = [], lines = [];
  const JUMPS = ['low', 'bin', 'scooter'];
  const pick = a => a[Math.floor(rnd()*a.length)];
  const lanes = [-1, 0, 1];
  const mk = (k, lane, s, len) => {
    const o = {k, lane, s, len: len || 0.5, x: lane*LANE, hw: 0.7, y0: 0, y1: 0.7};
    if (k === 'low') { o.len = 0.45; o.y1 = 0.7; }
    if (k === 'bin') { o.len = 0.8; o.hw = 0.45; o.y1 = 1.0; }
    if (k === 'scooter') { o.len = 0.6; o.hw = 0.55; o.y1 = 0.95; o.brand = rnd() < 0.5 ? 'neuron' : 'beam'; o.dir = rnd() < 0.5 ? 1 : -1; }
    if (k === 'high') { o.len = 0.5; o.y0 = 0.85; o.y1 = 1.6; }
    if (k === 'tram') { o.hw = 0.72; o.y0 = 0.1; o.y1 = 2.5; }
    if (k === 'planter') { o.hw = 0.66; o.y1 = 2.6; }
    if (k === 'car') { o.hw = 0.7; o.y1 = 1.5; o.len = 4.2; o.col = Math.floor(rnd()*4); }
    obs.push(o); return o;
  };
  const blockerOf = s => { const z = zoneAt(s); return z === 'north' ? 'tram' : (z === 'walk' || z === 'centre') ? 'planter' : 'car'; };
  const blockLen = k => k === 'tram' ? 8 + Math.floor(rnd()*5) : k === 'planter' ? 6 + Math.floor(rnd()*3) : 4.2;
  const gapLine = (a, b, lane) => { const ln = {lane, a, b, coins: [], dec: false}; for (let c = a; c <= b; c += 1.6) { const co = {lane, s: c, y: 0.6, got: false}; coins.push(co); ln.coins.push(co); } if (ln.coins.length) lines.push(ln); };
  let s = 42, row = 0;
  while (s < D - 40) {
    for (const cp of CPS) if (s > cp - 6 && s < cp + 20) s = cp + 20;
    if (s >= D - 40) break;
    const prog = s / D, rush = s >= RUSH0;
    const free = pick(lanes), others = lanes.filter(l => l !== free);
    const roll = rnd(), bk = blockerOf(s);
    let len = 1;
    if (row % 5 === 4) {   // a breather: only coins
      const L = rush ? 26 : 18;
      gaps.push([s, s + L]); gapLine(s + 2, s + L - 3, pick(lanes));
      s += L + 2; row++; continue;
    }
    if (s < 90) {
      const k = roll < 0.25 ? 'high' : pick(JUMPS); mk(k, pick(lanes), s);
    } else if (rush) {   // the rush: simple rows only, far apart, so the top speed stays fair
      if (roll < 0.36) { mk('car', pick(lanes), s); len = 4.2; }
      else if (roll < 0.62) { const k = pick(JUMPS); mk(k, others[0], s); mk(k, others[1], s); }
      else if (roll < 0.78) mk('low', 0, s), mk('low', -1, s), mk('low', 1, s);
      else if (roll < 0.86) mk('high', pick(lanes), s);
      else mk(pick(JUMPS), pick(lanes), s);
    } else if (roll < 0.28) {
      const k = pick(JUMPS); mk(k, others[0], s); mk(k, others[1], s);
    } else if (roll < 0.50) {
      const tl = blockLen(bk), tlane = pick(lanes); mk(bk, tlane, s, tl); len = tl;
      if (prog > 0.2 && rnd() < 0.5) mk(pick(JUMPS), pick(lanes.filter(l => l !== tlane)), s + 1 + rnd()*3);
    } else if (roll < 0.62 && prog > 0.12) {
      const a = blockLen(bk), b = blockLen(bk); mk(bk, others[0], s, a); mk(bk, others[1], s + 5, b); len = Math.max(a, b + 5);
    } else if (roll < 0.74 && prog > 0.1) {
      const k = rnd() < 0.5 ? 'low' : 'high'; for (const l of lanes) mk(k, l, s);
    } else if (roll < 0.86) {
      mk('high', pick(lanes), s);
    } else {
      mk(pick(JUMPS), pick(lanes), s);
    }
    const g = rush ? 29 + rnd()*7 : 15 - prog*2.5 + rnd()*5;
    gaps.push([s + len + 2, s + len + g - 2]);
    if (rnd() < (rush ? 0.95 : 0.75)) gapLine(s + len + 3, s + len + g - 3, pick(lanes));
    const last = obs[obs.length - 1];
    if (last && JUMPS.includes(last.k) && rnd() < 0.5 && !obs.some(o => o !== last && o.s === last.s)) {
      for (let i = 0; i < 5; i++) coins.push({lane: last.lane, s: last.s - 3 + i*1.6, y: 0.6 + Math.sin(i/4*Math.PI)*1.1, got: false});
    }
    s += len + g; row++;
  }
  // three fixed bao zi teach the idea (the first in the middle lane, early); the rest grow out of the coins (see convert)
  for (const m of [26, 160, 470]) {
    let best = null;
    for (const g of gaps) { if (g[1] - g[0] < 5) continue; const d = Math.abs((g[0] + g[1])/2 - m); if (!best || d < best.d) best = {d, g}; }
    baos.push({lane: m < 40 ? 0 : pick(lanes), s: m < 40 ? 26 : best ? (best.g[0] + best.g[1])/2 : m, got: false});
  }
  // the coin lines a bao zi would sit on top of are taken out
  for (const ln of lines) ln.coins = ln.coins.filter(c => !baos.some(b => b.lane === c.lane && Math.abs(b.s - c.s) < 1.2));
  // pigeons on Northbourne, City Walk and Petrie Plaza
  for (let i = 0; i < 30; i++) birds.push({s: 36 + i*29 + rnd()*10, x: (rnd()*2 - 1)*2.2, n: 3 + Math.floor(rnd()*3), seed: rnd()*100, fly: 0});
  obs.sort((a, b) => a.s - b.s); lines.sort((a, b) => a.a - b.a);
  return {obs, coins, baos, birds, lines};
}

// how likely a coin line still out of sight becomes bao zi: grows with her coins, and much more in the rush
function baoP(s){
  const c = R.coins;
  return s >= RUSH0 ? clamp(0.2 + c/170, 0, 0.94) : clamp((c - 12)/230, 0, 0.55);
}
function convert(ln){
  ln.bao = true;
  ln.coins.forEach((c, i) => { c.hide = true; if (i % 2 === 0) WORLD.baos.push({lane: c.lane, s: c.s, got: false, dyn: true}); });
}

// ---- state ----
// fromCp: restart at the last checkpoint (coins and decided bao zi kept)
function reset(fromCp){
  const keep = fromCp ? {crashes: R.crashes, coins: R.coins, time: R.time, cp: R.cp, nbao: R.nbao, lastMsg: R.lastMsg, msg: R.msg, msgT: R.msgT, card: 0}
    : {crashes: 0, coins: startCoins, time: 0, cp: 0, nbao: 0, lastMsg: '', msg: '', msgT: 0, card: (GAMES.runner.api && GAMES.runner.api.replay) ? 0 : CARD_MAX};
  for (const k of Object.keys(R)) delete R[k];
  Object.assign(R, {
    pos: CPS[keep.cp], speed: BASE, boostT: 0, boostV: 0, heat: 0, lane: 0, px: 0, py: 0, vy: 0, rollT: 0, inv: fromCp ? INV_T : 0,
    dead: -1, finish: -1, banner: null, pops: [], landT: 0, landPuffs: [], hit: 0, coinBump: 0, sparks: [], chain: 0, coinAt: -9, again: !!fromCp,
    shake: 0, mouth: 0, flash: 0, deadDir: 1, cardT: 0, heard: new Set(),
  }, keep);
  if (WORLD) {
    if (!fromCp) {
      for (const c of WORLD.coins) { c.got = false; c.hide = false; }
      WORLD.baos = WORLD.baos.filter(b => !b.dyn); for (const b of WORLD.baos) b.got = false;
      for (const ln of WORLD.lines) { ln.dec = false; ln.bao = false; }
    }
    for (const b of WORLD.birds) if (b.s > R.pos + 5) b.fly = 0;
  }
}

// ---- projection ----
const PJ = (x, y, z) => { const k = RC.f / z; return [RC.cx + (x - RC.camx)*k, RC.hy + (RC.camH - y)*k]; };
function poly(pts, fill, stroke, lw){
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.lineJoin = 'round'; ctx.stroke(); }
}
// a quad on a wall plane x = const between z-range and y-range
function wallQuad(x, za, zb, y0, y1, fill, stroke, lw){
  za = Math.max(za, NEAR); if (zb <= za) return;
  poly([PJ(x, y0, za), PJ(x, y0, zb), PJ(x, y1, zb), PJ(x, y1, za)], fill, stroke, lw);
}
function floorQuad(xa, xb, za, zb, fill){ if (zb <= za) return; poly([PJ(xa, 0, za), PJ(xb, 0, za), PJ(xb, 0, zb), PJ(xa, 0, zb)], fill); }
// draw in a local box (w x h units, y down) mapped onto a plane given by 3 screen points
function plane(p0, pu, pv, w, h, fn){
  ctx.save(); ctx.transform((pu[0]-p0[0])/w, (pu[1]-p0[1])/w, (pv[0]-p0[0])/h, (pv[1]-p0[1])/h, p0[0], p0[1]); fn(); ctx.restore();
}
// a stretch of a wall (side, from z to z + len, y0..y1) as a flat picture: local box (len*100 x (y1-y0)*100), x runs along the
// street as she sees it (far to near on the right, near to far on the left), y down from the top
function facade(side, x, za, zb, y0, y1, fn){
  if (zb <= NEAR + 0.05) return; za = Math.max(za, NEAR + 0.05);
  const p0 = side > 0 ? PJ(x, y1, zb) : PJ(x, y1, za), pu = side > 0 ? PJ(x, y1, za) : PJ(x, y1, zb), pv = side > 0 ? PJ(x, y0, zb) : PJ(x, y0, za);
  plane(p0, pu, pv, (zb - za)*100, (y1 - y0)*100, () => fn((zb - za)*100, (y1 - y0)*100));
}
function fitText(text, w, h, col, maxPx){
  let px = maxPx || h*0.7; font(px, 700); const tw = ctx.measureText(text).width; if (tw > w*0.92) px *= w*0.92/tw; font(px, 700);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(text, w/2, h/2 + px*0.04);
}

// a lane-aligned box. col = {front, side, top}. returns front rect (or null)
function box(xa, xb, y0, y1, za, zb, col, lw){
  if (zb <= NEAR) return null;
  const zf = Math.max(za, NEAR), cxm = RC.camx, line = C.line; lw = lw || 3;
  if (xb < cxm) poly([PJ(xb, y0, zf), PJ(xb, y0, zb), PJ(xb, y1, zb), PJ(xb, y1, zf)], col.side, line, lw);
  else if (xa > cxm) poly([PJ(xa, y0, zf), PJ(xa, y0, zb), PJ(xa, y1, zb), PJ(xa, y1, zf)], col.side, line, lw);
  if (y1 < RC.camH) poly([PJ(xa, y1, zf), PJ(xb, y1, zf), PJ(xb, y1, zb), PJ(xa, y1, zb)], col.top, line, lw);
  if (za >= NEAR) {
    const a = PJ(xa, y0, za), b = PJ(xb, y0, za), d = PJ(xa, y1, za);
    ctx.beginPath(); ctx.rect(a[0], d[1], b[0]-a[0], a[1]-d[1]); ctx.fillStyle = col.front; ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke();
    return {x: a[0], y: d[1], w: b[0]-a[0], h: a[1]-d[1]};
  }
  return null;
}
const BX = (f, s, t) => ({front: f, side: s, top: t});

// a Canberra share e-scooter as a flat cut-out standing across the lane (story-canberra.js draws it; a plain box if missing)
function scooterAt(x, z, brand, dir, lenM){
  if (z <= NEAR) return;
  const [sx, sy] = PJ(x, 0, z), k = RC.f/z;
  if (typeof window.eScooter === 'function') { window.eScooter(sx, sy, k*(lenM || 1.0)/86, {brand, dir, parked: true}); return; }
  const c = brand === 'beam' ? '#7d3fd8' : '#ff7a1a'; box(x - 0.5, x + 0.5, 0.05, 0.2, z, z + 0.3, BX(c, c, c), 2);
}

// ---- obstacle drawing ----
const CAR_COL = [BX('#c9ccd2', '#a9adb5', '#dfe2e7'), BX('#f4f1ea', '#d6d2c8', '#fff'), BX('#c8322d', '#a32722', '#de4a44'), BX('#2f5fb3', '#244a8c', '#4677c9')];
function drawObs(o, z){
  const xa = o.x - o.hw, xb = o.x + o.hw, zb = z + o.len;
  if (o.k === 'tram') {   // Canberra's red-and-white CAF Urbos light rail, front on
    const r = box(xa, xb, o.y0, o.y1, z, zb, BX('#d9252b', '#b51d24', '#f4f1ea'), 3);
    const sx = xb < RC.camx ? xb : xa > RC.camx ? xa : null;
    if (sx !== null && zb > NEAR) {
      const zA = Math.max(z, NEAR), n = Math.max(2, Math.floor((zb - zA) / 1.4));
      for (let i = 0; i < n; i++) { const z0 = zA + (zb - zA)*(i + .12)/n, z1 = zA + (zb - zA)*(i + .88)/n; wallQuad(sx, z0, z1, 1.2, 2.0, '#232b3a'); }
      wallQuad(sx, zA, zb, 0.7, 0.95, '#f4f1ea');
    }
    if (r && r.w > 6) {
      ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
      ctx.fillStyle = '#232b3a'; ctx.fillRect(r.x + r.w*0.1, r.y + r.h*0.2, r.w*0.8, r.h*0.34);
      ctx.fillStyle = '#f4f1ea'; ctx.fillRect(r.x, r.y + r.h*0.6, r.w, r.h*0.1);
      for (const hx of [0.22, 0.78]) { ctx.beginPath(); ctx.arc(r.x + r.w*hx, r.y + r.h*0.82, r.w*0.045, 0, 6.3); ctx.fillStyle = '#ffe56b'; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.fillStyle = '#101218'; ctx.fillRect(r.x + r.w*0.25, r.y + r.h*0.06, r.w*0.5, r.h*0.1);
      font(Math.max(5, r.w*0.07), 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffb347'; ctx.fillText(LINES_RUNNER.dest, r.x + r.w*0.5, r.y + r.h*0.112);
      ctx.restore();
    }
  } else if (o.k === 'low') {
    const leg = BX('#6b4423', '#6b4423', '#6b4423');
    box(xa + 0.1, xa + 0.2, 0, 0.14, z + 0.05, zb - 0.05, leg, 2);
    box(xb - 0.2, xb - 0.1, 0, 0.14, z + 0.05, zb - 0.05, leg, 2);
    const r = box(xa, xb, 0.12, o.y1, z, zb, BX('#fff', '#eadfd0', '#fff'), 3);
    if (r && r.w > 4) {
      ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip(); ctx.fillStyle = '#e0372f';
      const sw = r.h*0.9; for (let x = r.x - r.h; x < r.x + r.w; x += sw) { ctx.beginPath(); ctx.moveTo(x, r.y + r.h); ctx.lineTo(x + sw*0.5, r.y + r.h); ctx.lineTo(x + sw*0.5 + r.h*0.6, r.y); ctx.lineTo(x + r.h*0.6, r.y); ctx.closePath(); ctx.fill(); }
      ctx.restore(); ctx.strokeStyle = C.line; ctx.lineWidth = 3; ctx.strokeRect(r.x, r.y, r.w, r.h);
    }
  } else if (o.k === 'high') {
    const grey = BX('#7b8794', '#5f6a76', '#9aa5b1');
    box(xa, xa + 0.14, 0, 1.7, z, z + 0.14, grey, 2);
    box(xb - 0.14, xb, 0, 1.7, z, z + 0.14, grey, 2);
    const r = box(xa, xb, o.y0, o.y1, z, zb, BX('#2f7d4a', '#246139', '#3b9a5a'), 3);
    if (r && r.w > 10) { ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip(); font(Math.min(r.h*0.55, r.w*0.13), 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(LINES_RUNNER.stop, r.x + r.w/2, r.y + r.h/2); ctx.restore(); }
  } else if (o.k === 'bin') {   // ACT street bin: dark green body, red lid
    const r = box(xa, xb, 0, o.y1, z, zb, BX('#2d6b4a', '#235640', '#e0372f'), 3);
    box(xa - 0.04, xb + 0.04, o.y1 - 0.14, o.y1, z - 0.03, zb + 0.03, BX('#e0372f', '#b82a24', '#f25a50'), 2);
    if (r && r.w > 8) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(r.x + r.w*0.25, r.y + r.h*0.35, r.w*0.5, r.h*0.1); }
  } else if (o.k === 'scooter') {   // a real share e-scooter, parked right across the lane
    if (z > NEAR) { const [gx, gy] = PJ(o.x, 0, z + 0.3); ell(gx, gy, 0.55*RC.f/(z + 0.3), 0.08*RC.f/(z + 0.3)); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fill(); }
    scooterAt(o.x, z + 0.3, o.brand, o.dir, 1.2);
  } else if (o.k === 'planter') {   // a City Walk corten planter with shrubs and a plane tree in it
    box(xa, xb, 0, 0.6, z, zb, BX('#9a5130', '#7a3d22', '#5f7f3a'), 3);
    const n = Math.max(2, Math.round(o.len/1.6));
    for (let i = n - 1; i >= 0; i--) { const zz = z + (i + 0.5)*o.len/n; if (zz <= NEAR) continue; const [bx, by] = PJ(o.x + ((i % 2) - 0.5)*0.5, 0.75, zz), k = RC.f/zz;
      ell(bx, by, 0.42*k, 0.3*k); ctx.fillStyle = i % 2 ? '#5d8f3c' : '#6fa646'; ctx.fill(); ctx.lineWidth = Math.max(1.5, 0.04*k); ctx.strokeStyle = C.line; ctx.stroke(); }
    const zt = z + o.len*0.5;
    if (zt > NEAR) {
      box(o.x - 0.14, o.x + 0.14, 0.6, 2.9, zt - 0.14, zt + 0.14, BX('#8d8172', '#74695c', '#9a8e80'), 2);
      const k = RC.f/zt, [cx, cy] = PJ(o.x, 3.35, zt), blobs = [[-0.75, 0.1, 0.8, 0.6], [0.7, 0.05, 0.85, 0.6], [0, -0.45, 0.95, 0.65], [0, 0.3, 1.0, 0.55]];
      ctx.lineWidth = Math.max(1.5, 0.05*k); ctx.strokeStyle = C.line;
      for (const [dx, dy, rx, ry] of blobs) { ell(cx + dx*k, cy + dy*k, rx*k, ry*k); ctx.stroke(); }
      blobs.forEach(([dx, dy, rx, ry], i) => { ell(cx + dx*k, cy + dy*k, rx*k, ry*k); ctx.fillStyle = i % 2 ? '#a9cf3f' : '#bddc58'; ctx.fill(); });
    }
  } else if (o.k === 'car') {   // stopped traffic, seen from behind
    const c = CAR_COL[o.col], dk = BX('#26262b', '#1c1c20', '#333');
    for (const wx of [xa + 0.08, xb - 0.3]) { box(wx, wx + 0.22, 0, 0.32, z + 0.35, z + 0.95, dk, 2); box(wx, wx + 0.22, 0, 0.32, zb - 0.95, zb - 0.35, dk, 2); }
    const r = box(xa, xb, 0.22, 0.9, z, zb, c, 3);
    const rc = box(xa + 0.1, xb - 0.1, 0.9, 1.45, z + 1.0, zb - 1.0, BX('#2c3446', c.side, c.top), 3);
    if (rc && rc.w > 8) { ctx.fillStyle = '#4b5a78'; ctx.fillRect(rc.x + rc.w*0.08, rc.y + rc.h*0.15, rc.w*0.84, rc.h*0.2); }
    if (r && r.w > 8) {
      ctx.lineWidth = 2; ctx.strokeStyle = C.line;
      for (const hx of [0.04, 0.78]) { ctx.fillStyle = '#e8312c'; ctx.fillRect(r.x + r.w*hx, r.y + r.h*0.14, r.w*0.18, r.h*0.2); ctx.strokeRect(r.x + r.w*hx, r.y + r.h*0.14, r.w*0.18, r.h*0.2); }
      ctx.fillStyle = '#fff'; ctx.fillRect(r.x + r.w*0.36, r.y + r.h*0.5, r.w*0.28, r.h*0.22); ctx.strokeRect(r.x + r.w*0.36, r.y + r.h*0.5, r.w*0.28, r.h*0.22);
    }
  }
}

// ---- small things ----
function drawCoin(c, z){
  const [x, y] = PJ(c.lane*LANE, c.y, z), r = 0.24*RC.f/z, sp = Math.abs(Math.cos(R.time*6 + c.s));
  ell(x, y, Math.max(1, r*(0.35 + 0.65*sp)), r); ctx.fillStyle = '#ffd21f'; ctx.fill(); ctx.lineWidth = Math.max(1, r*0.22); ctx.strokeStyle = C.line; ctx.stroke();
  if (sp > 0.5) { ell(x, y, r*0.3*sp, r*0.5); ctx.fillStyle = '#ffec8a'; ctx.fill(); }
}
function drawBao(b, z){
  const bob = Math.sin(R.time*5 + b.s)*0.08, [x, y] = PJ(b.lane*LANE, 0.75 + bob, z), r = 0.42*RC.f/z;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ell(0, r*1.05, r*0.9, r*0.2); ctx.fill();
  ctx.lineWidth = Math.max(1.5, r*0.1); ctx.strokeStyle = C.line; ctx.lineJoin = 'round';
  ell(0, 0, r, r*0.85); ctx.fillStyle = '#fff6e6'; ctx.fill(); ctx.stroke();
  ctx.lineWidth = Math.max(1, r*0.06); ctx.beginPath();
  for (let i = 0; i < 7; i++) { const a = (i-3)*0.33; ctx.moveTo(Math.sin(a)*r*0.12, -r*0.62); ctx.quadraticCurveTo(Math.sin(a)*r*0.6, -r*0.45, Math.sin(a)*r*0.82, -r*0.1); }
  ctx.stroke();
  ell(0, -r*0.62, r*0.1, r*0.07); ctx.fillStyle = '#ffe3b8'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = Math.max(1.5, r*0.09); ctx.lineCap = 'round';
  for (const dx of [-0.35, 0.3]) { ctx.beginPath(); ctx.moveTo(dx*r, -r*1.0); ctx.quadraticCurveTo(dx*r + r*0.2*Math.sin(R.time*4 + dx*9), -r*1.3, dx*r, -r*1.6); ctx.stroke(); }
  ctx.restore();
}
function drawBirds(g, z){
  const fly = g.fly || 0;
  for (let i = 0; i < g.n; i++) {
    const off = (i - (g.n-1)/2)*0.45 + Math.sin(g.seed + i*3)*0.15, hop = fly > 0 ? Math.min(fly, 3) : 0;
    const wx = g.x + off + hop*(off >= 0 ? 1 : -1)*1.4, wy = hop > 0 ? hop*hop*0.5 + hop*0.3 : Math.max(0, Math.sin(R.time*3 + g.seed + i*2))*0.03, wz = z + (i % 2)*0.35;
    if (wz < NEAR) continue;
    const [x, y] = PJ(wx, wy, wz), s = 0.16*RC.f/wz;
    ctx.save(); ctx.translate(x, y); ctx.lineWidth = Math.max(1, s*0.14); ctx.strokeStyle = C.line; ctx.lineJoin = 'round';
    const flap = hop > 0 ? Math.sin(R.time*30 + i) : 0, face = off >= 0 ? 1 : -1;
    ell(0, -s*0.7, s*0.8, s*0.6); ctx.fillStyle = '#9aa3b2'; ctx.fill(); ctx.stroke();
    ell(face*s*0.55, -s*1.35, s*0.34, s*0.34); ctx.fillStyle = '#7e889a'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(face*s*0.85, -s*1.35); ctx.lineTo(face*s*1.25, -s*1.25); ctx.lineTo(face*s*0.85, -s*1.2); ctx.closePath(); ctx.fillStyle = '#ffb02e'; ctx.fill(); ctx.stroke();
    ell(face*s*0.62, -s*1.4, s*0.07, s*0.07); ctx.fillStyle = '#111'; ctx.fill();
    if (hop > 0) { ell(-face*s*0.1, -s*(1.0 + flap*0.6), s*0.7, s*0.22, flap*0.7); ctx.fillStyle = '#b6bdcb'; ctx.fill(); ctx.stroke(); }
    else { ctx.beginPath(); ctx.moveTo(-s*0.2, -s*0.15); ctx.lineTo(-s*0.2, 0); ctx.moveTo(s*0.2, -s*0.15); ctx.lineTo(s*0.2, 0); ctx.stroke(); }
    ctx.restore();
  }
}
// a London plane tree (City Walk's lime-green spring canopy over a grey dappled trunk)
function planeTree(x, z, sc){
  if (z <= NEAR) return;
  const k = RC.f/z*(sc || 1), [bx, by] = PJ(x, 0, z);
  ctx.save(); ctx.translate(bx, by); ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(1.5, 0.05*k); ctx.strokeStyle = C.line;
  ctx.beginPath(); ctx.moveTo(-0.16*k, 0); ctx.lineTo(-0.1*k, -3.2*k); ctx.lineTo(0.1*k, -3.2*k); ctx.lineTo(0.16*k, 0); ctx.closePath(); ctx.fillStyle = '#a49a88'; ctx.fill(); ctx.stroke();
  const blobs = [[-1.1, -3.6, 1.2, 0.9], [1.1, -3.7, 1.25, 0.95], [0, -4.5, 1.4, 1.0], [-0.4, -3.2, 1.0, 0.6], [0.6, -3.15, 0.9, 0.55]];
  for (const [dx, dy, rx, ry] of blobs) { ell(dx*k, dy*k, rx*k, ry*k); ctx.stroke(); }
  blobs.forEach(([dx, dy, rx, ry], i) => { ell(dx*k, dy*k, rx*k, ry*k); ctx.fillStyle = i % 2 ? '#a9cf3f' : '#bddc58'; ctx.fill(); });
  ctx.restore();
}
function drawSideProp(p, z){
  const x = p.side*3.45, k = RC.f/z;
  if (p.kind === 'gum') { const [sx, sy] = PJ(p.side*3.9, 0, z); gum(sx, sy, 5.2*k/270*(p.sc || 1)); }
  else if (p.kind === 'plane') planeTree(p.side*3.75, z, p.sc);
  else if (p.kind === 'bin') box(x - 0.3, x + 0.3, 0, 0.95, z, z + 0.6, BX('#2d6b4a', '#235640', '#e0372f'), 2);
  else if (p.kind === 'scooter') scooterAt(x, z, p.col ? 'neuron' : 'beam', p.side, 0.95);
  else if (p.kind === 'lamp') {   // tall slim street light
    box(x - 0.06, x + 0.06, 0, 4.2, z, z + 0.12, BX('#6b7380', '#555d69', '#8a93a0'), 2);
    if (z + 0.06 > NEAR) { const [lx, ly] = PJ(x - p.side*0.35, 4.25, z + 0.06); ell(lx, ly, 0.3*k, 0.14*k); ctx.fillStyle = '#fff3b0'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.line; ctx.stroke(); }
  } else if (p.kind === 'pole') {   // City Walk's tall dark grey light poles with a flat head
    box(x - 0.07, x + 0.07, 0, 4.6, z, z + 0.14, BX('#4a4f57', '#3b3f46', '#5a5f68'), 2);
    box(x - p.side*0.55, x + 0.07, 4.5, 4.7, z - 0.1, z + 0.24, BX('#4a4f57', '#3b3f46', '#5a5f68'), 2);
  } else if (p.kind === 'corten') box(x - 0.45, x + 0.45, 0, 0.5, z, z + 2.2, BX('#9a5130', '#7a3d22', '#6fa646'), 2);
  else if (p.kind === 'works') {   // the light rail works: orange-and-white water barriers
    const r = box(x - 0.35, x + 0.35, 0, 0.85, z, z + 1.8, BX('#ff7a1a', '#d4600f', '#ffa24d'), 2);
    if (r && r.w > 5) { ctx.fillStyle = '#fff'; ctx.fillRect(r.x, r.y + r.h*0.3, r.w, r.h*0.18); }
  } else if (p.kind === 'hedge') box(x - 0.5, x + 0.5, 0, 0.8, z, z + 4.5, BX('#4f9b45', '#3e7f37', '#5fae52'), 2);
  else if (p.kind === 'post') box(x - 0.08, x + 0.08, 0, 1.0, z, z + 0.16, BX('#d9d3c6', '#b8b2a4', '#eee8da'), 2);
}
const PROPS = {
  north:  ['lamp', 'post', 'bin', 'scooter', 'gum', null, null],
  walk:   ['plane', 'pole', 'bin', 'scooter', 'corten', 'plane', null],
  centre: ['plane', 'pole', 'scooter', 'bin', 'corten', null, null],
  london: ['gum', 'lamp', 'works', 'works', 'scooter', 'gum', null],
  avenue: ['gum', 'lamp', 'hedge', 'gum', 'hedge', null, null],
};

// ---- walls: each zone's real street front, drawn as flat pictures on the wall planes ----
const WALLC = ['#f2d6a2', '#e7a89a', '#a9cfe0', '#cde0b0', '#e9c5dc', '#d9d2c4', '#f0e2a0'];
const AWN = [['#e0372f', '#fff'], ['#2f7d4a', '#fff'], ['#2f5fb3', '#fff'], ['#ff8a1f', '#fff']];
function shopFront(side, j, z0, h){   // City Walk shops: two storeys, glass, a striped awning, a sign
  const x = side*WALL_X, hgt = 4.6 + (h % 4)*0.9, col = WALLC[(h >>> 3) % WALLC.length];
  wallQuad(x, z0, z0 + 10, 0, hgt, col, C.line, 3);
  for (let i = 0; i < 4; i++) {
    const a = z0 + 0.8 + i*2.3, b = a + 1.4;
    if (b <= NEAR) continue;
    wallQuad(x, a, b, 3.5, hgt - 0.7, '#9fd0ea', 'rgba(74,47,12,.6)', 1.5);
    if (hgt > 6.2) wallQuad(x, a, b, hgt - 2.3, hgt - 1.1, '#9fd0ea', 'rgba(74,47,12,.6)', 1.5);
  }
  wallQuad(x, z0 + 0.6, z0 + 9.4, 0.15, 2.4, '#7ec3de', C.line, 2);
  wallQuad(x, z0 + 1.2, z0 + 1.45, 0.15, 2.4, 'rgba(74,47,12,.55)'); wallQuad(x, z0 + 5.0, z0 + 5.25, 0.15, 2.4, 'rgba(74,47,12,.55)');
  const aw = AWN[(h >>> 6) % AWN.length], dep = 1.0;
  for (let i = 0; i < 6; i++) {
    const a = z0 + 0.5 + i*1.5, b = a + 1.5; if (b <= NEAR) continue; const aa = Math.max(a, NEAR);
    poly([PJ(x, 2.85, aa), PJ(x, 2.85, b), PJ(x - side*dep, 2.35, b), PJ(x - side*dep, 2.35, aa)], i % 2 ? aw[1] : aw[0], C.line, 1.5);
  }
  if ((h % 3) !== 0 && z0 > NEAR && z0 < 80) sign(side, x, z0 + 1.2, z0 + 8.8, 3.35, 4.55, (side > 0 ? LINES_RUNNER.signsR : LINES_RUNNER.signsL)[(h >>> 9) % 7], (h >>> 4) & 1, z0);
}
function sign(side, x, zn, zf, y0, y1, name, dark, z0){
  const pa = ctx.globalAlpha; ctx.globalAlpha = pa*clamp((z0 - 1.5)/6, 0, 1);
  facade(side, x - side*0.02, zn, zf, y0, y1, (w, h) => {
    rr(0, 0, w, h, 8); ctx.fillStyle = dark ? '#1d1640' : '#fff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
    fitText(name, w, h, dark ? '#ffd21f' : '#4A2F0C', h*0.62);
  });
  ctx.globalAlpha = pa;
}
// the Sydney Building (east, her left) and the Melbourne Building (west, her right): cream render, a ground-floor arcade of
// round arches, square upper windows, a terracotta tile roof
function arcadeFront(side, z0){
  const x = side*6.3;
  wallQuad(x, z0, z0 + 10, 0, 5.2, '#efe3c6', C.line, 3);
  facade(side, x, z0, z0 + 10, 0, 5.2, (w, h) => {
    ctx.lineWidth = 6; ctx.strokeStyle = C.line; ctx.lineJoin = 'round';
    for (let i = 0; i < 4; i++) {   // arches
      const ax = w*(0.06 + i*0.24), aw = w*0.17, top = h*0.42;
      ctx.beginPath(); ctx.moveTo(ax, h); ctx.lineTo(ax, top + aw/2); ctx.arc(ax + aw/2, top + aw/2, aw/2, Math.PI, 0); ctx.lineTo(ax + aw, h); ctx.closePath(); ctx.fillStyle = '#6b4f37'; ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3f2c1f'; ctx.fillRect(ax + aw*0.15, h*0.78, aw*0.7, h*0.22);
      ctx.fillStyle = '#8fb4c9'; ctx.fillRect(ax + aw*0.2, h*0.12, aw*0.6, h*0.18); ctx.strokeRect(ax + aw*0.2, h*0.12, aw*0.6, h*0.18);
    }
    ctx.fillStyle = '#e2d3b0'; ctx.fillRect(0, h*0.36, w, h*0.03);
  });
  // terracotta roof: a band leaning back over the top
  const za = Math.max(z0, NEAR); if (z0 + 10 > za) poly([PJ(x, 5.2, za), PJ(x, 5.2, z0 + 10), PJ(x + side*0.9, 5.9, z0 + 10), PJ(x + side*0.9, 5.9, za)], '#b5532f', C.line, 3);
}
function towerFront(side, z0, h){   // Northbourne office towers: glass and concrete bands
  const x = side*6.3, hgt = 9 + (h % 3)*1.6, glass = (h >>> 2) & 1;
  wallQuad(x, z0, z0 + 10, 0, hgt, glass ? '#7fa9d6' : '#d9d3c6', C.line, 3);
  facade(side, x, z0, z0 + 10, 0, hgt, (w, hh) => {
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(74,47,12,.55)';
    for (let y = hh - 260; y > 40; y -= 120) { ctx.fillStyle = glass ? '#5f8fc4' : '#7f9bb4'; ctx.fillRect(w*0.04, y - 70, w*0.92, 70); ctx.strokeRect(w*0.04, y - 70, w*0.92, 70); if (glass) { ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(w*0.04, y - 70, w*0.92, 14); } }
    ctx.fillStyle = '#5a5f68'; ctx.fillRect(0, hh - 230, w, 230); ctx.fillStyle = '#9fd0ea'; ctx.fillRect(w*0.08, hh - 200, w*0.84, 190);
    ctx.lineWidth = 6; ctx.strokeStyle = C.line; ctx.strokeRect(w*0.08, hh - 200, w*0.84, 190);
  });
}
function garemaCourt(side, z0){   // Garema Court: a pale cream block with deep-set square windows
  const x = side*WALL_X;
  wallQuad(x, z0, z0 + 10, 0, 8.4, '#efe3c8', C.line, 3);
  facade(side, x, z0, z0 + 10, 0, 8.4, (w, h) => {
    ctx.lineWidth = 5; ctx.strokeStyle = C.line;
    for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) { const wx = w*0.05 + c*w*0.135, wy = 40 + r*120; ctx.fillStyle = '#7f9bb4'; ctx.fillRect(wx, wy, w*0.09, 80); ctx.strokeRect(wx, wy, w*0.09, 80); ctx.fillStyle = 'rgba(74,47,12,.3)'; ctx.fillRect(wx, wy, w*0.09, 14); }
    ctx.fillStyle = '#9fd0ea'; ctx.fillRect(w*0.04, h - 220, w*0.92, 200); ctx.strokeRect(w*0.04, h - 220, w*0.92, 200);
  });
}
// the Canberra Centre: white and grey panels over glass; at the entrance the steel-and-glass gable with the name on a grey band
function centreFront(side, z0, j){
  const x = side*WALL_X, entrance = j === 72;
  wallQuad(x, z0, z0 + 10, 0, 6.4, '#eef0f2', C.line, 3);
  facade(side, x, z0, z0 + 10, 0, entrance ? 8.6 : 6.4, (w, h) => {
    ctx.lineWidth = 5; ctx.strokeStyle = C.line; ctx.lineJoin = 'round';
    if (entrance) {
      ctx.beginPath(); ctx.moveTo(w*0.15, h); ctx.lineTo(w*0.15, h*0.33); ctx.lineTo(w*0.5, h*0.03); ctx.lineTo(w*0.85, h*0.33); ctx.lineTo(w*0.85, h); ctx.closePath(); ctx.fillStyle = '#a9d2e3'; ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#3f6b4a'; ctx.lineWidth = 4;
      for (let i = 1; i < 6; i++) { const xx = w*(0.15 + i*0.7/6); ctx.beginPath(); ctx.moveTo(xx, h); ctx.lineTo(xx, h*0.33 - (0.35 - Math.abs(i/6 - 0.5))*h*0.86 + h*0.0); ctx.stroke(); }
      for (const yy of [0.45, 0.62]) { ctx.beginPath(); ctx.moveTo(w*0.15, h*yy); ctx.lineTo(w*0.85, h*yy); ctx.stroke(); }
      ctx.strokeStyle = C.line; ctx.lineWidth = 5; ctx.fillStyle = '#8b939c'; ctx.fillRect(w*0.12, h*0.7, w*0.76, h*0.09); ctx.strokeRect(w*0.12, h*0.7, w*0.76, h*0.09);
      ctx.save(); ctx.translate(w*0.12, h*0.7); fitText(LINES_RUNNER.centre, w*0.76, h*0.09, '#fff', h*0.06); ctx.restore();
      ctx.fillStyle = '#5c6670'; ctx.fillRect(w*0.4, h*0.82, w*0.2, h*0.18); ctx.strokeRect(w*0.4, h*0.82, w*0.2, h*0.18);
    } else {
      for (let i = 0; i < 3; i++) { ctx.fillStyle = '#c9cfd6'; ctx.fillRect(w*(0.05 + i*0.32), h*0.12, w*0.26, h*0.3); ctx.strokeRect(w*(0.05 + i*0.32), h*0.12, w*0.26, h*0.3); }
      ctx.fillStyle = '#9fd0ea'; ctx.fillRect(w*0.03, h*0.55, w*0.94, h*0.43); ctx.strokeRect(w*0.03, h*0.55, w*0.94, h*0.43);
      ctx.strokeStyle = 'rgba(74,47,12,.5)'; for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(w*0.03 + i*w*0.188, h*0.55); ctx.lineTo(w*0.03 + i*w*0.188, h*0.98); ctx.stroke(); }
    }
  });
}
function lowFront(side, z0, h){   // London Circuit: low offices set back behind the verge
  const x = side*7.6, hgt = 3.6 + (h % 3)*0.8, col = ['#e6dcc8', '#d9c9b0', '#cfd6dc'][(h >>> 3) % 3];
  wallQuad(x, z0, z0 + 10, 0, hgt, col, C.line, 3);
  facade(side, x, z0, z0 + 10, 0, hgt, (w, hh) => { ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(74,47,12,.6)'; for (let y = 50; y < hh - 60; y += 110) { ctx.fillStyle = '#8fb4c9'; ctx.fillRect(w*0.05, y, w*0.9, 60); ctx.strokeRect(w*0.05, y, w*0.9, 60); } });
}
function worksFence(side, z0){   // the light rail to Woden hoarding along London Circuit
  const x = side*3.95, pa = ctx.globalAlpha;
  wallQuad(x, z0, z0 + 10, 0, 1.9, '#2a3b8f', C.line, 3);
  if (z0 > 2 && z0 < 70) { ctx.globalAlpha = pa*clamp((z0 - 2)/6, 0, 1); facade(side, x - side*0.02, z0 + 0.8, z0 + 9.2, 0.35, 1.6, (w, h) => fitText(LINES_RUNNER.works, w, h, '#fff', h*0.5)); ctx.globalAlpha = pa; }
}
function drawWall(side, j){
  const s0 = j*10, z0 = s0 - R.pos + PZ;
  if (z0 + 10 <= NEAR) return;
  const zk = zoneAt(s0 + 5), h = hsh(j, side);
  if (zk === 'north') { if (s0 < 130) arcadeFront(side, z0); else towerFront(side, z0, h); }
  else if (zk === 'walk') { if (side < 0 && s0 >= 480 && s0 < 530) garemaCourt(side, z0); else shopFront(side, j, z0, h); }
  else if (zk === 'centre') { if (side > 0) centreFront(side, z0, j); else if (s0 < 680 || s0 >= 730) shopFront(side, j, z0, h); }
  else if (zk === 'london') { lowFront(side, z0, h); if ((h % 4) !== 0) worksFence(side, z0); }
}

// ---- landmarks standing in the scene ----
// the Alinga Street stop: platform canopies with a dark timber-look underside on slim posts, both sides, and the stop sign
function stopCanopy(side, s){
  const z = s - R.pos + PZ; if (z + 8 <= NEAR) return;
  const x0 = side*2.85, x1 = side*4.4, xa = Math.min(x0, x1), xb = Math.max(x0, x1);
  box(side*3.35 - 0.07, side*3.35 + 0.07, 0, 3.0, z + 3.5, z + 3.65, BX('#3a3d44', '#2c2f35', '#4a4d55'), 2);
  box(xa, xb, 3.0, 3.35, z, z + 8, BX('#4a3122', '#5a3a28', '#3b3f46'), 3);
  if (s === 30 && z > 1.5) {   // the stop name on a blue board on each platform
    const pa = ctx.globalAlpha; ctx.globalAlpha = pa*clamp((z - 1.5)/4, 0, 1);
    box(side*3.6 - 0.05, side*3.6 + 0.05, 0, 1.9, z + 0.42, z + 0.48, BX('#3a3d44', '#2c2f35', '#4a4d55'), 2);
    const r = box(side*3.6 - 1.0, side*3.6 + 1.0, 1.9, 2.6, z + 0.4, z + 0.5, BX('#2b3a7a', '#22306a', '#2b3a7a'), 3);
    if (r && r.w > 10) { ctx.save(); ctx.translate(r.x, r.y); fitText(LINES_RUNNER.stopSign, r.w, r.h, '#fff', r.h*0.62); ctx.restore(); }
    ctx.globalAlpha = pa;
  }
}
// the merry-go-round on Petrie Plaza: grey shutters under a big red swooping tent roof, gold trim and pennants
function merryGoRound(z){
  if (z < NEAR + 0.5) return;
  const k = RC.f/z, [bx, by] = PJ(-8.2, 0, z);
  ctx.save(); ctx.translate(bx, by); ctx.scale(k, k); ctx.lineJoin = 'round'; ctx.lineWidth = 0.08; ctx.strokeStyle = C.line;
  ctx.fillStyle = '#d8d8d4'; rr(-3.4, -2.8, 6.8, 2.8, 0.2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(74,47,12,.3)'; ctx.lineWidth = 0.04; for (let y = -2.6; y < -0.1; y += 0.3) { ctx.beginPath(); ctx.moveTo(-3.3, y); ctx.lineTo(3.3, y); ctx.stroke(); }
  ctx.strokeStyle = C.line; ctx.lineWidth = 0.08;
  ctx.beginPath(); ctx.moveTo(-4.8, -2.7); ctx.quadraticCurveTo(-2.8, -3.6, -0.6, -7.2); ctx.lineTo(0, -8.0); ctx.lineTo(0.6, -7.2); ctx.quadraticCurveTo(2.8, -3.6, 4.8, -2.7); ctx.quadraticCurveTo(2.3, -3.1, 0, -2.9); ctx.quadraticCurveTo(-2.3, -3.1, -4.8, -2.7); ctx.closePath(); ctx.fillStyle = '#d6322f'; ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#f0b82b'; ctx.lineWidth = 0.14; ctx.beginPath(); ctx.moveTo(-4.6, -2.75); ctx.quadraticCurveTo(-2.3, -3.2, 0, -2.98); ctx.quadraticCurveTo(2.3, -3.2, 4.6, -2.75); ctx.stroke();
  for (let i = -3; i <= 3; i++) { const lit = ((i - Math.floor(R.time*6)) % 3 + 3) % 3 === 0; ell(i*1.3, -3.0 + Math.abs(i)*0.05, lit ? 0.17 : 0.12, lit ? 0.17 : 0.12); ctx.fillStyle = lit ? '#ffd25a' : '#c99a2e'; ctx.fill(); }
  ctx.strokeStyle = C.line; ctx.lineWidth = 0.07;
  for (const fx of [-1.7, 1.7]) { ctx.beginPath(); ctx.moveTo(fx, -3.6); ctx.lineTo(fx, -5.3); ctx.stroke(); ctx.save(); ctx.translate(fx, -5.3); ctx.scale(1 + Math.sin(R.time*5 + fx)*0.12, 1); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0.75, 0.2); ctx.lineTo(0, 0.45); ctx.closePath(); ctx.fillStyle = '#ffb347'; ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.restore();
  const px = Math.min(k*0.9, 46); if (px >= 9) { const [sx, sy] = PJ(-8.2, 9.0, z); title(LINES_RUNNER.merry, clamp(sx, 20 + px*3, W - 20), Math.max(sy, 82), px, '#fff7d6'); }
}
// the glass pyramid fountain in front of the Canberra Centre
function pyramidFountain(z){
  if (z < NEAR + 0.5) return;
  const k = RC.f/z*0.42, [bx, by] = PJ(3.55, 0, z);
  ctx.save(); ctx.translate(bx, by); ctx.scale(k, k); ctx.lineJoin = 'round'; ctx.lineWidth = 0.07; ctx.strokeStyle = C.line;
  ell(0, -0.15, 2.4, 0.4); ctx.fillStyle = '#9a9488'; ctx.fill(); ctx.stroke(); ell(0, -0.2, 2.1, 0.3); ctx.fillStyle = '#7ec3de'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-1.4, -0.3); ctx.lineTo(0, -2.9); ctx.lineTo(1.4, -0.3); ctx.closePath(); ctx.fillStyle = 'rgba(200,225,235,.85)'; ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(74,47,12,.45)'; ctx.lineWidth = 0.04; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-1.4 + i*0.7, -0.3); ctx.lineTo(0, -2.9); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-1.4 + i*0.35, -0.3 - i*0.65); ctx.lineTo(1.4 - i*0.35, -0.3 - i*0.65); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 0.06; ctx.beginPath(); ctx.moveTo(0, -2.9); ctx.lineTo(0, -3.25 - 0.1*Math.sin(R.time*8)); ctx.stroke();
  ctx.restore();
}
// the Captain Cook Memorial Jet, out on the lake to her left
function drawJet(z){
  if (z < NEAR + 1) return;
  const k = RC.f/z, [bx, by] = PJ(-26, 0, z), n = 16;
  ctx.save(); ctx.translate(bx, by); ctx.scale(k, k); ctx.lineJoin = 'round'; ctx.lineWidth = 0.1; ctx.strokeStyle = '#2d7fb0';
  ell(0, 0, 3.4, 0.7); ctx.fillStyle = '#e8f8ff'; ctx.fill(); ctx.stroke();
  for (let i = n - 1; i >= 0; i--) {
    const u = i/(n - 1), sw = Math.sin(R.time*5 + i*0.7)*0.18*u, r = 0.85 - 0.5*u + 0.08*Math.sin(R.time*7 + i);
    ell(sw, -0.6 - i*1.35, r, 0.95); ctx.fillStyle = i % 2 ? '#ffffff' : '#dff3ff'; ctx.fill(); ctx.stroke();
  }
  ctx.restore();
  const px = Math.min(k*1.3, 52); if (px >= 9) { const [sx, sy] = PJ(-26, 24, z); title(LINES_RUNNER.jet, clamp(sx, 20 + px*4, W - 20), Math.max(sy, 82), px, '#fff7d6'); }
}
// the arch for checkpoints and the finish
function drawArch(s, text, col){
  const z = s - R.pos + PZ; if (z < 0.6 || z > FAR) return;
  const grey = BX('#7b8794', '#5f6a76', '#9aa5b1');
  box(-ROAD_X - 0.3, -ROAD_X + 0.1, 0, 3.4, z, z + 0.3, grey, 2);
  box(ROAD_X - 0.1, ROAD_X + 0.3, 0, 3.4, z, z + 0.3, grey, 2);
  const r = box(-ROAD_X - 0.3, ROAD_X + 0.3, 3.4, 4.5, z, z + 0.3, BX(col, col, col), 3);
  if (r && r.w > 20) { ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip(); font(Math.min(r.h*0.6, r.w*0.075), 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(text, r.x + r.w/2, r.y + r.h/2); ctx.restore(); }
}
function drawRail(side, k){   // the bridge's white rail on slim posts
  const z = k*5 - R.pos + PZ; if (z + 5 <= NEAR) return;
  const x = side*3.15;
  wallQuad(x, z, z + 5.05, 0.8, 1.0, '#e8e2d4', C.line, 2);
  box(x - 0.1, x + 0.1, 0, 1.05, z, z + 0.2, BX('#d9d3c6', '#b8b2a4', '#eee8da'), 2);
}

// ---- sky, horizon, ground ----
function drawSky(){
  const g = ctx.createLinearGradient(0, 0, 0, RC.hy + 4); g.addColorStop(0, '#6fbfff'); g.addColorStop(1, '#e4f5ff');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, RC.hy + 6);
  const par = RC.camx*6, drift = R.time*4, open = clamp((R.pos - 900)/200, 0, 1);
  cloud(((W*0.12 + drift*0.6) % (W + 300)) - 100, RC.hy*0.4, 0.9);
  cloud(((W*0.55 + drift*0.4) % (W + 300)) - 100, RC.hy*0.28, 0.7);
  cloud(((W*0.85 + drift*0.5) % (W + 300)) - 100, RC.hy*0.52, 0.6);
  // Black Mountain and its tower, to the west (her right) all the way down
  const tx = W*0.8 - par*0.3;
  ctx.fillStyle = '#8fb59a'; ctx.beginPath(); ctx.ellipse(tx, RC.hy + 6, 340, 74, 0, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = C.line; ctx.lineWidth = 3;
  ctx.fillStyle = '#e8e2d4'; ctx.beginPath(); ctx.moveTo(tx - 6, RC.hy - 60); ctx.lineTo(tx + 6, RC.hy - 60); ctx.lineTo(tx + 3, RC.hy - 170); ctx.lineTo(tx - 3, RC.hy - 170); ctx.closePath(); ctx.fill(); ctx.stroke();
  ell(tx, RC.hy - 128, 17, 8); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(tx, RC.hy - 170); ctx.lineTo(tx, RC.hy - 215); ctx.stroke();
  // Capital Hill straight ahead at the end of Commonwealth Avenue, with Parliament House's four-legged flagpole
  if (open > 0) {
    const cx = W/2 - par*0.2, pa = ctx.globalAlpha; ctx.globalAlpha = pa*open;
    ctx.fillStyle = '#9cc79a'; ctx.beginPath(); ctx.ellipse(cx, RC.hy + 6, 300, 46, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#efe6cf'; ctx.fillRect(cx - 120, RC.hy - 24, 240, 26); ctx.strokeRect(cx - 120, RC.hy - 24, 240, 26);
    ctx.fillStyle = '#7fc06a'; ctx.beginPath(); ctx.moveTo(cx - 190, RC.hy + 2); ctx.lineTo(cx - 120, RC.hy - 24); ctx.lineTo(cx - 120, RC.hy + 2); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx + 190, RC.hy + 2); ctx.lineTo(cx + 120, RC.hy - 24); ctx.lineTo(cx + 120, RC.hy + 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#c9ccd2'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - 34, RC.hy - 22); ctx.lineTo(cx - 4, RC.hy - 92); ctx.moveTo(cx + 34, RC.hy - 22); ctx.lineTo(cx + 4, RC.hy - 92); ctx.moveTo(cx - 14, RC.hy - 22); ctx.lineTo(cx - 2, RC.hy - 92); ctx.moveTo(cx + 14, RC.hy - 22); ctx.lineTo(cx + 2, RC.hy - 92); ctx.stroke();
    ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, RC.hy - 92); ctx.lineTo(cx, RC.hy - 118); ctx.stroke();
    ctx.fillStyle = '#1f3a8a'; ctx.fillRect(cx, RC.hy - 118, 22, 13); ctx.strokeRect(cx, RC.hy - 118, 22, 13);
    ctx.globalAlpha = pa;
  }
  // the Civic skyline fades as the road opens out toward the lake
  ctx.fillStyle = '#b9c9d8';
  if (open < 1) { const pa = ctx.globalAlpha; ctx.globalAlpha = pa*(1 - open); for (let i = 0; i < 24; i++) { const hh = 22 + (hsh(i, 5) % 50), x = i*W/22 - 30 - par, w = 40 + hsh(i, 6) % 40; if (Math.abs(x + w/2 - W/2) < 60 && open > 0) continue; ctx.fillRect(x, RC.hy + 4 - hh, w, hh); } ctx.globalAlpha = pa; }
  if (open > 0) { ctx.fillStyle = '#a9d3b0'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(W*(0.1 + i*0.24) - par*0.5, RC.hy + 6, 220, 20 + (i % 3)*10, 0, Math.PI, 0); ctx.fill(); } }
}
const FLOOR = {   // [outside A, outside B, road A, road B, edge line]
  north:  ['#d8cfbf', '#cfc5b3', '#9a9ea6', '#9498a0', '#f3ece0'],
  walk:   ['#d9a99a', '#d3a293', '#e3b6a6', '#ddb09f', null],
  centre: ['#d9a99a', '#d3a293', '#e3b6a6', '#ddb09f', null],
  london: ['#8fcf74', '#86c66b', '#7d818a', '#787c85', '#f3ece0'],
  avenue: ['#8fcf74', '#86c66b', '#7d818a', '#787c85', '#f3ece0'],
};
function drawGround(){
  const step = 3, kFar = Math.floor((R.pos + FAR - PZ)/step), kNear = Math.floor((R.pos - PZ + NEAR)/step);
  for (let k = kFar; k >= kNear; k--) {
    const s0 = k*step, s1 = s0 + step, za = Math.max(s0 - R.pos + PZ, NEAR), zb = s1 - R.pos + PZ;
    if (zb <= NEAR) continue;
    const yN = PJ(0, 0, za)[1], yF = PJ(0, 0, Math.min(zb, FAR + 8))[1], alt = k & 1, zk = zoneAt(s0), bridge = zk === 'bridge', F = FLOOR[zk];
    ctx.fillStyle = bridge ? (alt ? '#58b4e0' : '#4fa9d8') : (alt ? F[0] : F[1]);
    ctx.fillRect(0, yF - 1, W, yN - yF + 2);
    if (bridge) { ctx.fillStyle = 'rgba(255,255,255,.35)'; const wy = yF + (yN - yF)*(0.3 + 0.4*((k*0.37) % 1)); ctx.fillRect(W*((hsh(k, 1) % 100)/100), wy, 70*RC.f/zb/6 + 6, 2); ctx.fillRect(W*((hsh(k, 2) % 100)/100), wy + 3, 50*RC.f/zb/6 + 4, 2); }
    const rx = bridge ? 3.1 : ROAD_X;
    floorQuad(-rx, rx, za, zb, bridge ? (alt ? '#c2bfb6' : '#bbb8af') : alt ? F[2] : F[3]);
    const edge = bridge ? '#f3ece0' : F[4];
    if (edge) for (const sx of [-rx, rx]) floorQuad(sx - 0.07, sx + 0.07, za, zb, edge);
    if (zk === 'north') for (const l of [-1, 0, 1]) for (const d of [-0.38, 0.38]) floorQuad(l*LANE + d - 0.035, l*LANE + d + 0.035, za, zb, '#5d6068');   // the light rail tracks
    else if (zk === 'walk' || zk === 'centre') { if (s0 % 6 === 0) { const zz = Math.min(s0 + 0.25, s1) - R.pos + PZ; if (zz > NEAR) floorQuad(-rx, rx, za, zz, 'rgba(120,70,60,.18)'); } }
    else if (s0 % 6 === 0) { const zz = Math.min(s0 + 1.8, s1) - R.pos + PZ; if (zz > NEAR) for (const lx of [-LANE/2, LANE/2]) floorQuad(lx - 0.045, lx + 0.045, za, zz, 'rgba(255,255,255,.75)'); }
  }
  const g = ctx.createLinearGradient(0, RC.hy - 8, 0, RC.hy + RC.f*0.2); g.addColorStop(0, 'rgba(228,245,255,.95)'); g.addColorStop(1, 'rgba(228,245,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, RC.hy - 8, W, RC.f*0.2 + 8);
}

// ---- main frame ----
function drawWorld(){
  RC.hy = H*0.30; RC.f = H*0.52*(1 + 0.17*R.boostV); RC.camH = 3.2 + (R.dead < 0 ? 0.05*Math.sin(R.time*9) : 0);
  RC.cx = W/2 + (R.shake ? (Math.random() - .5)*R.shake*30 : 0); RC.camx = R.px*0.55;
  drawSky(); drawGround();
  const list = [], P = R.pos;
  const push = (z, fn) => { if (z < NEAR - 6 || z > FAR) return; list.push([z, fn]); };
  const jN = Math.floor((P - PZ - 10)/10), jF = Math.floor((P + FAR)/10);
  for (let j = Math.max(0, jN); j <= jF; j++) { if (j*10 >= BRIDGE0) break; for (const side of [-1, 1]) push(j*10 - P + PZ + 5, () => drawWall(side, j)); }
  const pN = Math.floor((P - PZ - 4)/6), pF = Math.floor((P + FAR)/6);
  for (let i = Math.max(0, pN); i <= pF; i++) for (const side of [-1, 1]) {
    const h = hsh(i, side + 7), s = i*6; if (s >= BRIDGE0) continue; const z = s - P + PZ, zk = zoneAt(s);
    if (zk === 'north' && s < 64) continue;   // the stop platforms
    if (zk === 'centre' && (side < 0 ? s > 670 && s < 740 : s > 712 && s < 736)) continue;   // Petrie Plaza around the merry-go-round; the fountain at the entrance
    const kind = PROPS[zk][h % 7];
    if (kind) push(z, () => drawSideProp({kind, side, col: (h >>> 5) & 1, sc: 0.8 + (h % 5)*0.1}, z));
  }
  for (const s of [14, 22, 30, 38, 46, 54]) for (const side of [-1, 1]) { const z = s - P + PZ; push(z + 4, () => stopCanopy(side, s)); }
  { const z = 705 - P + PZ; push(z, () => merryGoRound(z)); }
  { const z = 724 - P + PZ; push(z, () => pyramidFountain(z)); }
  { const z = 1530 - P + PZ; push(z, () => drawJet(z)); }
  if (P + FAR > BRIDGE0) {
    const kN = Math.max(Math.floor(BRIDGE0/5), Math.floor((P - PZ - 5)/5)), kF = Math.floor((P + FAR)/5);
    for (let k = kN; k <= kF; k++) for (const side of [-1, 1]) {
      const z = k*5 - P + PZ; push(z + 2.5, () => drawRail(side, k));
      if (k % 4 === 0) push(z, () => drawSideProp({kind: 'lamp', side}, z));
    }
  }
  CPS.forEach((cp, i) => { if (i > 0) push(cp - P + PZ, () => drawArch(cp, LINES_RUNNER.gates[i - 1], '#2f5fb3')); });
  push(D - P + PZ, () => drawArch(D, LINES_RUNNER.finish, '#e0372f'));
  for (const g of WORLD.birds) { const z = g.s - P + PZ; push(z, () => drawBirds(g, z)); }
  for (const c of WORLD.coins) if (!c.got && !c.hide) { const z = c.s - P + PZ; if (z > NEAR) push(z, () => drawCoin(c, z)); }
  for (const b of WORLD.baos) if (!b.got) { const z = b.s - P + PZ; if (z > NEAR) push(z, () => drawBao(b, z)); }
  for (const o of WORLD.obs) { const z = o.s - P + PZ; if (z + o.len < NEAR) continue; push(z + (o.len > 2 ? o.len*0.5 : 0), () => drawObs(o, z)); }
  list.push([PZ, drawPlayer]);
  list.sort((a, b) => b[0] - a[0]);
  for (const [z, fn] of list) { ctx.globalAlpha = clamp((FAR - z)/38, 0, 1); fn(); }
  ctx.globalAlpha = 1;
}

function drawPlayer(){
  const k = RC.f/PZ, s = PH*k/190, [fx, fy] = PJ(R.px, R.py, PZ), [gx, gy] = PJ(R.px, 0, PZ);
  ctx.fillStyle = `rgba(0,0,0,${0.28*(1 - clamp(R.py/3, 0, .8))})`; ell(gx, gy, 0.5*k*(1 - R.py*0.12), 0.13*k); ctx.fill();
  const pa0 = ctx.globalAlpha;
  if (R.inv > 0 && R.dead < 0 && Math.floor(R.inv*14) % 2) ctx.globalAlpha = pa0*0.45;
  if (R.boostV > 0.15) for (let i = 2; i >= 1; i--) {
    const zz = PZ + i*0.9, [ax, ay] = PJ(R.px, R.py, zz), sa = PH*(RC.f/zz)/190, pa = ctx.globalAlpha;
    ctx.globalAlpha = pa*0.28*R.boostV/i; nailong(ax, ay, sa, {walk: R.time*16 + i, mouth: 'open', look: [0, -1]}); ctx.globalAlpha = pa;
  }
  if (R.dead >= 0) {
    const t = R.dead;
    nailong(fx, fy - Math.sin(Math.min(t*3, 1)*Math.PI)*0.4*k, s, {rot: Math.min(t*9, 1.45)*R.deadDir, sx: 1 + Math.min(t*3, .3), sy: 1 - Math.min(t*3, .3), arms: 'up', flail: t*30, mouth: 'o', look: [0, 1]});
    for (let i = 0; i < 4; i++) { const a = t*9 + i*Math.PI/2; star(fx + Math.cos(a)*0.5*k, fy - 1.0*k + Math.sin(a)*0.12*k, 0.1*k); }
    ctx.globalAlpha = pa0; return;
  }
  const mouth = (R.mouth > 0 || R.boostV > 0.3) ? 'open' : 'smile';
  if (R.rollT > 0) {
    const u = 1 - R.rollT/ROLL_T, cy = fy - 0.38*k;
    ctx.save(); ctx.translate(fx, cy); ctx.rotate(u*Math.PI*2*1.2);
    nailong(0, 0.38*k*0.78, s*0.78, {mouth: 'o', arms: 'down', look: [0, 0]}); ctx.restore();
  } else {
    const tilt = clamp((R.lane*LANE - R.px)*0.1, -0.2, 0.2);
    let sx = 1, sy = 1;   // squash and stretch: long and thin on the way up, flat and wide for a beat on landing
    if (R.py > 0.25 && R.vy > 0) { const st = clamp(R.vy/(JUMP_V*0.7), 0, 1); sx = 1 - 0.08*st; sy = 1 + 0.10*st; }
    else if (R.landT > 0) { const u = R.landT/0.14; sx = 1 + 0.16*u; sy = Math.max(0.84, 1 - 0.16*u); }
    nailong(fx, fy, s, {rot: tilt, sx, sy, walk: R.time*(14 + 6*R.boostV + 1.5*R.heat), mouth, arms: R.py > 0.25 ? 'up' : 'down', flail: R.time*16, look: [clamp(-(R.lane*LANE - R.px), -1, 1), -0.5]});
    for (const p of R.landPuffs) { const u = p.t/0.25, [dx, dy] = PJ(p.x + Math.sign(p.o)*u*0.35, 0.04 + u*0.12, PZ), r = 0.6 + u*0.6; ell(dx, dy, 0.14*k*r, 0.09*k*r); ctx.fillStyle = `rgba(255,255,255,${0.7*(1 - u)})`; ctx.fill(); }
  }
  if (R.boostV > 0.3) for (let i = 0; i < 4; i++) { const t = (R.time*3 + i*0.25) % 1, [dx, dy] = PJ(R.px + (i - 1.5)*0.35, 0.05 + t*0.4, PZ + 0.4 + t*1.2); ell(dx, dy, 0.14*k*(0.6 + t), 0.1*k*(0.6 + t)); ctx.fillStyle = `rgba(255,255,255,${0.5*(1 - t)*R.boostV})`; ctx.fill(); }
  ctx.globalAlpha = pa0;
}
function star(x, y, r){
  ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i*Math.PI/5 - Math.PI/2, rr2 = i % 2 ? r*0.45 : r; ctx.lineTo(x + Math.cos(a)*rr2, y + Math.sin(a)*rr2); }
  ctx.closePath(); ctx.fillStyle = '#ffe56b'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.line; ctx.stroke();
}

// ---- rules ----
// sounds (sfx.js): every call guarded, so the game is silent and unchanged without that file
const sfx = (name, o) => window.SFX && SFX.play(name, o);
function setLane(d){ if (R.dead >= 0 || R.finish >= 0 || R.card > 0) return; const l = clamp(R.lane + d, -1, 1); if (l !== R.lane) sfx('swish', {g: 0.5}), sfx('tick', {p: 0.9, g: 0.4}); R.lane = l; }
function jump(){ if (R.dead >= 0 || R.card > 0) return; if (R.py <= 0.01) { R.vy = JUMP_V; R.rollT = 0; sfx('boing', {p: 1.3, g: 0.5}); } }
function roll(){ if (R.dead >= 0 || R.card > 0) return; if (R.py > 0.01) R.vy = -22; R.rollT = ROLL_T; sfx('whoosh', {p: 1.5, g: 0.6}); }
function popup(text, x, y, big){ R.pops.push({text, x, y, t: 0, big}); }
const CRASH_SFX = {tram: 'crash', car: 'crash', planter: 'thud', bin: 'clink', scooter: 'clink', low: 'thwack', high: 'thwack'};

function crash(o){
  R.dead = 0.0001; R.hit = 0.08; R.crashes++; R.shake = 0.5; R.flash = 0.35; R.deadDir = o.x > R.px ? -1 : 1; R.boostT = 0; R.heat = 0;
  const api = GAMES.runner.api; api && api.died && api.died();   // one ride life per crash (main.js)
  sfx(CRASH_SFX[o.k] || 'thud'); sfx('oof'); if (o.k === 'tram') sfx('tram'); if (o.k === 'car') sfx('honk');
  const pool = o.k === 'scooter' ? LINES_RUNNER.fail.scooter.concat(LINES_RUNNER.fail[o.brand] || []) : (LINES_RUNNER.fail[o.k] || ['Oops.']);
  let m, n = 0; do { m = pool[Math.floor(Math.random()*pool.length)]; } while (m === R.lastMsg && pool.length > 1 && ++n < 9);
  R.msg = R.lastMsg = m; R.msgT = DEAD_T + INV_T;
  console.log('RUNNER crash #' + R.crashes + ' on ' + o.k + ' at s=' + R.pos.toFixed(1));
}

function step(dt){
  R.time += dt;
  if (R.card > 0) { R.cardT += dt; R.card -= window.AUTO ? dt*5 : dt; return; }   // the instruction card: the world waits (any key starts)
  R.shake = Math.max(0, R.shake - dt); R.flash = Math.max(0, R.flash - dt); R.mouth = Math.max(0, R.mouth - dt); R.msgT = Math.max(0, R.msgT - dt);
  if (R.banner) { R.banner.t += dt; if (R.banner.t > 2.0) R.banner = null; }
  for (const p of R.pops) p.t += dt; R.pops = R.pops.filter(p => p.t < 1.0);
  R.landT = Math.max(0, R.landT - dt); for (const p of R.landPuffs) p.t += dt; R.landPuffs = R.landPuffs.filter(p => p.t < 0.25);
  R.coinBump = Math.max(0, R.coinBump - dt); for (const p of R.sparks) p.t += dt; R.sparks = R.sparks.filter(p => p.t < 0.2);
  if (R.hit > 0) { R.hit -= dt; return; }   // hit-stop: Nailong holds the impact pose for 80 ms under the flash, then tumbles
  if (R.dead >= 0) { R.dead += dt; if (R.dead > DEAD_T) reset(true); return; }
  if (window.AUTO) bot();
  R.boostT = Math.max(0, R.boostT - dt);
  if (R.boostT <= 0) R.heat = Math.max(0, R.heat - dt*1.5);
  R.boostV += ((R.boostT > 0 ? 1 : 0) - R.boostV)*Math.min(1, dt*(R.boostT > 0 ? 9 : 2.5));
  const base = BASE + GAIN*clamp(R.pos/D, 0, 1);
  R.speed = base*(1 + BAO_V*R.boostV + HEAT_V*R.heat*R.boostV);
  if (R.finish >= 0) { R.finish += dt; R.speed *= clamp(1 - R.finish*0.6, 0.15, 1); }
  R.pos += R.speed*dt;
  R.px += (R.lane*LANE - R.px)*Math.min(1, dt*15);
  const air = R.py > 0;
  if (R.py > 0 || R.vy > 0) { R.vy -= GRAV*dt; R.py += R.vy*dt; if (R.py <= 0) { R.py = 0; R.vy = 0; } }
  if (air && R.py === 0 && R.rollT <= 0) { R.landT = 0.14; R.landPuffs = [-0.45, -0.25, 0.25, 0.45].map(o => ({x: R.px + o, o, t: 0})); sfx('thud', {p: 1.8, g: 0.35}); }   // landing: a squash, a dust puff, a soft thump
  if (R.rollT > 0) R.rollT = Math.max(0, R.rollT - dt);
  if (R.inv > 0) R.inv -= dt;
  for (let i = R.cp + 1; i < CPS.length; i++) if (R.pos >= CPS[i]) { R.cp = i; R.banner = {text: LINES_RUNNER.checkpoint[(i - 1) % LINES_RUNNER.checkpoint.length], t: 0}; sfx('ding'); console.log('RUNNER checkpoint ' + i + ' t=' + R.time.toFixed(1) + ' coins=' + R.coins); }
  // coin lines still out of sight become bao zi, more of them the more coins she has
  for (const ln of WORLD.lines) { if (ln.dec) continue; if (ln.a - R.pos > FAR + 4) break; ln.dec = true; if (ln.a - R.pos > 10 && ln.coins.length && Math.random() < baoP(ln.a)) convert(ln); }
  for (const c of WORLD.coins) if (!c.got && !c.hide && Math.abs(c.s - R.pos) < 0.7 && Math.abs(c.lane*LANE - R.px) < 0.75 && Math.abs(c.y - (R.py + (R.rollT > 0 ? 0.3 : 0.55))) < 0.95) {
    c.got = true; R.coins++; R.coinBump = 0.18;   // the counter jumps and the coin glints
    if (R.time - R.coinAt > 0.8) R.chain = 0; R.chain++; R.coinAt = R.time;   // a coin run pings a little higher each coin
    sfx('coin', {p: 1 + 0.06*Math.min(R.chain, 8)});
    R.sparks.push({lane: c.lane, y: c.y, t: 0, side: R.coins % 2 ? 1 : -1}); if (R.sparks.length > 3) R.sparks.shift();
  }
  for (const b of WORLD.baos) if (!b.got && Math.abs(b.s - R.pos) < 1.0 && Math.abs(b.lane*LANE - R.px) < 0.85) {
    b.got = true; if (R.boostT > 0) R.heat = Math.min(HEAT_MAX, R.heat + 1); R.boostT = BOOST_T; R.mouth = 0.5; R.nbao++; R.coins += 2; R.coinBump = 0.18;
    sfx('chomp', {g: 0.7}); sfx('whoosh', {p: 1 + 0.08*R.heat});
    popup(R.heat >= 2 ? LINES_RUNNER.plus : LINES_RUNNER.boost[R.nbao % LINES_RUNNER.boost.length], b.lane*LANE, 1.8, R.heat < 2);
    console.log('RUNNER bao #' + R.nbao + ' at s=' + R.pos.toFixed(1) + ' heat=' + R.heat + ' speed=' + R.speed.toFixed(1));
  }
  for (const g of WORLD.birds) { if ((g.fly || 0) > 0) g.fly += dt; else if (g.s - R.pos < 16 && g.s - R.pos > -4) { g.fly = 0.001; sfx('squeak', {g: 0.35}); } }
  // the light rail rings and the traffic honks as she comes up behind them (once each)
  for (const o of WORLD.obs) { const d = o.s - R.pos; if (d > 40) break; if (d < 4 || R.heard.has(o)) continue;
    if (o.k === 'tram' && d < 30) { R.heard.add(o); sfx('tram', {g: 0.6}); } else if (o.k === 'car' && d < 22 && Math.abs(o.x - R.px) < 1) { R.heard.add(o); sfx('honk', {g: 0.5}); } }
  if (R.inv <= 0 && R.finish < 0) {
    const ph = R.rollT > 0 ? PH_ROLL : PH;
    for (const o of WORLD.obs) {
      if (o.s > R.pos + 2) break;
      if (R.pos + 0.3 > o.s && R.pos - 0.3 < o.s + o.len && Math.abs(o.x - R.px) < o.hw + 0.2 && R.py < o.y1 && R.py + ph > o.y0) { crash(o); return; }
    }
  }
  if (R.pos >= D && R.finish < 0) { R.finish = 0; sfx('firework');
    console.log('RUNNER finished: time=' + R.time.toFixed(1) + 's crashes=' + R.crashes + ' coins=' + R.coins + ' bao=' + R.nbao); }
  const hold = GAMES.runner.api && GAMES.runner.api.replay ? 2.0 : 3.4;   // a beat on the finish line so the words read
  if (R.finish > hold && !doneCalled) { doneCalled = true; console.log('RUNNER done, ' + R.coins + ' coins'); GAMES.runner.api.done(R.coins); }   // the menu scores the runner in coins
}

// ---- the bot that proves it can be finished (window.AUTO) ----
function bot(){
  if (R.finish >= 0) return;
  const v = R.speed, P = R.pos, obs = WORLD.obs;
  const info = [-1, 0, 1].map(l => { let hard = 99, any = 99, first = null;
    for (const o of obs) { if (o.lane !== l) continue; if (o.s + o.len < P - 0.6) continue; const d = Math.max(0, o.s - P); if (d > 60) break;
      if (d < any) { any = d; first = o; } if ((o.k === 'tram' || o.k === 'planter' || o.k === 'car') && d < hard) hard = d; }
    return {hard, any, first}; });
  const free = (l, a, b) => !obs.some(o => o.lane === l && o.s + o.len > P + a && o.s < P + b);
  const loot = l => { let n = 0; for (const c of WORLD.coins) if (!c.got && !c.hide && c.lane === l && c.s > P && c.s < P + 18) n++; for (const b of WORLD.baos) if (!b.got && b.lane === l && b.s > P && b.s < P + 18) n += 2; return n; };
  const cur = R.lane, look = 6 + v*0.9;
  let best = cur, bs = -1e9;
  for (let l = -1; l <= 1; l++) {
    const i = info[l + 1];
    const sc = Math.min(i.hard, 60) + Math.min(i.any, 30)*0.25 - Math.abs(l - cur)*2 + (l === cur ? 5 : 0) + (i.hard > look*1.6 && i.any > look*0.7 ? Math.min(loot(l), 8)*1.2 : 0);
    if (sc > bs) { bs = sc; best = l; }
  }
  if (best !== cur && Math.abs(R.px - cur*LANE) < 0.2) {
    const n = cur + Math.sign(best - cur);
    if (free(n, -1.5, 3.5)) setLane(Math.sign(best - cur));
  }
  const f = info[R.lane + 1].first;
  if (f && R.py <= 0.01 && R.rollT <= 0 && Math.abs(R.px - R.lane*LANE) < 0.35) {
    const d = f.s - P;
    if (f.k === 'high' && d < v*0.26 && d > -0.2) roll();
    else if ((f.k === 'low' || f.k === 'bin' || f.k === 'scooter') && d < v*0.34 && d > -0.1) jump();
  }
}

// ---- screen ----
// a keycap like the other games' cards: white top on a lilac base, thick outline, an arrow or a word
function keyCap(x, y, w, label, dir){
  ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = C.line;
  rr(-w/2, -26, w, 58, 12); ctx.fillStyle = '#d9d4e4'; ctx.fill(); ctx.stroke();
  rr(-w/2, -32, w, 56, 12); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
  ctx.translate(0, -4); ctx.fillStyle = C.line;
  if (dir) { ctx.rotate({R: 0, L: Math.PI, U: -Math.PI/2, D: Math.PI/2}[dir]); ctx.beginPath(); ctx.moveTo(-14, -6); ctx.lineTo(0, -6); ctx.lineTo(0, -15); ctx.lineTo(15, 0); ctx.lineTo(0, 15); ctx.lineTo(0, 6); ctx.lineTo(-14, 6); ctx.closePath(); ctx.fill(); }
  else { font(24, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 0, 1); }
  ctx.restore();
}
// the instruction card: the keys and the one rule, until a key (at most 6 s)
function drawCard(){
  const L = LINES_RUNNER, a = clamp(Math.min(R.cardT*6, R.card*4, 1), 0, 1), pop = fxBack(clamp(R.cardT/0.35, 0, 1));
  ctx.globalAlpha = a; ctx.fillStyle = 'rgba(29,22,64,.62)'; ctx.fillRect(0, 0, W, H);
  const cw = Math.min(720, W*0.66), ch = 420, cx = W/2, cy = H*0.53;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(pop, pop); ctx.lineJoin = 'round';
  rr(-cw/2 + 10, -ch/2 + 12, cw, ch, 28); ctx.fillStyle = 'rgba(14,10,34,.5)'; ctx.fill();
  rr(-cw/2, -ch/2, cw, ch, 28); ctx.fillStyle = '#fff8e6'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = C.line; ctx.stroke();
  title(L.title, 0, -ch/2, 84);
  ctx.fillStyle = C.line; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; font(26, 600); ctx.fillText(L.cardRoute, 0, -ch/2 + 70);
  const kx = -cw/2 + 150, tx = -cw/2 + 270;
  keyCap(kx - 37, -78, 62, '', 'L'); keyCap(kx + 37, -78, 62, '', 'R');
  keyCap(kx - 52, -2, 62, '', 'U'); keyCap(kx + 40, -2, 100, L.cardSpace);
  keyCap(kx, 74, 62, '', 'D');
  ctx.fillStyle = C.line; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; font(38, 700);
  ctx.fillText(L.cardLane, tx, -82); ctx.fillText(L.cardJump, tx, -6); ctx.fillText(L.cardRoll, tx, 70);
  ctx.strokeStyle = 'rgba(74,47,12,.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-cw/2 + 40, 122); ctx.lineTo(cw/2 - 40, 122); ctx.stroke();
  // the rule, with the coin and the bao zi drawn in front of it
  ctx.textAlign = 'center'; font(36, 700); ctx.fillStyle = C.line; ctx.fillText(L.cardRule, 22, 166);
  const rw = ctx.measureText(L.cardRule).width, ix = 22 - rw/2 - 34;
  ell(ix, 166, 15, 15); ctx.fillStyle = '#ffd21f'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = a*(0.7 + 0.3*(0.5 + 0.5*Math.sin(R.time*3))); title(L.cardGo, cx, cy + ch/2 + 44, 30, '#fff'); ctx.globalAlpha = 1;
}
function drawHud(){
  const replay = GAMES.runner.api && GAMES.runner.api.replay;
  const bw = Math.min(380, W*0.5), bx = W/2 - bw/2, by = 20, prog = clamp(R.pos/D, 0, 1);
  ctx.fillStyle = 'rgba(29,22,64,.55)'; rr(bx, by, bw, 16, 8); ctx.fill();
  ctx.fillStyle = C.y; rr(bx, by, Math.max(16, bw*prog), 16, 8); ctx.fill();
  ctx.strokeStyle = C.line; ctx.lineWidth = 3; rr(bx, by, bw, 16, 8); ctx.stroke();
  for (let i = 1; i < CPS.length; i++) { const x = bx + bw*CPS[i]/D; ctx.fillStyle = i <= R.cp ? '#2f7d4a' : '#fff'; ctx.fillRect(x - 2, by - 4, 4, 24); ctx.strokeRect(x - 2, by - 4, 4, 24); }
  ctx.fillStyle = '#e0372f'; ctx.fillRect(bx + bw - 4, by - 6, 8, 28);
  const zn = LINES_RUNNER.zone[zoneAt(R.pos)];
  font(16, 600); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.lineJoin = 'round';
  ctx.strokeText(zn, W/2, by + 24); ctx.fillText(zn, W/2, by + 24);
  const cb = 1 + 0.35*R.coinBump/0.18;   // the coin counter bumps on every pickup, scaled about the coin icon
  ctx.save(); ctx.translate(28, 32); ctx.scale(cb, cb); ctx.translate(-28, -32);
  ell(28, 32, 12, 12); ctx.fillStyle = '#ffd21f'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke();
  font(26); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineWidth = 5; ctx.strokeStyle = C.line; ctx.strokeText('x' + R.coins, 48, 33); ctx.fillStyle = '#fff'; ctx.fillText('x' + R.coins, 48, 33);
  ctx.restore();
  if (R.boostV > 0.05) {   // the bao zi meter under the coins (clear of the ride's hearts): the bar runs down, stacked bao zi show as little buns
    ctx.fillStyle = 'rgba(255,255,255,.4)'; rr(20, 60, 120, 12, 6); ctx.fill(); ctx.fillStyle = '#ff8a1f'; rr(20, 60, Math.max(10, 120*clamp(R.boostT/BOOST_T, 0, 1)), 12, 6); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = C.line; rr(20, 60, 120, 12, 6); ctx.stroke();
    for (let i = 0; i < Math.round(R.heat); i++) { ell(28 + i*20, 88, 8, 7); ctx.fillStyle = '#fff6e6'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = C.line; ctx.stroke(); }
  }
  if (R.boostV > 0.05) {
    ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${0.6*R.boostV})`; ctx.lineCap = 'round';
    const nl = 30 + Math.round(R.heat*4);
    for (let i = 0; i < nl; i++) { const a = i*6.283/nl + (hsh(i, 3) % 100)*0.003, ph = (R.time*(4 + R.heat*0.4) + (hsh(i, 9) % 100)/100) % 1, r0 = W*0.18 + ph*W*0.3, r1 = r0 + W*0.12*R.boostV*(0.5 + ph)*(1 + R.heat*0.08);
      ctx.lineWidth = 2 + ph*5; ctx.beginPath(); ctx.moveTo(W/2 + Math.cos(a)*r0*1.3, H*0.42 + Math.sin(a)*r0*0.85); ctx.lineTo(W/2 + Math.cos(a)*r1*1.3, H*0.42 + Math.sin(a)*r1*0.85); ctx.stroke(); }
    ctx.restore();
  }
  for (const p of R.sparks) { const u = p.t/0.2, [x, y] = PJ(p.lane*LANE + p.side*0.5, p.y + 0.35 + u*0.3, PZ); star(x, y, 0.12*RC.f/PZ*(1 - u)); }   // beside his head, alternating sides, never on his face
  for (const p of R.pops) { const [x, y] = PJ(p.x, p.y + p.t*1.2, PZ); ctx.globalAlpha = clamp(1 - p.t*p.t, 0, 1); title(p.text, x, y, p.big ? 44 : 32, '#fff7d6'); ctx.globalAlpha = 1; }
  if (R.banner) { ctx.globalAlpha = clamp(2.8 - R.banner.t*1.4, 0, 1); title(R.banner.text, W/2, H*0.2, 46, '#9be37b'); ctx.globalAlpha = 1; }
  if (R.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${R.flash*1.2})`; ctx.fillRect(0, 0, W, H); }
  // the crash line stays up through the tumble and the restart blink, so it reads twice (no words in a replay)
  if (!replay && R.msgT > 0 && R.msg) { const [x, y] = PJ(R.px, 1.3, PZ); ctx.globalAlpha = clamp(R.msgT*3, 0, 1); bubble(R.msg, clamp(x, 160, W - 160), y - 30, 28, Math.min(480, W*0.6)); ctx.globalAlpha = 1; }
  if (R.finish >= 0) {
    ctx.globalAlpha = clamp(R.finish*2, 0, 1);
    if (replay) title(R.coins + ' ' + LINES_RUNNER.score, W/2, H*0.28, 66);
    else { title(LINES_RUNNER.win, W/2, H*0.28, 66); ctx.globalAlpha = clamp((R.finish - 0.9)*2, 0, 1); title(LINES_RUNNER.win2, W/2, H*0.28 + 62, 30, '#fff'); }
    ctx.globalAlpha = 1;
  }
  if (R.again && R.dead < 0 && R.inv > 0.9) { ctx.globalAlpha = clamp((R.inv - 0.9)*3, 0, 1); title(LINES_RUNNER.go, W/2, H*0.22, 54); ctx.globalAlpha = 1; }
  if (R.card > 0) drawCard();
}

GAMES.runner = {
  title: LINES_RUNNER.title,
  hint: 'laptop: arrow keys or WASD, space to jump, down to roll. touch: swipe',
  enter(api){
    this.api = api; doneCalled = false; swipe = null; startCoins = 0;
    if (!hookUsed) { hookUsed = true; try { const v = +new URLSearchParams(location.search).get('coins'); if (v > 0) startCoins = Math.floor(v); } catch (e) {} }   // test hook ?coins=N (first entry only)
    if (!WORLD) WORLD = build();
    reset(false);
    console.log('RUNNER start (D=' + D + ', ' + WORLD.obs.length + ' obstacles, ' + WORLD.coins.length + ' coins, ' + WORLD.lines.length + ' coin lines)');
  },
  peek(){ return {pos: R.pos, dead: R.dead, cp: R.cp, crashes: R.crashes, time: R.time, coins: R.coins, speed: R.speed, heat: R.heat, nbao: R.nbao, card: R.card, lane: R.lane,
    near: WORLD ? WORLD.obs.filter(o => o.s - R.pos > 0 && o.s - R.pos < 14).map(o => ({k: o.k, d: +(o.s - R.pos).toFixed(1), lane: o.lane})) : []}; },   // test hook
  draw(t, dt){ if (!WORLD) return; step(dt); drawWorld(); drawHud(); },
  key(e){
    const k = e.key;
    if (R.card > 0) { if (R.cardT > 0.2 && !e.metaKey && !e.ctrlKey && !e.altKey && !['Shift', 'Meta', 'Control', 'Alt', 'Tab', 'CapsLock', 'Escape'].includes(k)) { R.card = 0; sfx('pop'); } if ((k.startsWith('Arrow') || k === ' ') && e.preventDefault) e.preventDefault(); return; }
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') setLane(-1);
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') setLane(1);
    else if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ') jump();
    else if (k === 'ArrowDown' || k === 's' || k === 'S') roll();
    if ((k.startsWith('Arrow') || k === ' ') && e.preventDefault) e.preventDefault();
  },
  pointer(kind, x, y){
    if (kind === 'down') { if (R.card > 0) { if (R.cardT > 0.2) R.card = 0; return; } swipe = {x, y, fired: false}; return; }
    if (!swipe) return;
    if (kind === 'move') {
      const dx = x - swipe.x, dy = y - swipe.y;
      if (Math.hypot(dx, dy) > 38) {
        if (Math.abs(dx) > Math.abs(dy)) setLane(dx > 0 ? 1 : -1); else if (dy < 0) jump(); else roll();
        swipe.x = x; swipe.y = y; swipe.fired = true;
      }
    } else if (kind === 'up') { if (!swipe.fired) jump(); swipe = null; }
  },
};
})();
