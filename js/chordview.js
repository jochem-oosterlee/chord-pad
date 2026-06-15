// ============================================================
// CHORD VIEW — lyrics-style horizontal chord display
// ============================================================
//
// Loads AFTER seq.js and chord-pad.js so SEQ + the chord-block double
// click handlers it hooks into are already defined.
//
// Public surface:
//   showChordView, hideChordView, toggleChordView, openChordView(track)
//   renderChordView, updateChordViewPlayhead
//   focusedChordTrack
//
// The view is bound to whichever chord track was most recently focused
// (via openChordView). If none has been focused yet, falls back to the
// first chord track in the project.

SEQ.focusedChordTrackId = SEQ.focusedChordTrackId || null;
SEQ.chordViewOpen = SEQ.chordViewOpen ?? false;

let CHORDVIEW_PX_PER_BEAT = 90;
let CHORDVIEW_MIN_CARD_W  = 140;
const CHORDVIEW_PX_MIN = 30;
const CHORDVIEW_PX_MAX = 300;
// While the loop is on, render N copies of the chord row back-to-back
// so the cursor can flow rightward across "the next iteration" instead
// of snapping back to the start. _cvLoopIter rotates 0..N-1 and bumps
// each time we detect SEQ.animBeat wrapping backwards.
const CHORDVIEW_COPIES = 3;
let _cvLoopIter = 0;
let _cvLastAnimBeat = -1;

function focusedChordTrack() {
  return trackById(SEQ.focusedChordTrackId) || firstTrackOfKind('chord');
}

function showChordView() {
  SEQ.chordViewOpen = true;
  document.body.classList.remove('hide-chordview');
  const btn = document.querySelector('.header-section-toggle[data-section="chordview"]');
  btn?.classList.add('active');
  // Persist visibility — same key the section toggle handler uses.
  try {
    const KEY = 'chordpad.hiddenSections';
    const hidden = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
    hidden.chordview = false;
    localStorage.setItem(KEY, JSON.stringify(hidden));
  } catch (_) {}
  renderChordView();
}

function hideChordView() {
  SEQ.chordViewOpen = false;
  document.body.classList.add('hide-chordview');
  const btn = document.querySelector('.header-section-toggle[data-section="chordview"]');
  btn?.classList.remove('active');
  try {
    const KEY = 'chordpad.hiddenSections';
    const hidden = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
    hidden.chordview = true;
    localStorage.setItem(KEY, JSON.stringify(hidden));
  } catch (_) {}
}

function toggleChordView() {
  if (SEQ.chordViewOpen) hideChordView(); else showChordView();
}

function openChordView(track) {
  if (!track || track.kind !== 'chord') return;
  SEQ.focusedChordTrackId = track.id;
  showChordView();
  refreshChordViewTitle();
  if (typeof uiPrefsSave === 'function') uiPrefsSave();
}

function refreshChordViewTitle() {
  refreshChordViewTrackSelect();
}

// Populate the track-picker with every chord track and select the
// currently focused one. Re-rendered whenever the chord-view opens or
// the track list changes.
function refreshChordViewTrackSelect() {
  const sel = document.getElementById('seq-chordview-track-select');
  if (!sel) return;
  const chordTracks = (typeof SEQ !== 'undefined' && Array.isArray(SEQ.tracksList))
    ? SEQ.tracksList.filter(t => t.kind === 'chord')
    : [];
  const focused = focusedChordTrack();
  const focusedId = focused ? focused.id : '';
  sel.innerHTML = chordTracks.map(t =>
    `<option value="${t.id}"${t.id === focusedId ? ' selected' : ''}>${t.name}</option>`
  ).join('');
  sel.style.display = chordTracks.length > 1 ? '' : 'none';
  if (!sel.dataset.bound) {
    sel.dataset.bound = '1';
    sel.addEventListener('change', () => {
      const t = trackById(sel.value);
      if (t && t.kind === 'chord') {
        SEQ.focusedChordTrackId = t.id;
        renderChordView();
        if (typeof uiPrefsSave === 'function') uiPrefsSave();
      }
    });
  }
}

