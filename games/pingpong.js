// ---------- mini-game: PING PONG against Liu Lao Shi (the Chinese teacher) ----------
// Modelled on mobile 3D table-tennis games (view from behind your end of the table, big bat at the near edge, ball bounces
// once on each half, shadow on the table, "PLAYER POINT / OUT / NET" call-outs, first to N points) and real rallies (the
// receiver shuffles sideways, stays low, wins by placing the ball wide and fast, not by hitting it harder than a robot).
// The classroom is the backdrop: whiteboard, bamboo plates, pinyin cards, pink and purple trays (see research/ROUND2.md).
// Rules kept real (Max, 12 Oct: "terribly boring especially if it's wrong"): a serve is tossed up, bounces once on the
// server's half and then once on the receiver's; a serve that clips the net and lands in is a LET and is served again;
// every return bounces once on the other half; the serve swaps every 2 points; one match, first to 3 points, win by 2
// (deuce at 2-2, the serve then swaps every point, like 10-10 in a real game).
// EVERY visible line lives here.
const LINES_PINGPONG = {
  intro: 'PING PONG',                       // the instruction card: title
  vs: 'vs Liu Lao Shi',                     // card: under the title
  move: 'move the bat',                     // card: next to the ← → keys
  spaceKey: 'space',                        // printed on the space bar keycap (card and serve prompt)
  space: 'serve, and smash',                // card: next to the space bar
  intro2: 'first to 3 points',              // card: the goal
  rule: 'win by 2, like the real thing',    // card: under the goal
  go: 'press any key',                      // under the card
  intro3: 'Liu Lao Shi serves',             // her bubble on the very first serve
  serve: ['Zhǔnbèi? Ready?', 'Here it comes, Nai Long.', 'Hǎo. Ready?', 'Eyes on the ball!'],
  yourServe: ['Your serve, Nai Long.', 'Nǐ fāqiú. Your serve.'],   // her bubble when the serve swaps to you
  toServe: 'to serve',                      // next to the space keycap while you hold the ball
  deuceLiu: 'Píngfēn! Win by two.',         // her bubble at 2-2 and 3-3 (平分, deuce)
  deuce: 'DEUCE', matchPoint: 'MATCH POINT',  // the tag under the scoreboard
  fault: 'FAULT!', let: 'LET! Serve again.',
  liuPoint: ['Zài lái! Again!', 'Ha ha! One for me.', 'Keep your eye on the ball.', 'Aiya, so close, Nai Long.', 'Wǒ yíng! Just one.'],     // she wins a point
  youPoint: ['Aiya!', 'Wah, so fast!', 'Hǎo qiú! Good ball.', 'Nai Long, so clever!', 'Hmm. I was not ready.', 'Mmm! Again!'],      // you win a point
  nlPoint: ['Yes!', 'Ha!', 'Take that.', 'Boing!'],
  nlLose: ['Aww.', 'Hmph.', 'Eep.', 'Next one.'],
  out: 'OUT!', net: 'NET!', good: 'POINT!', theirs: 'Her point',
  lunge: 'Aiyooo!',
  fast: 'Hǎo!',
  winTitle: 'NAILONG WINS!',
  winLiu: 'Hěn hǎo! Full marks. Go back to your seat.',        // callback to "move to the front"
  winNl: 'Can I go home now?',
  loseTitle: 'Liu Lao Shi wins.',
  restart: ['Zài lái. Again.', 'Rematch. I will go easy.', 'Again! I am not even tired.'],
  board1: 'pīng pāng qiú', board2: '乒乓球',            // top left of the whiteboard
  boardHeart: '心', boardQ1: '1. after graduation, work as ...', boardQ2: '2. compare work ...',   // left over from the lesson
  boardYou: 'Nailong', boardLiu: 'Liu Lao Shi',          // the marker scoreboard on the whiteboard
  hudYou: 'NAILONG', hudLiu: 'LIU LAO SHI',              // the score bar at the top
  card1py: 'xīng qī yī', card1: '星期一', card2py: 'tiān', card2: '天',   // the two flash cards on the wall
  sign: ["Please don't touch or", 'move any displays in', 'this classroom.', 'Thank you! Xiexie!'],   // the sign on the wall
};

// ====================================================================================
// the teacher, drawn as a global so story clips can reuse her.  Same calling style as person():
//   liuLaoShi(x, y, s, {mouth:'smile'|'o'|'open'|'flat', look:[dx,dy], aL, aR, reachL, reachR, bat, marker, rot, sx, sy, slip, blink, pony})
// feet at (x, y), s = 1 is about 272 units tall. aL / aR = how far each arm is swung OUT from hanging (radians, 0 = down,
// 1.57 = straight out sideways, 3.1 = straight up). aL is the arm on the left of the screen. bat puts a ping pong bat in the
// left hand, marker puts a whiteboard marker in the right. slip (0..1) slides the glasses down her nose, pony swings the ponytail.
// ====================================================================================
function liuLaoShi(x, y, s, o = {}) {
  const {mouth = 'smile', look = [0, 0], aL = 0.2, aR = 0.2, reachL = 1, reachR = 1, bat = false, marker = false, rot = 0,
         sx = 1, sy = 1, slip = 0, blink = 0, pony = 0, batAng = 0.45} = o;
  const L = C.line, skin = '#f0c8a4', pink = '#f3b3bd', pinkD = '#dd94a3', trou = '#8d827a', blk = '#1e1c24',
        hair = '#251b1f', frame = '#6b2b2e';
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s * sx, s * sy); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const SH = [[-40, -160], [40, -160]], AL = 74;
  // path of one arm (capsule + hand) built under its own transform; the path keeps the transformed coordinates
  const armPath = (side, ang, reach, part) => {
    ctx.save(); ctx.translate(SH[side][0], SH[side][1]); ctx.rotate(side === 0 ? ang : -ang);
    if (part === 'sleeve') rr(-9.5, -8, 19, AL * reach + 8, 9.5); else ell(0, AL * reach + 6, 10.5, 10.5);
    ctx.restore();
  };
  const parts = [
    [() => { ctx.save(); ctx.translate(-30, -190); ctx.rotate(0.25 + pony); ell(0, 14, 11, 27); ctx.restore(); }, hair],
    [() => rr(-27, -96, 24, 92, 7), trou], [() => rr(3, -96, 24, 92, 7), trou],
    [() => ell(-14, -4, 16, 7), '#1b1b1b'], [() => ell(14, -4, 16, 7), '#1b1b1b'],
    [() => rr(-31, -112, 62, 34, 10), trou],
    [() => rr(-34, -174, 68, 90, 16), blk],
    [() => rr(-42, -174, 26, 98, 12), pink], [() => rr(16, -174, 26, 98, 12), pink],
    [() => armPath(0, aL, reachL, 'sleeve'), pink], [() => armPath(1, aR, reachR, 'sleeve'), pink],
    [() => armPath(0, aL, reachL, 'hand'), skin], [() => armPath(1, aR, reachR, 'hand'), skin],
    [() => rr(-9, -188, 18, 20, 5), skin],
    [() => ell(-35, -217, 6, 9), skin], [() => ell(35, -217, 6, 9), skin],
    [() => ell(0, -218, 35, 39), skin],
  ];
  ctx.lineWidth = 12; ctx.strokeStyle = L;
  for (const p of parts) { p[0](); ctx.stroke(); }
  for (const p of parts) { p[0](); ctx.fillStyle = p[1]; ctx.fill(); }
  // polka dots on the black top, in the gap between the cardigan fronts
  ctx.fillStyle = '#fff';
  for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) { ell(-9 + c*9 + (r%2)*4.5 - 2, -166 + r*17, 2.7, 2.7); ctx.fill(); }
  // cardigan seams and buttons
  ctx.strokeStyle = pinkD; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-16, -172); ctx.lineTo(-16, -78); ctx.moveTo(16, -172); ctx.lineTo(16, -78); ctx.stroke();
  ctx.fillStyle = '#f6d2d8'; for (const yy of [-150, -128, -106]) { ell(11, yy, 2.2, 2.2); ctx.fill(); }
  // lanyard, ID card, keys
  ctx.strokeStyle = '#3a3943'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-8, -184); ctx.lineTo(4, -122); ctx.moveTo(8, -184); ctx.lineTo(4, -122); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.strokeStyle = L; ctx.lineWidth = 2.5; rr(-3, -124, 17, 24, 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#7aa7d9'; ctx.fillRect(0, -121, 11, 6);
  ctx.fillStyle = '#b9b9c2'; ell(-8, -118, 4, 5); ctx.fill(); ctx.stroke();
  // ---- hair (pulled back, centre parting) ----
  ctx.fillStyle = hair; ctx.strokeStyle = L; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-37, -212); ctx.quadraticCurveTo(-43, -265, 0, -264); ctx.quadraticCurveTo(43, -265, 37, -212);
  ctx.quadraticCurveTo(33, -234, 18, -242); ctx.quadraticCurveTo(2, -246, 0, -240); ctx.quadraticCurveTo(-2, -246, -18, -242);
  ctx.quadraticCurveTo(-33, -234, -37, -212); ctx.closePath(); ctx.fill(); ctx.stroke();
  // ---- face ----
  const sl = slip * 7;
  ctx.fillStyle = 'rgba(240,120,130,.28)'; ell(-22, -204, 6, 4); ctx.fill(); ell(22, -204, 6, 4); ctx.fill();
  for (const ex of [-14, 14]) {
    const px = ex + look[0] * 2.2, py = -219 + look[1] * 2;
    if (blink > 0.5) { ctx.strokeStyle = L; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(px - 5, py + 1); ctx.quadraticCurveTo(px, py + 4, px + 5, py + 1); ctx.stroke(); }
    else { ell(px, py, 4.2, 4.6); ctx.fillStyle = '#1a1416'; ctx.fill(); ell(px + 1.4, py - 1.6, 1.4, 1.4); ctx.fillStyle = '#fff'; ctx.fill(); }
  }
  ctx.strokeStyle = L; ctx.lineWidth = 2.6;
  const bro = mouth === 'o' ? -3 : 0;
  for (const ex of [-14, 14]) { ctx.beginPath(); ctx.moveTo(ex - 7, -233 + bro); ctx.quadraticCurveTo(ex, -237 + bro, ex + 7, -233 + bro); ctx.stroke(); }
  // glasses: dark red-brown rectangles, they slide down when she is shocked
  ctx.strokeStyle = frame; ctx.lineWidth = 4.2; ctx.fillStyle = 'rgba(255,255,255,.16)';
  rr(-30, -229 + sl, 25, 17, 4); ctx.fill(); ctx.stroke(); rr(5, -229 + sl, 25, 17, 4); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-5, -222 + sl); ctx.lineTo(5, -222 + sl); ctx.moveTo(-30, -222 + sl); ctx.lineTo(-37, -224 + sl); ctx.moveTo(30, -222 + sl); ctx.lineTo(37, -224 + sl); ctx.stroke();
  // nose and mouth
  ctx.strokeStyle = 'rgba(74,47,12,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-2, -212 + sl*0.6); ctx.quadraticCurveTo(0, -207, 3, -208); ctx.stroke();
  ctx.strokeStyle = L; ctx.lineWidth = 3;
  if (mouth === 'o') { ell(0, -194, 5, 6.5); ctx.fillStyle = '#5a1a22'; ctx.fill(); ctx.stroke(); }
  else if (mouth === 'open') { ctx.beginPath(); ctx.moveTo(-13, -200); ctx.quadraticCurveTo(0, -181, 13, -200); ctx.closePath(); ctx.fillStyle = '#6a1c26'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-10, -199.5); ctx.lineTo(10, -199.5); ctx.lineTo(9, -196); ctx.lineTo(-9, -196); ctx.closePath(); ctx.fill(); }
  else if (mouth === 'flat') { ctx.beginPath(); ctx.moveTo(-8, -196); ctx.lineTo(8, -196); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(-11, -199); ctx.quadraticCurveTo(0, -187, 11, -199); ctx.stroke(); }
  // ---- things in her hands, drawn last so they sit in front ----
  if (bat) {
    ctx.save(); ctx.translate(SH[0][0], SH[0][1]); ctx.rotate(aL); ctx.translate(0, AL * reachL + 6); ctx.rotate(batAng - 0.2);
    ctx.lineCap = 'round'; ctx.strokeStyle = L; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, 24); ctx.stroke();
    ell(0, 44, 24, 26); ctx.lineWidth = 9; ctx.stroke();
    ctx.strokeStyle = '#c9a06a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, 24); ctx.stroke();
    ell(0, 44, 24, 26); ctx.fillStyle = '#d2382f'; ctx.fill(); ctx.strokeStyle = '#c9a06a'; ctx.lineWidth = 3; ctx.stroke();
    ell(-7, 36, 6, 4, -0.5); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fill();
    ctx.restore();
  }
  if (marker) {
    ctx.save(); ctx.translate(SH[1][0], SH[1][1]); ctx.rotate(-aR); ctx.translate(0, AL * reachR + 6); ctx.rotate(-0.5);
    ctx.lineCap = 'butt'; ctx.fillStyle = '#fff'; ctx.strokeStyle = L; ctx.lineWidth = 2.5; rr(-3.5, -3, 7, 24, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2a58c8'; ctx.fillRect(-3.5, 15, 7, 6); ctx.restore();
  }
  ctx.restore();
}

