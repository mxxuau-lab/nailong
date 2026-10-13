// story-canberra.js: the Camry, the LLC escape, Civic, the bridge, Parliament House (the finale).
// Globals: camry(), sceneEscape, sceneCivic, sceneBridge, sceneParliament, sceneFinale (alias of sceneParliament).
// Durations (seconds) are in CANBERRA_DUR. Every visible line lives in LINES_CANBERRA.
(() => {
"use strict";

// ---------------------------------------------------------------- lines (kind placeholders marked TODO joke)
const LINES_CANBERRA = {
  llcSign: 'LEADERSHIP & LEARNING CENTRE',
  notice: '!',                               // unused since 12 Oct: the LLC clip now shows him spotting the car
  pow: 'POW!',
  wheel: '...where did the road go?',      // TODO joke
  vroom: 'VROOM',
  beep: 'beep beep',
  gate: 'BRINDABELLA CHRISTIAN COLLEGE',
  tramDest: 'GUNGAHLIN',
  tramNo: '018',                             // the tram's fleet plate: a hidden 18
  alinga: 'ALINGA ST',
  merry: 'MERRY-GO-ROUND',
  ding: 'ding ding!',
  redLight: '...it is red. Nailong waits.',  // TODO joke
  civicOut: 'Dumplings. Then running.',      // TODO joke
  bridgeSign: 'COMMONWEALTH AVE BRIDGE',
  jetSign: 'CAPTAIN COOK MEMORIAL JET',
  splash: 'SPLASH!',
  dry: '',                                  // cut (Max, 13 Oct: "skip the line for nailong is now a wet dragon")
  blocks: 'Why are blocks falling from the sky?',  // TODO joke
  clear: 'Clear the road!!',                     // Max (13 Oct): "nailong doesn't break the forth wall in the blockbalst scene, so he just says, 'clear the road!!'"
  happy: 'Happy 18th!',                      // TODO joke
  cheer: 'HOORAY!',
  bday: 'Happy Birthday!',                   // Max (13 Oct): the card after the finale, before the replay menu
  bdaySub: 'text me your favorite part :)',  // Max's words
};
window.LINES_CANBERRA = LINES_CANBERRA;
// Escape 10.4 (was 10), Civic 11 (was 10.5), Bridge 12.9 (was 11.8): longer holds so every line reads twice at the 70% clip speed.
const CANBERRA_DUR = {sceneEscape: 10.4, sceneCivic: 11, sceneBridge: 12.9, sceneParliament: 12, sceneFinale: 12, sceneBirthday: 6.5};
window.CANBERRA_DUR = CANBERRA_DUR;

// ---------------------------------------------------------------- tiny helpers
// sounds: each cue [scene time, name, opts, fallback, fallbackOpts] fires once as the clip's clock passes it, and a clock that goes back
// (watch again, a fresh run) re-arms them; the fallback plays only if sfx.js lacks the voice. The clips stay pure functions of t.
const cueT = {};
function cbCues(key, t, list) {
  const prev = cueT[key]; cueT[key] = t;
  if (prev === undefined || t <= prev || !window.SFX) return;
  for (const [at, name, o, alt, ao] of list) {
    if (!(prev < at && t >= at)) continue;
    if (alt && SFX.names && !SFX.names.includes(name)) SFX.play(alt, ao || {}); else SFX.play(name, o || {});
  }
}
const P = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const out = (draw, fill, lw = 5, stroke = C.line) => {
  draw(); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke();
};
const poly = pts => () => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); };
const easeOut = k => 1 - Math.pow(1 - k, 3);
function star4(x, y, r, rot, fill) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rad = i % 2 ? r * 0.3 : r; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = Math.max(1.5, r * 0.12); ctx.strokeStyle = C.line; ctx.stroke(); ctx.restore();
}
function puff(x, y, r, a = 1) { ell(x, y, r, r * 0.85); ctx.fillStyle = `rgba(245,245,248,${a})`; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = `rgba(74,47,12,${a * 0.5})`; ctx.stroke(); }
function shadow(x, y, w, a = 0.22) { ell(x, y, w, w * 0.1); ctx.fillStyle = `rgba(40,30,10,${a})`; ctx.fill(); }
// An Australian magpie (Sept to Oct is swooping season). Feet at (x, y), faces right (dir = -1 flips).
// opts: flying (wings out, legs tucked), flap (seconds, drives the wingbeat), tilt (head, radians), dir, rot (body), sx/sy squash.
function magpie(x, y, s = 1, o = {}) {
  const {flying = false, flap = 0, tilt = 0, dir = 1, rot = 0, sx = 1, sy = 1} = o, BLK = '#2a2a31';
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(dir * s * sx, s * sy); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const wing = (wx, wy, fill) => {   // a black wing with the white shoulder bar, snapping between up and down
    ctx.save(); ctx.translate(wx, wy); ctx.rotate(0.9 + (Math.floor(flap / 0.09) % 2 ? 0.5 : -0.9));   // +0.9: up stroke points up, down stroke lies level
    out(() => ell(-13, 0, 16, 6), fill, 3); ell(-9, -1, 8, 2.2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
  };
  if (flying) wing(-1, -24, '#17171c');
  else { ctx.strokeStyle = C.line; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-3, -9); ctx.lineTo(-4, 0); ctx.moveTo(3, -9); ctx.lineTo(4, 0); ctx.stroke(); }
  ctx.save(); ctx.translate(-11, -15); ctx.rotate(-0.45); out(() => rr(-20, -3, 22, 6, 2), BLK, 3); ctx.restore();
  const body = () => ell(0, -17, 15, 10, -0.12), head = () => ell(12, -28, 7, 7);
  body(); ctx.fillStyle = BLK; ctx.fill();
  ctx.save(); body(); ctx.clip(); ell(-3, -26, 13, 6.5); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
  body(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke();
  ctx.save(); ctx.translate(9, -24); ctx.rotate(tilt); ctx.translate(-9, 24);
  out(poly([[16, -31], [27, -27], [16, -24]]), '#d8d2c4', 2);
  head(); ctx.fillStyle = BLK; ctx.fill();
  ctx.save(); head(); ctx.clip(); ell(6, -24, 3.5, 4.5); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
  head(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke();
  ell(14, -30, 1.8, 1.8); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.restore();
  if (flying) wing(1, -22, BLK);
  ctx.restore();
}
function smallText(text, x, y, size, fill, w = 600, align = 'center') {
  font(size, w); ctx.fillStyle = fill; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y);
}

// ---------------------------------------------------------------- the Camry
// Crony's real car: a grey 2014 Toyota Camry sedan (XV50 / ASV50R, pre-facelift), drawn from refs/camry_* photos.
// Proportions (Max, 12 Oct: "the car should be less long"): about 390 long and 150 tall at s = 1, so 2.6 times as long as tall,
// short bonnet and boot, raked windscreen, tall glasshouse, 5-spoke alloys, swept headlights, the Toyota oval on the nose and the wheel caps.
// Side view, faces RIGHT (dir = -1 flips it). Wheels touch y at s = 1.
// opts (unchanged since round 1): dir, wheel (radians the wheels have turned), door 0..1 (front door), driver (Nailong at the wheel),
//       look, mouth, lean (nose dip in radians, + = nose down), bob (px), flash (headlights on), paint (override colour).
// camry.info gives the anchor points in car space (multiply by s, x by dir) for anyone placing things on it.
const CAMRY_PAINT = '#a9aeb6', CAMRY_DARK = '#868c96', CAMRY_LIGHT = '#d3d7dd';
const CAM_WIN = [[-38, -96], [-38, -142], [2, -143], [56, -96]];                  // front side window
const CAM_WIN_R = [[-48, -96], [-48, -142], [-80, -140], [-122, -100], [-122, -96]];   // rear side window
const CAM_OPEN = [[-38, -142], [2, -143], [58, -96], [62, -26], [-40, -26]];        // the front door's opening
const CAM_WHEELS = [-112, 114];
// the Toyota emblem: an oval ring with the two crossed ovals inside (the T), on a chrome disc
function toyotaBadge(x, y, r, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ell(0, 0, r, r * 0.78); ctx.fillStyle = '#eef1f4'; ctx.fill(); ctx.lineWidth = Math.max(1.5, r * 0.22); ctx.strokeStyle = C.line; ctx.stroke();
  ctx.lineWidth = Math.max(1, r * 0.13); ctx.strokeStyle = '#4a4f58';
  ell(0, 0, r * 0.74, r * 0.54); ctx.stroke();
  ell(0, -r * 0.2, r * 0.56, r * 0.22); ctx.stroke();
  ell(0, r * 0.06, r * 0.2, r * 0.48); ctx.stroke();
  ctx.restore();
}
window.toyotaBadge = toyotaBadge;
function camry(x, y, s = 1, o = {}) {
  const {dir = 1, wheel = 0, door = 0, driver = false, look = [0.4, 0], mouth = 'smile', lean = 0, bob = 0, flash = false, paint = CAMRY_PAINT} = o;
  ctx.save(); ctx.translate(x, y + bob); ctx.rotate(lean * dir); ctx.scale(s * dir, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  shadow(0, 2, 200, 0.14);
  const body = () => {
    ctx.beginPath(); ctx.moveTo(-186, -24);
    ctx.lineTo(-194, -58); ctx.quadraticCurveTo(-198, -92, -176, -98);              // tail
    ctx.lineTo(-140, -104);                                                          // short boot deck
    ctx.bezierCurveTo(-124, -114, -106, -141, -80, -147);                           // rear window
    ctx.quadraticCurveTo(-38, -155, 4, -150);                                        // roof
    ctx.bezierCurveTo(28, -143, 50, -110, 72, -94);                                  // raked windscreen
    ctx.lineTo(158, -82); ctx.quadraticCurveTo(193, -77, 197, -58);                  // short bonnet, round nose
    ctx.lineTo(196, -32); ctx.quadraticCurveTo(195, -24, 184, -23);                  // front bumper
    ctx.closePath();
  };
  out(body, paint, 5);
  ctx.save(); body(); ctx.clip();
  ctx.fillStyle = CAMRY_DARK; ctx.fillRect(-210, -40, 420, 20);                     // lower sill
  ctx.strokeStyle = CAMRY_LIGHT; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-192, -84); ctx.bezierCurveTo(-90, -90, 60, -86, 196, -70); ctx.stroke();   // the shoulder crease
  ctx.fillStyle = '#d9dde2'; ctx.beginPath(); ctx.moveTo(-104, -140); ctx.quadraticCurveTo(-40, -152, 2, -147); ctx.lineTo(0, -144); ctx.quadraticCurveTo(-40, -148, -98, -138); ctx.closePath(); ctx.fill();   // roof shine
  ctx.restore();
  const winR = poly(CAM_WIN_R), winF = poly(CAM_WIN);
  out(winR, '#6b93b3', 4); out(winF, '#6b93b3', 4);
  out(() => rr(-48, -142, 10, 46, 2), '#2e3038', 3);                                // black B-pillar
  if (door > 0) out(poly(CAM_OPEN), '#2b2d36', 4);
  if (driver || door > 0) {
    ctx.save(); (door > 0 ? poly(CAM_OPEN) : winF)(); ctx.clip();
    ctx.fillStyle = '#3d4a5c'; ctx.fillRect(-42, -146, 108, 124);
    ctx.fillStyle = '#59627a'; rr(-40, -128, 20, 76, 8); ctx.fill();                  // seat back
    if (driver) nailong(8, -62, 0.34, {look, mouth, arms: 'down'});
    ctx.fillStyle = '#2e3038'; ctx.beginPath(); ctx.moveTo(30, -100); ctx.lineTo(66, -94); ctx.lineTo(66, -26); ctx.lineTo(30, -26); ctx.closePath(); ctx.fill();   // dash
    ctx.strokeStyle = '#17181d'; ctx.lineWidth = 5; ell(30, -104, 5, 18, -0.28); ctx.stroke();   // the steering wheel stands up in front of his face
    ctx.restore();
  }
  ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = '#fff'; ctx.lineWidth = 6;   // glass glints
  for (const w of [CAM_WIN, CAM_WIN_R]) { ctx.save(); poly(w)(); ctx.clip(); const b = w[1]; ctx.beginPath(); ctx.moveTo(b[0] + 10, b[1] + 44); ctx.lineTo(b[0] + 40, b[1] - 4); ctx.stroke(); ctx.restore(); }
  ctx.restore();
  ctx.strokeStyle = '#eef0f2'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-124, -96); ctx.lineTo(58, -96); ctx.stroke();   // chrome belt line
  ctx.strokeStyle = 'rgba(74,47,12,.55)'; ctx.lineWidth = 2.5;                       // door shut lines
  ctx.beginPath(); ctx.moveTo(-43, -96); ctx.lineTo(-43, -26);
  ctx.moveTo(-122, -96); ctx.lineTo(-108, -66);
  if (door <= 0) { ctx.moveTo(62, -95); ctx.lineTo(66, -66); }
  ctx.stroke();
  if (door <= 0) out(() => rr(14, -89, 20, 6, 3), '#d8dce1', 2.5);                  // door handles
  out(() => rr(-90, -89, 20, 6, 3), '#d8dce1', 2.5);
  out(() => { ctx.beginPath(); ctx.moveTo(52, -100); ctx.quadraticCurveTo(58, -114, 74, -110); ctx.quadraticCurveTo(80, -100, 66, -96); ctx.closePath(); }, paint, 3);   // mirror
  for (const wx of CAM_WHEELS) {
    ctx.beginPath(); ctx.arc(wx, -32, 43, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#25262d'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
    ell(wx, -35, 35, 35); ctx.fillStyle = '#26262b'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
    ell(wx, -35, 24, 24); ctx.fillStyle = '#3d4048'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    ctx.save(); ctx.translate(wx, -35); ctx.rotate(wheel); ctx.strokeStyle = '#d8dce2'; ctx.lineWidth = 7;
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 9, Math.sin(a) * 9); ctx.lineTo(Math.cos(a) * 22, Math.sin(a) * 22); ctx.stroke(); }
    ell(0, 0, 21, 21); ctx.lineWidth = 3; ctx.strokeStyle = '#d8dce2'; ctx.stroke();
    toyotaBadge(0, 0, 9); ctx.restore();                                              // the badge turns with the wheel
  }
  out(poly([[126, -82], [176, -77], [193, -64], [144, -67]]), flash ? '#fff6b0' : '#f1f4f7', 3);   // swept headlight
  out(poly([[180, -50], [196, -52], [195, -32], [178, -34]]), '#25262d', 3);         // lower air intake
  out(() => rr(182, -64, 15, 6, 2), '#3b3f48', 2);                                   // upper grille slot
  toyotaBadge(193, -61, 10, 0);                                                      // the Toyota oval on the nose
  out(poly([[-196, -90], [-172, -95], [-168, -85], [-194, -81]]), '#d62f3a', 3);     // tail light
  out(() => rr(-189, -88, 9, 5, 2), '#f3f3f3', 1.5);                                 // reverse lamp
  ctx.fillStyle = '#585d66'; ctx.fillRect(-190, -30, 13, 5);                         // exhaust
  if (flash) { ctx.fillStyle = 'rgba(255,246,176,.35)'; ctx.beginPath(); ctx.moveTo(190, -72); ctx.lineTo(390, -120); ctx.lineTo(390, -20); ctx.closePath(); ctx.fill(); }
  if (door > 0) {   // the front door, swung open toward the viewer (hinged at its front edge)
    const a = door * 1.1, w = 104 * Math.cos(a), g = 1 + 0.12 * Math.sin(a);
    const hx = 62, top = -96 * g, bot = -26 * g;   // door spans the opening, 104 wide
    out(poly([[hx, top], [hx - w, top - 4 * Math.sin(a)], [hx - w, bot], [hx, bot]]), paint, 5);
    out(poly([[hx - 4, top - 2], [hx - w * 0.92, top - 6], [hx - w * 0.92, top - 40 * g], [hx - 26, top - 40 * g + 6]]), '#7aa3c2', 4);
    out(() => rr(hx - w * 0.82, top + 9, Math.max(4, w * 0.22), 5, 2), '#d8dce1', 2);
  }
  ctx.restore();
}
camry.info = {front: 197, rear: -196, top: -150, roof: [-36, -152], seat: [8, -62], len: 393, height: 150, wheels: CAM_WHEELS};
window.camry = camry;
const camPt = (cx, cy, s, lx, ly, dir = 1) => [cx + lx * s * dir, cy + ly * s];

