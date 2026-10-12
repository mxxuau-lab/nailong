// every word this file shows (the games' own words live in their files). Max edits these.
const LINES_MAIN = {
  skip: 'space to skip', skipTouch: 'tap or space to skip', again: 'space to watch again', againTouch: 'tap to watch again',
  livesTitle: 'You have 3 lives.',           // TODO Max: his opening joke replaces this
  livesAny: 'press any key',
  overTitle: 'OUT OF LIVES',
  pay: 'pay $10 for 3 more lives',
  exit: 'exit the game',
  bruh: 'bruh, you really did that?',
  keep: 'keep going',
  back: 'go back',
  choose: 'arrows to choose, Enter to pick',
  // a movie-style subtitle that flashes up during a game in the ride (Max, 12 Oct), about 2 s after its instruction card goes.
  // Max fills the empty ones; an empty one shows nothing. Never in replays from the menu.
  subtitles: {
    tetris: "I watch you playing Tetris and the game's no fun because it's too easy. Here's Nailong Tetris, try this.",   // Max's line
    octagon: '', bottlesort: '', battle: '', pingpong: '', runner: '', blockblast: '',
  },
};

// ---------- the running order ----------
// A step is a story clip {scene, dur}, a mini-game {game}, the lives card {lives} or the end menu {menu}. Games call api.done() to move on.
// New clips are looked up on window, so FLOW still loads before their file has them (the old clip stands in, or the step is left out).
const clipFn = (name, fallback) => typeof window[name] === 'function' ? window[name] : fallback;
const durOr = (v, fallback) => typeof v === 'number' && v > 0 ? v : fallback;
// The order (Max, 12 Oct 21:20: "it's important we start off strong ... the strongest in the whole thing is the chinese room so I'd
// like to start with that, and then we have nai long coming out "What a fun and nice teacher" and then Mr. Shou next providing a
// stark contrast"; the octagon is the last school scene before the car). sceneFall is out of the ride (its code stays in story.js).
const FLOW = [
  typeof window.sceneIntro === 'function' && typeof INTRO === 'object' && {scene: sceneIntro, intro: true},   // story-intro.js: Max says hi, "Have you got 15 min?", Yes: "Nailong, sending you to BCC" and the toss
  {lives: true},                                // "You have 3 lives." card, any key after 1.5 s
  {scene: clipFn('sceneChineseA', window.sceneChinese), dur: durOr(typeof CH_A_DUR !== 'undefined' && CH_A_DUR, typeof S2_CH_DUR !== 'undefined' ? S2_CH_DUR : 15.6)},   // crash-lands head first in the Chinese room
  {game: 'tetris'},
  typeof window.sceneChineseB === 'function' && {scene: window.sceneChineseB, dur: durOr(typeof CH_B_DUR !== 'undefined' && CH_B_DUR, 19.2)},
  {game: 'pingpong'},
  typeof window.sceneChineseOut === 'function' && {scene: window.sceneChineseOut, dur: durOr(typeof CH_OUT_DUR !== 'undefined' && CH_OUT_DUR, 6)},   // "What a fun and nice teacher"
  {scene: sceneCafe1, dur: durOr(typeof CAFE1_DUR !== 'undefined' && CAFE1_DUR, 13)},   // story.js owns the cafe lengths: Mr Shou, the stark contrast
  {game: 'bottlesort'},
  {scene: sceneCafe2, dur: durOr(typeof CAFE2_DUR !== 'undefined' && CAFE2_DUR, 31)},
  {game: 'battle'},
  {scene: sceneCafe3, dur: durOr(typeof CAFE3_DUR !== 'undefined' && CAFE3_DUR, 7.8)},
  {scene: sceneSlide, dur: durOr(typeof SLIDE_DUR !== 'undefined' && SLIDE_DUR, 12.2)},   // the Mr Shou chase begins
  {game: 'octagon'},                            // the last school scene before the car
  {scene: sceneLLC, dur: durOr(typeof LLC_DUR !== 'undefined' && LLC_DUR, typeof S2_LLC_DUR !== 'undefined' ? S2_LLC_DUR : 20.2)},
  {scene: sceneEscape, dur: durOr(CANBERRA_DUR.sceneEscape, 10.4)},
  {scene: sceneCivic, dur: durOr(CANBERRA_DUR.sceneCivic, 11)},
  {game: 'runner'},
  {scene: sceneBridge, dur: durOr(CANBERRA_DUR.sceneBridge, 12.9)},
  {game: 'blockblast'},
  {scene: sceneParliament, dur: durOr(CANBERRA_DUR.sceneParliament, 12)},   // finale (sceneFinale is an alias, so only one)
  {menu: true},
].filter(Boolean);
// "go back" (out of lives) and "watch the story again" restart at the lives card: the intro and its question happen once
const RIDE_START = Math.max(0, FLOW.findIndex(st => st.lives));
// sceneFaces (the Scarlett photo booth) is cut (Max, 12 Oct: "skip the scarlett scene"); its code stays in story-school2.js.

// ?clip=<sceneFunctionName>: that one clip, then the end card. Its length comes from &dur=, else FLOW, else the table below, else 12 s.
function clipSteps(name){
  const f = window[name];
  if (typeof f !== 'function') {
    console.error('clip not found:', name);
    return [{scene: () => { ctx.fillStyle = C.navy; ctx.fillRect(0, 0, W, H); title('missing clip: ' + name, W/2, H/2, 44); }, end: true}];
  }
  const known = Object.assign({}, typeof S2_CH_DUR !== 'undefined' && {sceneChinese: S2_CH_DUR}, typeof S2_FACE_DUR !== 'undefined' && {sceneFaces: S2_FACE_DUR},
    typeof S2_LLC_DUR !== 'undefined' && {sceneLLC: S2_LLC_DUR}, typeof CANBERRA_DUR === 'object' ? CANBERRA_DUR : {});
  const inFlow = FLOW.find(st => st.scene === f);
  if (inFlow && inFlow.intro) return [inFlow, {scene: sceneEnd, end: true}];   // the intro ends when she answers (&answer=yes|maybe|no answers for a test)
  const dur = +new URLSearchParams(location.search).get('dur') || (inFlow && inFlow.dur) || known[name] || 12;
  return [{scene: f, dur}, {scene: sceneEnd, end: true}];
}

