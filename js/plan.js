// Plan: a selectable week with each day's actual session, this week's focus,
// how each movement is progressing, and the six-month phases.

import { EXERCISE_BY_ID } from './data/exercises.js';
import { WORKOUTS, PHASES, PLAN_TYPES, FLAT_TERRAIN_TIPS } from './data/program.js';
import {
  addDays, daysBetween, mondayOf, planWeek, weekDose, phaseProgress, computeLimits, isAllowed, LEVEL_UP_AFTER, nextOption,
} from './engine.js';
import { esc, icon, fmtDate } from './ui.js';
import { weekStrip, exerciseRows, muscleBlock, freshExercises } from './views.js';

export function renderPlan(s, today, ui) {
  const p = s.profile;
  const offset = ui.planWeek || 0;
  const start = addDays(mondayOf(today), offset * 7);
  const selected = ui.planDay && ui.planDay >= start && ui.planDay <= addDays(start, 6) ? ui.planDay : (offset === 0 ? today : start);
  const week = planWeek(s, start, today);
  const day = week.find((d) => d.date === selected);
  const dose = weekDose(s, selected < today ? today : selected);
  const weekLabel = offset === 0 ? 'This week' : offset === 1 ? 'Next week' : offset === -1 ? 'Last week' : `${fmtDate(start, { day: 'numeric', month: 'short' })}`;
  const tripWeeks = p.tripDate ? Math.max(0, Math.round(daysBetween(today, `${p.tripDate}-01`) / 7)) : null;

  return `<main class="screen">
    <header class="titlebar"><div><p class="eyebrow">Phase ${p.phase} · Week ${dose.week} · ${esc(dose.label)}</p><h1>Plan</h1></div></header>

    <section class="card tight stack">
      <div class="weeknav">
        <button class="icon-btn" style="background:var(--bg)" data-action="plan-week" data-step="-1" aria-label="Previous week" ${offset <= -4 ? 'disabled' : ''}>${icon.prev}</button>
        <div class="stack-s" style="align-items:center"><span class="headline">${esc(weekLabel)}</span>
          <span class="footnote">${esc(fmtDate(start, { day: 'numeric', month: 'short' }))} – ${esc(fmtDate(addDays(start, 6), { day: 'numeric', month: 'short' }))}</span></div>
        <button class="icon-btn" style="background:var(--bg)" data-action="plan-week" data-step="1" aria-label="Next week" ${offset >= 3 ? 'disabled' : ''}>${icon.next}</button>
      </div>
      ${weekStrip(s, start, today, selected)}
    </section>

    ${dayCard(s, day, today)}

    <section class="card stack">
      <div class="stack-s"><span class="kicker">Week ${dose.week} of phase ${p.phase}</span><h2 class="title3">${esc(dose.label)}</h2></div>
      <p class="subhead">${esc(dose.note)} Exercises step up on their own: three good sessions with a movement unlocks the next harder version.</p>
    </section>

    <h2 class="section-title">Your progression</h2>
    ${progressionList(s)}

    ${phaseCard(s, today)}

    <h2 class="section-title">Six-month direction</h2>
    <div class="list">${PHASES.map((ph) => `<div class="list-row">
      <span class="check ${ph.n < p.phase ? 'on' : ''}" style="${ph.n === p.phase ? 'border-color:var(--accent);border-width:2px;color:var(--accent)' : ''}">${ph.n < p.phase ? icon.check : `<span style="font-size:13px;font-weight:700">${ph.n}</span>`}</span>
      <span class="grow"><span class="title">${esc(ph.name)}</span><span class="sub">${esc(ph.months)}</span></span></div>`).join('')}</div>
    <p class="footnote">${tripWeeks != null ? `About ${tripWeeks} weeks to your hut-to-hut trip.` : 'Add your trip month in Settings to see the countdown.'} Phases are guides, not deadlines.</p>
  </main>`;
}