// a Canberra share e-scooter (Beam is purple, Neuron is orange): a tall stem with a handlebar, a low deck, two small wheels.
// Wheels on y. Faces right (dir = -1 flips). opts: brand 'beam' | 'neuron', dir, rot (tips it over), parked (kickstand lean).
const SCOOTER_COL = {beam: ['#7d3fd8', '#5b2aa6'], neuron: ['#ff7a1a', '#c95a0c']};
function eScooter(x, y, s = 1, o = {}) {
  const {brand = 'beam', dir = 1, rot = 0, parked = true} = o, [col, dark] = SCOOTER_COL[brand] || SCOOTER_COL.beam;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s); ctx.rotate(rot + (parked ? -0.05 : 0)); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (parked) { ctx.strokeStyle = C.line; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-6, -12); ctx.lineTo(-14, 0); ctx.stroke(); }   // kickstand
  ctx.strokeStyle = C.line; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(34, -14); ctx.lineTo(24, -128); ctx.stroke();   // stem outline
  ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(34, -14); ctx.lineTo(24, -128); ctx.stroke();
  ctx.strokeStyle = C.line; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(8, -130); ctx.lineTo(40, -127); ctx.stroke();   // handlebar
  ctx.strokeStyle = '#2a2a31'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(10, -130); ctx.lineTo(38, -127); ctx.stroke();
  out(() => rr(17, -121, 14, 10, 3), '#2a2a31', 2.5);                               // the little screen
  out(() => ell(30, -78, 4, 4), '#fff6b0', 2);                                       // headlight on the stem
  out(() => rr(-38, -20, 70, 10, 4), col, 3.5);                                      // low deck
  ctx.fillStyle = dark; ctx.fillRect(-34, -13, 62, 3);
  out(() => { ctx.beginPath(); ctx.arc(-34, -10, 13, Math.PI, Math.PI * 1.6); ctx.lineTo(-34, -10); ctx.closePath(); }, dark, 3);   // rear mudguard
  for (const wx of [-34, 34]) { ell(wx, -9, 9, 9); ctx.fillStyle = '#26262b'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke(); ell(wx, -9, 3.5, 3.5); ctx.fillStyle = '#c9ced6'; ctx.fill(); }
  ctx.restore();
}
window.eScooter = eScooter;

// ---------------------------------------------------------------- shared scenery
function fadeEdges(t, dur) {
  const a = Math.max(1 - t / 0.18, (t - (dur - 0.25)) / 0.25, 0);
  if (a > 0) { ctx.fillStyle = `rgba(29,22,64,${clamp(a, 0, 1)})`; ctx.fillRect(0, 0, W, H); }
}
function confetti(t0, t, n, cx, cy, spread, seed = 1) {
  if (t < t0) return;
  const cols = ['#ff5d73', '#ffd21f', '#4fc3f7', '#7ed957', '#c47bff', '#ff9f43'];
  const k = t - t0;
  for (let i = 0; i < n; i++) {
    const r1 = Math.sin(i * 91.7 + seed) * 43758.5453 % 1, r2 = Math.sin(i * 12.9 + seed * 3) * 24634.6345 % 1, r3 = Math.sin(i * 7.7 + seed * 5) * 9341.11 % 1;
    const a = -Math.PI / 2 + (Math.abs(r1) - 0.5) * spread, v = 380 + Math.abs(r2) * 420;
    const px = cx + Math.cos(a) * v * k * 0.9 + Math.sin(k * 5 + i) * 18, py = cy + Math.sin(a) * v * k + 380 * k * k * 0.75;
    if (py > H + 30) continue;
    ctx.save(); ctx.translate(px, py); ctx.rotate(k * 7 * (Math.abs(r3) + 0.6) + i); ctx.scale(1, Math.cos(k * 9 + i));
    ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(-6, -3, 12, 6); ctx.restore();
  }
}
function leafTree(x, gy, s, col = '#8bd24f', dark = '#6eb23c') {
  ctx.strokeStyle = C.line; ctx.lineWidth = 4; out(() => rr(x - 9 * s, gy - 150 * s, 18 * s, 150 * s, 5), '#b49a7e', 4);
  const blobs = [[-55, -170, 62, 46], [40, -190, 66, 48], [-5, -235, 64, 46], [75, -150, 46, 34], [-80, -135, 40, 30]];
  for (const [dx, dy, rx, ry] of blobs) { ell(x + dx * s, gy + dy * s, rx * s, ry * s); ctx.stroke(); }
  blobs.forEach(([dx, dy, rx, ry], i) => { ell(x + dx * s, gy + dy * s, rx * s, ry * s); ctx.fillStyle = i % 2 ? dark : col; ctx.fill(); });
}
function brindyGate(x, gy) {
  // the sign is wide enough for the whole school name beside the logo's two swooshes (the name used to run off the sign and the screen)
  out(() => rr(x - 86, gy - 150, 18, 150, 3), '#b8644a', 4); out(() => rr(x + 68, gy - 150, 18, 150, 3), '#b8644a', 4);
  out(() => rr(x - 120, gy - 168, 240, 30, 6), '#e0463e', 4);
  ctx.save(); ctx.translate(-40, 0);
  ctx.lineCap = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = '#f2a0a0'; ctx.beginPath(); ctx.moveTo(x - 70, gy - 144); ctx.bezierCurveTo(x - 60, gy - 168, x - 46, gy - 146, x - 30, gy - 164); ctx.stroke();
  ctx.strokeStyle = '#2f5fb3'; ctx.beginPath(); ctx.moveTo(x - 68, gy - 150); ctx.bezierCurveTo(x - 58, gy - 164, x - 44, gy - 152, x - 28, gy - 160); ctx.stroke(); ctx.lineCap = 'butt';
  ctx.restore();
  font(10, 700); const tw = ctx.measureText(LINES_CANBERRA.gate).width, room = 166;
  smallText(LINES_CANBERRA.gate, x + 25, gy - 153, tw > room ? 10 * room / tw : 10, '#fff', 700);
}
function bricks(x, y, w, h, base, line) {
  ctx.fillStyle = base; ctx.fillRect(x, y, w, h); ctx.strokeStyle = line; ctx.lineWidth = 2;
  const rows = Math.round(h / 15);
  for (let r = 0; r <= rows; r++) { const yy = y + r * 15; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke();
    if (r < rows) for (let xx = x + (r % 2) * 18; xx < x + w; xx += 36) { ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, yy + 15); ctx.stroke(); } }
}

