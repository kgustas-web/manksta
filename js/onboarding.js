// First-run safety check and assessment. Re-runnable from Settings; answers drive
// the engine's limits (engine.js computeLimits, ribStatus, walkMinutes).

import { esc, seg } from './ui.js';
import { icon } from './ui.js';
import { dateKey, ribStatus } from './engine.js';

export const HARD_STOPS = [
  { v: 'chest', label: 'Chest pain or pressure, at rest or when active' },
  { v: 'faint', label: 'Dizziness or fainting when active' },
  { v: 'breath', label: 'Shortness of breath out of proportion to effort' },
  { v: 'doctor', label: 'A doctor has told you not to exercise for now' },
  { v: 'ribsWorse', label: 'Rib pain that is getting worse, a new cough, coughing blood, or fever' },
  { v: 'kneeHot', label: 'A hot, very swollen knee, or one you cannot put weight on' },
];

const RIB_PAIN = [
  { v: 'breathing', label: 'Breathing in deeply' },
  { v: 'cough', label: 'Coughing or sneezing' },
  { v: 'twist', label: 'Twisting or reaching' },
  { v: 'side', label: 'Lying on that side' },
  { v: 'lift', label: 'Lifting or carrying' },
];
const KNEE_WHEN = [
  { v: 'stairsDown', label: 'Going down stairs' },
  { v: 'stairsUp', label: 'Going up stairs' },
  { v: 'squat', label: 'Squatting or kneeling' },
  { v: 'running', label: 'Running' },
  { v: 'sitting', label: 'After sitting a long time' },
];

const STEPS = ['welcome', 'stops', 'ribs', 'knee', 'capacity', 'summary'];

export function createOnboarding(existing) {
  const a = existing?.assessment;
  return {
    step: 0,
    d: {
      hardStops: a?.hardStops ? [...a.hardStops] : [],
      ribs: { weeksAgo: a?.ribs?.weeksAgo ?? null, clearance: a?.ribs?.clearance ?? null, painWith: a?.ribs?.painWith ? [...a.ribs.painWith] : [] },
      knee: {
        side: a?.knee?.side ?? null, level: a?.knee?.level ?? null, when: a?.knee?.when ? [...a.knee.when] : [],
        swelling: a?.knee?.swelling ?? null, instability: a?.knee?.instability ?? null,
      },
      capacity: { walk: a?.capacity?.walk ?? null, sitToStand: a?.capacity?.sitToStand ?? null, steps: a?.capacity?.steps ?? null, running: a?.capacity?.running ?? null },
    },
  };
}

function multi(name, options, values) {
  return `<div class="stack-s">${options.map((o) => {
    const on = values.includes(o.v);
    return `<button type="button" class="option" data-multi="${name}" data-value="${o.v}" aria-pressed="${on}">
      <span class="check ${on ? 'on' : ''}">${on ? icon.check : ''}</span><span>${esc(o.label)}</span></button>`;
  }).join('')}</div>`;
}
function single(name, options, value) {
  return `<div class="stack-s">${options.map((o) => {
    const on = value === o.v;
    return `<button type="button" class="option" data-seg="${name}" data-value="${o.v}" aria-pressed="${on}">
      <span class="check ${on ? 'on' : ''}">${on ? icon.check : ''}</span><span>${esc(o.label)}</span></button>`;
  }).join('')}</div>`;
}
const YESNO = [{ v: 'no', label: 'No' }, { v: 'yes', label: 'Yes' }];
const yn = (b) => (b == null ? null : b ? 'yes' : 'no');

function canContinue(ob) {
  const { d } = ob;
  switch (STEPS[ob.step]) {
    case 'ribs': return d.ribs.weeksAgo && d.ribs.clearance;
    case 'knee': return d.knee.level != null && d.knee.swelling != null && d.knee.instability != null;
    case 'capacity': return d.capacity.walk && d.capacity.sitToStand && d.capacity.steps;
    default: return true;
  }
}

export const STEP_TARGETS = { '<4k': 6000, '4-7k': 7500, '7-10k': 9000, '10k+': 10000 };

