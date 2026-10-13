// story-drift.js: after The 360, Nailong shoots out of the end of the red slide, through a Junior School window, and drifts down like
// a leaf into the Camry's driver's seat. Max, 13 Oct: "we don't need the library scene, nai long s face makes no sense there eitheer,
// basically nai logn tumbles from the junior school out the window and slowly comedically drifts into the car."
// Globals: sceneDrift(t), DRIFT_DUR (scene seconds; main.js plays clips at 70%). Every visible word lives in LINES_DRIFT.
// The hand-over: the last frame is sceneEscape's own picture at its t = 4.7 (main.js starts the escape there): the Camry at
// x = W*0.72 on the road at y = H*0.74 + 96, s = 1, facing right, level, door shut, Nailong in the driver's seat looking at the wheel.
(() => {
"use strict";

// ---------------------------------------------------------------- lines
const LINES_DRIFT = {
  sign1: 'BRINDABELLA',
  sign2: 'JUNIOR SCHOOL',
  wheee: 'wheee.',                           // placeholder: his flat, bored voice halfway down
  gate: 'BRINDABELLA CHRISTIAN COLLEGE',     // the school gate by the road (the same sign the escape clip shows)
};
window.LINES_DRIFT = LINES_DRIFT;

// the beats, in scene seconds: the window rattles, bursts open, he tumbles out spinning, STOPS dead in mid-air, goes calm, then rocks
// down like a falling leaf (a gum leaf overtakes him), the car door opens for him, he plops into the seat, the door shuts.
const DRIFT_DUR = 8.8;
const DR = {rattle: 0.3, burst: 0.8, brake: 1.65, calm: 1.85, drift: 2.1, leaf: 3.2, wheee: [3.0, 4.5], doorA: 5.3, doorB: 5.8,
  over: 6.3, land: 7.0, shutA: 7.35, shutB: 7.75};
window.DRIFT_DUR = DRIFT_DUR;

// ---------------------------------------------------------------- tiny helpers (story-canberra.js's, under our own names)
// sounds: each cue [scene time, name, opts] fires once as the clip's clock passes it, and a clock that goes back re-arms them.
const drCueT = {};
function drCues(key, t, list) {
  const prev = drCueT[key]; drCueT[key] = t;
  if (prev === undefined || t <= prev || !window.SFX) return;
  for (const [at, name, o] of list) if (prev < at && t >= at) SFX.play(name, o || {});
}
const DR_SFX = [
  [0.32, 'thud', {p: 0.7, g: 0.35}], [0.5, 'thud', {p: 0.75, g: 0.45}], [0.66, 'thud', {p: 0.8, g: 0.55}],   // bump bump bump from inside
  [DR.burst, 'bigkick', {g: 0.7}], [DR.burst + 0.02, 'crash', {p: 1.2, g: 0.45}],                              // the window bursts open
  [DR.burst + 0.12, 'thwack', {p: 0.9, g: 0.5}],                                                               // the shutters bang the wall
  [DR.burst + 0.05, 'scream', {p: 1.1, g: 0.6}],                                                               // AAAA as he tumbles out
  [DR.brake, 'boing', {p: 0.5, g: 0.55}],                                                                      // and stops dead in mid-air
  [DR.drift + 1.05, 'swish', {p: 0.55, g: 0.22}], [DR.drift + 2.1, 'swish', {p: 0.6, g: 0.22}],                // a soft swish as each swing
  [DR.drift + 3.15, 'swish', {p: 0.55, g: 0.2}],                                                                // passes its lowest point
  [DR.leaf, 'tick', {p: 1.7, g: 0.3}],                                                                         // the gum leaf snaps off
  [DR.doorA, 'tick', {p: 0.8, g: 0.5}], [DR.doorA + 0.05, 'swish', {p: 0.5, g: 0.3}],                          // the car door opens for him
  [DR.land, 'squeak', {p: 0.8, g: 0.6}], [DR.land + 0.02, 'thud', {p: 1.2, g: 0.5}],                           // plop into the seat
  [DR.shutB - 0.22, 'door', {}],                                                                               // creak, and it shuts
];
const P = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const easeOut = k => 1 - Math.pow(1 - k, 3);
const out = (draw, fill, lw = 4, stroke = C.line) => { draw(); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); };
const poly = pts => () => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); };
function puff(x, y, r, a = 1) { ell(x, y, r, r * 0.85); ctx.fillStyle = `rgba(245,245,248,${a})`; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = `rgba(74,47,12,${a * 0.5})`; ctx.stroke(); }
function star4(x, y, r, rot, fill) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rad = i % 2 ? r * 0.3 : r; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = Math.max(1.5, r * 0.12); ctx.strokeStyle = C.line; ctx.stroke(); ctx.restore();
}
function smallText(text, x, y, size, fill, w = 600) { font(size, w); ctx.fillStyle = fill; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y); }
function fadeEdges(t, dur) {
  const a = Math.max(1 - t / 0.18, (t - (dur - 0.25)) / 0.25, 0);
  if (a > 0) { ctx.fillStyle = `rgba(29,22,64,${clamp(a, 0, 1)})`; ctx.fillRect(0, 0, W, H); }
}
// heavy, bored eyelids over nailong()'s eyes (same transform as core.js nailong, k = how far down: 0.5 = half shut)
function drLids(x, y, s, o, k) {
  const {rot = 0, sx = 1, sy = 1} = o;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s * sx, s * sy);
  const br = Math.sin(CLOCK * 3.1 + x * 0.013); ctx.scale(1 - br * 0.012, 1 + br * 0.018);
  for (const ex of [-25, 25]) {
    const ly = -154 + 28 * k;
    ctx.save(); ctx.beginPath(); ctx.rect(ex - 18, -160, 36, ly + 160); ctx.clip();
    ell(ex, -140, 16.5, 16.5); ctx.fillStyle = C.y; ctx.fill(); ctx.restore();
    const dy = ly + 140, hw = Math.sqrt(Math.max(0, 14 * 14 - dy * dy));
    ctx.beginPath(); ctx.moveTo(ex - hw - 1.5, ly); ctx.lineTo(ex + hw + 1.5, ly); ctx.lineWidth = 3.5; ctx.strokeStyle = C.line; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineCap = 'butt';
  }
  ctx.restore();
}
// a dry gum leaf: long, thin and curved, orange-brown with a pale midrib, so it reads against the green tree. (x, y) is its middle.
function gumLeaf(x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-26, 2); ctx.quadraticCurveTo(-4, -12, 26, -2); ctx.quadraticCurveTo(0, 10, -26, 2); ctx.closePath();
  ctx.fillStyle = '#d9823b'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = C.line; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-24, 2); ctx.quadraticCurveTo(0, -2, 24, -2); ctx.lineWidth = 1.5; ctx.strokeStyle = '#f6d39a'; ctx.stroke();
  ctx.restore();
}
// the school gate by the road, as story-canberra.js draws it (so the hand-over into the escape keeps it in the same spot)
function drGate(x, gy) {
  out(() => rr(x - 86, gy - 150, 18, 150, 3), '#b8644a'); out(() => rr(x + 68, gy - 150, 18, 150, 3), '#b8644a');
  out(() => rr(x - 120, gy - 168, 240, 30, 6), '#e0463e');
  ctx.save(); ctx.translate(-40, 0);
  ctx.lineCap = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = '#f2a0a0'; ctx.beginPath(); ctx.moveTo(x - 70, gy - 144); ctx.bezierCurveTo(x - 60, gy - 168, x - 46, gy - 146, x - 30, gy - 164); ctx.stroke();
  ctx.strokeStyle = '#2f5fb3'; ctx.beginPath(); ctx.moveTo(x - 68, gy - 150); ctx.bezierCurveTo(x - 58, gy - 164, x - 44, gy - 152, x - 28, gy - 160); ctx.stroke(); ctx.lineCap = 'butt';
  ctx.restore();
  font(10, 700); const tw = ctx.measureText(LINES_DRIFT.gate).width, room = 166;
  smallText(LINES_DRIFT.gate, x + 25, gy - 153, tw > room ? 10 * room / tw : 10, '#fff', 700);
}

