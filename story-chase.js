"use strict";
// ---------- the Mr Shou chase along the real route (Max, 13 Oct) ----------
// Max: "A few photos of the school, it goes sports hall. Then the small rooms, and then junior school" and "it's a full slide and then
// mr shou grabs the bottom of the slide and somehow it wobbles and collapses the walls inside".
// Nailong runs flat out with an angry Mr Shou behind him hurling Methods books: past the Sports & Performing Arts Centre (a book drops
// through the netball ring), along the small rooms courtyard (TR1 to TR3, bags on hooks; a book lands in the yellow-lid bin), past the
// Primary School Hub (he hurdles one), into the Junior School atrium, up the stairs and head first into the red tube slide. A full ride
// down the inside ("Oh, it's bigger than it looks."). Mr Shou runs round to the bottom, grabs the mouth of the slide and shakes it: the
// wobble runs up the tube, the walls inside crack into eight panels a ring and fall away into the white, and Nailong drops onto the
// floating octagon: the first frame of games/octagon.js (ogPreview, the same camera, the same Nailong, the card's wash).
// A pure function of t in scene seconds (main.js plays clips at 70%). Everything here is prefixed ch / CH; it calls story.js's helpers.
const LINES_CHASE = {
  shout: 'NAILONG!',                                    // Mr Shou (from Max's "Nailong! You're cooked!", as in sceneCafe3)
  sportsSign: ['SPORTS & PERFORMING', 'ARTS CENTRE'],   // the real sign on the stone wall
  doors: ['TR1', 'TR2', 'TR3', 'TR4', 'TR5'],           // the real door labels in the small rooms courtyard (Max, 13 Oct: "TR5 is the furthest on the right and TR1 on the left")
  hubSign: ['PRIMARY SCHOOL', 'HUB'],                   // the real sign on the stone chimney
  swish: 'SWISH!',                                      // placeholder, Max to edit: the book drops through the netball ring (sound word)
  slideBig: "Oh, it's bigger than it looks.",           // Max's line
  wheee: 'wheee!',                                      // placeholder, Max to edit
  rattle: 'RATTLE RATTLE',                              // placeholder, Max to edit: Mr Shou shaking the slide (sound word)
  uhOh: 'uh oh...',                                     // Max's line
};
const CHASE_DUR = 16.0;
const CH = {
  seg: [0, 2.4, 4.7, 7.0],                              // sports centre, small rooms courtyard, Primary School Hub; the atrium from 7.0
  stairs: 7.28, top: 7.6, plat: 7.7, dive: 7.76, gone: 8.1, shouStop: 7.95, cut: 8.45,
  big: [8.85, 10.85], wheee: [10.95, 11.75], out: 11.8,
  run: [11.85, 12.28], grab: 12.3, shake: 12.38, in2: 13.6,
  uh: [13.75, 14.95], crack: 14.05, peel: 14.3, hang: 14.78, drop: 14.98, land: 15.35, still: 15.7, wash: [15.55, 16.0],
};
const CH_NS = 0.68, CH_SS = 0.95;                       // Nailong's and Mr Shou's sizes outside
const CH_WHIPS = [0, CH.seg[1], CH.seg[2], CH.seg[3]];  // whip pans between the places (and in from sceneCafe3)
// one throw per place: released at rel, there at land (seconds into that place)
const CH_THROWS = [{rel: 0.7, land: 1.25, w: 'y'}, {rel: 0.65, land: 1.2, w: 'r'}, {rel: 0.5, land: 0.9, w: 'y'}];
const CH_HOP = [1.0, 1.4];                              // at the Hub he hurdles the third one
const CHASE_SFX = [
  ...Array.from({length: 62}, (_, i) => [0.04 + i*0.12, 'tick', {p: 0.75 + (i % 2)*0.1, g: 0.22}]),                       // pitter-patter, flat out
  ...Array.from({length: 30}, (_, i) => [0.1 + i*0.24, 'tick', {p: 0.45, g: 0.2}]),                                       // Mr Shou's heavier feet
  ...CH_THROWS.map((th, i) => [CH.seg[i] + th.rel, 'whoosh', {p: 1.3, g: 0.7}]),
  [CH.seg[0] + 1.25, 'swish', {p: 1.4, g: 0.9}], [CH.seg[0] + 1.47, 'thud', {p: 1.5, g: 0.4}], [CH.seg[0] + 1.65, 'boing', {p: 1.8, g: 0.25}],   // through the ring, onto the court
  [CH.seg[1] + 1.2, 'thwack', {p: 1.1, g: 0.6}], [CH.seg[1] + 1.28, 'clink', {p: 0.8, g: 0.5}], [CH.seg[1] + 1.52, 'thud', {p: 0.9, g: 0.7}],   // into the bin, lid slams
  [CH.seg[2] + 0.9, 'thud', {p: 1.4, g: 0.6}], [CH.seg[2] + CH_HOP[0], 'boing', {p: 1.5, g: 0.5}],                       // the hurdle
  ...CH_WHIPS.map(b => [b - 0.1, 'swish', {p: 1.2, g: 0.8}]),
  ...[0, 1, 2, 3, 4].map(i => [CH.stairs + i*0.07, 'tick', {p: 0.8 + i*0.1, g: 0.3}]),                                    // up the stairs
  [CH.dive, 'whoosh', {p: 0.8}], [CH.dive + 0.2, 'squeak', {p: 0.7, g: 0.6}], [CH.gone, 'pop', {p: 0.6, g: 0.6}],          // head first into the tube
  [CH.cut - 0.12, 'swish', {p: 0.9}], [CH.cut + 0.1, 'thud', {p: 1.6, g: 0.45}],                                         // the cut, he plops down inside
  [CH.cut + 0.3, 'squeak', {p: 0.45, g: 0.8}], [9.6, 'whoosh', {p: 0.5, g: 0.5}], [10.5, 'squeak', {p: 0.5, g: 0.7}], [11.0, 'whoosh', {p: 0.7, g: 0.6}],   // the ride
  [CH.out, 'swish', {p: 0.8, g: 0.7}], ...[0, 1, 2, 3].map(i => [CH.run[0] + i*0.11, 'tick', {p: 0.5, g: 0.4}]),         // outside, Mr Shou runs round
  [CH.grab, 'thud', {p: 0.8, g: 0.8}], [CH.grab + 0.02, 'clink', {p: 0.6, g: 0.5}],                                      // he grabs the slide
  ...Array.from({length: 10}, (_, i) => [CH.shake + 0.02 + i*0.12, i % 2 ? 'thwack' : 'books', {p: 0.6 + (i % 3)*0.12, g: 0.4}]),   // RATTLE RATTLE
  [CH.in2, 'thud', {p: 0.6, g: 0.9}], [CH.in2 + 0.02, 'shutter', {p: 0.7, g: 0.6}],                                        // the wobble reaches him
  [CH.crack, 'crash', {p: 1.3, g: 0.7}], [CH.crack + 0.05, 'snip', {p: 0.7, g: 0.6}],                                      // the tube cracks into panels
  ...[0, 1, 2, 3, 4, 5].map(i => [CH.peel + i*0.13, i % 2 ? 'whoosh' : 'crash', {p: 0.5 + i*0.08, g: 0.45}]),              // and the panels fall away
  [CH.drop, 'whoosh', {p: 1.3, g: 0.8}], [CH.land, 'thud', {p: 1.1, g: 0.8}], [CH.land + 0.03, 'boing', {p: 1.3, g: 0.4}],  // he drops onto the octagon
];

