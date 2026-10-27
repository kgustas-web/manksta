// Exercise animation rig. A side-view figure drawn in the same visual language as
// the muscle map (soft grey limbs, blue for the muscles at work).
//
// A pose names a few points and angles; knees and elbows are solved with two-bone
// inverse kinematics, so planted feet and hands stay put while the body moves.
// Animations (js/data/animations.js) are lists of poses with durations; the rig
// interpolates between them and loops.
//
// Pose fields (side view, figure faces right, y grows downward, ground at y = 180):
//   hip [x, y]           pelvis centre
//   torso                trunk angle from vertical, + leans forward
//   head                 extra head tilt (deg), default 0
//   ankleN / ankleF      near / far ankle [x, y]
//   footN / footF        foot angle (deg, 90 = flat pointing forward)
//   kneeN / kneeF        knee bend side: 1 = in front of a standing leg (default)
//   handN / handF        hand target [x, y]  (or armN / armF: [upperAngle, foreAngle])
//   elbowN / elbowF      elbow bend side: -1 (default) = behind/below the shoulder→hand line
//   kneePosN / kneePosF  pin the knee (kneeling); the shin then points toward the ankle
//   shoulderShift [dx,dy] move the shoulder joint alone (shoulder rolls)
//   hlLeg 'N' | 'F'      highlight muscles on that leg only (one-sided stretches)
//   arch                 spine bow: + rounds the back, − sags (cat–cow)
//   armScaleN            0–1, foreshortens the near arm when it points at the viewer
// An animation with floor: false (top-down views) hides the floor line.
// Front-view poses set view: 'front' and use the fields documented at solveFront().
// Angles for limbs are measured from straight down, + rotating toward the front.

import { REGION_NAMES } from './body.js';

export const LEN = { thigh: 46, shin: 44, torso: 58, neck: 9, upper: 31, fore: 29, foot: 19, head: 10.5 };

const rad = (d) => (d * Math.PI) / 180;
const add = (p, a, l) => [p[0] + Math.sin(rad(a)) * l, p[1] + Math.cos(rad(a)) * l];

// Two-bone IK: joint between `a` and `b` with segment lengths l1, l2; `side` picks the bend.
function ik(a, b, l1, l2, side) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  let d = Math.hypot(dx, dy);
  const max = l1 + l2 - 0.01;
  let t = b;
  if (d > max) { t = [a[0] + (dx / d) * max, a[1] + (dy / d) * max]; d = max; }
  const x = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  const ux = (t[0] - a[0]) / d, uy = (t[1] - a[1]) / d;
  // side +1 puts the joint on the (uy, -ux) side: in front of a standing leg,
  // above a leg lying with the feet to the right.
  return { joint: [a[0] + ux * x + uy * h * side, a[1] + uy * x - ux * h * side], end: t };
}

// Resolve a pose into joint positions.
export function solve(p) {
  const hip = p.hip;
  const base = [hip[0] + Math.sin(rad(p.torso)) * LEN.torso, hip[1] - Math.cos(rad(p.torso)) * LEN.torso];
  const shoulder = p.shoulderShift ? [base[0] + p.shoulderShift[0], base[1] + p.shoulderShift[1]] : base;
  const neck = [base[0] + Math.sin(rad(p.torso + (p.head || 0))) * LEN.neck, base[1] - Math.cos(rad(p.torso + (p.head || 0))) * LEN.neck];
  const headC = [neck[0] + Math.sin(rad(p.torso + (p.head || 0))) * LEN.head, neck[1] - Math.cos(rad(p.torso + (p.head || 0))) * LEN.head];
  const leg = (ankle, foot, side, kneePos) => {
    if (kneePos) {
      const dx = ankle[0] - kneePos[0], dy = ankle[1] - kneePos[1], d = Math.hypot(dx, dy) || 1;
      const a = [kneePos[0] + (dx / d) * LEN.shin, kneePos[1] + (dy / d) * LEN.shin];
      return { knee: kneePos, ankle: a, toe: add(a, foot ?? 90, LEN.foot) };
    }
    const r = ik(hip, ankle, LEN.thigh, LEN.shin, side ?? 1);
    return { knee: r.joint, ankle: r.end, toe: add(r.end, foot ?? 90, LEN.foot) };
  };
  // `scale` < 1 foreshortens an arm pointing toward the viewer (open book).
  const arm = (hand, angles, side, scale = 1) => {
    if (angles) {
      const elbow = add(shoulder, angles[0], LEN.upper * scale);
      return { elbow, hand: add(elbow, angles[1], LEN.fore * scale) };
    }
    const r = ik(shoulder, hand, LEN.upper, LEN.fore, side ?? -1);
    return { elbow: r.joint, hand: r.end };
  };
  return {
    hip, shoulder, neck, headC,
    legN: leg(p.ankleN, p.footN, p.kneeN, p.kneePosN), legF: leg(p.ankleF || p.ankleN, p.footF ?? p.footN, p.kneeF ?? p.kneeN, p.kneePosF),
    armN: arm(p.handN, p.armN, p.elbowN, p.armScaleN ?? 1), armF: arm(p.handF || p.handN, p.armF || (p.handF ? null : p.armN), p.elbowF ?? p.elbowN),
  };
}