// Split a chord label into root + quality suffix and wrap the suffix
// in a `.cv-suffix` span so CSS can shrink only the suffix. The root
// is a single letter A-G, optionally followed by a `<span class="acc">`
// containing the ♭/♯ glyph (produced by formatChordRoot in chord-pad.js).
function _cvFormatChordLabel(label) {
  const m = /^([A-Ga-g](?:<span class="acc">[^<]*<\/span>)?)([\s\S]*)$/.exec(label);
  if (!m) return label;
  const root = m[1];
  const suffix = m[2];
  if (!suffix) return root;
  return root + '<span class="cv-suffix">' + suffix + '</span>';
}

// Build a single chord card for `item` at `localIdx`. Extracted so the
// treadmill can append new cards as the loop iterates without a full
// rerender.
function _makeChordviewCard(item, localIdx, iter = 0) {
  const card = document.createElement('div');
  const cardW = Math.max(CHORDVIEW_MIN_CARD_W, item.beats * CHORDVIEW_PX_PER_BEAT);
  card.className = 'chordview-card future' + (item.beats >= 2 ? ' wide' : '');
  card.dataset.iter = iter;
  card.dataset.localIdx = localIdx;
  card.dataset.start = item.start;
  card.dataset.beats = item.beats;
  card.style.minWidth = CHORDVIEW_MIN_CARD_W + 'px';
  card.style.width = cardW + 'px';
  const name = document.createElement('div');
  name.className = 'chordview-name';
  name.innerHTML = _cvFormatChordLabel(item.label || '?');
  const beats = document.createElement('div');
  beats.className = 'chordview-beats';
  beats.textContent = item.beats + 'b';
  // Beat-divider lines on every whole-beat boundary inside the card.
  // For a 4-beat chord that's 3 inner ticks at 25/50/75% — mirrors
  // the .seq-block-ticks pattern on the arrangement chord blocks.
  const wholeBeats = Math.floor(item.beats);
  if (wholeBeats > 1) {
    const ticks = document.createElement('div');
    ticks.className = 'chordview-ticks';
    for (let b = 1; b < wholeBeats; b++) {
      const tk = document.createElement('span');
      tk.className = 'chordview-tick';
      tk.style.left = ((b / item.beats) * 100) + '%';
      ticks.appendChild(tk);
    }
    card.appendChild(ticks);
  }
  card.appendChild(name);
  card.appendChild(beats);
  card.addEventListener('click', () => {
    if (typeof seqJumpToBeat === 'function') seqJumpToBeat(item.start);
  });
  return card;
}

// Render every chord block in the focused chord track as a card. Width
// scales with each chord's beats so the visual flow matches the timing.
function renderChordView() {
  const trackEl = document.getElementById('seq-chordview-track');
  if (!trackEl) return;
  trackEl.innerHTML = '';
  const trk = focusedChordTrack();
  refreshChordViewTitle();
  if (!trk) return;
  for (let iter = 0; iter < CHORDVIEW_COPIES; iter++) {
    for (let i = 0; i < trk.items.length; i++) {
      trackEl.appendChild(_makeChordviewCard(trk.items[i], i, iter));
    }
  }
  _cvLoopIter = 0;
  _cvLastAnimBeat = -1;
  // Auto-fit each label to its card — shrink font if it overflows.
  // Defer to next frame so layout has applied widths before measuring.
  requestAnimationFrame(() => _fitChordViewCards(trackEl));
  updateChordViewPlayhead();
}

// "Treadmill" the rendered row: drop the leftmost copy of cards and
// append a fresh copy at the right. Since every copy is identical,
// removing-and-appending one copy's worth shifts every card LEFT by
// exactly loopWidth in the DOM — which the cursor's transform then
// compensates for, so the user sees no change. Lets the cursor keep
// flowing rightward forever without ever snapping back.
function _cvTreadmill(trackEl, trk) {
  const N = trk.items.length;
  for (let i = 0; i < N; i++) {
    const first = trackEl.firstElementChild;
    if (first) first.remove();
  }
  for (let i = 0; i < N; i++) {
    trackEl.appendChild(_makeChordviewCard(trk.items[i], i));
  }
  requestAnimationFrame(() => _fitChordViewCards(trackEl));
}

