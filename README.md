# Chord Pad

Chord Pad is a browser tool for exploring, playing and arranging chord progressions. It runs entirely in the browser — open `chord-pad.html` and you're in. No installation, no account.

Use it to:
- **Discover** what chords fit together in a key (Major Harmony, Minor Harmony, Scale Chords).
- **Look up** any chord and its alternative notations (Chord Library).
- **Sketch** a progression in the built-in sequencer.
- **Play** out loud through the built-in synth, or send MIDI to your DAW.

---

## The four tabs

Across the top you'll find four tabs. Each one shows chords for the currently selected key, but organised around a different idea.

### Major Harmony

The classic starting point. Pick a key with the **SET THE KEY** slider, then click any pad to hear it.

- **Main Chords** — the seven chords that live inside the major key (I, ii, iii, IV, V, vi, vii°). Start here.
- **Secondary Dominants** — extra "borrowed" dominant chords that strongly pull toward each Main chord. Great for adding tension.
- **Modal Interchange** — chords borrowed from the parallel minor (♭III, iv, ♭VI, ♭VII). They give a song that "moody" colour.

The arrows between rows show common voice-leading paths. Use **v1 / v2** to switch between two different layouts of the same idea.

### Minor Harmony

Same idea as Major Harmony, but built around minor / harmonic-minor key centres. The grouping highlights:

- the secondary diminished chords pulling toward V and IV,
- the harmonic-minor main chords,
- and the Neapolitan (♭II) — a special "borrowed" major chord that's worth its own dashed box on the right.

### Scale Chords

A reference grid: every chord that can be built on each of the seven scale degrees, for the scale you choose.

- Pick **Major / Minor / Harmonic Major / Harmonic Minor** at the top.
- The **Rows** button lets you toggle which chord types are shown (triads, 7ths, 9ths, sus2, add4, etc.) and reorder them.
- Each row is one chord type (e.g. "Triads"), each column is a scale degree (I, II, III…).

### Chord Library

Pick any root note, see every common chord built on it.

Chords are grouped logically: Triads, Sus, Sixths, Add, Sevenths, Seventh Sus, Ninths, Elevenths, Thirteenths, Altered Dominants.

Hover over any pad to see:
- **Notation synonyms** — e.g. hovering Cmaj7 shows `Cmaj7`, `CM7`, `CΔ7`, `CΔ`, `Cma7`, `Cj7`. All the ways you might see this chord written in different songbooks.
- **Enharmonic / functional equivalents** — e.g. C6 is the same notes as Am7; Cdim7 is symmetric so every minor-3rd transposition is the same chord.

This tab has no keyboard shortcuts — it's a click-to-explore reference.

---

## Setting the key

At the top of each chord tab there's a **SET THE KEY** strip with twelve buttons. Click one, or use **← / →** to step. All the chords on the page re-spell themselves instantly.

In Scale Chords the strip also adapts the note spelling depending on whether you've picked a major or minor scale.

---

## Playing chords

- **Click** a pad to play it.
- **Click and drag across pads** to play several in sequence.
- Each pad shows the chord name, an optional small **extension badge** (e.g. "Maj7", "7"). Clicking the badge plays the extended version.
- A small **piano tooltip** appears above the pad showing exactly which notes are sounding, with the note names labelled above the keys. Turn this on/off in Settings under **Tooltip**.

If audio is on you'll hear it through the built-in synth. If MIDI is on you'll also send the chord to your MIDI output.

---

## Settings

Click **SETTINGS** at the bottom to expand.

- **Audio** — turn the internal synth on/off.
- **Voicing** — `Auto` keeps chord notes close together to avoid awkward jumps; you can also force a fixed voicing.
- **Octave** — which octave the chords are centred in.
- **Sustain** — when on, chords keep ringing instead of stopping when you release.
- **Bass** — adds a low bass note an octave or two below the chord. You can pick the bass octave separately.
- **Tooltip** — show/hide the little piano popup above each pad.
- **Scale tones** — when on, the piano tooltip also lights up the scale notes (in green) around the chord notes.
- **Tempo** — used by the sequencer and any tempo-synced effects.
- **MIDI** — when on, exposes:
  - **Channel** — which MIDI channel to send on.
  - **Out port / In port** — choose a device.

---

## Instrument

Click **INSTRUMENT** to expand the synth panel.

Pick a sound from the dropdown (Synth, Piano, E-Piano, Organ, Strings, Choir, Vibraphone, Warm Pad), then shape it with the sliders. Most parameters are familiar from any synth:

- **Attack / Decay / Sustain / Release** — the envelope (how the sound starts, fades, holds, and tails off).
- **Tone / Resonance** — a filter to brighten or muffle the sound.
- **Reverb** — adds room/space.
- **Dly Wet / Dly Time / Dly Feed** — delay (echo) amount, time, feedback.
- **Vib Depth / Vib Rate** — vibrato (pitch wobble).
- **Trem Depth / Trem Rate** — tremolo (volume wobble).
- **Fltr LFO** — moves the filter rhythmically.

The little ↻ icon next to Dly Time, Vib Rate and Trem Rate snaps that parameter to the current tempo (so e.g. delay becomes a clean dotted-eighth).

For the basic Synth there are three extra controls: **Waveform**, **Overtones** and **Detune** for fattening or thinning the sound.

---

## Keyboard

Click **KEYBOARD** to expand a small piano at the bottom. Useful for visualising what's playing or for triggering individual notes with the mouse. Use the arrows on the side to scroll up/down the range.

---

## Sequencer

Click **SEQUENCER** to expand a multi-track arranger.

Three lanes are stacked:
- **Chords** — drop chord pads here. Just drag any chord pad from above into the lane.
- **Melody** — record notes from MIDI input or draw them with the pen tool.
- **Free** — same as melody but unaffected by transposition.

Controls along the top:
- **Play / Rec / Metro / Loop** — transport.
- **Time signature** — 2/4, 3/4, 4/4 or 6/8.
- **Tempo** — beats per minute.

Tool buttons on the right:
- **Zoom in / out / fit**.
- **Pen** — draw notes.
- **Erase** — remove notes.
- **Piano** — switch the melody lane to a piano-roll view.
- **Snap** + value — snap drawn / dropped events to a grid (1/4, 1/8 etc.).
- **Clear** — empty all lanes.

You can drag chords directly from any tab into the chord lane while the sequencer is open. The chord lane will follow the selected key, so transposing the key transposes the progression.

---

## Keyboard shortcuts

Quick reference (none of these apply in the Chord Library tab):

| Key            | Action                              |
| -------------- | ----------------------------------- |
| `Space`        | Sequencer play / stop               |
| `P`            | Panic (stop all sound)              |
| `← / →`        | Change key down / up by a semitone  |
| `↑ / ↓`        | Octave up / down                    |
| `1`–`6`, `Q`–`Y`, `A`–`G` | Trigger pads on the current tab |
| `Shift` + pad key | Trigger the pad's extension chord |

Hold a key to keep the chord ringing (unless Sustain is on, in which case clicks toggle).

---

## Tips

- The **piano tooltip** is the quickest way to see what a chord actually contains. Toggle it on if you're learning.
- In **Scale Chords**, use the **Rows** menu to declutter — most people only need triads and sevenths.
- For songwriting, start in **Major Harmony** with the Main Chords, then sprinkle in Secondary Dominants and Modal Interchange chords to taste.
- For unusual or jazzy chords, the **Chord Library** is the fastest way to hear them and see all the ways they might be written.
- Drop chords into the **Sequencer** to lock in a progression, then tweak it with the pen tool.

That's it — open it, pick a key, click a chord. The rest is exploration.
