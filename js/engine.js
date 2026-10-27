// Rules-based coach. Pure functions over the stored state, no DOM, so it can be
// tested in Node (see tests/engine.test.mjs). Every recommendation carries the
// plain-language reasons that produced it.

import { EXERCISE_BY_ID } from './data/exercises.js';
import {
  MORNING_ROUTINE, WORKOUTS, WORKOUT_ORDER, DOSE_CYCLE, UPPER_SLOTS, WALK_MINUTES, LONG_WALK_MINUTES, WEEK_PATTERN, PHASES,
} from './data/program.js';

// ── Dates (local, as YYYY-MM-DD keys) ──────────────────────────
export function dateKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(key, n) {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}
export function daysBetween(a, b) {
  return Math.round((parseKey(b) - parseKey(a)) / 86400000);
}
export function weekdayName(key, style = 'long') {
  return parseKey(key).toLocaleDateString('en-GB', { weekday: style });
}

// ── Symptom scale used by check-ins and feedback ───────────────
export const SYMPTOM = [
  { v: 0, label: 'None' },
  { v: 2, label: 'Mild' },
  { v: 4, label: 'Moderate' },
  { v: 7, label: 'Strong' },
];
export const symptomLabel = (v) => (SYMPTOM.find((s) => s.v === v) || SYMPTOM[0]).label.toLowerCase();

// ── Profile-derived status ─────────────────────────────────────
export function ribStatus(profile) {
  const r = profile?.assessment?.ribs;
  if (!r) return 'protect';
  if (r.clearance === 'full' && (r.painWith || []).length === 0) return 'healed';
  if (r.clearance === 'full' || r.clearance === 'limits') return 'cleared';
  return 'protect';
}

export function kneeFlags(profile) {
  const k = profile?.assessment?.knee || {};
  return { swelling: !!k.swelling, instability: !!k.instability };
}

// What today's check-in allows. 0 low, 1 moderate, 2 high caution.
export function computeLimits(state, checkin) {
  const phase = state.profile?.phase || 1;
  const knee = checkin?.knee ?? 0;
  const ribs = checkin?.ribs ?? 0;
  const notes = [];

  let kneeMax = knee === 0 ? 2 : knee <= 2 ? 1 : 0;
  const flags = kneeFlags(state.profile);
  if ((flags.swelling || flags.instability) && kneeMax > 0) {
    kneeMax = 0;
    notes.push('You reported knee swelling or giving way, so only low-knee-load exercises are offered. Please get it checked.');
  }

  const status = ribStatus(state.profile);
  let ribsMax;
  if (status === 'protect') {
    ribsMax = 0;
    notes.push('Ribs not yet cleared: no loaded upper body, carries or direct core work.');
  } else if (status === 'cleared') {
    ribsMax = ribs >= 4 ? 0 : ribs === 0 && phase >= 3 ? 2 : 1;
  } else {
    ribsMax = ribs >= 4 ? 0 : ribs === 0 ? 2 : 1;
  }
  return { phase, kneeMax, ribsMax, notes };
}

export function isAllowed(ex, limits) {
  return (ex.minPhase || 1) <= limits.phase
    && ex.caution.knee <= limits.kneeMax
    && ex.caution.ribs <= limits.ribsMax;
}

// ── Session builders ───────────────────────────────────────────
const TRANSITION_SEC = 20;

export function itemSeconds(item) {
  const sides = item.perSide ? 2 : 1;
  const work = item.seconds ? item.seconds * sides : item.reps * 4 * sides;
  return item.sets * (work + item.rest) + TRANSITION_SEC;
}

function makeItem(exId, sets, extra = {}) {
  const ex = EXERCISE_BY_ID[exId];
  return {
    exId, sets,
    reps: ex.dose.reps, seconds: ex.dose.seconds,
    perSide: !!ex.dose.perSide, rest: ex.dose.rest,
    ...extra,
  };
}

// Next harder option above `level` that `limits` allow (skipping gated ones), or -1.
export function nextOption(slot, level, limits) {
  for (let i = level + 1; i < slot.options.length; i++) {
    if (isAllowed(EXERCISE_BY_ID[slot.options[i]], limits)) return i;
  }
  return -1;
}

// Index of the option the builder would use for a slot, or -1 if none allowed.
export function pickOption(slot, level, limits) {
  for (let i = Math.min(level, slot.options.length - 1); i >= 0; i--) {
    if (isAllowed(EXERCISE_BY_ID[slot.options[i]], limits)) return i;
  }
  return -1;
}