// ====================================================================================
// game state
// ====================================================================================
const PP_TL = 2.74, PP_HW = 0.7625, PP_NY = 1.37, PP_NH = 0.1525, PP_BR = 0.055, PP_G = 5.5, PP_CD = 1.8, PP_CAM = 0.9;
const PP_R = 0.24, PP_AIMK = 0.75, PP_WIN = 3, PP_LIUY = 3.0, PP_REACH = 0.24, PP_YOUY = -0.15;
// pacing (Max, 12 Oct: "slower, like Mr Shou's fight"): the ball, her feet and her reactions run at PP_SLOW of wall time;
// your bat, the words and the call-outs run at full speed. PP_KEYV = how fast a held arrow key slides the bat (table
// widths are 1.5), PP_CARD = the longest the instruction card waits for a key, PP_TOSS = the serve toss in seconds.
const PP_SLOW = 0.72, PP_KEYV = 1.4, PP_CARD = 6, PP_TOSS = 0.55;
// difficulty: PP_BATV = the fastest Nailong's bat can follow the trackpad (a held key is slower still, PP_KEYV);
// her shots: PP_FAST = base chance of a fast deep attack, PP_ERR = base chance she nets it or hits it long,
// PP_STRAIGHT = chance she plays it back at you instead of away from you
const PP_BATV = 1.8, PP_FAST = 0.26, PP_ERR = 0.05, PP_STRAIGHT = 0.25;
const PPQ = new URLSearchParams(location.search);
let PP = {}, PPL = {K0: 400, F: 720, hy: 200};
const PP_REPLAY = {on: false};
const ppRand = (a, b) => a + Math.random() * (b - a);
const ppPick = a => a[Math.floor(Math.random() * a.length)];

function ppLayout() {
  const tw = Math.min(W * 0.52, 700);
  PPL.K0 = tw / (2 * PP_HW); PPL.F = PPL.K0 * PP_CD; PPL.hy = H * 0.28;
}
function pj(x, y, z) { const k = PPL.F / (y + PP_CD); return [W / 2 + x * k, PPL.hy + (PP_CAM - z) * k, k]; }

function ppReset(full) {
  const keep = full ? {lost: 0, stats: {pts: 0, matches: 0, wins: 0, losses: 0, shots: 0}, keys: {l: false, r: false}}
                    : {lost: PP.lost, stats: PP.stats, keys: PP.keys};
  PP = Object.assign({
    phase: full ? 'card' : 'serve', timer: 0, cardT: 0, score: {you: 0, liu: 0}, t: 0, rally: 0, shots: 0, serveN: 0,
    server: 'liu', toss: -1, wait: 0,
    ball: {x: 0, y: PP_LIUY - 0.1, z: 0.42, vx: 0, vy: 0, vz: 0, last: null, bounces: 0, trail: [], live: false, sq: 0, serve: false, sb: 0, let: false},
    bat: {x: 0, z: 0.3, vx: 0, vz: 0, swing: 0, cool: 0}, tgt: {x: 0, z: 0.3}, pow: 0, pred: null,
    liu: {x: 0, aim: 0, react: 0, swing: 0, mood: 'idle', moodT: 0, lunge: 0, slip: 0, blink: 0, pony: 0, fast: false, lungeDir: 1},
    nl: {x: W / 2, mood: 'idle', moodT: 0, sq: 0}, fx: [], pop: null, say: null, nlSay: null, over: false, done: false, stop: 0, shake: 0, hudPop: null, netW: 0,
    dumb: PPQ.get('dumb') === '1', mid: PPQ.get('mid') === '1', human: PPQ.get('human') === '1', botErr: 0,
    hum: {id: -1, react: 0, err: 0, smash: false, sT: 0, pressed: false},
  }, keep);
  PP.vmax = Math.max(0.4, 0.62 - 0.06 * PP.lost);   // she gets a little slower after every match she wins
  // test hook: ?show=won or ?show=lost freezes the end screens for screenshots
  const sh = PPQ.get('show');
  if (full && sh === 'won') { PP.score.you = 3; PP.score.liu = 1; PP.phase = 'won'; PP.timer = 9; PP.nl.mood = 'win'; PP.nl.moodT = 9; PP.liu.mood = 'lose'; PP.liu.moodT = 9; PP.say = {text: LINES_PINGPONG.winLiu, t: 99}; PP.over = true; }
  if (full && sh === 'lost') { PP.phase = 'again'; PP.timer = 99; PP.say = {text: LINES_PINGPONG.restart[0], t: 99}; }
}

// ---------- the rules ----------
// who serves: two serves each, Liu Lao Shi first; from 2-2 (deuce) the serve swaps every point (the real rule at 10-10)
function ppServerNow() {
  const n = PP.score.you + PP.score.liu, d = 2 * (PP_WIN - 1), k = n < d ? Math.floor(n / 2) : d / 2 + (n - d);
  return k % 2 === 0 ? 'liu' : 'you';
}
const ppTied = () => PP.score.you === PP.score.liu && PP.score.you >= PP_WIN - 1;
// the tag under the scoreboard: DEUCE when tied at 2-2 or later, MATCH POINT when the leader needs one more
function ppTag() {
  const s = PP.score;
  if (PP.over || !['serve', 'rally', 'point'].includes(PP.phase)) return null;
  if (ppTied()) return {text: LINES_PINGPONG.deuce, c: '#ff9bb0'};
  if (Math.max(s.you, s.liu) >= PP_WIN - 1 && s.you !== s.liu) return {text: LINES_PINGPONG.matchPoint, c: C.y};
  return null;
}

