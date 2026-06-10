/* ============================================================
   Tajemství názvu města Roudnice – herná logika
   ============================================================ */

// --------- STAV HRY ---------
const state = {
  team: '',
  startMs: 0,
  finalSeconds: 0,
  timerId: null,
  unlocked: new Set(),     // čísla odomknutých brán
  active: null,            // aktívna brána v modáli
};

// --------- DOM refs ---------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const screens = {
  intro: $('#screen-intro'),
  game:  $('#screen-game'),
  outro: $('#screen-outro'),
};

const timerBar    = $('#timer-bar');
const timerClock  = $('#timer-clock');
const teamDisplay = $('#team-display');
const modal       = $('#modal');
const modalContent= $('#modal-content');
const toast       = $('#toast');

// --------- KÓDY ---------
const CODES = { 1: '1333', 2: 'NEPOMUK', 3: 'LOBKOWICZ', 4: 'ROZHLEDNA' };

// --------- HISTORICKÉ TEXTY ---------
const GATE_BODY = {
  1: `<p><em>„Dokázali jste to! Tento rok změnil Roudnici navždy."</em></p>
      <p>Přesně v roce <strong>1333</strong> nechal biskup Jan IV. z Dražic položit základní kámen roudnického kamenného mostu.</p>
      <p><strong>Třetí v Čechách:</strong> Byl teprve třetím kamenným mostem v českém království (po Juditině mostě v Praze a mostě v Písku).</p>
      <p><strong>Francouzský šmrnc:</strong> Postavil ho mistr Vilém z Avignonu, kterého si biskup přivedl z Francie. Most měl <strong>7 oblouků</strong>.</p>
      <p><strong>Zlomená noha:</strong> Biskup investoval obrovské peníze poté, co se mu na rozbouřeném Labi rozbil kočár.</p>`,
  2: `<p><em>„Skvělé! Našli jste stopu nejslavnějšího českého světce."</em></p>
      <p>Tragický osud Jana Nepomuckého se začal psát právě tady, v Roudnici nad Labem.</p>
      <p><strong>Královský hněv:</strong> Jan byl pravou rukou arcibiskupa a dostal se do sporu s králem Václavem IV.</p>
      <p><strong>Zatčení v Roudnici:</strong> Krále došla trpělivost a Jana převezli na biskupský hrad v Roudnici, kde ho krutě vyslýchali.</p>
      <p><strong>Karlův most:</strong> Po roudnických událostech ho v Praze svrhli z Karlova mostu do Vltavy.</p>`,
  3: `<p><em>„Výborně! Odhalili jste rod, který vlastnil Roudnici po staletí."</em></p>
      <p><strong>Přestavba století:</strong> Lobkowiczové přestavěli středověký biskupský hrad na monumentální barokní zámek s více než <strong>200 místnostmi</strong>.</p>
      <p><strong>Paní Polyxena:</strong> Přinesla do města slavnou sošku Pražského Jezulátka.</p>
      <p><strong>Poklad v knihovně:</strong> Zhromáždili roudnickou sbírku obrazů a vzácných rukopisů.</p>
      <p>Dnes rodina zámek opět vlastní.</p>`,
  4: `<p><em>„Úžasné! Rozluštili jste celé tajemství!"</em></p>
      <p>Kratochvílova rozhledna je architektonickým klenotem Roudnice.</p>
      <p><strong>Zázrak z roku 1935:</strong> Otevřena v duchu funkcionalismu – stavba z betonu, žádné středověké kameny.</p>
      <p><strong>Nízko a přesto vysoko:</strong> Jen 230 m n. m., ale díky poloze na skále nabízí výhled na celé České středohoří.</p>
      <p><strong>Jméno po Václavovi Kratochvílovi:</strong> Jako uznávaný zástupce českého venkova dostal v květnu 1868 obrovskou čest – mohl slavnostně poklepat na základní kámen Národního divadla v Praze jménem venkovských obcí, a to s heslem „S rázností k svobodě".</p>`,
};