// camry() paints an open or closing door's glass solid, so a driver vanishes behind it while it shuts and pops back when it is shut.
// This draws him THROUGH that glass (the cabin, him, the dash and the wheel, under a blue tint), so he stays in his seat the whole time.
// Car space numbers are story-canberra.js's camry() ones (door hinge, door glass, the door opening, the dash and the wheel).
const DR_OPEN = [[-38, -142], [2, -143], [58, -96], [62, -26], [-40, -26]];
function drThroughDoor(cx, cy, door, look) {
  const a = door * 1.1, w = 104 * Math.cos(a), g = 1 + 0.12 * Math.sin(a), hx = 62, top = -96 * g;
  const glass = poly([[hx - 4, top - 2], [hx - w * 0.92, top - 6], [hx - w * 0.92, top - 40 * g], [hx - 26, top - 40 * g + 6]]);
  ctx.save(); ctx.translate(cx, cy); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.save(); glass(); ctx.clip(); poly(DR_OPEN)(); ctx.clip();
  ctx.fillStyle = '#3d4a5c'; ctx.fillRect(-60, -150, 140, 130);
  ctx.fillStyle = '#59627a'; rr(-40, -128, 20, 76, 8); ctx.fill();
  nailong(8, -62, 0.34, {look, mouth: 'smile', arms: 'down'});
  ctx.fillStyle = '#2e3038'; ctx.beginPath(); ctx.moveTo(30, -100); ctx.lineTo(66, -94); ctx.lineTo(66, -26); ctx.lineTo(30, -26); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#17181d'; ctx.lineWidth = 5; ell(30, -104, 5, 18, -0.28); ctx.stroke();
  ctx.fillStyle = 'rgba(122,163,194,.38)'; ctx.fillRect(-60, -150, 140, 130);
  ctx.restore();
  glass(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- the place
// the layout, shared by the drawing and by Nailong's path (all in virtual pixels: H = 720, W follows the window)
function drGeo() {
  const gy = H * 0.74, roadY = gy + 96, carX = W * 0.72;
  const x0 = W * 0.02, x1 = W * 0.5, top = gy - 392;
  const ww = 96, wh = 76, wx = x1 - 150, wy = top + 104;
  return {gy, roadY, carX, x0, x1, top, ww, wh, wx, wy, wcx: wx + ww / 2, wcy: wy + wh - 8,
    bx: wx + ww / 2 + 130, by: wy + wh + 40,                       // where he stops dead in mid-air
    seatX: carX + 8, seatY: roadY - 62, hoverY: roadY - 166};       // camry.info.seat at s = 1 facing right; feet just over the roof
}
// the Junior School from outside, two storeys this time (core.js juniorSchool's look: cream walls, red brick base, dark roof edge,
// the red BRINDABELLA sign with the pink and blue swooshes), with his window on the upper floor near the right end
function drSchool(g, t) {
  const {gy, x0, x1, top, ww, wh, wx, wy} = g;
  ctx.strokeStyle = C.line; ctx.lineWidth = 4;
  ctx.fillStyle = '#ece7de'; ctx.fillRect(x0, top + 8, x1 - x0, gy - top - 8); ctx.strokeRect(x0, top + 8, x1 - x0, gy - top - 8);
  ctx.strokeStyle = 'rgba(74,47,12,.16)'; ctx.lineWidth = 2;
  for (let x = x0 + 64; x < x1; x += 64) { ctx.beginPath(); ctx.moveTo(x, top + 96); ctx.lineTo(x, gy - 62); ctx.stroke(); }
  out(() => rr(x0 - 6, top + 196, x1 - x0 + 12, 14, 3), '#d6cfc2', 3);                          // the floor band between the storeys
  ctx.fillStyle = '#b8644a'; ctx.fillRect(x0, gy - 62, x1 - x0, 62);
  ctx.strokeStyle = 'rgba(74,47,12,.3)'; ctx.lineWidth = 2;
  for (let r = 0; r < 4; r++) { const yy = gy - 62 + r * 15.5; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.stroke();
    for (let x = x0 + (r % 2) * 16; x < x1; x += 32) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x, yy + 15.5); ctx.stroke(); } }
  ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.strokeRect(x0, gy - 62, x1 - x0, 62);
  ctx.fillStyle = '#4b5560'; rr(x0 - 14, top - 12, x1 - x0 + 28, 24, 5); ctx.fill(); ctx.stroke();
  // the sign
  const sx = x0 + (x1 - x0) * 0.08, sw = (x1 - x0) * 0.8, sy = top + 18, sh = 62;
  ctx.fillStyle = '#e0463e'; rr(sx, sy, sw, sh, 6); ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
  ctx.lineCap = 'round'; ctx.lineWidth = 10; ctx.strokeStyle = '#f2a0a0';
  ctx.beginPath(); ctx.moveTo(sx + 12, sy + sh - 10); ctx.bezierCurveTo(sx + 36, sy + 18, sx + 64, sy + 54, sx + 96, sy + 12); ctx.stroke();
  ctx.strokeStyle = '#2f5fb3'; ctx.beginPath(); ctx.moveTo(sx + 16, sy + sh - 22); ctx.bezierCurveTo(sx + 40, sy + 8, sx + 66, sy + 42, sx + 98, sy + 24); ctx.stroke();
  ctx.lineCap = 'butt';
  const fs = clamp((sw - 120) / 7, 12, 32);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  font(fs); ctx.fillText(LINES_DRIFT.sign1, sx + 110, sy + sh * 0.5);
  font(fs * 0.62, 600); ctx.fillText(LINES_DRIFT.sign2, sx + 110, sy + sh * 0.5 + fs * 0.85);
  // the ordinary windows, upstairs and down, and the blue door
  ctx.strokeStyle = C.line;
  const win = (x, y) => { ctx.fillStyle = '#a8dcf5'; rr(x, y, 70, 52, 6); ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 35, y); ctx.lineTo(x + 35, y + 52); ctx.stroke(); };
  for (let x = x0 + 26; x + 70 < wx - 20; x += 104) win(x, top + 118);
  for (let x = x0 + 26; x < x1 - 160; x += 104) win(x, gy - 150);
  ctx.fillStyle = '#5a7fa8'; rr(x1 - 70, gy - 112, 46, 112, 4); ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
  // HIS window: closed and rattling, then the two sashes fly open and bang back against the wall. Behind it, the end of the red slide.
  const bt = t - DR.burst;
  const shake = t > DR.rattle && bt < 0 ? Math.sin(t * 70) * 2.5 * P(t, DR.rattle, DR.rattle + 0.2) : 0;
  out(() => rr(wx - 10, wy + wh, ww + 20, 10, 2), '#f4f1ea', 3);                                 // the sill
  if (bt < 0) {
    ctx.save(); ctx.translate(shake, 0);
    ctx.fillStyle = '#a8dcf5'; ctx.fillRect(wx, wy, ww, wh);
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(wx + 14, wy + wh - 8); ctx.lineTo(wx + 40, wy + 8); ctx.stroke();
    ctx.strokeStyle = '#37404f'; ctx.lineWidth = 5; ctx.strokeRect(wx, wy, ww, wh); ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.stroke();
    ctx.restore();
  } else {
    ctx.fillStyle = '#2f2a40'; ctx.fillRect(wx, wy, ww, wh);                                    // dark inside
    ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();                          // the slide's red tube, its open end facing us
    ell(wx + ww / 2, wy + wh * 0.58, 34, 30); ctx.fillStyle = '#e8423b'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
    ell(wx + ww / 2, wy + wh * 0.6, 24, 21); ctx.fillStyle = '#2b0409'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = '#37404f'; ctx.lineWidth = 5; ctx.strokeRect(wx, wy, ww, wh);
    const a = 2.5 - 2.5 * Math.exp(-bt * 10) * Math.cos(bt * 14), hw = ww / 2, rise = 9 * Math.sin(a);
    for (const [hx, d] of [[wx, 1], [wx + ww, -1]]) {                                            // the sashes, hinged at the outer edges
      const fx = hx + d * hw * Math.cos(a);
      out(poly([[hx, wy], [fx, wy - rise], [fx, wy + wh + rise], [hx, wy + wh]]), '#a8dcf5', 5, '#37404f');
    }
    if (bt < 0.6) { ctx.save(); ctx.globalAlpha = Math.max(0, 1 - bt / 0.6); star4(wx + ww / 2, wy + wh / 2, 60 + bt * 120, bt * 2, '#fff6b0'); ctx.restore(); }
    for (let i = 0; i < 7 && bt < 1.2; i++) {                                                   // a cough of dust out of the window
      const k = easeOut(P(bt, 0, 1.2)), ang = -1.2 + i * 0.45;
      puff(wx + ww / 2 + Math.cos(ang) * (40 + 90 * k), wy + wh / 2 + Math.sin(ang) * (30 + 60 * k), 12 + 16 * k + (i % 3) * 4, 0.85 * (1 - P(bt, 0, 1.2)));
    }
  }
}

