// ============================================================
// MIDI I/O
// ============================================================
//
// Extracted from chord-pad.js as a separate script file. Loaded BEFORE
// chord-pad.js in the HTML so initMIDI() / attachMidiInput() are
// defined by the time chord-pad.js's startup block calls them.
//
// Cross-file dependencies (read at runtime, all defined in chord-pad.js):
//   state, SEQ                                          (global state objects)
//   kbNoteOn, kbNoteOff, kbActive                       (chord-pad keyboard input)
//   getAudioCtx, startAudioNote, stopAudioNote, withSynth  (audio engine)
//   seqTrackInstrument, seqPlay, seqStop                (sequencer)
//   updateNowPlaying, updateSuggestions                 (UI refresh)
//
// All references are resolved lazily — function bodies reach the
// chord-pad.js globals via the shared window scope after both scripts
// have loaded.

async function initMIDI() {
  if (!navigator.requestMIDIAccess) {
    showError('Web MIDI is niet beschikbaar in deze browser. Gebruik Chrome, Edge of Opera (desktop).');
    return;
  }
  try {
    state.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
    refreshOutputs();
    refreshInputs();
    state.midiAccess.onstatechange = () => {
      refreshOutputs();
      refreshInputs();
      // Notify any UI that lists ports (track-fx + chord-pad modals) so they
      // pick up newly-connected devices (e.g. starting loopMIDI mid-session).
      document.dispatchEvent(new CustomEvent('chordpad:midi-ports-changed'));
    };
  } catch (e) {
    showError('Could not get MIDI access: ' + e.message + '. Open this file directly in your browser (not in a sandboxed iframe).');
  }
}

function refreshOutputs() {
  // Out-port dropdown was moved into the per-track / chord-pad FX modals.
  // state.output is the fallback target when no per-track id is set: keep
  // it pointed at the previous device when present, otherwise the first
  // available output.
  const previousId = state.output ? state.output.id : null;
  const outputs = Array.from(state.midiAccess.outputs.values());
  state.output = outputs.find(o => o.id === previousId) || outputs[0] || null;
  // Tell any open modals their port lists may need rebuilding (this fires
  // on initial MIDI-access init too, not just on hot-plug statechange).
  document.dispatchEvent(new CustomEvent('chordpad:midi-ports-changed'));
}

function applyPitchBend(cents) {
  state.pitchBendCents = cents;
  const ctx = getAudioCtx();
  kbActive.forEach(node => {
    node?.oscs?.[0]?.detune?.setTargetAtTime(cents, ctx.currentTime, 0.003);
  });
}

function onMidiMessage(e) {
  const [status, note, velocity] = e.data;
  const type = status & 0xF0;
  blinkLed();
  if (type === 0x90 && velocity > 0) {
    kbNoteOn(note, false);
  } else if (type === 0x80 || (type === 0x90 && velocity === 0)) {
    kbNoteOff(note, false);
  } else if (type === 0xE0) {
    const bend = (velocity << 7) | note; // MSB | LSB
    applyPitchBend(Math.round((bend - 8192) / 8192 * 200));
  }
}

function attachMidiInput() {
  if (!state.midiAccess) return;
  // Reset all input handlers first so we don't double-dispatch.
  state.midiAccess.inputs.forEach(inp => { inp.onmidimessage = null; });
  // Per-track inputs: each track with a configured midiInPortId gets its
  // own handler routing notes through that track's instrument live.
  const inputsByPort = new Map();
  for (const t of SEQ.tracksList) {
    if (!t.midiInPortId) continue;
    const inp = state.midiAccess.inputs.get(t.midiInPortId);
    if (!inp) continue;
    if (!inputsByPort.has(inp.id)) inputsByPort.set(inp.id, { inp, tracks: [], clock: false });
    inputsByPort.get(inp.id).tracks.push(t);
  }
  // Clock source — possibly on the same port as a track, share the handler.
  if (state.midiClockEnabled && state.midiClockPortId) {
    const inp = state.midiAccess.inputs.get(state.midiClockPortId);
    if (inp) {
      if (!inputsByPort.has(inp.id)) inputsByPort.set(inp.id, { inp, tracks: [], clock: true });
      else inputsByPort.get(inp.id).clock = true;
    }
  }
  inputsByPort.forEach(({ inp, tracks, clock }) => {
    inp.onmidimessage = (msg) => {
      const status = msg.data[0];
      if (clock && (status === 0xF8 || status === 0xFA || status === 0xFB || status === 0xFC)) {
        onMidiClockMessage(status, msg.timeStamp);
        return;
      }
      if (tracks.length) onTrackMidiMessage(msg, tracks);
    };
  });
}