// ---------- small drawing helpers ----------
function chFS(fill, lw = 4){ ctx.fillStyle = fill; ctx.fill(); if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = C.line; ctx.lineJoin = 'round'; ctx.stroke(); } }
function chRect(x, y, w, h, fill, lw = 4, r = 0){ rr(x, y, w, h, r); chFS(fill, lw); }
function chSign(lines, x, y, w, h){                     // a black sign with white capitals, sized to fit
  chRect(x, y, w, h, '#17181c', 4, 4);
  let size = h/(lines.length*1.25 + 0.3); font(size, 700);
  const wid = Math.max(...lines.map(l => ctx.measureText(l).width)); if (wid > w*0.88) { size *= w*0.88/wid; font(size, 700); }
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, x + w/2, y + h/2 + (i - (lines.length - 1)/2)*size*1.18));
}
function chBricks(x, y, w, h, base = '#c45a3c', lw = 4){
  ctx.fillStyle = base; ctx.fillRect(x, y, w, h);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.strokeStyle = 'rgba(255,225,205,.38)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let r = 0, yy = y + 13; yy < y + h + 13; yy += 13, r++) { ctx.moveTo(x, yy); ctx.lineTo(x + w, yy);
    for (let xx = x + (r % 2 ? 0 : 19); xx < x + w; xx += 38) { ctx.moveTo(xx, yy - 13); ctx.lineTo(xx, yy); } }
  ctx.stroke(); ctx.restore();
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = C.line; ctx.strokeRect(x, y, w, h); }
}
function chStone(x, y, w, h, seed = 1){                 // a rough stone wall: grey-brown stones with dark joints
  ctx.fillStyle = '#4e4945'; ctx.fillRect(x, y, w, h);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const cols = ['#857b72', '#6f6862', '#958a7e', '#5f5a55', '#7b7068'];
  for (let r = 0, yy = y; yy < y + h; yy += 24, r++) for (let i = 0, xx = x - (r % 2)*20; xx < x + w; i++) {
    const sw = 30 + stRnd(seed*97 + r*13 + i)*30; ctx.fillStyle = cols[Math.floor(stRnd(seed*31 + r*7 + i*3)*5)];
    rr(xx + 2, yy + 2, sw - 4, 20, 6); ctx.fill(); xx += sw;
  }
  ctx.restore(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.strokeRect(x, y, w, h);
}
function chCanopy(blobs, cols){                         // tree leaves: all the outlines first, then the fills, so the blobs read as one
  for (const [bx, by, rx, ry] of blobs) { ell(bx, by, rx, ry); ctx.lineWidth = 10; ctx.strokeStyle = C.line; ctx.stroke(); }
  blobs.forEach(([bx, by, rx, ry], i) => { ell(bx, by, rx, ry); ctx.fillStyle = cols[i % cols.length]; ctx.fill(); });
}
function chPlaneTree(x, gy, s){                         // the big plane tree by the courts
  ctx.save(); ctx.translate(x, gy); ctx.scale(s, s); ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-26, 0); ctx.quadraticCurveTo(-12, -130, -70, -250); ctx.lineTo(-52, -258); ctx.quadraticCurveTo(-4, -190, 4, -170);
  ctx.quadraticCurveTo(40, -230, 96, -262); ctx.lineTo(106, -248); ctx.quadraticCurveTo(40, -190, 24, -110); ctx.lineTo(28, 0); ctx.closePath(); chFS('#8f8170', 6);
  chCanopy([[-150, -330, 120, 82], [-20, -400, 150, 100], [130, -350, 130, 88], [-90, -270, 110, 60], [70, -280, 120, 62], [210, -300, 70, 50]], ['#5f9e46', '#4f8a3b', '#6aab4e']);
  ctx.restore();
}
function chMaple(x, gy, s){                             // a Japanese maple: thin trunk, light airy leaves
  ctx.save(); ctx.translate(x, gy); ctx.scale(s, s); ctx.lineCap = 'round';
  for (const [w, c] of [[16, C.line], [9, '#6b5a4b']]) { ctx.lineWidth = w; ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-8, -120, 10, -230); ctx.moveTo(-3, -120); ctx.quadraticCurveTo(-40, -170, -70, -210); ctx.moveTo(4, -150); ctx.quadraticCurveTo(50, -190, 80, -220); ctx.stroke(); }
  chCanopy([[-80, -250, 70, 46], [10, -290, 90, 56], [95, -250, 70, 44], [-30, -215, 60, 34], [50, -215, 60, 34]], ['#7cbf55', '#69ad47', '#8acb62']);
  ctx.restore();
}
function chBag(x, y, i){                                // a school bag on a hook
  ctx.fillStyle = '#3a3a3a'; ctx.fillRect(x - 2, y - 8, 4, 9);
  const col = ['#232a3d', '#1d1f24', '#2b3550', '#1d1f24'][i % 4];
  rr(x - 13, y, 26, 34, 8); chFS(col, 3);
  rr(x - 8, y + 16, 16, 12, 4); ctx.fillStyle = i % 3 === 0 ? '#b8323a' : 'rgba(255,255,255,.18)'; ctx.fill();
}
function chBin(x, y, lid, open = 0){                    // a wheelie bin, feet at (x, y), lid colour, open 0..1 (the lid flips back)
  rr(x - 27, y - 92, 54, 90, 6); chFS('#2f3b35', 4);
  ctx.fillStyle = '#1b1f1d'; ell(x - 16, y - 2, 7, 7); ctx.fill(); ell(x + 16, y - 2, 7, 7); ctx.fill();
  ctx.save(); ctx.translate(x + 29, y - 94); ctx.rotate(-open*2.2); rr(-60, -9, 62, 12, 4); chFS(lid, 4); ctx.restore();
}