// Shrink each chord label's font until it fits the card. Caps at 50%
// of the original size as a sanity floor; if a chord name is wider
// than that, the label clips — better than a 6-px-tall blob.
function _fitChordViewCards(trackEl) {
  if (!trackEl) return;
  trackEl.querySelectorAll('.chordview-card').forEach(card => {
    const name = card.querySelector('.chordview-name');
    if (!name) return;
    const cs = getComputedStyle(card);
    const avail = card.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (avail <= 0) return;
    // Reset previous fitting.
    name.style.fontSize = '';
    name.classList.remove('cv-stacked');
    // If it already fits inline, done.
    if (name.scrollWidth <= avail) return;
    // Try stacking root + suffix on two lines first — keeps the root at
    // full size. The .cv-suffix span is positioned ABOVE the root and
    // out of flow, so only the root width counts.
    if (name.querySelector('.cv-suffix')) {
      name.classList.add('cv-stacked');
      if (name.scrollWidth <= avail) return;
    }
    // Still too wide (very long root, or no suffix): fall back to the
    // old font-size shrink to fit.
    let size = parseFloat(getComputedStyle(name).fontSize);
    const floor = size * 0.5;
    let guard = 30;
    while (name.scrollWidth > avail && size > floor && guard-- > 0) {
      size -= 2;
      name.style.fontSize = size + 'px';
    }
  });
}

// Walk the cards and apply past / current / future classes, then
// translate the track so the playhead line (centred at 50% of the body)
// sits inside the current chord card at the right beat fraction.
function updateChordViewPlayhead() {
  if (!SEQ.chordViewOpen) return;
  const body    = document.getElementById('seq-chordview-body');
  const trackEl = document.getElementById('seq-chordview-track');
  const trk     = focusedChordTrack();
  if (!body || !trackEl || !trk || trk.items.length === 0) {
    if (trackEl) trackEl.style.transform = 'translateX(0)';
    return;
  }
  const t = SEQ.animBeat ?? SEQ.startBeat ?? 0;
  // Loop-wrap detection: when animBeat jumps backwards by more than
  // half a beat while looping, we've crossed the loop boundary — bump
  // the iter so the cursor continues into the next rendered copy
  // instead of snapping left.
  if (SEQ.loop && SEQ.playing && _cvLastAnimBeat >= 0
      && t < _cvLastAnimBeat - 0.5) {
    _cvLoopIter += 1;
    // Treadmill once the cursor would otherwise land in the rightmost
    // rendered copy with no buffer ahead. We drop the leftmost copy and
    // append a fresh one at the end — every card's DOM position shifts
    // left by loopWidth, so when the iter-based transform shifts right
    // by loopWidth the net visible change is zero.
    if (_cvLoopIter > CHORDVIEW_COPIES - 2) {
      _cvTreadmill(trackEl, trk);
      _cvLoopIter -= 1;
    }
  }
  _cvLastAnimBeat = t;

  // Two indexes:
  //  - colourIdx: which chord owns the .current class. Uses a small
  //    look-ahead so the upcoming chord starts colouring before its
  //    beat arrives — soft swell-in / fade-out across the boundary.
  //  - cursorIdx: which chord the playhead-line currently sits in.
  //    Uses the real beat so the line stays synced with audio.
  const CV_LOOKAHEAD_BEATS = 0.4;
  const findIdx = (time) => {
    for (let i = 0; i < trk.items.length; i++) {
      const it = trk.items[i];
      if (time >= it.start && time < it.start + it.beats) return i;
    }
    return -1;
  };
  const colourIdx = findIdx(t + CV_LOOKAHEAD_BEATS);
  const cursorIdx = findIdx(t);
  const colourEff = (colourIdx >= 0) ? trk.items.length * _cvLoopIter + colourIdx : -1;
  const cursorEff = (cursorIdx >= 0) ? trk.items.length * _cvLoopIter + cursorIdx : -1;

  const cards = trackEl.querySelectorAll('.chordview-card');
  cards.forEach((el, i) => {
    el.classList.toggle('past',    colourEff >= 0 && i < colourEff);
    el.classList.toggle('current', i === colourEff);
    el.classList.toggle('future',  colourEff === -1 ? false : i > colourEff);
  });

  // Walk the rendered row to compute the x of the playhead (real-time,
  // not look-ahead — the line must stay locked to audio). The 6 px
  // gap between cards is added to the CURRENT chord's advance too, so
  // the cursor sweeps continuously across each boundary instead of
  // skipping a 6 px gap on every chord change (= the "mini sprongetje").
  const gap = 6; // matches .seq-chordview-track gap
  let xWithinRow = 0;
  for (let i = 0; i < cards.length; i++) {
    const el = cards[i];
    const w = el.offsetWidth;
    if (i === cursorEff) {
      const it = trk.items[+el.dataset.localIdx];
      const frac = Math.max(0, Math.min(1, (t - it.start) / Math.max(0.0001, it.beats)));
      xWithinRow += frac * (w + gap);
      break;
    }
    xWithinRow += w + gap;
  }
  trackEl.style.transform = `translateX(${-xWithinRow}px)`;
}

