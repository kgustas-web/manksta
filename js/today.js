// Today: the day's session, check-in, morning mobility and steps.

import {
  recommend, computeLimits, buildMobility, parseKey, mondayOf, defaultCheckin, symptomLabel, weekDose,
} from './engine.js';
import { esc, icon, fmtNum, fmtDate } from './ui.js';
import {
  weekStrip, exerciseRows, muscleBlock, freshExercises, ring, timeChoice, TIME_CHOICES,
} from './views.js';

export function renderToday(s, today, ui) {
  const d = s.days[today] || {};
  const rec = recommend(s, today, ui.minutes, ui.force);
  const ci = d.checkin || defaultCheckin(s.profile);
  const mob = buildMobility(computeLimits(s, ci));
  const target = s.profile.stepTarget || 10000;
  const steps = d.steps || 0;
  const dateLine = parseKey(today).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const skipped = s.profile.assessment?.skipped;

  let fab = '';
  if (rec.kind === 'strength') fab = `<button class="fab" data-action="start-strength">${icon.play}Start workout</button>`;
  if (rec.kind === 'walk' || rec.kind === 'long') fab = `<button class="fab" data-action="start-walk" data-kind="${rec.kind}" data-minutes="${rec.minutes}">${icon.play}Start walk</button>`;

  return `<main class="screen">
    <header class="titlebar"><div><p class="eyebrow">${esc(dateLine)}</p><h1>Today</h1></div>
      <button class="icon-btn" data-action="settings" aria-label="Settings">${icon.gear}</button></header>

    ${weekStrip(s, mondayOf(today), today, today, 'goto-day')}

    ${!s.profile.programStartedAt ? `<div class="banner info"><div><strong>Test mode.</strong> Try anything; nothing you log counts yet. When you’re ready for day 1, start the programme and the plan begins from there.</div>
      <button class="btn btn-primary btn-small" data-action="start-programme" style="align-self:flex-start">Start programme</button></div>`
    : s.profile.programStartedAt > today ? `<div class="banner info"><div><strong>Starts ${esc(fmtDate(s.profile.programStartedAt, { weekday: 'long', day: 'numeric', month: 'long' }))}.</strong> Until then, everything here is a preview.</div></div>` : ''}

    ${skipped ? `<div class="banner info"><div><strong>Using safe defaults.</strong> Ribs are treated as not yet cleared and your knee as mildly sensitive. The 2-minute safety check tailors this to you.</div>
      <button class="btn btn-secondary btn-small" data-action="redo-safety" style="align-self:flex-start">Take the safety check</button></div>` : ''}

    ${rec.kind === 'hold' ? '' : checkinCard(d)}
    ${heroCard(s, rec, today, ui)}

    <section class="card tight row">
      <span class="icon-btn" style="background:var(--bg)">${icon.mobility}</span>
      <div class="grow stack-s"><span class="headline">Morning mobility</span><span class="subhead">${mob.estMinutes} min · ${mob.items.length} movements</span></div>
      ${d.mobility
        ? `<button class="check on" data-action="toggle-mobility" aria-label="Done. Tap to undo">${icon.check}</button>`
        : `<button class="btn btn-secondary btn-small" data-action="start-mobility">Start</button>`}
    </section>

    <section class="card tight stack">
      <div class="row">
        ${ring(steps, target)}
        <div class="grow stack-s"><span class="big-num">${fmtNum(steps)}</span><span class="subhead">of ${fmtNum(target)} steps</span></div>
      </div>
      <form class="inline-form" data-form="steps">
        <input class="input" name="steps" inputmode="numeric" pattern="[0-9]*" placeholder="Today’s total from Health" aria-label="Steps today">
        <button class="btn btn-secondary btn-small" type="submit" style="min-height:48px">Save</button>
      </form>
    </section>

    <div class="list">
      <button class="list-row" data-action="log"><span class="grow title">Log an activity</span>${icon.chev}</button>
      <button class="list-row" data-action="safety"><span class="grow title">When to stop</span>${icon.chev}</button>
    </div>
  </main>${fab}`;
}

function checkinCard(d) {
  if (d.checkin) {
    const c = d.checkin;
    return `<button class="card tight row" data-action="checkin" style="text-align:left">
      <div class="grow stack-s"><span class="headline">Checked in</span>
        <span class="subhead">Knee ${symptomLabel(c.knee)} · ribs ${symptomLabel(c.ribs)} · energy ${c.energy === 'ok' ? 'OK' : esc(c.energy)}</span></div>
      <span class="btn-plain">Edit</span></button>`;
  }
  return `<button class="card tight row" data-action="checkin" style="text-align:left">
    <div class="grow stack-s"><span class="headline">How are you today?</span>
      <span class="subhead">Three taps to fit today to your knee and ribs</span></div>
    <span class="btn btn-tinted btn-small">Check in</span></button>`;
}