// Week number inside the current phase (0-based) and its place in the dose cycle.
export function weekInPhase(state, key) {
  const since = state.profile?.phaseStartedAt || key;
  return Math.max(0, Math.floor(daysBetween(since, key) / 7));
}
export function weekDose(state, key) {
  const w = weekInPhase(state, key);
  return { week: w + 1, ...DOSE_CYCLE[w % DOSE_CYCLE.length] };
}

export function buildWorkout(state, key, minutes, limits, dateKeyFor) {
  const tpl = WORKOUTS[key];
  const dose = dateKeyFor ? weekDose(state, dateKeyFor) : DOSE_CYCLE[0];
  const sets = minutes <= 10 ? Math.min(2, dose.sets) : minutes >= 45 ? Math.min(3, dose.sets + 1) : dose.sets;
  const budget = minutes * 60 * 1.1;
  const levels = state.slotLevels || {};

  const warmup = tpl.warmup
    .filter((id) => isAllowed(EXERCISE_BY_ID[id], limits))
    .slice(0, minutes <= 10 ? 1 : 3)
    .map((id) => makeItem(id, 1, { rest: 0, warmup: true }));
  let total = warmup.reduce((s, i) => s + itemSeconds(i), 0);

  const items = [];
  for (const slot of tpl.slots) {
    const idx = pickOption(slot, levels[slot.key] ?? 0, limits);
    if (idx < 0) continue;
    const item = makeItem(slot.options[idx], sets, { slot: slot.key });
    if (item.reps) item.reps += item.reps >= 10 ? dose.reps : Math.ceil(dose.reps / 2);
    if (item.seconds) item.seconds += dose.secs;
    const secs = itemSeconds(item);
    if (items.length >= 2 && total + secs > budget) continue;
    items.push(item);
    total += secs;
  }
  // Upper-body title only when two or more upper-body exercises made it in.
  const upper = items.filter((i) => UPPER_SLOTS.has(i.slot)).length;
  return {
    key, title: tpl.altTitle && upper < 2 ? tpl.altTitle : tpl.title, dose,
    items: [...warmup, ...items],
    estMinutes: Math.round(total / 60),
  };
}

export function buildMobility(limits) {
  const items = MORNING_ROUTINE
    .map((r) => r.id)
    .filter((id) => isAllowed(EXERCISE_BY_ID[id], limits))
    .map((id) => makeItem(id, 1, { rest: 0 }));
  const secs = items.reduce((s, i) => s + itemSeconds(i), 0);
  return { key: 'mobility', title: 'Morning mobility', items, estMinutes: Math.round(secs / 60) };
}

// ── History helpers ────────────────────────────────────────────
const LOWER_LOAD = new Set(['strength', 'long', 'run', 'hike']);

export function sessionsOn(state, key) {
  return (state.sessions || []).filter((s) => s.date === key);
}

export function lastOfType(state, types, beforeKey) {
  const set = new Set(types);
  return [...(state.sessions || [])]
    .filter((s) => set.has(s.type) && (!beforeKey || s.date < beforeKey))
    .sort((a, b) => (a.date + a.createdAt < b.date + b.createdAt ? 1 : -1))[0];
}

export function nextStrengthKey(state, beforeKey) {
  const last = lastOfType(state, ['strength'], beforeKey);
  const i = WORKOUT_ORDER.indexOf(last?.workout);
  return WORKOUT_ORDER[(i + 1) % WORKOUT_ORDER.length];
}

// Check-in assumed when you have not checked in: your usual knee level from the
// safety check, and mild rib discomfort while the ribs are not yet cleared.
export function defaultCheckin(profile) {
  const knee = Math.min(2, profile?.assessment?.knee?.level ?? 0);
  const ribs = ribStatus(profile) === 'protect' ? 2 : 0;
  return { knee, ribs, energy: 'ok', assumed: true };
}

function badFeedback(s) {
  const f = s?.feedback;
  if (!f) return null;
  const parts = [];
  if (f.knee >= 4) parts.push(`${symptomLabel(f.knee)} knee discomfort`);
  if (f.ribs >= 4) parts.push(`${symptomLabel(f.ribs)} rib discomfort`);
  if (f.after === 'worse') parts.push('feeling worse afterwards');
  if (f.difficulty === 'too-hard') parts.push('that it was too hard');
  return parts.length ? parts.join(' and ') : null;
}

export function plannedType(state, key) {
  const o = state.planOverrides?.[key];
  if (o) return o;
  const phase = state.profile?.phase || 1;
  return WEEK_PATTERN[phase][parseKey(key).getDay()];
}

