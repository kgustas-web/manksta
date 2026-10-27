// App shell: routing, the four screens, settings, and event handling.
// Screens render to HTML strings; one delegated listener handles interaction.

import { getState, update, subscribe, day, uid, exportJSON, importJSON, resetAll, requestPersistence, startProgramme } from './store.js';
import {
  dateKey, addDays, parseKey, daysBetween, recommend, computeLimits, buildMobility, weekPlan,
  phaseProgress, SYMPTOM, symptomLabel, ribStatus, applyProgression, mondayOf, defaultCheckin,
} from './engine.js';
import { renderToday } from './today.js';
import { renderPlan } from './plan.js';
import { EXERCISES, EXERCISE_BY_ID } from './data/exercises.js';
import { ANIMATIONS } from './data/animations.js';
import { PLAN_TYPES, HIKING_MILESTONES, FLAT_TERRAIN_TIPS, PAIN_GUIDE } from './data/program.js';
import { bodyMap, REGION_NAMES, AREAS, inArea } from './body.js';
import {
  esc, icon, seg, media, thumb, doseText, fmtNum, fmtDate, openSheet, closeSheet,
} from './ui.js';
import { openFeedback, showSafety } from './feedback.js';
import { openPlayer, openWalk } from './player.js';
import {
  createOnboarding, renderOnboarding, handleOnboardingInput, profileFromOnboarding, defaultProfile,
} from './onboarding.js';

const app = document.getElementById('app');
const ui = {
  minutes: null, force: null, forDay: null,
  ob: null, obRedo: false,
  exFilter: 'all', exQuery: '', exArea: null,
  showAllHistory: false,
  planWeek: 0, planDay: null,
};

const SESSION_TITLES = { walk: 'Walk', long: 'Longer walk', run: 'Run', hike: 'Hike', strength: 'Strength', other: 'Activity' };

