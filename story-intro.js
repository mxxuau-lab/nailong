"use strict";
// ---------- the intro: Max says hi, Nailong falls screaming, "Have you got 15 min?" (story-intro.js, first in FLOW) ----------
// Max, 12 Oct: "it'll be an avatar of me in school uniform... then I say "Hi Crony, This is "the name of the game". then I point
// to the falling nai long screaming. that's Nai long. screaming intensifies to bigger letters. Have you got 15min? Yes, Maybe,
// No. maybe or no, she gets shut down for 10min, come back when you got time... it fades to black, she can't refresh to start
// the game."
// Max, 13 Oct: "the 15min has to come after the first bits of dialogue in the game". So the whole opening skit plays first
// (hi, that's Nailong, the scream, "Nailong, sending you to BCC" and the toss) and the question comes after it.
// Authored in SCENE seconds (main.js plays clips at 70%: 1 wall second = 0.7 scene seconds). Interactive at the question:
// main.js routes keys and clicks here (INTRO.key / INTRO.pointer) and calls INTRO.start(onYes) when the step begins.
// The send-off (after the scream, before the question): Max says "Nailong, sending you to BCC" (Max, 12 Oct 21:20): the words in his bubble, then giant letters, B first, C 1.5 s
// later, C again 0.2 s after that, each slamming in with a thud and a screen shake. His arms stretch weirdly long across the sky,
// grab the falling Nailong, reel him in over his head and toss him head first off screen (whoosh, scream). Then the question.
// Yes: a hop and a fade to navy, then onYes() (the lives card). The Chinese room clip (sceneChineseA) opens with him crash-landing head first. Maybe / No: "Come back when you've got time...", fade to black, a 10 minute lock
// kept in localStorage (a refresh still shows it), a sleeping Nailong and a countdown; at 0 she can go back to the question.
// Test hooks: ?clip=sceneIntro, &answer=yes|maybe|no answers by itself at the question, ?unlock=1 clears the lock.
// Test runs (?auto=1, ?hold=1, ?sim=) never read or write the stored lock.
const LINES_INTRO = {
  hi: 'Hi Crony, this is',                          // Max's line ("Hi Crony, This is ...")
  gameName: 'Nailong on the Loose.',               // the game's name: placeholder, Max may change it
  logo: 'NAILONG ON THE LOOSE',                    // the same name as a big sticker title. placeholder, Max to edit
  scream: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',      // Nailong's scream: shown a few more letters each beat
  thatsNailong: "That's Nailong.",                  // Max's line
  question: 'Have you got 15 min?',                // Max's line
  yes: 'Yes', maybe: 'Maybe', no: 'No',            // Max's buttons
  choose: 'arrows to choose, Enter to pick',
  comeBack: "Come back when you've got time...",   // Max's line
  lockTop: 'Nailong is napping. Back in',          // placeholder, Max to edit
  z: 'z',
  ready: "Nailong's awake. Got 15 min now?",        // placeholder, Max to edit
  again: 'Start again',                            // placeholder, Max to edit
  // Max, 12 Oct 21:20: '...ending the intro with, "Nailong, sending you to BCC"'. His bubble says the first part,
  // the giant letters say the rest, so together they read his line exactly.
  sendTo: 'Nailong, sending you to',               // Max's line (first part)
  bcc: ['B', 'C', 'C'],                            // Max's line (the rest): B, then C 1.5 s later, then C 0.2 s after that
  trail: 'AAAAAA',                                 // placeholder, Max to edit (his scream trailing behind him as he flies off)
};

// beats, in scene seconds
const INTRO_HI = 0.7, INTRO_LOGO = 1.1, INTRO_FALL = 3.0, INTRO_POINT = 4.4, INTRO_LOUD = 6.8, INTRO_Q_T = 9.0;
const INTRO_DUR = INTRO_Q_T;   // the clip's length up to the send-off (then the toss, then it waits for her answer)
// the send-off (scene seconds from its start; 0.7 scene s = 1 real second): his line, the three letters, the long arms, the toss, then ask
const SEND = {say: 0.5, b: 1.4, c1: 1.4 + 1.05, c2: 1.4 + 1.05 + 0.14,     // C lands 1.5 s (real) after B, the second C 0.2 s after that
  out: 3.75, reach: 3.85, grab: 4.55, pull: 4.8, wind: 5.35, toss: 5.85, star: 6.32, ask: 7.0, end: 7.4};
const INTRO_SEND_DUR = SEND.ask;   // the send-off's length in scene seconds (about 10 s real) before the question
const INTRO_LOCK_MIN = 10;     // Maybe or No locks the game this many minutes
const INTRO_KEY = 'nailong.lock.until';

