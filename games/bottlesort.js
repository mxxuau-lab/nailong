// ---------- scene: THE DECK cafe drinks fridge (a "Goods Sort" style shelf game) ----------
const LINES_BOTTLESORT = {
  sign: 'THE DECK',                       // Max, 12 Oct: "instead of brindy cafe it's called THE DECK"
  introTitle: 'THE DECK RESTOCK',
  intro: '3 the same in one box and they vanish. Drag them around!',
  start: 'press any key to start',        // under the instruction card (same words as the battle and the octagon cards)
  fail: 'The fridge jammed. Nailong shakes it loose.',
  win: 'Fridge stocked. The red bean is safe.',
  praise: ['Wow', 'Cool', 'Pretty', 'Wonderful', 'Excellent', 'Yum'],
  grab: ['mine?', 'ooh red bean', 'hehe'],
  levelCard: ['', 'LEVEL 2', 'LEVEL 3'],
  levelSub: ['', 'a bigger fridge. a new drink!', 'padlocks, and deep shelves!'],   // TODO joke (levels 2 and 3 are out for now)
  levelDone: 'Restocked!',
  again: 'Again.',
  jammed: 'Jammed. Again.',
  btnUndo: 'undo',
  btnAgain: 'again',
  lockOpen: 'unlocked!',
  noRoom: 'no room there',               // TODO joke
  lockLabel: 'opens after {n} more',
  levelTag: 'LEVEL {n} / {m}',
  stocked: 'stocked {a} / {b}',
};

// Items: 1 red bean bottle (hero), 2 milk bottle, 3 bao zi, 4 mango drink, 5 boba cup, 6 green tea can (new in level 2).
// A level = a list of boxes. f = front row (0 = empty slot), b = hidden items behind (3 per layer) that drop forward when the front is empty, k = padlock (opens after k sets are cleared anywhere).
// Level 1 is the original 6 boxes. Levels 2 and 3 were found by tools in the scratchpad (random layouts, kept when the solver can win them).
const BS_LEVEL = [{"f":[3,2,5],"b":[4,5,1]},{"f":[4,5,4],"b":[4,1,2]},{"f":[1,5,3],"b":[4,4,1]},{"f":[1,3,0],"b":[1,3,1]},{"f":[2,5,0],"b":[1,2,2]},{"f":[3,5,0],"b":[3,1,2]}];
// level 2: 8 boxes (4 x 2), a sixth drink (green tea can), 14 sets. level 3: 9 boxes (3 x 3), two padlocked boxes, three boxes with two hidden layers, 16 sets.
const BS_LEVEL2 = [{"f":[1,6,0],"b":[1,1,1]},{"f":[2,3,6],"b":[1,2,1]},{"f":[4,1,1],"b":[3,6,4]},{"f":[5,3,2],"b":[1,5,4]},{"f":[1,1,5],"b":[3,4,2]},{"f":[1,2,0],"b":[1,1,1]},{"f":[4,0,3],"b":[1,2,4]},{"f":[3,1,1],"b":[]}];
const BS_LEVEL3 = [{"f":[4,1,6],"b":[1,2,1,3,1,1]},{"f":[4,0,3],"b":[1,2,5,5,3,1]},{"f":[0,3,1],"b":[6,4,1,4,1,5]},{"f":[1,5,3],"b":[1,1,1]},{"f":[2,1,1],"b":[2,2,6]},{"f":[4,2,3],"b":[],"k":2},{"f":[6,5,1],"b":[],"k":4},{"f":[5,6,1],"b":[1,1,4]},{"f":[6,0,1],"b":[]}];
// Max, 12 Oct: "one level on everything", so the ride plays level 1 only (about 6 sets, under a minute).
// Levels 2 and 3 are kept above: add {spec: BS_LEVEL2, w: 5}, {spec: BS_LEVEL3, w: 5} back here to bring them back.
const BS_LEVELS = [{spec: BS_LEVEL, w: 3}];
const BS_N = BS_LEVELS.length;

