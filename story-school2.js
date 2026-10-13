// ---------- story-school2.js: the Chinese room (A before Tetris, B after it), the funny faces, the LLC (story-b) ----------
// Clips, in SCENE seconds (main.js plays clips at 70% speed, so real seconds = scene / 0.7). Pure functions of t, like story.js.
//   sceneChineseA (CH_A_DUR): THE RIDE OPENS HERE (round 4): thrown down by Max at the end of the intro, Nailong falls through the
//     ROOF (Max, 13 Oct: "he falls through the roof into the chinese classroom"): the ceiling cracks, bursts, he drops in head first
//     screaming and lands on his head in the SECOND row (the hole stays in the ceiling), dizzy, while Liu Lao Shi keeps writing; then he sees Jed's Tetris under the desk, "That's easy.",
//     Jed offers his open MacBook, it suddenly speeds up, "WHY'S IT SO FAST!!??", zoom into its screen (games/tetris.js picks up).
//   sceneChineseB (CH_B_DUR): she noticed: "move to the front", the sad walk from the second row, a pause, "Can I play ping pong?",
//     the hard problem, he solves it, she pulls out a bat (into games/pingpong.js).
//   sceneChineseOut (CH_OUT_DUR): after ping pong, out of her door into the corridor, waving back: "What a fun and nice teacher." (then the cafe).
//   sceneLLC (S2_LLC_DUR): tiptoe, ACHOO, "Oh, a car!", pause, "I want to ride it.", a 5 s funny face, out of the window (sceneEscape).
//   sceneChinese (S2_CH_DUR, the old one-piece room) and sceneFaces (S2_FACE_DUR) stay for fallbacks and tests; neither is in FLOW.
// Needs the global liuLaoShi() from games/pingpong.js and camry() from story-canberra.js (called at draw time, so load order does not matter).
// Sounds: window.SFX && SFX.play(name) on every physical moment, fired by s2Cues as the clip clock passes each time.
// EVERY visible line lives here. "// placeholder, Max to edit" = a line Claude wrote, not Max.
const LINES_SCHOOL2 = {
  chinese: {
    // A: the ride opens here (he lands head first), then Tetris
    scream: 'AAAAAAAAAAAAAAAAAAA',                        // his scream as he falls through the roof head first (the intro's AAAA)
    thud: 'THUD!',                                        // placeholder, Max to edit (the sound word as he lands on his head)
    easy: 'That\'s easy.',                                // placeholder, Max to edit (his beat: "Nai long starts off telling Jed it's easy")
    try: 'Oh, do you want to try, Nailong?',              // Max's words (Jed)
    fast: 'WHY\'S IT SO FAST!!??',                        // Max's words
    phoneTime: '1:47',                                    // the clock on Jed's MacBook, the same as LINES_TETRIS so the zoom lands on the game
    // B: after Tetris
    move: 'Nai Long, move to the front.',                 // Max's words
    ping: 'Can I play ping pong?',                        // Max's words
    what: 'What??',                                       // Max's words (Liu Lao Shi, to "Can I play ping pong?")
    no: 'No!',                                            // Max's words (loud: a thud and a shake)
    first: 'Maybe after you solve this.',                 // Max's words (after the held pause; then she writes the problem)
    qLabel: 'qǐng xiě pīnyīn',                            // "please write the pinyin"
    q1: '请写拼音：', q2: '乒乓球',                          // 请写拼音：乒乓球 = "Please write the pinyin: ping pong"
    answer: 'pīng pāng qiú',                              // the pinyin of 乒乓球
    got: 'Oh! I got it!',                                 // placeholder, Max to edit
    praise: 'Hěn hǎo! Now. Ping pong.',                   // "Very good!"  placeholder, Max to edit
    // the room itself (from the photo of her classroom)
    board1: '1. after graduation, work as ...',           // what is really on her board (photo)
    board2: '2. compare work ...',
    heart: '心',
    sign: ['Please don\'t touch or', 'move any displays in', 'this classroom.', 'Thank you! Xiexie!'],
    card1py: 'xīng qī yī', card1: '星期一', card2py: 'tiān', card2: '天',   // the pinyin cards on the board
    zhong: 'zhōng', labels: ['中文', '学习'], fu: '福', diannao: 'diàn nǎo 电脑',
  },
  out: {
    nice: 'What a fun and nice teacher.',                 // Max's words (the full stop added)
    sign: '中文',                                          // the room sign by her door
  },
  faces: {
    prompts: ['Funny face!', 'Now puff your cheeks!', 'Now a fish!', 'Now your WORST one!'],   // TODO joke
    sfx: ['BLEH!', 'PFFFT', 'bloop bloop', 'GRAAAH!'],
    end: 'Stop. Stop. I can\'t. Again!',                  // TODO joke
    sign: 'LEADERSHIP & LEARNING CENTRE  >>',
  },
  llc: {
    whisper: 'Shhh. Quiet feet.',                         // placeholder, Max to edit
    squeak: 'squeak',
    smug: 'Nobody heard a thing.',                        // placeholder, Max to edit
    ah: 'Ah... ah...',
    achoo: 'ACHOO!!',
    sorry: 'Sorry.',                                      // placeholder, Max to edit
    car: 'Oh, a car!',                                    // Max's words
    ride: 'I want to ride it.',                           // Max's words
    sign: 'QUIET STUDY',                                  // same sign as the Tetris backdrop
  },
};

const s2Tw = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const s2Pulse = (t, a, b) => Math.sin(Math.PI * s2Tw(t, a, b));
// pinyin with tone marks: Fredoka's ī is broken in Chrome/Edge (the macron lands beside the letter), so pinyin uses a system face
// that has every tone mark (Avenir Next / Helvetica Neue on a Mac, Segoe UI on Windows), like games/pingpong.js
function s2PyFont(px, w = 600){ ctx.font = `${w} ${px}px "Avenir Next", "Helvetica Neue", "Segoe UI", Arial, sans-serif`; }
// sounds in a pure clip: each cue [scene time, name, opts] plays once as the clip clock passes it; a clock that goes back
// (watch again, a fresh run) re-arms them. Unknown names are silent no-ops in sfx.js.
const s2CueT = {};
function s2Cues(key, t, list){
  const prev = s2CueT[key]; s2CueT[key] = t;
  if (prev === undefined || t <= prev || !window.SFX) return;
  for (const [at, name, o] of list) if (prev < at && t >= at) SFX.play(name, o || {});
}

// a speech bubble BESIDE a face (side 1 = right of it, -1 = left), its tail pointing sideways at the face, so a line can sit level
// with a head without covering what is written on the board above it. Same sticker look and 0.2 s pop as bubble() in core.js;
// age = scene seconds since the line started (clips are pure functions of t). fx, fy = face centre, fr = half its width.
// A line with a tone mark Fredoka has no glyph for (ě ǎ ǔ ē: they fell back to a heavier system letter mid-word) is set in
// the pinyin face instead, like the pinyin on the board.
const S2_TONED = /[Ā-ɏ]/;
function s2SideBubble(text, fx, fy, fr, side, age, size = 28, maxW = 320){
  if (S2_TONED.test(text)) s2PyFont(size, 500); else font(size, 600);
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const t2 = cur ? cur + ' ' + w : w; if (ctx.measureText(t2).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t2; }
  lines.push(cur);
  const right = side > 0, lh = size*1.2, bw = Math.max(...lines.map(l => ctx.measureText(l).width)) + 36, bh = lines.length*lh + 22;
  const bx = clamp(right ? fx + fr + 22 : fx - fr - 22 - bw, 10, W - bw - 10), by = clamp(fy - bh/2, 10, H - bh - 10);
  const tipX = right ? fx + fr + 4 : fx - fr - 4, edge = right ? bx : bx + bw, ty = clamp(fy, by + 18, by + bh - 18);
  const sc = Math.max(0.01, fxBack(age/0.2));
  ctx.save(); ctx.translate(tipX, fy); ctx.scale(sc, sc); ctx.translate(-tipX, -fy);
  ctx.fillStyle = '#fff'; ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.lineJoin = 'round';
  const tail = (w, out) => { ctx.beginPath(); ctx.moveTo(edge, ty - w); ctx.lineTo(tipX + (right ? out : -out), fy); ctx.lineTo(edge, ty + w); ctx.closePath(); };
  tail(11, 0); ctx.fill(); ctx.stroke();
  rr(bx, by, bw, bh, 18); ctx.fill(); ctx.stroke();
  tail(8, 5); ctx.save(); ctx.translate(right ? 3 : -3, 0); ctx.fill(); ctx.restore();   // white over the bubble's edge, so the tail joins it
  ctx.fillStyle = C.line; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, bx + bw/2, by + 11 + lh*(i + .5)));
  ctx.restore();
}

// Nailong with an optional painter that draws in HIS local space (head, eyes, cheeks) on top of the body
function s2NL(x, y, s, o, painter){
  nailong(x, y, s, o);
  if (!painter) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(s*(o.sx || 1), s*(o.sy || 1)); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  painter(); ctx.restore();
}
function s2Eye(cx, cy, r, px, py, pr){
  ell(cx, cy, r, r); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke();
  ell(cx + px, cy + py, pr, pr); ctx.fillStyle = '#111'; ctx.fill();
  ell(cx + px + pr*0.35, cy + py - pr*0.35, pr*0.3, pr*0.3); ctx.fillStyle = '#fff'; ctx.fill();
}
// wipes Nailong's own eyes and mouth (clipped inside the head) so a custom face can be drawn
function s2Wipe(){ ell(0, -130, 43, 40); ctx.clip(); ctx.fillStyle = C.y; ctx.fillRect(-60, -175, 120, 95); }

// lime plastic chair with a fan-shaped slotted back (the real chairs in the Chinese room), seen from behind
function s2Fan(cx, top, w, h){
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = '#8a8f99'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(cx - w*0.2, top + h*0.9); ctx.lineTo(cx - w*0.26, top + h*1.4); ctx.moveTo(cx + w*0.2, top + h*0.9); ctx.lineTo(cx + w*0.26, top + h*1.4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - w*0.5, top + h*0.55); ctx.bezierCurveTo(cx - w*0.58, top - h*0.08, cx + w*0.58, top - h*0.08, cx + w*0.5, top + h*0.55);
  ctx.quadraticCurveTo(cx, top + h*0.95, cx - w*0.5, top + h*0.55); ctx.closePath();
  ctx.fillStyle = '#a7cb3f'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.line; ctx.stroke();
  ctx.save(); ctx.clip(); ctx.strokeStyle = '#6f9420'; ctx.lineWidth = 3; ctx.setLineDash([9, 6]);
  for (let i = -5; i <= 5; i++) { ctx.beginPath(); ctx.moveTo(cx + i*w*0.02, top + h*0.85); ctx.lineTo(cx + i*w*0.12, top - h*0.02); ctx.stroke(); }
  ctx.restore();
  ctx.fillStyle = '#8fb02e'; rr(cx - w*0.1, top + h*0.78, w*0.2, h*0.16, 6); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
  ctx.restore();
}

// a bamboo plate painted with flowers or a bird
function s2Plate(x, y, r, kind){
  ctx.save(); ell(x, y, r, r); ctx.fillStyle = '#d9b36a'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
  ctx.clip(); ctx.strokeStyle = 'rgba(120,80,30,.35)'; ctx.lineWidth = 2;
  for (let k = -r; k < r; k += 9) { ctx.beginPath(); ctx.moveTo(x + k, y - r); ctx.lineTo(x + k, y + r); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - r, y + k); ctx.lineTo(x + r, y + k); ctx.stroke(); }
  ctx.restore();
  ell(x, y, r*0.66, r*0.66); ctx.fillStyle = '#eef3e2'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = C.line; ctx.stroke();
  const leaf = (dx, dy, rot) => { ell(x + dx*r, y + dy*r, r*0.2, r*0.09, rot); ctx.fillStyle = '#4f9a4a'; ctx.fill(); };
  if (kind === 3) {
    leaf(-0.3, 0.3, 0.3); leaf(0.25, 0.35, -0.3);
    ell(x - r*0.05, y, r*0.22, r*0.14, -0.2); ctx.fillStyle = '#3a4a6a'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
    ell(x - r*0.22, y - r*0.1, r*0.1, r*0.1); ctx.fillStyle = '#3a4a6a'; ctx.fill(); ctx.stroke();
    ell(x + r*0.02, y - r*0.02, r*0.1, r*0.06, -0.5); ctx.fillStyle = '#fff'; ctx.fill();
  } else {
    leaf(-0.3, 0.28, 0.4); leaf(0.3, 0.3, -0.4);
    const col = ['#ee6f95', '#6aa8e8', '#f59a2f'][kind];
    for (let k = 0; k < 5; k++) { const a = k*Math.PI*2/5; ell(x + Math.cos(a)*r*0.13, y - r*0.05 + Math.sin(a)*r*0.13, r*0.12, r*0.09, a); ctx.fillStyle = col; ctx.fill(); }
    ell(x, y - r*0.05, r*0.06, r*0.06); ctx.fillStyle = '#ffd21f'; ctx.fill();
  }
}

