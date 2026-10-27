// Keyframed exercise animations for js/rig.js. Each frame's `ms` is the time spent
// moving from that pose to the next one (repeat a pose to hold it). Ground is
// y = 180; ankles sit at y = 176. See docs/animation-plan.md for the full list.

const ARMS_FORWARD = { armN: [72, 92], armF: [66, 88] };
const ARMS_RELAXED = { armN: [8, 4], armF: [-8, -4] };

// ── Sit-to-stand: slow 3 s lowering to a chair, stand up tall ──
const chair = [{ type: 'chair', x: 70, y: 140, w: 36 }];
const stsStand = { hip: [126, 88], torso: 3, ankleN: [130, 176], ankleF: [128, 176], ...ARMS_FORWARD, props: chair };
const stsSit = { hip: [97, 128], torso: 34, ankleN: [130, 176], ankleF: [128, 176], ...ARMS_FORWARD, props: chair };

// ── Glute bridge: lying, feet flat, lift hips into a line, 2 s squeeze ──
const mat = [{ type: 'mat', x: 0, w: 200 }];
const bridgeArms = { armN: [90, 90], armF: [90, 90] };
const brDown = { hip: [96, 167], torso: -90, head: 0, ankleN: [150, 176], ankleF: [146, 176], ...bridgeArms, props: mat };
const brUp = { hip: [100, 140], torso: -120, head: 30, ankleN: [150, 176], ankleF: [146, 176], ...bridgeArms, props: mat };

// ── Hip hinge drill: hands on hips, push hips back with a long back ──
const hgStand = { hip: [124, 88], torso: 2, ankleN: [128, 176], ankleF: [126, 176], handN: [131, 85], handF: [129, 85], props: [] };
const hgHinge = { hip: [101, 95], torso: 70, ankleN: [128, 176], ankleF: [126, 176], handN: [109, 90], handF: [107, 90], props: [] };

// ── Step-up: whole foot on the step, drive up, step down with control ──
const step = [{ type: 'step', x: 140, y: 150, w: 70 }];
const su0 = { hip: [118, 88], torso: 2, ankleN: [122, 176], ankleF: [116, 176], ...ARMS_RELAXED, props: step };
const suLift = { hip: [122, 90], torso: 5, ankleN: [142, 130], ankleF: [116, 176], ...ARMS_RELAXED, props: step };
const suPlant = { hip: [126, 94], torso: 12, ankleN: [162, 146], ankleF: [116, 176], ...ARMS_RELAXED, props: step };
const suRise = { hip: [150, 66], torso: 6, ankleN: [162, 146], ankleF: [142, 136], ...ARMS_RELAXED, props: step };
const suTop = { hip: [160, 59], torso: 2, ankleN: [162, 146], ankleF: [166, 146], ...ARMS_RELAXED, props: step };
const suBack = { hip: [150, 70], torso: 4, ankleN: [162, 146], ankleF: [134, 140], ...ARMS_RELAXED, props: step };
const suDown = { hip: [128, 94], torso: 8, ankleN: [162, 146], ankleF: [116, 176], ...ARMS_RELAXED, props: step };

// ── Calf raise: fingertips on a wall, rise high, pause, lower over 2–3 s ──
const wallR = [{ type: 'wall', x: 196 }];
const crHands = { handN: [192, 66], handF: [191, 68], elbowN: -1, elbowF: -1 };
const crDown = { hip: [130, 90], torso: 4, ankleN: [132, 176], ankleF: [129, 176], footN: 90, footF: 90, ...crHands, props: wallR };
const crUp = { hip: [134, 77], torso: 4, ankleN: [136, 162], ankleF: [133, 162], footN: 45, footF: 45, ...crHands, props: wallR };

// ── Supported split squat: long stance, back heel up, lower straight down ──
const counterR = [{ type: 'counter', x: 178, y: 98, w: 50 }];
const ssHand = { handN: [180, 94], armF: [10, 6] };
const ssUp = { hip: [118, 90], torso: 3, ankleN: [152, 176], ankleF: [80, 172], footN: 90, footF: 128, kneeF: 1, ...ssHand, props: counterR };
const ssDown = { hip: [116, 122], torso: 3, ankleN: [152, 176], ankleF: [80, 172], footN: 90, footF: 128, kneeF: 1, ...ssHand, props: counterR };

// ── Wall sit: back on the wall, slide to a comfortable angle, hold ──
const wallL = [{ type: 'wall', x: 64 }];
const wsArms = { armN: [12, 40], armF: [8, 36] };
const wsUp = { hip: [84, 94], torso: 0, ankleN: [126, 176], ankleF: [123, 176], ...wsArms, props: wallL };
const wsDown = { hip: [84, 132], torso: 0, ankleN: [126, 176], ankleF: [123, 176], ...wsArms, props: wallL };

// ── Single-leg balance: one foot just off the floor, small natural sway ──
const sbBase = { hlLeg: 'F', torso: 0, ankleF: [121, 176], footN: 100, handN: [181, 95], elbowN: -1, armF: [6, 4], props: counterR };
const sb0 = { ...sbBase, hip: [119, 88], ankleN: [130, 164] };
const sb1 = { ...sbBase, hip: [121, 88], torso: 1.5, ankleN: [132, 165] };
const sb2 = { ...sbBase, hip: [118, 88], torso: -1, ankleN: [129, 163] };

// ── Knee-to-wall ankle rocks: front heel down, knee travels toward the wall ──
const arHands = { handN: [192, 72], handF: [191, 74] };
const arBack = { hip: [136, 92], torso: 6, ankleN: [164, 176], ankleF: [110, 176], footF: 100, ...arHands, props: wallR };
const arFwd = { hip: [148, 104], torso: 8, ankleN: [164, 176], ankleF: [110, 174], footF: 118, ...arHands, props: wallR };