// ---------- physics ----------
const ppOnTable = (x, y) => Math.abs(x) <= PP_HW + 0.02 && y >= -0.02 && y <= PP_TL + 0.02;
// launch ball b so it lands at (tx, ty) on the table after time T, clearing the net
function ppLaunch(b, tx, ty, T, low) {
  let vx = 0, vy = 0, vz = 0;
  for (let i = 0; i < 9; i++) {
    vy = (ty - b.y) / T; vx = (tx - b.x) / T; vz = (-b.z + 0.5 * PP_G * T * T) / T;
    const tn = (PP_NY - b.y) / vy;
    if (tn > 0 && tn < T) { const zn = b.z + vz * tn - 0.5 * PP_G * tn * tn; if (zn < PP_NH + PP_BR + 0.04) { T *= 1.1; continue; } }
    break;
  }
  b.vx = vx; b.vy = vy; b.vz = vz * (low ? 0.5 : 1);
}
// a serve: first bounce at y1 on the server's own half, second at y2 on the receiver's half, arriving at x2.
// With restitution 0.82 the two flights fix the speed: vy^2 = (D2 - 0.82 d1) g d1 / (1.64 z0). If the arc after the first
// bounce would not clear the net, the second bounce moves deeper until it does.
function ppServeLaunch(b, y1, y2, x2) {
  const d1 = Math.abs(y1 - b.y), z0 = Math.max(0.2, b.z);
  let D2 = Math.abs(y2 - y1), vy = 1, T1 = 0.2, vz0 = 0;
  for (let k = 0; k < 8; k++) {
    vy = Math.sqrt(Math.max(0.3, (D2 - 0.82 * d1) * PP_G * d1 / (1.64 * z0)));
    T1 = d1 / vy; vz0 = (0.5 * PP_G * T1 * T1 - z0) / T1;
    const vb = 0.82 * (PP_G * T1 - vz0), tn = Math.abs(PP_NY - y1) / vy, zn = vb * tn - 0.5 * PP_G * tn * tn;
    if (zn > PP_NH + PP_BR + 0.03) break;
    D2 += 0.12;
  }
  b.vy = Math.sign(y2 - b.y) * vy; b.vz = vz0; b.vx = (x2 - b.x) / (T1 + D2 / vy);
}
// run a copy of the ball forward until it crosses y = plane going in direction dir (-1 toward you, +1 toward her)
function ppPredict(b, plane, dir) {
  let x = b.x, y = b.y, z = b.z, vx = b.vx, vy = b.vy, vz = b.vz, t = 0;
  for (let i = 0; i < 480; i++) {
    const h = 1 / 120; x += vx * h; y += vy * h; z += vz * h; vz -= PP_G * h; t += h;
    if (z <= 0 && vz < 0 && ppOnTable(x, y)) { z = 0; vz = -vz * 0.82; }
    if (dir > 0 ? y >= plane : y <= plane) return {x, z, t};
    if (z < -0.7) break;
  }
  return null;
}

function ppFx(x, y, kind, c) { PP.fx.push({x, y, t: 0, kind, c: c || '#fff'}); }
function ppSay(who, text, dur = 1.5) { if (PP_REPLAY.on) return; if (who === 'liu') PP.say = {text, t: dur, d: dur}; else PP.nlSay = {text, t: dur}; }
function ppPopup(text, c) { PP.pop = {text, c: c || C.y, t: 1.3}; }

function ppPoint(winner, reason) {
  if (PP.phase !== 'rally') return;
  PP.phase = 'point'; PP.timer = 1.7; PP.score[winner]++;
  PP.stats.pts++; PP.hudPop = {who: winner, t: 0.4};
  const L = PP.liu, N = PP.nl, LP = LINES_PINGPONG;
  const call = reason === 'out' ? LP.out : reason === 'net' ? LP.net : reason === 'fault' ? LP.fault : null;
  if (winner === 'you') {
    N.mood = 'win'; N.moodT = 1.5; L.mood = L.fast ? 'duck' : 'lose'; L.moodT = 1.6;
    window.SFX && SFX.play('ding'); ppSay('liu', ppPick(LP.youPoint), 1.6); ppSay('nl', ppPick(LP.nlPoint), 1.2);
    ppPopup(call || LP.good, '#7be07b');
  } else {
    N.mood = 'lose'; N.moodT = 1.5; L.mood = 'win'; L.moodT = 1.6;
    window.SFX && SFX.play('oof', {g: 0.6}); ppSay('liu', ppPick(LP.liuPoint), 1.6); ppSay('nl', ppPick(LP.nlLose), 1.2);
    ppPopup(call || LP.theirs, call ? '#ff8a7a' : '#ffd0a0');
  }
  if (window.AUTO) ppReport();
}
// a serve that touched the net and still landed right: no point, the same server serves again
function ppLet() {
  if (PP.phase !== 'rally') return;
  window.SFX && SFX.play('ding', {p: 0.8, g: 0.5});   // the umpire's call: no point, serve again
  PP.phase = 'point'; PP.timer = 1.4; ppPopup(LINES_PINGPONG.let, '#fff');
}
function ppReport() {
  document.title = `PP score you ${PP.score.you} liu ${PP.score.liu} | matches won ${PP.stats.wins} lost ${PP.stats.losses} | shots ${PP.stats.shots}${PP.over ? ' | OVER' : ''}`;
}

// she reads where your ball is going and sets off after a reaction delay
function ppLiuTrack(fast) {
  const L = PP.liu, pr = ppPredict(PP.ball, PP_LIUY, 1);
  const miss = Math.random() < 0.14 ? ppRand(-0.3, 0.3) : ppRand(-0.1, 0.1);
  L.aim = pr ? pr.x + miss : 0; L.react = ppRand(0.15, 0.26) + (fast ? 0.04 : 0); L.fast = fast;
}
function ppSwing() { const bat = PP.bat; if (bat.cool > 0) return; PP.pow = 0.3; bat.swing = 0.22; bat.cool = 0.55; window.SFX && SFX.play('swish', {g: 0.6}); }

function ppPlayerHit() {
  const b = PP.ball, bat = PP.bat, L = PP.liu;
  // where the ball meets the bat aims it (the edge sends it wide), and a bat still sliding pushes it that way
  let cc = clamp((b.x - bat.x) / PP_R, -1.2, 1.2), mv = clamp(bat.vx / 2, -1, 1);
  let p = PP.pow > 0 ? 0.9 : clamp(Math.abs(bat.vx) / 3.2, 0, 0.45);
  if (window.AUTO && !PP.human) {
    if (PP.dumb) { mv = 0; p = 0.1; cc = 0; }
    else if (PP.mid) { mv = ppRand(-0.5, 0.5); p = ppRand(0.1, 0.8); cc = ppRand(-1, 1); }
    else { mv = 0; p = 0.78; const want = L.x > 0 ? -0.6 : 0.6; cc = clamp(want / PP_AIMK, -1, 1); }
  }
  const tx = clamp(cc * PP_AIMK + mv * 0.2, -0.7, 0.7);
  const ty = clamp((p > 0.85 ? 2.3 : 2.0) + ppRand(-0.15, 0.15), 1.6, 2.6);
  ppLaunch(b, tx, ty, lerp(1.05, 0.62, p), false);
  b.last = 'you'; b.bounces = 0; PP.rally++; PP.shots++; PP.stats.shots++;
  bat.swing = 0.22; PP.nl.sq = 0.2; PP.pow = 0;
  const [sx, sy] = pj(b.x, b.y, b.z); ppFx(sx, sy, 'star', p > 0.6 ? '#ffd21f' : '#fff'); window.SFX && SFX.play('thwack', {p: 1.2});
  if (p > 0.65) { ppFx(sx, sy, 'ring', '#ffd21f'); PP.stop = 0.05; PP.shake = 0.12; }   // smash: hit-stop, then a jolt (Wii Sports, Windjammers)
  ppLiuTrack(p > 0.6);
}
function ppLiuHit() {
  const b = PP.ball, L = PP.liu, bat = PP.bat;
  const dx = Math.abs(b.x - L.x);
  // she plays it to the side away from your bat (now and then straight back at you), and attacks with a fast deep
  // ball more often as you pull ahead and as a rally goes on: the way to beat that is to get back to the middle
  const away = bat.x > 0.08 ? -1 : bat.x < -0.08 ? 1 : (Math.random() < 0.5 ? -1 : 1);
  let tx = Math.random() < PP_STRAIGHT ? clamp(bat.x * 0.6 + ppRand(-0.2, 0.2), -0.6, 0.6) : away * ppRand(0.2, 0.62);
  let ty = ppRand(0.3, 1.1), T = ppRand(0.85, 1.1), low = false;
  if (Math.random() < PP_FAST - 0.04 * PP.lost + 0.06 * PP.score.you + 0.07 * Math.max(0, PP.rally - 2)) { T = ppRand(0.55, 0.65); ty = ppRand(0.25, 0.6); tx = away * ppRand(0.4, 0.62); }
  const pm = PP_ERR + (dx > 0.2 ? 0.12 : 0) + (L.fast ? 0.08 : 0) + 0.07 * Math.max(0, PP.rally - 2);   // she tires in a long rally
  if (Math.random() < pm) { if (Math.random() < 0.5) ty = -0.55; else low = true; }
  ppLaunch(b, tx, ty, T, low);
  b.last = 'liu'; b.bounces = 0; PP.rally++; PP.shots++; PP.stats.shots++;
  L.swing = 0.25; L.mood = 'swing'; L.moodT = 0.4;
  const [sx, sy] = pj(b.x, b.y, b.z); ppFx(sx, sy, 'star', '#fff'); window.SFX && SFX.play('thwack', {p: 0.85});
  if (T < 0.75) ppSay('liu', LINES_PINGPONG.fast, 0.9);
}

// ---------- serving ----------
function ppNextServe(first) {
  const L = PP.liu, N = PP.nl, b = PP.ball, LP = LINES_PINGPONG;
  PP.phase = 'serve'; PP.server = ppServerNow(); PP.toss = -1; PP.wait = 0;
  PP.timer = PP.server === 'liu' ? 1.3 : 0;
  b.live = false; b.trail = []; b.serve = false; PP.pred = null;
  if (L.mood !== 'win') L.mood = 'idle';
  N.mood = 'idle';
  const line = first ? LP.intro3 : ppTied() ? LP.deuceLiu : PP.server === 'you' ? ppPick(LP.yourServe) : ppPick(LP.serve);
  ppSay('liu', line, 1.7);
}
// the ball sits in the server's hand, then goes up (a real serve is tossed at least 16 cm) and is hit on the way down
function ppHoldBall() {
  const b = PP.ball, u = PP.toss >= 0 ? clamp(PP.toss / PP_TOSS, 0, 1) : 0;
  const up = PP.toss >= 0 ? 4 * 0.26 * u * (1 - u) : Math.sin(PP.t * 3) * 0.012;
  if (PP.phase === 'serve' && PP.server === 'you') { b.x = PP.bat.x - 0.24; b.y = PP_YOUY; b.z = 0.34 + up; }
  else { b.x = PP.liu.x + 0.22; b.y = PP_LIUY - 0.1; b.z = 0.42 + up; }
}
function ppServe(who) {
  const b = PP.ball, L = PP.liu, you = who === 'you';
  PP.toss = -1; ppHoldBall();
  let y1, y2, x2;
  if (you) { y1 = ppRand(0.35, 0.55); y2 = ppRand(1.95, 2.35); x2 = clamp(-PP.bat.x * 0.3 + ppRand(-0.45, 0.45), -0.55, 0.55); }
  else {
    y1 = PP_TL - ppRand(0.35, 0.55); y2 = PP_TL - ppRand(1.95, 2.35); x2 = clamp(-PP.bat.x * 0.5 + ppRand(-0.35, 0.35), -0.5, 0.5);
    if (Math.random() < 0.04) y2 = -0.45;   // now and then her serve sails long: a fault, your point
  }
  ppServeLaunch(b, y1, y2, x2);
  b.last = who; b.bounces = 0; b.serve = true; b.sb = 0; b.let = false; b.live = true; b.trail = [];
  PP.phase = 'rally'; PP.serveN++; PP.rally = 0; PP.shots++; L.fast = false;
  const [sx, sy] = pj(b.x, b.y, b.z); ppFx(sx, sy, 'star', '#fff'); window.SFX && SFX.play('thwack', {p: you ? 1.2 : 0.85});
  if (you) { PP.bat.swing = 0.22; PP.nl.sq = 0.2; ppLiuTrack(false); }
  else { L.swing = 0.25; L.mood = 'swing'; L.moodT = 0.4; }
}