// the Chinese room: wall, plates, clock, boards, TV, teacher's desk. Returns the main whiteboard rectangle.
function s2Room(t){
  const LR = LINES_SCHOOL2.chinese, fy = H*0.70, R = {bx: W*0.30, by: H*0.19, bw: W*0.40, bh: H*0.37};
  ctx.fillStyle = '#ecebe6'; ctx.fillRect(0, 0, W, fy);
  ctx.fillStyle = '#d9dadf'; ctx.fillRect(0, 0, W, H*0.065);
  ctx.strokeStyle = 'rgba(74,47,12,.15)'; ctx.lineWidth = 2;
  for (let x = 0; x < W; x += W/8) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H*0.065); ctx.stroke(); }
  ctx.fillStyle = '#fff'; rr(W*0.5, H*0.012, W*0.2, H*0.03, 8); ctx.fill();
  ctx.fillStyle = '#585d70'; ctx.fillRect(0, fy, W, H - fy);
  ctx.fillStyle = '#4a4f62'; for (let i = 0; i < 90; i++) ctx.fillRect(((i*173) % 1000)/1000*W, fy + 10 + ((i*97) % 100)/100*(H - fy - 12), 16, 3);
  ctx.fillStyle = '#4a4f62'; ctx.fillRect(0, fy - 6, W, 8);
  // red diamond decoration with a clock
  ctx.save(); ctx.translate(W*0.12, H*0.15); ctx.rotate(Math.PI/4); rr(-34, -34, 68, 68, 5); ctx.fillStyle = '#d3303a'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#e8b44a'; ctx.stroke(); ctx.restore();
  ell(W*0.12, H*0.15, 24, 24); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke();
  ctx.lineCap = 'round'; ctx.lineWidth = 3; ctx.beginPath();
  ctx.moveTo(W*0.12, H*0.15); ctx.lineTo(W*0.12 + Math.sin(t*0.4)*18, H*0.15 - Math.cos(t*0.4)*18);
  ctx.moveTo(W*0.12, H*0.15); ctx.lineTo(W*0.12 + Math.sin(2.2)*11, H*0.15 - Math.cos(2.2)*11); ctx.stroke(); ctx.lineCap = 'butt';
  // bamboo plates
  [[0.34, 0], [0.46, 1], [0.58, 2], [0.69, 3]].forEach(([fx, k]) => s2Plate(W*fx, H*0.105, Math.min(36, W*0.03), k));
  // little left whiteboard with red labels, green zhong card
  ctx.fillStyle = '#a3a5ae'; rr(W*0.015, H*0.30, W*0.16, H*0.28, 6); ctx.fill();
  ctx.fillStyle = '#fbfcfd'; rr(W*0.022, H*0.31, W*0.146, H*0.26, 4); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke();
  ctx.fillStyle = '#d3303a'; rr(W*0.03, H*0.33, W*0.05, H*0.06, 3); ctx.fill(); rr(W*0.09, H*0.33, W*0.05, H*0.06, 3); ctx.fill();
  ctx.fillStyle = '#ffe9a8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; font(Math.min(26, W*0.02), 600); ctx.fillText(LR.labels[0], W*0.055, H*0.36); ctx.fillText(LR.labels[1], W*0.115, H*0.36);
  ctx.fillStyle = '#bfe3a8'; rr(W*0.03, H*0.235, W*0.06, H*0.04, 3); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = C.line; s2PyFont(14); ctx.fillText(LR.zhong, W*0.06, H*0.255);
  // big black TV with red New Year banners
  rr(W*0.735, H*0.10, W*0.25, H*0.40, 8); ctx.fillStyle = '#15161a'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.line; ctx.stroke();
  ctx.save(); rr(W*0.735, H*0.10, W*0.25, H*0.40, 8); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,.07)';
  ctx.beginPath(); ctx.moveTo(W*0.78, H*0.10); ctx.lineTo(W*0.84, H*0.10); ctx.lineTo(W*0.76, H*0.50); ctx.lineTo(W*0.735, H*0.50); ctx.fill(); ctx.restore();
  const nb = 6, bwid = (W*0.25 - 12)/nb;
  for (let i = 0; i < nb; i++) { ctx.fillStyle = '#d3303a'; rr(W*0.735 + 6 + i*bwid, H*0.505, bwid - 4, H*0.04, 3); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.line; ctx.stroke();
    ctx.fillStyle = '#ffd86b'; font(Math.min(18, bwid*0.5), 700); ctx.fillText(LR.fu, W*0.735 + 6 + i*bwid + (bwid - 4)/2, H*0.525); }
  // teacher's desk with papers, magazine files, trays, water bottle, diàn nǎo card
  const dt = H*0.625;
  ctx.fillStyle = '#4f5466'; ctx.fillRect(W*0.72, dt, 7, H*0.12); ctx.fillRect(W*0.975, dt, 7, H*0.12);
  ctx.fillStyle = '#f4f4f6'; rr(W*0.70, dt, W*0.30, H*0.03, 3); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke();
  for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#fafafa' : '#f0ece0'; rr(W*0.775 + i*5, dt - 12 - i*6, W*0.09, 12, 2); ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); }
  [['#7c4fb8', 0], ['#ee5f86', 1], ['#a778d8', 2]].forEach(([col, i]) => { ctx.fillStyle = col; rr(W*0.705, dt - 18 - i*18, W*0.06, 18, 3); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.line; ctx.stroke(); });
  ctx.fillStyle = '#fff'; rr(W*0.885, dt - 50, W*0.02, 50, 3); ctx.fill(); ctx.stroke(); rr(W*0.91, dt - 50, W*0.02, 50, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8fd0ee'; rr(W*0.955, dt - 46, 22, 46, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; rr(W*0.815, dt - 32, W*0.07, 24, 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = C.line; s2PyFont(10); ctx.textAlign = 'center'; ctx.fillText(LR.diannao, W*0.85, dt - 20);
  // garment bag + panda plush by the left wall
  ctx.fillStyle = '#aab0b8'; rr(W*0.012, H*0.45, W*0.05, H*0.27, 12); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke();
  ctx.strokeStyle = '#7d848f'; ctx.beginPath(); ctx.moveTo(W*0.037, H*0.47); ctx.lineTo(W*0.037, H*0.7); ctx.stroke();
  const px = W*0.085, py = H*0.665;
  ell(px, py + 18, 20, 22); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke();
  for (const d of [-1, 1]) { ell(px + d*14, py - 22, 7, 7); ctx.fillStyle = '#222'; ctx.fill(); }
  ell(px, py - 8, 18, 16); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
  for (const d of [-1, 1]) { ell(px + d*8, py - 10, 5, 4, d*0.4); ctx.fillStyle = '#222'; ctx.fill(); }
  ell(px, py - 3, 3, 2.2); ctx.fillStyle = '#222'; ctx.fill();
  // the main whiteboard, pinyin cards, Xiexie sign
  const {bx, by, bw, bh} = R, L = LINES_SCHOOL2.chinese;
  ctx.fillStyle = '#a3a5ae'; rr(bx - 8, by - 8, bw + 16, bh + 16, 8); ctx.fill();
  ctx.fillStyle = '#fbfcfd'; rr(bx, by, bw, bh, 5); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
  ctx.fillStyle = '#c9c9d2'; rr(bx + 20, by + bh + 8, bw - 40, 8, 3); ctx.fill();
  ctx.fillStyle = 'rgba(43,51,80,.55)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; font(Math.min(70, W*0.055), 500); ctx.fillText(L.heart, bx + bw*0.1, by + bh*0.78);
  ctx.textAlign = 'left'; font(Math.min(18, W*0.014), 500); ctx.fillText(L.board1, bx + bw*0.5, by + bh*0.9); ctx.fillText(L.board2, bx + bw*0.5, by + bh*0.96);
  const cw = Math.min(100, W*0.08);
  ctx.fillStyle = '#bfe0f2'; ctx.strokeStyle = C.line; ctx.lineWidth = 3; rr(bx + 8, by + 8, cw, 54, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C.line; ctx.textAlign = 'center'; s2PyFont(12); ctx.fillText(L.card1py, bx + 8 + cw/2, by + 24); font(22, 600); ctx.fillText(L.card1, bx + 8 + cw/2, by + 46);
  ctx.fillStyle = '#fbe36a'; rr(bx + 8, by + 68, cw*0.6, 52, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C.line; s2PyFont(12); ctx.fillText(L.card2py, bx + 8 + cw*0.3, by + 84); font(26, 600); ctx.fillText(L.card2, bx + 8 + cw*0.3, by + 106);
  const sw = Math.min(124, W*0.1);
  ctx.fillStyle = '#fff'; ctx.strokeStyle = C.line; ctx.lineWidth = 3; rr(bx - sw - 22, by + 18, sw, 74, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C.line; font(10, 600); ctx.textAlign = 'center'; L.sign.forEach((l, i) => ctx.fillText(l, bx - sw - 22 + sw/2, by + 34 + i*15));
  return R;
}

// the question on the board: written in (clipped left to right), then the green answer. T = when (scene s): q question, a answer, s sparkle
const S2_PROB_OLD = {q: [9.1, 10.0], a: [12.7, 13.5], s: [13.3, 14.2]};
function s2Problem(R, t, T = S2_PROB_OLD){
  const L = LINES_SCHOOL2.chinese, {bx, by, bw, bh} = R;
  const p = s2Tw(t, T.q[0], T.q[1]);
  if (p > 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(bx, by, bw*(0.15 + 0.85*ease(p)), bh); ctx.clip();
    ctx.fillStyle = '#2b3350'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    s2PyFont(17); ctx.fillText(L.qLabel, bx + bw*0.5, by + bh*0.08);
    font(Math.min(40, W*0.032), 600); ctx.fillText(L.q1, bx + bw*0.5, by + bh*0.21);
    font(Math.min(96, W*0.075), 600); ctx.fillText(L.q2, bx + bw*0.5, by + bh*0.47);
    ctx.restore();
  }
  const a = s2Tw(t, T.a[0], T.a[1]);
  if (a > 0) {
    const ax = bx + bw*0.62, ay = by + bh*0.71; s2PyFont(Math.min(46, W*0.036));   // 0.71: the p, g and q tails clear Liu Lao Shi's hair
    ctx.save(); ctx.beginPath(); ctx.rect(ax - 190, by, 380*ease(a), bh); ctx.clip();
    ctx.fillStyle = '#1f8a4c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(L.answer, ax, ay);
    ctx.restore();
    if (t > T.s[0] && t < T.s[1]) { const k = (t - T.s[0])/(T.s[1] - T.s[0]); ctx.strokeStyle = '#ffd21f'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let i = 0; i < 8; i++) { const an = i*Math.PI/4 + 0.2, r0 = 150 + k*30; ctx.beginPath(); ctx.moveTo(ax + Math.cos(an)*r0*1.1, ay + Math.sin(an)*r0*0.35); ctx.lineTo(ax + Math.cos(an)*(r0 + 22*(1 - k))*1.1, ay + Math.sin(an)*(r0 + 22*(1 - k))*0.35); ctx.stroke(); } ctx.lineCap = 'butt'; }
  }
}

// ---------- clip 1: the Chinese room (15.6 s). Emotional low point at 6.5 to 10, climb back from 12.4 ----------
const S2_CH_DUR = 15.6;
function sceneChinese(t){
  const L = LINES_SCHOOL2.chinese, R = s2Room(t);
  s2Problem(R, t);
  const tint = 0.30*(ease(s2Tw(t, 6.4, 7.2)) - ease(s2Tw(t, 12.2, 13.0)));
  if (tint > 0.001) { ctx.fillStyle = `rgba(40,52,100,${tint})`; ctx.fillRect(0, 0, W, H); }
  s2Fan(W*0.19, H*0.60, 120, 100);                         // his lime chair at the back desk

  // ---- Liu Lao Shi (the global from games/pingpong.js) ----
  const lx = W*0.40, ly = H*0.79, ls = 0.8;
  const lo = {mouth: 'smile', look: [0.5, 0], aL: 0.15, aR: 0.2, marker: true, pony: Math.sin(t*3)*0.1, slip: 0, blink: (t % 3.2) < 0.12 ? 1 : 0};
  const talk = () => (Math.sin(t*18) > 0 ? 'open' : 'smile');
  if (t < 2.2) { lo.aR = 2.3 + Math.sin(t*13)*0.16; lo.look = [0.9, -0.5]; }
  else if (t < 4.0) { lo.aR = lerp(2.3, 0.2, ease(s2Tw(t, 2.2, 2.6))); lo.aL = 1.5; lo.look = [-1, 0.3]; lo.mouth = t < 3.7 ? talk() : 'smile'; }
  else if (t < 7.2) { lo.aL = lerp(1.5, 0.15, s2Tw(t, 4.0, 4.4)); lo.look = [lerp(-1, 0.9, s2Tw(t, 5.2, 6.4)), 0.2]; }
  else if (t < 9.0) { lo.look = [0.9, 0.3]; lo.mouth = t > 8.4 ? 'o' : 'smile'; lo.slip = ease(s2Tw(t, 8.5, 8.8)); lo.pony = Math.sin(t*3)*0.1 + (t > 8.5 ? 0.15 : 0); }
  else if (t < 9.9) { lo.aR = 2.4 + Math.sin(t*14)*0.18; lo.look = [0.8, -0.5]; lo.slip = 0.2*(1 - s2Tw(t, 9, 9.2)); lo.mouth = t < 9.6 ? talk() : 'smile'; }
  else if (t < 12.3) { lo.aL = 0.55; lo.aR = 0.55; lo.mouth = 'flat'; lo.look = [0.9, 0.3]; }
  else if (t < 13.8) { lo.mouth = 'o'; lo.slip = 1; lo.look = [0.8, -0.4]; lo.aR = 0.5; lo.aL = 0.4; }
  else { lo.mouth = talk(); lo.aL = lerp(2.9, 0.7, ease(s2Tw(t, 14.0, 14.7))); lo.aR = 0.15; lo.look = [-0.4, 0]; lo.marker = false; lo.bat = t > 14.2; lo.slip = 0; }
  lo.sy = t > 12.3 && t < 13.8 ? 1 + 0.03*Math.sin(t*20) : 1;
  liuLaoShi(lx, ly, ls, lo);

  // ---- Nailong ----
  const fxp = W*0.64, fyp = H*0.86, sF = 0.85;
  let x = W*0.19, y = H*0.80, s = 0.6, sx = 1, sy = 1, rot = 0, sad = false, tears = false, think = false;
  const o = {mouth: 'smile', arms: 'down', look: [0, 0.3]};
  if (t < 4.0) {
    o.look = [Math.sin(t*1.7)*0.7, 0.2 + Math.sin(t*0.9)*0.2]; sy = 1 + Math.sin(t*2)*0.015;
    if (t > 2.4) { o.look = [0.8, -0.2]; o.mouth = 'o'; }
    const q = s2Pulse(t, 2.4, 2.7); sy += 0.15*q; sx -= 0.07*q; y -= 16*q;
  } else if (t < 4.5) {
    const k = (t - 4.0)/0.5; y -= Math.sin(Math.PI*k)*46; s = 0.6 + 0.04*k; o.look = [0.5, 0.8]; sy = 1 + 0.12*Math.sin(Math.PI*k);
  } else if (t < 6.5) {
    const k = (t - 4.5)/2.0, k1 = clamp(k/0.4, 0, 1), k2 = clamp((k - 0.4)/0.6, 0, 1);
    x = lerp(lerp(W*0.19, W*0.36, ease(k1)), fxp, ease(k2)); y = lerp(H*0.80, fyp, ease(k2)); s = lerp(0.64, sF, ease(k2));
    y -= Math.abs(Math.sin(t*10))*6; o.walk = t*10; o.look = [0.4, 0.9]; sy = 0.95;
  } else {
    x = fxp; y = fyp; s = sF;
    if (t < 9.9) {                                            // the low point
      sad = true; tears = t > 6.9; sy = 0.92 + Math.sin(t*1.6)*0.01; sx = 1.04; o.look = t > 7.2 && t < 8.7 ? [-0.9, -0.3] : [0, 1];
      if (t < 6.9) sy -= 0.04*s2Pulse(t, 6.5, 6.9);
      if (t > 9.0) o.look = [-0.4, -0.6];
      if (t > 7.2 && t < 8.6) o.mouth = 'o';
    } else if (t < 12.3) {                                   // thinking hard
      think = true; o.mouth = 'o'; sy = 1 + 0.07*Math.sin(t*9); sx = 1 - 0.04*Math.sin(t*9); rot = Math.sin(t*2.2)*0.08;
      o.look = [Math.cos(t*5), Math.sin(t*5)*0.8];
      if (t > 12.0) { const k = s2Tw(t, 12.0, 12.3); sy = 1 - 0.2*k; sx = 1 + 0.15*k; }
    } else if (t < 13.6) {                                   // stretch up to the board
      const k = s2Tw(t, 12.3, 12.7); sy = lerp(0.8, 1.55, ease(k)); sx = lerp(1.15, 0.8, ease(k)); o.arms = 'up'; o.flail = t*14; o.mouth = 'open'; o.look = [-0.3, -1];
      if (t > 13.3) { const q = s2Tw(t, 13.3, 13.6); sy = lerp(1.55, 0.78, ease(q)); sx = lerp(0.8, 1.2, ease(q)); }
    } else {                                                 // the climb back
      const k = t - 13.6; o.arms = 'up'; o.flail = t*14; o.mouth = 'open'; o.look = [-1, -0.2];
      if (k < 0.3) { sy = lerp(0.78, 1, k/0.3); sx = lerp(1.2, 1, k/0.3); }
      else y -= Math.abs(Math.sin(k*10))*40;
    }
  }
  s2NL(x, y, s, Object.assign(o, {sx, sy, rot}), () => {
    if (sad) {
      ctx.save(); ell(0, -130, 43, 40); ctx.clip(); ctx.fillStyle = C.y; ctx.fillRect(-34, -124, 68, 26); ctx.restore();
      ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -94, 17, Math.PI + 0.35, Math.PI*2 - 0.35); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-42, -162); ctx.lineTo(-12, -172); ctx.moveTo(42, -162); ctx.lineTo(12, -172); ctx.stroke();
    }
    if (think) { ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(-42, -170); ctx.lineTo(-12, -166); ctx.moveTo(42, -174); ctx.lineTo(12, -166); ctx.stroke(); }
  });
  if (tears) {
    for (const d of [-1, 1]) for (let i = 0; i < 2; i++) { const ph = (t*1.4 + i*0.5 + (d > 0 ? 0.2 : 0)) % 1;
      ell(x + d*25*s*sx, y - 140*s*sy + 4 + ph*70*s, 5*s + 2, 8*s + 2); ctx.fillStyle = '#6bb8f0'; ctx.fill(); }
  }
  if (sad && t > 6.8) {                                       // the little rain cloud over his head
    const k = ease(s2Tw(t, 6.8, 7.3))*(1 - ease(s2Tw(t, 9.5, 9.9))), cx = x, cy = y - 215*s*sy - 30 - (1 - k)*40;
    if (k > 0.01) {
      const B = [[-34, 6, 30, 20], [0, -6, 38, 26], [36, 6, 30, 20], [0, 10, 60, 16]];
      ctx.save(); ctx.globalAlpha = k; ctx.strokeStyle = C.line; ctx.lineWidth = 4;
      for (const [dx, dy, rx, ry] of B) { ell(cx + dx, cy + dy, rx, ry); ctx.stroke(); }
      for (const [dx, dy, rx, ry] of B) { ell(cx + dx, cy + dy, rx, ry); ctx.fillStyle = '#8d96ab'; ctx.fill(); }
      ctx.strokeStyle = '#6bb8f0'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++) { const ph = (t*1.8 + i*0.31) % 1, dx = -42 + i*17; ctx.beginPath(); ctx.moveTo(cx + dx, cy + 30 + ph*50); ctx.lineTo(cx + dx - 3, cy + 42 + ph*50); ctx.stroke(); }
      ctx.restore(); ctx.lineCap = 'butt';
    }
  }
  if (think) {                                                // the characters orbit his head, steam, sweat
    const hx = x, hy = y - 135*s*sy;
    ['乒', '乓', '球', '?'].forEach((ch, i) => { const a = t*3.2 + i*Math.PI/2;
      ctx.globalAlpha = 0.7 + 0.3*Math.sin(a); title(ch, hx + Math.cos(a)*95, hy - 75*s + Math.sin(a)*36, 34 + Math.sin(a)*6, '#fff'); ctx.globalAlpha = 1; });
    for (let i = 0; i < 4; i++) { const ph = (t*1.3 + i*0.25) % 1, d = i % 2 ? 1 : -1; ell(hx + d*(58*s + 20 + ph*14), hy - 10 - ph*80, 10 + ph*14, 10 + ph*14); ctx.fillStyle = `rgba(255,255,255,${0.8 - ph*0.8})`; ctx.fill(); }
    const sp = (t*1.2) % 1; ell(hx + 40*s + 14, hy - 40*s + sp*60, 6, 9); ctx.fillStyle = '#6bb8f0'; ctx.fill();
  }
  // foreground: his back desk (hides his legs) and the lime chairs in front
  const dx0 = W*0.05, dy0 = H*0.765;
  ctx.fillStyle = '#e4e6ea'; rr(dx0 + 6, dy0 + 10, W*0.25 - 12, H*0.125, 4); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke();
  ctx.fillStyle = '#f7f7f9'; rr(dx0, dy0, W*0.25, H*0.03, 4); ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
  ctx.strokeStyle = '#3a3f4f'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(dx0 + 14, dy0 + H*0.13); ctx.lineTo(dx0 + 14, H*0.93); ctx.moveTo(dx0 + W*0.25 - 14, dy0 + H*0.13); ctx.lineTo(dx0 + W*0.25 - 14, H*0.93); ctx.stroke(); ctx.lineCap = 'butt';
  [0.12, 0.40, 0.88].forEach(f => s2Fan(W*f, H*0.915, 150, 120));
  fxMark('bang', x + 55*s, y - 200*s*sy, s2Tw(t, 2.4, 3.0));  // anime "!" when he is told to move up (Nichijou)

  // ---- speech ----
  const lTop = ly - 268*ls, nTop = y - 188*s*sy;
  if (t > 2.3 && t < 4.0) bubble(L.move, lx, lTop, 30, 330);
  if (t > 7.2 && t < 8.7) bubble(L.ping, x, nTop, 30, 330);
  if (t > 9.0 && t < 10.0) bubble(L.first, lx, lTop, 28, 300);
  if (t > 12.3 && t < 13.2) bubble(L.got, x - 40, nTop - 30, 30, 300);
  if (t > 13.9) bubble(L.praise, lx - 100, lTop, 28, 270);
}

