"use strict";
// ---------- sound: tiny synthesized sfxr-style voices for the games, the story clips and the menu, plus the background music ----------
// Story clips have sound too now (Max, 12 Oct: "MORE SOUND EFFECTS"): story.js fires cues as a clip's clock passes them, the
// mini-games and the menu fire theirs on every physical moment. The names are a fixed list (SFX.names); an unknown name is a
// silent no-op, so a typo never throws.
// The music is an ORIGINAL slow Drake-style beat made here in WebAudio (real Drake songs are copyrighted and the game is on
// a public link): Fm7 / Dbmaj7 / Abmaj7 / Eb at 70 bpm, soft 808, low-passed pad, muted keys, hats with the odd roll, a clap
// on 3, a little reverb. No samples, no files. It starts on the first key or click and loops for the whole ride.
// MUSIC.cue('climax') swells the beat for a few seconds (story.js calls it when Mr Shou picks his books up), then settles back.
// Every hook elsewhere is written `window.SFX && SFX.play('pop')`, so deleting this file, its <script> tag and #muteBtn
// takes sound out everywhere and nothing else notices.
// The AudioContext is made on the first key or click (Safari only allows it inside a gesture).
// ?auto=1, ?hold=1 and ?sim= are test runs: no AudioContext is ever made there.
const LINES_SFX = {on: 'Sound: on', off: 'Sound: off'};

