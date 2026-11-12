// Padel Score: the hub (Bolo, new match, setup, history) and the shell (languages, install, footer).
// No build step. The scoreboard lives in match.js, the rules in scoring.js, voice input in voice.js, Bolo in mascot.js.
(() => {
  const VERSION = '0.9.0'; // keep in sync with CHANGELOG.md
  const LANGS = ['es', 'ca', 'en'];
  const KEY = { lang: 'padel-score.lang', setup: 'padel-score.setup', current: 'padel-score.current', log: 'padel-score.log' };

  const TEXT = {
    newMatch: { es: 'Nuevo partido', ca: 'Partit nou', en: 'New match' },
    continue: { es: 'Continuar partido', ca: 'Continua el partit', en: 'Continue match' },
    history: { es: 'Historial', ca: 'Historial', en: 'History' },
    noHistory: { es: 'Aún no hay partidos. ¡La pista te espera!', ca: 'Encara no hi ha partits. La pista t’espera!', en: 'No matches yet. The court is waiting!' },
    noHistoryPP: { es: 'Aún no hay partidos. ¡La mesa te espera!', ca: 'Encara no hi ha partits. La taula t’espera!', en: 'No matches yet. The table is waiting!' },
    setup: { es: 'Preparar partido', ca: 'Prepara el partit', en: 'Match setup' },
    mode: { es: 'Modalidad', ca: 'Modalitat', en: 'Format' },
    doubles: { es: 'Dobles', ca: 'Dobles', en: 'Doubles' },
    singles: { es: 'Individual', ca: 'Individual', en: 'Singles' },
    teams: { es: 'Equipos', ca: 'Equips', en: 'Teams' },
    red: { es: 'Rojo', ca: 'Vermell', en: 'Red' },
    blue: { es: 'Verde', ca: 'Verd', en: 'Green' },
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
    timeHelp: { es: 'Bolo avisa a los 5 y a 1 minuto. Al acabar el tiempo se juega el último juego. Si os quedáis más, al final puedes sumar 30 minutos o quitar el límite.', ca: 'En Bolo avisa als 5 i a 1 minut. En acabar el temps es juga l’últim joc. Si us quedeu més, al final pots sumar 30 minuts o treure el límit.', en: 'Bolo warns at 5 and 1 minute. When time is up, the current game is the last. If you stay on, the end screen can add 30 minutes or remove the limit.' },
    sidesLegend: { es: 'Lados', ca: 'Costats', en: 'Sides' },
    sides: { es: 'Rojo y verde cambian de lado en cada cambio de campo', ca: 'Vermell i verd canvien de costat a cada canvi de camp', en: 'Red and green swap sides at every change of ends' },
    sidesHelpPP: { es: 'Como en la mesa: tras cada juego y a los 5 puntos del último juego. Apagado, rojo siempre a la izquierda. El mando no cambia: ⏮ rojo, ⏭ verde.', ca: 'Com a la taula: després de cada joc i als 5 punts de l’últim joc. Apagat, vermell sempre a l’esquerra. El comandament no canvia: ⏮ vermell, ⏭ verd.', en: 'As at the table: after each game and at 5 points in the last game. Off: red always on the left. The remote stays the same: ⏮ red, ⏭ green.' },
    sidesHelp: { es: 'Como en la pista: tras los juegos 1, 3, 5…, cada 6 puntos del tie-break y tras un set impar. Apagado, rojo siempre a la izquierda. El mando no cambia: ⏮ rojo, ⏭ verde.', ca: 'Com a la pista: després dels jocs 1, 3, 5…, cada 6 punts del tie-break i després d’un set senar. Apagat, vermell sempre a l’esquerra. El comandament no canvia: ⏮ vermell, ⏭ verd.', en: 'As on court: after games 1, 3, 5…, every 6 tie-break points and after an odd set. Off: red always on the left. The remote stays the same: ⏮ red, ⏭ green.' },
    serve: { es: 'Saque inicial', ca: 'Servei inicial', en: 'First serve' },
    draw: { es: 'Sortear', ca: 'Sorteja', en: 'Random' },
    firstOf: { es: '1.º en {t}', ca: '1r a {t}', en: '1st for {t}' },
    voice: { es: 'Voz', ca: 'Veu', en: 'Voice' },
    talk: { es: 'Bolo canta el marcador', ca: 'En Bolo canta el marcador', en: 'Bolo calls the score' },
    listen: { es: 'Control por voz: di «rojo» o «verde»', ca: 'Control per veu: digues «vermell» o «verd»', en: 'Voice control: say “red” or “green”' },
    strict: { es: 'Modo estricto: solo «punto rojo» / «punto verde»', ca: 'Mode estricte: només «punt vermell» / «punt verd»', en: 'Strict: only “point red” / “point green”' },
    voiceHelp: { es: 'También: «deshacer», «marcador», «pausa». Funciona en Chrome con conexión. El micro se pausa mientras Bolo habla.', ca: 'També: «desfés», «marcador», «pausa». Funciona a Chrome amb connexió. El micro es pausa mentre en Bolo parla.', en: 'Also: “undo”, “score”, “pause”. Works in Chrome with a connection. The mic pauses while Bolo talks.' },
    noVoice: { es: 'Este navegador no reconoce la voz. Usa Chrome para el control por voz.', ca: 'Aquest navegador no reconeix la veu. Fes servir Chrome per al control per veu.', en: 'This browser has no speech recognition. Use Chrome for voice control.' },
    start: { es: '¡A jugar!', ca: 'A jugar!', en: 'Play!' },
    settings: { es: 'Ajustes', ca: 'Ajustos', en: 'Settings' },
    settingsHelp: { es: 'Las reglas de tus partidos. Se guardan al momento y se usan en cada partido nuevo.', ca: 'Les regles dels teus partits. Es desen al moment i s’usen a cada partit nou.', en: 'The rules for your matches. Saved straight away and used for every new match.' },
    saved: { es: 'Guardado', ca: 'Desat', en: 'Saved' },
    remoteLegend: { es: 'Mando', ca: 'Comandament', en: 'Remote' },
    remote: { es: 'Pulsera o mando Bluetooth', ca: 'Polsera o comandament Bluetooth', en: 'Band or Bluetooth remote' },
    remoteHelp: { es: 'Con los botones de música de la pulsera (Mi Band, reloj o auriculares): ⏮ punto rojo, ⏭ punto verde, ⏯ deshacer. Un mando o teclado Bluetooth: ← rojo, → verde, ↑ o ↓ deshacer. Necesita Mi Fitness con acceso a notificaciones. El marcador sale en la pulsera como si fuera una canción.', ca: 'Amb els botons de música de la polsera (Mi Band, rellotge o auriculars): ⏮ punt vermell, ⏭ punt verd, ⏯ desfer. Un comandament o teclat Bluetooth: ← vermell, → verd, ↑ o ↓ desfer. Necessita Mi Fitness amb accés a les notificacions. El marcador surt a la polsera com si fos una cançó.', en: 'With the band’s music buttons (Mi Band, watch or headphones): ⏮ point red, ⏭ point green, ⏯ undo. A Bluetooth remote or keyboard: ← red, → green, ↑ or ↓ undo. Needs Mi Fitness with notification access. The score shows on the band like a song.' },
    micTest: { es: 'Probar micrófono', ca: 'Provar micròfon', en: 'Test microphone' },
    micTestHelp: { es: 'Pide el permiso y escucha 6 segundos. Di «rojo».', ca: 'Demana el permís i escolta 6 segons. Digues «vermell».', en: 'Asks for permission and listens for 6 seconds. Say “red”.' },
    mtBefore: { es: 'Permiso antes', ca: 'Permís abans', en: 'Permission before' },
    mtAfter: { es: 'Permiso ahora', ca: 'Permís ara', en: 'Permission now' },
    mtAccess: { es: 'Acceso al micro', ca: 'Accés al micro', en: 'Mic access' },
    mtSpeak: { es: 'Habla ahora: di «rojo»…', ca: 'Parla ara: digues «vermell»…', en: 'Speak now: say “red”…' },
    mtHeard: { es: 'Bolo oyó', ca: 'En Bolo ha sentit', en: 'Bolo heard' },
    mtNothing: { es: 'nada', ca: 'res', en: 'nothing' },
    mtRecError: { es: 'Error del reconocimiento', ca: 'Error del reconeixement', en: 'Recognition error' },
    mtOk: { es: '✅ El micrófono funciona.', ca: '✅ El micròfon funciona.', en: '✅ The microphone works.' },
    mtBlocked: { es: '⛔ Chrome tiene el micrófono bloqueado para esta web y ya no pregunta. Arréglalo así: en Chrome, toca el candado (o ⓘ) junto a la dirección → Permisos → Micrófono → Permitir (o «Restablecer permisos»). Si usas la app instalada: mantén pulsado su icono → ⓘ Información → Permisos → Micrófono → Permitir. Después vuelve a probar.', ca: '⛔ Chrome té el micròfon bloquejat per a aquest web i ja no pregunta. Arregla-ho així: a Chrome, toca el cadenat (o ⓘ) al costat de l’adreça → Permisos → Micròfon → Permet (o «Restableix els permisos»). Si fas servir l’app instal·lada: mantén premuda la icona → ⓘ Informació → Permisos → Micròfon → Permet. Després torna a provar.', en: '⛔ Chrome has blocked the microphone for this site and no longer asks. Fix it: in Chrome, tap the lock (or ⓘ) next to the address → Permissions → Microphone → Allow (or “Reset permissions”). If you use the installed app: long-press its icon → ⓘ App info → Permissions → Microphone → Allow. Then test again.' },
    mtService: { es: '⛔ Chrome deja usar el micro, pero el reconocimiento de voz no. En Android: Ajustes → Apps → Google → Permisos → Micrófono → Permitir. Después vuelve a probar.', ca: '⛔ Chrome deixa fer servir el micro, però el reconeixement de veu no. A Android: Configuració → Aplicacions → Google → Permisos → Micròfon → Permet. Després torna a provar.', en: '⛔ Chrome can use the mic, but speech recognition cannot. On Android: Settings → Apps → Google → Permissions → Microphone → Allow. Then test again.' },
    mtSilent: { es: '⚠️ Hay permiso, pero no se oyó nada. Habla más cerca o comprueba la conexión a internet.', ca: '⚠️ Hi ha permís, però no s’ha sentit res. Parla més a prop o comprova la connexió a internet.', en: '⚠️ Permission is fine, but nothing was heard. Speak closer or check the internet connection.' },
    mtOther: { es: '⚠️ Algo falló. Copia este resultado y envíalo.', ca: '⚠️ Alguna cosa ha fallat. Copia aquest resultat i envia’l.', en: '⚠️ Something failed. Copy this result and send it.' },
    mtCopy: { es: 'Copiar resultado', ca: 'Copiar resultat', en: 'Copy result' },
    mtCopied: { es: 'Copiado', ca: 'Copiat', en: 'Copied' },
    change: { es: 'Cambiar', ca: 'Canvia', en: 'Change' },
    stbShort: { es: 'Súper tie-break', ca: 'Súper tie-break', en: 'Super tie-break' },
    back: { es: '‹ Volver', ca: '‹ Torna', en: '‹ Back' },
    replaceAsk: { es: 'Hay un partido a medias. ¿Empezar uno nuevo y descartarlo?', ca: 'Hi ha un partit a mitges. Vols començar-ne un de nou i descartar-lo?', en: 'There is a match in progress. Start a new one and discard it?' },
    won: { es: 'gana', ca: 'guanya', en: 'wins' },
    drawn: { es: 'Empate', ca: 'Empat', en: 'Draw' },
    install: { es: 'Instala la app', ca: 'Instal·la l’app', en: 'Install the app' },
    installOther: { es: 'Abre el menú del navegador (⋮) y elige «Instalar aplicación».', ca: 'Obre el menú del navegador (⋮) i tria «Instal·la l’aplicació».', en: 'Open the browser menu (⋮) and choose “Install app”.' },
    padel: { es: 'Pádel', ca: 'Pàdel', en: 'Padel' },
    pingpong: { es: 'Ping pong', ca: 'Ping-pong', en: 'Ping pong' },
    sport: { es: 'Deporte', ca: 'Esport', en: 'Sport' },
    bestOf: { es: 'Partido', ca: 'Partit', en: 'Match' },
    bo6: { es: '1 juego a 6', ca: '1 joc a 6', en: '1 game to 6' },
    bo1: { es: '1 juego a 11', ca: '1 joc a 11', en: '1 game to 11' },
    bo3: { es: 'Al mejor de 3', ca: 'Al millor de 3', en: 'Best of 3' },
    bo5: { es: 'Al mejor de 5', ca: 'Al millor de 5', en: 'Best of 5' },
    ppFormat: { es: 'Juegos a 11, con 2 de diferencia. El saque cambia cada 2 puntos, y cada punto desde 10-10. Se cambia de lado tras cada juego y a los 5 puntos del último. El juego corto es a 6: saque cada punto desde 5-5 y cambio de lado a los 3.', ca: 'Jocs a 11, amb 2 de diferència. El servei canvia cada 2 punts, i cada punt des del 10-10. Es canvia de costat després de cada joc i als 5 punts de l’últim. El joc curt és a 6: servei cada punt des del 5-5 i canvi de costat als 3.', en: 'Games to 11, win by 2. Serve changes every 2 points, and every point from 10-10. Ends change after each game and at 5 points in the last one. The short game is to 6: serve every point from 5-5, change ends at 3.' },
    hello: { es: '¡Hola! Soy Bolo. ¿Echamos un partido?', ca: 'Hola! Soc en Bolo. Fem un partit?', en: 'Hi! I’m Bolo. Fancy a match?' },
    loadError: { es: 'No se han podido cargar los datos.', ca: 'No s’han pogut carregar les dades.', en: 'Couldn’t load the data.' },
  };

  const DEFAULT_SETUP = {
    mode: 'doubles', names: { red: ['', ''], blue: ['', ''] }, deuce: 'golden', superTiebreak: true,
    timeLimit: 0, firstServe: 'red', firstPlayer: { red: 0, blue: 0 }, muted: false, voiceInput: true, strict: false,
    sport: 'padel', ppMode: 'singles', ppBestOf: 3, // ping pong keeps its own format, so switching sport loses nothing
  };
  const SPORT_ICON = { padel: '🎾', pingpong: '🏓' };
  const isPP = (s) => s?.sport === 'pingpong';
  const modeOf = (s) => (isPP(s) ? s.ppMode : s.mode); // singles or doubles, for the sport in use
  // The sport colours the app (accent, Bolo's ball). A match uses its own sport while it is open.
  function applySport(sport) {
    document.documentElement.dataset.sport = sport === 'pingpong' ? 'pingpong' : 'padel';
    Bolo.sport = sport === 'pingpong' ? 'pingpong' : 'padel';
    const brand = document.querySelector('.brand span');
    if (brand) brand.innerHTML = `${sport === 'pingpong' ? 'Ping pong' : 'Padel'} <b>Score</b>`;
  }
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
    const setupNow = loadSetup();
    applySport(setupNow.sport);
    const pool = lines[isPP(setupNow) ? 'ppHello' : 'hello']?.[lang];
    const hello = pool?.length ? pool[Math.floor(Math.random() * pool.length)] : t(TEXT.hello);
    const cur = current();
    view.innerHTML = `
      <div class="sport" role="radiogroup" aria-label="${esc(t(TEXT.sport))}">
        ${['padel', 'pingpong'].map((sp) => `<button type="button" role="radio" data-sport="${sp}" aria-checked="${setupNow.sport === sp}" class="${setupNow.sport === sp ? 'on' : ''}"><span>${SPORT_ICON[sp]}</span>${esc(t(TEXT[sp]))}</button>`).join('')}
      </div>
      <section class="hero">
        <div class="bolo-wrap idle" id="heroBolo">${Bolo.svg('happy')}</div>
        <div class="bubble">${esc(hello)}</div>
      </section>
      <div class="actions">
        ${cur ? `<button class="btn go big" id="continueBtn" type="button">▶ ${esc(t(TEXT.continue))}<small>${esc(teamName(cur.setup, 'red'))} – ${esc(teamName(cur.setup, 'blue'))}</small></button>` : ''}
        <a class="btn ${cur ? 'ghost' : 'go big'}" href="#/setup">${SPORT_ICON[setupNow.sport]} ${esc(t(TEXT.newMatch))}</a>
        <a class="btn ghost small" href="#/settings">⚙️ ${esc(t(TEXT.settings))}</a>
      </div>
      <h2 class="sec">${esc(t(TEXT.history))}</h2>
      ${log.length ? `<ul class="card history">${log.map((e, i) => {
        const sets = e.sets.map((x) => (x.kind === 'stb' ? `${x.tb.red}-${x.tb.blue}` : `${x.red}-${x.blue}${x.tb ? `<sup>${Math.min(x.tb.red, x.tb.blue)}</sup>` : ''}`))
          .concat(e.endedBy !== 'score' && e.games && (e.games.red || e.games.blue) ? [`${e.games.red}-${e.games.blue}`] : []).join(' ');
        const w = e.winner === 'draw' ? `<span class="tag">${esc(t(TEXT.drawn))}</span>` : `<span class="tag c-${e.winner}">${esc(teamName(e.setup, e.winner))} ${esc(t(TEXT.won))}</span>`;
        return `<li><span class="h-date">${esc(dateFmt(e.at))} · ${e.minutes} min</span>
          <span class="h-teams">${isPP(e.setup) ? '🏓' : '🎾'} <b class="t-red">${esc(teamName(e.setup, 'red'))}</b> – <b class="t-blue">${esc(teamName(e.setup, 'blue'))}</b></span>
          <span class="h-score">${sets || '–'}</span>${w}
          ${e.heard?.length ? `<button class="btn small ghost h-heard" data-heard="${i}" type="button">🎙 ${esc(t(Match.TEXT.heard))}</button>` : ''}</li>`;
      }).join('')}</ul>` : `<p class="empty">${esc(t(isPP(setupNow) ? TEXT.noHistoryPP : TEXT.noHistory))}</p>`}`;
    view.querySelectorAll('[data-sport]').forEach((b) => b.addEventListener('click', () => {
      store.set(KEY.setup, JSON.stringify({ ...loadSetup(), sport: b.dataset.sport }));
      renderHub();
    }));
    $('heroBolo').addEventListener('click', (e) => { const m = e.currentTarget; m.classList.remove('bounce'); void m.offsetWidth; m.classList.add('bounce'); });
    $('continueBtn')?.addEventListener('click', () => { Match.unlock({ mic: !!cur.setup.voiceInput, remote: !!cur.setup.remote }); location.hash = '#/match'; });
    view.querySelectorAll('[data-heard]').forEach((b) => b.addEventListener('click', () => {
      const e = log[Number(b.dataset.heard)];
      const box = document.createElement('div');
      box.className = 'heard-modal';
      box.innerHTML = Match.heardHtml({ ...e, startedAt: e.at }, t, esc);
      box.addEventListener('click', (ev) => {
        const act = ev.target.closest('[data-act]')?.dataset.act;
        if (act === 'close-heard' || ev.target === box) box.remove();
        if (act === 'copy-heard') Match.copyHeard(ev.target.closest('button'), { ...e, startedAt: e.at });
      });
      document.body.appendChild(box);
    }));
  }

  function seg(name, value, options) {
    return `<div class="seg" role="radiogroup">${options.map(([v, label]) => `<label><input type="radio" name="${name}" value="${v}"${String(v) === String(value) ? ' checked' : ''}><span>${label}</span></label>`).join('')}</div>`;
  }
  // The match screen: only what changes from match to match (names, who serves). The rules live in Ajustes.
  function renderSetup() {
    const s = loadSetup();
    applySport(s.sport);
    const voiceOk = !!window.Voice?.supported();
    const nameInputs = (team) => [0, 1].map((i) => `<input class="name n-${team}${i ? ' p2' : ''}" name="${team}${i}" maxlength="18" autocomplete="off"
      placeholder="${esc(t(TEXT.player))} ${i + 1}" value="${esc(s.names[team][i] || '')}">`).join('');
    // "Who serves first in the team" only matters, and only shows, when both names of that team are filled in.
    const firstOf = (team) => `<div class="first-of p2" data-first="${team}"${s.names[team][0] && s.names[team][1] ? '' : ' hidden'}><span>${esc(t(TEXT.firstOf).replace('{t}', t(TEXT[team])))}</span>
      ${seg(`fp-${team}`, s.firstPlayer[team], [[0, `<span class="fp-name" data-fp="${team}0">${esc(s.names[team][0] || `${t(TEXT.player)} 1`)}</span>`], [1, `<span class="fp-name" data-fp="${team}1">${esc(s.names[team][1] || `${t(TEXT.player)} 2`)}</span>`]])}</div>`;
    view.innerHTML = `
      <a class="back" href="#/">${esc(t(TEXT.back))}</a>
      <form class="card setup" id="setupForm" data-mode="${modeOf(s)}">
        <h2>${SPORT_ICON[s.sport]} ${esc(t(TEXT[s.sport]))}</h2>
        <fieldset><legend>${esc(t(TEXT.teams))} <small class="muted">· ${esc(t(TEXT.namesOpt))}</small></legend>
          <div class="teams">
            <div class="team c-red"><h3>${esc(t(TEXT.red))}</h3>${nameInputs('red')}</div>
            <div class="team c-blue"><h3>${esc(t(TEXT.blue))}</h3>${nameInputs('blue')}</div>
          </div></fieldset>
        <fieldset><legend>${esc(t(TEXT.serve))}</legend>
          ${seg('serve', s.firstServe, [['red', `🔴 ${esc(t(TEXT.red))}`], ['blue', `🔵 ${esc(t(TEXT.blue))}`], ['random', `🎲 ${esc(t(TEXT.draw))}`]])}
          ${firstOf('red')}${firstOf('blue')}</fieldset>
        <a class="rules" href="#/settings"><span>${esc(rulesSummary(s, voiceOk))}</span><b>⚙️ ${esc(t(TEXT.change))}</b></a>
        <button class="btn go big" type="submit">${SPORT_ICON[s.sport]} ${esc(t(TEXT.start))}</button>
      </form>`;
    const form = $('setupForm');
    form.addEventListener('input', (e) => {
      const m = e.target.name?.match(/^(red|blue)([01])$/);
      if (!m) return;
      const span = form.querySelector(`[data-fp="${m[1]}${m[2]}"]`);
      if (span) span.textContent = e.target.value || `${t(TEXT.player)} ${Number(m[2]) + 1}`;
      form.querySelector(`[data-first="${m[1]}"]`).hidden = !(form.elements[`${m[1]}0`].value.trim() && form.elements[`${m[1]}1`].value.trim());
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = new FormData(form);
      if (current() && !confirm(t(TEXT.replaceAsk))) return;
      Match.unlock({ mic: voiceOk && !!s.voiceInput, remote: !!s.remote }); // inside the tap: audio, speech, wake lock, mic permission
      const serve = f.get('serve');
      const setup = {
        ...s,
        names: { red: [f.get('red0'), f.get('red1')].map((x) => String(x || '').trim()), blue: [f.get('blue0'), f.get('blue1')].map((x) => String(x || '').trim()) },
        firstServe: serve, firstPlayer: { red: Number(f.get('fp-red')) || 0, blue: Number(f.get('fp-blue')) || 0 },
      };
      store.set(KEY.setup, JSON.stringify(setup)); // names and serve are remembered for next time too
      const played = { ...setup, firstServe: serve === 'random' ? (Math.random() < 0.5 ? 'red' : 'blue') : serve };
      if (isPP(played)) Object.assign(played, { mode: played.ppMode, timeLimit: 0, // ppBestOf 6 = the short match: 1 game to 6
        bestOf: played.ppBestOf === 6 ? 1 : played.ppBestOf, points: played.ppBestOf === 6 ? 6 : 11 });
      if (!voiceOk) played.voiceInput = false;
      if (played.mode === 'singles') played.names = { red: [played.names.red[0], ''], blue: [played.names.blue[0], ''] };
      const m = { setup: played, state: Match.engine(played).init(played), stack: [], startedAt: Date.now(), pausedMs: 0, pausedAt: null, warned: [] };
      store.set(KEY.current, JSON.stringify(m));
      location.hash = '#/match';
    });
  }

  // One line under the match screen: the rules in use, with a link to Ajustes.
  function rulesSummary(s, voiceOk) {
    const icons = `${s.muted ? '🔇' : '🔊'}${voiceOk && s.voiceInput ? ' 🎙' : ''}${s.remote ? ' ⌚' : ''}${s.swapSides ? ' ↔' : ''}`;
    if (isPP(s)) return [t(s.ppMode === 'doubles' ? TEXT.doubles : TEXT.singles), t(TEXT[`bo${s.ppBestOf}`]), icons].join(' · ');
    const deuce = { golden: TEXT.golden, advantage: TEXT.advantage, star: TEXT.star }[s.deuce];
    return [t(s.mode === 'singles' ? TEXT.singles : TEXT.doubles), t(deuce), t(s.superTiebreak ? TEXT.stbShort : TEXT.fullSet),
      s.timeLimit ? `⏳ ${s.timeLimit} ${t(TEXT.min)}` : t(TEXT.noLimit),
      `${s.muted ? '🔇' : '🔊'}${voiceOk && s.voiceInput ? ' 🎙' : ''}${s.remote ? ' ⌚' : ''}${s.swapSides ? ' ↔' : ''}`].join(' · ');
  }

  // Ajustes: the default rules and voice options. Every change is saved at once and used by the next match.
  function renderSettings() {
    const s = loadSetup();
    applySport(s.sport);
    const pp = isPP(s);
    const voiceOk = !!window.Voice?.supported();
    view.innerHTML = `
      <a class="back" href="#/">${esc(t(TEXT.back))}</a>
      <form class="card setup" id="settingsForm">
        <h2>⚙️ ${esc(t(TEXT.settings))} · ${SPORT_ICON[s.sport]} ${esc(t(TEXT[s.sport]))}</h2>
        <p class="help">${esc(t(TEXT.settingsHelp))}</p>
        ${pp ? `<fieldset><legend>${esc(t(TEXT.mode))}</legend>${seg('mode', s.ppMode, [['singles', `👤 ${esc(t(TEXT.singles))}`], ['doubles', `👥 ${esc(t(TEXT.doubles))}`]])}</fieldset>
        <fieldset><legend>${esc(t(TEXT.bestOf))}</legend>
          ${seg('bestOf', s.ppBestOf, [[6, esc(t(TEXT.bo6))], [1, esc(t(TEXT.bo1))], [3, esc(t(TEXT.bo3))], [5, esc(t(TEXT.bo5))]])}
          <p class="help">${esc(t(TEXT.ppFormat))}</p></fieldset>` : `
        <fieldset><legend>${esc(t(TEXT.mode))}</legend>${seg('mode', s.mode, [['doubles', `👥 ${esc(t(TEXT.doubles))}`], ['singles', `👤 ${esc(t(TEXT.singles))}`]])}</fieldset>
        <fieldset><legend>${esc(t(TEXT.deuce))}</legend>
          ${seg('deuce', s.deuce, [['golden', esc(t(TEXT.golden))], ['advantage', esc(t(TEXT.advantage))], ['star', esc(t(TEXT.star))]])}
          <p class="help">${esc(t(TEXT.starHelp))}</p></fieldset>
        <fieldset><legend>${esc(t(TEXT.third))}</legend>
          ${seg('stb', s.superTiebreak ? 1 : 0, [[1, esc(t(TEXT.stb))], [0, esc(t(TEXT.fullSet))]])}
          <p class="help">${esc(t(TEXT.format))}</p></fieldset>
        <fieldset><legend>${esc(t(TEXT.time))}</legend>
          ${seg('time', s.timeLimit, TIMES.map((m) => [m, m ? `${m} ${esc(t(TEXT.min))}` : esc(t(TEXT.noLimit))]))}
          <p class="help">${esc(t(TEXT.timeHelp))}</p></fieldset>`}
        <fieldset><legend>${esc(t(TEXT.sidesLegend))}</legend>
          <label class="check"><input type="checkbox" name="swapSides"${s.swapSides ? ' checked' : ''}> ↔ ${esc(t(TEXT.sides))}</label>
          <p class="help">${esc(t(pp ? TEXT.sidesHelpPP : TEXT.sidesHelp))}</p></fieldset>
        <fieldset><legend>${esc(t(TEXT.voice))}</legend>
          <label class="check"><input type="checkbox" name="talk"${s.muted ? '' : ' checked'}> ${esc(t(TEXT.talk))}</label>
          ${voiceOk ? `<label class="check"><input type="checkbox" name="listen"${s.voiceInput ? ' checked' : ''}> ${esc(t(TEXT.listen))}</label>
          <label class="check sub"><input type="checkbox" name="strict"${s.strict ? ' checked' : ''}> ${esc(t(TEXT.strict))}</label>
          <p class="help">${esc(t(TEXT.voiceHelp))}</p>
          <button class="btn small" id="micTest" type="button">🎙 ${esc(t(TEXT.micTest))}</button>
          <p class="help">${esc(t(TEXT.micTestHelp))}</p>
          <div class="mictest" id="micResult" aria-live="polite" hidden></div>` : `<p class="help">${esc(t(TEXT.noVoice))}</p>`}
        </fieldset>
        <fieldset><legend>${esc(t(TEXT.remoteLegend))}</legend>
          <label class="check"><input type="checkbox" name="remote"${s.remote ? ' checked' : ''}> ⌚ ${esc(t(TEXT.remote))}</label>
          <p class="help">${esc(t(TEXT.remoteHelp))}</p></fieldset>
        <p class="saved" id="savedNote" aria-live="polite"></p>
        <a class="btn go big" href="#/setup">🎾 ${esc(t(TEXT.newMatch))}</a>
      </form>`;
    const form = $('settingsForm');
    form.addEventListener('change', () => {
      const f = new FormData(form);
      const shared = { muted: !f.get('talk'), strict: !!f.get('strict'), remote: !!f.get('remote'), swapSides: !!f.get('swapSides') };
      const next = pp ? { ...loadSetup(), ...shared, ppMode: f.get('mode'), ppBestOf: Number(f.get('bestOf')) || 3 }
        : { ...loadSetup(), ...shared, mode: f.get('mode'), deuce: f.get('deuce'), superTiebreak: f.get('stb') === '1', timeLimit: Number(f.get('time')) || 0 };
      if (voiceOk) next.voiceInput = !!f.get('listen');
      store.set(KEY.setup, JSON.stringify(next));
      $('savedNote').textContent = `✓ ${t(TEXT.saved)}`;
    });
    $('micTest')?.addEventListener('click', (e) => micTest(e.currentTarget));
  }

  // Mic check (Ajustes): permission state before, the permission request (inside the tap, so Chrome can show its
  // prompt), the state after, then 6 seconds of real recognition. Each step is shown, with the fix for what failed.
  const permState = () => (navigator.permissions?.query({ name: 'microphone' }).then((p) => p.state).catch(() => '?') || Promise.resolve('?'));
  async function micTest(btn) {
    const box = $('micResult');
    const rows = [];
    let verdict = '';
    const show = () => {
      box.hidden = false;
      box.innerHTML = `<ul>${rows.map(([k, v]) => `<li><span>${esc(k)}</span><b>${esc(v)}</b></li>`).join('')}</ul>
        ${verdict ? `<p class="verdict">${esc(verdict)}</p><button class="btn small" id="micCopy" type="button">📋 ${esc(t(TEXT.mtCopy))}</button>` : ''}`;
      $('micCopy')?.addEventListener('click', async (ev) => {
        const text = [`Padel Score v${VERSION} · ${navigator.userAgent}`, ...rows.map(([k, v]) => `${k}: ${v}`), verdict].join('\n');
        try { await navigator.clipboard.writeText(text); ev.currentTarget.textContent = `✓ ${t(TEXT.mtCopied)}`; } catch { ev.currentTarget.textContent = '✗'; }
      });
    };
    btn.disabled = true;
    const access = navigator.mediaDevices?.getUserMedia
      ? navigator.mediaDevices.getUserMedia({ audio: true }).then((st) => { st.getTracks().forEach((tr) => tr.stop()); return 'ok'; }, (err) => err?.name || 'error')
      : Promise.resolve('no getUserMedia');
    rows.push([t(TEXT.mtBefore), await permState()]); show();
    const got = await access;
    rows.push([t(TEXT.mtAccess), got], [t(TEXT.mtAfter), await permState()]); show();
    if (got !== 'ok') {
      verdict = got === 'NotAllowedError' || got === 'SecurityError' ? t(TEXT.mtBlocked) : t(TEXT.mtOther);
      show(); btn.disabled = false; return;
    }
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    const result = await new Promise((done) => {
      const rec = new R();
      let said = '', err = '';
      rec.lang = { es: 'es-ES', ca: 'ca-ES', en: 'en-GB' }[lang] || 'es-ES';
      rec.interimResults = true; rec.continuous = true;
      rec.onresult = (ev) => { said = [...ev.results].map((r) => r[0].transcript).join(' ').trim(); rows[3] = [t(TEXT.mtHeard), said]; show(); };
      rec.onerror = (ev) => { err = ev.error || 'error'; };
      rec.onend = () => { clearTimeout(timer); done({ said, err }); };
      const timer = setTimeout(() => rec.stop(), 6000);
      rows.push([t(TEXT.mtHeard), t(TEXT.mtSpeak)]); show();
      try { rec.start(); } catch (x) { err = x?.name || 'start failed'; clearTimeout(timer); done({ said, err }); }
    });
    rows[3] = [t(TEXT.mtHeard), result.said || t(TEXT.mtNothing)];
    if (result.err && result.err !== 'no-speech' && result.err !== 'aborted') rows.push([t(TEXT.mtRecError), result.err]);
    verdict = result.said ? t(TEXT.mtOk)
      : result.err === 'not-allowed' || result.err === 'service-not-allowed' ? t(TEXT.mtService)
      : !result.err || result.err === 'no-speech' || result.err === 'network' ? t(TEXT.mtSilent) : t(TEXT.mtOther);
    show(); btn.disabled = false;
  }

  function openMatch() {
    const m = readJSON(KEY.current, null);
    if (!m?.state) { location.hash = '#/'; return; }
    applySport(m.setup?.sport);
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
      const entry = { at: done.startedAt, setup: done.setup, sets: s.sets, games: s.games, winner: s.winner, endedBy: s.endedBy, minutes: Math.round(ms / 60000), heard: done.heard || [] };
      // The heard log is kept for the 10 newest matches only, to stay well inside the phone's storage.
      const next = [entry, ...log].slice(0, 100).map((e, i) => (i < 10 ? e : { ...e, heard: undefined }));
      store.set(KEY.log, JSON.stringify(next));
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
    if (reloadPending) { location.reload(); return; } // a new version arrived during the match
    closeMatch();
    logLeftover();
    if (r === 'setup') renderSetup(); else if (r === 'settings') renderSettings(); else renderHub();
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
  // Updates: the browser checks sw.js on every open, and we check again whenever the app comes back to the screen
  // (an installed app resumed from the background never reloads by itself). When a new version takes over, the
  // page reloads once to run the new code, but never in the middle of a match: it waits until you leave the scoreboard.
  let reloadPending = false;
  if ('serviceWorker' in navigator) {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').then((reg) => {
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
    }).catch(() => { /* offline cache is optional */ });
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController) return; // first install: nothing old is running
      if (match) reloadPending = true; else location.reload();
    });
  }

  fetch('data/lines.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : {})).catch(() => ({}))
    .then((l) => { lines = l; setLang(lang); });
})();