// ---------- the three places, drawn in world coordinates (x from about -0.5 W to 1.9 W; the camera pans 0.5 W through each) ----------
function chSports(gy){
  const X = f => f*W, base = gy - 60;
  chRect(X(-0.6), gy - 300, X(1.0), 250, '#e8925a');                                   // the orange two-storey block behind the tree
  for (let i = 0; i < 8; i++) chRect(X(-0.56) + i*X(0.12), gy - 276, X(0.06), 46, '#cfe3ee', 3, 2);
  chBricks(X(-0.6), gy - 165, X(1.02), 105);
  for (let i = 0; i < 7; i++) chRect(X(-0.54) + i*X(0.15), gy - 150, X(0.05), 90, '#2f3438', 3, 2);
  chRect(X(-0.6), gy - 180, X(1.04), 16, '#45413e');
  for (let i = 0; i < 9; i++) chRect(X(-0.58) + i*X(0.12), gy - 166, 9, 106, '#3b3936', 3);
  chPlaneTree(X(0.1), base + 4, 1.05);
  ell(X(0.36), gy - 300, 95, 80); chFS('#3f6b3a', 6);                                  // a dark gum tree peeking over
  chRect(X(0.98), gy - 365, X(0.95), 305, '#565b63', 5);                               // dark grey cladding to the right
  ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let yy = gy - 355; yy < gy - 60; yy += 11) { ctx.moveTo(X(0.98), yy); ctx.lineTo(X(1.93), yy); } ctx.stroke();
  chRect(X(1.36), gy - 300, X(0.57), 240, '#7f97a6', 4);                               // dark glass beyond the stone
  ctx.fillStyle = 'rgba(255,255,255,.25)'; for (let i = 0; i < 4; i++) ctx.fillRect(X(1.4) + i*X(0.14), gy - 290, 14, 220);
  chRect(X(0.42), gy - 470, X(0.51), 410, '#e5e8eb', 5);                               // the big white-silver box
  ctx.strokeStyle = 'rgba(110,120,130,.55)'; ctx.lineWidth = 2.5; ctx.beginPath();
  for (let i = 1; i < 5; i++) { ctx.moveTo(X(0.42) + i*X(0.102), gy - 470); ctx.lineTo(X(0.42) + i*X(0.102), gy - 60); }
  for (const yy of [gy - 432, gy - 330]) { ctx.moveTo(X(0.42), yy); ctx.lineTo(X(0.93), yy); } ctx.stroke();
  chRect(X(0.93), gy - 505, X(0.05), 445, '#8c2330', 5);                               // the maroon strip
  chStone(X(0.98), gy - 300, X(0.38), 240, 3);                                          // the stone wall with the sign
  chSign(LINES_CHASE.sportsSign, X(1.0), gy - 252, Math.max(X(0.31), 250), 74);
  chStone(X(0.5), gy - 236, X(0.045), 176, 7);                                          // stone pillar, then the glass entrance
  chRect(X(0.545), gy - 214, X(0.375), 154, '#cfe1ea', 4);
  ctx.strokeStyle = '#8d96a3'; ctx.lineWidth = 5; ctx.beginPath();
  for (let i = 1; i < 6; i++) { ctx.moveTo(X(0.545) + i*X(0.0625), gy - 214); ctx.lineTo(X(0.545) + i*X(0.0625), gy - 60); } ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(X(0.55) + i*X(0.0625), gy - 200); ctx.lineTo(X(0.57) + i*X(0.0625), gy - 200); ctx.lineTo(X(0.55) + i*X(0.0625), gy - 150); ctx.closePath(); ctx.fill(); }
  for (const [px, kind] of [[X(0.585), 0], [X(0.87), 1]]) {                             // the two posters: a dancer and a basketballer
    chRect(px - 15, gy - 160, 30, 92, '#fafafa', 3, 2);
    ctx.save(); ctx.translate(px, gy - 112); ctx.strokeStyle = '#111'; ctx.fillStyle = '#111'; ctx.lineCap = 'round'; ctx.lineWidth = 4;
    ell(0, -30, 4.5, 4.5); ctx.fill(); ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(0, -4);
    if (kind === 0) { ctx.moveTo(0, -4); ctx.lineTo(-2, 26); ctx.moveTo(0, -4); ctx.lineTo(10, -26); ctx.moveTo(0, -20); ctx.lineTo(-11, -30); ctx.moveTo(0, -20); ctx.lineTo(9, -14); }
    else { ctx.moveTo(0, -4); ctx.lineTo(-6, 22); ctx.moveTo(0, -4); ctx.lineTo(6, 18); ctx.moveTo(0, -20); ctx.lineTo(8, -36); ctx.moveTo(0, -20); ctx.lineTo(-8, -10); }
    ctx.stroke(); if (kind === 1) { ell(10, -40, 5, 5); ctx.fill(); } ctx.restore();
  }
  ctx.beginPath(); ctx.moveTo(X(0.27), gy - 322); ctx.lineTo(X(1.0), gy - 224); ctx.lineTo(X(1.0), gy - 202); ctx.lineTo(X(0.27), gy - 298); ctx.closePath(); chFS('#d6dade', 5);   // the long low angled awning
  ctx.strokeStyle = '#3d4046'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath();
  for (const vx of [X(0.33), X(0.44)]) { ctx.moveTo(vx - X(0.03), gy - 300 + (vx - X(0.3))*0.13); ctx.lineTo(vx, base); ctx.lineTo(vx + X(0.03), gy - 296 + (vx - X(0.24))*0.13); }
  ctx.stroke(); ctx.lineCap = 'butt';
  chBin(X(0.475), base + 2, '#2f6b3a');
  ctx.fillStyle = '#d4d0c8'; ctx.fillRect(X(-0.7), base, X(2.7), 30);                     // the footpath, then the asphalt courts
  ctx.fillStyle = '#4c5057'; ctx.fillRect(X(-0.7), base + 30, X(1.2), H);
  ctx.fillStyle = '#5d626a'; ctx.fillRect(X(0.5), base + 30, X(1.5), H);
  ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(X(-0.7), base + 30); ctx.lineTo(X(2.0), base + 30); ctx.stroke();
  ctx.strokeStyle = '#f2f2f2'; ctx.lineWidth = 5; ctx.beginPath();
  ctx.moveTo(X(-0.3), base + 52); ctx.lineTo(X(0.42), base + 52); ctx.lineTo(X(0.48), H); ctx.moveTo(X(0.75), base + 46); ctx.lineTo(X(1.9), base + 46);
  ctx.moveTo(X(1.3), base + 46); ctx.lineTo(X(1.45), H); ctx.stroke();
  ctx.strokeStyle = '#f2c230'; ctx.beginPath(); ctx.moveTo(X(1.02), base + 34); ctx.lineTo(X(1.22), H); ctx.stroke();
}
// the netball / basketball pole on the court, in front of the maroon strip as in the photo: pole at 0.955 W, the netball ring on its left at chHoop()
const chHoop = () => [0.955*W - 104, H*0.86 - 336];
function chPole(gy, net = 0){
  const px = 0.955*W, [rx, ry] = chHoop();
  ctx.save(); ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(px + 18, gy - 440); ctx.lineTo(px + 98, gy - 452); ctx.lineTo(px + 98, gy - 330); ctx.lineTo(px + 18, gy - 318); ctx.closePath(); chFS('#26272b', 4);   // the black backboard
  ctx.strokeStyle = '#a7acb3'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(px, gy - 356); ctx.lineTo(px + 30, gy - 360); ctx.moveTo(px, gy - 350); ctx.lineTo(rx + 20, ry - 6); ctx.stroke();
  rr(px - 8, gy - 372, 16, 350, 6); chFS('#c3c7cd', 4);                                       // the silver pole
  rr(px - 21, gy - 180, 42, 160, 12); chFS('#d8343a', 4);                                      // padded in red
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(px - 10, gy - 168); ctx.lineTo(px - 10, gy - 34); ctx.stroke();
  ctx.lineWidth = 3; for (const [i, c] of [[0, '#d8343a'], [1, '#f4f4f4'], [2, '#2f5fb8']]) { ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(px + 70 - 16 + i*3, gy - 322 + i*12); ctx.lineTo(px + 70 + 16 - i*3, gy - 322 + i*12); ctx.stroke(); }
  ell(px + 70, gy - 324, 18, 5); ctx.lineWidth = 4; ctx.strokeStyle = '#d8343a'; ctx.stroke();   // the basketball hoop's red, white and blue net
  ctx.strokeStyle = '#f4f4f4'; ctx.lineWidth = 2.5; ctx.beginPath();                             // the netball ring's white net (net: its sway)
  for (let i = 0; i <= 6; i++) { const a = -26 + i*52/6, b = (-12 + i*24/6)*(1 - 0.25*Math.abs(net)) + net*8*Math.sin(i); ctx.moveTo(rx + a, ry); ctx.lineTo(rx + b, ry + 54 + Math.abs(net)*14); }
  for (const k of [0.4, 0.75]) { ctx.moveTo(rx - 26 + 7*k, ry + 54*k); ctx.lineTo(rx + 26 - 7*k, ry + 54*k); }
  ctx.stroke();
  ell(rx, ry, 27, 7); ctx.lineWidth = 9; ctx.strokeStyle = C.line; ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = '#c9ccd1'; ctx.stroke();
  ctx.restore();
}
const CH_CEIL = () => H*0.15, CH_RF = () => H*0.12 + 84;   // the walkway ceiling's bottom; the classrooms' roof edge
function chCourt(gy){
  const X = f => f*W, x0 = X(-0.6), x1 = X(1.95), ww = x1 - x0, ob = H*0.12, rf = CH_RF(), rail = gy - 196, turf = gy - 60;
  chRect(x0, ob, ww, rf - ob, '#e8925a', 0);                                                    // the orange two-storey building behind
  for (let i = 0; i < 22; i++) { const wx = x0 + 30 + i*X(0.115); chRect(wx, ob + 26, X(0.06), 50, '#bcd6e2', 5, 2); ctx.lineWidth = 3; ctx.strokeStyle = '#f7f7f7'; ctx.strokeRect(wx + 4, ob + 30, X(0.06) - 8, 42);
    if (i % 3 === 1) { chRect(wx + X(0.065), ob + 36, 40, 34, '#f1f1f1', 3, 3); ell(wx + X(0.065) + 20, ob + 53, 11, 11); ctx.lineWidth = 2; ctx.stroke(); } }
  chRect(x0, rf, ww, 14, '#8e959c', 4);                                                         // the classrooms' roof edge
  chBricks(x0, rf + 14, ww, rail - rf - 14);
  const doorX = [X(0.1), X(0.32), X(0.54), X(0.76), X(0.98)], dw = Math.max(X(0.06), 62);   // drawn mirrored: the first door ends up furthest right, so it is TR5
  doorX.forEach((dx, i) => {
    chRect(dx, rf + 50, dw, rail - rf - 50, '#3a3f45', 4, 2); chRect(dx + 8, rf + 60, dw - 16, 40, '#6f8794', 3, 2);
    chRect(dx - 6, rf + 20, dw + 12, 26, '#f4f4f4', 3, 3);
    font(20, 700); ctx.fillStyle = '#17181c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(LINES_CHASE.doors[LINES_CHASE.doors.length - 1 - i], dx + dw/2, rf + 34);
  });
  for (let i = 0; ; i++) {                                                                      // bags on hooks along the brick, two rows
    const bx = x0 + 20 + i*34; if (bx > x1) break;
    if (doorX.some(dx => bx > dx - 22 && bx < dx + dw + 22)) continue;
    if (stRnd(i) < 0.72) chBag(bx, rf + 70, i);
    if (stRnd(i + 40) < 0.5) chBag(bx + 6, rf + 118, i + 1);
  }
  ctx.fillStyle = 'rgba(205,228,238,.45)'; ctx.fillRect(X(0.2), rail - 54, X(0.65), 54);       // the glass balustrade
  ctx.strokeStyle = '#a7acb3'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(X(0.2), rail - 54); ctx.lineTo(X(0.85), rail - 54); ctx.stroke();
  chBricks(x0, rail, ww, 14);
  ctx.fillStyle = '#5fae4a'; ctx.fillRect(x0, rail + 14, X(0.8) - x0, turf - rail - 14);         // the sunken astroturf, then the pavers
  ctx.fillStyle = '#6dbb56'; for (let i = 0; x0 + i*X(0.06) < X(0.8); i++) ctx.fillRect(x0 + i*X(0.06), rail + 14, X(0.03), turf - rail - 14);
  const ph = (turf - rail - 14)/3;
  for (let r = 0; r < 3; r++) for (let i = 0; X(0.8) + i*34 < x1; i++) { ctx.fillStyle = (r + i) % 2 ? '#d9cfc2' : '#c3b3a1'; ctx.fillRect(X(0.8) + i*34, rail + 14 + r*ph, 34, ph + 1); }
  ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(X(0.8), rail + 14); ctx.lineTo(X(0.8), turf); ctx.stroke();
  chBricks(X(1.55), rf, X(0.45), turf - rf);                                                    // the tall side wall
}
function chCourtFront(gy, binOpen){                     // the two bins just past the rail, then the walkway's floor, rail, posts and ceiling
  const X = f => f*W, x0 = X(-0.6), x1 = X(1.95), ceil = CH_CEIL();
  chBin(X(1.02), gy - 62, '#d8343a'); chBin(X(1.1), gy - 62, '#f2c230', binOpen);
  ctx.fillStyle = '#c9c6c0'; ctx.fillRect(x0, gy - 60, x1 - x0, H);
  ctx.fillStyle = '#e6c34a'; ctx.fillRect(x0, gy - 60, x1 - x0, 7);
  ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, gy - 60); ctx.lineTo(x1, gy - 60); ctx.stroke();
  ctx.strokeStyle = 'rgba(74,47,12,.18)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 9; i++) { ctx.moveTo(x0 + i*X(0.31), gy - 50); ctx.lineTo(x0 + i*X(0.31) + 40, H); } ctx.stroke();
  for (const yy of [gy - 140, gy - 100]) { rr(x0, yy, x1 - x0, 10, 3); chFS('#34322f', 3); }
  for (let i = 0; x0 + i*X(0.34) < x1; i++) chRect(x0 + 40 + i*X(0.34), ceil, 22, gy - 60 - ceil, '#34322f', 4);
  ctx.fillStyle = '#56514c'; ctx.fillRect(x0, -20, x1 - x0, ceil + 20);
  ctx.strokeStyle = '#46423e'; ctx.lineWidth = 4; ctx.beginPath(); for (let xx = x0; xx < x1; xx += 30) { ctx.moveTo(xx, 0); ctx.lineTo(xx + 30, ceil); } ctx.stroke();
  ctx.strokeStyle = '#2f2d2b'; ctx.lineWidth = 18; ctx.beginPath(); for (let xx = x0 + 80; xx < x1; xx += X(0.5)) { ctx.moveTo(xx, 0); ctx.lineTo(xx + 120, ceil); } ctx.stroke();
  chRect(x0, ceil - 20, x1 - x0, 22, '#34322f', 4);
}
function chHubBg(gy){
  const X = f => f*W, base = gy - 40, x0 = X(-0.6), x1 = X(1.95);
  chRect(x0, gy - 440, X(1.88), 110, '#5b5f66', 4);                                              // dark grey cladding under the roof
  ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 2; ctx.beginPath(); for (let yy = gy - 432; yy < gy - 330; yy += 9) { ctx.moveTo(x0, yy); ctx.lineTo(X(1.28), yy); } ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x0, gy - 462); ctx.lineTo(X(1.3), gy - 448); ctx.lineTo(X(1.3), gy - 430); ctx.lineTo(x0, gy - 442); ctx.closePath(); chFS('#3e4247', 4);   // the long roof edge
  chBricks(x0, gy - 330, X(1.02), 290);                                                           // red brick on the left
  for (const wy of [gy - 315, gy - 205]) { chRect(X(-0.55), wy, X(0.32), 80, '#9fb6c0', 5, 2); ctx.strokeStyle = '#8d96a3'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(X(-0.39), wy); ctx.lineTo(X(-0.39), wy + 80); ctx.stroke(); }
  chRect(X(0.25), gy - 250, 30, 22, '#9aa0a8', 3, 3);
  chRect(X(0.43), gy - 388, X(0.42), 106, '#b7cdd6', 5);                                          // the glass upper band
  ctx.strokeStyle = '#8d96a3'; ctx.lineWidth = 5; ctx.beginPath(); for (let i = 1; i < 6; i++) { ctx.moveTo(X(0.43) + i*X(0.07), gy - 388); ctx.lineTo(X(0.43) + i*X(0.07), gy - 282); } ctx.moveTo(X(0.43), gy - 335); ctx.lineTo(X(0.85), gy - 335); ctx.stroke();
  const cxr = X(0.79), cyr = gy - 336, q = 13;                                                    // the cross of black and white tiles in the window
  for (const [i, j, c] of [[0, -2, '#f4f4f4'], [-1, -1, '#f4f4f4'], [1, -1, '#f4f4f4'], [-2, 0, '#f4f4f4'], [2, 0, '#f4f4f4'], [-1, 1, '#f4f4f4'], [1, 1, '#f4f4f4'], [0, 2, '#f4f4f4'],
    [0, -1, '#111'], [-1, 0, '#111'], [0, 0, '#111'], [1, 0, '#111'], [0, 1, '#111']]) { ctx.fillStyle = c; ctx.fillRect(cxr + i*q - q/2, cyr + j*q - q/2, q, q); }
  chRect(X(0.42), gy - 282, X(0.44), 28, '#f1f1ee', 4);                                           // the white band
  chRect(X(0.43), gy - 254, X(0.33), 214, '#a9c3cf', 5);                                          // the glass ground floor and its doors
  ctx.strokeStyle = '#8d96a3'; ctx.lineWidth = 5; ctx.beginPath(); for (let i = 1; i < 5; i++) { ctx.moveTo(X(0.43) + i*X(0.066), gy - 254); ctx.lineTo(X(0.43) + i*X(0.066), base); } ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.3)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(X(0.44) + i*X(0.066), gy - 240); ctx.lineTo(X(0.46) + i*X(0.066), gy - 240); ctx.lineTo(X(0.44) + i*X(0.066), gy - 180); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = '#d9d2c3'; ctx.fillRect(X(0.592), gy - 160, 6, 40); ctx.fillRect(X(0.6), gy - 160, 6, 40);
  chStone(X(0.76), gy - 200, X(0.17), 160, 5);                                                    // the stone base with the sign, and the chimney
  chStone(X(0.855), gy - 520, X(0.075), 480, 9);
  chSign(LINES_CHASE.hubSign, X(0.765), gy - 172, Math.max(X(0.16), 160), 64);
  chBricks(X(0.93), gy - 400, X(0.34), 360);                                                      // brick on the right, the upper windows
  chRect(X(1.0), gy - 372, X(0.2), 60, '#b7cdd6', 4); ctx.strokeStyle = '#8d96a3'; ctx.lineWidth = 4; ctx.beginPath(); for (let i = 1; i < 4; i++) { ctx.moveTo(X(1.0) + i*X(0.05), gy - 372); ctx.lineTo(X(1.0) + i*X(0.05), gy - 312); } ctx.stroke();
  chRect(X(1.27), gy - 262, X(0.7), 222, '#2c2f33', 4);                                           // the covered walkway to TR1
  for (let i = 0; i < 9; i++) chBag(X(1.4) + i*42, gy - 200, i + 3);
  chRect(X(1.6), gy - 236, Math.max(X(0.05), 56), 196, '#3a3f45', 3); chRect(X(1.6) - 6, gy - 252, Math.max(X(0.05), 56) + 12, 24, '#f4f4f4', 3, 3);
  font(18, 700); ctx.fillStyle = '#17181c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(LINES_CHASE.doors[0], X(1.6) + Math.max(X(0.05), 56)/2, gy - 240);
  chRect(X(1.25), gy - 282, X(0.72), 20, '#3e4247', 4);
  chBricks(X(1.24), gy - 262, X(0.07), 222);                                                      // the brick pillar
  ctx.fillStyle = '#4a3a32'; ctx.fillRect(x0, base - 40, X(0.98), 40);                            // the garden and its hoop-top fence on the left
  ctx.strokeStyle = '#6e5e52'; ctx.lineWidth = 5; ctx.beginPath();
  for (let xx = x0; xx < X(0.38); xx += 22) { ctx.moveTo(xx, base); ctx.lineTo(xx, base - 70); ctx.moveTo(xx + 22, base - 70); ctx.arc(xx + 11, base - 70, 11, 0, Math.PI, true); }
  ctx.moveTo(x0, base - 30); ctx.lineTo(X(0.38), base - 30); ctx.stroke();
  ctx.fillStyle = '#d3cfc8'; ctx.fillRect(x0, base, x1 - x0, H);                                   // the concrete courtyard
  ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, base); ctx.lineTo(x1, base); ctx.stroke();
  ctx.strokeStyle = 'rgba(74,47,12,.22)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < 8; i++) { const cx0 = x0 + i*X(0.33) + 60; ctx.moveTo(cx0, base + 6); ctx.lineTo(cx0 + 30, base + 40); ctx.lineTo(cx0 + 10, base + 80); ctx.lineTo(cx0 + 50, H); } ctx.stroke();
  chRect(X(0.95), gy + 34, 120, 40, '#77736d', 3, 3);
  ctx.strokeStyle = '#5a5651'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 1; i < 12; i++) { ctx.moveTo(X(0.95) + i*10, gy + 37); ctx.lineTo(X(0.95) + i*10, gy + 71); } ctx.stroke();
  // the timber-decked brick planter and its Japanese maple, in front of the walkway
  chMaple(X(1.45), base - 66, 1.0);
  chBricks(X(1.33), base - 62, X(0.24), 50);
  rr(X(1.32), base - 72, X(0.26), 16, 3); chFS('#8a6446', 4);
  ctx.strokeStyle = 'rgba(74,47,12,.35)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 1; i < 12; i++) { ctx.moveTo(X(1.32) + i*X(0.26)/12, base - 70); ctx.lineTo(X(1.32) + i*X(0.26)/12, base - 58); } ctx.stroke();
}