// a window property (not a const) so `window.SFX && SFX.play(...)` hooks find it, and are silent if this file is gone
window.SFX = (() => {
  const qs = new URLSearchParams(location.search);
  const TEST = qs.get('auto') === '1' || qs.get('hold') === '1' || qs.has('sim');
  const AC = window.AudioContext || window.webkitAudioContext;
  let ac = null, master = null, nb = null;
  const lastAt = {};

  // one envelope: a short rise then an exponential fall to silence, so no voice ever clicks
  function env(k, t, len, g, att = 0.005){
    const v = k.a.createGain();
    v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(g*k.g, t + att);
    v.gain.exponentialRampToValueAtTime(0.001, t + len); v.gain.linearRampToValueAtTime(0, t + len + 0.01);
    v.connect(k.out); return v;
  }
  // an oscillator sweeping f0 > f1 (Hz, times the pitch multiplier) over len seconds, starting `at` seconds in
  function tone(k, type, f0, f1, len, g = 1, at = 0, att){
    const t = k.t + at, o = k.a.createOscillator(), v = env(k, t, len, g, att);
    o.type = type; o.frequency.setValueAtTime(f0*k.p, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1*k.p, t + len);
    o.connect(v); o.start(t); o.stop(t + len + 0.03);
    return o;
  }
  // white noise through one filter whose frequency sweeps f0 > f1
  function noise(k, ftype, f0, f1, len, g = 1, at = 0, att){
    const t = k.t + at, s = k.a.createBufferSource(), f = k.a.createBiquadFilter(), v = env(k, t, len, g, att);
    s.buffer = k.nb; f.type = ftype; f.frequency.setValueAtTime(f0*k.p, t);
    if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1*k.p, t + len);
    s.connect(f); f.connect(v); s.start(t, (k.t*7.3) % 0.5); s.stop(t + len + 0.03);
  }
  // an oscillator through one filter (soft square / saw voices that would buzz raw)
  function ftone(k, type, f0, f1, len, g, at, ftype, ff, q = 0.8, att){
    const t = k.t + at, o = k.a.createOscillator(), f = k.a.createBiquadFilter(), v = env(k, t, len, g, att);
    o.type = type; o.frequency.setValueAtTime(f0*k.p, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1*k.p, t + len);
    f.type = ftype; f.frequency.value = ff; f.Q.value = q;
    o.connect(f); f.connect(v); o.start(t); o.stop(t + len + 0.03);
    return o;
  }
  // wobble an oscillator's pitch: rate in Hz, depth in Hz
  function vib(k, o, rate, depth, at, len){
    const t = k.t + at, l = k.a.createOscillator(), lg = k.a.createGain();
    l.frequency.value = rate; lg.gain.value = depth*k.p; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + len + 0.03);
  }
  const VOICES = {
    tick:   k => tone(k, 'sine', 700, 600, 0.04, 0.5),
    pop:    k => tone(k, 'sine', 300, 800, 0.08),
    thud:   k => { tone(k, 'sine', 150, 45, 0.16); noise(k, 'lowpass', 400, 400, 0.05, 0.8); },
    boing:  k => {
      const o = tone(k, 'sine', 220, 220, 0.28), t = k.t;
      o.frequency.exponentialRampToValueAtTime(520*k.p, t + 0.08); o.frequency.exponentialRampToValueAtTime(260*k.p, t + 0.28);
      const lfo = k.a.createOscillator(), lg = k.a.createGain();
      lfo.frequency.value = 12; lg.gain.value = 15*k.p; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + 0.31);
    },
    coin:   k => { tone(k, 'triangle', 988, 988, 0.05); tone(k, 'triangle', 1319, 1319, 0.09, 1, 0.05); },
    whoosh: k => noise(k, 'bandpass', 300, 1800, 0.25, 2.4, 0, 0.08),   // band-passed noise loses most of its level, so it is boosted to sit with the rest
    clink:  k => { tone(k, 'triangle', 1500, 1500, 0.07, 0.5); tone(k, 'triangle', 2250, 2250, 0.05, 0.3); },
    clear:  k => tone(k, 'triangle', 440, 880, 0.18),
    jingle: k => { tone(k, 'triangle', 523, 523, 0.1); tone(k, 'triangle', 659, 659, 0.1, 1, 0.1); tone(k, 'triangle', 784, 784, 0.3, 1, 0.2); },
    oof:    k => tone(k, 'triangle', 320, 110, 0.25),
    thwack: k => { noise(k, 'highpass', 1500, 1500, 0.04, 0.5); tone(k, 'sine', 240, 100, 0.08); },
    snip:   k => { noise(k, 'highpass', 4000, 4000, 0.03, 0.9); noise(k, 'highpass', 5000, 5000, 0.03, 0.8, 0.07); tone(k, 'triangle', 2400, 1800, 0.04, 0.35, 0.07); },   // scissors: two quick blade clicks
    shutter: k => { tone(k, 'sine', 120, 40, 0.45, 1.0); noise(k, 'lowpass', 900, 200, 0.5, 0.9, 0, 0.01); noise(k, 'bandpass', 2500, 1200, 0.12, 0.6, 0.02); },   // a heavy metal shutter hitting the floor
    // ---- round 3 (12 Oct): one voice for every physical moment in the clips and games ----
    slurp:  k => { noise(k, 'bandpass', 500, 900, 0.1, 2.2, 0, 0.02); noise(k, 'bandpass', 700, 1300, 0.1, 2.2, 0.11, 0.02); noise(k, 'bandpass', 900, 1900, 0.16, 2.2, 0.22, 0.02); },   // a boba straw: three rising sucks
    gulp:   k => { tone(k, 'sine', 420, 160, 0.09, 0.9); tone(k, 'sine', 260, 110, 0.13, 0.8, 0.09); },
    bigkick: k => { tone(k, 'sine', 170, 34, 0.42, 0.95); noise(k, 'lowpass', 700, 150, 0.2, 1.0, 0, 0.003); noise(k, 'highpass', 1800, 1800, 0.05, 0.4); },   // a cartoon boot into a wall
    books:  k => { for (const [at, f] of [[0, 190], [0.11, 165], [0.21, 210]]) { noise(k, 'bandpass', 1300, 900, 0.05, 1.2, at); tone(k, 'sine', f, 70, 0.1, 0.8, at + 0.02); } },   // three books land on the pile
    crash:  k => { noise(k, 'highpass', 3200, 1400, 0.7, 0.5, 0, 0.004); noise(k, 'lowpass', 600, 140, 0.25, 0.75); tone(k, 'sine', 95, 38, 0.3, 0.65); },
    dizzy:  k => { [[0, 1500, 1900], [0.13, 1900, 1400], [0.26, 1500, 1900], [0.39, 1900, 1400]].forEach(([at, a, b]) => tone(k, 'triangle', a, b, 0.08, 0.45, at)); },   // little birds circling the head
    scream: k => {   // a cartoon "AAAA": a saw with vibrato through two vowel formants, soft at the edges; o.p raises it, o.g makes it louder
      const t = k.t, o = k.a.createOscillator(), v = env(k, t, 0.95, 1.5, 0.06), f1 = k.a.createBiquadFilter(), f2 = k.a.createBiquadFilter(), lp = k.a.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(520*k.p, t); o.frequency.linearRampToValueAtTime(640*k.p, t + 0.25); o.frequency.linearRampToValueAtTime(560*k.p, t + 0.95);
      f1.type = 'bandpass'; f1.frequency.value = 820; f1.Q.value = 5; f2.type = 'bandpass'; f2.frequency.value = 1250; f2.Q.value = 6; lp.type = 'lowpass'; lp.frequency.value = 2600;
      o.connect(f1); o.connect(f2); f1.connect(lp); f2.connect(lp); lp.connect(v); o.start(t); o.stop(t + 1);
      vib(k, o, 7, 22, 0, 0.95);
    },
    engine: k => { const o = ftone(k, 'sawtooth', 55, 120, 0.65, 1.3, 0, 'lowpass', 420, 1.2, 0.04); vib(k, o, 22, 9, 0, 0.65); },   // a Camry revving
    honk:   k => { ftone(k, 'square', 415, 415, 0.32, 0.55, 0, 'lowpass', 1400, 0.7, 0.01); ftone(k, 'square', 330, 330, 0.32, 0.55, 0, 'lowpass', 1400, 0.7, 0.01); },
    splash: k => { noise(k, 'lowpass', 3200, 380, 0.5, 1.2, 0, 0.008); tone(k, 'sine', 1200, 1900, 0.05, 0.35, 0.16); tone(k, 'sine', 1000, 1600, 0.05, 0.3, 0.27); },
    chomp:  k => { for (const at of [0, 0.13]) { noise(k, 'bandpass', 900, 600, 0.05, 1.4, at); tone(k, 'triangle', 190, 90, 0.07, 0.7, at); } },
    squeak: k => { tone(k, 'sine', 1400, 2300, 0.07, 0.5); tone(k, 'sine', 2300, 1600, 0.09, 0.45, 0.07); },   // a rubber toy
    door:   k => { const o = ftone(k, 'sawtooth', 260, 210, 0.32, 0.7, 0, 'bandpass', 900, 3, 0.03); vib(k, o, 11, 18, 0, 0.32); tone(k, 'sine', 140, 55, 0.16, 0.9, 0.32); noise(k, 'lowpass', 500, 300, 0.06, 0.7, 0.32); },   // a creak, then it shuts
    glass:  k => { tone(k, 'triangle', 2600, 2600, 0.28, 0.5); tone(k, 'triangle', 3900, 3900, 0.2, 0.3, 0.005); tone(k, 'sine', 5200, 5200, 0.12, 0.2, 0.01); },
    firework: k => { tone(k, 'sine', 600, 1900, 0.5, 0.35, 0, 0.05); noise(k, 'lowpass', 2600, 280, 0.55, 1.1, 0.52, 0.004); for (const at of [0.72, 0.8, 0.9, 0.97]) noise(k, 'highpass', 5000, 5000, 0.025, 0.5, at); },   // whistle up, burst, crackle
    tram:   k => { for (const at of [0, 0.22]) { tone(k, 'triangle', 1046, 1046, 0.32, 0.6, at); tone(k, 'sine', 2093, 2093, 0.2, 0.25, at); } },   // the light rail's ding-ding
    swish:  k => noise(k, 'bandpass', 800, 3200, 0.15, 2.2, 0, 0.03),
    ding:   k => { tone(k, 'sine', 1318, 1318, 0.55, 0.7); tone(k, 'triangle', 2637, 2637, 0.3, 0.25); },
    buzz:   k => ftone(k, 'sawtooth', 140, 130, 0.3, 0.8, 0, 'lowpass', 900, 0.7, 0.01),   // a soft "nope"
    zip:    k => tone(k, 'triangle', 300, 1800, 0.12, 0.6),
    typing: k => { for (const at of [0, 0.07, 0.13, 0.22, 0.28, 0.36]) noise(k, 'highpass', 3000, 3000, 0.022, 0.7, at); },
    sad:    k => {   // sad trombone: wah wah wah waaah
      [[0, 392, 370, 0.25], [0.28, 370, 349, 0.25], [0.56, 349, 330, 0.25]].forEach(([at, a, b, l]) => ftone(k, 'sawtooth', a, b, l, 0.6, at, 'lowpass', 1100, 0.7, 0.03));
      const o = ftone(k, 'sawtooth', 330, 294, 0.75, 0.6, 0.84, 'lowpass', 1100, 0.7, 0.03); vib(k, o, 6, 7, 0.84, 0.75);
    },
  };

  // ---------- the music ----------
  // One 8-bar loop (4 chords, twice; the second time a little bell melody on top), scheduled one 1/16 step at a time just
  // ahead of the audio clock, so it loops with no seam. musicGraph(a, dest) builds it on any context, so a test can render
  // it into an OfflineAudioContext.
  const MUSIC_VOL = 0.16;                     // under the sound effects (their master is 0.25 and each voice peaks near it)
  const BPM = 70, STEP = 60/BPM/4, BAR = 16, LOOP = BAR*8;
  const mtof = m => 440*Math.pow(2, (m - 69)/12);
  // voicings close together so the pad moves smoothly: Fm7, Dbmaj7, Abmaj7, Eb (with its 9th on top), and each root for the 808
  const CHORDS = [
    {pad: [53, 56, 60, 63], root: 41},   // Fm7: F Ab C Eb
    {pad: [53, 56, 60, 61], root: 37},   // Dbmaj7: F Ab C Db
    {pad: [51, 55, 56, 60], root: 44},   // Abmaj7: Eb G Ab C
    {pad: [51, 55, 58, 65], root: 39},   // Eb: Eb G Bb, F on top
  ];
  // the bell line in bars 5 to 8: [step in the bar, midi note, length in steps]
  const MELODY = [
    [[0, 72, 6], [6, 68, 4], [10, 67, 2], [12, 68, 4]],   // C Ab G Ab over Fm7
    [[0, 65, 8], [10, 68, 3], [13, 72, 3]],                // F . Ab C over Db
    [[0, 75, 6], [6, 72, 4], [10, 67, 6]],                 // Eb C G over Ab
    [[0, 70, 6], [6, 67, 4], [12, 65, 4]],                 // Bb G F over Eb
  ];
  const BASS = [[0, 1.5], [7, 0.4], [10, 0.9]];           // 808 hits: [step, length in seconds]
  function impulse(a, secs, decay){
    const len = Math.floor(a.sampleRate*secs), b = a.createBuffer(2, len, a.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random()*2 - 1)*Math.pow(1 - i/len, decay); }
    return b;
  }
  function musicGraph(a, dest, noiseBuf){
    const bus = a.createGain(); bus.gain.value = 1;
    const comp = a.createDynamicsCompressor(); comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.3;
    bus.connect(comp); comp.connect(dest);
    const verb = a.createConvolver(); verb.buffer = impulse(a, 2.6, 2.8);
    const dark = a.createBiquadFilter(); dark.type = 'lowpass'; dark.frequency.value = 3200;
    const vRet = a.createGain(); vRet.gain.value = 0.5; verb.connect(dark); dark.connect(vRet); vRet.connect(bus);
    const sat = a.createWaveShaper(); const curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = i/511.5 - 1; curve[i] = Math.tanh(x*2.2)/Math.tanh(2.2); }
    sat.curve = curve;
    const subLp = a.createBiquadFilter(); subLp.type = 'lowpass'; subLp.frequency.value = 700; sat.connect(subLp); subLp.connect(bus);
    const send = (node, g) => { const sg = a.createGain(); sg.gain.value = g; node.connect(sg); sg.connect(verb); };
    // a gain envelope: up over att, hold, down exponentially to silence over rel
    const envG = (t, peak, att, hold, rel) => {
      const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + att);
      g.gain.setValueAtTime(peak, t + att + hold); g.gain.exponentialRampToValueAtTime(0.0001, t + att + hold + rel); return g;
    };
    function pad(notes, t, len){
      const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.6;
      lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(1100, t + len*0.45); lp.frequency.linearRampToValueAtTime(650, t + len + 0.8);
      const g = envG(t, 0.05, 0.9, Math.max(0, len - 0.9), 1.1); lp.connect(g); g.connect(bus); send(g, 0.6);
      for (const m of notes) for (const det of [-7, 7]) {
        const o = a.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = det;
        o.connect(lp); o.start(t); o.stop(t + len + 2);
      }
    }
    // muted electric piano: a sine with a sine modulating it, the brightness dying away fast
    function keys(m, t, vel, len = 1.4){
      const f = mtof(m), c = a.createOscillator(), mo = a.createOscillator(), mg = a.createGain(), lp = a.createBiquadFilter();
      c.frequency.value = f; mo.frequency.value = f; mg.gain.setValueAtTime(f*1.6, t); mg.gain.exponentialRampToValueAtTime(f*0.08, t + 0.5);
      mo.connect(mg); mg.connect(c.frequency); lp.type = 'lowpass'; lp.frequency.value = 2000;
      const g = envG(t, vel, 0.006, 0.02, len); c.connect(lp); lp.connect(g); g.connect(bus); send(g, 0.5);
      c.start(t); mo.start(t); c.stop(t + len + 0.1); mo.stop(t + len + 0.1);
    }
    function bass(m, t, len, slide){
      const f = mtof(m), o = a.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(f*2.2, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.045);
      if (slide) o.frequency.exponentialRampToValueAtTime(f*slide, t + len*0.8);
      const g = envG(t, 0.62, 0.004, 0.05, len); o.connect(g); g.connect(sat); o.start(t); o.stop(t + len + 0.1);
    }
    function hat(t, vel, open){
      const sr = a.createBufferSource(), hp = a.createBiquadFilter(); sr.buffer = noiseBuf; hp.type = 'highpass'; hp.frequency.value = 7800;
      const g = envG(t, vel, 0.001, 0, open ? 0.16 : 0.035); sr.connect(hp); hp.connect(g); g.connect(bus);
      sr.start(t, (t*13.7) % 0.5); sr.stop(t + 0.25);
    }
    function clap(t){
      const sr = a.createBufferSource(), bp = a.createBiquadFilter(); sr.buffer = noiseBuf; bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.9;
      const g = a.createGain(); g.gain.setValueAtTime(0.0001, t);
      for (const d of [0, 0.012, 0.024]) { g.gain.linearRampToValueAtTime(0.28, t + d + 0.002); g.gain.exponentialRampToValueAtTime(0.05, t + d + 0.011); }
      g.gain.linearRampToValueAtTime(0.22, t + 0.038); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
      sr.connect(bp); bp.connect(g); g.connect(bus); send(g, 0.7); sr.start(t, (t*7.1) % 0.5); sr.stop(t + 0.3);
    }
    // everything that starts on one 1/16 step of the loop
    function step(n, t){
      const bar = Math.floor(n/BAR) % 8, st = n % BAR, ch = CHORDS[bar % 4];
      if (st === 0) { pad(ch.pad, t, STEP*BAR); for (const m of ch.pad) keys(m + 12, t + Math.random()*0.012, 0.045); }
      if (st === 10 && bar % 2 === 1) for (const m of ch.pad.slice(2)) keys(m + 12, t, 0.035, 0.9);
      for (const [bs, len] of BASS) if (st === bs) bass(ch.root, t, len, bar % 4 === 3 && bs === 10 ? 1.5 : 0);
      if (st === 8) clap(t);
      // hats: soft 16ths with an accent on the 8ths, two gaps for swing, a roll at the end of every 4th bar
      if (bar % 4 === 3 && st >= 12) { const n2 = st >= 14 ? 3 : 2; for (let k = 0; k < n2; k++) hat(t + k*STEP/n2, 0.06 + 0.02*k); }
      else if (st !== 3 && st !== 11) hat(t, st % 4 === 0 ? 0.11 : st % 2 === 0 ? 0.075 : 0.045, st === 14 && bar % 2 === 0);
      if (bar >= 4) for (const [ms, m, ln] of MELODY[bar - 4]) if (ms === st) keys(m + 12, t, 0.07, STEP*ln + 0.6);
    }
    return {step};
  }
  let mus = null;
  const NOMUSIC = qs.get('music') === '0';   // test hook: sound effects only
  function startMusic(){
    if (mus || !ac || ac.state !== 'running' || NOMUSIC) return;
    const out = ac.createGain(); out.gain.value = 0.0001; out.connect(ac.destination);
    out.gain.setValueAtTime(0.0001, ac.currentTime); out.gain.linearRampToValueAtTime(api.on ? MUSIC_VOL : 0.0001, ac.currentTime + 3);   // fades in
    mus = {out, g: musicGraph(ac, out, nb), n: 0, next: ac.currentTime + 0.12};
    const tick = () => {
      if (!mus || ac.state !== 'running') return;
      if (mus.next < ac.currentTime - 0.05) mus.next = ac.currentTime + 0.05;   // a throttled timer fell behind: skip ahead, never play a pile of late notes
      while (mus.next < ac.currentTime + 0.3) { try { mus.g.step(mus.n, mus.next); } catch (e) {} mus.next += STEP; mus.n = (mus.n + 1) % LOOP; }
    };
    tick(); mus.timer = setInterval(tick, 50);
  }
  function musicLevel(){
    if (!mus) return;
    const g = mus.out.gain, t = ac.currentTime;
    g.cancelScheduledValues(t); g.setValueAtTime(Math.max(0.0001, g.value), t); g.linearRampToValueAtTime(api.on ? MUSIC_VOL : 0.0001, t + 0.25);
  }
  // the climax: the beat swells (louder, a rising pad chord opening its filter, a soft cymbal at the top), holds, then settles back
  function cue(name){
    try {
      if (name !== 'climax' || !mus || !api.on || ac.state !== 'running') return;
      const t = ac.currentTime, g = mus.out.gain, peak = MUSIC_VOL*1.9;
      g.cancelScheduledValues(t); g.setValueAtTime(Math.max(0.0001, g.value), t);
      g.linearRampToValueAtTime(peak, t + 0.9); g.setValueAtTime(peak, t + 3.2); g.linearRampToValueAtTime(MUSIC_VOL, t + 5);
      const ch = CHORDS[Math.floor(mus.n/BAR) % 4], lp = ac.createBiquadFilter(), sw = ac.createGain();
      lp.type = 'lowpass'; lp.Q.value = 2; lp.frequency.setValueAtTime(300, t); lp.frequency.exponentialRampToValueAtTime(3200, t + 1.2); lp.frequency.exponentialRampToValueAtTime(700, t + 4.5);
      sw.gain.setValueAtTime(0.0001, t); sw.gain.linearRampToValueAtTime(0.09, t + 1.1); sw.gain.setValueAtTime(0.09, t + 2.6); sw.gain.exponentialRampToValueAtTime(0.0001, t + 4.8);
      lp.connect(sw); sw.connect(mus.out);
      for (const m of [...ch.pad, ch.pad[0] + 12]) for (const det of [-9, 9]) {
        const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = det; o.connect(lp); o.start(t); o.stop(t + 5);
      }
      const cy = ac.createBufferSource(), hp = ac.createBiquadFilter(), cg = ac.createGain();
      cy.buffer = nb; hp.type = 'highpass'; hp.frequency.value = 5200;
      cg.gain.setValueAtTime(0.0001, t + 1.05); cg.gain.linearRampToValueAtTime(0.22, t + 1.08); cg.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
      cy.connect(hp); hp.connect(cg); cg.connect(mus.out); cy.loop = true; cy.start(t + 1.05); cy.stop(t + 3.3);
    } catch (e) {}
  }

  function unlock(){
    if (TEST || !AC) return;
    try {
      if (!ac) {
        ac = new AC();
        master = ac.createGain(); master.gain.value = 0.25; master.connect(ac.destination);
        nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
        const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2 - 1;
        // a one-sample silent blip inside the gesture: older WebKit only opens the output once something plays
        const s = ac.createBufferSource(); s.buffer = ac.createBuffer(1, 1, ac.sampleRate); s.connect(ac.destination); s.start(0);
      }
      if (ac.state !== 'running') { const p = ac.resume(); if (p && p.then) p.then(startMusic, () => {}); }
      else startMusic();
    } catch (e) {}
  }
  // a hidden tab pauses the ride, so the music pauses with it and carries on from the same beat
  document.addEventListener('visibilitychange', () => {
    if (!ac) return;
    try { if (document.hidden) ac.suspend(); else { const p = ac.resume(); if (p && p.catch) p.catch(() => {}); } } catch (e) {}
  });
  // kept on every gesture (cheap when already running): Safari can drop a context to 'interrupted' after a tab switch
  for (const ev of ['keydown', 'pointerdown', 'mousedown', 'touchend']) addEventListener(ev, unlock, true);

  const api = {
    on: true,
    names: Object.keys(VOICES),
    // play(name, {p: pitch multiplier, g: gain multiplier}). Silent no-op when muted, locked, unknown, or the same name < 40 ms ago.
    play(name, o = {}){
      try {
        if (!api.on || !ac || ac.state !== 'running' || !VOICES[name]) return;
        const now = performance.now();
        if (now - (lastAt[name] || -1e9) < 40) return;
        lastAt[name] = now;
        VOICES[name]({a: ac, out: master, nb, t: ac.currentTime, p: o.p || 1, g: o.g == null ? 1 : o.g});
      } catch (e) {}
    },
    toggle(){
      api.on = !api.on; label(); musicLevel();
      try { localStorage.setItem('nailong-sound', api.on ? '1' : '0'); } catch (e) {}
      if (api.on) api.play('pop');
      return api.on;
    },
    // test only: wire one voice onto any context (an OfflineAudioContext) to check it renders
    _render(a, out, buf, name, o = {}){ VOICES[name]({a, out, nb: buf, t: 0, p: o.p || 1, g: o.g == null ? 1 : o.g}); },
    // test only: schedule some bars of the music onto any context (an OfflineAudioContext) at the live level; returns its length in s
    _renderMusic(a, buf, bars = 8){ const out = a.createGain(); out.gain.value = MUSIC_VOL; out.connect(a.destination); const g = musicGraph(a, out, buf); for (let n = 0; n < bars*BAR; n++) g.step(n, 0.05 + n*STEP); return bars*BAR*STEP; },
    get musicOn(){ return !!mus; },
    cue,
  };
  try { if (localStorage.getItem('nailong-sound') === '0') api.on = false; } catch (e) {}

  const btn = document.getElementById('muteBtn');
  function label(){ if (btn) btn.textContent = api.on ? LINES_SFX.on : LINES_SFX.off; }
  label();
  if (btn) btn.onclick = e => { api.toggle(); e.currentTarget.blur(); };   // blur, so Space never presses it again
  // M toggles sound. Eaten here (capture phase), so no game ever sees it as "any key".
  addEventListener('keydown', e => {
    if ((e.key === 'm' || e.key === 'M') && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.stopImmediatePropagation(); e.preventDefault();
      if (!e.repeat) api.toggle();
    }
  }, true);
  return api;
})();
// the music's cues as their own global, so `window.MUSIC && MUSIC.cue('climax')` reads like what it does (a no-op with no sound)
window.MUSIC = {cue: name => window.SFX && SFX.cue && SFX.cue(name)};