// ================================================================ 1. ESCAPE: Nailong bursts out of the LLC window
function sceneEscape(t) {
  // Picks up from the LLC clip ("I want to ride it." ... funny face ... he jumps): we are outside now, and he comes straight through
  // the window at ESC.burst, flies onto the Camry's roof, slides in the door, spins the wheels and peels off. Scene seconds (x0.7 wall).
  const D = CANBERRA_DUR.sceneEscape, gy = H * 0.74, roadY = gy + 96, E = ESC;
  cbCues('escape', t, ESC_SFX);
  const carS = 1.0, carX0 = W * 0.72;
  const spin = t < E.spin ? 0 : (t < E.go ? (t - E.spin) * 40 : (E.go - E.spin) * 40);
  const dk = Math.max(0, t - E.go), cdx = 105 * dk * dk;
  const revving = t > E.spin && t < E.go;
  const carX = carX0 + cdx + (revving ? Math.sin(t * 60) * 1.8 : 0);
  const wheel = spin + cdx / 35;
  let dip = 0;
  const land = t - E.land;
  if (land > 0 && land < 1.1) dip = Math.sin(land * 12) * 14 * Math.exp(-land * 4);
  const lean = t > E.go && t < E.go + 1.6 ? -0.035 * Math.sin(P(t, E.go, E.go + 1.6) * Math.PI) : 0;
  let door = 0; if (t > E.doorA && t < E.doorB) door = Math.sin(P(t, E.doorA, E.doorB) * Math.PI) ** 0.6;
  const inCab = t >= E.seat;
  const carBob = revving ? Math.sin(t * 70) * 2.2 : dip;
  sky(); sun(); cloud(W * 0.18, 90, 0.8); cloud(W * 0.66, 130, 0.6);
  ctx.save();
  ground(gy);
  const bx0 = -30, bx1 = W * 0.6, glassT = gy - 345, glassB = gy - 95;
  // the LLC (stand-in drawn from the school's library photo: tall glass, thin dark mullions, brick base, white fascia)
  ctx.strokeStyle = C.line; ctx.lineWidth = 4;
  ctx.fillStyle = '#eceae4'; ctx.fillRect(bx0, glassT - 32, bx1 - bx0, 345 + 32 - 95 + 4); ctx.strokeRect(bx0, glassT - 32, bx1 - bx0, 345 + 32 - 95 + 4);
  ctx.fillStyle = '#9fd8f2'; ctx.fillRect(bx0 + 12, glassT, bx1 - bx0 - 24, glassB - glassT);
  ctx.save(); ctx.beginPath(); ctx.rect(bx0 + 12, glassT, bx1 - bx0 - 24, glassB - glassT); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 12;
  for (let i = -2; i < 14; i++) { ctx.beginPath(); ctx.moveTo(bx0 + i * 150 + 90, glassB); ctx.lineTo(bx0 + i * 150 + 220, glassT); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = '#37404f'; ctx.lineWidth = 5;
  for (let x = bx0 + 12; x < bx1; x += 96) { ctx.beginPath(); ctx.moveTo(x, glassT); ctx.lineTo(x, glassB); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(bx0 + 12, glassT + 120); ctx.lineTo(bx1 - 12, glassT + 120); ctx.stroke();
  ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.strokeRect(bx0 + 12, glassT, bx1 - bx0 - 24, glassB - glassT);
  bricks(bx0, glassB, bx1 - bx0, gy - glassB, '#c06a46', 'rgba(74,47,12,.3)'); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.strokeRect(bx0, glassB, bx1 - bx0, gy - glassB);
  out(poly([[bx0 - 16, glassT - 30], [bx1 + 20, glassT - 52], [bx1 + 20, glassT - 24], [bx0 - 16, glassT - 6]]), '#fbfaf7', 4);
  out(() => rr(W * 0.05, glassT - 4, 330, 36, 6), '#e0463e', 4);
  smallText(LINES_CANBERRA.llcSign, W * 0.05 + 165, glassT + 14, 18, '#fff', 700);
  out(() => rr(W * 0.09 - 6, glassB + 10, 90, gy - glassB - 10, 4), '#5a7fa8', 4);
  // his window: the library inside (the same book colours as the LLC clip), Nailong crouched on the sill
  const wx = W * 0.37, ww = 220, wy = glassT + 118, wh = 150, bt = t - E.burst;
  const libInside = () => {
    ctx.fillStyle = '#4a3f7a'; ctx.fillRect(wx, wy, ww, wh);
    const books = ['#7b4b8a', '#3f6fa3', '#b8644a', '#5b8f6b', '#c9a24a', '#a04a5a'];
    for (let r = 0; r < 2; r++) { const base = wy + 54 + r * 62; let x = wx + 4, i = r * 7;
      while (x < wx + ww - 4) { const w = 13 + (i * 7 % 9), h = 34 + (i * 13 % 14); ctx.fillStyle = books[i % books.length]; ctx.fillRect(x, base - h, w, h); x += w + 2; i++; }
      ctx.fillStyle = '#7a5231'; ctx.fillRect(wx, base, ww, 8); }
  };
  if (bt < 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();
    libInside();
    const crouch = P(t, 0.05, E.burst - 0.1);
    nailong(wx + ww * 0.5, wy + wh - 6, 0.5, {sy: 1 - 0.26 * easeOut(crouch), sx: 1 + 0.16 * easeOut(crouch), look: [1, 0.35], mouth: 'open', arms: 'down'});
    ctx.restore();
    ctx.fillStyle = 'rgba(200,235,250,.22)'; ctx.fillRect(wx, wy, ww, wh);
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(wx + 40, wy + wh - 6); ctx.lineTo(wx + 100, wy + 6); ctx.stroke();
    const shake = t > E.burst - 0.4 ? Math.sin(t * 60) * 3 : 0;
    ctx.strokeStyle = '#37404f'; ctx.lineWidth = 6; ctx.strokeRect(wx + shake, wy, ww, wh);
  } else {
    ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip(); libInside(); ctx.restore();   // the window is open now, no glass
    ctx.strokeStyle = '#37404f'; ctx.lineWidth = 6; ctx.strokeRect(wx, wy, ww, wh);
    if (bt < 0.7) { ctx.save(); ctx.globalAlpha = Math.max(0, 1 - bt / 0.7); star4(wx + ww * 0.5, wy + wh * 0.5, 70 + bt * 110, bt * 2, '#fff6b0'); ctx.restore(); }
    for (let i = 0; i < 14 && bt < 1.4; i++) {                                                   // glass-free sparkles
      const a = i * 0.9 + 0.4, r = easeOut(P(bt, 0, 1.2)) * (130 + (i % 4) * 55);
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - bt / 1.4);
      star4(wx + ww * 0.5 + Math.cos(a) * r, wy + wh * 0.5 + Math.sin(a) * r * 0.8, 10 + (i % 3) * 5, bt * 5 + i, ['#fff6b0', '#ffffff', '#cdeeff'][i % 3]); ctx.restore();
    }
  }
  gum(W * 0.665, gy, 1.2);
  ctx.restore();
  ctx.fillStyle = '#6b6f7a'; ctx.fillRect(-10, roadY - 62, W + 20, H); ctx.fillStyle = '#c7c3b8'; ctx.fillRect(-10, roadY - 70, W + 20, 10);
  ctx.strokeStyle = '#ffe9a0'; ctx.lineWidth = 5; ctx.setLineDash([46, 34]); ctx.beginPath(); ctx.moveTo(-10, roadY + 76); ctx.lineTo(W + 10, roadY + 76); ctx.stroke(); ctx.setLineDash([]);
  brindyGate(W - 140, roadY - 66);   // its right edge stays on screen whatever the window width
  const cabLook = t < E.spin ? [0.5, -0.2] : [1, 0];
  const rearX = (cx) => cx + camry.info.rear * carS;
  if (t > E.go && t < E.go + 1.1) {   // Road Runner peel-out: a dust cloud hangs where the car stood, speed lines trail it
    const pk = P(t, E.go, E.go + 1.1), ps = lerp(1, 1.5, pk);
    [48, 62, 70, 56, 42].forEach((r, i) => puff(rearX(carX0) - 40 + i * 56, roadY - 52 - (i % 2) * 24, r * ps, 0.9 * (1 - pk)));
    if (carX < W + 100) {
      const len = 90 + 90 * Math.min(1, dk * 1.4), lx = rearX(carX) - 20;
      ctx.save(); ctx.globalAlpha = clamp((E.go + 1.1 - t) / 0.3, 0, 1); ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      for (let i = 0; i < 5; i++) { const ly = roadY - 40 - i * 26, sx = lx - (i % 2) * 18; ctx.beginPath(); ctx.moveTo(sx, ly); ctx.lineTo(sx - len, ly); ctx.stroke(); }
      ctx.restore();
    }
  }
  camry(carX, roadY, carS, {wheel, door, driver: inCab, look: cabLook, mouth: t > E.spin ? 'o' : 'smile', bob: carBob, lean, flash: t > E.spin + 0.2});
  if (t > E.spin && t < E.go + 2.2) for (let i = 0; i < 6; i++) { const k = ((t * 2 + i / 6) % 1), px = rearX(carX) - 8 - k * 90, py = roadY - 30 - k * 36;
    puff(px, py, 12 + k * 26, (1 - k) * 0.9); }
  if (t > E.go - 0.5 && t < E.go + 0.9) { const k = P(t, E.go - 0.5, E.go + 0.9), sc = 1 + 0.2 * Math.sin(k * 3); ctx.save(); ctx.translate(carX - 30, roadY - 236); ctx.rotate(-0.12 + Math.sin(t * 30) * 0.03); ctx.scale(sc, sc); title(LINES_CANBERRA.vroom, 0, 0, 56, '#ffd21f'); ctx.restore(); }
  const [rx, ry] = camPt(carX0, roadY + dip, carS, camry.info.roof[0], camry.info.roof[1]);
  const [dx, dy] = camPt(carX0, roadY, carS, camry.info.seat[0], camry.info.seat[1] - 4);
  const wcx = wx + ww * 0.5, wcy = wy + wh - 6;
  if (t >= E.burst && t < E.seat) {
    let x, y, rot = 0, sx = 1, sy = 1, sc = 0.5, o = {arms: 'up', flail: t * 14, look: [1, 0], mouth: 'open'};
    if (t < E.land) {                                                    // the flight: out of the window, one slow flip, down onto the roof
      const k = P(t, E.burst, E.land);
      x = lerp(wcx, rx, k); y = lerp(wcy, ry, k * k * 0.55 + k * 0.45) - Math.sin(Math.PI * k) * 220;
      rot = ease(k) * Math.PI * 2; const st = Math.sin(Math.PI * k); sx = 1 - 0.15 * st; sy = 1 + 0.2 * st; sc = lerp(0.5, 0.52, k);
      if (k < 0.1) { sx = 1 + 0.35 * (1 - k / 0.1); sy = 1 - 0.25 * (1 - k / 0.1); }
    } else if (t < E.slide) {                                            // land on the roof, squash, dizzy stars
      const k = t - E.land; x = rx + Math.sin(k * 7) * 3; y = ry + dip * 0.6;
      sy = 1 - 0.3 * Math.exp(-k * 6) * Math.cos(k * 12); sx = 1 + 0.25 * Math.exp(-k * 6); sc = 0.52;
      rot = Math.sin(k * 5) * 0.1; o = {arms: 'down', look: [Math.cos(k * 6), Math.sin(k * 6)], mouth: 'o'};
      for (let i = 0; i < 3; i++) { const a = k * 4 + i * Math.PI * 2 / 3; star4(x + Math.cos(a) * 46, y - 112 + Math.sin(a) * 12, 9, k * 3, '#ffd21f'); }
    } else {                                                             // slide down to the open door and squeeze into the seat
      const k = P(t, E.slide, E.seat), e = ease(k);
      x = lerp(rx, dx, e); y = lerp(ry, dy, e * e) - Math.sin(Math.PI * k) * 24; sc = lerp(0.52, 0.34, e); rot = Math.sin(k * Math.PI) * 0.5;
      sx = 1 + 0.15 * Math.sin(k * Math.PI); sy = 1 - 0.18 * Math.sin(k * Math.PI); o = {arms: 'down', look: [1, 0.3], mouth: 'o'};
    }
    // POW sits up and to the left of the window, so he flies clear of it (and is drawn on top)
    if (t < E.burst + 0.9) { const q = 1 + 0.3 * Math.sin(P(t, E.burst, E.burst + 0.9) * Math.PI); ctx.save(); ctx.translate(wx - 30, wy - 40); ctx.rotate(-0.14); ctx.scale(q, q); title(LINES_CANBERRA.pow, 0, 0, 62, '#ffd21f'); ctx.restore(); }
    nailong(x, y, sc, {...o, rot, sx, sy});
  }
  if (t > E.seat + 0.15 && t < E.go - 0.45) bubble(LINES_CANBERRA.wheel, carX0 + 10, roadY - 170, 26, 300);
  if (t > E.go + 1.3 && t < E.go + 2.7) title(LINES_CANBERRA.beep, Math.min(carX - 60, W - 150), roadY - 275, 36, '#fff');   // above the school gate's sign, not on it
  fadeEdges(t, D);
}
// the escape's beats in scene seconds: the window bursts, he lands on the roof, slides in, the wheels spin, the car goes
// (spin and go were 5.9 and 7.0: 0.4 s later so '...where did the road go?' reads twice before the VROOM)
const ESC = {burst: 0.7, land: 2.2, slide: 3.3, doorA: 3.0, seat: 4.1, doorB: 4.7, spin: 6.3, go: 7.4};
const ESC_SFX = [
  [0.3, 'tick', {p: 1.3, g: 0.3}], [0.42, 'tick', {p: 1.4, g: 0.3}], [0.54, 'tick', {p: 1.5, g: 0.3}],          // the window rattles as he crouches
  [ESC.burst, 'glass', {g: 0.9}, 'clink'], [ESC.burst + 0.02, 'crash', {p: 1.3, g: 0.6}, 'thud'],                  // POW: out through the window
  [ESC.burst + 0.15, 'whoosh', {p: 0.8}], [1.45, 'swish', {p: 0.9}],                                                // the flight and the flip
  [ESC.land, 'thud', {p: 0.8, g: 1.1}], [ESC.land + 0.03, 'boing', {p: 0.6, g: 0.5}],                               // onto the roof, the car bounces
  [ESC.land + 0.25, 'dizzy', {g: 0.6}, 'boing', {p: 1.6, g: 0.35}],                                                 // dizzy stars
  [ESC.doorA, 'tick', {p: 0.8, g: 0.5}],                                                                            // the door clicks open
  [ESC.slide + 0.05, 'whoosh', {p: 1.4, g: 0.45}], [ESC.seat - 0.05, 'squeak', {p: 0.8, g: 0.6}],                  // slides down, squeezes into the seat
  [ESC.doorB - 0.22, 'door', {}, 'thud', {p: 1.6, g: 0.4}],                                                        // creak, and it shuts
  [ESC.spin, 'engine'], [ESC.spin + 0.5, 'engine', {p: 1.15}],                                                      // the wheels spin
  [ESC.go, 'engine', {p: 1.35, g: 1.1}], [ESC.go + 0.02, 'whoosh', {p: 0.6}],                                       // VROOM
  [ESC.go + 1.3, 'honk'], [ESC.go + 1.6, 'honk', {p: 1.03}],                                                        // beep beep
];

// ================================================================ 2. CIVIC: the red light, the tram, the merry-go-round
function civicBackdrop(gy, t) {
  sky(); cloud(W * 0.15, 80, 0.7); cloud(W * 0.58, 120, 0.9); cloud(W * 0.9, 70, 0.6);
  // Garema Court: a pale cream curved block with deep-set square windows
  out(() => { ctx.beginPath(); ctx.moveTo(W * 0.02, gy - 70); ctx.lineTo(W * 0.02, gy - 360); ctx.lineTo(W * 0.44, gy - 360); ctx.quadraticCurveTo(W * 0.52, gy - 220, W * 0.44, gy - 70); ctx.closePath(); }, '#efe3c8', 4);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 10; c++) { const x = W * 0.045 + c * W * 0.039, y = gy - 340 + r * 54; if (x > W * 0.42 - r * 4) continue; out(() => rr(x, y, 26, 34, 3), '#7f9bb4', 3); ctx.fillStyle = 'rgba(74,47,12,.3)'; ctx.fillRect(x, y, 26, 6); }
  leafTree(W * 0.5, gy - 60, 1.05); leafTree(W * 0.96, gy - 60, 0.9); leafTree(W * 0.04, gy - 60, 0.8);
  // Merry-go-round: grey shuttered base, big red swooping roof, gold trim, pennants
  const mx = W * 0.77, my = gy - 60;
  out(() => rr(mx - 130, my - 120, 260, 120, 10), '#d8d8d4', 4);
  ctx.strokeStyle = 'rgba(74,47,12,.3)'; ctx.lineWidth = 2; for (let y = my - 112; y < my - 6; y += 12) { ctx.beginPath(); ctx.moveTo(mx - 126, y); ctx.lineTo(mx + 126, y); ctx.stroke(); }
  out(() => { ctx.beginPath(); ctx.moveTo(mx - 190, my - 112); ctx.quadraticCurveTo(mx - 110, my - 150, mx - 24, my - 300); ctx.lineTo(mx, my - 340); ctx.lineTo(mx + 24, my - 300); ctx.quadraticCurveTo(mx + 110, my - 150, mx + 190, my - 112); ctx.quadraticCurveTo(mx + 90, my - 130, mx, my - 120); ctx.quadraticCurveTo(mx - 90, my - 130, mx - 190, my - 112); ctx.closePath(); }, '#d6322f', 5);
  ctx.strokeStyle = '#f0b82b'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(mx - 184, my - 114); ctx.quadraticCurveTo(mx - 90, my - 134, mx, my - 124); ctx.quadraticCurveTo(mx + 90, my - 134, mx + 184, my - 114); ctx.stroke();
  for (let i = -3; i <= 3; i++) {   // the roof bulbs chase left to right, every third one lit
    const bx = mx + i * 52, by = my - 126 + Math.abs(i) * 2;
    if (((i - Math.floor(t * 6)) % 3 + 3) % 3 === 0) { ell(bx, by, 6 * 1.35, 6 * 1.35); ctx.fillStyle = '#ffd25a'; ctx.fill(); ell(bx, by, 6 * 1.35 + 3, 6 * 1.35 + 3); ctx.lineWidth = 3; ctx.strokeStyle = '#fff6b0'; ctx.stroke(); }
    else { ell(bx, by, 5, 5); ctx.fillStyle = '#c99a2e'; ctx.fill(); }
  }
  for (const fx of [-70, 70]) { ctx.strokeStyle = C.line; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(mx + fx, my - 150); ctx.lineTo(mx + fx, my - 215); ctx.stroke();
    ctx.save(); ctx.translate(mx + fx, my - 215); ctx.scale(1 + Math.sin(t * 5 + fx) * 0.12, 1); out(poly([[0, 0], [30, 8], [0, 18]]), '#ffb347', 2.5); ctx.restore(); }
  smallText(LINES_CANBERRA.merry, mx, my - 62, 18, '#7c3b2b', 700);
  ctx.fillStyle = '#e8c1b2'; ctx.fillRect(-10, gy - 60, W + 20, H); ctx.fillStyle = '#d9a99a'; ctx.fillRect(-10, gy - 60, W + 20, 8);
}
function tram(x, y, L = 700) {
  // red-and-white light rail (Urbos), travelling right. x is the nose.
  ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round';
  const x0 = -L, h = 150;
  const shape = () => { ctx.beginPath(); ctx.moveTo(x0, -h); ctx.lineTo(-40, -h); ctx.quadraticCurveTo(14, -h + 8, 22, -h * 0.55); ctx.lineTo(18, -22); ctx.lineTo(x0, -22); ctx.closePath(); };
  out(shape, '#fafafa', 5);
  ctx.save(); shape(); ctx.clip(); ctx.fillStyle = '#d6322f'; ctx.fillRect(x0 - 20, -h - 10, L + 80, h * 0.4); ctx.fillRect(x0, -62, L + 18, 22); ctx.restore();
  ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.strokeRect(x0, -62, L + 18, 22);
  for (let wxx = x0 + 30; wxx < -150; wxx += 120) out(() => rr(wxx, -h + 36, 86, 52, 8), '#232b3a', 3);
  for (let wxx = x0 + 120; wxx < -100; wxx += 120) { ctx.strokeStyle = C.line; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wxx, -h + 4); ctx.lineTo(wxx, -22); ctx.stroke(); }
  out(poly([[-130, -h + 36], [-24, -h + 40], [8, -h * 0.58], [-130, -h * 0.58]]), '#232b3a', 4);
  out(() => rr(-100, -h + 8, 80, 22, 6), '#101218', 3); smallText(LINES_CANBERRA.tramDest, -60, -h + 19, 13, '#ffb347', 700);
  out(() => ell(12, -48, 7, 7), '#fff6b0', 3);
  out(() => rr(-282, -59, 44, 16, 4), '#fff', 2); smallText(LINES_CANBERRA.tramNo, -260, -50.5, 11, C.line, 700);   // fleet plate by the first door
  for (const bx of [x0 + 90, -150]) out(() => rr(bx - 40, -20, 80, 16, 6), '#2a2a31', 3);
  ctx.restore();
}
const CIVIC_DING = [0.75, 0.945, 1.125];   // the merry-go-round's little three-note tune (pitch multipliers on the ding)
const CIVIC_SFX = [
  [0.1, 'engine', {g: 0.7}],
  ...CIVIC_DING.map((p, i) => [0.35 + i*0.25, 'ding', {p, g: 0.35}, 'clink']),                                   // the merry-go-round
  [1.25, 'boing', {p: 1.7, g: 0.3}],                                                                             // the magpie lands, the wire twangs
  [1.75, 'squeak', {p: 0.45, g: 0.6}],                                                                           // brakes for the red light
  [2.35, 'swish', {p: 1.2, g: 0.5}],                                                                             // the magpie flaps off
  [2.9, 'tram', {}, 'clink'],                                                                                    // ding ding!
  [5.3, 'honk', {g: 0.7}], [5.35, 'engine'],                                                                     // green: a happy honk, and off to the kerb
  [6.6, 'door', {p: 1.05}, 'tick'],
  [7.0, 'boing', {p: 1.2, g: 0.6}], [7.9, 'thud', {p: 1.5, g: 0.6}],                                             // hops out, lands
  ...[9.04, 9.33, 9.61, 9.9, 10.19, 10.47].map(x => [x, 'tick', {p: 0.9, g: 0.3}]),                               // trots off
  ...CIVIC_DING.map((p, i) => [9.1 + i*0.25, 'ding', {p, g: 0.3}, 'clink']),                                     // toward the merry-go-round
];
function sceneCivic(t) {
  const D = CANBERRA_DUR.sceneCivic, gy = H * 0.7, roadY = gy + 150;
  cbCues('civic', t, CIVIC_SFX);
  civicBackdrop(gy, t);
  ctx.fillStyle = '#7aa85a'; ctx.fillRect(-10, gy - 4, W + 20, 46);
  ctx.fillStyle = '#5d5f68'; ctx.fillRect(-10, gy + 40, W + 20, 20);
  ctx.strokeStyle = '#2b2d35'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-10, gy + 44); ctx.lineTo(W + 10, gy + 44); ctx.moveTo(-10, gy + 56); ctx.lineTo(W + 10, gy + 56); ctx.stroke();
  ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 3; for (let x = 0; x < W; x += 140) { ctx.beginPath(); ctx.moveTo(x, gy - 150); ctx.lineTo(x, gy + 40); ctx.stroke(); }
  // the overhead wire; a magpie swoops onto it (the wire dips under her), sits, then flaps off as the tram's nose arrives
  const wireY = gy - 150, mgX = W * 0.27, mgLand = 1.25, wk = (t - mgLand) / 0.3, dip = wk > 0 && wk < 1 ? 5 * Math.sin(Math.PI * wk) : 0;
  ctx.strokeStyle = '#2b2d35'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, wireY);
  if (dip) { const pl = Math.floor(mgX / 140) * 140, pr = pl + 140;   // sag between the two poles either side of her
    ctx.lineTo(pl, wireY); ctx.quadraticCurveTo(clamp(2 * mgX - (pl + pr) / 2, pl, pr), wireY + 2 * dip, pr, wireY); }
  ctx.lineTo(W, wireY); ctx.stroke();
  if (t > 0.9 && t < 2.9) {
    let x = mgX, y = wireY + dip, o;
    if (t < mgLand) { const k = easeOut(P(t, 0.9, mgLand)); x = lerp(mgX + 280, mgX, k); y = lerp(-50, wireY, k); o = {flying: true, flap: t, dir: -1, rot: -0.3 * (1 - k)}; }
    else if (t < 2.35) { const q = clamp(1 - (t - mgLand) / 0.25, 0, 1); o = {dir: -1, sx: 1 + 0.15 * q, sy: 1 - 0.2 * q, tilt: Math.floor((t - 1.2) / 0.7) % 2 ? -0.25 : 0.25}; }
    else { const k = P(t, 2.35, 2.9); x = mgX + 40 * k + 260 * k * k; y = wireY - 420 * (0.4 * k + 0.6 * k * k); o = {flying: true, flap: t, dir: 1, rot: -0.35}; }
    magpie(x, y, 1, o);
  }
  // two share e-scooters parked on the Civic footpath, as they always are: a purple Beam and an orange Neuron
  eScooter(W * 0.19, gy - 10, 0.75, {brand: 'beam'}); eScooter(W * 0.3, gy - 8, 0.75, {brand: 'neuron'});
  const tk = P(t, 2.35, 5.3);
  if (tk > 0 && tk < 1) tram(lerp(-60, W + 760, tk), gy + 52);
  out(() => rr(W * 0.1, gy - 120, 8, 120, 2), '#4b5160', 3); out(() => rr(W * 0.1 - 60, gy - 190, 128, 62, 8), '#2b3a7a', 4);
  smallText(LINES_CANBERRA.alinga, W * 0.1 + 4, gy - 159, 26, '#fff', 700);
  ctx.fillStyle = '#4d5059'; ctx.fillRect(-10, roadY - 76, W + 20, H); ctx.fillStyle = '#b9b3a8'; ctx.fillRect(-10, roadY - 84, W + 20, 10);
  ctx.strokeStyle = '#f4f0e3'; ctx.lineWidth = 5; ctx.setLineDash([46, 34]); ctx.beginPath(); ctx.moveTo(-10, roadY + 90); ctx.lineTo(W + 10, roadY + 90); ctx.stroke(); ctx.setLineDash([]);
  const lx = W * 0.62, green = t > 5.3;
  out(() => rr(lx - 4, roadY - 250, 8, 170, 2), '#3c3f48', 3); out(() => rr(lx - 17, roadY - 300, 34, 62, 8), '#1c1d24', 3);
  ell(lx, roadY - 282, 9, 9); ctx.fillStyle = green ? '#3b2020' : '#ff4040'; ctx.fill(); ell(lx, roadY - 256, 9, 9); ctx.fillStyle = green ? '#40e070' : '#203b20'; ctx.fill();
  const xStop = W * 0.44, xKerb = W * 0.58;
  let carX, lean = 0;
  if (t < 2.4) { const k = P(t, 0, 2.4); carX = lerp(-300, xStop, easeOut(k)); lean = 0.055 * Math.sin(P(t, 1.7, 2.4) * Math.PI); }
  else if (t < 5.3) { carX = xStop; lean = 0.05 * Math.exp(-(t - 2.4) * 4) * Math.cos((t - 2.4) * 12); }
  else if (t < 6.5) { const k = P(t, 5.3, 6.5); carX = lerp(xStop, xKerb, ease(k)); lean = -0.03 * Math.sin(k * Math.PI); }
  else carX = xKerb;
  const doorK = t < 6.6 ? 0 : clamp((t - 6.6) / 0.35, 0, 1);
  const driver = t < 7.0;
  const look = t < 2.4 ? [1, 0] : t < 5.3 ? [clamp(1 - 2 * tk, -1, 1), -0.2] : [1, 0];
  const cty = roadY + 20;
  camry(carX, cty, 0.95, {wheel: carX / 33, door: doorK, driver, look, mouth: t > 2.6 && t < 5.2 ? 'o' : 'smile', lean});
  if (t > 2.4 && t < 3.0) for (let i = 0; i < 3; i++) puff(carX - 220 * 0.95 - i * 18, cty - 14 - i * 8, 10 + i * 5, 0.6 * (1 - P(t, 2.4, 3.0)));
  if (t > 2.9 && t < 4.6) title(LINES_CANBERRA.ding, W * 0.3 + Math.sin(t * 20) * 3, gy - 220, 44, '#ffd21f');
  if (t > 2.7 && t < 5.3) bubble(LINES_CANBERRA.redLight, carX, cty - 0.95 * 150, 24, 280);
  if (t >= 7.0) {   // hop out of the car, then trot off toward the merry-go-round and Civic Dash
    const [ex, ey] = camPt(carX, cty, 0.95, 10, -64);
    const k = P(t, 7.0, 7.9); const gx = carX + 70, gyy = cty + 36;
    let x, y, sx = 1, sy = 1, o = {arms: 'up', flail: t * 14, look: [1, 0], mouth: 'open'}, sc = 0.3 + 0.2 * ease(k);
    if (t < 7.9) { x = lerp(ex, gx, k); y = lerp(ey, gyy, k * k) - Math.sin(Math.PI * k) * 120; sx = 1 - 0.12 * Math.sin(Math.PI * k); sy = 1 + 0.18 * Math.sin(Math.PI * k); }
    else { const w = t - 7.9; x = gx + Math.max(0, w - 0.9) * 150; y = gyy - (w > 0.9 ? Math.abs(Math.sin(w * 11)) * 8 : 0); sc = 0.5;
      if (w < 0.35) { sy = 1 - 0.25 * Math.sin(w / 0.35 * Math.PI); sx = 1 + 0.2 * Math.sin(w / 0.35 * Math.PI); }
      o = {arms: 'down', walk: w * 12, look: [1, 0], mouth: 'smile'}; }
    nailong(x, y, sc, {...o, sx, sy});
    if (t > 8.1 && t < 10.75) bubble(LINES_CANBERRA.civicOut, x, y - 0.5 * 190, 26, 320);
  }
  fadeEdges(t, D);
}