export function weekPlan(state, fromKey, n = 7) {
  return Array.from({ length: n }, (_, i) => {
    const key = addDays(fromKey, i);
    return {
      date: key,
      type: plannedType(state, key),
      overridden: !!state.planOverrides?.[key],
      done: sessionsOn(state, key),
    };
  });
}

// Phase 1 starts from what the safety check said is comfortable today.
const START_WALK = { '<10': 10, '10-20': 15, '20-40': 20, '40+': 30 };
const START_LONG = { '<10': 20, '10-20': 30, '20-40': 40, '40+': 45 };

export function walkMinutes(profile) {
  const phase = profile?.phase || 1;
  const base = WALK_MINUTES[phase][0];
  const cap = profile?.assessment?.capacity?.walk;
  return phase === 1 && START_WALK[cap] ? START_WALK[cap] : base;
}

export function longWalkMinutes(profile) {
  const phase = profile?.phase || 1;
  const cap = profile?.assessment?.capacity?.walk;
  return phase === 1 && START_LONG[cap] ? START_LONG[cap] : LONG_WALK_MINUTES[phase];
}

// ── The recommendation ─────────────────────────────────────────
// Returns { kind, title, minutes, reasons[], notes[], workout?, alternatives[] }.
// kind: hold | checkin | strength | walk | long | rest | done
export function recommend(state, today, minutesChoice, force) {
  const p = state.profile;
  if (p?.assessment?.hardStops?.length) {
    return {
      kind: 'hold', title: 'Check with a doctor first',
      reasons: ['Your safety check flagged something that should be looked at before you start training.'],
      notes: [], alternatives: [],
    };
  }
  const day = state.days?.[today] || {};
  const ci = day.checkin || defaultCheckin(p);

  const limits = computeLimits(state, ci);
  const phase = limits.phase;
  const reasons = [];
  const notes = [...limits.notes];
  if (ci.assumed) notes.unshift('Based on your usual levels. Check in to adjust today to how you feel.');
  const yesterday = addDays(today, -1);
  const planned = plannedType(state, today);
  let kind = planned;

  const doneToday = sessionsOn(state, today).filter((s) => LOWER_LOAD.has(s.type) || s.type === 'walk');
  if (doneToday.length) {
    return {
      kind: 'done', title: 'Done for today',
      reasons: [`Logged today: ${doneToday.map((s) => s.title).join(', ')}. Steps and an easy stroll still count.`],
      notes, alternatives: [], limits,
    };
  }

  if (ci.knee >= 7 || ci.ribs >= 7) {
    const which = ci.knee >= 7 && ci.ribs >= 7 ? 'knee and ribs' : ci.knee >= 7 ? 'knee' : 'ribs';
    return {
      kind: 'rest', title: 'Rest today', minutes: 0,
      reasons: [`You reported strong ${which} discomfort this morning. Rest, and only do the movements that feel comfortable.`],
      notes: [...notes, 'If it is not settling over the next few days, or anything feels unusual, contact a doctor or physiotherapist.'],
      alternatives: [{ kind: 'mobility', title: 'Gentle mobility only', reason: 'Only if it feels comfortable' }],
      limits,
    };
  }

  if (force) {
    kind = force;
    reasons.push('Your choice for today, instead of the recommendation.');
  }

  // Recovery overrides, in order of importance.
  const recent = lastOfType(state, ['strength', 'walk', 'long', 'run', 'hike', 'other'], today);
  const recentBad = recent && daysBetween(recent.date, today) <= 2 ? badFeedback(recent) : null;
  const strengthYesterday = sessionsOn(state, yesterday).some((s) => s.type === 'strength');
  const lastStrength = lastOfType(state, ['strength'], today);
  const daysSinceStrength = lastStrength ? daysBetween(lastStrength.date, today) : null;

  if (force) {
    // Respect the choice; safety limits still shape the content.
  } else if (recentBad && (kind === 'strength' || kind === 'long')) {
    kind = 'walk';
    reasons.push(`After ${weekdayName(recent.date)}’s session (${recent.title}) you reported ${recentBad}. An easy day lets that settle before the next harder session.`);
  } else if ((ci.knee >= 4 || ci.ribs >= 4) && (kind === 'strength' || kind === 'long')) {
    kind = 'walk';
    reasons.push(`Moderate ${ci.knee >= 4 ? 'knee' : 'rib'} discomfort this morning, so an easy walk instead of the planned ${planned === 'long' ? 'long walk' : 'strength session'}.`);
  } else if (kind === 'strength' && strengthYesterday) {
    kind = 'walk';
    reasons.push('You did strength yesterday. A day between strength sessions helps your legs recover.');
  } else if (ci.energy === 'low' && (kind === 'strength' || kind === 'long')) {
    kind = 'walk';
    reasons.push('Low energy this morning. An easy walk keeps the routine going without digging a hole.');
  }

  const alternatives = [];
  const strengthOk = !strengthYesterday && !recentBad && ci.knee < 4 && ci.ribs < 4;

  if (kind === 'strength') {
    const key = nextStrengthKey(state, today);
    const minutes = minutesChoice || 20;
    const workout = buildWorkout(state, key, minutes, limits, today);
    if (!reasons.length) {
      reasons.push(daysSinceStrength == null
        ? 'Your first strength session. Everything is set to the easiest version. Aim to finish feeling you could have done more.'
        : `Planned for today. Your last strength session was ${daysSinceStrength} day${daysSinceStrength === 1 ? '' : 's'} ago.`);
    }
    if (ci.knee === 2) reasons.push(ci.assumed ? 'Knee treated as mildly sensitive, so the higher knee-load options are left out.' : 'Mild knee discomfort this morning, so the higher knee-load options are left out.');
    alternatives.push({ kind: 'walk', title: `Easy walk instead`, reason: 'If you would rather keep today light' });
    return { kind, title: `Strength · ${workout.title}`, minutes, workout, reasons, notes, alternatives, limits };
  }

  if (kind === 'long') {
    const minutes = longWalkMinutes(p);
    reasons.push('Your longer outdoor walk this week. Easy pace: you should be able to talk in full sentences.');
    if (phase >= 3) reasons.push('Include stairs or hills if you can.');
    alternatives.push({ kind: 'walk', title: 'Regular walk', reason: 'If time or weather does not allow a long one' });
    return { kind, title: 'Longer outdoor walk', minutes, reasons, notes, alternatives, limits };
  }

  if (kind === 'walk') {
    const easy = reasons.length > 0;
    const minutes = minutesChoice || (easy ? Math.min(20, walkMinutes(p)) : walkMinutes(p));
    if (!reasons.length) reasons.push('Easy, conversational-pace walking builds the aerobic base for running and hiking.');
    if (planned === 'walk' && strengthOk && daysSinceStrength != null && daysSinceStrength >= 4) {
      alternatives.push({ kind: 'strength', title: 'Strength session', reason: `It has been ${daysSinceStrength} days since your last one` });
    }
    return { kind, title: easy ? 'Easy walk' : 'Walk', minutes, reasons, notes, alternatives, limits };
  }

  // rest
  reasons.push('A planned easy day. Morning mobility and your steps are enough.');
  alternatives.push({ kind: 'walk', title: 'Easy walk', reason: 'If you feel like moving' });
  return { kind: 'rest', title: 'Rest or easy movement', minutes: 0, reasons, notes, alternatives, limits };
}