// ---------- the run through the three places ----------
const chSeg = t => { const s = t < CH.seg[1] ? 0 : t < CH.seg[2] ? 1 : 2; return {s, u: t - CH.seg[s], d: CH.seg[s + 1] - CH.seg[s]}; };
const chCam = (u, d) => (u/d)*0.5*W;
const chNx = (u, d) => chCam(u, d) + W*(0.6 + 0.02*Math.sin(u*5));
const chSx = (u, d, s) => chCam(u, d) + W*(0.17 + 0.035*s + 0.02*Math.sin(u*3.3 + 1));
// the whip pan between places: the camera flies on 0.35 W just before a cut and comes in from 0.35 W back just after it
function chWhipShift(t){ for (const b of CH_WHIPS) { const d = t - b; if (Math.abs(d) < 0.14) { const k = 1 - Math.abs(d)/0.14; return (d < 0 ? 1 : -1)*k*k*0.35*W; } } return 0; }
function chWhipFx(t){
  for (const b of CH_WHIPS) {
    const d = t - b; if (Math.abs(d) >= 0.14) continue;
    const k = 1 - Math.abs(d)/0.14;
    ctx.fillStyle = `rgba(255,255,255,${0.5*k})`; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = `rgba(255,255,255,${0.9*k})`; ctx.lineCap = 'round';
    for (let i = 0; i < 16; i++) { const y = H*(0.04 + 0.92*stRnd(i*3 + b*10)), x = W*(1.4*stRnd(i*7 + b*10) - 0.2) - d*5000; ctx.lineWidth = 3 + 7*stRnd(i + 50); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + W*(0.25 + 0.3*stRnd(i + 9)), y); ctx.stroke(); }
    ctx.lineCap = 'butt';
  }
}
// Mr Shou's throwing arm for a throw released at rel (u = time in this place)
function chArm(u, rel){ const k = (u - (rel - 0.3))/0.5; if (k < 0 || k > 1) return null;
  return {armR: k < 0.6 ? lerp(0.5, 3.5, ease(k/0.6)) : k < 0.8 ? lerp(3.5, 1.6, (k - 0.6)/0.2) : lerp(1.6, 0.5, (k - 0.8)/0.2), held: k < 0.6}; }
