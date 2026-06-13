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
  for (const item of trk.items) {
    const card = document.createElement('div');
    const cardW = Math.max(CHORDVIEW_MIN_CARD_W, item.beats * CHORDVIEW_PX_PER_BEAT);
    // Mark cards above ~2 beats wide as 'wide' so the CSS bumps their
    // font size — gives the long sustained chords more visual weight.
    card.className = 'chordview-card future' + (item.beats >= 2 ? ' wide' : '');
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
    card.appendChild(name);
    card.appendChild(beats);
    card.addEventListener('click', () => {
      // Click on a card jumps the play-cursor to that chord's start.
      if (typeof seqJumpToBeat === 'function') seqJumpToBeat(item.start);
    });
    trackEl.appendChild(card);
  }
  updateChordViewPlayhead();
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
  const cards = trackEl.querySelectorAll('.chordview-card');
  // Find the chord that contains `t`. If `t` is past the last chord,
  // mark all as past. If `t` is before the first chord, mark all as
  // future and pin the first card at the playhead.
  let currentIdx = -1;
  for (let i = 0; i < trk.items.length; i++) {
    const it = trk.items[i];
    if (t >= it.start && t < it.start + it.beats) { currentIdx = i; break; }
  }
  // Update class state.
  cards.forEach((el, i) => {
    el.classList.toggle('past',    i < currentIdx || (currentIdx === -1 && t >= trk.items[trk.items.length - 1].start + trk.items[trk.items.length - 1].beats));
    el.classList.toggle('current', i === currentIdx);
    el.classList.toggle('future',  i > currentIdx);
  });
  // Compute the x of the playhead inside the track-row. Sum widths of
  // previous cards + gap, then add the within-card offset of the
  // current chord based on beat progress.
  const gap = 6; // matches .seq-chordview-track gap
  let xWithinRow = 0;
  for (let i = 0; i < cards.length; i++) {
    const el = cards[i];
    const w = el.offsetWidth;
    if (i === currentIdx) {
      const it = trk.items[i];
      const frac = Math.max(0, Math.min(1, (t - it.start) / Math.max(0.0001, it.beats)));
      xWithinRow += frac * w;
      break;
    }
    xWithinRow += w + gap;
    // If past the last chord, end of last card is fine.
    if (currentIdx === -1 && i === cards.length - 1) {
      xWithinRow += w; // align past-the-end position
    }
  }
  // The track has 50% left padding so the first chord can sit at the
  // centre on start. translateX = -(distanceFromTrackLeft - bodyHalf).
  const bodyHalf = body.clientWidth / 2;
  const tx = bodyHalf - (bodyHalf + xWithinRow); // -xWithinRow but written explicitly
  trackEl.style.transform = `translateX(${tx}px)`;
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