function ppStep(h) {
  const b = PP.ball, L = PP.liu, bat = PP.bat;
  if (!b.live) return;
  const py0 = b.y, hitter = b.last, other = hitter === 'you' ? 'liu' : 'you';
  b.x += b.vx * h; b.y += b.vy * h; b.z += b.vz * h; b.vz -= PP_G * h;
  // net
  const crossed = (py0 < PP_NY && b.y >= PP_NY) || (py0 > PP_NY && b.y <= PP_NY);
  if (PP.phase === 'rally' && crossed && Math.abs(b.x) < PP_HW + 0.1 && b.z < PP_NH + PP_BR * 0.4) {
    b.vy *= -0.15; b.vx *= 0.3; b.y = PP_NY + (py0 < PP_NY ? -0.03 : 0.03); PP.netW = 0.45; window.SFX && SFX.play('buzz');   // into the net
    const [sx, sy] = pj(b.x, b.y, b.z); ppFx(sx, sy, 'ring', '#fff');
    ppPoint(other, 'net'); return;
  }
  // a ball that just skims the tape still makes it shiver (a net-cord that dribbles over); on a serve that is a let
  if (PP.phase === 'rally' && crossed && Math.abs(b.x) < PP_HW && b.z < PP_NH + PP_BR * 0.4 + 0.05) { PP.netW = 0.45; if (b.serve) b.let = true; window.SFX && SFX.play('buzz', {p: 1.3, g: 0.35}); }   // a net-cord: the tape buzzes
  // table bounce
  if (b.z <= 0 && b.vz < 0 && ppOnTable(b.x, b.y)) {
    const imp = -b.vz; b.z = 0; b.vz = -b.vz * 0.82; b.sq = 0.12;
    if (imp > 0.5) window.SFX && SFX.play('tick', {p: 1.6, g: Math.min(1, imp / 2)});   // the table tick; a ball settling on the table stays quiet
    const [sx, sy] = pj(b.x, b.y, 0); ppFx(sx, sy, 'ring', 'rgba(255,255,255,.9)');
    if (PP.phase === 'rally') {
      const own = (b.y > PP_NY) === (hitter === 'liu');          // it landed on the hitter's own half
      if (b.serve && b.sb === 0) { if (own) b.sb = 1; else ppPoint(other, 'fault'); }               // serve: own half first
      else if (b.serve) { if (own) ppPoint(other, 'fault'); else if (b.let) ppLet(); else { b.serve = false; b.bounces = 1; } }   // then theirs
      else if (b.bounces === 0) { if (own) ppPoint(other, 'bounce'); else b.bounces = 1; }
      else ppPoint(hitter, 'twice');                               // a second bounce on the receiver's half: they missed it
    }
  }
  if (b.z < -0.06 && !ppOnTable(b.x, b.y)) {
    if (PP.phase === 'rally') {
      const inPlay = !b.serve && b.bounces === 1;                  // it had landed right, so the receiver missed it
      ppPoint(inPlay ? hitter : other, inPlay ? 'missed' : b.serve ? 'fault' : 'out');
    }
    if (b.z < -0.9) { b.live = false; window.SFX && SFX.play('tick', {p: 0.7, g: 0.5}); }   // it hits the classroom floor
  }
  if (PP.phase !== 'rally') return;
  // her hit
  if (b.last === 'you' && b.bounces === 1 && b.vy > 0 && b.y >= PP_LIUY - 0.2 && b.y <= PP_LIUY + 0.5) {
    if (Math.abs(b.x - L.x) <= PP_REACH && b.z > -0.3 && b.z < 1.1) { ppLiuHit(); return; }
  }
  if (b.last === 'you' && b.bounces === 1 && b.vy > 0 && b.y > PP_LIUY + 0.5 && L.mood !== 'lunge') {
    L.mood = 'lunge'; L.moodT = 0.9; L.lunge = 0.9; L.lungeDir = Math.sign(b.x - L.x) || 1; ppSay('liu', LINES_PINGPONG.lunge, 1.3);
    window.SFX && SFX.play('squeak');   // her shoes on the classroom floor
  }
  // your hit
  if (b.last === 'liu' && b.bounces === 1 && b.vy < 0 && b.y <= 0.14 && b.y >= -0.3) {
    const dx = (b.x - bat.x) / PP_R, dz = (b.z - bat.z) / (PP_R * 1.15);
    if (dx * dx + dz * dz <= 1) { ppPlayerHit(); return; }
  }
}

// ---------- the autoplayers (window.AUTO) ----------
// default: the test bot that must win every match (meets every ball, aims away from her)
function ppBot() {
  const b = PP.ball, L = PP.liu;
  if (PP.phase === 'serve' && PP.server === 'you' && PP.toss < 0 && PP.wait > 0.7) { PP.toss = 0; return; }
  if (PP.pred) {
    const cc = PP.dumb ? 0 : clamp((L.x > 0 ? -0.6 : 0.6) / PP_AIMK, -1, 1);
    PP.tgt.x = PP.pred.x - cc * PP_R + PP.botErr;
  } else if (PP.phase !== 'rally' || b.last === 'you') { PP.tgt.x = 0; PP.botErr = PP.mid ? ppRand(-0.18, 0.18) : 0; }
}
// &human=1: a stand-in for a casual player on the arrow keys, to tune the difficulty. Reacts late, holds the key toward
// the ring with an aiming error, presses space for a smash about a third of the time with rough timing.
function ppHumanBot(dt) {
  const H_ = PP.hum;
  PP.keys.l = PP.keys.r = false;
  if (PP.phase === 'serve' && PP.server === 'you' && PP.toss < 0 && PP.wait > 1.2) { PP.toss = 0; return; }
  if (!PP.pred) return;
  if (H_.id !== PP.shots) Object.assign(H_, {id: PP.shots, react: ppRand(0.3, 0.45), err: ppRand(-0.2, 0.2), smash: Math.random() < 0.3, sT: ppRand(0.05, 0.4), pressed: false});
  H_.react -= dt; if (H_.react > 0) return;
  const want = PP.pred.x + H_.err;
  if (want < PP.tgt.x - 0.04) PP.keys.l = true; else if (want > PP.tgt.x + 0.04) PP.keys.r = true;
  if (H_.smash && !H_.pressed && PP.pred.t / PP_SLOW < H_.sT) { H_.pressed = true; ppSwing(); }
}

// ====================================================================================
// update + draw
// ====================================================================================
function ppStart() { if (PP.phase === 'card') { window.SFX && SFX.play('pop'); ppNextServe(true); } }
function ppAfterPoint() {
  const s = PP.score, L = PP.liu, N = PP.nl;
  PP.ball.live = false;
  if (s.you >= PP_WIN && s.you - s.liu >= 2) {
    PP.phase = 'won'; PP.timer = PP_REPLAY.on ? 1.6 : 3.6; N.mood = 'win'; N.moodT = 9; L.mood = 'lose'; L.moodT = 9; ppSay('liu', LINES_PINGPONG.winLiu, 3.4);
    PP.stats.wins++; PP.stats.matches++; PP.over = true; if (window.AUTO) ppReport();
  } else if (s.liu >= PP_WIN && s.liu - s.you >= 2) {
    // she won the match: one ride-wide life, a beat with the final score still up, then a rematch (no card again)
    PP.stats.losses++; PP.stats.matches++; PP.lost++;
    GAMES.pingpong.fail(); window.SFX && SFX.play('sad');
    PP.phase = 'again'; PP.timer = 1.2; L.mood = 'win'; L.moodT = 1.2; N.mood = 'lose'; N.moodT = 1.2; ppSay('liu', ppPick(LINES_PINGPONG.restart), 1.5);
    if (window.AUTO) ppReport();
  } else ppNextServe();
}
function ppRematch() { ppReset(false); ppNextServe(); }
function ppFinish() { if (!PP.done) { PP.done = true; GAMES.pingpong.api.done(); } }