// ====================================================================================
// The Chinese room in two halves around Tetris. Max, 12 Oct: "the tetris game is in chinese room. Liu lao shi is teaching when it
// happens, and then we go into tetris, afterwards liu lao shi tells nai long to go and sit in the front. and then we get the ping
// pong scene." "make sure nai long starts off at the second row of chairs and gets asked to stand at the front. before he asks
// ping pong wait a beat." The class from the back of the room: the board and Liu Lao Shi; the FRONT row (an empty white desk and
// two empty lime chairs); the SECOND row nearest us (Nailong and Jed at a white desk). "The front" = standing beside her at the board.
// ====================================================================================
function s2Seat(){
  return {lx: W*0.45, ly: H*0.775, ls: 0.78,          // Liu Lao Shi at the board
          nx: W*0.14, ny: H*0.87, ns: 0.78,           // Nailong, second row
          jx: W*0.265, jy: H*0.97, js: 0.72,          // Jed beside him
          fx: W*0.315, fy: H*0.675 + 67, fs: 0.56,   // the front: SITTING on the left lime chair of the front row (feet on its seat edge)
          ffy: H*0.80};                              // the floor by that chair (he walks up to it, then hops onto the seat)
}
// a chair's seat seen from the front (lime, like the fan backs) with its two front legs, drawn BEHIND whoever sits on it:
// their bottom sits on it, their feet hang in front of its edge (Max, 13 Oct: everyone seated sits ON a chair)
function s2SeatPad(cx, top, w, legTo){
  const th = Math.max(10, w*0.12);
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = '#8a8f99'; ctx.lineWidth = Math.max(4, w*0.05);
  ctx.beginPath(); ctx.moveTo(cx - w*0.36, top + th - 2); ctx.lineTo(cx - w*0.42, legTo); ctx.moveTo(cx + w*0.36, top + th - 2); ctx.lineTo(cx + w*0.42, legTo); ctx.stroke();
  rr(cx - w/2, top, w, th, 6); ctx.fillStyle = '#a7cb3f'; ctx.fill(); ctx.lineWidth = Math.max(3, w*0.035); ctx.strokeStyle = C.line; ctx.stroke();
  ctx.fillStyle = '#8fb02e'; rr(cx - w/2 + 5, top + th - 5, w - 10, 3, 1); ctx.fill();
  ctx.restore();
}
function s2FrontRow(){
  const top = H*0.655, x0 = W*0.285, x1 = W*0.44;
  ctx.save(); ctx.strokeStyle = '#3a3f4f'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); for (const x of [x0 + 10, x1 - 10]) { ctx.moveTo(x, top + 10); ctx.lineTo(x, H*0.74); } ctx.stroke();
  ctx.fillStyle = '#f7f7f9'; rr(x0, top, x1 - x0, 13, 3); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke();
  ctx.restore();
  [0.315, 0.405].forEach(f => { s2Fan(W*f, H*0.675, 84, 64); s2SeatPad(W*f, H*0.675 + 55, 78, H*0.80); });   // drawn after her: she is behind it
}
// the second row's lime chairs, behind Nailong and Jed (Max, 13 Oct: "they aren't sitting on chairs"); drawn before them
function s2BackChairs(){
  const S = s2Seat();
  s2Fan(S.nx, S.ny - 128, 150, 100); s2SeatPad(S.nx, S.ny - 26*S.ns, 120, S.ny + 16);
  s2Fan(S.jx, S.jy - 158, 140, 96);  s2SeatPad(S.jx, S.jy - 72*S.js, 112, H + 6);
}
// Jed's phone in close-up (Max, 13 Oct: "we can't actually see what Jed's doing from that angle"): a white comic panel up on
// the right with the phone big inside it, dashed lines back to the real phone (tip = its centre), so the Tetris is readable.
// k 0..1 pops it in, a fades it.
function s2Closeup(tip, k, a, rows, fast, rot){
  if (k <= 0.001 || a <= 0.001) return;
  const cx = W*0.625, cy = H*0.385, pw = 340, ph = 236, sc = fxBack(k), psc = 0.4;   // landscape: Jed's MacBook
  ctx.save(); ctx.globalAlpha = a;
  ctx.setLineDash([10, 8]); ctx.lineCap = 'round';
  for (const [dx, dy] of [[-pw/2, ph/2 - 20], [-pw/2, -ph/2 + 20]]) {
    for (const [col, lw] of [[C.line, 7], ['#fff', 3]]) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(tip[0], tip[1]); ctx.lineTo(cx + dx*sc, cy + dy*sc); ctx.stroke(); }
  }
  ctx.setLineDash([]);
  ctx.translate(cx, cy); ctx.scale(sc, sc);
  ctx.fillStyle = 'rgba(29,22,64,.35)'; rr(-pw/2 + 8, -ph/2 + 10, pw, ph, 22); ctx.fill();
  ctx.fillStyle = '#fff'; rr(-pw/2, -ph/2, pw, ph, 22); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.line; ctx.stroke();
  ctx.restore();
  ctx.save(); ctx.globalAlpha = a; ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
  s2Phone(cx, cy, psc, rot, rows, fast);
  ctx.restore();
}
function s2BackDesk(){
  const top = H*0.80, x0 = W*0.035, x1 = W*0.36;
  ctx.save(); ctx.strokeStyle = '#3a3f4f'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); for (const x of [x0 + 16, x1 - 16]) { ctx.moveTo(x, top + 16); ctx.lineTo(x, H + 10); } ctx.stroke();
  ctx.fillStyle = '#f7f7f9'; rr(x0, top, x1 - x0, 18, 4); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
  ctx.restore();
}
// faces painted over his own (his local space, like s2FaceDraw): smug half-lids, the shock, the sad frown, thinking brows
function s2Smug(){
  ctx.save(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.fillStyle = C.y; ctx.lineCap = 'round';
  for (const ex of [-25, 25]) {
    ctx.beginPath(); ctx.moveTo(ex - 17, -138); ctx.arc(ex, -140, 17, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(ex - 15, -139); ctx.lineTo(ex + 15, -139); ctx.stroke();
  }
  ctx.restore();
}
function s2Shock(tt){
  ctx.save(); s2Wipe();
  const j = Math.sin(tt*40)*1.2;
  s2Eye(-24, -140, 18, j, 3, 4); s2Eye(24, -140, 18, j, 3, 4);
  ell(0, -101, 14, 17); ctx.fillStyle = C.mouth; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
  ctx.restore();
  ctx.save(); ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-42, -164); ctx.lineTo(-12, -170); ctx.moveTo(42, -164); ctx.lineTo(12, -170); ctx.stroke(); ctx.restore();
}
function s2SadFace(){
  ctx.save(); ell(0, -130, 43, 40); ctx.clip(); ctx.fillStyle = C.y; ctx.fillRect(-34, -124, 68, 26); ctx.restore();
  ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -94, 17, Math.PI + 0.35, Math.PI*2 - 0.35); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-42, -162); ctx.lineTo(-12, -172); ctx.moveTo(42, -162); ctx.lineTo(12, -172); ctx.stroke();
}
function s2ThinkBrows(){ ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(-42, -170); ctx.lineTo(-12, -166); ctx.moveTo(42, -174); ctx.lineTo(12, -166); ctx.stroke(); }
// Liu Lao Shi teaching: writes on the board, turns to the class and points at the card, writes again (period 3.6 s)
function s2Teach(t, lo){
  const ph = t % 3.6, w = ph < 1.6 ? 1 : ph < 1.95 ? 1 - ease((ph - 1.6)/0.35) : ph < 3.25 ? 0 : ease((ph - 3.25)/0.35);
  lo.aR = lerp(0.2, 2.3 + Math.sin(t*13)*0.16, w); lo.aL = lerp(1.9, 0.15, w);
  lo.look = w > 0.5 ? [0.9, -0.5] : [-0.7, 0.2];
  lo.mouth = w < 0.5 && Math.sin(t*18) > 0 ? 'open' : 'smile';
}

// ---------- Jed's phone: the same phone as games/tetris.js (blue case, black bezel, navy screen, HOLD / board / NEXT), drawn at the
// game's full size around its centre and scaled down, so the zoom at the end of clip A lands on the Tetris game's phone ----------
const S2_TCOL = {I: '#5ad2f0', O: '#FFD21F', T: '#b072e0', S: '#6cc24a', Z: '#e8423b', J: '#3a7bd5', L: '#f59a2f'};
const S2_STACK = ['J......S.I', 'JJJ..TSS.I', 'OO.LTTTSZI', 'OOLLL.ZZ.I'];      // the bottom four rows of Jed's game
const S2_FALL = [['T', [[0, 0], [-1, 1], [0, 1], [1, 1]], 4], ['S', [[0, 0], [1, 0], [-1, 1], [0, 1]], 6], ['L', [[1, 0], [-1, 1], [0, 1], [1, 1]], 2],
                 ['I', [[-1, 1], [0, 1], [1, 1], [2, 1]], 4], ['Z', [[-1, 0], [0, 0], [0, 1], [1, 1]], 6], ['O', [[0, 0], [1, 0], [0, 1], [1, 1]], 3]];
// the half-height well (games/tetris.js, Max 13 Oct: "half the amount of space"): 10 rows; the stack fills rows 6 to 9
const S2_VIS = 10, S2_TOP = S2_VIS - 6, S2_LAND = S2_TOP + 2;
const S2_CYC = S2_LAND + 2;                          // rows per piece: from above the board onto the stack, then a rest of 2
function s2Tile(x, y, cs, col, lw){
  const p = cs*0.06;
  rr(x + p, y + p, cs - 2*p, cs - 2*p, cs*0.22); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = C.line; ctx.stroke();
  rr(x + cs*0.2, y + cs*0.17, cs*0.34, cs*0.12, cs*0.06); ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fill();
}
// (cx, cy) = the phone's centre, sc = its scale (1 = its size in the Tetris game), rows = rows fallen so far in Jed's game,
// fast = the speed-up (a light trail behind the falling piece)
function s2Phone(cx, cy, sc, rot, rows, fast){
  if (typeof tMacGeom !== 'function') return;
  const L = LINES_SCHOOL2.chinese, k = v => Math.max(v, 2.4/sc), g = tMacGeom(), SX = g.SX, SY = g.SY, SW = TM.SW;
  const Lo = tMacLayout(SX, SY), CS = 30, BW = CS*10, BH = CS*S2_VIS, BX = Lo.BX, BY = Lo.BY, colW = Lo.cw, LX = Lo.LX, RX = Lo.RX;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(sc, sc); ctx.lineJoin = 'round';
  tMacBody(k(4));
  tMacBar(SX, SY, SW, L.phoneTime);
  ctx.fillStyle = '#120d2e'; rr(BX - 5, BY - 5, BW + 10, BH + 10, 8); ctx.fill(); ctx.lineWidth = k(4); ctx.strokeStyle = '#4b4380'; ctx.stroke();
  const tl = k(2.8);
  S2_STACK.forEach((row, i) => { for (let c = 0; c < 10; c++) if (row[c] !== '.') s2Tile(BX + c*CS, BY + (S2_VIS - 4 + i)*CS, CS, S2_TCOL[row[c]], tl); });
  const n = Math.floor(rows/S2_CYC), q = rows - n*S2_CYC, [type, cells, col] = S2_FALL[n % S2_FALL.length];
  const top = Math.min(Math.floor(q) - 2, S2_TOP), dxs = cells.map(c => c[0]);
  ctx.save(); ctx.beginPath(); ctx.rect(BX - 2, BY, BW + 4, BH + 2); ctx.clip();
  if (fast && top > 0) { ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(BX + (col + Math.min(...dxs))*CS, BY, (Math.max(...dxs) - Math.min(...dxs) + 1)*CS, (top + 1)*CS); }
  for (const [dx, dy] of cells) s2Tile(BX + (col + dx)*CS, BY + (top + dy)*CS, CS, S2_TCOL[type], tl);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,.12)'; rr(BX, BY + BH + 12, BW, 30, 15); ctx.fill(); ctx.lineWidth = k(3); ctx.strokeStyle = C.line; ctx.stroke();
  if (typeof tPad === 'function') tPad(Lo.padXs, Lo.padY, Lo.padR);   // the on-screen buttons, as in the game
  ctx.restore();
}
// where Jed's MacBook sits: open on the second row's desk between him and Nailong (pJ), turned out to Nailong as Jed offers it
// (pO), slid over in front of Nailong (pN); sc = its size there (the game draws it at 1)
function s2MacSpots(S){
  const sc = 62/668, y = H*0.80 - (typeof TM === 'object' ? TM.TH : 482)*sc/2 + 3, mid = (S.nx + S.jx)/2;   // small: both faces stay clear
  return {sc, pJ: [mid + 7, y], pO: [mid + 4, y], pN: [mid + 1, y]};
}
// the moments a piece lands in Jed's game (a soft tick each), worked out once
function s2Lands(rowsAt, t0, t1){
  const out = []; let prev = Math.floor((rowsAt(t0) - S2_LAND)/S2_CYC);
  for (let t = t0; t <= t1; t += 0.004) { const k = Math.floor((rowsAt(t) - S2_LAND)/S2_CYC); if (k !== prev) out.push(t); prev = k; }
  return out;
}

// ---------- clip A: THE RIDE OPENS HERE. Max threw Nailong down at the end of the intro: he falls through the ROOF of the Chinese
// room (the ceiling creaks and cracks, bursts, bits of it and dust come down with him, the hole stays), screaming, head first,
// and lands on his head in the SECOND row (thud, legs kicking, dizzy). Liu Lao Shi keeps writing and never notices.
// Then Jed's Tetris; WHY'S IT SO FAST; zoom into the phone (into games/tetris.js) ----------
// Max: "With tetris, Nai long starts off telling Jed it's easy, and then Jed says, oh, do you want to try Nailong? and when Nailong
// gets it suddenly it speeds up a lot. WHYS IT SO FAST!!??" "Nai long sees Jed playing tetris."
const CH_A = {creak: 0.12, fly: 0.75, land: 1.5, pop: 2.6, sit: 2.95, dizzyEnd: 4.2,
              see: 4.7, easy: 5.4, easyEnd: 7.5, jed: 7.8, offer: 8.9, jedEnd: 10.2, take: 10.2, grab: 10.7, fast: 11.7, why: 12.0, zoom: 14.3};
