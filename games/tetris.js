// ---------- NAILONG TETRIS: on Jed's open MacBook (Max, 13 Oct: "Jed has an open macbook"), in the Chinese room ----------
// Real guideline Tetris: SRS rotation with wall kicks, 7-bag, hold (once per piece), ghost piece, 5 next,
// 0.5 s lock delay (15 move resets), DAS/ARR, soft drop and hard drop, block-out and lock-out top-outs.
// Clear 10 lines to win, on a HALF-HEIGHT well (Max, 13 Oct: "half the amount of space in tetris"): 10 visible rows, not 20.
// The speed ramps (Max, 13 Oct: "when the game starts it quickly accelerates when hes playing"): it starts at guideline LEVEL 1
// (1 s a row, a normal pace) and goes up a level every 2.5 s of play, to LEVEL 5 (about 0.36 s a row) at 10 s, and stays there.
// Every level up flashes FASTER!, and at the top Nailong says "WHY'S IT SO FAST!!??". A top-out starts the next try slow again.
// Plain Tetris, nothing shown ahead (Max, 13 Oct: "there's no level 6 on the side, no holding blocks, and no next blocks ... with
// tetris there's no preshowing where it's gonna go either"): no level readout, no hold, no next pieces, no ghost piece. So the top
// speed is level 5, not the 6 tuned with all of those. A loss is unmistakable ("make sure that when she loses in the level it's
// clear that she lsot"): the stack turns grey, YOU LOST! across the screen, and only then the ride takes a heart.
// On-screen buttons work on click.
// EVERY visible line lives here. // TODO joke = a kind placeholder Max can swap.
const LINES_TETRIS = {
  title: 'NAILONG TETRIS',
  // the instruction card (until a key, at most 6 s)
  cardGoal: 'CLEAR 10 LINES',
  cardSub: 'on Jed\'s MacBook. It\'s FAST.',
  keyMove: 'move', keyTurn: 'turn', keyDrop: 'drop',
  capSpace: 'space',
  cardGo: 'press any key to start',
  // the MacBook screen (the clock in its menu bar)
  phoneTime: '1:47',
  faster: 'FASTER!',                                // flashes on the board at each level up
  linesTxt: 'LINES',
  lost: 'YOU LOST!',                                 // the loss, across the screen
  lostSub: 'The blocks reached the top.',
  winTitle: 'CLEARED!',
  clear: ['Nice!', 'Two!', 'Three! Wow!', 'TETRIS!!'],      // the pop on the board
  // Nailong
  cardSay: 'Easy. Watch this.',                     // as the first piece drops   TODO joke
  clearSay: ['', 'Hehe. Easy.', 'I am a genius!', 'Jed! Did you SEE that?'],   // after 1, 2, 3, 4 lines ('' = just a cheer)   TODO joke
  panic: ['WHY\'S IT SO FAST!!??', 'Too high!!', 'Nailong is sweating!', 'Please clear something!'],
  fail: [                                           // TODO joke
    'Jed, your phone is broken.',
    'That one was practice.',
    'The pieces cheated!',
    'Too fast!! Again!',
    'Shh. Liu Lao Shi will hear.',
  ],
  win: 'Told you. EASY.',                           // TODO joke
  // Jed (first name only, always kind)
  jedStart: 'Go on then.',                          // TODO joke
  jedFail: ['Easy, huh?', 'Still easy?'],           // TODO joke
  jedTetris: 'No way.',                             // TODO joke
  jedWin: 'Okay... that was good.',                 // TODO joke
  hint: 'laptop: ← → move, ↑ or X turn, Z turn back, ↓ soft drop, space hard drop   |   phone: tap turn, drag move, swipe down drop',
};

// gravity in seconds per row: the guideline curve (0.8 - (L-1)*0.007)^(L-1): level 1 = 1.0, 2 = 0.793, 3 = 0.618, 4 = 0.473,
// 5 = 0.355, 6 = 0.262. The level goes up one every TG.STEP seconds of play, up to TG.LEVEL.
const tGrav = L => Math.pow(0.8 - (L - 1)*0.007, L - 1);
const TG = { GOAL: 10, LEVEL: 5, STEP: 2.5, COLS: 10, ROWS: 12, HID: 2, VIS: 10, CS: 30, LOCK: 0.5, MAXRESET: 15, DAS: 0.14, ARR: 0.03, SOFT: 0.03, FLASH: 0.36, CARDMAX: 6 };
const TCOL = { G: '#8d88a6', I: '#5ad2f0', O: '#FFD21F', T: '#b072e0', S: '#6cc24a', Z: '#e8423b', J: '#3a7bd5', L: '#f59a2f' };
const TBASE = {
  I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  O: [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
  T: [[0,1,0],[1,1,1],[0,0,0]],
  S: [[0,1,1],[1,1,0],[0,0,0]],
  Z: [[1,1,0],[0,1,1],[0,0,0]],
  J: [[1,0,0],[1,1,1],[0,0,0]],
  L: [[0,0,1],[1,1,1],[0,0,0]],
};
// TROT[type][state] = list of [col,row] in the bounding box. state 0 spawn, 1 R, 2 two, 3 L (successive CW turns)
const TROT = {};
for (const k in TBASE) {
  let m = TBASE[k]; const n = m.length; TROT[k] = [];
  for (let s = 0; s < (k === 'O' ? 1 : 4); s++) {
    const cells = []; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (m[r][c]) cells.push([c, r]);
    TROT[k].push(cells);
    const o = []; for (let r = 0; r < n; r++) { o.push([]); for (let c = 0; c < n; c++) o[r].push(m[n-1-c][r]); } m = o;
  }
}
// SRS wall kicks, copied from the Tetris wiki (x right, y UP). Key = from state + to state.
const TKICK_JLSTZ = {
  '01': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]], '10': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  '12': [[0,0],[1,0],[1,-1],[0,2],[1,2]],     '21': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '23': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],    '32': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '30': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],  '03': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
};
const TKICK_I = {
  '01': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],   '10': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
  '12': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],   '21': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
  '23': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],   '32': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
  '30': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],   '03': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
};