function ppUpdate(dt) {
  const L = PP.liu, N = PP.nl, bat = PP.bat, b = PP.ball;
  // hit-stop: a smash holds the whole world still for about 3 frames (it only starts mid-rally, when no phase timer runs);
  // a slow frame skips it. The shake waits out the stop, then decays.
  if (PP.stop > 0.001) { if (dt >= 0.05) PP.stop = 0; else { PP.stop -= dt; dt = 0; } }
  PP.shake = Math.max(0, PP.shake - dt); PP.netW = Math.max(0, PP.netW - dt);
  PP.t += dt;
  const sdt = dt * PP_SLOW;
  if (window.AUTO) { if (PP.human) ppHumanBot(dt); else ppBot(); }
  // the instruction card waits for a key, at most PP_CARD seconds (a bot run skips it after 1.2 s)
  if (PP.phase === 'card') { PP.cardT += dt; if (PP.cardT >= (window.AUTO ? 1.2 : PP_CARD)) ppStart(); }
  // the bat: held ← → slide it at a steady speed, the pointer puts it where the pointer is; the height is automatic
  // (Nailong lifts the bat to where her ball will arrive), so the only job is getting across in time
  const kd = (PP.keys.r ? 1 : 0) - (PP.keys.l ? 1 : 0);
  if (kd && PP.phase !== 'card') PP.tgt.x = clamp(PP.tgt.x + kd * PP_KEYV * dt, -1.0, 1.0);
  PP.tgt.z = PP.pred ? clamp(PP.pred.z, -0.08, 0.75) : 0.3;
  const px = bat.x, pz = bat.z;
  const bx = (clamp(PP.tgt.x, -1.05, 1.05) - bat.x) * Math.min(1, dt * (window.AUTO ? 30 : 24));
  bat.x += window.AUTO && !PP.human ? bx : clamp(bx, -PP_BATV * dt, PP_BATV * dt);   // a chubby dragon has a top speed (the test bot does not)
  bat.z += (PP.tgt.z - bat.z) * Math.min(1, dt * 12);
  if (dt > 0) { bat.vx = lerp(bat.vx, (bat.x - px) / dt, 0.4); bat.vz = lerp(bat.vz, (bat.z - pz) / dt, 0.4); }
  bat.swing = Math.max(0, bat.swing - dt); bat.cool = Math.max(0, bat.cool - dt); PP.pow = Math.max(0, PP.pow - dt);
  N.sq = Math.max(0, N.sq - dt);
  // phases
  if (PP.phase === 'serve') {
    PP.wait += dt;
    if (PP.server === 'liu') { PP.timer -= dt; if (PP.timer <= 0 && PP.toss < 0) PP.toss = 0; }
    else if (PP.toss < 0 && PP.wait > 7) PP.toss = 0;              // a player who never presses space gets it served for her
    if (PP.toss === 0) window.SFX && SFX.play('swish', {p: 1.5, g: 0.4});   // the ball goes up for the toss
    if (PP.toss >= 0) { PP.toss += dt; if (PP.toss >= PP_TOSS) ppServe(PP.server); }
  }
  else if (PP.phase === 'point') { PP.timer -= dt; if (PP.timer <= 0) ppAfterPoint(); }
  else if (PP.phase === 'again') { PP.timer -= dt; if (PP.timer <= 0) ppRematch(); }
  else if (PP.phase === 'won') { PP.timer -= dt; if (PP.timer <= 0) { ppFinish(); return; } }
  if (PP.phase === 'serve' || PP.phase === 'card' || PP.phase === 'again') ppHoldBall();
  // physics in small steps, in slowed scene time
  let rem = sdt;
  while (rem > 1e-6) { const h = Math.min(1 / 120, rem); ppStep(h); rem -= h; }
  // where her ball will reach your end, read once a frame (the ring, the bat height and the bots all use it)
  PP.pred = PP.phase === 'rally' && b.live && b.last === 'liu' && b.vy < 0 ? ppPredict(b, 0.0, -1) : null;
  if (b.live) { b.trail.push([b.x, b.y, b.z]); if (b.trail.length > 7) b.trail.shift(); }
  b.sq = Math.max(0, b.sq - dt);
  // her movement: wait out the reaction, then shuffle toward where it will land; otherwise drift back to the middle
  L.moodT -= dt; L.lunge -= dt; L.swing = Math.max(0, L.swing - sdt);
  if (L.moodT <= 0 && ['swing', 'lunge', 'win', 'lose', 'duck'].includes(L.mood) && PP.phase !== 'won') L.mood = 'idle';
  if (PP.phase === 'rally' && b.last === 'you') {
    L.react -= sdt;
    if (L.react <= 0 && L.mood !== 'lunge') L.x += clamp(L.aim - L.x, -PP.vmax * sdt, PP.vmax * sdt);
  } else if (PP.phase !== 'won') L.x += clamp(0 - L.x, -0.7 * sdt, 0.7 * sdt);
  L.blink = (PP.t % 3.4) < 0.12 ? 1 : 0;
  if (L.mood === 'lose' || L.mood === 'duck') L.slip = Math.min(1, L.slip + dt * 5); else L.slip = Math.max(0, L.slip - dt * 1.2);
  L.pony = lerp(L.pony, clamp(-(L.aim - L.x) * 0.8, -0.6, 0.6) * (PP.phase === 'rally' ? 1 : 0), 0.15);
  if (N.moodT > 0) N.moodT -= dt; else if (PP.phase !== 'won') N.mood = 'idle';
  for (const e of PP.fx) e.t += dt;
  PP.fx = PP.fx.filter(e => e.t < 0.5);
  if (PP.say) { PP.say.t -= dt; if (PP.say.t <= 0) PP.say = null; }
  if (PP.nlSay) { PP.nlSay.t -= dt; if (PP.nlSay.t <= 0) PP.nlSay = null; }
  if (PP.pop) { PP.pop.t -= dt; if (PP.pop.t <= 0) PP.pop = null; }
  if (PP.hudPop) { PP.hudPop.t -= dt; if (PP.hudPop.t <= 0) PP.hudPop = null; }
}

