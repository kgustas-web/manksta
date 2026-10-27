// Programme content: morning routine, workout templates, phases, weekly patterns,
// hiking milestones and safety copy. Logic that uses it lives in engine.js.

// Morning routine. Items are skipped when today's limits exclude them (open-book
// only appears once the ribs allow it).
export const MORNING_ROUTINE = [
  { id: 'ankle-rocks' },
  { id: 'hip-circles' },
  { id: 'leg-swings' },
  { id: 'calf-stretch' },
  { id: 'hip-flexor-stretch' },
  { id: 'hamstring-band' },
  { id: 'cat-cow' },
  { id: 'open-book' },
  { id: 'shoulder-circles' },
];

// Strength templates. Slot keys are movement families shared across workouts, so
// progress on "squat" carries from A to C. Options run easiest → hardest; the
// builder uses your saved level for the family and steps down to the nearest
// option today's limits allow. Slots are in priority order: short sessions take
// the first few that fit. Workouts rotate A → B → C.
export const WORKOUTS = {
  A: {
    title: 'Legs and back',
    warmup: ['hip-circles', 'leg-swings', 'ankle-rocks'],
    slots: [
      { key: 'squat', label: 'Squat', options: ['sit-to-stand', 'bw-squat', 'goblet-squat', 'sumo-squat'] },
      { key: 'hinge', label: 'Hip hinge', options: ['hinge-drill', 'band-good-morning', 'rdl', 'sl-rdl'] },
      { key: 'pull', label: 'Upper back', options: ['band-pull-apart', 'band-row', 'db-row', 'bent-over-row', 'table-row'] },
      { key: 'step', label: 'Step', options: ['step-up', 'db-step-up'] },
      { key: 'calf', label: 'Calves', options: ['calf-raise', 'db-calf-raise', 'sl-calf-raise'] },
      { key: 'balance', label: 'Balance', options: ['sl-balance'] },
      { key: 'core', label: 'Core', options: ['dead-bug', 'bird-dog', 'db-dead-bug', 'plank', 'side-plank'] },
      { key: 'backext', label: 'Back extension', options: ['superman'] },
      { key: 'carry', label: 'Carry', options: ['farmer-carry', 'suitcase-carry'] },
      { key: 'biceps', label: 'Biceps', options: ['db-curl'] },
    ],
  },
  B: {
    title: 'Hips, knees and chest',
    altTitle: 'Hips and knees',
    warmup: ['ankle-circles', 'hip-circles', 'leg-swings'],
    slots: [
      { key: 'bridge', label: 'Bridge', options: ['glute-bridge', 'db-bridge', 'sl-bridge'] },
      { key: 'split', label: 'Single leg', options: ['split-squat', 'reverse-lunge', 'db-split-squat', 'bulgarian-split-squat'] },
      { key: 'push', label: 'Push', options: ['wall-pushup', 'incline-pushup', 'knee-pushup', 'floor-press', 'pushup'] },
      { key: 'hip', label: 'Side hip', options: ['band-side-steps', 'lateral-lunge'] },
      { key: 'wall', label: 'Hold', options: ['wall-sit'] },
      { key: 'stepdown', label: 'Step-down', options: ['step-down'] },
      { key: 'balance', label: 'Balance', options: ['sl-balance'] },
      { key: 'core', label: 'Core', options: ['dead-bug', 'bird-dog', 'db-dead-bug', 'plank', 'side-plank'] },
      { key: 'triceps', label: 'Triceps', options: ['triceps-ext', 'chair-dip'] },
    ],
  },
  // Upper-body day once the ribs allow it; until then the upper slots are skipped
  // and the session is the leg slots further down (shown with altTitle).
  C: {
    title: 'Upper body and core',
    altTitle: 'Strength and stability',
    warmup: ['leg-swings', 'ankle-rocks', 'shoulder-circles'],
    slots: [
      { key: 'split', label: 'Single leg', options: ['split-squat', 'reverse-lunge', 'db-split-squat', 'bulgarian-split-squat'] },
      { key: 'push', label: 'Push', options: ['wall-pushup', 'incline-pushup', 'knee-pushup', 'floor-press', 'pushup'] },
      { key: 'pull', label: 'Upper back', options: ['band-pull-apart', 'band-row', 'db-row', 'bent-over-row', 'table-row'] },
      { key: 'press', label: 'Overhead', options: ['single-arm-press', 'pike-pushup'] },
      { key: 'core', label: 'Core', options: ['dead-bug', 'bird-dog', 'db-dead-bug', 'plank', 'side-plank'] },
      { key: 'biceps', label: 'Biceps', options: ['db-curl'] },
      { key: 'triceps', label: 'Triceps', options: ['triceps-ext', 'chair-dip'] },
      { key: 'hinge', label: 'Hip hinge', options: ['hinge-drill', 'band-good-morning', 'rdl', 'sl-rdl'] },
      { key: 'squat', label: 'Squat', options: ['sit-to-stand', 'bw-squat', 'goblet-squat', 'sumo-squat'] },
      { key: 'hip', label: 'Side hip', options: ['band-side-steps', 'lateral-lunge'] },
      { key: 'calf', label: 'Calves', options: ['calf-raise', 'db-calf-raise', 'sl-calf-raise'] },
      { key: 'bridge', label: 'Bridge', options: ['glute-bridge', 'db-bridge', 'sl-bridge'] },
      { key: 'balance', label: 'Balance', options: ['sl-balance'] },
    ],
  },
};
export const UPPER_SLOTS = new Set(['push', 'pull', 'press', 'core', 'biceps', 'triceps', 'carry', 'backext']);
export const WORKOUT_ORDER = ['A', 'B', 'C'];

