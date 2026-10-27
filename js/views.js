// View pieces shared by Today and Plan.

import { EXERCISE_BY_ID } from './data/exercises.js';
import { addDays, sessionsOn, plannedType } from './engine.js';
import { bodyMap, sessionMuscles, REGION_NAMES } from './body.js';
import { esc, icon, thumb, doseText, fmtDate } from './ui.js';

export const TYPE_ICON = { strength: icon.strength, walk: icon.walk, long: icon.long, rest: icon.rest };

export function weekStrip(state, startKey, today, selected, action = 'pick-day') {
  return `<div class="week" role="group" aria-label="Week">${Array.from({ length: 7 }, (_, i) => {
    const d = addDays(startKey, i);
    const done = sessionsOn(state, d).some((x) => x.type !== 'mobility');
    const type = plannedType(state, d);
    return `<button class="day ${d === today ? 'today' : ''} ${done ? 'done' : ''}" data-action="${action}" data-date="${d}" aria-pressed="${d === selected}" aria-label="${esc(fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long' }))}">
      <span class="dw">${esc(fmtDate(d, { weekday: 'narrow' }))}</span>
      <span class="dn">${Number(d.slice(8))}</span>
      <span class="di">${done ? icon.check : TYPE_ICON[type]}</span></button>`;
  }).join('')}</div>`;
}

// Exercise rows for a session; `fresh` holds exercise ids that are new this week.
export function exerciseRows(items, fresh = new Set()) {
  return `<div class="list">${items.filter((i) => !i.warmup).map((i) => {
    const e = EXERCISE_BY_ID[i.exId];
    return `<a class="list-row has-thumb" href="#/exercises/${e.id}">${thumb(e)}
      <span class="grow"><span class="title">${esc(e.name)}${fresh.has(e.id) ? '<span class="tag-new">New</span>' : ''}</span>
      <span class="sub">${i.sets} × ${esc(doseText(i))}</span></span>${icon.chev}</a>`;
  }).join('')}</div>`;
}

export function muscleBlock(items, size = 'md') {
  const exs = items.filter((i) => !i.warmup).map((i) => EXERCISE_BY_ID[i.exId]);
  const m = sessionMuscles(exs);
  return `${bodyMap(m, { size, labels: false })}
    <div class="legend"><span><i></i>${esc(m.primary.map((k) => REGION_NAMES[k]).join(', '))}</span></div>`;
}

// Exercises introduced by a level-up in the last 14 days.
export function freshExercises(state, today) {
  const since = addDays(today, -14);
  return new Set((state.levelChanges || []).filter((c) => c.dir > 0 && c.date >= since).map((c) => c.to));
}

export function ring(value, target) {
  const r = 30, c = 2 * Math.PI * r;
  const pct = Math.min(1, target ? value / target : 0);
  return `<svg class="ring" viewBox="0 0 72 72" aria-hidden="true">
    <circle class="track" cx="36" cy="36" r="${r}" fill="none" stroke-width="10"/>
    <circle class="prog" cx="36" cy="36" r="${r}" fill="none" stroke-width="10" stroke-linecap="round"
      stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - pct)).toFixed(1)}" transform="rotate(-90 36 36)"/></svg>`;
}

export const TIME_CHOICES = [
  { v: 10, label: '10 min', hint: 'Quick' },
  { v: 20, label: '20 min', hint: 'Standard' },
  { v: 30, label: '30 min', hint: 'Longer' },
  { v: 45, label: '45 min', hint: 'Full' },
];

export function timeChoice(name, options, value) {
  return `<div class="choice" role="group" aria-label="Time available">${options.map((o) =>
    `<button type="button" data-seg="${name}" data-value="${o.v}" aria-pressed="${o.v === value}">${esc(o.label)}<small>${esc(o.hint)}</small></button>`).join('')}</div>`;
}