// ================================================================ 3. BRIDGE: Commonwealth Avenue Bridge and the Captain Cook Memorial Jet
function jetColumn(x, baseY, topY, t) {
  const pulse = 1 + Math.sin(t * 3.1) * 0.05, w0 = 7 * pulse, w1 = 21 * pulse;
  ctx.save(); ctx.fillStyle = '#ffffff'; ctx.strokeStyle = 'rgba(74,47,12,.45)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x - w0, baseY);
  for (let i = 0; i <= 12; i++) { const k = i / 12, yy = lerp(baseY, topY, k), ww = lerp(w0, w1, Math.pow(k, 1.6)) * (1 + Math.sin(t * 5 + k * 9) * 0.05); ctx.lineTo(x - ww, yy); }
  ctx.quadraticCurveTo(x, topY - 40, x + w1, topY);
  for (let i = 12; i >= 0; i--) { const k = i / 12, yy = lerp(baseY, topY, k), ww = lerp(w0, w1, Math.pow(k, 1.6)) * (1 + Math.sin(t * 5 + k * 9 + 2) * 0.05); ctx.lineTo(x + ww, yy); }
  ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  for (let i = 0; i < 8; i++) { const k = (t * 0.6 + i / 8) % 1; ell(x + Math.sin(i * 3 + t) * 30 * k, topY + k * 150, 6 + k * 5, 6 + k * 5); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fill(); }
}
function globeSculpture(x, y, r, t) {
  // the skeleton globe: bronze meridians and continent patches, on a round stone pool
  out(() => ell(x, y + r * 0.95, r * 1.6, r * 0.32), '#c7bba0', 4);
  out(() => ell(x, y + r * 0.9, r * 1.35, r * 0.24), '#8aa86a', 3);
  ctx.save(); ctx.translate(x, y); out(() => ell(0, 0, r, r), 'rgba(160,110,80,.25)', 6, '#7a5036');
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.clip();
  ctx.strokeStyle = '#7a5036'; ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) { const a = t * 0.8 + i * Math.PI / 6; ell(0, 0, Math.abs(Math.cos(a)) * r, r); ctx.stroke(); }
  for (let j = -2; j <= 2; j++) { ctx.beginPath(); ctx.moveTo(-r, j * r * 0.35); ctx.lineTo(r, j * r * 0.35); ctx.stroke(); }
  ctx.fillStyle = '#8a6049';
  for (const [dx, dy, rx, ry] of [[-0.35, -0.2, 0.3, 0.35], [0.45, 0.1, 0.22, 0.4], [-0.1, 0.55, 0.25, 0.2]]) { const px = (((dx + t * 0.25 + 1.5) % 3 + 3) % 3 - 1.5) * r; ell(px, dy * r, rx * r, ry * r); ctx.fill(); }
  ctx.restore(); ell(x, y, r, r); ctx.lineWidth = 6; ctx.strokeStyle = C.line; ctx.stroke();
}
// Nailong drives along the lake past the globe and the jet (the spray soaks him), then brakes at the foot of the arched bridge as
// Block Blast blocks tumble out of the sky onto the road ahead. Block Blast picks up from here: he drives, she clears the road.
// The bridge rises as a slice of a circle (Max: "a circle with about 20% of it so there's a decent slope"): 72 degrees of arc.
// wetSay, why and clear were 3.9, 7.7 and 9.8 (each line held under 2 s of scene time); now each holds about 2.5 s (3.6 s on screen)
const BR_V = 520, BR = {brake: 4.6, stop: 7.0, splash: 2.6, wetSay: 3.7, rocks: 6.2, why: 7.2, clear: 10.1};
const BR_SAY = {wetSay: 2.5, why: 2.6};   // how long the first two lines stay up; the last one stays to the end of the clip
const BR_SC_END = BR_V * BR.brake + BR_V * (BR.stop - BR.brake) / 2;
const BR_ARC = (() => { const c = 1700, half = Math.PI / 5, R = c / (2 * Math.sin(half)); return {c, R, h: R * (1 - Math.cos(half))}; })();
// the falling pieces: where they land (units past the bridge foot), when they drop, their cells [col, row from the bottom], colour, tumble
const BR_PIECES = [
  {dx: 60, t0: BR.rocks, cells: [[0, 0]], col: '#4fc46a', spin: 5},
  {dx: 260, t0: BR.rocks + 0.45, cells: [[0, 0], [1, 0], [0, 1], [1, 1]], col: '#a56cf0', spin: -4},
  {dx: 400, t0: BR.rocks + 0.9, cells: [[0, 0], [1, 0], [2, 0]], col: '#ff5d73', spin: 6},
  {dx: 150, t0: BR.rocks + 1.35, cells: [[0, 0], [0, 1], [1, 0]], col: '#4fc3f7', spin: -5},
  {dx: 520, t0: BR.rocks + 1.7, cells: [[0, 0]], col: '#ffd21f', spin: 7},
];
const BR_SFX = [
  [0.1, 'engine', {g: 0.7}],
  [BR.splash, 'whoosh', {p: 0.5, g: 0.7}], [BR.splash + 0.25, 'splash', {g: 1.1}, 'whoosh', {p: 0.35}],         // the jet's spray soaks the car
  ...[3.3, 3.75, 4.3, 4.9].map((x, i) => [x, 'tick', {p: 2.0 + i*0.1, g: 0.2}]),                                   // drip, drip
  [BR.brake, 'squeak', {p: 0.4, g: 0.7}], [BR.brake + 1.1, 'squeak', {p: 0.38, g: 0.5}],                           // hard on the brakes
  ...BR_PIECES.map((p, i) => [p.t0 + 0.05, 'whoosh', {p: 1.5 + i*0.12, g: 0.4}]),                                 // blocks tumble out of the sky
  ...BR_PIECES.map(p => [p.t0 + 0.9, 'thud', {p: 1.4 - p.cells.length*0.12, g: 0.9}]),                           // and hit the road
  ...BR_PIECES.filter(p => p.cells.length >= 4).map(p => [p.t0 + 0.92, 'crash', {p: 1.2, g: 0.55}, 'thud', {p: 0.7}]),   // the big one crashes
  [BR.clear + 0.2, 'engine', {g: 0.8}], [BR.clear + 0.9, 'engine', {p: 1.12}], [BR.clear + 1.6, 'engine', {p: 1.25, g: 1.1}],   // revving, ready
];
function bbCell(x, y, cs, col) {   // one jelly block, Block Blast style: rounded, thick outline, a shine on top, a darker lip below
  out(() => rr(x, y, cs, cs, cs * 0.22), col, 4);
  ctx.fillStyle = 'rgba(255,255,255,.45)'; rr(x + cs * 0.16, y + cs * 0.12, cs * 0.5, cs * 0.16, cs * 0.08); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.14)'; rr(x + cs * 0.12, y + cs * 0.72, cs * 0.76, cs * 0.14, cs * 0.07); ctx.fill();
}
function sceneBridge(t) {
  const D = CANBERRA_DUR.sceneBridge, hz = H * 0.5, roadY = H * 0.8;
  cbCues('bridge', t, BR_SFX);
  const kk = clamp(t - BR.brake, 0, BR.stop - BR.brake), bk = BR.stop - BR.brake;
  const scroll = t < BR.brake ? BR_V * t : BR_V * BR.brake + BR_V * (kk - kk * kk / (2 * bk));
  const cs = 46, cx = W * 0.3, carS = 0.95, carY = roadY + 56;
  const bf = cx + camry.info.front * carS + 95 + (BR_SC_END - scroll);   // the bridge foot, on screen
  const {c: AC, R: AR, h: AH} = BR_ARC, axc = bf + AC / 2, ayc = carY + (AR - AH);
  const arcY = x => ayc - Math.sqrt(Math.max(0, AR * AR - (x - axc) * (x - axc)));      // the bridge's road line (car wheels sit on it)
  const arcA = x => Math.atan((x - axc) / Math.sqrt(Math.max(1, AR * AR - (x - axc) * (x - axc))));
  let shk = 0; for (const p of BR_PIECES) { const k = t - p.t0 - 0.9; if (k > 0 && k < 0.3) shk = Math.max(shk, 1 - k / 0.3); }
  ctx.save(); ctx.translate(...fxShake(shk, 5));
  const sk = ctx.createLinearGradient(0, 0, 0, hz); sk.addColorStop(0, '#3fa2ee'); sk.addColorStop(1, '#bfe6fb'); ctx.fillStyle = sk; ctx.fillRect(-20, -20, W + 40, hz + 22);
  cloud(W * 0.2, 110, 0.9); cloud(W * 0.82, 70, 0.7);
  ctx.fillStyle = '#4c8a54'; ctx.fillRect(-10, hz - 26, W + 20, 30);
  for (let x = 0; x < W; x += 46) { ell(x, hz - 26, 30, 22); ctx.fillStyle = (x / 46) % 2 ? '#3f7a4a' : '#559a5c'; ctx.fill(); }
  out(() => rr(W * 0.22, hz - 62, 190, 30, 3), '#e9e3d4', 3); for (let i = 0; i < 12; i++) { ctx.fillStyle = '#9aa0a8'; ctx.fillRect(W * 0.22 + 8 + i * 15, hz - 54, 6, 22); }
  // Parliament House's flagpole across the lake: the legs stand apart on the ground and meet at the top, the mast and flag above
  // (it was drawn upside down, legs meeting at the ground, and read as a down arrow)
  { const fx = W * 0.86, fb = hz - 26, ap = fb - 58;
    ctx.strokeStyle = '#cfd5dc'; ctx.lineWidth = 3; ctx.beginPath();
    ctx.moveTo(fx - 24, fb); ctx.lineTo(fx, ap); ctx.lineTo(fx + 24, fb); ctx.moveTo(fx - 9, fb); ctx.lineTo(fx, ap); ctx.lineTo(fx + 9, fb); ctx.moveTo(fx, ap); ctx.lineTo(fx, ap - 30); ctx.stroke();
    ctx.fillStyle = '#22408f'; ctx.fillRect(fx, ap - 30, 14, 8); }
  const wg = ctx.createLinearGradient(0, hz, 0, H); wg.addColorStop(0, '#5eb0e6'); wg.addColorStop(1, '#2f7fc4'); ctx.fillStyle = wg; ctx.fillRect(-20, hz, W + 40, H);
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let i = 0; i < 14; i++) { const yy = hz + 18 + (i * 29) % 160, xx = ((i * 211 - scroll * 0.2 + t * 14) % (W + 200) + W + 200) % (W + 200) - 100; ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + 40 + (i % 3) * 14, yy); ctx.stroke(); }
  ctx.lineCap = 'butt';
  const jx = W * 0.6; jetColumn(jx, hz + 8, H * 0.05, t); ell(jx, hz + 12, 60, 8); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fill();
  const signX = bf - 30, signHides = bf < W + 40 && signX - 175 < jx + 140 && signX + 175 > jx - 140;
  if (!signHides) smallText(LINES_CANBERRA.jetSign, jx, hz + 40, 15, '#fff', 700);   // the name sits on the water under the jet; hidden once the bridge sign stands in front of it
  // the lakeside wall and lamp posts slide past
  const deckT = roadY - 86, M = (v, n) => ((v % n) + n) % n;
  ctx.fillStyle = '#d6d0c2'; ctx.fillRect(-10, deckT + 70, W + 20, 78); ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.strokeRect(-10, deckT + 70, W + 20, 78);
  for (let i = -1; i < 8; i++) { const ax = M(i * 230 - scroll, 8 * 230) - 130; ctx.beginPath(); ctx.moveTo(ax, deckT + 148); ctx.quadraticCurveTo(ax + 100, deckT + 90, ax + 200, deckT + 148); ctx.fillStyle = '#4aa0dc'; ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = '#e4dfd2'; ctx.fillRect(-10, deckT, W + 20, 72); ctx.strokeRect(-10, deckT, W + 20, 72);
  ctx.strokeStyle = 'rgba(74,47,12,.4)'; ctx.lineWidth = 3;
  for (let i = -1; i < 40; i++) { const px = M(i * 64 - scroll, 40 * 64) - 64; ctx.beginPath(); ctx.moveTo(px, deckT + 6); ctx.lineTo(px, deckT + 66); ctx.stroke(); }
  for (let i = -1; i < 7; i++) {
    const lp = M(i * 380 - scroll, 7 * 380) - 190;
    ctx.strokeStyle = '#3c4452'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(lp, deckT + 70); ctx.lineTo(lp, deckT - 200); ctx.quadraticCurveTo(lp, deckT - 240, lp + 50, deckT - 232); ctx.stroke(); ctx.lineCap = 'butt';
    out(() => rr(lp + 40, deckT - 240, 40, 12, 6), '#fff6b0', 3);
  }
  // the globe sculpture at Regatta Point slides past early on
  const gx = W * 0.85 + 500 - scroll;
  const globeOn = gx > -200 && gx < W + 200;
  if (globeOn) globeSculpture(gx, roadY - 98, 62, t);
  ctx.fillStyle = '#4d5059'; ctx.fillRect(-10, roadY - 8, W + 20, H); ctx.fillStyle = '#b9b3a8'; ctx.fillRect(-10, roadY - 12, W + 20, 6);
  ctx.strokeStyle = '#f4f0e3'; ctx.lineWidth = 5; ctx.setLineDash([46, 34]); ctx.lineDashOffset = scroll; ctx.beginPath(); ctx.moveTo(-10, roadY + 66); ctx.lineTo(Math.min(W + 10, bf), roadY + 66); ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
  // the bridge: concrete body with arches over the water, the road deck curving up, a railing along it
  if (bf < W + 40) {
    const x1 = W + 30, step = 12, along = (f) => { for (let x = bf; x <= x1; x += step) f(x, arcY(Math.min(x, x1))); };
    ctx.beginPath(); along((x, y) => x === bf ? ctx.moveTo(x, y + 30) : ctx.lineTo(x, y + 30)); ctx.lineTo(x1, H + 20); ctx.lineTo(bf, H + 20); ctx.closePath();
    ctx.fillStyle = '#d6d0c2'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
    ctx.save(); ctx.beginPath(); along((x, y) => x === bf ? ctx.moveTo(x, y + 30) : ctx.lineTo(x, y + 30)); ctx.lineTo(x1, H + 20); ctx.lineTo(bf, H + 20); ctx.closePath(); ctx.clip();
    for (const ax of [bf + 250, bf + 560, bf + 870]) { const top = arcY(ax) + 95; ctx.beginPath(); ctx.moveTo(ax - 120, H + 20); ctx.lineTo(ax - 120, top + 70); ctx.quadraticCurveTo(ax, top - 30, ax + 120, top + 70); ctx.lineTo(ax + 120, H + 20); ctx.closePath(); ctx.fillStyle = '#4aa0dc'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke(); }
    ctx.restore();
    ctx.beginPath(); along((x, y) => x === bf ? ctx.moveTo(x, y - 64) : ctx.lineTo(x, y - 64)); for (let x = x1; x >= bf; x -= step) ctx.lineTo(x, arcY(x) + 30); ctx.closePath();
    ctx.fillStyle = '#4d5059'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
    ctx.beginPath(); along((x, y) => x === bf ? ctx.moveTo(x, y - 60) : ctx.lineTo(x, y - 60)); ctx.lineWidth = 6; ctx.strokeStyle = '#b9b3a8'; ctx.stroke();
    ctx.beginPath(); along((x, y) => x === bf ? ctx.moveTo(x, y + 10) : ctx.lineTo(x, y + 10)); ctx.setLineDash([46, 34]); ctx.lineWidth = 5; ctx.strokeStyle = '#f4f0e3'; ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = C.line; ctx.lineWidth = 4;                                     // railing: posts and a top rail
    for (let x = bf + 10; x < x1; x += 34) { const y = arcY(x); ctx.beginPath(); ctx.moveTo(x, y - 64); ctx.lineTo(x, y - 100); ctx.stroke(); }
    ctx.beginPath(); along((x, y) => x === bf ? ctx.moveTo(x, y - 100) : ctx.lineTo(x, y - 100)); ctx.lineWidth = 8; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = '#e4dfd2'; ctx.stroke();
    // the green road sign at the bridge's start
    const sx = bf - 30, sy = carY - 64;
    out(() => rr(sx - 4, sy - 150, 8, 150, 2), '#8a8f99', 3);
    out(() => rr(sx - 175, sy - 214, 350, 66, 8), '#1f7a46', 4);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; rr(sx - 168, sy - 207, 336, 52, 6); ctx.stroke();
    smallText(LINES_CANBERRA.bridgeSign, sx, sy - 181, 20, '#fff', 700);
  }
  // the car: cruising, a soaking, then hard on the brakes at the foot of the bridge
  let lean = -0.015;
  if (t > BR.brake && t < BR.stop) lean = 0.035 * P(t, BR.brake, BR.stop);
  else if (t >= BR.stop) lean = 0.035 * Math.exp(-(t - BR.stop) * 5) * Math.cos((t - BR.stop) * 14);
  const sp = P(t, BR.splash, BR.splash + 1.4), wet = P(t, BR.splash + 0.3, BR.splash + 0.7) * (1 - P(t, BR.rocks, BR.rocks + 0.4));
  const scared = t > BR.rocks + 0.3, rev = t > BR.clear + 0.2;
  const wob = (t > BR.splash + 0.3 && t < BR.splash + 0.9) ? Math.sin(t * 50) * 2 : rev ? Math.sin(t * 70) * 2 : 0;
  const look = scared ? [1, -0.9] : wet > 0.05 ? [0.3, -1] : [0.8, -0.2];
  const mouth = scared ? 'open' : (t > BR.splash + 0.3 && t < BR.wetSay + BR_SAY.wetSay - 0.1) ? 'o' : 'smile';
  if (rev) for (let i = 0; i < 5; i++) { const k = (t * 2.2 + i / 5) % 1; puff(cx + camry.info.rear * carS - 8 - k * 70, carY - 28 - k * 30, 10 + k * 20, (1 - k) * 0.85); }
  camry(cx, carY, carS, {wheel: scroll / 33, driver: true, look, mouth, lean, bob: wob});
  if (sp > 0 && sp < 1) {   // the jet's spray gusts across the car
    for (let i = 0; i < 22; i++) { const px = jx - 120 + (i * 37 % 160) - sp * (W * 0.32) + Math.sin(i + t * 8) * 14, py = roadY - 150 + (i * 53 % 160) - Math.sin(sp * 3) * 40 + sp * 60;
      ell(px, py, 7, 9); ctx.fillStyle = `rgba(255,255,255,${0.9 * (1 - Math.abs(sp - 0.5) * 1.4)})`; ctx.fill(); }
    ctx.fillStyle = `rgba(255,255,255,${0.35 * Math.sin(sp * Math.PI)})`; ell(cx + 40, roadY - 70, 230 * sp + 60, 120); ctx.fill();
    if (sp > 0.2 && sp < 0.85) { const q = 1 + 0.1 * Math.sin(t * 20); ctx.save(); ctx.translate(cx + 40, roadY - 250); ctx.rotate(-0.08); ctx.scale(q, q); title(LINES_CANBERRA.splash, 0, 0, 58, '#9fe3ff'); ctx.restore(); }
  }
  if (wet > 0.05) for (let i = 0; i < 6; i++) { const k = (t * 1.4 + i * 0.17) % 1; ell(cx - 120 + i * 44, carY - 110 + k * 70, 4, 6); ctx.fillStyle = `rgba(160,225,255,${0.9 * wet * (1 - k)})`; ctx.fill(); }
  // the blocks tumble out of the sky and land on the bridge road, tipped to its slope
  for (const p of BR_PIECES) {
    const k = t - p.t0; if (k < 0) continue;
    const cols = Math.max(...p.cells.map(c => c[0])) + 1, pw = cols * cs, fall = Math.min(1, k / 0.9), x = bf + p.dx;
    const gy = arcY(x) - 2, ang = arcA(x), y = lerp(-140, gy, fall * fall), rot = ang + (1 - fall) * p.spin;
    let sx = 1, sy = 1; if (fall >= 1) { const q = Math.max(0, 1 - (k - 0.9) * 4); sx = 1 + 0.2 * q; sy = 1 - 0.25 * q; }
    if (fall >= 1 && k < 1.5) for (const d of [-1, 1]) { const q = (k - 0.9) / 0.6; puff(x + d * (pw * 0.5 + q * 40), gy - 8 - q * 10, 14 * (1 - q * 0.4), 0.8 * (1 - q)); }
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sx, sy);
    if (fall < 1) ctx.translate(0, -cs * 0.6);   // tumble around the piece's middle while it falls
    for (const [c0, r0] of p.cells) bbCell(c0 * cs - pw / 2, -(r0 + 1) * cs + (fall < 1 ? cs * 0.6 : 0), cs, p.col);
    ctx.restore();
  }
  const say = [cx + camry.info.seat[0] * carS, carY - 135];
  if (LINES_CANBERRA.dry && t > BR.wetSay && t < BR.wetSay + BR_SAY.wetSay) bubble(LINES_CANBERRA.dry, say[0], say[1], 26, 420);   // wide enough for one line (it used to leave "dragon." alone on a second line)
  if (t > BR.why && t < BR.why + BR_SAY.why) bubble(LINES_CANBERRA.blocks, say[0], say[1], 26, 340);
  if (t > BR.clear) { const q = P(t, BR.clear, BR.clear + 0.3); ctx.save(); ctx.translate(say[0] + 40, say[1] - 30); ctx.scale(0.8 + 0.2 * q, 0.8 + 0.2 * q); bubble(LINES_CANBERRA.clear, 0, 10, 30, 380); ctx.restore(); }
  ctx.restore();
  fadeEdges(t, D);
}