// =============================================================
// INIT
// =============================================================
function init() {
  // Naplniť historické texty
  for (const n of [1,2,3,4]) {
    $('#gate-body-' + n).innerHTML = GATE_BODY[n];
  }

  // Intro form
  $('#intro-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#team-name').value.trim();
    if (!name) return;
    state.team = name;
    teamDisplay.textContent = name;
    showScreen('game');
    timerBar.classList.remove('hidden');
    startTimer();
  });

  $('#btn-play-again').addEventListener('click', () => location.reload());

  // Brány
  $$('[data-action="open-task"]').forEach(btn => {
    btn.addEventListener('click', () => openTask(+btn.dataset.gate));
  });

  // Zavretie modálu
  $$('[data-action="close-modal"]').forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

function showScreen(name) {
  Object.entries(screens).forEach(([k, el]) => el.classList.toggle('active', k === name));
}

// =============================================================
// STOPKY
// =============================================================
function startTimer() {
  state.startMs = Date.now();
  state.timerId = setInterval(tick, 250);
  tick();
}
function tick() {
  const sec = Math.floor((Date.now() - state.startMs) / 1000);
  timerClock.textContent = formatTime(sec);
}
function stopTimer() {
  clearInterval(state.timerId);
  state.timerId = null;
  state.finalSeconds = Math.floor((Date.now() - state.startMs) / 1000);
  timerClock.textContent = formatTime(state.finalSeconds);
}
function formatTime(totalSec) {
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
function formatTimePretty(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const mStr = m === 1 ? 'minutu' : (m >= 2 && m <= 4) ? 'minuty' : 'minut';
  const sStr = s === 1 ? 'sekundu' : (s >= 2 && s <= 4) ? 'sekundy' : 'sekund';
  return `${m} ${mStr} a ${s} ${sStr}`;
}

// =============================================================
// BRÁNY – odomknutie a ukončenie hry
// =============================================================
const unlockSound = new Audio('otvorena%20brana.mp3');
unlockSound.preload = 'auto';

function unlockGate(n) {
  if (state.unlocked.has(n)) return;
  state.unlocked.add(n);
  $$('.gate').find(g => +g.dataset.gate === n).classList.remove('locked');
  $$('.gate').find(g => +g.dataset.gate === n).classList.add('unlocked');
  $$(`.gate-pill[data-gate="${n}"]`).forEach(p => p.classList.add('done'));
  try { unlockSound.currentTime = 0; unlockSound.play().catch(() => {}); } catch (_) {}
  showToast('🔓 Brána ' + n + ' otevřena!');

  closeModal();

  if (state.unlocked.size === 4) {
    setTimeout(finishGame, 1200);
  }
}

function finishGame() {
  stopTimer();
  $('#outro-team-name').textContent = state.team;
  $('#outro-time').textContent = formatTimePretty(state.finalSeconds);
  timerBar.classList.add('hidden');
  showScreen('outro');
}

// =============================================================
// MODÁL ÚLOH
// =============================================================
function openTask(n) {
  if (state.unlocked.has(n)) return;
  state.active = n;
  modal.classList.remove('hidden');
  modalContent.innerHTML = '';

  if (n === 1) renderGate1();
  if (n === 2) renderGate2();
  if (n === 3) renderGate3();
  if (n === 4) renderGate4();
}
function closeModal() {
  // Bezpečnostný cleanup: prípadné drag prvky uviaznuté na <body>
  document.querySelectorAll('body > .puzzle-piece, body > .hill-label').forEach(el => el.remove());
  modal.classList.add('hidden');
  modalContent.innerHTML = '';
  state.active = null;
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove('hidden');
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 400);
  }, 1500);
}

