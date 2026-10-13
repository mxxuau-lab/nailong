"use strict";
// ---------- the end menu: every game, her best, Max's high score underneath ----------
// Most games score seconds from enter to api.done (lower is better). A game in MENU_SCORED ends with api.done(n) and
// scores n instead, higher is better (none at the moment); one in MENU_OWN_TIME passes its own seconds (the 360, Civic Dash). main.js calls MENU.record(id, secs, score).
// Her bests persist in localStorage (try/catch everywhere; works with no storage at all).

// TODO Max sets these after playing: his real time in seconds for each game. These are placeholders.
const MAX_SCORES = {
  octagon: 64.0,     // SECONDS (1:04.0), lower is better: a clean run with no bonks is about 61.6 s, so this is a good run with a few bonks and no falls. TODO Max sets this after playing
  tetris: 150,       // TODO Max sets these after playing
  bottlesort: 100,   // TODO Max sets these after playing
  battle: 150,       // TODO Max sets these after playing
  pingpong: 180,     // TODO Max sets these after playing
  runner: 98.0,      // SECONDS (1:38.0), lower is better: a clean run is about 1:44 on the clock before bao zi (each takes 1 s off), so this is a clean run that ate about six. TODO Max sets this after playing
  blockblast: 180,   // TODO Max sets these after playing
};
// games scored by a number they pass to api.done (higher is better) instead of seconds, and the unit it is shown in
const MENU_SCORED = {};   // (Civic Dash was scored in coins until 13 Oct; it is a time now, see MENU_OWN_TIME)
// timed games that time themselves and pass their own seconds to api.done (lower is better, shown like every other time):
// the 360 counts from the first start to the finish ring, without its instruction card (Max, 13 Oct: "this way we can do a timer")
// Civic Dash counts from the card to the finish line, through crashes, minus 1 s per bao zi (Max, 13 Oct: "the score for everything should be in time, including this one")
const MENU_OWN_TIME = {octagon: true, runner: true};

const LINES_MENU = {
  title: 'PLAY IT AGAIN',                         // TODO joke
  sub: "beat Max: faster times, bigger scores",     // TODO joke
  yours: 'YOUR BEST',
  none: 'not played yet',
  maxLabel1: "MAX'S", maxLabel2: 'HIGH SCORE',
  soon: 'COMING SOON',
  story1: 'WATCH THE',
  story2: 'STORY AGAIN',
  goBack: 'GO BACK',                               // on the story card after she ran out of lives and kept going
  units: {coins: n => n + ' coins', m: n => n + ' m'},
  beatBadge: 'BEAT MAX!',
  beat: 'YOU BEAT MAX!',                          // TODO joke
  beatSub: 'Max is taking this very well.',        // TODO joke
  vs: (a, b) => `${a}  vs  Max's ${b}`,
  cont: 'press Enter',
  pb: 'New best! Max is still ahead.',             // TODO joke
  slower: 'Not quite. Again?',                     // TODO joke
  hint: 'arrows to choose, Enter to play, Esc comes back here',
  // the 12 hour wait on the story card, and the fake checkout that "skips" it (Max, 12 Oct)
  lockIn: 'opens again in',                        // placeholder, Max to edit
  paySkip: 'pay $10 to skip',                      // placeholder wording of Max's "pay $10", Max to edit
  minus: '-1 min',                                 // placeholder, Max to edit
  redirect: 'Redirecting you to the payment page', // Max's line
  dot: '.',
  // the drawn checkout page: a made-up merchant, never a real company's name or logo (a copied payment page can get the site flagged)
  co: {
    merchant: 'Nailong Pay',                       // placeholder, Max to edit
    back: '\u2190',
    itemTop: 'Skip the 12 hour wait',              // placeholder, Max to edit
    amount: '$10.00',
    item: 'Skip the 12 hour wait',                 // placeholder, Max to edit
    qty: 'Qty 1',
    subtotal: 'Subtotal', total: 'Total due',
    payWith: 'Pay with card',
    email: 'Email', emailPh: 'you@example.com',
    card: 'Card information', cardPh: '1234 1234 1234 1234', exp: 'MM / YY', cvc: 'CVC',
    name: 'Cardholder name', namePh: 'Full name on card',
    country: 'Country or region', countryVal: 'Australia',
    pay: 'Pay $10.00',
    secure: 'Secure checkout',                     // placeholder, Max to edit
  },
  pokeTwice: 'You fell for it TWICE? Nailong is so disappointed.',   // placeholder, Max to edit (she pressed pay on the lives screen before)
  pokeOnce: 'You really thought that was real?',                     // placeholder, Max to edit (she never pressed pay before)
  // Max's head laughing beside that line (Max, 13 Oct: "you really thought that was real should have my character laughing"):
  // the sound-words that pop around him, one per "ha"
  laugh: ['HA', 'HA', 'HA!'],                                         // placeholder, Max to edit
  minuteOff: 'I took one minute off the timer for you though :)',    // Max's line
};
// The 12 hour wait (Max, 12 Oct: "to skip the 12h play again timer there's a pay $10"). Counted from when she first reaches the menu,
// kept in localStorage (test runs: memory only). Only the story card waits; the seven games stay open so she can beat Max's scores.
const MENU_LOCK_H = 12;
const MENU_LOCK_ALL = false;   // true: the seven game cards wait 12 hours too (Max may want this)

const MENU_GAMES = [
  {id: 'octagon',    name: 'THE 360',              icon: 'octagon'},
  {id: 'tetris',     name: 'NAILONG TETRIS',       icon: 'tetris'},
  {id: 'bottlesort', name: 'RESTOCK THE FRIDGE',   icon: 'bottles'},
  {id: 'battle',     name: 'THE TEXTBOOK FIGHT',   icon: 'book'},
  {id: 'pingpong',   name: 'NAILONG PING PONG',    icon: 'paddle'},
  {id: 'runner',     name: 'CIVIC DASH',           icon: 'car'},
  {id: 'blockblast', name: 'NAILONG BLOCK BLAST',  icon: 'blocks'},
];
const MENU_STORY = MENU_GAMES.length;   // index of the "watch the story again" card