// ================================================================ 4. PARLIAMENT HOUSE (finale): a big happy 18th birthday
function parliamentBackdrop(t, gy) {
  const g = ctx.createLinearGradient(0, 0, 0, gy); g.addColorStop(0, '#5ab4f4'); g.addColorStop(1, '#cfeeff'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, gy + 4);
  cloud(W * 0.16, H * 0.14, 0.9); cloud(W * 0.8, H * 0.2, 1.0); cloud(W * 0.62, H * 0.1, 0.6);
  const cx = W / 2;
  out(() => rr(W * 0.02, gy - 96, 150, 60, 4), '#b8b4aa', 4); out(() => rr(W * 0.98 - 150, gy - 96, 150, 60, 4), '#b8b4aa', 4);
  out(poly([[-20, gy - 20], [-20, gy - 66], [cx - W * 0.2, gy - 100], [cx - W * 0.2, gy - 20]]), '#86c95b', 4);   // the grass ramps
  out(poly([[W + 20, gy - 20], [W + 20, gy - 66], [cx + W * 0.2, gy - 100], [cx + W * 0.2, gy - 20]]), '#86c95b', 4);
  // the great flagpole: four steel legs, a mast, the flag
  const fx = cx, fyTop = H * 0.05, fyBase = gy - 96;
  ctx.lineCap = 'round';
  for (const pass of [0, 1]) {
    for (const dx of [-200, -95, 95, 200]) { ctx.strokeStyle = pass ? '#dfe4ea' : C.line; ctx.lineWidth = pass ? 9 : 16; ctx.beginPath(); ctx.moveTo(fx + dx, fyBase); ctx.lineTo(fx + dx * 0.1, fyTop + 150); ctx.stroke(); }
    ctx.strokeStyle = pass ? '#dfe4ea' : C.line; ctx.lineWidth = pass ? 8 : 20; ctx.beginPath(); ctx.moveTo(fx - 6, fyTop + 155); ctx.lineTo(fx - 6, fyTop + 60); ctx.moveTo(fx + 6, fyTop + 155); ctx.lineTo(fx + 6, fyTop + 60); ctx.stroke();
  }
  ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(fx, fyTop + 62); ctx.lineTo(fx, fyTop - 10); ctx.stroke(); ctx.lineCap = 'butt';
  const wv = Math.sin(t * 4) * 4;
  ctx.save(); ctx.translate(fx + 2, fyTop - 8); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(36, 8 + wv, 70, 2); ctx.lineTo(70, 40 + wv * 0.5); ctx.quadraticCurveTo(36, 46 + wv, 0, 40); ctx.closePath(); ctx.fillStyle = '#1f3a8a'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.line; ctx.stroke();
  ctx.fillStyle = '#fff'; for (const [px, py] of [[10, 28], [22, 36], [14, 14], [44, 24], [52, 12], [40, 38]]) { ell(px, py + wv * 0.3, 2.4, 2.4); ctx.fill(); } ctx.restore();
  // white marble colonnade with the little windows
  const cw = W * 0.4, cx0 = cx - cw / 2, cyT = gy - 88, ch = 88;
  out(() => rr(cx0 - 14, cyT - 12, cw + 28, 16, 3), '#f5f1e6', 4);
  out(() => rr(cx0, cyT, cw, ch, 3), '#f5f1e6', 4);
  ctx.fillStyle = '#2c3340'; ctx.fillRect(cx0 + 10, cyT + 14, cw - 20, ch - 14);
  const n = 12; for (let i = 0; i <= n; i++) out(() => rr(cx0 + 6 + i * (cw - 24) / n, cyT + 4, 12, ch - 4, 2), '#fbf9f2', 3);
  for (let i = 0; i < n; i++) { ctx.fillStyle = '#7fb6c9'; ctx.fillRect(cx0 + 24 + i * (cw - 24) / n, cyT + 24, 9, 12); }
  // granite wall, pool, pale pink paving
  out(() => rr(-10, gy - 28, W + 20, 30, 0), '#6f6b64', 4);
  ctx.fillStyle = '#e8bba8'; ctx.fillRect(-10, gy + 2, W + 20, H); ctx.fillStyle = '#c96a4f'; ctx.fillRect(-10, gy + 2, W + 20, 12);
  out(() => ell(cx, gy + 52, W * 0.34, 30), '#56a8dd', 5); ell(cx - 70, gy + 46, 80, 8); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fill();
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { const px = cx + sx * (W * 0.37 + i * 60), py = gy + 4 + i * 8; ctx.strokeStyle = C.line; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - 180 + i * 10); ctx.stroke(); ctx.fillStyle = i % 2 ? '#d6322f' : '#1f3a8a'; ctx.fillRect(px, py - 178 + i * 10, 28 + Math.sin(t * 4 + i) * 3, 16); }
}
function mosaic(cx, cy, rx, ry) {
  // Possum and Wallaby Dreaming, drawn from a description (no photo found): rings of red, orange, yellow dots on black
  out(() => ell(cx, cy, rx, ry), '#26211f', 4);
  const cols = ['#e0453b', '#ff9f43', '#ffd21f', '#f4efe1', '#c9462f'];
  for (let ring = 1; ring <= 6; ring++) { const k = ring / 6.2, n = ring * 9; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + ring * 0.4; ell(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k, 4.5 * (rx / 190), 4.5 * (rx / 190) * 0.6); ctx.fillStyle = cols[(ring + i) % cols.length]; ctx.fill(); } }
}
function burstFw(x, y, r, k, cols) {
  if (k <= 0 || k >= 1) return;
  const e = easeOut(k), a = (1 - k) ** 1.3;
  ctx.save(); ctx.globalAlpha = a;
  for (let i = 0; i < 16; i++) { const an = i / 16 * Math.PI * 2, d = r * e; ell(x + Math.cos(an) * d, y + Math.sin(an) * d + k * k * 30, 5 + (1 - k) * 4, 5 + (1 - k) * 4); ctx.fillStyle = cols[i % cols.length]; ctx.fill();
    ell(x + Math.cos(an) * d * 0.6, y + Math.sin(an) * d * 0.6 + k * k * 18, 3, 3); ctx.fill(); }
  star4(x, y, 14 * (1 - k) + 4, k * 3, '#fff6b0'); ctx.restore();
}
// the fireworks: [x, y] as fractions of the screen, and when each one bursts
const PARL_FW = [[0.18, 0.2, 4.6], [0.84, 0.17, 5.1], [0.36, 0.1, 5.8], [0.66, 0.3, 6.4], [0.12, 0.38, 7.2], [0.9, 0.36, 7.7], [0.5, 0.22, 8.4], [0.28, 0.28, 9.4], [0.74, 0.14, 9.9]];
const PARL_SFX = [
  [0.1, 'engine', {g: 0.7}], [1.45, 'squeak', {p: 0.45, g: 0.5}],                                     // drives up, brakes
  [2.2, 'tick', {p: 0.8, g: 0.5}],                                                                     // the door clicks open
  [2.7, 'boing', {p: 1.1, g: 0.6}], [3.4, 'thud', {p: 1.5, g: 0.5}],                                   // he hops out and lands
  [3.58, 'door', {p: 0.95}, 'thud', {p: 1.6, g: 0.4}],                                                // the door shuts behind him
  ...[3.3, 3.5, 3.7, 3.9, 4.1, 4.3].map(x => [x, 'tick', {p: 0.85, g: 0.25}]),                         // everyone runs in
  [3.65, 'pop', {p: 1.0, g: 0.5}], [3.95, 'pop', {p: 1.2, g: 0.5}],                                   // the teachers pop up to wave
  [4.35, 'pop', {p: 0.7, g: 0.7}],                                                                     // the 18 balloon
  [4.9, 'pop', {p: 1.5}], [4.92, 'whoosh', {p: 1.3, g: 0.5}], [7.0, 'pop', {p: 1.6, g: 0.8}], [9.2, 'pop', {p: 1.4, g: 0.8}],   // confetti cannons
  ...PARL_FW.map(([, , f0], i) => [f0 - 0.36, 'firework', {p: 0.9 + (i % 3)*0.1}, 'pop', {p: 0.6}]),   // whistle up, and the bang lands on the drawn burst
  [5.2, 'jingle'],                                                                                      // Happy 18th!
  ...[5.57, 6.14, 6.71, 7.28].map((x, i) => [x, 'boing', {p: 1.3 + i*0.05, g: 0.35}]),                 // Nailong bounces for joy
];
function sceneParliament(t) {
  const D = CANBERRA_DUR.sceneParliament, gy = H * 0.62, rowF = H * 0.92, rowB = H * 0.8;
  cbCues('parliament', t, PARL_SFX);
  parliamentBackdrop(t, gy);
  mosaic(W * 0.5, H * 0.86, W * 0.15, 36);
  const fcols = [['#ff5d73', '#ffd21f'], ['#4fc3f7', '#ffffff'], ['#7ed957', '#ffd21f'], ['#c47bff', '#ff9f43']];
  PARL_FW.forEach(([fx, fy, f0], i) => burstFw(W * fx, H * fy, 90 + (i % 3) * 20, (t - f0) / 1.2, fcols[i % 4]));
  const carS = 0.78, xPark = W * 0.17;
  const carX = lerp(-300, xPark, easeOut(P(t, 0, 2.1)));
  const lean = t < 2.1 ? 0.05 * Math.sin(P(t, 1.4, 2.1) * Math.PI) : 0.04 * Math.exp(-(t - 2.1) * 5) * Math.cos((t - 2.1) * 14);
  const doorK = t < 2.2 ? 0 : t < 3.4 ? clamp((t - 2.2) / 0.3, 0, 1) : 1 - clamp((t - 3.4) / 0.4, 0, 1);
  const hop = P(t, 2.7, 3.4);
  camry(carX, rowF + 16, carS, {wheel: carX / 33, door: doorK, driver: t < 2.7, lean, look: [1, 0]});
  // teachers wave from behind: Mr Shou and Liu Lao Shi, drawn by their own games' functions if those are loaded; they wait fully below the screen until they pop up (they used to peek in half-sunk from the first frame)
  const rise = e => easeOut(P(t, e, e + 0.5));
  if (typeof window.shou === 'function') window.shou(W * 0.74, rowB + 70 + (1 - rise(3.6)) * 260, 0.4, {mouth: 'grin', armR: 2.5 + Math.sin(t * 9) * 0.35, armL: 0.12});
  if (typeof window.liuLaoShi === 'function') window.liuLaoShi(W * 0.86, rowB + 70 + (1 - rise(3.9)) * 260, 0.4, {mouth: 'smile', aR: 2.5 + Math.sin(t * 9 + 1) * 0.35});
  // Scarlett and Jedidiah run in from the right and cheer (Scarlett is the tall one)
  const rin = easeOut(P(t, 3.1, 4.5));
  const sX = lerp(W * 1.1, W * 0.37, rin), jX = lerp(W * 1.2, W * 0.62, rin);
  const cheer = t > 4.5 ? Math.abs(Math.sin((t - 4.5) * 5.5)) : 0, cheer2 = t > 4.5 ? Math.abs(Math.sin((t - 4.5) * 5.5 + 1.2)) : 0;
  person(sX, rowF - cheer * 22, 0.56, CAST.scarlett, {mouth: 'smile', look: [0, -0.3]});
  person(jX, rowF - cheer2 * 22, 0.5, CAST.jed, {mouth: 'smile', look: [0, -0.3]});
  const bk = P(t, 4.3, 5.4);   // the big 18 balloon, held by Scarlett, floating up
  if (bk > 0) {
    const bxp = sX + 24, byp = rowF - 80, top = H * 0.44 + Math.sin(t * 2.1) * 8, balX = bxp + Math.sin(t * 1.6) * 12, balY = lerp(byp - 20, top, easeOut(bk));
    ctx.strokeStyle = C.line; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bxp, byp); ctx.quadraticCurveTo(balX - 10, (byp + balY) / 2, balX, balY + 64); ctx.stroke();
    ctx.save(); ctx.translate(balX, balY); ctx.scale(1 + 0.04 * Math.sin(t * 3), 1 - 0.04 * Math.sin(t * 3)); out(() => ell(0, 0, 58, 66), '#ffd21f', 5); ell(-20, -26, 12, 20, 0.5); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill();
    smallText('18', 0, 4, 66, '#c9462f', 700); ctx.restore();
  }
  if (t >= 2.7) {   // Nailong: hops out of the car, runs to the middle, then bounces with joy
    const nx0 = carX + 40, ey = rowF + 16 - 64 * carS, mid = W * 0.5;
    let x, y, sx = 1, sy = 1, sc = 0.3 + 0.32 * ease(hop), o = {arms: 'up', flail: t * 14, look: [1, 0], mouth: 'open'};
    if (t < 3.4) { x = lerp(nx0, nx0 + 90, hop); y = lerp(ey, rowF, hop * hop) - Math.sin(Math.PI * hop) * 130; sx = 1 - 0.1 * Math.sin(Math.PI * hop); sy = 1 + 0.2 * Math.sin(Math.PI * hop); }
    else { const rk = P(t, 3.4, 5.0); x = lerp(nx0 + 90, mid, ease(rk)); sc = 0.62; y = rowF;
      if (rk < 1) { y -= Math.abs(Math.sin(rk * 18)) * 18; o = {arms: 'down', walk: t * 14, look: [1, 0], mouth: 'smile'}; }
      else { const b = (t - 5.0) * 5.5, j = Math.abs(Math.sin(b)), ph = (b % Math.PI) / Math.PI, sq = ph < 0.12 || ph > 0.88; y -= j * 70; sy = 1 + 0.18 * j - (sq ? 0.22 : 0); sx = 1 - 0.1 * j + (sq ? 0.2 : 0); o = {arms: 'up', flail: t * 16, look: [0, -0.4], mouth: 'open'}; } }
    shadow(x, rowF + 4, 50 * sc / 0.62, 0.2);
    nailong(x, y, sc, {...o, sx, sy});
    if (t > 5.0 && t < 6.2) bubble(LINES_CANBERRA.cheer, x, y - sc * 190, 30, 300);
  }
  confetti(4.9, t, 70, W * 0.1, H * 0.95, 1.4, 1); confetti(4.9, t, 70, W * 0.9, H * 0.95, 1.4, 7); confetti(7.0, t, 60, W * 0.5, H * 0.9, 2.0, 3); confetti(9.2, t, 60, W * 0.3, H * 0.95, 1.8, 5);
  if (t > 5.2) { const k = t - 5.2, pop = k < 0.5 ? easeOut(k / 0.5) * 1.18 : 1.18 - 0.18 * Math.min(1, (k - 0.5) / 0.3);
    ctx.save(); ctx.translate(W / 2, H * 0.16); ctx.scale(pop, pop); ctx.rotate(Math.sin(t * 3) * 0.03); title(LINES_CANBERRA.happy, 0, 0, Math.min(112, W / 9), '#ffd21f'); ctx.restore(); }
  fadeEdges(t, D);
}
// the birthday card (Max, 13 Oct): "Happy Birthday!" and his line under it, then the replay menu. About 9 s at the clip speed.
const BDAY_SFX = [[0.35, 'pop', {p: 0.8, g: 0.8}], [0.4, 'jingle'], [1.7, 'pop', {p: 1.5, g: 0.5}], ...[1.2, 1.77, 2.34, 2.91, 3.48].map((x, i) => [x, 'boing', {p: 1.3 + i*0.04, g: 0.25}])];
function sceneBirthday(t) {
  const D = CANBERRA_DUR.sceneBirthday;
  cbCues('birthday', t, BDAY_SFX);
  ctx.fillStyle = '#1d1640'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) {   // twinkling stars
    const r1 = Math.abs(Math.sin(i * 91.7) * 43758.5453 % 1), r2 = Math.abs(Math.sin(i * 12.9) * 24634.6345 % 1);
    ctx.save(); ctx.globalAlpha = 0.35 + 0.35 * Math.sin(t * 2.4 + i); star4(r1 * W, r2 * H * 0.9, 5 + (i % 3) * 2, t * 0.5 + i, '#fff6b0'); ctx.restore();
  }
  confetti(0.35, t, 60, W * 0.08, H * 0.98, 1.3, 2); confetti(0.35, t, 60, W * 0.92, H * 0.98, 1.3, 9); confetti(2.6, t, 50, W * 0.5, H * 0.98, 1.8, 4);
  const ty = H * 0.34;
  if (t > 0.35) { const k = (t - 0.35) / 0.55, pop = fxBack(k);
    ctx.save(); ctx.translate(W / 2, ty); ctx.scale(pop, pop); ctx.rotate(Math.sin(t * 2.6) * 0.025); title(LINES_CANBERRA.bday, 0, 0, Math.min(120, W / 8.5), '#ffd21f'); ctx.restore(); }
  const sa = P(t, 1.7, 2.3);
  if (sa > 0) { ctx.save(); ctx.globalAlpha = sa; smallText(LINES_CANBERRA.bdaySub, W / 2, ty + Math.min(110, W / 9) + (1 - easeOut(sa)) * 14, Math.min(44, W / 24), '#fff3c4', 600); ctx.restore(); }
  const b = Math.max(0, t - 1.2) * 5.5, j = t > 1.2 ? Math.abs(Math.sin(b)) : 0, ph = (b % Math.PI) / Math.PI, sq = t > 1.2 && (ph < 0.12 || ph > 0.88);
  const ny = H * 0.9 - j * 60, nx = W / 2;
  ell(nx, H * 0.9 + 4, 40 - j * 10, 9); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fill();
  nailong(nx, ny, 0.5, {arms: 'up', flail: t * 14, look: [0, -0.4], mouth: 'open', sx: 1 - 0.1 * j + (sq ? 0.2 : 0), sy: 1 + 0.18 * j - (sq ? 0.22 : 0)});
  fadeEdges(t, D);
}
window.sceneBirthday = sceneBirthday;
window.sceneParliament = sceneParliament;
window.sceneFinale = sceneParliament;   // the finale is the second half of the Parliament clip: put only ONE of the two in FLOW
window.sceneEscape = sceneEscape; window.sceneCivic = sceneCivic; window.sceneBridge = sceneBridge;
})();