// ---- pure logic (also run in node to prove the level can be won) ----
// box = {f: front 3 slots (0 = empty), b: hidden items behind (taken 3 at a time), k: lock count (0 = open)}.
// A locked box (k > 0) takes nothing and gives nothing; every set cleared anywhere takes 1 off every lock.
const bsClone = cs => cs.map(c => ({f: c.f.slice(), b: c.b.slice(), k: c.k || 0}));
function bsNorm(cs){
  let ch = true;
  while (ch) { ch = false;
    for (const c of cs) {
      if (c.f[0] && c.f[0] === c.f[1] && c.f[1] === c.f[2]) { c.f = [0,0,0]; ch = true; for (const d of cs) if (d.k > 0) d.k--; }
      if (!c.f[0] && !c.f[1] && !c.f[2] && c.b.length) { c.f = c.b.slice(0,3); while (c.f.length < 3) c.f.push(0); c.b = c.b.slice(3); ch = true; }
    } }
}
const bsKey = cs => cs.map(c => [...c.f].sort().join('') + '|' + c.b.join('') + '|' + (c.k || 0)).sort().join('/');
const bsDone = cs => cs.every(c => c.f.every(x => !x) && !c.b.length);
function bsMoves(cs){
  const m = [];
  for (let i = 0; i < cs.length; i++) { if (cs[i].k > 0) continue; for (let s = 0; s < 3; s++) { const t = cs[i].f[s]; if (!t) continue;
    for (let j = 0; j < cs.length; j++) { if (j === i || cs[j].k > 0) continue; const e = cs[j].f.indexOf(0); if (e < 0) continue; m.push([i, s, j, e]); } } }
  return m;
}
function bsApply(cs, [i, s, j, e]){ const n = bsClone(cs); n[j].f[e] = n[i].f[s]; n[i].f[s] = 0; bsNorm(n); return n; }
// weighted A* search over abstract states, time-sliced: run(ms) returns null while still working, then {path} or {path:null, exhausted:true|false}.
// exhausted = the whole reachable space was searched, so the fridge really is jammed.
function bsSolver(cs, cap = 60000, w = 3){
  const heap = [], seen = new Map();
  const push = (f, x) => { heap.push([f, x]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const t = heap[0], l = heap.pop(); if (heap.length) { heap[0] = l; let i = 0; for (;;) { const a = 2*i + 1, b = a + 1; let m = i; if (a < heap.length && heap[a][0] < heap[m][0]) m = a; if (b < heap.length && heap[b][0] < heap[m][0]) m = b; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return t; };
  const rem = st => { let n = 0; for (const c of st) { for (const x of c.f) if (x) n++; n += c.b.length; } return n / 3; };
  seen.set(bsKey(cs), 0); push(w * rem(cs), {st: cs, g: 0, path: null}); let n = 0, res = null;
  return {run(ms){
    if (res) return res;
    const t0 = Date.now();
    while (heap.length) {
      if ((n & 7) === 7 && Date.now() - t0 > ms) return null;
      const x = pop()[1];
      if (bsDone(x.st)) { const p = []; for (let q = x.path; q; q = q.prev) p.push(q.m); return (res = {path: p.reverse(), nodes: n}); }
      if (++n > cap) return (res = {path: null, exhausted: false, nodes: n});
      for (const m of bsMoves(x.st)) { const s2 = bsApply(x.st, m), k = bsKey(s2), g = x.g + 1, o = seen.get(k);
        if (o !== undefined && o <= g) continue; seen.set(k, g); push(g + w * rem(s2), {st: s2, g, path: {m, prev: x.path}}); }
    }
    return (res = {path: null, exhausted: true, nodes: n});
  }};
}
const bsSolve = (cs, cap, w) => bsSolver(cs, cap, w).run(Infinity);

// ---- drawing the items, cut-out style. origin = bottom centre, about 100 units tall ----
function bsItem(type, x, y, s, alpha = 1){
  ctx.save(); ctx.translate(x, y); ctx.scale(s/100, s/100); ctx.lineJoin = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = C.line; ctx.globalAlpha = alpha;
  const fs = (fill, path) => { path(); ctx.fillStyle = fill; ctx.fill(); ctx.stroke(); };
  if (type === 1) {                    // red bean drink bottle
    fs('#f3e3b3', () => rr(-9, -100, 18, 10, 3));
    fs('#8d2233', () => { ctx.beginPath(); ctx.moveTo(-9,-90); ctx.lineTo(9,-90); ctx.lineTo(9,-74); ctx.quadraticCurveTo(24,-70,24,-52); ctx.lineTo(24,-8); ctx.quadraticCurveTo(24,0,14,0); ctx.lineTo(-14,0); ctx.quadraticCurveTo(-24,0,-24,-8); ctx.lineTo(-24,-52); ctx.quadraticCurveTo(-24,-70,-9,-74); ctx.closePath(); });
    fs('#fbf0d0', () => rr(-24, -50, 48, 34, 5));
    ctx.fillStyle = '#8d2233';
    for (const [bx, by] of [[-10,-38],[2,-32],[10,-42]]) { ell(bx, by, 6.5, 4.5, 0.5); ctx.fill(); }
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(-17,-66); ctx.lineTo(-17,-56); ctx.stroke();
  } else if (type === 2) {             // milk bottle
    fs('#4a90e2', () => rr(-10, -100, 20, 12, 4));
    fs('#ffffff', () => { ctx.beginPath(); ctx.moveTo(-10,-88); ctx.lineTo(10,-88); ctx.lineTo(10,-72); ctx.quadraticCurveTo(27,-66,27,-48); ctx.lineTo(27,-8); ctx.quadraticCurveTo(27,0,17,0); ctx.lineTo(-17,0); ctx.quadraticCurveTo(-27,0,-27,-8); ctx.lineTo(-27,-48); ctx.quadraticCurveTo(-27,-66,-10,-72); ctx.closePath(); });
    fs(C.y, () => ell(0, -30, 17, 15));
    ctx.fillStyle = C.line; ell(-6,-33,2.4,2.8); ctx.fill(); ell(6,-33,2.4,2.8); ctx.fill();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0,-28,5,0.3,Math.PI-0.3); ctx.stroke();
  } else if (type === 3) {             // bao zi
    fs('#f4d8a0', () => rr(-26, -10, 52, 10, 3));
    fs('#fffaf0', () => { ctx.beginPath(); ctx.moveTo(-34,-14); ctx.quadraticCurveTo(-38,-54,0,-58); ctx.quadraticCurveTo(38,-54,34,-14); ctx.quadraticCurveTo(0,-4,-34,-14); ctx.closePath(); });
    ctx.lineWidth = 3.5; ctx.beginPath();
    for (const a of [-1.1,-0.55,0,0.55,1.1]) { ctx.moveTo(a*5, -54); ctx.quadraticCurveTo(a*14, -44, a*26, -30); }
    ctx.stroke();
    ctx.fillStyle = '#f08aa0'; ell(0,-58,3.5,3.5); ctx.fill();
  } else if (type === 4) {             // mango drink
    fs('#7fbf4a', () => rr(-11, -100, 22, 11, 4));
    fs('#ffb534', () => { ctx.beginPath(); ctx.moveTo(-11,-89); ctx.lineTo(11,-89); ctx.lineTo(11,-74); ctx.quadraticCurveTo(25,-68,25,-52); ctx.lineTo(25,-8); ctx.quadraticCurveTo(25,0,15,0); ctx.lineTo(-15,0); ctx.quadraticCurveTo(-25,0,-25,-8); ctx.lineTo(-25,-52); ctx.quadraticCurveTo(-25,-68,-11,-74); ctx.closePath(); });
    fs('#ffe27a', () => ell(0,-30,14,17,0.5));
    fs('#4fa13a', () => ell(8,-46,8,4,-0.6));
  } else if (type === 6) {             // green tea can
    fs('#d9dde2', () => rr(-19, -76, 38, 8, 3));
    fs('#58b368', () => { ctx.beginPath(); ctx.moveTo(-20,-68); ctx.lineTo(20,-68); ctx.lineTo(20,-6); ctx.quadraticCurveTo(20,0,14,0); ctx.lineTo(-14,0); ctx.quadraticCurveTo(-20,0,-20,-6); ctx.closePath(); });
    fs('#f4f0d4', () => ell(0,-36,13,16));
    fs('#2f7d3f', () => ell(0,-36,8,10,0.6));
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-6,-26); ctx.lineTo(6,-46); ctx.stroke();
    ctx.lineWidth = 6; fs('#d9dde2', () => rr(-8, -84, 16, 8, 3));
  } else {                             // boba cup
    ctx.lineWidth = 6; ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(4,-76); ctx.lineTo(14,-104); ctx.stroke();
    ctx.lineWidth = 3.5; ctx.strokeStyle = '#f08aa0'; ctx.beginPath(); ctx.moveTo(4,-76); ctx.lineTo(14,-104); ctx.stroke(); ctx.lineWidth = 6; ctx.strokeStyle = C.line;
    fs('#f7b6c8', () => { ctx.beginPath(); ctx.moveTo(-26,-74); ctx.lineTo(26,-74); ctx.lineTo(19,-6); ctx.quadraticCurveTo(18,0,10,0); ctx.lineTo(-10,0); ctx.quadraticCurveTo(-18,0,-19,-6); ctx.closePath(); });
    fs('#ffffff', () => rr(-29, -84, 58, 12, 6));
    ctx.fillStyle = '#3a2418'; for (const [px, py] of [[-9,-8],[3,-9],[11,-6],[-2,-18],[8,-19]]) { ell(px, py, 4.6, 4.6); ctx.fill(); }
  }
  ctx.restore();
}

// ---- the game ----
const BS = {};
const BS_CARD = 6.0;                   // the first instruction card stays until a key or a click, or this many seconds
const BS_STUCK = 3.0;                  // a jammed fridge: seconds before it restocks (a key or a click goes sooner, after 1 s), long enough to read the line
const BS_LAND = 0.28;                  // seconds of squash-and-rebound when a drink lands in a slot
const bsLv = () => BS_LEVELS[BS.level - 1];
function bsLayout(n){
  const cols = n <= 6 ? 3 : (n === 8 ? 4 : 3), rows = Math.ceil(n / cols);
  const sw = Math.min(W - 60, 1000), cw = sw / cols, ch = rows >= 3 ? 150 : 196, x0 = (W - sw) / 2, y0 = rows >= 3 ? 120 : 126;
  BS.L = {sw, cw, ch, x0, y0, cols, rows, sz: Math.min(cw / 2.9, 118, ch * 0.68), W, H};
}
const bsBox = i => { const L = BS.L; return {x: L.x0 + (i % L.cols) * L.cw, y: L.y0 + Math.floor(i / L.cols) * (L.ch + 14), w: L.cw, h: L.ch}; };
const bsSlot = (i, s, back) => { const b = bsBox(i); return {x: b.x + b.w * (0.2 + 0.3 * (s % 3)), y: b.y + b.h - 20 - (back ? 34 : 0), sc: back ? 0.78 : 1}; };
function bsMake(type, i, s, back){ const p = bsSlot(i, s, back); return {t: type, x: p.x, y: p.y, sc: p.sc, tx: p.x, ty: p.y, tsc: p.sc, v: -1}; }
function bsBuild(spec){
  bsLayout(spec.length);
  BS.cs = spec.map((c, i) => ({f: c.f.map((t, s) => t ? bsMake(t, i, s, false) : null), b: c.b.map((t, k) => bsMake(t, i, k, true)), k: c.k || 0, clr: false}));
}
function bsAbstract(){ return BS.cs.map(c => ({f: c.f.map(o => o ? o.t : 0), b: c.b.map(o => o.t), k: c.k})); }
function bsReset(again, level){
  if (level) BS.level = level;
  const spec = bsLv().spec;
  Object.assign(BS, {drag: null, sel: null, intro: again ? 0.9 : (BS.level > 1 ? 1.3 : BS_CARD), again: !!again, hist: [], cleared: 0, said: '', saidT: 0, stuck: -1, win: -1, particles: [], rings: [], botT: 0, checked: false, praiseN: 0, px: 0, py: 0, plan: null, solver: null, kbOn: false, kbBox: 0, kbSlot: 0, unlockT: 0, hop: 0, hopD: 0.35, hopH: 18});
  BS.total = spec.reduce((a, c) => a + c.f.filter(x => x).length + c.b.length, 0) / 3;
  bsBuild(spec);
  if (again) window.SFX && SFX.play('whoosh', {p: 0.8, g: 0.6});            // the fridge is swept and restocked
}
function bsPlaceTargets(){
  BS.cs.forEach((c, i) => {
    c.f.forEach((o, s) => { if (o && o !== BS.drag) { const p = bsSlot(i, s, false); o.tx = p.x; o.ty = p.y; o.tsc = p.sc; } });
    c.b.forEach((o, k) => { const p = bsSlot(i, k, true); o.tx = p.x; o.ty = p.y; o.tsc = p.sc; });
  });
}
function bsSay(txt, life = 1.3){ BS.said = txt; BS.saidT = life; }
const bsRoom = j => BS.cs[j].k === 0 && BS.cs[j].f.includes(null);
function bsSnapshot(){ BS.hist.push({a: JSON.parse(JSON.stringify(bsAbstract())), n: BS.cleared}); if (BS.hist.length > 8) BS.hist.shift(); }
function bsUndo(){
  if (BS.hist.length === 0 || BS.win >= 0 || BS.stuck >= 0) return;
  window.SFX && SFX.play('tick', {p: 0.8});
  const st = BS.hist.pop(); BS.drag = null; BS.sel = null; bsBuild(st.a); BS.cleared = st.n; BS.checked = false; BS.plan = null; BS.solver = null;
}
function bsMoveTo(i, s, j){            // logical move of the front item at (i,s) into a free front slot of box j
  const o = BS.cs[i].f[s], e = BS.cs[j].f.indexOf(null);
  if (!o || e < 0 || i === j || BS.cs[i].k > 0 || BS.cs[j].k > 0) return false;
  bsSnapshot();
  const pm = BS.plan && BS.plan[0];
  if (pm && pm[0] === i && pm[1] === s && pm[2] === j) BS.plan.shift();      // still on the solver's path: no need to search again
  else { BS.plan = null; BS.checked = false; }
  BS.solver = null;
  BS.cs[i].f[s] = null; BS.cs[j].f[e] = o; o.land = BS_LAND;
  window.SFX && SFX.play('clink', {p: 0.95 + Math.random() * 0.15});
  bsPlaceTargets(); return true;
}
function bsBurst(x, y, col, star){     // star: a cleared set (6 four-point stars and a white ring, Goods Sort style); else 9 dots (a padlock)
  const n = star ? 6 : 9;
  for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2 + Math.random() * 0.4, v = 140 + Math.random() * 140; BS.particles.push({x, y, vx: Math.cos(a)*v, vy: Math.sin(a)*v - 80, life: 0.7, col, star}); }
  if (star) BS.rings.push({x, y, t: 0});
}
function bsClearSound(){             // a set of three (Goods Sort / Water Sort): rising chime, then a coin; quick follow-ups climb a little. One per 100 ms
  const now = performance.now(), gap = now - (BS.sndT || -1e9); if (gap < 100) return;
  BS.combo = gap < 3000 ? Math.min(5, (BS.combo || 0) + 1) : 0; BS.sndT = now;
  if (!window.SFX) return; const p = 1 + BS.combo * 0.07;
  SFX.play('clear', {p}); setTimeout(() => window.SFX && SFX.play('coin', {p}), 120);
}
const BS_STAR = ['', '#c83a4d', '#ffffff', '#ffd21f', '#ffb534', '#f7b6c8', '#58b368'];   // star colour per drink type
function bsSettle(dt){
  let chime = false;
  BS.cs.forEach((c, i) => {
    if (!c.clr && c.f.every(o => o) && c.f[0].t === c.f[1].t && c.f[1].t === c.f[2].t && !c.f.includes(BS.drag) &&
        c.f.every(o => Math.hypot(o.x - o.tx, o.y - o.ty) < 6)) { c.clr = true; c.f.forEach(o => o.v = 0); }
    if (c.clr) {
      let fin = true;
      const mid = c.f[1].tx, hud = 0.72 * ease(clamp(c.f[0].v / 0.3, 0, 1));      // the three huddle to the middle over the first 0.3, then pop
      for (const o of c.f) { o.v += dt / 0.4; if (o.v < 1) fin = false; o.x = lerp(o.tx, mid, hud); }
      if (fin) {
        const b = bsBox(i);
        bsBurst(b.x + b.w/2, b.y + b.h/2, BS_STAR[c.f[0].t], true);
        c.f = [null, null, null]; c.clr = false; BS.cleared++; chime = true;
        let opened = false;
        BS.cs.forEach((d, di) => { if (d.k > 0 && --d.k === 0) { opened = true; const bd = bsBox(di); bsBurst(bd.x + bd.w/2, bd.y + bd.h/2, '#c9d3dc'); } });
        Object.assign(BS, opened ? {hop: 0.5, hopD: 0.5, hopH: 22} : {hop: 0.35, hopD: 0.35, hopH: 18});      // Nailong hops for every set (floatier for a padlock); low enough to stay under his bubble
        if (opened) { bsSay(LINES_BOTTLESORT.lockOpen); BS.unlockT = 0.5; window.SFX && SFX.play('clink', {p: 0.55, g: 0.8}); } else bsSay(LINES_BOTTLESORT.praise[BS.praiseN++ % LINES_BOTTLESORT.praise.length]);   // a padlock springs open with a low clink
      }
    }
    if (!c.clr && c.f.every(o => !o) && c.b.length) {
      const take = c.b.splice(0, 3); take.forEach((o, s) => { c.f[s] = o; o.land = BS_LAND; }); bsPlaceTargets();
      window.SFX && SFX.play('thud', {p: 1.6, g: 0.45});                // the hidden row slides forward onto the shelf
    }
  });
  if (BS.cs.every(c => c.f.every(o => !o) && !c.b.length) && BS.win < 0) {
    BS.win = 0;
    if (BS.level < BS_N) { chime = false; window.SFX && SFX.play('jingle'); }       // between levels; after the last one main.js plays it on done()
  }
  if (chime) bsClearSound();
}
function bsHit(x, y){
  let best = null, bd = 1e9; const L = BS.L;
  BS.cs.forEach((c, i) => { if (c.k > 0) return; c.f.forEach((o, s) => { if (!o || o.v >= 0) return;
    const dx = Math.abs(x - o.x), dy = y - (o.y - L.sz * 0.5);
    if (dx < L.sz * 0.42 && Math.abs(dy) < L.sz * 0.62 && dx + Math.abs(dy) < bd) { bd = dx + Math.abs(dy); best = {i, s}; } }); });
  return best;
}
function bsBoxAt(x, y){
  let best = -1, bd = 1e9;
  for (let i = 0; i < BS.cs.length; i++) { const b = bsBox(i); const cx = b.x + b.w/2, cy = b.y + b.h/2;
    const inside = x > b.x - 14 && x < b.x + b.w + 14 && y > b.y - 30 && y < b.y + b.h + 14;
    const d = Math.hypot(x - cx, (y - cy) * 1.4); if (inside && d < bd) { bd = d; best = i; } }
  return best;
}
function bsBtn(k){ return {x: W - 56 - k * 82, y: H - 56, r: 34}; }