const CH_A_DUR = 15.7;                                      // scene seconds (22.4 s real); Jed's offer stays up 3.3 s real
const S2_GSLOW = 0.12, S2_GFAST = 0.03;                    // Jed's game: seconds per row, then the sudden speed-up
const s2RowsA = t => 9 + (t < CH_A.fast ? t/S2_GSLOW : CH_A.fast/S2_GSLOW + (t - CH_A.fast)/S2_GFAST);
const CH_A_SFX = [
  [0.15, 'squeak', {g: 0.45}], [1.95, 'squeak', {g: 0.4}], [3.3, 'squeak', {g: 0.45}],                     // her marker: she never stops writing
  ...[0, 1, 2].map(i => [CH_A.dizzyEnd + 0.25 + i*3.6, 'squeak', {g: 0.45}]),
  ...s2Lands(s2RowsA, 0, CH_A.zoom).map(t => [t, 'tick', {p: 1.5, g: 0.3}]),          // a piece lands on the phone
  [CH_A.creak, 'clink', {p: 0.5, g: 0.4}], [CH_A.fly - 0.3, 'scream'],                                       // the ceiling creaks, a scream from above
  [CH_A.fly, 'crash', {p: 1.3}], [CH_A.fly, 'thud', {p: 0.6, g: 0.6}], [CH_A.fly + 0.15, 'whoosh', {p: 0.9}],   // through the ceiling
  [CH_A.land, 'thud', {p: 0.8}], [CH_A.land, 'crash', {g: 0.6}], [CH_A.land + 0.12, 'oof'],                 // head first into his seat
  ...[0, 1, 2].map(i => [CH_A.land + 0.45 + i*0.3, 'squeak', {p: 1.6 + i*0.1, g: 0.35}]),                  // legs kicking in the air
  [CH_A.pop, 'boing'], [CH_A.sit, 'thud', {p: 1.4, g: 0.5}], [CH_A.sit + 0.05, 'dizzy'], [CH_A.dizzyEnd - 0.3, 'swish', {p: 1.6, g: 0.6}],
  [CH_A.see, 'pop', {p: 1.2}], [CH_A.offer, 'swish', {p: 1.2, g: 0.6}], [CH_A.take, 'zip'], [CH_A.grab, 'pop'],
  [CH_A.grab + 0.15, 'typing'], [CH_A.grab + 0.6, 'typing'],
  [CH_A.fast, 'buzz'], [CH_A.fast + 0.05, 'boing', {p: 1.3}], [CH_A.why, 'scream'], [CH_A.zoom, 'whoosh'],
];
// the drop: straight down through the ceiling above his seat, head first (upside down), speeding up as he falls.
// Returns the body centre, the turn, the size, how far (k), the path (at) and the direction (v), like the old flight.
function s2FlyA(t, S){
  const k = s2Tw(t, CH_A.fly, CH_A.land), y0 = -70, y1 = S.ny + 8 - 90*S.ns, yAt = q => lerp(y0, y1, q*q);
  return {x: S.nx, y: yAt(k), rot: Math.PI, s: S.ns, k, at: q => [S.nx, yAt(clamp(q, -0.6, 1))], v: [0, 1]};
}
// the hole he leaves in the ceiling above his seat: k 0..1 opens it, age = scene s since it burst (a broken tile swings)
const S2_HOLE = [[-88, 0], [-82, 24], [-64, 36], [-70, 56], [-44, 60], [-30, 80], [-8, 68], [10, 88], [28, 66], [48, 74], [60, 50], [80, 46], [90, 0]];
function s2Hole(hx, k, age){
  if (k <= 0.001) return;
  ctx.save(); ctx.lineJoin = 'round';
  ctx.beginPath(); S2_HOLE.forEach(([dx, dy], i) => { const px = hx + dx*(0.4 + 0.6*k), py = dy*k; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.closePath();
  ctx.fillStyle = '#2a2431'; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = '#9fd6ff'; ctx.fillRect(hx - 30, 0, 64, 22);                               // a patch of sky through the roof
  ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(hx - 95, 30); ctx.lineTo(hx + 95, 14); ctx.stroke();   // a roof beam
  ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(hx - 40, -5); ctx.lineTo(hx - 52, 90); ctx.stroke();
  ctx.restore();
  ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
  // a broken ceiling tile hanging off the edge, still swinging
  const sw = 0.5 + 0.35*Math.exp(-age*2.2)*Math.sin(age*9);
  ctx.save(); ctx.translate(hx + 58*k, 50*k); ctx.rotate(sw*k);
  ctx.fillStyle = '#e1e2e7'; rr(-4, 0, 34, 46, 3); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke(); ctx.restore();
  // cracks running out from the hole
  ctx.strokeStyle = C.line; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  for (const [a, b, c2] of [[[-88, 10], [-120, 18], [-138, 8]], [[90, 8], [118, 22], [136, 14]], [[-44, 60], [-58, 78], [-52, 94]]]) {
    ctx.beginPath(); ctx.moveTo(hx + a[0]*k, a[1]*k); ctx.lineTo(hx + b[0]*k, b[1]*k); ctx.lineTo(hx + c2[0]*k, c2[1]*k); ctx.stroke(); }
  ctx.restore();
}
// the bits of ceiling that come down with him: each falls from the hole, spins, and lies on the floor. falling = true draws the
// ones still in the air (on top of everything), false the ones already lying on the floor (behind the desks)
function s2Debris(hx, age, falling){
  if (age <= 0) return;
  for (let i = 0; i < 10; i++) {
    const vx = (i - 4.5)*46 + ((i*37) % 11 - 5)*6, vy = 40 + (i % 4)*40, floorY = H*0.885 + (i % 3)*16, g = 1700;
    const tl = (-vy + Math.sqrt(vy*vy + 2*g*(floorY - 40)))/g, a = Math.min(age, tl), down = age >= tl;
    if (down === falling) continue;
    const x = hx + (i - 4.5)*14 + vx*a, y = 40 + vy*a + 0.5*g*a*a, sz = 12 + (i*7) % 14, r = (i % 2 ? 1 : -1)*(3 + i)*a + i;
    ctx.save(); ctx.translate(x, y); ctx.rotate(down ? (i % 2 ? 0.2 : -0.15) : r);
    ctx.fillStyle = i % 3 ? '#e1e2e7' : '#c8cad2'; rr(-sz/2, -sz*0.35, sz, sz*0.7, 2); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke(); ctx.restore();
  }
}
// dust: a puff out of the hole as it bursts, then a few specks drifting down for a while
function s2Dust(hx, age){
  if (age <= 0) return;
  const k = clamp(age/1.3, 0, 1);
  if (k < 1) for (let i = 0; i < 7; i++) { const a = -0.2 + i*0.55, r = (18 + i*3)*(0.7 + k*1.4);
    ell(hx + Math.cos(a)*(30 + k*120), 40 + Math.abs(Math.sin(a))*k*90 + k*30, r, r*0.8); ctx.fillStyle = `rgba(236,233,226,${0.85*(1 - k)})`; ctx.fill(); }
  if (age < 4) for (let i = 0; i < 8; i++) { const ph = (age*0.6 + i*0.131) % 1, sx = hx - 60 + ((i*53) % 120);
    ctx.fillStyle = `rgba(200,196,188,${0.8*(1 - ph)*(1 - age/4)})`; ctx.fillRect(sx + Math.sin(age*3 + i)*6, 60 + ph*H*0.5, 4, 4); }
}
// feet from a body centre: nailong() turns about his feet, so a spin or a head-first dive is worked out round his middle
const s2Feet = (cx, cy, rot, s) => [cx - Math.sin(rot)*88*s, cy + Math.cos(rot)*88*s];
// dizzy face (his local space): swirl eyes, wobbly mouth
function s2Swirl(x, y, r, rot){
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
  for (let i = 0; i <= 40; i++) { const a = i/40*Math.PI*4, q = r*i/40; i ? ctx.lineTo(Math.cos(a)*q, Math.sin(a)*q) : ctx.moveTo(0, 0); }
  ctx.strokeStyle = C.line; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore();
}
function s2Dizzy(tt){
  ctx.save(); s2Wipe();
  for (const ex of [-25, 25]) { ell(ex, -140, 15, 15); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke(); s2Swirl(ex, -140, 12, tt*9*(ex < 0 ? 1 : -1)); }
  ctx.beginPath(); for (let i = 0; i <= 12; i++) { const px = -16 + i*32/12, py = -108 + Math.sin(i*1.4 + tt*10)*3.5; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.lineCap = 'round'; ctx.stroke();
  ctx.restore();
}
// a little 5-point star (dizzy stars, sparkles)
function s2Star(x, y, r, rot, fill = '#ffe14d'){
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI/2 + i*Math.PI/5, q = i % 2 ? r*0.45 : r; ctx.lineTo(Math.cos(a)*q, Math.sin(a)*q); }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
}
// a music note (she hums while she writes)
function s2Note(x, y, s, rot){
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(8, -34); ctx.lineTo(24, -28); ctx.stroke();
  ell(0, 2, 9, 6.5, -0.4); ctx.fillStyle = C.line; ctx.fill(); ctx.restore();
}
// the impact: a white star burst with a dark outline, k 0..1
function s2Burst(x, y, r, k){
  ctx.save(); ctx.globalAlpha = 1 - k; ctx.beginPath();
  for (let i = 0; i < 18; i++) { const a = i*Math.PI/9 + 0.15, q = i % 2 ? r*0.5 : r; ctx.lineTo(x + Math.cos(a)*q, y + Math.sin(a)*q*0.75); }
  ctx.closePath(); ctx.fillStyle = '#fff6b0'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.line; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
}
function sceneChineseA(t){
  const L = LINES_SCHOOL2.chinese, S = s2Seat(), A = CH_A, fast = t > A.fast;
  s2Cues('chA', t, CH_A_SFX);
  const z = ease(s2Tw(t, A.zoom, CH_A_DUR));               // the zoom into the phone at the end
  const lk = t - A.land, bk = t - A.fly, shake = (lk > 0 && lk < 0.55 ? Math.sin(t*80)*12*(1 - lk/0.55) : 0)   // the room shakes as he lands
    + (bk > 0 && bk < 0.35 ? Math.sin(t*90)*7*(1 - bk/0.35) : 0);                                                  // and as the ceiling bursts
  const jj = 26*s2Pulse(t, A.land, A.land + 0.3);         // Jed (and his phone) jump at the thud
  // Jed's MacBook: open on the desk in front of him, turned out to Nailong, slid over in front of Nailong
  const MS = s2MacSpots(S), pJ = MS.pJ, pO = MS.pO, pN = MS.pN;
  let ph = [pJ[0], pJ[1] - jj*0.5], prot = 0;
  if (t > A.offer && t < A.take) { const k = ease(s2Tw(t, A.offer, A.offer + 0.5)); ph = [lerp(pJ[0], pO[0], k), pJ[1]]; prot = -0.05*k; }
  else if (t >= A.take) { const k = ease(s2Tw(t, A.take, A.grab)); ph = [lerp(pO[0], pN[0], k), pN[1] - Math.sin(Math.PI*k)*8]; prot = lerp(-0.05, 0, k); }
  if (fast) { ph = [ph[0] + Math.sin(t*47)*2.2, ph[1] + Math.cos(t*53)*1.6]; prot += Math.sin(t*61)*0.05; }

  ctx.save();
  if (z > 0) { const m = lerp(1, 2.6, z); ctx.translate(pN[0], pN[1]); ctx.scale(m, m); ctx.translate(-pN[0], -pN[1]); }
  if (shake) { ctx.fillStyle = '#ecebe6'; ctx.fillRect(0, 0, W, H*0.70); ctx.fillStyle = '#585d70'; ctx.fillRect(0, H*0.70, W, H*0.30); }   // no gap at the edge while it shakes
  ctx.translate(shake, shake*0.4);
  s2Room(t);
  // the ceiling above his seat: it creaks and cracks (a muffled scream from above), bursts, and the hole stays
  const hx = S.nx;
  if (t > A.creak && t < A.fly) { const c = s2Tw(t, A.creak, A.fly), jit = Math.sin(t*70)*2*c;
    ctx.save(); ctx.strokeStyle = C.line; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) { const a = 0.35 + i*0.6, r = 12 + 50*c; ctx.beginPath(); ctx.moveTo(hx + jit, 18); ctx.lineTo(hx + jit + Math.cos(a)*r*0.6 + 6, 18 + Math.sin(a)*r*0.35); ctx.lineTo(hx + jit + Math.cos(a)*r, 18 + Math.sin(a)*r*0.55); ctx.stroke(); }
    ctx.restore();
    for (let i = 0; i < 6; i++) { const ph = (t*1.7 + i*0.17) % 1; ctx.fillStyle = `rgba(200,196,188,${c*(1 - ph)})`; ctx.fillRect(hx - 40 + i*15, 40 + ph*160, 4, 4); }
  }
  s2Hole(hx, ease(s2Tw(t, A.fly, A.fly + 0.12)), t - A.fly);
  s2Debris(hx, t - A.fly, false);                              // the bits already on the floor
  // Liu Lao Shi: back to the class, writing and humming through the whole crash; then teaching as usual (she never notices)
  const lo = {mouth: 'smile', look: [0.5, 0], aL: 0.15, aR: 0.2, marker: true, pony: Math.sin(t*3)*0.1, slip: 0, blink: (t % 3.2) < 0.12 ? 1 : 0};
  if (t < A.dizzyEnd) { lo.aR = 2.3 + Math.sin(t*13)*0.16; lo.aL = 0.15; lo.look = [0.9, -0.5]; }
  else s2Teach(t - A.dizzyEnd, lo);
  liuLaoShi(S.lx, S.ly, S.ls, lo);
  if (t > A.land && t < A.dizzyEnd + 0.4) for (let i = 0; i < 2; i++) {      // la la la
    const a = ((t - A.land)*0.8 + i*0.5) % 1; ctx.save(); ctx.globalAlpha = Math.min(1, (A.dizzyEnd + 0.4 - t)/0.4)*(1 - a);
    s2Note(S.lx + 50 + i*30, S.ly - 280*S.ls - a*60, 0.75, 0.2*i); ctx.restore();
  }
  s2FrontRow();
  s2BackChairs();
  // ---- Nailong ----
  let x = S.nx, y = S.ny, s = S.ns, sx = 1, sy = 1 + Math.sin(t*2)*0.015, rot = 0, face = null, here = true;
  const o = {mouth: 'smile', arms: 'down', look: [Math.sin(t*1.3)*0.7, -0.4 + Math.sin(t*0.8)*0.3]};
  const F = s2FlyA(t, S);
  if (t < A.fly) here = false;                              // the empty spot: he is still on his way
  else if (t < A.land) {                                     // the flight, head first, stretched along the curve
    s = F.s; rot = F.rot; sx = 0.88; sy = 1.14; [x, y] = s2Feet(F.x, F.y, rot, s);
    o.arms = 'up'; o.flail = t*22; o.mouth = 'open'; o.look = [0, -1];
  } else if (t < A.pop) {                                    // stuck on his head, legs kicking, the squash rings out
    const d = Math.exp(-lk*7)*Math.cos(lk*26);
    sy = 1 - 0.3*d; sx = 1 + 0.2*d; rot = -Math.PI + Math.sin(t*15)*0.06*(lk > 0.3 ? 1 : 0);
    x = S.nx + Math.sin(t*15)*3; y = S.ny + 8 - 178*s*sy;
    o.walk = t*24; o.arms = 'up'; o.flail = t*12; o.mouth = 'open'; o.look = [Math.sin(t*9), 1];
  } else if (t < A.sit) {                                    // springs out with a back flip into his seat
    const k = ease(s2Tw(t, A.pop, A.sit)), c0 = [S.nx, S.ny + 8 - 90*s], c1 = [S.nx, S.ny - 88*s];
    rot = lerp(-Math.PI, -2*Math.PI, k); [x, y] = s2Feet(lerp(c0[0], c1[0], k), lerp(c0[1], c1[1], k) - Math.sin(Math.PI*k)*110, rot, s);
    o.arms = 'up'; o.flail = t*18; o.mouth = 'o';
  } else if (t < A.dizzyEnd) {                               // dizzy in his seat
    const q = s2Pulse(t, A.sit, A.sit + 0.25); sy = 1 - 0.16*q; sx = 1 + 0.1*q;
    rot = Math.sin(t*5)*0.08; face = 'dizzy';
    if (t > A.dizzyEnd - 0.35) { face = null; x += Math.sin(t*55)*5; o.look = [Math.sin(t*40), 0]; o.mouth = 'o'; }   // shakes it off
  }
  if (t > A.see) { o.look = [1, 0.9]; const q = s2Pulse(t, A.see, A.see + 0.3); sy += 0.12*q; sx -= 0.06*q; y -= 12*q; }
  if (t > A.see + 0.2 && t < A.take) rot = 0.1*ease(s2Tw(t, A.see + 0.2, A.see + 0.6));          // leans over to look
  if (t > A.easy && !fast) face = 'smug';
  if (t > A.easyEnd && t < A.take) o.look = [1, 0.1];                                             // at Jed while he talks
  if (t > A.take - 0.1 && t < A.grab) { o.arms = 'up'; o.flail = t*8; rot = 0.1*(1 - s2Tw(t, A.take, A.grab)); }
  if (t > A.grab && !fast) o.look = [0.2, 1];                                                     // eyes on the game
  if (fast) {
    face = 'shock'; o.mouth = 'open'; o.look = [0.2, 1];
    const q = s2Pulse(t, A.fast, A.fast + 0.35); y -= 34*q; sy += 0.18*q; sx -= 0.08*q;
    if (t > A.why) { x += Math.sin(t*38)*2.5; rot = Math.sin(t*9)*0.05; o.arms = 'up'; o.flail = t*16; }
  }
  // speed lines behind him in the air
  if (t > A.fly && t < A.land) {
    const vl = Math.hypot(F.v[0], F.v[1]) || 1, ux = F.v[0]/vl, uy = F.v[1]/vl;
    ctx.save(); ctx.strokeStyle = 'rgba(74,47,12,.45)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (const off of [-1, -0.35, 0.35, 1]) { const bx = F.x - ux*95*F.s - uy*off*48*F.s, by = F.y - uy*95*F.s + ux*off*48*F.s, len = (90 + 40*Math.abs(off))*F.s;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx - ux*len, by - uy*len); ctx.stroke(); }
    ctx.restore();
  }
  if (here) s2NL(x, y, s, Object.assign(o, {sx, sy, rot}), face === 'smug' ? s2Smug : face === 'shock' ? () => s2Shock(t) : face === 'dizzy' ? () => s2Dizzy(t) : null);
  // Jed beside him, his phone under the desk: jumps at the thud, looks at Nailong, at her (she did not see it?), back to his game
  const jo = {mouth: 'smile', look: [0.1, 1]};
  if (t > A.fly && t <= A.land) { jo.look = [-0.6, -1]; jo.mouth = 'o'; }                     // the ceiling!
  if (t > A.land && t < A.land + 1.9) { jo.look = [-1, 0.4]; jo.mouth = 'o'; }
  else if (t >= A.land + 1.9 && t < A.land + 2.6) jo.look = [0.8, -0.7];
  if (t > A.easy + 0.5) jo.look = [-1, 0];
  if (t > A.jed && t < A.jedEnd - 0.2) jo.mouth = Math.sin(t*16) > 0 ? 'o' : 'smile';
  if (t > A.grab) jo.look = [-0.9, 0.5];
  if (fast) jo.mouth = 'o';
  person(S.jx, S.jy - jj, S.js, CAST.jed, jo);
  s2BackDesk();
  s2Debris(hx, t - A.fly, true);                               // the bits still falling, in front of everything
  s2Dust(hx, t - A.fly);
  if (bk > 0 && bk < 0.35) s2Burst(hx, 34, 50 + bk*150, bk/0.35);
  // the landing: burst, dust along the floor, THUD!, an "!" over Jed
  if (lk > 0 && lk < 0.45) s2Burst(S.nx, S.ny - 10, 70 + lk*160, lk/0.45);
  if (lk > 0 && lk < 0.9) { const k = lk/0.9;
    for (let i = 0; i < 8; i++) { const d = i % 2 ? 1 : -1, sp = 1 + (i >> 1)*0.35, r = (16 + i*2)*(0.6 + k);
      ell(S.nx + d*(30 + k*110*sp), S.ny + 4 - k*(20 + (i >> 1)*12), r, r*0.75); ctx.fillStyle = `rgba(236,233,226,${0.9*(1 - k)})`; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = `rgba(74,47,12,${0.6*(1 - k)})`; ctx.stroke(); } }
  if (lk > 0 && lk < 1.0) { const k = lk/1.0; ctx.save(); ctx.globalAlpha = 1 - k*k; ctx.translate(S.nx + 150, S.ny - 230 - k*40); ctx.rotate(-0.12);
    title(L.thud, 0, 0, 64*(1 + 0.3*(1 - Math.min(1, lk/0.15))), '#fff'); ctx.restore(); }
  fxMark('bang', S.jx + 40*S.js, S.jy - 285*S.js - jj, s2Tw(t, A.land + 0.05, A.land + 1.0), 0.8);
  // dizzy stars round his head
  if (t > A.sit && t < A.dizzyEnd - 0.35) for (let i = 0; i < 3; i++) { const a = t*5 + i*Math.PI*2/3;
    s2Star(x + Math.cos(a)*62*s, y - 192*s + Math.sin(a)*14*s, 11, a); }
  fxMark('bang', x + 50*s, y - 195*s, s2Tw(t, A.see, A.see + 0.7), 0.8);
  if (fast) fxMark('sweat', x + 64*s, y - 170*s, s2Tw(t, A.fast + 0.1, A.fast + 1.3));
  // his scream: muffled above the ceiling before it bursts, then trailing above him as he drops (like the intro's AAAA)
  const scr = (txt, y, size, a) => { font(size); const w = ctx.measureText(txt).width;
    ctx.save(); ctx.globalAlpha = a; title(txt, Math.max(hx + 70 + w/2, w/2 + 14), y, size, '#fff'); ctx.restore(); };
  if (t > A.creak && t < A.fly) { const c = s2Tw(t, A.creak, A.fly); scr(L.scream.slice(0, 3 + Math.floor(c*6)), 30, 22 + 14*c, 0.4 + 0.6*c); }
  if (t > A.fly && t < A.land + 0.12) {
    const ty = clamp(F.y - 30, 150, H*0.62), n = 9 + Math.floor(F.k*10);                       // beside him, below the hole
    scr(L.scream.slice(0, n), ty, lerp(54, 42, F.k), t < A.land ? 1 : 1 - (t - A.land)/0.12);
  }
  // the close-up of Jed's game, under the bubbles: from when Nailong spots it until the zoom takes over
  s2Closeup(ph, ease(s2Tw(t, A.see + 0.1, A.see + 0.4)), 1 - ease(s2Tw(t, A.zoom, A.zoom + 0.3)), s2RowsA(t), fast, prot*0.5);
  // speech (the bubbles are gone before the zoom starts)
  const nTop = y - 190*s*sy, jTop = S.jy - 272*S.js - 8;
  if (t > A.easy && t < A.easyEnd) bubble(L.easy, x + 10, nTop, 30, 300);
  if (t > A.jed && t < A.jedEnd) bubble(L.try, S.jx, jTop, 28, 300);
  if (t > A.why && t < A.zoom) bubble(L.fast, x + 20, nTop - 6, 38, 360);
  ctx.restore();
  // the MacBook, on top of everything: on the desk, then up to fill the screen exactly where the Tetris game draws it
  const sc0 = MS.sc, sc = Math.exp(lerp(Math.log(sc0), 0, z)), MC = typeof tMacC === 'function' ? tMacC() : [W/2, H/2 + 34];
  if (z > 0) { ctx.fillStyle = `rgba(29,22,64,${0.35*z})`; ctx.fillRect(0, 0, W, H); }
  s2Phone(lerp(ph[0] + shake, MC[0], z), lerp(ph[1] + shake*0.4, MC[1], z), sc, prot*(1 - z), s2RowsA(t), fast);
}

// ---------- clip B: she noticed. "move to the front", the sad walk, a pause, ping pong?, the hard problem (into games/pingpong.js) ----------
// Max, 13 Oct: "Liu lao shi first says, What?? then No!. and after she says no loudly she waits, maybe after you solve this."
// what 1.7 s real, No! 1.7 s (thud, shake), the held pause 1.6 s, "Maybe after you solve this." 3.0 s while she writes the problem
const CH_B = {notice: 0.7, move: 1.2, bang: 1.3, give: 1.9, moveEnd: 3.4, up: 3.4, walk: 3.7, arrive: 5.9, ping: 7.7, pingEnd: 9.6,
              what: 9.8, slip: 9.8, whatEnd: 11.0, no: 11.2, noEnd: 12.4,
              first: 13.5, firstEnd: 15.6, think: 15.6, squash: 17.9, got: 18.2, gotEnd: 20.1, down: 19.2, climb: 19.5, praise: 20.2};
const CH_B_DUR = 22.8;                                      // scene seconds (32.6 s real)
// the pause Max asked for: the rain cloud is full at arrive + 0.7, "Can I play ping pong?" comes at ping (1.1 scene s = 1.6 s real later)
const S2_PROB_B = {q: [CH_B.first + 0.1, CH_B.first + 1.0], a: [CH_B.got + 0.4, CH_B.got + 1.2], s: [CH_B.got + 1.0, CH_B.got + 1.9]};
const s2RowsB = t => 4 + t/S2_GSLOW;
const CH_B_SFX = [
  [0.25, 'squeak', {g: 0.45}], [CH_B.notice, 'swish', {p: 1.3, g: 0.5}], [CH_B.notice + 0.12, 'clink', {p: 1.4, g: 0.6}],
  [CH_B.bang, 'boing', {p: 1.2}], [CH_B.give, 'zip'], [CH_B.give + 0.4, 'tick', {p: 1.4, g: 0.5}],
  [CH_B.up, 'swish', {p: 0.6}],                                                       // his chair scrapes back
  ...[0, 1, 2, 3, 4, 5, 6].map(i => [CH_B.walk + 0.15 + i*0.31, 'tick', {p: 0.8, g: 0.45}]),   // footsteps
  [CH_B.arrive + 0.05, 'sad'], [CH_B.what, 'boing', {p: 1.5, g: 0.7}], [CH_B.slip + 0.1, 'clink', {p: 1.4, g: 0.6}],
  [CH_B.no, 'thud', {p: 0.8}], [CH_B.no + 0.03, 'buzz', {p: 0.7, g: 0.5}],                                      // NO!
  [CH_B.first + 0.1, 'squeak', {g: 0.5}], [CH_B.first + 0.55, 'squeak', {p: 1.1, g: 0.5}],
  [CH_B.think + 0.05, 'dizzy'], [CH_B.got, 'boing'], [CH_B.got + 0.4, 'squeak', {p: 1.2, g: 0.5}], [CH_B.got + 1.0, 'ding'],
  ...[2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => [CH_B.climb + i*Math.PI/10, 'tick', {p: 1.2, g: 0.35}]),   // each hop lands
  [CH_B.praise - 0.1, 'swish', {p: 1.4}],                                             // out comes the bat
];
function sceneChineseB(t){
  const nk = t - CH_B.no, shake = nk > 0 && nk < 0.45 ? Math.sin(t*80)*9*(1 - nk/0.45) : 0;   // the room shakes at her NO!
  ctx.save();
  if (shake) { ctx.fillStyle = '#ecebe6'; ctx.fillRect(0, 0, W, H*0.70); ctx.fillStyle = '#585d70'; ctx.fillRect(0, H*0.70, W, H*0.30); ctx.translate(shake, shake*0.4); }
  const L = LINES_SCHOOL2.chinese, S = s2Seat(), B = CH_B, R = s2Room(t);
  s2Cues('chB', t, CH_B_SFX);
  s2Problem(R, t, S2_PROB_B);
  const tint = 0.30*(ease(s2Tw(t, B.arrive, B.arrive + 0.7)) - ease(s2Tw(t, B.squash + 0.1, B.squash + 0.9)));
  if (tint > 0.001) { ctx.fillStyle = `rgba(40,52,100,${tint})`; ctx.fillRect(0, 0, W, H); }

  // ---- Nailong (worked out first: she watches him walk) ----
  let x = S.nx, y = S.ny, s = S.ns, sx = 1, sy = 1, rot = 0, sad = false, tears = false, think = false;
  const o = {mouth: 'o', arms: 'down', look: [0, 0]};
  if (t < B.up) {                                            // still in the second row with Jed's phone, dizzy from the game
    o.look = t < B.notice ? [Math.cos(t*6)*0.6, Math.sin(t*6)*0.5] : [0.9, -0.3]; sy += Math.sin(t*2)*0.015;
    const q = s2Pulse(t, B.bang, B.bang + 0.3); sy += 0.15*q; sx -= 0.07*q; y -= 16*q;
  } else if (t < B.walk) {                                   // stands up, the chair scrapes
    const k = s2Tw(t, B.up, B.walk); y -= Math.sin(Math.PI*k)*30; sy = 1 + 0.1*Math.sin(Math.PI*k); o.look = [0.6, 0.6]; sad = true;
  } else if (t < B.arrive - 0.35) {                          // the slow sad walk to the front row
    const k = ease(s2Tw(t, B.walk, B.arrive - 0.35));
    x = lerp(S.nx, S.fx, k); y = lerp(S.ny, S.ffy, k); s = lerp(S.ns, S.fs, k);
    y -= Math.abs(Math.sin(t*10.1))*5; o.walk = t*10.1; o.look = [0.5, 0.9]; sy = 0.95; sad = true;
  } else if (t < B.arrive) {                                 // hops up onto the front chair and sits
    const k = s2Tw(t, B.arrive - 0.35, B.arrive);
    x = S.fx; s = S.fs; y = lerp(S.ffy, S.fy, ease(k)) - Math.sin(Math.PI*k)*22; o.look = [0.3, 0.9]; sad = true;
  } else {
    x = S.fx; y = S.fy; s = S.fs;
    if (t < B.think) {                                       // the low point, the pause, then the question
      sad = true; tears = t > B.arrive + 0.4; sy = 0.92 + Math.sin(t*1.6)*0.01; sx = 1.04; o.look = [0, 1];
      if (t < B.arrive + 0.4) sy -= 0.04*s2Pulse(t, B.arrive, B.arrive + 0.4);
      if (t > B.ping && t < B.pingEnd) { o.look = [-0.9, -0.3]; o.mouth = 'o'; }
      if (t > B.what && t < B.first) { o.look = [-0.9, -0.3]; o.mouth = 'o'; }
      if (t > B.no && t < B.no + 0.45) { const q = s2Pulse(t, B.no, B.no + 0.45); sy -= 0.12*q; sx += 0.08*q; }   // he flinches at the NO!
      if (t > B.first) o.look = [-0.4, -0.6];
    } else if (t < B.got) {                                  // thinking hard
      think = true; o.mouth = 'o'; sy = 1 + 0.07*Math.sin(t*9); sx = 1 - 0.04*Math.sin(t*9); rot = Math.sin(t*2.2)*0.08;
      o.look = [Math.cos(t*5), Math.sin(t*5)*0.8];
      if (t > B.squash) { const k = s2Tw(t, B.squash, B.got); sy = 1 - 0.2*k; sx = 1 + 0.15*k; }
    } else if (t < B.climb) {                                // stretch up to the board
      const k = s2Tw(t, B.got, B.got + 0.4); sy = lerp(0.8, 1.55, ease(k)); sx = lerp(1.15, 0.8, ease(k)); o.arms = 'up'; o.flail = t*14; o.mouth = 'open'; o.look = [-0.3, -1];
      if (t > B.down) { const q = s2Tw(t, B.down, B.climb); sy = lerp(1.55, 0.78, ease(q)); sx = lerp(0.8, 1.2, ease(q)); }
    } else {                                                 // the climb back
      const k = t - B.climb; o.arms = 'up'; o.flail = t*14; o.mouth = 'open'; o.look = [-1, -0.2];
      if (k < 0.3) { sy = lerp(0.78, 1, k/0.3); sx = lerp(1.2, 1, k/0.3); }
      else y -= Math.abs(Math.sin(k*10))*40;
    }
  }

  // ---- Liu Lao Shi ----
  const lo = {mouth: 'smile', look: [0.5, 0], aL: 0.15, aR: 0.2, marker: true, pony: Math.sin(t*3)*0.1, slip: 0, blink: (t % 3.2) < 0.12 ? 1 : 0};
  const talk = () => (Math.sin(t*18) > 0 ? 'open' : 'smile');
  if (t < B.notice) s2Teach(t, lo);                          // still writing, then she sees the phone
  else if (t < B.up) {
    lo.aR = lerp(2.3, 0.2, ease(s2Tw(t, B.notice, B.notice + 0.35))); lo.look = [-1, 0.3]; lo.slip = 0.5*s2Pulse(t, B.notice, B.move + 0.2);
    if (t < B.move) lo.mouth = 'o';
    else { lo.aR = lerp(0.2, 1.5, ease(s2Tw(t, B.move, B.move + 0.3))); lo.mouth = t < B.moveEnd - 0.4 ? talk() : 'smile'; }   // points at the spot beside her
  } else if (t < B.ping) { lo.aR = lerp(1.5, 0.2, ease(s2Tw(t, B.up, B.up + 0.4))); lo.look = [clamp((x - S.lx)/160, -1, 0.9), 0.25]; }
  else if (t < B.what) { lo.look = [0.9, 0.3]; }                                                         // listening
  else if (t < B.no) { lo.look = [0.9, 0.2]; lo.mouth = 'o'; lo.slip = ease(s2Tw(t, B.slip, B.slip + 0.3)); lo.pony += 0.15; lo.aL = lo.aR = 0.5*s2Pulse(t, B.what, B.what + 0.5); }   // What??
  else if (t < B.noEnd) { const q = s2Pulse(t, B.no, B.no + 0.35); lo.look = [0.9, 0.3]; lo.mouth = t < B.no + 0.9 ? 'open' : 'flat'; lo.slip = 1;   // NO!
    lo.aL = lo.aR = 0.25 + 0.5*q; lo.sy = 1 + 0.08*q; lo.pony += 0.3*q; }
  else if (t < B.first) { lo.look = [0.9, 0.3]; lo.mouth = 'flat'; lo.slip = 1 - ease(s2Tw(t, B.first - 0.5, B.first)); lo.aL = lo.aR = 0.55; }   // the held pause
  else if (t < B.first + 1.1) { lo.aR = 2.4 + Math.sin(t*14)*0.18; lo.look = [0.8, -0.5]; lo.slip = 0.2*(1 - s2Tw(t, B.first, B.first + 0.2)); lo.mouth = talk(); }
  else if (t < B.got) { lo.aL = 0.55; lo.aR = 0.55; lo.look = [0.9, 0.3]; lo.mouth = t < B.firstEnd - 0.3 ? talk() : 'flat'; }
  else if (t < B.praise - 0.3) { lo.mouth = 'o'; lo.slip = 1; lo.look = [0.8, -0.4]; lo.aR = 0.5; lo.aL = 0.4; lo.sy = 1 + 0.03*Math.sin(t*20); }
  else { lo.mouth = talk(); lo.aL = lerp(2.9, 0.7, ease(s2Tw(t, B.praise - 0.2, B.praise + 0.5))); lo.aR = 0.15; lo.look = [0.4, 0]; lo.marker = false; lo.bat = t > B.praise; }
  liuLaoShi(S.lx, S.ly, S.ls, lo);
  // he is drawn behind the second row's chairs once he is past them on the way to the front (and while he sits there)
  const drawN = () => {
  s2NL(x, y, s, Object.assign(o, {sx, sy, rot}), sad ? s2SadFace : think ? s2ThinkBrows : null);
  if (tears) {
    for (const d of [-1, 1]) for (let i = 0; i < 2; i++) { const ph = (t*1.4 + i*0.5 + (d > 0 ? 0.2 : 0)) % 1;
      ell(x + d*25*s*sx, y - 140*s*sy + 4 + ph*70*s, 5*s + 2, 8*s + 2); ctx.fillStyle = '#6bb8f0'; ctx.fill(); }
  }
  if (sad && t > B.arrive + 0.2) {                           // the little rain cloud over his head
    const k = ease(s2Tw(t, B.arrive + 0.2, B.arrive + 0.7))*(1 - ease(s2Tw(t, B.ping - 0.3, B.ping))),   // clears as he looks up to ask
          cx = x, cy = y - 215*s*sy - 30 - (1 - k)*40;
    if (k > 0.01) {
      const Bl = [[-34, 6, 30, 20], [0, -6, 38, 26], [36, 6, 30, 20], [0, 10, 60, 16]];
      ctx.save(); ctx.globalAlpha = k; ctx.strokeStyle = C.line; ctx.lineWidth = 4;
      for (const [dx, dy, rx, ry] of Bl) { ell(cx + dx, cy + dy, rx, ry); ctx.stroke(); }
      for (const [dx, dy, rx, ry] of Bl) { ell(cx + dx, cy + dy, rx, ry); ctx.fillStyle = '#8d96ab'; ctx.fill(); }
      ctx.strokeStyle = '#6bb8f0'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++) { const ph = (t*1.8 + i*0.31) % 1, dx = -42 + i*17; ctx.beginPath(); ctx.moveTo(cx + dx, cy + 30 + ph*50); ctx.lineTo(cx + dx - 3, cy + 42 + ph*50); ctx.stroke(); }
      ctx.restore(); ctx.lineCap = 'butt';
    }
  }
  if (think) {                                               // the characters orbit his head, steam, sweat
    const hx = x, hy = y - 135*s*sy;
    ['乒', '乓', '球', '?'].forEach((ch, i) => { const a = t*3.2 + i*Math.PI/2;
      ctx.save(); ctx.globalAlpha = 0.7 + 0.3*Math.sin(a); title(ch, hx + Math.cos(a)*95, hy - 75*s + Math.sin(a)*36, 34 + Math.sin(a)*6, '#fff'); ctx.restore(); });
    for (let i = 0; i < 4; i++) { const ph = (t*1.3 + i*0.25) % 1, d = i % 2 ? 1 : -1; ell(hx + d*(58*s + 20 + ph*14), hy - 10 - ph*80, 10 + ph*14, 10 + ph*14); ctx.fillStyle = `rgba(255,255,255,${0.8 - ph*0.8})`; ctx.fill(); }
    const sp = (t*1.2) % 1; ell(hx + 40*s + 14, hy - 40*s + sp*60, 6, 9); ctx.fillStyle = '#6bb8f0'; ctx.fill();
  }
  };
  const pastRow2 = t >= B.arrive - 0.35 || (t > B.walk && ease(s2Tw(t, B.walk, B.arrive - 0.35)) > 0.55);
  s2FrontRow();
  if (pastRow2) { drawN(); s2BackChairs(); } else { s2BackChairs(); drawN(); }
  // Jed: watches him go, then back to his game
  const jo = {mouth: t > B.notice && t < B.give + 0.4 ? 'o' : 'smile', look: [0.1, 1]};
  if (t < B.give + 0.4) jo.look = [-1, 0.2];
  else if (t > B.up && t < B.arrive + 0.6) jo.look = [clamp((x - S.jx)/150, -1, 1), -0.4];
  person(S.jx, S.jy, S.js, CAST.jed, jo);
  s2BackDesk();
  // the MacBook: in front of Nailong, slid back to Jed
  const MS = s2MacSpots(S), pJ = MS.pJ, pN = MS.pN, kg = ease(s2Tw(t, B.give, B.give + 0.4));
  s2Phone(lerp(pN[0], pJ[0], kg), pN[1] - Math.sin(Math.PI*kg)*8, MS.sc, 0, s2RowsB(t), false);
  fxMark('bang', S.nx + 55*S.ns, S.ny - 200*S.ns, s2Tw(t, B.bang, B.bang + 0.6));   // anime "!" when she calls him (Nichijou)

  // ---- speech ----
  // her lines once the question is up, and his "got it", sit BESIDE the face (above it they covered 乒乓球 and the green answer)
  const lTop = S.ly - 268*S.ls, nTop = y - 188*s*sy, lFace = [S.lx, S.ly - 218*S.ls, 44*S.ls - 6], nFace = [x, y - 130*s*sy, 45*s*sx];
  if (t > B.move && t < B.moveEnd) bubble(L.move, S.lx, lTop, 30, 330);
  if (t > B.ping && t < B.pingEnd) s2SideBubble(L.ping, nFace[0], nFace[1], nFace[2], -1, t - B.ping, 28, 260);   // left of him: her face stays clear
  if (t > B.what && t < B.whatEnd) bubble(L.what, S.lx, lTop, 32, 300);
  if (t > B.no && t < B.noEnd) bubble(L.no, S.lx, lTop - 6, Math.round(64*(1 + 0.25*s2Pulse(t, B.no, B.no + 0.3))), 300);   // big and loud
  if (t > B.first && t < B.firstEnd) s2SideBubble(L.first, lFace[0], lFace[1] - 14, lFace[2], -1, t - B.first, 26, 360);
  if (t > B.got && t < B.gotEnd) s2SideBubble(L.got, nFace[0], nFace[1], nFace[2], 1, t - B.got, 28, 300);
  if (t > B.praise) s2SideBubble(L.praise, lFace[0], lFace[1] - 14, lFace[2], -1, t - B.praise, 26, 380);
  ctx.restore();
}