export function renderOnboarding(ob, { isRedo }) {
  const { d } = ob;
  const name = STEPS[ob.step];
  const bars = STEPS.map((_, i) => `<span class="${i <= ob.step ? 'on' : ''}"></span>`).join('');
  let body = '';

  if (name === 'welcome') {
    body = `<div class="stack">
      <h1>${isRedo ? 'Safety check' : 'Hello'}</h1>
      <p>${isRedo ? 'Update your answers whenever something changes. Your history is kept.' : 'This app is a personal training log that suggests what to do each day: gentle, steady progress toward running again and a hut-to-hut trip next summer.'}</p>
      <p>A few questions first, about your ribs, your knee and what feels comfortable right now. The answers decide which exercises the app is allowed to suggest.</p>
      <div class="banner warn"><strong>Not medical advice.</strong> The app does not diagnose anything. If a doctor or physiotherapist has given you instructions, follow theirs.</div>
      <p class="note">Your answers stay on this device. You can skip this and start with safe defaults: ribs treated as not yet cleared, knee treated as mildly sensitive.</p>
    </div>`;
  } else if (name === 'stops') {
    body = `<div class="stack">
      <h1>Anything that needs checking first?</h1>
      <p class="muted">Tick anything that applies to you right now.</p>
      ${multi('hardStops', HARD_STOPS, d.hardStops)}
      ${d.hardStops.length ? `<div class="banner danger"><strong>Please see a doctor before training.</strong> The app will hold exercise suggestions until you update these answers.</div>` : `<p class="note">If none apply, continue.</p>`}
    </div>`;
  } else if (name === 'ribs') {
    body = `<div class="stack">
      <h1>Your ribs</h1>
      <div class="ob-q"><span class="field-label">When was the injury?</span>
        ${seg('ribs.weeksAgo', [{ v: '<3', label: '< 3 wk' }, { v: '3-6', label: '3–6 wk' }, { v: '6-12', label: '6–12 wk' }, { v: '12+', label: '12+ wk' }], d.ribs.weeksAgo)}</div>
      <div class="ob-q"><span class="field-label">Has a doctor or physio cleared you to exercise?</span>
        ${single('ribs.clearance', [
          { v: 'full', label: 'Yes, with no limits' },
          { v: 'limits', label: 'Yes, with some limits' },
          { v: 'not-yet', label: 'Not yet' },
          { v: 'not-asked', label: 'I have not asked' },
        ], d.ribs.clearance)}</div>
      <div class="ob-q"><span class="field-label">Does it still hurt when…</span>
        ${multi('ribs.painWith', RIB_PAIN, d.ribs.painWith)}<p class="field-hint">Leave empty if none.</p></div>
      ${['not-yet', 'not-asked'].includes(d.ribs.clearance) ? '<div class="banner warn"><strong>Until you are cleared</strong>, the app sticks to walking, leg work and rib-safe mobility, with no loaded upper body, carries or direct core work. Asking at your next appointment is worth it.</div>' : ''}
    </div>`;
  } else if (name === 'knee') {
    body = `<div class="stack">
      <h1>Your knee</h1>
      <div class="ob-q"><span class="field-label">Which knee?</span>
        ${seg('knee.side', [{ v: 'left', label: 'Left' }, { v: 'right', label: 'Right' }, { v: 'both', label: 'Both' }], d.knee.side)}</div>
      <div class="ob-q"><span class="field-label">Usual discomfort day to day</span>
        ${seg('knee.level', [{ v: 0, label: 'None' }, { v: 2, label: 'Mild' }, { v: 4, label: 'Moderate' }, { v: 7, label: 'Strong' }], d.knee.level)}</div>
      <div class="ob-q"><span class="field-label">When does it bother you?</span>${multi('knee.when', KNEE_WHEN, d.knee.when)}</div>
      <div class="ob-q"><span class="field-label">Does it swell after activity?</span>${seg('knee.swelling', YESNO, yn(d.knee.swelling))}</div>
      <div class="ob-q"><span class="field-label">Does it give way, lock or catch?</span>${seg('knee.instability', YESNO, yn(d.knee.instability))}</div>
      ${d.knee.swelling || d.knee.instability ? '<div class="banner warn"><strong>Worth getting checked.</strong> Swelling or giving way are signs a physiotherapist should assess. Until then the app only offers low-knee-load exercises.</div>' : ''}
    </div>`;
  } else if (name === 'capacity') {
    body = `<div class="stack">
      <h1>Where you are now</h1>
      <div class="ob-q"><span class="field-label">How long can you walk comfortably today?</span>
        ${seg('capacity.walk', [{ v: '<10', label: '< 10 min' }, { v: '10-20', label: '10–20' }, { v: '20-40', label: '20–40' }, { v: '40+', label: '40+' }], d.capacity.walk)}</div>
      <div class="ob-q"><span class="field-label">Can you stand up from a chair without using your hands?</span>
        ${seg('capacity.sitToStand', [{ v: 'easy', label: 'Easily' }, { v: 'hands', label: 'With hands' }, { v: 'no', label: 'Not yet' }], d.capacity.sitToStand)}</div>
      <div class="ob-q"><span class="field-label">Usual daily steps lately</span>
        ${seg('capacity.steps', [{ v: '<4k', label: '< 4k' }, { v: '4-7k', label: '4–7k' }, { v: '7-10k', label: '7–10k' }, { v: '10k+', label: '10k+' }], d.capacity.steps)}
        <p class="field-hint">A rough guess is fine. Your phone’s Health app shows it.</p></div>
      <div class="ob-q"><span class="field-label">Any running in the last 3 months?</span>
        ${seg('capacity.running', [{ v: 'no', label: 'No' }, { v: 'some', label: 'A little' }], d.capacity.running)}</div>
    </div>`;
  } else {
    const status = ribStatus({ assessment: d });
    const target = STEP_TARGETS[d.capacity.steps] || 10000;
    const lines = [];
    if (d.hardStops.length) lines.push('<strong>Training is on hold</strong> until a doctor has checked what you ticked. You can still log steps.');
    lines.push('Every morning: a short check-in, a 7–9 minute mobility routine, and one suggestion for the day.');
    lines.push(status === 'protect' ? 'Ribs: rib-safe exercises only until you mark yourself as cleared.' : status === 'cleared' ? 'Ribs: moderate exercises allowed on days they feel fine; the hardest ones come later.' : 'Ribs: no restrictions, but the morning check-in can still dial things back.');
    lines.push(d.knee.swelling || d.knee.instability ? 'Knee: low-load exercises only until it is checked.' : 'Knee: exercise choice adjusts to how it feels each morning.');
    lines.push(`Steps: starting at ${target.toLocaleString('en-GB')} a day${target < 10000 ? ', rising toward 10,000 as it gets easy' : ''}. You can change this any time.`);
    lines.push('No running yet. Phase 1 builds walking and leg strength first. Running intervals come in phase 2, when your knee is ready.');
    body = `<div class="stack">
      <h1>Here’s the plan</h1>
      <ul class="reasons" style="font-size:16px;gap:10px">${lines.map((l) => `<li>${l}</li>`).join('')}</ul>
    </div>`;
  }

  const last = ob.step === STEPS.length - 1;
  return `<main class="screen no-tabs">
    <div class="ob-progress" aria-hidden="true">${bars}</div>
    ${body}
    <div class="ob-footer">
      ${ob.step > 0 ? '<button class="btn btn-secondary" data-ob="back">Back</button>' : isRedo ? '<button class="btn btn-secondary" data-ob="cancel">Cancel</button>' : '<button class="btn btn-secondary" data-ob="skip">Skip for now</button>'}
      <button class="btn btn-primary" data-ob="${last ? 'finish' : 'next'}" ${canContinue(ob) ? '' : 'disabled'}>${last ? (isRedo ? 'Save' : 'Start') : 'Continue'}</button>
    </div>
  </main>`;
}