// ── Interpolation ─────────────────────────────
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
function mix(a, b, t) {
  if (Array.isArray(a)) return a.map((v, i) => mix(v, b[i], t));
  if (typeof a === 'number') return a + (b - a) * t;
  return t < 0.5 ? a : b;
}
function lerpPose(a, b, t) {
  const out = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    out[k] = a[k] === undefined ? b[k] : b[k] === undefined ? a[k] : mix(a[k], b[k], t);
  }
  return out;
}

// Pose at time `ms` for an animation { frames: [{ pose, ms }] }, where each frame's
// `ms` is how long the move *into* the next frame takes (holds are frames with the same pose).
export function poseAt(anim, ms) {
  const total = anim.frames.reduce((s, f) => s + f.ms, 0);
  let t = ms % total;
  for (let i = 0; i < anim.frames.length; i++) {
    const f = anim.frames[i];
    if (t <= f.ms) {
      const next = anim.frames[(i + 1) % anim.frames.length];
      return lerpPose(f.pose, next.pose, ease(t / f.ms));
    }
    t -= f.ms;
  }
  return anim.frames[0].pose;
}

// ── Drawing ─────────────────────────────
const SEG_REGIONS = {
  thigh: ['quads', 'hamstrings', 'adductors', 'hipFlexors'],
  pelvis: ['glutes', 'gluteMed'],
  shin: ['calves', 'shins'],
  torso: ['core', 'obliques', 'lowerBack', 'upperBack', 'chest', 'lats'],
  delt: ['shoulders'],
  upper: ['biceps', 'triceps'],
  fore: ['forearms'],
};
function tone(seg, muscles) {
  const r = SEG_REGIONS[seg];
  if (r.some((m) => muscles.primary.includes(m))) return 'rg-p';
  if (r.some((m) => muscles.secondary.includes(m))) return 'rg-s';
  return '';
}
const f1 = (n) => n.toFixed(1);
const NONE = { primary: [], secondary: [] };
const line = (a, b, w, cls) => `<line class="${cls}" x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke-width="${w}"/>`;

// Tapered limb: radius ra at `a`, rb at `b`, with round ends.
function taper(a, b, ra, rb, cls) {
  const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
  const nx = -dy / d, ny = dx / d;
  const pts = [[a[0] + nx * ra, a[1] + ny * ra], [b[0] + nx * rb, b[1] + ny * rb], [b[0] - nx * rb, b[1] - ny * rb], [a[0] - nx * ra, a[1] - ny * ra]];
  return `<g class="${cls}"><path d="M${pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')}Z"/><circle cx="${f1(a[0])}" cy="${f1(a[1])}" r="${ra}"/><circle cx="${f1(b[0])}" cy="${f1(b[1])}" r="${rb}"/></g>`;
}

