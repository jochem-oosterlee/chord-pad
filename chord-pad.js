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
  'progressions': {
    name: 'Progressions',
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
  'dark-harmony': {
    name: 'Dark Harmony',
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
};

const V2_SECTIONS = {
  'progressions': [
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
  'dark-harmony': [
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
  'progressions': {
    '1':['secdom',0],'2':['secdom',1],'3':['secdom',2],'4':['secdom',3],'5':['secdom',4],'6':['secdom',5],
    'q':['main',0],'w':['main',1],'e':['main',2],'r':['main',3],'t':['main',4],'y':['main',5],'u':['main',6],
    'a':['modal',0],'s':['modal',1],'d':['modal',2],'f':['modal',3],'g':['modal',4],
  },
  'dark-harmony': {
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
  currentTemplate: 'progressions',
  keys: { 'progressions': 0, 'dark-harmony': 9, 'scale-chords': 0 },
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
  version: { 'progressions': 2, 'dark-harmony': 2 },
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

function startSampleNote(midiNote, velocity, at = null, autoRelease = null) {
  const instrument = state.instrument;
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
  // For decay instruments (piano, vibes): fade envelope with sample's natural length
  if (SAMPLE_DEFS[instrument].decay && naturalEnd > sustainStart) {
    env.gain.linearRampToValueAtTime(0.0001, naturalEnd);
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

function startAudioNote(midiNote, velocity, at = null, autoRelease = null) {
  if (state.instrument !== 'synth') return startSampleNote(midiNote, velocity, at, autoRelease);
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

function stopAudioNote(node) {
  if (!node) return;
  const ctx = getAudioCtx();
  const s   = state.synth;
  const now = ctx.currentTime;
  const releaseAt = Math.max(now, (node.startTime || 0) + s.attack + 0.02);
  node.env.gain.cancelScheduledValues(releaseAt);
  const gainAtRelease = releaseAt > now ? node.peak : node.env.gain.value;
  if (!isFinite(gainAtRelease) || gainAtRelease <= 0) {
    node.oscs.forEach(o => { try { o.stop(now); } catch(e) {} });
    return;
  }
  node.env.gain.setValueAtTime(gainAtRelease, releaseAt);
  node.env.gain.exponentialRampToValueAtTime(0.0001, releaseAt + s.release);
  node.oscs.forEach(o => o.stop(releaseAt + s.release));
}

function startBassNote(midiNote, at = null, autoRelease = null) {
  if (state.instrument !== 'synth') {
    const instrument = state.instrument;
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

function sendNoteOn(note, velocity) {
  if (!state.midiEnabled || !state.output) return;
  state.output.send([0x90 | state.channel, note & 0x7F, velocity & 0x7F]);
  blinkLed();
}
function sendNoteOff(note) {
  if (!state.midiEnabled || !state.output) return;
  state.output.send([0x80 | state.channel, note & 0x7F, 0]);
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

  if (state.currentTemplate === 'progressions') {
    const m = currentPadId.match(/^prog-pad-(\w+)-(\d+)$/);
    if (!m) return [];
    const [, section, idxStr] = m;
    const idx = parseInt(idxStr, 10);

    if (section === 'main') {
      const mainCount = state.version['progressions'] === 2 ? 7 : 6;
      const result = [];
      for (let i = 0; i < mainCount; i++) {
        if (i !== idx) result.push(`prog-pad-main-${i}`);
      }
      for (let i = 0; i < 6; i++) result.push(`prog-pad-secdom-${i}`);
      // DOWN: I (0), IV (2), V (4) → any modal chord
      if (idx === 0 || idx === 2 || idx === 4) {
        for (let i = 0; i < 5; i++) result.push(`prog-pad-modal-${i}`);
      }
      return result;
    }
    if (section === 'secdom') return [`prog-pad-main-${idx}`];
    if (section === 'modal') {
      // UP: any modal → I (0), IV (2), V (4)
      const result = ['prog-pad-main-0', 'prog-pad-main-2', 'prog-pad-main-4'];
      for (let i = 0; i < 5; i++) {
        if (i !== idx) result.push(`prog-pad-modal-${i}`);
      }
      return result;
    }
  }

  if (state.currentTemplate === 'dark-harmony') {
    if (currentPadId === 'dark-pad-neapolitan-0') {
      const result = ['dark-pad-main-4'];
      for (let i = 0; i < 4; i++) result.push(`dark-pad-sd_v-${i}`);
      return result;
    }
    const m = currentPadId.match(/^dark-pad-(\w+)-(\d+)$/);
    if (!m) return [];
    const [, section, idxStr] = m;
    const idx = parseInt(idxStr, 10);

    if (section === 'main') {
      const result = [];
      for (let i = 0; i < 7; i++) {
        if (i !== idx) result.push(`dark-pad-main-${i}`);
      }
      for (let i = 0; i < 4; i++) {
        result.push(`dark-pad-sd_v-${i}`);
        result.push(`dark-pad-sd_iv-${i}`);
      }
      result.push('dark-pad-neapolitan-0');
      return result;
    }
    if (section === 'sd_iv') {
      const result = ['dark-pad-main-2', 'dark-pad-main-3'];
      for (let i = 0; i < 4; i++) {
        if (i !== idx) result.push(`dark-pad-sd_iv-${i}`);
      }
      return result;
    }
    if (section === 'sd_v') {
      const result = ['dark-pad-main-4', 'dark-pad-neapolitan-0'];
      for (let i = 0; i < 4; i++) {
        if (i !== idx) result.push(`dark-pad-sd_v-${i}`);
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
    SEQ.items.push({ interval: p.interval, q: p.q, bassInterval: p.bassInterval,
      label: p.label, beats, start: p.startBeat, keyRoot: p.keyRoot, template: p.template });
    SEQ.items.sort((a, b) => a.start - b.start);
    seqAutoExtendLoop(p.startBeat + beats);
    seqRender();
    seqResyncChords();
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

function buildProgressionsBoard() {
  const tpl = TEMPLATES['progressions'];
  const board = document.querySelector('[data-board="progressions"]');
  board.innerHTML = '';
  const ver = state.version['progressions'];
  board.classList.toggle('v2', ver === 2);
  const sections = ver === 2 ? V2_SECTIONS['progressions'] : tpl.sections;
  const keymap  = ver === 2 ? V2_KEYMAPS['progressions']  : tpl.keymap;

  const reverseKeymap = {};
  for (const [k, v] of Object.entries(keymap)) {
    reverseKeymap[`${v[0]},${v[1]}`] = k.toUpperCase();
  }

  sections.forEach((section) => {
    const sectionEl = document.createElement('div');
    sectionEl.className = 'prog-section';

    const flowEl = document.createElement('div');
    flowEl.className = 'prog-flow-label';
    flowEl.innerHTML = `<span>${section.label}</span><span style="opacity:.45; margin-left:8px">${section.flowText}</span>`;
    sectionEl.appendChild(flowEl);

    const row = document.createElement('div');
    row.className = `prog-row ${section.id}`;

    section.chords.forEach((chord, cIdx) => {
      const cell = document.createElement('div');
      cell.className = 'pad-cell' + (chord ? '' : ' empty');
      if (chord) {
        const padId = `prog-pad-${section.id}-${cIdx}`;
        const keyLabel = reverseKeymap[`${section.id},${cIdx}`] || '';
        cell.appendChild(createPad(padId, chord, keyLabel, false));
      }
      row.appendChild(cell);
    });

    if (ver === 2) {
      const fillerCount = 7 - section.chords.length;
      for (let i = 0; i < fillerCount; i++) {
        const cell = document.createElement('div');
        cell.className = 'pad-cell empty';
        row.appendChild(cell);
      }
    }

    sectionEl.appendChild(row);
    board.appendChild(sectionEl);
  });
}

function updateNeapolitanSplit() {
  document.querySelectorAll('.dark-row.has-neapolitan').forEach(row => {
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

function buildDarkHarmonyBoard() {
  const tpl = TEMPLATES['dark-harmony'];
  const board = document.querySelector('[data-board="dark-harmony"]');
  board.innerHTML = '';
  const ver = state.version['dark-harmony'];
  const sections = ver === 2 ? V2_SECTIONS['dark-harmony'] : tpl.sections;
  const keymap  = ver === 2 ? V2_KEYMAPS['dark-harmony']  : tpl.keymap;

  const reverseKeymap = {};
  for (const [k, v] of Object.entries(keymap)) {
    reverseKeymap[`${v[0]},${v[1]}`] = k.toUpperCase();
  }

  const TOTAL_COLS = 7;

  sections.forEach((section) => {
    const sectionEl = document.createElement('div');
    sectionEl.className = 'dark-section';

    const hasNea = !!section.neapolitan;

    const flowEl = document.createElement('div');
    flowEl.className = 'dark-flow-label';
    flowEl.innerHTML = `<span>${section.label}</span><span style="opacity:.45; margin-left:8px">${section.flowText}</span>${hasNea ? `<span style="margin-left:auto; opacity:.7; letter-spacing:0.22em">NEAPOLITAN</span>` : ''}`;
    sectionEl.appendChild(flowEl);

    const row = document.createElement('div');
    row.className = `dark-row ${section.id}`;

    // Chord cells
    section.chords.forEach((chord, cIdx) => {
      const cell = document.createElement('div');
      cell.className = 'pad-cell' + (chord ? '' : ' empty');
      if (chord) {
        const padId = `dark-pad-${section.id}-${cIdx}`;
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
      const padId = 'dark-pad-neapolitan-0';
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
  'progressions': [
    // Main → Sec.Dom (group: one-way up)
    { fromRow: '.prog-row.main', toRow: '.prog-row.secdom', type: 'oneway' },
    // Sec.Dom → Main (1-to-1: each secondary dominant resolves to its target)
    { from: 'prog-pad-secdom-0', to: 'prog-pad-main-0', type: 'oneway' },
    { from: 'prog-pad-secdom-1', to: 'prog-pad-main-1', type: 'oneway' },
    { from: 'prog-pad-secdom-2', to: 'prog-pad-main-2', type: 'oneway' },
    { from: 'prog-pad-secdom-3', to: 'prog-pad-main-3', type: 'oneway' },
    { from: 'prog-pad-secdom-4', to: 'prog-pad-main-4', type: 'oneway' },
    { from: 'prog-pad-secdom-5', to: 'prog-pad-main-5', type: 'oneway' },
    // I, IV, V ↕ modal (twoway)
    { fromPad: 'prog-pad-main-0', toRow: '.prog-row.modal', type: 'twoway' },
    { fromPad: 'prog-pad-main-2', toRow: '.prog-row.modal', type: 'twoway' },
    { fromPad: 'prog-pad-main-4', toRow: '.prog-row.modal', type: 'twoway' },
  ],
  'dark-harmony': [
    // main → sd_v (group up, starts at 1/3 of main row height)
    { fromRow: '.dark-row.main', toRow: '.dark-row.sd_v', type: 'oneway', fromYFraction: 1/3 },
    // sd_v → only V(7) = main-4
    { fromRow: '.dark-row.sd_v', toPad: 'dark-pad-main-4', type: 'oneway' },
    // main → sd_iv (group down, starts at 2/3 of main row height)
    { fromRow: '.dark-row.main', toRow: '.dark-row.sd_iv', type: 'oneway', fromYFraction: 2/3 },
    // sd_iv → only iv (main-2) and bVI (main-3)
    { fromRow: '.dark-row.sd_iv', toPad: 'dark-pad-main-2', type: 'oneway' },
    { fromRow: '.dark-row.sd_iv', toPad: 'dark-pad-main-3', type: 'oneway' },
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
      if (tpl === 'progressions') buildProgressionsBoard();
      else if (tpl === 'dark-harmony') { buildDarkHarmonyBoard(); updateNeapolitanSplit(); }
      else if (tpl === 'scale-chords') buildScaleChordsBoard();
      scheduleDraw();
      const enterCls = dir > 0 ? 'key-rolling-up' : 'key-rolling-down';
      document.querySelectorAll(`[data-board="${tpl}"] .pad-chord`).forEach(el => {
        el.classList.add(enterCls);
        el.addEventListener('animationend', () => el.classList.remove(enterCls), { once: true });
      });
    }, 100);
  } else {
    if (state.currentTemplate === 'progressions') buildProgressionsBoard();
    else if (state.currentTemplate === 'dark-harmony') { buildDarkHarmonyBoard(); updateNeapolitanSplit(); }
    else if (state.currentTemplate === 'scale-chords') buildScaleChordsBoard();
    scheduleDraw();
  }
}

// ============================================================
// KEY SELECTOR
// ============================================================
function buildKeyTracks() {
  ['progressions', 'dark-harmony', 'scale-chords'].forEach(tplId => {
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
  ['progressions', 'dark-harmony', 'scale-chords'].forEach(tplId => {
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

document.querySelectorAll('.ver-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tpl = btn.dataset.tpl;
    const ver = parseInt(btn.dataset.ver);
    state.version[tpl] = ver;
    document.querySelectorAll(`.ver-btn[data-tpl="${tpl}"]`).forEach(b => b.classList.toggle('active', b === btn));
    if (state.currentTemplate === tpl) rebuildBoard();
  });
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

document.getElementById('synth-waveform').addEventListener('change', (e) => {
  state.synth.waveform = e.target.value;
});
function updateSynthOnlyVisibility() {
  const isSynth = state.instrument === 'synth';
  document.querySelectorAll('.synth-param.synth-only').forEach(el => {
    el.classList.toggle('visible', isSynth);
  });
}

document.getElementById('synth-instrument').addEventListener('change', async (e) => {
  const prev = state.instrument;
  const next = e.target.value;
  savedPresets[prev] = { ...state.synth };
  state.instrument = next;
  updateSynthOnlyVisibility();
  if (next !== 'synth') {
    applySynthPreset(savedPresets[next] || INSTRUMENT_PRESETS[next]);
    await preloadSamples(next);
  } else if (savedPresets.synth) {
    applySynthPreset(savedPresets.synth);
  }
});
updateSynthOnlyVisibility();
document.getElementById('settings-header').addEventListener('click', () => {
  document.querySelector('.controls').classList.toggle('collapsed');
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
      state.synth[key] = val;
      lbl.textContent = fmt(val);
      if (side) side(val);
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
  const ver = state.version[state.currentTemplate] || 1;
  const keymap = ver === 2 ? (V2_KEYMAPS[state.currentTemplate] || tpl.keymap) : tpl.keymap;
  const sections = ver === 2 ? (V2_SECTIONS[state.currentTemplate] || tpl.sections) : tpl.sections;
  const mapping = keymap[key];
  if (!mapping) return null;
  const [section, idx] = mapping;
  const prefix = state.currentTemplate === 'progressions' ? 'prog' : 'dark';
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
  const W = 22, H = 68, BW = 12, BH = 40;
  // white key layout: [pitchClass, xLeft]
  const whites = [[0,0],[2,22],[4,44],[5,66],[7,88],[9,110],[11,132]];
  // black key layout: centered on white-key boundaries (22,44,88,110,132)
  const blacks = [[1,16],[3,38],[6,82],[8,104],[10,126]];
  const totalW = 7 * W;

  const DIM_SCALE = [0, 2, 3, 5, 6, 8, 9, 11]; // whole-half diminished
  const scaleTones = state.showScaleTones
    ? scaleOverride
      ? new Set(scaleOverride.map(i => (rootPitch + i) % 12))
      : chordQ === 'dim7'
        ? new Set(DIM_SCALE.map(i => (rootPitch + i) % 12))
        : currentScaleAbsolute()
    : new Set();
  const chordTones  = new Set(CHORD_INTERVALS[chordQ].map(i => (rootPitch + i) % 12));

  function dotAttrs(pc, isBlack) {
    if (pc === rootPitch)     return `fill="#ffffff"`;
    if (chordTones.has(pc))   return `fill="#ffaa33"`;
    if (scaleTones.has(pc))   return `fill="#bee067"`;
    return null;
  }

  let s = `<svg width="${Math.round(totalW * scale)}" height="${Math.round(H * scale)}" viewBox="0 0 ${totalW} ${H}" xmlns="http://www.w3.org/2000/svg" style="display:block">
  <defs><filter id="ds"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000" flood-opacity="0.35"/></filter></defs>`;

  // White keys
  whites.forEach(([pc, x]) => {
    s += `<rect x="${x+0.5}" y="0.5" width="${W-1}" height="${H-1}" fill="#f0ece4" rx="2" stroke="#888" stroke-width="0.5"/>`;
  });
  // Black keys
  blacks.forEach(([pc, x]) => {
    s += `<rect x="${x}" y="0" width="${BW}" height="${BH}" fill="#1a1a1a" rx="2"/>`;
  });
  // Dots on white keys
  whites.forEach(([pc, x]) => {
    const a = dotAttrs(pc, false);
    if (a) s += `<circle cx="${x + W/2}" cy="${H - 9}" r="4.5" ${a} filter="url(#ds)"/>`;
  });
  // Dots on black keys
  blacks.forEach(([pc, x]) => {
    const a = dotAttrs(pc, true);
    if (a) s += `<circle cx="${x + BW/2}" cy="${BH - 8}" r="4.5" ${a}/>`;
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

const SEQ = {
  items: [],       // [{interval, q, bassInterval, label, beats, keyRoot, template}]
  noteItems: [],   // [{midi, label, beats, start}]
  midiItems: [],   // [{midi, label, beats, start}]

  rollTool: 'none',
  playing: false,
  pendingIdx: 0,
  pendingTime: 0,
  notePendingIdx: 0,
  notePendingTime: 0,
  midiPendingIdx: 0,
  midiPendingTime: 0,
  activeIdx: -1,
  noteActiveIdx: -1,
  midiActiveIdx: -1,
  dragSrcIdx: null,
  dropTarget: null,
  noteDragSrcIdx: null,
  noteDropTarget: null,
  midiDragSrcIdx: null,
  midiDropTarget: null,
  cycleStart: 0,
  noteCycleStart: 0,
  midiCycleStart: 0,
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
  loopEnd: 4,  // beats; auto-extends when blocks go beyond
  loop: false,
  animBeat: 0,       // current visual beat position, accumulated each RAF tick
  animLastTime: 0,   // ctx.currentTime - outputLatency at last RAF tick
  animLoopLen: 4,    // loop length in beats, cached at init/resync (not during drag)
  animLoopStart: 0,  // loopStart beat, cached at init/resync
  _dragLabel: '',
  _dragHoverId: null,
};

function seqBeatDur() { return 60 / state.tempo; }

function seqTimeout(fn, delay) {
  const id = setTimeout(() => { SEQ.pendingTimers.delete(id); fn(); }, delay);
  SEQ.pendingTimers.add(id);
}

function seqUpdateNowPlaying() {
  const parts = [];
  if (SEQ.nowChord) parts.push(SEQ.nowChord);
  if (SEQ.nowNote)  parts.push('♩ ' + SEQ.nowNote);
  document.getElementById('now-playing-notes').textContent = parts.join('  ·  ') || '—';
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
  const handle = document.getElementById('seq-loop-end');
  if (handle) handle.style.left = px + 'px';
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
  const handle = document.getElementById('seq-loop-start');
  if (handle) handle.style.left = px + 'px';
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
    if (isMidi) {
      SEQ.midiItems.splice(idx, 1);
      if (SEQ.midiPendingIdx >= SEQ.midiItems.length) SEQ.midiPendingIdx = 0;
      seqRenderMidi();
    } else if (isNote) {
      SEQ.noteItems.splice(idx, 1);
      if (SEQ.notePendingIdx >= SEQ.noteItems.length) SEQ.notePendingIdx = 0;
      seqRenderNotes();
    } else {
      SEQ.items.splice(idx, 1);
      if (SEQ.pendingIdx >= SEQ.items.length) SEQ.pendingIdx = 0;
      if (SEQ.activeIdx >= SEQ.items.length) SEQ.activeIdx = SEQ.items.length - 1;
      seqRender();
    }
  });
  block.appendChild(del);

  const resize = document.createElement('div');
  resize.className = 'seq-resize';
  resize.innerHTML = '<i data-lucide="grip-vertical"></i>';
  resize.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); e.preventDefault();
    resize.setPointerCapture(e.pointerId);
    const startX = e.clientX, startBts = item.beats;
    const snap = 0.5;
    const lane = block.parentElement;
    const items = isMidi ? SEQ.midiItems : isNote ? SEQ.noteItems : SEQ.items;
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
    block.setPointerCapture(e.pointerId);
    const startX = e.clientX, startBeat = item.start;
    const snap = 0.5;
    const items = isMidi ? SEQ.midiItems : isNote ? SEQ.noteItems : SEQ.items;
    const lane  = block.parentElement;
    let moved = false;
    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      if (!moved && Math.abs(dx) < 4) return;
      moved = true;
      block.classList.add('moving');
      item.start = Math.max(0, startBeat + dx / BEAT_PX);
      block.style.left = (item.start * BEAT_PX) + 'px';
      if (lane) lane.style.minWidth = seqLaneWidth(items) + 'px';
    };
    const onUp = () => {
      block.removeEventListener('pointermove', onMove);
      block.removeEventListener('pointerup', onUp);
      block.classList.remove('moving');
      if (moved) {
        item.start = Math.max(0, Math.round(item.start / snap) * snap);
        items.sort((a, b) => a.start - b.start);
        seqAutoExtendLoop(item.start + item.beats);
        if (isMidi) seqRenderMidi(); else if (isNote) seqRenderNotes(); else seqRender();
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
    localStorage.setItem(SEQ_KEY, JSON.stringify({
      items: SEQ.items,
      noteItems: SEQ.noteItems,
      midiItems: SEQ.midiItems,
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
    if (Array.isArray(d.items))     SEQ.items     = d.items;
    if (Array.isArray(d.noteItems)) SEQ.noteItems = d.noteItems;
    if (Array.isArray(d.midiItems)) SEQ.midiItems = d.midiItems;
    if (typeof d.loopStart   === 'number')  SEQ.loopStart      = d.loopStart;
    if (typeof d.loopEnd     === 'number')  SEQ.loopEnd        = d.loopEnd;
    if (typeof d.loop        === 'boolean') SEQ.loop           = d.loop;
    if (typeof d.beatsPerBar === 'number')  state.beatsPerBar  = d.beatsPerBar;
    if (typeof d.tempo       === 'number')  state.tempo        = d.tempo;
  } catch (_) {}
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
  [['chords', 'seq-lane'], ['melody', 'seq-note-lane'], ['free', 'seq-midi-lane']].forEach(([track, laneId]) => {
    const label = document.querySelector(`.seq-track-label[data-track="${track}"]`);
    const lane  = document.getElementById(laneId);
    if (label && lane) label.style.height = lane.getBoundingClientRect().height + 'px';
  });
}

function seqRender() {
  const lane = document.getElementById('seq-lane');
  if (!lane) return;
  lane.innerHTML = '';
  if (SEQ.items.length === 0) {
    const hint = document.createElement('div');
    hint.className = 'seq-drop-hint';
    hint.textContent = 'drag chords here';
    lane.appendChild(hint);
    lane.style.minWidth = '';
    seqUpdateHints();
  } else {
    lane.style.minWidth = seqLaneWidth(SEQ.items) + 'px';
    SEQ.items.forEach((item, idx) => lane.appendChild(seqMakeBlock(item, idx, false)));
  }
  const sl = document.createElement('div');
  sl.className = 'seq-loop-start-line';
  sl.style.left = (SEQ.loopStart * BEAT_PX) + 'px';
  lane.appendChild(sl);
  const sh = document.createElement('div');
  sh.className = 'seq-loop-start';
  sh.id = 'seq-loop-start';
  sh.textContent = '[';
  sh.style.left = (SEQ.loopStart * BEAT_PX) + 'px';
  lane.appendChild(sh);
  const ll = document.createElement('div');
  ll.className = 'seq-loop-line';
  ll.style.left = (SEQ.loopEnd * BEAT_PX) + 'px';
  lane.appendChild(ll);
  const lh = document.createElement('div');
  lh.className = 'seq-loop-end';
  lh.id = 'seq-loop-end';
  lh.textContent = ']';
  lh.style.left = (SEQ.loopEnd * BEAT_PX) + 'px';
  lane.appendChild(lh);
  const ph = document.createElement('div');
  ph.className = 'seq-playhead';
  ph.style.display = SEQ.playing ? 'block' : 'none';
  lane.appendChild(ph);
  initSeqLoopEnd();
  initSeqLoopStart();
  seqUpdateLoopVisible();
  syncTrackLabelHeights();
  refreshLucide();
  seqSave();
}

function seqRenderNotes() {
  const lane = document.getElementById('seq-note-lane');
  if (!lane) return;
  lane.innerHTML = '';
  if (SEQ.noteItems.length === 0) {
    const hint = document.createElement('div');
    hint.className = 'seq-drop-hint';
    hint.textContent = 'drag keys here';
    lane.appendChild(hint);
    lane.style.minWidth = '';
    seqUpdateHints();
  } else {
    lane.style.minWidth = seqLaneWidth(SEQ.noteItems) + 'px';
    SEQ.noteItems.forEach((item, idx) => lane.appendChild(seqMakeBlock(item, idx, true)));
  }
  seqRollAddLines(lane);
  seqUpdateLoopEnd();
  syncTrackLabelHeights();
  refreshLucide();
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
const ROLL_VIEW_H   = 160;  // must match CSS max-height

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
    if (m % 12 === 0) {
      const lbl = document.createElement('span');
      lbl.className = 'roll-c-label';
      lbl.textContent = 'C' + (Math.floor(m / 12) - 1);
      row.appendChild(lbl);
    }
    lane.appendChild(row);
  }
}

function midiIsBlack(midi) {
  return [1, 3, 6, 8, 10].includes(midi % 12);
}

function seqRollAddLines(lane) {
  const sl = document.createElement('div');
  sl.className = 'seq-loop-start-line';
  sl.style.left = (SEQ.loopStart * BEAT_PX) + 'px';
  lane.appendChild(sl);
  const ll = document.createElement('div');
  ll.className = 'seq-loop-line';
  ll.style.left = (SEQ.loopEnd * BEAT_PX) + 'px';
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

function seqRenderMidi() {
  const lane = document.getElementById('seq-midi-lane');
  if (!lane) return;
  const savedScroll = lane.scrollTop;
  lane.innerHTML = '';
  lane.style.padding = '';
  lane.classList.add('roll-mode');

  lane.style.minWidth = SEQ.midiItems.length > 0 ? seqLaneWidth(SEQ.midiItems) + 'px' : '';
  rollBuildGrid(lane);
  if (SEQ.midiItems.length === 0) {
    const hint = document.createElement('div');
    hint.className = 'seq-drop-hint';
    hint.textContent = 'record via MIDI in';
    lane.appendChild(hint);
    seqUpdateHints();
  } else {
    const midiCfg = { items: SEQ.midiItems, pendingIdxKey: 'midiPendingIdx', onRerender: seqRenderMidi, activeIdx: SEQ.midiActiveIdx, yDrag: true };
    SEQ.midiItems.forEach((item, idx) => lane.appendChild(seqMakeRollNote(item, idx, ROLL_TOP_MIDI, ROLL_BOT_MIDI, midiCfg)));
  }
  const ctr = SEQ.midiItems.length > 0 ? Math.round(SEQ.midiItems.reduce((s, i) => s + i.midi, 0) / SEQ.midiItems.length) : 66;
  lane.scrollTop = savedScroll || rollScrollForMidi(ctr);
  seqRollAddLines(lane);
  seqUpdateLoopEnd();
  syncTrackLabelHeights();
  refreshLucide();
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

    if (state.audioEnabled) {
      const audioNodes = notes.map((n, i) => startAudioNote(n, state.velocity, t + i * 0.002));
      audioNodes.forEach(n => SEQ.activeNodes.add(n));
      seqTimeout(() => audioNodes.forEach(n => { stopAudioNote(n); SEQ.activeNodes.delete(n); }), offDelay);
      if (bassNote !== null) {
        const bassNode = startBassNote(bassNote, t);
        SEQ.activeNodes.add(bassNode);
        seqTimeout(() => { stopAudioNote(bassNode); SEQ.activeNodes.delete(bassNode); }, offDelay);
      }
    }
    const capturedNotes = [...notes], capturedBass = bassNote;
    seqTimeout(() => {
      capturedNotes.forEach(n => sendNoteOn(n, state.velocity));
      if (capturedBass !== null) sendNoteOn(capturedBass, state.velocity);
      SEQ.nowChord = chordDisplayName(item.keyRoot, item.interval, item.q) + ' [' + capturedNotes.map(midiNoteName).join(' · ') + ']';
      seqUpdateNowPlaying();
    }, onDelay);
    seqTimeout(() => {
      capturedNotes.forEach(n => sendNoteOff(n));
      if (capturedBass !== null) sendNoteOff(capturedBass);
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

    if (state.audioEnabled) {
      const node = startAudioNote(item.midi, state.velocity, t);
      SEQ.activeNodes.add(node);
      seqTimeout(() => { stopAudioNote(node); SEQ.activeNodes.delete(node); }, offDelay);
    }
    const capturedMidi = item.midi, capturedLabel = item.label;
    seqTimeout(() => {
      sendNoteOn(capturedMidi, state.velocity);
      SEQ.nowNote = capturedLabel;
      seqUpdateNowPlaying();
    }, onDelay);
    seqTimeout(() => {
      sendNoteOff(capturedMidi);
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

    if (state.audioEnabled) {
      const node = startAudioNote(item.midi, state.velocity, t);
      SEQ.activeNodes.add(node);
      seqTimeout(() => { stopAudioNote(node); SEQ.activeNodes.delete(node); }, offDelay);
    }
    const capturedMidi = item.midi, capturedLabel = item.label;
    seqTimeout(() => {
      sendNoteOn(capturedMidi, state.velocity);
      SEQ.nowNote = capturedLabel;
      seqUpdateNowPlaying();
    }, onDelay);
    seqTimeout(() => {
      sendNoteOff(capturedMidi);
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


function seqResyncChords() {
  if (!SEQ.playing || SEQ.items.length === 0) return;
  const bd    = seqBeatDur();
  const tRef  = SEQ.playStartTime + 0.05;
  const total = seqTotalDur();
  const now   = getAudioCtx().currentTime;
  const ls    = seqLoopOffset();
  const cycleNum   = SEQ.loop ? Math.max(0, Math.floor((now - tRef) / total)) : 0;
  const cycleStart = tRef + cycleNum * total;
  for (let i = 0; i < SEQ.items.length; i++) {
    if (!seqItemInRange(SEQ.items[i])) continue;
    const t = cycleStart + (SEQ.items[i].start - ls) * bd;
    if (t > now) {
      SEQ.cycleStart = cycleStart; SEQ.pendingIdx = i; SEQ.pendingTime = t;
      seqResyncAnimLoop();
      return;
    }
  }
  if (!SEQ.loop) { SEQ.pendingTime = Infinity; return; }
  const next = cycleStart + total;
  const fi = seqFindNextInRange(SEQ.items, 0);
  SEQ.cycleStart = next; SEQ.pendingIdx = fi >= 0 ? fi : 0;
  SEQ.pendingTime = fi >= 0 ? next + (SEQ.items[fi].start - SEQ.loopStart) * bd : Infinity;
  seqResyncAnimLoop();
}

function seqResyncNotes() {
  if (!SEQ.playing || SEQ.noteItems.length === 0) return;
  const bd    = seqBeatDur();
  const tRef  = SEQ.playStartTime + 0.05;
  const total = seqTotalDur();
  const now   = getAudioCtx().currentTime;
  const ls    = seqLoopOffset();
  const cycleNum   = SEQ.loop ? Math.max(0, Math.floor((now - tRef) / total)) : 0;
  const cycleStart = tRef + cycleNum * total;
  for (let i = 0; i < SEQ.noteItems.length; i++) {
    if (!seqItemInRange(SEQ.noteItems[i])) continue;
    const t = cycleStart + (SEQ.noteItems[i].start - ls) * bd;
    if (t > now) {
      SEQ.noteCycleStart = cycleStart; SEQ.notePendingIdx = i; SEQ.notePendingTime = t;
      seqResyncAnimLoop();
      return;
    }
  }
  if (!SEQ.loop) { SEQ.notePendingTime = Infinity; return; }
  const next = cycleStart + total;
  const fn = seqFindNextInRange(SEQ.noteItems, 0);
  SEQ.noteCycleStart = next; SEQ.notePendingIdx = fn >= 0 ? fn : 0;
  SEQ.notePendingTime = fn >= 0 ? next + (SEQ.noteItems[fn].start - SEQ.loopStart) * bd : Infinity;
  seqResyncAnimLoop();
}

function seqResyncMidi() {
  if (!SEQ.playing || SEQ.midiItems.length === 0) return;
  const bd    = seqBeatDur();
  const tRef  = SEQ.playStartTime + 0.05;
  const total = seqTotalDur();
  const now   = getAudioCtx().currentTime;
  const ls    = seqLoopOffset();
  const cycleNum   = SEQ.loop ? Math.max(0, Math.floor((now - tRef) / total)) : 0;
  const cycleStart = tRef + cycleNum * total;
  for (let i = 0; i < SEQ.midiItems.length; i++) {
    if (!seqItemInRange(SEQ.midiItems[i])) continue;
    const t = cycleStart + (SEQ.midiItems[i].start - ls) * bd;
    if (t > now) {
      SEQ.midiCycleStart = cycleStart; SEQ.midiPendingIdx = i; SEQ.midiPendingTime = t;
      seqResyncAnimLoop();
      return;
    }
  }
  if (!SEQ.loop) { SEQ.midiPendingTime = Infinity; return; }
  const next = cycleStart + total;
  const fm = seqFindNextInRange(SEQ.midiItems, 0);
  SEQ.midiCycleStart = next; SEQ.midiPendingIdx = fm >= 0 ? fm : 0;
  SEQ.midiPendingTime = fm >= 0 ? next + (SEQ.midiItems[fm].start - SEQ.loopStart) * bd : Infinity;
  seqResyncAnimLoop();
}

function seqInitPlay(t0) {
  const bd  = seqBeatDur();
  const ls  = seqLoopOffset();
  SEQ.playing        = true;
  SEQ.playStartTime  = t0 - 0.05;
  SEQ.cycleStart     = t0;
  SEQ.noteCycleStart = t0;
  SEQ.animBeat      = SEQ.loopStart;
  SEQ.animLastTime  = t0;
  SEQ.animLoopLen   = SEQ.loopEnd - SEQ.loopStart;
  SEQ.animLoopStart = SEQ.loopStart;
  const fi = seqFindNextInRange(SEQ.items, 0);
  const fn = seqFindNextInRange(SEQ.noteItems, 0);
  const fm = seqFindNextInRange(SEQ.midiItems, 0);
  SEQ.pendingIdx      = fi >= 0 ? fi : 0;
  SEQ.pendingTime     = fi >= 0 ? t0 + (SEQ.items[fi].start - ls) * bd : Infinity;
  SEQ.notePendingIdx  = fn >= 0 ? fn : 0;
  SEQ.notePendingTime = fn >= 0 ? t0 + (SEQ.noteItems[fn].start - ls) * bd : Infinity;
  SEQ.midiCycleStart  = t0;
  SEQ.midiPendingIdx  = fm >= 0 ? fm : 0;
  SEQ.midiPendingTime = fm >= 0 ? t0 + (SEQ.midiItems[fm].start - ls) * bd : Infinity;
  SEQ.activeIdx       = -1;
  SEQ.noteActiveIdx   = -1;
  SEQ.midiActiveIdx   = -1;
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
  document.getElementById('now-playing-notes').textContent = '—';
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
      scrollRaf = requestAnimationFrame(autoScroll);
    };

    const cleanup = () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend',  onUp);
      document.removeEventListener('touchcancel', onUp);
      stopScroll();
      if (ghost) { ghost.remove(); ghost = null; }
      const lane = document.getElementById(laneId);
      if (lane) {
        lane.classList.remove('drag-over');
        lane.querySelector('.seq-drop-hint')?.style.removeProperty('color');
        seqClearGhost(lane);
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
        const lane = document.getElementById(laneId);
        if (lane) {
          lane.classList.add('drag-over');
          lane.querySelector('.seq-drop-hint')?.style.setProperty('color', 'var(--accent)');
        }
        autoScroll();
      }
      ev.preventDefault();
      ghost.style.left = t.clientX + 'px';
      ghost.style.top  = t.clientY + 'px';
      const lane = document.getElementById(laneId);
      if (lane) {
        const rect = lane.getBoundingClientRect();
        if (t.clientX >= rect.left && t.clientX <= rect.right &&
            t.clientY >= rect.top  && t.clientY <= rect.bottom) {
          const beat = Math.max(0, Math.floor(((t.clientX - rect.left) / BEAT_PX) * 2) / 2);
          const beats = laneId === 'seq-note-lane' ? 1 : state.beatsPerBar;
          seqSetGhost(lane, beat, beats);
        } else {
          seqClearGhost(lane);
        }
      }
    };

    const onUp = (ev) => {
      const t = Array.from(ev.changedTouches).find(t => t.identifier === tid);
      if (!t) return;
      if (!dragging) { cleanup(); return; }
      const dropX = t.clientX, dropY = t.clientY;
      cleanup();
      const lane = document.getElementById(laneId);
      if (!lane) return;
      const rect = lane.getBoundingClientRect();
      if (dropX < rect.left || dropX > rect.right || dropY < rect.top || dropY > rect.bottom) return;
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

  wrap.addEventListener('scroll', seqUpdateHints);

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
      const startBeat = Math.floor(relX / BEAT_PX * 4) / 4;
      const midi      = Math.max(ROLL_BOT_MIDI, Math.min(ROLL_TOP_MIDI, ROLL_TOP_MIDI - Math.floor(relY / ROLL_ROW_H)));
      const ghost     = document.createElement('div');
      ghost.className = 'roll-note roll-note-ghost';
      ghost.style.left   = (startBeat * BEAT_PX) + 'px';
      ghost.style.top    = (ROLL_TOP_MIDI - midi) * ROLL_ROW_H + 'px';
      ghost.style.height = (ROLL_ROW_H - 1) + 'px';
      ghost.style.width  = BEAT_PX + 'px';
      laneEl.appendChild(ghost);
      let beats = 1;
      const onMove = (ev) => {
        const t = Array.from(ev.changedTouches).find(t => t.identifier === tid);
        if (!t) return;
        ev.preventDefault();
        const rx = t.clientX - laneRect.left + wrap.scrollLeft;
        beats = Math.max(0.25, Math.round(Math.max(rx - startBeat * BEAT_PX, BEAT_PX * 0.25) / BEAT_PX * 4) / 4);
        ghost.style.width = (beats * BEAT_PX) + 'px';
      };
      const onUp = () => {
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend',  onUp);
        document.removeEventListener('touchcancel', onUp);
        ghost.remove();
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

    // Pen tool: draw note on roll background — drag sets duration
    if (SEQ.rollTool === 'pen' && laneEl.id === 'seq-midi-lane') {
      const laneRect = laneEl.getBoundingClientRect();
      const relX = e.clientX - laneRect.left + wrap.scrollLeft;
      const relY = e.clientY - laneRect.top + laneEl.scrollTop;
      const startBeat = Math.floor(relX / BEAT_PX * 4) / 4;
      const midi = Math.max(ROLL_BOT_MIDI, Math.min(ROLL_TOP_MIDI, ROLL_TOP_MIDI - Math.floor(relY / ROLL_ROW_H)));
      // Ghost element for live preview
      const ghost = document.createElement('div');
      ghost.className = 'roll-note roll-note-ghost';
      ghost.style.left   = (startBeat * BEAT_PX) + 'px';
      ghost.style.top    = (ROLL_TOP_MIDI - midi) * ROLL_ROW_H + 'px';
      ghost.style.height = (ROLL_ROW_H - 1) + 'px';
      ghost.style.width  = BEAT_PX + 'px';
      laneEl.appendChild(ghost);
      let beats = 1;
      const onMove = (ev) => {
        const rx = ev.clientX - laneRect.left + wrap.scrollLeft;
        beats = Math.max(0.25, Math.round(Math.max(rx - startBeat * BEAT_PX, BEAT_PX * 0.25) / BEAT_PX * 4) / 4);
        ghost.style.width = (beats * BEAT_PX) + 'px';
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        ghost.remove();
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
    _hint()?.style.setProperty('color', 'var(--accent)');
    const rect  = lane.getBoundingClientRect();
    const beat  = Math.max(0, Math.floor(((e.clientX - rect.left) / BEAT_PX) * 2) / 2);
    const beats = hasChord ? state.beatsPerBar : 1;
    seqSetGhost(lane, beat, beats);
  });
  lane.addEventListener('dragleave', (e) => {
    if (!lane.contains(e.relatedTarget)) { lane.classList.remove('drag-over'); seqClearGhost(lane); }
  });
  lane.addEventListener('drop', (e) => {
    e.preventDefault();
    lane.classList.remove('drag-over');
    _hint()?.style.removeProperty('color');
    seqClearGhost(lane);
    if (SEQ.midiDragSrcIdx !== null) return;
    const rect = lane.getBoundingClientRect();
    const dropBeat = Math.max(0, Math.floor(((e.clientX - rect.left) / BEAT_PX) * 2) / 2);
    const rawChord = e.dataTransfer.getData('application/x-chord');
    if (rawChord) {
      const data  = JSON.parse(rawChord);
      const notes = chordToMidiNotes(state.keys[state.currentTemplate], state.octave, data.interval, data.q);
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
    SEQ.noteItems.push({ midi: data.midi, label: data.label, beats: 1, start });
    SEQ.noteItems.sort((a, b) => a.start - b.start);
    seqAutoExtendLoop(start + 1);
    seqRenderNotes();
    seqResyncNotes();
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
      if (SEQ.playing && SEQ.loop) {
        seqResyncChords();
        seqResyncNotes();
      }
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
      if (SEQ.playing && SEQ.loop) {
        seqResyncChords();
        seqResyncNotes();
      }
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
  seqResyncChords();
  seqResyncNotes();

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
    SEQ.noteItems.push({ midi, label: p.label, beats, start: p.startBeat });
    SEQ.noteItems.sort((a, b) => a.start - b.start);
    seqAutoExtendLoop(p.startBeat + beats);
    seqRenderNotes();
    seqResyncNotes();
    REC.pendingNotes.delete(midi);
  }
  if (REC.active && REC.pendingMidi.has(midi)) {
    const p = REC.pendingMidi.get(midi);
    const beats = Math.max(0.1, recCurrentBeat() - p.startBeat);
    SEQ.midiItems.push({ midi, label: p.label, beats, start: p.startBeat });
    SEQ.midiItems.sort((a, b) => a.start - b.start);
    seqAutoExtendLoop(p.startBeat + beats);
    seqRenderMidi();
    seqResyncMidi();
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
  preloadSamples(state.instrument);
}
updateSynthOnlyVisibility();

buildKeyboard();
initKbDragStrip();
initTouchGlide();
initSeqLane();
initSeqNoteLane();
initSeqMidiLane();
initSeqLanePan();
initSeqPinchZoom();
seqLoad();
seqUpdateBarLine();
seqUpdateLoopStart();
document.getElementById('seq-timesig').value  = String(state.beatsPerBar);
document.getElementById('seq-tempo-val').value = state.tempo;
document.getElementById('ctrl-tempo').value    = state.tempo;
document.getElementById('seq-loop-btn').classList.toggle('active', SEQ.loop);
seqRender();
seqRenderNotes();
seqRenderMidi();
syncTrackLabelHeights();
refreshLucide();
requestAnimationFrame(seqUpdateHints);

const TRACK_LANE_MAP = { chords: 'seq-lane', melody: 'seq-note-lane', free: 'seq-midi-lane' };

document.querySelectorAll('.seq-track-label[data-track]').forEach(label => {
  label.addEventListener('click', () => {
    const track = label.dataset.track;
    const isNowCollapsed = label.classList.toggle('track-collapsed');
    const lane = document.getElementById(TRACK_LANE_MAP[track]);
    if (lane) lane.classList.toggle('track-collapsed', isNowCollapsed);
    syncTrackLabelHeights();
  });
});

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
setRollTool('none');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