const INTRO = {
  q: new URLSearchParams(location.search),
  mode: 'clip', base: 0, sent: false, sendAt: 0, askAt: 0, prevK: -1, sel: 0, pick: -1, at: 0, lockAt: 0, lastT: 0, onYes: null, until: 0, shakeT: -9, lastBeat: -1, readyAt: 0,
  test(){ return this.q.get('auto') === '1' || this.q.get('hold') === '1' || this.q.has('sim'); },
  readLock(){
    if (this.test()) return 0;
    try { return +localStorage.getItem(INTRO_KEY) || 0; } catch (e) { return 0; }
  },
  writeLock(v){
    if (this.test()) return;
    try { if (v) localStorage.setItem(INTRO_KEY, String(v)); else localStorage.removeItem(INTRO_KEY); } catch (e) {}
  },
  // main.js calls this when the step begins; onYes moves the ride on
  start(onYes){
    this.onYes = onYes; this.base = 0; this.sent = false; this.sendAt = 0; this.askAt = 0; this.prevA = -1; this.prevK = -1; this.sel = 0; this.pick = -1; this.at = 0; this.lastT = 0; this.lastBeat = -1; this.readyAt = 0; this.prevT = -1;
    if (this.q.get('unlock') === '1') this.writeLock(0);
    const u = this.readLock();
    if (u > Date.now()) { this.mode = 'lock'; this.until = u; this.lockAt = -99; }   // a refresh during the lock lands straight on it
    else { if (u) this.writeLock(0); this.mode = 'clip'; this.until = 0; }
  },
  lt(t){ return t - this.base; },
  answer(i, t){
    if (this.mode !== 'ask') return;
    this.pick = i; this.sel = i; this.at = t;
    if (i === 0) { this.mode = 'yes'; window.SFX && SFX.play('ding'); }
    else { this.mode = 'no'; window.SFX && SFX.play('sad'); }
    hintEl.textContent = '';
  },
  // back to the question after the lock: the skit was seen, so Max stands alone and asks again
  reask(t){ this.mode = 'ask'; this.base = t - INTRO_Q_T - 30; this.sent = true; this.sendAt = t - SEND.end - 30; this.askAt = t; this.prevA = 99; this.prevK = -1;
    this.pick = -1; this.sel = 0; this.writeLock(0); hintEl.textContent = LINES_INTRO.choose; },

  buttons(){
    const n = 3, gap = 30, w = Math.min(200, (W*0.56 - gap*(n - 1))/n), h = 104, x0 = W*0.69 - (w*n + gap*(n - 1))/2, y = H*0.55;
    return Array.from({length: n}, (_, i) => ({x: x0 + i*(w + gap), y, w, h}));
  },
  lockButton(){ const w = Math.min(380, W*0.32), h = 100; return {x: W/2 - w/2, y: H*0.5, w, h}; },

  draw(t, dt){
    if (t < this.lastT - 0.5) this.start(this.onYes);   // the clock went back (watch again): fresh intro
    this.lastT = t;
    if (this.mode === 'lock') { this.drawLock(t); return; }
    const T = this.lt(t);
    if (this.mode === 'clip' && T >= INTRO_Q_T) { this.mode = 'send'; this.sent = true; this.sendAt = t; this.prevA = -1; }
    if (this.mode === 'send' && t - this.sendAt >= SEND.ask) { this.mode = 'ask'; this.askAt = t; hintEl.textContent = LINES_INTRO.choose; }
    if (this.mode === 'ask') {   // test hooks and the bot answer by themselves
      const want = this.q.get('answer') || (window.AUTO ? 'yes' : '');
      if (want && t - this.askAt >= 1.0) this.answer(Math.max(0, ['yes', 'maybe', 'no'].indexOf(want)), t);
    }
    this.scene(T, t);
    if (this.mode === 'yes') {   // a hop, then to navy, the lives card's colour
      const a = t - this.at;
      if (a > 0.45) { ctx.fillStyle = `rgba(29,22,64,${clamp((a - 0.45)/0.55, 0, 1)})`; ctx.fillRect(0, 0, W, H); }
      if (a > 1.05) { this.mode = 'done'; const f = this.onYes; if (f) f(); return; }
    }
    if (this.mode === 'no') {
      const k = clamp((t - this.at - 2.6)/1.0, 0, 1);   // "Come back..." reads for about 3.7 s of real time, then the fade
      if (k > 0) { ctx.fillStyle = `rgba(0,0,0,${k})`; ctx.fillRect(0, 0, W, H); }
      if (k >= 1) { this.mode = 'lock'; this.until = Date.now() + INTRO_LOCK_MIN*60e3; this.lockAt = t; this.readyAt = 0; this.writeLock(this.until); }
    }
  },

  // ---- the clip: sky, Max on the left, Nailong falling far behind him ----
  scene(T, t){
    const gy = H*0.86, mx = W*0.2, ms = 1.12;
    // sounds on every beat: each fires once as the clock passes it
    const pv = this.prevT == null ? -1 : this.prevT; this.prevT = T;
    const cue = (at, n, o) => { if (pv < at && T >= at && window.SFX) SFX.play(n, o); };
    cue(INTRO_HI, 'pop'); cue(INTRO_LOGO, 'ding', {g: 0.7}); cue(INTRO_FALL - 0.1, 'whoosh', {p: 0.7}); cue(INTRO_POINT, 'pop', {p: 1.1});
    const asking = this.mode === 'ask' || this.mode === 'yes' || this.mode === 'no', ak = asking ? t - this.askAt : -1;
    const pk = this.prevK; this.prevK = ak;
    const cueQ = (at, n, o) => { if (pk < at && ak >= at && window.SFX) SFX.play(n, o); };
    cueQ(0, 'pop', {p: 0.9}); [0, 1, 2].forEach(i => cueQ(0.25 + i*0.15, 'boing', {p: 1.2 + i*0.15, g: 0.5}));
    if (this.mode === 'no') { const a = t - this.at; if (!this.fadeSaid && a > 2.6) { this.fadeSaid = true; window.SFX && SFX.play('whoosh', {p: 0.5}); } } else this.fadeSaid = false;
    const sa = this.sent ? t - this.sendAt : -1;   // seconds into the send-off (after the scream)
    if (sa >= 0) {
      const pa = this.prevA == null ? -1 : this.prevA; this.prevA = sa;
      const c2 = (at, n, o) => { if (pa < at && sa >= at && window.SFX) SFX.play(n, o); };
      c2(SEND.say, 'pop', {p: 1.05});
      c2(SEND.b, 'thud', {p: 0.8, g: 1.5}); c2(SEND.c1, 'thud', {p: 0.9, g: 1.5}); c2(SEND.c2, 'thud', {p: 0.7, g: 1.8});
      c2(SEND.b + 0.02, 'bigkick', {p: 0.7, g: 0.5}); c2(SEND.c2 + 0.02, 'bigkick', {p: 0.6, g: 0.7});
      c2(SEND.out, 'swish', {p: 0.8});
      c2(SEND.reach, 'zip', {p: 0.55, g: 1.2}); c2(SEND.reach + 0.45, 'boing', {p: 0.7});
      c2(SEND.grab, 'squeak', {p: 1.1}); c2(SEND.grab + 0.08, 'scream', {p: 1.25, g: 0.6});
      c2(SEND.pull, 'zip', {p: 1.3}); c2(SEND.pull + 0.45, 'boing', {p: 1.1, g: 0.7});
      c2(SEND.wind, 'squeak', {p: 0.8}); c2(SEND.toss - 0.05, 'whoosh', {p: 0.9, g: 1.3}); c2(SEND.toss + 0.02, 'scream', {p: 1.05, g: 1.1});
      c2(SEND.toss + 0.2, 'boing', {p: 0.6}); c2(SEND.star, 'ding', {p: 1.8, g: 0.8});
    }
    const fallOn = T >= INTRO_FALL, ft = Math.max(0, T - INTRO_FALL);
    // where Nailong is: drops in from above the top, then keeps falling "in place" (the sky rushes up past him)
    const nx = W*0.69 + Math.sin(T*1.3)*14, ny = lerp(-40, H*0.31, ease(clamp(ft/1.3, 0, 1)));
    const loud = clamp((T - INTRO_LOUD)/1.2, 0, 1), qk = clamp(ak/0.4, 0, 1);
    ctx.save();
    if (loud > 0 && T < INTRO_Q_T) ctx.translate(...fxShake(0.3 + 0.7*loud*(0.6 + 0.4*Math.sin(T*9)), 9));
    if (sa >= 0) {   // each letter slams the screen
      let k = 0, amp = 0;
      [[SEND.b, 16], [SEND.c1, 20], [SEND.c2, 28]].forEach(([at, am]) => { const u = sa - at; if (u >= 0 && u < 0.4) { const kk = 1 - u/0.4; if (kk*am > k*amp) { k = kk; amp = am; } } });
      if (k > 0) ctx.translate(...fxShake(k, amp));
    }
    sky(); sun();
    // the far sky streams up while he is falling, and eases to a stop once he has been thrown away
    const fr = sa > SEND.toss ? Math.max(0, T - sa + SEND.toss - INTRO_FALL) + 0.35*(1 - Math.exp(-(sa - SEND.toss)*2.5)) : ft;
    const rush = fr*fr*40 + fr*520;
    for (let i = 0; i < 9; i++) {
      const c = CLOUDS[i], span = H + 260, y = (((i/9)*span + c.x*120 - rush) % span + span) % span - 130;
      cloud(c.x*W, y, c.s*0.8);
    }
    if (fallOn && !(sa > SEND.toss)) {   // speed lines streaming up past him (gone once he is thrown)
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++) { const lx = nx - 60 + i*24, ly = ny - 30 - ((T*700 + i*137) % 200); ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx, ly - 46); ctx.stroke(); }
      ctx.lineCap = 'butt';
    }
    ground(gy);
    // Max: waves while he says hi, points up at Nailong, looks worried when it gets loud
    const wave = T >= INTRO_HI - 0.2 && T < INTRO_POINT - 0.3;
    const point = T >= INTRO_POINT - 0.3 && T < INTRO_Q_T;
    const armR = wave ? -2.55 + Math.sin(T*9)*0.32 : point ? lerp(-0.2, -2.55, ease(clamp((T - INTRO_POINT + 0.3)/0.3, 0, 1))) : 0;
    const longArms = sa >= SEND.reach && sa < SEND.end;   // back to his own arms once they have sprung back
    let look = point || (fallOn && T < INTRO_Q_T) ? [0.9, -0.9] : this.mode === 'no' ? [0, 0.6] : [0.3, 0];
    if (sa >= SEND.out) look = sa < SEND.wind ? [0.9, -0.8] : sa < SEND.toss ? [0.2, -1] : [1, -0.4];   // eyes on Nailong, then after him
    if (asking) look = this.mode === 'no' ? [0, 0.6] : [0.6, 0.1];   // then on her and the buttons
    const mouth = this.mode === 'no' || (loud > 0.3 && T < INTRO_Q_T) || (sa >= SEND.wind && sa < SEND.toss + 0.25) ? 'o' : 'smile';
    const ya = this.mode === 'yes' ? t - this.at : -1;
    const hop = (sa >= 0 && sa < 0.45 ? Math.abs(Math.sin(sa*9))*14 : 0) + (ya >= 0 && ya < 0.45 ? Math.abs(Math.sin(ya*9))*16 : 0);   // a hop as he starts, and a happy one for her Yes
    const lean = this.leanAt(sa);
    ctx.save(); ctx.translate(mx, gy - hop); ctx.rotate(lean); ctx.translate(-mx, -(gy - hop));
    person(mx, gy - hop, ms, CAST.max, {armR: longArms ? 0 : armR, finger: point && !longArms, look, mouth, noArms: longArms});
    ctx.restore();
    const head = gy - 272*CAST.max.h*ms;   // top of his head
    // his lines
    if (T >= INTRO_HI && T < INTRO_POINT - 0.4) bubble(LINES_INTRO.hi + ' ' + LINES_INTRO.gameName, mx + 30, head - 6, 34, Math.min(380, W*0.34));
    if (T >= INTRO_POINT && T < INTRO_LOUD + 0.8) bubble(LINES_INTRO.thatsNailong, mx + 40, head - 6, 38, 360);
    if (this.mode === 'no' && t - this.at > 0.35) bubble(LINES_INTRO.comeBack, mx + 30, head - 6, 34, Math.min(380, W*0.34));
    if (sa >= SEND.say && sa < SEND.out + 0.1) { ctx.save(); bubble(LINES_INTRO.sendTo, mx + 30, head - 6, 38, Math.min(520, W*0.42)); ctx.restore(); }
    // the name as a sticker title while he says it
    const lg = clamp((T - INTRO_LOGO)/0.35, 0, 1), lgOut = clamp((T - INTRO_FALL + 0.4)/0.4, 0, 1);
    if (lg > 0 && lgOut < 1) {
      ctx.save(); ctx.globalAlpha = 1 - lgOut; ctx.translate(W*0.64, H*0.5); const z = fxBack(lg); ctx.scale(z, z); ctx.rotate(-0.04 + Math.sin(T*1.7)*0.015);
      title(LINES_INTRO.logo, 0, 0, Math.min(70, W*0.55/LINES_INTRO.logo.length*1.75)); ctx.restore();
    }
    // the scream: a few more letters and a bigger size every beat (0.7 scene s = 1 real second), then huge
    if (fallOn && T < INTRO_Q_T) {
      const beat = Math.floor(ft/0.7), n = Math.min(LINES_INTRO.scream.length, 3 + beat);
      if (beat !== this.lastBeat) { this.lastBeat = beat; window.SFX && SFX.play('scream', {p: 1 + Math.min(beat, 8)*0.03, g: 0.55 + Math.min(1.1, beat*0.12 + loud*0.6)}); }
      const txt = LINES_INTRO.scream.slice(0, n);
      font(100); const w100 = ctx.measureText(txt).width;
      const small = 30 + Math.min(beat, 6)*8, big = Math.min(190, W*0.9/w100*100);
      const size = lerp(small, big, ease(loud)), pulse = 1 + 0.06*Math.max(0, Math.sin(ft/0.7*Math.PI*2));
      const sx = lerp(nx, W*0.5, ease(loud)), sy = lerp(ny + 46, H*0.27, ease(loud));
      ctx.save(); ctx.globalAlpha = 1 - clamp((T - INTRO_Q_T + 0.7)/0.6, 0, 1); ctx.translate(sx, sy); ctx.scale(pulse, pulse); ctx.rotate(Math.sin(T*13)*0.02*loud);
      title(txt, 0, 0, size, '#fff'); ctx.restore();
    }
    if (sa < 0) { if (fallOn) nailong(nx, ny, 0.5, {rot: Math.sin(T*6)*0.45, arms: 'up', flail: T*18, look: [0, -1], mouth: 'open'}); }
    else this.sendOff(sa, T, nx, ny, mx, gy - hop, ms, lean);
    ctx.restore();
    // the question and the three buttons
    if (asking) {
      const fade = this.mode === 'ask' ? 1 : clamp(1 - (t - this.at - 0.2)/0.35, 0, 1);
      ctx.save(); ctx.globalAlpha = this.mode === 'yes' ? clamp(1 - (t - this.at - 0.3)/0.3, 0, 1) : fade;
      ctx.save(); ctx.translate(W*0.69, H*0.44); const z = fxBack(qk); ctx.scale(z, z); title(LINES_INTRO.question, 0, 0, Math.min(66, W/16)); ctx.restore();
      const bs = this.buttons(), labels = [LINES_INTRO.yes, LINES_INTRO.maybe, LINES_INTRO.no], fills = [C.y, '#e9e3d2', '#e9e3d2'];
      bs.forEach((b, i) => {
        const app = clamp((ak - 0.25 - i*0.15)/0.35, 0, 1);
        const gone = this.pick >= 0 && i !== this.pick ? clamp((t - this.at)/0.25, 0, 1) : 0;
        if (gone < 1) { ctx.save(); ctx.globalAlpha *= 1 - gone; introBtn(b, labels[i], fills[i], app, this.sel === i && (this.mode === 'ask' || this.pick === i), this.pick === i && t - this.at < 0.15); ctx.restore(); }
      });
      ctx.restore();
    }
    const k0 = clamp(1 - T/0.5, 0, 1);   // fade up from navy at the very start
    if (k0 > 0 && this.mode === 'clip') { ctx.fillStyle = `rgba(29,22,64,${k0})`; ctx.fillRect(0, 0, W, H); }
  },

  // Max leans back for the wind-up and forward on the throw (radians about his feet)
  leanAt(sa){
    if (sa < SEND.wind) return 0;
    if (sa < SEND.toss) return lerp(0, -0.13, ease(clamp((sa - SEND.wind)/0.35, 0, 1)));
    const u = sa - SEND.toss;
    return u < 0.12 ? lerp(-0.13, 0.16, u/0.12) : 0.16*Math.exp(-(u - 0.12)*5)*Math.cos((u - 0.12)*11);
  },
  // ---- after her Yes: the letters, the long arms, the toss. Nailong's last falling spot is (nx, ny); Max's feet at (mx, my) ----
  sendOff(sa, T, nx, ny, mx, my, ms, lean){
    const k = ms*CAST.max.h;
    const toWorld = (lx, ly) => [mx + Math.cos(lean)*lx - Math.sin(lean)*ly, my + Math.sin(lean)*lx + Math.cos(lean)*ly];
    const shoulders = [toWorld(-42*k, -158*k), toWorld(42*k, -158*k)], rest = [toWorld(-42*k, -83*k), toWorld(42*k, -83*k)];
    const hold = toWorld(0, -350*k), wound = toWorld(-75*k, -330*k);
    // Nailong's pose: falling where he was, grabbed, reeled in overhead, wound back, thrown head first along an arc
    const P = {x: nx, y: ny, s: 0.5, rot: Math.sin(T*6)*0.45, arms: 'up', flail: T*18, look: [0, -1], mouth: 'open'};
    const vx = 2700, vy0 = -720, gr = 1250;
    if (sa >= SEND.grab) { P.look = [0, 0.6]; P.mouth = 'o'; P.flail = T*30; }
    if (sa >= SEND.pull) {
      const u = clamp((sa - SEND.pull)/(SEND.wind - SEND.pull), 0, 1), e = fxBack(u);
      P.x = lerp(nx, hold[0], e); P.y = lerp(ny, hold[1], e); P.s = lerp(0.5, 0.62, ease(u)); P.rot = lerp(P.rot, 0, ease(u)); P.mouth = 'open'; P.look = [-0.6, 0.4];
    }
    if (sa >= SEND.wind) {
      const u = ease(clamp((sa - SEND.wind)/0.4, 0, 1));
      P.x = lerp(hold[0], wound[0], u); P.y = lerp(hold[1], wound[1], u); P.s = 0.62; P.rot = lerp(0, 1.05, u) + Math.sin(sa*40)*0.04*u;
      P.arms = 'up'; P.flail = sa*40; P.look = [1, -0.5]; P.mouth = 'open';
    }
    let thrown = null;
    if (sa >= SEND.toss) {   // head first: his head points along the way he is flying
      const u = sa - SEND.toss, vy = vy0 + gr*2*u;
      thrown = {x: wound[0] + vx*u, y: wound[1] + vy0*u + gr*u*u};
      P.x = thrown.x; P.y = thrown.y; P.rot = Math.atan2(vy, vx) + Math.PI/2; P.arms = 'up'; P.flail = sa*50; P.look = [0, -1];
      if (u < 0.6) {   // speed streaks and the scream trailing behind him
        ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 6;
        for (let i = 0; i < 4; i++) {
          const du = 0.03 + i*0.035, uu = u - du; if (uu < 0) continue;
          const bx = wound[0] + vx*uu, by = wound[1] + vy0*uu + gr*uu*uu - 40*P.s + (i - 1.5)*16;
          ctx.beginPath(); ctx.moveTo(bx - 30, by); ctx.lineTo(bx - 120 - i*18, by - (vy0 + gr*2*uu)*0.035); ctx.stroke();
        }
        ctx.restore();
        ctx.save(); ctx.globalAlpha = clamp(1 - (u - 0.35)/0.25, 0, 1)*clamp(u/0.06, 0, 1);
        title(LINES_INTRO.trail, P.x - 120, P.y - 70, 38, '#fff'); ctx.restore();
      }
    }
    // where the hands are
    const hands = [0, 1].map(i => {
      const side = i ? 1 : -1;
      const grip = () => { const lx = side*50*P.s, ly = -78*P.s, c = Math.cos(P.rot), sn = Math.sin(P.rot); return [P.x + c*lx - sn*ly, P.y + sn*lx + c*ly]; };
      if (sa < SEND.reach) return rest[i];
      if (sa < SEND.grab) {   // out they go: a steady stretch, a touch past him, a wobble back onto him
        const u = (sa - SEND.reach)/(SEND.grab - SEND.reach), g = grip();
        const e = u < 0.72 ? 1.1*ease(u/0.72) : 1 + 0.1*Math.cos((u - 0.72)/0.28*Math.PI*1.5)*(1 - (u - 0.72)/0.28);
        return [lerp(rest[i][0], g[0], e), lerp(rest[i][1], g[1], e)];
      }
      if (sa < SEND.toss + 0.1) return grip();
      // let go: the arms spring back past his sides and wobble to rest
      const u = sa - SEND.toss - 0.1, rx = wound[0] + vx*0.1 + side*50*0.62, ry = wound[1] + vy0*0.1 + gr*0.01, sp = Math.exp(-u*4.5)*Math.cos(u*13);
      return [rest[i][0] + (rx - rest[i][0])*sp, rest[i][1] + (ry - rest[i][1])*sp];
    });
    // how much the arms wobble: a lot while they stretch out, a little while they hold, a lot again as they spring back
    let wob = 0;
    if (sa >= SEND.reach && sa < SEND.grab + 0.4) wob = 34*Math.sin(clamp((sa - SEND.reach)/(SEND.grab + 0.4 - SEND.reach), 0, 1)*Math.PI);
    else if (sa >= SEND.pull && sa < SEND.wind) wob = 22*Math.sin(clamp((sa - SEND.pull)/(SEND.wind - SEND.pull), 0, 1)*Math.PI);
    else if (sa >= SEND.toss) wob = 30*Math.exp(-(sa - SEND.toss)*3);
    // the letters: B, then C, then C, each slamming down from big with a ring of dust
    // then, as the arms set off, they tip over and drop out of the bottom of the screen one after another
    const sz = Math.min(250, W*0.19), cx = W*0.64, cy = H*0.56;
    [SEND.b, SEND.c1, SEND.c2].forEach((at, i) => {
      const u = sa - at, fu = Math.max(0, sa - SEND.out - i*0.06); if (u < 0 || fu > 0.7) return;
      const land = clamp(u/0.1, 0, 1), x = cx + (i - 1)*sz*0.8 + fu*(i - 1)*120, rot = [-0.07, 0.05, -0.03][i] + fu*fu*[-3, 2.5, 3.5][i];
      const sq = land < 1 ? lerp(2.8, 1, land*land) : 1 + 0.16*Math.sin((u - 0.1)*32)*Math.exp(-(u - 0.1)*9);
      if (land >= 1 && !fu) fxRing(x, cy + sz*0.35, (u - 0.1)/0.45, sz*0.2, sz*0.9, '#fff', 10);
      ctx.save(); ctx.globalAlpha = land; ctx.translate(x, cy - fu*260 + fu*fu*2200); ctx.rotate(rot); ctx.scale(sq, sq);
      font(sz); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      ctx.fillStyle = 'rgba(29,22,64,.28)'; ctx.fillText(LINES_INTRO.bcc[i], 9, 13);   // a drop shadow under the sticker
      ctx.lineWidth = sz*0.11; ctx.strokeStyle = C.line; ctx.strokeText(LINES_INTRO.bcc[i], 0, 0);   // a thinner outline than title(), so the B keeps its holes
      ctx.fillStyle = i ? '#e8423b' : C.y; ctx.fillText(LINES_INTRO.bcc[i], 0, 0);
      ctx.restore();
    });
    // the twinkle where he left the screen
    if (sa >= SEND.star && sa < SEND.star + 0.5) {
      const u = (sa - SEND.star)/0.5, r = 34*Math.sin(u*Math.PI), x = W - 60, y = clamp(wound[1] + vy0*0.47 + gr*0.47*0.47, 60, H*0.4);
      ctx.save(); ctx.translate(x, y); ctx.rotate(u*2); ctx.beginPath();
      for (let j = 0; j < 8; j++) { const r2 = j % 2 ? r*0.28 : r, an = j*Math.PI/4; if (j) ctx.lineTo(Math.cos(an)*r2, Math.sin(an)*r2); else ctx.moveTo(Math.cos(an)*r2, Math.sin(an)*r2); }
      ctx.closePath(); ctx.fillStyle = '#fff6c8'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
    }
    // draw: Nailong while held goes behind the arms (the hands hold him); once thrown he flies in front of everything
    if (!thrown) nailong(P.x, P.y, P.s, P);
    if (sa >= SEND.reach) for (let i = 0; i < 2; i++) noodleArm(shoulders[i], hands[i], wob*(i ? 1 : -0.8), sa*14 + i*1.7, k);
    if (thrown && thrown.x < W + 200) nailong(P.x, P.y, P.s, P);
  },

  // ---- the lock: black, a sleeping Nailong, a big countdown; at 0 she can start again ----
  drawLock(t){
    const k = clamp((t - this.lockAt)/0.6, 0, 1), left = Math.max(0, this.until - Date.now()), done = left <= 0;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = k;
    // Nailong asleep on his side, breathing, his eyes shut (open once the time is up)
    const nx = W*0.5 + 95, ny = H*0.84, s = 0.82, rot = -1.5, br = Math.sin(t*1.7);
    nailong(nx, ny, s, {rot, sx: 1 + br*0.012, sy: 1 + br*0.035, mouth: done ? 'smile' : 'o', blink: false, breathe: false, look: [0, 0]});
    if (!done) {
      ctx.save(); ctx.translate(nx, ny); ctx.rotate(rot); ctx.scale(s*(1 + br*0.012), s*(1 + br*0.035));
      for (const ex of [-25, 25]) { ell(ex, -140, 16.5, 16.5); ctx.fillStyle = C.y; ctx.fill(); ctx.beginPath(); ctx.arc(ex, -141, 13, 0.2*Math.PI, 0.8*Math.PI); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke(); }
      ctx.restore();
      for (let i = 0; i < 3; i++) {   // z z z drifting up off his head
        const u = ((t*0.45 + i/3) % 1), hx = nx - 150*s - 10, hy = ny - 120*s;
        ctx.save(); ctx.globalAlpha *= Math.sin(u*Math.PI); title(LINES_INTRO.z, hx - 10 + u*60 + Math.sin(u*7)*10, hy - u*170, 26 + u*40, '#fff'); ctx.restore();
      }
    }
    if (!done) {
      font(34, 500); ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(LINES_INTRO.lockTop, W/2, H*0.17);
      const secs = Math.ceil(left/1000), mm = Math.floor(secs/60), ss = secs % 60;
      const sh = t - this.shakeT < 0.35 ? Math.sin((t - this.shakeT)*60)*10*(1 - (t - this.shakeT)/0.35) : 0;
      ctx.save(); ctx.translate(W/2 + sh, H*0.36); title(mm + ':' + (ss < 10 ? '0' : '') + ss, 0, 0, Math.min(170, W/6), '#fff'); ctx.restore();
    } else {
      title(LINES_INTRO.ready, W/2, H*0.24, Math.min(54, W/20), '#fff');
      if (!this.readyAt) { this.readyAt = t; window.SFX && SFX.play('ding'); hintEl.textContent = ''; }
      introBtn(this.lockButton(), LINES_INTRO.again, C.y, clamp((t - this.readyAt)/0.35, 0, 1), true, false);
    }
    ctx.restore();
  },

  key(e, t){
    const k = e.key;
    if (this.mode === 'lock') {
      if (Date.now() >= this.until) { if (k === 'Enter' || k === ' ') { e.preventDefault(); this.readyAt = 0; window.SFX && SFX.play('pop'); this.reask(t); } }
      else if (!e.repeat && !e.metaKey && !e.ctrlKey) { this.shakeT = t; window.SFX && SFX.play('buzz', {g: 0.6}); }   // still asleep: the clock wobbles
      return;
    }
    if (this.mode !== 'ask') return;
    if (k === 'ArrowLeft' || k === 'ArrowUp') { if (this.sel > 0) { this.sel--; window.SFX && SFX.play('tick'); } }
    else if (k === 'ArrowRight' || k === 'ArrowDown') { if (this.sel < 2) { this.sel++; window.SFX && SFX.play('tick'); } }
    else if (k === 'Enter' || k === ' ') { e.preventDefault(); this.answer(this.sel, t); }
  },
  pointer(kind, x, y, t){
    if (this.mode === 'lock') {
      if (Date.now() < this.until) { if (kind === 'down') { this.shakeT = t; window.SFX && SFX.play('buzz', {g: 0.6}); } return; }
      const b = this.lockButton();
      if (kind === 'down' && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { this.readyAt = 0; window.SFX && SFX.play('pop'); this.reask(t); }
      return;
    }
    if (this.mode !== 'ask') return;
    const i = this.buttons().findIndex(b => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
    if (i < 0) return;
    if (this.sel !== i) { this.sel = i; window.SFX && SFX.play('tick'); }
    if (kind === 'down') this.answer(i, t);
  },
};

// one of Max's stretchy arms: a navy sleeve from the shoulder to the hand, wobbling like a noodle (wob = how far it bends)
function noodleArm(S, E, wob, ph, k){
  const dx = E[0] - S[0], dy = E[1] - S[1], len = Math.hypot(dx, dy) || 1, nx = -dy/len, ny = dx/len, N = 28, pts = [];
  for (let i = 0; i <= N; i++) {
    const u = i/N, off = Math.sin(u*Math.PI)*wob*Math.sin(ph + u*Math.PI*2.4)*Math.min(1, len/220);
    pts.push([S[0] + dx*u + nx*off, S[1] + dy*u + ny*off]);
  }
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const path = () => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); };
  path(); ctx.lineWidth = 30*k; ctx.strokeStyle = C.line; ctx.stroke();
  path(); ctx.lineWidth = 18*k; ctx.strokeStyle = '#232838'; ctx.stroke();
  ell(E[0], E[1], 11*k, 11*k); ctx.fillStyle = CAST.max.skin; ctx.fill(); ctx.lineWidth = 5*k; ctx.strokeStyle = C.line; ctx.stroke();
  ctx.restore();
}