function dayCard(s, day, today) {
  const label = day.isToday ? 'Today' : fmtDate(day.date, { weekday: 'long', day: 'numeric', month: 'short' });
  const change = day.past ? '' : `<button class="btn-plain" data-action="edit-day" data-date="${day.date}" style="align-self:flex-start">Change this day</button>`;
  const done = day.done.filter((x) => x.type !== 'mobility');

  if (done.length) {
    return `<section class="card stack">
      <div class="stack-s"><span class="kicker">${esc(label)} · Done</span><h2 class="title2">${esc(done.map((x) => x.title).join(' + '))}</h2></div>
      <div class="list">${done.map((x) => `<button class="list-row" data-action="session" data-id="${x.id}"><span class="grow"><span class="title">${esc(x.title)}</span>
        <span class="sub">${x.minutes || '?'} min${x.distanceKm ? ` · ${x.distanceKm} km` : ''}</span></span>${icon.chev}</button>`).join('')}</div>
    </section>`;
  }
  if (day.past) {
    return `<section class="card stack">
      <div class="stack-s"><span class="kicker">${esc(label)}</span><h2 class="title2">${esc(PLAN_TYPES[day.type].label)}</h2></div>
      <p class="subhead">Nothing logged. That’s fine: missed days are never carried forward.</p>
    </section>`;
  }
  const start = day.isToday ? 'Start from Today' : '';
  if (day.type === 'strength' && day.workout) {
    const w = day.workout;
    const main = w.items.filter((i) => !i.warmup);
    return `<section class="card stack">
      <div class="stack-s"><span class="kicker">${esc(label)} · Workout ${w.key}</span><h2 class="title2">${esc(w.title)}</h2></div>
      <div class="pills"><span class="pill">${icon.clock}${w.estMinutes} min</span><span class="pill">${main.length} exercises</span><span class="pill accent">${esc(w.dose.label)}</span></div>
      ${muscleBlock(w.items, 'sm')}
      ${exerciseRows(w.items, freshExercises(s, today))}
      <p class="note">Planned with your usual levels. On the day, your check-in can swap in easier versions or an easy walk.</p>
      ${start ? `<a class="btn btn-primary btn-block" href="#/today">${start}</a>` : ''}${change}
    </section>`;
  }
  if (day.type === 'walk' || day.type === 'long') {
    const long = day.type === 'long';
    return `<section class="card stack">
      <div class="stack-s"><span class="kicker">${esc(label)}</span><h2 class="title2">${long ? 'Longer outdoor walk' : 'Walk'}</h2></div>
      <div class="pills"><span class="pill">${icon.clock}${day.minutes} min</span><span class="pill">Easy pace</span></div>
      <p class="subhead">${long ? 'The week’s longer walk builds the base for hut-to-hut days. Steady pace, take water, add stairs or slopes if you have them.' : 'Easy aerobic base for running and hiking. You should be able to talk in full sentences.'}</p>
      ${long ? `<details><summary class="row-between"><span class="headline">No hills nearby?</span>${icon.chev}</summary><ul class="bullets" style="margin-top:10px">${FLAT_TERRAIN_TIPS.map((t) => `<li class="subhead">${esc(t)}</li>`).join('')}</ul></details>` : ''}
      ${start ? `<a class="btn btn-primary btn-block" href="#/today">${start}</a>` : ''}${change}
    </section>`;
  }
  const mob = day.mobility;
  return `<section class="card stack">
    <div class="stack-s"><span class="kicker">${esc(label)}</span><h2 class="title2">Rest day</h2></div>
    <p class="subhead">Recovery is part of the plan. Do the morning mobility and an easy stroll toward your steps.</p>
    ${mob ? exerciseRows(mob.items) : ''}
    ${change}
  </section>`;
}

function progressionList(s) {
  const limits = computeLimits(s, { knee: 0, ribs: 0 });
  const seen = new Map();
  Object.values(WORKOUTS).forEach((w) => w.slots.forEach((sl) => { if (!seen.has(sl.key)) seen.set(sl.key, sl); }));
  const rows = [...seen.values()].map((sl) => {
    const lvl = Math.min(s.slotLevels?.[sl.key] ?? 0, sl.options.length - 1);
    const cur = EXERCISE_BY_ID[sl.options[lvl]];
    const ni = nextOption(sl, lvl, limits);
    const next = EXERCISE_BY_ID[ni >= 0 ? sl.options[ni] : sl.options[lvl + 1]];
    const pts = s.slotProgress?.[sl.key] || 0;
    let status;
    if (!isAllowed(cur, limits) && lvl === 0) status = cur.caution.ribs > limits.ribsMax ? 'Starts once your ribs are cleared' : `From phase ${cur.minPhase}`;
    else if (!next) status = 'Top variation. Progress with reps and sets';
    else if (!isAllowed(next, limits)) status = `Next: ${next.name}, ${next.caution.ribs > limits.ribsMax ? 'once your ribs are cleared' : next.minPhase > limits.phase ? `from phase ${next.minPhase}` : 'when your knee allows'}`;
    else status = `Next: ${next.name} · ${pts} of ${LEVEL_UP_AFTER} good sessions`;
    const meter = next && isAllowed(next, limits)
      ? `<div class="meter" style="width:64px">${Array.from({ length: LEVEL_UP_AFTER }, (_, i) => `<span class="${i < pts ? 'on' : ''}"></span>`).join('')}</div>` : '';
    return `<a class="list-row" href="#/exercises/${cur.id}"><span class="grow"><span class="title">${esc(sl.label)} · ${esc(cur.name)}</span><span class="sub">${esc(status)}</span></span>${meter}</a>`;
  });
  return `<div class="list">${rows.join('')}</div>`;
}

function phaseCard(s, today) {
  const p = s.profile;
  const pp = phaseProgress(s, today);
  return `<details class="card"><summary class="row-between"><div class="stack-s"><span class="kicker">Phase ${p.phase} of 4 · ${esc(pp.phase.months)}</span>
      <span class="title3">${esc(pp.phase.name)}</span></div>${icon.chev}</summary>
    <div class="stack" style="margin-top:14px">
      <ul class="bullets">${pp.phase.focus.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
      ${pp.items.length ? `<div class="stack-s"><span class="field-label" style="margin:4px 0">Ready to move on when</span>
        ${pp.items.map((i) => `<div class="row" style="gap:10px;padding:3px 0"><span class="check ${i.met ? 'on' : ''}" style="width:22px;height:22px">${i.met ? icon.check : ''}</span><span style="font-size:15px">${esc(i.label)}</span></div>`).join('')}</div>
        <button class="${pp.ready ? 'btn btn-primary btn-block' : 'btn-plain'}" data-action="advance-phase" style="align-self:${pp.ready ? 'stretch' : 'flex-start'}">${pp.ready ? `Move to phase ${p.phase + 1}` : `Move to phase ${p.phase + 1} early`}</button>` : ''}
      ${p.phase > 1 ? `<button class="btn-plain" data-action="regress-phase" style="align-self:flex-start">Step back to phase ${p.phase - 1}</button>` : ''}
    </div></details>`;
}
