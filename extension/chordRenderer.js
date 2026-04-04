// chordFriends - Chord Diagram Renderer (Canvas-based)
// Renders fretboard diagrams (guitar/ukulele/banjo/mandolin), piano keyboard, and staff notation

const ChordRenderer = {

  // Colors (black diagrams on white background)
  colors: {
    bg: 'transparent',
    fret: '#333333',
    string: '#333333',
    nut: '#000000',
    dot: '#000000',
    dotText: '#ffffff',
    muted: '#000000',
    open: '#000000',
    label: '#333333',
    barColor: 'rgba(0, 0, 0, 0.75)',
    pianoWhite: '#ffffff',
    pianoBlack: '#222222',
    pianoPressed: '#ff8c00',
    pianoBorder: '#333333',
    pianoBlackPressed: '#ff6600',
    pianoLabel: '#ffffff',
    staffLine: '#333333',
    staffNote: '#000000',
  },

  // String labels per instrument
  stringLabels: {
    guitar: ['E', 'A', 'D', 'G', 'B', 'e'],
    ukulele: ['G', 'C', 'E', 'A'],
    banjo: ['C', 'G', 'D', 'A'],
    mandolin: ['G', 'D', 'A', 'E'],
  },

  // String count per instrument
  stringCounts: { guitar: 6, ukulele: 4, banjo: 4, mandolin: 4 },

  // ── FRETBOARD DIAGRAM (guitar, ukulele, banjo, mandolin) ──
  drawFretted(canvas, chord, instrument) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const stringCount = this.stringCounts[instrument] || 6;
    const fretCount = 5;
    const topPad = h < 160 ? 26 : 36;
    const botPad = h < 160 ? 14 : 22;
    const sidePad = stringCount <= 4 ? 55 : 40;
    const fbW = w - sidePad * 2;
    const fbH = h - topPad - botPad;
    const strSp = fbW / (stringCount - 1);
    const fretSp = fbH / fretCount;

    // Fret number label (if not at nut)
    if (chord.startFret > 1) {
      ctx.fillStyle = this.colors.label;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(chord.startFret + 'fr', sidePad - 8, topPad + fretSp / 2);
    }

    // Nut or top line
    if (chord.startFret <= 1) {
      ctx.fillStyle = this.colors.nut;
      ctx.fillRect(sidePad - 2, topPad - 3, fbW + 4, 6);
    } else {
      ctx.strokeStyle = this.colors.fret;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sidePad, topPad);
      ctx.lineTo(sidePad + fbW, topPad);
      ctx.stroke();
    }

    // Frets
    ctx.strokeStyle = this.colors.fret;
    ctx.lineWidth = 1;
    for (let i = 1; i <= fretCount; i++) {
      const y = topPad + i * fretSp;
      ctx.beginPath();
      ctx.moveTo(sidePad, y);
      ctx.lineTo(sidePad + fbW, y);
      ctx.stroke();
    }

    // Strings (thicker on bass side)
    for (let i = 0; i < stringCount; i++) {
      const x = sidePad + i * strSp;
      ctx.strokeStyle = this.colors.string;
      ctx.lineWidth = stringCount <= 4 ? 1.5 : (1 + (stringCount - 1 - i) * 0.25);
      ctx.beginPath();
      ctx.moveTo(x, topPad);
      ctx.lineTo(x, topPad + fbH);
      ctx.stroke();
    }

    // Barre
    if (chord.barFret !== undefined) {
      const barred = [];
      for (let i = 0; i < stringCount; i++) {
        if (chord.frets[i] === chord.barFret) barred.push(i);
      }
      if (barred.length >= 2) {
        const fretPos = chord.barFret - (chord.startFret > 1 ? chord.startFret : 1) + 1;
        const y = topPad + (fretPos - 0.5) * fretSp;
        const x1 = sidePad + barred[0] * strSp;
        const x2 = sidePad + barred[barred.length - 1] * strSp;
        ctx.fillStyle = this.colors.barColor;
        ctx.beginPath();
        ctx.roundRect(x1 - 6, y - 8, (x2 - x1) + 12, 16, 8);
        ctx.fill();
      }
    }

    // Dots, X, O
    const dotR = stringCount <= 4 ? 11 : 10;
    for (let i = 0; i < stringCount; i++) {
      const x = sidePad + i * strSp;
      const f = chord.frets[i];

      if (f === -1) {
        ctx.fillStyle = this.colors.muted;
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✕', x, topPad - 16);
      } else if (f === 0) {
        ctx.strokeStyle = this.colors.open;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, topPad - 16, 6, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        const adj = f - (chord.startFret > 1 ? chord.startFret - 1 : 0);
        const y = topPad + (adj - 0.5) * fretSp;
        ctx.fillStyle = this.colors.dot;
        ctx.beginPath();
        ctx.arc(x, y, dotR, 0, Math.PI * 2);
        ctx.fill();
        if (chord.fingers && chord.fingers[i] > 0) {
          ctx.fillStyle = this.colors.dotText;
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(chord.fingers[i], x, y);
        }
      }
    }

    // String labels
    const labels = this.stringLabels[instrument] || this.stringLabels.guitar;
    ctx.fillStyle = this.colors.label;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < stringCount; i++) {
      ctx.fillText(labels[i], sidePad + i * strSp, topPad + fbH + 6);
    }
  },

  // ── PIANO KEYBOARD (blue highlighted keys) ──
  drawPiano(canvas, chord) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C2', 'D2', 'E2'];
    const normalizeNote = (n) => {
      const eq = { 'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B' };
      return eq[n] || n;
    };
    const pressedNotes = new Set(chord.notes.map(normalizeNote));
    const displayMap = {};
    chord.notes.forEach(n => { displayMap[normalizeNote(n)] = n; });

    const topPad = 10;
    const keyH = h - topPad - 20;
    const keyW = (w - 30) / whiteNotes.length;
    const bkW = keyW * 0.6;
    const bkH = keyH * 0.6;
    const sx = 15;

    // White keys
    for (let i = 0; i < whiteNotes.length; i++) {
      const x = sx + i * keyW;
      const base = whiteNotes[i].replace('2', '');
      const pressed = pressedNotes.has(base);
      ctx.fillStyle = pressed ? this.colors.pianoPressed : this.colors.pianoWhite;
      ctx.strokeStyle = this.colors.pianoBorder;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, topPad, keyW - 2, keyH, [0, 0, 4, 4]);
      ctx.fill();
      ctx.stroke();

      if (pressed) {
        ctx.fillStyle = this.colors.pianoLabel;
        ctx.font = 'bold 14px sans-serif';
      } else {
        ctx.fillStyle = '#999';
        ctx.font = '10px sans-serif';
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(base, x + (keyW - 2) / 2, topPad + keyH - 6);
    }

    // Black keys
    const bkPos = [0, 1, 3, 4, 5, 7, 8];
    const bkNames = ['C#', 'D#', 'F#', 'G#', 'A#', 'C#', 'D#'];
    for (let i = 0; i < bkPos.length; i++) {
      if (bkPos[i] >= whiteNotes.length - 1) continue;
      const x = sx + (bkPos[i] + 1) * keyW - bkW / 2 - 1;
      const pressed = pressedNotes.has(bkNames[i]);
      ctx.fillStyle = pressed ? this.colors.pianoBlackPressed : this.colors.pianoBlack;
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, topPad, bkW, bkH, [0, 0, 3, 3]);
      ctx.fill();
      ctx.stroke();

      if (pressed) {
        ctx.fillStyle = this.colors.pianoLabel;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(displayMap[bkNames[i]] || bkNames[i], x + bkW / 2, topPad + bkH - 4);
      }
    }
  },

  // ── STAFF NOTATION ──
  drawStaff(canvas, chord, instrument) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Get notes for this chord
    let notes;
    if (instrument === 'piano') {
      notes = chord.notes;
    } else {
      const pc = CHORD_DATA.piano.find(c => c.symbol === chord.symbol);
      notes = pc ? pc.notes : ['C', 'E', 'G'];
    }

    // Staff geometry
    const staffTop = h <= 150 ? 30 : 50;
    const lineGap = h <= 150 ? 12 : 14;
    const staffH = lineGap * 4;

    // Draw 5 staff lines
    ctx.strokeStyle = this.colors.staffLine;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 5; i++) {
      const y = staffTop + i * lineGap;
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(w - 30, y);
      ctx.stroke();
    }

    // Treble clef
    ctx.fillStyle = this.colors.staffNote;
    ctx.font = '62px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('𝄞', 52, staffTop + staffH / 2 + 4);

    // Note positions on treble clef (bottom line E4 = pos 0)
    const notePos = { 'C': -2, 'D': -1, 'E': 0, 'F': 1, 'G': 2, 'A': 3, 'B': 4 };

    const parseNote = (n) => {
      const base = n.charAt(0).toUpperCase();
      const acc = n.length > 1 ? n.substring(1) : '';
      return { base, acc };
    };

    const posToY = (pos) => staffTop + 4 * lineGap - pos * (lineGap / 2);

    const noteX = w / 2 + 14;
    const noteRx = 8;
    const noteRy = 6;

    // Parse and sort notes
    const parsed = notes.map(n => {
      const { base, acc } = parseNote(n);
      const pos = notePos[base] !== undefined ? notePos[base] : 0;
      return { name: n, base, acc, pos };
    });
    parsed.sort((a, b) => a.pos - b.pos);
    for (let i = 1; i < parsed.length; i++) {
      while (parsed[i].pos <= parsed[i - 1].pos) {
        parsed[i].pos += 7;
      }
    }

    // Draw notes
    for (const note of parsed) {
      const y = posToY(note.pos);

      // Ledger lines below staff
      if (note.pos < 0) {
        ctx.strokeStyle = this.colors.staffLine;
        ctx.lineWidth = 1.2;
        for (let lp = -2; lp >= note.pos; lp -= 2) {
          const ly = posToY(lp);
          ctx.beginPath();
          ctx.moveTo(noteX - 14, ly);
          ctx.lineTo(noteX + 14, ly);
          ctx.stroke();
        }
      }
      // Ledger lines above staff
      if (note.pos > 8) {
        ctx.strokeStyle = this.colors.staffLine;
        ctx.lineWidth = 1.2;
        for (let lp = 10; lp <= note.pos; lp += 2) {
          const ly = posToY(lp);
          ctx.beginPath();
          ctx.moveTo(noteX - 14, ly);
          ctx.lineTo(noteX + 14, ly);
          ctx.stroke();
        }
      }

      // Note head (filled oval)
      ctx.fillStyle = this.colors.staffNote;
      ctx.beginPath();
      ctx.ellipse(noteX, y, noteRx, noteRy, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Accidental
      if (note.acc) {
        ctx.fillStyle = this.colors.staffNote;
        ctx.font = 'bold 16px serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        let sym = '';
        if (note.acc === '#') sym = '♯';
        else if (note.acc === 'b') sym = '♭';
        ctx.fillText(sym, noteX - noteRx - 4, y);
      }
    }

    // Stem
    if (parsed.length > 0) {
      const topNote = parsed[parsed.length - 1];
      const botNote = parsed[0];
      const stemX = noteX + noteRx - 1;
      ctx.strokeStyle = this.colors.staffNote;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(stemX, posToY(botNote.pos));
      ctx.lineTo(stemX, posToY(topNote.pos) - 30);
      ctx.stroke();
    }
  },

  // ── MAIN RENDER ──
  render(canvas, chord, instrument, mode) {
    if (mode === 'staff') {
      this.drawStaff(canvas, chord, instrument);
    } else if (instrument === 'piano') {
      this.drawPiano(canvas, chord);
    } else {
      this.drawFretted(canvas, chord, instrument);
    }
  },

  // ══════════════════════════════════════════════════
  //  SCALE RENDERING METHODS
  // ══════════════════════════════════════════════════

  // ── SCALE STAFF NOTATION ──
  // Draws ascending scale notes on treble clef, left to right
  drawScaleStaff(canvas, scaleInfo) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const positions = getScaleStaffPositions(scaleInfo);
    if (!positions.length) return;

    // Staff geometry — responsive to canvas width
    const compact = w < 300;
    const staffTop = compact ? 25 : 35;
    const lineGap = compact ? 10 : 12;
    const clefWidth = compact ? 28 : 40;
    const leftMargin = compact ? 10 : 20;
    const rightMargin = compact ? 8 : 15;

    // Bottom line = E4 = staffPos 2
    const bottomLineY = staffTop + 4 * lineGap;

    const posToY = (staffPos) => bottomLineY - (staffPos - 2) * (lineGap / 2);

    // Draw 5 staff lines
    ctx.strokeStyle = this.colors.staffLine;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 5; i++) {
      const y = staffTop + i * lineGap;
      ctx.beginPath();
      ctx.moveTo(leftMargin, y);
      ctx.lineTo(w - rightMargin, y);
      ctx.stroke();
    }

    // Treble clef
    ctx.fillStyle = this.colors.staffNote;
    ctx.font = compact ? '40px serif' : '52px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u{1D11E}', leftMargin + clefWidth / 2 + (compact ? 2 : 5), staffTop + lineGap * 2 + (compact ? 2 : 4));

    // Note spacing
    const noteAreaLeft = leftMargin + clefWidth + (compact ? 4 : 10);
    const noteAreaWidth = w - noteAreaLeft - rightMargin;
    const noteSpacing = noteAreaWidth / (positions.length - 1 || 1);

    const noteRx = compact ? 5.5 : 7;
    const noteRy = compact ? 4 : 5;

    // Draw each note
    for (let i = 0; i < positions.length; i++) {
      const note = positions[i];
      const x = noteAreaLeft + i * noteSpacing;
      const y = posToY(note.staffPos);

      // Ledger lines below staff (staffPos < 2, even positions)
      if (note.staffPos < 2) {
        ctx.strokeStyle = this.colors.staffLine;
        ctx.lineWidth = 1.2;
        for (let lp = 0; lp >= note.staffPos; lp -= 2) {
          const ly = posToY(lp);
          ctx.beginPath();
          ctx.moveTo(x - (compact ? 9 : 12), ly);
          ctx.lineTo(x + (compact ? 9 : 12), ly);
          ctx.stroke();
        }
      }

      // Ledger lines above staff (staffPos > 10, even positions)
      if (note.staffPos > 10) {
        ctx.strokeStyle = this.colors.staffLine;
        ctx.lineWidth = 1.2;
        for (let lp = 12; lp <= note.staffPos; lp += 2) {
          const ly = posToY(lp);
          ctx.beginPath();
          ctx.moveTo(x - (compact ? 9 : 12), ly);
          ctx.lineTo(x + (compact ? 9 : 12), ly);
          ctx.stroke();
        }
      }

      // Note head (filled oval)
      ctx.fillStyle = this.colors.staffNote;
      ctx.beginPath();
      ctx.ellipse(x, y, noteRx, noteRy, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Accidental
      if (note.accidental) {
        ctx.fillStyle = this.colors.staffNote;
        ctx.font = compact ? 'bold 11px serif' : 'bold 14px serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        let sym = '';
        if (note.accidental === '#') sym = '\u266F';
        else if (note.accidental === 'b') sym = '\u266D';
        else if (note.accidental === '##') sym = '\uD834\uDD2A';
        else if (note.accidental === 'bb') sym = '\u{1D12B}';
        ctx.fillText(sym, x - noteRx - (compact ? 1 : 3), y);
      }

      // Note name below staff
      ctx.fillStyle = this.colors.label;
      ctx.font = compact ? '8px sans-serif' : '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(note.noteName, x, bottomLineY + lineGap + (compact ? 4 : 8));
    }
  },

  // ── SCALE TABLATURE ──
  // Draws standard tablature notation for fretted instruments
  drawScaleTab(canvas, scaleInfo, instrument) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const tab = scaleInfo.tab;
    if (!tab || !tab.length) return;

    const tuning = SCALE_TUNINGS[instrument];
    if (!tuning) return;

    const numStrings = tuning.midi.length;
    const stringNames = tuning.strings;

    // Layout
    const topPad = 15;
    const botPad = 30;
    const leftMargin = 40;
    const rightMargin = 15;
    const lineSpacing = (h - topPad - botPad) / (numStrings - 1);

    // Tab lines are drawn highest-pitched string on top, lowest on bottom
    // String index 0 = lowest pitch. In display: bottom line = string 0, top line = string N-1
    const stringY = (strIdx) => topPad + (numStrings - 1 - strIdx) * lineSpacing;

    // Draw "TAB" vertically on the left
    ctx.fillStyle = this.colors.label;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const tabCenterY = topPad + (numStrings - 1) * lineSpacing / 2;
    ctx.fillText('T', leftMargin / 2, tabCenterY - 16);
    ctx.fillText('A', leftMargin / 2, tabCenterY);
    ctx.fillText('B', leftMargin / 2, tabCenterY + 16);

    // Draw string lines
    ctx.strokeStyle = this.colors.staffLine;
    ctx.lineWidth = 1;
    for (let i = 0; i < numStrings; i++) {
      const y = stringY(i);
      ctx.beginPath();
      ctx.moveTo(leftMargin, y);
      ctx.lineTo(w - rightMargin, y);
      ctx.stroke();
    }

    // String labels on the right
    ctx.fillStyle = this.colors.label;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < numStrings; i++) {
      ctx.fillText(stringNames[i], w - rightMargin + 3, stringY(i));
    }

    // Note spacing
    const noteAreaLeft = leftMargin + 15;
    const noteAreaWidth = w - noteAreaLeft - rightMargin - 15;
    const noteSpacing = noteAreaWidth / (tab.length - 1 || 1);

    // Draw fret numbers
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < tab.length; i++) {
      const x = noteAreaLeft + i * noteSpacing;
      const y = stringY(tab[i].string);
      const fretStr = String(tab[i].fret);

      // White background behind number (to break the string line)
      const textW = ctx.measureText(fretStr).width + 6;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - textW / 2, y - 8, textW, 16);

      // Fret number
      ctx.fillStyle = this.colors.staffNote;
      ctx.fillText(fretStr, x, y);
    }

    // Note names below tab
    ctx.fillStyle = this.colors.label;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const labelY = topPad + (numStrings - 1) * lineSpacing + 12;
    for (let i = 0; i < scaleInfo.noteNames.length && i < tab.length; i++) {
      const x = noteAreaLeft + i * noteSpacing;
      ctx.fillText(scaleInfo.noteNames[i], x, labelY);
    }
  },

  // ── SCALE PIANO (orange highlighted keys) ──
  // Draws a piano keyboard spanning two octaves with scale notes in orange
  drawScalePiano(canvas, scaleInfo) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Which pitch classes are in this scale
    const scalePCs = new Set(scaleInfo.pitchClasses);

    // Build note name display map: pitchClass -> display name
    const pcToName = {};
    for (let i = 0; i < scaleInfo.noteNames.length - 1; i++) {
      const pc = scaleInfo.pitchClasses[i];
      pcToName[pc] = scaleInfo.noteNames[i];
    }

    // Draw two octaves of piano keyboard
    // White key layout: C D E F G A B (repeat)
    const whiteKeyNotes = [0, 2, 4, 5, 7, 9, 11]; // pitch classes
    const whiteKeyLetters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const numWhiteKeys = 15; // ~2 octaves + 1

    const topPad = 10;
    const keyH = h - topPad - 28;
    const keyW = (w - 30) / numWhiteKeys;
    const bkW = keyW * 0.6;
    const bkH = keyH * 0.6;
    const sx = 15;

    const scaleOrange = '#ff8c00';
    const scaleOrangeDark = '#ff6600';

    // White keys
    for (let i = 0; i < numWhiteKeys; i++) {
      const x = sx + i * keyW;
      const pc = whiteKeyNotes[i % 7];
      const inScale = scalePCs.has(pc);

      ctx.fillStyle = inScale ? scaleOrange : '#ffffff';
      ctx.strokeStyle = this.colors.pianoBorder;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, topPad, keyW - 2, keyH, [0, 0, 4, 4]);
      ctx.fill();
      ctx.stroke();

      // Label
      const letter = whiteKeyLetters[i % 7];
      if (inScale) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
      } else {
        ctx.fillStyle = '#bbb';
        ctx.font = '9px sans-serif';
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      const displayName = inScale ? (pcToName[pc] || letter) : letter;
      ctx.fillText(displayName, x + (keyW - 2) / 2, topPad + keyH - 5);
    }

    // Black keys
    // Black keys appear after white keys: C#(after C), D#(after D), F#(after F), G#(after G), A#(after A)
    const blackAfter = [0, 1, 3, 4, 5]; // indices within each octave group of 7 white keys
    const blackPCs = [1, 3, 6, 8, 10];

    for (let oct = 0; oct < 2; oct++) {
      for (let b = 0; b < blackAfter.length; b++) {
        const whiteIdx = oct * 7 + blackAfter[b];
        if (whiteIdx >= numWhiteKeys - 1) continue;
        const x = sx + (whiteIdx + 1) * keyW - bkW / 2 - 1;
        const pc = blackPCs[b];
        const inScale = scalePCs.has(pc);

        ctx.fillStyle = inScale ? scaleOrangeDark : this.colors.pianoBlack;
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x, topPad, bkW, bkH, [0, 0, 3, 3]);
        ctx.fill();
        ctx.stroke();

        if (inScale) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          const displayName = pcToName[pc] || '';
          ctx.fillText(displayName, x + bkW / 2, topPad + bkH - 4);
        }
      }
    }
  },

  // ── SCALE RENDER (convenience) ──
  // mode: 'staff', 'tab', 'piano'
  renderScale(canvas, scaleInfo, instrument, mode) {
    if (mode === 'staff') {
      this.drawScaleStaff(canvas, scaleInfo);
    } else if (mode === 'tab' || (mode === 'piano' && instrument !== 'piano')) {
      this.drawScaleTab(canvas, scaleInfo, instrument);
    } else {
      this.drawScalePiano(canvas, scaleInfo);
    }
  }
};
