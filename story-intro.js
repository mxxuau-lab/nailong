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
// The send-off (after the scream, before the question): Max says "Nailong, sending you to BCC" (Max, 12 Oct 21:20), all of it in his bubble
// (Max, 13 Oct 14:15: "BCC isn't in big letters at the start", so the giant slamming letters are gone).
// Max, 13 Oct 10:50: "in the intro I'll fall at the same time as Nailong. ... I'll lift nai long over my heaed and toss him down, he falls
// through the roof into the chinese classroom." So the two of them fall side by side the whole time (no ground), Max swoops under
// Nailong, catches him over his head with his normal arms, heaves him up, leans back and throws him down head first off the
// bottom of the screen. Then the question, Max still falling.
// Yes: a hop and a fade to navy, then onYes() (the lives card). The Chinese room clip (sceneChineseA) opens with him crash-landing head first. Maybe / No: "Come back when you've got time...", fade to black, a 10 minute lock
// kept in localStorage (a refresh still shows it), a sleeping Nailong and a countdown; at 0 she can go back to the question.
// Test hooks: ?clip=sceneIntro, &answer=yes|maybe|no answers by itself at the question, ?unlock=1 clears the lock.
// Test runs (?auto=1, ?hold=1, ?sim=) never read or write the stored lock.
const LINES_INTRO = {
  hi: "Hi, you're playing",                        // Max's line (13 Oct: "hi, you're playing nai long lands in Canberra")
  gameName: 'Nailong Lands in Canberra.',          // the game's name (Max, 13 Oct)
  logo: 'NAILONG LANDS IN CANBERRA',               // the same name as a big sticker title
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
  // Max, 12 Oct 21:20: '...ending the intro with, "Nailong, sending you to BCC"'.
  sendTo: 'Nailong, sending you to BCC',           // Max's line, all of it in his bubble (Max, 13 Oct 14:15: no giant letters)
  trail: 'AAAAAA',                                 // placeholder, Max to edit (his scream trailing behind him as he flies off)
};