// ---- keyboard play (laptop first): arrows pick a drink, Space lifts it, arrows pick a box, Space drops it, Esc puts it back ----
function bsFronts(){ const r = []; BS.cs.forEach((c, i) => { if (c.k > 0) return; c.f.forEach((o, s) => { if (o && o.v < 0) { const p = bsSlot(i, s, false); r.push({i, s, x: p.x, y: p.y}); } }); }); return r; }
function bsNavPick(cands, cx, cy, dx, dy){        // nearest candidate in a direction, spatially
  let best = null, bd = 1e9;
  for (const c of cands) { const vx = c.x - cx, vy = c.y - cy, along = vx * dx + vy * dy; if (along < 8) continue;
    const across = Math.abs(vx * dy - vy * dx), d = along + across * 2.2; if (d < bd) { bd = d; best = c; } }
  return best;
}
const bsBoxXY = i => { const b = bsBox(i); return {i, x: b.x + b.w/2, y: b.y + b.h/2}; };
function bsKbSnap(){                              // the drink under the cursor moved or vanished: jump to the nearest one that is left
  const fr = bsFronts(); if (!fr.length || fr.some(c => c.i === BS.kbBox && c.s === BS.kbSlot)) return;
  const old = bsSlot(Math.min(BS.kbBox, BS.cs.length - 1), BS.kbSlot, false);
  fr.sort((a, b) => Math.hypot(a.x - old.x, a.y - old.y) - Math.hypot(b.x - old.x, b.y - old.y)); BS.kbBox = fr[0].i; BS.kbSlot = fr[0].s;
}
function bsKbKey(e){
  const dirs = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1], a: [-1, 0], d: [1, 0], w: [0, -1], s: [0, 1]};
  const k = e.key, dir = dirs[k], pd = () => { if (e.preventDefault) e.preventDefault(); };
  if (BS.sel) {                                             // lifted: pick the box
    if (dir) { pd(); const bx = BS.cs.map((c, i) => bsBoxXY(i)), cur = bx[BS.kbBox];
      const n = bsNavPick(bx, cur.x, cur.y, dir[0], dir[1]); if (n) BS.kbBox = n.i; return; }
    if (k === ' ' || k === 'Enter') { pd(); const f = BS.selAt, j = BS.kbBox;
      if (j === f.i) BS.sel = null;
      else if (bsRoom(j)) { BS.sel = null; bsMoveTo(f.i, f.s, j); BS.kbBox = j; BS.kbSlot = 0; }
      else { bsSay(LINES_BOTTLESORT.noRoom); window.SFX && SFX.play('buzz', {p: 1.3, g: 0.5}); }   // a soft nope
      return; }
    if (k === 'Escape') BS.sel = null;
    return;
  }
  const fr = bsFronts(); if (!fr.length) return;
  bsKbSnap(); const cur = fr.find(c => c.i === BS.kbBox && c.s === BS.kbSlot) || fr[0];
  if (dir) { pd();
    if (!BS.kbOn) { BS.kbOn = true; BS.kbBox = cur.i; BS.kbSlot = cur.s; return; }
    const n = bsNavPick(fr, cur.x, cur.y, dir[0], dir[1]); if (n) { BS.kbBox = n.i; BS.kbSlot = n.s; } else { BS.kbBox = cur.i; BS.kbSlot = cur.s; }
    return; }
  if (k === ' ' || k === 'Enter') { pd(); BS.kbOn = true;
    const o = BS.cs[cur.i].f[cur.s]; BS.sel = o; BS.selAt = {i: cur.i, s: cur.s}; bsPlaceTargets(); window.SFX && SFX.play('pop', {p: 1.4});
    if (o.t === 1 && Math.random() < 0.2) bsSay(LINES_BOTTLESORT.grab[Math.floor(Math.random() * 3)]);
    const src = bsBoxXY(cur.i), room = BS.cs.map((c, i) => bsBoxXY(i)).filter(b => b.i !== cur.i && bsRoom(b.i));      // start on the nearest box with room
    BS.kbBox = cur.i;
    if (room.length) { room.sort((a, b) => Math.hypot(a.x - src.x, a.y - src.y) - Math.hypot(b.x - src.x, b.y - src.y)); BS.kbBox = room[0].i; }
  }
}

