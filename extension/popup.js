// chordFriends - Popup Logic

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('chordCanvas');
  const staffCanvas = document.getElementById('staffCanvas');
  const chordNameEl = document.getElementById('chordName');
  const chordSymbolEl = document.getElementById('chordSymbol');
  const instrumentPanels = document.getElementById('instrumentPanels');
  const dayCountEl = document.getElementById('dayCount');
  const dateDisplayEl = document.getElementById('dateDisplay');
  const tabs = document.querySelectorAll('.tab');
  const viewBtns = document.querySelectorAll('.view-btn');
  const allChordsBtn = document.getElementById('allChordsBtn');
  const chordDropdown = document.getElementById('chordDropdown');
  const chordChartBtn = document.getElementById('chordChartBtn');
  const chartDropdown = document.getElementById('chartDropdown');
  const chartOverlay = document.getElementById('chartOverlay');
  const chartTitle = document.getElementById('chartTitle');
  const chartGrid = document.getElementById('chartGrid');
  const chartClose = document.getElementById('chartClose');
  const difficultyBtn = document.getElementById('difficultyBtn');
  const difficultyMenu = document.getElementById('difficultyMenu');
  const diffItems = difficultyMenu.querySelectorAll('.dropdown-item');
  const contentBtn = document.getElementById('contentBtn');
  const randomToggle = document.getElementById('randomToggle');

  const EPOCH = new Date(2026, 3, 2);

  let currentInstrument = 'guitar';
  let selectedInstruments = ['guitar'];
  let currentMode = 'diagram';
  let currentDifficulty = 'progressive'; // 'Easy → Hard' is default
  let currentContent = 'chords'; // 'chords', 'scales', 'both'
  let randomOn = false;
  let selectedChordIndex = null; // null = daily chord
  let selectedScaleIndex = null; // null = daily scale

  // Classify chord difficulty from its symbol
  function getChordDifficulty(chord) {
    const sym = chord.symbol;
    // Simple major (single letter, possibly with #/b) or simple minor (Am, Bm, etc.)
    if (/^[A-G][b#]?$/.test(sym) || /^[A-G][b#]?m$/.test(sym)) return 1;
    // Dominant 7ths
    if (/^[A-G][b#]?7$/.test(sym)) return 2;
    // Everything else (maj7, m7, sus, dim, aug, add9, etc.)
    return 3;
  }

  // Get chords filtered/sorted by difficulty mode
  function getChordsForMode(instrument) {
    const inst = instrument || currentInstrument;
    const chords = CHORD_DATA[inst];
    if (currentDifficulty === 'progressive') {
      // Sort easy → hard
      return [...chords].sort((a, b) => getChordDifficulty(a) - getChordDifficulty(b));
    } else if (currentDifficulty === 'easy') {
      // Only difficulty 1 (plain major/minor)
      return chords.filter(c => getChordDifficulty(c) <= 1);
    } else if (currentDifficulty === 'advanced') {
      // Only difficulty 2+ (exclude plain major/minor)
      return chords.filter(c => getChordDifficulty(c) >= 2);
    }
    // 'random' — original order, day-based index
    return chords;
  }

  function getDayNumber() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = Math.floor((today - EPOCH) / (1000 * 60 * 60 * 24));
    return Math.max(diff + 1, 1);
  }

  function getTodayFormatted() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  }

  function getCurrentChord(instrument) {
    const inst = instrument || currentInstrument;
    const chords = getChordsForMode(inst);
    if (selectedChordIndex !== null) {
      return CHORD_DATA[inst][selectedChordIndex];
    }
    const dayNum = getDayNumber();
    const index = (dayNum - 1) % chords.length;
    return chords[index];
  }

  // ── Scale selection (cycles through root notes × scale types by day) ──
  function getCurrentScaleInfo(instrument) {
    const inst = instrument || currentInstrument;
    if (selectedScaleIndex !== null) {
      const scaleTypeIdx = Math.floor(selectedScaleIndex / ROOT_NOTES.length);
      const rootIdx = selectedScaleIndex % ROOT_NOTES.length;
      const st = SCALE_TYPES[scaleTypeIdx] || SCALE_TYPES[0];
      const root = ROOT_NOTES[rootIdx] || ROOT_NOTES[0];
      return getScaleInfo(st.id, root.name, inst);
    }
    const dayNum = getDayNumber();
    const totalScales = ROOT_NOTES.length * SCALE_TYPES.length;
    const index = (dayNum - 1) % totalScales;
    const scaleTypeIdx = Math.floor(index / ROOT_NOTES.length);
    const rootIdx = index % ROOT_NOTES.length;
    return getScaleInfo(SCALE_TYPES[scaleTypeIdx].id, ROOT_NOTES[rootIdx].name, inst);
  }

  // Should we show a scale today? In 'both' mode, alternate days
  function shouldShowScale() {
    if (currentContent === 'scales') return true;
    if (currentContent === 'chords') return false;
    // 'both' — even days = chord, odd days = scale
    return getDayNumber() % 2 === 0;
  }

  // Track what's currently displayed so premium buttons know what to do
  let currentlyShowingScale = false;

  function renderChord() {
    // Clear panels
    instrumentPanels.innerHTML = '';

    // When random is on with multiple instruments, pick just one
    const instrumentsToShow = (randomOn && selectedInstruments.length > 1)
      ? [selectedInstruments[Math.floor(Math.random() * selectedInstruments.length)]]
      : selectedInstruments;

    const showScale = shouldShowScale();
    currentlyShowingScale = showScale;

    if (showScale) {
      const info = getCurrentScaleInfo(instrumentsToShow[0]);
      if (info) {
        chordNameEl.textContent = info.name;
        chordSymbolEl.textContent = info.noteNames.slice(0, -1).join(' – ');
        chordSymbolEl.classList.add('scale-notes');
      }
      hearChordBtn.innerHTML = '🔊 Hear Scale <span class="premium-badge">★ Premium</span>';
      hearSongBtn.innerHTML = '🎵 Hear in Song <span class="premium-badge">★ Premium</span>';

      instrumentsToShow.forEach(inst => {
        renderScalePanel(inst);
      });
    } else {
      const chord = getCurrentChord(instrumentsToShow[0]);
      chordNameEl.textContent = chord.name;
      chordSymbolEl.textContent = chord.symbol;
      chordSymbolEl.classList.remove('scale-notes');
      hearChordBtn.innerHTML = '🔊 Hear Chord <span class="premium-badge">★ Premium</span>';
      hearSongBtn.innerHTML = '🎵 Hear in Song <span class="premium-badge">★ Premium</span>';

      instrumentsToShow.forEach(inst => {
        renderChordPanel(inst);
      });
    }

    dayCountEl.textContent = (selectedChordIndex !== null || selectedScaleIndex !== null) ? 'Browse' : 'Day ' + getDayNumber();
    dateDisplayEl.textContent = getTodayFormatted();
  }

  function renderChordPanel(instrument) {
    const chord = getCurrentChord(instrument);
    const panel = document.createElement('div');
    panel.className = 'instrument-panel';

    // Show label when multiple instruments selected
    if (selectedInstruments.length > 1) {
      const label = document.createElement('div');
      label.className = 'instrument-panel-label';
      label.textContent = instrumentNames[instrument] || instrument;
      panel.appendChild(label);
    }

    const canvas = document.createElement('canvas');

    if (currentMode === 'staff') {
      canvas.width = 200;
      canvas.height = 140;
      panel.appendChild(canvas);
      ChordRenderer.render(canvas, chord, instrument, 'staff');
    } else if (currentMode === 'both') {
      if (instrument === 'piano') {
        canvas.width = 200;
        canvas.height = 100;
      } else {
        canvas.width = 180;
        canvas.height = 120;
      }
      panel.appendChild(canvas);
      ChordRenderer.render(canvas, chord, instrument, 'diagram');

      const staffC = document.createElement('canvas');
      staffC.width = 180;
      staffC.height = 100;
      panel.appendChild(staffC);
      ChordRenderer.render(staffC, chord, instrument, 'staff');
    } else {
      if (instrument === 'piano') {
        canvas.width = 240;
        canvas.height = 140;
      } else {
        canvas.width = 200;
        canvas.height = 190;
      }
      panel.appendChild(canvas);
      ChordRenderer.render(canvas, chord, instrument, 'diagram');
    }

    instrumentPanels.appendChild(panel);
  }

  function renderScalePanel(instrument) {
    const info = getCurrentScaleInfo(instrument);
    if (!info) return;

    const panel = document.createElement('div');
    panel.className = 'instrument-panel';

    if (selectedInstruments.length > 1) {
      const label = document.createElement('div');
      label.className = 'instrument-panel-label';
      label.textContent = instrumentNames[instrument] || instrument;
      panel.appendChild(label);
    }

    const showTab = currentMode === 'diagram' || currentMode === 'both';
    const showStaff = currentMode === 'staff' || currentMode === 'both';

    if (instrument === 'piano') {
      if (showTab) {
        const canvas = document.createElement('canvas');
        canvas.width = 240;
        canvas.height = 130;
        panel.appendChild(canvas);
        ChordRenderer.drawScalePiano(canvas, info);
      }
      if (showStaff) {
        const staffC = document.createElement('canvas');
        staffC.width = 240;
        staffC.height = 110;
        panel.appendChild(staffC);
        ChordRenderer.drawScaleStaff(staffC, info);
      }
    } else {
      const numStrings = SCALE_TUNINGS[instrument].midi.length;
      if (showTab) {
        const canvas = document.createElement('canvas');
        canvas.width = 220;
        canvas.height = numStrings === 6 ? 140 : 110;
        panel.appendChild(canvas);
        ChordRenderer.drawScaleTab(canvas, info, instrument);
      }
      if (showStaff) {
        const staffC = document.createElement('canvas');
        staffC.width = 220;
        staffC.height = 110;
        panel.appendChild(staffC);
        ChordRenderer.drawScaleStaff(staffC, info);
      }
    }

    instrumentPanels.appendChild(panel);
  }

  // ── Populate chord/scale dropdown for current instrument ──
  function populateDropdown() {
    const chords = CHORD_DATA[currentInstrument];
    chordDropdown.innerHTML = '';

    // Scales section first
    const scaleHeader = document.createElement('option');
    scaleHeader.disabled = true;
    scaleHeader.textContent = '── Scales ──';
    chordDropdown.appendChild(scaleHeader);

    SCALE_TYPES.forEach((st, i) => {
      const opt = document.createElement('option');
      opt.value = 'scale_' + i;
      opt.textContent = st.name;
      chordDropdown.appendChild(opt);
    });

    // Chords section
    const chordHeader = document.createElement('option');
    chordHeader.disabled = true;
    chordHeader.textContent = '── Chords ──';
    chordDropdown.appendChild(chordHeader);

    chords.forEach((chord, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = chord.symbol + ' — ' + chord.name;
      chordDropdown.appendChild(opt);
    });
  }

  // ── All Chords dropdown toggle ──
  allChordsBtn.addEventListener('click', () => {
    const isOpen = chordDropdown.style.display !== 'none';
    if (isOpen) {
      chordDropdown.style.display = 'none';
    } else {
      populateDropdown();
      chordDropdown.style.display = 'block';
      chordDropdown.size = Math.min(CHORD_DATA[currentInstrument].length + SCALE_TYPES.length + 2, 14);
      chordDropdown.focus();
    }
  });

  chordDropdown.addEventListener('change', () => {
    const val = chordDropdown.value;
    chordDropdown.style.display = 'none';
    if (val.startsWith('scale_')) {
      const scaleIdx = parseInt(val.replace('scale_', ''), 10);
      // Set content to scales and render that scale type with current root
      selectedScaleIndex = scaleIdx * ROOT_NOTES.length; // first root of that type
      selectedChordIndex = null;
      currentContent = 'scales';
      updateContentLabels();
      chrome.storage.local.set({ contentMode: 'scales' });
      renderChord();
    } else {
      selectedChordIndex = parseInt(val, 10);
      selectedScaleIndex = null;
      if (currentContent === 'scales') {
        currentContent = 'chords';
        updateContentLabels();
        chrome.storage.local.set({ contentMode: 'chords' });
      }
      renderChord();
    }
  });

  chordDropdown.addEventListener('blur', () => {
    setTimeout(() => { chordDropdown.style.display = 'none'; }, 150);
  });

  // ── Instrument display names ──
  const instrumentNames = {
    guitar: 'Guitar', piano: 'Piano', ukulele: 'Ukulele',
    banjo: 'Banjo', mandolin: 'Mandolin'
  };

  // ── Chord/Scale Charts dropdown ──
  function populateChartDropdown() {
    chartDropdown.innerHTML = '';

    // Scales section first
    const scaleHeader = document.createElement('option');
    scaleHeader.disabled = true;
    scaleHeader.textContent = '── Scale Charts ──';
    chartDropdown.appendChild(scaleHeader);

    SCALE_TYPES.forEach((st, i) => {
      const opt = document.createElement('option');
      opt.value = 'scale_' + i;
      opt.textContent = st.name;
      chartDropdown.appendChild(opt);
    });

    // Chord chart options
    const chordHeader = document.createElement('option');
    chordHeader.disabled = true;
    chordHeader.textContent = '── Chord Charts ──';
    chartDropdown.appendChild(chordHeader);

    const chordOpt = document.createElement('option');
    chordOpt.value = 'all_chords';
    chordOpt.textContent = 'All Chords';
    chartDropdown.appendChild(chordOpt);

    // Individual key options
    const keyNames = ['C', 'C# / Db', 'D', 'Eb / D#', 'E', 'F', 'F# / Gb', 'G', 'Ab / G#', 'A', 'Bb / A#', 'B'];
    const keyRoots = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
    keyRoots.forEach((root, i) => {
      const opt = document.createElement('option');
      opt.value = 'key_' + root;
      opt.textContent = keyNames[i] + ' Chords';
      chartDropdown.appendChild(opt);
    });
  }

  chordChartBtn.addEventListener('click', () => {
    const isOpen = chartDropdown.style.display !== 'none';
    if (isOpen) {
      chartDropdown.style.display = 'none';
    } else {
      populateChartDropdown();
      chartDropdown.style.display = 'block';
      chartDropdown.size = Math.min(SCALE_TYPES.length + 16, 18);
      chartDropdown.focus();
    }
  });

  chartDropdown.addEventListener('change', () => {
    const val = chartDropdown.value;
    chartDropdown.style.display = 'none';

    if (val === 'all_chords') {
      showChordChart();
    } else if (val.startsWith('key_')) {
      const root = val.replace('key_', '');
      showChordChartForKey(root);
    } else if (val.startsWith('scale_')) {
      const scaleIdx = parseInt(val.replace('scale_', ''), 10);
      showScaleChart(SCALE_TYPES[scaleIdx]);
    }
  });

  chartDropdown.addEventListener('blur', () => {
    setTimeout(() => { chartDropdown.style.display = 'none'; }, 150);
  });

  function showScaleChart(scaleType) {
    chartTitle.textContent = instrumentNames[currentInstrument] + ' — ' + scaleType.name + ' Scales';
    chartGrid.innerHTML = '';
    chartGrid.style.gridTemplateColumns = '1fr';

    ROOT_NOTES.forEach((root) => {
      const info = getScaleInfo(scaleType.id, root.name, currentInstrument);
      if (!info) return;

      const card = document.createElement('div');
      card.className = 'chart-card';

      const name = document.createElement('div');
      name.className = 'chart-card-name';
      name.textContent = info.name;

      const notes = document.createElement('div');
      notes.className = 'chart-card-symbol';
      notes.textContent = info.noteNames.join(' – ');

      card.appendChild(name);
      card.appendChild(notes);

      // Staff canvas
      const staffC = document.createElement('canvas');
      staffC.width = 280;
      staffC.height = 110;
      card.appendChild(staffC);
      ChordRenderer.drawScaleStaff(staffC, info);

      // Tab or piano canvas
      const tabC = document.createElement('canvas');
      if (currentInstrument === 'piano') {
        tabC.width = 280;
        tabC.height = 110;
        ChordRenderer.drawScalePiano(tabC, info);
      } else {
        const numStrings = SCALE_TUNINGS[currentInstrument].midi.length;
        tabC.width = 280;
        tabC.height = numStrings === 6 ? 140 : 110;
        ChordRenderer.drawScaleTab(tabC, info, currentInstrument);
      }
      card.appendChild(tabC);

      chartGrid.appendChild(card);
    });

    chartOverlay.style.display = 'block';
  }

  function showChordChart() {
    chartTitle.textContent = instrumentNames[currentInstrument] + ' Chord Chart';
    chartGrid.innerHTML = '';
    chartGrid.style.gridTemplateColumns = currentInstrument === 'piano' ? 'repeat(2, 1fr)' : '1fr';
    const chords = CHORD_DATA[currentInstrument];

    chords.forEach((chord, i) => {
      const card = document.createElement('div');
      card.className = 'chart-card';
      card.style.cursor = 'pointer';

      const name = document.createElement('div');
      name.className = 'chart-card-name';
      name.textContent = chord.name;

      const sym = document.createElement('div');
      sym.className = 'chart-card-symbol';
      sym.textContent = chord.symbol;

      const miniCanvas = document.createElement('canvas');
      if (currentInstrument === 'piano') {
        miniCanvas.width = 280;
        miniCanvas.height = 200;
      } else {
        miniCanvas.width = 240;
        miniCanvas.height = 280;
      }

      card.appendChild(name);
      card.appendChild(sym);
      card.appendChild(miniCanvas);
      chartGrid.appendChild(card);

      ChordRenderer.render(miniCanvas, chord, currentInstrument, 'diagram');

      // Click a card to select that chord
      card.addEventListener('click', () => {
        selectedChordIndex = i;
        chartOverlay.style.display = 'none';
        renderChord();
      });
    });

    chartOverlay.style.display = 'block';
  }

  function showChordChartForKey(root) {
    const normalizeRoot = (symbol) => {
      const match = symbol.match(/^([A-G][b#]?)/);
      return match ? match[1] : '';
    };
    // Also match enharmonic equivalents
    const enharmonic = {
      'C#': 'Db', 'Db': 'C#', 'D#': 'Eb', 'Eb': 'D#',
      'F#': 'Gb', 'Gb': 'F#', 'G#': 'Ab', 'Ab': 'G#',
      'A#': 'Bb', 'Bb': 'A#'
    };
    const altRoot = enharmonic[root] || null;

    const chords = CHORD_DATA[currentInstrument];
    const filtered = chords.map((c, i) => ({ chord: c, idx: i }))
      .filter(({ chord }) => {
        const r = normalizeRoot(chord.symbol);
        return r === root || (altRoot && r === altRoot);
      });

    chartTitle.textContent = instrumentNames[currentInstrument] + ' — ' + root + ' Chords';
    chartGrid.innerHTML = '';
    chartGrid.style.gridTemplateColumns = currentInstrument === 'piano' ? 'repeat(2, 1fr)' : '1fr';

    filtered.forEach(({ chord, idx }) => {
      const card = document.createElement('div');
      card.className = 'chart-card';
      card.style.cursor = 'pointer';

      const name = document.createElement('div');
      name.className = 'chart-card-name';
      name.textContent = chord.name;

      const sym = document.createElement('div');
      sym.className = 'chart-card-symbol';
      sym.textContent = chord.symbol;

      const miniCanvas = document.createElement('canvas');
      if (currentInstrument === 'piano') {
        miniCanvas.width = 280;
        miniCanvas.height = 200;
      } else {
        miniCanvas.width = 240;
        miniCanvas.height = 280;
      }

      card.appendChild(name);
      card.appendChild(sym);
      card.appendChild(miniCanvas);
      chartGrid.appendChild(card);

      ChordRenderer.render(miniCanvas, chord, currentInstrument, 'diagram');

      card.addEventListener('click', () => {
        selectedChordIndex = idx;
        chartOverlay.style.display = 'none';
        renderChord();
      });
    });

    chartOverlay.style.display = 'block';
  }

  chartClose.addEventListener('click', () => {
    chartOverlay.style.display = 'none';
  });

  // ── Instrument tab switching ──
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const inst = tab.dataset.instrument;
      if (isPremium) {
        // Premium: toggle instruments on/off (must keep at least one)
        if (tab.classList.contains('active')) {
          if (selectedInstruments.length > 1) {
            selectedInstruments = selectedInstruments.filter(i => i !== inst);
            tab.classList.remove('active');
          }
        } else {
          selectedInstruments.push(inst);
          tab.classList.add('active');
        }
      } else {
        // Free: only one instrument at a time, but any instrument
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        selectedInstruments = [inst];
        currentInstrument = inst;
      }
      currentInstrument = selectedInstruments[0];
      selectedChordIndex = null;
      selectedScaleIndex = null;
      chrome.storage.local.set({ instruments: selectedInstruments });
      renderChord();
    });
  });

  // ── View mode toggle ──
  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mode;
      chrome.storage.local.set({ viewMode: currentMode });
      renderChord();
    });
  });

  // ── Difficulty dropdown ──
  diffItems.forEach(item => {
    item.addEventListener('click', () => {
      diffItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      currentDifficulty = item.dataset.difficulty;
      difficultyBtn.textContent = item.textContent;
      difficultyBtn.classList.add('active');
      selectedChordIndex = null;
      chrome.storage.local.set({ difficulty: currentDifficulty });
      renderChord();
    });
  });

  // ── Content mode toggle (Chords/Scales) ── cycles: chords → scales → both → chords
  const contentChordsLabel = document.getElementById('contentChords');
  const contentScalesLabel = document.getElementById('contentScales');

  function updateContentLabels() {
    if (currentContent === 'chords') {
      contentChordsLabel.classList.add('content-active');
      contentChordsLabel.classList.remove('content-dim');
      contentScalesLabel.classList.add('content-dim');
      contentScalesLabel.classList.remove('content-active');
    } else if (currentContent === 'scales') {
      contentScalesLabel.classList.add('content-active');
      contentScalesLabel.classList.remove('content-dim');
      contentChordsLabel.classList.add('content-dim');
      contentChordsLabel.classList.remove('content-active');
    } else {
      // 'both' — both bright
      contentChordsLabel.classList.add('content-active');
      contentChordsLabel.classList.remove('content-dim');
      contentScalesLabel.classList.add('content-active');
      contentScalesLabel.classList.remove('content-dim');
    }
  }

  contentBtn.addEventListener('click', () => {
    if (currentContent === 'chords') {
      currentContent = 'scales';
    } else if (currentContent === 'scales') {
      currentContent = 'both';
    } else {
      currentContent = 'chords';
    }
    updateContentLabels();
    selectedChordIndex = null;
    selectedScaleIndex = null;
    chrome.storage.local.set({ contentMode: currentContent });
    renderChord();
  });

  // ── Random toggle (on/off, just sets the mode for future days) ──
  randomToggle.addEventListener('click', () => {
    randomOn = !randomOn;
    randomToggle.classList.toggle('active', randomOn);
    chrome.storage.local.set({ randomOn });
  });

  // ── Premium: Hear Chord (Web Audio API synthesis) ──
  const hearChordBtn = document.getElementById('hearChordBtn');
  const hearSongBtn = document.getElementById('hearSongBtn');

  // Note name → frequency (octave 4)
  const NOTE_FREQ = {
    'C': 261.63, 'C#': 277.18, 'Db': 277.18,
    'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
    'E': 329.63, 'F': 349.23, 'F#': 369.99, 'Gb': 369.99,
    'G': 392.00, 'G#': 415.30, 'Ab': 415.30,
    'A': 440.00, 'A#': 466.16, 'Bb': 466.16,
    'B': 493.88
  };

  function getChordNotes(chord) {
    if (chord.notes) return chord.notes;
    const pc = CHORD_DATA.piano.find(c => c.symbol === chord.symbol);
    return pc ? pc.notes : ['C', 'E', 'G'];
  }

  function playChord(chord) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = getChordNotes(chord);
    const duration = 1.5;

    notes.forEach((note, i) => {
      let freq = NOTE_FREQ[note];
      if (!freq) return;
      // Stack notes ascending from C4
      if (i > 0 && freq <= NOTE_FREQ[notes[0]]) freq *= 2;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + i * 0.08);
      osc.stop(audioCtx.currentTime + duration);
    });
  }

  // Play a scale ascending one note at a time
  function playScale(scaleInfo) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const noteDuration = 0.45;
    const gap = 0.35;

    scaleInfo.intervals.forEach((interval, i) => {
      const midi = scaleInfo.startMidi + interval;
      // MIDI to frequency: A4 (MIDI 69) = 440 Hz
      const freq = 440 * Math.pow(2, (midi - 69) / 12);

      const start = audioCtx.currentTime + i * gap;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + noteDuration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(start);
      osc.stop(start + noteDuration);
    });
  }

  const isPremium = false; // Set to false to enable premium gating

  // ── Footer Plan button ──
  const footerPlanBtn = document.getElementById('footerPlanBtn');
  if (isPremium) {
    footerPlanBtn.textContent = 'Manage Subscription';
    footerPlanBtn.classList.add('is-premium');
    footerPlanBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://chordfriends.com/manage' });
    });
  } else {
    footerPlanBtn.textContent = 'Get Premium';
    footerPlanBtn.classList.remove('is-premium');
    footerPlanBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://chordfriends.com/premium' });
    });
  }

  hearChordBtn.disabled = !isPremium;
  hearSongBtn.disabled = !isPremium;
  if (!isPremium) {
    // Allow any one instrument to be selected in free mode
    tabs.forEach(t => {
      t.classList.remove('active');
      t.disabled = false;
      t.classList.remove('disabled-premium');
    });
    // Set current instrument as active
    tabs.forEach(t => {
      if (t.dataset.instrument === currentInstrument) t.classList.add('active');
    });
    selectedInstruments = [currentInstrument];
    // Premium buttons: visible but disabled and styled lighter
    // Show dropdown on hover, but only 'Easy → Hard' is enabled
    difficultyBtn.disabled = false;
    difficultyBtn.classList.remove('disabled-premium');
    diffItems.forEach(i => {
      if (i.dataset.difficulty === 'progressive') {
        i.disabled = false;
        i.classList.remove('disabled-premium');
      } else {
        i.disabled = true;
        i.classList.add('disabled-premium');
      }
    });
    allChordsBtn.disabled = true;
    allChordsBtn.classList.add('disabled-premium');
    chordChartBtn.disabled = true;
    chordChartBtn.classList.add('disabled-premium');
    hearChordBtn.disabled = true;
    hearChordBtn.classList.add('disabled-premium');
    hearSongBtn.disabled = true;
    hearSongBtn.classList.add('disabled-premium');
    // Prevent dropdowns from opening
    allChordsBtn.onclick = (e) => e.preventDefault();
    chordChartBtn.onclick = (e) => e.preventDefault();
    // Force daily mode: no browsing
    selectedChordIndex = null;
    selectedScaleIndex = null;
  }

  hearChordBtn.addEventListener('click', () => {
    if (!isPremium) return;
    if (currentlyShowingScale) {
      const info = getCurrentScaleInfo();
      if (info) playScale(info);
    } else {
      const chord = getCurrentChord();
      playChord(chord);
    }
  });

  hearSongBtn.addEventListener('click', () => {
    if (!isPremium) return;
    if (currentlyShowingScale) {
      const info = getCurrentScaleInfo();
      if (!info) return;
      const q = encodeURIComponent('songs that use ' + info.name + ' scale melody or solo');
      chrome.tabs.create({ url: 'https://www.youtube.com/results?search_query=' + q });
    } else {
      const chord = getCurrentChord();
      const q = encodeURIComponent('songs that use ' + chord.name + ' chord');
      chrome.tabs.create({ url: 'https://www.youtube.com/results?search_query=' + q });
    }
  });

  // ── Load saved preferences ──
  chrome.storage.local.get(['instrument', 'instruments', 'viewMode', 'difficulty', 'contentMode', 'randomOn'], (result) => {
    if (result.instruments && result.instruments.length > 0) {
      selectedInstruments = isPremium ? result.instruments : [result.instruments[0]];
      currentInstrument = selectedInstruments[0];
      tabs.forEach(t => t.classList.toggle('active', selectedInstruments.includes(t.dataset.instrument)));
    } else if (result.instrument) {
      currentInstrument = result.instrument;
      selectedInstruments = [currentInstrument];
      tabs.forEach(t => t.classList.toggle('active', t.dataset.instrument === currentInstrument));
    }
    if (result.viewMode) {
      currentMode = result.viewMode;
      viewBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === currentMode));
    }
    if (result.difficulty) {
      currentDifficulty = result.difficulty;
      diffItems.forEach(i => {
        i.classList.toggle('active', i.dataset.difficulty === currentDifficulty);
        if (i.dataset.difficulty === currentDifficulty) {
          difficultyBtn.textContent = i.textContent;
        }
      });
      difficultyBtn.classList.add('active');
    }
    if (result.contentMode) {
      currentContent = result.contentMode;
      updateContentLabels();
    }
    if (result.randomOn) {
      randomOn = true;
      randomToggle.classList.add('active');
    }
    renderChord();
  });
});