// ---------- scenery: the Chinese classroom ----------
// pinyin with tone marks: Fredoka's ī is broken in Chrome/Edge (the macron lands beside the letter), so pinyin uses a
// system face that has every tone mark (Avenir Next / Helvetica Neue on a Mac, Segoe UI on Windows)
function ppPyFont(px, w = 600) { ctx.font = `${w} ${px}px "Avenir Next", "Helvetica Neue", "Segoe UI", Arial, sans-serif`; }
function ppRoom() {
  const wallB = pj(0, PP_LIUY + 1.4, -PP_CAM + 0.1)[1];
  ctx.fillStyle = '#efe8da'; ctx.fillRect(0, 0, W, wallB);
  ctx.fillStyle = '#7a86a6'; ctx.fillRect(0, wallB, W, H - wallB);
  ctx.fillStyle = '#6b7799'; ctx.fillRect(0, wallB, W, 8);
  ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 3;
  for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 60, wallB + 8); ctx.lineTo(W / 2 + i * 230, H); ctx.stroke(); }
  // whiteboard
  const bx = W * 0.2, bw = W * 0.6, by = 74, bh = Math.max(200, wallB - 74 - 70);
  PP.wb = {bx, by, bw, bh};   // her speech bubble keeps to the clear band of this board (ppLiuBubble)
  ctx.fillStyle = '#9a9aa4'; rr(bx - 8, by - 8, bw + 16, bh + 16, 8); ctx.fill();
  ctx.fillStyle = '#fbfcfd'; rr(bx, by, bw, bh, 5); ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = '#c9c9d2'; rr(bx + 20, by + bh + 8, bw - 40, 8, 3); ctx.fill();
  // what is still on the board from the lesson (心, and the numbered questions from the photo)
  ctx.fillStyle = 'rgba(43,51,80,.75)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; font(Math.min(96, W / 14), 500); ctx.fillText(LINES_PINGPONG.boardHeart, bx + bw * 0.17, by + bh * 0.62);
  ctx.textAlign = 'left'; font(Math.min(22, W / 58), 500); ctx.fillStyle = 'rgba(43,51,80,.6)'; ctx.fillText(LINES_PINGPONG.boardQ1, bx + bw * 0.62, by + bh * 0.72); ctx.fillText(LINES_PINGPONG.boardQ2, bx + bw * 0.62, by + bh * 0.86);
  // scoreboard in marker, like the photo's board
  ctx.fillStyle = '#2b3350'; ctx.textBaseline = 'middle';
  ctx.textAlign = 'left'; ppPyFont(Math.min(34, W / 38), 700); ctx.fillText(LINES_PINGPONG.board1, bx + 24, by + 38);
  font(Math.min(26, W / 50), 600); ctx.fillText(LINES_PINGPONG.board2, bx + 24, by + 74);
  ctx.textAlign = 'right'; font(Math.min(24, W / 52), 600);
  ctx.fillStyle = '#1f8a4c'; ctx.fillText(LINES_PINGPONG.boardYou, bx + bw - 24 - 130, by + 36); ctx.fillStyle = '#b8323a'; ctx.fillText(LINES_PINGPONG.boardLiu, bx + bw - 24 - 130, by + 72);
  const tally = (n, y, col) => { ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) { const x0 = bx + bw - 24 - 110 + i * 26; ctx.beginPath(); ctx.moveTo(x0, y - 15); ctx.lineTo(x0 + 3, y + 15); ctx.stroke(); } ctx.lineCap = 'butt'; };
  tally(PP.score.you, by + 36, '#1f8a4c'); tally(PP.score.liu, by + 72, '#b8323a');
  // bamboo plates with painted flowers above the board
  for (const [px, py, r, cut] of [[W * 0.09, 56, 74, true], [W * 0.91, 150, 68, false]]) {
    ctx.save(); if (cut) { ctx.beginPath(); ctx.rect(0, 0, W, 110); ctx.clip(); }
    ell(px, py, r, r); ctx.fillStyle = '#d9b36a'; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 5; ctx.stroke();
    ctx.strokeStyle = 'rgba(120,80,30,.35)'; ctx.lineWidth = 2;
    for (let k = -r; k < r; k += 12) { ctx.beginPath(); ctx.moveTo(px + k, py - r); ctx.lineTo(px + k, py + r); ctx.stroke(); ctx.beginPath(); ctx.moveTo(px - r, py + k); ctx.lineTo(px + r, py + k); ctx.stroke(); }
    ell(px, py + 18, r * 0.62, r * 0.55); ctx.fillStyle = '#e8f2dc'; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 3; ctx.stroke();
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; ell(px + Math.cos(a) * r * 0.2, py + 18 + Math.sin(a) * r * 0.2, r * 0.17, r * 0.12, a); ctx.fillStyle = '#d3303a'; ctx.fill(); }
    ell(px, py + 18, r * 0.1, r * 0.1); ctx.fillStyle = '#ffd21f'; ctx.fill();
    ctx.restore();
  }
  // pinyin cards, left of the board
  const cw = Math.min(140, W * 0.13), cw2 = Math.min(100, W * 0.09);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#bfe0f2'; ctx.strokeStyle = C.line; ctx.lineWidth = 3; rr(W * 0.03, 122, cw, 82, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C.line; ppPyFont(16, 600); ctx.fillText(LINES_PINGPONG.card1py, W * 0.03 + cw / 2, 147); font(30, 600); ctx.fillText(LINES_PINGPONG.card1, W * 0.03 + cw / 2, 179);
  ctx.fillStyle = '#fbe36a'; rr(W * 0.045, 214, cw2, 76, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C.line; ppPyFont(16, 600); ctx.fillText(LINES_PINGPONG.card2py, W * 0.045 + cw2 / 2, 236); font(32, 600); ctx.fillText(LINES_PINGPONG.card2, W * 0.045 + cw2 / 2, 268);
  // the paper trays, stacked on the right
  const tw = Math.min(150, W * 0.13), tx0 = W * 0.84, ty0 = wallB - 118;
  for (const [i, col] of [[0, '#7c4fb8'], [1, '#ee5f86'], [2, '#a778d8']]) { const yy = ty0 + i * 36; ctx.fillStyle = col; rr(tx0, yy, tw, 38, 5); ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(tx0 + 8, yy + 6, tw - 16, 5); }
  // sign
  const sw = Math.min(132, W * 0.12);
  ctx.fillStyle = '#fff'; ctx.strokeStyle = C.line; ctx.lineWidth = 3; rr(W * 0.03, wallB - 120, sw, 80, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C.line; font(11, 600); ctx.textAlign = 'center';
  LINES_PINGPONG.sign.forEach((l, i) => ctx.fillText(l, W * 0.03 + sw / 2, wallB - 100 + i * 17));
}

function ppTable() {
  const P = (x, y, z = 0) => pj(x, y, z), nl = P(-PP_HW, 0), nr = P(PP_HW, 0), fr = P(PP_HW, PP_TL), fl = P(-PP_HW, PP_TL), k0 = PPL.K0;
  ctx.lineJoin = 'round'; ctx.strokeStyle = C.line; ctx.lineWidth = 5;
  ctx.fillStyle = '#143f72'; ctx.beginPath(); ctx.moveTo(nl[0], nl[1]); ctx.lineTo(nr[0], nr[1]); ctx.lineTo(nr[0], nr[1] + 0.09 * k0); ctx.lineTo(nl[0], nl[1] + 0.09 * k0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2b2f3a'; for (const sx of [-1, 1]) { rr(W / 2 + sx * (PP_HW - 0.14) * k0 - 0.04 * k0, nl[1] + 0.09 * k0, 0.08 * k0, H, 4); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = '#2468b3'; ctx.beginPath(); ctx.moveTo(nl[0], nl[1]); ctx.lineTo(nr[0], nr[1]); ctx.lineTo(fr[0], fr[1]); ctx.lineTo(fl[0], fl[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3.5;
  const e = 0.025, a = P(-PP_HW + e, e), b = P(PP_HW - e, e), c = P(PP_HW - e, PP_TL - e), d = P(-PP_HW + e, PP_TL - e);
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); ctx.stroke();
  const m0 = P(0, e), m1 = P(0, PP_TL - e); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(m0[0], m0[1]); ctx.lineTo(m1[0], m1[1]); ctx.stroke();
}
function ppNet() {
  // after a net ball or a skim the net shivers: tape and mesh bow together (most in the middle, the posts stay put)
  const off = PP.netW > 0 ? Math.sin(PP.netW * 40) * (PP.netW / 0.45) * 5 : 0;
  const np = (u, f) => { const p = pj(-PP_HW + u * 2 * PP_HW, PP_NY, PP_NH * f); p[1] += off * f * Math.sin(Math.PI * u); return p; };
  const row = (f, dy = 0) => { for (let i = 0; i <= 14; i++) { const p = np(i / 14, f); if (i) ctx.lineTo(p[0], p[1] + dy); else ctx.moveTo(p[0], p[1] + dy); } };
  const pl = pj(-PP_HW - 0.07, PP_NY, 0), pl2 = pj(-PP_HW - 0.07, PP_NY, PP_NH + 0.03), pr = pj(PP_HW + 0.07, PP_NY, 0), pr2 = pj(PP_HW + 0.07, PP_NY, PP_NH + 0.03);
  ctx.lineCap = 'round'; ctx.strokeStyle = C.line; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(pl[0], pl[1]); ctx.lineTo(pl2[0], pl2[1]); ctx.moveTo(pr[0], pr[1]); ctx.lineTo(pr2[0], pr2[1]); ctx.stroke();
  ctx.fillStyle = 'rgba(245,245,250,.55)'; ctx.beginPath(); row(0); for (let i = 14; i >= 0; i--) { const p = np(i / 14, 1); ctx.lineTo(p[0], p[1]); } ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(40,40,60,.35)'; ctx.lineWidth = 1.5;
  for (let i = 1; i < 14; i++) { const p = np(i / 14, 0), q = np(i / 14, 1); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); }
  for (let i = 1; i < 4; i++) { ctx.beginPath(); row(i / 4); ctx.stroke(); }
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); row(1); ctx.stroke();
  ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.beginPath(); row(1, -3); row(1, 3); ctx.stroke();
  ctx.lineCap = 'butt';
}
function ppBall(b) {
  if (!b.live && !['serve', 'card', 'again'].includes(PP.phase)) return;
  const [sx, sy, k] = pj(b.x, b.y, b.z), r = Math.max(PP_BR * k * 1.3, 7);
  if (ppOnTable(b.x, b.y) && b.z > -0.02) { const s = pj(b.x, b.y, 0); ctx.fillStyle = `rgba(10,20,50,${0.35 - Math.min(0.2, b.z * 0.25)})`; ell(s[0], s[1], r * (0.9 + b.z * 0.4), r * 0.42); ctx.fill(); }
  b.trail.forEach((t, i) => { const q = pj(t[0], t[1], t[2]), rr_ = Math.max(PP_BR * q[2] * 1.1, 5) * (0.4 + i * 0.08); ctx.fillStyle = `rgba(255,170,60,${0.05 + i * 0.03})`; ell(q[0], q[1], rr_, rr_); ctx.fill(); });
  const sq = b.sq > 0 ? 1 - b.sq * 2 : 1;
  ell(sx, sy, r * (2 - sq), r * sq); ctx.fillStyle = '#ff9d2e'; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = Math.max(2.5, r * 0.22); ctx.stroke();
  ell(sx - r * 0.3, sy - r * 0.32, r * 0.28, r * 0.2, -0.6); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fill();
}

function ppLiu() {
  const L = PP.liu, b = PP.ball;
  const [fx, fy, k] = pj(L.x, PP_LIUY, -PP_CAM + 0.14), s = k * 1.9 / 272;
  let aL = 0.35, aR = 0.3, rL = 1, rR = 1, mouth = 'smile', rot = 0, sx = 1, sy = 1, look = [0, 0], px = 0, marker = false, bat = true;
  const T = PP.t;
  const track = (side, tgt, minA, maxA) => {
    const shx = fx + (side === 0 ? -40 : 40) * s, shy = fy - 160 * s, dx = tgt[0] - shx, dy = tgt[1] - shy;
    const ang = side === 0 ? Math.atan2(-dx, dy) : Math.atan2(dx, dy), len = 82 * s;
    return [clamp(ang, minA, maxA), clamp(Math.hypot(dx, dy) / len, 0.75, 1.55)];
  };
  const bs = pj(b.x, b.y, b.z);
  if (b.live && (PP.phase === 'rally' || PP.phase === 'point')) look = [clamp((bs[0] - fx) / 200, -1, 1), clamp((bs[1] - (fy - 210 * s)) / 160, -1, 1)];
  if (PP.phase === 'rally' && b.live && b.last === 'you' && b.vy > 0) { const a = track(0, bs, 0.1, 2.4); aL = a[0] + Math.sin(T * 6) * 0.04; rL = a[1]; }
  else if (PP.phase === 'rally' || (PP.phase === 'serve' && PP.server === 'you')) { aL = 0.9 + Math.sin(T * 4) * 0.07; aR = 0.45; if (PP.phase === 'serve') look = [clamp((bs[0] - fx) / 200, -1, 1), 0.7]; }
  if (L.swing > 0) { const u = 1 - L.swing / 0.25; aL = lerp(0.8, 1.9, Math.sin(u * Math.PI)); mouth = 'open'; px = (L.x >= 0 ? 1 : -1) * Math.sin(u * Math.PI) * 6; }
  // her serve: the ball rests on her open palm, goes up on the toss (she watches it) while the bat arm draws back
  if (PP.phase === 'card' || PP.phase === 'again' || (PP.phase === 'serve' && PP.server === 'liu')) {
    const u = PP.toss >= 0 ? clamp(PP.toss / PP_TOSS, 0, 1) : 0;
    const palm = pj(L.x + 0.22, PP_LIUY - 0.1, 0.42 + 0.05 * Math.sin(Math.min(1, u * 3) * Math.PI)); const a = track(1, palm, 0.1, 2.6); aR = a[0]; rR = a[1];
    aL = 0.9 + 0.7 * ease(u); look = u > 0 ? [0.3, clamp((bs[1] - (fy - 210 * s)) / 160, -1, 1)] : [0.2, 0.4];
  }
  if (L.mood === 'win') { aL = 2.6 + Math.sin(T * 8) * 0.3; aR = 2.6 - Math.sin(T * 8) * 0.3; mouth = 'open'; sy = 1 + Math.abs(Math.sin(T * 7)) * 0.05; rot = Math.sin(T * 7) * 0.05; look = [0, -0.3]; marker = true; }
  if (L.mood === 'lose') { aL = 2.8; aR = 2.8; mouth = 'o'; rot = -0.08; sx = 0.95; sy = 1.05; look = [0, -0.6]; }
  if (L.mood === 'duck') { aL = 2.9; aR = 2.9; mouth = 'o'; sy = 0.82; sx = 1.1; rot = 0.12; look = [-0.5, -0.5]; }
  if (L.mood === 'lunge') { const dir = L.lungeDir || 1; rot = dir * 0.34; aL = 1.6 + dir * 0.5; aR = 1.2; mouth = 'open'; sx = 1.05; px = dir * 14; look = [dir, 0]; }
  if (PP.phase === 'won') { aL = 2.9; aR = 2.9 + Math.sin(T * 5) * 0.2; mouth = 'o'; bat = false; }
  liuLaoShi(fx + px, fy, s, {mouth, look, aL, aR, reachL: rL, reachR: rR, bat, marker, rot, sx, sy, slip: L.slip, blink: L.blink, pony: L.pony, batAng: 0.5});
  PP.liuHead = [fx, fy - 275 * s * sy];
  PP.liuFace = [fx + px, fy - 218 * s * sy, 44 * s];   // face centre and half width (ears included): where her bubble's tail points
}