function bsLockDraw(i, c, t){
  const b = bsBox(i), cx = b.x + b.w/2, cy = b.y + b.h/2;
  ctx.fillStyle = 'rgba(70,70,90,.38)'; ctx.fillRect(b.x + 3, b.y, b.w - 6, b.h);
  const X = () => { ctx.beginPath(); ctx.moveTo(b.x + 14, b.y + 18); ctx.lineTo(b.x + b.w - 14, b.y + b.h - 18); ctx.moveTo(b.x + b.w - 14, b.y + 18); ctx.lineTo(b.x + 14, b.y + b.h - 18); ctx.stroke(); };
  ctx.lineCap = 'round'; ctx.strokeStyle = '#6d7480'; ctx.lineWidth = 9; X();
  ctx.strokeStyle = '#c9d3dc'; ctx.lineWidth = 4; ctx.setLineDash([12, 10]); X(); ctx.setLineDash([]); ctx.lineCap = 'butt';
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.sin(t * 3 + i) * 0.04);
  ctx.lineWidth = 8; ctx.strokeStyle = C.line; ctx.beginPath(); ctx.arc(0, -16, 17, Math.PI, 0); ctx.stroke();
  ctx.lineWidth = 4; ctx.strokeStyle = '#c9d3dc'; ctx.beginPath(); ctx.arc(0, -16, 17, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = '#f2b632'; rr(-26, -16, 52, 42, 8); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.line; ctx.stroke();
  font(26, 800); ctx.fillStyle = C.line; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(c.k), 0, 6);
  ctx.restore();
  font(15, 600); ctx.fillStyle = '#fff'; ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const lab = LINES_BOTTLESORT.lockLabel.replace('{n}', c.k); ctx.strokeText(lab, cx, b.y + b.h - 22); ctx.fillText(lab, cx, b.y + b.h - 22);
}