const q = new URLSearchParams(location.search);
window.AUTO = q.get('auto') === '1';            // test hook: games may play themselves
const HOLD = q.get('hold') === '1';              // test hook: freeze time after ?sim= so screenshots are exact
const DEV = q.get('dev') === '1';                // test hook: shows the Skip and Style buttons (she never sees them)
const STORE_OK = !(window.AUTO || HOLD || q.has('sim'));   // test runs never write her localStorage (the intro lock, the menu timer, the pay count)
if (q.get('unlock') === '1') try { for (const k of ['nailong.lock.until', 'nailong.menu.first', 'nailong.menu.off', 'nailong.fell']) localStorage.removeItem(k); } catch (e) {}   // test hook: clears the intro lock and the 12 h menu timer
let steps = FLOW;
if (q.get('game')) steps = [{game: q.get('game')}, {scene: sceneEnd, end: true}];
if (q.get('cast')) steps = [{scene: sceneCast, end: true}];
if (q.get('clip')) steps = clipSteps(q.get('clip'));   // test hook: one clip by function name, like ?scene=N
if (q.get('menu')) steps = [{menu: true}];       // test hook: the end menu alone (&demo=1 fake times, &celebrate=GAME shows the celebration)

let si = 0, goN = 0, t0 = performance.now(), last = performance.now();   // goN counts step changes (a restart can land on the same index)
const cur = () => steps[si];
try { Object.defineProperty(window, 'si', {get: () => si, configurable: true}); } catch (e) {}   // tests poll window.si
// menu mode: {menu: true} runs MENU (menu.js); a replay runs one game from the menu, times it, and returns to the menu
let replay = null, gameTok = 0, gameT0 = 0, simOff = 0;
const nowS = () => performance.now()/1000 + simOff;      // wall clock in seconds (plus any fast-forward from ?sim=)
// her MacBook has no touch screen: show keyboard hints only, and drop the phone half of a game hint
const TOUCH = navigator.maxTouchPoints > 0;
const keyHint = h => TOUCH ? h : h.split(/\s*[\/|.]\s*(?:phone|touch):/i)[0].replace(/^laptop:\s*/i, '');
const curGame = () => replay ? GAMES[replay] : cur().menu ? MENU : cur().game && GAMES[cur().game];

// ---------- three lives for the whole ride ----------
// Every game calls api.died() once per death, then does its own instant retry. A death cuts one heart (a dotted line runs
// across it, snip, it falls in two halves, a dotted outline stays). The last one freezes the game, a black shutter comes down,
// "pay $10" / "exit", then "bruh, you really did that?", then "keep going" (3 hearts back, the game carries on where it was)
// or "go back" (the ride restarts). Never in replays from the end menu.
// ?lives=N starts with N hearts (1 to 3); with ?game=NAME the hearts only show when ?lives= is given.
const LIVES = 3;
const LIVES_START = clamp(Math.round(+q.get('lives') || LIVES), 1, LIVES);
window.RIDE = {failed: false, lives: LIVES_START, deaths: 0, overs: 0};   // failed: she ran out of lives this ride (menu.js reads it)
if (q.get("failed") === "1") RIDE.failed = true;   // test hook: the menu as it looks after she ran out of lives
let cuts = [];          // hearts being cut: {i, t}
let pops = [];          // hearts popping back in: {i, t}
let over = null;        // the out-of-lives overlay: {t, phase: 'wall'|'pay'|'bruh'|'lift'|'back', sel, at, ft, pick, bt}
const livesOn = () => !replay && !!cur() && !!cur().game && (steps === FLOW || q.has('lives'));
function loseLife(){
  if (over || RIDE.lives <= 0) return;
  RIDE.lives--; RIDE.deaths++;
  cuts.push({i: RIDE.lives, t: 0});
  window.SFX && SFX.play('snip');
  if (RIDE.lives === 0) {
    RIDE.failed = true; RIDE.overs++;
    over = {t: -OVER_WAIT, phase: 'wall', sel: 0, at: performance.now(), ft: (performance.now() - t0)/1000, pick: -1, bt: 0, hit: false};
    hintEl.textContent = '';
  }
}
// test hook (and the console): a death in whatever game is running
RIDE.died = () => { if (livesOn()) loseLife(); };
RIDE.phase = () => over ? over.phase : null;