// Apply a tapped answer to the draft. Returns true if handled.
export function handleOnboardingInput(ob, el) {
  const path = el.dataset.seg || el.dataset.multi;
  if (!path) return false;
  const [group, key] = path.includes('.') ? path.split('.') : [null, path];
  const target = group ? ob.d[group] : ob.d;
  let v = el.dataset.value;
  if (path === 'knee.level') v = Number(v);
  if (path === 'knee.swelling' || path === 'knee.instability') v = v === 'yes';
  if (el.dataset.multi) {
    const arr = target[key];
    const i = arr.indexOf(v);
    if (i >= 0) arr.splice(i, 1); else arr.push(v);
  } else {
    target[key] = v;
  }
  return true;
}

export function profileFromOnboarding(ob, existing) {
  const today = dateKey();
  return {
    createdAt: existing?.createdAt || today,
    phase: existing?.phase || 1,
    phaseStartedAt: existing?.phaseStartedAt || today,
    stepTarget: existing?.stepTarget || STEP_TARGETS[ob.d.capacity.steps] || 10000,
    tripDate: existing?.tripDate || '',
    assessment: { ...ob.d, updatedAt: today },
  };
}

// Conservative stand-in used when the safety check is skipped.
export function defaultProfile() {
  const today = dateKey();
  return {
    createdAt: today, phase: 1, phaseStartedAt: today, stepTarget: 7500, tripDate: '',
    assessment: {
      skipped: true, updatedAt: today, hardStops: [],
      ribs: { weeksAgo: null, clearance: 'not-yet', painWith: ['breathing'] },
      knee: { side: null, level: 2, when: [], swelling: false, instability: false },
      capacity: { walk: '20-40', sitToStand: 'easy', steps: '4-7k', running: 'no' },
    },
  };
}

export { STEPS as ONBOARDING_STEPS };