// ── Routing ─────────────────────────────
function route() {
  const h = location.hash.replace(/^#\/?/, '') || 'today';
  const [name, arg] = h.split('/');
  return { name, arg: arg && decodeURIComponent(arg) };
}

function tabbar(active) {
  const tabs = [['today', 'Today', icon.today], ['plan', 'Plan', icon.plan], ['exercises', 'Exercises', icon.exercises], ['progress', 'Progress', icon.progress]];
  return `<nav class="tabbar" aria-label="Main">${tabs.map(([k, label, ic]) =>
    `<a href="#/${k}" ${active === k ? 'aria-current="page"' : ''}>${ic}<span>${label}</span></a>`).join('')}</nav>`;
}

let lastRoute = '';
function render() {
  const s = getState();
  applyTheme(s.settings?.theme);
  const today = dateKey();
  if (ui.forDay !== today) { ui.forDay = today; ui.minutes = null; ui.force = null; }

  if (!s.profile || ui.ob) {
    if (!ui.ob) ui.ob = createOnboarding(null);
    app.innerHTML = renderOnboarding(ui.ob, { isRedo: ui.obRedo });
    return;
  }
  const r = route();
  let html;
  if (r.name === 'plan') html = renderPlan(s, today, ui);
  else if (r.name === 'exercises' && r.arg) html = renderExercise(r.arg);
  else if (r.name === 'exercises') html = renderExercises();
  else if (r.name === 'progress') html = renderProgress(s, today);
  else html = renderToday(s, today, ui);
  app.innerHTML = html + tabbar(r.name === 'exercises' ? 'exercises' : ['plan', 'progress'].includes(r.name) ? r.name : 'today');
  const key = location.hash;
  if (key !== lastRoute) { window.scrollTo(0, 0); lastRoute = key; }
}

function applyTheme(t) {
  const root = document.documentElement;
  if (t === 'light' || t === 'dark') root.dataset.theme = t; else delete root.dataset.theme;
}

// ── Sheets for Today and Plan ─────────────────────────────
const ENERGY = [{ v: 'low', label: 'Low' }, { v: 'ok', label: 'OK' }, { v: 'good', label: 'Good' }];
const symOpts = SYMPTOM.map((x) => ({ v: x.v, label: x.label }));

function checkinSheet() {
  const d = getState().days[dateKey()] || {};
  const c = { ...(d.checkin || { knee: null, ribs: null, energy: null }) };
  const draw = () => {
    const ready = c.knee != null && c.ribs != null && c.energy;
    const el = openSheet(`<div class="stack">
      <div class="stack-s"><h2>How are you today?</h2><p class="subhead">Today’s session adapts to your answers.</p></div>
      <div><span class="field-label">Knee</span>${seg('ci.knee', symOpts, c.knee)}</div>
      <div><span class="field-label">Ribs</span>${seg('ci.ribs', symOpts, c.ribs)}</div>
      <div><span class="field-label">Energy and sleep</span>${seg('ci.energy', ENERGY, c.energy)}</div>
      <button class="btn btn-primary btn-block" data-ci-save ${ready ? '' : 'disabled'}>Save</button>
    </div>`);
    el.onclick = (ev) => {
      const b = ev.target.closest('[data-seg]');
      if (b) { const k = b.dataset.seg.slice(3); c[k] = k === 'energy' ? b.dataset.value : Number(b.dataset.value); draw(); return; }
      if (ev.target.closest('[data-ci-save]')) {
        closeSheet();
        ui.force = null; ui.minutes = null;
        update(() => { day(dateKey()).checkin = { knee: c.knee, ribs: c.ribs, energy: c.energy, at: new Date().toISOString() }; });
      }
    };
  };
  draw();
}

function editDaySheet(date) {
  const s = getState();
  const cur = weekPlan(s, date, 1)[0];
  openSheet(`<div class="stack">
    <h2>${esc(fmtDate(date, { weekday: 'long', day: 'numeric', month: 'long' }))}</h2>
    <div class="stack-s">${Object.entries(PLAN_TYPES).map(([k, t]) => `<button class="option" data-action="set-plan" data-date="${date}" data-type="${k}" aria-pressed="${cur.type === k}">
      <span class="check ${cur.type === k ? 'on' : ''}">${cur.type === k ? icon.check : ''}</span><span>${esc(t.label)}</span></button>`).join('')}</div>
    ${cur.overridden ? `<button class="btn btn-secondary btn-block" data-action="set-plan" data-date="${date}" data-type="">Reset to the default plan</button>` : ''}
    <p class="note">Avoid strength on back-to-back days. On the day, your check-in can still swap it for something easier.</p>
  </div>`);
}

// ── Exercises ─────────────────────────────
// Type and search filters; the body-area chip is applied on top, so chip counts
// show what each area would give within the current type and search.
function exBase() {
  const q = ui.exQuery.trim().toLowerCase();
  return EXERCISES.filter((e) => (ui.exFilter === 'all' || e.kind === ui.exFilter)
    && (!q || e.name.toLowerCase().includes(q) || [...e.muscles.primary, ...e.muscles.secondary].some((m) => REGION_NAMES[m].toLowerCase().includes(q))));
}

function areaChips() {
  const base = exBase();
  return `<div class="chip-row" role="group" aria-label="Body area">${AREAS.map((a) => {
    const n = base.filter((e) => inArea(e, a.key)).length;
    const on = ui.exArea === a.key;
    return `<button type="button" class="chip" data-seg="exArea" data-value="${a.key}" aria-pressed="${on}" ${n || on ? '' : 'disabled'}>${esc(a.label)}<span class="chip-n">${n}</span></button>`;
  }).join('')}</div>`;
}

function exListHTML() {
  const list = exBase().filter((e) => inArea(e, ui.exArea));
  return list.map((e) => `<a class="list-row has-thumb" href="#/exercises/${e.id}">${thumb(e)}
      <span class="grow"><span class="title">${esc(e.name)}</span><span class="sub">${esc(e.muscles.primary.map((m) => REGION_NAMES[m]).join(', '))}${ANIMATIONS[e.id] || e.media ? '' : ' · no demo yet'}</span></span>${icon.chev}</a>`).join('') || `<div class="list-row"><span class="grow muted">No matches</span>
      <button class="btn btn-secondary btn-small" data-action="clear-ex-filters">Clear filters</button></div>`;
}

function renderExercises() {
  const missing = EXERCISES.filter((e) => !ANIMATIONS[e.id] && !e.media).length;
  return `<main class="screen">
    <header class="titlebar"><div><p class="eyebrow">${EXERCISES.length} exercises</p><h1>Exercises</h1></div></header>
    <input id="ex-search" class="input" type="search" placeholder="Search by name or muscle" value="${esc(ui.exQuery)}" data-input="exQuery" aria-label="Search exercises">
    ${seg('exFilter', [{ v: 'all', label: 'All' }, { v: 'mobility', label: 'Mobility' }, { v: 'strength', label: 'Strength' }, { v: 'balance', label: 'Balance' }], ui.exFilter)}
    <div id="ex-areas">${areaChips()}</div>
    <div class="list" id="ex-list">${exListHTML()}</div>
    <p class="footnote">Every exercise is animated. Reference photos (free-exercise-db, public domain) are on the exercise page where available.${missing ? ` ${missing} still have no demonstration and are marked “no demo yet”.` : ''}</p>
  </main>`;
}

function exLink(ref) {
  if (!ref) return '';
  const e = EXERCISE_BY_ID[ref];
  return e ? `<a href="#/exercises/${e.id}">${esc(e.name)}</a>` : esc(ref);
}

function renderExercise(id) {
  const e = EXERCISE_BY_ID[id];
  if (!e) return `<main class="screen"><div class="backbar"><a href="#/exercises">${icon.back}Exercises</a></div><p>Not found.</p></main>`;
  const sets = e.kind === 'mobility' ? '1' : '2–3';
  const amount = e.dose.seconds ? `${e.dose.seconds} s` : `${e.dose.reps}`;
  const caution = [];
  if (e.caution.knee === 0) caution.push('<span class="pill accent">Knee-friendly</span>');
  if (e.caution.knee >= 1) caution.push(`<span class="pill warn">Knee: ${e.caution.knee === 2 ? 'higher load' : 'moderate load'}</span>`);
  if (e.caution.ribs === 0) caution.push('<span class="pill accent">Rib-safe</span>');
  if (e.caution.ribs >= 1) caution.push(`<span class="pill warn">Ribs: ${e.caution.ribs === 2 ? 'wait until pain-free' : 'once cleared'}</span>`);
  if (e.minPhase > 1) caution.push(`<span class="pill" style="background:var(--card)">From phase ${e.minPhase}</span>`);
  return `<main class="screen">
    <div class="backbar"><a href="#/exercises">${icon.back}Exercises</a></div>
    <div class="stack-s" style="padding:0 4px"><h1 style="font-size:30px">${esc(e.name)}</h1><div class="pills">${caution.join('')}</div></div>
    ${media(e)}
    <section class="card stack">
      <h3>Why it helps</h3><p>${esc(e.why)}</p>
    </section>
    <section class="card stack">
      <h3>Muscles</h3>
      ${bodyMap(e.muscles, { size: "md" })}
      <div class="legend"><span><i></i>${esc(e.muscles.primary.map((m) => REGION_NAMES[m]).join(', '))}</span>
        ${e.muscles.secondary.length ? `<span><i class="s"></i>${esc(e.muscles.secondary.map((m) => REGION_NAMES[m]).join(', '))}</span>` : ''}</div>
    </section>
    <section class="card stack">
      <div class="stack-s"><h3>Starting position</h3><p>${esc(e.start)}</p></div>
      <div class="stack-s"><h3>How to do it</h3><ol class="steps">${e.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>
      <div class="dose">
        <div><b>${sets}</b><span>${e.kind === 'mobility' ? 'round' : 'sets'}</span></div>
        <div><b>${amount}</b><span>${e.dose.seconds ? 'hold' : 'reps'}${e.dose.perSide ? ' each side' : ''}</span></div>
        <div><b>${e.dose.rest ? `${e.dose.rest} s` : '–'}</b><span>rest</span></div>
      </div>
      <p class="note">Starting dose. In a session the app sets the actual numbers.</p>
    </section>
    <section class="card stack">
      <div class="stack-s"><h3>Common mistakes</h3><ul class="bullets">${e.mistakes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      ${e.easier ? `<div class="stack-s"><h3>Easier</h3><p>${exLink(e.easier)}</p></div>` : ''}
      ${e.harder ? `<div class="stack-s"><h3>Harder</h3><p>${exLink(e.harder)}</p></div>` : ''}
      <div class="stack-s"><h3>Equipment</h3><p>${esc(e.equipment.join(', '))}</p></div>
    </section>
    ${e.safety ? `<div class="banner warn">${esc(e.safety)}</div>` : ''}
    <p class="footnote">${e.media ? 'Photos: free-exercise-db (public domain). ' : ''}Stop if you feel sharp pain. <a href="#" data-action="safety">When to stop</a></p>
  </main>`;
}

// ── Progress ─────────────────────────────

function stepsChart(s, today) {
  const n = 14, W = 340, H = 150, top = 12, bottom = 22, left = 4, right = 4;
  const keys = Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));
  const target = s.profile.stepTarget || 10000;
  const vals = keys.map((k) => s.days[k]?.steps || 0);
  const max = Math.max(target * 1.2, ...vals);
  const bw = (W - left - right) / n;
  const y = (v) => top + (H - top - bottom) * (1 - v / max);
  const bars = vals.map((v, i) => v ? `<rect class="barv ${v < target ? 'under' : ''}" x="${left + i * bw + 3}" y="${y(v)}" width="${bw - 6}" height="${H - bottom - y(v)}" rx="3"><title>${fmtDate(keys[i])}: ${fmtNum(v)}</title></rect>` : '').join('');
  const labels = keys.map((k, i) => `<text class="axis" x="${left + i * bw + bw / 2}" y="${H - 6}" text-anchor="middle">${fmtDate(k, { weekday: 'narrow' })}</text>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Daily steps, last 14 days">
    <line class="grid" x1="0" x2="${W}" y1="${H - bottom}" y2="${H - bottom}"/>
    <line class="target" x1="0" x2="${W}" y1="${y(target)}" y2="${y(target)}"/>
    ${bars}${labels}</svg>`;
}

