// Anatomical muscle map: a soft front and back figure with defined muscle shapes.
// Shapes are point lists for the figure's left half (x < 100), mirrored for the
// right half and smoothed into closed curves.

export const REGION_NAMES = {
  quads: 'Quads', hamstrings: 'Hamstrings', glutes: 'Glutes', gluteMed: 'Side hip',
  calves: 'Calves', shins: 'Shins', hipFlexors: 'Hip flexors', adductors: 'Inner thigh',
  core: 'Abs', obliques: 'Obliques', lowerBack: 'Lower back', upperBack: 'Upper back',
  lats: 'Lats', chest: 'Chest', shoulders: 'Shoulders', triceps: 'Triceps',
  biceps: 'Biceps', forearms: 'Forearms',
};

// Body areas for filtering the library; an exercise belongs to an area when one of
// its primary muscles is in it.
export const AREAS = [
  { key: 'legs', label: 'Legs', regions: ['quads', 'hamstrings', 'calves', 'shins', 'adductors'] },
  { key: 'hips', label: 'Hips & glutes', regions: ['glutes', 'gluteMed', 'hipFlexors'] },
  { key: 'core', label: 'Core', regions: ['core', 'obliques', 'lowerBack'] },
  { key: 'back', label: 'Back', regions: ['upperBack', 'lats', 'lowerBack'] },
  { key: 'chest', label: 'Chest', regions: ['chest'] },
  { key: 'shoulders', label: 'Shoulders', regions: ['shoulders'] },
  { key: 'arms', label: 'Arms', regions: ['biceps', 'triceps', 'forearms'] },
];
export const inArea = (ex, key) => !key || AREAS.find((a) => a.key === key).regions.some((r) => ex.muscles.primary.includes(r));

const mx = ([x, y]) => [200 - x, y];

// Closed Catmull-Rom spline → cubic Bézier path.
function smooth(pts, t = 0.9) {
  const n = pts.length;
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + ((p2[0] - p0[0]) / 6) * t, p1[1] + ((p2[1] - p0[1]) / 6) * t];
    const c2 = [p2[0] - ((p3[0] - p1[0]) / 6) * t, p2[1] - ((p3[1] - p1[1]) / 6) * t];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return `${d}Z`;
}

// Left-half outline from the neck down to the crotch; mirrored to close the body.
const OUTLINE = [
  [88, 74], [74, 79], [60, 85], [51, 96], [47, 112], [45, 132], [42, 152], [38, 172], [34, 194], [31, 214],
  [29, 232], [28, 244], [32, 252], [38, 250], [41, 238], [44, 222], [48, 202], [52, 184], [56, 166], [59, 148],
  [63, 130], [67, 124], [70, 142], [72, 162], [72, 180], [68, 198], [64, 218], [63, 244], [66, 270], [70, 292],
  [68, 314], [70, 338], [74, 362], [75, 376], [70, 386], [80, 391], [92, 390], [93, 378], [91, 360], [92, 336],
  [94, 312], [93, 294], [96, 270], [98, 244], [100, 228],
];
const bodyPath = smooth([...OUTLINE, ...OUTLINE.slice(0, -1).reverse().map(mx)], 0.75);

const pair = (region, pts) => [[region, pts], [region, pts.map(mx)]];
const sym = (region, half) => [[region, [...half, ...half.slice(1, -1).reverse().map(mx)]]];
const box = (region, x, y, w, h) => pair(region, [[x, y + 2], [x + 2, y], [x + w - 2, y], [x + w, y + 2], [x + w, y + h - 2], [x + w - 2, y + h], [x + 2, y + h], [x, y + h - 2]]);