// ---------- clip C: after ping pong, out of the Chinese room. Max, 12 Oct: "and then we have nai long coming out "What a fun and nice
// teacher" and then Mr. Shou next providing a stark contrast." The corridor outside her door: he skips out, turns, waves back into
// the room (she waves back through the door), says it, and hops off to the right, towards the cafe (sceneCafe1). ----------
const CH_OUT = {out: 0.15, step: 1.0, turn: 1.0, wave: 1.15, say: 1.2, sayEnd: 3.4, go: 3.25};   // the line stays 3.1 s real
const CH_OUT_DUR = 3.95;                                    // scene seconds (5.6 s real)
const CH_OUT_SFX = [
  [0.05, 'door'], ...[0, 1, 2].map(i => [CH_OUT.out + 0.25 + i*0.28, 'tick', {p: 0.9, g: 0.45}]),          // out the door, three steps
  [CH_OUT.say, 'pop', {p: 1.1}], [CH_OUT.say + 0.15, 'ding', {p: 1.3, g: 0.5}], [CH_OUT.wave + 0.2, 'swish', {p: 1.5, g: 0.35}],
  ...[0, 1, 2].map(i => [CH_OUT.go + 0.08 + i*0.22, 'boing', {p: 1.3 + i*0.1, g: 0.45}]),                   // happy hops away
];
// a little heart (he is happy)
function s2Heart(x, y, r, rot){
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
  ctx.moveTo(0, r*0.9); ctx.bezierCurveTo(-r*1.5, -r*0.1, -r*0.7, -r*1.2, 0, -r*0.45); ctx.bezierCurveTo(r*0.7, -r*1.2, r*1.5, -r*0.1, 0, r*0.9);
  ctx.closePath(); ctx.fillStyle = '#f2788f'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
}
function sceneChineseOut(t){
  const L = LINES_SCHOOL2.out, E = CH_OUT, fy = H*0.74, D = {x: W*0.22, y: H*0.17, w: Math.min(230, W*0.18)}, dh = fy - D.y;
  s2Cues('chOut', t, CH_OUT_SFX);
  // ---- the corridor: cream wall, noticeboard, her door, lockers, grey floor ----
  ctx.fillStyle = '#efe6d2'; ctx.fillRect(0, 0, W, fy);
  ctx.fillStyle = '#d9d3c4'; ctx.fillRect(0, 0, W, H*0.05);
  ctx.fillStyle = '#b9bcc9'; ctx.fillRect(0, fy, W, H - fy);
  ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 6; i++) ctx.fillRect(i*W/5 - 30, fy + 26 + (i % 2)*24, 150, 6);
  ctx.fillStyle = '#8c8fa0'; ctx.fillRect(0, fy - 4, W, 10);
  // noticeboard on the left
  const nbx = W*0.03, nby = H*0.22, nbw = W*0.14, nbh = H*0.25;
  ctx.fillStyle = '#c99a5e'; rr(nbx, nby, nbw, nbh, 6); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
  [['#fff', 0.1, 0.12, 0.38, 0.4, -0.05], ['#fbe36a', 0.55, 0.1, 0.36, 0.34, 0.06], ['#bfe0f2', 0.14, 0.58, 0.32, 0.32, 0.04], ['#f6c1cc', 0.52, 0.52, 0.38, 0.38, -0.04]].forEach(([c, fx, fyy, fw, fh, r]) => {
    ctx.save(); ctx.translate(nbx + nbw*(fx + fw/2), nby + nbh*(fyy + fh/2)); ctx.rotate(r);
    rr(-nbw*fw/2, -nbh*fh/2, nbw*fw, nbh*fh, 2); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.line; ctx.stroke();
    ell(0, -nbh*fh/2 + 5, 4, 4); ctx.fillStyle = '#d3303a'; ctx.fill(); ctx.restore(); });
  // lockers on the right (navy and red, like the LLC corridor)
  const lw = 74, lx0 = D.x + D.w + 150;
  for (let x = lx0; x < W + lw; x += lw) {
    const navy = Math.round((x - lx0)/lw) % 3 !== 1;
    ctx.fillStyle = navy ? '#2a3a78' : '#c2373a'; rr(x + 2, H*0.24, lw - 4, fy - H*0.24 - 6, 4); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.28)'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x + 16, H*0.27 + k*8); ctx.lineTo(x + lw - 16, H*0.27 + k*8); ctx.stroke(); }
    ctx.fillStyle = '#c9ccd4'; rr(x + lw - 24, H*0.42, 8, 22, 3); ctx.fill();
  }
  // the room sign beside the door
  const sx0 = D.x + D.w + 30;
  ctx.fillStyle = '#fff'; rr(sx0, H*0.28, 96, 56, 6); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
  ctx.fillStyle = '#d3303a'; rr(sx0 + 8, H*0.28 + 8, 80, 40, 4); ctx.fill();
  ctx.fillStyle = '#ffe9a8'; font(26, 600); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(L.sign, sx0 + 48, H*0.28 + 29);
  // through the door: a slice of her room (wall, floor, the red diamond clock, a bamboo plate, the board's edge) and Liu Lao Shi waving
  ctx.save(); ctx.beginPath(); ctx.rect(D.x, D.y, D.w, dh); ctx.clip();
  const iy = fy - dh*0.2;
  ctx.fillStyle = '#ecebe6'; ctx.fillRect(D.x, D.y, D.w, dh); ctx.fillStyle = '#585d70'; ctx.fillRect(D.x, iy, D.w, fy - iy);
  ctx.fillStyle = '#4a4f62'; ctx.fillRect(D.x, iy - 4, D.w, 6);
  ctx.save(); ctx.translate(D.x + D.w*0.2, D.y + dh*0.18); ctx.rotate(Math.PI/4); rr(-24, -24, 48, 48, 4); ctx.fillStyle = '#d3303a'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#e8b44a'; ctx.stroke(); ctx.restore();
  ell(D.x + D.w*0.2, D.y + dh*0.18, 16, 16); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = C.line; ctx.stroke();
  s2Plate(D.x + D.w*0.75, D.y + dh*0.14, 26, 1);
  ctx.fillStyle = '#a3a5ae'; rr(D.x + D.w*0.62, D.y + dh*0.32, D.w*0.6, dh*0.3, 5); ctx.fill(); ctx.fillStyle = '#fbfcfd'; rr(D.x + D.w*0.66, D.y + dh*0.34, D.w*0.6, dh*0.26, 4); ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke();
  const lo = {mouth: 'smile', look: [0.5, 0.2], aL: 0.2, aR: 0.25, marker: false, bat: true, pony: Math.sin(t*3)*0.1, blink: (t % 3.2) < 0.12 ? 1 : 0};
  if (t > E.wave) { lo.aR = 2.6 + Math.sin(t*12)*0.35; lo.look = [0.8, 0]; lo.mouth = t > E.say + 0.2 && t < E.sayEnd ? 'open' : 'smile'; }
  liuLaoShi(D.x + D.w*0.45, iy + 34, 0.6, lo);
  ctx.restore();
  // the door frame and the open door (swung out towards us on the left)
  ctx.save(); ctx.lineJoin = 'round';
  const op = ease(s2Tw(t, 0, 0.35)), lx = D.x - 8, sw = lerp(0.35, 1, op);
  ctx.beginPath(); ctx.moveTo(lx, D.y - 2); ctx.lineTo(lx - 74*sw, D.y + 16*sw); ctx.lineTo(lx - 74*sw, fy + 18*sw); ctx.lineTo(lx, fy);
  ctx.closePath(); ctx.fillStyle = '#b9874f'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(lx - 20*sw, D.y + 50); ctx.lineTo(lx - 56*sw, D.y + 50 + 10*sw); ctx.lineTo(lx - 56*sw, D.y + 150 + 10*sw); ctx.lineTo(lx - 20*sw, D.y + 150);
  ctx.closePath(); ctx.fillStyle = '#cdeefa'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
  ell(lx - 62*sw, (D.y + fy)/2 + 12*sw, 5, 7); ctx.fillStyle = '#c9ccd4'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
  ctx.strokeStyle = '#5b5f6e'; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(D.x - 7, fy); ctx.lineTo(D.x - 7, D.y - 7); ctx.lineTo(D.x + D.w + 7, D.y - 7); ctx.lineTo(D.x + D.w + 7, fy); ctx.stroke();
  ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.strokeRect(D.x - 14, D.y - 14, D.w + 28, dh + 14); ctx.strokeRect(D.x, D.y, D.w, dh);
  ctx.restore();
  // ---- Nailong: out of the door, turns back, waves, says it, hops away ----
  const x0 = D.x + D.w*0.5, x1 = D.x + D.w + 120, gy = H*0.93;
  let x = x0, y = fy + 4, s = 0.62, sx = 1, sy = 1, rot = 0;
  const o = {mouth: 'smile', arms: 'down', look: [0.6, 0.3]};
  if (t < E.out) { o.look = [0.3, 0.3]; }
  else if (t < E.step) {                                      // three bouncy steps out towards us
    const k = ease(s2Tw(t, E.out, E.step)); x = lerp(x0, x1, k); y = lerp(fy + 4, gy, k); s = lerp(0.62, 1, k);
    y -= Math.abs(Math.sin((t - E.out)*11.2))*16; o.walk = t*11; o.look = [0.8, 0.2];
  } else if (t < E.go) {                                      // turned back to the door, waving
    x = x1; y = gy; s = 1; o.look = [-1, -0.45];
    const q = s2Pulse(t, E.step, E.step + 0.25); sy = 1 - 0.1*q; sx = 1 + 0.06*q;
    if (t > E.wave) { o.arms = 'up'; o.flail = t*13; rot = -0.06 + Math.sin(t*6.5)*0.05; sy += Math.sin(t*13)*0.02; }
    if (t > E.say && t < E.sayEnd - 0.3) o.mouth = Math.sin(t*15) > -0.2 ? 'open' : 'smile';
  } else {                                                    // happy hops away to the right
    const k = s2Tw(t, E.go, CH_OUT_DUR); x = x1 + k*k*W*0.75 + k*W*0.1; y = gy - Math.abs(Math.sin((t - E.go)*Math.PI/0.22))*40; s = 1;
    o.look = [1, -0.2]; o.arms = 'up'; o.flail = t*10; rot = 0.08;
  }
  s2NL(x, y, s, Object.assign(o, {sx, sy, rot}));
  // hearts float up while he says it
  if (t > E.wave) for (let i = 0; i < 3; i++) { const a = ((t - E.wave)*0.7 + i/3) % 1;
    ctx.save(); ctx.globalAlpha = (1 - a)*Math.min(1, (t - E.wave)/0.3); s2Heart(x + 112 + i*26 + Math.sin(a*8 + i)*8, y - 110 - a*130, 12 + 3*i, Math.sin(a*6)*0.3); ctx.restore(); }
  if (t > E.say && t < E.sayEnd) bubble(L.nice, x + 50, y - 195*s*sy, 32, 280);   // to his right, over the lockers: her wave in the door stays in view
}