const MENU_KEY = 'nailong.bests.v2';   // v2: one level per game and the runner in coins, so the old times are not comparable
const menuFmt = s => {
  if (s == null || !isFinite(s)) return '--';
  if (s < 60) return s.toFixed(1) + 's';
  const m = Math.floor(s / 60), r = s - m * 60;
  return m + ':' + (r < 10 ? '0' : '') + r.toFixed(1);
};
const menuVal = (id, v) => MENU_SCORED[id] ? (v == null || !isFinite(v) ? '--' : LINES_MENU.units[MENU_SCORED[id]](Math.round(v))) : menuFmt(v);
const menuBetter = (id, a, b) => MENU_SCORED[id] ? a > b : a < b;   // is score a better than score b for this game
const easeOutBack = x => { x = clamp(x, 0, 1); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const menuRand = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const MENU_CONF = ['#ff6b6b', '#FFD21F', '#5ec8ff', '#7ee08a', '#ff9bd2', '#ffffff', '#b58cff'];
// one yellow cursor frame glides between cards with a slight overshoot (Switch home menu), instead of each card lighting up on its own
const MENU_GLIDE = true;
const MENU_HOLD = new URLSearchParams(location.search).get('hold') === '1';
// when the BEAT MAX celebration is dismissed, the BEAT MAX! sticker slams onto that card (arcade NEW RECORD stamp)
const MENU_SLAM = true;
// on a card she has beaten, Max's time gets a red strike drawn through it once (crossed-out rival records on leaderboards)
const MENU_STRIKE = true;

const MENU = {
  title: 'PLAY IT AGAIN',
  hint: LINES_MENU.hint,
  bests: {}, sel: 0, selA: [], shake: [], clock: 0, cel: null, toast: null, res: null, api: null, autoWait: 0, cur: null, slam: null, struck: {},
  noStore: false, booted: false, first: 0, off: 0, pay: null, minusT: -1,

  load() {
    // the 360 used to be scored in metres; a best saved before it became a time (no octagonTime mark) is dropped, never read as seconds
    try { const o = JSON.parse(localStorage.getItem(MENU_KEY) || '{}'); for (const k in o) if ((k !== 'octagon' || o.octagonTime) && (k !== 'runner' || o.runnerTime) && k !== 'octagonTime' && k !== 'runnerTime' && typeof o[k] === 'number' && (o[k] > 0 || (MENU_SCORED[k] && o[k] >= 0))) this.bests[k] = o[k]; } catch (e) { /* no storage: memory only */ }
  },
  save() {
    if (this.noStore) return;
    try { localStorage.setItem(MENU_KEY, JSON.stringify({...this.bests, octagonTime: 1, runnerTime: 1})); } catch (e) { /* no storage: memory only */ }
  },
  testRun() { const q = new URLSearchParams(location.search); return window.AUTO || q.get('hold') === '1' || q.has('sim'); },
  // the 12 hour wait: the first time she reaches the menu starts it; each fake payment takes a minute off
  lockStart() {
    const q = new URLSearchParams(location.search), test = this.testRun();
    if (!test) try { this.first = +localStorage.getItem('nailong.menu.first') || 0; this.off = +localStorage.getItem('nailong.menu.off') || 0; } catch (e) {}
    if (!this.first) {
      this.first = Date.now() - (+q.get('waited') || 0)*3600e3;   // test hook: &waited=HOURS pretends she reached the menu that long ago
      if (!test) try { localStorage.setItem('nailong.menu.first', String(this.first)); } catch (e) {}
    }
  },
  lockLeft() { return this.first ? Math.max(0, this.first + MENU_LOCK_H*3600e3 - this.off*60e3 - Date.now()) : 0; },
  lockFmt(ms) { const s = Math.ceil(ms/1000), h = Math.floor(s/3600), m = Math.floor(s/60) % 60, x = s % 60; return h + ':' + (m < 10 ? '0' : '') + m + ':' + (x < 10 ? '0' : '') + x; },
  locked(i) { return (i === MENU_STORY || MENU_LOCK_ALL) && this.lockLeft() > 0; },
  takeMinute() {
    this.off++;
    if (!this.testRun()) try { localStorage.setItem('nailong.menu.off', String(this.off)); } catch (e) {}
  },
  fellBefore() {
    if (window.RIDE && RIDE.fell) return true;
    if (this.testRun()) return new URLSearchParams(location.search).get('fell') === '1';   // test hook: &fell=1
    try { return +localStorage.getItem('nailong.fell') > 0; } catch (e) { return false; }
  },

  // called by main.js whenever a game finishes (story run or replay). Returns what happened.
  record(id, secs, score) {
    if (!this.booted) { this.booted = true; this.load(); }
    let v = secs;
    if (MENU_SCORED[id]) {
      if (typeof score !== 'number' || !isFinite(score)) { console.warn('MENU: ' + id + ' finished without a score (api.done(n))'); return {id, secs: score, best: this.bests[id], isPB: false, beatMax: false}; }
      v = Math.max(0, Math.round(score));
    } else if (MENU_OWN_TIME[id] && typeof score === 'number' && isFinite(score) && score > 0) v = score;
    else if (!isFinite(secs) || secs <= 0) return {id, secs, best: this.bests[id], isPB: false, beatMax: false};
    const prev = this.bests[id], isPB = prev == null || menuBetter(id, v, prev);
    if (isPB) { this.bests[id] = v; this.save(); }
    const mx = MAX_SCORES[id];
    return {id, secs: v, best: this.bests[id], isPB, beatMax: mx != null && menuBetter(id, v, mx)};
  },

  enter(api, res) {
    this.api = api;
    const q = new URLSearchParams(location.search);
    if (!this.booted) {
      this.booted = true; this.load();
      if (q.get('demo')) {   // test hook: fake times in memory only, never saved
        this.noStore = true;
        Object.assign(this.bests, {octagon: 66.3, tetris: 210.4, bottlesort: 88.8, battle: 97.5, runner: 101.4});
      }
      if (q.get('celebrate') && !res) { const id = q.get('celebrate'), v = MENU_SCORED[id] ? Math.round(MAX_SCORES[id] * 1.5) : MAX_SCORES[id] * 0.6; this.bests[id] = v; res = {id, secs: v, best: v, isPB: true, beatMax: true}; }
    }
    if (!this.first) this.lockStart();
    this.cel = null; this.toast = null; this.res = res || null; this.autoWait = 0; this.slam = null; this.autoTried = this.autoTried || {}; this.pay = null;
    if (res) {
      if (res.isPB) window.SFX && SFX.play('coin', {p: 1.5});   // new best: a high coin over main.js's finish jingle (Block Blast new-best stinger)
      const i = MENU_GAMES.findIndex(g => g.id === res.id); if (i >= 0) this.sel = i;
      if (res.beatMax) this.cel = {t: 0, id: res.id, secs: res.secs, max: MAX_SCORES[res.id]};
      else this.toast = {t: 0, text: res.isPB ? LINES_MENU.pb : LINES_MENU.slower, i: this.sel};
    }
    this.hint = LINES_MENU.hint;
    this.cur = null;   // the glide frame snaps onto the selected card on its first draw
  },

  rects() {
    const cols = 4, gap = 18, mx = Math.max(36, W * 0.04), top = 128, bottom = H - 50;
    const cw = (W - mx * 2 - gap * (cols - 1)) / cols, ch = (bottom - top - gap) / 2;
    return Array.from({length: MENU_STORY + 1}, (_, i) => ({x: mx + (i % cols) * (cw + gap), y: top + Math.floor(i / cols) * (ch + gap), w: cw, h: ch}));
  },
  registered(i) { return i === MENU_STORY || !!GAMES[MENU_GAMES[i].id]; },
  // the celebration ends (key, click or the 8 s timeout, all three come here): the sticker then slams onto that game's card
  endCel() {
    const i = MENU_GAMES.findIndex(g => g.id === this.cel.id);
    this.cel = null;
    if (MENU_SLAM && i >= 0) this.slam = {i, t: 0, hit: false};
  },
  shakeX(i) { return this.shake[i] > 0 ? Math.sin(this.shake[i] * 60) * 8 * (this.shake[i] / .45) : 0; },

  activate(i) {
    if (!this.api) return;
    if (this.locked(i)) { this.startPay(); return; }
    if (i === MENU_STORY) { this.api.story(); return; }
    if (!this.registered(i)) { this.shake[i] = 0.45; return; }
    this.api.play(MENU_GAMES[i].id);
  },
  key(e) {
    if (this.pay) { e.preventDefault && e.preventDefault(); if (this.pay.t > PAY.ready && (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape')) this.endPay(); return; }
    if (this.cel) { if (this.cel.t > 0.5) this.endCel(); e.preventDefault && e.preventDefault(); return; }
    const k = e.key, n = MENU_STORY + 1, was = this.sel;
    if (k === 'ArrowRight') this.sel = Math.min(n - 1, this.sel + 1);
    else if (k === 'ArrowLeft') this.sel = Math.max(0, this.sel - 1);
    else if (k === 'ArrowDown') this.sel = Math.min(n - 1, this.sel + 4);
    else if (k === 'ArrowUp') this.sel = Math.max(0, this.sel - 4);
    else if (k === 'Enter' || k === ' ') this.activate(this.sel);
    else return;
    if (this.sel !== was) window.SFX && SFX.play('tick', {p: 1.1, g: 0.6});   // a soft tick per move (Switch home menu)
    this.toast = null; e.preventDefault && e.preventDefault();
  },
  pointer(kind, x, y) {
    if (kind === 'up') return;
    if (this.pay) { if (kind === 'down' && this.pay.t > PAY.ready) this.endPay(); return; }   // the checkout is a picture: nothing on it clicks
    if (this.cel) { if (kind === 'down' && this.cel.t > 0.5) this.endCel(); return; }
    const r = this.rects(); const i = r.findIndex(c => x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h);
    if (i < 0) return;
    if (this.sel !== i) { this.sel = i; this.toast = null; window.SFX && SFX.play('tick', {p: 1.1, g: 0.6}); }
    if (kind === 'down') this.activate(i);
  },

  draw(t, dt) {
    this.clock += dt;
    const c = this.clock, rects = this.rects();
    for (let i = 0; i < rects.length; i++) {
      this.selA[i] = lerp(this.selA[i] || 0, i === this.sel ? 1 : 0, Math.min(1, dt * 14));
      if (this.shake[i] > 0) this.shake[i] = Math.max(0, this.shake[i] - dt);
      if (MENU_STRIKE && i < MENU_STORY) {   // the strike draws on over 0.18 s, never under the celebration, after the sticker has landed
        const id = MENU_GAMES[i].id, b = this.bests[id], m = MAX_SCORES[id];
        if (b != null && m != null && menuBetter(id, b, m) && !this.cel && !(this.slam && this.slam.i === i && this.slam.t < .12)) this.struck[id] = Math.min(1, (this.struck[id] || 0) + dt / .18);
      }
    }
    if (this.toast) { this.toast.t += dt; if (this.toast.t > 3.4) this.toast = null; }
    if (this.cel) {
      this.cel.t += dt;
      if (this.cel.t > 8) this.endCel();
    }
    if (this.slam) { const s = this.slam; s.t += dt; if (!s.hit && s.t >= .12) { s.hit = true; this.shake[s.i] = .25; } if (s.t > .35) this.slam = null; }
    if (MENU_GLIDE) this.glide(rects[this.sel], dt);
    if (this.minusT >= 0) { this.minusT += dt; if (this.minusT > 2.6) this.minusT = -1; }
    if (this.pay) { this.pay.t += dt; this.drawPay(dt); return; }
    if (window.AUTO && !this.cel) {   // test bot: replay every game that has no time yet, to prove the loop works
      this.autoWait += dt;
      if (this.autoWait > 1.2) {
        this.autoWait = 0;
        const i = MENU_GAMES.findIndex((g, k) => this.registered(k) && this.bests[g.id] == null && !this.autoTried[g.id]);
        if (i >= 0) { this.sel = i; this.autoTried[MENU_GAMES[i].id] = true; this.activate(i); return; }
      }
    }
    this.bg(c);
    this.header(c);
    if (MENU_GLIDE) this.glideFrame(c);
    const order = rects.map((_, i) => i).sort((a, b) => (a === this.sel) - (b === this.sel));
    for (const i of order) this.card(i, rects[i], c);
    if (this.toast) {
      const r = rects[this.toast.i], a = clamp(Math.min(this.toast.t / 0.15, (3.4 - this.toast.t) / 0.4), 0, 1);
      ctx.save(); ctx.globalAlpha = a;
      bubble(this.toast.text, r.x + r.w / 2, r.y + 36, 26, 300);
      ctx.restore();
    }
    if (this.cel) this.celebrate();
  },

  bg(c) {
    ctx.fillStyle = C.navy; ctx.fillRect(0, 0, W, H);
    const blobs = [['#2a2062', .12, .3, 190], ['#33297a', .86, .2, 150], ['#2a2062', .7, .85, 230], ['#33297a', .2, .92, 170], ['#2a2062', .5, .5, 120]];
    blobs.forEach(([col, fx, fy, r], i) => { ell(W * fx + Math.sin(c * .4 + i) * 18, H * fy + Math.cos(c * .35 + i * 2) * 14, r, r * .9); ctx.fillStyle = col; ctx.fill(); });
    for (let i = 0; i < 26; i++) {   // slow flat confetti
      const x = menuRand(i) * W, y = ((menuRand(i + 50) * H + c * (14 + menuRand(i + 9) * 22)) % (H + 40)) - 20, s = 7 + menuRand(i + 3) * 9;
      ctx.save(); ctx.translate(x, y); ctx.rotate(c * (menuRand(i + 7) - .5) * 2 + i); ctx.fillStyle = MENU_CONF[i % MENU_CONF.length]; ctx.globalAlpha = .35;
      ctx.fillRect(-s / 2, -s / 3, s, s * .66); ctx.restore();
    }
  },

  header(c) {
    const mx = Math.max(36, W * 0.04);
    title(LINES_MENU.title, W / 2, 50, 58);
    font(24, 600); ctx.fillStyle = '#f3e9c6'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(LINES_MENU.sub, W / 2, 98);
    for (const side of [-1, 1]) {   // two Nailongs jumping in turns
      const ph = c * 5 + (side > 0 ? Math.PI : 0), jump = Math.abs(Math.sin(ph)), air = jump > .08;
      ctx.save(); ctx.translate(side < 0 ? mx + 70 : W - mx - 70, 124 - jump * 30); ctx.scale(side, 1);
      nailong(0, 0, .46, {arms: 'up', flail: c * 9, sx: air ? .94 : 1.12, sy: air ? 1.07 : .88, mouth: 'open', look: [side * .4, -.2]});
      ctx.restore();
    }
  },

  // the glide frame: a spring per axis and size (v += pull, v *= damping, x += v), snapped under ?hold and the test bot
  glide(tg, dt) {
    const k = this.cur;
    if (!k || MENU_HOLD || window.AUTO) { this.cur = {x: tg.x, y: tg.y, w: tg.w, h: tg.h, vx: 0, vy: 0, vw: 0, vh: 0}; return; }
    const damp = Math.pow(0.75, dt * 60);   // 0.75 per 60 Hz frame: about 8% overshoot, settled in under half a second
    for (const [p, v] of [['x', 'vx'], ['y', 'vy'], ['w', 'vw'], ['h', 'vh']]) { k[v] = (k[v] + (tg[p] - k[p]) * 220 * dt) * damp; k[p] += k[v] * dt; }
  },
  glideFrame(c) {   // drawn BEFORE the cards, so mid-glide it slides behind them and shows in the gaps
    const k = this.cur; if (!k) return;
    const a = this.selA[this.sel] || 0;
    ctx.save();
    ctx.translate(k.x + k.w / 2 + this.shakeX(this.sel), k.y + k.h / 2); ctx.rotate(a * Math.sin(c * 7) * 0.012); ctx.scale(1.06, 1.06);
    ctx.lineJoin = 'round'; rr(-k.w / 2 - 9, -k.h / 2 - 9, k.w + 18, k.h + 18, 28); ctx.fillStyle = C.y; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.line; ctx.stroke();
    ctx.restore();
  },

  card(i, r, c) {
    const isStory = i === MENU_STORY, g = isStory ? null : MENU_GAMES[i], ok = this.registered(i);
    const a = this.selA[i] || 0, sh = this.shakeX(i);
    ctx.save();
    ctx.translate(r.x + r.w / 2 + sh, r.y + r.h / 2); ctx.rotate(a * Math.sin(c * 7) * 0.012); const sc = 1 + a * 0.06; ctx.scale(sc, sc); ctx.translate(-r.w / 2, -r.h / 2);
    ctx.lineJoin = 'round';
    if (!MENU_GLIDE && a > .02) { rr(-9, -9, r.w + 18, r.h + 18, 28); ctx.fillStyle = C.y; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.line; ctx.stroke(); }
    const stripH = 62;
    rr(0, 0, r.w, r.h, 20);
    ctx.fillStyle = isStory ? C.y : (ok ? '#fff6d6' : '#cfc8b4'); ctx.fill();
    if (isStory) {
      ctx.save(); rr(0, 0, r.w, r.h, 20); ctx.clip();
      ctx.fillStyle = '#ffe66e'; ctx.fillRect(0, r.h * .55, r.w, r.h);
      ctx.restore();
      if (this.lockLeft() <= 0) {
        nailong(r.w * .4, r.h * .93, .6 + Math.sin(c * 4) * .008, {mouth: 'smile', arms: 'down', look: [Math.sin(c) * .6, 0]});
        ctx.beginPath(); const px = r.w * .8, py = r.h * .62; ctx.moveTo(px - 22, py - 30); ctx.lineTo(px + 30, py); ctx.lineTo(px - 22, py + 30); ctx.closePath();
        ctx.fillStyle = '#e8423b'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.line; ctx.stroke();
      }
      const left = this.lockLeft();
      if (left > 0) this.storyLocked(r, c, left);
      else if (window.RIDE && RIDE.failed) title(LINES_MENU.goBack, r.w / 2, 62, 44, '#fff');   // she ran out of lives and kept going: same action, restart the ride
      else { title(LINES_MENU.story1, r.w / 2, 44, 30, '#fff'); title(LINES_MENU.story2, r.w / 2, 82, 34, '#fff'); }
    } else {
      const best = this.bests[g.id], mx = MAX_SCORES[g.id], beat = best != null && mx != null && menuBetter(g.id, best, mx);
      const fit = (txt, px, maxW, w = 700) => { font(px, w); while (ctx.measureText(txt).width > maxW && px > 14) font(--px, w); };
      menuIcon(g.icon, r.w / 2, 78, 1, c, ok, a);
      const name = (GAMES[g.id] && GAMES[g.id].title) || g.name;
      let fs = 27; font(fs); while (ctx.measureText(name).width > r.w - 28 && fs > 14) { fs--; font(fs); }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = fs / 7; ctx.strokeStyle = C.line; ctx.lineJoin = 'round';
      ctx.strokeText(name, r.w / 2, 152); ctx.fillStyle = ok ? C.y : '#8a8470'; ctx.fillText(name, r.w / 2, 152);
      if (!ok) { ctx.fillStyle = '#6b6552'; font(20); ctx.fillText(LINES_MENU.soon, r.w / 2, 184); }
      else if (best == null) { ctx.fillStyle = '#8b6b3a'; font(20, 600); ctx.fillText(LINES_MENU.none, r.w / 2, 184); }
      else {
        font(15, 700); ctx.fillStyle = '#8b6b3a'; ctx.textAlign = 'right'; ctx.fillText(LINES_MENU.yours, r.w / 2 - 8, 184);
        fit(menuVal(g.id, best), 34, r.w / 2 - 14); ctx.fillStyle = beat ? '#1f9d3a' : C.line; ctx.textAlign = 'left'; ctx.fillText(menuVal(g.id, best), r.w / 2 + 2, 184);
      }
      // Max's strip, underneath
      ctx.save(); rr(0, 0, r.w, r.h, 20); ctx.clip();
      ctx.fillStyle = beat ? '#1f7a3a' : C.navy; ctx.fillRect(0, r.h - stripH, r.w, stripH);
      ctx.restore();
      ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; font(16, 700); ctx.fillStyle = '#f3e9c6'; ctx.fillText(LINES_MENU.maxLabel1, 16, r.h - stripH / 2 - 10); ctx.fillText(LINES_MENU.maxLabel2, 16, r.h - stripH / 2 + 10);
      ctx.textAlign = 'right'; fit(menuVal(g.id, mx), 32, r.w - 130); ctx.fillStyle = C.y; ctx.fillText(menuVal(g.id, mx), r.w - 16, r.h - stripH / 2);
      const sk = MENU_STRIKE && beat ? (this.struck[g.id] || 0) : 0;
      if (sk > 0) {   // Max's time struck through, his digits still readable underneath
        const w = ctx.measureText(menuVal(g.id, mx)).width, x0 = r.w - 16 - w - 6, y0 = r.h - stripH / 2 + 14, x1 = r.w - 16 + 6, y1 = r.h - stripH / 2 - 14, e = ease(sk);
        ctx.save(); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(lerp(x0, x1, e), lerp(y0, y1, e));
        ctx.lineWidth = 8; ctx.strokeStyle = C.line; ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = '#e8423b'; ctx.stroke(); ctx.restore();
      }
      if (beat && !(this.cel && this.cel.id === g.id)) {   // sticker (hidden under its own celebration, then slammed on)
        const sl = this.slam && this.slam.i === i ? this.slam.t : 1, k1 = clamp(sl / .12, 0, 1), k2 = sl < .12 ? 1 : ease(clamp((sl - .12) / .06, 0, 1));
        ctx.save(); ctx.translate(52, 30); ctx.rotate(-.3 + Math.sin(c * 5) * .04 - .3 * (1 - k1 * k1));
        const z = lerp(2.4, 1, k1 * k1); ctx.scale(z * lerp(1.25, 1, k2), z * lerp(.75, 1, k2));   // falls in big, squashes flat on impact
        ell(0, 0, 50, 22); ctx.fillStyle = '#e8423b'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.line; ctx.stroke();
        font(16); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(LINES_MENU.beatBadge, 0, 1);
        ctx.restore();
        if (sl < 1) fxRing(52, 30, (sl - .12) / .2, 20, 90, C.y, 4);
      }
    }
    if (!isStory && this.locked(i)) {   // MENU_LOCK_ALL: the card dims under a padlock and the same countdown
      ctx.save(); rr(0, 0, r.w, r.h, 20); ctx.fillStyle = 'rgba(29,22,64,.72)'; ctx.fill(); ctx.restore();
      menuLock(r.w / 2, r.h * .36, 1); title(this.lockFmt(this.lockLeft()), r.w / 2, r.h * .66, 34, '#fff');
    }
    rr(0, 0, r.w, r.h, 20); ctx.lineWidth = 6; ctx.strokeStyle = C.line; ctx.stroke();
    ctx.restore();
  },
  // the story card while it waits: its title, a padlock, the countdown, the pay button
  storyLocked(r, c, left) {
    const failed = window.RIDE && RIDE.failed;
    if (failed) title(LINES_MENU.goBack, r.w / 2, 40, 34, '#fff');
    else { title(LINES_MENU.story1, r.w / 2, 30, 22, '#fff'); title(LINES_MENU.story2, r.w / 2, 58, 26, '#fff'); }
    menuLock(34, r.h * .44, .62);
    font(16, 700); ctx.fillStyle = C.line; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(LINES_MENU.lockIn, r.w / 2 + 12, r.h * .37);
    let fs = 40; font(fs); while (ctx.measureText(this.lockFmt(left)).width > r.w - 80 && fs > 22) font(--fs);
    title(this.lockFmt(left), r.w / 2 + 12, r.h * .52, fs, '#fff');
    if (this.minusT >= 0) {   // after a fake payment: "-1 min" slaps on, then peels away
      const k = this.minusT, z = k < .15 ? lerp(2.2, 1, k / .15) : 1, a = clamp((2.6 - k) / .4, 0, 1);
      ctx.save(); ctx.globalAlpha *= a; ctx.translate(r.w - 46, r.h * .36); ctx.rotate(.25); ctx.scale(z, z);
      ell(0, 0, 42, 20); ctx.fillStyle = '#e8423b'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
      font(17); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(LINES_MENU.minus, 0, 1); ctx.restore();
    }
    const bw = Math.min(r.w - 36, 230), bh = 44, bx = (r.w - bw) / 2, by = r.h - bh - 16, pulse = 1 + Math.sin(c * 3.2) * .02;
    ctx.save(); ctx.translate(r.w / 2, by + bh / 2); ctx.scale(pulse, pulse); ctx.translate(-r.w / 2, -(by + bh / 2));
    rr(bx + 4, by + 5, bw, bh, 22); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fill();
    rr(bx, by, bw, bh, 22); ctx.fillStyle = '#e8423b'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
    let ps = 22; font(ps); while (ctx.measureText(LINES_MENU.paySkip).width > bw - 24 && ps > 14) font(--ps);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(LINES_MENU.paySkip, r.w / 2, by + bh / 2 + 1);
    ctx.restore();
  },

  // ---------- the fake checkout: fade to black, "Redirecting...", a drawn card checkout (nothing on it works), the poke ----------
  startPay() {
    this.pay = {t: 0, said: {}}; this.toast = null; hintEl.textContent = '';
    window.SFX && SFX.play('whoosh', {p: .8});
  },
  endPay() {
    if (!this.pay || this.pay.closing != null) return;
    this.pay.closing = this.pay.t; window.SFX && SFX.play('pop');
  },
  drawPay(dt) {
    const P = this.pay, t = P.t, once = (k, f) => { if (!P.said[k]) { P.said[k] = true; f(); } };
    this.bg(this.clock);   // the menu sits under the fade-out
    const toBlack = clamp(t / PAY.black, 0, 1);
    if (t < PAY.page) {
      ctx.fillStyle = `rgba(0,0,0,${toBlack})`; ctx.fillRect(0, 0, W, H);
      if (t > PAY.black) {   // white text and loading dots
        const u = t - PAY.black, a = clamp(u / .4, 0, 1) * clamp((PAY.page - t) / .25, 0, 1), n = 1 + Math.floor(u / .42) % 3;
        if (Math.floor(u / .42) !== P.lastDot) { P.lastDot = Math.floor(u / .42); window.SFX && SFX.play('tick', {p: .8, g: .35}); }
        ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle';
        ctx.font = `500 30px -apple-system, "SF Pro Text", "Segoe UI", Helvetica, Arial, sans-serif`; ctx.textAlign = 'left';
        const w = ctx.measureText(LINES_MENU.redirect + LINES_MENU.dot.repeat(3)).width;
        ctx.fillText(LINES_MENU.redirect + LINES_MENU.dot.repeat(n), W / 2 - w / 2, H / 2);
        ctx.restore();
      }
      return;
    }
    once('page', () => window.SFX && SFX.play('zip', {g: .5}));
    if (t < PAY.page + .4) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); }   // the page fades in from the black, not over a flash of the menu
    drawCheckout(clamp((t - PAY.page) / .3, 0, 1));
    if (t >= PAY.poke) {   // the poke: Nailong pops up over the dimmed page, then Max's line
      const u = t - PAY.poke;
      ctx.fillStyle = `rgba(29,22,64,${clamp(u / .4, 0, .72)})`; ctx.fillRect(0, 0, W, H);
      once('poke', () => window.SFX && SFX.play('boing', {p: .9}));
      const rise = ease(clamp(u / .55, 0, 1)), nx = W * .15, ny = H + 280 - rise * 310;
      nailong(nx, ny, 1.3, {look: [.8, -.1], mouth: 'open', arms: 'up', flail: t * 3});
      if (u > .5) bubble(this.fellBefore() ? LINES_MENU.pokeTwice : LINES_MENU.pokeOnce, nx + 300, ny - 250, 46, Math.min(620, W * .5));
      if (u > LAUGH.at && !this.fellBefore()) {   // with "You really thought that was real?": Max's head pops up top right, laughing
        const a = u - LAUGH.at;
        LAUGH.has.forEach((at, i) => { if (a >= at) once('ha' + i, () => window.SFX && SFX.play('oof', {p: LAUGH.p[i], g: .55})); });
        menuMaxLaugh(Math.min(W * .8, W - 200), H * .3, LAUGH.s, a);   // on a narrow window it keeps clear of the right edge
      }
      if (u > PAY.maxLine) {
        once('minute', () => { this.takeMinute(); window.SFX && SFX.play('coin', {p: 1.2}); });
        const k = fxBack(clamp((u - PAY.maxLine) / .35, 0, 1));
        ctx.save(); ctx.translate(W * .62, H * .8); ctx.scale(k, k); ctx.rotate(-.02);
        font(30, 700); const lw = Math.min(ctx.measureText(LINES_MENU.minuteOff).width + 56, W * .7);
        rr(-lw / 2 + 6, -40, lw, 84, 26); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fill();
        rr(-lw / 2, -46, lw, 84, 26); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.line; ctx.lineJoin = 'round'; ctx.stroke();
        ctx.fillStyle = C.line; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(LINES_MENU.minuteOff, 0, -3, lw - 40);
        ctx.restore();
      }
      if (t > PAY.ready && P.closing == null) {
        ctx.save(); ctx.globalAlpha = .6 + .4 * Math.sin(t * 5); font(24, 600); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(LINES_MENU.cont, W * .62, H * .93); ctx.restore();
      }
      if (t > PAY.auto) this.endPay();
    }
    if (P.closing != null) {   // back to the menu
      const k = clamp((t - P.closing) / .45, 0, 1);
      ctx.fillStyle = `rgba(29,22,64,${k})`; ctx.fillRect(0, 0, W, H);
      if (k >= 1) { this.pay = null; this.sel = MENU_STORY; this.minusT = 0; hintEl.textContent = this.hint; window.SFX && SFX.play('thwack', {p: 1.3, g: .6}); }
    }
  },

  celebrate() {
    const k = this.cel, t = k.t;
    ctx.fillStyle = 'rgba(29,22,64,' + clamp(t * 3, 0, .78) + ')'; ctx.fillRect(0, 0, W, H);
    // confetti bursts, stateless: position is a pure function of time
    for (let b = 0; b < 3; b++) {
      if (t < b * .45) continue;
      const u = t - b * .45, round = Math.floor(u / 2.2), tl = u - round * 2.2;
      for (let n = 0; n < 50; n++) {
        const sd = n + b * 77 + round * 301, x0 = W * (.2 + .3 * b), vx = (menuRand(sd) - .5) * 1100, vy = -500 - menuRand(sd + 1) * 750;
        const x = x0 + vx * tl, y = H * .62 + vy * tl + 450 * tl * tl;
        if (y > H + 30) continue;
        ctx.save(); ctx.translate(x, y); ctx.rotate(menuRand(sd + 2) * 6 + tl * (menuRand(sd + 3) - .5) * 16);
        const s = 10 + menuRand(sd + 4) * 12; ctx.fillStyle = MENU_CONF[n % MENU_CONF.length]; ctx.strokeStyle = C.line; ctx.lineWidth = 2;
        ctx.fillRect(-s / 2, -s / 3, s, s * .66); ctx.strokeRect(-s / 2, -s / 3, s, s * .66); ctx.restore();
      }
    }
    // Nailong jumping with his arms up, squashing on every landing
    const ph = t * 5, j = Math.abs(Math.sin(ph)), air = j > .1;
    nailong(W / 2, H * .97 - j * 130, 1.0, {arms: 'up', flail: t * 12, sx: air ? .92 : 1.18, sy: air ? 1.1 : .82, mouth: 'open', look: [Math.sin(t * 3) * .5, -.3]});
    const s = easeOutBack(t / .55) * (1 + Math.sin(t * 6) * .025);
    ctx.save(); ctx.translate(W / 2, H * .17); ctx.rotate(Math.sin(t * 4) * .03); ctx.scale(s, s);
    title(LINES_MENU.beat, 0, 0, Math.min(110, W / 11));
    ctx.restore();
    if (t > .5) {
      const a = clamp((t - .5) * 3, 0, 1); ctx.save(); ctx.globalAlpha = a;
      title(LINES_MENU.vs(menuVal(k.id, k.secs), menuVal(k.id, k.max)), W / 2, H * .17 + 100, 44, '#fff');
      font(28, 600); ctx.fillStyle = '#f3e9c6'; ctx.textAlign = 'center'; ctx.fillText(LINES_MENU.beatSub, W / 2, H * .17 + 156);
      ctx.restore();
    }
    if (t > 1.2) { ctx.save(); ctx.globalAlpha = .6 + .4 * Math.sin(t * 5); font(24, 600); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(LINES_MENU.cont, W / 2, H * .17 + 206); ctx.restore(); }   // under the words, clear of the jumping Nailong (it sat on his tummy)
  },
};

// the fake checkout's clock (seconds): to black, the redirect text, the page (3 s on its own), the poke, Max's line, Enter works, auto close
const PAY = {black: .7, page: 3.3, poke: 6.4, maxLine: 1.6, ready: 9.4, auto: 16};
// Max laughing at the poke (seconds after the poke): his head pops in just after the bubble, a "ha" every 0.16 s (the 'oof' voice
// pitched up, falling a little each time, so it reads as "HA ha ha ha ha"), s = his head's size
const LAUGH = {at: .55, has: [.05, .21, .37, .53, .69], p: [2.3, 2.2, 2.1, 2.0, 1.85], s: 1.7};

// Max's head (person() clipped just under the chin, like main.js's maxFace) laughing: it pops in, bounces on every "ha" and tips
// back, eyes squeezed shut (two upturned arcs over the face), mouth wide open, and LINES_MENU.laugh pops around him. (x, y) = the
// head's centre, a = seconds since it started
function menuMaxLaugh(x, y, s, a) {
  const p = CAST.max, k = s * p.h, beat = Math.abs(Math.sin(a * 11)), z = fxBack(clamp(a / .3, 0, 1));
  if (z <= .01) return;
  ctx.save(); ctx.translate(x, y - beat * 12 * k); ctx.rotate(-.16 + Math.sin(a * 11) * .07); ctx.scale(z, z);
  ctx.save(); ell(0, -4 * k, 56 * k, 50 * k); ctx.clip();
  person(0, 218 * k, s, p, {mouth: 'smile', look: [0, -.3]});
  // over the face, in person()'s own units
  ctx.translate(0, 218 * k); ctx.scale(k, k); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const ex of [-13, 13]) {
    ell(ex, -220, 7, 5.6); ctx.fillStyle = p.skin; ctx.fill();   // the open eyes go...
    ctx.beginPath(); ctx.moveTo(ex - 6.5, -217); ctx.quadraticCurveTo(ex, -227, ex + 6.5, -217); ctx.strokeStyle = C.line; ctx.lineWidth = 3.4; ctx.stroke();   // ...squeezed shut
    ell(ex + (ex < 0 ? -12 : 12), -210 + (a * 1.3 % 1) * 10, 2.6, 3.6); ctx.fillStyle = 'rgba(120,200,255,.85)'; ctx.fill();   // a tear of laughter rolling down
  }
  const open = .65 + .35 * beat, mb = -204 + 22 * open;   // the mouth opens wider on every "ha"
  const mouth = () => { ctx.beginPath(); ctx.moveTo(-16, -205); ctx.quadraticCurveTo(0, -207, 16, -205); ctx.quadraticCurveTo(15, mb, 0, mb + 1); ctx.quadraticCurveTo(-15, mb, -16, -205); ctx.closePath(); };
  mouth(); ctx.fillStyle = '#6a1c26'; ctx.fill();
  ctx.save(); mouth(); ctx.clip();
  ctx.fillStyle = '#fff'; ctx.fillRect(-17, -208, 34, 6);               // top teeth
  ell(0, mb - 1, 9, 6); ctx.fillStyle = '#e8707e'; ctx.fill();          // tongue
  ctx.restore();
  mouth(); ctx.strokeStyle = C.line; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
  // the sound-words, one per "ha", popping around his head (clear of the bubble and the minute line)
  const spots = [[-1.55, -.95, -.25], [1.35, -.9, .2], [1.45, .45, .12]];
  LINES_MENU.laugh.forEach((w, i) => {
    const t0 = .12 + i * .24, q = a - t0; if (q <= 0) return;
    const [sx, sy, r] = spots[i % spots.length], zz = fxBack(clamp(q / .2, 0, 1)) * (1 + .08 * Math.sin(a * 11 + i));
    ctx.save(); ctx.translate(sx * 56 * k, sy * 50 * k); ctx.rotate(r); ctx.scale(zz, zz); title(w, 0, 0, 30 * k, C.y); ctx.restore();
  });
  ctx.restore();
}

// a padlock: body and shackle, drawn around (x, y)
function menuLock(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.strokeStyle = C.line;
  ctx.beginPath(); ctx.arc(0, -18, 17, Math.PI, 0); ctx.lineWidth = 15; ctx.stroke(); ctx.lineWidth = 8; ctx.strokeStyle = '#c9ced6'; ctx.stroke();
  rr(-27, -18, 54, 44, 9); ctx.fillStyle = C.y; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.line; ctx.stroke();
  ell(0, 0, 6, 6); ctx.fillStyle = C.line; ctx.fill(); rr(-2.5, 0, 5, 14, 2); ctx.fill();
  ctx.restore();
}
// The checkout page, drawn flat in the look of an ordinary card checkout. A made-up merchant (LINES_MENU.co.merchant) and no
// real company's name, logo or card-brand marks. It is pixels on the canvas: nothing types, nothing clicks.
function drawCheckout(a) {
  const L = LINES_MENU.co, sys = (px, w = 400) => { ctx.font = `${w} ${px}px -apple-system, "SF Pro Text", "Segoe UI", Helvetica, Arial, sans-serif`; };
  const ink = '#1a1f36', grey = '#697386', soft = '#a3acb9', lineC = '#e3e8ee', blue = '#3b6fe0';
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  const mid = W * .5; ctx.fillStyle = '#f7f8fa'; ctx.fillRect(0, 0, mid, H);
  ctx.fillStyle = lineC; ctx.fillRect(mid, 0, 1, H);
  ctx.translate(0, Math.max(0, (H - 580) / 2));   // the content sits in the middle of the page
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  // left: the merchant, the amount, the line item
  const lx = Math.max(40, mid - 430), lw = mid - lx - 60;
  sys(20, 400); ctx.fillStyle = grey; ctx.fillText(L.back, lx, 64);
  ell(lx + 46, 64, 13, 13); ctx.fillStyle = C.y; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#d9b200'; ctx.stroke();
  ell(lx + 41, 61, 2.2, 2.2); ctx.fillStyle = ink; ctx.fill(); ell(lx + 51, 61, 2.2, 2.2); ctx.fill();
  sys(16, 600); ctx.fillStyle = ink; ctx.fillText(L.merchant, lx + 68, 64);
  sys(17, 500); ctx.fillStyle = grey; ctx.fillText(L.itemTop, lx, 140);
  sys(40, 600); ctx.fillStyle = ink; ctx.fillText(L.amount, lx, 186);
  const iy = 270;
  rr(lx, iy - 22, 44, 44, 8); ctx.fillStyle = '#fff3c4'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = lineC; ctx.stroke();
  ell(lx + 22, iy, 11, 11); ctx.lineWidth = 2; ctx.strokeStyle = '#b58900'; ctx.stroke(); ctx.beginPath(); ctx.moveTo(lx + 22, iy - 6); ctx.lineTo(lx + 22, iy); ctx.lineTo(lx + 27, iy + 3); ctx.stroke();
  sys(15, 500); ctx.fillStyle = ink; ctx.fillText(L.item, lx + 60, iy - 9);
  sys(13, 400); ctx.fillStyle = grey; ctx.fillText(L.qty, lx + 60, iy + 11);
  ctx.textAlign = 'right'; sys(15, 500); ctx.fillStyle = ink; ctx.fillText(L.amount, lx + lw, iy - 9);
  ctx.fillStyle = lineC; ctx.fillRect(lx + 60, iy + 40, lw - 60, 1);
  ctx.textAlign = 'left'; sys(15, 500); ctx.fillStyle = ink; ctx.fillText(L.subtotal, lx + 60, iy + 68);
  ctx.textAlign = 'right'; ctx.fillText(L.amount, lx + lw, iy + 68);
  ctx.fillStyle = lineC; ctx.fillRect(lx + 60, iy + 94, lw - 60, 1);
  ctx.textAlign = 'left'; sys(15, 600); ctx.fillStyle = ink; ctx.fillText(L.total, lx + 60, iy + 122);
  ctx.textAlign = 'right'; ctx.fillText(L.amount, lx + lw, iy + 122);
  // right: the card form, all greyed placeholders
  const rx = mid + 60, rw = Math.min(400, W - rx - 50);
  ctx.textAlign = 'left'; sys(20, 600); ctx.fillStyle = ink; ctx.fillText(L.payWith, rx, 64);
  const label = (txt, y) => { sys(13, 500); ctx.fillStyle = grey; ctx.fillText(txt, rx, y); };
  const box = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = '#d5dbe1'; ctx.stroke(); };
  const ph = (txt, x, y) => { sys(15, 400); ctx.fillStyle = soft; ctx.fillText(txt, x, y); };
  label(L.email, 106); box(rx, 120, rw, 40, 6); ph(L.emailPh, rx + 12, 140);
  label(L.card, 186);
  box(rx, 200, rw, 80, 6); ctx.fillStyle = '#d5dbe1'; ctx.fillRect(rx, 240, rw, 1); ctx.fillRect(rx + rw / 2, 240, 1, 40);
  ph(L.cardPh, rx + 12, 220); ph(L.exp, rx + 12, 260); ph(L.cvc, rx + rw / 2 + 12, 260);
  for (let k = 0; k < 3; k++) { rr(rx + rw - 30 - k * 30, 212, 24, 16, 3); ctx.fillStyle = ['#e3e8ee', '#d5dbe1', '#e9edf2'][k]; ctx.fill(); }   // plain card chips, no brand marks
  label(L.name, 306); box(rx, 320, rw, 40, 6); ph(L.namePh, rx + 12, 340);
  label(L.country, 386); box(rx, 400, rw, 40, 6); sys(15, 400); ctx.fillStyle = ink; ctx.fillText(L.countryVal, rx + 12, 420);
  ctx.strokeStyle = grey; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(rx + rw - 22, 416); ctx.lineTo(rx + rw - 17, 422); ctx.lineTo(rx + rw - 12, 416); ctx.stroke();
  rr(rx, 470, rw, 46, 6); ctx.fillStyle = blue; ctx.fill();
  sys(16, 600); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; const pw = ctx.measureText(L.pay).width;
  ctx.fillText(L.pay, rx + rw / 2 + 10, 493);
  const pad = (x, y, col) => { ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(x, y - 3, 3.6, Math.PI, 0); ctx.stroke(); rr(x - 5, y - 3, 10, 8, 1.5); ctx.fill(); };
  pad(rx + rw / 2 - pw / 2 - 6, 492, '#fff');
  sys(12, 400); ctx.fillStyle = soft; ctx.textAlign = 'center'; ctx.fillText(L.secure, rx + rw / 2 + 8, 540); pad(rx + rw / 2 - ctx.measureText(L.secure).width / 2 - 6, 540, soft);
  ctx.restore();
}