// =============================================================
// BRÁNA 1 – POSTUPNÉ INDÍCIE → 4 CIFRY
// =============================================================
const GATE1_CLUES = [
  { q: 'Počet ocasů, které má český lev ve státním znaku.', a: 1 },
  { q: 'Kolik barev má česká vlajka?', a: 3 },
  { q: 'Kolik historických zemí tvoří Českou republiku?', a: 3 },
  { q: 'Kolik pruhů má česká státní trikolóra?', a: 3 },
];

function renderGate1() {
  let step = 0;
  const digits = [null, null, null, null];

  const html = `
    <h2>🏰 Brána biskupa Jana IV.</h2>
    <p class="intro-text">Zadejte tajemný kód – čtyři číslice. Vyřešte čtyři postupné indicie o symbolech českého státu.</p>
    <div class="gate1-progress" id="g1-progress"></div>
    <div class="gate1-question" id="g1-question"></div>
    <div class="gate1-digits" id="g1-digits"></div>
    <div class="gate1-keypad" id="g1-keypad"></div>
    <div class="gate1-actions">
      <button class="btn btn-ghost" id="g1-back">Zpět</button>
      <button class="btn btn-primary hidden" id="g1-submit">Otevřít bránu</button>
    </div>
    <div class="feedback" id="g1-feedback"></div>
  `;
  modalContent.innerHTML = html;

  const progress = $('#g1-progress');
  for (let i=0; i<4; i++) {
    const s = document.createElement('div');
    s.className = 'gate1-step';
    progress.appendChild(s);
  }

  const digitsEl = $('#g1-digits');
  for (let i=0; i<4; i++) {
    const d = document.createElement('div');
    d.className = 'gate1-digit';
    d.dataset.idx = i;
    digitsEl.appendChild(d);
  }

  const keypad = $('#g1-keypad');
  for (let n=0; n<=9; n++) {
    const k = document.createElement('button');
    k.className = 'gate1-key';
    k.textContent = n;
    k.addEventListener('click', () => onDigit(n));
    keypad.appendChild(k);
  }

  $('#g1-back').addEventListener('click', () => {
    if (step > 0) {
      step--;
      digits[step] = null;
      renderStep();
    } else {
      closeModal();
    }
  });
  $('#g1-submit').addEventListener('click', checkCode);

  function renderStep() {
    $$('#g1-progress .gate1-step').forEach((el, i) => {
      el.classList.toggle('active', i === step);
      el.classList.toggle('done', i < step);
    });
    $('#g1-question').textContent = step < 4 ? `Indicie ${step+1}/4: ${GATE1_CLUES[step].q}` : 'Zadejte tajemný kód:';
    $$('#g1-digits .gate1-digit').forEach((el, i) => {
      el.classList.toggle('active', i === step && step < 4);
      el.classList.toggle('filled', digits[i] !== null);
      el.textContent = digits[i] === null ? '?' : digits[i];
    });
    $('#g1-feedback').textContent = '';
    $('#g1-feedback').className = 'feedback';
    $('#g1-submit').classList.toggle('hidden', step < 4);
    $('#g1-back').textContent = step === 0 ? 'Zpět' : 'Předchozí indicie';
  }

  function onDigit(n) {
    if (step >= 4) return;
    digits[step] = n;
    if (n === GATE1_CLUES[step].a) {
      $('#g1-feedback').textContent = 'Správně! Další indicie…';
      $('#g1-feedback').className = 'feedback ok';
      step++;
      setTimeout(renderStep, 600);
    } else {
      $('#g1-feedback').textContent = 'To není ono. Zkuste to znovu.';
      $('#g1-feedback').className = 'feedback bad';
      digits[step] = null;
      $$('#g1-digits .gate1-digit')[step].textContent = '?';
    }
  }

  function checkCode() {
    if (digits.join('') === CODES[1]) {
      $('#g1-feedback').textContent = '🔓 Kód je správný!';
      $('#g1-feedback').className = 'feedback ok';
      setTimeout(() => unlockGate(1), 400);
    }
  }

  renderStep();
}