// ── Standing hip circles: knee up in front, round out to the side, down ──
const counterL = [{ type: 'counter', x: 40, y: 98, w: 50 }];
const hcBase = { torso: 0, ankleF: [124, 176], handF: [86, 95], elbowF: 1, armN: [10, 5], props: counterL };
const hc0 = { ...hcBase, hip: [121, 88], ankleN: [126, 176] };
const hcFront = { ...hcBase, hip: [119, 88], ankleN: [168, 130], footN: 120 };
const hcSide = { ...hcBase, hip: [119, 87], ankleN: [136, 146], footN: 110 };
const hcBack = { ...hcBase, hip: [120, 88], ankleN: [120, 162], footN: 100 };

// ── Calf stretch at the wall: lean in with the back heel down, then bend that knee ──
const csHands = { handN: [192, 58], handF: [191, 60] };
const csUp = { hip: [126, 90], torso: 6, ankleN: [96, 176], ankleF: [150, 176], footF: 90, hlLeg: 'N', ...csHands, props: wallR };
const csLean = { hip: [140, 96], torso: 26, hlLeg: 'N', ankleN: [96, 176], ankleF: [150, 176], ...csHands, props: wallR };
const csBend = { hip: [140, 101], torso: 22, hlLeg: 'N', ankleN: [96, 176], ankleF: [150, 176], kneeN: 1, ...csHands, props: wallR };

// ── Half-kneeling hip flexor stretch: tuck, then shift forward ──
const cushion = [{ type: 'cushion', x: 84, y: 172, w: 32, h: 8 }];
const hfArms = { armN: [14, 8], armF: [10, 6] };
const hfBase = { hlLeg: 'F', torso: 0, ankleN: [154, 176], kneePosF: [100, 168], ankleF: [56, 176], footF: 95, ...hfArms, props: cushion };
const hf0 = { ...hfBase, hip: [100, 122] };
const hfFwd = { ...hfBase, hip: [113, 125], torso: -2 };

// ── Lying hamstring stretch with band: raise the banded leg to a mild stretch ──
const hsBase = { hlLeg: 'N', torso: -90, head: 0, ankleF: [150, 176], kneeF: 1, handN: [88, 138], handF: [86, 140], elbowN: 1, elbowF: 1 };
const hsBand = [{ type: 'mat', x: 0, w: 200 }, { type: 'band', from: 'handN', to: 'toeN', layer: 'front' }];
const hsDown = { ...hsBase, hip: [110, 167], ankleN: [146, 176], footN: 90, props: hsBand };
const hsUp = { ...hsBase, hip: [110, 167], ankleN: [128, 80], footN: 200, kneeN: 1, props: hsBand };

// ── Shoulder rolls: up, back, down; arms relaxed ──
const srBase = { hip: [120, 88], torso: 0, ankleN: [122, 176], ankleF: [120, 176], armN: [16, 10], armF: [-2, -2], props: [] };
const sr0 = { ...srBase, shoulderShift: [0, 0] };
const srUp = { ...srBase, shoulderShift: [2, -9] };
const srBackP = { ...srBase, shoulderShift: [-8, -4], armN: [6, 2] };
const srDownP = { ...srBase, shoulderShift: [-3, 3] };

// ── Front view: band side steps (band above the knees, knees out, hands on hips) ──
const F = { view: 'front', torso: 0 };
const bsBand = (k) => [{ type: 'band', from: 'kneeL', to: 'kneeR', layer: 'front' }];
const bsHands = (x) => ({ handL: [x - 22, 100], handR: [x + 22, 100] });
const bs = (x, l, r, lift = {}) => ({ ...F, hip: [x, 96], ankleL: [l, lift.l ?? 176], ankleR: [r, lift.r ?? 176], kneeOutL: 3, kneeOutR: 3, ...bsHands(x), props: bsBand() });
const bsA = bs(110, 96, 124);
const bsB = bs(116, 96, 142, { r: 170 });
const bsC = bs(122, 96, 148);
const bsD = bs(128, 110, 148, { l: 170 });
const bsE = bs(134, 120, 148);

// ── Front view: side leg swings (hands on a rail, swing across and out) ──
const lsRail = [{ type: 'rail', x: 80, y: 98, w: 80, layer: 'front' }];
const lsBase = { ...F, hlLeg: 'R', hip: [120, 88], ankleL: [111, 176], handL: [100, 99], handR: [140, 99], props: lsRail };
const lsAcross = { ...lsBase, ankleR: [94, 170], tilt: 2, torso: 1.5 };
const lsOut = { ...lsBase, ankleR: [170, 160], tilt: -4, torso: -2.5 };
const lsMid = { ...lsBase, ankleR: [130, 176] };

// ── Ankle circles: hold the counter, foot just off the floor, draw slow circles ──
const acBase = { ...sbBase, hlLeg: 'N', hip: [120, 88], ankleN: [134, 160], kneeN: 1 };
const acA = { ...acBase, footN: 55 };
const acB = { ...acBase, footN: 95, ankleN: [135, 158] };
const acC = { ...acBase, footN: 130 };
const acD = { ...acBase, footN: 95, ankleN: [133, 162] };

// ═══ Batch B: unlock once the ribs are cleared ═══

// ── Quadruped base (cat–cow, bird dog): hands under shoulders, knees under hips ──
const quadMat = [{ type: 'mat', x: 20, w: 200 }];
const quad = {
  hip: [102, 124], torso: 90, head: 0,
  kneePosN: [102, 170], ankleN: [58, 174], kneePosF: [100, 170], ankleF: [56, 174], footN: 95, footF: 95,
  handN: [162, 181], handF: [160, 181], elbowN: -1, elbowF: -1, props: quadMat,
};

// ── Cat–cow: round up slowly, then let the chest sink, small range ──
const ccNeutral = { ...quad, arch: 0 };
const ccCat = { ...quad, hip: [102, 121], arch: 9, head: 45 };
const ccCow = { ...quad, hip: [102, 126], arch: -6, head: -18 };

// ── Bird dog: reach one arm forward and the opposite leg back, hips level ──
const bdReach = {
  ...quad, handN: undefined, armN: [90, 90], elbowN: undefined, armF: [-28, 28],
  kneePosF: [56, 122], ankleF: [12, 124], footF: 180,
};
const bdQuad = { ...quad, handN: undefined, armN: [-28, 28], elbowN: undefined, armF: [-28, 28], kneePosF: [100, 170], ankleF: [56, 174], footF: 95 };