function ppNailong() {
  const N = PP.nl, bat = PP.bat, k0 = PPL.K0, b = PP.ball;
  const [bsx, bsy] = pj(bat.x, 0, bat.z), Rpx = PP_R * k0 * 0.5;
  const ny = H + 46, s = 1.0;
  N.x += (W / 2 + (bsx - W / 2) * 0.55 - N.x) * 0.18;
  const bsB = pj(b.x, b.y, b.z);
  const lookx = b.live ? clamp((bsB[0] - N.x) / 300, -1, 1) : clamp((bsx - N.x) / 300, -1, 1);
  const squash = N.sq > 0 ? N.sq / 0.2 : 0, o = {arms: 'down', look: [lookx, -0.7], mouth: 'open', rot: clamp((bsx - N.x) * 0.0007, -0.15, 0.15), sx: 1 + squash * 0.12, sy: 1 - squash * 0.12};
  if (N.mood === 'win') { o.arms = 'up'; o.flail = PP.t * 10; }
  if (N.mood === 'lose') { o.mouth = 'o'; o.sy = 0.9; o.sx = 1.06; o.look = [0, 0.4]; }
  if (PP.phase === 'rally' && b.last === 'liu' && b.vy < 0) o.mouth = 'o';
  nailong(N.x, ny, s, o);
  const side = bsx > N.x ? 1 : -1, shx = N.x + side * 40 * s, shy = ny - 72 * s;
  const hx = bsx, hy = bsy + Rpx * 1.5, cy = Math.max(shy, hy) + 20;
  ctx.lineCap = 'round'; ctx.strokeStyle = C.line; ctx.lineWidth = 24 * s + 12; ctx.beginPath(); ctx.moveTo(shx, shy); ctx.quadraticCurveTo((shx + hx) / 2, cy, hx, hy); ctx.stroke();
  ctx.strokeStyle = C.y; ctx.lineWidth = 24 * s; ctx.beginPath(); ctx.moveTo(shx, shy); ctx.quadraticCurveTo((shx + hx) / 2, cy, hx, hy); ctx.stroke(); ctx.lineCap = 'butt';
  const sw = bat.swing > 0 ? Math.sin((1 - bat.swing / 0.22) * Math.PI) : 0, tilt = clamp(bat.vx * 0.14, -0.55, 0.55) + sw * 0.35 * (bat.vx >= 0 ? -1 : 1);
  ctx.save(); ctx.translate(bsx, bsy); ctx.rotate(tilt); ctx.scale(1 + sw * 0.18, 1 + sw * 0.18);
  ctx.lineCap = 'round'; ctx.strokeStyle = C.line; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(0, Rpx * 0.8); ctx.lineTo(0, Rpx * 1.55); ctx.stroke();
  ctx.strokeStyle = '#c9a06a'; ctx.lineWidth = 15; ctx.beginPath(); ctx.moveTo(0, Rpx * 0.8); ctx.lineTo(0, Rpx * 1.55); ctx.stroke(); ctx.lineCap = 'butt';
  ell(0, 0, Rpx + 7, Rpx * 1.06 + 7); ctx.fillStyle = C.line; ctx.fill();
  ell(0, 0, Rpx + 2, Rpx * 1.06 + 2); ctx.fillStyle = '#c9a06a'; ctx.fill();
  ell(0, 0, Rpx - 6, Rpx * 1.06 - 6); ctx.globalAlpha = 0.9; ctx.fillStyle = '#d6382f'; ctx.fill(); ctx.globalAlpha = 1;
  ell(-Rpx * 0.3, -Rpx * 0.35, Rpx * 0.3, Rpx * 0.16, -0.6); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fill();
  ctx.restore();
  ell(hx, hy, 13, 13); ctx.fillStyle = C.y; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 5; ctx.stroke();
  // arrival ring: where her ball will reach your end, so you know where to slide the bat. Faint while the ball is still
  // on her side, firmer once it has bounced on yours
  if (PP.pred) {
    const q = pj(PP.pred.x, 0, clamp(PP.pred.z, -0.1, 0.8)), firm = b.bounces === 1 && !b.serve;
    ctx.setLineDash([9, 9]); ctx.strokeStyle = firm ? 'rgba(255,255,255,.75)' : 'rgba(255,255,255,.4)'; ctx.lineWidth = 4;
    ell(q[0], q[1], PP_R * k0 * 0.42, PP_R * k0 * 0.42); ctx.stroke(); ctx.setLineDash([]);
  }
  PP.nlHead = [N.x, ny - 190 * s];
}

function ppFxDraw() {
  for (const e of PP.fx) {
    const u = e.t / 0.5;
    if (e.kind === 'ring') { ctx.strokeStyle = e.c; ctx.globalAlpha = 1 - u; ctx.lineWidth = 5 * (1 - u) + 1; ell(e.x, e.y, 10 + u * 36, (10 + u * 36) * 0.55); ctx.stroke(); ctx.globalAlpha = 1; }
    else { ctx.strokeStyle = e.c; ctx.globalAlpha = 1 - u; ctx.lineWidth = 5; ctx.lineCap = 'round';
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + 0.3, r0 = 14 + u * 20, r1 = 26 + u * 34; ctx.beginPath(); ctx.moveTo(e.x + Math.cos(a) * r0, e.y + Math.sin(a) * r0); ctx.lineTo(e.x + Math.cos(a) * r1, e.y + Math.sin(a) * r1); ctx.stroke(); }
      ctx.globalAlpha = 1; ctx.lineCap = 'butt'; }
  }
}

function ppHud() {
  const cx = W / 2, y = 24;
  ctx.fillStyle = 'rgba(29,22,64,.78)'; rr(cx - 210, y - 8, 420, 46, 23); ctx.fill();
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  // the digit that just changed bounces up to 1.5x and flashes white, then settles (arcade scoreboards, Rhythm Heaven counters)
  const digit = (who, n, x, col) => {
    const hp = PP.hudPop, m = hp && hp.who === who ? Math.sin(Math.PI * clamp(1 - hp.t / 0.4, 0, 1)) : 0;
    ctx.save(); ctx.translate(x, y + 16); ctx.scale(1 + 0.5 * m, 1 + 0.5 * m); font(32, 700);
    ctx.fillStyle = col; ctx.fillText(n, 0, 0);
    if (m > 0) { ctx.globalAlpha = m; ctx.fillStyle = '#fff'; ctx.fillText(n, 0, 0); }
    ctx.restore();
  };
  digit('you', PP.score.you, cx - 50, '#ffd21f');
  ctx.fillStyle = '#fff'; font(20, 600); ctx.fillText(':', cx, y + 15); digit('liu', PP.score.liu, cx + 50, '#ff9bb0');
  font(13, 600); ctx.fillStyle = '#cdd2ff'; ctx.textAlign = 'right'; ctx.fillText(LINES_PINGPONG.hudYou, cx - 72, y + 16); ctx.textAlign = 'left'; ctx.fillText(LINES_PINGPONG.hudLiu, cx + 72, y + 16);
  // who serves: a small ball at their end of the bar, as on a real scoreboard
  if (['serve', 'rally', 'point'].includes(PP.phase)) {
    ell(PP.server === 'you' ? cx - 190 : cx + 190, y + 15, 7, 7); ctx.fillStyle = '#ff9d2e'; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 2.5; ctx.stroke();
  }
  const tag = ppTag();
  if (tag) {
    font(17, 700); const w = ctx.measureText(tag.text).width + 30, x0 = cx - 222 - w;   // left of the bar (the ride's hearts are on the right)
    rr(x0, y + 1, w, 30, 15); ctx.fillStyle = tag.c; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = C.line; ctx.textAlign = 'center'; ctx.fillText(tag.text, x0 + w / 2, y + 16);
  }
}