// ── Phase progress ─────────────────────────────────────────────
const WALK_TYPES = new Set(['walk', 'long', 'hike']);

function comfortableWalk(state, since, min) {
  return (state.sessions || []).some((s) => WALK_TYPES.has(s.type) && s.date >= since
    && (s.minutes || 0) >= min && (s.feedback?.knee ?? 0) <= 2 && s.feedback?.after !== 'worse');
}

function symptomsSettled(state, today) {
  const keys = Array.from({ length: 14 }, (_, i) => addDays(today, -i));
  const cis = keys.map((k) => state.days?.[k]?.checkin).filter(Boolean);
  if (cis.length < 7) return false;
  const ok = cis.filter((c) => c.knee <= 2 && c.ribs <= 2).length;
  return ok / cis.length >= 0.8;
}

export function phaseProgress(state, today) {
  const p = state.profile;
  const phase = PHASES[(p?.phase || 1) - 1];
  const since = p?.phaseStartedAt || today;
  const inPhase = daysBetween(since, today);
  const checks = {
    weeks3: inPhase >= 21, weeks4: inPhase >= 28, weeks6: inPhase >= 42,
    strength8: (state.sessions || []).filter((s) => s.type === 'strength' && s.date >= since).length >= 8,
    mobility15: Array.from({ length: 21 }, (_, i) => addDays(today, -i)).filter((k) => state.days?.[k]?.mobility).length >= 15,
    walk30: comfortableWalk(state, since, 30),
    walk60: comfortableWalk(state, since, 60),
    walk90: comfortableWalk(state, since, 90),
    symptoms: symptomsSettled(state, today),
    ribsCleared: ribStatus(p) !== 'protect',
  };
  const items = phase.next.map((c) => ({ ...c, met: !!checks[c.key] }));
  return { phase, items, ready: items.length > 0 && items.every((i) => i.met), daysInPhase: inPhase };
}