// ---------- clip 2: funny faces (9.6 s) ----------
const S2_FACE_DUR = 9.6;
const S2_FACE_T = [2.0, 3.6, 5.2, 6.8];
// the custom faces. kind 0 cross-eyed + tongue, 1 puffed cheeks, 2 fish, 3 the worst one. tt = time for the wobble
function s2FaceDraw(kind, tt){
  ctx.save(); s2Wipe();
  if (kind === 0) {
    const w = Math.sin(tt*22)*1.5;
    s2Eye(-24, -142, 15, 7 + w, 3, 6); s2Eye(24, -142, 15, -7 + w, 3, 6);
    ell(0, -106, 20, 10); ctx.fillStyle = C.mouth; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
  } else if (kind === 1) {
    ctx.strokeStyle = C.line; ctx.lineWidth = 5; ctx.beginPath();
    ctx.moveTo(-36, -152); ctx.lineTo(-16, -142); ctx.lineTo(-36, -132); ctx.moveTo(36, -152); ctx.lineTo(16, -142); ctx.lineTo(36, -132); ctx.stroke();
    ell(0, -108, 6, 5); ctx.fillStyle = C.mouth; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
  } else if (kind === 2) {
    s2Eye(-22, -144, 17, 0, 0, 6); s2Eye(22, -144, 17, 0, 0, 6);
    ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-40, -170); ctx.quadraticCurveTo(-22, -178, -6, -168); ctx.moveTo(40, -170); ctx.quadraticCurveTo(22, -178, 6, -168); ctx.stroke();
    ctx.strokeStyle = '#d9a516'; ctx.lineWidth = 4; for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(d*40, -108, 14, d > 0 ? Math.PI*0.6 : -Math.PI*0.1, d > 0 ? Math.PI*1.1 : Math.PI*0.4); ctx.stroke(); }
  } else {
    s2Eye(-24, -142, 20, -5 + Math.sin(tt*16)*2, 3, 8); s2Eye(26, -139, 9, 2, 0, 4.5);
    ctx.strokeStyle = C.line; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-46, -172); ctx.lineTo(-8, -158); ctx.moveTo(14, -154); ctx.lineTo(38, -160); ctx.stroke();
    ctx.save(); ctx.translate(2, -104); ctx.rotate(0.14 + Math.sin(tt*12)*0.03); ell(0, 0, 33, 17); ctx.fillStyle = C.mouth; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
    ctx.fillStyle = '#fff'; rr(-22, -14, 44, 9, 3); ctx.fill(); ctx.restore();
  }
  ctx.restore();
  // parts that stick out of the head
  if (kind === 0) {
    const tl = 36 + Math.sin(tt*14)*6; rr(-11, -104, 22, tl, 11); ctx.fillStyle = C.tongue; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
    ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, -98); ctx.lineTo(0, -104 + tl - 8); ctx.stroke();
  } else if (kind === 1) {
    const p = 1 + 0.1*Math.sin(tt*12);
    for (const d of [-1, 1]) { ell(d*48, -108, 24*p, 22*p); ctx.lineWidth = 12; ctx.strokeStyle = C.line; ctx.stroke(); }
    for (const d of [-1, 1]) { ell(d*48, -108, 24*p, 22*p); ctx.fillStyle = C.y; ctx.fill(); ell(d*52, -102, 9, 6); ctx.fillStyle = 'rgba(240,120,130,.45)'; ctx.fill(); }
  } else if (kind === 2) {
    ell(0, -104, 15, 10); ctx.fillStyle = '#f2788f'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-12, -104); ctx.quadraticCurveTo(0, -101, 12, -104); ctx.stroke();
    for (let i = 0; i < 3; i++) { const ph = (tt*1.3 + i*0.34) % 1; ell(14 + i*8 + Math.sin(ph*9)*4, -108 - ph*90, 5 + i*1.5, 5 + i*1.5); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); }
  } else {
    ctx.save(); ctx.translate(30 + Math.sin(tt*18)*3, -92); ctx.rotate(-0.5); rr(-10, 0, 22, 34, 11); ctx.fillStyle = C.tongue; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke(); ctx.restore();
  }
}
function s2Corridor(){
  const fy = H*0.72;
  ctx.fillStyle = '#efe6d2'; ctx.fillRect(0, 0, W, fy);
  ctx.fillStyle = '#d9d3c4'; ctx.fillRect(0, 0, W, H*0.05);
  const lw = 74;
  for (let i = 0; i*lw < W + lw; i++) {
    const x = i*lw, navy = i % 3 !== 1;
    ctx.fillStyle = navy ? '#2a3a78' : '#c2373a'; rr(x + 2, H*0.24, lw - 4, fy - H*0.24 - 6, 4); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.28)'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x + 16, H*0.27 + k*8); ctx.lineTo(x + lw - 16, H*0.27 + k*8); ctx.stroke(); }
    ctx.fillStyle = '#c9ccd4'; rr(x + lw - 24, H*0.42, 8, 22, 3); ctx.fill();
  }
  ctx.fillStyle = '#1f2e6b'; rr(W*0.5 - 250, H*0.085, 500, 54, 10); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
  font(26); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(LINES_SCHOOL2.faces.sign, W*0.5, H*0.085 + 28);
  ctx.fillStyle = '#b9bcc9'; ctx.fillRect(0, fy, W, H - fy);
  ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 6; i++) ctx.fillRect(i*W/5 - 30, fy + 18 + (i % 2)*20, 150, 6);
  ctx.fillStyle = '#8c8fa0'; ctx.fillRect(0, fy - 4, W, 10);
}
function sceneFaces(t){
  const L = LINES_SCHOOL2.faces, gy = H*0.86, FT = S2_FACE_T;
  s2Corridor();
  const ns = 0.95, nxStand = W*0.36;
  const nx = lerp(-120, nxStand, ease(s2Tw(t, 0, 1.5)));
  let ny = gy, sx = 1, sy = 1, rot = 0, kind = -1, kt = 0;
  const o = {mouth: 'smile', look: [0.7, 0], arms: 'down'};
  if (t < 1.5) { o.walk = t*10; ny -= Math.abs(Math.sin(t*10))*7; }
  const fi = FT.findIndex((a, i) => t >= a && t < (i < 3 ? FT[i + 1] : 8.4));
  if (fi >= 0) {
    kind = fi; kt = t - FT[fi];
    if (kt < 0.2) { sx = 1 + 0.14*(kt/0.2); sy = 1 - 0.14*(kt/0.2); }
    else if (kt < 0.45) { const q = (kt - 0.2)/0.25; sx = 1.14 - 0.2*q; sy = 0.86 + 0.26*q; }
    else { const q = Math.sin((kt - 0.45)*13); sx = 0.94 + 0.05*q; sy = 1.12 - 0.05*q; }
    if (fi === 3) { rot = Math.sin(t*9)*0.06; sx *= 1.05; }
    o.look = [0.9, 0]; if (kt < 0.45) ny -= Math.sin(Math.PI*kt/0.45)*18;
  } else if (t > 8.4) { o.mouth = 'open'; o.look = [0.9, -0.2]; sy = 1 + Math.sin(t*10)*0.03; }
  const clicks = FT.map(a => a + 1.1);
  s2NL(nx, ny, ns, Object.assign(o, {sx, sy, rot}), kind >= 0 ? () => s2FaceDraw(kind, t) : null);
  if (kind >= 0 && kt > 0.25 && kt < 1.5) title(L.sfx[kind], nx - 150, ny - 190*ns + 6, 34 + Math.sin(kt*14)*3, '#fff');
  // Scarlett (190 cm) slides in from the right, holding her phone down at him
  const scx = lerp(W + 180, W*0.73, ease(s2Tw(t, 0.9, 1.6))), ss = 1.05;
  const laugh = t > 8.4, shake = laugh ? Math.abs(Math.sin(t*14))*10 : 0, arr = s2Pulse(t, 1.5, 1.9);
  ctx.save(); ctx.translate(scx, gy - shake); ctx.scale(1 - 0.06*arr, 1 + 0.06*arr); ctx.rotate(laugh ? Math.sin(t*14)*0.05 : 0);
  person(0, 0, ss, CAST.scarlett, {mouth: 'smile', look: [-0.9, 0.5]});
  ctx.save(); ctx.scale(ss, ss); ctx.translate(-56, -112); ctx.rotate(-0.4);
  rr(-13, -24, 26, 46, 5); ctx.fillStyle = '#2a2f3a'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
  ell(-4, -14, 4, 4); ctx.fillStyle = '#6a8fd0'; ctx.fill(); ctx.restore();
  ctx.restore();
  // photo strip, top right: a frame fills in after each flash
  const fw = 96, fh = 84, fx = W - fw - 22;
  FT.forEach((a, i) => {
    const ck = clicks[i], fyy = H*0.05 + 8 + i*(fh + 20);
    rr(fx - 6, fyy - 6, fw + 12, fh + 12, 6); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke();
    rr(fx, fyy, fw, fh, 3); ctx.fillStyle = '#d6e6f2'; ctx.fill();
    if (t > ck + 0.1) {
      const k = clamp((t - ck - 0.1)/0.25, 0, 1), z = 1 + (1 - k)*0.35;
      ctx.save(); rr(fx, fyy, fw, fh, 3); ctx.clip(); ctx.translate(fx + fw/2, fyy + fh/2); ctx.scale(z, z); ctx.translate(-(fx + fw/2), -(fyy + fh/2));
      s2NL(fx + fw/2, fyy + fh/2 + 130*0.62 - 6, 0.62, {mouth: 'smile', look: [0, 0]}, () => s2FaceDraw(i, a + 0.9)); ctx.restore();
    }
  });
  const sTop = gy - 268*ss - 24;
  FT.forEach((a, i) => { if (t > a - 0.55 && t < a + 0.75) bubble(L.prompts[i], scx - 30, sTop, 28, 300); });
  if (t > 8.5) bubble(L.end, scx - 30, sTop, 28, 330);
  let fl = 0; for (const c of clicks) if (t > c && t < c + 0.2) fl = Math.max(fl, 1 - (t - c)/0.2);
  if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${0.85*fl})`; ctx.fillRect(0, 0, W, H); }
  fxIris(s2Tw(t, S2_FACE_DUR - 0.35, S2_FACE_DUR), nx, ny - 125*ns*sy);   // Looney Tunes iris closing on his face
}

// ---------- clip 3: the LLC library: tiptoe, ACHOO, the car, the funny face, out of the window (S2_LLC_DUR at the bottom) ----------
const S2_BOOKS = ['#7b4b8a', '#3f6fa3', '#b8644a', '#5b8f6b', '#c9a24a', '#a04a5a', '#4b5a8f', '#8a7a52'];
// same shelves and QUIET STUDY sign as the Tetris backdrop (games/tetris.js); dark = the tint on top (0.58 in Tetris)
function s2Shelves(dark, shake, signSwing){
  ctx.fillStyle = '#2c2459'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(shake, 0);
  for (let row = 0; row < 4; row++) {
    const base = 150 + row*165;
    let x = -14, i = row*97;
    while (x < W + 20) {
      const w = 15 + (i*7 % 11), h = 62 + (i*13 % 40);
      ctx.fillStyle = S2_BOOKS[(i*5 + row) % S2_BOOKS.length]; ctx.strokeStyle = 'rgba(74,47,12,.55)'; ctx.lineWidth = 2;
      ctx.save(); ctx.translate(x + w/2, base); ctx.rotate(i % 17 === 0 ? 0.12 : 0); rr(-w/2, -h, w, h, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(-w/2 + 3, -h + 10, w - 6, 3); ctx.restore();
      x += w + 2 + (i % 3); i++;
    }
    ctx.fillStyle = '#7a5231'; ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.fillRect(-20, base, W + 40, 14); ctx.strokeRect(-20, base, W + 40, 14);
  }
  ctx.restore();
  ctx.fillStyle = `rgba(29,22,64,${dark})`; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(95, 0); ctx.rotate(signSwing); ctx.translate(-95, 0);
  ctx.strokeStyle = C.line; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(40, 26); ctx.moveTo(150, 0); ctx.lineTo(150, 26); ctx.stroke();
  ctx.fillStyle = '#e8d3a2'; rr(18, 26, 154, 34, 8); ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
  font(18); ctx.fillStyle = C.line; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(LINES_SCHOOL2.llc.sign, 95, 44);
  ctx.restore();
}
// ---------- the LLC library as it really is (Max's photo, private-refs/llc-library-inside.jpg): white ceiling tiles with light
// panels, a long window wall with bunting, green fields, gum trees and hills outside, a low cabinet under the windows with
// books standing face out, a white table with green plastic chairs, a wooden book trolley, dark carpet. The pane he jumps
// through is R (s2LlcWin); Crony's grey Camry is parked on the road outside it (camry() from story-canberra.js). ----------
function s2LlcWin(){ return {x: W*0.58, y: H*0.165, w: W*0.30, h: H*0.355}; }
const s2LlcCar = R => [R.x + R.w*0.6, R.y + R.h*0.58 + 84];                  // where the Camry stands (the glint uses it)
const S2_BUNT = ['#f2a7b5', '#f7d774', '#9fd3e8', '#b9e0a5', '#d7b9f0'];
function s2Library(shake, signSwing, broken, R){
  const ceilB = H*0.13, winT = R.y, winB = R.y + R.h, grassY = winT + R.h*0.58, cabT = H*0.555, cabB = H*0.655;
  ctx.fillStyle = '#e9ebee'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(shake, 0); ctx.lineJoin = 'round';
  // ceiling: tiles, light panels, vents
  ctx.strokeStyle = 'rgba(60,64,80,.13)'; ctx.lineWidth = 2;
  for (let y = 30; y < ceilB; y += 32) { ctx.beginPath(); ctx.moveTo(-20, y); ctx.lineTo(W + 20, y); ctx.stroke(); }
  for (let x = -20; x < W + 20; x += 92) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ceilB); ctx.stroke(); }
  for (const fx of [0.12, 0.4, 0.68, 0.93]) { ctx.fillStyle = 'rgba(255,248,214,.55)'; rr(W*fx - 70, 36, 140, 22, 6); ctx.fill();
    ctx.fillStyle = '#fffdf2'; rr(W*fx - 58, 41, 116, 12, 4); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(60,64,80,.3)'; ctx.stroke(); }
  for (const fx of [0.27, 0.82]) { ell(W*fx, 70, 15, 9); ctx.fillStyle = '#d7dae0'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); }
  ctx.fillStyle = '#d6d9df'; ctx.fillRect(-20, ceilB, W + 40, winT - ceilB - 7);
  // outside: sky, clouds, far hills, gum trees, fields, the road and the Camry
  ctx.save(); ctx.beginPath(); ctx.rect(-20, winT, W + 40, R.h); ctx.clip();
  ctx.fillStyle = '#a9dcf3'; ctx.fillRect(-20, winT, W + 40, R.h); ctx.fillStyle = '#d4eef9'; ctx.fillRect(-20, winT + R.h*0.3, W + 40, R.h*0.3);
  cloud(W*0.12, winT + 34, 0.42); cloud(W*0.47, winT + 26, 0.32); cloud(W*0.74, winT + 40, 0.45);
  ctx.fillStyle = '#b4cfc6'; ctx.beginPath(); ctx.moveTo(-20, grassY); ctx.quadraticCurveTo(W*0.25, grassY - 80, W*0.5, grassY - 10); ctx.quadraticCurveTo(W*0.8, grassY - 95, W + 20, grassY - 20); ctx.lineTo(W + 20, grassY); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#93b9a0'; ctx.beginPath(); ctx.moveTo(-20, grassY); ctx.quadraticCurveTo(W*0.15, grassY - 40, W*0.35, grassY - 6); ctx.quadraticCurveTo(W*0.6, grassY - 46, W + 20, grassY - 4); ctx.lineTo(W + 20, grassY); ctx.closePath(); ctx.fill();
  for (const [fx, sc] of [[0.04, 0.5], [0.19, 0.42], [0.33, 0.55], [0.5, 0.4], [0.64, 0.48], [0.97, 0.52]]) gum(W*fx, grassY + 4, sc);
  ctx.fillStyle = C.grass; ctx.fillRect(-20, grassY, W + 40, R.h); ctx.fillStyle = '#74b84c'; ctx.fillRect(-20, grassY, W + 40, 6);
  ctx.fillStyle = '#c7c3b8'; ctx.fillRect(-20, grassY + 34, W + 40, 7); ctx.fillStyle = '#6b6f7a'; ctx.fillRect(-20, grassY + 41, W + 40, R.h);
  if (typeof camry === 'function') { const [cx, cy] = s2LlcCar(R); camry(cx, cy, 0.42, {}); }
  ctx.restore();
  // the pane he jumps through: glass streaks, or what is left of it
  ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip();
  if (!broken) { ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(R.x + R.w*0.08, R.y + R.h*0.62); ctx.lineTo(R.x + R.w*0.24, R.y + R.h*0.14); ctx.moveTo(R.x + R.w*0.19, R.y + R.h*0.66); ctx.lineTo(R.x + R.w*0.31, R.y + R.h*0.3); ctx.stroke(); }
  else { ctx.fillStyle = 'rgba(205,236,250,.85)'; ctx.strokeStyle = C.line; ctx.lineWidth = 3;
    for (const [px, py, a, b] of [[R.x, R.y, 1, 1], [R.x + R.w, R.y, -1, 1], [R.x, R.y + R.h, 1, -1], [R.x + R.w, R.y + R.h, -1, -1]]) {
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + a*R.w*0.16, py); ctx.lineTo(px + a*R.w*0.05, py + b*R.h*0.08); ctx.lineTo(px + a*R.w*0.07, py + b*R.h*0.2); ctx.lineTo(px, py + b*R.h*0.13); ctx.closePath(); ctx.fill(); ctx.stroke(); } }
  ctx.restore();
  // window frames: a top rail, a transom, thin mullions, one wide pillar, the frame round his pane
  ctx.fillStyle = '#454c5a'; ctx.fillRect(-20, winT - 7, W + 40, 9); ctx.fillRect(-20, winT + R.h*0.27 - 3, W + 40, 6);
  for (const fx of [0, 0.145, 0.29, R.x/W, (R.x + R.w)/W, 1]) ctx.fillRect(W*fx - 4, winT, 8, R.h);
  ctx.fillStyle = '#d9dce2'; ctx.fillRect(W*0.43 - 15, winT - 7, 30, R.h + 7); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.strokeRect(W*0.43 - 15, winT - 7, 30, R.h + 7);
  ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.strokeRect(R.x, R.y, R.w, R.h);
  // bunting across each pane
  const spans = [[0, 0.145], [0.145, 0.29], [0.29, 0.416], [0.444, R.x/W], [R.x/W, (R.x + R.w)/W], [(R.x + R.w)/W, 1]];
  spans.forEach(([a, b], si) => {
    const x0 = W*a + 6, x1 = W*b - 6, y0 = winT + 12, sag = 20, at = u => [lerp(x0, x1, u), y0 + 4*sag*u*(1 - u)];
    ctx.strokeStyle = 'rgba(74,47,12,.55)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 12; i++) { const [px, py] = at(i/12); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
    ctx.stroke();
    const n = Math.max(3, Math.floor((x1 - x0)/26));
    for (let i = 0; i < n; i++) { const [px, py] = at((i + 0.5)/n); ctx.beginPath(); ctx.moveTo(px - 8, py); ctx.lineTo(px + 8, py); ctx.lineTo(px, py + 17); ctx.closePath();
      ctx.fillStyle = S2_BUNT[(i + si*2) % S2_BUNT.length]; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(74,47,12,.5)'; ctx.stroke(); }
  });
  // the low cabinet under the windows, books standing face out on top
  ctx.fillStyle = '#e8e2d6'; ctx.fillRect(-20, winB, W + 40, cabT - winB);
  for (let i = 0, x = 14; x < W - 10; i++, x += 36 + (i % 3)*6) {
    if (x > W*0.43 - 30 && x < W*0.43 + 20) continue;
    ctx.save(); ctx.translate(x, cabT); ctx.rotate(((i*7) % 5 - 2)*0.03); rr(-12, -30, 24, 30, 3); ctx.fillStyle = S2_BOOKS[(i*3) % S2_BOOKS.length]; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.line; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(-7, -23, 14, 4); ctx.fillRect(-7, -15, 10, 3); ctx.restore();
  }
  ctx.fillStyle = '#eceef2'; ctx.fillRect(-20, cabT, W + 40, cabB - cabT); ctx.fillStyle = '#cfd3db'; ctx.fillRect(-20, cabT, W + 40, 6);
  ctx.strokeStyle = 'rgba(60,64,80,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-20, (cabT + cabB)/2); ctx.lineTo(W + 20, (cabT + cabB)/2); ctx.stroke();
  ctx.globalAlpha = 0.7;
  for (let i = 0, x = 6; x < W; i++, x += 12 + (i % 4)*3) { ctx.fillStyle = S2_BOOKS[(i*5) % S2_BOOKS.length]; ctx.fillRect(x, cabT + 10 + (i % 3)*2, 9, (cabB - cabT)/2 - 14 - (i % 3)*2); ctx.fillRect(x + 3, (cabT + cabB)/2 + 4, 9, (cabB - cabT)/2 - 8); }
  ctx.globalAlpha = 1; ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(-20, cabT); ctx.lineTo(W + 20, cabT); ctx.moveTo(-20, cabB); ctx.lineTo(W + 20, cabB); ctx.stroke();
  // dark carpet
  ctx.fillStyle = '#3b3f4d'; ctx.fillRect(-20, cabB, W + 40, H - cabB);
  ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 2;
  for (let y = cabB + 22; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(-20, y); ctx.lineTo(W + 20, y); ctx.stroke(); }
  // the white table with green plastic chairs (left), the wooden book trolley (right)
  const gy = H*0.84, tx0 = W*0.03, tx1 = W*0.29, tt = gy - 92;
  for (const fx of [0.09, 0.23]) { ctx.fillStyle = '#86b08a'; rr(W*fx - 32, tt - 52, 64, 56, 14); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke(); }
  ctx.strokeStyle = '#5b6070'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath();
  for (const x of [tx0 + 14, tx1 - 14]) { ctx.moveTo(x, tt + 12); ctx.lineTo(x, gy - 18); }
  ctx.stroke(); ctx.lineCap = 'butt';
  ctx.fillStyle = '#f7f7f9'; rr(tx0, tt, tx1 - tx0, 16, 4); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
  const rx0 = W*0.64, rx1 = W*0.86, rt = gy - 150, rb = gy - 22;
  ctx.fillStyle = '#d9a76a'; rr(rx0, rt, rx1 - rx0, rb - rt, 6); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
  for (let row = 0; row < 2; row++) {
    const by = rt + 50 + row*40;
    ctx.fillStyle = '#b8864f'; ctx.fillRect(rx0 + 6, by, rx1 - rx0 - 12, 4);
    for (let i = 0, x = rx0 + 10; x < rx1 - 18; i++, x += 13 + (i % 3)*2) { ctx.fillStyle = S2_BOOKS[(i*3 + row) % S2_BOOKS.length]; rr(x, by - 30 + (i % 2)*3, 11, 30 - (i % 2)*3, 2); ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(74,47,12,.6)'; ctx.stroke(); }
  }
  for (let i = 0; i < 4; i++) {
    const x = rx0 + 20 + i*((rx1 - rx0 - 40)/3);
    ctx.save(); ctx.translate(x, rt + 4); ctx.rotate(-0.08 + i*0.05); rr(-15, -34, 30, 38, 3);
    ctx.fillStyle = S2_BOOKS[(i*5 + 2) % S2_BOOKS.length]; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = C.line; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(-9, -26, 18, 4); ctx.restore();
  }
  for (const x of [rx0 + 16, rx1 - 16]) { ell(x, rb + 10, 9, 9); ctx.fillStyle = '#2f3340'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke(); }
  ctx.restore();
  // the QUIET STUDY sign hanging from the ceiling (it swings at the sneeze)
  ctx.save(); ctx.translate(95, 0); ctx.rotate(signSwing); ctx.translate(-95, 0);
  ctx.strokeStyle = C.line; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(40, 26); ctx.moveTo(150, 0); ctx.lineTo(150, 26); ctx.stroke();
  ctx.fillStyle = '#e8d3a2'; rr(18, 26, 154, 34, 8); ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
  font(18); ctx.fillStyle = C.line; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(LINES_SCHOOL2.llc.sign, 95, 44);
  ctx.restore();
}
// a 4-point twinkle (the glint on the car)
function s2Spark(x, y, r, rot){
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = i*Math.PI/4, rr0 = i % 2 ? r*0.28 : r; ctx.lineTo(Math.cos(a)*rr0, Math.sin(a)*rr0); }
  ctx.closePath(); ctx.fillStyle = '#fff6b0'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke(); ctx.restore();
}
// Max, 12 Oct: "this part, "oh, a car!" pause. I want to ride it. "pause 5s, nai long makes a funny face" jumps out the window."
// The tiptoe and the ACHOO stay from before; the ending is his. sceneEscape opens outside, on the burst at this window.
const LLC_T = {ach: 7.05, car: 9.65, oh: 10.05, ohEnd: 12.05, ride: 13.05, rideEnd: 15.15, face: 15.35, jump: 18.85, fly: 19.15, hit: 19.7};   // ach 7.05: "Nobody heard a thing." stays 2.5 s real
// the pause after "Oh, a car!" is ohEnd to ride (1.0 scene s = 1.4 s real); the funny face is face to jump (3.5 scene s = 5.0 s real)
const S2_LLC_SFX = [
  ...[0.5, 1.6, 2.7, 3.8].map(a => [a + 0.55, 'squeak', {p: 1.3, g: 0.5}]),          // every tiptoe stride ends on a squeak
  [LLC_T.ach, 'thud', {p: 0.7}], [LLC_T.ach + 0.05, 'books'],                        // ACHOO: the shelves jump, the books fly
  [LLC_T.car, 'ding'], [LLC_T.oh, 'boing', {p: 1.2}],
  [LLC_T.face, 'boing', {p: 0.7}], [LLC_T.face + 1.75, 'squeak', {p: 0.8, g: 0.5}],
  [LLC_T.jump, 'squeak', {p: 0.7, g: 0.6}], [LLC_T.fly, 'whoosh'], [LLC_T.hit, 'glass'],
];
function sceneLLC(t){
  const L = LINES_SCHOOL2.llc, gy = H*0.84, E = LLC_T, ACH = E.ach, WR = s2LlcWin();
  s2Cues('llc', t, S2_LLC_SFX);
  const kk = t - ACH, shake = kk > 0 && kk < 0.7 ? Math.sin(t*70)*7*(1 - kk/0.7) : 0;
  const swing = kk > 0 ? Math.sin(kk*7)*0.12*Math.exp(-kk*1.1) : 0;
  // ---- Nailong (worked out first: the camera pushes in on him for the funny face) ----
  const xs = [-100, W*0.10, W*0.24, W*0.36, W*0.46], tS = [0.5, 1.6, 2.7, 3.8], SD = 0.55;
  let x = xs[4], y = gy, s = 1, sx = 1, sy = 1, rot = 0, squeakI = -1, squeakK = 0, sneezeAmp = 0, face = -1, gone = false;
  const o = {mouth: 'smile', arms: 'down', look: [1, 0]};
  for (let i = 0; i < 4; i++) {                              // four tiptoe strides, a squeak at the end of each
    if (t < tS[i]) { x = xs[i]; break; }
    if (t < tS[i] + SD) { const k = (t - tS[i])/SD; x = lerp(xs[i], xs[i + 1], ease(k)); y -= Math.sin(Math.PI*k)*16; o.walk = t*16; break; }
    x = xs[i + 1];
    const f = t - tS[i] - SD;
    if (f < 0.55 && (i < 3 || t < 4.4)) { squeakI = i; squeakK = f; sy = 1 - 0.1*Math.exp(-f*10); sx = 1 + 0.07*Math.exp(-f*10); o.mouth = 'o'; o.look = [f < 0.28 ? -1 : 1, 0.1]; }
  }
  if (t > 4.4 && t < ACH - 0.85) o.look = [0, -0.1];
  else if (t >= ACH - 0.85 && t < ACH) { const k = ease((t - (ACH - 0.85))/0.8); o.arms = 'up'; o.flail = t*20; o.mouth = 'open'; o.look = [0, -1]; rot = -0.14*k; sy = 1 + 0.22*k; sx = 1 - 0.1*k; sneezeAmp = k; }
  else if (t >= ACH && t < ACH + 0.5) { const k = (t - ACH)/0.5; rot = lerp(0.3, 0, k); sx = lerp(0.8, 1.1, k); sy = lerp(1.2, 0.9, k); o.mouth = 'open'; o.look = [0, 0.5]; x -= 30*(1 - k); }
  else if (t >= ACH + 0.5 && t < E.car) { const f = t - ACH - 0.5; o.mouth = 'o'; o.look = [Math.sin(f*3), 0]; sy = 1 + Math.sin(f*2)*0.01; }
  else if (t >= E.car && t < E.oh) { const k = ease(s2Tw(t, E.car, E.car + 0.35)); o.mouth = 'o'; o.look = [k, -0.7*k]; }          // he spots the car
  else if (t >= E.oh && t < E.ohEnd) { const q = s2Pulse(t, E.oh, E.oh + 0.35); o.mouth = 'o'; o.look = [1, -0.7]; o.arms = 'up'; o.flail = t*10; sy = 1 + 0.12*q; sx = 1 - 0.06*q; y -= 22*q; }
  else if (t >= E.ohEnd && t < E.ride) { o.look = [1, -0.7]; rot = 0.07*ease(s2Tw(t, E.ohEnd, E.ohEnd + 0.6)) + Math.sin(t*1.5)*0.01; }   // the pause: he just stares at it
  else if (t >= E.ride && t < E.face) { o.look = [1, -0.6]; o.mouth = t < E.rideEnd - 0.3 && Math.sin(t*16) > 0 ? 'open' : 'smile'; rot = 0.07*(1 - s2Tw(t, E.rideEnd, E.face)); }
  else if (t >= E.face && t < E.jump) {                      // the funny face, five real seconds, straight at us
    const f = t - E.face, pop = s2Pulse(f, 0, 0.3); face = 3; o.look = [0, 0];
    rot = Math.sin(f*4.4)*0.09; sx = 1 + 0.05*Math.sin(f*8.8) + 0.12*pop; sy = 1 - 0.05*Math.sin(f*8.8) - 0.1*pop;
  } else if (t >= E.jump && t < E.fly) { const k = ease(s2Tw(t, E.jump, E.fly)); sy = 1 - 0.26*k; sx = 1 + 0.16*k; o.look = [1, -0.8]; o.mouth = 'open'; }   // crouch
  else if (t >= E.fly && t < E.hit) {                        // the leap: up into the window, smaller as he goes away from us, head first
    const k = s2Tw(t, E.fly, E.hit), wx = WR.x + WR.w*0.5, wy = WR.y + WR.h*0.62;
    x = lerp(xs[4], wx, k); y = lerp(gy, wy + 50, k) - Math.sin(Math.PI*k)*150; s = lerp(1, 0.5, k); rot = lerp(0.1, 1.25, k);
    sx = 0.86; sy = 1.2; o.arms = 'up'; o.flail = t*20; o.mouth = 'open'; o.look = [1, -0.5];
  } else if (t >= E.hit) gone = true;

  const z = 1 + 0.16*ease(s2Tw(t, E.face, E.face + 1.2))*(1 - ease(s2Tw(t, E.jump - 0.4, E.jump)));
  ctx.save();
  if (z > 1.0005) { const cx = xs[4], cy = gy - 125; ctx.translate(cx, cy); ctx.scale(z, z); ctx.translate(-cx, -cy); }
  s2Library(shake, swing, t >= E.hit, WR);
  // books jump off the cabinet and the trolley at the sneeze
  if (kk > 0) [[0.08, 0.53, 0], [0.2, 0.53, 1], [0.33, 0.53, 2], [0.52, 0.53, 3], [0.68, 0.64, 4], [0.8, 0.64, 5]].forEach(([fx, fyy, i]) => {
    const vy = -520 - i*40, bx = W*fx + (i - 2)*18*kk, byy = H*fyy + vy*kk + 1500*kk*kk/2*0.6;
    if (byy < gy - 10 && kk < 1.6) { ctx.save(); ctx.translate(bx, byy); ctx.rotate(kk*(6 + i)); rr(-9, -32, 18, 64, 3); ctx.fillStyle = S2_BOOKS[(i*3) % S2_BOOKS.length]; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke(); ctx.restore(); } });
  // the glint on the car that catches his eye
  const gk = s2Tw(t, E.car - 0.1, E.car + 0.8);
  if (gk > 0 && gk < 1) { const [cx, cy] = s2LlcCar(WR); s2Spark(cx + 22, cy - 44, 26*Math.sin(Math.PI*gk), gk*2); }
  if (!gone) s2NL(x, y, s, Object.assign(o, {sx, sy, rot}), face >= 0 ? () => s2FaceDraw(face, t) : null);
  if (sneezeAmp > 0) for (let i = 0; i < 3; i++) { const ph = (t*3 + i/3) % 1; ell(x + 40 + ph*40, y - 190 + ph*20 - i*6, 3 + ph*3, 3 + ph*3); ctx.fillStyle = `rgba(255,255,255,${0.8 - ph*0.8})`; ctx.fill(); }
  // he goes through the window: a white burst and the glass flying
  const hk = s2Tw(t, E.hit, E.hit + 0.55);
  if (t >= E.hit && hk < 1) {
    const cx = WR.x + WR.w*0.5, cy = WR.y + WR.h*0.55, r = lerp(50, 190, 1 - (1 - hk)*(1 - hk));
    ctx.save(); ctx.globalAlpha = 1 - hk; ctx.beginPath();
    for (let i = 0; i < 20; i++) { const a = i*Math.PI/10 + 0.2, rr0 = i % 2 ? r*0.55 : r; ctx.lineTo(cx + Math.cos(a)*rr0, cy + Math.sin(a)*rr0*0.8); }
    ctx.closePath(); ctx.fillStyle = '#fff6b0'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.line; ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = i*0.53 + 0.3, d = hk*(140 + (i % 4)*50), sx2 = cx + Math.cos(a)*d, sy2 = cy + Math.sin(a)*d*0.8 + 260*hk*hk;
      ctx.save(); ctx.translate(sx2, sy2); ctx.rotate(hk*(5 + i)); ctx.beginPath(); ctx.moveTo(-12, -8); ctx.lineTo(14, -4); ctx.lineTo(-2, 12); ctx.closePath();
      ctx.fillStyle = '#cdeefa'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = C.line; ctx.stroke(); ctx.restore();
    }
    ctx.restore();
  }
  // ---- words ----
  if (squeakI >= 0 && squeakK < 0.5) title(L.squeak, x + 60 + squeakI*8, gy - 18 - squeakK*40, 28, '#fff');
  const nTop = y - 195*sy;
  if (t > 1.0 && t < 2.9) bubble(L.whisper, x, nTop, 26, 280);
  if (t > 4.45 && t < ACH - 0.85) bubble(L.smug, x, nTop, 26, 300);
  if (t > ACH - 0.85 && t < ACH) bubble(L.ah, x, nTop, 28, 240);
  if (t > ACH && t < ACH + 0.8) { const q = (t - ACH)/0.8; title(L.achoo, W*0.5 + Math.sin(t*50)*(1 - q)*6, H*0.3, Math.min(150, W/8)*(1 + 0.25*(1 - q)), '#fff'); }
  if (t > ACH + 0.7 && t < ACH + 2.3) bubble(L.sorry, x, nTop, 24, 200);
  if (t > E.oh && t < E.ohEnd) bubble(L.car, x + 30, nTop - 20, 32, 300);
  if (t > E.ride && t < E.rideEnd) bubble(L.ride, x + 30, nTop, 30, 320);
  ctx.restore();
}
const S2_LLC_DUR = LLC_T.hit + 0.6;                       // scene seconds (29.0 s real); the burst plays out, then sceneEscape