function chRun(t){
  const {s, u, d} = chSeg(t), gy = H*0.86, cam = chCam(u, d) + chWhipShift(t), th = CH_THROWS[s];
  const hand = uu => [chSx(uu, d, s) + 112*CH_SS, gy - 190*CH_SS];
  const arc = (a, b, k, h) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k) - Math.sin(Math.PI*k)*h];
  ctx.save(); stShake(t, s === 1 ? [[CH.seg[1] + 1.52, 5]] : s === 2 ? [[CH.seg[2] + 0.9, 3]] : []);
  if (s === 1) { ctx.fillStyle = '#56514c'; ctx.fillRect(-20, -20, W + 40, H + 40); } else sky();
  ctx.translate(-cam, 0);
  const after = [];                                       // drawn over the runners
  if (s === 0) {
    chSports(gy);
    const [rx, ry] = chHoop(), k = u - th.land;
    if (u >= th.rel && k < 0) { const p = arc(hand(th.rel), [rx, ry - 26], (u - th.rel)/(th.land - th.rel), 230); after.push(() => stFlyBook(p[0], p[1], 50, (u - th.rel)*14, Math.cos(u*12), th.w)); }
    const sway = k > 0 && k < 0.6 ? Math.sin(k*30)*(1 - k/0.6) : 0;
    if (k >= 0 && k < 0.2) { chPole(gy, sway); stFlyBook(rx, lerp(ry - 26, ry + 40, k/0.2), 44, 0.2, 0.15, th.w); }   // down through the net
    else if (k >= 0.2) {                                                                                                // onto the court, a bounce, then it lies there
      const f = k - 0.2, y = f < 0.22 ? lerp(ry + 40, gy - 30, (f/0.22)**2) : gy - 30 - stHop(f, 0.22, 0.4, 26);
      if (f < 0.4) stFlyBook(rx + f*40, y, 44, 0.2 + f*6, Math.cos(f*10), th.w); else stBookAt(rx + 16, gy - 26, 0.06, 0.82, th.w === 'r');
      chPole(gy, sway);
    } else chPole(gy, 0);
    if (k > 0.03 && k < 0.85) { const p = fxBack(stSeg(k, 0.03, 0.2)); ctx.save(); ctx.globalAlpha = 1 - stSeg(k, 0.6, 0.85); ctx.translate(rx - 30, ry - 95); ctx.rotate(-0.12); ctx.scale(p, p); title(LINES_CHASE.swish, 0, 0, 46, '#fff6b0'); ctx.restore(); }
  } else if (s === 1) {
    chCourt(gy);
    const bx = 1.1*W, by = gy - 160, k = u - th.land;
    if (u >= th.rel && k < 0) { const p = arc(hand(th.rel), [bx - 2, by - 30], (u - th.rel)/(th.land - th.rel), 170); after.push(() => stFlyBook(p[0], p[1], 50, (u - th.rel)*13, Math.cos(u*11), th.w)); }
    const open = k < 0 ? 0 : k < 0.08 ? fxBack(k/0.08) : k < 0.24 ? 1 : k < 0.32 ? 1 - (k - 0.24)/0.08 : Math.abs(Math.sin((k - 0.32)*30))*0.12*Math.max(0, 1 - (k - 0.32)/0.3);
    if (k >= 0 && k < 0.3) stFlyBook(bx - 2, lerp(by - 30, by + 40, (k/0.3)**2), 46, 0.3 + k*3, 0.6, th.w);   // drops in (the bin's body covers it)
    chCourtFront(gy, open);
    if (k > 0.32 && k < 0.6) stBurst(bx + 4, by - 2, 18 + 40*stSeg(k, 0.32, 0.6), k*4);                        // SLAM
  } else {
    chHubBg(gy);
    const fx = chNx(1.2, d) - 20, k = u - th.land;
    if (u >= th.rel && k < 0) { const p = arc(hand(th.rel), [fx, gy - 14], (u - th.rel)/(th.land - th.rel), 120); after.push(() => stFlyBook(p[0], p[1], 50, (u - th.rel)*12, Math.cos(u*10), th.w)); }
    if (k >= 0) { const sk = Math.min(1, k/0.2), x = fx + 18*(1 - (1 - sk)*(1 - sk)); stBookAt(x, gy + 2, 0, 0.9, th.w === 'r'); if (k < 0.3) stDust(x, gy, k/0.3, 14); }
  }
  // ---- Mr Shou: an armful of books, throwing with his free arm, shouting ----
  const sx = chSx(u, d, s), arm = chArm(u, th.rel), shout = s === 0 && u > 0.05 && u < 1.15;
  const o = {books: 4, armR: arm ? arm.armR : 0.5 + Math.sin(t*15)*0.25, mouth: shout || (arm && arm.held) ? 'o' : 'grin', eyes: 'dot', look: [1, 0], brow: shout ? 'up' : undefined,
    walk: t*15, moving: true, rot: 0.07, hair: Math.sin(t*12)*0.6};
  const bob = Math.abs(Math.sin(t*15))*8;
  stShadow(sx, gy + 2, 70);
  const hands = stShou(sx, gy - bob, CH_SS, o);
  if (arm && arm.held) stFlyBook(hands.handR[0], hands.handR[1] - 22, 46, arm.armR - Math.PI, 1, th.w);
  if (shout) { const k = stSeg(u, 0.05, 0.25); ctx.save(); ctx.translate(sx + 110, gy - 345); ctx.rotate(-0.1 + Math.sin(t*40)*0.02); ctx.scale(fxBack(k), fxBack(k)); title(LINES_CHASE.shout, 0, 0, Math.min(64, W/15), '#fff'); ctx.restore(); }
  // ---- Nailong, flat out ----
  const nx = chNx(u, d), hop = s === 2 ? stHop(u, CH_HOP[0], CH_HOP[1], 80) : 0, glance = s === 1 && u > 1.15 && u < 1.6;
  stRunTrail(nx, gy, CH_NS, t);
  stRun(nx, gy - hop, CH_NS, t, {mouth: hop > 20 ? 'o' : 'open', look: glance ? [-1, -0.3] : [1, -0.1]});
  fxMark('sweat', nx + 44, gy - 140 - hop, (t*1.6) % 1, 0.8);
  for (const f of after) f();
  ctx.restore();
}

