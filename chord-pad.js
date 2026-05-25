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
  const ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -6;
  comp.ratio.value = 4;
  comp.attack.value = 0.003;
  comp.release.value = 0.25;
  comp.connect(ctx.destination);
  ctx._out = comp;
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

const SF2_FILES = {
  fluid: { url: 'sf2/FluidR3_GM.sf2', sf2: null, loading: null, total: 0, loaded: 0 },
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
  sf2UpdateProgress('Loading instruments…');
  entry.loading = (async () => {
    try {
      const resp = await fetch(entry.url);
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
          sf2UpdateProgress(`Loading instruments… ${pct}%`);
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
      sf2UpdateProgress('Instrument load failed');
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
  // SF2 InitialFilterFc default is 13500 cents (≈ 20 kHz, effectively no filter)
  const filterCents = g(SF2G.InitialFilterFc) ?? 13500;
  const filterFreq  = Math.min(20000, Math.max(20, absoluteCentsToHz(filterCents)));
  const filterQCB   = g(SF2G.InitialFilterQ) ?? 0;
  const filterQ     = Math.max(0.001, Math.pow(10, filterQCB / 200)); // cB → linear

  // --- Output level (attenuation) -----------------------------------
  // Honor the SF2's InitialAttenuation in full (no cap). Use the global
  // Volume slider to boost quietly-balanced presets if they sit too low.
  const attCB  = g(SF2G.InitialAttenuation) ?? 0;
  const attGain = Math.pow(10, -attCB / 200);
  const peak = (velocity / 127) * state.audioVolume * attGain;

  // --- Volume envelope from SF2, with caps so 60s decays don't sound dead
  const aT = Math.min(g(SF2G.AttackVolEnv)  != null ? timecentsToSec(g(SF2G.AttackVolEnv))  : s.attack,  4);
  const dT = Math.min(g(SF2G.DecayVolEnv)   != null ? timecentsToSec(g(SF2G.DecayVolEnv))   : s.decay,   8);
  const sL = g(SF2G.SustainVolEnv) != null
    ? Math.max(0, 1 - Math.min(g(SF2G.SustainVolEnv), 1000) / 1000)
    : s.sustain;
  const rT = Math.min(g(SF2G.ReleaseVolEnv) != null ? timecentsToSec(g(SF2G.ReleaseVolEnv)) : s.release, 6);

  // --- Build graph ---------------------------------------------------
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(peak, t + aT);
  env.gain.exponentialRampToValueAtTime(Math.max(peak * sL, 0.0001), t + aT + dT);
  env.gain.setValueAtTime(peak * sL, t + aT + dT);
  env.connect(ctx._out);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  filter.Q.value = filterQ;
  filter.connect(env);

  const sampleModes = g(SF2G.SampleModes) ?? 0;
  const wantLoop = sampleModes === 1 || sampleModes === 3;

  // SF2 sample types: 1 = Mono, 2 = Right, 4 = Left, 8 = Linked.
  // getKeyData returns only one half of a stereo pair, so honoring its pan
  // would silence one speaker. Treat non-mono samples as centered.
  const sampleIsMono = sample.header.type === 1;
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
    const pn = ctx.createStereoPanner();
    pn.pan.value = sampleIsMono
      ? Math.max(-1, Math.min(1, ((g(SF2G.Pan) ?? 0) / 500)))
      : 0;
    src.connect(pn); pn.connect(filter);
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
    state.midiAccess.onstatechange = () => { refreshOutputs(); refreshInputs(); };
  } catch (e) {
    showError('Could not get MIDI access: ' + e.message + '. Open this file directly in your browser (not in a sandboxed iframe).');
  }
}

function refreshOutputs() {
  const select = document.getElementById('output-select');
  const previousId = state.output ? state.output.id : null;
  select.innerHTML = '';
  const noneOpt = document.createElement('option');
  noneOpt.value = '';
  noneOpt.textContent = '— none —';
  select.appendChild(noneOpt);
  const outputs = Array.from(state.midiAccess.outputs.values());
  outputs.forEach(out => {
    const opt = document.createElement('option');
    opt.value = out.id;
    opt.textContent = out.name + (out.manufacturer ? ' · ' + out.manufacturer : '');
    select.appendChild(opt);
  });
  const prev = outputs.find(o => o.id === previousId);
  state.output = prev || null;
  select.value = prev ? prev.id : '';
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
  state.midiAccess.inputs.forEach(inp => { inp.onmidimessage = null; });
  if (state.inputPort) state.inputPort.onmidimessage = onMidiMessage;
}

function refreshInputs() {
  const select = document.getElementById('input-select');
  if (!select) return;
  const previousId = state.inputPort ? state.inputPort.id : null;
  select.innerHTML = '';
  const noneOpt = document.createElement('option');
  noneOpt.value = '';
  noneOpt.textContent = '— none —';
  select.appendChild(noneOpt);
  const inputs = Array.from(state.midiAccess.inputs.values());
  inputs.forEach(inp => {
    const opt = document.createElement('option');
    opt.value = inp.id;
    opt.textContent = inp.name + (inp.manufacturer ? ' · ' + inp.manufacturer : '');
    select.appendChild(opt);
  });
  const prev = inputs.find(i => i.id === previousId) || (inputs.length === 1 ? inputs[0] : null);
  state.inputPort = prev || null;
  select.value = prev ? prev.id : '';
  attachMidiInput();
}

function sendNoteOn(note, velocity, channelOverride = null) {
  if (!state.midiEnabled || !state.output) return;
  const ch = channelOverride ?? state.channel;
  state.output.send([0x90 | ch, note & 0x7F, velocity & 0x7F]);
  blinkLed();
}
function sendNoteOff(note, channelOverride = null) {
  if (!state.midiEnabled || !state.output) return;
  const ch = channelOverride ?? state.channel;
  state.output.send([0x80 | ch, note & 0x7F, 0]);
}
function panic() {
  if (state.output) {
    for (let ch = 0; ch < 16; ch++) {
      state.output.send([0xB0 | ch, 123, 0]);
      state.output.send([0xB0 | ch, 120, 0]);
    }
  }
  Array.from(state.activeChords.values()).forEach(chord => chord.audioNodes.forEach(stopAudioNote));
  state.activeChords.clear();
  document.querySelectorAll('.pad.active').forEach(p => p.classList.remove('active'));
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
      chord.notes.forEach(n => sendNoteOff(n));
      chord.audioNodes.forEach(stopAudioNote);
      if (chord.bassNote !== null) { sendNoteOff(chord.bassNote); stopAudioNote(chord.bassAudioNode); }
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
  notes.forEach(n => sendNoteOn(n, state.velocity));
  let audioNodes = [];
  if (state.audioEnabled) {
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
    sendNoteOn(bassNote, state.velocity);
    if (state.audioEnabled) bassAudioNode = startBassNote(bassNote);
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
  chord.notes.forEach(n => sendNoteOff(n));
  chord.audioNodes.forEach(stopAudioNote);
  if (chord.bassNote !== null) { sendNoteOff(chord.bassNote); stopAudioNote(chord.bassAudioNode); }
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
  Array.from(state.activeChords.entries()).forEach(([padId, chord]) => {
    chord.notes.forEach(n => sendNoteOff(n));
    chord.audioNodes.forEach(stopAudioNote);
    if (chord.bassNote !== null) { sendNoteOff(chord.bassNote); stopAudioNote(chord.bassAudioNode); }
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
    e.dataTransfer.setData('application/x-chord', JSON.stringify({
      interval: chordSpec.interval,
      q: chordSpec.q,
      bassInterval: chordSpec.bassInterval,
      label,
    }));
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
      e.dataTransfer.setData('application/x-chord', JSON.stringify({
        interval: chordSpec.interval,
        q: extQ,
        bassInterval: chordSpec.bassInterval,
        label: extLabel,
      }));
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
  document.getElementById('ctrl-ch').textContent = state.channel + 1;
}

document.getElementById('output-select').addEventListener('change', (e) => {
  state.output = e.target.value ? state.midiAccess?.outputs.get(e.target.value) ?? null : null;
});
document.getElementById('input-select').addEventListener('change', (e) => {
  state.inputPort = e.target.value ? state.midiAccess?.inputs.get(e.target.value) ?? null : null;
  attachMidiInput();
});
document.getElementById('oct-down').addEventListener('click', () => {
  state.octave = Math.max(0, state.octave - 1); updateControlDisplays(); rebuildBoard();
});
document.getElementById('oct-up').addEventListener('click', () => {
  state.octave = Math.min(8, state.octave + 1); updateControlDisplays(); rebuildBoard();
});
document.getElementById('ch-down').addEventListener('click', () => {
  state.channel = Math.max(0, state.channel - 1); updateControlDisplays();
});
document.getElementById('ch-up').addEventListener('click', () => {
  state.channel = Math.min(15, state.channel + 1); updateControlDisplays();
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
    applySynthPreset(savedPresets[next] || INSTRUMENT_PRESETS[next]);
    if (INSTRUMENT_TO_SF2[next] != null) {
      loadSf2('fluid');
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

document.getElementById('settings-header').addEventListener('click', () => {
  document.querySelector('.controls').classList.toggle('collapsed');
});
document.getElementById('tabs-collapse')?.addEventListener('click', (e) => {
  e.stopPropagation();
  document.querySelector('.app')?.classList.toggle('boards-collapsed');
});

document.getElementById('header-refresh')?.addEventListener('click', () => {
  // Force-refresh — append a cache-bust query so the browser re-fetches
  // chord-pad.js / chord-pad.css instead of serving them from cache.
  const url = new URL(window.location.href);
  url.searchParams.set('_t', Date.now().toString());
  window.location.replace(url.toString());
});
document.getElementById('synth-header').addEventListener('click', () => {
  document.querySelector('.synth-controls').classList.toggle('collapsed');
});
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

const audioVolumeSlider = document.getElementById('audio-volume');
const audioVolumeLabel  = document.getElementById('audio-volume-val');
if (audioVolumeSlider) {
  audioVolumeSlider.value = Math.round(state.audioVolume * 100);
  audioVolumeLabel.textContent = audioVolumeSlider.value + '%';
  audioVolumeSlider.addEventListener('input', (e) => {
    const pct = parseInt(e.target.value, 10) || 0;
    state.audioVolume = pct / 100;
    audioVolumeLabel.textContent = pct + '%';
  });
}


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
  epiano:  { attack:0.008, decay:0.5,  sustain:0.35, release:1.5,  filterFreq:3000, filterQ:1.5, overtones:0.2, reverb:0.35, detune:0, vibratoRate:5, vibratoDepth:0, tremoloRate:4, tremoloDepth:0.40, delayTime:0.3, delayFeedback:0.3, delayWet:0, filterLfoDepth:0, waveform:'sine' },
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
  const keymap   = V2_KEYMAPS[state.currentTemplate]  || tpl.keymap;
  const sections = V2_SECTIONS[state.currentTemplate] || tpl.sections;
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
    if (key === 'c' && !e.shiftKey) { e.preventDefault(); seqCopySelection(); return; }
    if (key === 'x' && !e.shiftKey) { e.preventDefault(); seqCutSelection(); return; }
    if (key === 'v' && !e.shiftKey) { e.preventDefault(); seqPasteSelection(); return; }
    if (key === 'a' && !e.shiftKey) { e.preventDefault(); seqSelectAll(); return; }
  }
  if (key === 'delete' || key === 'backspace') {
    if (SEQ.selection.length > 0) { e.preventDefault(); seqDeleteSelection(); return; }
  }

  if (heldKeys.has(key)) return;
  heldKeys.add(key);
  if (key === ' ') { e.preventDefault(); flashHint('hint-space'); if (SEQ.playing) seqStop(); else seqPlay(); return; }
  if (key === 'p') { e.preventDefault(); panic(); return; }
  if (key === 'arrowleft')  { e.preventDefault(); flashHint('hint-lr'); setKey(state.currentTemplate, (state.keys[state.currentTemplate] + 11) % 12); return; }
  if (key === 'arrowright') { e.preventDefault(); flashHint('hint-lr'); setKey(state.currentTemplate, (state.keys[state.currentTemplate] + 1)  % 12); return; }
  if (key === 'arrowdown')  { e.preventDefault(); flashHint('hint-ud'); state.octave = Math.max(0, state.octave - 1); updateControlDisplays(); rebuildBoard(); return; }
  if (key === 'arrowup')    { e.preventDefault(); flashHint('hint-ud'); state.octave = Math.min(8, state.octave + 1); updateControlDisplays(); rebuildBoard(); return; }
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
let BEAT_PX = 30; // pixels per beat

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

  rollTool: 'none',
  rollSnap: false,
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
      instrument: t.instrument, channel: t.channel, volume: t.volume,
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
          instrument: tIn.instrument, channel: tIn.channel, volume: tIn.volume,
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
  const baseBeat = SEQ.loopEnd;
  const newSelection = [];
  let maxEnd = baseBeat;
  for (const e of SEQ.clipboard.items) {
    const t = trackByRef(e.trackId);
    if (!t) continue;
    const newItem = { ...e.data, start: e.relStart + baseBeat };
    t.items.push(newItem);
    newSelection.push({ trackId: t.id, item: newItem });
    maxEnd = Math.max(maxEnd, newItem.start + (newItem.beats || 1));
  }
  for (const t of SEQ.tracksList) t.items.sort((a, b) => a.start - b.start);
  SEQ.selection = newSelection;
  seqAutoExtendLoop(maxEnd);
  seqRenderAll();
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
  if (t === firstTrackOfKind('chord')) return state.synth; // pad-linked
  return t.synth || state.synth;
}
function seqTrackInstrument(ref) {
  const t = resolveTrack(ref);
  if (!t) return state.instrument;
  if (t === firstTrackOfKind('chord')) return state.instrument; // pad-linked
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

function seqBeatDur() { return 60 / state.tempo; }

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
  const now    = ctx.currentTime - (ctx.outputLatency || 0);
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
        prPh.style.left    = ((SEQ.animBeat - clip.start) * BEAT_PX) + 'px';
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
  const vis = SEQ.loop;
  document.getElementById('seq-loop-end')?.style.setProperty('display', vis ? '' : 'none');
  document.getElementById('seq-loop-start')?.style.setProperty('display', vis ? '' : 'none');
  document.querySelectorAll('.seq-loop-line').forEach(l => l.style.display = vis ? '' : 'none');
  document.querySelectorAll('.seq-loop-start-line').forEach(l => l.style.display = vis ? '' : 'none');
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

  const del = document.createElement('span');
  del.className = 'seq-delete';
  del.innerHTML = '<i data-lucide="x"></i>';
  del.addEventListener('mousedown', (e) => { e.stopPropagation(); e.preventDefault(); });
  del.addEventListener('click', (e) => {
    e.stopPropagation();
    seqCheckpoint();
    // Find the owning track via the parent lane's data-track-id, with
    // legacy-kind fallback for the default lanes.
    const laneEl = block.parentElement;
    const owner =
      (laneEl && laneEl.dataset && laneEl.dataset.trackId && trackById(laneEl.dataset.trackId)) ||
      (isMidi ? firstTrackOfKind('free') : isNote ? null : firstTrackOfKind('chord'));
    if (owner) {
      owner.items.splice(idx, 1);
      if (owner.pendingIdx >= owner.items.length) owner.pendingIdx = 0;
      if (owner.activeIdx  >= owner.items.length) owner.activeIdx  = owner.items.length - 1;
      seqRenderTrack(owner);
    }
  });
  block.appendChild(del);

  const resize = document.createElement('div');
  resize.className = 'seq-resize';
  resize.innerHTML = '<i data-lucide="grip-vertical"></i>';
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
    e.preventDefault();
    seqCheckpoint();
    block.setPointerCapture(e.pointerId);
    if (state.audioEnabled) {
      let previewNodes;
      if (isMidi || isNote) {
        previewNodes = [startAudioNote(item.midi, state.velocity)];
      } else {
        const kr = item.keyRoot !== undefined ? item.keyRoot : state.keys[state.currentTemplate];
        previewNodes = chordToMidiNotes(kr, state.octave, item.interval, item.q)
          .map(n => startAudioNote(n, state.velocity));
      }
      const stopPreview = () => previewNodes.forEach(stopAudioNote);
      block.addEventListener('pointerup',     stopPreview, { once: true });
      block.addEventListener('pointercancel', stopPreview, { once: true });
    }
    const startX = e.clientX, startBeat = item.start;
    const snap = 0.5;
    const lane  = block.parentElement;
    // Derive the owning track from the parent lane's data-track-id, falling
    // back to the legacy kind mapping for the hardcoded default lanes.
    const ownerTrack =
      (lane && lane.dataset && lane.dataset.trackId && trackById(lane.dataset.trackId)) ||
      (isMidi ? firstTrackOfKind('free') : isNote ? null : firstTrackOfKind('chord'));
    const items = ownerTrack ? ownerTrack.items : (isMidi ? SEQ.midiItems : isNote ? SEQ.noteItems : SEQ.items);
    let moved = false;
    let ghost = null;
    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      if (!moved && Math.abs(dx) < 4) return;
      moved = true;
      block.classList.add('moving');
      item.start = Math.max(0, startBeat + dx / BEAT_PX);
      block.style.left = (item.start * BEAT_PX) + 'px';
      if (lane) lane.style.minWidth = seqLaneWidth(items) + 'px';
      // Snap-target ghost — shows where the block will land on drop.
      const snapped = Math.max(0, Math.round(item.start / snap) * snap);
      if (!ghost) {
        ghost = document.createElement('div');
        ghost.className = 'seq-ghost';
        ghost.style.width = (item.beats * BEAT_PX) + 'px';
        lane.appendChild(ghost);
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
        items.sort((a, b) => a.start - b.start);
        seqAutoExtendLoop(item.start + item.beats);
        if (ownerTrack) seqRenderTrack(ownerTrack);
        else if (isMidi) seqRenderMidi(); else if (isNote) seqRenderNotes(); else seqRender();
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
      instrument: t.instrument, channel: t.channel, volume: t.volume,
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
          instrument: tIn.instrument, channel: tIn.channel, volume: tIn.volume,
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
// FIRST chord track is pad-linked — its `synth` stays null on purpose.
function seqInitTrackSynths() {
  const firstChord = firstTrackOfKind('chord');
  for (const tr of SEQ.tracksList) {
    if (tr === firstChord) continue;
    if (!tr.synth) tr.synth = { ...state.synth };
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
  // Match each label's height to its lane (looked up by data-track-id).
  document.querySelectorAll('.seq-track-label[data-track-id]').forEach(label => {
    const id   = label.dataset.trackId;
    const lane = document.querySelector(`.seq-lane[data-track-id="${id}"]`);
    if (lane) label.style.height = lane.getBoundingClientRect().height + 'px';
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
      const previewNode = startAudioNote(item.midi, state.velocity);
      const stopPreview = () => stopAudioNote(previewNode);
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
    const padLinked = (track === firstTrackOfKind('chord'));

    if (state.audioEnabled && audible) {
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
      if (padLinked) fire(); else withSynth(track.synth, fire);
    }
    const capturedNotes = [...notes], capturedBass = bassNote;
    seqTimeout(() => {
      if (audible) {
        capturedNotes.forEach(n => sendNoteOn(n, vel, track.channel));
        if (capturedBass !== null) sendNoteOn(capturedBass, vel, track.channel);
      }
      SEQ.nowChord = chordDisplayName(item.keyRoot, item.interval, item.q) + ' [' + capturedNotes.map(midiNoteName).join(' · ') + ']';
      seqUpdateNowPlaying();
    }, onDelay);
    seqTimeout(() => {
      if (audible) {
        capturedNotes.forEach(n => sendNoteOff(n, track.channel));
        if (capturedBass !== null) sendNoteOff(capturedBass, track.channel);
      }
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
      for (const note of clip.notes) {
        out.push({
          midi: note.midi,
          label: note.label || midiNoteLabel(note.midi),
          beats: note.beats,
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
    if (state.audioEnabled && audible) {
      withSynth(track.synth, () => {
        const node = startAudioNote(item.midi, vel, t, null, inst);
        SEQ.activeNodes.add(node);
        seqTimeout(() => { stopAudioNote(node); SEQ.activeNodes.delete(node); }, offDelay);
      });
    }
    const capturedMidi = item.midi, capturedLabel = item.label;
    seqTimeout(() => {
      if (audible) sendNoteOn(capturedMidi, vel, track.channel);
      SEQ.nowNote = capturedLabel;
      seqUpdateNowPlaying();
    }, onDelay);
    seqTimeout(() => {
      if (audible) sendNoteOff(capturedMidi, track.channel);
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

function seqResyncChords() { seqResyncTrack(firstTrackOfKind('chord')); }

function seqResyncNotes() { /* melody removed — no-op */ }

function seqResyncMidi() { seqResyncTrack(firstTrackOfKind('free')); }

function seqInitPlay(t0) {
  const bd  = seqBeatDur();
  const ls  = seqLoopOffset();
  SEQ.playing        = true;
  SEQ.playStartTime  = t0 - 0.05;
  SEQ.animBeat      = SEQ.loopStart;
  SEQ.animLastTime  = t0;
  SEQ.animLoopLen   = SEQ.loopEnd - SEQ.loopStart;
  SEQ.animLoopStart = SEQ.loopStart;
  // Initialize each track's playback cursor independently.
  for (const tr of SEQ.tracksList) {
    invalidateFreeTrackFlat(tr);
    const list = tr.kind === 'free' ? freeTrackFlatNotes(tr) : tr.items;
    const fi = seqFindNextInRange(list, 0);
    tr.cycleStart  = t0;
    tr.pendingIdx  = fi >= 0 ? fi : 0;
    tr.pendingTime = fi >= 0 ? t0 + (list[fi].start - ls) * bd : Infinity;
    tr.activeIdx   = -1;
  }
  if (!SEQ.timer) SEQ.timer = setInterval(seqTick, SEQ.TICK_MS);
  document.querySelectorAll('.seq-playhead').forEach(ph => ph.style.display = 'block');
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
  metroRun(tRef, 0);
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

function seqPlay() {
  const ctx = getAudioCtx();
  const t0  = ctx.currentTime + 0.05;

  if (REC.armed && PRECOUNT.enabled) {
    startPrecount((t0actual) => {
      if (!SEQ.playing) return;
      seqInitPlay(t0actual);
      recActivate(t0actual);
    });
    return;
  }

  seqInitPlay(t0);
  metroRun(t0);
  if (REC.armed) recActivate(t0);
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
  document.querySelectorAll('.seq-playhead').forEach(ph => ph.style.display = 'none');
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

function seqStartTouchDrag(touch, laneId, getData, onCancelPlay) {
    const tid = touch.identifier;
    const startX = touch.clientX, startY = touch.clientY;
    let dragging = false;
    let ghost = null;
    let lastTouch = touch;
    let scrollRaf = null;

    const stopScroll = () => { if (scrollRaf) { cancelAnimationFrame(scrollRaf); scrollRaf = null; } };

    const autoScroll = () => {
      if (!dragging) return;
      const edge = 80, maxSpeed = 12;
      const y = lastTouch.clientY, vh = window.innerHeight;
      let speed = 0;
      if (y < edge)           speed = -maxSpeed * (1 - y / edge);
      else if (y > vh - edge) speed =  maxSpeed * (1 - (vh - y) / edge);
      if (speed !== 0) window.scrollBy(0, speed);

      const midiLane = document.getElementById('seq-midi-lane');
      if (midiLane && midiLane.classList.contains('roll-mode')) {
        const laneRect = midiLane.getBoundingClientRect();
        const laneEdge = 40, laneMaxSpeed = 4;
        let laneSpeed = 0;
        if (y < laneRect.top + laneEdge)
          laneSpeed = -laneMaxSpeed * (1 - (y - laneRect.top) / laneEdge);
        else if (y > laneRect.bottom - laneEdge)
          laneSpeed =  laneMaxSpeed * (1 - (laneRect.bottom - y) / laneEdge);
        if (laneSpeed !== 0) {
          midiLane.scrollTop += laneSpeed;
          updateRollOverflow();
          updateKeyboardPosition();
        }
      }

      scrollRaf = requestAnimationFrame(autoScroll);
    };

    const cleanup = () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend',  onUp);
      document.removeEventListener('touchcancel', onUp);
      stopScroll();
      if (ghost) { ghost.remove(); ghost = null; }
      document.body.classList.remove('seq-dragging-chord', 'seq-dragging-note');
      for (const lid of ['seq-lane', 'seq-note-lane', 'seq-midi-lane']) {
        const l = document.getElementById(lid);
        if (!l) continue;
        l.classList.remove('drag-over');
        l.querySelector('.seq-drop-hint')?.style.removeProperty('color');
        seqClearGhost(l);
        seqClearRollGhost(l);
      }
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
        const lane = document.getElementById(laneId);
        if (lane) lane.querySelector('.seq-drop-hint')?.style.setProperty('color', 'var(--accent)');
        autoScroll();
      }
      ev.preventDefault();
      ghost.style.left = t.clientX + 'px';
      ghost.style.top  = t.clientY + 'px';
      for (const lid of ['seq-lane', 'seq-note-lane', 'seq-midi-lane']) {
        const l = document.getElementById(lid);
        if (!l) continue;
        const r = l.getBoundingClientRect();
        if (t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom) {
          const beat = Math.max(0, Math.floor(((t.clientX - r.left) / BEAT_PX) * 2) / 2);
          const beats = lid === 'seq-note-lane' ? 1 : state.beatsPerBar;
          if (lid === 'seq-midi-lane' && SEQ._dragChord && l.classList.contains('roll-mode')) {
            seqClearGhost(l);
            seqSetRollGhost(l, beat, beats, chordNotesAtY(l, t.clientY, SEQ._dragChord.interval, SEQ._dragChord.q));
          } else {
            seqClearRollGhost(l);
            seqSetGhost(l, beat, beats);
          }
        } else {
          seqClearGhost(l);
          seqClearRollGhost(l);
        }
      }
    };

    const onUp = (ev) => {
      const t = Array.from(ev.changedTouches).find(t => t.identifier === tid);
      if (!t) return;
      if (!dragging) { cleanup(); return; }
      const dropX = t.clientX, dropY = t.clientY;
      cleanup();
      const data = getData();
      const isChord = data.interval !== undefined;
      // Find which lane was actually hit (allows cross-lane drops)
      let hitLaneId = null, hitBeat = 0;
      for (const lid of ['seq-lane', 'seq-note-lane', 'seq-midi-lane']) {
        const laneEl = document.getElementById(lid);
        if (!laneEl) continue;
        const r = laneEl.getBoundingClientRect();
        if (dropX >= r.left && dropX <= r.right && dropY >= r.top && dropY <= r.bottom) {
          hitLaneId = lid;
          hitBeat = Math.max(0, Math.floor(((dropX - r.left) / BEAT_PX) * 2) / 2);
          break;
        }
      }
      if (!hitLaneId) return;
      seqCheckpoint();
      if (hitLaneId === 'seq-midi-lane') {
        if (isChord) {
          const notes = chordToMidiNotes(state.keys[state.currentTemplate], state.octave, data.interval, data.q);
          notes.forEach(midi => SEQ.midiItems.push({ midi, label: midiNoteLabel(midi), beats: state.beatsPerBar, start: hitBeat }));
        } else {
          SEQ.midiItems.push({ midi: data.midi, label: data.label, beats: 1, start: hitBeat });
        }
        SEQ.midiItems.sort((a, b) => a.start - b.start);
        seqAutoExtendLoop(hitBeat + (isChord ? state.beatsPerBar : 1));
        seqRenderMidi();
        seqResyncMidi();
      } else if (hitLaneId === 'seq-note-lane') {
        if (isChord) return;
        SEQ.noteItems.push({ midi: data.midi, label: data.label, beats: 1, start: hitBeat });
        SEQ.noteItems.sort((a, b) => a.start - b.start);
        seqAutoExtendLoop(hitBeat + 1);
        seqRenderNotes();
        seqResyncNotes();
      } else {
        if (!isChord) return;
        SEQ.items.push({
          interval: data.interval, q: data.q, bassInterval: data.bassInterval, label: data.label,
          beats: state.beatsPerBar, start: hitBeat,
          keyRoot: state.keys[state.currentTemplate], template: state.currentTemplate,
        });
        SEQ.items.sort((a, b) => a.start - b.start);
        seqAutoExtendLoop(hitBeat + state.beatsPerBar);
        seqRender();
        seqResyncChords();
      }
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

function seqApplyZoom(newBeatPx) {
  const wrap = document.getElementById('seq-lane-wrap');
  const prevBeatPx = BEAT_PX;
  BEAT_PX = Math.round(Math.max(10, Math.min(120, newBeatPx)));
  if (BEAT_PX === prevBeatPx) return;
  const centerBeat = wrap ? (wrap.scrollLeft + wrap.clientWidth / 2) / prevBeatPx : 0;
  seqUpdateBarLine();
  seqRender();
  seqRenderNotes();
  seqRenderMidi();
  if (wrap) wrap.scrollLeft = Math.max(0, centerBeat * BEAT_PX - wrap.clientWidth / 2);
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
    };
    const onUp = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      if (SEQ.playing && SEQ.loop) seqResyncAll();
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
    };
    const onUp = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      if (SEQ.playing && SEQ.loop) seqResyncAll();
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
  enabled: false,   // user toggle
  timer: null,      // only runs during play or rec
  nextBeatTime: 0,
  beatCount: 0,
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
  const ctx = getAudioCtx();
  const horizon = ctx.currentTime + METRO.LOOKAHEAD;
  while (METRO.nextBeatTime < horizon) {
    scheduleMetroClick(METRO.nextBeatTime, METRO.beatCount % state.beatsPerBar === 0);
    METRO.nextBeatTime += seqBeatDur();
    METRO.beatCount++;
  }
}

function metroRun(startTime, beatOffset = 0) {
  if (!METRO.enabled || METRO.timer) return;
  METRO.beatCount = beatOffset;
  METRO.nextBeatTime = startTime;
  metroTick();
  METRO.timer = setInterval(metroTick, METRO.TICK_MS);
}

function metroRunSynced() {
  if (!METRO.enabled || METRO.timer) return;
  const ctx  = getAudioCtx();
  const now  = ctx.currentTime;
  const tRef = SEQ.playStartTime + 0.05;
  const bd   = seqBeatDur();
  const beatsElapsed = (now - tRef) / bd;
  const nextBeat     = Math.ceil(beatsElapsed + 0.01);
  metroRun(tRef + nextBeat * bd, nextBeat % 4);
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

const midiToggleBtn  = document.getElementById('midi-toggle');
const channelControl = document.getElementById('channel-control');
const portControl    = document.getElementById('port-control');
const midiLed        = document.getElementById('midi-led');

midiToggleBtn.addEventListener('click', async () => {
  state.midiEnabled = !state.midiEnabled;
  midiToggleBtn.textContent = state.midiEnabled ? 'ON' : 'OFF';
  midiToggleBtn.classList.toggle('active', state.midiEnabled);
  channelControl.style.display = state.midiEnabled ? '' : 'none';
  portControl.style.display    = state.midiEnabled ? '' : 'none';
  document.getElementById('in-port-control').style.display = state.midiEnabled ? '' : 'none';
  midiLed.style.display        = state.midiEnabled ? '' : 'none';
  document.getElementById('hint-panic').style.display = state.midiEnabled ? '' : 'none';
  if (state.midiEnabled && !state.midiAccess) await initMIDI();
});

document.getElementById('play-style-select').addEventListener('change', (e) => {
  state.playStyle = e.target.value;
  const hasPattern = !['off', 'strum-up', 'strum-down'].includes(state.playStyle);
  document.getElementById('tempo-control').style.display = hasPattern ? '' : 'none';
});
function applyTempoChange() {
  document.getElementById('seq-tempo-val').value = state.tempo;
  document.getElementById('ctrl-tempo').value    = state.tempo;
  if (!SEQ.playing) return;

  SEQ.pendingTimers.forEach(id => clearTimeout(id));
  SEQ.pendingTimers.clear();
  SEQ.activeNodes.forEach(n => stopAudioNote(n));
  SEQ.activeNodes.clear();
  panic();
  seqHighlight(-1);
  seqHighlightNote(-1);
  seqResyncAll();

  // Re-align visual cursor to audio position after tempo change
  if (SEQ.loop) {
    const ctx = getAudioCtx();
    const bd  = seqBeatDur();
    const L   = SEQ.animLoopLen;
    const cyclePos = ((ctx.currentTime - SEQ.cycleStart) / bd % L + L) % L;
    SEQ.animBeat     = SEQ.animLoopStart + cyclePos;
    SEQ.animLastTime = ctx.currentTime - (ctx.outputLatency || 0);
  }

  metroHalt();
  metroRunSynced();
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
    const ratio      = wrap.clientWidth / wrap.scrollWidth;
    const thumbW     = Math.max(20, track.clientWidth * ratio);
    const maxLeft    = track.clientWidth - thumbW;
    const scrollFrac = wrap.scrollLeft / (wrap.scrollWidth - wrap.clientWidth || 1);
    thumb.style.width = thumbW + 'px';
    thumb.style.left  = (scrollFrac * maxLeft) + 'px';
  }
  wrap.addEventListener('scroll', updateThumb);
  requestAnimationFrame(updateThumb);

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

document.getElementById('keyboard-header').addEventListener('click', () => {
  document.getElementById('keyboard-panel').classList.toggle('collapsed');
  buildKeyboard();
});

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
document.getElementById('seq-header').addEventListener('click', () => {
  document.getElementById('seq-panel').classList.toggle('collapsed');
  const open = seqIsOpen();
  document.querySelectorAll('.pad, .pad-ext').forEach(el => { el.draggable = open; });
  if (open) requestAnimationFrame(() => {
    seqUpdateHints();
    const mLane = document.getElementById('seq-midi-lane');
    if (mLane && mLane.scrollTop === 0) {
      const ctr = SEQ.midiItems.length > 0 ? Math.round(SEQ.midiItems.reduce((s, i) => s + i.midi, 0) / SEQ.midiItems.length) : 66;
      mLane.scrollTop = rollScrollForMidi(ctr);
    }
  });
});

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
  seqRenderRuler();
}

function seqRenderRuler() {
  const ruler = document.getElementById('seq-ruler');
  if (!ruler) return;
  const widthPx = Math.max(
    seqLaneWidth(SEQ.items),
    seqLaneWidth(SEQ.noteItems),
    seqLaneWidth(SEQ.midiItems),
    4 * BEAT_PX + 64
  );
  ruler.style.width = widthPx + 'px';
  const bpb = state.beatsPerBar;
  const totalBeats = Math.ceil(widthPx / BEAT_PX);
  const totalBars  = Math.ceil(totalBeats / bpb) + 1;
  let html = '';
  for (let bar = 0; bar < totalBars; bar++) {
    const left = bar * bpb * BEAT_PX;
    html += `<div class="seq-ruler-bar" style="left:${left}px"><span>${bar + 1}</span></div>`;
    for (let b = 1; b < bpb; b++) {
      html += `<div class="seq-ruler-beat" style="left:${left + b * BEAT_PX}px"></div>`;
    }
  }
  ruler.innerHTML = html;
}

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

  if (SEQ.loop && SEQ.playing) {
    // pendingTime may be Infinity (no-loop exhausted) — restart scheduling from next cycle
    const ctx   = getAudioCtx();
    const bd    = seqBeatDur();
    const total = seqTotalDur();
    const tRef  = SEQ.playStartTime + 0.05;
    const now   = ctx.currentTime;
    const elapsed = Math.max(0, now - tRef);
    const nextCycle = tRef + (Math.floor(elapsed / total) + 1) * total;
    SEQ.cycleStart     = nextCycle;
    SEQ.pendingIdx     = 0;
    SEQ.pendingTime    = SEQ.items.length     > 0 ? nextCycle + SEQ.items[0].start     * bd : Infinity;
    SEQ.noteCycleStart = nextCycle;
    SEQ.notePendingIdx  = 0;
    SEQ.notePendingTime = SEQ.noteItems.length > 0 ? nextCycle + SEQ.noteItems[0].start * bd : Infinity;
    SEQ.midiCycleStart  = nextCycle;
    SEQ.midiPendingIdx  = 0;
    SEQ.midiPendingTime = SEQ.midiItems.length > 0 ? nextCycle + SEQ.midiItems[0].start * bd : Infinity;
  }
});


document.getElementById('seq-clear-btn').addEventListener('click', () => {
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
function ensureTrackLane(track) {
  let lane = document.querySelector(`.seq-lane[data-track-id="${track.id}"]`);
  if (lane) return lane;
  lane = document.createElement('div');
  lane.className = 'seq-lane';
  lane.dataset.trackId = track.id;
  document.getElementById('seq-tracks-inner').appendChild(lane);
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
    ? `<button class="seq-th-convert" title="Convert to Free (bake chords to notes — one way)">→ Free</button>`
    : '';
  label.innerHTML = `
    <div class="seq-th-row seq-th-top">
      <span class="seq-th-name" title="Click to focus · double-click to rename">${escapeHtml(track.name)}</span>
      ${convertBtn}
      <button class="seq-th-collapse" title="Collapse / expand"><i data-lucide="chevrons-down-up"></i></button>
      <button class="seq-th-del" title="Remove track">✕</button>
    </div>`;
  // Append the rest of the header rows (instrument dropdown, mixer row).
  label.insertAdjacentHTML('beforeend', `
    <div class="seq-th-row seq-th-mid">
      <select class="seq-th-inst" title="Instrument">
        ${INSTRUMENT_OPTIONS.map(([v, n]) => `<option value="${v}"${seqTrackInstrument(track) === v ? ' selected' : ''}>${n}</option>`).join('')}
      </select>
    </div>
    <div class="seq-th-row seq-th-bot">
      <button class="seq-th-m${track.muted ? ' on' : ''}" title="Mute">M</button>
      <button class="seq-th-s${track.soloed ? ' on' : ''}" title="Solo">S</button>
      <span class="seq-th-ch-wrap" title="MIDI channel">
        <span class="seq-th-ch-lbl">Ch</span>
        <input type="number" class="seq-th-ch" min="1" max="16" value="${track.channel + 1}">
      </span>
      <input type="range" class="seq-th-vol" min="0" max="150" value="${Math.round(track.volume * 100)}" title="Volume">
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

  label.querySelector('.seq-th-inst').addEventListener('change', (e) => {
    const nextInst = e.target.value;
    if (padLinked) {
      // First chord track shares the chord-pad voice — route through the
      // global instrument dropdown for preset / SF2 loading.
      const prevTarget = state.synthEditTarget;
      state.synthEditTarget = 'pad';
      const gDD = document.getElementById('synth-instrument');
      if (gDD) { gDD.value = nextInst; gDD.dispatchEvent(new Event('change')); }
      if (prevTarget !== 'pad') setSynthEditTarget(prevTarget);
    } else {
      track.instrument = nextInst; seqSave();
      if (INSTRUMENT_TO_SF2[nextInst] != null) loadSf2('fluid');
      else if (nextInst !== 'synth') preloadSamples(nextInst);
    }
  });
  label.querySelector('.seq-th-m').addEventListener('click', (e) => {
    track.muted = !track.muted; e.currentTarget.classList.toggle('on', track.muted); seqSave();
  });
  label.querySelector('.seq-th-s').addEventListener('click', (e) => {
    track.soloed = !track.soloed; e.currentTarget.classList.toggle('on', track.soloed); seqSave();
  });
  label.querySelector('.seq-th-ch').addEventListener('change', (e) => {
    const v = Math.max(1, Math.min(16, parseInt(e.target.value) || 1));
    e.target.value = v;
    track.channel = v - 1; seqSave();
  });
  label.querySelector('.seq-th-vol').addEventListener('input', (e) => {
    track.volume = parseInt(e.target.value) / 100;
  });
  label.querySelector('.seq-th-vol').addEventListener('change', seqSave);
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
      if (v) track.name = v;
      seqSave();
    }
    rebuildTracksUI();
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
SEQ.pianoRollOpen = false;

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
  if (!track || !clip) { titleEl.textContent = 'No clip selected'; return; }
  titleEl.textContent = track.name;
}

const PR_ROW_H = 12;
function _prPitchRange(notes) {
  if (!notes || notes.length === 0) return { lo: 48, hi: 72 };
  const midis = notes.map(n => n.midi);
  return { lo: Math.max(0, Math.min(...midis) - 2), hi: Math.min(127, Math.max(...midis) + 2) };
}

function renderPianoRoll() {
  const body  = document.getElementById('seq-pianoroll-body');
  if (!body) return;
  body.innerHTML = '';
  const { track, clip } = focusedClipObjects();
  if (!track || !clip) {
    body.style.minHeight = '120px';
    body.style.minWidth  = '';
    const tip = document.createElement('div');
    tip.className = 'pr-empty';
    tip.textContent = 'Click a clip in a free track to edit its notes';
    body.appendChild(tip);
    _prAppendOverlays(body);
    return;
  }
  body.dataset.trackId = track.id;
  body.dataset.clipId  = clip.id;
  const { lo, hi } = _prPitchRange(clip.notes);
  const rows = hi - lo + 1;
  body.style.minHeight = (rows * PR_ROW_H + 8) + 'px';
  body.style.minWidth  = Math.max(clip.beats, 4) * BEAT_PX + 'px';
  body._prHi = hi;
  body._prLo = lo;

  // Piano keyboard sidebar — per-semitone rows so notes line up exactly
  // with the body grid. Black-key rows are visually narrower for a
  // piano-like look.
  if (SEQ.prShowKeyboard) {
    const kb = document.createElement('div');
    kb.className = 'pr-keyboard';
    kb.style.height = (rows * PR_ROW_H + 8) + 'px';
    for (let m = hi; m >= lo; m--) {
      const row = document.createElement('div');
      row.className = 'pr-keyboard-row' + (midiIsBlack(m) ? ' black' : '');
      row.style.top    = ((hi - m) * PR_ROW_H + 4) + 'px';
      row.style.height = (PR_ROW_H - 1) + 'px';
      row.textContent = (m % 12 === 0) ? midiNoteLabel(m) : '';
      kb.appendChild(row);
    }
    body.appendChild(kb);
  }

  if (clip.notes.length === 0) {
    const tip = document.createElement('div');
    tip.className = 'pr-empty';
    tip.textContent = 'Click and drag to draw a note · drop a chord-pad to add chord notes';
    body.appendChild(tip);
  } else {
    for (let i = 0; i < clip.notes.length; i++) {
      const note = clip.notes[i];
      body.appendChild(_prMakeNote(track, clip, note, i, hi));
    }
  }

  _prAppendOverlays(body);
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
}

function _prMakeNote(track, clip, note, idx, hi) {
  const el = document.createElement('div');
  el.className = 'pr-note';
  el.textContent = note.label || midiNoteLabel(note.midi);
  el.style.left   = (note.start * BEAT_PX) + 'px';
  el.style.width  = (note.beats * BEAT_PX) + 'px';
  el.style.top    = ((hi - note.midi) * PR_ROW_H + 4) + 'px';
  el.style.height = (PR_ROW_H - 2) + 'px';
  const del = document.createElement('button');
  del.className = 'pr-note-del';
  del.textContent = '✕';
  del.addEventListener('click', (e) => {
    e.stopPropagation();
    seqCheckpoint();
    const i = clip.notes.indexOf(note);
    if (i >= 0) clip.notes.splice(i, 1);
    renderPianoRoll();
    seqRenderTrack(track);
    seqResyncTrack(track);
    seqSave();
  });
  el.appendChild(del);
  el.addEventListener('pointerdown', (e) => {
    if (e.target === del) return;
    e.preventDefault();
    e.stopPropagation();
    el.setPointerCapture(e.pointerId);
    seqCheckpoint();
    const body = el.parentElement;
    const startX = e.clientX, startY = e.clientY;
    const origStart = note.start, origMidi = note.midi;
    let moved = false;
    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
      moved = true;
      note.start = Math.max(0, origStart + dx / BEAT_PX);
      note.midi  = Math.max(0, Math.min(127, origMidi - Math.round(dy / PR_ROW_H)));
      el.style.left = (note.start * BEAT_PX) + 'px';
      el.style.top  = ((body._prHi - note.midi) * PR_ROW_H + 4) + 'px';
    };
    const onUp = () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      if (moved) {
        note.start = Math.max(0, Math.round(note.start / 0.5) * 0.5);
        note.label = midiNoteLabel(note.midi);
        clip.notes.sort((a, b) => a.start - b.start);
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
  body.addEventListener('pointerdown', (e) => {
    if (e.target !== body) return;
    const { track, clip } = focusedClipObjects();
    if (!track || !clip) return;
    e.preventDefault();
    body.setPointerCapture(e.pointerId);
    const rect = body.getBoundingClientRect();
    const beat0 = Math.max(0, ((e.clientX - rect.left + body.scrollLeft) / BEAT_PX));
    const startBeat = Math.floor(beat0 * 2) / 2;
    const midi = Math.max(0, Math.min(127, body._prHi - Math.floor((e.clientY - rect.top + body.scrollTop - 4) / PR_ROW_H)));
    seqCheckpoint();
    const newNote = { midi, label: midiNoteLabel(midi), beats: 1, start: startBeat };
    clip.notes.push(newNote);
    clip.notes.sort((a, b) => a.start - b.start);
    const ghost = document.createElement('div');
    ghost.className = 'pr-note';
    ghost.style.left   = (startBeat * BEAT_PX) + 'px';
    ghost.style.width  = BEAT_PX + 'px';
    ghost.style.top    = ((body._prHi - midi) * PR_ROW_H + 4) + 'px';
    ghost.style.height = (PR_ROW_H - 2) + 'px';
    ghost.textContent  = midiNoteLabel(midi);
    body.appendChild(ghost);
    const onMove = (ev) => {
      const beat = Math.max(startBeat + 0.25, (ev.clientX - rect.left + body.scrollLeft) / BEAT_PX);
      newNote.beats = Math.max(0.25, beat - startBeat);
      ghost.style.width = (newNote.beats * BEAT_PX) + 'px';
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
  // focused clip at the drop position. Show a snap-ghost during dragover.
  let _prGhost = null;
  body.addEventListener('dragover', (e) => {
    if (!e.dataTransfer.types.includes('application/x-chord')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const rect = body.getBoundingClientRect();
    const beat = Math.max(0, Math.floor(((e.clientX - rect.left + body.scrollLeft) / BEAT_PX) * 2) / 2);
    if (!_prGhost) {
      _prGhost = document.createElement('div');
      _prGhost.className = 'seq-ghost pr-ghost';
      body.appendChild(_prGhost);
    }
    _prGhost.style.left  = (beat * BEAT_PX) + 'px';
    _prGhost.style.width = (state.beatsPerBar * BEAT_PX) + 'px';
  });
  const _clearPrGhost = () => { if (_prGhost) { _prGhost.remove(); _prGhost = null; } };
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
    const rect = body.getBoundingClientRect();
    const beat = Math.max(0, Math.floor(((e.clientX - rect.left + body.scrollLeft) / BEAT_PX) * 2) / 2);
    const notes = chordToMidiNotes(state.keys[state.currentTemplate], state.octave, data.interval, data.q);
    seqCheckpoint();
    notes.forEach(midi => clip.notes.push({
      midi, label: midiNoteLabel(midi),
      start: beat, beats: state.beatsPerBar,
    }));
    clip.notes.sort((a, b) => a.start - b.start);
    if (beat + state.beatsPerBar > clip.beats) clip.beats = beat + state.beatsPerBar;
    seqAutoExtendLoop(clip.start + clip.beats);
    renderPianoRoll();
    seqRenderTrack(track);
    seqResyncTrack(track);
    seqSave();
  });
  document.getElementById('seq-pianoroll-close')?.addEventListener('click', hidePianoRoll);
  document.getElementById('seq-pianoroll-toggle')?.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePianoRoll();
  });
  // Piano-keyboard sidebar toggle inside the piano-roll
  const kbBtn = document.getElementById('seq-tool-keyboard');
  if (kbBtn) {
    SEQ.prShowKeyboard = false;
    kbBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      SEQ.prShowKeyboard = !SEQ.prShowKeyboard;
      kbBtn.classList.toggle('active', SEQ.prShowKeyboard);
      renderPianoRoll();
    });
  }
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
  if (SEQ.focusedClip?.trackId === id) closePianoRoll();
  removeTrackById(id);
  // Clean up DOM for this track
  document.querySelectorAll(`[data-track-id="${id}"]`).forEach(el => el.remove());
  rebuildTracksUI();
  seqRenderAll();
  seqSave();
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
    const beat = Math.max(0, Math.floor(((e.clientX - rect.left) / BEAT_PX) * 2) / 2);
    seqSetGhost(lane, beat, state.beatsPerBar);
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
    const dropBeat = Math.max(0, Math.floor(((e.clientX - rect.left) / BEAT_PX) * 2) / 2);
    seqCheckpoint();
    t.items.push({
      interval: data.interval, q: data.q, bassInterval: data.bassInterval, label: data.label,
      beats: state.beatsPerBar, start: dropBeat,
      keyRoot: state.keys[state.currentTemplate], template: state.currentTemplate,
    });
    t.items.sort((a, b) => a.start - b.start);
    seqAutoExtendLoop(dropBeat + state.beatsPerBar);
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
    const beat = Math.max(0, Math.floor(((e.clientX - rect.left) / BEAT_PX) * 2) / 2);
    seqSetGhost(lane, beat, hasChord ? state.beatsPerBar : 1);
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
    const dropBeat = Math.max(0, Math.floor(((e.clientX - rect.left) / BEAT_PX) * 2) / 2);
    // Chord-pad drop → create a chord-clip (one bar long, chord notes inside).
    const rawChord = e.dataTransfer.getData('application/x-chord');
    if (rawChord) {
      const data  = JSON.parse(rawChord);
      const beats = state.beatsPerBar;
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
function _appendLaneOverlays(lane) {
  // Loop start/end lines + handles + playhead, identical to seqRender's tail.
  const sl = document.createElement('div');
  sl.className = 'seq-loop-start-line';
  sl.style.left = (SEQ.loopStart * BEAT_PX) + 'px';
  lane.appendChild(sl);
  const ll = document.createElement('div');
  ll.className = 'seq-loop-line';
  ll.style.left = (SEQ.loopEnd * BEAT_PX) + 'px';
  lane.appendChild(ll);
  // Loop drag-tabs on every lane so the user can move them from any track.
  const sh = document.createElement('div');
  sh.className = 'seq-loop-start';
  sh.textContent = '[';
  sh.style.left = Math.max(0, SEQ.loopStart * BEAT_PX - 11) + 'px';
  lane.appendChild(sh);
  _bindLaneLoopHandle(sh, lane, 'start');
  const eh = document.createElement('div');
  eh.className = 'seq-loop-end';
  eh.textContent = ']';
  eh.style.left = (SEQ.loopEnd * BEAT_PX) + 'px';
  lane.appendChild(eh);
  _bindLaneLoopHandle(eh, lane, 'end');
  const ph = document.createElement('div');
  ph.className = 'seq-playhead';
  ph.style.display = SEQ.playing ? 'block' : 'none';
  lane.appendChild(ph);
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
    };
    const onUp = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      if (SEQ.playing && SEQ.loop) seqResyncAll();
      seqSave();
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
  });
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
  } else {
    lane.style.minWidth = '';
    lane.style.minHeight = '';
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

  // Mini-roll preview
  if (clip.notes.length > 0) {
    const midis = clip.notes.map(n => n.midi);
    const hi = Math.max(...midis), lo = Math.min(...midis);
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

  // ✕ delete
  const del = document.createElement('span');
  del.className = 'seq-delete';
  del.innerHTML = '<i data-lucide="x"></i>';
  del.addEventListener('mousedown', (e) => { e.stopPropagation(); e.preventDefault(); });
  del.addEventListener('click', (e) => {
    e.stopPropagation();
    seqCheckpoint();
    const i = track.items.indexOf(clip);
    if (i >= 0) track.items.splice(i, 1);
    if (SEQ.focusedClip?.clipId === clip.id) closePianoRoll();
    seqRenderTrack(track);
    seqResyncTrack(track);
    seqSave();
  });
  block.appendChild(del);

  // Resize handle on right edge
  const resize = document.createElement('div');
  resize.className = 'seq-resize';
  resize.innerHTML = '<i data-lucide="grip-vertical"></i>';
  resize.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); e.preventDefault();
    seqCheckpoint();
    resize.setPointerCapture(e.pointerId);
    const startX = e.clientX, startBts = clip.beats;
    const snap = 0.5;
    const onMove = (ev) => {
      clip.beats = Math.max(snap, startBts + (ev.clientX - startX) / BEAT_PX);
      block.style.width = (clip.beats * BEAT_PX) + 'px';
    };
    const onUp = () => {
      resize.removeEventListener('pointermove', onMove);
      resize.removeEventListener('pointerup', onUp);
      clip.beats = Math.max(snap, Math.round(clip.beats / snap) * snap);
      seqAutoExtendLoop(clip.start + clip.beats);
      seqRenderTrack(track);
      seqSave();
    };
    resize.addEventListener('pointermove', onMove);
    resize.addEventListener('pointerup', onUp);
  });
  block.appendChild(resize);

  // Move by drag · single click opens the piano-roll for this clip
  block.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.seq-resize') || e.target.closest('.seq-delete')) return;
    e.preventDefault();
    seqCheckpoint();
    block.setPointerCapture(e.pointerId);
    const startX = e.clientX, startBeat = clip.start;
    const snap = 0.5;
    const lane = block.parentElement;
    let moved = false;
    let ghost = null;
    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      if (!moved && Math.abs(dx) < 4) return;
      moved = true;
      block.classList.add('moving');
      clip.start = Math.max(0, startBeat + dx / BEAT_PX);
      block.style.left = (clip.start * BEAT_PX) + 'px';
      const snapped = Math.max(0, Math.round(clip.start / snap) * snap);
      if (!ghost) {
        ghost = document.createElement('div');
        ghost.className = 'seq-ghost';
        ghost.style.width = (clip.beats * BEAT_PX) + 'px';
        lane?.appendChild(ghost);
      }
      ghost.style.left = (snapped * BEAT_PX) + 'px';
    };
    const onUp = () => {
      block.removeEventListener('pointermove', onMove);
      block.removeEventListener('pointerup', onUp);
      block.classList.remove('moving');
      if (ghost) { ghost.remove(); ghost = null; }
      if (moved) {
        clip.start = Math.max(0, Math.round(clip.start / snap) * snap);
        track.items.sort((a, b) => a.start - b.start);
        seqAutoExtendLoop(clip.start + clip.beats);
        seqRenderTrack(track);
        seqResyncTrack(track);
      } else {
        // Single click = focus + open piano-roll for this clip
        openPianoRoll(track, clip);
      }
    };
    block.addEventListener('pointermove', onMove);
    block.addEventListener('pointerup', onUp);
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
// Preload samples for any per-track instrument that isn't already covered by the global one
for (const tr of SEQ.tracksList) {
  if (tr.instrument && tr.instrument !== 'synth' && tr.instrument !== state.instrument) {
    preloadSamplesOnGesture(tr.instrument);
  }
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
document.getElementById('seq-tool-pen').addEventListener('click', () => {
  setRollTool(SEQ.rollTool === 'pen' ? 'none' : 'pen');
});
document.getElementById('seq-tool-erase').addEventListener('click', () => {
  setRollTool(SEQ.rollTool === 'erase' ? 'none' : 'erase');
});
document.getElementById('seq-tool-keyboard').addEventListener('click', () => {
  SEQ.rollKeyboard = !SEQ.rollKeyboard;
  document.getElementById('seq-tool-keyboard').classList.toggle('active', SEQ.rollKeyboard);
  document.body.classList.toggle('roll-keyboard-on', SEQ.rollKeyboard);
  seqRenderMidi();
});
document.getElementById('seq-tool-snap').addEventListener('click', () => {
  SEQ.rollSnap = !SEQ.rollSnap;
  document.getElementById('seq-tool-snap').classList.toggle('active', SEQ.rollSnap);
});
const SNAP_VALUES = [
  { val: 0.25,       label: '1/4' },
  { val: 1/3,        label: '1/3' },
  { val: 0.5,        label: '1/2' },
  { val: 1,          label: '1'   },
  { val: 2,          label: '2'   },
  { val: 3,          label: '3'   },
  { val: 4,          label: '4'   },
];
let _snapIdx = 3;
document.getElementById('seq-snap-val').addEventListener('click', () => {
  _snapIdx = (_snapIdx + 1) % SNAP_VALUES.length;
  SEQ.rollSnapVal = SNAP_VALUES[_snapIdx].val;
  document.getElementById('seq-snap-val').textContent = SNAP_VALUES[_snapIdx].label;
});
setRollTool('none');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