// little flat cut-out pictures, one per game, drawn around (cx, cy)
function menuIcon(kind, cx, cy, s, c, ok, a) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = C.line;
  const fill = (v) => { ctx.fillStyle = ok ? v : '#b9b29c'; ctx.fill(); ctx.stroke(); };
  if (kind === 'octagon') {
    ctx.rotate(a * c * 1.2);
    const pts = (R, rot) => Array.from({length: 8}, (_, k) => [Math.cos(rot + k * Math.PI / 4) * R, Math.sin(rot + k * Math.PI / 4) * R]);
    const cols = ['#ff6b6b', '#ff9f43', '#7ee08a', '#5ec8ff', '#5b7bff', '#b58cff', '#ff9bd2', '#FFD21F'];
    const o = pts(54, Math.PI / 8), n = pts(24, Math.PI / 8);
    for (let k = 0; k < 8; k++) { const k2 = (k + 1) % 8; ctx.beginPath(); ctx.moveTo(...o[k]); ctx.lineTo(...o[k2]); ctx.lineTo(...n[k2]); ctx.lineTo(...n[k]); ctx.closePath(); fill(cols[k]); }
    ctx.beginPath(); n.forEach((p, k) => k ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); fill('#fff');
  } else if (kind === 'tetris') {
    const sq = (x, y, col) => { rr(x, y, 28, 28, 5); fill(col); };
    sq(-14, -46, '#b58cff'); sq(-42, -18, '#b58cff'); sq(-14, -18, '#b58cff'); sq(14, -18, '#b58cff');   // T
    sq(-42, 10, '#5ec8ff'); sq(-14, 10, '#5ec8ff'); sq(14, 10, '#FFD21F');
  } else if (kind === 'bottles') {
    [[-40, '#e8423b'], [0, '#5ec8ff'], [40, '#7ee08a']].forEach(([x, col], k) => {
      ctx.save(); ctx.translate(x, 40); ctx.rotate(Math.sin(c * 6 + k) * a * .08);
      rr(-12, -92, 24, 30, 6); fill('#fff'); rr(-20, -68, 40, 72, 12); fill(col); rr(-12, -50, 24, 24, 4); fill('#fff6d6'); ctx.restore();
    });
  } else if (kind === 'book') {
    ctx.save(); ctx.rotate(-.12 + Math.sin(c * 5) * a * .08);
    rr(-40, -50, 80, 100, 8); fill('#e8423b'); rr(-40, -50, 14, 100, 6); fill('#b02a24');
    rr(-14, -30, 44, 36, 5); fill('#fff6d6'); ctx.beginPath(); ctx.moveTo(-6, -16); ctx.lineTo(22, -16); ctx.moveTo(-6, -4); ctx.lineTo(16, -4); ctx.stroke();
    ctx.restore();
  } else if (kind === 'paddle') {
    ctx.save(); ctx.rotate(-.5 + Math.sin(c * 6) * a * .15);
    rr(-9, 20, 18, 46, 6); fill('#c9925c'); ell(0, -8, 38, 44); fill('#e8423b'); ctx.restore();   // a plain bat, like the game's (Max, 13 Oct: "plain without the weird edges")
    ell(42, -34 + Math.sin(c * 8) * a * 8, 11, 11); fill('#fff');
  } else if (kind === 'car') {
    ctx.save(); ctx.translate(0, Math.sin(c * 14) * a * 2);
    rr(-62, -4, 124, 36, 12); fill('#9aa3ad'); ctx.beginPath(); ctx.moveTo(-38, -4); ctx.lineTo(-24, -30); ctx.lineTo(24, -30); ctx.lineTo(42, -4); ctx.closePath(); fill('#9aa3ad');
    ctx.beginPath(); ctx.moveTo(-30, -6); ctx.lineTo(-20, -25); ctx.lineTo(20, -25); ctx.lineTo(34, -6); ctx.closePath(); fill('#a8dcf5');
    for (const x of [-34, 34]) { ell(x, 34, 15, 15); fill('#2b2f3a'); ell(x, 34, 6, 6); fill('#ccc'); }
    ctx.restore();
  } else if (kind === 'blocks') {
    const cols = ['#ff6b6b', '#5ec8ff', '#7ee08a', '#FFD21F', '#b58cff', '#ff9bd2', '#ff9f43', '#5b7bff', '#7ee08a'];
    for (let k = 0; k < 9; k++) { const x = (k % 3 - 1) * 34 - 15, y = (Math.floor(k / 3) - 1) * 34 - 15; rr(x, y, 30, 30, 6); fill(cols[k]); }
  }
  ctx.restore();
}