// ── Bodyweight squat: hips back and down to a comfortable depth, stand ──
const sqStand = { hip: [124, 88], torso: 3, ankleN: [128, 176], ankleF: [126, 176], ...ARMS_FORWARD, props: [] };
const sqDown = { hip: [99, 126], torso: 36, ankleN: [128, 176], ankleF: [126, 176], ...ARMS_FORWARD, props: [] };

// ── Band good morning: band under the feet and behind the upper back, hinge ──
const gmBand = [{ type: 'band', from: 'footN', to: 'handN' }];
const gmStand = { hip: [124, 88], torso: 2, ankleN: [128, 176], ankleF: [126, 176], handN: [134, 37], handF: [132, 38], elbowN: -1, elbowF: -1, props: gmBand };
const gmHinge = { hip: [100, 95], torso: 70, ankleN: [128, 176], ankleF: [126, 176], handN: [152, 84], handF: [150, 85], elbowN: -1, elbowF: -1, props: gmBand };

// ── Dumbbell Romanian deadlift: soft knees, weights slide down the thighs to mid-shin ──
const dbs = [{ type: 'dumbbell', at: 'handN', layer: 'front' }];
const rdStand = { hip: [124, 88], torso: 2, ankleN: [128, 176], ankleF: [126, 176], armN: [0, 0], armF: [-2, -2], props: dbs };
const rdHinge = { hip: [94, 99], torso: 72, ankleN: [128, 176], ankleF: [126, 176], armN: [-4, -6], armF: [-6, -8], props: dbs };

// ── Dead bug: lying, arms up, knees over hips; opposite arm and leg reach long ──
const dbMat = [{ type: 'mat', x: 0, w: 210 }];
const dbBase = { hip: [126, 167], torso: -90, head: 0, ankleN: [170, 121], ankleF: [168, 123], armN: [180, 180], armF: [180, 180], props: dbMat };
const dbA = { ...dbBase, armN: [252, 256], ankleF: [212, 160] };
const dbB = { ...dbBase, armF: [252, 256], ankleN: [214, 160] };

// ── Band pull-apart (front): arms forward at chest height, pull the band apart ──
const paBand = [{ type: 'band', from: 'handL', to: 'handR', layer: 'front' }];
const paBase = { ...F, hip: [120, 92], ankleL: [110, 176], ankleR: [130, 176], props: paBand };
const paIn = { ...paBase, handL: [106, 44], handR: [134, 44] };
const paOut = { ...paBase, handL: [46, 38], handR: [194, 38] };

// ── Seated band row: sitting tall, legs long, pull the elbows back past the ribs ──
const rwBand = [{ type: 'band', from: 'toeN', to: 'handN', layer: 'front' }, { type: 'mat', x: 30, w: 200 }];
const rwBase = { hip: [92, 166], torso: -4, ankleN: [176, 172], ankleF: [174, 173], footN: 165, footF: 165, kneeN: 1, kneeF: 1, elbowN: -1, elbowF: -1, props: rwBand };
const rwOut = { ...rwBase, handN: [146, 120], handF: [144, 121] };
const rwIn = { ...rwBase, torso: -6, handN: [100, 130], handF: [98, 131] };

// ── Wall push-up: body in one line from the ankles, chest toward the wall ──
const wpHands = { handN: [192, 46], handF: [191, 48], elbowN: -1, elbowF: -1 };
const wpOut = { hip: [116.6, 91.9], torso: 20, ankleN: [86, 176], ankleF: [84, 176], footN: 105, footF: 105, ...wpHands, props: wallR };
const wpIn = { hip: [131.4, 98.9], torso: 30.5, ankleN: [86, 176], ankleF: [84, 176], footN: 115, footF: 115, ...wpHands, props: wallR };

// ── Open book (seen from above): lying on one side, knees stacked; the top arm
// sweeps up over the body and opens to the other side, eyes following ──
const obMat = [{ type: 'cushion', x: 14, y: 52, w: 212, h: 132 }];
const obBase = {
  hip: [136, 104], torso: -90, head: 0,
  ankleN: [182, 150], ankleF: [180, 152], kneeN: -1, kneeF: -1, footN: 90, footF: 90,
  armF: [0, 0], props: obMat,
};
const obStart = { ...obBase, armN: [0, 0], armScaleN: 1 };
const obUp = { ...obBase, armN: [0, 0], armScaleN: 0.18, head: 20 };
const obOverUp = { ...obBase, armN: [180, 180], armScaleN: 0.18, head: 50 };
const obOpen = { ...obBase, armN: [180, 180], armScaleN: 1, head: 80 };

// ═══ Batch C: phase 2 variations and ribs-healed exercises ═══

// ── Single-leg glute bridge: one leg straight in line with the other thigh ──
const slArms = { armN: [90, 90], armF: [90, 90] };
const slDown = { hip: [96, 167], torso: -90, head: 0, ankleF: [146, 176], footF: 90, ankleN: [160.6, 105.7], footN: 200, ...slArms, hlLeg: 'F', props: mat };
const slUp = { hip: [100, 140], torso: -120, head: 30, ankleF: [146, 176], footF: 90, ankleN: [187.7, 124.3], footN: 170, ...slArms, hlLeg: 'F', props: mat };

// ── Slow step-down: standing side-on on a stair, lower the free heel to tap the floor ──
const sdStep = [{ type: 'step', x: 30, y: 150, w: 100 }];
const sdArms = { armN: [34, 40], armF: [26, 34] };
const sdTop = { hip: [120, 58], torso: 3, ankleF: [122, 146], ankleN: [140, 142], footN: 100, kneeN: 1, ...sdArms, hlLeg: 'F', props: sdStep };
const sdLow = { hip: [114, 92], torso: 18, ankleF: [122, 146], ankleN: [148, 176], footN: 100, ...sdArms, hlLeg: 'F', props: sdStep };