// =============================================================
// BRÁNA 2 – KRÍŽOVKA s tajenkou NEPOMUK
// =============================================================
const GATE2 = {
  cols: 12,
  rows: 7,
  centerCol: 6, // 1-indexed
  rows_data: [
    // {word, startCol (1-indexed), clue, centerLetterIdx (0-indexed within word)}
    { word: 'NÁRODNÍ', startCol: 6, clue: 'Slavná budova v Praze se zlatou střechou .... divadlo' },
    { word: 'LABE',    startCol: 3, clue: 'Řeka, na které leží Roudnice' },
    { word: 'PRAHA',   startCol: 6, clue: 'Hlavní město České republiky' },
    { word: 'ORLOJ',   startCol: 3, clue: 'Středověký astronomický stroj na Staroměstské radnici' },
    { word: 'MORAVA',  startCol: 6, clue: 'Východní historická země České republiky' },
    { word: 'KORUNA',  startCol: 3, clue: 'Co má král na hlavě?' },
    { word: 'KRONIKA', startCol: 1, clue: 'Co napsal kronikář Kosmas?' },
  ],
};

function renderGate2() {
  const html = `
    <h2>📜 Brána Jana Nepomuckého</h2>
    <p class="intro-text">Vyluštěte tajenku. Doplňujte slova do řádků a ve sloupci se zjeví tajné slovo.</p>
    <div class="crossword" id="g2-crossword"></div>
    <div class="feedback" id="g2-feedback"></div>
    <div class="crossword-clues" id="g2-clues"></div>
  `;
  modalContent.innerHTML = html;

  const grid = $('#g2-crossword');
  grid.style.gridTemplateColumns = `repeat(${GATE2.cols}, minmax(28px, 44px))`;

  // Vytvor mriežku
  for (let r=0; r<GATE2.rows; r++) {
    const rowData = GATE2.rows_data[r];
    const startCol = rowData.startCol;
    const word = rowData.word;
    for (let c=1; c<=GATE2.cols; c++) {
      const cell = document.createElement('div');
      const idxInWord = c - startCol;
      if (idxInWord >= 0 && idxInWord < word.length) {
        const letter = word[idxInWord];
        if (c === GATE2.centerCol) {
          // Stredný stĺpec – písmeno tajenky, dané ako pomôcka? Nie, treba ho vyplniť.
          cell.className = 'cw-cell input center';
          const input = document.createElement('input');
          input.type = 'text';
          input.maxLength = 1;
          input.dataset.row = r;
          input.dataset.col = c;
          input.dataset.expected = letter;
          input.dataset.center = '1';
          cell.appendChild(input);
        } else {
          cell.className = 'cw-cell input';
          const input = document.createElement('input');
          input.type = 'text';
          input.maxLength = 1;
          input.dataset.row = r;
          input.dataset.col = c;
          input.dataset.expected = letter;
          cell.appendChild(input);
        }
      } else {
        cell.className = 'cw-cell empty';
      }
      grid.appendChild(cell);
    }
  }

  // Indície
  const clues = $('#g2-clues');
  GATE2.rows_data.forEach((r, i) => {
    const d = document.createElement('div');
    d.innerHTML = `<strong>${i+1}.</strong> ${r.clue}`;
    clues.appendChild(d);
  });

  // Vstupné správanie: auto skok na ďalšie políčko
  const inputs = $$('#g2-crossword input');
  inputs.forEach((input, i) => {
    input.addEventListener('input', () => {
      input.value = input.value.toUpperCase().replace(/[^A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/g, '');
      if (input.value) {
        // Nájdi ďalší vstup v rovnakom riadku
        const r = +input.dataset.row;
        const nextInSameRow = inputs.find((x, j) => j > i && +x.dataset.row === r);
        if (nextInSameRow) nextInSameRow.focus();
      }
      checkCrossword();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value) {
        const prev = inputs[i-1];
        if (prev && +prev.dataset.row === +input.dataset.row) prev.focus();
      }
    });
    input.addEventListener('focus', () => {
      // Označiť celý riadok
      const r = +input.dataset.row;
      inputs.forEach(x => x.parentElement.classList.toggle('highlight', +x.dataset.row === r));
    });
  });

  function checkCrossword() {
    let allCorrect = true;
    inputs.forEach(inp => {
      const ok = norm(inp.value) === norm(inp.dataset.expected);
      inp.parentElement.classList.toggle('correct', ok);
      if (!ok) allCorrect = false;
    });
    if (allCorrect) {
      $('#g2-feedback').textContent = '🔓 Tajenka NEPOMUK odhalena!';
      $('#g2-feedback').className = 'feedback ok';
      setTimeout(() => unlockGate(2), 900);
    }
  }
  function norm(s) {
    return (s || '').toUpperCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
}

// =============================================================
// BRÁNA 3 – PUZZLE ERBU (nepravidelné kúsky, drag & drop)
// =============================================================
const PUZZLE_COLS = 4;
const PUZZLE_ROWS = 5;
const PUZZLE_PIECES = (() => {
  const arr = [];
  let id = 1;
  for (let r = 0; r < PUZZLE_ROWS; r++) {
    for (let c = 0; c < PUZZLE_COLS; c++) {
      const x1 = (c / PUZZLE_COLS) * 100;
      const y1 = (r / PUZZLE_ROWS) * 100;
      const x2 = ((c + 1) / PUZZLE_COLS) * 100;
      const y2 = ((r + 1) / PUZZLE_ROWS) * 100;
      arr.push({
        id: id++,
        clip: `polygon(${x1}% ${y1}%, ${x2}% ${y1}%, ${x2}% ${y2}%, ${x1}% ${y2}%)`,
      });
    }
  }
  return arr;
})();
const PUZZLE_TOTAL = PUZZLE_PIECES.length;

function renderGate3() {
  const html = `
    <h2>🛡 Brána Lobkowiczů</h2>
    <p class="intro-text">Složte rozstřižený erb. Přetahujte kousky z dolního pole na velký rámeček nahoře.</p>
    <div class="puzzle-area">
      <div class="puzzle-board" id="g3-board"></div>
      <div class="puzzle-tray" id="g3-tray"></div>
      <div class="puzzle-status" id="g3-status">Složeno: 0 / ${PUZZLE_TOTAL}</div>
    </div>
    <div class="feedback" id="g3-feedback"></div>
  `;
  modalContent.innerHTML = html;

  const boardEl = $('#g3-board');
  const tray = $('#g3-tray');
  const status = $('#g3-status');

  requestAnimationFrame(() => {
    const br = boardEl.getBoundingClientRect();
    const boardW = br.width;
    const boardH = br.height;
    const placed = new Set();
    const onBoard = new Set();
    let solved = false;

    const items = PUZZLE_PIECES.map(p => createPieceWrapper(p, boardW, boardH));
    items.sort(() => Math.random() - 0.5);
    layoutTray(items);

    items.forEach(item => {
      tray.appendChild(item.el);
      makePieceDraggable(item);
    });

    function createPieceWrapper(p, boardW, boardH) {
      const nums = p.clip.match(/-?\d+(?:\.\d+)?/g).map(parseFloat);
      const xs = nums.filter((_, i) => i % 2 === 0);
      const ys = nums.filter((_, i) => i % 2 === 1);
      const left = Math.min(...xs) / 100 * boardW;
      const top  = Math.min(...ys) / 100 * boardH;
      const right  = Math.max(...xs) / 100 * boardW;
      const bottom = Math.max(...ys) / 100 * boardH;
      const w = right - left;
      const h = bottom - top;

      const wrapper = document.createElement('div');
      wrapper.className = 'puzzle-piece';
      wrapper.dataset.id = p.id;
      wrapper.style.position = 'absolute';
      wrapper.style.width = w + 'px';
      wrapper.style.height = h + 'px';
      wrapper.style.overflow = 'hidden';
      wrapper.style.background = 'none';

      const inner = document.createElement('div');
      inner.style.position = 'absolute';
      inner.style.left = (-left) + 'px';
      inner.style.top  = (-top) + 'px';
      inner.style.width  = boardW + 'px';
      inner.style.height = boardH + 'px';
      inner.style.backgroundImage = "url('assets/erb.jpg')";
      inner.style.backgroundSize = '100% 100%';
      inner.style.backgroundRepeat = 'no-repeat';
      inner.style.clipPath = p.clip;
      inner.style.webkitClipPath = p.clip;
      inner.style.pointerEvents = 'none';
      wrapper.appendChild(inner);

      return { el: wrapper, id: p.id, homeLeft: left, homeTop: top, w, h };
    }

    function layoutTray(list) {
      const trayW = tray.clientWidth - 20;
      const scale = 0.45;
      let x = 10, y = 10, rowH = 0;
      list.forEach(item => {
        const sw = item.w * scale;
        const sh = item.h * scale;
        if (x + sw > trayW) {
          x = 10;
          y += rowH + 12;
          rowH = 0;
        }
        item.el.style.left = x + 'px';
        item.el.style.top  = y + 'px';
        item.el.style.transformOrigin = '0 0';
        item.el.style.transform = `scale(${scale})`;
        item.scale = scale;
        item.originX = x;
        item.originY = y;
        x += sw + 12;
        rowH = Math.max(rowH, sh);
      });
      tray.style.minHeight = (y + rowH + 20) + 'px';
    }

    function makePieceDraggable(item) {
      const el = item.el;

      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const pid = e.pointerId;
        try { el.setPointerCapture(pid); } catch (_) {}

        // BCR pri scale<1 vráti zmenšené rozmery; offset prepočítaj na scale=1
        const r = el.getBoundingClientRect();
        const offsetX = (e.clientX - r.left) / item.scale;
        const offsetY = (e.clientY - r.top)  / item.scale;

        document.body.appendChild(el);
        el.style.position = 'fixed';
        el.style.transform = 'scale(1)';
        item.scale = 1;
        el.style.left = (e.clientX - offsetX) + 'px';
        el.style.top  = (e.clientY - offsetY) + 'px';
        el.style.zIndex = '9999';
        el.classList.add('dragging');

        const onMove = (ev) => {
          if (ev.pointerId !== pid) return;
          el.style.left = (ev.clientX - offsetX) + 'px';
          el.style.top  = (ev.clientY - offsetY) + 'px';
        };

        const onEnd = (ev) => {
          if (ev.pointerId !== pid) return;
          document.removeEventListener('pointermove', onMove);
          document.removeEventListener('pointerup', onEnd);
          document.removeEventListener('pointercancel', onEnd);
          try { el.releasePointerCapture(pid); } catch (_) {}
          el.classList.remove('dragging');

          const boardEl = $('#g3-board');
          if (!boardEl) {
            el.remove();
            return;
          }
          const boardRect = boardEl.getBoundingClientRect();
          const pieceLeft = ev.clientX - offsetX;
          const pieceTop  = ev.clientY - offsetY;
          const centerX = pieceLeft + item.w / 2;
          const centerY = pieceTop  + item.h / 2;
          const droppedOnBoard = centerX >= boardRect.left && centerX <= boardRect.right &&
                                 centerY >= boardRect.top  && centerY <= boardRect.bottom;

          if (droppedOnBoard) {
            // Voľné položenie: dielik ostane tam, kam ho žiak pustil.
            const localLeft = pieceLeft - boardRect.left;
            const localTop  = pieceTop  - boardRect.top;
            boardEl.appendChild(el);
            el.style.position = 'absolute';
            el.style.left = localLeft + 'px';
            el.style.top  = localTop + 'px';
            el.style.transform = 'scale(1)';
            item.scale = 1;
            el.style.zIndex = '';
            onBoard.add(item.id);

            // Tolerancia ~50 % menšej strany dielika (informatívne pre counter).
            const tol = Math.min(item.w, item.h) * 0.5;
            const isClose = Math.abs(localLeft - item.homeLeft) <= tol &&
                            Math.abs(localTop  - item.homeTop)  <= tol;
            if (isClose) placed.add(item.id);
            else         placed.delete(item.id);
          } else {
            // Mimo boardu → návrat do zásobníka.
            placed.delete(item.id);
            onBoard.delete(item.id);
            tray.appendChild(el);
            el.style.position = 'absolute';
            el.style.left = item.originX + 'px';
            el.style.top  = item.originY + 'px';
            el.style.transform = `scale(${0.45})`;
            item.scale = 0.45;
            el.style.zIndex = '';
          }

          status.textContent = `Složeno: ${placed.size} / ${PUZZLE_TOTAL}`;

          // Súdržnosť mriežky: ak sú všetky dieliky na ploche a ich vzájomné
          // rozostupy sedia (môžu byť celé spolu posunuté), počíta sa to ako hotovo.
          if (!solved && onBoard.size === PUZZLE_TOTAL) {
            const offsets = items.map(it => ({
              dx: parseFloat(it.el.style.left) - it.homeLeft,
              dy: parseFloat(it.el.style.top)  - it.homeTop,
            }));
            const avgDx = offsets.reduce((s, o) => s + o.dx, 0) / PUZZLE_TOTAL;
            const avgDy = offsets.reduce((s, o) => s + o.dy, 0) / PUZZLE_TOTAL;
            const allowed = Math.min(items[0].w, items[0].h) * 0.35;
            const coherent = offsets.every(o =>
              Math.abs(o.dx - avgDx) <= allowed && Math.abs(o.dy - avgDy) <= allowed
            );
            if (coherent) {
              solved = true;
              // Vizuálna odmena: zarovnaj všetkých 20 dielikov presne na home pozíciu.
              items.forEach(it => {
                it.el.style.left = it.homeLeft + 'px';
                it.el.style.top  = it.homeTop + 'px';
                it.el.classList.add('placed');
              });
              status.textContent = '🔓 Erb je složen!';
              $('#g3-feedback').textContent = 'Výborně! Kód: LOBKOWICZ';
              $('#g3-feedback').className = 'feedback ok';
              setTimeout(() => unlockGate(3), 1100);
            }
          }
        };

        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onEnd);
        document.addEventListener('pointercancel', onEnd);
      });
    }
  });
}

