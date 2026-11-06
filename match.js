// Padel Score match screen: the landscape scoreboard, taps, undo, edit panel, clock, Bolo, voice out and voice in.
// The scoring rules live in scoring.js and the command matching in voice.js. See SPEC.md § Scoreboard.
// Everything that needs a user gesture (speech, AudioContext, mic, wake lock) happens in Match.unlock(), called
// from a tap. The match is saved after every change, so a reload continues where it was.
(() => {
  const TEXT = {
    red: { es: 'Rojo', ca: 'Vermell', en: 'Red' },
    blue: { es: 'Azul', ca: 'Blau', en: 'Blue' },
    games: { es: 'Juegos', ca: 'Jocs', en: 'Games' },
    undo: { es: 'Deshacer', ca: 'Desfés', en: 'Undo' },
    edit: { es: 'Corregir', ca: 'Corregeix', en: 'Fix' },
    pause: { es: 'Pausa', ca: 'Pausa', en: 'Pause' },
    paused: { es: 'En pausa', ca: 'En pausa', en: 'Paused' },
    tapResume: { es: 'Toca para seguir', ca: 'Toca per continuar', en: 'Tap to resume' },
    tapStart: { es: 'Toca para empezar', ca: 'Toca per començar', en: 'Tap to start' },
    tapContinue: { es: 'Toca para continuar el partido', ca: 'Toca per continuar el partit', en: 'Tap to continue the match' },
    exit: { es: 'Salir', ca: 'Surt', en: 'Exit' },
    exitAsk: { es: '¿Salir? El partido queda guardado y puedes continuarlo.', ca: 'Vols sortir? El partit queda desat i el pots continuar.', en: 'Leave? The match is saved and you can continue it.' },
    voice: { es: 'Voz', ca: 'Veu', en: 'Voice' },
    tb: { es: 'Tie-break', ca: 'Tie-break', en: 'Tie-break' },
    stb: { es: 'Súper tie-break', ca: 'Súper tie-break', en: 'Super tie-break' },
    golden: { es: 'Punto de oro', ca: 'Punt d’or', en: 'Golden point' },
    lastGame: { es: 'Último juego', ca: 'Últim joc', en: 'Last game' },
    setPoint: { es: 'Bola de set', ca: 'Pilota de set', en: 'Set point' },
    matchPoint: { es: 'Bola de partido', ca: 'Pilota de partit', en: 'Match point' },
    change: { es: 'Cambio de campo', ca: 'Canvi de camp', en: 'Change ends' },
    rotate: { es: 'Gira el móvil para verlo mejor', ca: 'Gira el mòbil per veure-ho millor', en: 'Turn your phone sideways' },
    winner: { es: '¡Gana {t}!', ca: 'Guanya {t}!', en: '{t} wins!' },
    draw: { es: 'Empate', ca: 'Empat', en: 'Draw' },
    byTime: { es: 'Fin por tiempo', ca: 'Final per temps', en: 'Ended on time' },
    save: { es: 'Guardar y salir', ca: 'Desa i surt', en: 'Save and exit' },
    undoLast: { es: 'Deshacer el último punto', ca: 'Desfés l’últim punt', en: 'Undo the last point' },
    points: { es: 'Puntos', ca: 'Punts', en: 'Points' },
    server: { es: 'Saca', ca: 'Treu', en: 'Serving' },
    serves: { es: 'Saca {t}', ca: 'Treu {t}', en: '{t} to serve' },
    stopNow: { es: 'Terminar el partido ahora', ca: 'Acaba el partit ara', en: 'End the match now' },
    stopAsk: { es: '¿Terminar ahora? Gana quien vaya por delante.', ca: 'Vols acabar ara? Guanya qui vagi per davant.', en: 'End now? Whoever is ahead wins.' },
    close: { es: 'Listo', ca: 'Fet', en: 'Done' },
    player: { es: 'Jugador', ca: 'Jugador', en: 'Player' },
    micDenied: { es: 'Sin permiso de micrófono', ca: 'Sense permís de micròfon', en: 'No microphone permission' },
    micError: { es: 'Micro sin conexión. Toca para reintentar', ca: 'Micro sense connexió. Toca per reintentar', en: 'Mic offline. Tap to retry' },
    sets: { es: 'Sets', ca: 'Sets', en: 'Sets' },
    noCaVoice: { es: '', ca: 'Aquest mòbil no té veu en català: en Bolo parlarà en castellà.', en: '' },
  };
  const VOICE_LANG = { es: 'es-ES', ca: 'ca-ES', en: 'en-GB' };
  const TAP_GUARD = 600;

  // ---------- sound (Web Audio beeps play even when the voice is muted) ----------
  let audio = null;
  function tone(freq, ms, delay = 0, vol = 0.22) {
    if (!audio) return;
    const t0 = audio.currentTime + delay / 1000;
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + ms / 1000);
    o.connect(g).connect(audio.destination);
    o.start(t0); o.stop(t0 + ms / 1000 + 0.02);
  }
  const confirmSound = (team) => (team === 'red' ? (tone(660, 90), tone(880, 120, 90)) : (tone(587, 90), tone(784, 120, 90)));
  const undoSound = () => { tone(700, 90); tone(440, 140, 90); };

  // ---------- speech ----------
  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  let voices = [];
  function loadVoices() { if (synth) voices = synth.getVoices(); }
  if (synth) { loadVoices(); synth.addEventListener?.('voiceschanged', loadVoices); }
  const voiceFor = (lang) => {
    const code = VOICE_LANG[lang];
    return voices.find((v) => v.lang === code) || voices.find((v) => v.lang?.startsWith(lang)) || null;
  };

  // ---------- wake lock ----------
  let wake = null;
  async function keepAwake() {
    try { if ('wakeLock' in navigator && !wake) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } } catch { /* not allowed now */ }
  }

  let unlocked = false;
  // Must be called inside a tap handler.
  function unlock() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      audio.resume?.();
    } catch { audio = null; }
    if (synth) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; synth.speak(u); }
    keepAwake();
    unlocked = true;
  }

  function open(el, opts) {
    const { store, getLang, lines } = opts;
    const t = (o) => (o && (o[getLang()] ?? o.es)) || '';
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    let m = opts.match; // { setup, state, stack, startedAt, pausedMs, pausedAt, warned: [] }
    let lastTap = 0, listener = null, micState = 'off', flash = null, flashTimer = null, moodTimer = null, tick = null;
    let mood = 'idle', speakTimer = null, closed = false;
    const lastLine = {};

    const save = () => store.set('padel-score.current', JSON.stringify(m));
    const names = (team) => (m.setup.names?.[team] || []).filter(Boolean);
    const teamLabel = (team) => (names(team).length ? names(team).join(' · ') : t(TEXT[team]));
    const serverLabel = () => { const sv = Scoring.server(m.state); return names(sv.team)[sv.player] || t(TEXT[sv.team]); };
    const startLine = () => `${line('start')} ${t(TEXT.serves).replace('{t}', serverLabel())}.`;

    // ---------- lines ----------
    function line(key, vars = {}) {
      const pool = lines?.[key]?.[getLang()] || lines?.[key]?.es;
      if (!pool?.length) return '';
      let i = Math.floor(Math.random() * pool.length);
      if (pool.length > 1 && i === lastLine[key]) i = (i + 1) % pool.length;
      lastLine[key] = i;
      return pool[i].replace('{n}', vars.n ?? '').replace('{team}', vars.team ?? '');
    }

    // ---------- speaking (the mic is held while Bolo talks) ----------
    // Each call gets an id: cancel() fires the old utterance's onend later, and that stale end must not reopen
    // the mic while the new call is playing. Commands heard while Bolo talks (or just after) are dropped.
    let speakId = 0, quietUntil = 0;
    const QUIET_MS = 700;
    function speak(text) {
      if (!text) return;
      bubble(text);
      if (!synth || m.setup.muted) return;
      const id = ++speakId;
      synth.cancel();
      clearTimeout(speakTimer);
      listener?.pause();
      const lang = getLang();
      const u = new SpeechSynthesisUtterance(text);
      const v = voiceFor(lang) || (lang === 'ca' ? voiceFor('es') : null);
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = VOICE_LANG[lang];
      u.rate = 1.05;
      const done = () => {
        if (id !== speakId) return; // a newer call is playing
        clearTimeout(speakTimer);
        speakId++; // later events of this utterance are stale too
        setTalking(false);
        quietUntil = Date.now() + QUIET_MS;
        if (!closed && !m.pausedAt) setTimeout(() => { if (!closed && !m.pausedAt && !synth.speaking) listener?.resume(); }, QUIET_MS);
      };
      u.onend = done; u.onerror = done;
      setTalking(true);
      // onend is unreliable on some phones: check after an estimate, and wait longer while it still speaks.
      const check = () => { if (id !== speakId) return; if (synth.speaking) speakTimer = setTimeout(check, 400); else done(); };
      speakTimer = setTimeout(check, text.split(/\s+/).length * 420 + 900);
      synth.speak(u);
    }
    const quiet = () => !!synth && !m.setup.muted && (synth.speaking || Date.now() < quietUntil);
    function setTalking(on) { el.querySelector('.bolo-wrap')?.classList.toggle('talking', on); }
    function bubble(text) {
      const b = el.querySelector('.m-bubble');
      if (!b) return;
      b.textContent = text; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
    }

    // ---------- clock ----------
    const elapsed = () => Math.max(0, (m.finishedAt || m.pausedAt || Date.now()) - m.startedAt - m.pausedMs);
    const markFinished = () => { if (m.state.finished && !m.finishedAt) m.finishedAt = m.pausedAt || Date.now(); if (!m.state.finished) m.finishedAt = null; };
    const limitMs = () => (m.setup.timeLimit || 0) * 60000;
    const fmt = (ms) => {
      const s = Math.max(0, Math.round(ms / 1000));
      const h = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
      return `${h ? `${h}:${String(mm).padStart(2, '0')}` : mm}:${String(ss).padStart(2, '0')}`;
    };
    function onTick() {
      const c = el.querySelector('.m-clock');
      const lim = limitMs();
      if (c) {
        c.textContent = lim ? fmt(lim - elapsed()) : fmt(elapsed());
        c.classList.toggle('low', !!lim && lim - elapsed() <= 60000);
      }
      if (!lim || m.state.finished || m.pausedAt) return;
      const left = lim - elapsed();
      for (const n of [5, 1]) {
        if (left <= n * 60000 && left > 0 && !m.warned.includes(n)) { m.warned.push(n); save(); speak(line('timeWarn', { n })); }
      }
      if (left <= 0 && !m.state.lastGame) {
        m.state = Scoring.timeUp(m.state); save();
        tone(440, 400); speak(line('lastGame')); render();
      }
    }

    // ---------- scoring actions ----------
    function addPoint(team) {
      if (m.state.finished || m.pausedAt) return;
      m.stack.push(m.state);
      if (m.stack.length > 600) m.stack.shift();
      const r = Scoring.point(m.state, team);
      m.state = r.state;
      markFinished();
      save();
      confirmSound(team);
      react(team, r.events);
      render();
      let text = Scoring.call(m.state, r.events, getLang(), team);
      if (r.events.includes('match')) {
        text += `. ${line(m.state.winner === 'draw' ? 'draw' : 'finish')}`;
      } else if (r.events.includes('set')) text += `. ${line('set')}`;
      else if (r.events.includes('game') && Math.random() < 0.35) text += `. ${line('game')}`;
      speak(text);
    }
    function undo() {
      if (!m.stack.length) return;
      m.state = m.stack.pop();
      markFinished();
      save();
      undoSound();
      setMood('sad', 900);
      render();
      speak(`${t(TEXT.undo)}. ${fullScore()}`);
    }
    // The full score, for "marcador" and after an undo.
    function fullScore() {
      const s = m.state, L = getLang();
      const n = (x) => Scoring.NUM[L]?.[x] ?? x;
      const parts = [];
      if (s.sets.length) parts.push(`${t(TEXT.sets)} ${n(s.setsWon.red)} ${n(s.setsWon.blue)}`);
      if (!s.tiebreak) parts.push(`${t(TEXT.games)} ${n(s.games.red)} ${n(s.games.blue)}`);
      const call = Scoring.call(s, [], L);
      if (s.points.red || s.points.blue || s.tiebreak) parts.push(call);
      return parts.join('. ');
    }
    function command(cmd) {
      if (quiet()) return; // Bolo's own call ("Juego rojo") must never score
      if (cmd.cmd === 'point') addPoint(cmd.team);
      else if (cmd.cmd === 'undo') undo();
      else if (cmd.cmd === 'score') speak(fullScore());
      else if (cmd.cmd === 'pause' && !m.pausedAt) pause();
    }

    // ---------- Bolo ----------
    function setMood(next, ms) {
      mood = next;
      clearTimeout(moodTimer);
      paintBolo();
      if (ms) moodTimer = setTimeout(() => { mood = 'idle'; paintBolo(); }, ms);
    }
    function paintBolo(lookTeam) {
      const w = el.querySelector('.bolo-wrap');
      if (!w) return;
      const st = Scoring.stakes(m.state);
      const gold = m.state.finished ? m.state.winner !== 'draw' : !!(st.red || st.blue);
      const shown = m.state.finished ? 'cheer' : mood === 'idle' && gold ? 'fierce' : mood;
      w.innerHTML = Bolo.svg(shown, { gold });
      if (lookTeam) w.style.setProperty('--look-x', lookTeam === 'red' ? '-4px' : '4px');
    }
    function react(team, events) {
      const w = el.querySelector('.bolo-wrap');
      setMood(events.includes('setPoint') || events.includes('matchPoint') ? 'fierce' : 'happy', 1300);
      paintBolo(team);
      if (w) { w.classList.remove('bounce'); void w.offsetWidth; w.classList.add('bounce'); }
      const tag = events.includes('match') ? null
        : events.includes('matchPoint') ? TEXT.matchPoint : events.includes('setPoint') ? TEXT.setPoint
          : events.includes('changeEnds') ? TEXT.change : events.includes('golden') ? TEXT.golden : null;
      flash = tag ? t(tag) : null;
      clearTimeout(flashTimer);
      if (flash) flashTimer = setTimeout(() => { flash = null; render(); }, 4000);
    }

    // ---------- pause / exit ----------
    function pause() {
      if (m.pausedAt) return;
      m.pausedAt = Date.now(); save();
      listener?.stop(); listener = null;
      speak(line('paused'));
      render();
    }
    function resume() {
      if (!m.pausedAt) return;
      m.pausedMs += Date.now() - m.pausedAt; m.pausedAt = null; save();
      startListening();
      speak(line('resumed'));
      render();
    }
    function startListening() {
      if (!m.setup.voiceInput || !window.Voice?.supported() || listener || m.state.finished) return;
      listener = Voice.listen({
        lang: getLang(), strict: !!m.setup.strict, names: m.setup.names || {},
        onCommand: command,
        onState: (s) => { micState = s; const d = el.querySelector('.mic'); if (d) { d.dataset.state = s; d.title = micTitle(); } },
      });
    }
    const micTitle = () => (micState === 'denied' ? t(TEXT.micDenied) : micState === 'error' ? t(TEXT.micError) : t(TEXT.voice));

    // ---------- render ----------
    function teamHalf(team) {
      const s = m.state;
      const sv = Scoring.server(s);
      const serving = !s.finished && sv.team === team;
      const svName = names(team)[sv.player];
      const pts = Scoring.display(s)[team];
      return `<button class="half h-${team}" data-team="${team}" type="button" aria-label="${esc(teamLabel(team))}">
        <span class="h-name">${esc(teamLabel(team))}</span>
        <span class="h-serve">${serving ? `🎾 ${esc(svName || t(TEXT.server))}` : '&nbsp;'}</span>
        <span class="h-points${pts === 'AD' ? ' adv' : ''}">${esc(pts)}</span>
        <span class="h-games"><small>${esc(t(TEXT.games))}</small> <b>${s.tiebreak === 'stb' ? '–' : s.games[team]}</b></span>
      </button>`;
    }
    function setsTable() {
      const s = m.state;
      const cols = s.sets.map((x) => (x.kind === 'stb' ? { red: x.tb.red, blue: x.tb.blue } : { red: x.red, blue: x.blue, tb: x.tb }));
      if (!cols.length) return '';
      const cell = (c, team) => `<td>${c[team]}${c.tb ? `<sup>${c.tb[team]}</sup>` : ''}</td>`;
      return `<table class="sets"><tr class="r">${cols.map((c) => cell(c, 'red')).join('')}</tr><tr class="b">${cols.map((c) => cell(c, 'blue')).join('')}</tr></table>`;
    }
    function badge() {
      const s = m.state;
      if (flash) return flash;
      if (s.lastGame) return t(TEXT.lastGame);
      if (s.tiebreak) return t(s.tiebreak === 'stb' ? TEXT.stb : TEXT.tb);
      if (!s.tiebreak && s.points.red === 3 && s.points.blue === 3 && s.deuces >= ({ golden: 1, star: 3 }[s.config.deuce] || Infinity)) return t(TEXT.golden);
      return '';
    }
    function finishPanel() {
      const s = m.state;
      const title = s.winner === 'draw' ? t(TEXT.draw) : t(TEXT.winner).replace('{t}', teamLabel(s.winner));
      return `<div class="m-finish c-${s.winner}">
        <h2>${esc(title)}</h2>
        ${s.endedBy === 'time' ? `<p>${esc(t(TEXT.byTime))}</p>` : ''}
        <p class="final">${s.sets.map((x) => (x.kind === 'stb' ? `${x.tb.red}-${x.tb.blue}` : `${x.red}-${x.blue}`)).concat(s.endedBy !== 'score' && (s.games.red || s.games.blue) ? [`${s.games.red}-${s.games.blue}`] : []).join(' · ')} · ${fmt(elapsed())}</p>
        <div class="row"><button class="btn ghost" data-act="undo" type="button">↶ ${esc(t(TEXT.undoLast))}</button>
        <button class="btn go" data-act="save" type="button">${esc(t(TEXT.save))}</button></div>
      </div>`;
    }
    function editPanel() {
      const s = m.state;
      const rows = ['red', 'blue'].map((team) => `<div class="e-team c-${team}"><h3>${esc(teamLabel(team))}</h3>
        <div class="e-row"><span>${esc(t(TEXT.points))}</span><button data-adj="points" data-team="${team}" data-d="-1" type="button">−</button><b>${Scoring.display(s)[team]}</b><button data-adj="points" data-team="${team}" data-d="1" type="button">+</button></div>
        ${s.tiebreak ? '' : `<div class="e-row"><span>${esc(t(TEXT.games))}</span><button data-adj="games" data-team="${team}" data-d="-1" type="button">−</button><b>${s.games[team]}</b><button data-adj="games" data-team="${team}" data-d="1" type="button">+</button></div>`}
      </div>`).join('');
      const sv = Scoring.server(s);
      const servers = s.order.map((p) => {
        const label = names(p.team)[p.player] || (s.config.mode === 'singles' ? t(TEXT[p.team]) : `${t(TEXT[p.team])} ${p.player + 1}`);
        const on = p.team === sv.team && p.player === sv.player;
        return `<button class="chip c-${p.team}${on ? ' on' : ''}" data-server="${p.team}" data-player="${p.player}" type="button">🎾 ${esc(label)}</button>`;
      }).join('');
      return `<div class="m-edit" role="dialog"><div class="e-box">
        <div class="e-teams">${rows}</div>
        <p class="e-label">${esc(t(TEXT.server))}</p><div class="e-servers">${servers}</div>
        <div class="row"><button class="btn ghost" data-act="stop" type="button">${esc(t(TEXT.stopNow))}</button>
        <button class="btn go" data-act="close-edit" type="button">${esc(t(TEXT.close))}</button></div>
      </div></div>`;
    }

    let editing = false;
    function render() {
      if (closed) return;
      const s = m.state;
      const lim = limitMs();
      el.innerHTML = `
        <div class="board">
          ${teamHalf('red')}
          <div class="centre">
            <div class="c-top">
              <span class="m-clock${lim ? ' limit' : ''}">${lim ? fmt(lim - elapsed()) : fmt(elapsed())}</span>
              ${m.setup.voiceInput && window.Voice?.supported() ? `<button class="mic" data-act="mic" data-state="${micState}" title="${esc(micTitle())}" type="button" aria-label="${esc(t(TEXT.voice))}">🎙</button>` : ''}
            </div>
            ${setsTable()}
            <div class="m-badge">${esc(badge())}</div>
            <div class="bolo-wrap" data-act="bolo"></div>
            <div class="m-bubble" aria-live="polite"></div>
            <div class="c-tools">
              <button class="tool" data-act="undo" type="button" ${m.stack.length ? '' : 'disabled'} aria-label="${esc(t(TEXT.undo))}">↶</button>
              <button class="tool" data-act="edit" type="button" aria-label="${esc(t(TEXT.edit))}">✏️</button>
              <button class="tool" data-act="mute" type="button" aria-label="${esc(t(TEXT.voice))}">${m.setup.muted ? '🔇' : '🔊'}</button>
              <button class="tool" data-act="pause" type="button" aria-label="${esc(t(TEXT.pause))}">⏸</button>
              <button class="tool" data-act="exit" type="button" aria-label="${esc(t(TEXT.exit))}">✕</button>
            </div>
            <p class="rotate-hint">↻ ${esc(t(TEXT.rotate))}</p>
          </div>
          ${teamHalf('blue')}
        </div>
        ${getLang() === 'ca' && synth && voices.length && !voiceFor('ca') ? `<p class="m-note">${esc(t(TEXT.noCaVoice))}</p>` : ''}
        ${s.finished ? finishPanel() : ''}
        ${editing && !s.finished ? editPanel() : ''}
        ${m.pausedAt && !s.finished ? `<button class="m-overlay" data-act="resume" type="button"><b>⏸ ${esc(t(TEXT.paused))}</b><span>${esc(t(TEXT.tapResume))}</span></button>` : ''}
        ${!unlocked ? `<button class="m-overlay" data-act="unlock" type="button"><b>🎾</b><span>${esc(t(m.stack.length ? TEXT.tapContinue : TEXT.tapStart))}</span></button>` : ''}`;
      paintBolo();
    }

    // ---------- input ----------
    el.addEventListener('pointerdown', onPointer);
    function onPointer(e) {
      const half = e.target.closest('.half');
      if (!half || editing || m.pausedAt || !unlocked) return;
      e.preventDefault();
      const now = Date.now();
      if (now - lastTap < TAP_GUARD) return;
      lastTap = now;
      addPoint(half.dataset.team);
    }
    el.addEventListener('click', onClick);
    function onClick(e) {
      const b = e.target.closest('[data-act],[data-adj],[data-server]');
      if (!b) return;
      if (b.dataset.adj) {
        m.stack.push(m.state);
        m.state = Scoring.adjust(m.state, b.dataset.adj, b.dataset.team, Number(b.dataset.d));
        save(); render(); return;
      }
      if (b.dataset.server) {
        m.stack.push(m.state);
        m.state = Scoring.adjust(m.state, 'server', b.dataset.server, Number(b.dataset.player));
        save(); render(); return;
      }
      const act = b.dataset.act;
      if (act === 'unlock') { unlock(); render(); startListening(); if (!m.stack.length) speak(startLine()); else speak(fullScore()); }
      else if (act === 'undo') undo();
      else if (act === 'edit') { editing = true; render(); }
      else if (act === 'close-edit') { editing = false; render(); }
      else if (act === 'stop') {
        if (!confirm(t(TEXT.stopAsk))) return;
        m.stack.push(m.state); m.state = Scoring.stop(m.state); markFinished(); editing = false; save();
        listener?.stop(); listener = null; render(); speak(Scoring.call(m.state, ['match'], getLang()));
      }
      else if (act === 'mute') { m.setup.muted = !m.setup.muted; if (m.setup.muted) synth?.cancel(); save(); render(); }
      else if (act === 'pause') pause();
      else if (act === 'resume') resume();
      else if (act === 'mic') listener ? listener.retry() : startListening();
      else if (act === 'bolo') { const w = el.querySelector('.bolo-wrap'); w.classList.remove('bounce'); void w.offsetWidth; w.classList.add('bounce'); speak(fullScore()); }
      else if (act === 'exit') { if (confirm(t(TEXT.exitAsk))) { close(); opts.onExit?.(); } }
      else if (act === 'save') { const done = m; close(); opts.onFinish?.(done); }
    }
    // The undo button also listens to long-press on the centre: open the edit panel.
    let pressTimer = null;
    el.addEventListener('touchstart', (e) => { if (e.target.closest('.m-badge,.sets')) pressTimer = setTimeout(() => { editing = true; render(); }, 600); }, { passive: true });
    el.addEventListener('touchend', () => clearTimeout(pressTimer));

    function onVisible() {
      if (document.visibilityState !== 'visible') return;
      keepAwake();
      onTick();
      if (listener && !m.pausedAt) listener.resume();
    }
    document.addEventListener('visibilitychange', onVisible);

    function close() {
      closed = true;
      clearInterval(tick);
      clearTimeout(speakTimer); clearTimeout(moodTimer); clearTimeout(flashTimer);
      listener?.stop(); listener = null;
      synth?.cancel();
      document.removeEventListener('visibilitychange', onVisible);
      el.removeEventListener('pointerdown', onPointer);
      el.removeEventListener('click', onClick);
      try { wake?.release(); } catch { /* gone */ }
      wake = null;
    }

    render();
    tick = setInterval(onTick, 500);
    if (unlocked) {
      startListening();
      if (!m.stack.length) speak(startLine());
    }
    return { close, rerender: () => { listener?.setLang(getLang()); render(); } };
  }

  window.Match = { open, unlock, TEXT };
})();