// ── Reverse lunge: step back, lower until both knees bend, drive back up ──
const rlArms = { armN: [8, 4], armF: [-6, -4] };
const rlStand = { hip: [146, 88], torso: 2, ankleN: [150, 176], ankleF: [146, 176], footF: 90, ...rlArms, props: [] };
const rlLift = { hip: [140, 90], torso: 4, ankleN: [150, 176], ankleF: [102, 160], footF: 110, ...rlArms, props: [] };
const rlPlant = { hip: [128, 98], torso: 4, ankleN: [150, 176], ankleF: [78, 172], footF: 128, ...rlArms, props: [] };
const rlLow = { hip: [110, 124], torso: 5, ankleN: [150, 176], ankleF: [78, 172], footF: 128, ...rlArms, props: [] };

// ── Single-leg calf raise: other foot lifted behind, rise high, lower slowly ──
const slcDown = { ...crDown, ankleF: [112, 150], footF: 120, kneeF: 1, hlLeg: 'N' };
const slcUp = { ...crUp, ankleF: [115, 137], footF: 120, kneeF: 1, hlLeg: 'N' };

// ── Goblet squat to chair: one dumbbell held upright at the chest ──
const gsDb = [...chair, { type: 'dumbbell', at: 'handN', layer: 'front' }];
const gsStand = { hip: [126, 88], torso: 3, ankleN: [130, 176], ankleF: [128, 176], handN: [140, 46], handF: [138, 47], elbowN: -1, elbowF: -1, props: gsDb };
const gsSit = { hip: [97, 128], torso: 30, ankleN: [130, 176], ankleF: [128, 176], handN: [137, 92], handF: [135, 93], elbowN: -1, elbowF: -1, props: gsDb };

// ── One-arm dumbbell row: hand on a chair seat, back flat, pull the weight to the hip ──
const drChair = [{ type: 'chair', x: 150, y: 140, w: 36 }, { type: 'dumbbell', at: 'handN', layer: 'front' }];
const drBase = { hip: [92, 96], torso: 78, head: -10, ankleN: [112, 176], ankleF: [70, 176], handF: [160, 138], elbowF: -1, props: drChair };
const drDown = { ...drBase, handN: [149, 142] };
const drUp = { ...drBase, handN: [128, 104], elbowN: -1 };

// ── Incline push-up: hands on a counter, body in one line, chest to the edge ──
const ipCounter = [{ type: 'counter', x: 168, y: 116, w: 60 }];
const ipHands = { handN: [172, 116], handF: [171, 117], elbowN: -1, elbowF: -1 };
const ipUp = { hip: [116.6, 108.6], torso: 40, ankleN: [60, 176], ankleF: [58, 176], footN: 115, footF: 115, ...ipHands, props: ipCounter };
const ipDown = { hip: [129.3, 121.8], torso: 52, ankleN: [60, 176], ankleF: [58, 176], footN: 125, footF: 125, ...ipHands, props: ipCounter };

// ── Suitcase carry (front, walking toward you): weight in one hand, no lean ──
const scDb = [{ type: 'dumbbell', at: 'handR', layer: 'front' }];
const scBase = { ...F, hip: [120, 88], armL: [6, 4], armR: [7, 2], props: scDb };
const scMid = { ...scBase, ankleL: [112, 176], ankleR: [128, 176] };
const scL = { ...scBase, hip: [120, 86], ankleL: [113, 165], ankleR: [128, 176] };
const scR = { ...scBase, hip: [120, 86], ankleL: [112, 176], ankleR: [127, 165] };

// ═══ Dumbbell set ═══
const DB_N = { type: 'dumbbell', at: 'handN', layer: 'front' };
const DB_F = { type: 'dumbbell', at: 'handF' };
const HANG = { armN: [0, 0], armF: [-2, -2] };

// ── Weighted glute bridge: dumbbell across the hips, steadied with both hands ──
const wbDown = { hip: [96, 167], torso: -90, head: 0, ankleN: [150, 176], ankleF: [146, 176], handN: [96, 152], handF: [94, 153], elbowN: 1, elbowF: 1, props: [...mat, DB_N] };
const wbUp = { hip: [100, 140], torso: -120, head: 30, ankleN: [150, 176], ankleF: [146, 176], handN: [100, 125], handF: [98, 126], elbowN: 1, elbowF: 1, props: [...mat, DB_N] };

// ── Dumbbell calf raise: weights at the sides ──
const dcDown = { ...crDown, handN: undefined, handF: undefined, ...HANG, props: [DB_F, DB_N] };
const dcUp = { ...crUp, handN: undefined, handF: undefined, ...HANG, props: [DB_F, DB_N] };

// ── Dumbbell sumo squat (front): wide stance, one dumbbell hanging between the legs ──
const smDb = [{ type: 'dumbbell', at: 'handR', layer: 'front' }];
const smUp = { ...F, hip: [120, 90], ankleL: [90, 176], ankleR: [150, 176], kneeOutL: 2, kneeOutR: 2, handL: [117, 100], handR: [123, 100], props: smDb };
const smDown = { ...F, hip: [120, 124], ankleL: [90, 176], ankleR: [150, 176], kneeOutL: 12, kneeOutR: 12, handL: [117, 132], handR: [123, 132], props: smDb };

// ── Dumbbell step-up: the step-up with a weight in each hand ──
const dsu = (pose) => ({ ...pose, armN: [0, 0], armF: [-2, -2], props: [...step, DB_F, DB_N] });

// ── Dumbbell split squat: no support, a weight at each side ──
const dssUp = { ...ssUp, handN: undefined, ...HANG, props: [DB_F, DB_N] };
const dssDown = { ...ssDown, handN: undefined, ...HANG, props: [DB_F, DB_N] };

// ── Single-leg RDL: hinge on one leg, free leg reaches back in line with the body ──
const srStand = { hip: [124, 88], torso: 2, ankleN: [128, 176], ankleF: [118, 166], footF: 100, ...HANG, hlLeg: 'N', props: [DB_F] };
const srHinge = { hip: [112, 96], torso: 78, ankleN: [128, 176], ankleF: [26, 114], footF: 10, kneeF: 1, ...HANG, hlLeg: 'N', props: [DB_F] };