// a keycap (the same look as the octagon card): white top on a lilac base, thick outline, an arrow or a word on it
function ppKey(x, y, w, label, dir) {
  ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = C.line;
  rr(-w / 2, -26, w, 58, 12); ctx.fillStyle = '#d9d4e4'; ctx.fill(); ctx.stroke();
  rr(-w / 2, -32, w, 56, 12); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
  ctx.translate(0, -4); ctx.fillStyle = C.line;
  if (dir) { ctx.rotate(dir === 'L' ? Math.PI : 0); ctx.beginPath(); ctx.moveTo(-14, -6); ctx.lineTo(0, -6); ctx.lineTo(0, -15); ctx.lineTo(15, 0); ctx.lineTo(0, 15); ctx.lineTo(0, 6); ctx.lineTo(-14, 6); ctx.closePath(); ctx.fill(); }
  else { font(26, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 0, 1); }
  ctx.restore();
}
// the instruction card: what to do and which keys, a few big words, until a key is pressed (at most PP_CARD seconds)
function ppCard() {
  const LP = LINES_PINGPONG, pop = fxBack(clamp(PP.cardT / 0.35, 0, 1));
  ctx.fillStyle = 'rgba(29,22,64,.62)'; ctx.fillRect(0, 0, W, H);
  const cw = Math.min(700, W * 0.64), ch = 390, cx = W / 2, cy = H * 0.53;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(pop, pop); ctx.lineJoin = 'round';
  rr(-cw / 2 + 10, -ch / 2 + 12, cw, ch, 28); ctx.fillStyle = 'rgba(14,10,34,.5)'; ctx.fill();
  rr(-cw / 2, -ch / 2, cw, ch, 28); ctx.fillStyle = '#fff8e6'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = C.line; ctx.stroke();
  title(LP.intro, 0, -ch / 2, 84);
  ctx.fillStyle = C.line; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; font(28, 600); ctx.fillText(LP.vs, 0, -ch / 2 + 72);
  const kx = -cw / 2 + 130, tx = -cw / 2 + 240;
  ppKey(kx - 37, -50, 62, '', 'L'); ppKey(kx + 37, -50, 62, '', 'R');
  ppKey(kx, 38, 140, LP.spaceKey);
  ctx.fillStyle = C.line; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; font(40, 700); ctx.fillText(LP.move, tx, -54); ctx.fillText(LP.space, tx, 34);
  ctx.strokeStyle = 'rgba(74,47,12,.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-cw / 2 + 40, 92); ctx.lineTo(cw / 2 - 40, 92); ctx.stroke();
  ctx.textAlign = 'center'; ctx.fillStyle = C.line; font(42, 700); ctx.fillText(LP.intro2, 0, 132);
  font(24, 600); ctx.fillStyle = '#8a6a3c'; ctx.fillText(LP.rule, 0, 170);
  ctx.restore();
  ctx.globalAlpha = 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(PP.t * 3)); title(LP.go, cx, cy + ch / 2 + 44, 30, '#fff'); ctx.globalAlpha = 1;
}
// your serve: the space key and "to serve" on your half of the table until you press it
function ppServePrompt() {
  if (!(PP.phase === 'serve' && PP.server === 'you' && PP.toss < 0)) return;
  const bx = pj(PP.bat.x, 0, 0.3)[0], x = bx < W / 2 ? bx + 250 : bx - 250, y = pj(0, 0.12, 0)[1] - 6, s = 1 + 0.04 * Math.sin(PP.t * 4);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ppKey(-80, 4, 130, LINES_PINGPONG.spaceKey); title(LINES_PINGPONG.toServe, 75, 0, 40, '#fff');
  ctx.restore();
}

// her speech bubble, in the same sticker style as bubble() in core.js, but BESIDE her head with the tail pointing
// sideways at her face. Above her head it covered the words on the whiteboard (pīng pāng qiú and the marker scoreboard);
// beside it, it sits in the clear band of the board under the scoreboard and over the old lesson questions, on whichever
// side of her has more room.
function ppLiuBubble(say) {
  const B = PP.wb, [hx, hy, hr] = PP.liuFace; if (!B) return;
  const top = B.by + 90, bot = B.by + B.bh * 0.72 - 8;                // under 'Liu Lao Shi' on the board, above question 1
  const roomR = B.bx + B.bw - 12 - (hx + hr + 20), roomL = hx - hr - 20 - (B.bx + B.bw * 0.17 + 48);   // left: clear of 心
  const right = roomR >= roomL, room = Math.max(roomR, roomL);
  // one line at 24; two lines at 22 (so they still fit the band); a longer line gets a wider bubble that may reach past
  // the board's edge onto the wall rather than a third line over the scoreboard
  const wrap = (size, maxW) => {
    font(size, 600);
    const words = say.text.split(' '), out = []; let cur = '';
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; }
    out.push(cur); return out;
  };
  let size = 24, maxW = clamp(room - 36, 150, 300), lines = wrap(size, maxW);
  if (lines.length > 1) { size = 22; lines = wrap(size, maxW); }
  if (lines.length > 2) { maxW = 380; lines = wrap(size, maxW); }
  const lh = size * 1.2, bw = Math.max(...lines.map(l => ctx.measureText(l).width)) + 36, bh = lines.length * lh + 22;
  const bx = clamp(right ? hx + hr + 20 : hx - hr - 20 - bw, 10, W - bw - 10);
  const by = clamp(Math.min(hy - bh / 2, (top + bot - bh) / 2), Math.min(top, bot - bh), Math.max(top, bot - bh));   // level with her face, or the middle of the band if that is higher
  const tipX = right ? hx + hr + 2 : hx - hr - 2, tipY = hy, edge = right ? bx : bx + bw, ty = clamp(tipY, by + 18, by + bh - 18);
  const age = say.d ? say.d - say.t : 1, sc = Math.max(0.01, fxBack(age / 0.2));   // pops out of the tail, like bubble()
  ctx.save(); ctx.translate(tipX, tipY); ctx.scale(sc, sc); ctx.translate(-tipX, -tipY);
  ctx.fillStyle = '#fff'; ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.lineJoin = 'round';
  const tail = (w, out) => { ctx.beginPath(); ctx.moveTo(edge, ty - w); ctx.lineTo(tipX + (right ? out : -out), tipY); ctx.lineTo(edge, ty + w); ctx.closePath(); };
  tail(11, 0); ctx.fill(); ctx.stroke();
  rr(bx, by, bw, bh, 18); ctx.fill(); ctx.stroke();
  tail(8, 5); ctx.save(); ctx.translate(right ? 3 : -3, 0); ctx.fill(); ctx.restore();   // white over the bubble's edge, so the tail joins it
  ctx.fillStyle = C.line; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, bx + bw / 2, by + 11 + lh * (i + .5)));
  ctx.restore();
}

function ppFrame(t, dt) {
  ppLayout();
  ppUpdate(dt);
  ppRoom();
  // the gameplay layer jolts after a smash (the room stays put, so no screen edge shows)
  ctx.save(); if (PP.stop <= 0.001 && PP.shake > 0) ctx.translate(...fxShake(PP.shake / 0.12, 4));
  const fl = pj(-(PP_HW - 0.1), PP_TL, 0), fr = pj(PP_HW - 0.1, PP_TL, 0), wl = PPL.K0 * 0.05 * 0.62;
  ctx.fillStyle = '#2b2f3a'; ctx.strokeStyle = C.line; ctx.lineWidth = 4; for (const p of [fl, fr]) { rr(p[0] - wl / 2, p[1], wl, 120, 3); ctx.fill(); ctx.stroke(); }
  ppLiu();
  ppTable();
  const b = PP.ball;
  if (b.y > PP_NY) ppBall(b);
  ppNet();
  if (b.y <= PP_NY) ppBall(b);
  ppNailong();
  ppFxDraw();
  ctx.restore();
  ppHud();
  if (PP.pop) { const u = clamp(1 - PP.pop.t / 1.3, 0, 1), sc = u < 0.15 ? ease(u / 0.15) * 1.2 : 1; title(PP.pop.text, W / 2, H * 0.47, Math.min(110, W / 9) * sc, PP.pop.c); }
  ppServePrompt();
  if (PP.say && PP.liuFace && PP.phase !== 'card') ppLiuBubble(PP.say);
  if (PP.phase === 'won' && PP.timer < 2.0 && !PP.nlSay) ppSay('nl', LINES_PINGPONG.winNl, 2);
  if (PP.nlSay && PP.nlHead) bubble(PP.nlSay.text, PP.nlHead[0], PP.nlHead[1] - 4, 26, 300);
  if (PP.phase === 'won') title(LINES_PINGPONG.winTitle, W / 2, H * 0.58, Math.min(104, W / 10));
  if (PP.phase === 'again') title(LINES_PINGPONG.loseTitle, W / 2, H * 0.58, Math.min(70, W / 14), '#ff9bb0');
  if (PP.phase === 'card') ppCard();
}

// keys and pointer. The arrows are HELD (keydown in key(), keyup below), so the bat starts at once and stops on release
// instead of waiting for the Mac's key repeat. The pointer (trackpad) puts the bat across the table where the pointer is.
function ppPointerTo(x) { PP.tgt.x = (x - W / 2) / PPL.K0; }
const ppIsL = k => k === 'ArrowLeft' || k === 'a' || k === 'A', ppIsR = k => k === 'ArrowRight' || k === 'd' || k === 'D';
addEventListener('keyup', e => { if (!PP.keys) return; if (ppIsL(e.key)) PP.keys.l = false; else if (ppIsR(e.key)) PP.keys.r = false; });
addEventListener('blur', () => { if (PP.keys) PP.keys.l = PP.keys.r = false; });
// space / click: serve when the ball is yours, otherwise a smash swing (0.3 s window, then a short recovery)
function ppHit() { if (PP.phase === 'serve' && PP.server === 'you') { if (PP.toss < 0) PP.toss = 0; } else if (PP.phase === 'rally') ppSwing(); }
GAMES.pingpong = {
  title: 'NAILONG PING PONG',
  hint: 'laptop: hold ← → to move the bat (or use the trackpad), space = serve and smash / phone: drag the bat, tap = smash',
  // api.replay (a replay from the end menu): no card, no speech bubbles, a short win beat
  enter(api) { this.api = api; PP_REPLAY.on = !!(api && api.replay); ppLayout(); ppReset(true); if (PP_REPLAY.on) ppNextServe(); },
  fail() { this.api.died && this.api.died(); },          // once per lost match (main.js counts the ride-wide lives)
  draw(t, dt) { ppFrame(t, dt); },
  key(e) {
    const k = e.key;
    if (e.metaKey || e.ctrlKey || e.altKey || ['Shift', 'Meta', 'Control', 'Alt', 'Tab', 'CapsLock', 'Escape'].includes(k)) return;
    if (ppIsL(k)) PP.keys.l = true; else if (ppIsR(k)) PP.keys.r = true;
    if (PP.phase === 'card') { if (PP.cardT > 0.2) ppStart(); return; }     // any key starts the match
    if (e.repeat) return;
    if (PP.phase === 'again') { ppRematch(); return; }                     // impatient: any key skips the rematch beat
    if (PP.phase === 'won') { if (PP.timer < 2.4) ppFinish(); return; }    // ...and the end, once the win has landed
    if (k === ' ' || k === 'Enter' || k === 'ArrowUp' || k === 'w' || k === 'W') ppHit();
  },
  pointer(kind, x, y) {
    if (window.AUTO) return;
    if (kind === 'down') { if (PP.phase === 'card') { if (PP.cardT > 0.2) ppStart(); return; } ppPointerTo(x); ppHit(); }
    else if (kind === 'move' && PP.phase !== 'card') ppPointerTo(x);
  },
};