// MIDI Clock receiver — 24 PPQ. Uses msg.timeStamp (set when the message
// was generated upstream, not when we got around to processing it) so
// rendering jitter doesn't bleed into the BPM estimate. Updates the master
// tempo lazily (only on significant change) so we're not re-anchoring the
// scheduler 24 times per quarter note.
const _midiClock = { intervals: [], lastTickAt: 0, lastAppliedBpm: 0 };
function onMidiClockMessage(status, ts) {
  if (status === 0xF8) {
    if (_midiClock.lastTickAt) {
      const dt = ts - _midiClock.lastTickAt;
      if (dt > 0 && dt < 200) {                  // ignore obvious outliers
        _midiClock.intervals.push(dt);
        if (_midiClock.intervals.length > 24) _midiClock.intervals.shift();
        if (_midiClock.intervals.length >= 12) {
          const avg = _midiClock.intervals.reduce((s, v) => s + v, 0) / _midiClock.intervals.length;
          const bpm = Math.round(60000 / (avg * 24));
          if (bpm >= 40 && bpm <= 240 && Math.abs(bpm - _midiClock.lastAppliedBpm) >= 3) {
            _midiClock.lastAppliedBpm = bpm;
            state.tempo = bpm;
            // Light-touch update: refresh the display only. We deliberately
            // skip applyTempoChange here because it clears pendingTimers /
            // re-anchors playStartTime — when triggered ~10× during initial
            // clock detection that cancels the just-scheduled first beat
            // every time, producing a ~500 ms silence after FA. Letting
            // seqBeatDur() be read fresh on each scheduling tick lets the
            // tempo update propagate naturally without yanking timing.
            const tEl1 = document.getElementById('seq-tempo-val');
            const tEl2 = document.getElementById('ctrl-tempo');
            if (tEl1) tEl1.value = bpm;
            if (tEl2) tEl2.value = bpm;
          }
        }
      }
    }
    _midiClock.lastTickAt = ts;
  } else if (status === 0xFA || status === 0xFB) {
    // Fresh start: clear sample window so we don't carry stale intervals.
    _midiClock.intervals.length = 0;
    _midiClock.lastTickAt = 0;
    _midiClock.lastAppliedBpm = 0;
    // Tight start: ~1 ms lead so the scheduler's `t > now` check passes
    // but we don't sit 50 ms behind the clock master on every beat.
    if (!SEQ.playing) seqPlay(0.001);
  } else if (status === 0xFC) {
    if (SEQ.playing) seqStop();
    _midiClock.intervals.length = 0;
    _midiClock.lastTickAt = 0;
    _midiClock.lastAppliedBpm = 0;
  }
}

// Per-track live MIDI input handler. Plays note-on / note-off through the
// matching track's instrument (or forwards as MIDI out if the track is in
// MIDI-output mode). Only tracks listening to this port + matching channel.
const _liveTrackNotes = new Map(); // key `${trackId}:${midi}` → audioNode
function onTrackMidiMessage(msg, tracks) {
  const status = msg.data[0] & 0xF0;
  const ch     = msg.data[0] & 0x0F;
  const note   = msg.data[1];
  const vel    = msg.data[2];
  // Visual activity indicator — flash on any matching note event regardless
  // of which track receives it.
  if (status === 0x90 || status === 0x80) blinkLed();
  for (const t of tracks) {
    if (t.channel !== ch) continue;
    if (status === 0x90 && vel > 0) {
      if (t.output === 'midi') {
        sendNoteOn(note, vel, t.channel, midiPortById(t.midiPortId));
      } else if (state.audioEnabled) {
        const inst = seqTrackInstrument(t);
        let node;
        withSynth(t.synth, () => { node = startAudioNote(note, vel, null, null, inst); });
        if (node) {
          _liveTrackNotes.set(t.id + ':' + note, node);
          SEQ.activeNodes.add(node);
        }
      }
    } else if (status === 0x80 || (status === 0x90 && vel === 0)) {
      if (t.output === 'midi') {
        sendNoteOff(note, t.channel, midiPortById(t.midiPortId));
      } else {
        const key = t.id + ':' + note;
        const node = _liveTrackNotes.get(key);
        if (node) {
          stopAudioNote(node);
          SEQ.activeNodes.delete(node);
          _liveTrackNotes.delete(key);
        }
      }
    }
  }
}

