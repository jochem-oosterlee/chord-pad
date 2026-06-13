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

const CHORDVIEW_PX_PER_BEAT = 90;
const CHORDVIEW_MIN_CARD_W  = 140;
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
}

function refreshChordViewTitle() {
  const el = document.getElementById('seq-chordview-title');
  if (!el) return;
  const t = focusedChordTrack();
  el.textContent = t ? `· ${t.name}` : '';
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
      const item = trk.items[i];
      const card = document.createElement('div');
      const cardW = Math.max(CHORDVIEW_MIN_CARD_W, item.beats * CHORDVIEW_PX_PER_BEAT);
      card.className = 'chordview-card future' + (item.beats >= 2 ? ' wide' : '');
      card.dataset.iter = iter;
      card.dataset.localIdx = i;
      card.dataset.start = item.start;
      card.dataset.beats = item.beats;
      card.style.minWidth = CHORDVIEW_MIN_CARD_W + 'px';
      card.style.width = cardW + 'px';
      const name = document.createElement('div');
      name.className = 'chordview-name';
      name.innerHTML = item.label || '?';
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
      trackEl.appendChild(card);
    }
  }
  _cvLoopIter = 0;
  _cvLastAnimBeat = -1;
  // Auto-fit each label to its card — shrink font if it overflows.
  // Defer to next frame so layout has applied widths before measuring.
  requestAnimationFrame(() => _fitChordViewCards(trackEl));
  updateChordViewPlayhead();
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
    name.style.fontSize = ''; // reset
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
    _cvLoopIter = (_cvLoopIter + 1) % CHORDVIEW_COPIES;
  }
  _cvLastAnimBeat = t;

  // Which chord in trk.items contains `t`?
  let localIdx = -1;
  for (let i = 0; i < trk.items.length; i++) {
    const it = trk.items[i];
    if (t >= it.start && t < it.start + it.beats) { localIdx = i; break; }
  }
  // Effective index across the rendered (copies × items) row.
  const effectiveIdx = (localIdx >= 0)
    ? trk.items.length * _cvLoopIter + localIdx
    : -1;

  const cards = trackEl.querySelectorAll('.chordview-card');
  cards.forEach((el, i) => {
    el.classList.toggle('past',    effectiveIdx >= 0 && i < effectiveIdx);
    el.classList.toggle('current', i === effectiveIdx);
    el.classList.toggle('future',  effectiveIdx === -1 ? false : i > effectiveIdx);
  });

  // Walk the rendered row to compute the x of the playhead.
  const gap = 6; // matches .seq-chordview-track gap
  let xWithinRow = 0;
  for (let i = 0; i < cards.length; i++) {
    const el = cards[i];
    const w = el.offsetWidth;
    if (i === effectiveIdx) {
      const it = trk.items[+el.dataset.localIdx];
      const frac = Math.max(0, Math.min(1, (t - it.start) / Math.max(0.0001, it.beats)));
      xWithinRow += frac * w;
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