// ---------- into the Junior School atrium, up the stairs, head first into the slide ----------
function chAtrium(t){
  const g = stSlideGeom(), gy = g.gy, sh = chWhipShift(t);
  ctx.fillStyle = '#ece6dc'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#4a4d57'; ctx.fillRect(0, gy, W, H - gy);
  ctx.save(); ctx.translate(-sh, 0);
  stAtrium(g); stStairs(g); stTubeOutside(g);
  // Mr Shou runs in after him and pulls up at the foot of the stairs, fist up at the slide
  const run = stSeg(t, CH.seg[3], CH.shouStop), sx = lerp(-0.3*W, 0.09*W, run), moving = run < 1;
  const fist = stSeg(t, CH.shouStop, CH.shouStop + 0.15);
  const o = {books: 4, armR: moving ? 0.5 + Math.sin(t*15)*0.3 : lerp(0.5, 2.85, fxBack(fist)) + Math.sin(t*34)*0.15*fist, mouth: moving ? 'grin' : 'o', eyes: 'dot', look: moving ? [1, 0] : [1, -1],
    brow: moving ? undefined : 'up', walk: t*15, moving, rot: moving ? 0.07 : -0.05*fist, hair: Math.sin(t*12)*0.6};
  stShadow(sx, gy + 2, 70);
  stShou(sx, gy - (moving ? Math.abs(Math.sin(t*15))*8 : 0), CH_SS, o);
  // Nailong: in from the left, up the stairs, along the platform, head first into the tube
  const ns = CH_NS;
  if (t < CH.stairs) { const x = lerp(-0.1*W, 0.03*W, stSeg(t, CH.seg[3], CH.stairs)); stRunTrail(x, gy, ns, t); stRun(x, gy, ns, t); }
  else if (t < CH.gone + 0.05) {
    ctx.save(); ctx.beginPath(); ctx.rect(-W, 0, g.P0[0] - 2 + W, H); ctx.clip();
    if (t < CH.plat) {
      const up = stSeg(t, CH.stairs, CH.top), x = t < CH.top ? lerp(0.03*W, 0.17*W, up) : lerp(0.17*W, 0.19*W, stSeg(t, CH.top, CH.plat)), y = gy - 260*up;
      stRunTrail(x, y, ns, t, 1, 0.6); stRun(x, y, ns, t);
    } else {
      const u = stSeg(t, CH.dive, CH.gone), x = lerp(0.19*W, g.P0[0] + 40, u*u), y = lerp(gy - 262, g.P0[1] + 4, ease(u)) - Math.sin(Math.PI*u)*36;
      nailong(x, y, ns, {rot: lerp(0.3, Math.PI/2, ease(Math.min(1, u*2))), arms: 'up', flail: t*30, walk: t*40, mouth: 'open', look: [0, -1], sx: 0.9, sy: 1.15});
    }
    ctx.restore();
  }
  ctx.restore();
}

// ---------- the inside of the round slide, looking on down it at the light at the bottom ----------
// (Max, 13 Oct: "it looks like nailong changes direction and goes back up the slide": the rings used to drift away from the camera;
// now they rush towards it, so the ride reads as going on down the slide. A falling flow means forwards.)
// Rings of red fibreglass from the camera out to the entrance, each cut into 8 panels on the lines where the octagon's corners will be.
// o = {cx, cy, R (a ring's radius at depth 1), flow (rings drift away as he slides), bx, by (where the far end has swung to),
//      wob(i, z) => [dx, dy] (the shake, ring i), crack 0..1 (dark seams, the panels pull apart), peel(i, j) => seconds since panel j of ring i came loose}
const chBendG = z => Math.pow(clamp((z - 1.5)/9, 0, 1), 0.8);   // near rings stay put, the far end swings with the bends
const CH_LIFE = 0.6;                                    // how long a loose panel takes to fall out of sight
function chTubeIn(o){
  const f = o.flow - Math.floor(o.flow), base = Math.floor(o.flow), rings = [];
  for (let i = -3; i < 19; i++) {
    const z = 0.6*Math.pow(1.2, i + f), g = chBendG(z), w = o.wob ? o.wob(rings.length, z) : [0, 0];
    rings.push({z, m: i - base, x: o.cx + o.bx*g + w[0], y: o.cy + o.by*g + w[1], r: o.R/z});
  }
  const A = j => Math.PI/2 + (j - 0.5)*Math.PI/4, crack = o.crack || 0, loose = [];
  const panel = (i, j, age) => {
    const a = rings[i], b = rings[i + 1], a0 = A(j), a1 = A(j + 1), am = (a0 + a1)/2, rm = (a.r + b.r)/2, n = a.m*8 + j;
    const pcx = (a.x + b.x)/2 + Math.cos(am)*rm, pcy = (a.y + b.y)/2 + Math.sin(am)*rm;
    ctx.save();
    if (age >= 0) {                                       // loose: flung out from the middle of the tube, falling, tumbling, going small into the white
      const sp = 170 + 230*stRnd(n + 11), spin = (stRnd(n + 3) - 0.5)*7, sc = 1 - 0.55*Math.min(1, age/CH_LIFE);
      ctx.globalAlpha = 1 - clamp((age - CH_LIFE*0.5)/(CH_LIFE*0.5), 0, 1);
      ctx.translate(pcx + Math.cos(am)*sp*age, pcy + Math.sin(am)*sp*age + 1150*age*age); ctx.rotate(spin*age); ctx.scale(sc, sc); ctx.translate(-pcx, -pcy);
    } else if (crack > 0) { const sc = 1 - 0.035*crack; ctx.translate(pcx, pcy); ctx.scale(sc, sc); ctx.translate(-pcx, -pcy); }
    const path = () => { ctx.beginPath(); ctx.arc(a.x, a.y, a.r, a0, a1); ctx.arc(b.x, b.y, b.r, a1, a0, true); ctx.closePath(); };
    path(); ctx.fillStyle = stRed(a.z, (a.m % 2 + 2) % 2); ctx.fill();
    ctx.strokeStyle = 'rgba(80,5,12,.5)'; ctx.lineWidth = Math.max(1.5, 5/a.z); ctx.beginPath(); ctx.arc(a.x, a.y, a.r, a0, a1); ctx.stroke();
    const g0 = Math.max(a0, Math.PI*1.1), g1 = Math.min(a1, Math.PI*1.42);   // the gloss along the upper left wall
    if (g1 > g0) { ctx.beginPath(); ctx.arc(a.x, a.y, a.r*0.93, g0, g1); ctx.strokeStyle = 'rgba(255,255,255,.26)'; ctx.lineWidth = Math.max(2, 14/a.z); ctx.lineCap = 'round'; ctx.stroke(); ctx.lineCap = 'butt'; }
    const edge = age >= 0 ? 1 : crack;
    if (edge > 0) { path(); ctx.strokeStyle = `rgba(74,47,12,${0.8*edge})`; ctx.lineWidth = Math.max(1.5, 6/a.z); ctx.lineJoin = 'round'; ctx.stroke(); }
    ctx.restore();
  };
  for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < 8; j++) {
    const age = o.peel ? o.peel(i, j) : -1;
    if (age >= CH_LIFE) continue;
    if (age >= 0) loose.push([i, j, age]); else panel(i, j, -1);
  }
  // the far end: the light from the atrium at the top of the slide (it falls away last)
  const L = rings[rings.length - 1], endAge = o.peel ? o.peel(rings.length - 1, 0) : -1;
  if (endAge < 0.3) {
    ctx.save();
    if (endAge >= 0) { ctx.globalAlpha = 1 - endAge/0.3; ctx.translate(0, 1400*endAge*endAge); }
    ell(L.x, L.y, L.r, L.r); ctx.fillStyle = '#2b0409'; ctx.fill();
    ell(L.x, L.y, o.R/11, o.R/11); ctx.fillStyle = '#ffd3d3'; ctx.fill();
    ell(L.x, L.y, o.R/18, o.R/18); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.restore();
  }
  for (let q = loose.length - 1; q >= 0; q--) panel(...loose[q]);   // the loose ones in front, the nearest last
  return rings;
}
const chRideU = t => t - CH.cut;
const chBendRamp = t => stSeg(t, CH.cut + 0.2, CH.cut + 1.0);
const chBend = t => { const u = chRideU(t), k = chBendRamp(t); return [W*0.22*Math.sin(u*1.9 + 0.2)*k, (-H*0.09 + H*0.07*Math.sin(u*1.3))*k]; };
function chRide(t){
  const b = chBend(t), o = {cx: W/2, cy: H*0.36, R: H*0.78, flow: -2.6*chRideU(t), bx: b[0], by: b[1]};
  ctx.fillStyle = '#2b0409'; ctx.fillRect(0, 0, W, H);
  ctx.save(); const shk = Math.sin(t*53)*1.4; ctx.translate(shk, Math.cos(t*61)*shk*0.6);
  chTubeIn(o);
  ctx.strokeStyle = 'rgba(255,220,220,.35)'; ctx.lineCap = 'round';                 // speed streaks rushing past the camera
  for (let i = 0; i < 10; i++) { const a = stRnd(i)*Math.PI*2, k = (t*1.6 + stRnd(i + 20)) % 1, r1 = o.R*1.2*k, r0 = r1*0.75; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(o.cx + Math.cos(a)*r0 + b[0]*k*0.3, o.cy + Math.sin(a)*r0 + b[1]*k*0.3); ctx.lineTo(o.cx + Math.cos(a)*r1, o.cy + Math.sin(a)*r1); ctx.stroke(); }
  ctx.lineCap = 'butt';
  // Nailong rides up the walls round the bends, the other way from the far end
  const u = chRideU(t), zN = 2.2, th = -0.6*Math.sin(u*1.9 - 0.2)*chBendRamp(t), g = chBendG(zN), rN = o.R/zN, s = 0.62;
  const x = o.cx + b[0]*g + Math.sin(th)*rN, y = o.cy + b[1]*g + Math.cos(th)*rN;
  const plop = Math.sin(Math.PI*stSeg(t, CH.cut + 0.05, CH.cut + 0.35)), sx = 1 + 0.22*plop, sy = 1 - 0.2*plop;
  const wheee = t > CH.wheee[0], talking = t > CH.big[0] && t < CH.big[1];
  ell(x, y + 4, 62*s, 9*s, -th); ctx.fillStyle = 'rgba(60,4,10,.35)'; ctx.fill();
  nailong(x, y, s, {rot: -th, sx, sy, arms: wheee ? 'up' : 'down', flail: t*14, mouth: wheee ? 'open' : talking ? 'smile' : 'o', look: wheee ? [0, -0.4] : talking ? [0.9*Math.sin(t*1.3), -0.7] : [Math.sin(t*5), -0.7]});
  const topY = y - 190*s;
  if (talking) bubble(LINES_CHASE.slideBig, x, topY, 30, 380);
  if (wheee && t < CH.wheee[1]) bubble(LINES_CHASE.wheee, x, topY, 34, 380);
  ctx.restore();
}

