// Block browser touch interference (context menus, text selection popups)
document.addEventListener('contextmenu', e => { if (e.pointerType === 'touch') e.preventDefault(); });
document.addEventListener('selectstart', e => { if (e.target.closest('.app')) e.preventDefault(); });

// ============================================================
// CONSTANTS
// ============================================================
const SVG_NS = 'http://www.w3.org/2000/svg';
const KEY_DISPLAY       = ['C','D♭','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
const MINOR_KEY_DISPLAY = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','B♭','B'];

// Per-key chromatic spelling support
const LETTER_SEQUENCE = ['C','D','E','F','G','A','B'];
const LETTER_PITCH = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
// Tonic spelling for each major key root (chromatic 0-11)
const MAJOR_KEY_TONICS = ['C','D♭','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];

function trySpelling(letter, targetPitch) {
  const acc = ((targetPitch - LETTER_PITCH[letter]) % 12 + 12) % 12;
  if (acc === 0) return letter;
  if (acc === 1) return letter + '♯';
  if (acc === 11) return letter + '♭';
  return null; // double accidental
}

const SPELLING_CACHE = {};
function buildSpelling(rootIdx, mode) {
  const cacheKey = `${rootIdx}-${mode}`;
  if (SPELLING_CACHE[cacheKey]) return SPELLING_CACHE[cacheKey];

  const majorRoot = (mode === 'minor' || mode === 'harmonic-minor') ? (rootIdx + 3) % 12 : rootIdx;
  const tonicLetter = MAJOR_KEY_TONICS[majorRoot][0];
  const tonicLetterIdx = LETTER_SEQUENCE.indexOf(tonicLetter);
  const majorScale = [0, 2, 4, 5, 7, 9, 11];
  const spelling = new Array(12).fill(null);

  // Diatonic notes
  for (let d = 0; d < 7; d++) {
    const letter = LETTER_SEQUENCE[(tonicLetterIdx + d) % 7];
    const pitch = (majorRoot + majorScale[d]) % 12;
    const name = trySpelling(letter, pitch);
    if (name !== null) spelling[pitch] = name;
  }

  // Chromatic conventions: [semitones, preferred scale degree, fallback degree]
  // Minor keys prefer sharps (G# not Ab, D# not Eb, C# not Db), except bVII stays Bb
  const conventions = (mode === 'minor' || mode === 'harmonic-minor')
    ? [[1,0,1],[3,1,2],[6,3,4],[8,4,5],[10,6,5]]
    : [[1,1,0],[3,2,1],[6,3,4],[8,5,4],[10,6,5]];
  for (const [semitones, preferredDeg, fallbackDeg] of conventions) {
    const pitch = (majorRoot + semitones) % 12;
    if (spelling[pitch] !== null) continue;
    let name = null;
    for (const deg of [preferredDeg, fallbackDeg]) {
      const letter = LETTER_SEQUENCE[(tonicLetterIdx + deg) % 7];
      name = trySpelling(letter, pitch);
      if (name !== null) break;
    }
    spelling[pitch] = name;
  }

  SPELLING_CACHE[cacheKey] = spelling;
  return spelling;
}

const CHORD_INTERVALS = {
  'maj':     [0, 4, 7],
  'min':     [0, 3, 7],
  'dim':     [0, 3, 6],
  'aug':     [0, 4, 8],
  'sus2':    [0, 2, 7],
  'sus4':    [0, 5, 7],
  'dom7':    [0, 4, 7, 10],
  'maj7':    [0, 4, 7, 11],
  'min7':    [0, 3, 7, 10],
  'mmaj7':   [0, 3, 7, 11],
  'm7b5':    [0, 3, 6, 10],
  'dim7':    [0, 3, 6, 9],
  'augmaj7': [0, 4, 8, 11],
  'aug7':    [0, 4, 8, 10],
  'power':   [0, 7],
  'sus24':   [0, 2, 5, 7],
  'maj6':    [0, 4, 7, 9],
  'min6':    [0, 3, 7, 9],
  '7sus2':   [0, 2, 7, 10],
  '7sus4':   [0, 5, 7, 10],
  'dom9':    [0, 4, 7, 10, 14],
  'maj9':    [0, 4, 7, 11, 14],
  'min9':    [0, 3, 7, 10, 14],
  'dom11':   [0, 4, 7, 10, 14, 17],
  'maj11':   [0, 4, 7, 11, 14, 17],
  'min11':   [0, 3, 7, 10, 14, 17],
  'majadd2': [0, 2, 4, 7],
  'minadd2': [0, 2, 3, 7],
  'majadd4': [0, 4, 5, 7],
  'minadd4': [0, 3, 5, 7],
  'maj6add9':[0, 2, 4, 7, 9],
  'dom13':   [0, 4, 7, 10, 14, 21],
  'maj13':   [0, 4, 7, 11, 14, 21],
  'min13':   [0, 3, 7, 10, 14, 17, 21],
  '7b5':     [0, 4, 6, 10],
  '7b9':     [0, 1, 4, 7, 10],
  '7s9':     [0, 3, 4, 7, 10],
  '7s11':    [0, 4, 6, 7, 10, 14],
  '7b13':    [0, 4, 7, 8, 10, 14],
  '7alt':    [0, 1, 3, 4, 8, 10],
};

// Average interval per chord type — used to center the chord's midpoint on the key root
const CHORD_AVG_IV = Object.fromEntries(
  Object.entries(CHORD_INTERVALS).map(([q, ivs]) => [q, ivs.reduce((a, b) => a + b, 0) / ivs.length])
);

const CHORD_SUFFIX = {
  'maj': '', 'min': 'm', 'dim': '°', 'aug': '+',
  'sus2': 'sus2', 'sus4': 'sus4',
  'dom7': '7', 'maj7': 'maj7', 'min7': 'm7', 'mmaj7': 'mMaj7',
  'm7b5': 'ø', 'dim7': '°7', 'augmaj7': 'maj7+', 'aug7': '7+',
  'power': '5', 'sus24': 'sus24',
  'maj6': '6', 'min6': 'm6',
  '7sus2': '7sus2', '7sus4': '7sus4',
  'dom9': '9', 'maj9': 'maj9', 'min9': 'm9',
  'dom11': '11', 'maj11': 'maj11', 'min11': 'm11',
  'majadd2': 'add2', 'minadd2': 'madd2',
  'majadd4': 'add4', 'minadd4': 'madd4',
  'maj6add9': '6/9',
  'dom13': '13', 'maj13': 'maj13', 'min13': 'm13',
  '7b5': '7♭5', '7b9': '7♭9', '7s9': '7♯9', '7s11': '7♯11', '7b13': '7♭13', '7alt': '7alt',
};

const QUALITY_GLYPH = {
  'maj': '', 'min': 'm', 'dim': '°', 'aug': '+',
  'sus2': 'sus2', 'sus4': 'sus4',
  'dom7': '7', 'maj7': 'maj7', 'min7': 'm7', 'mmaj7': 'mMaj7',
  'm7b5': 'ø', 'dim7': '°7', 'augmaj7': 'maj7+', 'aug7': '7+',
  'power': '5', 'sus24': 'sus24',
  'maj6': '6', 'min6': 'm6',
  '7sus2': '7sus2', '7sus4': '7sus4',
  'dom9': '9', 'maj9': 'maj9', 'min9': 'm9',
  'dom11': '11', 'maj11': 'maj11', 'min11': 'm11',
  'majadd2': 'add2', 'minadd2': 'madd2',
  'majadd4': 'add4', 'minadd4': 'madd4',
  'maj6add9': '6/9',
  'dom13': '13', 'maj13': 'maj13', 'min13': 'm13',
  '7b5': '7♭5', '7b9': '7♭9', '7s9': '7♯9', '7s11': '7♯11', '7b13': '7♭13', '7alt': '7alt',
};

// SVG icons for flow labels
const ICON_LOOP = `<svg class="icon" viewBox="0 0 16 16"><path d="M 3.5 6.5 A 4.5 4.5 0 1 1 3.5 9.5" /><polyline points="2.5 9 4 11 5.5 9" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
const ICON_NOLOOP = `<svg class="icon" viewBox="0 0 16 16"><circle cx="8" cy="8" r="5.5" /><line x1="3.5" y1="3.5" x2="12.5" y2="12.5" stroke-linecap="round"/></svg>`;
const ICON_DOWN = `<svg class="icon" viewBox="0 0 16 16"><line x1="8" y1="2.5" x2="8" y2="13" stroke-linecap="round"/><polyline points="4.5 9.5 8 13 11.5 9.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
const ICON_UP = `<svg class="icon" viewBox="0 0 16 16"><line x1="8" y1="13.5" x2="8" y2="3" stroke-linecap="round"/><polyline points="4.5 6.5 8 3 11.5 6.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`;

// ============================================================
// TEMPLATES
// ============================================================
const TEMPLATES = {
  'major-harmony': {
    name: 'Major Harmony',
    defaultKey: 0,
    keyMode: 'major',
    sections: [
      {
        id: 'secdom',
        flowIcon: ICON_NOLOOP,
        flowText: "DON'T MIX CHORDS",
        label: 'Secondary Dominants',
        chords: [
          {roman:'V<sub>I</sub>',   interval:7,  q:'dom7', pianoScale:[0,2,4,5,7,9,10]},
          {roman:'V<sub>vi</sub>',  interval:4,  q:'dom7', pianoScale:[0,1,4,5,7,8,10]},
          {roman:'V<sub>IV</sub>',  interval:0,  q:'dom7', pianoScale:[0,2,4,5,7,9,10]},
          {roman:'V<sub>ii</sub>',  interval:9,  q:'dom7', pianoScale:[0,1,4,5,7,8,10]},
          {roman:'V<sub>V</sub>',   interval:2,  q:'dom7', pianoScale:[0,2,4,5,7,9,10]},
          {roman:'V<sub>iii</sub>', interval:11, q:'dom7', pianoScale:[0,1,4,5,7,8,10]},
        ]
      },
      {
        id: 'main',
        flowIcon: ICON_DOWN,
        flowText: 'START HERE · MIX CHORDS',
        label: 'Main Chords',
        chords: [
          {roman:'I',   interval:0, q:'maj'},
          {roman:'vi',  interval:9, q:'min'},
          {roman:'IV',  interval:5, q:'maj'},
          {roman:'ii',  interval:2, q:'min'},
          {roman:'V',   interval:7, q:'maj'},
          {roman:'iii', interval:4, q:'min'},
        ]
      },
      {
        id: 'modal',
        flowIcon: ICON_LOOP,
        flowText: 'MIX CHORDS',
        label: 'Modal Interchange',
        chords: [
          {roman:'bIII', interval:3,  q:'maj'},
          null,
          {roman:'bVI',  interval:8,  q:'maj'},
          {roman:'iv',   interval:5,  q:'min'},
          {roman:'bVII', interval:10, q:'maj'},
          null,
        ]
      },
    ],
    keymap: {
      '1':['secdom',0], '2':['secdom',1], '3':['secdom',2], '4':['secdom',3], '5':['secdom',4], '6':['secdom',5],
      'q':['main',0], 'w':['main',1], 'e':['main',2], 'r':['main',3], 't':['main',4], 'y':['main',5],
      'a':['modal',0], 'd':['modal',2], 'f':['modal',3], 'g':['modal',4],
    }
  },
  'minor-harmony': {
    name: 'Minor Harmony',
    defaultKey: 9,
    keyMode: 'harmonic-minor',
    sections: [
      {
        id: 'sd_v',
        flowIcon: ICON_LOOP,
        flowText: 'MIX CHORDS',
        label: 'Secondary Diminished V',
        chords: [
          {roman:'vii°<sub>V</sub>', interval:6, q:'dim'},
          {roman:'vii°<sub>V</sub>', interval:9, q:'dim'},
          {roman:'vii°<sub>V</sub>', interval:0, q:'dim'},
          {roman:'vii°<sub>V</sub>', interval:3, q:'dim'},
        ],
        neapolitan: {roman:'bII', interval:1, q:'maj'}
      },
      {
        id: 'main',
        flowIcon: ICON_DOWN,
        flowText: 'MIX CHORDS',
        label: 'Main Chords',
        chords: [
          {roman:'i',     interval:0,  q:'min'},
          {roman:'bIII+', interval:3,  q:'aug'},
          {roman:'iv',    interval:5,  q:'min'},
          {roman:'bVI',   interval:8,  q:'maj'},
          {roman:'V<sup>(7)</sup>',     interval:7, q:'dom7', qDisplay:'(7)'},
          {roman:'#vii°', interval:11, q:'dim'},
          {roman:'ii°',   interval:2,  q:'dim'},
        ]
      },
      {
        id: 'sd_iv',
        flowIcon: ICON_LOOP,
        flowText: 'MIX CHORDS',
        label: 'Secondary Diminished iv, bVI',
        chords: [
          {roman:'vii°<sub>iv</sub>', interval:10, q:'dim'},
          {roman:'vii°<sub>iv</sub>', interval:1,  q:'dim'},
          {roman:'vii°<sub>iv</sub>', interval:4,  q:'dim'},
          {roman:'vii°<sub>iv</sub>', interval:7,  q:'dim'},
        ]
      }
    ],
    keymap: {
      '1':['sd_v',0],'2':['sd_v',1],'3':['sd_v',2],'4':['sd_v',3],
      '5':['neapolitan',0],
      'q':['main',0],'w':['main',1],'e':['main',2],'r':['main',3],
      't':['main',4],'y':['main',5],'u':['main',6],
      'a':['sd_iv',0],'s':['sd_iv',1],'d':['sd_iv',2],'f':['sd_iv',3],
    }
  },
  'scale-chords': {
    name: 'Scale Chords',
    defaultKey: 0,
    keyMode: 'major',
    sections: [],
    keymap: {},
  },
  'chord-library': {
    name: 'Chord Library',
    defaultKey: 0,
    keyMode: 'major',
    sections: [],
    keymap: {},
  },
};

const V2_SECTIONS = {
  'major-harmony': [
    {
      id: 'secdom', flowIcon: ICON_NOLOOP, flowText: "DON'T MIX CHORDS", label: 'Secondary Dominants',
      chords: [
        {roman:'V<sub>I</sub>',   interval:7,  q:'dom7', pianoScale:[0,2,4,5,7,9,10]},
        {roman:'V<sub>vi</sub>',  interval:4,  q:'dom7', pianoScale:[0,1,4,5,7,8,10]},
        {roman:'V<sub>IV</sub>',  interval:0,  q:'dom7', pianoScale:[0,2,4,5,7,9,10]},
        {roman:'V<sub>ii</sub>',  interval:9,  q:'dom7', pianoScale:[0,1,4,5,7,8,10]},
        {roman:'V<sub>V</sub>',   interval:2,  q:'dom7', pianoScale:[0,2,4,5,7,9,10]},
        {roman:'V<sub>iii</sub>', interval:11, q:'dom7', pianoScale:[0,1,4,5,7,8,10]},
      ]
    },
    {
      id: 'main', flowIcon: ICON_DOWN, flowText: 'START HERE · MIX CHORDS', label: 'Main Chords',
      chords: [
        {roman:'I',    interval:0,  q:'maj', ext:'Maj7'},
        {roman:'vi',   interval:9,  q:'min', ext:'7'},
        {roman:'IV',   interval:5,  q:'maj', ext:'Maj7'},
        {roman:'ii',   interval:2,  q:'min', ext:'7'},
        {roman:'V',    interval:7,  q:'maj', ext:'7'},
        {roman:'iii',  interval:4,  q:'min', ext:'7'},
        {roman:'vii°', interval:11, q:'dim', ext:'ø'},
      ]
    },
    {
      id: 'modal', flowIcon: ICON_LOOP, flowText: 'MIX CHORDS', label: 'Modal Interchange',
      chords: [
        {roman:'bIII', interval:3,  q:'maj', ext:'Maj7', pianoScale:[0,2,4,5,7,9,11]},
        {roman:'bVI',  interval:8,  q:'maj', ext:'Maj7', pianoScale:[0,2,4,6,7,9,11]},
        {roman:'iv',   interval:5,  q:'min', ext:'7',    pianoScale:[0,2,3,5,7,9,10]},
        {roman:'bVII', interval:10, q:'maj', ext:'7',    pianoScale:[0,2,4,5,7,9,10]},
        {roman:'ii°',  interval:2,  q:'dim', ext:'ø',    pianoScale:[0,1,3,5,6,8,10]},
      ]
    },
  ],
  'minor-harmony': [
    {
      id: 'sd_v', flowIcon: ICON_LOOP, flowText: 'MIX CHORDS', label: 'Secondary Diminished V',
      chords: [
        {roman:'vii°<sub>V</sub>', interval:6, q:'dim', ext:'7'},
        {roman:'vii°<sub>V</sub>', interval:9, q:'dim', ext:'7'},
        {roman:'vii°<sub>V</sub>', interval:0, q:'dim', ext:'7'},
        {roman:'vii°<sub>V</sub>', interval:3, q:'dim', ext:'7'},
      ],
      neapolitan: {roman:'bII', interval:1, q:'maj', bassInterval:5, ext:'Maj7', pianoScale:[0,2,4,6,7,9,11]}
    },
    {
      id: 'main', flowIcon: ICON_DOWN, flowText: 'MIX CHORDS', label: 'Main Chords',
      chords: [
        {roman:'i',     interval:0,  q:'min', ext:'Maj7'},
        {roman:'bIII+', interval:3,  q:'aug', ext:'Maj7'},
        {roman:'iv',    interval:5,  q:'min', ext:'7'},
        {roman:'bVI',   interval:8,  q:'maj', ext:'Maj7'},
        {roman:'V',     interval:7,  q:'dom7'},
        {roman:'#vii°', interval:11, q:'dim', ext:'7'},
        {roman:'ii°',   interval:2,  q:'dim', ext:'ø'},
      ]
    },
    {
      id: 'sd_iv', flowIcon: ICON_LOOP, flowText: 'MIX CHORDS', label: 'Secondary Diminished iv, bVI',
      chords: [
        {roman:'vii°<sub>iv</sub>', interval:10, q:'dim', ext:'7'},
        {roman:'vii°<sub>iv</sub>', interval:1,  q:'dim', ext:'7'},
        {roman:'vii°<sub>iv</sub>', interval:4,  q:'dim', ext:'7'},
        {roman:'vii°<sub>iv</sub>', interval:7,  q:'dim', ext:'7'},
      ]
    },
  ],
};

const V2_KEYMAPS = {
  'major-harmony': {
    '1':['secdom',0],'2':['secdom',1],'3':['secdom',2],'4':['secdom',3],'5':['secdom',4],'6':['secdom',5],
    'q':['main',0],'w':['main',1],'e':['main',2],'r':['main',3],'t':['main',4],'y':['main',5],'u':['main',6],
    'a':['modal',0],'s':['modal',1],'d':['modal',2],'f':['modal',3],'g':['modal',4],
  },
  'minor-harmony': {
    '1':['sd_v',0],'2':['sd_v',1],'3':['sd_v',2],'4':['sd_v',3],
    '5':['neapolitan',0],
    'q':['main',0],'w':['main',1],'e':['main',2],'r':['main',3],
    't':['main',4],'y':['main',5],'u':['main',6],
    'a':['sd_iv',0],'s':['sd_iv',1],'d':['sd_iv',2],'f':['sd_iv',3],
  },
};

// ============================================================
// STATE
// ============================================================
const state = {
  currentTemplate: 'major-harmony',
  keys: { 'major-harmony': 0, 'minor-harmony': 9, 'scale-chords': 0, 'chord-library': 0 },
  scaleType: 'major',
  octave: 4,
  velocity: 100,
  channel: 0,
  midiEnabled: false,
  midiAccess: null,
  output: null,
  inputPort: null,
  activeChords: new Map(),
  sustain: false,
  audioEnabled: true,
  audioVolume: 0.70,
  // Per-GM-category gain compensation so e.g. bass isn't 6 dB softer than
  // piano. Toggleable from the header. See sf2CategoryGain() for the table.
  volumeBalance: true,
  // Chord-pad output routing: 'instrument' plays the in-app voice, 'midi'
  // sends external MIDI on padChannel and skips the in-app voice. Mirrors
  // the per-track output toggle.
  padOutput: 'instrument',
  padChannel: 0,
  // ID of the MIDI output port the chord-pad sends to in MIDI mode. Empty
  // string = use the global default (state.output).
  padMidiPortId: '',
  // MIDI clock source: if midiClockEnabled, the selected input port drives
  // the master tempo + transport (start/stop). Empty id = none.
  midiClockPortId: '',
  midiClockEnabled: false,
  pitchBendCents: 0,
  instrument: 'epiano',
  bassEnabled: true,
  showScaleTones: false,
  visibleRows: new Set(['sus2', 'triad', 'sus4', 'seventh']),
  rowOrder: ['power','sus2','triad','sus4','sus24','sixth','7sus2','seventh','7sus4','ninth','eleventh','add2','add4'],
  combineParallel: false,
  voicing: 'auto',
  playStyle: 'off',
  tempo: 120,
  beatsPerBar: 4,
  bassOctave: 2,
  showPianoHover: false,
  synth: {
    waveform:      'sine',
    attack:        0.15,
    decay:         0.3,
    sustain:       0.45,
    release:       1.99,
    filterFreq:    880,
    filterQ:       5,
    overtones:     0.55,
    reverb:        0.5,
    detune:        12,
    vibratoRate:   5,
    vibratoDepth:  0,
    tremoloRate:   4,
    tremoloDepth:  0,
    delayTime:     0.3,
    delayFeedback: 0.3,
    delayWet:      0,
    filterLfoDepth: 0,
  },
};

// ============================================================
// HELPERS
// ============================================================
const ENHARMONIC = { 'C♭':'B', 'F♭':'E', 'E♯':'F', 'B♯':'C' };
function chordRootName(keyRoot, interval) {
  const tpl = TEMPLATES[state.currentTemplate];
  const spelling = buildSpelling(keyRoot, tpl.keyMode);
  const name = spelling[(keyRoot + interval) % 12];
  return ENHARMONIC[name] ?? name;
}
function chordDisplayName(keyRoot, interval, q) { return chordRootName(keyRoot, interval) + CHORD_SUFFIX[q]; }
function midiNoteName(n) {
  const tpl = TEMPLATES[state.currentTemplate];
  const keyRoot = state.keys[state.currentTemplate];
  const spelling = buildSpelling(keyRoot, tpl.keyMode);
  return spelling[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1);
}
function chordToMidiNotes(keyRoot, octave, interval, q) {
  const center = 12 * (octave + 1) + keyRoot;
  const pitchClass = (keyRoot + interval) % 12;
  const ivs = CHORD_INTERVALS[q];
  const n = ivs.length;

  // Anchor root octave using average-centering as a starting point
  const baseRoot = pitchClass + Math.round((center - CHORD_AVG_IV[q] - pitchClass) / 12) * 12;

  if (state.voicing === 'root') {
    const root = pitchClass + Math.round((center - pitchClass) / 12) * 12;
    return ivs.map(iv => root + iv);
  }

  // For high/low, shift the target center; auto uses the original center
  const target = state.voicing === 'high' ? center + 7
               : state.voicing === 'low'  ? center - 7
               : center;

  // Try all inversions across ±1 octave; pick the voicing whose average is closest to target
  let best = null;
  let bestDist = Infinity;

  for (let oct = -1; oct <= 1; oct++) {
    const root = baseRoot + oct * 12;
    for (let inv = 0; inv < n; inv++) {
      const notes = [root + ivs[inv]];
      for (let i = 1; i < n; i++) {
        const pc = ((root + ivs[(inv + i) % n]) % 12 + 12) % 12;
        let note = pc;
        while (note <= notes[notes.length - 1]) note += 12;
        notes.push(note);
      }
      const avg = notes.reduce((a, b) => a + b, 0) / n;
      const dist = Math.abs(avg - target);
      if (dist < bestDist) { bestDist = dist; best = notes; }
    }
  }

  if (state.voicing === 'spread' && best.length >= 3) {
    // Drop 2: lower the second-highest note by an octave for an open voicing
    const dropped = [...best];
    dropped[dropped.length - 2] -= 12;
    dropped.sort((a, b) => a - b);
    return dropped;
  }

  return best;
}
function formatChordRoot(name) {
  return name.replace(/([♭♯])/g, '<span class="acc">$1</span>');
}
function qualityToHTML(glyph) {
  return glyph
    .replace(/°/g, '<svg class="q-dim" viewBox="0 0 10 10" width="0.75em" height="0.75em" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="5" cy="5" r="3.5"/></svg>')
    .replace(/ø/g, '<svg class="q-halfdim" viewBox="0 0 10 10" width="0.75em" height="0.75em" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="5" cy="5" r="3.5"/><line x1="1.5" y1="8.5" x2="8.5" y2="1.5"/></svg>')
    .replace(/\+/g, '<svg class="q-aug" viewBox="0 0 10 10" width="0.75em" height="0.75em" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="5" y1="1.5" x2="5" y2="8.5"/><line x1="1.5" y1="5" x2="8.5" y2="5"/></svg>');
}

// ============================================================
// WEB AUDIO ENGINE
// ============================================================
let audioCtx = null;

function _buildAudioCtx() {
  // iOS: unlock audio stack before creating context
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    const dummy = document.createElement('audio');
    dummy.src = 'data:audio/mpeg;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA//////////////////////////////////////////////////////////////////8AAABhTEFNRTMuMTAwA8MAAAAAAAAAABQgJAUHQQAB9AAAAnGMHkkIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQxAADgnABGiAAQBCqgCRMAAgEAH///////////////7+n/9FTuQsQH//////2NG0jWUGlio5gLQTOtIoeR2WX////X4s9Atb/JRVCbBUpeRUq//////////////////9RUi0f2jn/+xDECgPCjAEQAABN4AAANIAAAAQVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==';
    dummy.play().catch(() => {});
    dummy.pause();
  }
  // latencyHint: 0 (numeric) is interpreted as "target output latency in
  // seconds" → asks for the absolute minimum. The string 'interactive' is
  // looser. sampleRate 48000 matches typical hardware in Chrome and skips
  // a resampling stage; Firefox doesn't honour custom rates so let it pick.
  const isFirefox = typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent || '');
  const ctxOpts = { latencyHint: 0 };
  if (!isFirefox) ctxOpts.sampleRate = 48000;
  const ctx = new (window.AudioContext || window.webkitAudioContext)(ctxOpts);
  // Master gain BEFORE the compressor — keeps the summed voice signal
  // below 0 dB so transients on 4+ note chords don't overshoot the
  // compressor input and crackle. Voices connect to ctx._out (this gain).
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.5;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -8;
  comp.ratio.value = 6;
  comp.attack.value = 0.002;
  comp.release.value = 0.20;
  masterGain.connect(comp);
  comp.connect(ctx.destination);
  ctx._out = masterGain;
  // Reverb (synthetic impulse response)
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * 2.5);
  const impulse = ctx.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = impulse.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
  }
  const conv = ctx.createConvolver();
  conv.buffer = impulse;
  const reverbWet = ctx.createGain();
  reverbWet.gain.value = state.synth.reverb;
  conv.connect(reverbWet);
  reverbWet.connect(ctx._out);
  ctx._reverb    = conv;
  ctx._reverbWet = reverbWet;
  // Delay
  const delay = ctx.createDelay(2.0);
  delay.delayTime.value = state.synth.delayTime;
  const delayFb = ctx.createGain();
  delayFb.gain.value = state.synth.delayFeedback;
  const delayWet = ctx.createGain();
  delayWet.gain.value = state.synth.delayWet;
  delay.connect(delayFb); delayFb.connect(delay);
  delay.connect(delayWet); delayWet.connect(ctx._out);
  ctx._delay    = delay;
  ctx._delayFb  = delayFb;
  ctx._delayWet = delayWet;
  // Warm up audio graph so first chord hits a primed compressor
  const wo = ctx.createOscillator();
  const wg = ctx.createGain(); wg.gain.value = 0;
  wo.connect(wg); wg.connect(ctx._out);
  wo.start(); wo.stop(ctx.currentTime + 0.01);
  return ctx;
}

// Release audio device cleanly on page unload so Windows doesn't get stuck
window.addEventListener('beforeunload', () => { audioCtx?.close(); });

function getAudioCtx() {
  if (audioCtx?.state === 'closed') audioCtx = null;
  if (!audioCtx) audioCtx = _buildAudioCtx();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function midiToFreq(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

// ============================================================
// SAMPLE INSTRUMENTS
// ============================================================
// All 88 semitones A0–C8
const SAMPLE_MIDIS = Array.from({length: 88}, (_, i) => i + 21);
const SOUNDFONT_BASE = 'https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/FluidR3_GM/';
const SAMPLE_DEFS = {
  piano:   { dir: 'acoustic_grand_piano-mp3', decay: true },
  epiano:  { dir: 'electric_piano_1-mp3',     decay: true },
  epiano2: { dir: 'electric_piano_2-mp3',     decay: true },
  organ:   { dir: 'drawbar_organ-mp3' },
  strings: { dir: 'string_ensemble_1-mp3' },
  choir:   { dir: 'choir_aahs-mp3' },
  vibes:   { dir: 'vibraphone-mp3',           decay: true },
  pad:     { dir: 'pad_2_warm-mp3' },
};
const sampleCache = Object.fromEntries(Object.keys(SAMPLE_DEFS).map(k => [k, {}]));

function midiToSampleName(midi) {
  const names = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  return names[midi % 12] + (Math.floor(midi / 12) - 1);
}

function nearestSampleMidi(instrument, midiNote) {
  return SAMPLE_MIDIS.reduce((best, m) => Math.abs(m - midiNote) < Math.abs(best - midiNote) ? m : best, SAMPLE_MIDIS[0]);
}

function fetchSample(instrument, midiNote) {
  if (!sampleCache[instrument]) return Promise.resolve(null);
  const cached = sampleCache[instrument][midiNote];
  if (cached instanceof AudioBuffer) return Promise.resolve(cached);
  if (cached instanceof Promise) return cached;
  const url = SOUNDFONT_BASE + SAMPLE_DEFS[instrument].dir + '/' + midiToSampleName(midiNote) + '.mp3';
  const p = new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 0) {
        getAudioCtx().decodeAudioData(xhr.response,
          decoded => { sampleCache[instrument][midiNote] = decoded; resolve(decoded); },
          err     => { console.error('decode failed', url, err); sampleCache[instrument][midiNote] = null; resolve(null); }
        );
      } else {
        console.error('load failed', url, xhr.status);
        sampleCache[instrument][midiNote] = null;
        resolve(null);
      }
    };
    xhr.onerror = () => { console.error('xhr error', url); sampleCache[instrument][midiNote] = null; resolve(null); };
    xhr.send();
  });
  sampleCache[instrument][midiNote] = p;
  return p;
}

// Instruments load immediately on page-init. Chrome will show a one-time
// console warning about AudioContext starting before a user gesture; the
// context stays suspended until the first interaction and audio still
// plays correctly.
function preloadSamplesOnGesture(instrument) { return preloadSamples(instrument); }
// Kick off the (large) SF2 download right away too.
setTimeout(() => loadSf2('fluid'), 0);

async function preloadSamples(instrument) {
  const el = document.getElementById('synth-loading');
  el.style.color = 'var(--accent)';
  el.style.display = '';
  const midis = SAMPLE_MIDIS;
  let done = 0;
  el.textContent = `loading 0/${midis.length}…`;
  await Promise.all(midis.map(m => fetchSample(instrument, m).then(r => {
    done++;
    el.textContent = `loading ${done}/${midis.length}…`;
    return r;
  })));
  const failed = midis.filter(m => !sampleCache[instrument][m]);
  if (failed.length) {
    el.style.color = '#f55'; el.textContent = `${failed.length} samples failed (check console)`;
  } else {
    el.style.display = 'none';
  }
}

function startSampleNote(midiNote, velocity, at = null, autoRelease = null, instrumentOverride = null) {
  const instrument = instrumentOverride ?? state.instrument;
  const ctx = getAudioCtx();
  const t = at ?? ctx.currentTime;
  const s = state.synth;
  const sampleMidi = nearestSampleMidi(instrument, midiNote);
  const buffer = sampleCache[instrument][sampleMidi];
  if (!(buffer instanceof AudioBuffer)) return null;

  const playbackRate = Math.pow(2, (midiNote - sampleMidi) / 12);
  const peak = (velocity / 127) * state.audioVolume * 6;

  const sampleDuration = buffer.duration / playbackRate;
  const sustainStart   = t + s.attack + s.decay;
  const naturalEnd     = t + sampleDuration;

  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(peak, t + s.attack);
  env.gain.exponentialRampToValueAtTime(Math.max(peak * s.sustain, 0.0001), sustainStart);
  env.gain.setValueAtTime(peak * s.sustain, sustainStart);
  // Sample has a finite duration: fade the envelope so the buffer ending
  // doesn't sound like an abrupt cutoff.
  if (naturalEnd > sustainStart) {
    if (SAMPLE_DEFS[instrument].decay) {
      // Decay instruments (piano, e-piano, vibes): one long linear taper —
      // matches the sample's own decay shape.
      env.gain.linearRampToValueAtTime(0.0001, naturalEnd);
    } else {
      // Sustained instruments (organ, strings, choir, pad): hold the
      // sustain plateau, then fade out over the final ~0.4 s of the sample.
      const fadeDur   = 0.4;
      const fadeStart = Math.max(sustainStart + 0.05, naturalEnd - fadeDur);
      env.gain.setValueAtTime(peak * s.sustain, fadeStart);
      env.gain.linearRampToValueAtTime(0.0001, naturalEnd);
    }
  }
  env.connect(ctx._out);

  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = s.filterFreq; lp.Q.value = s.filterQ;
  const tremGain = ctx.createGain(); tremGain.gain.value = 1;
  lp.connect(tremGain); tremGain.connect(env);

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.playbackRate.value = playbackRate;
  src.loop = false;
  src.connect(lp);

  if (ctx._reverb) {
    ctx._reverbWet.gain.value = s.reverb;
    const rs = ctx.createGain(); rs.gain.value = 0.5;
    env.connect(rs); rs.connect(ctx._reverb);
  }
  if (ctx._delay) {
    ctx._delay.delayTime.value = s.delayTime;
    ctx._delayFb.gain.value = s.delayFeedback;
    ctx._delayWet.gain.value = s.delayWet;
    env.connect(ctx._delay);
  }

  const oscs = [src];
  if (s.tremoloDepth > 0) {
    tremGain.gain.value = 1 - s.tremoloDepth * 0.5;
    const tLfo = ctx.createOscillator(); tLfo.frequency.value = s.tremoloRate;
    const tg = ctx.createGain(); tg.gain.value = s.tremoloDepth * 0.5;
    tLfo.connect(tg); tg.connect(tremGain.gain); tLfo.start(t); oscs.push(tLfo);
  }
  if (s.filterLfoDepth > 0) {
    const fLfo = ctx.createOscillator(); fLfo.frequency.value = 1.0;
    const fg = ctx.createGain(); fg.gain.value = s.filterLfoDepth;
    fLfo.connect(fg); fg.connect(lp.frequency); fLfo.start(t); oscs.push(fLfo);
  }

  if (state.pitchBendCents) src.detune.value = state.pitchBendCents;
  src.start(t);
  const sampleNode = { oscs, env, startTime: t, peak };
  if (autoRelease !== null) {
    const rel = t + autoRelease;
    const relDur = 0.05;
    sampleNode.env.gain.setValueAtTime(peak * s.sustain, rel);
    sampleNode.env.gain.exponentialRampToValueAtTime(0.0001, rel + relDur);
    src.stop(rel + relDur + 0.005);
  }
  return sampleNode;
}

function startAudioNote(midiNote, velocity, at = null, autoRelease = null, instrumentOverride = null) {
  const instrument = instrumentOverride ?? state.instrument;
  // Try the SF2 path for instruments we have a GM mapping for. If the SF2
  // isn't loaded yet, kick off the load and fall back to the MP3 sampler
  // until it arrives.
  const sf2Preset = INSTRUMENT_TO_SF2[instrument];
  if (sf2Preset != null) {
    const entry = SF2_FILES.fluid;
    if (entry.sf2) {
      const n = startSf2Voice(midiNote, velocity, at, autoRelease, entry.sf2, sf2Preset);
      if (n) return n;
    } else {
      loadSf2('fluid');
    }
  }
  if (instrument !== 'synth') return startSampleNote(midiNote, velocity, at, autoRelease, instrument);
  const ctx = getAudioCtx();
  const t   = at ?? ctx.currentTime;
  const s   = state.synth;
  const freq = midiToFreq(midiNote);
  const peak = (velocity / 127) * state.audioVolume * 0.6;

  // Envelope
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(peak, t + s.attack);
  env.gain.exponentialRampToValueAtTime(Math.max(peak * s.sustain, 0.0001), t + s.attack + s.decay);
  env.gain.setValueAtTime(peak * s.sustain, t + s.attack + s.decay);
  env.connect(ctx._out);

  // Filter
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = s.filterFreq;
  lp.Q.value = s.filterQ;

  // Tremolo gain sits between filter and env (gain=1 = no effect)
  const tremGain = ctx.createGain();
  tremGain.gain.value = 1;
  lp.connect(tremGain);
  tremGain.connect(env);

  // Pre-filter mix gain keeps summed oscillators below 1.0
  const mix = ctx.createGain();
  mix.gain.value = 0.42;
  mix.connect(lp);

  // Oscillators
  const osc1 = ctx.createOscillator();
  osc1.type = s.waveform;
  osc1.frequency.value = freq;
  osc1.connect(mix);

  const osc2 = ctx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.value = freq * 2;
  const g2 = ctx.createGain(); g2.gain.value = s.overtones * 0.65;
  osc2.connect(g2); g2.connect(mix);

  const osc3 = ctx.createOscillator();
  osc3.type = 'sine';
  osc3.frequency.value = freq * 3;
  const g3 = ctx.createGain(); g3.gain.value = s.overtones * 0.22;
  osc3.connect(g3); g3.connect(mix);

  // Reverb send
  if (ctx._reverb) {
    ctx._reverbWet.gain.value = s.reverb;
    const reverbSend = ctx.createGain();
    reverbSend.gain.value = 0.5;
    env.connect(reverbSend);
    reverbSend.connect(ctx._reverb);
  }

  // Delay send
  if (ctx._delay) {
    ctx._delay.delayTime.value = s.delayTime;
    ctx._delayFb.gain.value    = s.delayFeedback;
    ctx._delayWet.gain.value   = s.delayWet;
    env.connect(ctx._delay);
  }

  // Collect pitch oscs for vibrato targeting
  const oscs = [osc1, osc2, osc3];

  // Detuned pair for chorus/pad width
  if (s.detune > 0) {
    const oscA = ctx.createOscillator(); oscA.type = 'sine';
    oscA.frequency.value = freq; oscA.detune.value = s.detune;
    const oscB = ctx.createOscillator(); oscB.type = 'sine';
    oscB.frequency.value = freq; oscB.detune.value = -s.detune;
    const dg = ctx.createGain(); dg.gain.value = 0.45;
    oscA.connect(dg); oscB.connect(dg); dg.connect(mix);
    oscA.start(t); oscB.start(t);
    oscs.push(oscA, oscB);
  }

  // Vibrato LFO → all pitch osc detune params
  if (s.vibratoDepth > 0) {
    const vLfo = ctx.createOscillator();
    vLfo.frequency.value = s.vibratoRate;
    const vGain = ctx.createGain();
    vGain.gain.value = s.vibratoDepth;
    vLfo.connect(vGain);
    oscs.forEach(o => vGain.connect(o.detune));
    vLfo.start(t);
    oscs.push(vLfo);
  }

  // Tremolo LFO → tremGain.gain
  if (s.tremoloDepth > 0) {
    tremGain.gain.value = 1 - s.tremoloDepth * 0.5;
    const tLfo = ctx.createOscillator();
    tLfo.frequency.value = s.tremoloRate;
    const tLfoGain = ctx.createGain();
    tLfoGain.gain.value = s.tremoloDepth * 0.5;
    tLfo.connect(tLfoGain);
    tLfoGain.connect(tremGain.gain);
    tLfo.start(t);
    oscs.push(tLfo);
  }

  // Filter LFO
  if (s.filterLfoDepth > 0) {
    const fLfo = ctx.createOscillator();
    fLfo.frequency.value = 1.0;
    const fLfoGain = ctx.createGain();
    fLfoGain.gain.value = s.filterLfoDepth;
    fLfo.connect(fLfoGain);
    fLfoGain.connect(lp.frequency);
    fLfo.start(t);
    oscs.push(fLfo);
  }

  osc1.start(t); osc2.start(t); osc3.start(t);
  const synthNode = { oscs, env, startTime: t, peak };
  if (autoRelease !== null) {
    const rel = t + autoRelease;
    const relDur = Math.min(s.release * 0.4, 0.06);
    synthNode.env.gain.setValueAtTime(synthNode.peak * s.sustain, rel);
    synthNode.env.gain.exponentialRampToValueAtTime(0.0001, rel + relDur);
    synthNode.oscs.forEach(o => { try { o.stop(rel + relDur + 0.005); } catch(e) {} });
  }
  return synthNode;
}

// ============================================================
// SoundFont 2 (FluidR3_GM) playback path
// ============================================================
//
// We re-use the existing 8 instrument labels (piano / epiano / .../ pad),
// but route them through the SF2 voice so notes can actually sustain via
// the SF2's embedded sample loops, with proper per-preset filter, pan,
// envelope and tuning settings — i.e. how the soundfont author intended.

// FluidR3 is too big (148MB) for GitHub Pages to serve directly (it returns
// the Git-LFS pointer instead of the binary), and GitHub Release assets are
// CORS-blocked for cross-origin fetch. So the canonical copy lives in a
// public GCS bucket with CORS enabled. Local file:// / dev-server installs
// still have the LFS-pulled binary at sf2/FluidR3_GM.sf2 as a fallback.
const SF2_FILES = {
  fluid: {
    url: 'https://storage.googleapis.com/chord-pad-assets-jo/FluidR3_GM.sf2',
    fallbackUrl: 'sf2/FluidR3_GM.sf2',
    sf2: null, loading: null, total: 0, loaded: 0,
  },
};
const SF2_BUFFER_CACHE = new Map(); // sample object → AudioBuffer

// Map our instrument labels → GM program numbers in FluidR3_GM (bank 0)
const INSTRUMENT_TO_SF2 = {
  piano:   0,   // Yamaha Grand Piano
  epiano:  4,   // Rhodes EP
  epiano2: 5,   // Legend EP 2
  vibes:   11,  // Vibraphone
  organ:   16,  // Drawbar Organ
  strings: 48,  // Strings
  choir:   52,  // Ahh Choir
  pad:     89,  // Warm Pad
};

// Full General MIDI bank, grouped by category. Used to populate the
// per-track instrument picker. Each entry has the GM preset number and a
// display name; lookup IDs default to `gm<N>` unless a friendlier short
// name already exists in INSTRUMENT_TO_SF2 above.
const GM_CATEGORIES = [
  { name: 'Piano',       presets: [
    { n: 0, name: 'Acoustic Grand' }, { n: 1, name: 'Bright Acoustic' },
    { n: 2, name: 'Electric Grand' }, { n: 3, name: 'Honky-tonk' },
    { n: 4, name: 'Rhodes' }, { n: 5, name: 'Chorused EP' },
    { n: 6, name: 'Harpsichord' }, { n: 7, name: 'Clavinet' },
  ]},
  { name: 'Mallets',     presets: [
    { n: 8, name: 'Celesta' }, { n: 9, name: 'Glockenspiel' },
    { n: 10, name: 'Music Box' }, { n: 11, name: 'Vibraphone' },
    { n: 12, name: 'Marimba' }, { n: 13, name: 'Xylophone' },
    { n: 14, name: 'Tubular Bells' }, { n: 15, name: 'Dulcimer' },
  ]},
  { name: 'Organ',       presets: [
    { n: 16, name: 'Drawbar' }, { n: 17, name: 'Percussive' },
    { n: 18, name: 'Rock' }, { n: 19, name: 'Church' },
    { n: 20, name: 'Reed' }, { n: 21, name: 'Accordion' },
    { n: 22, name: 'Harmonica' }, { n: 23, name: 'Tango Accordion' },
  ]},
  { name: 'Guitar',      presets: [
    { n: 24, name: 'Nylon' }, { n: 25, name: 'Steel' },
    { n: 26, name: 'Jazz' }, { n: 27, name: 'Clean Electric' },
    { n: 28, name: 'Muted' }, { n: 29, name: 'Overdrive' },
    { n: 30, name: 'Distortion' }, { n: 31, name: 'Harmonics' },
  ]},
  { name: 'Bass',        presets: [
    { n: 32, name: 'Acoustic' }, { n: 33, name: 'Fingered' },
    { n: 34, name: 'Picked' }, { n: 35, name: 'Fretless' },
    { n: 36, name: 'Slap 1' }, { n: 37, name: 'Slap 2' },
    { n: 38, name: 'Synth Bass 1' }, { n: 39, name: 'Synth Bass 2' },
  ]},
  { name: 'Strings',     presets: [
    { n: 40, name: 'Violin' }, { n: 41, name: 'Viola' },
    { n: 42, name: 'Cello' }, { n: 43, name: 'Contrabass' },
    { n: 44, name: 'Tremolo Strings' }, { n: 45, name: 'Pizzicato' },
    { n: 46, name: 'Harp' }, { n: 47, name: 'Timpani' },
  ]},
  { name: 'Ensemble',    presets: [
    { n: 48, name: 'String Ens 1' }, { n: 49, name: 'String Ens 2' },
    { n: 50, name: 'Synth Strings 1' }, { n: 51, name: 'Synth Strings 2' },
    { n: 52, name: 'Choir Aahs' }, { n: 53, name: 'Voice Oohs' },
    { n: 54, name: 'Synth Voice' }, { n: 55, name: 'Orchestra Hit' },
  ]},
  { name: 'Brass',       presets: [
    { n: 56, name: 'Trumpet' }, { n: 57, name: 'Trombone' },
    { n: 58, name: 'Tuba' }, { n: 59, name: 'Muted Trumpet' },
    { n: 60, name: 'French Horn' }, { n: 61, name: 'Brass Section' },
    { n: 62, name: 'Synth Brass 1' }, { n: 63, name: 'Synth Brass 2' },
  ]},
  { name: 'Reed',        presets: [
    { n: 64, name: 'Soprano Sax' }, { n: 65, name: 'Alto Sax' },
    { n: 66, name: 'Tenor Sax' }, { n: 67, name: 'Baritone Sax' },
    { n: 68, name: 'Oboe' }, { n: 69, name: 'English Horn' },
    { n: 70, name: 'Bassoon' }, { n: 71, name: 'Clarinet' },
  ]},
  { name: 'Flute / Pipe',presets: [
    { n: 72, name: 'Piccolo' }, { n: 73, name: 'Flute' },
    { n: 74, name: 'Recorder' }, { n: 75, name: 'Pan Flute' },
    { n: 76, name: 'Blown Bottle' }, { n: 77, name: 'Shakuhachi' },
    { n: 78, name: 'Whistle' }, { n: 79, name: 'Ocarina' },
  ]},
  { name: 'Synth Lead',  presets: [
    { n: 80, name: 'Square' }, { n: 81, name: 'Sawtooth' },
    { n: 82, name: 'Calliope' }, { n: 83, name: 'Chiff' },
    { n: 84, name: 'Charang' }, { n: 85, name: 'Voice' },
    { n: 86, name: 'Fifths' }, { n: 87, name: 'Bass + Lead' },
  ]},
  { name: 'Synth Pad',   presets: [
    { n: 88, name: 'New Age' }, { n: 89, name: 'Warm Pad' },
    { n: 90, name: 'Polysynth' }, { n: 91, name: 'Choir Pad' },
    { n: 92, name: 'Bowed' }, { n: 93, name: 'Metallic' },
    { n: 94, name: 'Halo' }, { n: 95, name: 'Sweep' },
  ]},
  { name: 'Synth FX',    presets: [
    { n: 96, name: 'Rain' }, { n: 97, name: 'Soundtrack' },
    { n: 98, name: 'Crystal' }, { n: 99, name: 'Atmosphere' },
    { n: 100, name: 'Brightness' }, { n: 101, name: 'Goblins' },
    { n: 102, name: 'Echoes' }, { n: 103, name: 'Sci-Fi' },
  ]},
  { name: 'Ethnic',      presets: [
    { n: 104, name: 'Sitar' }, { n: 105, name: 'Banjo' },
    { n: 106, name: 'Shamisen' }, { n: 107, name: 'Koto' },
    { n: 108, name: 'Kalimba' }, { n: 109, name: 'Bagpipe' },
    { n: 110, name: 'Fiddle' }, { n: 111, name: 'Shanai' },
  ]},
  { name: 'Percussive',  presets: [
    { n: 112, name: 'Tinkle Bell' }, { n: 113, name: 'Agogo' },
    { n: 114, name: 'Steel Drums' }, { n: 115, name: 'Woodblock' },
    { n: 116, name: 'Taiko' }, { n: 117, name: 'Melodic Tom' },
    { n: 118, name: 'Synth Drum' }, { n: 119, name: 'Reverse Cymbal' },
  ]},
  { name: 'SFX',         presets: [
    { n: 120, name: 'Fret Noise' }, { n: 121, name: 'Breath' },
    { n: 122, name: 'Seashore' }, { n: 123, name: 'Bird Tweet' },
    { n: 124, name: 'Telephone' }, { n: 125, name: 'Helicopter' },
    { n: 126, name: 'Applause' }, { n: 127, name: 'Gunshot' },
  ]},
];
// Build a reverse map: preset N → friendly short key (if any).
const SF2_PRESET_TO_SHORT = {};
for (const [shortKey, n] of Object.entries(INSTRUMENT_TO_SF2)) SF2_PRESET_TO_SHORT[n] = shortKey;
// Register every GM preset under a `gm<N>` ID so playback can resolve it.
for (const cat of GM_CATEGORIES) {
  for (const p of cat.presets) {
    if (SF2_PRESET_TO_SHORT[p.n]) continue; // already has a friendlier key
    INSTRUMENT_TO_SF2['gm' + p.n] = p.n;
  }
}
// GM-category makeup gain in dB — compensates for the wildly different
// recorded loudness of FluidR3 presets. Values are deliberately gentle;
// the user can still fine-tune with per-track volume sliders. Toggle the
// whole thing off via state.volumeBalance.
const GM_CATEGORY_GAIN_DB = {
  Piano:           0,
  Mallets:        -1,
  Organ:          -3,
  Guitar:         -1,
  Bass:           +6,
  Strings:        +2,
  Ensemble:       -1,
  Brass:          -2,
  Reed:           +1,
  'Flute / Pipe': +1,
  'Synth Lead':   -2,
  'Synth Pad':    +2,
  'Synth FX':      0,
  Ethnic:          0,
  Percussive:     -2,
  'Sound Effects': 0,
};
// Build preset-number → linear-gain lookup so the lookup is O(1) per voice.
const SF2_PRESET_GAIN = (() => {
  const map = new Object();
  for (const cat of GM_CATEGORIES) {
    const db = GM_CATEGORY_GAIN_DB[cat.name] ?? 0;
    const lin = Math.pow(10, db / 20);
    for (const p of cat.presets) map[p.n] = lin;
  }
  return map;
})();
function sf2CategoryGain(presetN) {
  if (!state.volumeBalance) return 1;
  return SF2_PRESET_GAIN[presetN] ?? 1;
}
// Resolve an instrument ID to its display name.
function instrumentDisplayName(id) {
  if (!id) return 'Instrument';
  if (id === 'synth') return 'Synth';
  for (const cat of GM_CATEGORIES) {
    for (const p of cat.presets) {
      const presetId = SF2_PRESET_TO_SHORT[p.n] || ('gm' + p.n);
      if (presetId === id) return p.name;
    }
  }
  return id;
}

function sf2ProgressEl() { return document.getElementById('sf2-progress'); }
function sf2UpdateProgress(text) {
  const el = sf2ProgressEl();
  if (!el) return;
  if (!text) { el.style.display = 'none'; return; }
  el.style.display = '';
  el.textContent = text;
}

function loadSf2(fileKey) {
  const entry = SF2_FILES[fileKey];
  if (!entry) return Promise.resolve(null);
  if (entry.sf2)     return Promise.resolve(entry.sf2);
  if (entry.loading) return entry.loading;
  const ns = window.SoundFont2;
  const Ctor = typeof ns === 'function' ? ns : (ns && ns.SoundFont2);
  if (typeof Ctor !== 'function') return Promise.resolve(null);
  sf2UpdateProgress('Downloading instruments…');
  entry.loading = (async () => {
    const tryUrl = async (url) => {
      const resp = await fetch(url);
      if (!resp.ok || !resp.body) throw new Error('http ' + resp.status);
      // Tiny responses are almost certainly Git-LFS pointer files served by
      // GitHub Pages — reject so we fall through to the next URL.
      const cl = parseInt(resp.headers.get('Content-Length') || '0', 10);
      if (cl > 0 && cl < 4096) throw new Error('lfs-pointer (' + cl + ' bytes)');
      return resp;
    };
    try {
      let resp;
      try { resp = await tryUrl(entry.url); }
      catch (e1) {
        if (!entry.fallbackUrl) throw e1;
        console.warn('SF2 primary url failed', entry.url, e1, '→ falling back to', entry.fallbackUrl);
        resp = await tryUrl(entry.fallbackUrl);
      }
      if (!resp.ok || !resp.body) throw new Error('http ' + resp.status);
      const total = parseInt(resp.headers.get('Content-Length') || '0', 10);
      entry.total = total;
      const reader = resp.body.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        entry.loaded += value.length;
        if (total > 0) {
          const pct = Math.round(entry.loaded / total * 100);
          sf2UpdateProgress(`Downloading instruments… ${pct}%`);
        }
      }
      const buf = await new Blob(chunks).arrayBuffer();
      sf2UpdateProgress('Parsing instruments…');
      // Yield briefly so the UI can paint before the synchronous parse
      await new Promise(r => setTimeout(r, 16));
      entry.sf2 = new Ctor(new Uint8Array(buf));
      sf2UpdateProgress('');
      return entry.sf2;
    } catch (err) {
      console.error('SF2 load failed', entry.url, err);
      sf2UpdateProgress('Instrument download failed');
      setTimeout(() => sf2UpdateProgress(''), 4000);
      return null;
    }
  })();
  return entry.loading;
}

function sf2BufferFromSample(ctx, sample) {
  let buf = SF2_BUFFER_CACHE.get(sample);
  if (buf) return buf;
  const data = sample.data;
  const sr = sample.header.sampleRate || 44100;
  buf = ctx.createBuffer(1, data.length, sr);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) ch[i] = data[i] / 32768;
  SF2_BUFFER_CACHE.set(sample, buf);
  return buf;
}

// Eagerly decode every sample referenced by `presetNumber` in `sf2`, in
// small chunks so the UI doesn't stutter. Without this, the first note of
// a preset incurs a 5-50 ms decode + cache fill, making playback feel
// late after an external Start (MIDI Clock) command.
const _sf2Prewarmed = new Set(); // key: `${sf2-something}:${presetNumber}`
function prewarmSf2Preset(sf2, presetNumber) {
  if (!sf2 || presetNumber == null) return;
  const key = (sf2._cpId || (sf2._cpId = Math.random())) + ':' + presetNumber;
  if (_sf2Prewarmed.has(key)) return;
  _sf2Prewarmed.add(key);
  const ctx = getAudioCtx();
  let midi = 21;
  const tick = () => {
    let count = 0;
    while (midi <= 108 && count < 6) {
      try {
        const kd = sf2.getKeyData(midi, 0, presetNumber);
        if (kd?.sample) sf2BufferFromSample(ctx, kd.sample);
      } catch (_) {}
      midi += 1;
      count += 1;
    }
    if (midi <= 108) setTimeout(tick, 0);
  };
  tick();
}

// Generator-id constants (SF2 spec 2.04)
const SF2G = {
  ModLFOToPitch: 5, VibLFOToPitch: 6, ModEnvToPitch: 7,
  InitialFilterFc: 8, InitialFilterQ: 9,
  ModLFOToFilterFc: 10, ModEnvToFilterFc: 11,
  ModLFOToVolume: 13,
  Pan: 17,
  DelayModLFO: 21, FreqModLFO: 22, DelayVibLFO: 23, FreqVibLFO: 24,
  DelayModEnv: 25, AttackModEnv: 26, HoldModEnv: 27, DecayModEnv: 28,
  SustainModEnv: 29, ReleaseModEnv: 30,
  DelayVolEnv: 33, AttackVolEnv: 34, HoldVolEnv: 35, DecayVolEnv: 36,
  SustainVolEnv: 37, ReleaseVolEnv: 38,
  InitialAttenuation: 48,
  CoarseTune: 51, FineTune: 52,
  SampleModes: 54, ScaleTuning: 56, OverridingRootKey: 58,
};

function sf2Gen(keyData, id) {
  const g = keyData.generators?.[id];
  if (g == null) return undefined;
  return typeof g === 'object' ? g.value : g;
}

// SF2 absolute-cents → Hz: f = 8.176 * 2^(cents/1200)
function absoluteCentsToHz(cents) { return 8.176 * Math.pow(2, cents / 1200); }
// Timecents → seconds, clamped to a sane minimum
function timecentsToSec(tc) { return Math.max(0.001, Math.pow(2, tc / 1200)); }

function startSf2Voice(midiNote, velocity, at, autoRelease, sf2, presetNumber) {
  const keyData = sf2.getKeyData(midiNote, 0, presetNumber);
  if (!keyData || !keyData.sample) return null;
  const ctx = getAudioCtx();
  const t   = at ?? ctx.currentTime;
  const s   = state.synth;
  const sample = keyData.sample;
  const sr     = sample.header.sampleRate || 44100;
  const buffer = sf2BufferFromSample(ctx, sample);
  const g = (id) => sf2Gen(keyData, id);

  // --- Pitch ---------------------------------------------------------
  const overridingRoot = g(SF2G.OverridingRootKey);
  const rootPitch  = (overridingRoot != null && overridingRoot >= 0) ? overridingRoot : sample.header.originalPitch;
  const coarseTune = g(SF2G.CoarseTune) ?? 0;
  const fineTune   = (g(SF2G.FineTune) ?? 0) + (sample.header.pitchCorrection || 0);
  const scaleTune  = g(SF2G.ScaleTuning) ?? 100; // cents per semitone (100 = ET)
  const semitones  = ((midiNote - rootPitch) * scaleTune) / 100 + coarseTune + fineTune / 100;

  // --- Filter --------------------------------------------------------
  // Per-track filter only overrides when the user actually moved it off
  // the preset default. Otherwise honour the SF2 generator so the preset
  // sounds as designed.
  const FP = INSTRUMENT_PRESETS?.epiano;
  let filterFreq, filterQ;
  if (FP && Math.abs((s.filterFreq ?? FP.filterFreq) - FP.filterFreq) > 1) {
    filterFreq = Math.min(20000, Math.max(20, s.filterFreq));
  } else {
    const filterCents = g(SF2G.InitialFilterFc) ?? 13500;
    filterFreq = Math.min(20000, Math.max(20, absoluteCentsToHz(filterCents)));
  }
  if (FP && Math.abs((s.filterQ ?? FP.filterQ) - FP.filterQ) > 0.01) {
    filterQ = s.filterQ;
  } else {
    const filterQCB = g(SF2G.InitialFilterQ) ?? 0;
    filterQ = Math.max(0.001, Math.pow(10, filterQCB / 200));
  }

  // --- Output level (attenuation) -----------------------------------
  // Ignore SF2's InitialAttenuation so every preset plays at the same
  // baseline volume — the user adjusts per-track volume sliders for any
  // balance they want, rather than fighting preset-specific attenuation.
  // Optional category-based makeup gain compensates for the fact that
  // some GM categories (bass especially) are recorded much softer.
  const peak = (velocity / 127) * state.audioVolume * sf2CategoryGain(presetNumber);

  // --- Volume envelope: per-track ADSR overrides the SF2 generators when
  // it deviates noticeably from the e-piano preset defaults (= the user
  // moved a slider). Otherwise fall back to SF2 generators with caps.
  const PRESET = INSTRUMENT_PRESETS?.epiano;
  const aT = (PRESET && Math.abs(s.attack  - PRESET.attack)  > 0.002) ? Math.min(s.attack, 4)
           : Math.min(g(SF2G.AttackVolEnv)  != null ? timecentsToSec(g(SF2G.AttackVolEnv))  : s.attack,  4);
  const dT = (PRESET && Math.abs(s.decay   - PRESET.decay)   > 0.01)  ? Math.min(s.decay, 8)
           : Math.min(g(SF2G.DecayVolEnv)   != null ? timecentsToSec(g(SF2G.DecayVolEnv))   : s.decay,   8);
  const sL = (PRESET && Math.abs(s.sustain - PRESET.sustain) > 0.01)  ? s.sustain
           : (g(SF2G.SustainVolEnv) != null
                ? Math.max(0, 1 - Math.min(g(SF2G.SustainVolEnv), 1000) / 1000)
                : s.sustain);
  const rT = (PRESET && Math.abs(s.release - PRESET.release) > 0.02)  ? Math.min(s.release, 6)
           : Math.min(g(SF2G.ReleaseVolEnv) != null ? timecentsToSec(g(SF2G.ReleaseVolEnv)) : s.release, 6);

  // --- Build graph ---------------------------------------------------
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(peak, t + aT);
  env.gain.exponentialRampToValueAtTime(Math.max(peak * sL, 0.0001), t + aT + dT);
  env.gain.setValueAtTime(peak * sL, t + aT + dT);
  env.connect(ctx._out);

  // Tremolo: a gain stage just before the envelope, modulated by an LFO.
  // Routes filter → tremGain → env so the LFO is applied to the dry signal
  // before the envelope/output.
  const tremGain = ctx.createGain();
  tremGain.gain.value = 1;
  tremGain.connect(env);
  let tLfo = null;
  if (s.tremoloDepth > 0) {
    tremGain.gain.value = 1 - s.tremoloDepth * 0.5;
    tLfo = ctx.createOscillator();
    tLfo.frequency.value = s.tremoloRate;
    const tLfoGain = ctx.createGain();
    tLfoGain.gain.value = s.tremoloDepth * 0.5;
    tLfo.connect(tLfoGain);
    tLfoGain.connect(tremGain.gain);
    tLfo.start(t);
  }

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  filter.Q.value = filterQ;
  filter.connect(tremGain);

  const sampleModes = g(SF2G.SampleModes) ?? 0;
  const wantLoop = sampleModes === 1 || sampleModes === 3;

  // Every SF2 voice plays centered. The SF2 Pan generator in FluidR3 is set
  // for hard-stereo pairs (left/right halves) per preset — honouring it on
  // a mono buffer makes presets like Strings end up only in one speaker.
  // The audio context automatically upmixes mono to stereo at the output.
  const sources = [(() => {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = Math.pow(2, semitones / 12);
    if (wantLoop) {
      const lS = sample.header.startLoop, lE = sample.header.endLoop;
      if (lE > lS && lE <= buffer.length) {
        src.loop = true;
        src.loopStart = lS / sr;
        src.loopEnd   = lE / sr;
      }
    }
    src.connect(filter);
    return src;
  })()];

  // --- Vibrato LFO → pitch (subtle, just enough for character) -------
  const vibLfoToPitch = g(SF2G.VibLFOToPitch);
  let vibLfo = null;
  if (vibLfoToPitch && Math.abs(vibLfoToPitch) > 0.01) {
    const lfoFreq  = absoluteCentsToHz(g(SF2G.FreqVibLFO) ?? -2400);
    const lfoDelay = timecentsToSec(g(SF2G.DelayVibLFO) ?? -7200);
    vibLfo = ctx.createOscillator(); vibLfo.frequency.value = lfoFreq;
    const gAmp = ctx.createGain(); gAmp.gain.value = 0;
    vibLfo.connect(gAmp);
    sources.forEach(src => gAmp.connect(src.detune));
    gAmp.gain.setValueAtTime(0, t);
    gAmp.gain.setValueAtTime(0, t + lfoDelay);
    gAmp.gain.linearRampToValueAtTime(vibLfoToPitch, t + lfoDelay + 0.05);
    vibLfo.start(t);
  }

  // --- Reverb / delay sends (use the global FX bus) ------------------
  if (ctx._reverb) {
    ctx._reverbWet.gain.value = s.reverb;
    const rs = ctx.createGain(); rs.gain.value = 0.5;
    env.connect(rs); rs.connect(ctx._reverb);
  }
  if (ctx._delay) {
    ctx._delay.delayTime.value = s.delayTime;
    ctx._delayFb.gain.value = s.delayFeedback;
    ctx._delayWet.gain.value = s.delayWet;
    env.connect(ctx._delay);
  }

  if (state.pitchBendCents) {
    sources.forEach(src => { src.detune.value = (src.detune.value || 0) + state.pitchBendCents; });
  }
  sources.forEach(src => src.start(t));

  const oscs = [...sources];
  if (vibLfo) oscs.push(vibLfo);
  if (tLfo)   oscs.push(tLfo);
  const node = { oscs, env, startTime: t, peak };
  node.sustainLevel = sL;
  node.releaseTime  = rT;
  if (autoRelease !== null) {
    const rel = t + autoRelease;
    node.env.gain.setValueAtTime(peak * sL, rel);
    node.env.gain.exponentialRampToValueAtTime(0.0001, rel + rT);
    sources.forEach(src => src.stop(rel + rT + 0.01));
  }
  return node;
}

function stopAudioNote(node) {
  if (!node) return;
  const ctx = getAudioCtx();
  const s   = state.synth;
  const now = ctx.currentTime;
  const releaseT = node.releaseTime ?? s.release;
  const releaseAt = Math.max(now, (node.startTime || 0) + s.attack + 0.02);
  node.env.gain.cancelScheduledValues(releaseAt);
  const gainAtRelease = releaseAt > now ? node.peak : node.env.gain.value;
  if (!isFinite(gainAtRelease) || gainAtRelease <= 0) {
    node.oscs.forEach(o => { try { o.stop(now); } catch(e) {} });
    return;
  }
  node.env.gain.setValueAtTime(gainAtRelease, releaseAt);
  node.env.gain.exponentialRampToValueAtTime(0.0001, releaseAt + releaseT);
  node.oscs.forEach(o => o.stop(releaseAt + releaseT));
}

function startBassNote(midiNote, at = null, autoRelease = null, instrumentOverride = null) {
  const effInstrument = instrumentOverride ?? state.instrument;
  // SF2 path for mapped instruments
  const sf2Preset = INSTRUMENT_TO_SF2[effInstrument];
  if (sf2Preset != null && SF2_FILES.fluid.sf2) {
    return startSf2Voice(midiNote, Math.round(state.velocity * 0.9), at, autoRelease, SF2_FILES.fluid.sf2, sf2Preset);
  }
  if (effInstrument !== 'synth') {
    const instrument = effInstrument;
    const ctx = getAudioCtx();
    const t = at ?? ctx.currentTime;
    const sampleMidi = nearestSampleMidi(instrument, midiNote);
    const buffer = sampleCache[instrument][sampleMidi];
    if (!(buffer instanceof AudioBuffer)) return null;
    const peak = state.audioVolume * 3.5;
    const atk = Math.min(state.synth.attack, 0.01);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(peak, t + atk);
    env.gain.exponentialRampToValueAtTime(peak * 0.55, t + atk + 0.12);
    env.gain.setValueAtTime(peak * 0.55, t + atk + 0.12);
    env.connect(ctx._out);
    if (ctx._reverb) {
      const rs = ctx.createGain(); rs.gain.value = 0.3;
      env.connect(rs); rs.connect(ctx._reverb);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = Math.pow(2, (midiNote - sampleMidi) / 12);
    src.connect(env);
    src.start(t);
    return { oscs: [src], env, peak, startTime: t };
  }

  const ctx  = getAudioCtx();
  const t    = at ?? ctx.currentTime;
  const freq = midiToFreq(midiNote);
  const peak = state.audioVolume * 0.7;
  const atk  = Math.min(state.synth.attack, 0.025);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(peak, t + atk);
  env.gain.exponentialRampToValueAtTime(peak * 0.55, t + atk + 0.12);
  env.gain.setValueAtTime(peak * 0.55, t + atk + 0.12);
  env.connect(ctx._out);

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(env);

  const osc2 = ctx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.value = freq * 2;
  const g2 = ctx.createGain(); g2.gain.value = 0.12;
  osc2.connect(g2); g2.connect(env);

  if (state.pitchBendCents) { osc.detune.value = state.pitchBendCents; osc2.detune.value = state.pitchBendCents; }
  osc.start(t); osc2.start(t);
  return { oscs: [osc, osc2], env, peak, startTime: t };
}

// ============================================================
// MIDI I/O
// ============================================================
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

// ============================================================
// NEXT-CHORD SUGGESTIONS
// ============================================================
function getNextChords(currentPadId) {
  if (!currentPadId) return [];

  if (state.currentTemplate === 'major-harmony') {
    const m = currentPadId.match(/^major-pad-(\w+)-(\d+)$/);
    if (!m) return [];
    const [, section, idxStr] = m;
    const idx = parseInt(idxStr, 10);

    if (section === 'main') {
      const mainCount = 7;
      const result = [];
      for (let i = 0; i < mainCount; i++) {
        if (i !== idx) result.push(`major-pad-main-${i}`);
      }
      for (let i = 0; i < 6; i++) result.push(`major-pad-secdom-${i}`);
      // DOWN: I (0), IV (2), V (4) → any modal chord
      if (idx === 0 || idx === 2 || idx === 4) {
        for (let i = 0; i < 5; i++) result.push(`major-pad-modal-${i}`);
      }
      return result;
    }
    if (section === 'secdom') return [`major-pad-main-${idx}`];
    if (section === 'modal') {
      // UP: any modal → I (0), IV (2), V (4)
      const result = ['major-pad-main-0', 'major-pad-main-2', 'major-pad-main-4'];
      for (let i = 0; i < 5; i++) {
        if (i !== idx) result.push(`major-pad-modal-${i}`);
      }
      return result;
    }
  }

  if (state.currentTemplate === 'minor-harmony') {
    if (currentPadId === 'minor-pad-neapolitan-0') {
      const result = ['minor-pad-main-4'];
      for (let i = 0; i < 4; i++) result.push(`minor-pad-sd_v-${i}`);
      return result;
    }
    const m = currentPadId.match(/^minor-pad-(\w+)-(\d+)$/);
    if (!m) return [];
    const [, section, idxStr] = m;
    const idx = parseInt(idxStr, 10);

    if (section === 'main') {
      const result = [];
      for (let i = 0; i < 7; i++) {
        if (i !== idx) result.push(`minor-pad-main-${i}`);
      }
      for (let i = 0; i < 4; i++) {
        result.push(`minor-pad-sd_v-${i}`);
        result.push(`minor-pad-sd_iv-${i}`);
      }
      result.push('minor-pad-neapolitan-0');
      return result;
    }
    if (section === 'sd_iv') {
      const result = ['minor-pad-main-2', 'minor-pad-main-3'];
      for (let i = 0; i < 4; i++) {
        if (i !== idx) result.push(`minor-pad-sd_iv-${i}`);
      }
      return result;
    }
    if (section === 'sd_v') {
      const result = ['minor-pad-main-4', 'minor-pad-neapolitan-0'];
      for (let i = 0; i < 4; i++) {
        if (i !== idx) result.push(`minor-pad-sd_v-${i}`);
      }
      return result;
    }
  }

  return [];
}

function updateSuggestions() {
  document.querySelectorAll('.pad.suggested').forEach(p => p.classList.remove('suggested'));
  if (state.activeChords.size === 0) { scheduleDraw(); return; }
  // Show suggestions for the most recently added active chord
  const keys = Array.from(state.activeChords.keys());
  const lastPadId = keys[keys.length - 1];
  getNextChords(lastPadId).forEach(padId => {
    document.getElementById(padId)?.classList.add('suggested');
  });
  scheduleDraw();
}

// ============================================================
// CHORD PLAY / RELEASE
// ============================================================
function bassNoteForChord(interval) {
  const keyRoot = state.keys[state.currentTemplate];
  return (state.bassOctave + 1) * 12 + (keyRoot + interval) % 12;
}

function playChord(padId, interval, quality, bassInterval) {
  if (state.activeChords.has(padId)) {
    if (state.sustain) {
      const chord = state.activeChords.get(padId);
      const portR = midiPortById(state.padMidiPortId);
      if (state.padOutput === 'midi') chord.notes.forEach(n => sendNoteOff(n, state.padChannel, portR));
      chord.audioNodes.forEach(stopAudioNote);
      if (chord.bassNote !== null) {
        if (state.padOutput === 'midi') sendNoteOff(chord.bassNote, state.padChannel, portR);
        stopAudioNote(chord.bassAudioNode);
      }
      state.activeChords.delete(padId);
      document.getElementById(padId)?.classList.remove('active');
      updateNowPlaying();
      updateSuggestions();
    }
    return;
  }
  if (state.sustain) {
    state.activeChords.forEach((chord, pid) => {
      chord.notes.forEach(n => sendNoteOff(n));
      chord.audioNodes.forEach(stopAudioNote);
      if (chord.bassNote !== null) { sendNoteOff(chord.bassNote); stopAudioNote(chord.bassAudioNode); }
      document.getElementById(pid)?.classList.remove('active');
    });
    state.activeChords.clear();
  }

  const keyRoot = state.keys[state.currentTemplate];
  const notes = chordToMidiNotes(keyRoot, state.octave, interval, quality);
  const label = chordDisplayName(keyRoot, interval, quality);
  const useInst = state.padOutput !== 'midi';
  const useMidi = state.padOutput === 'midi';
  const padPort = useMidi ? midiPortById(state.padMidiPortId) : null;
  if (useMidi) notes.forEach(n => sendNoteOn(n, state.velocity, state.padChannel, padPort));
  let audioNodes = [];
  if (useInst && state.audioEnabled) {
    if (state.playStyle === 'strum-up' || state.playStyle === 'strum-down') {
      audioNodes = playStrum(notes, state.velocity, state.playStyle === 'strum-down' ? 'down' : 'up');
    } else if (state.playStyle !== 'off' && psStart(padId, notes)) {
      // scheduler handles audio
    } else {
      audioNodes = notes.map(n => startAudioNote(n, state.velocity));
    }
  }

  let bassNote = null, bassAudioNode = null;
  if (state.bassEnabled) {
    bassNote = bassNoteForChord(bassInterval !== undefined ? bassInterval : interval);
    if (useMidi) sendNoteOn(bassNote, state.velocity, state.padChannel, padPort);
    if (useInst && state.audioEnabled) bassAudioNode = startBassNote(bassNote);
  }

  state.activeChords.set(padId, { notes, label, audioNodes, bassNote, bassAudioNode });
  document.getElementById(padId)?.classList.add('active');
  updateNowPlaying();
  updateSuggestions();
  if (REC.active) {
    const rawBeat = Math.round(recCurrentBeat() * 2) / 2;
    const startBeat = SEQ.loop ? rawBeat % SEQ.loopEnd : rawBeat;
    REC.pendingChords.set(padId, { interval, q: quality, bassInterval, label,
      keyRoot: state.keys[state.currentTemplate], template: state.currentTemplate, startBeat });
  }
}

function releaseChord(padId) {
  if (state.sustain) return;
  psStop(padId);
  const chord = state.activeChords.get(padId);
  if (!chord) return;
  const portR = midiPortById(state.padMidiPortId);
  if (state.padOutput === 'midi') chord.notes.forEach(n => sendNoteOff(n, state.padChannel, portR));
  chord.audioNodes.forEach(stopAudioNote);
  if (chord.bassNote !== null) {
    if (state.padOutput === 'midi') sendNoteOff(chord.bassNote, state.padChannel, portR);
    stopAudioNote(chord.bassAudioNode);
  }
  state.activeChords.delete(padId);
  document.getElementById(padId)?.classList.remove('active');
  updateNowPlaying();
  updateSuggestions();
  if (REC.active && REC.pendingChords.has(padId)) {
    const p = REC.pendingChords.get(padId);
    const beats = Math.max(0.5, Math.round(recCurrentBeat() * 2) / 2 - p.startBeat) || 0.5;
    const trk = ensureTrackOfKind('chord');
    trk.items.push({ interval: p.interval, q: p.q, bassInterval: p.bassInterval,
      label: p.label, beats, start: p.startBeat, keyRoot: p.keyRoot, template: p.template });
    trk.items.sort((a, b) => a.start - b.start);
    seqAutoExtendLoop(p.startBeat + beats);
    seqRenderTrack(trk);
    seqResyncTrack(trk);
    REC.pendingChords.delete(padId);
  }
}

function releaseAll() {
  Array.from(state.activeChords.keys()).forEach(psStop);
  const portR = midiPortById(state.padMidiPortId);
  Array.from(state.activeChords.entries()).forEach(([padId, chord]) => {
    if (state.padOutput === 'midi') chord.notes.forEach(n => sendNoteOff(n, state.padChannel, portR));
    chord.audioNodes.forEach(stopAudioNote);
    if (chord.bassNote !== null) {
      if (state.padOutput === 'midi') sendNoteOff(chord.bassNote, state.padChannel, portR);
      stopAudioNote(chord.bassAudioNode);
    }
    document.getElementById(padId)?.classList.remove('active');
  });
  state.activeChords.clear();
  updateNowPlaying();
  updateSuggestions();
}

function updateNowPlaying() {
  const all = Array.from(state.activeChords.values());
  const display = document.getElementById('now-playing-notes');
  if (!display) return; // "Playing" footer was removed
  display.textContent = all.length === 0 ? '—'
    : all.map(c => c.label + ' [' + c.notes.map(midiNoteName).join(' · ') + ']').join('   +   ');
}

// ============================================================
// PAD RENDERING (Roman + button + quality)
// ============================================================
function extQuality(baseQ, ext) {
  if (!ext) return null;
  if (ext === 'Maj7')  return baseQ === 'min' ? 'mmaj7' : baseQ === 'aug' ? 'augmaj7' : 'maj7';
  if (ext === 'Maj7+') return 'augmaj7';
  if (ext === 'mMaj7') return 'mmaj7';
  if (ext === '°7')    return 'dim7';
  if (ext === 'ø')     return 'm7b5';
  if (ext === '7')     return baseQ === 'min' ? 'min7' : baseQ === 'dim' ? 'dim7' : 'dom7';
  return null;
}

function createPad(id, chordSpec, keyLabel, isStartHere) {
  const keyRoot = state.keys[state.currentTemplate];
  const root = chordRootName(keyRoot, chordSpec.interval);
  const glyph = chordSpec.qDisplay ?? QUALITY_GLYPH[chordSpec.q];
  const bassRoot = chordSpec.bassInterval !== undefined
    ? chordRootName(keyRoot, chordSpec.bassInterval) : null;

  const pad = document.createElement('div');
  pad.id = id;
  pad.className = 'pad';
  pad.dataset.interval    = chordSpec.interval;
  pad.dataset.q           = chordSpec.q;
  pad.dataset.bassInterval = chordSpec.bassInterval ?? '';
  pad.draggable = seqIsOpen();
  pad.addEventListener('dragstart', (e) => {
    if (!seqIsOpen()) { e.preventDefault(); return; }
    const label = `${formatChordRoot(root)}${qualityToHTML(glyph)}`;
    e.dataTransfer.effectAllowed = 'copy';
    const _chordPayload = JSON.stringify({
      interval: chordSpec.interval,
      q: chordSpec.q,
      bassInterval: chordSpec.bassInterval,
      label,
    });
    e.dataTransfer.setData('application/x-chord', _chordPayload);
    SEQ._prDragPayload = _chordPayload;
    SEQ._dragLabel = label;
    SEQ._dragChord = { interval: chordSpec.interval, q: chordSpec.q };
    const { el, h } = seqChordDragImage(label, state.beatsPerBar);
    e.dataTransfer.setDragImage(el, 0, h / 2);
    document.body.classList.add('seq-dragging-chord');
    setTimeout(() => { pad.classList.add('dragging'); document.querySelector('#seq-lane .seq-drop-hint')?.style.setProperty('color', 'var(--accent)'); }, 0);
  });
  pad.addEventListener('dragend', () => {
    document.body.classList.remove('seq-dragging-chord');
    pad.classList.remove('dragging');
    document.querySelector('#seq-lane .seq-drop-hint')?.style.removeProperty('color');
  });
  pad.innerHTML = `
    ${isStartHere ? '<span class="start-here-marker">start here</span>' : ''}
    <span class="pad-roman">${qualityToHTML(chordSpec.roman)}</span>
    <div class="pad-button">
      ${keyLabel ? `<span class="pad-key">${keyLabel}</span>` : ''}
      <span class="pad-chord">
        <span class="pad-name">${formatChordRoot(root)}${bassRoot ? `<span class="pad-bass-slash">/${formatChordRoot(bassRoot)}</span>` : ''}</span><span class="pad-quality">${qualityToHTML(glyph)}</span>
      </span>
      ${chordSpec.ext ? `<span class="pad-ext">${qualityToHTML(chordSpec.ext)}</span>` : ''}
    </div>
  `;

  const extQ = extQuality(chordSpec.q, chordSpec.ext);

  const showMainTooltip = () => {
    const keyRoot   = state.keys[state.currentTemplate];
    const rootPitch = (keyRoot + chordSpec.interval) % 12;
    showPianoTooltip(pad, rootPitch, chordSpec.q, chordSpec.pianoScale);
  };
  const onUp   = ()  => releaseChord(id);
  pad.addEventListener('mousedown', () => { showMainTooltip(); playChord(id, chordSpec.interval, chordSpec.q, chordSpec.bassInterval); });
  pad.addEventListener('mouseup',   onUp);
  pad.addEventListener('mouseleave', () => { onUp(); hidePianoTooltip(); });
  pad.addEventListener('touchstart', (e) => {
    e.preventDefault();
    showMainTooltip();
    playChord(id, chordSpec.interval, chordSpec.q, chordSpec.bassInterval);
    if (seqIsOpen()) seqStartTouchDrag(e.changedTouches[0], 'seq-lane', () => ({
      interval: chordSpec.interval, q: chordSpec.q, bassInterval: chordSpec.bassInterval,
      label: `${formatChordRoot(root)}${qualityToHTML(glyph)}`,
    }), () => releaseChord(id));
  }, { passive: false });
  pad.addEventListener('touchend', () => { onUp(); hidePianoTooltip(); });
  pad.addEventListener('mouseenter', (e) => {
    showMainTooltip();
    if (e.buttons > 0 && !seqIsOpen()) playChord(id, chordSpec.interval, chordSpec.q, chordSpec.bassInterval);
  });

  const badge = pad.querySelector('.pad-ext');
  if (badge && extQ) {
    badge.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      playChord(id, chordSpec.interval, extQ);
    });
    badge.draggable = seqIsOpen();
    badge.addEventListener('dragstart', (e) => {
      e.stopPropagation();
      if (!seqIsOpen()) { e.preventDefault(); return; }
      const extLabel = `${formatChordRoot(root)}${qualityToHTML(chordSpec.ext)}`;
      e.dataTransfer.effectAllowed = 'copy';
      const _extPayload = JSON.stringify({
        interval: chordSpec.interval,
        q: extQ,
        bassInterval: chordSpec.bassInterval,
        label: extLabel,
      });
      e.dataTransfer.setData('application/x-chord', _extPayload);
      SEQ._prDragPayload = _extPayload;
      SEQ._dragLabel = extLabel;
      SEQ._dragChord = { interval: chordSpec.interval, q: extQ };
      const { el, h } = seqChordDragImage(extLabel, state.beatsPerBar);
      e.dataTransfer.setDragImage(el, 0, h / 2);
      document.body.classList.add('seq-dragging-chord');
      setTimeout(() => { badge.classList.add('dragging'); document.querySelector('#seq-lane .seq-drop-hint')?.style.setProperty('color', 'var(--accent)'); }, 0);
    });
    badge.addEventListener('dragend', () => {
      document.body.classList.remove('seq-dragging-chord');
      badge.classList.remove('dragging');
      document.querySelector('#seq-lane .seq-drop-hint')?.style.removeProperty('color');
      if (SEQ._dragHoverId) { releaseChord(SEQ._dragHoverId); SEQ._dragHoverId = null; }
    });
    badge.addEventListener('touchstart', (e) => {
      e.preventDefault(); e.stopPropagation();
      playChord(id, chordSpec.interval, extQ);
      if (seqIsOpen()) seqStartTouchDrag(e.changedTouches[0], 'seq-lane', () => ({
        interval: chordSpec.interval, q: extQ, bassInterval: chordSpec.bassInterval,
        label: `${formatChordRoot(root)}${qualityToHTML(chordSpec.ext)}`,
      }), () => releaseChord(id));
    }, { passive: false });
    badge.addEventListener('touchend', (e) => { e.stopPropagation(); releaseChord(id); });
    badge.addEventListener('mouseup', (e) => {
      e.stopPropagation();
      releaseChord(id);
    });
    badge.addEventListener('mouseenter', (e) => {
      e.stopPropagation();
      const keyRoot   = state.keys[state.currentTemplate];
      const rootPitch = (keyRoot + chordSpec.interval) % 12;
      let badgeScale = chordSpec.pianoScale;
      if (badgeScale === undefined && chordSpec.q === 'dim') {
        badgeScale = Array.from(currentScaleAbsolute()).map(p => (p - rootPitch + 12) % 12);
      }
      showPianoTooltip(pad, rootPitch, extQ, badgeScale);
    });
    badge.addEventListener('mouseleave', () => {
      releaseChord(id);
      const keyRoot   = state.keys[state.currentTemplate];
      const rootPitch = (keyRoot + chordSpec.interval) % 12;
      showPianoTooltip(pad, rootPitch, chordSpec.q, chordSpec.pianoScale);
    });
    badge.addEventListener('touchstart', (e) => {
      e.stopPropagation(); e.preventDefault();
      const keyRoot   = state.keys[state.currentTemplate];
      const rootPitch = (keyRoot + chordSpec.interval) % 12;
      let badgeScale = chordSpec.pianoScale;
      if (badgeScale === undefined && chordSpec.q === 'dim') {
        badgeScale = Array.from(currentScaleAbsolute()).map(p => (p - rootPitch + 12) % 12);
      }
      showPianoTooltip(pad, rootPitch, extQ, badgeScale);
      playChord(id, chordSpec.interval, extQ);
    }, { passive: false });
    badge.addEventListener('touchend', (e) => {
      e.stopPropagation();
      releaseChord(id);
      hidePianoTooltip();
    });
  }

  return pad;
}

// ============================================================
// SCALE CHORDS
// ============================================================
const SCALE_DEFS = {
  'major':          [0, 2, 4, 5, 7, 9, 11],
  'minor':          [0, 2, 3, 5, 7, 8, 10],
  'harmonic-major': [0, 2, 4, 5, 7, 8, 11],
  'harmonic-minor': [0, 2, 3, 5, 7, 8, 11],
};

function computeScaleDegrees(scaleIntervals) {
  function getInterval(i, step) {
    const j = i + step;
    return scaleIntervals[j % 7] + Math.floor(j / 7) * 12 - scaleIntervals[i];
  }
  const TRIAD_MAP = { '4,7':'maj','3,7':'min','3,6':'dim','4,8':'aug' };
  const SEVENTH_MAP = {
    '4,7,11':'maj7','4,7,10':'dom7','3,7,10':'min7','3,7,11':'mmaj7',
    '3,6,10':'m7b5','3,6,9':'dim7','4,8,11':'augmaj7','4,8,10':'aug7',
  };
  const NINTH_MAP  = { 'dom7':'dom9','maj7':'maj9','min7':'min9','mmaj7':null,'m7b5':null,'dim7':null,'augmaj7':null,'aug7':null };
  const ELEVENTH_MAP = { 'dom9':'dom11','maj9':'maj11','min9':'min11' };
  return Array.from({ length: 7 }, (_, i) => {
    const second   = getInterval(i, 1);
    const third    = getInterval(i, 2);
    const fourth   = getInterval(i, 3);
    const fifth    = getInterval(i, 4);
    const sixth    = getInterval(i, 5);
    const seventh  = getInterval(i, 6);
    const ninth    = getInterval(i, 8);
    const eleventh = getInterval(i, 10);
    const triadQ   = TRIAD_MAP[`${third},${fifth}`] ?? null;
    const seventhQ = SEVENTH_MAP[`${third},${fifth},${seventh}`] ?? null;
    const ninthQ   = (seventhQ && ninth === 14) ? (NINTH_MAP[seventhQ] ?? null) : null;
    const eleventhQ = (ninthQ && eleventh === 17) ? (ELEVENTH_MAP[ninthQ] ?? null) : null;
    return {
      interval:   scaleIntervals[i],
      triadQ,
      seventhQ,
      sixthQ:     (triadQ === 'maj' && sixth === 9) ? 'maj6' : (triadQ === 'min' && sixth === 9) ? 'min6' : null,
      ninthQ,
      eleventhQ,
      add2Q:      (triadQ && second === 2 && fifth === 7) ? (triadQ === 'maj' ? 'majadd2' : triadQ === 'min' ? 'minadd2' : null) : null,
      add4Q:      (triadQ && fourth === 5 && fifth === 7) ? (triadQ === 'maj' ? 'majadd4' : triadQ === 'min' ? 'minadd4' : null) : null,
      hasPower:   fifth === 7,
      hasSus2:    second === 2 && fifth === 7,
      hasSus4:    fourth === 5 && fifth === 7,
      hasSus24:   second === 2 && fourth === 5 && fifth === 7,
      has7sus2:   second === 2 && fifth === 7 && seventh === 10,
      has7sus4:   fourth === 5 && fifth === 7 && seventh === 10,
    };
  });
}


const SCALE_ROW_KEYS = {
  'sus2':    ['1','2','3','4','5','6','7'],
  'triad':   ['a','s','d','f','g','h','j'],
  'sus4':    ['z','x','c','v','b','n','m'],
  'seventh': ['q','w','e','r','t','y','u'],
};

let scaleKeymap = {}; // key → { padId, interval, q }

function buildScaleChordsBoard() {
  const key     = state.keys['scale-chords'];
  const mode    = (state.scaleType === 'minor' || state.scaleType === 'harmonic-minor') ? 'minor' : 'major';
  TEMPLATES['scale-chords'].keyMode = mode;
  const scale   = SCALE_DEFS[state.scaleType];
  const degrees = computeScaleDegrees(scale);
  const board   = document.querySelector('[data-board="scale-chords"]');
  board.innerHTML = '';
  scaleKeymap = {};

  const ROW_DEFS = {
    power:    { label: '5',          getQ: d => d.hasPower  ? 'power'  : null },
    sus2:     { label: 'Sus2',       getQ: d => d.hasSus2   ? 'sus2'   : null },
    triad:    { label: 'Triads', getQ: d => d.triadQ },
    sus4:     { label: 'Sus4',       getQ: d => d.hasSus4   ? 'sus4'   : null },
    sus24:    { label: 'Sus24',      getQ: d => d.hasSus24  ? 'sus24'  : null },
    sixth:    { label: '6',          getQ: d => d.sixthQ },
    '7sus2':  { label: '7sus2',      getQ: d => d.has7sus2  ? '7sus2'  : null },
    seventh:  { label: '7ths',       getQ: d => d.seventhQ },
    '7sus4':  { label: '7sus4',      getQ: d => d.has7sus4  ? '7sus4'  : null },
    ninth:    { label: '9',          getQ: d => d.ninthQ },
    eleventh: { label: '11',         getQ: d => d.eleventhQ },
    add2:     { label: 'Add2/Add9',  getQ: d => d.add2Q },
    add4:     { label: 'Add4/Add11', getQ: d => d.add4Q },
  };

  const PARALLEL = { 'major':'minor','minor':'major','harmonic-major':'harmonic-minor','harmonic-minor':'harmonic-major' };
  const SCALE_LABEL = { 'major':'Major','minor':'Minor','harmonic-major':'Harmonic Major','harmonic-minor':'Harmonic Minor' };

  function buildSection(scaleType, sectionLabel) {
    const sScale   = SCALE_DEFS[scaleType];
    const sDegrees = computeScaleDegrees(sScale);
    const sMode    = (scaleType === 'minor' || scaleType === 'harmonic-minor') ? 'minor' : 'major';
    const sRows = state.rowOrder
      .filter(id => state.visibleRows.has(id))
      .map(id => ({ id, ...ROW_DEFS[id], flowText: ROW_DEFS[id].flowText ?? null }));

    const sectionEl = document.createElement('div');
    sectionEl.className = 'scale-section';
    if (sectionLabel) {
      const hdr = document.createElement('div');
      hdr.className = 'scale-section-label';
      hdr.textContent = sectionLabel;
      sectionEl.appendChild(hdr);
    }

    sRows.forEach(rowDef => {
      const rowGroup = document.createElement('div');
      rowGroup.className = 'scale-row-group';
      const labelEl = document.createElement('div');
      labelEl.className = 'scale-row-label';
      labelEl.innerHTML = rowDef.flowText
        ? `<span>${rowDef.label}</span><span style="opacity:.45;margin-left:8px">${rowDef.flowText}</span>`
        : rowDef.label;
      rowGroup.appendChild(labelEl);

      const row = document.createElement('div');
      row.className = `scale-row scale-row-${rowDef.id}`;

      sDegrees.forEach((deg, colIdx) => {
        const q = rowDef.getQ(deg);
        const cell = document.createElement('div');
        cell.className = 'scale-cell' + (q ? '' : ' scale-cell-empty');
        if (q) {
          const padId   = `scale-pad-${sMode}-${rowDef.id}-${colIdx}`;
          const keyLabel = SCALE_ROW_KEYS[rowDef.id]?.[colIdx]?.toUpperCase() ?? null;
          if (keyLabel) scaleKeymap[SCALE_ROW_KEYS[rowDef.id][colIdx]] = { padId, interval: deg.interval, q };
          cell.appendChild(createPad(padId, { interval: deg.interval, q, roman: '' }, keyLabel, false));
        }
        row.appendChild(cell);
      });
      rowGroup.appendChild(row);
      sectionEl.appendChild(rowGroup);
    });
    return sectionEl;
  }

  const boardEl = document.createElement('div');
  boardEl.className = 'scale-board';

  if (state.combineParallel) {
    boardEl.appendChild(buildSection(state.scaleType,              SCALE_LABEL[state.scaleType]));
    boardEl.appendChild(buildSection(PARALLEL[state.scaleType],    SCALE_LABEL[PARALLEL[state.scaleType]]));
  } else {
    boardEl.appendChild(buildSection(state.scaleType, null));
  }

  board.appendChild(boardEl);
}

let synTooltipEl = null;
function getSynTooltipEl() {
  if (!synTooltipEl) {
    synTooltipEl = document.createElement('div');
    synTooltipEl.id = 'chord-syn-tooltip';
    document.body.appendChild(synTooltipEl);
  }
  return synTooltipEl;
}
function showSynonymTooltip(padEl, rootName, syns, equivs = []) {
  const el = getSynTooltipEl();
  const synsHtml = syns.length
    ? `<div class="syn-row">${syns.map(s => `<span class="syn">${rootName}${s}</span>`).join('')}</div>`
    : '';
  const equivsHtml = equivs.length
    ? `<div class="syn-equiv">${equivs.map(line => `<div class="syn-equiv-line">${line}</div>`).join('')}</div>`
    : '';
  el.innerHTML = synsHtml + equivsHtml;
  el.style.display = 'block';
  const r  = padEl.getBoundingClientRect();
  const tw = el.offsetWidth;
  const th = el.offsetHeight;
  let left = r.left + r.width / 2 - tw / 2;
  let top  = r.bottom + 8;
  left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
  if (top + th > window.innerHeight - 8) top = r.top - th - 8;
  el.style.left = left + 'px';
  el.style.top  = top + 'px';
}
function hideSynonymTooltip() {
  if (synTooltipEl) synTooltipEl.style.display = 'none';
}

function buildChordLibraryBoard() {
  const board = document.querySelector('[data-board="chord-library"]');
  board.innerHTML = '';

  const SECTIONS = [
    { label: 'Triads',           qs: ['maj', 'min', 'dim', 'aug'] },
    { label: 'Sus',              qs: ['sus2', 'sus4', 'sus24'] },
    { label: 'Sixths',           qs: ['maj6', 'min6', 'maj6add9'] },
    { label: 'Add',              qs: ['majadd2', 'minadd2', 'majadd4', 'minadd4'] },
    { label: 'Sevenths',         qs: ['maj7', 'dom7', 'min7', 'mmaj7', 'm7b5', 'dim7', 'augmaj7', 'aug7'] },
    { label: 'Seventh Sus',      qs: ['7sus2', '7sus4'] },
    { label: 'Ninths',           qs: ['maj9', 'dom9', 'min9'] },
    { label: 'Elevenths',        qs: ['maj11', 'dom11', 'min11'] },
    { label: 'Thirteenths',      qs: ['maj13', 'dom13', 'min13'] },
    { label: 'Altered Dominants',qs: ['7b5', 'aug7', '7b9', '7s9', '7s11', '7b13', '7alt'] },
  ];

  // Synonym suffixes (root prepended at render time)
  const SYNONYMS = {
    'maj':     ['', 'maj', 'M', 'Δ'],
    'min':     ['m', 'min', 'mi', '−'],
    'dim':     ['dim', '°', 'm♭5'],
    'aug':     ['aug', '+', '(♯5)', '(+5)'],
    'sus2':    ['sus2', '2'],
    'sus4':    ['sus4', 'sus', '4'],
    'power':   ['5', 'no3'],
    'sus24':   ['sus24', 'sus4add9', 'sus4(add9)'],
    'maj6':    ['6', 'maj6', 'M6', 'add6'],
    'min6':    ['m6', 'min6', '−6'],
    'maj7':    ['maj7', 'M7', 'Δ7', 'Δ', 'ma7', 'j7'],
    'dom7':    ['7', 'dom7'],
    'min7':    ['m7', 'min7', 'mi7', '−7'],
    'mmaj7':   ['mMaj7', 'm(maj7)', 'minMaj7', 'm♯7', '−Δ7'],
    'm7b5':    ['m7♭5', 'ø', 'ø7', '½dim7'],
    'dim7':    ['dim7', '°7'],
    'augmaj7': ['+Maj7', 'maj7♯5', 'Maj7(+5)', 'Δ7♯5'],
    'aug7':    ['+7', '7♯5', '7(+5)', 'aug7'],
    '7sus2':   ['7sus2'],
    '7sus4':   ['7sus4', '7sus'],
    'dom9':    ['9', 'dom9'],
    'maj9':    ['maj9', 'M9', 'Δ9'],
    'min9':    ['m9', 'min9', '−9'],
    'dom11':   ['11'],
    'maj11':   ['maj11', 'M11', 'Δ11'],
    'min11':   ['m11', '−11'],
    'majadd2': ['add9', '(add9)', '(9)'],
    'minadd2': ['m(add9)', 'madd9', '−(add9)'],
    'majadd4': ['add11', '(add11)', '(11)'],
    'minadd4': ['m(add11)', 'madd11', '−(add11)'],
    'maj6add9': ['6/9', '6add9', '6(9)'],
    'dom13':    ['13', 'dom13'],
    'maj13':    ['maj13', 'M13', 'Δ13'],
    'min13':    ['m13', 'min13', '−13'],
    '7b5':      ['7♭5', '7(−5)', '7(♭5)'],
    '7b9':      ['7♭9', '7(−9)', '7(♭9)'],
    '7s9':      ['7♯9', '7(+9)', '7(♯9)'],
    '7s11':     ['7♯11', '9♯11'],
    '7b13':     ['7♭13', '7(♭13)'],
    '7alt':     ['7alt', '7(♭9♯9♭5♯5)'],
  };

  // Enharmonic / functional equivalents.
  // {offset,suffix} → "= <root+offset><suffix>"; {text} → free-form line.
  const EQUIVS = {
    'maj6':  [{ prefix: '=', offset: 9, suffix: 'm7' }],
    'maj7':  [{ prefix: '=', offset: 4, suffix: 'm(add♭6)' }],
    'min6':  [{ prefix: '=', offset: 9, suffix: 'm7♭5' }, { prefix: '⊂', offset: 5, suffix: '9 (no root)' }],
    'dim7':  [{ text: 'symmetric — every minor-3rd up is the same chord' }],
    'aug':   [{ text: 'symmetric — every major-3rd up is the same chord' }],
    'sus2':  [{ prefix: '=', offset: 7, suffix: 'sus4 (inv)' }],
    '7b9':   [{ prefix: '⊂', offset: 1, suffix: '°7 (no root)' }],
    'maj9':  [{ prefix: '⊂', offset: 4, suffix: 'm7 (no root)' }],
    'dom13': [{ prefix: '⊂', offset: 7, suffix: 'm6 (no root)' }, { prefix: '⊂', offset: 10, suffix: 'maj7♯11' }],
  };

  const boardEl = document.createElement('div');
  boardEl.className = 'lib-board';

  SECTIONS.forEach(sec => {
    const group = document.createElement('div');
    group.className = 'lib-row-group';

    const labelEl = document.createElement('div');
    labelEl.className = 'lib-row-label';
    labelEl.textContent = sec.label;
    group.appendChild(labelEl);

    const row = document.createElement('div');
    row.className = 'lib-row';

    sec.qs.forEach(q => {
      const cell = document.createElement('div');
      cell.className = 'lib-cell';
      const padId = `lib-pad-${q}`;
      const pad = createPad(padId, { interval: 0, q, roman: '' }, null, false);
      const syns = SYNONYMS[q];
      const equivs = EQUIVS[q];
      if ((syns && syns.length) || (equivs && equivs.length)) {
        const libRoot = state.keys['chord-library'];
        const rootName = formatChordRoot(chordRootName(libRoot, 0));
        const equivLines = (equivs || []).map(eq => {
          if (eq.text) return eq.text;
          const altRoot = formatChordRoot(chordRootName(libRoot, eq.offset));
          return `${eq.prefix} ${altRoot}${eq.suffix}`;
        });
        pad.addEventListener('mouseenter', () => showSynonymTooltip(pad, rootName, syns || [], equivLines));
        pad.addEventListener('mouseleave', hideSynonymTooltip);
      }
      cell.appendChild(pad);
      row.appendChild(cell);
    });

    group.appendChild(row);
    boardEl.appendChild(group);
  });

  board.appendChild(boardEl);
}

function buildMajorHarmonyBoard() {
  const board = document.querySelector('[data-board="major-harmony"]');
  board.innerHTML = '';
  board.classList.add('v2');
  const sections = V2_SECTIONS['major-harmony'];
  const keymap   = V2_KEYMAPS['major-harmony'];

  const reverseKeymap = {};
  for (const [k, v] of Object.entries(keymap)) {
    reverseKeymap[`${v[0]},${v[1]}`] = k.toUpperCase();
  }

  sections.forEach((section) => {
    const sectionEl = document.createElement('div');
    sectionEl.className = 'major-section';

    const flowEl = document.createElement('div');
    flowEl.className = 'major-flow-label';
    flowEl.innerHTML = `<span>${section.label}</span><span style="opacity:.45; margin-left:8px">${section.flowText}</span>`;
    sectionEl.appendChild(flowEl);

    const row = document.createElement('div');
    row.className = `major-row ${section.id}`;

    section.chords.forEach((chord, cIdx) => {
      const cell = document.createElement('div');
      cell.className = 'pad-cell' + (chord ? '' : ' empty');
      if (chord) {
        const padId = `major-pad-${section.id}-${cIdx}`;
        const keyLabel = reverseKeymap[`${section.id},${cIdx}`] || '';
        cell.appendChild(createPad(padId, chord, keyLabel, false));
      }
      row.appendChild(cell);
    });

    const fillerCount = 7 - section.chords.length;
    for (let i = 0; i < fillerCount; i++) {
      const cell = document.createElement('div');
      cell.className = 'pad-cell empty';
      row.appendChild(cell);
    }

    sectionEl.appendChild(row);
    board.appendChild(sectionEl);
  });
}

function updateNeapolitanSplit() {
  document.querySelectorAll('.minor-row.has-neapolitan').forEach(row => {
    const rowRect = row.getBoundingClientRect();
    const regularCells = [...row.querySelectorAll('.pad-cell:not(.empty):not(.neapolitan)')];
    const firstCell = regularCells[0];
    const lastCell  = regularCells[regularCells.length - 1];
    if (!firstCell || !lastCell) return;
    const leftPad     = firstCell.getBoundingClientRect().left - rowRect.left;
    const splitFromLeft = lastCell.getBoundingClientRect().right - rowRect.left + leftPad;
    row.style.setProperty('--nea-split', (rowRect.width - splitFromLeft) + 'px');
  });
}

function buildMinorHarmonyBoard() {
  const board = document.querySelector('[data-board="minor-harmony"]');
  board.innerHTML = '';
  const sections = V2_SECTIONS['minor-harmony'];
  const keymap   = V2_KEYMAPS['minor-harmony'];

  const reverseKeymap = {};
  for (const [k, v] of Object.entries(keymap)) {
    reverseKeymap[`${v[0]},${v[1]}`] = k.toUpperCase();
  }

  const TOTAL_COLS = 7;

  sections.forEach((section) => {
    const sectionEl = document.createElement('div');
    sectionEl.className = 'minor-section';

    const hasNea = !!section.neapolitan;

    const flowEl = document.createElement('div');
    flowEl.className = 'minor-flow-label';
    flowEl.innerHTML = `<span>${section.label}</span><span style="opacity:.45; margin-left:8px">${section.flowText}</span>${hasNea ? `<span style="margin-left:auto; opacity:.7; letter-spacing:0.22em">NEAPOLITAN</span>` : ''}`;
    sectionEl.appendChild(flowEl);

    const row = document.createElement('div');
    row.className = `minor-row ${section.id}`;

    // Chord cells
    section.chords.forEach((chord, cIdx) => {
      const cell = document.createElement('div');
      cell.className = 'pad-cell' + (chord ? '' : ' empty');
      if (chord) {
        const padId = `minor-pad-${section.id}-${cIdx}`;
        const keyLabel = reverseKeymap[`${section.id},${cIdx}`] || '';
        cell.appendChild(createPad(padId, chord, keyLabel, false));
      }
      row.appendChild(cell);
    });

    // Empty filler cells so each row has TOTAL_COLS columns
    const fillerCount = TOTAL_COLS - section.chords.length - (hasNea ? 1 : 0);
    for (let i = 0; i < fillerCount; i++) {
      const cell = document.createElement('div');
      cell.className = 'pad-cell empty';
      row.appendChild(cell);
    }

    if (hasNea) {
      row.classList.add('has-neapolitan');
      const cell = document.createElement('div');
      cell.className = 'pad-cell neapolitan';
      const padId = 'minor-pad-neapolitan-0';
      const keyLabel = reverseKeymap['neapolitan,0'] || '';
      cell.appendChild(createPad(padId, section.neapolitan, keyLabel, false));
      row.appendChild(cell);
    }

    sectionEl.appendChild(row);
    board.appendChild(sectionEl);
  });
}

// ============================================================
// CONNECTION ARROWS (SVG overlay)
// ============================================================
const CONNECTIONS = {
  'major-harmony': [
    // Main → Sec.Dom (group: one-way up)
    { fromRow: '.major-row.main', toRow: '.major-row.secdom', type: 'oneway' },
    // Sec.Dom → Main (1-to-1: each secondary dominant resolves to its target)
    { from: 'major-pad-secdom-0', to: 'major-pad-main-0', type: 'oneway' },
    { from: 'major-pad-secdom-1', to: 'major-pad-main-1', type: 'oneway' },
    { from: 'major-pad-secdom-2', to: 'major-pad-main-2', type: 'oneway' },
    { from: 'major-pad-secdom-3', to: 'major-pad-main-3', type: 'oneway' },
    { from: 'major-pad-secdom-4', to: 'major-pad-main-4', type: 'oneway' },
    { from: 'major-pad-secdom-5', to: 'major-pad-main-5', type: 'oneway' },
    // I, IV, V ↕ modal (twoway)
    { fromPad: 'major-pad-main-0', toRow: '.major-row.modal', type: 'twoway' },
    { fromPad: 'major-pad-main-2', toRow: '.major-row.modal', type: 'twoway' },
    { fromPad: 'major-pad-main-4', toRow: '.major-row.modal', type: 'twoway' },
  ],
  'minor-harmony': [
    // main → sd_v (group up, starts at 1/3 of main row height)
    { fromRow: '.minor-row.main', toRow: '.minor-row.sd_v', type: 'oneway', fromYFraction: 1/3 },
    // sd_v → only V(7) = main-4
    { fromRow: '.minor-row.sd_v', toPad: 'minor-pad-main-4', type: 'oneway' },
    // main → sd_iv (group down, starts at 2/3 of main row height)
    { fromRow: '.minor-row.main', toRow: '.minor-row.sd_iv', type: 'oneway', fromYFraction: 2/3 },
    // sd_iv → only iv (main-2) and bVI (main-3)
    { fromRow: '.minor-row.sd_iv', toPad: 'minor-pad-main-2', type: 'oneway' },
    { fromRow: '.minor-row.sd_iv', toPad: 'minor-pad-main-3', type: 'oneway' },
  ],
};

function getButtonRect(padEl) {
  const btn = padEl.querySelector('.pad-button');
  return (btn || padEl).getBoundingClientRect();
}

function drawRowConnection(svg, fromEl, toEl, boardRect, type, fromYFraction = 0.5, isActive = false) {
  const fr = fromEl.getBoundingClientRect();
  const tr = toEl.getBoundingClientRect();
  const fy = fr.top  + fr.height * fromYFraction - boardRect.top;
  const ty = tr.top  + tr.height / 2 - boardRect.top;
  const leftEdge = Math.min(fr.left, tr.left) - boardRect.left;
  const xEnd = leftEdge - 2;
  const xArm = Math.max(window.innerWidth > 1024 ? -20 : -8, leftEdge - 24);
  const r    = 6;
  const dir  = ty > fy ? 1 : -1;

  const d = [
    `M ${xEnd} ${fy}`,
    `H ${xArm + r}`,
    `Q ${xArm} ${fy} ${xArm} ${fy + dir * r}`,
    `V ${ty - dir * r}`,
    `Q ${xArm} ${ty} ${xArm + r} ${ty}`,
    `H ${xEnd}`,
  ].join(' ');

  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('class', 'connection-line' + (isActive ? ' conn-active' : ''));
  path.setAttribute('fill', 'none');
  svg.appendChild(path);

  {
    const s = 6, h = 4;
    const x = xArm;
    const midY = (fy + ty) / 2;
    let d;
    if (type === 'twoway') {
      const y1 = fy + (ty - fy) / 3;
      const y2 = fy + (ty - fy) * 2 / 3;
      d = `M ${x-h} ${y1+s} L ${x} ${y1} L ${x+h} ${y1+s} ` +
          `M ${x-h} ${y2-s} L ${x} ${y2} L ${x+h} ${y2-s}`;
    } else {
      d = `M ${x-h} ${midY - dir*s} L ${x} ${midY} L ${x+h} ${midY - dir*s}`;
    }
    const chevron = document.createElementNS(SVG_NS, 'path');
    chevron.setAttribute('d', d);
    chevron.setAttribute('class', 'connection-arrow' + (isActive ? ' conn-active' : ''));
    svg.appendChild(chevron);
  }
}

function drawPadToRowConnection(svg, padEl, rowEl, boardRect, type, isActive = false) {
  const pr = getButtonRect(padEl);
  const rr = rowEl.getBoundingClientRect();
  const px = pr.left + pr.width / 2 - boardRect.left;
  const py_bottom = pr.bottom - boardRect.top;
  const ry = rr.top  - boardRect.top - 2;

  const sy = py_bottom + 5;
  const ey = ry;

  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', px); line.setAttribute('y1', sy);
  line.setAttribute('x2', px); line.setAttribute('y2', ey);
  line.setAttribute('class', 'connection-line' + (isActive ? ' conn-active' : ''));
  svg.appendChild(line);

  drawArrowhead(svg, px, ey, 0, 1, isActive);
  if (type === 'twoway') drawArrowhead(svg, px, sy, 0, -1, isActive);
}

function drawRowToPadConnection(svg, rowEl, padEl, boardRect, type, isActive = false) {
  const rr = rowEl.getBoundingClientRect();
  const pr = getButtonRect(padEl);
  const px = pr.left + pr.width / 2 - boardRect.left;
  const rowCy = rr.top + rr.height / 2;
  const padCy = pr.top + pr.height / 2;
  let sy, ey, dir;
  if (rowCy < padCy) {
    sy = rr.bottom - boardRect.top + 2;
    ey = pr.top    - boardRect.top - 5;
    dir = 1;
  } else {
    sy = rr.top    - boardRect.top - 2;
    ey = pr.bottom - boardRect.top + 5;
    dir = -1;
  }
  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', px); line.setAttribute('y1', sy);
  line.setAttribute('x2', px); line.setAttribute('y2', ey);
  line.setAttribute('class', 'connection-line' + (isActive ? ' conn-active' : ''));
  svg.appendChild(line);
  drawArrowhead(svg, px, ey, 0, dir, isActive);
}

function drawConnections() {
  const board = document.querySelector(`[data-board="${state.currentTemplate}"]`);
  if (!board) return;
  let svg = board.querySelector('.connections-svg');
  if (!svg) {
    svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'connections-svg');
    board.appendChild(svg);
  }
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  // Clear previous group highlights
  board.querySelectorAll('.conn-active').forEach(el => el.classList.remove('conn-active'));

  const boardRect = board.getBoundingClientRect();
  if (boardRect.width === 0 || boardRect.height === 0) return;
  svg.setAttribute('viewBox', `0 0 ${boardRect.width} ${boardRect.height}`);
  svg.setAttribute('width', boardRect.width);
  svg.setAttribute('height', boardRect.height);

  const conns = CONNECTIONS[state.currentTemplate] || [];
  conns.forEach(conn => {
    if (conn.fromRow && conn.toRow) {
      const fromEl = board.querySelector(conn.fromRow);
      const toEl   = board.querySelector(conn.toRow);
      if (!fromEl || !toEl) return;
      const isActive = !!fromEl.querySelector('.pad.active');
      if (isActive) { fromEl.classList.add('conn-active'); toEl.classList.add('conn-active'); }
      drawRowConnection(svg, fromEl, toEl, boardRect, conn.type, conn.fromYFraction, isActive);
      return;
    }
    if (conn.fromRow && conn.toPad) {
      const rowEl = board.querySelector(conn.fromRow);
      const padEl = document.getElementById(conn.toPad);
      if (!rowEl || !padEl) return;
      const isActive = !!rowEl.querySelector('.pad.active');
      if (isActive) rowEl.classList.add('conn-active');
      drawRowToPadConnection(svg, rowEl, padEl, boardRect, conn.type, isActive);
      return;
    }
    if (conn.fromPad) {
      const padEl = document.getElementById(conn.fromPad);
      const rowEl = board.querySelector(conn.toRow);
      if (!padEl || !rowEl) return;
      const isActive = padEl.classList.contains('active') ||
        (conn.type === 'twoway' && !!rowEl.querySelector('.pad.active'));
      if (isActive) rowEl.classList.add('conn-active');
      drawPadToRowConnection(svg, padEl, rowEl, boardRect, conn.type, isActive);
      return;
    }
    const fromEl = document.getElementById(conn.from);
    const toEl = document.getElementById(conn.to);
    if (!fromEl || !toEl) return;
    const isActive = fromEl.classList.contains('active');
    const fr = getButtonRect(fromEl);
    const tr = getButtonRect(toEl);
    const fx = fr.left + fr.width/2 - boardRect.left;
    const fy = fr.top + fr.height/2 - boardRect.top;
    const tx = tr.left + tr.width/2 - boardRect.left;
    const ty = tr.top + tr.height/2 - boardRect.top;
    drawConnection(svg, fx, fy, tx, ty,
                   fr.width/2, fr.height/2,
                   tr.width/2, tr.height/2,
                   conn.type, isActive);
  });
}

function drawConnection(svg, x1, y1, x2, y2, w1h, h1h, w2h, h2h, type, isActive = false) {
  const dx = x2 - x1, dy = y2 - y1;
  const dist = Math.sqrt(dx*dx + dy*dy);
  if (dist < 1) return;
  const ux = dx / dist, uy = dy / dist;
  const startEdge = (Math.abs(ux) < 0.001) ? h1h
                  : (Math.abs(uy) < 0.001) ? w1h
                  : Math.min(Math.abs(w1h/ux), Math.abs(h1h/uy));
  const endEdge = (Math.abs(ux) < 0.001) ? h2h
                : (Math.abs(uy) < 0.001) ? w2h
                : Math.min(Math.abs(w2h/ux), Math.abs(h2h/uy));
  const margin = 5;
  const sx = x1 + ux * (startEdge + margin);
  const sy = y1 + uy * (startEdge + margin);
  const ex = x2 - ux * (endEdge + margin);
  const ey = y2 - uy * (endEdge + margin);
  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', sx); line.setAttribute('y1', sy);
  line.setAttribute('x2', ex); line.setAttribute('y2', ey);
  line.setAttribute('class', 'connection-line' + (isActive ? ' conn-active' : ''));
  svg.appendChild(line);
  drawArrowhead(svg, ex, ey, ux, uy, isActive);
  if (type === 'twoway') drawArrowhead(svg, sx, sy, -ux, -uy, isActive);
}

function drawArrowhead(svg, x, y, ux, uy, isActive = false) {
  const size = 6, halfBase = 4;
  const px = -uy, py = ux;
  const baseX = x - ux * size, baseY = y - uy * size;
  const lx = baseX + px * halfBase, ly = baseY + py * halfBase;
  const rx = baseX - px * halfBase, ry = baseY - py * halfBase;
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', `M ${lx} ${ly} L ${x} ${y} L ${rx} ${ry}`);
  path.setAttribute('class', 'connection-arrow' + (isActive ? ' conn-active' : ''));
  svg.appendChild(path);
}

let drawScheduled = null;
let keyChangeDir = 0; // +1 = up (higher pitch), -1 = down, 0 = no animation
function scheduleDraw() {
  if (drawScheduled) cancelAnimationFrame(drawScheduled);
  drawScheduled = requestAnimationFrame(() => {
    drawScheduled = null;
    drawConnections();
  });
}

function rebuildBoard() {
  releaseAll();

  if (keyChangeDir !== 0) {
    const dir = keyChangeDir;
    keyChangeDir = 0;
    const tpl = state.currentTemplate;
    const board = document.querySelector(`[data-board="${tpl}"]`);

    // Exit: slide current chord (name + quality) out in the roll direction
    const exitY = dir > 0 ? '-210%' : '210%';
    board.querySelectorAll('.pad-chord').forEach(el => {
      el.style.transition = 'transform 0.1s ease-in, opacity 0.09s ease-in';
      el.style.transform  = `translateY(${exitY})`;
      el.style.opacity    = '0';
    });

    setTimeout(() => {
      if (tpl !== state.currentTemplate) return; // tab changed during animation
      if (tpl === 'major-harmony') buildMajorHarmonyBoard();
      else if (tpl === 'minor-harmony') { buildMinorHarmonyBoard(); updateNeapolitanSplit(); }
      else if (tpl === 'scale-chords') buildScaleChordsBoard();
      else if (tpl === 'chord-library') buildChordLibraryBoard();
      scheduleDraw();
      const enterCls = dir > 0 ? 'key-rolling-up' : 'key-rolling-down';
      document.querySelectorAll(`[data-board="${tpl}"] .pad-chord`).forEach(el => {
        el.classList.add(enterCls);
        el.addEventListener('animationend', () => el.classList.remove(enterCls), { once: true });
      });
    }, 100);
  } else {
    if (state.currentTemplate === 'major-harmony') buildMajorHarmonyBoard();
    else if (state.currentTemplate === 'minor-harmony') { buildMinorHarmonyBoard(); updateNeapolitanSplit(); }
    else if (state.currentTemplate === 'scale-chords') buildScaleChordsBoard();
    else if (state.currentTemplate === 'chord-library') buildChordLibraryBoard();
    scheduleDraw();
  }
}

// ============================================================
// KEY SELECTOR
// ============================================================
function buildKeyTracks() {
  ['major-harmony', 'minor-harmony', 'scale-chords', 'chord-library'].forEach(tplId => {
    const track = document.querySelector(`[data-key-track="${tplId}"]`);
    track.innerHTML = '';
    const isMinor = ['minor', 'harmonic-minor'].includes(TEMPLATES[tplId].keyMode);
    const display = isMinor ? MINOR_KEY_DISPLAY : KEY_DISPLAY;
    display.forEach((noteLabel, i) => {
      const btn = document.createElement('button');
      btn.className = 'key-btn';
      btn.dataset.template = tplId;
      btn.dataset.keyIdx = i;
      btn.innerHTML = isMinor
        ? formatChordRoot(noteLabel) + 'm'
        : formatChordRoot(noteLabel);
      btn.addEventListener('click', () => setKey(tplId, i));
      track.appendChild(btn);
    });
  });
  updateKeySelectors();
}

function updateKeySelectors() {
  ['major-harmony', 'minor-harmony', 'scale-chords', 'chord-library'].forEach(tplId => {
    const currentKey = state.keys[tplId];
    document.querySelectorAll(`[data-key-track="${tplId}"] .key-btn`).forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.keyIdx, 10) === currentKey);
    });
  });
}

function setKey(tplId, keyIdx) {
  const oldKey = state.keys[tplId];
  const diff = (keyIdx - oldKey + 12) % 12;
  keyChangeDir = diff === 0 ? 0 : diff <= 6 ? 1 : -1;
  state.keys[tplId] = keyIdx;
  updateKeySelectors();
  if (state.currentTemplate === tplId) rebuildBoard();
}

// ============================================================
// TABS
// ============================================================
function setActiveTab(tabId) {
  releaseAll();
  state.currentTemplate = tabId;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.dataset.page === tabId));
  rebuildBoard();
}
document.querySelectorAll('.tab').forEach(tab => {
  // Skip tabs without a data-tab (e.g. the gear-icon settings button — it
  // has its own click handler and shouldn't switch templates).
  if (!tab.dataset.tab) return;
  tab.addEventListener('click', () => setActiveTab(tab.dataset.tab));
});

document.querySelectorAll('.scale-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    state.scaleType = btn.dataset.scale;
    document.querySelectorAll('.scale-btn').forEach(b => b.classList.toggle('active', b === btn));
    // Update key track labels to reflect major/minor spelling
    const mode = (state.scaleType === 'minor' || state.scaleType === 'harmonic-minor') ? 'minor' : 'major';
    TEMPLATES['scale-chords'].keyMode = mode;
    buildKeyTracks();
    if (state.currentTemplate === 'scale-chords') buildScaleChordsBoard();
  });
});

// ============================================================
// ROWS CONFIG DROPDOWN
// ============================================================
const rowsConfigBtn      = document.getElementById('rows-config-btn');
const rowsConfigDropdown = document.createElement('div');
rowsConfigDropdown.className = 'rows-config-dropdown';
rowsConfigDropdown.id = 'rows-config-dropdown';
document.body.appendChild(rowsConfigDropdown);

function renderRowsDropdown() {
  rowsConfigDropdown.innerHTML = '';
  let dragSrc = null;

  state.rowOrder.forEach(rowId => {
    const labels = {
      power:'5 (Power)', sus2:'Sus2', triad:'Triad', sus4:'Sus4', sus24:'Sus24',
      sixth:'6', '7sus2':'7sus2', seventh:'7ths', '7sus4':'7sus4',
      ninth:'9', eleventh:'11', add2:'Add2/Add9', add4:'Add4/Add11',
    };
    const item = document.createElement('div');
    item.className = 'row-config-item';
    item.draggable = true;
    item.dataset.row = rowId;
    item.innerHTML = `<span class="drag-handle"><i data-lucide="grip-vertical"></i></span><label><input type="checkbox" ${state.visibleRows.has(rowId) ? 'checked' : ''}> ${labels[rowId]}</label>`;

    item.querySelector('input').addEventListener('change', e => {
      if (e.target.checked) state.visibleRows.add(rowId);
      else                  state.visibleRows.delete(rowId);
      if (state.currentTemplate === 'scale-chords') buildScaleChordsBoard();
    });

    item.addEventListener('dragstart', e => {
      dragSrc = item;
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => item.classList.add('dragging'), 0);
    });
    item.addEventListener('dragend', () => {
      rowsConfigDropdown.querySelectorAll('.row-config-item').forEach(i => i.classList.remove('dragging', 'drag-over'));
    });
    item.addEventListener('dragover', e => {
      e.preventDefault();
      rowsConfigDropdown.querySelectorAll('.row-config-item').forEach(i => i.classList.remove('drag-over'));
      if (item !== dragSrc) item.classList.add('drag-over');
    });
    item.addEventListener('drop', e => {
      e.preventDefault();
      if (!dragSrc || dragSrc === item) return;
      const from = state.rowOrder.indexOf(dragSrc.dataset.row);
      const to   = state.rowOrder.indexOf(rowId);
      state.rowOrder.splice(from, 1);
      state.rowOrder.splice(to, 0, dragSrc.dataset.row);
      renderRowsDropdown();
      if (state.currentTemplate === 'scale-chords') buildScaleChordsBoard();
    });

    rowsConfigDropdown.appendChild(item);
  });

  // Combine major/minor separator + toggle
  const sep = document.createElement('div');
  sep.style.cssText = 'border-top:1px solid rgba(255,255,255,0.1);margin:6px 0';
  rowsConfigDropdown.appendChild(sep);

  const combineItem = document.createElement('div');
  combineItem.className = 'row-config-item';
  combineItem.innerHTML = `<label style="color:rgba(255,255,255,0.55)"><input type="checkbox" id="combine-parallel-cb" ${state.combineParallel ? 'checked' : ''}> Major + Minor</label>`;
  combineItem.querySelector('input').addEventListener('change', e => {
    state.combineParallel = e.target.checked;
    if (state.currentTemplate === 'scale-chords') buildScaleChordsBoard();
  });
  rowsConfigDropdown.appendChild(combineItem);
}

rowsConfigBtn.addEventListener('click', e => {
  e.stopPropagation();
  const isOpen = rowsConfigDropdown.classList.toggle('open');
  if (isOpen) {
    const r = rowsConfigBtn.getBoundingClientRect();
    rowsConfigDropdown.style.top  = (r.bottom + 6) + 'px';
    rowsConfigDropdown.style.right = (window.innerWidth - r.right) + 'px';
  }
});
document.addEventListener('click', () => rowsConfigDropdown.classList.remove('open'));
rowsConfigDropdown.addEventListener('click', e => e.stopPropagation());

renderRowsDropdown();

// ============================================================
// CONTROLS
// ============================================================
function updateControlDisplays() {
  document.getElementById('ctrl-oct').textContent = state.octave;
}

// (Out-port dropdown removed — port selection is now per-track / per-chord-pad
// in their FX modals. state.output is set in refreshOutputs() as the fallback.)
// (In-port dropdown removed — MIDI input is configured per-track.)
document.getElementById('oct-down').addEventListener('click', () => {
  state.octave = Math.max(0, state.octave - 1); updateControlDisplays(); rebuildBoard();
});
document.getElementById('oct-up').addEventListener('click', () => {
  state.octave = Math.min(8, state.octave + 1); updateControlDisplays(); rebuildBoard();
});

// Which voice the Instrument panel is editing: chord-pad ('pad') or one
// of the sequencer tracks. Reads/writes route to the corresponding synth
// config + instrument slot.
state.synthEditTarget = 'pad';
function editTargetSynth() {
  return state.synthEditTarget === 'pad' ? state.synth : SEQ.tracks[state.synthEditTarget].synth;
}
function editTargetInstrument() {
  return state.synthEditTarget === 'pad' ? state.instrument : SEQ.tracks[state.synthEditTarget].instrument;
}
function setEditTargetInstrument(v) {
  if (state.synthEditTarget === 'pad') state.instrument = v;
  else SEQ.tracks[state.synthEditTarget].instrument = v;
}

document.getElementById('synth-waveform').addEventListener('change', (e) => {
  editTargetSynth().waveform = e.target.value;
});
function updateSynthOnlyVisibility() {
  const isSynth = editTargetInstrument() === 'synth';
  document.querySelectorAll('.synth-param.synth-only').forEach(el => {
    el.classList.toggle('visible', isSynth);
  });
}

document.getElementById('synth-instrument').addEventListener('change', async (e) => {
  const prev = editTargetInstrument();
  const next = e.target.value;
  savedPresets[prev] = { ...editTargetSynth() };
  setEditTargetInstrument(next);
  updateSynthOnlyVisibility();
  // Chord-pad voice == chords track. Keep the track header dropdown in sync.
  if (state.synthEditTarget === 'pad') {
    const chordHdr = document.querySelector('.seq-track-label[data-track="chords"] .seq-th-inst');
    if (chordHdr) chordHdr.value = next;
  }
  if (next !== 'synth') {
    // Most GM presets (gm<N>) don't have an entry in INSTRUMENT_PRESETS;
    // fall back to a generic SF2-friendly default so the synth-params
    // sliders aren't fed `undefined`.
    const preset = savedPresets[next] || INSTRUMENT_PRESETS[next] || INSTRUMENT_PRESETS.epiano;
    if (preset) applySynthPreset(preset);
    if (INSTRUMENT_TO_SF2[next] != null) {
      await loadSf2('fluid');
      // Decode samples for this preset upfront so the first note after a
      // MIDI-clock Start isn't delayed by a lazy SF2 decode.
      const fluid = SF2_FILES.fluid.sf2;
      if (fluid) prewarmSf2Preset(fluid, INSTRUMENT_TO_SF2[next]);
    } else {
      await preloadSamples(next);
    }
  } else if (savedPresets.synth) {
    applySynthPreset(savedPresets.synth);
  }
});
updateSynthOnlyVisibility();

function setSynthEditTarget(target) {
  state.synthEditTarget = target;
  document.querySelectorAll('.synth-target-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.target === target);
  });
  // Reflect the target's instrument in the dropdown (no-op for waveform if
  // not synth) and seed all sliders from the target's stored synth values.
  const inst = editTargetInstrument();
  const dd   = document.getElementById('synth-instrument');
  if (dd) dd.value = inst;
  const wf = document.getElementById('synth-waveform');
  if (wf && editTargetSynth().waveform) wf.value = editTargetSynth().waveform;
  applySynthPreset(editTargetSynth());
  updateSynthOnlyVisibility();
}
document.querySelectorAll('.synth-target-btn').forEach(btn => {
  btn.addEventListener('click', () => setSynthEditTarget(btn.dataset.target));
});
// Chord-pad settings modal — opens via the gear-icon tab next to the
// harmony/library tabs. Same modal pattern as track-fx-modal.
(function _initChordPadModal() {
  const modal = document.getElementById('chord-pad-modal');
  const btn   = document.getElementById('chord-pad-settings-btn');
  const close = document.getElementById('chord-pad-modal-close');
  const backdrop = modal?.querySelector('[data-close-cp-modal]');
  if (!modal || !btn) return;
  const outToggle = modal.querySelector('.cp-modal-output-toggle');
  const chWrap    = modal.querySelector('.cp-modal-ch-inline');
  const chInp     = document.getElementById('cp-modal-channel');
  const instPicker = document.getElementById('cp-modal-inst-picker');
  const knobsEl   = document.getElementById('cp-modal-knobs');
  const instRow   = modal.querySelector('.cp-modal-inst-row');
  const soundRow  = modal.querySelector('.cp-modal-sound-row');

  // Build the categorized GM instrument dropdown — same DOM structure as
  // the track-fx modal so all the existing .track-fx-inst-* styles apply.
  function buildInstrumentPicker() {
    if (!instPicker) return;
    instPicker.innerHTML = `
      <button type="button" class="track-fx-inst-btn">
        <span class="track-fx-inst-label">${escapeHtml(instrumentDisplayName(state.instrument))}</span>
        <span class="track-fx-inst-chev">▾</span>
      </button>
      <div class="track-fx-inst-menu" hidden>
        <button type="button" class="track-fx-inst-item" data-inst="synth">
          <span class="track-fx-inst-item-name">Synth</span>
        </button>
        ${GM_CATEGORIES.map(cat => `
          <div class="track-fx-inst-cat">
            <button type="button" class="track-fx-inst-cat-btn">
              <span>${escapeHtml(cat.name)}</span>
              <span class="track-fx-inst-cat-chev">›</span>
            </button>
            <div class="track-fx-inst-submenu" hidden>
              ${cat.presets.map(p => {
                const id = SF2_PRESET_TO_SHORT[p.n] || ('gm' + p.n);
                return `<button type="button" class="track-fx-inst-item" data-inst="${id}">
                  <span class="track-fx-inst-item-name">${escapeHtml(p.name)}</span>
                </button>`;
              }).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
    const instBtn   = instPicker.querySelector('.track-fx-inst-btn');
    const instMenu  = instPicker.querySelector('.track-fx-inst-menu');
    const instLabel = instPicker.querySelector('.track-fx-inst-label');
    const closeMenu = () => {
      instMenu.hidden = true;
      document.querySelectorAll('.track-fx-inst-submenu').forEach(sm => sm.hidden = true);
    };
    instBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      instMenu.hidden = !instMenu.hidden;
      if (instMenu.hidden) { closeMenu(); return; }
      // Mark current selection.
      document.querySelectorAll('.track-fx-inst-item.selected').forEach(el => el.classList.remove('selected'));
      document.querySelectorAll(`.track-fx-inst-item[data-inst="${state.instrument}"]`).forEach(el => el.classList.add('selected'));
      const curItem = document.querySelector(`.track-fx-inst-item[data-inst="${state.instrument}"]`);
      if (curItem) {
        let ownerCat = curItem.closest('.track-fx-inst-cat');
        if (!ownerCat) {
          instMenu.querySelectorAll('.track-fx-inst-cat').forEach(c => {
            if (c._submenu && c._submenu.contains(curItem)) ownerCat = c;
          });
        }
        if (ownerCat) {
          ownerCat.scrollIntoView({ block: 'nearest' });
          const subm = ownerCat._submenu;
          if (subm) {
            hideOtherSubmenus(subm);
            positionSubmenu(ownerCat, subm);
            subm.hidden = false;
            curItem.scrollIntoView({ block: 'nearest' });
          }
        } else {
          curItem.scrollIntoView({ block: 'nearest' });
        }
      }
    });
    const positionSubmenu = (catEl, submenu) => {
      if (submenu.parentElement !== document.body) document.body.appendChild(submenu);
      const menuRect = instMenu.getBoundingClientRect();
      const catRect  = catEl.getBoundingClientRect();
      const subW = 170;
      let left = menuRect.right + 2;
      if (left + subW > window.innerWidth - 8) {
        left = Math.max(8, menuRect.left - subW - 2);
      }
      submenu.style.left = left + 'px';
      submenu.style.top  = catRect.top + 'px';
    };
    instMenu.querySelectorAll('.track-fx-inst-cat').forEach(cat => {
      cat._submenu = cat.querySelector('.track-fx-inst-submenu');
    });
    const hideOtherSubmenus = (keep) => {
      document.querySelectorAll('.track-fx-inst-submenu').forEach(sm => {
        if (sm !== keep) sm.hidden = true;
      });
    };
    instMenu.querySelectorAll(':scope > .track-fx-inst-item').forEach(item => {
      item.addEventListener('mouseenter', () => hideOtherSubmenus(null));
    });
    instMenu.querySelectorAll('.track-fx-inst-cat-btn').forEach(btn => {
      const cat = btn.closest('.track-fx-inst-cat');
      const submenu = cat._submenu;
      cat.addEventListener('mouseenter', () => {
        hideOtherSubmenus(submenu);
        positionSubmenu(cat, submenu);
        submenu.hidden = false;
      });
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (submenu.hidden) { hideOtherSubmenus(submenu); positionSubmenu(cat, submenu); submenu.hidden = false; }
        else submenu.hidden = true;
      });
      submenu.addEventListener('mouseenter', () => { hideOtherSubmenus(submenu); submenu.hidden = false; });
    });
    instMenu.addEventListener('mouseleave', () => {
      setTimeout(() => {
        document.querySelectorAll('.track-fx-inst-submenu').forEach(sm => {
          if (!sm.matches(':hover')) sm.hidden = true;
        });
      }, 100);
    });
    setTimeout(() => {
      document.addEventListener('mousedown', function _outside(ev) {
        const inSubmenu = ev.target.closest && ev.target.closest('.track-fx-inst-submenu');
        if (!instPicker.contains(ev.target) && !inSubmenu) {
          closeMenu();
          document.removeEventListener('mousedown', _outside);
        }
      });
    }, 0);
    instMenu.querySelectorAll('.track-fx-inst-item').forEach(item => {
      item.addEventListener('click', (ev) => {
        ev.stopPropagation();
        closeMenu();
        const nextInst = item.dataset.inst;
        instLabel.textContent = item.querySelector('.track-fx-inst-item-name').textContent;
        // Hand the change off to the existing #synth-instrument change
        // handler so sample-loading + state.synth reset run as usual.
        const sel = document.getElementById('synth-instrument');
        if (sel) {
          // The hidden select may not have an option for every GM short-id;
          // add one on the fly so .value = nextInst sticks.
          if (!Array.from(sel.options).some(o => o.value === nextInst)) {
            const opt = document.createElement('option');
            opt.value = nextInst;
            opt.textContent = instrumentDisplayName(nextInst);
            sel.appendChild(opt);
          }
          sel.value = nextInst;
          sel.dispatchEvent(new Event('change'));
        } else {
          state.instrument = nextInst;
        }
        rebuildSound();
      });
    });
  }
  const portRow   = modal.querySelector('.cp-modal-port-row');
  const portSel   = document.getElementById('cp-modal-port');
  function rebuildPortList() {
    if (!portSel) return;
    const ports = state.midiAccess ? Array.from(state.midiAccess.outputs.values()) : [];
    portSel.innerHTML = '<option value="">— default —</option>'
      + ports.map(p => `<option value="${p.id}"${p.id === (state.padMidiPortId || '') ? ' selected' : ''}>${p.name}</option>`).join('');
  }
  portSel?.addEventListener('change', () => {
    state.padMidiPortId = portSel.value;
    seqSave();
  });
  // Refresh port list when devices come/go (e.g. starting loopMIDI mid-session).
  document.addEventListener('chordpad:midi-ports-changed', () => {
    if (!modal.hidden) rebuildPortList();
    // Also re-render the per-track FX modal if it's open — its port lists
    // are built once inside openTrackFxModal so the easiest refresh is a
    // full rebuild keyed off the visible track.
    const tfx = document.getElementById('track-fx-modal');
    if (tfx && !tfx.hidden) {
      const id = tfx.dataset.trackId;
      const trk = id ? trackById(id) : null;
      if (trk) openTrackFxModal(trk);
    }
  });

  // Build one sound-param knob bound to state.synth. Mirrors the per-track
  // makeFxKnob but uses the chord-pad's global state.synth.
  function makeCpKnob(key) {
    const fieldMap = Object.fromEntries(TRACK_FX_FIELDS.map(f => [f[0], f]));
    const [, label, min, max, curve, fmt, synthOnly, sync] = fieldMap[key];
    const cur = (state.synth[key] !== undefined) ? state.synth[key] : min;
    const cell = document.createElement('div');
    cell.className = 'track-fx-knob-cell';
    cell.innerHTML = `
      <span class="track-fx-knob-val">${fmt(cur)}</span>
      <span class="track-fx-knob"><span class="track-fx-knob-ind"></span></span>
      <span class="track-fx-knob-label">${label.replace(/ /g, '<br>')}${sync ? '<button class="track-fx-sync" title="Snap to tempo"><i data-lucide="refresh-cw"></i></button>' : ''}</span>
    `;
    const knob  = cell.querySelector('.track-fx-knob');
    const valEl = cell.querySelector('.track-fx-knob-val');
    const apply = (v) => {
      v = Math.max(min, Math.min(max, v));
      state.synth[key] = v;
      valEl.textContent = fmt(v);
      const norm = Math.pow((v - min) / (max - min || 1), 1 / curve);
      knob.style.setProperty('--ang', (-135 + norm * 270) + 'deg');
    };
    apply(cur);
    knob.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      knob.setPointerCapture(e.pointerId);
      const startX = e.clientX, startY = e.clientY;
      const startNorm = Math.pow((state.synth[key] - min) / (max - min || 1), 1 / curve);
      const onMove = (ev) => {
        const speed = ev.shiftKey ? 4 : 1;
        const delta = ((startY - ev.clientY) + (ev.clientX - startX)) / speed;
        const norm  = Math.max(0, Math.min(1, startNorm + delta / 200));
        apply(min + (max - min) * Math.pow(norm, curve));
      };
      const onUp = () => {
        knob.removeEventListener('pointermove', onMove);
        knob.removeEventListener('pointerup', onUp);
      };
      knob.addEventListener('pointermove', onMove);
      knob.addEventListener('pointerup', onUp);
    });
    knob.addEventListener('dblclick', (e) => {
      e.preventDefault(); e.stopPropagation();
      const preset = INSTRUMENT_PRESETS?.[state.instrument];
      if (preset?.[key] === undefined) return;
      apply(preset[key]);
    });
    knob.addEventListener('wheel', (e) => {
      e.preventDefault();
      const norm = Math.pow((state.synth[key] - min) / (max - min || 1), 1 / curve);
      const step = e.shiftKey ? 0.005 : 0.02;
      const next = Math.max(0, Math.min(1, norm - Math.sign(e.deltaY) * step));
      apply(min + (max - min) * Math.pow(next, curve));
    }, { passive: false });
    if (sync) {
      cell.querySelector('.track-fx-sync')?.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        apply(fxTempoSnap(sync, state.synth[key]));
      });
    }
    return { cell, key, synthOnly };
  }

  function rebuildSound() {
    if (!knobsEl) return;
    knobsEl.innerHTML = '';
    const isSynth = state.instrument === 'synth';
    // Show waveform picker only for the synth voice.
    const wfRow = document.getElementById('cp-modal-waveform-row');
    const wfSel = document.getElementById('cp-modal-waveform');
    if (wfRow) wfRow.hidden = !isSynth;
    if (wfSel && isSynth) {
      wfSel.value = state.synth.waveform || 'sine';
      if (!wfSel.dataset.bound) {
        wfSel.dataset.bound = '1';
        wfSel.addEventListener('change', () => {
          state.synth.waveform = wfSel.value;
          // Mirror the change to the hidden #synth-waveform if present.
          const sw = document.getElementById('synth-waveform');
          if (sw) { sw.value = wfSel.value; sw.dispatchEvent(new Event('change')); }
        });
      }
    }
    for (const [key, , , , , , synthOnly] of TRACK_FX_FIELDS) {
      if (synthOnly && !isSynth) continue;
      knobsEl.appendChild(makeCpKnob(key).cell);
    }
    refreshLucide();
  }
  function syncOutput() {
    if (!outToggle) return;
    outToggle.querySelectorAll('.track-fx-out-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.out === state.padOutput);
    });
    const midi = state.padOutput === 'midi';
    // The .hidden class wins over inline display because of CSS specificity;
    // toggle the class explicitly so the channel input actually shows in
    // MIDI mode.
    if (chWrap) chWrap.classList.toggle('hidden', !midi);
    if (chInp)  chInp.value = String((state.padChannel ?? 0) + 1);
    if (portRow) portRow.classList.toggle('hidden', !midi);
    if (instRow)  instRow.style.display  = midi ? 'none' : '';
    if (soundRow) soundRow.style.display = midi ? 'none' : '';
    const wfRow    = document.getElementById('cp-modal-waveform-row');
    const resetRow = document.getElementById('cp-modal-reset-row');
    if (wfRow)    wfRow.style.display    = midi ? 'none' : '';
    if (resetRow) resetRow.style.display = midi ? 'none' : '';
  }
  outToggle?.querySelectorAll('.track-fx-out-btn').forEach(b => {
    b.addEventListener('click', () => {
      if (b.dataset.out === state.padOutput) return;
      state.padOutput = b.dataset.out;
      syncOutput();
      seqSave();
      // Mirror to the synth-controls panel toggle if present.
      document.querySelectorAll('.synth-output-toggle .track-fx-out-btn').forEach(s => {
        s.classList.toggle('active', s.dataset.out === state.padOutput);
      });
    });
  });
  chInp?.addEventListener('change', () => {
    const v = Math.max(1, Math.min(16, parseInt(chInp.value, 10) || 1));
    chInp.value = v;
    state.padChannel = v - 1;
    seqSave();
  });
  // Reset-to-preset wiring (one-time).
  const resetBtn = document.getElementById('cp-modal-reset');
  if (resetBtn && !resetBtn.dataset.bound) {
    resetBtn.dataset.bound = '1';
    resetBtn.addEventListener('click', () => {
      const preset = INSTRUMENT_PRESETS?.[state.instrument] || INSTRUMENT_PRESETS?.epiano;
      if (!preset) return;
      // Reset state.synth params; mirror through the existing
      // applySynthPreset which also updates the hidden synth-* inputs.
      applySynthPreset(preset);
      if (state.instrument === 'synth' && preset.waveform) {
        state.synth.waveform = preset.waveform;
        const wfSel = document.getElementById('cp-modal-waveform');
        if (wfSel) wfSel.value = preset.waveform;
      }
      rebuildSound();
    });
  }

  const open = () => {
    buildInstrumentPicker();
    rebuildPortList();
    syncOutput();
    rebuildSound();
    // Update reset-button label to reflect current instrument.
    if (resetBtn) resetBtn.textContent = `Reset to ${instrumentDisplayName(state.instrument)} defaults`;
    modal.hidden = false;
    refreshLucide();
  };
  const shut = () => { modal.hidden = true; };
  btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); open(); });
  close?.addEventListener('click', shut);
  backdrop?.addEventListener('click', shut);
  document.addEventListener('keydown', (e) => {
    if (!modal.hidden && e.key === 'Escape') shut();
  });
})();

// Chord-pad Output toggle (Instrument | MIDI) + Channel input. Mirrors the
// per-track output toggle. State persisted via the same SEQ_KEY blob below.
(function _initPadOutputToggle() {
  const row    = document.getElementById('synth-output-row');
  if (!row) return;
  const toggle = row.querySelector('.synth-output-toggle');
  const chWrap = row.querySelector('.synth-ch-inline');
  const chInp  = document.getElementById('pad-channel');
  const sync = () => {
    toggle.querySelectorAll('.track-fx-out-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.out === state.padOutput);
    });
    chWrap?.classList.toggle('hidden', state.padOutput !== 'midi');
    if (chInp) chInp.value = String((state.padChannel ?? 0) + 1);
  };
  sync();
  toggle.querySelectorAll('.track-fx-out-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.out;
      if (next === state.padOutput) return;
      state.padOutput = next;
      sync();
      seqSave();
    });
  });
  chInp?.addEventListener('change', () => {
    const v = Math.max(1, Math.min(16, parseInt(chInp.value, 10) || 1));
    chInp.value = v;
    state.padChannel = v - 1;
    seqSave();
  });
})();


(function _initSectionToggles() {
  const KEY = 'chordpad.hiddenSections';
  let hidden = {};
  try { hidden = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (_) { hidden = {}; }
  // The "settings" section behaves as a popover (gear → dropdown), not an
  // inline panel like the others. Default it to hidden so the popover is
  // closed on load.
  if (hidden.settings === undefined) hidden.settings = true;
  const apply = () => {
    Object.entries(hidden).forEach(([sec, hide]) => {
      document.body.classList.toggle('hide-' + sec, !!hide);
    });
    document.querySelectorAll('.header-section-toggle[data-section]').forEach(btn => {
      const sec = btn.dataset.section;
      btn.classList.toggle('active', !hidden[sec]);
    });
    // Position the settings popover under its gear button each time it opens.
    const setBtn  = document.querySelector('.header-section-toggle[data-section="settings"]');
    const setPan  = document.getElementById('settings-panel');
    if (setBtn && setPan && !hidden.settings) {
      const r = setBtn.getBoundingClientRect();
      setPan.style.top  = (r.bottom + 4) + 'px';
      setPan.style.right = Math.max(8, window.innerWidth - r.right) + 'px';
    }
  };
  apply();
  document.querySelectorAll('.header-section-toggle[data-section]').forEach(btn => {
    btn.addEventListener('mousedown', (e) => e.preventDefault());
    btn.addEventListener('click', (ev) => {
      const sec = btn.dataset.section;
      hidden[sec] = !hidden[sec];
      apply();
      try { localStorage.setItem(KEY, JSON.stringify(hidden)); } catch (_) {}
      if (sec === 'settings' && !hidden.settings) ev.stopPropagation();
    });
  });
  // Click outside the settings popover closes it (only when open).
  document.addEventListener('mousedown', (ev) => {
    if (hidden.settings) return;
    const pan = document.getElementById('settings-panel');
    const btn = document.querySelector('.header-section-toggle[data-section="settings"]');
    if (!pan || !btn) return;
    if (pan.contains(ev.target) || btn.contains(ev.target)) return;
    hidden.settings = true;
    apply();
    try { localStorage.setItem(KEY, JSON.stringify(hidden)); } catch (_) {}
  });
})();

// Reset Chord Pad: triple-click the brand logo. Three clicks within 600ms
// total opens a custom-styled confirm dialog (same component as deleteTrack)
// — protects against accidental triggers while staying discoverable via the
// title tooltip.
(function _initLogoReset() {
  const brand = document.getElementById('brand-logo');
  if (!brand) return;
  let clicks = 0;
  let timer = null;
  brand.addEventListener('click', () => {
    clicks += 1;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { clicks = 0; }, 600);
    if (clicks < 3) return;
    clicks = 0;
    showConfirm({
      title: 'Reset Chord Pad',
      message: 'This clears all saved state — tracks, settings, everything. Cannot be undone.',
      confirmLabel: 'Reset',
      danger: true,
      onConfirm: () => {
        try { localStorage.clear(); } catch (_) {}
        const url = new URL(window.location.href);
        url.searchParams.set('_t', Date.now().toString());
        window.location.replace(url.toString());
      },
    });
  });
})();
// Volume-balance toggle: per-GM-category makeup gain so e.g. bass isn't
// drowned out by piano. Persisted via seqSave().
(function _initVolBalance() {
  const btn = document.getElementById('vol-balance-toggle');
  if (!btn) return;
  const sync = () => {
    const on = !!state.volumeBalance;
    btn.classList.toggle('active', on);
    btn.textContent = on ? 'ON' : 'OFF';
  };
  sync();
  btn.addEventListener('click', () => {
    state.volumeBalance = !state.volumeBalance;
    sync();
    if (typeof seqSave === 'function') seqSave();
  });
  setTimeout(sync, 0);
})();
const VOICINGS = ['auto', 'high', 'low', 'spread', 'root'];
const VOICING_LABELS = { auto: 'Auto', high: 'High', low: 'Low', spread: 'Spread', root: 'Root' };
const voicingToggleBtn = document.getElementById('voicing-toggle');
voicingToggleBtn.addEventListener('click', () => {
  const idx = VOICINGS.indexOf(state.voicing);
  state.voicing = VOICINGS[(idx + 1) % VOICINGS.length];
  voicingToggleBtn.textContent = VOICING_LABELS[state.voicing];
  voicingToggleBtn.classList.toggle('active', state.voicing !== 'root');
});
const sustainBtn = document.getElementById('sustain-toggle');
sustainBtn.addEventListener('click', () => {
  state.sustain = !state.sustain;
  sustainBtn.textContent = state.sustain ? 'ON' : 'OFF';
  sustainBtn.classList.toggle('active', state.sustain);
  if (!state.sustain) releaseAll();
});

const audioToggleBtn = document.getElementById('audio-toggle');
audioToggleBtn.addEventListener('click', () => {
  state.audioEnabled = !state.audioEnabled;
  audioToggleBtn.textContent = state.audioEnabled ? 'ON' : 'OFF';
  audioToggleBtn.classList.toggle('active', state.audioEnabled);
});

const audioVolumeLabel  = document.getElementById('audio-volume-val');
(function _initMasterVolKnob() {
  const knob = document.getElementById('master-vol-knob');
  if (!knob) return;
  const VOL_MIN = 0, VOL_MAX = 2; // 0%–200%
  const apply = (v) => {
    v = Math.max(VOL_MIN, Math.min(VOL_MAX, v));
    state.audioVolume = v;
    if (audioVolumeLabel) audioVolumeLabel.textContent = Math.round(v * 100) + '%';
    const frac = (v - VOL_MIN) / (VOL_MAX - VOL_MIN);
    knob.style.setProperty('--ang', (-135 + frac * 270) + 'deg');
  };
  apply(state.audioVolume);
  knob.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    knob.setPointerCapture(e.pointerId);
    const startX = e.clientX, startY = e.clientY;
    const startV = state.audioVolume;
    const onMove = (ev) => {
      const speed = ev.shiftKey ? 4 : 1;
      const delta = ((startY - ev.clientY) + (ev.clientX - startX)) / speed;
      apply(startV + (delta / 200) * (VOL_MAX - VOL_MIN));
    };
    const onUp = () => {
      knob.removeEventListener('pointermove', onMove);
      knob.removeEventListener('pointerup', onUp);
    };
    knob.addEventListener('pointermove', onMove);
    knob.addEventListener('pointerup', onUp);
  });
  knob.addEventListener('dblclick', () => apply(1.0));
  knob.addEventListener('wheel', (e) => {
    e.preventDefault();
    const step = e.shiftKey ? 0.01 : 0.05;
    apply(state.audioVolume - Math.sign(e.deltaY) * step);
  }, { passive: false });
})();


const scaleTonesToggleBtn = document.getElementById('scale-tones-toggle');
scaleTonesToggleBtn.addEventListener('click', () => {
  state.showScaleTones = !state.showScaleTones;
  scaleTonesToggleBtn.textContent = state.showScaleTones ? 'ON' : 'OFF';
  scaleTonesToggleBtn.classList.toggle('active', state.showScaleTones);
});

const pianoHoverToggleBtn = document.getElementById('piano-hover-toggle');
const scaleTonesControl = document.getElementById('scale-tones-control');
pianoHoverToggleBtn.addEventListener('click', () => {
  state.showPianoHover = !state.showPianoHover;
  pianoHoverToggleBtn.textContent = state.showPianoHover ? 'ON' : 'OFF';
  pianoHoverToggleBtn.classList.toggle('active', state.showPianoHover);
  scaleTonesControl.style.display = state.showPianoHover ? '' : 'none';
});

const bassToggleBtn = document.getElementById('bass-toggle');
bassToggleBtn.addEventListener('click', () => {
  state.bassEnabled = !state.bassEnabled;
  bassToggleBtn.textContent = state.bassEnabled ? 'ON' : 'OFF';
  bassToggleBtn.classList.toggle('active', state.bassEnabled);
});
document.getElementById('bass-oct-down').addEventListener('click', () => {
  if (state.bassOctave <= 1) return;
  state.bassOctave--;
  document.getElementById('ctrl-bass-oct').textContent = state.bassOctave;
});
document.getElementById('bass-oct-up').addEventListener('click', () => {
  if (state.bassOctave >= 4) return;
  state.bassOctave++;
  document.getElementById('ctrl-bass-oct').textContent = state.bassOctave;
});

// ============================================================
// SYNTH SLIDERS
// ============================================================
function sliderToAttack(v)   { return 0.002 + Math.pow(v / 100, 2.5) * 0.998; } // 2ms–1s
function sliderToRelease(v)  { return 0.05  + Math.pow(v / 100, 2)   * 3.95;  } // 50ms–4s
function sliderToTone(v)     { return 200   * Math.pow(60, v / 100);           } // 200Hz–12kHz log
function sliderToRes(v)      { return 0.1   + Math.pow(v / 100, 1.8) * 9.9;   } // 0.1–10
function sliderToDecay(v)   { return 0.05 + Math.pow(v / 100, 2) * 2.95; } // 50ms–3s
function sliderToSustain(v) { return v / 100; }
function sliderToOvertones(v){ return v / 100; }
function sliderToReverb(v)    { return v / 100; }
function sliderToDetune(v)    { return v * 0.3; }
function sliderToVibratoRate(v) { return 0.5 + v / 100 * 9.5; }
function sliderToVibratoDepth(v){ return v * 0.5; }
function sliderToTremoloRate(v) { return 0.5 + v / 100 * 9.5; }
function sliderToTremoloDepth(v){ return v / 100; }
function sliderToDelayTime(v)   { return 0.05 + v / 100 * 0.95; }
function sliderToDelayFeedback(v){ return v / 100 * 0.85; }
function sliderToDelayWet(v)    { return v / 100; }
function sliderToFilterLfo(v)   { return v / 100 * 800; }

// Inverse slider mappings (value → slider position 0-100)
function invAttack(v)    { return Math.round(100 * Math.pow(Math.max(0,(v-0.002)/0.998), 1/2.5)); }
function invDecay(v)     { return Math.round(100 * Math.pow(Math.max(0,(v-0.05)/2.95),   0.5)); }
function invSustain(v)   { return Math.round(v * 100); }
function invRelease(v)   { return Math.round(100 * Math.pow(Math.max(0,(v-0.05)/3.95),   0.5)); }
function invTone(v)      { return Math.round(100 * Math.log(v/200) / Math.log(60)); }
function invRes(v)       { return Math.round(100 * Math.pow(Math.max(0,(v-0.1)/9.9), 1/1.8)); }
function invOvertones(v) { return Math.round(v * 100); }
function invReverb(v)    { return Math.round(v * 100); }
function invDetune(v)    { return Math.round(v / 0.3); }
function invVibRate(v)   { return Math.round((v-0.5)/9.5*100); }
function invVibDepth(v)  { return Math.round(v / 0.5); }
function invTremRate(v)  { return Math.round((v-0.5)/9.5*100); }
function invTremDepth(v) { return Math.round(v * 100); }
function invDlyTime(v)   { return Math.round((v-0.05)/0.95*100); }
function invDlyFb(v)     { return Math.round(v/0.85*100); }
function invDlyWet(v)    { return Math.round(v * 100); }
function invFlfo(v)      { return Math.round(v / 8); }

const INSTRUMENT_PRESETS = {
  piano:   { attack:0.005, decay:0.8,  sustain:0.2,  release:2.0,  filterFreq:5000, filterQ:0.5, overtones:0.2, reverb:0.4,  detune:0, vibratoRate:5, vibratoDepth:0, tremoloRate:4, tremoloDepth:0,    delayTime:0.3, delayFeedback:0.3, delayWet:0, filterLfoDepth:0, waveform:'sine' },
  epiano:  { attack:0.004, decay:1.8,  sustain:0.28, release:0.9,  filterFreq:3800, filterQ:0.9, overtones:0.2, reverb:0.30, detune:0, vibratoRate:5, vibratoDepth:0, tremoloRate:4, tremoloDepth:0.35, delayTime:0.3, delayFeedback:0.3, delayWet:0, filterLfoDepth:0, waveform:'sine' },
  epiano2: { attack:0.008, decay:0.4,  sustain:0.4,  release:1.2,  filterFreq:3500, filterQ:1.0, overtones:0.2, reverb:0.3,  detune:0, vibratoRate:5, vibratoDepth:0, tremoloRate:4, tremoloDepth:0,    delayTime:0.3, delayFeedback:0.3, delayWet:0, filterLfoDepth:0, waveform:'sine' },
  organ:   { attack:0.02,  decay:0.1,  sustain:0.9,  release:0.08, filterFreq:4000, filterQ:0.5, overtones:0.2, reverb:0.3,  detune:0, vibratoRate:5, vibratoDepth:0, tremoloRate:6, tremoloDepth:0.1,  delayTime:0.3, delayFeedback:0.3, delayWet:0, filterLfoDepth:0, waveform:'sine' },
  strings: { attack:0.4,   decay:0.3,  sustain:0.8,  release:1.5,  filterFreq:3000, filterQ:1.0, overtones:0.2, reverb:0.6,  detune:0, vibratoRate:5, vibratoDepth:0, tremoloRate:4, tremoloDepth:0,    delayTime:0.3, delayFeedback:0.3, delayWet:0, filterLfoDepth:0, waveform:'sine' },
  choir:   { attack:0.35,  decay:0.3,  sustain:0.75, release:1.2,  filterFreq:3500, filterQ:1.0, overtones:0.2, reverb:0.65, detune:0, vibratoRate:5, vibratoDepth:0, tremoloRate:4, tremoloDepth:0,    delayTime:0.3, delayFeedback:0.3, delayWet:0, filterLfoDepth:0, waveform:'sine' },
  vibes:   { attack:0.005, decay:1.2,  sustain:0.1,  release:1.8,  filterFreq:6000, filterQ:0.5, overtones:0.2, reverb:0.5,  detune:0, vibratoRate:5, vibratoDepth:0, tremoloRate:4, tremoloDepth:0,    delayTime:0.3, delayFeedback:0.3, delayWet:0, filterLfoDepth:0, waveform:'sine' },
  pad:     { attack:0.5,   decay:0.3,  sustain:0.85, release:2.0,  filterFreq:2500, filterQ:1.5, overtones:0.2, reverb:0.7,  detune:0, vibratoRate:5, vibratoDepth:0, tremoloRate:4, tremoloDepth:0,    delayTime:0.3, delayFeedback:0.3, delayWet:0, filterLfoDepth:0, waveform:'sine' },
};
const savedPresets = Object.fromEntries(Object.keys(SAMPLE_DEFS).concat(['synth']).map(k => [k, null]));

function applySynthPreset(preset) {
  const set = (id, raw) => {
    const el = document.getElementById(id);
    if (el) { el.value = Math.max(0, Math.min(100, raw)); el.dispatchEvent(new Event('input')); }
  };
  if (preset.attack        !== undefined) set('synth-attack',     invAttack(preset.attack));
  if (preset.decay         !== undefined) set('synth-decay',      invDecay(preset.decay));
  if (preset.sustain       !== undefined) set('synth-sustain',    invSustain(preset.sustain));
  if (preset.release       !== undefined) set('synth-release',    invRelease(preset.release));
  if (preset.filterFreq    !== undefined) set('synth-tone',       invTone(preset.filterFreq));
  if (preset.filterQ       !== undefined) set('synth-res',        invRes(preset.filterQ));
  if (preset.overtones     !== undefined) set('synth-overtones',  invOvertones(preset.overtones));
  if (preset.reverb        !== undefined) set('synth-reverb',     invReverb(preset.reverb));
  if (preset.detune        !== undefined) set('synth-detune',     invDetune(preset.detune));
  if (preset.vibratoRate   !== undefined) set('synth-vib-rate',   invVibRate(preset.vibratoRate));
  if (preset.vibratoDepth  !== undefined) set('synth-vib-depth',  invVibDepth(preset.vibratoDepth));
  if (preset.tremoloRate   !== undefined) set('synth-trem-rate',  invTremRate(preset.tremoloRate));
  if (preset.tremoloDepth  !== undefined) set('synth-trem-depth', invTremDepth(preset.tremoloDepth));
  if (preset.delayTime     !== undefined) set('synth-dly-time',   invDlyTime(preset.delayTime));
  if (preset.delayFeedback !== undefined) set('synth-dly-fb',     invDlyFb(preset.delayFeedback));
  if (preset.delayWet      !== undefined) set('synth-dly-wet',    invDlyWet(preset.delayWet));
  if (preset.filterLfoDepth!== undefined) set('synth-flfo',       invFlfo(preset.filterLfoDepth));
  if (preset.waveform      !== undefined) {
    state.synth.waveform = preset.waveform;
    const el = document.getElementById('synth-waveform');
    if (el) el.value = preset.waveform;
  }
}

function fmtMs(s) {
  return s < 1 ? Math.round(s * 1000) + 'ms' : s.toFixed(2) + 's';
}
function fmtHz(hz) {
  return hz >= 1000 ? (hz / 1000).toFixed(1) + 'kHz' : Math.round(hz) + 'Hz';
}

(function initSynthSliders() {
  const defs = [
    { id: 'synth-attack',   valId: 'synth-attack-val',   key: 'attack',     fn: sliderToAttack,    fmt: fmtMs },
    { id: 'synth-decay',    valId: 'synth-decay-val',    key: 'decay',      fn: sliderToDecay,     fmt: fmtMs },
    { id: 'synth-sustain',  valId: 'synth-sustain-val',  key: 'sustain',    fn: sliderToSustain,   fmt: v => Math.round(v * 100) + '%' },
    { id: 'synth-release',  valId: 'synth-release-val',  key: 'release',    fn: sliderToRelease,   fmt: fmtMs },
    { id: 'synth-tone',     valId: 'synth-tone-val',     key: 'filterFreq', fn: sliderToTone,      fmt: fmtHz },
    { id: 'synth-res',      valId: 'synth-res-val',      key: 'filterQ',    fn: sliderToRes,       fmt: v => v.toFixed(1) },
    { id: 'synth-overtones',valId: 'synth-overtones-val',key: 'overtones',  fn: sliderToOvertones, fmt: v => Math.round(v * 100) + '%' },
    { id: 'synth-reverb',    valId: 'synth-reverb-val',    key: 'reverb',        fn: sliderToReverb,       fmt: v => Math.round(v * 100) + '%',
      side: val => { if (audioCtx?._reverbWet) audioCtx._reverbWet.gain.value = val; } },
    { id: 'synth-detune',    valId: 'synth-detune-val',    key: 'detune',        fn: sliderToDetune,       fmt: v => Math.round(v) + '¢' },
    { id: 'synth-vib-rate',  valId: 'synth-vib-rate-val',  key: 'vibratoRate',   fn: sliderToVibratoRate,  fmt: v => v.toFixed(1) + 'Hz' },
    { id: 'synth-vib-depth', valId: 'synth-vib-depth-val', key: 'vibratoDepth',  fn: sliderToVibratoDepth, fmt: v => Math.round(v) + '¢' },
    { id: 'synth-trem-rate', valId: 'synth-trem-rate-val', key: 'tremoloRate',   fn: sliderToTremoloRate,  fmt: v => v.toFixed(1) + 'Hz' },
    { id: 'synth-trem-depth',valId: 'synth-trem-depth-val',key: 'tremoloDepth',  fn: sliderToTremoloDepth, fmt: v => Math.round(v * 100) + '%' },
    { id: 'synth-dly-time',  valId: 'synth-dly-time-val',  key: 'delayTime',     fn: sliderToDelayTime,    fmt: fmtMs,
      side: val => { if (audioCtx?._delay) audioCtx._delay.delayTime.value = val; } },
    { id: 'synth-dly-fb',    valId: 'synth-dly-fb-val',    key: 'delayFeedback', fn: sliderToDelayFeedback,fmt: v => Math.round(v * 100) + '%',
      side: val => { if (audioCtx?._delayFb) audioCtx._delayFb.gain.value = val; } },
    { id: 'synth-dly-wet',   valId: 'synth-dly-wet-val',   key: 'delayWet',      fn: sliderToDelayWet,     fmt: v => Math.round(v * 100) + '%',
      side: val => { if (audioCtx?._delayWet) audioCtx._delayWet.gain.value = val; } },
    { id: 'synth-flfo',      valId: 'synth-flfo-val',      key: 'filterLfoDepth',fn: sliderToFilterLfo,    fmt: v => Math.round(v) + 'Hz' },
  ];
  defs.forEach(({ id, valId, key, fn, fmt, side }) => {
    const el = document.getElementById(id);
    const lbl = document.getElementById(valId);
    const update = () => {
      const val = fn(parseInt(el.value, 10));
      editTargetSynth()[key] = val;
      lbl.textContent = fmt(val);
      // Side-effects on the live audio bus (reverb wet, delay time, ...)
      // only make sense when we're editing the chord-pad voice. For tracks
      // those values get baked into the next note's chain via withSynth.
      if (side && state.synthEditTarget === 'pad') side(val);
    };
    el.addEventListener('input', update);
    update(); // set initial label
  });
})();

// ============================================================
// KEYBOARD
// ============================================================
const heldKeys = new Set();

function findChordByKey(key) {
  const tpl = TEMPLATES[state.currentTemplate];
  const keymap   = V2_KEYMAPS[state.currentTemplate]  || tpl?.keymap;
  const sections = V2_SECTIONS[state.currentTemplate] || tpl?.sections;
  if (!keymap) return null;
  const mapping = keymap[key];
  if (!mapping) return null;
  const [section, idx] = mapping;
  const prefix = state.currentTemplate === 'major-harmony' ? 'major' : 'minor';
  if (section === 'neapolitan') {
    const sec = sections.find(s => s.neapolitan);
    if (!sec) return null;
    return { padId: `${prefix}-pad-neapolitan-0`, chord: sec.neapolitan };
  }
  const sec = sections.find(s => s.id === section);
  if (!sec) return null;
  const chord = sec.chords[idx];
  if (!chord) return null;
  return { padId: `${prefix}-pad-${section}-${idx}`, chord };
}

function flashHint(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 300);
}

function getBaseKey(e) {
  if (e.code.startsWith('Digit')) return e.code.replace('Digit', '');
  if (e.code.startsWith('Key'))   return e.code.replace('Key', '').toLowerCase();
  return e.key.toLowerCase();
}

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  const key = getBaseKey(e);

  // Sequencer shortcuts: undo/redo, copy/cut/paste, delete selection
  if ((e.ctrlKey || e.metaKey) && !e.altKey) {
    if (key === 'z' && !e.shiftKey) { e.preventDefault(); seqUndo(); return; }
    if (key === 'z' && e.shiftKey)  { e.preventDefault(); seqRedo(); return; }
    if (key === 'y' && !e.shiftKey) { e.preventDefault(); seqRedo(); return; }
    // Prefer note-level ops when the piano-roll has a note selection (or a
    // note clipboard for paste). Falls back to clip-level ops otherwise.
    const noteCtx = prRollHasNoteSelection();
    if (key === 'c' && !e.shiftKey) { e.preventDefault(); noteCtx ? prCopyNotes()      : seqCopySelection();      return; }
    if (key === 'x' && !e.shiftKey) { e.preventDefault(); noteCtx ? prCutNotes()       : seqCutSelection();       return; }
    if (key === 'v' && !e.shiftKey) { e.preventDefault(); (SEQ.pianoRollOpen && SEQ.prClipboard) ? prPasteNotes() : seqPasteSelection(); return; }
    if (key === 'd' && !e.shiftKey) { e.preventDefault(); noteCtx ? prDuplicateNotes() : seqDuplicateSelection(); return; }
    if (key === 'a' && !e.shiftKey) {
      e.preventDefault();
      // Pick context from the most recently-interacted zone. Falls back to
      // the arrangement when no zone has been touched yet.
      if (SEQ._lastZone === 'roll' && SEQ.pianoRollOpen) prSelectAllNotes();
      else seqSelectAll();
      return;
    }
  }
  if (key === 'delete' || key === 'backspace') {
    if (SEQ.prSelection && SEQ.prSelection.size > 0 && SEQ.pianoRollOpen) {
      e.preventDefault();
      const { track, clip } = focusedClipObjects();
      if (clip) {
        seqCheckpoint();
        clip.notes = clip.notes.filter(n => !SEQ.prSelection.has(n));
        SEQ.prSelection.clear();
        renderPianoRoll();
        if (track) { seqRenderTrack(track); seqResyncTrack(track); }
        seqSave();
      }
      return;
    }
    if (SEQ.selection.length > 0) { e.preventDefault(); seqDeleteSelection(); return; }
  }

  if (key === ' ' && !e.shiftKey) {
    e.preventDefault();
    if (!heldKeys.has(key)) {
      heldKeys.add(key);
      const prBody = document.getElementById('seq-pianoroll-body');
      const wrap   = document.getElementById('seq-lane-wrap');
      if (prBody) { SEQ._prSpaceHeld = true; prBody.classList.add('pr-pan-mode'); }
      if (wrap)   { SEQ._arrSpaceHeld = true; wrap.classList.add('arr-pan-mode'); }
    }
    return;
  }
  if (heldKeys.has(key)) return;
  heldKeys.add(key);
  if (key === ' ' && e.shiftKey) { e.preventDefault(); flashHint('hint-space'); if (SEQ.playing) seqStop(); else seqPlay(); return; }
  if (key === 'p') { e.preventDefault(); flashHint('hint-panic'); panic(); return; }
  if (key === 'arrowleft')  { e.preventDefault(); flashHint('hint-lr'); setKey(state.currentTemplate, (state.keys[state.currentTemplate] + 11) % 12); return; }
  if (key === 'arrowright') { e.preventDefault(); flashHint('hint-lr'); setKey(state.currentTemplate, (state.keys[state.currentTemplate] + 1)  % 12); return; }
  if (key === 'arrowdown')  { e.preventDefault(); flashHint('hint-ud'); state.octave = Math.max(0, state.octave - 1); updateControlDisplays(); rebuildBoard(); return; }
  if (key === 'arrowup')    { e.preventDefault(); flashHint('hint-ud'); state.octave = Math.min(8, state.octave + 1); updateControlDisplays(); rebuildBoard(); return; }
  // Disable pad shortcuts when the Chord Pad section is hidden — no
  // visible pads to trigger.
  if (document.body.classList.contains('hide-chord-pad')) return;
  if (state.currentTemplate === 'scale-chords') {
    const sc = scaleKeymap[key];
    if (sc) { e.preventDefault(); playChord(sc.padId, sc.interval, sc.q); }
    return;
  }
  const found = findChordByKey(key);
  if (found) {
    e.preventDefault();
    if (e.shiftKey && found.chord.ext) {
      const extQ = extQuality(found.chord.q, found.chord.ext);
      if (extQ) { playChord(found.padId, found.chord.interval, extQ); return; }
    }
    playChord(found.padId, found.chord.interval, found.chord.q);
  }
});

document.addEventListener('keyup', (e) => {
  const key = getBaseKey(e);
  heldKeys.delete(key);
  if (key === ' ' && SEQ._prSpaceHeld) {
    SEQ._prSpaceHeld = false;
    document.getElementById('seq-pianoroll-body')?.classList.remove('pr-pan-mode');
  }
  if (key === ' ' && SEQ._arrSpaceHeld) {
    SEQ._arrSpaceHeld = false;
    document.getElementById('seq-lane-wrap')?.classList.remove('arr-pan-mode');
  }
  if (state.currentTemplate === 'scale-chords') {
    const sc = scaleKeymap[key];
    if (sc) releaseChord(sc.padId);
    return;
  }
  const found = findChordByKey(key);
  if (found) releaseChord(found.padId);
});

window.addEventListener('blur', () => { releaseAll(); heldKeys.clear(); });
document.addEventListener('pointerup', () => {
  const el = document.activeElement;
  if (el && el.tagName === 'INPUT' && el.type === 'range') el.blur();
});
document.addEventListener('change', (e) => {
  if (e.target.tagName === 'SELECT') e.target.blur();
});
window.addEventListener('resize', () => { scheduleDraw(); updateNeapolitanSplit(); });
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(scheduleDraw);
}

// ============================================================
// PIANO TOOLTIP
// ============================================================
const pianoTooltipEl = document.getElementById('piano-tooltip');

function currentScaleAbsolute() {
  const tpl = state.currentTemplate;
  const key = state.keys[tpl];
  let intervals;
  if (tpl === 'scale-chords') {
    intervals = SCALE_DEFS[state.scaleType];
  } else if (TEMPLATES[tpl].keyMode === 'harmonic-minor') {
    intervals = SCALE_DEFS['harmonic-minor'];
  } else if (TEMPLATES[tpl].keyMode === 'minor') {
    intervals = SCALE_DEFS['minor'];
  } else {
    intervals = [0, 2, 4, 5, 7, 9, 11];
  }
  return new Set(intervals.map(i => (key + i) % 12));
}

function buildPianoSVG(rootPitch, chordQ, scaleOverride, scale = 1) {
  const W = 22, H = 68, BW = 12, BH = 40, TOP = 14;
  // white key layout: [pitchClass, xLeft]
  const whites = [[0,0],[2,22],[4,44],[5,66],[7,88],[9,110],[11,132]];
  // black key layout: centered on white-key boundaries (22,44,88,110,132)
  const blacks = [[1,16],[3,38],[6,82],[8,104],[10,126]];
  const totalW = 7 * W;
  const totalH = H + TOP;

  const DIM_SCALE = [0, 2, 3, 5, 6, 8, 9, 11]; // whole-half diminished
  const scaleTones = state.showScaleTones
    ? scaleOverride
      ? new Set(scaleOverride.map(i => (rootPitch + i) % 12))
      : chordQ === 'dim7'
        ? new Set(DIM_SCALE.map(i => (rootPitch + i) % 12))
        : currentScaleAbsolute()
    : new Set();
  const chordTones  = new Set(CHORD_INTERVALS[chordQ].map(i => (rootPitch + i) % 12));

  const spelling = buildSpelling(rootPitch, 'major');
  const labelFor = (pc) => {
    if (pc === rootPitch)   return { name: spelling[pc], color: '#ffffff' };
    if (chordTones.has(pc)) return { name: spelling[pc], color: '#ffaa33' };
    return null;
  };

  function dotAttrs(pc, isBlack) {
    if (pc === rootPitch)     return `fill="#ffffff"`;
    if (chordTones.has(pc))   return `fill="#ffaa33"`;
    if (scaleTones.has(pc))   return `fill="#bee067"`;
    return null;
  }

  let s = `<svg width="${Math.round(totalW * scale)}" height="${Math.round(totalH * scale)}" viewBox="0 0 ${totalW} ${totalH}" xmlns="http://www.w3.org/2000/svg" style="display:block">
  <defs><filter id="ds"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000" flood-opacity="0.35"/></filter></defs>`;

  // Note labels above keys (chord tones + root)
  const labelEsc = (n) => n.replace(/♯/g,'&#9839;').replace(/♭/g,'&#9837;');
  whites.forEach(([pc, x]) => {
    const lab = labelFor(pc);
    if (lab) s += `<text x="${x + W/2}" y="${TOP - 4}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" font-weight="600" fill="${lab.color}">${labelEsc(lab.name)}</text>`;
  });
  blacks.forEach(([pc, x]) => {
    const lab = labelFor(pc);
    if (lab) s += `<text x="${x + BW/2}" y="${TOP - 4}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" font-weight="600" fill="${lab.color}">${labelEsc(lab.name)}</text>`;
  });

  // White keys
  whites.forEach(([pc, x]) => {
    s += `<rect x="${x+0.5}" y="${TOP+0.5}" width="${W-1}" height="${H-1}" fill="#f0ece4" rx="2" stroke="#888" stroke-width="0.5"/>`;
  });
  // Black keys
  blacks.forEach(([pc, x]) => {
    s += `<rect x="${x}" y="${TOP}" width="${BW}" height="${BH}" fill="#1a1a1a" rx="2"/>`;
  });
  // Dots on white keys
  whites.forEach(([pc, x]) => {
    const a = dotAttrs(pc, false);
    if (a) s += `<circle cx="${x + W/2}" cy="${TOP + H - 9}" r="4.5" ${a} filter="url(#ds)"/>`;
  });
  // Dots on black keys
  blacks.forEach(([pc, x]) => {
    const a = dotAttrs(pc, true);
    if (a) s += `<circle cx="${x + BW/2}" cy="${TOP + BH - 8}" r="4.5" ${a}/>`;
  });

  s += '</svg>';
  return s;
}

function showPianoTooltip(padEl, rootPitch, chordQ, scaleOverride) {
  if (!state.showPianoHover) return;
  const scale = window.matchMedia('(hover: none)').matches ? 0.5 : 1;
  pianoTooltipEl.innerHTML = buildPianoSVG(rootPitch, chordQ, scaleOverride, scale);
  pianoTooltipEl.style.display = 'block';
  const r  = padEl.getBoundingClientRect();
  const tw = pianoTooltipEl.offsetWidth;
  const th = pianoTooltipEl.offsetHeight;
  let left = r.left + r.width / 2 - tw / 2;
  let top  = r.top - th - 8;
  left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
  if (top < 8) top = r.bottom + 8;
  pianoTooltipEl.style.left = left + 'px';
  pianoTooltipEl.style.top  = top + 'px';
}

function hidePianoTooltip() {
  pianoTooltipEl.style.display = 'none';
}

// ============================================================
// PLAY STYLE — strum + pattern scheduler
// ============================================================
function playStrum(notes, velocity, direction) {
  const ctx = getAudioCtx();
  const spread = 0.022;
  return notes.map((n, i) => {
    const offset = direction === 'down' ? (notes.length - 1 - i) * spread : i * spread;
    return startAudioNote(n, velocity, ctx.currentTime + offset);
  });
}

const PS = {
  timer: null,
  active: new Map(),  // padId → { notes, pattern, step, nextTime }
  LOOKAHEAD: 0.12,
  TICK_MS: 25,
};

function psStepDur() { return 60 / state.tempo / 2; }

function psBuildPattern(style, noteCount) {
  const all = Array.from({ length: noteCount }, (_, i) => i);
  switch (style) {
    case 'arp-up':
      return { steps: Array.from({ length: noteCount }, (_, i) => [i]), dur: 0.85 };
    case 'arp-down':
      return { steps: Array.from({ length: noteCount }, (_, i) => [noteCount - 1 - i]), dur: 0.85 };
    case 'arp-up-down': {
      const up   = Array.from({ length: noteCount }, (_, i) => [i]);
      const down = noteCount > 2 ? Array.from({ length: noteCount - 2 }, (_, i) => [noteCount - 2 - i]) : [];
      return { steps: [...up, ...down], dur: 0.85 };
    }
    case 'beat':    return { steps: [all, null, all, null],               dur: 1.75 };
    case 'offbeat': return { steps: [null, all, null, all],               dur: 1.75 };
    case 'waltz':   return { steps: [all, null, null, all, null, null],   dur: 1.75 };
    default: return null;
  }
}

function psTick() {
  const ctx     = getAudioCtx();
  const now     = ctx.currentTime;
  const horizon = now + PS.LOOKAHEAD;
  const stepDur = psStepDur();
  PS.active.forEach(entry => {
    while (entry.nextTime < horizon) {
      const step    = entry.step % entry.pattern.steps.length;
      const indices = entry.pattern.steps[step];
      if (indices !== null) {
        const dur = stepDur * entry.pattern.dur;
        indices.forEach(idx => {
          if (idx < entry.notes.length)
            startAudioNote(entry.notes[idx], state.velocity, entry.nextTime, dur);
        });
      }
      entry.step++;
      entry.nextTime += stepDur;
    }
  });
}

function psStart(padId, notes) {
  const pattern = psBuildPattern(state.playStyle, notes.length);
  if (!pattern) return false;
  const ctx = getAudioCtx();
  PS.active.set(padId, { notes, pattern, step: 0, nextTime: ctx.currentTime });
  if (!PS.timer) PS.timer = setInterval(psTick, PS.TICK_MS);
  return true;
}

function psStop(padId) {
  PS.active.delete(padId);
  if (PS.active.size === 0 && PS.timer) { clearInterval(PS.timer); PS.timer = null; }
}

// ============================================================
// CHORD SEQUENCER
// ============================================================
let BEAT_PX = 30; // pixels per beat (arrangement)
let PR_BEAT_PX = 30; // pixels per beat (piano roll — independent zoom)

// ============================================================
// SEQUENCER DATA MODEL
// ============================================================
// One ordered list of tracks. Each track is fully independent: own kind,
// items, playback state, instrument, channel, volume, mute/solo, synth.
//
//   kind === 'chord'  — items[] are chord blocks      ({interval, q, …})
//   kind === 'free'   — items[] are CLIPS, each clip
//                       holds its own notes:
//                         { id, start, beats, notes:[{midi,start,beats}], label? }
//                       Chord-pads cannot be dropped on a free lane —
//                       they go to chord-tracks or into an open piano-roll.
//
// Legacy getters (SEQ.items, SEQ.midiItems, SEQ.pendingIdx, …) proxy the
// FIRST track of each kind so existing code keeps working while we
// migrate. New code should reach into `track.items`, `track.pendingIdx`,
// etc. directly via the helpers below.

const INSTRUMENT_OPTIONS = [
  ['synth', 'Synth'], ['piano', 'Piano'], ['epiano', 'E-Piano'], ['epiano2', 'E-Piano 2'],
  ['organ', 'Organ'], ['strings', 'Strings'], ['choir', 'Choir'], ['vibes', 'Vibes'], ['pad', 'Pad'],
];

let _trackIdCounter = 0;
function newTrackId() { return 'tr-' + (++_trackIdCounter); }

let _clipIdCounter = 0;
function newClipId() { return 'cl-' + (++_clipIdCounter); }

// A clip on a free track. notes have RELATIVE starts (within the clip).
function makeClip({ id, start = 0, beats = 1, notes = [], label = null } = {}) {
  return { id: id || newClipId(), start, beats, notes, label };
}

// Wrap a single legacy note ({midi, label, beats, start}) into a 1-note clip.
function clipFromLegacyNote(item) {
  return makeClip({
    start: item.start,
    beats: item.beats,
    label: item.label || null,
    notes: [{ midi: item.midi, label: item.label, start: 0, beats: item.beats }],
  });
}

function makeTrack(opts = {}) {
  return {
    id:         opts.id || newTrackId(),
    kind:       opts.kind || 'free',
    name:       opts.name || (opts.kind === 'chord' ? 'Chords' : 'Free'),
    instrument: opts.instrument ?? 'epiano',
    channel:    opts.channel ?? 0,
    // 'instrument' = play in-app via SF2/synth; 'midi' = send to MIDI output.
    output:     opts.output === 'midi' ? 'midi' : 'instrument',
    // MIDI output port id (Web MIDI device id). Empty = use global default.
    midiPortId:   opts.midiPortId   || '',
    // MIDI input port id — when set, incoming notes on that port (matching
    // track.channel, or any channel if track.channel < 0) play through the
    // track's instrument live. Empty = no input.
    midiInPortId: opts.midiInPortId || '',
    volume:     opts.volume ?? 1.0,
    muted:      !!opts.muted,
    soloed:     !!opts.soloed,
    synth:      opts.synth || null, // null = link to chord-pad voice (state.synth)
    items:      Array.isArray(opts.items) ? opts.items : [],
    // Per-track playback / drag state
    pendingIdx: 0, pendingTime: 0, cycleStart: 0,
    activeIdx: -1, dragSrcIdx: null, dropTarget: null,
  };
}

const SEQ = {
  tracksList: [],

  // Default visual-cursor offset (ms). 75ms is roughly right for typical
  // Windows Web Audio output buffers; users on lower-latency setups can
  // tune it down via Settings → Cursor offset.
  visualLatencyMs: 75,

  rollTool: 'none',
  rollSnap: true,
  rollSnapVal: 1,
  rollKeyboard: false,
  playing: false,
  playStartTime: 0,
  rafId: null,
  pendingTimers: new Set(),
  activeNodes: new Set(),
  nowChord: '',
  nowNote: '',
  timer: null,
  TICK_MS: 25,
  LOOKAHEAD: 0.15,
  loopStart: 0,
  loopEnd: 4,
  loop: false,
  animBeat: 0, animLastTime: 0, animLoopLen: 4, animLoopStart: 0,
  _dragLabel: '', _dragChord: null, _dragHoverId: null,
  _undoStack: [], _redoStack: [],
  selection: [], // [{ trackId, item }]
  clipboard: null,
};
// Play cursor (set by ruler clicks). Always starts at beat 0 on page load
// so a fresh session begins playback from the very start of the timeline.
SEQ.startBeat = 0;
SEQ.animBeat  = 0;

// Start with no tracks — user adds what they need via "+ Add Track".

function trackById(id)            { return SEQ.tracksList.find(t => t.id === id); }
function firstTrackOfKind(kind)   { return SEQ.tracksList.find(t => t.kind === kind); }
function tracksOfKind(kind)       { return SEQ.tracksList.filter(t => t.kind === kind); }

function addTrack(kind, opts)     { const t = makeTrack({ ...(opts||{}), kind }); SEQ.tracksList.push(t); return t; }
function removeTrackById(id) {
  const idx = SEQ.tracksList.findIndex(t => t.id === id);
  if (idx >= 0) SEQ.tracksList.splice(idx, 1);
}

// ----- Legacy property aliases ---------------------------------------
// Keep the bulk of the existing code working until it's migrated.
// Returned when there's no track of the requested kind. NOT frozen so
// stray `.push()` calls from legacy paths don't throw — they just write
// to a throwaway array (silently lost). Critical push sites (recording,
// chord drop) should call ensureTrackOfKind() first.
const _STRAY_ITEMS = { chord: [], free: [] };
function _bindArrAlias(propName, kind) {
  Object.defineProperty(SEQ, propName, {
    get() {
      const t = firstTrackOfKind(kind);
      if (t) return t.items;
      // reset the stray bucket every read so it can't grow indefinitely
      _STRAY_ITEMS[kind] = [];
      return _STRAY_ITEMS[kind];
    },
    set(v) { const t = firstTrackOfKind(kind); if (t) t.items = v; },
  });
}

// Ensure a track of the given kind exists; create one (with sidebar +
// lane DOM) if not. Returns the (first) matching track.
function ensureTrackOfKind(kind) {
  let t = firstTrackOfKind(kind);
  if (t) return t;
  t = addTrack(kind, { name: kind === 'chord' ? 'Chords' : 'Notes' });
  if (!t.synth && kind !== 'chord') t.synth = { ...state.synth };
  rebuildTracksUI();
  seqRenderAll();
  return t;
}
function _bindFieldAlias(propName, kind, field, defVal) {
  Object.defineProperty(SEQ, propName, {
    get() { return firstTrackOfKind(kind)?.[field] ?? defVal; },
    set(v) { const t = firstTrackOfKind(kind); if (t) t[field] = v; },
  });
}
_bindArrAlias('items',     'chord');
_bindArrAlias('midiItems', 'free');
// Melody track is gone — old code paths that push/sort/splice on noteItems
// (drag-from-keyboard, MIDI recording, etc.) now operate on the FIRST free
// track. This collapses melody into free as the user requested.
_bindArrAlias('noteItems', 'free');

_bindFieldAlias('pendingIdx',     'chord', 'pendingIdx',  0);
_bindFieldAlias('pendingTime',    'chord', 'pendingTime', 0);
_bindFieldAlias('cycleStart',     'chord', 'cycleStart',  0);
_bindFieldAlias('activeIdx',      'chord', 'activeIdx',  -1);
_bindFieldAlias('dragSrcIdx',     'chord', 'dragSrcIdx', null);
_bindFieldAlias('dropTarget',     'chord', 'dropTarget', null);

_bindFieldAlias('midiPendingIdx',  'free', 'pendingIdx',  0);
_bindFieldAlias('midiPendingTime', 'free', 'pendingTime', 0);
_bindFieldAlias('midiCycleStart',  'free', 'cycleStart',  0);
_bindFieldAlias('midiActiveIdx',   'free', 'activeIdx',  -1);
_bindFieldAlias('midiDragSrcIdx',  'free', 'dragSrcIdx', null);
_bindFieldAlias('midiDropTarget',  'free', 'dropTarget', null);

// Melody-related legacy fields: no-op
for (const f of ['notePendingIdx', 'notePendingTime', 'noteCycleStart', 'noteActiveIdx', 'noteDragSrcIdx', 'noteDropTarget']) {
  Object.defineProperty(SEQ, f, { get: () => (f.endsWith('Time') ? Infinity : (f.endsWith('Idx') ? 0 : null)), set: () => {} });
}

// Legacy SEQ.tracks {chords, melody, free} → live mapping to first-of-kind
Object.defineProperty(SEQ, 'tracks', {
  get() {
    // Returned object's properties read/write through to the actual tracks
    // so existing `SEQ.tracks.chords.volume = 0.5` style assignments work.
    return {
      get chords() { return firstTrackOfKind('chord') || {}; },
      get free()   { return firstTrackOfKind('free')   || {}; },
      get melody() { return _DEAD_TRACK; },
    };
  },
});
const _DEAD_TRACK = { instrument: 'epiano', channel: 0, volume: 1.0, muted: false, soloed: false, synth: null };

// ---------- Undo / Redo ----------
const SEQ_UNDO_LIMIT = 60;
function seqSnapshot() {
  return JSON.stringify({
    tracksList: SEQ.tracksList.map(t => ({
      id: t.id, kind: t.kind, name: t.name,
      instrument: t.instrument, channel: t.channel, volume: t.volume, output: t.output, midiPortId: t.midiPortId, midiInPortId: t.midiInPortId,
      muted: t.muted, soloed: t.soloed, synth: t.synth,
      items: t.items,
    })),
    loopStart: SEQ.loopStart, loopEnd: SEQ.loopEnd, loop: SEQ.loop,
  });
}
function seqCheckpoint() {
  const snap = seqSnapshot();
  const stack = SEQ._undoStack;
  if (stack.length > 0 && stack[stack.length - 1] === snap) return;
  stack.push(snap);
  if (stack.length > SEQ_UNDO_LIMIT) stack.shift();
  SEQ._redoStack.length = 0;
}
function seqApplySnapshot(json) {
  try {
    const d = JSON.parse(json);
    if (Array.isArray(d.tracksList)) {
      SEQ.tracksList.length = 0;
      for (const tIn of d.tracksList) {
        SEQ.tracksList.push(makeTrack({
          id: tIn.id, kind: tIn.kind || 'free', name: tIn.name,
          instrument: tIn.instrument, channel: tIn.channel, volume: tIn.volume, output: tIn.output, midiPortId: tIn.midiPortId, midiInPortId: tIn.midiInPortId,
          muted: tIn.muted, soloed: tIn.soloed, synth: tIn.synth,
          items: tIn.items || [],
        }));
      }
    } else {
      // Legacy snapshot shape
      const chord = firstTrackOfKind('chord');
      const free  = firstTrackOfKind('free');
      if (chord) chord.items = d.items     || [];
      if (free)  free.items  = [...(d.midiItems || []), ...(d.noteItems || [])];
    }
    if (typeof d.loopStart === 'number') SEQ.loopStart = d.loopStart;
    if (typeof d.loopEnd   === 'number') SEQ.loopEnd   = d.loopEnd;
    if (typeof d.loop      === 'boolean') SEQ.loop     = d.loop;
    SEQ.selection = []; // identity broken on parse
    rebuildTracksUI();
    seqRenderAll();
  } catch (_) {}
}
function seqUndo() {
  if (SEQ._undoStack.length === 0) return;
  SEQ._redoStack.push(seqSnapshot());
  seqApplySnapshot(SEQ._undoStack.pop());
}
function seqRedo() {
  if (SEQ._redoStack.length === 0) return;
  SEQ._undoStack.push(seqSnapshot());
  seqApplySnapshot(SEQ._redoStack.pop());
}

// ---------- Selection / clipboard ----------
// Selection model — entries are { trackId, item }. Legacy string forms
// ('chords' | 'free' | 'melody') still resolve via trackByRef().
function trackByRef(ref) {
  if (!ref) return null;
  if (typeof ref === 'object' && ref.kind) return ref;
  if (ref === 'chords') return firstTrackOfKind('chord');
  if (ref === 'free')   return firstTrackOfKind('free');
  if (ref === 'melody') return null;
  return trackById(ref);
}
function seqTrackItems(ref) {
  const t = trackByRef(ref);
  return t ? t.items : [];
}
function _selKey(sel) { return sel.trackId || sel.track; } // legacy compat
function seqIsSelected(ref, item) {
  const key = (typeof ref === 'string' ? ref : ref?.id);
  return SEQ.selection.some(s => _selKey(s) === key && s.item === item);
}
function seqSelectionToggle(ref, item, additive) {
  const t = trackByRef(ref);
  if (!t) return;
  if (!additive) SEQ.selection = [];
  const i = SEQ.selection.findIndex(s => _selKey(s) === t.id && s.item === item);
  if (i >= 0) SEQ.selection.splice(i, 1);
  else SEQ.selection.push({ trackId: t.id, item });
  seqRefreshSelectionVisuals();
}
function seqClearSelection() {
  if (SEQ.selection.length === 0) return;
  SEQ.selection = [];
  seqRefreshSelectionVisuals();
}
function seqRefreshSelectionVisuals() {
  document.querySelectorAll('.seq-lane .seq-block, .seq-lane .roll-note')
    .forEach(el => el.classList.remove('selected'));
  for (const sel of SEQ.selection) {
    const t = trackByRef(_selKey(sel));
    if (!t) continue;
    const idx = t.items.indexOf(sel.item);
    if (idx < 0) continue;
    const lane = document.querySelector(`.seq-lane[data-track-id="${t.id}"]`);
    if (!lane) continue;
    const blocks = lane.querySelectorAll('.seq-block, .roll-note');
    if (blocks[idx]) blocks[idx].classList.add('selected');
  }
}
function seqSelectAll() {
  SEQ.selection = [];
  for (const t of SEQ.tracksList) {
    for (const it of t.items) SEQ.selection.push({ trackId: t.id, item: it });
  }
  seqRefreshSelectionVisuals();
}
function seqDeleteSelection() {
  if (SEQ.selection.length === 0) return;
  seqCheckpoint();
  for (const sel of SEQ.selection) {
    const t = trackByRef(_selKey(sel));
    if (!t) continue;
    const i = t.items.indexOf(sel.item);
    if (i >= 0) t.items.splice(i, 1);
  }
  SEQ.selection = [];
  seqRenderAll();
}
function seqCopySelection() {
  if (SEQ.selection.length === 0) return;
  const minStart = Math.min(...SEQ.selection.map(s => s.item.start));
  SEQ.clipboard = {
    items: SEQ.selection.map(s => ({
      trackId: _selKey(s),
      data:    JSON.parse(JSON.stringify(s.item)),
      relStart: s.item.start - minStart,
    })),
  };
}
function seqCutSelection() {
  if (SEQ.selection.length === 0) return;
  seqCopySelection();
  seqDeleteSelection();
}
function seqPasteSelection() {
  if (!SEQ.clipboard || SEQ.clipboard.items.length === 0) return;
  seqCheckpoint();
  // Paste at the play cursor when set, otherwise at the end of the loop.
  const baseBeat = (typeof SEQ.startBeat === 'number') ? SEQ.startBeat : SEQ.loopEnd;
  const newSelection = [];
  let maxEnd = baseBeat;
  for (const e of SEQ.clipboard.items) {
    const t = trackByRef(e.trackId);
    if (!t) continue;
    const newItem = { ...e.data, id: undefined, start: e.relStart + baseBeat };
    if (Array.isArray(newItem.notes)) newItem.notes = newItem.notes.map(n => ({ ...n }));
    if (!newItem.id) newItem.id = newClipId();
    t.items.push(newItem);
    newSelection.push({ trackId: t.id, item: newItem });
    maxEnd = Math.max(maxEnd, newItem.start + (newItem.beats || 1));
  }
  for (const t of SEQ.tracksList) t.items.sort((a, b) => a.start - b.start);
  SEQ.selection = newSelection;
  seqAutoExtendLoop(maxEnd);
  seqRenderAll();
}

// Duplicate selection in place: each selected clip is cloned, with the
// copy starting right after the original ends.
function seqDuplicateSelection() {
  if (SEQ.selection.length === 0) return;
  seqCheckpoint();
  const newSelection = [];
  let maxEnd = 0;
  for (const sel of SEQ.selection) {
    const t = trackByRef(_selKey(sel));
    if (!t) continue;
    const src = sel.item;
    const beats = src.beats || 1;
    const copy = JSON.parse(JSON.stringify(src));
    copy.id = newClipId();
    copy.start = src.start + beats;
    if (Array.isArray(copy.notes)) copy.notes = copy.notes.map(n => ({ ...n }));
    t.items.push(copy);
    newSelection.push({ trackId: t.id, item: copy });
    maxEnd = Math.max(maxEnd, copy.start + beats);
  }
  for (const t of SEQ.tracksList) t.items.sort((a, b) => a.start - b.start);
  SEQ.selection = newSelection;
  seqAutoExtendLoop(maxEnd);
  seqRenderAll();
}

// ---- Piano-roll note clipboard --------------------------------------------
// Mirrors the clip-level copy/cut/paste/duplicate semantics but operates on
// note objects within the currently-focused clip.
SEQ.prClipboard = null;
function prRollHasNoteSelection() {
  return SEQ.pianoRollOpen && SEQ.prSelection && SEQ.prSelection.size > 0;
}
function prCopyNotes() {
  if (!prRollHasNoteSelection()) return;
  const { clip } = focusedClipObjects();
  if (!clip) return;
  const notes = clip.notes.filter(n => SEQ.prSelection.has(n));
  if (notes.length === 0) return;
  const minStart = Math.min(...notes.map(n => n.start));
  SEQ.prClipboard = {
    items: notes.map(n => ({
      relStart: n.start - minStart,
      midi:     n.midi,
      beats:    n.beats,
    })),
  };
}
function prCutNotes() {
  if (!prRollHasNoteSelection()) return;
  prCopyNotes();
  const { track, clip } = focusedClipObjects();
  if (!clip) return;
  seqCheckpoint();
  clip.notes = clip.notes.filter(n => !SEQ.prSelection.has(n));
  SEQ.prSelection.clear();
  renderPianoRoll();
  if (track) { seqRenderTrack(track); seqResyncTrack(track); }
  seqSave();
}
function prPasteNotes() {
  if (!SEQ.prClipboard || SEQ.prClipboard.items.length === 0) return;
  const { track, clip } = focusedClipObjects();
  if (!clip) return;
  seqCheckpoint();
  // Paste at play-cursor if it falls inside the clip's range, else at beat 0
  // of the clip. Pitch is preserved as-is from the clipboard.
  let baseBeat = 0;
  if (typeof SEQ.startBeat === 'number' && SEQ.startBeat >= clip.start) {
    baseBeat = SEQ.startBeat - clip.start;
  }
  const newNotes = SEQ.prClipboard.items.map(it => ({
    start: baseBeat + it.relStart,
    midi:  Math.max(0, Math.min(127, it.midi)),
    beats: it.beats,
    label: midiNoteLabel(it.midi),
  }));
  for (const n of newNotes) clip.notes.push(n);
  clip.notes.sort((a, b) => a.start - b.start);
  // Auto-extend clip if pasted notes exceed its length.
  const maxEnd = Math.max(...newNotes.map(n => n.start + n.beats));
  if (maxEnd > clip.beats) clip.beats = maxEnd;
  seqAutoExtendLoop(clip.start + clip.beats);
  SEQ.prSelection.clear();
  newNotes.forEach(n => SEQ.prSelection.add(n));
  renderPianoRoll();
  if (track) { seqRenderTrack(track); seqResyncTrack(track); }
  seqSave();
}
function prDuplicateNotes() {
  if (!prRollHasNoteSelection()) return;
  const { track, clip } = focusedClipObjects();
  if (!clip) return;
  seqCheckpoint();
  const sel = clip.notes.filter(n => SEQ.prSelection.has(n));
  if (sel.length === 0) return;
  const maxEnd = Math.max(...sel.map(n => n.start + n.beats));
  const minStart = Math.min(...sel.map(n => n.start));
  const shift = maxEnd - minStart;
  const clones = sel.map(n => ({
    start: n.start + shift,
    midi:  n.midi,
    beats: n.beats,
    label: n.label,
  }));
  for (const c of clones) clip.notes.push(c);
  clip.notes.sort((a, b) => a.start - b.start);
  const newMax = Math.max(...clones.map(c => c.start + c.beats));
  if (newMax > clip.beats) clip.beats = newMax;
  seqAutoExtendLoop(clip.start + clip.beats);
  SEQ.prSelection.clear();
  clones.forEach(c => SEQ.prSelection.add(c));
  renderPianoRoll();
  if (track) { seqRenderTrack(track); seqResyncTrack(track); }
  seqSave();
}
function prSelectAllNotes() {
  const { clip } = focusedClipObjects();
  if (!clip) return;
  SEQ.prSelection.clear();
  clip.notes.forEach(n => SEQ.prSelection.add(n));
  renderPianoRoll();
}

// Run a function with state.synth temporarily swapped to a per-track config.
// All audio-trigger functions (startAudioNote / startSampleNote /
// startSf2Voice / startBassNote) read state.synth synchronously when they
// schedule their gain / LFO / filter values, so a swap-around-the-call works.
function withSynth(synth, fn) {
  if (!synth) return fn();
  const prev = state.synth;
  state.synth = synth;
  try { return fn(); } finally { state.synth = prev; }
}

// Resolve a track from a legacy kind string (or already a track object).
//   'chords' → first chord track
//   'free'   → first free track
//   'melody' → null (track kind removed)
//   <object> → as-is
function resolveTrack(ref) {
  if (!ref) return null;
  if (typeof ref === 'object') return ref;
  if (ref === 'chords') return firstTrackOfKind('chord');
  if (ref === 'free')   return firstTrackOfKind('free');
  if (ref === 'melody') return null;
  return trackById(ref);
}

// The default (first) Chord track shares its voice with the chord-pad —
// they're the same instrument. Additional tracks have their own
// independent synth + instrument config.
function seqTrackSynth(ref) {
  const t = resolveTrack(ref);
  if (!t) return state.synth;
  return t.synth || state.synth;
}
function seqTrackInstrument(ref) {
  const t = resolveTrack(ref);
  if (!t) return state.instrument;
  return t.instrument;
}

function seqTrackAudible(ref) {
  const t = resolveTrack(ref);
  if (!t) return true;
  const anySolo = SEQ.tracksList.some(tr => tr.soloed);
  if (anySolo) return t.soloed;
  return !t.muted;
}
function seqTrackVel(ref, base) {
  const t = resolveTrack(ref);
  if (!t) return base;
  return Math.max(1, Math.min(127, Math.round(base * t.volume)));
}
// Stub — kept so the (now no-op) call sites don't throw if invoked.
function sendTrackChannelVolume() {}

function seqBeatDur() {
  // tempo = BPM of a *quarter* note. In time signatures with eighth-note
  // beats (currently just 6/8 in our options list) each beat is half as
  // long. The dropdown stores only the numerator on state.beatsPerBar; 6
  // uniquely identifies 6/8 in our supported set.
  const eighthBeat = state.beatsPerBar === 6;
  return (eighthBeat ? 30 : 60) / state.tempo;
}

function seqTimeout(fn, delay) {
  const id = setTimeout(() => { SEQ.pendingTimers.delete(id); fn(); }, delay);
  SEQ.pendingTimers.add(id);
}

function seqUpdateNowPlaying() {
  const el = document.getElementById('now-playing-notes');
  if (!el) return;
  const parts = [];
  if (SEQ.nowChord) parts.push(SEQ.nowChord);
  if (SEQ.nowNote)  parts.push('♩ ' + SEQ.nowNote);
  el.textContent = parts.join('  ·  ') || '—';
}

function seqAnimatePlayhead() {
  if (!SEQ.playing) return;
  const ctx     = getAudioCtx();
  // Compensate for the audio output latency so the visual playhead matches
  // what you actually hear, not what was just scheduled.
  // - ctx.outputLatency: total render+output latency (Chrome reports it).
  // - ctx.baseLatency:   fallback for browsers without outputLatency.
  // - SEQ.visualLatencyMs: manual user fudge (set via DevTools) for drivers
  //   that under-report — e.g. `SEQ.visualLatencyMs = 30` shifts visual 30ms.
  const lat = (ctx.outputLatency ?? ctx.baseLatency ?? 0) + (SEQ.visualLatencyMs || 0) / 1000;
  const now = ctx.currentTime - lat;
  const rawDt  = now - SEQ.animLastTime;
  const dt     = rawDt > 0 ? Math.min(rawDt, seqBeatDur() * SEQ.animLoopLen) : 0;
  if (rawDt > 0) SEQ.animLastTime = now;
  let px;
  if (SEQ.loop) {
    SEQ.animBeat += dt / seqBeatDur();
    const L = SEQ.animLoopLen;
    const pos = ((SEQ.animBeat - SEQ.animLoopStart) % L + L) % L;
    SEQ.animBeat = SEQ.animLoopStart + pos;
    px = SEQ.animBeat * BEAT_PX;
  } else {
    if (dt > 0) SEQ.animBeat += dt / seqBeatDur();
    px = SEQ.animBeat * BEAT_PX;
    const minW = px + 64;
    const cLane = document.getElementById('seq-lane');
    const nLane = document.getElementById('seq-note-lane');
    const mLane = document.getElementById('seq-midi-lane');
    if (cLane && parseFloat(cLane.style.minWidth || 0) < minW) cLane.style.minWidth = minW + 'px';
    if (nLane && parseFloat(nLane.style.minWidth || 0) < minW) nLane.style.minWidth = minW + 'px';
    if (mLane && parseFloat(mLane.style.minWidth || 0) < minW) mLane.style.minWidth = minW + 'px';
    const wrap = document.getElementById('seq-lane-wrap');
    if (wrap) {
      wrap.scrollLeft = Math.max(0, px - wrap.clientWidth * 0.75);
    }
  }
  document.querySelectorAll('.seq-playhead').forEach(ph => { ph.style.left = px + 'px'; });

  // Piano-roll playhead is clip-relative: only shown when the playhead is
  // inside the focused clip's time range, and positioned at (beat - clip.start).
  const prBody = document.getElementById('seq-pianoroll-body');
  if (prBody && SEQ.pianoRollOpen) {
    const prPh = prBody.querySelector('.seq-playhead');
    if (prPh) {
      const { clip } = focusedClipObjects();
      if (clip && SEQ.animBeat >= clip.start && SEQ.animBeat < clip.start + clip.beats) {
        prPh.style.display = 'block';
        prPh.style.left    = ((SEQ.animBeat - clip.start) * PR_BEAT_PX + prKbW()) + 'px';
        prPh.style.top     = prBody.scrollTop + 'px';
        prPh.style.height  = prBody.clientHeight + 'px';
        prPh.style.bottom  = 'auto';
      } else {
        prPh.style.display = 'none';
      }
    }
  }
  // Keep roll-mode playhead pinned to visible viewport (absolute child scrolls with content)
  {
    const mLane = document.getElementById('seq-midi-lane');
    if (mLane) {
      const mPh = mLane.querySelector('.seq-playhead');
      if (mPh) {
        const st = mLane.scrollTop;
        mPh.style.top = (st - 7) + 'px';
        mPh.style.bottom = 'auto';
        mPh.style.height = (mLane.clientHeight + 14) + 'px';
      }
      // Highlight rows for notes active at current beat
      const beat = SEQ.animBeat;
      const activeMidi = new Set(
        SEQ.midiItems.filter(it => beat >= it.start && beat < it.start + it.beats).map(it => it.midi)
      );
      mLane.querySelectorAll('.roll-row').forEach(row => {
        row.classList.toggle('roll-row-active', activeMidi.has(+row.dataset.midi));
      });
    }
  }
  SEQ.rafId = requestAnimationFrame(seqAnimatePlayhead);
}

function seqTotalDur() {
  return (SEQ.loopEnd - SEQ.loopStart) * seqBeatDur();
}

function seqResyncAnimLoop() {
  const newLen   = SEQ.loopEnd - SEQ.loopStart;
  const newStart = SEQ.loopStart;
  if (newLen !== SEQ.animLoopLen || newStart !== SEQ.animLoopStart) {
    const pos = ((SEQ.animBeat - newStart) % newLen + newLen) % newLen;
    SEQ.animBeat = newStart + pos;
    SEQ.animLoopLen   = newLen;
    SEQ.animLoopStart = newStart;
  }
}

function seqLoopOffset() { return SEQ.loop ? SEQ.loopStart : 0; }
function seqItemInRange(item) { return !SEQ.loop || (item.start >= SEQ.loopStart && item.start < SEQ.loopEnd); }
function seqFindNextInRange(items, fromIdx) {
  if (!SEQ.loop) return fromIdx < items.length ? fromIdx : -1;
  for (let i = fromIdx; i < items.length; i++) {
    if (items[i].start >= SEQ.loopStart && items[i].start < SEQ.loopEnd) return i;
  }
  return -1;
}

function seqLaneWidth(items) {
  const blockEnd = items.reduce((m, x) => Math.max(m, x.start + x.beats), 0);
  return Math.max(blockEnd, SEQ.loopEnd, 4) * BEAT_PX + 64;
}

function seqAutoExtendLoop(blockEnd) {
  if (blockEnd > SEQ.loopEnd) {
    SEQ.loopEnd = blockEnd;
    seqUpdateLoopEnd();
  }
}

function seqUpdateLoopVisible() {
  // Keep loop markers & shading in the DOM regardless of SEQ.loop, and let
  // CSS dim them via a body-level class when loop is disabled.
  document.getElementById('seq-loop-end')?.style.removeProperty('display');
  document.getElementById('seq-loop-start')?.style.removeProperty('display');
  document.querySelectorAll('.seq-loop-line, .seq-loop-start-line').forEach(l => l.style.removeProperty('display'));
  document.body.classList.toggle('loop-disabled', !SEQ.loop);
}

function seqUpdateLoopEnd() {
  const px = SEQ.loopEnd * BEAT_PX;
  document.querySelectorAll('.seq-loop-end').forEach(h => { h.style.left = px + 'px'; });
  document.querySelectorAll('.seq-loop-line').forEach(l => { l.style.left = px + 'px'; });
  const cLane = document.getElementById('seq-lane');
  const nLane = document.getElementById('seq-note-lane');
  const mLane = document.getElementById('seq-midi-lane');
  if (cLane && SEQ.items.length > 0) cLane.style.minWidth = seqLaneWidth(SEQ.items) + 'px';
  if (nLane && SEQ.noteItems.length > 0) nLane.style.minWidth = seqLaneWidth(SEQ.noteItems) + 'px';
  if (mLane && SEQ.midiItems.length > 0) mLane.style.minWidth = seqLaneWidth(SEQ.midiItems) + 'px';
  seqUpdateLoopVisible();
}

function seqUpdateLoopStart() {
  const px = SEQ.loopStart * BEAT_PX;
  document.querySelectorAll('.seq-loop-start').forEach(h => { h.style.left = Math.max(0, px - 11) + 'px'; });
  document.querySelectorAll('.seq-loop-start-line').forEach(l => { l.style.left = px + 'px'; });
  seqUpdateLoopVisible();
}

function seqMakeBlock(item, idx, isNote, isMidi = false) {
  const activeIdx = isMidi ? SEQ.midiActiveIdx : isNote ? SEQ.noteActiveIdx : SEQ.activeIdx;
  const block = document.createElement('div');
  block.className = 'seq-block' + (isMidi ? ' seq-midi-block' : isNote ? ' seq-note-block' : '') + (idx === activeIdx ? ' active' : '');
  block.dataset.idx = idx;
  block.style.left  = (item.start * BEAT_PX) + 'px';
  block.style.width = (item.beats * BEAT_PX) + 'px';

  const name = document.createElement('span');
  name.className = 'seq-block-name';
  name.innerHTML = item.label;
  block.appendChild(name);

  const ticks = document.createElement('div');
  ticks.className = 'seq-block-ticks';
  const refreshTicks = (beats) => {
    ticks.innerHTML = '';
    for (let i = 1; i < beats; i++) {
      const tk = document.createElement('span');
      tk.className = 'seq-tick';
      tk.style.left = ((i / beats) * 100) + '%';
      ticks.appendChild(tk);
    }
  };
  refreshTicks(item.beats);
  block.appendChild(ticks);

  // LEFT resize handle for chord/note blocks — moves item.start while
  // keeping the right edge anchored (so the absolute end position stays
  // the same). Cannot shrink below `snap` beats or push start negative.
  const resizeL = document.createElement('div');
  resizeL.className = 'seq-resize seq-resize-left';
  resizeL.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); e.preventDefault();
    seqCheckpoint();
    resizeL.setPointerCapture(e.pointerId);
    const startX = e.clientX, startStart = item.start, startBts = item.beats;
    const snap = SEQ.arrSnap ? SEQ.arrSnapVal : 0.5;
    const laneL = block.parentElement;
    const ownerL =
      (laneL && laneL.dataset && laneL.dataset.trackId && trackById(laneL.dataset.trackId)) ||
      (isMidi ? firstTrackOfKind('free') : isNote ? null : firstTrackOfKind('chord'));
    const itemsL = ownerL ? ownerL.items : (isMidi ? SEQ.midiItems : isNote ? SEQ.noteItems : SEQ.items);
    const onMove = (ev) => {
      const dxBeats = (ev.clientX - startX) / BEAT_PX;
      const maxDelta = startBts - snap;
      const delta = Math.max(-startStart, Math.min(maxDelta, dxBeats));
      item.start = startStart + delta;
      item.beats = startBts - delta;
      block.style.left  = (item.start * BEAT_PX) + 'px';
      block.style.width = (item.beats * BEAT_PX) + 'px';
      refreshTicks(Math.round(item.beats));
      if (laneL) laneL.style.minWidth = seqLaneWidth(itemsL) + 'px';
    };
    const onUp = () => {
      resizeL.removeEventListener('pointermove', onMove);
      resizeL.removeEventListener('pointerup', onUp);
      const snapped = Math.max(0, Math.round(item.start / snap) * snap);
      const delta = snapped - item.start;
      item.start = snapped;
      item.beats = Math.max(snap, item.beats - delta);
      seqAutoExtendLoop(item.start + item.beats);
      if (ownerL) seqRenderTrack(ownerL);
      else if (isMidi) seqRenderMidi(); else if (isNote) seqRenderNotes(); else seqRender();
    };
    resizeL.addEventListener('pointermove', onMove);
    resizeL.addEventListener('pointerup', onUp);
  });
  block.appendChild(resizeL);

  const resize = document.createElement('div');
  resize.className = 'seq-resize';
  resize.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); e.preventDefault();
    seqCheckpoint();
    resize.setPointerCapture(e.pointerId);
    const startX = e.clientX, startBts = item.beats;
    const snap = 0.5;
    const lane = block.parentElement;
    const ownerResize =
      (lane && lane.dataset && lane.dataset.trackId && trackById(lane.dataset.trackId)) ||
      (isMidi ? firstTrackOfKind('free') : isNote ? null : firstTrackOfKind('chord'));
    const items = ownerResize ? ownerResize.items : (isMidi ? SEQ.midiItems : isNote ? SEQ.noteItems : SEQ.items);
    const onMove = (ev) => {
      item.beats = Math.max(snap, startBts + (ev.clientX - startX) / BEAT_PX);
      block.style.width = (item.beats * BEAT_PX) + 'px';
      refreshTicks(Math.round(item.beats));
      if (lane) lane.style.minWidth = seqLaneWidth(items) + 'px';
      seqAutoExtendLoop(item.start + item.beats);
    };
    const onUp = () => {
      resize.removeEventListener('pointermove', onMove);
      resize.removeEventListener('pointerup', onUp);
      item.beats = Math.max(snap, Math.round(item.beats / snap) * snap);
      block.style.width = (item.beats * BEAT_PX) + 'px';
      refreshTicks(item.beats);
      seqAutoExtendLoop(item.start + item.beats);
      seqSave();
    };
    resize.addEventListener('pointermove', onMove);
    resize.addEventListener('pointerup', onUp);
  });
  block.appendChild(resize);

  // Move by drag
  block.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.seq-resize') || e.target.closest('.seq-delete')) return;
    if (SEQ.arrTool === 'pan' || SEQ._arrSpaceHeld) return;
    if (SEQ.arrTool === 'erase') {
      e.preventDefault();
      seqCheckpoint();
      const lane2 = block.parentElement;
      const ot2 = (lane2 && lane2.dataset && lane2.dataset.trackId && trackById(lane2.dataset.trackId)) ||
                  (isMidi ? firstTrackOfKind('free') : isNote ? null : firstTrackOfKind('chord'));
      const items2 = ot2 ? ot2.items : (isMidi ? SEQ.midiItems : isNote ? SEQ.noteItems : SEQ.items);
      const i = items2.indexOf(item);
      if (i >= 0) items2.splice(i, 1);
      if (ot2) { seqRenderTrack(ot2); seqResyncTrack(ot2); }
      else if (isMidi) seqRenderMidi(); else if (isNote) seqRenderNotes(); else seqRender();
      seqSave();
      return;
    }
    e.preventDefault();
    seqCheckpoint();
    block.setPointerCapture(e.pointerId);
    const startX = e.clientX, startBeat = item.start;
    const snap = SEQ.arrSnap ? SEQ.arrSnapVal : (1 / BEAT_PX);
    const sourceLane  = block.parentElement;
    // Derive the owning track from the parent lane's data-track-id, falling
    // back to the legacy kind mapping for the hardcoded default lanes.
    const ownerTrack =
      (sourceLane && sourceLane.dataset && sourceLane.dataset.trackId && trackById(sourceLane.dataset.trackId)) ||
      (isMidi ? firstTrackOfKind('free') : isNote ? null : firstTrackOfKind('chord'));
    // Audible preview routed through the owner track's output (MIDI or
    // in-app instrument) so what you hear matches sequencer playback.
    {
      const previewMidi = [];
      if (isMidi || isNote) {
        previewMidi.push(item.midi);
      } else {
        const kr = item.keyRoot !== undefined ? item.keyRoot : state.keys[state.currentTemplate];
        chordToMidiNotes(kr, state.octave, item.interval, item.q).forEach(m => previewMidi.push(m));
      }
      if (previewMidi.length && ownerTrack && ownerTrack.output === 'midi') {
        const port = midiPortById(ownerTrack.midiPortId);
        const vel  = seqTrackVel(ownerTrack, state.velocity);
        previewMidi.forEach(m => sendNoteOn(m, vel, ownerTrack.channel, port));
        const stop = () => previewMidi.forEach(m => sendNoteOff(m, ownerTrack.channel, port));
        block.addEventListener('pointerup',     stop, { once: true });
        block.addEventListener('pointercancel', stop, { once: true });
      } else if (previewMidi.length && state.audioEnabled) {
        const inst  = ownerTrack ? seqTrackInstrument(ownerTrack) : null;
        const synth = ownerTrack ? ownerTrack.synth : null;
        const previewNodes = [];
        previewMidi.forEach(m => {
          let node;
          if (synth) withSynth(synth, () => { node = startAudioNote(m, state.velocity, null, null, inst); });
          else node = startAudioNote(m, state.velocity, null, null, inst);
          if (node) previewNodes.push(node);
        });
        const stop = () => previewNodes.forEach(stopAudioNote);
        block.addEventListener('pointerup',     stop, { once: true });
        block.addEventListener('pointercancel', stop, { once: true });
      }
    }
    const items = ownerTrack ? ownerTrack.items : (isMidi ? SEQ.midiItems : isNote ? SEQ.noteItems : SEQ.items);
    let cloneCreated = false;
    let moved = false;
    let ghost = null;
    let targetLane = sourceLane;
    let targetTrack = ownerTrack;
    const onMove = (ev) => {
      _edgeAutoScroll(document.getElementById('seq-lane-wrap'), ev.clientX);
      const dx = ev.clientX - startX;
      if (!moved && Math.abs(dx) < 2) return;
      const altCopy = e.altKey || ev.altKey;
      if (altCopy && !cloneCreated) {
        const cloneItem = JSON.parse(JSON.stringify(item));
        cloneItem.start = startBeat;
        items.push(cloneItem);
        items.sort((a, b) => a.start - b.start);
        cloneCreated = true;
      }
      moved = true;
      block.classList.add('moving');
      if (altCopy) block.classList.add('copy-drag');
      item.start = Math.max(0, startBeat + dx / BEAT_PX);
      block.style.left = (item.start * BEAT_PX) + 'px';
      if (sourceLane) sourceLane.style.minWidth = seqLaneWidth(items) + 'px';
      const snapped = Math.max(0, Math.round(item.start / snap) * snap);
      // Cross-track drop targets — chord-blocks can go to other chord lanes
      // or to free lanes (converted to a clip on drop). Note-blocks and
      // free-clip blocks aren't routed through this seqMakeBlock path.
      const els = document.elementsFromPoint(ev.clientX, ev.clientY);
      const overLane = els.find(el => el.classList?.contains('seq-lane'));
      if (overLane) {
        const t = trackById(overLane.dataset.trackId);
        if (!isMidi && !isNote) {
          if (t && (t.kind === 'chord' || t.kind === 'free')) { targetLane = overLane; targetTrack = t; }
        } else {
          if (t && t.kind === (isMidi ? 'free' : 'chord')) { targetLane = overLane; targetTrack = t; }
        }
      }
      if (ghost && ghost.parentElement !== targetLane) { ghost.remove(); ghost = null; }
      if (!ghost) {
        ghost = document.createElement('div');
        ghost.className = 'seq-ghost';
        ghost.style.width = (item.beats * BEAT_PX) + 'px';
        targetLane?.appendChild(ghost);
      }
      ghost.style.left = (snapped * BEAT_PX) + 'px';
    };
    const onUp = (ev) => {
      block.removeEventListener('pointermove', onMove);
      block.removeEventListener('pointerup', onUp);
      block.classList.remove('moving');
      if (ghost) { ghost.remove(); ghost = null; }
      if (moved) {
        item.start = Math.max(0, Math.round(item.start / snap) * snap);
        if (targetTrack && targetTrack !== ownerTrack) {
          const idx = items.indexOf(item);
          if (idx >= 0) items.splice(idx, 1);
          if (targetTrack.kind === 'free' && !isMidi && !isNote) {
            // Convert chord item → free clip with the chord's notes baked in.
            const kr = item.keyRoot !== undefined ? item.keyRoot : state.keys[state.currentTemplate];
            const oct = item.octave !== undefined ? item.octave : state.octave;
            const midis = chordToMidiNotes(kr, oct, item.interval, item.q);
            const clip = makeClip({
              start: item.start, beats: item.beats,
              label: item.label || '',
              notes: midis.map(m => ({ midi: m, label: midiNoteLabel(m), start: 0, beats: item.beats })),
            });
            targetTrack.items.push(clip);
          } else {
            targetTrack.items.push(item);
          }
          targetTrack.items.sort((a, b) => a.start - b.start);
          if (ownerTrack) seqRenderTrack(ownerTrack);
          seqRenderTrack(targetTrack);
          if (ownerTrack) seqResyncTrack(ownerTrack);
          seqResyncTrack(targetTrack);
        } else {
          items.sort((a, b) => a.start - b.start);
          if (ownerTrack) seqRenderTrack(ownerTrack);
          else if (isMidi) seqRenderMidi(); else if (isNote) seqRenderNotes(); else seqRender();
        }
        seqAutoExtendLoop(item.start + item.beats);
      } else if (ownerTrack) {
        seqSelectionToggle(ownerTrack, item, ev.ctrlKey || ev.metaKey || ev.shiftKey);
      }
    };
    block.addEventListener('pointermove', onMove);
    block.addEventListener('pointerup', onUp);
  });

  return block;
}

const SEQ_KEY = 'chord-pad-seq-v1';

function seqSave() {
  try {
    // Serialize each track minus its transient playback / drag state.
    const tracksOut = SEQ.tracksList.map(t => ({
      id: t.id, kind: t.kind, name: t.name,
      instrument: t.instrument, channel: t.channel, volume: t.volume, output: t.output, midiPortId: t.midiPortId, midiInPortId: t.midiInPortId,
      muted: t.muted, soloed: t.soloed, synth: t.synth,
      items: t.items,
    }));
    localStorage.setItem(SEQ_KEY, JSON.stringify({
      tracksList: tracksOut,
      loopStart: SEQ.loopStart,
      loopEnd: SEQ.loopEnd,
      loop: SEQ.loop,
      beatsPerBar: state.beatsPerBar,
      tempo: state.tempo,
      volumeBalance: state.volumeBalance,
      padOutput: state.padOutput,
      padChannel: state.padChannel,
      padMidiPortId: state.padMidiPortId,
      midiClockPortId: state.midiClockPortId,
      midiClockEnabled: state.midiClockEnabled,
      prBodyHeight: SEQ.prBodyHeight,
      visualLatencyMs: SEQ.visualLatencyMs,
    }));
  } catch (_) {}
}

function seqLoad() {
  try {
    const raw = localStorage.getItem(SEQ_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (typeof d.loopStart   === 'number')  SEQ.loopStart      = d.loopStart;
    if (typeof d.loopEnd     === 'number')  SEQ.loopEnd        = d.loopEnd;
    if (typeof d.loop        === 'boolean') SEQ.loop           = d.loop;
    if (typeof d.beatsPerBar === 'number')  state.beatsPerBar  = d.beatsPerBar;
    if (typeof d.tempo       === 'number')  state.tempo        = d.tempo;
    if (typeof d.volumeBalance === 'boolean') state.volumeBalance = d.volumeBalance;
    if (d.padOutput === 'midi' || d.padOutput === 'instrument') state.padOutput = d.padOutput;
    if (typeof d.padChannel === 'number') state.padChannel = Math.max(0, Math.min(15, d.padChannel));
    if (typeof d.padMidiPortId === 'string') state.padMidiPortId = d.padMidiPortId;
    if (typeof d.midiClockPortId === 'string') state.midiClockPortId = d.midiClockPortId;
    if (typeof d.midiClockEnabled === 'boolean') state.midiClockEnabled = d.midiClockEnabled;
    if (typeof d.prBodyHeight  === 'number')  SEQ.prBodyHeight    = d.prBodyHeight;
    if (typeof d.visualLatencyMs === 'number') SEQ.visualLatencyMs = d.visualLatencyMs;

    if (Array.isArray(d.tracksList)) {
      // New format: full tracks list.
      SEQ.tracksList.length = 0;
      for (const tIn of d.tracksList) {
        let items = Array.isArray(tIn.items) ? tIn.items : [];
        // Free tracks: ensure every item is a clip. Migrate any legacy
        // bare-note items (no .notes) by wrapping them in a 1-note clip.
        if ((tIn.kind || 'free') === 'free') {
          items = items.map(it => Array.isArray(it.notes) ? it : clipFromLegacyNote(it));
        }
        SEQ.tracksList.push(makeTrack({
          id: tIn.id, kind: tIn.kind || 'free', name: tIn.name,
          instrument: tIn.instrument, channel: tIn.channel, volume: tIn.volume, output: tIn.output, midiPortId: tIn.midiPortId, midiInPortId: tIn.midiInPortId,
          muted: tIn.muted, soloed: tIn.soloed, synth: tIn.synth,
          items,
        }));
      }
      return;
    }

    // Legacy format: items / noteItems / midiItems + tracks{chords,melody,free}.
    const chordItems = Array.isArray(d.items) ? d.items : [];
    // Old melody items merge into the free track's items (melody kind removed).
    const legacyFree = [...(Array.isArray(d.midiItems) ? d.midiItems : []),
                        ...(Array.isArray(d.noteItems) ? d.noteItems : [])];
    const freeItems  = legacyFree.map(clipFromLegacyNote);
    const chordCfg = d.tracks?.chords || {};
    const freeCfg  = d.tracks?.free   || {};
    SEQ.tracksList.length = 0;
    SEQ.tracksList.push(makeTrack({
      id: 'tr-default-chord', kind: 'chord', name: 'Chords',
      instrument: chordCfg.instrument, channel: chordCfg.channel, volume: chordCfg.volume,
      muted: chordCfg.muted, soloed: chordCfg.soloed, synth: chordCfg.synth,
      items: chordItems,
    }));
    SEQ.tracksList.push(makeTrack({
      id: 'tr-default-free', kind: 'free', name: 'Free',
      instrument: freeCfg.instrument, channel: freeCfg.channel, volume: freeCfg.volume,
      muted: freeCfg.muted, soloed: freeCfg.soloed, synth: freeCfg.synth,
      items: freeItems,
    }));
  } catch (_) {}
}

// Fill any uninitialised per-track synth with a clone of the chord-pad
// defaults. Run after seqLoad so persisted track synths survive. The
// Every track has its own synth dict (chord-pad's state.synth is separate
// from the chord-track now). Seed missing synths from a sensible default.
function seqInitTrackSynths() {
  const epiano = INSTRUMENT_PRESETS?.epiano || state.synth;
  for (const tr of SEQ.tracksList) {
    if (!tr.synth) tr.synth = { ...epiano };
  }
  // Sync the id counter past any tr-N loaded from localStorage so freshly
  // added tracks never collide with existing ones.
  for (const tr of SEQ.tracksList) {
    const m = /^tr-(\d+)$/.exec(tr.id || '');
    if (m) _trackIdCounter = Math.max(_trackIdCounter, parseInt(m[1], 10));
  }
}

function seqUpdateHints() {
  const wrap = document.getElementById('seq-lane-wrap');
  if (!wrap) return;
  const center = wrap.scrollLeft + wrap.clientWidth / 2;
  document.querySelectorAll('.seq-drop-hint').forEach(h => { h.style.left = center + 'px'; });
}

function refreshLucide() {
  if (window.lucide) lucide.createIcons();
}


function syncTrackLabelHeights() {
  // Match each lane's height to its label's natural content height — the
  // label has more rows (name, instrument, mixer) than fits in 54px and
  // setting the lane to match keeps the sidebar / arrangement aligned.
  document.querySelectorAll('.seq-track-label[data-track-id]').forEach(label => {
    const id   = label.dataset.trackId;
    const lane = document.querySelector(`.seq-lane[data-track-id="${id}"]`);
    if (!lane) return;
    label.style.height = '';
    const labelH = label.getBoundingClientRect().height;
    const laneH  = lane.getBoundingClientRect().height;
    const h = Math.max(labelH, laneH);
    label.style.height = h + 'px';
    lane.style.minHeight = h + 'px';
  });
}

function seqRender() {
  const lane = document.getElementById('seq-lane');
  if (!lane) return;
  lane.innerHTML = '';
  if (SEQ.items.length === 0) {
    lane.style.minWidth = '';
  } else {
    lane.style.minWidth = seqLaneWidth(SEQ.items) + 'px';
    SEQ.items.forEach((item, idx) => lane.appendChild(seqMakeBlock(item, idx, false)));
  }
  _appendLaneOverlays(lane);
  seqUpdateLoopVisible();
  syncTrackLabelHeights();
  seqRenderRuler();
  refreshLucide();
  seqRefreshSelectionVisuals();
  seqSave();
}

function seqRenderNotes() {
  const lane = document.getElementById('seq-note-lane');
  if (!lane) return;
  lane.innerHTML = '';
  if (SEQ.noteItems.length === 0) {
    lane.style.minWidth = '';
  } else {
    lane.style.minWidth = seqLaneWidth(SEQ.noteItems) + 'px';
    SEQ.noteItems.forEach((item, idx) => lane.appendChild(seqMakeBlock(item, idx, true)));
  }
  seqRollAddLines(lane);
  seqUpdateLoopEnd();
  syncTrackLabelHeights();
  seqRenderRuler();
  refreshLucide();
  seqRefreshSelectionVisuals();
  seqSave();
}

function seqHighlight(idx) {
  SEQ.activeIdx = idx;
  document.querySelectorAll('#seq-lane .seq-block').forEach((b, i) => {
    b.classList.toggle('active', i === idx);
  });
}

function seqHighlightNote(idx) {
  SEQ.noteActiveIdx = idx;
  document.querySelectorAll('#seq-note-lane .seq-block').forEach((b, i) => {
    b.classList.toggle('active', i === idx);
  });
}

const ROLL_ROW_H    = 8;
const ROLL_TOP_MIDI = 96;   // C7
const ROLL_BOT_MIDI = 24;   // C1
const ROLL_H        = (ROLL_TOP_MIDI - ROLL_BOT_MIDI + 1) * ROLL_ROW_H;  // 584px
let ROLL_VIEW_H     = 160;

function rollScrollForMidi(midi) {
  return Math.max(0, (ROLL_TOP_MIDI - midi) * ROLL_ROW_H - ROLL_VIEW_H / 2);
}

function rollBuildGrid(lane) {
  lane.style.padding = '0';
  // Normal-flow spacer gives the lane real scrollHeight so scrollTop works
  const spacer = document.createElement('div');
  spacer.style.cssText = `height:${ROLL_H}px;width:0;pointer-events:none;flex-shrink:0;`;
  lane.appendChild(spacer);
  for (let m = ROLL_TOP_MIDI; m >= ROLL_BOT_MIDI; m--) {
    const row = document.createElement('div');
    row.className = 'roll-row' + (midiIsBlack(m) ? ' roll-row-black' : '');
    row.dataset.midi = m;
    row.style.top    = (ROLL_TOP_MIDI - m) * ROLL_ROW_H + 'px';
    row.style.height = ROLL_ROW_H + 'px';
    if (m % 12 === 0 && !SEQ.rollKeyboard) {
      const lbl = document.createElement('span');
      lbl.className = 'roll-c-label';
      lbl.textContent = 'C' + (Math.floor(m / 12) - 1);
      row.appendChild(lbl);
    }
    lane.appendChild(row);
  }

}

function rollBuildKeyboard(lane) {
  const kb = document.createElement('div');
  kb.className = 'roll-keyboard';
  kb.style.height = ROLL_H + 'px';
  for (let m = ROLL_TOP_MIDI; m >= ROLL_BOT_MIDI; m--) {
    const isBlack = midiIsBlack(m);
    const key = document.createElement('div');
    key.className = 'roll-key ' + (isBlack ? 'roll-key-black' : 'roll-key-white');
    const rowTop = (ROLL_TOP_MIDI - m) * ROLL_ROW_H;
    if (isBlack) {
      key.style.top = rowTop + 'px';
    } else {
      const blackAbove = m < ROLL_TOP_MIDI && midiIsBlack(m + 1);
      const blackBelow = m > ROLL_BOT_MIDI && midiIsBlack(m - 1);
      const extTop    = blackAbove ? ROLL_ROW_H / 2 : 0;
      const extBottom = blackBelow ? ROLL_ROW_H / 2 : 0;
      key.style.top    = (rowTop - extTop) + 'px';
      key.style.height = (ROLL_ROW_H + extTop + extBottom) + 'px';
    }
    if (!isBlack && m % 12 === 0) {
      const lbl = document.createElement('span');
      lbl.className = 'roll-key-label';
      lbl.textContent = 'C' + (Math.floor(m / 12) - 1);
      key.appendChild(lbl);
    }
    key.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation();
      key.setPointerCapture(e.pointerId);
      kbNoteOn(m);
      key.addEventListener('pointerup',    () => kbNoteOff(m), { once: true });
      key.addEventListener('pointercancel',() => kbNoteOff(m), { once: true });
    });
    kb.appendChild(key);
  }
  lane.appendChild(kb);
}

function updateKeyboardPosition() {
  const wrap = document.getElementById('seq-lane-wrap');
  const lane = document.getElementById('seq-midi-lane');
  if (!wrap || !lane) return;
  const kb = lane.querySelector('.roll-keyboard');
  if (kb) kb.style.left = wrap.scrollLeft + 'px';
}

function updateRollOverflow() {
  const lane = document.getElementById('seq-midi-lane');
  if (!lane) return;
  const st    = lane.scrollTop;
  const viewH = lane.clientHeight || ROLL_VIEW_H;

  lane.querySelectorAll('.roll-overflow-top, .roll-overflow-bot').forEach(el => el.remove());

  const topVisibleMidi = ROLL_TOP_MIDI - st / ROLL_ROW_H;
  const botVisibleMidi = ROLL_TOP_MIDI - (st + viewH) / ROLL_ROW_H;

  SEQ.midiItems.forEach(item => {
    const above = item.midi > topVisibleMidi;
    const below = item.midi < botVisibleMidi;
    if (!above && !below) return;
    const mark = document.createElement('div');
    mark.className = above ? 'roll-overflow-top' : 'roll-overflow-bot';
    mark.style.left  = (item.start * BEAT_PX) + 'px';
    mark.style.width = Math.max(4, item.beats * BEAT_PX) + 'px';
    mark.style.top   = above ? st + 'px' : (st + viewH - 3) + 'px';
    lane.appendChild(mark);
  });
}

function midiIsBlack(midi) {
  return [1, 3, 6, 8, 10].includes(midi % 12);
}

function seqRollAddLines(lane) {
  const isRoll = lane.classList.contains('roll-mode');
  const sl = document.createElement('div');
  sl.className = 'seq-loop-start-line';
  sl.style.left = (SEQ.loopStart * BEAT_PX) + 'px';
  if (isRoll) { sl.style.top = '0'; sl.style.height = ROLL_H + 'px'; sl.style.bottom = 'auto'; }
  lane.appendChild(sl);
  const ll = document.createElement('div');
  ll.className = 'seq-loop-line';
  ll.style.left = (SEQ.loopEnd * BEAT_PX) + 'px';
  if (isRoll) { ll.style.top = '0'; ll.style.height = ROLL_H + 'px'; ll.style.bottom = 'auto'; }
  lane.appendChild(ll);
  const ph = document.createElement('div');
  ph.className = 'seq-playhead';
  ph.style.display = SEQ.playing ? 'block' : 'none';
  lane.appendChild(ph);
}


// cfg: { items, pendingIdxKey, onRerender, activeIdx, noteClass, yDrag }
function seqMakeRollNote(item, idx, topMidi, botMidi, cfg) {
  const block = document.createElement('div');
  block.className = 'roll-note' + (cfg.noteClass ? ' ' + cfg.noteClass : '') + (idx === cfg.activeIdx ? ' active' : '');
  block.style.left   = (item.start * BEAT_PX) + 'px';
  block.style.top    = (topMidi - item.midi) * ROLL_ROW_H + 'px';
  block.style.width  = Math.max(ROLL_ROW_H, item.beats * BEAT_PX) + 'px';
  block.style.height = (ROLL_ROW_H - 1) + 'px';

  if (item.beats * BEAT_PX > 20) {
    const lbl = document.createElement('span');
    lbl.className = 'roll-note-label';
    lbl.textContent = item.label;
    block.appendChild(lbl);
  }

  // Delete
  const del = document.createElement('span');
  del.className = 'roll-note-del';
  del.innerHTML = '<i data-lucide="x"></i>';
  del.addEventListener('mousedown', e => { e.stopPropagation(); e.preventDefault(); });
  del.addEventListener('click', e => {
    e.stopPropagation();
    cfg.items.splice(idx, 1);
    if (SEQ[cfg.pendingIdxKey] >= cfg.items.length) SEQ[cfg.pendingIdxKey] = 0;
    cfg.onRerender();
  });
  block.appendChild(del);

  // Resize
  const resize = document.createElement('div');
  resize.className = 'roll-note-resize';
  resize.addEventListener('pointerdown', e => {
    e.stopPropagation(); e.preventDefault();
    resize.setPointerCapture(e.pointerId);
    const startX = e.clientX, startBts = item.beats;
    const onMove = ev => {
      item.beats = Math.max(0.125, startBts + (ev.clientX - startX) / BEAT_PX);
      block.style.width = Math.max(ROLL_ROW_H, item.beats * BEAT_PX) + 'px';
      seqAutoExtendLoop(item.start + item.beats);
    };
    const onUp = () => {
      resize.removeEventListener('pointermove', onMove);
      resize.removeEventListener('pointerup', onUp);
      if (SEQ.rollSnap) {
        item.beats = Math.max(SEQ.rollSnapVal, rollSnapBeat(item.beats));
        block.style.width = (item.beats * BEAT_PX) + 'px';
      }
      seqSave();
    };
    resize.addEventListener('pointermove', onMove);
    resize.addEventListener('pointerup', onUp);
  });
  block.appendChild(resize);

  // Drag (X = time, Y = pitch if cfg.yDrag)
  block.addEventListener('pointerdown', e => {
    if (e.target.closest('.roll-note-resize') || e.target.closest('.roll-note-del')) return;
    // Eraser tool: delete on click
    if (SEQ.rollTool === 'erase') {
      e.preventDefault();
      cfg.items.splice(idx, 1);
      if (SEQ[cfg.pendingIdxKey] >= cfg.items.length) SEQ[cfg.pendingIdxKey] = 0;
      cfg.onRerender();
      return;
    }
    e.preventDefault();
    block.setPointerCapture(e.pointerId);
    if (state.audioEnabled) {
      // Use the owning track's instrument if we can resolve it from the lane.
      const laneEl = block.parentElement;
      const ot    = (laneEl && laneEl.dataset && laneEl.dataset.trackId && trackById(laneEl.dataset.trackId)) || null;
      const inst  = ot ? seqTrackInstrument(ot) : null;
      const synth = ot ? ot.synth : null;
      let previewNode;
      if (synth) withSynth(synth, () => { previewNode = startAudioNote(item.midi, state.velocity, null, null, inst); });
      else previewNode = startAudioNote(item.midi, state.velocity, null, null, inst);
      const stopPreview = () => previewNode && stopAudioNote(previewNode);
      block.addEventListener('pointerup',     stopPreview, { once: true });
      block.addEventListener('pointercancel', stopPreview, { once: true });
    }
    const startX = e.clientX, startY = e.clientY;
    const startBeat = item.start, startMidi = item.midi;
    let moved = false;
    const onMove = ev => {
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      if (!moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
      moved = true;
      block.classList.add('moving');
      item.start = Math.max(0, startBeat + dx / BEAT_PX);
      if (cfg.yDrag) {
        const newMidi = Math.max(botMidi, Math.min(topMidi, startMidi - Math.round(dy / ROLL_ROW_H)));
        if (newMidi !== item.midi) { item.midi = newMidi; item.label = midiNoteLabel(newMidi); }
        block.style.top = (topMidi - item.midi) * ROLL_ROW_H + 'px';
      }
      block.style.left = (item.start * BEAT_PX) + 'px';
    };
    const onUp = () => {
      block.removeEventListener('pointermove', onMove);
      block.removeEventListener('pointerup', onUp);
      block.classList.remove('moving');
      if (moved) {
        if (SEQ.rollSnap) {
          item.start = Math.max(0, rollSnapBeat(item.start));
          block.style.left = (item.start * BEAT_PX) + 'px';
        }
        cfg.items.sort((a, b) => a.start - b.start);
        seqAutoExtendLoop(item.start + item.beats);
        cfg.onRerender();
      }
    };
    block.addEventListener('pointermove', onMove);
    block.addEventListener('pointerup', onUp);
  });

  return block;
}

function seqRenderMidiCollapsed(lane) {
  lane.innerHTML = '';
  lane.classList.remove('roll-mode');
  lane.onscroll = null;
  lane.style.padding = '';
  if (SEQ.midiItems.length === 0) return;
  lane.style.minWidth = seqLaneWidth(SEQ.midiItems) + 'px';
  const intervals = SEQ.midiItems.map(i => [i.start, i.start + i.beats]).sort((a, b) => a[0] - b[0]);
  const merged = [[...intervals[0]]];
  for (let i = 1; i < intervals.length; i++) {
    const last = merged[merged.length - 1];
    if (intervals[i][0] <= last[1]) last[1] = Math.max(last[1], intervals[i][1]);
    else merged.push([...intervals[i]]);
  }
  merged.forEach(([s, e]) => {
    const block = document.createElement('div');
    block.className = 'seq-block';
    block.style.cssText = `left:${s * BEAT_PX}px;width:${(e - s) * BEAT_PX}px`;
    lane.appendChild(block);
  });
  seqRollAddLines(lane);
  seqUpdateLoopEnd();
}

function seqRenderMidi() {
  const lane = document.getElementById('seq-midi-lane');
  if (!lane) return;
  if (lane.classList.contains('track-collapsed')) {
    seqRenderMidiCollapsed(lane);
    syncTrackLabelHeights();
    seqSave();
    return;
  }
  const savedScroll = lane.scrollTop;
  lane.innerHTML = '';
  lane.style.padding = '';
  lane.classList.add('roll-mode');
  lane.onscroll = () => { updateRollOverflow(); updateKeyboardPosition(); };

  lane.style.minWidth = SEQ.midiItems.length > 0 ? seqLaneWidth(SEQ.midiItems) + 'px' : '';
  rollBuildGrid(lane);
  if (SEQ.rollKeyboard) rollBuildKeyboard(lane);
  if (SEQ.midiItems.length > 0) {
    const midiCfg = { items: SEQ.midiItems, pendingIdxKey: 'midiPendingIdx', onRerender: seqRenderMidi, activeIdx: SEQ.midiActiveIdx, yDrag: true };
    SEQ.midiItems.forEach((item, idx) => lane.appendChild(seqMakeRollNote(item, idx, ROLL_TOP_MIDI, ROLL_BOT_MIDI, midiCfg)));
  }
  const ctr = SEQ.midiItems.length > 0 ? Math.round(SEQ.midiItems.reduce((s, i) => s + i.midi, 0) / SEQ.midiItems.length) : 66;
  lane.scrollTop = savedScroll || rollScrollForMidi(ctr);
  updateRollOverflow();
  updateKeyboardPosition();
  seqRollAddLines(lane);
  seqUpdateLoopEnd();
  syncTrackLabelHeights();
  seqRenderRuler();
  refreshLucide();
  seqRefreshSelectionVisuals();
  seqSave();
}

function seqHighlightMidi(idx) {
  SEQ.midiActiveIdx = idx;
  document.querySelectorAll('#seq-midi-lane .roll-note').forEach((b, i) => {
    b.classList.toggle('active', i === idx);
  });
}

function seqTick() {
  if (!SEQ.playing) return;
  const ctx = getAudioCtx();
  const now = ctx.currentTime;
  const bd  = seqBeatDur();
  const horizon = now + SEQ.LOOKAHEAD;
  for (const tr of SEQ.tracksList) {
    if (tr.kind === 'chord')      seqTickChordTrack(tr, now, bd, horizon);
    else if (tr.kind === 'free')  seqTickFreeTrack(tr, now, bd, horizon);
  }
  seqDebugTick(now, bd);
}

// ---- Debug HUD ------------------------------------------------------------
// Enable from DevTools: `SEQ.debug = true` (or `SEQ.debug = 'hud'` for the
// on-screen overlay too). Logs at most ~5×/sec while playing so the console
// stays readable. Reset throttle counter with SEQ._dbgT = 0.
SEQ.debug = false;
SEQ._dbgT = 0;
function seqDebugTick(now, bd) {
  if (!SEQ.debug) return;
  if (SEQ._dbgT && now - SEQ._dbgT < 0.2) return;
  SEQ._dbgT = now;
  const snap = {
    t:         +now.toFixed(3),
    bd:        +bd.toFixed(4),
    animBeat:  +(SEQ.animBeat || 0).toFixed(3),
    cycleStart:+(SEQ.cycleStart ?? 0).toFixed(3),
    loop:      SEQ.loop,
    loopStart: SEQ.loopStart,
    loopEnd:   SEQ.loopEnd,
    tracks:    SEQ.tracksList.map(tr => ({
      name:    tr.name,
      kind:    tr.kind,
      pIdx:    tr.pendingIdx,
      pTime:   tr.pendingTime === Infinity ? 'inf' : +tr.pendingTime.toFixed(3),
      pDelta:  tr.pendingTime === Infinity ? 'inf' : +(tr.pendingTime - now).toFixed(3),
      cStart:  +(tr.cycleStart ?? 0).toFixed(3),
    })),
  };
  console.log('[SEQ]', snap);
  if (SEQ.debug === 'hud') seqDebugRenderHUD(snap);
}
function seqDebugRenderHUD(s) {
  let hud = document.getElementById('seq-debug-hud');
  if (!hud) {
    hud = document.createElement('pre');
    hud.id = 'seq-debug-hud';
    hud.style.cssText = 'position:fixed;right:8px;bottom:8px;z-index:99999;background:rgba(0,0,0,0.78);color:#9f7;font:10px/1.3 monospace;padding:8px 10px;border:1px solid #333;border-radius:4px;pointer-events:none;max-width:340px;';
    document.body.appendChild(hud);
  }
  hud.textContent = JSON.stringify(s, null, 2);
}

function seqTickChordTrack(track, now, bd, horizon) {
  while (track.items.length > 0 && track.pendingTime < horizon) {
    const item = track.items[track.pendingIdx];
    const t    = track.cycleStart + (item.start - seqLoopOffset()) * bd;
    const dur  = item.beats * bd;
    const onDelay  = Math.max(0, (t - now) * 1000);
    const offDelay = Math.max(0, (t + dur * 0.95 - now) * 1000);
    const shift    = item.semitoneShift || 0;
    const notes    = chordToMidiNotes(item.keyRoot, state.octave, item.interval, item.q).map(n => Math.max(0, Math.min(127, n + shift)));
    const bassInt  = item.bassInterval !== undefined ? item.bassInterval : item.interval;
    const bassNote = state.bassEnabled ? (state.bassOctave + 1) * 12 + (item.keyRoot + bassInt) % 12 : null;

    const audible   = seqTrackAudible(track);
    const vel       = seqTrackVel(track, state.velocity);
    const inst      = seqTrackInstrument(track);

    const useInstrument = track.output !== 'midi';
    const useMidi       = track.output === 'midi';
    if (useInstrument && state.audioEnabled && audible) {
      const fire = () => {
        const audioNodes = notes.map((n, i) => startAudioNote(n, vel, t + i * 0.002, null, inst));
        audioNodes.forEach(n => SEQ.activeNodes.add(n));
        seqTimeout(() => audioNodes.forEach(n => { stopAudioNote(n); SEQ.activeNodes.delete(n); }), offDelay);
        if (bassNote !== null) {
          const bassNode = startBassNote(bassNote, t, null, inst);
          SEQ.activeNodes.add(bassNode);
          seqTimeout(() => { stopAudioNote(bassNode); SEQ.activeNodes.delete(bassNode); }, offDelay);
        }
      };
      withSynth(track.synth, fire);
    }
    const capturedNotes = [...notes], capturedBass = bassNote;
    const trkPort = useMidi ? midiPortById(track.midiPortId) : null;
    // Schedule MIDI directly via port.send timestamps — sample-precise, no
    // setTimeout jitter. Display updates still go through seqTimeout so
    // they only run at "now" time (not preemptively).
    if (useMidi && audible && trkPort) {
      const onTs  = audioTimeToMidiTs(t);
      const offTs = audioTimeToMidiTs(t + dur * 0.95);
      capturedNotes.forEach(n => sendNoteOn(n, vel, track.channel, trkPort, onTs));
      if (capturedBass !== null) sendNoteOn(capturedBass, vel, track.channel, trkPort, onTs);
      capturedNotes.forEach(n => sendNoteOff(n, track.channel, trkPort, offTs));
      if (capturedBass !== null) sendNoteOff(capturedBass, track.channel, trkPort, offTs);
    }
    seqTimeout(() => {
      SEQ.nowChord = chordDisplayName(item.keyRoot, item.interval, item.q) + ' [' + capturedNotes.map(midiNoteName).join(' · ') + ']';
      seqUpdateNowPlaying();
    }, onDelay);
    seqTimeout(() => {
      SEQ.nowChord = '';
      seqUpdateNowPlaying();
    }, offDelay);

    if (track.id === 'tr-default-chord') {
      const capturedIdx = track.pendingIdx;
      seqTimeout(() => seqHighlight(capturedIdx), onDelay);
      seqTimeout(() => { if (track.activeIdx === capturedIdx) seqHighlight(-1); }, offDelay);
    }

    track.pendingIdx++;
    seqAdvanceTrackPending(track, bd);
  }
}

// Compute a flat sorted list of {midi, label, beats, start} from all
// clips' notes, with absolute start = clip.start + note.start. Cached
// on the track and invalidated when items change.
function freeTrackFlatNotes(track) {
  if (!track._flatNotes || track._flatDirty) {
    const out = [];
    for (const clip of track.items) {
      const clipEnd = clip.beats;
      for (const note of clip.notes) {
        // Skip notes that start outside the clip — they wouldn't trigger.
        if (note.start >= clipEnd) continue;
        // Truncate note duration at clip end (Ableton/Cubase/Logic default).
        // Non-destructive: the underlying note.beats is unchanged; only the
        // playback-effective beats is clipped.
        const effBeats = Math.min(note.beats, clipEnd - note.start);
        if (effBeats <= 0) continue;
        out.push({
          midi: note.midi,
          label: note.label || midiNoteLabel(note.midi),
          beats: effBeats,
          start: clip.start + note.start,
        });
      }
    }
    out.sort((a, b) => a.start - b.start);
    track._flatNotes = out;
    track._flatDirty = false;
  }
  return track._flatNotes;
}
function invalidateFreeTrackFlat(track) { if (track) track._flatDirty = true; }

function seqTickFreeTrack(track, now, bd, horizon) {
  const notes = freeTrackFlatNotes(track);
  while (notes.length > 0 && track.pendingTime < horizon) {
    const item = notes[track.pendingIdx];
    if (!item) break;
    const t    = track.cycleStart + (item.start - seqLoopOffset()) * bd;
    const dur  = item.beats * bd;
    const onDelay  = Math.max(0, (t - now) * 1000);
    const offDelay = Math.max(0, (t + dur * 0.95 - now) * 1000);
    const audible  = seqTrackAudible(track);
    const vel      = seqTrackVel(track, state.velocity);
    const inst     = seqTrackInstrument(track);
    const useInstrument = track.output !== 'midi';
    const useMidi       = track.output === 'midi';
    if (useInstrument && state.audioEnabled && audible) {
      withSynth(track.synth, () => {
        const node = startAudioNote(item.midi, vel, t, null, inst);
        SEQ.activeNodes.add(node);
        seqTimeout(() => { stopAudioNote(node); SEQ.activeNodes.delete(node); }, offDelay);
      });
    }
    const capturedMidi = item.midi, capturedLabel = item.label;
    const trkPort = useMidi ? midiPortById(track.midiPortId) : null;
    if (useMidi && audible && trkPort) {
      const onTs  = audioTimeToMidiTs(t);
      const offTs = audioTimeToMidiTs(t + dur * 0.95);
      sendNoteOn(capturedMidi, vel, track.channel, trkPort, onTs);
      sendNoteOff(capturedMidi, track.channel, trkPort, offTs);
    }
    seqTimeout(() => {
      SEQ.nowNote = capturedLabel;
      seqUpdateNowPlaying();
    }, onDelay);
    seqTimeout(() => {
      SEQ.nowNote = '';
      seqUpdateNowPlaying();
    }, offDelay);

    track.pendingIdx++;
    seqAdvanceTrackPendingFlat(track, notes, bd);
  }
}

function seqAdvanceTrackPendingFlat(track, notes, bd) {
  const nextIdx = seqFindNextInRange(notes, track.pendingIdx);
  if (nextIdx < 0) {
    if (SEQ.loop) {
      track.cycleStart += seqTotalDur();
      const fi = seqFindNextInRange(notes, 0);
      track.pendingIdx  = fi >= 0 ? fi : 0;
      track.pendingTime = fi >= 0 ? track.cycleStart + (notes[fi].start - SEQ.loopStart) * bd : Infinity;
    } else {
      track.pendingTime = Infinity;
    }
  } else {
    track.pendingIdx  = nextIdx;
    track.pendingTime = track.cycleStart + (notes[nextIdx].start - seqLoopOffset()) * bd;
  }
}

// Advance a track's pendingIdx / pendingTime past the end (or to the next
// looped iteration). Shared by chord and free track tickers.
function seqAdvanceTrackPending(track, bd) {
  const nextIdx = seqFindNextInRange(track.items, track.pendingIdx);
  if (nextIdx < 0) {
    if (SEQ.loop) {
      track.cycleStart += seqTotalDur();
      const fi = seqFindNextInRange(track.items, 0);
      track.pendingIdx  = fi >= 0 ? fi : 0;
      track.pendingTime = fi >= 0 ? track.cycleStart + (track.items[fi].start - SEQ.loopStart) * bd : Infinity;
    } else {
      track.pendingTime = Infinity;
    }
  } else {
    track.pendingIdx  = nextIdx;
    track.pendingTime = track.cycleStart + (track.items[nextIdx].start - seqLoopOffset()) * bd;
  }
}

// Legacy single-track tick body retained below for reference but no longer used.
function _seqTickLegacy_unused() {
  if (!SEQ.playing) return;
  const ctx  = getAudioCtx();
  const now  = ctx.currentTime;
  const bd   = seqBeatDur();
  const horizon = now + SEQ.LOOKAHEAD;

  // Chord track — items sorted by start
  while (SEQ.items.length > 0 && SEQ.pendingTime < horizon) {
    const item = SEQ.items[SEQ.pendingIdx];
    const t    = SEQ.cycleStart + (item.start - seqLoopOffset()) * bd;
    const dur  = item.beats * bd;
    const onDelay = Math.max(0, (t - now) * 1000);

    const shift    = item.semitoneShift || 0;
    const notes    = chordToMidiNotes(item.keyRoot, state.octave, item.interval, item.q).map(n => Math.max(0, Math.min(127, n + shift)));
    const bassInt  = item.bassInterval !== undefined ? item.bassInterval : item.interval;
    const bassNote = state.bassEnabled ? (state.bassOctave + 1) * 12 + (item.keyRoot + bassInt) % 12 : null;
    const offDelay = Math.max(0, (t + dur * 0.95 - now) * 1000);

    const trChord = SEQ.tracks.chords;
    const chordAudible = seqTrackAudible('chords');
    const vChord = seqTrackVel('chords', state.velocity);
    const chordInst = seqTrackInstrument('chords'); // === state.instrument
    if (state.audioEnabled && chordAudible) {
      // Chord track shares the chord-pad voice — no withSynth swap needed.
      const audioNodes = notes.map((n, i) => startAudioNote(n, vChord, t + i * 0.002, null, chordInst));
      audioNodes.forEach(n => SEQ.activeNodes.add(n));
      seqTimeout(() => audioNodes.forEach(n => { stopAudioNote(n); SEQ.activeNodes.delete(n); }), offDelay);
      if (bassNote !== null) {
        const bassNode = startBassNote(bassNote, t, null, chordInst);
        SEQ.activeNodes.add(bassNode);
        seqTimeout(() => { stopAudioNote(bassNode); SEQ.activeNodes.delete(bassNode); }, offDelay);
      }
    }
    const capturedNotes = [...notes], capturedBass = bassNote;
    seqTimeout(() => {
      if (chordAudible) {
        capturedNotes.forEach(n => sendNoteOn(n, vChord, trChord.channel));
        if (capturedBass !== null) sendNoteOn(capturedBass, vChord, trChord.channel);
      }
      SEQ.nowChord = chordDisplayName(item.keyRoot, item.interval, item.q) + ' [' + capturedNotes.map(midiNoteName).join(' · ') + ']';
      seqUpdateNowPlaying();
    }, onDelay);
    seqTimeout(() => {
      if (chordAudible) {
        capturedNotes.forEach(n => sendNoteOff(n, trChord.channel));
        if (capturedBass !== null) sendNoteOff(capturedBass, trChord.channel);
      }
      SEQ.nowChord = '';
      seqUpdateNowPlaying();
    }, offDelay);

    const capturedIdx = SEQ.pendingIdx;
    seqTimeout(() => seqHighlight(capturedIdx), onDelay);
    seqTimeout(() => { if (SEQ.activeIdx === capturedIdx) seqHighlight(-1); }, offDelay);

    SEQ.pendingIdx++;
    const nextChordIdx = seqFindNextInRange(SEQ.items, SEQ.pendingIdx);
    if (nextChordIdx < 0) {
      if (SEQ.loop) {
        SEQ.cycleStart += seqTotalDur();
        const fi = seqFindNextInRange(SEQ.items, 0);
        SEQ.pendingIdx  = fi >= 0 ? fi : 0;
        SEQ.pendingTime = fi >= 0 ? SEQ.cycleStart + (SEQ.items[fi].start - SEQ.loopStart) * bd : Infinity;
      } else {
        SEQ.pendingTime = Infinity;
      }
    } else {
      SEQ.pendingIdx  = nextChordIdx;
      SEQ.pendingTime = SEQ.cycleStart + (SEQ.items[nextChordIdx].start - seqLoopOffset()) * bd;
    }
  }

  // Note track — noteItems sorted by start
  while (SEQ.noteItems.length > 0 && SEQ.notePendingTime < horizon) {
    const item = SEQ.noteItems[SEQ.notePendingIdx];
    const t    = SEQ.noteCycleStart + (item.start - seqLoopOffset()) * bd;
    const dur  = item.beats * bd;
    const onDelay  = Math.max(0, (t - now) * 1000);
    const offDelay = Math.max(0, (t + dur * 0.95 - now) * 1000);

    const trMel = SEQ.tracks.melody;
    const melAudible = seqTrackAudible('melody');
    const vMel = seqTrackVel('melody', state.velocity);
    if (state.audioEnabled && melAudible) {
      withSynth(trMel.synth, () => {
        const node = startAudioNote(item.midi, vMel, t, null, trMel.instrument);
        SEQ.activeNodes.add(node);
        seqTimeout(() => { stopAudioNote(node); SEQ.activeNodes.delete(node); }, offDelay);
      });
    }
    const capturedMidi = item.midi, capturedLabel = item.label;
    seqTimeout(() => {
      if (melAudible) sendNoteOn(capturedMidi, vMel, trMel.channel);
      SEQ.nowNote = capturedLabel;
      seqUpdateNowPlaying();
    }, onDelay);
    seqTimeout(() => {
      if (melAudible) sendNoteOff(capturedMidi, trMel.channel);
      SEQ.nowNote = '';
      seqUpdateNowPlaying();
    }, offDelay);

    const capturedNoteIdx = SEQ.notePendingIdx;
    seqTimeout(() => seqHighlightNote(capturedNoteIdx), onDelay);
    seqTimeout(() => { if (SEQ.noteActiveIdx === capturedNoteIdx) seqHighlightNote(-1); }, offDelay);

    SEQ.notePendingIdx++;
    const nextNoteIdx = seqFindNextInRange(SEQ.noteItems, SEQ.notePendingIdx);
    if (nextNoteIdx < 0) {
      if (SEQ.loop) {
        SEQ.noteCycleStart += seqTotalDur();
        const fn = seqFindNextInRange(SEQ.noteItems, 0);
        SEQ.notePendingIdx  = fn >= 0 ? fn : 0;
        SEQ.notePendingTime = fn >= 0 ? SEQ.noteCycleStart + (SEQ.noteItems[fn].start - SEQ.loopStart) * bd : Infinity;
      } else {
        SEQ.notePendingTime = Infinity;
      }
    } else {
      SEQ.notePendingIdx  = nextNoteIdx;
      SEQ.notePendingTime = SEQ.noteCycleStart + (SEQ.noteItems[nextNoteIdx].start - seqLoopOffset()) * bd;
    }
  }

  // MIDI input track — midiItems sorted by start
  while (SEQ.midiItems.length > 0 && SEQ.midiPendingTime < horizon) {
    const item = SEQ.midiItems[SEQ.midiPendingIdx];
    const t    = SEQ.midiCycleStart + (item.start - seqLoopOffset()) * bd;
    const dur  = item.beats * bd;
    const onDelay  = Math.max(0, (t - now) * 1000);
    const offDelay = Math.max(0, (t + dur * 0.95 - now) * 1000);

    const trFree = SEQ.tracks.free;
    const freeAudible = seqTrackAudible('free');
    const vFree = seqTrackVel('free', state.velocity);
    if (state.audioEnabled && freeAudible) {
      withSynth(trFree.synth, () => {
        const node = startAudioNote(item.midi, vFree, t, null, trFree.instrument);
        SEQ.activeNodes.add(node);
        seqTimeout(() => { stopAudioNote(node); SEQ.activeNodes.delete(node); }, offDelay);
      });
    }
    const capturedMidi = item.midi, capturedLabel = item.label;
    seqTimeout(() => {
      if (freeAudible) sendNoteOn(capturedMidi, vFree, trFree.channel);
      SEQ.nowNote = capturedLabel;
      seqUpdateNowPlaying();
    }, onDelay);
    seqTimeout(() => {
      if (freeAudible) sendNoteOff(capturedMidi, trFree.channel);
      SEQ.nowNote = '';
      seqUpdateNowPlaying();
    }, offDelay);

    const capturedMidiIdx = SEQ.midiPendingIdx;
    seqTimeout(() => seqHighlightMidi(capturedMidiIdx), onDelay);
    seqTimeout(() => { if (SEQ.midiActiveIdx === capturedMidiIdx) seqHighlightMidi(-1); }, offDelay);

    SEQ.midiPendingIdx++;
    const nextMidiIdx = seqFindNextInRange(SEQ.midiItems, SEQ.midiPendingIdx);
    if (nextMidiIdx < 0) {
      if (SEQ.loop) {
        SEQ.midiCycleStart += seqTotalDur();
        const fm = seqFindNextInRange(SEQ.midiItems, 0);
        SEQ.midiPendingIdx  = fm >= 0 ? fm : 0;
        SEQ.midiPendingTime = fm >= 0 ? SEQ.midiCycleStart + (SEQ.midiItems[fm].start - SEQ.loopStart) * bd : Infinity;
      } else {
        SEQ.midiPendingTime = Infinity;
      }
    } else {
      SEQ.midiPendingIdx  = nextMidiIdx;
      SEQ.midiPendingTime = SEQ.midiCycleStart + (SEQ.midiItems[nextMidiIdx].start - seqLoopOffset()) * bd;
    }
  }
}


// Generic per-track resync: recomputes pendingIdx / pendingTime / cycleStart
// so the next note plays at the right time relative to the current clock.
// For free tracks, indexing is over the flattened note list rather than clips.
function seqResyncTrack(track) {
  if (!SEQ.playing || !track) return;
  invalidateFreeTrackFlat(track);
  const list = track.kind === 'free' ? freeTrackFlatNotes(track) : track.items;
  if (list.length === 0) return;
  const bd    = seqBeatDur();
  const tRef  = SEQ.playStartTime + 0.05;
  const total = seqTotalDur();
  const now   = getAudioCtx().currentTime;
  const ls    = seqLoopOffset();
  const cycleNum   = SEQ.loop ? Math.max(0, Math.floor((now - tRef) / total)) : 0;
  const cycleStart = tRef + cycleNum * total;
  for (let i = 0; i < list.length; i++) {
    if (!seqItemInRange(list[i])) continue;
    const t = cycleStart + (list[i].start - ls) * bd;
    if (t > now) {
      track.cycleStart  = cycleStart;
      track.pendingIdx  = i;
      track.pendingTime = t;
      seqResyncAnimLoop();
      return;
    }
  }
  if (!SEQ.loop) { track.pendingTime = Infinity; return; }
  const next = cycleStart + total;
  const fi = seqFindNextInRange(list, 0);
  track.cycleStart  = next;
  track.pendingIdx  = fi >= 0 ? fi : 0;
  track.pendingTime = fi >= 0 ? next + (list[fi].start - SEQ.loopStart) * bd : Infinity;
  seqResyncAnimLoop();
}

function seqResyncAll() { for (const t of SEQ.tracksList) seqResyncTrack(t); }
// Re-anchor playStartTime so that the current visual beat (SEQ.animBeat) maps
// exactly to the current audio time under the *current* tempo + loop bounds.
// Without this, any change to tempo or loop-bounds mid-play makes the
// scheduler's `(now - playStartTime) / total` math compute a wrong cycleNum,
// causing notes to fire at the wrong moments.
function seqReanchorPlayStart() {
  if (!SEQ.playing) return;
  const ctx  = getAudioCtx();
  const bd   = seqBeatDur();
  const lo   = SEQ.loopStart;
  const hi   = SEQ.loopEnd;
  const beat = Math.max(lo, Math.min(hi - 0.001, SEQ.animBeat || lo));
  SEQ.playStartTime = ctx.currentTime - (beat - lo) * bd - 0.05;
  SEQ.cycleStart    = SEQ.playStartTime + 0.05;
}
// Throttled resync — call freely from pointermove handlers; only does the
// expensive seqResyncTrack work every ~80ms per track, so playback follows
// drag/resize edits without 60Hz reschedule churn.
function seqResyncTrackThrottled(track) {
  if (!track || !SEQ.playing) return;
  const now = performance.now();
  if (track._lastResyncT && now - track._lastResyncT < 80) return;
  track._lastResyncT = now;
  invalidateFreeTrackFlat(track);
  seqResyncTrack(track);
}
// Call when something that affects the global time-base changed (loop bounds,
// tempo): re-anchor, kill stale scheduled timers, then reschedule all tracks.
function seqLoopBaseChangedResync() {
  if (!SEQ.playing) return;
  seqReanchorPlayStart();
  for (const t of SEQ.tracksList) invalidateFreeTrackFlat(t);
  SEQ.pendingTimers.forEach(id => clearTimeout(id));
  SEQ.pendingTimers.clear();
  seqResyncAll();
  // Metronome state is tied to loop bounds + tempo, so reset it on any
  // base-change so accents land at the right beats from now on.
  metroHalt();
  metroRunSynced();
}
function seqResyncAllThrottled() {
  if (!SEQ.playing) return;
  const now = performance.now();
  if (SEQ._lastResyncAllT && now - SEQ._lastResyncAllT < 80) return;
  SEQ._lastResyncAllT = now;
  // Re-anchor first so the new loop-bounds / tempo math doesn't trip up
  // seqResyncTrack's cycleNum computation.
  seqReanchorPlayStart();
  for (const t of SEQ.tracksList) invalidateFreeTrackFlat(t);
  // Stop any currently-scheduled timers/nodes — they were scheduled under
  // the previous loop bounds and would otherwise double-fire after reanchor.
  SEQ.pendingTimers.forEach(id => clearTimeout(id));
  SEQ.pendingTimers.clear();
  seqResyncAll();
}

function seqResyncChords() { seqResyncTrack(firstTrackOfKind('chord')); }

function seqResyncNotes() { /* melody removed — no-op */ }

function seqResyncMidi() { seqResyncTrack(firstTrackOfKind('free')); }

function seqInitPlay(t0) {
  const bd  = seqBeatDur();
  const ls  = seqLoopOffset();
  // Honour a user-set playhead position from clicking on the ruler. Clamped
  // to the loop range so we never start outside it.
  const wantStart = (typeof SEQ.startBeat === 'number')
    ? Math.max(SEQ.loopStart, Math.min(SEQ.loopEnd - 0.001, SEQ.startBeat))
    : SEQ.loopStart;
  SEQ.playing        = true;
  SEQ.playStartTime  = t0 - 0.05;
  SEQ.animBeat      = wantStart;
  SEQ.animLastTime  = t0;
  SEQ.animLoopLen   = SEQ.loopEnd - SEQ.loopStart;
  SEQ.animLoopStart = SEQ.loopStart;
  const offsetFromStart = wantStart - SEQ.loopStart;
  // Initialize each track's playback cursor independently.
  for (const tr of SEQ.tracksList) {
    invalidateFreeTrackFlat(tr);
    const list = tr.kind === 'free' ? freeTrackFlatNotes(tr) : tr.items;
    const fi = seqFindNextInRange(list, 0);
    tr.cycleStart  = t0 - offsetFromStart * bd;
    tr.pendingIdx  = fi >= 0 ? fi : 0;
    tr.pendingTime = fi >= 0 ? t0 + (list[fi].start - ls - offsetFromStart) * bd : Infinity;
    tr.activeIdx   = -1;
  }
  if (!SEQ.timer) SEQ.timer = setInterval(seqTick, SEQ.TICK_MS);
  document.querySelectorAll('.seq-playhead').forEach(ph => {
    // The roll's playhead is positioned by seqAnimatePlayhead with the
    // clip-relative formula. Skip it here to avoid a flash at left=0.
    if (ph.closest('#seq-pianoroll-body')) return;
    ph.style.display = 'block';
  });
  if (SEQ.rafId) cancelAnimationFrame(SEQ.rafId);
  SEQ.rafId = requestAnimationFrame(seqAnimatePlayhead);
  document.getElementById('seq-play-btn').classList.add('active');
  document.getElementById('seq-play-btn').innerHTML = '<i data-lucide="square"></i> Stop'; refreshLucide();
}

function startPrecount(onDone) {
  const ctx  = getAudioCtx();
  const bd   = seqBeatDur();
  const tRef = ctx.currentTime + 0.05;
  const savedEnabled = METRO.enabled;
  METRO.enabled = true;
  metroRun(tRef, SEQ.loopStart);
  const beatSpan = document.getElementById('seq-rec-beat');

  function tick() {
    if (!SEQ.playing) {
      beatSpan.textContent = '';
      METRO.enabled = savedEnabled;
      if (!METRO.enabled) metroHalt();
      return;
    }
    const elapsed = getAudioCtx().currentTime - tRef;
    const beatNum = Math.floor(elapsed / bd);
    if (beatNum >= state.beatsPerBar) {
      beatSpan.textContent = '';
      METRO.enabled = savedEnabled;
      if (!METRO.enabled) metroHalt();
      onDone(getAudioCtx().currentTime + 0.05);
      return;
    }
    beatSpan.textContent = state.beatsPerBar - beatNum;
    REC._precountRaf = requestAnimationFrame(tick);
  }
  REC._precountRaf = requestAnimationFrame(tick);

  // mark play btn immediately so Stop works during precount
  document.getElementById('seq-play-btn').classList.add('active');
  document.getElementById('seq-play-btn').innerHTML = '<i data-lucide="square"></i> Stop'; refreshLucide();
  SEQ.playing = true;
}

function seqPlay(leadSec) {
  const ctx = getAudioCtx();
  // Default lead-in of 50 ms gives the scheduler safety margin. MIDI-clock
  // syncing passes a much smaller lead (~5 ms) so we line up with the
  // external master's beat 1 rather than trailing it by 50 ms.
  const lead = typeof leadSec === 'number' ? leadSec : 0.05;
  const t0   = ctx.currentTime + lead;

  if (REC.armed && PRECOUNT.enabled) {
    startPrecount((t0actual) => {
      if (!SEQ.playing) return;
      seqInitPlay(t0actual);
      recActivate(t0actual);
    });
    return;
  }

  seqInitPlay(t0);
  metroRun(t0, SEQ.animBeat ?? SEQ.loopStart);
  if (REC.armed) recActivate(t0);
  // Don't wait for the next 25ms tick — schedule anything inside the LOOKAHEAD
  // window right now so beat 0 actually fires close to t0.
  seqTick();
}

function seqStop() {
  SEQ.playing = false;
  SEQ.activeIdx = -1;
  SEQ.nowChord = '';
  SEQ.nowNote  = '';
  SEQ.pendingTimers.forEach(id => clearTimeout(id));
  SEQ.pendingTimers.clear();
  SEQ.activeNodes.forEach(n => stopAudioNote(n));
  SEQ.activeNodes.clear();
  panic();
  if (SEQ.rafId) { cancelAnimationFrame(SEQ.rafId); SEQ.rafId = null; }
  if (typeof SEQ.startBeat === 'number') {
    document.querySelectorAll('.seq-playhead').forEach(ph => {
      // The roll-body playhead lives in a clip-relative coordinate system
      // (PR_BEAT_PX + keyboard offset, clip.start subtracted). Skip it here
      // — seqAnimatePlayhead positions it correctly on the next play, and
      // when stopped it should just hide so it doesn't appear as a stray
      // vertical line at left=0.
      if (ph.closest('#seq-pianoroll-body')) { ph.style.display = 'none'; return; }
      ph.style.display = 'block';
      ph.style.left = (SEQ.startBeat * BEAT_PX) + 'px';
    });
  } else {
    document.querySelectorAll('.seq-playhead').forEach(ph => ph.style.display = 'none');
  }
  document.querySelectorAll('.roll-row-active').forEach(r => r.classList.remove('roll-row-active'));
  const _cL = document.getElementById('seq-lane');
  const _nL = document.getElementById('seq-note-lane');
  const _mL = document.getElementById('seq-midi-lane');
  if (_cL) _cL.style.minWidth = SEQ.items.length > 0 ? seqLaneWidth(SEQ.items) + 'px' : '';
  if (_nL) _nL.style.minWidth = SEQ.noteItems.length > 0 ? seqLaneWidth(SEQ.noteItems) + 'px' : '';
  if (_mL) _mL.style.minWidth = SEQ.midiItems.length > 0 ? seqLaneWidth(SEQ.midiItems) + 'px' : '';
  SEQ.midiActiveIdx = -1;
  const _wrap = document.getElementById('seq-lane-wrap');
  if (_wrap) _wrap.scrollLeft = 0;
  document.querySelectorAll('.seq-drop-hint').forEach(h => { h.style.left = ''; });
  if (SEQ.timer) { clearInterval(SEQ.timer); SEQ.timer = null; }
  if (REC.active) recStop();
  if (!REC.active) metroHalt();
  document.querySelectorAll('.seq-block').forEach(b => b.classList.remove('active'));
  SEQ.noteActiveIdx = -1;
  const npn = document.getElementById('now-playing-notes');
  if (npn) npn.textContent = '—';
  const btn = document.getElementById('seq-play-btn');
  if (btn) { btn.classList.remove('active'); btn.innerHTML = '<i data-lucide="play"></i> Play'; refreshLucide(); }
}

function seqIsOpen() {
  return !document.getElementById('seq-panel').classList.contains('collapsed');
}

function seqChordDragImage(label, beats = 4) {
  const w = beats * BEAT_PX;
  const h = 44;
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;left:-9999px;top:-9999px;width:${w}px;height:${h}px;`
    + `display:flex;align-items:center;justify-content:center;`
    + `background:#2a2b2e;border:1px solid rgba(255,255,255,0.15);border-radius:5px;`
    + `color:var(--text);font-size:13px;font-weight:500;box-sizing:border-box;padding:4px 10px;`
    + `pointer-events:none;`;
  el.innerHTML = label;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 0);
  return { el, h };
}

function seqSetGhost(lane, beat, beats) {
  let g = lane.querySelector('.seq-ghost');
  if (!g) { g = document.createElement('div'); g.className = 'seq-ghost'; lane.appendChild(g); }
  g.style.left  = (beat * BEAT_PX) + 'px';
  g.style.width = (beats * BEAT_PX) + 'px';
  g.innerHTML   = SEQ._dragLabel || '';
}
function seqClearGhost(lane) { lane.querySelector('.seq-ghost')?.remove(); }

function seqSetRollGhost(lane, beat, beats, midiNotes) {
  seqClearRollGhost(lane);
  midiNotes.forEach(midi => {
    if (midi < ROLL_BOT_MIDI || midi > ROLL_TOP_MIDI) return;
    const g = document.createElement('div');
    g.className = 'roll-note roll-note-ghost roll-ghost-chord';
    g.style.left   = (beat * BEAT_PX) + 'px';
    g.style.top    = (ROLL_TOP_MIDI - midi) * ROLL_ROW_H + 'px';
    g.style.width  = (beats * BEAT_PX) + 'px';
    g.style.height = (ROLL_ROW_H - 1) + 'px';
    lane.appendChild(g);
  });
}
function seqClearRollGhost(lane) { lane.querySelectorAll('.roll-ghost-chord').forEach(el => el.remove()); }

function chordNotesAtY(lane, clientY, interval, q) {
  const rect = lane.getBoundingClientRect();
  const relY = clientY - rect.top + lane.scrollTop;
  const targetMidi = Math.max(ROLL_BOT_MIDI, Math.min(ROLL_TOP_MIDI, ROLL_TOP_MIDI - Math.floor(relY / ROLL_ROW_H)));
  const base = chordToMidiNotes(state.keys[state.currentTemplate], state.octave, interval, q);
  const avg  = base.reduce((a, b) => a + b, 0) / base.length;
  const oct  = Math.round((targetMidi - avg) / 12);
  return base.map(m => m + oct * 12).filter(m => m >= ROLL_BOT_MIDI && m <= ROLL_TOP_MIDI);
}

function seqStartTouchDrag(touch, _legacyLaneId, getData, onCancelPlay) {
    const tid = touch.identifier;
    const startX = touch.clientX, startY = touch.clientY;
    let dragging = false;
    let ghost = null;
    let lastTouch = touch;
    let scrollRaf = null;
    let prGhostNotes = [];

    const clearPrGhost = () => { prGhostNotes.forEach(g => g.remove()); prGhostNotes = []; };
    const stopScroll  = () => { if (scrollRaf) { cancelAnimationFrame(scrollRaf); scrollRaf = null; } };

    // Hit-test the finger against every track lane plus the piano-roll body.
    // Returns { kind: 'lane'|'pr', el, rect, track? } or null.
    const hitTest = (cx, cy) => {
      const prBody = document.getElementById('seq-pianoroll-body');
      if (prBody && prBody.offsetParent !== null) {
        const r = prBody.getBoundingClientRect();
        if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
          return { kind: 'pr', el: prBody, rect: r };
        }
      }
      const lanes = document.querySelectorAll('.seq-lane[data-track-id]');
      for (const lane of lanes) {
        if (lane.offsetParent === null) continue;
        const r = lane.getBoundingClientRect();
        if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
          const track = trackById(lane.dataset.trackId);
          if (!track) continue;
          return { kind: 'lane', el: lane, rect: r, track };
        }
      }
      return null;
    };

    const autoScroll = () => {
      if (!dragging) return;
      const edge = 80, maxSpeed = 12;
      const y = lastTouch.clientY, vh = window.innerHeight;
      let speed = 0;
      if (y < edge)           speed = -maxSpeed * (1 - y / edge);
      else if (y > vh - edge) speed =  maxSpeed * (1 - (vh - y) / edge);
      if (speed !== 0) window.scrollBy(0, speed);

      // Auto-scroll the piano-roll body vertically AND horizontally when the
      // finger is over it near an edge — lets you drop chords on notes that
      // are outside the visible roll viewport.
      const prBody = document.getElementById('seq-pianoroll-body');
      if (prBody && prBody.offsetParent !== null) {
        const r = prBody.getBoundingClientRect();
        if (lastTouch.clientX >= r.left && lastTouch.clientX <= r.right) {
          const edge2 = 40, maxSpeed2 = 4;
          let spy = 0;
          if (y < r.top + edge2)         spy = -maxSpeed2 * (1 - (y - r.top) / edge2);
          else if (y > r.bottom - edge2) spy =  maxSpeed2 * (1 - (r.bottom - y) / edge2);
          if (spy !== 0) prBody.scrollTop += spy;
        }
        if (y >= r.top && y <= r.bottom) {
          const edgeH = 50, maxSpH = 14;
          let spx = 0;
          if (lastTouch.clientX < r.left + edgeH)
            spx = -maxSpH * (1 - (lastTouch.clientX - r.left) / edgeH);
          else if (lastTouch.clientX > r.right - edgeH)
            spx =  maxSpH * (1 - (r.right - lastTouch.clientX) / edgeH);
          if (spx !== 0) prBody.scrollLeft += spx;
        }
      }

      // Horizontal auto-scroll in the arrangement view when the finger is
      // near the left/right edge of the lane-wrap viewport.
      const laneWrap = document.getElementById('seq-lane-wrap');
      if (laneWrap && laneWrap.offsetParent !== null) {
        const r = laneWrap.getBoundingClientRect();
        if (y >= r.top && y <= r.bottom) {
          const edgeH = 60, maxSpH = 18;
          let sp = 0;
          if (lastTouch.clientX < r.left + edgeH)
            sp = -maxSpH * (1 - (lastTouch.clientX - r.left) / edgeH);
          else if (lastTouch.clientX > r.right - edgeH)
            sp =  maxSpH * (1 - (r.right - lastTouch.clientX) / edgeH);
          if (sp !== 0) laneWrap.scrollLeft += sp;
        }
      }

      // Roll-mode lanes (the legacy MIDI lane when it shows notes inline)
      // also need vertical scroll while a chord-drag is over them.
      document.querySelectorAll('.seq-lane[data-track-id].roll-mode').forEach(l => {
        const r = l.getBoundingClientRect();
        if (lastTouch.clientX < r.left || lastTouch.clientX > r.right) return;
        const edge2 = 40, maxSpeed2 = 4;
        let sp = 0;
        if (y < r.top + edge2)         sp = -maxSpeed2 * (1 - (y - r.top) / edge2);
        else if (y > r.bottom - edge2) sp =  maxSpeed2 * (1 - (r.bottom - y) / edge2);
        if (sp !== 0) {
          l.scrollTop += sp;
          if (typeof updateRollOverflow === 'function') updateRollOverflow();
          if (typeof updateKeyboardPosition === 'function') updateKeyboardPosition();
        }
      });

      scrollRaf = requestAnimationFrame(autoScroll);
    };

    const clearAllLaneGhosts = () => {
      document.querySelectorAll('.seq-lane[data-track-id]').forEach(l => {
        l.classList.remove('drag-over');
        l.querySelector('.seq-drop-hint')?.style.removeProperty('color');
        seqClearGhost(l);
        if (typeof seqClearRollGhost === 'function') seqClearRollGhost(l);
      });
    };

    const cleanup = () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend',  onUp);
      document.removeEventListener('touchcancel', onUp);
      stopScroll();
      if (ghost) { ghost.remove(); ghost = null; }
      document.body.classList.remove('seq-dragging-chord', 'seq-dragging-note');
      clearAllLaneGhosts();
      clearPrGhost();
    };

    const onMove = (ev) => {
      const t = Array.from(ev.changedTouches).find(t => t.identifier === tid);
      if (!t) return;
      lastTouch = t;
      const dx = t.clientX - startX, dy = t.clientY - startY;
      if (!dragging) {
        if (dx * dx + dy * dy < 64) return;
        dragging = true;
        if (onCancelPlay) onCancelPlay();
        const data = getData();
        SEQ._dragLabel = data.label;
        ghost = document.createElement('div');
        ghost.className = 'seq-touch-drag-ghost';
        ghost.innerHTML = data.label;
        document.body.appendChild(ghost);
        const isChordData = data.interval !== undefined;
        document.body.classList.add(isChordData ? 'seq-dragging-chord' : 'seq-dragging-note');
        SEQ._dragChord = isChordData ? { interval: data.interval, q: data.q } : null;
        autoScroll();
      }
      ev.preventDefault();
      ghost.style.left = t.clientX + 'px';
      ghost.style.top  = t.clientY + 'px';

      clearAllLaneGhosts();
      clearPrGhost();

      const hit = hitTest(t.clientX, t.clientY);
      if (!hit) return;
      const data = getData();
      const isChord = data.interval !== undefined;

      if (hit.kind === 'lane') {
        const track = hit.track;
        // Chord tracks only accept chord drops; free tracks accept both.
        if (track.kind === 'chord' && !isChord) return;
        const beat  = Math.max(0, arrSnap((t.clientX - hit.rect.left) / BEAT_PX));
        const beats = isChord ? chordDropLen() : 1;
        hit.el.classList.add('drag-over');
        hit.el.querySelector('.seq-drop-hint')?.style.setProperty('color', 'var(--accent)');
        if (isChord && hit.el.classList.contains('roll-mode') && typeof seqSetRollGhost === 'function') {
          seqSetRollGhost(hit.el, beat, beats, chordNotesAtY(hit.el, t.clientY, data.interval, data.q));
        } else {
          seqSetGhost(hit.el, beat, beats);
        }
      } else if (hit.kind === 'pr') {
        if (!isChord) return;
        const { track, clip } = focusedClipObjects();
        if (!track || !clip) return;
        const body = hit.el;
        const beat = Math.max(0, rollSnap((t.clientX - hit.rect.left + body.scrollLeft - prKbW()) / PR_BEAT_PX));
        const cursorMidi = Math.max(0, Math.min(127, body._prHi - Math.floor((t.clientY - hit.rect.top + body.scrollTop) / PR_ROW_H)));
        const baseNotes = chordToMidiNotes(state.keys[state.currentTemplate], state.octave, data.interval, data.q);
        if (baseNotes.length === 0) return;
        const root = baseNotes[0];
        const shift = Math.round((cursorMidi - root) / 12) * 12;
        const notes = baseNotes.map(m => m + shift);
        if (prGhostNotes.length !== notes.length) {
          clearPrGhost();
          notes.forEach(() => {
            const g = document.createElement('div');
            g.className = 'pr-note pr-ghost-note';
            body.appendChild(g);
            prGhostNotes.push(g);
          });
        }
        notes.forEach((midi, i) => {
          const g = prGhostNotes[i];
          g.style.left   = (beat * PR_BEAT_PX + prKbW()) + 'px';
          g.style.width  = (chordDropLen() * PR_BEAT_PX) + 'px';
          g.style.top    = ((body._prHi - midi) * PR_ROW_H) + 'px';
          g.style.height = (PR_ROW_H - 2) + 'px';
          g.textContent  = midiNoteLabel(midi);
        });
      }
    };

    const onUp = (ev) => {
      const t = Array.from(ev.changedTouches).find(t => t.identifier === tid);
      if (!t) return;
      if (!dragging) { cleanup(); return; }
      const hit = hitTest(t.clientX, t.clientY);
      const data = getData();
      const isChord = data.interval !== undefined;
      cleanup();
      if (!hit) return;
      seqCheckpoint();
      if (hit.kind === 'pr') {
        if (!isChord) return;
        const { track, clip } = focusedClipObjects();
        if (!track || !clip) return;
        const body = hit.el;
        const beat = Math.max(0, rollSnap((t.clientX - hit.rect.left + body.scrollLeft - prKbW()) / PR_BEAT_PX));
        const cursorMidi = Math.max(0, Math.min(127, body._prHi - Math.floor((t.clientY - hit.rect.top + body.scrollTop) / PR_ROW_H)));
        const baseNotes = chordToMidiNotes(state.keys[state.currentTemplate], state.octave, data.interval, data.q);
        if (baseNotes.length === 0) return;
        const root = baseNotes[0];
        const shift = Math.round((cursorMidi - root) / 12) * 12;
        const dropBeats = chordDropLen();
        baseNotes.map(m => m + shift).forEach(midi => clip.notes.push({
          midi, label: midiNoteLabel(midi),
          start: beat, beats: dropBeats,
        }));
        clip.notes.sort((a, b) => a.start - b.start);
        if (beat + dropBeats > clip.beats) clip.beats = beat + dropBeats;
        seqAutoExtendLoop(clip.start + clip.beats);
        renderPianoRoll();
        seqRenderTrack(track);
        seqResyncTrack(track);
        seqSave();
        return;
      }
      // Lane drop — dispatch by track kind.
      const track   = hit.track;
      const dropBeat = Math.max(0, arrSnap((t.clientX - hit.rect.left) / BEAT_PX));
      if (track.kind === 'chord') {
        if (!isChord) return;
        const beats = chordDropLen();
        track.items.push({
          interval: data.interval, q: data.q, bassInterval: data.bassInterval, label: data.label,
          beats, start: dropBeat,
          keyRoot: state.keys[state.currentTemplate], template: state.currentTemplate,
        });
        track.items.sort((a, b) => a.start - b.start);
        seqAutoExtendLoop(dropBeat + beats);
      } else if (isChord) {
        const beats = chordDropLen();
        const midis = chordToMidiNotes(state.keys[state.currentTemplate], state.octave, data.interval, data.q);
        const clip  = makeClip({
          start: dropBeat, beats,
          label: data.label || null,
          notes: midis.map(midi => ({ midi, label: midiNoteLabel(midi), start: 0, beats })),
        });
        track.items.push(clip);
        track.items.sort((a, b) => a.start - b.start);
        seqAutoExtendLoop(dropBeat + beats);
      } else {
        const clip = makeClip({
          start: dropBeat, beats: 1,
          label: data.label,
          notes: [{ midi: data.midi, label: data.label, start: 0, beats: 1 }],
        });
        track.items.push(clip);
        track.items.sort((a, b) => a.start - b.start);
        seqAutoExtendLoop(dropBeat + 1);
      }
      seqRenderTrack(track);
      seqResyncTrack(track);
      seqSave();
    };

    document.addEventListener('touchmove',   onMove, { passive: false });
    document.addEventListener('touchend',    onUp);
    document.addEventListener('touchcancel', onUp);
}

function seqAddTouchDrag(el, laneId, getData, onCancelPlay) {
  el.addEventListener('touchstart', (e) => {
    if (!seqIsOpen()) return;
    seqStartTouchDrag(e.changedTouches[0], laneId, getData, onCancelPlay);
  }, { passive: true });
}

function seqApplyZoom(newBeatPx, anchorClientX) {
  const wrap = document.getElementById('seq-lane-wrap');
  const prevBeatPx = BEAT_PX;
  BEAT_PX = Math.round(Math.max(8, Math.min(160, newBeatPx)));
  if (BEAT_PX === prevBeatPx) return;
  // Anchor zoom on cursor position if given, otherwise on viewport center.
  const rect    = wrap ? wrap.getBoundingClientRect() : null;
  const anchorX = (typeof anchorClientX === 'number' && rect)
                ? Math.max(0, Math.min(wrap.clientWidth, anchorClientX - rect.left))
                : (wrap ? wrap.clientWidth / 2 : 0);
  const anchorBeat = wrap ? (wrap.scrollLeft + anchorX) / prevBeatPx : 0;
  seqUpdateBarLine();
  seqRenderAll();
  if (wrap) wrap.scrollLeft = Math.max(0, anchorBeat * BEAT_PX - anchorX);
}

// Piano-roll horizontal zoom — separate from arrangement zoom. Anchors on
// cursor position when provided, otherwise on viewport center.
function prApplyZoom(newBeatPx, anchorClientX) {
  const body = document.getElementById('seq-pianoroll-body');
  const prev = PR_BEAT_PX;
  PR_BEAT_PX = Math.round(Math.max(8, Math.min(200, newBeatPx)));
  if (PR_BEAT_PX === prev) return;
  prUpdateGridVars();
  const kb      = (typeof prKbW === 'function') ? prKbW() : 0;
  const rect    = body ? body.getBoundingClientRect() : null;
  const anchorX = (typeof anchorClientX === 'number' && rect)
                ? Math.max(kb, Math.min(body.clientWidth, anchorClientX - rect.left))
                : (body ? body.clientWidth / 2 : 0);
  const anchorBeat = body ? (body.scrollLeft + anchorX - kb) / prev : 0;
  renderPianoRoll();
  if (body) body.scrollLeft = Math.max(0, anchorBeat * PR_BEAT_PX + kb - anchorX);
}
function prUpdateGridVars() {
  document.documentElement.style.setProperty('--pr-bar-px',  (state.beatsPerBar * PR_BEAT_PX) + 'px');
  document.documentElement.style.setProperty('--pr-beat-px', PR_BEAT_PX + 'px');
}

function initSeqPinchZoom() {
  const wrap = document.getElementById('seq-lane-wrap');
  if (!wrap) return;
  let pinchStartDist = 0;
  let pinchStartBeatPx = BEAT_PX;
  let pinching = false;
  let liveScale = 1;
  const inner = wrap.querySelector('.seq-tracks-inner');

  wrap.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 2) return;
    e.preventDefault();
    pinching = true;
    pinchStartDist = Math.hypot(
      e.touches[1].clientX - e.touches[0].clientX,
      e.touches[1].clientY - e.touches[0].clientY
    );
    pinchStartBeatPx = BEAT_PX;
    liveScale = 1;
  }, { passive: false });

  wrap.addEventListener('touchmove', (e) => {
    if (!pinching || e.touches.length !== 2) return;
    e.preventDefault();
    const dist = Math.hypot(
      e.touches[1].clientX - e.touches[0].clientX,
      e.touches[1].clientY - e.touches[0].clientY
    );
    liveScale = dist / pinchStartDist;
    const preview = Math.max(10, Math.min(120, pinchStartBeatPx * liveScale));
    if (inner) { inner.style.transformOrigin = 'left center'; inner.style.transform = `scaleX(${preview / BEAT_PX})`; }
  }, { passive: false });

  wrap.addEventListener('touchend', (e) => {
    if (!pinching || e.touches.length > 1) return;
    pinching = false;
    if (inner) inner.style.transform = '';
    seqApplyZoom(pinchStartBeatPx * liveScale);
  });

  document.getElementById('seq-zoom-in')   ?.addEventListener('click', () => seqApplyZoom(BEAT_PX * 1.33));
  document.getElementById('seq-zoom-out')  ?.addEventListener('click', () => seqApplyZoom(BEAT_PX / 1.33));
  document.getElementById('seq-zoom-reset')?.addEventListener('click', () => seqApplyZoom(30));
}

function initSeqLanePan() {
  const wrap = document.getElementById('seq-lane-wrap');
  if (!wrap) return;

  wrap.addEventListener('scroll', () => { seqUpdateHints(); updateKeyboardPosition(); });

  const EXCLUDE = '.seq-block, .seq-loop-start, .seq-loop-end, .seq-resize, .seq-delete, .roll-note, .roll-chord-group, .roll-note-del, .roll-note-resize, .seq-roll-toggle-btn';

  function startPan(startX, startY, laneEl) {
    let prevX = startX, prevY = startY;
    let panning = false;

    const extendLanes = () => {
      const needed = wrap.scrollLeft + wrap.clientWidth + BEAT_PX * 8;
      ['seq-lane', 'seq-note-lane', 'seq-midi-lane'].forEach(id => {
        const lane = document.getElementById(id);
        if (lane && needed > (parseFloat(lane.style.minWidth) || 0)) lane.style.minWidth = needed + 'px';
      });
    };

    return {
      panning: () => panning,
      move(clientX, clientY, prevent) {
        const dx = prevX - clientX, dy = prevY - clientY;
        if (!panning && Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        panning = true;
        if (prevent) prevent();
        wrap.scrollLeft += dx;
        if (laneEl) laneEl.scrollTop += dy;
        prevX = clientX;
        prevY = clientY;
        extendLanes();
      }
    };
  }

  wrap.addEventListener('touchstart', (e) => {
    const target = e.target;
    if (target.closest(EXCLUDE)) return;
    const laneEl = target.closest('#seq-lane, #seq-note-lane, #seq-midi-lane');
    if (!laneEl) return;

    const touch = e.changedTouches[0];
    const tid   = touch.identifier;

    // Pen tool: draw note on roll
    if (SEQ.rollTool === 'pen' && laneEl.id === 'seq-midi-lane') {
      e.preventDefault();
      const laneRect  = laneEl.getBoundingClientRect();
      const relX      = touch.clientX - laneRect.left + wrap.scrollLeft;
      const relY      = touch.clientY - laneRect.top  + laneEl.scrollTop;
      const startBeat = rollSnapFloor(relX / BEAT_PX);
      const midi      = Math.max(ROLL_BOT_MIDI, Math.min(ROLL_TOP_MIDI, ROLL_TOP_MIDI - Math.floor(relY / ROLL_ROW_H)));
      const defBeats  = SEQ.rollSnap ? SEQ.rollSnapVal : 0.25;
      const ghost     = document.createElement('div');
      ghost.className = 'roll-note roll-note-ghost';
      ghost.style.left   = (startBeat * BEAT_PX) + 'px';
      ghost.style.top    = (ROLL_TOP_MIDI - midi) * ROLL_ROW_H + 'px';
      ghost.style.height = (ROLL_ROW_H - 1) + 'px';
      ghost.style.width  = (defBeats * BEAT_PX) + 'px';
      laneEl.appendChild(ghost);
      let beats = defBeats;
      const onMove = (ev) => {
        const t = Array.from(ev.changedTouches).find(t => t.identifier === tid);
        if (!t) return;
        ev.preventDefault();
        const rx = t.clientX - laneRect.left + wrap.scrollLeft;
        const raw = Math.max(defBeats, rx / BEAT_PX - startBeat);
        beats = SEQ.rollSnap ? Math.max(SEQ.rollSnapVal, rollSnapBeat(raw)) : Math.max(0.25, Math.round(raw * 4) / 4);
        ghost.style.width = (beats * BEAT_PX) + 'px';
      };
      const onUp = () => {
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend',  onUp);
        document.removeEventListener('touchcancel', onUp);
        ghost.remove();
        seqCheckpoint();
        SEQ.midiItems.push({ midi, label: midiNoteLabel(midi), beats, start: startBeat });
        SEQ.midiItems.sort((a, b) => a.start - b.start);
        seqAutoExtendLoop(startBeat + beats);
        seqRenderMidi();
        seqResyncMidi();
      };
      document.addEventListener('touchmove',   onMove, { passive: false });
      document.addEventListener('touchend',    onUp);
      document.addEventListener('touchcancel', onUp);
      return;
    }

    const pan = startPan(touch.clientX, touch.clientY, laneEl);
    const onMove = (ev) => {
      const t = Array.from(ev.changedTouches).find(t => t.identifier === tid);
      if (!t) return;
      pan.move(t.clientX, t.clientY, () => ev.preventDefault());
    };
    const onUp = () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend',  onUp);
      document.removeEventListener('touchcancel', onUp);
    };
    document.addEventListener('touchmove',   onMove, { passive: false });
    document.addEventListener('touchend',    onUp);
    document.addEventListener('touchcancel', onUp);
  }, { passive: false });

  wrap.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    const target = e.target;
    if (target.closest(EXCLUDE)) return;
    const laneEl = target.closest('#seq-lane, #seq-note-lane, #seq-midi-lane');
    if (!laneEl) return;
    // Click on empty lane area clears selection (unless modifier or pen tool)
    if (!target.closest('.seq-block, .roll-note') && !e.ctrlKey && !e.metaKey && !e.shiftKey
        && !(SEQ.rollTool === 'pen' && laneEl.id === 'seq-midi-lane')) {
      seqClearSelection();
    }

    // Pen tool: draw note on roll background — drag sets duration
    if (SEQ.rollTool === 'pen' && laneEl.id === 'seq-midi-lane') {
      const laneRect = laneEl.getBoundingClientRect();
      const relX = e.clientX - laneRect.left + wrap.scrollLeft;
      const relY = e.clientY - laneRect.top + laneEl.scrollTop;
      const startBeat = rollSnapFloor(relX / BEAT_PX);
      const midi = Math.max(ROLL_BOT_MIDI, Math.min(ROLL_TOP_MIDI, ROLL_TOP_MIDI - Math.floor(relY / ROLL_ROW_H)));
      const defBeats = SEQ.rollSnap ? SEQ.rollSnapVal : 0.25;
      // Ghost element for live preview
      const ghost = document.createElement('div');
      ghost.className = 'roll-note roll-note-ghost';
      ghost.style.left   = (startBeat * BEAT_PX) + 'px';
      ghost.style.top    = (ROLL_TOP_MIDI - midi) * ROLL_ROW_H + 'px';
      ghost.style.height = (ROLL_ROW_H - 1) + 'px';
      ghost.style.width  = (defBeats * BEAT_PX) + 'px';
      laneEl.appendChild(ghost);
      let beats = defBeats;
      const onMove = (ev) => {
        const rx = ev.clientX - laneRect.left + wrap.scrollLeft;
        const raw = Math.max(defBeats, rx / BEAT_PX - startBeat);
        beats = SEQ.rollSnap ? Math.max(SEQ.rollSnapVal, rollSnapBeat(raw)) : Math.max(0.25, Math.round(raw * 4) / 4);
        ghost.style.width = (beats * BEAT_PX) + 'px';
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        ghost.remove();
        seqCheckpoint();
        SEQ.midiItems.push({ midi, label: midiNoteLabel(midi), beats, start: startBeat });
        SEQ.midiItems.sort((a, b) => a.start - b.start);
        seqAutoExtendLoop(startBeat + beats);
        seqRenderMidi();
        seqResyncMidi();
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      return;
    }

    const pan = startPan(e.clientX, e.clientY, laneEl);

    const onMove = (ev) => {
      pan.move(ev.clientX, ev.clientY, null);
      if (pan.panning()) wrap.style.cursor = 'grabbing';
    };
    const onUp = () => {
      wrap.style.cursor = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  });
}

// Lane drag-and-drop
function initSeqMidiLane() {
  const lane = document.getElementById('seq-midi-lane');
  if (!lane) return;
  const _hint = () => lane.querySelector('.seq-drop-hint');
  lane.addEventListener('dragover', (e) => {
    const hasNote  = e.dataTransfer.types.includes('application/x-note');
    const hasChord = e.dataTransfer.types.includes('application/x-chord');
    if (!hasNote && !hasChord) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    lane.classList.add('drag-over');
    const rect  = lane.getBoundingClientRect();
    const beat  = Math.max(0, Math.floor(((e.clientX - rect.left) / BEAT_PX) * 2) / 2);
    const beats = hasChord ? state.beatsPerBar : 1;
    if (hasChord && SEQ._dragChord) {
      seqClearGhost(lane);
      const notes = chordNotesAtY(lane, e.clientY, SEQ._dragChord.interval, SEQ._dragChord.q);
      seqSetRollGhost(lane, beat, beats, notes);
    } else {
      seqClearRollGhost(lane);
      seqSetGhost(lane, beat, beats);
    }
  });
  lane.addEventListener('dragleave', (e) => {
    if (!lane.contains(e.relatedTarget)) { lane.classList.remove('drag-over'); seqClearGhost(lane); seqClearRollGhost(lane); }
  });
  lane.addEventListener('drop', (e) => {
    e.preventDefault();
    lane.classList.remove('drag-over');
    seqClearGhost(lane);
    seqClearRollGhost(lane);
    if (SEQ.midiDragSrcIdx !== null) return;
    const rect = lane.getBoundingClientRect();
    const dropBeat = Math.max(0, Math.floor(((e.clientX - rect.left) / BEAT_PX) * 2) / 2);
    const rawChord = e.dataTransfer.getData('application/x-chord');
    if (rawChord) {
      const data  = JSON.parse(rawChord);
      const notes = chordNotesAtY(lane, e.clientY, data.interval, data.q);
      seqCheckpoint();
      notes.forEach(midi => SEQ.midiItems.push({ midi, label: midiNoteLabel(midi), beats: state.beatsPerBar, start: dropBeat }));
      SEQ.midiItems.sort((a, b) => a.start - b.start);
      seqAutoExtendLoop(dropBeat + state.beatsPerBar);
      seqRenderMidi();
      seqResyncMidi();
      return;
    }
    const raw = e.dataTransfer.getData('application/x-note');
    if (!raw) return;
    const data  = JSON.parse(raw);
    seqCheckpoint();
    SEQ.midiItems.push({ midi: data.midi, label: data.label, beats: 1, start: dropBeat });
    SEQ.midiItems.sort((a, b) => a.start - b.start);
    seqAutoExtendLoop(dropBeat + 1);
    seqRenderMidi();
    seqResyncMidi();
  });
}

function initSeqNoteLane() {
  const lane = document.getElementById('seq-note-lane');
  if (!lane) return;
  const _noteHint = () => lane.querySelector('.seq-drop-hint');
  lane.addEventListener('dragover', (e) => {
    if (!e.dataTransfer.types.includes('application/x-note')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    lane.classList.add('drag-over');
    _noteHint()?.style.setProperty('color', 'var(--accent)');
    const rect = lane.getBoundingClientRect();
    const beat = Math.max(0, Math.floor(((e.clientX - rect.left) / BEAT_PX) * 2) / 2);
    seqSetGhost(lane, beat, 1);
  });
  lane.addEventListener('dragleave', (e) => {
    if (!lane.contains(e.relatedTarget)) { lane.classList.remove('drag-over'); seqClearGhost(lane); }
  });
  lane.addEventListener('drop', (e) => {
    e.preventDefault();
    lane.classList.remove('drag-over');
    _noteHint()?.style.removeProperty('color');
    seqClearGhost(lane);
    if (SEQ.noteDragSrcIdx !== null) return;
    const raw = e.dataTransfer.getData('application/x-note');
    if (!raw) return;
    const data  = JSON.parse(raw);
    const rect  = lane.getBoundingClientRect();
    const dropBeat = Math.max(0, Math.floor(((e.clientX - rect.left) / BEAT_PX) * 2) / 2);
    const start = dropBeat;
    seqCheckpoint();
    SEQ.noteItems.push({ midi: data.midi, label: data.label, beats: 1, start });
    SEQ.noteItems.sort((a, b) => a.start - b.start);
    seqAutoExtendLoop(start + 1);
    seqRenderNotes();
    seqResyncNotes();
  });
}

function initMidiLaneResize() {
  const lane  = document.getElementById('seq-midi-lane');
  const inner = document.querySelector('.seq-tracks-inner');
  if (!lane || !inner) return;

  const handle = document.createElement('div');
  handle.className = 'midi-lane-resize-handle';
  inner.appendChild(handle);

  handle.addEventListener('pointerdown', e => {
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    const startY = e.clientY;
    const startH = lane.getBoundingClientRect().height;
    const onMove = ev => {
      const newH = Math.max(60, Math.min(500, startH + ev.clientY - startY));
      lane.style.maxHeight = newH + 'px';
      ROLL_VIEW_H = newH;
      updateRollOverflow();
      syncTrackLabelHeights();
    };
    const onUp = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
  });
}

function initSeqLane() {
  const lane = document.getElementById('seq-lane');
  if (!lane) return;

  const _chordHint = () => lane.querySelector('.seq-drop-hint');
  lane.addEventListener('dragover', (e) => {
    if (!e.dataTransfer.types.includes('application/x-chord')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    lane.classList.add('drag-over');
    _chordHint()?.style.setProperty('color', 'var(--accent)');
    const rect = lane.getBoundingClientRect();
    const beat = Math.max(0, Math.floor(((e.clientX - rect.left) / BEAT_PX) * 2) / 2);
    seqSetGhost(lane, beat, state.beatsPerBar);
  });
  lane.addEventListener('dragleave', (e) => {
    if (!lane.contains(e.relatedTarget)) { lane.classList.remove('drag-over'); seqClearGhost(lane); }
  });
  lane.addEventListener('drop', (e) => {
    e.preventDefault();
    lane.classList.remove('drag-over');
    _chordHint()?.style.removeProperty('color');
    seqClearGhost(lane);

    // New chord from pad
    const raw = e.dataTransfer.getData('application/x-chord');
    if (!raw) return;
    const data  = JSON.parse(raw);
    const rect  = lane.getBoundingClientRect();
    const dropBeat = Math.max(0, Math.floor(((e.clientX - rect.left) / BEAT_PX) * 2) / 2);
    const start = dropBeat;
    seqCheckpoint();
    SEQ.items.push({
      interval:     data.interval,
      q:            data.q,
      bassInterval: data.bassInterval,
      label:        data.label,
      beats:        state.beatsPerBar,
      start,
      keyRoot:      state.keys[state.currentTemplate],
      template:     state.currentTemplate,
    });
    SEQ.items.sort((a, b) => a.start - b.start);
    seqAutoExtendLoop(start + state.beatsPerBar);
    seqRender();
    seqResyncChords();
  });
}

function initSeqLoopEnd() {
  const handle = document.getElementById('seq-loop-end');
  const lane   = document.getElementById('seq-lane');
  if (!handle || !lane) return;
  handle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handle.setPointerCapture(e.pointerId);
    const onMove = (ev) => {
      const laneRect = lane.getBoundingClientRect();
      const beat = Math.max(1, Math.round((ev.clientX - laneRect.left) / BEAT_PX));
      SEQ.loopEnd = Math.max(beat, SEQ.loopStart + 1);
      seqUpdateLoopEnd();
      if (SEQ.loop) seqResyncAllThrottled();
    };
    const onUp = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      if (SEQ.playing && SEQ.loop) seqLoopBaseChangedResync();
      seqSave();
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
  });
}

function initSeqLoopStart() {
  const handle = document.getElementById('seq-loop-start');
  const lane   = document.getElementById('seq-lane');
  if (!handle || !lane) return;
  handle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handle.setPointerCapture(e.pointerId);
    const onMove = (ev) => {
      const laneRect = lane.getBoundingClientRect();
      const beat = Math.max(0, Math.round((ev.clientX - laneRect.left) / BEAT_PX));
      SEQ.loopStart = Math.min(beat, SEQ.loopEnd - 1);
      seqUpdateLoopStart();
      if (SEQ.loop) seqResyncAllThrottled();
    };
    const onUp = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      if (SEQ.playing && SEQ.loop) seqLoopBaseChangedResync();
      seqSave();
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
  });
}

// ============================================================
// RECORD
// ============================================================
const REC = {
  active: false,
  armed: false,
  startTime: 0,
  rafId: null,
  _precountRaf: null,
  pendingChords: new Map(), // padId → {interval, q, bassInterval, label, keyRoot, template, startBeat}
  pendingNotes:  new Map(), // midi  → {label, startBeat}
  pendingMidi:   new Map(), // midi  → {label, startBeat}  (from external MIDI input)
};

const PRECOUNT = { enabled: true };

function midiNoteLabel(midi) {
  return ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][midi % 12] + (Math.floor(midi / 12) - 1);
}

function recCurrentBeat() {
  const elapsed = getAudioCtx().currentTime - REC.startTime;
  const raw = elapsed / seqBeatDur();
  if (!SEQ.loop) return raw;
  const total = SEQ.loopEnd - SEQ.loopStart;
  return SEQ.loopStart + ((raw % total) + total) % total;
}

function recAnimateBeat() {
  if (!REC.active) return;
  document.getElementById('seq-rec-beat').textContent = (Math.floor(recCurrentBeat()) + 1);
  REC.rafId = requestAnimationFrame(recAnimateBeat);
}

function recArm() {
  REC.armed = true;
  document.getElementById('seq-rec-btn').classList.add('armed');
}

function recDisarm() {
  REC.armed = false;
  document.getElementById('seq-rec-btn').classList.remove('armed');
}

function recActivate(t0) {
  REC.armed = false;
  REC.active = true;
  REC.startTime = t0;
  document.getElementById('seq-rec-btn').classList.remove('armed');
  document.getElementById('seq-rec-btn').classList.add('active');
  recAnimateBeat();
}

function recStop() {
  REC.active = false;
  REC.armed = false;
  REC.pendingChords.clear();
  REC.pendingNotes.clear();
  REC.pendingMidi.clear();
  if (REC.rafId) { cancelAnimationFrame(REC.rafId); REC.rafId = null; }
  if (!SEQ.playing) metroHalt();
  document.getElementById('seq-rec-btn').classList.remove('active');
  document.getElementById('seq-rec-btn').classList.remove('armed');
  document.getElementById('seq-rec-beat').textContent = '';
}

// ============================================================
// METRONOME
// ============================================================
const METRO = {
  enabled: false,        // user toggle
  timer: null,           // only runs during play or rec
  nextTickTime: 0,       // next click scheduled audio time
  nextBeatMusical: 0,    // music beat for next click (integer)
  cycleStart: 0,         // audio time of current cycle's loopStart
  TICK_MS: 25,
  LOOKAHEAD: 0.1,
};

function scheduleMetroClick(time, accent) {
  const ctx = getAudioCtx();
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = accent ? 1200 : 800;
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(accent ? 0.35 : 0.2, time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.06);
}

function metroTick() {
  if (!METRO.enabled || !SEQ.playing) return;
  const ctx = getAudioCtx();
  const bd  = seqBeatDur();
  const horizon = ctx.currentTime + METRO.LOOKAHEAD;
  while (METRO.nextTickTime < horizon) {
    // Accent on absolute bar downbeats (beat % beatsPerBar === 0). A loop
    // that starts mid-bar therefore opens with a LOW tick — the accents
    // remain anchored to the musical bar grid, not to the loop boundary.
    const accent = (METRO.nextBeatMusical % state.beatsPerBar) === 0;
    scheduleMetroClick(METRO.nextTickTime, accent);
    METRO.nextTickTime += bd;
    METRO.nextBeatMusical += 1;
    // When the loop wraps, restart the metronome from the first integer
    // beat inside the new cycle (= ceil(loopStart) relative to loop).
    if (SEQ.loop && METRO.nextBeatMusical >= SEQ.loopEnd) {
      const firstBeat   = Math.ceil(SEQ.loopStart - 1e-9);
      const offsetBeats = firstBeat - SEQ.loopStart;
      const cycleLen    = (SEQ.loopEnd - SEQ.loopStart) * bd;
      METRO.cycleStart += cycleLen;
      METRO.nextBeatMusical = firstBeat;
      METRO.nextTickTime    = METRO.cycleStart + offsetBeats * bd;
    }
  }
}

function metroRun(startAudioTime, startMusicBeat) {
  if (!METRO.enabled || METRO.timer) return;
  const bd = seqBeatDur();
  // Audio time of loopStart music-beat in the *current* cycle. Lets the wrap
  // logic later add full cycle lengths cleanly.
  METRO.cycleStart = startAudioTime - (startMusicBeat - SEQ.loopStart) * bd;
  // First click lands at the next whole beat ≥ startMusicBeat.
  const firstBeat = Math.ceil(startMusicBeat - 1e-9);
  METRO.nextBeatMusical = firstBeat;
  METRO.nextTickTime    = startAudioTime + (firstBeat - startMusicBeat) * bd;
  metroTick();
  METRO.timer = setInterval(metroTick, METRO.TICK_MS);
}

function metroRunSynced() {
  if (!METRO.enabled || METRO.timer) return;
  const ctx = getAudioCtx();
  // SEQ.animBeat tracks the current music-time position; perfect for sync.
  const startBeat = (typeof SEQ.animBeat === 'number') ? SEQ.animBeat : SEQ.loopStart;
  metroRun(ctx.currentTime, startBeat);
}

function metroHalt() {
  if (METRO.timer) { clearInterval(METRO.timer); METRO.timer = null; }
}

// ============================================================
// INIT
// ============================================================
buildKeyTracks();
rebuildBoard();
updateControlDisplays();

const midiLed = document.getElementById('midi-led');
// MIDI is always-on now (global toggle removed). Initialize Web MIDI access
// on load so per-track input/output port selectors find devices straight away.
state.midiEnabled = true;
if (midiLed) midiLed.style.display = '';
document.getElementById('hint-panic')?.style.setProperty('display', '');
if (navigator.requestMIDIAccess) {
  initMIDI().catch(() => {/* user can still use the app without MIDI */});
}

document.getElementById('play-style-select').addEventListener('change', (e) => {
  state.playStyle = e.target.value;
  const hasPattern = !['off', 'strum-up', 'strum-down'].includes(state.playStyle);
  document.getElementById('tempo-control').style.display = hasPattern ? '' : 'none';
});
function applyTempoChange() {
  document.getElementById('seq-tempo-val').value = state.tempo;
  document.getElementById('ctrl-tempo').value    = state.tempo;
  if (!SEQ.playing) return;

  // Re-anchor + reschedule under the new tempo. Without re-anchoring, the
  // scheduler treats the entire elapsed time as if it ran at the new tempo
  // — wrong, and you get phase jumps / overlapping notes.
  const ctx = getAudioCtx();
  SEQ.activeNodes.forEach(n => stopAudioNote(n));
  SEQ.activeNodes.clear();
  panic();
  seqHighlight(-1);
  seqHighlightNote(-1);
  seqLoopBaseChangedResync();

  // Re-align visual cursor to audio scheduling time. Mirrors what we do at
  // play-start (animLastTime = t0): each rAF subtracts `lat` from `now`, so
  // the `lat` term must NOT be baked into animLastTime — otherwise it
  // cancels and visualLatencyMs stops compensating. The result was the
  // cursor pulling ahead of audio after a tempo change (worse at higher
  // tempo, because the cancelled-out lag is a constant ms and bigger
  // relative to a smaller beat).
  SEQ.animLastTime = ctx.currentTime;
  seqSave();
}

document.getElementById('tempo-down').addEventListener('click', () => {
  state.tempo = Math.max(40, state.tempo - 5);
  applyTempoChange();
});
document.getElementById('tempo-up').addEventListener('click', () => {
  state.tempo = Math.min(240, state.tempo + 5);
  applyTempoChange();
});

// ============================================================
// KEYBOARD
// ============================================================
const KB_WHITE_PCS = new Set([0, 2, 4, 5, 7, 9, 11]);
const KB_START     = 21;  // A0
const KB_END       = 108; // C8
const KB_WW        = 28;  // white key width px (fixed, keyboard scrolls)
const KB_WH        = 72;
const KB_BW        = 17;
const KB_BH        = 44;

const kbActive = new Map(); // midi → audioNode

function kbNoteOn(midi, sendMidi = true) {
  if (kbActive.has(midi)) return;
  const node = startAudioNote(midi, state.velocity);
  if (sendMidi) sendNoteOn(midi, state.velocity);
  kbActive.set(midi, node);
  document.querySelector(`.kb-key[data-midi="${midi}"]`)?.classList.add('active');
  if (REC.active) {
    const rawBeat = Math.round(recCurrentBeat() * 2) / 2;
    const startBeat = SEQ.loop ? rawBeat % SEQ.loopEnd : rawBeat;
    if (sendMidi) {
      REC.pendingNotes.set(midi, { label: midiNoteLabel(midi), startBeat });
    } else {
      const rawBeatMidi = recCurrentBeat();
      const startBeatMidi = SEQ.loop ? rawBeatMidi % SEQ.loopEnd : rawBeatMidi;
      REC.pendingMidi.set(midi, { label: midiNoteLabel(midi), startBeat: startBeatMidi });
    }
  }
}

function kbNoteOff(midi, sendMidi = true) {
  const node = kbActive.get(midi);
  if (!node) return;
  stopAudioNote(node);
  if (sendMidi) sendNoteOff(midi);
  kbActive.delete(midi);
  document.querySelector(`.kb-key[data-midi="${midi}"]`)?.classList.remove('active');
  if (REC.active && REC.pendingNotes.has(midi)) {
    const p = REC.pendingNotes.get(midi);
    const beats = Math.max(0.5, Math.round(recCurrentBeat() * 2) / 2 - p.startBeat) || 0.5;
    const trk = ensureTrackOfKind('free');
    trk.items.push(makeClip({
      start: p.startBeat, beats, label: p.label,
      notes: [{ midi, label: p.label, start: 0, beats }],
    }));
    trk.items.sort((a, b) => a.start - b.start);
    seqAutoExtendLoop(p.startBeat + beats);
    seqRenderTrack(trk);
    seqResyncTrack(trk);
    REC.pendingNotes.delete(midi);
  }
  if (REC.active && REC.pendingMidi.has(midi)) {
    const p = REC.pendingMidi.get(midi);
    const beats = Math.max(0.1, recCurrentBeat() - p.startBeat);
    const trk = ensureTrackOfKind('free');
    trk.items.push(makeClip({
      start: p.startBeat, beats, label: p.label,
      notes: [{ midi, label: p.label, start: 0, beats }],
    }));
    trk.items.sort((a, b) => a.start - b.start);
    seqAutoExtendLoop(p.startBeat + beats);
    seqRenderTrack(trk);
    seqResyncTrack(trk);
    REC.pendingMidi.delete(midi);
  }
}

function initKbDragStrip() {
  const nav   = document.getElementById('kb-scroll-nav');
  const thumb = document.getElementById('kb-drag-thumb');
  const track = nav?.querySelector('.kb-scroll-track');
  const wrap  = nav?.closest('.keyboard-panel')?.querySelector('.kb-wrap');
  if (!nav || !wrap) return;

  function updateThumb() {
    if (!thumb || !track) return;
    // Hide the whole scroll-nav strip when the keyboard isn't scrollable.
    const scrollable = wrap.scrollWidth > wrap.clientWidth + 1;
    nav.style.display = scrollable ? '' : 'none';
    if (!scrollable) return;
    const ratio      = wrap.clientWidth / wrap.scrollWidth;
    const thumbW     = Math.max(20, track.clientWidth * ratio);
    const maxLeft    = track.clientWidth - thumbW;
    const scrollFrac = wrap.scrollLeft / (wrap.scrollWidth - wrap.clientWidth || 1);
    thumb.style.width = thumbW + 'px';
    thumb.style.left  = (scrollFrac * maxLeft) + 'px';
  }
  wrap.addEventListener('scroll', updateThumb);
  requestAnimationFrame(updateThumb);
  // Re-check on resize — keyboard might become scrollable / not.
  window.addEventListener('resize', updateThumb);

  // Drag on the track scrolls proportionally
  function startTrackDrag(clientX) {
    const startX      = clientX;
    const startScroll = wrap.scrollLeft;
    const scale       = (wrap.scrollWidth - wrap.clientWidth) / (track.clientWidth - (thumb?.clientWidth ?? 0) || 1);
    return (x) => { wrap.scrollLeft = startScroll + (x - startX) * scale; };
  }

  if (track) {
    track.addEventListener('touchstart', (e) => {
      const move = startTrackDrag(e.touches[0].clientX);
      const onMove = (ev) => move(ev.touches[0].clientX);
      const onEnd  = () => { track.removeEventListener('touchmove', onMove); track.removeEventListener('touchend', onEnd); };
      track.addEventListener('touchmove',   onMove, { passive: true });
      track.addEventListener('touchend',    onEnd);
      track.addEventListener('touchcancel', onEnd);
    }, { passive: true });

    track.addEventListener('mousedown', (e) => {
      const move = startTrackDrag(e.clientX);
      const onMove = (ev) => move(ev.clientX);
      const onUp   = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup',   onUp);
    });
  }

  // Arrow buttons — continuous RAF scroll while held, pointer capture prevents mouseleave jank
  function holdScroll(btn, dir) {
    let rafId = null;
    const tick  = () => { wrap.scrollLeft += dir * 4; rafId = requestAnimationFrame(tick); };
    const start = (e) => { e.preventDefault(); btn.setPointerCapture(e.pointerId); if (!rafId) rafId = requestAnimationFrame(tick); };
    const stop  = () => { cancelAnimationFrame(rafId); rafId = null; };
    btn.addEventListener('pointerdown',  start);
    btn.addEventListener('pointerup',    stop);
    btn.addEventListener('pointercancel', stop);
  }

  holdScroll(document.getElementById('kb-scroll-left'),  -1);
  holdScroll(document.getElementById('kb-scroll-right'),  1);
}

function initTouchGlide() {
  // Keyboard glide
  const kbWrap = document.getElementById('kb-container')?.parentElement;
  if (kbWrap) {
    let glideMidi = null;
    kbWrap.addEventListener('touchmove', (e) => {
      const t   = e.touches[0];
      const el  = document.elementFromPoint(t.clientX, t.clientY);
      const key = el?.closest('.kb-key');
      const midi = key ? +key.dataset.midi : null;
      if (midi === glideMidi) return;
      if (glideMidi !== null) kbNoteOff(glideMidi);
      glideMidi = midi;
      if (midi !== null && !kbActive.has(midi)) kbNoteOn(midi);
    }, { passive: true });
    const kbGlideEnd = () => { if (glideMidi !== null) { kbNoteOff(glideMidi); glideMidi = null; } };
    kbWrap.addEventListener('touchend',    kbGlideEnd);
    kbWrap.addEventListener('touchcancel', kbGlideEnd);
  }

  // Chord pad glide — attach to app root so bubbling from any page works
  const app = document.querySelector('.app');
  if (!app) return;
  let glidePadId = null;
  app.addEventListener('touchmove', (e) => {
    const t   = e.touches[0];
    const el  = document.elementFromPoint(t.clientX, t.clientY);
    const pad = el?.closest('.pad[data-interval]');
    const padId = pad?.id ?? null;
    if (padId === glidePadId) return;
    if (glidePadId !== null) releaseChord(glidePadId);
    glidePadId = padId;
    if (pad && !state.activeChords.has(padId)) {
      const interval     = +pad.dataset.interval;
      const q            = pad.dataset.q;
      const bassInterval = pad.dataset.bassInterval !== '' ? +pad.dataset.bassInterval : undefined;
      playChord(padId, interval, q, bassInterval);
    }
  }, { passive: true });
  const padGlideEnd = () => { if (glidePadId !== null) { releaseChord(glidePadId); glidePadId = null; } };
  app.addEventListener('touchend',    padGlideEnd);
  app.addEventListener('touchcancel', padGlideEnd);
}

function buildKeyboard() {
  const container = document.getElementById('kb-container');
  if (!container) return;
  if (document.getElementById('keyboard-panel').classList.contains('collapsed')) return;

  container.innerHTML = '';
  container.style.height = KB_WH + 'px';

  let whiteIdx = 0;
  // First pass: count total whites to set container width
  let totalWhites = 0;
  for (let m = KB_START; m <= KB_END; m++) if (KB_WHITE_PCS.has(m % 12)) totalWhites++;
  container.style.width = (totalWhites * KB_WW) + 'px';

  for (let midi = KB_START; midi <= KB_END; midi++) {
    const pc      = midi % 12;
    const isWhite = KB_WHITE_PCS.has(pc);
    const octave  = Math.floor(midi / 12) - 1;
    const key     = document.createElement('div');
    key.dataset.midi = midi;

    if (isWhite) {
      key.className  = 'kb-key kb-white';
      key.style.left   = (whiteIdx * KB_WW) + 'px';
      key.style.width  = (KB_WW - 1) + 'px';
      key.style.height = KB_WH + 'px';
      if (pc === 0) {
        const lbl = document.createElement('span');
        lbl.className   = 'kb-note-label';
        lbl.textContent = `C${octave}`;
        key.appendChild(lbl);
      }
      whiteIdx++;
    } else {
      key.className  = 'kb-key kb-black';
      key.style.left   = Math.round(whiteIdx * KB_WW - KB_BW / 2) + 'px';
      key.style.width  = KB_BW + 'px';
      key.style.height = KB_BH + 'px';
    }

    addKbHandlers(key, midi);
    container.appendChild(key);
  }

  // Scroll so C4 (MIDI 60) is centered
  const f4WhiteIdx = 26;
  const wrap = container.parentElement;
  wrap.scrollLeft = f4WhiteIdx * KB_WW - wrap.clientWidth / 2;
}

function addKbHandlers(key, midi) {
  key.draggable = true;
  key.addEventListener('dragstart', (e) => {
    e.stopPropagation();
    if (!seqIsOpen()) { e.preventDefault(); return; }
    const label = midiNoteName(midi);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/x-note', JSON.stringify({ midi, label }));
    SEQ._dragLabel = label;
    const ghost = document.createElement('div');
    ghost.textContent = label;
    ghost.style.cssText = 'position:fixed;top:-999px;padding:3px 7px;background:#1a1b1e;border:1px solid rgba(255,255,255,0.2);border-radius:4px;color:#fff;font-family:monospace;font-size:11px;white-space:nowrap';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, ghost.offsetHeight / 2);
    setTimeout(() => ghost.remove(), 0);
    document.body.classList.add('seq-dragging-note');
    setTimeout(() => document.querySelector('#seq-note-lane .seq-drop-hint')?.style.setProperty('color', 'var(--accent)'), 0);
  });
  key.addEventListener('dragend', () => {
    document.body.classList.remove('seq-dragging-note');
    document.querySelector('#seq-note-lane .seq-drop-hint')?.style.removeProperty('color');
  });
  key.addEventListener('pointerdown',  () => kbNoteOn(midi));
  key.addEventListener('pointerup',    () => kbNoteOff(midi));
  key.addEventListener('pointerleave', () => kbNoteOff(midi));
  key.addEventListener('pointercancel',() => kbNoteOff(midi));
  key.addEventListener('pointerenter', (e) => { if (e.buttons > 0) kbNoteOn(midi); });
  seqAddTouchDrag(key, 'seq-note-lane', () => ({ midi, label: midiNoteName(midi) }), () => kbNoteOff(midi));
}


// Trem Rate tempo sync
document.getElementById('trem-sync').addEventListener('click', () => {
  const T = state.tempo;
  const candidates = [T/240, T/120, T/80, T/60, T/40, T/30, T/20, T/15];
  const current = state.synth.tremoloRate;
  const nearest = candidates.reduce((best, c) =>
    Math.abs(c - current) < Math.abs(best - current) ? c : best
  );
  const el = document.getElementById('synth-trem-rate');
  el.value = Math.max(0, Math.min(100, invTremRate(nearest)));
  el.dispatchEvent(new Event('input'));
});

// Vib Rate tempo sync
document.getElementById('vib-rate-sync').addEventListener('click', () => {
  const T = state.tempo;
  const candidates = [T/240, T/120, T/80, T/60, T/40, T/30, T/20, T/15];
  const current = state.synth.vibratoRate;
  const nearest = candidates.reduce((best, c) =>
    Math.abs(c - current) < Math.abs(best - current) ? c : best
  );
  const el = document.getElementById('synth-vib-rate');
  el.value = Math.max(0, Math.min(100, invVibRate(nearest)));
  el.dispatchEvent(new Event('input'));
});

// Dly Time tempo sync
document.getElementById('dly-time-sync').addEventListener('click', () => {
  const T = state.tempo;
  // half, dotted-quarter, quarter, dotted-eighth, quarter-triplet, eighth, eighth-triplet, 16th
  const candidates = [120/T, 90/T, 60/T, 45/T, 40/T, 30/T, 20/T, 15/T].filter(v => v >= 0.05 && v <= 1.0);
  const current = state.synth.delayTime;
  const nearest = candidates.reduce((best, c) =>
    Math.abs(c - current) < Math.abs(best - current) ? c : best
  );
  const el = document.getElementById('synth-dly-time');
  el.value = Math.max(0, Math.min(100, invDlyTime(nearest)));
  el.dispatchEvent(new Event('input'));
});

// Sequencer controls

document.getElementById('seq-play-btn').addEventListener('click', () => {
  if (SEQ.playing) seqStop(); else seqPlay();
});

document.getElementById('seq-rec-btn').addEventListener('click', () => {
  if (REC.active) recStop();
  else if (REC.armed) recDisarm();
  else if (SEQ.playing) recActivate(SEQ.playStartTime + 0.05);
  else recArm();
});

document.getElementById('seq-metro-btn').addEventListener('click', () => {
  METRO.enabled = !METRO.enabled;
  document.getElementById('seq-metro-btn').classList.toggle('active', METRO.enabled);
  if (!METRO.enabled) {
    metroHalt();
  } else if (SEQ.playing || REC.active) {
    metroRunSynced();
  }
});

function seqUpdateBarLine() {
  document.documentElement.style.setProperty('--bar-px',  (state.beatsPerBar * BEAT_PX) + 'px');
  document.documentElement.style.setProperty('--beat-px', BEAT_PX + 'px');
  prUpdateGridVars();
  seqRenderRuler();
}

function seqRenderRuler() {
  const ruler = document.getElementById('seq-ruler');
  if (!ruler) return;
  // Extend the ruler well past the visible area so panning to the right
  // never reveals "blank" territory without bar markers / lane canvas.
  const wrap = document.getElementById('seq-lane-wrap');
  const visibleW = wrap ? wrap.clientWidth : 0;
  let trackMax = 0;
  for (const tr of SEQ.tracksList) trackMax = Math.max(trackMax, seqLaneWidth(tr.items));
  const bpb = state.beatsPerBar;
  const extraBars = 32; // empty pannable territory after the last clip
  const rawWidth = Math.max(
    trackMax + extraBars * bpb * BEAT_PX,
    seqLaneWidth(SEQ.items),
    seqLaneWidth(SEQ.noteItems),
    seqLaneWidth(SEQ.midiItems),
    visibleW + extraBars * bpb * BEAT_PX,
    4 * BEAT_PX + 64
  );
  // Round up to a full bar so the grid pattern's rightmost bar-line lands
  // exactly at the lane edge (instead of being clipped off mid-tile).
  const totalBars = Math.ceil(rawWidth / (bpb * BEAT_PX));
  const widthPx   = totalBars * bpb * BEAT_PX;
  ruler.style.width = widthPx + 'px';
  // Stretch the tracks-inner container so every lane fills the full ruler
  // width, otherwise panning past the last clip shows empty/half-rendered
  // territory beyond the lane's bottom border.
  const innerEl = document.getElementById('seq-tracks-inner');
  if (innerEl) innerEl.style.minWidth = widthPx + 'px';
  let html = '';
  for (let bar = 0; bar < totalBars; bar++) {
    const left = bar * bpb * BEAT_PX;
    html += `<div class="seq-ruler-bar" style="left:${left}px"><span>${bar + 1}</span></div>`;
    for (let b = 1; b < bpb; b++) {
      html += `<div class="seq-ruler-beat" style="left:${left + b * BEAT_PX}px"></div>`;
    }
  }
  ruler.innerHTML = html;
  _appendRulerLoopHandles();
  if (!ruler.dataset.clickInit) {
    ruler.dataset.clickInit = '1';
    let downX = null, downY = null, downTarget = null;
    ruler.addEventListener('pointerdown', (e) => {
      downX = e.clientX; downY = e.clientY; downTarget = e.target;
    });
    ruler.addEventListener('pointerup', (e) => {
      if (downX == null) return;
      const dx = Math.abs(e.clientX - downX);
      const dy = Math.abs(e.clientY - downY);
      const target = downTarget; downX = downY = null; downTarget = null;
      if (dx > 3 || dy > 3) return; // it was a drag — ignore
      if (target?.classList?.contains('seq-loop-bar-left') ||
          target?.classList?.contains('seq-loop-bar-right')) return;
      const rect = ruler.getBoundingClientRect();
      const beat = Math.max(0, Math.round((e.clientX - rect.left) / BEAT_PX * 2) / 2);
      SEQ.startBeat = beat;
      SEQ.animBeat  = beat;
      document.querySelectorAll('.seq-playhead').forEach(ph => {
        ph.style.display = 'block';
        ph.style.left = (beat * BEAT_PX) + 'px';
      });
    });
  }
}

// Scroll-on-hover: cycle through the time-signature <option>s with the wheel.
(function _initTimesigWheel() {
  const sel = document.getElementById('seq-timesig');
  if (!sel) return;
  sel.addEventListener('wheel', (e) => {
    e.preventDefault();
    const opts = sel.options;
    const dir = Math.sign(e.deltaY) > 0 ? -1 : 1;
    const next = Math.max(0, Math.min(opts.length - 1, sel.selectedIndex + dir));
    if (next !== sel.selectedIndex) {
      sel.selectedIndex = next;
      sel.dispatchEvent(new Event('change'));
    }
  }, { passive: false });
})();
// Scroll-on-hover for the two tempo inputs (header settings + track toolbar).
// MIDI Clock sync controls (toggle + port select next to tempo).
(function _initMidiClockSync() {
  const toggle = document.getElementById('seq-clock-toggle');
  const sel    = document.getElementById('seq-clock-port');
  if (!toggle || !sel) return;
  const sync = () => {
    toggle.classList.toggle('active', !!state.midiClockEnabled);
    toggle.textContent = state.midiClockEnabled ? 'Sync ON' : 'Sync';
    const tempoInputs = document.querySelectorAll('#ctrl-tempo, #seq-tempo-val');
    tempoInputs.forEach(el => el.disabled = !!state.midiClockEnabled);
    sel.value = state.midiClockPortId || '';
  };
  const rebuild = () => {
    const inputs = state.midiAccess ? Array.from(state.midiAccess.inputs.values()) : [];
    sel.innerHTML = '<option value="">— none —</option>'
      + inputs.map(p => `<option value="${p.id}"${p.id === (state.midiClockPortId || '') ? ' selected' : ''}>${p.name}</option>`).join('');
    sync();
  };
  rebuild();
  document.addEventListener('chordpad:midi-ports-changed', rebuild);
  toggle.addEventListener('click', () => {
    state.midiClockEnabled = !state.midiClockEnabled;
    if (state.midiClockEnabled && !state.midiClockPortId) {
      // Auto-pick the first available input if none chosen yet.
      const first = state.midiAccess ? state.midiAccess.inputs.values().next().value : null;
      if (first) state.midiClockPortId = first.id;
    }
    _midiClock.intervals.length = 0; _midiClock.lastTickAt = 0;
    attachMidiInput();
    sync();
    seqSave();
  });
  sel.addEventListener('change', () => {
    state.midiClockPortId = sel.value;
    _midiClock.intervals.length = 0; _midiClock.lastTickAt = 0;
    attachMidiInput();
    seqSave();
  });
})();

(function _initTempoWheel() {
  const ids = ['ctrl-tempo', 'seq-tempo-val'];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      const step = e.shiftKey ? 1 : 5;
      const dir = Math.sign(e.deltaY) > 0 ? -1 : 1;
      const cur = parseInt(el.value, 10) || state.tempo;
      const next = Math.max(40, Math.min(240, cur + dir * step));
      if (next !== cur) {
        state.tempo = next;
        applyTempoChange();
      }
    }, { passive: false });
  }
})();
document.getElementById('seq-timesig').addEventListener('change', (e) => {
  state.beatsPerBar = parseInt(e.target.value);
  seqUpdateBarLine();
  if (SEQ.items.length === 0 && SEQ.noteItems.length === 0 && SEQ.midiItems.length === 0) {
    SEQ.loopStart = 0;
    SEQ.loopEnd   = state.beatsPerBar;
    seqUpdateLoopStart();
    seqUpdateLoopEnd();
  }
  seqSave();
});

document.getElementById('seq-loop-btn').addEventListener('click', () => {
  SEQ.loop = !SEQ.loop;
  document.getElementById('seq-loop-btn').classList.toggle('active', SEQ.loop);
  seqUpdateLoopVisible();
  seqSave();

  // Refresh per-track scheduling so playback either picks up the loop right
  // away (turning ON) or stops repeating at the loop end (turning OFF).
  // Without this, tracks whose pendingTime was Infinity (= "done playing")
  // stay silent when loop is enabled mid-session.
  if (SEQ.playing) seqLoopBaseChangedResync();
});


document.getElementById('seq-clear-btn')?.addEventListener('click', () => {
  seqStop();
  if (SEQ.items.length || SEQ.noteItems.length || SEQ.midiItems.length) seqCheckpoint();
  SEQ.items = [];
  SEQ.noteItems = [];
  SEQ.midiItems = [];
  seqRender();
  seqRenderNotes();
  seqRenderMidi();
});

document.getElementById('seq-tempo-down').addEventListener('click', () => {
  state.tempo = Math.max(40, state.tempo - 5);
  applyTempoChange();
});
document.getElementById('seq-tempo-up').addEventListener('click', () => {
  state.tempo = Math.min(240, state.tempo + 5);
  applyTempoChange();
});

function handleTempoInput(el) {
  el.addEventListener('change', () => {
    const v = parseInt(el.value, 10);
    if (!isNaN(v)) { state.tempo = Math.max(40, Math.min(240, v)); applyTempoChange(); }
  });
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter') el.blur(); });
}
handleTempoInput(document.getElementById('seq-tempo-val'));
handleTempoInput(document.getElementById('ctrl-tempo'));

// Apply default instrument preset and sync dropdown
document.getElementById('synth-instrument').value = state.instrument;
if (state.instrument !== 'synth') {
  applySynthPreset(INSTRUMENT_PRESETS[state.instrument]);
  preloadSamplesOnGesture(state.instrument);
}
updateSynthOnlyVisibility();

buildKeyboard();
initKbDragStrip();
initTouchGlide();
initSeqLane();
initSeqNoteLane();
initSeqMidiLane();
initMidiLaneResize();
initSeqLanePan();
initSeqPinchZoom();
seqLoad();
// Tracks may have midiInPortId configured; re-attach now that they exist.
if (state.midiAccess) attachMidiInput();
// Push initial CC#7 to every MIDI-routed track so receivers start at the
// stored volume rather than the synth default.
function _initialCcSyncWhenReady() {
  if (!state.midiAccess) { setTimeout(_initialCcSyncWhenReady, 200); return; }
  for (const t of SEQ.tracksList) if (t.output === 'midi') sendTrackChannelVolume(t);
}
_initialCcSyncWhenReady();
seqInitTrackSynths();
rebuildTracksUI();
seqUpdateBarLine();
seqUpdateLoopStart();
document.getElementById('seq-timesig').value  = String(state.beatsPerBar);
document.getElementById('seq-tempo-val').value = state.tempo;
document.getElementById('ctrl-tempo').value    = state.tempo;
document.getElementById('seq-loop-btn').classList.toggle('active', SEQ.loop);
seqRender();
seqRenderNotes();
seqRenderMidi();
seqRenderAll(); // render any extra tracks too
syncTrackLabelHeights();
refreshLucide();
requestAnimationFrame(seqUpdateHints);

// Find or create the lane DOM element for a track.
// Per-track instrument-settings modal. Sliders bind directly to track.synth
// so each track keeps its own ADSR / filter / FX values, even if multiple
// tracks share the same instrument preset.
// curve: 1 = linear; >1 = log-like (most of slider = short, top = long)
// synthOnly: only show this slider when track.instrument === 'synth'
// sync: 'rate' (Hz, snaps to tempo subdivision) | 'time' (seconds) | undefined
const TRACK_FX_FIELDS = [
  // [key, label, min, max, curve, format, synthOnly, sync]
  ['attack',         'Attack',          0,    15,    3,   v => v < 1 ? Math.round(v * 1000) + 'ms' : v.toFixed(2) + 's'],
  ['decay',          'Decay',           0,    30,    3,   v => v < 1 ? Math.round(v * 1000) + 'ms' : v.toFixed(2) + 's'],
  ['sustain',        'Sustain',         0,    1,     1,   v => Math.round(v * 100) + '%'],
  ['release',        'Release',         0,    30,    3,   v => v < 1 ? Math.round(v * 1000) + 'ms' : v.toFixed(2) + 's'],
  ['filterFreq',     'Tone',          100,    15000, 2.5, v => Math.round(v) + 'Hz'],
  ['filterQ',        'Resonance',       0.1, 20,     2,   v => v.toFixed(1)],
  ['filterLfoDepth', 'Filter LFO',      0,    2000,  2,   v => Math.round(v) + 'c',                            true],
  ['overtones',      'Overtones',       0,    1,     1,   v => Math.round(v * 100) + '%',                      true],
  ['detune',         'Detune',          0,    50,    1,   v => v.toFixed(1) + 'c',                             true],
  ['vibratoRate',    'Vibrato rate',    0.1, 12,     1,   v => v.toFixed(1) + 'Hz',                            false, 'rate'],
  ['vibratoDepth',   'Vibrato depth',   0,    100,   1,   v => Math.round(v) + 'c'],
  ['tremoloRate',    'Tremolo rate',    0.1, 12,     1,   v => v.toFixed(1) + 'Hz',                            false, 'rate'],
  ['tremoloDepth',   'Tremolo depth',   0,    1,     1,   v => Math.round(v * 100) + '%'],
  ['delayTime',      'Delay time',      0,    1.5,   1,   v => v.toFixed(2) + 's',                             false, 'time'],
  ['delayFeedback',  'Delay feedback',  0,    0.95,  1,   v => Math.round(v * 100) + '%'],
  ['delayWet',       'Delay mix',       0,    1,     1,   v => Math.round(v * 100) + '%'],
  ['reverb',         'Reverb',          0,    1,     1,   v => Math.round(v * 100) + '%'],
];

// Snap to musical durations of [1/4, 1/2, 1, 2, 3, 4] beats. For rate
// sliders that's frequency = 1 / (beats * secPerBeat); for time sliders
// it's seconds = beats * secPerBeat.
function fxTempoSnap(kind, current) {
  const T = state.tempo;
  const secPerBeat = 60 / T;
  const beatVals = [0.25, 0.5, 1, 2, 3, 4];
  if (kind === 'rate') {
    const candidates = beatVals.map(b => 1 / (b * secPerBeat));
    return candidates.reduce((best, c) => Math.abs(c - current) < Math.abs(best - current) ? c : best);
  } else if (kind === 'time') {
    const candidates = beatVals.map(b => b * secPerBeat);
    return candidates.reduce((best, c) => Math.abs(c - current) < Math.abs(best - current) ? c : best);
  }
  return current;
}
// Convert between normalized [0..1000] slider position and actual value via
// the field's curve exponent (1 = linear, >1 = log-like).
function fxSliderToVal(min, max, curve, slider) {
  const norm = Math.max(0, Math.min(1, slider / 1000));
  return min + (max - min) * Math.pow(norm, curve);
}
function fxValToSlider(min, max, curve, value) {
  const v = Math.max(min, Math.min(max, value));
  if (max === min) return 0;
  const norm = Math.pow((v - min) / (max - min), 1 / curve);
  return Math.round(norm * 1000);
}
function openTrackFxModal(track) {
  const modal = document.getElementById('track-fx-modal');
  const body  = document.getElementById('track-fx-body');
  const title = document.getElementById('track-fx-title');
  if (!modal || !body || !title) return;
  modal.dataset.trackId = track.id;
  // Show the modal up front. (Used to be at the end of the function, but the
  // MIDI-output branch returns early before that line, which left the modal
  // invisible the first time you opened it on a MIDI-routed track.)
  modal.hidden = false;
  // Clean up any submenus that were hoisted to body in a previous open.
  document.querySelectorAll('body > .track-fx-inst-submenu').forEach(sm => sm.remove());
  // Ensure the track has its own synth dict (pad-linked first-chord may be null)
  if (!track.synth) track.synth = { ...state.synth };
  title.textContent = track.name + ' · settings';
  body.innerHTML = '';
  const preset = INSTRUMENT_PRESETS?.[track.instrument] || INSTRUMENT_PRESETS?.epiano;
  const sliderEls = {};
  // Tiny ADSR diagram in the modal header — recalculated on every A/D/S/R
  // change so the curve mirrors the slider state.
  const adsrPath = document.getElementById('track-fx-adsr-path');
  const adsrDividers = document.getElementById('track-fx-adsr-dividers');
  const adsrLabels   = document.getElementById('track-fx-adsr-labels');
  const updateAdsr = () => {
    if (!adsrPath) return;
    const W = 60, H = 40;
    const TOP = 10; // reserved for letters
    // Visual scaling uses "typical" maxes so common values fill the diagram
    // nicely. Actual slider ranges go higher (15s/30s) but those would make
    // the curve look unbalanced if normalised to full range.
    const a = Math.min(track.synth.attack  ?? 0.1, 4)  / 4;
    const d = Math.min(track.synth.decay   ?? 0.5, 8)  / 8;
    const s = Math.max(0, Math.min(track.synth.sustain ?? 0.4, 1));
    const r = Math.min(track.synth.release ?? 1,   6)  / 6;
    const total = a + d + 1 + r;
    const aPx = (a / total) * W;
    const dPx = (d / total) * W;
    const sPx = (1 / total) * W;
    const rPx = (r / total) * W;
    const peakY    = TOP + 2;
    const baseY    = H - 2;
    const sustainY = baseY - (baseY - peakY) * s;
    const x0 = 0;
    const x1 = x0 + aPx;
    const x2 = x1 + dPx;
    const x3 = x2 + sPx;
    const x4 = x3 + rPx;
    const stroked =
      `M ${x0} ${baseY}` +
      ` L ${x1} ${peakY}` +
      ` Q ${x1} ${sustainY} ${x2} ${sustainY}` +
      ` L ${x3} ${sustainY}` +
      ` Q ${x3} ${baseY} ${x4} ${baseY}`;
    adsrPath.setAttribute('d', stroked);
    const fillEl = document.getElementById('track-fx-adsr-fill');
    if (fillEl) fillEl.setAttribute('d', stroked + ' Z');
    // Dividers
    if (adsrDividers) {
      adsrDividers.innerHTML = [x1, x2, x3].map(x =>
        `<line x1="${x}" y1="${TOP}" x2="${x}" y2="${baseY}" stroke="rgba(255,255,255,0.18)" stroke-width="0.5" stroke-dasharray="1 1"/>`
      ).join('');
    }
    // Section labels — placed at section midpoints, but pushed apart so they
    // never overlap. Each letter keeps its ideal position when there's room.
    if (adsrLabels) {
      const letters = ['A', 'D', 'S', 'R'];
      const ideals = [(x0 + x1) / 2, (x1 + x2) / 2, (x2 + x3) / 2, (x3 + x4) / 2];
      const letterW = 5; // approx glyph width at font-size 9
      const minGap  = letterW;
      const positions = [];
      // Left → right pass: each label is at least minGap right of previous
      for (let i = 0; i < ideals.length; i++) {
        const minX = i === 0 ? letterW / 2 : positions[i - 1] + minGap;
        positions[i] = Math.max(ideals[i], minX);
      }
      // Right → left pass: clamp from the right so labels don't fall off-edge
      for (let i = ideals.length - 1; i >= 0; i--) {
        const maxX = i === ideals.length - 1 ? W - letterW / 2 : positions[i + 1] - minGap;
        positions[i] = Math.min(positions[i], maxX);
      }
      adsrLabels.innerHTML = letters.map((letter, i) =>
        `<text x="${positions[i]}" y="8" text-anchor="middle" fill="rgba(255,255,255,0.55)" font-size="9" font-family="JetBrains Mono, monospace">${letter}</text>`
      ).join('');
    }
  };
  // Output row — toggle between in-app instrument and external MIDI. When
  // MIDI is selected, a small "Ch [n]" textfield appears inline next to the
  // toggle for the channel number. No in-app synth params follow in MIDI mode.
  const outRow = document.createElement('div');
  outRow.className = 'track-fx-row track-fx-row-select';
  outRow.innerHTML = `
    <label class="track-fx-label">Output</label>
    <div class="track-fx-output-toggle">
      <button class="track-fx-out-btn${track.output !== 'midi' ? ' active' : ''}" data-out="instrument">Instrument</button>
      <button class="track-fx-out-btn${track.output === 'midi' ? ' active' : ''}" data-out="midi">MIDI</button>
    </div>
  `;
  // MIDI output port selector — second row under Output when MIDI mode.
  const portRow = document.createElement('div');
  portRow.className = 'track-fx-row track-fx-row-select track-fx-port-row';
  if (track.output !== 'midi') portRow.classList.add('hidden');
  const ports = state.midiAccess ? Array.from(state.midiAccess.outputs.values()) : [];
  portRow.innerHTML = `
    <label class="track-fx-label">MIDI out</label>
    <select class="track-fx-select track-fx-port-select" style="flex:1; width:100%">
      <option value="">— default —</option>
      ${ports.map(p => `<option value="${escapeHtml(p.id)}"${p.id === (track.midiPortId || '') ? ' selected' : ''}>${escapeHtml(p.name)}</option>`).join('')}
    </select>
    <label class="track-fx-ch-inline">
      <span>Ch</span>
      <input type="text" inputmode="numeric" pattern="[0-9]*" class="track-fx-ch-input" maxlength="2" value="${track.channel + 1}">
    </label>
  `;
  // Channel input lives on the port row now; wire it.
  portRow.querySelector('.track-fx-ch-input')?.addEventListener('change', (e) => {
    seqCheckpoint();
    const v = Math.max(1, Math.min(16, parseInt(e.target.value, 10) || 1));
    e.target.value = v;
    track.channel = v - 1;
    seqSave();
  });
  portRow.querySelector('select').addEventListener('change', (e) => {
    seqCheckpoint();
    track.midiPortId = e.target.value;
    seqSave();
  });
  // MIDI input port selector — always shown, lets the track play live from
  // an external keyboard through its own instrument. Empty = no input.
  const inRow = document.createElement('div');
  inRow.className = 'track-fx-row track-fx-row-select track-fx-in-port-row';
  if (track.output !== 'midi') inRow.classList.add('hidden');
  const inputs = state.midiAccess ? Array.from(state.midiAccess.inputs.values()) : [];
  inRow.innerHTML = `
    <label class="track-fx-label">MIDI in</label>
    <select class="track-fx-select track-fx-port-select" style="flex:1; width:100%">
      <option value="">— none —</option>
      ${inputs.map(p => `<option value="${escapeHtml(p.id)}"${p.id === (track.midiInPortId || '') ? ' selected' : ''}>${escapeHtml(p.name)}</option>`).join('')}
    </select>
    <span class="track-fx-val"></span>
  `;
  inRow.querySelector('select').addEventListener('change', (e) => {
    seqCheckpoint();
    track.midiInPortId = e.target.value;
    attachMidiInput();
    seqSave();
  });
  outRow.querySelectorAll('.track-fx-out-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.out;
      if (next === track.output) return;
      seqCheckpoint();
      track.output = next;
      if (next === 'midi') sendTrackChannelVolume(track);
      seqSave();
      openTrackFxModal(track);   // rebuild with new conditional layout
      seqRenderTrack(track);     // header doesn't show output anymore, but keep things fresh
    });
  });
  body.appendChild(outRow);
  body.appendChild(portRow);
  body.appendChild(inRow);

  // ADSR graph is only meaningful for the in-app synth; hide for MIDI output.
  const adsrEl = document.getElementById('track-fx-adsr');
  if (adsrEl) adsrEl.classList.toggle('hidden', track.output === 'midi');

  if (track.output === 'midi') {
    refreshLucide();
    return;
  }

  // Instrument picker at the top of the modal — same dropdown options as
  // were in the sidebar header. For the pad-linked first chord track this
  // Each track has its own instrument selection — chord-pad widget voice
  // and chord-track voice are independent.
  const instRow = document.createElement('div');
  instRow.className = 'track-fx-row track-fx-row-select';
  const curInst = seqTrackInstrument(track);
  instRow.innerHTML = `
    <label class="track-fx-label">Instrument</label>
    <div class="track-fx-inst-picker">
      <button type="button" class="track-fx-inst-btn">
        <span class="track-fx-inst-label">${escapeHtml(instrumentDisplayName(curInst))}</span>
        <span class="track-fx-inst-chev">▾</span>
      </button>
      <div class="track-fx-inst-menu" hidden>
        <button type="button" class="track-fx-inst-item" data-inst="synth">
          <span class="track-fx-inst-item-name">Synth</span>
        </button>
        ${GM_CATEGORIES.map(cat => `
          <div class="track-fx-inst-cat">
            <button type="button" class="track-fx-inst-cat-btn">
              <span>${cat.name}</span>
              <span class="track-fx-inst-cat-chev">›</span>
            </button>
            <div class="track-fx-inst-submenu" hidden>
              ${cat.presets.map(p => {
                const id = SF2_PRESET_TO_SHORT[p.n] || ('gm' + p.n);
                return `<button type="button" class="track-fx-inst-item" data-inst="${id}">
                  <span class="track-fx-inst-item-name">${escapeHtml(p.name)}</span>
                </button>`;
              }).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    <span class="track-fx-val"></span>
  `;
  const instBtn   = instRow.querySelector('.track-fx-inst-btn');
  const instMenu  = instRow.querySelector('.track-fx-inst-menu');
  const instLabel = instRow.querySelector('.track-fx-inst-label');
  const closeMenu = () => {
    instMenu.hidden = true;
    // Collect ALL submenus, including ones we hoisted to body.
    document.querySelectorAll('.track-fx-inst-submenu').forEach(sm => sm.hidden = true);
  };
  instBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    instMenu.hidden = !instMenu.hidden;
    if (instMenu.hidden) { closeMenu(); return; }
    // On open, scroll the menu so the category containing the current
    // instrument is visible, and expand its submenu next to it.
    const curId = seqTrackInstrument(track);
    // Mark current selection across all items (including body-hoisted submenus).
    document.querySelectorAll('.track-fx-inst-item.selected').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll(`.track-fx-inst-item[data-inst="${curId}"]`).forEach(el => el.classList.add('selected'));
    const curItem = document.querySelector(`.track-fx-inst-item[data-inst="${curId}"]`);
    if (curItem) {
      const cat = curItem.closest('.track-fx-inst-cat')
                 || instMenu.querySelector('.track-fx-inst-cat:has([data-inst="' + curId + '"])');
      // If item belongs to a category submenu, find that cat via stored ref.
      let ownerCat = cat;
      if (!ownerCat) {
        instMenu.querySelectorAll('.track-fx-inst-cat').forEach(c => {
          if (c._submenu && c._submenu.contains(curItem)) ownerCat = c;
        });
      }
      if (ownerCat) {
        ownerCat.scrollIntoView({ block: 'nearest' });
        const subm = ownerCat._submenu;
        if (subm) {
          hideOtherSubmenus(subm);
          positionSubmenu(ownerCat, subm);
          subm.hidden = false;
          curItem.scrollIntoView({ block: 'nearest' });
        }
      } else {
        curItem.scrollIntoView({ block: 'nearest' });
      }
    }
  });
  // Hover (and focus via click) on a category opens its submenu. The
  // submenu is position:fixed so it can escape the menu's scroll/overflow.
  const positionSubmenu = (catEl, submenu) => {
    // Hoist submenu to the body so it's not clipped or shifted by the
    // scrolling/transformed parent menu.
    if (submenu.parentElement !== document.body) document.body.appendChild(submenu);
    const menuRect = instMenu.getBoundingClientRect();
    const catRect  = catEl.getBoundingClientRect();
    const subW = 170;
    let left = menuRect.right + 2;
    if (left + subW > window.innerWidth - 8) {
      left = Math.max(8, menuRect.left - subW - 2);
    }
    submenu.style.left = left + 'px';
    submenu.style.top  = catRect.top + 'px';
  };
  // Remember each category's submenu by reference (it may be hoisted to body).
  instMenu.querySelectorAll('.track-fx-inst-cat').forEach(cat => {
    cat._submenu = cat.querySelector('.track-fx-inst-submenu');
  });
  const hideOtherSubmenus = (keep) => {
    document.querySelectorAll('.track-fx-inst-submenu').forEach(sm => {
      if (sm !== keep) sm.hidden = true;
    });
  };
  // Hovering a non-category top-level item (e.g. "Synth") closes any open submenu.
  instMenu.querySelectorAll(':scope > .track-fx-inst-item').forEach(item => {
    item.addEventListener('mouseenter', () => hideOtherSubmenus(null));
  });
  instMenu.querySelectorAll('.track-fx-inst-cat-btn').forEach(btn => {
    const cat = btn.closest('.track-fx-inst-cat');
    const submenu = cat._submenu;
    cat.addEventListener('mouseenter', () => {
      hideOtherSubmenus(submenu);
      positionSubmenu(cat, submenu);
      submenu.hidden = false;
    });
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (submenu.hidden) { hideOtherSubmenus(submenu); positionSubmenu(cat, submenu); submenu.hidden = false; }
      else submenu.hidden = true;
    });
    // Keep submenu open while pointer is over it
    submenu.addEventListener('mouseenter', () => { hideOtherSubmenus(submenu); submenu.hidden = false; });
  });
  // Close all submenus when leaving the dropdown area entirely.
  instMenu.addEventListener('mouseleave', () => {
    setTimeout(() => {
      document.querySelectorAll('.track-fx-inst-submenu').forEach(sm => {
        if (!sm.matches(':hover')) sm.hidden = true;
      });
    }, 100);
  });
  // Outside-click closes
  setTimeout(() => {
    document.addEventListener('mousedown', function _outside(ev) {
      // Body-hoisted submenus live outside instRow; treat them as inside too.
      const inSubmenu = ev.target.closest && ev.target.closest('.track-fx-inst-submenu');
      if (!instRow.contains(ev.target) && !inSubmenu) {
        closeMenu();
        document.removeEventListener('mousedown', _outside);
      }
    });
  }, 0);
  const handleInstChange = (nextInst) => {
    seqCheckpoint();
    track.instrument = nextInst;
    // Reset synth params to the new instrument's preset defaults so the
    // sound matches expectations right after switching.
    const newPreset = INSTRUMENT_PRESETS?.[nextInst];
    if (newPreset) track.synth = { ...newPreset };
    seqSave();
    if (INSTRUMENT_TO_SF2[nextInst] != null) {
      loadSf2('fluid').then(() => {
        const fluid = SF2_FILES.fluid.sf2;
        if (fluid) prewarmSf2Preset(fluid, INSTRUMENT_TO_SF2[nextInst]);
      });
    } else if (nextInst !== 'synth') {
      preloadSamples(nextInst);
    }
    // Reopen modal so the synth-only sliders refresh for the new instrument.
    openTrackFxModal(track);
  };
  // Wire menu items to call handleInstChange with their data-inst id.
  instMenu.querySelectorAll('.track-fx-inst-item').forEach(item => {
    item.addEventListener('click', (ev) => {
      ev.stopPropagation();
      closeMenu();
      instLabel.textContent = item.querySelector('.track-fx-inst-item-name').textContent;
      handleInstChange(item.dataset.inst);
    });
  });
  body.appendChild(instRow);

  const isSynth = track.instrument === 'synth';
  // Waveform picker (synth only) at the top of the body
  if (isSynth) {
    const row = document.createElement('div');
    row.className = 'track-fx-row track-fx-row-select';
    const cur = track.synth.waveform || preset?.waveform || 'sine';
    row.innerHTML = `
      <label class="track-fx-label">Waveform</label>
      <select class="track-fx-select">
        <option value="sine"${cur === 'sine' ? ' selected' : ''}>Sine</option>
        <option value="triangle"${cur === 'triangle' ? ' selected' : ''}>Triangle</option>
        <option value="sawtooth"${cur === 'sawtooth' ? ' selected' : ''}>Sawtooth</option>
        <option value="square"${cur === 'square' ? ' selected' : ''}>Square</option>
      </select>
      <span class="track-fx-val"></span>
    `;
    const sel = row.querySelector('select');
    sel.addEventListener('change', () => { seqCheckpoint(); track.synth.waveform = sel.value; });
    sliderEls.waveform = { select: sel };
    body.appendChild(row);
  }
  // Build a knob (matches the volume knob in the sidebar) for one FX field.
  // Drag (X + Y axes, like the volume knob), wheel-scroll, dblclick-reset.
  // Returns { setValue, valEl } refs so reset-to-preset can update everything.
  const fieldMap = Object.fromEntries(TRACK_FX_FIELDS.map(f => [f[0], f]));
  function makeFxKnob(key) {
    const [, label, min, max, curve, fmt, , sync] = fieldMap[key];
    const cur = (track.synth[key] !== undefined) ? track.synth[key] : (preset?.[key] ?? min);
    const cell = document.createElement('div');
    cell.className = 'track-fx-knob-cell';
    cell.innerHTML = `
      <span class="track-fx-knob-val">${fmt(cur)}</span>
      <span class="track-fx-knob"><span class="track-fx-knob-ind"></span></span>
      <span class="track-fx-knob-label">${label.replace(/ /g, '<br>')}${sync ? '<button class="track-fx-sync" title="Snap to tempo"><i data-lucide="refresh-cw"></i></button>' : ''}</span>
    `;
    const knob   = cell.querySelector('.track-fx-knob');
    const valEl  = cell.querySelector('.track-fx-knob-val');
    const apply  = (v) => {
      v = Math.max(min, Math.min(max, v));
      track.synth[key] = v;
      valEl.textContent = fmt(v);
      const norm = Math.pow((v - min) / (max - min || 1), 1 / curve);
      knob.style.setProperty('--ang', (-135 + norm * 270) + 'deg');
      if (key === 'attack' || key === 'decay' || key === 'sustain' || key === 'release') updateAdsr();
    };
    apply(cur);
    knob.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      knob.setPointerCapture(e.pointerId);
      seqCheckpoint();
      const startX = e.clientX, startY = e.clientY;
      const startNorm = Math.pow((track.synth[key] - min) / (max - min || 1), 1 / curve);
      const onMove = (ev) => {
        const speed = ev.shiftKey ? 4 : 1;
        const delta = ((startY - ev.clientY) + (ev.clientX - startX)) / speed;
        const norm  = Math.max(0, Math.min(1, startNorm + delta / 200));
        apply(min + (max - min) * Math.pow(norm, curve));
      };
      const onUp = () => {
        knob.removeEventListener('pointermove', onMove);
        knob.removeEventListener('pointerup', onUp);
        seqSave();
      };
      knob.addEventListener('pointermove', onMove);
      knob.addEventListener('pointerup', onUp);
    });
    knob.addEventListener('dblclick', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (preset?.[key] === undefined) return;
      seqCheckpoint();
      apply(preset[key]);
      seqSave();
    });
    knob.addEventListener('wheel', (e) => {
      e.preventDefault();
      const norm = Math.pow((track.synth[key] - min) / (max - min || 1), 1 / curve);
      const step = e.shiftKey ? 0.005 : 0.02;
      const next = Math.max(0, Math.min(1, norm - Math.sign(e.deltaY) * step));
      seqCheckpoint();
      apply(min + (max - min) * Math.pow(next, curve));
      seqSave();
    }, { passive: false });
    if (sync) {
      cell.querySelector('.track-fx-sync')?.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        seqCheckpoint();
        const snapped = fxTempoSnap(sync, track.synth[key] ?? cur);
        apply(snapped);
        seqSave();
      });
    }
    sliderEls[key] = { valEl, setValue: apply, fmt, min, max, curve };
    return cell;
  }
  // Flat grid of all applicable knobs — no grouping.
  const knobGrid = document.createElement('div');
  knobGrid.className = 'track-fx-knobs';
  for (const [key, , , , , , synthOnly] of TRACK_FX_FIELDS) {
    if (synthOnly && !isSynth) continue;
    knobGrid.appendChild(makeFxKnob(key));
  }
  body.appendChild(knobGrid);
  refreshLucide();
  updateAdsr();
  // Reset-to-preset button row
  const resetRow = document.createElement('div');
  resetRow.className = 'track-fx-reset-row';
  resetRow.innerHTML = `<button class="track-fx-reset" type="button">Reset to ${track.instrument || 'preset'} defaults</button>`;
  resetRow.querySelector('button').addEventListener('click', () => {
    if (!preset) return;
    seqCheckpoint();
    for (const [key, , , , , , synthOnly] of TRACK_FX_FIELDS) {
      if (synthOnly && !isSynth) continue;
      if (preset[key] === undefined) continue;
      const el = sliderEls[key];
      if (el && el.setValue) el.setValue(preset[key]);
      else track.synth[key] = preset[key];
    }
    if (isSynth && preset.waveform && sliderEls.waveform?.select) {
      track.synth.waveform = preset.waveform;
      sliderEls.waveform.select.value = preset.waveform;
    }
    updateAdsr();
  });
  body.appendChild(resetRow);
  modal.hidden = false;
}
function closeTrackFxModal() {
  const modal = document.getElementById('track-fx-modal');
  if (modal) modal.hidden = true;
  // Clean up any orphan submenus we hoisted onto the body.
  document.querySelectorAll('body > .track-fx-inst-submenu').forEach(sm => sm.remove());
  seqSave();
}
document.getElementById('track-fx-close')?.addEventListener('click', closeTrackFxModal);
document.querySelector('.track-fx-backdrop')?.addEventListener('click', closeTrackFxModal);

function ensureTrackLane(track) {
  let lane = document.querySelector(`.seq-lane[data-track-id="${track.id}"]`);
  if (lane) {
    lane.classList.add('lane-' + track.kind);
    return lane;
  }
  lane = document.createElement('div');
  lane.className = 'seq-lane lane-' + track.kind;
  lane.dataset.trackId = track.id;
  lane.style.minHeight = '54px';
  // Insert before the resize handle / add-track-button so new lanes
  // appear above any trailing controls inside the inner container.
  const inner  = document.getElementById('seq-tracks-inner');
  const handle = inner.querySelector('.midi-lane-resize-handle');
  if (handle) inner.insertBefore(lane, handle);
  else        inner.appendChild(lane);
  // Wire drag-drop behaviour appropriate for the track's kind
  if (track.kind === 'chord') initChordLane(lane);
  else                         initFreeLane(lane);
  return lane;
}

// Find or create the sidebar header for a track.
function ensureTrackHeader(track) {
  let label = document.querySelector(`.seq-track-label[data-track-id="${track.id}"]`);
  if (!label) {
    label = document.createElement('div');
    label.className = 'seq-track-label';
    label.dataset.trackId = track.id;
    const addBtn = document.getElementById('seq-add-track-btn');
    document.getElementById('seq-track-sidebar').insertBefore(label, addBtn);
  }
  populateTrackHeader(label, track);
  return label;
}

function populateTrackHeader(label, track) {
  const padLinked = (track === firstTrackOfKind('chord'));
  const convertBtn = track.kind === 'chord'
    ? `<button class="seq-th-convert" title="Convert to Free (bake chords to notes — one way)"><i data-lucide="arrow-right-from-line"></i></button>`
    : '';
  label.innerHTML = `
    <div class="seq-th-row seq-th-top">
      <span class="seq-th-name" title="Click to focus · double-click to rename">${escapeHtml(track.name)}</span>
      ${convertBtn}
      <button class="seq-th-fx" title="Track instrument settings"><i data-lucide="sliders-horizontal"></i></button>
      <button class="seq-th-collapse" title="Collapse / expand"><i data-lucide="chevrons-down-up"></i></button>
      <button class="seq-th-del" title="Remove track">✕</button>
    </div>`;
  // Append the rest of the header rows (mixer row). Instrument picker
  // lives in the per-track FX modal now.
  label.insertAdjacentHTML('beforeend', `
    <div class="seq-th-row seq-th-bot">
      <button class="seq-th-m${track.muted ? ' on' : ''}" title="Mute">M</button>
      <button class="seq-th-s${track.soloed ? ' on' : ''}" title="Solo">S</button>
      <span class="seq-th-knob" data-value="${track.volume}" title="${track.output === 'midi' ? 'Velocity scale — drag up/down (double-click to reset)' : 'Volume — drag up/down (double-click to reset)'}"><span class="seq-th-knob-ind"></span></span>
    </div>
  `);
  if (track.kind === 'chord') {
    label.querySelector('.seq-th-convert')?.addEventListener('click', (e) => {
      e.stopPropagation();
      convertChordToFree(track);
    });
  }
  // Keep events from bubbling up to the lane behind the sidebar
  const stop = (e) => e.stopPropagation();
  label.querySelectorAll('select, input, button').forEach(el => {
    el.addEventListener('mousedown', stop);
    el.addEventListener('click', stop);
  });

  label.querySelector('.seq-th-fx')?.addEventListener('click', (e) => {
    e.stopPropagation();
    e.currentTarget.blur();  // drop focus so :hover/focus accent doesn't linger after the modal opens
    openTrackFxModal(track);
  });
  label.querySelector('.seq-th-collapse').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleTrackCollapse(label, track);
  });
  // Click → bind Instrument panel. (Piano-roll is opened by clicking a
  // CLIP block in the arrangement, not by clicking the track name.)
  // Double-click → rename.
  const nameEl = label.querySelector('.seq-th-name');
  nameEl.addEventListener('click', (e) => {
    e.stopPropagation();
    setSynthEditTarget(padLinked ? 'pad' : (track.kind === 'free' ? 'free' : 'pad'));
    document.querySelector('.synth-controls')?.classList.remove('collapsed');
  });
  nameEl.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    startInlineRename(nameEl, track);
  });
  label.querySelector('.seq-th-del').addEventListener('click', (e) => {
    e.stopPropagation();
    deleteTrack(track.id);
  });

  // Mute and Solo are mutually exclusive: turning one on clears the other.
  const muteBtn = label.querySelector('.seq-th-m');
  const soloBtn = label.querySelector('.seq-th-s');
  muteBtn.addEventListener('click', () => {
    seqCheckpoint();
    track.muted = !track.muted;
    if (track.muted) track.soloed = false;
    muteBtn.classList.toggle('on', track.muted);
    soloBtn.classList.toggle('on', track.soloed);
    seqSave();
  });
  soloBtn.addEventListener('click', () => {
    seqCheckpoint();
    track.soloed = !track.soloed;
    if (track.soloed) track.muted = false;
    muteBtn.classList.toggle('on', track.muted);
    soloBtn.classList.toggle('on', track.soloed);
    seqSave();
  });
  // Volume knob: drag up = louder, drag down = softer. Sweep is 270°, from
  // ~7-o'clock (min=0) clockwise through top to ~5-o'clock (max=1.5).
  const knob = label.querySelector('.seq-th-knob');
  const VOL_MIN = 0, VOL_MAX = 1.5;
  const knobUpdate = () => {
    const v = Math.max(VOL_MIN, Math.min(VOL_MAX, track.volume));
    const frac = (v - VOL_MIN) / (VOL_MAX - VOL_MIN);
    const ang  = -135 + frac * 270;
    knob.style.setProperty('--ang', ang + 'deg');
  };
  knobUpdate();
  knob.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    knob.setPointerCapture(e.pointerId);
    seqCheckpoint();
    const startX  = e.clientX;
    const startY  = e.clientY;
    const startV  = track.volume;
    // 200px of drag covers the full 0..1.5 range. Up AND right both
    // increase volume; down AND left both decrease. Hold Shift for fine
    // control (4× slower).
    // Throttle CC#7 sends so we don't flood the MIDI bus during fast drags.
    let lastCcT = 0;
    const sendCcThrottled = () => {
      if (track.output !== 'midi') return;
      const now = performance.now();
      if (now - lastCcT < 25) return;
      lastCcT = now;
      sendTrackChannelVolume(track);
    };
    const onMove = (ev) => {
      const speed = ev.shiftKey ? 4 : 1;
      const delta = ((startY - ev.clientY) + (ev.clientX - startX)) / speed;
      const next  = Math.max(VOL_MIN, Math.min(VOL_MAX, startV + delta / 200 * (VOL_MAX - VOL_MIN)));
      track.volume = next;
      knobUpdate();
      sendCcThrottled();
    };
    const onUp = () => {
      knob.removeEventListener('pointermove', onMove);
      knob.removeEventListener('pointerup', onUp);
      sendTrackChannelVolume(track); // final value
      seqSave();
    };
    knob.addEventListener('pointermove', onMove);
    knob.addEventListener('pointerup', onUp);
  });
  knob.addEventListener('dblclick', (e) => {
    e.preventDefault(); e.stopPropagation();
    seqCheckpoint();
    track.volume = 1.0;
    knobUpdate();
    sendTrackChannelVolume(track);
    seqSave();
  });
  knob.addEventListener('wheel', (e) => {
    e.preventDefault();
    const step = e.shiftKey ? 0.01 : 0.05;
    track.volume = Math.max(VOL_MIN, Math.min(VOL_MAX, track.volume - Math.sign(e.deltaY) * step));
    knobUpdate();
    sendTrackChannelVolume(track);
    seqSave();
  }, { passive: false });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
}

function startInlineRename(nameEl, track) {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'seq-th-name-input';
  input.value = track.name;
  input.maxLength = 30;
  nameEl.replaceWith(input);
  input.focus();
  input.select();
  const finish = (commit) => {
    if (commit) {
      const v = input.value.trim();
      if (v && v !== track.name) {
        seqCheckpoint();
        track.name = v;
      }
      seqSave();
    }
    rebuildTracksUI();
    // Keep the piano-roll title in sync if this track owns the open clip.
    if (SEQ.focusedClip?.trackId === track.id) refreshPianoRollTitle();
  };
  input.addEventListener('blur',    () => finish(true));
  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter')  { e.preventDefault(); finish(true); }
    if (e.key === 'Escape') { e.preventDefault(); finish(false); }
  });
}

// ============================================================
// Piano-roll detail-view (opens at the bottom of the sequencer when a
// free track is focused — full-width note editor)
// ============================================================
SEQ.focusedClip = null; // { trackId, clipId } or null
SEQ.pianoRollOpen = true;

function focusedClipObjects() {
  if (!SEQ.focusedClip) return { track: null, clip: null };
  const track = trackById(SEQ.focusedClip.trackId);
  if (!track) return { track: null, clip: null };
  const clip = track.items.find(c => c.id === SEQ.focusedClip.clipId);
  return { track, clip };
}

function showPianoRoll() {
  SEQ.pianoRollOpen = true;
  const panel = document.getElementById('seq-pianoroll');
  if (panel) panel.hidden = false;
  document.getElementById('seq-pianoroll-toggle')?.classList.add('active');
  refreshPianoRollTitle();
  renderPianoRoll();
}

function hidePianoRoll() {
  SEQ.pianoRollOpen = false;
  const panel = document.getElementById('seq-pianoroll');
  if (panel) panel.hidden = true;
  document.getElementById('seq-pianoroll-toggle')?.classList.remove('active');
  document.querySelectorAll('.seq-clip-block.focused').forEach(el => el.classList.remove('focused'));
}

function togglePianoRoll() {
  if (SEQ.pianoRollOpen) hidePianoRoll(); else showPianoRoll();
}

function openPianoRoll(track, clip) {
  if (!track || track.kind !== 'free' || !clip) return;
  SEQ.focusedClip = { trackId: track.id, clipId: clip.id };
  // Re-center C4 on every open — clear the init flag so renderPianoRoll
  // re-applies the scrollTop.
  const body = document.getElementById('seq-pianoroll-body');
  if (body) delete body.dataset.initialized;
  showPianoRoll();
  refreshPianoRollTitle();
  document.querySelectorAll('.seq-clip-block.focused').forEach(el => el.classList.remove('focused'));
  document.querySelector(`.seq-clip-block[data-clip-id="${clip.id}"]`)?.classList.add('focused');
}

function closePianoRoll() { hidePianoRoll(); }

function refreshPianoRollTitle() {
  const titleEl = document.getElementById('seq-pianoroll-title');
  if (!titleEl) return;
  const { track, clip } = focusedClipObjects();
  if (!track || !clip) {
    titleEl.textContent = 'No clip selected';
    titleEl.classList.add('muted');
    return;
  }
  titleEl.textContent = track.name;
  titleEl.classList.remove('muted');
}

const PR_ROW_H = 12;
// Auto-scroll a container horizontally when the pointer drags near its
// left/right edges. Returns true if scrolling happened.
function _edgeAutoScroll(container, clientX) {
  if (!container) return false;
  const rect = container.getBoundingClientRect();
  const threshold = 50;
  const maxStep = 18;
  if (clientX > rect.right - threshold) {
    const step = Math.min(maxStep, Math.ceil((clientX - (rect.right - threshold)) / 2));
    container.scrollLeft += step;
    return true;
  }
  if (clientX < rect.left + threshold) {
    const step = Math.min(maxStep, Math.ceil(((rect.left + threshold) - clientX) / 2));
    container.scrollLeft -= step;
    return true;
  }
  return false;
}
const PR_KB_W = 30;
const prKbW = () => (SEQ.prShowKeyboard ? PR_KB_W : 0);
SEQ.prTool = SEQ.prTool || 'select'; // 'select' | 'draw' | 'erase' | 'pan'
SEQ.prSelection = SEQ.prSelection || new Set();
function _prSyncSelection(body) {
  if (!body) return;
  body.querySelectorAll('.pr-note').forEach((el) => el.classList.remove('selected'));
  const { clip } = focusedClipObjects();
  if (!clip) return;
  const noteEls = body.querySelectorAll('.pr-note');
  clip.notes.forEach((n, i) => {
    if (SEQ.prSelection.has(n) && noteEls[i]) noteEls[i].classList.add('selected');
  });
}
function prSetTool(tool) {
  SEQ.prTool = tool;
  ['select', 'pen', 'erase', 'pan'].forEach((t) => {
    const id = t === 'pen' ? 'seq-tool-pen' : (t === 'select' ? 'seq-tool-select' : (t === 'erase' ? 'seq-tool-erase' : 'seq-tool-pan'));
    document.getElementById(id)?.classList.toggle('active', SEQ.prTool === (t === 'pen' ? 'draw' : t));
  });
  const body = document.getElementById('seq-pianoroll-body');
  if (body) {
    body.classList.remove('pr-tool-select','pr-tool-draw','pr-tool-erase','pr-tool-pan');
    body.classList.add('pr-tool-' + tool);
  }
}
function prPreviewMidi(track, midi) {
  if (!track) return;
  const inst = track.instrument || state.instrument;
  const play = () => {
    const node = startAudioNote(midi, state.velocity, null, null, inst);
    if (node) {
      SEQ.activeNodes.add(node);
      setTimeout(() => { try { stopAudioNote(node); } catch (_) {} SEQ.activeNodes.delete(node); }, 700);
    }
  };
  if (track.synth) withSynth(track.synth, play); else play();
}
function _prPitchRange(_notes) {
  // Full piano range A0..C8 so the keyboard is always complete and no
  // empty space appears below the visible keys.
  return { lo: 21, hi: 108 };
}

function renderPianoRoll() {
  const body  = document.getElementById('seq-pianoroll-body');
  if (!body) return;
  const wasInitialized = body.dataset.initialized === '1';
  body.innerHTML = '';
  const { track, clip } = focusedClipObjects();
  body.dataset.trackId = track ? track.id : '';
  body.dataset.clipId  = clip ? clip.id : '';
  const { lo, hi } = _prPitchRange(clip ? clip.notes : []);
  const rows = hi - lo + 1;
  const clipBeats = clip ? clip.beats : 4;
  // Extend scrollable width well past the clip so you can pan into empty
  // territory — at least 32 bars beyond the clip's last beat.
  const bpb       = state.beatsPerBar;
  // Round up to a whole-bar boundary so the bar-line gradient's rightmost
  // edge actually renders (otherwise the last partial tile clips it off and
  // you get a blank strip at the very end of the sizer).
  const rawBeats  = Math.max(clipBeats, 4) + 32 * bpb;
  const minBeats  = Math.ceil(rawBeats / bpb) * bpb;
  const contentW  = minBeats * PR_BEAT_PX + prKbW();
  const contentH  = rows * PR_ROW_H;
  body.style.minWidth  = '';
  body.style.minHeight = '';
  body.style.setProperty('--pr-octave-offset', ((((hi % 12) + 12) % 12) * PR_ROW_H + PR_ROW_H) + 'px');
  body.style.setProperty('--pr-content-left', prKbW() + 'px');
  const sizer = document.createElement('div');
  sizer.className = 'pr-sizer';
  // Sizer carries the grid background so tiles cover the full scrollable
  // area (the body itself only paints across clientWidth even with
  // background-attachment:local in some browsers).
  sizer.style.cssText = `position:absolute;top:0;left:0;width:${contentW}px;height:${contentH}px;pointer-events:none;`;
  body.appendChild(sizer);

  // Bar-numbers ruler — lives ABOVE the body and scrolls horizontally in
  // sync with it (but never vertically with the keyboard). Extends to at
  // least the visible width so bar numbers cover the whole roll.
  const prRuler = document.getElementById('seq-pianoroll-ruler');
  // Match the rulerwrap's inner width to the body's clientWidth so that 1:1
  // scrollLeft sync stays accurate end-to-end. (Body has a vertical scrollbar
  // that shaves a few px off its clientWidth, plus 1px borders both sides;
  // the wrap has neither — without this fix the bar markers drift ~5-20px
  // over the full scroll range.)
  const rulerWrap = document.getElementById('seq-pianoroll-rulerwrap');
  if (rulerWrap) rulerWrap.style.width = (body.clientWidth || 0) + 'px';
  if (prRuler) {
    const visibleW = body.clientWidth || 0;
    const rulerW   = Math.max(contentW, visibleW);
    prRuler.style.width = rulerW + 'px';
    const bpb = state.beatsPerBar;
    const totalBeats = Math.ceil((rulerW - prKbW()) / PR_BEAT_PX);
    const totalBars  = Math.ceil(totalBeats / bpb);
    let prRulerHTML = '';
    for (let bar = 0; bar < totalBars; bar++) {
      const left = bar * bpb * PR_BEAT_PX + prKbW();
      prRulerHTML += `<div class="pr-ruler-bar" style="left:${left}px"><span>${bar + 1}</span></div>`;
      for (let b = 1; b < bpb; b++) {
        prRulerHTML += `<div class="pr-ruler-beat" style="left:${left + b * PR_BEAT_PX}px"></div>`;
      }
    }
    prRuler.innerHTML = prRulerHTML;
  }
  // Sync horizontal scroll between body and ruler-wrap so bar markers
  // follow the content as the user pans / drags.
  if (!body.dataset.rulerSyncBound) {
    body.dataset.rulerSyncBound = '1';
    body.addEventListener('scroll', () => {
      const wrap = document.getElementById('seq-pianoroll-rulerwrap');
      if (!wrap) return;
      // wrap width is synced to body.clientWidth in renderPianoRoll, so a
      // straight 1:1 scrollLeft match keeps the bar markers aligned with
      // the grid over the entire scroll range.
      wrap.scrollLeft = body.scrollLeft;
    });
  }
  // Click-to-set play cursor on the piano-roll ruler. Drag-detection so
  // scrolling/panning doesn't move the cursor.
  if (prRuler && !prRuler.dataset.clickInit) {
    prRuler.dataset.clickInit = '1';
    let dX = null, dY = null;
    prRuler.addEventListener('pointerdown', (e) => { dX = e.clientX; dY = e.clientY; });
    prRuler.addEventListener('pointerup', (e) => {
      if (dX == null) return;
      const dx = Math.abs(e.clientX - dX), dy = Math.abs(e.clientY - dY);
      dX = dY = null;
      if (dx > 3 || dy > 3) return;
      const rect = prRuler.getBoundingClientRect();
      const wrap = document.getElementById('seq-pianoroll-rulerwrap');
      const scrollL = wrap ? wrap.scrollLeft : 0;
      const clipRelBeat = Math.max(0, Math.round(((e.clientX - rect.left + scrollL - prKbW()) / PR_BEAT_PX) * 2) / 2);
      const { clip } = focusedClipObjects();
      const songBeat = (clip ? clip.start : 0) + clipRelBeat;
      SEQ.startBeat = songBeat;
      SEQ.animBeat  = songBeat;
      // Arrangement playhead = song-absolute beat.
      document.querySelectorAll('.seq-playhead-global, .seq-lane .seq-playhead').forEach(ph => {
        ph.style.display = 'block';
        ph.style.left = (songBeat * BEAT_PX) + 'px';
      });
      // Piano-roll playhead = clip-relative + keyboard offset.
      const prPh = body.querySelector('.seq-playhead');
      if (prPh) {
        prPh.style.display = 'block';
        prPh.style.left = (clipRelBeat * PR_BEAT_PX + prKbW()) + 'px';
      }
    });
  }
  body._prHi = hi;
  body._prLo = lo;

  // Piano keyboard sidebar — proper piano layout: 7 tall white keys per
  // octave with 5 shorter/narrower black keys overlaid between them.
  // Doesn't line up 1:1 with the per-semitone note grid, that's fine.
  if (SEQ.prShowKeyboard) {
    const kb = document.createElement('div');
    kb.className = 'pr-keyboard';
    const totalH = rows * PR_ROW_H;
    kb.style.height = totalH + 'px';
    const isBlack = (m) => { const s = ((m % 12) + 12) % 12; return s===1||s===3||s===6||s===8||s===10; };
    const half = PR_ROW_H / 2;
    const attachKeyClick = (row, midi) => {
      row.dataset.midi = midi;
      row.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        prPreviewMidi(track, midi);
      });
    };
    for (let m = hi; m >= lo; m--) {
      if (isBlack(m)) continue;
      const rowTop = (hi - m) * PR_ROW_H;
      const hasBlackAbove = isBlack(m + 1) && (m + 1 <= hi);
      const hasBlackBelow = isBlack(m - 1) && (m - 1 >= lo);
      const top    = rowTop - (hasBlackAbove ? half : 0);
      const bottom = rowTop + PR_ROW_H + (hasBlackBelow ? half : 0);
      const row = document.createElement('div');
      row.className = 'pr-keyboard-row';
      row.style.top    = top + 'px';
      row.style.height = (bottom - top - 1) + 'px';
      row.textContent  = (m % 12 === 0) ? midiNoteLabel(m) : '';
      attachKeyClick(row, m);
      kb.appendChild(row);
    }
    for (let m = hi; m >= lo; m--) {
      if (!isBlack(m)) continue;
      const row = document.createElement('div');
      row.className = 'pr-keyboard-row black';
      row.style.top    = ((hi - m) * PR_ROW_H) + 'px';
      row.style.height = PR_ROW_H + 'px';
      attachKeyClick(row, m);
      kb.appendChild(row);
    }
    body.appendChild(kb);
  }

  if (clip && clip.notes.length > 0) {
    for (let i = 0; i < clip.notes.length; i++) {
      const note = clip.notes[i];
      body.appendChild(_prMakeNote(track, clip, note, i, hi));
    }
  }

  _prAppendOverlays(body);
  if (!wasInitialized) {
    // Center on the clip's notes if it has any; otherwise fall back to C4.
    let centerMidi = 60;
    if (clip && clip.notes && clip.notes.length > 0) {
      const midis = clip.notes.map(n => n.midi);
      centerMidi = Math.round((Math.min(...midis) + Math.max(...midis)) / 2);
    }
    const centerTop = (hi - centerMidi) * PR_ROW_H;
    body.scrollTop = Math.max(0, centerTop - body.clientHeight / 2 + PR_ROW_H / 2);
    body.dataset.initialized = '1';
  }
}

// White-key height in the piano-roll sidebar (px). Black keys derive from
// this. Keyboard total height won't match the body grid exactly — accepted
// trade-off for a real piano look.
const PR_KB_WHITE_H = 16;
const PR_KB_BLACK_H = 11;
const PR_KB_WIDTH    = 56;
const PR_KB_BLACK_W  = 36;

function _prBuildPianoKeyboard(lo, hi) {
  const kb = document.createElement('div');
  kb.className = 'pr-keyboard';
  kb.style.width = PR_KB_WIDTH + 'px';

  // Pass 1 (top → bottom): position each white key
  let whiteIdx = 0;
  const whiteTop = {}; // midi → y of top edge
  for (let m = hi; m >= lo; m--) {
    if (!midiIsBlack(m)) {
      whiteTop[m] = whiteIdx * PR_KB_WHITE_H;
      whiteIdx++;
    }
  }
  const totalH = whiteIdx * PR_KB_WHITE_H;
  kb.style.height = totalH + 'px';

  // White keys
  for (const m of Object.keys(whiteTop).map(Number)) {
    const w = document.createElement('div');
    w.className = 'pr-kb-white' + (m % 12 === 0 ? ' octave' : '');
    w.style.top    = whiteTop[m] + 'px';
    w.style.height = (PR_KB_WHITE_H - 1) + 'px';
    if (m % 12 === 0) {
      const lbl = document.createElement('span');
      lbl.className = 'pr-kb-label';
      lbl.textContent = midiNoteLabel(m);
      w.appendChild(lbl);
    }
    kb.appendChild(w);
  }
  // Black keys — centred on the boundary between the white above (m+1) and
  // the white below (m-1).
  for (let m = hi; m >= lo; m--) {
    if (!midiIsBlack(m)) continue;
    const above = whiteTop[m + 1];
    const below = whiteTop[m - 1];
    if (above === undefined || below === undefined) continue;
    const boundary = above + PR_KB_WHITE_H; // = below
    const top = boundary - PR_KB_BLACK_H / 2;
    const b = document.createElement('div');
    b.className = 'pr-kb-black';
    b.style.top    = top + 'px';
    b.style.height = PR_KB_BLACK_H + 'px';
    kb.appendChild(b);
  }
  return kb;
}

function _prAppendOverlays(body) {
  // Only a playhead inside the piano-roll — loop tags/lines stay on the
  // arrangement-view tracks where they belong.
  const ph = document.createElement('div');
  ph.className = 'seq-playhead';
  ph.style.display = 'none'; // shown by seqAnimatePlayhead only while inside the clip
  body.appendChild(ph);
  // Vertical line marking the end of the current clip — anything to the
  // right is "outside" the clip and won't sound at playback.
  const { clip } = focusedClipObjects();
  if (clip) {
    const endLine = document.createElement('div');
    endLine.className = 'pr-clip-end-line';
    endLine.style.left   = (clip.beats * PR_BEAT_PX + prKbW()) + 'px';
    // Span the full sizer height so the line reaches A0 (not just the
    // visible body viewport). PR_ROW_H × rows = pixel height of the grid.
    endLine.style.top    = '0';
    endLine.style.bottom = 'auto';
    endLine.style.height = ((body._prHi - body._prLo + 1) * PR_ROW_H) + 'px';
    body.appendChild(endLine);
  }
}

function _prMakeNote(track, clip, note, idx, hi) {
  const el = document.createElement('div');
  el.className = 'pr-note';
  const lbl = document.createElement('span');
  lbl.className = 'pr-note-text';
  lbl.textContent = note.label || midiNoteLabel(note.midi);
  el.appendChild(lbl);
  el.style.left   = (note.start * PR_BEAT_PX + prKbW()) + 'px';
  el.style.width  = (note.beats * PR_BEAT_PX) + 'px';
  el.style.top    = ((hi - note.midi) * PR_ROW_H) + 'px';
  el.style.height = (PR_ROW_H - 2) + 'px';
  // Mark notes that extend past the clip end so the visual makes it obvious
  // that part of the note won't play (clip-end truncates MIDI like Ableton/
  // Logic/Cubase do). --note-clip-frac is the fraction of the note that's
  // still inside the clip; CSS turns the rest into a muted gradient.
  if (note.start + note.beats > clip.beats) {
    const insideBeats = Math.max(0, clip.beats - note.start);
    const frac = note.beats > 0 ? Math.max(0, Math.min(1, insideBeats / note.beats)) : 0;
    el.classList.add('pr-note-overflow');
    el.style.setProperty('--note-clip-frac', String(frac));
  }
  if (SEQ.prSelection.has(note)) el.classList.add('selected');
  // Left/right resize handles
  const resizeL = document.createElement('div');
  resizeL.className = 'pr-note-resize pr-note-resize-left';
  const resizeR = document.createElement('div');
  resizeR.className = 'pr-note-resize pr-note-resize-right';
  el.appendChild(resizeL);
  el.appendChild(resizeR);
  const bindResize = (handle, side) => {
    handle.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      handle.setPointerCapture(ev.pointerId);
      seqCheckpoint();
      const startX = ev.clientX;
      const origStart = note.start, origBeats = note.beats;
      const snap = SEQ.rollSnap ? SEQ.rollSnapVal : 0.25;
      const useGhost = !!SEQ.rollSnap;
      let ghost = null;
      if (useGhost) {
        ghost = document.createElement('div');
        ghost.className = 'pr-note pr-resize-ghost';
        ghost.style.top    = el.style.top;
        ghost.style.height = el.style.height;
        el.parentElement?.appendChild(ghost);
      }
      const onMove = (e2) => {
        const dxBeats = (e2.clientX - startX) / PR_BEAT_PX;
        if (side === 'right') {
          note.beats = Math.max(0.25, origBeats + dxBeats);
        } else {
          const maxDelta = origBeats - 0.25;
          const delta = Math.max(-origStart, Math.min(maxDelta, dxBeats));
          note.start = origStart + delta;
          note.beats = origBeats - delta;
          el.style.left = (note.start * PR_BEAT_PX + prKbW()) + 'px';
        }
        el.style.width = (note.beats * PR_BEAT_PX) + 'px';
        if (ghost) {
          let gStart = note.start, gBeats = note.beats;
          gBeats = Math.max(snap, Math.round(gBeats / snap) * snap);
          if (side === 'left') gStart = Math.max(0, Math.round(gStart / snap) * snap);
          ghost.style.left  = (gStart * PR_BEAT_PX + prKbW()) + 'px';
          ghost.style.width = (gBeats * PR_BEAT_PX) + 'px';
        }
        seqResyncTrackThrottled(track);
      };
      const onUp = () => {
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
        if (ghost) ghost.remove();
        note.beats = Math.max(snap, Math.round(note.beats / snap) * snap);
        if (side === 'left') note.start = Math.max(0, Math.round(note.start / snap) * snap);
        if (note.start + note.beats > clip.beats) clip.beats = note.start + note.beats;
        seqAutoExtendLoop(clip.start + clip.beats);
        renderPianoRoll();
        seqRenderTrack(track);
        seqResyncTrack(track);
        seqSave();
      };
      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
    });
  };
  bindResize(resizeL, 'left');
  bindResize(resizeR, 'right');
  el.addEventListener('pointerdown', (e) => {
    SEQ._lastZone = 'roll';
    if (e.target === resizeL || e.target === resizeR) return;
    if (SEQ._prSpaceHeld || SEQ.prTool === 'pan') return; // let body handle pan
    e.preventDefault();
    e.stopPropagation();
    if (SEQ.prTool === 'erase') {
      seqCheckpoint();
      const i = clip.notes.indexOf(note);
      if (i >= 0) clip.notes.splice(i, 1);
      renderPianoRoll();
      seqRenderTrack(track);
      seqResyncTrack(track);
      seqSave();
      return;
    }
    if (SEQ.prTool === 'select') {
      if (e.shiftKey) {
        if (SEQ.prSelection.has(note)) SEQ.prSelection.delete(note); else SEQ.prSelection.add(note);
      } else if (!SEQ.prSelection.has(note)) {
        SEQ.prSelection.clear();
        SEQ.prSelection.add(note);
      }
      _prSyncSelection(el.parentElement);
      // fall through to allow drag on the (newly) selected note
    }
    el.setPointerCapture(e.pointerId);
    seqCheckpoint();
    // Audible preview while the note is held — routes through the same
    // path as playback (in-app instrument or external MIDI) so you hear
    // exactly what this note will sound like at playback time.
    if (track) {
      if (track.output === 'midi') {
        const port = midiPortById(track.midiPortId);
        const vel  = seqTrackVel(track, state.velocity);
        sendNoteOn(note.midi, vel, track.channel, port);
        const stop = () => sendNoteOff(note.midi, track.channel, port);
        el.addEventListener('pointerup',     stop, { once: true });
        el.addEventListener('pointercancel', stop, { once: true });
      } else if (state.audioEnabled) {
        const inst = seqTrackInstrument(track);
        let previewNode;
        withSynth(track.synth, () => { previewNode = startAudioNote(note.midi, state.velocity, null, null, inst); });
        const stop = () => { if (previewNode) stopAudioNote(previewNode); };
        el.addEventListener('pointerup',     stop, { once: true });
        el.addEventListener('pointercancel', stop, { once: true });
      }
    }
    const body = el.parentElement;
    const startX = e.clientX, startY = e.clientY;
    // Build the move group: every note in the prSelection that belongs to
    // this clip — falling back to just `note` if it isn't part of a multi-
    // selection. Capture each note's element + original start/midi.
    const inSel = SEQ.prSelection.has(note);
    const groupNotes = (inSel && SEQ.prSelection.size > 1)
      ? clip.notes.filter(n => SEQ.prSelection.has(n))
      : [note];
    const noteEls = body.querySelectorAll('.pr-note');
    let group = groupNotes.map(n => {
      const idx = clip.notes.indexOf(n);
      return { n, el: noteEls[idx] || null, origStart: n.start, origMidi: n.midi };
    });
    // Alt-drag duplicates: clone every group note, leave originals in place,
    // and drag the clones instead. We perform the clone lazily on the first
    // real movement, so the user can press Alt *during* the initial nudge
    // (matches DAW behavior). `anchor` tracks the note whose post-snap
    // position drives the group's snap delta on release.
    let anchor = note;
    let altDup = false;
    SEQ._prAltDragClones = null;
    const performAltClone = () => {
      // Snapshot how far the drag has moved so far so the clones jump to
      // the current cursor position (smooth continuation, no rubber-banding).
      const dShiftBeat = group[0] ? (group[0].n.start - group[0].origStart) : 0;
      const dShiftRow  = group[0] ? (group[0].origMidi - group[0].n.midi)  : 0;
      // First, snap the ORIGINALS back to their starting position — the
      // user wants the originals to stay put while a ghost follows.
      for (const g of group) {
        g.n.start = g.origStart;
        g.n.midi  = g.origMidi;
        if (g.el) {
          g.el.style.left = (g.n.start * PR_BEAT_PX + prKbW()) + 'px';
          g.el.style.top  = ((body._prHi - g.n.midi) * PR_ROW_H) + 'px';
        }
      }
      // Now clone & make ghosts that follow the cursor.
      const clones = group.map(g => ({ ...g.n }));
      clones.forEach(c => clip.notes.push(c));
      const cloneEls = clones.map((c, i) => {
        const src = group[i].el;
        const cel = src ? src.cloneNode(true) : document.createElement('div');
        cel.classList.remove('selected');
        cel.classList.add('pr-alt-ghost');
        cel.style.left = ((c.start + dShiftBeat) * PR_BEAT_PX + prKbW()) + 'px';
        cel.style.top  = ((body._prHi - (c.midi - dShiftRow)) * PR_ROW_H) + 'px';
        cel.style.pointerEvents = 'none';
        body.appendChild(cel);
        return cel;
      });
      const anchorIdx = group.findIndex(g => g.n === note);
      if (anchorIdx >= 0) anchor = clones[anchorIdx];
      group = clones.map((c, i) => ({ n: c, el: cloneEls[i], origStart: c.start, origMidi: c.midi }));
      SEQ._prAltDragClones = clones;
      altDup = true;
    };
    let moved = false;
    const onMove = (ev) => {
      _edgeAutoScroll(body, ev.clientX);
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
      // If Alt is held at this move (or was at mousedown) and we haven't
      // cloned yet, switch into duplicate mode. Works on first move AND any
      // later move — so the user can also press Alt mid-drag.
      if (!altDup && (ev.altKey || e.altKey)) performAltClone();
      moved = true;
      // Shift constrains the drag to its dominant axis (horizontal-only =
      // pure time shift, vertical-only = pure pitch shift). Combines with
      // alt-drag for ghost-duplicate along one axis.
      let effDx = dx, effDy = dy;
      if (ev.shiftKey) {
        if (Math.abs(dx) >= Math.abs(dy)) effDy = 0;
        else effDx = 0;
      }
      const dBeat = effDx / PR_BEAT_PX;
      const dRow  = Math.round(effDy / PR_ROW_H);
      // Clamp the group so no member goes below start=0 or out of pitch range.
      let beatShift = dBeat;
      let rowShift = dRow;
      for (const g of group) {
        beatShift = Math.max(beatShift, -g.origStart);
        rowShift  = Math.min(rowShift, g.origMidi - 0);
        rowShift  = Math.max(rowShift, g.origMidi - 127);
      }
      for (const g of group) {
        g.n.start = g.origStart + beatShift;
        g.n.midi  = g.origMidi - rowShift;
        if (g.el) {
          g.el.style.left = (g.n.start * PR_BEAT_PX + prKbW()) + 'px';
          g.el.style.top  = ((body._prHi - g.n.midi) * PR_ROW_H) + 'px';
          // Keep the pitch label in sync as we move.
          const lblEl = g.el.querySelector('.pr-note-text');
          if (lblEl) lblEl.textContent = midiNoteLabel(g.n.midi);
        }
      }
      seqResyncTrackThrottled(track);
    };
    const onUp = () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      if (moved) {
        // Snap by the dragged anchor's delta so the group stays rigid.
        // Uses the global roll snap setting (SEQ.rollSnap / rollSnapVal).
        const snapped = Math.max(0, rollSnapBeat(anchor.start));
        const snapShift = snapped - anchor.start;
        for (const g of group) {
          g.n.start = Math.max(0, g.n.start + snapShift);
          g.n.label = midiNoteLabel(g.n.midi);
        }
        clip.notes.sort((a, b) => a.start - b.start);
        // If we alt-dragged, replace selection with the new clones.
        if (SEQ._prAltDragClones) {
          SEQ.prSelection.clear();
          SEQ._prAltDragClones.forEach(c => SEQ.prSelection.add(c));
          SEQ._prAltDragClones = null;
        }
        renderPianoRoll();
        seqRenderTrack(track);
        seqResyncTrack(track);
        seqSave();
      }
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
  });
  return el;
}

// Click-and-drag on empty area = draw new note. Drop a chord-pad to add
// chord notes (all at the click x position, pitch from the chord).
(function _initPianoRollListeners() {
  const body = document.getElementById('seq-pianoroll-body');
  if (!body) return;
  // Track last-interacted zone for keyboard-shortcut dispatch (Ctrl+A etc).
  document.addEventListener('pointerdown', (ev) => {
    const inRoll = ev.target.closest && ev.target.closest('#seq-pianoroll');
    const inArr  = ev.target.closest && ev.target.closest('#seq-lane-wrap');
    if (inRoll) SEQ._lastZone = 'roll';
    else if (inArr) SEQ._lastZone = 'arrangement';
  }, true);
  body.addEventListener('pointerdown', (e) => {
    SEQ._lastZone = 'roll';
    // Pan: spacebar held OR hand-tool active
    if (SEQ._prSpaceHeld || SEQ.prTool === 'pan') {
      e.preventDefault();
      body.setPointerCapture(e.pointerId);
      const startX = e.clientX, startY = e.clientY;
      const startSL = body.scrollLeft, startST = body.scrollTop;
      body.classList.add('pr-panning');
      const onMove = (ev) => {
        body.scrollLeft = startSL - (ev.clientX - startX);
        body.scrollTop  = startST - (ev.clientY - startY);
      };
      const onUp = () => {
        body.removeEventListener('pointermove', onMove);
        body.removeEventListener('pointerup', onUp);
        body.classList.remove('pr-panning');
      };
      body.addEventListener('pointermove', onMove);
      body.addEventListener('pointerup', onUp);
      return;
    }
    if (e.target !== body) return;
    const rect = body.getBoundingClientRect();
    if (e.clientX - rect.left < prKbW()) return; // click in keyboard area — ignore
    const { track, clip } = focusedClipObjects();
    if (!track || !clip) return;
    // Clicking empty roll area clears any note-selection (unless shift held
    // for additive marquee). The marquee path below also clears, but doing
    // it here covers other tools (draw/erase/none) as well.
    if (!e.shiftKey && SEQ.prSelection.size > 0) {
      SEQ.prSelection.clear();
      _prSyncSelection(body);
    }
    // Select tool: rectangle marquee
    if (SEQ.prTool === 'select') {
      e.preventDefault();
      body.setPointerCapture(e.pointerId);
      if (!e.shiftKey) SEQ.prSelection.clear();
      const startX = e.clientX, startY = e.clientY;
      const startSL = body.scrollLeft, startST = body.scrollTop;
      const marquee = document.createElement('div');
      marquee.className = 'pr-marquee';
      body.appendChild(marquee);
      const updateMarquee = (ev) => {
        const x0 = startX - rect.left + startSL;
        const y0 = startY - rect.top + startST;
        const x1 = ev.clientX - rect.left + body.scrollLeft;
        const y1 = ev.clientY - rect.top + body.scrollTop;
        const left = Math.min(x0, x1), top = Math.min(y0, y1);
        const right = Math.max(x0, x1), bottom = Math.max(y0, y1);
        marquee.style.left = left + 'px';
        marquee.style.top  = top + 'px';
        marquee.style.width  = (right - left) + 'px';
        marquee.style.height = (bottom - top) + 'px';
        clip.notes.forEach((n) => {
          const nLeft = n.start * PR_BEAT_PX + prKbW();
          const nRight = nLeft + n.beats * PR_BEAT_PX;
          const nTop  = (body._prHi - n.midi) * PR_ROW_H;
          const nBot  = nTop + PR_ROW_H;
          if (nRight >= left && nLeft <= right && nBot >= top && nTop <= bottom) {
            SEQ.prSelection.add(n);
          }
        });
        _prSyncSelection(body);
      };
      const onUp = () => {
        body.removeEventListener('pointermove', updateMarquee);
        body.removeEventListener('pointerup', onUp);
        marquee.remove();
      };
      body.addEventListener('pointermove', updateMarquee);
      body.addEventListener('pointerup', onUp);
      return;
    }
    // Draw tool only past this point
    if (SEQ.prTool !== 'draw') return;
    e.preventDefault();
    body.setPointerCapture(e.pointerId);
    const beat0 = Math.max(0, ((e.clientX - rect.left + body.scrollLeft - prKbW()) / PR_BEAT_PX));
    const startBeat = rollSnap(beat0);
    const midi = Math.max(0, Math.min(127, body._prHi - Math.floor((e.clientY - rect.top + body.scrollTop) / PR_ROW_H)));
    seqCheckpoint();
    const newNote = { midi, label: midiNoteLabel(midi), beats: 1, start: startBeat };
    clip.notes.push(newNote);
    clip.notes.sort((a, b) => a.start - b.start);
    // Make the new note audible immediately if playback is running.
    seqResyncTrackThrottled(track);
    const ghost = document.createElement('div');
    ghost.className = 'pr-note';
    ghost.style.left   = (startBeat * PR_BEAT_PX + prKbW()) + 'px';
    ghost.style.width  = PR_BEAT_PX + 'px';
    ghost.style.top    = ((body._prHi - midi) * PR_ROW_H) + 'px';
    ghost.style.height = (PR_ROW_H - 2) + 'px';
    ghost.textContent  = midiNoteLabel(midi);
    body.appendChild(ghost);
    const onMove = (ev) => {
      const beat = Math.max(startBeat + 0.25, (ev.clientX - rect.left + body.scrollLeft - prKbW()) / PR_BEAT_PX);
      newNote.beats = Math.max(0.25, beat - startBeat);
      ghost.style.width = (newNote.beats * PR_BEAT_PX) + 'px';
      // Note duration changed → reschedule release if currently sounding.
      seqResyncTrackThrottled(track);
    };
    const onUp = () => {
      body.removeEventListener('pointermove', onMove);
      body.removeEventListener('pointerup', onUp);
      newNote.beats = Math.max(0.25, Math.round(newNote.beats * 2) / 2);
      // Extend clip length if note runs past its right edge
      if (newNote.start + newNote.beats > clip.beats) clip.beats = newNote.start + newNote.beats;
      seqAutoExtendLoop(clip.start + clip.beats);
      renderPianoRoll();
      seqRenderTrack(track);
      seqResyncTrack(track);
      seqSave();
    };
    body.addEventListener('pointermove', onMove);
    body.addEventListener('pointerup', onUp);
  });

  // Chord-pad drop inside the piano-roll → adds the chord's notes to the
  // focused clip at the drop position. Show note-ghosts during dragover
  // that reflect both the time slot AND the octave under the cursor.
  let _prGhostNotes = [];
  const _clearPrGhost = () => {
    _prGhostNotes.forEach(g => g.remove());
    _prGhostNotes = [];
  };
  const _prDragNotes = (e) => {
    const raw = e.dataTransfer.types.includes('application/x-chord');
    if (!raw) return null;
    const data = JSON.parse(_prDragData || 'null');
    if (!data) return null;
    const rect = body.getBoundingClientRect();
    const beat = Math.max(0, rollSnap((e.clientX - rect.left + body.scrollLeft - prKbW()) / PR_BEAT_PX));
    const cursorMidi = Math.max(0, Math.min(127, body._prHi - Math.floor((e.clientY - rect.top + body.scrollTop) / PR_ROW_H)));
    const baseNotes = chordToMidiNotes(state.keys[state.currentTemplate], state.octave, data.interval, data.q);
    if (baseNotes.length === 0) return null;
    const root = baseNotes[0];
    const shift = Math.round((cursorMidi - root) / 12) * 12;
    return { beat, notes: baseNotes.map(m => m + shift) };
  };
  let _prDragData = null;
  body.addEventListener('dragenter', (e) => {
    if (!e.dataTransfer.types.includes('application/x-chord')) return;
    // dataTransfer.getData only works on drop, so cache from chord-pad ondragstart
    // via a separate mechanism: store payload in SEQ._prDragPayload set elsewhere.
    _prDragData = SEQ._prDragPayload || null;
  });
  body.addEventListener('dragover', (e) => {
    if (!e.dataTransfer.types.includes('application/x-chord')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const info = _prDragNotes(e);
    if (!info) return;
    // Resize / create ghost-notes to match
    if (_prGhostNotes.length !== info.notes.length) {
      _clearPrGhost();
      info.notes.forEach(() => {
        const g = document.createElement('div');
        g.className = 'pr-note pr-ghost-note';
        body.appendChild(g);
        _prGhostNotes.push(g);
      });
    }
    info.notes.forEach((midi, i) => {
      const g = _prGhostNotes[i];
      g.style.left   = (info.beat * PR_BEAT_PX + prKbW()) + 'px';
      g.style.width  = (chordDropLen() * PR_BEAT_PX) + 'px';
      g.style.top    = ((body._prHi - midi) * PR_ROW_H) + 'px';
      g.style.height = (PR_ROW_H - 2) + 'px';
      g.textContent  = midiNoteLabel(midi);
    });
  });
  body.addEventListener('dragleave', (e) => {
    if (!body.contains(e.relatedTarget)) _clearPrGhost();
  });
  body.addEventListener('drop', (e) => {
    _clearPrGhost();
    const raw = e.dataTransfer.getData('application/x-chord');
    if (!raw) return;
    e.preventDefault();
    const { track, clip } = focusedClipObjects();
    if (!track || !clip) return;
    const data = JSON.parse(raw);
    _prDragData = raw;
    const info = _prDragNotes(e);
    if (!info) return;
    seqCheckpoint();
    const dropBeats = chordDropLen();
    info.notes.forEach(midi => clip.notes.push({
      midi, label: midiNoteLabel(midi),
      start: info.beat, beats: dropBeats,
    }));
    clip.notes.sort((a, b) => a.start - b.start);
    if (info.beat + dropBeats > clip.beats) clip.beats = info.beat + dropBeats;
    seqAutoExtendLoop(clip.start + clip.beats);
    renderPianoRoll();
    seqRenderTrack(track);
    seqResyncTrack(track);
    seqSave();
  });
  // Resize handle: drag up to make the roll taller, down to shrink. Stored
  // on body.style.height so it survives re-renders. Persisted to SEQ so it
  // sticks across sessions via seqSave().
  const resizeHandle = document.getElementById('seq-pianoroll-resize');
  const prBody = document.getElementById('seq-pianoroll-body');
  if (resizeHandle && prBody) {
    if (typeof SEQ.prBodyHeight === 'number') {
      prBody.style.height = SEQ.prBodyHeight + 'px';
      prBody.style.maxHeight = 'none';
    }
    resizeHandle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      resizeHandle.setPointerCapture(e.pointerId);
      resizeHandle.classList.add('dragging');
      const startY = e.clientY;
      const startH = prBody.getBoundingClientRect().height;
      const startScrollTop = prBody.scrollTop;
      // Note range visible at drag start — used to keep the same upper-pitch
      // row pinned to the top of the viewport (so growth/shrink happens at
      // the bottom of the visible roll). Falls back to scrollTop preservation
      // when we're scrolled against the bottom of the content (A0 territory).
      const onMove = (ev) => {
        // Handle sits below the body now: drag down → roll grows taller.
        const dy = ev.clientY - startY;
        const next = Math.max(120, Math.min(window.innerHeight - 160, startH + dy));
        prBody.style.height = next + 'px';
        prBody.style.maxHeight = 'none';
        // Anchor the TOP visible row in place: keep scrollTop fixed, unless
        // that would over-scroll past the bottom of the content (we're at
        // A0). In that case clamp scrollTop down so the bottom row stays put
        // and the extra height reveals notes above.
        const contentH = prBody.scrollHeight;
        const maxScroll = Math.max(0, contentH - next);
        prBody.scrollTop = Math.min(startScrollTop, maxScroll);
      };
      const onUp = () => {
        resizeHandle.removeEventListener('pointermove', onMove);
        resizeHandle.removeEventListener('pointerup', onUp);
        resizeHandle.classList.remove('dragging');
        SEQ.prBodyHeight = parseInt(prBody.style.height, 10) || null;
        seqSave();
      };
      resizeHandle.addEventListener('pointermove', onMove);
      resizeHandle.addEventListener('pointerup', onUp);
    });
  }
  document.getElementById('seq-pianoroll-close')?.addEventListener('click', hidePianoRoll);
  document.getElementById('seq-pianoroll-toggle')?.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePianoRoll();
  });
  SEQ.prShowKeyboard = true;
  prSetTool(SEQ.prTool || 'select');
  renderPianoRoll();
  refreshPianoRollTitle();
})();

// One-way conversion: bake all chord blocks into free-track note items.
// The track keeps its id, name, instrument, mixer settings and synth, but
// its kind flips to 'free' and the blocks become individual notes.
function convertChordToFree(track) {
  if (!track || track.kind !== 'chord') return;
  seqCheckpoint();
  // Rename so the header reflects the kind change (one-way conversion).
  if (track.name === 'Chords')               track.name = 'Notes';
  else if (/^Chords (\d+)$/.test(track.name)) track.name = track.name.replace(/^Chords /, 'Notes ');
  else                                        track.name = track.name + ' · notes';
  // Each chord-block becomes a CLIP containing that chord's notes.
  const clips = [];
  for (const block of track.items) {
    const shift = block.semitoneShift || 0;
    const midis = chordToMidiNotes(block.keyRoot, state.octave, block.interval, block.q)
      .map(n => Math.max(0, Math.min(127, n + shift)));
    const notes = midis.map(midi => ({
      midi, label: midiNoteLabel(midi),
      start: 0, beats: block.beats,
    }));
    clips.push(makeClip({
      start: block.start, beats: block.beats,
      label: block.label || null,
      notes,
    }));
  }
  clips.sort((a, b) => a.start - b.start);
  track.items = clips;
  track.kind  = 'free';
  // Reset playback cursor in case we were playing
  track.pendingIdx = 0;
  track.pendingTime = 0;
  // The lane element keeps the same data-track-id but its bound drag-drop
  // logic was the chord variant — replace it with a fresh free-kind lane
  // at the SAME DOM position so the visual order is preserved.
  const oldLane = document.querySelector(`.seq-lane[data-track-id="${track.id}"]`);
  if (oldLane) {
    const parent = oldLane.parentNode;
    const newLane = document.createElement('div');
    newLane.className = 'seq-lane';
    newLane.dataset.trackId = track.id;
    parent.insertBefore(newLane, oldLane);
    oldLane.remove();
    initFreeLane(newLane);
  }
  rebuildTracksUI();
  seqRenderAll();
  seqResyncTrack(track);
  // Open the piano-roll for the first clip if any, so the user immediately
  // sees they can now edit notes.
  if (track.items.length > 0) openPianoRoll(track, track.items[0]);
  seqSave();
}

function deleteTrack(id) {
  const tr = SEQ.tracksList.find(t => t.id === id);
  const name = tr?.name || 'this track';
  showConfirm({
    title: 'Delete track',
    message: `Delete “${name}”?`,
    confirmLabel: 'Delete',
    danger: true,
    onConfirm: () => {
      if (SEQ.focusedClip?.trackId === id) closePianoRoll();
      removeTrackById(id);
      document.querySelectorAll(`[data-track-id="${id}"]`).forEach(el => el.remove());
      rebuildTracksUI();
      seqRenderAll();
      seqSave();
    }
  });
}

function showConfirm({ title = 'Confirm', message = '', confirmLabel = 'OK', cancelLabel = 'Cancel', danger = false, onConfirm, onCancel } = {}) {
  // Remove any existing confirm
  document.querySelectorAll('.cp-confirm').forEach(el => el.remove());
  const overlay = document.createElement('div');
  overlay.className = 'cp-confirm';
  overlay.innerHTML = `
    <div class="cp-confirm-backdrop"></div>
    <div class="cp-confirm-panel" role="dialog" aria-modal="true">
      <div class="cp-confirm-title">${escapeHtml(title)}</div>
      <div class="cp-confirm-message">${escapeHtml(message)}</div>
      <div class="cp-confirm-actions">
        <button type="button" class="cp-confirm-btn cp-confirm-cancel">${escapeHtml(cancelLabel)}</button>
        <button type="button" class="cp-confirm-btn cp-confirm-ok${danger ? ' danger' : ''}">${escapeHtml(confirmLabel)}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  const close = () => { overlay.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); onCancel?.(); }
    else if (e.key === 'Enter') { e.preventDefault(); close(); onConfirm?.(); }
  };
  document.addEventListener('keydown', onKey);
  overlay.querySelector('.cp-confirm-backdrop').addEventListener('click', () => { close(); onCancel?.(); });
  overlay.querySelector('.cp-confirm-cancel').addEventListener('click', () => { close(); onCancel?.(); });
  overlay.querySelector('.cp-confirm-ok').addEventListener('click', () => { close(); onConfirm?.(); });
  // Focus the confirm button (or cancel for safety on danger? — focus cancel for danger).
  setTimeout(() => {
    overlay.querySelector(danger ? '.cp-confirm-cancel' : '.cp-confirm-ok')?.focus();
  }, 0);
}

function rebuildTracksUI() {
  // Make sure each track has a sidebar header and a lane element
  for (const t of SEQ.tracksList) {
    ensureTrackHeader(t);
    ensureTrackLane(t);
  }
  // Remove DOM for tracks that no longer exist
  document.querySelectorAll('.seq-track-label[data-track-id]').forEach(label => {
    if (!trackById(label.dataset.trackId)) label.remove();
  });
  document.querySelectorAll('.seq-lane[data-track-id]').forEach(lane => {
    if (!trackById(lane.dataset.trackId)) lane.remove();
  });
  // Remove orphan HTML rows that never had a track-id (legacy "melody"
  // label + #seq-note-lane). Without this they sit in the sidebar/lane
  // stack and push every dynamically-added track out of vertical alignment.
  document.querySelectorAll('.seq-track-label:not([data-track-id])').forEach(el => el.remove());
  document.getElementById('seq-note-lane')?.remove();
  // Re-order DOM to match tracksList order. The default hardcoded HTML
  // lanes can sit in arbitrary positions when localStorage tracks reuse
  // their ids, and inserting new lanes before the resize handle no longer
  // guarantees correct order when default lanes are involved.
  const sidebar = document.getElementById('seq-track-sidebar');
  const addBtn  = document.getElementById('seq-add-track-btn');
  const inner   = document.getElementById('seq-tracks-inner');
  const handle  = inner?.querySelector('.midi-lane-resize-handle');
  if (sidebar && addBtn) {
    for (const t of SEQ.tracksList) {
      const lbl = document.querySelector(`.seq-track-label[data-track-id="${t.id}"]`);
      if (lbl) sidebar.insertBefore(lbl, addBtn);
    }
  }
  if (inner) {
    for (const t of SEQ.tracksList) {
      const lane = document.querySelector(`.seq-lane[data-track-id="${t.id}"]`);
      if (!lane) continue;
      if (handle) inner.insertBefore(lane, handle);
      else        inner.appendChild(lane);
    }
  }
  _ensureGlobalPlayhead();
  refreshLucide();
  syncTrackLabelHeights();
}

// Legacy entry-point kept for places that called buildTrackHeaders before
function buildTrackHeaders() { rebuildTracksUI(); }

// ----- Add Track button + menu -----
function openAddTrackMenu(anchor) {
  document.querySelectorAll('.seq-add-track-menu').forEach(m => m.remove());
  const menu = document.createElement('div');
  menu.className = 'seq-add-track-menu';
  menu.innerHTML = `
    <button data-kind="chord">+ Chord track</button>
    <button data-kind="free">+ Free track</button>
  `;
  const r = anchor.getBoundingClientRect();
  menu.style.left = (r.left) + 'px';
  menu.style.top  = (r.bottom + 4) + 'px';
  document.body.appendChild(menu);
  const close = (e) => {
    if (e && menu.contains(e.target)) return;
    menu.remove();
    document.removeEventListener('mousedown', close, true);
  };
  setTimeout(() => document.addEventListener('mousedown', close, true), 0);
  menu.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const kind = btn.dataset.kind;
      const baseName = kind === 'chord' ? 'Chords' : 'Free';
      const sameKindCount = tracksOfKind(kind).length;
      const name = sameKindCount === 0 ? baseName : `${baseName} ${sameKindCount + 1}`;
      const tr = addTrack(kind, { name });
      if (!tr.synth) tr.synth = { ...state.synth };
      seqCheckpoint();
      rebuildTracksUI();
      seqRenderAll();
      seqSave();
      menu.remove();
      document.removeEventListener('mousedown', close, true);
    });
  });
}
document.getElementById('seq-add-track-btn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  openAddTrackMenu(e.currentTarget);
});

// ----- Per-lane drag-drop init (called once per track lane DOM element) -----
function initChordLane(lane) {
  const getTrack = () => trackById(lane.dataset.trackId);
  const _hint = () => lane.querySelector('.seq-drop-hint');
  lane.addEventListener('dragover', (e) => {
    if (!e.dataTransfer.types.includes('application/x-chord')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    lane.classList.add('drag-over');
    _hint()?.style.setProperty('color', 'var(--accent)');
    const rect = lane.getBoundingClientRect();
    const beat = Math.max(0, arrSnap((e.clientX - rect.left) / BEAT_PX));
    seqSetGhost(lane, beat, chordDropLen());
  });
  lane.addEventListener('dragleave', (e) => {
    if (!lane.contains(e.relatedTarget)) { lane.classList.remove('drag-over'); seqClearGhost(lane); }
  });
  lane.addEventListener('drop', (e) => {
    e.preventDefault();
    lane.classList.remove('drag-over');
    _hint()?.style.removeProperty('color');
    seqClearGhost(lane);
    const raw = e.dataTransfer.getData('application/x-chord');
    if (!raw) return;
    const t = getTrack();
    if (!t) return;
    const data = JSON.parse(raw);
    const rect = lane.getBoundingClientRect();
    const dropBeat = Math.max(0, arrSnap((e.clientX - rect.left) / BEAT_PX));
    const beats    = chordDropLen();
    seqCheckpoint();
    t.items.push({
      interval: data.interval, q: data.q, bassInterval: data.bassInterval, label: data.label,
      beats, start: dropBeat,
      keyRoot: state.keys[state.currentTemplate], template: state.currentTemplate,
    });
    t.items.sort((a, b) => a.start - b.start);
    seqAutoExtendLoop(dropBeat + beats);
    seqRenderTrack(t);
    seqResyncTrack(t);
  });
}

function initFreeLane(lane) {
  const getTrack = () => trackById(lane.dataset.trackId);
  lane.addEventListener('dragover', (e) => {
    const hasNote  = e.dataTransfer.types.includes('application/x-note');
    const hasChord = e.dataTransfer.types.includes('application/x-chord');
    if (!hasNote && !hasChord) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    lane.classList.add('drag-over');
    const rect = lane.getBoundingClientRect();
    const beat = Math.max(0, arrSnap((e.clientX - rect.left) / BEAT_PX));
    seqSetGhost(lane, beat, hasChord ? chordDropLen() : 1);
  });
  lane.addEventListener('dragleave', (e) => {
    if (!lane.contains(e.relatedTarget)) { lane.classList.remove('drag-over'); seqClearGhost(lane); }
  });
  lane.addEventListener('drop', (e) => {
    e.preventDefault();
    lane.classList.remove('drag-over');
    seqClearGhost(lane);
    const t = getTrack();
    if (!t) return;
    const rect = lane.getBoundingClientRect();
    const dropBeat = Math.max(0, arrSnap((e.clientX - rect.left) / BEAT_PX));
    // Chord-pad drop → create a chord-clip (one bar long, chord notes inside).
    const rawChord = e.dataTransfer.getData('application/x-chord');
    if (rawChord) {
      const data  = JSON.parse(rawChord);
      const beats = chordDropLen();
      const midis = chordToMidiNotes(state.keys[state.currentTemplate], state.octave, data.interval, data.q);
      seqCheckpoint();
      const clip = makeClip({
        start: dropBeat, beats,
        label: data.label || null,
        notes: midis.map(midi => ({ midi, label: midiNoteLabel(midi), start: 0, beats })),
      });
      t.items.push(clip);
      t.items.sort((a, b) => a.start - b.start);
      seqAutoExtendLoop(dropBeat + beats);
      seqRenderTrack(t);
      seqResyncTrack(t);
      return;
    }
    // Single keyboard note drop → 1-note clip (quarter-note default).
    const raw = e.dataTransfer.getData('application/x-note');
    if (!raw) return;
    const data = JSON.parse(raw);
    seqCheckpoint();
    const clip = makeClip({
      start: dropBeat, beats: 1,
      label: data.label,
      notes: [{ midi: data.midi, label: data.label, start: 0, beats: 1 }],
    });
    t.items.push(clip);
    t.items.sort((a, b) => a.start - b.start);
    seqAutoExtendLoop(dropBeat + 1);
    seqRenderTrack(t);
    seqResyncTrack(t);
  });
}

// ----- Per-track render -----
function _appendLaneOverlays(_lane) {
  // No per-lane overlays anymore — loop tags + bar sit on the ruler and
  // the playhead spans the whole arrangement view from the inner container.
}

// Ensure exactly one global playhead spans the ruler + all lanes inside
// seq-tracks-inner. Called from rebuildTracksUI / on init.
function _ensureGlobalPlayhead() {
  const inner = document.getElementById('seq-tracks-inner');
  if (!inner) return;
  let ph = inner.querySelector(':scope > .seq-playhead');
  if (!ph) {
    ph = document.createElement('div');
    ph.className = 'seq-playhead seq-playhead-global';
    inner.appendChild(ph);
  }
  // Always show the playhead — even when not playing — at the current
  // play-cursor position so the user sees where playback will start.
  ph.style.display = 'block';
  ph.style.left = ((SEQ.startBeat ?? 0) * BEAT_PX) + 'px';
  return ph;
}

function _appendRulerLoopHandles() {
  const ruler = document.getElementById('seq-ruler');
  if (!ruler) return;
  ruler.querySelectorAll('.seq-loop-bar').forEach(h => h.remove());
  const bar = document.createElement('div');
  bar.className = 'seq-loop-bar';
  bar.innerHTML = '<div class="seq-loop-bar-left"></div><div class="seq-loop-bar-right"></div>';
  _positionLoopBar(bar);
  ruler.appendChild(bar);
  _bindLoopBar(bar);
}

function _positionLoopBar(bar) {
  bar.style.left  = (SEQ.loopStart * BEAT_PX) + 'px';
  bar.style.width = Math.max(2, (SEQ.loopEnd - SEQ.loopStart) * BEAT_PX) + 'px';
}

function _bindLoopBar(bar) {
  const lefth  = bar.querySelector('.seq-loop-bar-left');
  const righth = bar.querySelector('.seq-loop-bar-right');
  const startDrag = (mode) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    seqCheckpoint();
    bar.setPointerCapture(e.pointerId);
    const ruler = bar.parentElement;
    const startX = e.clientX;
    const initStart = SEQ.loopStart, initEnd = SEQ.loopEnd;
    const onMove = (ev) => {
      const rect = ruler.getBoundingClientRect();
      if (mode === 'left') {
        const beat = Math.max(0, Math.round((ev.clientX - rect.left) / BEAT_PX));
        SEQ.loopStart = Math.min(beat, SEQ.loopEnd - 1);
      } else if (mode === 'right') {
        const beat = Math.max(0, Math.round((ev.clientX - rect.left) / BEAT_PX));
        SEQ.loopEnd = Math.max(beat, SEQ.loopStart + 1);
      } else {
        const dxBeats = Math.round((ev.clientX - startX) / BEAT_PX);
        const len = initEnd - initStart;
        const newStart = Math.max(0, initStart + dxBeats);
        SEQ.loopStart = newStart;
        SEQ.loopEnd   = newStart + len;
      }
      _positionLoopBar(bar);
      seqUpdateLoopStart();
      seqUpdateLoopEnd();
      if (SEQ.loop) seqResyncAllThrottled();
    };
    const onUp = () => {
      bar.removeEventListener('pointermove', onMove);
      bar.removeEventListener('pointerup', onUp);
      if (SEQ.playing && SEQ.loop) seqLoopBaseChangedResync();
      seqSave();
    };
    bar.addEventListener('pointermove', onMove);
    bar.addEventListener('pointerup', onUp);
  };
  lefth.addEventListener('pointerdown', startDrag('left'));
  righth.addEventListener('pointerdown', startDrag('right'));
}

function _bindLaneLoopHandle(handle, lane, which) {
  handle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handle.setPointerCapture(e.pointerId);
    const onMove = (ev) => {
      const rect = lane.getBoundingClientRect();
      const beat = Math.max(0, Math.round((ev.clientX - rect.left) / BEAT_PX));
      if (which === 'start') {
        SEQ.loopStart = Math.min(beat, SEQ.loopEnd - 1);
        seqUpdateLoopStart();
      } else {
        SEQ.loopEnd = Math.max(beat, SEQ.loopStart + 1);
        seqUpdateLoopEnd();
      }
      if (SEQ.loop) seqResyncAllThrottled();
    };
    const onUp = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      if (SEQ.playing && SEQ.loop) seqLoopBaseChangedResync();
      seqSave();
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
  });
}

// Render an .overlap-region div in the lane for every intersection between
// two items in the items array. Both items become semi-transparent so the
// underlying overlap stripes are visible.
function _markOverlaps(lane, items) {
  if (!lane || !items) return;
  // Clear previous overlap markers
  lane.querySelectorAll(':scope > .overlap-region').forEach(el => el.remove());
  const overlapIdx = new Set();
  const regions = [];
  for (let i = 0; i < items.length; i++) {
    const a = items[i];
    const aEnd = a.start + (a.beats || 0);
    for (let j = i + 1; j < items.length; j++) {
      const b = items[j];
      const bEnd = b.start + (b.beats || 0);
      if (a.start < bEnd && b.start < aEnd) {
        overlapIdx.add(i);
        overlapIdx.add(j);
        regions.push({
          start: Math.max(a.start, b.start),
          end:   Math.min(aEnd, bEnd),
        });
      }
    }
  }
  const blocks = lane.querySelectorAll(':scope > .seq-block');
  blocks.forEach((el, i) => {
    el.classList.toggle('overlapping', overlapIdx.has(i));
  });
  for (const r of regions) {
    const region = document.createElement('div');
    region.className = 'overlap-region';
    region.style.left  = (r.start * BEAT_PX) + 'px';
    region.style.width = ((r.end - r.start) * BEAT_PX) + 'px';
    lane.appendChild(region);
  }
}

function seqRenderTrack(track) {
  if (!track) return;
  // Any render of a free track may follow a mutation — invalidate the
  // cached flat-notes view so playback picks up the latest content.
  if (track.kind === 'free') invalidateFreeTrackFlat(track);
  // If the focused clip belongs to this track, keep the piano-roll in sync
  if (track.kind === 'free' && SEQ.focusedClip?.trackId === track.id) renderPianoRoll();
  // Default tracks delegate to their legacy renderers — but only while
  // they still match their original kind.
  if (track.id === 'tr-default-chord' && track.kind === 'chord') return seqRender();
  if (track.id === 'tr-default-free'  && track.kind === 'free')  return seqRenderFreeClips(track);
  const lane = document.querySelector(`.seq-lane[data-track-id="${track.id}"]`);
  if (!lane) return;
  lane.innerHTML = '';
  if (track.items.length > 0) {
    lane.style.minWidth = seqLaneWidth(track.items) + 'px';
    if (track.kind === 'free') {
      // Render each clip as a labeled block with a mini-roll preview.
      track.items.forEach((clip, idx) => lane.appendChild(seqMakeClipBlock(track, clip, idx)));
    } else {
      track.items.forEach((item, idx) => lane.appendChild(seqMakeBlock(item, idx, false, false)));
    }
    _markOverlaps(lane, track.items);
  } else {
    lane.style.minWidth = '';
    // Don't clear minHeight here — syncTrackLabelHeights below will set it
    // to match the sidebar label so empty tracks stay aligned with their
    // taller-than-CSS-default neighbours.
  }
  _appendLaneOverlays(lane);
  syncTrackLabelHeights();
  seqUpdateLoopVisible();
}

// Render a free-kind default track's lane as clip blocks (used for the
// hardcoded #seq-midi-lane when its track is free).
function seqRenderFreeClips(track) {
  const lane = document.querySelector(`.seq-lane[data-track-id="${track.id}"]`)
            || document.getElementById('seq-midi-lane');
  if (!lane) return;
  lane.innerHTML = '';
  if (track.items.length > 0) {
    lane.style.minWidth = seqLaneWidth(track.items) + 'px';
    track.items.forEach((clip, idx) => lane.appendChild(seqMakeClipBlock(track, clip, idx)));
    _markOverlaps(lane, track.items);
  } else {
    lane.style.minWidth = '';
  }
  _appendLaneOverlays(lane);
  syncTrackLabelHeights();
  seqUpdateLoopVisible();
}

// Build a DOM block for a clip on a free track. Includes mini-roll
// preview of its notes, drag-to-move, ✕ delete, click → open piano-roll.
function seqMakeClipBlock(track, clip, idx) {
  const block = document.createElement('div');
  block.className = 'seq-block seq-clip-block';
  block.dataset.clipId = clip.id;
  block.style.left  = (clip.start * BEAT_PX) + 'px';
  block.style.width = (clip.beats * BEAT_PX) + 'px';

  // No label inside the clip — the mini-roll preview communicates content.

  // Mini-roll preview — pad the pitch range by a half octave above and
  // below so notes never sit right on the clip's top/bottom edge.
  if (clip.notes.length > 0) {
    const midis = clip.notes.map(n => n.midi);
    const hi = Math.max(...midis) + 6;
    const lo = Math.min(...midis) - 6;
    const span = Math.max(1, hi - lo);
    const mini = document.createElement('div');
    mini.className = 'seq-clip-mini';
    for (const note of clip.notes) {
      const n = document.createElement('div');
      n.className = 'seq-clip-mini-note';
      n.style.left   = (note.start / clip.beats * 100) + '%';
      n.style.width  = Math.max(2, (note.beats / clip.beats * 100)) + '%';
      n.style.bottom = (((note.midi - lo) / span) * 100) + '%';
      mini.appendChild(n);
    }
    block.appendChild(mini);
  }

  // Resize handle on LEFT edge — pulls the clip start earlier or later
  // while keeping note absolute positions; notes shift relative to the
  // new start so what was at song-beat X stays at song-beat X.
  const resizeL = document.createElement('div');
  resizeL.className = 'seq-resize seq-resize-left';
  resizeL.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); e.preventDefault();
    seqCheckpoint();
    resizeL.setPointerCapture(e.pointerId);
    const startX = e.clientX, startStart = clip.start, startBts = clip.beats;
    const startNoteStarts = clip.notes.map(n => n.start);
    const snap = SEQ.arrSnap ? SEQ.arrSnapVal : 0.5;
    const miniNotes = block.querySelectorAll('.seq-clip-mini-note');
    const laneL = block.parentElement;
    let ghost = null;
    if (SEQ.arrSnap && laneL) {
      ghost = document.createElement('div');
      ghost.className = 'seq-ghost';
      ghost.style.left  = (clip.start * BEAT_PX) + 'px';
      ghost.style.width = (clip.beats * BEAT_PX) + 'px';
      laneL.appendChild(ghost);
    }
    const onMove = (ev) => {
      const dxBeats = (ev.clientX - startX) / BEAT_PX;
      const maxDelta = startBts - snap;
      const delta = Math.max(-startStart, Math.min(maxDelta, dxBeats));
      clip.start = startStart + delta;
      clip.beats = startBts - delta;
      block.style.left  = (clip.start * BEAT_PX) + 'px';
      block.style.width = (clip.beats * BEAT_PX) + 'px';
      clip.notes.forEach((n, i) => {
        n.start = startNoteStarts[i] - delta;
        const el = miniNotes[i];
        if (!el) return;
        el.style.left  = (n.start / clip.beats * 100) + '%';
        el.style.width = Math.max(2, (n.beats / clip.beats * 100)) + '%';
      });
      if (ghost) {
        const snappedStart = Math.max(0, Math.round(clip.start / snap) * snap);
        const ghostDelta = snappedStart - startStart;
        const ghostBeats = Math.max(snap, startBts - ghostDelta);
        ghost.style.left  = (snappedStart * BEAT_PX) + 'px';
        ghost.style.width = (ghostBeats * BEAT_PX) + 'px';
      }
      seqResyncTrackThrottled(track);
    };
    const onUp = () => {
      resizeL.removeEventListener('pointermove', onMove);
      resizeL.removeEventListener('pointerup', onUp);
      if (ghost) ghost.remove();
      const snapped = Math.max(0, Math.round(clip.start / snap) * snap);
      const delta = snapped - clip.start;
      clip.start = snapped;
      clip.beats = Math.max(snap, clip.beats - delta);
      clip.notes.forEach(n => { n.start -= delta; });
      seqRenderTrack(track);
      seqSave();
    };
    resizeL.addEventListener('pointermove', onMove);
    resizeL.addEventListener('pointerup', onUp);
  });
  block.appendChild(resizeL);

  // Resize handle on right edge
  const resize = document.createElement('div');
  resize.className = 'seq-resize';
  resize.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); e.preventDefault();
    seqCheckpoint();
    resize.setPointerCapture(e.pointerId);
    const startX = e.clientX, startBts = clip.beats;
    const snap = SEQ.arrSnap ? SEQ.arrSnapVal : 0.5;
    const miniNotes = block.querySelectorAll('.seq-clip-mini-note');
    const lane = block.parentElement;
    let ghost = null;
    if (SEQ.arrSnap && lane) {
      ghost = document.createElement('div');
      ghost.className = 'seq-ghost';
      ghost.style.left  = (clip.start * BEAT_PX) + 'px';
      ghost.style.width = (clip.beats * BEAT_PX) + 'px';
      lane.appendChild(ghost);
    }
    const onMove = (ev) => {
      clip.beats = Math.max(snap, startBts + (ev.clientX - startX) / BEAT_PX);
      block.style.width = (clip.beats * BEAT_PX) + 'px';
      clip.notes.forEach((n, i) => {
        const el = miniNotes[i];
        if (!el) return;
        el.style.left  = (n.start / clip.beats * 100) + '%';
        el.style.width = Math.max(2, (n.beats / clip.beats * 100)) + '%';
      });
      if (ghost) {
        const snappedB = Math.max(snap, Math.round(clip.beats / snap) * snap);
        ghost.style.left  = (clip.start * BEAT_PX) + 'px';
        ghost.style.width = (snappedB * BEAT_PX) + 'px';
      }
      seqResyncTrackThrottled(track);
    };
    const onUp = () => {
      resize.removeEventListener('pointermove', onMove);
      resize.removeEventListener('pointerup', onUp);
      if (ghost) ghost.remove();
      clip.beats = Math.max(snap, Math.round(clip.beats / snap) * snap);
      seqAutoExtendLoop(clip.start + clip.beats);
      seqRenderTrack(track);
      seqSave();
    };
    resize.addEventListener('pointermove', onMove);
    resize.addEventListener('pointerup', onUp);
  });
  block.appendChild(resize);

  // Split-mode hover preview: a thin vertical guide at the snapped split
  // position, plus a dashed outline of the resulting right-half clip.
  block.addEventListener('pointermove', (e) => {
    if (SEQ.arrTool !== 'split') return;
    const rect = block.getBoundingClientRect();
    let relBeat = ((e.clientX - rect.left) / BEAT_PX);
    if (SEQ.arrSnap) relBeat = Math.round(relBeat / SEQ.arrSnapVal) * SEQ.arrSnapVal;
    const minSeg = 0.25;
    let guide = block.querySelector('.split-guide');
    let ghostR = block.querySelector('.split-ghost-right');
    if (relBeat <= minSeg || relBeat >= clip.beats - minSeg) {
      guide?.remove();
      ghostR?.remove();
      return;
    }
    if (!guide)  { guide  = document.createElement('div'); guide.className  = 'split-guide';       block.appendChild(guide); }
    if (!ghostR) { ghostR = document.createElement('div'); ghostR.className = 'split-ghost-right'; block.appendChild(ghostR); }
    const px = relBeat * BEAT_PX;
    guide.style.left  = (px - 0.5) + 'px';
    ghostR.style.left  = px + 'px';
    ghostR.style.width = ((clip.beats - relBeat) * BEAT_PX) + 'px';
  });
  block.addEventListener('pointerleave', () => {
    block.querySelector('.split-guide')?.remove();
    block.querySelector('.split-ghost-right')?.remove();
  });

  // Move by drag · single click opens the piano-roll for this clip
  block.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.seq-resize') || e.target.closest('.seq-delete')) return;
    if (SEQ.arrTool === 'pan' || SEQ._arrSpaceHeld) return; // pan handled on wrap
    if (SEQ.arrTool === 'erase') {
      e.preventDefault();
      seqCheckpoint();
      const i = track.items.indexOf(clip);
      if (i >= 0) track.items.splice(i, 1);
      if (SEQ.focusedClip?.clipId === clip.id) closePianoRoll();
      seqRenderTrack(track);
      seqResyncTrack(track);
      seqSave();
      return;
    }
    if (SEQ.arrTool === 'split') {
      e.preventDefault();
      e.stopPropagation();
      const rect = block.getBoundingClientRect();
      // Clip-relative beat at click position. Snap if snap is on.
      let relBeat = ((e.clientX - rect.left) / BEAT_PX);
      if (SEQ.arrSnap) relBeat = Math.round(relBeat / SEQ.arrSnapVal) * SEQ.arrSnapVal;
      // Need a meaningful split — not at very start / very end.
      const minSeg = 0.25;
      if (relBeat <= minSeg || relBeat >= clip.beats - minSeg) return;
      seqCheckpoint();
      // Notes whose start is BEFORE the split stay in the left clip;
      // notes starting AT/AFTER the split move to the right clip with
      // their start adjusted relative to the new clip-start.
      const leftNotes  = [];
      const rightNotes = [];
      for (const n of clip.notes) {
        if (n.start < relBeat) leftNotes.push({ ...n });
        else                   rightNotes.push({ ...n, start: n.start - relBeat });
      }
      const left = makeClip({
        start: clip.start, beats: relBeat,
        label: clip.label || null,
        notes: leftNotes,
      });
      const right = makeClip({
        start: clip.start + relBeat,
        beats: clip.beats - relBeat,
        label: null,
        notes: rightNotes,
      });
      const i = track.items.indexOf(clip);
      if (i >= 0) track.items.splice(i, 1, left, right);
      // Keep focus on the LEFT half if the user was editing this clip.
      if (SEQ.focusedClip?.clipId === clip.id) {
        SEQ.focusedClip = { trackId: track.id, clipId: left.id };
      }
      track.items.sort((a, b) => a.start - b.start);
      seqRenderTrack(track);
      seqResyncTrack(track);
      seqSave();
      return;
    }
    if (SEQ.arrTool === 'merge') {
      e.preventDefault();
      e.stopPropagation();
      if (!SEQ._mergeFirst) {
        SEQ._mergeFirst = { trackId: track.id, clipId: clip.id };
        block.classList.add('merge-pending');
        return;
      }
      const first = SEQ._mergeFirst;
      // Same clip clicked twice → cancel the merge.
      if (first.trackId === track.id && first.clipId === clip.id) {
        SEQ._mergeFirst = null;
        document.querySelectorAll('.seq-block.merge-pending').forEach(el => el.classList.remove('merge-pending'));
        return;
      }
      // Different track → silently restart with the new clip as first.
      if (first.trackId !== track.id) {
        document.querySelectorAll('.seq-block.merge-pending').forEach(el => el.classList.remove('merge-pending'));
        SEQ._mergeFirst = { trackId: track.id, clipId: clip.id };
        block.classList.add('merge-pending');
        return;
      }
      SEQ._mergeFirst = null;
      document.querySelectorAll('.seq-block.merge-pending').forEach(el => el.classList.remove('merge-pending'));
      const t = trackById(first.trackId);
      if (!t || t.kind !== 'free') return;
      const a = t.items.find(it => it.id === first.clipId);
      const b = clip;
      if (!a || !b) return;
      seqCheckpoint();
      const newStart = Math.min(a.start, b.start);
      const newEnd   = Math.max(a.start + a.beats, b.start + b.beats);
      const aOffset  = a.start - newStart;
      const bOffset  = b.start - newStart;
      const mergedNotes = [
        ...a.notes.map(n => ({ ...n, start: n.start + aOffset })),
        ...b.notes.map(n => ({ ...n, start: n.start + bOffset })),
      ].sort((x, y) => x.start - y.start);
      const merged = makeClip({
        start: newStart,
        beats: newEnd - newStart,
        label: a.label || b.label || null,
        notes: mergedNotes,
      });
      t.items = t.items.filter(it => it !== a && it !== b);
      t.items.push(merged);
      t.items.sort((x, y) => x.start - y.start);
      seqAutoExtendLoop(merged.start + merged.beats);
      // Focus the merged clip in the piano-roll if one of the originals was focused.
      if (SEQ.focusedClip?.clipId === a.id || SEQ.focusedClip?.clipId === b.id) {
        SEQ.focusedClip = { trackId: t.id, clipId: merged.id };
      }
      seqRenderTrack(t);
      seqResyncTrack(t);
      seqSave();
      return;
    }
    e.preventDefault();
    seqCheckpoint();
    try { block.setPointerCapture(e.pointerId); } catch (_) {}
    // Audible preview of the clip's first downbeat — routed through the
    // same target as playback (track instrument OR external MIDI).
    if (track) {
      const previewMidi = [];
      if (track.kind === 'free' && Array.isArray(clip.notes)) {
        clip.notes.filter(n => (n.start || 0) < 0.05).forEach(n => previewMidi.push(n.midi));
      } else if (clip.interval !== undefined) {
        const kr = clip.keyRoot !== undefined ? clip.keyRoot : state.keys[state.currentTemplate];
        chordToMidiNotes(kr, state.octave, clip.interval, clip.q).forEach(m => previewMidi.push(m));
      }
      if (previewMidi.length) {
        if (track.output === 'midi') {
          const port = midiPortById(track.midiPortId);
          const vel  = seqTrackVel(track, state.velocity);
          previewMidi.forEach(m => sendNoteOn(m, vel, track.channel, port));
          const stop = () => previewMidi.forEach(m => sendNoteOff(m, track.channel, port));
          block.addEventListener('pointerup',     stop, { once: true });
          block.addEventListener('pointercancel', stop, { once: true });
        } else if (state.audioEnabled) {
          const inst = seqTrackInstrument(track);
          const previewNodes = [];
          previewMidi.forEach(m => {
            let node;
            withSynth(track.synth, () => { node = startAudioNote(m, state.velocity, null, null, inst); });
            if (node) previewNodes.push(node);
          });
          const stop = () => previewNodes.forEach(stopAudioNote);
          block.addEventListener('pointerup',     stop, { once: true });
          block.addEventListener('pointercancel', stop, { once: true });
        }
      }
    }
    const startX = e.clientX, startY = e.clientY, startBeat = clip.start;
    const snap = SEQ.arrSnap ? SEQ.arrSnapVal : (1 / BEAT_PX);
    const sourceLane = block.parentElement;
    // Build the move group: if the dragged clip is part of a multi-select,
    // every selected item moves with it. Otherwise just this clip.
    const anchorInSel = SEQ.selection.some(s => s.item === clip);
    const group = (anchorInSel && SEQ.selection.length > 1)
      ? SEQ.selection.map(s => ({
          track: trackByRef(_selKey(s)),
          item: s.item,
          origStart: s.item.start,
        })).filter(g => g.track)
      : [{ track, item: clip, origStart: startBeat }];
    const tracksInvolved = new Set(group.map(g => g.track.id));
    const canCrossTrack  = tracksInvolved.size === 1;
    let cloneCreated = false;
    let moved = false;
    let ghost = null;
    let groupGhosts = []; // one ghost per selected item when multi-dragging
    let targetLane = sourceLane;
    let targetTrack = track;
    const removeGroupGhosts = () => {
      groupGhosts.forEach(gg => gg.remove());
      groupGhosts = [];
    };
    const onMove = (ev) => {
      _edgeAutoScroll(document.getElementById('seq-lane-wrap'), ev.clientX);
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!moved && Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
      const altCopy = e.altKey || ev.altKey;
      // Shift constrains the drag to its dominant axis. Horizontal-lock =
      // pure time-shift (no lane change). Vertical-lock = lane change only
      // (no time-shift).
      const shiftLock      = !!ev.shiftKey;
      const lockVertical   = shiftLock && Math.abs(dy) > Math.abs(dx);
      const lockHorizontal = shiftLock && !lockVertical;
      const effDx = lockVertical ? 0 : dx;
      // Alt-copy: originals are NEVER mutated — clones are spawned at the
      // drop position on release. So nothing to do here.
      moved = true;
      block.classList.add('moving');
      // Detect lane under cursor for cross-track drop. Free-clip drops are
      // allowed on free-lanes only (no free→chord). Cross-track is only
      // permitted when the whole selection lives in a single source track.
      // When shift-lock-horizontal is active, suppress lane changes.
      const els = document.elementsFromPoint(ev.clientX, ev.clientY);
      const overLane = els.find(el => el.classList?.contains('seq-lane'));
      if (!lockHorizontal && overLane && overLane !== sourceLane && canCrossTrack) {
        const t = trackById(overLane.dataset.trackId);
        if (t && t.kind === 'free') { targetLane = overLane; targetTrack = t; }
        else { targetLane = sourceLane; targetTrack = track; }
      } else {
        targetLane = sourceLane; targetTrack = track;
      }
      const crossing = targetLane !== sourceLane;
      // Same-lane group: move every block by the same delta. Cross-lane:
      // freeze blocks at origins, ghost previews the anchor's drop position.
      // Alt-copy: originals always stay put — only the ghosts move.
      const cursorBeat = Math.max(0, startBeat + effDx / BEAT_PX);
      const delta = cursorBeat - startBeat;
      if (crossing || altCopy) {
        for (const g of group) {
          // Defensively restore original start so an earlier non-alt move
          // doesn't leave the item displaced when alt is pressed later.
          g.item.start = g.origStart;
          const el = document.querySelector(`.seq-lane[data-track-id="${g.track.id}"] .seq-clip-block[data-clip-id="${g.item.id}"]`);
          if (el) el.style.left = (g.origStart * BEAT_PX) + 'px';
        }
      } else {
        for (const g of group) {
          g.item.start = Math.max(0, g.origStart + delta);
          const el = document.querySelector(`.seq-lane[data-track-id="${g.track.id}"] .seq-clip-block[data-clip-id="${g.item.id}"]`);
          if (el) el.style.left = (g.item.start * BEAT_PX) + 'px';
        }
      }
      const snapped = Math.max(0, Math.round(cursorBeat / snap) * snap);
      const snapDelta = snapped - startBeat;
      // Render a ghost for every selected clip at its snapped target spot.
      // First time through, create one ghost per group member.
      if (groupGhosts.length !== group.length) {
        removeGroupGhosts();
        for (let i = 0; i < group.length; i++) {
          const gg = document.createElement('div');
          gg.className = 'seq-ghost';
          groupGhosts.push(gg);
        }
      }
      for (let i = 0; i < group.length; i++) {
        const g = group[i];
        const gg = groupGhosts[i];
        // Anchor item's ghost goes in the target lane; the rest stay in
        // their own lanes (so multi-track selections remain per-track).
        const wantLane = (g.item === clip) ? targetLane : document.querySelector(`.seq-lane[data-track-id="${g.track.id}"]`);
        if (gg.parentElement !== wantLane && wantLane) wantLane.appendChild(gg);
        const gStart = Math.max(0, g.origStart + snapDelta);
        gg.style.width = (g.item.beats * BEAT_PX) + 'px';
        gg.style.left  = (gStart * BEAT_PX) + 'px';
        gg.classList.toggle('copy-drag', altCopy);
      }
      // Keep `ghost` pointing at the anchor's ghost for onUp drop-position logic.
      ghost = groupGhosts[group.indexOf(group.find(g => g.item === clip))] || groupGhosts[0];
      // Mid-drag resync so playback follows the dragged clip without waiting
      // for release. Throttled per-track to keep cost predictable.
      if (!altCopy) for (const g of group) seqResyncTrackThrottled(g.track);
    };
    const onUp = (ev) => {
      block.removeEventListener('pointermove', onMove);
      block.removeEventListener('pointerup', onUp);
      block.classList.remove('moving');
      const dropLeft = ghost ? parseFloat(ghost.style.left) || 0 : null;
      removeGroupGhosts();
      ghost = null;
      // Safety net: nuke ANY .seq-ghost stragglers anywhere in the doc
      // (chord-pad / pr / arrangement) so a stuck preview can't persist.
      document.querySelectorAll('.seq-ghost').forEach(g => g.remove());
      if (moved) {
        const altCopyFinal = e.altKey || (ev && ev.altKey);
        const tracksToRender = new Set();
        const anchorNewStart = Math.max(0, Math.round((dropLeft ?? startBeat * BEAT_PX) / BEAT_PX / snap) * snap);
        const anchorDelta = anchorNewStart - startBeat;
        const crossingFinal = targetTrack && targetTrack !== track && canCrossTrack;
        if (altCopyFinal) {
          // ALT-DROP — spawn fresh clones at the drop positions, originals
          // stay completely untouched.
          for (const g of group) {
            const src = g.item;
            const destTrack = crossingFinal ? targetTrack : g.track;
            const cloneStart = Math.max(0, g.origStart + anchorDelta);
            const clone = makeClip({
              start: Math.max(0, Math.round(cloneStart / snap) * snap),
              beats: src.beats,
              label: src.label || null,
              notes: Array.isArray(src.notes) ? src.notes.map(n => ({ ...n })) : [],
            });
            destTrack.items.push(clone);
            tracksToRender.add(destTrack.id);
          }
        } else if (crossingFinal) {
          // Cross-track move — anchor's snapped drop determines group delta.
          for (const g of group) {
            const idx = g.track.items.indexOf(g.item);
            if (idx >= 0) g.track.items.splice(idx, 1);
            g.item.start = Math.max(0, g.origStart + anchorDelta);
            g.item.start = Math.max(0, Math.round(g.item.start / snap) * snap);
            targetTrack.items.push(g.item);
            tracksToRender.add(g.track.id);
          }
          tracksToRender.add(targetTrack.id);
        } else {
          for (const g of group) {
            g.item.start = Math.max(0, Math.round(g.item.start / snap) * snap);
            tracksToRender.add(g.track.id);
          }
        }
        for (const tid of tracksToRender) {
          const t2 = trackById(tid);
          if (!t2) continue;
          t2.items.sort((a, b) => a.start - b.start);
          seqRenderTrack(t2);
          seqResyncTrack(t2);
        }
        seqAutoExtendLoop(clip.start + clip.beats);
      } else {
        // No drag → treat as a select click. Shift extends, plain replaces.
        const additive = !!(ev?.shiftKey || ev?.ctrlKey || ev?.metaKey);
        seqSelectionToggle(track, clip, additive);
      }
    };
    block.addEventListener('pointermove', onMove);
    block.addEventListener('pointerup', onUp);
    block.addEventListener('pointercancel', () => {
      removeGroupGhosts();
      // Belt-and-suspenders: nuke ANY .seq-ghost still in the document
      // (this drag may have left strays if a previous gesture cancelled).
      document.querySelectorAll('.seq-lane .seq-ghost').forEach(g => g.remove());
    }, { once: true });
  });
  block.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    // Un-hide the piano-roll section if the user had toggled it off.
    if (document.body.classList.contains('hide-pianoroll')) {
      document.body.classList.remove('hide-pianoroll');
      const btn = document.querySelector('.header-section-toggle[data-section="pianoroll"]');
      btn?.classList.add('active');
      try {
        const KEY = 'chordpad.hiddenSections';
        const hidden = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
        hidden.pianoroll = false;
        localStorage.setItem(KEY, JSON.stringify(hidden));
      } catch (_) {}
    }
    openPianoRoll(track, clip);
  });

  return block;
}

function seqRenderAll() {
  for (const t of SEQ.tracksList) seqRenderTrack(t);
}

// Per-track resync (alias kept for older call sites)
function seqResyncChordsTrack(track) { seqResyncTrack(track); }

function toggleTrackCollapse(label, track) {
  const isNowCollapsed = label.classList.toggle('track-collapsed');
  const lane = document.querySelector(`.seq-lane[data-track-id="${label.dataset.trackId}"]`);
  if (lane) lane.classList.toggle('track-collapsed', isNowCollapsed);
  if (track && track.kind === 'free' && track.id === 'tr-default-free') seqRenderMidi();
  const icon = label.querySelector('.seq-th-collapse [data-lucide]');
  if (icon) { icon.setAttribute('data-lucide', isNowCollapsed ? 'chevrons-up-down' : 'chevrons-down-up'); refreshLucide(); }
  syncTrackLabelHeights();
}

buildTrackHeaders();
// Preload samples for any per-track instrument that isn't already covered by the global one.
// SF2-backed instruments (including all gm<N> presets) are loaded via the SF2 bank, not mp3 samples.
for (const tr of SEQ.tracksList) {
  if (!tr.instrument || tr.instrument === 'synth' || tr.instrument === state.instrument) continue;
  if (INSTRUMENT_TO_SF2[tr.instrument] != null) continue;
  if (!SAMPLE_DEFS || !SAMPLE_DEFS[tr.instrument]) continue;
  preloadSamplesOnGesture(tr.instrument);
}

function rollSnapBeat(val) {
  if (!SEQ.rollSnap) return val;
  const s = SEQ.rollSnapVal;
  return Math.round(val / s) * s;
}
function rollSnapFloor(val) {
  if (!SEQ.rollSnap) return val;
  const s = SEQ.rollSnapVal;
  return Math.floor(val / s) * s;
}

function setRollTool(tool) {
  SEQ.rollTool = tool;
  document.getElementById('seq-tool-pen').classList.toggle('active', tool === 'pen');
  document.getElementById('seq-tool-erase').classList.toggle('active', tool === 'erase');
  document.body.classList.toggle('roll-tool-pen',   tool === 'pen');
  document.body.classList.toggle('roll-tool-erase', tool === 'erase');
}
['seq-tool-select','seq-tool-pen','seq-tool-erase','seq-tool-pan'].forEach((id) => {
  document.getElementById(id)?.addEventListener('mousedown', (e) => e.preventDefault());
});
const _prToggleTool = (t) => prSetTool(SEQ.prTool === t && t !== 'select' ? 'select' : t);
document.getElementById('seq-tool-select')?.addEventListener('click', () => _prToggleTool('select'));
document.getElementById('seq-tool-pen')?.addEventListener('click',    () => _prToggleTool('draw'));
document.getElementById('seq-tool-erase')?.addEventListener('click',  () => _prToggleTool('erase'));
document.getElementById('seq-tool-pan')?.addEventListener('click',    () => _prToggleTool('pan'));
SEQ.rollSnap    = SEQ.rollSnap    ?? true;
SEQ.rollSnapVal = SEQ.rollSnapVal || 1;
const SNAP_VALUES = [
  { val: 0.25,       label: '1/4' },
  { val: 1/3,        label: '1/3' },
  { val: 0.5,        label: '1/2' },
  { val: 1,          label: '1'   },
  { val: 2,          label: '2'   },
  { val: 3,          label: '3'   },
  { val: 4,          label: '4'   },
];
let _snapIdx = SNAP_VALUES.findIndex(s => s.val === SEQ.rollSnapVal);
if (_snapIdx < 0) _snapIdx = 3;

// Piano-roll snap controls — magnet toggle + unit dropdown.
const _prSnapBtn = document.getElementById('seq-tool-snap');
const _prSnapSel = document.getElementById('seq-snap-val');
if (_prSnapBtn) {
  _prSnapBtn.classList.toggle('active', !!SEQ.rollSnap);
  _prSnapBtn.addEventListener('click', () => {
    SEQ.rollSnap = !SEQ.rollSnap;
    _prSnapBtn.classList.toggle('active', SEQ.rollSnap);
  });
}
if (_prSnapSel) {
  _prSnapSel.value = String(_snapIdx);
  _prSnapSel.addEventListener('change', (e) => {
    _snapIdx = Math.max(0, Math.min(SNAP_VALUES.length - 1, parseInt(e.target.value, 10)));
    SEQ.rollSnapVal = SNAP_VALUES[_snapIdx].val;
  });
}

// Arrangement-view toolbar (above the tracks)
SEQ.arrTool    = SEQ.arrTool    || 'select';
SEQ.arrSnap    = SEQ.arrSnap    ?? true;
SEQ.arrSnapVal = SEQ.arrSnapVal || 1;
let _arrSnapIdx = SNAP_VALUES.findIndex(s => s.val === SEQ.arrSnapVal);
if (_arrSnapIdx < 0) _arrSnapIdx = 2;
function arrSetTool(tool) {
  SEQ.arrTool = tool;
  ['select','erase','pan','merge','split','create'].forEach(t => {
    document.getElementById('seq-arr-tool-' + t)?.classList.toggle('active', tool === t);
  });
  const wrap = document.getElementById('seq-lane-wrap');
  if (wrap) {
    wrap.classList.remove('arr-tool-select','arr-tool-erase','arr-tool-pan','arr-tool-merge','arr-tool-split','arr-tool-create');
    wrap.classList.add('arr-tool-' + tool);
  }
  // Reset merge sequence whenever the user switches tools (or re-selects merge).
  SEQ._mergeFirst = null;
  document.querySelectorAll('.seq-block.merge-pending').forEach(el => el.classList.remove('merge-pending'));
  // Clear any leftover create-tool ghost preview.
  document.querySelectorAll('.seq-create-ghost').forEach(g => g.remove());
}
function arrSnap(beat) {
  if (!SEQ.arrSnap) return beat;
  return Math.round(beat / SEQ.arrSnapVal) * SEQ.arrSnapVal;
}
function rollSnap(beat) {
  if (!SEQ.rollSnap) return beat;
  return Math.round(beat / SEQ.rollSnapVal) * SEQ.rollSnapVal;
}
// Beats a chord block / chord clip should span when dropped from the chord
// pad onto a track or the piano-roll. Defaults to one bar in the current
// time signature on first use, then sticks at whatever the user picks.
SEQ.chordDropLen = SEQ.chordDropLen || state.beatsPerBar || 4;
function chordDropLen() {
  return SEQ.chordDropLen > 0 ? SEQ.chordDropLen : (state.beatsPerBar || 4);
}
// Delete the currently-selected notes in the piano-roll (mirrors the
// inline Delete/Backspace handler so toolbar buttons can reuse the logic).
function prDeleteNotes() {
  if (!prRollHasNoteSelection()) return;
  const { track, clip } = focusedClipObjects();
  if (!clip) return;
  seqCheckpoint();
  clip.notes = clip.notes.filter(n => !SEQ.prSelection.has(n));
  SEQ.prSelection.clear();
  renderPianoRoll();
  if (track) { seqRenderTrack(track); seqResyncTrack(track); }
  seqSave();
}
['select','erase','pan','merge','split','create'].forEach(t => {
  const btn = document.getElementById('seq-arr-tool-' + t);
  btn?.addEventListener('mousedown', e => e.preventDefault());
  btn?.addEventListener('click', () => {
    // Clicking the already-active tool toggles back to select.
    arrSetTool(SEQ.arrTool === t && t !== 'select' ? 'select' : t);
  });
});

// Edit-action toolbar buttons (mirror the Ctrl+X/C/V/D/Del shortcuts).
// Arrangement-view buttons act on the clip selection; piano-roll buttons
// act on the note selection inside the focused clip.
function _wireEditBtn(id, fn) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener('mousedown', e => e.preventDefault());
  btn.addEventListener('click', () => fn());
}
_wireEditBtn('seq-arr-edit-cut',       () => seqCutSelection());
_wireEditBtn('seq-arr-edit-copy',      () => seqCopySelection());
_wireEditBtn('seq-arr-edit-paste',     () => seqPasteSelection());
_wireEditBtn('seq-arr-edit-duplicate', () => seqDuplicateSelection());
_wireEditBtn('seq-arr-edit-delete',    () => seqDeleteSelection());
_wireEditBtn('seq-pr-edit-cut',        () => prCutNotes());
_wireEditBtn('seq-pr-edit-copy',       () => prCopyNotes());
_wireEditBtn('seq-pr-edit-paste',      () => prPasteNotes());
_wireEditBtn('seq-pr-edit-duplicate',  () => prDuplicateNotes());
_wireEditBtn('seq-pr-edit-delete',     () => prDeleteNotes());

// Chord-length dropdowns (arrangement + piano-roll) — kept in sync so the
// same setting drives the duration of any chord dropped from the pad,
// whether onto a track lane or into the roll.
(function _initChordLenSelects() {
  const arrSel = document.getElementById('seq-arr-chordlen');
  const prSel  = document.getElementById('seq-pr-chordlen');
  let idx = SNAP_VALUES.findIndex(s => s.val === SEQ.chordDropLen);
  if (idx < 0) idx = 6; // default to "4" beats
  const apply = (i) => {
    idx = Math.max(0, Math.min(SNAP_VALUES.length - 1, i));
    SEQ.chordDropLen = SNAP_VALUES[idx].val;
    if (arrSel) arrSel.value = String(idx);
    if (prSel)  prSel.value  = String(idx);
    seqSave();
  };
  apply(idx);
  arrSel?.addEventListener('change', e => apply(parseInt(e.target.value, 10)));
  prSel ?.addEventListener('change', e => apply(parseInt(e.target.value, 10)));
})();
(function _initVisualLatencyCtrl() {
  const el = document.getElementById('seq-visual-latency');
  if (!el) return;
  el.value = String(SEQ.visualLatencyMs || 0);
  el.addEventListener('input', () => {
    const v = parseInt(el.value, 10);
    SEQ.visualLatencyMs = isNaN(v) ? 0 : Math.max(-50, Math.min(200, v));
    seqSave();
  });
})();
document.getElementById('seq-arr-zoom-in') ?.addEventListener('click', () => seqApplyZoom(BEAT_PX * 1.25));
document.getElementById('seq-arr-zoom-out')?.addEventListener('click', () => seqApplyZoom(BEAT_PX / 1.25));
document.getElementById('pr-zoom-in') ?.addEventListener('click', () => prApplyZoom(PR_BEAT_PX * 1.25));
document.getElementById('pr-zoom-out')?.addEventListener('click', () => prApplyZoom(PR_BEAT_PX / 1.25));
// Ctrl + wheel zooms wherever the cursor is over the track-arrangement or
// piano-roll body. preventDefault stops the browser-level page zoom.
(function _initZoomWheel() {
  const wrap = document.getElementById('seq-lane-wrap');
  const body = document.getElementById('seq-pianoroll-body');
  const zoomFromWheel = (ev, applyFn, current) => {
    ev.preventDefault();
    const factor = ev.deltaY < 0 ? 1.15 : 1 / 1.15;
    applyFn(current() * factor, ev.clientX);
  };
  wrap?.addEventListener('wheel', (ev) => {
    if (!ev.ctrlKey && !ev.metaKey) return;
    zoomFromWheel(ev, seqApplyZoom, () => BEAT_PX);
  }, { passive: false });
  body?.addEventListener('wheel', (ev) => {
    if (!ev.ctrlKey && !ev.metaKey) return;
    zoomFromWheel(ev, prApplyZoom, () => PR_BEAT_PX);
  }, { passive: false });
})();

// Arrangement snap controls — magnet toggle + unit dropdown.
const _arrSnapBtn = document.getElementById('seq-arr-tool-snap');
const _arrSnapSel = document.getElementById('seq-arr-snap-val');
if (_arrSnapBtn) {
  _arrSnapBtn.classList.toggle('active', !!SEQ.arrSnap);
  _arrSnapBtn.addEventListener('click', () => {
    SEQ.arrSnap = !SEQ.arrSnap;
    _arrSnapBtn.classList.toggle('active', SEQ.arrSnap);
  });
}
if (_arrSnapSel) {
  _arrSnapSel.value = String(_arrSnapIdx);
  _arrSnapSel.addEventListener('change', (e) => {
    _arrSnapIdx = Math.max(0, Math.min(SNAP_VALUES.length - 1, parseInt(e.target.value, 10)));
    SEQ.arrSnapVal = SNAP_VALUES[_arrSnapIdx].val;
  });
}
arrSetTool(SEQ.arrTool);
// Pan-mode (and marquee-select) on the arrangement wrap.
(function _initArrPan() {
  const wrap = document.getElementById('seq-lane-wrap');
  if (!wrap) return;
  // Hover-ghost preview for the create tool. Shows where the empty clip
  // will land, snapped to the current snap unit.
  const _removeCreateGhost = () => {
    document.querySelectorAll('.seq-create-ghost').forEach(g => g.remove());
  };
  wrap.addEventListener('pointermove', (e) => {
    if (SEQ.arrTool !== 'create') { _removeCreateGhost(); return; }
    const lane = e.target.classList?.contains('seq-lane') ? e.target : null;
    const t = lane ? trackById(lane.dataset.trackId) : null;
    if (!t || t.kind !== 'free') { _removeCreateGhost(); return; }
    const rect = lane.getBoundingClientRect();
    const snapV = SEQ.arrSnap ? SEQ.arrSnapVal : (1 / BEAT_PX);
    let beat = Math.max(0, (e.clientX - rect.left) / BEAT_PX);
    beat = Math.floor(beat / snapV) * snapV;
    const beats = Math.max(snapV, state.beatsPerBar);
    let ghost = lane.querySelector(':scope > .seq-create-ghost');
    // If a ghost lives in another lane, scrub it first.
    document.querySelectorAll('.seq-create-ghost').forEach(g => { if (g.parentElement !== lane) g.remove(); });
    if (!ghost) {
      ghost = document.createElement('div');
      ghost.className = 'seq-ghost seq-create-ghost';
      lane.appendChild(ghost);
    }
    ghost.style.left  = (beat * BEAT_PX) + 'px';
    ghost.style.width = (beats * BEAT_PX) + 'px';
  });
  wrap.addEventListener('pointerleave', _removeCreateGhost);
  wrap.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.seq-track-sidebar')) return;
    // Clicks that land on (or inside) a clip block must reach the block's
    // own bubble-phase listener — don't swallow them here unless we're
    // explicitly in pan mode (which scrolls regardless of target).
    const onBlock = !!e.target.closest('.seq-block');
    // Pan: hand-tool active OR spacebar held — wraps drag-to-scroll.
    if (SEQ.arrTool === 'pan' || SEQ._arrSpaceHeld) {
      e.preventDefault();
      e.stopPropagation();
      wrap.setPointerCapture(e.pointerId);
      const startX = e.clientX, startY = e.clientY;
      const startSL = wrap.scrollLeft, startST = wrap.scrollTop;
      wrap.classList.add('arr-panning');
      const onMove = (ev) => {
        wrap.scrollLeft = startSL - (ev.clientX - startX);
        wrap.scrollTop  = startST - (ev.clientY - startY);
      };
      const onUp = () => {
        wrap.removeEventListener('pointermove', onMove);
        wrap.removeEventListener('pointerup', onUp);
        wrap.classList.remove('arr-panning');
      };
      wrap.addEventListener('pointermove', onMove);
      wrap.addEventListener('pointerup', onUp);
      return;
    }
    // Marquee-select: only when click starts on an empty lane area (not
    // on a clip / chord block) and the select tool is active.
    if (onBlock) return;
    // Create tool: clicking an empty free-lane spawns a 1-bar empty clip
    // at the snapped beat position. Tool stays active so you can quickly
    // place several clips in a row.
    if (SEQ.arrTool === 'create' && e.target.classList?.contains('seq-lane')) {
      const t = trackById(e.target.dataset.trackId);
      if (t && t.kind === 'free') {
        e.preventDefault();
        e.stopPropagation();
        const rect = e.target.getBoundingClientRect();
        const snapV = SEQ.arrSnap ? SEQ.arrSnapVal : (1 / BEAT_PX);
        let beat = Math.max(0, (e.clientX - rect.left) / BEAT_PX);
        beat = Math.floor(beat / snapV) * snapV;
        seqCheckpoint();
        const beats = Math.max(snapV, state.beatsPerBar);
        const clip = makeClip({ start: beat, beats, label: null, notes: [] });
        t.items.push(clip);
        t.items.sort((a, b) => a.start - b.start);
        seqAutoExtendLoop(beat + beats);
        document.querySelectorAll('.seq-create-ghost').forEach(g => g.remove());
        seqRenderTrack(t);
        seqResyncTrack(t);
        seqSave();
      }
      return;
    }
    if (SEQ.arrTool === 'select' && e.target.classList?.contains('seq-lane')) {
      e.preventDefault();
      wrap.setPointerCapture(e.pointerId);
      const inner = document.getElementById('seq-tracks-inner');
      const innerRect = inner.getBoundingClientRect();
      const startX = e.clientX - innerRect.left;
      const startY = e.clientY - innerRect.top;
      if (!e.shiftKey) seqClearSelection();
      const marquee = document.createElement('div');
      marquee.className = 'seq-marquee';
      inner.appendChild(marquee);
      const onMove = (ev) => {
        const x = ev.clientX - innerRect.left;
        const y = ev.clientY - innerRect.top;
        const left = Math.min(startX, x), top = Math.min(startY, y);
        const right = Math.max(startX, x), bottom = Math.max(startY, y);
        marquee.style.left = left + 'px';
        marquee.style.top  = top + 'px';
        marquee.style.width  = (right - left) + 'px';
        marquee.style.height = (bottom - top) + 'px';
        // Test every clip-block in every lane for intersection with marquee.
        document.querySelectorAll('#seq-tracks-inner .seq-lane .seq-block').forEach(block => {
          const bRect = block.getBoundingClientRect();
          const bLeft = bRect.left - innerRect.left, bTop = bRect.top - innerRect.top;
          const bRight = bLeft + bRect.width, bBottom = bTop + bRect.height;
          const hit = bRight >= left && bLeft <= right && bBottom >= top && bTop <= bottom;
          if (!hit) return;
          const laneEl = block.parentElement;
          const trackId = laneEl?.dataset?.trackId;
          const t = trackById(trackId);
          if (!t) return;
          // Find which item this block represents (by index of clip-id or by DOM index)
          let item = null;
          if (block.dataset.clipId) {
            item = t.items.find(it => it.id === block.dataset.clipId);
          }
          if (!item) {
            const blocks = [...laneEl.children].filter(c => c.classList.contains('seq-block'));
            const idx = blocks.indexOf(block);
            item = t.items[idx];
          }
          if (item && !SEQ.selection.some(s => s.trackId === t.id && s.item === item)) {
            SEQ.selection.push({ trackId: t.id, item });
          }
        });
        seqRefreshSelectionVisuals();
      };
      const onUp = () => {
        wrap.removeEventListener('pointermove', onMove);
        wrap.removeEventListener('pointerup', onUp);
        marquee.remove();
      };
      wrap.addEventListener('pointermove', onMove);
      wrap.addEventListener('pointerup', onUp);
    }
  }, true);
})();
setRollTool('none');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