// beats, in scene seconds
const INTRO_HI = 0.7, INTRO_LOGO = 1.1, INTRO_FALL = 3.0, INTRO_POINT = 4.4, INTRO_LOUD = 6.8, INTRO_Q_T = 9.0;
const INTRO_DUR = INTRO_Q_T;   // the clip's length up to the send-off (then the toss, then it waits for her answer)
// the send-off (scene seconds from its start; 0.7 scene s = 1 real second): his line, the swoop and catch overhead, the heave, the throw down, then ask
// (his bubble reads for about 3.2 s of real time, then he swoops, catches, heaves, winds up and throws)
const SEND = {say: 0.5, out: 2.7, reach: 2.8, grab: 3.5, pull: 3.75, wind: 4.3, toss: 4.8, ask: 5.95, end: 6.35};
const NL_S = 0.62;          // Nailong's size all through the intro (beside Max, held over his head, thrown)
const NL_GRIP = [66, -40];  // where Max's hands hold him, in Nailong's own units: his sides, low on his tummy
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

  // ---- the clip: Max and Nailong falling side by side through the sky, the clouds rushing up past them ----
  scene(T, t){
    const ms = 1.12, k = ms*CAST.max.h, mx0 = W*0.2, my0 = H*0.86;
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
      c2(SEND.reach, 'zip', {p: 0.55, g: 1.2});                                       // he swoops over under Nailong
      c2(SEND.grab, 'squeak', {p: 1.1}); c2(SEND.grab + 0.08, 'scream', {p: 1.25, g: 0.6});   // caught overhead
      c2(SEND.pull, 'zip', {p: 1.3});                                                  // heaved up high
      c2(SEND.wind, 'squeak', {p: 0.8}); c2(SEND.toss - 0.05, 'whoosh', {p: 0.9, g: 1.3}); c2(SEND.toss + 0.02, 'scream', {p: 1.05, g: 1.1});
    }
    const fallOn = T >= INTRO_FALL, ft = Math.max(0, T - INTRO_FALL);
    const loud = clamp((T - INTRO_LOUD)/1.2, 0, 1), qk = clamp(ak/0.4, 0, 1);
    ctx.save();
    if (loud > 0 && T < INTRO_Q_T) ctx.translate(...fxShake(0.3 + 0.7*loud*(0.6 + 0.4*Math.sin(T*9)), 9));
    sky(); sun();
    // the sky streams up past them the whole time (faster once Nailong starts screaming, calmer after the throw)
    const rush = this.rushAt(T, sa);
    for (let i = 0; i < 9; i++) {
      const c = CLOUDS[i], span = H + 260, y = (((i/9)*span + c.x*120 - rush) % span + span) % span - 130;
      cloud(c.x*W, y, c.s*0.8);
    }
    // ---- where everyone is ----
    const R = this.rig(T, sa, mx0, my0, k);
    const {mx, my, lean, toWorld} = R;
    const nfx = mx0 + 200 + Math.sin(T*1.3)*12, nfy = my0 - 215 + Math.sin(T*2.3 + 1)*9 - 26*Math.max(0, Math.sin(clamp(ft/0.35, 0, 1)*Math.PI));   // Nailong beside him (a jolt as the gust hits)
    let N = {x: nfx, y: nfy, s: NL_S, rot: Math.sin(T*2)*0.12, arms: 'up', flail: T*5, look: [-0.8, 0.2], mouth: 'o'};   // falling quietly, wide-eyed
    if (fallOn) { N.rot = Math.sin(T*6)*0.45; N.flail = T*18; N.look = [0, -1]; N.mouth = 'open'; }   // then screaming
    let behind = false, thrown = null;
    if (sa >= SEND.reach && sa < SEND.toss) {
      const held = this.heldAt(sa, T, R);
      if (sa < SEND.grab) {   // he swoops in under Nailong; Nailong drifts down into his raised hands
        const u = ease(clamp((sa - SEND.reach - 0.12)/(SEND.grab - SEND.reach - 0.12), 0, 1));
        N.x = lerp(nfx, held.x, u); N.y = lerp(nfy, held.y, u) - 46*Math.sin(u*Math.PI); N.rot = lerp(N.rot, held.rot, u);
        N.look = [-0.4, 0.8];
      } else { N.x = held.x; N.y = held.y; N.rot = held.rot; N.sy = held.sy; N.look = sa < SEND.wind ? [0, 0.9] : [1, 0.6]; N.flail = sa*34; }
      behind = sa > SEND.reach + 0.25;   // over his head: behind it, his hands in front
    }
    if (sa >= SEND.toss) {   // thrown down, head first, off the bottom of the screen
      const rel = this.heldAt(SEND.toss, T - (sa - SEND.toss), this.rig(T - (sa - SEND.toss), SEND.toss, mx0, my0, k));
      const u = sa - SEND.toss, vx = 650, vy0 = 250, gr = 1300, vy = vy0 + gr*2*u;
      thrown = {x: rel.x + vx*u, y: rel.y + vy0*u + gr*u*u, u};
      const head = Math.atan2(vy, vx) + Math.PI/2;
      N = {x: thrown.x, y: thrown.y, s: NL_S, rot: lerp(rel.rot, head, ease(clamp(u/0.2, 0, 1))), arms: 'up', flail: sa*50, look: [0, -1], mouth: 'open'};
      behind = u < 0.15;   // stays behind his head until clear of his face
      if (N.y > H + 40) N = null;
    }
    // speed lines streaming up past the two of them
    if (!asking || this.mode === 'ask') {
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      const lines = (cx, cy, wd, n, sp) => { for (let i = 0; i < n; i++) { const lx = cx - wd/2 + (i + 0.5)*wd/n, ly = cy + 170 - ((rush*sp + i*137) % 380); ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx, ly - 44); ctx.stroke(); } };
      lines(mx, my - 160*k, 200, 5, 1.4);
      if (N && !thrown && sa < SEND.reach) lines(N.x, N.y - 60, 130, 4, 1.7);
      ctx.restore();
    }
    if (thrown && N && thrown.u < 0.6) this.trail(N, thrown.u);   // behind Max, so it never crosses his face
    if (N && behind) nailong(N.x, N.y, N.s, N);
    // Max: waves while he says hi, points at Nailong, looks worried when it gets loud; his own arms for the catch and the throw
    const wave = T < INTRO_POINT - 0.3 ? clamp((T - INTRO_HI + 0.2)/0.25, 0, 1) : 0;
    const pointK = T >= INTRO_POINT - 0.3 ? (T < INTRO_Q_T ? ease(clamp((T - INTRO_POINT + 0.3)/0.3, 0, 1)) : 1 - ease(clamp((T - INTRO_Q_T)/0.3, 0, 1))) : 0;
    const sh = toWorld(42, -158), aim = -Math.atan2(nfx - sh[0], (nfy - 55) - sh[1]) + lean;   // his arm angle pointing at Nailong
    const rest = -0.3;
    let armR = rest;
    if (wave > 0) armR = lerp(rest, -2.55 + Math.sin(T*9)*0.32, ease(wave));
    if (pointK > 0) armR = lerp(T < INTRO_Q_T ? -2.55 : rest, aim, pointK);   // from the wave straight over to the point, then back down
    const arms = this.armsAt(sa, R);
    let look = T < INTRO_HI ? [0.3, 0] : [0.3, 0];
    if (pointK > 0.5 || (fallOn && T < INTRO_Q_T)) look = [0.9, -0.5];
    if (sa >= SEND.out) look = sa < SEND.grab ? [0.6, -1] : sa < SEND.toss ? [0.1, -1] : sa < SEND.toss + 0.6 ? [1, 0.8] : [0.6, 0.1];
    if (asking) look = this.mode === 'no' ? [0, 0.6] : [0.6, 0.1];   // then on her and the buttons
    const mouth = this.mode === 'no' || (loud > 0.3 && T < INTRO_Q_T) || (sa >= SEND.wind && sa < SEND.toss + 0.25) ? 'o' : 'smile';
    ctx.save(); ctx.translate(R.piv[0], R.piv[1]); ctx.rotate(lean); ctx.translate(-R.piv[0], -R.piv[1]);
    person(mx, my, ms, CAST.max, {armR, armL: rest*(1 - pointK), finger: pointK >= 1 && !arms, look, mouth, noArms: !!arms});
    ctx.restore();
    if (arms) for (const h of arms) noodleArm(toWorld(...h.s), toWorld(...h.e), 0, 0, k);
    const head = my - 272*k;   // top of his head
    // his lines
    if (T >= INTRO_HI && T < INTRO_POINT - 0.4) bubble(LINES_INTRO.hi + ' ' + LINES_INTRO.gameName, mx + 30, head - 6, 34, Math.min(380, W*0.34));
    if (T >= INTRO_POINT && T < INTRO_LOUD + 0.8) bubble(LINES_INTRO.thatsNailong, mx + 40, head - 6, 38, 360);
    if (this.mode === 'no' && t - this.at > 0.35) bubble(LINES_INTRO.comeBack, mx + 30, head - 6, 34, Math.min(380, W*0.34));
    if (sa >= SEND.say && sa < SEND.out + 0.1) { ctx.save(); bubble(LINES_INTRO.sendTo, mx + 30, head - 6, 38, Math.min(560, W*0.46)); ctx.restore(); }
    // the name as a sticker title while he says it
    const lg = clamp((T - INTRO_LOGO)/0.35, 0, 1), lgOut = clamp((T - INTRO_FALL + 0.4)/0.4, 0, 1);
    if (lg > 0 && lgOut < 1) {
      ctx.save(); ctx.globalAlpha = 1 - lgOut; ctx.translate(W*0.72, H*0.5); const z = fxBack(lg); ctx.scale(z, z); ctx.rotate(-0.04 + Math.sin(T*1.7)*0.015);
      title(LINES_INTRO.logo, 0, 0, Math.min(70, W*0.5/LINES_INTRO.logo.length*1.75)); ctx.restore();
    }
    // Nailong notices: a "!" over him as the gust hits, just before the scream
    if (T >= INTRO_FALL - 0.15 && T < INTRO_FALL + 0.75) fxMark('bang', nfx + 34, nfy - 112, (T - INTRO_FALL + 0.15)/0.9, 0.9);
    // the scream: a few more letters and a bigger size every beat (0.7 scene s = 1 real second), then huge
    if (fallOn && T < INTRO_Q_T) {
      const beat = Math.floor(ft/0.7), n = Math.min(LINES_INTRO.scream.length, 3 + beat);
      if (beat !== this.lastBeat) { this.lastBeat = beat; window.SFX && SFX.play('scream', {p: 1 + Math.min(beat, 8)*0.03, g: 0.55 + Math.min(1.1, beat*0.12 + loud*0.6)}); }
      const txt = LINES_INTRO.scream.slice(0, n);
      font(100); const w100 = ctx.measureText(txt).width;
      const small = 30 + Math.min(beat, 6)*8, big = Math.min(190, W*0.9/w100*100);
      const size = lerp(small, big, ease(loud)), pulse = 1 + 0.06*Math.max(0, Math.sin(ft/0.7*Math.PI*2));
      const sx = lerp(nfx + 50 + w100*small/200, W*0.5, ease(loud)), sy = lerp(nfy - 70, H*0.27, ease(loud));   // out of his mouth to the right, then across the sky
      ctx.save(); ctx.globalAlpha = 1 - clamp((T - INTRO_Q_T + 0.7)/0.6, 0, 1); ctx.translate(sx, sy); ctx.scale(pulse, pulse); ctx.rotate(Math.sin(T*13)*0.02*loud);
      title(txt, 0, 0, size, '#fff'); ctx.restore();
    }
    if (N && !behind) nailong(N.x, N.y, N.s, N);
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

  // how far the clouds have streamed up (scene seconds in, px): steady, a gust when the scream starts, calmer after the throw
  rushAt(T, sa){
    const v = (TT) => 380*TT + 280*Math.max(0, TT - INTRO_FALL + 0.1);
    if (!(sa > SEND.toss)) return v(T);
    const u = sa - SEND.toss;
    return v(T - u) + 300*u + 180*(1 - Math.exp(-2*u));
  },
  // where Max is: falling on the left with a slow bob; swoops right and down under Nailong to catch him, heaves, leans; drifts back for the question
  rig(T, sa, mx0, my0, k){
    let sw = 0;
    if (sa >= SEND.reach) sw = sa < SEND.toss + 0.3 ? ease(clamp((sa - SEND.reach)/(SEND.grab - SEND.reach), 0, 1)) : 1 - ease(clamp((sa - SEND.toss - 0.3)/(SEND.ask - 0.05 - SEND.toss - 0.3), 0, 1));
    const ya = this.mode === 'yes' ? T + this.base - this.at : -1;
    const hop = (sa >= 0 && sa < 0.45 ? Math.abs(Math.sin(sa*9))*14 : 0) + (ya >= 0 && ya < 0.45 ? Math.abs(Math.sin(ya*9))*16 : 0);   // a bob as he starts, and a happy one for her Yes
    const heave = sa >= SEND.pull && sa < SEND.wind + 0.3 ? 14*Math.sin(clamp((sa - SEND.pull)/0.22, 0, 1)*Math.PI) : 0;   // he dips to heave Nailong up
    const mx = lerp(mx0, mx0 + 140, sw), my = lerp(my0, my0 + 44, sw) + Math.sin(T*1.7)*7*(1 - sw) - hop + heave;
    const lean = this.leanAt(sa) + Math.sin(T*1.1)*0.03*(1 - sw);
    const piv = [mx, my - 120*k], c = Math.cos(lean), s = Math.sin(lean);
    const toWorld = (lx, ly) => { const x = lx*k, y = (ly + 120)*k; return [piv[0] + c*x - s*y, piv[1] + s*x + c*y]; };
    return {mx, my, lean, piv, toWorld, k};
  },
  // Nailong held over Max's head (world feet position, rotation, squash), from the catch to the throw
  heldAt(sa, T, R){
    const lift = sa < SEND.pull ? 0 : fxBack(clamp((sa - SEND.pull)/0.45, 0, 1));   // caught a little low, then pushed up high
    const tilt = sa < SEND.wind ? 0 : -0.15*ease(clamp((sa - SEND.wind)/0.35, 0, 1)) + Math.sin(sa*40)*0.03;
    const gy = lerp(-256, -272, lift), g = R.k;   // the middle of his hands, in Max's own units
    const s = NL_S, c = Math.cos(R.lean + tilt), sn = Math.sin(R.lean + tilt);
    const mid = R.toWorld(0, gy), dy = -NL_GRIP[1]*s;   // from the hands down to Nailong's feet
    const sy = sa >= SEND.grab && sa < SEND.grab + 0.2 ? 1 - 0.12*Math.sin((sa - SEND.grab)/0.2*Math.PI) : 1;
    return {x: mid[0] - sn*dy, y: mid[1] + c*dy, rot: R.lean + tilt, sy, gy, tilt, gw: NL_GRIP[0]*s/g};
  },
  // Max's own arms (normal length) from his shoulders to his hands, in his own units, or null for person()'s arms
  armsAt(sa, R){
    if (sa < SEND.reach || sa >= SEND.ask) return null;
    const UPY = -168;
    const pol = (side, phi, L, up) => ({s: [side*42, lerp(-158, UPY, up)], e: [side*42 + L*Math.sin(phi), lerp(-158, UPY, up) + L*Math.cos(phi)]});
    const held = this.heldAt(Math.min(sa, SEND.toss), 0, R);
    // the hands on Nailong's sides, in Max's units (the tilt turns them about their middle)
    const hand = side => { const c = Math.cos(held.tilt), sn = Math.sin(held.tilt), x = side*held.gw; return [c*x, held.gy + sn*x]; };
    const polar = side => { const h = hand(side), dx = h[0] - side*42, dy = h[1] - UPY; let phi = Math.atan2(dx, dy); if (side > 0 && phi < 0) phi += Math.PI*2; if (side < 0 && phi > 0) phi -= Math.PI*2; return {phi, L: Math.hypot(dx, dy)}; };
    if (sa < SEND.grab) {   // both arms swing up from his sides to over his head
      const u = ease(clamp((sa - SEND.reach)/(SEND.grab - SEND.reach), 0, 1));
      const pR = polar(1), pL = polar(-1);
      return [pol(1, lerp(0.3, pR.phi, u), lerp(75, pR.L, u), u), pol(-1, lerp(-0.3, pL.phi, u), lerp(75, pL.L, u), u)];
    }
    if (sa < SEND.toss) return [1, -1].map(side => ({s: [side*42, UPY], e: hand(side)}));
    // the throw: his right arm swings over to the right and down after him, his left comes down its own side (never across his face), then both back to his sides
    const pR = polar(1), pL = polar(-1), FT = 1.3;
    const sw = ease(clamp((sa - SEND.toss)/0.18, 0, 1)), back = ease(clamp((sa - SEND.toss - 0.4)/0.5, 0, 1));
    const up = 1 - ease(clamp((sa - SEND.toss)/0.3, 0, 1));
    const phR = lerp(lerp(pR.phi, FT, sw), 0.3, back), phL = lerp(lerp(pL.phi, -1.0, sw), -0.3, back);
    const LR = lerp(lerp(pR.L, 78, sw), 75, back), LL = lerp(lerp(pL.L, 80, sw), 75, back);
    return [pol(1, phR, LR, up), pol(-1, phL, LL, up)];
  },

  // Max leans back for the wind-up and forward on the throw (radians about his waist)
  leanAt(sa){
    if (sa < SEND.wind) return 0;
    if (sa < SEND.toss) return lerp(0, -0.13, ease(clamp((sa - SEND.wind)/0.35, 0, 1)));
    const u = sa - SEND.toss;
    return u < 0.12 ? lerp(-0.13, 0.16, u/0.12) : 0.16*Math.exp(-(u - 0.12)*5)*Math.cos((u - 0.12)*11);
  },
  // speed streaks and his scream trailing behind him as he dives
  trail(P, u){
    ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 6;
    const vx = 650, vy = 250 + 2600*u, L = Math.hypot(vx, vy), bx = -vx/L, by = -vy/L, px = -by, py = bx;
    for (let i = 0; i < 4; i++) { const o = (i - 1.5)*22, x0 = P.x + px*o + bx*30, y0 = P.y + py*o + by*30; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + bx*(90 + i*20), y0 + by*(90 + i*20)); ctx.stroke(); }
    ctx.restore();
    ctx.save(); ctx.globalAlpha = clamp(1 - (u - 0.35)/0.25, 0, 1)*clamp(u/0.06, 0, 1);
    title(LINES_INTRO.trail, P.x + bx*150, P.y + by*150, 38, '#fff'); ctx.restore();
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