// =============================================================
// BRÁNA 4 – KOPCE (drag & drop názvov)
// =============================================================
const HILLS = [
  // pozícia ako percentá z obrázku kopcov
  // (rough zóny – budú sa tolerovať)
  { id: 'milesovka', name: 'Milešovka', x: 30, y: 16, w: 30, h: 30 },
  { id: 'hazmburk',  name: 'Hazmburk',  x: 26, y: 44, w: 28, h: 28 },
  { id: 'kostal',    name: 'Košťál',    x: 65, y: 50, w: 22, h: 24 },
];

function renderGate4() {
  const html = `
    <h2>🏔 Brána rozhledny</h2>
    <p class="intro-text">Přetáhněte názvy tří kopců na správná místa ve fotografii Českého středohoří.</p>
    <div class="hills-area">
      <div class="hills-photo" id="g4-photo"></div>
      <div class="hill-tray" id="g4-tray"></div>
    </div>
    <div class="feedback" id="g4-feedback"></div>
  `;
  modalContent.innerHTML = html;

  const photo = $('#g4-photo');
  const tray = $('#g4-tray');

  // Vytvor target zóny v obrázku
  HILLS.forEach(h => {
    const target = document.createElement('div');
    target.className = 'hill-target';
    target.dataset.id = h.id;
    target.style.left   = h.x + '%';
    target.style.top    = h.y + '%';
    target.style.width  = h.w + '%';
    target.style.height = h.h + '%';
    target.innerHTML = `<span>?</span>`;
    photo.appendChild(target);
  });

  // Vytvor štítky v zmiešanom poradí
  const order = [...HILLS].sort(() => Math.random() - 0.5);
  order.forEach(h => {
    const label = document.createElement('div');
    label.className = 'hill-label';
    label.dataset.id = h.id;
    label.textContent = h.name;
    tray.appendChild(label);
    makeLabelDraggable(label);
  });

  let placed = 0;

  function makeLabelDraggable(label) {
    label.addEventListener('pointerdown', (e) => {
      if (label.classList.contains('placed')) return;
      e.preventDefault();
      const pid = e.pointerId;
      try { label.setPointerCapture(pid); } catch (_) {}

      const r = label.getBoundingClientRect();
      const offsetX = e.clientX - r.left;
      const offsetY = e.clientY - r.top;

      document.body.appendChild(label);
      label.style.position = 'fixed';
      label.style.left = r.left + 'px';
      label.style.top  = r.top + 'px';
      label.style.zIndex = 9999;
      label.classList.add('dragging');

      const onMove = (ev) => {
        if (ev.pointerId !== pid) return;
        label.style.left = (ev.clientX - offsetX) + 'px';
        label.style.top  = (ev.clientY - offsetY) + 'px';

        const cx = ev.clientX, cy = ev.clientY;
        $$('#g4-photo .hill-target').forEach(t => {
          const tr = t.getBoundingClientRect();
          t.classList.toggle('hover',
            !t.classList.contains('filled') &&
            cx >= tr.left && cx <= tr.right && cy >= tr.top && cy <= tr.bottom);
        });
      };

      const onEnd = (ev) => {
        if (ev.pointerId !== pid) return;
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onEnd);
        document.removeEventListener('pointercancel', onEnd);
        try { label.releasePointerCapture(pid); } catch (_) {}
        label.classList.remove('dragging');

        const cx = ev.clientX, cy = ev.clientY;
        let dropTarget = null;
        $$('#g4-photo .hill-target').forEach(t => {
          const tr = t.getBoundingClientRect();
          if (cx >= tr.left && cx <= tr.right && cy >= tr.top && cy <= tr.bottom && !t.classList.contains('filled')) {
            dropTarget = t;
          }
          t.classList.remove('hover');
        });

        if (dropTarget && dropTarget.dataset.id === label.dataset.id) {
          dropTarget.classList.add('filled');
          dropTarget.innerHTML = `<span>${label.textContent}</span>`;
          label.classList.add('placed');
          label.remove();
          placed++;
          if (placed === HILLS.length) {
            $('#g4-feedback').textContent = '🔓 Všechny tři kopce jsou na svém místě! Kód: ROZHLEDNA';
            $('#g4-feedback').className = 'feedback ok';
            setTimeout(() => unlockGate(4), 1200);
          }
        } else {
          if (dropTarget) {
            $('#g4-feedback').textContent = 'To není správný kopec. Zkuste znovu.';
            $('#g4-feedback').className = 'feedback bad';
            setTimeout(() => {
              $('#g4-feedback').textContent = '';
              $('#g4-feedback').className = 'feedback';
            }, 1400);
          }
          const trayEl = $('#g4-tray');
          if (trayEl) {
            trayEl.appendChild(label);
            label.style.position = '';
            label.style.left = '';
            label.style.top = '';
            label.style.zIndex = '';
          } else {
            label.remove();
          }
        }
      };

      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onEnd);
      document.addEventListener('pointercancel', onEnd);
    });
  }
}

// =============================================================
init();