function bsDraw(t, dt){
  if (!BS.cs) { BS.level = BS.level || 1; bsReset(false, BS.level); }
  if (BS.L.W !== W || BS.L.H !== H) {           // the window changed size (fullscreen, a resize): re-centre the fridge, drinks snap to their new slots
    bsLayout(BS.cs.length); bsPlaceTargets();
    for (const c of BS.cs) for (const o of c.f.concat(c.b)) if (o && o !== BS.drag) { o.x = o.tx; o.y = o.ty; o.sc = o.tsc; }
  }
  const L = BS.L;
  if (BS.intro > 0) BS.intro -= dt;
  const playing = BS.intro <= 0 && BS.win < 0 && BS.stuck < 0;
  const k = Math.min(1, dt * 16);
  for (const c of BS.cs) for (const o of c.f.concat(c.b)) { if (!o || o === BS.drag || o.v >= 0) continue;     // clearing items are placed by bsSettle
    o.x += (o.tx - o.x) * k; o.y += (o.ty - o.y) * k; o.sc += (o.tsc - o.sc) * k; }
  if (BS.intro <= 0) bsSettle(dt);
  for (const p of BS.particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; }
  BS.particles = BS.particles.filter(p => p.life > 0);
  for (const r of BS.rings) r.t += dt;
  BS.rings = BS.rings.filter(r => r.t < 0.25);
  if (BS.saidT > 0) BS.saidT -= dt;
  if (BS.unlockT > 0) BS.unlockT -= dt;
  if (BS.hop > 0) BS.hop -= dt;
  // settled and idle: start asking the solver whether this fridge can still be finished (a few ms per frame, never a hitch)
  const idle = playing && !BS.drag && BS.cs.every(c => !c.clr && [...c.f, ...c.b].every(o => !o || Math.hypot(o.x - o.tx, o.y - o.ty) < 3));
  if (idle && !BS.checked) { BS.checked = true; const ab = bsAbstract(); bsNorm(ab); BS.solver = bsSolver(ab, 15000, bsLv().w); }
  if (BS.solver && playing) {
    const r = BS.solver.run(5);
    if (r) { BS.solver = null; BS.plan = r.path;
      if (!r.path && r.exhausted) { BS.stuck = 0; bsSay(LINES_BOTTLESORT.fail, BS_STUCK); window.SFX && SFX.play('buzz'); const a = GAMES.bottlesort.api; a && a.died && a.died(); } }   // a jam costs one ride life
  }
  if (BS.stuck >= 0) { BS.stuck += dt; if (BS.stuck > BS_STUCK) bsReset(true); }
  if (BS.win >= 0) {
    BS.win += dt;
    if (BS.level < BS_N) { if (BS.win > 0.9) bsReset(false, BS.level + 1); }
    else if (BS.win > 1.5) { BS.win = -2; GAMES.bottlesort.api.done(); return; }
  }
  if (window.AUTO && idle && BS.plan && BS.plan.length) {     // the bot: one move every 0.55 s, from the solver's plan
    BS.botT += dt;
    if (BS.botT > 0.55) { BS.botT = 0; const m = BS.plan[0]; bsMoveTo(m[0], m[1], m[2]); }
  }

  // ---- background: the cafe ----
  ctx.fillStyle = '#f3e2c4'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e8cfa5'; ctx.fillRect(0, H * 0.74, W, H);
  ctx.strokeStyle = 'rgba(74,47,12,.08)'; ctx.lineWidth = 2;
  for (let x = -20; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H * 0.74); ctx.stroke(); }
  const sgW = 330; ctx.fillStyle = '#e0463e'; rr(W/2 - sgW/2, 12, sgW, 58, 14); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.line; ctx.stroke();
  title(LINES_BOTTLESORT.sign, W/2, 41, 38, '#fff');
  font(18, 600); ctx.fillStyle = C.line; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(LINES_BOTTLESORT.stocked.replace('{a}', BS.cleared).replace('{b}', BS.total), W/2, 100);
  if (BS_N > 1) { ctx.textAlign = 'left'; font(20, 700); ctx.fillText(LINES_BOTTLESORT.levelTag.replace('{n}', BS.level).replace('{m}', BS_N), 24, 40); ctx.textAlign = 'center'; }
  const fx = L.x0 - 18, fy = L.y0 - 18, fw = L.sw + 36, fh = L.ch * L.rows + (L.rows - 1) * 14 + 36;
  ctx.fillStyle = '#9a6a3a'; rr(fx, fy, fw, fh, 16); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.line; ctx.stroke();
  for (let i = 0; i < BS.cs.length; i++) {
    const b = bsBox(i);
    ctx.fillStyle = '#f9efd9'; ctx.fillRect(b.x + 3, b.y, b.w - 6, b.h);
    ctx.fillStyle = 'rgba(160,110,60,.18)'; ctx.fillRect(b.x + 3, b.y, b.w - 6, 26);
    ctx.fillStyle = '#c9925c'; ctx.fillRect(b.x + 3, b.y + b.h - 14, b.w - 6, 14);
    ctx.strokeStyle = C.line; ctx.lineWidth = 5; ctx.strokeRect(b.x + 3, b.y, b.w - 6, b.h);
    if (BS.drag && bsBoxAt(BS.px, BS.py) === i && bsRoom(i) && BS.dragFrom !== i) { ctx.fillStyle = 'rgba(255,210,31,.25)'; ctx.fillRect(b.x + 3, b.y, b.w - 6, b.h); }
  }
  // hidden rows behind: drawn, then washed out with the box colour so they read as "not yet"
  BS.cs.forEach((c, i) => {
    if (!c.b.length) return;
    for (const o of c.b.slice(0, 3)) bsItem(o.t, o.x, o.y, L.sz * o.sc);
    const bx = bsBox(i); ctx.fillStyle = 'rgba(70,60,90,.52)'; const ty = bx.y + bx.h - 54 - L.sz * 0.82; ctx.fillRect(bx.x + 6, ty, bx.w - 12, L.sz * 0.82 + 34);
    font(20, 700); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('+' + c.b.length, bx.x + bx.w - 30, bx.y + 22);
    if (c.b.length > 3) { ctx.fillStyle = 'rgba(70,60,90,.52)'; ctx.fillRect(bx.x + 6, ty - 7, bx.w - 12, 7); ctx.fillRect(bx.x + 12, ty - 13, bx.w - 24, 6); }   // a second layer waits behind the first
  });
  for (const c of BS.cs) for (const o of c.f) {
    if (!o || o === BS.drag) continue;
    let sc = o.sc, a = 1, yo = 0;
    if (o.v >= 0) { const v = clamp(o.v, 0, 1); sc *= v < 0.3 ? 1 + v : 1.3 * (1 - (v - 0.3) / 0.7); a = 1 - Math.max(0, (v - 0.5) * 2); yo = -v * 14; }
    if (BS.sel === o) yo -= 14;
    let sx = 1, sy = 1;
    if (o.land > 0 && o.v < 0) {        // set-down thud (Goods Sort): once it reaches its slot, squash then a small rebound stretch, feet on the shelf
      if (Math.hypot(o.x - o.tx, o.y - o.ty) < 12) o.land -= dt;
      const q = 1 - clamp(o.land / BS_LAND, 0, 1), w = Math.sin(q * Math.PI * 2) * (1 - q);
      sy = 1 - 0.26 * w; sx = 1 + 0.18 * w;
    }
    ctx.fillStyle = 'rgba(74,47,12,.12)'; ell(o.x, o.y + 2, L.sz * 0.3 * Math.max(0.05, sc) * sx, 6); ctx.fill();
    ctx.save(); ctx.translate(o.x, o.y + yo); ctx.scale(sx, sy); ctx.translate(-o.x, -(o.y + yo));
    bsItem(o.t, o.x, o.y + yo, L.sz * Math.max(0.01, sc), a);
    ctx.restore();
  }
  BS.cs.forEach((c, i) => { if (c.k > 0) bsLockDraw(i, c, t); });
  if (BS.drag) { ctx.fillStyle = 'rgba(74,47,12,.15)'; ell(BS.drag.x, BS.drag.y + 14, L.sz * 0.3, 7); ctx.fill(); bsItem(BS.drag.t, BS.drag.x, BS.drag.y - 10, L.sz * 1.12); }
  if (BS.kbOn && playing && !BS.sel) bsKbSnap();
  // keyboard cursor: a bobbing arrow over the drink, or a yellow frame on the box the lifted drink will go to (red = no room)
  if (BS.kbOn && playing) {
    if (BS.sel) { const b = bsBox(BS.kbBox); ctx.strokeStyle = bsRoom(BS.kbBox) && BS.kbBox !== BS.selAt.i ? '#ffd21f' : '#e0463e'; ctx.lineWidth = 8; ctx.strokeRect(b.x + 1, b.y - 2, b.w - 2, b.h + 4); }
    else { const o = BS.cs[BS.kbBox] && BS.cs[BS.kbBox].f[BS.kbSlot]; if (o) { const bob = Math.sin(t * 8) * 4, ax = o.x, ay = o.y - L.sz * 1.08 + bob;
      ctx.beginPath(); ctx.moveTo(ax - 14, ay - 18); ctx.lineTo(ax + 14, ay - 18); ctx.lineTo(ax, ay); ctx.closePath(); ctx.fillStyle = '#ffd21f'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.lineJoin = 'round'; ctx.stroke(); } }
  }
  for (const r of BS.rings) fxRing(r.x, r.y, r.t / 0.25, 20, 70, '#fff', 6);
  for (const p of BS.particles) { ctx.globalAlpha = clamp(p.life / 0.7, 0, 1);
    if (p.star) { ctx.beginPath(); for (let q = 0; q < 8; q++) { const a = p.life * 8 + q * Math.PI / 4, r = q % 2 ? 4 : 11; ctx.lineTo(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r); } ctx.closePath();
      ctx.fillStyle = p.col; ctx.fill(); ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke(); }
    else { ell(p.x, p.y, 7, 7); ctx.fillStyle = p.col; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.line; ctx.stroke(); }
    ctx.globalAlpha = 1; }
  if (BS.stuck >= 0) { ctx.fillStyle = 'rgba(29,22,64,.5)'; ctx.fillRect(0, 0, W, H); title(LINES_BOTTLESORT.jammed, W/2, H*0.5, 64); }   // under Nailong, so his line stays bright
  const side = L.x0 > 150, nx = side ? Math.max(80, L.x0 / 2) : 150, ny = side ? H - 20 : H - 14;      // narrow screens: bottom left, clear of the undo / again buttons
  let hy = 0, hsx = 1, hsy = 1; const hop = BS.hop > 0, cheer = hop || BS.win >= 0;
  if (hop) { const h = 1 - BS.hop / BS.hopD;          // the hop: stretched in the air, a quick squash when his feet land
    if (h < 0.8) { const a = Math.sin(h / 0.8 * Math.PI); hy = BS.hopH * a; hsy = 1 + 0.06 * a; hsx = 1 - 0.04 * a; }
    else { const b = Math.sin((h - 0.8) / 0.2 * Math.PI); hsy = 1 - 0.12 * b; hsx = 1 + 0.08 * b; } }
  nailong(nx, ny - hy, side ? 0.52 : 0.4, {sx: hsx, sy: hsy, mouth: cheer ? 'open' : 'smile', arms: cheer ? 'up' : 'down', flail: t * 10, look: BS.drag ? [clamp((BS.px - nx) / 400, -1, 1), -0.4] : [0.6, -0.3]});
  if (BS.saidT > 0 && BS.said && !(GAMES.bottlesort.api && GAMES.bottlesort.api.replay)) bubble(BS.said, nx, ny - (side ? 110 : 90), 24, 300);   // replays from the menu have no dialogue
  for (const [k2, label] of [[0, LINES_BOTTLESORT.btnUndo], [1, LINES_BOTTLESORT.btnAgain]]) {
    const b = bsBtn(k2); ell(b.x, b.y, b.r, b.r); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
    font(15, 600); ctx.fillStyle = C.line; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, b.x, b.y);
  }
  if (BS.intro > 0) {
    ctx.fillStyle = 'rgba(29,22,64,.55)'; ctx.fillRect(0, 0, W, H);
    if (BS.again) title(LINES_BOTTLESORT.again, W/2, H*0.45, 64);
    else if (BS.level > 1) {                                   // level card: pops in, under 1.5 s, any key skips
      const age = 1.3 - BS.intro, pop = 1 + Math.max(0, 0.35 - age) * 1.6;
      ctx.save(); ctx.translate(W/2, H*0.42); ctx.scale(pop, pop); title(LINES_BOTTLESORT.levelCard[BS.level - 1], 0, 0, 96); ctx.restore();
      font(30, 600); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(LINES_BOTTLESORT.levelSub[BS.level - 1], W/2, H*0.58);
      bsItem(BS.level === 2 ? 6 : 1, W/2, H*0.82, 100);
    }
    else { title(LINES_BOTTLESORT.introTitle, W/2, H*0.34, Math.min(60, W/16));
      bubble(LINES_BOTTLESORT.intro, W/2, H*0.62, 30, Math.min(640, W*0.8));
      bsItem(1, W/2 - 90, H*0.82, 100); bsItem(2, W/2, H*0.82, 100); bsItem(3, W/2 + 90, H*0.82, 100);
      ctx.save(); ctx.globalAlpha = 0.7 + 0.3*Math.sin(t*4); font(24, 600); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(LINES_BOTTLESORT.start, W/2, H*0.88); ctx.restore();
      const left = clamp(BS.intro/BS_CARD, 0, 1); rr(W/2 - 90, H*0.88 + 20, 180*left, 6, 3); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fill(); }   // runs down, so the wait never feels stuck
  }
  if (BS.win >= 0) title(LINES_BOTTLESORT.levelDone, W/2, H*0.5, 80);
}