// ---------------------------------------------------------------- Nailong's path
// returns where he is and how he looks at scene time t (only while he is outside the car: DR.burst <= t < DR.land)
function drPose(g, t) {
  const {wcx, wcy, bx, by, seatX, seatY} = g;
  if (t < DR.brake) {                                                  // the tumble: out of the window, two fast spins, falling
    const k = P(t, DR.burst, DR.brake);
    return {x: lerp(wcx, bx, k), y: lerp(wcy, by, k * k) - Math.sin(Math.PI * k) * 80, s: lerp(0.36, 0.5, Math.min(1, k * 3)), lid: 0,
      o: {rot: k * Math.PI * 4, arms: 'up', flail: t * 16, mouth: 'open', look: [Math.sin(t * 9) * 0.8, -0.5]}};
  }
  if (t < DR.drift) {                                                  // STOPS dead in mid-air: a squash wobble, then calm
    const k = t - DR.brake, q = Math.exp(-k * 7) * Math.cos(k * 20), calm = t >= DR.calm;
    return {x: bx, y: by, s: 0.5, lid: calm ? 0.55 * P(t, DR.calm, DR.calm + 0.12) : 0,
      o: {rot: Math.sin(k * 18) * 0.05 * Math.exp(-k * 5), sx: 1 + 0.22 * q, sy: 1 - 0.22 * q,
        arms: calm ? 'down' : 'up', flail: 0, mouth: calm ? 'smile' : 'o', look: calm ? [0.3, 0.7] : [0, -0.9]}};
  }
  // the drift: rocking side to side like a falling leaf, a little higher at each end of the swing, tilting with it, slowly coming down
  // to just over the car's roof (four swings, DR.drift to DR.over); then he settles straight down into the open door and the seat
  const lk = drLeaf(g, t);
  if (t < DR.over) {
    const u = P(t, DR.drift, DR.over), ph = u * Math.PI * 4, A = 80 * (1 - 0.75 * u), sw = Math.sin(ph);
    const x = lerp(bx, seatX, u) + A * sw, y = lerp(by, g.hoverY, u) - 26 * sw * sw * (1 - 0.5 * u);
    const look = lk && !lk.still && lk.y > y - 150 && lk.y < y + 40 ? [clamp((lk.x - x) / 50, -1, 1), 0.7] : [Math.cos(ph) * 0.6, 0.65];
    return {x, y, s: 0.5, lid: 0.55, o: {rot: -0.3 * sw * (1 - 0.5 * u), arms: 'down', mouth: 'smile', look}};
  }
  const v = P(t, DR.over, DR.land), e = ease(v), sw = Math.sin(v * Math.PI);
  return {x: seatX - 20 * (1 - v) * sw, y: lerp(g.hoverY, seatY, e), s: lerp(0.5, 0.34, e), lid: 0.55,
    o: {rot: 0.12 * (1 - v) * sw, arms: 'down', mouth: 'smile', look: [0.4, 0.8]}};
}
// the gum leaf that snaps off the tree and overtakes him on the way down (null before it falls)
function drLeaf(g, t) {
  if (t < DR.leaf) return null;
  // it snaps off just above him and to his right (where he will be 0.6 s later), and lands on the grass long before he does
  const k = t - DR.leaf, x0 = lerp(g.bx, g.seatX, P(DR.leaf + 0.6, DR.drift, DR.over)) + 60, y0 = g.gy - 262, land = 1.35;
  if (k >= land) return {x: x0 + 26 * Math.sin(land * 5) - 6, y: g.gy + 14, rot: 0.15, still: true};
  return {x: x0 + 26 * Math.sin(k * 5), y: lerp(y0, g.gy + 14, k / land), rot: Math.sin(k * 5 + 1) * 0.7};
}

