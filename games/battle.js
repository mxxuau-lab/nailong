// ---------- mini-game: THE TEXTBOOK BOUT (a tiny retro boss battle in the Brindy cafe) ----------
// Mr Shou throws Cambridge Methods textbooks, one at a time, and every book carries the key that beats it:
// SPACE swings the bao zi and bats a MIDDLE book back at him (the only way to hurt him; those books wear a red HIT tag), UP jumps a book
// sliding on the FLOOR, DOWN ducks a book flying HIGH. A card explains it, then three practice throws in Max's order (duck, jump, hit):
// each slows the world down as it arrives and waits for its key. Every book dealt with in a row adds to a streak that Nailong calls out,
// and the higher the streak, the faster Mr Shou throws. He has a long health bar; a knockout of Nailong resumes from the last third passed.
// Modelled on Punch-Out style telegraphed attacks: the wind-up pose and the key on the book both say what is coming.
(() => {
"use strict";

const LINES_BATTLE = {
  title: 'THE TEXTBOOK BOUT',
  hint: 'laptop: SPACE hit, UP jump, DOWN duck  /  phone: tap right side = hit, left top = jump, left bottom = duck',
  // the instruction card before the fight
  cardTitle: 'KNOCK OUT MR SHOU',                       // placeholder, Max to edit
  cardGoal: 'Hit his books back at him. Dodge the rest.',   // placeholder, Max to edit
  cardWord: {m: 'HIT', l: 'JUMP', h: 'DUCK'},          // Max, 12 Oct: "duck here, jump here, hit here"
  cardSub: {m: 'book in the middle', l: 'book on the floor', h: 'book up high'},   // placeholder, Max to edit
  cardGo: 'press any key to start',                     // placeholder, Max to edit
  space: 'SPACE',                    // written on the drawn space bar
  teach: {m: 'HIT!', l: 'JUMP!', h: 'DUCK!'},     // the practice throws slow down and wait for this key
  hitTag: 'HIT',                     // the red tag on every middle book (Max: "a red thing meaning Hit this")
  streakMark: '!',                   // Nailong calls the streak: "3!", "4!", ...
  tooEasy: 'too easy!',              // Max, 12 Oct: said instead of the number, small chance, streak 3 to 5
  shouFast: 'Faster, then!',                              // placeholder, Max to edit
  shouTier: ['Harder questions!', 'Exam conditions!'],    // placeholder, Max to edit
  naiNear: 'Nearly there!',                               // placeholder, Max to edit
  naiBroke: 'My streak!',                                 // placeholder, Max to edit
  round: 'ROUND 1',
  fight: 'FIGHT!',
  ko: 'K.O.!',
  sign: 'THE DECK',                  // Max, 12 Oct: "instead of brindy cafe it's called THE DECK"
  nameL: 'NAILONG',
  nameR: 'MR SHOU',
  // placeholder, Max to edit (shouts, shoutsTwo, hitShou, perfect, hitNai, dodge, fails, winNai, winShou, winLine: all Claude's)
  shouts: ['Exercise 5D!', 'Show your working!', 'Chapter review!', 'Page 312!', 'Pop quiz!', 'Do 1 to 30!', 'Surprise test!', 'Sketch the graph!'],
  shoutsTwo: ['Two at once!', 'Double period!', 'Both textbooks!'],   // before a two-book throw
  hitShou: ['THWAP!', 'BONK!', 'FWAP!', 'SLAM!'],
  perfect: ['PERFECT!', 'NICE SWING!', 'HOME RUN!'],
  hitNai: ['OOF!', 'OW!', 'BONK!', 'ERK!'],
  dodge: ['nope', 'whew', 'too slow'],
  fails: [
    'Page 394 got you. Again.',
    'Showed no working. Again.',
    'Nailong scored 4%. Again.',
    'Textbooks are heavy, actually. Again.',
    'Problem set: 1. Nailong: 0. Again.',
    'Not a problem solved. A problem hit. Again.',
  ],
  winNai: 'Full marks!',
  winShou: 'Marks... for the bao.',
  count: ['1', '2', '3'],            // the referee count over the knocked-out teacher
  vs: 'VS',
  streakX: 'x',                      // the streak under VS: x3, x4, ...
  bat: {perfect: 'THWAP!', ok: 'thwip'},   // on the bao as it bats a book back (placeholder, Max to edit)
  cover: {word: 'Methods', r: '11', y: '12'},   // drawn on a book only if its cover image fails to load
  winLine: 'Homework: cancelled.',
};

const BT = {imgs: {}, deaths: 0, taught: false, replay: false, check: 100};   // replay: started from the end menu (no card, no practice, no dialogue); check: Mr Shou's health a retry resumes from
for (const [k, f] of [['r', 'methods-yr11.png'], ['y', 'methods-yr12.png']]) { const im = new Image(); im.src = 'assets/textbooks/' + f; BT.imgs[k] = im; }
const FRONT = {r: '#d9453d', y: '#f2d33a'}, BACK = {r: '#b3322c', y: '#caa923'};
const CHAR = '#4b4f59', CHAR2 = '#5d626e', CHAR3 = '#363942', SHIRT = '#20243a', SKIN = '#f0c9a2', HAIR = '#17110e';
const GY = () => H*0.86;
const NX = () => W*0.22;
const SX = () => W*0.79;
const SS = 1.15;                         // Mr Shou scale
const HH = {m: 110, h: 170, l: 35};       // height above floor of each kind of book
const HALF = {m: 48, h: 48, l: 34};
// pacing, by Mr Shou's health (above 2/3, above 1/3, the rest): wind-up seconds, pause after each book is dealt with,
// book speed (units/s, the gap is about 550 units), and the chance of a two-book throw. One book at a time in the first third.
const TIERS = [
  {wind: 0.95, gap: 0.75, speed: 390, two: 0},
  {wind: 0.85, gap: 0.65, speed: 430, two: 0.25},
  {wind: 0.78, gap: 0.55, speed: 470, two: 0.45},
];
// the streak (books dealt with in a row: dodged or hit back) speeds him up on top of the tier, per book up to `cap`:
// wind-up and pause shrink, books fly faster. Nailong calls it from `say`; "too easy!" is rolled once per streak (`easyP`) for one of 3 to 5.
const STREAK = {cap: 10, wind: 0.035, gap: 0.045, speed: 0.045, say: 3, easy: [3, 4, 5], easyP: 0.25, ding: 5, fast: 6};
const PRACTICE = {kinds: 'hlm', wind: 1.0, speed: 360};   // Max's order: duck, jump, hit
const SLOW = {at: 330, scale: 0.2, down: 2.6};   // practice slow motion: starts when the book is this close, eases down to `scale` at `down`/s
const FREEZE = {m: 150, l: 190, h: 130};  // where a practice book stops and waits for its key (units in front of Nailong)
const ZIP = {h: 0.18, l: 0.33, m: 0.14};  // after the right key, the practice book snaps on and meets the move in this many seconds
const PATTERN = 'mlmhmmhlmlmhmmlh';
const PAIRS = ['ml', 'mh', 'lm', 'hm'];   // a two-book throw is always one to hit and one to dodge
const DMG = {hit: 7, perfect: 9, nai: 20};   // about 12 to 14 hits knock him out (a long bar); 5 books knock Nailong out
const CHECK = [66.7, 33.3];               // notches on his bar: a knockout of Nailong resumes from the last one passed
const LOSE_T = 2.8;                       // seconds on the knockout before the retry (any key after 0.6 s goes sooner); long enough to read the fail line

const R = (a, b) => a + Math.random()*(b - a);
const pick = a => a[Math.floor(Math.random()*a.length)];
const sfx = (n, o) => { window.SFX && SFX.play(n, o); };
const tier = () => TIERS[B.shHp > CHECK[0] ? 0 : B.shHp > CHECK[1] ? 1 : 2];
function pace() {
  const tr = tier(), s = Math.min(B.streak, STREAK.cap);
  return {wind: tr.wind*(1 - STREAK.wind*s), gap: tr.gap*(1 - STREAK.gap*s), speed: tr.speed*(1 + STREAK.speed*s), two: tr.two, s};
}

// ---------- Mr Shou (global so story clips can reuse him) ----------
// shou(x, y, s, opts): feet at (x,y), s = 1 is about 272 units tall, like person().
// opts: mouth 'grin'|'smile'|'o'|'oof', look [dx,dy], armL / armR (radians: 0 hanging down, PI/2 pointing outwards, PI straight up; armL is the
// arm on the left of the screen), rot, sx, sy (squash), glasses (false = off), hair (swing in -1..1), stack (pile of books held in the right hand),
// brow ('up'), eyes ('dot'|'happy'|'x'). Returns {handL:[x,y], handR:[x,y]} in canvas coordinates.
function shou(x, y, s, o = {}) {
  const {mouth = 'grin', look = [0, 0], armL = 0.12, armR = 0.12, rot = 0, sx = 1, sy = 1, glasses = true, hair = 0, stack = false, eyes = 'dot'} = o;
  const L = C.line, SYo = -166, ARML = 76;
  const hl = [-38 - Math.sin(armL)*ARML, SYo + Math.cos(armL)*ARML], hr = [38 + Math.sin(armR)*ARML, SYo + Math.cos(armR)*ARML];
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s*sx, s*sy); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const outline = (draw, fill, lw = 12) => { draw(); ctx.lineWidth = lw; ctx.strokeStyle = L; ctx.stroke(); draw(); ctx.fillStyle = fill; ctx.fill(); };
  // straight black hair behind the head: ONE sheet hanging straight down to just below the shoulders, no tails, no flicks
  // (Max, 12 Oct: "not so long"; 13 Oct: "his hair actually all goes down instead of like pony tails ... like it's one sheet")
  const hs = hair*6;
  outline(() => { ctx.beginPath(); ctx.moveTo(-40, -246);
    ctx.bezierCurveTo(-51, -234, -51 + hs*0.3, -204, -51 + hs*0.7, -172);
    ctx.lineTo(-51 + hs, -154); ctx.quadraticCurveTo(hs, -149, 51 + hs, -154);
    ctx.lineTo(51 + hs*0.7, -172); ctx.bezierCurveTo(51 + hs*0.3, -204, 51, -234, 40, -246); ctx.closePath(); }, HAIR, 10);
  // legs and shoes
  for (const lx of [-22, 4]) outline(() => rr(lx, -88, 18, 84, 6), '#2a2d38', 10);
  for (const lx of [-17, 17]) outline(() => ell(lx, -4, 16, 7), '#151515', 8);
  // arms: blazer sleeves with a white cuff and a hand
  const arm = (sxp, h) => {
    ctx.lineWidth = 31; ctx.strokeStyle = L; ctx.beginPath(); ctx.moveTo(sxp, SYo); ctx.lineTo(h[0], h[1]); ctx.stroke();
    ctx.lineWidth = 21; ctx.strokeStyle = CHAR; ctx.beginPath(); ctx.moveTo(sxp, SYo); ctx.lineTo(h[0], h[1]); ctx.stroke();
    ctx.lineWidth = 22; ctx.strokeStyle = '#e9e6df'; ctx.beginPath();
    ctx.moveTo(sxp + (h[0] - sxp)*0.8, SYo + (h[1] - SYo)*0.8); ctx.lineTo(sxp + (h[0] - sxp)*0.86, SYo + (h[1] - SYo)*0.86); ctx.stroke();
    outline(() => ell(h[0], h[1] + 4, 12, 12), SKIN, 7);
  };
  arm(-38, hl);
  // torso: charcoal check blazer over a dark striped shirt
  outline(() => rr(-42, -176, 84, 98, 16), CHAR, 12);
  ctx.save(); rr(-42, -176, 84, 98, 16); ctx.clip();
  ctx.strokeStyle = CHAR2; ctx.lineWidth = 2.2;
  for (let i = -44; i <= 44; i += 11) { ctx.beginPath(); ctx.moveTo(i, -178); ctx.lineTo(i, -76); ctx.stroke(); }
  for (let j = -176; j <= -76; j += 11) { ctx.beginPath(); ctx.moveTo(-44, j); ctx.lineTo(44, j); ctx.stroke(); }
  ctx.strokeStyle = CHAR3; ctx.lineWidth = 1.4;
  for (let i = -38; i <= 44; i += 22) { ctx.beginPath(); ctx.moveTo(i, -178); ctx.lineTo(i, -76); ctx.stroke(); }
  ctx.restore();
  // striped shirt in the V
  ctx.beginPath(); ctx.moveTo(-17, -176); ctx.lineTo(17, -176); ctx.lineTo(0, -102); ctx.closePath(); ctx.fillStyle = SHIRT; ctx.fill();
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(190,200,230,.55)'; ctx.lineWidth = 1.6;
  for (let i = -16; i <= 16; i += 5) { ctx.beginPath(); ctx.moveTo(i, -178); ctx.lineTo(i*0.2, -100); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = L; ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.moveTo(-17, -176); ctx.lineTo(0, -102); ctx.lineTo(17, -176); ctx.stroke();
  for (const sgn of [-1, 1]) {     // lapels
    ctx.beginPath(); ctx.moveTo(sgn*17, -176); ctx.lineTo(sgn*30, -150); ctx.lineTo(sgn*22, -140); ctx.lineTo(0, -102); ctx.closePath();
    ctx.fillStyle = CHAR3; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
  }
  outline(() => ell(0, -96, 3, 3), '#222', 2);
  arm(38, hr);
  // neck, ears, head
  outline(() => rr(-10, -194, 20, 24, 5), '#e2b78c', 8);
  for (const sg of [-1, 1]) outline(() => ell(sg*33, -224, 6, 9), SKIN, 6);
  ctx.save(); ctx.translate(0, -186); ctx.scale(1.12, 1.12); ctx.translate(0, 186);
  const head = () => { ctx.beginPath(); ctx.moveTo(-33, -230); ctx.bezierCurveTo(-34, -266, 34, -266, 33, -230); ctx.bezierCurveTo(33, -204, 21, -186, 0, -184); ctx.bezierCurveTo(-21, -186, -33, -204, -33, -230); ctx.closePath(); };
  outline(head, SKIN, 10);
  // front hair: centre parting, curtains framing the face
  ctx.fillStyle = HAIR; ctx.strokeStyle = L; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-37, -214); ctx.bezierCurveTo(-46, -278, 46, -278, 37, -214); ctx.lineTo(32, -214); ctx.bezierCurveTo(30, -236, 18, -247, 0, -244);
  ctx.bezierCurveTo(-18, -247, -30, -236, -32, -214); ctx.closePath(); ctx.fill(); ctx.stroke();   // one solid sheet over the top, part of the same hair
  // eyes, brows
  const ey = -222;
  for (const ex of [-16, 16]) {
    if (eyes === 'happy') { ell(ex + look[0]*2, ey + 1, 4.6, 2.3); ctx.fillStyle = '#16120f'; ctx.fill(); }   // a narrowed glare (Max, 13 Oct: always angry)
    else if (eyes === 'x') { ctx.strokeStyle = L; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(ex - 5, ey - 5); ctx.lineTo(ex + 5, ey + 5); ctx.moveTo(ex + 5, ey - 5); ctx.lineTo(ex - 5, ey + 5); ctx.stroke(); }
    else { ell(ex + look[0]*2.5, ey + look[1]*2, 3.6, 4.6); ctx.fillStyle = '#16120f'; ctx.fill(); ell(ex + look[0]*2.5 + 1.3, ey + look[1]*2 - 1.6, 1.3, 1.3); ctx.fillStyle = '#fff'; ctx.fill(); }
  }
  // nose and an angry mouth (Max, 13 Oct): 'grin' gritted teeth in a frown, 'smile' a frown, 'o' a shout, 'oof' a wobbly hurt line
  ctx.strokeStyle = 'rgba(74,47,12,.55)'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(1, -216); ctx.quadraticCurveTo(5, -208, -1, -206); ctx.stroke();
  ctx.strokeStyle = L;
  if (mouth === 'o') { ell(0, -194, 7, 8); ctx.fillStyle = '#5a1a22'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke(); }
  else if (mouth === 'oof') { ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-10, -194); for (let i = 1; i <= 4; i++) ctx.lineTo(-10 + i*5, -194 + (i % 2 ? -3 : 3)); ctx.stroke(); }
  else if (mouth === 'smile') { ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-12, -189); ctx.quadraticCurveTo(0, -199, 12, -189); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(-15, -190); ctx.quadraticCurveTo(0, -202, 15, -190); ctx.lineTo(13, -185); ctx.quadraticCurveTo(0, -195, -13, -185); ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-14, -188); ctx.quadraticCurveTo(0, -198.5, 14, -188); for (const tx of [-6, 0, 6]) { ctx.moveTo(tx, -196.5 + Math.abs(tx)*0.12); ctx.lineTo(tx, -190 + Math.abs(tx)*0.2); } ctx.stroke(); }
  // light-grey rectangular metal glasses
  if (glasses) {
    ctx.lineWidth = 3.4; ctx.strokeStyle = '#b4bac4';
    for (const gx of [-29, 5]) { rr(gx, ey - 10, 24, 18, 4); ctx.fillStyle = 'rgba(205,225,245,.28)'; ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-5, ey - 4); ctx.lineTo(5, ey - 4); ctx.moveTo(-29, ey - 4); ctx.lineTo(-34, ey - 5); ctx.moveTo(29, ey - 4); ctx.lineTo(34, ey - 5); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-26, ey - 7); ctx.lineTo(-20, ey - 7); ctx.moveTo(8, ey - 7); ctx.lineTo(14, ey - 7); ctx.stroke();
  }
  // angry brows, always (Max, 13 Oct: "mr shou should have an angry expression"): drawn over the top of the glasses (the hairline sits
  // right on the frames), the inner ends pulled down to the nose
  if (eyes !== 'x') {
    const up = o.brow === 'up' ? -3 : 0;
    ctx.strokeStyle = L; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath();
    for (const sg of [-1, 1]) { ctx.moveTo(sg*25, ey - 13 + up); ctx.lineTo(sg*6, ey - 5 + up); }
    ctx.stroke();
  }
  ctx.restore();
  // a pile of textbooks held against the hip
  if (stack) {
    ctx.save(); ctx.translate(hr[0] - 4, hr[1] - 6);
    for (let i = 0; i < 4; i++) slab(i % 2 ? 4 : -3, -i*17, 78 - i*3, 16, i % 2 ? 'r' : 'y');
    ctx.restore();
    outline(() => ell(hr[0], hr[1] + 6, 12, 12), SKIN, 7);
  }
  ctx.restore();
  const cr = Math.cos(rot), sr = Math.sin(rot);
  const wp = h => [x + (h[0]*cr*sx - h[1]*sr*sy)*s, y + (h[0]*sr*sx + h[1]*cr*sy)*s];
  return {handL: wp(hl), handR: wp(hr)};
}
window.shou = shou;