// Trunk: wide at the chest, narrow at the waist, a little wider at the hips.
// `arch` bows the spine: + rounds the back (cat), − lets it sag (cow).
function trunk(hip, shoulder, cls, arch = 0) {
  const dx = shoulder[0] - hip[0], dy = shoulder[1] - hip[1], d = Math.hypot(dx, dy);
  const ux = dx / d, uy = dy / d, nx = -uy, ny = ux;
  const at = (t, w) => {
    const o = w - arch * Math.sin(Math.PI * t);
    return [hip[0] + ux * d * t + nx * o, hip[1] + uy * d * t + ny * o];
  };
  const T = [0, 0.25, 0.45, 0.65, 0.8, 1];
  const front = [12, 11, 10.5, 12.5, 14.5, 13];
  const back = [12, 11.5, 10, 11, 13, 11];
  const pts = [...T.map((t, i) => at(t, front[i])), ...T.map((t, i) => at(t, -back[i])).reverse()];
  return `<path class="${cls}" stroke-linejoin="round" stroke-width="2" d="M${pts.map((p) => `${f1(p[0])},${f1(p[1])}`).join('L')}Z"/>`;
}

function limbLeg(l, hip, muscles, layer) {
  return line(l.ankle, l.toe, 7, `rg-${layer}`)
    + taper(l.knee, l.ankle, 6.5, 4.2, `rg-${layer} ${tone('shin', muscles)}`)
    + taper(hip, l.knee, 10.5, 6.8, `rg-${layer} ${tone('thigh', muscles)}`);
}
function limbArm(a, shoulder, muscles, layer) {
  return taper(a.elbow, a.hand, 4.4, 3.4, `rg-${layer} ${tone('fore', muscles)}`)
    + taper(shoulder, a.elbow, 5.8, 4.4, `rg-${layer} ${tone('upper', muscles)}`);
}

export function drawFigure(pose, muscles) {
  if (pose.view === 'front') return drawFront(pose, muscles);
  const j = solve(pose);
  const props = (pose.props || []);
  return [
    ...props.filter((p) => p.layer !== 'front').map((p) => drawProp(p, j)),
    limbArm(j.armF, j.shoulder, muscles, 'far'),
    limbLeg(j.legF, j.hip, pose.hlLeg === 'N' ? NONE : muscles, 'far'),
    trunk(j.hip, j.shoulder, `rg-near ${tone('torso', muscles)}`, pose.arch || 0),
    `<circle class="rg-near ${tone('pelvis', muscles)}" cx="${f1(j.hip[0])}" cy="${f1(j.hip[1])}" r="11.5"/>`,
    line(j.shoulder, j.neck, 8, 'rg-skin'),
    `<circle class="rg-skin" cx="${j.headC[0].toFixed(1)}" cy="${j.headC[1].toFixed(1)}" r="${LEN.head}"/>`,
    limbLeg(j.legN, j.hip, pose.hlLeg === 'F' ? NONE : muscles, 'near'),
    `<circle class="rg-near ${tone('delt', muscles)}" cx="${f1(j.shoulder[0])}" cy="${f1(j.shoulder[1])}" r="7"/>`,
    limbArm(j.armN, j.shoulder, muscles, 'near'),
    ...props.filter((p) => p.layer === 'front').map((p) => drawProp(p, j)),
  ].join('');
}