// Called from seqStop / seqJumpToBeat so the iter resets to 0 on the
// next render and the first copy of the row is "the current one".
function resetChordViewLoopIter() {
  _cvLoopIter = 0;
  _cvLastAnimBeat = -1;
}

// The generic _initSectionToggles handler in chord-pad.js already
// flips body.hide-chordview + the button's .active class based on
// localStorage. We only need to (a) mirror the live visibility into
// SEQ.chordViewOpen and (b) (re)render whenever the panel becomes
// visible.
(function _initChordViewToggle() {
  const btn = document.querySelector('.header-section-toggle[data-section="chordview"]');
  if (!btn) return;
  const sync = () => {
    SEQ.chordViewOpen = !document.body.classList.contains('hide-chordview');
    if (SEQ.chordViewOpen) renderChordView();
  };
  // Initial state — section-toggle apply() has already run on script
  // parse, so the body class is already set.
  sync();
  // Click order: section-toggle handler fires first (registered earlier
  // in chord-pad.js), then ours. setTimeout(0) defers a tick so we
  // observe the post-toggle state.
  btn.addEventListener('click', () => setTimeout(sync, 0));
})();

// Ctrl/Cmd + wheel over the chord-view scales the card widths. Same
// gesture as the arrangement/piano-roll zoom; preventDefault stops the
// browser-level page zoom.
(function _initChordViewZoom() {
  // Restore persisted zoom (uiPrefsLoad in seq.js can't touch our
  // module-scoped `let` yet — it runs before this file is parsed).
  try {
    const raw = localStorage.getItem('chord-pad-ui-v1');
    if (raw) {
      const d = JSON.parse(raw);
      if (typeof d.chordviewPxPerBeat === 'number'
          && d.chordviewPxPerBeat >= CHORDVIEW_PX_MIN
          && d.chordviewPxPerBeat <= CHORDVIEW_PX_MAX) {
        CHORDVIEW_PX_PER_BEAT = d.chordviewPxPerBeat;
        CHORDVIEW_MIN_CARD_W  = Math.max(60, Math.round(140 * d.chordviewPxPerBeat / 90));
        renderChordView();
      }
    }
  } catch (_) {}
  const body = document.getElementById('seq-chordview-body');
  if (!body) return;
  body.addEventListener('wheel', (ev) => {
    if (!ev.ctrlKey && !ev.metaKey) return;
    ev.preventDefault();
    const factor = ev.deltaY < 0 ? 1.15 : 1 / 1.15;
    const next = Math.max(CHORDVIEW_PX_MIN, Math.min(CHORDVIEW_PX_MAX, CHORDVIEW_PX_PER_BEAT * factor));
    if (Math.round(next) === Math.round(CHORDVIEW_PX_PER_BEAT)) return;
    CHORDVIEW_PX_PER_BEAT = next;
    // Scale the min-width proportionally so short chords don't drown the
    // card label when the user zooms way out.
    CHORDVIEW_MIN_CARD_W = Math.max(60, Math.round(140 * next / 90));
    renderChordView();
    if (typeof uiPrefsSave === 'function') uiPrefsSave();
  }, { passive: false });
})();