GAMES.bottlesort = {
  title: 'RESTOCK THE FRIDGE',
  hint: 'arrow keys pick a drink, Space lifts it, arrows pick a box, Space drops it (or drag with the mouse). U = undo, R = again',
  _logic: {bsNorm, bsSolve, bsSolver, bsApply, bsKey, bsDone, bsMoves, BS_LEVEL, BS_LEVELS},
  enter(api){
    this.api = api; let n = 1;
    try { n = parseInt(new URLSearchParams(location.search).get('level'), 10) || 1; } catch (e) {}          // test hook ?level=N
    BS.level = Math.min(BS_N, Math.max(1, n)); bsReset(false, BS.level);
    if (api && api.replay) BS.intro = 0;                                       // a replay from the end menu skips the intro card
  },
  draw(t, dt){ bsDraw(t, dt); },
  cardUp(){ return !!BS.cs && BS.intro > 0 && !BS.again; },   // main.js: a subtitle waits for the card to go
  key(e){
    if (!BS.cs) return;
    if (BS.intro > 0 && !BS.again) { BS.intro = 0; return; }              // any key skips the intro / level card
    if (BS.stuck > 1) { BS.stuck = BS_STUCK + 0.01; return; }             // jammed: she has read it, restock now
    if (BS.win >= 0 || BS.stuck >= 0) return;
    if (e.key === 'u' || e.key === 'U' || e.key === 'z') bsUndo();
    else if (e.key === 'r' || e.key === 'R') bsReset(true);
    else if (BS.intro <= 0) bsKbKey(e);
  },
  pointer(kind, x, y){
    if (BS.cs && kind === 'down' && BS.stuck > 1) { BS.stuck = BS_STUCK + 0.01; return; }
    if (!BS.cs || BS.win >= 0 || BS.stuck >= 0) return;
    if (BS.intro > 0) { if (kind === 'down' && !BS.again) BS.intro = 0; return; }       // a click skips the intro too
    BS.px = x; BS.py = y;
    if (kind === 'down') {
      BS.kbOn = false;
      for (let k = 0; k < 2; k++) { const b = bsBtn(k); if (Math.hypot(x - b.x, y - b.y) < b.r + 8) { k === 0 ? bsUndo() : bsReset(true); return; } }
      const h = bsHit(x, y);
      if (BS.sel) {                    // tap-tap mode: an item is lifted, the next tap picks its box
        const j = bsBoxAt(x, y), f = BS.selAt;
        if (j >= 0 && j !== f.i && bsRoom(j)) { BS.sel = null; bsMoveTo(f.i, f.s, j); return; }
        if (!h) { BS.sel = null; return; }
      }
      if (h) { window.SFX && SFX.play('pop', {p: 1.4}); BS.sel = null; BS.drag = BS.cs[h.i].f[h.s]; BS.dragFrom = h.i; BS.dragSlot = h.s; BS.dragDX = BS.drag.x - x; BS.dragDY = BS.drag.y - y; BS.downX = x; BS.downY = y; BS.moved = false;
        if (BS.drag.t === 1 && Math.random() < 0.2) bsSay(LINES_BOTTLESORT.grab[Math.floor(Math.random() * 3)]); }
    } else if (kind === 'move') {
      if (BS.drag) { if (Math.hypot(x - BS.downX, y - BS.downY) > 10) BS.moved = true; BS.drag.x = x + BS.dragDX; BS.drag.y = y + BS.dragDY; }
    } else if (kind === 'up' && BS.drag) {
      const o = BS.drag, i = BS.dragFrom, s = BS.dragSlot; BS.drag = null;
      if (!BS.moved) { BS.sel = o; BS.selAt = {i, s}; bsPlaceTargets(); return; }
      const j = bsBoxAt(x, y);
      if (j >= 0 && j !== i && bsRoom(j)) bsMoveTo(i, s, j); else { bsPlaceTargets(); window.SFX && SFX.play('tick', {p: 0.7}); }   // no room: it slides back to its slot
    }
  },
};