// a thick flat book (side view): cover colour slab with cream page edge
function slab(x, y, w, h, which) {
  ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round';
  rr(-w/2, -h, w, h, 3); ctx.fillStyle = FRONT[which]; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = C.line; ctx.stroke();
  rr(-w/2 + 8, -h + 3, w - 10, h - 6, 2); ctx.fillStyle = '#f6efdc'; ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();
}

// ---------- the flying book: real cover on the front, page edge as it turns ----------
function drawBook(x, y, w, h, rot, spin, which, alpha = 1) {
  const im = BT.imgs[which], ok = im && im.complete && im.naturalWidth > 0;
  const cs = Math.cos(spin), sn = Math.sin(spin), th = w*0.34;
  const cw = Math.max(3, w*Math.abs(cs)), ew = th*Math.abs(sn), tot = cw + ew, x0 = -tot/2;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = alpha; ctx.lineJoin = 'round';
  const front = cs >= 0, cx0 = front ? x0 : x0 + ew, ex0 = front ? x0 + cw : x0;
  if (ew > 1.5) {
    ctx.fillStyle = '#f6efdc'; ctx.fillRect(ex0, -h/2 + 2, ew, h - 4);
    ctx.strokeStyle = 'rgba(74,47,12,.4)'; ctx.lineWidth = 1.3;
    for (let yy = -h/2 + 6; yy < h/2 - 3; yy += 5) { ctx.beginPath(); ctx.moveTo(ex0, yy); ctx.lineTo(ex0 + ew, yy); ctx.stroke(); }
    ctx.lineWidth = 3.5; ctx.strokeStyle = C.line; ctx.strokeRect(ex0, -h/2 + 2, ew, h - 4);
  }
  if (front && ok) { ctx.drawImage(im, cx0, -h/2, cw, h); }
  else if (front) {
    ctx.fillStyle = FRONT[which]; ctx.fillRect(cx0, -h/2, cw, h);
    ctx.save(); ctx.beginPath(); ctx.rect(cx0, -h/2, cw, h); ctx.clip(); ctx.translate(cx0 + cw/2, 0); ctx.scale(Math.abs(cs), 1);
    font(w*0.2, 700); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(LINES_BATTLE.cover.word, 0, -h*0.1); font(w*0.22, 700); ctx.fillText(LINES_BATTLE.cover[which], 0, h*0.12); ctx.restore();
  } else { ctx.fillStyle = BACK[which]; ctx.fillRect(cx0, -h/2, cw, h); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(cx0 + cw*0.12, -h/2 + h*0.08, cw*0.76, h*0.84); }
  ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.strokeRect(cx0, -h/2, cw, h);
  ctx.restore();
}

