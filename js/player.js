// Full-screen session player (strength + mobility) and the walk timer.

import { EXERCISE_BY_ID } from './data/exercises.js';
import { WORKOUTS } from './data/program.js';
import { ANIMATIONS } from './data/animations.js';
import { isAllowed } from './engine.js';
import { esc, icon, media, doseText, mmss, openSheet } from './ui.js';
import { showSafety } from './feedback.js';

const root = () => document.getElementById('player-root');

// ── Sound + screen ─────────────────────────────
let audio;
function beep(freq = 880, ms = 160) {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, audio.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + ms / 1000);
    o.connect(g).connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + ms / 1000 + 0.05);
  } catch { /* sound is optional */ }
}
function unlockAudio() {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    audio.resume?.();
  } catch { /* ignore */ }
}
let wakeLock;
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    else { await wakeLock?.release(); wakeLock = null; }
  } catch { /* not supported */ }
}

// ── Session player ─────────────────────────────
// opts: { title, items, workoutKey?, limits, onSwap(slot, idx), onFinish(doneItems, minutes), onExit() }
export function openPlayer(opts) {
  const items = opts.items.map((i) => ({ ...i }));
  const done = items.map(() => 0);
  const s = { i: 0, set: 1, side: 0, mode: 'work', ends: 0, remaining: 0, running: false, startedAt: Date.now() };
  let tick;

  keepAwake(true);
  render();

  function item() { return items[s.i]; }
  function ex() { return EXERCISE_BY_ID[item().exId]; }

  function slotOptions(it) {
    if (!it.slot || !opts.workoutKey) return null;
    const slot = WORKOUTS[opts.workoutKey].slots.find((x) => x.key === it.slot);
    return slot || null;
  }
  function swapTarget(dir) {
    const slot = slotOptions(item());
    if (!slot) return -1;
    let idx = slot.options.indexOf(item().exId) + dir;
    while (idx >= 0 && idx < slot.options.length) {
      if (isAllowed(EXERCISE_BY_ID[slot.options[idx]], opts.limits)) return idx;
      idx += dir;
    }
    return -1;
  }
  function swap(dir) {
    const idx = swapTarget(dir);
    if (idx < 0) return;
    const slot = slotOptions(item());
    const next = EXERCISE_BY_ID[slot.options[idx]];
    Object.assign(items[s.i], {
      exId: next.id, reps: next.dose.reps, seconds: next.dose.seconds, perSide: !!next.dose.perSide, rest: next.dose.rest,
    });
    opts.onSwap?.(slot.key, idx);
    s.set = 1; s.side = 0; s.mode = 'work'; stopTimer();
    render();
  }

  function startTimer(seconds, onDone) {
    stopTimer();
    s.ends = Date.now() + seconds * 1000;
    s.remaining = seconds;
    s.running = true;
    tick = setInterval(() => {
      s.remaining = (s.ends - Date.now()) / 1000;
      if (s.remaining <= 3.05 && s.remaining > 0 && Math.abs(s.remaining - Math.round(s.remaining)) < 0.13) beep(660, 80);
      if (s.remaining <= 0) { stopTimer(); beep(990, 260); onDone(); return; }
      const t = root().querySelector('[data-timer]');
      if (t) t.textContent = mmss(Math.ceil(s.remaining));
    }, 125);
  }
  function stopTimer() { clearInterval(tick); s.running = false; }
  function pauseTimer() {
    if (!s.running) return;
    s.remaining = (s.ends - Date.now()) / 1000;
    stopTimer();
    s.paused = true;
    s.mode = 'work';
    render();
  }

  function setDone() {
    done[s.i] = Math.max(done[s.i], s.set);
    const it = item();
    if (s.set < it.sets) {
      s.set += 1; s.side = 0;
      if (it.rest > 0) {
        s.mode = 'rest';
        startTimer(it.rest, () => { s.mode = 'work'; render(); });
        render();
        return;
      }
      render();
      return;
    }
    nextItem(true);
  }

  function nextItem(fromDone) {
    stopTimer();
    if (s.i >= items.length - 1) return finish();
    const restAfter = fromDone ? item().rest : 0;
    s.i += 1; s.set = 1; s.side = 0; s.paused = false;
    if (restAfter > 0) {
      s.mode = 'rest';
      startTimer(restAfter, () => { s.mode = 'work'; render(); });
      render();
    } else {
      s.mode = 'work';
      render();
    }
  }

  function prevItem() {
    stopTimer();
    if (s.i === 0) return;
    s.i -= 1; s.set = 1; s.side = 0; s.mode = 'work'; s.paused = false;
    render();
  }

  function startWorkTimer() {
    const it = item();
    unlockAudio();
    const secs = s.paused ? s.remaining : it.seconds;
    s.paused = false;
    s.mode = 'timing';
    startTimer(secs, () => {
      if (it.perSide && s.side === 0) { s.side = 1; s.mode = 'work'; render(); return; }
      s.mode = 'work';
      setDone();
    });
    render();
  }

  function finish() {
    stopTimer();
    keepAwake(false);
    const minutes = Math.max(1, Math.round((Date.now() - s.startedAt) / 60000));
    const doneItems = items.map((it, k) => ({ exId: it.exId, slot: it.slot, sets: done[k] })).filter((d) => d.sets > 0);
    close();
    opts.onFinish(doneItems, minutes);
  }

  function close() {
    stopTimer();
    keepAwake(false);
    root().innerHTML = '';
    document.body.style.overflow = '';
  }

  function askExit() {
    const any = done.some((d) => d > 0);
    openSheet(`<div class="stack">
      <h2>End session?</h2>
      <p class="muted">${any ? 'You can save what you have done so far.' : 'Nothing has been recorded yet.'}</p>
      ${any ? '<button class="btn btn-primary btn-block" data-pl="save-partial">Save and finish</button>' : ''}
      <button class="btn btn-danger btn-block" data-pl="discard">Discard</button>
      <button class="btn btn-plain" data-action="close-sheet">Keep going</button>
    </div>`);
    const el = document.querySelector('#sheet-root .sheet');
    el.addEventListener('click', (e) => {
      const a = e.target.closest('[data-pl]')?.dataset.pl;
      if (a === 'save-partial') { document.getElementById('sheet-root').innerHTML = ''; finish(); }
      if (a === 'discard') { document.getElementById('sheet-root').innerHTML = ''; close(); opts.onExit?.(); }
    });
  }

  function showInfo() {
    const e = ex();
    openSheet(`<div class="stack">
      <h2>${esc(e.name)}</h2>
      ${media(e)}
      <div class="stack-s"><h3>Starting position</h3><p>${esc(e.start)}</p></div>
      <div class="stack-s"><h3>How to do it</h3><ol class="steps">${e.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>
      <div class="stack-s"><h3>Common mistakes</h3><ul class="bullets">${e.mistakes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      ${e.safety ? `<div class="banner warn">${esc(e.safety)}</div>` : ''}
      <button class="btn btn-secondary btn-block" data-action="close-sheet">Close</button>
    </div>`);
  }

  function render() {
    document.body.style.overflow = 'hidden';
    const it = item();
    const e = ex();
    const bars = items.map((_, k) => `<span class="${k < s.i ? 'done' : k === s.i ? 'now' : ''}"></span>`).join('');
    const top = `<div class="player-top">
        <button class="icon-btn" data-pl="exit" aria-label="End session">${icon.close}</button>
        <div class="player-progress" aria-label="Exercise ${s.i + 1} of ${items.length}">${bars}</div>
        <button class="icon-btn" data-pl="safety" aria-label="When to stop">${icon.info}</button>
      </div>`;

    if (s.mode === 'rest') {
      const nextEx = EXERCISE_BY_ID[items[s.i].exId];
      root().innerHTML = `<div class="player"><div class="player-inner">${top}
        <div class="rest">
          <p class="kicker">Rest</p>
          <div class="timer" data-timer>${mmss(Math.ceil(s.remaining))}</div>
          <p class="next">Next: ${esc(nextEx.name)}${s.set > 1 ? ` · set ${s.set} of ${items[s.i].sets}` : ''}</p>
        </div>
        <div class="player-actions">
          <button class="btn btn-secondary btn-block" data-pl="skip-rest">Skip rest</button>
        </div></div></div>`;
      return;
    }

    const timed = !!it.seconds;
    const sideLabel = it.perSide ? (s.side === 0 ? 'Left side' : 'Right side') : '';
    const setLine = `${it.warmup ? 'Warm-up' : `Set ${s.set} of ${it.sets}`} · ${doseText(it)}${e.dose.note ? ` (${esc(e.dose.note)})` : ''}`;
    const canEasier = swapTarget(-1) >= 0;
    const canHarder = swapTarget(1) >= 0;
    let main;
    if (timed) {
      const shown = s.mode === 'timing' ? Math.ceil(s.remaining) : s.paused ? Math.ceil(s.remaining) : it.seconds;
      main = `<div class="stack-s"><div class="timer" data-timer>${mmss(shown)}</div>
        <p class="timer-sub">${esc(sideLabel)}</p></div>`;
    } else main = '';

    const primary = timed
      ? (s.mode === 'timing'
        ? `<button class="btn btn-secondary btn-block" data-pl="pause">${icon.pause} Pause</button>`
        : `<button class="btn btn-primary btn-block" data-pl="start-timer">${s.paused ? 'Resume' : s.side === 1 ? 'Start right side' : 'Start timer'}</button>`)
      : `<button class="btn btn-primary btn-block" data-pl="set-done">${s.set < it.sets ? 'Set done' : s.i < items.length - 1 ? 'Done · next exercise' : 'Done · finish'}</button>`;

    root().innerHTML = `<div class="player"><div class="player-inner">${top}
      ${media(e, { compact: true })}
      <div class="stack-s">
        <p class="kicker">${s.i + 1} of ${items.length}</p>
        <h2>${esc(e.name)}</h2>
        <p class="dose-line">${setLine}</p>
        ${e.mediaNote && !ANIMATIONS[e.id] ? `<p class="note">${esc(e.mediaNote)}</p>` : ''}
      </div>
      ${main}
      <ol class="cues">${e.steps.map((x, k) => `<li><span>${k + 1}</span>${esc(x)}</li>`).join('')}</ol>
      <div class="player-actions">
        ${primary}
        <div class="player-tools">
          <button class="tool" data-pl="prev" ${s.i === 0 ? 'disabled' : ''}>${icon.prev}Back</button>
          <button class="tool" data-pl="easier" ${canEasier ? '' : 'disabled'}>${icon.easier}Easier</button>
          <button class="tool" data-pl="harder" ${canHarder ? '' : 'disabled'}>${icon.harder}Harder</button>
          <button class="tool" data-pl="skip">${icon.skip}Skip</button>
        </div>
        <button class="btn btn-plain" data-pl="info">How to do it</button>
      </div>
    </div></div>`;
  }

  root().onclick = (ev) => {
    const a = ev.target.closest('[data-pl]')?.dataset.pl;
    if (!a) return;
    unlockAudio();
    if (a === 'exit') askExit();
    else if (a === 'safety') showSafety();
    else if (a === 'set-done') setDone();
    else if (a === 'start-timer') startWorkTimer();
    else if (a === 'pause') pauseTimer();
    else if (a === 'skip-rest') { stopTimer(); s.mode = 'work'; render(); }
    else if (a === 'skip') nextItem(false);
    else if (a === 'prev') prevItem();
    else if (a === 'easier') swap(-1);
    else if (a === 'harder') swap(1);
    else if (a === 'info') showInfo();
  };
}