function refreshInputs() {
  // Global input dropdown has been removed (MIDI input is per-track now);
  // just re-attach the per-track listeners so they pick up newly-arrived
  // (or disconnected) devices.
  attachMidiInput();
}

// Resolve a port-id (stored on track / pad) to an actual MIDIOutput; falls
// back to the global state.output (the one picked in Settings) if the id is
// empty or the device isn't currently connected.
function midiPortById(id) {
  if (!state.midiAccess) return state.output || null;
  if (!id) return state.output || null;
  return state.midiAccess.outputs.get(id) || state.output || null;
}
function sendNoteOn(note, velocity, channelOverride = null, portOverride = null, whenMs = undefined) {
  if (!state.midiEnabled) return;
  const port = portOverride || state.output;
  if (!port) return;
  const ch = channelOverride ?? state.channel;
  port.send([0x90 | ch, note & 0x7F, velocity & 0x7F], whenMs);
  blinkLed();
}
function sendNoteOff(note, channelOverride = null, portOverride = null, whenMs = undefined) {
  if (!state.midiEnabled) return;
  const port = portOverride || state.output;
  if (!port) return;
  const ch = channelOverride ?? state.channel;
  port.send([0x80 | ch, note & 0x7F, 0], whenMs);
}
// Convert an AudioContext time (seconds) to a performance.now()-compatible
// timestamp (ms) for Web MIDI's port.send(data, timestamp). The two clocks
// are stable in rate but offset by an opaque constant — we estimate the
// offset from the live values each call (good enough for ~ms precision).
function audioTimeToMidiTs(t) {
  const ctx = getAudioCtx();
  return performance.now() + (t - ctx.currentTime) * 1000;
}
function panic() {
  // Send All-Notes-Off + All-Sound-Off on every channel of every known
  // MIDI output port (global + each per-track port if different).
  const ports = new Set();
  if (state.output) ports.add(state.output);
  if (state.midiAccess) {
    if (state.padMidiPortId) {
      const p = state.midiAccess.outputs.get(state.padMidiPortId);
      if (p) ports.add(p);
    }
    for (const t of (SEQ?.tracksList || [])) {
      if (!t.midiPortId) continue;
      const p = state.midiAccess.outputs.get(t.midiPortId);
      if (p) ports.add(p);
    }
  }
  ports.forEach(port => {
    for (let ch = 0; ch < 16; ch++) {
      try { port.send([0xB0 | ch, 123, 0]); port.send([0xB0 | ch, 120, 0]); } catch (_) {}
    }
  });

  // Stop chord-pad audio.
  Array.from(state.activeChords.values()).forEach(chord => chord.audioNodes.forEach(stopAudioNote));
  state.activeChords.clear();
  document.querySelectorAll('.pad.active').forEach(p => p.classList.remove('active'));

  // Stop sequencer-scheduled audio nodes + cancel any pending timers.
  if (typeof SEQ !== 'undefined') {
    SEQ.activeNodes?.forEach?.(n => { try { stopAudioNote(n); } catch (_) {} });
    SEQ.activeNodes?.clear?.();
    SEQ.pendingTimers?.forEach?.(id => clearTimeout(id));
    SEQ.pendingTimers?.clear?.();
  }
  // Stop live MIDI-input audio nodes (per-track input handler).
  if (typeof _liveTrackNotes !== 'undefined') {
    _liveTrackNotes.forEach(n => { try { stopAudioNote(n); } catch (_) {} });
    _liveTrackNotes.clear();
  }

  updateNowPlaying();
  updateSuggestions();
}

let ledTimeout = null;
function blinkLed() {
  const led = document.getElementById('midi-led');
  led.classList.add('on');
  clearTimeout(ledTimeout);
  ledTimeout = setTimeout(() => led.classList.remove('on'), 80);
}

function showError(msg) {
  const banner = document.getElementById('error-banner');
  banner.textContent = msg;
  banner.classList.add('show');
}
