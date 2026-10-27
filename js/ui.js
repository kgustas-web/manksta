// Small rendering helpers shared by the screens.

import { bodyMap } from './body.js';
import { ANIMATIONS } from './data/animations.js';
import { animationSVG, mountAnimation, drawFigure } from './rig.js';

import { EXERCISE_BY_ID as EX_LOOKUP } from './data/exercises.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;

export const icon = {
  today: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>'),
  plan: svg('<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  exercises: svg('<circle cx="12" cy="5" r="2"/><path d="M12 8v6M12 14l-3 7M12 14l3 7M6 10.5l6-2 6 2"/>'),
  progress: svg('<path d="M4 19.5h16"/><path d="M5 15l4.5-4.5 3.5 3 6-6.5"/><path d="M15 7h4v4"/>'),
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  back: svg('<path d="M15 5l-7 7 7 7"/>', 'width="22" height="22"'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 'stroke-width="2.6"'),
  chev: `<svg class="chev" viewBox="0 0 8 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 1l6 6-6 6"/></svg>`,
  prev: svg('<path d="M15 5l-7 7 7 7"/>'),
  skip: svg('<path d="M5 5l7 7-7 7M13 5l7 7-7 7"/>'),
  easier: svg('<path d="M12 5v14M6 13l6 6 6-6"/>'),
  harder: svg('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/>'),
  pause: svg('<path d="M9 5v14M15 5v14"/>'),
  play: svg('<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>'),
  next: svg('<path d="M9 5l7 7-7 7"/>'),
  strength: svg('<path d="M6.5 7.5v9M17.5 7.5v9M3.5 10v4M20.5 10v4M6.5 12h11"/>'),
  walk: svg('<circle cx="13" cy="4.5" r="1.8"/><path d="M10 21l2.5-6 2.5 2v4M9 11l3-3 3 1 2 3M12.5 15l-1-4M9 11l-1 3"/>'),
  long: svg('<path d="M3 19l6-10 4 6 2.5-3.5L21 19z"/>'),
  rest: svg('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'),
  clock: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  mobility: svg('<circle cx="12" cy="5" r="2"/><path d="M4 9.5c3 1.5 13 1.5 16 0M12 11v4l-3 6M12 15l3 6"/>'),
};

export function seg(name, options, value, attrs = '') {
  return `<div class="seg" role="group" ${attrs}>${options.map((o) =>
    `<button type="button" data-seg="${esc(name)}" data-value="${esc(o.v)}" aria-pressed="${String(o.v) === String(value)}">${esc(o.label)}</button>`).join('')}</div>`;
}

export function chips(name, options, value) {
  return `<div class="chips" role="group">${options.map((o) =>
    `<button type="button" class="chip" data-seg="${esc(name)}" data-value="${esc(o.v)}" aria-pressed="${String(o.v) === String(value)}">${esc(o.label)}</button>`).join('')}</div>`;
}

// Two-frame demonstration (start → end) or a clearly labelled gap.
function photos(ex, compact) {
  const a = `media/${ex.media}/0.jpg`, b = `media/${ex.media}/1.jpg`;
  return `<figure class="stack-s" style="margin:0">
    <div class="frames">
      <img src="${a}" alt="${esc(ex.name)}: start position" loading="lazy">
      <img class="f1" src="${b}" alt="${esc(ex.name)}: end position" loading="lazy">
      <div class="frame-label" aria-hidden="true"><span class="l0">Start</span><span class="l1">End</span></div>
    </div>
    ${ex.mediaNote && !compact ? `<figcaption class="note">${esc(ex.mediaNote)}</figcaption>` : ''}
  </figure>`;
}

// Animated illustration when one exists (photos stay available as a reference),
// otherwise the photo pair, otherwise a clearly labelled gap.
export function media(ex, { compact = false } = {}) {
  const anim = ANIMATIONS[ex.id];
  if (anim) {
    const ref = !compact && ex.media
      ? `<details class="stack-s"><summary class="footnote" style="padding:2px 4px">Show reference photos</summary><div style="margin-top:8px">${photos(ex, false)}</div></details>` : '';
    const cap = anim.caption ? `<p class="footnote" style="text-align:center">${esc(anim.caption)}</p>` : '';
    return `<div class="stack-s"><div data-anim="${ex.id}">${animationSVG(anim, ex.muscles, { label: `${ex.name}, animated demonstration` })}</div>${cap}${ref}</div>`;
  }
  if (!ex.media) {
    return `<div class="no-media">${bodyMap(ex.muscles, { labels: false })}<div><strong>No verified demonstration yet.</strong><br>Follow the written steps below.</div></div>`;
  }
  return photos(ex, compact);
}

export function thumb(ex) {
  const anim = ANIMATIONS[ex.id];
  if (anim) {
    const pose = anim.frames[anim.keyFrame ?? 1].pose;
    return `<svg class="thumb rig" viewBox="${anim.viewBox || '0 -6 240 192'}" aria-hidden="true">${drawFigure(pose, ex.muscles)}</svg>`;
  }
  if (ex.media) return `<img class="thumb" src="media/${ex.media}/0.jpg" alt="" loading="lazy">`;
  return `<span class="thumb">${bodyMap(ex.muscles, { labels: false })}</span>`;
}

export function doseText(item) {
  if (item.seconds) return `${item.seconds} s${item.perSide ? ' each side' : ''}`;
  return `${item.reps} reps${item.perSide ? ' each side' : ''}`;
}

export const fmtNum = (n) => Number(n || 0).toLocaleString('en-GB');
export const fmtDate = (key, opts = { weekday: 'short', day: 'numeric', month: 'short' }) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', opts);
};
export const mmss = (sec) => {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// ── Sheets ─────────────────────────────
let sheetClose = null;
export function openSheet(html, { onClose } = {}) {
  closeSheet();
  const root = document.getElementById('sheet-root');
  root.innerHTML = `<div class="backdrop" data-action="close-sheet"></div>
    <div class="sheet" role="dialog" aria-modal="true"><div class="grabber"></div>${html}</div>`;
  sheetClose = onClose || null;
  root.querySelector('.sheet').focus?.();
  return root.querySelector('.sheet');
}
export function closeSheet() {
  const root = document.getElementById('sheet-root');
  if (root) root.innerHTML = '';
  const fn = sheetClose;
  sheetClose = null;
  fn?.();
}
export function sheetEl() {
  return document.querySelector('#sheet-root .sheet');
}

// Start any animation that appears in the page, whichever screen rendered it.
if (typeof MutationObserver !== 'undefined') {
  const mountAll = () => document.querySelectorAll('[data-anim]:not([data-mounted])').forEach((el) => {
    el.dataset.mounted = '1';
    const id = el.dataset.anim;
    const ex = EX_LOOKUP[id];
    if (ex) mountAnimation(el.querySelector('[data-rig]'), ANIMATIONS[id], ex.muscles);
  });
  new MutationObserver(mountAll).observe(document.documentElement, { childList: true, subtree: true });
}