// ── Front view ─────────────────────────────
// Fields: hip [x, y]; torso (side bend, deg, + toward screen right); tilt (pelvis,
// deg); ankleL / ankleR [x, y] (screen left/right); kneeOutL / kneeOutR (px the knee
// sits outside the hip→ankle line); handL / handR targets or armL / armR
// [upper, fore] angles from straight down, + away from the body.
// Knee bend toward the viewer is shown as a shorter leg.
const PELVIS = 8.5, SHOULDERS = 15.5;
export function solveFront(p) {
  const t = rad(p.tilt || 0);
  const hipL = [p.hip[0] - PELVIS * Math.cos(t), p.hip[1] + PELVIS * Math.sin(t)];
  const hipR = [p.hip[0] + PELVIS * Math.cos(t), p.hip[1] - PELVIS * Math.sin(t)];
  const tb = rad(p.torso || 0);
  const chest = [p.hip[0] + Math.sin(tb) * LEN.torso, p.hip[1] - Math.cos(tb) * LEN.torso];
  const shL = [chest[0] - SHOULDERS * Math.cos(tb), chest[1] - SHOULDERS * Math.sin(tb)];
  const shR = [chest[0] + SHOULDERS * Math.cos(tb), chest[1] + SHOULDERS * Math.sin(tb)];
  const neck = [chest[0] + Math.sin(tb) * LEN.neck, chest[1] - Math.cos(tb) * LEN.neck];
  const headC = [neck[0] + Math.sin(tb) * LEN.head, neck[1] - Math.cos(tb) * LEN.head];
  const leg = (hipP, ankle, out, dir) => {
    const f = LEN.thigh / (LEN.thigh + LEN.shin);
    const knee = [hipP[0] + (ankle[0] - hipP[0]) * f + dir * (out || 0), hipP[1] + (ankle[1] - hipP[1]) * f];
    return { knee, ankle, toe: [ankle[0] + dir * 8, ankle[1] + 2] };
  };
  const arm = (sh, hand, angles, dir) => {
    if (angles) {
      const elbow = [sh[0] + dir * Math.sin(rad(angles[0])) * LEN.upper, sh[1] + Math.cos(rad(angles[0])) * LEN.upper];
      return { elbow, hand: [elbow[0] + dir * Math.sin(rad(angles[1])) * LEN.fore, elbow[1] + Math.cos(rad(angles[1])) * LEN.fore] };
    }
    const r = ik(sh, hand, LEN.upper, LEN.fore, dir < 0 ? 1 : -1);
    return { elbow: r.joint, hand: r.end };
  };
  return {
    hip: p.hip, hipL, hipR, chest, shL, shR, neck, headC,
    legL: leg(hipL, p.ankleL, p.kneeOutL, -1), legR: leg(hipR, p.ankleR, p.kneeOutR, 1),
    armL: arm(shL, p.handL, p.armL, -1), armR: arm(shR, p.handR, p.armR, 1),
  };
}

function trunkFront(j, cls) {
  const ux = j.chest[0] - j.hip[0], uy = j.chest[1] - j.hip[1], d = Math.hypot(ux, uy);
  const ax = ux / d, ay = uy / d, nx = -ay, ny = ax;
  const at = (t, w) => [j.hip[0] + ax * d * t + nx * w, j.hip[1] + ay * d * t + ny * w];
  const pts = [at(-0.05, 13.5), at(0.45, 11.5), at(0.82, 16.5), at(1, 14), at(1, -14), at(0.82, -16.5), at(0.45, -11.5), at(-0.05, -13.5)];
  return `<path class="${cls}" stroke-linejoin="round" stroke-width="2" d="M${pts.map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}Z"/>`;
}

function drawFront(pose, muscles) {
  const j = solveFront(pose);
  const props = pose.props || [];
  const leg = (l, hipP, side) => {
    const m = pose.hlLeg && pose.hlLeg !== side ? NONE : muscles;
    return line(l.ankle, l.toe, 6, 'rg-near')
      + taper(l.knee, l.ankle, 6, 4, `rg-near ${tone('shin', m)}`)
      + taper(hipP, l.knee, 9.5, 6.4, `rg-near ${tone('thigh', m)}`);
  };
  const arm = (a, sh) => taper(a.elbow, a.hand, 4.2, 3.3, `rg-near ${tone('fore', muscles)}`)
    + taper(sh, a.elbow, 5.6, 4.2, `rg-near ${tone('upper', muscles)}`);
  return [
    ...props.filter((p) => p.layer !== 'front').map((p) => drawProp(p, j)),
    line(j.chest, j.neck, 8, 'rg-skin'),
    `<circle class="rg-skin" cx="${f1(j.headC[0])}" cy="${f1(j.headC[1])}" r="${LEN.head}"/>`,
    leg(j.legL, j.hipL, 'L'), leg(j.legR, j.hipR, 'R'),
    `<ellipse class="rg-near ${tone('pelvis', muscles)}" cx="${f1(j.hip[0])}" cy="${f1(j.hip[1] + 2)}" rx="15" ry="10"/>`,
    trunkFront(j, `rg-near ${tone('torso', muscles)}`),
    `<circle class="rg-near ${tone('delt', muscles)}" cx="${f1(j.shL[0])}" cy="${f1(j.shL[1])}" r="6.5"/>`,
    `<circle class="rg-near ${tone('delt', muscles)}" cx="${f1(j.shR[0])}" cy="${f1(j.shR[1])}" r="6.5"/>`,
    arm(j.armL, j.shL), arm(j.armR, j.shR),
    ...props.filter((p) => p.layer === 'front').map((p) => drawProp(p, j)),
  ].join('');
}