// ---------- outside again: Mr Shou runs round to the bottom, grabs the mouth of the slide and shakes it ----------
// His left hand holds the rim, so the mouth goes wherever his hand goes; every point further up the tube does what the mouth did a
// moment ago (0.55 s later at the top): the wobble runs up the slide.
function chShouRig(t){
  const g = stSlideGeom(), gy = g.gy, m = g.P3, run = stSeg(t, CH.run[0], CH.run[1]), at = m[0] + 104*CH_SS;
  const x = lerp(0.09*W, at, ease(run)), shaking = t > CH.shake, amp = shaking ? Math.min(1, (t - CH.shake)/0.2) : 0, w = 30, running = t > CH.run[0] && run < 1;
  const grab = t > CH.grab - 0.08;
  const o = {armL: grab ? 1.2 : 0.12, armR: grab ? 2.75 + 0.3*Math.sin(t*17) : 0.5 + Math.sin(t*15)*0.3, rot: shaking ? 0.1*amp*Math.sin(t*w) : (running ? 0.07 : 0.02),
    mouth: shaking ? 'grin' : 'o', eyes: shaking ? 'happy' : 'dot', look: [-1, -0.2], walk: t*15, moving: running, hair: Math.sin(t*12)*0.6};
  const y = gy - (shaking ? 5*amp*(1 + Math.cos(t*w*2)) : running ? Math.abs(Math.sin(t*15))*8 : 0);
  const hl = [-38 - Math.sin(o.armL)*76, -166 + Math.cos(o.armL)*76];
  return {x, y, o, hand: stShouPt(x, y, CH_SS, o, hl[0], hl[1])};
}
function chMouthDisp(tt){
  if (tt < CH.shake) return [0, 0];
  const a = chShouRig(tt).hand, r = chShouRig(CH.shake - 0.001).hand;
  return [a[0] - r[0], a[1] - r[1]];
}
function chTubeOut(g, disp){                            // stTubeOutside, bent by disp(u) (u 0 = top, 1 = mouth)
  const gy = g.gy, P = u => { const p = stBez(g, u), d = disp(u); return [p[0] + d[0], p[1] + d[1]]; };
  const path = (dy, u0 = 0, u1 = 1) => { ctx.beginPath(); for (let i = 0; i <= 40; i++) { const p = P(u0 + (u1 - u0)*i/40); i ? ctx.lineTo(p[0], p[1] + dy) : ctx.moveTo(p[0], p[1] + dy); } };
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ell((g.P0[0] + g.P3[0])/2, gy + 12, (g.P3[0] - g.P0[0])*0.55, 14); ctx.fill();
  ctx.strokeStyle = '#2f6fc9'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  for (const u of [0.38, 0.62, 0.84]) { const p = P(u), f = stBez(g, u); ctx.beginPath(); ctx.moveTo(p[0], p[1] + 30); ctx.lineTo(f[0] - 10, gy + 2); ctx.stroke(); }
  ctx.lineCap = 'butt';
  const d0 = disp(0), dcx = g.P0[0] - W*0.012 + d0[0]*0.4, dcy = g.P0[1] - 74 + d0[1]*0.4, dr = 138;
  ctx.fillStyle = '#f4f4f4'; ctx.strokeStyle = C.line; ctx.lineWidth = 5; ell(dcx, dcy, dr, dr); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(74,47,12,.16)'; ctx.lineWidth = 3; ell(dcx, dcy, dr - 14, dr - 14); ctx.stroke();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  path(0); ctx.lineWidth = 132; ctx.strokeStyle = C.line; ctx.stroke();
  path(0); ctx.lineWidth = 118; ctx.strokeStyle = '#e0303a'; ctx.stroke();
  path(32, 0.02, 0.97); ctx.lineWidth = 34; ctx.strokeStyle = '#b3141f'; ctx.stroke();
  path(-28, 0.04, 0.9); ctx.lineWidth = 13; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.stroke();
  ctx.lineCap = 'butt';
  const m = P(1);
  ell(m[0] + 3, m[1], 33, 62); ctx.fillStyle = '#ff6a6a'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.line; ctx.stroke();
  ell(m[0] + 6, m[1], 22, 50); ctx.fillStyle = '#5a0c12'; ctx.fill(); ctx.stroke();
  const e = P(0);
  ell(e[0], e[1], 33, 63); ctx.fillStyle = '#ff6a6a'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.line; ctx.stroke();
  ell(e[0] + 1, e[1], 23, 52); ctx.fillStyle = '#5a0c12'; ctx.fill(); ctx.stroke();
  return P;
}
function chShake(t){
  const g = stSlideGeom(), gy = g.gy;
  ctx.save(); stShake(t, [[CH.grab, 5]]);
  stAtrium(g); stStairs(g);
  stBookAt(0.06*W, gy + 4, 0, 0.9, true); stBookAt(0.06*W + 4, gy - 12, 0.05, 0.86, false); stBookAt(0.06*W - 3, gy - 28, -0.04, 0.84, true);   // his books, dumped by the stairs
  const disp = u => { const d = chMouthDisp(t - (1 - u)*0.55), k = 1 + 0.7*Math.sin(Math.PI*u); return [d[0]*k, d[1]*k*1.3]; };
  const P = chTubeOut(g, disp);
  const rig = chShouRig(t);
  stShadow(rig.x, gy + 2, 70);
  stShou(rig.x, rig.y, CH_SS, rig.o);
  if (t > CH.grab && t < CH.grab + 0.25) stBurst(rig.hand[0], rig.hand[1], 16 + 30*stSeg(t, CH.grab, CH.grab + 0.25), t*3);
  if (t > CH.shake + 0.08) {                                // RATTLE RATTLE, riding up the tube with the wobble
    const k = stSeg(t, CH.shake + 0.08, CH.shake + 0.25), p = P(clamp(1 - (t - CH.shake)/0.9, 0.15, 1));
    stText(LINES_CHASE.rattle, p[0] + Math.sin(t*44)*4, p[1] - 120, 44*fxBack(k), -0.08 + Math.sin(t*30)*0.04, '#fff6b0');
  }
  ctx.restore();
}