// ── Dumbbell floor press: elbows to the floor, press up over the chest ──
const fpBase = { hip: [126, 167], torso: -90, head: 0, ankleN: [172, 176], ankleF: [170, 176], props: [...dbMat, DB_N] };
const fpDown = { ...fpBase, armN: [78, 180], armF: [78, 180] };
const fpUp = { ...fpBase, armN: [174, 176], armF: [174, 176] };

// ── Bent-over row: hinge to about 45°, pull both weights to the lower ribs ──
const boBase = { hip: [102, 95], torso: 55, ankleN: [128, 176], ankleF: [126, 176], props: [DB_F, DB_N] };
const boDown = { ...boBase, handN: [147, 121], handF: [145, 122] };
const boUp = { ...boBase, handN: [128, 94], handF: [126, 95], elbowN: -1, elbowF: -1 };

// ── Farmer carry (front, walking toward you): a weight in each hand ──
const fcDb = [{ type: 'dumbbell', at: 'handL', layer: 'front' }, { type: 'dumbbell', at: 'handR', layer: 'front' }];
const fcBase = { ...F, hip: [120, 88], armL: [7, 2], armR: [7, 2], props: fcDb };
const fcMid = { ...fcBase, ankleL: [112, 176], ankleR: [128, 176] };
const fcL = { ...fcBase, hip: [120, 86], ankleL: [113, 165], ankleR: [128, 176] };
const fcR = { ...fcBase, hip: [120, 86], ankleL: [112, 176], ankleR: [127, 165] };

// ── Dumbbell dead bug: weight held still above the chest, legs take turns ──
const ddBase = { ...dbBase, armN: [180, 180], armF: [180, 180], props: [...dbMat, DB_N] };
const ddA = { ...ddBase, ankleF: [212, 160] };
const ddB = { ...ddBase, ankleN: [214, 160] };

// ── Alternating curl: elbow stays by the side ──
const cuBase = { hip: [120, 88], torso: 0, ankleN: [124, 176], ankleF: [120, 176], props: [DB_F, DB_N] };
const cuRest = { ...cuBase, armN: [0, 0], armF: [-2, -2] };
const cuN = { ...cuBase, armN: [2, 160], armF: [-2, -2] };
const cuF = { ...cuBase, armN: [0, 0], armF: [2, 160] };

// ── Lying triceps extension: upper arms still, weight lowers past the head ──
const teBase = { hip: [126, 167], torso: -90, head: 0, ankleN: [172, 176], ankleF: [170, 176], props: [...dbMat, DB_N] };
const teUp = { ...teBase, armN: [180, 180], armF: [180, 180] };
const teDown = { ...teBase, armN: [186, 286], armF: [186, 286] };

// ── Single-arm overhead press: from the shoulder to straight up, other hand on hip ──
const opBase = { hip: [120, 88], torso: 0, ankleN: [124, 176], ankleF: [120, 176], handF: [112, 84], elbowF: -1, props: [DB_N] };
const opDown = { ...opBase, armN: [28, 168] };
const opUp = { ...opBase, armN: [178, 180] };

// ═══ Bodyweight set ═══
const floorMat = [{ type: 'mat', x: 0, w: 240 }];

// ── Knee push-up: straight line from knees to head, chest toward the floor ──
const kpBase = { kneePosN: [70, 172], kneePosF: [68, 172], ankleN: [30, 176], ankleF: [28, 176], footN: 270, footF: 270, handN: [156, 177], handF: [154, 177], elbowN: -1, elbowF: -1, head: 0, props: floorMat };
const kpUp = { ...kpBase, hip: [109, 147.6], torso: 58 };
const kpDown = { ...kpBase, hip: [115, 162.3], torso: 77.8 };

// ── Push-up: on the toes, body in one line from heels to head ──
const puBase = { ankleN: [28, 166], ankleF: [26, 167], footN: 35, footF: 35, handN: [166, 177], handF: [164, 177], elbowN: -1, elbowF: -1, head: 0, props: floorMat };
const puUp = { ...puBase, hip: [111.1, 137], torso: 70.8 };
const puDown = { ...puBase, hip: [115.6, 157.6], torso: 84.5 };

// ── Pike push-up: hips high, head lowers toward the floor in front of the hands ──
const ppBase = { ankleN: [60, 166], ankleF: [58, 167], footN: 35, footF: 35, handN: [152, 178], handF: [150, 178], elbowN: -1, elbowF: -1, head: 0, props: floorMat };
const ppUp = { ...ppBase, hip: [98, 84], torso: 140 };
const ppDown = { ...ppBase, hip: [108, 99], torso: 145 };

// ── Table row: heels on the floor, pull the chest to the table edge ──
const trTable = [{ type: 'table', x: 120, y: 86, w: 120 }];
const trBase = { ankleN: [18, 176], ankleF: [16, 176], footN: 180, footF: 180, handN: [160, 90], handF: [158, 91], elbowN: -1, elbowF: -1, head: 0, props: trTable };
const trDown = { ...trBase, hip: [104, 157.7], torso: 78 };
const trUp = { ...trBase, hip: [98.3, 139.8], torso: 65.7 };

// ── Chair dip: hands on the seat edge behind, knees bent, lower and press ──
const cdChair = [{ type: 'chair', x: 40, y: 130, w: 36 }];
const cdBase = { ankleN: [150, 176], ankleF: [148, 176], handN: [76, 128], handF: [74, 129], elbowN: -1, elbowF: -1, props: cdChair };
const cdUp = { ...cdBase, hip: [88, 128], torso: -3 };
const cdDown = { ...cdBase, hip: [90, 150], torso: -6 };

// ── Forearm plank: from the knees, lift into one straight line, hold ──
const plArms = { armN: [0, 90], armF: [0, 90] };
const plKnees = { hip: [122, 150], torso: 84, kneePosN: [96, 172], kneePosF: [94, 172], ankleN: [55, 176], ankleF: [53, 176], footN: 270, footF: 270, ...plArms, props: floorMat };
const plHold = { hip: [112.6, 153.3], torso: 81.7, kneePosN: [67.1, 159.9], kneePosF: [65.1, 160.4], ankleN: [25.5, 166], ankleF: [23.5, 167], footN: 35, footF: 35, ...plArms, props: floorMat };

