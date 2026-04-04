// chordFriends - Scale Data & Computation
// Supports: Major, Minor, Melodic Minor, Harmonic Minor, and all 7 modes
// Provides note names, staff positions, tablature, and piano key highlights

// ── SCALE TYPE DEFINITIONS ──
const SCALE_TYPES = [
  { id: 'major',          name: 'Major (Ionian)',    intervals: [0, 2, 4, 5, 7, 9, 11] },
  { id: 'dorian',         name: 'Dorian',            intervals: [0, 2, 3, 5, 7, 9, 10] },
  { id: 'phrygian',       name: 'Phrygian',          intervals: [0, 1, 3, 5, 7, 8, 10] },
  { id: 'lydian',         name: 'Lydian',             intervals: [0, 2, 4, 6, 7, 9, 11] },
  { id: 'mixolydian',     name: 'Mixolydian',        intervals: [0, 2, 4, 5, 7, 9, 10] },
  { id: 'minor',          name: 'Minor (Aeolian)',   intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: 'locrian',        name: 'Locrian',           intervals: [0, 1, 3, 5, 6, 8, 10] },
  { id: 'melodic_minor',  name: 'Melodic Minor',     intervals: [0, 2, 3, 5, 7, 9, 11] },
  { id: 'harmonic_minor', name: 'Harmonic Minor',    intervals: [0, 2, 3, 5, 7, 8, 11] },
];

// ── ROOT NOTES (all 12 keys) ──
const ROOT_NOTES = [
  { name: 'C',  pitchClass: 0 },
  { name: 'C#', pitchClass: 1,  altName: 'Db' },
  { name: 'D',  pitchClass: 2 },
  { name: 'Eb', pitchClass: 3,  altName: 'D#' },
  { name: 'E',  pitchClass: 4 },
  { name: 'F',  pitchClass: 5 },
  { name: 'F#', pitchClass: 6,  altName: 'Gb' },
  { name: 'G',  pitchClass: 7 },
  { name: 'Ab', pitchClass: 8,  altName: 'G#' },
  { name: 'A',  pitchClass: 9 },
  { name: 'Bb', pitchClass: 10, altName: 'A#' },
  { name: 'B',  pitchClass: 11 },
];

// ── INSTRUMENT TUNINGS (MIDI note numbers, low to high pitch) ──
const SCALE_TUNINGS = {
  guitar:   { strings: ['E', 'A', 'D', 'G', 'B', 'e'], midi: [40, 45, 50, 55, 59, 64] },
  ukulele:  { strings: ['G', 'C', 'E', 'A'],            midi: [55, 60, 64, 69] },
  banjo:    { strings: ['D', 'G', 'B', 'D'],            midi: [50, 55, 59, 62] },
  mandolin: { strings: ['G', 'D', 'A', 'E'],            midi: [55, 62, 69, 76] },
};

// ── MUSIC THEORY HELPERS ──

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_TO_SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// Parse a note name like "C#", "Eb", "F" into letter and accidental semitones
function parseNoteName(name) {
  const letter = name.charAt(0).toUpperCase();
  const accStr = name.slice(1);
  let accSemi = 0;
  if (accStr === '#') accSemi = 1;
  else if (accStr === '##') accSemi = 2;
  else if (accStr === 'b') accSemi = -1;
  else if (accStr === 'bb') accSemi = -2;
  return { letter, accSemi, letterIdx: LETTERS.indexOf(letter) };
}

// Get the pitch class (0-11) for a note name
function noteNameToPitchClass(name) {
  const { letter, accSemi } = parseNoteName(name);
  return ((LETTER_TO_SEMI[letter] || 0) + accSemi + 12) % 12;
}

// Get properly-spelled note names for a scale
// Returns array of 7 note name strings (one per scale degree)
function getScaleNoteNames(rootName, intervals) {
  const root = parseNoteName(rootName);
  const rootPC = ((LETTER_TO_SEMI[root.letter] || 0) + root.accSemi + 12) % 12;

  const noteNames = [];
  for (let deg = 0; deg < intervals.length; deg++) {
    const targetPC = (rootPC + intervals[deg]) % 12;
    const letterIdx = (root.letterIdx + deg) % 7;
    const letter = LETTERS[letterIdx];
    const naturalPC = LETTER_TO_SEMI[letter];
    let acc = (targetPC - naturalPC + 12) % 12;
    if (acc > 6) acc -= 12;

    let accStr = '';
    if (acc === 1) accStr = '#';
    else if (acc === 2) accStr = '##';
    else if (acc === -1) accStr = 'b';
    else if (acc === -2) accStr = 'bb';

    noteNames.push(letter + accStr);
  }
  return noteNames;
}

// ── TABLATURE COMPUTATION ──