const TT = { state: 'card', keys: {}, das: {dir: 0, t: 0, arr: 0}, g: null, trails: [], holdRect: [0,0,0,0], say: {text: '', t: 0}, jed: {text: '', t: 0}, pop: {text: '', t: 0}, failBag: [], finished: false, queue: [], lines: 0, time: 0, stackH: 0, goal: TG.GOAL, cardT: 0, bump: {t: 0, dur: 0.12, amp: 0}, chips: [], nb: 0, nbAmp: 0.07, deaths: 0 };
window.TETRIS_DEBUG = TT;
// how long a bubble stays up: long enough to read (about 1.2 s plus 0.3 s a word), never shorter than before (1.6 s)
const tSay = text => ({text, t: Math.max(1.6, 1.2 + 0.3*text.split(' ').length)});
const TCELLS = (t, r, x, y) => TROT[t][r].map(([c, rw]) => [x + c, y + rw]);

function tCollide(t, r, x, y){
  for (const [c, rw] of TROT[t][r]) {
    const cx = x + c, cy = y + rw;
    if (cx < 0 || cx >= TG.COLS || cy >= TG.ROWS) return true;
    if (cy >= 0 && TT.board[cy][cx]) return true;
  }
  return false;
}
function tBag(){ const b = ['I','O','T','S','Z','J','L']; for (let i = 6; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
function tRefill(){ while (TT.queue.length < 8) TT.queue.push(...tBag()); }
function tReset(again){
  TT.board = Array.from({length: TG.ROWS}, () => Array(TG.COLS).fill(null));
  TT.queue = []; tRefill(); TT.hold = null; TT.canHold = true; TT.lines = 0; TT.goal = TG.GOAL;
  TT.p = null; TT.state = again ? 'play' : 'card'; TT.cardT = 0; TT.deadT = 0; TT.winT = 0; TT.flashT = 0; TT.flashRows = [];
  TT.speedT = 0; TT.level = 1; TT.fasterT = 0;   // the speed ramp starts again on every try
  TT.cheer = 0; TT.panicCd = 0; TT.stackH = 0; TT.trails = []; TT.pid = 0; TT.botN = 0; TT.botPlan = null; TT.botT = 0; TT.pop = {text: '', t: 0};
  TT.das = {dir: 0, t: 0, arr: 0}; TT.g = null;
  TT.bump = {t: 0, dur: 0.12, amp: 0};   // the board dips on a hard drop (bigger on a Tetris)
  TT.chips = []; TT.nb = 0; TT.nbAmp = 0.07;   // nb: Nailong's squash timer when a piece lands
  if (!again) { TT.say = {text: '', t: 0}; TT.jed = {text: '', t: 0}; }
  if (again) tSpawn(TT.queue.shift());
}
function tStart(){   // the card goes away, the first piece drops, and Nailong is far too confident
  window.SFX && SFX.play('pop');   // the card goes
  TT.state = 'play'; TT.say = tSay(LINES_TETRIS.cardSay); TT.jed = tSay(LINES_TETRIS.jedStart); tSpawn(TT.queue.shift());
}
function tSpawn(type){
  tRefill();
  const p = {t: type, x: 3, y: 0, r: 0};
  TT.p = p; TT.gravAcc = 0; TT.lockT = 0; TT.resets = 0; TT.lowest = p.y; TT.pid++; TT.botPlan = null; TT.botN = 0;
  if (tCollide(type, 0, p.x, p.y)) { tDie(); return; }                      // block out
  if (!tCollide(type, 0, p.x, p.y + 1)) { p.y++; TT.lowest = p.y; }   // guideline: spawn in the hidden rows, then drop one at once
}
function tDie(){
  TT.state = 'dead'; TT.deadT = 0; TT.p = null; TT.deaths++;
  if (!TT.failBag.length) TT.failBag = LINES_TETRIS.fail.map((_, i) => i).sort(() => Math.random() - .5);
  TT.say = tSay(LINES_TETRIS.fail[TT.failBag.pop()]);
  TT.jed = tSay(LINES_TETRIS.jedFail[(TT.deaths - 1) % LINES_TETRIS.jedFail.length]);
  window.SFX && SFX.play('sad');   // top-out: the sad trombone
  TT.diedSent = false;             // the ride takes a heart once the loss has been on screen (tUpdate)
}
const tGround = () => tCollide(TT.p.t, TT.p.r, TT.p.x, TT.p.y + 1);
function tTouch(){   // a successful move or turn while resting resets lock delay (max 15 times)
  const p = TT.p;
  if (p.y > TT.lowest) { TT.lowest = p.y; TT.resets = 0; }
  if (tGround() && TT.resets < TG.MAXRESET) { TT.lockT = 0; TT.resets++; }
}
function tMove(dx, dy){
  const p = TT.p; if (!p || TT.state !== 'play') return false;
  if (tCollide(p.t, p.r, p.x + dx, p.y + dy)) return false;
  p.x += dx; p.y += dy;
  if (dx) { tTouch(); window.SFX && SFX.play('tick'); }   // a soft tick per sideways step; gravity and soft drop stay silent
  else if (p.y > TT.lowest) { TT.lowest = p.y; TT.resets = 0; }
  return true;
}
function tRotate(dir){
  const p = TT.p; if (!p || TT.state !== 'play' || p.t === 'O') return false;
  const nr = (p.r + dir + 4) % 4, tab = p.t === 'I' ? TKICK_I : TKICK_JLSTZ;
  for (const [kx, ky] of tab['' + p.r + nr]) {
    if (!tCollide(p.t, nr, p.x + kx, p.y - ky)) { p.r = nr; p.x += kx; p.y -= ky; tTouch(); window.SFX && SFX.play('tick', {p: 1.25}); return true; }
  }
  return false;
}
function tGhostY(){ const p = TT.p; let y = p.y; while (!tCollide(p.t, p.r, p.x, y + 1)) y++; return y; }
function tHard(){
  const p = TT.p; if (!p || TT.state !== 'play') return;
  const r0 = Math.min(...TCELLS(p.t, p.r, p.x, p.y).map(c => c[1])), cols = TROT[p.t][p.r].map(c => p.x + c[0]);
  p.y = tGhostY();
  TT.trails.push({x0: Math.min(...cols), x1: Math.max(...cols) + 1, r0, r1: Math.max(...TCELLS(p.t, p.r, p.x, p.y).map(c => c[1])) + 1, t: 0.2, col: TCOL[p.t]});
  TT.bump = {t: 0.14, dur: 0.14, amp: 5};   // the slam: the board dips a few units and springs back (gravity locks do not)
  window.SFX && SFX.play('thud', {g: 0.6});
  tLock(true);
}
function tTopRow(){ for (let r = 0; r < TG.ROWS; r++) if (TT.board[r].some(v => v)) return r; return TG.ROWS; }
function tLock(hard){
  const p = TT.p, cells = TCELLS(p.t, p.r, p.x, p.y);
  TT.nb = 0.2; TT.nbAmp = hard ? 0.09 : 0.06;   // Nailong feels every landing, a slam more
  window.SFX && SFX.play('clink', {p: 0.6, g: 0.7});   // a dull set-down
  for (const [c, r] of cells) if (r >= 0) TT.board[r][c] = p.t;
  TT.p = null; TT.canHold = true;
  if (cells.every(c => c[1] < TG.HID)) { tDie(); return; }       // lock out: locked fully above the visible board
  const full = []; for (let r = 0; r < TG.ROWS; r++) if (TT.board[r].every(v => v)) full.push(r);
  TT.stackH = TG.ROWS - tTopRow();
  if (full.length) {
    const n = full.length;
    TT.state = 'clear'; TT.flashT = TG.FLASH; TT.flashRows = full;
    TT.cheer = n === 4 ? 2.0 : 1.1; if (LINES_TETRIS.clearSay[n - 1]) TT.say = tSay(LINES_TETRIS.clearSay[n - 1]);
    if (n === 4) TT.jed = tSay(LINES_TETRIS.jedTetris);
    TT.pop = {text: LINES_TETRIS.clear[n - 1], t: 1.1, big: n === 4};
    if (n === 4) TT.bump = {t: 0.2, dur: 0.2, amp: 9};
    window.SFX && SFX.play('clear', {p: 1 + 0.12*n});   // higher for more lines, and a Tetris gets the stinger too
    if (n === 4) window.SFX && SFX.play('jingle');
  } else tSpawn(TT.queue.shift());
}
function tFinishClear(){
  // the cleared rows break into little outlined chips as the clear ends (board coords, so they ride with the board)
  for (const r of TT.flashRows) for (let c = 0; c < TG.COLS && TT.chips.length < 40; c++) TT.chips.push({
    x: c*TG.CS + TG.CS/2, y: (r - TG.HID)*TG.CS + TG.CS/2, vx: (c - 4.5)*30 + (Math.random()*30 - 15), vy: -80 - Math.random()*90,
    s: 9, col: TCOL[TT.board[r][c]] || C.y, rot: Math.random()*6.28, t: 0.6});
  const keep = TT.board.filter((_, r) => !TT.flashRows.includes(r));
  while (keep.length < TG.ROWS) keep.unshift(Array(TG.COLS).fill(null));
  TT.board = keep; TT.lines += TT.flashRows.length; TT.flashRows = [];
  TT.stackH = TG.ROWS - tTopRow();
  if (TT.lines >= TT.goal) {
    TT.state = 'won'; TT.winT = 0; TT.cheer = 99; TT.p = null;
    TT.say = {text: LINES_TETRIS.win, t: 99}; TT.jed = {text: LINES_TETRIS.jedWin, t: 99};
    return;
  }
  TT.state = 'play'; tSpawn(TT.queue.shift());
}

// ---------- bot (window.AUTO): El-Tetris style heuristic placement ----------
function tBotEval(type){
  let best = null;
  for (let r = 0; r < (type === 'O' ? 1 : 4); r++) {
    const cells = TROT[type][r], minC = Math.min(...cells.map(c => c[0])), maxC = Math.max(...cells.map(c => c[0]));
    for (let x = -minC; x <= TG.COLS - 1 - maxC; x++) {
      let y = 0; if (tCollide(type, r, x, y)) continue;
      while (!tCollide(type, r, x, y + 1)) y++;
      const g = TT.board.map(row => row.map(v => !!v));
      for (const [c, rw] of TCELLS(type, r, x, y)) g[rw][c] = true;
      let lines = 0; const rows = g.filter(row => { const f = row.every(v => v); if (f) lines++; return !f; });
      while (rows.length < TG.ROWS) rows.unshift(Array(TG.COLS).fill(false));
      const h = Array(TG.COLS).fill(0); let holes = 0;
      for (let c = 0; c < TG.COLS; c++) { let seen = false; for (let rw = 0; rw < TG.ROWS; rw++) { if (rows[rw][c]) { if (!seen) { seen = true; h[c] = TG.ROWS - rw; } } else if (seen) holes++; } }
      let agg = 0, bump = 0; for (let c = 0; c < TG.COLS; c++) { agg += h[c]; if (c) bump += Math.abs(h[c] - h[c-1]); }
      const score = -0.51*agg + 0.76*lines - 0.36*holes - 0.18*bump;
      if (!best || score > best.score) best = {score, r, x, type};
    }
  }
  return best;
}
function tBot(dt){
  const p = TT.p; if (!p || TT.state !== 'play') return;
  TT.botT += dt; if (TT.botT < 0.045) return; TT.botT = 0;
  if (!TT.botPlan || TT.botPlan.pid !== TT.pid) {
    const a = tBotEval(p.t);
    TT.botPlan = Object.assign({pid: TT.pid}, a || {r: p.r, x: p.x}); TT.botN = 0;
  }
  const pl = TT.botPlan; TT.botN++;
  if (TT.botN > 24) { tHard(); return; }
  if (p.r !== pl.r) { if (!tRotate(1)) tMove(p.x < 4 ? 1 : -1, 0); return; }
  if (p.x < pl.x) { if (!tMove(1, 0)) tHard(); }
  else if (p.x > pl.x) { if (!tMove(-1, 0)) tHard(); }
  else tHard();
}

// ---------- update (dt can be 0: main.js may freeze the game under its own overlay) ----------
function tUpdate(dt){
  if (TT.say.t > 0 && TT.say.t < 90) TT.say.t -= dt;
  if (TT.jed.t > 0 && TT.jed.t < 90) TT.jed.t -= dt;
  if (TT.pop.t > 0) TT.pop.t -= dt;
  for (const tr of TT.trails) tr.t -= dt;
  if (TT.bump.t > 0) TT.bump.t -= dt;
  if (TT.nb > 0) TT.nb -= dt;
  for (const ch of TT.chips) { ch.x += ch.vx*dt; ch.vy += 700*dt; ch.y += ch.vy*dt; ch.rot += 5*dt; ch.t -= dt; }
  if (TT.chips.length) TT.chips = TT.chips.filter(ch => ch.t > 0);
  TT.trails = TT.trails.filter(tr => tr.t > 0);
  if (TT.cheer > 0 && TT.cheer < 90) TT.cheer -= dt;
  if (TT.panicCd > 0) TT.panicCd -= dt;
  if (TT.fasterT > 0) TT.fasterT -= dt;
  if (TT.state === 'card') {
    TT.cardT += dt;
    if (TT.cardT >= TG.CARDMAX || (window.AUTO && TT.cardT >= 1.5)) tStart();
    return;
  }
  if (TT.state === 'dead') {        // YOU LOST! for 1.4 s, then the ride's lives (main.js) once per top-out, then a fresh try
    TT.deadT += dt;
    if (TT.deadT >= 1.4 && !TT.diedSent) { TT.diedSent = true; const api = GAMES.tetris.api; api && api.died && api.died(); }
    if (TT.deadT > 2.5) tReset(true);
    return;
  }
  if (TT.state === 'won') {
    TT.winT += dt;
    if (TT.winT > 2.0 && !TT.finished) { TT.finished = true; GAMES.tetris.api.done(); }
    return;
  }
  if (TT.state === 'clear') { TT.flashT -= dt; if (TT.flashT <= 0) tFinishClear(); return; }
  if (TT.state !== 'play' || !TT.p) return;
  TT.time += dt;
  if (window.AUTO) tBot(dt);
  if (TT.state !== 'play' || !TT.p) return;
  TT.speedT += dt;                        // the speed ramp: up a level every TG.STEP s of play
  const lv = Math.min(TG.LEVEL, 1 + Math.floor(TT.speedT/TG.STEP));
  if (lv > TT.level) {
    TT.level = lv; TT.fasterT = 0.9; window.SFX && SFX.play('boing', {p: 1 + 0.08*lv, g: 0.5});
    if (lv === TG.LEVEL) { TT.say = tSay(LINES_TETRIS.panic[0]); TT.panicCd = 4; }   // at the top: "WHY'S IT SO FAST!!??"
  }
  const d = TT.das;                       // sideways: DAS then ARR
  if (d.dir) {
    d.t += dt;
    if (d.t > TG.DAS) { d.arr += dt; while (d.arr >= TG.ARR) { d.arr -= TG.ARR; if (!tMove(d.dir, 0)) { d.arr = 0; break; } } }
  }
  const gv = tGrav(TT.level), iv = TT.keys.down ? Math.min(TG.SOFT, gv) : gv;   // gravity / soft drop
  TT.gravAcc += dt;
  while (TT.gravAcc >= iv) { if (tMove(0, 1)) TT.gravAcc -= iv; else { TT.gravAcc = 0; break; } }
  if (tGround()) { TT.lockT += dt; if (TT.lockT >= TG.LOCK) tLock(); } else TT.lockT = 0;
  if (TT.state === 'play' && TT.stackH >= 7 && TT.panicCd <= 0) { TT.say = tSay(LINES_TETRIS.panic[Math.floor(Math.random()*LINES_TETRIS.panic.length)]); TT.panicCd = 5; }
}

// ---------- drawing ----------
function tTile(x, y, s, col, a = 1){
  ctx.globalAlpha = a; const p = s*0.06;
  rr(x + p, y + p, s - 2*p, s - 2*p, s*0.22); ctx.fillStyle = col; ctx.fill();
  ctx.lineWidth = Math.max(2, s*0.1); ctx.strokeStyle = C.line; ctx.lineJoin = 'round'; ctx.stroke();
  rr(x + s*0.2, y + s*0.17, s*0.34, s*0.12, s*0.06); ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fill();
  ctx.globalAlpha = 1;
}
function tMini(type, cx, cy, cs, a = 1){
  const cells = TROT[type][0], c0 = Math.min(...cells.map(c => c[0])), c1 = Math.max(...cells.map(c => c[0])) + 1, r0 = Math.min(...cells.map(c => c[1])), r1 = Math.max(...cells.map(c => c[1])) + 1;
  const ox = cx - (c1 - c0)*cs/2, oy = cy - (r1 - r0)*cs/2;
  for (const [c, r] of cells) tTile(ox + (c - c0)*cs, oy + (r - r0)*cs, cs, TCOL[type], a);
}
// the Chinese room (s2Room from story-school2.js, so it matches the clip, with the hole Nailong made in the ceiling), dimmed a
// little so the MacBook pops
function tRoom(t){
  if (typeof s2Room === 'function') { ctx.save(); s2Room(t); if (typeof s2Hole === 'function') s2Hole(W*0.14, 1, 9); ctx.restore(); }
  else { ctx.fillStyle = '#ecebe6'; ctx.fillRect(0, 0, W, H*0.7); ctx.fillStyle = '#585d70'; ctx.fillRect(0, H*0.7, W, H*0.3); }
  ctx.fillStyle = 'rgba(29,22,64,.28)'; ctx.fillRect(0, 0, W, H);
}
// the student desk the phone stands on
function tDesk(top){
  ctx.fillStyle = '#e9e4d6'; ctx.strokeStyle = C.line; ctx.lineWidth = 5; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-10, top); ctx.lineTo(W + 10, top); ctx.lineTo(W + 10, top + 22); ctx.lineTo(-10, top + 22); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#b9b09a'; ctx.fillRect(-10, top + 24, W + 20, H - top); ctx.beginPath(); ctx.moveTo(-10, top + 24); ctx.lineTo(W + 10, top + 24); ctx.stroke();
}
// an arrow drawn in a keycap (no font glyphs, so it looks the same in Safari)
function tArrow(cx, cy, rot){
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.fillStyle = C.line; ctx.strokeStyle = C.line; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(4, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(1, -10); ctx.lineTo(1, 10); ctx.closePath(); ctx.fill(); ctx.restore();
}
function tKey(x, y, w, h, kind, label){
  ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = C.line;
  ctx.fillStyle = '#b9b09a'; rr(x, y + 6, w, h, 11); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; rr(x, y, w, h, 11); ctx.fill(); ctx.stroke();
  const cx = x + w/2, cy = y + h/2;
  if (kind === 'L') tArrow(cx, cy, Math.PI); else if (kind === 'R') tArrow(cx, cy, 0); else if (kind === 'U') tArrow(cx, cy, -Math.PI/2);
  else { font(24, 700); ctx.fillStyle = C.line; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, cx, cy + 1); }
}
// the instruction card: the goal and the four keys, big, until any key (at most 6 s)
function tCard(t){
  const L = LINES_TETRIS, cw = Math.min(680, W - 40), ch = 372, x0 = W/2 - cw/2, y0 = H/2 - ch/2 - 6;
  const k = clamp(TT.cardT/0.25, 0, 1), sc = 0.85 + 0.15*fxBack(k);
  ctx.fillStyle = 'rgba(29,22,64,.45)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(W/2, H/2); ctx.scale(sc, sc); ctx.translate(-W/2, -H/2);
  ctx.fillStyle = 'rgba(29,22,64,.5)'; rr(x0 + 10, y0 + 12, cw, ch, 28); ctx.fill();
  ctx.fillStyle = '#fff'; rr(x0, y0, cw, ch, 28); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.line; ctx.stroke();
  title(L.cardGoal, W/2, y0 + 72, 60);
  font(26, 600); ctx.fillStyle = C.line; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(L.cardSub, W/2, y0 + 128);
  // keys: [<][>] move   [^] turn   [space] drop
  const kh = 54, kw = 58, sw = 136, gap = 56, groups = [kw*2 + 10, kw, sw], total = groups.reduce((a, b) => a + b, 0) + gap*2;
  let gx = W/2 - total/2; const ky = y0 + 172, ly = ky + kh + 34;
  const label = (txt, cx) => { font(24, 600); ctx.fillStyle = C.line; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, cx, ly); };
  tKey(gx, ky, kw, kh, 'L'); tKey(gx + kw + 10, ky, kw, kh, 'R'); label(L.keyMove, gx + groups[0]/2); gx += groups[0] + gap;
  tKey(gx, ky, kw, kh, 'U'); label(L.keyTurn, gx + kw/2); gx += kw + gap;
  tKey(gx, ky, sw, kh, 'text', L.capSpace); label(L.keyDrop, gx + sw/2);
  ctx.globalAlpha = 0.6 + 0.4*Math.sin(t*3.2);
  font(22, 600); ctx.fillStyle = '#8a7a52'; ctx.fillText(L.cardGo, W/2, y0 + ch - 34); ctx.globalAlpha = 1;
  ctx.restore();
}
// Jed's MacBook: the lid (silver edge, black bezel, the notch), the screen, the silver base on the desk. Measured from the centre
// of the whole laptop, so story-school2.js draws the same laptop small on Jed's desk and its zoom lands exactly on this one.
const TM = {SW: 640, SH: 420, BZ: 14, CHIN: 26, BASE: 22};
TM.LW = TM.SW + 2*TM.BZ; TM.LH = TM.BZ + TM.SH + TM.CHIN; TM.TH = TM.LH + TM.BASE;
const tMacC = () => [Math.round(W/2), Math.round(H/2 + 34)];          // where the game draws it
function tMacGeom(){ const LX = -TM.LW/2, LY = -TM.TH/2; return {LX, LY, SX: LX + TM.BZ, SY: LY + TM.BZ}; }
function tMacBody(lw){                                                 // in the laptop's own coords (origin = its centre)
  const g = tMacGeom(), by = g.LY + TM.LH;
  ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = C.line;
  ctx.beginPath(); ctx.moveTo(-TM.LW/2 - 16, by - 2); ctx.lineTo(TM.LW/2 + 16, by - 2); ctx.lineTo(TM.LW/2 + 50, by + TM.BASE); ctx.lineTo(-TM.LW/2 - 50, by + TM.BASE); ctx.closePath();
  ctx.fillStyle = '#d3d6dd'; ctx.fill(); ctx.lineWidth = lw; ctx.stroke();
  ctx.fillStyle = '#a3a8b3'; rr(-56, by, 112, 7, 3); ctx.fill();                                   // the thumb notch
  ctx.fillStyle = '#b6bac4'; rr(g.LX, g.LY, TM.LW, TM.LH, 20); ctx.fill(); ctx.lineWidth = lw*1.4; ctx.stroke();
  ctx.fillStyle = '#121317'; rr(g.LX + 5, g.LY + 5, TM.LW - 10, TM.LH - 10, 16); ctx.fill();
  ctx.fillStyle = C.navy; rr(g.SX, g.SY, TM.SW, TM.SH, 6); ctx.fill();
  ctx.restore();
}
function tMacBar(SX, SY, SW, clock){                                   // the menu bar: clock, a nearly flat battery, the notch
  ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(SX, SY, SW, 24);
  font(14, 600); ctx.fillStyle = '#fff'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(clock, SX + SW - 14, SY + 13);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; rr(SX + SW - 90, SY + 6, 26, 12, 3); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(SX + SW - 63, SY + 9, 3, 6);
  ctx.fillStyle = '#e8423b'; rr(SX + SW - 87, SY + 9, 5, 6, 1); ctx.fill();
  ctx.fillStyle = '#121317'; rr(SX + SW/2 - 50, SY - 1, 100, 20, 8); ctx.fill();
}
// where everything sits on the screen (SX, SY = its top left): HOLD and LEVEL left, the board, NEXT right, LINES under the
// board, the four on-screen buttons in the bottom corners
function tMacLayout(SX, SY){
  const BW = TG.CS*TG.COLS, BH = TG.CS*TG.VIS, BX = SX + (TM.SW - BW)/2, BY = SY + 34, cw = 110;
  const lc = (SX + BX - 5)/2, rc = (BX + BW + 5 + SX + TM.SW)/2;
  return {BX, BY, BW, BH, cw, LX: lc - cw/2, RX: rc - cw/2, padY: SY + 380, padR: 30, padXs: [lc - 36, lc + 36, rc - 36, rc + 36]};
}
// the game's on-screen buttons: move left, move right | turn, drop (a click on one does what it shows). Returns the circles.
function tPad(xs, cy, r){
  const kinds = ['L', 'R', 'turn', 'drop'], out = [], f = r/36;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  xs.forEach((x, i) => {
    ell(x, cy, r, r); ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.stroke();
    ctx.fillStyle = ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 6;
    const k = kinds[i]; ctx.save(); ctx.translate(x, cy); ctx.scale(f, f); ctx.translate(-x, -cy);
    if (k === 'L' || k === 'R') { const d = k === 'L' ? -1 : 1; ctx.beginPath(); ctx.moveTo(x + d*13, cy); ctx.lineTo(x - d*9, cy - 14); ctx.lineTo(x - d*9, cy + 14); ctx.closePath(); ctx.fill(); }
    else if (k === 'turn') { ctx.beginPath(); ctx.arc(x, cy, 15, -Math.PI*0.35, Math.PI*1.25); ctx.stroke();
      const ax = x + Math.cos(-Math.PI*0.35)*15, ay = cy + Math.sin(-Math.PI*0.35)*15; ctx.beginPath(); ctx.moveTo(ax + 9, ay - 6); ctx.lineTo(ax - 2, ay - 9); ctx.lineTo(ax + 1, ay + 3); ctx.closePath(); ctx.fill(); }
    else { ctx.beginPath(); ctx.moveTo(x, cy - 15); ctx.lineTo(x, cy + 4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 12, cy + 1); ctx.lineTo(x + 12, cy + 1); ctx.lineTo(x, cy + 15); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    out.push({x, y: cy, r, k});
  });
  ctx.restore();
  return out;
}
function tDraw(t){
  const L = LINES_TETRIS, CS = TG.CS, BW = CS*TG.COLS, BH = CS*TG.VIS;
  const MC = tMacC(), mg = tMacGeom(), SX = MC[0] + mg.SX, SY = MC[1] + mg.SY, SW = TM.SW;
  const PW = TM.LW, PX = MC[0] - PW/2, Lo = tMacLayout(SX, SY), BX = Lo.BX, BY = Lo.BY;
  const rowY = r => BY + (r - TG.HID)*CS;
  const dead = TT.state === 'dead', won = TT.state === 'won';
  const panic = TT.state === 'play' && TT.stackH >= 7, cheering = TT.cheer > 0;

  tRoom(t);
  // Jed, behind the desk on the right, watching his MacBook
  const jx = Math.min(W - 110, PX + PW + (W - PX - PW)/2 + 10), jy = H + 76, js = 1.32;
  person(jx, jy, js, CAST.jed, {mouth: (TT.pop.big && TT.pop.t > 0) || won ? 'o' : 'smile', look: [-0.9, 0.35]});
  const deskTop = MC[1] + TM.TH/2 - 3;
  tDesk(deskTop);
  // the MacBook open on the desk, the game on its screen
  ell(MC[0], deskTop + 4, PW*0.55, 9); ctx.fillStyle = 'rgba(29,22,64,.25)'; ctx.fill();
  ctx.save(); ctx.translate(MC[0], MC[1]); tMacBody(4); ctx.restore();
  tMacBar(SX, SY, SW, L.phoneTime);

  // the board (dips with TT.bump; the columns stay put)
  const bp = TT.bump;
  ctx.save(); ctx.translate(0, bp.amp*Math.sin(clamp(bp.t/bp.dur, 0, 1)*Math.PI));
  ctx.fillStyle = '#120d2e'; rr(BX - 5, BY - 5, BW + 10, BH + 10, 8); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#4b4380'; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1;
  for (let c = 1; c < TG.COLS; c++) { ctx.beginPath(); ctx.moveTo(BX + c*CS, BY); ctx.lineTo(BX + c*CS, BY + BH); ctx.stroke(); }
  for (let r = 1; r < TG.VIS; r++) { ctx.beginPath(); ctx.moveTo(BX, BY + r*CS); ctx.lineTo(BX + BW, BY + r*CS); ctx.stroke(); }
  ctx.save(); ctx.beginPath(); ctx.rect(BX - 2, BY, BW + 4, BH + 4); ctx.clip();   // the hidden rows above the board stay hidden
  const grey = r => dead && (r - TG.HID + 1)/TG.VIS <= TT.deadT/0.6;   // a loss: the stack goes grey from the top down
  for (let r = 1; r < TG.ROWS; r++) for (let c = 0; c < TG.COLS; c++) { const v = TT.board[r][c]; if (v) tTile(BX + c*CS, rowY(r), CS, grey(r) ? TCOL.G : TCOL[v]); }
  if (TT.state === 'clear') {   // the cleared rows go white, then shrink to the middle (no flicker)
    const k = clamp(1 - TT.flashT/TG.FLASH, 0, 1), w = BW*(k < 0.35 ? 1 : 1 - (k - 0.35)/0.65);
    for (const r of TT.flashRows) { ctx.fillStyle = '#fff'; ctx.fillRect(BX + BW/2 - w/2, rowY(r) + 1, w, CS - 2); }
  }
  for (const tr of TT.trails) { ctx.globalAlpha = tr.t/0.2*0.18; ctx.fillStyle = tr.col; ctx.fillRect(BX + tr.x0*CS, rowY(tr.r0), (tr.x1 - tr.x0)*CS, (tr.r1 - tr.r0)*CS); ctx.globalAlpha = 1; }
  const p = TT.p;
  if (p && TT.state === 'play') {
    const col = TCOL[p.t];   // no ghost piece: nothing shows where it will land
    const lk = tGround() ? 1 - 0.35*clamp(TT.lockT/TG.LOCK, 0, 1) : 1;
    for (const [c, r] of TCELLS(p.t, p.r, p.x, p.y)) tTile(BX + c*CS, rowY(r), CS, col, lk);
  }
  ctx.restore();
  for (const ch of TT.chips) {   // chips from cleared rows
    ctx.save(); ctx.translate(BX + ch.x, BY + ch.y); ctx.rotate(ch.rot); ctx.globalAlpha = clamp(ch.t/0.6, 0, 1);
    rr(-ch.s/2, -ch.s/2, ch.s, ch.s, 2); ctx.fillStyle = ch.col; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke(); ctx.restore();
  }
  ctx.restore();

  // the goal under the board: LINES 3 / 10 on a filling bar
  const gyb = BY + BH + 12, gh = 30;
  ctx.fillStyle = 'rgba(255,255,255,.12)'; rr(BX, gyb, BW, gh, 15); ctx.fill();
  ctx.fillStyle = C.y; rr(BX, gyb, Math.max(gh, BW*clamp(TT.lines/TT.goal, 0, 1)), gh, 15); ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = C.line; rr(BX, gyb, BW, gh, 15); ctx.stroke();
  title(`${L.linesTxt}  ${Math.min(TT.lines, TT.goal)} / ${TT.goal}`, BX + BW/2, gyb + gh/2 + 1, 22, '#fff');
  // the phone's own touch buttons under the board (a click on one does what it shows)
  TT.pad = tPad(Lo.padXs, Lo.padY, Lo.padR);   // in the bottom corners of the screen

  // overlays on the board
  const cx = BX + BW/2;
  if (TT.pop.t > 0 && !won) {
    const k = 1 - TT.pop.t/1.1, sc = TT.pop.big ? 1 + Math.sin(k*Math.PI)*0.2 : 1;
    ctx.globalAlpha = clamp(TT.pop.t*2.5, 0, 1); title(TT.pop.text, cx, BY + 170 - k*24, (TT.pop.big ? 50 : 38)*sc, TT.pop.big ? '#fff' : C.y); ctx.globalAlpha = 1;
  }
  if (TT.fasterT > 0 && TT.state === 'play') {   // FASTER! at each level up
    const k = 1 - TT.fasterT/0.9; ctx.globalAlpha = clamp(TT.fasterT*3, 0, 1);
    title(L.faster, cx, BY + 60 - k*18, 40*(1 + 0.25*Math.sin(Math.min(1, k*3)*Math.PI)), '#ff8a3d'); ctx.globalAlpha = 1;
  }
  if (won) { ctx.fillStyle = 'rgba(29,22,64,.5)'; ctx.fillRect(BX, BY, BW, BH); title(L.winTitle, cx, BY + BH*0.45, 50 + Math.sin(TT.winT*5)*2); }

  // Nailong, big in the front left, reacting to every move
  const nx = Math.max(120, PX*0.46), ny = H + 64, ns = 1.55;
  let o = {arms: 'down', mouth: 'o', look: [0.9, -0.35]}, by = 0, rot = 0, sy = 1, sx = 1;
  if (TT.state === 'card') o = {arms: 'up', flail: t*4, mouth: 'smile', look: [0.6, -0.3]};
  else if (dead) { o = {arms: 'down', mouth: 'o', look: [0.3, 0.8]}; sx = 1.08; sy = 0.92; }
  else if (cheering) { o = {arms: 'up', flail: t*6, mouth: 'open', look: [0.5, -0.5]}; by = -Math.abs(Math.sin(t*6))*16; }
  else if (panic) { o = {arms: 'up', flail: t*9, mouth: 'open', look: [0.9, -0.6]}; rot = Math.sin(t*8)*0.035; }
  else if (TT.nb > 0) { const kk = clamp(TT.nb/0.2, 0, 1); sy = 1 - TT.nbAmp*kk; sx = 1 + TT.nbAmp*0.6*kk; }   // squash on a landing
  nailong(nx, ny + by, ns, Object.assign({rot, sx, sy}, o));
  const quiet = GAMES.tetris.api && GAMES.tetris.api.replay;   // replays from the menu have no dialogue
  if (!quiet && TT.say.t > 0 && TT.say.text) bubble(TT.say.text, nx + 30, ny - 300 + by*0.5, 24, Math.max(150, PX - 50));
  if (!quiet && TT.jed.t > 0 && TT.jed.text) bubble(TT.jed.text, jx - 10, jy - 380, 22, Math.max(140, W - PX - PW - 40));

  if (dead) tLost();
  if (TT.state === 'card') tCard(t);
}
// the loss, unmistakable: the screen dims, a red banner slams in across the middle, YOU LOST! (then main.js takes a heart)
function tLost(){
  const L = LINES_TETRIS, d = TT.deadT, k = clamp(d/0.28, 0, 1), sc = Math.max(0.01, fxBack(k)), cy = H*0.42;
  const jx = d < 0.4 ? Math.sin(d*70)*8*(1 - d/0.4) : 0;
  ctx.fillStyle = `rgba(29,22,64,${0.45*clamp(d/0.25, 0, 1)})`; ctx.fillRect(0, 0, W, H);
  const bw = Math.min(W - 40, 640), bh = 150;
  ctx.save(); ctx.translate(W/2 + jx, cy); ctx.scale(sc, sc); ctx.rotate(-0.03);
  ctx.fillStyle = 'rgba(29,22,64,.5)'; rr(-bw/2 + 10, -bh/2 + 12, bw, bh, 26); ctx.fill();
  ctx.fillStyle = '#d3303a'; rr(-bw/2, -bh/2, bw, bh, 26); ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = C.line; ctx.stroke();
  title(L.lost, 0, -16, Math.min(88, bw/7), '#fff');
  font(26, 600); ctx.fillStyle = '#ffe9a8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(L.lostSub, 0, 46);
  ctx.restore();
}

GAMES.tetris = {
  title: LINES_TETRIS.title,
  hint: LINES_TETRIS.hint,
  enter(api){
    this.api = api; TT.finished = false; TT.keys = {}; TT.failBag = []; TT.time = 0; TT.deaths = 0;
    tReset(false);
    if (api && api.replay) { TT.state = 'play'; tSpawn(TT.queue.shift()); }   // a replay from the menu: no card, straight into play
  },
  draw(t, dt){ tUpdate(dt); tDraw(t); },
  key(e){
    const k = e.key;
    if (['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' '].includes(k)) e.preventDefault();
    if (e.repeat) return;
    if (TT.state === 'card') { if (!['Shift','Meta','Alt','Control','Tab','CapsLock','Escape'].includes(k)) tStart(); return; }
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { TT.keys.left = true; TT.das = {dir: -1, t: 0, arr: 0}; tMove(-1, 0); }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { TT.keys.right = true; TT.das = {dir: 1, t: 0, arr: 0}; tMove(1, 0); }
    else if (k === 'ArrowDown' || k === 's' || k === 'S') TT.keys.down = true;
    else if (k === 'ArrowUp' || k === 'x' || k === 'X' || k === 'w' || k === 'W') tRotate(1);
    else if (k === 'z' || k === 'Z') tRotate(-1);
    else if (k === ' ') tHard();
  },
  pointer(kind, x, y){
    const CS = TG.CS;
    if (kind === 'down') {
      if (TT.state === 'card') { tStart(); TT.g = null; return; }
      const b = (TT.pad || []).find(p => Math.hypot(x - p.x, y - p.y) <= p.r + 6);   // the phone's own buttons
      if (b) { if (b.k === 'L') tMove(-1, 0); else if (b.k === 'R') tMove(1, 0); else if (b.k === 'turn') tRotate(1); else tHard(); TT.g = null; return; }
      TT.g = {sx: x, sy: y, ax: x, ay: y, t0: performance.now(), moved: false};
    } else if (kind === 'move' && TT.g) {
      const g = TT.g, step = CS*0.95;
      while (x - g.ax >= step) { tMove(1, 0); g.ax += step; g.moved = true; }
      while (x - g.ax <= -step) { tMove(-1, 0); g.ax -= step; g.moved = true; }
      if (y - g.sy > CS*3.2 && performance.now() - g.t0 < 320 && Math.abs(x - g.sx) < CS*2) { tHard(); TT.g = null; return; }   // quick swipe down = hard drop
      if (y - g.ay >= CS*1.1) { tMove(0, 1); g.ay += CS*1.1; g.moved = true; TT.gravAcc = 0; }                                  // slow drag down = soft drop
    } else if (kind === 'up' && TT.g) {
      const g = TT.g;
      if (!g.moved && Math.hypot(x - g.sx, y - g.sy) < CS*0.7 && performance.now() - g.t0 < 320) tRotate(1);                   // tap = rotate
      TT.g = null;
    }
  },
};
addEventListener('keyup', e => {
  const k = e.key;
  if (k === 'ArrowLeft' || k === 'a' || k === 'A') { TT.keys.left = false; TT.das = TT.keys.right ? {dir: 1, t: 0, arr: 0} : {dir: 0, t: 0, arr: 0}; }
  else if (k === 'ArrowRight' || k === 'd' || k === 'D') { TT.keys.right = false; TT.das = TT.keys.left ? {dir: -1, t: 0, arr: 0} : {dir: 0, t: 0, arr: 0}; }
  else if (k === 'ArrowDown' || k === 's' || k === 'S') TT.keys.down = false;
});
addEventListener('blur', () => { TT.keys = {}; TT.das = {dir: 0, t: 0, arr: 0}; });