// ================================================================ the clip
function sceneDrift(t) {
  const D = DRIFT_DUR, g = drGeo(), {gy, roadY, carX} = g;
  drCues('drift', t, DR_SFX);
  sky(); sun(); cloud(W * 0.18, 90, 0.8); cloud(W * 0.66, 130, 0.6);               // the escape clip's sky, clouds in the same places
  ctx.save();
  ground(gy);
  gum(W * 0.665, gy, 1.2);                                                         // the escape clip's gum, in the same place
  if (t < DR.leaf) { const l0 = drLeaf(g, DR.leaf); gumLeaf(l0.x, l0.y, 1.6, l0.rot); }   // the leaf still on its twig
  drSchool(g, t);
  const lf = drLeaf(g, t);
  if (lf) gumLeaf(lf.x, lf.y, 1.6, lf.rot);
  ctx.restore();
  // the road, its kerb and the gate: exactly as the escape clip draws them
  ctx.fillStyle = '#6b6f7a'; ctx.fillRect(-10, roadY - 62, W + 20, H); ctx.fillStyle = '#c7c3b8'; ctx.fillRect(-10, roadY - 70, W + 20, 10);
  ctx.strokeStyle = '#ffe9a0'; ctx.lineWidth = 5; ctx.setLineDash([46, 34]); ctx.beginPath(); ctx.moveTo(-10, roadY + 76); ctx.lineTo(W + 10, roadY + 76); ctx.stroke(); ctx.setLineDash([]);
  drGate(W - 140, roadY - 66);
  // the car: its door swings open for him, he plops in, the door shuts. From DR.shutB on this is the escape clip's picture at its 4.7 s.
  const inCab = t >= DR.land;
  let door = 0;
  if (t > DR.doorA && t < DR.shutB) door = t < DR.shutA ? easeOut(P(t, DR.doorA, DR.doorB)) : 1 - ease(P(t, DR.shutA, DR.shutB));
  const lk = t - DR.land, bob = lk > 0 && lk < 1.1 ? Math.sin(lk * 12) * 6 * Math.exp(-lk * 4) : 0;
  const cabLook = t < DR.land + 0.5 ? [-0.6, 0.1] : [0.5, -0.2];                  // a quick look at us, then at the wheel
  if (typeof window.camry === 'function') {
    camry(carX, roadY, 1, {door, driver: inCab, look: cabLook, mouth: 'smile', bob});
    if (inCab && door > 0) drThroughDoor(carX, roadY + bob, door, cabLook);
  }
  // Nailong outside the car
  if (t >= DR.burst && t < DR.land) {
    const p = drPose(g, t);
    nailong(p.x, p.y, p.s, p.o);
    if (p.lid > 0) drLids(p.x, p.y, p.s, p.o, p.lid);
    if (t > DR.wheee[0] && t < DR.wheee[1]) bubble(LINES_DRIFT.wheee, p.x + 18, p.y - 182 * p.s, 24, 200);
  }
  if (lk > 0 && lk < 0.45) {                                                        // a little poof as he lands in the seat
    const k = lk / 0.45;
    for (let i = 0; i < 5; i++) { const a = Math.PI * (0.9 + i * 0.3); puff(g.seatX + Math.cos(a) * (30 + 40 * k), g.seatY - 50 + Math.sin(a) * (20 + 26 * k), 10 + 10 * k, 0.8 * (1 - k)); }
  }
  fadeEdges(t, D);
}
window.sceneDrift = sceneDrift;
})();