// a big sticker button that pops in (app 0..1); the selected one has a white ring and leans in
function introBtn(b, text, fill, app, selected, pressed){
  if (app <= 0.01) return;
  const now = performance.now(), sc = fxBack(app)*(selected ? 1.07 + Math.sin(now/180)*0.012 : 1)*(pressed ? 0.92 : 1);
  ctx.save(); ctx.translate(b.x + b.w/2, b.y + b.h/2); ctx.scale(sc, sc); ctx.rotate(selected ? Math.sin(now/260)*0.015 : 0); ctx.lineJoin = 'round';
  rr(-b.w/2 + 7, -b.h/2 + 9, b.w, b.h, 26); ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fill();
  if (selected) { rr(-b.w/2 - 11, -b.h/2 - 11, b.w + 22, b.h + 22, 36); ctx.fillStyle = '#fff'; ctx.fill(); }
  rr(-b.w/2, -b.h/2, b.w, b.h, 26); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.line; ctx.stroke();
  let fs = 44; font(fs); while (ctx.measureText(text).width > b.w - 30 && fs > 20) font(--fs);
  ctx.fillStyle = C.line; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 2);
  ctx.restore();
}

// the clip by name (?clip=sceneIntro); main.js drives INTRO itself in the ride
function sceneIntro(t, dt){ INTRO.draw(t, dt || 0); }