// ── Walk timer ─────────────────────────────
// The start time is stored, so the timer survives the screen locking or the app reloading.
// opts: { walk: {startedAt, title, target}, onFinish(minutes), onCancel() }
export function openWalk(opts) {
  const w = opts.walk;
  let tick;
  keepAwake(true);
  document.body.style.overflow = 'hidden';
  root().innerHTML = `<div class="player"><div class="player-inner">
    <div class="player-top">
      <span></span>
      <button class="icon-btn" data-wk="safety" aria-label="When to stop">${icon.info}</button>
    </div>
    <div class="rest">
      <p class="kicker">${esc(w.title)}</p>
      <div class="timer" data-timer>0:00</div>
      <p class="next">Target about ${w.target} min · easy pace, you can talk in full sentences</p>
      <div class="bar" style="width:100%;max-width:320px"><span data-bar style="width:0%"></span></div>
    </div>
    <div class="player-actions">
      <button class="btn btn-primary btn-block" data-wk="finish">Finish</button>
      <button class="btn btn-plain" data-wk="cancel">Cancel walk</button>
    </div>
  </div></div>`;
  const update = () => {
    const sec = (Date.now() - w.startedAt) / 1000;
    const t = root().querySelector('[data-timer]');
    if (!t) return;
    const h = Math.floor(sec / 3600);
    t.textContent = h ? `${h}:${mmss(sec % 3600).padStart(5, '0')}` : mmss(sec);
    root().querySelector('[data-bar]').style.width = `${Math.min(100, (sec / 60 / w.target) * 100)}%`;
  };
  update();
  tick = setInterval(update, 1000);
  const close = () => { clearInterval(tick); keepAwake(false); root().innerHTML = ''; document.body.style.overflow = ''; };
  root().onclick = (ev) => {
    const a = ev.target.closest('[data-wk]')?.dataset.wk;
    if (a === 'safety') showSafety();
    if (a === 'finish') { const m = Math.max(1, Math.round((Date.now() - w.startedAt) / 60000)); close(); opts.onFinish(m); }
    if (a === 'cancel' && confirm('Cancel this walk without saving?')) { close(); opts.onCancel(); }
  };
}