// Four-week dose cycle inside each phase. Exercise variations step up separately,
// when you have done the current one well a few times (engine.js applyProgression).
export const DOSE_CYCLE = [
  { sets: 2, reps: 0, secs: 0, label: 'Base week', note: 'Learn the movements at an easy effort.' },
  { sets: 2, reps: 2, secs: 10, label: 'More reps', note: 'Two more reps per set (or 10 s longer holds) than last week.' },
  { sets: 3, reps: 0, secs: 0, label: 'Extra set', note: 'A third set on each exercise.' },
  { sets: 2, reps: 0, secs: 0, label: 'Lighter week', note: 'Back to two sets so your body can absorb the last three weeks.' },
];

// Easy, conversational-pace walking, in minutes, by phase.
export const WALK_MINUTES = { 1: [20, 30], 2: [30, 45], 3: [40, 60], 4: [45, 75] };
export const LONG_WALK_MINUTES = { 1: 40, 2: 60, 3: 90, 4: 150 };

// Weekly pattern by phase, indexed by JS weekday (0 = Sunday).
// Types: strength | walk | long | rest
export const WEEK_PATTERN = {
  1: ['rest', 'strength', 'walk', 'walk', 'strength', 'walk', 'long'],
  2: ['rest', 'strength', 'walk', 'strength', 'walk', 'walk', 'long'],
  3: ['walk', 'strength', 'walk', 'strength', 'walk', 'rest', 'long'],
  4: ['long', 'strength', 'walk', 'strength', 'walk', 'rest', 'long'],
};

export const PLAN_TYPES = {
  strength: { label: 'Strength', short: 'Strength' },
  walk: { label: 'Walk', short: 'Walk' },
  long: { label: 'Longer outdoor walk', short: 'Long walk' },
  rest: { label: 'Rest or easy movement', short: 'Rest' },
};