const FRONT = [
  ...pair('upperBack', [[89, 72], [80, 79], [72, 84], [88, 85]]),
  ...pair('chest', [[98, 92], [86, 87], [72, 89], [65, 100], [67, 113], [79, 120], [92, 120], [98, 114]]),
  ...pair('shoulders', [[69, 84], [57, 89], [50, 102], [49, 120], [55, 125], [62, 116], [66, 100]]),
  ...pair('biceps', [[51, 129], [47, 143], [47, 158], [52, 164], [58, 152], [60, 136], [57, 127]]),
  ...pair('forearms', [[45, 169], [39, 186], [36, 205], [39, 213], [45, 204], [50, 188], [53, 172], [49, 166]]),
  ...box('core', 88.5, 124, 10.5, 13), ...box('core', 88.5, 140, 10.5, 13), ...box('core', 88.5, 156, 10.5, 13),
  ...pair('core', [[88.5, 172], [99, 172], [99, 204], [93, 199], [89, 186]]),
  ...pair('obliques', [[71, 125], [85, 126], [87, 150], [87, 177], [79, 189], [72, 172], [70.5, 148]]),
  ...pair('gluteMed', [[67, 191], [72, 189], [74, 203], [69, 213], [65, 205]]),
  ...pair('hipFlexors', [[78, 192], [88, 200], [95, 214], [91, 222], [82, 211]]),
  ...pair('quads', [[68, 206], [80, 207], [89, 228], [90, 254], [88, 277], [82, 290], [72, 286], [66, 262], [64.5, 234]]),
  ...pair('adductors', [[92, 230], [98.5, 235], [98, 260], [94, 266], [90.5, 250]]),
  ...pair('shins', [[77, 300], [84, 298], [87, 320], [85, 346], [80, 362], [76, 344], [74.5, 320]]),
  ...pair('calves', [[70.5, 303], [73, 301], [73.5, 330], [71, 339], [69.5, 320]]),
];

const BACK = [
  ...sym('upperBack', [[100, 64], [92, 70], [77, 81], [69, 89], [80, 96], [89, 107], [95, 121], [100, 132]]),
  ...pair('shoulders', [[69, 85], [57, 89], [50, 102], [49, 120], [55, 125], [62, 114], [70, 97]]),
  ...pair('triceps', [[51, 128], [47, 143], [47, 158], [52, 164], [58, 152], [60, 136], [57, 126]]),
  ...pair('forearms', [[45, 169], [39, 186], [36, 205], [39, 213], [45, 204], [50, 188], [53, 172], [49, 166]]),
  ...pair('lats', [[69, 98], [79, 103], [89, 120], [96, 142], [94, 162], [83, 162], [73, 140]]),
  ...sym('lowerBack', [[100, 138], [97, 142], [92, 160], [88, 186], [100, 192]]),
  ...pair('gluteMed', [[67, 188], [77, 184], [80, 196], [71, 204], [65, 200]]),
  ...pair('glutes', [[99, 197], [85, 195], [73, 203], [68, 220], [74, 236], [88, 240], [99, 234]]),
  ...pair('hamstrings', [[67, 244], [84, 243], [95, 250], [94, 278], [86, 292], [73, 288], [66, 265]]),
  ...pair('calves', [[73, 300], [84, 298], [92, 312], [90, 340], [82, 352], [75, 340], [71, 318]]),
];

function figure(shapes, primary, secondary, dx) {
  const head = `<ellipse class="bm-skin" cx="100" cy="38" rx="17" ry="22"/><path class="bm-skin" d="M90,52 L110,52 L113,78 L87,78 Z"/>`;
  const muscles = shapes.map(([region, pts]) => {
    const cls = primary.includes(region) ? 'bm-p' : secondary.includes(region) ? 'bm-s' : 'bm-m';
    return `<path class="${cls}" d="${smooth(pts)}"/>`;
  }).join('');
  return `<g transform="translate(${dx} 0)">${head}<path class="bm-skin" d="${bodyPath}"/>${muscles}</g>`;
}

export function bodyMap({ primary = [], secondary = [] }, { labels = true, size = '' } = {}) {
  const label = [...primary, ...secondary].map((k) => REGION_NAMES[k]).join(', ');
  return `<svg class="bodymap ${size}" viewBox="0 8 420 ${labels ? 404 : 388}" role="img" aria-label="Muscles worked: ${label}">
    ${figure(FRONT, primary, secondary, 0)}${figure(BACK, primary, secondary, 220)}
    ${labels ? '<text x="100" y="410" text-anchor="middle">Front</text><text x="320" y="410" text-anchor="middle">Back</text>' : ''}
  </svg>`;
}

// Union of muscles across a session's exercises (primary wins over secondary).
export function sessionMuscles(exercises) {
  const p = new Set(), s = new Set();
  exercises.forEach((e) => { e.muscles.primary.forEach((m) => p.add(m)); e.muscles.secondary.forEach((m) => s.add(m)); });
  return { primary: [...p], secondary: [...s].filter((m) => !p.has(m)) };
}