// ── Side plank (front): forearm under the shoulder, lift the hips into a line ──
const spBase = { view: 'front', ankleL: [28, 171], ankleR: [30, 176], armR: [0, 90], handL: [104, 150], props: floorMat };
const spDown = { ...spBase, hip: [108, 166], torso: 77, tilt: -77 };
const spUp = { ...spBase, hip: [108, 150], torso: 70, tilt: -70, handL: [104, 136] };

// ── Superman: lying face down, lift arms, chest and legs a little, hold ──
const smBase = { ankleN: [219, 172], ankleF: [218, 173], footN: 100, footF: 100, props: floorMat };
const smFlat = { ...smBase, hip: [128, 168], torso: -90, head: 0, armN: [270, 270], armF: [270, 270] };
const smLift = { ...smBase, hip: [128, 168], torso: -82, head: -4, armN: [258, 262], armF: [258, 262], ankleN: [218, 156], ankleF: [218, 157] };

// ── Lateral lunge (front): sit back to one side, other leg straight ──
const llHands = (x, y) => ({ handL: [x - 6, y - 40], handR: [x + 6, y - 40] });
const ll = (x, y, outL, outR) => ({ ...F, hip: [x, y], ankleL: [74, 176], ankleR: [166, 176], kneeOutL: outL, kneeOutR: outR, ...llHands(x, y) });
const llMid = ll(120, 96, 0, 0);
const llRight = ll(146, 122, 0, 10);
const llLeft = ll(94, 122, 10, 0);

// ── Bulgarian split squat: back foot on a chair, front leg does the work ──
const bsChair = [{ type: 'chair', x: 24, y: 130, w: 40 }];
const bsBase = { ankleN: [150, 176], ankleF: [60, 124], footN: 90, footF: 265, kneeF: 1, handN: [124, 82], handF: [122, 83], elbowN: -1, elbowF: -1, hlLeg: 'N', props: bsChair };
const bssUp = { ...bsBase, hip: [118, 90], torso: 4, handN: [126, 84], handF: [124, 85] };
const bssDown = { ...bsBase, hip: [110, 124], torso: 8, handN: [120, 118], handF: [118, 119] };

