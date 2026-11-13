// Padel Score match screen: the landscape scoreboard, taps, undo, edit panel, clock, Bolo, voice out and voice in.
// The scoring rules live in scoring.js and the command matching in voice.js. See SPEC.md § Scoreboard.
// Everything that needs a user gesture (speech, AudioContext, mic, wake lock) happens in Match.unlock(), called
// from a tap. The match is saved after every change, so a reload continues where it was.
(() => {
  const TEXT = {
    red: { es: 'Rojo', ca: 'Vermell', en: 'Red' },
    blue: { es: 'Verde', ca: 'Verd', en: 'Green' },
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
    heard: { es: 'Lo que oyó Bolo', ca: 'El que va sentir en Bolo', en: 'What Bolo heard' },
    heardKey: { es: '✅ hecho · 🔇 ignorado, Bolo hablaba · ↺ repetido · · sin orden · ⚠️ error · 👆 toque', ca: '✅ fet · 🔇 ignorat, en Bolo parlava · ↺ repetit · · sense ordre · ⚠️ error · 👆 toc', en: '✅ done · 🔇 ignored, Bolo was talking · ↺ repeat · · no command · ⚠️ error · 👆 tap' },
    voicePts: { es: 'Puntos: 🎙 voz · 👆 toque · ⌚ pulsera', ca: 'Punts: 🎙 veu · 👆 toc · ⌚ polsera', en: 'Points: 🎙 voice · 👆 tap · ⌚ band' },
    byVoice: { es: 'por voz', ca: 'per veu', en: 'by voice' },
    micShare: { es: 'Micro escuchando el {p}% del tiempo, {n} arranques', ca: 'Micro escoltant el {p}% del temps, {n} arrencades', en: 'Mic listening {p}% of the time, {n} starts' },
    heardEmpty: { es: 'Todavía no ha oído nada.', ca: 'Encara no ha sentit res.', en: 'Nothing heard yet.' },
    copy: { es: 'Copiar para enviar', ca: 'Copia per enviar', en: 'Copy to send' },
    copied: { es: 'Copiado', ca: 'Copiat', en: 'Copied' },
    micOnTap: { es: 'micro encendido', ca: 'micro encès', en: 'mic on' },
    micOffTap: { es: 'micro apagado', ca: 'micro apagat', en: 'mic off' },
    micIsOff: { es: 'Micro apagado: toca para encenderlo', ca: 'Micro apagat: toca per encendre’l', en: 'Mic off: tap to turn it on' },
    micIsOn: { es: 'Micro encendido: toca para apagarlo', ca: 'Micro encès: toca per apagar-lo', en: 'Mic on: tap to turn it off' },
    micBlocked: { es: 'Micrófono bloqueado: toca aquí para permitirlo', ca: 'Micròfon bloquejat: toca aquí per permetre’l', en: 'Microphone blocked: tap here to allow it' },
    micHow: { es: 'Si no sale la pregunta: en Chrome, toca el candado junto a la dirección → Permisos → Micrófono → Permitir. Si la app está instalada: Ajustes de Android → Apps → Chrome → Permisos → Micrófono.', ca: 'Si no surt la pregunta: a Chrome, toca el cadenat al costat de l’adreça → Permisos → Micròfon → Permet. Si l’app està instal·lada: Configuració d’Android → Aplicacions → Chrome → Permisos → Micròfon.', en: 'If no prompt appears: in Chrome, tap the lock next to the address → Permissions → Microphone → Allow. If the app is installed: Android Settings → Apps → Chrome → Permissions → Microphone.' },
    sumGame: { es: 'Juego', ca: 'Joc', en: 'Game' },
    sumSet: { es: 'Set', ca: 'Set', en: 'Set' },
    playOn: { es: '¿Seguís jugando?', ca: 'Continueu jugant?', en: 'Playing on?' },
    moreTime: { es: '+30 min', ca: '+30 min', en: '+30 min' },
    noLimit: { es: 'Sin límite', ca: 'Sense límit', en: 'No limit' },
    more: { es: 'Más opciones', ca: 'Més opcions', en: 'More options' },
    voiceOn: { es: 'Bolo habla', ca: 'En Bolo parla', en: 'Bolo talks' },
    voiceOff: { es: 'Bolo callado', ca: 'En Bolo callat', en: 'Bolo muted' },
    gamePoint: { es: 'Bola de juego', ca: 'Pilota de joc', en: 'Game point' },
    share: { es: 'Compartir', ca: 'Comparteix', en: 'Share' },
    streak: { es: '¡En racha!', ca: 'En ratxa!', en: 'On fire!' },
    noCaVoice: { es: '', ca: 'Aquest mòbil no té veu en català: en Bolo parlarà en castellà.', en: '' },
  };
  const VOICE_LANG = { es: 'es-ES', ca: 'ca-ES', en: 'en-GB' };
  // The scoring engine of a match: padel (scoring.js) or ping pong (pingpong.js). Both have the same functions.
  const engine = (setup) => (setup?.sport === 'pingpong' ? window.PingPong : window.Scoring);
  // Line icons (24×24, stroke = currentColor), drawn for this app.
  const ICON = {
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    more: '<circle cx="5" cy="12" r="1.7" fill="currentColor"/><circle cx="12" cy="12" r="1.7" fill="currentColor"/><circle cx="19" cy="12" r="1.7" fill="currentColor"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    sound: '<path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/>',
    muted: '<path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1.2"/><rect x="14" y="4" width="4" height="16" rx="1.2"/>',
    exit: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><path d="M12 18v4"/>',
  };
  const icon = (name) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name]}</svg>`;
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
  // A point heard by voice: louder and three notes, so it can be heard from the far end of the court.
  const heardSound = (team) => { const f = team === 'red' ? [660, 880, 1100] : [587, 784, 988]; f.forEach((x, i) => tone(x, 110, i * 100, 0.6)); };
  const undoSound = () => { tone(700, 90); tone(440, 140, 90); };
  // Bolo powers up (gold hair): a rising roar, a crackle, then a bright chord.
  function powerSound(delay = 250) {
    if (!audio) return;
    const t0 = audio.currentTime + delay / 1000;
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(90, t0); o.frequency.exponentialRampToValueAtTime(880, t0 + 0.6);
    g.gain.setValueAtTime(0.001, t0); g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.5); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.7);
    o.connect(g).connect(audio.destination); o.start(t0); o.stop(t0 + 0.72);
    const n = audio.createBuffer(1, audio.sampleRate * 0.25, audio.sampleRate), d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = audio.createBufferSource(), ng = audio.createGain();
    src.buffer = n; ng.gain.value = 0.3; src.connect(ng).connect(audio.destination); src.start(t0 + 0.55);
    [1047, 1319, 1568].forEach((f) => tone(f, 450, delay + 650, 0.3));
  }

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
  // Mic permission is asked with getUserMedia inside the tap: Android Chrome may refuse a first request that comes
  // from a timer, and it did (v0.3.1 never listened on Guille's phone). The stream is closed at once, because
  // speech recognition opens the mic itself and an open stream would block it.
  let micReady = null;
  function askMic() {
    if (!navigator.mediaDevices?.getUserMedia) { micReady = Promise.resolve('unknown'); return micReady; }
    micReady = navigator.mediaDevices.getUserMedia({ audio: true })
      .then((st) => { st.getTracks().forEach((tr) => tr.stop()); return 'granted'; })
      .catch((e) => (e?.name === 'NotAllowedError' || e?.name === 'SecurityError' ? 'denied' : `error ${e?.name || ''}`.trim()));
    return micReady;
  }
  // ---------- remote: band music buttons and Bluetooth clickers ----------
  // A band's music card (Mi Band via Mi Fitness, other watches, headphones) controls whatever is "playing" on the
  // phone. A silent looping track makes the match the playing media, so Chrome passes the buttons to the Media
  // Session handlers below. The track must start inside a tap (autoplay rules), and is 10 s long because Chrome
  // shows no media controls for sounds under 5 s. It is plain silence at normal volume (a muted one may be ignored).
  let remoteAudio = null;
  function silentWav(seconds = 10, rate = 8000) {
    const n = seconds * rate, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
    const str = (o, x) => [...x].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    str(0, 'RIFF'); v.setUint32(4, 36 + n, true); str(8, 'WAVEfmt '); v.setUint32(16, 16, true);
    v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true); v.setUint32(28, rate, true);
    v.setUint16(32, 1, true); v.setUint16(34, 8, true); str(36, 'data'); v.setUint32(40, n, true);
    new Uint8Array(buf, 44).fill(128); // 8-bit silence
    return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  }
  function startRemoteAudio() {
    if (!('mediaSession' in navigator)) return;
    if (!remoteAudio) {
      remoteAudio = new Audio(silentWav());
      remoteAudio.loop = true;
      remoteAudio.setAttribute('playsinline', '');
    }
    remoteAudio.play().catch(() => { /* retried on the next tap or when the page is visible */ });
  }

  // Must be called inside a tap handler. mic: also ask for the microphone. remote: start the silent track.
  function unlock({ mic = false, remote = false } = {}) {
    if (mic) askMic();
    if (remote) startRemoteAudio();
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      audio.resume?.();
    } catch { audio = null; }
    if (synth) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; synth.speak(u); }
    keepAwake();
    unlocked = true;
  }

  // ---------- heard log viewer (shared by the match screen and the history) ----------
  const OUT = { ok: '✅', quiet: '🔇', dup: '↺', none: '·', error: '⚠️', finished: '⏹' };
  const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  function heardLine(h, t) {
    if (h.tap) return `${mmss(h.s)} 👆 ${h.tap === 'undo' ? t(TEXT.undo) : t(TEXT[h.tap])}`;
    const what = h.cmd ? ` → ${h.cmd.replace('point:', '').replace('red', t(TEXT.red)).replace('blue', t(TEXT.blue))}` : '';
    return `${mmss(h.s)} ${OUT[h.out] || '·'} «${h.text}»${what}`;
  }
  // How the points were scored (m.src: one 2-letter tag per stack entry, 'vr' = voice red, 'tb' = tap blue,
  // 'br' = band red, '' = an edit) and how long the mic really listened. null when the match has no such data.
  function voiceStats(m) {
    const src = (m.src || []).filter(Boolean);
    if (!src.length) return null;
    const out = { red: { v: 0, t: 0, b: 0 }, blue: { v: 0, t: 0, b: 0 } };
    for (const x of src) out[x[1] === 'r' ? 'red' : 'blue'][x[0]]++;
    for (const team of ['red', 'blue']) { const n = out[team].v + out[team].t + out[team].b; out[team].pct = n ? Math.round((out[team].v / n) * 100) : null; }
    const dur = m.ms ?? Math.max(0, (m.finishedAt || m.pausedAt || Date.now()) - m.startedAt - (m.pausedMs || 0));
    if (m.mic && dur > 0) out.mic = { pct: Math.min(100, Math.round((m.mic.ms / dur) * 100)), starts: m.mic.starts };
    return out;
  }
  function statsLines(m, t) {
    const st = voiceStats(m);
    if (!st) return [];
    const row = (team) => `${t(TEXT[team])}: 🎙 ${st[team].v} · 👆 ${st[team].t} · ⌚ ${st[team].b}${st[team].pct === null ? '' : ` (${st[team].pct}% ${t(TEXT.byVoice)})`}`;
    return [row('red'), row('blue'), ...(st.mic ? [t(TEXT.micShare).replace('{p}', st.mic.pct).replace('{n}', st.mic.starts)] : [])];
  }
  function heardText(m, t) {
    const names = (team) => (m.setup.names?.[team] || []).filter(Boolean).join(' · ') || t(TEXT[team]);
    return [`Padel Score · ${new Date(m.startedAt || m.at).toLocaleString()} · ${names('red')} – ${names('blue')}`,
      ...statsLines(m, t), t(TEXT.heardKey), ...(m.heard || []).map((h) => heardLine(h, t))].join('\n');
  }
  function heardHtml(m, t, esc) {
    const list = m.heard || [];
    return `<div class="h-box"><h3>🎙 ${esc(t(TEXT.heard))}</h3>${statsLines(m, t).length ? `<p class="h-stats">${statsLines(m, t).map(esc).join('<br>')}</p>` : ''}<p class="h-key">${esc(t(TEXT.heardKey))}</p>
      ${list.length ? `<ol class="h-list">${list.map((h) => `<li class="${h.tap ? 'tap' : `o-${h.out}`}">${esc(heardLine(h, t))}</li>`).join('')}</ol>` : `<p>${esc(t(TEXT.heardEmpty))}</p>`}
      <div class="row"><button class="btn small" data-act="copy-heard" type="button">📋 ${esc(t(TEXT.copy))}</button>
      <button class="btn small go" data-act="close-heard" type="button">${esc(t(TEXT.close))}</button></div></div>`;
  }
  async function copyHeard(btn, m) {
    const t = (o) => (o && (o[document.documentElement.lang] ?? o.es)) || '';
    try { await navigator.clipboard.writeText(heardText(m, t)); btn.textContent = `✓ ${t(TEXT.copied)}`; } catch { btn.textContent = '✗'; }
  }

  function open(el, opts) {
    const { store, getLang, lines } = opts;
    const t = (o) => (o && (o[getLang()] ?? o.es)) || '';
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    let m = opts.match; // { setup, state, stack, startedAt, pausedMs, pausedAt, warned: [] }
    const Scoring = engine(m.setup);
    const pp = m.setup.sport === 'pingpong';
    Bolo.sport = pp ? 'pingpong' : 'padel';
    const BALL = pp ? '🏓' : '🎾';
    let lastTap = 0, listener = null, micState = 'off', flash = null, flashTimer = null, moodTimer = null, tick = null;
    let mood = 'idle', speakTimer = null, closed = false, wasGold = null, poweringUntil = 0, micSince = 0; // null: not painted yet, so no power-up on open
    const lastLine = {};
    // Effects (fx.js): what the last render showed, so only a real change rolls, and which half just scored.
    let shown = null, rollDir = 'up', pulse = null;
    const Fx = window.Fx;
    // 3 or more points in a row by the same team (from m.src, so an undo or an edit breaks or shortens it).
    function streak() {
      const src = m.src || [], last = src[src.length - 1];
      if (!last) return null;
      let n = 0;
      for (let i = src.length - 1; i >= 0 && src[i] && src[i][1] === last[1]; i--) n++;
      return n >= 3 ? { team: last[1] === 'r' ? 'red' : 'blue', n } : null;
    }

    // Each save also adds the mic's listening time so far, so the numbers are right even mid-stretch.
    const save = () => {
      if (micSince) { const now = Date.now(); m.mic.ms += now - micSince; micSince = now; }
      store.set('padel-score.current', JSON.stringify(m));
    };
    const names = (team) => (m.setup.names?.[team] || []).filter(Boolean);
    const teamLabel = (team) => (names(team).length ? names(team).join(' · ') : t(TEXT[team]));
    const serverLabel = () => { const sv = Scoring.server(m.state); return names(sv.team)[sv.player] || t(TEXT[sv.team]); };
    const startLine = () => `${line('start')} ${t(TEXT.serves).replace('{t}', serverLabel())}.`;

    // ---------- lines ----------
    function line(key, vars = {}) {
      if (pp && lines?.[`pp${key[0].toUpperCase()}${key.slice(1)}`]) key = `pp${key[0].toUpperCase()}${key.slice(1)}`; // ping pong's own lines
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
        if (!closed && !m.pausedAt) setTimeout(() => { if (!closed && !m.pausedAt && !talking) listener?.resume(); }, QUIET_MS);
      };
      u.onend = done; u.onerror = done;
      setTalking(true);
      // onend is unreliable on some phones: check after an estimate, and wait longer while it still speaks.
      // Some phones leave speaking = true forever: give up waiting at three times the estimate.
      const est = text.split(/\s+/).length * 420 + 900, deadline = Date.now() + est * 3;
      const check = () => { if (id !== speakId) return; if (synth.speaking && Date.now() < deadline) speakTimer = setTimeout(check, 400); else done(); };
      speakTimer = setTimeout(check, est);
      synth.speak(u);
    }
    let talking = false;
    const quiet = () => !!synth && !m.setup.muted && (talking || Date.now() < quietUntil);
    function setTalking(on) { talking = on; el.querySelector('.bolo-wrap')?.classList.toggle('talking', on); }
    function bubble(text) {
      const b = el.querySelector('.m-bubble');
      if (!b) return;
      b.textContent = text.replace(/([.!?] )(\p{Ll})/gu, (_, a, c) => a + c.toUpperCase()); // "Juego rojo. Seis iguales."
      b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
    }

    // ---------- clock ----------
    const elapsed = () => Math.max(0, (m.finishedAt || m.pausedAt || Date.now()) - m.startedAt - m.pausedMs);
    // At the end the screen may sleep and the mic stops (battery). Undoing out of the finish brings both back.
    const markFinished = () => {
      if (m.state.finished && !m.finishedAt) {
        m.finishedAt = m.pausedAt || Date.now();
        listener?.stop(); listener = null;
        try { wake?.release(); } catch { /* gone */ }
        wake = null;
      } else if (!m.state.finished && m.finishedAt) {
        m.finishedAt = null;
        keepAwake(); startListening();
      }
    };
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
        c.classList.toggle('long', c.textContent.length > 5);
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
    // Every undo step keeps how it was made (see voiceStats), so an undo also takes the point out of the count.
    function remember(tag = '') {
      m.stack.push(m.state);
      m.src = m.src || [];
      m.src.push(tag);
      if (m.stack.length > 600) m.stack.shift();
      if (m.src.length > 600) m.src.shift();
    }
    function addPoint(team, how = 'tap') {
      if (m.state.finished || m.pausedAt) return;
      hideSummary();
      remember(how[0] + team[0]);
      const r = Scoring.point(m.state, team);
      m.state = r.state;
      markFinished();
      save();
      if (how === 'voice') heardSound(team); else confirmSound(team);
      const ev = (e) => r.events.includes(e);
      pulse = { team, until: Date.now() + 450 };
      Fx?.buzz(ev('match') ? [80, 60, 80, 60, 220] : ev('set') ? [60, 50, 60, 50, 120] : ev('game') ? [40, 60, 40] : 25);
      if (ev('match')) { if (m.state.winner !== 'draw') Fx?.confetti(m.state.winner, 140); } else if (ev('set')) Fx?.confetti(team, 70); else if (ev('game')) Fx?.confetti(team, 28);
      react(team, r.events);
      if (!r.events.includes('match') && ['game', 'set', 'changeEnds'].some((e) => r.events.includes(e))) showSummary(r.events, team);
      render();
      let text = Scoring.call(m.state, r.events, getLang(), team);
      if (r.events.includes('match')) {
        text += `. ${line(m.state.winner === 'draw' ? 'draw' : 'finish')}`;
      } else if (r.events.includes('set')) text += `. ${line('set')}`;
      else if (streak()?.n === 5) text += `. ${line('streak')}`; // said once per streak; the flame shows from 3
      else if (r.events.includes('game') && Math.random() < 0.35) text += `. ${line('game')}`;
      speak(text);
    }
    function undo() {
      if (!m.stack.length) return;
      hideSummary();
      m.state = m.stack.pop();
      m.src?.pop();
      markFinished();
      save();
      undoSound();
      Fx?.buzz([15, 40, 15]);
      rollDir = 'down';
      setMood('sad', 900);
      render();
      speak(`${t(TEXT.undo)}. ${fullScore()}`);
    }
    // The full score, for "marcador" and after an undo.
    function fullScore() {
      const s = m.state, L = getLang();
      const n = (x) => Scoring.NUM[L]?.[x] ?? x;
      const parts = [];
      if (pp) { // "Juegos uno cero. cinco tres"
        if (s.sets.length) parts.push(`${t(TEXT.games)} ${n(s.games.red)} ${n(s.games.blue)}`);
        if (s.points.red || s.points.blue) parts.push(Scoring.call(s, [], L));
        return parts.join('. ');
      }
      if (s.sets.length) parts.push(`${t(TEXT.sets)} ${n(s.setsWon.red)} ${n(s.setsWon.blue)}`);
      if (!s.tiebreak) parts.push(`${t(TEXT.games)} ${n(s.games.red)} ${n(s.games.blue)}`);
      const call = Scoring.call(s, [], L);
      if (s.points.red || s.points.blue || s.tiebreak) parts.push(call);
      return parts.join('. ');
    }
    // Returns what happened, for the heard log.
    function command(cmd) {
      if (quiet()) return 'quiet'; // Bolo's own call ("Juego rojo") must never score
      if (m.state.finished && cmd.cmd !== 'undo') return 'finished';
      if (cmd.cmd === 'point') addPoint(cmd.team, 'voice');
      else if (cmd.cmd === 'undo') { if (!m.stack.length) return 'none'; undo(); }
      else if (cmd.cmd === 'score') speak(fullScore());
      else if (cmd.cmd === 'pause' && !m.pausedAt) pause();
      return 'ok';
    }
    // ---------- remote (band music buttons, Bluetooth clickers, keyboards) ----------
    // Left = red, right = blue, as on the screen: previous ⏮ / ← / PageUp score red, next ⏭ / → / PageDown score
    // blue, play-pause / ↓ / ↑ / Backspace undo. A remote press is never dropped as an echo (that is only for
    // the mic), but the same action twice within 400 ms counts once (some remotes send a key twice).
    const REMOTE_KEYS = {
      ArrowLeft: 'red', PageUp: 'red', MediaTrackPrevious: 'red',
      ArrowRight: 'blue', PageDown: 'blue', MediaTrackNext: 'blue',
      ArrowUp: 'undo', ArrowDown: 'undo', Backspace: 'undo', MediaPlayPause: 'undo',
    };
    let remoteLast = '', remoteAt = 0;
    function remote(action, source) {
      const now = Date.now();
      if (action === remoteLast && now - remoteAt < 400) return;
      remoteLast = action; remoteAt = now;
      let out = 'ok';
      if (m.pausedAt) out = 'none';
      else if (action === 'undo') { if (m.stack.length) undo(); else out = 'none'; }
      else if (m.state.finished) out = 'finished';
      else addPoint(action, 'band');
      heard({ text: `⌚ ${source}`, cmd: action === 'undo' ? 'undo' : `point:${action}`, out });
    }
    function onKey(e) {
      if (e.target.closest?.('input,textarea,select')) return;
      const action = REMOTE_KEYS[e.key];
      if (!action) {
        // Unknown keys are logged (once per key), so a new clicker can be mapped from the heard log.
        if (!seenKeys.has(e.key)) { seenKeys.add(e.key); heard({ text: `⌚ ${e.key}`, cmd: null, out: 'none' }); }
        return;
      }
      e.preventDefault();
      remote(action, e.key);
    }
    const seenKeys = new Set();
    const MEDIA = { previoustrack: 'red', seekbackward: 'red', nexttrack: 'blue', seekforward: 'blue', play: 'undo', pause: 'undo' };
    function remoteOn() {
      document.addEventListener('keydown', onKey);
      if (!('mediaSession' in navigator)) return;
      for (const [act, action] of Object.entries(MEDIA)) {
        try { navigator.mediaSession.setActionHandler(act, () => { remote(action, act); keepRemotePlaying(); }); } catch { /* not supported here */ }
      }
      remoteAudio?.addEventListener('pause', keepRemotePlaying);
      keepRemotePlaying();
    }
    function remoteOff() {
      document.removeEventListener('keydown', onKey);
      if (!('mediaSession' in navigator)) return;
      for (const act of Object.keys(MEDIA)) { try { navigator.mediaSession.setActionHandler(act, null); } catch { /* not supported */ } }
      remoteAudio?.removeEventListener('pause', keepRemotePlaying);
      remoteAudio?.pause();
      try { navigator.mediaSession.metadata = null; navigator.mediaSession.playbackState = 'none'; } catch { /* old browser */ }
    }
    // Bolo's voice or the mic can take the audio focus and pause the track: start it again, or the band loses us.
    function keepRemotePlaying() {
      if (closed || !m.setup.remote || !remoteAudio) return;
      try { navigator.mediaSession.playbackState = 'playing'; } catch { /* old browser */ }
      if (remoteAudio.paused) setTimeout(() => { if (!closed && remoteAudio.paused) remoteAudio.play().catch(() => {}); }, 300);
    }
    // The band shows the "song": the points as the title, games (and sets) as the artist.
    function remoteScore() {
      if (!m.setup.remote || !('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
      const s = m.state, p = Scoring.display(s);
      const sets = s.sets.map((x) => (x.kind === 'stb' ? `${x.tb.red}-${x.tb.blue}` : `${x.red}-${x.blue}`));
      let title, artist;
      if (pp) {
        title = s.finished ? (s.winner === 'draw' ? t(TEXT.draw) : t(TEXT.winner).replace('{t}', teamLabel(s.winner))) : `${p.red} - ${p.blue}`;
        artist = s.finished ? sets.join(' · ') : `${t(TEXT.games)} ${s.games.red}-${s.games.blue}`;
      } else if (s.finished) { // the winner, and every set: "6-4 · 6-7 · 10-8"
        title = s.winner === 'draw' ? t(TEXT.draw) : t(TEXT.winner).replace('{t}', teamLabel(s.winner));
        artist = [...sets, ...(s.games.red || s.games.blue ? [`${s.games.red}-${s.games.blue}`] : [])].join(' · ');
      } else {
        title = `${p.red} - ${p.blue}`;
        const now = s.tiebreak === 'stb' ? t(TEXT.stb) : `${t(TEXT.games)} ${s.games.red}-${s.games.blue}${s.tiebreak ? ` · ${t(TEXT.tb)}` : ''}`;
        artist = [s.sets.length ? `${t(TEXT.sets)} ${s.setsWon.red}-${s.setsWon.blue}` : '', now].filter(Boolean).join(' · ');
      }
      try { navigator.mediaSession.metadata = new MediaMetadata({ title, artist, album: pp ? 'Ping pong' : 'Padel Score', artwork: [{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }] }); } catch { /* ignore */ }
    }

    // ---------- the "what Bolo heard" log: phrases, what they did, and taps (a tap often means voice missed) ----------
    const HEARD_MAX = 250;
    function heard(entry) {
      m.heard = m.heard || [];
      m.heard.push({ s: Math.round(elapsed() / 1000), ...entry });
      if (m.heard.length > HEARD_MAX) m.heard.shift();
      save();
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
      // Gold hair: set point, match point, every golden point (sudden death), and the win.
      const gold = m.state.finished ? m.state.winner !== 'draw' : !!(st.red || st.blue) || Scoring.isGolden(m.state);
      const shown = m.state.finished ? 'cheer' : gold ? 'fierce' : mood;
      w.innerHTML = Bolo.svg(shown, { gold });
      w.classList.toggle('powered', gold && !m.state.finished);
      w.classList.toggle('powering', Date.now() < poweringUntil); // render() rebuilds the wrap: keep the animation on
      w.classList.toggle('onfire', !m.state.finished && !!streak());
      if (wasGold === false && gold && !m.state.finished) powerUp(w);
      wasGold = gold;
      if (lookTeam) w.style.setProperty('--look-x', lookTeam === 'red' ? '-4px' : '4px');
    }
    function powerUp(w) {
      powerSound();
      poweringUntil = Date.now() + 700;
      w.classList.add('powering');
      const f = document.createElement('div');
      f.className = 'power-flash';
      f.addEventListener('animationend', () => f.remove());
      document.body.appendChild(f);
      setTimeout(() => f.remove(), 1500); // also when animations are off
    }
    function react(team, events) {
      const w = el.querySelector('.bolo-wrap');
      setMood(events.includes('setPoint') || events.includes('matchPoint') ? 'fierce' : 'happy', 1300);
      paintBolo(team);
      if (w) { w.classList.remove('bounce'); void w.offsetWidth; w.classList.add('bounce'); }
      const tag = events.includes('match') ? null
        : events.includes('matchPoint') ? TEXT.matchPoint : events.includes('setPoint') ? TEXT.setPoint : events.includes('gamePoint') ? TEXT.gamePoint
          : events.includes('changeEnds') ? TEXT.change : events.includes('golden') ? TEXT.golden : streak() ? TEXT.streak : null;
      flash = tag ? t(tag) : null;
      clearTimeout(flashTimer);
      if (flash) flashTimer = setTimeout(() => { flash = null; render(); }, 4000);
    }

    // ---------- the big summary between games: readable from the far end of the court ----------
    let summary = null, summaryTimer = null;
    const SUMMARY_MS = 6000;
    function showSummary(events, team) {
      summary = { events, team, at: Date.now() };
      clearTimeout(summaryTimer);
      summaryTimer = setTimeout(hideSummary, SUMMARY_MS);
    }
    function hideSummary() {
      clearTimeout(summaryTimer);
      if (!summary) return;
      summary = null;
      if (!closed) render();
    }
    function summaryPanel() {
      const s = m.state, { events, team } = summary;
      const setEnd = events.includes('set'), gameEnd = events.includes('game');
      const title = setEnd || gameEnd ? `${t(setEnd ? TEXT.sumSet : TEXT.sumGame)} ${t(TEXT[team])}` : t(TEXT.change);
      const big = (x) => (setEnd ? s.setsWon[x] : gameEnd ? s.games[x] : s.points[x]);
      const label = setEnd ? t(TEXT.sets) : gameEnd ? t(TEXT.games) : pp ? t(TEXT.points) : t(TEXT.tb);
      if (pp) { // every game played so far: "11-9 · 7-11"
        const games = s.sets.map((x) => `${x.red}-${x.blue}`).join(' · ');
        return `<button class="m-sum" data-act="close-summary" type="button">
        <span class="s-title c-${team}">${esc(title)}</span>
        <span class="s-teams">${sides().map((x) => `<span class="s-team c-${x}${x === team ? ' won' : ''}"><small>${esc(teamLabel(x))}</small><b>${big(x)}</b></span>`).join('')}</span>
        <span class="s-label">${esc(label)}${games ? ` · ${esc(games)}` : ''}</span>
        ${events.includes('changeEnds') ? `<span class="s-change">⇄ ${esc(t(TEXT.change))}</span>` : ''}
        <span class="s-serve">🏓 ${esc(t(TEXT.serves).replace('{t}', serverLabel()))}</span>
      </button>`;
      }
      const done = s.sets.map((x) => (x.kind === 'stb' ? `${x.tb.red}-${x.tb.blue}` : `${x.red}-${x.blue}`)).join(' · ');
      const now = s.tiebreak ? t(s.tiebreak === 'stb' ? TEXT.stb : TEXT.tb) : '';
      return `<button class="m-sum" data-act="close-summary" type="button">
        <span class="s-title c-${team}">${esc(title)}</span>
        <span class="s-teams">${sides().map((x) => `<span class="s-team c-${x}${x === team ? ' won' : ''}"><small>${esc(teamLabel(x))}</small><b>${big(x)}</b></span>`).join('')}</span>
        <span class="s-label">${esc(label)}${done && !setEnd ? ` · ${esc(t(TEXT.sets))} ${esc(done)}` : setEnd ? ` · ${esc(done)}` : ''}${now ? ` · ${esc(now)}` : ''}</span>
        ${events.includes('changeEnds') ? `<span class="s-change">⇄ ${esc(t(TEXT.change))}</span>` : ''}
        <span class="s-serve">🎾 ${esc(t(TEXT.serves).replace('{t}', serverLabel()))}</span>
      </button>`;
    }
    // Left to right on the screen. With "swap sides" on, the teams change sides with the players at each change of ends.
    const sides = () => (m.setup.swapSides && m.state.swapped ? ['blue', 'red'] : ['red', 'blue']);

    // Time ran out but the players stay on court: open the match again with 30 more minutes, or no limit.
    function playOn(min) {
      if (!m.state.finished || m.state.endedBy !== 'time') return;
      remember();
      m.state = Scoring.reopen(m.state);
      if (m.finishedAt) m.pausedMs += Date.now() - m.finishedAt; // the time on the end screen is not play time
      markFinished();
      m.setup.timeLimit = min ? Math.ceil(elapsed() / 60000) + min : 0;
      m.warned = [];
      save(); render();
      speak(`${line('resumed')} ${fullScore()}`);
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
    let starting = false, loggedListening = false;
    function setMic(s) {
      const was = micState;
      micState = s;
      // The heard log records mic trouble, and the first time it really listens.
      if (s === 'listening' && !loggedListening) { loggedListening = true; heard({ text: 'mic on', cmd: null, out: 'ok' }); }
      if ((s === 'denied' || s === 'unsupported') && s !== was) heard({ text: `mic ${s}`, cmd: null, out: 'error' });
      const d = el.querySelector('.mic');
      if (d) { d.dataset.state = micShown(); d.title = micTitle(); }
      if ((s === 'denied') !== (was === 'denied')) render(); // show or hide the "mic blocked" help
    }
    function startListening() {
      if (!m.setup.voiceInput || m.micOff || !window.Voice?.supported() || listener || starting || m.state.finished) return;
      starting = true;
      (micReady || Promise.resolve('unknown')).then((perm) => {
        starting = false;
        if (perm.startsWith('error')) heard({ text: `mic ${perm}`, cmd: null, out: 'error' });
        if (perm === 'denied') { setMic('denied'); return; }
        if (closed || listener || m.micOff || m.state.finished || m.pausedAt) return;
        listener = Voice.listen({
          // Bolo is mid-sentence: start held, so the first recognizer starts after him (not started and aborted).
          held: talking || (!!synth?.speaking && !m.setup.muted),
          onTrace: (text) => heard({ text, cmd: null, out: 'error' }),
          lang: getLang(), strict: !!m.setup.strict, names: m.setup.names || {},
          onCommand: command,
          isQuiet: quiet,
          onHeard: (h) => heard({ text: h.text, cmd: h.cmd ? h.cmd.cmd + (h.cmd.team ? `:${h.cmd.team}` : '') : null, out: h.outcome }),
          onState: setMic,
          // Listening time and recognizer starts, for the voice numbers in the heard log (saved with the next point).
          onLive: (on) => {
            if (on && !micSince) { micSince = Date.now(); m.mic = m.mic || { ms: 0, starts: 0 }; m.mic.starts++; }
            if (!on && micSince) { m.mic.ms += Date.now() - micSince; micSince = 0; }
          },
        });
      });
    }
    // The 🎙 button turns voice control on and off for this match. A blocked mic is always a "turn on" (askMic is
    // inside the tap, so Chrome can show its prompt), and turning on always starts a fresh recognizer.
    function toggleMic(forceOn) {
      const on = forceOn || m.micOff || !m.setup.voiceInput || micState === 'denied' || micState === 'off';
      if (!on) {
        m.micOff = true; save();
        listener?.stop(); listener = null; setMic('off');
        heard({ tap: 'micOffTap' });
        render(); return;
      }
      m.micOff = false; m.setup.voiceInput = true; save();
      heard({ tap: 'micOnTap' });
      askMic().then(() => (listener ? listener.retry() : startListening()));
      render();
    }
    // The dot: 'off' (slashed) only when the player turned voice off; a mic that is still starting shows as paused.
    const micShown = () => (m.micOff || !m.setup.voiceInput ? 'off' : micState === 'off' ? 'paused' : micState);
    const micTitle = () => (m.micOff || !m.setup.voiceInput ? t(TEXT.micIsOff) : micState === 'denied' ? t(TEXT.micDenied)
      : micState === 'error' ? t(TEXT.micError) : t(TEXT.micIsOn));

    // ---------- render ----------
    function teamHalf(team) {
      const s = m.state;
      const sv = Scoring.server(s);
      const serving = !s.finished && sv.team === team;
      const svName = names(team)[sv.player];
      const pts = String(Scoring.display(s)[team]);
      const games = s.tiebreak === 'stb' ? '–' : String(s.games[team]);
      // The old number leaves and the new one comes in. The old one is drawn by CSS (data-v), so the text of
      // .h-points is always just the score.
      const was = shown?.[team];
      const roll = was && was.pts !== pts ? `<i class="r-old" data-v="${esc(was.pts)}" aria-hidden="true"></i><i class="r-new">${esc(pts)}</i>` : esc(pts);
      const sk = !s.finished && streak();
      return `<button class="half h-${team}${serving ? ' serving' : ''}${pulse?.team === team && Date.now() < pulse.until ? ' scored' : ''}" data-team="${team}" type="button" aria-label="${esc(teamLabel(team))}">
        <span class="h-name">${esc(teamLabel(team))}</span>
        <span class="h-serve${serving ? '' : ' off'}">${BALL} ${esc(serving ? svName || t(TEXT.server) : t(TEXT.server))}</span>
        <span class="h-points${pts === 'AD' ? ' adv' : ''}${rollDir === 'down' ? ' down' : ''}">${roll}</span>
        <span class="h-games"><small>${esc(t(TEXT.games))}</small> <b${was && was.games !== games ? ' class="pop"' : ''}>${games}</b></span>
        ${sk && sk.team === team ? `<span class="h-streak" aria-hidden="true">🔥 ${sk.n}</span>` : ''}
      </button>`;
    }
    function setsTable() {
      const s = m.state;
      const cols = s.sets.map((x) => (x.kind === 'stb' ? { red: x.tb.red, blue: x.tb.blue } : { red: x.red, blue: x.blue, tb: x.tb }));
      if (!cols.length) return '';
      const cell = (c, team) => `<td>${c[team]}${c.tb && c[team] < c[Scoring.other(team)] ? `<sup>${c.tb[team]}</sup>` : ''}</td>`; // 7-6⁵
      return `<table class="sets"><tr class="r">${cols.map((c) => cell(c, 'red')).join('')}</tr><tr class="b">${cols.map((c) => cell(c, 'blue')).join('')}</tr></table>`;
    }
    function badge() {
      const s = m.state;
      if (flash) return flash;
      const st = Scoring.stakes(s);
      if (st.red === 'match' || st.blue === 'match') return t(TEXT.matchPoint);
      if (st.red || st.blue) return t(pp ? TEXT.gamePoint : TEXT.setPoint);
      if (s.lastGame) return t(TEXT.lastGame);
      if (s.tiebreak) return t(s.tiebreak === 'stb' ? TEXT.stb : TEXT.tb);
      if (Scoring.isGolden(s)) return t(TEXT.golden);
      return '';
    }
    function finishPanel() {
      const s = m.state;
      const title = s.winner === 'draw' ? t(TEXT.draw) : t(TEXT.winner).replace('{t}', teamLabel(s.winner));
      const loserTb = (x) => (x.tb ? `<sup>${Math.min(x.tb.red, x.tb.blue)}</sup>` : '');
      return `<div class="m-finish c-${s.winner}">
        <div class="f-bolo bolo-wrap bounce">${Bolo.svg(s.winner === 'draw' ? 'happy' : 'cheer', { gold: s.winner !== 'draw' })}</div>
        <div class="f-text">
        <h2>${esc(title)}</h2>
        ${s.endedBy === 'time' ? `<p>${esc(t(TEXT.byTime))}</p>` : ''}
        ${s.endedBy === 'time' ? `<p class="playon">${esc(t(TEXT.playOn))}</p><div class="row"><button class="btn" data-act="more-time" data-min="30" type="button">⏳ ${esc(t(TEXT.moreTime))}</button><button class="btn" data-act="more-time" data-min="0" type="button">∞ ${esc(t(TEXT.noLimit))}</button></div>` : ''}
        <p class="final">${s.sets.map((x) => (x.kind === 'stb' ? `${x.tb.red}-${x.tb.blue}` : `${x.red}-${x.blue}${loserTb(x)}`)).concat(s.endedBy !== 'score' && (pp ? s.points.red || s.points.blue : s.games.red || s.games.blue) ? [pp ? `${s.points.red}-${s.points.blue}` : `${s.games.red}-${s.games.blue}`] : []).join(' · ')} · ${fmt(elapsed())}</p>
        ${heardButton()}
        <div class="row"><button class="btn ghost" data-act="undo" type="button">${icon('undo')} ${esc(t(TEXT.undoLast))}</button>
        ${Fx ? `<button class="btn" data-act="share" type="button">📤 ${esc(t(TEXT.share))}</button>` : ''}
        <button class="btn go" data-act="save" type="button">${esc(t(TEXT.save))}</button></div>
        </div>
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
        return `<button class="chip c-${p.team}${on ? ' on' : ''}" data-server="${p.team}" data-player="${p.player}" type="button">${BALL} ${esc(label)}</button>`;
      }).join('');
      return `<div class="m-edit" role="dialog"><div class="e-box">
        <div class="e-teams">${rows}</div>
        <p class="e-label">${esc(t(TEXT.server))}</p><div class="e-servers">${servers}</div>
        ${heardButton()}
        <div class="row"><button class="btn ghost" data-act="stop" type="button">${esc(t(TEXT.stopNow))}</button>
        <button class="btn go" data-act="close-edit" type="button">${esc(t(TEXT.close))}</button></div>
      </div></div>`;
    }

    let editing = false, showHeard = false, menuOpen = false;
    const heardButton = () => (m.setup.voiceInput || m.setup.remote ? `<button class="btn small ghost" data-act="heard" type="button">🎙 ${esc(t(TEXT.heard))} (${(m.heard || []).filter((h) => !h.tap).length})</button>` : '');
    function render() {
      if (closed) return;
      remoteScore();
      const s = m.state;
      const lim = limitMs();
      const [left, right] = sides();
      el.innerHTML = `
        <div class="board">
          ${teamHalf(left)}
          <div class="centre">
            <div class="c-top">
              <span class="m-clock${lim ? ' limit' : ''}${fmt(lim ? lim - elapsed() : elapsed()).length > 5 ? ' long' : ''}">${lim ? fmt(lim - elapsed()) : fmt(elapsed())}</span>
              ${window.Voice?.supported() ? `<button class="mic" data-act="mic" data-state="${micShown()}" title="${esc(micTitle())}" type="button" aria-label="${esc(micTitle())}" aria-pressed="${m.micOff || !m.setup.voiceInput ? 'false' : 'true'}">${icon('mic')}</button>` : ''}
            </div>
            ${setsTable()}
            <div class="m-badge">${esc(badge())}</div>
            <div class="bolo-wrap" data-act="bolo"></div>
            <div class="m-bubble" aria-live="polite"></div>
            <div class="c-tools">
              <button class="undo-big" data-act="undo" type="button" ${m.stack.length ? '' : 'disabled'} aria-label="${esc(t(TEXT.undo))}"><span>${icon('undo')}</span><small>${esc(t(TEXT.undo))}</small></button>
              <button class="more" data-act="menu" type="button" aria-expanded="${menuOpen}" aria-label="${esc(t(TEXT.more))}">${icon('more')}</button>
            ${menuOpen ? `<div class="c-menu" role="menu">
              <button data-act="edit" type="button" role="menuitem"><span>${icon('edit')}</span>${esc(t(TEXT.edit))}</button>
              <button data-act="mute" type="button" role="menuitem"><span>${icon(m.setup.muted ? 'muted' : 'sound')}</span>${esc(t(m.setup.muted ? TEXT.voiceOff : TEXT.voiceOn))}</button>
              <button data-act="pause" type="button" role="menuitem"><span>${icon('pause')}</span>${esc(t(TEXT.pause))}</button>
              <button data-act="exit" type="button" role="menuitem"><span>${icon('exit')}</span>${esc(t(TEXT.exit))}</button>
            </div>` : ''}
            </div>
            <p class="rotate-hint">↻ ${esc(t(TEXT.rotate))}</p>
          </div>
          ${teamHalf(right)}
        </div>
        ${getLang() === 'ca' && synth && voices.length && !voiceFor('ca') ? `<p class="m-note">${esc(t(TEXT.noCaVoice))}</p>` : ''}
        ${micState === 'denied' ? `<button class="m-micblocked" data-act="mic" type="button"><b>🎙 ${esc(t(TEXT.micBlocked))}</b><span>${esc(t(TEXT.micHow))}</span></button>` : ''}
        ${s.finished ? finishPanel() : ''}
        ${summary && !s.finished && !m.pausedAt ? summaryPanel() : ''}
        ${showHeard ? `<div class="m-heard">${heardHtml(m, t, esc)}</div>` : ''}
        ${editing && !s.finished ? editPanel() : ''}
        ${m.pausedAt && !s.finished ? `<button class="m-overlay" data-act="resume" type="button"><b>⏸ ${esc(t(TEXT.paused))}</b><span>${esc(t(TEXT.tapResume))}</span></button>` : ''}
        ${!unlocked ? `<button class="m-overlay" data-act="unlock" type="button"><b>${BALL}</b><span>${esc(t(m.stack.length ? TEXT.tapContinue : TEXT.tapStart))}</span></button>` : ''}`;
      paintBolo();
      const d = Scoring.display(s), g = (team) => (s.tiebreak === 'stb' ? '–' : String(s.games[team]));
      shown = { red: { pts: String(d.red), games: g('red') }, blue: { pts: String(d.blue), games: g('blue') } };
      rollDir = 'up';
    }
    // The finished match as the data of the share card (fx.js).
    function cardData() {
      const s = m.state;
      const cols = s.sets.map((x) => (x.kind === 'stb' ? { red: x.tb.red, blue: x.tb.blue } : { red: x.red, blue: x.blue }));
      const rest = pp ? s.points : s.games;
      if (s.endedBy !== 'score' && (rest.red || rest.blue)) cols.push({ red: rest.red, blue: rest.blue });
      return {
        sport: pp ? 'pingpong' : 'padel', winner: s.winner, cols, red: teamLabel('red'), blue: teamLabel('blue'),
        title: s.winner === 'draw' ? t(TEXT.draw) : t(TEXT.winner).replace('{t}', teamLabel(s.winner)),
        date: new Date(m.startedAt).toLocaleDateString(VOICE_LANG[getLang()], { day: 'numeric', month: 'short', year: 'numeric' }),
        meta: `${Math.max(1, Math.round(elapsed() / 60000))} min`,
      };
    }

    // ---------- input ----------
    el.addEventListener('pointerdown', onPointer);
    function onPointer(e) {
      const half = e.target.closest('.half');
      if (!half || editing || m.pausedAt || !unlocked) return;
      if (menuOpen) { e.preventDefault(); menuOpen = false; render(); return; } // a tap beside the open menu only closes it
      e.preventDefault();
      const now = Date.now();
      if (now - lastTap < TAP_GUARD) return;
      lastTap = now;
      addPoint(half.dataset.team);
      if (m.setup.voiceInput) heard({ tap: half.dataset.team });
    }
    el.addEventListener('click', onClick);
    function onClick(e) {
      const b = e.target.closest('[data-act],[data-adj],[data-server]');
      if (!b) return;
      if (b.dataset.adj) {
        remember();
        m.state = Scoring.adjust(m.state, b.dataset.adj, b.dataset.team, Number(b.dataset.d));
        save(); render(); return;
      }
      if (b.dataset.server) {
        remember();
        m.state = Scoring.adjust(m.state, 'server', b.dataset.server, Number(b.dataset.player));
        save(); render(); return;
      }
      const act = b.dataset.act;
      if (act === 'menu') { menuOpen = !menuOpen; render(); return; }
      if (menuOpen) menuOpen = false; // any other button closes the menu
      if (act === 'unlock') { unlock({ mic: !!m.setup.voiceInput, remote: !!m.setup.remote }); render(); startListening(); if (!m.stack.length) speak(startLine()); else speak(fullScore()); }
      else if (act === 'undo') { if (m.setup.voiceInput && m.stack.length) heard({ tap: 'undo' }); undo(); }
      // The tap that wins a game draws the summary under the finger, and that same tap's click lands on it:
      // ignore clicks in the first moment so it does not close itself.
      else if (act === 'close-summary') { if (summary && Date.now() - summary.at > 800) hideSummary(); }
      else if (act === 'more-time') playOn(Number(b.dataset.min));
      else if (act === 'share') Fx?.share(cardData());
      else if (act === 'heard') { showHeard = true; render(); }
      else if (act === 'close-heard') { showHeard = false; render(); }
      else if (act === 'copy-heard') copyHeard(b, m);
      else if (act === 'edit') { editing = true; render(); }
      else if (act === 'close-edit') { editing = false; render(); }
      else if (act === 'stop') {
        if (!confirm(t(TEXT.stopAsk))) return;
        remember(); m.state = Scoring.stop(m.state); markFinished(); editing = false; save();
        listener?.stop(); listener = null; render(); speak(Scoring.call(m.state, ['match'], getLang()));
      }
      else if (act === 'mute') { m.setup.muted = !m.setup.muted; if (m.setup.muted) synth?.cancel(); save(); render(); }
      else if (act === 'pause') pause();
      else if (act === 'resume') resume();
      else if (act === 'mic') toggleMic(b.classList.contains('m-micblocked'));
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
      if (!m.state.finished) keepAwake();
      onTick();
      if (listener && !m.pausedAt) listener.resume();
      keepRemotePlaying();
    }
    document.addEventListener('visibilitychange', onVisible);

    function close() {
      closed = true;
      clearInterval(tick);
      clearTimeout(speakTimer); clearTimeout(moodTimer); clearTimeout(flashTimer); clearTimeout(summaryTimer);
      listener?.stop(); listener = null;
      synth?.cancel();
      if (m.setup.remote) remoteOff();
      document.removeEventListener('visibilitychange', onVisible);
      el.removeEventListener('pointerdown', onPointer);
      el.removeEventListener('click', onClick);
      try { wake?.release(); } catch { /* gone */ }
      wake = null;
    }

    if (m.setup.remote) remoteOn();
    render();
    tick = setInterval(onTick, 500);
    if (unlocked) {
      startListening();
      if (!m.stack.length) speak(startLine());
      // A match just started from the Start tap: draw the court and send the ball to the server's half.
      if (!m.stack.length && Date.now() - m.startedAt < 4000) setTimeout(() => { if (!closed) Fx?.courtIntro(el, Scoring.server(m.state).team, pp ? 'pp' : ''); }, 60);
    }
    return { close, rerender: () => { listener?.setLang(getLang()); render(); } };
  }

  window.Match = { open, unlock, engine, TEXT, heardHtml, copyHeard, voiceStats };
})();
