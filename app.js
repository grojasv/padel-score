// Padel Score: the hub (Bolo, new match, setup, history) and the shell (languages, install, footer).
// No build step. The scoreboard lives in match.js, the rules in scoring.js, voice input in voice.js, Bolo in mascot.js.
(() => {
  const VERSION = '0.2.0'; // keep in sync with CHANGELOG.md
  const LANGS = ['es', 'ca', 'en'];
  const KEY = { lang: 'padel-score.lang', setup: 'padel-score.setup', current: 'padel-score.current', log: 'padel-score.log' };

  const TEXT = {
    newMatch: { es: 'Nuevo partido', ca: 'Partit nou', en: 'New match' },
    continue: { es: 'Continuar partido', ca: 'Continua el partit', en: 'Continue match' },
    history: { es: 'Historial', ca: 'Historial', en: 'History' },
    noHistory: { es: 'Aún no hay partidos. ¡La pista te espera!', ca: 'Encara no hi ha partits. La pista t’espera!', en: 'No matches yet. The court is waiting!' },
    setup: { es: 'Preparar partido', ca: 'Prepara el partit', en: 'Match setup' },
    mode: { es: 'Modalidad', ca: 'Modalitat', en: 'Format' },
    doubles: { es: 'Dobles', ca: 'Dobles', en: 'Doubles' },
    singles: { es: 'Individual', ca: 'Individual', en: 'Singles' },
    teams: { es: 'Equipos', ca: 'Equips', en: 'Teams' },
    red: { es: 'Rojo', ca: 'Vermell', en: 'Red' },
    blue: { es: 'Azul', ca: 'Blau', en: 'Blue' },
    player: { es: 'Jugador', ca: 'Jugador', en: 'Player' },
    namesOpt: { es: 'nombres opcionales', ca: 'noms opcionals', en: 'names optional' },
    deuce: { es: 'En 40-40', ca: 'A 40-40', en: 'At 40-40' },
    golden: { es: 'Punto de oro', ca: 'Punt d’or', en: 'Golden point' },
    advantage: { es: 'Ventaja', ca: 'Avantatge', en: 'Advantage' },
    star: { es: 'Star point', ca: 'Star point', en: 'Star point' },
    starHelp: { es: 'Ventaja dos veces; al tercer iguales, punto de oro.', ca: 'Avantatge dues vegades; al tercer iguals, punt d’or.', en: 'Advantage twice; on the third deuce, golden point.' },
    third: { es: 'Tercer set', ca: 'Tercer set', en: 'Third set' },
    stb: { es: 'Súper tie-break a 10', ca: 'Súper tie-break a 10', en: 'Super tie-break to 10' },
    fullSet: { es: 'Set normal', ca: 'Set normal', en: 'Normal set' },
    format: { es: 'Al mejor de 3 sets a 6 juegos, tie-break a 7 en el 6-6.', ca: 'Al millor de 3 sets a 6 jocs, tie-break a 7 al 6-6.', en: 'Best of 3 sets to 6 games, tie-break to 7 at 6-6.' },
    time: { es: 'Tiempo de pista', ca: 'Temps de pista', en: 'Court time' },
    noLimit: { es: 'Sin límite', ca: 'Sense límit', en: 'No limit' },
    min: { es: 'min', ca: 'min', en: 'min' },
    timeHelp: { es: 'Bolo avisa a los 5 y a 1 minuto. Al acabar el tiempo se juega el último juego.', ca: 'En Bolo avisa als 5 i a 1 minut. En acabar el temps es juga l’últim joc.', en: 'Bolo warns at 5 and 1 minute. When time is up, the current game is the last.' },
    serve: { es: 'Saque inicial', ca: 'Servei inicial', en: 'First serve' },
    draw: { es: 'Sortear', ca: 'Sorteja', en: 'Random' },
    firstOf: { es: 'Saca primero en {t}', ca: 'Treu primer a {t}', en: 'Serves first for {t}' },
    voice: { es: 'Voz', ca: 'Veu', en: 'Voice' },
    talk: { es: 'Bolo canta el marcador', ca: 'En Bolo canta el marcador', en: 'Bolo calls the score' },
    listen: { es: 'Control por voz: di «rojo» o «azul»', ca: 'Control per veu: digues «vermell» o «blau»', en: 'Voice control: say “red” or “blue”' },
    strict: { es: 'Modo estricto: solo «punto rojo» / «punto azul»', ca: 'Mode estricte: només «punt vermell» / «punt blau»', en: 'Strict: only “point red” / “point blue”' },
    voiceHelp: { es: 'También: «deshacer», «marcador», «pausa». Funciona en Chrome con conexión. El micro se pausa mientras Bolo habla.', ca: 'També: «desfés», «marcador», «pausa». Funciona a Chrome amb connexió. El micro es pausa mentre en Bolo parla.', en: 'Also: “undo”, “score”, “pause”. Works in Chrome with a connection. The mic pauses while Bolo talks.' },
    noVoice: { es: 'Este navegador no reconoce la voz. Usa Chrome para el control por voz.', ca: 'Aquest navegador no reconeix la veu. Fes servir Chrome per al control per veu.', en: 'This browser has no speech recognition. Use Chrome for voice control.' },
    start: { es: '¡A jugar!', ca: 'A jugar!', en: 'Play!' },
    back: { es: '‹ Volver', ca: '‹ Torna', en: '‹ Back' },
    replaceAsk: { es: 'Hay un partido a medias. ¿Empezar uno nuevo y descartarlo?', ca: 'Hi ha un partit a mitges. Vols començar-ne un de nou i descartar-lo?', en: 'There is a match in progress. Start a new one and discard it?' },
    won: { es: 'gana', ca: 'guanya', en: 'wins' },
    drawn: { es: 'Empate', ca: 'Empat', en: 'Draw' },
    install: { es: 'Instala la app', ca: 'Instal·la l’app', en: 'Install the app' },
    installOther: { es: 'Abre el menú del navegador (⋮) y elige «Instalar aplicación».', ca: 'Obre el menú del navegador (⋮) i tria «Instal·la l’aplicació».', en: 'Open the browser menu (⋮) and choose “Install app”.' },
    hello: { es: '¡Hola! Soy Bolo. ¿Echamos un partido?', ca: 'Hola! Soc en Bolo. Fem un partit?', en: 'Hi! I’m Bolo. Fancy a match?' },
    loadError: { es: 'No se han podido cargar los datos.', ca: 'No s’han pogut carregar les dades.', en: 'Couldn’t load the data.' },
  };

  const DEFAULT_SETUP = {
    mode: 'doubles', names: { red: ['', ''], blue: ['', ''] }, deuce: 'golden', superTiebreak: true,
    timeLimit: 0, firstServe: 'red', firstPlayer: { red: 0, blue: 0 }, muted: false, voiceInput: true, strict: false,
  };
  const TIMES = [0, 45, 60, 75, 90, 120];

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* private mode */ } },
  };
  const readJSON = (k, fb) => { try { return JSON.parse(store.get(k)) ?? fb; } catch { return fb; } };
  const guess = (navigator.language || '').slice(0, 2);
  let lang = LANGS.includes(store.get(KEY.lang)) ? store.get(KEY.lang) : LANGS.includes(guess) ? guess : 'es';
  const t = (o) => (o && (o[lang] ?? o.es)) || '';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $ = (id) => document.getElementById(id);
  const view = $('view'), matchEl = $('match'), foot = $('foot');
  let lines = {};
  let match = null;

  const loadSetup = () => {
    const s = { ...DEFAULT_SETUP, ...readJSON(KEY.setup, {}) };
    s.names = { red: [...(s.names?.red || ['', '']), '', ''].slice(0, 2), blue: [...(s.names?.blue || ['', '']), '', ''].slice(0, 2) };
    s.firstPlayer = { red: 0, blue: 0, ...(s.firstPlayer || {}) };
    return s;
  };
  const current = () => { const c = readJSON(KEY.current, null); return c && c.state && !c.state.finished ? c : null; };
  const readLog = () => readJSON(KEY.log, []);
  const dateFmt = (ms) => new Intl.DateTimeFormat({ es: 'es-ES', ca: 'ca-ES', en: 'en-GB' }[lang], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(ms));
  const teamName = (setup, team) => {
    const n = (setup.names?.[team] || []).slice(0, setup.mode === 'singles' ? 1 : 2).filter(Boolean);
    return n.length ? n.join(' · ') : t(TEXT[team]);
  };

  // ---------- Bolo on the hub: eyes follow taps ----------
  function lookAt(e) {
    const w = document.querySelector('.hero .bolo-wrap');
    if (!w) return;
    const r = w.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height * 0.6);
    const d = Math.hypot(dx, dy) || 1;
    w.style.setProperty('--look-x', `${(dx / d) * 5}px`);
    w.style.setProperty('--look-y', `${(dy / d) * 4}px`);
  }
  document.addEventListener('pointerdown', lookAt);

  // ---------- views ----------
  function renderHub() {
    const log = readLog().slice(0, 20);
    const pool = lines.hello?.[lang];
    const hello = pool?.length ? pool[Math.floor(Math.random() * pool.length)] : t(TEXT.hello);
    const cur = current();
    view.innerHTML = `
      <section class="hero">
        <div class="bolo-wrap idle" id="heroBolo">${Bolo.svg('happy')}</div>
        <div class="bubble">${esc(hello)}</div>
      </section>
      <div class="actions">
        ${cur ? `<button class="btn go big" id="continueBtn" type="button">▶ ${esc(t(TEXT.continue))}<small>${esc(teamName(cur.setup, 'red'))} – ${esc(teamName(cur.setup, 'blue'))}</small></button>` : ''}
        <a class="btn ${cur ? 'ghost' : 'go big'}" href="#/setup">🎾 ${esc(t(TEXT.newMatch))}</a>
      </div>
      <h2 class="sec">${esc(t(TEXT.history))}</h2>
      ${log.length ? `<ul class="card history">${log.map((e) => {
        const sets = e.sets.map((x) => (x.kind === 'stb' ? `${x.tb.red}-${x.tb.blue}` : `${x.red}-${x.blue}${x.tb ? `<sup>${Math.min(x.tb.red, x.tb.blue)}</sup>` : ''}`))
          .concat(e.endedBy !== 'score' && e.games && (e.games.red || e.games.blue) ? [`${e.games.red}-${e.games.blue}`] : []).join(' ');
        const w = e.winner === 'draw' ? `<span class="tag">${esc(t(TEXT.drawn))}</span>` : `<span class="tag c-${e.winner}">${esc(teamName(e.setup, e.winner))} ${esc(t(TEXT.won))}</span>`;
        return `<li><span class="h-date">${esc(dateFmt(e.at))} · ${e.minutes} min</span>
          <span class="h-teams"><b class="t-red">${esc(teamName(e.setup, 'red'))}</b> – <b class="t-blue">${esc(teamName(e.setup, 'blue'))}</b></span>
          <span class="h-score">${sets || '–'}</span>${w}</li>`;
      }).join('')}</ul>` : `<p class="empty">${esc(t(TEXT.noHistory))}</p>`}`;
    $('heroBolo').addEventListener('click', (e) => { const m = e.currentTarget; m.classList.remove('bounce'); void m.offsetWidth; m.classList.add('bounce'); });
    $('continueBtn')?.addEventListener('click', () => { Match.unlock(); location.hash = '#/match'; });
  }

  function seg(name, value, options) {
    return `<div class="seg" role="radiogroup">${options.map(([v, label]) => `<label><input type="radio" name="${name}" value="${v}"${String(v) === String(value) ? ' checked' : ''}><span>${label}</span></label>`).join('')}</div>`;
  }
  function renderSetup() {
    const s = loadSetup();
    const voiceOk = !!window.Voice?.supported();
    const nameInputs = (team) => [0, 1].map((i) => `<input class="name n-${team}${i ? ' p2' : ''}" name="${team}${i}" maxlength="18" autocomplete="off"
      placeholder="${esc(t(TEXT.player))} ${i + 1}" value="${esc(s.names[team][i] || '')}">`).join('');
    const firstOf = (team) => `<div class="first-of p2"><span>${esc(t(TEXT.firstOf).replace('{t}', t(TEXT[team])))}</span>
      ${seg(`fp-${team}`, s.firstPlayer[team], [[0, `<span class="fp-name" data-fp="${team}0">${esc(s.names[team][0] || `${t(TEXT.player)} 1`)}</span>`], [1, `<span class="fp-name" data-fp="${team}1">${esc(s.names[team][1] || `${t(TEXT.player)} 2`)}</span>`]])}</div>`;
    view.innerHTML = `
      <a class="back" href="#/">${esc(t(TEXT.back))}</a>
      <form class="card setup" id="setupForm" data-mode="${s.mode}">
        <h2>${esc(t(TEXT.setup))}</h2>
        <fieldset><legend>${esc(t(TEXT.mode))}</legend>${seg('mode', s.mode, [['doubles', `👥 ${esc(t(TEXT.doubles))}`], ['singles', `👤 ${esc(t(TEXT.singles))}`]])}</fieldset>
        <fieldset><legend>${esc(t(TEXT.teams))} <small class="muted">· ${esc(t(TEXT.namesOpt))}</small></legend>
          <div class="teams">
            <div class="team c-red"><h3>${esc(t(TEXT.red))}</h3>${nameInputs('red')}</div>
            <div class="team c-blue"><h3>${esc(t(TEXT.blue))}</h3>${nameInputs('blue')}</div>
          </div></fieldset>
        <fieldset><legend>${esc(t(TEXT.deuce))}</legend>
          ${seg('deuce', s.deuce, [['golden', esc(t(TEXT.golden))], ['advantage', esc(t(TEXT.advantage))], ['star', esc(t(TEXT.star))]])}
          <p class="help">${esc(t(TEXT.starHelp))}</p></fieldset>
        <fieldset><legend>${esc(t(TEXT.third))}</legend>
          ${seg('stb', s.superTiebreak ? 1 : 0, [[1, esc(t(TEXT.stb))], [0, esc(t(TEXT.fullSet))]])}
          <p class="help">${esc(t(TEXT.format))}</p></fieldset>
        <fieldset><legend>${esc(t(TEXT.time))}</legend>
          ${seg('time', s.timeLimit, TIMES.map((m) => [m, m ? `${m} ${esc(t(TEXT.min))}` : esc(t(TEXT.noLimit))]))}
          <p class="help">${esc(t(TEXT.timeHelp))}</p></fieldset>
        <fieldset><legend>${esc(t(TEXT.serve))}</legend>
          ${seg('serve', s.firstServe, [['red', `🔴 ${esc(t(TEXT.red))}`], ['blue', `🔵 ${esc(t(TEXT.blue))}`], ['random', `🎲 ${esc(t(TEXT.draw))}`]])}
          ${firstOf('red')}${firstOf('blue')}</fieldset>
        <fieldset><legend>${esc(t(TEXT.voice))}</legend>
          <label class="check"><input type="checkbox" name="talk"${s.muted ? '' : ' checked'}> ${esc(t(TEXT.talk))}</label>
          ${voiceOk ? `<label class="check"><input type="checkbox" name="listen"${s.voiceInput ? ' checked' : ''}> ${esc(t(TEXT.listen))}</label>
          <label class="check sub"><input type="checkbox" name="strict"${s.strict ? ' checked' : ''}> ${esc(t(TEXT.strict))}</label>
          <p class="help">${esc(t(TEXT.voiceHelp))}</p>` : `<p class="help">${esc(t(TEXT.noVoice))}</p>`}
        </fieldset>
        <button class="btn go big" type="submit">🎾 ${esc(t(TEXT.start))}</button>
      </form>`;
    const form = $('setupForm');
    form.addEventListener('change', (e) => {
      if (e.target.name === 'mode') form.dataset.mode = e.target.value;
    });
    form.addEventListener('input', (e) => {
      const m = e.target.name?.match(/^(red|blue)([01])$/);
      if (m) { const span = form.querySelector(`[data-fp="${m[1]}${m[2]}"]`); if (span) span.textContent = e.target.value || `${t(TEXT.player)} ${Number(m[2]) + 1}`; }
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = new FormData(form);
      if (current() && !confirm(t(TEXT.replaceAsk))) return;
      Match.unlock(); // inside the tap: audio, speech, wake lock
      const serve = f.get('serve');
      const setup = {
        mode: f.get('mode'),
        names: { red: [f.get('red0'), f.get('red1')].map((x) => String(x || '').trim()), blue: [f.get('blue0'), f.get('blue1')].map((x) => String(x || '').trim()) },
        deuce: f.get('deuce'), superTiebreak: f.get('stb') === '1', timeLimit: Number(f.get('time')) || 0,
        firstServe: serve, firstPlayer: { red: Number(f.get('fp-red')) || 0, blue: Number(f.get('fp-blue')) || 0 },
        muted: !f.get('talk'), voiceInput: voiceOk ? !!f.get('listen') : s.voiceInput, strict: !!f.get('strict'),
      };
      store.set(KEY.setup, JSON.stringify(setup));
      const played = { ...setup, firstServe: serve === 'random' ? (Math.random() < 0.5 ? 'red' : 'blue') : serve };
      if (played.mode === 'singles') played.names = { red: [played.names.red[0], ''], blue: [played.names.blue[0], ''] };
      const m = { setup: played, state: Scoring.init(played), stack: [], startedAt: Date.now(), pausedMs: 0, pausedAt: null, warned: [] };
      store.set(KEY.current, JSON.stringify(m));
      location.hash = '#/match';
    });
  }

  function openMatch() {
    const m = readJSON(KEY.current, null);
    if (!m?.state) { location.hash = '#/'; return; }
    document.body.classList.add('playing');
    matchEl.hidden = false;
    match = Match.open(matchEl, {
      match: m, store, getLang: () => lang, lines,
      onFinish: (done) => { logMatch(done); match = null; location.hash = '#/'; },
      onExit: () => { match = null; location.hash = '#/'; },
    });
  }
  // Writes a finished match to the history (once per startedAt) and clears it as the current match.
  function logMatch(done) {
    const s = done.state;
    const ms = Math.max(0, (done.finishedAt || Date.now()) - done.startedAt - (done.pausedMs || 0));
    const log = readLog();
    if (!log.some((e) => e.at === done.startedAt)) {
      store.set(KEY.log, JSON.stringify([{ at: done.startedAt, setup: done.setup, sets: s.sets, games: s.games, winner: s.winner, endedBy: s.endedBy, minutes: Math.round(ms / 60000) }, ...log].slice(0, 100)));
    }
    store.del(KEY.current);
  }
  // A match that ended while the app was closed on the finish screen still goes to the history.
  function logLeftover() {
    const c = readJSON(KEY.current, null);
    if (c?.state?.finished && location.hash !== '#/match') logMatch(c);
  }

  function closeMatch() {
    if (match) { match.close(); match = null; }
    matchEl.hidden = true; matchEl.innerHTML = '';
    document.body.classList.remove('playing');
  }

  function route() {
    const r = location.hash.replace(/^#\/?/, '');
    if (r === 'match') { if (!match) openMatch(); return; }
    closeMatch();
    logLeftover();
    if (r === 'setup') renderSetup(); else renderHub();
    window.scrollTo(0, 0);
  }

  // ---------- shell (from gym-coach) ----------
  let installEvent = null;
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  function renderFoot() {
    foot.innerHTML = `${standalone ? '' : `<button class="btn small" id="installBtn" type="button">📲 ${esc(t(TEXT.install))}</button>
      <p class="install-help" id="installHelp" hidden>${esc(t(TEXT.installOther))}</p>`}
      <p class="ver">Padel Score v${VERSION}</p>`;
    $('installBtn')?.addEventListener('click', async () => {
      if (!installEvent) { $('installHelp').hidden = !$('installHelp').hidden; return; }
      installEvent.prompt();
      await installEvent.userChoice;
      installEvent = null;
    });
  }
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvent = e; });

  function setLang(next) {
    lang = next;
    store.set(KEY.lang, next);
    document.documentElement.lang = next;
    document.querySelectorAll('.langs button').forEach((b) => b.classList.toggle('active', b.dataset.lang === next));
    renderFoot();
    if (match) match.rerender(); else route();
  }
  document.querySelector('.langs').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-lang]');
    if (b) setLang(b.dataset.lang);
  });
  window.addEventListener('hashchange', route);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { /* offline cache is optional */ });

  fetch('data/lines.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : {})).catch(() => ({}))
    .then((l) => { lines = l; setLang(lang); });
})();