// ── The week ───────────────────────────────────────────────────
export function mondayOf(key) {
  return addDays(key, -((parseKey(key).getDay() + 6) % 7));
}

// Seven days from `startKey` with the session each one holds. Past days show what
// was done; today and later show the plan, built with your usual limits (the day's
// check-in can still change it). Strength days rotate A → B → C from your last one.
export function planWeek(state, startKey, today, minutes = 20) {
  const limits = computeLimits(state, defaultCheckin(state.profile));
  const after = (k) => WORKOUT_ORDER[(WORKOUT_ORDER.indexOf(k) + 1) % WORKOUT_ORDER.length];
  let key = nextStrengthKey(state, today);
  // Strength days between today and the start of a future week advance the rotation.
  for (let d = today; d < startKey; d = addDays(d, 1)) {
    const doneS = sessionsOn(state, d).find((x) => x.type === 'strength');
    if (doneS) key = after(doneS.workout);
    else if (plannedType(state, d) === 'strength') key = after(key);
  }
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startKey, i);
    const type = plannedType(state, date);
    const done = sessionsOn(state, date);
    const day = { date, type, done, overridden: !!state.planOverrides?.[date], past: date < today, isToday: date === today };
    if (date < today) return day;
    if (type === 'strength') {
      const doneStrength = done.find((x) => x.type === 'strength');
      if (doneStrength) { key = after(doneStrength.workout); return { ...day, workoutKey: doneStrength.workout }; }
      day.workout = buildWorkout(state, key, minutes, limits, date);
      day.minutes = day.workout.estMinutes;
      key = after(key);
    } else if (type === 'walk') day.minutes = walkMinutes(state.profile);
    else if (type === 'long') day.minutes = longWalkMinutes(state.profile);
    else day.mobility = buildMobility(limits);
    return day;
  });
}

// ── Progression ────────────────────────────────────────────────
// After a strength session: each movement family done in full on a good day
// (effort easy or fine, knee and ribs mild or less, not worse afterwards) earns a
// point. Three points move it to the next harder option your usual limits allow.
// "Too hard" steps it back down. Mutates state; returns the changes for display.
export const LEVEL_UP_AFTER = 3;

export function applyProgression(state, session) {
  const f = session.feedback || {};
  const good = ['easy', 'right'].includes(f.difficulty) && f.knee <= 2 && f.ribs <= 2 && f.after !== 'worse';
  const tooHard = f.difficulty === 'too-hard' || f.knee >= 4 || f.ribs >= 4;
  const tpl = WORKOUTS[session.workout];
  if (!tpl) return [];
  state.slotLevels = state.slotLevels || {};
  state.slotProgress = state.slotProgress || {};
  state.levelChanges = state.levelChanges || [];
  const limits = computeLimits(state, { knee: 0, ribs: 0 });
  const changes = [];
  for (const item of session.items || []) {
    if (!item.slot || item.sets < 2) continue;
    const slot = tpl.slots.find((x) => x.key === item.slot);
    if (!slot) continue;
    const level = state.slotLevels[slot.key] ?? 0;
    if (tooHard) {
      state.slotProgress[slot.key] = 0;
      if (f.difficulty === 'too-hard' && level > 0) {
        state.slotLevels[slot.key] = level - 1;
        changes.push({ slot: slot.key, from: slot.options[level], to: slot.options[level - 1], dir: -1 });
      }
      continue;
    }
    if (!good) continue;
    const pts = (state.slotProgress[slot.key] || 0) + 1;
    const ni = nextOption(slot, level, limits);
    const next = ni >= 0 ? slot.options[ni] : null;
    if (pts >= LEVEL_UP_AFTER && next) {
      state.slotLevels[slot.key] = ni;
      state.slotProgress[slot.key] = 0;
      changes.push({ slot: slot.key, from: slot.options[level], to: next, dir: 1 });
    } else {
      state.slotProgress[slot.key] = Math.min(pts, LEVEL_UP_AFTER);
    }
  }
  changes.forEach((c) => state.levelChanges.push({ ...c, date: session.date }));
  return changes;
}