// ---------- inside: the wobble arrives, the tube cracks into panels, they fall away, and he drops onto the octagon ----------
const chOgR = () => Math.min(W, H*1.2)*0.4;
const chCamE = t => ease(stSeg(t, CH.peel, CH.land - 0.05));   // the camera pulling back to the octagon game's own
const chPeelT = (i, j) => CH.peel + 0.65*Math.sqrt(i/21) + 0.1*stRnd(i*8 + j + 77);   // the nearest panels go first
const CH_FLOW0 = 2.6*(CH.out - CH.cut) + 0.4;
function chOcta(t){ if (typeof ogPreview === 'function') ogPreview(t); else stOctaWorld(t, 8, true); }
function chCollapse(t){
  const e = chCamE(t), ogR = chOgR(), cx = W/2, cy = lerp(H*0.36, H*0.42, e), R = lerp(H*0.78, ogR, e);
  const flow = CH_FLOW0 - 0.9*(1 - Math.pow(1 - stSeg(t, CH.in2, CH.crack), 2));      // he slows to a stop as the wobble hits
  const wobA = i => { const k = t - (CH.in2 + 0.03*i); return k < 0 ? 0 : Math.min(1, k/0.1)*(1 - stSeg(t, CH.peel, CH.peel + 0.4)); };
  const wob = (i, z) => { const a = wobA(i)*44/Math.sqrt(z); return [a*Math.sin(t*30 - i*0.7), a*0.7*Math.cos(t*33 - i*0.7)]; };
  ctx.save(); stShake(t, [[CH.in2, 9], [CH.crack, 6]]);
  if (t > CH.crack - 0.02) { ctx.save(); ctx.translate(cx, cy); ctx.scale(R/ogR, R/ogR); ctx.translate(-W/2, -H*0.42); chOcta(t - CHASE_DUR); ctx.restore(); }
  else { ctx.fillStyle = '#2b0409'; ctx.fillRect(-30, -30, W + 60, H + 60); }
  chTubeIn({cx, cy, R, flow, bx: 0, by: 0, wob, crack: stSeg(t, CH.crack, CH.crack + 0.18), peel: (i, j) => t - chPeelT(i, j)});
  ctx.restore();
  const wash = ease(stSeg(t, CH.wash[0], CH.wash[1]));   // the game's card wash (octagon.js, frame 0), so the hand-over is seamless
  if (wash > 0) { ctx.fillStyle = `rgba(255,246,243,${0.5*wash})`; ctx.fillRect(-20, -20, W + 40, H + 40); }
  // ---- Nailong ----
  const at = tt => {                                      // where he sits in the tube at time tt: on the bottom, bounced by the wobble
    const ee = chCamE(tt), Rr = lerp(H*0.78, ogR, ee), cyy = lerp(H*0.36, H*0.42, ee), zN = 2.2;
    const a = wobA(10)*44/Math.sqrt(zN), bounce = tt < CH.hang ? Math.abs(Math.sin(tt*15))*30*wobA(10) : 0;
    return [W/2 + a*Math.sin(tt*30 - 7), cyy + Rr/zN + a*0.7*Math.cos(tt*33 - 7) - bounce, 0.62*Rr/(H*0.78)];
  };
  const [lx, ly] = stOctaLand();
  let x, y, s, o, sx = 1, sy = 1, rot = 0;
  if (t < CH.drop) {
    [x, y, s] = at(t);
    const hang = t > CH.hang;
    o = {arms: 'up', flail: t*(hang ? 30 : 16), mouth: 'o', look: hang ? [0, 1] : [Math.sin(t*9)*0.8, -0.6], walk: hang ? t*40 : 0};
    if (!hang) rot = Math.sin(t*30)*0.06*wobA(10);
  } else if (t < CH.land) {
    const [x0, y0, s0] = at(CH.drop), k = stSeg(t, CH.drop, CH.land);
    x = lerp(x0, lx, k); y = lerp(y0, ly, k*k); s = lerp(s0, 0.36, k);
    o = {arms: 'up', flail: t*24, mouth: 'open', look: [0, -1]};
  } else {
    x = lx; y = ly; s = 0.36;
    const q = Math.sin(Math.PI*stSeg(t, CH.land, CH.land + 0.3)); sx = 1 + 0.25*q; sy = 1 - 0.22*q;
    o = t < CH.still ? {arms: 'down', mouth: 'o', look: [Math.sin(t*6)*0.5, -0.4]} : {mouth: 'open', look: [0, -0.6]};
  }
  nailong(x, y, s, {...o, rot, sx, sy});
  if (t > CH.land && t < CH.land + 0.5) stDust(x, y, stSeg(t, CH.land, CH.land + 0.5), 10);
  if (t > CH.uh[0] && t < CH.uh[1]) bubble(LINES_CHASE.uhOh, x, y - 190*s, 32, 380);
  if (t > CH.hang - 0.05 && t < CH.drop + 0.2) fxMark('sweat', x + 52*s, y - 180*s, stSeg(t, CH.hang - 0.05, CH.drop + 0.2), s*1.4);
}

// Max, 13 Oct: "nailong has to be running left along those scenes that you've got, going left not right, you got it reversed."
// So every outside part (the run, the atrium and stairs, Mr Shou shaking the slide) is drawn mirrored: they enter on the right, run
// left, the scenery scrolls the other way, he arrives at the stairs from the right. Text is NOT mirrored: while the mirror is on, every
// fillText / strokeText is flipped back about its own anchor (and left/right alignment swapped), so the signs, TR1 to TR3, the Hub,
// EXIT, SWISH!, NAILONG! and RATTLE RATTLE all still read the right way round, in the mirrored spot. The ride inside the tube and the
// collapse onto the octagon are left as they were (the octagon has to match the game's own first frame).
const CH_FLIPALIGN = {left: 'right', right: 'left', start: 'end', end: 'start'};
function chMirror(fn){
  const own = k => Object.prototype.hasOwnProperty.call(ctx, k), keep = {fillText: own('fillText') ? ctx.fillText : null, strokeText: own('strokeText') ? ctx.strokeText : null};
  const flip = orig => function(s, x, y, ...r){
    ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1); const a = ctx.textAlign; ctx.textAlign = CH_FLIPALIGN[a] || a;
    orig.call(ctx, s, 0, 0, ...r); ctx.restore();
  };
  const f0 = ctx.fillText, s0 = ctx.strokeText;
  ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1);
  ctx.fillText = flip(f0); ctx.strokeText = flip(s0);
  try { fn(); }
  finally {
    for (const k of ['fillText', 'strokeText']) { if (keep[k]) ctx[k] = keep[k]; else delete ctx[k]; }
    ctx.restore();
  }
}
function sceneChase(t){
  stCues('chase', t, CHASE_SFX);
  const outside = t < CH.cut || (t >= CH.out && t < CH.in2);
  const draw = () => {
    if (t < CH.seg[3]) chRun(t);
    else if (t < CH.cut) chAtrium(t);
    else if (t < CH.out) chRide(t);
    else if (t < CH.in2) chShake(t);
    else chCollapse(t);
    chWhipFx(t);
  };
  if (outside) chMirror(draw); else draw();
  if (t > CH.cut - 0.15 && t < CH.cut + 0.3) {             // the red flash whips the camera inside the tube
    const a = t < CH.cut ? stSeg(t, CH.cut - 0.15, CH.cut) : 1 - stSeg(t, CH.cut, CH.cut + 0.3);
    ctx.fillStyle = `rgba(224,40,50,${a})`; ctx.fillRect(0, 0, W, H);
  }
}