export const ANIMATIONS = {
  'knee-pushup': {
    keyFrame: 2,
    frames: [{ pose: kpUp, ms: 500 }, { pose: kpUp, ms: 1600 }, { pose: kpDown, ms: 300 }, { pose: kpDown, ms: 1000 }],
  },
  pushup: {
    keyFrame: 2,
    frames: [{ pose: puUp, ms: 500 }, { pose: puUp, ms: 1600 }, { pose: puDown, ms: 300 }, { pose: puDown, ms: 1000 }],
  },
  'pike-pushup': {
    keyFrame: 2,
    viewBox: '0 -6 240 192',
    frames: [{ pose: ppUp, ms: 500 }, { pose: ppUp, ms: 1600 }, { pose: ppDown, ms: 300 }, { pose: ppDown, ms: 1100 }],
  },
  'table-row': {
    keyFrame: 2,
    frames: [{ pose: trDown, ms: 500 }, { pose: trDown, ms: 900 }, { pose: trUp, ms: 600 }, { pose: trUp, ms: 1600 }],
  },
  'chair-dip': {
    keyFrame: 2,
    frames: [{ pose: cdUp, ms: 500 }, { pose: cdUp, ms: 1600 }, { pose: cdDown, ms: 300 }, { pose: cdDown, ms: 1100 }],
  },
  plank: {
    keyFrame: 1,
    frames: [{ pose: plKnees, ms: 900 }, { pose: plHold, ms: 900 }, { pose: plHold, ms: 3200 }, { pose: plKnees, ms: 800 }],
  },
  'side-plank': {
    keyFrame: 1,
    caption: 'Seen from the front',
    frames: [{ pose: spDown, ms: 900 }, { pose: spUp, ms: 900 }, { pose: spUp, ms: 3000 }, { pose: spDown, ms: 800 }],
  },
  superman: {
    keyFrame: 1,
    viewBox: '0 -6 250 192',
    caption: 'Lying face down',
    frames: [{ pose: smFlat, ms: 900 }, { pose: smLift, ms: 900 }, { pose: smLift, ms: 2000 }, { pose: smFlat, ms: 1000 }],
  },
  'lateral-lunge': {
    keyFrame: 1,
    frames: [
      { pose: llMid, ms: 400 }, { pose: llRight, ms: 1500 }, { pose: llRight, ms: 300 }, { pose: llMid, ms: 900 },
      { pose: llMid, ms: 400 }, { pose: llLeft, ms: 1500 }, { pose: llLeft, ms: 300 }, { pose: llMid, ms: 900 },
    ],
  },
  'bulgarian-split-squat': {
    keyFrame: 2,
    frames: [{ pose: bssUp, ms: 500 }, { pose: bssUp, ms: 2000 }, { pose: bssDown, ms: 300 }, { pose: bssDown, ms: 1200 }],
  },

  'db-bridge': {
    keyFrame: 1,
    frames: [{ pose: wbDown, ms: 1000 }, { pose: wbUp, ms: 1400 }, { pose: wbUp, ms: 1300 }, { pose: wbDown, ms: 500 }],
  },
  'db-calf-raise': {
    keyFrame: 2,
    viewBox: '0 -20 240 206',
    frames: [{ pose: dcDown, ms: 400 }, { pose: dcDown, ms: 900 }, { pose: dcUp, ms: 800 }, { pose: dcUp, ms: 2200 }],
  },
  'sumo-squat': {
    keyFrame: 2,
    frames: [{ pose: smUp, ms: 500 }, { pose: smUp, ms: 2000 }, { pose: smDown, ms: 300 }, { pose: smDown, ms: 1100 }],
  },
  'db-step-up': {
    keyFrame: 4,
    viewBox: '20 -36 230 222',
    frames: [
      { pose: dsu(su0), ms: 450 }, { pose: dsu(suLift), ms: 350 }, { pose: dsu(suPlant), ms: 450 },
      { pose: dsu(suPlant), ms: 650 }, { pose: dsu(suRise), ms: 450 }, { pose: dsu(suTop), ms: 600 },
      { pose: dsu(suTop), ms: 450 }, { pose: dsu(suBack), ms: 550 }, { pose: dsu(suDown), ms: 400 },
      { pose: dsu({ ...suLift, ankleN: [146, 130] }), ms: 400 },
    ],
  },
  'db-split-squat': {
    keyFrame: 2,
    frames: [{ pose: dssUp, ms: 500 }, { pose: dssUp, ms: 2000 }, { pose: dssDown, ms: 300 }, { pose: dssDown, ms: 1200 }],
  },
  'sl-rdl': {
    keyFrame: 2,
    frames: [{ pose: srStand, ms: 600 }, { pose: srStand, ms: 2000 }, { pose: srHinge, ms: 500 }, { pose: srHinge, ms: 1500 }],
  },
  'floor-press': {
    keyFrame: 0,
    frames: [{ pose: fpDown, ms: 600 }, { pose: fpUp, ms: 900 }, { pose: fpUp, ms: 2400 }],
  },
  'bent-over-row': {
    keyFrame: 2,
    frames: [{ pose: boDown, ms: 500 }, { pose: boDown, ms: 900 }, { pose: boUp, ms: 600 }, { pose: boUp, ms: 1600 }],
  },
  'farmer-carry': {
    keyFrame: 1,
    caption: 'Walking toward you',
    frames: [{ pose: fcMid, ms: 320 }, { pose: fcL, ms: 320 }, { pose: fcMid, ms: 320 }, { pose: fcR, ms: 320 }],
  },
  'db-dead-bug': {
    keyFrame: 1,
    frames: [{ pose: ddBase, ms: 1600 }, { pose: ddA, ms: 1800 }, { pose: ddBase, ms: 1600 }, { pose: ddB, ms: 1800 }],
  },
  'db-curl': {
    keyFrame: 1,
    frames: [{ pose: cuRest, ms: 900 }, { pose: cuN, ms: 2200 }, { pose: cuRest, ms: 900 }, { pose: cuF, ms: 2200 }],
  },
  'triceps-ext': {
    keyFrame: 1,
    frames: [{ pose: teUp, ms: 500 }, { pose: teUp, ms: 2200 }, { pose: teDown, ms: 300 }, { pose: teDown, ms: 1100 }],
  },
  'single-arm-press': {
    keyFrame: 2,
    viewBox: '0 -48 240 234',
    frames: [{ pose: opDown, ms: 500 }, { pose: opDown, ms: 1000 }, { pose: opUp, ms: 600 }, { pose: opUp, ms: 2000 }],
  },

  'sl-bridge': {
    keyFrame: 1,
    frames: [{ pose: slDown, ms: 1000 }, { pose: slUp, ms: 1300 }, { pose: slUp, ms: 1300 }, { pose: slDown, ms: 500 }],
  },
  'step-down': {
    keyFrame: 2,
    viewBox: '0 -36 240 222',
    frames: [{ pose: sdTop, ms: 500 }, { pose: sdTop, ms: 3000 }, { pose: sdLow, ms: 250 }, { pose: sdLow, ms: 1300 }],
  },
  'reverse-lunge': {
    keyFrame: 3,
    frames: [
      { pose: rlStand, ms: 450 }, { pose: rlLift, ms: 350 }, { pose: rlPlant, ms: 900 }, { pose: rlLow, ms: 300 },
      { pose: rlLow, ms: 900 }, { pose: rlPlant, ms: 350 }, { pose: rlLift, ms: 450 }, { pose: rlStand, ms: 500 },
    ],
  },
  'sl-calf-raise': {
    keyFrame: 2,
    viewBox: '0 -20 240 206',
    frames: [{ pose: slcDown, ms: 400 }, { pose: slcDown, ms: 900 }, { pose: slcUp, ms: 800 }, { pose: slcUp, ms: 2200 }],
  },
  'goblet-squat': {
    keyFrame: 2,
    frames: [{ pose: gsStand, ms: 600 }, { pose: gsStand, ms: 2400 }, { pose: gsSit, ms: 400 }, { pose: gsSit, ms: 1300 }],
  },
  'db-row': {
    keyFrame: 1,
    frames: [{ pose: drDown, ms: 500 }, { pose: drDown, ms: 900 }, { pose: drUp, ms: 500 }, { pose: drUp, ms: 1600 }],
  },
  'incline-pushup': {
    keyFrame: 2,
    frames: [{ pose: ipUp, ms: 500 }, { pose: ipUp, ms: 1800 }, { pose: ipDown, ms: 300 }, { pose: ipDown, ms: 1100 }],
  },
  'suitcase-carry': {
    keyFrame: 1,
    caption: 'Walking toward you',
    frames: [{ pose: scMid, ms: 320 }, { pose: scL, ms: 320 }, { pose: scMid, ms: 320 }, { pose: scR, ms: 320 }],
  },

  'cat-cow': {
    keyFrame: 1,
    frames: [{ pose: ccNeutral, ms: 1400 }, { pose: ccCat, ms: 900 }, { pose: ccCat, ms: 2200 }, { pose: ccCow, ms: 900 }, { pose: ccCow, ms: 1400 }],
  },
  'bird-dog': {
    keyFrame: 1,
    frames: [{ pose: bdQuad, ms: 1400 }, { pose: bdReach, ms: 1200 }, { pose: bdReach, ms: 1400 }],
  },
  'bw-squat': {
    keyFrame: 2,
    frames: [{ pose: sqStand, ms: 500 }, { pose: sqStand, ms: 2000 }, { pose: sqDown, ms: 300 }, { pose: sqDown, ms: 1100 }],
  },
  'band-good-morning': {
    keyFrame: 2,
    frames: [{ pose: gmStand, ms: 500 }, { pose: gmStand, ms: 1800 }, { pose: gmHinge, ms: 400 }, { pose: gmHinge, ms: 1300 }],
  },
  rdl: {
    keyFrame: 2,
    frames: [{ pose: rdStand, ms: 500 }, { pose: rdStand, ms: 2200 }, { pose: rdHinge, ms: 400 }, { pose: rdHinge, ms: 1400 }],
  },
  'dead-bug': {
    keyFrame: 1,
    frames: [{ pose: dbBase, ms: 1600 }, { pose: dbA, ms: 1800 }, { pose: dbBase, ms: 1600 }, { pose: dbB, ms: 1800 }],
  },
  'band-pull-apart': {
    keyFrame: 1,
    frames: [{ pose: paIn, ms: 1000 }, { pose: paOut, ms: 600 }, { pose: paOut, ms: 1500 }],
  },
  'band-row': {
    keyFrame: 1,
    frames: [{ pose: rwOut, ms: 1000 }, { pose: rwIn, ms: 700 }, { pose: rwIn, ms: 1800 }],
  },
  'wall-pushup': {
    keyFrame: 2,
    frames: [{ pose: wpOut, ms: 500 }, { pose: wpOut, ms: 1800 }, { pose: wpIn, ms: 300 }, { pose: wpIn, ms: 1100 }],
  },
  'open-book': {
    keyFrame: 3,
    floor: false,
    caption: 'Seen from above',
    viewBox: '0 40 240 156',
    frames: [
      { pose: obStart, ms: 700 }, { pose: obUp, ms: 600 }, { pose: obOverUp, ms: 1200 }, { pose: obOpen, ms: 1500 },
      { pose: obOpen, ms: 1200 }, { pose: obOverUp, ms: 600 }, { pose: obUp, ms: 1200 },
    ],
  },

  'ankle-circles': {
    keyFrame: 1,
    frames: [{ pose: acA, ms: 600 }, { pose: acB, ms: 600 }, { pose: acC, ms: 600 }, { pose: acD, ms: 600 }],
  },
  'calf-raise': {
    keyFrame: 2,
    viewBox: '0 -20 240 206',
    frames: [{ pose: crDown, ms: 400 }, { pose: crDown, ms: 900 }, { pose: crUp, ms: 800 }, { pose: crUp, ms: 2200 }],
  },
  'split-squat': {
    keyFrame: 2,
    frames: [{ pose: ssUp, ms: 500 }, { pose: ssUp, ms: 2000 }, { pose: ssDown, ms: 300 }, { pose: ssDown, ms: 1200 }],
  },
  'wall-sit': {
    keyFrame: 2,
    frames: [{ pose: wsUp, ms: 600 }, { pose: wsUp, ms: 1800 }, { pose: wsDown, ms: 3000 }, { pose: wsDown, ms: 1500 }],
  },
  'sl-balance': {
    keyFrame: 0,
    frames: [{ pose: sb0, ms: 1400 }, { pose: sb1, ms: 1200 }, { pose: sb2, ms: 1300 }],
  },
  'ankle-rocks': {
    keyFrame: 2,
    frames: [{ pose: arBack, ms: 300 }, { pose: arBack, ms: 1200 }, { pose: arFwd, ms: 300 }, { pose: arFwd, ms: 1100 }],
  },
  'hip-circles': {
    keyFrame: 1,
    frames: [{ pose: hc0, ms: 800 }, { pose: hcFront, ms: 700 }, { pose: hcSide, ms: 700 }, { pose: hcBack, ms: 600 }],
  },
  'calf-stretch': {
    keyFrame: 1,
    frames: [{ pose: csUp, ms: 1200 }, { pose: csLean, ms: 2400 }, { pose: csLean, ms: 900 }, { pose: csBend, ms: 2400 }, { pose: csBend, ms: 1200 }],
  },
  'hip-flexor-stretch': {
    keyFrame: 1,
    frames: [{ pose: hf0, ms: 1500 }, { pose: hfFwd, ms: 2800 }, { pose: hfFwd, ms: 1500 }],
  },
  'hamstring-band': {
    keyFrame: 1,
    frames: [{ pose: hsDown, ms: 1800 }, { pose: hsUp, ms: 3000 }, { pose: hsUp, ms: 1600 }],
  },
  'shoulder-circles': {
    keyFrame: 1,
    frames: [{ pose: sr0, ms: 500 }, { pose: srUp, ms: 500 }, { pose: srBackP, ms: 500 }, { pose: srDownP, ms: 500 }],
  },
  'band-side-steps': {
    keyFrame: 1,
    frames: [
      { pose: bsA, ms: 450 }, { pose: bsB, ms: 300 }, { pose: bsC, ms: 450 }, { pose: bsD, ms: 300 },
      { pose: bsE, ms: 450 }, { pose: bsD, ms: 300 }, { pose: bsC, ms: 450 }, { pose: bsB, ms: 300 },
    ],
  },
  'leg-swings': {
    keyFrame: 2,
    frames: [{ pose: lsMid, ms: 500 }, { pose: lsAcross, ms: 650 }, { pose: lsOut, ms: 650 }],
  },

  'sit-to-stand': {
    keyFrame: 2,
    frames: [
      { pose: stsStand, ms: 700 }, { pose: stsStand, ms: 2600 },
      { pose: stsSit, ms: 400 }, { pose: stsSit, ms: 1300 },
    ],
  },
  'glute-bridge': {
    keyFrame: 1,
    frames: [
      { pose: brDown, ms: 1000 }, { pose: brUp, ms: 1400 },
      { pose: brUp, ms: 1300 }, { pose: brDown, ms: 500 },
    ],
  },
  'hinge-drill': {
    keyFrame: 2,
    frames: [
      { pose: hgStand, ms: 600 }, { pose: hgStand, ms: 1600 },
      { pose: hgHinge, ms: 500 }, { pose: hgHinge, ms: 1300 },
    ],
  },
  'step-up': {
    keyFrame: 4,
    viewBox: '20 -36 230 222',
    frames: [
      { pose: su0, ms: 450 }, { pose: suLift, ms: 350 }, { pose: suPlant, ms: 450 },
      { pose: suPlant, ms: 650 }, { pose: suRise, ms: 450 }, { pose: suTop, ms: 600 },
      { pose: suTop, ms: 450 }, { pose: suBack, ms: 550 }, { pose: suDown, ms: 400 },
      { pose: { ...suLift, ankleN: [146, 130] }, ms: 400 },
    ],
  },
};
