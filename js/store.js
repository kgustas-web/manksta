// Local persistence. Everything lives in one localStorage key on this device;
// nothing is sent anywhere. Export/import moves it between devices or backs it up.

const KEY = 'coach.v1';
const listeners = new Set();

const empty = () => ({
  version: 1,
  profile: null,
  days: {},
  sessions: [],
  planOverrides: {},
  slotLevels: {},
  milestones: {},
  settings: { theme: 'system' },
});

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...empty(), ...JSON.parse(raw) } : empty();
  } catch {
    return empty();
  }
}

export function getState() {
  return state;
}

export function update(fn) {
  fn(state);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    alert('Could not save to this device’s storage. Export a backup from Settings.');
  }
  listeners.forEach((l) => l(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function day(key) {
  if (!state.days[key]) state.days[key] = {};
  return state.days[key];
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function exportJSON() {
  return JSON.stringify({ app: 'personal-coach', exportedAt: new Date().toISOString(), data: state }, null, 2);
}

export function importJSON(text) {
  const parsed = JSON.parse(text);
  const data = parsed?.data ?? parsed;
  if (!data || typeof data !== 'object' || !('sessions' in data) || !('days' in data)) {
    throw new Error('This file does not look like a backup from this app.');
  }
  update((s) => {
    Object.keys(s).forEach((k) => delete s[k]);
    Object.assign(s, empty(), data);
  });
}

// Begin the programme on `startKey`: clear everything logged so far (practice
// sessions, check-ins, steps, progression, plan changes) and make it week 1, day 1.
// The safety-check answers, step target, trip date and settings are kept.
export function startProgramme(startKey) {
  update((s) => {
    Object.assign(s, {
      days: {}, sessions: [], planOverrides: {}, slotLevels: {}, slotProgress: {}, levelChanges: [], milestones: {},
    });
    delete s.activeWalk;
    s.profile.phase = 1;
    s.profile.phaseStartedAt = startKey;
    s.profile.programStartedAt = startKey;
  });
}

export function resetAll() {
  update((s) => {
    Object.keys(s).forEach((k) => delete s[k]);
    Object.assign(s, empty());
  });
}

// Ask the browser not to evict our storage under pressure (Safari honours this for
// Home Screen apps).
export function requestPersistence() {
  navigator.storage?.persist?.().catch(() => {});
}