// Compute one-octave ascending tablature for a scale on a fretted instrument
// Returns array of { string: stringIndex, fret: fretNumber } (8 entries: root to octave)
function computeScaleTab(scaleType, rootName, instrument) {
  const tuning = SCALE_TUNINGS[instrument];
  if (!tuning) return [];

  const scale = SCALE_TYPES.find(s => s.id === scaleType);
  if (!scale) return [];

  const rootPC = noteNameToPitchClass(rootName);
  const intervals = scale.intervals.concat([12]); // add octave note

  // Sort strings by pitch (low to high)
  const strings = tuning.midi.map((m, i) => ({ i, m })).sort((a, b) => a.m - b.m);
  const maxFret = 7;

  // Find the root note on the lowest available string (within maxFret)
  let rootMidi = null;
  let startSi = 0;
  for (let si = 0; si < strings.length; si++) {
    for (let f = 0; f <= maxFret; f++) {
      if ((strings[si].m + f) % 12 === rootPC) {
        rootMidi = strings[si].m + f;
        startSi = si;
        break;
      }
    }
    if (rootMidi !== null) break;
  }
  if (rootMidi === null) return [];

  // Build MIDI values for the ascending scale
  const scaleMidis = intervals.map(iv => rootMidi + iv);

  // Assign each note to a string/fret, ascending across strings
  const tab = [];
  let si = startSi;

  for (const midi of scaleMidis) {
    let fret = midi - strings[si].m;

    if (fret < 0 || fret > maxFret) {
      // Current string can't play this note — move to next string
      for (let nsi = si + 1; nsi < strings.length; nsi++) {
        const nf = midi - strings[nsi].m;
        if (nf >= 0 && nf <= maxFret) {
          si = nsi;
          fret = nf;
          break;
        }
      }
    } else if (si + 1 < strings.length) {
      // Check if the next string offers a lower fret (more natural position)
      const nextFret = midi - strings[si + 1].m;
      if (nextFret >= 0 && nextFret <= 3 && fret >= 4) {
        si = si + 1;
        fret = nextFret;
      }
    }

    tab.push({ string: strings[si].i, fret });
  }

  return tab;
}

// ── FULL SCALE INFO ──

// Get complete scale information for rendering
// Returns: { name, rootName, scaleType, noteNames, pitchClasses, tab, startMidi, intervals }
function getScaleInfo(scaleTypeId, rootName, instrument) {
  const scale = SCALE_TYPES.find(s => s.id === scaleTypeId);
  if (!scale) return null;

  const noteNames = getScaleNoteNames(rootName, scale.intervals);
  const octaveNoteNames = noteNames.concat([noteNames[0]]); // 8 notes including octave
  const rootPC = noteNameToPitchClass(rootName);
  const intervals = scale.intervals.concat([12]);

  // Pitch classes for all 8 notes
  const pitchClasses = intervals.map(iv => (rootPC + iv) % 12);

  // Tablature (only for fretted instruments)
  let tab = null;
  if (instrument !== 'piano') {
    tab = computeScaleTab(scaleTypeId, rootName, instrument);
  }

  // Find starting MIDI for staff rendering
  // Goal: keep all 8 notes within/near the 5 staff lines (E4=64 to F5=77)
  // Staff line positions: bottom E4(pos 2) to top F5(pos 9)
  // Best fit: start note between D4(62) and G4(67) so the octave stays on staff
  let startMidi = 60;
  const staffIdeal = {
    'C': 60, 'C#': 61, 'Db': 61, 'D': 62, 'D#': 63, 'Eb': 63,
    'E': 64, 'F': 65, 'F#': 66, 'Gb': 66, 'G': 67, 'G#': 56,
    'Ab': 56, 'A': 57, 'A#': 58, 'Bb': 58, 'B': 59
  };
  startMidi = staffIdeal[rootName] || 60;

  return {
    name: rootName + ' ' + scale.name,
    rootName,
    scaleType: scale,
    noteNames: octaveNoteNames,
    pitchClasses,
    tab,
    startMidi,
    intervals,
  };
}

// ── STAFF POSITION HELPERS ──

// Convert a note letter + octave to staff position (0 = C4 / middle C)
function staffPositionFromNote(letter, octave) {
  const letterPos = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
  return (letterPos[letter] || 0) + (octave - 4) * 7;
}

// Get staff positions for an ascending scale (8 notes)
// Returns array of { staffPos, noteName, accidental }
function getScaleStaffPositions(scaleInfo) {
  const positions = [];
  const letterPos = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

  // Determine starting octave from startMidi
  const rootLetter = scaleInfo.noteNames[0].charAt(0);
  const rootAcc = scaleInfo.noteNames[0].slice(1);
  const rootNatural = LETTER_TO_SEMI[rootLetter] || 0;
  let accSemi = 0;
  if (rootAcc === '#') accSemi = 1;
  else if (rootAcc === 'b') accSemi = -1;
  else if (rootAcc === '##') accSemi = 2;
  else if (rootAcc === 'bb') accSemi = -2;
  const rootPitch = rootNatural + accSemi;
  const startOctave = Math.round((scaleInfo.startMidi - rootPitch) / 12) - 1;
  let startStaffPos = (letterPos[rootLetter] || 0) + (startOctave - 4) * 7;

  for (let i = 0; i < scaleInfo.noteNames.length; i++) {
    const fullName = scaleInfo.noteNames[i];
    const letter = fullName.charAt(0);
    const acc = fullName.slice(1);

    // Staff position = root position + scale degree index (ascending by letter)
    const staffPos = startStaffPos + i;

    positions.push({ staffPos, noteName: fullName, letter, accidental: acc });
  }

  return positions;
}
