// Post-session feedback, also used for logging an activity by hand.

import { esc, seg, openSheet, closeSheet, sheetEl } from './ui.js';
import { SYMPTOM } from './engine.js';
import { STOP_SIGNS, SEEK_ADVICE } from './data/program.js';

const DIFFICULTY = [
  { v: 'easy', label: 'Easy' }, { v: 'right', label: 'Fine' },
  { v: 'hard', label: 'Hard' }, { v: 'too-hard', label: 'Too hard' },
];
const AFTER = [{ v: 'better', label: 'Better' }, { v: 'same', label: 'Same' }, { v: 'worse', label: 'Worse' }];
const TYPES = [
  { v: 'walk', label: 'Walk' }, { v: 'run', label: 'Run' }, { v: 'hike', label: 'Hike' },
  { v: 'strength', label: 'Strength' }, { v: 'other', label: 'Other' },
];
export const RPE = { easy: 3, right: 5, hard: 7, 'too-hard': 9 };

// opts: { heading, type, minutes, askMinutes, askDistance, askType, onSave(result) }
export function openFeedback(opts) {
  const draft = {
    type: opts.type || 'walk',
    minutes: opts.minutes ?? '',
    distanceKm: '',
    difficulty: null, knee: null, ribs: null, after: null,
  };
  const sym = SYMPTOM.map((s) => ({ v: s.v, label: s.label }));

  function render() {
    const showDistance = opts.askDistance || ['walk', 'run', 'hike'].includes(draft.type) && opts.askType;
    const ready = draft.difficulty && draft.knee != null && draft.ribs != null && draft.after
      && (!opts.askMinutes || Number(draft.minutes) > 0);
    const el = sheetEl();
    const html = `
      <form class="stack" data-fb>
        <h2>${esc(opts.heading || 'How did it go?')}</h2>
        ${opts.askType ? `<div><span class="field-label">Activity</span>${seg('type', TYPES, draft.type)}</div>` : ''}
        ${opts.askMinutes ? `<div class="row-between" style="gap:10px">
            <label style="flex:1"><span class="field-label">Minutes</span><input class="input" name="minutes" inputmode="numeric" pattern="[0-9]*" value="${esc(draft.minutes)}" placeholder="e.g. 30"></label>
            ${showDistance ? `<label style="flex:1"><span class="field-label">Distance (km)</span><input class="input" name="distanceKm" inputmode="decimal" value="${esc(draft.distanceKm)}" placeholder="optional"></label>` : ''}
          </div>` : ''}
        <div><span class="field-label">How hard was it?</span>${seg('difficulty', DIFFICULTY, draft.difficulty)}</div>
        <div><span class="field-label">Knee, during or after</span>${seg('knee', sym, draft.knee)}</div>
        <div><span class="field-label">Ribs, during or after</span>${seg('ribs', sym, draft.ribs)}</div>
        <div><span class="field-label">How do you feel now?</span>${seg('after', AFTER, draft.after)}</div>
        <button class="btn btn-primary btn-block" type="submit" ${ready ? '' : 'disabled'}>Save</button>
        <button class="btn btn-plain" type="button" data-action="close-sheet">Cancel</button>
      </form>`;
    if (el) {
      const scroll = el.scrollTop;
      el.innerHTML = `<div class="grabber"></div>${html}`;
      el.scrollTop = scroll;
    }
  }

  openSheet('');
  render();
  const el = sheetEl();
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-seg]');
    if (!b) return;
    const k = b.dataset.seg;
    const v = b.dataset.value;
    draft[k] = ['knee', 'ribs'].includes(k) ? Number(v) : v;
    render();
  });
  el.addEventListener('input', (e) => {
    if (e.target.name) draft[e.target.name] = e.target.value;
    const btn = el.querySelector('button[type=submit]');
    const ready = draft.difficulty && draft.knee != null && draft.ribs != null && draft.after
      && (!opts.askMinutes || Number(draft.minutes) > 0);
    btn.disabled = !ready;
  });
  el.addEventListener('submit', (e) => {
    e.preventDefault();
    const result = {
      type: draft.type,
      minutes: Number(draft.minutes) || opts.minutes || 0,
      distanceKm: draft.distanceKm ? Number(String(draft.distanceKm).replace(',', '.')) || null : null,
      feedback: {
        difficulty: draft.difficulty, rpe: RPE[draft.difficulty],
        knee: draft.knee, ribs: draft.ribs, after: draft.after,
      },
    };
    closeSheet();
    opts.onSave(result);
    if (result.feedback.knee >= 7 || result.feedback.ribs >= 7) showSafety(true);
  });
}

export function showSafety(afterSession = false) {
  openSheet(`<div class="stack">
    <h2>${afterSession ? 'That sounds painful' : 'When to stop'}</h2>
    ${afterSession ? '<p>Strong discomfort is a signal to back off. Tomorrow’s recommendation will be gentle. If it does not settle, get it checked.</p>' : ''}
    <div class="stack-s"><h3>Stop the exercise if you notice</h3>
      <ul class="bullets">${STOP_SIGNS.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>
    <div class="stack-s"><h3>Get medical advice</h3>
      <ul class="bullets">${SEEK_ADVICE.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>
    <p class="note">This app does not diagnose injuries. It is a training log with conservative rules, not medical advice.</p>
    <button class="btn btn-secondary btn-block" data-action="close-sheet">Close</button>
  </div>`);
}