export const PHASES = [
  {
    n: 1, name: 'Rebuild the foundation', months: 'About months 1–2',
    focus: ['A daily morning routine', 'Comfortable walking most days', 'Two short strength sessions a week', 'Learning what your knee and ribs tolerate'],
    next: [
      { key: 'weeks3', label: 'At least 3 weeks in this phase' },
      { key: 'strength8', label: '8 or more strength sessions' },
      { key: 'mobility15', label: 'Morning mobility on 15 of the last 21 days' },
      { key: 'walk30', label: 'A 30-minute walk with knee discomfort at mild or less' },
      { key: 'symptoms', label: 'Knee and ribs mostly none or mild over the last 2 weeks' },
      { key: 'ribsCleared', label: 'Ribs cleared for exercise (update in Settings → Safety check)' },
    ],
  },
  {
    n: 2, name: 'Develop strength and aerobic fitness', months: 'About months 2–3',
    focus: ['Harder strength variations', 'Longer walks', 'Balance work', 'Walk–run intervals when your knee allows'],
    next: [
      { key: 'weeks4', label: 'At least 4 weeks in this phase' },
      { key: 'walk60', label: 'A 60-minute walk that felt comfortable' },
      { key: 'symptoms', label: 'Knee and ribs mostly none or mild over the last 2 weeks' },
    ],
  },
  {
    n: 3, name: 'Build endurance and capacity', months: 'About months 4–5',
    focus: ['Longer continuous running', 'Demanding single-leg strength', 'Long outdoor walks with stairs or hills'],
    next: [
      { key: 'weeks6', label: 'At least 6 weeks in this phase' },
      { key: 'walk90', label: 'A 90-minute walk that felt comfortable' },
      { key: 'symptoms', label: 'Knee and ribs mostly none or mild over the last 2 weeks' },
    ],
  },
  {
    n: 4, name: 'Prepare for the mountains', months: 'About month 6, until the trip',
    focus: ['Long hikes with a pack', 'Stairs and hills', 'Back-to-back activity days', 'Managing fatigue'],
    next: [],
  },
];

// Hiking milestones, roughly in order. Ticked by hand in Progress.
export const HIKING_MILESTONES = [
  { id: 'walk30', label: 'Walk 30 minutes on flat ground comfortably' },
  { id: 'walk60', label: 'Walk 60 minutes comfortably' },
  { id: 'stairsUp', label: 'Climb 10 flights of stairs without stopping, knee mild or less' },
  { id: 'stairsDown', label: 'Walk down 10 flights of stairs, knee mild or less' },
  { id: 'walk90hills', label: '90-minute walk including hills or stairs' },
  { id: 'pack5', label: '60-minute walk with a 5 kg backpack' },
  { id: 'twoDays', label: 'Two long walks on consecutive days, recovered on day three' },
  { id: 'hike4h', label: '3–4 hour walk with a 6–8 kg pack' },
  { id: 'threeDays', label: 'Three consecutive days of long walks' },
];

export const FLAT_TERRAIN_TIPS = [
  'Stairwells in tall buildings or car parks stand in for climbs. Walk down slowly; descents train the knees as much as climbs.',
  'Treadmill on incline (8–12%) if you have gym access, even occasionally.',
  'Bridges, embankments, dunes and park slopes: short repeats add up.',
  'Step-ups and step-downs at home cover the muscles that hills use.',
  'Wear the backpack you will hike with on ordinary walks, starting light.',
];

// Safety copy. Phrased as guidance, not diagnosis.
export const STOP_SIGNS = [
  'Chest pain, pressure or tightness',
  'Unusual shortness of breath, dizziness or feeling faint',
  'Sharp or stabbing rib pain, or pain on breathing in that is getting worse',
  'Knee pain that is sharp, builds through a set, or makes you limp',
  'The knee giving way, locking or catching',
  'New swelling, numbness or tingling',
];

export const SEEK_ADVICE = [
  'Any chest pain, fainting or breathlessness that does not settle quickly with rest: seek urgent medical help.',
  'Rib pain that is getting worse, a new cough, coughing blood or fever: contact a doctor.',
  'Knee swelling, locking, giving way, or pain that is worse the next morning for several days: see a doctor or physiotherapist.',
  'Pain that has not settled after two weeks of easier training.',
];

export const PAIN_GUIDE =
  'A common rule of thumb for an irritable knee: discomfort up to "mild" during exercise is usually acceptable if it settles within 24 hours and is not worse the next morning. For the ribs, be stricter: stop anything that causes sharp pain. If a doctor or physiotherapist has given you different advice, follow theirs.';