function heartPath(x, y, r){
  ctx.beginPath();
  ctx.moveTo(x, y + r*0.95);
  ctx.bezierCurveTo(x - r*0.2, y + r*0.72, x - r*1.08, y + r*0.2, x - r*1.02, y - r*0.32);
  ctx.bezierCurveTo(x - r*0.96, y - r*1.0, x - r*0.18, y - r*1.02, x, y - r*0.45);
  ctx.bezierCurveTo(x + r*0.18, y - r*1.02, x + r*0.96, y - r*1.0, x + r*1.02, y - r*0.32);
  ctx.bezierCurveTo(x + r*1.08, y + r*0.2, x + r*0.2, y + r*0.72, x, y + r*0.95);
  ctx.closePath();
}
// full: a red sticker heart. ghost: the dotted outline left behind once a heart is cut out
function drawHeart(x, y, r, ghost){
  ctx.save(); ctx.lineJoin = 'round';
  heartPath(x, y, r);
  if (ghost) {
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fill();
    ctx.setLineDash([r*0.2, r*0.2]); ctx.lineWidth = Math.max(2.5, r*0.11); ctx.strokeStyle = 'rgba(74,47,12,.85)'; ctx.stroke();
  } else {
    ctx.fillStyle = '#e8423b'; ctx.fill(); ctx.lineWidth = Math.max(3, r*0.15); ctx.strokeStyle = C.line; ctx.stroke();
    ell(x - r*0.47, y - r*0.42, r*0.2, r*0.13, -0.7); ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fill();
  }
  ctx.restore();
}
// the three corner slots: top right, just left of the Sound button (no game draws its own HUD there)
function heartSlots(){
  let right = W - 130;
  try { const b = document.getElementById('ui').getBoundingClientRect(); if (b.width) right = b.left * W / innerWidth - 20; } catch (e) {}
  const r = 17, gap = 2*r + 12;
  return Array.from({length: LIVES}, (_, i) => ({x: right - r - (LIVES - 1 - i)*gap, y: 33, r}));
}
// one heart being cut: it lifts out of its slot and grows, a dotted cut line runs across it, snip, the halves fall away
const CUT_LEN = 1.9;
function drawCut(c, s){
  const T = c.t, k = ease(clamp(T/0.4, 0, 1));
  const cx = lerp(s.x, s.x - 90, k), cy = lerp(s.y, s.y + 92, k), r = lerp(s.r, 52, k);
  const p0 = [-1.35, -0.62], p1 = [1.35, 0.72];
  if (T < 1.05) {
    const wob = T > 0.4 ? Math.sin(T*40)*0.025 : 0;
    drawHeart(cx, cy, r*(1 + wob));
    const ln = clamp((T - 0.42)/0.55, 0, 1);
    if (ln > 0) {
      ctx.save(); ctx.lineCap = 'round'; ctx.setLineDash([r*0.17, r*0.15]);
      ctx.beginPath(); ctx.moveTo(cx + p0[0]*r, cy + p0[1]*r); ctx.lineTo(cx + lerp(p0[0], p1[0], ln)*r, cy + lerp(p0[1], p1[1], ln)*r);
      ctx.lineWidth = r*0.16; ctx.strokeStyle = C.line; ctx.stroke();
      ctx.lineWidth = r*0.08; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.restore();
      // the little scissors riding the line
      const sx = cx + lerp(p0[0], p1[0], ln)*r, sy = cy + lerp(p0[1], p1[1], ln)*r, open = Math.abs(Math.sin(T*22))*0.45;
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(Math.atan2(p1[1] - p0[1], p1[0] - p0[0]));
      for (const sg of [-1, 1]) {
        ctx.save(); ctx.rotate(sg*open); ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(r*0.05, 0); ctx.lineTo(-r*0.55, sg*r*0.06); ctx.lineTo(-r*0.55, -sg*r*0.02); ctx.closePath();
        ctx.fillStyle = '#d9dde3'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = C.line; ctx.stroke();
        ell(r*0.22, sg*r*0.16, r*0.14, r*0.1); ctx.fillStyle = '#e8423b'; ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }
  } else {
    if (!c.snipped) { c.snipped = true; window.SFX && SFX.play('snip', {p: 1.25}); }
    const u = T - 1.05, dx = p1[0] - p0[0], dy = p1[1] - p0[1], dl = Math.hypot(dx, dy), nx = -dy/dl, ny = dx/dl;
    for (const sd of [-1, 1]) {
      ctx.save(); ctx.globalAlpha = clamp(1 - (u - 0.45)/0.4, 0, 1);
      ctx.translate(cx + sd*nx*u*90 + sd*u*25, cy + sd*ny*u*40 + 520*u*u); ctx.rotate(sd*u*1.4);
      // clip to one side of the cut line
      const a0 = [(p0[0] - dx)*r, (p0[1] - dy)*r], a1 = [(p1[0] + dx)*r, (p1[1] + dy)*r];
      ctx.beginPath(); ctx.moveTo(...a0); ctx.lineTo(...a1); ctx.lineTo(a1[0] + sd*nx*3*r, a1[1] + sd*ny*3*r); ctx.lineTo(a0[0] + sd*nx*3*r, a0[1] + sd*ny*3*r); ctx.closePath(); ctx.clip();
      drawHeart(0, 0, r);
      ctx.restore();
    }
    fxRing(cx, cy, u/0.35, r*0.4, r*1.6, '#fff', 6);
  }
}
function drawHearts(dt){
  const sl = heartSlots();
  for (let i = 0; i < LIVES; i++) {
    const pop = pops.find(p => p.i === i);
    if (pop ? pop.t >= 0 : i < RIDE.lives) {
      const sc = pop ? fxBack(clamp(pop.t/0.3, 0, 1)) : 1;
      if (sc > 0.01) { ctx.save(); ctx.translate(sl[i].x, sl[i].y); ctx.scale(sc, sc); drawHeart(0, 0, sl[i].r); ctx.restore(); }
    } else drawHeart(sl[i].x, sl[i].y, sl[i].r, true);
  }
  for (const c of cuts) { c.t += dt; drawCut(c, sl[c.i]); }
  cuts = cuts.filter(c => c.t < CUT_LEN);
  for (const p of pops) { const was = p.t; p.t += dt; if (was < 0 && p.t >= 0) window.SFX && SFX.play('pop', {p: 1 + p.i*0.15}); }
  pops = pops.filter(p => p.t < 0.4);
}

// ---------- the out-of-lives overlay ----------
// Paced so each beat lands (Max, 12 Oct: "things land better when you give her some time to process"): the last heart is cut,
// the frozen game holds about 1 s, the shutter comes down slowly (1.2 s), a 1 s hold with OUT OF LIVES, then the two buttons
// fade in. After her pick a 0.8 s hold, then "bruh, you really did that?" big, held 2 s before "keep going" / "go back".
const OVER_WAIT = 2.05;      // from the death to the shutter starting (the heart cut takes 1.9 s, its snip is at 1.05 s)
const SH_FALL = 1.2;         // the shutter's fall
const OVER_TITLE = 1.7, OVER_BTN = 2.5, OVER_PICK = 2.9;   // on the shutter's clock: the title, the buttons fading in, picks allowed
const BRUH_AT = 0.8, BRUH_BTN = 2.8, BRUH_PICK = 3.1;      // on the pick's clock: the bubble, the next buttons, picks allowed
function overButtons(){
  const bw = Math.min(W*0.36, 500), bh = 170, gap = 56, y = H*0.45;
  return [{x: W/2 - gap/2 - bw, y, w: bw, h: bh}, {x: W/2 + gap/2, y, w: bw, h: bh}];
}
function choiceButtons(){
  const w = Math.min(W*0.2, 300), h = 120, x0 = W*0.5, y = H*0.66;
  return [{x: x0, y, w, h}, {x: x0 + w + 44, y, w, h}];
}
function wrapLines(text, maxW){
  const words = text.split(' ');
  if (ctx.measureText(text).width <= maxW) return [text];
  let best = null;   // two even lines ("pay $10 for / 3 more lives"), never one long line and a lonely word
  for (let k = 1; k < words.length; k++) {
    const l = [words.slice(0, k).join(' '), words.slice(k).join(' ')], w = Math.max(...l.map(x => ctx.measureText(x).width));
    if (!best || w < best.w) best = {l, w};
  }
  return best ? best.l : [text];
}
// a big sticker button: pops in at `app` (0..1), the selected one has a white ring, leans in and wobbles
// fade: it fades up and settles from 92% size instead of popping
function overBtn(b, text, fill, app, selected, pressed, extra, fade){
  if (app <= 0.01) return;
  const now = performance.now();
  const sc = (fade ? lerp(0.92, 1, ease(app)) : fxBack(app)) * (selected && app > 0.6 ? 1.07 + Math.sin(now/180)*0.012 : 1) * (pressed ? 0.92 : 1);
  ctx.save(); if (fade) ctx.globalAlpha *= ease(app);
  ctx.translate(b.x + b.w/2, b.y + b.h/2); ctx.scale(sc, sc); ctx.rotate(selected ? Math.sin(now/260)*0.015 : 0);
  ctx.lineJoin = 'round';
  rr(-b.w/2 + 8, -b.h/2 + 10, b.w, b.h, 30); ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fill();
  if (selected) { rr(-b.w/2 - 12, -b.h/2 - 12, b.w + 24, b.h + 24, 40); ctx.fillStyle = '#fff'; ctx.fill(); }
  rr(-b.w/2, -b.h/2, b.w, b.h, 30); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = C.line; ctx.stroke();
  let fs = 40; font(fs); let lines = wrapLines(text, b.w - 50);
  while ((lines.length > 2 || lines.some(l => ctx.measureText(l).width > b.w - 40)) && fs > 22) { fs -= 2; font(fs); lines = wrapLines(text, b.w - 50); }
  const lh = fs*1.12, top = -(lines.length - 1)*lh/2 - (extra ? 20 : 0);
  ctx.fillStyle = C.line; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, 0, top + i*lh));
  if (extra) extra(top + (lines.length - 1)*lh + fs*0.62 + 18);
  ctx.restore();
}
function drawOver(dt){
  const o = over; o.t += dt;
  const T = o.t;
  // the shutter: falls like something heavy (speeds up), clunks at the bottom, a small rebound
  let p;
  if (o.phase === 'lift') p = 1 - clamp((o.bt - 0.75)/0.85, 0, 1)**2;
  else p = T < 0 ? 0 : T < SH_FALL ? (T/SH_FALL)**2 : 1;
  if (!o.hit && T >= SH_FALL) { o.hit = true; window.SFX && SFX.play('shutter'); }
  const bounce = o.phase !== 'lift' && T > SH_FALL && T < SH_FALL + 0.3 ? Math.sin((T - SH_FALL)/0.3*Math.PI)*16 : 0;
  const wy = p*H - bounce;
  if (wy > 0) {
    ctx.save();
    if (T > SH_FALL && T < SH_FALL + 0.25) ctx.translate(...fxShake((SH_FALL + 0.25 - T)/0.25, 7));
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(0, wy, W, 24);                     // its shadow on the frozen game
    ctx.fillStyle = '#121016'; ctx.fillRect(-20, -20, W + 40, wy + 20);
    for (let ly = wy - 62; ly > -60; ly -= 58) { ctx.fillStyle = '#211c29'; ctx.fillRect(-20, ly, W + 40, 6); ctx.fillStyle = '#2b2535'; ctx.fillRect(-20, ly + 6, W + 40, 2); }
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#2d2736'; ctx.fillRect(-20, wy - 34, W + 40, 34);
    ctx.lineWidth = 6; ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(-20, wy - 34); ctx.lineTo(W + 20, wy - 34); ctx.moveTo(-20, wy - 3); ctx.lineTo(W + 20, wy - 3); ctx.stroke();
    rr(W/2 - 80, wy - 25, 160, 14, 7); ctx.fillStyle = '#5a5266'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
    ctx.restore();
  }
  const bs = overButtons();
  if (o.phase === 'wall' && T >= SH_FALL + 0.3) o.phase = 'pay';
  if (o.phase === 'pay' || (o.phase === 'bruh' && o.bt < 0.6)) {
    const fade = o.phase === 'bruh' ? clamp(1 - (o.bt - 0.25)/0.3, 0, 1) : 1;
    ctx.save(); ctx.globalAlpha = fade;
    const tk = fxBack(clamp((T - OVER_TITLE)/0.4, 0, 1));
    if (tk > 0.01) { ctx.save(); ctx.translate(W/2, H*0.24); ctx.scale(tk, tk); title(LINES_MAIN.overTitle, 0, 0, Math.min(92, W/13), '#e8423b'); ctx.restore(); }
    const minis = y0 => { for (let i = 0; i < 3; i++) drawHeart((i - 1)*38, y0, 13); };
    overBtn(bs[0], LINES_MAIN.pay, C.y, clamp((T - OVER_BTN)/0.5, 0, 1), o.sel === 0, o.pick === 0 && o.phase === 'bruh', minis, true);
    overBtn(bs[1], LINES_MAIN.exit, '#e9e3d2', clamp((T - OVER_BTN - 0.2)/0.5, 0, 1), o.sel === 1, o.pick === 1 && o.phase === 'bruh', null, true);
    if (o.phase === 'pay' && T > OVER_PICK + 0.3) { font(24, 600); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(LINES_MAIN.choose, W/2, H*0.84); }
    ctx.restore();
  }
  if (o.phase === 'bruh' || o.phase === 'lift' || o.phase === 'back') {
    o.bt += dt;
    const B = o.bt, rise = o.phase === 'lift' ? 1 : ease(clamp((B - 0.35)/0.6, 0, 1)), down = o.phase === 'lift' ? ease(clamp(B/0.5, 0, 1)) : 0;
    const nx = W*0.24, ny = H + 330 - rise*340 + down*360;
    if (ny < H + 320) {
      nailong(nx, ny, 1.6, {look: [0.8, -0.1], mouth: 'o', arms: 'down', sx: 1 + Math.sin(B*3)*0.01});
      if (B > BRUH_AT && o.phase === 'bruh') {
        if (!o.bruhSaid) { o.bruhSaid = true; window.SFX && SFX.play('boing', {p: 0.8}); }
        const keep = CLOCK; CLOCK = 1e6 + B;   // bubble() pops on CLOCK; the frozen game clock would hold it at size 0
        ctx.save(); bubble(LINES_MAIN.bruh, nx + 150, ny - 300, 64, Math.min(640, W*0.5)); ctx.restore();
        CLOCK = keep;
      }
    }
    if (o.phase === 'bruh') {
      const cb = choiceButtons();
      overBtn(cb[0], LINES_MAIN.keep, C.y, clamp((B - BRUH_BTN)/0.45, 0, 1), o.sel === 0, false, null, true);
      overBtn(cb[1], LINES_MAIN.back, '#e9e3d2', clamp((B - BRUH_BTN - 0.15)/0.45, 0, 1), o.sel === 1, false, null, true);
      if (B > BRUH_PICK + 0.3) { font(24, 600); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(LINES_MAIN.choose, cb[0].x + (cb[1].x + cb[1].w - cb[0].x)/2, cb[0].y + cb[0].h + 52); }
    }
  }
  if (o.phase === 'lift' && o.bt > 1.65) { endOver(); return; }
  if (o.phase === 'back') {
    const k = clamp((o.bt - 0.1)/0.45, 0, 1);
    ctx.fillStyle = `rgba(29,22,64,${k})`; ctx.fillRect(0, 0, W, H);
    if (k >= 1) restartRide();
  }
}
// a choice on either screen: i = 0 (pay / keep going) or 1 (exit / go back)
function overPick(i){
  const o = over;
  if (o.phase === 'pay' && o.t > OVER_PICK) {
    o.pick = i; o.sel = 0; o.phase = 'bruh'; o.bt = 0; window.SFX && SFX.play('thud', {p: 0.8});
    if (i === 0) noteFell();   // she tried to pay: the menu's fake checkout pokes her for falling for it twice
  }
  else if (o.phase === 'bruh' && o.bt > BRUH_PICK) {
    window.SFX && SFX.play('pop');
    if (i === 0) {   // keep going: three hearts back, the shutter goes up, the game carries on where it was
      o.phase = 'lift'; o.bt = 0; RIDE.lives = LIVES; pops = [0, 1, 2].map(k => ({i: k, t: -0.15 - k*0.2}));
    } else { o.phase = 'back'; o.bt = 0; }
  }
}
// how many times she has pressed a pay button for real (kept in localStorage; test runs keep it in memory)
function noteFell(){
  RIDE.fell = (RIDE.fell || 0) + 1;
  if (STORE_OK) try { localStorage.setItem('nailong.fell', String((+localStorage.getItem('nailong.fell') || 0) + 1)); } catch (e) {}
}
function endOver(){
  const d = performance.now() - over.at;
  t0 += d; gameT0 += d/1000; last = performance.now();   // the frozen stretch never counts: the game's clock and her time resume where they were
  over = null;
  const g = curGame(); hintEl.textContent = g ? keyHint(g.hint || '') : '';
}
function restartRide(){ RIDE.lives = LIVES; RIDE.failed = false; steps = FLOW; replay = null; go(RIDE_START); }
function overKey(e){
  const o = over; e.preventDefault && e.preventDefault();
  if (o.phase !== 'pay' && o.phase !== 'bruh') return;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { if (o.sel !== 0) { o.sel = 0; window.SFX && SFX.play('tick'); } }
  else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { if (o.sel !== 1) { o.sel = 1; window.SFX && SFX.play('tick'); } }
  else if (e.key === 'Enter' || e.key === ' ') overPick(o.sel);
}
function overPointer(kind, x, y){
  const o = over, bs = o.phase === 'pay' ? overButtons() : o.phase === 'bruh' ? choiceButtons() : null;
  if (!bs) return;
  const i = bs.findIndex(b => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
  if (i < 0) return;
  if (o.sel !== i) { o.sel = i; window.SFX && SFX.play('tick'); }
  if (kind === 'down') overPick(i);
}

// ---------- the opening lives card ----------
const LIVES_GO = 1.5, LIVES_MAX = 9;       // any key works after 1.5 s; on its own it moves on after 9 s
let livesPopped = 0;
function drawLivesCard(t){
  ctx.fillStyle = C.navy; ctx.fillRect(0, 0, W, H);
  [['#2a2062', .12, .25, 200], ['#33297a', .88, .2, 160], ['#2a2062', .78, .86, 240], ['#33297a', .16, .9, 180]].forEach(([col, fx, fy, r], i) => {
    ell(W*fx + Math.sin(t*.4 + i)*14, H*fy + Math.cos(t*.35 + i*2)*12, r, r*.9); ctx.fillStyle = col; ctx.fill();
  });
  const tk = fxBack(clamp(t/0.45, 0, 1));
  if (tk > 0.01) { ctx.save(); ctx.translate(W/2, H*0.26); ctx.scale(tk, tk); ctx.rotate(Math.sin(t*1.6)*0.015); title(LINES_MAIN.livesTitle, 0, 0, Math.min(96, W/12)); ctx.restore(); }
  const gap = Math.min(220, W*0.17);
  for (let i = 0; i < LIVES; i++) {
    const at = 0.55 + i*0.35, k = clamp((t - at)/0.35, 0, 1);
    if (t >= at && livesPopped <= i) { livesPopped = i + 1; window.SFX && SFX.play('pop', {p: 0.9 + i*0.2}); }
    if (k <= 0) continue;
    const x = W/2 + (i - 1)*gap, y = H*0.56 + Math.sin(t*2.2 + i*1.3)*7;
    ctx.save(); ctx.translate(x, y); ctx.scale(fxBack(k), fxBack(k)); ctx.rotate(Math.sin(t*1.8 + i)*0.05);
    drawHeart(0, 0, 74, i >= LIVES_START);
    ctx.restore();
  }
  if (t > LIVES_GO) {
    ctx.save(); ctx.globalAlpha = clamp((t - LIVES_GO)/0.3, 0, 1)*(0.65 + 0.35*Math.sin(t*4));
    font(30, 600); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(LINES_MAIN.livesAny, W/2, H*0.83);
    ctx.restore();
  }
}
const stepT = () => HOLD ? sim : (performance.now() - t0)/1000;
const isAnyKey = e => !e.metaKey && !e.ctrlKey && !e.altKey && !['Shift', 'Meta', 'Control', 'Alt', 'Tab', 'CapsLock', 'Escape'].includes(e.key);

// start a game and time it from enter to api.done (wraps done, so no game file needs to know).
// done(score): a game that ends on a score instead of a time (the runner's coins, the octagon's metres) passes it, and the menu shows that.
function startGame(id, onDone){
  const g = GAMES[id], tok = ++gameTok; gameT0 = nowS();
  g.enter({
    done: score => { if (tok !== gameTok || over) return; gameTok++; window.SFX && SFX.play('jingle'); onDone(nowS() - gameT0, typeof score === 'number' ? score : undefined); },   // 3-note win stinger (sfx.js)
    died: () => { if (tok !== gameTok || !livesOn()) return; loseLife(); },
    replay: !!replay,   // true when she replays it from the end menu: games skip their instruction card and dialogue
  });
  hintEl.textContent = keyHint(g.hint || '');
  const txt = !replay && LINES_MAIN.subtitles[id];
  sub = txt ? {id, parts: txt.match(/[^.!?]+[.!?]+["')]*\s*|[^.!?]+$/g).map(x => x.trim()).filter(Boolean), first: null, tok} : null;
}
// ---------- the subtitle: movie-style words at the bottom during a game in the ride ----------
// It flashes in SUB_DELAY s after the game's instruction card goes (the first key or click the game gets, the game's own
// cardUp() if it has one, Tetris's card state, or SUB_CARD s in), one sentence at a time, about 6 s in all, then fades.
// The key hint at the bottom hides while it shows. Never in replays, never under the shutter.
const SUB_DELAY = 2, SUB_CARD = 6, SUB_TOTAL = 6;
let sub = null;
const gameClock = () => nowS() - gameT0;   // pauses with the out-of-lives freeze and a hidden tab
function subCardUp(id){
  const g = GAMES[id];
  try { if (g && typeof g.cardUp === 'function') return !!g.cardUp(); if (id === 'tetris' && typeof TT === 'object' && TT) return TT.state === 'card'; } catch (e) {}
  return null;
}
function drawSub(){
  if (!sub || sub.tok !== gameTok) { sub = null; hintEl.style.opacity = ''; return; }
  const c = gameClock();
  if (sub.first == null && (subCardUp(sub.id) === false || c >= SUB_CARD)) sub.first = Math.min(c, SUB_CARD);
  if (sub.first == null || over) { hintEl.style.opacity = ''; return; }
  const lens = sub.parts.map(x => x.length), all = lens.reduce((a, b) => a + b, 0);
  const durs = lens.map(n => Math.max(2.6, SUB_TOTAL*n/all)), end = durs.reduce((a, b) => a + b, 0);
  const u = c - sub.first - SUB_DELAY;
  if (u < 0) return;
  if (u > end) { sub = null; hintEl.style.opacity = ''; return; }
  hintEl.style.opacity = '0';
  let i = 0, a = u; while (i < durs.length - 1 && a > durs[i]) { a -= durs[i]; i++; }
  const inK = clamp(a/0.14, 0, 1), outK = i === durs.length - 1 ? clamp((durs[i] - a)/0.5, 0, 1) : clamp((durs[i] - a)/0.12, 0, 1);
  if (i === 0 && a < 0.01 && !sub.flashed) { sub.flashed = true; window.SFX && SFX.play('pop', {p: 1.4, g: 0.4}); }
  ctx.save(); ctx.globalAlpha = Math.min(inK, outK);
  const fs = 23; font(fs, 600); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  // word by word with a real gap: Fredoka's own space is narrow, and the dark outline would close it up
  const gap = fs*0.36, wl = l => l.split(' ').reduce((w, x, j) => w + ctx.measureText(x).width + (j ? gap : 0), 0);
  const lines = wl(sub.parts[i]) > W*0.9 ? wrapLines(sub.parts[i], W*0.82) : [sub.parts[i]];
  const z = 1 + 0.12*(1 - inK);   // flashes in a touch big, settles
  ctx.translate(W/2, H - 22); ctx.scale(z, z);
  lines.forEach((l, k) => {
    const y = (k - (lines.length - 1))*28;
    for (const pass of [0, 1]) {
      let x = -wl(l)/2;
      for (const w of l.split(' ')) {
        if (pass) { ctx.fillStyle = inK < 1 ? '#fff6c8' : '#fff'; ctx.fillText(w, x, y); }
        else { ctx.lineWidth = 4.5; ctx.strokeStyle = 'rgba(12,8,24,.92)'; ctx.strokeText(w, x, y); }
        x += ctx.measureText(w).width + gap;
      }
    }
  });
  ctx.restore();
}
const menuApi = {
  play(id){ if (!GAMES[id]) return; replay = id; startGame(id, (secs, score) => { replay = null; showMenu(MENU.record(id, secs, score)); }); },
  story(){ RIDE.lives = LIVES; RIDE.failed = false; steps = FLOW; replay = null; go(RIDE_START); },
};
function showMenu(res){ MENU.enter(menuApi, res); hintEl.textContent = MENU.hint; }
function exitReplay(){ gameTok++; replay = null; showMenu(); }   // Esc or Skip during a replay: back to the menu, no time recorded
function go(i){
  gameTok++; goN++; replay = null; over = null; cuts = []; pops = []; sub = null; hintEl.style.opacity = '';
  si = ((i % steps.length) + steps.length) % steps.length; t0 = performance.now();
  const st = cur(), mySi = si;
  if (st.menu) { showMenu(); return; }
  if (st.lives) { livesPopped = 0; hintEl.textContent = ''; return; }
  if (st.intro) { const myGo = goN; hintEl.textContent = ''; INTRO.start(() => { if (goN === myGo) go(mySi + 1); }); return; }
  if (st.game && !GAMES[st.game]) { console.error('game not registered:', st.game); hintEl.textContent = 'missing game: ' + st.game; return; }
  if (st.game) { startGame(st.game, (secs, score) => { MENU.record(st.game, secs, score); go(mySi + 1); }); return; }
  hintEl.textContent = st.end ? (TOUCH ? LINES_MAIN.againTouch : LINES_MAIN.again) : (TOUCH ? LINES_MAIN.skipTouch : LINES_MAIN.skip);
}
function next(){ go(cur().end ? 0 : si + 1); }
// story clips play at 70% speed (Max, 12 Oct: "too fast paced animations, slow it down 30%"); games keep their own pace
const SCENE_SPEED = 0.7;
const isClip = () => !curGame() && !!cur().scene;
function draw(t, dt){
  if (isClip()) { t *= SCENE_SPEED; dt *= SCENE_SPEED; }
  const g = curGame();
  if (over && g && !replay) { CLOCK = over.ft; g.draw(over.ft, 0); return; }   // out of lives: the game is frozen under the shutter
  CLOCK = t;                                   // core.js step clock for the juice helpers (frozen by HOLD)
  if (g) g.draw(t, dt); else if (cur().lives) drawLivesCard(t); else if (cur().scene) cur().scene(t, dt);
}
function frame(now){
  const dt = HOLD ? 0 : clamp((now - last)/1000, 0, 0.05); last = now;   // never negative: the first rAF timestamp can precede last
  ctx.setTransform(S, 0, 0, S, 0, 0); ctx.clearRect(0, 0, W, H);
  const t = HOLD ? sim : (now - t0)/1000, s0 = goN;
  draw(t, dt);
  if (goN === s0) {   // the ride's hearts (and the shutter) sit over whatever game is running
    ctx.setTransform(S, 0, 0, S, 0, 0);
    if (sub && !replay && !over) drawSub(); else if (hintEl.style.opacity) hintEl.style.opacity = '';
    if (over) drawOver(dt);
    if (goN === s0 && livesOn()) drawHearts(dt);
  }
  if (!HOLD && goN === s0 && cur().dur && t*SCENE_SPEED > cur().dur) go(si + 1);
  if (!HOLD && goN === s0 && cur().lives && (t > LIVES_MAX || (window.AUTO && t > 2))) go(si + 1);
  if (innerWidth < innerHeight) {
    ctx.fillStyle = 'rgba(29,22,64,.92)'; ctx.fillRect(0, 0, W, H);
    nailong(W/2, H*0.5, 0.8, {rot: Math.sin(now/300)*0.4, mouth: 'open'});
    title('turn your phone sideways', W/2, H*0.62, 40);
  }
  requestAnimationFrame(frame);
}

// ---------- input: keys and pointer, pointer in virtual W x H coords ----------
addEventListener('keydown', e => {
  if (over) { overKey(e); return; }
  if (replay && e.key === 'Escape') { exitReplay(); return; }
  const g = curGame();
  if (g) { if (sub && sub.first == null && isAnyKey(e)) sub.first = gameClock(); g.key && g.key(e); return; }
  if (cur().intro) { INTRO.key(e, stepT()*SCENE_SPEED); return; }
  if (cur().lives) { if (isAnyKey(e) && stepT() >= LIVES_GO) { e.preventDefault(); next(); } return; }
  if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') next();
});
const vxy = e => [e.clientX * W / innerWidth, e.clientY * H / innerHeight];
cv.addEventListener('pointerdown', e => {
  if (over) { overPointer('down', ...vxy(e)); return; }
  const g = curGame();
  if (g) { if (sub && sub.first == null) sub.first = gameClock(); g.pointer && g.pointer('down', ...vxy(e)); }
  else if (cur().intro) INTRO.pointer('down', ...vxy(e), stepT()*SCENE_SPEED);
  else if (cur().lives) { if (stepT() >= LIVES_GO) next(); }
  else next();
});
cv.addEventListener('pointermove', e => {
  if (over) { overPointer('move', ...vxy(e)); return; }
  const g = curGame(); if (g && g.pointer) g.pointer('move', ...vxy(e));
  else if (!g && cur().intro) INTRO.pointer('move', ...vxy(e), stepT()*SCENE_SPEED);
});
addEventListener('pointerup', e => { if (over) return; const g = curGame(); if (g && g.pointer) g.pointer('up', ...vxy(e)); });
// clicked buttons drop focus at once, so Space can never press one a second time (Chrome focuses clicked buttons)
document.getElementById('skipBtn').onclick = e => { e.currentTarget.blur(); if (replay) exitReplay(); else if (cur().menu) return; else { const g = curGame(); g ? go(si + 1) : next(); } };

// Skip and Style are for testing only (Max, 12 Oct: "she doesn't get a skip button in the final version", "the sticker type is better")
if (DEV) for (const id of ['skipBtn', 'styleBtn']) document.getElementById(id).hidden = false;
let crayon = false, seed = 1;
document.getElementById('styleBtn').onclick = e => { e.currentTarget.blur(); crayon = !crayon; cv.style.filter = crayon ? 'url(#crayon)' : ''; e.target.textContent = 'Style: ' + (crayon ? 'crayon' : 'sticker'); };
setInterval(() => { if (crayon) document.getElementById('turb').setAttribute('seed', (seed = seed % 40 + 1)); }, 140);

// a hidden tab (cmd-tab, minimise) pauses the ride: clips resume where they were, and a replay time skips the hidden stretch
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) hiddenAt = performance.now();
  else if (hiddenAt) { const d = performance.now() - hiddenAt; t0 += d; last = performance.now(); gameT0 += d/1000; if (over) over.at += d; hiddenAt = 0; }
});

// the browser tab icon: Nailong's face, drawn here like everything else
try {
  const fc = document.createElement('canvas'); fc.width = fc.height = 64; const f = fc.getContext('2d');
  const dot = (x, y, r, col) => { f.beginPath(); f.arc(x, y, r, 0, Math.PI*2); f.fillStyle = col; f.fill(); };
  dot(32, 32, 30, C.line); dot(32, 32, 25, C.y);
  for (const ex of [22, 42]) { dot(ex, 28, 7, '#fff'); dot(ex, 28, 4, C.green); dot(ex, 28, 2.5, '#111'); }
  f.beginPath(); f.ellipse(32, 45, 8, 5, 0, 0, Math.PI*2); f.fillStyle = C.mouth; f.fill();
  document.querySelector('link[rel=icon]').href = fc.toDataURL();
} catch (e) {}

go(+(q.get('scene') || 0));
if (q.get('style') === 'crayon') document.getElementById('styleBtn').click();
const sim = +(q.get('sim') || 0);   // test hook: fast-forward the current step by N seconds at 60 fps
if (sim) { const s0 = goN; for (let k = 0; k < sim*60 && goN === s0; k++) { ctx.setTransform(S, 0, 0, S, 0, 0); draw(k/60, 1/60); simOff += 1/60; } t0 = performance.now() - sim*1000; }
// hold the first frame until Fredoka is in (at most 1.5 s), so the opening clip never starts in the fallback font.
// Meanwhile a bobbing Nailong on navy, no words. Test runs (?sim / ?hold) start at once.
if (sim || HOLD) requestAnimationFrame(frame);
else {
  const w0 = performance.now(); let waiting = true;
  const wait = () => {
    if (!waiting) return;
    const n = performance.now();
    ctx.setTransform(S, 0, 0, S, 0, 0); ctx.fillStyle = C.navy; ctx.fillRect(0, 0, W, H);
    nailong(W/2, H*0.62 - Math.abs(Math.sin(n/260))*18, 0.8, {mouth: 'smile', rot: Math.sin(n/250)*0.15});
    requestAnimationFrame(wait);
  };
  requestAnimationFrame(wait);
  const fontsIn = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('700 40px Fredoka'), document.fonts.load('500 40px Fredoka')]) : Promise.resolve();
  Promise.race([fontsIn.catch(() => {}), new Promise(r => setTimeout(r, 1500))]).then(() => {
    waiting = false; gameT0 += (performance.now() - w0)/1000;
    requestAnimationFrame(n => { t0 = last = n; frame(n); });   // the clip starts at exactly t = 0 on its first frame
  });
}