function drawBao(x, y, r, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.lineJoin = 'round';
  ell(0, 0, r, r*0.9); ctx.fillStyle = '#fffaf0'; ctx.fill(); ctx.lineWidth = Math.max(3, r*0.15); ctx.strokeStyle = C.line; ctx.stroke();
  ell(-r*0.25, r*0.2, r*0.5, r*0.4); ctx.fillStyle = 'rgba(240,215,170,.35)'; ctx.fill();
  ctx.lineWidth = Math.max(2, r*0.09); ctx.strokeStyle = C.line; ctx.lineCap = 'round';
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i*r*0.12, -r*0.88); ctx.quadraticCurveTo(i*r*0.22, -r*0.55, i*r*0.34, -r*0.28); ctx.stroke(); }
  ell(0, -r*0.9, r*0.1, r*0.07); ctx.fillStyle = '#f0dcb0'; ctx.fill(); ctx.stroke();
  ctx.restore();
}
// Nailong's bao on its stick, swung through angle a (0 = straight up, PI/2 = pointing at Mr Shou) about the pivot (px, py)
function baoStick(px, py, len, a, r, lw) {
  const bx = px + len*Math.sin(a), by = py - len*Math.cos(a);
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.lineWidth = lw; ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(bx, by); ctx.stroke();
  ctx.lineWidth = lw*0.6; ctx.strokeStyle = C.y; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(bx, by); ctx.stroke();
  ctx.restore();
  drawBao(bx, by, r, a);
}
// a 4-point glint (white, thin points, outlined)
function sparkle(x, y, r, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = i*Math.PI/4, rad = i % 2 ? r*0.3 : r; ctx.lineTo(Math.sin(a)*rad, -Math.cos(a)*rad); }
  ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineJoin = 'round'; ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke(); ctx.restore();
}
function star0(x, y, r) { ctx.save(); ctx.translate(x, y); ctx.beginPath(); for (let i = 0; i < 10; i++) { const rad = i % 2 ? r*0.45 : r; ctx.lineTo(Math.sin(i*Math.PI/5)*rad, -Math.cos(i*Math.PI/5)*rad); } ctx.closePath(); ctx.fillStyle = '#ffe14d'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = C.line; ctx.stroke(); ctx.restore(); }