function heroCard(s, rec, today, ui) {
  if (rec.kind === 'hold') {
    return `<section class="banner danger">
      <div><strong>Training is on hold.</strong> Your safety check flagged something a doctor should look at first. Once you have been checked, update your answers.</div>
      <button class="btn btn-secondary btn-small" data-action="redo-safety" style="align-self:flex-start">Update safety answers</button></section>`;
  }
  const kicker = ui.force ? 'Your choice' : 'Today’s plan';
  const reasons = `<ul class="reasons">${rec.reasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>`;
  const notes = rec.notes.length ? `<div class="stack-s">${rec.notes.map((n) => `<p class="note">${esc(n)}</p>`).join('')}</div>` : '';
  const alts = ui.force
    ? '<button class="btn-plain" data-action="unforce" style="align-self:flex-start">Back to the plan</button>'
    : rec.alternatives.length ? `<div class="stack-s"><span class="field-label" style="margin:4px 0 6px">Or instead</span><div class="list">${rec.alternatives.map((a) =>
      `<button class="list-row" data-action="${a.kind === 'mobility' ? 'start-mobility' : 'force'}" data-kind="${a.kind}">
        <span class="grow"><span class="title">${esc(a.title)}</span><span class="sub">${esc(a.reason)}</span></span>${icon.chev}</button>`).join('')}</div></div>` : '';

  if (rec.kind === 'strength') {
    const w = rec.workout;
    const main = w.items.filter((i) => !i.warmup);
    const dose = weekDose(s, today);
    return `<section class="card stack">
      <div class="stack-s"><span class="kicker">${kicker} · Workout ${w.key}</span><h2 class="title2">${esc(w.title)}</h2></div>
      <div class="pills"><span class="pill">${icon.clock}${w.estMinutes} min</span><span class="pill">${main.length} exercises</span><span class="pill accent">Week ${dose.week} · ${esc(dose.label)}</span></div>
      ${muscleBlock(w.items)}
      <div><span class="field-label">Time you have</span>${timeChoice('minutes', TIME_CHOICES, rec.minutes)}</div>
      ${reasons}
      <div class="row-between"><span class="headline">Exercises (${main.length})</span><span class="subhead">plus a 2-min warm-up</span></div>
      ${exerciseRows(w.items, freshExercises(s, today))}
      ${notes}${alts}
    </section>`;
  }
  if (rec.kind === 'walk' || rec.kind === 'long') {
    const opts = rec.kind === 'long'
      ? [{ v: 45, label: '45', hint: 'min' }, { v: 60, label: '60', hint: 'min' }, { v: 90, label: '90', hint: 'min' }, { v: 120, label: '120', hint: 'min' }]
      : [{ v: 15, label: '15', hint: 'min' }, { v: 20, label: '20', hint: 'min' }, { v: 30, label: '30', hint: 'min' }, { v: 45, label: '45', hint: 'min' }];
    if (!opts.some((o) => o.v === rec.minutes)) opts.splice(1, 1, { v: rec.minutes, label: String(rec.minutes), hint: 'min' });
    return `<section class="card stack">
      <div class="stack-s"><span class="kicker">${kicker}</span><h2 class="title2">${esc(rec.title)}</h2></div>
      <div class="pills"><span class="pill">${icon.clock}${rec.minutes} min</span><span class="pill">Easy pace</span></div>
      <p class="subhead">Conversational pace: you can talk in full sentences. Flat ground is fine. It all counts toward your steps.</p>
      <div><span class="field-label">Duration</span>${timeChoice('minutes', opts, rec.minutes)}</div>
      ${reasons}
      <button class="btn btn-secondary btn-block" data-action="log">Log a walk you already did</button>
      ${notes}${alts}
    </section>`;
  }
  if (rec.kind === 'done') {
    return `<section class="card stack">
      <div class="stack-s"><span class="kicker">Today</span><h2 class="title2">Done for today</h2></div>
      ${reasons}${notes}
    </section>`;
  }
  return `<section class="card stack">
    <div class="stack-s"><span class="kicker">${kicker}</span><h2 class="title2">${esc(rec.title)}</h2></div>
    ${reasons}${notes}${alts}
  </section>`;
}