// Props: chair, step, wall, mat, band (between two named joints), dumbbell (at a hand).
function drawProp(p, j) {
  const pt = (name) => ({
    handN: j.armN?.hand, handF: j.armF?.hand, handL: j.armL?.hand, handR: j.armR?.hand, footN: j.legN?.ankle, footF: j.legF?.ankle, toeN: j.legN?.toe, toeF: j.legF?.toe,
    shoulder: j.shoulder, hip: j.hip, kneeN: j.legN?.knee, kneeL: j.legL?.knee, kneeR: j.legR?.knee,
  })[name] || name;
  switch (p.type) {
    case 'chair': return `<g class="rg-prop"><rect x="${p.x}" y="${p.y}" width="${p.w || 34}" height="5" rx="2.5"/><rect x="${p.x}" y="${p.y}" width="4" height="${180 - p.y}" rx="2"/><rect x="${p.x + (p.w || 34) - 4}" y="${p.y}" width="4" height="${180 - p.y}" rx="2"/><rect x="${p.x}" y="${p.y - 40}" width="4" height="42" rx="2"/></g>`;
    case 'step': return `<rect class="rg-prop" x="${p.x}" y="${p.y}" width="${p.w || 50}" height="${180 - p.y}" rx="3"/>`;
    case 'wall': return `<rect class="rg-prop" x="${p.x}" y="20" width="6" height="160" rx="2"/>`;
    case 'table': return `<g class="rg-prop"><rect x="${p.x}" y="${p.y}" width="${p.w}" height="6" rx="3"/><rect x="${p.x + p.w - 8}" y="${p.y}" width="5" height="${180 - p.y}" rx="2"/></g>`;
    case 'counter': return `<rect class="rg-prop" x="${p.x}" y="${p.y}" width="${p.w || 50}" height="${180 - p.y}" rx="4"/>`;
    case 'cushion': return `<rect class="rg-prop" x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${p.h / 2}"/>`;
    case 'rail': return `<rect class="rg-rail" x="${p.x}" y="${p.y}" width="${p.w}" height="5" rx="2.5"/>`;
    case 'mat': return `<rect class="rg-mat" x="${p.x}" y="178" width="${p.w}" height="4" rx="2"/>`;
    case 'band': { const a = pt(p.from), b = pt(p.to); return `<line class="rg-band" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`; }
    case 'dumbbell': { const h = pt(p.at); return `<g class="rg-db"><rect x="${h[0] - 9}" y="${h[1] - 3}" width="18" height="6" rx="3"/><rect x="${h[0] - 11}" y="${h[1] - 6}" width="5" height="12" rx="2"/><rect x="${h[0] + 6}" y="${h[1] - 6}" width="5" height="12" rx="2"/></g>`; }
    default: return '';
  }
}

export function animationSVG(anim, muscles, { label = '' } = {}) {
  const vb = anim.viewBox || '0 -6 240 192';
  return `<svg class="rig" viewBox="${vb}" role="img" aria-label="${label}" data-rig>
    ${anim.floor === false ? '' : '<line class="rg-floor" x1="-20" y1="181" x2="260" y2="181"/>'}
    <g data-fig>${drawFigure(anim.frames[0].pose, muscles)}</g></svg>`;
}

// One shared loop drives every mounted animation on the page.
const mounted = new Set();
let raf = 0;
function loop(now) {
  for (const m of mounted) {
    if (!m.el.isConnected) { mounted.delete(m); continue; }
    m.fig.innerHTML = drawFigure(poseAt(m.anim, now - m.t0), m.muscles);
  }
  raf = mounted.size ? requestAnimationFrame(loop) : 0;
}

export function mountAnimation(el, anim, muscles) {
  const fig = el.querySelector('[data-fig]');
  if (!fig) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Static: show the end position of the movement.
    const mid = anim.frames[Math.min(anim.keyFrame ?? 1, anim.frames.length - 1)].pose;
    fig.innerHTML = drawFigure(mid, muscles);
    return;
  }
  mounted.add({ el, fig, anim, muscles, t0: performance.now() });
  if (!raf) raf = requestAnimationFrame(loop);
}

export { REGION_NAMES };