function symptomChart(s, today) {
  const n = 14, W = 340, H = 140, top = 10, bottom = 22, left = 56, right = 6;
  const keys = Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));
  const step = (W - left - right) / (n - 1);
  const y = (v) => top + (H - top - bottom) * (1 - v / 7);
  const series = (field) => keys.map((k, i) => {
    const c = s.days[k]?.checkin;
    return c ? [left + i * step, y(c[field])] : null;
  });
  const path = (pts) => {
    let d = '';
    let pen = false;
    pts.forEach((p) => { if (!p) { pen = false; return; } d += `${pen ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`; pen = true; });
    return d;
  };
  const knee = series('knee');
  const ribs = series('ribs');
  const grid = SYMPTOM.map((l) => `<line class="grid" x1="${left}" x2="${W - right}" y1="${y(l.v)}" y2="${y(l.v)}"/><text class="axis" x="${left - 8}" y="${y(l.v) + 3}" text-anchor="end">${l.label}</text>`).join('');
  const dots = (pts, cls) => pts.map((p) => (p ? `<circle class="${cls}" cx="${p[0]}" cy="${p[1]}" r="3"/>` : '')).join('');
  const labels = keys.map((k, i) => (i % 2 === 1 ? `<text class="axis" x="${left + i * step}" y="${H - 6}" text-anchor="middle">${fmtDate(k, { day: 'numeric' })}</text>` : '')).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Knee and rib discomfort from morning check-ins, last 14 days">
    ${grid}<path class="line-ribs" d="${path(ribs)}"/><path class="line-knee" d="${path(knee)}"/>${dots(ribs, 'pt-ribs')}${dots(knee, 'pt-knee')}${labels}</svg>`;
}

function consistencyGrid(s, today) {
  const start = addDays(mondayOf(today), -7 * 7);
  const sessionDays = new Set((s.sessions || []).map((x) => x.date));
  let html = '<span></span>' + ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => `<span style="text-align:center">${d}</span>`).join('');
  for (let w = 0; w < 8; w++) {
    const wk = addDays(start, w * 7);
    html += `<span>${fmtDate(wk, { day: 'numeric' })}</span>`;
    for (let d = 0; d < 7; d++) {
      const k = addDays(wk, d);
      const cls = k > today ? 'future' : sessionDays.has(k) ? 'sess' : s.days[k]?.mobility ? 'mob' : '';
      html += `<span class="c ${cls} ${k === today ? 'today' : ''}" title="${fmtDate(k)}"></span>`;
    }
  }
  return `<div class="cal" aria-label="Activity over the last 8 weeks">${html}</div>`;
}

function renderProgress(s, today) {
  const mon = mondayOf(today);
  const weekKeys = Array.from({ length: daysBetween(mon, today) + 1 }, (_, i) => addDays(mon, i));
  const weekSessions = s.sessions.filter((x) => x.date >= mon && x.date <= today);
  const strength = weekSessions.filter((x) => x.type === 'strength').length;
  const walkMin = weekSessions.filter((x) => ['walk', 'long', 'hike', 'run'].includes(x.type)).reduce((a, x) => a + (x.minutes || 0), 0);
  const mobility = weekKeys.filter((k) => s.days[k]?.mobility).length;
  const stepDays = weekKeys.map((k) => s.days[k]?.steps).filter(Boolean);
  const avgSteps = stepDays.length ? Math.round(stepDays.reduce((a, b) => a + b, 0) / stepDays.length) : 0;
  const ms = s.milestones || {};
  const nextMilestone = HIKING_MILESTONES.find((m) => !ms[m.id]);
  const sessions = [...s.sessions].sort((a, b) => (a.date + a.createdAt < b.date + b.createdAt ? 1 : -1));
  const shown = ui.showAllHistory ? sessions : sessions.slice(0, 10);
  const weights = Object.entries(s.days).filter(([, d]) => d.weight).sort(([a], [b]) => (a < b ? -1 : 1));
  const lastW = weights.at(-1);
  const firstW = weights[0];

  return `<main class="screen">
    <header class="titlebar"><div><p class="eyebrow">This week</p><h1>Progress</h1></div></header>
    <div class="stats">
      <div class="stat"><b>${strength}</b><span>strength sessions</span></div>
      <div class="stat"><b>${walkMin}</b><span>minutes on foot</span></div>
      <div class="stat"><b>${mobility}/${weekKeys.length}</b><span>mornings with mobility</span></div>
      <div class="stat"><b>${avgSteps ? fmtNum(avgSteps) : '–'}</b><span>average steps</span></div>
    </div>

    <section class="card stack">
      <div class="row-between"><h3>Consistency</h3><span class="meta">8 weeks</span></div>
      ${consistencyGrid(s, today)}
      <div class="key"><span><i style="height:10px;width:10px;border-radius:3px"></i>Session</span><span><i style="height:10px;width:10px;border-radius:3px;background:transparent;box-shadow:inset 0 0 0 2px var(--accent)"></i>Mobility only</span></div>
    </section>

    <section class="card stack">
      <div class="row-between"><h3>Steps</h3><span class="meta">14 days · dashed line = target</span></div>
      ${stepsChart(s, today)}
    </section>

    <section class="card stack">
      <div class="row-between"><h3>Knee and ribs</h3><span class="meta">Morning check-ins</span></div>
      ${symptomChart(s, today)}
      <div class="key"><span><i></i>Knee</span><span><i class="ribs"></i>Ribs</span></div>
    </section>

    <h2 class="section-title">Hiking readiness</h2>
    <p class="section-sub">${nextMilestone ? `Next to work toward: ${esc(nextMilestone.label.toLowerCase())}.` : 'All milestones ticked.'}</p>
    <div class="list">${HIKING_MILESTONES.map((m) => `<button class="list-row" data-action="milestone" data-id="${m.id}">
      <span class="check ${ms[m.id] ? 'on' : ''}">${ms[m.id] ? icon.check : ''}</span>
      <span class="grow"><span class="title" style="font-size:16px">${esc(m.label)}</span>${ms[m.id] ? `<span class="sub">${esc(fmtDate(ms[m.id], { day: 'numeric', month: 'short', year: 'numeric' }))}</span>` : ''}</span></button>`).join('')}</div>
    <p class="footnote">These show your training, not whether a route is safe. Readiness also depends on the route, weather, terrain, gear and experience.</p>
    <details class="card"><summary class="row-between"><h3>Training without mountains nearby</h3>${icon.chev}</summary>
      <ul class="bullets" style="margin-top:12px">${FLAT_TERRAIN_TIPS.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></details>

    <h2 class="section-title">History</h2>
    ${sessions.length ? `<div class="list">${shown.map((x) => `<button class="list-row" data-action="session" data-id="${x.id}">
      <span class="grow"><span class="title">${esc(x.title)}</span>
      <span class="sub">${esc(fmtDate(x.date))} · ${x.minutes || '?'} min${x.distanceKm ? ` · ${x.distanceKm} km` : ''}${x.feedback ? ` · knee ${symptomLabel(x.feedback.knee)} · ribs ${symptomLabel(x.feedback.ribs)}` : ''}</span></span>${icon.chev}</button>`).join('')}</div>
      ${sessions.length > 10 && !ui.showAllHistory ? `<button class="btn-plain" data-action="all-history">Show all ${sessions.length}</button>` : ''}`
    : '<p class="section-sub">Nothing logged yet. Finished sessions appear here.</p>'}

    <section class="card stack">
      <div class="row-between"><h3>Body weight</h3><span class="meta">Optional</span></div>
      ${lastW ? `<p class="meta">Latest ${lastW[1].weight} kg on ${esc(fmtDate(lastW[0]))}${firstW !== lastW ? ` · ${(lastW[1].weight - firstW[1].weight > 0 ? '+' : '')}${(lastW[1].weight - firstW[1].weight).toFixed(1)} kg since ${esc(fmtDate(firstW[0], { day: 'numeric', month: 'short' }))}` : ''}</p>` : ''}
      <form class="inline-form" data-form="weight"><input class="input" name="weight" inputmode="decimal" placeholder="kg" aria-label="Body weight in kg"><button class="btn btn-secondary" type="submit">Save</button></form>
    </section>
  </main>`;
}

function sessionSheet(id) {
  const x = getState().sessions.find((y) => y.id === id);
  if (!x) return;
  const f = x.feedback || {};
  const items = (x.items || []).map((i) => `<li>${esc(EXERCISE_BY_ID[i.exId]?.name || i.exId)} · ${i.sets} set${i.sets === 1 ? '' : 's'}</li>`).join('');
  openSheet(`<div class="stack">
    <h2>${esc(x.title)}</h2>
    <p class="meta">${esc(fmtDate(x.date, { weekday: 'long', day: 'numeric', month: 'long' }))} · ${x.minutes || '?'} min${x.distanceKm ? ` · ${x.distanceKm} km` : ''}</p>
    ${x.feedback ? `<p>Effort: ${esc({ easy: 'easy', right: 'about right', hard: 'hard', 'too-hard': 'too hard' }[f.difficulty] || '–')} · knee ${symptomLabel(f.knee)} · ribs ${symptomLabel(f.ribs)} · felt ${esc(f.after || '–')} afterwards</p>` : ''}
    ${items ? `<ul class="bullets">${items}</ul>` : ''}
    <button class="btn btn-danger btn-block" data-action="delete-session" data-id="${x.id}">Delete</button>
    <button class="btn btn-plain" data-action="close-sheet">Close</button>
  </div>`);
}

// ── Settings ─────────────────────────────
function settingsSheet() {
  const s = getState();
  const p = s.profile;
  const status = ribStatus(p);
  openSheet(`<div class="stack">
    <h2>Settings</h2>
    <div><span class="field-label">Appearance</span>
      <div class="seg">${[['system', 'System'], ['light', 'Light'], ['dark', 'Dark']].map(([v, l]) => `<button data-action="theme" data-value="${v}" aria-pressed="${(s.settings?.theme || 'system') === v}">${l}</button>`).join('')}</div></div>
    <form data-form="target" class="stack-s"><label class="field-label" for="st">Daily step target</label>
      <div class="inline-form"><input id="st" class="input" name="target" inputmode="numeric" value="${p.stepTarget}"><button class="btn btn-secondary" type="submit">Save</button></div>
      <p class="field-hint">10,000 is the goal. A lower target while recovering is fine.</p></form>
    <form data-form="trip" class="stack-s"><label class="field-label" for="trip">Trip month</label>
      <div class="inline-form"><input id="trip" class="input" type="month" name="trip" value="${esc(p.tripDate || '')}"><button class="btn btn-secondary" type="submit">Save</button></div></form>
    <div class="stack-s"><span class="field-label">Programme</span>
      <p class="meta">${p.programStartedAt ? `Started ${esc(fmtDate(p.programStartedAt, { day: 'numeric', month: 'long', year: 'numeric' }))}` : 'Test mode: nothing logged counts yet'}</p>
      <button class="btn btn-secondary btn-block" data-action="start-programme">${p.programStartedAt ? 'Restart programme' : 'Start programme'}</button></div>
    <div class="stack-s"><span class="field-label">Safety check</span>
      <p class="meta">Ribs: ${status === 'protect' ? 'not cleared yet' : status === 'cleared' ? 'cleared, still recovering' : 'recovered'} · last updated ${esc(p.assessment?.updatedAt ? fmtDate(p.assessment.updatedAt) : '–')}</p>
      <button class="btn btn-secondary btn-block" data-action="redo-safety">Review answers</button></div>
    <div class="stack-s"><span class="field-label">Pain guide</span><p class="meta">${esc(PAIN_GUIDE)}</p></div>
    <div class="stack-s"><span class="field-label">Your data</span>
      <p class="meta">Everything is stored on this device only. Export a backup now and then. It also moves your history to a new phone.</p>
      <div class="btn-row"><button class="btn btn-secondary" data-action="export">Export</button>
      <label class="btn btn-secondary">Import<input type="file" accept="application/json,.json" data-input="import" class="sr"></label></div>
      <button class="btn btn-danger btn-block" data-action="erase">Erase all data</button></div>
    <button class="btn btn-plain" data-action="close-sheet">Done</button>
  </div>`);
}

// ── Actions ─────────────────────────────
function saveSession(obj) {
  const session = { id: uid(), date: dateKey(), createdAt: new Date().toISOString(), ...obj };
  let changes = [];
  ui.force = null;
  ui.minutes = null;
  update((s) => {
    s.sessions.push(session);
    if (session.type === 'strength') changes = applyProgression(s, session);
  });
  if (changes.length) {
    openSheet(`<div class="stack">
      <h2>${changes[0].dir > 0 ? 'Stepping up' : 'Easing off'}</h2>
      <div class="list">${changes.map((c) => `<div class="list-row"><span class="grow"><span class="title">${esc(EXERCISE_BY_ID[c.to].name)}</span>
        <span class="sub">${c.dir > 0 ? 'replaces' : 'instead of'} ${esc(EXERCISE_BY_ID[c.from].name)} from your next session</span></span></div>`).join('')}</div>
      <p class="subhead">${changes[0].dir > 0 ? 'Three good sessions in a row. You can always tap Easier during the workout.' : 'You marked it as too hard, so the easier version comes back for now.'}</p>
      <button class="btn btn-primary btn-block" data-action="close-sheet">OK</button></div>`);
  }
}

function startStrength() {
  const s = getState();
  const today = dateKey();
  const rec = recommend(s, today, ui.minutes, ui.force);
  if (rec.kind !== 'strength') return;
  const w = rec.workout;
  openPlayer({
    title: rec.title, items: w.items, workoutKey: w.key, limits: rec.limits,
    onSwap: (slot, idx) => update((st) => { st.slotLevels[slot] = idx; }),
    onFinish: (doneItems, minutes) => openFeedback({
      type: 'strength', minutes,
      onSave: (r) => saveSession({ type: 'strength', workout: w.key, title: `Strength ${w.key} · ${w.title}`, minutes, items: doneItems, feedback: r.feedback }),
    }),
  });
}

function startMobility() {
  const s = getState();
  const d = s.days[dateKey()] || {};
  const limits = computeLimits(s, d.checkin || defaultCheckin(s.profile));
  const mob = buildMobility(limits);
  openPlayer({
    title: 'Morning mobility', items: mob.items, limits,
    onFinish: (doneItems) => { if (doneItems.length) update(() => { day(dateKey()).mobility = true; }); },
  });
}

function startWalk(kind, minutes) {
  const walk = { startedAt: Date.now(), kind, title: kind === 'long' ? 'Longer walk' : 'Walk', target: minutes };
  update((s) => { s.activeWalk = walk; });
  resumeWalk(walk);
}

function resumeWalk(walk) {
  openWalk({
    walk,
    onFinish: (m) => {
      update((s) => { delete s.activeWalk; });
      openFeedback({
        type: walk.kind, minutes: m, askMinutes: true, askDistance: true,
        onSave: (r) => saveSession({ type: walk.kind, title: walk.title, minutes: r.minutes, distanceKm: r.distanceKm, feedback: r.feedback }),
      });
    },
    onCancel: () => update((s) => { delete s.activeWalk; }),
  });
}

function download(name, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

function startProgrammeSheet() {
  const p = getState().profile;
  const today = dateKey();
  const mon = addDays(mondayOf(today), 7);
  const choices = [
    { v: today, label: 'Today', sub: fmtDate(today, { weekday: 'long', day: 'numeric', month: 'long' }) },
    { v: addDays(today, 1), label: 'Tomorrow', sub: fmtDate(addDays(today, 1), { weekday: 'long', day: 'numeric', month: 'long' }) },
    { v: mon, label: 'Next Monday', sub: fmtDate(mon, { day: 'numeric', month: 'long' }) },
  ];
  let pick = today;
  const draw = () => {
    const el = openSheet(`<div class="stack">
      <div class="stack-s"><h2>${p.programStartedAt ? 'Restart the programme' : 'Start the programme'}</h2>
        <p class="subhead">Day 1 becomes week 1 of phase 1. Everything logged so far (sessions, check-ins, steps, step-ups) is cleared. Your safety answers and settings stay.</p></div>
      <div class="stack-s">${choices.map((c) => `<button class="option" data-start="${c.v}" aria-pressed="${pick === c.v}">
        <span class="check ${pick === c.v ? 'on' : ''}">${pick === c.v ? icon.check : ''}</span><span class="grow"><span style="display:block">${c.label}</span><span class="footnote">${esc(c.sub)}</span></span></button>`).join('')}</div>
      ${p.programStartedAt ? '<button class="btn btn-secondary btn-block" data-action="export">Export a backup first</button>' : ''}
      <button class="btn btn-primary btn-block" data-start-go>Start on ${esc(choices.find((c) => c.v === pick).label.toLowerCase())}</button>
      <button class="btn-plain" data-action="close-sheet">Not yet</button>
    </div>`);
    el.onclick = (ev) => {
      const b = ev.target.closest('[data-start]');
      if (b) { pick = b.dataset.start; draw(); return; }
      if (ev.target.closest('[data-start-go]')) {
        closeSheet();
        ui.force = null; ui.minutes = null; ui.planWeek = 0; ui.planDay = null;
        startProgramme(pick);
        location.hash = '#/today';
      }
    };
  };
  draw();
}

const actions = {
  'start-programme': () => startProgrammeSheet(),
  'close-sheet': () => closeSheet(),
  settings: () => settingsSheet(),
  safety: (el, ev) => { ev.preventDefault(); showSafety(); },
  checkin: () => checkinSheet(),
  'goto-day': (el) => { ui.planDay = el.dataset.date; ui.planWeek = 0; location.hash = '#/plan'; },
  'pick-day': (el) => { ui.planDay = el.dataset.date; render(); },
  'plan-week': (el) => { ui.planWeek = (ui.planWeek || 0) + Number(el.dataset.step); ui.planDay = null; render(); },
  force: (el) => { ui.force = el.dataset.kind; ui.minutes = null; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
  unforce: () => { ui.force = null; ui.minutes = null; render(); },
  'start-strength': () => startStrength(),
  'start-mobility': () => startMobility(),
  'start-walk': (el) => startWalk(el.dataset.kind, Number(el.dataset.minutes)),
  'toggle-mobility': () => update(() => { const d = day(dateKey()); d.mobility = !d.mobility; }),
  log: () => openFeedback({
    heading: 'Log activity', askType: true, askMinutes: true,
    onSave: (r) => saveSession({ type: r.type, title: SESSION_TITLES[r.type], minutes: r.minutes, distanceKm: r.distanceKm, feedback: r.feedback }),
  }),
  'edit-day': (el) => editDaySheet(el.dataset.date),
  'set-plan': (el) => {
    const { date, type } = el.dataset;
    update((s) => { if (type) s.planOverrides[date] = type; else delete s.planOverrides[date]; });
    closeSheet();
  },
  'advance-phase': () => {
    const s = getState();
    const pp = phaseProgress(s, dateKey());
    const msg = pp.ready ? `Move to phase ${s.profile.phase + 1}?` : `Not all checks are met yet. Move to phase ${s.profile.phase + 1} anyway?`;
    if (confirm(msg)) update((st) => { st.profile.phase += 1; st.profile.phaseStartedAt = dateKey(); });
  },
  'regress-phase': () => {
    const s = getState();
    if (confirm(`Step back to phase ${s.profile.phase - 1}? Your history stays.`)) update((st) => { st.profile.phase -= 1; st.profile.phaseStartedAt = dateKey(); });
  },
  milestone: (el) => update((s) => {
    const id = el.dataset.id;
    if (s.milestones[id]) delete s.milestones[id]; else s.milestones[id] = dateKey();
  }),
  session: (el) => sessionSheet(el.dataset.id),
  'delete-session': (el) => {
    if (!confirm('Delete this session?')) return;
    update((s) => { s.sessions = s.sessions.filter((x) => x.id !== el.dataset.id); });
    closeSheet();
  },
  'clear-ex-filters': () => { ui.exQuery = ''; ui.exFilter = 'all'; ui.exArea = null; render(); },
  'all-history': () => { ui.showAllHistory = true; render(); },
  theme: (el) => { update((s) => { s.settings = { ...s.settings, theme: el.dataset.value }; }); settingsSheet(); },
  'redo-safety': () => { closeSheet(); ui.ob = createOnboarding(getState().profile); ui.obRedo = true; render(); window.scrollTo(0, 0); },
  export: () => download(`coach-backup-${dateKey()}.json`, exportJSON()),
  erase: () => {
    if (!confirm('Erase all data on this device? Export a backup first if you want to keep it.')) return;
    if (!confirm('This cannot be undone. Erase everything?')) return;
    closeSheet();
    resetAll();
    ui.ob = null; ui.obRedo = false;
    location.hash = '#/today';
  },
};

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-action]');
  if (el && actions[el.dataset.action]) { actions[el.dataset.action](el, ev); return; }

  // Onboarding
  if (ui.ob && ev.target.closest('#app')) {
    const ob = ev.target.closest('[data-ob]');
    if (ob) {
      const a = ob.dataset.ob;
      if (a === 'next') ui.ob.step += 1;
      if (a === 'back') ui.ob.step -= 1;
      if (a === 'cancel') { ui.ob = null; ui.obRedo = false; }
      if (a === 'skip') {
        ui.ob = null; ui.obRedo = false;
        update((s) => { s.profile = defaultProfile(); });
        requestPersistence();
        location.hash = '#/today';
      }
      if (a === 'finish') {
        const existing = getState().profile;
        const profile = profileFromOnboarding(ui.ob, existing);
        ui.ob = null; ui.obRedo = false;
        update((s) => { s.profile = profile; });
        requestPersistence();
        location.hash = '#/today';
      }
      render();
      window.scrollTo(0, 0);
      return;
    }
    const opt = ev.target.closest('[data-seg],[data-multi]');
    if (opt && handleOnboardingInput(ui.ob, opt)) {
      const y = window.scrollY;
      render();
      window.scrollTo(0, y);
    }
    return;
  }

  // Segmented controls on the main screens
  const sg = ev.target.closest('#app [data-seg]');
  if (!sg) return;
  const name = sg.dataset.seg;
  const v = sg.dataset.value;
  if (name === 'minutes') ui.minutes = Number(v);
  else if (name === 'exFilter') ui.exFilter = v;
  else if (name === 'exArea') {
    // Update in place so the chip row keeps its horizontal scroll position.
    ui.exArea = ui.exArea === v ? null : v;
    document.querySelectorAll('[data-seg="exArea"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === ui.exArea)));
    document.getElementById('ex-list').innerHTML = exListHTML();
    return;
  }
  render();
});

document.addEventListener('submit', (ev) => {
  const f = ev.target.closest('[data-form]');
  if (!f) return;
  ev.preventDefault();
  const kind = f.dataset.form;
  const val = new FormData(f);
  if (kind === 'steps') {
    const n = parseInt(String(val.get('steps')).replace(/[^0-9]/g, ''), 10);
    if (Number.isFinite(n)) update(() => { day(dateKey()).steps = n; });
  } else if (kind === 'weight') {
    const w = parseFloat(String(val.get('weight')).replace(',', '.'));
    if (w > 20 && w < 400) update(() => { day(dateKey()).weight = Math.round(w * 10) / 10; });
  } else if (kind === 'target') {
    const n = parseInt(String(val.get('target')).replace(/[^0-9]/g, ''), 10);
    if (n >= 1000) { update((s) => { s.profile.stepTarget = n; }); closeSheet(); }
  } else if (kind === 'trip') {
    update((s) => { s.profile.tripDate = String(val.get('trip') || ''); });
    closeSheet();
  }
});

document.addEventListener('input', (ev) => {
  const k = ev.target.dataset?.input;
  if (k === 'exQuery') {
    ui.exQuery = ev.target.value;
    const list = document.getElementById('ex-list');
    if (list) list.innerHTML = exListHTML();
    const areas = document.getElementById('ex-areas');
    if (areas) areas.innerHTML = areaChips();
  }
});

document.addEventListener('change', async (ev) => {
  if (ev.target.dataset?.input !== 'import') return;
  const file = ev.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    if (!confirm('Replace all data on this device with this backup?')) return;
    importJSON(text);
    closeSheet();
    alert('Backup imported.');
  } catch (e) {
    alert(`Could not import: ${e.message}`);
  }
});

window.addEventListener('hashchange', () => render());
document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
subscribe(() => render());
render();

const walk = getState().activeWalk;
if (walk && getState().profile) resumeWalk(walk);

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