// a keyboard key, drawn: kind 'm' = the space bar, 'l' = up arrow, 'h' = down arrow. (x, y) is the key's centre, s its height.
function keycap(x, y, s, kind, lit = 0) {
  const w = kind === 'm' ? s*2.5 : s, r = s*0.24;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, s*0.08); ctx.strokeStyle = C.line;
  rr(x - w/2, y - s/2 + s*0.1, w, s, r); ctx.fillStyle = '#b79b6c'; ctx.fill(); ctx.stroke();          // the key's side
  rr(x - w/2, y - s/2, w, s*0.9, r); ctx.fillStyle = lit > 0 ? `rgb(255,${Math.round(250 - 40*lit)},${Math.round(240 - 170*lit)})` : '#fffaf0'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = C.line;
  if (kind === 'm') { font(Math.round(s*0.34), 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(LINES_BATTLE.space, x, y - s*0.04); }
  else {
    ctx.translate(x, y - s*0.05); ctx.scale(s, kind === 'h' ? -s : s); ctx.beginPath();
    ctx.moveTo(0, -0.3); ctx.lineTo(0.25, -0.03); ctx.lineTo(0.09, -0.03); ctx.lineTo(0.09, 0.27); ctx.lineTo(-0.09, 0.27); ctx.lineTo(-0.09, -0.03); ctx.lineTo(-0.25, -0.03); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  return w;
}

// ---------- state ----------
let B = {};
function reset(first) {
  if (first) { BT.deaths = 0; BT.check = 100; }
  B = {phase: first && !BT.replay ? 'card' : 'intro', pt: 0, t: 0, first: !!first, long: !!first && !BT.replay, hp: 100, shHp: BT.check, hpTrail: 100, shTrail: BT.check, books: [], parts: [], shake: 0, freeze: 0,
    nj: 0, nd: 0, ns: -1, nCd: 0, nHurt: 0, nBuf: 0, nSwingHit: false,
    sh: {st: 'idle', t: 0, kind: 'm', which: 'r', wind: 1, cd: 0.5, hurt: 0, push: 0, step: 0, queue: 0, next: 'm', teach: false},
    practice: BT.taught || BT.replay ? 0 : PRACTICE.kinds.length, streak: 0, easyAt: 0, throwN: 0, slow: 1, talk: {nai: null, shou: null}, said: {}, cue: {},
    failLine: '', winT: 0, glassesOff: 0, hintT: 0, shHand: null, stats: {thrown: 0, batted: 0, hurt: 0, best: 0},
    rt: 0, fx: [], nfx: 0};          // rt: real seconds (keeps running through hit-stop and slow motion), fx: impact bursts and rings timed on it
  if (first) { const q = new URLSearchParams(location.search); if (q.get('shhp')) B.shHp = B.shTrail = +q.get('shhp'); if (q.get('hp')) B.hp = B.hpTrail = +q.get('hp');
    if (q.get('easy') === '1') STREAK.easyP = 1; }   // test hooks: ?shhp=N, ?hp=N starting health; ?easy=1 every streak says "too easy!" once
  window.__battle = B; window.__battleT = BT;
}
function startFight() { if (B.phase !== 'card') return; B.phase = 'intro'; B.pt = 0; B.hintT = 0; sfx('pop'); }
// a line in a speech bubble for `life` real seconds; never on a replay. A line only replaces one of the same or lower priority that is still up.
function say(who, text, life = 2.4, pri = 1) {
  if (BT.replay) return;
  const c = B.talk[who];
  if (c && B.rt - c.t0 < c.life && c.pri > pri) return;
  B.talk[who] = {text, t0: B.rt, life, pri};
}
// one more book dealt with: the streak grows, Nailong calls it, and at 6 Mr Shou says he will speed up
function streakUp() {
  if (B.phase !== 'play') return;
  const s = ++B.streak; B.stats.best = Math.max(B.stats.best, s);
  if (s === STREAK.say) B.easyAt = Math.random() < STREAK.easyP ? pick(STREAK.easy) : 0;
  if (s % STREAK.ding === 0) sfx('ding', {p: 1 + 0.08*Math.min(s/STREAK.ding, 4)});
  else if (s >= STREAK.say) sfx('tick', {p: 1 + 0.05*Math.min(s, 12)});
  if (s >= STREAK.say) say('nai', s === B.easyAt ? LINES_BATTLE.tooEasy : s + LINES_BATTLE.streakMark, s === B.easyAt ? 2.0 : 1.5, 1);
  if (s === B.easyAt && !BT.replay) sfx('squeak', {p: 1.3, g: 0.7});      // the cheeky one gets its own little noise
  if (s === STREAK.fast && !B.said.fast) { B.said.fast = true; say('shou', LINES_BATTLE.shouFast, 2.6, 2); }
}
// the practice book now in slow motion, waiting for its key (null if none)
const slowBook = () => B.books.find(b => b.teach && !b.taught && !b.go && b.st === 'fly' && b.x - NX() <= SLOW.at);

const jumpOff = () => B.nj > 0 ? 175*4*(B.nj/0.72)*(1 - B.nj/0.72) : 0;
const bunPos = () => {          // bun centre while swinging, plus the angle
  const u = B.ns/0.30, a = u < 0.15 ? lerp(0, -0.9, u/0.15) : lerp(-0.9, 2.2, ease(clamp((u - 0.15)/0.55, 0, 1)));
  const px = NX() + 45, py = GY() - jumpOff() - 115;
  return {a, x: px + 100*Math.sin(a), y: py - 100*Math.cos(a), px, py};
};

function pop(text, x, y, size = 54, fill = C.y, life = 0.9) { B.parts.push({k: 'text', text, x, y, size, fill, life, max: life, rot: (Math.random() - .5)*0.3, vy: -30}); }
function stars(x, y, n = 6, col = '#ffe14d') { for (let i = 0; i < n; i++) { const a = R(0, 6.28), v = R(140, 360); B.parts.push({k: 'star', x, y, vx: Math.cos(a)*v, vy: Math.sin(a)*v - 120, r: R(8, 16), rot: R(0, 6), vr: R(-7, 7), life: R(0.45, 0.85), max: 0.85, col}); } }
// comic hit spark (plays out during the hit-stop) and the parry ring, both on the real clock
function burst(x, y, r, col) { B.fx.push({k: 'burst', x, y, r, col, t0: B.rt, life: 0.16, rot: (B.nfx++)*2.4}); }
function ring(x, y, r1, col) { B.fx.push({k: 'ring', x, y, r1, col, t0: B.rt, life: 0.26}); }
function puffs(x, y, n = 4) { for (let i = 0; i < n; i++) B.parts.push({k: 'puff', x: x + R(-20, 20), y: y + R(-10, 10), vx: R(-70, 70), vy: R(-80, -20), r: R(14, 24), life: R(0.35, 0.6), max: 0.6}); }

// the three moves; each says whether it actually started
function doSwing() {
  if (B.ns >= 0 || B.nCd > 0) { B.nBuf = 0.12; return false; }
  B.ns = 0; B.nSwingHit = false; sfx('swish'); return true;
}
function doJump() { if (B.nj <= 0 && B.nHurt < 0.45) { B.nj = 0.001; B.nd = 0; sfx('boing', {p: 1.25, g: 0.55}); return true; } return false; }
function doDuck() { if (B.nj <= 0) { if (B.nd <= 0) sfx('zip', {p: 0.9, g: 0.7}); B.nd = 0.45; return true; } return false; }
// a key press: 'm' swing, 'l' jump, 'h' duck. The practice book in slow motion that wants this key: time snaps back and the book
// zips on to meet the move (a duck or jump clears it; a middle book stops where the bao meets it and is released by the hit).
function act(kind) {
  if (B.phase !== 'play') return;
  const started = kind === 'm' ? doSwing() : kind === 'l' ? doJump() : doDuck();
  const tb = slowBook();
  if (!tb || tb.kind !== kind || !started) return;
  const x1 = NX() + (kind === 'm' ? FREEZE.m : 50);
  tb.go = true; B.slow = 1; sfx('ding', {p: 1.4, g: 0.6});
  if (tb.x > x1 + 1) { tb.frozen = false; tb.zip = {x0: tb.x, x1, t0: B.t, dur: ZIP[kind]}; }
  if (kind !== 'm') tb.taught = true;
}

// ---------- Mr Shou's throwing: one book at a time, the next wind-up only once the last book is dealt with ----------
function startWind(second) {
  const sh = B.sh; sh.st = 'wind'; sh.t = 0; sh.which = Math.random() < 0.5 ? 'r' : 'y';
  if (second) { sh.kind = sh.next; sh.wind = 0.55*(1 - 0.02*Math.min(B.streak, STREAK.cap)); sh.teach = false; return; }
  if (B.practice > 0) {
    sh.kind = PRACTICE.kinds[PRACTICE.kinds.length - B.practice]; sh.teach = true; sh.wind = PRACTICE.wind; sh.queue = 0;
    if (--B.practice === 0) BT.taught = true;
    return;                                             // no shouting over the practice
  }
  const pc = pace(); sh.teach = false; sh.wind = pc.wind; sh.queue = 0;
  if (Math.random() < pc.two) { const pr = pick(PAIRS); sh.kind = pr[0]; sh.next = pr[1]; sh.queue = 1; }
  else sh.kind = PATTERN[sh.step++ % PATTERN.length];
  // he shouts on a two-book throw (the warning) and on every third single one, so the lines stay readable
  if (sh.queue || B.throwN++ % 3 === 0) say('shou', pick(sh.queue ? LINES_BATTLE.shoutsTwo : LINES_BATTLE.shouts), 2.2, 0);
}
function throwBook() {
  const sh = B.sh, kind = sh.kind, hand = B.shHand || [SX() - 60, GY() - 150];
  const w = kind === 'l' ? 70 : 64, h = kind === 'l' ? 100 : 96;
  B.books.push({kind, which: sh.which, teach: sh.teach, x: hand[0] - 20, yr: hand[1] - 12, y: hand[1] - 12, st: 'fly', v: sh.teach ? PRACTICE.speed : pace().speed,
    spin: R(0, 6), rot: kind === 'l' ? Math.PI/2 : R(-0.4, 0.4), w, h, checked: false, born: B.t, x0: hand[0] - 20});
  B.stats.thrown++;
  puffs(hand[0] - 30, hand[1], 3);
  sfx('whoosh', {g: 0.7});
}
function updateShou(dt) {
  const sh = B.sh;
  if (sh.hurt > 0) sh.hurt -= dt;
  sh.push *= Math.pow(0.0006, dt);
  if (sh.st === 'idle') {
    if (sh.hurt > 0.2 || B.books.length) return;      // reels from a hit first; never throws while a book is still out
    sh.cd -= dt;
    if (sh.cd <= 0) startWind(false);
  } else if (sh.st === 'wind') {
    sh.t += dt;
    if (sh.t >= sh.wind) { throwBook(); sh.st = 'throw'; sh.t = 0; }
  } else if (sh.st === 'throw') {
    sh.t += dt;
    if (sh.t > 0.25) { if (sh.queue > 0) { sh.queue--; startWind(true); } else { sh.st = 'idle'; sh.cd = pace().gap; } }
  }
}

function hitShou(b, perfect) {
  if (B.phase !== 'play') return;
  const was = B.shHp;
  B.shHp = Math.max(0, B.shHp - (perfect ? DMG.perfect : DMG.hit)); B.stats.batted++;
  const sh = B.sh; sh.hurt = 0.6; sh.push = 60; sh.st = 'idle'; sh.t = 0; sh.queue = 0; sh.cd = pace().gap;
  B.freeze = perfect ? 0.13 : 0.08; B.shake = perfect ? 0.32 : 0.2;
  sfx('thwack', {p: 0.9}); sfx('books', {g: 0.7}); sfx('oof', {p: 0.6, g: 0.5}); if (perfect) sfx('clear', {p: 1.5});   // sound lands on the frozen frame
  // a notch on his bar passed: he gets harder, and a knockout of Nailong now resumes from here
  CHECK.forEach((c, i) => { if (was > c && B.shHp <= c && B.shHp > 0) { BT.check = Math.min(BT.check, c); sfx('ding', {p: 0.75}); say('shou', LINES_BATTLE.shouTier[i], 2.6, 2); } });
  if (B.shHp > 0 && B.shHp <= 15 && !B.said.near) { B.said.near = true; say('nai', LINES_BATTLE.naiNear, 2.2, 2); }
  const hx = SX() - 40, hy = GY() - 170;
  burst(hx, hy, perfect ? 80 : 55, perfect ? '#ffe14d' : '#fffbe0');
  stars(hx, hy, perfect ? 8 : 5); puffs(hx, hy, 3);
  pop(pick(LINES_BATTLE.hitShou), hx - 90, hy - 100, 66, '#ff7a3d');
  if (perfect) { pop(pick(LINES_BATTLE.perfect), NX() + 120, GY() - 330, 48, '#fff', 1.0); B.glassesOff = 0.9;
    B.parts.push({k: 'glasses', x: hx, y: hy - 52, vx: R(-120, 260), vy: -520, rot: 0, vr: 9, life: 0.9, max: 0.9}); }
  B.parts.push({k: 'book', which: b.which, x: hx, y: hy, vx: R(-60, 200), vy: -620, rot: b.rot, vr: R(-8, 8), spin: b.spin, life: 1.0, max: 1.0, w: b.w, h: b.h});
  if (B.shHp <= 0) {
    B.phase = 'win'; B.pt = 0; B.winT = 0; B.shake = 0.5; B.freeze = 0.22; B.koRT = B.rt; B.slow = 1;
    sfx('thud', {p: 0.8}); sfx('crash', {g: 0.8});   // the heavy KO hit (books spill: 'books' above); the win jingle is main.js's, on done
    for (let i = 0; i < 4; i++) B.parts.push({k: 'book', which: i % 2 ? 'r' : 'y', x: hx + 40, y: hy + 10, vx: R(60, 420), vy: R(-760, -420), rot: R(0, 6), vr: R(-10, 10), spin: R(0, 6), life: 1.8, max: 1.8, w: 64, h: 96, gravity: 1400});
  }
}
function hitNai(b) {
  if (B.phase !== 'play') return;
  const broke = B.streak >= 5 && B.hp > DMG.nai;
  if (window.AUTO) console.log('battle: hurt kind=' + b.kind + ' v=' + Math.round(b.v) + ' streak=' + B.streak + ' ns=' + B.ns.toFixed(2) + ' nj=' + B.nj.toFixed(2) + ' nd=' + B.nd.toFixed(2) + ' miss=' + !!(b.plan && b.plan.miss));      // a big streak lost (and not a knockout): Nailong mourns it instead of OOF
  B.hp = Math.max(0, B.hp - DMG.nai); B.streak = 0; B.nHurt = 0.7; B.freeze = 0.09; B.shake = 0.26; B.ns = -1; B.nj = 0; B.stats.hurt++;
  sfx('thud'); sfx('oof');
  const x = NX();
  burst(x + 30, GY() - 150, 45, '#fffbe0');
  stars(x + 30, GY() - 150, 5, '#ff9db0');
  if (broke && !BT.replay) say('nai', LINES_BATTLE.naiBroke, 2.0, 2); else if (B.hp > 0) pop(pick(LINES_BATTLE.hitNai), x - 10, GY() - 250, 62, '#ff4f6d');   // a knockout gets K.O.! and the fail line only
  B.parts.push({k: 'book', which: b.which, x: b.x, y: b.y, vx: 260, vy: -480, rot: b.rot, vr: 9, spin: b.spin, life: 1.0, max: 1.0, w: b.w, h: b.h, gravity: 1500});
  b.dead = true;
  if (B.hp <= 0) {
    B.phase = 'lose'; B.pt = 0; B.failLine = LINES_BATTLE.fails[BT.deaths % LINES_BATTLE.fails.length]; BT.deaths++; B.shake = 0.4; B.freeze = 0.12; B.slow = 1;
    sfx('sad', {g: 0.7}); sfx('dizzy', {g: 0.6});
    const api = GAMES.battle.api; api && api.died && api.died();     // ride-wide lives (main.js): exactly once per knockout
  }
}

function updateBooks(dt) {
  const nx = NX(), jo = jumpOff();
  for (const b of B.books) {
    if (B.phase !== 'play') break;
    if (b.dead) continue;
    if (b.st === 'fly') {
      if (b.zip) {                       // a practice book answered: it snaps on to meet the move
        const u = (B.t - b.zip.t0)/b.zip.dur;
        if (u < 1) b.x = lerp(b.zip.x0, b.zip.x1, u);
        else if (b.kind === 'm' && !b.taught) { b.x = b.zip.x1; b.zip = null; b.frozen = true; }   // waits there for the bao
        else { b.zip = null; b.v = Math.max(b.v, 900); }
        b.spin += 6*dt; b.rot += (b.kind === 'l' ? 0 : 2.6)*dt;
      } else if (!b.frozen) {
        b.x -= b.v*dt; b.spin += 6*dt; b.rot += (b.kind === 'l' ? 0 : 2.6)*dt;
        if (b.teach && !b.taught && b.x - nx <= FREEZE[b.kind]) { b.x = nx + FREEZE[b.kind]; b.frozen = true; sfx('tick'); }
      }
      // from the hand down (or up) to its lane in the first 0.3 s, then along it; a floor book thumps down as it lands
      const prog = clamp((b.x0 - b.x)/(b.x0 - nx), 0, 1), lane = GY() - HH[b.kind];
      b.arc = b.kind === 'h' ? -26*Math.sin(prog*Math.PI) : b.kind === 'l' && !b.frozen ? -Math.abs(Math.sin((B.t - b.born)*7))*5 : 0;
      b.y = lerp(b.yr, lane, ease(clamp((B.t - b.born)/0.3, 0, 1))) + b.arc;
      if (b.kind === 'l' && !b.landed && B.t - b.born > 0.3) { b.landed = true; sfx('thud', {p: 1.5, g: 0.35}); }
      if (b.kind === 'm' && B.ns >= 0.08 && B.ns <= 0.27) {          // the bao zi connects
        const bp = bunPos();
        if (Math.hypot(bp.x - b.x, bp.y - b.y) < 92 && b.x > nx + 15) {
          const perfect = b.teach || (bp.a > 1.05 && bp.a < 1.95 && Math.abs(b.x - (nx + 150)) < 58);
          b.st = 'ret'; b.frozen = false; b.zip = null; b.taught = true; b.perfect = perfect; b.vx = perfect ? 1500 : 1100; b.tx = SX() - 45; b.ty = GY() - 165; B.nSwingHit = true;
          B.freeze = 0.06; B.shake = 0.14; sfx('thwack', {p: 1.3}); sfx('clink'); ring(b.x, b.y, perfect ? 160 : 120, perfect ? '#ffe14d' : '#fff'); stars(b.x, b.y, 4, '#fff'); pop(perfect ? LINES_BATTLE.bat.perfect : LINES_BATTLE.bat.ok, b.x + 20, b.y - 70, perfect ? 50 : 34, '#fff', 0.6);
          if (!b.teach) streakUp();
          continue;
        }
      }
      if (!b.checked && b.x < nx + 50) {
        b.checked = true;
        if (b.teach) { sfx('whoosh', {p: 1.6, g: 0.45}); continue; }     // practice books never hurt
        const hb = HH[b.kind], lo = jo, hi = jo + (B.nd > 0 ? 95 : 178);
        const over = (hb + HALF[b.kind]) > lo && (hb - HALF[b.kind]) < hi;
        if (over && B.nHurt <= 0) hitNai(b);
        else if (!over) {
          sfx('whoosh', {p: 1.6, g: 0.45}); streakUp();
          if (B.streak < STREAK.say && !BT.replay && Math.random() < 0.35) pop(pick(LINES_BATTLE.dodge), nx + 20, GY() - 260, 30, '#fff', 0.6);
        }
      }
      if (b.x < -150) b.dead = true;
    } else {
      b.spin += 14*dt;
      b.x += b.vx*dt; b.y = lerp(b.y, b.ty, Math.min(1, dt*9)); b.rot += 8*dt;
      if (b.x >= b.tx) { b.dead = true; hitShou(b, b.perfect); }
    }
  }
  B.books = B.books.filter(b => !b.dead);
}

// ---------- bot (window.AUTO): plays like a careful human, and answers the practice books after a short look ----------
function bot() {
  const nx = NX();
  for (const b of B.books) {
    if (b.st !== 'fly' || b.checked) continue;
    if (b.teach && !b.taught) {           // a practice book: answer it 0.7 real seconds into the slow motion
      if (!b.go && b.x - nx <= SLOW.at) { if (!b.botAt) b.botAt = B.rt + 0.7; if (B.rt >= b.botAt && (b.kind !== 'm' || (B.ns < 0 && B.nCd <= 0))) act(b.kind); }
      continue;
    }
    const d = b.x - nx, v = b.v;
    if (b.kind === 'm') {
      if (!b.plan) b.plan = {press: 150 + v*0.15 + R(-30, 30), miss: Math.random() < 0.04};
      if (!b.plan.miss && d <= b.plan.press && d > 60 && B.ns < 0 && B.nCd <= 0) act('m');
    } else if (b.kind === 'h') { if (d < 50 + v*0.3 && d > 10 && B.nd <= 0) act('h'); }
    else if (b.kind === 'l') { if (!b.jat) b.jat = 50 + v*0.36 + R(-15, 15); if (d <= b.jat && d > 90 && B.nj <= 0) act('l'); }
  }
}

// ---------- update ----------
function update(dt) {
  // practice slow motion: the world (Mr Shou, the books, the bits) runs at B.slow while a practice book waits for its key;
  // Nailong's own moves stay at full speed, so the key always answers at once
  const sb = B.phase === 'play' ? slowBook() : null;
  if (sb && !sb.slowed) { sb.slowed = true; sfx('whoosh', {p: 0.5, g: 0.8}); }
  B.slow = sb ? Math.max(SLOW.scale, B.slow - SLOW.down*dt) : Math.min(1, B.slow + 8*dt);
  const dw = dt*B.slow;
  B.t += dw; B.pt += dt; B.hintT += dt;
  B.hpTrail = B.hpTrail > B.hp ? Math.max(B.hp, B.hpTrail - 40*dt) : B.hp;
  B.shTrail = B.shTrail > B.shHp ? Math.max(B.shHp, B.shTrail - 40*dt) : B.shHp;
  B.shake = Math.max(0, B.shake - dt);
  for (const p of B.parts) {
    p.life -= dw;
    if (p.k === 'text') p.y += p.vy*dw;
    else { p.x += (p.vx || 0)*dw; p.y += (p.vy || 0)*dw; p.vy = (p.vy || 0) + (p.gravity || (p.k === 'puff' ? -20 : 1500))*dw; p.rot += (p.vr || 0)*dw; if (p.spin !== undefined) p.spin += 10*dw; }
  }
  B.parts = B.parts.filter(p => p.life > 0);
  if (B.glassesOff > 0) B.glassesOff -= dt;
  if (B.phase === 'card') {
    if (B.pt > (window.AUTO ? 1.2 : 6)) startFight();        // any key starts it sooner
  } else if (B.phase === 'intro') {
    // ROUND 1 slides in (whoosh), FIGHT! rings the bell; a replay or a retry gets the short FIGHT! only
    const fs = B.long ? 0.6 : 0;
    if (B.long && !B.cue.round) { B.cue.round = true; sfx('whoosh', {p: 0.8}); }
    if (B.pt >= fs && !B.cue.fight) { B.cue.fight = true; sfx('ding'); }
    if (B.pt >= (B.long ? 1.15 : 0.6)) { B.phase = 'play'; B.pt = 0; }
  } else if (B.phase === 'play') {
    if (window.AUTO) bot();
    if (B.nj > 0) { B.nj += dt; if (B.nj >= 0.72) B.nj = 0; }
    if (B.nd > 0) {
      B.nd -= dt;
      // a high book he ducked is still passing over him: he stays down until it is clear (it never seems to go through his head)
      if (B.nd < 0.06 && B.books.some(b => b.kind === 'h' && b.checked && b.st === 'fly' && b.x > NX() - 120)) B.nd = 0.06;
    }
    if (B.nHurt > 0) B.nHurt -= dt;
    if (B.nCd > 0) B.nCd -= dt;
    if (B.nBuf > 0) { B.nBuf -= dt; if (B.ns < 0 && B.nCd <= 0) { B.nBuf = 0; doSwing(); } }
    if (B.ns >= 0) { B.ns += dt; if (B.ns >= 0.30) {
      B.ns = -1; B.nCd = B.nSwingHit ? 0.05 : 0.32;
      if (!B.nSwingHit) for (const b of B.books) if (b.teach && !b.taught && b.go && !b.zip) b.go = false;   // a practice HIT that missed: it waits again
    } }
    updateShou(dw); updateBooks(dw);
  } else if (B.phase === 'lose') {
    if (B.pt > (BT.replay ? 1.0 : LOSE_T)) reset(false);
  } else if (B.phase === 'win') {
    B.winT += dt;
    const w = B.winT, cue = (k, at, n, o) => { if (w >= at && !B.cue[k]) { B.cue[k] = true; sfx(n, o); } };
    cue('books', 0.15, 'books'); cue('dizzy', 0.9, 'dizzy', {g: 0.6});
    for (let i = 0; i < 3; i++) cue('c' + i, 1.0 + i*0.5, 'tick', {p: 1.2 + i*0.15});
    cue('bell', 2.5, 'ding', {p: 1.1});
    if (B.winT > (BT.replay ? 3.0 : 6.2)) {      // Mr Shou's last bubble (in at 3.4 s) holds 2.8 s
      if (window.AUTO) console.log('battle: won at t=' + B.t.toFixed(1) + ' rt=' + B.rt.toFixed(1) + ' hp=' + B.hp + ' deaths=' + BT.deaths + ' stats=' + JSON.stringify(B.stats));
      B.phase = 'done'; GAMES.battle.api.done();
    }
  }
}

// ---------- drawing ----------
function cafe() {
  const fy = H*0.67;
  ctx.fillStyle = '#f5ddb0'; ctx.fillRect(0, 0, W, fy);
  ctx.fillStyle = '#e7b8a0'; ctx.fillRect(0, fy - 130, W, 130);
  ctx.strokeStyle = 'rgba(74,47,12,.15)'; ctx.lineWidth = 3;
  for (let x = 0; x < W; x += 46) { ctx.beginPath(); ctx.moveTo(x, fy - 130); ctx.lineTo(x, fy); ctx.stroke(); }
  ctx.fillStyle = '#b8644a'; ctx.fillRect(0, fy - 134, W, 10);
  const wx = W*0.40, wy = H*0.14, ww = W*0.2, wh = H*0.30;
  ctx.fillStyle = '#a8dcf5'; ctx.strokeStyle = C.line; ctx.lineWidth = 6; rr(wx, wy, ww, wh, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ell(wx + ww*0.3, wy + wh*0.35, 34, 16); ctx.fill(); ell(wx + ww*0.38, wy + wh*0.3, 26, 14); ctx.fill();
  ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(wx + ww/2, wy); ctx.lineTo(wx + ww/2, wy + wh); ctx.stroke();
  ctx.fillStyle = '#5a3a24'; rr(W*0.07, H*0.22, W*0.2, 74, 12); ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
  title(LINES_BATTLE.sign, W*0.17, H*0.22 + 37, Math.min(40, W/30), '#ffe9b0');
  ctx.fillStyle = '#8a5a34'; ctx.lineWidth = 4; ctx.fillRect(W*0.68, H*0.26, W*0.26, 12); ctx.fillRect(W*0.68, H*0.42, W*0.26, 12);
  const cols = ['#e0372f', '#3a7bd5', '#2f9a5a', '#f4a62a', '#8a4fb8'];
  for (let i = 0; i < 7; i++) for (const [row, yy] of [[0, H*0.26], [1, H*0.42]]) {
    const bx = W*0.69 + i*W*0.035, bh = 46 + ((i + row*3) % 3)*10; ctx.fillStyle = cols[(i + row*2) % 5];
    rr(bx, yy - bh, 22, bh, 6); ctx.fill(); ctx.stroke(); rr(bx + 5, yy - bh - 10, 12, 12, 3); ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = '#9b6a42'; ctx.lineWidth = 5; rr(-10, fy - 80, W + 20, 90, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c99263'; ctx.fillRect(-6, fy - 84, W + 12, 14); ctx.strokeRect(-6, fy - 84, W + 12, 14);
  ctx.fillStyle = '#8d939c'; rr(W*0.1, fy - 150, 80, 70, 8); ctx.fill(); ctx.stroke();
  ell(W*0.1 + 40, fy - 118, 14, 14); ctx.fillStyle = '#e0372f'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; for (const cx of [W*0.3, W*0.33, W*0.55]) { rr(cx, fy - 120, 28, 36, 5); ctx.fill(); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(74,47,12,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 20); ctx.quadraticCurveTo(W/2, 90, W, 20); ctx.stroke();
  for (let i = 1; i < 14; i++) { const u = i/14, lx = W*u, ly = 20 + 2*u*(1 - u)*70 + 4; ell(lx, ly + 6, 6, 8); ctx.fillStyle = (i % 2) ? '#ffe56b' : '#ffb347'; ctx.fill(); }
  ctx.fillStyle = '#d69a62'; ctx.fillRect(0, fy, W, H - fy);
  ctx.strokeStyle = 'rgba(74,47,12,.2)'; ctx.lineWidth = 3;
  for (let i = 0; i < 7; i++) { const yy = fy + (H - fy)*Math.pow(i/7, 1.3); ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }
  for (let x = -W; x < 2*W; x += 120) { ctx.beginPath(); ctx.moveTo(W/2 + (x - W/2)*0.55, fy); ctx.lineTo(W/2 + (x - W/2)*1.5, H); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,240,200,.18)'; ctx.fillRect(0, fy, W, 8);
}

function shadow(x, y, w) { ell(x, y, Math.max(10, w), Math.max(10, w)*0.16); ctx.fillStyle = 'rgba(74,47,12,.25)'; ctx.fill(); }

function drawShou() {
  const sh = B.sh, x = SX() + sh.push, y = GY(), t = B.t;
  const o = {mouth: 'grin', armL: 0.2 + Math.sin(t*2)*0.05, armR: 0.18, rot: Math.sin(t*2)*0.02, sx: 1, sy: 1 + Math.sin(t*2)*0.01, stack: true, glasses: B.glassesOff <= 0, hair: Math.sin(t*2)*0.3, eyes: 'dot', look: [-1, 0]};
  if (B.phase === 'card' || B.phase === 'intro') { o.eyes = 'happy'; if (B.phase === 'intro' && B.long) o.armL = 1.6 + Math.sin(t*10)*0.3; }
  if (sh.st === 'wind') {
    const u = clamp(sh.t/sh.wind, 0, 1);
    if (sh.kind === 'm') { o.armL = lerp(0.3, 1.85, ease(u)); o.rot = lerp(0, 0.12, u); }
    else if (sh.kind === 'h') { o.armL = lerp(0.3, 3.0, ease(u)); o.sy = lerp(1, 1.08, u); o.brow = 'up'; }
    else { o.armL = lerp(0.3, 0.1, u); o.sy = lerp(1, 0.78, ease(u)); o.sx = lerp(1, 1.12, ease(u)); o.rot = lerp(0, -0.05, u); }
  } else if (sh.st === 'throw') {
    const u = clamp(sh.t/0.25, 0, 1);
    if (sh.kind === 'm') { o.armL = lerp(1.85, 0.9, u); o.rot = lerp(-0.1, 0, u); o.sx = lerp(1.12, 1, u); }
    else if (sh.kind === 'h') { o.armL = lerp(3.0, 1.1, ease(u)); o.sy = lerp(0.92, 1, u); }
    else { o.armL = lerp(0.1, 1.2, ease(u)); o.sy = lerp(0.8, 1, u); o.sx = lerp(1.15, 1, u); }
    o.mouth = 'o';
  }
  if (sh.hurt > 0 && B.phase !== 'win') {
    const u = sh.hurt/0.6, q = Math.max(0, u - 0.7)/0.3;
    o.eyes = 'x'; o.mouth = 'oof'; o.armL = 1.3 + Math.sin(t*22)*0.3; o.armR = 1.3 - Math.sin(t*22)*0.3; o.rot = -0.22*u; o.hair = 1.5*u; o.stack = false;
    o.sx = 1 + 0.35*q - 0.1*(1 - u); o.sy = 1 - 0.3*q + 0.08*(1 - u);
  }
  if (B.phase === 'win') {
    const e = ease(clamp(B.winT/0.9, 0, 1)), by = Math.sin(clamp(B.winT/0.9, 0, 1)*Math.PI)*-120;
    shadow(x - 90*e, y, 90);
    shou(x + 60*e, y + by + 14*e, SS, {mouth: 'oof', eyes: 'x', glasses: false, hair: 0.3, rot: lerp(0, -1.45, e*e), armL: 2.4 + Math.sin(B.winT*8)*0.2, armR: 2.2 - Math.sin(B.winT*8)*0.2});
    if (B.winT > 0.9) for (let i = 0; i < 3; i++) { const a = B.winT*4 + i*2.09; star0(x - 210 + Math.cos(a)*60, y - 120 + Math.sin(a)*14, 11); }
    return;
  }
  shadow(x, y, 80);
  const hands = shou(x, y, SS, o);
  B.shHand = hands.handL;
  // the tell (Punch-Out eye flash): a glint on his left lens over the last 0.15 s of the wind-up, gone on the throw
  if (sh.st === 'wind' && B.phase === 'play' && sh.hurt <= 0) {
    const g = (sh.t - (sh.wind - 0.15))/0.15;
    if (g > 0) { const cr = Math.cos(o.rot), sr = Math.sin(o.rot), lx = -19*SS*o.sx, ly = -228*SS*o.sy;
      sparkle(x + lx*cr - ly*sr, y + lx*sr + ly*cr, 14*lerp(0.4, 1.2, clamp(g, 0, 1)), 0.4*clamp(g, 0, 1)); }
  }
  if (sh.st === 'wind') { const hp = hands.handL; drawBook(hp[0] - 8, hp[1] - 12, 56, 84, -0.3, 0.2, sh.which); }
}

function drawNailong() {
  const x = NX(), gy = GY(), jo = jumpOff(), t = B.t;
  let sx = 1, sy = 1, rot = 0, mouth = 'open', arms = 'down', flail = 0;
  if (B.phase === 'intro' && B.long) {
    const p = B.pt;
    if (p < 0.25) { sx = 1.4; sy = 0.5; mouth = 'o'; }
    else { const q = p - 0.25; sy = 1 + Math.sin(q*18)*0.24*Math.exp(-q*5); sx = 1/sy; arms = 'up'; flail = t*14; }
  }
  if (B.nd > 0) { sy = 0.5; sx = 1.28; }
  if (B.nj > 0) { const u = B.nj/0.72; sy = 1 + 0.18*Math.sin(u*Math.PI); sx = 1/sy; arms = 'up'; flail = t*14; if (u < 0.12) { sy = 0.82; sx = 1.14; } }
  if (B.nHurt > 0) { const u = B.nHurt/0.7; mouth = 'o'; if (u > 0.8) { sy = 0.55; sx = 1.4; } else { sy = 1 + Math.sin((1 - u)*16)*0.12*u; sx = 1/sy; rot = Math.sin((1 - u)*14)*0.1*u; } }
  if (B.phase === 'lose') {
    const u = clamp(B.pt/0.3, 0, 1); shadow(x, gy, 80);
    nailong(x - 10, gy + 6, 1, {rot: lerp(0, -1.5, ease(u)), sx: 1 + 0.2*u, sy: 1 - 0.25*u, mouth: 'o', look: [0, 1], arms: 'up', flail: t*6});
    for (let i = 0; i < 3; i++) { const a = t*5 + i*2.09; star0(x + 30 + Math.cos(a)*50, gy - 120 + Math.sin(a)*12, 10); }
    return;
  }
  if (B.phase === 'win') {
    const u = B.winT, hop = Math.abs(Math.sin(u*5.5))*60; shadow(x, gy, 70 - hop*0.2);
    nailong(x, gy - hop, 1, {arms: 'up', flail: u*16, mouth: 'open', sy: 1 + Math.sin(u*11)*0.06, sx: 1 - Math.sin(u*11)*0.04, look: [1, -0.3]});
    drawBao(x + 40, gy - hop - 215 + Math.sin(u*11)*8, 40, Math.sin(u*8)*0.3);
    return;
  }
  shadow(x, gy, 70 - jo*0.2);
  const swinging = B.ns >= 0;
  if (swinging) rot = lerp(-0.12, 0.16, clamp(B.ns/0.2, 0, 1));
  nailong(x, gy - jo, 1, {rot, sx, sy, mouth: swinging || B.nd > 0 ? 'o' : mouth, arms: swinging ? 'down' : arms, flail, look: [1, 0]});
  const px = x + 45, py = gy - jo - 115;
  if (swinging) {
    const bp = bunPos();
    if (bp.a > 0.3) { ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = `rgba(255,255,255,${0.55*clamp((bp.a - 0.3)/1.2, 0, 1)})`; ctx.lineWidth = 26;
      ctx.beginPath(); ctx.arc(px, py, 100, -Math.PI/2 - 0.1, -Math.PI/2 + bp.a - 0.05); ctx.stroke(); ctx.restore(); }
    baoStick(px, py, 100, bp.a, 46, 36);
  } else if (B.nd <= 0) drawBao(x + 52, gy - jo - 78, 34, 0.1);
  else drawBao(x + 60, gy - jo - 42, 30, 0.1);
}

// health bars: Nailong's short one on the left, Mr Shou's long one (a lot of health) to the right edge, with a notch at each third.
// They sit below the lives hearts and the Sound button in the top right corner.
function hud() {
  const y = 62, bh = 28, m = 36, bwN = clamp(W*0.22, 200, 330), vsX = m + bwN + 48, sx0 = vsX + 48, bwS = W - m - sx0;
  const bar = (x0, bw, frac, trail, left, col, name, notches) => {
    ctx.save(); ctx.lineJoin = 'round';
    const fw = f => bw*clamp(f/100, 0, 1);
    ctx.fillStyle = '#2a1a06'; rr(x0 - 6, y - 6, bw + 12, bh + 12, 12); ctx.fill();
    ctx.fillStyle = '#5a3a24'; rr(x0, y, bw, bh, 8); ctx.fill();
    const seg = (f, c) => { ctx.fillStyle = c; rr(left ? x0 + bw - fw(f) : x0, y, fw(f), bh, 8); ctx.fill(); };
    seg(trail, '#e0372f'); seg(frac, frac < 30 && Math.floor(B.t*4) % 2 ? '#ff7a3d' : col);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; rr(left ? x0 + bw - fw(frac) + 4 : x0 + 4, y + 4, Math.max(0, fw(frac) - 8), 7, 3); ctx.fill();
    for (const c of notches) { const nx = x0 + fw(c); ctx.fillStyle = '#2a1a06'; ctx.fillRect(nx - 2.5, y - 2, 5, bh + 4); }
    ctx.restore();
    font(24, 700); ctx.fillStyle = '#fff'; ctx.strokeStyle = C.line; ctx.lineWidth = 6; ctx.textBaseline = 'top'; ctx.textAlign = left ? 'left' : 'right'; ctx.lineJoin = 'round';
    ctx.strokeText(name, left ? x0 : x0 + bw, y + bh + 10); ctx.fillText(name, left ? x0 : x0 + bw, y + bh + 10);
  };
  bar(m, bwN, B.hp, B.hpTrail, true, '#ffd21f', LINES_BATTLE.nameL, []);
  bar(sx0, bwS, B.shHp, B.shTrail, false, '#7ee05a', LINES_BATTLE.nameR, CHECK);
  title(LINES_BATTLE.vs, vsX, y + bh/2 + 2, 40, '#fff');
  if (B.streak >= STREAK.say && B.phase === 'play') title(LINES_BATTLE.streakX + B.streak, vsX, y + 76, 34, '#ffd21f');   // the streak as a number (Nailong says it too)
}

// one column of the instruction card: a tiny looping picture of the move, the key, the word
function cardMini(kind, mx, gy, cw, p) {
  const s = 0.5, u = (p % 1.9)/1.9, nxm = mx - cw*0.2, far = mx + cw*0.4, left = mx - cw/2;
  ctx.save(); ctx.beginPath(); ctx.rect(left + 8, gy - 152, cw - 16, 170); ctx.clip();
  ctx.fillStyle = '#d69a62'; ctx.fillRect(left, gy, cw, 20);
  ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(left, gy); ctx.lineTo(left + cw, gy); ctx.stroke();
  let ny = 0, nsx = 1, nsy = 1, arms = 'down';
  if (kind === 'm') {
    // the book comes in, the bao swings, the book flies back where it came from
    const meet = nxm + 72, by = gy - HH.m*s;
    const a = u < 0.38 ? 0.1 : u < 0.5 ? lerp(-0.9, 2.2, ease((u - 0.38)/0.12)) : u < 0.7 ? 2.2 : lerp(2.2, 0.1, (u - 0.7)/0.3);
    nailong(nxm, gy, s, {look: [1, 0], mouth: u > 0.38 && u < 0.6 ? 'o' : 'open', breathe: false, blink: false});
    if (u > 0.38 && u < 0.7) baoStick(nxm + 45*s, gy - 115*s, 50, a, 23, 18); else drawBao(nxm + 52*s, gy - 78*s, 17, 0.1);
    if (u < 0.44) { const bx = lerp(far, meet, u/0.44); drawBook(bx, by, 30, 45, -0.2, u*9, 'r');      // with its red HIT ring, like the real ones
      ell(bx, by, 32, 32); ctx.lineWidth = 8; ctx.strokeStyle = C.line; ctx.stroke(); ctx.lineWidth = 4.5; ctx.strokeStyle = '#ff3b30'; ctx.stroke(); }
    else { const k = (u - 0.44)/0.56; drawBook(lerp(meet, far + 60, k), by - 40*Math.sin(k*Math.PI*0.5), 30, 45, k*6, k*14, 'r');
      if (k < 0.4) sparkle(meet + 10, by - 6, 18*(1 - k/0.4), k*3); }
  } else {
    // the book crosses under (or over) Nailong, who jumps (or ducks) as it passes
    const bx = lerp(far, left - 40, u), near = Math.abs(bx - nxm);
    if (kind === 'l') { const j = clamp(1 - near/80, 0, 1); ny = Math.sin(j*Math.PI/2)*44; arms = j > 0 ? 'up' : 'down'; if (j > 0) { nsy = 1.08; nsx = 0.94; } }
    else if (near < 70) { nsy = 0.55; nsx = 1.25; }
    shadow(nxm, gy, 34 - ny*0.2);
    nailong(nxm, gy - ny, s, {look: [1, 0], sx: nsx, sy: nsy, arms, flail: p*14, mouth: nsy < 1 || ny > 0 ? 'o' : 'open', breathe: false, blink: false});
    if (kind === 'l') { ell(bx, gy + 2, 22, 4); ctx.fillStyle = 'rgba(74,47,12,.25)'; ctx.fill(); drawBook(bx, gy - HH.l*s, 35, 50, Math.PI/2, 0.3, 'y'); }
    else drawBook(bx, gy - HH.h*s - 8, 30, 45, u*8, u*10, 'y');
  }
  ctx.restore();
}
function drawCard() {
  const p = B.pt;
  ctx.fillStyle = `rgba(29,22,64,${0.62*clamp(p/0.2, 0, 1)})`; ctx.fillRect(-5, -5, W + 10, H + 10);
  const pw = Math.min(W - 60, 1040), ph = 528, px = W/2 - pw/2, py = H/2 - ph/2 + 6;
  const sc = lerp(0.8, 1, fxBack(clamp(p/0.3, 0, 1)));
  ctx.save(); ctx.translate(W/2, H/2); ctx.scale(sc, sc); ctx.translate(-W/2, -H/2); ctx.lineJoin = 'round';
  rr(px, py, pw, ph, 30); ctx.fillStyle = '#fff6df'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = C.line; ctx.stroke();
  title(LINES_BATTLE.cardTitle, W/2, py + 58, Math.min(60, pw/14), C.y);
  font(30, 600); ctx.fillStyle = C.line; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(LINES_BATTLE.cardGoal, W/2, py + 116);
  const gap = 22, cw = (pw - gap*4)/3, cy0 = py + 146, ch = 306;
  ['h', 'l', 'm'].forEach((kind, i) => {     // Max's order: duck, jump, hit
    const cx0 = px + gap + i*(cw + gap), mx = cx0 + cw/2, gy = cy0 + 156;
    rr(cx0, cy0, cw, ch, 22); ctx.fillStyle = '#fde3a7'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.line; ctx.stroke();
    cardMini(kind, mx, gy, cw, p + i*0.3);
    keycap(mx, gy + 40, 48, kind);
    title(LINES_BATTLE.cardWord[kind], mx, gy + 95, 44, kind === 'm' ? '#ff4f3d' : C.y);   // HIT in red, like the tag on the books
    font(23, 600); ctx.fillStyle = C.line; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(LINES_BATTLE.cardSub[kind], mx, gy + 131);
  });
  font(26, 600); ctx.fillStyle = C.line; ctx.globalAlpha = 0.65 + 0.35*Math.sin(p*4); ctx.fillText(LINES_BATTLE.cardGo, W/2, py + ph - 38); ctx.globalAlpha = 1;
  const left = clamp(1 - p/6, 0, 1);
  rr(W/2 - 130, py + ph - 18, 260*left, 7, 4); ctx.fillStyle = 'rgba(74,47,12,.35)'; ctx.fill();
  ctx.restore();
}
// a practice book in slow motion: the key it wants, big, in a pill over the fight (the HIT word is red, like the tag on the book)
function drawTeach() {
  const fb = B.phase === 'play' ? slowBook() : null;
  if (!fb) return;
  if (!fb.teachRT) fb.teachRT = B.rt;
  const k = fb.kind, word = LINES_BATTLE.teach[k], s = 70;
  font(64, 700); const ww = ctx.measureText(word).width, kw = k === 'm' ? s*2.5 : s, tw = kw + 34 + ww;
  const pul = (1 + 0.05*Math.sin(B.rt*7))*Math.max(0.01, fxBack(clamp((B.rt - fb.teachRT)/0.25, 0, 1)));
  ctx.save(); ctx.translate(W/2, H*0.31); ctx.scale(pul, pul); ctx.lineJoin = 'round';
  rr(-tw/2 - 40, -62, tw + 80, 124, 62); ctx.fillStyle = 'rgba(29,22,64,.9)'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.line; ctx.stroke();
  keycap(-tw/2 + kw/2, -2, s, k, 0.5 + 0.5*Math.sin(B.rt*7));
  title(word, -tw/2 + kw + 34 + ww/2, 2, 64, k === 'm' ? '#ff4f3d' : C.y);
  ctx.restore();
}
// slow motion: the room dims a little under the fighters, so the moment reads as special
function drawSlowTint() {
  const a = 0.32*clamp((1 - B.slow)/(1 - SLOW.scale), 0, 1);
  if (a > 0.005) { ctx.fillStyle = `rgba(29,22,64,${a})`; ctx.fillRect(-20, -20, W + 40, H + 40); }
}
// Nailong's and Mr Shou's speech bubbles (never on a replay: say() skips them)
function drawTalk() {
  if (B.phase !== 'play' && B.phase !== 'intro') return;
  const n = B.talk.nai, s = B.talk.shou;
  if (n && B.rt - n.t0 < n.life) bubble(n.text, NX() + 30, GY() - 205 - jumpOff(), n.text === LINES_BATTLE.tooEasy ? 28 : 26, 260);   // rides the whole jump, so it never sits on his face
  if (s && B.rt - s.t0 < s.life) bubble(s.text, SX() + 10, GY() - 335, 26, 300);
}
// the red HIT tag (and ring) on a middle book: "hit this one"
function hitMark(b) {
  const pul = 1 + 0.06*Math.sin(B.rt*9);
  ctx.save(); ctx.lineJoin = 'round';
  ell(b.x, b.y, 66*pul, 66*pul); ctx.lineWidth = 13; ctx.strokeStyle = C.line; ctx.stroke(); ctx.lineWidth = 7; ctx.strokeStyle = '#ff3b30'; ctx.stroke();
  ctx.translate(b.x, b.y - 96); ctx.scale(pul, pul);
  font(28, 700); const tw = ctx.measureText(LINES_BATTLE.hitTag).width + 30;
  ctx.beginPath(); ctx.moveTo(-10, 16); ctx.lineTo(0, 30); ctx.lineTo(10, 16); ctx.closePath(); ctx.fillStyle = '#ff3b30'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
  rr(-tw/2, -20, tw, 40, 14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(LINES_BATTLE.hitTag, 0, 1);
  ctx.restore();
}

function cards() {
  const p = B.pt;
  if (B.phase === 'card') { drawCard(); return; }
  if (B.phase === 'intro') {
    const first = B.long;
    if (first && p < 0.65) {
      const cx = lerp(-W*0.6, W/2, ease(clamp(p/0.2, 0, 1))) + ease(clamp((p - 0.45)/0.2, 0, 1))*W*1.2;
      ctx.fillStyle = 'rgba(29,22,64,.88)'; ctx.fillRect(0, H*0.36, W, 150);
      title(LINES_BATTLE.round, cx, H*0.36 + 78, Math.min(120, W/9), C.y);
    }
    const fs = first ? 0.6 : 0;
    if (p > fs && p < fs + 0.55) {
      const u = clamp((p - fs)/0.2, 0, 1), sc = (0.4 + 0.6*ease(u))*(1 + Math.max(0, 1 - (p - fs)/0.2)*0.4);
      ctx.save(); ctx.translate(W/2, H*0.42); ctx.scale(sc, sc); ctx.globalAlpha = clamp((fs + 0.55 - p)/0.15, 0, 1);
      title(LINES_BATTLE.fight, 0, 0, Math.min(150, W/7), '#ff4f3d'); ctx.restore();
    }
  }
  drawTeach();
  if (B.phase === 'lose') {
    const u = ease(clamp(B.pt/0.2, 0, 1));
    ctx.save(); ctx.translate(W/2, H*0.34); ctx.scale(0.6 + 0.4*u, 0.6 + 0.4*u); title(LINES_BATTLE.ko, 0, 0, Math.min(110, W/9), '#ff4f3d'); ctx.restore();
    if (!BT.replay) title(B.failLine, W/2, H*0.34 + 80, Math.min(40, W/26), '#fff');
  }
  if (B.phase === 'win' || B.phase === 'done') {
    const u = ease(clamp((B.winT - 0.15)/0.25, 0, 1));
    // KO card (Street Fighter final hit, Cuphead KNOCKOUT): slow rays behind the title, letterbox bars, one white flash on the hit
    if (u > 0) {
      const rl = Math.min(W, H)*0.36*u, a0 = B.winT*0.3;
      ctx.beginPath(); for (let i = 0; i < 14; i++) { const a = a0 + i*Math.PI*2/14; ctx.moveTo(W/2, H*0.28); ctx.lineTo(W/2 + Math.cos(a - 0.065)*rl, H*0.28 + Math.sin(a - 0.065)*rl); ctx.lineTo(W/2 + Math.cos(a + 0.065)*rl, H*0.28 + Math.sin(a + 0.065)*rl); ctx.closePath(); }
      ctx.fillStyle = 'rgba(255,225,77,.35)'; ctx.fill();
    }
    const bh = H*0.07*ease(clamp((B.winT - 0.05)/0.25, 0, 1));
    ctx.fillStyle = C.navy; ctx.fillRect(-5, -5, W + 10, bh + 5); ctx.fillRect(-5, H - bh, W + 10, bh + 5);
    ctx.save(); ctx.translate(W/2, H*0.28); const s = (0.5 + 0.5*u)*(1 + Math.max(0, 0.3 - (B.winT - 0.15))*1.2); ctx.scale(s, s);
    title(LINES_BATTLE.ko, 0, 0, Math.min(150, W/7), C.y); ctx.restore();
    const ci = Math.floor((B.winT - 1.0)/0.5);
    if (ci >= 0 && ci < 3) { const f = ((B.winT - 1.0)/0.5) % 1; ctx.save(); ctx.translate(SX() - 210, GY() - 250); const k = 1 + (1 - f)*0.5; ctx.scale(k, k); title(LINES_BATTLE.count[ci], 0, 0, 90, '#fff'); ctx.restore(); }
    if (!BT.replay) {        // a replay ends on the K.O. alone
      if (B.winT > 2.6) title(LINES_BATTLE.winLine, W/2, H*0.28 + 90, Math.min(44, W/24), '#fff');
      if (B.winT > 2.6) bubble(LINES_BATTLE.winNai, NX() - 30, GY() - 270, 32);
      if (B.winT > 3.4) bubble(LINES_BATTLE.winShou, SX() - 150, GY() - 110, 28, 300);
    }
    const fl = 0.8*(1 - (B.rt - B.koRT)/0.2);
    if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(-5, -5, W + 10, H + 10); }
  }
}

function drawParts() {
  for (const f of B.fx) {       // under the stars and the THWAP text
    const k = (B.rt - f.t0)/f.life;
    if (f.k === 'ring') { fxRing(f.x, f.y, k, 20, f.r1, f.col, 10); ctx.lineWidth = 1; continue; }
    if (k <= 0 || k >= 1) continue;
    const s = lerp(0.5, 1.15, 1 - (1 - k)*(1 - k));
    ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot); ctx.scale(s, s); ctx.globalAlpha = clamp((1 - k)/0.35, 0, 1);
    ctx.beginPath(); for (let i = 0; i < 24; i++) { const rad = i % 2 ? f.r*0.55 : i % 4 ? f.r*0.82 : f.r; ctx.lineTo(Math.sin(i*Math.PI/12)*rad, -Math.cos(i*Math.PI/12)*rad); }
    ctx.closePath(); ctx.fillStyle = f.col; ctx.fill(); ctx.lineJoin = 'round'; ctx.lineWidth = 5/s; ctx.strokeStyle = C.line; ctx.stroke(); ctx.restore();
  }
  for (const p of B.parts) {
    const u = clamp(p.life/p.max, 0, 1);
    if (p.k === 'text') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); const sc = 1 + Math.max(0, u - 0.8)*2.5; ctx.scale(sc, sc); ctx.globalAlpha = clamp(u*2.5, 0, 1); title(p.text, 0, 0, p.size, p.fill); ctx.restore(); }
    else if (p.k === 'star') { ctx.save(); ctx.globalAlpha = clamp(u*2, 0, 1); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.beginPath(); for (let i = 0; i < 10; i++) { const rad = i % 2 ? p.r*0.45 : p.r; ctx.lineTo(Math.sin(i*Math.PI/5)*rad, -Math.cos(i*Math.PI/5)*rad); } ctx.closePath(); ctx.fillStyle = p.col; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = C.line; ctx.stroke(); ctx.restore(); }
    else if (p.k === 'puff') { ctx.globalAlpha = clamp(u, 0, 1)*0.8; ell(p.x, p.y, p.r*(2 - u), p.r*(2 - u)); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(74,47,12,.4)'; ctx.stroke(); ctx.globalAlpha = 1; }
    else if (p.k === 'book') drawBook(p.x, p.y, p.w, p.h, p.rot, p.spin || 0, p.which, clamp(u*2, 0, 1));
    else if (p.k === 'glasses') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.strokeStyle = '#b4bac4'; ctx.lineWidth = 4; ctx.fillStyle = 'rgba(205,225,245,.35)'; for (const gx of [-26, 4]) { rr(gx, -9, 22, 17, 4); ctx.fill(); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-4, -3); ctx.lineTo(4, -3); ctx.stroke(); ctx.restore(); }
  }
}

function drawBooksInFlight() {
  const sh = B.sh;
  if (sh.st === 'wind' && B.phase === 'play') {      // telegraph: his lane lights up and the key for it appears in front of him
    const yy = GY() - HH[sh.kind], u = clamp(sh.t/sh.wind, 0, 1);
    ctx.save(); ctx.setLineDash([16, 14]); ctx.lineWidth = 6; ctx.strokeStyle = `rgba(255,255,255,${0.25 + 0.35*u})`; ctx.beginPath(); ctx.moveTo(NX() + 60, yy); ctx.lineTo(SX() - 120, yy); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.globalAlpha = clamp(u*3, 0, 1); keycap(SX() - 210, yy, 40 + 6*ease(clamp(u*3, 0, 1)), sh.kind); ctx.restore();
  }
  for (const b of B.books) {
    if (b.kind === 'l') { ell(b.x, GY() + 4, 44, 8); ctx.fillStyle = 'rgba(74,47,12,.25)'; ctx.fill(); }
    if (b.st === 'ret' && b.perfect) { ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 6; ctx.lineCap = 'round'; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(b.x - 60, b.y + i*26); ctx.lineTo(b.x - 150 - Math.abs(i)*20, b.y + i*26); ctx.stroke(); } ctx.restore(); }
    // a fast book (a streak has sped him up) trails speed lines
    if (b.st === 'fly' && !b.teach && b.v > 470 && !b.checked) { ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      const n = b.v > 580 ? 3 : 2; for (let i = 0; i < n; i++) { const oy = (i - (n - 1)/2)*28; ctx.beginPath(); ctx.moveTo(b.x + 48, b.y + oy); ctx.lineTo(b.x + 48 + (b.v - 400)*0.35, b.y + oy); ctx.stroke(); } ctx.restore(); }
    // every flying book carries its key just behind it, in its lane; the key waits where the wind-up showed it until the book catches up
    // (drawn under the book, so a middle book's red HIT ring stays clean as it flies through the key)
    const waiting = b.teach && !b.go && b.st === 'fly' && b.x - NX() <= SLOW.at;
    if (b.st === 'fly' && !b.checked) keycap(Math.min(b.x + (b.kind === 'm' ? 112 : 74), SX() - 210), GY() - HH[b.kind] + (b.arc || 0),
      waiting ? 46 + 4*Math.sin(B.rt*7) : 40, b.kind, waiting ? 0.5 + 0.5*Math.sin(B.rt*7) : 0);
    drawBook(b.x, b.y, b.w, b.h, b.rot, b.spin, b.which);
    if (b.kind === 'm' && b.st === 'fly' && !b.checked) hitMark(b);
  }
}

function touchHints() {
  if (B.phase !== 'play' || B.hintT > 6 || !(navigator.maxTouchPoints > 0)) return;
  ctx.save(); ctx.globalAlpha = 0.28*(1 - clamp((B.hintT - 4.5)/1.5, 0, 1)); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
  ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(W/2, H*0.12); ctx.lineTo(W/2, H); ctx.moveTo(0, H*0.6); ctx.lineTo(W/2, H*0.6); ctx.stroke();
  font(36, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(LINES_BATTLE.cardWord.l, W*0.25, H*0.38); ctx.fillText(LINES_BATTLE.cardWord.h, W*0.25, H*0.8); ctx.fillText(LINES_BATTLE.cardWord.m, W*0.75, H*0.5); ctx.restore();
}

function frameDraw(t, dt) {
  // dt is 0 while main.js holds the game under its own overlay: then nothing moves, not even the hit-stop or the shake
  B.rt += dt; B.fx = B.fx.filter(f => B.rt - f.t0 < f.life);
  if (dt > 0) {
    if (B.freeze > 0) { B.freeze -= dt; dt = 0.0001; }
    if (B.phase === 'win' && B.winT < 0.7) dt *= 0.45;     // slow motion on the knockout
    if (B.phase !== 'done') update(dt);
  }
  ctx.save();
  if (B.shake > 0) ctx.translate(Math.sin(B.rt*90)*B.shake*18, Math.cos(B.rt*77)*B.shake*12);
  cafe(); drawSlowTint();
  drawShou(); drawNailong(); drawBooksInFlight(); drawParts(); drawTalk();
  ctx.restore();
  hud(); touchHints(); cards();
}

// keys that never start the fight from the card: modifiers (cmd-tab), Tab, Escape, and M (the mute key)
const NOT_ANY = new Set(['Meta', 'Control', 'Alt', 'Shift', 'CapsLock', 'Tab', 'Escape', 'Fn', 'm', 'M']);
GAMES.battle = {
  title: LINES_BATTLE.title,
  hint: LINES_BATTLE.hint,
  enter(api) { this.api = api; BT.replay = !!(api && api.replay); reset(true); },   // api.replay (a replay from the end menu): no card, no practice, no dialogue
  draw(t, dt) { frameDraw(t, dt); },
  key(e) {
    const k = e.key;
    const sw = k === ' ' || k === 'Enter' || k === 'z' || k === 'x' || k === 'ArrowRight' || k === 'd';
    const up = k === 'ArrowUp' || k === 'w' || k === 'ArrowLeft';
    const dn = k === 'ArrowDown' || k === 's';
    if (sw || up || dn) e.preventDefault();
    if (B.phase === 'card') { if (!e.repeat && B.pt > 0.35 && !NOT_ANY.has(k) && !e.metaKey && !e.ctrlKey) startFight(); return; }
    if (B.phase === 'lose') { if (!e.repeat && B.pt > 0.6 && !NOT_ANY.has(k) && !e.metaKey && !e.ctrlKey) reset(false); return; }   // the joke has had a moment: retry now
    if (sw) act('m'); else if (up) act('l'); else if (dn) act('h');
  },
  pointer(kind, x, y) {
    if (kind !== 'down') return;
    if (B.phase === 'card') { if (B.pt > 0.35) startFight(); return; }
    if (B.phase === 'lose') { if (B.pt > 0.6) reset(false); return; }
    if (x > W*0.5) act('m'); else if (y < H*0.6) act('l'); else act('h');
  },
};
})();
